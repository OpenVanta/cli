import type { Command } from "commander";
import {
  listVulnerabilities,
  getVulnerability,
  deactivateVulnerabilities,
  reactivateVulnerabilities,
} from "../generated/sdk.gen.js";
import type {
  ListVulnerabilitiesData,
  DeactivateVulnerabilitiesData,
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
      .option(
        "--is-deactivated <bool>",
        "Filter vulnerabilities by deactivation status (true/false)",
        (value) => parseOptionalBoolString(value, "is-deactivated"),
      )
      .option(
        "--external-vulnerability-id <id>",
        "Filter vulnerabilities based on a specific external ID",
      )
      .option(
        "--is-fix-available <bool>",
        "Filter vulnerabilities that have an available fix (true/false)",
        (value) => parseOptionalBoolString(value, "is-fix-available"),
      )
      .option(
        "--package-identifier <id>",
        "Filter vulnerabilities that are from a specific package",
      )
      .option(
        "--sla-deadline-after-date <timestamp>",
        "Filter vulnerabilities with a fix due after a specific timestamp (ISO 8601 timestamp)",
      )
      .option(
        "--sla-deadline-before-date <timestamp>",
        "Filter vulnerabilities with a fix due before a specific timestamp (ISO 8601 timestamp)",
      )
      .option(
        "--severity <severity>",
        "Filter vulnerabilities by severity: CRITICAL, HIGH, LOW, MEDIUM",
      )
      .option(
        "--integration-id <id>",
        "Filter vulnerabilities by the vulnerability scanner that detected them",
      )
      .option(
        "--include-vulnerabilities-without-slas <bool>",
        "Include vulnerabilities without SLA dates (true/false)",
        (value) =>
          parseOptionalBoolString(
            value,
            "include-vulnerabilities-without-slas",
          ),
      )
      .option(
        "--vulnerable-asset-id <id>",
        "Filter vulnerabilities by a specific asset ID",
      )
      .option(
        "--q <query>",
        "Full-text filter on the vulnerability's name and description",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      isDeactivated?: boolean;
      externalVulnerabilityId?: string;
      isFixAvailable?: boolean;
      packageIdentifier?: string;
      slaDeadlineAfterDate?: string;
      slaDeadlineBeforeDate?: string;
      severity?: NonNullable<ListVulnerabilitiesData["query"]>["severity"];
      integrationId?: string;
      includeVulnerabilitiesWithoutSlas?: boolean;
      vulnerableAssetId?: string;
      q?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listVulnerabilities({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            isDeactivated: opts.isDeactivated,
            externalVulnerabilityId: opts.externalVulnerabilityId,
            isFixAvailable: opts.isFixAvailable,
            packageIdentifier: opts.packageIdentifier,
            slaDeadlineAfterDate: opts.slaDeadlineAfterDate,
            slaDeadlineBeforeDate: opts.slaDeadlineBeforeDate,
            severity: opts.severity,
            integrationId: opts.integrationId,
            includeVulnerabilitiesWithoutSlas:
              opts.includeVulnerabilitiesWithoutSlas,
            vulnerableAssetId: opts.vulnerableAssetId,
            q: opts.q,
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
