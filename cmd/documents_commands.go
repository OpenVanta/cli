package cmd

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

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

		query := url.Values{}
		documentsListPage.apply(query)
		for _, framework := range documentsListFrameworkFilter {
			if strings.TrimSpace(framework) != "" {
				query.Add("frameworkMatchesAny", strings.TrimSpace(framework))
			}
		}
		for _, status := range documentsListStatusFilter {
			if strings.TrimSpace(status) != "" {
				query.Add("statusMatchesAny", strings.TrimSpace(status))
			}
		}

		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/documents", query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		resp, err := client.request(cmd, http.MethodPost, "/documents", payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsDeleteID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsSetOwnerID) + "/set-owner"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		query := url.Values{}
		documentsListControlsPage.apply(query)
		path := "/documents/" + url.PathEscape(documentsListControlsID) + "/controls"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		query := url.Values{}
		documentsListLinksPage.apply(query)
		path := "/documents/" + url.PathEscape(documentsListLinksID) + "/links"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsCreateLinkID) + "/links"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsDeleteLinkID) + "/links/" + url.PathEscape(documentsDeleteLinkLinkID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		query := url.Values{}
		documentsListUploadsPage.apply(query)
		path := "/documents/" + url.PathEscape(documentsListUploadsID) + "/uploads"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		var body bytes.Buffer
		writer := multipart.NewWriter(&body)

		part, err := writer.CreateFormFile("file", filepath.Base(strings.TrimSpace(documentsUploadFilePath)))
		if err != nil {
			return fmt.Errorf("create multipart file part: %w", err)
		}
		if _, err := io.Copy(part, file); err != nil {
			return fmt.Errorf("copy upload file: %w", err)
		}

		if strings.TrimSpace(documentsUploadEffectiveAtDate) != "" {
			if err := writer.WriteField("effectiveAtDate", strings.TrimSpace(documentsUploadEffectiveAtDate)); err != nil {
				return fmt.Errorf("write effectiveAtDate field: %w", err)
			}
		}
		if strings.TrimSpace(documentsUploadDescription) != "" {
			if err := writer.WriteField("description", strings.TrimSpace(documentsUploadDescription)); err != nil {
				return fmt.Errorf("write description field: %w", err)
			}
		}

		if err := writer.Close(); err != nil {
			return fmt.Errorf("finalize multipart body: %w", err)
		}

		path := "/documents/" + url.PathEscape(documentsUploadID) + "/uploads"
		resp, err := documentsRequestMultipart(cmd, client, http.MethodPost, path, body.Bytes(), writer.FormDataContentType())
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsDeleteFileID) + "/uploads/" + url.PathEscape(documentsDeleteUploadedID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/documents/" + url.PathEscape(documentsDownloadFileID) + "/uploads/" + url.PathEscape(documentsDownloadUploadedID) + "/media"
		raw, err := documentsRequestMedia(cmd, client, http.MethodGet, path)
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

		path := "/documents/" + url.PathEscape(documentsSubmitID) + "/submit"
		resp, err := client.request(cmd, http.MethodPost, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

func documentsRequestMultipart(cmd *cobra.Command, client *apiClient, method, path string, body []byte, contentType string) ([]byte, error) {
	endpoint := client.baseURL + path
	if client.dryRun {
		fmt.Fprintf(cmd.OutOrStdout(), "DRY RUN %s %s\n", method, endpoint)
		fmt.Fprintln(cmd.OutOrStdout(), "<multipart/form-data omitted>")
		return nil, nil
	}

	req, err := http.NewRequestWithContext(cmd.Context(), method, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+client.token)
	req.Header.Set("Content-Type", contentType)

	resp, err := client.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("api error (%d): %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	return raw, nil
}

func documentsRequestMedia(cmd *cobra.Command, client *apiClient, method, path string) ([]byte, error) {
	endpoint := client.baseURL + path
	if client.dryRun {
		fmt.Fprintf(cmd.OutOrStdout(), "DRY RUN %s %s\n", method, endpoint)
		return nil, nil
	}

	req, err := http.NewRequestWithContext(cmd.Context(), method, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+client.token)

	resp, err := client.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("api error (%d): %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	return raw, nil
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
