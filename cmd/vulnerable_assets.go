package cmd

import "github.com/spf13/cobra"

var vulnerableAssetsCmd = &cobra.Command{
	Use:   "vulnerable-assets",
	Short: "Manage vulnerable assets",
	Long:  "List assets associated with vulnerabilities and fetch vulnerable asset details from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(vulnerableAssetsCmd)
}
