/**
 * Cross-compile standalone `vanta` binaries with Bun.
 *
 * Usage:
 *   VANTA_VERSION=0.1.0 tsx scripts/build-binaries.ts
 */
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const version = (process.env.VANTA_VERSION ?? "dev").replace(/^v/, "");
const outDir = join(process.cwd(), "dist", "binaries");

const targets = [
  { bun: "bun-linux-x64", os: "linux", arch: "amd64", ext: "" },
  { bun: "bun-linux-arm64", os: "linux", arch: "arm64", ext: "" },
  { bun: "bun-darwin-x64", os: "darwin", arch: "amd64", ext: "" },
  { bun: "bun-darwin-arm64", os: "darwin", arch: "arm64", ext: "" },
  { bun: "bun-windows-x64", os: "windows", arch: "amd64", ext: ".exe" },
  { bun: "bun-windows-arm64", os: "windows", arch: "arm64", ext: ".exe" },
] as const;

function run(cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with code ${result.status}`);
  }
}

async function main(): Promise<void> {
  const bunBin = process.env.BUN_BIN ?? "bun";
  const bunCheck = spawnSync(bunBin, ["--version"], { encoding: "utf8" });
  if (bunCheck.status !== 0) {
    throw new Error(
      "Bun is required to build standalone binaries. Install with `npm i -D bun` or https://bun.sh",
    );
  }

  await mkdir(outDir, { recursive: true });

  for (const target of targets) {
    const artifactBase = `vanta-${target.os}-${target.arch}`;
    const outfile = join(outDir, `${artifactBase}${target.ext}`);
    console.log(`Compiling ${target.os}/${target.arch}...`);
    run(bunBin, [
      "build",
      "--compile",
      `--target=${target.bun}`,
      "--define",
      `__VANTA_VERSION__=${JSON.stringify(version)}`,
      "--outfile",
      outfile,
      "src/cli.ts",
    ]);

    const archiveName =
      target.os === "windows"
        ? `vanta_${version}_${target.os}_${target.arch}.zip`
        : `vanta_${version}_${target.os}_${target.arch}.tar.gz`;
    const archivePath = join(outDir, archiveName);
    const workDir = join(outDir, `.stage-${target.os}-${target.arch}`);
    await mkdir(workDir, { recursive: true });

    await copyFile(
      outfile,
      join(workDir, target.os === "windows" ? "vanta.exe" : "vanta"),
    );
    if (target.os === "windows") {
      run("zip", ["-j", archivePath, join(workDir, "vanta.exe")]);
    } else {
      run("tar", ["-czf", archivePath, "-C", workDir, "vanta"]);
    }
    await rm(workDir, { recursive: true, force: true });
    console.log(`  -> ${archiveName} (+ ${artifactBase}${target.ext})`);
  }

  const entries = await readdir(outDir);
  const archives = entries
    .filter((f) => f.endsWith(".tar.gz") || f.endsWith(".zip"))
    .sort();
  const lines: string[] = [];
  for (const name of archives) {
    const data = await readFile(join(outDir, name));
    const hash = createHash("sha256").update(data).digest("hex");
    lines.push(`${hash}  ${name}`);
  }
  await writeFile(join(outDir, "checksums.txt"), `${lines.join("\n")}\n`);
  console.log(`Wrote checksums for ${archives.length} archives`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
