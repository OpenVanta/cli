package cmd

import (
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var trustCentersListControlCategoriesID string

var trustCentersListControlCategoriesCmd = &cobra.Command{
	Use:   "list-control-categories",
	Short: "List Trust Center control categories",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterControlCategories(
			cmd.Context(),
			vantaapi.GetTrustCenterControlCategoriesParams{SlugId: trustCentersListControlCategoriesID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetControlCategoryID         string
	trustCentersGetControlCategoryCategoryID string
)

var trustCentersGetControlCategoryCmd = &cobra.Command{
	Use:   "get-control-category",
	Short: "Get a Trust Center control category",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterControlCategory(
			cmd.Context(),
			vantaapi.GetTrustCenterControlCategoryParams{
				SlugId:     trustCentersGetControlCategoryID,
				CategoryId: trustCentersGetControlCategoryCategoryID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersAddControlCategoryID   string
	trustCentersAddControlCategoryJSON string
	trustCentersAddControlCategoryFile string
)

var trustCentersAddControlCategoryCmd = &cobra.Command{
	Use:   "add-control-category",
	Short: "Add a Trust Center control category",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersAddControlCategoryJSON, trustCentersAddControlCategoryFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddOrEditTrustCenterControlCategoryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddTrustCenterControlCategory(
			cmd.Context(),
			req,
			vantaapi.AddTrustCenterControlCategoryParams{SlugId: trustCentersAddControlCategoryID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateControlCategoryID         string
	trustCentersUpdateControlCategoryCategoryID string
	trustCentersUpdateControlCategoryJSON       string
	trustCentersUpdateControlCategoryFile       string
)

var trustCentersUpdateControlCategoryCmd = &cobra.Command{
	Use:   "update-control-category",
	Short: "Update a Trust Center control category",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateControlCategoryJSON, trustCentersUpdateControlCategoryFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddOrEditTrustCenterControlCategoryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterControlCategory(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterControlCategoryParams{
				SlugId:     trustCentersUpdateControlCategoryID,
				CategoryId: trustCentersUpdateControlCategoryCategoryID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteControlCategoryID         string
	trustCentersDeleteControlCategoryCategoryID string
)

var trustCentersDeleteControlCategoryCmd = &cobra.Command{
	Use:   "delete-control-category",
	Short: "Delete a Trust Center control category",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterControlCategory(
			cmd.Context(),
			vantaapi.DeleteTrustCenterControlCategoryParams{
				SlugId:     trustCentersDeleteControlCategoryID,
				CategoryId: trustCentersDeleteControlCategoryCategoryID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersListControlsID   string
	trustCentersListControlsPage paginationFlags
)

var trustCentersListControlsCmd = &cobra.Command{
	Use:   "list-controls",
	Short: "List Trust Center controls",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTrustCenterControlsParams{
			SlugId: trustCentersListControlsID,
		}
		if trustCentersListControlsPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(trustCentersListControlsPage.pageSize))
		}
		if cursor := strings.TrimSpace(trustCentersListControlsPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}

		resp, err := client.ogen.ListTrustCenterControls(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetControlID        string
	trustCentersGetControlControlID string
)

var trustCentersGetControlCmd = &cobra.Command{
	Use:   "get-control",
	Short: "Get a Trust Center control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterControl(
			cmd.Context(),
			vantaapi.GetTrustCenterControlParams{
				SlugId:    trustCentersGetControlID,
				ControlId: trustCentersGetControlControlID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersAddControlID   string
	trustCentersAddControlJSON string
	trustCentersAddControlFile string
)

var trustCentersAddControlCmd = &cobra.Command{
	Use:   "add-control",
	Short: "Add a control to a Trust Center",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersAddControlJSON, trustCentersAddControlFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddControlToTrustCenterInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddControlToTrustCenter(
			cmd.Context(),
			req,
			vantaapi.AddControlToTrustCenterParams{SlugId: trustCentersAddControlID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteControlID        string
	trustCentersDeleteControlControlID string
)

var trustCentersDeleteControlCmd = &cobra.Command{
	Use:   "delete-control",
	Short: "Delete a Trust Center control",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterControl(
			cmd.Context(),
			vantaapi.DeleteTrustCenterControlParams{
				SlugId:    trustCentersDeleteControlID,
				ControlId: trustCentersDeleteControlControlID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

func init() {
	trustCentersCmd.AddCommand(trustCentersListControlCategoriesCmd)
	trustCentersListControlCategoriesCmd.Flags().StringVar(&trustCentersListControlCategoriesID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersListControlCategoriesCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetControlCategoryCmd)
	trustCentersGetControlCategoryCmd.Flags().StringVar(&trustCentersGetControlCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetControlCategoryCmd.Flags().StringVar(&trustCentersGetControlCategoryCategoryID, "category-id", "", "Control category ID")
	_ = trustCentersGetControlCategoryCmd.MarkFlagRequired("id")
	_ = trustCentersGetControlCategoryCmd.MarkFlagRequired("category-id")

	trustCentersCmd.AddCommand(trustCentersAddControlCategoryCmd)
	trustCentersAddControlCategoryCmd.Flags().StringVar(&trustCentersAddControlCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersAddControlCategoryCmd.Flags().StringVar(&trustCentersAddControlCategoryJSON, "json", "", "Raw JSON payload")
	trustCentersAddControlCategoryCmd.Flags().StringVar(&trustCentersAddControlCategoryFile, "file", "", "Path to JSON payload file")
	_ = trustCentersAddControlCategoryCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateControlCategoryCmd)
	trustCentersUpdateControlCategoryCmd.Flags().StringVar(&trustCentersUpdateControlCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateControlCategoryCmd.Flags().StringVar(&trustCentersUpdateControlCategoryCategoryID, "category-id", "", "Control category ID")
	trustCentersUpdateControlCategoryCmd.Flags().StringVar(&trustCentersUpdateControlCategoryJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateControlCategoryCmd.Flags().StringVar(&trustCentersUpdateControlCategoryFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateControlCategoryCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateControlCategoryCmd.MarkFlagRequired("category-id")

	trustCentersCmd.AddCommand(trustCentersDeleteControlCategoryCmd)
	trustCentersDeleteControlCategoryCmd.Flags().StringVar(&trustCentersDeleteControlCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteControlCategoryCmd.Flags().StringVar(&trustCentersDeleteControlCategoryCategoryID, "category-id", "", "Control category ID")
	_ = trustCentersDeleteControlCategoryCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteControlCategoryCmd.MarkFlagRequired("category-id")

	trustCentersCmd.AddCommand(trustCentersListControlsCmd)
	trustCentersListControlsCmd.Flags().StringVar(&trustCentersListControlsID, "id", "", trustCenterIDFlagUsage)
	trustCentersListControlsCmd.Flags().IntVar(&trustCentersListControlsPage.pageSize, "page-size", 0, "Number of results to return")
	trustCentersListControlsCmd.Flags().StringVar(&trustCentersListControlsPage.pageCursor, "page-cursor", "", "Pagination cursor")
	_ = trustCentersListControlsCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetControlCmd)
	trustCentersGetControlCmd.Flags().StringVar(&trustCentersGetControlID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetControlCmd.Flags().StringVar(&trustCentersGetControlControlID, "control-id", "", "Trust Center control ID")
	_ = trustCentersGetControlCmd.MarkFlagRequired("id")
	_ = trustCentersGetControlCmd.MarkFlagRequired("control-id")

	trustCentersCmd.AddCommand(trustCentersAddControlCmd)
	trustCentersAddControlCmd.Flags().StringVar(&trustCentersAddControlID, "id", "", trustCenterIDFlagUsage)
	trustCentersAddControlCmd.Flags().StringVar(&trustCentersAddControlJSON, "json", "", "Raw JSON payload")
	trustCentersAddControlCmd.Flags().StringVar(&trustCentersAddControlFile, "file", "", "Path to JSON payload file")
	_ = trustCentersAddControlCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersDeleteControlCmd)
	trustCentersDeleteControlCmd.Flags().StringVar(&trustCentersDeleteControlID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteControlCmd.Flags().StringVar(&trustCentersDeleteControlControlID, "control-id", "", "Trust Center control ID")
	_ = trustCentersDeleteControlCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteControlCmd.MarkFlagRequired("control-id")
}
