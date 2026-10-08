import type { Command } from "commander";
import {
  getTrustCenterControlCategories,
  getTrustCenterControlCategory,
  addTrustCenterControlCategory,
  updateTrustCenterControlCategory,
  deleteTrustCenterControlCategory,
  upsertTrustCenterControlCategoriesOrder,
  updateTrustCenterControlsInCategory,
  upsertTrustCenterControlsInCategoryOrder,
} from "../generated/sdk.gen.js";
import type {
  AddTrustCenterControlCategoryData,
  UpdateTrustCenterControlCategoryData,
  UpsertTrustCenterControlCategoriesOrderData,
  UpdateTrustCenterControlsInCategoryData,
  UpsertTrustCenterControlsInCategoryOrderData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterControlCategoriesCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const controlCategories = trustCenters
    .command("control-categories")
    .description("Manage Trust Center control categories");

  controlCategories
    .command("list")
    .description("List Trust Center control categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategories({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  controlCategories
    .command("get")
    .description("Get a Trust Center control category by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Control category ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    controlCategories
      .command("create")
      .description("Create a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterControlCategoryData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterControlCategory({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    controlCategories
      .command("update")
      .description("Update a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Control category ID"),
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
      )) as UpdateTrustCenterControlCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
          body,
        }),
      );
    },
  );

  controlCategories
    .command("delete")
    .description("Delete a Trust Center control category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Control category ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    controlCategories
      .command("set-order")
      .description("Reorder Trust Center control categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterControlCategoriesOrderData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterControlCategoriesOrder({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  const controlCategoriesControls = controlCategories
    .command("controls")
    .description("Manage controls in a Trust Center control category");

  addJsonFileOptions(
    controlCategoriesControls
      .command("update")
      .description("Add or remove controls in a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Control category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterControlsInCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlsInCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    controlCategoriesControls
      .command("set-order")
      .description("Reorder controls in a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Control category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpsertTrustCenterControlsInCategoryOrderData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterControlsInCategoryOrder({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );
}
