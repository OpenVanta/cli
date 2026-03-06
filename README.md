# hackday-cli

Experimental Vanta CLI in Rust.

## What it supports

- `vanta controls create --json '<payload>'`
- `vanta controls list`
- `vanta controls get --id <control_id>`

## Quick start

1. Install Rust
2. Configure OAuth client credentials (recommended via CLI login):

```bash
go run . login
```

3. Run commands:

```bash
cargo run -- controls list
cargo run -- controls get --id ctrl_123
cargo run -- controls create --json '{"name":"Example Control"}'
```

## Go implementation

A parallel hand-rolled Go CLI is available in `go-cli/` with the same command surface and global flags.

Run it with:

```bash
cd go-cli
export VANTA_CLIENT_ID="your_client_id"
export VANTA_CLIENT_SECRET="your_client_secret"
go run . controls list
go run . controls get --id ctrl_123
go run . controls create --json '{"name":"Example Control"}'
```

## Global flags

- `--client-id` (or env `VANTA_CLIENT_ID`)
- `--client-secret` (or env `VANTA_CLIENT_SECRET`)
- `--scope` (or env `VANTA_OAUTH_SCOPE`, default `vanta-api.all:read vanta-api.all:write`)
- `--api-base` (or env `VANTA_API_BASE`, saved by `login`, default `https://api.vanta.com/v1`)
- `--dry-run` (print request details without sending)
- `--pretty` (defaults to true; set `--pretty=false` for compact JSON)
- `--verbose` (logs request metadata to stderr)
