import { describe, expect, it } from "vitest";
import { coniferOptions, coniferParts } from "../generator/conifers";
import { TREE_SEED } from "../generator/treeKit";
import { boxOf } from "../generator/treeGeo";

// Test the reference's branch structure, not the old continuous fan skirts.
describe("spruce's open, layered crown", () => {
  it.each(TREE_SEED.values.map((v) => v.value))("supports the foliage on visible rising boughs for seed %s", (seed) => {
    for (const detail of ["high", "max"] as const) {
      const { trunk, foliage } = coniferParts("spruce", detail, coniferOptions({ seed }));
      // Supporting wood must be present at normal detail, all the way up the crown.
      const branches = trunk.slice(1).map((g) => g.box()!);
      expect(branches.length).toBeGreaterThanOrEqual(20);
      for (const [bottom, top] of [[1, 4], [4, 7], [7, 10]])
        expect(branches.some((b) => b.min[1] >= bottom! && b.max[1] <= top!)).toBe(true);
      const pads = foliage.map((g) => g.box()!);
      for (const branch of branches) {
        expect(branch.max[1] - branch.min[1]).toBeGreaterThan(0.04);
        expect(pads.some((p) => [0, 1, 2].every((axis) =>
          p.min[axis]! <= branch.max[axis]! && p.max[axis]! >= branch.min[axis]!))).toBe(true);
      }
      // The crown has volume, bare ground clearance, and a tapering pointed leader.
      expect(boxOf(foliage).min[1]).toBeGreaterThan(0.7);
      const lower = pads.filter((p) => p.max[1] < 5);
      const upper = pads.filter((p) => p.min[1] > 8);
      const reach = (boxes: typeof pads) => Math.max(...boxes.flatMap((b) => [Math.abs(b.min[0]), Math.abs(b.max[0]), Math.abs(b.min[2]), Math.abs(b.max[2])]));
      expect(reach(lower)).toBeGreaterThan(reach(upper) * 1.5);
      expect(lower.every((b) => b.max[1] - b.min[1] > 0.15)).toBe(true);
      expect(boxOf(foliage).max[1]).toBeGreaterThan(boxOf(trunk).max[1]);
    }
  });
});
