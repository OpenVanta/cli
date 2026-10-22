import type { Command } from "commander";
import {
  listContracts,
  getContract,
  deleteContract,
  uploadContract,
} from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  readBinaryFile,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerContractsCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const contracts = program
    .command("contracts")
    .description("Manage contracts");

  addPaginationOptions(
    contracts.command("list").description("List contracts"),
  ).action(async (opts) => {
    await runSdk(getFlags, (api) =>
      listContracts({ client: api.client, query: paginationQuery(opts) }),
    );
  });

  contracts
    .command("get")
    .description("Get a contract by ID")
    .requiredOption("--id <id>", "Contract ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        getContract({ client: api.client, path: { contractId: opts.id } }),
      );
    });

  contracts
    .command("delete")
    .description("Delete a contract")
    .requiredOption("--id <id>", "Contract ID")
    .action(async (opts: { id: string }) => {
      await runSdk(getFlags, (api) =>
        deleteContract({ client: api.client, path: { contractId: opts.id } }),
      );
    });

  contracts
    .command("upload")
    .description("Upload a contract")
    .requiredOption(
      "--file <path>",
      "Path to file to upload: the contract file to upload. Only PDF files are accepted",
    )
    .option(
      "--executed-date <date>",
      "ISO 8601 date indicating when the contract was executed",
    )
    .option(
      "--account-id <id>",
      "ID of the customer trust account to associate with this contract",
    )
    .option(
      "--external-id <id>",
      "Stable source-system identifier used to reject duplicate contract uploads; repeats return 409. Use the upstream document or record ID when available, such as the Microsoft Graph DriveItem ID for SharePoint or the Ironclad record ID for Ironclad. If there is no source system, generate and store a durable idempotency key. Maximum 256 characters",
    )
    .action(
      async (opts: {
        file: string;
        executedDate?: string;
        accountId?: string;
        externalId?: string;
      }) => {
        const file = await readBinaryFile(opts.file);
        await runSdk(getFlags, (api) =>
          uploadContract({
            client: api.client,
            body: {
              file,
              executedDate: opts.executedDate,
              accountId: opts.accountId,
              externalId: opts.externalId,
            },
          }),
        );
      },
    );
}
