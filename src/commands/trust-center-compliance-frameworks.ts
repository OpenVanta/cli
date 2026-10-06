import type { Command } from "commander";
import {
  listComplianceFrameworks,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  uploadComplianceFrameworkBadge,
} from "../generated/sdk.gen.js";
import type {
  CreateComplianceFrameworkData,
  UpdateComplianceFrameworkData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterComplianceFrameworksCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const complianceFrameworks = trustCenters
    .command("compliance-frameworks")
    .description("Manage Trust Center compliance frameworks");

  complianceFrameworks
    .command("list")
    .description("List Trust Center compliance frameworks")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .action(async (opts: { slugId: string }) => {
      await runSdk(getFlags, (api) =>
        listComplianceFrameworks({
          client: api.client,
          path: { slugId: opts.slugId },
        }),
      );
    });

  addJsonFileOptions(
    complianceFrameworks
      .command("create")
      .description("Create a Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID"),
  ).action(async (opts: { slugId: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateComplianceFrameworkData["body"];
    await runSdk(getFlags, (api) =>
      createComplianceFramework({
        client: api.client,
        path: { slugId: opts.slugId },
        body,
      }),
    );
  });

  addJsonFileOptions(
    complianceFrameworks
      .command("update")
      .description("Update a Trust Center compliance framework")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .requiredOption("--id <id>", "Compliance framework ID"),
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
      )) as UpdateComplianceFrameworkData["body"];
      await runSdk(getFlags, (api) =>
        updateComplianceFramework({
          client: api.client,
          path: { slugId: opts.slugId, frameworkId: opts.id },
          body,
        }),
      );
    },
  );

  complianceFrameworks
    .command("delete")
    .description("Delete a Trust Center compliance framework")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Compliance framework ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteComplianceFramework({
          client: api.client,
          path: { slugId: opts.slugId, frameworkId: opts.id },
        }),
      );
    });

  complianceFrameworks
    .command("upload-badge")
    .description("Upload a badge for a Trust Center compliance framework")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Compliance framework ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .action(async (opts: { slugId: string; id: string; file: string }) => {
      const file = await readBinaryFile(opts.file);
      await runSdk(getFlags, (api) =>
        uploadComplianceFrameworkBadge({
          client: api.client,
          path: { slugId: opts.slugId, frameworkId: opts.id },
          body: { file },
        }),
      );
    });
}
