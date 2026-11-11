import type { Command } from "commander";
import {
  getVendorAlertSettings,
  updateVendorAlertSettings,
} from "../generated/sdk.gen.js";
import type { UpdateVendorAlertSettingsData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorAlertSettingsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorAlertSettings = program
    .command("vendor-alert-settings")
    .description("Manage vendor alert settings");

  vendorAlertSettings
    .command("get")
    .description("Get vendor alert settings")
    .action(async () => {
      await runSdk(getFlags, (api) =>
        getVendorAlertSettings({ client: api.client }),
      );
    });

  addJsonFileOptions(
    vendorAlertSettings
      .command("update")
      .description(
        'Update vendor alert settings with JSON {"changes":[{"category":"...","isEnabled":true}]} (omitted fields stay unchanged; use get for categories and current values)',
      ),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateVendorAlertSettingsData["body"];
    await runSdk(getFlags, (api) =>
      updateVendorAlertSettings({ client: api.client, body }),
    );
  });
}
