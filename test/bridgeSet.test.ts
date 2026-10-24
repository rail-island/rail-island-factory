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

  it("keeps the concrete arch's rib under the deck at its crown", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 12, z: 0 }, { x: 60, y: 12, z: 0 }], 9, 0, 0.67, 9.9)!;
    const deckBottom = 12 + 0.67 - bridge.DECK_THICKNESS;
    const rib = bridge.buildBridge("arch", path, () => 0).filter((b) => b.shape === "ribbon" && b.part !== "deck" && b.material === "pier");
    expect(rib.length).toBeGreaterThan(0);
    for (const b of rib) {
      if (b.shape !== "ribbon") continue;
      const top = Math.max(...b.points.map((p) => p.y)) + Math.max(...b.profile.map((q) => q.v));
      expect(top).toBeLessThanOrEqual(deckBottom + 1e-6);
    }
  });

  it("closes a masonry arch's underside between its two faces", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: 24, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
    for (const type of ["stone_arch", "brick_arch"]) {
      const vault = bridge.buildBridge(type, path, () => 0).filter((b) => b.shape === "wall" && b.u0 < -2 && b.u1 > 2);
      expect(vault.length, type).toBe(1);
    }
  });

  it("stands a wide deck on twin columns and a tall pier on a footing", () => {
    const columnsAt = (deckWidth: number): number => {
      const path = bridge.pathFromPoints([{ x: 0, y: 30, z: 0 }, { x: 50, y: 30, z: 0 }], deckWidth, 0, 0.67, 9.9)!;
      const boxes = bridge.buildBridge("beam", path, () => 0).filter((b) => b.shape === "box" && b.part === "support" && b.material === "pier");
      // the middle pier: its shafts are the tapering boxes there
      const mid = boxes.filter((b) => b.shape === "box" && Math.abs(b.center.x - 25) < 0.01);
      expect(mid.some((b) => b.shape === "box" && b.ground && b.size.y < 1), "footing").toBe(true);
      return mid.filter((b) => b.shape === "box" && b.topScale !== undefined).length;
    };
    expect(columnsAt(9)).toBe(1);
    expect(columnsAt(17)).toBe(2);
  });

  it("gives a masonry viaduct's intermediate piers cutwaters, and its abutments none", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 60, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const turned = bridge.buildBridge("stone_arch", path, () => 0).filter((b) => b.shape === "box" && Math.abs(b.yaw - Math.PI / 2 - Math.PI / 4) < 1e-6);
    const stations = [...new Set(turned.map((b) => (b.shape === "box" ? Math.round(b.center.x) : 0)))].sort((a, b) => a - b);
    expect(stations).toEqual([20, 40]);
  });
});
