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

  it("removes terminal control bytes from agent-mode output", () => {
    let out = "";
    printResponse(
      { message: "\u001b]0;PWNED\u0007\u001b[31mred\u001b[0m" },
      { pretty: false, agentMode: true },
      (s) => {
        out += s;
      },
    );

    assert.equal(/[\u0000-\u001f\u007f-\u009f]/u.test(out.slice(0, -1)), false);
    assert.match(out, /message: ".*PWNED.*red/);
    assert.equal(out.endsWith("\n"), true);
  });

  it("keeps TOON structural newlines and escaped string controls", () => {
    let out = "";
    printResponse(
      { message: "line1\nline2\r\n\tindented" },
      { pretty: false, agentMode: true },
      (s) => {
        out += s;
      },
    );

    assert.equal(out.split("\n").length, 2);
    assert.match(out, /line1\\nline2\\r\\n\\tindented/);
  });
});
