// The credential paths macOS and Windows users take: the login lives in the OS
// keychain, and the config file keeps only the API and web base.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  clearStoredCredentials,
  decodeKeyringPassword,
  loadStoredCredentials,
  resolveAccessToken,
  saveOAuthCredentials,
  saveUserCredentials,
  encodeKeyringPassword,
} from "./auth.js";
import { useFakeKeychainForTests } from "./keychain.js";
import { jsonResponse, stubFetch, useTempHome } from "./test-support.js";

const apiBase = "https://api.vanta.com/v1";
const hour = 60 * 60 * 1000;

describe("browser sign-in stored in the OS keychain", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  const keychain = { value: null as string | null };
  const entry = () =>
    JSON.parse(decodeKeyringPassword(keychain.value ?? "{}")) as Record<
      string,
      unknown
    >;
  /** Writes the entry the way another CLI process would. */
  const writeEntry = (state: Record<string, unknown>) => {
    keychain.value = encodeKeyringPassword(JSON.stringify(state));
  };

  const signIn = (expiresAt: Date, over: { at?: string; rt?: string } = {}) =>
    saveUserCredentials({
      apiBase,
      webBase: "https://app.vanta.com",
      scope: "vanta-api.all:read",
      tokens: {
        accessToken: over.at ?? "at-1",
        refreshToken: over.rt ?? "rt-1",
        expiresAt,
        scope: "vanta-api.all:read",
      },
    });

  beforeEach(async () => {
    home = await useTempHome();
    keychain.value = null;
    useFakeKeychainForTests(keychain);
    net = stubFetch(() =>
      jsonResponse(200, {
        access_token: "at-new",
        refresh_token: "rt-new",
        expires_in: 3600,
      }),
    );
  });
  afterEach(async () => {
    net.restore();
    useFakeKeychainForTests(null);
    await home.restore();
  });

  it("keeps tokens in the keychain and only bases in the config file", async () => {
    await signIn(new Date(Date.now() + hour));
    const e = entry();
    assert.equal(e.auth_mode, "user");
    assert.equal(e.oauth_refresh_token, "rt-1");
    assert.equal(e.cached_access_token, "at-1");
    assert.equal(e.oauth_client_secret, "");

    const cfg = await home.readConfig();
    assert.equal(cfg.api_base, apiBase);
    assert.equal(cfg.web_base, "https://app.vanta.com");
    assert.equal(cfg.oauth_refresh_token, undefined);
    assert.equal(cfg.auth_mode, undefined);
    assert.equal(cfg.cached_access_token, "");
  });

  it("refreshes into the keychain, not the config file", async () => {
    await signIn(new Date(Date.now() - 1000));
    assert.equal(await resolveAccessToken(apiBase), "at-new");
    assert.equal(entry().oauth_refresh_token, "rt-new");
    assert.equal((await home.readConfig()).oauth_refresh_token, undefined);
  });

  it("re-reads the keychain before refreshing, past the in-process cache", async () => {
    await signIn(new Date(Date.now() - 1000));
    // This process has read (and cached) the expired entry...
    assert.equal((await loadStoredCredentials()).accessToken, "at-1");
    // ...then another process refreshes and rotates the grant.
    writeEntry({
      ...entry(),
      oauth_refresh_token: "rt-other",
      cached_access_token: "at-other",
      cached_token_expires: new Date(Date.now() + hour).toISOString(),
    });
    assert.equal(await resolveAccessToken(apiBase), "at-other");
    assert.equal(net.requests.length, 0, "no refresh with a stale token");
  });

  it("a client-credentials login replaces the browser sign-in", async () => {
    await signIn(new Date(Date.now() + hour));
    await saveOAuthCredentials(apiBase, "cid", "sec", "vanta-api.all:read");
    const e = entry();
    assert.equal(e.auth_mode, "client");
    assert.equal(e.oauth_refresh_token, "");
    assert.equal(e.oauth_client_secret, "sec");
  });

  it("logout clears the keychain entry's credentials", async () => {
    await signIn(new Date(Date.now() + hour));
    await clearStoredCredentials();
    const e = entry();
    assert.equal(e.auth_mode, undefined);
    for (const k of [
      "oauth_refresh_token",
      "oauth_client_id",
      "cached_access_token",
    ]) {
      assert.equal(e[k], "", `${k} cleared`);
    }
  });

  it("fits tokens well beyond today's size in a macOS keychain entry", async () => {
    const long = (prefix: string) => prefix + "x".repeat(600);
    await signIn(new Date(Date.now() + hour), {
      at: long("at_"),
      rt: long("rt_"),
    });
    assert.equal(entry().oauth_refresh_token, long("rt_"));
  });

  it("fails clearly when an entry would not fit", async () => {
    await assert.rejects(
      signIn(new Date(Date.now() + hour), { at: "x".repeat(4000) }),
      /keychain entry is too large to store via security\(1\) \(\d+ of 4096 bytes\)/,
    );
  });
});
