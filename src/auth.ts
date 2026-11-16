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
import { validateAPIBase } from "./api-base.js";
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
  cached_token_origin?: string;
  cached_token_client_id?: string;
  cached_token_scope?: string;
};

type SecureCredentialState = {
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
  cached_token_origin?: string;
  cached_token_client_id?: string;
  cached_token_scope?: string;
};

/** What a cached access token was minted for; it is only reused on an exact match. */
export type TokenBinding = {
  origin: string;
  clientID: string;
  scope: string;
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
  cfg.cached_token_origin = "";
  cfg.cached_token_client_id = "";
  cfg.cached_token_scope = "";
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

function validateAPIBaseFrom(source: string, raw: string): string {
  try {
    return validateAPIBase(raw);
  } catch (err) {
    throw new Error(`${source}: ${(err as Error).message}`);
  }
}

export async function resolveAPIBase(
  overrides: AuthOverrides = {},
): Promise<string> {
  const fromFlag = overrides.apiBase?.trim();
  if (fromFlag) return validateAPIBaseFrom("--api-base", fromFlag);

  const fromEnv = process.env[apiBaseEnvVar]?.trim();
  if (fromEnv) return validateAPIBaseFrom(apiBaseEnvVar, fromEnv);

  const cfg = await loadConfig();
  const fromCfg = cfg.api_base?.trim();
  if (fromCfg) return validateAPIBaseFrom("config api_base", fromCfg);

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
    secureState.cached_token_origin = "";
    secureState.cached_token_client_id = "";
    secureState.cached_token_scope = "";
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
  cfg.cached_token_origin = "";
  cfg.cached_token_client_id = "";
  cfg.cached_token_scope = "";
  await saveConfig(cfg);
}

export function tokenBinding(
  apiBase: string,
  clientID: string,
  scope: string,
): TokenBinding {
  return {
    origin: new URL(validateAPIBase(apiBase)).origin,
    clientID: clientID.trim(),
    scope: scope.trim(),
  };
}

function writeCachedToken(
  state: SecureCredentialState,
  accessToken: string,
  tokenType: string,
  expiresAt: Date,
  binding: TokenBinding,
): void {
  state.cached_access_token = accessToken.trim();
  state.cached_token_type = tokenType.trim();
  state.cached_token_expires = expiresAt.toISOString();
  state.cached_token_origin = binding.origin;
  state.cached_token_client_id = binding.clientID;
  state.cached_token_scope = binding.scope;
}

export async function cacheAccessToken(
  accessToken: string,
  tokenType: string,
  expiresAt: Date,
  binding: TokenBinding,
): Promise<void> {
  const cfg = await loadConfig();

  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    writeCachedToken(secureState, accessToken, tokenType, expiresAt, binding);
    await saveSecureCredentialState(secureState);
    cfg.cached_access_token = "";
    cfg.cached_token_type = "";
    cfg.cached_token_expires = "";
    cfg.cached_token_origin = "";
    cfg.cached_token_client_id = "";
    cfg.cached_token_scope = "";
    await saveConfig(cfg);
    return;
  }

  writeCachedToken(cfg, accessToken, tokenType, expiresAt, binding);
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
  return `${new URL(validateAPIBase(apiBase)).origin}/oauth/token`;
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
    // A redirect would resend the client secret to wherever it points.
    redirect: "error",
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

// Entries without a binding (written before tokens were bound) never match.
function readCachedToken(
  state: SecureCredentialState,
  binding: TokenBinding,
): { token: string; expiresAt: Date } | null {
  const token = state.cached_access_token?.trim() ?? "";
  if (!token) return null;
  if (
    state.cached_token_origin !== binding.origin ||
    state.cached_token_client_id !== binding.clientID ||
    state.cached_token_scope !== binding.scope
  ) {
    return null;
  }
  const expiresAt = new Date(state.cached_token_expires?.trim() ?? "");
  if (Number.isNaN(expiresAt.getTime())) return null;
  return { token, expiresAt };
}

async function loadCachedAccessToken(
  binding: TokenBinding,
): Promise<{ token: string; expiresAt: Date } | null> {
  const secureState = await loadSecureCredentialState();
  const fromSecure = secureState && readCachedToken(secureState, binding);
  if (fromSecure) return fromSecure;
  return readCachedToken(await loadConfig(), binding);
}

export async function resolveAccessToken(
  apiBase: string,
  overrides: AuthOverrides = {},
): Promise<string> {
  const { clientID, clientSecret, scope } =
    await resolveOAuthCredentials(overrides);
  const binding = tokenBinding(apiBase, clientID, scope);

  const cached = await loadCachedAccessToken(binding);
  if (cached && Date.now() < cached.expiresAt.getTime() - 30_000) {
    return cached.token;
  }

  if (!clientID || !clientSecret) {
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
  await cacheAccessToken(accessToken, "Bearer", expiresAt, binding);
  return accessToken;
}
