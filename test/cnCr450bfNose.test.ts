// The CR450BF's nose (generator/cnCr450bf.ts, docs/models/china-units.md "The CR450BF's body"). The
// user's feedback on the Chinese high-speed noses: no bulge, knob or lip at the tip - the real nose is
// one smooth surface from the skirt to the roof, its coupler cover only a flush seam. This holds the
// CR450BF's tip to that: its height and width only grow going back, their slopes only flatten (no neck
// behind a ball), and the tip is the body's silver, not a cover of another paint.
import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate";
import { readTriangles } from "../generator/renderGlbThumb";
import type { Tri } from "../generator/glbTriangles";

const ID = "proc-vehicle-cr-cr450bf";

/** The silhouette at the plane x = X: the top, the bottom (above the rail's 0.25 m) and the half width of the triangles cut there. */
function cut(tris: Tri[], X: number): { top: number; bot: number; hw: number } {
  let [top, bot, hw] = [-Infinity, Infinity, 0];
  for (const t of tris) {
    for (let i = 0; i < 3; i++) {
      const [a, b] = [t.p[i]!, t.p[(i + 1) % 3]!];
      if ((a[0] - X) * (b[0] - X) > 0 || a[0] === b[0]) continue;
      const s = (X - a[0]) / (b[0] - a[0]);
      const [y, z] = [a[1] + s * (b[1] - a[1]), a[2] + s * (b[2] - a[2])];
      if (y < 0.25) continue;
      top = Math.max(top, y);
      bot = Math.min(bot, y);
      hw = Math.max(hw, Math.abs(z));
    }
  }
  return { top, bot, hw };
}

describe("the CR450BF's nose tip", () => {
  const tris = readTriangles(designGlb(ID, { unit: "endCar" })).filter((t) => !t.interior);
  const tipX = Math.max(...tris.flatMap((t) => t.p.map((p) => p[0])));
  // d behind the tip over the first 2.75 m (ahead of the leading bogie), every 0.25 m
  const ds = Array.from({ length: 11 }, (_, i) => 0.25 + 0.25 * i);
  // the coupler cover's seam is a decal laid on the surface (a few mm proud of its facets): the shape is the skin's
  const skin = tris.filter((t) => t.material !== "seam");
  const cuts = ds.map((d) => cut(skin, tipX - d));

  it("only grows going back: the height and the width never shrink behind the tip", () => {
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i]!.top - cuts[i]!.bot, `height at ${ds[i]} m`).toBeGreaterThanOrEqual(cuts[i - 1]!.top - cuts[i - 1]!.bot - 0.005);
      expect(cuts[i]!.hw, `width at ${ds[i]} m`).toBeGreaterThanOrEqual(cuts[i - 1]!.hw - 0.005);
    }
  });

  it("is one convex curve in the side view and the plan: no knob or neck behind the tip", () => {
    const lines: Array<[string, (c: { top: number; bot: number; hw: number }) => number]> = [
      ["top", (c) => c.top], ["height", (c) => c.top - c.bot], ["half width", (c) => c.hw],
    ];
    for (const [name, f] of lines) {
      const slope = ds.slice(1).map((_, i) => (f(cuts[i + 1]!) - f(cuts[i]!)) / 0.25);
      for (let i = 1; i < slope.length; i++) expect(slope[i]!, `${name} slope at ${ds[i + 1]} m`).toBeLessThanOrEqual(Math.min(...slope.slice(0, i)) + 0.03);
    }
  });

  it("is painted the body's silver at the tip (the canopy's red point starts above it), not a cover of its own", () => {
    const tip = tris.filter((t) => t.p.some((p) => p[0] > tipX - 0.2));
    expect(tip.length).toBeGreaterThan(0);
    for (const t of tip) expect(t.material, "tip material").toBe("silver");
  });
});
