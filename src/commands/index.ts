import type { Command } from "commander";
import { registerControlsCommand } from "./controls.js";
import { registerPoliciesCommand } from "./policies.js";
import { registerDocumentsCommand } from "./documents.js";
import { registerTestsCommand } from "./tests.js";
import { registerPeopleCommand } from "./people.js";
import { registerPersonnelNotificationSettingsCommand } from "./personnel-notification-settings.js";
import { registerGroupsCommand } from "./groups.js";
import { registerFrameworksCommand } from "./frameworks.js";
import { registerUsersCommand } from "./users.js";
import { registerVulnerabilitiesCommand } from "./vulnerabilities.js";
import { registerVulnerableAssetsCommand } from "./vulnerable-assets.js";
import { registerVulnerabilityRemediationsCommand } from "./vulnerability-remediations.js";
import { registerContractsCommand } from "./contracts.js";
import { registerRiskScenariosCommand } from "./risk-scenarios.js";
import { registerMonitoredComputersCommand } from "./monitored-computers.js";
import { registerVendorsCommand } from "./vendors.js";
import { registerVendorAssessmentTypesCommand } from "./vendor-assessment-types.js";
import { registerVendorRiskAttributesCommand } from "./vendor-risk-attributes.js";
import { registerDiscoveredVendorsCommand } from "./discovered-vendors.js";
import { registerIntegrationsCommand } from "./integrations.js";
import { registerEventLogsCommand } from "./event-logs.js";
import { registerBusinessUnitsCommand } from "./business-units.js";
import { registerIssuesCommand } from "./issues.js";
import { registerProgramScopesCommand } from "./program-scopes.js";
import { registerCustomerTrustCommand } from "./customer-trust.js";
import { registerKnowledgeBaseCommand } from "./knowledge-base.js";
import { registerTrustCentersCommand } from "./trust-centers.js";
import type { GetFlags } from "./helpers.js";

export function registerApiCommands(
  program: Command,
  getFlags: GetFlags,
): void {
  registerControlsCommand(program, getFlags);
  registerPoliciesCommand(program, getFlags);
  registerDocumentsCommand(program, getFlags);
  registerTestsCommand(program, getFlags);
  registerPeopleCommand(program, getFlags);
  registerPersonnelNotificationSettingsCommand(program, getFlags);
  registerGroupsCommand(program, getFlags);
  registerFrameworksCommand(program, getFlags);
  registerUsersCommand(program, getFlags);
  registerVulnerabilitiesCommand(program, getFlags);
  registerVulnerableAssetsCommand(program, getFlags);
  registerVulnerabilityRemediationsCommand(program, getFlags);
  registerContractsCommand(program, getFlags);
  registerRiskScenariosCommand(program, getFlags);
  registerMonitoredComputersCommand(program, getFlags);
  registerVendorsCommand(program, getFlags);
  registerVendorAssessmentTypesCommand(program, getFlags);
  registerVendorRiskAttributesCommand(program, getFlags);
  registerDiscoveredVendorsCommand(program, getFlags);
  registerIntegrationsCommand(program, getFlags);
  registerEventLogsCommand(program, getFlags);
  registerBusinessUnitsCommand(program, getFlags);
  registerIssuesCommand(program, getFlags);
  registerProgramScopesCommand(program, getFlags);
  registerCustomerTrustCommand(program, getFlags);
  registerKnowledgeBaseCommand(program, getFlags);
  registerTrustCentersCommand(program, getFlags);
}
