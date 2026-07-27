package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	trustCentersListUpdatesID   string
	trustCentersListUpdatesPage paginationFlags
)

var trustCentersListUpdatesCmd = &cobra.Command{
	Use:   "list-updates",
	Short: "List Trust Center updates",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterUpdatesParams{
			SlugId: trustCentersListUpdatesID,
		}
		if trustCentersListUpdatesPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListUpdatesPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListUpdatesPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTrustCenterUpdates(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetUpdateID       string
	trustCentersGetUpdateUpdateID string
)

var trustCentersGetUpdateCmd = &cobra.Command{
	Use:   "get-update",
	Short: "Get a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterUpdate(
			cmd.Context(),
			vantaapi.GetTrustCenterUpdateParams{
				SlugId:   trustCentersGetUpdateID,
				UpdateId: trustCentersGetUpdateUpdateID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateUpdateID   string
	trustCentersCreateUpdateJSON string
	trustCentersCreateUpdateFile string
)

var trustCentersCreateUpdateCmd = &cobra.Command{
	Use:   "create-update",
	Short: "Create a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersCreateUpdateJSON, trustCentersCreateUpdateFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddTrustCenterUpdateInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateTrustCenterUpdate(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterUpdateParams{SlugId: trustCentersCreateUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateUpdateID       string
	trustCentersUpdateUpdateUpdateID string
	trustCentersUpdateUpdateJSON     string
	trustCentersUpdateUpdateFile     string
)

var trustCentersUpdateUpdateCmd = &cobra.Command{
	Use:   "update-update",
	Short: "Update a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateUpdateJSON, trustCentersUpdateUpdateFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.EditTrustCenterUpdateInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterUpdate(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterUpdateParams{
				SlugId:   trustCentersUpdateUpdateID,
				UpdateId: trustCentersUpdateUpdateUpdateID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteUpdateID       string
	trustCentersDeleteUpdateUpdateID string
)

var trustCentersDeleteUpdateCmd = &cobra.Command{
	Use:   "delete-update",
	Short: "Delete a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterUpdate(
			cmd.Context(),
			vantaapi.DeleteTrustCenterUpdateParams{
				SlugId:   trustCentersDeleteUpdateID,
				UpdateId: trustCentersDeleteUpdateUpdateID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersNotifyAllSubscribersID       string
	trustCentersNotifyAllSubscribersUpdateID string
)

var trustCentersNotifyAllSubscribersCmd = &cobra.Command{
	Use:   "notify-all-subscribers",
	Short: "Notify all subscribers about a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.SendNotificationsToAllSubscribers(
			cmd.Context(),
			vantaapi.SendNotificationsToAllSubscribersParams{
				SlugId:   trustCentersNotifyAllSubscribersID,
				UpdateId: trustCentersNotifyAllSubscribersUpdateID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersNotifySpecificSubscribersID       string
	trustCentersNotifySpecificSubscribersUpdateID string
	trustCentersNotifySpecificSubscribersJSON     string
	trustCentersNotifySpecificSubscribersFile     string
)

var trustCentersNotifySpecificSubscribersCmd = &cobra.Command{
	Use:   "notify-specific-subscribers",
	Short: "Notify specific subscribers about a Trust Center update",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(
			trustCentersNotifySpecificSubscribersJSON,
			trustCentersNotifySpecificSubscribersFile,
		)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.SendTrustCenterUpdateNotificationsInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.SendTrustCenterUpdateNotifications(
			cmd.Context(),
			req,
			vantaapi.SendTrustCenterUpdateNotificationsParams{
				SlugId:   trustCentersNotifySpecificSubscribersID,
				UpdateId: trustCentersNotifySpecificSubscribersUpdateID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersListViewersID             string
	trustCentersListViewersPage           paginationFlags
	trustCentersListViewersIncludeRemoved string
)

var trustCentersListViewersCmd = &cobra.Command{
	Use:   "list-viewers",
	Short: "List Trust Center viewers",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterViewersParams{
			SlugId: trustCentersListViewersID,
		}
		if trustCentersListViewersPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListViewersPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListViewersPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if err := setOptionalBoolOpt(&params.IncludeRemoved, trustCentersListViewersIncludeRemoved, "include-removed"); err != nil {
			return err
		}

		resp, err := client.ogen.ListTrustCenterViewers(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetViewerID       string
	trustCentersGetViewerViewerID string
)

var trustCentersGetViewerCmd = &cobra.Command{
	Use:   "get-viewer",
	Short: "Get a Trust Center viewer",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterViewer(
			cmd.Context(),
			vantaapi.GetTrustCenterViewerParams{
				SlugId:   trustCentersGetViewerID,
				ViewerId: trustCentersGetViewerViewerID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersAddViewerID   string
	trustCentersAddViewerJSON string
	trustCentersAddViewerFile string
)

var trustCentersAddViewerCmd = &cobra.Command{
	Use:   "add-viewer",
	Short: "Add a Trust Center viewer",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersAddViewerJSON, trustCentersAddViewerFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddTrustCenterViewerInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddTrustCenterViewer(
			cmd.Context(),
			req,
			vantaapi.AddTrustCenterViewerParams{SlugId: trustCentersAddViewerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateViewerID       string
	trustCentersUpdateViewerViewerID string
	trustCentersUpdateViewerJSON     string
	trustCentersUpdateViewerFile     string
)

var trustCentersUpdateViewerCmd = &cobra.Command{
	Use:   "update-viewer",
	Short: "Update a Trust Center viewer",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateViewerJSON, trustCentersUpdateViewerFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.UpdateTrustCenterViewerInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterViewer(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterViewerParams{
				SlugId:   trustCentersUpdateViewerID,
				ViewerId: trustCentersUpdateViewerViewerID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersRemoveViewerID       string
	trustCentersRemoveViewerViewerID string
)

var trustCentersRemoveViewerCmd = &cobra.Command{
	Use:   "remove-viewer",
	Short: "Remove a Trust Center viewer",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.RemoveTrustCenterViewer(
			cmd.Context(),
			vantaapi.RemoveTrustCenterViewerParams{
				SlugId:   trustCentersRemoveViewerID,
				ViewerId: trustCentersRemoveViewerViewerID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	trustCentersCmd.AddCommand(trustCentersListUpdatesCmd)
	trustCentersListUpdatesCmd.Flags().StringVar(&trustCentersListUpdatesID, "id", "", trustCenterIDFlagUsage)
	trustCentersListUpdatesCmd.Flags().IntVar(&trustCentersListUpdatesPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListUpdatesCmd.Flags().StringVar(&trustCentersListUpdatesPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = trustCentersListUpdatesCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetUpdateCmd)
	trustCentersGetUpdateCmd.Flags().StringVar(&trustCentersGetUpdateID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetUpdateCmd.Flags().StringVar(&trustCentersGetUpdateUpdateID, "update-id", "", "Trust Center update ID")
	_ = trustCentersGetUpdateCmd.MarkFlagRequired("id")
	_ = trustCentersGetUpdateCmd.MarkFlagRequired("update-id")

	trustCentersCmd.AddCommand(trustCentersCreateUpdateCmd)
	trustCentersCreateUpdateCmd.Flags().StringVar(&trustCentersCreateUpdateID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateUpdateCmd.Flags().StringVar(&trustCentersCreateUpdateJSON, "json", "", "Raw JSON payload")
	trustCentersCreateUpdateCmd.Flags().StringVar(&trustCentersCreateUpdateFile, "file", "", "Path to JSON payload file")
	_ = trustCentersCreateUpdateCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateUpdateCmd)
	trustCentersUpdateUpdateCmd.Flags().StringVar(&trustCentersUpdateUpdateID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateUpdateCmd.Flags().StringVar(&trustCentersUpdateUpdateUpdateID, "update-id", "", "Trust Center update ID")
	trustCentersUpdateUpdateCmd.Flags().StringVar(&trustCentersUpdateUpdateJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateUpdateCmd.Flags().StringVar(&trustCentersUpdateUpdateFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateUpdateCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateUpdateCmd.MarkFlagRequired("update-id")

	trustCentersCmd.AddCommand(trustCentersDeleteUpdateCmd)
	trustCentersDeleteUpdateCmd.Flags().StringVar(&trustCentersDeleteUpdateID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteUpdateCmd.Flags().StringVar(&trustCentersDeleteUpdateUpdateID, "update-id", "", "Trust Center update ID")
	_ = trustCentersDeleteUpdateCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteUpdateCmd.MarkFlagRequired("update-id")

	trustCentersCmd.AddCommand(trustCentersNotifyAllSubscribersCmd)
	trustCentersNotifyAllSubscribersCmd.Flags().StringVar(&trustCentersNotifyAllSubscribersID, "id", "", trustCenterIDFlagUsage)
	trustCentersNotifyAllSubscribersCmd.Flags().StringVar(&trustCentersNotifyAllSubscribersUpdateID, "update-id", "", "Trust Center update ID")
	_ = trustCentersNotifyAllSubscribersCmd.MarkFlagRequired("id")
	_ = trustCentersNotifyAllSubscribersCmd.MarkFlagRequired("update-id")

	trustCentersCmd.AddCommand(trustCentersNotifySpecificSubscribersCmd)
	trustCentersNotifySpecificSubscribersCmd.Flags().StringVar(&trustCentersNotifySpecificSubscribersID, "id", "", trustCenterIDFlagUsage)
	trustCentersNotifySpecificSubscribersCmd.Flags().StringVar(&trustCentersNotifySpecificSubscribersUpdateID, "update-id", "", "Trust Center update ID")
	trustCentersNotifySpecificSubscribersCmd.Flags().StringVar(&trustCentersNotifySpecificSubscribersJSON, "json", "", "Raw JSON payload")
	trustCentersNotifySpecificSubscribersCmd.Flags().StringVar(&trustCentersNotifySpecificSubscribersFile, "file", "", "Path to JSON payload file")
	_ = trustCentersNotifySpecificSubscribersCmd.MarkFlagRequired("id")
	_ = trustCentersNotifySpecificSubscribersCmd.MarkFlagRequired("update-id")

	trustCentersCmd.AddCommand(trustCentersListViewersCmd)
	trustCentersListViewersCmd.Flags().StringVar(&trustCentersListViewersID, "id", "", trustCenterIDFlagUsage)
	trustCentersListViewersCmd.Flags().IntVar(&trustCentersListViewersPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListViewersCmd.Flags().StringVar(&trustCentersListViewersPage.pageCursor, "page-cursor", "", "Pagination cursor")
	trustCentersListViewersCmd.Flags().StringVar(&trustCentersListViewersIncludeRemoved, "include-removed", "", "Include removed viewers (true/false)")
	_ = trustCentersListViewersCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetViewerCmd)
	trustCentersGetViewerCmd.Flags().StringVar(&trustCentersGetViewerID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetViewerCmd.Flags().StringVar(&trustCentersGetViewerViewerID, "viewer-id", "", "Trust Center viewer ID")
	_ = trustCentersGetViewerCmd.MarkFlagRequired("id")
	_ = trustCentersGetViewerCmd.MarkFlagRequired("viewer-id")

	trustCentersCmd.AddCommand(trustCentersAddViewerCmd)
	trustCentersAddViewerCmd.Flags().StringVar(&trustCentersAddViewerID, "id", "", trustCenterIDFlagUsage)
	trustCentersAddViewerCmd.Flags().StringVar(&trustCentersAddViewerJSON, "json", "", "Raw JSON payload")
	trustCentersAddViewerCmd.Flags().StringVar(&trustCentersAddViewerFile, "file", "", "Path to JSON payload file")
	_ = trustCentersAddViewerCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateViewerCmd)
	trustCentersUpdateViewerCmd.Flags().StringVar(&trustCentersUpdateViewerID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateViewerCmd.Flags().StringVar(&trustCentersUpdateViewerViewerID, "viewer-id", "", "Trust Center viewer ID")
	trustCentersUpdateViewerCmd.Flags().StringVar(&trustCentersUpdateViewerJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateViewerCmd.Flags().StringVar(&trustCentersUpdateViewerFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateViewerCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateViewerCmd.MarkFlagRequired("viewer-id")

	trustCentersCmd.AddCommand(trustCentersRemoveViewerCmd)
	trustCentersRemoveViewerCmd.Flags().StringVar(&trustCentersRemoveViewerID, "id", "", trustCenterIDFlagUsage)
	trustCentersRemoveViewerCmd.Flags().StringVar(&trustCentersRemoveViewerViewerID, "viewer-id", "", "Trust Center viewer ID")
	_ = trustCentersRemoveViewerCmd.MarkFlagRequired("id")
	_ = trustCentersRemoveViewerCmd.MarkFlagRequired("viewer-id")
}
