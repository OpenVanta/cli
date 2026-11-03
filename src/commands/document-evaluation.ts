import timers from "node:timers/promises";
import type { Client } from "../generated/client/index.js";
import { evaluateDocument } from "../generated/sdk.gen.js";
import type { DocumentEvaluation } from "../generated/types.gen.js";

export async function pollDocumentEvaluation(
  client: Client,
  documentId: string,
  onPending?: () => void,
): Promise<Exclude<DocumentEvaluation, { status: "PENDING" }>> {
  let notified = false;
  for (;;) {
    const { data } = await evaluateDocument({
      client,
      path: { documentId },
      throwOnError: true,
    });

    switch (data?.status) {
      case "PENDING":
        if (!notified) {
          onPending?.();
          notified = true;
        }
        await timers.setTimeout(5_000);
        break;
      case "FAILED":
        return data;
      case "COMPLETED":
        if (typeof data.summary === "string") return data;
        throw new Error(
          "Unexpected document evaluation response: missing summary",
        );
      default:
        throw new Error(
          "Unexpected document evaluation response: expected PENDING, COMPLETED, or FAILED",
        );
    }
  }
}
