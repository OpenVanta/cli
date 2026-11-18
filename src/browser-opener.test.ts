import assert from "node:assert/strict";
import { ChildProcess, type SpawnOptions } from "node:child_process";
import { describe, it, mock } from "node:test";
import { openBrowser } from "./browser-opener.js";

const url = "https://example.test/oauth/authorize?state=one&scope=two";

function mockLaunch() {
  const child = new ChildProcess();
  const unref = mock.method(child, "unref", () => {});
  const launch = mock.fn(
    (_file: string, _args: string[], _options: SpawnOptions) => child,
  );
  return { child, launch, unref };
}

describe("openBrowser", () => {
  it("passes drive-qualified Windows system paths and a separate URL argument", () => {
    const { launch, unref } = mockLaunch();
    openBrowser(url, {
      platform: "win32",
      systemRoot: "D:\\Windows",
      launch,
    });

    assert.deepEqual(
      launch.mock.calls.map((call) => call.arguments),
      [
        [
          "D:\\Windows\\System32\\rundll32.exe",
          ["D:\\Windows\\System32\\url.dll,FileProtocolHandler", url],
          { cwd: "D:\\Windows\\System32", detached: true, stdio: "ignore" },
        ],
      ],
    );
    assert.equal(unref.mock.callCount(), 1);
  });

  it("skips Windows launch when the system root is empty or not drive-qualified", () => {
    const { launch } = mockLaunch();
    for (const systemRoot of [
      "",
      "Windows",
      "C:Windows",
      "\\Windows",
      "\\\\server\\share",
    ]) {
      openBrowser(url, { platform: "win32", systemRoot, launch });
    }
    assert.equal(launch.mock.callCount(), 0);
  });

  for (const [platform, file] of [
    ["darwin", "/usr/bin/open"],
    ["linux", "/usr/bin/xdg-open"],
  ] as const) {
    it(`uses the system opener on ${platform}`, () => {
      const { launch } = mockLaunch();
      openBrowser(url, { platform, launch });
      assert.deepEqual(
        launch.mock.calls.map((call) => call.arguments),
        [[file, [url], { cwd: undefined, detached: true, stdio: "ignore" }]],
      );
    });
  }

  it("lets the caller continue when launching throws or emits an error", () => {
    const { child, launch } = mockLaunch();
    const error = new Error("opener unavailable");
    openBrowser(url, {
      platform: "linux",
      launch() {
        throw error;
      },
    });
    openBrowser(url, { platform: "linux", launch });
    assert.doesNotThrow(() => child.emit("error", error));
  });
});
