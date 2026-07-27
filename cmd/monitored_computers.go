package cmd

import "github.com/spf13/cobra"

var monitoredComputersCmd = &cobra.Command{
	Use:   "monitored-computers",
	Short: "Manage monitored computers",
	Long:  "List computers monitored by an MDM or Vanta Device Monitor, and fetch computer details from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(monitoredComputersCmd)
}
