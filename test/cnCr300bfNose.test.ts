// The Fuxing CR300BF's nose (generator/cnCr300bf.ts, docs/models/china-units.md "The CR300BF's body"):
// one smooth, continuous head from the skirt over the upright snout to the canopy, the coupler hatch
// only a seam outline flush in it - never a lump standing out at the tip (the user's complaint about
// the CR400BF's hatch bulb, which the CR300BF's snout must not bring back).
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

describe("the CR300BF's nose", () => {
  const all = readTriangles(designGlb("proc-vehicle-cr-cr300bf", { unit: "endCar" }));
  const tipX = triBounds(all).max[0];
  const tris = all.map((t) => t.p as readonly [V, V, V]);
  // the centre line's profile: d behind the tip by height, 0.55 - 2.5 m over the rail
  const H = Array.from({ length: 40 }, (_, i) => 0.55 + i * 0.05);
  const D = H.map((h) => tipX - frontAt(tris, h, 0.3));
  const tipRow = D.indexOf(Math.min(...D));

  it("has its tip low on the face, on the snout (about 1 m up)", () => {
    expect(H[tipRow]!).toBeGreaterThan(0.75);
    expect(H[tipRow]!).toBeLessThan(1.3);
    expect(D[tipRow]!).toBeLessThan(0.05);
  });

  it("is one smooth convex curve: never steps forward again above or below the tip", () => {
    // above the tip the face only ever recedes going up, below it only going down (no lump, neck or lip)
    for (let i = tipRow + 1; i < H.length; i++) expect(D[i]!, `d at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(D[i - 1]! - 0.02);
    for (let i = tipRow - 1; i >= 0; i--) expect(D[i]!, `d at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(D[i + 1]! - 0.02);
    // no jump: the face recedes at most 0.15 m per 5 cm of height below the canopy's chin (1.7 m)
    for (let i = 1; i < H.length; i++) if (H[i]! <= 1.7) expect(D[i]! - D[i - 1]!, `step at ${H[i]!.toFixed(2)} m`).toBeLessThan(0.15);
    // convex above the tip: it leans back ever more going up, never steep and then flat again (the
    // bulb's neck: 0.21 m and then 0.03 m per 5 cm over its top)
    for (let i = tipRow + 2; i < H.length; i++) {
      const [a, b] = [D[i - 1]! - D[i - 2]!, D[i]! - D[i - 1]!];
      expect(b, `bend at ${H[i]!.toFixed(2)} m`).toBeGreaterThanOrEqual(a - 0.03);
    }
  });
});
