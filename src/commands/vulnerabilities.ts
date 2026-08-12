import type { Command } from "commander";
import {
  deactivateVulnerabilities,
  getVulnerability,
  listVulnerabilities,
  reactivateVulnerabilities,
} from "../generated/sdk.gen.js";
import type {
  DeactivateVulnerabilitiesData,
  ExternalFindingSeverity,
  ReactivateVulnerabilitiesData,
} from "../generated/types.gen.js";
import {
  addJsonFileOptions,
  addPaginationOptions,
  paginationQuery,
  parseOptionalBoolString,
  readJSONPayload,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerVulnerabilitiesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vulnerabilities = program
    .command("vulnerabilities")
    .description("Manage vulnerabilities");

  addPaginationOptions(
    vulnerabilities
      .command("list")
      .description("List vulnerabilities")
      .option("--q <query>", "Filter vulnerabilities by search query")
      .option(
        "--is-deactivated <bool>",
        "Filter vulnerabilities by deactivation status (true/false)",
      )
      .option(
        "--external-vulnerability-id <id>",
        "Filter vulnerabilities by external vulnerability ID",
      )
      .option(
        "--is-fix-available <bool>",
        "Filter vulnerabilities by available fix status (true/false)",
      )
      .option(
        "--package-identifier <id>",
        "Filter vulnerabilities by package identifier",
      )
      .option(
        "--sla-deadline-after-date <date>",
        "Filter vulnerabilities with SLA deadline after this RFC3339 timestamp",
      )
      .option(
        "--sla-deadline-before-date <date>",
        "Filter vulnerabilities with SLA deadline before this RFC3339 timestamp",
      )
      .option(
        "--severity <severity>",
        "Filter vulnerabilities by severity (CRITICAL, HIGH, MEDIUM, LOW)",
      )
      .option(
        "--integration-id <id>",
        "Filter vulnerabilities by vulnerability scanner integration ID",
      )
      .option(
        "--include-vulnerabilities-without-slas <bool>",
        "Include vulnerabilities without SLA dates (true/false)",
      )
      .option(
        "--vulnerable-asset-id <id>",
        "Filter vulnerabilities by vulnerable asset ID",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      q?: string;
      isDeactivated?: string;
      externalVulnerabilityId?: string;
      isFixAvailable?: string;
      packageIdentifier?: string;
      slaDeadlineAfterDate?: string;
      slaDeadlineBeforeDate?: string;
      severity?: string;
      integrationId?: string;
      includeVulnerabilitiesWithoutSlas?: string;
      vulnerableAssetId?: string;
    }) => {
      const isDeactivated = parseOptionalBoolString(
        opts.isDeactivated,
        "is-deactivated",
      );
      const isFixAvailable = parseOptionalBoolString(
        opts.isFixAvailable,
        "is-fix-available",
      );
      const includeVulnerabilitiesWithoutSlas = parseOptionalBoolString(
        opts.includeVulnerabilitiesWithoutSlas,
        "include-vulnerabilities-without-slas",
      );
      await runSdk(getFlags, (api) =>
        listVulnerabilities({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            ...(opts.q?.trim() ? { q: opts.q.trim() } : {}),
            ...(isDeactivated !== undefined ? { isDeactivated } : {}),
            ...(opts.externalVulnerabilityId?.trim()
              ? { externalVulnerabilityId: opts.externalVulnerabilityId.trim() }
              : {}),
            ...(isFixAvailable !== undefined ? { isFixAvailable } : {}),
            ...(opts.packageIdentifier?.trim()
              ? { packageIdentifier: opts.packageIdentifier.trim() }
              : {}),
            ...(opts.slaDeadlineAfterDate?.trim()
              ? { slaDeadlineAfterDate: opts.slaDeadlineAfterDate.trim() }
              : {}),
            ...(opts.slaDeadlineBeforeDate?.trim()
              ? { slaDeadlineBeforeDate: opts.slaDeadlineBeforeDate.trim() }
              : {}),
            ...(opts.severity?.trim()
              ? { severity: opts.severity.trim() as ExternalFindingSeverity }
              : {}),
            ...(opts.integrationId?.trim()
              ? { integrationId: opts.integrationId.trim() }
              : {}),
            ...(includeVulnerabilitiesWithoutSlas !== undefined
              ? { includeVulnerabilitiesWithoutSlas }
              : {}),
            ...(opts.vulnerableAssetId?.trim()
              ? { vulnerableAssetId: opts.vulnerableAssetId.trim() }
              : {}),
          },
        }),
      );
    },
  );

  vulnerabilities
    .command("get")
    .description("Get a vulnerability by ID")
    .requiredOption("--id <id>", "Vulnerability ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVulnerability({
          client: api.client,
          path: { vulnerabilityId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    vulnerabilities
      .command("deactivate")
      .description("Deactivate vulnerabilities"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as DeactivateVulnerabilitiesData["body"];
    await runSdk(getFlags, (api) =>
      deactivateVulnerabilities({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    vulnerabilities
      .command("reactivate")
      .description("Reactivate vulnerabilities"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as ReactivateVulnerabilitiesData["body"];
    await runSdk(getFlags, (api) =>
      reactivateVulnerabilities({ client: api.client, body }),
    );
  });
}
