// Writes src/commands/generated/ (committed, so review sees CLI changes as a diff).
// With --check, fails instead if it's stale.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import config from "../../codegen.config.js";
import { type ApiSpec, renderCommandFiles, specToCommands } from "./spec-to-commands.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "src/commands/generated");

const spec = JSON.parse(readFileSync(join(root, "api-spec.json"), "utf8")) as ApiSpec;
const { commands, groups, errors } = specToCommands(spec, config);
if (errors.length) {
  console.error(`codegen failed with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
const files = renderCommandFiles(commands, groups);

const existing = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith(".ts")) : [];
const changed = (f: string, text: string) =>
  !existing.includes(f) || readFileSync(join(outDir, f), "utf8") !== text;
const stale = [
  ...[...files].filter(([f, text]) => changed(f, text)).map(([f]) => f),
  ...existing.filter((f) => !files.has(f)),
];

if (process.argv.includes("--check")) {
  if (stale.length) {
    console.error(
      `src/commands/generated/ is out of date (${stale.join(", ")}). ` +
        "Run pnpm generate and commit the result.",
    );
    process.exit(1);
  }
  console.error("src/commands/generated/ is up to date");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
for (const f of existing) if (!files.has(f)) rmSync(join(outDir, f));
for (const [f, text] of files) writeFileSync(join(outDir, f), text);
console.error(
  `${commands.length} commands, ${groups.length} groups -> src/commands/generated/ ` +
    `(${files.size} files, ${stale.length} changed)`,
);
