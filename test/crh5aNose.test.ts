// The CRH5A's nose seen from the side (docs/models/china-units.md, "The CRH5A's body"): one smooth
// convex curve from the spoiler over the coupler cover to the canopy, as on the photographs in
// assets/cr-crh5a/. Regression: the coupler cover was drawn as a separate half ellipsoid standing
// 0.48 m forward of the face, a snout under a step; the cover is now the face's own lower part,
// its joint only a painted seam.

import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate.ts";
import { readTriangles } from "../generator/renderGlbThumb.ts";
import { triBounds } from "../generator/glbTriangles.ts";

const ID = "proc-vehicle-cr-crh5a";

/** The side silhouette's front: how far behind the foremost point the body's front is at height y (any z). */
function silhouette(unit: string): { at: (y: number) => number; tipY: number } {
  const tris = readTriangles(designGlb(ID, { unit }));
  const { max } = triBounds(tris);
  const at = (y: number): number => {
    let x = -Infinity;
    for (const t of tris) {
      const p = t.p;
      for (let i = 0; i < 3; i++) {
        const a = p[i]!, b = p[(i + 1) % 3]!;
        if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
        const k = (y - a[1]) / (b[1] - a[1]);
        x = Math.max(x, a[0] + (b[0] - a[0]) * k);
      }
    }
    return max[0] - x;
  };
  let tipY = 0, best = Infinity;
  for (let y = 0.5; y <= 1.6; y += 0.02) { const d = at(y); if (d < best) [best, tipY] = [d, y]; }
  return { at, tipY };
}

describe("CRH5A nose profile", () => {
  for (const unit of ["endCar", "train"]) {
    it(`${unit}: the side profile is one convex curve with no step at the coupler cover`, () => {
      const { at, tipY } = silhouette(unit);
      // the tip is the coupler cover's front, about 1.0 m up
      expect(tipY).toBeGreaterThan(0.85);
      expect(tipY).toBeLessThan(1.15);
      // above the tip to the canopy and below it to the spoiler, the profile leans back ever more
      // steeply: the slope (metres back per metre of height) never drops by more than 0.6 between
      // neighbouring 0.1 m steps (the old cover's top fell from about 3 to 0.3)
      for (const dir of [1, -1]) {
        const ys: number[] = [];
        for (let y = tipY; dir > 0 ? y <= 2.4 : y >= 0.5; y += dir * 0.1) ys.push(y);
        const ds = ys.map(at);
        const slopes = ds.slice(1).map((d, i) => (d - ds[i]!) / 0.1);
        for (let i = 1; i < slopes.length; i++)
          expect(slopes[i]!, `slope at ${ys[i]!.toFixed(2)} m (${dir > 0 ? "up" : "down"})`).toBeGreaterThan(slopes[i - 1]! - 0.6);
        // and always leans back: nothing stands forward of the curve
        for (const s of slopes) expect(s).toBeGreaterThan(-0.05);
      }
    });
  }
});
