# hackday-cli

Experimental Vanta CLI in Rust.

## What it supports

- `vanta controls create --json '<payload>'`
- `vanta controls list`
- `vanta controls get --id <control_id>`

## Quick start

1. Install Rust
2. Set your API token:

```bash
export VANTA_API_KEY="your_token_here"
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
export VANTA_API_KEY="your_token_here"
go run . --pretty controls list
go run . --pretty controls get --id ctrl_123
go run . --pretty controls create --json '{"name":"Example Control"}'
```

## Global flags

- `--token` (or env `VANTA_API_KEY`)
- `--api-base` (default `https://api.vanta.com/v1`)
- `--dry-run` (print request details without sending)
- `--pretty` (pretty-print JSON)
- `--verbose` (logs request metadata to stderr)
