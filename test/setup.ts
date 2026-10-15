// Runs before every test file (vite.config.ts, test.setupFiles).
//
// Most tests here are synchronous and CPU-bound (building, rendering and
// comparing models). Vitest reports progress to the main process over an RPC
// whose replies are read only when the event loop turns, and a chain of
// synchronous tests never turns it: after 60 s without a reply the worker
// throws "Timeout calling onTaskUpdate" and the run fails, every test green.
// Yielding one macrotask after each test lets the replies in, so only a single
// test (with its hooks) longer than that could still trip it.

import { afterEach } from "vitest";

afterEach(() => new Promise<void>((resolve) => setImmediate(resolve)));
