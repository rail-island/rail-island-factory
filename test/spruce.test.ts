// The spruce (generator/spruce.ts): whorled boughs carrying closed, drooping
// foliage pads in a tapered cone over a visible trunk; every seed within the
// shipped budgets, Max and low on the same layout. The kit-wide checks (grounding,
// matching bounds, flicker, determinism, standalone JS) run in treeSpecies.test.ts.
// Docs: docs/models/trees.md.
import { describe, expect, it } from "vitest";
import { spruceOptions, spruceParts } from "../generator/spruce";
import { boxOf, type Geo } from "../generator/treeGeo";
import baseline from "./fixtures/tree-baseline.json";

const SEEDS = ["1", "2", "3", "4", "5"];
const ref = baseline as Record<string, { tris: number }>;
const parts = (level: "high" | "max" | "low" | "coarse", seed: string) => spruceParts(level, spruceOptions({ seed }));
const faces = (list: Geo[]) => list.reduce((n, g) => n + g.count / 3, 0);

// Each edge shared by exactly two faces, in opposite directions, enclosing a positive volume.
function closedOutward(g: Geo): boolean {
  const key = (i: number) => [g.x(i), g.y(i), g.z(i)].map((n) => Math.round(n * 1e5)).join(",");
  const edges = new Map<string, number>();
  let volume = 0;
  for (let i = 0; i < g.count; i += 3) {
    const [a, b, c] = [i, i + 1, i + 2].map((k) => [g.x(k), g.y(k), g.z(k)]) as number[][];
    volume += (a![0]! * (b![1]! * c![2]! - b![2]! * c![1]!) - a![1]! * (b![0]! * c![2]! - b![2]! * c![0]!) + a![2]! * (b![0]! * c![1]! - b![1]! * c![0]!)) / 6;
    for (const [f, t] of [[i, i + 1], [i + 1, i + 2], [i + 2, i]] as const) {
      const id = `${key(f)}>${key(t)}`;
      edges.set(id, (edges.get(id) ?? 0) + 1);
    }
  }
  return volume > 0 && [...edges.keys()].every((id) => {
    const [f, t] = id.split(">");
    return edges.get(id) === 1 && edges.get(`${t}>${f}`) === 1;
  });
}

describe("the spruce", () => {
  it.each(SEEDS)("keeps seed %s within the shipped budgets at every level", (seed) => {
    const count = (level: "high" | "max" | "low" | "coarse") => { const p = parts(level, seed); return faces(p.trunk) + faces(p.foliage); };
    expect(count("high")).toBeLessThanOrEqual(ref["spruce:high"]!.tris);
    expect(count("high")).toBeGreaterThan(ref["spruce:high"]!.tris * 0.9);
    expect(count("low")).toBeLessThanOrEqual(Math.floor(ref["spruce:low"]!.tris * 1.05));
    expect(count("coarse")).toBeLessThanOrEqual(ref["spruce:coarse"]!.tris);
    expect(count("max")).toBeLessThanOrEqual(10000);
    expect(count("max")).toBeGreaterThan(count("high") * 3);
  });

  it("draws its foliage as closed, outward-wound pads, many at high and more at Max", () => {
    for (const seed of SEEDS) {
      const high = parts("high", seed).foliage, max = parts("max", seed).foliage;
      expect(high.length, `seed ${seed}`).toBeGreaterThan(60);
      expect(max.length, `seed ${seed}`).toBeGreaterThan(high.length * 1.4);
      for (const g of [...high, ...max]) expect(closedOutward(g), `seed ${seed}`).toBe(true);
    }
  });

  it("draws a trunk with whorled boughs, the trunk showing below the crown", () => {
    for (const seed of SEEDS) {
      const { trunk, foliage } = parts("high", seed);
      // the stem, then the lower whorls' boughs
      expect(trunk.length, `seed ${seed}`).toBeGreaterThan(15);
      const crown = boxOf(foliage), stem = boxOf([trunk[0]!]);
      expect(crown.min[1], `seed ${seed}`).toBeGreaterThan(0.8);
      expect(stem.max[1], `seed ${seed}`).toBeGreaterThan(9);
      // every bough leaves the trunk and runs out under the crown
      for (const b of trunk.slice(1)) {
        const box = b.box()!;
        expect(Math.hypot((box.max[0] + box.min[0]) / 2, (box.max[2] + box.min[2]) / 2), `seed ${seed}`).toBeGreaterThan(0.3);
        expect(box.min[1]).toBeGreaterThan(crown.min[1] - 0.5);
      }
    }
  });

  it("tapers to a point: wide low boughs, short ones near the top", () => {
    for (const seed of SEEDS) {
      const { foliage } = parts("high", seed), crown = boxOf(foliage), H = crown.max[1] - crown.min[1];
      // the widest reach of the foliage in each fifth of the crown's height
      const bands = [0, 0, 0, 0, 0];
      for (const g of foliage)
        for (let i = 0; i < g.count; i++) {
          const k = Math.min(4, Math.floor((g.y(i) - crown.min[1]) / H * 5));
          bands[k] = Math.max(bands[k]!, Math.hypot(g.x(i), g.z(i)));
        }
      for (let k = 1; k < 5; k++) expect(bands[k]!, `seed ${seed} band ${k}`).toBeLessThan(bands[k - 1]! * 1.05);
      expect(bands[4]!, `seed ${seed}`).toBeLessThan(bands[0]! * 0.45);
    }
  });

  it("varies its layout per seed, the same seed always the same tree", () => {
    const outline = (seed: string) => JSON.stringify(parts("high", seed).trunk.slice(1).map((g) => g.box()));
    expect(new Set(SEEDS.map(outline)).size).toBe(5);
    expect(JSON.stringify(parts("high", "3"))).toBe(JSON.stringify(parts("high", "3")));
  });

  it("keeps the low tree's tiers on the boughs' layout and coarse on low's box", () => {
    for (const seed of SEEDS) {
      const low = parts("low", seed), high = parts("high", seed), coarse = parts("coarse", seed);
      // the stem and four tier cones
      expect(low.trunk).toHaveLength(1);
      expect(low.foliage).toHaveLength(4);
      const a = boxOf([...low.trunk, ...low.foliage]), b = boxOf([...high.trunk, ...high.foliage]), c = boxOf([...coarse.trunk, ...coarse.foliage]);
      for (let k = 0; k < 3; k++) {
        expect(a.min[k]).toBeCloseTo(b.min[k]!, 4);
        expect(a.max[k]).toBeCloseTo(b.max[k]!, 4);
        expect(c.min[k]).toBeCloseTo(a.min[k]!, 4);
        expect(c.max[k]).toBeCloseTo(a.max[k]!, 4);
      }
      for (const g of [...low.foliage, ...coarse.foliage]) expect(closedOutward(g)).toBe(true);
    }
  });

  it("shades pad tops light and undersides dark", () => {
    let top = 0, topN = 0, under = 0, underN = 0;
    for (const g of parts("high", "1").foliage)
      for (let i = 0; i < g.count; i += 3) {
        const e1 = [g.x(i + 1) - g.x(i), g.y(i + 1) - g.y(i), g.z(i + 1) - g.z(i)], e2 = [g.x(i + 2) - g.x(i), g.y(i + 2) - g.y(i), g.z(i + 2) - g.z(i)];
        const ny = e1[2]! * e2[0]! - e1[0]! * e2[2]!, len = Math.hypot(e1[1]! * e2[2]! - e1[2]! * e2[1]!, ny, e1[0]! * e2[1]! - e1[1]! * e2[0]!);
        const green = (g.col![i * 3 + 1]! + g.col![i * 3 + 4]! + g.col![i * 3 + 7]!) / 3;
        if (ny / len > 0.6) { top += green; topN++; }
        if (ny / len < -0.6) { under += green; underN++; }
      }
    expect(top / topN).toBeGreaterThan((under / underN) * 1.5);
  });
});
