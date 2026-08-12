import type { Command } from "commander";
import {
  createVendor,
  createVendorFinding,
  deleteById,
  deleteFindingById,
  deleteSecurityReviewDocumentById,
  getSecurityReviewDocuments,
  getSecurityReviewsById,
  getSecurityReviewsByVendorId,
  getVendor,
  listVendorDocuments,
  listVendorFindings,
  listVendors,
  setStatusForVendor,
  updateVendor,
  updateVendorFinding,
  uploadDocumentForSecurityReview,
  uploadDocumentToVendor,
} from "../generated/sdk.gen.js";
import type {
  CreateFindingInput,
  CreateVendorInput,
  UpdateFindingInput,
  UpdateVendorInput,
  VendorStatus,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  collectString,
  paginationQuery,
  readBinaryFile,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVendorsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendors = program.command("vendors").description("Manage vendors");

  addPaginationOptions(
    vendors
      .command("list")
      .description("List vendors")
      .option("--name <name>", "Filter vendors by name (partial match)")
      .option(
        "--status-matches-any <status>",
        "Vendor statuses to filter by (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      name?: string;
      statusMatchesAny: string[];
    }) => {
      const statusMatchesAny = opts.statusMatchesAny.filter(
        Boolean,
      ) as VendorStatus[];
      await runSdk(getFlags, (api) =>
        listVendors({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.name?.trim() ? { name: opts.name.trim() } : {}),
            ...(statusMatchesAny.length > 0 ? { statusMatchesAny } : {}),
          },
        }),
      );
    },
  );

  vendors
    .command("get")
    .description("Get a vendor by ID")
    .requiredOption("--id <id>", "Vendor ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendor({ client: api.client, path: { vendorId: opts.id } }),
      );
    });

  addJsonFileOptions(
    vendors.command("create").description("Create a vendor"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateVendorInput;
    await runSdk(getFlags, (api) =>
      createVendor({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    vendors
      .command("update")
      .description("Update a vendor")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateVendorInput;
    await runSdk(getFlags, (api) =>
      updateVendor({
        client: api.client,
        path: { vendorId: opts.id },
        body,
      }),
    );
  });

  vendors
    .command("delete")
    .description("Delete a vendor")
    .requiredOption("--id <id>", "Vendor ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteById({ client: api.client, path: { vendorId: opts.id } }),
      );
    });

  vendors
    .command("set-status")
    .description("Set vendor status")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--status <status>", "Vendor status")
    .action(async (opts: { id: string; status: string }) => {
      await runSdk(getFlags, (api) =>
        setStatusForVendor({
          client: api.client,
          path: { vendorId: opts.id },
          body: { status: opts.status.trim() },
        }),
      );
    });

  addPaginationOptions(
    vendors
      .command("list-documents")
      .description("List vendor documents")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        listVendorDocuments({
          client: api.client,
          path: { vendorId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  vendors
    .command("upload-document")
    .description("Upload a document for a vendor")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--type <type>", "Vendor document type")
    .option("--title <title>", "Document title")
    .option("--description <text>", "Document description")
    .action(
      async (opts: {
        id: string;
        file: string;
        type: string;
        title?: string;
        description?: string;
      }) => {
        const filePath = opts.file.trim();
        if (!filePath) {
          throw new Error("--file is required");
        }
        const type = opts.type.trim();
        if (!type) {
          throw new Error("--type is required");
        }
        const file = await readBinaryFile(filePath);
        await runSdk(getFlags, (api) =>
          uploadDocumentToVendor({
            client: api.client,
            path: { vendorId: opts.id },
            body: {
              file,
              type,
              ...(opts.title?.trim() ? { title: opts.title.trim() } : {}),
              ...(opts.description?.trim()
                ? { description: opts.description.trim() }
                : {}),
            },
          }),
        );
      },
    );

  addPaginationOptions(
    vendors
      .command("list-security-reviews")
      .description("List vendor security reviews")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(
    async (opts: { id: string; pageSize?: number; pageCursor?: string }) => {
      await runSdk(getFlags, (api) =>
        getSecurityReviewsByVendorId({
          client: api.client,
          path: { vendorId: opts.id },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  vendors
    .command("get-security-review")
    .description("Get a vendor security review")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--security-review-id <id>", "Security review ID")
    .action(async (opts: { id: string; securityReviewId: string }) => {
      await runSdk(getFlags, (api) =>
        getSecurityReviewsById({
          client: api.client,
          path: {
            vendorId: opts.id,
            securityReviewId: opts.securityReviewId,
          },
        }),
      );
    });

  addPaginationOptions(
    vendors
      .command("list-security-review-documents")
      .description("List documents for a vendor security review")
      .requiredOption("--id <id>", "Vendor ID")
      .requiredOption("--security-review-id <id>", "Security review ID"),
  ).action(
    async (opts: {
      id: string;
      securityReviewId: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        getSecurityReviewDocuments({
          client: api.client,
          path: {
            vendorId: opts.id,
            securityReviewId: opts.securityReviewId,
          },
          query: paginationQuery(opts),
        }),
      );
    },
  );

  vendors
    .command("upload-security-review-document")
    .description("Upload a document for a vendor security review")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--security-review-id <id>", "Security review ID")
    .requiredOption("--file <path>", "Path to file to upload")
    .requiredOption("--type <type>", "Vendor document type")
    .option("--title <title>", "Document title")
    .option("--description <text>", "Document description")
    .action(
      async (opts: {
        id: string;
        securityReviewId: string;
        file: string;
        type: string;
        title?: string;
        description?: string;
      }) => {
        const filePath = opts.file.trim();
        if (!filePath) {
          throw new Error("--file is required");
        }
        const type = opts.type.trim();
        if (!type) {
          throw new Error("--type is required");
        }
        const file = await readBinaryFile(filePath);
        await runSdk(getFlags, (api) =>
          uploadDocumentForSecurityReview({
            client: api.client,
            path: {
              vendorId: opts.id,
              securityReviewId: opts.securityReviewId,
            },
            body: {
              file,
              type,
              ...(opts.title?.trim() ? { title: opts.title.trim() } : {}),
              ...(opts.description?.trim()
                ? { description: opts.description.trim() }
                : {}),
            },
          }),
        );
      },
    );

  vendors
    .command("delete-security-review-document")
    .description("Delete a document for a vendor security review")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--security-review-id <id>", "Security review ID")
    .requiredOption("--document-id <id>", "Document ID")
    .action(
      async (opts: {
        id: string;
        securityReviewId: string;
        documentId: string;
      }) => {
        await runSdk(getFlags, (api) =>
          deleteSecurityReviewDocumentById({
            client: api.client,
            path: {
              vendorId: opts.id,
              securityReviewId: opts.securityReviewId,
              documentId: opts.documentId,
            },
          }),
        );
      },
    );

  addPaginationOptions(
    vendors
      .command("list-findings")
      .description("List vendor findings")
      .requiredOption("--id <id>", "Vendor ID")
      .option(
        "--security-review-id <id>",
        "Filter findings by security review ID",
      )
      .option("--document-id <id>", "Filter findings by document ID"),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
      securityReviewId?: string;
      documentId?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listVendorFindings({
          client: api.client,
          path: { vendorId: opts.id },
          query: {
            ...paginationQuery(opts),
            ...(opts.securityReviewId?.trim()
              ? { securityReviewId: opts.securityReviewId.trim() }
              : {}),
            ...(opts.documentId?.trim()
              ? { documentId: opts.documentId.trim() }
              : {}),
          },
        }),
      );
    },
  );

  addJsonFileOptions(
    vendors
      .command("create-finding")
      .description("Create a vendor finding")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateFindingInput;
    await runSdk(getFlags, (api) =>
      createVendorFinding({
        client: api.client,
        path: { vendorId: opts.id },
        body,
      }),
    );
  });

  addJsonFileOptions(
    vendors
      .command("update-finding")
      .description("Update a vendor finding")
      .requiredOption("--id <id>", "Vendor ID")
      .requiredOption("--finding-id <id>", "Finding ID"),
  ).action(
    async (opts: {
      id: string;
      findingId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateFindingInput;
      await runSdk(getFlags, (api) =>
        updateVendorFinding({
          client: api.client,
          path: { vendorId: opts.id, findingId: opts.findingId },
          body,
        }),
      );
    },
  );

  vendors
    .command("delete-finding")
    .description("Delete a vendor finding")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--finding-id <id>", "Finding ID")
    .action(async (opts: { id: string; findingId: string }) => {
      await runSdk(getFlags, (api) =>
        deleteFindingById({
          client: api.client,
          path: { vendorId: opts.id, findingId: opts.findingId },
        }),
      );
    });
}
