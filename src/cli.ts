import { Command } from "commander";
import type { GlobalFlags } from "./api-client.js";
import { registerContractsCommand } from "./commands/contracts.js";
import { registerControlsCommand } from "./commands/controls.js";
import { registerDiscoveredVendorsCommand } from "./commands/discovered-vendors.js";
import { registerDocumentsCommand } from "./commands/documents.js";
import { registerEventLogsCommand } from "./commands/event-logs.js";
import { registerFrameworksCommand } from "./commands/frameworks.js";
import { registerGroupsCommand } from "./commands/groups.js";
import { registerIntegrationsCommand } from "./commands/integrations.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerMonitoredComputersCommand } from "./commands/monitored-computers.js";
import { registerPeopleCommand } from "./commands/people.js";
import { registerPoliciesCommand } from "./commands/policies.js";
import { registerRiskScenariosCommand } from "./commands/risk-scenarios.js";
import { registerTestsCommand } from "./commands/tests.js";
import { registerUsersCommand } from "./commands/users.js";
import { registerVendorsCommand } from "./commands/vendors.js";
import { registerVersionCommand } from "./commands/version.js";
import { registerVulnerabilitiesCommand } from "./commands/vulnerabilities.js";
import { registerVulnerabilityRemediationsCommand } from "./commands/vulnerability-remediations.js";
import { registerVulnerableAssetsCommand } from "./commands/vulnerable-assets.js";
import {
  finishBackgroundUpdateCheck,
  startBackgroundUpdateCheck,
} from "./update-check.js";
import { Version, displayVersion } from "./version.js";

function buildProgram(): Command {
  const program = new Command();

  program
    .name("vanta")
    .description(
      "Vanta CLI for querying and updating resources through the Vanta API.\n\nStart by running \"vanta login\" to save your OAuth client credentials and default API base.",
    )
    .version(displayVersion(Version), "-V, --version", "Print the CLI version")
    .option(
      "--api-base <url>",
      "Base API URL (overrides saved config; default https://api.vanta.com/v1)",
    )
    .option("--dry-run", "Print request details without sending", false)
    .option("--pretty", "Pretty-print JSON responses", true)
    .option("--no-pretty", "Compact JSON output")
    .option("--verbose", "Log request metadata to stderr", false)
    .option(
      "--agent-mode",
      "Enable agent mode (defaults to auto-detection in known AI agent runtimes)",
    )
    .option("--client-id <id>", "OAuth client ID (overrides saved login)")
    .option(
      "--client-secret <secret>",
      "OAuth client secret (overrides saved login)",
    )
    .option(
      "--scope <scope>",
      "OAuth scope (default: vanta-api.all:read vanta-api.all:write)",
    );

  const getFlags = (): GlobalFlags => {
    const opts = program.opts<{
      apiBase?: string;
      dryRun?: boolean;
      pretty?: boolean;
      verbose?: boolean;
      agentMode?: boolean;
      clientId?: string;
      clientSecret?: string;
      scope?: string;
    }>();

    return {
      apiBase: opts.apiBase,
      dryRun: Boolean(opts.dryRun),
      pretty: opts.pretty !== false,
      verbose: Boolean(opts.verbose),
      agentMode: opts.agentMode,
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      scope: opts.scope,
    };
  };

  program.hook("preAction", () => {
    startBackgroundUpdateCheck({ agentMode: getFlags().agentMode });
  });
  program.hook("postAction", async () => {
    await finishBackgroundUpdateCheck({ agentMode: getFlags().agentMode });
  });

  registerLoginCommand(program, getFlags);
  registerVersionCommand(program);
  registerControlsCommand(program, getFlags);
  registerPoliciesCommand(program, getFlags);
  registerDocumentsCommand(program, getFlags);
  registerTestsCommand(program, getFlags);
  registerPeopleCommand(program, getFlags);
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
  registerDiscoveredVendorsCommand(program, getFlags);
  registerIntegrationsCommand(program, getFlags);
  registerEventLogsCommand(program, getFlags);

  return program;
}

async function main(): Promise<void> {
  const program = buildProgram();
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else if (typeof err === "string") {
      console.error(err);
    } else {
      console.error(JSON.stringify(err, null, 2));
    }
    process.exitCode = 1;
  }
}

void main();
