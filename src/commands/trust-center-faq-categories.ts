import type { Command } from "commander";
import {
  listTrustCenterFaqCategories,
  addTrustCenterFaqCategory,
  updateTrustCenterFaqCategory,
  deleteTrustCenterFaqCategory,
} from "../generated/sdk.gen.js";
import type {
  AddTrustCenterFaqCategoryData,
  UpdateTrustCenterFaqCategoryData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterFaqCategoriesCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const faqCategories = trustCenters
    .command("faq-categories")
    .description("Manage Trust Center FAQ categories");

  faqCategories
    .command("list")
    .description("List Trust Center FAQ categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterFaqCategories({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    faqCategories
      .command("create")
      .description("Create a Trust Center FAQ category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterFaqCategoryData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterFaqCategory({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    faqCategories
      .command("update")
      .description("Update a Trust Center FAQ category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "FAQ category ID"),
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
      )) as UpdateTrustCenterFaqCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterFaqCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
          body,
        }),
      );
    },
  );

  faqCategories
    .command("delete")
    .description("Delete a Trust Center FAQ category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "FAQ category ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaqCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.id },
        }),
      );
    });
}
