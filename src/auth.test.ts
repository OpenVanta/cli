import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  loadStoredCredentials,
  requestOAuthToken,
  resolveAccessToken,
  resolveAPIBase,
  useSystemCredentialStore,
} from "./auth.js";
import { systemCredentialStoreAvailable } from "./keychain.js";
import { inOneHour, isolateCredentials } from "./test-helpers.js";
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
  const apiBase = "https://api.vanta.com/v1";
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

  it("never uses the OS keychain during tests, even on macOS", async () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "darwin" });
    try {
      assert.equal(await systemCredentialStoreAvailable(), false);
    } finally {
      Object.defineProperty(process, "platform", platform);
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
    assert.equal(req.url, "https://api.vanta.com/oauth/token");
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

    await assert.rejects(
      resolveAccessToken(apiBase),
      /run `vanta login --browser`/,
    );
    const cfg = await home.readConfig();
    assert.equal(cfg.oauth_refresh_token, "");
    assert.equal(cfg.cached_access_token, "");
    assert.equal(cfg.auth_mode, "user");

    // And it does not keep trying.
    await assert.rejects(
      resolveAccessToken(apiBase),
      /run `vanta login --browser`/,
    );
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

  it("env client credentials never touch a browser sign-in's cached token", async () => {
    // The signed-in person's token is still valid.
    await home.writeConfig(userConfig({ cached_token_expires: future() }));
    process.env.VANTA_CLIENT_ID = "env-id";
    process.env.VANTA_CLIENT_SECRET = "env-secret";

    // The env credentials win over the person's cached token...
    assert.equal(await resolveAccessToken(apiBase), "at-new");
    assert.equal(JSON.parse(net.requests[0]!.body).client_id, "env-id");
    // ...and their token is not cached as the person's.
    const cfg = await home.readConfig();
    assert.equal(cfg.cached_access_token, "at-old");
    assert.equal(cfg.oauth_refresh_token, "rt-old");

    // Without the env vars, commands act as the person again.
    delete process.env.VANTA_CLIENT_ID;
    delete process.env.VANTA_CLIENT_SECRET;
    assert.equal(await resolveAccessToken(apiBase), "at-old");
    assert.equal(net.requests.length, 1);
  });

  it("an env secret without a client ID does not borrow the first-party ID", async () => {
    await home.writeConfig(userConfig());
    process.env.VANTA_CLIENT_SECRET = "env-secret";
    await assert.rejects(resolveAccessToken(apiBase), /missing client ID/);
    assert.equal(net.requests.length, 0);
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

const usesOSStore = useSystemCredentialStore()
  ? "uses the OS credential store on this platform"
  : false;

describe("API base resolution", { skip: usesOSStore }, () => {
  let env: Awaited<ReturnType<typeof isolateCredentials>>;
  beforeEach(async () => {
    env = await isolateCredentials();
  });
  afterEach(() => env.restore());

  it("accepts the default and approved regional bases from any source", async () => {
    assert.equal(await resolveAPIBase(), "https://api.vanta.com/v1");
    assert.equal(
      await resolveAPIBase({ apiBase: "https://api.eu.vanta.com/v1/" }),
      "https://api.eu.vanta.com/v1",
    );
    process.env.VANTA_API_BASE = "https://api.aus.vanta.com/v1";
    assert.equal(await resolveAPIBase(), "https://api.aus.vanta.com/v1");
    delete process.env.VANTA_API_BASE;
    await env.writeConfig({ api_base: "https://api.vanta-gov.com/v1" });
    assert.equal(await resolveAPIBase(), "https://api.vanta-gov.com/v1");
  });

  it("rejects an unapproved base from each source", async () => {
    await assert.rejects(
      resolveAPIBase({ apiBase: "https://attacker.example/v1" }),
      /--api-base: invalid API base/,
    );
    process.env.VANTA_API_BASE = "http://api.vanta.com/v1";
    await assert.rejects(resolveAPIBase(), /VANTA_API_BASE: invalid API base/);
    delete process.env.VANTA_API_BASE;
    await env.writeConfig({ api_base: "https://attacker.example/v1" });
    await assert.rejects(resolveAPIBase(), /config api_base: invalid API base/);
  });
});

describe("OAuth token request", { skip: usesOSStore }, () => {
  let env: Awaited<ReturnType<typeof isolateCredentials>>;
  beforeEach(async () => {
    env = await isolateCredentials();
  });
  afterEach(() => env.restore());

  it("never sends the client secret to an unapproved host", async () => {
    await assert.rejects(
      requestOAuthToken("https://attacker.example/v1", "id", "secret", "s"),
      /invalid API base/,
    );
    assert.equal(env.requests.length, 0);
  });

  it("posts to the approved origin's token endpoint without following redirects", async () => {
    await requestOAuthToken("https://api.eu.vanta.com/v1", "id", "secret", "s");
    assert.equal(env.requests.length, 1);
    assert.equal(env.requests[0]?.url, "https://api.eu.vanta.com/oauth/token");
    assert.equal(env.requests[0]?.init?.redirect, "error");
  });
});

describe("access token cache", { skip: usesOSStore }, () => {
  let env: Awaited<ReturnType<typeof isolateCredentials>>;
  beforeEach(async () => {
    env = await isolateCredentials();
  });
  afterEach(() => env.restore());

  const credentials = {
    oauth_client_id: "client-a",
    oauth_client_secret: "secret-a",
    oauth_scope: "vanta-api.all:read",
  };
  const cachedForCommercial = {
    ...credentials,
    cached_access_token: "cached-token",
    cached_token_type: "Bearer",
    cached_token_origin: "https://api.vanta.com",
    cached_token_client_id: "client-a",
    cached_token_scope: "vanta-api.all:read",
  };

  it("reuses a cached token for the origin, client and scope it was minted for", async () => {
    await env.writeConfig({
      ...cachedForCommercial,
      cached_token_expires: inOneHour(),
    });
    assert.equal(
      await resolveAccessToken("https://api.vanta.com/v1"),
      "cached-token",
    );
    assert.equal(env.requests.length, 0);
  });

  it("does not reuse a token minted for a different origin, client or scope", async () => {
    const cases: Array<[string, Parameters<typeof resolveAccessToken>]> = [
      ["origin", ["https://api.eu.vanta.com/v1"]],
      [
        "client",
        [
          "https://api.vanta.com/v1",
          { clientId: "client-b", clientSecret: "secret-b" },
        ],
      ],
      [
        "scope",
        [
          "https://api.vanta.com/v1",
          { scope: "vanta-api.all:read vanta-api.all:write" },
        ],
      ],
    ];
    for (const [name, args] of cases) {
      await env.writeConfig({
        ...cachedForCommercial,
        cached_token_expires: inOneHour(),
      });
      assert.equal(await resolveAccessToken(...args), "minted-token", name);
    }
    assert.equal(env.requests[0]?.url, "https://api.eu.vanta.com/oauth/token");
  });

  it("discards a cached token saved before tokens were bound to an origin", async () => {
    await env.writeConfig({
      ...credentials,
      cached_access_token: "legacy-token",
      cached_token_type: "Bearer",
      cached_token_expires: inOneHour(),
    });
    assert.equal(
      await resolveAccessToken("https://api.vanta.com/v1"),
      "minted-token",
    );
  });

  it("binds a newly minted token to the origin, client and scope", async () => {
    await env.writeConfig(credentials);
    await resolveAccessToken("https://api.aus.vanta.com/v1");
    const cfg = await env.readConfig();
    assert.equal(cfg.cached_access_token, "minted-token");
    assert.equal(cfg.cached_token_origin, "https://api.aus.vanta.com");
    assert.equal(cfg.cached_token_client_id, "client-a");
    assert.equal(cfg.cached_token_scope, "vanta-api.all:read");
  });
});
