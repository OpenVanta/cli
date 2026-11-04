import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { Command } from "commander";
import {
  addPaginationOptions,
  paginationQuery,
  readBinaryFile,
} from "./helpers.js";

describe("pagination options", () => {
  it("rejects malformed page sizes instead of truncating or silently omitting them", () => {
    for (const value of [
      "no",
      "1abc",
      "1.5",
      "",
      " ",
      "Infinity",
      "9007199254740992",
    ]) {
      const command = addPaginationOptions(new Command());
      assert.throws(
        () => command.parse(["--page-size", value], { from: "user" }),
        /invalid --page-size: expected an integer/,
      );
    }
  });

  it("parses integers and preserves their values for API validation", () => {
    for (const value of ["1", "25", "0", "-1"]) {
      const command = addPaginationOptions(new Command());
      command.parse(["--page-size", value], { from: "user" });
      assert.deepEqual(paginationQuery(command.opts()), {
        pageSize: Number(value),
      });
    }
    assert.deepEqual(paginationQuery({}), {});
  });
});

describe("readBinaryFile", () => {
  let dir: string;
  let filePath: string;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "vanta-cli-test-"));
    filePath = join(dir, "questions.csv");
    await writeFile(filePath, "Question\nDo you encrypt data at rest?\n");
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns a File named after the path with the file's bytes", async () => {
    const file = await readBinaryFile(filePath);
    assert.ok(file instanceof File);
    assert.equal(file.name, "questions.csv");
    assert.equal(await file.text(), "Question\nDo you encrypt data at rest?\n");
  });

  it("serializes as a multipart file part with a non-empty filename", async () => {
    // An unnamed binary file can be sent with filename="", which the API treats
    // as a text field and rejects with "'file' is required".
    const form = new FormData();
    form.append("file", await readBinaryFile(filePath));
    const body = await new Response(form).text();
    assert.match(
      body,
      /Content-Disposition: form-data; name="file"; filename="questions\.csv"/,
    );
  });

  it("sets the content type from the file extension", async () => {
    // Without a type, text files go out as application/octet-stream and the
    // API rejects them with 422 "can't process this file type".
    const form = new FormData();
    form.append("file", await readBinaryFile(filePath));
    const body = await new Response(form).text();
    assert.match(body, /Content-Type: text\/csv/);
  });

  it("matches extensions case-insensitively and falls back for unknown ones", async () => {
    const upper = join(dir, "REPORT.PDF");
    const unknown = join(dir, "notes.xyz");
    await writeFile(upper, "%PDF-1.4");
    await writeFile(unknown, "data");
    assert.equal((await readBinaryFile(upper)).type, "application/pdf");
    assert.equal((await readBinaryFile(unknown)).type, "");
  });

  it("rejects when the file does not exist", async () => {
    await assert.rejects(readBinaryFile(join(dir, "missing.csv")), {
      code: "ENOENT",
    });
  });
});
