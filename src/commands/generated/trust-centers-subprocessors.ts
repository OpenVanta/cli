import type { Command } from "commander";
import {
  listTrustCenterSubprocessors,
  getTrustCenterSubprocessor,
  createTrustCenterSubprocessor,
  updateTrustCenterSubprocessor,
  deleteTrustCenterSubprocessor,
} from "../generated/sdk.gen.js";
import type {
  CreateTrustCenterSubprocessorData,
  UpdateTrustCenterSubprocessorData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterSubprocessorsCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const subprocessors = trustCenters
    .command("subprocessors")
    .description("Manage Trust Center subprocessors");

  subprocessors
    .command("list")
    .description("List Trust Center subprocessors")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listTrustCenterSubprocessors({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  subprocessors
    .command("get")
    .description("Get a Trust Center subprocessor by ID")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subprocessor ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    subprocessors
      .command("create")
      .description("Create a Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateTrustCenterSubprocessorData["body"];
    await runSdk(getFlags, (api) =>
      createTrustCenterSubprocessor({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    subprocessors
      .command("update")
      .description("Update a Trust Center subprocessor")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Subprocessor ID"),
  ).action(
    async (opts: {
      slugId: string;
      id: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateTrustCenterSubprocessorData["body"];
      await runSdk(getFlags, (api) =>
        updateTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.id },
          body,
        }),
      );
    },
  );

  subprocessors
    .command("delete")
    .description("Delete a Trust Center subprocessor")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Subprocessor ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTrustCenterSubprocessor({
          client: api.client,
          path: { slugId: opts.slugId, subprocessorId: opts.id },
        }),
      );
    });
}
