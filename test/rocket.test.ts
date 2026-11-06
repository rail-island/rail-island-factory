// Stephenson's Rocket (generator/rocket.ts): its inclined cylinders' kinematics,
// the tall chimney inside the British gauge, and the tenders of every
// parametric steam design (generator/steamWorld.ts) with their wheels apart.
// See docs/models/uk-trains.md.

import { describe, expect, it } from "vitest";
import { PUMP, ROCKET, ROCKET_TENDER, ROCKET_VERSIONS, rocketSpec, type RocketVersion } from "../generator/rocket.ts";
import { N_SAMPLES, RunningGear } from "../generator/steamGear.ts";
import { WORLD_STEAM } from "../generator/worldSteamLocos.ts";
import { steamTenderSpec } from "../generator/steamWorld.ts";
import { DESIGNS } from "../generator/generate.ts";
import { glbStats } from "../generator/glbStats.ts";

describe("Stephenson's Rocket", () => {
  const VERSIONS = Object.keys(ROCKET_VERSIONS) as RocketVersion[];

  it.each(VERSIONS)("%s: drives its front wheels from its inclined cylinders", (version) => {
    const incline = ROCKET_VERSIONS[version].incline;
    const spec = rocketSpec("locomotive", version);
    const xc = (spec.heads[0] + spec.heads[1]) / 2;
    const gear = new RunningGear(spec.gear, (x) => xc - x);
    const sides = gear.solvedPoses();
    expect(sides).toHaveLength(2);
    for (const side of sides) {
      expect(side.poses).toHaveLength(N_SAMPLES + 1);
      const ts: number[] = [];
      for (const p of side.poses) {
        expect(Math.hypot(p.crank[0] - side.axle[0], p.crank[1] - side.axle[1])).toBeCloseTo(ROCKET.crank, 6);
        expect(Math.hypot(p.crank[0] - p.crosshead[0], p.crank[1] - p.crosshead[1])).toBeCloseTo(side.lengths.mainRod, 6);
        // the crosshead stays on the axis through the axle, rising rearward (model -X) at the incline
        const dx = side.axle[0] - p.crosshead[0];
        const dy = p.crosshead[1] - side.axle[1];
        expect(Math.atan2(dy, dx)).toBeCloseTo(incline, 6);
        ts.push(Math.hypot(dx, dy));
      }
      // a full stroke, twice the crank
      expect(Math.max(...ts) - Math.min(...ts)).toBeCloseTo(2 * ROCKET.crank, 2);
    }
  });

  it("lowered its cylinders from 35 to 8 degrees in the 1830 rebuild", () => {
    expect(ROCKET_VERSIONS.rainhill.incline).toBeCloseTo((35 * Math.PI) / 180, 9);
    expect(ROCKET_VERSIONS.rebuilt.incline).toBeCloseTo((8 * Math.PI) / 180, 9);
  });

  it.each(VERSIONS)("%s: keeps its chimney inside the 4.0 m British gauge", (version) => {
    const d = DESIGNS.get("proc-vehicle-rocket")!;
    const s = glbStats(d.build({ unit: "locomotive", version }).toGlb(d.id));
    expect(s.max[1]).toBeCloseTo(ROCKET_VERSIONS[version].chimneyTop, 2);
    expect(s.max[1]).toBeLessThanOrEqual(4.0);
  });

  it.each(VERSIONS)("%s: works its feed pump from the right crosshead and carries its crew", (version) => {
    const d = DESIGNS.get("proc-vehicle-rocket")!;
    const tree = (unit: string) => JSON.stringify(d.build({ unit, version }).sourceTree(d.id, d.title));
    const engine = tree("locomotive");
    for (const name of ["feed pump", "pump ram", "driver", "top hat"]) expect(engine).toContain(`"${name}"`);
    expect(tree("tender")).toContain('"fireman"');
    // the ram, riding on the crosshead, stays in the pump's barrel through the whole stroke
    const spec = rocketSpec("locomotive", version);
    const xc = (spec.heads[0] + spec.heads[1]) / 2;
    const side = new RunningGear(spec.gear, (x) => xc - x).solvedPoses().find((p) => p.suffix === "right")!;
    const ts = side.poses.map((p) => Math.hypot(p.crosshead[0] - side.axle[0], p.crosshead[1] - side.axle[1]));
    expect(Math.min(...ts) + PUMP.ram).toBeGreaterThan(PUMP.t0 + 0.02);
    expect(Math.max(...ts) + PUMP.ram).toBeLessThan(PUMP.t1);
  });

  it("stands its tender on two wheelsets well apart", () => {
    const [a, b] = ROCKET_TENDER.axles;
    expect(b - a).toBeGreaterThan(ROCKET_TENDER.wheelD + 0.4);
  });
});

describe("the parametric steam tenders", () => {
  // regression: a short two-axle tender (the Rocket's, the DHR B class's) had its wheels overlapping
  it.each(Object.keys(WORLD_STEAM))("%s keeps its tender's wheels apart", (id) => {
    const wheels = steamTenderSpec(WORLD_STEAM[id]!.base).gear.wheels;
    for (let i = 0; i + 1 < wheels.length; i++) {
      const [p, q] = [wheels[i]!, wheels[i + 1]!];
      expect(q.x - p.x, `${id} axles ${i + 1}-${i + 2}`).toBeGreaterThanOrEqual((p.d + q.d) / 2 + 0.2);
    }
  });
});
