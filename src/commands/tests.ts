import type { Command } from "commander";
import {
  listTests,
  getTest,
  getTestEntities,
  deactivateTestEntity,
  reactivateTestEntity,
} from "../generated/sdk.gen.js";
import type {
  EntityStatus,
  TestCategory,
  TestStatus,
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

export function registerTestsCommand(program: Command, getFlags: GetFlags): void {
  const tests = program.command("tests").description("Manage tests");

  addPaginationOptions(
    tests
      .command("list")
      .description("List tests")
      .option("--status-filter <status>", "Filter by test status")
      .option("--framework-filter <id>", "Filter by framework")
      .option("--integration-filter <id>", "Filter by integration")
      .option("--control-filter <id>", "Filter by control ID")
      .option("--owner-filter <id>", "Filter by owner ID")
      .option("--category-filter <category>", "Filter by category")
      .option("--is-in-rollout <bool>", "Filter by rollout status (true/false)"),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      statusFilter?: string;
      frameworkFilter?: string;
      integrationFilter?: string;
      controlFilter?: string;
      ownerFilter?: string;
      categoryFilter?: string;
      isInRollout?: string;
    }) => {
      const isInRollout = parseOptionalBoolString(
        opts.isInRollout,
        "is-in-rollout",
      );
      await runSdk(getFlags, (api) =>
        listTests({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.statusFilter?.trim()
              ? { statusFilter: opts.statusFilter.trim() as TestStatus }
              : {}),
            ...(opts.frameworkFilter?.trim()
              ? { frameworkFilter: opts.frameworkFilter.trim() }
              : {}),
            ...(opts.integrationFilter?.trim()
              ? { integrationFilter: opts.integrationFilter.trim() }
              : {}),
            ...(opts.controlFilter?.trim()
              ? { controlFilter: opts.controlFilter.trim() }
              : {}),
            ...(opts.ownerFilter?.trim()
              ? { ownerFilter: opts.ownerFilter.trim() }
              : {}),
            ...(opts.categoryFilter?.trim()
              ? { categoryFilter: opts.categoryFilter.trim() as TestCategory }
              : {}),
            ...(isInRollout !== undefined ? { isInRollout } : {}),
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
      .option("--entity-status <status>", "Entity status (FAILING or DEACTIVATED)"),
  ).action(
    async (opts: {
      id: string;
      entityStatus?: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        getTestEntities({
          client: api.client,
          path: { testId: opts.id },
          query: {
            ...paginationQuery(opts),
            ...(opts.entityStatus?.trim()
              ? { entityStatus: opts.entityStatus.trim() as EntityStatus }
              : {}),
          },
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
    async (opts: { id: string; entityId: string; json?: string; file?: string }) => {
      const body = (await readJSONPayload(opts.json, opts.file)) as {
        deactivateReason: string;
        deactivateUntilDate?: string;
      };
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
