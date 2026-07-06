package cmd

import (
	"testing"

	"github.com/spf13/cobra"
)

func TestAgentSignalEnabled(t *testing.T) {
	falseCases := []string{"", "0", "false", "no", "off", "none", "disabled", "  FALSE "}
	for _, tc := range falseCases {
		if agentSignalEnabled(tc) {
			t.Fatalf("expected %q to disable agent mode", tc)
		}
	}

	trueCases := []string{"1", "true", "yes", "cursor", "seatbelt"}
	for _, tc := range trueCases {
		if !agentSignalEnabled(tc) {
			t.Fatalf("expected %q to enable agent mode", tc)
		}
	}
}

func TestDetectAgentEnvironmentFromLookup(t *testing.T) {
	lookup := func(key string) (string, bool) {
		if key == "CURSOR_AGENT" {
			return "1", true
		}
		return "", false
	}
	if !detectAgentEnvironmentFromLookup(lookup) {
		t.Fatal("expected known agent environment variable to enable agent mode")
	}
}

func TestAgentModeEnabled_UsesAutoDetectionWhenFlagUnset(t *testing.T) {
	t.Setenv("CURSOR_AGENT", "1")
	t.Setenv("AGENT", "")
	t.Setenv("AI_AGENT", "")

	old := agentModeFlag
	defer func() {
		agentModeFlag = old
	}()

	agentModeFlag = false
	cmd := &cobra.Command{Use: "test"}
	cmd.Flags().BoolVar(&agentModeFlag, "agent-mode", false, "")

	if !agentModeEnabled(cmd) {
		t.Fatal("expected auto-detected agent environment to enable agent mode")
	}
}

func TestAgentModeEnabled_FlagOverridesDetection(t *testing.T) {
	t.Setenv("CURSOR_AGENT", "1")

	old := agentModeFlag
	defer func() {
		agentModeFlag = old
	}()

	cmd := &cobra.Command{Use: "test"}
	cmd.Flags().BoolVar(&agentModeFlag, "agent-mode", false, "")

	if err := cmd.Flags().Set("agent-mode", "false"); err != nil {
		t.Fatalf("set --agent-mode=false: %v", err)
	}
	if agentModeEnabled(cmd) {
		t.Fatal("expected explicit --agent-mode=false to disable agent mode")
	}

	if err := cmd.Flags().Set("agent-mode", "true"); err != nil {
		t.Fatalf("set --agent-mode=true: %v", err)
	}
	if !agentModeEnabled(cmd) {
		t.Fatal("expected explicit --agent-mode=true to enable agent mode")
	}
}

func TestResolvedOutputFormat_AgentModeDefaultsToTOON(t *testing.T) {
	t.Setenv("CURSOR_AGENT", "1")

	oldAgentMode := agentModeFlag
	oldPretty := prettyFlag
	defer func() {
		agentModeFlag = oldAgentMode
		prettyFlag = oldPretty
	}()

	agentModeFlag = false
	prettyFlag = true

	cmd := &cobra.Command{Use: "test"}
	cmd.Flags().BoolVar(&agentModeFlag, "agent-mode", false, "")

	if got := resolvedOutputFormat(cmd); got != outputFormatTOON {
		t.Fatalf("expected output format %q, got %q", outputFormatTOON, got)
	}
}

func TestResolvedOutputFormat_ExplicitAgentOffUsesPrettyFlag(t *testing.T) {
	t.Setenv("CURSOR_AGENT", "1")

	oldAgentMode := agentModeFlag
	oldPretty := prettyFlag
	defer func() {
		agentModeFlag = oldAgentMode
		prettyFlag = oldPretty
	}()

	cmd := &cobra.Command{Use: "test"}
	cmd.Flags().BoolVar(&agentModeFlag, "agent-mode", false, "")
	if err := cmd.Flags().Set("agent-mode", "false"); err != nil {
		t.Fatalf("set --agent-mode=false: %v", err)
	}

	prettyFlag = false
	if got := resolvedOutputFormat(cmd); got != outputFormatJSON {
		t.Fatalf("expected output format %q, got %q", outputFormatJSON, got)
	}

	prettyFlag = true
	if got := resolvedOutputFormat(cmd); got != outputFormatPretty {
		t.Fatalf("expected output format %q, got %q", outputFormatPretty, got)
	}
}
