import type { Command } from "commander";
import {
  listChatbotConversations,
  getChatbotConversationMessages,
} from "../generated/sdk.gen.js";
import {
  addPaginationOptions,
  paginationQuery,
  runSdk,
  type GetFlags,
} from "./helpers.js";

export function registerTrustCenterChatbotCommand(
  trustCenters: Command,
  getFlags: GetFlags,
): void {
  const chatbot = trustCenters
    .command("chatbot")
    .description("Manage the Trust Center chatbot");

  const chatbotConversations = chatbot
    .command("conversations")
    .description("Manage Trust Center chatbot conversations");

  addPaginationOptions(
    chatbotConversations
      .command("list")
      .description("List Trust Center chatbot conversations")
      .requiredOption("--slug-id <slug>", "Trust Center slug ID")
      .option(
        "--search-string <query>",
        "Search conversations by message content.",
      ),
  ).action(
    async (opts: {
      slugId: string;
      searchString?: string;
      pageSize?: number;
      pageCursor?: string;
    }) => {
      await runSdk(getFlags, (api) =>
        listChatbotConversations({
          client: api.client,
          path: { slugId: opts.slugId },
          query: { ...paginationQuery(opts), searchString: opts.searchString },
        }),
      );
    },
  );

  chatbotConversations
    .command("get-messages")
    .description("Get messages for a Trust Center chatbot conversation")
    .requiredOption("--slug-id <slug>", "Trust Center slug ID")
    .requiredOption("--id <id>", "Conversation ID")
    .action(async (opts: { slugId: string; id: string }) => {
      await runSdk(getFlags, (api) =>
        getChatbotConversationMessages({
          client: api.client,
          path: { slugId: opts.slugId, conversationId: opts.id },
        }),
      );
    });
}
