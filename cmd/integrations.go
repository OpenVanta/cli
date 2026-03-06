package cmd

import "github.com/spf13/cobra"

var integrationsCmd = &cobra.Command{
	Use:   "integrations",
	Short: "Manage integrations",
	Long:  "List connected integrations, inspect integration resources, and update integration resource metadata.",
}

func init() {
	rootCmd.AddCommand(integrationsCmd)
}
