package cmd

import "github.com/spf13/cobra"

var peopleCmd = &cobra.Command{
	Use:   "people",
	Short: "Manage people",
	Long:  "Fetch and manage people in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(peopleCmd)
}
