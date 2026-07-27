package cmd

import (
	"fmt"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	riskScenariosListPage                      paginationFlags
	riskScenariosListIncludeIgnored            string
	riskScenariosListOwnerFilters              []string
	riskScenariosListSearchString              string
	riskScenariosListCategoryFilters           []string
	riskScenariosListInherentScoreGroupFilters []string
	riskScenariosListResidualScoreGroupFilters []string
	riskScenariosListReviewStatusFilters       []string
	riskScenariosListType                      string
	riskScenariosListOrderBy                   string
)

var riskScenariosListCmd = &cobra.Command{
	Use:   "list",
	Short: "List risk scenarios",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListRiskScenarioParams{}
		if riskScenariosListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(riskScenariosListPage.pageSize))
		}
		if cursor := strings.TrimSpace(riskScenariosListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if err := setOptionalBoolOpt(
			&params.IncludeIgnored,
			riskScenariosListIncludeIgnored,
			"include-ignored",
		); err != nil {
			return err
		}
		for _, owner := range riskScenariosListOwnerFilters {
			if trimmed := strings.TrimSpace(owner); trimmed != "" {
				params.OwnerMatchesAny = append(params.OwnerMatchesAny, trimmed)
			}
		}
		if search := strings.TrimSpace(riskScenariosListSearchString); search != "" {
			params.SearchString.SetTo(search)
		}
		for _, category := range riskScenariosListCategoryFilters {
			if trimmed := strings.TrimSpace(category); trimmed != "" {
				params.CategoryMatchesAny = append(params.CategoryMatchesAny, trimmed)
			}
		}
		for _, group := range riskScenariosListInherentScoreGroupFilters {
			if trimmed := strings.TrimSpace(group); trimmed != "" {
				params.InherentScoreGroupMatchesAny = append(
					params.InherentScoreGroupMatchesAny,
					vantaapi.ScoreGroup(trimmed),
				)
			}
		}
		for _, group := range riskScenariosListResidualScoreGroupFilters {
			if trimmed := strings.TrimSpace(group); trimmed != "" {
				params.ResidualScoreGroupMatchesAny = append(
					params.ResidualScoreGroupMatchesAny,
					vantaapi.ScoreGroup(trimmed),
				)
			}
		}
		for _, status := range riskScenariosListReviewStatusFilters {
			if trimmed := strings.TrimSpace(status); trimmed != "" {
				params.ReviewStatusMatchesAny = append(
					params.ReviewStatusMatchesAny,
					vantaapi.ReviewStatus(trimmed),
				)
			}
		}
		if typeRaw := strings.TrimSpace(riskScenariosListType); typeRaw != "" {
			scenarioType := vantaapi.RiskScenarioType(typeRaw)
			if err := scenarioType.Validate(); err != nil {
				return fmt.Errorf(
					`invalid --type %q (expected "Risk Scenario" or "Enterprise Risk")`,
					typeRaw,
				)
			}
			params.Type.SetTo(scenarioType)
		}
		if orderByRaw := strings.TrimSpace(riskScenariosListOrderBy); orderByRaw != "" {
			orderBy := vantaapi.ListRiskScenarioOrderBy(orderByRaw)
			if err := orderBy.Validate(); err != nil {
				return fmt.Errorf(
					`invalid --order-by %q (expected "description" or "createdAt")`,
					orderByRaw,
				)
			}
			params.OrderBy.SetTo(orderBy)
		}

		resp, err := client.ogen.ListRiskScenario(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var riskScenariosGetID string

var riskScenariosGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a risk scenario by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetRiskScenario(
			cmd.Context(),
			vantaapi.GetRiskScenarioParams{RiskScenarioId: riskScenariosGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosCreateJSON string
	riskScenariosCreateFile string
)

var riskScenariosCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a risk scenario",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(riskScenariosCreateJSON, riskScenariosCreateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateRiskScenarioInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateRiskScenario(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosUpdateID   string
	riskScenariosUpdateJSON string
	riskScenariosUpdateFile string
)

var riskScenariosUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update a risk scenario",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(riskScenariosUpdateJSON, riskScenariosUpdateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateRiskScenarioInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateRiskScenario(
			cmd.Context(),
			req,
			vantaapi.UpdateRiskScenarioParams{RiskScenarioId: riskScenariosUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosSubmitID   string
	riskScenariosSubmitJSON string
	riskScenariosSubmitFile string
)

var riskScenariosSubmitForApprovalCmd = &cobra.Command{
	Use:   "submit-for-approval",
	Short: "Submit a risk scenario for approval",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(riskScenariosSubmitJSON, riskScenariosSubmitFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.SubmitRiskForApprovalInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.SubmitRiskForApproval(
			cmd.Context(),
			req,
			vantaapi.SubmitRiskForApprovalParams{RiskScenarioId: riskScenariosSubmitID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var riskScenariosCancelApprovalID string

var riskScenariosCancelApprovalCmd = &cobra.Command{
	Use:   "cancel-approval-request",
	Short: "Cancel a risk scenario approval request",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CancelRiskScenarioApprovalRequest(
			cmd.Context(),
			vantaapi.CancelRiskScenarioApprovalRequestParams{
				RiskScenarioId: riskScenariosCancelApprovalID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosListControlsID   string
	riskScenariosListControlsPage paginationFlags
)

var riskScenariosListControlsCmd = &cobra.Command{
	Use:   "list-controls",
	Short: "List controls linked to a risk scenario",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListRiskScenarioControlsParams{
			RiskScenarioId: riskScenariosListControlsID,
		}
		if riskScenariosListControlsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(riskScenariosListControlsPage.pageSize))
		}
		if cursor := strings.TrimSpace(riskScenariosListControlsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListRiskScenarioControls(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosAddControlID   string
	riskScenariosAddControlJSON string
	riskScenariosAddControlFile string
)

var riskScenariosAddControlCmd = &cobra.Command{
	Use:   "add-control",
	Short: "Add a control to a risk scenario",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(riskScenariosAddControlJSON, riskScenariosAddControlFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateRiskScenarioControlInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateRiskScenarioControl(
			cmd.Context(),
			req,
			vantaapi.CreateRiskScenarioControlParams{RiskScenarioId: riskScenariosAddControlID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosUpdateControlID        string
	riskScenariosUpdateControlControlID string
	riskScenariosUpdateControlJSON      string
	riskScenariosUpdateControlFile      string
)

var riskScenariosUpdateControlCmd = &cobra.Command{
	Use:   "update-control",
	Short: "Update a risk scenario control",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(riskScenariosUpdateControlJSON, riskScenariosUpdateControlFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateRiskScenarioControlInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateRiskScenarioControl(
			cmd.Context(),
			req,
			vantaapi.UpdateRiskScenarioControlParams{
				RiskScenarioId: riskScenariosUpdateControlID,
				ControlId:      riskScenariosUpdateControlControlID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	riskScenariosDeleteControlID        string
	riskScenariosDeleteControlControlID string
)

var riskScenariosDeleteControlCmd = &cobra.Command{
	Use:   "delete-control",
	Short: "Remove a control from a risk scenario",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteRiskScenarioControl(
			cmd.Context(),
			vantaapi.DeleteRiskScenarioControlParams{
				RiskScenarioId: riskScenariosDeleteControlID,
				ControlId:      riskScenariosDeleteControlControlID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	riskScenariosCmd.AddCommand(riskScenariosListCmd)
	riskScenariosListCmd.Flags().IntVar(&riskScenariosListPage.pageSize, "page-size", 0, "Number of results to return")
	riskScenariosListCmd.Flags().StringVar(&riskScenariosListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	riskScenariosListCmd.Flags().StringVar(&riskScenariosListIncludeIgnored, "include-ignored", "", "Include ignored risk scenarios (true|false)")
	riskScenariosListCmd.Flags().StringSliceVar(&riskScenariosListOwnerFilters, "owner-matches-any", nil, `Owner IDs to filter by (repeatable; use "No owner" for unassigned)`)
	riskScenariosListCmd.Flags().StringVar(&riskScenariosListSearchString, "search-string", "", "Search string filter")
	riskScenariosListCmd.Flags().StringSliceVar(&riskScenariosListCategoryFilters, "category-matches-any", nil, `Categories to filter by (repeatable; use "Uncategorized" for none)`)
	riskScenariosListCmd.Flags().StringSliceVar(&riskScenariosListInherentScoreGroupFilters, "inherent-score-group-matches-any", nil, `Inherent score groups to filter by (repeatable): "Very low", Low, Med, High, Critical`)
	riskScenariosListCmd.Flags().StringSliceVar(&riskScenariosListResidualScoreGroupFilters, "residual-score-group-matches-any", nil, `Residual score groups to filter by (repeatable): "Very low", Low, Med, High, Critical`)
	riskScenariosListCmd.Flags().StringSliceVar(&riskScenariosListReviewStatusFilters, "review-status-matches-any", nil, "Review statuses to filter by (repeatable): APPROVED, DRAFT, NOT_REVIEWED, AWAITING_SUBMISSION, PENDING_APPROVAL, REQUESTED_CHANGES")
	riskScenariosListCmd.Flags().StringVar(&riskScenariosListType, "type", "", `Risk scenario type: "Risk Scenario" or "Enterprise Risk"`)
	riskScenariosListCmd.Flags().StringVar(&riskScenariosListOrderBy, "order-by", "", `Order by field: "description" or "createdAt"`)

	riskScenariosCmd.AddCommand(riskScenariosGetCmd)
	riskScenariosGetCmd.Flags().StringVar(&riskScenariosGetID, "id", "", "Risk scenario ID")
	_ = riskScenariosGetCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosCreateCmd)
	riskScenariosCreateCmd.Flags().StringVar(&riskScenariosCreateJSON, "json", "", "Raw JSON payload")
	riskScenariosCreateCmd.Flags().StringVar(&riskScenariosCreateFile, "file", "", "Path to JSON payload file")

	riskScenariosCmd.AddCommand(riskScenariosUpdateCmd)
	riskScenariosUpdateCmd.Flags().StringVar(&riskScenariosUpdateID, "id", "", "Risk scenario ID")
	riskScenariosUpdateCmd.Flags().StringVar(&riskScenariosUpdateJSON, "json", "", "Raw JSON payload")
	riskScenariosUpdateCmd.Flags().StringVar(&riskScenariosUpdateFile, "file", "", "Path to JSON payload file")
	_ = riskScenariosUpdateCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosSubmitForApprovalCmd)
	riskScenariosSubmitForApprovalCmd.Flags().StringVar(&riskScenariosSubmitID, "id", "", "Risk scenario ID")
	riskScenariosSubmitForApprovalCmd.Flags().StringVar(&riskScenariosSubmitJSON, "json", "", "Raw JSON payload")
	riskScenariosSubmitForApprovalCmd.Flags().StringVar(&riskScenariosSubmitFile, "file", "", "Path to JSON payload file")
	_ = riskScenariosSubmitForApprovalCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosCancelApprovalCmd)
	riskScenariosCancelApprovalCmd.Flags().StringVar(&riskScenariosCancelApprovalID, "id", "", "Risk scenario ID")
	_ = riskScenariosCancelApprovalCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosListControlsCmd)
	riskScenariosListControlsCmd.Flags().StringVar(&riskScenariosListControlsID, "id", "", "Risk scenario ID")
	riskScenariosListControlsCmd.Flags().IntVar(&riskScenariosListControlsPage.pageSize, "page-size", 0, "Number of results to return")
	riskScenariosListControlsCmd.Flags().StringVar(&riskScenariosListControlsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = riskScenariosListControlsCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosAddControlCmd)
	riskScenariosAddControlCmd.Flags().StringVar(&riskScenariosAddControlID, "id", "", "Risk scenario ID")
	riskScenariosAddControlCmd.Flags().StringVar(&riskScenariosAddControlJSON, "json", "", "Raw JSON payload")
	riskScenariosAddControlCmd.Flags().StringVar(&riskScenariosAddControlFile, "file", "", "Path to JSON payload file")
	_ = riskScenariosAddControlCmd.MarkFlagRequired("id")

	riskScenariosCmd.AddCommand(riskScenariosUpdateControlCmd)
	riskScenariosUpdateControlCmd.Flags().StringVar(&riskScenariosUpdateControlID, "id", "", "Risk scenario ID")
	riskScenariosUpdateControlCmd.Flags().StringVar(&riskScenariosUpdateControlControlID, "control-id", "", "Control ID")
	riskScenariosUpdateControlCmd.Flags().StringVar(&riskScenariosUpdateControlJSON, "json", "", "Raw JSON payload")
	riskScenariosUpdateControlCmd.Flags().StringVar(&riskScenariosUpdateControlFile, "file", "", "Path to JSON payload file")
	_ = riskScenariosUpdateControlCmd.MarkFlagRequired("id")
	_ = riskScenariosUpdateControlCmd.MarkFlagRequired("control-id")

	riskScenariosCmd.AddCommand(riskScenariosDeleteControlCmd)
	riskScenariosDeleteControlCmd.Flags().StringVar(&riskScenariosDeleteControlID, "id", "", "Risk scenario ID")
	riskScenariosDeleteControlCmd.Flags().StringVar(&riskScenariosDeleteControlControlID, "control-id", "", "Control ID")
	_ = riskScenariosDeleteControlCmd.MarkFlagRequired("id")
	_ = riskScenariosDeleteControlCmd.MarkFlagRequired("control-id")
}
