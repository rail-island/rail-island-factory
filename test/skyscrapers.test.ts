// Skyscraper-specific contracts; params.test.ts also compares every covered
// variant with its standalone browser model and checks determinism and flicker.
import { describe, expect, it } from "vitest";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { paramCombinations } from "../generator/design";
import { glbStats } from "../generator/glbStats";
import { parseGlb } from "../generator/glbTriangles";

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
      const standard = glbStats(d.build().toGlb(d.id));
      for (const [size, width, height] of [["compact", 0.85, 0.8], ["standard", 1, 1], ["landmark", 1.15, 1.25]] as const) {
        const m = d.build({ size });
        const s = glbStats(m.toGlb(d.id));
        expect(s.min[1]).toBe(0);
        expect(s.max[1]).toBeCloseTo(standard.max[1] * height, 4);
        for (const axis of [0, 2] as const) {
          expect(s.min[axis]).toBeCloseTo(standard.min[axis] * width, 4);
          expect(s.max[axis]).toBeCloseTo(standard.max[axis] * width, 4);
        }
        expect(s.max[1]).toBeGreaterThan(2 * Math.max(s.max[0] - s.min[0], s.max[2] - s.min[2]));
        expect(s.triangles).toBeLessThanOrEqual(10_000);
        expect(s.triangles).toBe(standard.triangles);
        const tree = m.sourceTree(d.id, d.title);
        for (const axis of [0, 1, 2] as const) {
          expect(Math.abs(tree.root.min![axis] - s.min[axis])).toBeLessThan(0.0006);
          expect(Math.abs(tree.root.max![axis] - s.max[axis])).toBeLessThan(0.0006);
        }
      }
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
