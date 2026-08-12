declare const __VANTA_VERSION__: string | undefined;

export const Version: string =
  typeof __VANTA_VERSION__ !== "undefined" ? __VANTA_VERSION__ : "dev";

export function userAgent(): string {
  return `vanta-cli/${Version}`;
}
