// The Japanese conventional-line electric units (generator/jpEmus.ts). See docs/models/jp-emus.md.
import { describe, expect, it } from "vitest";
import { JP_EMUS, JP_EMU_SERIES } from "../generator/jpEmus";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";

describe("the Japanese conventional-line units", () => {
  it("are six series on the UIC gauge, each an end car, a middle car and a train", () => {
    expect(JP_EMUS.map((d) => d.id)).toEqual(Object.keys(JP_EMU_SERIES));
    for (const d of JP_EMUS) {
      expect(d.loadingGauge).toBeUndefined();
      expect(d.catalog).toMatchObject({ group: "unit", traction: "electric" });
      expect(d.params!.map((p) => p.name)).toEqual(["unit", "cars", "livery"]);
      expect(d.params![2]!.values).toHaveLength(2);
      for (const p of d.params!) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
    }
  });

  for (const d of JP_EMUS) {
    const s = JP_EMU_SERIES[d.id]!;
    it(`${d.id}: the end and middle cars at their lengths and real width, the pantograph car's pantograph raised`, () => {
      // the car that raises the pantograph: the intermediate car, or the end car of a series with `endPantograph` (the Hankyu 9000)
      const raising = s.endPantograph ? "endCar" : "middleCar";
      for (const [unit, len] of [["endCar", s.endLength], ["middleCar", s.midLength]] as const) {
        const m = d.build({ unit });
        const glb = m.toGlb(unit);
        const st = glbStats(glb);
        expect(st.max[0] - st.min[0]).toBeCloseTo(len, 1);
        expect(st.max[2] - st.min[2]).toBeCloseTo(2 * s.W, 1);
        expect(st.max[2] - st.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.uic.width);
        expect(st.triangles).toBeLessThanOrEqual(16000);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        expect(m.rig!.supports).toHaveLength(2);
        if (unit !== raising) expect(st.max[1]).toBeLessThanOrEqual(LOADING_GAUGES.uic.height);
        else expect(st.max[1]).toBeGreaterThan(5.8);
      }
    });
  }

  it("gives the commuter cars four doors a side", () => {
    for (const id of ["proc-vehicle-jr-e235", "proc-vehicle-jnr-103"]) {
      const m = JP_EMUS.find((d) => d.id === id)!.build({ unit: "middleCar" });
      expect(m.animations().filter((c) => c.drive.drive === "door")).toHaveLength(2);
      expect(JP_EMU_SERIES[id]!.doorCount).toBe(4);
    }
  });
});
