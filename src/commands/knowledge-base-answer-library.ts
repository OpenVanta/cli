import type { Command } from "commander";
import {
  listAnswerLibraryEntries,
  createAnswerLibraryEntry,
  getAnswerLibraryEntry,
  updateAnswerLibraryEntryRoute,
  deleteAnswerLibraryEntryRoute,
  verifyAnswerLibraryEntryRoute,
} from "../generated/sdk.gen.js";
import type {
  ListAnswerLibraryEntriesData,
  CreateAnswerLibraryEntryData,
  UpdateAnswerLibraryEntryRouteData,
  VerifyAnswerLibraryEntryRouteData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerKnowledgeBaseAnswerLibraryCommand(
  knowledgeBase: Command,
  getFlags: GetFlags,
): void {
  const answerLibrary = knowledgeBase
    .command("answer-library")
    .description("Manage Answer Library entries");

  addPaginationOptions(
    answerLibrary
      .command("list")
      .description("List Answer Library entries")
      .option("--q <query>", "Full-text search across question and answer.")
      .option(
        "--last-updated-after <timestamp>",
        "Only include entries updated at or after this ISO 8601 timestamp.",
      )
      .option(
        "--last-updated-before <timestamp>",
        "Only include entries updated at or before this ISO 8601 timestamp.",
      )
      .option(
        "--matches-tags <json>",
        "JSON-encoded array of `{categoryId, tagId}` pairs. Entries matching any of the given tags are returned (OR filter). Find category IDs with `vanta customer-trust tag-categories list` and tag IDs with `vanta customer-trust tag-categories get --id <id>`.",
      )
      .option(
        "--expires-before <timestamp>",
        "Only include entries expiring at or before this ISO 8601 timestamp.",
      )
      .option(
        "--expires-after <timestamp>",
        "Only include entries expiring at or after this ISO 8601 timestamp.",
      ),
  ).action(
    async (opts: NonNullable<ListAnswerLibraryEntriesData["query"]>) => {
      await runSdk(getFlags, (api) =>
        listAnswerLibraryEntries({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            q: opts.q,
            lastUpdatedAfter: opts.lastUpdatedAfter,
            lastUpdatedBefore: opts.lastUpdatedBefore,
            matchesTags: opts.matchesTags,
            expiresBefore: opts.expiresBefore,
            expiresAfter: opts.expiresAfter,
          },
        }),
      );
    },
  );

  addJsonFileOptions(
    answerLibrary.command("create").description("Create an Answer Library entry"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateAnswerLibraryEntryData["body"];
    await runSdk(getFlags, (api) =>
      createAnswerLibraryEntry({ client: api.client, body }),
    );
  });

  answerLibrary
    .command("get")
    .description("Get an Answer Library entry by ID")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getAnswerLibraryEntry({ client: api.client, path: { id: opts.id } }),
      );
    });

  addJsonFileOptions(
    answerLibrary
      .command("update")
      .description("Update an Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateAnswerLibraryEntryRouteData["body"];
    await runSdk(getFlags, (api) =>
      updateAnswerLibraryEntryRoute({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });

  answerLibrary
    .command("delete")
    .description("Delete an Answer Library entry")
    .requiredOption("--id <id>", "Answer Library entry ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteAnswerLibraryEntryRoute({
          client: api.client,
          path: { id: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    answerLibrary
      .command("verify")
      .description("Verify an Answer Library entry")
      .requiredOption("--id <id>", "Answer Library entry ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as VerifyAnswerLibraryEntryRouteData["body"];
    await runSdk(getFlags, (api) =>
      verifyAnswerLibraryEntryRoute({
        client: api.client,
        path: { id: opts.id },
        body,
      }),
    );
  });
}
