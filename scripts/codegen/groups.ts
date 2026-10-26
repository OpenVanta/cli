// Collects operations into command groups, one per top-level path segment.
import * as config from "./config.js";
import { commandDescription } from "./help.js";
import { commandName, place } from "./naming.js";
import { buildOptions, type Option } from "./options.js";
import type { Operation } from "./spec.js";
import { displayPlural, displaySingular } from "./words.js";

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

function newGroup(name: string): Group {
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

export function buildGroups(operations: Operation[]): Group[] {
  const groupNames = new Set(operations.map((op) => op.segments[0]!.name));
  // Groups like `customer-trust` have no endpoints of their own, so they don't
  // own the resources under them in descriptions.
  const groupsWithEndpoints = new Set(
    operations
      .filter((op) => op.segments.length === 1)
      .map((op) => op.segments[0]!.name),
  );
  const groups = new Map<string, Group>();
  for (const op of operations) {
    const placement = place(op);
    const name = placement.groupSegment.name;
    if (!groups.has(name)) groups.set(name, newGroup(name));
    const group = groups.get(name)!;
    const command =
      config.operations[op.id]?.name ?? commandName(op, placement);
    const queryNames = op.queryParams.map((q) => q.name);
    group.commands.push({
      name: command,
      description: commandDescription(
        command,
        op,
        placement,
        group,
        groupsWithEndpoints.has(name),
      ),
      op,
      options: buildOptions(op, placement, group, groupNames),
      paginated:
        queryNames.includes("pageSize") && queryNames.includes("pageCursor"),
      download: op.returnsFile,
    });
  }
  return [...groups.values()];
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
