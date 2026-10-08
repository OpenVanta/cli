import type { Command } from "commander";
import {
  listTrustCenterSubscriberGroups,
  getTrustCenterSubscriberGroup,
  createTrustCenterSubscriberGroup,
  updateTrustCenterSubscriberGroup,
  deleteTrustCenterSubscriberGroup,
} from "../generated/sdk.gen.js";
import type {
  CreateTrustCenterSubscriberGroupData,
  UpdateTrustCenterSubscriberGroupData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterSubscriberGroupsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const subscriberGroups = trustCenters
    .command("subscriber-groups")
    .description("Manage Trust Center subscriber groups");

  addPaginationOptions(
    subscriberGroups
      .command("list")
      .description("List Trust Center subscriber groups")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscriberGroups({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  subscriberGroups
    .command("get")
    .description("Get a Trust Center subscriber group by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subscriber group ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubscriberGroup({
          client: api.client,
          path: { slugId: opts.slugId, subscriberGroupId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    subscriberGroups
      .command("create")
      .description("Create a Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubscriberGroupData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubscriberGroup({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    subscriberGroups
      .command("update")
      .description("Update a Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Subscriber group ID"),
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
      )) as UpdateTrustCenterSubscriberGroupData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterSubscriberGroup({
          client: api.client,
          path: { slugId: opts.slugId, subscriberGroupId: opts.id },
          body,
        }),
      );
    },
  );

  subscriberGroups
    .command("delete")
    .description("Delete a Trust Center subscriber group")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subscriber group ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubscriberGroup({
          client: api.client,
          path: { slugId: opts.slugId, subscriberGroupId: opts.id },
        }),
      );
    });
}
