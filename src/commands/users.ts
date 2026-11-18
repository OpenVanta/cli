import type { Command } from "commander";
import { listUsers, getUser, deactivateUsers } from "../generated/sdk.gen.js";
import type { DeactivateUsersData } from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerUsersCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const users = program.command("users").description("Manage users");

  addPaginationOptions(users.command("list").description("List users")).action(
    async (opts) => {
      await runSdk(getFlags, (api) =>
        listUsers({ client: api.client, query: paginationQuery(opts) }),
      );
    },
  );

  users
    .command("get")
    .description("Get a user by ID")
    .requiredOption("--id <id>", "User ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getUser({ client: api.client, path: { userId: opts.id } }),
      );
    });

  addJsonFileOptions(
    users
      .command("deactivate")
      .description(
        'Deactivate manually added users with JSON {"updates":[{"id":"..."}]} (1-100 users; identity-provider users and the last active admin cannot be deactivated)',
      ),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as DeactivateUsersData["body"];
    await runSdk(getFlags, (api) =>
      deactivateUsers({ client: api.client, body }),
    );
  });
}
