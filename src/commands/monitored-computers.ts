import type { Command } from "commander";
import {
  listMonitoredComputers,
  getMonitoredComputer,
} from "../generated/sdk.gen.js";
import type { ListMonitoredComputersData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  collectString,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerMonitoredComputersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const monitoredComputers = program
    .command("monitored-computers")
    .description("Manage monitored computers");

  addPaginationOptions(
    monitoredComputers
      .command("list")
      .description("List monitored computers")
      .option(
        "--compliance-status-filter-matches-any <status>",
        "Filters for monitored computers matching any status declared in the filter: PWM_NOT_INSTALLED, HD_NOT_ENCRYPTED, AV_NOT_INSTALLED, SCREENLOCK_NOT_CONFIGURED, LAST_CHECK_OVER_14_DAYS (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      complianceStatusFilterMatchesAny: NonNullable<NonNullable<ListMonitoredComputersData["query"]>["complianceStatusFilterMatchesAny"]>;
    }) => {
      await runSdk(getFlags, (api) =>
        listMonitoredComputers({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            complianceStatusFilterMatchesAny: opts.complianceStatusFilterMatchesAny,
          },
        }),
      );
    },
  );

  monitoredComputers
    .command("get")
    .description("Get a monitored computer by ID")
    .requiredOption("--id <id>", "Monitored computer ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getMonitoredComputer({
          client: api.client,
          path: { computerId: opts.id },
        }),
      );
    });
}
