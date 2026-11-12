import { createClient, type Client } from "./generated/client/index.js";
import {
  type AuthOverrides,
  refreshAfterUnauthorized,
  resolveAccessToken,
  resolveAPIBase,
} from "./auth.js";
import { userAgent } from "./version.js";

export class DryRunError extends Error {
  constructor() {
    super("dry-run");
    this.name = "DryRunError";
  }
}

export type GlobalFlags = AuthOverrides & {
  dryRun: boolean;
  verbose: boolean;
  pretty: boolean;
  agentMode?: boolean;
};

export type ApiClient = {
  client: Client;
  flags: GlobalFlags;
  handleError: (err: unknown) => unknown;
};

type RetryUnauthorized = (rejectedToken: string) => Promise<string | null>;

function bearerToken(headers: Headers): string {
  return (headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
}

export function createInstrumentedFetch(
  flags: GlobalFlags,
  retryUnauthorized?: RetryUnauthorized,
): typeof fetch {
  return async (input, init) => {
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set("User-Agent", userAgent());

    if (flags.dryRun) {
      process.stdout.write(`DRY RUN ${method} ${url}\n`);
      const contentType = headers.get("Content-Type") ?? "";
      if (contentType.startsWith("multipart/form-data")) {
        process.stdout.write("<multipart/form-data omitted>\n");
      } else {
        const body =
          init?.body ??
          (input instanceof Request ? await input.clone().text() : undefined);
        if (typeof body === "string" && body) {
          try {
            process.stdout.write(
              `${JSON.stringify(JSON.parse(body), null, 2)}\n`,
            );
          } catch {
            process.stdout.write(`${body}\n`);
          }
        }
      }
      throw new DryRunError();
    }

    if (flags.verbose) {
      process.stderr.write(`-> ${method} ${url}\n`);
    }

    // A browser sign-in's token can be revoked or expired server-side before
    // its cached expiry. Keep a copy of the request so it can be resent once
    // with a refreshed token. Multipart uploads are not retried: a copy would
    // buffer the whole file.
    const isMultipart = (headers.get("Content-Type") ?? "").startsWith(
      "multipart/form-data",
    );
    const retryCopy =
      retryUnauthorized && !isMultipart && input instanceof Request
        ? input.clone()
        : undefined;

    let response = await fetch(input, { ...init, headers });

    if (flags.verbose) {
      process.stderr.write(`<- ${response.status}\n`);
    }

    const rejected = bearerToken(headers);
    // A Request's body is used up by the first send, so it can only be resent
    // from the copy; a URL with a string or no body can be sent again as is.
    const canResend =
      !isMultipart &&
      (retryCopy !== undefined ||
        (!(input instanceof Request) &&
          (init?.body == null || typeof init.body === "string")));
    if (response.status === 401 && retryUnauthorized && rejected && canResend) {
      const fresh = await retryUnauthorized(rejected);
      if (fresh && fresh !== rejected) {
        headers.set("Authorization", `Bearer ${fresh}`);
        if (flags.verbose) {
          process.stderr.write(`-> ${method} ${url} (retry after refresh)\n`);
        }
        response = await fetch(retryCopy ?? input, { ...init, headers });
        if (flags.verbose) {
          process.stderr.write(`<- ${response.status}\n`);
        }
      }
    }

    return response;
  };
}

export async function newAPIClient(flags: GlobalFlags): Promise<ApiClient> {
  const base = await resolveAPIBase(flags);
  const token = await resolveAccessToken(base, flags, { dryRun: flags.dryRun });
  const baseUrl = base.replace(/\/+$/, "");

  const client = createClient({
    baseUrl,
    auth: token,
    fetch: createInstrumentedFetch(flags, (rejected) =>
      refreshAfterUnauthorized(base, rejected, flags),
    ),
  });

  return {
    client,
    flags,
    handleError(err: unknown) {
      if (err instanceof DryRunError) {
        return undefined;
      }
      return err;
    },
  };
}
