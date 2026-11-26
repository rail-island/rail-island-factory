// The CRH1A's nose (generator/cnCrh1a.ts, docs/models/china-units.md "The CRH1A's body"): one smooth
// surface from the apron to the roof, the coupler hatch only a seam outline flush in the lower nose - no
// knob, lip or step at the tip (the user's feedback on the high-speed noses).
import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate";
import { readTriangles } from "../generator/renderGlbThumb";
import { triBounds } from "../generator/glbTriangles";

type V = readonly [number, number, number];

/** The front-most x of the surface cut by the plane y = h near the centre line (|z| < zMax). */
function frontAt(tris: ReadonlyArray<readonly [V, V, V]>, h: number, zMax: number): number {
  let best = -Infinity;
  for (const t of tris) {
    const pts: V[] = [];
    for (let i = 0; i < 3; i++) {
      const a = t[i]!, b = t[(i + 1) % 3]!;
      if ((a[1] - h) * (b[1] - h) > 0 || a[1] === b[1]) continue;
      const k = (h - a[1]) / (b[1] - a[1]);
      pts.push([a[0] + k * (b[0] - a[0]), h, a[2] + k * (b[2] - a[2])]);
    }
    if (pts.length < 2) continue;
    const [p, q] = [pts[0]!, pts[1]!];
    for (let s = 0; s <= 16; s++) {
      const x = p[0] + ((q[0] - p[0]) * s) / 16, z = p[2] + ((q[2] - p[2]) * s) / 16;
      if (Math.abs(z) < zMax && x > best) best = x;
    }
  }
  return best;
}

describe("the CRH1A's nose", () => {
  const all = readTriangles(designGlb("proc-vehicle-cr-crh1a", { unit: "endCar" }));
  const tipX = triBounds(all).max[0];
  const tris = all.map((t) => t.p as readonly [V, V, V]);
  // the centre line's profile: d behind the tip by height, 0.5 - 3.75 m over the rail (under the roof lamp)
  const H = Array.from({ length: 66 }, (_, i) => 0.5 + i * 0.05);
  const D = H.map((h) => tipX - frontAt(tris, h, 0.3));
  const tipRow = D.indexOf(Math.min(...D));

  it("has its tip on the lower nose, about 1 m up", () => {
    expect(H[tipRow]!).toBeGreaterThan(0.8);
    expect(H[tipRow]!).toBeLessThan(1.25);
    expect(D[tipRow]!).toBeLessThan(0.05);
  });

  it("is one smooth convex curve from the apron to the roof", () => {
    for (let i = tipRow + 1; i < H.length; i++) expect(D[i]!, `d at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(D[i - 1]! - 0.02);
    for (let i = tipRow - 1; i >= 0; i--) expect(D[i]!, `d at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(D[i + 1]! - 0.02);
    for (let i = 1; i < H.length; i++) expect(Math.abs(D[i]! - D[i - 1]!), `step at ${H[i]!.toFixed(2)} m`).toBeLessThan(0.15);
    for (let i = tipRow + 2; i < H.length; i++) {
      const [a, b] = [D[i - 1]! - D[i - 2]!, D[i]! - D[i - 1]!];
      expect(b, `bend at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(a - 0.03);
    }
  });
});
