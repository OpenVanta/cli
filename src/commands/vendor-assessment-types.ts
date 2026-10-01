import type { Command } from "commander";
import {
  listVendorAssessmentTypes,
  getVendorAssessmentTypeById,
} from "../generated/sdk.gen.js";
import type { ListVendorAssessmentTypesData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorAssessmentTypesCommand(
  vendors: Command,
  getFlags: GetFlags,
): void {
  const vendorAssessmentTypes = vendors
    .command("assessment-types")
    .description("Manage vendor assessment types");

  addPaginationOptions(
    vendorAssessmentTypes
      .command("list")
      .description("List vendor assessment types")
      .option(
        "--status <status>",
        "Filter by lifecycle status: ACTIVE, ARCHIVED",
      ),
  ).action(async (opts: NonNullable<ListVendorAssessmentTypesData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listVendorAssessmentTypes({
        client: api.client,
        query: {
          ...paginationQuery(opts),
          status: opts.status,
        },
      }),
    );
  });

  vendorAssessmentTypes
    .command("get")
    .description("Get a vendor assessment type by ID")
    .requiredOption("--id <id>", "Assessment type ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendorAssessmentTypeById({
          client: api.client,
          path: { assessmentTypeId: opts.id },
        }),
      );
    });
}
