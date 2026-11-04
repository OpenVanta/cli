import { spawn } from "node:child_process";
import { createInterface as createLineReader } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Command } from "commander";
import {
  cacheAccessToken,
  configFilePath,
  credentialStorageDescription,
  defaultOAuthScope,
  exchangeAuthorizationCode,
  requestOAuthToken,
  resolveAPIBase,
  resolveWebBase,
  saveOAuthCredentials,
  saveUserCredentials,
  type AuthOverrides,
} from "../auth.js";
import {
  buildAuthorizeUrl,
  createPkcePair,
  createState,
  parsePastedCallback,
  startCallbackListener,
  type CallbackListener,
  type CallbackResult,
} from "../user-login.js";

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

/** Best effort: the URL is always printed too, so a failure here is harmless. */
function openBrowser(url: string): void {
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.on("error", () => {});
    child.unref();
  } catch {
    // Printed URL is the fallback.
  }
}

/** Resolves with a pasted callback (for a browser that cannot reach this machine). */
function readPastedCallback(expectedState: string): {
  result: Promise<CallbackResult>;
  close: () => void;
} {
  const rl = createLineReader({ input });
  const result = new Promise<CallbackResult>((resolve) => {
    rl.on("line", (line) => {
      const parsed = parsePastedCallback(line, expectedState);
      if (parsed?.kind === "state-mismatch") {
        console.error(
          "That URL does not match this sign-in request; paste the URL from this attempt.",
        );
        return;
      }
      if (parsed) resolve(parsed);
    });
  });
  return { result, close: () => rl.close() };
}

export type LoginDeps = {
  prompt: (
    label: string,
    defaultValue: string,
    required: boolean,
  ) => Promise<string>;
  openBrowser: (url: string) => void;
  startListener: (args: {
    expectedState: string;
    timeoutMs: number;
  }) => Promise<CallbackListener>;
  readPasted: (expectedState: string) => {
    result: Promise<CallbackResult>;
    close: () => void;
  };
  timeoutMs: number;
};

const defaultDeps: LoginDeps = {
  prompt: promptValue,
  openBrowser,
  startListener: startCallbackListener,
  readPasted: readPastedCallback,
  timeoutMs: 5 * 60 * 1000,
};

const browserHint = "leave blank to sign in with your browser";

async function browserLogin(args: {
  apiBase: string;
  overrides: AuthOverrides;
  scopeDefault: string;
  noBrowser: boolean;
  deps: LoginDeps;
}): Promise<void> {
  const { deps } = args;
  const webBaseDefault = await resolveWebBase(args.overrides, args.apiBase);
  const webBase = await deps.prompt("Web app URL", webBaseDefault, true);
  const scope =
    (await deps.prompt(
      `OAuth scope (default: ${args.scopeDefault})`,
      args.scopeDefault,
      false,
    )) || args.scopeDefault;

  const { verifier, challenge } = createPkcePair();
  const state = createState();
  const listener = await deps.startListener({
    expectedState: state,
    timeoutMs: deps.timeoutMs,
  });
  const pasted = deps.readPasted(state);
  const authorizeUrl = buildAuthorizeUrl({
    webBase,
    redirectUri: listener.redirectUri,
    state,
    scope,
    challenge,
  });

  console.log(
    args.noBrowser
      ? "Open this URL in a browser signed in to Vanta:"
      : "Opening your browser to sign in. If it does not open, visit:",
  );
  console.log(`\n  ${authorizeUrl}\n`);
  console.log(
    "Waiting for sign-in... (if the browser cannot reach this machine, paste the URL it was sent to here)",
  );
  if (!args.noBrowser) deps.openBrowser(authorizeUrl);

  let result: CallbackResult;
  try {
    result = await Promise.race([listener.result, pasted.result]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${message}. Run \`vanta login\` to try again:\n  ${authorizeUrl}`,
    );
  } finally {
    listener.close();
    pasted.close();
  }

  if (result.kind === "error") {
    const detail = result.description ? ` (${result.description})` : "";
    const hint =
      result.error === "access_denied"
        ? "sign-in was declined in the browser"
        : result.error === "server_error"
          ? "the Vanta web app could not complete sign-in; check that browser sign-in is enabled for your workspace"
          : "the browser returned without an authorization code";
    throw new Error(
      `browser sign-in failed: ${result.error}${detail}: ${hint}`,
    );
  }
  if (result.kind !== "code") {
    throw new Error("browser sign-in failed: unexpected response");
  }

  const tokens = await exchangeAuthorizationCode({
    apiBase: args.apiBase,
    code: result.code,
    codeVerifier: verifier,
    redirectUri: listener.redirectUri,
  });
  await saveUserCredentials({ apiBase: args.apiBase, webBase, scope, tokens });

  console.log(
    `Signed in. Credentials saved to ${credentialStorageDescription()}`,
  );
  console.log(`API base saved as ${args.apiBase}`);
  console.log(`CLI configuration saved to ${configFilePath()}`);
  console.log(
    `Access token cached (expires at ${tokens.expiresAt.toISOString().replace(/\.\d{3}Z$/, "Z")}); it refreshes automatically`,
  );
}

export function registerLoginCommand(
  program: Command,
  getOverrides: () => AuthOverrides,
  deps: LoginDeps = defaultDeps,
): void {
  program
    .command("login")
    .description(
      "Sign in with your browser, or save OAuth client credentials for the CLI",
    )
    .option("--client-id <id>", "OAuth client ID (client credentials only)")
    .option(
      "--client-secret <secret>",
      "OAuth client secret (omit to sign in with your browser)",
    )
    .option("--scope <scope>", "OAuth scope", defaultOAuthScope)
    .option(
      "--no-browser",
      "Print the sign-in URL instead of opening a browser",
    )
    .action(
      async (opts: {
        clientId?: string;
        clientSecret?: string;
        scope?: string;
        browser?: boolean;
      }) => {
        const overrides = getOverrides();
        const apiBaseDefault = await resolveAPIBase(overrides);
        const apiBase = await deps.prompt("API base URL", apiBaseDefault, true);
        const clientID = await deps.prompt(
          `OAuth client ID (${browserHint})`,
          opts.clientId ?? "",
          false,
        );
        // A blank client ID means browser sign-in; asking for a secret would be noise.
        const clientSecret = clientID
          ? await deps.prompt(
              `OAuth client secret (${browserHint})`,
              opts.clientSecret ?? "",
              false,
            )
          : "";
        const scopeDefault = opts.scope?.trim() || defaultOAuthScope;

        if (!clientSecret) {
          if (clientID) {
            console.log(
              "No client secret given; signing in with your browser instead of client credentials.",
            );
          }
          await browserLogin({
            apiBase,
            overrides,
            scopeDefault,
            noBrowser: opts.browser === false,
            deps,
          });
          return;
        }

        const scope =
          (await deps.prompt(
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
      },
    );
}
