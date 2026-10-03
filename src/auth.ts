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

const trustedVantaAPIHosts = new Set([
  "api.vanta.com",
  "api.eu.vanta.com",
  "api.aus.vanta.com",
  "api.vanta-gov.com",
]);

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
  cached_token_api_base?: string;
  oauth_api_base?: string;
};

type SecureCredentialState = {
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_scope?: string;
  cached_access_token?: string;
  cached_token_type?: string;
  cached_token_expires?: string;
  cached_token_api_base?: string;
  oauth_api_base?: string;
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
  cfg.cached_token_api_base = "";
  cfg.oauth_api_base = "";
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

export function normalizeAPIBase(apiBase: string): string {
  let url: URL;
  try {
    url = new URL(apiBase.trim() || defaultAPIBase);
  } catch {
    throw new Error("API base must be an absolute HTTPS URL");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    url.search ||
    url.hash ||
    !["", "/", "/v1", "/v1/"].includes(url.pathname)
  ) {
    throw new Error("API base must be an HTTPS URL with no credentials, query, fragment, or unsupported path");
  }
  const normalizedPath = url.pathname === "/v1/" ? "/v1" : url.pathname === "/" ? "" : url.pathname;
  return `${url.origin}${normalizedPath}`;
}

export function isTrustedVantaAPIBase(apiBase: string): boolean {
  try {
    return trustedVantaAPIHosts.has(new URL(normalizeAPIBase(apiBase)).hostname);
  } catch {
    return false;
  }
}

function isSameAPIBase(left: string, right: string): boolean {
  try {
    return normalizeAPIBase(left) === normalizeAPIBase(right);
  } catch {
    return false;
  }
}

function assertTrustedTokenDestination(
  apiBase: string,
  trustedAPIBase?: string,
  allowCustomAPIBase = false,
): string {
  const normalized = normalizeAPIBase(apiBase);
  if (trustedAPIBase) {
    let normalizedTrustedBase: string;
    try {
      normalizedTrustedBase = normalizeAPIBase(trustedAPIBase);
    } catch {
      throw new Error(
        "Saved OAuth credentials have an invalid API-base binding. Run `vanta login` again.",
      );
    }
    if (normalizedTrustedBase !== normalized) {
      throw new Error(
        "API base does not match the host bound to the saved OAuth credentials. Run `vanta login` to trust a different host.",
      );
    }
  }
  if (isTrustedVantaAPIBase(normalized)) return normalized;
  if (allowCustomAPIBase || trustedAPIBase) return normalized;
  throw new Error(
    "API base is not an approved Vanta host. Custom hosts must be explicitly trusted during `vanta login`.",
  );
}

export async function saveOAuthCredentials(
  apiBase: string,
  clientID: string,
  clientSecret: string,
  scope: string,
): Promise<void> {
  const cfg = await loadConfig();
  cfg.api_base = normalizeAPIBase(apiBase);

  const trimmedID = clientID.trim();
  const trimmedSecret = clientSecret.trim();
  const trimmedScope = scope.trim() || defaultOAuthScope;

  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    secureState.oauth_client_id = trimmedID;
    secureState.oauth_client_secret = trimmedSecret;
    secureState.oauth_scope = trimmedScope;
    secureState.oauth_api_base = normalizeAPIBase(apiBase);
    secureState.cached_access_token = "";
    secureState.cached_token_type = "";
    secureState.cached_token_expires = "";
    secureState.cached_token_api_base = "";
    await saveSecureCredentialState(secureState);
    clearSensitiveFields(cfg);
    await saveConfig(cfg);
    return;
  }

  cfg.oauth_client_id = trimmedID;
  cfg.oauth_client_secret = trimmedSecret;
  cfg.oauth_scope = trimmedScope;
  cfg.oauth_api_base = normalizeAPIBase(apiBase);
  cfg.cached_access_token = "";
  cfg.cached_token_type = "";
  cfg.cached_token_expires = "";
  cfg.cached_token_api_base = "";
  await saveConfig(cfg);
}

export async function cacheAccessToken(
  apiBase: string,
  accessToken: string,
  tokenType: string,
  expiresAt: Date,
): Promise<void> {
  const cfg = await loadConfig();
  const normalizedAPIBase = normalizeAPIBase(apiBase);

  if (await systemCredentialStoreAvailable()) {
    const secureState = (await loadSecureCredentialState()) ?? {};
    secureState.cached_access_token = accessToken.trim();
    secureState.cached_token_type = tokenType.trim();
    secureState.cached_token_expires = expiresAt.toISOString();
    secureState.cached_token_api_base = normalizedAPIBase;
    await saveSecureCredentialState(secureState);
    cfg.cached_access_token = "";
    cfg.cached_token_type = "";
    cfg.cached_token_expires = "";
    cfg.cached_token_api_base = "";
    await saveConfig(cfg);
    return;
  }

  cfg.cached_access_token = accessToken.trim();
  cfg.cached_token_type = tokenType.trim();
  cfg.cached_token_expires = expiresAt.toISOString();
  cfg.cached_token_api_base = normalizedAPIBase;
  await saveConfig(cfg);
}

type OAuthCredentialSource = "explicit" | "stored" | "none";

export function classifyOAuthCredentialSource(
  explicitClientID: string,
  explicitClientSecret: string,
  storedClientID: string,
  storedClientSecret: string,
): OAuthCredentialSource {
  const hasExplicitID = Boolean(explicitClientID.trim());
  const hasExplicitSecret = Boolean(explicitClientSecret.trim());
  const hasStoredCredentials = Boolean(
    storedClientID.trim() || storedClientSecret.trim(),
  );

  if (hasExplicitID !== hasExplicitSecret && hasStoredCredentials) {
    throw new Error(
      "Provide both OAuth credentials explicitly or use the saved login; mixed credential sources are not allowed.",
    );
  }
  if (hasExplicitID && hasExplicitSecret) return "explicit";
  if (hasExplicitID || hasExplicitSecret) return "explicit";
  if (hasStoredCredentials) return "stored";
  return "none";
}

export function isOAuthTokenCacheEligible(
  source: OAuthCredentialSource,
): boolean {
  return source !== "explicit";
}

export function assertStoredOAuthCredentialBinding(
  source: OAuthCredentialSource,
  credentialAPIBase: string,
): void {
  if (source === "stored" && !credentialAPIBase.trim()) {
    throw new Error(
      "Saved OAuth credentials are not bound to an API base. Run `vanta login` again before refreshing the token.",
    );
  }
}

export async function resolveOAuthCredentials(
  overrides: AuthOverrides = {},
): Promise<{
  clientID: string;
  clientSecret: string;
  scope: string;
  apiBase: string;
  source: OAuthCredentialSource;
}> {
  const overrideClientID = overrides.clientId?.trim() ?? "";
  const overrideClientSecret = overrides.clientSecret?.trim() ?? "";
  const envClientID = process.env[oauthClientIDEnvVar]?.trim() ?? "";
  const envClientSecret = process.env[oauthClientSecretEnvVar]?.trim() ?? "";
  const explicitClientID = overrideClientID || envClientID;
  const explicitClientSecret = overrideClientSecret || envClientSecret;
  let scope = overrides.scope?.trim() ?? "";
  if (!scope) scope = process.env[oauthScopeEnvVar]?.trim() ?? "";

  const secureState = await loadSecureCredentialState();
  const cfg = await loadConfig();
  const storedClientID =
    secureState?.oauth_client_id?.trim() || cfg.oauth_client_id?.trim() || "";
  const storedClientSecret =
    secureState?.oauth_client_secret?.trim() ||
    cfg.oauth_client_secret?.trim() ||
    "";
  const source = classifyOAuthCredentialSource(
    explicitClientID,
    explicitClientSecret,
    storedClientID,
    storedClientSecret,
  );
  let credentialAPIBase = "";
  if (source === "stored") {
    credentialAPIBase =
      secureState?.oauth_api_base?.trim() || cfg.oauth_api_base?.trim() || "";
  }

  if (!scope) scope = secureState?.oauth_scope?.trim() ?? "";
  if (!scope) scope = cfg.oauth_scope?.trim() ?? "";
  if (!scope) scope = defaultOAuthScope;

  return {
    clientID: explicitClientID || storedClientID,
    clientSecret: explicitClientSecret || storedClientSecret,
    scope,
    apiBase: credentialAPIBase,
    source,
  };
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
  options: { trustedAPIBase?: string; allowCustomAPIBase?: boolean } = {},
): Promise<{ accessToken: string; expiresAt: Date }> {
  const tokenURL = oauthTokenURL(
    assertTrustedTokenDestination(
      apiBase,
      options.trustedAPIBase,
      options.allowCustomAPIBase,
    ),
  );
  const resp = await fetch(tokenURL, {
    method: "POST",
    redirect: "error",
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
    throw new Error(`oauth error (${resp.status})`);
  }

  let tokenResp: {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  try {
    tokenResp = JSON.parse(respBody) as typeof tokenResp;
  } catch {
    throw new Error("oauth response was invalid JSON");
  }
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

async function loadCachedAccessToken(apiBase: string): Promise<{
  token: string;
  expiresAt: Date | null;
}> {
  const normalizedAPIBase = normalizeAPIBase(apiBase);
  const secureState = await loadSecureCredentialState();
  if (secureState) {
    const token = secureState.cached_access_token?.trim() ?? "";
    const cachedAPIBase = secureState.cached_token_api_base?.trim() ?? "";
    if (token) {
      const expiresRaw = secureState.cached_token_expires?.trim() ?? "";
      if (expiresRaw) {
        const expiresAt = new Date(expiresRaw);
        if (
          cachedAPIBase &&
          isSameAPIBase(cachedAPIBase, normalizedAPIBase) &&
          !Number.isNaN(expiresAt.getTime())
        ) {
          return { token, expiresAt };
        }
      }
    }
  }

  const cfg = await loadConfig();
  const token = cfg.cached_access_token?.trim() ?? "";
  const cachedAPIBase = cfg.cached_token_api_base?.trim() ?? "";
  if (!token) return { token: "", expiresAt: null };
  if (
    !cachedAPIBase ||
    !isSameAPIBase(cachedAPIBase, normalizedAPIBase)
  ) {
    return { token: "", expiresAt: null };
  }

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
  if (options.dryRun) return "<dry-run>";

  const {
    clientID,
    clientSecret,
    scope,
    apiBase: credentialAPIBase,
    source: credentialSource,
  } = await resolveOAuthCredentials(overrides);
  const trustedBase = assertTrustedTokenDestination(apiBase, credentialAPIBase);
  const cacheEligible = isOAuthTokenCacheEligible(credentialSource);
  const cached = cacheEligible
    ? await loadCachedAccessToken(trustedBase)
    : { token: "", expiresAt: null };
  if (
    cached.token &&
    cached.expiresAt &&
    Date.now() < cached.expiresAt.getTime() - 30_000
  ) {
    return cached.token;
  }

  if (!clientID || !clientSecret) {
    throw new Error(
      "missing auth credentials: run `vanta login` or set VANTA_CLIENT_ID / VANTA_CLIENT_SECRET",
    );
  }
  assertStoredOAuthCredentialBinding(credentialSource, credentialAPIBase);

  const { accessToken, expiresAt } = await requestOAuthToken(
    trustedBase,
    clientID,
    clientSecret,
    scope,
    { trustedAPIBase: credentialAPIBase },
  );
  if (cacheEligible) {
    await cacheAccessToken(trustedBase, accessToken, "Bearer", expiresAt);
  }
  return accessToken;
}
