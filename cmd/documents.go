package cmd

import "github.com/spf13/cobra"

var documentsCmd = &cobra.Command{
	Use:   "documents",
	Short: "Manage documents",
	Long:  "Create, fetch, and manage documents and their related resources in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(documentsCmd)
}
