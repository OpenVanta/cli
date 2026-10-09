// Turns api-spec.json plus codegen.config.ts into CLI command definitions. Naming rules:
//   GET /things                            things list
//   GET /things/{thingId}                  things get --thing-id <id>
//   POST / PATCH / PUT / DELETE            create / update / set / delete
//   /things/{thingId}/widgets/{widgetId}   things widgets ...   (sub-resource)
//   POST /things/{thingId}/set-owner       things set-owner     (action)
//   GET returning a file                   download --output <path>
//   multipart body with a file             upload, one flag per field
//   JSON body                              --json <json> / --file <path>
import type { OpenAPIV3 } from "openapi-types";
import pluralize from "pluralize";
import type { CommandSpec, FlagSpec, GroupSpec } from "../../src/commands/api-commands.js";
import type { CodegenConfig } from "./config.js";

export type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
export type Operation = Omit<
  OpenAPIV3.OperationObject,
  "parameters" | "requestBody" | "responses"
> & {
  operationId: string;
  parameters?: OpenAPIV3.ParameterObject[];
  requestBody?: OpenAPIV3.RequestBodyObject;
  responses: Record<string, OpenAPIV3.ResponseObject>;
};
export type ApiSpec = {
  paths: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, Schema> };
};

// Root program options, which swallow a command flag of the same name.
export const GLOBAL_FLAGS = [
  "api-base",
  "dry-run",
  "pretty",
  "no-pretty",
  "verbose",
  "agent-mode",
  "client-id",
  "client-secret",
  "scope",
  "help",
  "version",
];
const JSON_BODY_FLAGS = ["json", "file"];
type Where = "path" | "query" | "form";
const METHODS = ["get", "post", "put", "patch", "delete"];

export function specToCommands(
  spec: ApiSpec,
  config: CodegenConfig,
  globalFlags: string[] = GLOBAL_FLAGS,
): { commands: CommandSpec[]; groups: GroupSpec[]; errors: string[] } {
  const api = new Api(spec);
  const errors: string[] = [];
  const overrides = new Overrides(config, errors);
  const commands: CommandSpec[] = [];

  for (const { method, url, op } of api.operations) {
    const path = commandPath(api, config, overrides, method, url, op);
    const flags = flagsFor(api, overrides, url, op);
    checkFlags(op, path, flags, globalFlags, errors);
    commands.push({
      path,
      operationId: op.operationId,
      sdk: lowerFirst(op.operationId) as CommandSpec["sdk"],
      description: toFlagNames(firstParagraph(op.summary) || humanize(op.operationId), flags),
      flags,
      jsonBody: Boolean(op.requestBody?.content["application/json"]),
      binaryResponse: api.returnsFile(op),
    });
  }

  sortCommands(commands);
  checkDuplicateCommands(commands, errors);
  overrides.reportErrors();
  checkUrlPrefixes(api, config, errors);
  const groups = groupsFor(commands, errors);
  return { commands, groups, errors };
}

// ---------------------------------------------------------------- command paths

// A URL segment with items under it, or in config.resources, is a group; others are actions.
function commandPath(
  api: Api,
  config: CodegenConfig,
  overrides: Overrides,
  method: string,
  url: string,
  op: Operation,
): string[] {
  const group = groupFor(api, config, url);
  const rest = segments(url).slice(group.urlPrefix.length);
  const derived = commandName(api, method, url, rest, op);
  return [...group.command, overrides.apply("commandNames", op.operationId, derived)];
}

function groupFor(api: Api, config: CodegenConfig, url: string) {
  const segs = segments(url);
  let length = 1;
  for (let i = 2; i <= segs.length; i++) {
    const prefix = segs.slice(0, i);
    const isResource =
      api.hasItems(prefix) || config.resources.includes(`/${prefix.join("/")}`);
    if (!isParam(segs[i - 1]!) && isResource) length = i;
  }
  const urlPrefix = segs.slice(0, length);
  const nouns = urlPrefix.filter((s) => !isParam(s));
  for (const [from, to] of Object.entries(config.commandGroups)) {
    const fromSegs = segments(from);
    if (fromSegs.every((s, i) => s === urlPrefix[i])) {
      const fromNouns = fromSegs.filter((s) => !isParam(s));
      return { urlPrefix, command: [...to.split(" "), ...nouns.slice(fromNouns.length)] };
    }
  }
  return { urlPrefix, command: nouns };
}

function commandName(
  api: Api,
  method: string,
  url: string,
  rest: string[],
  op: Operation,
): string {
  if (method === "get" && api.returnsFile(op)) return "download";

  const onGroup = rest.length === 0;
  const onItem = rest.length === 1 && isParam(rest[0]!);
  if (onGroup || onItem) {
    return {
      get: onItem || !(api.returnsList(op) || api.hasItems(segments(url))) ? "get" : "list",
      post: api.isUpload(op) ? "upload" : "create",
      put: "set",
      patch: "update",
      delete: "delete",
    }[method]!;
  }

  const noun = rest.at(-1)!;
  if (method === "get" || api.isCollection(segments(url))) {
    return {
      get: api.returnsList(op) ? `list-${noun}` : `get-${noun}`,
      post: `${api.isUpload(op) ? "upload" : "create"}-${singular(noun)}`,
      put: `set-${noun}`,
      patch: `update-${noun}`,
      delete: `delete-${noun}`,
    }[method]!;
  }
  if (api.isUpload(op)) return noun === "upload" ? "upload" : `upload-${noun}`;
  return { post: "", put: "set-", patch: "update-", delete: "delete-" }[method] + noun;
}

// ---------------------------------------------------------------- flags

function flagsFor(api: Api, overrides: Overrides, url: string, op: Operation): FlagSpec[] {
  const flags: FlagSpec[] = [];
  const add = (
    where: Where,
    name: string,
    schema: Schema,
    required: boolean,
    description?: string,
  ) => {
    flags.push(flagFor(api, overrides, op.operationId, where, name, schema, required, description));
  };

  const params = op.parameters ?? [];
  for (const name of segments(url).filter(isParam).map((s) => s.slice(1, -1))) {
    const p = params.find((x) => x.in === "path" && x.name === name);
    const schema = p?.schema ?? { type: "string" };
    add("path", name, schema, true, api.enumValues(schema) ? p?.description : humanize(name));
  }
  for (const p of params.filter((x) => x.in === "query")) {
    const description = p.description ?? api.resolve(p.schema).description;
    add("query", p.name, p.schema ?? {}, Boolean(p.required), description);
  }
  const form = api.resolve(op.requestBody?.content["multipart/form-data"]?.schema);
  for (const [name, schema] of Object.entries(form.properties ?? {})) {
    const required = (form.required ?? []).includes(name);
    add("form", name, schema, required, api.resolve(schema).description);
  }
  if (api.returnsFile(op)) {
    flags.push({
      flag: "--output <path>",
      attribute: "output",
      description: "Write downloaded bytes to file path (default stdout)",
      required: false,
      repeatable: false,
      kind: "output",
    });
  }

  for (const f of flags) f.description = toFlagNames(f.description, flags);
  return flags;
}

function flagFor(
  api: Api,
  overrides: Overrides,
  operationId: string,
  where: Where,
  name: string,
  schema: Schema,
  required: boolean,
  description = "",
): FlagSpec {
  const key = `${operationId}.${name}`;
  const s = api.resolve(schema);
  const item = s.type === "array" ? api.resolve(s.items) : s;
  const repeatable = s.type === "array" && where === "query";
  const isFile = item.format === "binary";
  const flagName = overrides.apply("flagNames", key, kebab(name));
  const placeholder = overrides.helpValue(
    name,
    placeholderFor(api, name, schema, where, description),
  );
  const text =
    overrides.flagDescription(name) ??
    (isFile ? "Path to file to upload" : firstParagraph(description) || humanize(name));
  return {
    flag: `--${flagName} <${placeholder}>`,
    attribute: flagName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
    description: helpText(text, api.enumValues(schema), repeatable, placeholder),
    required,
    repeatable,
    kind: isFile
      ? "file"
      : item.type === "boolean" || item.type === "integer"
        ? item.type
        : "string",
    in: where,
    name,
  };
}

function placeholderFor(
  api: Api,
  name: string,
  schema: Schema,
  where: Where,
  description: string,
): string {
  const s = api.resolve(schema);
  const item = s.type === "array" ? api.resolve(s.items) : s;
  if (item.format === "binary") return "path";
  if (item.enum) {
    const filler = ["matches", "any", "filter", "in", "by", "id", "ids"];
    const word = kebab(name).split("-").filter((w) => !filler.includes(w)).at(-1);
    return word ? singular(word) : "value";
  }
  if (where === "path") return /(^id|Id)$/.test(name) ? "id" : "text";
  if (item.type === "boolean") return "bool";
  if (item.type === "integer" || item.type === "number") return "n";
  if (item.format === "date-time") return "timestamp";
  if (item.format === "date") return "date";
  // Often typed as plain strings, so check the description.
  if (/ISO 8601 date\b(?! ?time)/.test(description)) return "date";
  if (/ISO 8601/.test(description)) return "timestamp";
  if (/\bJSON\b/.test(description)) return "json";
  if (/(Id|Ids|ID)(MatchesAny)?$/.test(name)) return "id";
  if (item.type === "object" || item.type === "array") return "json";
  return "text";
}

function helpText(
  text: string,
  values: string[] | undefined,
  repeatable: boolean,
  placeholder: string,
): string {
  if (values && !values.every((v) => text.includes(v))) {
    // The spec's own list is out of date.
    text = `${text.replace(/\.?\s*Possible values:.*$/i, "")}: ${values.join(", ")}`;
  }
  if (placeholder === "timestamp" && !/ISO 8601/.test(text)) text += " (ISO 8601 timestamp)";
  if (placeholder === "date" && !/ISO 8601/.test(text)) text += " (ISO 8601 date)";
  if (placeholder === "bool" && !/true"?\s*\/\s*"?false/.test(text)) text += " (true/false)";
  if (repeatable) text += " (repeatable)";
  return text;
}

// "Requires taskStatusMatchesAny" -> "Requires --task-status-matches-any". Only camelCase or
// `quoted` names, and not JSON keys.
function toFlagNames(text: string, flags: FlagSpec[]): string {
  const byParam = new Map(flags.filter((f) => f.name).map((f) => [f.name!, f.flag.split(" ")[0]!]));
  return text.replace(/(?<!")(`?)\b([a-z][a-zA-Z0-9]*)\b\1/g, (match, quote, word: string) => {
    const flag = byParam.get(word);
    return flag && (quote || /[A-Z]/.test(word)) ? flag : match;
  });
}

function checkFlags(
  op: Operation,
  path: string[],
  flags: FlagSpec[],
  globalFlags: string[],
  errors: string[],
) {
  const where = `${op.operationId} (${path.join(" ")})`;
  const seen = new Set(op.requestBody?.content["application/json"] ? JSON_BODY_FLAGS : []);
  for (const f of flags) {
    const name = f.flag.slice(2).split(" ")[0]!;
    if (globalFlags.includes(name)) {
      const key = `${op.operationId}.${f.name}`;
      errors.push(`${where}: --${name} collides with a global flag; rename it in flagNames["${key}"]`);
    }
    if (seen.has(name)) errors.push(`${where}: duplicate flag --${name}`);
    seen.add(name);
  }
}

// ---------------------------------------------------------------- groups and order

// Groups in spec order; in each, CRUD verbs first, then the rest alphabetically.
function sortCommands(commands: CommandSpec[]) {
  const verbs = ["list", "get", "create", "update", "set", "delete"];
  const rank = (c: CommandSpec) => {
    const i = verbs.indexOf(c.path.at(-1)!);
    return i === -1 ? verbs.length : i;
  };
  const groupOrder = new Map<string, number>();
  for (const c of commands) {
    const g = c.path.slice(0, -1).join(" ");
    if (!groupOrder.has(g)) groupOrder.set(g, groupOrder.size);
  }
  const group = (c: CommandSpec) => groupOrder.get(c.path.slice(0, -1).join(" "))!;
  const name = (c: CommandSpec) => c.path.at(-1)!;
  commands.sort(
    (x, y) => group(x) - group(y) || rank(x) - rank(y) || name(x).localeCompare(name(y)),
  );
}

function checkDuplicateCommands(commands: CommandSpec[], errors: string[]) {
  const seen = new Map<string, string>();
  for (const c of commands) {
    const key = c.path.join(" ");
    if (seen.has(key)) {
      errors.push(`duplicate command "${key}": ${seen.get(key)} and ${c.operationId}`);
    }
    seen.set(key, c.operationId);
  }
}

function groupsFor(commands: CommandSpec[], errors: string[]): GroupSpec[] {
  const keys = new Set<string>();
  for (const c of commands) {
    for (let i = 1; i < c.path.length; i++) keys.add(c.path.slice(0, i).join(" "));
  }
  const groups = [...keys].map((key) => {
    const path = key.split(" ");
    const parent = path.length > 1 ? `${humanize(singular(path.at(-2)!), false)} ` : "";
    return { path, description: `Manage ${parent}${humanize(path.at(-1)!, false)}` };
  });
  if (new Set(groups.map(fileFor)).size !== groups.length) {
    errors.push("two command groups map to the same generated file name");
  }
  return groups;
}

// ---------------------------------------------------------------- config

// Applies overrides; reports ones that match nothing or equal the derived value.
class Overrides {
  private unused: Record<keyof Omit<CodegenConfig, "resources" | "commandGroups">, Set<string>>;
  private changedHelpValues = new Set<string>();

  constructor(
    private config: CodegenConfig,
    private errors: string[],
  ) {
    this.unused = {
      commandNames: new Set(Object.keys(config.commandNames)),
      flagNames: new Set(Object.keys(config.flagNames)),
      helpValues: new Set(Object.keys(config.helpValues)),
      flagDescriptions: new Set(Object.keys(config.flagDescriptions)),
    };
  }

  apply(section: "commandNames" | "flagNames", key: string, derived: string) {
    const values: Record<string, string> = this.config[section];
    if (!(key in values)) return derived;
    this.unused[section].delete(key);
    if (values[key] === derived) {
      this.errors.push(`${section}["${key}"]: "${derived}" is already the derived value; remove it`);
    }
    return values[key]!;
  }

  // Keyed by parameter name, so it only has to change some of the operations that have it.
  helpValue(name: string, derived: string): string {
    const value = this.config.helpValues[name];
    if (value === undefined) return derived;
    this.unused.helpValues.delete(name);
    if (value !== derived) this.changedHelpValues.add(name);
    return value;
  }

  flagDescription(name: string): string | undefined {
    this.unused.flagDescriptions.delete(name);
    return this.config.flagDescriptions[name];
  }

  reportErrors() {
    for (const name of Object.keys(this.config.helpValues)) {
      if (!this.unused.helpValues.has(name) && !this.changedHelpValues.has(name)) {
        const value = this.config.helpValues[name];
        this.errors.push(`helpValues["${name}"]: "${value}" is already the derived value; remove it`);
      }
    }
    for (const [section, keys] of Object.entries(this.unused)) {
      for (const key of keys) {
        this.errors.push(`${section}["${key}"] matches no operation or parameter in the spec`);
      }
    }
  }
}

function checkUrlPrefixes(api: Api, config: CodegenConfig, errors: string[]) {
  for (const prefix of [...config.resources, ...Object.keys(config.commandGroups)]) {
    if (!api.urls.some((u) => u === prefix || u.startsWith(`${prefix}/`))) {
      errors.push(`"${prefix}" is not an API path prefix`);
    }
  }
  for (const prefix of config.resources) {
    if (api.hasItems(segments(prefix))) {
      errors.push(`resources: "${prefix}" has items under it, so it's already a resource; remove it`);
    }
  }
}

// ---------------------------------------------------------------- spec lookups

class Api {
  readonly operations: { method: string; url: string; op: Operation }[];
  readonly urls: string[];

  constructor(private spec: ApiSpec) {
    this.operations = Object.entries(spec.paths).flatMap(([url, item]) =>
      Object.entries(item)
        .filter(([method]) => METHODS.includes(method))
        .map(([method, op]) => ({ method, url, op })),
    );
    this.urls = [...new Set(this.operations.map((o) => o.url))];
  }

  resolve(schema: Schema | undefined): OpenAPIV3.SchemaObject {
    if (!schema) return {};
    if ("$ref" in schema) {
      return this.resolve(this.spec.components!.schemas![schema.$ref.split("/").pop()!]);
    }
    if (schema.allOf?.length === 1) return this.resolve(schema.allOf[0]);
    return schema;
  }

  enumValues(schema: Schema): string[] | undefined {
    const s = this.resolve(schema);
    return s.type === "array" ? this.resolve(s.items).enum : s.enum;
  }

  hasItems(urlSegs: string[]): boolean {
    const url = `/${urlSegs.join("/")}`;
    return this.urls.some((u) => u.startsWith(`${url}/{`));
  }

  isCollection(urlSegs: string[]): boolean {
    return Boolean(this.spec.paths[`/${urlSegs.join("/")}`]?.get) || this.hasItems(urlSegs);
  }

  returnsList(op: Operation): boolean {
    const body = op.responses["200"]?.content?.["application/json"]?.schema;
    return Boolean(this.resolve(body).properties?.results);
  }

  isUpload(op: Operation): boolean {
    const form = this.resolve(op.requestBody?.content["multipart/form-data"]?.schema);
    return Object.values(form.properties ?? {}).some((p) => this.resolve(p).format === "binary");
  }

  returnsFile(op: Operation): boolean {
    const ok = op.responses["200"] ?? op.responses["201"];
    return Object.keys(ok?.content ?? {}).some((type) => type !== "application/json");
  }
}

// ---------------------------------------------------------------- strings

const segments = (url: string) => url.split("/").filter(Boolean);
const isParam = (segment: string) => segment.startsWith("{");
const lowerFirst = (s: string) => s[0]!.toLowerCase() + s.slice(1);
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

function singular(name: string): string {
  const words = name.split("-");
  return [...words.slice(0, -1), pluralize.singular(words.at(-1)!)].join("-");
}

function humanize(name: string, capitalize = true): string {
  const text = kebab(name).replaceAll("-", " ");
  return capitalize ? text[0]!.toUpperCase() + text.slice(1) : text;
}

function firstParagraph(text = ""): string {
  return text.split(/\n\s*\n/)[0]!.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

// ---------------------------------------------------------------- output

const HEADER =
  "// Generated by scripts/codegen/write-commands.ts from api-spec.json and codegen.config.ts. Do not edit.\n";
const fileFor = (g: GroupSpec) => g.path.join("-");
const moduleName = (g: GroupSpec) =>
  `${fileFor(g).replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}Commands`;
const literal = (value: unknown) => JSON.stringify(value, null, 2);

// One file per group, plus an index.
export function renderCommandFiles(
  commands: CommandSpec[],
  groups: GroupSpec[],
): Map<string, string> {
  const files = new Map<string, string>();
  for (const g of groups) {
    const own = commands.filter((c) => c.path.slice(0, -1).join(" ") === g.path.join(" "));
    files.set(
      `${fileFor(g)}.ts`,
      `${HEADER}import type { CommandSpec, GroupSpec } from "../api-commands.js";

export const group: GroupSpec = ${literal(g)};

export const commands: CommandSpec[] = ${literal(own)};
`,
    );
  }
  files.set(
    "index.ts",
    `${HEADER}import type { CommandSpec, GroupSpec } from "../api-commands.js";
${groups.map((g) => `import * as ${moduleName(g)} from "./${fileFor(g)}.js";`).join("\n")}

const modules = [
${groups.map((g) => `  ${moduleName(g)},\n`).join("")}];

export const groups: GroupSpec[] = modules.map((m) => m.group);
export const commands: CommandSpec[] = modules.flatMap((m) => m.commands);
`,
  );
  return files;
}
