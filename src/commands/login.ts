import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Command } from "commander";
import {
  cacheAccessToken,
  configFilePath,
  credentialStorageDescription,
  defaultOAuthScope,
  isTrustedVantaAPIBase,
  normalizeAPIBase,
  requestOAuthToken,
  resolveAPIBase,
  saveOAuthCredentials,
  type AuthOverrides,
} from "../auth.js";

async function promptValue(
  label: string,
  defaultValue: string,
  required: boolean,
): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const prompt =
      defaultValue.trim() !== ""
        ? `${label} [${defaultValue}]: `
        : `${label}: `;
    const valueRaw = await rl.question(prompt);
    let value = valueRaw.trim();
    if (!value) value = defaultValue.trim();
    if (required && !value) {
      throw new Error("value cannot be empty");
    }
    return value;
  } finally {
    rl.close();
  }
}

export type LoginCommandDependencies = {
  promptValue: typeof promptValue;
  resolveAPIBase: typeof resolveAPIBase;
  normalizeAPIBase: typeof normalizeAPIBase;
  isTrustedVantaAPIBase: typeof isTrustedVantaAPIBase;
  requestOAuthToken: typeof requestOAuthToken;
  saveOAuthCredentials: typeof saveOAuthCredentials;
  cacheAccessToken: typeof cacheAccessToken;
  credentialStorageDescription: typeof credentialStorageDescription;
  configFilePath: typeof configFilePath;
  log: (message: string) => void;
};

const defaultLoginDependencies: LoginCommandDependencies = {
  promptValue,
  resolveAPIBase,
  normalizeAPIBase,
  isTrustedVantaAPIBase,
  requestOAuthToken,
  saveOAuthCredentials,
  cacheAccessToken,
  credentialStorageDescription,
  configFilePath,
  log: (message) => console.log(message),
};

export function registerLoginCommand(
  program: Command,
  getOverrides: () => AuthOverrides,
  dependencies: Partial<LoginCommandDependencies> = {},
): void {
  const deps = { ...defaultLoginDependencies, ...dependencies };
  program
    .command("login")
    .description("Save OAuth credentials for the CLI")
    .option("--client-id <id>", "OAuth client ID")
    .option("--client-secret <secret>", "OAuth client secret")
    .option("--scope <scope>", "OAuth scope", defaultOAuthScope)
    .action(async (opts: {
      clientId?: string;
      clientSecret?: string;
      scope?: string;
    }) => {
      const overrides = getOverrides();
      const apiBaseDefault = await deps.resolveAPIBase(overrides);
      const apiBase = deps.normalizeAPIBase(
        await deps.promptValue("API base URL", apiBaseDefault, true),
      );
      const customAPIBase = !deps.isTrustedVantaAPIBase(apiBase);
      if (customAPIBase) {
        const confirmation = await deps.promptValue(
          `Custom API host ${new URL(apiBase).host} will receive your OAuth client secret. Type TRUST to continue`,
          "",
          true,
        );
        if (confirmation !== "TRUST") {
          throw new Error("custom API host was not explicitly trusted");
        }
      }
      const clientID = await deps.promptValue(
        "OAuth client ID",
        opts.clientId ?? "",
        true,
      );
      const clientSecret = await deps.promptValue(
        "OAuth client secret",
        opts.clientSecret ?? "",
        true,
      );
      const scopeDefault = opts.scope?.trim() || defaultOAuthScope;
      const scope =
        (await deps.promptValue(
          `OAuth scope (default: ${scopeDefault})`,
          scopeDefault,
          false,
        )) || scopeDefault;

      const { accessToken, expiresAt } = await deps.requestOAuthToken(
        apiBase,
        clientID,
        clientSecret,
        scope,
        { allowCustomAPIBase: customAPIBase },
      );
      await deps.saveOAuthCredentials(apiBase, clientID, clientSecret, scope);
      await deps.cacheAccessToken(apiBase, accessToken, "Bearer", expiresAt);

      deps.log(
        `OAuth credentials saved to ${deps.credentialStorageDescription()}`,
      );
      deps.log(`API base saved as ${apiBase}`);
      deps.log(`CLI configuration saved to ${deps.configFilePath()}`);
      deps.log(
        `Access token cached (expires at ${expiresAt.toISOString().replace(/\.\d{3}Z$/, "Z")})`,
      );
    });
}
