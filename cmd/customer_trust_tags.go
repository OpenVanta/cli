package cmd

import (
	"fmt"
	"strings"

	"github.com/VantaInc/cli/internal/vantaapi"
	"github.com/spf13/cobra"
)

var customerTrustListTagCategoriesProductContextFilters []string

var customerTrustListTagCategoriesCmd = &cobra.Command{
	Use:   "list-tag-categories",
	Short: "List Customer Trust tag categories",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		params := vantaapi.ListTagCategoriesParams{}
		for _, raw := range customerTrustListTagCategoriesProductContextFilters {
			trimmed := strings.TrimSpace(raw)
			if trimmed == "" {
				continue
			}
			productContext := vantaapi.CustomerTrustProductContextIdFilter(trimmed)
			if err := productContext.Validate(); err != nil {
				return fmt.Errorf(
					"invalid --product-context-ids-matches-any %q (expected one of: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, QUESTIONNAIRE)",
					trimmed,
				)
			}
			params.ProductContextIdsMatchesAny = append(params.ProductContextIdsMatchesAny, productContext)
		}

		resp, err := client.ogen.ListTagCategories(cmd.Context(), params)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

var customerTrustGetTagsForCategoryID string

var customerTrustGetTagsForCategoryCmd = &cobra.Command{
	Use:   "get-tags-for-category",
	Short: "Get a Customer Trust tag category and its tags",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newAPIClient(cmd)
		if err != nil {
			return err
		}

		resp, err := client.ogen.GetTagsForCategory(
			cmd.Context(),
			vantaapi.GetTagsForCategoryParams{TagCategoryId: customerTrustGetTagsForCategoryID},
		)
		if err != nil {
			return client.handleOgenError(err)
		}
		return printResponseJSON(cmd, resp)
	},
}

func init() {
	customerTrustCmd.AddCommand(customerTrustListTagCategoriesCmd)
	customerTrustListTagCategoriesCmd.Flags().StringSliceVar(&customerTrustListTagCategoriesProductContextFilters, "product-context-ids-matches-any", nil, "Product contexts to filter by (repeatable): EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, QUESTIONNAIRE")

	customerTrustCmd.AddCommand(customerTrustGetTagsForCategoryCmd)
	customerTrustGetTagsForCategoryCmd.Flags().StringVar(&customerTrustGetTagsForCategoryID, "id", "", "Tag category ID")
	_ = customerTrustGetTagsForCategoryCmd.MarkFlagRequired("id")
}
