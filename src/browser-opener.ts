import {
  spawn,
  type ChildProcess,
  type SpawnOptions,
} from "node:child_process";
import { win32 } from "node:path";

type BrowserOpenerOptions = {
  platform?: NodeJS.Platform;
  systemRoot?: string;
  launch?: (
    file: string,
    args: string[],
    options: SpawnOptions,
  ) => ChildProcess;
};

/** Best effort. Login prints the URL so the user can also open it manually. */
export function openBrowser(
  url: string,
  {
    platform = process.platform,
    systemRoot = process.env.SystemRoot,
    launch = spawn,
  }: BrowserOpenerOptions = {},
): void {
  let file: string;
  let args = [url];
  let cwd: string | undefined;
  switch (platform) {
    case "win32": {
      // Windows supplies SystemRoot to the process. Require a drive-qualified
      // path so joining System32 cannot depend on the current drive or folder.
      if (!systemRoot || !/^[a-z]:[\\/]/i.test(systemRoot)) return;
      cwd = win32.join(systemRoot, "System32");
      file = win32.join(cwd, "rundll32.exe");
      args = [`${win32.join(cwd, "url.dll")},FileProtocolHandler`, url];
      break;
    }
    case "darwin":
      file = "/usr/bin/open";
      break;
    case "linux":
      file = "/usr/bin/xdg-open";
      break;
    default:
      return;
  }

  try {
    const child = launch(file, args, { cwd, detached: true, stdio: "ignore" });
    child.on("error", () => {});
    child.unref();
  } catch {
    // The printed URL remains available.
  }
}
