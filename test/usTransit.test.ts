// The North American passenger cars, urban rail and freight cars
// (generator/usTransit.ts, usFreight.ts). See docs/models/us-transit.md and us-freight.md.
import { describe, expect, it } from "vitest";
import { CTA_LENGTH, R160_LENGTH, RDC_LENGTH, US_TRANSIT } from "../generator/usTransit";
import { PIONEER_ZEPHYR, ZEPHYR_LENGTH, pioneerZephyr, zephyrTrain } from "../generator/pioneerZephyr";
import { BOXCAR_LENGTH, CABLE_CAR_LENGTH, CABOOSE_LENGTH, US_FREIGHT, WELL_LENGTH, wellCar } from "../generator/usFreight";
import { LOADING_GAUGES, loadingGaugeOf } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { coverageCombinations } from "../generator/design";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { designGlb } from "../generator/generate";
import { readTriangles } from "../generator/renderGlbThumb";

const LENGTH: Record<string, number> = {
  "proc-vehicle-budd-rdc": RDC_LENGTH,
  "proc-vehicle-pioneer-zephyr": ZEPHYR_LENGTH.powerCar,
  "proc-vehicle-nyc-r160": R160_LENGTH,
  "proc-vehicle-cta-5000": CTA_LENGTH,
  "proc-vehicle-us-caboose": CABOOSE_LENGTH,
  "proc-vehicle-us-boxcar": BOXCAR_LENGTH,
  "proc-vehicle-us-well-car": WELL_LENGTH,
  "proc-vehicle-sf-cable-car": CABLE_CAR_LENGTH,
};
const ALL = [US_TRANSIT[0]!, PIONEER_ZEPHYR, ...US_TRANSIT.slice(1), ...US_FREIGHT];

describe("the US passenger cars, urban rail and freight cars", () => {
  it("are eight designs with their catalog groups and references", () => {
    expect(ALL.map((d) => d.id)).toEqual(Object.keys(LENGTH));
    const group = Object.fromEntries(ALL.map((d) => [d.id, d.catalog?.group]));
    expect(group).toMatchObject({ "proc-vehicle-budd-rdc": "unit", "proc-vehicle-nyc-r160": "metro", "proc-vehicle-cta-5000": "metro", "proc-vehicle-us-boxcar": "wagon", "proc-vehicle-sf-cable-car": "tram" });
    for (const d of ALL) {
      expect(d.references).toBe(d.id.replace("proc-vehicle-", ""));
      for (const p of d.params ?? []) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
    }
  });

  for (const d of ALL)
    it(`${d.id}: every combination inside its gauge and the budget, without z-fighting, on two supports`, () => {
      const g = loadingGaugeOf(d);
      for (const v of coverageCombinations(d.params, d.finishParams)) {
        const m = d.build(v);
        const glb = m.toGlb(d.id);
        const s = glbStats(glb);
        // a car within the rail budget's cap; the Zephyr's three-car train adds its cars up
        expect(s.triangles).toBeLessThanOrEqual(v.unit === "train" ? 3 * 16000 : 25000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(g.width);
        expect(s.max[1]).toBeLessThanOrEqual(g.height);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        if (v.unit !== "train") {
          expect(s.max[0] - s.min[0], JSON.stringify(v)).toBeCloseTo(v.unit && d.id.includes("zephyr") ? ZEPHYR_LENGTH[v.unit as keyof typeof ZEPHYR_LENGTH] : LENGTH[d.id]!, 1);
          expect(m.rig!.supports).toHaveLength(2);
        }
        expect(buildLodModel(d, v).triangleCount()).toBeLessThanOrEqual(lodBudget(d));
      }
    });

  it("articulates the Zephyr's three cars on Jacobs bogies under their joints", () => {
    const m = pioneerZephyr({ unit: "train" });
    expect(m.rig!.sections).toHaveLength(3);
    // a truck at each end, a Jacobs bogie under each of the two joints
    expect(m.rig!.supports).toHaveLength(4);
    expect(m.rig!.supports!.filter((s) => s.sections.length === 2)).toHaveLength(2);
    const s = glbStats(m.toGlb("z"));
    expect(s.max[0] - s.min[0]).toBeCloseTo(zephyrTrain().reduce((t, c) => t + ZEPHYR_LENGTH[c.car], 0), 1);
  });

  it("gives each RDC cab end its door outline and a headlight housing with twin lamps", () => {
    for (const variant of ["rdc1", "rdc2"]) {
      const tris = readTriangles(designGlb("proc-vehicle-budd-rdc", { variant }));
      // the end walls: the cab glass farthest out at each end
      const glassX = tris.filter((t) => t.material === "cabGlass").flatMap((t) => t.p.map((p) => p[0]));
      for (const [e, face] of [[1, Math.max(...glassX)], [-1, -Math.min(...glassX)]] as const) {
        const out = (mat: string, beyond: number) => tris.filter((t) => t.material === mat && t.p.every((p) => e * p[0] > face + beyond));
        // the housing's black bezel stands out of the end over the door, under the dome
        const hood = out("black", 0.03).filter((t) => t.p.every((p) => p[1] > 3.0 && Math.abs(p[2]) < 0.35)).flatMap((t) => t.p);
        expect(hood.length, `${variant} ${e}`).toBeGreaterThan(0);
        expect(Math.min(...hood.map((p) => p[1]))).toBeGreaterThan(3.1);
        expect(Math.max(...hood.map((p) => p[1]))).toBeLessThan(3.6);
        // two headlights on its front, one each side of the middle
        const lamps = out("lampHead", 0.05).map((t) => (t.p[0][2] + t.p[1][2] + t.p[2][2]) / 3);
        expect(lamps.some((z) => z < -0.05) && lamps.some((z) => z > 0.05)).toBe(true);
        // the door's seams frame the middle pane down to the floor
        const seams = tris.filter((t) => t.material === "rubber" && t.p.every((p) => Math.abs(e * p[0] - face) < 0.01 && Math.abs(Math.abs(p[2]) - 0.43) < 0.02));
        const ys = seams.flatMap((t) => t.p.map((p) => p[1]));
        expect(Math.min(...ys)).toBeLessThan(1.4);
        expect(Math.max(...ys)).toBeGreaterThan(3.0);
      }
    }
  });

  it("lays out each RDC side by the photographs: the engineer's window at its right-hand end, eleven or eight saloon windows", () => {
    // the glass panes on side s between two heights, as their x spans
    const panes = (variant: string, s: number, y0: number, y1: number) => {
      const g = readTriangles(designGlb("proc-vehicle-budd-rdc", { variant })).filter((t) => t.material === "glass" && t.p.every((p) => s * p[2] > 1.3 && p[1] > y0 && p[1] < y1));
      const spans: Array<[number, number]> = [];
      for (const t of g) {
        const [a, b] = [Math.min(...t.p.map((p) => p[0])), Math.max(...t.p.map((p) => p[0]))];
        const hit = spans.find((q) => a < q[1] + 0.05 && b > q[0] - 0.05);
        if (hit) { hit[0] = Math.min(hit[0], a); hit[1] = Math.max(hit[1], b); } else spans.push([a, b]);
      }
      return spans.filter(([a, b]) => b - a > 0.1);
    };
    for (const s of [1, -1]) {
      // the engineer sits on the right at each end: his window (sill 2.3 m) on +Z at the +X end, on -Z at the -X end
      const cab = panes("rdc1", s, 2.32, 2.99).filter(([a, b]) => b - a < 0.8 && Math.abs(a + b) / 2 > 11);
      expect(cab.map(([a, b]) => Math.sign(a + b)), `side ${s}`).toEqual([s]);
      // eleven 1.4 m saloon windows a side on the RDC-1, eight behind the baggage room on the RDC-2
      for (const [variant, n] of [["rdc1", 11], ["rdc2", 8]] as const)
        expect(panes(variant, s, 2.09, 2.78).filter(([a, b]) => b - a > 1.3), `${variant} ${s}`).toHaveLength(n);
    }
  });

  it("lays out each R160 side by the photographs: four double doors, a window between each pair, the cab's side window on its right", () => {
    const tris = Object.fromEntries(["cabCar", "trailer"].map((unit) => [unit, readTriangles(designGlb("proc-vehicle-nyc-r160", { unit }))]));
    // spans of x of the glass on side s between two heights, merged where they touch
    const spans = (unit: string, mat: string, s: number, y0: number, y1: number) => {
      const out: Array<[number, number]> = [];
      for (const t of tris[unit]!.filter((t) => t.material === mat && t.p.every((p) => s * p[2] > 1.3 && p[1] > y0 && p[1] < y1))) {
        const [a, b] = [Math.min(...t.p.map((p) => p[0])), Math.max(...t.p.map((p) => p[0]))];
        const hit = out.find((q) => a < q[1] + 0.01 && b > q[0] - 0.01);
        if (hit) { hit[0] = Math.min(hit[0], a); hit[1] = Math.max(hit[1], b); } else out.push([a, b]);
      }
      return out.sort((p, q) => p[0] - q[0]);
    };
    for (const unit of ["cabCar", "trailer"])
      for (const s of [1, -1]) {
        // the three side windows, 1.25 m of glass, centred 4.68 m apart
        const wins = spans(unit, "glass", s, 2.05, 3.1).filter(([a, b]) => b - a > 1.0);
        expect(wins.map(([a, b]) => Math.round((a + b) * 50) / 100), `${unit} ${s}`).toEqual([-4.68, 0, 4.68]);
        // two narrow windows in each of the four doors' leaves
        expect(spans(unit, "glass", s, 2.05, 3.1).filter(([a, b]) => b - a < 0.4), `${unit} ${s}`).toHaveLength(8);
        // the cab car's side window on the cab's (right) side only, in the end panel before the first door
        const cabWin = spans(unit, "glass", s, 1.95, 2.95).filter(([a, b]) => b - a > 0.4 && b - a < 1.0);
        expect(cabWin.length, `${unit} ${s}`).toBe(unit === "cabCar" && s > 0 ? 1 : 0);
      }
  });

  it("gives the R160 cab car a black cab end with its lamps and route sign, and every other end a plain door without a diaphragm", () => {
    for (const unit of ["cabCar", "trailer"]) {
      const tris = readTriangles(designGlb("proc-vehicle-nyc-r160", { unit }));
      const face = Math.max(...tris.filter((t) => t.material === "ss").flatMap((t) => t.p.map((p) => p[0])));
      // on the end, inside the side walls
      const at = (mat: string, e: number) => tris.filter((t) => t.material === mat && t.p.every((p) => e * p[0] > face - 0.3 && Math.abs(p[2]) < 1.42));
      expect(tris.some((t) => t.material === "diaphragm")).toBe(false);
      for (const e of [1, -1]) {
        const cab = unit === "cabCar" && e > 0;
        // the head lamps either side of the door, low on the end
        const heads = at("lampHead", e).map((t) => t.p[0]);
        expect(heads.some((p) => p[2] > 0.5) && heads.some((p) => p[2] < -0.5), `${unit} ${e}`).toBe(cab);
        if (cab) expect(heads.every((p) => p[1] > 1.45 && p[1] < 1.75)).toBe(true);
        // the black fields and the route sign's red ring over the door
        expect(at("mask", e).length > 0, `${unit} ${e}`).toBe(cab);
        expect(at("routeRed", e).some((t) => t.p.every((p) => p[1] > 3.25)), `${unit} ${e}`).toBe(cab);
        // an inner end's barriers either side of its door
        const bars = at("barrier", e).flatMap((t) => t.p);
        expect(bars.some((p) => p[2] > 0.5) && bars.some((p) => p[2] < -0.5), `${unit} ${e}`).toBe(!cab);
      }
    }
  });

  it("stacks the well car's containers to the double-stack gauge, single by default", () => {
    expect(US_FREIGHT.find((d) => d.id === "proc-vehicle-us-well-car")!.params![0]!.default).toBe("single");
    const h = (cargo: string) => glbStats(wellCar({ cargo }).toGlb("w")).max[1];
    expect(h("single")).toBeLessThanOrEqual(LOADING_GAUGES.us.height);
    expect(h("double")).toBeGreaterThan(LOADING_GAUGES.us.height);
    expect(h("double")).toBeLessThanOrEqual(LOADING_GAUGES.usDoubleStack.height);
  });
});
