package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
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

		req, err := decodeRequestPayload[vantaapi.AddControlFromLibraryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddControlFromLibrary(cmd.Context(), req)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		req, err := decodeRequestPayload[vantaapi.EditControlMetadataInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateControlMetadata(
			cmd.Context(),
			req,
			vantaapi.UpdateControlMetadataParams{ControlId: controlsUpdateID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		if err := client.ogen.DeleteControl(cmd.Context(), vantaapi.DeleteControlParams{ControlId: controlsDeleteID}); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
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

		req, err := decodeRequestPayload[vantaapi.SetOwnerForControlInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.SetOwnerForControl(
			cmd.Context(),
			req,
			vantaapi.SetOwnerForControlParams{ControlId: controlsSetOwnerID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		params := vantaapi.ListLibraryControlsParams{}
		if controlsLibraryPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(controlsLibraryPage.pageSize))
		}
		if cursor := strings.TrimSpace(controlsLibraryPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListLibraryControls(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		params := vantaapi.ListDocumentsForControlParams{
			ControlId: controlsListDocumentsID,
		}
		if controlsListDocumentsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(controlsListDocumentsPage.pageSize))
		}
		if cursor := strings.TrimSpace(controlsListDocumentsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListDocumentsForControl(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		params := vantaapi.ListTestsForControlParams{
			ControlId: controlsListTestsID,
		}
		if controlsListTestsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(controlsListTestsPage.pageSize))
		}
		if cursor := strings.TrimSpace(controlsListTestsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTestsForControl(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		req, err := decodeRequestPayload[vantaapi.AddControlDocumentMappingInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddDocumentToControl(
			cmd.Context(),
			req,
			vantaapi.AddDocumentToControlParams{ControlId: controlsAddDocumentID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		if err := client.ogen.DeleteDocumentForcontrol(
			cmd.Context(),
			vantaapi.DeleteDocumentForcontrolParams{
				ControlId:  controlsRemoveDocumentID,
				DocumentId: controlsRemoveDocumentDocumentID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
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

		req, err := decodeRequestPayload[vantaapi.AddControlTestMappingInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddTestToControl(
			cmd.Context(),
			req,
			vantaapi.AddTestToControlParams{ControlId: controlsAddTestID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
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

		if err := client.ogen.DeleteTestForControl(
			cmd.Context(),
			vantaapi.DeleteTestForControlParams{
				ControlId: controlsRemoveTestID,
				TestId:    controlsRemoveTestTestID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
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
