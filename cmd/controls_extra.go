package cmd

import (
	"net/http"
	"net/url"

	"github.com/spf13/cobra"
)

var (
	controlsAddFromLibraryJSON string
	controlsAddFromLibraryFile string
)

var controlsAddFromLibraryCmd = &cobra.Command{
	Use:   "add-from-library",
	Short: "Add a control from the Vanta library",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlsAddFromLibraryJSON, controlsAddFromLibraryFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.request(cmd, http.MethodPost, "/controls/add-from-library", payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsUpdateID   string
	controlsUpdateJSON string
	controlsUpdateFile string
)

var controlsUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update control metadata",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlsUpdateJSON, controlsUpdateFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsUpdateID)
		resp, err := client.request(cmd, http.MethodPatch, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var controlsDeleteID string

var controlsDeleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsDeleteID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsSetOwnerID   string
	controlsSetOwnerJSON string
	controlsSetOwnerFile string
)

var controlsSetOwnerCmd = &cobra.Command{
	Use:   "set-owner",
	Short: "Set or clear a control owner",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlsSetOwnerJSON, controlsSetOwnerFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsSetOwnerID) + "/set-owner"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var controlsLibraryPage paginationFlags

var controlsListLibraryCmd = &cobra.Command{
	Use:   "list-library",
	Short: "List controls from the Vanta library",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		controlsLibraryPage.apply(query)
		resp, err := client.requestWithQuery(cmd, http.MethodGet, "/controls/controls-library", query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsListDocumentsID   string
	controlsListDocumentsPage paginationFlags
)

var controlsListDocumentsCmd = &cobra.Command{
	Use:   "list-documents",
	Short: "List documents for a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		controlsListDocumentsPage.apply(query)
		path := "/controls/" + url.PathEscape(controlsListDocumentsID) + "/documents"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsListTestsID   string
	controlsListTestsPage paginationFlags
)

var controlsListTestsCmd = &cobra.Command{
	Use:   "list-tests",
	Short: "List tests for a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		query := url.Values{}
		controlsListTestsPage.apply(query)
		path := "/controls/" + url.PathEscape(controlsListTestsID) + "/tests"
		resp, err := client.requestWithQuery(cmd, http.MethodGet, path, query, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsAddDocumentID   string
	controlsAddDocumentJSON string
	controlsAddDocumentFile string
)

var controlsAddDocumentCmd = &cobra.Command{
	Use:   "add-document",
	Short: "Add a document mapping to a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlsAddDocumentJSON, controlsAddDocumentFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsAddDocumentID) + "/add-document-to-control"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsRemoveDocumentID         string
	controlsRemoveDocumentDocumentID string
)

var controlsRemoveDocumentCmd = &cobra.Command{
	Use:   "remove-document",
	Short: "Remove a document mapping from a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsRemoveDocumentID) + "/documents/" + url.PathEscape(controlsRemoveDocumentDocumentID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsAddTestID   string
	controlsAddTestJSON string
	controlsAddTestFile string
)

var controlsAddTestCmd = &cobra.Command{
	Use:   "add-test",
	Short: "Add a test mapping to a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(controlsAddTestJSON, controlsAddTestFile)
		if err != nil {
			return err
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsAddTestID) + "/add-test-to-control"
		resp, err := client.request(cmd, http.MethodPost, path, payload)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

var (
	controlsRemoveTestID     string
	controlsRemoveTestTestID string
)

var controlsRemoveTestCmd = &cobra.Command{
	Use:   "remove-test",
	Short: "Remove a test mapping from a control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		path := "/controls/" + url.PathEscape(controlsRemoveTestID) + "/tests/" + url.PathEscape(controlsRemoveTestTestID)
		resp, err := client.request(cmd, http.MethodDelete, path, nil)
		if err != nil {
			return err
		}
		return printJSON(cmd, resp)
	},
}

func init() {
	controlsCmd.AddCommand(controlsAddFromLibraryCmd)
	controlsAddFromLibraryCmd.Flags().StringVar(&controlsAddFromLibraryJSON, "json", "", "Raw JSON payload")
	controlsAddFromLibraryCmd.Flags().StringVar(&controlsAddFromLibraryFile, "file", "", "Path to JSON payload file")

	controlsCmd.AddCommand(controlsUpdateCmd)
	controlsUpdateCmd.Flags().StringVar(&controlsUpdateID, "id", "", "Control ID")
	controlsUpdateCmd.Flags().StringVar(&controlsUpdateJSON, "json", "", "Raw JSON payload")
	controlsUpdateCmd.Flags().StringVar(&controlsUpdateFile, "file", "", "Path to JSON payload file")
	_ = controlsUpdateCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsDeleteCmd)
	controlsDeleteCmd.Flags().StringVar(&controlsDeleteID, "id", "", "Control ID")
	_ = controlsDeleteCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsSetOwnerCmd)
	controlsSetOwnerCmd.Flags().StringVar(&controlsSetOwnerID, "id", "", "Control ID")
	controlsSetOwnerCmd.Flags().StringVar(&controlsSetOwnerJSON, "json", "", "Raw JSON payload")
	controlsSetOwnerCmd.Flags().StringVar(&controlsSetOwnerFile, "file", "", "Path to JSON payload file")
	_ = controlsSetOwnerCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsListLibraryCmd)
	controlsListLibraryCmd.Flags().IntVar(&controlsLibraryPage.pageSize, "page-size", 0, "Number of results to return")
	controlsListLibraryCmd.Flags().StringVar(&controlsLibraryPage.pageCursor, "page-cursor", "", "Pagination cursor")

	controlsCmd.AddCommand(controlsListDocumentsCmd)
	controlsListDocumentsCmd.Flags().StringVar(&controlsListDocumentsID, "id", "", "Control ID")
	controlsListDocumentsCmd.Flags().IntVar(&controlsListDocumentsPage.pageSize, "page-size", 0, "Number of results to return")
	controlsListDocumentsCmd.Flags().StringVar(&controlsListDocumentsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = controlsListDocumentsCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsListTestsCmd)
	controlsListTestsCmd.Flags().StringVar(&controlsListTestsID, "id", "", "Control ID")
	controlsListTestsCmd.Flags().IntVar(&controlsListTestsPage.pageSize, "page-size", 0, "Number of results to return")
	controlsListTestsCmd.Flags().StringVar(&controlsListTestsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = controlsListTestsCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsAddDocumentCmd)
	controlsAddDocumentCmd.Flags().StringVar(&controlsAddDocumentID, "id", "", "Control ID")
	controlsAddDocumentCmd.Flags().StringVar(&controlsAddDocumentJSON, "json", "", "Raw JSON payload")
	controlsAddDocumentCmd.Flags().StringVar(&controlsAddDocumentFile, "file", "", "Path to JSON payload file")
	_ = controlsAddDocumentCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsRemoveDocumentCmd)
	controlsRemoveDocumentCmd.Flags().StringVar(&controlsRemoveDocumentID, "id", "", "Control ID")
	controlsRemoveDocumentCmd.Flags().StringVar(&controlsRemoveDocumentDocumentID, "document-id", "", "Document ID")
	_ = controlsRemoveDocumentCmd.MarkFlagRequired("id")
	_ = controlsRemoveDocumentCmd.MarkFlagRequired("document-id")

	controlsCmd.AddCommand(controlsAddTestCmd)
	controlsAddTestCmd.Flags().StringVar(&controlsAddTestID, "id", "", "Control ID")
	controlsAddTestCmd.Flags().StringVar(&controlsAddTestJSON, "json", "", "Raw JSON payload")
	controlsAddTestCmd.Flags().StringVar(&controlsAddTestFile, "file", "", "Path to JSON payload file")
	_ = controlsAddTestCmd.MarkFlagRequired("id")

	controlsCmd.AddCommand(controlsRemoveTestCmd)
	controlsRemoveTestCmd.Flags().StringVar(&controlsRemoveTestID, "id", "", "Control ID")
	controlsRemoveTestCmd.Flags().StringVar(&controlsRemoveTestTestID, "test-id", "", "Test ID")
	_ = controlsRemoveTestCmd.MarkFlagRequired("id")
	_ = controlsRemoveTestCmd.MarkFlagRequired("test-id")
}
