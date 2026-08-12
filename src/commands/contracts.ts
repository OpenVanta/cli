import type { Command } from "commander";
import {
  deleteContract,
  getContract,
  listContracts,
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
    .requiredOption("--file <path>", "Path to contract file to upload")
    .option(
      "--executed-date <date>",
      "ISO 8601 date when the contract was executed",
    )
    .option(
      "--account-id <id>",
      "Customer trust account ID to associate with the contract",
    )
    .action(
      async (opts: {
        file: string;
        executedDate?: string;
        accountId?: string;
      }) => {
        const file = await readBinaryFile(opts.file.trim());
        await runSdk(getFlags, (api) =>
          uploadContract({
            client: api.client,
            body: {
              file,
              ...(opts.executedDate?.trim()
                ? { executedDate: opts.executedDate.trim() }
                : {}),
              ...(opts.accountId?.trim()
                ? { accountId: opts.accountId.trim() }
                : {}),
            },
          }),
        );
      },
    );
}
