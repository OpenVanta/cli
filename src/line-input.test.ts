import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { describe, it } from "node:test";
import { InputClosedError, LineInput } from "./line-input.js";

function streams() {
  const input = new PassThrough();
  const output = new PassThrough();
  let printed = "";
  output.on("data", (d) => (printed += d));
  return { input, output, printed: () => printed };
}

describe("LineInput", () => {
  it("answers every prompt when all input is piped in at once", async () => {
    const s = streams();
    const li = new LineInput(s.input, s.output);
    s.input.write("one\ntwo\nthree\n");
    assert.equal(await li.question("A: "), "one");
    assert.equal(await li.question("B: "), "two");
    assert.equal(await li.question("C: "), "three");
    assert.match(s.printed(), /A: .*B: .*C: /s);
    li.close();
  });

  it("waits for a line typed after the prompt", async () => {
    const s = streams();
    const li = new LineInput(s.input, s.output);
    const answer = li.question("A: ");
    setTimeout(() => s.input.write("later\n"), 10);
    assert.equal(await answer, "later");
    li.close();
  });

  it("rejects pending and later questions at end of input", async () => {
    const s = streams();
    const li = new LineInput(s.input, s.output);
    s.input.end("only\n");
    assert.equal(await li.question("A: "), "only");
    await assert.rejects(li.question("B: "), InputClosedError);
    await assert.rejects(li.nextLine(), InputClosedError);
  });
});
