import type { Command } from "commander";
import {
  listFourthParties,
  listFourthPartyVendors,
} from "../generated/sdk.gen.js";
import type {
  ListFourthPartiesData,
  ListFourthPartyVendorsData,
} from "../generated/types.gen.js";
import {
  addPaginationOptions,
  collectString,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerFourthPartiesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const fourthParties = program
    .command("fourth-parties")
    .description("Manage fourth parties");

  addPaginationOptions(
    fourthParties
      .command("list")
      .description("List fourth parties")
      .option(
        "--used-by-vendor-id-matches-any <id>",
        "Select fourth parties used by any of these vendor IDs from `vendors list`, after risk filtering; counts still include all remaining vendors (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--residual-risk-level-matches-any <level>",
        "Filter dependent vendors by residual risk level: CRITICAL, HIGH, LOW, MEDIUM, UNSCORED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--inherent-risk-level-matches-any <level>",
        "Filter dependent vendors by inherent risk level; combines with residual risk using AND: CRITICAL, HIGH, LOW, MEDIUM, UNSCORED (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      usedByVendorIdMatchesAny: string[];
      residualRiskLevelMatchesAny: NonNullable<
        NonNullable<
          ListFourthPartiesData["query"]
        >["residualRiskLevelMatchesAny"]
      >;
      inherentRiskLevelMatchesAny: NonNullable<
        NonNullable<
          ListFourthPartiesData["query"]
        >["inherentRiskLevelMatchesAny"]
      >;
    }) => {
      await runSdk(getFlags, (api) =>
        listFourthParties({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            usedByVendorIdMatchesAny: opts.usedByVendorIdMatchesAny,
            residualRiskLevelMatchesAny: opts.residualRiskLevelMatchesAny,
            inherentRiskLevelMatchesAny: opts.inherentRiskLevelMatchesAny,
          },
        }),
      );
    },
  );

  addPaginationOptions(
    fourthParties
      .command("list-vendors")
      .description("List vendors for a fourth party")
      .requiredOption("--id <id>", "Fourth party ID from `fourth-parties list`")
      .option(
        "--residual-risk-level-matches-any <level>",
        "Filter dependent vendors by residual risk level: CRITICAL, HIGH, LOW, MEDIUM, UNSCORED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--inherent-risk-level-matches-any <level>",
        "Filter dependent vendors by inherent risk level; combines with residual risk using AND: CRITICAL, HIGH, LOW, MEDIUM, UNSCORED (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
      residualRiskLevelMatchesAny: NonNullable<
        NonNullable<
          ListFourthPartyVendorsData["query"]
        >["residualRiskLevelMatchesAny"]
      >;
      inherentRiskLevelMatchesAny: NonNullable<
        NonNullable<
          ListFourthPartyVendorsData["query"]
        >["inherentRiskLevelMatchesAny"]
      >;
    }) => {
      await runSdk(getFlags, (api) =>
        listFourthPartyVendors({
          client: api.client,
          path: { fourthPartyId: opts.id },
          query: {
            ...paginationQuery(opts),
            residualRiskLevelMatchesAny: opts.residualRiskLevelMatchesAny,
            inherentRiskLevelMatchesAny: opts.inherentRiskLevelMatchesAny,
          },
        }),
      );
    },
  );
}
