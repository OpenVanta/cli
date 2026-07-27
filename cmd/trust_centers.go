package cmd

import "github.com/spf13/cobra"

var trustCentersCmd = &cobra.Command{
	Use:   "trust-centers",
	Short: "Manage Trust Centers",
	Long: `Fetch and manage Trust Centers and their subresources in the Vanta API.

Every subcommand identifies the Trust Center with --id (the Trust Center slug ID).`,
}

func init() {
	rootCmd.AddCommand(trustCentersCmd)
}
