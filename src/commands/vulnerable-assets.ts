import type { Command } from "commander";
import {
  listVulnerableAssets,
  getVulnerableAsset,
} from "../generated/sdk.gen.js";
import type { ListVulnerableAssetsData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVulnerableAssetsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vulnerableAssets = program
    .command("vulnerable-assets")
    .description("Manage vulnerable assets");

  addPaginationOptions(
    vulnerableAssets
      .command("list")
      .description("List vulnerable assets")
      .option("--q <query>", "Filter vulnerable assets by search query")
      .option(
        "--integration-id <id>",
        "Filter vulnerable assets by specific vulnerability scanner",
      )
      .option(
        "--asset-type <type>",
        "Filter vulnerable assets by asset type: SERVER, SERVERLESS_FUNCTION, CONTAINER, CONTAINER_REPOSITORY, CONTAINER_REPOSITORY_IMAGE, CODE_REPOSITORY, MANIFEST_FILE, WORKSTATION, OTHER",
      )
      .option(
        "--asset-external-account-id <id>",
        "Filter vulnerable assets by external account ID",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      q?: string;
      integrationId?: string;
      assetType?: NonNullable<ListVulnerableAssetsData["query"]>["assetType"];
      assetExternalAccountId?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listVulnerableAssets({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            q: opts.q,
            integrationId: opts.integrationId,
            assetType: opts.assetType,
            assetExternalAccountId: opts.assetExternalAccountId,
          },
        }),
      );
    },
  );

  vulnerableAssets
    .command("get")
    .description("Get a vulnerable asset by ID")
    .requiredOption("--id <id>", "Vulnerable asset ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVulnerableAsset({
          client: api.client,
          path: { vulnerableAssetId: opts.id },
        }),
      );
    });
}
