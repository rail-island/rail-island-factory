// Runs before every test file (vite.config.ts, test.setupFiles).
//
// Most tests here are synchronous and CPU-bound (building, rendering and
// comparing models). Vitest reports progress to the main process over an RPC
// whose replies are read only when the event loop turns, and a chain of
// synchronous tests never turns it: after 60 s without a reply the worker
// throws "Timeout calling onTaskUpdate" and the run fails, every test green.
// Yielding one macrotask after each test lets the replies in, so only a single
// test (with its hooks) longer than that could still trip it.
//
// `toEqual` walks a typed array element by element through its generic
// equality: comparing two GLBs of a few hundred kilobytes takes seconds. Equal
// bytes are decided here in one native comparison instead; arrays that differ
// still fall through to the generic walk, so a failure reports the same diff.

import { afterEach, expect } from "vitest";

afterEach(() => new Promise<void>((resolve) => setImmediate(resolve)));

const bytesOf = (v: ArrayBufferView) => Buffer.from(v.buffer, v.byteOffset, v.byteLength);
expect.addEqualityTesters([
  function sameBytes(a: unknown, b: unknown) {
    if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b) || a.constructor !== b.constructor || a.byteLength !== b.byteLength) return undefined;
    return bytesOf(a).equals(bytesOf(b)) ? true : undefined;
  },
]);
