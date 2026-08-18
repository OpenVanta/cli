export const autoAgentDetectionEnvVars = [
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
] as const;

function agentSignalEnabled(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "":
    case "0":
    case "false":
    case "no":
    case "off":
    case "none":
    case "disabled":
      return false;
    default:
      return true;
  }
}

export function detectAgentEnvironment(
  lookup: (name: string) => string | undefined = (name) => process.env[name],
): boolean {
  for (const envVar of autoAgentDetectionEnvVars) {
    const value = lookup(envVar);
    if (value !== undefined && agentSignalEnabled(value)) {
      return true;
    }
  }
  return false;
}

export function agentModeEnabled(explicit?: boolean): boolean {
  if (explicit !== undefined) {
    return explicit;
  }
  return detectAgentEnvironment();
}
