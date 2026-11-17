import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import {
  createInstrumentedFetch,
  newAPIClient,
  type GlobalFlags,
} from "./api-client.js";
import { refreshAfterUnauthorized, useSystemCredentialStore } from "./auth.js";
import { listPeople } from "./generated/sdk.gen.js";
import { authorizationHeader, isolateCredentials } from "./test-helpers.js";
import {
  jsonResponse,
  stubFetch,
  useTempHome,
  type RecordedRequest,
} from "./test-support.js";

const apiBase = "https://api.vanta.com/v1";
const flags: GlobalFlags = { dryRun: false, verbose: false, pretty: true };
const future = () => new Date(Date.now() + 10 * 60_000).toISOString();
const past = () => new Date(Date.now() - 1000).toISOString();

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

  it("dry run sends nothing and does not refresh or rotate a browser sign-in", async () => {
    await home.writeConfig(userLogin({ cached_token_expires: past() }));
    mock.method(process.stdout, "write", () => true);
    try {
      const api = await newAPIClient({ ...flags, apiBase, dryRun: true });
      await listPeople({ client: api.client }).catch((err: unknown) =>
        api.handleError(err),
      );
    } finally {
      mock.restoreAll();
    }
    assert.equal(net.requests.length, 0);
    const cfg = await home.readConfig();
    assert.equal(cfg.oauth_refresh_token, "rt-old");
    assert.equal(cfg.cached_access_token, "at-old");
  });
});

const clientFlags = (overrides: Partial<GlobalFlags> = {}): GlobalFlags => ({
  dryRun: false,
  verbose: false,
  pretty: false,
  ...overrides,
});

describe(
  "API client",
  {
    skip: useSystemCredentialStore()
      ? "uses the OS credential store on this platform"
      : false,
  },
  () => {
    let env: Awaited<ReturnType<typeof isolateCredentials>>;
    beforeEach(async () => {
      env = await isolateCredentials();
      await env.writeConfig({
        oauth_client_id: "client-a",
        oauth_client_secret: "secret-a",
        oauth_scope: "vanta-api.all:read",
      });
      mock.method(process.stdout, "write", () => true);
    });
    afterEach(async () => {
      mock.restoreAll();
      await env.restore();
    });

    it("sends the bearer token only to the validated base and refuses redirects", async () => {
      const api = await newAPIClient(
        clientFlags({ apiBase: "https://api.eu.vanta.com/v1" }),
      );
      await listPeople({ client: api.client });

      const apiRequests = env.requests.filter(
        (r) => !r.url.endsWith("/oauth/token"),
      );
      assert.equal(apiRequests.length, 1);
      const [request] = apiRequests;
      assert.ok(request);
      assert.equal(request.url, "https://api.eu.vanta.com/v1/people");
      assert.equal(authorizationHeader(request), "Bearer minted-token");
      assert.equal(request.init?.redirect, "error");
    });

    it("dry run sends no requests and does not refresh the cached token", async () => {
      const api = await newAPIClient(clientFlags({ dryRun: true }));
      await listPeople({ client: api.client }).catch((err: unknown) =>
        api.handleError(err),
      );

      assert.equal(env.requests.length, 0);
      assert.equal((await env.readConfig()).cached_access_token, undefined);
    });
  },
);
