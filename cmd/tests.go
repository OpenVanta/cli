package cmd

import "github.com/spf13/cobra"

var testsCmd = &cobra.Command{
	Use:   "tests",
	Short: "Manage tests",
	Long:  "Fetch tests and manage test entities in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(testsCmd)
}
