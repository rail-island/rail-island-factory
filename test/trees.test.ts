// The tree species (generator/trees.ts): three levels each, the budgets a forest
// can afford, and the envelope rules that make a level change invisible in outline.
// Docs: docs/models/trees.md.

import { describe, expect, it } from "vitest";
import { SPECIES, TREES, treeModelOf, treeParts, type Species, type TreeDetail } from "../generator/trees";
import type { MeshBuilder } from "../generator/meshBuilder";
import baseline from "./fixtures/tree-baseline.json";

const LEVELS: TreeDetail[] = ["coarse", "low", "high"];

function built(species: Species, detail: TreeDetail): MeshBuilder {
  const { id, params } = treeModelOf(species);
  const d = TREES.find((t) => t.id === id)!;
  return detail === "high" ? d.build(params) : detail === "low" ? d.buildLod(params) : d.buildCoarse!(params);
}

function bounds(m: MeshBuilder): { min: number[]; max: number[] } {
  const p = m.positions();
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i++) {
    min[i % 3] = Math.min(min[i % 3]!, p[i]!);
    max[i % 3] = Math.max(max[i % 3]!, p[i]!);
  }
  return { min, max };
}

describe("the tree species", () => {
  it("are the fourteen species the game's maps name", () => {
    expect([...SPECIES].sort()).toEqual(
      ["aspen", "autumnlarch", "birch", "bush", "deadtree", "hazel", "larch", "oak", "orchard", "palm", "pine", "scotspine", "spruce", "willow"],
    );
    // one design a species, but the autumn larch is the larch's autumn season
    expect(TREES.map((t) => t.id)).toEqual(SPECIES.filter((s) => s !== "autumnlarch").map((s) => `proc-tree-${s}`));
    expect(treeModelOf("autumnlarch")).toEqual({ id: "proc-tree-larch", params: { season: "autumn" } });
  });

  it("draws both larches from one design with a season", () => {
    const larch = TREES.find((t) => t.id === "proc-tree-larch")!;
    expect(larch.params?.map((p) => p.name)).toEqual(["season"]);
    expect(larch.build().toGlb("a")).toEqual(larch.build({ season: "summer" }).toGlb("a"));
    expect(larch.build({ season: "autumn" }).toGlb("a")).not.toEqual(larch.build().toGlb("a"));
    expect(() => larch.build({ season: "winter" })).toThrow();
  });

  // The game's budgets before the move (test/fixtures/tree-baseline.json, measured off
  // its own builder): low may grow 5%, high and coarse not at all, except the
  // redesigned oak's explicit 2,000-triangle allowance.
  it.each([...SPECIES])("keeps %s within the game's tree budgets", (species) => {
    const ref = baseline as Record<string, { tris: number }>;
    expect(built(species, "coarse").triangleCount()).toBeLessThanOrEqual(ref[`${species}:coarse`]!.tris);
    expect(built(species, "low").triangleCount()).toBeLessThanOrEqual(Math.floor(ref[`${species}:low`]!.tris * 1.05));
    expect(built(species, "high").triangleCount()).toBeLessThanOrEqual(species === "oak" ? 2000 : ref[`${species}:high`]!.tris);
  });

  it.each([...SPECIES])("bakes light and shade into %s at every level", (species) => {
    for (const detail of LEVELS) {
      const m = built(species, detail);
      expect(m.hasVertexColors(), `${species} ${detail}`).toBe(true);
    }
    if (species === "deadtree") return;
    // the crown's underside is darker than its top: the painted light the stylised look rests on
    const { foliage } = treeParts(species, "high");
    let top = 0, topN = 0, low = 0, lowN = 0;
    const ys = foliage.flatMap((g) => Array.from({ length: g.count }, (_, i) => g.y(i)));
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    for (const g of foliage) {
      for (let i = 0; i < g.count; i++) {
        const h = (g.y(i) - yMin) / (yMax - yMin);
        const k = g.col![i * 3 + 1]!;
        if (h > 0.75) { top += k; topN++; }
        if (h < 0.25) { low += k; lowN++; }
      }
    }
    expect(top / topN, species).toBeGreaterThan((low / lowN) * 1.2);
  });
});

describe("tree levels", () => {
  it.each([...SPECIES])("keeps %s cheap enough for a forest", (species) => {
    const coarse = built(species, "coarse").triangleCount();
    const low = built(species, "low").triangleCount();
    const high = built(species, "high").triangleCount();
    expect(coarse).toBeLessThanOrEqual(20);
    expect(low).toBeLessThanOrEqual(300);
    expect(high).toBeLessThanOrEqual(3000);
    expect(low / coarse).toBeGreaterThan(3);
    expect(high).toBeGreaterThan(low * 3);
  });

  it.each([...SPECIES])("grounds %s at y = 0 at every level", (species) => {
    for (const detail of LEVELS) {
      const b = bounds(built(species, detail));
      expect(b.min[1]!, `${species} ${detail}`).toBeGreaterThan(-0.001);
      expect(b.min[1]!, `${species} ${detail}`).toBeLessThan(0.001);
    }
  });

  it.each([...SPECIES])("keeps %s the same size at every level", (species) => {
    const low = bounds(built(species, "low"));
    const h = (b: { min: number[]; max: number[] }) => b.max[1]! - b.min[1]!;
    const w = (b: { min: number[]; max: number[] }) => Math.max(b.max[0]! - b.min[0]!, b.max[2]! - b.min[2]!);
    for (const detail of LEVELS) {
      const b = bounds(built(species, detail));
      expect(h(b) / h(low), `${species} ${detail} height`).toBeGreaterThan(0.9);
      expect(h(b) / h(low), `${species} ${detail} height`).toBeLessThan(1.1);
      expect(w(b) / w(low), `${species} ${detail} width`).toBeGreaterThan(0.89);
      expect(w(b) / w(low), `${species} ${detail} width`).toBeLessThan(1.11);
    }
  });

  it.each([...SPECIES])("reproduces %s's low envelope exactly at the coarse level", (species) => {
    const coarse = bounds(built(species, "coarse"));
    const low = bounds(built(species, "low"));
    for (let k = 0; k < 3; k++) {
      expect(coarse.min[k]!).toBeCloseTo(low.min[k]!, 4);
      expect(coarse.max[k]!).toBeCloseTo(low.max[k]!, 4);
    }
  });

  it.each([...SPECIES])("builds %s's coarse level from closed, outward-facing solids", (species) => {
    const { trunk, foliage } = treeParts(species, "coarse");
    for (const part of [...trunk, ...foliage]) {
      const p = part.pos;
      const key = (i: number) => [p[i]!, p[i + 1]!, p[i + 2]!].map((n) => Math.round(n * 1e5)).join(",");
      const edges = new Map<string, { count: number; balance: number }>();
      let volume = 0;
      for (let i = 0; i < p.length; i += 9) {
        const [ax, ay, az, bx, by, bz, cx, cy, cz] = p.slice(i, i + 9) as number[];
        volume += (ax! * (by! * cz! - bz! * cy!) - ay! * (bx! * cz! - bz! * cx!) + az! * (bx! * cy! - by! * cx!)) / 6;
        for (const [f, t] of [[i, i + 3], [i + 3, i + 6], [i + 6, i]] as const) {
          const ka = key(f), kb = key(t);
          const id = ka < kb ? `${ka}/${kb}` : `${kb}/${ka}`;
          const e = edges.get(id) ?? { count: 0, balance: 0 };
          e.count++;
          e.balance += ka < kb ? 1 : -1;
          edges.set(id, e);
        }
      }
      for (const e of edges.values()) expect(e).toEqual({ count: 2, balance: 0 });
      expect(volume).toBeGreaterThan(0);
    }
  });

  it("shades single-layer oak leaves, palm fronds and willow sprays on both faces", () => {
    for (const species of SPECIES) {
      for (const detail of LEVELS) {
        const ribbons = (detail !== "coarse" && (species === "palm" || species === "willow"))
          || (species === "oak" && detail === "high");
        expect(treeParts(species, detail).ribbons ?? false, `${species} ${detail}`).toBe(ribbons);
      }
    }
  });
});

describe("the shared trees module", () => {
  it("builds every species at every level with the designs' own triangles, in one standalone file", async () => {
    const { bundleTrees } = await import("../generator/woodsExport");
    const THREE = await import("three");
    const text = await bundleTrees();
    expect(text.replace(/^\/\/.*\n/, "")).not.toMatch(/\bimport\s*[\w{*"'(]/);
    expect(await bundleTrees()).toBe(text);
    const mod = await import(`data:text/javascript;base64,${Buffer.from(text).toString("base64")}`);
    expect([...mod.SPECIES].sort()).toEqual([...SPECIES].sort());
    for (const species of SPECIES) {
      for (const detail of LEVELS) {
        const group = mod.buildTree(THREE, species, detail);
        let n = 0;
        const names: string[] = [];
        group.traverse((o: { isMesh?: boolean; name: string; geometry?: { getAttribute(n: string): { count: number } } }) => {
          if (!o.isMesh) return;
          names.push(o.name);
          n += o.geometry!.getAttribute("position").count / 3;
        });
        expect(names.sort(), `${species} ${detail}`).toEqual(["foliage", "trunk"]);
        expect(n, `${species} ${detail}`).toBe(built(species, detail).triangleCount());
      }
    }
    expect(() => mod.buildTree(THREE, "baobab", "high")).toThrow();
    expect(() => mod.buildTree(THREE, "pine", "max")).toThrow(/only available for oak/);
    let maxTriangles = 0;
    mod.buildTree(THREE, "oak", "max").traverse((o: { isMesh?: boolean; geometry?: { getAttribute(n: string): { count: number } } }) => {
      if (o.isMesh) maxTriangles += o.geometry!.getAttribute("position").count / 3;
    });
    expect(maxTriangles).toBe(TREES.find((d) => d.id === "proc-tree-oak")!.buildMax!().triangleCount());
  }, 60_000);
});
