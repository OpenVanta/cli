// Places an operation in a group and names its command (`vendors
// list-findings`); see AGENTS.md "Command structure".
import * as config from "./config.js";
import type { Operation, Segment } from "./spec.js";
import { singular } from "./words.js";

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

// `<verb>-<noun>`.
export function commandName(op: Operation, placement: Placement): string {
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
