<p align="center">
  <img src="https://cdn.prod.website-files.com/64009032676f24f376f002fc/6400ac82429afb0f7b31fa6c_vanta-logo.svg" alt="Vanta" width="180" />
</p>

<h1 align="center">Vanta CLI</h1>

<p align="center">
  Manage your compliance program from the terminal—list controls, review tests,<br />
  upload evidence, and more—using the same Vanta API that powers your account.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#authenticate">Authenticate</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#development">Development</a>
</p>

---

## Install

**macOS and Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/OpenVanta/cli/main/scripts/install.sh | bash
```

Optional flags:

```bash
# Install a specific version
curl -fsSL https://raw.githubusercontent.com/OpenVanta/cli/main/scripts/install.sh | bash -s -- --version v0.2.0

# Install to a custom directory
curl -fsSL https://raw.githubusercontent.com/OpenVanta/cli/main/scripts/install.sh | bash -s -- --install-dir ~/.local/bin
```

Confirm the install:

```bash
vanta version
```

Standalone binaries are published for Linux, macOS, and Windows. macOS builds are signed and notarized.

## Authenticate

Create an OAuth client in the [Vanta developer portal](https://app.vanta.com/settings/developer-console), then run:

```bash
vanta login
```

You’ll be prompted for your API base URL, client ID, and client secret. Credentials are stored in the OS keychain when available (macOS Keychain or Windows Credential Manager), matching the previous Go CLI (`com.vanta.cli` / `oauth`). Your API base is saved to `~/.vanta/config.json`.

OAuth credentials are bound to the API base used at login; changing it requires logging in again. The supported Vanta hosts are `api.vanta.com`, `api.eu.vanta.com`, `api.aus.vanta.com`, and `api.vanta-gov.com`.

Ad-hoc credentials supplied by flags or environment variables are restricted to those supported Vanta hosts and do not inherit custom-host trust from a saved login. To use a custom HTTPS host, run `vanta login` and type `TRUST` after the host is displayed; the OAuth client secret will be sent there and the saved credentials will be bound to that API base. Existing saved logins created before API-base binding was added must be saved again with `vanta login` before a new token can be requested.

You can also pass credentials via environment variables or flags:

| Option | Flag | Environment variable |
| --- | --- | --- |
| Client ID | `--client-id` | `VANTA_CLIENT_ID` |
| Client secret | `--client-secret` | `VANTA_CLIENT_SECRET` |
| OAuth scope | `--scope` | `VANTA_OAUTH_SCOPE` |
| API base URL | `--api-base` | `VANTA_API_BASE` |

Provide the client ID and client secret together from the same source. If either credential flag is supplied, both flags are required; a complete flag pair takes precedence over environment credentials. Partial flag or environment pairs are rejected rather than combined with another source or a saved login.

Default API base: `https://api.vanta.com/v1`  
Default scope: `vanta-api.all:read vanta-api.all:write`

## Quick start

```bash
# List controls
vanta controls list --page-size 50

# Get a policy
vanta policies get --id code-of-conduct-bsi

# List controls for a framework
vanta frameworks list-controls --id soc2

# Find tests that need attention
vanta tests list --status-filter NEEDS_ATTENTION
```

## What you can manage

| Resource | Command |
| --- | --- |
| Controls | `vanta controls` |
| Policies | `vanta policies` |
| Documents | `vanta documents` |
| Tests | `vanta tests` |
| People | `vanta people` |
| Business units | `vanta business-units` |
| Issues | `vanta issues` |
| Personnel notification settings | `vanta people notification-settings` |
| Program scopes | `vanta program-scopes` |
| Vendor assessment types | `vanta vendors assessment-types` |
| Vendor risk attributes | `vanta vendors risk-attributes` |
| Groups | `vanta groups` |
| Frameworks | `vanta frameworks` |
| Users | `vanta users` |
| Vulnerabilities | `vanta vulnerabilities` |
| Vulnerable assets | `vanta vulnerable-assets` |
| Vulnerability remediations | `vanta vulnerability-remediations` |
| Contracts | `vanta contracts` |
| Risk scenarios | `vanta risk-scenarios` |
| Monitored computers | `vanta monitored-computers` |
| Vendors | `vanta vendors` |
| Discovered vendors | `vanta discovered-vendors` |
| Integrations | `vanta integrations` |
| Event logs | `vanta event-logs` |
| Customer Trust accounts, questionnaires, exports, and tags | `vanta customer-trust` |
| Knowledge Base answers and resources | `vanta knowledge-base` |
| Trust Center configuration, content, access, and subscribers | `vanta trust-centers` |

Run `vanta <resource> --help` for the full list of actions on each resource.

## Useful flags

| Flag | Description |
| --- | --- |
| `--dry-run` | Print the request without sending |
| `--pretty` | Pretty-print JSON output (on by default; use `--no-pretty` for compact output) |
| `--verbose` | Log request details to stderr |
| `--agent-mode` | Optimize output for AI coding agents (TOON) |

## Updates

The CLI periodically checks GitHub Releases for a newer version (cached for 24h in `~/.vanta/update-check.json`) and prints a notice on stderr when one is available. Checks are skipped for `dev` builds, non-TTY stderr, CI, agent mode, or when `VANTA_NO_UPDATE=1`.

To upgrade:

```bash
curl -fsSL https://raw.githubusercontent.com/OpenVanta/cli/main/scripts/install.sh | bash
```

## Development

Requires Node 22+ and pnpm 12. Bun is required to build standalone binaries.

```bash
pnpm install
pnpm generate   # OpenAPI → src/generated
pnpm dev version
pnpm typecheck
pnpm test
pnpm build              # generate + bundle for Node
VANTA_VERSION=0.2.0 pnpm build:binaries
```

The typed API client is generated from [`api-spec.json`](api-spec.json) with [`@hey-api/openapi-ts`](https://heyapi.dev/).
