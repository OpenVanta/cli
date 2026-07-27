package cmd

import "github.com/spf13/cobra"

var riskScenariosCmd = &cobra.Command{
	Use:   "risk-scenarios",
	Short: "Manage risk scenarios",
	Long:  "Create, fetch, and manage risk scenarios and linked controls in the Vanta API.",
}

func init() {
	rootCmd.AddCommand(riskScenariosCmd)
}
