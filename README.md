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
- `trust-centers`
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

## Trust Centers

Every `trust-centers` subcommand takes `--id`, the Trust Center slug ID. Nested resources are addressed with a
second ID flag such as `--resource-id`, `--faq-id`, or `--viewer-id`.

```bash
# The Trust Center itself
./vanta trust-centers get --id acme-trust

# Access requests
./vanta trust-centers list-access-requests --id acme-trust --page-size 25
./vanta trust-centers get-access-request --id acme-trust --access-request-id 65e1efde08e8478f143a8ff9
./vanta trust-centers approve-access-request --id acme-trust --access-request-id 65e1efde08e8478f143a8ff9
./vanta trust-centers deny-access-request --id acme-trust --access-request-id 65e1efde08e8478f143a8ff9 --json '{"reason":"Unverified domain"}'
./vanta trust-centers list-historical-access-requests --id acme-trust

# Activity
./vanta trust-centers list-activity --id acme-trust --event-types-matches-any PAGE_VIEW --after-date 2026-01-01T00:00:00Z

# Control categories and controls
./vanta trust-centers list-control-categories --id acme-trust
./vanta trust-centers get-control-category --id acme-trust --category-id cat_123
./vanta trust-centers add-control-category --id acme-trust --json '{"name":"Access Control"}'
./vanta trust-centers update-control-category --id acme-trust --category-id cat_123 --file ./category.json
./vanta trust-centers delete-control-category --id acme-trust --category-id cat_123
./vanta trust-centers list-controls --id acme-trust --page-size 50
./vanta trust-centers get-control --id acme-trust --control-id ctl_123
./vanta trust-centers add-control --id acme-trust --json '{"controlId":"ctl_123","categoryIds":["cat_123"]}'
./vanta trust-centers delete-control --id acme-trust --control-id ctl_123

# FAQs
./vanta trust-centers list-faqs --id acme-trust
./vanta trust-centers get-faq --id acme-trust --faq-id faq_123
./vanta trust-centers create-faq --id acme-trust --file ./faq.json
./vanta trust-centers update-faq --id acme-trust --faq-id faq_123 --file ./faq.json
./vanta trust-centers delete-faq --id acme-trust --faq-id faq_123

# Resource categories and resources
./vanta trust-centers list-resource-categories --id acme-trust
./vanta trust-centers add-resource-category --id acme-trust --json '{"name":"Certifications"}'
./vanta trust-centers update-resource-category --id acme-trust --category-id cat_123 --file ./category.json
./vanta trust-centers delete-resource-category --id acme-trust --category-id cat_123
./vanta trust-centers upsert-resource-categories-order --id acme-trust --file ./category-order.json
./vanta trust-centers list-resources --id acme-trust
./vanta trust-centers get-resource --id acme-trust --resource-id res_123
./vanta trust-centers create-resource --id acme-trust --file ./soc2.pdf --title "SOC 2 Type II" --is-public false
./vanta trust-centers update-resource --id acme-trust --resource-id res_123 --file ./resource.json
./vanta trust-centers delete-resource --id acme-trust --resource-id res_123
./vanta trust-centers download-resource-media --id acme-trust --resource-id res_123 --output ./soc2.pdf

# Subprocessors
./vanta trust-centers list-subprocessors --id acme-trust
./vanta trust-centers get-subprocessor --id acme-trust --subprocessor-id sub_123
./vanta trust-centers create-subprocessor --id acme-trust --json '{"name":"Example Cloud"}'
./vanta trust-centers update-subprocessor --id acme-trust --subprocessor-id sub_123 --file ./subprocessor.json
./vanta trust-centers delete-subprocessor --id acme-trust --subprocessor-id sub_123

# Subscriber groups and subscribers
./vanta trust-centers list-subscriber-groups --id acme-trust
./vanta trust-centers get-subscriber-group --id acme-trust --subscriber-group-id grp_123
./vanta trust-centers create-subscriber-group --id acme-trust --json '{"name":"Enterprise customers"}'
./vanta trust-centers update-subscriber-group --id acme-trust --subscriber-group-id grp_123 --file ./group.json
./vanta trust-centers delete-subscriber-group --id acme-trust --subscriber-group-id grp_123
./vanta trust-centers list-subscribers --id acme-trust --customer-trust-account-id acct_123
./vanta trust-centers get-subscriber --id acme-trust --subscriber-id sbr_123
./vanta trust-centers create-subscriber --id acme-trust --json '{"email":"security@example.com"}'
./vanta trust-centers delete-subscriber --id acme-trust --subscriber-id sbr_123
./vanta trust-centers upsert-subscriber-groups --id acme-trust --subscriber-id sbr_123 --json '{"groupIds":["grp_123"]}'

# Updates and notifications
./vanta trust-centers list-updates --id acme-trust
./vanta trust-centers get-update --id acme-trust --update-id upd_123
./vanta trust-centers create-update --id acme-trust --file ./update.json
./vanta trust-centers update-update --id acme-trust --update-id upd_123 --file ./update.json
./vanta trust-centers delete-update --id acme-trust --update-id upd_123
./vanta trust-centers notify-all-subscribers --id acme-trust --update-id upd_123
./vanta trust-centers notify-specific-subscribers --id acme-trust --update-id upd_123 --json '{"subscriberGroupIds":["grp_123"]}'

# Viewers
./vanta trust-centers list-viewers --id acme-trust --include-removed true
./vanta trust-centers get-viewer --id acme-trust --viewer-id vwr_123
./vanta trust-centers add-viewer --id acme-trust --file ./viewer.json
./vanta trust-centers update-viewer --id acme-trust --viewer-id vwr_123 --file ./viewer.json
./vanta trust-centers remove-viewer --id acme-trust --viewer-id vwr_123
```

Updating the Trust Center record itself is not available: the `PATCH /trust-centers/{slugId}` operation is skipped
by `ogen` code generation (discriminator inference is unsupported), so no client method exists to wrap.

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
