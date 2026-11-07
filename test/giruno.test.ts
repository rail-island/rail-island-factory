// The SBB Giruno (generator/chUnits.ts) on the series kit's Jacobs bogies and its cab face. See docs/models/switzerland-trains.md.
import { describe, expect, it } from "vitest";
import { CH_UNITS, GIRUNO } from "../generator/chUnits";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";

const d = CH_UNITS.find((x) => x.id === "proc-vehicle-sbb-giruno")!;

describe("the SBB Giruno", () => {
  it("builds 22.25 m end cars and 17.5 m intermediate cars, each on two bogies of its own, in budget, without z-fighting", () => {
    for (const [unit, len] of [["endCar", GIRUNO.endLength], ["middleCar", GIRUNO.midLength]] as const) {
      const m = d.build({ unit });
      const glb = m.toGlb(unit);
      const st = glbStats(glb);
      // the end car's nose stops 7 cm short of its coupling plane, where its covered coupler meets the next
      expect(Math.abs(st.max[0] - st.min[0] - len)).toBeLessThan(0.1);
      expect(st.triangles).toBeLessThanOrEqual(16000);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      expect(m.rig!.supports).toHaveLength(2);
    }
  });

  it("rides in the train on one Jacobs bogie under each joint, carrying both cars", () => {
    for (const n of [4, 8]) {
      const m = d.build({ unit: "train", cars: String(n) });
      const sup = m.rig!.supports!;
      // the two end cars' leading bogies and one under each of the n - 1 joints
      expect(sup).toHaveLength(n + 1);
      expect(sup.filter((s) => s.sections.length === 2)).toHaveLength(n - 1);
      expect(m.rig!.sections).toHaveLength(n);
      expect(buildLodModel(d, { unit: "train", cars: String(n) }).triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    }
  });
});
