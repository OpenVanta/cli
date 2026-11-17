/**
 * Browser sign-in helpers: PKCE, state, the authorize URL, and the loopback
 * listener that receives the authorization code. Ported from obsidian
 * scripts/oauth-cli-e2e/vanta-cli-happy.mjs, the reference client.
 */
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * The first-party CLI's public OAuth client id. Mirrors obsidian
 * packages/codegen-common/src/authz/oauth/first-party-cli.ts. It identifies the
 * software, is the same in every environment, and has no secret.
 */
export const FIRST_PARTY_CLI_CLIENT_ID =
  // gitleaks:allow -- public OAuth client id, not a credential.
  "vci_a59a504f274d3d0306c06d9cda079e374f6a10e9e18cd61d";

export const defaultWebBase = "https://app.vanta.com";
export const localWebBase = "http://127.0.0.1:8080";
export const callbackPath = "/callback";

export type CallbackResult =
  | { kind: "code"; code: string }
  | { kind: "error"; error: string; description?: string }
  | { kind: "state-mismatch" };

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** RFC 7636: 32 random bytes as the verifier, S256 challenge. */
export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32));
  // nosemgrep: VantaInc.crypto-usage -- SHA-256 is the RFC 7636 S256 PKCE code challenge the server requires. It is not a password hash or signature.
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createState(): string {
  return base64url(randomBytes(16));
}

export function buildAuthorizeUrl(args: {
  webBase: string;
  redirectUri: string;
  state: string;
  scope: string;
  challenge: string;
}): string {
  // Append rather than replace the path, so a web base like
  // http://127.0.0.1:8080/c/<domain> (dev workspace routing) keeps its prefix.
  const url = new URL(args.webBase);
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/oauth/authorize`;
  url.hash = "";
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: FIRST_PARTY_CLI_CLIENT_ID,
    redirect_uri: args.redirectUri,
    state: args.state,
    scope: args.scope,
    code_challenge: args.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

export function parseCallback(url: URL, expectedState: string): CallbackResult {
  const p = url.searchParams;
  // Check state before reading anything else: a response we did not ask for
  // carries nothing we should act on, error included.
  if (p.get("state") !== expectedState) return { kind: "state-mismatch" };

  const error = p.get("error");
  if (error) {
    const description = p.get("error_description") ?? undefined;
    return description
      ? { kind: "error", error, description }
      : { kind: "error", error };
  }

  const code = p.get("code");
  if (!code) return { kind: "error", error: "missing_code" };
  return { kind: "code", code };
}

export type PastedResult = CallbackResult | { kind: "unrecognized" };

/**
 * Parses what a person pasted when the browser could not reach this machine's
 * loopback. Anything that looks like a URL or query string, with or without a
 * scheme, must carry the expected state, exactly as the loopback requires.
 * Returns null for a blank line and "unrecognized" for anything else. A bare
 * code is not accepted: it would skip the state check, and a stray word would
 * be sent to the token endpoint and end the attempt.
 */
export function parsePastedCallback(
  line: string,
  expectedState: string,
): PastedResult | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/[?&=]/.test(trimmed)) {
    const query = trimmed.includes("?")
      ? trimmed.slice(trimmed.indexOf("?") + 1)
      : trimmed;
    const url = new URL("http://127.0.0.1/");
    url.search = query.split("#")[0]!;
    return parseCallback(url, expectedState);
  }

  return { kind: "unrecognized" };
}

export type CallbackListener = {
  /** The exact redirect_uri to send at authorize and again at exchange. */
  redirectUri: string;
  /**
   * Resolves with the first callback whose state matches (a code or a consent
   * error). Rejects on timeout. Mismatched state is refused and ignored.
   */
  result: Promise<CallbackResult>;
  close: () => void;
};

const page = (message: string) =>
  `${message}\n\nYou can close this tab and return to the terminal.\n`;

/**
 * Listens on 127.0.0.1 (never `localhost`, which may resolve to ::1 and change
 * the redirect URI string). Port 0 picks an ephemeral port.
 */
export async function startCallbackListener(args: {
  expectedState: string;
  timeoutMs: number;
  port?: number;
}): Promise<CallbackListener> {
  let settle!: {
    resolve: (r: CallbackResult) => void;
    reject: (e: Error) => void;
  };
  const result = new Promise<CallbackResult>((resolve, reject) => {
    settle = { resolve, reject };
  });
  // Avoid an unhandled rejection if the caller settles another way first.
  result.catch(() => {});

  let redirectUri = "";
  let done = false;

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", redirectUri);
    if (done || url.pathname !== callbackPath) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found\n");
      return;
    }

    const parsed = parseCallback(url, args.expectedState);
    if (parsed.kind === "state-mismatch") {
      res
        .writeHead(400, { "content-type": "text/plain" })
        .end(
          "This sign-in response does not match the request the CLI started.\n",
        );
      return;
    }

    res.writeHead(200, { "content-type": "text/plain", connection: "close" });
    res.end(
      parsed.kind === "code"
        ? page("Signed in to the Vanta CLI.")
        : page(`Sign-in failed: ${parsed.error}.`),
    );
    finish();
    settle.resolve(parsed);
  });

  const timer = setTimeout(() => {
    finish();
    settle.reject(
      new Error(
        `timed out after ${Math.round(args.timeoutMs / 1000)}s waiting for the browser sign-in to finish`,
      ),
    );
  }, args.timeoutMs);

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    server.close();
    server.closeIdleConnections();
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(args.port ?? 0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const { port } = server.address() as AddressInfo;
  redirectUri = `http://127.0.0.1:${port}${callbackPath}`;

  return {
    redirectUri,
    result,
    close: () => {
      if (!done) {
        finish();
        settle.reject(new Error("sign-in cancelled"));
      }
      server.closeAllConnections();
    },
  };
}
