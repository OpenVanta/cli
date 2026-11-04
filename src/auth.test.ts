import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  loadStoredCredentials,
  resolveAccessToken,
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  useSystemCredentialStore,
} from "./auth.js";
import {
  jsonResponse,
  stubFetch,
  useTempHome,
  type RecordedRequest,
} from "./test-support.js";
import { FIRST_PARTY_CLI_CLIENT_ID } from "./user-login.js";

describe("credential store selection", () => {
  it("uses the system store on darwin and win32", () => {
    if (process.platform === "darwin" || process.platform === "win32") {
      assert.equal(useSystemCredentialStore(), true);
    } else {
      assert.equal(useSystemCredentialStore(), false);
    }
  });

  it("describes the active store", () => {
    if (process.platform === "darwin") {
      assert.equal(credentialStorageDescription(), "macOS Keychain");
    } else if (process.platform === "win32") {
      assert.equal(
        credentialStorageDescription(),
        "Windows Credential Manager",
      );
    } else {
      assert.equal(credentialStorageDescription(), "config file");
    }
  });
});

describe("go-keyring encoding", () => {
  it("round-trips passwords with the go-keyring-base64 prefix", () => {
    const original = '{"oauth_client_id":"abc"}';
    const encoded = encodeKeyringPassword(original);
    assert.equal(encoded.startsWith("go-keyring-base64:"), true);
    assert.equal(decodeKeyringPassword(encoded), original);
  });

  it("decodes legacy go-keyring hex encoding", () => {
    const original = '{"a":1}';
    const encoded =
      "go-keyring-encoded:" + Buffer.from(original, "utf8").toString("hex");
    assert.equal(decodeKeyringPassword(encoded), original);
  });

  it("passes through legacy plaintext values", () => {
    assert.equal(decodeKeyringPassword('{"a":1}'), '{"a":1}');
  });
});

describe("resolveAccessToken", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  let respond: (req: RecordedRequest) => Response | Promise<Response>;
  const envKeys = [
    "VANTA_CLIENT_ID",
    "VANTA_CLIENT_SECRET",
    "VANTA_OAUTH_SCOPE",
  ];
  const savedEnv: Record<string, string | undefined> = {};
  const apiBase = "http://127.0.0.1:10290/v1";
  const past = () => new Date(Date.now() - 1000).toISOString();
  const future = () => new Date(Date.now() + 10 * 60_000).toISOString();

  const userConfig = (over: Record<string, unknown> = {}) => ({
    api_base: apiBase,
    auth_mode: "user",
    oauth_client_id: FIRST_PARTY_CLI_CLIENT_ID,
    oauth_client_secret: "",
    oauth_refresh_token: "rt-old",
    cached_access_token: "at-old",
    cached_token_type: "Bearer",
    cached_token_expires: past(),
    ...over,
  });

  beforeEach(async () => {
    for (const k of envKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    home = await useTempHome();
    respond = () =>
      jsonResponse(200, {
        access_token: "at-new",
        refresh_token: "rt-new",
        expires_in: 3600,
        token_type: "Bearer",
      });
    net = stubFetch((req) => respond(req));
  });
  afterEach(async () => {
    net.restore();
    await home.restore();
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it("returns a still-valid cached token without a request", async () => {
    await home.writeConfig(userConfig({ cached_token_expires: future() }));
    assert.equal(await resolveAccessToken(apiBase), "at-old");
    assert.equal(net.requests.length, 0);
  });

  it("refreshes an expired user token and persists the rotated pair first", async () => {
    await home.writeConfig(userConfig());
    const token = await resolveAccessToken(apiBase);
    const persistedBeforeReturn = await home.readConfig();

    assert.equal(token, "at-new");
    assert.equal(net.requests.length, 1);
    const req = net.requests[0]!;
    assert.equal(req.url, "http://127.0.0.1:10290/oauth/token");
    assert.equal(
      req.headers.get("content-type"),
      "application/x-www-form-urlencoded",
    );
    const form = new URLSearchParams(req.body);
    assert.equal(form.get("grant_type"), "refresh_token");
    assert.equal(form.get("client_id"), FIRST_PARTY_CLI_CLIENT_ID);
    assert.equal(form.get("refresh_token"), "rt-old");
    assert.equal(form.has("client_secret"), false);

    assert.equal(persistedBeforeReturn.oauth_refresh_token, "rt-new");
    assert.equal(persistedBeforeReturn.cached_access_token, "at-new");
    assert.equal(persistedBeforeReturn.auth_mode, "user");
    assert.ok(
      new Date(String(persistedBeforeReturn.cached_token_expires)) > new Date(),
    );
  });

  it("refreshes inside the 30 s early-expiry margin", async () => {
    await home.writeConfig(
      userConfig({
        cached_token_expires: new Date(Date.now() + 10_000).toISOString(),
      }),
    );
    assert.equal(await resolveAccessToken(apiBase), "at-new");
  });

  // On Linux the store is the config file, which is read fresh every time; the
  // keychain re-read (invalidateKeychainCache) only matters on macOS/Windows.
  it("uses a token another process already rotated in, without refreshing", async () => {
    await home.writeConfig(
      userConfig({
        oauth_refresh_token: "rt-other",
        cached_access_token: "at-other",
        cached_token_expires: future(),
      }),
    );
    respond = () => jsonResponse(500, {});
    assert.equal(await resolveAccessToken(apiBase), "at-other");
    assert.equal((await loadStoredCredentials()).refreshToken, "rt-other");
    assert.equal(net.requests.length, 0);
  });

  it("on invalid_grant, clears the grant and says to log in again", async () => {
    await home.writeConfig(userConfig());
    respond = () =>
      jsonResponse(400, {
        error: "invalid_grant",
        error_description: "revoked",
      });

    await assert.rejects(resolveAccessToken(apiBase), /run `vanta login`/);
    const cfg = await home.readConfig();
    assert.equal(cfg.oauth_refresh_token, "");
    assert.equal(cfg.cached_access_token, "");
    assert.equal(cfg.auth_mode, "user");

    // And it does not keep trying.
    await assert.rejects(resolveAccessToken(apiBase), /run `vanta login`/);
    assert.equal(net.requests.length, 1);
  });

  it("keeps the grant on a transient refresh failure", async () => {
    await home.writeConfig(userConfig());
    respond = () => jsonResponse(429, { error: "rate_limited" });
    await assert.rejects(resolveAccessToken(apiBase), /oauth error \(429\)/);
    assert.equal((await home.readConfig()).oauth_refresh_token, "rt-old");
  });

  it("keeps the old refresh token if the response omits a new one", async () => {
    await home.writeConfig(userConfig());
    respond = () =>
      jsonResponse(200, { access_token: "at-new", expires_in: 3600 });
    await resolveAccessToken(apiBase);
    assert.equal((await home.readConfig()).oauth_refresh_token, "rt-old");
  });

  it("client mode still uses client_credentials JSON", async () => {
    await home.writeConfig({
      api_base: apiBase,
      auth_mode: "client",
      oauth_client_id: "cid",
      oauth_client_secret: "sec",
      oauth_scope: "vanta-api.all:read",
    });
    assert.equal(await resolveAccessToken(apiBase), "at-new");
    const req = net.requests[0]!;
    assert.equal(req.headers.get("content-type"), "application/json");
    assert.deepEqual(JSON.parse(req.body), {
      client_id: "cid",
      client_secret: "sec",
      scope: "vanta-api.all:read",
      grant_type: "client_credentials",
    });
  });

  it("a login saved before auth_mode existed is client mode", async () => {
    await home.writeConfig({
      api_base: apiBase,
      oauth_client_id: "cid",
      oauth_client_secret: "sec",
    });
    await resolveAccessToken(apiBase);
    assert.equal(
      JSON.parse(net.requests[0]!.body).grant_type,
      "client_credentials",
    );
  });

  it("an explicit secret overrides a stored browser login", async () => {
    await home.writeConfig(userConfig());
    process.env.VANTA_CLIENT_ID = "env-id";
    process.env.VANTA_CLIENT_SECRET = "env-secret";
    await resolveAccessToken(apiBase);
    assert.equal(
      JSON.parse(net.requests[0]!.body).grant_type,
      "client_credentials",
    );
  });
});
