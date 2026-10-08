// Checks on the real api-spec.json and codegen.config.ts. The rules themselves
// are unit-tested in spec-to-commands.test.ts.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import config from "../../codegen.config.js";
import { commands } from "../../src/commands/generated/index.js";
import { type ApiSpec, GLOBAL_FLAGS, specToCommands } from "./spec-to-commands.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const spec = JSON.parse(readFileSync(join(root, "api-spec.json"), "utf8")) as ApiSpec;

describe("generated commands", () => {
  it("come from a config with no errors", () => {
    assert.deepEqual(specToCommands(spec, config).errors, []);
  });

  it("cover every API operation exactly once", () => {
    const ids = Object.values(spec.paths).flatMap((item) =>
      Object.values(item).flatMap((op) => (op.operationId ? [op.operationId] : [])),
    );
    assert.deepEqual(commands.map((c) => c.operationId).sort(), ids.sort());
  });

  it("know every global flag in `vanta --help`", () => {
    const help = execFileSync(process.execPath, ["--import", "tsx", "src/cli.ts", "--help"], {
      cwd: root,
      encoding: "utf8",
    });
    const options = help.split("Commands:")[0]!;
    const flags = [...options.matchAll(/^\s+(?:-\w, )?--([\w-]+)/gm)].map((m) => m[1]);
    assert.deepEqual(flags.sort(), [...GLOBAL_FLAGS].sort());
  });

  it("never use <value> as a placeholder", () => {
    const vague = commands.flatMap((c) =>
      c.flags.filter((f) => f.flag.endsWith("<value>")).map((f) => `${c.path.join(" ")} ${f.flag}`),
    );
    assert.deepEqual(vague, []);
  });
});
