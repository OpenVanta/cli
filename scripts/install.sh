#!/usr/bin/env bash
set -euo pipefail

# Install the Vanta CLI from GitHub Releases.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/VantaInc/cli/main/scripts/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --version v0.1.0
#   ./scripts/install.sh --install-dir ~/.local/bin

REPO="${VANTA_REPO:-VantaInc/cli}"
BINARY_NAME="vanta"
INSTALL_DIR=""
VERSION=""

usage() {
  cat <<EOF
Install the Vanta CLI from GitHub Releases.

Usage:
  install.sh [options]

Options:
  --version <ver>       Version to install (e.g. v0.1.0 or 0.1.0). Default: latest
  --install-dir <dir>   Directory to install into. Default: /usr/local/bin, or ~/.local/bin
  -h, --help            Show this help

Environment:
  VANTA_REPO            GitHub repo (default: VantaInc/cli)
  VANTA_INSTALL_DIR     Override install directory
EOF
}

log() {
  printf '==> %s\n' "$*"
}

err() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || err "required command not found: $1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      [[ $# -ge 2 ]] || err "--version requires a value"
      VERSION="$2"
      shift 2
      ;;
    --install-dir)
      [[ $# -ge 2 ]] || err "--install-dir requires a value"
      INSTALL_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      err "unknown option: $1"
      ;;
  esac
done

need_cmd curl
need_cmd tar
need_cmd mktemp
need_cmd uname

if command -v sha256sum >/dev/null 2>&1; then
  SHA256="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA256="shasum -a 256"
else
  err "required command not found: sha256sum or shasum"
fi

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin|linux) ;;
  mingw*|msys*|cygwin*|windows)
    err "Windows is not supported by this script; download the .zip from https://github.com/${REPO}/releases"
    ;;
  *)
    err "unsupported OS: $OS"
    ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    err "unsupported architecture: $ARCH"
    ;;
esac

if [[ -z "$VERSION" ]]; then
  log "Resolving latest release for ${REPO}"
  VERSION="$(
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
      | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
      | head -n 1
  )"
  [[ -n "$VERSION" ]] || err "could not determine latest release; pass --version"
fi

# Normalize to tag with leading v and bare version for asset names.
TAG="$VERSION"
[[ "$TAG" == v* ]] || TAG="v${TAG}"
BARE_VERSION="${TAG#v}"

ASSET="${BINARY_NAME}_${BARE_VERSION}_${OS}_${ARCH}.tar.gz"
BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"

if [[ -n "${VANTA_INSTALL_DIR:-}" ]]; then
  INSTALL_DIR="${VANTA_INSTALL_DIR}"
fi

if [[ -z "$INSTALL_DIR" ]]; then
  if [[ -w /usr/local/bin ]] || [[ "$(id -u)" -eq 0 ]]; then
    INSTALL_DIR="/usr/local/bin"
  else
    INSTALL_DIR="${HOME}/.local/bin"
  fi
fi

TMPDIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

log "Downloading ${ASSET}"
curl -fsSL -o "${TMPDIR}/${ASSET}" "${BASE_URL}/${ASSET}"
curl -fsSL -o "${TMPDIR}/checksums.txt" "${BASE_URL}/checksums.txt"

log "Verifying checksum"
(
  cd "$TMPDIR"
  expected="$(
    # Prefer an exact filename match from checksums.txt
    awk -v f="$ASSET" '$2 == f || $2 == ("*" f) { print $1; exit }' checksums.txt
  )"
  [[ -n "$expected" ]] || err "checksum for ${ASSET} not found in checksums.txt"
  actual="$(${SHA256} "$ASSET" | awk '{ print $1 }')"
  [[ "$expected" == "$actual" ]] || err "checksum mismatch for ${ASSET}"
)

log "Extracting ${BINARY_NAME}"
tar -xzf "${TMPDIR}/${ASSET}" -C "$TMPDIR" "$BINARY_NAME"
[[ -f "${TMPDIR}/${BINARY_NAME}" ]] || err "archive did not contain ${BINARY_NAME}"
chmod 755 "${TMPDIR}/${BINARY_NAME}"

mkdir -p "$INSTALL_DIR"

DEST="${INSTALL_DIR}/${BINARY_NAME}"
if [[ -w "$INSTALL_DIR" ]]; then
  mv "${TMPDIR}/${BINARY_NAME}" "$DEST"
else
  need_cmd sudo
  log "Install directory is not writable; using sudo"
  sudo mv "${TMPDIR}/${BINARY_NAME}" "$DEST"
fi

log "Installed ${BINARY_NAME} ${TAG} to ${DEST}"

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    printf '\nNote: %s is not on your PATH. Add it with:\n  export PATH="%s:$PATH"\n' "$INSTALL_DIR" "$INSTALL_DIR"
    ;;
esac

if command -v "$BINARY_NAME" >/dev/null 2>&1 || [[ -x "$DEST" ]]; then
  log "Done. Run '${BINARY_NAME} login' to get started."
fi
