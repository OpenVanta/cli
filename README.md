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
cargo run -- controls list --pretty
cargo run -- controls get --id ctrl_123 --pretty
cargo run -- controls create --json '{"name":"Example Control"}' --pretty
```

## Go implementation

A parallel hand-rolled Go CLI is available in `go-cli/` with the same command surface and global flags.

Run it with:

```bash
cd go-cli
export VANTA_CLIENT_ID="your_client_id"
export VANTA_CLIENT_SECRET="your_client_secret"
go run . --pretty controls list
go run . --pretty controls get --id ctrl_123
go run . --pretty controls create --json '{"name":"Example Control"}'
```

## Global flags

- `--client-id` (or env `VANTA_CLIENT_ID`)
- `--client-secret` (or env `VANTA_CLIENT_SECRET`)
- `--scope` (or env `VANTA_OAUTH_SCOPE`, default `vanta-api.all:read vanta-api.all:write`)
- `--api-base` (default `https://api.vanta.com/v1`)
- `--dry-run` (print request details without sending)
- `--pretty` (pretty-print JSON)
- `--verbose` (logs request metadata to stderr)
