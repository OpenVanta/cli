/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/spf13/cobra"
)

// loginCmd represents the login command
var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Save an API token for the CLI",
	Long:  "Prompts for your Vanta API token and saves it for future CLI commands.",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Fprint(cmd.OutOrStdout(), "Paste your Vanta API token: ")

		reader := bufio.NewReader(cmd.InOrStdin())
		tokenRaw, err := reader.ReadString('\n')
		if err != nil && !errors.Is(err, io.EOF) {
			return fmt.Errorf("failed to read api token: %w", err)
		}

		token := strings.TrimSpace(tokenRaw)
		if token == "" {
			return errors.New("api token cannot be empty")
		}

		if err := saveToken(token); err != nil {
			return fmt.Errorf("failed to save api token: %w", err)
		}
		if err := setTokenEnvironment(token); err != nil {
			return fmt.Errorf("failed to set token environment: %w", err)
		}

		path, err := configFilePath()
		if err != nil {
			return fmt.Errorf("failed to resolve config path: %w", err)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "API token saved to %s\n", path)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// loginCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// loginCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
