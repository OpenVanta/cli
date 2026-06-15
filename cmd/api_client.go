package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

const (
	defaultAPIBase = "https://api.vanta.com/v1"
	cliVersion     = "0.1.0"
	userAgent      = "vanta-cli/" + cliVersion
)

type apiClient struct {
	baseURL string
	token   string
	dryRun  bool
	verbose bool
	http    *http.Client
	ogen    *vantaapi.Client
}

var errOgenDryRun = errors.New("ogen dry-run")

type staticBearerSecuritySource struct {
	token string
}

func (s staticBearerSecuritySource) BearerAuth(context.Context, vantaapi.OperationName) (vantaapi.BearerAuth, error) {
	return vantaapi.BearerAuth{Token: s.token}, nil
}

type generatedClientTransport struct {
	base    http.RoundTripper
	cmd     *cobra.Command
	verbose bool
	dryRun  bool
}

func (t *generatedClientTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	base := t.base
	if base == nil {
		base = http.DefaultTransport
	}

	req.Header.Set("User-Agent", userAgent)
	if t.dryRun {
		fmt.Fprintf(t.cmd.OutOrStdout(), "DRY RUN %s %s\n", req.Method, req.URL.String())
		if req.Body != nil {
			body, err := io.ReadAll(req.Body)
			if err != nil {
				return nil, fmt.Errorf("read dry-run request body: %w", err)
			}
			if len(body) > 0 {
				formattedBody := body
				var val any
				if err := json.Unmarshal(body, &val); err == nil {
					if prettyBody, err := json.MarshalIndent(val, "", "  "); err == nil {
						formattedBody = prettyBody
					}
				}
				fmt.Fprintf(t.cmd.OutOrStdout(), "%s\n", formattedBody)
			}
		}
		return nil, errOgenDryRun
	}

	if t.verbose {
		fmt.Fprintf(t.cmd.ErrOrStderr(), "-> %s %s\n", req.Method, req.URL.String())
	}

	resp, err := base.RoundTrip(req)
	if err != nil {
		return nil, err
	}

	if t.verbose {
		fmt.Fprintf(t.cmd.ErrOrStderr(), "<- %d\n", resp.StatusCode)
	}

	return resp, nil
}

func newAPIClient(cmd *cobra.Command) (*apiClient, error) {
	base, err := resolveAPIBase()
	if err != nil {
		return nil, fmt.Errorf("resolve api base: %w", err)
	}

	token, err := resolveAccessToken(base)
	if err != nil {
		if dryRunFlag {
			token = "<dry-run>"
		} else {
			return nil, fmt.Errorf("resolve access token: %w", err)
		}
	}

	client := &apiClient{
		baseURL: strings.TrimRight(base, "/"),
		token:   token,
		dryRun:  dryRunFlag,
		verbose: verboseFlag,
		http:    &http.Client{},
	}

	ogenHTTPClient := &http.Client{
		Transport: &generatedClientTransport{
			base:    http.DefaultTransport,
			cmd:     cmd,
			verbose: client.verbose,
			dryRun:  client.dryRun,
		},
	}

	ogenClient, err := vantaapi.NewClient(
		client.baseURL,
		staticBearerSecuritySource{token: client.token},
		vantaapi.WithClient(ogenHTTPClient),
	)
	if err != nil {
		return nil, fmt.Errorf("init generated api client: %w", err)
	}
	client.ogen = ogenClient

	return client, nil
}

func (c *apiClient) request(cmd *cobra.Command, method, path string, body []byte) ([]byte, error) {
	return c.requestWithQuery(cmd, method, path, nil, body)
}

func (c *apiClient) newRequest(ctx context.Context, method, url string, body io.Reader, contentType string) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("User-Agent", userAgent)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return req, nil
}

func (c *apiClient) requestWithQuery(cmd *cobra.Command, method, path string, query url.Values, body []byte) ([]byte, error) {
	url := c.baseURL + path
	if len(query) > 0 {
		url += "?" + query.Encode()
	}

	if c.dryRun {
		c.handleDryRun(cmd, method, path, query, body)
		return nil, nil
	}

	if c.verbose {
		fmt.Fprintf(cmd.ErrOrStderr(), "-> %s %s\n", method, url)
	}

	contentType := ""
	if len(body) > 0 {
		contentType = "application/json"
	}
	req, err := c.newRequest(cmd.Context(), method, url, bytes.NewReader(body), contentType)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if c.verbose {
		fmt.Fprintf(cmd.ErrOrStderr(), "<- %d\n", resp.StatusCode)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("api error (%d): %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	return respBody, nil
}

func (c *apiClient) handleDryRun(cmd *cobra.Command, method, path string, query url.Values, body []byte) bool {
	if !c.dryRun {
		return false
	}

	fullURL := c.baseURL + path
	if len(query) > 0 {
		fullURL += "?" + query.Encode()
	}

	fmt.Fprintf(cmd.OutOrStdout(), "DRY RUN %s %s\n", method, fullURL)
	if len(body) == 0 {
		return true
	}

	formattedBody := body
	var val any
	if err := json.Unmarshal(body, &val); err == nil {
		if prettyBody, err := json.MarshalIndent(val, "", "  "); err == nil {
			formattedBody = prettyBody
		}
	}
	fmt.Fprintf(cmd.OutOrStdout(), "%s\n", formattedBody)
	return true
}

func printJSON(cmd *cobra.Command, raw []byte) error {
	if len(raw) == 0 {
		fmt.Fprintln(cmd.OutOrStdout(), "No response body.")
		return nil
	}

	normalized := unwrapResultsData(raw)

	if !prettyFlag {
		fmt.Fprintln(cmd.OutOrStdout(), string(normalized))
		return nil
	}

	var val any
	if err := json.Unmarshal(normalized, &val); err != nil {
		fmt.Fprintln(cmd.OutOrStdout(), string(normalized))
		return nil
	}

	prettyRaw, err := json.MarshalIndent(val, "", "  ")
	if err != nil {
		return fmt.Errorf("format json: %w", err)
	}

	fmt.Fprintln(cmd.OutOrStdout(), string(prettyRaw))
	return nil
}

func printResponseJSON(cmd *cobra.Command, v any) error {
	if v == nil {
		return printJSON(cmd, nil)
	}

	raw, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("encode response json: %w", err)
	}
	return printJSON(cmd, raw)
}

func decodeRequestPayload[T any](payload []byte) (*T, error) {
	var req T
	if err := json.Unmarshal(payload, &req); err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}
	return &req, nil
}

func (c *apiClient) handleOgenError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, errOgenDryRun) {
		return nil
	}
	return err
}

func unwrapResultsData(raw []byte) []byte {
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return raw
	}

	resultsRaw, ok := payload["results"]
	if !ok {
		return raw
	}

	results, ok := resultsRaw.(map[string]any)
	if !ok {
		return raw
	}

	data, ok := results["data"]
	if !ok {
		return raw
	}

	normalized := map[string]any{
		"data": data,
	}
	if pageInfo, ok := results["pageInfo"]; ok {
		normalized["pageInfo"] = pageInfo
		if pageInfoMap, ok := pageInfo.(map[string]any); ok {
			if endCursor, ok := pageInfoMap["endCursor"]; ok {
				normalized["nextCursor"] = endCursor
			}
		}
	}
	if totalCount, ok := results["totalCount"]; ok {
		normalized["totalCount"] = totalCount
	}

	out, err := json.Marshal(normalized)
	if err != nil {
		return raw
	}

	return out
}
