import type { Command } from "commander";
import {
  listTrustCenterHistoricalAccessRequests,
} from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterHistoricalAccessRequestsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const historicalAccessRequests = trustCenters
    .command("historical-access-requests")
    .description("Manage historical Trust Center access requests");

  addPaginationOptions(
    historicalAccessRequests
      .command("list")
      .description("List historical Trust Center access requests")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterHistoricalAccessRequests({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );
}
