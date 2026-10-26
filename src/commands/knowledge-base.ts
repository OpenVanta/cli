import type { Command } from "commander";
import {
  listAnswerLibraryEntries,
  createAnswerLibraryEntry,
  getAnswerLibraryEntry,
  updateAnswerLibraryEntryRoute,
  deleteAnswerLibraryEntryRoute,
  verifyAnswerLibraryEntryRoute,
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
  CreateAnswerLibraryEntryData,
  UpdateAnswerLibraryEntryRouteData,
  VerifyAnswerLibraryEntryRouteData,
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

export function registerKnowledgeBaseCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const knowledgeBase = program
    .command("knowledge-base")
    .description("Manage Knowledge Base answers and resources");

  addPaginationOptions(
    knowledgeBase
      .command("list-answer-library")
      .description("List Answer Library entries")
      .option("--q <query>", "Full-text search across question and answer")
      .option(
        "--last-updated-after <timestamp>",
        "Only include entries updated at or after this ISO 8601 timestamp",
      )
      .option(
        "--last-updated-before <timestamp>",
        "Only include entries updated at or before this ISO 8601 timestamp",
      )
      .option(
        "--matches-tags <json>",
        "JSON-encoded array of `{categoryId, tagId}` pairs. Entries matching any of the given tags are returned (OR filter). Find category IDs with `vanta customer-trust list-tag-categories` and tag IDs with `vanta customer-trust get-tag-category --tag-category-id <id>`.",
      )
      .option(
        "--expires-before <timestamp>",
        "Only include entries expiring at or before this ISO 8601 timestamp",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include entries expiring at or after this ISO 8601 timestamp",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      q?: string;
      lastUpdatedAfter?: string;
      lastUpdatedBefore?: string;
      matchesTags?: string;
      expiresBefore?: string;
      expiresAfter?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listAnswerLibraryEntries({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            q: opts.q,
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

  addJsonFileOptions(
    knowledgeBase
      .command("create-answer-library")
      .description("Create an Answer Library entry"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateAnswerLibraryEntryData["body"];
    await runSdk(getFlags, (api) =>
      createAnswerLibraryEntry({ client: api.client, body }),
    );
  });

  knowledgeBase
    .command("get-answer-library")
    .description("Get an Answer Library entry by ID")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getAnswerLibraryEntry({ client: api.client, path: { id: opts.id } }),
      );
    });

  addJsonFileOptions(
    knowledgeBase
      .command("update-answer-library")
      .description("Update an Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateAnswerLibraryEntryRouteData["body"];
    await runSdk(getFlags, (api) =>
      updateAnswerLibraryEntryRoute({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });

  knowledgeBase
    .command("delete-answer-library")
    .description("Delete an Answer Library entry")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteAnswerLibraryEntryRoute({
          client: api.client,
          path: { id: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    knowledgeBase
      .command("verify-answer-library")
      .description("Verify an Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as VerifyAnswerLibraryEntryRouteData["body"];
    await runSdk(getFlags, (api) =>
      verifyAnswerLibraryEntryRoute({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    knowledgeBase
      .command("list-resources")
      .description("List Knowledge Base resources")
      .option("--q <query>", "Full-text search across resource titles")
      .option(
        "--type-matches-any <type>",
        "Filter to FILE and/or URL resources. Repeat the param to allow either (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--last-updated-after <timestamp>",
        "Only include resources updated at or after this ISO 8601 timestamp",
      )
      .option(
        "--last-updated-before <timestamp>",
        "Only include resources updated at or before this ISO 8601 timestamp",
      )
      .option(
        "--matches-tags <json>",
        'JSON-encoded array of `{categoryId, tagId}` pairs. Tags within the same category are OR\'d together; tags across different categories are AND\'d. For example, passing two tags from "Framework" and one tag from "Region" matches resources that have either of the two frameworks AND the given region. Find category IDs with `vanta customer-trust list-tag-categories` and tag IDs with `vanta customer-trust get-tag-category --tag-category-id <id>`.',
      )
      .option(
        "--expires-before <timestamp>",
        "Only include resources expiring at or before this ISO 8601 timestamp",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include resources expiring at or after this ISO 8601 timestamp",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      q?: string;
      typeMatchesAny: NonNullable<
        NonNullable<ListKnowledgeBaseResourcesData["query"]>["typeMatchesAny"]
      >;
      lastUpdatedAfter?: string;
      lastUpdatedBefore?: string;
      matchesTags?: string;
      expiresBefore?: string;
      expiresAfter?: string;
    }) => {
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

  knowledgeBase
    .command("upload-resource-document")
    .description("Upload a Knowledge Base resource document")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--title <title>", "Title of the document resource")
    .option("--description <text>", "Description of the document resource")
    .option(
      "--owner-assignment <json>",
      'Owner to assign as a JSON string: {"type":"User","id":"<id>"}',
    )
    .option(
      "--customer-visibility <visibility>",
      "Customer visibility on the Trust Center: PRIVATE | SHAREABLE | REQUEST_ACCESS | PUBLIC",
    )
    .option(
      "--download-permission <permission>",
      "Trust Center download permission: VIEW_ONLY | VIEW_AND_DOWNLOAD",
    )
    .option(
      "--is-used-in-questionnaires <bool>",
      "Whether to use this resource for Questionnaire Automation answer generation (true/false)",
    )
    .option(
      "--expiration-date <timestamp>",
      "Expiration date in ISO 8601 timestamp",
    )
    .option(
      "--tags <json>",
      'Tags as a JSON array: [{"categoryId":"<id>","tagId":"<id>"}]',
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
    knowledgeBase
      .command("update-resource-document")
      .description("Update a Knowledge Base resource document by ID")
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

  knowledgeBase
    .command("replace-resource-document-file")
    .description("Replace the file for a document resource")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .requiredOption(
      "--file <path>",
      "Path to file to upload: new document binary; replaces the existing file in place",
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
    knowledgeBase
      .command("create-resource-webpage")
      .description("Create a Knowledge Base resource webpage"),
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
    knowledgeBase
      .command("update-resource-webpage")
      .description("Update a Knowledge Base resource webpage by ID")
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

  knowledgeBase
    .command("get-resource")
    .description("Get a Knowledge Base resource by ID")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getKnowledgeBaseResource({ client: api.client, path: { id: opts.id } }),
      );
    });

  knowledgeBase
    .command("delete-resource")
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
    knowledgeBase
      .command("verify-resource")
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
}
