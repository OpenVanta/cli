import type { Command } from "commander";
import {
  listCustomerTrustAccounts,
  createCustomerTrustAccount,
  getCustomerTrustAccount,
  deleteCustomerTrustAccount,
  updateCustomerTrustAccount,
  createDeletionRequest,
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
  listTagCategories,
  getTagsForCategory,
  addTagCategoryProductContext,
  removeTagCategoryProductContext,
} from "../generated/sdk.gen.js";
import type {
  ListCustomerTrustAccountsData,
  CreateCustomerTrustAccountData,
  GetCustomerTrustAccountData,
  DeleteCustomerTrustAccountData,
  UpdateCustomerTrustAccountData,
  CreateDeletionRequestData,
  ListQuestionnairesData,
  ListAssignableUsersData,
  CreateQuestionnaireExportData,
  GetQuestionnaireExportData,
  CreateFileQuestionnaireData,
  CreateWebsiteQuestionnaireData,
  GetQuestionnaireData,
  DeleteQuestionnaireData,
  UpdateQuestionnaireData,
  ApproveQuestionnaireData,
  CompleteQuestionnaireData,
  ListQuestionnaireResponsesData,
  GetQuestionnaireResponseData,
  UpdateQuestionnaireResponseContentData,
  UpdateQuestionnaireResponseOwnerData,
  ListTagCategoriesData,
  GetTagsForCategoryData,
  AddTagCategoryProductContextData,
  RemoveTagCategoryProductContextData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  parseOptionalBoolString,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerCustomerTrustCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const customerTrust = program
    .command("customer-trust")
    .description("Manage customer trust");

  const accounts = customerTrust
    .command("accounts")
    .description("Manage accounts");

  addPaginationOptions(
    accounts
      .command("list")
      .description("List customer trust accounts")
      .option("--search-string <text>", "Search string")
      .option(
        "--is-auto-approval-enabled <boolean>",
        "Is auto approval enabled (true/false)",
        (value) => parseOptionalBoolString(value, "is-auto-approval-enabled"),
      )
      .option("--custom-fields-filter <text>", "Custom fields filter"),
  )
    .action(async (opts: NonNullable<ListCustomerTrustAccountsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listCustomerTrustAccounts({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            searchString: opts.searchString,
            isAutoApprovalEnabled: opts.isAutoApprovalEnabled,
            customFieldsFilter: opts.customFieldsFilter,
          },
        }),
      );
    });

  addJsonFileOptions(
    accounts
      .command("create")
      .description("Create customer trust account"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string
  emailDomain (required): string
  ndaDetails: object
  ndaDetails.markNdaNotRequired (required): boolean — Whether NDA requirement should be bypassed for access requests matching this account
  accessConfig: object
  accessConfig.autoApprovalEnabled (required): boolean — Whether access requests matching this account's email domain should be auto-approved
  accessConfig.grantAccessOption: INCLUDE_EVERYTHING_REQUESTED, INCLUDE_ONLY_CONFIGURED — How a CustomerTrustAccount determines which resources to grant its viewers access to.
  accessConfig.tagsByCategory: array — Tags to assign to this account, grouped by category.
  accessConfig.tagsByCategory[]: object
  accessConfig.tagsByCategory[].categoryId (required): string — The tag category ID
  accessConfig.tagsByCategory[].tagIds (required): array — Tag IDs to assign. An empty array removes all tags for the category.
  accessConfig.tagsByCategory[].tagIds[]: string
  customFields: array
  customFields[]: object
  customFields[].label (required): string
  customFields[].value (required): string | array
  customFields[].value[]: string
  tagsByCategory: array — Tags to assign to this account, grouped by category
  tagsByCategory[]: object
  tagsByCategory[].categoryId (required): string — The tag category ID
  tagsByCategory[].tagIds (required): array — Tag IDs to assign. An empty array removes all tags for the category.
  tagsByCategory[].tagIds[]: string
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateCustomerTrustAccountData["body"];
      await runSdk(getFlags, (api) =>
        createCustomerTrustAccount({
          client: api.client,
          body,
        }),
      );
    });

  accounts
    .command("get")
    .description("Get customer trust account")
    .requiredOption("--account-id <id>", "Customer Trust account ID")
    .action(async (opts: GetCustomerTrustAccountData["path"]) => {
      await runSdk(getFlags, (api) =>
        getCustomerTrustAccount({
          client: api.client,
          path: {
            accountId: opts.accountId,
          },
        }),
      );
    });

  accounts
    .command("delete")
    .description("Delete customer trust account")
    .requiredOption("--account-id <id>", "Customer Trust account ID")
    .action(async (opts: DeleteCustomerTrustAccountData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteCustomerTrustAccount({
          client: api.client,
          path: {
            accountId: opts.accountId,
          },
        }),
      );
    });

  addJsonFileOptions(
    accounts
      .command("update")
      .description("Update customer trust account")
      .requiredOption("--account-id <id>", "Customer Trust account ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name: string — Updated name for the account
  emailDomain: string — Updated primary email domain for the account
  customFields: array — Updated custom field values for the account
  customFields[]: object
  customFields[].label (required): string
  customFields[].value (required): string | array
  customFields[].value[]: string
  tagsByCategory: array — Tags to assign to this account, grouped by category. Replaces existing tags per category.
  tagsByCategory[]: object
  tagsByCategory[].categoryId (required): string — The tag category ID
  tagsByCategory[].tagIds (required): array — Tag IDs to assign. An empty array removes all tags for the category.
  tagsByCategory[].tagIds[]: string
`,
    )
    .action(async (opts: UpdateCustomerTrustAccountData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateCustomerTrustAccountData["body"];
      await runSdk(getFlags, (api) =>
        updateCustomerTrustAccount({
          client: api.client,
          path: {
            accountId: opts.accountId,
          },
          body,
        }),
      );
    });

  const deletionRequests = customerTrust
    .command("deletion-requests")
    .description("Manage deletion requests");

  addJsonFileOptions(
    deletionRequests
      .command("create")
      .description("Create data deletion request"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  email (required): string — Email address of the individual requesting data deletion.
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateDeletionRequestData["body"];
      await runSdk(getFlags, (api) =>
        createDeletionRequest({
          client: api.client,
          body,
        }),
      );
    });

  const questionnaires = customerTrust
    .command("questionnaires")
    .description("Manage questionnaires");

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
        "Filter questionnaires matching any of the provided statuses.: APPROVED, IN_PROGRESS, IN_REVIEW, READY_FOR_REVIEW, WAITING_ON_ANSWERS, ON_HOLD, NO_LONGER_NEEDED, COMPLETE, ERROR, EXTRACTING_QUESTIONS, QUEUED_FOR_SECTION_EXTRACTION, EXTRACTING_SECTIONS, MAPPING_SECTIONS, QUEUED_FOR_ANSWERING, GENERATING_ANSWERS, QUEUED_FOR_EXTRACTION, PROCESSING, QUEUED_FOR_PROCESSING, WAITING_ON_COLUMN_SELECTION, WAITING_ON_COLUMN_APPROVAL, QUEUED_FOR_COLUMN_DETECTION, DETECTING_COLUMNS (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--type-matches-any <type>",
        "Filter questionnaires matching any of the provided types.: SPREADSHEET, WEBSITE, DOCUMENT (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--created-after <timestamp>",
        "Filter to questionnaires created after this date (ISO 8601 timestamp string).",
      )
      .option(
        "--created-before <timestamp>",
        "Filter to questionnaires created before this date (ISO 8601 timestamp string).",
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
  )
    .action(async (opts: NonNullable<ListQuestionnairesData["query"]>) => {
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

  const questionnairesAssignableUsers = questionnaires
    .command("assignable-users")
    .description("Manage assignable users");

  questionnairesAssignableUsers
    .command("list")
    .description("List assignable users")
    .option("--role <role>", "Filter by role: \"owner\" or \"approver\".")
    .option("--q <text>", "Optional search string to filter users by name or email.")
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

  const questionnairesExports = questionnaires
    .command("exports")
    .description("Manage exports");

  addJsonFileOptions(
    questionnairesExports
      .command("create")
      .description("Create questionnaire export"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  questionnaireId (required): string — Unique identifier for the questionnaire to trigger an export for.
  format (required): original, csv — The output format for the exported questionnaire. - \`"original"\`: Exports in the questionnaire's native format (XLSX for spreadsheets, DOCX for documents). - \`"csv"\`: Exports as a CSV file, suitable for data analysis or import into other systems.
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateQuestionnaireExportData["body"];
      await runSdk(getFlags, (api) =>
        createQuestionnaireExport({
          client: api.client,
          body,
        }),
      );
    });

  questionnairesExports
    .command("get")
    .description("Get questionnaire export status")
    .requiredOption(
      "--id <id>",
      "The unique identifier of the export job, returned from the POST endpoint.",
    )
    .action(async (opts: GetQuestionnaireExportData["path"]) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaireExport({
          client: api.client,
          path: {
            id: opts.id,
          },
        }),
      );
    });

  questionnaires
    .command("create-file")
    .description("Create file questionnaire")
    .requiredOption("--file <path>", "File")
    .requiredOption("--display-name <text>", "Display name for the questionnaire.")
    .option(
      "--owner-assignment <text>",
      "Owner to assign, as a JSON string: {\"type\": \"User\" | \"Team\", \"id\": \"<id>\"}.",
    )
    .option(
      "--approver-assignment <text>",
      "Approver to assign, as a JSON string: {\"type\": \"User\" | \"Team\", \"id\": \"<id>\"}.",
    )
    .option("--description <text>", "Description of the questionnaire.")
    .option("--company-url <url>", "URL of the company associated with this questionnaire.")
    .option(
      "--due-date <timestamp>",
      "Due date for questionnaire completion.; ISO 8601 timestamp",
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
      "--metadata <text>",
      "Custom key-value pairs, as a JSON string array: [{\"key\": \"<key>\", \"value\": \"<value>\"}]. Keys and values may contain alphanumeric characters, hyphens, underscores, and periods.",
    )
    .option(
      "--tag-and-category-ids <id>",
      "Tags to assign, as a JSON string array: [{\"categoryId\": \"<id>\", \"tagId\": \"<id>\"}]. Replaces all existing tags.",
    )
    .action(async (opts: Omit<NonNullable<CreateFileQuestionnaireData["body"]>, "file"> & { file: string }) => {
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
            includeUntaggedEntitiesForCategoryIds: opts.includeUntaggedEntitiesForCategoryIds,
            metadata: opts.metadata,
            tagAndCategoryIds: opts.tagAndCategoryIds,
          },
        }),
      );
    });

  addJsonFileOptions(
    questionnaires
      .command("create-website")
      .description("Create website questionnaire"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  displayName (required): string — Display name for the questionnaire.
  url (required): string — The portal URL to create the questionnaire from.
  ownerAssignment: object — Actor to assign as the owner (user or team).
  ownerAssignment.type (required): User, Team
  ownerAssignment.id (required): string
  approverAssignment: object — Actor to assign as the approver (user or team).
  approverAssignment.type (required): User, Team
  approverAssignment.id (required): string
  companyUrl: string — URL of the company associated with this questionnaire.
  customerTrustAccountId: string — ID of the customer trust account to associate with this questionnaire.
  description: string — Description of the questionnaire.
  dueDate: ISO 8601 timestamp — Due date for questionnaire completion (ISO 8601).
  metadata: array — Custom key-value pairs. Keys and values may contain alphanumeric characters, hyphens, underscores, and periods. Maximum 30 entries.
  metadata[]: object
  metadata[].key (required): string
  metadata[].value (required): string
  includeUntaggedEntitiesForCategoryIds: array — Category IDs for which to include untagged entities.
  includeUntaggedEntitiesForCategoryIds[]: string
  tagAndCategoryIds: array — Tags to assign to the questionnaire. Each entry must include a categoryId and tagId. Replaces all existing tags.
  tagAndCategoryIds[]: object
  tagAndCategoryIds[].categoryId (required): string
  tagAndCategoryIds[].tagId (required): string
`,
    )
    .action(async (opts: { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateWebsiteQuestionnaireData["body"];
      await runSdk(getFlags, (api) =>
        createWebsiteQuestionnaire({
          client: api.client,
          body,
        }),
      );
    });

  questionnaires
    .command("get")
    .description("Get questionnaire by ID")
    .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
    .action(async (opts: GetQuestionnaireData["path"]) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaire({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
        }),
      );
    });

  questionnaires
    .command("delete")
    .description("Delete questionnaire")
    .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
    .action(async (opts: DeleteQuestionnaireData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteQuestionnaire({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
        }),
      );
    });

  addJsonFileOptions(
    questionnaires
      .command("update")
      .description("Update questionnaire")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  displayName: string — Display name of the questionnaire
  dueDate: string — Due date for questionnaire completion (ISO 8601 string, null to clear)
  status: IN_PROGRESS, IN_REVIEW, READY_FOR_REVIEW, WAITING_ON_ANSWERS, ON_HOLD, NO_LONGER_NEEDED — Status transition (limited to settable statuses)
  ownerAssignment: object — Actor assignment for setting an owner or approver.
  ownerAssignment.type (required): User, Team — The type of actor: "User" for an individual user, "Team" for a team.
  ownerAssignment.id (required): string — The unique identifier of the user or team.
  approverAssignment: object — Actor assignment for setting an owner or approver.
  approverAssignment.type (required): User, Team — The type of actor: "User" for an individual user, "Team" for a team.
  approverAssignment.id (required): string — The unique identifier of the user or team.
  metadata: array — Metadata key-value pairs
  metadata[]: object
  metadata[].key (required): string
  metadata[].value (required): string
  tagAndCategoryIds: array — Tags to assign to the questionnaire. Each entry must include a categoryId and tagId. Replaces all existing tags.
  tagAndCategoryIds[]: object
  tagAndCategoryIds[].categoryId (required): string
  tagAndCategoryIds[].tagId (required): string
`,
    )
    .action(async (opts: UpdateQuestionnaireData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateQuestionnaireData["body"];
      await runSdk(getFlags, (api) =>
        updateQuestionnaire({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    questionnaires
      .command("approve")
      .description("Approve questionnaire")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  statusChangeMessage: string — Optional message describing the reason for approval.
`,
    )
    .action(async (opts: ApproveQuestionnaireData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as ApproveQuestionnaireData["body"];
      await runSdk(getFlags, (api) =>
        approveQuestionnaire({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    questionnaires
      .command("complete")
      .description("Complete questionnaire")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  shouldSyncApprovedToAnswerLibrary: boolean — Whether to sync approved answers to the answer library. Defaults to true. Ignored for non-English SPREADSHEET/DOCUMENT questionnaires.
`,
    )
    .action(async (opts: CompleteQuestionnaireData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CompleteQuestionnaireData["body"];
      await runSdk(getFlags, (api) =>
        completeQuestionnaire({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
          body,
        }),
      );
    });

  const questionnairesResponses = questionnaires
    .command("responses")
    .description("Manage responses");

  addPaginationOptions(
    questionnairesResponses
      .command("list")
      .description("List questionnaire responses")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .option(
        "--q <text>",
        "Filter responses by question text (case-insensitive, partial match).",
      ),
  )
    .action(async (opts: ListQuestionnaireResponsesData["path"] & NonNullable<ListQuestionnaireResponsesData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listQuestionnaireResponses({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
          },
          query: {
            ...paginationQuery(opts),
            q: opts.q,
          },
        }),
      );
    });

  questionnairesResponses
    .command("get")
    .description("Get questionnaire response")
    .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
    .requiredOption("--response-id <id>", "Questionnaire response ID")
    .action(async (opts: GetQuestionnaireResponseData["path"]) => {
      await runSdk(getFlags, (api) =>
        getQuestionnaireResponse({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
            responseId: opts.responseId,
          },
        }),
      );
    });

  addJsonFileOptions(
    questionnairesResponses
      .command("update-content")
      .description("Update questionnaire response content")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .requiredOption("--response-id <id>", "Questionnaire response ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  answerPartsValues (required): object — Map of answer part id -> value, matching the shape of the \`answerPartsValues\` read field. Values must be string, number, boolean, null, or string[]. A null value clears that part's value; ids omitted from the map are left unchanged.
  answerPartsValues.*: any JSON value
`,
    )
    .action(async (opts: UpdateQuestionnaireResponseContentData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateQuestionnaireResponseContentData["body"];
      await runSdk(getFlags, (api) =>
        updateQuestionnaireResponseContent({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
            responseId: opts.responseId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    questionnairesResponses
      .command("update-owner")
      .description("Update questionnaire response owner")
      .requiredOption("--questionnaire-id <id>", "Questionnaire ID")
      .requiredOption("--response-id <id>", "Questionnaire response ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  ownerAssignment (required): object — Actor assignment for setting an owner or approver.
  ownerAssignment.type (required): User, Team — The type of actor: "User" for an individual user, "Team" for a team.
  ownerAssignment.id (required): string — The unique identifier of the user or team.
`,
    )
    .action(async (opts: UpdateQuestionnaireResponseOwnerData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateQuestionnaireResponseOwnerData["body"];
      await runSdk(getFlags, (api) =>
        updateQuestionnaireResponseOwner({
          client: api.client,
          path: {
            questionnaireId: opts.questionnaireId,
            responseId: opts.responseId,
          },
          body,
        }),
      );
    });

  const tagCategories = customerTrust
    .command("tag-categories")
    .description("Manage tag categories");

  tagCategories
    .command("list")
    .description("List tag categories")
    .option(
      "--product-context-ids-matches-any <product>",
      "Product context ids matches any: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING, QUESTIONNAIRE (repeatable)",
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
    .description("Get tags for category")
    .requiredOption("--tag-category-id <id>", "Customer Trust tag category ID")
    .action(async (opts: GetTagsForCategoryData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTagsForCategory({
          client: api.client,
          path: {
            tagCategoryId: opts.tagCategoryId,
          },
        }),
      );
    });

  const tagCategoriesProductContexts = tagCategories
    .command("product-contexts")
    .description("Manage product contexts");

  addJsonFileOptions(
    tagCategoriesProductContexts
      .command("add")
      .description("Enable tag category for product context")
      .requiredOption("--tag-category-id <id>", "Customer Trust tag category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  productContextId (required): EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING — Product context to enable this tag category for.
`,
    )
    .action(async (opts: AddTagCategoryProductContextData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddTagCategoryProductContextData["body"];
      await runSdk(getFlags, (api) =>
        addTagCategoryProductContext({
          client: api.client,
          path: {
            tagCategoryId: opts.tagCategoryId,
          },
          body,
        }),
      );
    });

  tagCategoriesProductContexts
    .command("delete")
    .description("Disable tag category for product context")
    .requiredOption("--tag-category-id <id>", "Customer Trust tag category ID")
    .requiredOption(
      "--product-context-id <product>",
      "Product context ID: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING",
    )
    .action(async (opts: RemoveTagCategoryProductContextData["path"]) => {
      await runSdk(getFlags, (api) =>
        removeTagCategoryProductContext({
          client: api.client,
          path: {
            tagCategoryId: opts.tagCategoryId,
            productContextId: opts.productContextId,
          },
        }),
      );
    });

}
