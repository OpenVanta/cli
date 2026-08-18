import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { printResponse } from "./output.js";

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
