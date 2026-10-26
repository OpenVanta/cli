// Turns an operation's path parameters, query parameters, and multipart
// fields into flags; see AGENTS.md "Help text" for the placeholder vocabulary.
import * as config from "./config.js";
import type { Group } from "./groups.js";
import type { Placement } from "./naming.js";
import {
  type Input,
  type Operation,
  type Schema,
  valueSchema,
} from "./spec.js";
import {
  displayPlural,
  displaySingular,
  humanize,
  kebab,
  lowerFirst,
  nounFor,
  singular,
  upperFirst,
} from "./words.js";

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

const searchParams = new Set(["q", "search", "searchString"]);
const placeholderWords = new Set([
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
]);

// The noun a parameter refers to: `statusMatchesAny` → `status`.
function paramNoun(name: string): string {
  const base = name.replace(/MatchesAny$/, "").replace(/Filter$/, "");
  return singular(kebab(base).split("-").at(-1)!);
}

function placeholderFor(input: Input, groupNames: Set<string>): string {
  const { name, schema, description } = input;
  const item = valueSchema(schema);
  if (item.type === "boolean" || /^(is|has)[A-Z]/.test(name)) return "bool";
  if (item.format === "date") return "date";
  if (
    item.format === "date-time" ||
    (!item.enum && /(Date|After|Before)$/.test(name))
  ) {
    return /ISO 8601 date\b/.test(description) ? "date" : "timestamp";
  }
  if (searchParams.has(name)) return "query";
  if (name === "orderBy") return "field";
  if (item.enum) return paramNoun(name);
  if (/\bJSON\b/.test(description)) return "json";
  if (
    /(Id|Ids|Identifier)$/.test(name.replace(/MatchesAny$/, "")) ||
    name === "id" ||
    /\bIDs?\b/.test(description)
  ) {
    return "id";
  }
  if (item.type === "integer" || item.type === "number") return "n";
  const noun = paramNoun(name);
  if (groupNames.has(`${noun}s`)) return "id";
  return placeholderWords.has(noun) ? noun : "text";
}

// First paragraph of a spec description, without "Possible values" lists.
function cleanDescription(text: string): string {
  return text
    .replace(/\s*Possible values:.*$/s, "")
    .split(/\n\s*\n/)[0]!
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

// The spec description, plus enum choices and format hints.
function inputDescription(
  input: Input,
  placeholder: string,
  listed: string,
): string {
  const { name, schema } = input;
  const item = valueSchema(schema);
  let text = cleanDescription(input.description);
  if (!text && placeholder === "query") text = `Search ${listed}`;
  if (!text) {
    const subject = humanize(name.replace(/MatchesAny$/, ""));
    text = `Filter by ${subject.replace(/\bid(s?)$/, "ID$1")}`;
  }
  text = upperFirst(text)
    // "Boolean determining whether X" → "Whether X".
    .replace(/^Boolean (determining|indicating) w/, "W")
    // `("true" / "false")` → the standard "(true/false)", added below.
    .replace(/\s*\("true" ?\/ ?"false"\)/, "");
  if (placeholder === "timestamp") {
    // "in ISO 8601" and "(ISO 8601 string)" → "ISO 8601 timestamp".
    text = text.replace(
      /ISO 8601(?: string)?(?! (timestamp|date))/g,
      "ISO 8601 timestamp",
    );
  }
  if (item.enum && !item.enum.every((v) => text.includes(v))) {
    text += `: ${item.enum.join(", ")}`;
  }
  if (placeholder === "bool" && !text.includes("true/false"))
    text += " (true/false)";
  if (placeholder === "timestamp" && !text.includes("ISO 8601")) {
    text += " (ISO 8601 timestamp)";
  }
  if (schema.type === "array") text += " (repeatable)";
  return text;
}

function fileDescription(field: Input): string {
  const text = cleanDescription(field.description);
  if (text) return `Path to file to upload: ${lowerFirst(text)}`;
  if (field.name === "file") return "Path to file to upload";
  return `Path to ${humanize(field.name)} file to upload`;
}

// "FAQ ID" for `faqId` when the noun has a configured display name, else the
// humanized parameter name ("Security review ID").
function pathParamDescription(name: string, placement: Placement): string {
  const segment = placement.resources.find((s) => s.param === name);
  const display =
    segment &&
    (nounFor(segment.name, placement.groupSegment.name)?.singular ??
      (name === "id" ? displaySingular(segment.name) : undefined));
  if (display) return `${upperFirst(display)} ID`;
  return upperFirst(humanize(name).replace(/ id$/, " ID"));
}

// Whether the SDK types the value as something other than a plain `string`
// (or `string[]`): an enum, or a non-string type other than boolean/integer.
function isSdkTyped(schema: Schema): boolean {
  const item = valueSchema(schema);
  if (item.type === "string") return Boolean(item.enum);
  return item.type !== "boolean" && item.type !== "integer";
}

// Overrides from `config.params` and `config.operations`, ignoring empty
// values; `extra` applies first.
function withOverrides(
  option: Option,
  opId: string,
  extra?: config.OptionOverride,
): Option {
  const overrides = [
    extra,
    config.params[option.key],
    config.operations[opId]?.options?.[option.key],
  ];
  for (const o of overrides) {
    Object.assign(
      option,
      Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => v)),
    );
  }
  return option;
}

export function buildOptions(
  op: Operation,
  placement: Placement,
  group: Group,
  groupNames: Set<string>,
): Option[] {
  const placeholderOverride = (key: string) =>
    config.operations[op.id]?.options?.[key]?.placeholder ??
    config.params[key]?.placeholder;
  const placeholder = (input: Input) =>
    placeholderOverride(input.name) ?? placeholderFor(input, groupNames);
  // What a search flag searches: the listed resource, else the group.
  const last = placement.resources.at(-1);
  const listed = last
    ? displayPlural(last.name, placement.groupSegment.name)
    : group.plural;

  const path = op.pathParams.map((param) => {
    // The group's own ID is `--id`; `resourceKind` stays `--resource-kind`.
    const own =
      param.name === placement.groupSegment.param &&
      /(^id|Id)$/.test(param.name);
    const option: Option = {
      flag: own ? "id" : kebab(param.name),
      placeholder: own || /Id$/.test(param.name) ? "id" : kebab(param.name),
      description: own
        ? `${upperFirst(group.singular)} ID`
        : pathParamDescription(param.name, placement),
      required: true,
      repeatable: false,
      parseBool: false,
      sdkTyped: isSdkTyped(param.schema),
      target: "path",
      key: param.name,
    };
    return withOverrides(
      option,
      op.id,
      own ? config.groups[group.name]?.id : undefined,
    );
  });

  const query = op.queryParams
    .filter((param) => param.name !== "pageSize" && param.name !== "pageCursor")
    .map((param) => {
      const p = placeholder(param);
      return withOverrides(
        {
          flag: kebab(param.name),
          placeholder: p,
          description: inputDescription(param, p, listed),
          required: param.required,
          repeatable: param.schema.type === "array",
          parseBool: p === "bool" && param.schema.type === "boolean",
          sdkTyped: isSdkTyped(param.schema),
          target: "query",
          key: param.name,
        },
        op.id,
      );
    });

  const form = op.formFields.map((field) => {
    const isFile = field.schema.format === "binary";
    const p = isFile ? "path" : placeholder(field);
    return withOverrides(
      {
        flag: kebab(field.name),
        placeholder: p,
        description: isFile
          ? fileDescription(field)
          : inputDescription(field, p, listed),
        required: field.required,
        repeatable: false,
        parseBool: false,
        sdkTyped: false,
        target: isFile ? "file" : "form",
        key: field.name,
      },
      op.id,
    );
  });

  return [...path, ...query, ...form];
}
