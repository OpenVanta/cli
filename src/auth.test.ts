import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  credentialStorageDescription,
  decodeKeyringPassword,
  encodeKeyringPassword,
  useSystemCredentialStore,
  isTrustedVantaAPIBase,
  loadCachedAccessToken,
  normalizeAPIBase,
  requestOAuthToken,
  resolveOAuthCredentials,
  resolveAccessToken,
  classifyOAuthCredentialSource,
  isOAuthTokenCacheEligible,
  assertStoredOAuthCredentialBinding,
} from "./auth.js";

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
      assert.equal(credentialStorageDescription(), "Windows Credential Manager");
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

describe("OAuth token destination guard", () => {
  it("accepts exact Vanta regional hosts and normalizes their API base", () => {
    for (const base of [
      "https://api.vanta.com/v1/",
      "https://api.eu.vanta.com/v1",
      "https://api.aus.vanta.com/v1",
      "https://api.vanta-gov.com/v1",
    ]) {
      assert.equal(isTrustedVantaAPIBase(base), true);
    }
    assert.equal(
      normalizeAPIBase(" HTTPS://API.VANTA.COM:443/v1/ "),
      "https://api.vanta.com/v1",
    );
  });

  it("rejects untrusted and malformed destinations before making a request", async () => {
    const originalFetch = globalThis.fetch;
    let requests = 0;
    globalThis.fetch = (async () => {
      requests += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      for (const base of [
        "http://api.vanta.com/v1",
        "https://api.vanta.com.attacker.test/v1",
        "https://api.vanta.com@attacker.test/v1",
        "https://user@api.vanta.com/v1",
        "https://attacker.test/v1",
        "https://127.0.0.1/v1",
        "https://api.vanta.com:444/v1",
        "https://api.vanta.com/v1?next=attacker.test",
        "https://api.vanta.com/v1#fragment",
        "https://api.vanta.com/other",
        "not a url",
      ]) {
        await assert.rejects(
          requestOAuthToken(base, "id", "secret", "scope"),
          /API base|HTTPS URL/,
          base,
        );
      }
      assert.equal(requests, 0, "rejected bases must not issue token requests");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("permits custom HTTPS hosts only when explicitly trusted or approved at login", async () => {
    const originalFetch = globalThis.fetch;
    let requestOptions: RequestInit | undefined;
    globalThis.fetch = (async (_input, init) => {
      requestOptions = init;
      return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await assert.rejects(
        requestOAuthToken("https://tenant.example/v1", "id", "secret", "scope"),
        /not an approved Vanta host/,
      );
      await requestOAuthToken(
        "https://tenant.example/v1",
        "id",
        "secret",
        "scope",
        { allowCustomAPIBase: true },
      );
      assert.equal(requestOptions?.redirect, "error");
      assert.equal(
        await requestOAuthToken(
          "https://tenant.example/v1",
          "id",
          "secret",
          "scope",
          { trustedAPIBase: "https://tenant.example/v1/" },
        ).then((result) => result.accessToken),
        "token",
      );
      await assert.rejects(
        requestOAuthToken(
          "https://other.example/v1",
          "id",
          "secret",
          "scope",
          { trustedAPIBase: "https://tenant.example/v1" },
        ),
        /does not match the host bound/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects invalid stored API-base bindings before requesting a token", async () => {
    const originalFetch = globalThis.fetch;
    let requests = 0;
    globalThis.fetch = (async () => {
      requests += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    try {
      await assert.rejects(
        requestOAuthToken(
          "https://api.vanta.com/v1",
          "id",
          "secret",
          "scope",
          { trustedAPIBase: "http://invalid.example/v1" },
        ),
        /invalid API-base binding/,
      );
      assert.equal(requests, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not expose malformed successful response bodies", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("invalid payload that contains secret", { status: 200 })) as typeof fetch;

    try {
      await assert.rejects(
        requestOAuthToken("https://api.vanta.com/v1", "id", "secret", "scope"),
        (error: unknown) => {
          assert.equal(error instanceof Error, true);
          assert.equal((error as Error).message, "oauth response was invalid JSON");
          assert.equal((error as Error).message.includes("secret"), false);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not expose token endpoint response bodies in errors", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("secret echoed by server", { status: 400 })) as typeof fetch;

    try {
      await assert.rejects(
        requestOAuthToken("https://api.vanta.com/v1", "id", "secret", "scope"),
        (error: unknown) => {
          assert.equal(error instanceof Error, true);
          assert.equal((error as Error).message, "oauth error (400)");
          assert.equal((error as Error).message.includes("secret echoed"), false);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("credential source binding", () => {
  it("does not reuse or persist cached tokens for explicit credentials", () => {
    assert.equal(isOAuthTokenCacheEligible("explicit"), false);
    assert.equal(isOAuthTokenCacheEligible("stored"), true);
    assert.equal(isOAuthTokenCacheEligible("none"), true);
  });

  it("keeps explicit credential pairs separate from stored credentials", () => {
    assert.equal(
      classifyOAuthCredentialSource("override-id", "override-secret", "saved-id", "saved-secret"),
      "explicit",
    );
    assert.equal(
      classifyOAuthCredentialSource("", "", "saved-id", "saved-secret"),
      "stored",
    );
    assert.throws(
      () => classifyOAuthCredentialSource("override-id", "", "saved-id", "saved-secret"),
      /mixed credential sources are not allowed/,
    );
    assert.throws(
      () => classifyOAuthCredentialSource("", "override-secret", "saved-id", "saved-secret"),
      /mixed credential sources are not allowed/,
    );
  });

  it("requires old stored logins without a binding to be re-established", () => {
    assert.throws(
      () => assertStoredOAuthCredentialBinding("stored", ""),
      /not bound to an API base/,
    );
    assert.doesNotThrow(() =>
      assertStoredOAuthCredentialBinding("stored", "https://api.vanta.com/v1"),
    );
    assert.doesNotThrow(() => assertStoredOAuthCredentialBinding("explicit", ""));
  });

  it("rejects incomplete explicit pairs even when no stored pair exists", async () => {
    await assert.rejects(
      resolveOAuthCredentials(
        { clientId: "explicit-id" },
        {
          loadSecureCredentialState: async () => null,
          loadConfig: async () => ({}),
          env: {},
        },
      ),
      /provide both OAuth credentials/i,
    );
  });

  it("never combines credentials or API-base bindings across stores", async () => {
    await assert.rejects(
      resolveOAuthCredentials(
        {},
        {
          loadSecureCredentialState: async () => ({
            oauth_client_id: "secure-id",
            oauth_api_base: "https://api.eu.vanta.com/v1",
          }),
          loadConfig: async () => ({
            oauth_client_secret: "config-secret",
            oauth_api_base: "https://tenant.example/v1",
          }),
          env: {},
        },
      ),
      /saved OAuth credentials are incomplete/i,
    );
  });

  it("uses the complete secure-store credential pair and its own binding", async () => {
    const credentials = await resolveOAuthCredentials(
      {},
      {
        loadSecureCredentialState: async () => ({
          oauth_client_id: "secure-id",
          oauth_client_secret: "secure-secret",
          oauth_api_base: "https://api.eu.vanta.com/v1",
        }),
        loadConfig: async () => ({
          oauth_client_id: "stale-config-id",
          oauth_client_secret: "stale-config-secret",
          oauth_api_base: "https://tenant.example/v1",
        }),
        env: {},
      },
    );

    assert.equal(credentials.clientID, "secure-id");
    assert.equal(credentials.clientSecret, "secure-secret");
    assert.equal(credentials.apiBase, "https://api.eu.vanta.com/v1");
  });

  it("does not borrow a config-file binding for secure-store credentials", async () => {
    const credentials = await resolveOAuthCredentials(
      {},
      {
        loadSecureCredentialState: async () => ({
          oauth_client_id: "secure-id",
          oauth_client_secret: "secure-secret",
        }),
        loadConfig: async () => ({
          oauth_client_id: "config-id",
          oauth_client_secret: "config-secret",
          oauth_api_base: "https://tenant.example/v1",
        }),
        env: {},
      },
    );

    assert.equal(credentials.clientID, "secure-id");
    assert.equal(credentials.clientSecret, "secure-secret");
    assert.equal(credentials.apiBase, "");
    assert.throws(
      () => assertStoredOAuthCredentialBinding(credentials.source, credentials.apiBase),
      /not bound to an API base/,
    );
  });

  it("uses a complete config-file login only when the secure store has no credentials", async () => {
    const credentials = await resolveOAuthCredentials(
      {},
      {
        loadSecureCredentialState: async () => ({ oauth_scope: "secure-scope" }),
        loadConfig: async () => ({
          oauth_client_id: "config-id",
          oauth_client_secret: "config-secret",
          oauth_api_base: "https://api.vanta.com/v1",
        }),
        env: {},
      },
    );

    assert.equal(credentials.clientID, "config-id");
    assert.equal(credentials.clientSecret, "config-secret");
    assert.equal(credentials.apiBase, "https://api.vanta.com/v1");
    assert.equal(credentials.scope, "secure-scope");
  });

  it("rejects a partial environment credential pair instead of falling back", async () => {
    await assert.rejects(
      resolveOAuthCredentials(
        {},
        {
          loadSecureCredentialState: async () => ({
            oauth_client_id: "saved-id",
            oauth_client_secret: "saved-secret",
            oauth_api_base: "https://api.vanta.com/v1",
          }),
          loadConfig: async () => ({}),
          env: { VANTA_CLIENT_ID: "environment-id" },
        },
      ),
      /provide both OAuth credentials/i,
    );
  });

  it("does not combine a command-line credential with an environment credential", async () => {
    await assert.rejects(
      resolveOAuthCredentials(
        { clientId: "flag-id" },
        {
          loadSecureCredentialState: async () => null,
          loadConfig: async () => ({}),
          env: { VANTA_CLIENT_SECRET: "environment-secret" },
        },
      ),
      /same explicit source/i,
    );
  });

  it("uses a complete command-line pair as a pair ahead of environment credentials", async () => {
    const credentials = await resolveOAuthCredentials(
      { clientId: "flag-id", clientSecret: "flag-secret" },
      {
        loadSecureCredentialState: async () => null,
        loadConfig: async () => ({}),
        env: {
          VANTA_CLIENT_ID: "environment-id",
          VANTA_CLIENT_SECRET: "environment-secret",
        },
      },
    );

    assert.equal(credentials.clientID, "flag-id");
    assert.equal(credentials.clientSecret, "flag-secret");
    assert.equal(credentials.source, "explicit");
  });

  it("reuses a cached token only for the normalized API base it is bound to", async () => {
    let config = {
      cached_access_token: "cached-token",
      cached_token_expires: "2030-01-01T00:00:00.000Z",
      cached_token_api_base: "https://api.eu.vanta.com/v1/",
    };
    const providers = {
      loadSecureCredentialState: async () => null,
      loadConfig: async () => config,
      env: {},
    };
    const dependencies = {
      ...providers,
      loadCachedAccessToken: (base: string) =>
        loadCachedAccessToken(base, providers),
      cacheAccessToken: async () => {},
    };

    assert.equal(
      await resolveAccessToken(
        "https://API.EU.VANTA.COM:443/v1",
        {},
        { dependencies },
      ),
      "cached-token",
    );

    config = {
      ...config,
      cached_token_api_base: "https://api.vanta.com/v1",
    };
    await assert.rejects(
      resolveAccessToken(
        "https://api.eu.vanta.com/v1",
        {},
        { dependencies },
      ),
      /missing auth credentials/,
    );
  });

  it("rejects a changed API base before token fetch in the full resolver flow", async () => {
    const originalFetch = globalThis.fetch;
    let requests = 0;
    globalThis.fetch = (async () => {
      requests += 1;
      return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
        status: 200,
      });
    }) as typeof fetch;

    try {
      await assert.rejects(
        resolveAccessToken(
          "https://attacker.example/v1",
          {},
          {
            dependencies: {
              loadSecureCredentialState: async () => ({
                oauth_client_id: "saved-id",
                oauth_client_secret: "saved-secret",
                oauth_api_base: "https://api.eu.vanta.com/v1",
              }),
              loadConfig: async () => ({}),
              loadCachedAccessToken: async () => ({ token: "", expiresAt: null }),
              cacheAccessToken: async () => {},
              env: {},
            },
          },
        ),
        /does not match the host bound/i,
      );
      assert.equal(requests, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("dry-run authentication", () => {
  it("does not resolve credentials or validate token destinations", async () => {
    assert.equal(
      await resolveAccessToken("http://untrusted.example/v1", {}, { dryRun: true }),
      "<dry-run>",
    );
  });
});
