// The support planner (generator/sets/bridge.ts planSupports, docs/models/bridges.md):
// a bridge's piers, bents and towers keep off ground the game says is taken, keep
// the player's pylons and stay out of the player's blocked spans.

import { describe, expect, it } from "vitest";
import * as bridge from "../generator/sets/bridge";

const straight = (length: number, y = 20) => bridge.pathFromPoints([{ x: 0, y, z: 0 }, { x: length, y, z: 0 }], 9, 0, 0.67, 9.9)!;
// ground taken along x in [from, to] (a track crossing under the bridge)
const takenBetween = (from: number, to: number): bridge.GroundBlockedFn => (f) => {
  // the footprint's half extent along world x: its local x (w) turned by yaw, its local z (d) likewise
  const half = (Math.abs(Math.cos(f.yaw)) * f.w + Math.abs(Math.sin(f.yaw)) * f.d) / 2;
  return f.x + half > from && f.x - half < to;
};
const overlaps = (type: string, g: bridge.BridgePathGeom, d: number, from: number, to: number): boolean => {
  const f = bridge.supportFootprint(type, g, d);
  return takenBetween(from, to)(f);
};
const groundStations = (boxes: bridge.BridgeBox[], length: number): number[] =>
  [...new Set(boxes.filter((b) => b.shape === "box" && b.ground && b.center.x > 2 && b.center.x < length - 2).map((b) => (b.shape === "box" ? Math.round(b.center.x) : 0)))].sort((a, b) => a - b);

describe("bridge support planning", () => {
  it("is the default layout when nothing is in the way", () => {
    for (const type of Object.keys(bridge.TYPE_META)) {
      const g = straight(240);
      const free = bridge.buildBridge(type, g, () => 0, undefined, { groundBlocked: () => false });
      expect(free, type).toEqual(bridge.buildBridge(type, g, () => 0));
    }
  });

  it("keeps every support off a track running under the bridge", () => {
    // the screenshot's case: a trestle over a valley with a line at its foot
    for (const type of Object.keys(bridge.TYPE_META)) {
      for (const [length, from, to] of [[96, 46, 52], [240, 118, 124], [240, 60, 64]] as const) {
        const g = straight(length);
        const options = { groundBlocked: takenBetween(from, to) };
        const plan = bridge.planSupports(type, g, options);
        for (const d of plan.supports) {
          if (d < 0.05 || d > length - 0.05) continue;
          expect(overlaps(type, g, d, from, to), `${type} ${length} support at ${d}`).toBe(false);
        }
        expect(plan.blocked, type).toEqual([]);
        // and the drawn feet agree with the plan: no ground box on the track
        for (const b of bridge.buildBridge(type, g, () => 0, undefined, options)) {
          if (b.shape !== "box" || !b.ground || b.center.x < 2 || b.center.x > length - 2) continue;
          expect(b.center.x > to + 0.4 || b.center.x < from - 0.4, `${type} ${length} foot at ${b.center.x}`).toBe(true);
        }
      }
    }
  });

  it("drops a support that has nowhere to go and spans over the obstacle", () => {
    // a 14-stud road under a trestle (bents 8 apart): the bents round it are dropped
    // and one longer opening spans it
    const g = straight(96);
    const plan = bridge.planSupports("timber_trestle", g, { groundBlocked: takenBetween(42, 54) });
    expect(plan.blocked).toEqual([]);
    expect(plan.supports.length).toBeLessThan(bridge.planSupports("timber_trestle", g).supports.length);
    const gaps = plan.supports.slice(1).map((d, i) => d - plan.supports[i]!);
    expect(Math.max(...gaps)).toBeGreaterThan(12);
    // a 40-stud town under a plate girder bridge: one support each side, none inside
    const girder = bridge.planSupports("plate_girder", straight(120), { groundBlocked: takenBetween(40, 80) });
    expect(girder.blocked).toEqual([]);
    expect(girder.supports.filter((d) => d > 38 && d < 82)).toEqual([]);
  });

  it("keeps a support on blocked ground rather than stretch a span past the hard cap", () => {
    // stone arches span 28 at most: a 200-stud stretch of taken ground cannot be cleared
    const g = straight(240);
    const plan = bridge.planSupports("stone_arch", g, { groundBlocked: takenBetween(20, 220) });
    for (const r of plan.spans) expect(r.toDistance - r.fromDistance).toBeLessThanOrEqual(28 * 1.5 + 1e-9);
    expect(plan.blocked.length).toBeGreaterThan(0);
  });

  it("keeps the player's pylons, even on taken ground, and plans the rest around them", () => {
    const g = straight(200);
    for (const type of ["beam", "truss", "timber_trestle", "box_girder", "cantilever"]) {
      const plan = bridge.planSupports(type, g, { pylons: [73], groundBlocked: takenBetween(70, 76) });
      expect(plan.supports, type).toContain(73);
      expect(plan.blocked, type).toEqual([]);
      const feet = groundStations(bridge.buildBridge(type, g, () => 0, undefined, plan), 200);
      expect(feet.some((x) => Math.abs(x - 73) <= 1), `${type} draws a pier at the pylon`).toBe(true);
    }
  });

  it("stands no support in a blocked span", () => {
    const g = straight(200);
    for (const type of Object.keys(bridge.TYPE_META)) {
      const plan = bridge.planSupports(type, g, { blockedSpans: [{ from: 90, to: 110 }] });
      const size = bridge.supportFootprint(type, g, 100).d;
      for (const d of plan.supports) expect(d + size / 2 <= 90 + 1e-9 || d - size / 2 >= 110 - 1e-9, `${type} support at ${d}`).toBe(true);
    }
  });

  it("makes a cable type's pylons its towers and fits the cables to them", () => {
    const g = straight(300);
    for (const type of ["suspension", "cable_stayed", "cable_stayed_y"]) {
      const plan = bridge.planSupports(type, g, { pylons: [90, 230] });
      expect(plan.towers).toEqual([90, 230]);
      const members = bridge.overheadMembers(type, 300, 9, 9.9, plan).map((m) => m.t * 300);
      expect(members).toEqual([expect.closeTo(90, 6), expect.closeTo(230, 6)]);
      const feet = groundStations(bridge.buildBridge(type, g, () => 0, undefined, plan), 300).filter((x) => x > 6 && x < 294);
      expect(feet).toEqual([90, 230]);
    }
  });

  it("slides a cable tower off taken ground but never drops it", () => {
    const g = straight(300);
    const base = bridge.planSupports("suspension", g);
    const t = base.towers[0]!;
    const plan = bridge.planSupports("suspension", g, { groundBlocked: takenBetween(t - 3, t + 3) });
    expect(plan.towers).toHaveLength(base.towers.length);
    expect(Math.abs(plan.towers[0]! - t)).toBeGreaterThan(3);
  });

  it("moves the overhead members with the planned spans", () => {
    const g = straight(240);
    const plan = bridge.planSupports("truss", g, { pylons: [80] });
    const ends = plan.spans.map((r) => r.toDistance);
    expect(ends).toContain(80);
    const members = bridge.overheadMembers("truss", 240, 9, 9.9, plan).map((m) => m.t * 240);
    // portals of every span stand at its ends, so a member sits just inside each boundary
    expect(members.some((d) => d > 80 - 12 && d < 80)).toBe(true);
    expect(members.some((d) => d > 80 && d < 80 + 12)).toBe(true);
  });

  it("draws a trestle's low ties across no opening over blocked ground", () => {
    // ties: timber struts from one bent to the next (their ends at different stations)
    const ties = (boxes: bridge.BridgeBox[]) => boxes.filter((b): b is Extract<bridge.BridgeBox, { shape: "strut" }> =>
      b.shape === "strut" && b.material === "timber" && Math.abs(b.a.x - b.b.x) > 1);
    const crossing = (boxes: bridge.BridgeBox[], from: number, to: number) =>
      ties(boxes).filter((t) => Math.min(t.a.x, t.b.x) < to && Math.max(t.a.x, t.b.x) > from);
    const g = straight(96, 30);
    // a track the bents were moved off (automatic) ...
    expect(crossing(bridge.buildBridge("timber_trestle", g, () => 0), 46, 52).length).toBeGreaterThan(0);
    const moved = bridge.buildBridge("timber_trestle", g, () => 0, undefined, { groundBlocked: takenBetween(46, 52) });
    expect(crossing(moved, 46, 52)).toEqual([]);
    // ... a narrow lane between two bents that never had to move ...
    const plan = bridge.planSupports("timber_trestle", g, { groundBlocked: takenBetween(43.5, 44.5) });
    expect(plan.supports).toEqual(bridge.planSupports("timber_trestle", g).supports);
    expect(plan.openings).toEqual([{ fromDistance: 40, toDistance: 48 }]);
    expect(crossing(bridge.buildBridge("timber_trestle", g, () => 0, undefined, plan), 43.5, 44.5)).toEqual([]);
    // ... and the player's blocked span (manual)
    const manual = bridge.buildBridge("timber_trestle", g, () => 0, undefined, { blockedSpans: [{ from: 20, to: 36 }] });
    expect(crossing(manual, 20, 36)).toEqual([]);
    // the ties elsewhere stay
    expect(ties(moved).length).toBeGreaterThan(4);
  });

  it("is deterministic", () => {
    const g = straight(333);
    const options = { pylons: [100.25], blockedSpans: [{ from: 200, to: 215 }], groundBlocked: takenBetween(40, 47) };
    for (const type of Object.keys(bridge.TYPE_META)) expect(bridge.planSupports(type, g, options)).toEqual(bridge.planSupports(type, g, options));
  });
});
