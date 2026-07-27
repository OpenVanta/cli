package cmd

import "github.com/spf13/cobra"

var vendorRiskAttributesCmd = &cobra.Command{
	Use:   "vendor-risk-attributes",
	Short: "Manage vendor risk attributes",
	Long:  "List vendor risk attributes from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(vendorRiskAttributesCmd)
}
