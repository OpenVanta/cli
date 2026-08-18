import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  getKeychainPassword,
  setKeychainPassword,
  systemCredentialStoreAvailable,
  useSystemCredentialStore,
} from "./keychain.js";
import { userAgent } from "./version.js";

export {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  useSystemCredentialStore,
} from "./keychain.js";

export const defaultAPIBase = "https://api.vanta.com/v1";
export const defaultOAuthScope = "vanta-api.all:read vanta-api.all:write";

const oauthClientIDEnvVar = "VANTA_CLIENT_ID";
const oauthClientSecretEnvVar = "VANTA_CLIENT_SECRET";
const oauthScopeEnvVar = "VANTA_OAUTH_SCOPE";
const apiBaseEnvVar = "VANTA_API_BASE";

export type CliConfig = {
  api_base?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
};

type SecureCredentialState = {
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
};

export type AuthOverrides = {
  apiBase?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
};

function clearSensitiveFields(cfg: CliConfig): void {
  cfg.oauth_client_id = "";
  cfg.oauth_client_secret = "";
  cfg.oauth_scope = "";
  cfg.cached_access_token = "";
  cfg.cached_token_type = "";
  cfg.cached_token_expires = "";
}

async function loadSecureCredentialState(): Promise<SecureCredentialState | null> {
  if (!(await systemCredentialStoreAvailable())) return null;

  try {
    const raw = await getKeychainPassword();
    if (!raw?.trim()) return null;
    const decoded = decodeKeyringPassword(raw);
    return JSON.parse(decoded) as SecureCredentialState;
  } catch (err) {
    // Don't silently treat Keychain denial/cancel as "not logged in".
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("read macOS Keychain")) {
      throw err;
    }
    return null;
  }
}

async function saveSecureCredentialState(
  state: SecureCredentialState,
): Promise<void> {
  if (!(await systemCredentialStoreAvailable())) {
    throw new Error("system credential store is unavailable");
  }
  // Encode like zalando/go-keyring so Go and TS CLIs share the same entry.
  await setKeychainPassword(encodeKeyringPassword(JSON.stringify(state)));
}

export function configFilePath(): string {
  return join(homedir(), ".vanta", "config.json");
}

export async function loadConfig(): Promise<CliConfig> {
  try {
    const raw = await readFile(configFilePath(), "utf8");
    return JSON.parse(raw) as CliConfig;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw new Error(`read config file: ${(err as Error).message}`);
  }
}

export async function saveConfig(cfg: CliConfig): Promise<void> {
  const path = configFilePath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const raw = `${JSON.stringify(cfg, null, 2)}\n`;
  await writeFile(path, raw, { mode: 0o600 });
}

export async function resolveAPIBase(
  overrides: AuthOverrides = {},
): Promise<string> {
  const fromFlag = overrides.apiBase?.trim();
  if (fromFlag) return fromFlag;

  const fromEnv = process.env[apiBaseEnvVar]?.trim();
  if (fromEnv) return fromEnv;

  const cfg = await loadConfig();
  const fromCfg = cfg.api_base?.trim();
  if (fromCfg) return fromCfg;

  return defaultAPIBase;
}

export async function saveOAuthCredentials(
  apiBase: string,
  clientID: string,
  clientSecret: string,
  scope: string,
): Promise<void> {
  const cfg = await loadConfig();
  cfg.api_base = apiBase.trim() || defaultAPIBase;

  const trimmedID = clientID.trim();
  const trimmedSecret = clientSecret.trim();
  const trimmedScope = scope.trim() || defaultOAuthScope;

  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    secureState.oauth_client_id = trimmedID;
    secureState.oauth_client_secret = trimmedSecret;
    secureState.oauth_scope = trimmedScope;
    secureState.cached_access_token = "";
    secureState.cached_token_type = "";
    secureState.cached_token_expires = "";
    await saveSecureCredentialState(secureState);
    clearSensitiveFields(cfg);
    await saveConfig(cfg);
    return;
  }

  cfg.oauth_client_id = trimmedID;
  cfg.oauth_client_secret = trimmedSecret;
  cfg.oauth_scope = trimmedScope;
  cfg.cached_access_token = "";
  cfg.cached_token_type = "";
  cfg.cached_token_expires = "";
  await saveConfig(cfg);
}

export async function cacheAccessToken(
  accessToken: string,
  tokenType: string,
  expiresAt: Date,
): Promise<void> {
  const cfg = await loadConfig();

  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    secureState.cached_access_token = accessToken.trim();
    secureState.cached_token_type = tokenType.trim();
    secureState.cached_token_expires = expiresAt.toISOString();
    await saveSecureCredentialState(secureState);
    cfg.cached_access_token = "";
    cfg.cached_token_type = "";
    cfg.cached_token_expires = "";
    await saveConfig(cfg);
    return;
  }

  cfg.cached_access_token = accessToken.trim();
  cfg.cached_token_type = tokenType.trim();
  cfg.cached_token_expires = expiresAt.toISOString();
  await saveConfig(cfg);
}

export async function resolveOAuthCredentials(
  overrides: AuthOverrides = {},
): Promise<{ clientID: string; clientSecret: string; scope: string }> {
  let clientID = overrides.clientId?.trim() ?? "";
  let clientSecret = overrides.clientSecret?.trim() ?? "";
  let scope = overrides.scope?.trim() ?? "";

  if (!clientID) clientID = process.env[oauthClientIDEnvVar]?.trim() ?? "";
  if (!clientSecret) {
    clientSecret = process.env[oauthClientSecretEnvVar]?.trim() ?? "";
  }
  if (!scope) scope = process.env[oauthScopeEnvVar]?.trim() ?? "";

  const secureState = await loadSecureCredentialState();
  if (secureState) {
    if (!clientID) clientID = secureState.oauth_client_id?.trim() ?? "";
    if (!clientSecret) {
      clientSecret = secureState.oauth_client_secret?.trim() ?? "";
    }
    if (!scope) scope = secureState.oauth_scope?.trim() ?? "";
  }

  const cfg = await loadConfig();
  if (!clientID) clientID = cfg.oauth_client_id?.trim() ?? "";
  if (!clientSecret) clientSecret = cfg.oauth_client_secret?.trim() ?? "";
  if (!scope) scope = cfg.oauth_scope?.trim() ?? "";
  if (!scope) scope = defaultOAuthScope;

  return { clientID, clientSecret, scope };
}

function oauthTokenURL(apiBase: string): string {
  const base = apiBase.trim() || defaultAPIBase;
  const u = new URL(base);
  u.pathname = "/oauth/token";
  u.search = "";
  return u.toString();
}

export async function requestOAuthToken(
  apiBase: string,
  clientID: string,
  clientSecret: string,
  scope: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const tokenURL = oauthTokenURL(apiBase);
  const resp = await fetch(tokenURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": userAgent(),
    },
    body: JSON.stringify({
      client_id: clientID,
      client_secret: clientSecret,
      scope,
      grant_type: "client_credentials",
    }),
  });

  const respBody = await resp.text();
  if (!resp.ok) {
    throw new Error(`oauth error (${resp.status}): ${respBody.trim()}`);
  }

  const tokenResp = JSON.parse(respBody) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!tokenResp.access_token?.trim()) {
    throw new Error("oauth response missing access_token");
  }

  let ttlMs = (tokenResp.expires_in ?? 0) * 1000;
  if (ttlMs <= 0) ttlMs = 60 * 60 * 1000;

  return {
    accessToken: tokenResp.access_token.trim(),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}

async function loadCachedAccessToken(): Promise<{
  token: string;
  expiresAt: Date | null;
}> {
  const secureState = await loadSecureCredentialState();
  if (secureState) {
    const token = secureState.cached_access_token?.trim() ?? "";
    if (token) {
      const expiresRaw = secureState.cached_token_expires?.trim() ?? "";
      if (expiresRaw) {
        const expiresAt = new Date(expiresRaw);
        if (!Number.isNaN(expiresAt.getTime())) {
          return { token, expiresAt };
        }
      }
    }
  }

  const cfg = await loadConfig();
  const token = cfg.cached_access_token?.trim() ?? "";
  if (!token) return { token: "", expiresAt: null };

  const expiresRaw = cfg.cached_token_expires?.trim() ?? "";
  if (!expiresRaw) return { token: "", expiresAt: null };

  const expiresAt = new Date(expiresRaw);
  if (Number.isNaN(expiresAt.getTime())) {
    return { token: "", expiresAt: null };
  }
  return { token, expiresAt };
}

export async function resolveAccessToken(
  apiBase: string,
  overrides: AuthOverrides = {},
  options: { dryRun?: boolean } = {},
): Promise<string> {
  const cached = await loadCachedAccessToken();
  if (
    cached.token &&
    cached.expiresAt &&
    Date.now() < cached.expiresAt.getTime() - 30_000
  ) {
    return cached.token;
  }

  const { clientID, clientSecret, scope } =
    await resolveOAuthCredentials(overrides);
  if (!clientID || !clientSecret) {
    if (options.dryRun) {
      return "<dry-run>";
    }
    throw new Error(
      "missing auth credentials: run `vanta login` or set VANTA_CLIENT_ID / VANTA_CLIENT_SECRET",
    );
  }

  const { accessToken, expiresAt } = await requestOAuthToken(
    apiBase,
    clientID,
    clientSecret,
    scope,
  );
  await cacheAccessToken(accessToken, "Bearer", expiresAt);
  return accessToken;
}
