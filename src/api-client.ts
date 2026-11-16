import { createClient, type Client } from "./generated/client/index.js";
import {
  type AuthOverrides,
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

const dryRunToken = "<dry-run>";

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

function createInstrumentedFetch(flags: GlobalFlags): typeof fetch {
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

    // Every API request carries the bearer token; a redirect could forward it.
    const response = await fetch(input, {
      ...init,
      headers,
      redirect: "error",
    });

    if (flags.verbose) {
      process.stderr.write(`<- ${response.status}\n`);
    }

    return response;
  };
}

export async function newAPIClient(flags: GlobalFlags): Promise<ApiClient> {
  const base = await resolveAPIBase(flags);
  // Dry runs never load or refresh credentials, so they cannot send them.
  const token = flags.dryRun
    ? dryRunToken
    : await resolveAccessToken(base, flags);
  const baseUrl = base.replace(/\/+$/, "");

  const client = createClient({
    baseUrl,
    auth: token,
    fetch: createInstrumentedFetch(flags),
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
