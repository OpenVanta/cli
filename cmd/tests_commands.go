package cmd

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var (
	testsListPage              paginationFlags
	testsListStatusFilter      string
	testsListFrameworkFilter   string
	testsListIntegrationFilter string
	testsListControlFilter     string
	testsListOwnerFilter       string
	testsListCategoryFilter    string
	testsListIsInRollout       string
)

var testsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List tests",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		testsListPage.apply(query)
		if strings.TrimSpace(testsListStatusFilter) != "" {
			query.Set("statusFilter", strings.TrimSpace(testsListStatusFilter))
		}
		if strings.TrimSpace(testsListFrameworkFilter) != "" {
			query.Set("frameworkFilter", strings.TrimSpace(testsListFrameworkFilter))
		}
		if strings.TrimSpace(testsListIntegrationFilter) != "" {
			query.Set("integrationFilter", strings.TrimSpace(testsListIntegrationFilter))
		}
		if strings.TrimSpace(testsListControlFilter) != "" {
			query.Set("controlFilter", strings.TrimSpace(testsListControlFilter))
		}
		if strings.TrimSpace(testsListOwnerFilter) != "" {
			query.Set("ownerFilter", strings.TrimSpace(testsListOwnerFilter))
		}
		if strings.TrimSpace(testsListCategoryFilter) != "" {
			query.Set("categoryFilter", strings.TrimSpace(testsListCategoryFilter))
		}
		if strings.TrimSpace(testsListIsInRollout) != "" {
			if parsed, err := strconv.ParseBool(strings.TrimSpace(testsListIsInRollout)); err == nil {
				query.Set("isInRollout", strconv.FormatBool(parsed))
			}
		}

		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/tests", query, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

var testID string

var testsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a test by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/tests/" + url.PathEscape(testID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

var (
	testsEntitiesID           string
	testsEntitiesPage         paginationFlags
	testsEntitiesStatusFilter string
)

var testsEntitiesCmd = &cobra.Command{
	Use:   "list-entities",
	Short: "List entities for a test",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		testsEntitiesPage.apply(query)
		if strings.TrimSpace(testsEntitiesStatusFilter) != "" {
			query.Set("entityStatus", strings.TrimSpace(testsEntitiesStatusFilter))
		}

		path := "/tests/" + url.PathEscape(testsEntitiesID) + "/entities"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

var (
	testsDeactivateID       string
	testsDeactivateEntityID string
	testsDeactivateJSON     string
	testsDeactivateFile     string
)

var testsDeactivateEntityCmd = &cobra.Command{
	Use:   "deactivate-entity",
	Short: "Deactivate a test entity",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(testsDeactivateJSON, testsDeactivateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/tests/" + url.PathEscape(testsDeactivateID) + "/entities/" + url.PathEscape(testsDeactivateEntityID) + "/deactivate"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

var (
	testsReactivateID       string
	testsReactivateEntityID string
)

var testsReactivateEntityCmd = &cobra.Command{
	Use:   "reactivate-entity",
	Short: "Reactivate a test entity",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/tests/" + url.PathEscape(testsReactivateID) + "/entities/" + url.PathEscape(testsReactivateEntityID) + "/reactivate"
		resp, err := client.request(cmd, http.MethodPost, path, nil)
		if err != nil {
			return err
		}

		return printJSON(cmd, resp)
	},
}

func init() {
	testsCmd.AddCommand(testsListCmd)
	testsListCmd.Flags().IntVar(&testsListPage.pageSize, "page-size", 0, "Number of results to return")
	testsListCmd.Flags().StringVar(&testsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	testsListCmd.Flags().StringVar(&testsListStatusFilter, "status-filter", "", "Filter tests by status")
	testsListCmd.Flags().StringVar(&testsListFrameworkFilter, "framework-filter", "", "Filter tests by framework")
	testsListCmd.Flags().StringVar(&testsListIntegrationFilter, "integration-filter", "", "Filter tests by integration")
	testsListCmd.Flags().StringVar(&testsListControlFilter, "control-filter", "", "Filter tests by control ID")
	testsListCmd.Flags().StringVar(&testsListOwnerFilter, "owner-filter", "", "Filter tests by owner ID")
	testsListCmd.Flags().StringVar(&testsListCategoryFilter, "category-filter", "", "Filter tests by category")
	testsListCmd.Flags().StringVar(&testsListIsInRollout, "is-in-rollout", "", "Filter tests by rollout status (true/false)")

	testsCmd.AddCommand(testsGetCmd)
	testsGetCmd.Flags().StringVar(&testID, "id", "", "Test ID")
	_ = testsGetCmd.MarkFlagRequired("id")

	testsCmd.AddCommand(testsEntitiesCmd)
	testsEntitiesCmd.Flags().StringVar(&testsEntitiesID, "id", "", "Test ID")
	testsEntitiesCmd.Flags().IntVar(&testsEntitiesPage.pageSize, "page-size", 0, "Number of results to return")
	testsEntitiesCmd.Flags().StringVar(&testsEntitiesPage.pageCursor, "page-cursor", "", "Pagination cursor")
	testsEntitiesCmd.Flags().StringVar(&testsEntitiesStatusFilter, "entity-status", "", "Filter by entity status (FAILING or DEACTIVATED)")
	_ = testsEntitiesCmd.MarkFlagRequired("id")

	testsCmd.AddCommand(testsDeactivateEntityCmd)
	testsDeactivateEntityCmd.Flags().StringVar(&testsDeactivateID, "id", "", "Test ID")
	testsDeactivateEntityCmd.Flags().StringVar(&testsDeactivateEntityID, "entity-id", "", "Test entity ID")
	testsDeactivateEntityCmd.Flags().StringVar(&testsDeactivateJSON, "json", "", "Raw JSON payload")
	testsDeactivateEntityCmd.Flags().StringVar(&testsDeactivateFile, "file", "", "Path to JSON payload file")
	_ = testsDeactivateEntityCmd.MarkFlagRequired("id")
	_ = testsDeactivateEntityCmd.MarkFlagRequired("entity-id")

	testsCmd.AddCommand(testsReactivateEntityCmd)
	testsReactivateEntityCmd.Flags().StringVar(&testsReactivateID, "id", "", "Test ID")
	testsReactivateEntityCmd.Flags().StringVar(&testsReactivateEntityID, "entity-id", "", "Test entity ID")
	_ = testsReactivateEntityCmd.MarkFlagRequired("id")
	_ = testsReactivateEntityCmd.MarkFlagRequired("entity-id")
}
