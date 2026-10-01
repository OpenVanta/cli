import type { Command } from "commander";
import { listVendorRiskAttributes } from "../generated/sdk.gen.js";
import type { ListVendorRiskAttributesData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorRiskAttributesCommand(
  vendors: Command,
  getFlags: GetFlags,
): void {
  const vendorRiskAttributes = vendors
    .command("risk-attributes")
    .description("Manage vendor risk attributes");

  addPaginationOptions(
    vendorRiskAttributes.command("list").description("List vendor risk attributes"),
  ).action(async (opts: NonNullable<ListVendorRiskAttributesData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listVendorRiskAttributes({
        client: api.client,
        query: {
          ...paginationQuery(opts),
        },
      }),
    );
  });
}
