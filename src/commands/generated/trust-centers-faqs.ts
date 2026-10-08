import type { Command } from "commander";
import {
  listTrustCenterFaqs,
  getTrustCenterFaq,
  createTrustCenterFaq,
  updateTrustCenterFaq,
  deleteTrustCenterFaq,
} from "../generated/sdk.gen.js";
import type {
  CreateTrustCenterFaqData,
  UpdateTrustCenterFaqData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterFaqsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const faqs = trustCenters
    .command("faqs")
    .description("Manage Trust Center FAQs");

  faqs
    .command("list")
    .description("List Trust Center FAQs")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterFaqs({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  faqs
    .command("get")
    .description("Get a Trust Center FAQ by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "FAQ ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterFaq({
          client: api.client,
          path: { slugId: opts.slugId, faqId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    faqs
      .command("create")
      .description("Create a Trust Center FAQ")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterFaqData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterFaq({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    faqs
      .command("update")
      .description("Update a Trust Center FAQ")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "FAQ ID"),
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
      )) as UpdateTrustCenterFaqData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterFaq({
          client: api.client,
          path: { slugId: opts.slugId, faqId: opts.id },
          body,
        }),
      );
    },
  );

  faqs
    .command("delete")
    .description("Delete a Trust Center FAQ")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "FAQ ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaq({
          client: api.client,
          path: { slugId: opts.slugId, faqId: opts.id },
        }),
      );
    });
}
