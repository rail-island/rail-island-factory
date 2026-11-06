// Stephenson's Rocket (generator/rocket.ts): its inclined cylinders' kinematics,
// the tall chimney inside the British gauge, and the tenders of every
// parametric steam design (generator/steamWorld.ts) with their wheels apart.
// See docs/models/uk-trains.md.

import { describe, expect, it } from "vitest";
import { ROCKET, ROCKET_TENDER, rocketSpec } from "../generator/rocket.ts";
import { N_SAMPLES, RunningGear } from "../generator/steamGear.ts";
import { WORLD_STEAM } from "../generator/worldSteamLocos.ts";
import { steamTenderSpec } from "../generator/steamWorld.ts";
import { DESIGNS } from "../generator/generate.ts";
import { glbStats } from "../generator/glbStats.ts";

describe("Stephenson's Rocket", () => {
  it("drives its front wheels from cylinders inclined at 35 degrees", () => {
    const spec = rocketSpec("locomotive");
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
        expect(Math.atan2(dy, dx)).toBeCloseTo(ROCKET.incline, 6);
        ts.push(Math.hypot(dx, dy));
      }
      // a full stroke, twice the crank
      expect(Math.max(...ts) - Math.min(...ts)).toBeCloseTo(2 * ROCKET.crank, 2);
    }
  });

  it("keeps its crowned chimney inside the 4.0 m British gauge", () => {
    const d = DESIGNS.get("proc-vehicle-rocket")!;
    const s = glbStats(d.build({ unit: "locomotive" }).toGlb(d.id));
    expect(s.max[1]).toBeCloseTo(ROCKET.chimneyTop, 2);
    expect(s.max[1]).toBeLessThanOrEqual(4.0);
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
