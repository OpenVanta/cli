import { readFile, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
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

export async function writeDownloadedMedia(
  data: unknown,
  outputPath: string | undefined,
): Promise<void> {
  const dest = outputPath?.trim();

  const writeBytes = async (buf: Buffer) => {
    if (dest) {
      await writeFile(dest, buf);
      return;
    }
    process.stdout.write(buf);
  };

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    await writeBytes(Buffer.from(await data.arrayBuffer()));
    return;
  }

  if (
    data &&
    typeof data === "object" &&
    "arrayBuffer" in data &&
    typeof (data as { arrayBuffer: unknown }).arrayBuffer === "function"
  ) {
    const ab = await (
      data as { arrayBuffer: () => Promise<ArrayBuffer> }
    ).arrayBuffer();
    await writeBytes(Buffer.from(ab));
    return;
  }

  if (data instanceof ArrayBuffer) {
    await writeBytes(Buffer.from(data));
    return;
  }

  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    await writeBytes(Buffer.from(data));
    return;
  }

  if (
    data instanceof ReadableStream ||
    (data &&
      typeof data === "object" &&
      "getReader" in data &&
      typeof (data as { getReader: unknown }).getReader === "function")
  ) {
    const stream = data as ReadableStream<Uint8Array>;
    if (dest) {
      const { createWriteStream } = await import("node:fs");
      await pipeline(
        Readable.fromWeb(stream as import("node:stream/web").ReadableStream),
        createWriteStream(dest),
      );
      return;
    }
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(value);
    }
    return;
  }

  if (
    data &&
    typeof data === "object" &&
    "pipe" in data &&
    typeof (data as { pipe: unknown }).pipe === "function"
  ) {
    const nodeStream = data as NodeJS.ReadableStream;
    if (dest) {
      const { createWriteStream } = await import("node:fs");
      await pipeline(nodeStream, createWriteStream(dest));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      nodeStream.on("error", reject);
      nodeStream.on("end", () => resolve());
      nodeStream.on("close", () => resolve());
      nodeStream.pipe(process.stdout, { end: false });
    });
    return;
  }

  throw new Error(
    `unsupported media response type: ${Object.prototype.toString.call(data)}`,
  );
}
