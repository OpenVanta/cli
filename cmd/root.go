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
	Short: "Manage Vanta resources from the command line",
	Long: `Vanta CLI for querying and updating resources through the Vanta API.

Start by running "vanta login" to save your OAuth client credentials and default API base.
Then use resource commands like controls, policies, documents, tests, people, frameworks, integrations, and vendors.

Examples:
  vanta controls list --page-size 50
  vanta policies get --id code-of-conduct-bsi
  vanta documents upload-file --id doc_123 --file ./policy.pdf`,
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
	rootCmd.PersistentFlags().StringVar(&apiBaseFlag, "api-base", "", "Base API URL (overrides saved config; default https://api.vanta.com/v1)")
	rootCmd.PersistentFlags().BoolVar(&dryRunFlag, "dry-run", false, "Print request details without sending")
	rootCmd.PersistentFlags().BoolVar(&prettyFlag, "pretty", true, "Pretty-print JSON responses (set --pretty=false for compact output)")
	rootCmd.PersistentFlags().BoolVar(&verboseFlag, "verbose", false, "Log request metadata to stderr")
	rootCmd.PersistentFlags().StringVar(&oauthClientIDFlag, "client-id", "", "OAuth client ID (overrides saved login)")
	rootCmd.PersistentFlags().StringVar(&oauthClientSecretFlag, "client-secret", "", "OAuth client secret (overrides saved login)")
	rootCmd.PersistentFlags().StringVar(&oauthScopeFlag, "scope", "", "OAuth scope (default: vanta-api.all:read vanta-api.all:write)")
}
