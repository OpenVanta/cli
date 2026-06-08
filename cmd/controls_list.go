package cmd

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	controlsListPage           paginationFlags
	controlsListFrameworkMatch []string
)

// controlsListCmd represents the controls list command
var controlsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List controls",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		controlsListPage.apply(query)
		var frameworkMatchesAny []string
		for _, framework := range controlsListFrameworkMatch {
			trimmed := strings.TrimSpace(framework)
			if trimmed != "" {
				query.Add("frameworkMatchesAny", trimmed)
				frameworkMatchesAny = append(frameworkMatchesAny, trimmed)
			}
		}

		var resp []byte
		if client.dryRun {
			resp, err = client.requestWithQuery(cmd, http.MethodGet, "/controls", query, nil)
			if err != nil {
				return err
			}
		} else {
			controlsClient, err := client.newControlsGeneratedClient(cmd)
			if err != nil {
				return fmt.Errorf("build generated controls client: %w", err)
			}

			params := &vantaapi.ListControlsParams{}
			if controlsListPage.pageSize > 0 {
				ps := vantaapi.PageSize(controlsListPage.pageSize)
				params.PageSize = &ps
			}
			if controlsListPage.pageCursor != "" {
				pc := vantaapi.PageCursor(controlsListPage.pageCursor)
				params.PageCursor = &pc
			}
			if len(frameworkMatchesAny) > 0 {
				params.FrameworkMatchesAny = &frameworkMatchesAny
			}

			httpResp, err := controlsClient.ListControls(cmd.Context(), params)
			if err != nil {
				return fmt.Errorf("send request: %w", err)
			}
			resp, err = client.readResponse(cmd, httpResp)
			if err != nil {
				return err
			}
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsListCmd)
	controlsListCmd.Flags().IntVar(&controlsListPage.pageSize, "page-size", 0, "Number of results to return")
	controlsListCmd.Flags().StringVar(&controlsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	controlsListCmd.Flags().StringSliceVar(&controlsListFrameworkMatch, "framework-matches-any", nil, "Framework IDs to filter by (repeatable)")
}
