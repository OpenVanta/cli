// Types shared across the generator: the command model it builds from the
// spec, and the shape of config.ts entries.

// ===========================================================================
// The command model
// ===========================================================================

export type Method = "get" | "post" | "put" | "patch" | "delete";

export type Schema = {
  type?: string;
  format?: string;
  enum?: string[];
  items?: Schema;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
};

// One API input: a path or query parameter, or a multipart form field.
export type Input = {
  name: string;
  required: boolean;
  description: string;
  schema: Schema;
};

// A literal path segment and the ID parameter that follows it, if any:
// `/vendors/{vendorId}` is `{ name: "vendors", param: "vendorId" }`.
export type Segment = { name: string; param?: string };

export type Operation = {
  id: string;
  method: Method;
  path: string;
  summary: string;
  segments: Segment[];
  pathParams: Input[];
  queryParams: Input[];
  body: "none" | "json" | "multipart";
  formFields: Input[];
  returnsFile: boolean;
};

// Where an operation sits in the CLI and what its path is made of.
export type Placement = {
  // The path's first segment, which names the group.
  groupSegment: Segment;
  // Segments after the group, minus a trailing action: they form the noun.
  resources: Segment[];
  action?: string;
};

export type Option = {
  flag: string;
  placeholder: string;
  description: string;
  required: boolean;
  repeatable: boolean;
  // Parse "true"/"false" into a boolean.
  parseBool: boolean;
  // The SDK types the value more narrowly than `string`, e.g. as an enum.
  sdkTyped: boolean;
  // Where the value goes in the SDK call, under `key`.
  target: "path" | "query" | "form" | "file";
  key: string;
};

export type Command = {
  name: string;
  description: string;
  op: Operation;
  options: Option[];
  paginated: boolean;
  download: boolean;
};

// A group is named after its path segment, which also names its file.
export type Group = {
  name: string;
  description: string;
  singular: string;
  plural: string;
  commands: Command[];
};

// ===========================================================================
// config.ts entries
// ===========================================================================

export type Noun = {
  // Display name for one item, e.g. "Trust Center FAQ".
  singular?: string;
  // Display name for the collection, e.g. "Trust Center FAQs".
  plural?: string;
  // Name used in verb-noun commands when it differs from the singular path
  // segment, e.g. "file" for `uploads` (`documents upload-file`).
  commandSingular?: string;
  // Name used in `list` and bulk commands when it differs from the path
  // segment, e.g. "files" for `uploads` (`documents list-files`).
  commandPlural?: string;
};

export type OptionOverride = {
  flag?: string;
  placeholder?: string;
  description?: string;
};

export type OperationOverride = {
  // Command name, replacing the derived verb or verb-noun.
  name?: string;
  // Keyed by API parameter or multipart field name.
  options?: Record<string, OptionOverride>;
};

export type GroupOverride = {
  // Overrides the group's own `--id <id>` flag.
  id?: OptionOverride;
};
