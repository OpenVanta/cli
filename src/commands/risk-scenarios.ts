import type { Command } from "commander";
import {
  listRiskScenario,
  getRiskScenario,
  createRiskScenario,
  updateRiskScenario,
  cancelRiskScenarioApprovalRequest,
  listRiskScenarioControls,
  createRiskScenarioControl,
  updateRiskScenarioControl,
  deleteRiskScenarioControl,
  listAccountMappings,
  addAccountMappings,
  removeAccountMappings,
  listCustomAssetMappings,
  addCustomAssetMappings,
  removeCustomAssetMappings,
  listEnterpriseRiskMappings,
  listIntegrationMappings,
  addIntegrationMappings,
  removeIntegrationMappings,
  listIssueMappings,
  addIssueMappings,
  removeIssueMappings,
  listVendorFindingMappings,
  addVendorFindingMappings,
  removeVendorFindingMappings,
  submitRiskForApproval,
} from "../generated/sdk.gen.js";
import type {
  ListRiskScenarioData,
  CreateRiskScenarioData,
  UpdateRiskScenarioData,
  CreateRiskScenarioControlData,
  UpdateRiskScenarioControlData,
  AddAccountMappingsData,
  RemoveAccountMappingsData,
  AddCustomAssetMappingsData,
  RemoveCustomAssetMappingsData,
  AddIntegrationMappingsData,
  RemoveIntegrationMappingsData,
  AddIssueMappingsData,
  RemoveIssueMappingsData,
  AddVendorFindingMappingsData,
  RemoveVendorFindingMappingsData,
  SubmitRiskForApprovalData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  parseOptionalBoolString,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerRiskScenariosCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const riskScenarios = program
    .command("risk-scenarios")
    .description("Manage risk scenarios");

  addPaginationOptions(
    riskScenarios
      .command("list")
      .description("List risk scenarios")
      .option(
        "--include-ignored <bool>",
        "Include ignored risk scenarios (true/false)",
        (value) => parseOptionalBoolString(value, "include-ignored"),
      )
      .option(
        "--owner-matches-any <owner>",
        'Use "No owner" to filter scenarios without owner assigned (repeatable)',
        collectString,
        [] as string[],
      )
      .option("--search-string <query>", "Search risk scenarios")
      .option(
        "--category-matches-any <category>",
        'Use "Uncategorized" to filter scenarios without any category (repeatable)',
        collectString,
        [] as string[],
      )
      .option(
        "--cia-category-matches-any <category>",
        'Use "Uncategorized" to filter scenarios with none of Confidentiality, Integrity or Availability assigned (repeatable)',
        collectString,
        [] as string[],
      )
      .option(
        "--treatment-type-matches-any <type>",
        'Use "No treatment type" to filter scenarios without treatment specified (repeatable)',
        collectString,
        [] as string[],
      )
      .option(
        "--inherent-score-group-matches-any <group>",
        "Filter by inherent score group: Very low, Low, Med, High, Critical (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--residual-score-group-matches-any <group>",
        "Filter by residual score group: Very low, Low, Med, High, Critical (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--review-status-matches-any <status>",
        "Filter by review status: APPROVED, DRAFT, NOT_REVIEWED, AWAITING_SUBMISSION, PENDING_APPROVAL, REQUESTED_CHANGES (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--type <type>",
        'Filter by risk scenario type. Defaults to "Risk Scenario". Only returns enterprise risks when explicitly set to "Enterprise Risk"',
      )
      .option(
        "--order-by <field>",
        "Order by field (description or createdAt)",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      includeIgnored?: boolean;
      ownerMatchesAny: string[];
      searchString?: string;
      categoryMatchesAny: string[];
      ciaCategoryMatchesAny: NonNullable<
        NonNullable<ListRiskScenarioData["query"]>["ciaCategoryMatchesAny"]
      >;
      treatmentTypeMatchesAny: NonNullable<
        NonNullable<ListRiskScenarioData["query"]>["treatmentTypeMatchesAny"]
      >;
      inherentScoreGroupMatchesAny: NonNullable<
        NonNullable<
          ListRiskScenarioData["query"]
        >["inherentScoreGroupMatchesAny"]
      >;
      residualScoreGroupMatchesAny: NonNullable<
        NonNullable<
          ListRiskScenarioData["query"]
        >["residualScoreGroupMatchesAny"]
      >;
      reviewStatusMatchesAny: NonNullable<
        NonNullable<ListRiskScenarioData["query"]>["reviewStatusMatchesAny"]
      >;
      type?: NonNullable<ListRiskScenarioData["query"]>["type"];
      orderBy?: NonNullable<ListRiskScenarioData["query"]>["orderBy"];
    }) => {
      await runSdk(getFlags, (api) =>
        listRiskScenario({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            includeIgnored: opts.includeIgnored,
            ownerMatchesAny: opts.ownerMatchesAny,
            searchString: opts.searchString,
            categoryMatchesAny: opts.categoryMatchesAny,
            ciaCategoryMatchesAny: opts.ciaCategoryMatchesAny,
            treatmentTypeMatchesAny: opts.treatmentTypeMatchesAny,
            inherentScoreGroupMatchesAny: opts.inherentScoreGroupMatchesAny,
            residualScoreGroupMatchesAny: opts.residualScoreGroupMatchesAny,
            reviewStatusMatchesAny: opts.reviewStatusMatchesAny,
            type: opts.type,
            orderBy: opts.orderBy,
          },
        }),
      );
    },
  );

  riskScenarios
    .command("get")
    .description("Get a risk scenario by ID")
    .requiredOption("--id <id>", "Risk scenario ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getRiskScenario({
          client: api.client,
          path: { riskScenarioId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    riskScenarios.command("create").description("Create a risk scenario"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateRiskScenarioData["body"];
    await runSdk(getFlags, (api) =>
      createRiskScenario({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("update")
      .description("Update a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateRiskScenarioData["body"];
    await runSdk(getFlags, (api) =>
      updateRiskScenario({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  riskScenarios
    .command("cancel-approval-request")
    .description("Cancel approval request for a risk scenario")
    .requiredOption("--id <id>", "Risk scenario ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        cancelRiskScenarioApprovalRequest({
          client: api.client,
          path: { riskScenarioId: opts.id },
        }),
      );
    });

  addPaginationOptions(
    riskScenarios
      .command("list-controls")
      .description("List controls for a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listRiskScenarioControls({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-control")
      .description("Add a control to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateRiskScenarioControlData["body"];
    await runSdk(getFlags, (api) =>
      createRiskScenarioControl({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("update-control")
      .description("Update a risk scenario control")
      .requiredOption("--id <id>", "Risk scenario ID")
      .requiredOption("--control-id <id>", "Control ID"),
  ).action(
    async (opts: {
      id: string;
      controlId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateRiskScenarioControlData["body"];
      await runSdk(getFlags, (api) =>
        updateRiskScenarioControl({
          client: api.client,
          path: { riskScenarioId: opts.id, controlId: opts.controlId },
          body,
        }),
      );
    },
  );

  riskScenarios
    .command("remove-control")
    .description("Remove a control from a risk scenario")
    .requiredOption("--id <id>", "Risk scenario ID")
    .requiredOption("--control-id <id>", "Control ID")
    .action(async (opts: { id: string; controlId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteRiskScenarioControl({
          client: api.client,
          path: { riskScenarioId: opts.id, controlId: opts.controlId },
        }),
      );
    });

  addPaginationOptions(
    riskScenarios
      .command("list-mapping-accounts")
      .description("List accounts mapped to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listAccountMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-mapping-accounts")
      .description("Add account mappings to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"accountsToLink":[{"serviceId":"<integration-id>","accountId":"<connection-id>"}]}\nRequired serviceId and accountId come from integrations list: integrationId and connections[].connectionId. Optional subunitId identifies an organization connection subunit. Find IDs with integrations list.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddAccountMappingsData["body"];
    await runSdk(getFlags, (api) =>
      addAccountMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("remove-mapping-accounts")
      .description("Remove account mappings from a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"accountsToUnlink":[{"serviceId":"<integration-id>","accountId":"<connection-id>"}]}\nRequired serviceId and accountId come from integrations list: integrationId and connections[].connectionId. Optional subunitId identifies an organization connection subunit. Only mappings are removed; the existing resources are kept.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemoveAccountMappingsData["body"];
    await runSdk(getFlags, (api) =>
      removeAccountMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    riskScenarios
      .command("list-mapping-custom-assets")
      .description("List custom assets mapped to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listCustomAssetMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-mapping-custom-assets")
      .description("Add custom asset mappings to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"customAssetIdsToLink":["<id>"]}\nRequired array of existing custom asset IDs. Find IDs with custom-assets list.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddCustomAssetMappingsData["body"];
    await runSdk(getFlags, (api) =>
      addCustomAssetMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("remove-mapping-custom-assets")
      .description("Remove custom asset mappings from a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"customAssetIdsToUnlink":["<id>"]}\nRequired array of existing custom asset IDs. Only mappings are removed; the existing resources are kept.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemoveCustomAssetMappingsData["body"];
    await runSdk(getFlags, (api) =>
      removeCustomAssetMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  riskScenarios
    .command("list-mapping-enterprise-risk")
    .description("List enterprise risk mapped to a risk scenario")
    .requiredOption("--id <id>", "Risk scenario ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        listEnterpriseRiskMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
        }),
      );
    });

  addPaginationOptions(
    riskScenarios
      .command("list-mapping-integrations")
      .description("List integrations mapped to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listIntegrationMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-mapping-integrations")
      .description("Add integration mappings to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"integrationIdsToAdd":["<id>"]}\nRequired array of existing integration IDs. Find IDs with integrations list.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddIntegrationMappingsData["body"];
    await runSdk(getFlags, (api) =>
      addIntegrationMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("remove-mapping-integrations")
      .description("Remove integration mappings from a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"integrationIdsToRemove":["<id>"]}\nRequired array of existing integration IDs. Only mappings are removed; the existing resources are kept.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemoveIntegrationMappingsData["body"];
    await runSdk(getFlags, (api) =>
      removeIntegrationMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    riskScenarios
      .command("list-mapping-issues")
      .description("List issues mapped to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listIssueMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-mapping-issues")
      .description("Add issue mappings to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"issueIdsToLink":["<id>"]}\nRequired array of existing issue IDs. Find IDs with issues list.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddIssueMappingsData["body"];
    await runSdk(getFlags, (api) =>
      addIssueMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("remove-mapping-issues")
      .description("Remove issue mappings from a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"issueIdsToUnlink":["<id>"]}\nRequired array of existing issue IDs. Only mappings are removed; the existing resources are kept.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemoveIssueMappingsData["body"];
    await runSdk(getFlags, (api) =>
      removeIssueMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    riskScenarios
      .command("list-mapping-vendor-findings")
      .description("List vendor findings mapped to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listVendorFindingMappings({
          client: api.client,
          path: { riskScenarioId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    riskScenarios
      .command("add-mapping-vendor-findings")
      .description("Add vendor finding mappings to a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"vendorFindingIdsToLink":["<id>"]}\nRequired array of existing vendor finding IDs. Find IDs with vendors list-findings --id <vendor-id>.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddVendorFindingMappingsData["body"];
    await runSdk(getFlags, (api) =>
      addVendorFindingMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("remove-mapping-vendor-findings")
      .description("Remove vendor finding mappings from a risk scenario")
      .requiredOption("--id <id>", "Risk scenario ID")
      .addHelpText(
        "after",
        '\nJSON payload (--json or --file):\n{"vendorFindingIdsToUnlink":["<id>"]}\nRequired array of existing vendor finding IDs. Only mappings are removed; the existing resources are kept.\n',
      ),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemoveVendorFindingMappingsData["body"];
    await runSdk(getFlags, (api) =>
      removeVendorFindingMappings({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    riskScenarios
      .command("submit-for-approval")
      .description("Submit a risk scenario for approval")
      .requiredOption("--id <id>", "Risk scenario ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SubmitRiskForApprovalData["body"];
    await runSdk(getFlags, (api) =>
      submitRiskForApproval({
        client: api.client,
        path: { riskScenarioId: opts.id },
        body,
      }),
    );
  });
}
