package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	customerTrustAccountsListPage                  paginationFlags
	customerTrustAccountsListSearchString          string
	customerTrustAccountsListIsAutoApprovalEnabled string
	customerTrustAccountsListCustomFieldsFilter    string
)

var customerTrustListAccountsCmd = &cobra.Command{
	Use:   "list-accounts",
	Short: "List Customer Trust accounts",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListCustomerTrustAccountsParams{}
		if customerTrustAccountsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(customerTrustAccountsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(customerTrustAccountsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if search := strings.TrimSpace(customerTrustAccountsListSearchString); search != "" {
			params.SearchString.SetTo(search)
		}
		if err := setOptionalBoolOpt(
			&params.IsAutoApprovalEnabled,
			customerTrustAccountsListIsAutoApprovalEnabled,
			"is-auto-approval-enabled",
		); err != nil {
			return err
		}
		if filter := strings.TrimSpace(customerTrustAccountsListCustomFieldsFilter); filter != "" {
			params.CustomFieldsFilter.SetTo(filter)
		}

		resp, err := client.ogen.ListCustomerTrustAccounts(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustGetAccountID string

var customerTrustGetAccountCmd = &cobra.Command{
	Use:   "get-account",
	Short: "Get a Customer Trust account by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetCustomerTrustAccount(
			cmd.Context(),
			vantaapi.GetCustomerTrustAccountParams{AccountId: customerTrustGetAccountID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustCreateAccountJSON string
	customerTrustCreateAccountFile string
)

var customerTrustCreateAccountCmd = &cobra.Command{
	Use:   "create-account",
	Short: "Create a Customer Trust account",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustCreateAccountJSON, customerTrustCreateAccountFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateCustomerTrustAccountInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateCustomerTrustAccount(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustUpdateAccountID   string
	customerTrustUpdateAccountJSON string
	customerTrustUpdateAccountFile string
)

var customerTrustUpdateAccountCmd = &cobra.Command{
	Use:   "update-account",
	Short: "Update a Customer Trust account",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustUpdateAccountJSON, customerTrustUpdateAccountFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.EditCustomerTrustAccountInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateCustomerTrustAccount(
			cmd.Context(),
			req,
			vantaapi.UpdateCustomerTrustAccountParams{AccountId: customerTrustUpdateAccountID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustDeleteAccountID string

var customerTrustDeleteAccountCmd = &cobra.Command{
	Use:   "delete-account",
	Short: "Delete a Customer Trust account",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteCustomerTrustAccount(
			cmd.Context(),
			vantaapi.DeleteCustomerTrustAccountParams{AccountId: customerTrustDeleteAccountID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	customerTrustCmd.AddCommand(customerTrustListAccountsCmd)
	customerTrustListAccountsCmd.Flags().IntVar(&customerTrustAccountsListPage.pageSize, "page-size", 0, "Number of results to return")
	customerTrustListAccountsCmd.Flags().StringVar(&customerTrustAccountsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	customerTrustListAccountsCmd.Flags().StringVar(&customerTrustAccountsListSearchString, "search-string", "", "Search string filter (matches account name or email domain)")
	customerTrustListAccountsCmd.Flags().StringVar(&customerTrustAccountsListIsAutoApprovalEnabled, "is-auto-approval-enabled", "", "Filter accounts by auto-approval status (true|false)")
	customerTrustListAccountsCmd.Flags().StringVar(&customerTrustAccountsListCustomFieldsFilter, "custom-fields-filter", "", `JSON-encoded array of {"label","value"} filters, e.g. '[{"label":"enterprise_id","value":["ent_123"]}]'`)

	customerTrustCmd.AddCommand(customerTrustGetAccountCmd)
	customerTrustGetAccountCmd.Flags().StringVar(&customerTrustGetAccountID, "id", "", "Customer Trust account ID")
	_ = customerTrustGetAccountCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustCreateAccountCmd)
	customerTrustCreateAccountCmd.Flags().StringVar(&customerTrustCreateAccountJSON, "json", "", "Raw JSON payload")
	customerTrustCreateAccountCmd.Flags().StringVar(&customerTrustCreateAccountFile, "file", "", "Path to JSON payload file")

	customerTrustCmd.AddCommand(customerTrustUpdateAccountCmd)
	customerTrustUpdateAccountCmd.Flags().StringVar(&customerTrustUpdateAccountID, "id", "", "Customer Trust account ID")
	customerTrustUpdateAccountCmd.Flags().StringVar(&customerTrustUpdateAccountJSON, "json", "", "Raw JSON payload")
	customerTrustUpdateAccountCmd.Flags().StringVar(&customerTrustUpdateAccountFile, "file", "", "Path to JSON payload file")
	_ = customerTrustUpdateAccountCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustDeleteAccountCmd)
	customerTrustDeleteAccountCmd.Flags().StringVar(&customerTrustDeleteAccountID, "id", "", "Customer Trust account ID")
	_ = customerTrustDeleteAccountCmd.MarkFlagRequired("id")
}
