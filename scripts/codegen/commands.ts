// Which commands exist and what they're called: each operation is placed in
// a group and named `<verb>-<noun>` (`vendors list-findings`). See AGENTS.md
// "Command structure".
import { camelCase, kebabCase, noCase, pascalCase } from "change-case";
import pluralize from "pluralize";
import * as config from "./config.js";
import type { Option } from "./help.js";
import type { Operation, Segment } from "./spec.js";

// ===========================================================================
// Words
// ===========================================================================

for (const noun of config.uncountableNouns) pluralize.addUncountableRule(noun);

export { camelCase as camel, kebabCase as kebab, pascalCase as pascal };

// `faqCategories` and `faq-categories` → "faq categories".
export const humanize = noCase;
export const lowerFirst = (s: string) =>
  s.replace(/^./, (c) => c.toLowerCase());
export const upperFirst = (s: string) =>
  s.replace(/^./, (c) => c.toUpperCase());

// "a vendor", "an integration", "a user".
export const a = (noun: string) =>
  `${/^[aeiou]/i.test(noun) && !/^(us|uni|eu)/i.test(noun) ? "an" : "a"} ${noun}`;

// Singularizes the last word of a kebab-case segment: `security-reviews`.
export const singular = (segment: string) => pluralize.singular(segment);
export const isPlural = (segment: string) => singular(segment) !== segment;

// Display names from `config.nouns`, keyed by "<group> <segment>" or by
// segment, else from the segment itself.
export const nounFor = (segment: string, group?: string) =>
  (group && config.nouns[`${group} ${segment}`]) || config.nouns[segment];
export const displaySingular = (segment: string, group?: string) =>
  nounFor(segment, group)?.singular ?? humanize(singular(segment));
export const displayPlural = (segment: string, group?: string) =>
  nounFor(segment, group)?.plural ?? humanize(segment);

// ===========================================================================
// Groups and commands
// ===========================================================================

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

export function newGroup(name: string): Group {
  const noun = config.nouns[name];
  const plural = noun?.plural ?? displayPlural(name);
  return {
    name,
    description: `Manage ${plural}`,
    singular: noun?.singular ?? displaySingular(name),
    plural,
    commands: [],
  };
}

// Where an operation sits in the CLI and what its path is made of.
export type Placement = {
  // The path's first segment, which names the group.
  groupSegment: Segment;
  // Segments after the group, minus a trailing action: they form the noun.
  resources: Segment[];
  action?: string;
};

export function place(op: Operation): Placement {
  const [groupSegment, ...rest] = op.segments as [Segment, ...Segment[]];
  const last = rest.at(-1);
  const isAction =
    last &&
    !last.param &&
    config.actionVerbs.includes(last.name.split("-")[0]!);
  return {
    groupSegment,
    resources: isAction ? rest.slice(0, -1) : rest,
    action: isAction ? last.name : undefined,
  };
}

// `<verb>-<noun>`, unless `config.operations` names the command.
export function commandName(op: Operation, placement: Placement): string {
  const override = config.operations[op.id]?.name;
  if (override) return override;
  const atItem = op.segments.at(-1)!.param !== undefined;
  let verb: string;
  let rest: string[] = [];
  // Operations on a whole collection keep the last noun plural.
  let plural = !atItem;
  const link = config.links.includes(op.id);
  if (placement.action) {
    [verb, ...rest] = placement.action.split("-") as [string, ...string[]];
    plural = false;
  } else if (op.method === "get") {
    verb = op.returnsFile ? "download" : atItem ? "get" : "list";
    plural = verb === "list";
  } else if (op.method === "post") {
    verb = link ? "add" : op.body === "multipart" ? "upload" : "create";
    // `create` and `add` make one item, unless the API adds many at once.
    plural = op.id.startsWith("Bulk");
  } else if (op.method === "delete" && link) {
    verb = "remove";
  } else {
    verb = { patch: "update", put: "set", delete: "delete" }[op.method];
  }
  const noun = placement.resources.map((s, i) =>
    plural && i === placement.resources.length - 1
      ? (config.nouns[s.name]?.commandPlural ?? s.name)
      : (config.nouns[s.name]?.commandSingular ?? singular(s.name)),
  );
  return [verb, ...noun, ...rest].join("-");
}

export function checkUniqueNames(groups: Group[]): void {
  for (const group of groups) {
    const seen = new Map<string, string>();
    for (const { name, op } of group.commands) {
      if (seen.has(name)) {
        throw new Error(
          `duplicate command "${group.name} ${name}" for ${seen.get(name)} and ${op.id}; add a name override in scripts/codegen/config.ts`,
        );
      }
      seen.set(name, op.id);
    }
  }
}
