package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/spf13/cobra"
)

const defaultAPIBase = "https://api.vanta.com/v1"

type apiClient struct {
	baseURL string
	token   string
	dryRun  bool
	verbose bool
	http    *http.Client
}

func newAPIClient(cmd *cobra.Command) (*apiClient, error) {
	base := strings.TrimSpace(apiBaseFlag)
	if base == "" {
		base = defaultAPIBase
	}

	token, err := resolveAccessToken(base)
	if err != nil {
		if dryRunFlag {
			token = "<dry-run>"
		} else {
			return nil, fmt.Errorf("resolve access token: %w", err)
		}
	}

	return &apiClient{
		baseURL: strings.TrimRight(base, "/"),
		token:   token,
		dryRun:  dryRunFlag,
		verbose: verboseFlag,
		http:    &http.Client{},
	}, nil
}

func (c *apiClient) request(cmd *cobra.Command, method, path string, body []byte) ([]byte, error) {
	return c.requestWithQuery(cmd, method, path, nil, body)
}

func (c *apiClient) requestWithQuery(cmd *cobra.Command, method, path string, query url.Values, body []byte) ([]byte, error) {
	url := c.baseURL + path
	if len(query) > 0 {
		url += "?" + query.Encode()
	}

	if c.dryRun {
		fmt.Fprintf(cmd.OutOrStdout(), "DRY RUN %s %s\n", method, url)
		if len(body) > 0 {
			fmt.Fprintf(cmd.OutOrStdout(), "%s\n", body)
		}
		return nil, nil
	}

	if c.verbose {
		fmt.Fprintf(cmd.ErrOrStderr(), "-> %s %s\n", method, url)
	}

	req, err := http.NewRequestWithContext(cmd.Context(), method, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)
	if len(body) > 0 {
		req.Header.Set("Content-Type", "application/json")
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

func printJSON(cmd *cobra.Command, raw []byte) error {
	if len(raw) == 0 {
		fmt.Fprintln(cmd.OutOrStdout(), "{}")
		return nil
	}

	if !prettyFlag {
		fmt.Fprintln(cmd.OutOrStdout(), string(raw))
		return nil
	}

	var val any
	if err := json.Unmarshal(raw, &val); err != nil {
		fmt.Fprintln(cmd.OutOrStdout(), string(raw))
		return nil
	}

	prettyRaw, err := json.MarshalIndent(val, "", "  ")
	if err != nil {
		return fmt.Errorf("format json: %w", err)
	}

	fmt.Fprintln(cmd.OutOrStdout(), string(prettyRaw))
	return nil
}
