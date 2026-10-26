// Reads api-spec.json into one `Operation` per API endpoint and method.
import { readFileSync } from "node:fs";
import type { Input, Method, Operation, Schema, Segment } from "./types.js";

// The parts of the OpenAPI spec the generator reads.
type Spec = {
  paths: Record<string, Partial<Record<Method, SpecOperation>>>;
};

type SpecOperation = {
  operationId: string;
  summary?: string;
  parameters?: SpecParameter[];
  requestBody?: { content?: Record<string, { schema?: Schema }> };
  responses?: Record<string, { content?: Record<string, unknown> }>;
};

type SpecParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Schema;
};

// The schema of one value: an array's items, else the schema itself.
export const valueSchema = (schema: Schema): Schema =>
  schema.type === "array" ? (schema.items ?? {}) : schema;

// The spec with every `{ "$ref": "#/components/..." }` replaced by the object it
// points to, so the rest of the generator never sees references. Shared and
// recursive schemas stay shared.
function resolveRefs(root: unknown): unknown {
  // `#/components/schemas/Vendor` → root.components.schemas.Vendor
  const lookup = (ref: string) =>
    ref
      .split("/")
      .slice(1)
      .reduce<unknown>(
        (node, key) => (node as Record<string, unknown>)[key],
        root,
      );
  const resolved = new Map<object, unknown>();
  const resolve = (node: unknown): unknown => {
    if (node === null || typeof node !== "object") return node;
    const ref = (node as { $ref?: unknown }).$ref;
    if (typeof ref === "string") return resolve(lookup(ref));
    if (resolved.has(node)) return resolved.get(node);
    if (Array.isArray(node)) {
      const out: unknown[] = [];
      resolved.set(node, out);
      for (const value of node) out.push(resolve(value));
      return out;
    }
    const out: Record<string, unknown> = {};
    resolved.set(node, out);
    for (const [key, value] of Object.entries(node)) out[key] = resolve(value);
    return out;
  };
  return resolve(root);
}

function toSegments(path: string): Segment[] {
  const segments: Segment[] = [];
  for (const part of path.split("/").filter(Boolean)) {
    const param = /^\{(.+)\}$/.exec(part)?.[1];
    if (param) segments.at(-1)!.param = param;
    else segments.push({ name: part });
  }
  return segments;
}

const toInput = (param: SpecParameter): Input => ({
  name: param.name,
  required: Boolean(param.required),
  description: param.description ?? "",
  schema: param.schema ?? {},
});

export function loadOperations(specPath: string): Operation[] {
  const spec = resolveRefs(JSON.parse(readFileSync(specPath, "utf8"))) as Spec;
  const ops: Operation[] = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const op = item[method];
      if (!op) continue;
      const params = op.parameters ?? [];
      const body = op.requestBody;
      const form = body?.content?.["multipart/form-data"];
      const formSchema: Schema = form?.schema ?? {};
      const ok = op.responses?.["200"] ?? op.responses?.["201"] ?? {};
      ops.push({
        id: op.operationId,
        method,
        path,
        summary: op.summary ?? "",
        segments: toSegments(path),
        pathParams: params.filter((param) => param.in === "path").map(toInput),
        queryParams: params
          .filter((param) => param.in === "query")
          .map(toInput),
        body: form ? "multipart" : body ? "json" : "none",
        formFields: Object.entries(formSchema.properties ?? {}).map(
          ([name, schema]) => ({
            name,
            required: (formSchema.required ?? []).includes(name),
            description: schema.description ?? "",
            schema,
          }),
        ),
        returnsFile: Object.keys(ok.content ?? {}).some(
          (t) => t !== "application/json",
        ),
      });
    }
  }
  return ops;
}
