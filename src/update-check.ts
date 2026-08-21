import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { agentModeEnabled } from "./agent-mode.js";
import { Version, displayVersion, normalizeVersion, userAgent } from "./version.js";

const updateCheckRepo = "OpenVanta/cli";
const updateCheckIntervalMs = 24 * 60 * 60 * 1000;
const updateCheckHTTPTimeoutMs = 1500;
const updateCheckEnvDisable = "VANTA_NO_UPDATE";
const installScriptURL =
  "https://raw.githubusercontent.com/OpenVanta/cli/main/scripts/install.sh";

type UpdateCheckCache = {
  checked_at: string;
  latest_version: string;
};

type UpdateCheckOptions = {
  agentMode?: boolean;
  /** Injected for tests. */
  now?: () => Date;
  fetchImpl?: typeof fetch;
  stderrIsTTY?: boolean;
  env?: NodeJS.ProcessEnv;
};

let checkPromise: Promise<string | null> | null = null;

export function envTruthy(value: string | undefined): boolean {
  switch ((value ?? "").trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    default:
      return false;
  }
}

export function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = parseSemver(normalizeVersion(latest));
  const currentParts = parseSemver(normalizeVersion(current));
  if (!latestParts || !currentParts) {
    const a = normalizeVersion(latest);
    const b = normalizeVersion(current);
    return a !== b && a > b;
  }
  for (let i = 0; i < 3; i++) {
    if (latestParts[i]! > currentParts[i]!) return true;
    if (latestParts[i]! < currentParts[i]!) return false;
  }
  return false;
}

function parseSemver(version: string): [number, number, number] | null {
  const segments = version.split(".");
  if (segments.length < 1 || segments.length > 3) return null;
  const parts: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < segments.length; i++) {
    if (!/^\d+$/.test(segments[i]!)) {
      return null;
    }
    const n = Number.parseInt(segments[i]!, 10);
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    parts[i] = n;
  }
  return parts;
}

export function shouldNotifyUpdates(options: UpdateCheckOptions = {}): boolean {
  const env = options.env ?? process.env;
  if (!normalizeVersion(Version) || Version === "dev") {
    return false;
  }
  if (envTruthy(env[updateCheckEnvDisable])) {
    return false;
  }
  if (envTruthy(env.CI)) {
    return false;
  }
  if (agentModeEnabled(options.agentMode)) {
    return false;
  }
  const tty =
    options.stderrIsTTY !== undefined
      ? options.stderrIsTTY
      : Boolean(process.stderr.isTTY);
  if (!tty) {
    return false;
  }
  return true;
}

function updateCheckCachePath(): string {
  return join(homedir(), ".vanta", "update-check.json");
}

async function readUpdateCheckCache(): Promise<UpdateCheckCache | null> {
  try {
    const raw = await readFile(updateCheckCachePath(), "utf8");
    return JSON.parse(raw) as UpdateCheckCache;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    return null;
  }
}

async function writeUpdateCheckCache(cache: UpdateCheckCache): Promise<void> {
  const path = updateCheckCachePath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`, { mode: 0o600 });
}

async function fetchLatestReleaseVersion(
  fetchImpl: typeof fetch,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), updateCheckHTTPTimeoutMs);
  try {
    const resp = await fetchImpl(
      `https://api.github.com/repos/${updateCheckRepo}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": userAgent(),
        },
        signal: controller.signal,
      },
    );
    if (!resp.ok) {
      throw new Error(`github releases latest: ${resp.status}`);
    }
    const release = (await resp.json()) as { tag_name?: string };
    const tag = release.tag_name?.trim() ?? "";
    if (!tag) {
      throw new Error("github releases latest: empty tag_name");
    }
    return normalizeVersion(tag);
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveLatestVersion(
  options: UpdateCheckOptions = {},
): Promise<string> {
  const now = options.now ?? (() => new Date());
  const fetchImpl = options.fetchImpl ?? fetch;

  const cached = await readUpdateCheckCache();
  if (cached?.latest_version && cached.checked_at) {
    const checkedAt = new Date(cached.checked_at).getTime();
    if (
      Number.isFinite(checkedAt) &&
      now().getTime() - checkedAt < updateCheckIntervalMs
    ) {
      return cached.latest_version;
    }
  }

  const latest = await fetchLatestReleaseVersion(fetchImpl);
  await writeUpdateCheckCache({
    checked_at: now().toISOString(),
    latest_version: latest,
  }).catch(() => {
    /* ignore cache write failures */
  });
  return latest;
}

/** Start a background latest-version check (no-op if notices are disabled). */
export function startBackgroundUpdateCheck(
  options: UpdateCheckOptions = {},
): void {
  if (!shouldNotifyUpdates(options)) {
    return;
  }
  if (checkPromise) {
    return;
  }
  checkPromise = resolveLatestVersion(options)
    .then((latest) => latest)
    .catch(() => null);
}

/** Await the background check (briefly) and print a notice if outdated. */
export async function finishBackgroundUpdateCheck(
  options: UpdateCheckOptions = {},
  write: (s: string) => void = (s) => process.stderr.write(s),
): Promise<void> {
  if (!checkPromise) {
    return;
  }

  const latest = await Promise.race([
    checkPromise,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), updateCheckHTTPTimeoutMs),
    ),
  ]);
  checkPromise = null;

  if (!latest || !isNewerVersion(latest, Version)) {
    return;
  }

  write(
    `\nA new version of vanta is available: ${displayVersion(latest)} (you have ${displayVersion(Version)})\nUpdate with:\n  curl -fsSL ${installScriptURL} | bash\n\n`,
  );
}

/** Test helper to clear in-flight check state. */
export function resetUpdateCheckStateForTests(): void {
  checkPromise = null;
}
