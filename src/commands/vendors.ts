import type { Command } from "commander";
import {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteById,
  getAssessmentsByVendorId,
  getAssessmentById,
  listVendorDocuments,
  uploadDocumentToVendor,
  listVendorFindings,
  createVendorFinding,
  updateVendorFinding,
  deleteFindingById,
  getSecurityReviewsByVendorId,
  getSecurityReviewsById,
  getSecurityReviewDocuments,
  uploadDocumentForSecurityReview,
  deleteSecurityReviewDocumentById,
  setStatusForVendor,
} from "../generated/sdk.gen.js";
import type {
  ListVendorsData,
  CreateVendorData,
  UpdateVendorData,
  GetAssessmentsByVendorIdData,
  CreateVendorFindingData,
  UpdateVendorFindingData,
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
      .option(
        "--name <name>",
        "Filter vendors by name (case-insensitive, partial match)",
      )
      .option(
        "--status-matches-any <status>",
        "Filter vendors by status (can specify multiple): MANAGED, ARCHIVED, IN_PROCUREMENT (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      name?: string;
      statusMatchesAny: NonNullable<NonNullable<ListVendorsData["query"]>["statusMatchesAny"]>;
    }) => {
      await runSdk(getFlags, (api) =>
        listVendors({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            name: opts.name,
            statusMatchesAny: opts.statusMatchesAny,
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
    )) as CreateVendorData["body"];
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
    )) as UpdateVendorData["body"];
    await runSdk(getFlags, (api) =>
      updateVendor({ client: api.client, path: { vendorId: opts.id }, body }),
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

  addPaginationOptions(
    vendors
      .command("list-assessments")
      .description("List assessments for a vendor")
      .requiredOption("--id <id>", "Vendor ID")
      .option(
        "--type-id-matches-any <id>",
        "Filter by assessment type ID from vendor-assessment-types list (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--status-matches-any <status>",
        "Filter assessments to any of the given statuses: NOT_STARTED, IN_PROGRESS, COMPLETED (repeatable)",
        collectString,
        [] as string[],
      ),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
      typeIdMatchesAny: string[];
      statusMatchesAny: NonNullable<NonNullable<GetAssessmentsByVendorIdData["query"]>["statusMatchesAny"]>;
    }) => {
      await runSdk(getFlags, (api) =>
        getAssessmentsByVendorId({
          client: api.client,
          path: { vendorId: opts.id },
          query: {
            ...paginationQuery(opts),
            typeIdMatchesAny: opts.typeIdMatchesAny,
            statusMatchesAny: opts.statusMatchesAny,
          },
        }),
      );
    },
  );

  vendors
    .command("get-assessment")
    .description("Get a vendor assessment by ID")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--assessment-id <id>", "Assessment ID")
    .action(async (opts: { id: string; assessmentId: string }) => {
      await runSdk(getFlags, (api) =>
        getAssessmentById({
          client: api.client,
          path: { vendorId: opts.id, assessmentId: opts.assessmentId },
        }),
      );
    });

  addPaginationOptions(
    vendors
      .command("list-documents")
      .description("List documents for a vendor")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
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
    .requiredOption("--type <type>", "Type of the vendor document")
    .option("--title <title>", "The document's title")
    .option("--description <text>", "The document's description")
    .action(
      async (opts: {
        id: string;
        file: string;
        type: string;
        title?: string;
        description?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          uploadDocumentToVendor({
            client: api.client,
            path: { vendorId: opts.id },
            body: {
              file,
              type: opts.type,
              title: opts.title,
              description: opts.description,
            },
          }),
        );
      },
    );

  addPaginationOptions(
    vendors
      .command("list-findings")
      .description("List findings for a vendor")
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
            securityReviewId: opts.securityReviewId,
            documentId: opts.documentId,
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
    )) as CreateVendorFindingData["body"];
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
      )) as UpdateVendorFindingData["body"];
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

  addPaginationOptions(
    vendors
      .command("list-security-reviews")
      .description("List security reviews for a vendor")
      .requiredOption("--id <id>", "Vendor ID"),
  ).action(
    async (opts: {
      id: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
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
    .description("Get a vendor security review by ID")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--security-review-id <id>", "Security review ID")
    .action(async (opts: { id: string; securityReviewId: string }) => {
      await runSdk(getFlags, (api) =>
        getSecurityReviewsById({
          client: api.client,
          path: { vendorId: opts.id, securityReviewId: opts.securityReviewId },
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
          path: { vendorId: opts.id, securityReviewId: opts.securityReviewId },
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
    .requiredOption("--type <type>", "Type of the vendor document")
    .option("--title <title>", "The document's title")
    .option("--description <text>", "The document's description")
    .action(
      async (opts: {
        id: string;
        securityReviewId: string;
        file: string;
        type: string;
        title?: string;
        description?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          uploadDocumentForSecurityReview({
            client: api.client,
            path: { vendorId: opts.id, securityReviewId: opts.securityReviewId },
            body: {
              file,
              type: opts.type,
              title: opts.title,
              description: opts.description,
            },
          }),
        );
      },
    );

  vendors
    .command("delete-security-review-document")
    .description("Delete a vendor security review document")
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

  vendors
    .command("set-status")
    .description("Set status for a vendor")
    .requiredOption("--id <id>", "Vendor ID")
    .requiredOption("--status <status>", "Status of the vendor")
    .action(async (opts: { id: string; status: string }) => {
      await runSdk(getFlags, (api) =>
        setStatusForVendor({
          client: api.client,
          path: { vendorId: opts.id },
          body: { status: opts.status },
        }),
      );
    });
}
