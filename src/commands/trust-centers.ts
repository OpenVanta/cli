import type { Command } from "commander";
import { registerTrustCenterAccessRequestsCommand } from "./trust-center-access-requests.js";
import { registerTrustCenterActivityCommand } from "./trust-center-activity.js";
import { registerTrustCenterChatbotCommand } from "./trust-center-chatbot.js";
import { registerTrustCenterComplianceFrameworksCommand } from "./trust-center-compliance-frameworks.js";
import { registerTrustCenterControlCategoriesCommand } from "./trust-center-control-categories.js";
import { registerTrustCenterControlsCommand } from "./trust-center-controls.js";
import { registerTrustCenterDataCollectedCommand } from "./trust-center-data-collected.js";
import { registerTrustCenterFaqCategoriesCommand } from "./trust-center-faq-categories.js";
import { registerTrustCenterFaqsCommand } from "./trust-center-faqs.js";
import { registerTrustCenterHistoricalAccessRequestsCommand } from "./trust-center-historical-access-requests.js";
import { registerTrustCenterResourceCategoriesCommand } from "./trust-center-resource-categories.js";
import { registerTrustCenterResourcesCommand } from "./trust-center-resources.js";
import { registerTrustCenterSubprocessorsCommand } from "./trust-center-subprocessors.js";
import { registerTrustCenterSubscriberGroupsCommand } from "./trust-center-subscriber-groups.js";
import { registerTrustCenterSubscribersCommand } from "./trust-center-subscribers.js";
import { registerTrustCenterUpdatesCommand } from "./trust-center-updates.js";
import { registerTrustCenterVideosCommand } from "./trust-center-videos.js";
import { registerTrustCenterViewersCommand } from "./trust-center-viewers.js";
import {
  getTrustCenter,
  updateTrustCenter,
  uploadTrustCenterFavicon,
} from "../generated/sdk.gen.js";
import type { UpdateTrustCenterData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCentersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const trustCenters = program
    .command("trust-centers")
    .description("Manage Trust Centers");

  registerTrustCenterAccessRequestsCommand(trustCenters, getFlags);

  registerTrustCenterActivityCommand(trustCenters, getFlags);

  registerTrustCenterChatbotCommand(trustCenters, getFlags);

  registerTrustCenterComplianceFrameworksCommand(trustCenters, getFlags);

  registerTrustCenterControlCategoriesCommand(trustCenters, getFlags);

  registerTrustCenterControlsCommand(trustCenters, getFlags);

  registerTrustCenterDataCollectedCommand(trustCenters, getFlags);

  registerTrustCenterFaqCategoriesCommand(trustCenters, getFlags);

  registerTrustCenterFaqsCommand(trustCenters, getFlags);

  registerTrustCenterHistoricalAccessRequestsCommand(trustCenters, getFlags);

  registerTrustCenterResourceCategoriesCommand(trustCenters, getFlags);

  registerTrustCenterResourcesCommand(trustCenters, getFlags);

  registerTrustCenterSubprocessorsCommand(trustCenters, getFlags);

  registerTrustCenterSubscriberGroupsCommand(trustCenters, getFlags);

  registerTrustCenterSubscribersCommand(trustCenters, getFlags);

  registerTrustCenterUpdatesCommand(trustCenters, getFlags);

  registerTrustCenterVideosCommand(trustCenters, getFlags);

  registerTrustCenterViewersCommand(trustCenters, getFlags);

  trustCenters
    .command("get")
    .description("Get a Trust Center by slug ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenter({ client: api.client, path: { slugId: opts.slugId } }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update")
      .description("Update a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateTrustCenterData["body"];
    await runSdk(getFlags, (api) =>
      updateTrustCenter({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("upload-favicon")
    .description("Upload a Trust Center favicon")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--favicon <path>", "Path to favicon file to upload")
    .action(async (opts: { slugId: string; favicon: string }) => {
      const favicon = await readBinaryFile(opts.favicon);
      await runSdk(getFlags, (api) =>
        uploadTrustCenterFavicon({
          client: api.client,
          path: { slugId: opts.slugId },
          body: { favicon },
        }),
      );
    });
}
