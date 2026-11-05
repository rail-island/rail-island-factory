// Where an emitter must sit (docs/models/emitters.md): on the mouth of what it
// rises from -- geometry at its height within reach of it -- and never under
// geometry above it. Shared by test/emitters.test.ts and the catalog sweep.
import { expect } from "vitest";
import type { Emitter } from "../generator/meshCore";

export function expectEmittersOnMouths(emitters: readonly Emitter[], pos: ArrayLike<number>, label: string): void {
  for (const e of emitters) {
    const [x, y, z] = e.at;
    const reach = 2 * e.radius + 0.1;
    let rim = false;
    let over = false;
    for (let i = 0; i < pos.length; i += 3) {
      const h = Math.hypot(pos[i]! - x, pos[i + 2]! - z);
      if (h <= reach && Math.abs(pos[i + 1]! - y) < 0.1) rim = true;
      if (h < e.radius * 0.5 && pos[i + 1]! > y + 0.2) over = true;
    }
    const what = `${label} ${e.kind} at ${e.at.map((v) => v.toFixed(2))}`;
    expect(rim, `${what}: no mouth there`).toBe(true);
    expect(over, `${what}: covered by geometry`).toBe(false);
  }
}
