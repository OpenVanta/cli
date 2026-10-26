// Command descriptions: generated from the verb and the resources in the path
// ("List findings for a vendor"), then replaced by `config.commandHelp` and
// `config.optionHelp` where the default reads poorly.
import * as config from "./config.js";
import type { Group } from "./groups.js";
import type { Placement } from "./naming.js";
import type { Operation, Segment } from "./spec.js";
import {
  a,
  displayPlural,
  displaySingular,
  humanize,
  isPlural,
  nounFor,
  singular,
  upperFirst,
} from "./words.js";

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
