import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateAPIBase } from "./api-base.js";

describe("validateAPIBase", () => {
  it("accepts each production region and normalizes it to its /v1 base", () => {
    const cases: Array<[string, string]> = [
      ["https://api.vanta.com/v1", "https://api.vanta.com/v1"],
      ["https://api.eu.vanta.com/v1", "https://api.eu.vanta.com/v1"],
      ["https://api.aus.vanta.com/v1", "https://api.aus.vanta.com/v1"],
      ["https://api.vanta-gov.com/v1", "https://api.vanta-gov.com/v1"],
      ["https://api.vanta.com/v1/", "https://api.vanta.com/v1"],
      ["https://API.Vanta.com/v1", "https://api.vanta.com/v1"],
      ["https://api.vanta.com:443/v1", "https://api.vanta.com/v1"],
      ["  https://api.vanta.com/v1  ", "https://api.vanta.com/v1"],
    ];
    for (const [input, want] of cases) {
      assert.equal(validateAPIBase(input), want, input);
    }
  });

  it("rejects bases that could send credentials somewhere other than Vanta production", () => {
    for (const input of [
      "http://api.vanta.com/v1",
      "https://attacker.example/v1",
      "https://api.vanta.com.attacker.example/v1",
      "https://attacker.api.vanta.com/v1",
      "https://evil-api.vanta.com/v1",
      "https://api.vanta.com@attacker.example/v1",
      "https://user:pass@api.vanta.com/v1",
      "https://api.vanta.com:8443/v1",
      "https://api.staging.vanta.com/v1",
      "https://api.vanta.com./v1",
      "https://api.vanta.com/v2",
      "https://api.vanta.com/",
      "https://api.vanta.com/v1?x=1",
      "https://api.vanta.com/v1#frag",
      "api.vanta.com/v1",
      "",
    ]) {
      assert.throws(() => validateAPIBase(input), /invalid API base/, input);
    }
  });
});
