import type { Command } from "commander";
import {
  listQuestionnaires,
  listAssignableUsers,
  createQuestionnaireExport,
  getQuestionnaireExport,
  createFileQuestionnaire,
  createWebsiteQuestionnaire,
  getQuestionnaire,
  deleteQuestionnaire,
  updateQuestionnaire,
  approveQuestionnaire,
  completeQuestionnaire,
  listQuestionnaireResponses,
  getQuestionnaireResponse,
  updateQuestionnaireResponseContent,
  updateQuestionnaireResponseOwner,
} from "../generated/sdk.gen.js";
import type {
  ListQuestionnairesData,
  ListAssignableUsersData,
  CreateQuestionnaireExportData,
  CreateWebsiteQuestionnaireData,
  UpdateQuestionnaireData,
  ApproveQuestionnaireData,
  CompleteQuestionnaireData,
  UpdateQuestionnaireResponseContentData,
  UpdateQuestionnaireResponseOwnerData,
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

export function registerCustomerTrustQuestionnairesCommand(
  customerTrust: Command,
  getFlags: GetFlags,
): void {
  const questionnaires = customerTrust
    .command("questionnaires")
    .description("Manage Customer Trust questionnaires");

  addPaginationOptions(
    questionnaires
      .command("list")
      .description("List questionnaires")
      .option(
        "--q <text>",
        "Filter questionnaires by display name (case-insensitive, partial match).",
      )
      .option(
        "--status-matches-any <status>",
        "Filter questionnaires matching any of the provided statuses: APPROVED, IN_PROGRESS, IN_REVIEW, READY_FOR_REVIEW, WAITING_ON_ANSWERS, ON_HOLD, NO_LONGER_NEEDED, COMPLETE, ERROR, EXTRACTING_QUESTIONS, QUEUED_FOR_SECTION_EXTRACTION, EXTRACTING_SECTIONS, MAPPING_SECTIONS, QUEUED_FOR_ANSWERING, GENERATING_ANSWERS, QUEUED_FOR_EXTRACTION, PROCESSING, QUEUED_FOR_PROCESSING, WAITING_ON_COLUMN_SELECTION, WAITING_ON_COLUMN_APPROVAL, QUEUED_FOR_COLUMN_DETECTION, DETECTING_COLUMNS (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--type-matches-any <type>",
        "Filter questionnaires matching any of the provided types: SPREADSHEET, WEBSITE, DOCUMENT (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--created-after <timestamp>",
        "Filter to questionnaires created after this date, as an ISO 8601 timestamp.",
      )
      .option(
        "--created-before <timestamp>",
        "Filter to questionnaires created before this date, as an ISO 8601 timestamp.",
      )
      .option(
        "--owner-id-matches-any <id>",
        "Filter to questionnaires owned by any of the provided user IDs. (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--approver-id-matches-any <id>",
        "Filter to questionnaires with an approver matching any of the provided user IDs. (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(async (opts: NonNullable<ListQuestionnairesData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listQuestionnaires({
        client: api.client,
        query: {
          ...paginationQuery(opts),
          q: opts.q,
          statusMatchesAny: opts.statusMatchesAny,
          typeMatchesAny: opts.typeMatchesAny,
          createdAfter: opts.createdAfter,
          createdBefore: opts.createdBefore,
          ownerIdMatchesAny: opts.ownerIdMatchesAny,
          approverIdMatchesAny: opts.approverIdMatchesAny,
        },
      }),
    );
  });

  questionnaires
    .command("get")
    .description("Get a questionnaire by ID")
    .requiredOption("--id <id>", "Questionnaire ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaire({
          client: api.client,
          path: { questionnaireId: opts.id },
        }),
      );
    });

  questionnaires
    .command("create-file")
    .description("Create a questionnaire from a file")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption(
      "--display-name <text>",
      "Display name for the questionnaire.",
    )
    .option(
      "--owner-assignment <json>",
      "Owner to assign, as a JSON string: {\"type\": \"User\" | \"Team\", \"id\": \"<id>\"}.",
    )
    .option(
      "--approver-assignment <json>",
      "Approver to assign, as a JSON string: {\"type\": \"User\" | \"Team\", \"id\": \"<id>\"}.",
    )
    .option("--description <text>", "Description of the questionnaire.")
    .option(
      "--company-url <url>",
      "URL of the company associated with this questionnaire.",
    )
    .option(
      "--due-date <timestamp>",
      "Due date for questionnaire completion, as an ISO 8601 timestamp.",
    )
    .option(
      "--customer-trust-account-id <id>",
      "ID of the customer trust account to associate with this questionnaire.",
    )
    .option(
      "--include-untagged-entities-for-category-ids <id>",
      "Comma-separated category IDs for which to include untagged entities.",
    )
    .option(
      "--metadata <json>",
      "Custom key-value pairs, as a JSON string array: [{\"key\": \"<key>\", \"value\": \"<value>\"}]. Keys and values may contain alphanumeric characters, hyphens, underscores, and periods.",
    )
    .option(
      "--tag-and-category-ids <id>",
      "Tags to assign, as a JSON string array: [{\"categoryId\": \"<id>\", \"tagId\": \"<id>\"}]. Replaces all existing tags.",
    )
    .action(
      async (opts: {
        file: string;
        displayName: string;
        ownerAssignment?: string;
        approverAssignment?: string;
        description?: string;
        companyUrl?: string;
        dueDate?: string;
        customerTrustAccountId?: string;
        includeUntaggedEntitiesForCategoryIds?: string;
        metadata?: string;
        tagAndCategoryIds?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          createFileQuestionnaire({
            client: api.client,
            body: {
              file,
              displayName: opts.displayName,
              ownerAssignment: opts.ownerAssignment,
              approverAssignment: opts.approverAssignment,
              description: opts.description,
              companyUrl: opts.companyUrl,
              dueDate: opts.dueDate,
              customerTrustAccountId: opts.customerTrustAccountId,
              includeUntaggedEntitiesForCategoryIds:
                opts.includeUntaggedEntitiesForCategoryIds,
              metadata: opts.metadata,
              tagAndCategoryIds: opts.tagAndCategoryIds,
            },
          }),
        );
      },
    );

  addJsonFileOptions(
    questionnaires
      .command("create-website")
      .description("Create a questionnaire from a website portal"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateWebsiteQuestionnaireData["body"];
    await runSdk(getFlags, (api) =>
      createWebsiteQuestionnaire({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    questionnaires
      .command("update")
      .description("Update a questionnaire")
      .requiredOption("--id <id>", "Questionnaire ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateQuestionnaireData["body"];
    await runSdk(getFlags, (api) =>
      updateQuestionnaire({
        client: api.client,
        path: { questionnaireId: opts.id },
        body,
      }),
    );
  });

  questionnaires
    .command("delete")
    .description("Delete a questionnaire")
    .requiredOption("--id <id>", "Questionnaire ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteQuestionnaire({
          client: api.client,
          path: { questionnaireId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    questionnaires
      .command("approve")
      .description("Approve a questionnaire")
      .requiredOption("--id <id>", "Questionnaire ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as ApproveQuestionnaireData["body"];
    await runSdk(getFlags, (api) =>
      approveQuestionnaire({
        client: api.client,
        path: { questionnaireId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    questionnaires
      .command("complete")
      .description("Complete a questionnaire")
      .requiredOption("--id <id>", "Questionnaire ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CompleteQuestionnaireData["body"];
    await runSdk(getFlags, (api) =>
      completeQuestionnaire({
        client: api.client,
        path: { questionnaireId: opts.id },
        body,
      }),
    );
  });

  const assignableUsers = questionnaires
    .command("assignable-users")
    .description("Manage users assignable to questionnaires");

  assignableUsers
    .command("list")
    .description("List users who can be assigned to questionnaires")
    .option("--role <role>", "Filter by role: owner, approver")
    .option("--q <text>", "Filter users by name or email")
    .action(async (opts: NonNullable<ListAssignableUsersData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listAssignableUsers({
          client: api.client,
          query: {
            role: opts.role,
            q: opts.q,
          },
        }),
      );
    });

  const exports = questionnaires
    .command("exports")
    .description("Manage questionnaire exports");

  addJsonFileOptions(
    exports.command("create").description("Create a questionnaire export"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateQuestionnaireExportData["body"];
    await runSdk(getFlags, (api) =>
      createQuestionnaireExport({ client: api.client, body }),
    );
  });

  exports
    .command("get")
    .description("Get a questionnaire export's status by ID")
    .requiredOption(
      "--id <id>",
      "Export job ID returned by `customer-trust questionnaires exports create`",
    )
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaireExport({ client: api.client, path: { id: opts.id } }),
      );
    });

  const responses = questionnaires
    .command("responses")
    .description("Manage questionnaire responses");

  addPaginationOptions(
    responses
      .command("list")
      .description("List responses for a questionnaire")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .option(
        "--q <text>",
        "Filter responses by question text (case-insensitive, partial match).",
      ),
  ).action(
    async (opts: {
      questionnaireId: string;
      pageSize?: number;
      pageCursor?: string;
      q?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listQuestionnaireResponses({
          client: api.client,
          path: { questionnaireId: opts.questionnaireId },
          query: {
            ...paginationQuery(opts),
            q: opts.q,
          },
        }),
      );
    },
  );

  responses
    .command("get")
    .description("Get a questionnaire response by ID")
    .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
    .requiredOption("--id <id>", "Questionnaire response ID")
    .action(async (opts: { questionnaireId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaireResponse({
          client: api.client,
          path: { questionnaireId: opts.questionnaireId, responseId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    responses
      .command("update-content")
      .description("Update a questionnaire response's content")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .requiredOption("--id <id>", "Questionnaire response ID"),
  ).action(
    async (opts: {
      questionnaireId: string;
      id: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateQuestionnaireResponseContentData["body"];
      await runSdk(getFlags, (api) =>
        updateQuestionnaireResponseContent({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
            responseId: opts.id,
          },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    responses
      .command("update-owner")
      .description("Update a questionnaire response's owner")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .requiredOption("--id <id>", "Questionnaire response ID"),
  ).action(
    async (opts: {
      questionnaireId: string;
      id: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateQuestionnaireResponseOwnerData["body"];
      await runSdk(getFlags, (api) =>
        updateQuestionnaireResponseOwner({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
            responseId: opts.id,
          },
          body,
        }),
      );
    },
  );
}
