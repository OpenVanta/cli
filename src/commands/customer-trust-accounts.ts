import type { Command } from "commander";
import {
  listCustomerTrustAccounts,
  createCustomerTrustAccount,
  getCustomerTrustAccount,
  deleteCustomerTrustAccount,
  updateCustomerTrustAccount,
} from "../generated/sdk.gen.js";
import type {
  ListCustomerTrustAccountsData,
  CreateCustomerTrustAccountData,
  UpdateCustomerTrustAccountData,
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

export function registerCustomerTrustAccountsCommand(
  customerTrust: Command,
  getFlags: GetFlags,
): void {
  const accounts = customerTrust
    .command("accounts")
    .description("Manage Customer Trust accounts");

  addPaginationOptions(
    accounts
      .command("list")
      .description("List Customer Trust accounts")
      .option("--search-string <text>", "Search accounts by text")
      .option(
        "--is-auto-approval-enabled <boolean>",
        "Filter by whether access requests are auto-approved (true/false)",
        (value) => parseOptionalBoolString(value, "is-auto-approval-enabled"),
      )
      .option("--custom-fields-filter <text>", "Filter by custom field values"),
  ).action(async (opts: NonNullable<ListCustomerTrustAccountsData["query"]>) => {
    await runSdk(getFlags, (api) =>
      listCustomerTrustAccounts({
        client: api.client,
        query: {
          ...paginationQuery(opts),
          searchString: opts.searchString,
          isAutoApprovalEnabled: opts.isAutoApprovalEnabled,
          customFieldsFilter: opts.customFieldsFilter,
        },
      }),
    );
  });

  accounts
    .command("get")
    .description("Get a Customer Trust account by ID")
    .requiredOption("--id <id>", "Customer Trust account ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getCustomerTrustAccount({
          client: api.client,
          path: { accountId: opts.id },
        }),
      );
    });

  addJsonFileOptions(
    accounts.command("create").description("Create a Customer Trust account"),
  ).action(async (opts: { json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as CreateCustomerTrustAccountData["body"];
    await runSdk(getFlags, (api) =>
      createCustomerTrustAccount({ client: api.client, body }),
    );
  });

  addJsonFileOptions(
    accounts
      .command("update")
      .description("Update a Customer Trust account")
      .requiredOption("--id <id>", "Customer Trust account ID"),
  ).action(async (opts: { id: string; json?: string; file?: string }) => {
    const body = (await readJSONPayload(
      opts.json,
      opts.file,
    )) as UpdateCustomerTrustAccountData["body"];
    await runSdk(getFlags, (api) =>
      updateCustomerTrustAccount({
        client: api.client,
        path: { accountId: opts.id },
        body,
      }),
    );
  });

  accounts
    .command("delete")
    .description("Delete a Customer Trust account")
    .requiredOption("--id <id>", "Customer Trust account ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteCustomerTrustAccount({
          client: api.client,
          path: { accountId: opts.id },
        }),
      );
    });
}
