package cmd

import "github.com/spf13/cobra"

var vendorsCmd = &cobra.Command{
	Use:   "vendors",
	Short: "Manage vendors",
	Long:  "Create, fetch, and manage vendors and vendor subresources in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(vendorsCmd)
}
