import type { Command } from "commander";
import {
  listTrustCenterResourceCategories,
  addTrustCenterResourceCategory,
  updateTrustCenterResourceCategory,
  deleteTrustCenterResourceCategory,
  upsertTrustCenterResourceCategoriesOrder,
} from "../generated/sdk.gen.js";
import type {
  AddTrustCenterResourceCategoryData,
  UpdateTrustCenterResourceCategoryData,
  UpsertTrustCenterResourceCategoriesOrderData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterResourceCategoriesCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const resourceCategories = trustCenters
    .command("resource-categories")
    .description("Manage Trust Center resource categories");

  resourceCategories
    .command("list")
    .description("List Trust Center resource categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResourceCategories({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    resourceCategories
      .command("create")
      .description("Create a Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterResourceCategoryData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterResourceCategory({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    resourceCategories
      .command("update")
      .description("Update a Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Resource category ID"),
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
      )) as UpdateTrustCenterResourceCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterResourceCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
          body,
        }),
      );
    },
  );

  resourceCategories
    .command("delete")
    .description("Delete a Trust Center resource category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Resource category ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResourceCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    resourceCategories
      .command("set-order")
      .description("Reorder Trust Center resource categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterResourceCategoriesOrderData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterResourceCategoriesOrder({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });
}
