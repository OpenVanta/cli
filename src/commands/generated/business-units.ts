import type { Command } from "commander";
import { listBusinessUnits, getBusinessUnit } from "../generated/sdk.gen.js";
import type { ListBusinessUnitsData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerBusinessUnitsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const businessUnits = program
    .command("business-units")
    .description("Manage business units");

  addPaginationOptions(
    businessUnits.command("list").description("List business units"),
  ).action(async (opts: NonNullable<ListBusinessUnitsData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listBusinessUnits({
        client: api.client,
        query: {
          ...paginationQuery(opts),
        },
      }),
    );
  });

  businessUnits
    .command("get")
    .description("Get a business unit by ID")
    .requiredOption("--id <id>", "Business unit ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getBusinessUnit({
          client: api.client,
          path: { businessUnitId: opts.id },
        }),
      );
    });
}
