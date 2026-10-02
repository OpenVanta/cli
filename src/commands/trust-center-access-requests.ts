import type { Command } from "commander";
import {
  listTrustCenterAccessRequests,
  getTrustCenterAccessRequest,
  approveTrustCenterAccessRequest,
  denyTrustCenterAccessRequest,
} from "../generated/sdk.gen.js";
import type {
  ApproveTrustCenterAccessRequestData,
  DenyTrustCenterAccessRequestData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterAccessRequestsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const accessRequests = trustCenters
    .command("access-requests")
    .description("Manage Trust Center access requests");

  addPaginationOptions(
    accessRequests
      .command("list")
      .description("List Trust Center access requests")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterAccessRequests({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  accessRequests
    .command("get")
    .description("Get a Trust Center access request by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Access request ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    accessRequests
      .command("approve")
      .description("Approve a Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Access request ID"),
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
      )) as ApproveTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        approveTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.id },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    accessRequests
      .command("deny")
      .description("Deny a Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Access request ID"),
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
      )) as DenyTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        denyTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.id },
          body,
        }),
      );
    },
  );
}
