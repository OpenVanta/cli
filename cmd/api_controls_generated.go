package cmd

import (
	"context"
	"fmt"
	"net/http"

	"github.com/VantaInc/hackday-cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

func (c *apiClient) newControlsGeneratedClient(cmd *cobra.Command) (*vantaapi.Client, error) {
	return vantaapi.NewClient(
		c.baseURL,
		vantaapi.WithHTTPClient(c.http),
		vantaapi.WithRequestEditorFn(func(_ context.Context, req *http.Request) error {
			req.Header.Set("Accept", "application/json")
			req.Header.Set("Authorization", "Bearer "+c.token)
			req.Header.Set("User-Agent", userAgent)
			if c.verbose {
				fmt.Fprintf(cmd.ErrOrStderr(), "-> %s %s\n", req.Method, req.URL.String())
			}
			return nil
		}),
	)
}
