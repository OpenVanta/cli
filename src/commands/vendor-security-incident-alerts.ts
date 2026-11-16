import type { Command } from "commander";
import {
  listVendorSecurityIncidentAlerts,
  getVendorSecurityIncidentAlert,
  updateVendorSecurityIncidentAlerts,
} from "../generated/sdk.gen.js";
import type {
  ListVendorSecurityIncidentAlertsData,
  UpdateVendorSecurityIncidentAlertsData,
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

export function registerVendorSecurityIncidentAlertsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorSecurityIncidentAlerts = program
    .command("vendor-security-incident-alerts")
    .description("Manage vendor security incident alerts");

  addPaginationOptions(
    vendorSecurityIncidentAlerts
      .command("list")
      .description("List vendor security incident alerts")
      .option(
        "--q <query>",
        "Case-insensitive search on alert title and affected vendor name",
      )
      .option(
        "--vendor-id-matches-any <id>",
        "Organization vendor IDs (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--resolution-state-matches-any <state>",
        "Filter by resolution state. Returns alerts matching any of the specified states: OPEN, RESOLVED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--confirmation-status-matches-any <status>",
        "Filter by incident confirmation status. Returns alerts matching any of the specified statuses: POTENTIAL, CONFIRMED, SUSPECTED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--impact-severity-matches-any <severity>",
        "Filter by overall impact severity. Returns alerts matching any of the specified severities: UNSPECIFIED, CRITICAL, HIGH, MEDIUM, LOW (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--data-leak-severity-matches-any <severity>",
        "Matches a DATA_LEAK consequence's severity, independently of overall impact: UNSPECIFIED, CRITICAL, HIGH, MEDIUM, LOW (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--sort <sort>",
        "Filter by sort: creationDate, impactSeverity, resolutionState, confirmationStatus",
      )
      .option(
        "--direction <direction>",
        "Ascending means oldest first, highest impact first (CRITICAL to LOW to UNSPECIFIED), OPEN before RESOLVED, or CONFIRMED before SUSPECTED before POTENTIAL. Descending reverses each order: asc, desc",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      q?: string;
      vendorIdMatchesAny: string[];
      resolutionStateMatchesAny: NonNullable<
        NonNullable<
          ListVendorSecurityIncidentAlertsData["query"]
        >["resolutionStateMatchesAny"]
      >;
      confirmationStatusMatchesAny: NonNullable<
        NonNullable<
          ListVendorSecurityIncidentAlertsData["query"]
        >["confirmationStatusMatchesAny"]
      >;
      impactSeverityMatchesAny: NonNullable<
        NonNullable<
          ListVendorSecurityIncidentAlertsData["query"]
        >["impactSeverityMatchesAny"]
      >;
      dataLeakSeverityMatchesAny: NonNullable<
        NonNullable<
          ListVendorSecurityIncidentAlertsData["query"]
        >["dataLeakSeverityMatchesAny"]
      >;
      sort?: NonNullable<ListVendorSecurityIncidentAlertsData["query"]>["sort"];
      direction?: NonNullable<
        ListVendorSecurityIncidentAlertsData["query"]
      >["direction"];
    }) => {
      await runSdk(getFlags, (api) =>
        listVendorSecurityIncidentAlerts({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            q: opts.q,
            vendorIdMatchesAny: opts.vendorIdMatchesAny,
            resolutionStateMatchesAny: opts.resolutionStateMatchesAny,
            confirmationStatusMatchesAny: opts.confirmationStatusMatchesAny,
            impactSeverityMatchesAny: opts.impactSeverityMatchesAny,
            dataLeakSeverityMatchesAny: opts.dataLeakSeverityMatchesAny,
            sort: opts.sort,
            direction: opts.direction,
          },
        }),
      );
    },
  );

  vendorSecurityIncidentAlerts
    .command("get")
    .description("Get a vendor security incident alert by ID")
    .requiredOption("--id <id>", "Vendor security incident alert ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendorSecurityIncidentAlert({
          client: api.client,
          path: { alertId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    vendorSecurityIncidentAlerts
      .command("update")
      .description(
        'Update vendor security incident alerts with JSON {"alertIds":["..."],"resolutionState":"..."} (1-100 alert IDs; resolutionState: OPEN, RESOLVED)',
      ),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateVendorSecurityIncidentAlertsData["body"];
    await runSdk(getFlags, (api) =>
      updateVendorSecurityIncidentAlerts({ client: api.client, body }),
    );
  });
}
