package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var vendorRiskAttributesListPage paginationFlags

var vendorRiskAttributesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List vendor risk attributes",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListVendorRiskAttributesParams{}
		if vendorRiskAttributesListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorRiskAttributesListPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorRiskAttributesListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListVendorRiskAttributes(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	vendorRiskAttributesCmd.AddCommand(vendorRiskAttributesListCmd)
	vendorRiskAttributesListCmd.Flags().IntVar(&vendorRiskAttributesListPage.pageSize, "page-size", 0, "Number of results to return")
	vendorRiskAttributesListCmd.Flags().StringVar(&vendorRiskAttributesListPage.pageCursor, "page-cursor", "", "Pagination cursor")
}
