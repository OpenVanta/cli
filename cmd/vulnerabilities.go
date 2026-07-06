package cmd

import "github.com/spf13/cobra"

var vulnerabilitiesCmd = &cobra.Command{
	Use:   "vulnerabilities",
	Short: "Manage vulnerabilities",
	Long:  "List vulnerabilities, fetch vulnerability details, and manage activation state through the Vanta API.",
}

func init() {
	rootCmd.AddCommand(vulnerabilitiesCmd)
}
