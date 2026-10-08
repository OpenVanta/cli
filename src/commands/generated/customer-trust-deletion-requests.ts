import type { Command } from "commander";
import { createDeletionRequest } from "../generated/sdk.gen.js";
import type { CreateDeletionRequestData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerCustomerTrustDeletionRequestsCommand(
  customerTrust: Command,
  getFlags: GetFlags,
): void {
  const deletionRequests = customerTrust
    .command("deletion-requests")
    .description("Manage Customer Trust data deletion requests");

  addJsonFileOptions(
    deletionRequests
      .command("create")
      .description("Create a data deletion request"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateDeletionRequestData["body"];
    await runSdk(getFlags, (api) =>
      createDeletionRequest({ client: api.client, body }),
    );
  });
}
