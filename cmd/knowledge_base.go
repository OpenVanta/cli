package cmd

import "github.com/spf13/cobra"

var knowledgeBaseCmd = &cobra.Command{
	Use:   "knowledge-base",
	Short: "Manage the knowledge base",
	Long:  "Create, fetch, and manage answer library entries and knowledge base resources in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(knowledgeBaseCmd)
}
