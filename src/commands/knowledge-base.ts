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
  ListAnswerLibraryEntriesData,
  CreateAnswerLibraryEntryData,
  GetAnswerLibraryEntryData,
  UpdateAnswerLibraryEntryRouteData,
  DeleteAnswerLibraryEntryRouteData,
  VerifyAnswerLibraryEntryRouteData,
  ListKnowledgeBaseResourcesData,
  CreateDocumentResourceData,
  UpdateDocumentResourceData,
  ReplaceDocumentResourceFileData,
  CreateWebpageResourceData,
  UpdateWebpageResourceData,
  GetKnowledgeBaseResourceData,
  DeleteKnowledgeBaseResourceData,
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
    .description("Manage knowledge base");

  const answerLibrary = knowledgeBase
    .command("answer-library")
    .description("Manage answer library");

  addPaginationOptions(
    answerLibrary
      .command("list")
      .description("List Answer Library entries")
      .option("--q <text>", "Full-text search across question and answer.")
      .option(
        "--last-updated-after <timestamp>",
        "Only include entries updated at or after this ISO 8601 timestamp.",
      )
      .option(
        "--last-updated-before <timestamp>",
        "Only include entries updated at or before this ISO 8601 timestamp.",
      )
      .option(
        "--matches-tags <text>",
        "JSON-encoded array of `{categoryId, tagId}` pairs. Entries matching any of the given tags are returned (OR filter). Discover valid `categoryId` and `tagId` values via `GET /v1/customer-trust/tag-categories` (to list categories) and `GET /v1/customer-trust/tag-categories/{tagCategoryId}` (to list tags within a category).",
      )
      .option(
        "--expires-before <timestamp>",
        "Only include entries expiring at or before this ISO 8601 timestamp.",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include entries expiring at or after this ISO 8601 timestamp.",
      ),
  )
    .action(async (opts: NonNullable<ListAnswerLibraryEntriesData["query"]>) => {
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
    });

  addJsonFileOptions(
    answerLibrary
      .command("create")
      .description("Create Answer Library entry"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  question (required): string — The question text.
  answer (required): string — The answer text.
  ownerAssignment: object — The actor to assign as owner. Currently only type "User" is supported.
  ownerAssignment.type (required): User — The type of actor. Currently only "User" is supported.
  ownerAssignment.id (required): string — The unique identifier of the user or team.
  expirationDate: string — The expiration date in ISO 8601 format.
  tags: array — Tags to associate with the entry. Discover valid \`categoryId\` and \`tagId\` values via \`GET /v1/customer-trust/tag-categories\` (to list categories) and \`GET /v1/customer-trust/tag-categories/{tagCategoryId}\` (to list tags within a category).
  tags[]: object
  tags[].categoryId (required): string
  tags[].tagId (required): string
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateAnswerLibraryEntryData["body"];
      await runSdk(getFlags, (api) =>
        createAnswerLibraryEntry({
          client: api.client,
          body,
        }),
      );
    });

  answerLibrary
    .command("get")
    .description("Get Answer Library entry")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: GetAnswerLibraryEntryData["path"]) => {
      await runSdk(getFlags, (api) =>
        getAnswerLibraryEntry({
          client: api.client,
          path: {
            id: opts.id,
          },
        }),
      );
    });

  addJsonFileOptions(
    answerLibrary
      .command("update")
      .description("Update Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  question: string — The question text.
  answer: string — The answer text.
  ownerAssignment: object
  ownerAssignment.type (required): User — The type of actor. Currently only "User" is supported.
  ownerAssignment.id (required): string — The unique identifier of the user or team.
  expirationDate: string — The expiration date in ISO 8601 format. Pass \`null\` to clear.
  tags: array — Tags to associate with the entry. Replaces the existing tag set. Pass \`[]\` to clear all tags. Discover valid \`categoryId\` and \`tagId\` values via \`GET /v1/customer-trust/tag-categories\` (to list categories) and \`GET /v1/customer-trust/tag-categories/{tagCategoryId}\` (to list tags within a category).
  tags[]: object
  tags[].categoryId (required): string
  tags[].tagId (required): string
`,
    )
    .action(async (opts: UpdateAnswerLibraryEntryRouteData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateAnswerLibraryEntryRouteData["body"];
      await runSdk(getFlags, (api) =>
        updateAnswerLibraryEntryRoute({
          client: api.client,
          path: {
            id: opts.id,
          },
          body,
        }),
      );
    });

  answerLibrary
    .command("delete")
    .description("Delete Answer Library entry")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: DeleteAnswerLibraryEntryRouteData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteAnswerLibraryEntryRoute({
          client: api.client,
          path: {
            id: opts.id,
          },
        }),
      );
    });

  addJsonFileOptions(
    answerLibrary
      .command("verify")
      .description("Verify Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  expirationDate: string — The expiration date in ISO 8601 format. If omitted, falls back to the configured review cadence.
`,
    )
    .action(async (opts: VerifyAnswerLibraryEntryRouteData["path"] & { json?: string; file?: string }) => {
      const body = (opts.json !== undefined || opts.file !== undefined
        ? await readJSONPayload(opts.json, opts.file)
        : undefined) as VerifyAnswerLibraryEntryRouteData["body"];
      await runSdk(getFlags, (api) =>
        verifyAnswerLibraryEntryRoute({
          client: api.client,
          path: {
            id: opts.id,
          },
          body,
        }),
      );
    });

  const resources = knowledgeBase
    .command("resources")
    .description("Manage resources");

  addPaginationOptions(
    resources
      .command("list")
      .description("List Knowledge Base resources")
      .option("--q <text>", "Full-text search across resource titles.")
      .option(
        "--type-matches-any <type>",
        "Filter to FILE and/or URL resources. Repeat the param to allow either.: FILE, URL (repeatable)",
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
        "--matches-tags <text>",
        "JSON-encoded array of `{categoryId, tagId}` pairs. Tags within the same category are OR'd together; tags across different categories are AND'd. For example, passing two tags from \"Framework\" and one tag from \"Region\" matches resources that have either of the two frameworks AND the given region. Discover valid `categoryId` and `tagId` values via `GET /v1/customer-trust/tag-categories` (to list categories) and `GET /v1/customer-trust/tag-categories/{tagCategoryId}` (to list tags within a category).",
      )
      .option(
        "--expires-before <timestamp>",
        "Only include resources expiring at or before this ISO 8601 timestamp.",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include resources expiring at or after this ISO 8601 timestamp.",
      ),
  )
    .action(async (opts: NonNullable<ListKnowledgeBaseResourcesData["query"]>) => {
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
    });

  resources
    .command("create-document")
    .description("Create document resource")
    .requiredOption("--file <path>", "File")
    .requiredOption("--title <text>", "Title of the document resource.")
    .option("--description <text>", "Description of the document resource.")
    .option(
      "--owner-assignment <text>",
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
      "--is-used-in-questionnaires <boolean>",
      "Whether to use this resource for Questionnaire Automation answer generation (\"true\" / \"false\").",
    )
    .option("--expiration-date <timestamp>", "Expiration date in ISO 8601 timestamp.")
    .option(
      "--tags <text>",
      "Tags as a JSON array: [{\"categoryId\":\"<id>\",\"tagId\":\"<id>\"}].",
    )
    .option(
      "--category-id <id>",
      "Trust Center category id to associate this resource with. Only applied when `customerVisibility` is `REQUEST_ACCESS` or `PUBLIC`; other visibilities don't place the resource on the Trust Center, so the category is ignored. Pass an unknown id to fall back to uncategorized.",
    )
    .action(async (opts: Omit<NonNullable<CreateDocumentResourceData["body"]>, "file"> & { file: string }) => {
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
    });

  addJsonFileOptions(
    resources
      .command("update-document")
      .description("Update document resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title: string — The title of the document resource.
  description: string — A description for the document resource. Pass \`null\` to clear.
  ownerAssignment: object
  ownerAssignment.type (required): User — The type of actor. Currently only "User" is supported.
  ownerAssignment.id (required): string — The unique identifier of the user.
  customerVisibility: PRIVATE, SHAREABLE, REQUEST_ACCESS, PUBLIC — Customer visibility on the Trust Center.
  downloadPermission: VIEW_ONLY, VIEW_AND_DOWNLOAD — Trust Center download permission.
  isUsedInQuestionnaires: boolean — Whether the resource should be used for question-answering in Questionnaire Automation.
  expirationDate: string — Expiration date in ISO 8601 format. Pass \`null\` to clear.
  tags: array — Tags to associate with the resource. A non-empty array replaces the existing tag set; pass \`[]\` to clear all tags.
  tags[]: object
  tags[].categoryId (required): string
  tags[].tagId (required): string
  categoryId: string — Trust Center category id to associate this resource with. Pass \`null\` to move the resource to uncategorized. Only valid when the resource's effective visibility (after applying any patched \`customerVisibility\`) is REQUEST_ACCESS or PUBLIC; other combinations and unknown ids return an InvalidInputError.
`,
    )
    .action(async (opts: UpdateDocumentResourceData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateDocumentResourceData["body"];
      await runSdk(getFlags, (api) =>
        updateDocumentResource({
          client: api.client,
          path: {
            id: opts.id,
          },
          body,
        }),
      );
    });

  const resourcesDocuments = resources
    .command("documents")
    .description("Manage documents");

  resourcesDocuments
    .command("replace-file")
    .description("Replace document resource file")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .requiredOption(
      "--file <path>",
      "New document binary; replaces the existing file in place.",
    )
    .action(async (opts: ReplaceDocumentResourceFileData["path"] & Omit<NonNullable<ReplaceDocumentResourceFileData["body"]>, "file"> & { file: string }) => {
      const file = await readBinaryFile(opts.file);
      await runSdk(getFlags, (api) =>
        replaceDocumentResourceFile({
          client: api.client,
          path: {
            id: opts.id,
          },
          body: {
            file,
          },
        }),
      );
    });

  addJsonFileOptions(
    resources
      .command("create-webpage")
      .description("Create webpage resource"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title (required): string — The title of the webpage resource.
  url (required): string — The URL of the webpage.
  description: string — A description for the webpage resource.
  ownerAssignment: object — The actor to assign as owner. Currently only type "User" is supported.
  ownerAssignment.type (required): User — The type of actor. Currently only "User" is supported.
  ownerAssignment.id (required): string — The unique identifier of the user.
  customerVisibility: PRIVATE, SHAREABLE, REQUEST_ACCESS, PUBLIC — Customer visibility on the Trust Center. Webpage resources accept only PRIVATE or PUBLIC; REQUEST_ACCESS and SHAREABLE return an InvalidInputError.
  includeSubPages: boolean — Whether to scan sub-pages one level deep alongside the primary URL.
  isUsedInQuestionnaires: boolean — Whether the resource should be used for question-answering in Questionnaire Automation.
  expirationDate: string — Expiration date in ISO 8601 format.
  tags: array — Tags to associate with the resource.
  tags[]: object
  tags[].categoryId (required): string
  tags[].tagId (required): string
  categoryId: string — Trust Center category id to associate this resource with. Pass \`null\` to keep the resource uncategorized. Only valid when \`customerVisibility\` is PUBLIC; other combinations and unknown ids return an InvalidInputError.
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateWebpageResourceData["body"];
      await runSdk(getFlags, (api) =>
        createWebpageResource({
          client: api.client,
          body,
        }),
      );
    });

  addJsonFileOptions(
    resources
      .command("update-webpage")
      .description("Update webpage resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title: string — The title of the webpage resource.
  description: string — A description for the webpage resource. Pass \`null\` to clear.
  ownerAssignment: object
  ownerAssignment.type (required): User — The type of actor. Currently only "User" is supported.
  ownerAssignment.id (required): string — The unique identifier of the user.
  customerVisibility: PRIVATE, SHAREABLE, REQUEST_ACCESS, PUBLIC — Customer visibility on the Trust Center. Webpage resources accept only PRIVATE or PUBLIC; REQUEST_ACCESS and SHAREABLE return an InvalidInputError.
  includeSubPages: boolean — Whether to scan sub-pages one level deep alongside the primary URL.
  isUsedInQuestionnaires: boolean — Whether the resource should be used for question-answering in Questionnaire Automation.
  expirationDate: string — Expiration date in ISO 8601 format. Pass \`null\` to clear.
  tags: array — Tags to associate with the resource. A non-empty array replaces the existing tag set; pass \`[]\` to clear all tags.
  tags[]: object
  tags[].categoryId (required): string
  tags[].tagId (required): string
  categoryId: string — Trust Center category id to associate this resource with. Pass \`null\` to move the resource to uncategorized. Only valid when the resource's effective visibility (after applying any patched \`customerVisibility\`) is PUBLIC; other combinations and unknown ids return an InvalidInputError.
`,
    )
    .action(async (opts: UpdateWebpageResourceData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateWebpageResourceData["body"];
      await runSdk(getFlags, (api) =>
        updateWebpageResource({
          client: api.client,
          path: {
            id: opts.id,
          },
          body,
        }),
      );
    });

  resources
    .command("get")
    .description("Get Knowledge Base resource")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .action(async (opts: GetKnowledgeBaseResourceData["path"]) => {
      await runSdk(getFlags, (api) =>
        getKnowledgeBaseResource({
          client: api.client,
          path: {
            id: opts.id,
          },
        }),
      );
    });

  resources
    .command("delete")
    .description("Delete Knowledge Base resource")
    .requiredOption("--id <id>", "Knowledge Base resource ID")
    .action(async (opts: DeleteKnowledgeBaseResourceData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteKnowledgeBaseResource({
          client: api.client,
          path: {
            id: opts.id,
          },
        }),
      );
    });

  addJsonFileOptions(
    resources
      .command("verify")
      .description("Verify Knowledge Base resource")
      .requiredOption("--id <id>", "Knowledge Base resource ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  expirationDate: string — The expiration date in ISO 8601 format. If omitted, falls back to the configured review cadence.
`,
    )
    .action(async (opts: VerifyKnowledgeBaseResourceData["path"] & { json?: string; file?: string }) => {
      const body = (opts.json !== undefined || opts.file !== undefined
        ? await readJSONPayload(opts.json, opts.file)
        : undefined) as VerifyKnowledgeBaseResourceData["body"];
      await runSdk(getFlags, (api) =>
        verifyKnowledgeBaseResource({
          client: api.client,
          path: {
            id: opts.id,
          },
          body,
        }),
      );
    });

}
