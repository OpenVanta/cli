import type { Command } from "commander";
import {
  listFrameworks,
  getFramework,
  listControlsForFramework,
} from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerFrameworksCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const frameworks = program
    .command("frameworks")
    .description("Manage frameworks");

  addPaginationOptions(
    frameworks.command("list").description("List frameworks"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listFrameworks({ client: api.client, query: paginationQuery(opts) }),
    );
  });

  frameworks
    .command("get")
    .description("Get a framework by ID")
    .requiredOption("--id <id>", "Framework ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getFramework({ client: api.client, path: { frameworkId: opts.id } }),
      );
    });

  addPaginationOptions(
    frameworks
      .command("list-controls")
      .description("List controls for a framework")
      .requiredOption("--id <id>", "Framework ID"),
  ).action(async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
    await runSdk(getFlags, (api) =>
      listControlsForFramework({
        client: api.client,
        path: { frameworkId: opts.id },
        query: paginationQuery(opts),
      }),
    );
  });
}
