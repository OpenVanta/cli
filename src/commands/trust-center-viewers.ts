import type { Command } from "commander";
import {
  listTrustCenterViewers,
  getTrustCenterViewer,
  addTrustCenterViewer,
  updateTrustCenterViewer,
  removeTrustCenterViewer,
  sendTrustCenterViewerInviteReminder,
} from "../generated/sdk.gen.js";
import type {
  AddTrustCenterViewerData,
  UpdateTrustCenterViewerData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  parseOptionalBoolString,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterViewersCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const viewers = trustCenters
    .command("viewers")
    .description("Manage Trust Center viewers");

  addPaginationOptions(
    viewers
      .command("list")
      .description("List Trust Center viewers")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--include-removed <boolean>",
        "Include removed viewers (true/false; default: true)",
        (value) => parseOptionalBoolString(value, "include-removed"),
      ),
  ).action(
    async (opts: {
      slugId: string;
      includeRemoved?: boolean;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterViewers({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            includeRemoved: opts.includeRemoved,
          },
        }),
      );
    },
  );

  viewers
    .command("get")
    .description("Get a Trust Center viewer by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    viewers
      .command("create")
      .description("Add a Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterViewerData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterViewer({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    viewers
      .command("update")
      .description("Update a Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Viewer ID"),
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
      )) as UpdateTrustCenterViewerData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.id },
          body,
        }),
      );
    },
  );

  viewers
    .command("delete")
    .description("Remove a Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        removeTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.id },
        }),
      );
    });

  viewers
    .command("send-invite-reminder")
    .description("Send an invite reminder to a Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        sendTrustCenterViewerInviteReminder({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.id },
        }),
      );
    });
}
