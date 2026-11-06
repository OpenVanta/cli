import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Command } from "commander";
import { registerLoginCommand, terminalDeps, type LoginDeps } from "./login.js";
import {
  FIRST_PARTY_CLI_CLIENT_ID,
  type CallbackResult,
} from "../user-login.js";
import {
  jsonResponse,
  stubFetch,
  useTempHome,
  type RecordedRequest,
} from "../test-support.js";

const redirectUri = "http://127.0.0.1:4242/callback";
const tokenBody = {
  access_token: "at-1",
  refresh_token: "rt-1",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "vanta-api.all:read",
};

function makeDeps(answers: string[], callback: CallbackResult) {
  const prompts: { label: string; defaultValue: string }[] = [];
  const opened: string[] = [];
  let listenerClosed = false;
  let expectedState = "";
  const deps: LoginDeps = {
    prompt: async (label, defaultValue, required) => {
      prompts.push({ label, defaultValue });
      const answer = answers.shift();
      if (answer === undefined) throw new Error(`unexpected prompt: ${label}`);
      const value = answer.trim() || defaultValue.trim();
      if (required && !value) throw new Error("value cannot be empty");
      return value;
    },
    openBrowser: (url) => opened.push(url),
    startListener: async (args) => {
      expectedState = args.expectedState;
      return {
        redirectUri,
        result: Promise.resolve(callback),
        close: () => (listenerClosed = true),
      };
    },
    readPasted: () => new Promise(() => {}),
    timeoutMs: 1000,
    close: () => {},
  };
  return {
    deps,
    prompts,
    opened,
    state: () => expectedState,
    listenerClosed: () => listenerClosed,
  };
}

async function runLogin(deps: LoginDeps, argv: string[] = []) {
  const program = new Command().exitOverride();
  registerLoginCommand(
    program,
    () => ({}),
    () => deps,
  );
  const logs: string[] = [];
  const log = console.log;
  console.log = (...a: unknown[]) => logs.push(a.join(" "));
  try {
    await program.parseAsync(["node", "vanta", "login", ...argv]);
  } finally {
    console.log = log;
  }
  return logs;
}

const isToken = (r: RecordedRequest) => r.url.endsWith("/oauth/token");
const isSuspend = (r: RecordedRequest) =>
  r.url.endsWith("/v1/oauth/token/suspend");

describe("vanta login", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  let respond: (req: RecordedRequest) => Response | Promise<Response>;
  const envKeys = ["VANTA_API_BASE", "VANTA_WEB_BASE"];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(async () => {
    for (const k of envKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    home = await useTempHome();
    respond = (req) =>
      isSuspend(req)
        ? new Response(null, { status: 200 })
        : jsonResponse(200, tokenBody);
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

  describe("without --browser (unchanged client credentials)", () => {
    it("asks the same prompts as before and uses client_credentials", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "cid", "sec", ""], {
        kind: "code",
        code: "unused",
      });
      await runLogin(t.deps);

      assert.deepEqual(
        t.prompts.map((p) => p.label),
        [
          "API base URL",
          "OAuth client ID",
          "OAuth client secret",
          "OAuth scope (default: vanta-api.all:read vanta-api.all:write)",
        ],
      );
      assert.equal(net.requests.length, 1);
      const req = net.requests[0]!;
      assert.equal(req.url, "https://api.vanta.com/oauth/token");
      assert.equal(req.headers.get("content-type"), "application/json");
      assert.deepEqual(JSON.parse(req.body), {
        client_id: "cid",
        client_secret: "sec",
        scope: "vanta-api.all:read vanta-api.all:write",
        grant_type: "client_credentials",
      });
      assert.equal(t.opened.length, 0);

      const cfg = await home.readConfig();
      assert.equal(cfg.auth_mode, "client");
      assert.equal(cfg.oauth_client_secret, "sec");
      assert.equal(cfg.cached_access_token, "at-1");
    });

    it("still requires a client ID and secret", async () => {
      const blankId = makeDeps(["https://api.vanta.com/v1", ""], {
        kind: "code",
        code: "c",
      });
      await assert.rejects(runLogin(blankId.deps), /value cannot be empty/);
      const blankSecret = makeDeps(["https://api.vanta.com/v1", "cid", ""], {
        kind: "code",
        code: "c",
      });
      await assert.rejects(runLogin(blankSecret.deps), /value cannot be empty/);
      assert.equal(net.requests.length, 0);
    });

    it("revokes a previous browser sign-in it replaces", async () => {
      await home.writeConfig({
        api_base: "http://127.0.0.1:10290/v1",
        auth_mode: "user",
        oauth_refresh_token: "rt-old",
        cached_access_token: "at-old",
      });
      const t = makeDeps(["https://api.vanta.com/v1", "cid", "sec", ""], {
        kind: "code",
        code: "c",
      });
      await runLogin(t.deps);
      const suspend = net.requests.find(isSuspend)!;
      assert.equal(
        suspend.url,
        "http://127.0.0.1:10290/v1/oauth/token/suspend",
        "revokes on the API that issued the old grant",
      );
      assert.equal(new URLSearchParams(suspend.body).get("token"), "rt-old");
      assert.equal((await home.readConfig()).auth_mode, "client");
    });
  });

  describe("--browser", () => {
    it("signs in through the browser without asking for client credentials", async () => {
      const t = makeDeps(["http://127.0.0.1:10290/v1", "", ""], {
        kind: "code",
        code: "the-code",
      });
      const logs = await runLogin(t.deps, ["--browser"]);

      assert.deepEqual(
        t.prompts.map((p) => p.label),
        [
          "API base URL",
          "Web app URL",
          "OAuth scope (default: vanta-api.all:read vanta-api.all:write)",
        ],
      );
      // A local API base derives the local web base.
      assert.equal(t.prompts[1]!.defaultValue, "http://127.0.0.1:8080");

      assert.equal(t.opened.length, 1);
      const authorize = new URL(t.opened[0]!);
      assert.equal(
        authorize.origin + authorize.pathname,
        "http://127.0.0.1:8080/oauth/authorize",
      );
      assert.equal(authorize.searchParams.get("redirect_uri"), redirectUri);
      assert.equal(authorize.searchParams.get("state"), t.state());
      assert.equal(
        authorize.searchParams.get("client_id"),
        FIRST_PARTY_CLI_CLIENT_ID,
      );
      assert.ok(
        logs.some((l) => l.includes(t.opened[0]!)),
        "URL is printed too",
      );

      const tokenReqs = net.requests.filter(isToken);
      assert.equal(tokenReqs.length, 1);
      const req = tokenReqs[0]!;
      assert.equal(req.url, "http://127.0.0.1:10290/oauth/token");
      assert.equal(
        req.headers.get("content-type"),
        "application/x-www-form-urlencoded",
      );
      const form = new URLSearchParams(req.body);
      assert.equal(form.get("grant_type"), "authorization_code");
      assert.equal(form.get("client_id"), FIRST_PARTY_CLI_CLIENT_ID);
      assert.equal(form.get("code"), "the-code");
      assert.equal(form.get("redirect_uri"), redirectUri);
      assert.equal(form.has("client_secret"), false);
      const challenge = createHash("sha256")
        .update(form.get("code_verifier")!)
        .digest("base64url");
      assert.equal(authorize.searchParams.get("code_challenge"), challenge);
      assert.equal(t.listenerClosed(), true);
      assert.equal(net.requests.filter(isSuspend).length, 0);

      const cfg = await home.readConfig();
      assert.equal(cfg.auth_mode, "user");
      assert.equal(cfg.oauth_refresh_token, "rt-1");
      assert.equal(cfg.cached_access_token, "at-1");
      assert.equal(cfg.oauth_client_id, FIRST_PARTY_CLI_CLIENT_ID);
      assert.equal(cfg.oauth_client_secret, "");
      assert.equal(cfg.web_base, "http://127.0.0.1:8080");
      assert.equal(cfg.api_base, "http://127.0.0.1:10290/v1");
    });

    it("defaults the web base to app.vanta.com, or VANTA_WEB_BASE", async () => {
      const prod = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "code",
        code: "c",
      });
      await runLogin(prod.deps, ["--browser"]);
      assert.equal(prod.prompts[1]!.defaultValue, "https://app.vanta.com");

      process.env.VANTA_WEB_BASE = "https://app.eu.vanta.com";
      const eu = makeDeps(["https://api.eu.vanta.com/v1", "", ""], {
        kind: "code",
        code: "c",
      });
      await runLogin(eu.deps, ["--browser"]);
      assert.equal(eu.prompts[1]!.defaultValue, "https://app.eu.vanta.com");
    });

    it("refuses to mix --browser with client credentials", async () => {
      const t = makeDeps([], { kind: "code", code: "c" });
      await assert.rejects(
        runLogin(t.deps, ["--browser", "--client-secret", "s"]),
        /either --browser or --client-id\/--client-secret/,
      );
      assert.equal(t.prompts.length, 0);
    });

    it("on server_error, points to client credentials and stores nothing", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "error",
        error: "server_error",
      });
      await assert.rejects(runLogin(t.deps, ["--browser"]), (err: Error) => {
        assert.match(err.message, /browser sign-in failed: server_error/);
        assert.match(err.message, /may not be enabled for your workspace/);
        assert.match(err.message, /client credentials: `vanta login`/);
        return true;
      });
      assert.equal(net.requests.length, 0);
      await assert.rejects(home.readConfig());
    });

    it("says when sign-in was declined", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "error",
        error: "access_denied",
      });
      await assert.rejects(
        runLogin(t.deps, ["--browser"]),
        /access_denied: sign-in was declined/,
      );
    });

    it("does not blame the workspace for a callback without a code", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "error",
        error: "missing_code",
      });
      await assert.rejects(runLogin(t.deps, ["--browser"]), (err: Error) => {
        assert.match(err.message, /without an authorization code/);
        assert.doesNotMatch(err.message, /enabled for your workspace/);
        return true;
      });
    });

    it("re-prints the URL when the wait times out", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "code",
        code: "c",
      });
      t.deps.startListener = async () => ({
        redirectUri,
        result: Promise.reject(new Error("timed out after 300s waiting")),
        close: () => {},
      });
      await assert.rejects(runLogin(t.deps, ["--browser"]), (err: Error) => {
        assert.match(err.message, /timed out/);
        assert.match(err.message, /vanta login --browser/);
        assert.match(
          err.message,
          /https:\/\/app\.vanta\.com\/oauth\/authorize\?/,
        );
        return true;
      });
    });

    it("with --no-open, prints the URL and accepts a pasted callback", async () => {
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "code",
        code: "never",
      });
      t.deps.startListener = async () => ({
        redirectUri,
        result: new Promise(() => {}),
        close: () => {},
      });
      t.deps.readPasted = async () => ({ kind: "code", code: "pasted" });
      await runLogin(t.deps, ["--browser", "--no-open"]);
      assert.equal(t.opened.length, 0);
      assert.equal(
        new URLSearchParams(net.requests.find(isToken)!.body).get("code"),
        "pasted",
      );
    });

    it("revokes the browser sign-in it replaces, and ignores a failed revoke", async () => {
      await home.writeConfig({
        api_base: "https://api.vanta.com/v1",
        auth_mode: "user",
        oauth_refresh_token: "rt-old",
        cached_access_token: "at-old",
      });
      respond = (req) =>
        isSuspend(req)
          ? new Response(null, { status: 500 })
          : jsonResponse(200, tokenBody);
      const t = makeDeps(["https://api.vanta.com/v1", "", ""], {
        kind: "code",
        code: "c",
      });
      await runLogin(t.deps, ["--browser"]);
      const suspend = net.requests.find(isSuspend)!;
      assert.equal(new URLSearchParams(suspend.body).get("token"), "rt-old");
      assert.equal((await home.readConfig()).oauth_refresh_token, "rt-1");
    });
  });
});

describe("terminal prompts", () => {
  function pipe(text: string, end = true) {
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    if (end) input.end(text);
    else input.write(text);
    return terminalDeps({ input, output });
  }

  it("answers every prompt from input piped in at once", async () => {
    const deps = pipe("https://api.example/v1\ncid\nsec\n\n");
    assert.equal(
      await deps.prompt("API", "https://x/v1", true),
      "https://api.example/v1",
    );
    assert.equal(await deps.prompt("ID", "", true), "cid");
    assert.equal(await deps.prompt("Secret", "", true), "sec");
    assert.equal(
      await deps.prompt("Scope", "default-scope", false),
      "default-scope",
    );
    deps.close();
  });

  it("at end of input, uses defaults and fails on a required prompt without one", async () => {
    const deps = pipe("");
    assert.equal(
      await deps.prompt("API", "https://x/v1", true),
      "https://x/v1",
    );
    await assert.rejects(
      deps.prompt("OAuth client ID", "", true),
      /no input for "OAuth client ID"/,
    );
  });

  it("reads a pasted callback, skipping a mismatched one", async () => {
    const error = console.error;
    const errors: string[] = [];
    console.error = (...a: unknown[]) => errors.push(a.join(" "));
    try {
      const deps = pipe(
        "http://127.0.0.1:1/callback?code=bad&state=other\nhttp://127.0.0.1:1/callback?code=good&state=s1\n",
        false,
      );
      assert.deepEqual(await deps.readPasted("s1"), {
        kind: "code",
        code: "good",
      });
      assert.match(errors.join("\n"), /does not match this sign-in request/);
      deps.close();
    } finally {
      console.error = error;
    }
  });
});
