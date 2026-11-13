import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { type GlobalFlags, newAPIClient } from "./api-client.js";
import { useSystemCredentialStore } from "./auth.js";
import { listPeople } from "./generated/sdk.gen.js";
import { authorizationHeader, isolateCredentials } from "./test-helpers.js";

const flags = (overrides: Partial<GlobalFlags> = {}): GlobalFlags => ({
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
        flags({ apiBase: "https://api.eu.vanta.com/v1" }),
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
      const api = await newAPIClient(flags({ dryRun: true }));
      await listPeople({ client: api.client }).catch((err: unknown) =>
        api.handleError(err),
      );

      assert.equal(env.requests.length, 0);
      assert.equal((await env.readConfig()).cached_access_token, undefined);
    });

    it("dry run still rejects an unapproved base", async () => {
      await assert.rejects(
        newAPIClient(
          flags({ dryRun: true, apiBase: "https://attacker.example/v1" }),
        ),
        /invalid API base/,
      );
    });
  },
);
