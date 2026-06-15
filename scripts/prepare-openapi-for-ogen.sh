#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INPUT_SPEC="${1:-$REPO_ROOT/api-spec.yaml}"
OUTPUT_SPEC="${2:-$REPO_ROOT/api-spec.codegen.yaml}"

fail() {
  echo "prepare-openapi-for-ogen: $1" >&2
  exit 1
}

[[ -f "$INPUT_SPEC" ]] || fail "input spec not found: $INPUT_SPEC"
mkdir -p "$(dirname "$OUTPUT_SPEC")"

tmp1="$(mktemp)"
tmp2="$(mktemp)"
meta="$(mktemp)"
cleanup() {
  rm -f "$tmp1" "$tmp2" "$meta"
}
trap cleanup EXIT

cp "$INPUT_SPEC" "$tmp1"

# 1) YAML plain scalar "NO" is parsed as boolean by YAML 1.1 parsers.
awk '
BEGIN { replaced = 0 }
{
  if (!replaced && $0 == "        - NO") {
    if (getline nextline) {
      if (nextline == "        - NOT_SPECIFIED") {
        print "        - \"NO\""
        print nextline
        replaced = 1
        next
      }
      print $0
      print nextline
      next
    }
  }
  print
}
' "$tmp1" > "$tmp2"
mv "$tmp2" "$tmp1"

awk '
BEGIN { ok = 0 }
$0 == "        - \"NO\"" {
  if (getline nextline) {
    if (nextline == "        - NOT_SPECIFIED") {
      ok = 1
    }
  }
}
END { exit ok ? 0 : 1 }
' "$tmp1" || fail "missing expected language enum values (NO / NOT_SPECIFIED)"

# 2) Work around ogen type-name collision.
if awk 'BEGIN{found=0} $0=="    SecurityReviewDecision:"{found=1} END{exit found?0:1}' "$tmp1"; then
  awk '
  BEGIN { replaced = 0 }
  {
    if (!replaced && $0 == "    SecurityReviewDecision:") {
      print "    SecurityReviewDecisionStatus:"
      replaced = 1
      next
    }
    print
  }
  ' "$tmp1" > "$tmp2"
  mv "$tmp2" "$tmp1"
elif ! awk 'BEGIN{found=0} $0=="    SecurityReviewDecisionStatus:"{found=1} END{exit found?0:1}' "$tmp1"; then
  fail "missing SecurityReviewDecision schema key"
fi

if awk 'index($0, "#/components/schemas/SecurityReviewDecision\""){found=1} END{exit found?0:1}' "$tmp1"; then
  awk '
  {
    gsub("#/components/schemas/SecurityReviewDecision\"", "#/components/schemas/SecurityReviewDecisionStatus\"")
    print
  }
  ' "$tmp1" > "$tmp2"
  mv "$tmp2" "$tmp1"
elif ! awk 'index($0, "#/components/schemas/SecurityReviewDecisionStatus\""){found=1} END{exit found?0:1}' "$tmp1"; then
  fail "missing SecurityReviewDecision schema reference"
fi

# 3) Convert document download media endpoint schemas to binary.
convert_media_endpoint_to_binary() {
  local endpoint_line="$1"
  local endpoint_label="$2"

  awk -v endpoint="$endpoint_line" -v meta_path="$meta" '
  BEGIN {
    in_endpoint = 0
    saw_endpoint = 0
    ref_count = 0
    binary_count = 0
  }
  {
    if ($0 == endpoint) {
      in_endpoint = 1
      saw_endpoint = 1
      print
      next
    }

    if (in_endpoint && $0 ~ /^  \//) {
      in_endpoint = 0
    }

    if (in_endpoint) {
      if ($0 == "                $ref: \"#/components/schemas/NodeJS.ReadableStream\"") {
        print "                type: string"
        print "                format: binary"
        ref_count++
        next
      }
      if ($0 == "                format: binary") {
        binary_count++
      }
    }

    print
  }
  END {
    printf("%d %d %d\n", saw_endpoint, ref_count, binary_count) > meta_path
    if (!saw_endpoint) {
      exit 10
    }
    if (ref_count == 0 && binary_count == 0) {
      exit 11
    }
  }
  ' "$tmp1" > "$tmp2" || {
    read -r saw_endpoint ref_count binary_count < "$meta" || true
    if [[ "${saw_endpoint:-0}" == "0" ]]; then
      fail "missing ${endpoint_label} endpoint"
    fi
    fail "expected NodeJS.ReadableStream refs or binary schemas inside ${endpoint_label}"
  }

  mv "$tmp2" "$tmp1"
  read -r saw_endpoint ref_count binary_count < "$meta"
  conversions=$((conversions + ref_count))
}

conversions=0
convert_media_endpoint_to_binary \
  "  /documents/{documentId}/uploads/{uploadedFileId}/media:" \
  "/documents/{documentId}/uploads/{uploadedFileId}/media"
convert_media_endpoint_to_binary \
  "  /trust-centers/{slugId}/resources/{resourceId}/media:" \
  "/trust-centers/{slugId}/resources/{resourceId}/media"

cp "$tmp1" "$OUTPUT_SPEC"
echo "Prepared spec for ogen: $OUTPUT_SPEC"
echo "Applied binary media conversions: $conversions"
