// The British diesels' own cab fronts (generator/ukLocos.ts FRONTS): the Class 55
// Deltic's short sloping nose and raked windscreen, the Class 37's long square
// bonnet, both with headcode boxes, and the Class 47's raked end with the headcode
// panel over its windscreen; the cab door and side window stay on the side wall.
// See docs/models/uk-trains.md.
import { describe, expect, it } from "vitest";
import { ukLocoSpec } from "../generator/ukLocos";
import { lerpTable } from "../generator/czElectricKit";
import type { LocoSpec } from "../generator/boxLocoKit";

const roofOf = (s: LocoSpec) => s.hw[s.hw.length - 1]![0];
/** How far the end's centre line at height y stands back from the buffer beam. */
const back = (s: LocoSpec, y: number) => s.beam - lerpTable(s.tip, y);
const wallAt = (s: LocoSpec, y: number) => {
  const plan = s.endPlan(y, lerpTable(s.hw, y));
  return lerpTable(s.tip, y) - plan[plan.length - 1]![1];
};

describe("British diesel cab fronts", () => {
  const c55 = ukLocoSpec("c55"), c37 = ukLocoSpec("c37"), c47 = ukLocoSpec("c47");

  it("gives the Class 37 a longer bonnet than the Deltic, and the Deltic the more raked windscreen", () => {
    const cab = (s: LocoSpec) => back(s, 3.1);
    expect(cab(c37)).toBeGreaterThan(cab(c55) + 0.4);
    const rake = (s: LocoSpec) => back(s, roofOf(s) - 0.2) - back(s, 3.0);
    expect(rake(c55)).toBeGreaterThan(0.25);
    expect(rake(c37)).toBeLessThan(0.15);
  });

  it("slopes the Deltic's bonnet down to the front and keeps the Class 37's flat", () => {
    // the Deltic's top falls across the bonnet; the 37's stays at one height to the rounded edge
    expect(lerpTable(c55.tip, 2.8)).toBeLessThan(c55.beam - 0.5);
    expect(lerpTable(c55.tip, 2.8)).toBeGreaterThan(c55.beam - 1.4);
    expect(back(c37, 2.79)).toBeLessThan(0.25);
    expect(back(c37, 2.82)).toBeGreaterThan(2.0);
  });

  it("puts a headcode box on each bonnet at both ends, and the panel over the Class 47's windscreens", () => {
    for (const s of [c55, c37]) {
      const boxes = s.roofItems.filter((r) => r.name.startsWith("headcode box"));
      expect(boxes.map((r) => Math.sign(r.x[0])).sort()).toEqual([-1, 1]);
    }
    expect(c47.endItems.some((i) => i.name === "headcode panel")).toBe(true);
    expect(c47.endItems.some((i) => i.name === "top headlight")).toBe(false);
  });

  it("keeps the cab door and side window on the side wall in every livery", () => {
    for (const [k, liveries] of [["c55", ["twoToneGreen", "brBlue"]], ["c37", ["green", "brBlue", "railfreight"]], ["c47", ["twoToneGreen", "brBlue", "intercity"]]] as const)
      for (const livery of liveries) {
        const s = ukLocoSpec(k, { livery });
        for (const it of s.sideItems.filter((i) => i.name === "cab door" || i.name === "cab window"))
          for (const y of [it.y[0], (it.y[0] + it.y[1]) / 2, it.y[1]]) expect(it.x[1], `${k} ${livery} ${it.name}`).toBeLessThanOrEqual(wallAt(s, y) - 0.12 + 1e-9);
      }
  });
});
