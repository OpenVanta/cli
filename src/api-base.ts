// Credentials are only ever sent to these exact origins. Staging and custom
// endpoints are deliberately absent: a flag, env var or config edit must not be
// able to point production credentials at another host.
const allowedAPIHosts = new Set([
  "api.vanta.com",
  "api.eu.vanta.com",
  "api.aus.vanta.com",
  "api.vanta-gov.com",
]);

const apiPath = "/v1";

/**
 * Returns the normalized base URL (`https://<host>/v1`) or throws if `raw` is
 * not an approved Vanta API base.
 */
export function validateAPIBase(raw: string): string {
  const trimmed = raw.trim();
  const reject = (reason: string): never => {
    throw new Error(
      `invalid API base ${JSON.stringify(trimmed)}: ${reason}. Allowed: ${[
        ...allowedAPIHosts,
      ]
        .map((host) => `https://${host}${apiPath}`)
        .join(", ")}`,
    );
  };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return reject("not a URL");
  }

  if (url.protocol !== "https:") reject("must use https");
  if (url.username || url.password) reject("must not contain credentials");
  if (url.port) reject("must not set a port");
  if (!allowedAPIHosts.has(url.hostname))
    reject("host is not a Vanta API host");
  if (url.pathname !== apiPath && url.pathname !== `${apiPath}/`) {
    reject(`path must be ${apiPath}`);
  }
  if (url.search || url.hash) reject("must not contain a query or fragment");

  return `${url.origin}${apiPath}`;
}
