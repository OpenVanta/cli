import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Command } from "commander";
import {
  isTrustedVantaAPIBase,
  normalizeAPIBase,
  type AuthOverrides,
} from "../auth.js";
import { registerLoginCommand } from "./login.js";

type LoginRequest = {
  apiBase: string;
  clientID: string;
  clientSecret: string;
  scope: string;
  allowCustomAPIBase: boolean | undefined;
};

function createLoginCommand(responses: string[]) {
  const program = new Command();
  program.exitOverride();
  const prompts: string[] = [];
  const tokenRequests: LoginRequest[] = [];
  const savedCredentials: Array<{ apiBase: string; clientID: string; clientSecret: string }> = [];
  const cachedBases: string[] = [];
  const logs: string[] = [];

  registerLoginCommand(program, () => ({} as AuthOverrides), {
    promptValue: async (label, defaultValue) => {
      prompts.push(label);
      return responses.shift() ?? defaultValue;
    },
    resolveAPIBase: async () => "https://tenant.example/v1",
    normalizeAPIBase,
    isTrustedVantaAPIBase,
    requestOAuthToken: async (apiBase, clientID, clientSecret, scope, options) => {
      tokenRequests.push({
        apiBase,
        clientID,
        clientSecret,
        scope,
        allowCustomAPIBase: options?.allowCustomAPIBase,
      });
      return { accessToken: "test-access-token", expiresAt: new Date("2030-01-01T00:00:00Z") };
    },
    saveOAuthCredentials: async (apiBase, clientID, clientSecret) => {
      savedCredentials.push({ apiBase, clientID, clientSecret });
    },
    cacheAccessToken: async (apiBase) => {
      cachedBases.push(apiBase);
    },
    credentialStorageDescription: () => "test store",
    configFilePath: () => "/test/config.json",
    log: (message) => logs.push(message),
  });

  return { program, prompts, tokenRequests, savedCredentials, cachedBases, logs };
}

async function runLogin(program: Command): Promise<void> {
  await program.parseAsync(["node", "vanta", "login"]);
}

describe("login custom API host trust flow", () => {
  it("cancels before credentials are requested or stored unless TRUST is exact", async () => {
    const flow = createLoginCommand([
      "https://tenant.example/v1/",
      "trust",
    ]);

    await assert.rejects(runLogin(flow.program), /not explicitly trusted/);
    assert.match(flow.prompts[1], /tenant\.example.*receive your OAuth client secret/);
    assert.equal(flow.prompts.length, 2);
    assert.equal(flow.tokenRequests.length, 0);
    assert.equal(flow.savedCredentials.length, 0);
    assert.equal(flow.cachedBases.length, 0);
  });

  it("uses the displayed normalized host for token request and saved binding", async () => {
    const flow = createLoginCommand([
      "https://tenant.example/v1/",
      "TRUST",
      "test-client-id",
      "test-client-secret",
      "custom-scope",
    ]);

    await runLogin(flow.program);
    assert.match(flow.prompts[1], /tenant\.example.*receive your OAuth client secret/);
    assert.deepEqual(flow.tokenRequests, [
      {
        apiBase: "https://tenant.example/v1",
        clientID: "test-client-id",
        clientSecret: "test-client-secret",
        scope: "custom-scope",
        allowCustomAPIBase: true,
      },
    ]);
    assert.deepEqual(flow.savedCredentials, [
      {
        apiBase: "https://tenant.example/v1",
        clientID: "test-client-id",
        clientSecret: "test-client-secret",
      },
    ]);
    assert.deepEqual(flow.cachedBases, ["https://tenant.example/v1"]);
  });
});
