/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"github.com/spf13/cobra"
)

// policiesCmd represents the policies command
var policiesCmd = &cobra.Command{
	Use:   "policies",
	Short: "Manage policies",
	Long:  "Fetch and list policies from the Vanta API.",
}

func init() {
	rootCmd.AddCommand(policiesCmd)
}
