package cmd

import (
	"testing"

	"github.com/spf13/cobra"
)

func TestNormalizeVersion(t *testing.T) {
	cases := map[string]string{
		"v1.2.3":        "1.2.3",
		"1.2.3":         "1.2.3",
		"V0.1.0":        "0.1.0",
		"v1.2.3-beta.1": "1.2.3",
		"  v2.0.0+build ": "2.0.0",
	}
	for in, want := range cases {
		if got := normalizeVersion(in); got != want {
			t.Fatalf("normalizeVersion(%q)=%q, want %q", in, got, want)
		}
	}
}

func TestIsNewerVersion(t *testing.T) {
	newerCases := []struct{ latest, current string }{
		{"0.2.0", "0.1.0"},
		{"v1.0.0", "0.9.9"},
		{"1.2.3", "1.2.2"},
		{"2.0.0", "1.9.9"},
	}
	for _, tc := range newerCases {
		if !isNewerVersion(tc.latest, tc.current) {
			t.Fatalf("expected %q to be newer than %q", tc.latest, tc.current)
		}
	}

	notNewerCases := []struct{ latest, current string }{
		{"0.1.0", "0.1.0"},
		{"0.1.0", "0.2.0"},
		{"v1.2.3", "1.2.3"},
		{"1.2.3", "1.2.4"},
	}
	for _, tc := range notNewerCases {
		if isNewerVersion(tc.latest, tc.current) {
			t.Fatalf("expected %q not to be newer than %q", tc.latest, tc.current)
		}
	}
}

func TestShouldNotifyUpdates_DisabledCases(t *testing.T) {
	oldVersion := Version
	t.Cleanup(func() { Version = oldVersion })

	cmd := &cobra.Command{Use: "test"}
	cmd.Flags().BoolVar(&agentModeFlag, "agent-mode", false, "")

	Version = "dev"
	if shouldNotifyUpdates(cmd) {
		t.Fatal("expected dev version to disable update notices")
	}

	Version = "0.1.0"
	t.Setenv(updateCheckEnvDisable, "1")
	if shouldNotifyUpdates(cmd) {
		t.Fatal("expected VANTA_NO_UPDATE to disable update notices")
	}
	t.Setenv(updateCheckEnvDisable, "")

	t.Setenv("CI", "true")
	if shouldNotifyUpdates(cmd) {
		t.Fatal("expected CI=true to disable update notices")
	}
	t.Setenv("CI", "")

	t.Setenv("CURSOR_AGENT", "1")
	if shouldNotifyUpdates(cmd) {
		t.Fatal("expected agent mode to disable update notices")
	}
}

func TestDisplayVersion(t *testing.T) {
	if got := displayVersion("0.1.0"); got != "v0.1.0" {
		t.Fatalf("displayVersion(0.1.0)=%q", got)
	}
	if got := displayVersion("v0.1.0"); got != "v0.1.0" {
		t.Fatalf("displayVersion(v0.1.0)=%q", got)
	}
	if got := displayVersion("dev"); got != "dev" {
		t.Fatalf("displayVersion(dev)=%q", got)
	}
}
