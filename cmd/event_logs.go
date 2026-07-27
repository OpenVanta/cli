package cmd

import "github.com/spf13/cobra"

var eventLogsCmd = &cobra.Command{
	Use:   "event-logs",
	Short: "Manage event logs",
	Long:  "List event logs from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(eventLogsCmd)
}
