import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { describe, it } from "node:test";
import { DryRunError } from "../api-client.js";
import { createClient } from "../generated/client/index.js";
import { pollDocumentEvaluation } from "./document-evaluation.js";

function mockClient(responses: Response[]) {
  const requests: Request[] = [];
  const client = createClient({
    baseUrl: "https://example.invalid/v1",
    auth: "test-token",
    fetch: async (input) => {
      assert.ok(input instanceof Request);
      requests.push(input);
      const response = responses.shift();
      assert.ok(response, "unexpected extra evaluation request");
      return response;
    },
  });
  return { client, requests };
}

describe("pollDocumentEvaluation", () => {
  it("returns an immediate result from a bodyless POST with the document ID", async () => {
    const result = {
      status: "COMPLETED",
      summary: "Attach deployment evidence.",
    };
    const { client, requests } = mockClient([Response.json(result)]);
    let pending = false;
    assert.deepEqual(
      await pollDocumentEvaluation(client, "ci-cd-implemented", () => {
        pending = true;
      }),
      result,
    );
    assert.equal(pending, false);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "POST");
    assert.equal(
      requests[0].url,
      "https://example.invalid/v1/documents/ci-cd-implemented/evaluate",
    );
    assert.equal(requests[0].headers.get("Authorization"), "Bearer test-token");
    assert.equal(await requests[0].text(), "");
  });

  it("waits five seconds after each PENDING response and notifies once", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const result = { status: "COMPLETED", summary: "Evidence is complete." };
    const { client, requests } = mockClient([
      Response.json({ status: "PENDING" }),
      Response.json({ status: "PENDING" }),
      Response.json(result),
    ]);
    let notifications = 0;
    const evaluation = pollDocumentEvaluation(
      client,
      "ci-cd-implemented",
      () => {
        notifications++;
      },
    );
    await setImmediate();
    assert.equal(requests.length, 1);
    assert.equal(notifications, 1);
    for (const expectedCalls of [2, 3]) {
      t.mock.timers.tick(4_999);
      await setImmediate();
      assert.equal(requests.length, expectedCalls - 1);
      t.mock.timers.tick(1);
      await setImmediate();
      assert.equal(requests.length, expectedCalls);
    }
    assert.deepEqual(await evaluation, result);
    assert.equal(notifications, 1);
    assert.ok(requests.every((request) => request.method === "POST"));
    assert.ok(requests.every((request) => request.url === requests[0].url));
    t.mock.timers.tick(10_000);
    await setImmediate();
    assert.equal(requests.length, 3);
  });

  it("does not overlap requests while an evaluation call is in flight", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let respond!: (response: Response) => void;
    let calls = 0;
    const client = createClient({
      baseUrl: "https://example.invalid/v1",
      fetch: async () => {
        calls++;
        return new Promise<Response>((resolve) => {
          respond = resolve;
        });
      },
    });
    const evaluation = pollDocumentEvaluation(client, "ci-cd-implemented");
    await setImmediate();
    t.mock.timers.tick(20_000);
    await setImmediate();
    assert.equal(calls, 1);
    respond(Response.json({ status: "PENDING" }));
    await setImmediate();
    t.mock.timers.tick(4_999);
    await setImmediate();
    assert.equal(calls, 1);
    t.mock.timers.tick(1);
    await setImmediate();
    assert.equal(calls, 2);
    respond(Response.json({ status: "FAILED" }));
    assert.deepEqual(await evaluation, { status: "FAILED" });
  });

  it("stops on FAILED without retrying the evaluation", async () => {
    const { client, requests } = mockClient([
      Response.json({ status: "FAILED" }),
    ]);
    assert.deepEqual(await pollDocumentEvaluation(client, "doc"), {
      status: "FAILED",
    });
    assert.equal(requests.length, 1);
  });

  for (const status of [401, 403, 422, 429, 500]) {
    it(`propagates HTTP ${status} errors without retrying`, async () => {
      const error = { message: "Evaluation unavailable" };
      const { client, requests } = mockClient([
        Response.json(error, { status }),
      ]);
      await assert.rejects(pollDocumentEvaluation(client, "doc"), (err) => {
        assert.deepEqual(err, error);
        return true;
      });
      assert.equal(requests.length, 1);
    });
  }

  for (const error of [new TypeError("fetch failed"), new DryRunError()]) {
    it(`propagates ${error.message} immediately for existing error handling`, async () => {
      let calls = 0;
      const client = createClient({
        baseUrl: "https://example.invalid/v1",
        fetch: async () => {
          calls++;
          throw error;
        },
      });
      await assert.rejects(
        pollDocumentEvaluation(client, "doc"),
        (err) => err === error,
      );
      assert.equal(calls, 1);
    });
  }

  for (const body of [
    null,
    {},
    { status: "UNKNOWN" },
    { status: "COMPLETED" },
    { status: "COMPLETED", summary: null },
  ]) {
    it(`rejects an unexpected response ${JSON.stringify(body)}`, async () => {
      const { client, requests } = mockClient([Response.json(body)]);
      await assert.rejects(
        pollDocumentEvaluation(client, "doc"),
        /Unexpected document evaluation response/,
      );
      assert.equal(requests.length, 1);
    });
  }
});
