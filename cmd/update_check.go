package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/spf13/cobra"
)

const (
	updateCheckRepo        = "VantaInc/cli"
	updateCheckInterval    = 24 * time.Hour
	updateCheckHTTPTimeout = 1500 * time.Millisecond
	updateCheckEnvDisable  = "VANTA_NO_UPDATE"
	installScriptURL       = "https://raw.githubusercontent.com/VantaInc/cli/main/scripts/install.sh"
)

type updateCheckCache struct {
	CheckedAt     time.Time `json:"checked_at"`
	LatestVersion string    `json:"latest_version"`
}

type githubLatestRelease struct {
	TagName string `json:"tag_name"`
}

var (
	updateHTTPClient = &http.Client{Timeout: updateCheckHTTPTimeout}
	updateCheckNow   = time.Now

	updateCheckState = struct {
		once    sync.Once
		mu      sync.Mutex
		started bool
		done    chan struct{}
		latest  string
		err     error
	}{
		done: make(chan struct{}),
	}
)

func shouldNotifyUpdates(cmd *cobra.Command) bool {
	if normalizeVersion(Version) == "" || Version == "dev" {
		return false
	}
	if envTruthy(os.Getenv(updateCheckEnvDisable)) {
		return false
	}
	if envTruthy(os.Getenv("CI")) {
		return false
	}
	if agentModeEnabled(cmd) {
		return false
	}
	if !isTerminal(os.Stderr) {
		return false
	}
	return true
}

func envTruthy(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}

func isTerminal(f *os.File) bool {
	if f == nil {
		return false
	}
	info, err := f.Stat()
	if err != nil {
		return false
	}
	return info.Mode()&os.ModeCharDevice != 0
}

func startBackgroundUpdateCheck(cmd *cobra.Command) {
	if !shouldNotifyUpdates(cmd) {
		return
	}

	updateCheckState.once.Do(func() {
		updateCheckState.mu.Lock()
		updateCheckState.started = true
		updateCheckState.mu.Unlock()

		go func() {
			defer close(updateCheckState.done)
			latest, err := resolveLatestVersion()
			updateCheckState.mu.Lock()
			updateCheckState.latest = latest
			updateCheckState.err = err
			updateCheckState.mu.Unlock()
		}()
	})
}

func finishBackgroundUpdateCheck(cmd *cobra.Command) {
	updateCheckState.mu.Lock()
	started := updateCheckState.started
	updateCheckState.mu.Unlock()
	if !started {
		return
	}

	select {
	case <-updateCheckState.done:
	case <-time.After(updateCheckHTTPTimeout):
		return
	}

	updateCheckState.mu.Lock()
	latest := updateCheckState.latest
	err := updateCheckState.err
	updateCheckState.mu.Unlock()
	if err != nil || latest == "" {
		return
	}
	if !isNewerVersion(latest, Version) {
		return
	}

	fmt.Fprintf(
		cmd.ErrOrStderr(),
		"\nA new version of vanta is available: %s (you have %s)\nUpdate with:\n  curl -fsSL %s | bash\n\n",
		displayVersion(latest),
		displayVersion(Version),
		installScriptURL,
	)
}

func resolveLatestVersion() (string, error) {
	if cached, ok, err := readUpdateCheckCache(); err == nil && ok {
		if updateCheckNow().Sub(cached.CheckedAt) < updateCheckInterval && cached.LatestVersion != "" {
			return cached.LatestVersion, nil
		}
	}

	latest, err := fetchLatestReleaseVersion()
	if err != nil {
		return "", err
	}

	_ = writeUpdateCheckCache(updateCheckCache{
		CheckedAt:     updateCheckNow(),
		LatestVersion: latest,
	})
	return latest, nil
}

func fetchLatestReleaseVersion() (string, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.github.com/repos/"+updateCheckRepo+"/releases/latest", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", userAgent())

	resp, err := updateHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("github releases latest: %s", resp.Status)
	}

	var release githubLatestRelease
	if err := json.Unmarshal(body, &release); err != nil {
		return "", err
	}
	tag := strings.TrimSpace(release.TagName)
	if tag == "" {
		return "", fmt.Errorf("github releases latest: empty tag_name")
	}
	return normalizeVersion(tag), nil
}

func updateCheckCachePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".vanta", "update-check.json"), nil
}

func readUpdateCheckCache() (updateCheckCache, bool, error) {
	path, err := updateCheckCachePath()
	if err != nil {
		return updateCheckCache{}, false, err
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return updateCheckCache{}, false, nil
		}
		return updateCheckCache{}, false, err
	}

	var cached updateCheckCache
	if err := json.Unmarshal(raw, &cached); err != nil {
		return updateCheckCache{}, false, err
	}
	return cached, true, nil
}

func writeUpdateCheckCache(cached updateCheckCache) error {
	path, err := updateCheckCachePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(cached, "", "  ")
	if err != nil {
		return err
	}
	raw = append(raw, '\n')
	return os.WriteFile(path, raw, 0o600)
}

func isNewerVersion(latest, current string) bool {
	latestParts, latestOK := parseSemver(normalizeVersion(latest))
	currentParts, currentOK := parseSemver(normalizeVersion(current))
	if !latestOK || !currentOK {
		return normalizeVersion(latest) != normalizeVersion(current) && normalizeVersion(latest) > normalizeVersion(current)
	}
	for i := 0; i < 3; i++ {
		if latestParts[i] > currentParts[i] {
			return true
		}
		if latestParts[i] < currentParts[i] {
			return false
		}
	}
	return false
}

func parseSemver(version string) ([3]int, bool) {
	var parts [3]int
	segments := strings.Split(version, ".")
	if len(segments) < 1 || len(segments) > 3 {
		return parts, false
	}
	for i := 0; i < len(segments); i++ {
		n, err := strconv.Atoi(segments[i])
		if err != nil || n < 0 {
			return parts, false
		}
		parts[i] = n
	}
	return parts, true
}
