// The bridge set's kit (generator/sets/bridge.ts, docs/models/sets.md): what the
// pins cannot say -- the curve sampler keeps its anchors and bounds its work, and
// every box standing on the terrain is tagged `ground`.

import { describe, expect, it } from "vitest";
import * as bridge from "../generator/sets/bridge";

describe("the bridge kit", () => {
  it("keeps mandatory curve anchors and bounds subdivision work", () => {
    const points = bridge.adaptiveCurvePoints((t) => ({ x: t * 100, y: 30 * Math.sin(t * Math.PI), z: 0 }), [0, 0.25, 0.75, 1]);
    expect(points.some((p) => p.x === 25)).toBe(true);
    expect(points.some((p) => p.x === 75)).toBe(true);
    expect(points.length).toBeLessThanOrEqual(260);
    expect(points[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("tags exactly the boxes that stand on the terrain", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 12, z: 0 }, { x: 120, y: 12, z: 0 }], 9, 0, 0.67, 9.9)!;
    const ground = (): number => -8;
    for (const type of Object.keys(bridge.TYPE_META)) {
      for (const box of bridge.buildBridge(type, path, ground)) {
        if (box.shape !== "box") continue;
        const onGround = Math.abs(box.center.y - box.size.y / 2 - ground()) < 1e-9;
        expect(box.ground === true, `${type} ${box.material} at ${box.center.x}`).toBe(onGround);
      }
    }
  });
});
