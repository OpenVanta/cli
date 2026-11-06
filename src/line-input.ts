/**
 * One line reader shared by every prompt in a command.
 *
 * A readline interface per prompt loses input: the first one buffers every
 * line already piped in, then closes and drops what the later prompts needed.
 * And when stdin ends, a pending question never settles, so the process exits
 * 0 having done nothing. This keeps one interface, queues lines, and reports
 * end of input instead.
 */
import { createInterface, type Interface } from "node:readline";

export class InputClosedError extends Error {
  constructor() {
    super("no more input");
    this.name = "InputClosedError";
  }
}

export class LineInput {
  private readonly rl: Interface;
  private readonly queued: string[] = [];
  private readonly waiters: {
    resolve: (line: string) => void;
    reject: (err: Error) => void;
  }[] = [];
  private ended = false;

  constructor(
    input: NodeJS.ReadableStream = process.stdin,
    output: NodeJS.WritableStream = process.stdout,
  ) {
    const terminal = Boolean((input as { isTTY?: boolean }).isTTY);
    this.rl = createInterface({ input, output, terminal });
    this.rl.on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(line);
      else this.queued.push(line);
    });
    this.rl.on("close", () => {
      this.ended = true;
      for (const waiter of this.waiters.splice(0)) {
        waiter.reject(new InputClosedError());
      }
    });
    // In terminal mode readline swallows Ctrl-C; keep its usual meaning.
    this.rl.on("SIGINT", () => {
      this.rl.close();
      process.kill(process.pid, "SIGINT");
    });
  }

  /** Shows `prompt` and resolves with the next line; rejects at end of input. */
  question(prompt: string): Promise<string> {
    this.rl.setPrompt(prompt);
    this.rl.prompt();
    return this.nextLine();
  }

  /** Resolves with the next line without printing a prompt. */
  nextLine(): Promise<string> {
    const line = this.queued.shift();
    if (line !== undefined) return Promise.resolve(line);
    if (this.ended) return Promise.reject(new InputClosedError());
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  close(): void {
    this.rl.close();
  }
}
