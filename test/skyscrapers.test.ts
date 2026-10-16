// Skyscraper-specific contracts; params.test.ts also compares every covered
// variant with its standalone browser model and checks determinism and flicker.
import { describe, expect, it } from "vitest";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { paramCombinations } from "../generator/design";
import { glbStats } from "../generator/glbStats";
import { parseGlb } from "../generator/glbTriangles";
import { type ScopeNode, type TreeNode } from "../generator/sourceTree";

/** Actual rendered extents, including any transforms, rather than primitive arguments. */
function scopes(node: TreeNode, names: readonly string[]): ScopeNode[] {
  if (!("children" in node)) return [];
  return [...(names.includes(node.name) ? [node] : []), ...node.children.flatMap((child) => scopes(child, names))];
}

function paneHeights(root: TreeNode): number[] {
  return [...new Set(scopes(root, ["facade panels"]).flatMap((group) => group.children.map((pane) =>
    Math.round((pane.max![1] - pane.min![1]) * 100) / 100,
  )))].sort((a, b) => a - b);
}

describe("parametric skyscrapers", () => {
  it("retain the ten shipped identities and offer 36 variants each", () => {
    expect(SKYSCRAPERS.map((d) => d.id)).toEqual([
      "sky-glass-office", "sky-art-deco", "sky-pagoda", "sky-brick-residential",
      "sky-twin-towers", "sky-twisted", "sky-dark-slab", "sky-bullet", "sky-terraced", "sky-pyramid",
    ]);
    for (const d of SKYSCRAPERS) expect(paramCombinations(d.params)).toHaveLength(36);
  });

  it("joins the bullet tower's tip to its last glass band", () => {
    const d = SKYSCRAPERS.find((d) => d.id === "sky-bullet")!;
    for (const size of ["compact", "standard", "landmark"]) {
      const tree = d.build({ size }).sourceTree(d.id, d.title);
      const bands = tree.root.children.find((n) => "name" in n && n.name === "glass bands")!;
      const tip = tree.root.children.find((n) => "name" in n && n.name === "tip")!;
      expect(tip.min![1]).toBe(bands.max![1]);
    }
  });

  for (const d of SKYSCRAPERS) {
    it(`${d.id}: each size stays grounded, tall and within 10,000 triangles`, () => {
      const variants = ["compact", "standard", "landmark"].map((size) => d.build({ size }));
      const stats = variants.map((m) => glbStats(m.toGlb(d.id)));
      expect(stats[0]!.max[1]).toBeLessThan(stats[1]!.max[1]);
      expect(stats[1]!.max[1]).toBeLessThan(stats[2]!.max[1]);
      // A larger building contains additional geometry, not stretched triangles.
      expect(stats[0]!.triangles).toBeLessThan(stats[1]!.triangles);
      expect(stats[1]!.triangles).toBeLessThan(stats[2]!.triangles);
      for (const [index, m] of variants.entries()) {
        const s = stats[index]!;
        expect(s.min[1]).toBe(0);
        expect(s.max[1]).toBeGreaterThan(2 * Math.max(s.max[0] - s.min[0], s.max[2] - s.min[2]));
        expect(s.triangles).toBeLessThanOrEqual(10_000);
        const tree = m.sourceTree(d.id, d.title);
        for (const axis of [0, 1, 2] as const) {
          expect(Math.abs(tree.root.min![axis] - s.min[axis])).toBeLessThan(0.0006);
          expect(Math.abs(tree.root.max![axis] - s.max[axis])).toBeLessThan(0.0006);
        }
      }
    });

    it(`${d.id}: size adds storeys with fixed pitch, window height and human-sized entrances`, () => {
      const base = d.build().sourceTree(d.id, d.title).root;
      const entrance = scopes(base, ["entrance"])[0]!;
      const groups = scopes(base, ["floor bands", "bands", "floors", "glass bands"]);
      const counts: number[] = [];
      expect(groups.length).toBeGreaterThan(0);
      for (const size of ["compact", "standard", "landmark"]) {
        const root = d.build({ size }).sourceTree(d.id, d.title).root;
        const entry = scopes(root, ["entrance"])[0]!;
        expect(entry.min).toEqual(entrance.min);
        expect(entry.max).toEqual(entrance.max);
        const door = entry.children.find((n) => "material" in n && n.material === "glassDark")!;
        expect(door.max![1] - door.min![1]).toBeCloseTo(3.5, 3);
        expect(paneHeights(root)).toEqual(paneHeights(base));
        const variantGroups = scopes(root, ["floor bands", "bands", "floors", "glass bands"]);
        counts.push(variantGroups.reduce((count, group) => count + group.children.length, 0));
        for (const group of variantGroups) {
          const original = groups.find((g) => g.id === group.id)!;
          expect(original).toBeDefined();
          if (group.children.length < 2 || original.children.length < 2) continue;
          const pitch = original.children[1]!.min![1] - original.children[0]!.min![1];
          for (let floor = 1; floor < group.children.length; floor++) {
            const actual = group.children[floor]!.min![1] - group.children[floor - 1]!.min![1];
            expect(actual).toBeCloseTo(pitch, 2);
          }
        }
      }
      expect(counts[0]).toBeLessThan(counts[1]!);
      expect(counts[1]).toBeLessThan(counts[2]!);
    });

    it(`${d.id}: finishes change colours without moving geometry or leaking palette state`, () => {
      const defaults = d.build().toGlb(d.id);
      const base = parseGlb(defaults);
      for (const name of d.finishParams!) {
        for (const value of d.params!.find((p) => p.name === name)!.values.filter((v) => v.value !== "original")) {
          const variant = parseGlb(d.build({ [name]: value.value }).toGlb(d.id));
          // The binary chunk contains all positions and normals; only JSON materials change.
          expect(Buffer.from(variant.bin).equals(Buffer.from(base.bin))).toBe(true);
          expect(variant.json.materials).not.toEqual(base.json.materials);
        }
      }
      expect(Buffer.from(d.build().toGlb(d.id)).equals(Buffer.from(defaults))).toBe(true);
      expect(() => d.build({ size: "enormous" })).toThrow(/no value/);
      expect(() => d.build({ colour: "blue" })).toThrow(/unknown parameter/);
    });
  }
});
