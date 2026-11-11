import type { Command } from "commander";
import {
  listVendorAlerts,
  getVendorAlert,
  updateVendorAlerts,
} from "../generated/sdk.gen.js";
import type {
  ListVendorAlertsData,
  UpdateVendorAlertsData,
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

export function registerVendorAlertsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const vendorAlerts = program
    .command("vendor-alerts")
    .description("Manage vendor alerts");

  addPaginationOptions(
    vendorAlerts
      .command("list")
      .description("List vendor alerts")
      .option("--search <query>", "Search alert titles and vendor names")
      .option(
        "--status-matches-any <status>",
        "Filter to alerts matching any of the provided statuses: OPEN, ESCALATED, RESOLVED, NOT_RELEVANT, AUTO_RESOLVED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--severity-matches-any <severity>",
        "Filter to alerts matching any of the provided severities: CRITICAL, HIGH, MEDIUM, LOW (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--category-matches-any <category>",
        "Filter to alerts matching any of the provided security categories (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--type-matches-any <type>",
        "Filter to alerts matching any of the provided types: GENERAL, CVE, LEAKED_CREDENTIALS (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--vendor-risk-level-matches-any <level>",
        "Filter to alerts whose vendors match any of the provided inherent risk levels: CRITICAL, HIGH, MEDIUM, LOW, UNSCORED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--order-by <field>",
        "Field to sort results by. Defaults to severity: severity, status, creationDate",
      )
      .option(
        "--order-direction <direction>",
        "Direction to sort results in. Defaults to descending: asc, desc",
      ),
  ).action(
    async (opts: {
      pageSize?: number;
      pageCursor?: string;
      search?: string;
      statusMatchesAny: NonNullable<
        NonNullable<ListVendorAlertsData["query"]>["statusMatchesAny"]
      >;
      severityMatchesAny: NonNullable<
        NonNullable<ListVendorAlertsData["query"]>["severityMatchesAny"]
      >;
      categoryMatchesAny: string[];
      typeMatchesAny: NonNullable<
        NonNullable<ListVendorAlertsData["query"]>["typeMatchesAny"]
      >;
      vendorRiskLevelMatchesAny: NonNullable<
        NonNullable<ListVendorAlertsData["query"]>["vendorRiskLevelMatchesAny"]
      >;
      orderBy?: NonNullable<ListVendorAlertsData["query"]>["orderBy"];
      orderDirection?: NonNullable<
        ListVendorAlertsData["query"]
      >["orderDirection"];
    }) => {
      await runSdk(getFlags, (api) =>
        listVendorAlerts({
          client: api.client,
          query: {
            ...paginationQuery(opts),
            search: opts.search,
            statusMatchesAny: opts.statusMatchesAny,
            severityMatchesAny: opts.severityMatchesAny,
            categoryMatchesAny: opts.categoryMatchesAny,
            typeMatchesAny: opts.typeMatchesAny,
            vendorRiskLevelMatchesAny: opts.vendorRiskLevelMatchesAny,
            orderBy: opts.orderBy,
            orderDirection: opts.orderDirection,
          },
        }),
      );
    },
  );

  vendorAlerts
    .command("get")
    .description("Get a vendor alert by ID")
    .requiredOption("--id <id>", "Vendor alert ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getVendorAlert({ client: api.client, path: { alertId: opts.id } }),
      );
    });

  addJsonFileOptions(
    vendorAlerts
      .command("update")
      .description(
        'Update vendor alerts with JSON {"alertIds":["..."],"status":"..."} (1-100 IDs; status: OPEN, ESCALATED, RESOLVED, NOT_RELEVANT)',
      ),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateVendorAlertsData["body"];
    await runSdk(getFlags, (api) =>
      updateVendorAlerts({ client: api.client, body }),
    );
  });
}
