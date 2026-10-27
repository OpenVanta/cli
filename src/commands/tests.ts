import type { Command } from "commander";
import {
  listTests,
  getTest,
  getTestEntities,
  deactivateTestEntity,
  reactivateTestEntity,
} from "../generated/sdk.gen.js";
import type {
  ListTestsData,
  GetTestEntitiesData,
  DeactivateTestEntityData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  parseOptionalBoolString,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTestsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const tests = program.command("tests").description("Manage tests");

  addPaginationOptions(
    tests
      .command("list")
      .description("List tests")
      .option(
        "--status-filter <status>",
        "Filter tests by test status: OK, DEACTIVATED, NEEDS_ATTENTION, IN_PROGRESS, INVALID, NOT_APPLICABLE",
      )
      .option("--framework-filter <id>", "Filter tests by framework")
      .option("--integration-filter <id>", "Filter tests by integration")
      .option("--control-filter <id>", "Filter tests by control ID")
      .option("--owner-filter <id>", "Filter tests by owner ID")
      .option(
        "--category-filter <category>",
        "Filter tests by category: ACCOUNTS_ACCESS, ACCOUNT_SECURITY, ACCOUNT_SETUP, COMPUTERS, CUSTOM, DATA_STORAGE, EMPLOYEES, INFRASTRUCTURE, IT, LOGGING, MONITORING_ALERTS, PEOPLE, POLICIES, RISK_ANALYSIS, SECURITY_ALERT_MANAGEMENT, SOFTWARE_DEVELOPMENT, VENDORS, VULNERABILITY_MANAGEMENT",
      )
      .option(
        "--is-in-rollout <bool>",
        "Filter tests by rollout status. A test in rollout is an upcoming test that does not have its history tracked yet (true/false)",
        (value) => parseOptionalBoolString(value, "is-in-rollout"),
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      statusFilter?: NonNullable<ListTestsData["query"]>["statusFilter"];
      frameworkFilter?: string;
      integrationFilter?: string;
      controlFilter?: string;
      ownerFilter?: string;
      categoryFilter?: NonNullable<ListTestsData["query"]>["categoryFilter"];
      isInRollout?: boolean;
    }) => {
      await runSdk(getFlags, (api) =>
        listTests({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            statusFilter: opts.statusFilter,
            frameworkFilter: opts.frameworkFilter,
            integrationFilter: opts.integrationFilter,
            controlFilter: opts.controlFilter,
            ownerFilter: opts.ownerFilter,
            categoryFilter: opts.categoryFilter,
            isInRollout: opts.isInRollout,
          },
        }),
      );
    },
  );

  tests
    .command("get")
    .description("Get a test by ID")
    .requiredOption("--id <id>", "Test ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getTest({ client: api.client, path: { testId: opts.id } }),
      );
    });

  addPaginationOptions(
    tests
      .command("list-entities")
      .description("List entities for a test")
      .requiredOption("--id <id>", "Test ID")
      .option(
        "--entity-status <status>",
        "The status of the test entities. Defaults to FAILING: FAILING, DEACTIVATED",
      ),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
      entityStatus?: NonNullable<GetTestEntitiesData["query"]>["entityStatus"];
    }) => {
      await runSdk(getFlags, (api) =>
        getTestEntities({
          client: api.client,
          path: { testId: opts.id },
          query: { ...paginationQuery(opts), entityStatus: opts.entityStatus },
        }),
      );
    },
  );

  addJsonFileOptions(
    tests
      .command("deactivate-entity")
      .description("Deactivate a test entity")
      .requiredOption("--id <id>", "Test ID")
      .requiredOption("--entity-id <id>", "Entity ID"),
  ).action(
    async (opts: {
      id: string;
      entityId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as DeactivateTestEntityData["body"];
      await runSdk(getFlags, (api) =>
        deactivateTestEntity({
          client: api.client,
          path: { testId: opts.id, entityId: opts.entityId },
          body,
        }),
      );
    },
  );

  tests
    .command("reactivate-entity")
    .description("Reactivate a test entity")
    .requiredOption("--id <id>", "Test ID")
    .requiredOption("--entity-id <id>", "Entity ID")
    .action(async (opts: { id: string; entityId: string }) => {
      await runSdk(getFlags, (api) =>
        reactivateTestEntity({
          client: api.client,
          path: { testId: opts.id, entityId: opts.entityId },
        }),
      );
    });
}
