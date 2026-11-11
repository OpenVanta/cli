import { spawn } from "node:child_process";
import type { Command } from "commander";
import {
  cacheAccessToken,
  configFilePath,
  credentialStorageDescription,
  defaultOAuthScope,
  exchangeAuthorizationCode,
  loadStoredCredentials,
  requestOAuthToken,
  resolveAPIBase,
  resolveWebBase,
  OAuthTokenError,
  revokePreviousBrowserLogin,
  saveOAuthCredentials,
  saveUserCredentials,
  type AuthOverrides,
  type UserTokens,
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
  /** True when a person is typing; piped input gets no menu, only the prompts. */
  interactive: boolean;
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
  const source = (io.input ?? process.stdin) as { isTTY?: boolean };

  return {
    interactive: Boolean(source.isTTY),
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
        if (parsed?.kind === "unrecognized") {
          console.error(
            "That doesn't look like a sign-in URL; paste the full URL from the browser's address bar.",
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

type SignInMethod = "client" | "browser";

/**
 * Shown only in a terminal with no mode flag. Client credentials stay the
 * default while browser sign-in is in beta; the GA change flips the default.
 */
async function chooseSignInMethod(deps: LoginDeps): Promise<SignInMethod> {
  console.log("How do you want to sign in?");
  console.log("  1) With an API client ID and secret");
  console.log(
    "  2) With your Vanta account in the browser (beta; may not be enabled for your workspace yet)",
  );
  for (;;) {
    const answer = await deps.prompt("Choice", "1", false);
    if (answer === "1") return "client";
    if (answer === "2") return "browser";
    console.log("Enter 1 or 2.");
  }
}

/** One login is saved at a time, so say what a new one of the other kind replaces. */
async function noteReplacedLogin(next: SignInMethod): Promise<void> {
  const stored = await loadStoredCredentials();
  if (next === "browser" && stored.authMode === "client" && stored.clientId) {
    console.log(
      "Note: this replaces the saved client credentials. Run `vanta login` to use them again.",
    );
  } else if (
    next === "client" &&
    stored.authMode === "user" &&
    stored.refreshToken
  ) {
    console.log(
      "Note: this replaces your browser sign-in, which will be revoked. Run `vanta login --browser` to sign in as yourself again.",
    );
  }
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
  await noteReplacedLogin("browser");

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
    throw new Error(`${message}. Run \`vanta login --browser\` to try again.`);
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

  let tokens: UserTokens;
  try {
    tokens = await exchangeAuthorizationCode({
      apiBase: args.apiBase,
      code: result.code,
      codeVerifier: verifier,
      redirectUri: listener.redirectUri,
    });
  } catch (err) {
    if (err instanceof OAuthTokenError && err.code === "invalid_grant") {
      throw new Error(
        "browser sign-in failed: the sign-in code was rejected (it expires after 60 seconds and works once). Run `vanta login --browser` to try again.",
      );
    }
    throw err;
  }
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
  if (process.env.VANTA_CLIENT_SECRET?.trim()) {
    console.error(
      "Warning: VANTA_CLIENT_SECRET is set, so commands in this shell use those client credentials, not this sign-in. Unset it to act as yourself.",
    );
  }
}

export function registerLoginCommand(
  program: Command,
  getOverrides: () => AuthOverrides,
  makeDeps: () => LoginDeps = terminalDeps,
): void {
  program
    .command("login")
    .description(
      "Sign in with an API client ID and secret, or with your Vanta account in the browser (--browser)",
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
        // --client-id/--client-secret are also global options, and commander
        // hands them to the program, not to this command, so read both.
        const overrides = getOverrides();
        const clientIdFlag = opts.clientId ?? overrides.clientId;
        const clientSecretFlag = opts.clientSecret ?? overrides.clientSecret;
        if (opts.browser && (clientIdFlag || clientSecretFlag)) {
          throw new Error(
            "--browser signs in without client credentials: pass either --browser or --client-id/--client-secret",
          );
        }
        if (!opts.browser && opts.open === false) {
          throw new Error("--no-open only applies to `vanta login --browser`");
        }

        const deps = makeDeps();
        try {
          let method: SignInMethod = opts.browser ? "browser" : "client";
          if (
            !opts.browser &&
            !clientIdFlag &&
            !clientSecretFlag &&
            deps.interactive
          ) {
            method = await chooseSignInMethod(deps);
          }

          const apiBaseDefault = await resolveAPIBase(overrides);
          const apiBase = await deps.prompt(
            "API base URL",
            apiBaseDefault,
            true,
          );
          const scopeDefault = opts.scope?.trim() || defaultOAuthScope;

          if (method === "browser") {
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
            clientIdFlag ?? "",
            true,
          );
          const clientSecret = await deps.prompt(
            "OAuth client secret",
            clientSecretFlag ?? "",
            true,
          );
          const scope =
            (await deps.prompt(
              `OAuth scope (default: ${scopeDefault})`,
              scopeDefault,
              false,
            )) || scopeDefault;
          await noteReplacedLogin("client");

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
