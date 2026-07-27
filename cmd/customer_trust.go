package cmd

import "github.com/spf13/cobra"

var customerTrustCmd = &cobra.Command{
	Use:   "customer-trust",
	Short: "Manage Customer Trust accounts, questionnaires, and tags",
	Long:  "Create, fetch, and manage Customer Trust accounts, security questionnaires, and tag categories in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(customerTrustCmd)
}
