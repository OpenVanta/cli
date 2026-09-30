import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { printResponse, shouldUseAgentOutput } from "./output.js";

describe("printResponse", () => {
  it("unwraps results.data into data/nextCursor", () => {
    let out = "";
    printResponse(
      {
        results: {
          data: [{ id: "1" }],
          pageInfo: { endCursor: "cursor-1", hasNextPage: true },
          totalCount: 1,
        },
      },
      { pretty: false, agentMode: false },
      (s) => {
        out += s;
      },
    );
    assert.deepEqual(JSON.parse(out), {
      data: [{ id: "1" }],
      pageInfo: { endCursor: "cursor-1", hasNextPage: true },
      nextCursor: "cursor-1",
      totalCount: 1,
    });
  });
});

describe("shouldUseAgentOutput", () => {
  it("honors explicit --pretty in an auto-detected agent environment", () => {
    assert.equal(
      shouldUseAgentOutput(
        { pretty: true, prettyExplicit: true },
        true,
      ),
      false,
    );
  });

  it("honors explicit --no-pretty in an auto-detected agent environment", () => {
    assert.equal(
      shouldUseAgentOutput(
        { pretty: false, prettyExplicit: true },
        true,
      ),
      false,
    );
  });

  it("keeps explicit agent mode precedence over explicit pretty output", () => {
    assert.equal(
      shouldUseAgentOutput(
        { pretty: true, prettyExplicit: true, agentMode: true },
        false,
      ),
      true,
    );
  });
});
