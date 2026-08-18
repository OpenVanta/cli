import type { Command } from "commander";
import {
  listControls,
  getControl,
  createCustomControl,
  addControlFromLibrary,
  updateControlMetadata,
  deleteControl,
  setOwnerForControl,
  listLibraryControls,
  listDocumentsForControl,
  listTestsForControl,
  addDocumentToControl,
  deleteDocumentForcontrol,
  addTestToControl,
  deleteTestForControl,
} from "../generated/sdk.gen.js";
import type {
  AddControlDocumentMappingInput,
  AddControlFromLibraryInput,
  AddControlTestMappingInput,
  CreateControlInput,
  EditControlMetadataInput,
  SetOwnerForControlInput,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerControlsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const controls = program.command("controls").description("Manage controls");

  addPaginationOptions(
    controls
      .command("list")
      .description("List controls")
      .option(
        "--framework-matches-any <id>",
        "Framework IDs to filter by (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      frameworkMatchesAny: string[];
    }) => {
      const frameworkMatchesAny = opts.frameworkMatchesAny.filter(Boolean);
      await runSdk(getFlags, (api) =>
        listControls({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(frameworkMatchesAny.length > 0
              ? { frameworkMatchesAny }
              : {}),
          },
        }),
      );
    },
  );

  controls
    .command("get")
    .description("Get a control by ID")
    .requiredOption("--id <id>", "Control ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getControl({ client: api.client, path: { controlId: opts.id } }),
      );
    });

  addJsonFileOptions(
    controls.command("create").description("Create a custom control"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateControlInput;
    await runSdk(getFlags, (api) =>
      createCustomControl({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    controls
      .command("add-from-library")
      .description("Add a control from the Vanta library"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddControlFromLibraryInput;
    await runSdk(getFlags, (api) =>
      addControlFromLibrary({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    controls
      .command("update")
      .description("Update a control's metadata")
      .requiredOption("--id <id>", "Control ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as EditControlMetadataInput;
    await runSdk(getFlags, (api) =>
      updateControlMetadata({
        client: api.client,
        path: { controlId: opts.id },
        body,
      }),
    );
  });

  controls
    .command("delete")
    .description("Delete a control")
    .requiredOption("--id <id>", "Control ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteControl({ client: api.client, path: { controlId: opts.id } }),
      );
    });

  addJsonFileOptions(
    controls
      .command("set-owner")
      .description("Set or clear a control owner")
      .requiredOption("--id <id>", "Control ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SetOwnerForControlInput;
    await runSdk(getFlags, (api) =>
      setOwnerForControl({
        client: api.client,
        path: { controlId: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    controls.command("list-library").description("List controls from the library"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listLibraryControls({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });

  addPaginationOptions(
    controls
      .command("list-documents")
      .description("List documents for a control")
      .requiredOption("--id <id>", "Control ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listDocumentsForControl({
          client: api.client,
          path: { controlId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addPaginationOptions(
    controls
      .command("list-tests")
      .description("List tests for a control")
      .requiredOption("--id <id>", "Control ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listTestsForControl({
          client: api.client,
          path: { controlId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    controls
      .command("add-document")
      .description("Add a document to a control")
      .requiredOption("--id <id>", "Control ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddControlDocumentMappingInput;
    await runSdk(getFlags, (api) =>
      addDocumentToControl({
        client: api.client,
        path: { controlId: opts.id },
        body,
      }),
    );
  });

  controls
    .command("remove-document")
    .description("Remove a document from a control")
    .requiredOption("--id <id>", "Control ID")
    .requiredOption("--document-id <id>", "Document ID")
    .action(async (opts: { id: string; documentId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteDocumentForcontrol({
          client: api.client,
          path: { controlId: opts.id, documentId: opts.documentId },
        }),
      );
    });

  addJsonFileOptions(
    controls
      .command("add-test")
      .description("Add a test to a control")
      .requiredOption("--id <id>", "Control ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as AddControlTestMappingInput;
    await runSdk(getFlags, (api) =>
      addTestToControl({
        client: api.client,
        path: { controlId: opts.id },
        body,
      }),
    );
  });

  controls
    .command("remove-test")
    .description("Remove a test from a control")
    .requiredOption("--id <id>", "Control ID")
    .requiredOption("--test-id <id>", "Test ID")
    .action(async (opts: { id: string; testId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteTestForControl({
          client: api.client,
          path: { controlId: opts.id, testId: opts.testId },
        }),
      );
    });
}
