package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var policiesListPage paginationFlags

var policiesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List policies",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListPoliciesParams{}
		if policiesListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(policiesListPage.pageSize))
		}
		if cursor := strings.TrimSpace(policiesListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListPolicies(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, resp)
	},
}

func init() {
	policiesCmd.AddCommand(policiesListCmd)
	policiesListCmd.Flags().IntVar(&policiesListPage.pageSize, "page-size", 0, "Number of results to return")
	policiesListCmd.Flags().StringVar(&policiesListPage.pageCursor, "page-cursor", "", "Pagination cursor")
}
