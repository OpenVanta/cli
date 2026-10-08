import type { Command } from "commander";
import { list as listIssues, getIssue } from "../generated/sdk.gen.js";
import type { ListData } from "../generated/types.gen.js";
import {
  addPaginationOptions,
  collectString,
  paginationQuery,
  parseOptionalBoolString,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerIssuesCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const issues = program
    .command("issues")
    .description("Manage issues");

  addPaginationOptions(
    issues
      .command("list")
      .description("List issues")
      .option(
        "--search <query>",
        "Search issue titles and descriptions",
      )
      .option(
        "--readable-issue-id-matches-any <id>",
        "Filter by readable issue ID (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--status-matches-any <status>",
        "Filter by status: NOT_STARTED, IN_PROGRESS, CLOSED (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--severity-matches-any <severity>",
        "Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, NO_SEVERITY (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--source-matches-any <source>",
        "Filter by source: AUDIT, AUDIT_EXTERNAL, INCIDENT, EXTERNAL_PARTY, SELF_ASSESSMENT, OTHER (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--type-matches-any <type>",
        "Filter by issue type: AREA_OF_CONCERN, MAJOR_NONCONFORMITY, MINOR_NONCONFORMITY, OPP_FOR_IMPROVEMENT, EXCEPTION, PROCESS_FOR_IMPROVEMENT (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--owner-id-matches-any <id>",
        "Filter by issue owner user ID (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--template-matches-any <template>",
        "Filter by template: STANDARD_ISSUE, STANDARD_POAM (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--close-reason-matches-any <reason>",
        "Filter by close reason: RESOLVED, DUPLICATE, ACCEPTED, OTHER (repeatable); applies only to CLOSED issues",
        collectString,
        [] as string[],
      )
      .option(
        "--closed-after-date <timestamp>",
        "Filter issues closed on or after an ISO 8601 timestamp",
      )
      .option(
        "--closed-before-date <timestamp>",
        "Filter issues closed on or before an ISO 8601 timestamp",
      )
      .option(
        "--include-issues-without-due-date <bool>",
        "Include undated issues with --due-before-date or --due-after-date (true/false)",
        (value) => parseOptionalBoolString(value, "include-issues-without-due-date"),
      )
      .option(
        "--include-only-issues-without-due-date <bool>",
        "Include only undated issues (true/false); cannot combine with --due-before-date or --due-after-date",
        (value) => parseOptionalBoolString(value, "include-only-issues-without-due-date"),
      )
      .option(
        "--due-after-date <timestamp>",
        "Filter issues due on or after an ISO 8601 timestamp",
      )
      .option(
        "--due-before-date <timestamp>",
        "Filter issues due on or before an ISO 8601 timestamp",
      )
      .option(
        "--detected-after-date <timestamp>",
        "Filter issues detected on or after an ISO 8601 timestamp",
      )
      .option(
        "--detected-before-date <timestamp>",
        "Filter issues detected on or before an ISO 8601 timestamp",
      )
      .option(
        "--created-after-date <timestamp>",
        "Filter issues created on or after an ISO 8601 timestamp",
      )
      .option(
        "--created-before-date <timestamp>",
        "Filter issues created on or before an ISO 8601 timestamp",
      )
      .option(
        "--audit-id-matches-any <id>",
        "Filter by source audit ID (repeatable)",
        collectString,
        [] as string[],
      )
      .option(
        "--control-id-matches-any <id>",
        "Filter by mapped control ID (repeatable)",
        collectString,
        [] as string[],
      )
      .option("--order-by <field>", "Sort by: dueDate, createdDate, detectedDate, lastModifiedDate, status, severity")
      .option(
        "--order-direction <direction>",
        "Sort direction: asc, desc (default: asc)",
      ),
  ).action(async (opts: NonNullable<ListData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listIssues({
        client: api.client,
        query: {
          ...paginationQuery(opts),
          search: opts.search,
          readableIssueIdMatchesAny: opts.readableIssueIdMatchesAny,
          statusMatchesAny: opts.statusMatchesAny,
          severityMatchesAny: opts.severityMatchesAny,
          sourceMatchesAny: opts.sourceMatchesAny,
          typeMatchesAny: opts.typeMatchesAny,
          ownerIdMatchesAny: opts.ownerIdMatchesAny,
          templateMatchesAny: opts.templateMatchesAny,
          closeReasonMatchesAny: opts.closeReasonMatchesAny,
          closedAfterDate: opts.closedAfterDate,
          closedBeforeDate: opts.closedBeforeDate,
          includeIssuesWithoutDueDate: opts.includeIssuesWithoutDueDate,
          includeOnlyIssuesWithoutDueDate: opts.includeOnlyIssuesWithoutDueDate,
          dueAfterDate: opts.dueAfterDate,
          dueBeforeDate: opts.dueBeforeDate,
          detectedAfterDate: opts.detectedAfterDate,
          detectedBeforeDate: opts.detectedBeforeDate,
          createdAfterDate: opts.createdAfterDate,
          createdBeforeDate: opts.createdBeforeDate,
          auditIdMatchesAny: opts.auditIdMatchesAny,
          controlIdMatchesAny: opts.controlIdMatchesAny,
          orderBy: opts.orderBy,
          orderDirection: opts.orderDirection,
        },
      }),
    );
  });

  issues
    .command("get")
    .description("Get an issue by ID")
    .requiredOption("--id <id>", "Issue ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getIssue({
          client: api.client,
          path: { issueId: opts.id },
        }),
      );
    });
}
