import type { Command } from "commander";
import { listVendorDocumentTypes } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorDocumentTypesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorDocumentTypes = program
    .command("vendor-document-types")
    .description("Manage vendor document types");

  addPaginationOptions(
    vendorDocumentTypes
      .command("list")
      .description("List vendor document types"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listVendorDocumentTypes({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });
}
