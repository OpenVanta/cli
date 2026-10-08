import type { Command } from "commander";
import {
  getConnectedIntegration,
  getResource,
  getResourceKindDetails,
  listConnectedIntegrations,
  listResourceKindSummaries,
  listResources,
  updateResource,
  updateResources,
} from "../generated/sdk.gen.js";
import type {
  UpdateResourceData,
  UpdateResourcesData,
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

export function registerIntegrationsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const integrations = program
    .command("integrations")
    .description("Manage connected integrations");

  addPaginationOptions(
    integrations.command("list").description("List connected integrations"),
  ).action(async (opts: { pageSize?: number; pageCursor?: string }) => {
    await runSdk(getFlags, (api) =>
      listConnectedIntegrations({
        client: api.client,
        query: paginationQuery(opts),
      }),
    );
  });

  integrations
    .command("get")
    .description("Get a connected integration by ID")
    .requiredOption("--id <id>", "Integration ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getConnectedIntegration({
          client: api.client,
          path: { integrationId: opts.id },
        }),
      );
    });

  integrations
    .command("list-resource-kinds")
    .description("List resource kind summaries for an integration")
    .requiredOption("--id <id>", "Integration ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        listResourceKindSummaries({
          client: api.client,
          path: { integrationId: opts.id },
        }),
      );
    });

  integrations
    .command("get-resource-kind")
    .description("Get details for an integration resource kind")
    .requiredOption("--id <id>", "Integration ID")
    .requiredOption("--resource-kind <kind>", "Integration resource kind")
    .option(
      "--connection-id <id>",
      "Filter by integration connection ID",
    )
    .action(
      async (opts: {
        id: string;
        resourceKind: string;
        connectionId?: string;
      }) => {
        await runSdk(getFlags, (api) =>
          getResourceKindDetails({
            client: api.client,
            path: {
              integrationId: opts.id,
              resourceKind: opts.resourceKind,
            },
            query: {
              ...(opts.connectionId?.trim()
                ? { connectionId: opts.connectionId.trim() }
                : {}),
            },
          }),
        );
      },
    );

  addPaginationOptions(
    integrations
      .command("list-resources")
      .description("List resources for an integration resource kind")
      .requiredOption("--id <id>", "Integration ID")
      .requiredOption("--resource-kind <kind>", "Integration resource kind")
      .option(
        "--connection-id <id>",
        "Filter by integration connection ID",
      )
      .option(
        "--has-description <bool>",
        "Filter resources with descriptions (true/false)",
      )
      .option(
        "--has-owner <bool>",
        "Filter resources with owners (true/false)",
      )
      .option(
        "--is-in-scope <bool>",
        "Filter resources by scope status (true/false)",
      ),
  ).action(
    async (opts: {
      id: string;
      resourceKind: string;
      pageSize?: number;
      pageCursor?: string;
      connectionId?: string;
      hasDescription?: string;
      hasOwner?: string;
      isInScope?: string;
    }) => {
      const hasDescription = parseOptionalBoolString(
        opts.hasDescription,
        "has-description",
      );
      const hasOwner = parseOptionalBoolString(opts.hasOwner, "has-owner");
      const isInScope = parseOptionalBoolString(opts.isInScope, "is-in-scope");
      await runSdk(getFlags, (api) =>
        listResources({
          client: api.client,
          path: {
            integrationId: opts.id,
            resourceKind: opts.resourceKind,
          },
          query: {
            ...paginationQuery(opts),
            ...(opts.connectionId?.trim()
              ? { connectionId: opts.connectionId.trim() }
              : {}),
            ...(hasDescription !== undefined ? { hasDescription } : {}),
            ...(hasOwner !== undefined ? { hasOwner } : {}),
            ...(isInScope !== undefined ? { isInScope } : {}),
          },
        }),
      );
    },
  );

  integrations
    .command("get-resource")
    .description("Get an integration resource by ID")
    .requiredOption("--id <id>", "Integration ID")
    .requiredOption("--resource-kind <kind>", "Integration resource kind")
    .requiredOption("--resource-id <id>", "Resource ID")
    .action(
      async (opts: {
        id: string;
        resourceKind: string;
        resourceId: string;
      }) => {
        await runSdk(getFlags, (api) =>
          getResource({
            client: api.client,
            path: {
              integrationId: opts.id,
              resourceKind: opts.resourceKind,
              resourceId: opts.resourceId,
            },
          }),
        );
      },
    );

  addJsonFileOptions(
    integrations
      .command("update-resource")
      .description("Update metadata for a single integration resource")
      .requiredOption("--id <id>", "Integration ID")
      .requiredOption("--resource-kind <kind>", "Integration resource kind")
      .requiredOption("--resource-id <id>", "Resource ID"),
  ).action(
    async (opts: {
      id: string;
      resourceKind: string;
      resourceId: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateResourceData["body"];
      await runSdk(getFlags, (api) =>
        updateResource({
          client: api.client,
          path: {
            integrationId: opts.id,
            resourceKind: opts.resourceKind,
            resourceId: opts.resourceId,
          },
          body,
        }),
      );
    },
  );

  addJsonFileOptions(
    integrations
      .command("update-resources")
      .description("Update metadata for multiple integration resources")
      .requiredOption("--id <id>", "Integration ID")
      .requiredOption("--resource-kind <kind>", "Integration resource kind"),
  ).action(
    async (opts: {
      id: string;
      resourceKind: string;
      json?: string;
      file?: string;
    }) => {
      const body = (await readJSONPayload(
        opts.json,
        opts.file,
      )) as UpdateResourcesData["body"];
      await runSdk(getFlags, (api) =>
        updateResources({
          client: api.client,
          path: {
            integrationId: opts.id,
            resourceKind: opts.resourceKind,
          },
          body,
        }),
      );
    },
  );
}
