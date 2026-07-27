package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	discoveredVendorsListPage  paginationFlags
	discoveredVendorsListScope string
)

var discoveredVendorsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List discovered vendors",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListDiscoveredVendorsParams{}
		if scope := strings.TrimSpace(discoveredVendorsListScope); scope != "" {
			params.Scope.SetTo(vantaapi.DiscoveredVendorScope(scope))
		}
		if discoveredVendorsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(discoveredVendorsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(discoveredVendorsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListDiscoveredVendors(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	discoveredVendorsListAccountsID   string
	discoveredVendorsListAccountsPage paginationFlags
)

var discoveredVendorsListAccountsCmd = &cobra.Command{
	Use:   "list-accounts",
	Short: "List accounts for a discovered vendor",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListDiscoveredVendorAccountsParams{
			DiscoveredVendorId: discoveredVendorsListAccountsID,
		}
		if discoveredVendorsListAccountsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(discoveredVendorsListAccountsPage.pageSize))
		}
		if cursor := strings.TrimSpace(discoveredVendorsListAccountsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListDiscoveredVendorAccounts(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var discoveredVendorsAddToManagedID string

var discoveredVendorsAddToManagedCmd = &cobra.Command{
	Use:   "add-to-managed",
	Short: "Add a discovered vendor to managed vendors",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddDiscoveredVendorToManaged(
			cmd.Context(),
			vantaapi.AddDiscoveredVendorToManagedParams{
				DiscoveredVendorId: discoveredVendorsAddToManagedID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	discoveredVendorsCmd.AddCommand(discoveredVendorsListCmd)
	discoveredVendorsListCmd.Flags().IntVar(&discoveredVendorsListPage.pageSize, "page-size", 0, "Number of results to return")
	discoveredVendorsListCmd.Flags().StringVar(&discoveredVendorsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	discoveredVendorsListCmd.Flags().StringVar(
		&discoveredVendorsListScope,
		"scope",
		"",
		"Discovered vendor scope (defaults to NEEDS_REVIEW in the API): NEEDS_REVIEW, IGNORED, REJECTED",
	)

	discoveredVendorsCmd.AddCommand(discoveredVendorsListAccountsCmd)
	discoveredVendorsListAccountsCmd.Flags().StringVar(&discoveredVendorsListAccountsID, "id", "", "Discovered vendor ID")
	discoveredVendorsListAccountsCmd.Flags().IntVar(&discoveredVendorsListAccountsPage.pageSize, "page-size", 0, "Number of results to return")
	discoveredVendorsListAccountsCmd.Flags().StringVar(&discoveredVendorsListAccountsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = discoveredVendorsListAccountsCmd.MarkFlagRequired("id")

	discoveredVendorsCmd.AddCommand(discoveredVendorsAddToManagedCmd)
	discoveredVendorsAddToManagedCmd.Flags().StringVar(&discoveredVendorsAddToManagedID, "id", "", "Discovered vendor ID")
	_ = discoveredVendorsAddToManagedCmd.MarkFlagRequired("id")
}
