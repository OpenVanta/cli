import type { Command } from "commander";
import {
  listKnowledgeBaseResources,
  createDocumentResource,
  updateDocumentResource,
  replaceDocumentResourceFile,
  createWebpageResource,
  updateWebpageResource,
  getKnowledgeBaseResource,
  deleteKnowledgeBaseResource,
  verifyKnowledgeBaseResource,
} from "../generated/sdk.gen.js";
import type {
  ListKnowledgeBaseResourcesData,
  UpdateDocumentResourceData,
  CreateWebpageResourceData,
  UpdateWebpageResourceData,
  VerifyKnowledgeBaseResourceData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerKnowledgeBaseResourcesCommand(
  knowledgeBase: Command,
  getFlags: GetFlags,
): void {
  const resources = knowledgeBase
    .command("resources")
    .description("Manage Knowledge Base resources");

  addPaginationOptions(
    resources
      .command("list")
      .description("List Knowledge Base resources")
      .option("--q <query>", "Full-text search across resource titles.")
      .option(
        "--type-matches-any <type>",
        "Filter by resource type: FILE, URL (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--last-updated-after <timestamp>",
        "Only include resources updated at or after this ISO 8601 timestamp.",
      )
      .option(
        "--last-updated-before <timestamp>",
        "Only include resources updated at or before this ISO 8601 timestamp.",
      )
      .option(
        "--matches-tags <json>",
        "JSON-encoded array of `{categoryId, tagId}` pairs. Tags within the same category are OR'd together; tags across different categories are AND'd. For example, passing two tags from \"Framework\" and one tag from \"Region\" matches resources that have either of the two frameworks AND the given region. Find category IDs with `vanta customer-trust tag-categories list` and tag IDs with `vanta customer-trust tag-categories get --id <id>`.",
      )
      .option(
        "--expires-before <timestamp>",
        "Only include resources expiring at or before this ISO 8601 timestamp.",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include resources expiring at or after this ISO 8601 timestamp.",
      ),
  ).action(
    async (opts: NonNullable<ListKnowledgeBaseResourcesData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listKnowledgeBaseResources({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            q: opts.q,
            typeMatchesAny: opts.typeMatchesAny,
            lastUpdatedAfter: opts.lastUpdatedAfter,
            lastUpdatedBefore: opts.lastUpdatedBefore,
            matchesTags: opts.matchesTags,
            expiresBefore: opts.expiresBefore,
            expiresAfter: opts.expiresAfter,
          },
        }),
      );
    },
  );

  resources
    .command("get")
    .description("Get a Knowledge Base resource by ID")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getKnowledgeBaseResource({
          client: api.client,
          path: { id: opts.id },
        }),
      );
    });

  resources
    .command("delete")
    .description("Delete a Knowledge Base resource")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteKnowledgeBaseResource({
          client: api.client,
          path: { id: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    resources
      .command("verify")
      .description("Verify a Knowledge Base resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as VerifyKnowledgeBaseResourceData["body"];
    await runSdk(getFlags, (api) =>
      verifyKnowledgeBaseResource({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });

  resources
    .command("create-document")
    .description("Create a document resource")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--title <title>", "Title of the document resource.")
    .option("--description <text>", "Description of the document resource.")
    .option(
      "--owner-assignment <json>",
      "Owner to assign as a JSON string: {\"type\":\"User\",\"id\":\"<id>\"}.",
    )
    .option(
      "--customer-visibility <visibility>",
      "Customer visibility on the Trust Center: PRIVATE | SHAREABLE | REQUEST_ACCESS | PUBLIC.",
    )
    .option(
      "--download-permission <permission>",
      "Trust Center download permission: VIEW_ONLY | VIEW_AND_DOWNLOAD.",
    )
    .option(
      "--is-used-in-questionnaires <bool>",
      "Whether to use this resource for Questionnaire Automation answer generation (true/false)",
    )
    .option(
      "--expiration-date <timestamp>",
      "Expiration date in ISO 8601 timestamp.",
    )
    .option(
      "--tags <json>",
      "Tags as a JSON array: [{\"categoryId\":\"<id>\",\"tagId\":\"<id>\"}].",
    )
    .option(
      "--category-id <id>",
      "Trust Center category id to associate this resource with. Only applied when --customer-visibility is REQUEST_ACCESS or PUBLIC; otherwise ignored. Unknown IDs leave the resource uncategorized.",
    )
    .action(
      async (opts: {
        file: string;
        title: string;
        description?: string;
        ownerAssignment?: string;
        customerVisibility?: string;
        downloadPermission?: string;
        isUsedInQuestionnaires?: string;
        expirationDate?: string;
        tags?: string;
        categoryId?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          createDocumentResource({
            client: api.client,
            body: {
              file,
              title: opts.title,
              description: opts.description,
              ownerAssignment: opts.ownerAssignment,
              customerVisibility: opts.customerVisibility,
              downloadPermission: opts.downloadPermission,
              isUsedInQuestionnaires: opts.isUsedInQuestionnaires,
              expirationDate: opts.expirationDate,
              tags: opts.tags,
              categoryId: opts.categoryId,
            },
          }),
        );
      },
    );

  addJsonFileOptions(
    resources
      .command("update-document")
      .description("Update a document resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateDocumentResourceData["body"];
    await runSdk(getFlags, (api) =>
      updateDocumentResource({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });

  resources
    .command("replace-document-file")
    .description("Replace the file for a document resource")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .requiredOption(
      "--file <path>",
      "Path to file to upload; replaces the existing file in place",
    )
    .action(async (opts: { id: string; file: string }) => {
      const file = await readBinaryFile(opts.file);
      await runSdk(getFlags, (api) =>
        replaceDocumentResourceFile({
          client: api.client,
          path: { id: opts.id },
          body: { file },
        }),
      );
    });

  addJsonFileOptions(
    resources.command("create-webpage").description("Create a webpage resource"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateWebpageResourceData["body"];
    await runSdk(getFlags, (api) =>
      createWebpageResource({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    resources
      .command("update-webpage")
      .description("Update a webpage resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateWebpageResourceData["body"];
    await runSdk(getFlags, (api) =>
      updateWebpageResource({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });
}
