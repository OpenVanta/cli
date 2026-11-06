import { spawn } from "node:child_process";
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
  revokePreviousBrowserLogin,
  saveOAuthCredentials,
  saveUserCredentials,
  type AuthOverrides,
} from "../auth.js";
import { InputClosedError, LineInput } from "../line-input.js";
import {
  buildAuthorizeUrl,
  createPkcePair,
  createState,
  parsePastedCallback,
  startCallbackListener,
  type CallbackListener,
  type CallbackResult,
} from "../user-login.js";

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
  /**
   * Resolves with a callback URL (or code) pasted on stdin, for a browser that
   * cannot reach this machine's loopback. Never settles if input ends.
   */
  readPasted: (expectedState: string) => Promise<CallbackResult>;
  timeoutMs: number;
  close: () => void;
};

/** Real terminal I/O: one shared line reader for the prompts and the paste. */
export function terminalDeps(
  io: {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
  } = {},
): LoginDeps {
  const out = io.output ?? process.stdout;
  let lines: LineInput | undefined;
  const input = () => (lines ??= new LineInput(io.input, out));

  return {
    async prompt(label, defaultValue, required) {
      const prompt =
        defaultValue.trim() !== ""
          ? `${label} [${defaultValue}]: `
          : `${label}: `;
      let value: string;
      try {
        value = (await input().question(prompt)).trim();
      } catch (err) {
        if (!(err instanceof InputClosedError)) throw err;
        // End of piped input: take the default, as Enter would.
        out.write("\n");
        value = "";
        if (required && !defaultValue.trim()) {
          throw new Error(
            `no input for "${label}": run \`vanta login\` in a terminal or pipe in an answer for each prompt`,
          );
        }
      }
      if (!value) value = defaultValue.trim();
      if (required && !value) {
        throw new Error("value cannot be empty");
      }
      return value;
    },
    openBrowser,
    startListener: startCallbackListener,
    async readPasted(expectedState) {
      for (;;) {
        let line: string;
        try {
          line = await input().nextLine();
        } catch {
          return new Promise<never>(() => {});
        }
        const parsed = parsePastedCallback(line, expectedState);
        if (parsed?.kind === "state-mismatch") {
          console.error(
            "That URL does not match this sign-in request; paste the URL from this attempt.",
          );
          continue;
        }
        if (parsed) return parsed;
      }
    },
    timeoutMs: 5 * 60 * 1000,
    close: () => lines?.close(),
  };
}

const browserSignInHint =
  "browser sign-in is in beta and may not be enabled for your workspace yet; you can still sign in with client credentials: `vanta login`";

async function browserLogin(args: {
  apiBase: string;
  overrides: AuthOverrides;
  scopeDefault: string;
  open: boolean;
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
  const authorizeUrl = buildAuthorizeUrl({
    webBase,
    redirectUri: listener.redirectUri,
    state,
    scope,
    challenge,
  });

  console.log(
    args.open
      ? "Opening your browser to sign in. If it does not open, visit:"
      : "Open this URL in a browser signed in to Vanta:",
  );
  console.log(`\n  ${authorizeUrl}\n`);
  console.log(
    "Waiting for sign-in... (if the browser cannot reach this machine, paste the URL it was sent to here)",
  );
  if (args.open) deps.openBrowser(authorizeUrl);

  let result: CallbackResult;
  try {
    result = await Promise.race([listener.result, deps.readPasted(state)]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${message}. Run \`vanta login --browser\` to try again:\n  ${authorizeUrl}`,
    );
  } finally {
    listener.close();
  }

  if (result.kind === "error") {
    const detail = result.description ? ` (${result.description})` : "";
    const hint =
      result.error === "access_denied"
        ? "sign-in was declined in the browser"
        : result.error === "server_error"
          ? `the Vanta web app could not complete sign-in; ${browserSignInHint}`
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
  await revokePreviousBrowserLogin(args.apiBase);
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
  makeDeps: () => LoginDeps = terminalDeps,
): void {
  program
    .command("login")
    .description(
      "Save OAuth credentials for the CLI, or sign in with your browser (--browser)",
    )
    .option("--client-id <id>", "OAuth client ID")
    .option("--client-secret <secret>", "OAuth client secret")
    .option("--scope <scope>", "OAuth scope", defaultOAuthScope)
    .option(
      "--browser",
      "Sign in as yourself through the browser instead of with client credentials (beta)",
    )
    .option(
      "--no-open",
      "With --browser, print the sign-in URL instead of opening it",
    )
    .action(
      async (opts: {
        clientId?: string;
        clientSecret?: string;
        scope?: string;
        browser?: boolean;
        open?: boolean;
      }) => {
        if (opts.browser && (opts.clientId || opts.clientSecret)) {
          throw new Error(
            "--browser signs in without client credentials: pass either --browser or --client-id/--client-secret",
          );
        }

        const deps = makeDeps();
        try {
          const overrides = getOverrides();
          const apiBaseDefault = await resolveAPIBase(overrides);
          const apiBase = await deps.prompt(
            "API base URL",
            apiBaseDefault,
            true,
          );
          const scopeDefault = opts.scope?.trim() || defaultOAuthScope;

          if (opts.browser) {
            await browserLogin({
              apiBase,
              overrides,
              scopeDefault,
              open: opts.open !== false,
              deps,
            });
            return;
          }

          const clientID = await deps.prompt(
            "OAuth client ID",
            opts.clientId ?? "",
            true,
          );
          const clientSecret = await deps.prompt(
            "OAuth client secret",
            opts.clientSecret ?? "",
            true,
          );
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
          await revokePreviousBrowserLogin(apiBase);
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
        } finally {
          deps.close();
        }
      },
    );
}
