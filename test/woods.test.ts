// The woods types (generator/woods.ts): distribution functions keyed by name, the
// contract the game calls (generator/woodsApi.ts), and their standalone modules
// (generator/woodsExport.ts). Docs: docs/models/woods.md.

import { describe, expect, it } from "vitest";
import { WOODS } from "../generator/woods";
import { MAX_TREES_PER_CELL, cellSeed, draw, newSlot, same, type CellContext, type TreeSlot } from "../generator/woodsApi";
import { SPECIES } from "../generator/trees";
import { bundleWoods, woodsMeta } from "../generator/woodsExport";
import { WOODS_MODELS, woodsModelId } from "../generator/woodsModels";
import { glbStats } from "../generator/glbStats";

// Stored in the game's saved maps (by name): a shipped name is never renamed or removed.
const SHIPPED = [
  "pine-forest", "oak-woods", "mixed-woods", "scrub", "palms", "tropical-forest", "high-mountain-forest",
  "park", "scots-pine-woodland", "larch-woodland", "autumn-larch-woodland", "hazel-woodland-edge", "village-orchard",
];

const slots = (): TreeSlot[] => Array.from({ length: MAX_TREES_PER_CELL }, newSlot);

/** A deterministic sweep of contexts: plain interiors, edges, lone cells, slopes and heights. */
function* contexts(n = 3000): Generator<CellContext> {
  for (let i = 0; i < n; i++) {
    const r = (k: number) => draw(i * 7919 + 17, k);
    const full = (1 << 25) - 1;
    const mask = i % 5 === 0 ? full : i % 5 === 1 ? 1 << 12 : (Math.floor(r(1) * (1 << 25)) | (1 << 12));
    yield { gx: (i * 37) % 700 - 50, gz: Math.floor(i / 7), seed: 12345 + (i % 3), mask, slope: r(2) * 45, height: r(3) * 300 };
  }
}

describe("the woods contract", () => {
  it("keeps the hash the game has always placed trees with", () => {
    // the same vectors pin the game's copy (rail-island-webapp test/woodsFunctions.test.ts)
    expect(draw(0, 0)).toBe(0.08725423295982182);
    expect(draw(1, 0)).toBe(0.7090102224610746);
    expect(draw(12345, 7)).toBe(0.7266957920510322);
    expect(draw(-5, 3)).toBe(0.00643453374505043);
    expect(draw(0x7fffffff, 99)).toBe(0.25879242876544595);
    expect(cellSeed(10, 20, 42)).toBe(-66949952);
    expect(cellSeed(-3, 7, -99)).toBe(-741394733);
    expect(cellSeed(700, 700, 123456789)).toBe(97675669);
  });

  it("reads the neighbourhood mask by offset", () => {
    expect(same(1 << 12, 0, 0)).toBe(true);
    expect(same(1 << 12, 1, 0)).toBe(false);
    expect(same(1 << 13, 1, 0)).toBe(true);
    expect(same(1 << 0, -2, -2)).toBe(true);
    expect(same(1 << 24, 2, 2)).toBe(true);
  });
});

describe("the woods types", () => {
  it("ships every name it ever shipped, each once", () => {
    const names = WOODS.map((w) => w.design.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of SHIPPED) expect(names).toContain(n);
    for (const n of names) expect(n).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(WOODS.map((w) => [w.design.name, w.design] as const))("%s grows at most four valid trees a cell", (_, w) => {
    const out = slots();
    let trees = 0;
    for (const ctx of contexts()) {
      const n = w.distribute(ctx, out);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(MAX_TREES_PER_CELL);
      for (let i = 0; i < n; i++) {
        const t = out[i]!;
        expect(SPECIES as readonly string[]).toContain(t.species);
        expect(Math.abs(t.x)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(t.z)).toBeLessThanOrEqual(0.5);
        expect(t.height).toBeGreaterThan(0);
        expect(t.height).toBeLessThanOrEqual(60);
        expect(t.width).toBeGreaterThan(0.5);
        expect(t.width).toBeLessThan(1.6);
        expect(Math.abs(t.lean)).toBeLessThan(0.3);
        expect(t.shade).toBeGreaterThan(0.5);
        expect(t.shade).toBeLessThan(1.5);
        expect(Math.abs(t.hue)).toBeLessThanOrEqual(1);
      }
      trees += n;
    }
    expect(trees).toBeGreaterThan(0);
  });

  it.each(WOODS.map((w) => [w.design.name, w.design] as const))("%s is deterministic", (_, w) => {
    const a = slots(), b = slots();
    for (const ctx of contexts(400)) {
      const n = w.distribute(ctx, a);
      expect(w.distribute({ ...ctx }, b)).toBe(n);
      expect(b.slice(0, n)).toEqual(a.slice(0, n));
    }
  });

  it.each(WOODS.map((w) => [w.design.name, w.design] as const))("%s samples a tree for a row", (_, w) => {
    const out = newSlot();
    for (let i = 0; i < 50; i++) {
      w.sample(draw(i, 1), draw(i, 2), out);
      expect(SPECIES as readonly string[]).toContain(out.species);
      expect(out.height).toBeGreaterThan(0);
    }
  });
});

describe("relations between trees", () => {
  const wood = (name: string) => WOODS.find((w) => w.design.name === name)!.design;
  const FULL = (1 << 25) - 1;
  const stats = (name: string, mask: number, height = 20) => {
    const out = slots();
    let trees = 0, tall = 0, under = 0;
    for (let i = 0; i < 4000; i++) {
      const n = wood(name).distribute({ gx: i % 97, gz: Math.floor(i / 97), seed: 99, mask, slope: 0, height }, out);
      trees += n;
      for (let k = 0; k < n; k++) {
        tall += out[k]!.height;
        if (out[k]!.species === "bush" || out[k]!.species === "hazel") under++;
      }
    }
    return { perCell: trees / 4000, meanHeight: tall / trees, underShare: under / trees };
  };

  it("plants a forest denser inside than at its edge, with shorter trees and more shrubs at the edge", () => {
    const inside = stats("mixed-woods", FULL);
    const edge = stats("mixed-woods", 1 << 12 | 1 << 13 | 1 << 7);
    expect(inside.perCell).toBeGreaterThan(1.2);
    expect(inside.perCell).toBeGreaterThan(edge.perCell * 1.3);
    expect(edge.underShare).toBeGreaterThan(inside.underShare);
  });

  it("grows a pine forest denser than the classic one tree in every other cell", () => {
    expect(stats("pine-forest", FULL).perCell).toBeGreaterThan(1.1);
  });

  it("keeps a park thin, so the lawn shows", () => {
    expect(stats("park", FULL).perCell).toBeLessThan(0.35);
  });

  it("shrinks the mountain forest with height: a treeline", () => {
    expect(stats("high-mountain-forest", FULL, 200).meanHeight).toBeLessThan(stats("high-mountain-forest", FULL, 0).meanHeight * 0.85);
  });

  it("plants an orchard in rows: one tree at each cell's centre", () => {
    const out = slots();
    for (const ctx of contexts(500)) {
      const n = wood("village-orchard").distribute(ctx, out);
      expect(n).toBeLessThanOrEqual(1);
      if (n) expect(Math.hypot(out[0]!.x, out[0]!.z)).toBeLessThan(0.06);
    }
  });

  it("gathers the autumn larch woodland into golden and green groves", () => {
    // neighbouring cells mostly agree on their dominant larch; far apart they differ
    const out = slots();
    const golden = (gx: number, gz: number) => {
      const n = wood("autumn-larch-woodland").distribute({ gx, gz, seed: 7, mask: FULL, slope: 0, height: 20 }, out);
      let g = 0;
      for (let k = 0; k < n; k++) if (out[k]!.species === "autumnlarch") g++;
      return n ? g / n : 0.5;
    };
    let agree = 0, pairs = 0;
    for (let i = 0; i < 400; i++) {
      const gx = (i * 13) % 200, gz = Math.floor(i / 2) * 3;
      agree += Math.abs(golden(gx, gz) - golden(gx + 1, gz)) < 0.5 ? 1 : 0;
      pairs++;
    }
    expect(agree / pairs).toBeGreaterThan(0.6);
  });
});

describe("woods parameters", () => {
  const wood = (name: string) => WOODS.find((w) => w.design.name === name)!.design;
  const FULL = (1 << 25) - 1;
  const perCell = (name: string, values: Record<string, string>) => {
    const p = wood(name).variant(values);
    const out = slots();
    let trees = 0;
    for (let i = 0; i < 3000; i++) trees += p.distribute({ gx: i % 97, gz: Math.floor(i / 97), seed: 41, mask: FULL, slope: 0, height: 20 }, out);
    return trees / 3000;
  };

  it("gives every woods type a three-grade density first, then parameters of its own", () => {
    for (const { design } of WOODS) {
      expect(design.params[0]!.name, design.name).toBe("density");
      expect(design.params[0]!.values.map((v) => v.value)).toEqual(["sparse", "normal", "dense"]);
      expect(design.params[0]!.default).toBe("normal");
      expect(design.params.length, design.name).toBeGreaterThan(1);
      for (const p of design.params) {
        expect(p.values.map((v) => v.value), `${design.name} ${p.name}`).toContain(p.default);
        expect(new Set(p.values.map((v) => v.value)).size).toBe(p.values.length);
        for (const v of p.values) expect(v.value).toMatch(/^[a-z0-9]+$/);
      }
    }
  });

  it("plants more trees the denser the grade, for every woods type", () => {
    for (const { design } of WOODS) {
      const sparse = perCell(design.name, { density: "sparse" });
      const normal = perCell(design.name, {});
      const dense = perCell(design.name, { density: "dense" });
      expect(sparse, design.name).toBeLessThan(normal);
      expect(dense, design.name).toBeGreaterThan(normal);
    }
  });

  it("keeps the four-tree limit and valid trees for every combination of every type", () => {
    const out = slots();
    for (const { design } of WOODS) {
      let combos: Record<string, string>[] = [{}];
      for (const p of design.params) combos = combos.flatMap((c) => p.values.map((v) => ({ ...c, [p.name]: v.value })));
      for (const values of combos) {
        const planter = design.variant(values);
        for (const ctx of contexts(300)) {
          const n = planter.distribute(ctx, out);
          expect(n).toBeLessThanOrEqual(MAX_TREES_PER_CELL);
          for (let i = 0; i < n; i++) expect(SPECIES as readonly string[]).toContain(out[i]!.species);
        }
      }
    }
  });

  it("reads the defaults for missing, unknown or misspelt values, so a map from a later factory still grows", () => {
    const d = wood("pine-forest");
    expect(d.variant({})).toBe(d.variant({ density: "normal", age: "mature" }));
    expect(d.variant({ density: "huge", bogus: "x" })).toBe(d.variant());
  });

  it("changes what grows with a type's own parameter", () => {
    const species = (name: string, values: Record<string, string>) => {
      const p = wood(name).variant(values);
      const out = slots();
      const seen = new Map<string, number>();
      for (let i = 0; i < 2000; i++) {
        const n = p.distribute({ gx: i % 50, gz: Math.floor(i / 50), seed: 3, mask: FULL, slope: 0, height: 20 }, out);
        for (let k = 0; k < n; k++) seen.set(out[k]!.species, (seen.get(out[k]!.species) ?? 0) + 1);
      }
      return seen;
    };
    expect(species("autumn-larch-woodland", { season: "late" }).get("larch") ?? 0).toBe(0);
    expect(species("scrub", { trees: "none" }).get("oak") ?? 0).toBe(0);
    expect(species("park", { planting: "conifer" }).has("aspen")).toBe(false);
    const broad = species("mixed-woods", { mix: "broadleaf" }), conifer = species("mixed-woods", { mix: "conifer" });
    expect((broad.get("oak") ?? 0) / (broad.get("pine") ?? 1)).toBeGreaterThan((conifer.get("oak") ?? 0) / (conifer.get("pine") ?? 1) * 4);
  });
});

describe("the woods export", () => {
  it("lists every woods type and species, sorted, with no numeric ids", () => {
    const meta = woodsMeta();
    expect(meta.maxTreesPerCell).toBe(4);
    expect(meta.woods.map((w) => w.name)).toEqual([...meta.woods.map((w) => w.name)].sort());
    expect(meta.woods.map((w) => w.module)).toEqual(meta.woods.map((w) => `woods/${w.name}.js`));
    expect(meta.trees.map((t) => t.species).sort()).toEqual([...SPECIES].sort());
    expect(JSON.stringify(meta)).not.toMatch(/"id":\s*\d/);
    for (const w of meta.woods) expect(w.params[0]!.name, w.name).toBe("density");
  });

  it("bundles a standalone module that grows the same trees", async () => {
    const entry = WOODS.find((w) => w.design.name === "mixed-woods")!;
    const text = await bundleWoods(entry.source, entry.design.name);
    expect(text).not.toMatch(/\bimport\b/);
    expect(await bundleWoods(entry.source, entry.design.name)).toBe(text);
    const mod = await import(`data:text/javascript;base64,${Buffer.from(text).toString("base64")}`);
    expect(mod.woods.name).toBe("mixed-woods");
    expect(mod.MAX_TREES_PER_CELL).toBe(4);
    expect(mod.params.map((p: { name: string }) => p.name)).toEqual(["density", "mix"]);
    const dense = mod.variant({ density: "dense", mix: "conifer" });
    const own = entry.design.variant({ density: "dense", mix: "conifer" });
    const c = slots(), d = slots();
    for (const ctx of contexts(200)) {
      const n = own.distribute(ctx, c);
      expect(dense.distribute(ctx, d)).toBe(n);
      expect(d.slice(0, n)).toEqual(c.slice(0, n));
    }
    const a = slots(), b = slots();
    for (const ctx of contexts(300)) {
      const n = entry.design.distribute(ctx, a);
      expect(mod.distribute(ctx, b)).toBe(n);
      expect(b.slice(0, n)).toEqual(a.slice(0, n));
    }
  }, 30_000);
});

describe("the woods models (site catalog)", () => {
  it("is one proc-woods-<name> design per woods type, with the type's parameters", () => {
    expect(WOODS_MODELS.map((d) => d.id)).toEqual(WOODS.map(({ design }) => woodsModelId(design.name)));
    for (const d of WOODS_MODELS) {
      const w = WOODS.find(({ design }) => woodsModelId(design.name) === d.id)!.design;
      expect(d.catalog?.category).toBe("Woods");
      expect(d.params?.map((p) => p.name)).toEqual(w.params.map((p) => p.name));
      expect(d.params?.[0]?.name).toBe("density");
      for (const p of d.params ?? []) expect(p.values.map((v) => v.value)).toContain(p.default);
    }
  });

  it("builds every parameter choice, denser with density and within the LOD budget", () => {
    for (const d of WOODS_MODELS) {
      const [density, own] = d.params!;
      for (const { value: v } of own!.values) {
        const sparse = d.build({ density: "sparse", [own!.name]: v }).triangleCount();
        const dense = d.build({ density: "dense", [own!.name]: v }).triangleCount();
        expect(dense, `${d.id} ${v}`).toBeGreaterThan(sparse);
        expect(d.buildLod({ density: "dense", [own!.name]: v }).triangleCount(), `${d.id} ${v}`).toBeLessThanOrEqual(d.lodTriangles!);
      }
      expect(density!.values.map((v) => v.value)).toEqual(["sparse", "normal", "dense"]);
    }
  });

  it("stands on the ground and rejects unknown values, like every design", () => {
    for (const d of WOODS_MODELS) {
      const glb = d.build({ density: "dense" }).toGlb(d.id);
      // a leaning tree is lifted so its trunk's foot does not sink below the ground
      expect(glbStats(glb).min[1], d.id).toBeCloseTo(0, 5);
      expect(() => d.build({ variant: "nope" }), d.id).toThrow();
      expect(() => d.build({ density: "nope" }), d.id).toThrow();
    }
  });
});
