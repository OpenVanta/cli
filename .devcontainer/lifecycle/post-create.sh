#!/usr/bin/env bash

set -e

corepack enable

echo "Installing tmux..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends tmux

echo "Installing repo dependencies..."
pnpm install --frozen-lockfile

if [ "${DISABLE_CLAUDE_CODE:-0}" = "1" ]; then
    echo "ℹ️  Claude Code CLI installation skipped (unset or set DISABLE_CLAUDE_CODE=0 as a project secret to enable)"
    echo "   To install manually later, run: npm install -g @anthropic-ai/claude-code@latest"
else
    echo "Installing Claude Code CLI..."
    if npm install -g @anthropic-ai/claude-code@latest; then
        echo "✅ Claude Code CLI installed successfully"
        echo "   To use Claude Code, run: claude"
    else
        echo "⚠️  Warning: Claude Code CLI installation failed, but continuing with environment setup"
        echo "   You can manually install later by running: npm install -g @anthropic-ai/claude-code@latest"
    fi
fi

if [ "${DISABLE_CODEX_CLI:-0}" = "1" ]; then
    echo "ℹ️  Codex CLI installation skipped (unset or set DISABLE_CODEX_CLI=0 as a project secret to enable)"
    echo "   To install manually later, run: npm install -g @openai/codex@latest"
else
    echo "Installing Codex CLI..."
    if npm install -g @openai/codex@latest; then
        echo "✅ Codex CLI installed successfully"
        echo "   To use Codex CLI, run: codex"
    else
        echo "⚠️  Warning: Codex CLI installation failed, but continuing with environment setup"
        echo "   You can manually install later by running: npm install -g @openai/codex@latest"
    fi
fi
