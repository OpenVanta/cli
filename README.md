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
  <a href="#what-you-can-manage">Resources</a> ·
  <a href="#examples">Examples</a>
</p>

---

## Install

**macOS and Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/VantaInc/cli/main/scripts/install.sh | bash
```

Optional flags:

```bash
# Install a specific version
curl -fsSL https://raw.githubusercontent.com/VantaInc/cli/main/scripts/install.sh | bash -s -- --version v0.1.0

# Install to a custom directory
curl -fsSL https://raw.githubusercontent.com/VantaInc/cli/main/scripts/install.sh | bash -s -- --install-dir ~/.local/bin
```

Confirm the install:

```bash
vanta version
```

## Authenticate

Create an OAuth client in the [Vanta developer portal](https://app.vanta.com), then run:

```bash
vanta login
```

You’ll be prompted for your API base URL, client ID, and client secret. Credentials are stored securely in your system keychain when available (macOS Keychain or Windows Credential Manager). Your API base is saved to `~/.vanta/config.json`.

You can also pass credentials via environment variables or flags:

| Option | Flag | Environment variable |
| --- | --- | --- |
| Client ID | `--client-id` | `VANTA_CLIENT_ID` |
| Client secret | `--client-secret` | `VANTA_CLIENT_SECRET` |
| OAuth scope | `--scope` | `VANTA_OAUTH_SCOPE` |
| API base URL | `--api-base` | `VANTA_API_BASE` |

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

Run `vanta <resource> --help` for the full list of actions on each resource.

## Examples

**Controls and policies**

```bash
vanta controls list --page-size 50
vanta controls create --json '{"name":"Example Control"}'
vanta policies get --id code-of-conduct-bsi
```

**Documents and evidence**

```bash
vanta documents list --page-size 25
vanta documents upload-file --id access-requests --file ./policy.pdf
vanta documents download-file --id access-requests --uploaded-file-id 123 --output ./downloaded.pdf
```

**Tests**

```bash
vanta tests list --status-filter NEEDS_ATTENTION
vanta tests list-entities --id aws-account-access-removed-on-termination --entity-status FAILING
```

**People**

```bash
vanta people update --id 65e1efde08e8478f143a8ff9 --file ./person-update.json
```

Create and update commands accept either `--json` (inline) or `--file` (path to a JSON file).

## Pagination

List commands return results in pages. Responses include a `nextCursor` when more results are available. Pass it with `--page-cursor` to fetch the next page:

```bash
vanta controls list --page-size 50 --page-cursor "<nextCursor>"
```

## Useful flags

| Flag | Description |
| --- | --- |
| `--dry-run` | Print the request without sending it |
| `--pretty` | Pretty-print JSON output (on by default; use `--pretty=false` for compact output) |
| `--verbose` | Log request details to stderr |
| `--agent-mode` | Optimize output for AI coding agents |

## Updates

The CLI periodically checks for newer releases and prints a notice when one is available. To disable update checks, set `VANTA_NO_UPDATE=1`.

To upgrade to the latest version, re-run the install script.
