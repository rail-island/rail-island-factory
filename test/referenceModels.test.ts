// The procedural reproductions of the webapp's hand-authored models (churches.ts,
// cathedrals.ts, landmarks.ts, stations.ts, aircraft.ts, ships.ts, cableCabins.ts,
// trucks.ts). Each one stands in for the GLB of the same name in the webapp's
// db/, so it must keep that model's axes and size: the webapp's catalog entries
// (a ship's yaw and draftFrac, a cabin's ropeFrac, a building's defaultScale) are
// measured off those bounds. REFERENCE below is the reference GLBs' bounding
// boxes, in metres, as authored, with their triangle counts.

import { describe, expect, it } from "vitest";
import { DESIGNS, designGlb } from "../generator/generate";
import { glbStats } from "../generator/glbStats";

const REFERENCE: Record<string, { min: number[]; max: number[]; triangles: number }> = {
  "bld-baroque-church": { min: [-9.65,0,-19.7], max: [9.65,42.3,19.7], triangles: 7852 },
  "bld-brandenburg-gate": { min: [-33.05,0,-4.8], max: [33.05,30.37,4.91], triangles: 217392 },
  "bld-church-vrchlabi": { min: [-12.17,0,-25.33], max: [12.17,62.3,25.33], triangles: 12416 },
  "bld-louvre-pyramid": { min: [-19.41,0,-19.41], max: [19.41,22.56,19.41], triangles: 2024 },
  "bld-prague-main-station": { min: [-32.2,0,-13.8], max: [32.2,42.1,13.42], triangles: 18292 },
  "bld-st-basils-cathedral": { min: [-16.1,0,-18], max: [16.1,50.22,18], triangles: 140576 },
  "bld-st-nicholas-church": { min: [-19.86,0,-9.1], max: [19.86,41.78,9.1], triangles: 37600 },
  "bld-station-building": { min: [-13.89,0,-5.92], max: [13.89,8.53,5.92], triangles: 10612 },
  "bld-station-halt": { min: [-9.75,0,-6.56], max: [9.75,10.46,6.56], triangles: 3008 },
  "bld-suburban-station": { min: [-12.6,0,-5.3], max: [12.6,13.88,8.3], triangles: 7424 },
  "bld-twin-tower-baroque-church": { min: [-16,0,-24], max: [16,58.01,24], triangles: 39364 },
  "bld-white-house": { min: [-54.6,0,-20.6], max: [54.6,20.04,21.5], triangles: 63236 },
  "veh-aero-a10": { min: [-7.34,0,-5.59], max: [7.34,3.99,4.64], triangles: 10852 },
  "veh-airbus-a380": { min: [-39.43,0,-38], max: [39.43,23.5,36.3], triangles: 16748 },
  "veh-light-jet": { min: [-8.8,-2.55,-7.65], max: [8.8,3.61,7.65], triangles: 15064 },
  "veh-cruise-ferry": { min: [-77.5,0,-12.2], max: [77.5,45.9,12.2], triangles: 34486 },
  "veh-hydrofoil-ferry": { min: [-17.25,0,-3.9], max: [17.25,8.63,3.9], triangles: 2478 },
  "veh-passenger-ferry": { min: [-4.14,0,-18.67], max: [4.14,13.33,20.42], triangles: 27768 },
  "veh-cablecar-cabin": { min: [-1.62,0,-5.07], max: [1.62,6.93,5.07], triangles: 4132 },
  "veh-gondola-cabin": { min: [-1.04,-0.1,-1.05], max: [1.04,4.79,1.1], triangles: 3392 },
  "veh-cistern-semi-truck": { min: [-7.9,0,-1.55], max: [7.83,4.04,1.55], triangles: 10280 },
  "veh-mixer-truck": { min: [-5.07,-0.01,-1.7], max: [5.08,4.57,1.7], triangles: 26510 },
  "veh-reefer-semi-truck": { min: [-8.47,0,-1.5], max: [8.47,4.07,1.5], triangles: 5648 },
};

/** Every axis of the bounding box within this fraction of the reference's extent. */
const SIZE_TOLERANCE = 0.1;

/** The triangle budget of each family, whatever the hand-authored model spent. */
function budget(id: string): number {
  if (/truck/.test(id)) return 12000;
  if (/cabin/.test(id)) return 8000;
  if (/a10|a380|jet/.test(id)) return 20000;
  return 40000;
}

describe("the reproductions of the webapp's models", () => {
  it("cover every reference model, and exist as designs", () => {
    for (const id of Object.keys(REFERENCE)) expect(DESIGNS.has(id), id).toBe(true);
  });

  it.each(Object.keys(REFERENCE).map((id) => [id] as const))("%s keeps the reference's axes, size and budget", (id) => {
    const ref = REFERENCE[id]!;
    const s = glbStats(designGlb(id));
    for (let k = 0; k < 3; k++) {
      const want = ref.max[k]! - ref.min[k]!;
      const got = s.max[k] - s.min[k];
      expect(Math.abs(got - want) / want, `${"xyz"[k]} extent ${got.toFixed(2)} vs ${want.toFixed(2)}`).toBeLessThanOrEqual(SIZE_TOLERANCE);
    }
    if (id.startsWith("bld-")) expect(s.min[1]).toBeCloseTo(0, 3);
    expect(s.triangles).toBeLessThanOrEqual(budget(id));
  });
});
