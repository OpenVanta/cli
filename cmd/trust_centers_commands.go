package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var trustCentersGetID string

var trustCentersGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a Trust Center by slug ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenter(
			cmd.Context(),
			vantaapi.GetTrustCenterParams{SlugId: trustCentersGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateID   string
	trustCentersUpdateJSON string
	trustCentersUpdateFile string
)

var trustCentersUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update a Trust Center by slug ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateJSON, trustCentersUpdateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateTrustCenterInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenter(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterParams{SlugId: trustCentersUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersListAccessRequestsID   string
	trustCentersListAccessRequestsPage paginationFlags
)

var trustCentersListAccessRequestsCmd = &cobra.Command{
	Use:   "list-access-requests",
	Short: "List Trust Center access requests",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterAccessRequestsParams{
			SlugId: trustCentersListAccessRequestsID,
		}
		if trustCentersListAccessRequestsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListAccessRequestsPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListAccessRequestsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTrustCenterAccessRequests(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetAccessRequestID              string
	trustCentersGetAccessRequestAccessRequestID string
)

var trustCentersGetAccessRequestCmd = &cobra.Command{
	Use:   "get-access-request",
	Short: "Get a Trust Center access request",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterAccessRequest(
			cmd.Context(),
			vantaapi.GetTrustCenterAccessRequestParams{
				SlugId:          trustCentersGetAccessRequestID,
				AccessRequestId: trustCentersGetAccessRequestAccessRequestID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersApproveAccessRequestID              string
	trustCentersApproveAccessRequestAccessRequestID string
	trustCentersApproveAccessRequestJSON            string
	trustCentersApproveAccessRequestFile            string
)

var trustCentersApproveAccessRequestCmd = &cobra.Command{
	Use:   "approve-access-request",
	Short: "Approve a Trust Center access request",
	Long:  "Approve a Trust Center access request. The request body is optional; omit --json/--file to approve with the requested access.",
	RunE: func(cmd *cobra.Command, args []string) error {
		req := &vantaapi.ApproveTrustCenterAccessRequestInput{}
		if hasJSONPayloadFlags(trustCentersApproveAccessRequestJSON, trustCentersApproveAccessRequestFile) {
			payload, err := readJSONPayload(trustCentersApproveAccessRequestJSON, trustCentersApproveAccessRequestFile)
			if err != nil {
				return err
			}
			req, err = decodeRequestPayload[vantaapi.ApproveTrustCenterAccessRequestInput](payload)
			if err != nil {
				return err
			}
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.ApproveTrustCenterAccessRequest(
			cmd.Context(),
			req,
			vantaapi.ApproveTrustCenterAccessRequestParams{
				SlugId:          trustCentersApproveAccessRequestID,
				AccessRequestId: trustCentersApproveAccessRequestAccessRequestID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersDenyAccessRequestID              string
	trustCentersDenyAccessRequestAccessRequestID string
	trustCentersDenyAccessRequestJSON            string
	trustCentersDenyAccessRequestFile            string
)

var trustCentersDenyAccessRequestCmd = &cobra.Command{
	Use:   "deny-access-request",
	Short: "Deny a Trust Center access request",
	Long:  "Deny a Trust Center access request. The request body is optional; pass --json/--file to include a denial reason.",
	RunE: func(cmd *cobra.Command, args []string) error {
		var req vantaapi.OptDenyTrustCenterAccessRequestInput
		if hasJSONPayloadFlags(trustCentersDenyAccessRequestJSON, trustCentersDenyAccessRequestFile) {
			payload, err := readJSONPayload(trustCentersDenyAccessRequestJSON, trustCentersDenyAccessRequestFile)
			if err != nil {
				return err
			}
			decoded, err := decodeRequestPayload[vantaapi.DenyTrustCenterAccessRequestInput](payload)
			if err != nil {
				return err
			}
			req.SetTo(*decoded)
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DenyTrustCenterAccessRequest(
			cmd.Context(),
			req,
			vantaapi.DenyTrustCenterAccessRequestParams{
				SlugId:          trustCentersDenyAccessRequestID,
				AccessRequestId: trustCentersDenyAccessRequestAccessRequestID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersListHistoricalAccessRequestsID   string
	trustCentersListHistoricalAccessRequestsPage paginationFlags
)

var trustCentersListHistoricalAccessRequestsCmd = &cobra.Command{
	Use:   "list-historical-access-requests",
	Short: "List historical Trust Center access requests",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterHistoricalAccessRequestsParams{
			SlugId: trustCentersListHistoricalAccessRequestsID,
		}
		if trustCentersListHistoricalAccessRequestsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListHistoricalAccessRequestsPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListHistoricalAccessRequestsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTrustCenterHistoricalAccessRequests(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersListActivityID         string
	trustCentersListActivityPage       paginationFlags
	trustCentersListActivityEventTypes []string
	trustCentersListActivityAfterDate  string
	trustCentersListActivityBeforeDate string
)

var trustCentersListActivityCmd = &cobra.Command{
	Use:   "list-activity",
	Short: "List Trust Center activity events",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterActivityEventsParams{
			SlugId: trustCentersListActivityID,
		}
		if trustCentersListActivityPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListActivityPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListActivityPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		for _, eventType := range trustCentersListActivityEventTypes {
			if trimmed := strings.TrimSpace(eventType); trimmed != "" {
				params.EventTypesMatchesAny = append(params.EventTypesMatchesAny, vantaapi.ActivityEventType(trimmed))
			}
		}
		if raw := strings.TrimSpace(trustCentersListActivityAfterDate); raw != "" {
			parsed, err := parseRFC3339Flag("after-date", raw)
			if err != nil {
				return err
			}
			params.AfterDate.SetTo(parsed)
		}
		if raw := strings.TrimSpace(trustCentersListActivityBeforeDate); raw != "" {
			parsed, err := parseRFC3339Flag("before-date", raw)
			if err != nil {
				return err
			}
			params.BeforeDate.SetTo(parsed)
		}

		resp, err := client.ogen.ListTrustCenterActivityEvents(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	trustCentersCmd.AddCommand(trustCentersGetCmd)
	trustCentersGetCmd.Flags().StringVar(&trustCentersGetID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersGetCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateCmd)
	trustCentersUpdateCmd.Flags().StringVar(&trustCentersUpdateID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateCmd.Flags().StringVar(&trustCentersUpdateJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateCmd.Flags().StringVar(&trustCentersUpdateFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersListAccessRequestsCmd)
	trustCentersListAccessRequestsCmd.Flags().StringVar(&trustCentersListAccessRequestsID, "id", "", trustCenterIDFlagUsage)
	trustCentersListAccessRequestsCmd.Flags().IntVar(&trustCentersListAccessRequestsPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListAccessRequestsCmd.Flags().StringVar(&trustCentersListAccessRequestsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = trustCentersListAccessRequestsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetAccessRequestCmd)
	trustCentersGetAccessRequestCmd.Flags().StringVar(&trustCentersGetAccessRequestID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetAccessRequestCmd.Flags().StringVar(&trustCentersGetAccessRequestAccessRequestID, "access-request-id", "", "Access request ID")
	_ = trustCentersGetAccessRequestCmd.MarkFlagRequired("id")
	_ = trustCentersGetAccessRequestCmd.MarkFlagRequired("access-request-id")

	trustCentersCmd.AddCommand(trustCentersApproveAccessRequestCmd)
	trustCentersApproveAccessRequestCmd.Flags().StringVar(&trustCentersApproveAccessRequestID, "id", "", trustCenterIDFlagUsage)
	trustCentersApproveAccessRequestCmd.Flags().StringVar(&trustCentersApproveAccessRequestAccessRequestID, "access-request-id", "", "Access request ID")
	trustCentersApproveAccessRequestCmd.Flags().StringVar(&trustCentersApproveAccessRequestJSON, "json", "", "Raw JSON payload (optional)")
	trustCentersApproveAccessRequestCmd.Flags().StringVar(&trustCentersApproveAccessRequestFile, "file", "", "Path to JSON payload file (optional)")
	_ = trustCentersApproveAccessRequestCmd.MarkFlagRequired("id")
	_ = trustCentersApproveAccessRequestCmd.MarkFlagRequired("access-request-id")

	trustCentersCmd.AddCommand(trustCentersDenyAccessRequestCmd)
	trustCentersDenyAccessRequestCmd.Flags().StringVar(&trustCentersDenyAccessRequestID, "id", "", trustCenterIDFlagUsage)
	trustCentersDenyAccessRequestCmd.Flags().StringVar(&trustCentersDenyAccessRequestAccessRequestID, "access-request-id", "", "Access request ID")
	trustCentersDenyAccessRequestCmd.Flags().StringVar(&trustCentersDenyAccessRequestJSON, "json", "", "Raw JSON payload (optional)")
	trustCentersDenyAccessRequestCmd.Flags().StringVar(&trustCentersDenyAccessRequestFile, "file", "", "Path to JSON payload file (optional)")
	_ = trustCentersDenyAccessRequestCmd.MarkFlagRequired("id")
	_ = trustCentersDenyAccessRequestCmd.MarkFlagRequired("access-request-id")

	trustCentersCmd.AddCommand(trustCentersListHistoricalAccessRequestsCmd)
	trustCentersListHistoricalAccessRequestsCmd.Flags().StringVar(&trustCentersListHistoricalAccessRequestsID, "id", "", trustCenterIDFlagUsage)
	trustCentersListHistoricalAccessRequestsCmd.Flags().IntVar(&trustCentersListHistoricalAccessRequestsPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListHistoricalAccessRequestsCmd.Flags().StringVar(&trustCentersListHistoricalAccessRequestsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = trustCentersListHistoricalAccessRequestsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersListActivityCmd)
	trustCentersListActivityCmd.Flags().StringVar(&trustCentersListActivityID, "id", "", trustCenterIDFlagUsage)
	trustCentersListActivityCmd.Flags().IntVar(&trustCentersListActivityPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListActivityCmd.Flags().StringVar(&trustCentersListActivityPage.pageCursor, "page-cursor", "", "Pagination cursor")
	trustCentersListActivityCmd.Flags().StringSliceVar(&trustCentersListActivityEventTypes, "event-types-matches-any", nil, "Activity event types to filter by (repeatable)")
	trustCentersListActivityCmd.Flags().StringVar(&trustCentersListActivityAfterDate, "after-date", "", "Only return events after this RFC3339 timestamp")
	trustCentersListActivityCmd.Flags().StringVar(&trustCentersListActivityBeforeDate, "before-date", "", "Only return events before this RFC3339 timestamp")
	_ = trustCentersListActivityCmd.MarkFlagRequired("id")
}
