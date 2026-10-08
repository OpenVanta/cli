#!/usr/bin/env bash

set -e

corepack enable

echo "Installing repo dependencies..."
pnpm install --frozen-lockfile

if [ "${DISABLE_CLAUDE_CODE:-0}" = "1" ]; then
    echo "ℹ️  Claude Code CLI installation skipped (unset or set DISABLE_CLAUDE_CODE=0 as a project secret to enable)"
    echo "   To install manually later, run: curl -fsSL https://claude.ai/install.sh | bash"
else
    echo "Installing Claude Code CLI..."
    if curl -fsSL https://claude.ai/install.sh | bash; then
        echo "✅ Claude Code CLI installed successfully"
        echo "   To use Claude Code, run: claude"
    else
        echo "⚠️  Warning: Claude Code CLI installation failed, but continuing with environment setup"
        echo "   You can manually install later by running: curl -fsSL https://claude.ai/install.sh | bash"
    fi
fi

if [ "${DISABLE_CODEX_CLI:-0}" = "1" ]; then
    echo "ℹ️  Codex CLI installation skipped (unset or set DISABLE_CODEX_CLI=0 as a project secret to enable)"
    echo "   To install manually later, run: pnpm add -g @openai/codex"
else
    echo "Installing Codex CLI..."
    if pnpm add -g @openai/codex; then
        echo "✅ Codex CLI installed successfully"
        echo "   To use Codex CLI, run: codex"
    else
        echo "⚠️  Warning: Codex CLI installation failed, but continuing with environment setup"
        echo "   You can manually install later by running: pnpm add -g @openai/codex"
    fi
fi
