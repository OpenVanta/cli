/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var (
	apiBaseFlag string
	dryRunFlag  bool
	prettyFlag  bool
	verboseFlag bool

	oauthClientIDFlag     string
	oauthClientSecretFlag string
	oauthScopeFlag        string
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "vanta",
	Short: "A brief description of your application",
	Long: `A longer description that spans multiple lines and likely contains
examples and usage of using your application. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(&apiBaseFlag, "api-base", defaultAPIBase, "Base API URL")
	rootCmd.PersistentFlags().BoolVar(&dryRunFlag, "dry-run", false, "Print request details without sending")
	rootCmd.PersistentFlags().BoolVar(&prettyFlag, "pretty", false, "Pretty-print JSON responses")
	rootCmd.PersistentFlags().BoolVar(&verboseFlag, "verbose", false, "Log request metadata to stderr")
	rootCmd.PersistentFlags().StringVar(&oauthClientIDFlag, "client-id", "", "OAuth client ID (overrides saved login)")
	rootCmd.PersistentFlags().StringVar(&oauthClientSecretFlag, "client-secret", "", "OAuth client secret (overrides saved login)")
	rootCmd.PersistentFlags().StringVar(&oauthScopeFlag, "scope", "", "OAuth scope (default: vanta-api.all:read vanta-api.all:write)")
}
