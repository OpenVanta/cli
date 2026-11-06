import type { Command } from "commander";
import {
  clearStoredCredentials,
  credentialStorageDescription,
  loadStoredCredentials,
  resolveAPIBase,
  revokeUserToken,
  type AuthOverrides,
} from "../auth.js";

export function registerLogoutCommand(
  program: Command,
  getOverrides: () => AuthOverrides,
): void {
  program
    .command("logout")
    .description(
      "Sign out: revoke a browser sign-in and remove saved credentials",
    )
    .action(async () => {
      const stored = await loadStoredCredentials({ fresh: true });
      const hasLogin = Boolean(
        stored.authMode === "user" ||
        stored.clientId ||
        stored.accessToken ||
        stored.refreshToken,
      );

      if (stored.authMode === "user") {
        // The refresh token identifies the grant and outlives the access
        // token, so revoking it ends the sign-in even if the access token has
        // expired. The server matches either.
        const token = stored.refreshToken || stored.accessToken;
        if (token) {
          const apiBase = await resolveAPIBase(getOverrides());
          try {
            await revokeUserToken(apiBase, token);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
              `Warning: could not revoke the sign-in on the server (${message}). Removing it locally anyway; it expires after 7 days unused.`,
            );
          }
        }
      }

      await clearStoredCredentials();
      console.log(
        hasLogin
          ? `Signed out. Credentials removed from ${credentialStorageDescription()}.`
          : "Not signed in; nothing to remove.",
      );
    });
}
