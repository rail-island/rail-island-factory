// The leafy broadleaf species (generator/leafyTrees.ts on the broadleaf kit):
// every seed at every level within its budgets, grounded, deterministic, free of
// flicker and the same size; leaves rooted in their clumps; the standalone JS.
// Docs: docs/models/trees.md.
import { describe, expect, it } from "vitest";
import { LEAFY_PARAMS, LEAFY_SPECIES, leafyOptions, leafyParts } from "../generator/leafyTrees";
import { TREES } from "../generator/trees";
import type { Geo } from "../generator/treeGeo";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { bundleDesign } from "../generator/jsModel";
import { parseGlb, collectTriangles } from "../generator/glbTriangles";
import baseline from "./fixtures/tree-baseline.json";

const SEEDS = LEAFY_PARAMS[0]!.values.map((v) => v.value);
const design = (species: string) => TREES.find((d) => d.id === `proc-tree-${species}`)!;
const ref = baseline as Record<string, { tris: number }>;

describe.each([...LEAFY_SPECIES])("the chunked %s", (species) => {
  // The shipped full and coarse allowances stay; low may grow 5%, within the family's 300.
  const budgets = {
    high: ref[`${species}:high`]!.tris, low: Math.min(300, Math.floor(ref[`${species}:low`]!.tris * 1.05)),
    coarse: 20, max: 10000,
  };

  it.each(SEEDS)("keeps seed %s in budget, grounded, deterministic and free of flicker at all levels", (seed) => {
    const d = design(species);
    let highBox: ReturnType<typeof glbStats> | undefined;
    for (const [build, budget] of [[d.build, budgets.high], [d.buildLod, budgets.low], [d.buildCoarse!, budgets.coarse], [d.buildMax!, budgets.max]] as const) {
      const glb = build({ seed }).toGlb(species), stats = glbStats(glb);
      expect(stats.triangles).toBeLessThanOrEqual(budget);
      expect(stats.materials).toBe(2);
      expect(stats.primitives).toBe(2);
      expect(stats.min[1]).toBeCloseTo(0, 6);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      expect(build({ seed }).toGlb(species)).toEqual(glb);
      if (!highBox) highBox = stats;
      for (let k = 0; k < 3; k++) {
        expect(stats.min[k]).toBeCloseTo(highBox.min[k]!, 4);
        expect(stats.max[k]).toBeCloseTo(highBox.max[k]!, 4);
      }
      const { json, bin } = parseGlb(glb);
      for (const tri of collectTriangles(json, bin)) {
        expect(tri.p.flat().every(Number.isFinite)).toBe(true);
        for (const n of tri.n) expect(Math.hypot(...n)).toBeCloseTo(1, 5);
      }
    }
  });

  it("draws five different trees, one per seed", () => {
    const shapes = SEEDS.map((seed) => JSON.stringify(design(species).build({ seed }).positions()));
    expect(new Set(shapes).size).toBe(5);
  });

  it("roots every leaf in a clump core and holds every low mass on wood", () => {
    const corners = (g: Geo) => Array.from({ length: g.count }, (_, i) => [g.x(i), g.y(i), g.z(i)] as const);
    for (const seed of SEEDS) {
      for (const level of ["high", "max"] as const) {
        const { foliage } = leafyParts(species, level, leafyOptions({ seed }));
        const cores = foliage.filter((g) => g.count === 60).map((g) => {
          const pts = corners(g), c = [0, 1, 2].map((k) => pts.reduce((n, p) => n + p[k]!, 0) / pts.length);
          return { c, r: Math.max(...pts.map((p) => Math.hypot(p[0] - c[0]!, p[1] - c[1]!, p[2] - c[2]!))) };
        });
        expect(cores.length).toBeGreaterThan(0);
        const reach = level === "max" ? 1.15 : 1;
        for (const leaf of foliage.filter((g) => g.count !== 60)) {
          const base = [leaf.x(0), leaf.y(0), leaf.z(0)];
          const rooted = cores.some(({ c, r }) => Math.hypot(base[0]! - c[0]!, base[1]! - c[1]!, base[2]! - c[2]!) <= r * reach);
          // Willow curtains hang by design: straight under a clump, never beside the crown.
          const hanging = species === "willow" && cores.some(({ c, r }) => base[1]! < c[1]! && Math.hypot(base[0]! - c[0]!, base[2]! - c[2]!) <= r * 1.9);
          expect(rooted || hanging, `${level} seed ${seed}`).toBe(true);
        }
      }
      const low = leafyParts(species, "low", leafyOptions({ seed }));
      const boxes = low.foliage.filter((g) => (g.count / 3) % 4 === 0).map((g) => g.box()!);
      const within = (b: { min: number[]; max: number[] }) => (p: readonly number[]) => [0, 1, 2].every((k) => p[k]! >= b.min[k]! && p[k]! <= b.max[k]!);
      // Points spread over every face: a long trunk face can cross a mass between its corners.
      const samples = (g: Geo) => corners(g).flatMap((_, i, all) => i % 3 ? [] : [0, 0.25, 0.5, 0.75, 1].flatMap((u) => [0, 0.5, 1].map((v) =>
        [0, 1, 2].map((k) => all[i]![k]! + (all[i + 1]![k]! - all[i]![k]!) * u + (all[i + 2]![k]! - all[i + 1]![k]!) * u * v))));
      // Every limb ends in a mass, and every mass holds wood: nothing floats.
      for (const wood of low.trunk.slice(1)) expect(boxes.some((b) => samples(wood).some(within(b))), `low limb, seed ${seed}`).toBe(true);
      // A mass may instead rest in another supported mass (the bush's top on its mound).
      const held = boxes.map((b) => low.trunk.some((wood) => samples(wood).some(within(b))));
      const overlap = (a: typeof boxes[0], b: typeof boxes[0]) => [0, 1, 2].every((k) => a.min[k]! <= b.max[k]! && b.min[k]! <= a.max[k]!);
      for (let pass = 0; pass < boxes.length; pass++)
        boxes.forEach((b, i) => { held[i] ||= boxes.some((o, j) => held[j] && j !== i && overlap(b, o)); });
      expect(held.every(Boolean), `low mass, seed ${seed}`).toBe(true);
    }
  });

  it("exports the seeded tree and its Max detail as two merged meshes matching the generator", async () => {
    const THREE = await import("three");
    const source = await bundleDesign(design(species), "trees.ts");
    const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    expect(mod.maxTriangleBudget).toBe(10000);
    for (const seed of SEEDS) for (const max of [false, true]) {
      const group = max ? mod.buildMax(THREE, { seed }) : mod.default(THREE, { seed });
      const meshes: import("three").Mesh[] = [];
      group.traverse((o: import("three").Object3D) => { if ((o as import("three").Mesh).isMesh) meshes.push(o as import("three").Mesh); });
      expect(meshes).toHaveLength(2);
      const want = (max ? design(species).buildMax! : design(species).build)({ seed }).triangleCount();
      expect(meshes.reduce((n, m) => n + m.geometry.getAttribute("position").count / 3, 0)).toBe(want);
    }
  }, 60_000);
});
