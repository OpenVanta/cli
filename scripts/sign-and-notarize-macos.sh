#!/usr/bin/env bash
# Sign and notarize darwin amd64/arm64 binaries produced by build-binaries.ts.
#
# Required env:
#   MACOS_SIGN_P12          base64-encoded Developer ID Application .p12
#   MACOS_SIGN_PASSWORD     P12 password
#   MACOS_NOTARY_ISSUER_ID  App Store Connect API issuer id
#   MACOS_NOTARY_KEY_ID     App Store Connect API key id
#   MACOS_NOTARY_KEY        App Store Connect API private key (PEM contents)
#
# Optional:
#   VANTA_VERSION           version string without leading v (default: dev)
#   BINARY_DIR              directory with compiled binaries (default: dist/binaries)

set -euo pipefail

VERSION="${VANTA_VERSION:-dev}"
VERSION="${VERSION#v}"
BINARY_DIR="${BINARY_DIR:-dist/binaries}"

for name in \
  MACOS_SIGN_P12 \
  MACOS_SIGN_PASSWORD \
  MACOS_NOTARY_ISSUER_ID \
  MACOS_NOTARY_KEY_ID \
  MACOS_NOTARY_KEY; do
  if [[ -z "${!name:-}" ]]; then
    echo "error: missing required secret/env: $name" >&2
    exit 1
  fi
done

TMPDIR="$(mktemp -d)"
cleanup() {
  security delete-keychain "${TMPDIR}/build.keychain-db" >/dev/null 2>&1 || true
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

KEYCHAIN="${TMPDIR}/build.keychain-db"
KEYCHAIN_PASSWORD="$(openssl rand -base64 32)"
P12_PATH="${TMPDIR}/cert.p12"
API_KEY_PATH="${TMPDIR}/AuthKey_${MACOS_NOTARY_KEY_ID}.p8"

echo "${MACOS_SIGN_P12}" | base64 --decode > "${P12_PATH}"

# Materialize the App Store Connect API key as a strict PEM file.
# GitHub secrets often store literal "\n", single-line base64 bodies, or a
# base64-encoded .p8. Newer notarytool (Xcode 26+) rejects non-64-col PEMs
# with invalidPEMDocument.
python3 - "${API_KEY_PATH}" <<'PY'
import base64
import sys
import textwrap
from pathlib import Path

out_path = Path(sys.argv[1])
raw = __import__("os").environ.get("MACOS_NOTARY_KEY", "")
if not raw.strip():
    raise SystemExit("MACOS_NOTARY_KEY is empty")

# Expand escaped newlines commonly used in Actions secrets.
key = raw.replace("\\n", "\n").replace("\r\n", "\n").strip()

# If the whole secret is base64 (no PEM headers), decode once.
if "BEGIN" not in key:
    try:
        decoded = base64.b64decode(key, validate=False).decode("utf-8")
        if "BEGIN" in decoded:
            key = decoded.strip()
    except Exception:
        pass

lines = [line.strip() for line in key.splitlines() if line.strip()]
body_lines = [line for line in lines if not line.startswith("-----")]
raw_b64 = "".join(body_lines).replace(" ", "")
if not raw_b64:
    raise SystemExit("MACOS_NOTARY_KEY did not contain PEM body")

wrapped = "\n".join(textwrap.wrap(raw_b64, 64))
pem = f"-----BEGIN PRIVATE KEY-----\n{wrapped}\n-----END PRIVATE KEY-----\n"
out_path.write_text(pem, encoding="utf-8")
out_path.chmod(0o600)
print(f"Wrote API key PEM ({out_path.stat().st_size} bytes, {pem.count(chr(10))} lines)")
PY

# Fail fast with a clearer error than notarytool's invalidPEMDocument.
if ! openssl pkey -in "${API_KEY_PATH}" -noout >/dev/null 2>&1; then
  echo "error: MACOS_NOTARY_KEY is not a valid PKCS#8 private key PEM after normalization" >&2
  exit 1
fi

security create-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}"
security set-keychain-settings -lut 21600 "${KEYCHAIN}"
security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}"
security import "${P12_PATH}" -k "${KEYCHAIN}" -P "${MACOS_SIGN_PASSWORD}" \
  -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: \
  -s -k "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}" >/dev/null
security list-keychains -d user -s "${KEYCHAIN}" $(security list-keychains -d user | tr -d '"')

IDENTITY="$(
  security find-identity -v -p codesigning "${KEYCHAIN}" \
    | awk -F'"' '/Developer ID Application/ { print $2; exit }'
)"
[[ -n "${IDENTITY}" ]] || {
  echo "error: no Developer ID Application identity found in keychain" >&2
  exit 1
}

echo "Using signing identity: ${IDENTITY}"

sign_and_notarize() {
  local arch="$1"
  local binary="${BINARY_DIR}/vanta-darwin-${arch}"
  local archive="${BINARY_DIR}/vanta_${VERSION}_darwin_${arch}.tar.gz"

  [[ -f "${binary}" ]] || {
    echo "error: missing darwin ${arch} binary at ${binary}" >&2
    exit 1
  }

  local work="${TMPDIR}/vanta-${arch}"
  mkdir -p "${work}"
  cp "${binary}" "${work}/vanta"
  chmod 755 "${work}/vanta"

  codesign --force --options runtime --timestamp \
    --sign "${IDENTITY}" \
    --keychain "${KEYCHAIN}" \
    "${work}/vanta"

  codesign --verify --verbose=2 "${work}/vanta"

  local zip_path="${TMPDIR}/vanta-${arch}.zip"
  ditto -c -k --keepParent "${work}/vanta" "${zip_path}"

  xcrun notarytool submit "${zip_path}" \
    --issuer "${MACOS_NOTARY_ISSUER_ID}" \
    --key-id "${MACOS_NOTARY_KEY_ID}" \
    --key "${API_KEY_PATH}" \
    --wait \
    --timeout 20m

  xcrun stapler staple "${work}/vanta"

  tar -czf "${archive}" -C "${work}" vanta
  cp "${work}/vanta" "${binary}"
  echo "Notarized and archived ${archive}"
}

sign_and_notarize amd64
sign_and_notarize arm64

(
  cd "${BINARY_DIR}"
  : > checksums.txt
  for f in *.tar.gz *.zip; do
    [[ -f "$f" ]] || continue
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum "$f" >> checksums.txt
    else
      shasum -a 256 "$f" >> checksums.txt
    fi
  done
)

echo "macOS signing and notarization complete"
