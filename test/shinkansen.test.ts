// The later Shinkansen series (generator/shinkansen.ts). See docs/models/shinkansen.md.
import { describe, expect, it } from "vitest";
import { SHINKANSEN_DESIGNS, SHINKANSEN_SERIES, shinkansenTrain } from "../generator/shinkansen";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";

describe("the later Shinkansen", () => {
  it("are seven series on the Shinkansen gauge, each an end car, a middle car and a train of 3 - 8", () => {
    expect(SHINKANSEN_DESIGNS.map((d) => d.id)).toEqual(Object.keys(SHINKANSEN_SERIES));
    for (const d of SHINKANSEN_DESIGNS) {
      expect(d.loadingGauge).toBe("shinkansen");
      expect(d.catalog).toMatchObject({ group: "unit", traction: "electric" });
      expect(d.params!.map((p) => p.name)).toEqual(["unit", "cars", "livery"]);
      expect(d.params![0]!.default).toBe("endCar");
      expect(d.params![2]!.values).toHaveLength(2);
      for (const p of d.params!) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
    }
  });

  for (const d of SHINKANSEN_DESIGNS) {
    const s = SHINKANSEN_SERIES[d.id]!;
    it(`${d.id}: the end and middle cars at their lengths, inside the gauge, in budget, without z-fighting`, () => {
      for (const [unit, len] of [["endCar", s.endLength], ["middleCar", s.midLength]] as const) {
        const m = d.build({ unit });
        const glb = m.toGlb(unit);
        const st = glbStats(glb);
        expect(st.max[0] - st.min[0]).toBeCloseTo(len, 1);
        expect(st.max[2] - st.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.shinkansen.width);
        expect(st.triangles).toBeLessThanOrEqual(16000);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        expect(m.rig!.supports).toHaveLength(2);
      }
      // the end car's body under the gauge's height; the middle car raises its pantograph to the wire
      expect(glbStats(d.build().toGlb("e")).max[1]).toBeLessThanOrEqual(LOADING_GAUGES.shinkansen.height);
      expect(glbStats(d.build({ unit: "middleCar" }).toGlb("m")).max[1]).toBeGreaterThan(5.8);
    });

    // the sampled trains' flicker, budget and distant models are the catalog sweep's (test/catalogSweep.ts)
    it(`${d.id}: the default train at its formation's length, one section a car`, () => {
      const m = d.build({ unit: "train" });
      const st = glbStats(m.toGlb("t"));
      expect(st.max[0] - st.min[0]).toBeCloseTo(2 * s.endLength + 2 * s.midLength, 1);
      expect(m.rig!.sections).toHaveLength(4);
      expect(buildLodModel(d, { unit: "train" }).triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    });
  }

  it("puts the pantographs on the second and next-to-last cars, the rear end car turned", () => {
    const t = shinkansenTrain(SHINKANSEN_SERIES["proc-vehicle-shinkansen-n700s"]!, 8);
    expect(t.map((x) => x.pantograph)).toEqual([false, false, true, false, false, true, false, false]);
    expect(t.map((x) => x.turned)).toEqual([false, false, false, false, false, false, false, true]);
    expect(shinkansenTrain(SHINKANSEN_SERIES["proc-vehicle-shinkansen-n700s"]!, 3).map((x) => x.pantograph)).toEqual([false, true, false]);
  });
});
