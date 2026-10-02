import type { Command } from "commander";
import {
  listTrustCenterSubscribers,
  getTrustCenterSubscriber,
  createTrustCenterSubscriber,
  deleteTrustCenterSubscriber,
  upsertGroupsForTrustCenterSubscriber,
} from "../generated/sdk.gen.js";
import type {
  CreateTrustCenterSubscriberData,
  UpsertGroupsForTrustCenterSubscriberData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterSubscribersCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const subscribers = trustCenters
    .command("subscribers")
    .description("Manage Trust Center subscribers");

  addPaginationOptions(
    subscribers
      .command("list")
      .description("List Trust Center subscribers")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option("--customer-trust-account-id <id>", "Customer Trust account ID"),
  ).action(
    async (opts: {
      slugId: string;
      customerTrustAccountId?: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscribers({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            customerTrustAccountId: opts.customerTrustAccountId,
          },
        }),
      );
    },
  );

  subscribers
    .command("get")
    .description("Get a Trust Center subscriber by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subscriber ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    subscribers
      .command("create")
      .description("Create a Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubscriberData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubscriber({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  subscribers
    .command("delete")
    .description("Delete a Trust Center subscriber")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subscriber ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.id },
        }),
      );
    });

  const subscribersGroups = subscribers
    .command("groups")
    .description("Manage a Trust Center subscriber's groups");

  addJsonFileOptions(
    subscribersGroups
      .command("set")
      .description("Set the groups for a Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subscriber-id <id>", "Subscriber ID"),
  ).action(
    async (opts: {
      slugId: string;
      subscriberId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpsertGroupsForTrustCenterSubscriberData["body"];
      await runSdk(getFlags, (api) =>
        upsertGroupsForTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.subscriberId },
          body,
        }),
      );
    },
  );
}
