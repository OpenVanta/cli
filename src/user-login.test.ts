import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import {
  FIRST_PARTY_CLI_CLIENT_ID,
  buildAuthorizeUrl,
  createPkcePair,
  createState,
  parseCallback,
  parsePastedCallback,
  startCallbackListener,
} from "./user-login.js";

const b64url = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

describe("FIRST_PARTY_CLI_CLIENT_ID", () => {
  it("has the vci_ + 48 hex shape", () => {
    assert.match(FIRST_PARTY_CLI_CLIENT_ID, /^vci_[0-9a-f]{48}$/);
  });
});

describe("createPkcePair", () => {
  it("returns a 43-char verifier and its S256 challenge", () => {
    const { verifier, challenge } = createPkcePair();
    assert.equal(verifier.length, 43);
    assert.match(verifier, /^[A-Za-z0-9_-]+$/);
    assert.equal(
      challenge,
      b64url(createHash("sha256").update(verifier).digest()),
    );
  });

  it("is random per call", () => {
    assert.notEqual(createPkcePair().verifier, createPkcePair().verifier);
    assert.notEqual(createState(), createState());
  });
});

describe("buildAuthorizeUrl", () => {
  it("targets {webBase}/oauth/authorize with all seven params", () => {
    const url = new URL(
      buildAuthorizeUrl({
        webBase: "https://app.vanta.com",
        redirectUri: "http://127.0.0.1:5555/callback",
        state: "st",
        scope: "vanta-api.all:read vanta-api.all:write",
        challenge: "ch",
      }),
    );
    assert.equal(url.origin, "https://app.vanta.com");
    assert.equal(url.pathname, "/oauth/authorize");
    const p = url.searchParams;
    assert.equal(p.get("response_type"), "code");
    assert.equal(p.get("client_id"), FIRST_PARTY_CLI_CLIENT_ID);
    assert.equal(p.get("redirect_uri"), "http://127.0.0.1:5555/callback");
    assert.equal(p.get("state"), "st");
    assert.equal(p.get("scope"), "vanta-api.all:read vanta-api.all:write");
    assert.equal(p.get("code_challenge"), "ch");
    assert.equal(p.get("code_challenge_method"), "S256");
    assert.equal([...p.keys()].length, 7);
  });

  const authorizePrefix = (webBase: string) =>
    buildAuthorizeUrl({
      webBase,
      redirectUri: "http://127.0.0.1:1/callback",
      state: "s",
      scope: "x",
      challenge: "c",
    }).split("?")[0];

  it("tolerates a trailing slash on the web base", () => {
    assert.equal(
      authorizePrefix("http://127.0.0.1:8080/"),
      "http://127.0.0.1:8080/oauth/authorize",
    );
  });

  it("keeps a path prefix on the web base (dev /c/<domain> routing)", () => {
    assert.equal(
      authorizePrefix("http://127.0.0.1:8080/c/showzeb-2.something/"),
      "http://127.0.0.1:8080/c/showzeb-2.something/oauth/authorize",
    );
    assert.equal(
      authorizePrefix("http://127.0.0.1:8080/c/acme"),
      "http://127.0.0.1:8080/c/acme/oauth/authorize",
    );
  });
});

describe("parseCallback", () => {
  const base = "http://127.0.0.1:1/callback";
  it("returns the code when state matches", () => {
    assert.deepEqual(
      parseCallback(new URL(`${base}?code=abc&state=s1`), "s1"),
      {
        kind: "code",
        code: "abc",
      },
    );
  });

  it("returns the consent error", () => {
    assert.deepEqual(
      parseCallback(new URL(`${base}?error=server_error&state=s1`), "s1"),
      { kind: "error", error: "server_error" },
    );
    assert.deepEqual(
      parseCallback(
        new URL(`${base}?error=access_denied&error_description=no&state=s1`),
        "s1",
      ),
      { kind: "error", error: "access_denied", description: "no" },
    );
  });

  it("flags a state mismatch, even with a code or error", () => {
    assert.deepEqual(
      parseCallback(new URL(`${base}?code=abc&state=bad`), "s1"),
      {
        kind: "state-mismatch",
      },
    );
    assert.deepEqual(parseCallback(new URL(`${base}?error=x`), "s1"), {
      kind: "state-mismatch",
    });
  });

  it("treats a matching state with no code as an error", () => {
    assert.deepEqual(parseCallback(new URL(`${base}?state=s1`), "s1"), {
      kind: "error",
      error: "missing_code",
    });
  });
});

describe("parsePastedCallback", () => {
  it("accepts a full callback URL and checks its state", () => {
    assert.deepEqual(
      parsePastedCallback(
        "http://127.0.0.1:9/callback?code=abc&state=s1",
        "s1",
      ),
      { kind: "code", code: "abc" },
    );
    assert.deepEqual(
      parsePastedCallback(
        "http://127.0.0.1:9/callback?code=abc&state=zz",
        "s1",
      ),
      { kind: "state-mismatch" },
    );
  });

  it("accepts code=… or a bare code", () => {
    assert.deepEqual(parsePastedCallback("  code=a%2Fb&x=1 ", "s1"), {
      kind: "code",
      code: "a/b",
    });
    assert.deepEqual(parsePastedCallback("abc123", "s1"), {
      kind: "code",
      code: "abc123",
    });
    assert.equal(parsePastedCallback("   ", "s1"), null);
  });
});

describe("startCallbackListener", () => {
  it("binds 127.0.0.1 and resolves with the code", async () => {
    const listener = await startCallbackListener({
      expectedState: "s1",
      timeoutMs: 5_000,
    });
    try {
      assert.match(
        listener.redirectUri,
        /^http:\/\/127\.0\.0\.1:\d+\/callback$/,
      );
      const res = await fetch(`${listener.redirectUri}?code=abc&state=s1`);
      assert.equal(res.status, 200);
      assert.match(await res.text(), /close this tab/i);
      assert.deepEqual(await listener.result, { kind: "code", code: "abc" });
    } finally {
      listener.close();
    }
  });

  it("refuses a wrong state and keeps listening for the right one", async () => {
    const listener = await startCallbackListener({
      expectedState: "s1",
      timeoutMs: 5_000,
    });
    try {
      const bad = await fetch(`${listener.redirectUri}?code=evil&state=nope`);
      assert.equal(bad.status, 400);
      const other = await fetch(new URL("/favicon.ico", listener.redirectUri));
      assert.equal(other.status, 404);
      const good = await fetch(`${listener.redirectUri}?code=abc&state=s1`);
      assert.equal(good.status, 200);
      assert.deepEqual(await listener.result, { kind: "code", code: "abc" });
    } finally {
      listener.close();
    }
  });

  it("resolves with the consent error instead of hanging", async () => {
    const listener = await startCallbackListener({
      expectedState: "s1",
      timeoutMs: 5_000,
    });
    try {
      const res = await fetch(
        `${listener.redirectUri}?error=server_error&state=s1`,
      );
      assert.equal(res.status, 200);
      assert.deepEqual(await listener.result, {
        kind: "error",
        error: "server_error",
      });
    } finally {
      listener.close();
    }
  });

  it("rejects after the timeout when no callback arrives", async () => {
    const listener = await startCallbackListener({
      expectedState: "s1",
      timeoutMs: 50,
    });
    try {
      await assert.rejects(listener.result, /timed out/);
    } finally {
      listener.close();
    }
  });

  it("stops accepting connections once settled", async () => {
    const listener = await startCallbackListener({
      expectedState: "s1",
      timeoutMs: 5_000,
    });
    await fetch(`${listener.redirectUri}?code=abc&state=s1`);
    await listener.result;
    listener.close();
    await assert.rejects(fetch(`${listener.redirectUri}?code=abc&state=s1`));
  });
});
