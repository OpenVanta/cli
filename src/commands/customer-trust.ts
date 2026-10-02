import type { Command } from "commander";
import { registerCustomerTrustAccountsCommand } from "./customer-trust-accounts.js";
import { registerCustomerTrustDeletionRequestsCommand } from "./customer-trust-deletion-requests.js";
import { registerCustomerTrustQuestionnairesCommand } from "./customer-trust-questionnaires.js";
import { registerCustomerTrustTagCategoriesCommand } from "./customer-trust-tag-categories.js";
import type { GetFlags } from "./helpers.js";

export function registerCustomerTrustCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const customerTrust = program
    .command("customer-trust")
    .description("Manage Customer Trust accounts, questionnaires, and tags");

  registerCustomerTrustAccountsCommand(customerTrust, getFlags);

  registerCustomerTrustDeletionRequestsCommand(customerTrust, getFlags);

  registerCustomerTrustQuestionnairesCommand(customerTrust, getFlags);

  registerCustomerTrustTagCategoriesCommand(customerTrust, getFlags);
}
