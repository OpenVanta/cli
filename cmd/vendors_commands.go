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
	vendorsListPage          paginationFlags
	vendorsListNameFilter    string
	vendorsListStatusFilters []string
)

var vendorsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List vendors",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListVendorsParams{}
		if vendorsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(vendorsListNameFilter) != "" {
			params.Name.SetTo(strings.TrimSpace(vendorsListNameFilter))
		}
		for _, status := range vendorsListStatusFilters {
			if trimmed := strings.TrimSpace(status); trimmed != "" {
				params.StatusMatchesAny = append(params.StatusMatchesAny, vantaapi.VendorStatus(trimmed))
			}
		}

		resp, err := client.ogen.ListVendors(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vendorsGetID string

var vendorsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a vendor by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetVendor(
			cmd.Context(),
			vantaapi.GetVendorParams{VendorId: vendorsGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsCreateJSON string
	vendorsCreateFile string
)

var vendorsCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a vendor",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vendorsCreateJSON, vendorsCreateFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.CreateVendorInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateVendor(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsUpdateID   string
	vendorsUpdateJSON string
	vendorsUpdateFile string
)

var vendorsUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update a vendor",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vendorsUpdateJSON, vendorsUpdateFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.UpdateVendorInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateVendor(
			cmd.Context(),
			req,
			vantaapi.UpdateVendorParams{VendorId: vendorsUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vendorsDeleteID string

var vendorsDeleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a vendor",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteById(
			cmd.Context(),
			vantaapi.DeleteByIdParams{VendorId: vendorsDeleteID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	vendorsSetStatusID     string
	vendorsSetStatusStatus string
)

var vendorsSetStatusCmd = &cobra.Command{
	Use:   "set-status",
	Short: "Set vendor status",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(vendorsSetStatusStatus) == "" {
			return fmt.Errorf("--status is required")
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req := &vantaapi.SetStatusForVendorReq{
			Status: strings.TrimSpace(vendorsSetStatusStatus),
		}
		resp, err := client.ogen.SetStatusForVendor(
			cmd.Context(),
			req,
			vantaapi.SetStatusForVendorParams{VendorId: vendorsSetStatusID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsListDocumentsID   string
	vendorsListDocumentsPage paginationFlags
)

var vendorsListDocumentsCmd = &cobra.Command{
	Use:   "list-documents",
	Short: "List vendor documents",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		params := vantaapi.ListVendorDocumentsParams{
			VendorId: vendorsListDocumentsID,
		}
		if vendorsListDocumentsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorsListDocumentsPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorsListDocumentsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListVendorDocuments(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsUploadDocumentID          string
	vendorsUploadDocumentFilePath    string
	vendorsUploadDocumentType        string
	vendorsUploadDocumentTitle       string
	vendorsUploadDocumentDescription string
)

var vendorsUploadDocumentCmd = &cobra.Command{
	Use:   "upload-document",
	Short: "Upload a document for a vendor",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(vendorsUploadDocumentFilePath) == "" {
			return fmt.Errorf("--file is required")
		}
		if strings.TrimSpace(vendorsUploadDocumentType) == "" {
			return fmt.Errorf("--type is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(vendorsUploadDocumentFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.UploadDocumentToVendorReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
			Type: strings.TrimSpace(vendorsUploadDocumentType),
		}
		if title := strings.TrimSpace(vendorsUploadDocumentTitle); title != "" {
			req.Title.SetTo(title)
		}
		if description := strings.TrimSpace(vendorsUploadDocumentDescription); description != "" {
			req.Description.SetTo(description)
		}

		resp, err := client.ogen.UploadDocumentToVendor(
			cmd.Context(),
			req,
			vantaapi.UploadDocumentToVendorParams{VendorId: vendorsUploadDocumentID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsListSecurityReviewsID   string
	vendorsListSecurityReviewsPage paginationFlags
)

var vendorsListSecurityReviewsCmd = &cobra.Command{
	Use:   "list-security-reviews",
	Short: "List vendor security reviews",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		params := vantaapi.GetSecurityReviewsByVendorIdParams{
			VendorId: vendorsListSecurityReviewsID,
		}
		if vendorsListSecurityReviewsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorsListSecurityReviewsPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorsListSecurityReviewsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.GetSecurityReviewsByVendorId(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsGetSecurityReviewVendorID string
	vendorsGetSecurityReviewID       string
)

var vendorsGetSecurityReviewCmd = &cobra.Command{
	Use:   "get-security-review",
	Short: "Get a vendor security review",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		resp, err := client.ogen.GetSecurityReviewsById(
			cmd.Context(),
			vantaapi.GetSecurityReviewsByIdParams{
				VendorId:         vendorsGetSecurityReviewVendorID,
				SecurityReviewId: vendorsGetSecurityReviewID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsListSecurityReviewDocsVendorID string
	vendorsListSecurityReviewDocsReviewID string
	vendorsListSecurityReviewDocsPage     paginationFlags
)

var vendorsListSecurityReviewDocsCmd = &cobra.Command{
	Use:   "list-security-review-documents",
	Short: "List documents for a vendor security review",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		params := vantaapi.GetSecurityReviewDocumentsParams{
			VendorId:         vendorsListSecurityReviewDocsVendorID,
			SecurityReviewId: vendorsListSecurityReviewDocsReviewID,
		}
		if vendorsListSecurityReviewDocsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorsListSecurityReviewDocsPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorsListSecurityReviewDocsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.GetSecurityReviewDocuments(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsUploadSecurityReviewDocVendorID    string
	vendorsUploadSecurityReviewDocReviewID    string
	vendorsUploadSecurityReviewDocFilePath    string
	vendorsUploadSecurityReviewDocType        string
	vendorsUploadSecurityReviewDocTitle       string
	vendorsUploadSecurityReviewDocDescription string
)

var vendorsUploadSecurityReviewDocCmd = &cobra.Command{
	Use:   "upload-security-review-document",
	Short: "Upload a document to a vendor security review",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(vendorsUploadSecurityReviewDocFilePath) == "" {
			return fmt.Errorf("--file is required")
		}
		if strings.TrimSpace(vendorsUploadSecurityReviewDocType) == "" {
			return fmt.Errorf("--type is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(vendorsUploadSecurityReviewDocFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.UploadDocumentForSecurityReviewReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
			Type: strings.TrimSpace(vendorsUploadSecurityReviewDocType),
		}
		if title := strings.TrimSpace(vendorsUploadSecurityReviewDocTitle); title != "" {
			req.Title.SetTo(title)
		}
		if description := strings.TrimSpace(vendorsUploadSecurityReviewDocDescription); description != "" {
			req.Description.SetTo(description)
		}

		resp, err := client.ogen.UploadDocumentForSecurityReview(
			cmd.Context(),
			req,
			vantaapi.UploadDocumentForSecurityReviewParams{
				VendorId:         vendorsUploadSecurityReviewDocVendorID,
				SecurityReviewId: vendorsUploadSecurityReviewDocReviewID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsDeleteSecurityReviewDocVendorID   string
	vendorsDeleteSecurityReviewDocReviewID   string
	vendorsDeleteSecurityReviewDocDocumentID string
)

var vendorsDeleteSecurityReviewDocCmd = &cobra.Command{
	Use:   "delete-security-review-document",
	Short: "Delete a document from a vendor security review",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteSecurityReviewDocumentById(
			cmd.Context(),
			vantaapi.DeleteSecurityReviewDocumentByIdParams{
				VendorId:         vendorsDeleteSecurityReviewDocVendorID,
				SecurityReviewId: vendorsDeleteSecurityReviewDocReviewID,
				DocumentId:       vendorsDeleteSecurityReviewDocDocumentID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	vendorsListFindingsVendorID         string
	vendorsListFindingsPage             paginationFlags
	vendorsListFindingsSecurityReviewID string
	vendorsListFindingsDocumentID       string
)

var vendorsListFindingsCmd = &cobra.Command{
	Use:   "list-findings",
	Short: "List vendor findings",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		params := vantaapi.ListVendorFindingsParams{
			VendorId: vendorsListFindingsVendorID,
		}
		if vendorsListFindingsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vendorsListFindingsPage.pageSize))
		}
		if cursor := strings.TrimSpace(vendorsListFindingsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if strings.TrimSpace(vendorsListFindingsSecurityReviewID) != "" {
			params.SecurityReviewId.SetTo(strings.TrimSpace(vendorsListFindingsSecurityReviewID))
		}
		if strings.TrimSpace(vendorsListFindingsDocumentID) != "" {
			params.DocumentId.SetTo(strings.TrimSpace(vendorsListFindingsDocumentID))
		}

		resp, err := client.ogen.ListVendorFindings(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsCreateFindingVendorID string
	vendorsCreateFindingJSON     string
	vendorsCreateFindingFile     string
)

var vendorsCreateFindingCmd = &cobra.Command{
	Use:   "create-finding",
	Short: "Create a vendor finding",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vendorsCreateFindingJSON, vendorsCreateFindingFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.CreateFindingInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateVendorFinding(
			cmd.Context(),
			req,
			vantaapi.CreateVendorFindingParams{VendorId: vendorsCreateFindingVendorID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsUpdateFindingVendorID  string
	vendorsUpdateFindingFindingID string
	vendorsUpdateFindingJSON      string
	vendorsUpdateFindingFile      string
)

var vendorsUpdateFindingCmd = &cobra.Command{
	Use:   "update-finding",
	Short: "Update a vendor finding",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(vendorsUpdateFindingJSON, vendorsUpdateFindingFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.UpdateFindingInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateVendorFinding(
			cmd.Context(),
			req,
			vantaapi.UpdateVendorFindingParams{
				VendorId:  vendorsUpdateFindingVendorID,
				FindingId: vendorsUpdateFindingFindingID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	vendorsDeleteFindingVendorID  string
	vendorsDeleteFindingFindingID string
)

var vendorsDeleteFindingCmd = &cobra.Command{
	Use:   "delete-finding",
	Short: "Delete a vendor finding",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		if err := client.ogen.DeleteFindingById(
			cmd.Context(),
			vantaapi.DeleteFindingByIdParams{
				VendorId:  vendorsDeleteFindingVendorID,
				FindingId: vendorsDeleteFindingFindingID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	vendorsCmd.AddCommand(vendorsListCmd)
	vendorsListCmd.Flags().IntVar(&vendorsListPage.pageSize, "page-size", 0, "Number of results to return")
	vendorsListCmd.Flags().StringVar(&vendorsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	vendorsListCmd.Flags().StringVar(&vendorsListNameFilter, "name", "", "Filter vendors by name (partial match)")
	vendorsListCmd.Flags().StringSliceVar(&vendorsListStatusFilters, "status-matches-any", nil, "Vendor statuses to filter by (repeatable)")

	vendorsCmd.AddCommand(vendorsGetCmd)
	vendorsGetCmd.Flags().StringVar(&vendorsGetID, "id", "", "Vendor ID")
	_ = vendorsGetCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsCreateCmd)
	vendorsCreateCmd.Flags().StringVar(&vendorsCreateJSON, "json", "", "Raw JSON payload")
	vendorsCreateCmd.Flags().StringVar(&vendorsCreateFile, "file", "", "Path to JSON payload file")

	vendorsCmd.AddCommand(vendorsUpdateCmd)
	vendorsUpdateCmd.Flags().StringVar(&vendorsUpdateID, "id", "", "Vendor ID")
	vendorsUpdateCmd.Flags().StringVar(&vendorsUpdateJSON, "json", "", "Raw JSON payload")
	vendorsUpdateCmd.Flags().StringVar(&vendorsUpdateFile, "file", "", "Path to JSON payload file")
	_ = vendorsUpdateCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsDeleteCmd)
	vendorsDeleteCmd.Flags().StringVar(&vendorsDeleteID, "id", "", "Vendor ID")
	_ = vendorsDeleteCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsSetStatusCmd)
	vendorsSetStatusCmd.Flags().StringVar(&vendorsSetStatusID, "id", "", "Vendor ID")
	vendorsSetStatusCmd.Flags().StringVar(&vendorsSetStatusStatus, "status", "", "Vendor status")
	_ = vendorsSetStatusCmd.MarkFlagRequired("id")
	_ = vendorsSetStatusCmd.MarkFlagRequired("status")

	vendorsCmd.AddCommand(vendorsListDocumentsCmd)
	vendorsListDocumentsCmd.Flags().StringVar(&vendorsListDocumentsID, "id", "", "Vendor ID")
	vendorsListDocumentsCmd.Flags().IntVar(&vendorsListDocumentsPage.pageSize, "page-size", 0, "Number of results to return")
	vendorsListDocumentsCmd.Flags().StringVar(&vendorsListDocumentsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = vendorsListDocumentsCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsUploadDocumentCmd)
	vendorsUploadDocumentCmd.Flags().StringVar(&vendorsUploadDocumentID, "id", "", "Vendor ID")
	vendorsUploadDocumentCmd.Flags().StringVar(&vendorsUploadDocumentFilePath, "file", "", "Path to file to upload")
	vendorsUploadDocumentCmd.Flags().StringVar(&vendorsUploadDocumentType, "type", "", "Vendor document type")
	vendorsUploadDocumentCmd.Flags().StringVar(&vendorsUploadDocumentTitle, "title", "", "Document title")
	vendorsUploadDocumentCmd.Flags().StringVar(&vendorsUploadDocumentDescription, "description", "", "Document description")
	_ = vendorsUploadDocumentCmd.MarkFlagRequired("id")
	_ = vendorsUploadDocumentCmd.MarkFlagRequired("file")
	_ = vendorsUploadDocumentCmd.MarkFlagRequired("type")

	vendorsCmd.AddCommand(vendorsListSecurityReviewsCmd)
	vendorsListSecurityReviewsCmd.Flags().StringVar(&vendorsListSecurityReviewsID, "id", "", "Vendor ID")
	vendorsListSecurityReviewsCmd.Flags().IntVar(&vendorsListSecurityReviewsPage.pageSize, "page-size", 0, "Number of results to return")
	vendorsListSecurityReviewsCmd.Flags().StringVar(&vendorsListSecurityReviewsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = vendorsListSecurityReviewsCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsGetSecurityReviewCmd)
	vendorsGetSecurityReviewCmd.Flags().StringVar(&vendorsGetSecurityReviewVendorID, "id", "", "Vendor ID")
	vendorsGetSecurityReviewCmd.Flags().StringVar(&vendorsGetSecurityReviewID, "security-review-id", "", "Security review ID")
	_ = vendorsGetSecurityReviewCmd.MarkFlagRequired("id")
	_ = vendorsGetSecurityReviewCmd.MarkFlagRequired("security-review-id")

	vendorsCmd.AddCommand(vendorsListSecurityReviewDocsCmd)
	vendorsListSecurityReviewDocsCmd.Flags().StringVar(&vendorsListSecurityReviewDocsVendorID, "id", "", "Vendor ID")
	vendorsListSecurityReviewDocsCmd.Flags().StringVar(&vendorsListSecurityReviewDocsReviewID, "security-review-id", "", "Security review ID")
	vendorsListSecurityReviewDocsCmd.Flags().IntVar(&vendorsListSecurityReviewDocsPage.pageSize, "page-size", 0, "Number of results to return")
	vendorsListSecurityReviewDocsCmd.Flags().StringVar(&vendorsListSecurityReviewDocsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = vendorsListSecurityReviewDocsCmd.MarkFlagRequired("id")
	_ = vendorsListSecurityReviewDocsCmd.MarkFlagRequired("security-review-id")

	vendorsCmd.AddCommand(vendorsUploadSecurityReviewDocCmd)
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocVendorID, "id", "", "Vendor ID")
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocReviewID, "security-review-id", "", "Security review ID")
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocFilePath, "file", "", "Path to file to upload")
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocType, "type", "", "Vendor document type")
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocTitle, "title", "", "Document title")
	vendorsUploadSecurityReviewDocCmd.Flags().StringVar(&vendorsUploadSecurityReviewDocDescription, "description", "", "Document description")
	_ = vendorsUploadSecurityReviewDocCmd.MarkFlagRequired("id")
	_ = vendorsUploadSecurityReviewDocCmd.MarkFlagRequired("security-review-id")
	_ = vendorsUploadSecurityReviewDocCmd.MarkFlagRequired("file")
	_ = vendorsUploadSecurityReviewDocCmd.MarkFlagRequired("type")

	vendorsCmd.AddCommand(vendorsDeleteSecurityReviewDocCmd)
	vendorsDeleteSecurityReviewDocCmd.Flags().StringVar(&vendorsDeleteSecurityReviewDocVendorID, "id", "", "Vendor ID")
	vendorsDeleteSecurityReviewDocCmd.Flags().StringVar(&vendorsDeleteSecurityReviewDocReviewID, "security-review-id", "", "Security review ID")
	vendorsDeleteSecurityReviewDocCmd.Flags().StringVar(&vendorsDeleteSecurityReviewDocDocumentID, "document-id", "", "Document ID")
	_ = vendorsDeleteSecurityReviewDocCmd.MarkFlagRequired("id")
	_ = vendorsDeleteSecurityReviewDocCmd.MarkFlagRequired("security-review-id")
	_ = vendorsDeleteSecurityReviewDocCmd.MarkFlagRequired("document-id")

	vendorsCmd.AddCommand(vendorsListFindingsCmd)
	vendorsListFindingsCmd.Flags().StringVar(&vendorsListFindingsVendorID, "id", "", "Vendor ID")
	vendorsListFindingsCmd.Flags().IntVar(&vendorsListFindingsPage.pageSize, "page-size", 0, "Number of results to return")
	vendorsListFindingsCmd.Flags().StringVar(&vendorsListFindingsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	vendorsListFindingsCmd.Flags().StringVar(&vendorsListFindingsSecurityReviewID, "security-review-id", "", "Filter findings by security review ID")
	vendorsListFindingsCmd.Flags().StringVar(&vendorsListFindingsDocumentID, "document-id", "", "Filter findings by document ID")
	_ = vendorsListFindingsCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsCreateFindingCmd)
	vendorsCreateFindingCmd.Flags().StringVar(&vendorsCreateFindingVendorID, "id", "", "Vendor ID")
	vendorsCreateFindingCmd.Flags().StringVar(&vendorsCreateFindingJSON, "json", "", "Raw JSON payload")
	vendorsCreateFindingCmd.Flags().StringVar(&vendorsCreateFindingFile, "file", "", "Path to JSON payload file")
	_ = vendorsCreateFindingCmd.MarkFlagRequired("id")

	vendorsCmd.AddCommand(vendorsUpdateFindingCmd)
	vendorsUpdateFindingCmd.Flags().StringVar(&vendorsUpdateFindingVendorID, "id", "", "Vendor ID")
	vendorsUpdateFindingCmd.Flags().StringVar(&vendorsUpdateFindingFindingID, "finding-id", "", "Finding ID")
	vendorsUpdateFindingCmd.Flags().StringVar(&vendorsUpdateFindingJSON, "json", "", "Raw JSON payload")
	vendorsUpdateFindingCmd.Flags().StringVar(&vendorsUpdateFindingFile, "file", "", "Path to JSON payload file")
	_ = vendorsUpdateFindingCmd.MarkFlagRequired("id")
	_ = vendorsUpdateFindingCmd.MarkFlagRequired("finding-id")

	vendorsCmd.AddCommand(vendorsDeleteFindingCmd)
	vendorsDeleteFindingCmd.Flags().StringVar(&vendorsDeleteFindingVendorID, "id", "", "Vendor ID")
	vendorsDeleteFindingCmd.Flags().StringVar(&vendorsDeleteFindingFindingID, "finding-id", "", "Finding ID")
	_ = vendorsDeleteFindingCmd.MarkFlagRequired("id")
	_ = vendorsDeleteFindingCmd.MarkFlagRequired("finding-id")
}
