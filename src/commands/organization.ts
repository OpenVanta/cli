import type { Command } from "commander";
import { getOrganization } from "../generated/sdk.gen.js";
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
    .description("Get organization")
    .action(async () => {
      await runSdk(getFlags, (api) => getOrganization({ client: api.client }));
    });
}
