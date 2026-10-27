import type { Command } from "commander";
import {
  listPeople,
  getPerson,
  updatePerson,
  markAsNotPeople,
  markAsPeople,
  offboardPeople,
  clearLeaveForPerson,
  setLeaveForPerson,
} from "../generated/sdk.gen.js";
import type {
  ListPeopleData,
  UpdatePersonData,
  MarkAsNotPeopleData,
  MarkAsPeopleData,
  OffboardPeopleData,
  SetLeaveForPersonData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerPeopleCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const people = program.command("people").description("Manage people");

  addPaginationOptions(
    people
      .command("list")
      .description("List people")
      .option(
        "--tasks-summary-status-matches-any <status>",
        "Filter individuals by those whose tasksSummary status is any of the provided values: COMPLETE, DUE_SOON, NONE, OFFBOARDING_COMPLETE, OFFBOARDING_DUE_SOON, OFFBOARDING_OVERDUE, OVERDUE, PAUSED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--task-type-matches-any <type>",
        "Task types to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--task-status-matches-any <status>",
        "Task statuses to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--email-and-name-filter <name>",
        "Filter people by email address, first name, or last name (partial match, case-insensitive)",
      )
      .option(
        "--group-ids-matches-any <id>",
        "Filter people matching any of the given group IDs (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--employment-status <status>",
        "Filter people matching the given employment status: UPCOMING, CURRENT, ON_LEAVE, INACTIVE, FORMER",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      tasksSummaryStatusMatchesAny: NonNullable<
        NonNullable<ListPeopleData["query"]>["tasksSummaryStatusMatchesAny"]
      >;
      taskTypeMatchesAny: NonNullable<
        NonNullable<ListPeopleData["query"]>["taskTypeMatchesAny"]
      >;
      taskStatusMatchesAny: NonNullable<
        NonNullable<ListPeopleData["query"]>["taskStatusMatchesAny"]
      >;
      emailAndNameFilter?: string;
      groupIdsMatchesAny: string[];
      employmentStatus?: NonNullable<
        ListPeopleData["query"]
      >["employmentStatus"];
    }) => {
      await runSdk(getFlags, (api) =>
        listPeople({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            tasksSummaryStatusMatchesAny: opts.tasksSummaryStatusMatchesAny,
            taskTypeMatchesAny: opts.taskTypeMatchesAny,
            taskStatusMatchesAny: opts.taskStatusMatchesAny,
            emailAndNameFilter: opts.emailAndNameFilter,
            groupIdsMatchesAny: opts.groupIdsMatchesAny,
            employmentStatus: opts.employmentStatus,
          },
        }),
      );
    },
  );

  people
    .command("get")
    .description("Get a person by ID")
    .requiredOption("--id <id>", "Person ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getPerson({ client: api.client, path: { personId: opts.id } }),
      );
    });

  addJsonFileOptions(
    people
      .command("update")
      .description("Update a person")
      .requiredOption("--id <id>", "Person ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdatePersonData["body"];
    await runSdk(getFlags, (api) =>
      updatePerson({ client: api.client, path: { personId: opts.id }, body }),
    );
  });

  addJsonFileOptions(
    people
      .command("mark-as-not-people")
      .description("Mark accounts as not people"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as MarkAsNotPeopleData["body"];
    await runSdk(getFlags, (api) =>
      markAsNotPeople({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    people.command("mark-as-people").description("Mark accounts as people"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as MarkAsPeopleData["body"];
    await runSdk(getFlags, (api) => markAsPeople({ client: api.client, body }));
  });

  addJsonFileOptions(
    people.command("offboard").description("Offboard people"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as OffboardPeopleData["body"];
    await runSdk(getFlags, (api) =>
      offboardPeople({ client: api.client, body }),
    );
  });

  people
    .command("clear-leave")
    .description("Clear leave for a person")
    .requiredOption("--id <id>", "Person ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        clearLeaveForPerson({
          client: api.client,
          path: { personId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    people
      .command("set-leave")
      .description("Set leave for a person")
      .requiredOption("--id <id>", "Person ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SetLeaveForPersonData["body"];
    await runSdk(getFlags, (api) =>
      setLeaveForPerson({
        client: api.client,
        path: { personId: opts.id },
        body,
      }),
    );
  });
}
