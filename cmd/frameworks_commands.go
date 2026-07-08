package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
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

		params := vantaapi.ListFrameworksParams{}
		if frameworksListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(frameworksListPage.pageSize))
		}
		if cursor := strings.TrimSpace(frameworksListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListFrameworks(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		resp, err := client.ogen.GetFramework(
			cmd.Context(),
			vantaapi.GetFrameworkParams{FrameworkId: frameworkID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		params := vantaapi.ListControlsForFrameworkParams{
			FrameworkId: frameworkID,
		}
		if frameworksControlsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(frameworksControlsPage.pageSize))
		}
		if cursor := strings.TrimSpace(frameworksControlsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListControlsForFramework(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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
