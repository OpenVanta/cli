#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INPUT_SPEC="${1:-$REPO_ROOT/api-spec.json}"
OUTPUT_SPEC="${2:-$REPO_ROOT/api-spec.codegen.json}"

fail() {
  echo "prepare-openapi-for-ogen: $1" >&2
  exit 1
}

[[ -f "$INPUT_SPEC" ]] || fail "input spec not found: $INPUT_SPEC"
mkdir -p "$(dirname "$OUTPUT_SPEC")"

python3 - "$INPUT_SPEC" "$OUTPUT_SPEC" <<'PY'
import json
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"prepare-openapi-for-ogen: {message}", file=sys.stderr)
    raise SystemExit(1)


def replace_security_review_refs(node, old_ref, new_ref, counts):
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "$ref":
                if value == old_ref:
                    node[key] = new_ref
                    counts["old"] += 1
                elif value == new_ref:
                    counts["new"] += 1
            replace_security_review_refs(value, old_ref, new_ref, counts)
    elif isinstance(node, list):
        for item in node:
            replace_security_review_refs(item, old_ref, new_ref, counts)


def rename_schema_refs(node, ref_map):
    replacements = 0

    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str):
                new_value = ref_map.get(value)
                if new_value is not None:
                    node[key] = new_value
                    replacements += 1
            else:
                replacements += rename_schema_refs(value, ref_map)

    elif isinstance(node, list):
        for item in node:
            replacements += rename_schema_refs(item, ref_map)

    return replacements


def rename_task_type_variant_schemas(schemas, spec):
    rename_pairs = []
    for schema_name in list(schemas.keys()):
        if schema_name.startswith("TaskType."):
            suffix = schema_name[len("TaskType.") :]
            new_name = f"TaskTypeVariant.{suffix}"
            if new_name in schemas and schema_name != new_name:
                fail(
                    "unexpected duplicate TaskType variant schema keys: "
                    f"{schema_name} and {new_name}"
                )
            rename_pairs.append((schema_name, new_name))

    for old_name, new_name in rename_pairs:
        schemas[new_name] = schemas.pop(old_name)

    ref_map = {
        f"#/components/schemas/{old_name}": f"#/components/schemas/{new_name}"
        for old_name, new_name in rename_pairs
    }
    ref_replacements = rename_schema_refs(spec, ref_map)
    return len(rename_pairs), ref_replacements


def replace_anyof_with_oneof(node):
    replacements = 0

    if isinstance(node, dict):
        if "anyOf" in node:
            if "oneOf" in node:
                fail("encountered schema object with both anyOf and oneOf")
            node["oneOf"] = node.pop("anyOf")
            replacements += 1

        for value in node.values():
            replacements += replace_anyof_with_oneof(value)

    elif isinstance(node, list):
        for item in node:
            replacements += replace_anyof_with_oneof(item)

    return replacements


def convert_stream_refs_to_binary(node):
    ref_count = 0
    binary_count = 0

    if isinstance(node, dict):
        if node.get("$ref") == "#/components/schemas/NodeJS.ReadableStream":
            node.clear()
            node["type"] = "string"
            node["format"] = "binary"
            return 1, 0

        if node.get("format") == "binary":
            binary_count += 1

        for value in node.values():
            child_ref_count, child_binary_count = convert_stream_refs_to_binary(value)
            ref_count += child_ref_count
            binary_count += child_binary_count

    elif isinstance(node, list):
        for item in node:
            child_ref_count, child_binary_count = convert_stream_refs_to_binary(item)
            ref_count += child_ref_count
            binary_count += child_binary_count

    return ref_count, binary_count


input_path = Path(sys.argv[1])
output_path = Path(sys.argv[2])

try:
    spec = json.loads(input_path.read_text(encoding="utf-8"))
except FileNotFoundError:
    fail(f"input spec not found: {input_path}")
except json.JSONDecodeError as exc:
    fail(f"input spec is not valid JSON: {exc}")

if not isinstance(spec, dict):
    fail("input spec root must be a JSON object")

components = spec.get("components")
if not isinstance(components, dict):
    fail("missing components object")

schemas = components.get("schemas")
if not isinstance(schemas, dict):
    fail("missing components.schemas object")

# Work around ogen type-name collision.
if "SecurityReviewDecision" in schemas and "SecurityReviewDecisionStatus" not in schemas:
    schemas["SecurityReviewDecisionStatus"] = schemas.pop("SecurityReviewDecision")
elif (
    "SecurityReviewDecision" not in schemas
    and "SecurityReviewDecisionStatus" not in schemas
):
    fail("missing SecurityReviewDecision schema key")

old_ref = "#/components/schemas/SecurityReviewDecision"
new_ref = "#/components/schemas/SecurityReviewDecisionStatus"
ref_counts = {"old": 0, "new": 0}
replace_security_review_refs(spec, old_ref, new_ref, ref_counts)
if ref_counts["old"] == 0 and ref_counts["new"] == 0:
    fail("missing SecurityReviewDecision schema reference")

# Rename TaskType variant schemas to avoid ogen symbol collisions.
task_type_schema_renames, task_type_ref_replacements = rename_task_type_variant_schemas(
    schemas, spec
)

# Replace unsupported anyOf with oneOf for ogen codegen.
anyof_replacements = replace_anyof_with_oneof(spec)

# Convert document download media endpoint schemas to binary.
paths = spec.get("paths")
if not isinstance(paths, dict):
    fail("missing paths object")

media_endpoints = [
    "/documents/{documentId}/uploads/{uploadedFileId}/media",
    "/trust-centers/{slugId}/resources/{resourceId}/media",
]
conversions = 0
for endpoint in media_endpoints:
    endpoint_obj = paths.get(endpoint)
    if endpoint_obj is None:
        fail(f"missing {endpoint} endpoint")

    ref_count, binary_count = convert_stream_refs_to_binary(endpoint_obj)
    if ref_count == 0 and binary_count == 0:
        fail(f"expected NodeJS.ReadableStream refs or binary schemas inside {endpoint}")
    conversions += ref_count

output_path.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
print(f"Prepared spec for ogen: {output_path}")
print(f"Renamed TaskType variant schemas: {task_type_schema_renames}")
print(f"Updated TaskType variant refs: {task_type_ref_replacements}")
print(f"Replaced anyOf with oneOf: {anyof_replacements}")
print(f"Applied binary media conversions: {conversions}")
PY
