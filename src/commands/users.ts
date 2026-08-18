import type { Command } from "commander";
import { listUsers, getUser } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerUsersCommand(program: Command, getFlags: GetFlags): void {
  const users = program.command("users").description("Manage users");

  addPaginationOptions(
    users.command("list").description("List users"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listUsers({ client: api.client, query: paginationQuery(opts) }),
    );
  });

  users
    .command("get")
    .description("Get a user by ID")
    .requiredOption("--id <id>", "User ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getUser({ client: api.client, path: { userId: opts.id } }),
      );
    });
}
