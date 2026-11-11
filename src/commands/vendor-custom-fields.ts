import type { Command } from "commander";
import { listVendorCustomFieldDefinitions } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorCustomFieldsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorCustomFields = program
    .command("vendor-custom-fields")
    .description("Manage vendor custom fields");

  addPaginationOptions(
    vendorCustomFields.command("list").description("List vendor custom fields"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listVendorCustomFieldDefinitions({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });
}
