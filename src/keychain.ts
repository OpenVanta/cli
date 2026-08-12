/**
 * OS credential store access.
 *
 * macOS matches zalando/go-keyring by shelling out to Apple-signed
 * /usr/bin/security. Items trust only that tool (-T /usr/bin/security), not
 * every app (-A). Windows uses @napi-rs/keyring (Credential Manager).
 */
import { spawnSync } from "node:child_process";

export const credentialStoreService = "com.vanta.cli";
export const credentialStoreAccount = "oauth";

const securityPath = "/usr/bin/security";
const goKeyringBase64Prefix = "go-keyring-base64:";
const goKeyringHexPrefix = "go-keyring-encoded:";

export function useSystemCredentialStore(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

export function credentialStorageDescription(): string {
  if (process.platform === "darwin") return "macOS Keychain";
  if (process.platform === "win32") return "Windows Credential Manager";
  return "config file";
}

export function decodeKeyringPassword(encoded: string): string {
  if (encoded.startsWith(goKeyringBase64Prefix)) {
    return Buffer.from(
      encoded.slice(goKeyringBase64Prefix.length),
      "base64",
    ).toString("utf8");
  }
  if (encoded.startsWith(goKeyringHexPrefix)) {
    return Buffer.from(
      encoded.slice(goKeyringHexPrefix.length),
      "hex",
    ).toString("utf8");
  }
  return encoded;
}

export function encodeKeyringPassword(password: string): string {
  return (
    goKeyringBase64Prefix + Buffer.from(password, "utf8").toString("base64")
  );
}

/** Minimal shell quoting for security -i commands (matches go-keyring intent). */
function shellQuote(value: string): string {
  if (value.length === 0) return "''";
  if (/^[A-Za-z0-9_/@%+=:,.-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function runSecurity(args: string[], input?: string) {
  return spawnSync(securityPath, args, {
    input,
    encoding: "utf8",
  });
}

function deleteViaSecurity(service: string, account: string): void {
  const result = runSecurity([
    "delete-generic-password",
    "-s",
    service,
    "-a",
    account,
  ]);
  if (result.status === 0) return;
  const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (combined.includes("could not be found")) return;
}

function getViaSecurity(service: string, account: string): string | null {
  const result = runSecurity([
    "find-generic-password",
    "-s",
    service,
    "-wa",
    account,
  ]);
  if (result.status !== 0) {
    const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (
      combined.includes("could not be found") ||
      combined.includes("The specified item could not be found")
    ) {
      return null;
    }
    throw new Error(
      `read macOS Keychain: ${(result.stderr || result.stdout || "access denied or canceled").trim()}`,
    );
  }
  const value = (result.stdout ?? "").trim();
  return value || null;
}

function setViaSecurity(
  service: string,
  account: string,
  password: string,
): void {
  // Recreate (not in-place -U) so we can replace a cdhash ACL left by native
  // keyring writes. Trust only /usr/bin/security — same access path as the Go
  // CLI — not every application (-A).
  deleteViaSecurity(service, account);

  const command =
    `add-generic-password -s ${shellQuote(service)} -a ${shellQuote(account)} ` +
    `-w ${shellQuote(password)} -T ${shellQuote(securityPath)}\n`;
  if (command.length > 4096) {
    throw new Error("keychain secret is too large to store via security(1)");
  }

  const result = runSecurity(["-i"], command);
  if (result.status !== 0) {
    throw new Error(
      `write macOS Keychain: ${(result.stderr || result.stdout || "unknown error").trim()}`,
    );
  }
}

type KeyringEntry = {
  getPassword: () => string;
  setPassword: (password: string) => void;
};

type KeyringModule = {
  Entry: new (service: string, account: string) => KeyringEntry;
};

let windowsKeyring: KeyringModule | null | undefined;
let cachedPassword: string | null | undefined;
let repairedAcl = false;

async function loadWindowsKeyring(): Promise<KeyringModule | null> {
  if (windowsKeyring !== undefined) return windowsKeyring;
  try {
    windowsKeyring = (await import("@napi-rs/keyring")) as KeyringModule;
    return windowsKeyring;
  } catch {
    windowsKeyring = null;
    return null;
  }
}

function repairDarwinAcl(service: string, account: string, raw: string): void {
  if (repairedAcl) return;
  repairedAcl = true;
  try {
    setViaSecurity(service, account, raw);
    cachedPassword = raw;
  } catch {
    // Best-effort: next login/token cache write will recreate with -T security.
  }
}

export async function getKeychainPassword(
  service = credentialStoreService,
  account = credentialStoreAccount,
): Promise<string | null> {
  if (cachedPassword !== undefined) {
    return cachedPassword;
  }

  if (process.platform === "darwin") {
    const raw = getViaSecurity(service, account);
    cachedPassword = raw;
    if (raw) {
      // One-shot rewrite clears native-keyring cdhash ACLs.
      repairDarwinAcl(service, account, raw);
    }
    return raw;
  }

  if (process.platform === "win32") {
    const keyring = await loadWindowsKeyring();
    if (!keyring) {
      cachedPassword = null;
      return null;
    }
    try {
      const raw = new keyring.Entry(service, account).getPassword();
      cachedPassword = raw;
      return raw;
    } catch {
      cachedPassword = null;
      return null;
    }
  }

  cachedPassword = null;
  return null;
}

export async function setKeychainPassword(
  password: string,
  service = credentialStoreService,
  account = credentialStoreAccount,
): Promise<void> {
  if (process.platform === "darwin") {
    setViaSecurity(service, account, password);
    cachedPassword = password;
    repairedAcl = true;
    return;
  }
  if (process.platform === "win32") {
    const keyring = await loadWindowsKeyring();
    if (!keyring) {
      throw new Error("system credential store is unavailable");
    }
    new keyring.Entry(service, account).setPassword(password);
    cachedPassword = password;
    return;
  }
  throw new Error("system credential store is unavailable");
}

export async function systemCredentialStoreAvailable(): Promise<boolean> {
  if (process.platform === "darwin") {
    return true;
  }
  if (process.platform === "win32") {
    return (await loadWindowsKeyring()) !== null;
  }
  return false;
}
