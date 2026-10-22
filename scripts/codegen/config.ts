// codegen.config.ts: only what api-spec.json can't express. Every key must name
// something in the spec and every value must change the output, or codegen fails.

// "<operationId>.<parameter>", e.g. "ListDiscoveredVendors.scope".
export type FlagKey = `${string}.${string}`;

export type CodegenConfig = {
  // URL segments to treat as resources although the spec has no item URLs under them:
  // "/vendors/{vendorId}/documents" gives `vendors documents list`, not `vendors list-documents`.
  resources: string[];
  // URL prefix -> command group, e.g. "/vendor-risk-attributes": "vendors risk-attributes".
  commandGroups: Record<string, string>;
  // operationId -> command name.
  commandNames: Record<string, string>;
  flagNames: Record<FlagKey, string>;
  // Parameter name -> placeholder in --help (`<id>`), in every operation that has it.
  helpValues: Record<string, string>;
  // Parameter name -> help text, in every operation that has it.
  flagDescriptions: Record<string, string>;
};
