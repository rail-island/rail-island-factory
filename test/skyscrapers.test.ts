import { proceduralId } from "../generator/modelId.ts";
// Skyscraper-specific contracts; params.test.ts also compares every covered
// variant with its standalone browser model and checks determinism and flicker.
import { describe, expect, it } from "vitest";
import { SKYSCRAPERS, SKYSCRAPER_CATALOG } from "../generator/skyscrapers";
import { coverageCombinations, paramCombinations } from "../generator/design";
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

const SIZES = ["compact", "medium", "standard", "landmark"];
const HEIGHTS = [50, 60, 70, 80];

/** Plan extent of the main massing (everything but the entrance canopy, which stands in front). */
function planArea(root: TreeNode): number {
  const parts = root.children.filter((n) => !("name" in n && n.name === "entrance"));
  const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  for (const n of parts) for (const [i, axis] of [0, 2].entries()) {
    lo[i] = Math.min(lo[i]!, n.min![axis]!);
    hi[i] = Math.max(hi[i]!, n.max![axis]!);
  }
  return (hi[0]! - lo[0]!) * (hi[1]! - lo[1]!);
}

describe("parametric skyscrapers", () => {
  it("are their own Skyscrapers category, apart from the commercial buildings", () => {
    expect(SKYSCRAPER_CATALOG.category).toBe("Skyscrapers");
  });

  it("retire the low-rise size to the 50 m tower", () => {
    const d = SKYSCRAPERS[0]!;
    expect(d.params!.find((p) => p.name === "size")!.values.map((v) => v.value)).toEqual(SIZES);
    expect(Buffer.from(d.build({ size: "lowrise" }).toGlb(d.id)).equals(Buffer.from(d.build({ size: "compact" }).toGlb(d.id)))).toBe(true);
  });

  it("retain the ten shipped identities and offer four heights and design-specific variants", () => {
    expect(SKYSCRAPERS.map((d) => proceduralId(d.id))).toEqual([
      "proc-building-sky-glass-office", "proc-building-sky-art-deco", "proc-building-sky-pagoda", "proc-building-sky-brick-residential",
      "proc-building-sky-twin-towers", "proc-building-sky-twisted", "proc-building-sky-dark-slab", "proc-building-sky-bullet", "proc-building-sky-terraced", "proc-building-sky-pyramid",
    ]);
    for (const d of SKYSCRAPERS) expect(paramCombinations(d.params)).toHaveLength(proceduralId(d.id) === "proc-building-sky-terraced" ? 576 : proceduralId(d.id) === "proc-building-sky-twisted" ? 144 : 48);
  });

  it("joins the bullet tower's tip to its last glass band", () => {
    const d = SKYSCRAPERS.find((d) => proceduralId(d.id) === "proc-building-sky-bullet")!;
    for (const size of SIZES) {
      const tree = d.build({ size }).sourceTree(d.id, d.title);
      const bands = tree.root.children.find((n) => "name" in n && n.name === "glass bands")!;
      const tip = tree.root.children.find((n) => "name" in n && n.name === "tip")!;
      expect(tip.min![1]).toBe(bands.max![1]);
    }
  });

  it("terrace count and use change actual decks and furniture", () => {
    const d = SKYSCRAPERS.find((d) => proceduralId(d.id) === "proc-building-sky-terraced")!;
    for (const terraces of ["3", "4", "5", "6"]) {
      for (const terraceUse of ["gardens", "seating", "solar"]) {
        const root = d.build({ terraces, terraceUse }).sourceTree(d.id, d.title).root;
        expect(scopes(root, ["terrace"])).toHaveLength(Number(terraces));
        expect(scopes(root, ["bench"])).toHaveLength(terraceUse === "seating" ? Number(terraces) * 3 : 0);
        expect(scopes(root, ["solar panel"])).toHaveLength(terraceUse === "solar" ? Number(terraces) * 3 : 0);
        expect(scopes(root, ["planter"])).toHaveLength(terraceUse === "gardens" ? Number(terraces) * 2 : 0);
      }
    }
  });

  it("twist changes floor orientation without changing height or floor count", () => {
    const d = SKYSCRAPERS.find((d) => proceduralId(d.id) === "proc-building-sky-twisted")!;
    const variants = ["straight", "quarter", "half"].map((twist) => d.build({ twist }));
    const stats = variants.map((m) => glbStats(m.toGlb(d.id)));
    expect(new Set(stats.map((s) => s.max[1])).size).toBe(1);
    expect(new Set(stats.map((s) => s.triangles)).size).toBe(1);
    const bytes = variants.map((m) => Buffer.from(m.toGlb(d.id)).toString("base64"));
    expect(new Set(bytes).size).toBe(3);
  });

  for (const d of SKYSCRAPERS) {
    it(`${d.id}: every shape combination respects the triangle budget`, () => {
      for (const combo of coverageCombinations(d.params, d.finishParams)) {
        const stats = glbStats(d.build(combo).toGlb(d.id));
        expect(stats.triangles, JSON.stringify(combo)).toBeLessThanOrEqual(10_000);
      }
    });

    it(`${d.id}: each size reaches its height on a smaller footprint, grounded and within budget`, () => {
      const variants = SIZES.map((size) => d.build({ size }));
      const stats = variants.map((m) => glbStats(m.toGlb(d.id)));
      const areas = variants.map((m) => planArea(m.sourceTree(d.id, d.title).root));
      for (let i = 1; i < stats.length; i++) {
        expect(stats[i]!.max[1]).toBeGreaterThan(stats[i - 1]!.max[1]);
        expect(stats[i]!.triangles).toBeGreaterThan(stats[i - 1]!.triangles);
        expect(areas[i]).toBeGreaterThan(areas[i - 1]! * 1.1);
      }
      for (const [index, m] of variants.entries()) {
        const s = stats[index]!;
        expect(s.min[1]).toBe(0);
        expect(Math.abs(s.max[1] - HEIGHTS[index]!), SIZES[index]).toBeLessThanOrEqual(2.5);
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
      const extent = (n: TreeNode): number[] => [0, 1, 2].map((a) => Math.round((n.max![a]! - n.min![a]!) * 1000) / 1000);
      const groups = scopes(base, ["floor bands", "bands", "floors", "glass bands"]);
      const pitches = new Map(groups.filter((g) => g.children.length >= 2).map((g) => [g.id.replace(/\d+/g, "#"), g.children[1]!.min![1] - g.children[0]!.min![1]]));
      const counts: number[] = [];
      expect(groups.length).toBeGreaterThan(0);
      for (const size of SIZES) {
        const root = d.build({ size }).sourceTree(d.id, d.title).root;
        const entry = scopes(root, ["entrance"])[0]!;
        expect(extent(entry)).toEqual(extent(entrance));
        expect(entry.min![1]).toBe(entrance.min![1]);
        const door = entry.children.find((n) => "material" in n && n.material === "glassDark")!;
        expect(door.max![1] - door.min![1]).toBeCloseTo(3.5, 3);
        expect(paneHeights(root)).toEqual(paneHeights(base));
        const variantGroups = scopes(root, ["floor bands", "bands", "floors", "glass bands"]);
        counts.push(variantGroups.reduce((count, group) => count + group.children.length, 0));
        for (const group of variantGroups) {
          const pitch = pitches.get(group.id.replace(/\d+/g, "#"));
          if (group.children.length < 2 || pitch === undefined) continue;
          for (let floor = 1; floor < group.children.length; floor++) {
            const actual = group.children[floor]!.min![1] - group.children[floor - 1]!.min![1];
            expect(actual).toBeCloseTo(pitch, 2);
          }
        }
      }
      for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]!);
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
