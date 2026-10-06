import type { Command } from "commander";
import {
  listTrustCenterDataCollected,
  upsertTrustCenterDataCollected,
} from "../generated/sdk.gen.js";
import type {
  UpsertTrustCenterDataCollectedData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterDataCollectedCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const dataCollected = trustCenters
    .command("data-collected")
    .description("Manage Trust Center data collected");

  dataCollected
    .command("list")
    .description("List Trust Center data collected")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterDataCollected({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    dataCollected
      .command("set")
      .description("Set Trust Center data collected")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterDataCollectedData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterDataCollected({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });
}
