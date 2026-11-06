import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  getKeychainPassword,
  invalidateKeychainCache,
  setKeychainPassword,
  systemCredentialStoreAvailable,
  useSystemCredentialStore,
} from "./keychain.js";
import {
  FIRST_PARTY_CLI_CLIENT_ID,
  defaultWebBase,
  localWebBase,
} from "./user-login.js";
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
const webBaseEnvVar = "VANTA_WEB_BASE";

/**
 * "client": OAuth client credentials (id + secret). "user": a person signed in
 * through the browser; the grant is a refresh token for the first-party client.
 * Absent means "client" (logins saved before browser sign-in existed).
 */
export type AuthMode = "client" | "user";

export type CliConfig = {
  api_base?: string;
  web_base?: string;
  auth_mode?: AuthMode;
  oauth_refresh_token?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
};

type SecureCredentialState = {
  auth_mode?: AuthMode;
  oauth_refresh_token?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
};

export type AuthOverrides = {
  apiBase?: string;
  webBase?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
};

function clearSensitiveFields(cfg: CliConfig): void {
  delete cfg.auth_mode;
  delete cfg.oauth_refresh_token;
  cfg.oauth_client_id = "";
  cfg.oauth_client_secret = "";
  cfg.oauth_scope = "";
  cfg.cached_access_token = "";
  cfg.cached_token_type = "";
  cfg.cached_token_expires = "";
}

async function loadSecureCredentialState(
  options: { fresh?: boolean } = {},
): Promise<SecureCredentialState | null> {
  if (!(await systemCredentialStoreAvailable())) return null;

  try {
    if (options.fresh) invalidateKeychainCache();
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

/** Local dev stacks serve the web app on 8080 beside an API on 127.0.0.1. */
export function deriveWebBase(apiBase: string): string {
  try {
    if (new URL(apiBase).hostname === "127.0.0.1") return localWebBase;
  } catch {
    // Not a URL; the API call will report it.
  }
  return defaultWebBase;
}

/**
 * Flag, then env, then the web base saved with the same API base, then derived
 * from the API base.
 */
export async function resolveWebBase(
  overrides: AuthOverrides,
  apiBase: string,
): Promise<string> {
  const fromFlag = overrides.webBase?.trim();
  if (fromFlag) return fromFlag;

  const fromEnv = process.env[webBaseEnvVar]?.trim();
  if (fromEnv) return fromEnv;

  const cfg = await loadConfig();
  const saved = cfg.web_base?.trim();
  if (saved && cfg.api_base?.trim() === apiBase.trim()) return saved;

  return deriveWebBase(apiBase);
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
    secureState.auth_mode = "client";
    secureState.oauth_refresh_token = "";
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

  cfg.auth_mode = "client";
  cfg.oauth_refresh_token = "";
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
  const stored = await loadStoredCredentials();
  if (stored.authMode === "user") {
    // A secret from a flag or the environment always means client credentials.
    const explicitSecret =
      overrides.clientSecret?.trim() ||
      process.env[oauthClientSecretEnvVar]?.trim();
    return explicitSecret
      ? requestUncachedClientToken(apiBase, overrides, explicitSecret, options)
      : resolveUserAccessToken(apiBase, options);
  }

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

/** An error response from /oauth/token, keeping the RFC 6749 error code. */
export class OAuthTokenError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    body: string,
  ) {
    super(`oauth error (${status}): ${body.trim()}`);
    this.name = "OAuthTokenError";
  }
}

export type UserTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
};

async function postTokenForm(
  apiBase: string,
  params: Record<string, string>,
): Promise<UserTokens> {
  const resp = await fetch(oauthTokenURL(apiBase), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": userAgent(),
    },
    body: new URLSearchParams(params).toString(),
  });

  const respBody = await resp.text();
  if (!resp.ok) {
    let code = "";
    try {
      code = String((JSON.parse(respBody) as { error?: unknown }).error ?? "");
    } catch {
      // Non-JSON error body; keep the status.
    }
    throw new OAuthTokenError(resp.status, code, respBody);
  }

  const tokenResp = JSON.parse(respBody) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!tokenResp.access_token?.trim()) {
    throw new Error("oauth response missing access_token");
  }

  let ttlMs = (tokenResp.expires_in ?? 0) * 1000;
  if (ttlMs <= 0) ttlMs = 60 * 60 * 1000;

  return {
    accessToken: tokenResp.access_token.trim(),
    refreshToken: tokenResp.refresh_token?.trim() ?? "",
    expiresAt: new Date(Date.now() + ttlMs),
    scope: tokenResp.scope?.trim() ?? "",
  };
}

/** Redeems an authorization code. `redirectUri` must match the authorize request byte for byte. */
export async function exchangeAuthorizationCode(args: {
  apiBase: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<UserTokens> {
  const tokens = await postTokenForm(args.apiBase, {
    grant_type: "authorization_code",
    client_id: FIRST_PARTY_CLI_CLIENT_ID,
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });
  if (!tokens.refreshToken) {
    throw new Error("oauth response missing refresh_token");
  }
  return tokens;
}

/** Rotates a refresh token. The previous one stays valid briefly on the server. */
export async function requestRefreshedToken(args: {
  apiBase: string;
  refreshToken: string;
}): Promise<UserTokens> {
  const tokens = await postTokenForm(args.apiBase, {
    grant_type: "refresh_token",
    client_id: FIRST_PARTY_CLI_CLIENT_ID,
    refresh_token: args.refreshToken,
  });
  return { ...tokens, refreshToken: tokens.refreshToken || args.refreshToken };
}

export type StoredCredentials = {
  authMode: AuthMode;
  clientId: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: Date | null;
};

/** Reads the saved login, keychain first, then the config file. */
export async function loadStoredCredentials(
  options: { fresh?: boolean } = {},
): Promise<StoredCredentials> {
  const secure = await loadSecureCredentialState(options);
  const cfg = await loadConfig();
  const src: SecureCredentialState =
    secure && (secure.auth_mode || secure.oauth_client_id) ? secure : cfg;

  const expiresRaw = src.cached_token_expires?.trim() ?? "";
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  return {
    authMode: src.auth_mode === "user" ? "user" : "client",
    clientId: src.oauth_client_id?.trim() ?? "",
    refreshToken: src.oauth_refresh_token?.trim() ?? "",
    accessToken: src.cached_access_token?.trim() ?? "",
    expiresAt:
      expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
  };
}

/** Applies `update` to wherever credentials live: the OS store, else the config file. */
async function updateCredentialState(
  update: (state: SecureCredentialState) => void,
  cfgUpdate: (cfg: CliConfig) => void = () => {},
): Promise<void> {
  const cfg = await loadConfig();
  cfgUpdate(cfg);
  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    update(secureState);
    await saveSecureCredentialState(secureState);
    clearSensitiveFields(cfg);
  } else {
    update(cfg);
  }
  await saveConfig(cfg);
}

function writeUserTokens(state: SecureCredentialState, tokens: UserTokens) {
  state.oauth_refresh_token = tokens.refreshToken;
  state.cached_access_token = tokens.accessToken;
  state.cached_token_type = "Bearer";
  state.cached_token_expires = tokens.expiresAt.toISOString();
}

/** Saves a browser sign-in. Never stores a client secret. */
export async function saveUserCredentials(args: {
  apiBase: string;
  webBase: string;
  scope: string;
  tokens: UserTokens;
}): Promise<void> {
  await updateCredentialState(
    (state) => {
      state.auth_mode = "user";
      state.oauth_client_id = FIRST_PARTY_CLI_CLIENT_ID;
      state.oauth_client_secret = "";
      state.oauth_scope =
        args.tokens.scope || args.scope.trim() || defaultOAuthScope;
      writeUserTokens(state, args.tokens);
    },
    (cfg) => {
      cfg.api_base = args.apiBase.trim() || defaultAPIBase;
      cfg.web_base = args.webBase.trim();
    },
  );
}

/** Drops the refresh and access tokens but remembers this was a browser login. */
export async function clearStoredGrant(): Promise<void> {
  await updateCredentialState((state) => {
    state.oauth_refresh_token = "";
    state.cached_access_token = "";
    state.cached_token_type = "";
    state.cached_token_expires = "";
  });
}

/** Removes every saved credential. Keeps the API and web base. */
export async function clearStoredCredentials(): Promise<void> {
  await updateCredentialState((state) => {
    delete state.auth_mode;
    state.oauth_refresh_token = "";
    state.oauth_client_id = "";
    state.oauth_client_secret = "";
    state.oauth_scope = "";
    state.cached_access_token = "";
    state.cached_token_type = "";
    state.cached_token_expires = "";
  });
}

const tokenExpiryMarginMs = 30_000;

function stillValid(token: string, expiresAt: Date | null): boolean {
  return Boolean(
    token &&
    expiresAt &&
    Date.now() < expiresAt.getTime() - tokenExpiryMarginMs,
  );
}

const reloginMessage = "run `vanta login --browser` to sign in again";

async function resolveUserAccessToken(
  apiBase: string,
  options: { dryRun?: boolean; rejectedToken?: string },
): Promise<string> {
  // Re-read: another CLI process may have rotated the grant since we loaded it.
  const stored = await loadStoredCredentials({ fresh: true });
  if (
    stillValid(stored.accessToken, stored.expiresAt) &&
    stored.accessToken !== options.rejectedToken
  ) {
    return stored.accessToken;
  }
  // A dry run sends nothing, so it must not rotate the stored grant either.
  if (options.dryRun) return "<dry-run>";
  if (!stored.refreshToken) {
    throw new Error(`not signed in: ${reloginMessage}`);
  }

  let tokens: UserTokens;
  try {
    tokens = await requestRefreshedToken({
      apiBase,
      refreshToken: stored.refreshToken,
    });
  } catch (err) {
    if (err instanceof OAuthTokenError && err.code === "invalid_grant") {
      await clearStoredGrant();
      throw new Error(
        `your browser sign-in has expired or was revoked: ${reloginMessage}`,
      );
    }
    throw err;
  }

  // Persist before use: the old refresh token stops working after its grace period.
  await updateCredentialState((state) => writeUserTokens(state, tokens));
  return tokens.accessToken;
}

/**
 * Revokes a browser sign-in's grant (RFC 7009; a public client authenticates
 * by client id alone). Throws on network failure or a non-2xx response.
 */
export async function revokeUserToken(
  apiBase: string,
  token: string,
): Promise<void> {
  const url = new URL(apiBase.trim() || defaultAPIBase);
  url.pathname = "/v1/oauth/token/suspend";
  url.search = "";
  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body: new URLSearchParams({
      client_id: FIRST_PARTY_CLI_CLIENT_ID,
      token,
    }).toString(),
  });
  if (!resp.ok) {
    throw new Error(
      `revoke failed (${resp.status}): ${(await resp.text()).trim()}`,
    );
  }
}

/**
 * After the API rejected `rejectedToken` with a 401, returns a fresh access
 * token for a browser sign-in, or null when the request should not be retried
 * (client credentials, or a secret given by flag or environment).
 */
export async function refreshAfterUnauthorized(
  apiBase: string,
  rejectedToken: string,
  overrides: AuthOverrides = {},
): Promise<string | null> {
  const explicitSecret =
    overrides.clientSecret?.trim() ||
    process.env[oauthClientSecretEnvVar]?.trim();
  if (explicitSecret) return null;
  const stored = await loadStoredCredentials({ fresh: true });
  if (stored.authMode !== "user") return null;
  return resolveUserAccessToken(apiBase, { rejectedToken });
}

/**
 * Best effort: revokes the stored browser sign-in, if any, before a new login
 * replaces it, so the old grant does not linger on the server (it would count
 * toward the per-user grant limit until it idles out). Never throws.
 */
export async function revokePreviousBrowserLogin(
  apiBase: string,
): Promise<void> {
  try {
    const stored = await loadStoredCredentials({ fresh: true });
    const token = stored.refreshToken || stored.accessToken;
    if (stored.authMode !== "user" || !token) return;
    // The grant lives on the API it was issued by, which may not be the new one.
    const savedBase = (await loadConfig()).api_base?.trim();
    await revokeUserToken(savedBase || apiBase, token);
  } catch {
    // The grant idles out server-side; a failed cleanup must not block login.
  }
}

/**
 * Client credentials given by flag or environment while a browser sign-in is
 * saved. The token is for a different identity than the signed-in person, so
 * it is never read from or written to the sign-in's cache: a later command
 * without those credentials must not act as the client while looking like the
 * person, and the person's cached token must not stand in for the client.
 */
async function requestUncachedClientToken(
  apiBase: string,
  overrides: AuthOverrides,
  clientSecret: string,
  options: { dryRun?: boolean },
): Promise<string> {
  const clientID =
    overrides.clientId?.trim() || process.env[oauthClientIDEnvVar]?.trim();
  if (!clientID) {
    if (options.dryRun) return "<dry-run>";
    throw new Error(
      "missing client ID: set VANTA_CLIENT_ID or --client-id along with the client secret",
    );
  }
  if (options.dryRun) return "<dry-run>";
  const scope =
    overrides.scope?.trim() ||
    process.env[oauthScopeEnvVar]?.trim() ||
    defaultOAuthScope;
  const { accessToken } = await requestOAuthToken(
    apiBase,
    clientID,
    clientSecret,
    scope,
  );
  return accessToken;
}
