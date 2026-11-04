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
  for (const status of [202, 204]) {
    it(
      "accepts an empty POST " +
        status +
        " and immediately retrieves the summary",
      async (t) => {
        t.mock.timers.enable({ apis: ["setTimeout"] });
        const result = { summary: "Attach deployment evidence." };
        const { client, requests } = mockClient([
          // Empty 202 responses must work even with a JSON content type and no
          // Content-Length header: there is no JSON body to parse.
          new Response(null, {
            status,
            headers: { "Content-Type": "application/json" },
          }),
          Response.json(result),
        ]);
        let notifications = 0;
        assert.deepEqual(
          await pollDocumentEvaluation(client, "ci-cd-implemented", () => {
            notifications++;
          }),
          result,
        );
        assert.equal(notifications, 0);
        assert.deepEqual(
          requests.map((request) => [request.method, request.url]),
          [
            [
              "POST",
              "https://example.invalid/v1/documents/ci-cd-implemented/evaluate",
            ],
            [
              "GET",
              "https://example.invalid/v1/documents/ci-cd-implemented/evaluation",
            ],
          ],
        );
        for (const request of requests) {
          assert.equal(
            request.headers.get("Authorization"),
            "Bearer test-token",
          );
          assert.equal(await request.text(), "");
        }
        // Completion clears the deadline and cannot trigger another request.
        t.mock.timers.tick(300_000);
        await setImmediate();
        assert.equal(requests.length, 2);
        assert.ok(requests.every((request) => !request.signal.aborted));
      },
    );

    it(
      "polls GET every five seconds after POST " +
        status +
        ", retrying only 404s",
      async (t) => {
        t.mock.timers.enable({ apis: ["setTimeout"] });
        const result = { summary: "Evidence is complete." };
        const { client, requests } = mockClient([
          new Response(null, { status }),
          new Response("No saved result", { status: 404 }),
          Response.json({ message: "Still unavailable" }, { status: 404 }),
          Response.json(result),
        ]);
        let notifications = 0;
        const evaluation = pollDocumentEvaluation(client, "doc", () => {
          notifications++;
        });
        await setImmediate();
        assert.equal(requests.length, 2);
        assert.equal(notifications, 1);
        for (const expectedCalls of [3, 4]) {
          t.mock.timers.tick(4_999);
          await setImmediate();
          assert.equal(requests.length, expectedCalls - 1);
          t.mock.timers.tick(1);
          await setImmediate();
          assert.equal(requests.length, expectedCalls);
        }
        assert.deepEqual(await evaluation, result);
        assert.equal(notifications, 1);
        assert.deepEqual(
          requests.map((request) => request.method),
          ["POST", "GET", "GET", "GET"],
        );
        t.mock.timers.tick(300_000);
        await setImmediate();
        assert.equal(requests.length, 4);
        assert.ok(requests.every((request) => !request.signal.aborted));
      },
    );
  }

  it("does not overlap GETs and waits five seconds after a response arrives", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let respond!: (response: Response) => void;
    const methods: string[] = [];
    const client = createClient({
      baseUrl: "https://example.invalid/v1",
      fetch: async (input) => {
        assert.ok(input instanceof Request);
        methods.push(input.method);
        if (input.method === "POST") return new Response(null, { status: 202 });
        return new Promise<Response>((resolve) => {
          respond = resolve;
        });
      },
    });
    const evaluation = pollDocumentEvaluation(client, "doc");
    await setImmediate();
    t.mock.timers.tick(20_000);
    await setImmediate();
    assert.deepEqual(methods, ["POST", "GET"]);
    respond(Response.json({ message: "Unavailable" }, { status: 404 }));
    await setImmediate();
    t.mock.timers.tick(4_999);
    await setImmediate();
    assert.equal(methods.length, 2);
    t.mock.timers.tick(1);
    await setImmediate();
    assert.deepEqual(methods, ["POST", "GET", "GET"]);
    respond(Response.json({ summary: "Findings" }));
    assert.deepEqual(await evaluation, { summary: "Findings" });
  });

  it("stops persistent 404s at five minutes without enqueueing again", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const { client, requests } = mockClient([
      new Response(null, { status: 202 }),
      new Response(null, { status: 404 }),
      new Response(null, { status: 404 }),
    ]);
    let settled = false;
    const failure = assert
      .rejects(
        pollDocumentEvaluation(client, "doc"),
        /Evaluation results were not available within 5 minutes/,
      )
      .then(() => {
        settled = true;
      });
    await setImmediate();
    t.mock.timers.tick(299_999);
    await setImmediate();
    assert.equal(settled, false);
    t.mock.timers.tick(1);
    await failure;
    const callCount = requests.length;
    t.mock.timers.tick(10_000);
    await setImmediate();
    assert.equal(requests.length, callCount);
    assert.equal(
      requests.filter((request) => request.method === "POST").length,
      1,
    );
    assert.ok(requests.every((request) => request.signal.aborted));
  });

  for (const stage of ["POST", "GET", "GET body"]) {
    it("aborts a stalled " + stage + " at the overall deadline", async (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      const requests: Request[] = [];
      const client = createClient({
        baseUrl: "https://example.invalid/v1",
        fetch: async (input) => {
          assert.ok(input instanceof Request);
          requests.push(input);
          if (input.method === "POST" && stage !== "POST") {
            return new Response(null, { status: 202 });
          }
          if (stage === "GET body") {
            const body = new ReadableStream({
              start(controller) {
                input.signal.addEventListener(
                  "abort",
                  () => controller.error(input.signal.reason),
                  { once: true },
                );
              },
            });
            return new Response(body, {
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Promise<Response>((_resolve, reject) => {
            input.signal.addEventListener(
              "abort",
              () => reject(input.signal.reason),
              { once: true },
            );
          });
        },
      });
      const failure = assert.rejects(
        pollDocumentEvaluation(client, "doc"),
        /Evaluation results were not available within 5 minutes/,
      );
      await setImmediate();
      assert.equal(requests.length, stage === "POST" ? 1 : 2);
      t.mock.timers.tick(300_000);
      await failure;
      assert.ok(requests.every((request) => request.signal.aborted));
    });
  }

  for (const stage of ["POST", "GET"]) {
    const statuses =
      stage === "POST"
        ? [401, 403, 404, 422, 429, 500]
        : [401, 403, 422, 429, 500];
    for (const status of statuses) {
      it(
        "propagates " + stage + " HTTP " + status + " without retrying",
        async (t) => {
          t.mock.timers.enable({ apis: ["setTimeout"] });
          const error = { message: "Evaluation unavailable" };
          const { client, requests } = mockClient([
            ...(stage === "GET" ? [new Response(null, { status: 202 })] : []),
            Response.json(error, { status }),
          ]);
          await assert.rejects(pollDocumentEvaluation(client, "doc"), (err) => {
            assert.deepEqual(err, error);
            return true;
          });
          assert.equal(requests.length, stage === "POST" ? 1 : 2);
          t.mock.timers.tick(300_000);
          await setImmediate();
          assert.ok(requests.every((request) => !request.signal.aborted));
        },
      );
    }

    it(
      "propagates a " + stage + " network failure without retrying",
      async () => {
        const error = new TypeError("fetch failed");
        const methods: string[] = [];
        const client = createClient({
          baseUrl: "https://example.invalid/v1",
          fetch: async (input) => {
            assert.ok(input instanceof Request);
            methods.push(input.method);
            if (input.method !== stage)
              return new Response(null, { status: 202 });
            throw error;
          },
        });
        await assert.rejects(
          pollDocumentEvaluation(client, "doc"),
          (err) => err === error,
        );
        assert.deepEqual(
          methods,
          stage === "POST" ? ["POST"] : ["POST", "GET"],
        );
      },
    );
  }

  it("propagates dry-run immediately without a GET or waiting notification", async () => {
    const error = new DryRunError();
    const methods: string[] = [];
    let notified = false;
    const client = createClient({
      baseUrl: "https://example.invalid/v1",
      fetch: async (input) => {
        assert.ok(input instanceof Request);
        methods.push(input.method);
        throw error;
      },
    });
    await assert.rejects(
      pollDocumentEvaluation(client, "doc", () => {
        notified = true;
      }),
      (err) => err === error,
    );
    assert.deepEqual(methods, ["POST"]);
    assert.equal(notified, false);
  });

  it("rejects unexpected POST success codes instead of entering polling", async () => {
    const { client, requests } = mockClient([
      Response.json({ status: "COMPLETED", summary: "Old API response" }),
    ]);
    await assert.rejects(
      pollDocumentEvaluation(client, "doc"),
      /expected 202 or 204/,
    );
    assert.equal(requests.length, 1);
  });

  for (const body of [
    null,
    {},
    { summary: null },
    { summary: 42 },
    { status: "COMPLETED" },
  ]) {
    it("rejects a malformed GET result " + JSON.stringify(body), async () => {
      const { client, requests } = mockClient([
        new Response(null, { status: 204 }),
        Response.json(body),
      ]);
      await assert.rejects(
        pollDocumentEvaluation(client, "doc"),
        /expected a summary/,
      );
      assert.equal(requests.length, 2);
    });
  }

  for (const status of [202, 204]) {
    it(
      "rejects an unexpected GET HTTP " +
        status +
        " instead of treating it as pending",
      async () => {
        const { client, requests } = mockClient([
          new Response(null, { status: 202 }),
          new Response(null, { status }),
        ]);
        await assert.rejects(
          pollDocumentEvaluation(client, "doc"),
          /expected a summary/,
        );
        assert.equal(requests.length, 2);
      },
    );
  }
});
