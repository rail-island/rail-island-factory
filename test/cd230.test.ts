import { describe, it, expect } from "vitest";
import { cd230, CD230_LIVERIES, CD230_PARAMS } from "../generator/cd230.ts";
import { cd230Comparison } from "../generator/cd230Comparison.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
function triangles(params?: Record<string, string>) {
  const mesh = cd230(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree("test", "Test").root) };
}
type Tri = ReturnType<typeof triangles>["tris"][number];
/**
 * The materials a ray meets at (u, y), outermost first, walking in from far
 * along the horizontal direction (cos a, 0, sin a) reversed: u runs across the
 * ray in the horizontal plane.
 */
function hits(tris: Tri[], a: number, u: number, y: number): string[] {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const out: Array<[number, string]> = [];
  for (const t of tris) {
    // depth along (c, s), across along (-s, c)
    const q = t.p.map((p) => [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]);
    const [A, B, C] = q as [number[], number[], number[]];
    const den = (B[1]! - C[1]!) * (A[2]! - C[2]!) + (C[2]! - B[2]!) * (A[1]! - C[1]!);
    if (Math.abs(den) < 1e-12) continue;
    const w0 = ((B[1]! - C[1]!) * (u - C[2]!) + (C[2]! - B[2]!) * (y - C[1]!)) / den;
    const w1 = ((C[1]! - A[1]!) * (u - C[2]!) + (A[2]! - C[2]!) * (y - C[1]!)) / den;
    if (w0 < 0 || w1 < 0 || w0 + w1 > 1) continue;
    out.push([w0 * A[0]! + w1 * B[0]! + (1 - w0 - w1) * C[0]!, t.material]);
  }
  return out.sort((p, q) => q[0] - p[0]).map((h) => h[1]);
}

describe("CD 230 laminatka transfer", () => {
  it("matches the independently annotated native fronts and sides within the stated pixel tolerances", () => {
    const rows = cd230Comparison();
    expect(rows).toHaveLength(77);
    expect(new Set(rows.map((r) => r.id)).size).toBe(77);
    for (const row of rows)
      for (let i = 0; i < 4; i++)
        expect(Math.abs(row.model[i]! - row.source[i]!), `${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
  });

  it("is 16.44 m over the buffers on four standard-gauge wheelsets, 7.80 m pivots and 2.80 m wheelbase", () => {
    const { tris, nodes } = triangles();
    const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
    expect(Math.max(...xs)).toBeCloseTo(8.22, 5);
    expect(Math.min(...xs)).toBeCloseTo(-8.22, 5);
    const treads = nodes.filter((n) => n.id.startsWith("bogies/") && n.material === "steel" && n.max![1] - n.min![1] > 1.2);
    expect(treads).toHaveLength(8);
    const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
    expect(axles).toEqual([-5.3, -2.5, 2.5, 5.3]);
    for (const n of treads) {
      expect(n.min![1]).toBeCloseTo(0, 5);
      expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
    }
  });

  it("keeps the body and fixed roof equipment inside the 3.1 m by 4.7 m envelope", () => {
    for (const livery of Object.keys(CD230_LIVERIES)) {
      const { nodes } = triangles({ livery });
      const fixed = nodes.filter((n) => !n.id.startsWith("roof-equipment/pantographs/rear-pantograph/arms") && !n.id.startsWith("roof-equipment/pantographs/rear-pantograph/head"));
      expect(Math.max(...fixed.map((n) => n.max![1])), livery).toBeLessThanOrEqual(4.7);
      expect(Math.max(...nodes.map((n) => Math.max(Math.abs(n.min![2]), Math.abs(n.max![2])))), livery).toBeLessThanOrEqual(1.55);
      expect(Math.max(...nodes.map((n) => n.max![1])), livery).toBeLessThanOrEqual(6.5);
    }
  });

  it("raises the rear diamond pantograph and folds the front one, with level collectors and equal arms", () => {
    const { tris, nodes } = triangles();
    const tops: number[] = [];
    const lengths: number[] = [];
    for (const name of ["rear-pantograph", "front-pantograph"]) {
      const prefix = `roof-equipment/pantographs/${name}`;
      const heads = nodes.filter((n) => n.id.startsWith(prefix + "/head/") && n.material === "carbon");
      expect(heads).toHaveLength(2);
      for (const h of heads) expect(h.max![1] - h.min![1]).toBeCloseTo(0.05, 5);
      tops.push(Math.max(...heads.map((n) => n.max![1])));
      // eight tubes: four lower arms from the base, four upper arms to the head
      const arms = nodes.filter((n) => n.id.startsWith(prefix + "/arms/"));
      expect(arms).toHaveLength(8);
      for (const arm of arms) {
        const ps = tris.filter((t) => t.material === arm.material).slice(arm.tri[0], arm.tri[0] + arm.tri[1]).flatMap((t) => t.p);
        const end = (x: number) => {
          const at = ps.filter((p) => Math.abs(p[0] - x) < 1e-5);
          return [x, at.reduce((s, p) => s + p[1], 0) / at.length, at.reduce((s, p) => s + p[2], 0) / at.length];
        };
        const [a, b] = [end(Math.min(...ps.map((p) => p[0]))), end(Math.max(...ps.map((p) => p[0])))];
        lengths.push(Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!));
      }
    }
    expect(tops[0]).toBeCloseTo(5.87, 3);
    expect(tops[1]).toBeCloseTo(4.55, 3);
    // the lower arms share one length in both poses, and so do the upper arms
    const lower = lengths.filter((_, i) => i % 2 === 0), upper = lengths.filter((_, i) => i % 2 === 1);
    for (const l of lower) expect(l).toBeCloseTo(lower[0]!, 4);
    for (const l of upper) expect(l).toBeCloseTo(upper[0]!, 4);
  });

  // Regression: the windscreen's panels once ran straight from its bottom to its
  // top edge while the skin kinks at 3.4 m, so the grey shell showed through the
  // glass near the corners.
  it("shows glass, not the skin behind it, across both windscreens at both ends", () => {
    const { tris } = triangles();
    const near = tris.filter((t) => Math.abs(t.p[0][0]) > 6.4 && t.p.every((p) => p[1] > 2.3 && p[1] < 3.9));
    let checked = 0;
    for (const e of [-1, 1])
      for (const side of [-1, 1])
        // from straight ahead, from the three-quarter view and from the side
        for (const deg of [0, 30, 60, 90]) {
          const a = Math.atan2(side * Math.sin((deg * Math.PI) / 180), e * Math.cos((deg * Math.PI) / 180));
          const ts = near.filter((t) => Math.sign(t.p[0][0]) === e);
          for (let y = 2.62; y < 3.52; y += 0.06)
            for (let u = -2; u <= 2; u += 0.05) {
              const h = hits(ts, a, u, y);
              if (!h.includes("glass")) continue;
              checked++;
              expect(["glass", "rubber"], `end ${e} side ${side} ${deg} deg at u=${u.toFixed(2)} y=${y.toFixed(2)}`).toContain(h[0]);
            }
        }
    expect(checked).toBeGreaterThan(1000);
  }, 30_000); // a ray per pixel over both cabs: about 4.5 s alone, more under a full parallel run

  it("carries a valid running number in every livery", () => {
    for (const [key, l] of Object.entries(CD230_LIVERIES)) {
      expect(l.number, key).toMatch(/^\d{3} \d{3}-\d$/);
      const digits = [...l.number.replace(/\D/g, "")].map(Number);
      const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
      expect((10 - (sum % 10)) % 10, key).toBe(digits[6]);
    }
    expect(CD230_LIVERIES.cd230.number).toBe("230 025-9");
    expect(CD230_LIVERIES.cd340.number).toBe("340 062-9");
    expect(CD230_LIVERIES.cd242.number).toBe("242 214-5");
  });

  it("builds every livery within the rail budget, with the 240 family's roof box only on the 240s, 340 and 242", () => {
    expect(CD230_PARAMS[0]!.values.map((v) => v.value)).toEqual(["cd230", "cd240", "cd240No047", "cd340", "cd242"]);
    for (const livery of Object.keys(CD230_LIVERIES)) {
      const { mesh, nodes } = triangles({ livery });
      expect(mesh.triangleCount(), livery).toBeLessThanOrEqual(16000);
      const box = nodes.some((n) => n.id.startsWith("roof-equipment/roof-box"));
      expect(box, livery).toBe(livery !== "cd230");
    }
  });
});
