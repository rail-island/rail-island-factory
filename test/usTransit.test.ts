// The North American passenger cars, urban rail and freight cars
// (generator/usTransit.ts, usFreight.ts). See docs/models/us-transit.md and us-freight.md.
import { describe, expect, it } from "vitest";
import { CTA_LENGTH, R160_LENGTH, RDC_LENGTH, US_TRANSIT, ZEPHYR_LENGTH, pioneerZephyr, zephyrTrain } from "../generator/usTransit";
import { BOXCAR_LENGTH, CABLE_CAR_LENGTH, CABOOSE_LENGTH, US_FREIGHT, WELL_LENGTH, wellCar } from "../generator/usFreight";
import { LOADING_GAUGES, loadingGaugeOf } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { coverageCombinations } from "../generator/design";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";

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
const ALL = [...US_TRANSIT, ...US_FREIGHT];

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
        expect(s.triangles).toBeLessThanOrEqual(25000);
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

  it("stacks the well car's containers to the double-stack gauge, single by default", () => {
    expect(US_FREIGHT.find((d) => d.id === "proc-vehicle-us-well-car")!.params![0]!.default).toBe("single");
    const h = (cargo: string) => glbStats(wellCar({ cargo }).toGlb("w")).max[1];
    expect(h("single")).toBeLessThanOrEqual(LOADING_GAUGES.us.height);
    expect(h("double")).toBeGreaterThan(LOADING_GAUGES.us.height);
    expect(h("double")).toBeLessThanOrEqual(LOADING_GAUGES.usDoubleStack.height);
  });
});
