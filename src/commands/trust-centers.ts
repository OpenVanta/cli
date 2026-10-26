import type { Command } from "commander";
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
  listTrustCenterSubscriberGroups,
  createTrustCenterSubscriberGroup,
  getTrustCenterSubscriberGroup,
  updateTrustCenterSubscriberGroup,
  deleteTrustCenterSubscriberGroup,
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
  updateTrustCenterViewer,
  removeTrustCenterViewer,
  sendTrustCenterViewerInviteReminder,
} from "../generated/sdk.gen.js";
import type {
  UpdateTrustCenterData,
  ApproveTrustCenterAccessRequestData,
  DenyTrustCenterAccessRequestData,
  ListTrustCenterActivityEventsData,
  CreateComplianceFrameworkData,
  UpdateComplianceFrameworkData,
  AddTrustCenterControlCategoryData,
  UpsertTrustCenterControlCategoriesOrderData,
  UpdateTrustCenterControlCategoryData,
  UpdateTrustCenterControlsInCategoryData,
  UpsertTrustCenterControlsInCategoryOrderData,
  AddControlToTrustCenterData,
  BulkAddTagsToControlsData,
  BulkRemoveTagsFromControlsData,
  UpsertTrustCenterDataCollectedData,
  AddTrustCenterFaqCategoryData,
  UpdateTrustCenterFaqCategoryData,
  CreateTrustCenterFaqData,
  UpdateTrustCenterFaqData,
  AddTrustCenterResourceCategoryData,
  UpsertTrustCenterResourceCategoriesOrderData,
  UpdateTrustCenterResourceCategoryData,
  UpdateTrustCenterResourceData,
  CreateTrustCenterSubprocessorData,
  UpdateTrustCenterSubprocessorData,
  CreateTrustCenterSubscriberGroupData,
  UpdateTrustCenterSubscriberGroupData,
  CreateTrustCenterSubscriberData,
  UpsertGroupsForTrustCenterSubscriberData,
  CreateTrustCenterUpdateData,
  UpdateTrustCenterUpdateData,
  SendTrustCenterUpdateNotificationsData,
  UpsertTrustCenterVideosData,
  AddTrustCenterViewerData,
  UpdateTrustCenterViewerData,
} from "../generated/types.gen.js";
import { printResponse } from "../output.js";
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
  writeDownloadedMedia,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCentersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const trustCenters = program
    .command("trust-centers")
    .description("Manage Trust Centers");

  trustCenters
    .command("get")
    .description("Get a Trust Center by slug ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenter({ client: api.client, path: { slugId: opts.slugId } }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update")
      .description("Update a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateTrustCenterData["body"];
    await runSdk(getFlags, (api) =>
      updateTrustCenter({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addPaginationOptions(
    trustCenters
      .command("list-access-requests")
      .description("List access requests for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterAccessRequests({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  trustCenters
    .command("get-access-request")
    .description("Get a Trust Center access request by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--access-request-id <id>", "Access request ID")
    .action(async (opts: { slugId: string; accessRequestId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.accessRequestId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("approve-access-request")
      .description("Approve a Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--access-request-id <id>", "Access request ID"),
  ).action(
    async (opts: {
      slugId: string;
      accessRequestId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as ApproveTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        approveTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.accessRequestId },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("deny-access-request")
      .description("Deny a Trust Center access request")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--access-request-id <id>", "Access request ID"),
  ).action(
    async (opts: {
      slugId: string;
      accessRequestId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as DenyTrustCenterAccessRequestData["body"];
      await runSdk(getFlags, (api) =>
        denyTrustCenterAccessRequest({
          client: api.client,
          path: { slugId: opts.slugId, accessRequestId: opts.accessRequestId },
          body,
        }),
      );
    },
  );

  addPaginationOptions(
    trustCenters
      .command("list-activity")
      .description("List activity for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--event-types-matches-any <type>",
        "Filter by event types: PAGE_VIEW, RESOURCE_DOWNLOAD, RESOURCE_VIEW, VIDEO_PLAY (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--after-date <timestamp>",
        "Only include activity events that occurred on or after the specified date and time (ISO 8601 timestamp)",
      )
      .option(
        "--before-date <timestamp>",
        "Only include activity events that occurred before the specified date and time (ISO 8601 timestamp)",
      ),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
      eventTypesMatchesAny: NonNullable<
        NonNullable<
          ListTrustCenterActivityEventsData["query"]
        >["eventTypesMatchesAny"]
      >;
      afterDate?: string;
      beforeDate?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterActivityEvents({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            eventTypesMatchesAny: opts.eventTypesMatchesAny,
            afterDate: opts.afterDate,
            beforeDate: opts.beforeDate,
          },
        }),
      );
    },
  );

  addPaginationOptions(
    trustCenters
      .command("list-chatbot-conversations")
      .description("List Trust Center chatbot conversations")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--search-string <query>",
        "Search conversations by message content",
      ),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
      searchString?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listChatbotConversations({
          client: api.client,
          path: { slugId: opts.slugId },
          query: { ...paginationQuery(opts), searchString: opts.searchString },
        }),
      );
    },
  );

  trustCenters
    .command("get-chatbot-conversation")
    .description("Get messages for a Trust Center chatbot conversation")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--conversation-id <id>", "Conversation ID")
    .action(async (opts: { slugId: string; conversationId: string }) => {
      await runSdk(getFlags, (api) =>
        getChatbotConversationMessages({
          client: api.client,
          path: { slugId: opts.slugId, conversationId: opts.conversationId },
        }),
      );
    });

  trustCenters
    .command("list-compliance-frameworks")
    .description("List compliance frameworks for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listComplianceFrameworks({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("create-compliance-framework")
      .description("Create a Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateComplianceFrameworkData["body"];
    await runSdk(getFlags, (api) =>
      createComplianceFramework({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("update-compliance-framework")
      .description("Update a Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--framework-id <id>", "Framework ID"),
  ).action(
    async (opts: {
      slugId: string;
      frameworkId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateComplianceFrameworkData["body"];
      await runSdk(getFlags, (api) =>
        updateComplianceFramework({
          client: api.client,
          path: { slugId: opts.slugId, frameworkId: opts.frameworkId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-compliance-framework")
    .description("Delete a Trust Center compliance framework")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--framework-id <id>", "Framework ID")
    .action(async (opts: { slugId: string; frameworkId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteComplianceFramework({
          client: api.client,
          path: { slugId: opts.slugId, frameworkId: opts.frameworkId },
        }),
      );
    });

  trustCenters
    .command("upload-compliance-framework-badge")
    .description("Upload a badge for a Trust Center compliance framework")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--framework-id <id>", "Framework ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .action(
      async (opts: { slugId: string; frameworkId: string; file: string }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          uploadComplianceFrameworkBadge({
            client: api.client,
            path: { slugId: opts.slugId, frameworkId: opts.frameworkId },
            body: { file },
          }),
        );
      },
    );

  trustCenters
    .command("list-control-categories")
    .description("List control categories for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategories({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("create-control-category")
      .description("Create a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterControlCategoryData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterControlCategory({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("set-control-category-order")
      .description("Reorder Trust Center control categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterControlCategoriesOrderData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterControlCategoriesOrder({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-control-category")
    .description("Get a Trust Center control category by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: { slugId: string; categoryId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-control-category")
      .description("Update a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterControlCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-control-category")
    .description("Delete a Trust Center control category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: { slugId: string; categoryId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControlCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-control-category-controls")
      .description("Add or remove controls in a Trust Center control category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterControlsInCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterControlsInCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("set-control-category-control-order")
      .description("Reorder Trust Center control category controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpsertTrustCenterControlsInCategoryOrderData["body"];
      await runSdk(getFlags, (api) =>
        upsertTrustCenterControlsInCategoryOrder({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  addPaginationOptions(
    trustCenters
      .command("list-controls")
      .description("List controls for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterControls({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("add-control")
      .description("Add a control to a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddControlToTrustCenterData["body"];
    await runSdk(getFlags, (api) =>
      addControlToTrustCenter({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("add-control-tags")
      .description("Add tags to Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as BulkAddTagsToControlsData["body"];
    await runSdk(getFlags, (api) =>
      bulkAddTagsToControls({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("remove-control-tags")
      .description("Remove tags from Trust Center controls")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as BulkRemoveTagsFromControlsData["body"];
    await runSdk(getFlags, (api) =>
      bulkRemoveTagsFromControls({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-control")
    .description("Get a Trust Center control by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--control-id <id>", "Control ID")
    .action(async (opts: { slugId: string; controlId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterControl({
          client: api.client,
          path: { slugId: opts.slugId, controlId: opts.controlId },
        }),
      );
    });

  trustCenters
    .command("remove-control")
    .description("Remove a control from a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--control-id <id>", "Control ID")
    .action(async (opts: { slugId: string; controlId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterControl({
          client: api.client,
          path: { slugId: opts.slugId, controlId: opts.controlId },
        }),
      );
    });

  trustCenters
    .command("list-data-collected")
    .description("List data collected for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterDataCollected({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("set-data-collected")
      .description("Set data collected for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterDataCollectedData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterDataCollected({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("list-faq-categories")
    .description("List FAQ categories for a Trust Center")
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
    trustCenters
      .command("create-faq-category")
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
    trustCenters
      .command("update-faq-category")
      .description("Update a Trust Center FAQ category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "FAQ category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
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
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-faq-category")
    .description("Delete a Trust Center FAQ category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "FAQ category ID")
    .action(async (opts: { slugId: string; categoryId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaqCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
        }),
      );
    });

  trustCenters
    .command("list-faqs")
    .description("List FAQs for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterFaqs({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("create-faq")
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

  trustCenters
    .command("get-faq")
    .description("Get a Trust Center FAQ by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--faq-id <id>", "FAQ ID")
    .action(async (opts: { slugId: string; faqId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterFaq({
          client: api.client,
          path: { slugId: opts.slugId, faqId: opts.faqId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-faq")
      .description("Update a Trust Center FAQ")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--faq-id <id>", "FAQ ID"),
  ).action(
    async (opts: {
      slugId: string;
      faqId: string;
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
          path: { slugId: opts.slugId, faqId: opts.faqId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-faq")
    .description("Delete a Trust Center FAQ")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--faq-id <id>", "FAQ ID")
    .action(async (opts: { slugId: string; faqId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterFaq({
          client: api.client,
          path: { slugId: opts.slugId, faqId: opts.faqId },
        }),
      );
    });

  trustCenters
    .command("upload-favicon")
    .description("Upload a favicon for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--favicon <path>", "Path to favicon file to upload")
    .action(async (opts: { slugId: string; favicon: string }) => {
      const favicon = await readBinaryFile(opts.favicon);
      await runSdk(getFlags, (api) =>
        uploadTrustCenterFavicon({
          client: api.client,
          path: { slugId: opts.slugId },
          body: { favicon },
        }),
      );
    });

  addPaginationOptions(
    trustCenters
      .command("list-historical-access-requests")
      .description("List historical access requests for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterHistoricalAccessRequests({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  trustCenters
    .command("list-resource-categories")
    .description("List resource categories for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResourceCategories({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("create-resource-category")
      .description("Create a Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterResourceCategoryData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterResourceCategory({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("set-resource-category-order")
      .description("Reorder Trust Center resource categories")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterResourceCategoriesOrderData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterResourceCategoriesOrder({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    trustCenters
      .command("update-resource-category")
      .description("Update a Trust Center resource category")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--category-id <id>", "Category ID"),
  ).action(
    async (opts: {
      slugId: string;
      categoryId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterResourceCategoryData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterResourceCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-resource-category")
    .description("Delete a Trust Center resource category")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--category-id <id>", "Category ID")
    .action(async (opts: { slugId: string; categoryId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResourceCategory({
          client: api.client,
          path: { slugId: opts.slugId, categoryId: opts.categoryId },
        }),
      );
    });

  trustCenters
    .command("list-resources")
    .description("List resources for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterResources({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  trustCenters
    .command("upload-resource")
    .description("Upload a resource for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--title <title>", "Title of the Trust Center document")
    .requiredOption(
      "--is-public <bool>",
      "Whether the document is publicly available (true/false)",
    )
    .option("--description <text>", "Description of the uploaded document")
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

  trustCenters
    .command("get-resource")
    .description("Get a Trust Center resource by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .action(async (opts: { slugId: string; resourceId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterResource({
          client: api.client,
          path: { slugId: opts.slugId, resourceId: opts.resourceId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-resource")
      .description("Update a Trust Center resource")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--resource-id <id>", "Resource ID"),
  ).action(
    async (opts: {
      slugId: string;
      resourceId: string;
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
          path: { slugId: opts.slugId, resourceId: opts.resourceId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-resource")
    .description("Delete a Trust Center resource")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .action(async (opts: { slugId: string; resourceId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterResource({
          client: api.client,
          path: { slugId: opts.slugId, resourceId: opts.resourceId },
        }),
      );
    });

  trustCenters
    .command("download-resource-media")
    .description("Download the media for a Trust Center resource")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--resource-id <id>", "Resource ID")
    .option(
      "--output <path>",
      "Write downloaded bytes to file path (default stdout)",
    )
    .action(
      async (opts: { slugId: string; resourceId: string; output?: string }) => {
        await withClient(getFlags, async (api, flags) => {
          const result = await getTrustCenterResourceMedia({
            client: api.client,
            path: { slugId: opts.slugId, resourceId: opts.resourceId },
          });
          if (result.error) throw result.error;
          const dest = opts.output?.trim();
          await writeDownloadedMedia(result.data, dest);
          if (dest) printResponse({ savedTo: dest }, flags);
        });
      },
    );

  trustCenters
    .command("list-subprocessors")
    .description("List subprocessors for a Trust Center")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubprocessors({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("create-subprocessor")
      .description("Create a Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubprocessorData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubprocessor({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-subprocessor")
    .description("Get a Trust Center subprocessor by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subprocessor-id <id>", "Subprocessor ID")
    .action(async (opts: { slugId: string; subprocessorId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.subprocessorId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-subprocessor")
      .description("Update a Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subprocessor-id <id>", "Subprocessor ID"),
  ).action(
    async (opts: {
      slugId: string;
      subprocessorId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterSubprocessorData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.subprocessorId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-subprocessor")
    .description("Delete a Trust Center subprocessor")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subprocessor-id <id>", "Subprocessor ID")
    .action(async (opts: { slugId: string; subprocessorId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.subprocessorId },
        }),
      );
    });

  addPaginationOptions(
    trustCenters
      .command("list-subscriber-groups")
      .description("List subscriber groups for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscriberGroups({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("create-subscriber-group")
      .description("Create a Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubscriberGroupData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubscriberGroup({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-subscriber-group")
    .description("Get a Trust Center subscriber group by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-group-id <id>", "Subscriber group ID")
    .action(async (opts: { slugId: string; subscriberGroupId: string }) => {
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

  addJsonFileOptions(
    trustCenters
      .command("update-subscriber-group")
      .description("Update a Trust Center subscriber group")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subscriber-group-id <id>", "Subscriber group ID"),
  ).action(
    async (opts: {
      slugId: string;
      subscriberGroupId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterSubscriberGroupData["body"];
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
    },
  );

  trustCenters
    .command("delete-subscriber-group")
    .description("Delete a Trust Center subscriber group")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-group-id <id>", "Subscriber group ID")
    .action(async (opts: { slugId: string; subscriberGroupId: string }) => {
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

  addPaginationOptions(
    trustCenters
      .command("list-subscribers")
      .description("List subscribers for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--customer-trust-account-id <id>",
        "Filter by customer trust account ID",
      ),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
      customerTrustAccountId?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubscribers({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            customerTrustAccountId: opts.customerTrustAccountId,
          },
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("create-subscriber")
      .description("Create a Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubscriberData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubscriber({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-subscriber")
    .description("Get a Trust Center subscriber by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-id <id>", "Subscriber ID")
    .action(async (opts: { slugId: string; subscriberId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.subscriberId },
        }),
      );
    });

  trustCenters
    .command("delete-subscriber")
    .description("Delete a Trust Center subscriber")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--subscriber-id <id>", "Subscriber ID")
    .action(async (opts: { slugId: string; subscriberId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.subscriberId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("set-subscriber-groups")
      .description("Set groups for a Trust Center subscriber")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--subscriber-id <id>", "Subscriber ID"),
  ).action(
    async (opts: {
      slugId: string;
      subscriberId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpsertGroupsForTrustCenterSubscriberData["body"];
      await runSdk(getFlags, (api) =>
        upsertGroupsForTrustCenterSubscriber({
          client: api.client,
          path: { slugId: opts.slugId, subscriberId: opts.subscriberId },
          body,
        }),
      );
    },
  );

  addPaginationOptions(
    trustCenters
      .command("list-updates")
      .description("List updates for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterUpdates({
          client: api.client,
          path: { slugId: opts.slugId },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("create-update")
      .description("Create a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterUpdateData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterUpdate({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-update")
    .description("Get a Trust Center update by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <id>", "Update ID")
    .action(async (opts: { slugId: string; updateId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.updateId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-update")
      .description("Update a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--update-id <id>", "Update ID"),
  ).action(
    async (opts: {
      slugId: string;
      updateId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterUpdateData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.updateId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-update")
    .description("Delete a Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <id>", "Update ID")
    .action(async (opts: { slugId: string; updateId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterUpdate({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.updateId },
        }),
      );
    });

  trustCenters
    .command("notify-update-all-subscribers")
    .description("Notify all subscribers for a Trust Center update")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--update-id <id>", "Update ID")
    .action(async (opts: { slugId: string; updateId: string }) => {
      await runSdk(getFlags, (api) =>
        sendNotificationsToAllSubscribers({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.updateId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("notify-update-specific-subscribers")
      .description("Notify specific subscribers for a Trust Center update")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--update-id <id>", "Update ID"),
  ).action(
    async (opts: {
      slugId: string;
      updateId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as SendTrustCenterUpdateNotificationsData["body"];
      await runSdk(getFlags, (api) =>
        sendTrustCenterUpdateNotifications({
          client: api.client,
          path: { slugId: opts.slugId, updateId: opts.updateId },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("set-videos")
      .description("Set videos for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpsertTrustCenterVideosData["body"];
    await runSdk(getFlags, (api) =>
      upsertTrustCenterVideos({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addPaginationOptions(
    trustCenters
      .command("list-viewers")
      .description("List viewers for a Trust Center")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--include-removed <bool>",
        "Include removed viewers (true/false; default: true)",
        (value) => parseOptionalBoolString(value, "include-removed"),
      ),
  ).action(
    async (opts: {
      slugId: string;
      pageSize?: number;
      pageCursor?: string;
      includeRemoved?: boolean;
    }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterViewers({
          client: api.client,
          path: { slugId: opts.slugId },
          query: {
            ...paginationQuery(opts),
            includeRemoved: opts.includeRemoved,
          },
        }),
      );
    },
  );

  addJsonFileOptions(
    trustCenters
      .command("create-viewer")
      .description("Create a Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddTrustCenterViewerData["body"];
    await runSdk(getFlags, (api) =>
      addTrustCenterViewer({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  trustCenters
    .command("get-viewer")
    .description("Get a Trust Center viewer by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; viewerId: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.viewerId },
        }),
      );
    });

  addJsonFileOptions(
    trustCenters
      .command("update-viewer")
      .description("Update a Trust Center viewer")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--viewer-id <id>", "Viewer ID"),
  ).action(
    async (opts: {
      slugId: string;
      viewerId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterViewerData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.viewerId },
          body,
        }),
      );
    },
  );

  trustCenters
    .command("delete-viewer")
    .description("Delete a Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; viewerId: string }) => {
      await runSdk(getFlags, (api) =>
        removeTrustCenterViewer({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.viewerId },
        }),
      );
    });

  trustCenters
    .command("send-viewer-invite-reminder")
    .description("Send invite reminder for a Trust Center viewer")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--viewer-id <id>", "Viewer ID")
    .action(async (opts: { slugId: string; viewerId: string }) => {
      await runSdk(getFlags, (api) =>
        sendTrustCenterViewerInviteReminder({
          client: api.client,
          path: { slugId: opts.slugId, viewerId: opts.viewerId },
        }),
      );
    });
}
