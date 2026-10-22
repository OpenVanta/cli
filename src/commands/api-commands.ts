import type { Command } from "commander";
import * as sdk from "../generated/sdk.gen.js";
import { printResponse } from "../output.js";
import {
  addJsonFileOptions,
  collectString,
  parseOptionalBoolString,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  withClient,
  writeDownloadedMedia,
  type GetFlags,
} from "./helpers.js";

// Registers and runs the API commands described in src/commands/generated/ (see scripts/codegen/).

export type FlagKind = "string" | "integer" | "boolean" | "file" | "output";

export type FlagSpec = {
  flag: string; // "--slug-id <slug>"
  attribute: string; // commander's name for it: "slugId"
  description: string;
  required: boolean;
  repeatable: boolean;
  kind: FlagKind;
  in?: "path" | "query" | "form"; // unset for --output
  name?: string;
};

export type CommandSpec = {
  path: string[]; // ["trust-centers", "faqs", "get"]
  operationId: string;
  sdk: keyof typeof sdk;
  description: string;
  flags: FlagSpec[];
  jsonBody: boolean; // adds --json / --file
  binaryResponse: boolean;
};

export type GroupSpec = { path: string[]; description: string };

export function registerApiCommands(
  program: Command,
  getFlags: GetFlags,
  groups: GroupSpec[],
  commands: CommandSpec[],
): void {
  const byPath = new Map<string, Command>([["", program]]);
  const groupDescriptions = new Map(groups.map((g) => [g.path.join(" "), g.description]));

  const parentFor = (path: string[]): Command => {
    const key = path.join(" ");
    const existing = byPath.get(key);
    if (existing) return existing;
    const parent = parentFor(path.slice(0, -1));
    const group = parent
      .command(path[path.length - 1]!)
      .description(groupDescriptions.get(key) ?? "");
    byPath.set(key, group);
    return group;
  };

  for (const g of groups) parentFor(g.path);

  for (const spec of commands) {
    const cmd = parentFor(spec.path.slice(0, -1))
      .command(spec.path[spec.path.length - 1]!)
      .description(spec.description);

    for (const f of spec.flags) {
      const parse = f.repeatable
        ? collectString
        : f.kind === "integer"
          ? (v: string) => Number.parseInt(v, 10)
          : undefined;
      const defaultValue = f.repeatable ? ([] as string[]) : undefined;
      if (f.required)
        cmd.requiredOption(f.flag, f.description, parse as never, defaultValue as never);
      else if (parse) cmd.option(f.flag, f.description, parse as never, defaultValue as never);
      else cmd.option(f.flag, f.description);
    }
    if (spec.jsonBody) addJsonFileOptions(cmd);

    cmd.action(async (opts: Record<string, unknown>) => {
      const path: Record<string, unknown> = {};
      const query: Record<string, unknown> = {};
      const form: Record<string, unknown> = {};
      let output: string | undefined;

      for (const f of spec.flags) {
        const value = await flagValue(f, opts[f.attribute]);
        if (f.kind === "output") {
          output = value as string | undefined;
          continue;
        }
        if (value === undefined) continue;
        if (f.in === "path") path[f.name!] = value;
        else if (f.in === "query") query[f.name!] = value;
        else form[f.name!] = value;
      }

      const body = spec.jsonBody
        ? await readJSONPayload(opts.json as string, opts.file as string)
        : Object.keys(form).length > 0
          ? form
          : undefined;

      const fn = sdk[spec.sdk] as unknown as (
        options: Record<string, unknown>,
      ) => Promise<{ data?: unknown; error?: unknown }>;
      const request = (client: unknown) =>
        fn({
          client,
          ...(Object.keys(path).length ? { path } : {}),
          ...(Object.keys(query).length ? { query } : {}),
          ...(body !== undefined ? { body } : {}),
        });

      if (!spec.binaryResponse) {
        await runSdk(getFlags, (api) => request(api.client));
        return;
      }
      await withClient(getFlags, async (api, flags) => {
        const result = await request(api.client);
        if (result.error) throw result.error;
        await writeDownloadedMedia(result.data, output);
        if (output) printResponse({ savedTo: output }, flags);
      });
    });
  }

  // Each group's --help lists its own commands before its subgroups.
  for (const [key, group] of byPath) {
    if (key === "") continue;
    (group.commands as Command[]).sort(
      (a, b) => Number(a.commands.length > 0) - Number(b.commands.length > 0),
    );
  }
}

async function flagValue(f: FlagSpec, raw: unknown): Promise<unknown> {
  if (f.repeatable) {
    const values = (raw as string[]).map((v) => v.trim()).filter(Boolean);
    return values.length > 0 ? values : undefined;
  }
  if (raw === undefined) return undefined;
  if (f.kind === "integer") {
    return Number.isNaN(raw) || (raw as number) <= 0 ? undefined : raw;
  }
  const value = String(raw).trim();
  if (!value) {
    if (f.required) throw new Error(`${f.flag.split(" ")[0]} is required`);
    return undefined;
  }
  switch (f.kind) {
    case "boolean":
      return parseOptionalBoolString(value, f.flag.slice(2).split(" ")[0]!);
    case "file":
      return readBinaryFile(value);
    default:
      return value;
  }
}
