import { writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Command } from "commander";
import {
  listDocuments,
  getDocument,
  createDocument,
  deleteDocument,
  setOwnerForDocument,
  listControlsForDocument,
  listLinksForDocument,
  createLinkForDocument,
  deleteLinkForDocument,
  listFilesForDocument,
  uploadFileForDocument,
  deleteFileForDocument,
  getUploadedfileMedia,
  submitDocumentCollection,
} from "../generated/sdk.gen.js";
import type {
  CreateDocumentInput,
  CreateLinkForDocumentInput,
  DocumentStatus,
  SetOwnerForDocumentInput,
} from "../generated/types.gen.js";
import { printResponse } from "../output.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  withClient,
  type GetFlags,
} from "./helpers.js";

async function writeDownloadedMedia(
  data: unknown,
  outputPath: string | undefined,
): Promise<void> {
  const dest = outputPath?.trim();

  const writeBytes = async (buf: Buffer) => {
    if (dest) {
      await writeFile(dest, buf);
      return;
    }
    process.stdout.write(buf);
  };

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    await writeBytes(Buffer.from(await data.arrayBuffer()));
    return;
  }

  if (
    data &&
    typeof data === "object" &&
    "arrayBuffer" in data &&
    typeof (data as { arrayBuffer: unknown }).arrayBuffer === "function"
  ) {
    const ab = await (
      data as { arrayBuffer: () => Promise<ArrayBuffer> }
    ).arrayBuffer();
    await writeBytes(Buffer.from(ab));
    return;
  }

  if (data instanceof ArrayBuffer) {
    await writeBytes(Buffer.from(data));
    return;
  }

  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    await writeBytes(Buffer.from(data));
    return;
  }

  if (
    data instanceof ReadableStream ||
    (data &&
      typeof data === "object" &&
      "getReader" in data &&
      typeof (data as { getReader: unknown }).getReader === "function")
  ) {
    const stream = data as ReadableStream<Uint8Array>;
    if (dest) {
      const { createWriteStream } = await import("node:fs");
      await pipeline(
        Readable.fromWeb(stream as import("node:stream/web").ReadableStream),
        createWriteStream(dest),
      );
      return;
    }
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(value);
    }
    return;
  }

  if (
    data &&
    typeof data === "object" &&
    "pipe" in data &&
    typeof (data as { pipe: unknown }).pipe === "function"
  ) {
    const nodeStream = data as NodeJS.ReadableStream;
    if (dest) {
      const { createWriteStream } = await import("node:fs");
      await pipeline(nodeStream, createWriteStream(dest));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      nodeStream.on("error", reject);
      nodeStream.on("end", () => resolve());
      nodeStream.on("close", () => resolve());
      nodeStream.pipe(process.stdout, { end: false });
    });
    return;
  }

  throw new Error(
    `unsupported media response type: ${Object.prototype.toString.call(data)}`,
  );
}

export function registerDocumentsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const documents = program
    .command("documents")
    .description("Manage documents");

  addPaginationOptions(
    documents
      .command("list")
      .description("List documents")
      .option(
        "--framework-matches-any <id>",
        "Framework IDs to filter by (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--status-matches-any <status>",
        "Document statuses to filter by (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      frameworkMatchesAny: string[];
      statusMatchesAny: string[];
    }) => {
      const frameworkMatchesAny = opts.frameworkMatchesAny.filter(Boolean);
      const statusMatchesAny = opts.statusMatchesAny.filter(
        Boolean,
      ) as DocumentStatus[];
      await runSdk(getFlags, (api) =>
        listDocuments({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(frameworkMatchesAny.length > 0
              ? { frameworkMatchesAny }
              : {}),
            ...(statusMatchesAny.length > 0 ? { statusMatchesAny } : {}),
          },
        }),
      );
    },
  );

  documents
    .command("get")
    .description("Get a document by ID")
    .requiredOption("--id <id>", "Document ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getDocument({ client: api.client, path: { documentId: opts.id } }),
      );
    });

  addJsonFileOptions(
    documents.command("create").description("Create a document"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateDocumentInput;
    await runSdk(getFlags, (api) =>
      createDocument({ client: api.client, body }),
    );
  });

  documents
    .command("delete")
    .description("Delete a document")
    .requiredOption("--id <id>", "Document ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteDocument({ client: api.client, path: { documentId: opts.id } }),
      );
    });

  addJsonFileOptions(
    documents
      .command("set-owner")
      .description("Set or clear a document owner")
      .requiredOption("--id <id>", "Document ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as SetOwnerForDocumentInput;
    await runSdk(getFlags, (api) =>
      setOwnerForDocument({
        client: api.client,
        path: { documentId: opts.id },
        body,
      }),
    );
  });

  addPaginationOptions(
    documents
      .command("list-controls")
      .description("List controls for a document")
      .requiredOption("--id <id>", "Document ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listControlsForDocument({
          client: api.client,
          path: { documentId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addPaginationOptions(
    documents
      .command("list-links")
      .description("List links for a document")
      .requiredOption("--id <id>", "Document ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listLinksForDocument({
          client: api.client,
          path: { documentId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  addJsonFileOptions(
    documents
      .command("create-link")
      .description("Create a link for a document")
      .requiredOption("--id <id>", "Document ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateLinkForDocumentInput;
    await runSdk(getFlags, (api) =>
      createLinkForDocument({
        client: api.client,
        path: { documentId: opts.id },
        body,
      }),
    );
  });

  documents
    .command("delete-link")
    .description("Delete a link for a document")
    .requiredOption("--id <id>", "Document ID")
    .requiredOption("--link-id <id>", "Link ID")
    .action(async (opts: { id: string; linkId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteLinkForDocument({
          client: api.client,
          path: { documentId: opts.id, linkId: opts.linkId },
        }),
      );
    });

  addPaginationOptions(
    documents
      .command("list-uploads")
      .description("List uploaded files for a document")
      .requiredOption("--id <id>", "Document ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listFilesForDocument({
          client: api.client,
          path: { documentId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  documents
    .command("upload-file")
    .description("Upload a file for a document")
    .requiredOption("--id <id>", "Document ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .option("--effective-at-date <date>", "Effective date for the uploaded file")
    .option("--description <text>", "Description for the uploaded file")
    .action(
      async (opts: {
        id: string;
        file: string;
        effectiveAtDate?: string;
        description?: string;
      }) => {
        const filePath = opts.file.trim();
        if (!filePath) {
          throw new Error("--file is required");
        }
        const file = await readBinaryFile(filePath);
        await runSdk(getFlags, (api) =>
          uploadFileForDocument({
            client: api.client,
            path: { documentId: opts.id },
            body: {
              file,
              ...(opts.effectiveAtDate?.trim()
                ? { effectiveAtDate: opts.effectiveAtDate.trim() }
                : {}),
              ...(opts.description?.trim()
                ? { description: opts.description.trim() }
                : {}),
            },
          }),
        );
      },
    );

  documents
    .command("delete-file")
    .description("Delete an uploaded file for a document")
    .requiredOption("--id <id>", "Document ID")
    .requiredOption("--uploaded-file-id <id>", "Uploaded file ID")
    .action(async (opts: { id: string; uploadedFileId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteFileForDocument({
          client: api.client,
          path: {
            documentId: opts.id,
            uploadedFileId: opts.uploadedFileId,
          },
        }),
      );
    });

  documents
    .command("download-file")
    .description("Download uploaded file media for a document")
    .requiredOption("--id <id>", "Document ID")
    .requiredOption("--uploaded-file-id <id>", "Uploaded file ID")
    .option(
      "--output <path>",
      "Write downloaded bytes to file path (default stdout)",
    )
    .action(
      async (opts: {
        id: string;
        uploadedFileId: string;
        output?: string;
      }) => {
        await withClient(getFlags, async (api, flags) => {
          const result = await getUploadedfileMedia({
            client: api.client,
            path: {
              documentId: opts.id,
              uploadedFileId: opts.uploadedFileId,
            },
          });
          if (result.error) throw result.error;
          const data = result.data;
          const dest = opts.output?.trim();
          await writeDownloadedMedia(data, dest);
          if (dest) {
            printResponse({ savedTo: dest }, flags);
          }
        });
      },
    );

  documents
    .command("submit")
    .description("Submit document collection")
    .requiredOption("--id <id>", "Document ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        submitDocumentCollection({
          client: api.client,
          path: { documentId: opts.id },
        }),
      );
    });
}
