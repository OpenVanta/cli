import type { Command } from "commander";
import { registerKnowledgeBaseAnswerLibraryCommand } from "./knowledge-base-answer-library.js";
import { registerKnowledgeBaseResourcesCommand } from "./knowledge-base-resources.js";
import type { GetFlags } from "./helpers.js";

export function registerKnowledgeBaseCommand(
  program: Command,
  getFlags: GetFlags,
): void {
  const knowledgeBase = program
    .command("knowledge-base")
    .description("Manage Knowledge Base answers and resources");

  registerKnowledgeBaseAnswerLibraryCommand(knowledgeBase, getFlags);

  registerKnowledgeBaseResourcesCommand(knowledgeBase, getFlags);
}
