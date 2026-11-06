import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createInstrumentedFetch, type GlobalFlags } from "./api-client.js";
import { refreshAfterUnauthorized } from "./auth.js";
import {
  jsonResponse,
  stubFetch,
  useTempHome,
  type RecordedRequest,
} from "./test-support.js";

const apiBase = "http://127.0.0.1:10290/v1";
const flags: GlobalFlags = { dryRun: false, verbose: false, pretty: true };
const future = () => new Date(Date.now() + 10 * 60_000).toISOString();

const userLogin = (over: Record<string, unknown> = {}) => ({
  api_base: apiBase,
  auth_mode: "user",
  oauth_refresh_token: "rt-old",
  cached_access_token: "at-old",
  cached_token_type: "Bearer",
  cached_token_expires: future(),
  ...over,
});

const isToken = (r: RecordedRequest) => r.url.endsWith("/oauth/token");
const isApi = (r: RecordedRequest) => r.url.includes("/v1/vendors");

function apiRequest(token: string, init: RequestInit = {}) {
  return new Request(`${apiBase}/vendors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "v" }),
    ...init,
  });
}

describe("API requests after a 401", () => {
  let home: Awaited<ReturnType<typeof useTempHome>>;
  let net: ReturnType<typeof stubFetch>;
  let respond: (req: RecordedRequest) => Response | Promise<Response>;
  const doFetch = () =>
    createInstrumentedFetch(flags, (rejected) =>
      refreshAfterUnauthorized(apiBase, rejected),
    );
  const savedSecret = process.env.VANTA_CLIENT_SECRET;

  beforeEach(async () => {
    delete process.env.VANTA_CLIENT_SECRET;
    home = await useTempHome();
    respond = (req) => {
      if (isToken(req)) {
        return jsonResponse(200, {
          access_token: "at-new",
          refresh_token: "rt-new",
          expires_in: 3600,
        });
      }
      return req.headers.get("authorization") === "Bearer at-new"
        ? jsonResponse(201, { id: "vendor-1" })
        : jsonResponse(401, { error: "unauthorized" });
    };
    net = stubFetch((req) => respond(req));
  });
  afterEach(async () => {
    net.restore();
    await home.restore();
    if (savedSecret === undefined) delete process.env.VANTA_CLIENT_SECRET;
    else process.env.VANTA_CLIENT_SECRET = savedSecret;
  });

  it("refreshes a browser sign-in once and resends the request", async () => {
    await home.writeConfig(userLogin());
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 201);

    const api = net.requests.filter(isApi);
    assert.equal(api.length, 2);
    assert.equal(api[1]!.headers.get("authorization"), "Bearer at-new");
    assert.equal(api[1]!.body, JSON.stringify({ name: "v" }), "body is resent");
    assert.equal(net.requests.filter(isToken).length, 1);
    assert.equal((await home.readConfig()).oauth_refresh_token, "rt-new");
  });

  it("retries only once", async () => {
    await home.writeConfig(userLogin());
    respond = (req) =>
      isToken(req)
        ? jsonResponse(200, { access_token: "at-new", expires_in: 3600 })
        : jsonResponse(401, { error: "unauthorized" });
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 401);
    assert.equal(net.requests.filter(isApi).length, 2);
  });

  it("uses a token another process already refreshed, without refreshing", async () => {
    await home.writeConfig(userLogin({ cached_access_token: "at-new" }));
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 201);
    assert.equal(net.requests.filter(isToken).length, 0);
  });

  it("says to sign in again when the grant is gone", async () => {
    await home.writeConfig(userLogin());
    respond = (req) =>
      isToken(req)
        ? jsonResponse(400, { error: "invalid_grant" })
        : jsonResponse(401, { error: "unauthorized" });
    await assert.rejects(
      doFetch()(apiRequest("at-old")),
      /expired or was revoked: run `vanta login --browser`/,
    );
    assert.equal((await home.readConfig()).oauth_refresh_token, "");
  });

  it("does not retry a 403", async () => {
    await home.writeConfig(userLogin());
    respond = () => jsonResponse(403, { error: "forbidden" });
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 403);
    assert.equal(net.requests.length, 1);
  });

  it("does not retry client credentials", async () => {
    await home.writeConfig({
      api_base: apiBase,
      auth_mode: "client",
      oauth_client_id: "cid",
      oauth_client_secret: "sec",
      cached_access_token: "at-old",
      cached_token_expires: future(),
    });
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 401);
    assert.equal(net.requests.length, 1);
  });

  it("does not retry when a secret is given in the environment", async () => {
    await home.writeConfig(userLogin());
    process.env.VANTA_CLIENT_SECRET = "sec";
    const res = await doFetch()(apiRequest("at-old"));
    assert.equal(res.status, 401);
    assert.equal(net.requests.length, 1);
  });

  it("does not retry a multipart upload", async () => {
    await home.writeConfig(userLogin());
    const form = new FormData();
    form.set("file", new Blob(["x"]), "f.txt");
    const req = new Request(`${apiBase}/vendors`, {
      method: "POST",
      headers: { Authorization: "Bearer at-old" },
      body: form,
    });
    const res = await doFetch()(req);
    assert.equal(res.status, 401);
    assert.equal(net.requests.filter(isApi).length, 1);
  });
});
