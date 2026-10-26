/// <reference types="node" />
// Generates the API commands in src/commands/ from api-spec.json.
//
//   pnpm generate:commands [--out <dir>]
//
// AGENTS.md ("Command structure") describes the naming rules; config.ts holds
// the exceptions and help text overrides. Each stage is its own module:
//
//   spec.ts      read each API operation into an `Operation`
//   naming.ts    place it in a group and name it (`vendors list-findings`)
//   options.ts   turn its parameters and body into flags
//   help.ts      describe the command, then apply help overrides
//   groups.ts    collect commands into groups
//   render.ts    write one TypeScript file per group, plus index.ts
//
// words.ts has the shared word helpers. The rendered files are formatted with
// oxfmt, using the repo's .oxfmtrc.json.
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { buildGroups, checkUniqueNames } from "./groups.js";
import { applyHelpOverrides } from "./help.js";
import { generatedHeader, renderFiles } from "./render.js";
import { loadOperations } from "./spec.js";

const repoRoot = new URL("../../", import.meta.url).pathname;
const commandsDir = join(repoRoot, "src/commands");
const { values: args } = parseArgs({ options: { out: { type: "string" } } });
const outDir = args.out ?? commandsDir;

const groups = buildGroups(loadOperations(join(repoRoot, "api-spec.json")));
checkUniqueNames(groups);
applyHelpOverrides(groups);

const files = renderFiles(groups);

// Write the files, removing generated files for groups that no longer exist.
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  const path = join(outDir, name);
  if (
    !files.has(name) &&
    name.endsWith(".ts") &&
    readFileSync(path, "utf8").startsWith(generatedHeader)
  ) {
    rmSync(path);
  }
}
const paths = [...files.keys()].map((name) => join(outDir, name));
for (const [name, content] of files) writeFileSync(join(outDir, name), content);
// Pass the config explicitly so `--out` elsewhere gets the same output.
execFileSync(
  join(repoRoot, "node_modules/.bin/oxfmt"),
  ["-c", join(repoRoot, ".oxfmtrc.json"), ...paths],
  { stdio: ["ignore", "ignore", "inherit"] },
);
console.error(`wrote ${files.size} files to ${outDir}`);
