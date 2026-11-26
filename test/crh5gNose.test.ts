// The CRH5G's nose seen from the side (generator/cnCrh5g.ts; the enhanced sets' new nose): one smooth
// convex curve from the spoiler over the big coupler cover, the lamps and the windscreen to the cab
// roof, as on the photographs in assets/cr-crh5g/. The coupler cover is the snout's own lower part,
// its joint and its split only painted seams - never a lump, lip or step standing out at the tip
// (the user's complaint about the high-speed noses).

import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate.ts";
import { readTriangles } from "../generator/renderGlbThumb.ts";
import { triBounds } from "../generator/glbTriangles.ts";

const ID = "proc-vehicle-cr-crh5g";

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

describe("CRH5G nose profile", () => {
  for (const unit of ["endCar", "train"]) {
    it(`${unit}: the side profile is one convex curve with no step at the coupler cover`, () => {
      const { at, tipY } = silhouette(unit);
      // the tip is the coupler cover's front, about 1.15 m up
      expect(tipY).toBeGreaterThan(1.0);
      expect(tipY).toBeLessThan(1.3);
      // above the tip to the canopy and below it to the spoiler, the profile leans back ever more
      // steeply: the slope (metres back per metre of height) never drops by more than 0.6 between
      // neighbouring 0.1 m steps (a cover standing out of the face makes it fall from about 3 to 0.3)
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
