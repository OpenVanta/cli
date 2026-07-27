package cmd

import (
	"fmt"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var (
	vulnerableAssetsListPage                   paginationFlags
	vulnerableAssetsListQ                      string
	vulnerableAssetsListIntegrationID          string
	vulnerableAssetsListAssetType              string
	vulnerableAssetsListAssetExternalAccountID string
)

var vulnerableAssetsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List vulnerable assets",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListVulnerableAssetsParams{}
		if vulnerableAssetsListPage.pageSize > 0 {
			params.PageSize.SetTo(vantaapi.PageSize(vulnerableAssetsListPage.pageSize))
		}
		if cursor := strings.TrimSpace(vulnerableAssetsListPage.pageCursor); cursor != "" {
			params.PageCursor.SetTo(vantaapi.PageCursor(cursor))
		}
		if query := strings.TrimSpace(vulnerableAssetsListQ); query != "" {
			params.Q.SetTo(query)
		}
		if integrationID := strings.TrimSpace(vulnerableAssetsListIntegrationID); integrationID != "" {
			params.IntegrationId.SetTo(integrationID)
		}
		if assetExternalAccountID := strings.TrimSpace(vulnerableAssetsListAssetExternalAccountID); assetExternalAccountID != "" {
			params.AssetExternalAccountId.SetTo(assetExternalAccountID)
		}
		if assetTypeRaw := strings.TrimSpace(vulnerableAssetsListAssetType); assetTypeRaw != "" {
			assetType := vantaapi.VulnerableAssetType(assetTypeRaw)
			if err := assetType.Validate(); err != nil {
				return fmt.Errorf(
					"invalid --asset-type %q (expected one of: CODE_REPOSITORY, CONTAINER_REPOSITORY, CONTAINER_REPOSITORY_IMAGE, MANIFEST_FILE, SERVER, SERVERLESS_FUNCTION, WORKSTATION)",
					assetTypeRaw,
				)
			}
			params.AssetType.SetTo(assetType)
		}

		resp, err := client.ogen.ListVulnerableAssets(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var vulnerableAssetsGetID string

var vulnerableAssetsGetCmd = &cobra.Command{
	Use:   "get",
	Short: "Get a vulnerable asset by ID",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetVulnerableAsset(
			cmd.Context(),
			vantaapi.GetVulnerableAssetParams{VulnerableAssetId: vulnerableAssetsGetID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	vulnerableAssetsCmd.AddCommand(vulnerableAssetsListCmd)
	vulnerableAssetsListCmd.Flags().IntVar(&vulnerableAssetsListPage.pageSize, "page-size", 0, "Number of results to return")
	vulnerableAssetsListCmd.Flags().StringVar(&vulnerableAssetsListPage.pageCursor, "page-cursor", "", "Pagination cursor")
	vulnerableAssetsListCmd.Flags().StringVar(&vulnerableAssetsListQ, "q", "", "Filter vulnerable assets by search query")
	vulnerableAssetsListCmd.Flags().StringVar(&vulnerableAssetsListIntegrationID, "integration-id", "", "Filter vulnerable assets by vulnerability scanner integration ID")
	vulnerableAssetsListCmd.Flags().StringVar(&vulnerableAssetsListAssetType, "asset-type", "", "Filter vulnerable assets by asset type (CODE_REPOSITORY, CONTAINER_REPOSITORY, CONTAINER_REPOSITORY_IMAGE, MANIFEST_FILE, SERVER, SERVERLESS_FUNCTION, WORKSTATION)")
	vulnerableAssetsListCmd.Flags().StringVar(&vulnerableAssetsListAssetExternalAccountID, "asset-external-account-id", "", "Filter vulnerable assets by external account ID")

	vulnerableAssetsCmd.AddCommand(vulnerableAssetsGetCmd)
	vulnerableAssetsGetCmd.Flags().StringVar(&vulnerableAssetsGetID, "id", "", "Vulnerable asset ID")
	_ = vulnerableAssetsGetCmd.MarkFlagRequired("id")
}
