// The British power cars on the series kit (generator/ukUnits.ts): the InterCity
// 225's Class 91, the InterCity 125's Class 43 and the Eurostar's are locomotives - bogies under
// the middle of the body, plain sides, the yellow panel on the nose, no gangway
// frame at the nose; only the IC225's leading car raises a pantograph. See
// docs/models/uk-trains.md.
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { E300, HST, IC225 } from "../generator/ukUnits";
import { shinkansenTrain, type ShinkansenSeries } from "../generator/shinkansen";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";

const tris = (id: string, v: Record<string, string> = {}) => {
  const { json, bin } = parseGlb(DESIGNS.get(id)!.build(v).toGlb(id));
  return collectTriangles(json, bin);
};

// [design, spec, bogie centres, the nose tip's x on the lone end car]
const CASES: Array<[string, ShinkansenSeries, number, number]> = [
  ["proc-vehicle-br-ic225", IC225, 10.5, IC225.endLength / 2 - 0.65],
  ["proc-vehicle-br-hst", HST, 10.29, HST.endLength / 2],
  ["proc-vehicle-eurostar-373", E300, 14.0, E300.endLength / 2],
];
// the designs whose nose carries the yellow warning panel
const PANEL = new Set(["proc-vehicle-br-ic225", "proc-vehicle-br-hst"]);

describe("the British power cars", () => {
  for (const [id, s, centres, tip] of CASES) {
    it(`${id}: stands on bogies ${centres} m apart under its middle, the leading wheelset well behind the nose`, () => {
      const xs = DESIGNS.get(id)!.build({}).rig!.supports!.map((p) => p.x).sort((a, b) => b - a);
      expect(xs).toHaveLength(2);
      expect(xs[0]! - xs[1]!).toBeCloseTo(centres, 2);
      expect(Math.abs(xs[0]! + xs[1]!)).toBeLessThan(0.5);
      expect(tip - (xs[0]! + s.wheelbase / 2)).toBeGreaterThan(2.0);
    });

    it(`${id}: has no gangway frame on its nose, only at its inner end`, () => {
      const d = tris(id).filter((t) => t.material === "diaphragm");
      expect(d.length).toBeGreaterThan(0);
      for (const t of d) for (const p of t.p) expect(p[0]).toBeLessThan(0);
    });

    if (PANEL.has(id)) it(`${id}: paints the yellow warning panel on the nose only`, () => {
      const y = tris(id).filter((t) => t.material === "cabPanel");
      expect(y.length).toBeGreaterThan(0);
      for (const t of y) for (const p of t.p) expect(p[0]).toBeGreaterThan(tip - s.cabPanel!.d - 0.3);
    });

    it(`${id}: has locomotive sides, not a coach's row of windows`, () => {
      expect(s.endSides!.windows.length).toBeLessThanOrEqual(4);
      expect(s.endSides!.doors.length).toBeGreaterThanOrEqual(1);
      expect(s.endSides!.doors.length).toBeLessThanOrEqual(2);
    });
  }

  it("draws the Class 43's radiator grille on both sides", () => {
    const g = tris("proc-vehicle-br-hst").filter((t) => t.material === "black" && t.p.every((p) => p[1] > 2.0 && p[1] < 3.05));
    expect(g.some((t) => t.p.every((p) => p[2] > 1))).toBe(true);
    expect(g.some((t) => t.p.every((p) => p[2] < -1))).toBe(true);
  });

  it("draws the Class 43's twin lamp clusters and grille across the front of its rounded nose", () => {
    const tip = HST.endLength / 2;
    const all = tris("proc-vehicle-br-hst");
    const lamps = all.filter((t) => t.material === "lampHead");
    // two lamps a side, side by side across the front just under the bonnet's edge
    for (const sd of [1, -1]) {
      const zs = lamps.filter((t) => sd * t.p[0]![2] > 0).map((t) => sd * (t.p[0]![2] + t.p[1]![2] + t.p[2]![2]) / 3);
      expect(Math.min(...zs)).toBeLessThan(0.55);
      expect(Math.max(...zs)).toBeGreaterThan(0.6);
    }
    for (const t of lamps) for (const p of t.p) {
      expect(p[0]).toBeGreaterThan(tip - 0.4);
      expect(p[1]).toBeGreaterThan(1.2);
      expect(p[1]).toBeLessThan(1.75);
    }
    const grille = all.filter((t) => t.material === "black" && t.p.every((p) => p[0] > tip - 0.3 && Math.abs(p[2]) < 0.35));
    expect(grille.length).toBeGreaterThan(0);
  });

  it("paints the original InterCity 125 power car's nose, cab roof and lower sides yellow, its coaches blue and grey", () => {
    const tip = HST.endLength / 2;
    const car = tris("proc-vehicle-br-hst", { livery: "blueGrey" }).filter((t) => t.material === "nose");
    // the cab roof behind the windscreen
    expect(car.some((t) => t.p.every((p) => p[1] > 3.4 && p[0] < tip - 2.8 && p[0] > tip - 4.1))).toBe(true);
    // the lower side at the car's inner end
    expect(car.some((t) => t.p.every((p) => p[0] < -tip + 2 && p[1] < 2.3 && Math.abs(p[2]) > 1.2))).toBe(true);
    expect(tris("proc-vehicle-br-hst", { livery: "blueGrey", unit: "middleCar" }).some((t) => t.material === "nose")).toBe(false);
  });

  it("carries the original power car's yellow back over the cab roof to a slanted edge, the blue forward beside the windscreen", () => {
    const tip = HST.endLength / 2;
    const yellow = tris("proc-vehicle-br-hst", { livery: "blueGrey" }).filter((t) => t.material === "nose");
    const cx = (t: { p: number[][] }) => (t.p[0]![0]! + t.p[1]![0]! + t.p[2]![0]!) / 3;
    const cy = (t: { p: number[][] }) => (t.p[0]![1]! + t.p[1]![1]! + t.p[2]![1]!) / 3;
    // on the side above the yellow line the edge runs back as it rises: the yellow reaches
    // further back at the shoulder than just above the line, and furthest on the crown
    const reach = (lo: number, hi: number) => tip - Math.min(...yellow.filter((t) => cy(t) > lo && cy(t) < hi).map(cx));
    const low = reach(2.35, 2.5), shoulder = reach(2.95, 3.1), crown = reach(3.8, 4.0);
    expect(low).toBeLessThan(shoulder - 0.6);
    expect(shoulder).toBeLessThan(crown - 0.3);
    expect(crown).toBeLessThan(5.5);
  });

  it("letters the original power car's sides with the double arrow and its name in white", () => {
    const tip = HST.endLength / 2;
    const white = tris("proc-vehicle-br-hst", { livery: "blueGrey" }).filter((t) => t.material === "markWhite");
    for (const sd of [1, -1]) {
      const side = white.filter((t) => t.p.every((p) => sd * p[2]! > 1.2));
      expect(side.length).toBeGreaterThan(100);
      // on the blue band, behind the cab door
      for (const t of side) for (const p of t.p) {
        expect(p[1]).toBeGreaterThan(2.3);
        expect(p[1]).toBeLessThan(3.1);
        expect(p[0]).toBeLessThan(tip - 6.0);
      }
    }
    expect(tris("proc-vehicle-br-hst").some((t) => t.material === "markWhite")).toBe(false);
  });

  it("raises the Eurostar's pantograph on the trailing power car only, none on the trailers", () => {
    for (const n of E300.cars!) {
      const t = shinkansenTrain(E300, n);
      expect(t.map((x) => x.pantograph)).toEqual(t.map((_, k) => k === n - 1));
    }
  });

  it("raises a pantograph on the IC225's leading Class 91 only, not on the driving van trailer", () => {
    for (const n of IC225.cars!) {
      const t = shinkansenTrain(IC225, n);
      expect(t.map((x) => x.pantograph)).toEqual(t.map((_, k) => k === 0));
    }
  });
});
