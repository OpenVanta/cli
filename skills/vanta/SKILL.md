---
name: vanta
version: 1.0.0
description: "Vanta CLI: Manage security and compliance data."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["vanta"]
---

# gws — Shared Reference

## Installation

The `vanta` binary must be on `$PATH`. See the project README for install options.

## Authentication

```bash
vanta login

```

## Global Flags

| Flag | Description |
|------|-------------|
| `--client-id <ID>` | OAuth client ID (overrides saved login) |
| `--client-secret <SECRET>` | OAuth client secret (overrides saved login) |
| `--scope <SCOPE>` | OAuth scope (default: `vanta-api.all:read vanta-api.all:write`) |
| `--api-base <URL>` | Base API URL (overrides saved config) |
| `--dry-run` | Print request details without sending |
| `--pretty[=true|false]` | Pretty-print JSON responses (default: `true`) |
| `--verbose` | Log request metadata to stderr |

## CLI Syntax

```bash
vanta <resource> [sub-resource] <method> [flags]
```

### Method Flags

| Flag | Description |
|------|-------------|
| `--id <ID>` | Resource identifier for get/update/delete-style commands |
| `--json '{"key":"val"}'` | Raw JSON payload for write commands |
| `--file <PATH>` | Path to JSON payload file (or upload file for upload commands) |
| `-o, --output <PATH>` | Save binary responses to file |
| `--page-size <N>` | Number of results to return on list commands |
| `--page-cursor <CURSOR>` | Pagination cursor from `nextCursor` |

## Security Rules

- **Never** output secrets (API keys, tokens) directly
- **Always** confirm with user before executing write/delete commands
- Prefer `--dry-run` for destructive operations
