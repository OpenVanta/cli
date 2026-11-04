import type { Command } from "commander";
import {
  listTaskRequirementSets,
  getTaskRequirementSet,
  createTaskRequirementSet,
  listCustomRequirements,
  createCustomRequirement,
  updateCustomRequirement,
  updateTaskRequirementSetDetails,
  updateTaskRequirementSetRequirements,
} from "../generated/sdk.gen.js";
import type {
  CreateTaskRequirementSetData,
  ListCustomRequirementsData,
  CreateCustomRequirementData,
  UpdateCustomRequirementData,
  UpdateTaskRequirementSetDetailsData,
  UpdateTaskRequirementSetRequirementsData,
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

export function registerTaskRequirementSetsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const taskRequirementSets = program
    .command("task-requirement-sets")
    .description("Manage task requirement sets");

  addPaginationOptions(
    taskRequirementSets
      .command("list")
      .description("List task requirement sets")
      .option(
        "--reusable <bool>",
        "Filter sets by reusable status. If omitted, returns both reusable and non-reusable sets (true/false)",
        (value) => parseOptionalBoolString(value, "reusable"),
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      reusable?: boolean;
    }) => {
      await runSdk(getFlags, (api) =>
        listTaskRequirementSets({
          client: api.client,
          query: { ...paginationQuery(opts), reusable: opts.reusable },
        }),
      );
    },
  );

  taskRequirementSets
    .command("get")
    .description("Get a task requirement set by ID")
    .requiredOption("--id <id>", "Task requirement set ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getTaskRequirementSet({
          client: api.client,
          path: { requirementSetId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    taskRequirementSets
      .command("create")
      .description("Create a task requirement set and assign it to a group"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTaskRequirementSetData["body"];
    await runSdk(getFlags, (api) =>
      createTaskRequirementSet({ client: api.client, body }),
    );
  });

  addPaginationOptions(
    taskRequirementSets
      .command("list-custom-requirements")
      .description("List custom onboarding and offboarding requirements")
      .option(
        "--requirement-type <type>",
        "Filter requirements by type. If omitted, returns both onboarding and offboarding requirements: ONBOARDING, OFFBOARDING",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      requirementType?: NonNullable<
        ListCustomRequirementsData["query"]
      >["requirementType"];
    }) => {
      await runSdk(getFlags, (api) =>
        listCustomRequirements({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            requirementType: opts.requirementType,
          },
        }),
      );
    },
  );

  addJsonFileOptions(
    taskRequirementSets
      .command("create-custom-requirement")
      .description("Create a custom onboarding or offboarding requirement"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateCustomRequirementData["body"];
    await runSdk(getFlags, (api) =>
      createCustomRequirement({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    taskRequirementSets
      .command("update-custom-requirement")
      .description("Update a custom onboarding or offboarding requirement")
      .requiredOption("--custom-requirement-id <id>", "Custom requirement ID"),
  ).action(
    async (opts: {
      customRequirementId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateCustomRequirementData["body"];
      await runSdk(getFlags, (api) =>
        updateCustomRequirement({
          client: api.client,
          path: { customRequirementId: opts.customRequirementId },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    taskRequirementSets
      .command("update-details")
      .description("Update details for a task requirement set")
      .requiredOption("--id <id>", "Task requirement set ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateTaskRequirementSetDetailsData["body"];
    await runSdk(getFlags, (api) =>
      updateTaskRequirementSetDetails({
        client: api.client,
        path: { requirementSetId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    taskRequirementSets
      .command("update-requirements")
      .description(
        "Update requirements for a task requirement set (supplied requirements replace existing values; omitted requirements are unchanged)",
      )
      .requiredOption("--id <id>", "Task requirement set ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateTaskRequirementSetRequirementsData["body"];
    await runSdk(getFlags, (api) =>
      updateTaskRequirementSetRequirements({
        client: api.client,
        path: { requirementSetId: opts.id },
        body,
      }),
    );
  });
}
