package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	ohttp "github.com/ogen-go/ogen/http"
	"github.com/spf13/cobra"
)

var (
	customerTrustQuestionnairesListPage              paginationFlags
	customerTrustQuestionnairesListQ                 string
	customerTrustQuestionnairesListStatusFilters     []string
	customerTrustQuestionnairesListTypeFilters       []string
	customerTrustQuestionnairesListCreatedAfter      string
	customerTrustQuestionnairesListCreatedBefore     string
	customerTrustQuestionnairesListOwnerIDFilters    []string
	customerTrustQuestionnairesListApproverIDFilters []string
)

var customerTrustListQuestionnairesCmd = &cobra.Command{
	Use:   "list-questionnaires",
	Short: "List Customer Trust questionnaires",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListQuestionnairesParams{}
		if customerTrustQuestionnairesListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(customerTrustQuestionnairesListPage.pageSize))
		}
		if cursor := strings.TrimSpace(customerTrustQuestionnairesListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if query := strings.TrimSpace(customerTrustQuestionnairesListQ); query != "" {
			params.Q.SetTo(query)
		}
		for _, raw := range customerTrustQuestionnairesListStatusFilters {
			trimmed := strings.TrimSpace(raw)
			if trimmed == "" {
				continue
			}
			status := vantaapi.QuestionnaireStatus(trimmed)
			if err := status.Validate(); err != nil {
				return fmt.Errorf(
					"invalid --status-matches-any %q (expected one of: APPROVED, IN_PROGRESS, IN_REVIEW, READY_FOR_REVIEW, WAITING_ON_ANSWERS, ON_HOLD, NO_LONGER_NEEDED, COMPLETE, ERROR, EXTRACTING_QUESTIONS, QUEUED_FOR_EXTRACTION, PROCESSING, QUEUED_FOR_PROCESSING, WAITING_ON_COLUMN_SELECTION, WAITING_ON_COLUMN_APPROVAL, QUEUED_FOR_COLUMN_DETECTION, DETECTING_COLUMNS)",
					trimmed,
				)
			}
			params.StatusMatchesAny = append(params.StatusMatchesAny, status)
		}
		for _, raw := range customerTrustQuestionnairesListTypeFilters {
			trimmed := strings.TrimSpace(raw)
			if trimmed == "" {
				continue
			}
			questionnaireType := vantaapi.CustomerTrustQuestionnaireType(trimmed)
			if err := questionnaireType.Validate(); err != nil {
				return fmt.Errorf(
					"invalid --type-matches-any %q (expected one of: SPREADSHEET, WEBSITE, DOCUMENT)",
					trimmed,
				)
			}
			params.TypeMatchesAny = append(params.TypeMatchesAny, questionnaireType)
		}
		if createdAfter := strings.TrimSpace(customerTrustQuestionnairesListCreatedAfter); createdAfter != "" {
			params.CreatedAfter.SetTo(createdAfter)
		}
		if createdBefore := strings.TrimSpace(customerTrustQuestionnairesListCreatedBefore); createdBefore != "" {
			params.CreatedBefore.SetTo(createdBefore)
		}
		for _, owner := range customerTrustQuestionnairesListOwnerIDFilters {
			if trimmed := strings.TrimSpace(owner); trimmed != "" {
				params.OwnerIdMatchesAny = append(params.OwnerIdMatchesAny, trimmed)
			}
		}
		for _, approver := range customerTrustQuestionnairesListApproverIDFilters {
			if trimmed := strings.TrimSpace(approver); trimmed != "" {
				params.ApproverIdMatchesAny = append(params.ApproverIdMatchesAny, trimmed)
			}
		}

		resp, err := client.ogen.ListQuestionnaires(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustGetQuestionnaireID string

var customerTrustGetQuestionnaireCmd = &cobra.Command{
	Use:   "get-questionnaire",
	Short: "Get a Customer Trust questionnaire by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetQuestionnaire(
			cmd.Context(),
			vantaapi.GetQuestionnaireParams{QuestionnaireId: customerTrustGetQuestionnaireID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustUpdateQuestionnaireID   string
	customerTrustUpdateQuestionnaireJSON string
	customerTrustUpdateQuestionnaireFile string
)

var customerTrustUpdateQuestionnaireCmd = &cobra.Command{
	Use:   "update-questionnaire",
	Short: "Update a Customer Trust questionnaire",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustUpdateQuestionnaireJSON, customerTrustUpdateQuestionnaireFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateQuestionnaireArgs](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateQuestionnaire(
			cmd.Context(),
			req,
			vantaapi.UpdateQuestionnaireParams{QuestionnaireId: customerTrustUpdateQuestionnaireID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustDeleteQuestionnaireID string

var customerTrustDeleteQuestionnaireCmd = &cobra.Command{
	Use:   "delete-questionnaire",
	Short: "Delete a Customer Trust questionnaire",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteQuestionnaire(
			cmd.Context(),
			vantaapi.DeleteQuestionnaireParams{QuestionnaireId: customerTrustDeleteQuestionnaireID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	customerTrustApproveQuestionnaireID   string
	customerTrustApproveQuestionnaireJSON string
	customerTrustApproveQuestionnaireFile string
)

var customerTrustApproveQuestionnaireCmd = &cobra.Command{
	Use:   "approve-questionnaire",
	Short: "Approve a Customer Trust questionnaire",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustApproveQuestionnaireJSON, customerTrustApproveQuestionnaireFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.ApproveQuestionnaireRequest](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ApproveQuestionnaire(
			cmd.Context(),
			req,
			vantaapi.ApproveQuestionnaireParams{QuestionnaireId: customerTrustApproveQuestionnaireID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustCompleteQuestionnaireID   string
	customerTrustCompleteQuestionnaireJSON string
	customerTrustCompleteQuestionnaireFile string
)

var customerTrustCompleteQuestionnaireCmd = &cobra.Command{
	Use:   "complete-questionnaire",
	Short: "Complete a Customer Trust questionnaire",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustCompleteQuestionnaireJSON, customerTrustCompleteQuestionnaireFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CompleteQuestionnaireRequest](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CompleteQuestionnaire(
			cmd.Context(),
			req,
			vantaapi.CompleteQuestionnaireParams{QuestionnaireId: customerTrustCompleteQuestionnaireID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustCreateFileQuestionnaireFilePath               string
	customerTrustCreateFileQuestionnaireDisplayName            string
	customerTrustCreateFileQuestionnaireOwnerAssignment        string
	customerTrustCreateFileQuestionnaireApproverAssignment     string
	customerTrustCreateFileQuestionnaireDescription            string
	customerTrustCreateFileQuestionnaireCompanyURL             string
	customerTrustCreateFileQuestionnaireDueDate                string
	customerTrustCreateFileQuestionnaireCustomerTrustAccountID string
)

var customerTrustCreateFileQuestionnaireCmd = &cobra.Command{
	Use:   "create-file-questionnaire",
	Short: "Create a file-based Customer Trust questionnaire",
	Long:  "Create a new file-based questionnaire from an uploaded file (.xlsx, .docx, .pdf). File type is inferred as SPREADSHEET or DOCUMENT based on the uploaded file.",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(customerTrustCreateFileQuestionnaireFilePath) == "" {
			return fmt.Errorf("--file is required")
		}
		if strings.TrimSpace(customerTrustCreateFileQuestionnaireDisplayName) == "" {
			return fmt.Errorf("--display-name is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(customerTrustCreateFileQuestionnaireFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.CreateFileQuestionnaireReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
			DisplayName: strings.TrimSpace(customerTrustCreateFileQuestionnaireDisplayName),
		}
		if ownerAssignment := strings.TrimSpace(customerTrustCreateFileQuestionnaireOwnerAssignment); ownerAssignment != "" {
			req.OwnerAssignment.SetTo(ownerAssignment)
		}
		if approverAssignment := strings.TrimSpace(customerTrustCreateFileQuestionnaireApproverAssignment); approverAssignment != "" {
			req.ApproverAssignment.SetTo(approverAssignment)
		}
		if description := strings.TrimSpace(customerTrustCreateFileQuestionnaireDescription); description != "" {
			req.Description.SetTo(description)
		}
		if companyURL := strings.TrimSpace(customerTrustCreateFileQuestionnaireCompanyURL); companyURL != "" {
			req.CompanyUrl.SetTo(companyURL)
		}
		if dueDate := strings.TrimSpace(customerTrustCreateFileQuestionnaireDueDate); dueDate != "" {
			req.DueDate.SetTo(dueDate)
		}
		if accountID := strings.TrimSpace(customerTrustCreateFileQuestionnaireCustomerTrustAccountID); accountID != "" {
			req.CustomerTrustAccountId.SetTo(accountID)
		}

		resp, err := client.ogen.CreateFileQuestionnaire(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustCreateWebsiteQuestionnaireJSON string
	customerTrustCreateWebsiteQuestionnaireFile string
)

var customerTrustCreateWebsiteQuestionnaireCmd = &cobra.Command{
	Use:   "create-website-questionnaire",
	Short: "Create a website-based Customer Trust questionnaire",
	Long:  "Create a new website-based questionnaire from a portal URL. The portal URL is used to fetch questionnaire content from the target website.",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustCreateWebsiteQuestionnaireJSON, customerTrustCreateWebsiteQuestionnaireFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateWebsiteQuestionnaireInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateWebsiteQuestionnaire(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustListAssignableUsersRole string
	customerTrustListAssignableUsersQ    string
)

var customerTrustListAssignableUsersCmd = &cobra.Command{
	Use:   "list-assignable-users",
	Short: "List users assignable as questionnaire owner or approver",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListAssignableUsersParams{}
		if roleRaw := strings.TrimSpace(customerTrustListAssignableUsersRole); roleRaw != "" {
			role := vantaapi.QuestionnaireAssignableUserRole(roleRaw)
			if err := role.Validate(); err != nil {
				return fmt.Errorf(`invalid --role %q (expected "owner" or "approver")`, roleRaw)
			}
			params.Role.SetTo(role)
		}
		if query := strings.TrimSpace(customerTrustListAssignableUsersQ); query != "" {
			params.Q.SetTo(query)
		}

		resp, err := client.ogen.ListAssignableUsers(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	customerTrustCreateQuestionnaireExportJSON string
	customerTrustCreateQuestionnaireExportFile string
)

var customerTrustCreateQuestionnaireExportCmd = &cobra.Command{
	Use:   "create-questionnaire-export",
	Short: "Create an export job for a Customer Trust questionnaire",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(customerTrustCreateQuestionnaireExportJSON, customerTrustCreateQuestionnaireExportFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CustomerTrustCreateQuestionnaireExportInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateQuestionnaireExport(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustGetQuestionnaireExportID string

var customerTrustGetQuestionnaireExportCmd = &cobra.Command{
	Use:   "get-questionnaire-export",
	Short: "Get the status of a Customer Trust questionnaire export",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetQuestionnaireExport(
			cmd.Context(),
			vantaapi.GetQuestionnaireExportParams{ID: customerTrustGetQuestionnaireExportID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	customerTrustCmd.AddCommand(customerTrustListQuestionnairesCmd)
	customerTrustListQuestionnairesCmd.Flags().IntVar(&customerTrustQuestionnairesListPage.pageSize, "page-size", 0, "Number of results to return")
	customerTrustListQuestionnairesCmd.Flags().StringVar(&customerTrustQuestionnairesListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	customerTrustListQuestionnairesCmd.Flags().StringVar(&customerTrustQuestionnairesListQ, "q", "", "Filter questionnaires by display name (case-insensitive, partial match)")
	customerTrustListQuestionnairesCmd.Flags().StringSliceVar(&customerTrustQuestionnairesListStatusFilters, "status-matches-any", nil, "Statuses to filter by (repeatable): APPROVED, IN_PROGRESS, IN_REVIEW, READY_FOR_REVIEW, WAITING_ON_ANSWERS, ON_HOLD, NO_LONGER_NEEDED, COMPLETE, ERROR, EXTRACTING_QUESTIONS, QUEUED_FOR_EXTRACTION, PROCESSING, QUEUED_FOR_PROCESSING, WAITING_ON_COLUMN_SELECTION, WAITING_ON_COLUMN_APPROVAL, QUEUED_FOR_COLUMN_DETECTION, DETECTING_COLUMNS")
	customerTrustListQuestionnairesCmd.Flags().StringSliceVar(&customerTrustQuestionnairesListTypeFilters, "type-matches-any", nil, "Types to filter by (repeatable): SPREADSHEET, WEBSITE, DOCUMENT")
	customerTrustListQuestionnairesCmd.Flags().StringVar(&customerTrustQuestionnairesListCreatedAfter, "created-after", "", "Filter to questionnaires created after this date (ISO 8601 string)")
	customerTrustListQuestionnairesCmd.Flags().StringVar(&customerTrustQuestionnairesListCreatedBefore, "created-before", "", "Filter to questionnaires created before this date (ISO 8601 string)")
	customerTrustListQuestionnairesCmd.Flags().StringSliceVar(&customerTrustQuestionnairesListOwnerIDFilters, "owner-id-matches-any", nil, "Owner user IDs to filter by (repeatable)")
	customerTrustListQuestionnairesCmd.Flags().StringSliceVar(&customerTrustQuestionnairesListApproverIDFilters, "approver-id-matches-any", nil, "Approver user IDs to filter by (repeatable)")

	customerTrustCmd.AddCommand(customerTrustGetQuestionnaireCmd)
	customerTrustGetQuestionnaireCmd.Flags().StringVar(&customerTrustGetQuestionnaireID, "id", "", "Questionnaire ID")
	_ = customerTrustGetQuestionnaireCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustUpdateQuestionnaireCmd)
	customerTrustUpdateQuestionnaireCmd.Flags().StringVar(&customerTrustUpdateQuestionnaireID, "id", "", "Questionnaire ID")
	customerTrustUpdateQuestionnaireCmd.Flags().StringVar(&customerTrustUpdateQuestionnaireJSON, "json", "", "Raw JSON payload")
	customerTrustUpdateQuestionnaireCmd.Flags().StringVar(&customerTrustUpdateQuestionnaireFile, "file", "", "Path to JSON payload file")
	_ = customerTrustUpdateQuestionnaireCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustDeleteQuestionnaireCmd)
	customerTrustDeleteQuestionnaireCmd.Flags().StringVar(&customerTrustDeleteQuestionnaireID, "id", "", "Questionnaire ID")
	_ = customerTrustDeleteQuestionnaireCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustApproveQuestionnaireCmd)
	customerTrustApproveQuestionnaireCmd.Flags().StringVar(&customerTrustApproveQuestionnaireID, "id", "", "Questionnaire ID")
	customerTrustApproveQuestionnaireCmd.Flags().StringVar(&customerTrustApproveQuestionnaireJSON, "json", "", "Raw JSON payload")
	customerTrustApproveQuestionnaireCmd.Flags().StringVar(&customerTrustApproveQuestionnaireFile, "file", "", "Path to JSON payload file")
	_ = customerTrustApproveQuestionnaireCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustCompleteQuestionnaireCmd)
	customerTrustCompleteQuestionnaireCmd.Flags().StringVar(&customerTrustCompleteQuestionnaireID, "id", "", "Questionnaire ID")
	customerTrustCompleteQuestionnaireCmd.Flags().StringVar(&customerTrustCompleteQuestionnaireJSON, "json", "", "Raw JSON payload")
	customerTrustCompleteQuestionnaireCmd.Flags().StringVar(&customerTrustCompleteQuestionnaireFile, "file", "", "Path to JSON payload file")
	_ = customerTrustCompleteQuestionnaireCmd.MarkFlagRequired("id")

	customerTrustCmd.AddCommand(customerTrustCreateFileQuestionnaireCmd)
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireFilePath, "file", "", "Path to file to upload (.xlsx, .docx, .pdf)")
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireDisplayName, "display-name", "", "Display name for the questionnaire")
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireOwnerAssignment, "owner-assignment", "", `Owner to assign, as a JSON string: {"type":"User"|"Team","id":"<id>"}`)
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireApproverAssignment, "approver-assignment", "", `Approver to assign, as a JSON string: {"type":"User"|"Team","id":"<id>"}`)
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireDescription, "description", "", "Description of the questionnaire")
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireCompanyURL, "company-url", "", "URL of the company associated with this questionnaire")
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireDueDate, "due-date", "", "Due date for questionnaire completion")
	customerTrustCreateFileQuestionnaireCmd.Flags().StringVar(&customerTrustCreateFileQuestionnaireCustomerTrustAccountID, "customer-trust-account-id", "", "ID of the Customer Trust account to associate with this questionnaire")
	_ = customerTrustCreateFileQuestionnaireCmd.MarkFlagRequired("file")
	_ = customerTrustCreateFileQuestionnaireCmd.MarkFlagRequired("display-name")

	customerTrustCmd.AddCommand(customerTrustCreateWebsiteQuestionnaireCmd)
	customerTrustCreateWebsiteQuestionnaireCmd.Flags().StringVar(&customerTrustCreateWebsiteQuestionnaireJSON, "json", "", "Raw JSON payload")
	customerTrustCreateWebsiteQuestionnaireCmd.Flags().StringVar(&customerTrustCreateWebsiteQuestionnaireFile, "file", "", "Path to JSON payload file")

	customerTrustCmd.AddCommand(customerTrustListAssignableUsersCmd)
	customerTrustListAssignableUsersCmd.Flags().StringVar(&customerTrustListAssignableUsersRole, "role", "", `Filter by role: "owner" or "approver"`)
	customerTrustListAssignableUsersCmd.Flags().StringVar(&customerTrustListAssignableUsersQ, "q", "", "Optional search string to filter users by name or email")

	customerTrustCmd.AddCommand(customerTrustCreateQuestionnaireExportCmd)
	customerTrustCreateQuestionnaireExportCmd.Flags().StringVar(&customerTrustCreateQuestionnaireExportJSON, "json", "", "Raw JSON payload")
	customerTrustCreateQuestionnaireExportCmd.Flags().StringVar(&customerTrustCreateQuestionnaireExportFile, "file", "", "Path to JSON payload file")

	customerTrustCmd.AddCommand(customerTrustGetQuestionnaireExportCmd)
	customerTrustGetQuestionnaireExportCmd.Flags().StringVar(&customerTrustGetQuestionnaireExportID, "id", "", "Export job ID")
	_ = customerTrustGetQuestionnaireExportCmd.MarkFlagRequired("id")
}
