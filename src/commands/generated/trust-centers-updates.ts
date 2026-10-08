import type { Command } from "commander";
import {
  listTrustCenterUpdates,
  getTrustCenterUpdate,
  createTrustCenterUpdate,
  updateTrustCenterUpdate,
  deleteTrustCenterUpdate,
  sendNotificationsToAllSubscribers,
  sendTrustCenterUpdateNotifications,
} from "../generated/sdk.gen.js";
import type {
  CreateTrustCenterUpdateData,
  UpdateTrustCenterUpdateData,
  SendTrustCenterUpdateNotificationsData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterUpdatesCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const updates = trustCenters
    .command("updates")
    .description("Manage Trust Center updates");

  addPaginationOptions(
    updates
      .command("list")
      .description("List Trust Center updates")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterUpdates({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  updates
    .command("get")
    .description("Get a Trust Center update by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Update ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    updates
      .command("create")
      .description("Create a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterUpdateData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterUpdate({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    updates
      .command("update")
      .description("Update a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Update ID"),
  ).action(
    async (opts: {
      slugId: string;
      id: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterUpdateData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.id },
          body,
        }),
      );
    },
  );

  updates
    .command("delete")
    .description("Delete a Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Update ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.id },
        }),
      );
    });

  updates
    .command("notify-all-subscribers")
    .description("Notify all subscribers about a Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Update ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        sendNotificationsToAllSubscribers({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    updates
      .command("notify-specific-subscribers")
      .description("Notify specific subscribers about a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Update ID"),
  ).action(
    async (opts: {
      slugId: string;
      id: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as SendTrustCenterUpdateNotificationsData["body"];
      await runSdk(getFlags, (api) =>
        sendTrustCenterUpdateNotifications({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.id },
          body,
        }),
      );
    },
  );
}
