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
	knowledgeBaseListResourcesPage              paginationFlags
	knowledgeBaseListResourcesQ                 string
	knowledgeBaseListResourcesTypeMatchesAny    []string
	knowledgeBaseListResourcesLastUpdatedAfter  string
	knowledgeBaseListResourcesLastUpdatedBefore string
	knowledgeBaseListResourcesMatchesTags       string
	knowledgeBaseListResourcesExpiresBefore     string
	knowledgeBaseListResourcesExpiresAfter      string
)

var knowledgeBaseListResourcesCmd = &cobra.Command{
	Use:   "list-resources",
	Short: "List knowledge base resources",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListKnowledgeBaseResourcesParams{}
		if knowledgeBaseListResourcesPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(knowledgeBaseListResourcesPage.pageSize))
		}
		if cursor := strings.TrimSpace(knowledgeBaseListResourcesPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if q := strings.TrimSpace(knowledgeBaseListResourcesQ); q != "" {
			params.Q.SetTo(q)
		}
		for _, typeRaw := range knowledgeBaseListResourcesTypeMatchesAny {
			trimmed := strings.TrimSpace(typeRaw)
			if trimmed == "" {
				continue
			}
			resourceType := vantaapi.KnowledgeBaseResourceTypeFilter(trimmed)
			if err := resourceType.Validate(); err != nil {
				return fmt.Errorf(`invalid --type-matches-any %q (expected "FILE" or "URL")`, trimmed)
			}
			params.TypeMatchesAny = append(params.TypeMatchesAny, resourceType)
		}
		if v := strings.TrimSpace(knowledgeBaseListResourcesLastUpdatedAfter); v != "" {
			params.LastUpdatedAfter.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListResourcesLastUpdatedBefore); v != "" {
			params.LastUpdatedBefore.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListResourcesMatchesTags); v != "" {
			params.MatchesTags.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListResourcesExpiresBefore); v != "" {
			params.ExpiresBefore.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseListResourcesExpiresAfter); v != "" {
			params.ExpiresAfter.SetTo(v)
		}

		resp, err := client.ogen.ListKnowledgeBaseResources(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var knowledgeBaseGetResourceID string

var knowledgeBaseGetResourceCmd = &cobra.Command{
	Use:   "get-resource",
	Short: "Get a knowledge base resource by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetKnowledgeBaseResource(
			cmd.Context(),
			vantaapi.GetKnowledgeBaseResourceParams{ID: knowledgeBaseGetResourceID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var knowledgeBaseDeleteResourceID string

var knowledgeBaseDeleteResourceCmd = &cobra.Command{
	Use:   "delete-resource",
	Short: "Delete a knowledge base resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteKnowledgeBaseResource(
			cmd.Context(),
			vantaapi.DeleteKnowledgeBaseResourceParams{ID: knowledgeBaseDeleteResourceID},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	knowledgeBaseVerifyResourceID   string
	knowledgeBaseVerifyResourceJSON string
	knowledgeBaseVerifyResourceFile string
)

var knowledgeBaseVerifyResourceCmd = &cobra.Command{
	Use:   "verify-resource",
	Short: "Verify a knowledge base resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		var body vantaapi.OptVerifyKnowledgeBaseResourceInput
		if strings.TrimSpace(knowledgeBaseVerifyResourceJSON) != "" || strings.TrimSpace(knowledgeBaseVerifyResourceFile) != "" {
			payload, err := readJSONPayload(knowledgeBaseVerifyResourceJSON, knowledgeBaseVerifyResourceFile)
			if err != nil {
				return err
			}
			req, err := decodeRequestPayload[vantaapi.VerifyKnowledgeBaseResourceInput](payload)
			if err != nil {
				return err
			}
			body.SetTo(*req)
		}

		resp, err := client.ogen.VerifyKnowledgeBaseResource(
			cmd.Context(),
			body,
			vantaapi.VerifyKnowledgeBaseResourceParams{ID: knowledgeBaseVerifyResourceID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseCreateDocumentResourceFilePath               string
	knowledgeBaseCreateDocumentResourceTitle                  string
	knowledgeBaseCreateDocumentResourceDescription            string
	knowledgeBaseCreateDocumentResourceOwnerAssignment        string
	knowledgeBaseCreateDocumentResourceCustomerVisibility     string
	knowledgeBaseCreateDocumentResourceDownloadPermission     string
	knowledgeBaseCreateDocumentResourceIsUsedInQuestionnaires string
	knowledgeBaseCreateDocumentResourceExpirationDate         string
	knowledgeBaseCreateDocumentResourceTags                   string
	knowledgeBaseCreateDocumentResourceCategoryID             string
)

var knowledgeBaseCreateDocumentResourceCmd = &cobra.Command{
	Use:   "create-document-resource",
	Short: "Create a document resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(knowledgeBaseCreateDocumentResourceFilePath) == "" {
			return fmt.Errorf("--file is required")
		}
		if strings.TrimSpace(knowledgeBaseCreateDocumentResourceTitle) == "" {
			return fmt.Errorf("--title is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(knowledgeBaseCreateDocumentResourceFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.CreateDocumentResourceReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
			Title: strings.TrimSpace(knowledgeBaseCreateDocumentResourceTitle),
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceDescription); v != "" {
			req.Description.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceOwnerAssignment); v != "" {
			req.OwnerAssignment.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceCustomerVisibility); v != "" {
			req.CustomerVisibility.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceDownloadPermission); v != "" {
			req.DownloadPermission.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceIsUsedInQuestionnaires); v != "" {
			req.IsUsedInQuestionnaires.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceExpirationDate); v != "" {
			req.ExpirationDate.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceTags); v != "" {
			req.Tags.SetTo(v)
		}
		if v := strings.TrimSpace(knowledgeBaseCreateDocumentResourceCategoryID); v != "" {
			req.CategoryId.SetTo(v)
		}

		resp, err := client.ogen.CreateDocumentResource(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseUpdateDocumentResourceID   string
	knowledgeBaseUpdateDocumentResourceJSON string
	knowledgeBaseUpdateDocumentResourceFile string
)

var knowledgeBaseUpdateDocumentResourceCmd = &cobra.Command{
	Use:   "update-document-resource",
	Short: "Update a document resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(knowledgeBaseUpdateDocumentResourceJSON, knowledgeBaseUpdateDocumentResourceFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateDocumentResourceInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateDocumentResource(
			cmd.Context(),
			req,
			vantaapi.UpdateDocumentResourceParams{ID: knowledgeBaseUpdateDocumentResourceID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseReplaceDocumentResourceFileID       string
	knowledgeBaseReplaceDocumentResourceFileFilePath string
)

var knowledgeBaseReplaceDocumentResourceFileCmd = &cobra.Command{
	Use:   "replace-document-resource-file",
	Short: "Replace the file backing a document resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(knowledgeBaseReplaceDocumentResourceFileFilePath) == "" {
			return fmt.Errorf("--file is required")
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(knowledgeBaseReplaceDocumentResourceFileFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.ReplaceDocumentResourceFileReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
		}

		resp, err := client.ogen.ReplaceDocumentResourceFile(
			cmd.Context(),
			req,
			vantaapi.ReplaceDocumentResourceFileParams{ID: knowledgeBaseReplaceDocumentResourceFileID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseCreateWebpageResourceJSON string
	knowledgeBaseCreateWebpageResourceFile string
)

var knowledgeBaseCreateWebpageResourceCmd = &cobra.Command{
	Use:   "create-webpage-resource",
	Short: "Create a webpage resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(knowledgeBaseCreateWebpageResourceJSON, knowledgeBaseCreateWebpageResourceFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.CreateWebpageResourceInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.CreateWebpageResource(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	knowledgeBaseUpdateWebpageResourceID   string
	knowledgeBaseUpdateWebpageResourceJSON string
	knowledgeBaseUpdateWebpageResourceFile string
)

var knowledgeBaseUpdateWebpageResourceCmd = &cobra.Command{
	Use:   "update-webpage-resource",
	Short: "Update a webpage resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(knowledgeBaseUpdateWebpageResourceJSON, knowledgeBaseUpdateWebpageResourceFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		req, err := decodeRequestPayload[vantaapi.UpdateWebpageResourceInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateWebpageResource(
			cmd.Context(),
			req,
			vantaapi.UpdateWebpageResourceParams{ID: knowledgeBaseUpdateWebpageResourceID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	knowledgeBaseCmd.AddCommand(knowledgeBaseListResourcesCmd)
	knowledgeBaseListResourcesCmd.Flags().IntVar(&knowledgeBaseListResourcesPage.pageSize, "page-size", 0, "Number of results to return")
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesPage.pageCursor, "page-cursor", "", "Pagination cursor")
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesQ, "q", "", "Full-text search across resource titles")
	knowledgeBaseListResourcesCmd.Flags().StringSliceVar(&knowledgeBaseListResourcesTypeMatchesAny, "type-matches-any", nil, `Resource types to filter by (repeatable): FILE, URL`)
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesLastUpdatedAfter, "last-updated-after", "", "Only include resources updated at or after this ISO 8601 timestamp")
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesLastUpdatedBefore, "last-updated-before", "", "Only include resources updated at or before this ISO 8601 timestamp")
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesMatchesTags, "matches-tags", "", `JSON-encoded array of {"categoryId","tagId"} pairs to filter by`)
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesExpiresBefore, "expires-before", "", "Only include resources expiring at or before this ISO 8601 timestamp")
	knowledgeBaseListResourcesCmd.Flags().StringVar(&knowledgeBaseListResourcesExpiresAfter, "expires-after", "", "Only include resources expiring at or after this ISO 8601 timestamp")

	knowledgeBaseCmd.AddCommand(knowledgeBaseGetResourceCmd)
	knowledgeBaseGetResourceCmd.Flags().StringVar(&knowledgeBaseGetResourceID, "id", "", "Knowledge base resource ID")
	_ = knowledgeBaseGetResourceCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseDeleteResourceCmd)
	knowledgeBaseDeleteResourceCmd.Flags().StringVar(&knowledgeBaseDeleteResourceID, "id", "", "Knowledge base resource ID")
	_ = knowledgeBaseDeleteResourceCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseVerifyResourceCmd)
	knowledgeBaseVerifyResourceCmd.Flags().StringVar(&knowledgeBaseVerifyResourceID, "id", "", "Knowledge base resource ID")
	knowledgeBaseVerifyResourceCmd.Flags().StringVar(&knowledgeBaseVerifyResourceJSON, "json", "", "Raw JSON payload (optional; VerifyKnowledgeBaseResourceInput)")
	knowledgeBaseVerifyResourceCmd.Flags().StringVar(&knowledgeBaseVerifyResourceFile, "file", "", "Path to JSON payload file (optional; VerifyKnowledgeBaseResourceInput)")
	_ = knowledgeBaseVerifyResourceCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseCreateDocumentResourceCmd)
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceFilePath, "file", "", "Path to file to upload")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceTitle, "title", "", "Document resource title")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceDescription, "description", "", "Document resource description")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceOwnerAssignment, "owner-assignment", "", `Owner to assign as a JSON string: {"type":"User","id":"<id>"}`)
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceCustomerVisibility, "customer-visibility", "", "Trust Center visibility: PRIVATE | SHAREABLE | REQUEST_ACCESS | PUBLIC")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceDownloadPermission, "download-permission", "", "Trust Center download permission: VIEW_ONLY | VIEW_AND_DOWNLOAD")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceIsUsedInQuestionnaires, "is-used-in-questionnaires", "", "Whether to use this resource for Questionnaire Automation (true|false)")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceExpirationDate, "expiration-date", "", "Expiration date in ISO 8601 format")
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceTags, "tags", "", `Tags as a JSON array: [{"categoryId":"<id>","tagId":"<id>"}]`)
	knowledgeBaseCreateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseCreateDocumentResourceCategoryID, "category-id", "", "Trust Center category ID to associate this resource with")
	_ = knowledgeBaseCreateDocumentResourceCmd.MarkFlagRequired("file")
	_ = knowledgeBaseCreateDocumentResourceCmd.MarkFlagRequired("title")

	knowledgeBaseCmd.AddCommand(knowledgeBaseUpdateDocumentResourceCmd)
	knowledgeBaseUpdateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseUpdateDocumentResourceID, "id", "", "Document resource ID")
	knowledgeBaseUpdateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseUpdateDocumentResourceJSON, "json", "", "Raw JSON payload")
	knowledgeBaseUpdateDocumentResourceCmd.Flags().StringVar(&knowledgeBaseUpdateDocumentResourceFile, "file", "", "Path to JSON payload file")
	_ = knowledgeBaseUpdateDocumentResourceCmd.MarkFlagRequired("id")

	knowledgeBaseCmd.AddCommand(knowledgeBaseReplaceDocumentResourceFileCmd)
	knowledgeBaseReplaceDocumentResourceFileCmd.Flags().StringVar(&knowledgeBaseReplaceDocumentResourceFileID, "id", "", "Document resource ID")
	knowledgeBaseReplaceDocumentResourceFileCmd.Flags().StringVar(&knowledgeBaseReplaceDocumentResourceFileFilePath, "file", "", "Path to the new file to upload")
	_ = knowledgeBaseReplaceDocumentResourceFileCmd.MarkFlagRequired("id")
	_ = knowledgeBaseReplaceDocumentResourceFileCmd.MarkFlagRequired("file")

	knowledgeBaseCmd.AddCommand(knowledgeBaseCreateWebpageResourceCmd)
	knowledgeBaseCreateWebpageResourceCmd.Flags().StringVar(&knowledgeBaseCreateWebpageResourceJSON, "json", "", "Raw JSON payload")
	knowledgeBaseCreateWebpageResourceCmd.Flags().StringVar(&knowledgeBaseCreateWebpageResourceFile, "file", "", "Path to JSON payload file")

	knowledgeBaseCmd.AddCommand(knowledgeBaseUpdateWebpageResourceCmd)
	knowledgeBaseUpdateWebpageResourceCmd.Flags().StringVar(&knowledgeBaseUpdateWebpageResourceID, "id", "", "Webpage resource ID")
	knowledgeBaseUpdateWebpageResourceCmd.Flags().StringVar(&knowledgeBaseUpdateWebpageResourceJSON, "json", "", "Raw JSON payload")
	knowledgeBaseUpdateWebpageResourceCmd.Flags().StringVar(&knowledgeBaseUpdateWebpageResourceFile, "file", "", "Path to JSON payload file")
	_ = knowledgeBaseUpdateWebpageResourceCmd.MarkFlagRequired("id")
}
