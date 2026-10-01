import type { Command } from "commander";
import { getSettings, updateSettings } from "../generated/sdk.gen.js";
import type { UpdateSettingsData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerPersonnelNotificationSettingsCommand(
  people: Command,
  getFlags: GetFlags,
): void {
  const personnelNotificationSettings = people
    .command("notification-settings")
    .description("Manage personnel notification settings");

  personnelNotificationSettings
    .command("get")
    .description("Get personnel notification settings")
    .action(async () => {
      await runSdk(getFlags, (api) =>
        getSettings({ client: api.client }),
      );
    });

  addJsonFileOptions(
    personnelNotificationSettings
      .command("update")
      .description("Update personnel notification settings"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateSettingsData["body"];
    await runSdk(getFlags, (api) =>
      updateSettings({
        client: api.client,
        body,
      }),
    );
  });
}
