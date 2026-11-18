import type { Command } from "commander";
import { getRiskSettings } from "../generated/sdk.gen.js";
import { runSdk, type GetFlags } from "./helpers.js";

export function registerRiskSettingsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const riskSettings = program
    .command("risk-settings")
    .description("Manage risk settings");

  riskSettings
    .command("get")
    .description("Get risk scoring stages, categories, and custom fields")
    .action(async () => {
      await runSdk(getFlags, (api) => getRiskSettings({ client: api.client }));
    });
}
