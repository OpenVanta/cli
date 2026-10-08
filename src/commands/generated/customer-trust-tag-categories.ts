import type { Command } from "commander";
import {
  listTagCategories,
  getTagsForCategory,
  addTagCategoryProductContext,
  removeTagCategoryProductContext,
} from "../generated/sdk.gen.js";
import type {
  ListTagCategoriesData,
  AddTagCategoryProductContextData,
  RemoveTagCategoryProductContextData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  collectString,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerCustomerTrustTagCategoriesCommand(
  customerTrust: Command,
  getFlags: GetFlags,
): void {
  const tagCategories = customerTrust
    .command("tag-categories")
    .description("Manage Customer Trust tag categories");

  tagCategories
    .command("list")
    .description("List tag categories")
    .option(
      "--product-context-ids-matches-any <product>",
      "Filter by product context: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING, QUESTIONNAIRE (repeatable)",
      collectString,
      [] as string[],
    )
    .action(async (opts: NonNullable<ListTagCategoriesData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTagCategories({
          client: api.client,
          query: {
            productContextIdsMatchesAny: opts.productContextIdsMatchesAny,
          },
        }),
      );
    });

  tagCategories
    .command("get")
    .description("Get the tags in a tag category by ID")
    .requiredOption("--id <id>", "Tag category ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getTagsForCategory({
          client: api.client,
          path: { tagCategoryId: opts.id },
        }),
      );
    });

  const productContexts = tagCategories
    .command("product-contexts")
    .description("Manage the product contexts a tag category is enabled for");

  addJsonFileOptions(
    productContexts
      .command("add")
      .description("Enable a tag category for a product context")
      .requiredOption("--tag-category-id <id>", "Tag category ID"),
  ).action(
    async (opts: { tagCategoryId: string; json?: string; file?: string }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as AddTagCategoryProductContextData["body"];
      await runSdk(getFlags, (api) =>
        addTagCategoryProductContext({
          client: api.client,
          path: { tagCategoryId: opts.tagCategoryId },
          body,
        }),
      );
    },
  );

  productContexts
    .command("delete")
    .description("Disable a tag category for a product context")
    .requiredOption("--tag-category-id <id>", "Tag category ID")
    .requiredOption(
      "--product-context-id <product>",
      "Product context: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING",
    )
    .action(
      async (opts: {
        tagCategoryId: string;
        productContextId: RemoveTagCategoryProductContextData["path"]["productContextId"];
      }) => {
        await runSdk(getFlags, (api) =>
          removeTagCategoryProductContext({
            client: api.client,
            path: {
              tagCategoryId: opts.tagCategoryId,
              productContextId: opts.productContextId,
            },
          }),
        );
      },
    );
}
