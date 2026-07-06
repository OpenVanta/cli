package cmd

import (
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var autoAgentDetectionEnvVars = []string{
	"AI_AGENT",
	"AGENT",
	"CLAUDECODE",
	"CLAUDE_CODE",
	"CLAUDE_CODE_ENTRYPOINT",
	"CURSOR_AGENT",
	"CURSOR_TRACE_ID",
	"CURSOR_EXTENSION_HOST_ROLE",
	"CODEX_SANDBOX",
	"CODEX_CI",
	"CODEX_THREAD_ID",
	"AIDER",
	"AIDER_MODE",
	"CLINE_ACTIVE",
	"WINDSURF",
	"WINDSURF_MODE",
	"GITHUB_COPILOT",
	"COPILOT_MODE",
	"AMAZON_Q",
	"Q_AGENT",
	"GEMINI_CLI",
	"GEMINI_CODE_ASSIST",
	"CODY",
}

func agentModeEnabled(cmd *cobra.Command) bool {
	if cmd != nil {
		if flag := cmd.Flag("agent-mode"); flag != nil && flag.Changed {
			return agentModeFlag
		}
	}

	return detectAgentEnvironment()
}

func detectAgentEnvironment() bool {
	return detectAgentEnvironmentFromLookup(os.LookupEnv)
}

func detectAgentEnvironmentFromLookup(lookup func(string) (string, bool)) bool {
	for _, envVar := range autoAgentDetectionEnvVars {
		value, ok := lookup(envVar)
		if !ok {
			continue
		}
		if agentSignalEnabled(value) {
			return true
		}
	}

	return false
}

func agentSignalEnabled(value string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "", "0", "false", "no", "off", "none", "disabled":
		return false
	default:
		return true
	}
}
