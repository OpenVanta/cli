import type { Command } from "commander";
import { listTrustCenterActivityEvents } from "../generated/sdk.gen.js";
import type { ActivityEventType } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  collectString,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterActivityCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const activity = trustCenters
    .command("activity")
    .description("Manage Trust Center viewer activity");

  addPaginationOptions(
    activity
      .command("list")
      .description("List Trust Center viewer activity events")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--event-types-matches-any <type>",
        "Event types to filter by: PAGE_VIEW, RESOURCE_DOWNLOAD, RESOURCE_VIEW, VIDEO_PLAY (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--after-date <timestamp>",
        "Only include activity events that occurred on or after the specified date and time, as an ISO 8601 timestamp.",
      )
      .option(
        "--before-date <timestamp>",
        "Only include activity events that occurred before the specified date and time, as an ISO 8601 timestamp.",
      ),
  ).action(
    async (opts: {
      slugId: string;
      eventTypesMatchesAny: string[];
      afterDate?: string;
      beforeDate?: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterActivityEvents({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            eventTypesMatchesAny:
              opts.eventTypesMatchesAny as ActivityEventType[],
            afterDate: opts.afterDate,
            beforeDate: opts.beforeDate,
          },
        }),
      );
    },
  );
}
