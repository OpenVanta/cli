import type { Command } from "commander";
import {
  listFrameworks,
  getFramework,
  deleteCustomFramework,
  createFrameworkControlsExport,
  getFrameworkControlsExport,
  listControlsForFramework,
  reactivateFramework,
  snoozeFramework,
  setFrameworkVariant,
} from "../generated/sdk.gen.js";
import type {
  GetFrameworkData,
  CreateFrameworkControlsExportData,
  SnoozeFrameworkData,
  SetFrameworkVariantData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  parseOptionalBoolString,
  readJSONPayload,
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
    frameworks
      .command("list")
      .description("List frameworks")
      .option(
        "--include-status <bool>",
        "Whether to include lifecycle status. Defaults to true (true/false)",
        (value) => parseOptionalBoolString(value, "include-status"),
      )
      .option(
        "--purchased-only <bool>",
        "Whether to return only frameworks in your program. Defaults to true (true/false)",
        (value) => parseOptionalBoolString(value, "purchased-only"),
      )
      .option(
        "--include-progress <bool>",
        "Whether to look up progress counts for purchased frameworks. Defaults to true. Counts are -1 when this is false and for unpurchased frameworks (true/false)",
        (value) => parseOptionalBoolString(value, "include-progress"),
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      includeStatus?: boolean;
      purchasedOnly?: boolean;
      includeProgress?: boolean;
    }) => {
      await runSdk(getFlags, (api) =>
        listFrameworks({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            includeStatus: opts.includeStatus,
            purchasedOnly: opts.purchasedOnly,
            includeProgress: opts.includeProgress,
          },
        }),
      );
    },
  );

  frameworks
    .command("get")
    .description("Get a framework by ID")
    .requiredOption("--id <id>", "Framework ID")
    .option(
      "--include-status <bool>",
      "Whether to include lifecycle status. Defaults to true (true/false)",
      (value) => parseOptionalBoolString(value, "include-status"),
    )
    .option(
      "--include-requirements <bool>",
      "Whether to include the flat requirements list. Defaults to false (true/false)",
      (value) => parseOptionalBoolString(value, "include-requirements"),
    )
    .option(
      "--requirements-scope <scope>",
      "Used with includeRequirements. MY_PROGRAM (default) returns requirements as mapped in your program; CATALOG returns the framework's published requirements. Custom frameworks always use MY_PROGRAM. Both require the framework to be in your program",
    )
    .option(
      "--variants <id>",
      "Catalog variant IDs to resolve CATALOG requirements against. Defaults to the framework's published defaults. Ignored for MY_PROGRAM, which uses your program's variants (repeatable)",
      collectString,
      [] as string[],
    )
    .action(
      async (opts: {
        id: string;
        includeStatus?: boolean;
        includeRequirements?: boolean;
        requirementsScope?: NonNullable<
          GetFrameworkData["query"]
        >["requirementsScope"];
        variants: string[];
      }) => {
        await runSdk(getFlags, (api) =>
          getFramework({
            client: api.client,
            path: { frameworkId: opts.id },
            query: {
              includeStatus: opts.includeStatus,
              includeRequirements: opts.includeRequirements,
              requirementsScope: opts.requirementsScope,
              variants: opts.variants,
            },
          }),
        );
      },
    );

  frameworks
    .command("delete")
    .description("Delete a custom framework")
    .requiredOption("--id <id>", "Framework ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteCustomFramework({
          client: api.client,
          path: { frameworkId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    frameworks
      .command("create-export")
      .description("Create a framework controls export"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateFrameworkControlsExportData["body"];
    await runSdk(getFlags, (api) =>
      createFrameworkControlsExport({ client: api.client, body }),
    );
  });

  frameworks
    .command("get-export")
    .description("Get a framework controls export's status by ID")
    .requiredOption(
      "--export-id <id>",
      "Export job ID returned by `frameworks create-export`",
    )
    .action(async (opts: { exportId: string }) => {
      await runSdk(getFlags, (api) =>
        getFrameworkControlsExport({
          client: api.client,
          path: { exportId: opts.exportId },
        }),
      );
    });

  addPaginationOptions(
    frameworks
      .command("list-controls")
      .description("List controls for a framework")
      .requiredOption("--id <id>", "Framework ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listControlsForFramework({
          client: api.client,
          path: { frameworkId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  frameworks
    .command("reactivate")
    .description("Reactivate a framework")
    .requiredOption("--id <id>", "Framework ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        reactivateFramework({
          client: api.client,
          path: { frameworkId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    frameworks
      .command("snooze")
      .description("Snooze a framework")
      .requiredOption("--id <id>", "Framework ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SnoozeFrameworkData["body"];
    await runSdk(getFlags, (api) =>
      snoozeFramework({
        client: api.client,
        path: { frameworkId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    frameworks
      .command("set-variants")
      .description("Set variants for a framework")
      .requiredOption("--id <id>", "Framework ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SetFrameworkVariantData["body"];
    await runSdk(getFlags, (api) =>
      setFrameworkVariant({
        client: api.client,
        path: { frameworkId: opts.id },
        body,
      }),
    );
  });
}
