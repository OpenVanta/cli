# CLI conventions

- Group related commands by user-facing domain, not API resource boundaries (e.g. `people notification-settings`, `vendors assessment-types`).
- Make inputs discoverable in `--help`: list enum choices, identify ID resources, and use specific placeholders (`<status>`, `<id>`, `<timestamp>`), not `<value>`.
- Mark repeatable flags `(repeatable)`. Describe timestamps as “ISO 8601 timestamp”; avoid repeated format examples.

# Testing

- Test changes end to end when modifying the CLI. Build the binary and test the commands.
- Simulate a client with only the binary: discover inputs through the CLI itself, not the codebase. Always use an isolated tester without codebase access to test.
- Confirm the target API and available credentials with user before making calls.
