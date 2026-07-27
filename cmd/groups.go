package cmd

import "github.com/spf13/cobra"

var groupsCmd = &cobra.Command{
	Use:   "groups",
	Short: "Manage groups",
	Long:  "Fetch and manage person groups in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(groupsCmd)
}
