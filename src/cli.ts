import { Command } from "commander";
import type { GlobalFlags } from "./api-client.js";
import { registerControlsCommand } from "./commands/controls.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerVersionCommand } from "./commands/version.js";
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
      // undefined => auto-detect; true/false when --agent-mode / --no-agent-mode
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

