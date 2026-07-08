package cmd

import (
	"strconv"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
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

		params := vantaapi.ListTestsParams{}
		if testsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(testsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(testsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(testsListStatusFilter) != "" {
			params.StatusFilter.SetTo(vantaapi.TestStatus(strings.TrimSpace(testsListStatusFilter)))
		}
		if strings.TrimSpace(testsListFrameworkFilter) != "" {
			params.FrameworkFilter.SetTo(strings.TrimSpace(testsListFrameworkFilter))
		}
		if strings.TrimSpace(testsListIntegrationFilter) != "" {
			params.IntegrationFilter.SetTo(strings.TrimSpace(testsListIntegrationFilter))
		}
		if strings.TrimSpace(testsListControlFilter) != "" {
			params.ControlFilter.SetTo(strings.TrimSpace(testsListControlFilter))
		}
		if strings.TrimSpace(testsListOwnerFilter) != "" {
			params.OwnerFilter.SetTo(strings.TrimSpace(testsListOwnerFilter))
		}
		if strings.TrimSpace(testsListCategoryFilter) != "" {
			params.CategoryFilter.SetTo(vantaapi.TestCategory(strings.TrimSpace(testsListCategoryFilter)))
		}
		if strings.TrimSpace(testsListIsInRollout) != "" {
			if parsed, err := strconv.ParseBool(strings.TrimSpace(testsListIsInRollout)); err == nil {
				params.IsInRollout.SetTo(parsed)
			}
		}

		resp, err := client.ogen.ListTests(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, resp)
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

		resp, err := client.ogen.GetTest(
			cmd.Context(),
			vantaapi.GetTestParams{TestId: testID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, resp)
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

		params := vantaapi.GetTestEntitiesParams{
			TestId: testsEntitiesID,
		}
		if testsEntitiesPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(testsEntitiesPage.pageSize))
		}
		if cursor := strings.TrimSpace(testsEntitiesPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(testsEntitiesStatusFilter) != "" {
			params.EntityStatus.SetTo(vantaapi.EntityStatus(strings.TrimSpace(testsEntitiesStatusFilter)))
		}

		resp, err := client.ogen.GetTestEntities(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, resp)
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

		req, err := decodeRequestPayload[vantaapi.DeactivateTestEntityReq](payload)
		if err != nil {
			return err
		}

		if err := client.ogen.DeactivateTestEntity(
			cmd.Context(),
			req,
			vantaapi.DeactivateTestEntityParams{
				TestId:   testsDeactivateID,
				EntityId: testsDeactivateEntityID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, nil)
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

		if err := client.ogen.ReactivateTestEntity(
			cmd.Context(),
			vantaapi.ReactivateTestEntityParams{
				TestId:   testsReactivateID,
				EntityId: testsReactivateEntityID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}

		return printResponseJSON(cmd, nil)
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
