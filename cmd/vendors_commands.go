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

		query := url.Values{}
		vendorsListPage.apply(query)
		if strings.TrimSpace(vendorsListNameFilter) != "" {
			query.Set("name", strings.TrimSpace(vendorsListNameFilter))
		}
		for _, status := range vendorsListStatusFilters {
			if strings.TrimSpace(status) != "" {
				query.Add("statusMatchesAny", strings.TrimSpace(status))
			}
		}

		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/vendors", query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		path := "/vendors/" + url.PathEscape(vendorsGetID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		resp, err := client.request(cmd, http.MethodPost, "/vendors", payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsUpdateID)
		resp, err := client.request(cmd, http.MethodPatch, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsDeleteID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		body, contentType, err := vendorsBuildMultipartBody("", map[string]string{
			"status": strings.TrimSpace(vendorsSetStatusStatus),
		})
		if err != nil {
			return err
		}
		path := "/vendors/" + url.PathEscape(vendorsSetStatusID) + "/set-status"
		resp, err := vendorsRequestMultipart(cmd, client, http.MethodPost, path, body, contentType)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		query := url.Values{}
		vendorsListDocumentsPage.apply(query)
		path := "/vendors/" + url.PathEscape(vendorsListDocumentsID) + "/documents"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		fields := map[string]string{
			"type": strings.TrimSpace(vendorsUploadDocumentType),
		}
		if strings.TrimSpace(vendorsUploadDocumentTitle) != "" {
			fields["title"] = strings.TrimSpace(vendorsUploadDocumentTitle)
		}
		if strings.TrimSpace(vendorsUploadDocumentDescription) != "" {
			fields["description"] = strings.TrimSpace(vendorsUploadDocumentDescription)
		}
		body, contentType, err := vendorsBuildMultipartBody(strings.TrimSpace(vendorsUploadDocumentFilePath), fields)
		if err != nil {
			return err
		}

		path := "/vendors/" + url.PathEscape(vendorsUploadDocumentID) + "/documents"
		resp, err := vendorsRequestMultipart(cmd, client, http.MethodPost, path, body, contentType)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		query := url.Values{}
		vendorsListSecurityReviewsPage.apply(query)
		path := "/vendors/" + url.PathEscape(vendorsListSecurityReviewsID) + "/security-reviews"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsGetSecurityReviewVendorID) + "/security-reviews/" + url.PathEscape(vendorsGetSecurityReviewID)
		resp, err := client.request(cmd, http.MethodGet, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		query := url.Values{}
		vendorsListSecurityReviewDocsPage.apply(query)
		path := "/vendors/" + url.PathEscape(vendorsListSecurityReviewDocsVendorID) + "/security-reviews/" + url.PathEscape(vendorsListSecurityReviewDocsReviewID) + "/documents"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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

		fields := map[string]string{
			"type": strings.TrimSpace(vendorsUploadSecurityReviewDocType),
		}
		if strings.TrimSpace(vendorsUploadSecurityReviewDocTitle) != "" {
			fields["title"] = strings.TrimSpace(vendorsUploadSecurityReviewDocTitle)
		}
		if strings.TrimSpace(vendorsUploadSecurityReviewDocDescription) != "" {
			fields["description"] = strings.TrimSpace(vendorsUploadSecurityReviewDocDescription)
		}
		body, contentType, err := vendorsBuildMultipartBody(strings.TrimSpace(vendorsUploadSecurityReviewDocFilePath), fields)
		if err != nil {
			return err
		}

		path := "/vendors/" + url.PathEscape(vendorsUploadSecurityReviewDocVendorID) + "/security-reviews/" + url.PathEscape(vendorsUploadSecurityReviewDocReviewID) + "/documents"
		resp, err := vendorsRequestMultipart(cmd, client, http.MethodPost, path, body, contentType)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsDeleteSecurityReviewDocVendorID) + "/security-reviews/" + url.PathEscape(vendorsDeleteSecurityReviewDocReviewID) + "/documents/" + url.PathEscape(vendorsDeleteSecurityReviewDocDocumentID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		query := url.Values{}
		vendorsListFindingsPage.apply(query)
		if strings.TrimSpace(vendorsListFindingsSecurityReviewID) != "" {
			query.Set("securityReviewId", strings.TrimSpace(vendorsListFindingsSecurityReviewID))
		}
		if strings.TrimSpace(vendorsListFindingsDocumentID) != "" {
			query.Set("documentId", strings.TrimSpace(vendorsListFindingsDocumentID))
		}
		path := "/vendors/" + url.PathEscape(vendorsListFindingsVendorID) + "/findings"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsCreateFindingVendorID) + "/findings"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsUpdateFindingVendorID) + "/findings/" + url.PathEscape(vendorsUpdateFindingFindingID)
		resp, err := client.request(cmd, http.MethodPatch, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
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
		path := "/vendors/" + url.PathEscape(vendorsDeleteFindingVendorID) + "/findings/" + url.PathEscape(vendorsDeleteFindingFindingID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

func vendorsBuildMultipartBody(filePath string, fields map[string]string) ([]byte, string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	if strings.TrimSpace(filePath) != "" {
		file, err := os.Open(strings.TrimSpace(filePath))
		if err != nil {
			return nil, "", fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		part, err := writer.CreateFormFile("file", filepath.Base(strings.TrimSpace(filePath)))
		if err != nil {
			return nil, "", fmt.Errorf("create multipart file part: %w", err)
		}
		if _, err := io.Copy(part, file); err != nil {
			return nil, "", fmt.Errorf("copy upload file: %w", err)
		}
	}

	for k, v := range fields {
		if strings.TrimSpace(v) == "" {
			continue
		}
		if err := writer.WriteField(k, strings.TrimSpace(v)); err != nil {
			return nil, "", fmt.Errorf("write multipart field %s: %w", k, err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, "", fmt.Errorf("finalize multipart body: %w", err)
	}
	return body.Bytes(), writer.FormDataContentType(), nil
}

func vendorsRequestMultipart(cmd *cobra.Command, client *apiClient, method, path string, body []byte, contentType string) ([]byte, error) {
	endpoint := client.baseURL + path
	if client.dryRun {
		fmt.Fprintf(cmd.OutOrStdout(), "DRY RUN %s %s\n", method, endpoint)
		fmt.Fprintln(cmd.OutOrStdout(), "<multipart/form-data omitted>")
		return nil, nil
	}

	req, err := client.newRequest(cmd.Context(), method, endpoint, bytes.NewReader(body), contentType)
	if err != nil {
		return nil, err
	}

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
