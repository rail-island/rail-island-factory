// The oil pumpjack's mechanism (generator/pumpjack.ts, industry-oil-pump): the
// solved link lengths, the clip as a closed time loop, and the posed model at
// several samples. See docs/models/animation.md.

import { describe, expect, it } from "vitest";
import { INDUSTRY } from "../generator/industry.ts";
import { paramCombinations } from "../generator/design.ts";
import { parseGlb } from "../generator/glbTriangles.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { glbStats } from "../generator/glbStats.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { PUMP_CLIP, PUMP_SAMPLES, PUMP_STROKE, pumpjackLayout, pumpjackPoses } from "../generator/pumpjack.ts";

const design = INDUSTRY.find((d) => d.id === "industry-oil-pump")!;
const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("the oil pumpjack", () => {
  for (const h of [6, 9]) {
    it(`keeps the pitman arm and beam lengths at every sample (post ${h} m)`, () => {
      const l = pumpjackLayout(h);
      const poses = pumpjackPoses(l);
      expect(poses).toHaveLength(PUMP_SAMPLES + 1);
      const pitman = dist(l.pin, l.equalizer), tail = dist(l.saddle, l.equalizer);
      for (const p of poses) {
        expect(dist(p.pin, p.equalizer)).toBeCloseTo(pitman, 9);
        expect(dist(l.saddle, p.equalizer)).toBeCloseTo(tail, 9);
        expect(dist(l.crank, p.pin)).toBeCloseTo(l.radius, 9);
      }
      // the beam rocks both ways, a sensible stroke, and comes back to rest
      const tilts = poses.map((p) => p.beam);
      expect(Math.max(...tilts)).toBeGreaterThan(0.1);
      expect(Math.min(...tilts)).toBeLessThan(-0.1);
      expect(Math.max(...tilts.map(Math.abs))).toBeLessThan(0.3);
      expect(poses[0]!.beam).toBeCloseTo(0, 9);
      expect(poses[PUMP_SAMPLES]!.beam).toBeCloseTo(0, 9);
    });
  }

  it("has one time-driven pumping clip on the moving parts", () => {
    for (const p of paramCombinations(design.params)) {
      const { json } = parseGlb(design.build(p).toGlb("t"));
      const g = json as unknown as {
        nodes: Array<{ name: string }>;
        scenes: Array<{ extras?: { clipDrives?: unknown } }>;
        animations: Array<{ name: string; channels: Array<{ target: { node: number } }> }>;
      };
      expect(g.animations.map((a) => a.name)).toEqual([PUMP_CLIP]);
      expect(g.scenes[0]!.extras?.clipDrives).toEqual({ [PUMP_CLIP]: { drive: "time" } });
      const moved = new Set(g.animations[0]!.channels.map((c) => g.nodes[c.target.node]!.name));
      expect([...moved].sort()).toEqual(["beam", "cranks", "pitman-arms", "polished-rod"]);
      expect(g.nodes.map((n) => n.name).filter((n) => !moved.has(n))).toEqual(["frame"]);
    }
  });

  it("stays clear of z-fighting and the ground at every eighth sample", () => {
    for (const p of paramCombinations(design.params)) {
      const glb = design.build(p).toGlb("t");
      expect(sampleCount(glb)).toBe(PUMP_SAMPLES + 1);
      for (let k = 0; k <= PUMP_SAMPLES; k += 6) {
        const posed = poseGlb(glb, k);
        expect(findCoplanarOverlaps(posed), `sample ${k}`).toEqual([]);
        expect(glbStats(posed).min[1], `sample ${k}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("loops once a stroke", () => {
    const l = pumpjackLayout(6);
    expect(pumpjackPoses(l)[PUMP_SAMPLES]!.crank).toBeCloseTo(-2 * Math.PI, 12);
    expect(PUMP_STROKE).toBeGreaterThan(0);
  });

  it("keeps the low-detail build static", () => {
    const low = design.buildLod!();
    expect(low.animations()).toEqual([]);
  });
});
