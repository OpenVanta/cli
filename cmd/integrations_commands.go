package cmd

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

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

		query := url.Values{}
		integrationsListPage.apply(query)
		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/integrations", query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/integrations/" + url.PathEscape(integrationsGetID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/integrations/" + url.PathEscape(integrationsListResourceKindsID) + "/resource-kinds"
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		query := url.Values{}
		if strings.TrimSpace(integrationsGetResourceKindConnectionID) != "" {
			query.Set("connectionId", strings.TrimSpace(integrationsGetResourceKindConnectionID))
		}

		path := "/integrations/" + url.PathEscape(integrationsGetResourceKindID) + "/resource-kinds/" + url.PathEscape(integrationsGetResourceKindResourceKind)
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		query := url.Values{}
		integrationsListResourcesPage.apply(query)
		if strings.TrimSpace(integrationsListResourcesConnectionID) != "" {
			query.Set("connectionId", strings.TrimSpace(integrationsListResourcesConnectionID))
		}
		if err := setOptionalBoolQuery(query, "hasDescription", integrationsListResourcesHasDesc); err != nil {
			return err
		}
		if err := setOptionalBoolQuery(query, "hasOwner", integrationsListResourcesHasOwner); err != nil {
			return err
		}
		if err := setOptionalBoolQuery(query, "isInScope", integrationsListResourcesInScope); err != nil {
			return err
		}

		path := "/integrations/" + url.PathEscape(integrationsListResourcesID) + "/resource-kinds/" + url.PathEscape(integrationsListResourcesResourceKind) + "/resources"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/integrations/" + url.PathEscape(integrationsGetResourceID) +
			"/resource-kinds/" + url.PathEscape(integrationsGetResourceResourceKind) +
			"/resources/" + url.PathEscape(integrationsGetResourceResourceID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/integrations/" + url.PathEscape(integrationsUpdateResourceID) +
			"/resource-kinds/" + url.PathEscape(integrationsUpdateResourceResourceKind) +
			"/resources/" + url.PathEscape(integrationsUpdateResourceResourceID)
		resp, err := client.request(cmd, http.MethodPatch, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/integrations/" + url.PathEscape(integrationsUpdateResourcesID) +
			"/resource-kinds/" + url.PathEscape(integrationsUpdateResourcesResourceKind) +
			"/resources"
		resp, err := client.request(cmd, http.MethodPatch, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

func setOptionalBoolQuery(query url.Values, key string, rawValue string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}

	parsed, err := strconv.ParseBool(strings.TrimSpace(rawValue))
	if err != nil {
		return fmt.Errorf("invalid value for --%s: %q (expected true or false)", flagNameFromQueryKey(key), rawValue)
	}
	query.Set(key, strconv.FormatBool(parsed))
	return nil
}

func flagNameFromQueryKey(queryKey string) string {
	switch queryKey {
	case "hasDescription":
		return "has-description"
	case "hasOwner":
		return "has-owner"
	case "isInScope":
		return "is-in-scope"
	default:
		return queryKey
	}
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
