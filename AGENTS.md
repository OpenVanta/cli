# Changing commands

- API commands are generated from `api-spec.json` and `codegen.config.ts` by the rules in `scripts/codegen/spec-to-commands.ts`. Never edit `api-spec.json` or `src/commands/generated/`; only `login` and `version` are hand-written.
- Sync the spec with `curl -sSL -o api-spec.json https://developer.vanta.com/reference/manage-vanta.json`.
- Work around spec problems with a generator rule (tested in `spec-to-commands.test.ts`) when they affect many commands, otherwise in `codegen.config.ts` (sections explained in `scripts/codegen/config.ts`).
- Run `pnpm generate` and commit `src/commands/generated/`; its diff is the change to the CLI surface. CI fails if it is stale.

# CLI conventions

The generator applies these and `spec-to-commands.test.ts` checks them; follow them by hand in `login` and `version`.

- Group commands by user-facing domain (`people notification-settings`), not API resource boundaries.
- ID flags keep the API parameter name (`--control-id`, `--document-id`); no flag reuses a global flag name (`--scope`).
- `--help` lists enum choices, marks `(repeatable)` flags, calls timestamps "ISO 8601", and uses these placeholders, never `<value>`: `<id>`, `<timestamp>`, `<date>`, `<bool>`, `<query>`, `<json>`, `<path>`, `<text>`, or the enum's name (`<status>`).

# Testing

- Build the binary and test changed commands end to end, using an isolated tester that has only the binary and discovers inputs through `--help`.
- Confirm the target API and credentials with the user before making calls.
