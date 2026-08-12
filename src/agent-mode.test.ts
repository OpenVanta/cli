import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectAgentEnvironment } from "./agent-mode.js";

describe("detectAgentEnvironment", () => {
  it("returns false when no agent env vars are set", () => {
    assert.equal(
      detectAgentEnvironment(() => undefined),
      false,
    );
  });

  it("returns true for truthy CURSOR_AGENT", () => {
    assert.equal(
      detectAgentEnvironment((name) =>
        name === "CURSOR_AGENT" ? "1" : undefined,
      ),
      true,
    );
  });

  it("ignores falsey agent signals", () => {
    assert.equal(
      detectAgentEnvironment((name) =>
        name === "CURSOR_AGENT" ? "false" : undefined,
      ),
      false,
    );
  });
});
