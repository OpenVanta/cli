package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const apiTokenEnvVar = "VANTA_API_KEY"

type cliConfig struct {
	APIToken string `json:"api_token"`
}

func configFilePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("resolve home directory: %w", err)
	}

	return filepath.Join(home, ".vanta", "config.json"), nil
}

func loadToken() (string, error) {
	path, err := configFilePath()
	if err != nil {
		return "", err
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", nil
		}
		return "", fmt.Errorf("read config file: %w", err)
	}

	var cfg cliConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return "", fmt.Errorf("parse config file: %w", err)
	}

	return strings.TrimSpace(cfg.APIToken), nil
}

func saveToken(token string) error {
	path, err := configFilePath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create config directory: %w", err)
	}

	cfg := cliConfig{APIToken: strings.TrimSpace(token)}
	raw, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("encode config file: %w", err)
	}
	raw = append(raw, '\n')

	if err := os.WriteFile(path, raw, 0o600); err != nil {
		return fmt.Errorf("write config file: %w", err)
	}

	return nil
}

func setTokenEnvironment(token string) error {
	return os.Setenv(apiTokenEnvVar, strings.TrimSpace(token))
}

func loadTokenIntoEnvironment() error {
	if strings.TrimSpace(os.Getenv(apiTokenEnvVar)) != "" {
		return nil
	}

	token, err := loadToken()
	if err != nil {
		return err
	}
	if token == "" {
		return nil
	}

	return setTokenEnvironment(token)
}
