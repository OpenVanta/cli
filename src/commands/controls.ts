import type { Command } from "commander";
import { getControl, listControls } from "../generated/sdk.gen.js";
import { newAPIClient, type GlobalFlags } from "../api-client.js";
import { printResponse } from "../output.js";

export function registerControlsCommand(
  program: Command,
  getFlags: () => GlobalFlags,
): void {
  const controls = program
    .command("controls")
    .description("Manage controls");

  controls
    .command("list")
    .description("List controls")
    .option("--page-size <n>", "Number of results to return", (v) =>
      Number.parseInt(v, 10),
    )
    .option("--page-cursor <cursor>", "Pagination cursor")
    .option(
      "--framework-matches-any <id>",
      "Framework IDs to filter by (repeatable)",
      (value: string, previous: string[]) => [...previous, value],
      [] as string[],
    )
    .action(
      async (opts: {
        pageSize?: number;
        pageCursor?: string;
        frameworkMatchesAny: string[];
      }) => {
        const flags = getFlags();
        const api = await newAPIClient(flags);
        try {
          const frameworkMatchesAny = opts.frameworkMatchesAny.filter(Boolean);
          const { data, error } = await listControls({
            client: api.client,
            query: {
              ...(opts.pageSize && opts.pageSize > 0
                ? { pageSize: opts.pageSize }
                : {}),
              ...(opts.pageCursor?.trim()
                ? { pageCursor: opts.pageCursor.trim() }
                : {}),
              ...(frameworkMatchesAny.length > 0
                ? { frameworkMatchesAny }
                : {}),
            },
          });
          if (error) {
            throw error;
          }
          printResponse(data, flags);
        } catch (err) {
          const handled = api.handleError(err);
          if (handled !== undefined) throw handled;
        }
      },
    );

  controls
    .command("get")
    .description("Get a control by ID")
    .requiredOption("--id <id>", "Control ID")
    .action(async (opts: { id: string }) => {
      const flags = getFlags();
      const api = await newAPIClient(flags);
      try {
        const { data, error } = await getControl({
          client: api.client,
          path: { controlId: opts.id },
        });
        if (error) {
          throw error;
        }
        printResponse(data, flags);
      } catch (err) {
        const handled = api.handleError(err);
        if (handled !== undefined) throw handled;
      }
    });
}
