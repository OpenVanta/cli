package cmd

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	ohttp "github.com/ogen-go/ogen/http"
	"github.com/spf13/cobra"
)

var (
	documentsListPage            paginationFlags
	documentsListFrameworkFilter []string
	documentsListStatusFilter    []string
)

var documentsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List documents",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListDocumentsParams{}
		if documentsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(documentsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(documentsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		for _, framework := range documentsListFrameworkFilter {
			if trimmed := strings.TrimSpace(framework); trimmed != "" {
				params.FrameworkMatchesAny = append(params.FrameworkMatchesAny, trimmed)
			}
		}
		for _, status := range documentsListStatusFilter {
			if trimmed := strings.TrimSpace(status); trimmed != "" {
				params.StatusMatchesAny = append(params.StatusMatchesAny, vantaapi.DocumentStatus(trimmed))
			}
		}

		resp, err := client.ogen.ListDocuments(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var documentID string

var documentsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a document by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetDocument(
			cmd.Context(),
			vantaapi.GetDocumentParams{DocumentId: documentID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsCreateJSON string
	documentsCreateFile string
)

var documentsCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(documentsCreateJSON, documentsCreateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateDocumentInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateDocument(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var documentsDeleteID string

var documentsDeleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteDocument(
			cmd.Context(),
			vantaapi.DeleteDocumentParams{DocumentId: documentsDeleteID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	documentsSetOwnerID   string
	documentsSetOwnerJSON string
	documentsSetOwnerFile string
)

var documentsSetOwnerCmd = &cobra.Command{
	Use:   "set-owner",
	Short: "Set or clear a document owner",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(documentsSetOwnerJSON, documentsSetOwnerFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.SetOwnerForDocumentInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.SetOwnerForDocument(
			cmd.Context(),
			req,
			vantaapi.SetOwnerForDocumentParams{DocumentId: documentsSetOwnerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsListControlsID   string
	documentsListControlsPage paginationFlags
)

var documentsListControlsCmd = &cobra.Command{
	Use:   "list-controls",
	Short: "List controls for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListControlsForDocumentParams{
			DocumentId: documentsListControlsID,
		}
		if documentsListControlsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(documentsListControlsPage.pageSize))
		}
		if cursor := strings.TrimSpace(documentsListControlsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListControlsForDocument(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsListLinksID   string
	documentsListLinksPage paginationFlags
)

var documentsListLinksCmd = &cobra.Command{
	Use:   "list-links",
	Short: "List links for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListLinksForDocumentParams{
			DocumentId: documentsListLinksID,
		}
		if documentsListLinksPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(documentsListLinksPage.pageSize))
		}
		if cursor := strings.TrimSpace(documentsListLinksPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListLinksForDocument(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsCreateLinkID   string
	documentsCreateLinkJSON string
	documentsCreateLinkFile string
)

var documentsCreateLinkCmd = &cobra.Command{
	Use:   "create-link",
	Short: "Create a link for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(documentsCreateLinkJSON, documentsCreateLinkFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateLinkForDocumentInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateLinkForDocument(
			cmd.Context(),
			req,
			vantaapi.CreateLinkForDocumentParams{DocumentId: documentsCreateLinkID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsDeleteLinkID     string
	documentsDeleteLinkLinkID string
)

var documentsDeleteLinkCmd = &cobra.Command{
	Use:   "delete-link",
	Short: "Delete a link for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteLinkForDocument(
			cmd.Context(),
			vantaapi.DeleteLinkForDocumentParams{
				DocumentId: documentsDeleteLinkID,
				LinkId:     documentsDeleteLinkLinkID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	documentsListUploadsID   string
	documentsListUploadsPage paginationFlags
)

var documentsListUploadsCmd = &cobra.Command{
	Use:   "list-uploads",
	Short: "List uploaded files for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListFilesForDocumentParams{
			DocumentId: documentsListUploadsID,
		}
		if documentsListUploadsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(documentsListUploadsPage.pageSize))
		}
		if cursor := strings.TrimSpace(documentsListUploadsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListFilesForDocument(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsUploadID              string
	documentsUploadFilePath        string
	documentsUploadEffectiveAtDate string
	documentsUploadDescription     string
)

var documentsUploadCmd = &cobra.Command{
	Use:   "upload-file",
	Short: "Upload a file for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(documentsUploadFilePath) == "" {
			return fmt.Errorf("--file is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		file, err := os.Open(strings.TrimSpace(documentsUploadFilePath))
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.UploadFileForDocumentReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(strings.TrimSpace(documentsUploadFilePath)),
				File: file,
				Size: fileInfo.Size(),
			},
		}
		if effectiveAtDate := strings.TrimSpace(documentsUploadEffectiveAtDate); effectiveAtDate != "" {
			req.EffectiveAtDate.SetTo(effectiveAtDate)
		}
		if description := strings.TrimSpace(documentsUploadDescription); description != "" {
			req.Description.SetTo(description)
		}

		resp, err := client.ogen.UploadFileForDocument(
			cmd.Context(),
			req,
			vantaapi.UploadFileForDocumentParams{DocumentId: documentsUploadID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	documentsDeleteFileID     string
	documentsDeleteUploadedID string
)

var documentsDeleteFileCmd = &cobra.Command{
	Use:   "delete-file",
	Short: "Delete an uploaded file for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteFileForDocument(
			cmd.Context(),
			vantaapi.DeleteFileForDocumentParams{
				DocumentId:     documentsDeleteFileID,
				UploadedFileId: documentsDeleteUploadedID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	documentsDownloadFileID     string
	documentsDownloadUploadedID string
	documentsDownloadOutputPath string
)

var documentsDownloadCmd = &cobra.Command{
	Use:   "download-file",
	Short: "Download uploaded file media for a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetUploadedfileMedia(
			cmd.Context(),
			vantaapi.GetUploadedfileMediaParams{
				DocumentId:     documentsDownloadFileID,
				UploadedFileId: documentsDownloadUploadedID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}

		raw, err := documentsMediaToBytes(resp)
		if err != nil {
			return err
		}

		if strings.TrimSpace(documentsDownloadOutputPath) != "" {
			outputPath := strings.TrimSpace(documentsDownloadOutputPath)
			if err := os.WriteFile(outputPath, raw, 0o600); err != nil {
				return fmt.Errorf("write output file: %w", err)
			}
			fmt.Fprintf(cmd.OutOrStdout(), "Saved %d bytes to %s\n", len(raw), outputPath)
			return nil
		}

		if _, err := cmd.OutOrStdout().Write(raw); err != nil {
			return fmt.Errorf("write output: %w", err)
		}
		return nil
	},
}

var documentsSubmitID string

var documentsSubmitCmd = &cobra.Command{
	Use:   "submit",
	Short: "Submit document collection",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.SubmitDocumentCollection(
			cmd.Context(),
			vantaapi.SubmitDocumentCollectionParams{DocumentId: documentsSubmitID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func documentsMediaToBytes(resp vantaapi.GetUploadedfileMediaRes) ([]byte, error) {
	if reader, ok := resp.(io.Reader); ok {
		raw, err := io.ReadAll(reader)
		if err != nil {
			return nil, fmt.Errorf("read media response: %w", err)
		}
		return raw, nil
	}

	if jsonResp, ok := resp.(*vantaapi.GetUploadedfileMediaOKApplicationJSON); ok {
		return []byte(*jsonResp), nil
	}

	return nil, fmt.Errorf("unsupported media response type %T", resp)
}

func init() {
	documentsCmd.AddCommand(documentsListCmd)
	documentsListCmd.Flags().IntVar(&documentsListPage.pageSize, "page-size", 0, "Number of results to return")
	documentsListCmd.Flags().StringVar(&documentsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	documentsListCmd.Flags().StringSliceVar(&documentsListFrameworkFilter, "framework-matches-any", nil, "Framework IDs to filter by (repeatable)")
	documentsListCmd.Flags().StringSliceVar(&documentsListStatusFilter, "status-matches-any", nil, "Document statuses to filter by (repeatable)")

	documentsCmd.AddCommand(documentsGetCmd)
	documentsGetCmd.Flags().StringVar(&documentID, "id", "", "Document ID")
	_ = documentsGetCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsCreateCmd)
	documentsCreateCmd.Flags().StringVar(&documentsCreateJSON, "json", "", "Raw JSON payload")
	documentsCreateCmd.Flags().StringVar(&documentsCreateFile, "file", "", "Path to JSON payload file")

	documentsCmd.AddCommand(documentsDeleteCmd)
	documentsDeleteCmd.Flags().StringVar(&documentsDeleteID, "id", "", "Document ID")
	_ = documentsDeleteCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsSetOwnerCmd)
	documentsSetOwnerCmd.Flags().StringVar(&documentsSetOwnerID, "id", "", "Document ID")
	documentsSetOwnerCmd.Flags().StringVar(&documentsSetOwnerJSON, "json", "", "Raw JSON payload")
	documentsSetOwnerCmd.Flags().StringVar(&documentsSetOwnerFile, "file", "", "Path to JSON payload file")
	_ = documentsSetOwnerCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsListControlsCmd)
	documentsListControlsCmd.Flags().StringVar(&documentsListControlsID, "id", "", "Document ID")
	documentsListControlsCmd.Flags().IntVar(&documentsListControlsPage.pageSize, "page-size", 0, "Number of results to return")
	documentsListControlsCmd.Flags().StringVar(&documentsListControlsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = documentsListControlsCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsListLinksCmd)
	documentsListLinksCmd.Flags().StringVar(&documentsListLinksID, "id", "", "Document ID")
	documentsListLinksCmd.Flags().IntVar(&documentsListLinksPage.pageSize, "page-size", 0, "Number of results to return")
	documentsListLinksCmd.Flags().StringVar(&documentsListLinksPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = documentsListLinksCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsCreateLinkCmd)
	documentsCreateLinkCmd.Flags().StringVar(&documentsCreateLinkID, "id", "", "Document ID")
	documentsCreateLinkCmd.Flags().StringVar(&documentsCreateLinkJSON, "json", "", "Raw JSON payload")
	documentsCreateLinkCmd.Flags().StringVar(&documentsCreateLinkFile, "file", "", "Path to JSON payload file")
	_ = documentsCreateLinkCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsDeleteLinkCmd)
	documentsDeleteLinkCmd.Flags().StringVar(&documentsDeleteLinkID, "id", "", "Document ID")
	documentsDeleteLinkCmd.Flags().StringVar(&documentsDeleteLinkLinkID, "link-id", "", "Link ID")
	_ = documentsDeleteLinkCmd.MarkFlagRequired("id")
	_ = documentsDeleteLinkCmd.MarkFlagRequired("link-id")

	documentsCmd.AddCommand(documentsListUploadsCmd)
	documentsListUploadsCmd.Flags().StringVar(&documentsListUploadsID, "id", "", "Document ID")
	documentsListUploadsCmd.Flags().IntVar(&documentsListUploadsPage.pageSize, "page-size", 0, "Number of results to return")
	documentsListUploadsCmd.Flags().StringVar(&documentsListUploadsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = documentsListUploadsCmd.MarkFlagRequired("id")

	documentsCmd.AddCommand(documentsUploadCmd)
	documentsUploadCmd.Flags().StringVar(&documentsUploadID, "id", "", "Document ID")
	documentsUploadCmd.Flags().StringVar(&documentsUploadFilePath, "file", "", "Path to file to upload")
	documentsUploadCmd.Flags().StringVar(&documentsUploadEffectiveAtDate, "effective-at-date", "", "Effective date for the uploaded file")
	documentsUploadCmd.Flags().StringVar(&documentsUploadDescription, "description", "", "Description for the uploaded file")
	_ = documentsUploadCmd.MarkFlagRequired("id")
	_ = documentsUploadCmd.MarkFlagRequired("file")

	documentsCmd.AddCommand(documentsDeleteFileCmd)
	documentsDeleteFileCmd.Flags().StringVar(&documentsDeleteFileID, "id", "", "Document ID")
	documentsDeleteFileCmd.Flags().StringVar(&documentsDeleteUploadedID, "uploaded-file-id", "", "Uploaded file ID")
	_ = documentsDeleteFileCmd.MarkFlagRequired("id")
	_ = documentsDeleteFileCmd.MarkFlagRequired("uploaded-file-id")

	documentsCmd.AddCommand(documentsDownloadCmd)
	documentsDownloadCmd.Flags().StringVar(&documentsDownloadFileID, "id", "", "Document ID")
	documentsDownloadCmd.Flags().StringVar(&documentsDownloadUploadedID, "uploaded-file-id", "", "Uploaded file ID")
	documentsDownloadCmd.Flags().StringVar(&documentsDownloadOutputPath, "output", "", "Write downloaded bytes to file path (default stdout)")
	_ = documentsDownloadCmd.MarkFlagRequired("id")
	_ = documentsDownloadCmd.MarkFlagRequired("uploaded-file-id")

	documentsCmd.AddCommand(documentsSubmitCmd)
	documentsSubmitCmd.Flags().StringVar(&documentsSubmitID, "id", "", "Document ID")
	_ = documentsSubmitCmd.MarkFlagRequired("id")
}
