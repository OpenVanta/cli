package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
	toon "github.com/toon-format/toon-go"
)

const (
	defaultAPIBase = "https://api.vanta.com/v1"

	outputFormatPretty = "pretty"
	outputFormatJSON   = "json"
	outputFormatTOON   = "toon"
)

func userAgent() string {
	return "vanta-cli/" + Version
}

type apiClient struct {
	dryRun  bool
	verbose bool
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

	req.Header.Set("User-Agent", userAgent())
	if t.dryRun {
		fmt.Fprintf(t.cmd.OutOrStdout(), "DRY RUN %s %s\n", req.Method, req.URL.String())
		if req.Body != nil {
			if strings.HasPrefix(req.Header.Get("Content-Type"), "multipart/form-data") {
				fmt.Fprintln(t.cmd.OutOrStdout(), "<multipart/form-data omitted>")
			} else {
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
		dryRun:  dryRunFlag,
		verbose: verboseFlag,
	}
	baseURL := strings.TrimRight(base, "/")

	ogenHTTPClient := &http.Client{
		Transport: &generatedClientTransport{
			base:    http.DefaultTransport,
			cmd:     cmd,
			verbose: client.verbose,
			dryRun:  client.dryRun,
		},
	}

	ogenClient, err := vantaapi.NewClient(
		baseURL,
		staticBearerSecuritySource{token: token},
		vantaapi.WithClient(ogenHTTPClient),
	)
	if err != nil {
		return nil, fmt.Errorf("init generated api client: %w", err)
	}
	client.ogen = ogenClient

	return client, nil
}

func printJSON(cmd *cobra.Command, raw []byte) error {
	if len(raw) == 0 {
		fmt.Fprintln(cmd.OutOrStdout(), "No response body.")
		return nil
	}

	normalized := unwrapResultsData(raw)

	switch resolvedOutputFormat(cmd) {
	case outputFormatTOON:
		return printTOON(cmd, normalized)
	case outputFormatJSON:
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

func resolvedOutputFormat(cmd *cobra.Command) string {
	if agentModeEnabled(cmd) {
		return outputFormatTOON
	}
	if !prettyFlag {
		return outputFormatJSON
	}
	return outputFormatPretty
}

func printTOON(cmd *cobra.Command, normalized []byte) error {
	var val any
	if err := json.Unmarshal(normalized, &val); err != nil {
		fmt.Fprintln(cmd.OutOrStdout(), string(normalized))
		return nil
	}

	toonRaw, err := toon.Marshal(val)
	if err != nil {
		return fmt.Errorf("format toon: %w", err)
	}
	if len(toonRaw) == 0 {
		return nil
	}
	if !bytes.HasSuffix(toonRaw, []byte("\n")) {
		toonRaw = append(toonRaw, '\n')
	}

	if _, err := cmd.OutOrStdout().Write(toonRaw); err != nil {
		return fmt.Errorf("write toon output: %w", err)
	}
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
