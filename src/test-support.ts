/** Shared helpers for tests that touch the config file and the network. */
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type RecordedRequest = {
  url: string;
  method: string;
  headers: Headers;
  body: string;
};

/** Points HOME at a fresh directory so the config file is isolated. */
export async function useTempHome(): Promise<{
  dir: string;
  readConfig: () => Promise<Record<string, unknown>>;
  writeConfig: (cfg: Record<string, unknown>) => Promise<void>;
  restore: () => Promise<void>;
}> {
  const previous = process.env.HOME;
  const dir = await mkdtemp(join(tmpdir(), "vanta-cli-test-"));
  process.env.HOME = dir;
  const path = join(dir, ".vanta", "config.json");
  return {
    dir,
    readConfig: async () => JSON.parse(await readFile(path, "utf8")),
    writeConfig: async (cfg) => {
      await mkdir(join(dir, ".vanta"), { recursive: true });
      await writeFile(path, JSON.stringify(cfg));
    },
    restore: async () => {
      process.env.HOME = previous;
      await rm(dir, { recursive: true, force: true });
    },
  };
}

/** Replaces global fetch; `respond` decides each response. */
export function stubFetch(
  respond: (req: RecordedRequest) => Response | Promise<Response>,
): { requests: RecordedRequest[]; restore: () => void } {
  const original = globalThis.fetch;
  const requests: RecordedRequest[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req: RecordedRequest = {
      url: input instanceof Request ? input.url : String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : "",
    };
    requests.push(req);
    return respond(req);
  }) as typeof fetch;
  return { requests, restore: () => (globalThis.fetch = original) };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
