import type { Command } from "commander";
import { listProgramScopes, getProgramScope } from "../generated/sdk.gen.js";
import type { ListProgramScopesData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  collectString,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerProgramScopesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const programScopes = program
    .command("program-scopes")
    .description("Manage program scopes");

  addPaginationOptions(
    programScopes
      .command("list")
      .description("List program scopes")
      .option(
        "--business-unit-id-matches-any <id>",
        "Filter by business unit ID from business-units list (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--framework-id-matches-any <id>",
        "Filter by framework ID from frameworks list (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(async (opts: NonNullable<ListProgramScopesData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listProgramScopes({
        client: api.client,
        query: {
          ...paginationQuery(opts),
          businessUnitIdMatchesAny: opts.businessUnitIdMatchesAny,
          frameworkIdMatchesAny: opts.frameworkIdMatchesAny,
        },
      }),
    );
  });

  programScopes
    .command("get")
    .description("Get a program scope by ID")
    .requiredOption("--id <id>", "Program scope ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getProgramScope({
          client: api.client,
          path: { programScopeId: opts.id },
        }),
      );
    });
}
