// The steam locomotives and tenders on a curve, as the game places them
// (test/railCurve.ts): every long wheelbase is split into turning units
// (steamLoco.ts turningUnits) so that every wheel stays on the rails, and the
// US pilots meet the frames behind them. See docs/models/steam-locomotives.md,
// "On curves".

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES } from "../generator/generate";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { US_STEAM } from "../generator/usSteam";
import { wheelOffsets } from "./railCurve";

/** A tight curve of the game, studs (its default radius is 80, its minimum 10). */
const RADIUS = 40;
/** The most a wheelset may stand off the track centre line there, studs (the gauge is about 2.15). */
const ON_RAILS = 0.35;

// The steam locomotives, tenders and railcars the game places as trains; a steam tram
// rides the tram track (worldTramsWorld.ts) and is not one of them.
const STEAM = ALL_VEHICLES.filter((d) => d.catalog?.traction === "steam" && d.catalog.group !== "tram");
const BUILDS = STEAM.flatMap((d) => {
  const unit = d.params?.find((p) => p.name === "unit");
  return (unit ? unit.values.map((v) => v.value) : [undefined]).map((u) => ({ label: u ? `${d.id} ${u}` : d.id, d, params: (u ? { unit: u } : {}) as Record<string, string> }));
});

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

describe("steam on a curve", () => {
  it("covers every steam design", () => {
    expect(STEAM.length).toBeGreaterThan(30);
    expect(STEAM.map((d) => d.id)).toContain("proc-vehicle-up-big-boy");
  });

  it.each(BUILDS.map((b) => [b.label, b] as const))("%s keeps every wheel on the rails", (_, { d, params }) => {
    const m = d.build(params);
    const offsets = wheelOffsets(m, RADIUS);
    for (const o of offsets) expect(Math.abs(o.offset), `axle at x ${o.x} (${o.node ?? "body"})`).toBeLessThan(ON_RAILS);
    // a split running gear leaves no wheel on the body: it rests on its outermost units
    const supports = m.rig!.supports!;
    if (supports.some((s) => s.node)) expect(offsets.every((o) => o.node)).toBe(true);
  });

  it("rides the Big Boy's rear drivers on their own bogie (they stood two studs off the rails)", () => {
    const offsets = wheelOffsets(US_STEAM[0]!.build(), RADIUS);
    const rear = offsets.filter((o) => o.x < -1 && o.x > -8);
    expect(rear).toHaveLength(4);
    expect(new Set(rear.map((o) => o.node)).size).toBe(1);
    expect(rear[0]!.node).not.toBeNull();
  });

  it.each(US_STEAM.map((d) => [d.id, d] as const))("%s: the front pilot reaches the frames, with no gap between them", (_, d) => {
    const all = leaves(d.build().sourceTree("x", "x").root);
    const pilot = all.filter((n) => n.id.includes("front-pilot/") && !n.id.includes("coupler"));
    const frames = all.filter((n) => /(^|\/)frames(-\d+)?\//.test(n.id));
    expect(pilot.length).toBeGreaterThan(0);
    expect(frames.length).toBeGreaterThan(0);
    // +x is forward: the pilot's back against the frames' front
    const back = Math.min(...pilot.map((n) => n.min![0]));
    const front = Math.max(...frames.map((n) => n.max![0]));
    expect(back - front).toBeLessThan(0.05);
  });
});
