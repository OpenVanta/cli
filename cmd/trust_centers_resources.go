package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	ohttp "github.com/ogen-go/ogen/http"
	"github.com/spf13/cobra"
)

var trustCentersListResourceCategoriesID string

var trustCentersListResourceCategoriesCmd = &cobra.Command{
	Use:   "list-resource-categories",
	Short: "List Trust Center resource categories",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ListTrustCenterResourceCategories(
			cmd.Context(),
			vantaapi.ListTrustCenterResourceCategoriesParams{SlugId: trustCentersListResourceCategoriesID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersAddResourceCategoryID   string
	trustCentersAddResourceCategoryJSON string
	trustCentersAddResourceCategoryFile string
)

var trustCentersAddResourceCategoryCmd = &cobra.Command{
	Use:   "add-resource-category",
	Short: "Add a Trust Center resource category",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersAddResourceCategoryJSON, trustCentersAddResourceCategoryFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.AddTrustCenterResourceCategoryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.AddTrustCenterResourceCategory(
			cmd.Context(),
			req,
			vantaapi.AddTrustCenterResourceCategoryParams{SlugId: trustCentersAddResourceCategoryID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateResourceCategoryID         string
	trustCentersUpdateResourceCategoryCategoryID string
	trustCentersUpdateResourceCategoryJSON       string
	trustCentersUpdateResourceCategoryFile       string
)

var trustCentersUpdateResourceCategoryCmd = &cobra.Command{
	Use:   "update-resource-category",
	Short: "Update a Trust Center resource category",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateResourceCategoryJSON, trustCentersUpdateResourceCategoryFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.EditTrustCenterResourceCategoryInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterResourceCategory(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterResourceCategoryParams{
				SlugId:     trustCentersUpdateResourceCategoryID,
				CategoryId: trustCentersUpdateResourceCategoryCategoryID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteResourceCategoryID         string
	trustCentersDeleteResourceCategoryCategoryID string
)

var trustCentersDeleteResourceCategoryCmd = &cobra.Command{
	Use:   "delete-resource-category",
	Short: "Delete a Trust Center resource category",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterResourceCategory(
			cmd.Context(),
			vantaapi.DeleteTrustCenterResourceCategoryParams{
				SlugId:     trustCentersDeleteResourceCategoryID,
				CategoryId: trustCentersDeleteResourceCategoryCategoryID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersUpsertResourceCategoriesOrderID   string
	trustCentersUpsertResourceCategoriesOrderJSON string
	trustCentersUpsertResourceCategoriesOrderFile string
)

var trustCentersUpsertResourceCategoriesOrderCmd = &cobra.Command{
	Use:   "upsert-resource-categories-order",
	Short: "Reorder Trust Center resource categories",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(
			trustCentersUpsertResourceCategoriesOrderJSON,
			trustCentersUpsertResourceCategoriesOrderFile,
		)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.ReorderTrustCenterResourceCategoriesInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpsertTrustCenterResourceCategoriesOrder(
			cmd.Context(),
			req,
			vantaapi.UpsertTrustCenterResourceCategoriesOrderParams{
				SlugId: trustCentersUpsertResourceCategoriesOrderID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var trustCentersListResourcesID string

var trustCentersListResourcesCmd = &cobra.Command{
	Use:   "list-resources",
	Short: "List Trust Center resources",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.ListTrustCenterResources(
			cmd.Context(),
			vantaapi.ListTrustCenterResourcesParams{SlugId: trustCentersListResourcesID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersGetResourceID         string
	trustCentersGetResourceResourceID string
)

var trustCentersGetResourceCmd = &cobra.Command{
	Use:   "get-resource",
	Short: "Get a Trust Center resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterResource(
			cmd.Context(),
			vantaapi.GetTrustCenterResourceParams{
				SlugId:     trustCentersGetResourceID,
				ResourceId: trustCentersGetResourceResourceID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersCreateResourceID          string
	trustCentersCreateResourceFilePath    string
	trustCentersCreateResourceTitle       string
	trustCentersCreateResourceIsPublic    string
	trustCentersCreateResourceDescription string
)

var trustCentersCreateResourceCmd = &cobra.Command{
	Use:   "create-resource",
	Short: "Create a Trust Center resource by uploading a document",
	RunE: func(cmd *cobra.Command, args []string) error {
		if strings.TrimSpace(trustCentersCreateResourceFilePath) == "" {
			return fmt.Errorf("--file is required")
		}
		if strings.TrimSpace(trustCentersCreateResourceTitle) == "" {
			return fmt.Errorf("--title is required")
		}
		isPublic, err := strconv.ParseBool(strings.TrimSpace(trustCentersCreateResourceIsPublic))
		if err != nil {
			return fmt.Errorf(
				"invalid value for --is-public: %q (expected true or false)",
				trustCentersCreateResourceIsPublic,
			)
		}

		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		filePath := strings.TrimSpace(trustCentersCreateResourceFilePath)
		file, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("open upload file: %w", err)
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat upload file: %w", err)
		}

		req := &vantaapi.CreateTrustCenterResourceReq{
			File: ohttp.MultipartFile{
				Name: filepath.Base(filePath),
				File: file,
				Size: fileInfo.Size(),
			},
			Title:    strings.TrimSpace(trustCentersCreateResourceTitle),
			IsPublic: strconv.FormatBool(isPublic),
		}
		if description := strings.TrimSpace(trustCentersCreateResourceDescription); description != "" {
			req.Description.SetTo(description)
		}

		resp, err := client.ogen.CreateTrustCenterResource(
			cmd.Context(),
			req,
			vantaapi.CreateTrustCenterResourceParams{SlugId: trustCentersCreateResourceID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersUpdateResourceID         string
	trustCentersUpdateResourceResourceID string
	trustCentersUpdateResourceJSON       string
	trustCentersUpdateResourceFile       string
)

var trustCentersUpdateResourceCmd = &cobra.Command{
	Use:   "update-resource",
	Short: "Update a Trust Center resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := readJSONPayload(trustCentersUpdateResourceJSON, trustCentersUpdateResourceFile)
		if err != nil {
			return err
		}
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}
		req, err := decodeRequestPayload[vantaapi.EditTrustCenterResourceInput](payload)
		if err != nil {
			return err
		}

		resp, err := client.ogen.UpdateTrustCenterResource(
			cmd.Context(),
			req,
			vantaapi.UpdateTrustCenterResourceParams{
				SlugId:     trustCentersUpdateResourceID,
				ResourceId: trustCentersUpdateResourceResourceID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var (
	trustCentersDeleteResourceID         string
	trustCentersDeleteResourceResourceID string
)

var trustCentersDeleteResourceCmd = &cobra.Command{
	Use:   "delete-resource",
	Short: "Delete a Trust Center resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		if err := client.ogen.DeleteTrustCenterResource(
			cmd.Context(),
			vantaapi.DeleteTrustCenterResourceParams{
				SlugId:     trustCentersDeleteResourceID,
				ResourceId: trustCentersDeleteResourceResourceID,
			},
		); err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, nil)
	},
}

var (
	trustCentersDownloadResourceMediaID         string
	trustCentersDownloadResourceMediaResourceID string
	trustCentersDownloadResourceMediaOutputPath string
)

var trustCentersDownloadResourceMediaCmd = &cobra.Command{
	Use:   "download-resource-media",
	Short: "Download the uploaded media for a Trust Center resource",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTrustCenterResourceMedia(
			cmd.Context(),
			vantaapi.GetTrustCenterResourceMediaParams{
				SlugId:     trustCentersDownloadResourceMediaID,
				ResourceId: trustCentersDownloadResourceMediaResourceID,
			},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		if resp == nil {
			return nil
		}

		raw, err := trustCentersMediaToBytes(resp)
		if err != nil {
			return err
		}

		if outputPath := strings.TrimSpace(trustCentersDownloadResourceMediaOutputPath); outputPath != "" {
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

func init() {
	trustCentersCmd.AddCommand(trustCentersListResourceCategoriesCmd)
	trustCentersListResourceCategoriesCmd.Flags().StringVar(&trustCentersListResourceCategoriesID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersListResourceCategoriesCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersAddResourceCategoryCmd)
	trustCentersAddResourceCategoryCmd.Flags().StringVar(&trustCentersAddResourceCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersAddResourceCategoryCmd.Flags().StringVar(&trustCentersAddResourceCategoryJSON, "json", "", "Raw JSON payload")
	trustCentersAddResourceCategoryCmd.Flags().StringVar(&trustCentersAddResourceCategoryFile, "file", "", "Path to JSON payload file")
	_ = trustCentersAddResourceCategoryCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersUpdateResourceCategoryCmd)
	trustCentersUpdateResourceCategoryCmd.Flags().StringVar(&trustCentersUpdateResourceCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateResourceCategoryCmd.Flags().StringVar(&trustCentersUpdateResourceCategoryCategoryID, "category-id", "", "Resource category ID")
	trustCentersUpdateResourceCategoryCmd.Flags().StringVar(&trustCentersUpdateResourceCategoryJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateResourceCategoryCmd.Flags().StringVar(&trustCentersUpdateResourceCategoryFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateResourceCategoryCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateResourceCategoryCmd.MarkFlagRequired("category-id")

	trustCentersCmd.AddCommand(trustCentersDeleteResourceCategoryCmd)
	trustCentersDeleteResourceCategoryCmd.Flags().StringVar(&trustCentersDeleteResourceCategoryID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteResourceCategoryCmd.Flags().StringVar(&trustCentersDeleteResourceCategoryCategoryID, "category-id", "", "Resource category ID")
	_ = trustCentersDeleteResourceCategoryCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteResourceCategoryCmd.MarkFlagRequired("category-id")

	trustCentersCmd.AddCommand(trustCentersUpsertResourceCategoriesOrderCmd)
	trustCentersUpsertResourceCategoriesOrderCmd.Flags().StringVar(&trustCentersUpsertResourceCategoriesOrderID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpsertResourceCategoriesOrderCmd.Flags().StringVar(&trustCentersUpsertResourceCategoriesOrderJSON, "json", "", "Raw JSON payload")
	trustCentersUpsertResourceCategoriesOrderCmd.Flags().StringVar(&trustCentersUpsertResourceCategoriesOrderFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpsertResourceCategoriesOrderCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersListResourcesCmd)
	trustCentersListResourcesCmd.Flags().StringVar(&trustCentersListResourcesID, "id", "", trustCenterIDFlagUsage)
	_ = trustCentersListResourcesCmd.MarkFlagRequired("id")

	trustCentersCmd.AddCommand(trustCentersGetResourceCmd)
	trustCentersGetResourceCmd.Flags().StringVar(&trustCentersGetResourceID, "id", "", trustCenterIDFlagUsage)
	trustCentersGetResourceCmd.Flags().StringVar(&trustCentersGetResourceResourceID, "resource-id", "", "Trust Center resource ID")
	_ = trustCentersGetResourceCmd.MarkFlagRequired("id")
	_ = trustCentersGetResourceCmd.MarkFlagRequired("resource-id")

	trustCentersCmd.AddCommand(trustCentersCreateResourceCmd)
	trustCentersCreateResourceCmd.Flags().StringVar(&trustCentersCreateResourceID, "id", "", trustCenterIDFlagUsage)
	trustCentersCreateResourceCmd.Flags().StringVar(&trustCentersCreateResourceFilePath, "file", "", "Path to file to upload")
	trustCentersCreateResourceCmd.Flags().StringVar(&trustCentersCreateResourceTitle, "title", "", "Resource title")
	trustCentersCreateResourceCmd.Flags().StringVar(&trustCentersCreateResourceIsPublic, "is-public", "", "Whether the resource is publicly available (true/false)")
	trustCentersCreateResourceCmd.Flags().StringVar(&trustCentersCreateResourceDescription, "description", "", "Resource description")
	_ = trustCentersCreateResourceCmd.MarkFlagRequired("id")
	_ = trustCentersCreateResourceCmd.MarkFlagRequired("file")
	_ = trustCentersCreateResourceCmd.MarkFlagRequired("title")
	_ = trustCentersCreateResourceCmd.MarkFlagRequired("is-public")

	trustCentersCmd.AddCommand(trustCentersUpdateResourceCmd)
	trustCentersUpdateResourceCmd.Flags().StringVar(&trustCentersUpdateResourceID, "id", "", trustCenterIDFlagUsage)
	trustCentersUpdateResourceCmd.Flags().StringVar(&trustCentersUpdateResourceResourceID, "resource-id", "", "Trust Center resource ID")
	trustCentersUpdateResourceCmd.Flags().StringVar(&trustCentersUpdateResourceJSON, "json", "", "Raw JSON payload")
	trustCentersUpdateResourceCmd.Flags().StringVar(&trustCentersUpdateResourceFile, "file", "", "Path to JSON payload file")
	_ = trustCentersUpdateResourceCmd.MarkFlagRequired("id")
	_ = trustCentersUpdateResourceCmd.MarkFlagRequired("resource-id")

	trustCentersCmd.AddCommand(trustCentersDeleteResourceCmd)
	trustCentersDeleteResourceCmd.Flags().StringVar(&trustCentersDeleteResourceID, "id", "", trustCenterIDFlagUsage)
	trustCentersDeleteResourceCmd.Flags().StringVar(&trustCentersDeleteResourceResourceID, "resource-id", "", "Trust Center resource ID")
	_ = trustCentersDeleteResourceCmd.MarkFlagRequired("id")
	_ = trustCentersDeleteResourceCmd.MarkFlagRequired("resource-id")

	trustCentersCmd.AddCommand(trustCentersDownloadResourceMediaCmd)
	trustCentersDownloadResourceMediaCmd.Flags().StringVar(&trustCentersDownloadResourceMediaID, "id", "", trustCenterIDFlagUsage)
	trustCentersDownloadResourceMediaCmd.Flags().StringVar(&trustCentersDownloadResourceMediaResourceID, "resource-id", "", "Trust Center resource ID")
	trustCentersDownloadResourceMediaCmd.Flags().StringVarP(&trustCentersDownloadResourceMediaOutputPath, "output", "o", "", "Write downloaded bytes to file path (default stdout)")
	_ = trustCentersDownloadResourceMediaCmd.MarkFlagRequired("id")
	_ = trustCentersDownloadResourceMediaCmd.MarkFlagRequired("resource-id")
}
