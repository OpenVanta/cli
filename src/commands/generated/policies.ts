import type { Command } from "commander";
import { listPolicies, getPolicy } from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerPoliciesCommand(program: Command, getFlags: GetFlags): void {
  const policies = program.command("policies").description("Manage policies");

  addPaginationOptions(
    policies.command("list").description("List policies"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listPolicies({ client: api.client, query: paginationQuery(opts) }),
    );
  });

  policies
    .command("get")
    .description("Get a policy by ID")
    .requiredOption("--id <id>", "Policy ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getPolicy({ client: api.client, path: { policyId: opts.id } }),
      );
    });
}
