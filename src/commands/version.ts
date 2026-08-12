import type { Command } from "commander";
import { Version } from "../version.js";

export function registerVersionCommand(program: Command): void {
  program
    .command("version")
    .description("Print the CLI version")
    .action(() => {
      console.log(Version);
    });
}
