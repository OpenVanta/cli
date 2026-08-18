import type { Command } from "commander";
import { listEventLogs } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerEventLogsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const eventLogs = program
    .command("event-logs")
    .description("Manage event logs");

  addPaginationOptions(
    eventLogs.command("list").description("List event logs"),
  )
    .option(
      "--start-date <date>",
      "Filter to event logs created at or after this timestamp",
    )
    .action(async (opts: { pageSize?: number; pageCursor?: string; startDate?: string }) => {
      await runSdk(getFlags, (api) =>
        listEventLogs({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.startDate?.trim()
              ? { startDate: opts.startDate.trim() }
              : {}),
          },
        }),
      );
    });
}
