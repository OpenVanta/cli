import type { Command } from "commander";
import {
  clearLeaveForPerson,
  getPerson,
  listPeople,
  markAsNotPeople,
  markAsPeople,
  offboardPeople,
  setLeaveForPerson,
  updatePerson,
} from "../generated/sdk.gen.js";
import type {
  MarkAsNotPeopleData,
  MarkAsPeopleData,
  OffboardPeopleData,
  SetLeaveForPersonData,
  TaskStatus,
  TasksSummaryStatus,
  TaskType,
  UpdatePersonData,
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

  addPaginationOptions(people.command("list").description("List people"))
    .option(
      "--tasks-summary-status-matches-any <status>",
      "Tasks summary statuses to filter by (repeatable)",
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
    .action(
      async (opts: {
        pageSize?: number;
        pageCursor?: string;
        tasksSummaryStatusMatchesAny: string[];
        taskTypeMatchesAny: string[];
        taskStatusMatchesAny: string[];
      }) => {
        const tasksSummaryStatusMatchesAny =
          opts.tasksSummaryStatusMatchesAny.filter(Boolean);
        const taskTypeMatchesAny = opts.taskTypeMatchesAny.filter(Boolean);
        const taskStatusMatchesAny = opts.taskStatusMatchesAny.filter(Boolean);

        await runSdk(getFlags, (api) =>
          listPeople({
            client: api.client,
            query: {
              ...paginationQuery(opts),
              ...(tasksSummaryStatusMatchesAny.length > 0
                ? {
                    tasksSummaryStatusMatchesAny:
                      tasksSummaryStatusMatchesAny as TasksSummaryStatus[],
                  }
                : {}),
              ...(taskTypeMatchesAny.length > 0
                ? {
                    taskTypeMatchesAny: taskTypeMatchesAny as TaskType[],
                  }
                : {}),
              ...(taskStatusMatchesAny.length > 0
                ? {
                    taskStatusMatchesAny:
                      taskStatusMatchesAny as TaskStatus[],
                  }
                : {}),
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
      .description("Update person metadata")
      .requiredOption("--id <id>", "Person ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdatePersonData["body"];
    await runSdk(getFlags, (api) =>
      updatePerson({
        client: api.client,
        path: { personId: opts.id },
        body,
      }),
    );
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
    await runSdk(getFlags, (api) =>
      markAsPeople({ client: api.client, body }),
    );
  });

  people
    .command("clear-leave")
    .description("Clear leave status for a person")
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
      .description("Set leave status for a person")
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
