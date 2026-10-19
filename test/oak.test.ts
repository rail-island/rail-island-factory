import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { OAK_PARAMS, oakOptions, oakParts } from "../generator/oak";
import { treeOak, treeOakLow, treeOakCoarse, treeOakMax, TREES } from "../generator/trees";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { bundleDesign } from "../generator/jsModel";
import { parseGlb, collectTriangles } from "../generator/glbTriangles";

const variants = paramCombinations(OAK_PARAMS);

describe("reference oak", () => {
  it.each(variants)("keeps %j in budget, grounded, deterministic and free of flicker at all levels", (p) => {
    let highBox: ReturnType<typeof glbStats> | undefined;
    for (const [build, budget] of [[treeOak, 2000], [treeOakLow, 218], [treeOakCoarse, 20], [treeOakMax, 10000]] as const) {
      const glb = build(p).toGlb("oak"), stats = glbStats(glb);
      expect(stats.triangles).toBeLessThanOrEqual(budget);
      expect(stats.materials).toBe(2);
      expect(stats.primitives).toBe(2);
      expect(stats.min[1]).toBe(0);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      expect(build(p).toGlb("oak")).toEqual(glb);
      if (!highBox) highBox = stats;
      for (let k = 0; k < 3; k++) {
        expect(stats.min[k]).toBeCloseTo(highBox.min[k]!, 5);
        expect(stats.max[k]).toBeCloseTo(highBox.max[k]!, 5);
      }
      const { json, bin } = parseGlb(glb);
      for (const tri of collectTriangles(json, bin)) {
        expect(tri.p.flat().every(Number.isFinite)).toBe(true);
        for (const n of tri.n) expect(Math.hypot(...n)).toBeCloseTo(1, 5);
      }
    }
  });

  it("offers five numbered seeds while preserving the two previously saved variants", () => {
    expect(OAK_PARAMS[0]!.values.map((v) => [v.value, v.title])).toEqual(["1", "2", "3", "4", "5"].map((s) => [s, s]));
    for (const [old, seed] of [["7", "1"], ["19", "2"]]) {
      for (const build of [treeOak, treeOakLow, treeOakCoarse, treeOakMax])
        expect(build({ seed: old! }).toGlb("oak")).toEqual(build({ seed: seed! }).toGlb("oak"));
    }
    const positions = OAK_PARAMS[0]!.values.map(({value}) => JSON.stringify(treeOak({ seed: value }).positions()));
    expect(new Set(positions).size).toBe(5);
  });

  it("spends Max detail on lumpier clumps of faceted leaves and finer wood without changing the tree's envelope", () => {
    const max = oakParts("max");
    expect(max.foliage.filter((g) => g.count / 3 === 20)).toHaveLength(39);
    expect(max.foliage.filter((g) => g.count / 3 === 4)).toHaveLength(1950);
    expect(max.trunk.reduce((n, g) => n + g.count / 3, 0)).toBe(794);
    expect(treeOakMax().triangleCount()).toBe(9374);
    expect(treeOakMax({ foliage: "airy" }).triangleCount()).toBe(7554);
    expect(TREES.filter((d) => d.buildMax).map((d) => d.id)).toEqual(["proc-tree-oak"]);
  });

  it("builds thirteen clumps of 48 folded leaves each, with an airy option of 36", () => {
    const full = oakParts("high"), airy = oakParts("high", oakOptions({ foliage: "airy" }));
    expect(full.foliage.filter((g) => g.count / 3 === 20)).toHaveLength(13);
    expect(full.foliage.filter((g) => g.count / 3 === 2)).toHaveLength(624);
    expect(airy.foliage.filter((g) => g.count / 3 === 2)).toHaveLength(468);
    expect(oakParts("low").foliage).toHaveLength(13);
    expect(treeOak().triangleCount()).toBe(1886);
    expect(full.ribbons).toBe(true);
  });

  it("makes every control effective and keeps the trunk foot at the origin", () => {
    const base = treeOak().positions();
    for (const p of [{ seed: "19" }, { height: "tall" }, { canopy: "compact" }, { branches: "upright" }, { foliage: "airy" }] as ParamValues[]) {
      expect(treeOak(p).positions()).not.toEqual(base);
    }
    for (const level of ["high", "low", "coarse"] as const) {
      const foot = oakParts(level).trunk[0]!;
      const bottom = Array.from({ length: foot.count }, (_, i) => i).filter((i) => foot.y(i) === 0);
      expect(Math.min(...bottom.map((i) => foot.x(i)))).toBeLessThan(0);
      expect(Math.max(...bottom.map((i) => foot.x(i)))).toBeGreaterThan(0);
    }
  });

  it("exports the parameterized oak as two merged meshes matching the generator", async () => {
    const THREE = await import("three");
    const design = TREES.find((d) => d.id === "proc-tree-oak")!;
    const source = await bundleDesign(design, "trees.ts");
    const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    expect(mod.maxTriangleBudget).toBe(10000);
    for (const p of variants) for (const max of [false, true]) {
      const group = max ? mod.buildMax(THREE, p) : mod.default(THREE, p);
      const meshes: import("three").Mesh[] = [];
      group.traverse((o: import("three").Object3D) => { if ((o as import("three").Mesh).isMesh) meshes.push(o as import("three").Mesh); });
      expect(meshes).toHaveLength(2);
      expect(meshes.reduce((n, m) => n + m.geometry.getAttribute("position").count / 3, 0)).toBe((max ? treeOakMax : treeOak)(p).triangleCount());
      const leaves = meshes.find((m) => m.name === "foliage")!;
      expect((leaves.material as import("three").Material).side).toBe(THREE.DoubleSide);
    }
  });
});
