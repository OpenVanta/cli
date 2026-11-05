import timers from "node:timers/promises";
import type { Client } from "../generated/client/index.js";
import {
  evaluateDocument,
  getDocumentDraftEvaluation,
} from "../generated/sdk.gen.js";
import type { DocumentEvaluation } from "../generated/types.gen.js";

export async function pollDocumentEvaluation(
  client: Client,
  documentId: string,
  onPending?: () => void,
): Promise<DocumentEvaluation> {
  const timeoutError = new Error(
    "Evaluation results were not available within 5 minutes. Try running the command again.",
  );
  const controller = new AbortController();
  const { signal } = controller;
  const timeout = setTimeout(() => controller.abort(timeoutError), 5 * 60_000);

  try {
    const { response } = await evaluateDocument({
      client,
      path: { documentId },
      throwOnError: true,
      // Both successful POST responses are empty, including 202.
      parseAs: "text",
      signal,
    });
    signal.throwIfAborted();
    if (response.status !== 202 && response.status !== 204) {
      throw new Error(
        `Unexpected document evaluation response: HTTP ${response.status}; expected 202 or 204`,
      );
    }

    let notified = false;
    for (;;) {
      signal.throwIfAborted();
      const { data, error, response } = await getDocumentDraftEvaluation({
        client,
        path: { documentId },
        throwOnError: false,
        signal,
      });
      signal.throwIfAborted();

      // A 404 means no saved result, not necessarily that a job is running.
      // Retry only GETs, bounded by the deadline; never enqueue again here.
      if (response.status === 404) {
        if (!notified) {
          onPending?.();
          notified = true;
        }
        await timers.setTimeout(5_000, undefined, { signal });
        continue;
      }
      if (error) throw error;
      if (response.status !== 200 || typeof data?.summary !== "string") {
        throw new Error(
          "Unexpected document evaluation response: expected a summary",
        );
      }
      return data;
    }
  } catch (error) {
    if (signal.aborted) throw timeoutError;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
