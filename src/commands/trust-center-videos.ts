import type { Command } from "commander";
import { upsertTrustCenterVideos } from "../generated/sdk.gen.js";
import type { UpsertTrustCenterVideosData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterVideosCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const videos = trustCenters
    .command("videos")
    .description("Manage Trust Center videos");

  addJsonFileOptions(
    videos
      .command("set")
      .description("Set Trust Center videos")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterVideosData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterVideos({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });
}
