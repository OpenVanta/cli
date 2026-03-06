package cmd

import (
	"net/http"
	"net/url"

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

		query := url.Values{}
		policiesListPage.apply(query)
		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/policies", query, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	policiesCmd.AddCommand(policiesListCmd)
	policiesListCmd.Flags().IntVar(&policiesListPage.pageSize, "page-size", 0, "Number of results to return")
	policiesListCmd.Flags().StringVar(&policiesListPage.pageCursor, "page-cursor", "", "Pagination cursor")
}
