import { readFile } from "node:fs/promises";
import type { Command } from "commander";
import { newAPIClient, type ApiClient, type GlobalFlags } from "../api-client.js";
import { printResponse } from "../output.js";

export type GetFlags = () => GlobalFlags;

export function collectString(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function addPaginationOptions(cmd: Command): Command {
  return cmd
    .option("--page-size <n>", "Number of results to return", (v) =>
      Number.parseInt(v, 10),
    )
    .option("--page-cursor <cursor>", "Pagination cursor");
}

export function addJsonFileOptions(cmd: Command): Command {
  return cmd
    .option("--json <json>", "Inline JSON payload")
    .option("--file <path>", "Path to a JSON payload file");
}

export function paginationQuery(opts: {
  pageSize?: number;
  pageCursor?: string;
}): { pageSize?: number; pageCursor?: string } {
  return {
    ...(opts.pageSize && opts.pageSize > 0 ? { pageSize: opts.pageSize } : {}),
    ...(opts.pageCursor?.trim()
      ? { pageCursor: opts.pageCursor.trim() }
      : {}),
  };
}

export async function readJSONPayload(
  jsonRaw?: string,
  filePath?: string,
): Promise<unknown> {
  const hasInline = Boolean(jsonRaw?.trim());
  const hasFile = Boolean(filePath?.trim());
  if (hasInline && hasFile) {
    throw new Error("pass either --json or --file, not both");
  }
  if (!hasInline && !hasFile) {
    throw new Error("missing payload: pass --json or --file");
  }

  const raw = hasInline
    ? jsonRaw!.trim()
    : await readFile(filePath!.trim(), "utf8");

  try {
    return JSON.parse(raw) as unknown;
  } catch (err) {
    throw new Error(`invalid json payload: ${(err as Error).message}`);
  }
}

export function parseOptionalBoolString(
  value: string | undefined,
  flagName: string,
): boolean | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  switch (value.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
      return true;
    case "false":
    case "0":
    case "no":
      return false;
    default:
      throw new Error(`invalid --${flagName}: expected true or false`);
  }
}

export async function withClient<T>(
  getFlags: GetFlags,
  fn: (api: ApiClient, flags: GlobalFlags) => Promise<T>,
): Promise<T | undefined> {
  const flags = getFlags();
  const api = await newAPIClient(flags);
  try {
    return await fn(api, flags);
  } catch (err) {
    const handled = api.handleError(err);
    if (handled !== undefined) throw handled;
    return undefined;
  }
}

export async function runSdk<T>(
  getFlags: GetFlags,
  call: (api: ApiClient) => Promise<{ data?: T; error?: unknown }>,
): Promise<void> {
  await withClient(getFlags, async (api, flags) => {
    const { data, error } = await call(api);
    if (error) throw error;
    printResponse(data, flags);
  });
}

export async function readBinaryFile(path: string): Promise<Blob> {
  const buf = await readFile(path);
  return new Blob([buf]);
}
