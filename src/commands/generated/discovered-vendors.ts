import type { Command } from "commander";
import {
  addDiscoveredVendorToManaged,
  listDiscoveredVendorAccounts,
  listDiscoveredVendors,
} from "../generated/sdk.gen.js";
import type { DiscoveredVendorScope } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerDiscoveredVendorsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const discoveredVendors = program
    .command("discovered-vendors")
    .description("Manage discovered vendors");

  addPaginationOptions(
    discoveredVendors
      .command("list")
      .description("List discovered vendors")
      .option(
        "--scope <scope>",
        "Discovered vendor scope (defaults to NEEDS_REVIEW in the API): NEEDS_REVIEW, IGNORED, REJECTED",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      scope?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listDiscoveredVendors({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.scope?.trim()
              ? { scope: opts.scope.trim() as DiscoveredVendorScope }
              : {}),
          },
        }),
      );
    },
  );

  addPaginationOptions(
    discoveredVendors
      .command("list-accounts")
      .description("List accounts for a discovered vendor")
      .requiredOption("--id <id>", "Discovered vendor ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listDiscoveredVendorAccounts({
          client: api.client,
          path: { discoveredVendorId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  discoveredVendors
    .command("add-to-managed")
    .description("Add a discovered vendor to managed vendors")
    .requiredOption("--id <id>", "Discovered vendor ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        addDiscoveredVendorToManaged({
          client: api.client,
          path: { discoveredVendorId: opts.id },
        }),
      );
    });
}
