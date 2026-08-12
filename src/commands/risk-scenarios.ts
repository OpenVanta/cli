import type { Command } from "commander";
import {
  cancelRiskScenarioApprovalRequest,
  createRiskScenario,
  createRiskScenarioControl,
  deleteRiskScenarioControl,
  getRiskScenario,
  listRiskScenario,
  listRiskScenarioControls,
  submitRiskForApproval,
  updateRiskScenario,
  updateRiskScenarioControl,
} from "../generated/sdk.gen.js";
import type {
  CreateRiskScenarioControlData,
  CreateRiskScenarioData,
  ReviewStatus,
  RiskScenarioType,
  ScoreGroup,
  SubmitRiskForApprovalData,
  UpdateRiskScenarioControlData,
  UpdateRiskScenarioData,
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
      )
      .option(
        "--owner-matches-any <owner>",
        "Owners to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option("--search-string <query>", "Search string filter")
      .option(
        "--category-matches-any <category>",
        "Categories to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--inherent-score-group-matches-any <group>",
        "Inherent score groups to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--residual-score-group-matches-any <group>",
        "Residual score groups to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--review-status-matches-any <status>",
        "Review statuses to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option("--type <type>", 'Risk scenario type ("Risk Scenario" or "Enterprise Risk")')
      .option("--order-by <field>", "Order by field (description or createdAt)"),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      includeIgnored?: string;
      ownerMatchesAny: string[];
      searchString?: string;
      categoryMatchesAny: string[];
      inherentScoreGroupMatchesAny: string[];
      residualScoreGroupMatchesAny: string[];
      reviewStatusMatchesAny: string[];
      type?: string;
      orderBy?: string;
    }) => {
      const includeIgnored = parseOptionalBoolString(
        opts.includeIgnored,
        "include-ignored",
      );
      const ownerMatchesAny = opts.ownerMatchesAny.filter(Boolean);
      const categoryMatchesAny = opts.categoryMatchesAny.filter(Boolean);
      const inherentScoreGroupMatchesAny =
        opts.inherentScoreGroupMatchesAny.filter(Boolean);
      const residualScoreGroupMatchesAny =
        opts.residualScoreGroupMatchesAny.filter(Boolean);
      const reviewStatusMatchesAny = opts.reviewStatusMatchesAny.filter(Boolean);

      await runSdk(getFlags, (api) =>
        listRiskScenario({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(includeIgnored !== undefined ? { includeIgnored } : {}),
            ...(ownerMatchesAny.length > 0 ? { ownerMatchesAny } : {}),
            ...(opts.searchString?.trim()
              ? { searchString: opts.searchString.trim() }
              : {}),
            ...(categoryMatchesAny.length > 0 ? { categoryMatchesAny } : {}),
            ...(inherentScoreGroupMatchesAny.length > 0
              ? {
                  inherentScoreGroupMatchesAny:
                    inherentScoreGroupMatchesAny as ScoreGroup[],
                }
              : {}),
            ...(residualScoreGroupMatchesAny.length > 0
              ? {
                  residualScoreGroupMatchesAny:
                    residualScoreGroupMatchesAny as ScoreGroup[],
                }
              : {}),
            ...(reviewStatusMatchesAny.length > 0
              ? {
                  reviewStatusMatchesAny:
                    reviewStatusMatchesAny as ReviewStatus[],
                }
              : {}),
            ...(opts.type?.trim()
              ? { type: opts.type.trim() as RiskScenarioType }
              : {}),
            ...(opts.orderBy?.trim()
              ? {
                  orderBy: opts.orderBy.trim() as "description" | "createdAt",
                }
              : {}),
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

  riskScenarios
    .command("cancel-approval-request")
    .description("Cancel a risk scenario approval request")
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
    .command("delete-control")
    .description("Delete a risk scenario control")
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
}
