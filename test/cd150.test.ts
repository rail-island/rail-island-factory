import { describe, it, expect } from "vitest";
import { cd150, CD150_NUMBER } from "../generator/cd150.ts";
import { cd150Comparison } from "../generator/cd150Comparison.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import {
  isLeaf,
  type TreeNode,
  type LeafNode,
} from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
describe("CD 150 transfer", () => {
  it("matches the independently annotated native front and both side elevations", () => {
    const rows = cd150Comparison();
    expect(rows).toHaveLength(39);
    expect(new Set(rows.map((r) => r.id)).size).toBe(39);
    for (const row of rows) {
      for (let i = 0; i < 4; i++) {
        expect(
          Math.abs(row.model[i]! - row.source[i]!),
          `${row.id} component ${i}`,
        ).toBeLessThanOrEqual(row.tolerancePixels);
      }
    }
  });
  it("preserves the XML cab rake, 8.4 m bogie centres and four standard-gauge wheelsets", () => {
    const mesh = cd150(),
      nodes = leaves(mesh.sourceTree("test", "Test").root);
    const { json, bin } = parseGlb(mesh.toGlb("test"));
    const tris = collectTriangles(json, bin);
    const points = tris
      .filter((t) => t.material === "cream")
      .flatMap((t) => t.p);
    // Independent source XML has a 1 m setback from the nose to y=3.9.
    for (const e of [-1, 1]) {
      const at = (y: number) =>
        Math.max(
          ...points
            .filter((p) => Math.abs(p[1] - y) < 1e-5)
            .map((p) => e * p[0]),
        );
      expect(at(1.9)).toBeCloseTo(8, 4);
      expect(at(3.7)).toBeLessThan(7.2);
    }
    // Inspect geometry rather than relying on primitive argument naming.
    const treads = nodes.filter(
      (n) =>
        n.id.startsWith("bogies/") &&
        n.material === "steel" &&
        n.max![1] - n.min![1] > 1.2,
    );
    expect(treads).toHaveLength(8);
    const axleX = [
      ...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3))),
    ]
      .map(Number)
      .sort((a, b) => a - b);
    expect(axleX).toEqual([-5.9, -2.6, 2.5, 5.8]);
    expect((axleX[2]! + axleX[3]! - axleX[0]! - axleX[1]!) / 2).toBeCloseTo(
      8.4,
    );
    for (const n of treads) expect(n.min![1]).toBeCloseTo(0, 5);
    const innerEdges = treads.map((n) =>
      Math.min(Math.abs(n.min![2]), Math.abs(n.max![2])),
    );
    innerEdges.forEach((z) => expect(z).toBeCloseTo(0.665, 4));
  });
  it("unfolds one collector with connected arms of equal length in both poses", () => {
    const mesh = cd150(),
      nodes = leaves(mesh.sourceTree("test", "Test").root);
    const { json, bin } = parseGlb(mesh.toGlb("test"));
    const tris = collectTriangles(json, bin).filter(
      (t) => t.material === "pantograph",
    );
    const lengths: number[] = [];
    for (const name of ["rear-pantograph", "front-pantograph"]) {
      const prefix = `roof-equipment/pantographs/${name}`;
      const heads = nodes.filter(
        (n) => n.id.startsWith(prefix + "/head/") && n.material === "carbon",
      );
      expect(heads).toHaveLength(2);
      const top = Math.max(...heads.map((n) => n.max![1]));
      expect(top).toBeCloseTo(name === "rear-pantograph" ? 6.24 : 4.64, 3);
      for (const head of heads)
        expect(head.max![1] - head.min![1]).toBeCloseTo(0.05, 4);
      const arms = nodes.filter((n) => n.id.startsWith(prefix + "/arms/"));
      expect(arms).toHaveLength(4);
      const ends = arms.map((n) => {
        const ps = tris
          .slice(n.tri[0], n.tri[0] + n.tri[1])
          .flatMap((t) => t.p);
        return [
          Math.min(...ps.map((p) => p[0])),
          Math.max(...ps.map((p) => p[0])),
        ].map((x) => {
          const unique = new Map(
            ps
              .filter((p) => Math.abs(p[0] - x) < 1e-5)
              .map((p) => [p.join(","), p]),
          );
          const pts = [...unique.values()];
          return [
            x,
            ...[1, 2].map(
              (k) => pts.reduce((sum, p) => sum + p[k]!, 0) / pts.length,
            ),
          ];
        });
      });
      for (const [a, b] of ends)
        lengths.push(Math.hypot(...a!.map((v, i) => v - b![i]!)));
      for (const [lower, upper] of [
        [0, 1],
        [2, 3],
      ]) {
        const pairs = ends[lower!]!.flatMap((a) =>
          ends[upper!]!.map((b) => Math.hypot(...a.map((v, i) => v - b[i]!))),
        );
        expect(Math.min(...pairs)).toBeLessThan(1e-4);
      }
    }
    lengths.forEach((l) => expect(l).toBeCloseTo(Math.hypot(1.66, 0.26), 4));
  });
  it("carries a full running number with a valid check digit", () => {
    expect(CD150_NUMBER).toMatch(/^150 \d{3}-\d$/);
    const digits = [...CD150_NUMBER.replace(/\D/g, "")].map(Number);
    // Weights 2, 1, 2, ... from the right of the six digits; digit sums of products.
    const sum = digits
      .slice(0, 6)
      .reverse()
      .reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
    expect((10 - (sum % 10)) % 10).toBe(digits[6]);
  });
  it("lowers the green side skirt between the bogies", () => {
    const mesh = cd150();
    const { json, bin } = parseGlb(mesh.toGlb("test"));
    const green = collectTriangles(json, bin)
      .filter((t) => t.material === "green")
      .flatMap((t) => t.p);
    const lowest = (x0: number, x1: number) =>
      Math.min(
        ...green
          .filter((p) => Math.abs(p[0]) >= x0 - 1e-4 && Math.abs(p[0]) <= x1 + 1e-4)
          .map((p) => p[1]),
      );
    // Native side BMPs: the green drops 0.6 m above rail over source x=7.4..9.6.
    expect(lowest(0, 1.1)).toBeCloseTo(0.6, 4);
    expect(lowest(2.1, 7)).toBeGreaterThanOrEqual(1.2 - 1e-6);
  });
});
