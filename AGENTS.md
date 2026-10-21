# Command structure

Commands in `src/commands/` are generated from `api-spec.json` by `scripts/codegen/`; put exceptions in `scripts/codegen/config.ts` instead of editing generated files.

We map from the REST api path to a command structure for CLI with the following rules:
- A command is `<group> <verb>-<noun>`. The group is the path's first segment (`/vendors/...` → `vendors`).
- The verb is a trailing action in the path (`/vendors/{vendorId}/set-status` → `set-status`), or comes from the method when there is no trailing action: GET → `list` or `get`, POST → `create` or `upload` (files), PATCH → `update`, PUT → `set`, DELETE → `delete`. A POST or DELETE that attaches or detaches an existing resource is `add` or `remove` (`groups add-person`), and a GET that returns a file is `download` (`trust-centers download-resource-media`). A multi-word action puts the noun after its first word: `trust-centers send-viewer-invite-reminder`.
- The noun joins the REST api path resources after the group: `vendors list-findings`. It is singular, except the last word is plural for `list` and for bulk operations on a collection (`trust-centers set-videos`). `create` and `upload` make one item, so stay singular. Only segments that are plural nouns change number; others stay as written (`knowledge-base list-answer-library`). Omit the noun when the command acts on the group itself (`vendors get`).
- Every API input is a flag; there are no positional arguments. Path parameters, query parameters, and multipart fields each get a kebab-case flag, required when the spec requires it and repeatable for arrays. The group's own ID is `--id` (`trust-centers` uses `--slug-id <slug>`); other path parameters keep their names (`--finding-id`). JSON bodies take `--json <json>` or `--file <path>`, and file downloads take `--output <path>`.
- Pass values through to the API as given; the API validates them. Only booleans and `--page-size` are parsed, and file paths read.

# Help text

- Start from the spec: option descriptions are the parameter's spec description, and command descriptions follow the verb (“List vendors”, “Get a vendor by ID”). Override them only where the default reads poorly.
- Make inputs discoverable in `--help`: list enum choices, identify ID resources, and use specific placeholders (`<status>`, `<id>`, `<timestamp>`), not `<value>`.
- Use the same placeholder for common inputs: `<id>` for IDs, `<timestamp>` for date-times, `<date>` for date-only values, `<bool>` for true/false, `<query>` for search terms, `<json>` for inline JSON, `<path>` for local files, and `<text>` for other free text.
- Mark repeatable flags `(repeatable)`. Describe timestamps as “ISO 8601 timestamp”; avoid repeated format examples.

# Formatting

- Run `pnpm format` (oxfmt) before committing; CI runs `pnpm format:check`. Markdown is not formatted.

# Testing

- Test changes end to end when modifying the CLI. Build the binary and test the commands.
- Simulate a client with only the binary: discover inputs through the CLI itself, not the codebase. Always use an isolated tester without codebase access to test.
- Confirm the target API and available credentials with user before making calls.
