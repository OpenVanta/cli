package cmd

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const oauthClientIDEnvVar = "VANTA_CLIENT_ID"
const oauthClientSecretEnvVar = "VANTA_CLIENT_SECRET"
const oauthScopeEnvVar = "VANTA_OAUTH_SCOPE"
const apiBaseEnvVar = "VANTA_API_BASE"
const defaultOAuthScope = "vanta-api.all:read vanta-api.all:write"

type cliConfig struct {
	APIBase            string `json:"api_base,omitempty"`
	OAuthClientID      string `json:"oauth_client_id,omitempty"`
	OAuthClientSecret  string `json:"oauth_client_secret,omitempty"`
	OAuthScope         string `json:"oauth_scope,omitempty"`
	CachedAccessToken  string `json:"cached_access_token,omitempty"`
	CachedTokenType    string `json:"cached_token_type,omitempty"`
	CachedTokenExpires string `json:"cached_token_expires,omitempty"`
}

func configFilePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("resolve home directory: %w", err)
	}

	return filepath.Join(home, ".vanta", "config.json"), nil
}

func loadConfig() (*cliConfig, error) {
	path, err := configFilePath()
	if err != nil {
		return nil, err
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return &cliConfig{}, nil
		}
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg cliConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("parse config file: %w", err)
	}

	return &cfg, nil
}

func saveConfig(cfg *cliConfig) error {
	path, err := configFilePath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create config directory: %w", err)
	}

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

func saveOAuthCredentials(apiBase, clientID, clientSecret, scope string) error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	if strings.TrimSpace(apiBase) == "" {
		cfg.APIBase = defaultAPIBase
	} else {
		cfg.APIBase = strings.TrimSpace(apiBase)
	}
	cfg.OAuthClientID = strings.TrimSpace(clientID)
	cfg.OAuthClientSecret = strings.TrimSpace(clientSecret)
	if strings.TrimSpace(scope) == "" {
		cfg.OAuthScope = defaultOAuthScope
	} else {
		cfg.OAuthScope = strings.TrimSpace(scope)
	}

	// Force refresh if credentials changed.
	cfg.CachedAccessToken = ""
	cfg.CachedTokenType = ""
	cfg.CachedTokenExpires = ""

	return saveConfig(cfg)
}

func resolveAPIBase() (string, error) {
	if base := strings.TrimSpace(apiBaseFlag); base != "" {
		return base, nil
	}
	if base := strings.TrimSpace(os.Getenv(apiBaseEnvVar)); base != "" {
		return base, nil
	}

	cfg, err := loadConfig()
	if err != nil {
		return "", err
	}
	if base := strings.TrimSpace(cfg.APIBase); base != "" {
		return base, nil
	}

	return defaultAPIBase, nil
}

func cacheAccessToken(accessToken, tokenType string, expiresAt time.Time) error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	cfg.CachedAccessToken = strings.TrimSpace(accessToken)
	cfg.CachedTokenType = strings.TrimSpace(tokenType)
	cfg.CachedTokenExpires = expiresAt.UTC().Format(time.RFC3339)
	return saveConfig(cfg)
}

func resolveOAuthCredentials() (clientID, clientSecret, scope string, err error) {
	if strings.TrimSpace(oauthClientIDFlag) != "" {
		clientID = strings.TrimSpace(oauthClientIDFlag)
	}
	if strings.TrimSpace(oauthClientSecretFlag) != "" {
		clientSecret = strings.TrimSpace(oauthClientSecretFlag)
	}
	if strings.TrimSpace(oauthScopeFlag) != "" {
		scope = strings.TrimSpace(oauthScopeFlag)
	}

	if clientID == "" {
		clientID = strings.TrimSpace(os.Getenv(oauthClientIDEnvVar))
	}
	if clientSecret == "" {
		clientSecret = strings.TrimSpace(os.Getenv(oauthClientSecretEnvVar))
	}
	if scope == "" {
		scope = strings.TrimSpace(os.Getenv(oauthScopeEnvVar))
	}

	cfg, err := loadConfig()
	if err != nil {
		return "", "", "", err
	}

	if clientID == "" {
		clientID = strings.TrimSpace(cfg.OAuthClientID)
	}
	if clientSecret == "" {
		clientSecret = strings.TrimSpace(cfg.OAuthClientSecret)
	}
	if scope == "" {
		scope = strings.TrimSpace(cfg.OAuthScope)
	}
	if scope == "" {
		scope = defaultOAuthScope
	}

	return clientID, clientSecret, scope, nil
}

func loadCachedAccessToken() (string, time.Time, error) {
	cfg, err := loadConfig()
	if err != nil {
		return "", time.Time{}, err
	}

	token := strings.TrimSpace(cfg.CachedAccessToken)
	if token == "" {
		return "", time.Time{}, nil
	}

	expiresRaw := strings.TrimSpace(cfg.CachedTokenExpires)
	if expiresRaw == "" {
		return "", time.Time{}, nil
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresRaw)
	if err != nil {
		return "", time.Time{}, nil
	}

	return token, expiresAt, nil
}

func oauthTokenURL(apiBase string) (string, error) {
	base := strings.TrimSpace(apiBase)
	if base == "" {
		base = defaultAPIBase
	}

	u, err := url.Parse(base)
	if err != nil {
		return "", fmt.Errorf("parse api base: %w", err)
	}

	u.Path = "/oauth/token"
	u.RawQuery = ""
	return u.String(), nil
}

func requestOAuthToken(apiBase, clientID, clientSecret, scope string) (string, time.Time, error) {
	tokenURL, err := oauthTokenURL(apiBase)
	if err != nil {
		return "", time.Time{}, err
	}

	body := map[string]string{
		"client_id":     clientID,
		"client_secret": clientSecret,
		"scope":         scope,
		"grant_type":    "client_credentials",
	}
	rawBody, err := json.Marshal(body)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("encode oauth request body: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, tokenURL, bytes.NewReader(rawBody))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("build oauth request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("send oauth request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("read oauth response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", time.Time{}, fmt.Errorf("oauth error (%d): %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	if err := json.Unmarshal(respBody, &tokenResp); err != nil {
		return "", time.Time{}, fmt.Errorf("parse oauth response: %w", err)
	}
	if strings.TrimSpace(tokenResp.AccessToken) == "" {
		return "", time.Time{}, errors.New("oauth response missing access_token")
	}

	ttl := time.Duration(tokenResp.ExpiresIn) * time.Second
	if ttl <= 0 {
		ttl = time.Hour
	}

	return strings.TrimSpace(tokenResp.AccessToken), time.Now().UTC().Add(ttl), nil
}

func resolveAccessToken(apiBase string) (string, error) {
	cachedToken, expiresAt, err := loadCachedAccessToken()
	if err != nil {
		return "", err
	}
	if cachedToken != "" && time.Now().UTC().Before(expiresAt.Add(-30*time.Second)) {
		return cachedToken, nil
	}

	clientID, clientSecret, scope, err := resolveOAuthCredentials()
	if err != nil {
		return "", err
	}
	if clientID == "" || clientSecret == "" {
		return "", errors.New("missing auth credentials: run `vanta login` or set VANTA_CLIENT_ID / VANTA_CLIENT_SECRET")
	}

	newToken, newExpiresAt, err := requestOAuthToken(apiBase, clientID, clientSecret, scope)
	if err != nil {
		return "", err
	}
	if err := cacheAccessToken(newToken, "Bearer", newExpiresAt); err != nil {
		return "", err
	}

	return newToken, nil
}
