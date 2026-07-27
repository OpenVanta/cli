package cmd

import "github.com/spf13/cobra"

var discoveredVendorsCmd = &cobra.Command{
	Use:   "discovered-vendors",
	Short: "Manage discovered vendors",
	Long:  "List discovered vendors, list their accounts, and add discovered vendors to managed vendors in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(discoveredVendorsCmd)
}
