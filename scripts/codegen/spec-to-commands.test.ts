// Unit tests for the codegen rules, on a small made-up API. Each test pins one
// naming rule, flag rule, or config option, so a failure says which one broke.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CodegenConfig } from "./config.js";
import { type ApiSpec, type Operation, renderCommandFiles, specToCommands } from "./spec-to-commands.js";

type Paths = ApiSpec["paths"];
type Response = Operation["responses"][string];

const json = (schema: object = {}): Response => ({
  description: "",
  content: { "application/json": { schema } },
});
const list = json({ type: "object", properties: { results: { type: "array", items: {} } } });
const file: Response = { description: "", content: { "application/pdf": {} } };

const op = (operationId: string, extra: Partial<Operation> = {}): Operation => ({
  operationId,
  responses: { "200": json() },
  ...extra,
});
const query = (name: string, schema: object, description?: string) => ({
  in: "query" as const,
  name,
  schema,
  description,
});

const noConfig: CodegenConfig = {
  resources: [],
  commandGroups: {},
  commandNames: {},
  flagNames: {},
  helpValues: {},
  flagDescriptions: {},
};
const build = (paths: Paths, config: Partial<CodegenConfig> = {}) =>
  specToCommands({ paths }, { ...noConfig, ...config });
const command = (paths: Paths, id: string, config: Partial<CodegenConfig> = {}) => {
  const result = build(paths, config);
  assert.deepEqual(result.errors, []);
  return result.commands.find((c) => c.operationId === id)!;
};
const names = (paths: Paths, config: Partial<CodegenConfig> = {}) =>
  Object.fromEntries(build(paths, config).commands.map((c) => [c.operationId, c.path.join(" ")]));
const flag = (paths: Paths, id: string, param: string, config: Partial<CodegenConfig> = {}) =>
  command(paths, id, config).flags.find((f) => f.name === param)!;

// A made-up API that exercises each naming rule.
const things: Paths = {
  "/things": {
    get: op("ListThings", { responses: { "200": list } }),
    post: op("CreateThing", { requestBody: { content: { "application/json": { schema: {} } } } }),
  },
  "/things/archived": { get: op("ListArchivedThings", { responses: { "200": list } }) },
  "/things/{thingId}": {
    get: op("GetThing"),
    patch: op("UpdateThing"),
    put: op("SetThing"),
    delete: op("DeleteThing"),
  },
  "/things/{thingId}/set-owner": { post: op("SetThingOwner") },
  "/things/{thingId}/notes": { get: op("ListThingNotes", { responses: { "200": list } }) },
  "/things/{thingId}/media": { get: op("GetThingMedia", { responses: { "200": file } }) },
  "/things/{thingId}/widgets": { get: op("ListWidgets", { responses: { "200": list } }) },
  "/things/{thingId}/widgets/{widgetId}": { delete: op("DeleteWidget") },
  "/thing-settings": { get: op("GetThingSettings") },
};

describe("command names", () => {
  it("follow the URL and HTTP method", () => {
    assert.deepEqual(names(things), {
      ListThings: "things list",
      GetThing: "things get",
      CreateThing: "things create",
      UpdateThing: "things update",
      SetThing: "things set",
      DeleteThing: "things delete",
      GetThingMedia: "things download",
      ListArchivedThings: "things list-archived",
      ListThingNotes: "things list-notes",
      SetThingOwner: "things set-owner",
      ListWidgets: "things widgets list",
      DeleteWidget: "things widgets delete",
      GetThingSettings: "thing-settings get",
    });
  });

  it("put sub-resources with items in their own group", () => {
    const group = build(things).groups.find((g) => g.path.join(" ") === "things widgets");
    assert.deepEqual(group, { path: ["things", "widgets"], description: "Manage thing widgets" });
  });

  it("list CRUD verbs first, then the rest alphabetically", () => {
    const order = build(things)
      .commands.filter((c) => c.path.length === 2 && c.path[0] === "things")
      .map((c) => c.path[1]);
    assert.deepEqual(order, [
      "list", "get", "create", "update", "set", "delete",
      "download", "list-archived", "list-notes", "set-owner",
    ]);
  });

  it("fail when two operations get the same name", () => {
    const { errors } = build(things, { commandNames: { SetThing: "update" } });
    assert.deepEqual(errors, ['duplicate command "things update": UpdateThing and SetThing']);
  });
});

describe("flags", () => {
  it("keep path IDs' API names and require them", () => {
    const flags = command(things, "DeleteWidget").flags.map((f) => [f.flag, f.required, f.in]);
    assert.deepEqual(flags, [
      ["--thing-id <id>", true, "path"],
      ["--widget-id <id>", true, "path"],
    ]);
  });

  it("take names, placeholders, and help hints from query parameter types", () => {
    const paths: Paths = {
      "/things": {
        get: op("ListThings", {
          parameters: [
            query("pageSize", { type: "integer" }),
            query("isArchived", { type: "boolean" }, "Only archived things"),
            query("ownerIds", { type: "array", items: { type: "string" } }),
            query("status", { type: "string", enum: ["OPEN", "CLOSED"] }, "Filter by status"),
            query("createdAfter", { type: "string", format: "date-time" }, "Created after"),
            query("productContextIds", { type: "array", items: { type: "string", enum: ["A"] } }),
          ],
        }),
      },
    };
    const flags = command(paths, "ListThings").flags.map((f) => [f.flag, f.kind, f.description]);
    assert.deepEqual(flags, [
      ["--page-size <n>", "integer", "Page size"],
      ["--is-archived <bool>", "boolean", "Only archived things (true/false)"],
      ["--owner-ids <id>", "string", "Owner ids (repeatable)"],
      ["--status <status>", "string", "Filter by status: OPEN, CLOSED"],
      ["--created-after <timestamp>", "string", "Created after (ISO 8601 timestamp)"],
      ["--product-context-ids <context>", "string", "Product context ids: A (repeatable)"],
    ]);
  });

  it("rejoin wrapped spec descriptions and keep only the first paragraph", () => {
    const description = "Filter things that were\ncreated by this user.\n\nInternal note.";
    const paths: Paths = {
      "/things": { get: op("ListThings", { parameters: [query("creator", { type: "string" }, description)] }) },
    };
    assert.equal(flag(paths, "ListThings", "creator").description, "Filter things that were created by this user");
  });

  it("replace an out-of-date value list from the spec instead of showing both", () => {
    const schema = { type: "string", enum: ["A", "B", "C"] };
    const paths: Paths = {
      "/things": { get: op("ListThings", { parameters: [query("kind", schema, "Kind. Possible values: A, B")] }) },
    };
    assert.equal(flag(paths, "ListThings", "kind").description, "Kind: A, B, C");
  });

  it("name other parameters by their flag, not their API name", () => {
    const paths: Paths = {
      "/things": {
        get: op("ListThings", {
          parameters: [
            query("ownerId", { type: "string" }),
            query("status", { type: "string" }),
            query("tags", { type: "string" }),
            query(
              "unowned",
              { type: "boolean" },
              'Requires status. Ignored with ownerId or `status`; tags as JSON: [{"ownerId":"<id>"}]',
            ),
          ],
        }),
      },
    };
    const f = flag(paths, "ListThings", "unowned", { flagNames: { "ListThings.ownerId": "owner" } });
    assert.equal(
      f.description,
      'Requires status. Ignored with --owner or --status; tags as JSON: [{"ownerId":"<id>"}] (true/false)',
    );
  });

  it("turn a multipart file upload into one flag per field", () => {
    const paths: Paths = {
      "/files": {
        post: op("UploadFile", {
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: { file: { type: "string", format: "binary" }, title: { type: "string" } },
                },
              },
            },
          },
        }),
      },
    };
    const c = command(paths, "UploadFile");
    assert.equal(c.path.join(" "), "files upload");
    assert.deepEqual(
      c.flags.map((f) => [f.flag, f.kind, f.required, f.in]),
      [
        ["--file <path>", "file", true, "form"],
        ["--title <text>", "string", false, "form"],
      ],
    );
  });

  it("give file downloads an --output flag", () => {
    const c = command(things, "GetThingMedia");
    assert.equal(c.binaryResponse, true);
    assert.equal(c.flags.at(-1)!.flag, "--output <path>");
  });

  it("give JSON bodies --json/--file and reject flags that clash with them", () => {
    assert.equal(command(things, "CreateThing").jsonBody, true);
    const paths: Paths = {
      "/things": {
        post: op("CreateThing", {
          parameters: [query("file", { type: "string" })],
          requestBody: { content: { "application/json": { schema: {} } } },
        }),
      },
    };
    assert.deepEqual(build(paths).errors, ["CreateThing (things create): duplicate flag --file"]);
  });

  it("reject a flag named like a global flag", () => {
    // A command's --scope would be swallowed by the global OAuth --scope.
    const paths: Paths = {
      "/things": {
        get: op("ListThings", { parameters: [query("scope", { type: "string" })], responses: { "200": list } }),
      },
    };
    assert.deepEqual(build(paths).errors, [
      'ListThings (things list): --scope collides with a global flag; rename it in flagNames["ListThings.scope"]',
    ]);
  });
});

describe("config", () => {
  it("resources: makes a segment without items its own group", () => {
    const config = { resources: ["/things/{thingId}/notes"] };
    assert.equal(names(things, config).ListThingNotes, "things notes list");
  });

  it("resources: rejects paths that aren't in the spec or already have items", () => {
    const { errors } = build(things, { resources: ["/things/{thingId}/nope", "/things/{thingId}/widgets"] });
    assert.deepEqual(errors, [
      '"/things/{thingId}/nope" is not an API path prefix',
      'resources: "/things/{thingId}/widgets" has items under it, so it\'s already a resource; remove it',
    ]);
  });

  it("commandGroups: puts a URL prefix under another command group", () => {
    const config = { commandGroups: { "/thing-settings": "things settings" } };
    assert.equal(names(things, config).GetThingSettings, "things settings get");
    assert.deepEqual(build(things, { commandGroups: { "/nope": "things nope" } }).errors, [
      '"/nope" is not an API path prefix',
    ]);
  });

  it("commandNames: renames a command", () => {
    assert.equal(names(things, { commandNames: { SetThingOwner: "assign" } }).SetThingOwner, "things assign");
  });

  it("commandNames: rejects unknown operations and names that change nothing", () => {
    const { errors } = build(things, { commandNames: { GetThing: "get", Nope: "x" } });
    assert.deepEqual(errors, [
      'commandNames["GetThing"]: "get" is already the derived value; remove it',
      'commandNames["Nope"] matches no operation or parameter in the spec',
    ]);
  });

  it("flagNames: renames a flag but keeps sending the API parameter", () => {
    const paths: Paths = {
      "/things": { get: op("ListThings", { parameters: [query("scope", { type: "string" })] }) },
    };
    const f = flag(paths, "ListThings", "scope", { flagNames: { "ListThings.scope": "thing-scope" } });
    assert.deepEqual([f.flag, f.attribute, f.in, f.name], ["--thing-scope <text>", "thingScope", "query", "scope"]);
  });

  it("flagNames: rejects unknown parameters and names that change nothing", () => {
    const { errors } = build(things, {
      flagNames: { "GetThing.thingId": "thing-id", "GetThing.nope": "x" },
    });
    assert.deepEqual(errors, [
      'flagNames["GetThing.thingId"]: "thing-id" is already the derived value; remove it',
      'flagNames["GetThing.nope"] matches no operation or parameter in the spec',
    ]);
  });

  it("helpValues: changes the placeholder and the matching help hint", () => {
    const paths: Paths = {
      "/things": {
        get: op("ListThings", { parameters: [query("isPublic", { type: "string" }, "Public things")] }),
      },
    };
    const f = flag(paths, "ListThings", "isPublic", { helpValues: { isPublic: "bool" } });
    assert.deepEqual([f.flag, f.description], ["--is-public <bool>", "Public things (true/false)"]);
  });

  it("helpValues: applies to every operation with the parameter", () => {
    const paths: Paths = {
      "/things": { get: op("ListThings", { parameters: [query("owner", { type: "string" })] }) },
      "/widgets": { get: op("ListWidgets", { parameters: [query("owner", { type: "string" })] }) },
    };
    const config = { helpValues: { owner: "id" } };
    assert.equal(flag(paths, "ListThings", "owner", config).flag, "--owner <id>");
    assert.equal(flag(paths, "ListWidgets", "owner", config).flag, "--owner <id>");
  });

  it("helpValues: rejects unknown parameters and values that change nothing anywhere", () => {
    const { errors } = build(things, { helpValues: { thingId: "id", nope: "id" } });
    assert.deepEqual(errors, [
      'helpValues["thingId"]: "id" is already the derived value; remove it',
      'helpValues["nope"] matches no operation or parameter in the spec',
    ]);
  });

  it("flagDescriptions: replaces the help text everywhere the parameter appears", () => {
    const paths: Paths = {
      "/things": { get: op("ListThings", { parameters: [query("pageSize", { type: "integer" }, "Long text")] }) },
      "/widgets": { get: op("ListWidgets", { parameters: [query("pageSize", { type: "integer" }, "Long text")] }) },
    };
    const config = { flagDescriptions: { pageSize: "Results per page" } };
    assert.equal(flag(paths, "ListThings", "pageSize", config).description, "Results per page");
    assert.equal(flag(paths, "ListWidgets", "pageSize", config).description, "Results per page");
    assert.deepEqual(build(paths, { flagDescriptions: { nope: "x" } }).errors, [
      'flagDescriptions["nope"] matches no operation or parameter in the spec',
    ]);
  });
});

describe("renderCommandFiles", () => {
  it("writes one file per group plus an index that imports them all", () => {
    const { commands, groups } = build(things);
    const files = renderCommandFiles(commands, groups);
    assert.deepEqual([...files.keys()].sort(), [
      "index.ts", "thing-settings.ts", "things-widgets.ts", "things.ts",
    ]);
    assert.match(files.get("index.ts")!, /import \* as thingsWidgetsCommands from "\.\/things-widgets\.js";/);
    assert.match(files.get("things-widgets.ts")!, /"operationId": "DeleteWidget"/);
  });
});
