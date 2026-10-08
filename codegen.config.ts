import type { CodegenConfig } from "./scripts/codegen/config.js";

// Overrides for the generated API commands; see scripts/codegen/config.ts.
export default {
  resources: [
    "/customer-trust/deletion-requests",
    "/customer-trust/questionnaires/assignable-users",
    "/discovered-vendors/{discoveredVendorId}/accounts",
    "/documents/{documentId}/controls",
    "/frameworks/{frameworkId}/controls",
    "/trust-centers/{slugId}/activity",
    "/trust-centers/{slugId}/control-categories/{categoryId}/controls",
    "/trust-centers/{slugId}/controls/tags",
    "/trust-centers/{slugId}/data-collected",
    "/trust-centers/{slugId}/historical-access-requests",
    "/trust-centers/{slugId}/subscribers/{subscriberId}/groups",
    "/trust-centers/{slugId}/videos",
    "/vendors/{vendorId}/documents",
  ],

  commandGroups: {
    "/personnel-notification-settings": "people notification-settings",
    "/vendor-assessment-types": "vendors assessment-types",
    "/vendor-risk-attributes": "vendors risk-attributes",
    // Not `integrations resource-kinds resources`: the resource kind is a flag.
    "/integrations/{integrationId}/resource-kinds/{resourceKind}/resources":
      "integrations resources",
  },

  commandNames: {
    // Group membership, not creating or deleting a person.
    AddPersonToGroup: "add",
    RemovePersonFromGroup: "remove",
    // Derived: `upload-file` and `website`.
    CreateFileQuestionnaire: "create-from-file",
    CreateWebsiteQuestionnaire: "create-from-website",
    // Would collide with `update` and `upload`.
    UpdateResources: "update-many",
    ReplaceDocumentResourceFile: "replace-file",
  },

  flagNames: {
    // --scope is a global flag.
    "ListDiscoveredVendors.scope": "vendor-scope",
  },

  helpValues: {
    slugId: "slug",
    pageCursor: "cursor",
    q: "query",
    search: "query",
    searchString: "query",
    // Typed as plain strings in the spec.
    frameworkMatchesAny: "id",
    frameworkFilter: "id",
    integrationFilter: "id",
    controlFilter: "id",
    ownerFilter: "id",
    effectiveAtDate: "date",
    dueDate: "timestamp",
    isUsedInQuestionnaires: "bool",
    isPublic: "bool",
    status: "status",
    type: "type",
  },

  // The spec's text runs several lines on every list command.
  flagDescriptions: {
    pageSize: "Number of results to return",
    pageCursor: "Pagination cursor from a previous response",
  },
} satisfies CodegenConfig;
