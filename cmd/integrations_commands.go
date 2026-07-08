package cmd

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var integrationsListPage paginationFlags

var integrationsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List connected integrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListConnectedIntegrationsParams{}
		if integrationsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(integrationsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(integrationsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListConnectedIntegrations(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var integrationsGetID string

var integrationsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a connected integration",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetConnectedIntegration(
			cmd.Context(),
			vantaapi.GetConnectedIntegrationParams{IntegrationId: integrationsGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var integrationsListResourceKindsID string

var integrationsListResourceKindsCmd = &cobra.Command{
	Use:   "list-resource-kinds",
	Short: "List integration resource kinds",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ListResourceKindSummaries(
			cmd.Context(),
			vantaapi.ListResourceKindSummariesParams{IntegrationId: integrationsListResourceKindsID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	integrationsGetResourceKindID           string
	integrationsGetResourceKindResourceKind string
	integrationsGetResourceKindConnectionID string
)

var integrationsGetResourceKindCmd = &cobra.Command{
	Use:   "get-resource-kind",
	Short: "Get integration resource kind details",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.GetResourceKindDetailsParams{
			IntegrationId: integrationsGetResourceKindID,
			ResourceKind:  integrationsGetResourceKindResourceKind,
		}
		if strings.TrimSpace(integrationsGetResourceKindConnectionID) != "" {
			params.ConnectionId.SetTo(strings.TrimSpace(integrationsGetResourceKindConnectionID))
		}

		resp, err := client.ogen.GetResourceKindDetails(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	integrationsListResourcesID           string
	integrationsListResourcesResourceKind string
	integrationsListResourcesPage         paginationFlags
	integrationsListResourcesConnectionID string
	integrationsListResourcesHasDesc      string
	integrationsListResourcesHasOwner     string
	integrationsListResourcesInScope      string
)

var integrationsListResourcesCmd = &cobra.Command{
	Use:   "list-resources",
	Short: "List resources for an integration resource kind",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListResourcesParams{
			IntegrationId: integrationsListResourcesID,
			ResourceKind:  integrationsListResourcesResourceKind,
		}
		if integrationsListResourcesPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(integrationsListResourcesPage.pageSize))
		}
		if cursor := strings.TrimSpace(integrationsListResourcesPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(integrationsListResourcesConnectionID) != "" {
			params.ConnectionId.SetTo(strings.TrimSpace(integrationsListResourcesConnectionID))
		}
		if err := setOptionalBoolQuery(&params.HasDescription, "has-description", integrationsListResourcesHasDesc); err != nil {
			return err
		}
		if err := setOptionalBoolQuery(&params.HasOwner, "has-owner", integrationsListResourcesHasOwner); err != nil {
			return err
		}
		if err := setOptionalBoolQuery(&params.IsInScope, "is-in-scope", integrationsListResourcesInScope); err != nil {
			return err
		}

		resp, err := client.ogen.ListResources(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	integrationsGetResourceID           string
	integrationsGetResourceResourceKind string
	integrationsGetResourceResourceID   string
)

var integrationsGetResourceCmd = &cobra.Command{
	Use:   "get-resource",
	Short: "Get an integration resource by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetResource(
			cmd.Context(),
			vantaapi.GetResourceParams{
				IntegrationId: integrationsGetResourceID,
				ResourceKind:  integrationsGetResourceResourceKind,
				ResourceId:    integrationsGetResourceResourceID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	integrationsUpdateResourceID           string
	integrationsUpdateResourceResourceKind string
	integrationsUpdateResourceResourceID   string
	integrationsUpdateResourceJSON         string
	integrationsUpdateResourceFile         string
)

var integrationsUpdateResourceCmd = &cobra.Command{
	Use:   "update-resource",
	Short: "Update metadata for a single integration resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(integrationsUpdateResourceJSON, integrationsUpdateResourceFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateResourceReq](payload)
		if err != nil {
			return err
		}

		if err := client.ogen.UpdateResource(
			cmd.Context(),
			req,
			vantaapi.UpdateResourceParams{
				IntegrationId: integrationsUpdateResourceID,
				ResourceKind:  integrationsUpdateResourceResourceKind,
				ResourceId:    integrationsUpdateResourceResourceID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	integrationsUpdateResourcesID           string
	integrationsUpdateResourcesResourceKind string
	integrationsUpdateResourcesJSON         string
	integrationsUpdateResourcesFile         string
)

var integrationsUpdateResourcesCmd = &cobra.Command{
	Use:   "update-resources",
	Short: "Update metadata for multiple integration resources",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(integrationsUpdateResourcesJSON, integrationsUpdateResourcesFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateResourcesReq](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateResources(
			cmd.Context(),
			req,
			vantaapi.UpdateResourcesParams{
				IntegrationId: integrationsUpdateResourcesID,
				ResourceKind:  integrationsUpdateResourcesResourceKind,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func setOptionalBoolQuery(target *vantaapi.OptBool, flagName string, rawValue string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}

	parsed, err := strconv.ParseBool(strings.TrimSpace(rawValue))
	if err != nil {
		return fmt.Errorf("invalid value for --%s: %q (expected true or false)", flagName, rawValue)
	}
	target.SetTo(parsed)
	return nil
}

func init() {
	integrationsCmd.AddCommand(integrationsListCmd)
	integrationsListCmd.Flags().IntVar(&integrationsListPage.pageSize, "page-size", 0, "Number of results to return")
	integrationsListCmd.Flags().StringVar(&integrationsListPage.pageCursor, "page-cursor", "", "Pagination cursor")

	integrationsCmd.AddCommand(integrationsGetCmd)
	integrationsGetCmd.Flags().StringVar(&integrationsGetID, "id", "", "Integration ID")
	_ = integrationsGetCmd.MarkFlagRequired("id")

	integrationsCmd.AddCommand(integrationsListResourceKindsCmd)
	integrationsListResourceKindsCmd.Flags().StringVar(&integrationsListResourceKindsID, "id", "", "Integration ID")
	_ = integrationsListResourceKindsCmd.MarkFlagRequired("id")

	integrationsCmd.AddCommand(integrationsGetResourceKindCmd)
	integrationsGetResourceKindCmd.Flags().StringVar(&integrationsGetResourceKindID, "id", "", "Integration ID")
	integrationsGetResourceKindCmd.Flags().StringVar(&integrationsGetResourceKindResourceKind, "resource-kind", "", "Integration resource kind")
	integrationsGetResourceKindCmd.Flags().StringVar(&integrationsGetResourceKindConnectionID, "connection-id", "", "Filter by integration connection ID")
	_ = integrationsGetResourceKindCmd.MarkFlagRequired("id")
	_ = integrationsGetResourceKindCmd.MarkFlagRequired("resource-kind")

	integrationsCmd.AddCommand(integrationsListResourcesCmd)
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesID, "id", "", "Integration ID")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesResourceKind, "resource-kind", "", "Integration resource kind")
	integrationsListResourcesCmd.Flags().IntVar(&integrationsListResourcesPage.pageSize, "page-size", 0, "Number of results to return")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesPage.pageCursor, "page-cursor", "", "Pagination cursor")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesConnectionID, "connection-id", "", "Filter by integration connection ID")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesHasDesc, "has-description", "", "Filter resources with descriptions (true/false)")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesHasOwner, "has-owner", "", "Filter resources with owners (true/false)")
	integrationsListResourcesCmd.Flags().StringVar(&integrationsListResourcesInScope, "is-in-scope", "", "Filter resources by scope status (true/false)")
	_ = integrationsListResourcesCmd.MarkFlagRequired("id")
	_ = integrationsListResourcesCmd.MarkFlagRequired("resource-kind")

	integrationsCmd.AddCommand(integrationsGetResourceCmd)
	integrationsGetResourceCmd.Flags().StringVar(&integrationsGetResourceID, "id", "", "Integration ID")
	integrationsGetResourceCmd.Flags().StringVar(&integrationsGetResourceResourceKind, "resource-kind", "", "Integration resource kind")
	integrationsGetResourceCmd.Flags().StringVar(&integrationsGetResourceResourceID, "resource-id", "", "Resource ID")
	_ = integrationsGetResourceCmd.MarkFlagRequired("id")
	_ = integrationsGetResourceCmd.MarkFlagRequired("resource-kind")
	_ = integrationsGetResourceCmd.MarkFlagRequired("resource-id")

	integrationsCmd.AddCommand(integrationsUpdateResourceCmd)
	integrationsUpdateResourceCmd.Flags().StringVar(&integrationsUpdateResourceID, "id", "", "Integration ID")
	integrationsUpdateResourceCmd.Flags().StringVar(&integrationsUpdateResourceResourceKind, "resource-kind", "", "Integration resource kind")
	integrationsUpdateResourceCmd.Flags().StringVar(&integrationsUpdateResourceResourceID, "resource-id", "", "Resource ID")
	integrationsUpdateResourceCmd.Flags().StringVar(&integrationsUpdateResourceJSON, "json", "", "Raw JSON payload")
	integrationsUpdateResourceCmd.Flags().StringVar(&integrationsUpdateResourceFile, "file", "", "Path to JSON payload file")
	_ = integrationsUpdateResourceCmd.MarkFlagRequired("id")
	_ = integrationsUpdateResourceCmd.MarkFlagRequired("resource-kind")
	_ = integrationsUpdateResourceCmd.MarkFlagRequired("resource-id")

	integrationsCmd.AddCommand(integrationsUpdateResourcesCmd)
	integrationsUpdateResourcesCmd.Flags().StringVar(&integrationsUpdateResourcesID, "id", "", "Integration ID")
	integrationsUpdateResourcesCmd.Flags().StringVar(&integrationsUpdateResourcesResourceKind, "resource-kind", "", "Integration resource kind")
	integrationsUpdateResourcesCmd.Flags().StringVar(&integrationsUpdateResourcesJSON, "json", "", "Raw JSON payload")
	integrationsUpdateResourcesCmd.Flags().StringVar(&integrationsUpdateResourcesFile, "file", "", "Path to JSON payload file")
	_ = integrationsUpdateResourcesCmd.MarkFlagRequired("id")
	_ = integrationsUpdateResourcesCmd.MarkFlagRequired("resource-kind")
}
