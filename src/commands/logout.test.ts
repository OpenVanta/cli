import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Command } from "commander";
import { registerLogoutCommand } from "./logout.js";
import { FIRST_PARTY_CLI_CLIENT_ID } from "../user-login.js";
import { jsonResponse, stubFetch, useTempHome } from "../test-support.js";

const apiBase = "http://127.0.0.1:10290/v1";

async function runLogout() {
  const program = new Command().exitOverride();
  registerLogoutCommand(program, () => ({}));
  const out: string[] = [];
  const err: string[] = [];
  const [log, error] = [console.log, console.error];
  console.log = (...a: unknown[]) => out.push(a.join(" "));
  console.error = (...a: unknown[]) => err.push(a.join(" "));
  try {
    await program.parseAsync(["node", "vanta", "logout"]);
  } finally {
    console.log = log;
    console.error = error;
  }
  return { out: out.join("\n"), err: err.join("\n") };
}

const sensitive = [
  "oauth_client_id",
  "oauth_client_secret",
  "oauth_refresh_token",
  "cached_access_token",
  "cached_token_expires",
];

function assertCleared(cfg: Record<string, unknown>) {
  for (const k of sensitive) assert.ok(!cfg[k], `${k} should be cleared`);
  assert.equal(cfg.auth_mode, undefined);
  assert.equal(cfg.api_base, apiBase, "api base is kept");
}

describe("vanta logout", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  let respond: () => Response | Promise<Response>;
  const saved = process.env.VANTA_API_BASE;

  beforeEach(async () => {
    delete process.env.VANTA_API_BASE;
    home = await useTempHome();
    respond = () => new Response(null, { status: 200 });
    net = stubFetch(() => respond());
  });
  afterEach(async () => {
    net.restore();
    await home.restore();
    if (saved === undefined) delete process.env.VANTA_API_BASE;
    else process.env.VANTA_API_BASE = saved;
  });

  const userLogin = {
    api_base: apiBase,
    web_base: "http://127.0.0.1:8080",
    auth_mode: "user",
    oauth_client_id: FIRST_PARTY_CLI_CLIENT_ID,
    oauth_client_secret: "",
    oauth_refresh_token: "rt-1",
    cached_access_token: "at-1",
    cached_token_type: "Bearer",
    cached_token_expires: new Date(Date.now() + 60_000).toISOString(),
  };

  it("user mode: revokes the grant, then clears local credentials", async () => {
    await home.writeConfig(userLogin);
    const { out } = await runLogout();

    assert.equal(net.requests.length, 1);
    const req = net.requests[0]!;
    assert.equal(req.method, "POST");
    assert.equal(req.url, "http://127.0.0.1:10290/v1/oauth/token/suspend");
    assert.equal(
      req.headers.get("content-type"),
      "application/x-www-form-urlencoded",
    );
    const form = new URLSearchParams(req.body);
    assert.equal(form.get("client_id"), FIRST_PARTY_CLI_CLIENT_ID);
    assert.equal(form.get("token"), "at-1");

    assertCleared(await home.readConfig());
    assert.match(out, /signed out/i);
  });

  it("user mode with no access token revokes with the refresh token", async () => {
    await home.writeConfig({ ...userLogin, cached_access_token: "" });
    await runLogout();
    assert.equal(
      new URLSearchParams(net.requests[0]!.body).get("token"),
      "rt-1",
    );
  });

  it("still clears locally and warns when revoke fails on the network", async () => {
    await home.writeConfig(userLogin);
    respond = () => Promise.reject(new TypeError("fetch failed"));
    const { err } = await runLogout();
    assert.match(err, /could not revoke/i);
    assertCleared(await home.readConfig());
  });

  it("still clears locally and warns when the server rejects revoke", async () => {
    await home.writeConfig(userLogin);
    respond = () => jsonResponse(500, { error: "server_error" });
    const { err } = await runLogout();
    assert.match(err, /could not revoke.*500/i);
    assertCleared(await home.readConfig());
  });

  it("client mode: clears locally without calling the API", async () => {
    await home.writeConfig({
      api_base: apiBase,
      auth_mode: "client",
      oauth_client_id: "cid",
      oauth_client_secret: "sec",
      cached_access_token: "at",
      cached_token_expires: new Date(Date.now() + 60_000).toISOString(),
    });
    await runLogout();
    assert.equal(net.requests.length, 0);
    assertCleared(await home.readConfig());
  });

  it("client mode with no cached token still reports signing out", async () => {
    await home.writeConfig({
      api_base: apiBase,
      oauth_client_id: "cid",
      oauth_client_secret: "sec",
    });
    const { out } = await runLogout();
    assert.match(out, /^Signed out/);
    assertCleared(await home.readConfig());
  });

  it("succeeds when nothing is saved", async () => {
    const { out } = await runLogout();
    assert.equal(net.requests.length, 0);
    assert.match(out, /not signed in|signed out/i);
  });
});
