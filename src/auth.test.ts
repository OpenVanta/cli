import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  requestOAuthToken,
  resolveAccessToken,
  resolveAPIBase,
  useSystemCredentialStore,
} from "./auth.js";
import { inOneHour, isolateCredentials } from "./test-helpers.js";

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
