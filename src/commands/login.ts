import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Command } from "commander";
import {
  cacheAccessToken,
  configFilePath,
  credentialStorageDescription,
  defaultOAuthScope,
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

export function registerLoginCommand(
  program: Command,
  getOverrides: () => AuthOverrides,
): void {
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
      const apiBaseDefault = await resolveAPIBase(overrides);
      const apiBase = await promptValue("API base URL", apiBaseDefault, true);
      const clientID = await promptValue(
        "OAuth client ID",
        opts.clientId ?? "",
        true,
      );
      const clientSecret = await promptValue(
        "OAuth client secret",
        opts.clientSecret ?? "",
        true,
      );
      const scopeDefault = opts.scope?.trim() || defaultOAuthScope;
      const scope =
        (await promptValue(
          `OAuth scope (default: ${scopeDefault})`,
          scopeDefault,
          false,
        )) || scopeDefault;

      const { accessToken, expiresAt } = await requestOAuthToken(
        apiBase,
        clientID,
        clientSecret,
        scope,
      );
      await saveOAuthCredentials(apiBase, clientID, clientSecret, scope);
      await cacheAccessToken(accessToken, "Bearer", expiresAt);

      console.log(
        `OAuth credentials saved to ${credentialStorageDescription()}`,
      );
      console.log(`API base saved as ${apiBase}`);
      console.log(`CLI configuration saved to ${configFilePath()}`);
      console.log(
        `Access token cached (expires at ${expiresAt.toISOString().replace(/\.\d{3}Z$/, "Z")})`,
      );
    });
}
