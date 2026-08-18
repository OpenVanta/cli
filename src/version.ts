declare const __VANTA_VERSION__: string | undefined;

export const Version: string =
  typeof __VANTA_VERSION__ !== "undefined" ? __VANTA_VERSION__ : "dev";

export function userAgent(): string {
  return `vanta-cli/${Version}`;
}

export function displayVersion(version: string): string {
  const trimmed = version.trim();
  if (!trimmed) return "dev";
  if (trimmed === "dev" || trimmed.startsWith("v")) return trimmed;
  return `v${trimmed}`;
}

export function normalizeVersion(version: string): string {
  let v = version.trim();
  if (v.startsWith("v") || v.startsWith("V")) {
    v = v.slice(1);
  }
  const cut = v.search(/[-+]/);
  if (cut >= 0) {
    v = v.slice(0, cut);
  }
  return v;
}
