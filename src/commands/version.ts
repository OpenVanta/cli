import type { Command } from "commander";
import { Version, displayVersion } from "../version.js";

export function registerVersionCommand(program: Command): void {
  program
    .command("version")
    .description("Print the CLI version")
    .action(() => {
      console.log(`vanta ${displayVersion(Version)}`);
    });
}
