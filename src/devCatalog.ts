// `pnpm dev` only: measures the dev catalog's pending records (devMeasure.ts,
// lazily imported with three) one at a time and hands them back in batches, so
// the list fills in without a re-sort per model. `next` picks what to measure,
// skipping the ids it is given (measured but not handed back yet, or failed):
// the App asks for the open model first, then the rows in their listed order.

import { prepareRows, type Row } from "./catalogQuery";

/** How often the measured rows are handed back, milliseconds. */
const FLUSH_MS = 300;

export async function measurePending(next: (skip: ReadonlySet<string>) => Row | undefined, apply: (measured: ReadonlyMap<string, Row>) => void): Promise<void> {
  const { measureRecord } = await import("./devMeasure");
  const skip = new Set<string>();
  let batch = new Map<string, Row>();
  let flushed = performance.now();
  const flush = () => {
    if (batch.size) apply(batch);
    for (const id of batch.keys()) skip.delete(id);
    batch = new Map();
    flushed = performance.now();
  };
  for (let row = next(skip); row; row = next(skip)) {
    skip.add(row.id);
    try {
      batch.set(row.id, prepareRows([await measureRecord(row)])[0]!);
    } catch (e) {
      // the row stays pending (and skipped): its page shows the model's own error
      console.error(`${row.id}: could not be measured`, e);
    }
    if (performance.now() - flushed > FLUSH_MS) flush();
    // give the page a frame between builds
    await new Promise((r) => setTimeout(r, 0));
  }
  flush();
}
