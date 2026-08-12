import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  envTruthy,
  isNewerVersion,
  resetUpdateCheckStateForTests,
  shouldNotifyUpdates,
} from "./update-check.js";
import { displayVersion, normalizeVersion } from "./version.js";

describe("normalizeVersion", () => {
  it("strips v prefix and pre-release metadata", () => {
    assert.equal(normalizeVersion("v1.2.3"), "1.2.3");
    assert.equal(normalizeVersion("1.2.3"), "1.2.3");
    assert.equal(normalizeVersion("V0.1.0"), "0.1.0");
    assert.equal(normalizeVersion("v1.2.3-beta.1"), "1.2.3");
    assert.equal(normalizeVersion("  v2.0.0+build "), "2.0.0");
  });
});

describe("displayVersion", () => {
  it("formats versions for display", () => {
    assert.equal(displayVersion("0.1.0"), "v0.1.0");
    assert.equal(displayVersion("v0.1.0"), "v0.1.0");
    assert.equal(displayVersion("dev"), "dev");
  });
});

describe("isNewerVersion", () => {
  it("detects newer semver", () => {
    assert.equal(isNewerVersion("0.2.0", "0.1.0"), true);
    assert.equal(isNewerVersion("v1.0.0", "0.9.9"), true);
    assert.equal(isNewerVersion("1.2.3", "1.2.2"), true);
    assert.equal(isNewerVersion("2.0.0", "1.9.9"), true);
  });

  it("rejects equal or older versions", () => {
    assert.equal(isNewerVersion("0.1.0", "0.1.0"), false);
    assert.equal(isNewerVersion("0.1.0", "0.2.0"), false);
    assert.equal(isNewerVersion("v1.2.3", "1.2.3"), false);
    assert.equal(isNewerVersion("1.2.3", "1.2.4"), false);
  });
});

describe("shouldNotifyUpdates", () => {
  it("disables notices in common non-interactive cases", () => {
    resetUpdateCheckStateForTests();
    // Version is "dev" in tests unless compiled with a define.
    assert.equal(
      shouldNotifyUpdates({ stderrIsTTY: true, env: {} }),
      false,
      "dev version should disable",
    );

    assert.equal(envTruthy("1"), true);
    assert.equal(envTruthy("true"), true);
    assert.equal(envTruthy("0"), false);
  });
});
