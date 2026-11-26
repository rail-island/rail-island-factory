// The CRH380A's nose tip (generator/cnCrh380a.ts, docs/models/china-units.md "The CRH380A's body").
// A regression test: the tip was once a light grey bullet coupler cover with a dark seam ring 1 m
// behind it, its section narrowing again behind the ball (a neck), so it read as a knob poking out of
// the nose. The real tip is white, one smooth surface with the long nose, the cover only a flush seam.
import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate";
import { readTriangles } from "../generator/renderGlbThumb";
import type { Tri } from "../generator/glbTriangles";

const ID = "proc-vehicle-cr-crh380a";

/** The silhouette at the plane x = X: the top, the bottom (above the rail's 0.25 m) and the half width of the body's triangles cut there. */
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

describe("the CRH380A's nose tip", () => {
  const tris = readTriangles(designGlb(ID, { unit: "endCar" }));
  const tipX = Math.max(...tris.flatMap((t) => t.p.map((p) => p[0])));
  // d behind the tip over the first 3 m, every 0.25 m
  const ds = Array.from({ length: 12 }, (_, i) => 0.25 + 0.25 * i);
  const cuts = ds.map((d) => cut(tris, tipX - d));

  it("only grows going back: the height and the width never shrink behind the tip", () => {
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i]!.top - cuts[i]!.bot, `height at ${ds[i]} m`).toBeGreaterThanOrEqual(cuts[i - 1]!.top - cuts[i - 1]!.bot - 0.005);
      expect(cuts[i]!.hw, `width at ${ds[i]} m`).toBeGreaterThanOrEqual(cuts[i - 1]!.hw - 0.005);
    }
  });

  it("is one convex curve in the side view and the plan: no neck behind the tip", () => {
    // the slopes of the top line, the height and the half width only flatten going back (a ball
    // on a tube flattens and then steepens again behind it)
    const lines: Array<[string, (c: { top: number; bot: number; hw: number }) => number]> = [
      ["top", (c) => c.top], ["height", (c) => c.top - c.bot], ["half width", (c) => c.hw],
    ];
    for (const [name, f] of lines) {
      const slope = ds.slice(1).map((_, i) => (f(cuts[i + 1]!) - f(cuts[i]!)) / 0.25);
      for (let i = 1; i < slope.length; i++) expect(slope[i]!, `${name} slope at ${ds[i + 1]} m`).toBeLessThanOrEqual(Math.min(...slope.slice(0, i)) + 0.02);
    }
  });

  it("is painted the body's white at the tip, not a grey cover", () => {
    const body = tris.filter((t) => t.material === "white")[0]!.color;
    const tip = tris.filter((t) => t.p.some((p) => p[0] > tipX - 0.3) && !t.interior);
    expect(tip.length).toBeGreaterThan(0);
    for (const t of tip) expect(t.material, "tip material").toBe("white");
    expect(body[0]).toBeGreaterThan(0.8);
  });
});
