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
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorAssessmentTypes = program
    .command("vendor-assessment-types")
    .description("Manage vendor assessment types");

  addPaginationOptions(
    vendorAssessmentTypes
      .command("list")
      .description("List vendor assessment types")
      .option(
        "--status <status>",
        "Filter assessment types to a single lifecycle status: ACTIVE, ARCHIVED",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      status?: NonNullable<ListVendorAssessmentTypesData["query"]>["status"];
    }) => {
      await runSdk(getFlags, (api) =>
        listVendorAssessmentTypes({
          client: api.client,
          query: { ...paginationQuery(opts), status: opts.status },
        }),
      );
    },
  );

  vendorAssessmentTypes
    .command("get")
    .description("Get a vendor assessment type by ID")
    .requiredOption("--id <id>", "Vendor assessment type ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendorAssessmentTypeById({
          client: api.client,
          path: { assessmentTypeId: opts.id },
        }),
      );
    });
}
