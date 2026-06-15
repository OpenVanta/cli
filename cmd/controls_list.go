package cmd

import (
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
		frameworkMatchesAny := make([]string, 0, len(controlsListFrameworkMatch))
		for _, framework := range controlsListFrameworkMatch {
			if framework != "" {
				query.Add("frameworkMatchesAny", framework)
				frameworkMatchesAny = append(frameworkMatchesAny, framework)
			}
		}

		if client.dryRun {
			resp, err := client.requestWithQuery(cmd, http.MethodGet, "/controls", query, nil)
			if err != nil {
				return err
			}
			return printJSON(cmd, resp)
		}

		params := vantaapi.ListControlsParams{
			FrameworkMatchesAny: frameworkMatchesAny,
		}
		if controlsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(controlsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(controlsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListControls(cmd.Context(), params)
		if err != nil {
			return err
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsListCmd)
	controlsListCmd.Flags().IntVar(&controlsListPage.pageSize, "page-size", 0, "Number of results to return")
	controlsListCmd.Flags().StringVar(&controlsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	controlsListCmd.Flags().StringSliceVar(&controlsListFrameworkMatch, "framework-matches-any", nil, "Framework IDs to filter by (repeatable)")
}
