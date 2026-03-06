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
	Short: "Save OAuth credentials for the CLI",
	Long:  "Prompts for your Vanta OAuth client credentials, validates them by requesting an access token, and saves them for future CLI commands.",
	RunE: func(cmd *cobra.Command, args []string) error {
		reader := bufio.NewReader(cmd.InOrStdin())

		apiBaseDefault, err := resolveAPIBase()
		if err != nil {
			return fmt.Errorf("failed to resolve api base: %w", err)
		}
		apiBase, err := promptValue(cmd, reader, "API base URL", apiBaseDefault, true)
		if err != nil {
			return fmt.Errorf("failed to read api base: %w", err)
		}

		clientID, err := promptValue(cmd, reader, "OAuth client ID", loginClientID, false)
		if err != nil {
			return fmt.Errorf("failed to read oauth client id: %w", err)
		}

		clientSecret, err := promptValue(cmd, reader, "OAuth client secret", loginClientSecret, true)
		if err != nil {
			return fmt.Errorf("failed to read oauth client secret: %w", err)
		}

		scopeDefault := strings.TrimSpace(loginScope)
		if scopeDefault == "" {
			scopeDefault = defaultOAuthScope
		}
		scope, err := promptValue(cmd, reader, fmt.Sprintf("OAuth scope (default: %s)", scopeDefault), scopeDefault, false)
		if err != nil {
			return fmt.Errorf("failed to read oauth scope: %w", err)
		}
		if strings.TrimSpace(scope) == "" {
			scope = scopeDefault
		}

		accessToken, expiresAt, err := requestOAuthToken(apiBase, clientID, clientSecret, scope)
		if err != nil {
			return fmt.Errorf("oauth token request failed: %w", err)
		}
		if err := saveOAuthCredentials(apiBase, clientID, clientSecret, scope); err != nil {
			return fmt.Errorf("failed to save oauth credentials: %w", err)
		}
		if err := cacheAccessToken(accessToken, "Bearer", expiresAt); err != nil {
			return fmt.Errorf("failed to cache access token: %w", err)
		}

		path, err := configFilePath()
		if err != nil {
			return fmt.Errorf("failed to resolve config path: %w", err)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "OAuth credentials saved to %s\n", path)
		fmt.Fprintf(cmd.OutOrStdout(), "API base saved as %s\n", apiBase)
		fmt.Fprintf(cmd.OutOrStdout(), "Access token cached (expires at %s)\n", expiresAt.UTC().Format("2006-01-02T15:04:05Z"))
		return nil
	},
}

var (
	loginClientID     string
	loginClientSecret string
	loginScope        string
)

func promptValue(cmd *cobra.Command, reader *bufio.Reader, label, defaultValue string, required bool) (string, error) {
	prompt := label
	if strings.TrimSpace(defaultValue) != "" {
		prompt = fmt.Sprintf("%s [%s]", label, defaultValue)
	}
	prompt += ": "
	fmt.Fprint(cmd.OutOrStdout(), prompt)

	valueRaw, err := reader.ReadString('\n')
	if err != nil && !errors.Is(err, io.EOF) {
		return "", err
	}

	value := strings.TrimSpace(valueRaw)
	if value == "" {
		value = strings.TrimSpace(defaultValue)
	}
	if required && value == "" {
		return "", errors.New("value cannot be empty")
	}

	return value, nil
}

func init() {
	rootCmd.AddCommand(loginCmd)
	loginCmd.Flags().StringVar(&loginClientID, "client-id", "", "OAuth client ID")
	loginCmd.Flags().StringVar(&loginClientSecret, "client-secret", "", "OAuth client secret")
	loginCmd.Flags().StringVar(&loginScope, "scope", defaultOAuthScope, "OAuth scope")
}
