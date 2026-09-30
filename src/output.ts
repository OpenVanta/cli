import { encode } from "@toon-format/toon";
import { agentModeEnabled } from "./agent-mode.js";

export type OutputOptions = {
  pretty: boolean;
  prettyExplicit?: boolean;
  agentMode?: boolean;
};

export function shouldUseAgentOutput(
  options: OutputOptions,
  agentEnvironmentDetected?: boolean,
): boolean {
  if (options.agentMode !== undefined) {
    return options.agentMode;
  }
  return (
    !options.prettyExplicit &&
    (agentEnvironmentDetected ?? agentModeEnabled())
  );
}

function unwrapResultsData(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const payload = value as Record<string, unknown>;
  const results = payload.results;
  if (!results || typeof results !== "object" || Array.isArray(results)) {
    return value;
  }
  const resultsObj = results as Record<string, unknown>;
  if (!("data" in resultsObj)) {
    return value;
  }

  const normalized: Record<string, unknown> = {
    data: resultsObj.data,
  };
  if ("pageInfo" in resultsObj) {
    normalized.pageInfo = resultsObj.pageInfo;
    const pageInfo = resultsObj.pageInfo;
    if (pageInfo && typeof pageInfo === "object" && !Array.isArray(pageInfo)) {
      const endCursor = (pageInfo as Record<string, unknown>).endCursor;
      if (endCursor !== undefined) {
        normalized.nextCursor = endCursor;
      }
    }
  }
  if ("totalCount" in resultsObj) {
    normalized.totalCount = resultsObj.totalCount;
  }
  return normalized;
}

export function printResponse(
  value: unknown,
  options: OutputOptions,
  write: (s: string) => void = (s) => process.stdout.write(s),
): void {
  if (value === undefined || value === null) {
    write("No response body.\n");
    return;
  }

  const normalized = unwrapResultsData(value);

  if (shouldUseAgentOutput(options)) {
    write(`${encode(normalized)}\n`);
    return;
  }

  if (!options.pretty) {
    write(`${JSON.stringify(normalized)}\n`);
    return;
  }

  write(`${JSON.stringify(normalized, null, 2)}\n`);
}
