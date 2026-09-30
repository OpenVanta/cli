import type { Command } from "commander";
import { printResponse } from "../output.js";
import { writeDownloadedMedia } from "./documents.js";
import {
  getTrustCenter,
  updateTrustCenter,
  listTrustCenterAccessRequests,
  getTrustCenterAccessRequest,
  approveTrustCenterAccessRequest,
  denyTrustCenterAccessRequest,
  listTrustCenterActivityEvents,
  listChatbotConversations,
  getChatbotConversationMessages,
  listComplianceFrameworks,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  uploadComplianceFrameworkBadge,
  getTrustCenterControlCategories,
  addTrustCenterControlCategory,
  upsertTrustCenterControlCategoriesOrder,
  getTrustCenterControlCategory,
  updateTrustCenterControlCategory,
  deleteTrustCenterControlCategory,
  updateTrustCenterControlsInCategory,
  upsertTrustCenterControlsInCategoryOrder,
  listTrustCenterControls,
  addControlToTrustCenter,
  bulkAddTagsToControls,
  bulkRemoveTagsFromControls,
  getTrustCenterControl,
  deleteTrustCenterControl,
  listTrustCenterDataCollected,
  upsertTrustCenterDataCollected,
  listTrustCenterFaqCategories,
  addTrustCenterFaqCategory,
  updateTrustCenterFaqCategory,
  deleteTrustCenterFaqCategory,
  listTrustCenterFaqs,
  createTrustCenterFaq,
  getTrustCenterFaq,
  updateTrustCenterFaq,
  deleteTrustCenterFaq,
  uploadTrustCenterFavicon,
  listTrustCenterHistoricalAccessRequests,
  listTrustCenterResourceCategories,
  addTrustCenterResourceCategory,
  upsertTrustCenterResourceCategoriesOrder,
  updateTrustCenterResourceCategory,
  deleteTrustCenterResourceCategory,
  listTrustCenterResources,
  createTrustCenterResource,
  getTrustCenterResource,
  updateTrustCenterResource,
  deleteTrustCenterResource,
  getTrustCenterResourceMedia,
  listTrustCenterSubprocessors,
  createTrustCenterSubprocessor,
  getTrustCenterSubprocessor,
  updateTrustCenterSubprocessor,
  deleteTrustCenterSubprocessor,
  createTrustCenterSubscriberGroup,
  listTrustCenterSubscriberGroups,
  updateTrustCenterSubscriberGroup,
  deleteTrustCenterSubscriberGroup,
  getTrustCenterSubscriberGroup,
  listTrustCenterSubscribers,
  createTrustCenterSubscriber,
  getTrustCenterSubscriber,
  deleteTrustCenterSubscriber,
  upsertGroupsForTrustCenterSubscriber,
  listTrustCenterUpdates,
  createTrustCenterUpdate,
  getTrustCenterUpdate,
  updateTrustCenterUpdate,
  deleteTrustCenterUpdate,
  sendNotificationsToAllSubscribers,
  sendTrustCenterUpdateNotifications,
  upsertTrustCenterVideos,
  listTrustCenterViewers,
  addTrustCenterViewer,
  getTrustCenterViewer,
  removeTrustCenterViewer,
  updateTrustCenterViewer,
  sendTrustCenterViewerInviteReminder,
} from "../generated/sdk.gen.js";
import type {
  GetTrustCenterData,
  UpdateTrustCenterData,
  ListTrustCenterAccessRequestsData,
  GetTrustCenterAccessRequestData,
  ApproveTrustCenterAccessRequestData,
  DenyTrustCenterAccessRequestData,
  ListTrustCenterActivityEventsData,
  ListChatbotConversationsData,
  GetChatbotConversationMessagesData,
  ListComplianceFrameworksData,
  CreateComplianceFrameworkData,
  UpdateComplianceFrameworkData,
  DeleteComplianceFrameworkData,
  UploadComplianceFrameworkBadgeData,
  GetTrustCenterControlCategoriesData,
  AddTrustCenterControlCategoryData,
  UpsertTrustCenterControlCategoriesOrderData,
  GetTrustCenterControlCategoryData,
  UpdateTrustCenterControlCategoryData,
  DeleteTrustCenterControlCategoryData,
  UpdateTrustCenterControlsInCategoryData,
  UpsertTrustCenterControlsInCategoryOrderData,
  ListTrustCenterControlsData,
  AddControlToTrustCenterData,
  BulkAddTagsToControlsData,
  BulkRemoveTagsFromControlsData,
  GetTrustCenterControlData,
  DeleteTrustCenterControlData,
  ListTrustCenterDataCollectedData,
  UpsertTrustCenterDataCollectedData,
  ListTrustCenterFaqCategoriesData,
  AddTrustCenterFaqCategoryData,
  UpdateTrustCenterFaqCategoryData,
  DeleteTrustCenterFaqCategoryData,
  ListTrustCenterFaqsData,
  CreateTrustCenterFaqData,
  GetTrustCenterFaqData,
  UpdateTrustCenterFaqData,
  DeleteTrustCenterFaqData,
  UploadTrustCenterFaviconData,
  ListTrustCenterHistoricalAccessRequestsData,
  ListTrustCenterResourceCategoriesData,
  AddTrustCenterResourceCategoryData,
  UpsertTrustCenterResourceCategoriesOrderData,
  UpdateTrustCenterResourceCategoryData,
  DeleteTrustCenterResourceCategoryData,
  ListTrustCenterResourcesData,
  CreateTrustCenterResourceData,
  GetTrustCenterResourceData,
  UpdateTrustCenterResourceData,
  DeleteTrustCenterResourceData,
  GetTrustCenterResourceMediaData,
  ListTrustCenterSubprocessorsData,
  CreateTrustCenterSubprocessorData,
  GetTrustCenterSubprocessorData,
  UpdateTrustCenterSubprocessorData,
  DeleteTrustCenterSubprocessorData,
  CreateTrustCenterSubscriberGroupData,
  ListTrustCenterSubscriberGroupsData,
  UpdateTrustCenterSubscriberGroupData,
  DeleteTrustCenterSubscriberGroupData,
  GetTrustCenterSubscriberGroupData,
  ListTrustCenterSubscribersData,
  CreateTrustCenterSubscriberData,
  GetTrustCenterSubscriberData,
  DeleteTrustCenterSubscriberData,
  UpsertGroupsForTrustCenterSubscriberData,
  ListTrustCenterUpdatesData,
  CreateTrustCenterUpdateData,
  GetTrustCenterUpdateData,
  UpdateTrustCenterUpdateData,
  DeleteTrustCenterUpdateData,
  SendNotificationsToAllSubscribersData,
  SendTrustCenterUpdateNotificationsData,
  UpsertTrustCenterVideosData,
  ListTrustCenterViewersData,
  AddTrustCenterViewerData,
  GetTrustCenterViewerData,
  RemoveTrustCenterViewerData,
  UpdateTrustCenterViewerData,
  SendTrustCenterViewerInviteReminderData,
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
  withClient,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCentersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const trustCenters = program
    .command("trust-centers")
    .description("Manage trust centers");

  trustCenters
    .command("list")
    .description("Get Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: GetTrustCenterData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenter({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update")
      .description("Update Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title: string — Custom title for the Trust Center. If null is passed in, the current custom title is unset and the default title is restored.
  companyDescription: string — Company description displayed in the Trust Center header. If null is passed in, the current company description is unset.
  bannerSetting: object — The banner configuration of the Trust Center.
  bannerSetting.endColor: string — End color of the banner. Only applies if setting is GRADIENT.
  bannerSetting.startColor: string — Start color of the banner. Only applies if setting is GRADIENT.
  bannerSetting.setting (required): GRADIENT | MINIMAL
  customTheme: object — The custom theme configuration for the Trust Center.
  customTheme.secondary: string — Secondary color for the theme. If null is passed in, resets to default.
  customTheme.primary: string — Primary color for the theme. If null is passed in, resets to default.
  privacyPolicy: string — Privacy policy URL to set on the Trust Center. If null is passed in, unsets the current privacy policy.
  awsMarketplaceListing: string — AWS Marketplace listing URL to set on the Trust Center. If null is passed in, unsets the current AWS Marketplace listing.
  isPublic: boolean — Whether the Trust Center is public or not.
  contactEmail: string — Contact email displayed on the Trust Center. If null is passed in, unsets the current contact email.
  customHeading: string — Custom heading displayed on the Trust Center. If null is passed in, unsets the current custom heading.
  controlVisibilityMode: SHOW_OK_ONLY, SHOW_OK_AND_UNMAPPED, SHOW_ALL_WITHOUT_STATUS, SHOW_ALL_WITH_STATUS — The default status-visibility mode applied to all controls that don't have a category-level override. Omit to leave unchanged. Only settable for domains with the Vanta Compliance Platform; other domains have no control status to render.
`,
    )
    .action(async (opts: UpdateTrustCenterData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenter({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  const accessRequests = trustCenters
    .command("access-requests")
    .description("Manage access requests");

  addPaginationOptions(
    accessRequests
      .command("list")
      .description("List Trust Center access requests")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .action(async (opts: ListTrustCenterAccessRequestsData["path"] & NonNullable<ListTrustCenterAccessRequestsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterAccessRequests({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
          },
        }),
      );
    });

  accessRequests
    .command("get")
    .description("Get Trust Center access request")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--access-request-id <id>", "Access request ID")
    .action(async (opts: GetTrustCenterAccessRequestData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterAccessRequest({
          client: api.client,
          path: {
            slugId: opts.slugId,
            accessRequestId: opts.accessRequestId,
          },
        }),
      );
    });

  addJsonFileOptions(
    accessRequests
      .command("approve")
      .description("Approve Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--access-request-id <id>", "Access request ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  expirationDate: ISO 8601 timestamp — The date access should expire for this viewer. If a date isn't provided, access will not expire.
  isNdaRequired: boolean — Whether to require an NDA for the viewer. Defaults to true.
  resourceIds: array — Identifiers for the resources that this viewer should have access to. If this field is omitted, the viewer will have access to all resources that they requested.
  resourceIds[]: string
  accessLevel: FULL_ACCESS, PARTIAL_ACCESS — Approved access level of the viewer. If this field is omitted, the viewer will have the access level they requested.
`,
    )
    .action(async (opts: ApproveTrustCenterAccessRequestData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as ApproveTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        approveTrustCenterAccessRequest({
          client: api.client,
          path: {
            slugId: opts.slugId,
            accessRequestId: opts.accessRequestId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    accessRequests
      .command("deny")
      .description("Deny Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--access-request-id <id>", "Access request ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  reason: string — Reason for denying the access request.
  sendEmail: boolean — Whether to email the requester to notify them that their request was denied. The email includes the reason when one is provided. Defaults to false.
`,
    )
    .action(async (opts: DenyTrustCenterAccessRequestData["path"] & { json?: string; file?: string }) => {
      const body = (opts.json !== undefined || opts.file !== undefined
        ? await readJSONPayload(opts.json, opts.file)
        : undefined) as DenyTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        denyTrustCenterAccessRequest({
          client: api.client,
          path: {
            slugId: opts.slugId,
            accessRequestId: opts.accessRequestId,
          },
          body,
        }),
      );
    });

  const activity = trustCenters
    .command("activity")
    .description("Manage activity");

  addPaginationOptions(
    activity
      .command("list")
      .description("List Trust Center viewer activity events")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--event-types-matches-any <event>",
        "Event types matches any: PAGE_VIEW, RESOURCE_DOWNLOAD, RESOURCE_VIEW, VIDEO_PLAY (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--after-date <timestamp>",
        "Only include activity events that occurred on or after the specified date and time.; ISO 8601 timestamp",
      )
      .option(
        "--before-date <timestamp>",
        "Only include activity events that occurred before the specified date and time.; ISO 8601 timestamp",
      ),
  )
    .action(async (opts: ListTrustCenterActivityEventsData["path"] & NonNullable<ListTrustCenterActivityEventsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterActivityEvents({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
            eventTypesMatchesAny: opts.eventTypesMatchesAny,
            afterDate: opts.afterDate,
            beforeDate: opts.beforeDate,
          },
        }),
      );
    });

  const chatbot = trustCenters
    .command("chatbot")
    .description("Manage chatbot");

  const chatbotConversations = chatbot
    .command("conversations")
    .description("Manage conversations");

  addPaginationOptions(
    chatbotConversations
      .command("list")
      .description("List Trust Center chatbot conversations")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option("--search-string <text>", "Search conversations by message content."),
  )
    .action(async (opts: ListChatbotConversationsData["path"] & NonNullable<ListChatbotConversationsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listChatbotConversations({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
            searchString: opts.searchString,
          },
        }),
      );
    });

  chatbotConversations
    .command("get-messages")
    .description("Get Trust Center chatbot conversation messages")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--conversation-id <id>", "Conversation ID")
    .action(async (opts: GetChatbotConversationMessagesData["path"]) => {
      await runSdk(getFlags, (api) =>
        getChatbotConversationMessages({
          client: api.client,
          path: {
            slugId: opts.slugId,
            conversationId: opts.conversationId,
          },
        }),
      );
    });

  const complianceFrameworks = trustCenters
    .command("compliance-frameworks")
    .description("Manage compliance frameworks");

  complianceFrameworks
    .command("list")
    .description("List Trust Center compliance frameworks")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListComplianceFrameworksData["path"]) => {
      await runSdk(getFlags, (api) =>
        listComplianceFrameworks({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    complianceFrameworks
      .command("create")
      .description("Create Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Display name of the framework.
  standard: aiact, aiuc1, aiuc1_26q3, aue8, awsFTR, bsic5, ccpa, cisv8, cjis, cmmc2, cps234, cri, dora, fedRAMPr5, fedramp, fedramp20x, fedramp20x_2026, gdpr, hipaa, hitruste1, iso9001, iso27001, iso27001_2022, iso27017, iso27018, iso27701, iso27701_2025, iso42001, msftSSPA, mvsp, nis2d, nist53, nist171, nist171r3, nistAiRmf, nistCSF, nistcsf2, ofdss, pciDss4, pciSaqA, pciSaqAEP, pciSaqDMerchant, pciSaqDSP, soc2, soxITGC, t23nycrr500, tisax, tisax2027, iso22301, trust, ukCyberEssentials, ukCyberEssentials33, usDataPrivacy, fedrampKSI, None — Compliance standard to associate with this framework.
  description: string — Description of the framework.
`,
    )
    .action(async (opts: CreateComplianceFrameworkData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateComplianceFrameworkData["body"];
      await runSdk(getFlags, (api) =>
        createComplianceFramework({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    complianceFrameworks
      .command("update")
      .description("Update Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--framework-id <id>", "Framework ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name: string — Display name of the framework.
  standard: aiact, aiuc1, aiuc1_26q3, aue8, awsFTR, bsic5, ccpa, cisv8, cjis, cmmc2, cps234, cri, dora, fedRAMPr5, fedramp, fedramp20x, fedramp20x_2026, gdpr, hipaa, hitruste1, iso9001, iso27001, iso27001_2022, iso27017, iso27018, iso27701, iso27701_2025, iso42001, msftSSPA, mvsp, nis2d, nist53, nist171, nist171r3, nistAiRmf, nistCSF, nistcsf2, ofdss, pciDss4, pciSaqA, pciSaqAEP, pciSaqDMerchant, pciSaqDSP, soc2, soxITGC, t23nycrr500, tisax, tisax2027, iso22301, trust, ukCyberEssentials, ukCyberEssentials33, usDataPrivacy, fedrampKSI, None — Compliance standard to associate with this framework. Pass null to unset.
  description: string — Description of the framework. Pass null to unset.
`,
    )
    .action(async (opts: UpdateComplianceFrameworkData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateComplianceFrameworkData["body"];
      await runSdk(getFlags, (api) =>
        updateComplianceFramework({
          client: api.client,
          path: {
            slugId: opts.slugId,
            frameworkId: opts.frameworkId,
          },
          body,
        }),
      );
    });

  complianceFrameworks
    .command("delete")
    .description("Delete Trust Center compliance framework")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--framework-id <id>", "Framework ID")
    .action(async (opts: DeleteComplianceFrameworkData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteComplianceFramework({
          client: api.client,
          path: {
            slugId: opts.slugId,
            frameworkId: opts.frameworkId,
          },
        }),
      );
    });

  complianceFrameworks
    .command("upload-badge")
    .description("Upload Trust Center compliance framework badge")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--framework-id <id>", "Framework ID")
    .requiredOption("--file <path>", "File")
    .action(async (opts: UploadComplianceFrameworkBadgeData["path"] & Omit<NonNullable<UploadComplianceFrameworkBadgeData["body"]>, "file"> & { file: string }) => {
      const file = await readBinaryFile(opts.file);
      await runSdk(getFlags, (api) =>
        uploadComplianceFrameworkBadge({
          client: api.client,
          path: {
            slugId: opts.slugId,
            frameworkId: opts.frameworkId,
          },
          body: {
            file,
          },
        }),
      );
    });

  const controlCategories = trustCenters
    .command("control-categories")
    .description("Manage control categories");

  controlCategories
    .command("list")
    .description("List Trust Center control categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: GetTrustCenterControlCategoriesData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategories({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    controlCategories
      .command("create")
      .description("Add Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Name of the category.
`,
    )
    .action(async (opts: AddTrustCenterControlCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddTrustCenterControlCategoryData["body"];
      await runSdk(getFlags, (api) =>
        addTrustCenterControlCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    controlCategories
      .command("set-order")
      .description("Reorder Trust Center control categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  orderedCategoryIds (required): array — Ordered list of all control category IDs representing the desired order.
  orderedCategoryIds[]: string
`,
    )
    .action(async (opts: UpsertTrustCenterControlCategoriesOrderData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertTrustCenterControlCategoriesOrderData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterControlCategoriesOrder({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  controlCategories
    .command("get")
    .description("Get Trust Center control category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: GetTrustCenterControlCategoryData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
        }),
      );
    });

  addJsonFileOptions(
    controlCategories
      .command("update")
      .description("Update Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name: string — New name for the category. Omit to leave the name unchanged.
  visibility: PUBLIC, SHAREABLE — Visibility of the category's controls on the Trust Center. Omit to leave unchanged.
  statusVisibilityOverride: SHOW_OK_ONLY, SHOW_OK_AND_UNMAPPED, SHOW_ALL_WITHOUT_STATUS, SHOW_ALL_WITH_STATUS — Which controls a Trust Center displays, and whether their pass/fail status is shown. Set as the Trust Center's global default, or per category to override that default.
`,
    )
    .action(async (opts: UpdateTrustCenterControlCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterControlCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
          body,
        }),
      );
    });

  controlCategories
    .command("delete")
    .description("Delete Trust Center control category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: DeleteTrustCenterControlCategoryData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControlCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
        }),
      );
    });

  const controlCategoriesControls = controlCategories
    .command("controls")
    .description("Manage controls");

  addJsonFileOptions(
    controlCategoriesControls
      .command("update")
      .description("Bulk edit controls in a category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  controlsToAdd (required): array — IDs of controls to add to the category.
  controlsToAdd[]: string
  controlsToRemove (required): array — IDs of controls to remove from the category.
  controlsToRemove[]: string
`,
    )
    .action(async (opts: UpdateTrustCenterControlsInCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterControlsInCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlsInCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    controlCategoriesControls
      .command("set-order")
      .description("Reorder controls in a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  orderedControlIds (required): array — Ordered list of all control IDs in the category representing the desired order.
  orderedControlIds[]: string
`,
    )
    .action(async (opts: UpsertTrustCenterControlsInCategoryOrderData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertTrustCenterControlsInCategoryOrderData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterControlsInCategoryOrder({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
          body,
        }),
      );
    });

  const controls = trustCenters
    .command("controls")
    .description("Manage controls");

  addPaginationOptions(
    controls
      .command("list")
      .description("List Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .action(async (opts: ListTrustCenterControlsData["path"] & NonNullable<ListTrustCenterControlsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterControls({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
          },
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("create")
      .description("Add Trust Center control")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  controlId (required): string — ID of the control to add to the Trust Center.
  categoryIds (required): array — IDs of the categories to add the control to. This cannot be empty.
  categoryIds[]: string
`,
    )
    .action(async (opts: AddControlToTrustCenterData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddControlToTrustCenterData["body"];
      await runSdk(getFlags, (api) =>
        addControlToTrustCenter({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("add-tags")
      .description("Bulk add tags to Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  controlIds (required): array — IDs of the controls to tag. Maximum 100.
  controlIds[]: string
  tagCategory (required): string — ID of the tag category.
  tags (required): array — IDs of the tags to add or remove.
  tags[]: string
`,
    )
    .action(async (opts: BulkAddTagsToControlsData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as BulkAddTagsToControlsData["body"];
      await runSdk(getFlags, (api) =>
        bulkAddTagsToControls({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("remove-tags")
      .description("Bulk remove tags from Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  controlIds (required): array — IDs of the controls to tag. Maximum 100.
  controlIds[]: string
  tagCategory (required): string — ID of the tag category.
  tags (required): array — IDs of the tags to add or remove.
  tags[]: string
`,
    )
    .action(async (opts: BulkRemoveTagsFromControlsData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as BulkRemoveTagsFromControlsData["body"];
      await runSdk(getFlags, (api) =>
        bulkRemoveTagsFromControls({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  controls
    .command("get")
    .description("Get Trust Center control")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--control-id <id>", "Control ID")
    .action(async (opts: GetTrustCenterControlData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControl({
          client: api.client,
          path: {
            slugId: opts.slugId,
            controlId: opts.controlId,
          },
        }),
      );
    });

  controls
    .command("delete")
    .description("Delete Trust Center control")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--control-id <id>", "Control ID")
    .action(async (opts: DeleteTrustCenterControlData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControl({
          client: api.client,
          path: {
            slugId: opts.slugId,
            controlId: opts.controlId,
          },
        }),
      );
    });

  const dataCollected = trustCenters
    .command("data-collected")
    .description("Manage data collected");

  dataCollected
    .command("list")
    .description("List Trust Center data collected")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterDataCollectedData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterDataCollected({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    dataCollected
      .command("set")
      .description("Set Trust Center data collected")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  dataCollected (required): array — List of data-collected disclosures to set on the Trust Center.
  dataCollected[]: object
  dataCollected[].dataCollected (required): string — Name of the data type being disclosed.
  dataCollected[].status (required): COLLECTED, HIDDEN, NOT_COLLECTED — Status of the data collection disclosure. Must be one of "COLLECTED", "HIDDEN", or "NOT_COLLECTED".
  dataCollectedHeading: string — Custom heading for the data collected section. If null is passed in, unsets the current heading.
`,
    )
    .action(async (opts: UpsertTrustCenterDataCollectedData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertTrustCenterDataCollectedData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterDataCollected({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  const faqCategories = trustCenters
    .command("faq-categories")
    .description("Manage faq categories");

  faqCategories
    .command("list")
    .description("List Trust Center FAQ categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterFaqCategoriesData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterFaqCategories({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    faqCategories
      .command("create")
      .description("Add Trust Center FAQ category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Name of the category.
`,
    )
    .action(async (opts: AddTrustCenterFaqCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddTrustCenterFaqCategoryData["body"];
      await runSdk(getFlags, (api) =>
        addTrustCenterFaqCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    faqCategories
      .command("update")
      .description("Update Trust Center FAQ category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — New name for the category.
`,
    )
    .action(async (opts: UpdateTrustCenterFaqCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterFaqCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterFaqCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
          body,
        }),
      );
    });

  faqCategories
    .command("delete")
    .description("Delete Trust Center FAQ category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: DeleteTrustCenterFaqCategoryData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaqCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
        }),
      );
    });

  const faqs = trustCenters
    .command("faqs")
    .description("Manage faqs");

  faqs
    .command("list")
    .description("List Trust Center FAQs")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterFaqsData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterFaqs({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    faqs
      .command("create")
      .description("Create Trust Center FAQ")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  question (required): string — The FAQ question.
  answer (required): string — The FAQ answer.
  categoryId: string — The category to place this FAQ in. Pass null to move to uncategorized. Omit to leave unchanged (on update) or default to uncategorized (on create).
`,
    )
    .action(async (opts: CreateTrustCenterFaqData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateTrustCenterFaqData["body"];
      await runSdk(getFlags, (api) =>
        createTrustCenterFaq({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  faqs
    .command("get")
    .description("Get Trust Center FAQ")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--faq-id <id>", "Faq ID")
    .action(async (opts: GetTrustCenterFaqData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterFaq({
          client: api.client,
          path: {
            slugId: opts.slugId,
            faqId: opts.faqId,
          },
        }),
      );
    });

  addJsonFileOptions(
    faqs
      .command("update")
      .description("Update Trust Center FAQ")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--faq-id <id>", "Faq ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  question (required): string — The FAQ question.
  answer (required): string — The FAQ answer.
  categoryId: string — The category to place this FAQ in. Pass null to move to uncategorized. Omit to leave unchanged (on update) or default to uncategorized (on create).
`,
    )
    .action(async (opts: UpdateTrustCenterFaqData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterFaqData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterFaq({
          client: api.client,
          path: {
            slugId: opts.slugId,
            faqId: opts.faqId,
          },
          body,
        }),
      );
    });

  faqs
    .command("delete")
    .description("Delete Trust Center FAQ")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--faq-id <id>", "Faq ID")
    .action(async (opts: DeleteTrustCenterFaqData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaq({
          client: api.client,
          path: {
            slugId: opts.slugId,
            faqId: opts.faqId,
          },
        }),
      );
    });

  trustCenters
    .command("upload-favicon")
    .description("Upload Trust Center favicon")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--favicon <path>", "Path to favicon file to upload")
    .action(async (opts: UploadTrustCenterFaviconData["path"] & Omit<NonNullable<UploadTrustCenterFaviconData["body"]>, "favicon"> & { favicon: string }) => {
      const favicon = await readBinaryFile(opts.favicon);
      await runSdk(getFlags, (api) =>
        uploadTrustCenterFavicon({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body: {
            favicon,
          },
        }),
      );
    });

  const historicalAccessRequests = trustCenters
    .command("historical-access-requests")
    .description("Manage historical access requests");

  addPaginationOptions(
    historicalAccessRequests
      .command("list")
      .description("List historical Trust Center access requests")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .action(async (opts: ListTrustCenterHistoricalAccessRequestsData["path"] & NonNullable<ListTrustCenterHistoricalAccessRequestsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterHistoricalAccessRequests({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
          },
        }),
      );
    });

  const resourceCategories = trustCenters
    .command("resource-categories")
    .description("Manage resource categories");

  resourceCategories
    .command("list")
    .description("List Trust Center resource categories")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterResourceCategoriesData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResourceCategories({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    resourceCategories
      .command("create")
      .description("Add Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Name of the category.
`,
    )
    .action(async (opts: AddTrustCenterResourceCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddTrustCenterResourceCategoryData["body"];
      await runSdk(getFlags, (api) =>
        addTrustCenterResourceCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    resourceCategories
      .command("set-order")
      .description("Reorder Trust Center resource categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  categoryIds (required): array — Ordered list of all resource category IDs representing the desired order.
  categoryIds[]: string
`,
    )
    .action(async (opts: UpsertTrustCenterResourceCategoriesOrderData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertTrustCenterResourceCategoriesOrderData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterResourceCategoriesOrder({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addJsonFileOptions(
    resourceCategories
      .command("update")
      .description("Update Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — New name for the category.
`,
    )
    .action(async (opts: UpdateTrustCenterResourceCategoryData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterResourceCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterResourceCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
          body,
        }),
      );
    });

  resourceCategories
    .command("delete")
    .description("Delete Trust Center resource category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: DeleteTrustCenterResourceCategoryData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResourceCategory({
          client: api.client,
          path: {
            slugId: opts.slugId,
            categoryId: opts.categoryId,
          },
        }),
      );
    });

  const resources = trustCenters
    .command("resources")
    .description("Manage resources");

  resources
    .command("list")
    .description("List Trust Center resources")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterResourcesData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResources({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  resources
    .command("create")
    .description("Create Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--file <path>", "File")
    .requiredOption("--title <text>", "Title of the Trust Center document.")
    .requiredOption(
      "--is-public <boolean>",
      "Boolean determining whether the document is publicly available.: true, false",
    )
    .option("--description <text>", "Description of the uploaded document.")
    .action(async (opts: CreateTrustCenterResourceData["path"] & Omit<NonNullable<CreateTrustCenterResourceData["body"]>, "file"> & { file: string }) => {
      const file = await readBinaryFile(opts.file);
      await runSdk(getFlags, (api) =>
        createTrustCenterResource({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body: {
            file,
            title: opts.title,
            isPublic: opts.isPublic,
            description: opts.description,
          },
        }),
      );
    });

  resources
    .command("get")
    .description("Get Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .action(async (opts: GetTrustCenterResourceData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterResource({
          client: api.client,
          path: {
            slugId: opts.slugId,
            resourceId: opts.resourceId,
          },
        }),
      );
    });

  addJsonFileOptions(
    resources
      .command("update")
      .description("Update Trust Center document")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--resource-id <id>", "Resource ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title: string — Title of the Trust Center document.
  isPublic: boolean — Boolean determining whether the document is publicly available.
  description: string — Description of the uploaded document.
`,
    )
    .action(async (opts: UpdateTrustCenterResourceData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterResourceData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterResource({
          client: api.client,
          path: {
            slugId: opts.slugId,
            resourceId: opts.resourceId,
          },
          body,
        }),
      );
    });

  resources
    .command("delete")
    .description("Delete Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .action(async (opts: DeleteTrustCenterResourceData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResource({
          client: api.client,
          path: {
            slugId: opts.slugId,
            resourceId: opts.resourceId,
          },
        }),
      );
    });

  resources
    .command("get-media")
    .description("Get uploaded media for Trust Center document")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .option("--output <path>", "Write downloaded bytes to file path (default stdout)")
    .action(async (opts: GetTrustCenterResourceMediaData["path"] & { output?: string }) => {
      await withClient(getFlags, async (api, flags) => {
        const result = await getTrustCenterResourceMedia({
          client: api.client,
          parseAs: "blob",
          path: {
            slugId: opts.slugId,
            resourceId: opts.resourceId,
          },
        });
        if (result.error) throw result.error;
        const dest = opts.output?.trim();
        await writeDownloadedMedia(result.data, dest);
        if (dest) printResponse({ savedTo: dest }, flags);
      });
    });

  const subprocessors = trustCenters
    .command("subprocessors")
    .description("Manage subprocessors");

  subprocessors
    .command("list")
    .description("List Trust Center subprocessors")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: ListTrustCenterSubprocessorsData["path"]) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubprocessors({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
        }),
      );
    });

  addJsonFileOptions(
    subprocessors
      .command("create")
      .description("Create Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Name of the subprocessor.
  url: string — URL of the subprocessor.
  description: string — Description of the subprocessor.
  location: string — Where this subprocessor is deployed.
  purpose: string — The purpose that the subprocessor serves.
`,
    )
    .action(async (opts: CreateTrustCenterSubprocessorData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateTrustCenterSubprocessorData["body"];
      await runSdk(getFlags, (api) =>
        createTrustCenterSubprocessor({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  subprocessors
    .command("get")
    .description("Get Trust Center subprocessor")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subprocessor-id <id>", "Subprocessor ID")
    .action(async (opts: GetTrustCenterSubprocessorData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubprocessor({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subprocessorId: opts.subprocessorId,
          },
        }),
      );
    });

  addJsonFileOptions(
    subprocessors
      .command("update")
      .description("Update Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subprocessor-id <id>", "Subprocessor ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  description: string — What to set the subprocessor description to. If null is passed in, the subprocessor's current description is unset.
  location: string — What to set the subprocessor location to. If null is passed in, the subprocessor's current description is unset.
  purpose: string — What to set the subprocessor purpose to. If null is passed in, the subprocessor's current description is unset.
`,
    )
    .action(async (opts: UpdateTrustCenterSubprocessorData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterSubprocessorData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterSubprocessor({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subprocessorId: opts.subprocessorId,
          },
          body,
        }),
      );
    });

  subprocessors
    .command("delete")
    .description("Delete Trust Center subprocessor")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subprocessor-id <id>", "Subprocessor ID")
    .action(async (opts: DeleteTrustCenterSubprocessorData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubprocessor({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subprocessorId: opts.subprocessorId,
          },
        }),
      );
    });

  const subscriberGroups = trustCenters
    .command("subscriber-groups")
    .description("Manage subscriber groups");

  addJsonFileOptions(
    subscriberGroups
      .command("create")
      .description("Create Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Name of the subscriber group.
  subscriberIds (required): array — List of subscriber IDs in the group.
  subscriberIds[]: string
`,
    )
    .action(async (opts: CreateTrustCenterSubscriberGroupData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateTrustCenterSubscriberGroupData["body"];
      await runSdk(getFlags, (api) =>
        createTrustCenterSubscriberGroup({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  addPaginationOptions(
    subscriberGroups
      .command("list")
      .description("List Trust Center subscriber groups")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .action(async (opts: ListTrustCenterSubscriberGroupsData["path"] & NonNullable<ListTrustCenterSubscriberGroupsData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscriberGroups({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
          },
        }),
      );
    });

  addJsonFileOptions(
    subscriberGroups
      .command("update")
      .description("Edit Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subscriber-group-id <id>", "Subscriber group ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  name (required): string — Updated name of the subscriber group.
`,
    )
    .action(async (opts: UpdateTrustCenterSubscriberGroupData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterSubscriberGroupData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterSubscriberGroup({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberGroupId: opts.subscriberGroupId,
          },
          body,
        }),
      );
    });

  subscriberGroups
    .command("delete")
    .description("Delete Trust Center subscriber group")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-group-id <id>", "Subscriber group ID")
    .action(async (opts: DeleteTrustCenterSubscriberGroupData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubscriberGroup({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberGroupId: opts.subscriberGroupId,
          },
        }),
      );
    });

  subscriberGroups
    .command("get")
    .description("Get Trust Center subscriber group")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-group-id <id>", "Subscriber group ID")
    .action(async (opts: GetTrustCenterSubscriberGroupData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubscriberGroup({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberGroupId: opts.subscriberGroupId,
          },
        }),
      );
    });

  const subscribers = trustCenters
    .command("subscribers")
    .description("Manage subscribers");

  addPaginationOptions(
    subscribers
      .command("list")
      .description("List Trust Center subscribers")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option("--customer-trust-account-id <id>", "Customer Trust account ID"),
  )
    .action(async (opts: ListTrustCenterSubscribersData["path"] & NonNullable<ListTrustCenterSubscribersData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscribers({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
            customerTrustAccountId: opts.customerTrustAccountId,
          },
        }),
      );
    });

  addJsonFileOptions(
    subscribers
      .command("create")
      .description("Create Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  email (required): string — Email of the subscriber.
  customerTrustAccountId: string — Optional: Link subscriber to a customer trust account by ID.
  shouldSkipEmailVerification: boolean — When true, the subscriber is created as already verified and no verification email is sent. Defaults to false.
`,
    )
    .action(async (opts: CreateTrustCenterSubscriberData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateTrustCenterSubscriberData["body"];
      await runSdk(getFlags, (api) =>
        createTrustCenterSubscriber({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  subscribers
    .command("get")
    .description("Get Trust Center subscriber")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-id <id>", "Subscriber ID")
    .action(async (opts: GetTrustCenterSubscriberData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubscriber({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberId: opts.subscriberId,
          },
        }),
      );
    });

  subscribers
    .command("delete")
    .description("Delete Trust Center subscriber")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-id <id>", "Subscriber ID")
    .action(async (opts: DeleteTrustCenterSubscriberData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubscriber({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberId: opts.subscriberId,
          },
        }),
      );
    });

  const subscribersGroups = subscribers
    .command("groups")
    .description("Manage groups");

  addJsonFileOptions(
    subscribersGroups
      .command("set")
      .description("Set groups for a Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subscriber-id <id>", "Subscriber ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  groupIds (required): array — Group IDs to set for the subscriber. The subscriber will be removed from any groups not included in this list.
  groupIds[]: string
`,
    )
    .action(async (opts: UpsertGroupsForTrustCenterSubscriberData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertGroupsForTrustCenterSubscriberData["body"];
      await runSdk(getFlags, (api) =>
        upsertGroupsForTrustCenterSubscriber({
          client: api.client,
          path: {
            slugId: opts.slugId,
            subscriberId: opts.subscriberId,
          },
          body,
        }),
      );
    });

  const updates = trustCenters
    .command("updates")
    .description("Manage updates");

  addPaginationOptions(
    updates
      .command("list")
      .description("List Trust Center updates")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .action(async (opts: ListTrustCenterUpdatesData["path"] & NonNullable<ListTrustCenterUpdatesData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterUpdates({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
          },
        }),
      );
    });

  addJsonFileOptions(
    updates
      .command("create")
      .description("Create Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title (required): string — Title of the update.
  description (required): string — Description of the update.
  category (required): GENERAL, COMPLIANCE, SECURITY, PRIVACY, INCIDENT, ROADMAP — Category of the update.
  visibilityType: PUBLIC, PRIVATE — Visibility type of the update.
  notifiedEmails: array — Additional one-off email addresses to notify. These are always sent regardless of \`notificationTarget\`.
  notifiedEmails[]: string
  notificationTarget: ALL, GROUPS, NONE — Controls which Trust Center subscribers are notified. - \`ALL\`: notifies all active subscribers - \`GROUPS\`: notifies only subscribers in the specified \`subscriberGroupIds\` - \`NONE\`: no subscribers are notified Note: \`notifiedEmails\` are always sent regardless of this value.
  subscriberGroupIds: array — IDs of subscriber groups to notify. Required when \`notificationTarget\` is \`GROUPS\`.
  subscriberGroupIds[]: string
`,
    )
    .action(async (opts: CreateTrustCenterUpdateData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as CreateTrustCenterUpdateData["body"];
      await runSdk(getFlags, (api) =>
        createTrustCenterUpdate({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  updates
    .command("get")
    .description("Get Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <timestamp>", "Update ID; ISO 8601 timestamp")
    .action(async (opts: GetTrustCenterUpdateData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterUpdate({
          client: api.client,
          path: {
            slugId: opts.slugId,
            updateId: opts.updateId,
          },
        }),
      );
    });

  addJsonFileOptions(
    updates
      .command("update")
      .description("Update Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--update-id <timestamp>", "Update ID; ISO 8601 timestamp"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  title (required): string — Title of the update.
  description (required): string — Description of the update.
  category (required): GENERAL, COMPLIANCE, SECURITY, PRIVACY, INCIDENT, ROADMAP — Category of the update.
  visibilityType: PUBLIC, PRIVATE — Visibility type of the update.
`,
    )
    .action(async (opts: UpdateTrustCenterUpdateData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterUpdateData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterUpdate({
          client: api.client,
          path: {
            slugId: opts.slugId,
            updateId: opts.updateId,
          },
          body,
        }),
      );
    });

  updates
    .command("delete")
    .description("Delete Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <timestamp>", "Update ID; ISO 8601 timestamp")
    .action(async (opts: DeleteTrustCenterUpdateData["path"]) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterUpdate({
          client: api.client,
          path: {
            slugId: opts.slugId,
            updateId: opts.updateId,
          },
        }),
      );
    });

  updates
    .command("notify-all-subscribers")
    .description("Send Trust Center update notifications to all subscribers")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <timestamp>", "Update ID; ISO 8601 timestamp")
    .action(async (opts: SendNotificationsToAllSubscribersData["path"]) => {
      await runSdk(getFlags, (api) =>
        sendNotificationsToAllSubscribers({
          client: api.client,
          path: {
            slugId: opts.slugId,
            updateId: opts.updateId,
          },
        }),
      );
    });

  addJsonFileOptions(
    updates
      .command("notify-specific-subscribers")
      .description("Send Trust Center update notifications to specific subscribers")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--update-id <timestamp>", "Update ID; ISO 8601 timestamp"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  emails (required): array — Additional email addresses to notify about this Trust Center update in addition to the existing Trust Center subscribers. Duplicate emails are deduplicated to ensure each recipient gets only one notification.
  emails[]: string
  subscriberGroupIds (required): array — IDs of subscriber groups to notify. When \`customerTrustAccounts\` is also provided, only subscribers in these groups whose linked account matches are notified.
  subscriberGroupIds[]: string
  customerTrustAccounts: object — Optional account filters. When provided, only subscribers in \`subscriberGroupIds\` whose linked account matches all specified filters are notified.
  customerTrustAccounts.customFieldsFilter: array — Filter accounts by custom field label/value pairs. When \`value\` is an array, accounts matching any of the values are included. When multiple entries are provided, accounts must satisfy all of them.
  customerTrustAccounts.customFieldsFilter[]: object — A single custom field filter condition.
  customerTrustAccounts.customFieldsFilter[].label (required): string — The custom field label.
  customerTrustAccounts.customFieldsFilter[].value (required): string | array
  customerTrustAccounts.customFieldsFilter[].value[]: string
  customerTrustAccounts.tagsByCategory: array — Narrow the candidate accounts resolved from \`customFieldsFilter\` to those with matching tags. Within a category entry, accounts matching any of the \`tagIds\` are included. When multiple entries are provided, accounts must satisfy all of them.
  customerTrustAccounts.tagsByCategory[]: object
  customerTrustAccounts.tagsByCategory[].categoryId (required): string — The tag category ID
  customerTrustAccounts.tagsByCategory[].tagIds (required): array — Tag IDs to assign. An empty array removes all tags for the category.
  customerTrustAccounts.tagsByCategory[].tagIds[]: string
`,
    )
    .action(async (opts: SendTrustCenterUpdateNotificationsData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as SendTrustCenterUpdateNotificationsData["body"];
      await runSdk(getFlags, (api) =>
        sendTrustCenterUpdateNotifications({
          client: api.client,
          path: {
            slugId: opts.slugId,
            updateId: opts.updateId,
          },
          body,
        }),
      );
    });

  const videos = trustCenters
    .command("videos")
    .description("Manage videos");

  addJsonFileOptions(
    videos
      .command("set")
      .description("Set Trust Center videos")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  videos (required): array — The videos to display on the Trust Center. Replaces all existing videos.
  videos[]: object
  videos[].url (required): string — Full video URL (e.g. "https://www.youtube.com/watch?v=dQw4w9WgXcQ" or "https://vimeo.com/123456"). Supported platforms: YouTube, Vimeo.
  videos[].title (required): string — Title of the video.
  videos[].description: string — Description of the video.
`,
    )
    .action(async (opts: UpsertTrustCenterVideosData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpsertTrustCenterVideosData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterVideos({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  const viewers = trustCenters
    .command("viewers")
    .description("Manage viewers");

  addPaginationOptions(
    viewers
      .command("list")
      .description("List Trust Center viewers")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--include-removed <boolean>",
        "Include removed (true/false) (API default: true)",
        (value) => parseOptionalBoolString(value, "include-removed"),
      ),
  )
    .action(async (opts: ListTrustCenterViewersData["path"] & NonNullable<ListTrustCenterViewersData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterViewers({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          query: {
            ...paginationQuery(opts),
            includeRemoved: opts.includeRemoved,
          },
        }),
      );
    });

  addJsonFileOptions(
    viewers
      .command("create")
      .description("Add Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  email (required): string — Email of the viewer.
  name (required): string — Name of the viewer.
  companyName (required): string — Name of the viewer's company.
  isNdaRequired (required): boolean — Whether to require an NDA for the viewer.
  expirationDate: ISO 8601 timestamp — The date access should expire for this viewer. If a date isn't provided, access will not expire.
  resourceIds: array — Identifiers for the resources that this viewer should have access to. If this field is omitted, the viewer will have access to all resources on the Trust Center.
  resourceIds[]: string
  accessLevel (required): FULL_ACCESS, PARTIAL_ACCESS — Access level for the viewer.
  customerTrustAccountId: string — ID of a Customer Trust Account to associate with this viewer.
`,
    )
    .action(async (opts: AddTrustCenterViewerData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as AddTrustCenterViewerData["body"];
      await runSdk(getFlags, (api) =>
        addTrustCenterViewer({
          client: api.client,
          path: {
            slugId: opts.slugId,
          },
          body,
        }),
      );
    });

  viewers
    .command("get")
    .description("Get Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: GetTrustCenterViewerData["path"]) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterViewer({
          client: api.client,
          path: {
            slugId: opts.slugId,
            viewerId: opts.viewerId,
          },
        }),
      );
    });

  viewers
    .command("delete")
    .description("Remove Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: RemoveTrustCenterViewerData["path"]) => {
      await runSdk(getFlags, (api) =>
        removeTrustCenterViewer({
          client: api.client,
          path: {
            slugId: opts.slugId,
            viewerId: opts.viewerId,
          },
        }),
      );
    });

  addJsonFileOptions(
    viewers
      .command("update")
      .description("Update Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--viewer-id <id>", "Viewer ID"),
  )
    .addHelpText(
      "after",
      `
JSON payload fields (use --json or --file):
  accessLevel: FULL_ACCESS, PARTIAL_ACCESS — Access level for the viewer.
  resourceIds: array — Identifiers for the resources that this viewer should have access to.
  resourceIds[]: string
  expirationDate: ISO 8601 timestamp — The date access should expire for this viewer. Set to null to remove expiration.
  isNdaRequired: boolean — Whether to require an NDA for the viewer.
  customerTrustAccountId: string — ID of a Customer Trust Account to associate with this viewer. Set to null to remove the association. Omit to leave unchanged.
`,
    )
    .action(async (opts: UpdateTrustCenterViewerData["path"] & { json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as UpdateTrustCenterViewerData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterViewer({
          client: api.client,
          path: {
            slugId: opts.slugId,
            viewerId: opts.viewerId,
          },
          body,
        }),
      );
    });

  viewers
    .command("send-invite-reminder")
    .description("Send Trust Center viewer invite reminder")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: SendTrustCenterViewerInviteReminderData["path"]) => {
      await runSdk(getFlags, (api) =>
        sendTrustCenterViewerInviteReminder({
          client: api.client,
          path: {
            slugId: opts.slugId,
            viewerId: opts.viewerId,
          },
        }),
      );
    });

}
