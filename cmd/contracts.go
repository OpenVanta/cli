package cmd

import "github.com/spf13/cobra"

var contractsCmd = &cobra.Command{
	Use:   "contracts",
	Short: "Manage contracts",
	Long:  "List, fetch, upload, and delete contracts in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(contractsCmd)
}
