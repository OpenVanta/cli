# Vanta CLI

Vanta CLI for querying and mutating resources in the Vanta API.

## Supported resources

- `controls`
- `policies`
- `documents`
- `tests`
- `people`
- `frameworks`
- `users`
- `vulnerabilities`
- `vulnerability-remediations`
- `risk-scenarios`
- `monitored-computers`

## Quick start

1. Build the CLI:

```bash
go generate ./internal/vantaapi
go build -o vanta
```

2. Configure auth and API base (OAuth credentials are stored in macOS Keychain/Windows Credential Manager when available; API base is saved to `~/.vanta/config.json`):

```bash
./vanta login
```

3. Run commands:

```bash
./vanta controls list --page-size 50
./vanta policies get --id code-of-conduct-bsi
./vanta frameworks list-controls --id soc2
```

## Generated API client

The Go client under `internal/vantaapi` is generated with `ogen` and is not checked in.

- Regenerate locally with:

```bash
go generate ./internal/vantaapi
```

- CI also runs generation before tests.

## Common examples

```bash
# Create/update style commands accept --json or --file
./vanta controls create --json '{"name":"Example Control"}'
./vanta people update --id 65e1efde08e8478f143a8ff9 --file ./person-update.json

# Documents
./vanta documents list --page-size 25
./vanta documents upload-file --id access-requests --file ./policy.pdf
./vanta documents download-file --id access-requests --uploaded-file-id 123 --output ./downloaded.pdf

# Tests
./vanta tests list --status-filter NEEDS_ATTENTION
./vanta tests list-entities --id aws-account-access-removed-on-termination --entity-status FAILING
```

## Pagination

List responses include pagination metadata:

- `pageInfo`
- `totalCount` (when provided by the API)
- `nextCursor`

Use `nextCursor` with `--page-cursor` to fetch the next page:

```bash
./vanta controls list --page-size 50 --page-cursor "<nextCursor>"
```

## Global flags

- `--client-id`: OAuth client ID (or env `VANTA_CLIENT_ID`)
- `--client-secret`: OAuth client secret (or env `VANTA_CLIENT_SECRET`)
- `--scope`: OAuth scope (or env `VANTA_OAUTH_SCOPE`, default `vanta-api.all:read vanta-api.all:write`)
- `--api-base`: API base URL (or env `VANTA_API_BASE`, saved by `login`, default `https://api.vanta.com/v1`)
- `--dry-run`: print request details without sending
- `--pretty`: pretty-print JSON (default `true`; set `--pretty=false` for compact output)
- `--verbose`: log request metadata to stderr
- `--agent-mode`: force agent mode on/off; when enabled, command output defaults to TOON

`--agent-mode` also auto-enables when common agent runtime environment variables are present (Cursor, Claude Code, Codex, Aider, Cline, Windsurf, GitHub Copilot, Amazon Q, Gemini, Cody, and standard `AGENT`/`AI_AGENT` signals).

## Releasing binaries

Pushing a tag like `v0.1.0` triggers the GitHub Actions release workflow at `.github/workflows/release.yml`, which runs GoReleaser to publish binaries.

The workflow expects these repository secrets for macOS code signing and notarization:

- `MACOS_SIGN_P12`: Base64-encoded Developer ID Application certificate (`.p12`)
- `MACOS_SIGN_PASSWORD`: Password used when exporting the `.p12`
- `MACOS_NOTARY_ISSUER_ID`: App Store Connect API issuer ID
- `MACOS_NOTARY_KEY_ID`: App Store Connect API key ID
- `MACOS_NOTARY_KEY`: Base64-encoded App Store Connect API key (`.p8`)
