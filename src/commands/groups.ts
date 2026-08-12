import type { Command } from "commander";
import {
  addPeopleToGroup,
  addPersonToGroup,
  getGroup,
  getGroupMembers,
  listPersonGroups,
  removePeopleFromGroup,
  removePersonFromGroup,
} from "../generated/sdk.gen.js";
import type {
  AddPeopleToGroupData,
  AddPersonToGroupData,
  RemovePeopleFromGroupData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerGroupsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const groups = program.command("groups").description("Manage groups");

  addPaginationOptions(
    groups.command("list").description("List groups"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listPersonGroups({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });

  groups
    .command("get")
    .description("Get a group by ID")
    .requiredOption("--id <id>", "Group ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getGroup({ client: api.client, path: { groupId: opts.id } }),
      );
    });

  groups
    .command("list-people")
    .description("List people in a group")
    .requiredOption("--id <id>", "Group ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getGroupMembers({ client: api.client, path: { groupId: opts.id } }),
      );
    });

  addJsonFileOptions(
    groups
      .command("add-person")
      .description("Add a person to a group")
      .requiredOption("--id <id>", "Group ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddPersonToGroupData["body"];
    await runSdk(getFlags, (api) =>
      addPersonToGroup({
        client: api.client,
        path: { groupId: opts.id },
        body,
      }),
    );
  });

  groups
    .command("remove-person")
    .description("Remove a person from a group")
    .requiredOption("--id <id>", "Group ID")
    .requiredOption("--person-id <id>", "Person ID")
    .action(async (opts: { id: string; personId: string }) => {
      await runSdk(getFlags, (api) =>
        removePersonFromGroup({
          client: api.client,
          path: { groupId: opts.id, personId: opts.personId },
        }),
      );
    });

  addJsonFileOptions(
    groups
      .command("add-people")
      .description("Add people to a group")
      .requiredOption("--id <id>", "Group ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddPeopleToGroupData["body"];
    await runSdk(getFlags, (api) =>
      addPeopleToGroup({
        client: api.client,
        path: { groupId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    groups
      .command("remove-people")
      .description("Remove people from a group")
      .requiredOption("--id <id>", "Group ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as RemovePeopleFromGroupData["body"];
    await runSdk(getFlags, (api) =>
      removePeopleFromGroup({
        client: api.client,
        path: { groupId: opts.id },
        body,
      }),
    );
  });
}
