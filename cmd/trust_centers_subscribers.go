package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	trustCentersListSubscriberGroupsID   string
	trustCentersListSubscriberGroupsPage paginationFlags
)

var trustCentersListSubscriberGroupsCmd = &cobra.Command{
	Use:   "list-subscriber-groups",
	Short: "List Trust Center subscriber groups",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterSubscriberGroupsParams{
			SlugId: trustCentersListSubscriberGroupsID,
		}
		if trustCentersListSubscriberGroupsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListSubscriberGroupsPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListSubscriberGroupsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTrustCenterSubscriberGroups(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetSubscriberGroupID      string
	trustCentersGetSubscriberGroupGroupID string
)

var trustCentersGetSubscriberGroupCmd = &cobra.Command{
	Use:   "get-subscriber-group",
	Short: "Get a Trust Center subscriber group",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterSubscriberGroup(
			cmd.Context(),
			vantaapi.GetTrustCenterSubscriberGroupParams{
				SlugId:            trustCentersGetSubscriberGroupID,
				SubscriberGroupId: trustCentersGetSubscriberGroupGroupID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateSubscriberGroupID   string
	trustCentersCreateSubscriberGroupJSON string
	trustCentersCreateSubscriberGroupFile string
)

var trustCentersCreateSubscriberGroupCmd = &cobra.Command{
	Use:   "create-subscriber-group",
	Short: "Create a Trust Center subscriber group",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersCreateSubscriberGroupJSON, trustCentersCreateSubscriberGroupFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.CreateTrustCenterSubscriberGroupInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateTrustCenterSubscriberGroup(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterSubscriberGroupParams{SlugId: trustCentersCreateSubscriberGroupID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateSubscriberGroupID      string
	trustCentersUpdateSubscriberGroupGroupID string
	trustCentersUpdateSubscriberGroupJSON    string
	trustCentersUpdateSubscriberGroupFile    string
)

var trustCentersUpdateSubscriberGroupCmd = &cobra.Command{
	Use:   "update-subscriber-group",
	Short: "Update a Trust Center subscriber group",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateSubscriberGroupJSON, trustCentersUpdateSubscriberGroupFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.EditTrustCenterSubscriberGroupInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterSubscriberGroup(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterSubscriberGroupParams{
				SlugId:            trustCentersUpdateSubscriberGroupID,
				SubscriberGroupId: trustCentersUpdateSubscriberGroupGroupID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteSubscriberGroupID      string
	trustCentersDeleteSubscriberGroupGroupID string
)

var trustCentersDeleteSubscriberGroupCmd = &cobra.Command{
	Use:   "delete-subscriber-group",
	Short: "Delete a Trust Center subscriber group",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterSubscriberGroup(
			cmd.Context(),
			vantaapi.DeleteTrustCenterSubscriberGroupParams{
				SlugId:            trustCentersDeleteSubscriberGroupID,
				SubscriberGroupId: trustCentersDeleteSubscriberGroupGroupID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersListSubscribersID                     string
	trustCentersListSubscribersPage                   paginationFlags
	trustCentersListSubscribersCustomerTrustAccountID string
)

var trustCentersListSubscribersCmd = &cobra.Command{
	Use:   "list-subscribers",
	Short: "List Trust Center subscribers",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterSubscribersParams{
			SlugId: trustCentersListSubscribersID,
		}
		if trustCentersListSubscribersPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListSubscribersPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListSubscribersPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if accountID := strings.TrimSpace(trustCentersListSubscribersCustomerTrustAccountID); accountID != "" {
			params.CustomerTrustAccountId.SetTo(accountID)
		}

		resp, err := client.ogen.ListTrustCenterSubscribers(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetSubscriberID           string
	trustCentersGetSubscriberSubscriberID string
)

var trustCentersGetSubscriberCmd = &cobra.Command{
	Use:   "get-subscriber",
	Short: "Get a Trust Center subscriber",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterSubscriber(
			cmd.Context(),
			vantaapi.GetTrustCenterSubscriberParams{
				SlugId:       trustCentersGetSubscriberID,
				SubscriberId: trustCentersGetSubscriberSubscriberID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateSubscriberID   string
	trustCentersCreateSubscriberJSON string
	trustCentersCreateSubscriberFile string
)

var trustCentersCreateSubscriberCmd = &cobra.Command{
	Use:   "create-subscriber",
	Short: "Create a Trust Center subscriber",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersCreateSubscriberJSON, trustCentersCreateSubscriberFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddTrustCenterSubscriberInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateTrustCenterSubscriber(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterSubscriberParams{SlugId: trustCentersCreateSubscriberID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteSubscriberID           string
	trustCentersDeleteSubscriberSubscriberID string
)

var trustCentersDeleteSubscriberCmd = &cobra.Command{
	Use:   "delete-subscriber",
	Short: "Delete a Trust Center subscriber",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterSubscriber(
			cmd.Context(),
			vantaapi.DeleteTrustCenterSubscriberParams{
				SlugId:       trustCentersDeleteSubscriberID,
				SubscriberId: trustCentersDeleteSubscriberSubscriberID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersUpsertSubscriberGroupsID           string
	trustCentersUpsertSubscriberGroupsSubscriberID string
	trustCentersUpsertSubscriberGroupsJSON         string
	trustCentersUpsertSubscriberGroupsFile         string
)

var trustCentersUpsertSubscriberGroupsCmd = &cobra.Command{
	Use:   "upsert-subscriber-groups",
	Short: "Set the groups for a Trust Center subscriber",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpsertSubscriberGroupsJSON, trustCentersUpsertSubscriberGroupsFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.SetGroupsForTrustCenterSubscriberInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpsertGroupsForTrustCenterSubscriber(
			cmd.Context(),
			req,
			vantaapi.UpsertGroupsForTrustCenterSubscriberParams{
				SlugId:       trustCentersUpsertSubscriberGroupsID,
				SubscriberId: trustCentersUpsertSubscriberGroupsSubscriberID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	trustCentersCmd.AddCommand(trustCentersListSubscriberGroupsCmd)
	trustCentersListSubscriberGroupsCmd.Flags().StringVar(&trustCentersListSubscriberGroupsID, "id", "", trustCenterIDFlagUsage)
	trustCentersListSubscriberGroupsCmd.Flags().IntVar(&trustCentersListSubscriberGroupsPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListSubscriberGroupsCmd.Flags().StringVar(&trustCentersListSubscriberGroupsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = trustCentersListSubscriberGroupsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetSubscriberGroupCmd)
	trustCentersGetSubscriberGroupCmd.Flags().StringVar(&trustCentersGetSubscriberGroupID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetSubscriberGroupCmd.Flags().StringVar(&trustCentersGetSubscriberGroupGroupID, "subscriber-group-id", "", "Subscriber group ID")
	_ = trustCentersGetSubscriberGroupCmd.MarkFlagRequired("id")
	_ = trustCentersGetSubscriberGroupCmd.MarkFlagRequired("subscriber-group-id")

	trustCentersCmd.AddCommand(trustCentersCreateSubscriberGroupCmd)
	trustCentersCreateSubscriberGroupCmd.Flags().StringVar(&trustCentersCreateSubscriberGroupID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateSubscriberGroupCmd.Flags().StringVar(&trustCentersCreateSubscriberGroupJSON, "json", "", "Raw JSON payload")
	trustCentersCreateSubscriberGroupCmd.Flags().StringVar(&trustCentersCreateSubscriberGroupFile, "file", "", "Path to JSON payload file")
	_ = trustCentersCreateSubscriberGroupCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateSubscriberGroupCmd)
	trustCentersUpdateSubscriberGroupCmd.Flags().StringVar(&trustCentersUpdateSubscriberGroupID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateSubscriberGroupCmd.Flags().StringVar(&trustCentersUpdateSubscriberGroupGroupID, "subscriber-group-id", "", "Subscriber group ID")
	trustCentersUpdateSubscriberGroupCmd.Flags().StringVar(&trustCentersUpdateSubscriberGroupJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateSubscriberGroupCmd.Flags().StringVar(&trustCentersUpdateSubscriberGroupFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateSubscriberGroupCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateSubscriberGroupCmd.MarkFlagRequired("subscriber-group-id")

	trustCentersCmd.AddCommand(trustCentersDeleteSubscriberGroupCmd)
	trustCentersDeleteSubscriberGroupCmd.Flags().StringVar(&trustCentersDeleteSubscriberGroupID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteSubscriberGroupCmd.Flags().StringVar(&trustCentersDeleteSubscriberGroupGroupID, "subscriber-group-id", "", "Subscriber group ID")
	_ = trustCentersDeleteSubscriberGroupCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteSubscriberGroupCmd.MarkFlagRequired("subscriber-group-id")

	trustCentersCmd.AddCommand(trustCentersListSubscribersCmd)
	trustCentersListSubscribersCmd.Flags().StringVar(&trustCentersListSubscribersID, "id", "", trustCenterIDFlagUsage)
	trustCentersListSubscribersCmd.Flags().IntVar(&trustCentersListSubscribersPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListSubscribersCmd.Flags().StringVar(&trustCentersListSubscribersPage.pageCursor, "page-cursor", "", "Pagination cursor")
	trustCentersListSubscribersCmd.Flags().StringVar(&trustCentersListSubscribersCustomerTrustAccountID, "customer-trust-account-id", "", "Filter subscribers by customer trust account ID")
	_ = trustCentersListSubscribersCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetSubscriberCmd)
	trustCentersGetSubscriberCmd.Flags().StringVar(&trustCentersGetSubscriberID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetSubscriberCmd.Flags().StringVar(&trustCentersGetSubscriberSubscriberID, "subscriber-id", "", "Subscriber ID")
	_ = trustCentersGetSubscriberCmd.MarkFlagRequired("id")
	_ = trustCentersGetSubscriberCmd.MarkFlagRequired("subscriber-id")

	trustCentersCmd.AddCommand(trustCentersCreateSubscriberCmd)
	trustCentersCreateSubscriberCmd.Flags().StringVar(&trustCentersCreateSubscriberID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateSubscriberCmd.Flags().StringVar(&trustCentersCreateSubscriberJSON, "json", "", "Raw JSON payload")
	trustCentersCreateSubscriberCmd.Flags().StringVar(&trustCentersCreateSubscriberFile, "file", "", "Path to JSON payload file")
	_ = trustCentersCreateSubscriberCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersDeleteSubscriberCmd)
	trustCentersDeleteSubscriberCmd.Flags().StringVar(&trustCentersDeleteSubscriberID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteSubscriberCmd.Flags().StringVar(&trustCentersDeleteSubscriberSubscriberID, "subscriber-id", "", "Subscriber ID")
	_ = trustCentersDeleteSubscriberCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteSubscriberCmd.MarkFlagRequired("subscriber-id")

	trustCentersCmd.AddCommand(trustCentersUpsertSubscriberGroupsCmd)
	trustCentersUpsertSubscriberGroupsCmd.Flags().StringVar(&trustCentersUpsertSubscriberGroupsID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpsertSubscriberGroupsCmd.Flags().StringVar(&trustCentersUpsertSubscriberGroupsSubscriberID, "subscriber-id", "", "Subscriber ID")
	trustCentersUpsertSubscriberGroupsCmd.Flags().StringVar(&trustCentersUpsertSubscriberGroupsJSON, "json", "", "Raw JSON payload")
	trustCentersUpsertSubscriberGroupsCmd.Flags().StringVar(&trustCentersUpsertSubscriberGroupsFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpsertSubscriberGroupsCmd.MarkFlagRequired("id")
	_ = trustCentersUpsertSubscriberGroupsCmd.MarkFlagRequired("subscriber-id")
}
