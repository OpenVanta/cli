import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type RecordedRequest = { url: string; init: RequestInit | undefined };

const credentialEnvVars = [
  "VANTA_API_BASE",
  "VANTA_CLIENT_ID",
  "VANTA_CLIENT_SECRET",
  "VANTA_OAUTH_SCOPE",
];

/**
 * Points HOME at an empty temp dir, clears VANTA_* credential env vars, and
 * replaces global fetch with a recorder that answers every request with a
 * token response. Call `restore()` when done.
 */
export async function isolateCredentials() {
  const home = await mkdtemp(join(tmpdir(), "vanta-cli-test-"));
  const saved = new Map(
    ["HOME", ...credentialEnvVars].map((name) => [name, process.env[name]]),
  );
  const savedFetch = globalThis.fetch;
  const requests: RecordedRequest[] = [];

  process.env.HOME = home;
  for (const name of credentialEnvVars) delete process.env[name];
  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requests.push({ url, init });
    return new Response(
      JSON.stringify({ access_token: "minted-token", expires_in: 3600 }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const configPath = join(home, ".vanta", "config.json");
  return {
    requests,
    async writeConfig(cfg: Record<string, string>) {
      await mkdir(join(home, ".vanta"), { recursive: true });
      await writeFile(configPath, JSON.stringify(cfg));
    },
    async readConfig(): Promise<Record<string, string>> {
      return JSON.parse(await readFile(configPath, "utf8"));
    },
    async restore() {
      globalThis.fetch = savedFetch;
      for (const [name, value] of saved) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      await rm(home, { recursive: true, force: true });
    },
  };
}

export function authorizationHeader(request: RecordedRequest): string | null {
  return new Headers(request.init?.headers).get("Authorization");
}

export const inOneHour = (): string =>
  new Date(Date.now() + 60 * 60 * 1000).toISOString();
