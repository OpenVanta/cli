import type { Command } from "commander";
import {
  listVendorCategories,
  getVendorCategoryById,
  createVendorCategory,
  updateVendorCategory,
  deleteVendorCategory,
} from "../generated/sdk.gen.js";
import type {
  CreateVendorCategoryData,
  UpdateVendorCategoryData,
  DeleteVendorCategoryData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorCategoriesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorCategories = program
    .command("vendor-categories")
    .description("Manage vendor categories");

  addPaginationOptions(
    vendorCategories.command("list").description("List vendor categories"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listVendorCategories({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });

  vendorCategories
    .command("get")
    .description("Get a vendor category by ID")
    .requiredOption("--id <id>", "Vendor category ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendorCategoryById({
          client: api.client,
          path: { categoryId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    vendorCategories.command("create").description("Create a vendor category"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateVendorCategoryData["body"];
    await runSdk(getFlags, (api) =>
      createVendorCategory({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    vendorCategories
      .command("update")
      .description("Update a vendor category")
      .requiredOption("--id <id>", "Vendor category ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateVendorCategoryData["body"];
    await runSdk(getFlags, (api) =>
      updateVendorCategory({
        client: api.client,
        path: { categoryId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    vendorCategories
      .command("delete")
      .description("Delete a vendor category")
      .requiredOption("--id <id>", "Vendor category ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as DeleteVendorCategoryData["body"];
    await runSdk(getFlags, (api) =>
      deleteVendorCategory({
        client: api.client,
        path: { categoryId: opts.id },
        body,
      }),
    );
  });
}
