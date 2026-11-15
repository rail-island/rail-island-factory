// The NCRTC Namo Bharat (generator/inNamoBharat.ts): its cab face, budget and paint. See docs/models/india-trains.md.
import { describe, expect, it } from "vitest";
import { IN_UNITS } from "../generator/inUnits";
import { NAMO_BHARAT } from "../generator/inNamoBharat";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";

const d = IN_UNITS.find((x) => x.id === "proc-vehicle-ncrtc-namo-bharat")!;

describe("the Namo Bharat", () => {
  it("draws its cab as a cab face with the red triangle, the cars 3.2 m wide, in budget, without z-fighting", () => {
    expect(NAMO_BHARAT.cabFace).toBeDefined();
    expect(NAMO_BHARAT.liveries.namoBharat).toBeDefined();
    for (const unit of ["endCar", "middleCar"]) {
      const m = d.build({ unit });
      const glb = m.toGlb(unit);
      const st = glbStats(glb);
      expect(st.triangles).toBeLessThanOrEqual(16000);
      expect(st.max[2] - st.min[2]).toBeLessThan(3.3);
      expect(st.max[2] - st.min[2]).toBeGreaterThan(3.15);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    }
    expect(d.build({ unit: "endCar" }).toGlb("x").length).toBeGreaterThan(0);
  });

  it("keeps the distant train in its budget", () => {
    for (const n of ["3", "6"]) expect(buildLodModel(d, { unit: "train", cars: n }).triangleCount()).toBeLessThanOrEqual(lodBudget(d));
  });
});
