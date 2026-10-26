// What each command's flags and help say: flags from the operation's inputs,
// placeholders, and descriptions from the spec and the path, then the
// overrides in `config.commandHelp` and `config.optionHelp`. See AGENTS.md
// "Help text".
import {
  a,
  displayPlural,
  displaySingular,
  humanize,
  isPlural,
  kebab,
  lowerFirst,
  nounFor,
  singular,
  upperFirst,
} from "./commands.js";
import * as config from "./config.js";
import { valueSchema } from "./spec.js";
import type {
  Group,
  Input,
  Operation,
  Option,
  OptionOverride,
  Placement,
  Schema,
  Segment,
} from "./types.js";

// ===========================================================================
// Flags
// ===========================================================================

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
  return config.placeholderNouns.includes(noun) ? noun : "text";
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
  extra?: OptionOverride,
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

// ===========================================================================
// Command descriptions
// ===========================================================================

const prepositions = new Set(["as", "for", "from", "in", "to", "with"]);

// The words a description is built from. For `vendors get-finding`
// (`/vendors/{vendorId}/findings/{findingId}`): the subject is "finding" /
// "findings", and its owner is "vendor" / "vendors".
type Words = {
  op: Operation;
  placement: Placement;
  verb: string;
  // The path ends in an ID: `/vendors/{vendorId}`.
  atItem: boolean;
  topGroup: string;
  // The last resource in the path, if any.
  subject?: { segment: Segment; one: string; many: string };
  // The group (when it owns its resources) and the resources between it and
  // the subject.
  ownerWords: string[];
  owner: string;
  owners: string;
  // The resource just above the subject, else the group.
  parent: Segment;
  // The subject's owner if it has one, else the subject, else the group.
  one: string;
  many: string;
};

function words(
  name: string,
  op: Operation,
  placement: Placement,
  group: Group,
  ownsResources: boolean,
): Words {
  const topGroup = placement.groupSegment.name;
  const subjectSegment = placement.resources.at(-1);
  const parents = placement.resources.slice(0, -1);
  const parent = parents.at(-1) ?? placement.groupSegment;
  const ownerWords = [
    ...(ownsResources ? [group.singular] : []),
    ...parents.map((s) => displaySingular(s.name, topGroup)),
  ];
  const owner = ownerWords.join(" ");
  const owners = parents.length
    ? [...ownerWords.slice(0, -1), displayPlural(parent.name, topGroup)].join(
        " ",
      )
    : group.plural;
  const subject = subjectSegment && {
    segment: subjectSegment,
    one:
      nounFor(subjectSegment.name, topGroup)?.commandSingular ??
      displaySingular(subjectSegment.name, topGroup),
    many: displayPlural(subjectSegment.name, topGroup),
  };
  return {
    op,
    placement,
    verb: upperFirst(name.split("-")[0]!),
    atItem: op.segments.at(-1)!.param !== undefined,
    topGroup,
    subject,
    ownerWords,
    owner,
    owners,
    parent,
    one: subject && owner ? owner : (subject?.one ?? group.singular),
    many: subject && owner ? owners : (subject?.many ?? group.plural),
  };
}

export function commandDescription(
  name: string,
  op: Operation,
  placement: Placement,
  group: Group,
  ownsResources: boolean,
): string {
  const w = words(name, op, placement, group, ownsResources);
  if (placement.action) return describeAction(w, placement.action);
  // With no owner, the subject stands alone ("List questionnaires").
  if (!w.subject || !w.owner) return describeStandalone(w);
  if (w.parent.param === undefined)
    return describeUnderCollection(w, w.subject);
  return describeUnderItem(w, w.subject);
}

// Commands named by a path action: `vendors set-status`, `groups add-people`.
function describeAction(w: Words, action: string): string {
  const { verb, subject, owner, one, many, op } = w;
  // `add-document-to-control` under `controls` → "document".
  const own = singular(w.placement.groupSegment.name);
  const suffix = ["to", "from", "for"]
    .map((preposition) => `-${preposition}-${own}`)
    .find((s) => action.endsWith(s));
  const rest = humanize(suffix ? action.slice(0, -suffix.length) : action)
    .split(" ")
    .slice(1);
  const target = subject && owner ? `${owner} ${subject.one}` : one;
  // Actions on the collection, e.g. `people offboard`.
  if (!op.segments.some((s) => s.param)) {
    return rest.length === 0 ? `${verb} ${many}` : op.summary;
  }
  if (rest.length === 0) return `${verb} ${a(target)}`;
  if (prepositions.has(rest[0]!))
    return `${verb} ${a(target)} ${rest.join(" ")}`;
  // `add-people` → "Add people to a group".
  const object = rest.join(" ");
  const linked = isPlural(rest.at(-1)!) || rest.length > 1 ? object : a(object);
  if (verb === "Add") return `Add ${linked} to ${a(target)}`;
  if (verb === "Remove") return `Remove ${linked} from ${a(target)}`;
  return `${verb} ${object} for ${a(target)}`;
}

// The group itself, or a resource with no owner: "Get a vendor by ID".
function describeStandalone({ verb, atItem, one, many, op }: Words): string {
  switch (verb) {
    case "List":
      return `List ${many}`;
    case "Get":
      return atItem ? `Get ${a(one)} by ID` : `Get ${many}`;
    case "Create":
    case "Upload":
      return `${verb} ${a(one)}`;
    case "Update":
      return atItem ? `Update ${a(one)}` : `Update ${many}`;
    case "Delete":
      return `Delete ${a(one)}`;
    case "Set":
      return `Set ${many}`;
  }
  return op.summary;
}

// Under a collection rather than an item: `controls list-deactivated`,
// `trust-centers add-control-tags`.
function describeUnderCollection(
  w: Words,
  subject: NonNullable<Words["subject"]>,
): string {
  const { verb, atItem, one, many, placement } = w;
  if (verb === "Add") return `Add ${subject.many} to ${many}`;
  if (verb === "Remove") return `Remove ${subject.many} from ${many}`;
  if (subject.segment.name === "order") return `Reorder ${many}`;
  if (verb === "List") {
    // `deactivated-controls` under `controls` → "List deactivated controls".
    const group = placement.groupSegment.name;
    const words = humanize(subject.segment.name)
      .split(" ")
      .filter((word) => word !== group && word !== singular(group));
    return `List ${words.join(" ")} ${many}`;
  }
  // A resource of its own under the collection: "Create a questionnaire export".
  if (isPlural(subject.segment.name)) {
    return `${verb} ${a(`${one} ${subject.one}`)}${atItem ? " by ID" : ""}`;
  }
  return `${verb} ${a(`${subject.one} ${one}`)}`;
}

// Under an item: "List findings for a vendor".
function describeUnderItem(
  w: Words,
  subject: NonNullable<Words["subject"]>,
): string {
  const { verb, atItem, one, op } = w;
  if (op.returnsFile) return `Download the ${subject.one} for ${a(one)}`;
  const resource = a(`${one} ${subject.one}`);
  switch (verb) {
    case "List":
      return `List ${subject.many} for ${a(one)}`;
    case "Get":
      return `Get ${resource}${atItem ? " by ID" : ""}`;
    case "Update":
      return !atItem && isPlural(subject.segment.name)
        ? `Update ${subject.many} for ${a(one)}`
        : `Update ${resource}`;
    case "Create":
    case "Delete":
      return `${verb} ${resource}`;
    case "Add":
      return `Add ${a(subject.one)} to ${a(one)}`;
    case "Remove":
      return `Remove ${a(subject.one)} from ${a(one)}`;
    case "Upload":
      return `Upload ${a(subject.one)} for ${a(one)}`;
    case "Set":
      return subject.segment.name === "order"
        ? `Reorder ${displayPlural(w.parent.name, w.topGroup)} for ${a(w.ownerWords.slice(0, -1).join(" "))}`
        : `Set ${subject.many} for ${a(one)}`;
  }
  return op.summary;
}

// Replaces generated descriptions with `config.commandHelp` and
// `config.optionHelp`, and fails on entries that match nothing or repeat the
// default, so the overrides stay a list of deliberate wording.
export function applyHelpOverrides(groups: Group[]): void {
  const problems: string[] = [];
  const unusedCommands = new Set(Object.keys(config.commandHelp));
  const unusedOptions = new Set(
    Object.entries(config.optionHelp).flatMap(([cmd, flags]) =>
      Object.keys(flags).map((flag) => `${cmd} ${flag}`),
    ),
  );
  const override = (
    key: string,
    generated: string,
    text: string | undefined,
    unused: Set<string>,
  ) => {
    if (text === undefined) return generated;
    unused.delete(key);
    if (text === generated)
      problems.push(`help text for "${key}" repeats the default`);
    return text;
  };

  for (const group of groups) {
    group.description = override(
      group.name,
      group.description,
      config.commandHelp[group.name],
      unusedCommands,
    );
    for (const command of group.commands) {
      const key = `${group.name} ${command.name}`;
      command.description = override(
        key,
        command.description,
        config.commandHelp[key],
        unusedCommands,
      );
      for (const o of command.options) {
        const flag = `--${o.flag}`;
        o.description = override(
          `${key} ${flag}`,
          o.description,
          config.optionHelp[key]?.[flag],
          unusedOptions,
        );
      }
    }
  }
  for (const key of unusedCommands)
    problems.push(`help text for unknown command "${key}"`);
  for (const key of unusedOptions)
    problems.push(`help text for unknown option "${key}"`);
  if (problems.length)
    throw new Error(`scripts/codegen/config.ts:\n  ${problems.join("\n  ")}`);
}
