import type { Command } from "commander";
import { listVendorQuestionnaires } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorQuestionnairesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorQuestionnaires = program
    .command("vendor-questionnaires")
    .description("Manage vendor questionnaires");

  addPaginationOptions(
    vendorQuestionnaires
      .command("list")
      .description("List vendor questionnaires"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listVendorQuestionnaires({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });
}
