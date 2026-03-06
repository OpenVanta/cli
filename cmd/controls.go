/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"github.com/spf13/cobra"
)

// controlsCmd represents the controls command
var controlsCmd = &cobra.Command{
	Use:   "controls",
	Short: "Manage controls",
	Long:  "Create, fetch, and list controls from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(controlsCmd)
}
