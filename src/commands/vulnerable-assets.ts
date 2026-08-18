import type { Command } from "commander";
import {
  getVulnerableAsset,
  listVulnerableAssets,
} from "../generated/sdk.gen.js";
import type { VulnerableAssetType } from "../generated/types.gen.js";
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
        "Filter vulnerable assets by vulnerability scanner integration ID",
      )
      .option(
        "--asset-type <type>",
        "Filter vulnerable assets by asset type (CODE_REPOSITORY, CONTAINER_REPOSITORY, CONTAINER_REPOSITORY_IMAGE, MANIFEST_FILE, SERVER, SERVERLESS_FUNCTION, WORKSTATION)",
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
      assetType?: string;
      assetExternalAccountId?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listVulnerableAssets({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.q?.trim() ? { q: opts.q.trim() } : {}),
            ...(opts.integrationId?.trim()
              ? { integrationId: opts.integrationId.trim() }
              : {}),
            ...(opts.assetType?.trim()
              ? { assetType: opts.assetType.trim() as VulnerableAssetType }
              : {}),
            ...(opts.assetExternalAccountId?.trim()
              ? { assetExternalAccountId: opts.assetExternalAccountId.trim() }
              : {}),
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
