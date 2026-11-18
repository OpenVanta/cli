import type { Command } from "commander";
import { listRiskRegisters, getRiskRegister } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerRiskRegistersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const riskRegisters = program
    .command("risk-registers")
    .description("Manage risk registers");

  addPaginationOptions(
    riskRegisters.command("list").description("List risk registers"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listRiskRegisters({ client: api.client, query: paginationQuery(opts) }),
    );
  });

  riskRegisters
    .command("get")
    .description("Get a risk register by ID")
    .requiredOption("--id <id>", "Risk register ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getRiskRegister({
          client: api.client,
          path: { riskRegisterId: opts.id },
        }),
      );
    });
}
