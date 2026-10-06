import type { Command } from "commander";
import {
  listTrustCenterControls,
  getTrustCenterControl,
  addControlToTrustCenter,
  deleteTrustCenterControl,
  bulkAddTagsToControls,
  bulkRemoveTagsFromControls,
} from "../generated/sdk.gen.js";
import type {
  AddControlToTrustCenterData,
  BulkAddTagsToControlsData,
  BulkRemoveTagsFromControlsData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterControlsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const controls = trustCenters
    .command("controls")
    .description("Manage Trust Center controls");

  addPaginationOptions(
    controls
      .command("list")
      .description("List Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterControls({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  controls
    .command("get")
    .description("Get a Trust Center control by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Control ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControl({
          client: api.client,
          path: { slugId: opts.slugId, controlId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("create")
      .description("Add a control to a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddControlToTrustCenterData["body"];
    await runSdk(getFlags, (api) =>
      addControlToTrustCenter({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  controls
    .command("delete")
    .description("Delete a Trust Center control")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Control ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControl({
          client: api.client,
          path: { slugId: opts.slugId, controlId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("add-tags")
      .description("Add tags to Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as BulkAddTagsToControlsData["body"];
    await runSdk(getFlags, (api) =>
      bulkAddTagsToControls({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    controls
      .command("remove-tags")
      .description("Remove tags from Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as BulkRemoveTagsFromControlsData["body"];
    await runSdk(getFlags, (api) =>
      bulkRemoveTagsFromControls({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });
}
