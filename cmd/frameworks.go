package cmd

import "github.com/spf13/cobra"

var frameworksCmd = &cobra.Command{
	Use:   "frameworks",
	Short: "Manage frameworks",
	Long:  "List frameworks, fetch framework details, and list controls for a framework.",
}

func init() {
	rootCmd.AddCommand(frameworksCmd)
}
