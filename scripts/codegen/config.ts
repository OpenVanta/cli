// Structural decisions the command generator cannot derive from the OpenAPI
// spec, plus help text that replaces generated descriptions.
//
// The generator (generate.ts) derives the command tree from
// api-spec.json using the conventions in AGENTS.md. Everything here is an
// explicit exception or naming input to those conventions. Prefer extending the
// conventions over adding per-operation overrides.
import type {
  GroupOverride,
  Noun,
  OperationOverride,
  OptionOverride,
} from "./types.js";

// Top-level command order in `vanta --help`. Groups not listed are appended
// alphabetically.
export const topLevelOrder = [
  "controls",
  "policies",
  "documents",
  "tests",
  "people",
  "personnel-notification-settings",
  "groups",
  "frameworks",
  "users",
  "vulnerabilities",
  "vulnerable-assets",
  "vulnerability-remediations",
  "contracts",
  "risk-scenarios",
  "monitored-computers",
  "vendors",
  "vendor-assessment-types",
  "vendor-risk-attributes",
  "discovered-vendors",
  "integrations",
  "event-logs",
  "business-units",
  "issues",
  "program-scopes",
  "customer-trust",
  "knowledge-base",
  "trust-centers",
];

// Display names, keyed by "<group> <segment>" or by path segment. Defaults humanize the segment, so only
// proper nouns, acronyms, and irregular forms belong here.
export const nouns: Record<string, Noun> = {
  "answer-library": {
    singular: "Answer Library entry",
    plural: "Answer Library entries",
  },
  "customer-trust accounts": {
    singular: "Customer Trust account",
    plural: "Customer Trust accounts",
  },
  "faq-categories": { singular: "FAQ category", plural: "FAQ categories" },
  faqs: { singular: "FAQ", plural: "FAQs" },
  "knowledge-base resources": {
    singular: "Knowledge Base resource",
    plural: "Knowledge Base resources",
  },
  "trust-centers": { singular: "Trust Center", plural: "Trust Centers" },
  uploads: { commandSingular: "file", commandPlural: "files" },
};

// Keyed by group, e.g. "trust-centers".
export const groups: Record<string, GroupOverride> = {
  "trust-centers": {
    id: {
      flag: "slug-id",
      placeholder: "slug",
      description: "Trust Center slug ID",
    },
  },
};

// Applied wherever the parameter appears, before per-operation overrides.
export const params: Record<string, OptionOverride> = {
  slugId: { placeholder: "slug", description: "Trust Center slug ID" },
  resourceKind: {
    placeholder: "kind",
    description: "Integration resource kind",
  },
  // Product contexts are a fixed set of names, not IDs.
  productContextId: { placeholder: "product" },
  productContextIdsMatchesAny: { placeholder: "product" },
  // Search terms.
  q: { placeholder: "query" },
  search: { placeholder: "query" },
  searchString: { placeholder: "query" },
  emailAndNameFilter: { placeholder: "query" },
  orderBy: { placeholder: "field" },
};

// Parameter nouns that are their own placeholder (`--status <status>`). Other
// free-text parameters use `<text>`; see AGENTS.md "Help text".
export const placeholderNouns = [
  "category",
  "direction",
  "group",
  "kind",
  "name",
  "owner",
  "permission",
  "reason",
  "role",
  "scope",
  "severity",
  "slug",
  "source",
  "status",
  "template",
  "title",
  "type",
  "url",
  "visibility",
];

// Plurals the singular rules (-ies → -y, -sses → -ss, -s → "") get wrong,
// keyed by plural.
export const irregularNouns: Record<string, string> = { people: "person" };

// A trailing path segment whose first word is one of these is an action, and
// names the command (`/vendors/{vendorId}/set-status` → `vendors set-status`).
export const actionVerbs = [
  "acknowledge",
  "add",
  "approve",
  "cancel",
  "clear",
  "complete",
  "deactivate",
  "deny",
  "import",
  "mark",
  "notify",
  "offboard",
  "reactivate",
  "remove",
  "send",
  "set",
  "snooze",
  "submit",
  "upload",
  "verify",
];

// Operations that attach or detach an existing resource rather than create or
// delete one, keyed by operationId: POST is `add` and DELETE is `remove`
// (`groups add-person`). The spec can't tell these apart; its summaries say
// "Add" for creates too.
export const links = [
  "AddPersonToGroup",
  "RemovePersonFromGroup",
  "DeleteDocumentForcontrol",
  "DeleteTestForControl",
  "CreateRiskScenarioControl",
  "DeleteRiskScenarioControl",
  "AddControlToTrustCenter",
  "DeleteTrustCenterControl",
  "BulkAddTagsToControls",
  "BulkRemoveTagsFromControls",
  "AddTagCategoryProductContext",
  "RemoveTagCategoryProductContext",
  "AddAccountMappings",
  "RemoveAccountMappings",
  "AddCustomAssetMappings",
  "RemoveCustomAssetMappings",
  "AddIntegrationMappings",
  "RemoveIntegrationMappings",
  "AddIssueMappings",
  "RemoveIssueMappings",
  "AddVendorFindingMappings",
  "RemoveVendorFindingMappings",
];

// Command names that differ from the naming rules, keyed by operationId.
export const operations: Record<string, OperationOverride> = {
  // A single settings object, not a collection.
  GetSettings: { name: "get" },
  GetOrganization: { name: "get" },
  // These operations attach several existing resources in one request.
  AddAccountMappings: { name: "add-mapping-accounts" },
  AddCustomAssetMappings: { name: "add-mapping-custom-assets" },
  AddIntegrationMappings: { name: "add-mapping-integrations" },
  AddIssueMappings: { name: "add-mapping-issues" },
  AddVendorFindingMappings: { name: "add-mapping-vendor-findings" },
  // Replaces the file on an existing resource; `upload-resource-document`
  // creates one.
  ReplaceDocumentResourceFile: { name: "replace-resource-document-file" },
  CreateFileQuestionnaire: {
    options: { includeUntaggedEntitiesForCategoryIds: { placeholder: "ids" } },
  },
  UploadFileForDocument: {
    options: { effectiveAtDate: { placeholder: "date" } },
  },
};

// Help text that replaces generated descriptions, keyed by command path.
// Descriptions come from templates ("List vendors", "Get a vendor by ID") and
// option descriptions from the API spec; add an entry when the default reads
// poorly. The generator fails on entries that match no command or that repeat
// the default.
export const commandHelp: Record<string, string> = {
  "controls create": "Create a custom control",
  "controls list-controls-library": "List controls from the library",
  "controls set-owner": "Set or clear a control owner",
  "customer-trust": "Manage Customer Trust accounts, questionnaires, and tags",
  "customer-trust add-tag-category-product-context":
    "Enable a tag category for a product context",
  "customer-trust remove-tag-category-product-context":
    "Disable a tag category for a product context",
  "customer-trust get-questionnaire-export":
    "Get a questionnaire export's status by ID",
  "customer-trust get-tag-category": "Get the tags in a tag category by ID",
  "customer-trust list-questionnaire-assignable-users":
    "List users who can be assigned to questionnaires",
  "customer-trust upload-questionnaire-file":
    "Upload a file to create a questionnaire",
  "discovered-vendors add-to-managed":
    "Add a discovered vendor to managed vendors",
  "documents set-owner": "Set or clear a document owner",
  "documents submit": "Submit document collection",
  "frameworks create-export": "Create a framework controls export",
  "frameworks get-export": "Get a framework controls export status by ID",
  "frameworks delete": "Delete a custom framework",
  "frameworks reactivate": "Reactivate a snoozed framework",
  "groups list-importable-idp-groups":
    "List importable identity provider groups",
  "knowledge-base": "Manage Knowledge Base answers and resources",
  "knowledge-base replace-resource-document-file":
    "Replace the file for a document resource",
  "people mark-as-not-people": "Mark accounts as not people",
  "people mark-as-people": "Mark accounts as people",
  "organization get": "Get the connected organization",
  "risk-scenarios list-mapping-accounts":
    "List accounts mapped to a risk scenario",
  "risk-scenarios add-mapping-accounts": "Add accounts to a risk scenario",
  "risk-scenarios remove-mapping-accounts":
    "Remove accounts from a risk scenario",
  "risk-scenarios list-mapping-custom-assets":
    "List custom assets mapped to a risk scenario",
  "risk-scenarios add-mapping-custom-assets":
    "Add custom assets to a risk scenario",
  "risk-scenarios remove-mapping-custom-assets":
    "Remove custom assets from a risk scenario",
  "risk-scenarios list-mapping-integrations":
    "List integrations mapped to a risk scenario",
  "risk-scenarios add-mapping-integrations":
    "Add integrations to a risk scenario",
  "risk-scenarios remove-mapping-integrations":
    "Remove integrations from a risk scenario",
  "risk-scenarios list-mapping-issues": "List issues mapped to a risk scenario",
  "risk-scenarios add-mapping-issues": "Add issues to a risk scenario",
  "risk-scenarios remove-mapping-issues": "Remove issues from a risk scenario",
  "risk-scenarios list-mapping-vendor-findings":
    "List vendor findings mapped to a risk scenario",
  "risk-scenarios add-mapping-vendor-findings":
    "Add vendor findings to a risk scenario",
  "risk-scenarios remove-mapping-vendor-findings":
    "Remove vendor findings from a risk scenario",
  "risk-scenarios list-mapping-enterprise-risk":
    "List the enterprise risk mapped to a risk scenario",
  "trust-centers get": "Get a Trust Center by slug ID",
  "trust-centers get-chatbot-conversation":
    "Get messages for a Trust Center chatbot conversation",
  "trust-centers list-chatbot-conversations":
    "List Trust Center chatbot conversations",
  "trust-centers update-control-category-controls":
    "Add or remove controls in a Trust Center control category",
  "vulnerability-remediations acknowledge-sla-miss":
    "Acknowledge SLA miss for vulnerability remediations",
};

// Keyed by command path, then by flag (without the placeholder).
export const optionHelp: Record<string, Record<string, string>> = {
  "controls list": {
    "--framework-matches-any": "Framework IDs to filter by (repeatable)",
  },
  "customer-trust remove-tag-category-product-context": {
    "--product-context-id":
      "Product context: EXTERNAL_TRUST_CENTER, DOCUMENT_SHARING, CONTROL_SHARING",
  },
  "customer-trust get-questionnaire-export": {
    "--id":
      "Export job ID returned by `customer-trust create-questionnaire-export`",
  },
  "customer-trust list-accounts": {
    "--custom-fields-filter": "Filter by custom field values",
    "--is-auto-approval-enabled":
      "Filter by whether access requests are auto-approved (true/false)",
  },
  "discovered-vendors list": {
    "--scope":
      "Discovered vendor scope (defaults to NEEDS_REVIEW in the API): NEEDS_REVIEW, IGNORED, REJECTED",
  },
  "documents list": {
    "--framework-matches-any": "Framework IDs to filter by (repeatable)",
    "--status-matches-any": "Document statuses to filter by (repeatable)",
  },
  "groups list-importable-idp-groups": {
    "--search": "Search importable identity provider groups",
  },
  "issues list": {
    "--include-issues-without-due-date":
      "Include undated issues with --due-before-date or --due-after-date (true/false)",
    "--include-only-issues-without-due-date":
      "Include only undated issues (true/false); cannot combine with --due-before-date or --due-after-date",
  },
  "knowledge-base list-answer-library": {
    "--matches-tags":
      "JSON-encoded array of `{categoryId, tagId}` pairs. Entries matching any of the given tags are returned (OR filter). Find category IDs with `vanta customer-trust list-tag-categories` and tag IDs with `vanta customer-trust get-tag-category --tag-category-id <id>`.",
  },
  "knowledge-base list-resources": {
    "--matches-tags":
      'JSON-encoded array of `{categoryId, tagId}` pairs. Tags within the same category are OR\'d together; tags across different categories are AND\'d. For example, passing two tags from "Framework" and one tag from "Region" matches resources that have either of the two frameworks AND the given region. Find category IDs with `vanta customer-trust list-tag-categories` and tag IDs with `vanta customer-trust get-tag-category --tag-category-id <id>`.',
  },
  "knowledge-base replace-resource-document-file": {
    "--id": "Knowledge Base resource ID",
  },
  "knowledge-base update-resource-document": {
    "--id": "Knowledge Base resource ID",
  },
  "knowledge-base update-resource-webpage": {
    "--id": "Knowledge Base resource ID",
  },
  "knowledge-base upload-resource-document": {
    "--category-id":
      "Trust Center category id to associate this resource with. Only applied when --customer-visibility is REQUEST_ACCESS or PUBLIC; otherwise ignored. Unknown IDs leave the resource uncategorized.",
  },
  "people list": {
    "--task-status-matches-any": "Task statuses to filter by (repeatable)",
    "--task-type-matches-any": "Task types to filter by (repeatable)",
  },
  "risk-scenarios list": {
    "--include-ignored": "Include ignored risk scenarios (true/false)",
    "--order-by": "Order by field (description or createdAt)",
  },
  "trust-centers list-viewers": {
    "--include-removed": "Include removed viewers (true/false; default: true)",
  },
  "vendors list-assessments": {
    "--type-id-matches-any":
      "Filter by assessment type ID from vendor-assessment-types list (repeatable)",
  },
  "vulnerabilities list": {
    "--include-vulnerabilities-without-slas":
      "Include vulnerabilities without SLA dates (true/false)",
  },
  "vulnerable-assets list": {
    "--asset-external-account-id":
      "Filter vulnerable assets by external account ID",
  },
};
