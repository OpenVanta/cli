import type { Command } from "commander";
import { printResponse } from "../output.js";
import {
  listTrustCenterResources,
  getTrustCenterResource,
  createTrustCenterResource,
  updateTrustCenterResource,
  deleteTrustCenterResource,
  getTrustCenterResourceMedia,
} from "../generated/sdk.gen.js";
import type { UpdateTrustCenterResourceData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  withClient,
  writeDownloadedMedia,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterResourcesCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const resources = trustCenters
    .command("resources")
    .description("Manage Trust Center resources (documents)");

  resources
    .command("list")
    .description("List Trust Center documents")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResources({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  resources
    .command("get")
    .description("Get a Trust Center document by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Document ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterResource({
          client: api.client,
          path: { slugId: opts.slugId, resourceId: opts.id },
        }),
      );
    });

  resources
    .command("create")
    .description("Create a Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--title <text>", "Title of the Trust Center document.")
    .requiredOption(
      "--is-public <boolean>",
      "Whether the document is publicly available (true/false)",
    )
    .option("--description <text>", "Description of the uploaded document.")
    .action(
      async (opts: {
        slugId: string;
        file: string;
        title: string;
        isPublic: string;
        description?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          createTrustCenterResource({
            client: api.client,
            path: { slugId: opts.slugId },
            body: {
              file,
              title: opts.title,
              isPublic: opts.isPublic,
              description: opts.description,
            },
          }),
        );
      },
    );

  addJsonFileOptions(
    resources
      .command("update")
      .description("Update a Trust Center document")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Document ID"),
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
      )) as UpdateTrustCenterResourceData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterResource({
          client: api.client,
          path: { slugId: opts.slugId, resourceId: opts.id },
          body,
        }),
      );
    },
  );

  resources
    .command("delete")
    .description("Delete a Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Document ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResource({
          client: api.client,
          path: { slugId: opts.slugId, resourceId: opts.id },
        }),
      );
    });

  resources
    .command("get-media")
    .description("Download the uploaded file for a Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Document ID")
    .option(
      "--output <path>",
      "Write downloaded bytes to file path (default stdout)",
    )
    .action(async (opts: { slugId: string; id: string; output?: string }) => {
      await withClient(getFlags, async (api, flags) => {
        const result = await getTrustCenterResourceMedia({
          client: api.client,
          parseAs: "blob",
          path: { slugId: opts.slugId, resourceId: opts.id },
        });
        if (result.error) throw result.error;
        const dest = opts.output?.trim();
        await writeDownloadedMedia(result.data, dest);
        if (dest) printResponse({ savedTo: dest }, flags);
      });
    });
}
