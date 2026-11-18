import type { Command } from "commander";
import { getOrganization, getCompanyProfile } from "../generated/sdk.gen.js";
import { runSdk, type GetFlags } from "./helpers.js";

export function registerOrganizationCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const organization = program
    .command("organization")
    .description("Manage organization");

  organization
    .command("get")
    .description("Get the connected organization")
    .action(async () => {
      await runSdk(getFlags, (api) => getOrganization({ client: api.client }));
    });

  organization
    .command("get-company-profile")
    .description("Get the connected organization's company profile")
    .action(async () => {
      await runSdk(getFlags, (api) =>
        getCompanyProfile({ client: api.client }),
      );
    });
}
