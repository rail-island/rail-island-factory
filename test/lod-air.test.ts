// The dedicated LODs of the aircraft, ships and cable car cabins (generator/lodAir.ts):
// every variant within its budget, the livery's colours kept, the windscreen in the
// one LOD glass, and the height range the game hangs or floats the model by.

import { describe, expect, it } from "vitest";
import { AIRCRAFT } from "../generator/aircraft";
import { SHIPS } from "../generator/ships";
import { CABLE_CABINS } from "../generator/cableCabins";
import { LEGACY_VEHICLES } from "../generator/legacyVehicles";
import { coverageCombinations, type ParamValues, type ProceduralDesign } from "../generator/design";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { LOD_GLASS } from "../generator/lodKit";
import { sample } from "./catalogCache";

const GROUP = [...AIRCRAFT, ...SHIPS.filter((d) => d.id !== "proc-vehicle-cruise-ferry"), ...CABLE_CABINS, ...LEGACY_VEHICLES.filter((d) => d.id === "veh-cabin-classic")];
const budget = (d: ProceduralDesign) => (d.catalog?.category === "Aircraft" ? 200 : 100);
const mats = (d: ProceduralDesign, v?: ParamValues) => {
  const { json, bin } = parseGlb(d.buildLod(v).toGlb(d.id));
  return new Set(collectTriangles(json, bin).map((f) => f.material));
};

describe("air, water and rope LODs", () => {
  for (const d of GROUP) {
    it(`${d.id}: every variant has its own LOD within the budget, without flicker or detail materials`, () => {
      expect(d.buildLod).toBeDefined();
      for (const v of sample(coverageCombinations(d.params, d.finishParams))) {
        const m = d.buildLod(v);
        expect(m.triangleCount()).toBeLessThanOrEqual(budget(d));
        // the budget is used, not wasted
        expect(m.triangleCount()).toBeGreaterThan(budget(d) * 0.7);
        expect(findCoplanarOverlaps(m.toGlb(d.id))).toEqual([]);
        for (const mat of mats(d, v)) expect(mat === LOD_GLASS || !/glass|window|rubber|tyre|lamp|logo|badge|number/i.test(mat)).toBe(true);
      }
    });
  }

  it("keeps the full models' height range, which the game's ropeFrac, boardFrac and draftFrac refer to", () => {
    for (const d of GROUP.filter((g) => g.catalog?.category !== "Aircraft")) {
      const full = glbStats(d.build().toGlb("full")), low = glbStats(d.buildLod().toGlb("low"));
      expect(low.min[1]).toBeCloseTo(full.min[1], 2);
      expect(low.max[1]).toBeCloseTo(full.max[1], 2);
    }
  });

  it("paints the airliners in their livery's skin and fin, with the windscreen in LOD glass", () => {
    const a380 = AIRCRAFT.find((d) => d.id === "proc-vehicle-airbus-a380")!;
    for (const m of ["aeBlack", "aeGreen", "white", LOD_GLASS]) expect(mats(a380, { livery: "emirates" }).has(m)).toBe(true);
    const b737 = AIRCRAFT.find((d) => d.id === "proc-vehicle-boeing-737")!;
    for (const m of ["frBlue", "white", LOD_GLASS]) expect(mats(b737, { livery: "ryanair" }).has(m)).toBe(true);
    for (const m of ["wnBlue", "wnSilver", "wnRed", "wnYellow"]) expect(mats(b737, { livery: "southwest" }).has(m)).toBe(true);
    const beluga = AIRCRAFT.find((d) => d.id === "proc-vehicle-airbus-beluga")!;
    expect(mats(beluga).has("airbusBlue")).toBe(true);
  });

  it("lies along the full model's axes and spans about its length and wingspan", () => {
    for (const d of AIRCRAFT) {
      const full = glbStats(d.build().toGlb("full")), low = glbStats(d.buildLod().toGlb("low"));
      for (const k of [0, 2]) {
        const [fl, ll] = [full.max[k]! - full.min[k]!, low.max[k]! - low.min[k]!];
        expect(ll).toBeGreaterThan(fl * 0.9);
        expect(ll).toBeLessThanOrEqual(fl * 1.01);
      }
    }
  });

  it("is static and deterministic: no parts, no gear node", () => {
    for (const d of GROUP) {
      const m = d.buildLod();
      expect(m.toGlb(d.id)).toEqual(d.buildLod().toGlb(d.id));
      const { json } = parseGlb(m.toGlb(d.id));
      expect(JSON.stringify(json.nodes ?? [])).not.toMatch(/"name":"(gear|airframe)"/);
    }
  });
});
