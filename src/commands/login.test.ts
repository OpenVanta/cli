import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Command } from "commander";
import { registerLoginCommand, type LoginDeps } from "./login.js";
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
    prompt: async (label, defaultValue) => {
      prompts.push({ label, defaultValue });
      const answer = answers.shift();
      if (answer === undefined) throw new Error(`unexpected prompt: ${label}`);
      return answer.trim() || defaultValue.trim();
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
    readPasted: () => ({ result: new Promise(() => {}), close: () => {} }),
    timeoutMs: 1000,
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
  registerLoginCommand(program, () => ({}), deps);
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

describe("vanta login", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  const envKeys = ["VANTA_API_BASE", "VANTA_WEB_BASE"];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(async () => {
    for (const k of envKeys) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    home = await useTempHome();
    net = stubFetch(() => jsonResponse(200, tokenBody));
  });
  afterEach(async () => {
    net.restore();
    await home.restore();
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it("with a secret, uses client credentials and stores client mode", async () => {
    const t = makeDeps(["https://api.vanta.com/v1", "cid", "sec", ""], {
      kind: "code",
      code: "unused",
    });
    await runLogin(t.deps);

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

  it("with a blank secret, signs in through the browser", async () => {
    const t = makeDeps(["http://127.0.0.1:10290/v1", "some-id", "", "", ""], {
      kind: "code",
      code: "the-code",
    });
    const logs = await runLogin(t.deps);

    // Prompt text tells people how to choose browser sign-in.
    assert.match(
      t.prompts[2]!.label,
      /leave blank to sign in with your browser/,
    );
    // Local API base derives the local web base.
    assert.equal(t.prompts[3]!.defaultValue, "http://127.0.0.1:8080");
    assert.equal(
      t.prompts[4]!.defaultValue,
      "vanta-api.all:read vanta-api.all:write",
    );

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

    assert.equal(net.requests.length, 1);
    const req: RecordedRequest = net.requests[0]!;
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
    const verifier = form.get("code_verifier")!;
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    assert.equal(authorize.searchParams.get("code_challenge"), challenge);
    assert.equal(t.listenerClosed(), true);

    const cfg = await home.readConfig();
    assert.equal(cfg.auth_mode, "user");
    assert.equal(cfg.oauth_refresh_token, "rt-1");
    assert.equal(cfg.cached_access_token, "at-1");
    assert.equal(cfg.oauth_client_id, FIRST_PARTY_CLI_CLIENT_ID);
    assert.equal(cfg.oauth_client_secret, "");
    assert.equal(cfg.web_base, "http://127.0.0.1:8080");
    assert.equal(cfg.api_base, "http://127.0.0.1:10290/v1");
  });

  it("with a blank client ID, skips the secret prompt", async () => {
    const t = makeDeps(["https://api.vanta.com/v1", "", "", ""], {
      kind: "code",
      code: "c",
    });
    await runLogin(t.deps);
    assert.equal(t.prompts.length, 4);
    assert.equal(t.prompts[2]!.label, "Web app URL");
    assert.equal(t.prompts[2]!.defaultValue, "https://app.vanta.com");
    assert.equal((await home.readConfig()).auth_mode, "user");
  });

  it("fails with the consent error and stores nothing", async () => {
    const t = makeDeps(["https://api.vanta.com/v1", "", "", ""], {
      kind: "error",
      error: "server_error",
    });
    await assert.rejects(
      runLogin(t.deps),
      /browser sign-in failed: server_error/,
    );
    assert.equal(net.requests.length, 0);
    await assert.rejects(home.readConfig());
  });

  it("re-prints the URL when the wait times out", async () => {
    const t = makeDeps(["https://api.vanta.com/v1", "", "", ""], {
      kind: "code",
      code: "c",
    });
    t.deps.startListener = async () => ({
      redirectUri,
      result: Promise.reject(new Error("timed out after 300s waiting")),
      close: () => {},
    });
    await assert.rejects(runLogin(t.deps), (err: Error) => {
      assert.match(err.message, /timed out/);
      assert.match(
        err.message,
        /https:\/\/app\.vanta\.com\/oauth\/authorize\?/,
      );
      return true;
    });
  });

  it("accepts a pasted callback instead of the loopback", async () => {
    const t = makeDeps(["https://api.vanta.com/v1", "", "", ""], {
      kind: "code",
      code: "never",
    });
    t.deps.startListener = async () => ({
      redirectUri,
      result: new Promise(() => {}),
      close: () => {},
    });
    t.deps.readPasted = () => ({
      result: Promise.resolve({ kind: "code", code: "pasted" }),
      close: () => {},
    });
    await runLogin(t.deps, ["--no-browser"]);
    assert.equal(t.opened.length, 0);
    assert.equal(
      new URLSearchParams(net.requests[0]!.body).get("code"),
      "pasted",
    );
  });

  it("uses --web-base / VANTA_WEB_BASE as the web prompt default", async () => {
    process.env.VANTA_WEB_BASE = "https://app.eu.vanta.com";
    const t = makeDeps(["https://api.eu.vanta.com/v1", "", "", ""], {
      kind: "code",
      code: "c",
    });
    await runLogin(t.deps);
    assert.equal(t.prompts[2]!.defaultValue, "https://app.eu.vanta.com");
  });
});
