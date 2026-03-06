package cmd

import (
	"net/http"
	"net/url"

	"github.com/spf13/cobra"
)

var frameworksListPage paginationFlags

var frameworksListCmd = &cobra.Command{
	Use:   "list",
	Short: "List frameworks",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		frameworksListPage.apply(query)
		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/frameworks", query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var frameworkID string

var frameworksGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a framework by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/frameworks/" + url.PathEscape(frameworkID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var frameworksControlsPage paginationFlags

var frameworksListControlsCmd = &cobra.Command{
	Use:   "list-controls",
	Short: "List controls for a framework",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		frameworksControlsPage.apply(query)
		path := "/frameworks/" + url.PathEscape(frameworkID) + "/controls"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

func init() {
	frameworksCmd.AddCommand(frameworksListCmd)
	frameworksListCmd.Flags().IntVar(&frameworksListPage.pageSize, "page-size", 0, "Number of results to return")
	frameworksListCmd.Flags().StringVar(&frameworksListPage.pageCursor, "page-cursor", "", "Pagination cursor")

	frameworksCmd.AddCommand(frameworksGetCmd)
	frameworksGetCmd.Flags().StringVar(&frameworkID, "id", "", "Framework ID")
	_ = frameworksGetCmd.MarkFlagRequired("id")

	frameworksCmd.AddCommand(frameworksListControlsCmd)
	frameworksListControlsCmd.Flags().StringVar(&frameworkID, "id", "", "Framework ID")
	frameworksListControlsCmd.Flags().IntVar(&frameworksControlsPage.pageSize, "page-size", 0, "Number of results to return")
	frameworksListControlsCmd.Flags().StringVar(&frameworksControlsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = frameworksListControlsCmd.MarkFlagRequired("id")
}
