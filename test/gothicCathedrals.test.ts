import { describe, expect, it } from "vitest";
import { Ray, Vector3 } from "three";
import { GOTHIC_CATHEDRALS, notreDame } from "../generator/gothicCathedrals";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";

describe("Gothic cathedrals", () => {
  for (const design of GOTHIC_CATHEDRALS) {
    it(`${design.id} is deterministic, finite and within the 30k budget`, () => {
      const bytes = design.build().toGlb(design.id);
      expect(Buffer.from(bytes).equals(Buffer.from(design.build().toGlb(design.id)))).toBe(true);
      const stats = glbStats(bytes);
      expect(stats.triangles).toBeLessThanOrEqual(30000);
      expect(stats.primitives).toBeLessThanOrEqual(11);
      expect(stats.min[1]).toBe(0);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
      const { json, bin } = parseGlb(bytes);
      const tris = collectTriangles(json, bin);
      let minimumArea = Infinity;
      let finite = true;
      let consistentWinding = true;
      for (const t of tris) {
        finite &&= t.p.flat().every(Number.isFinite);
        const a = new Vector3(...t.p[0]), b = new Vector3(...t.p[1]), c = new Vector3(...t.p[2]);
        const normal = b.sub(a).cross(c.sub(a));
        minimumArea = Math.min(minimumArea, normal.length() / 2);
        consistentWinding &&= normal.dot(new Vector3(...t.n[0])) > 0;
      }
      expect(finite).toBe(true);
      expect(consistentWinding).toBe(true);
      expect(minimumArea).toBeGreaterThan(1e-8);
    });
  }

  it("Notre-Dame's belfry lights are openings, with solid piers between them", () => {
    const { json, bin } = parseGlb(notreDame().toGlb("test"));
    const tris = collectTriangles(json, bin);
    const hit = (x: number): boolean => {
      const ray = new Ray(new Vector3(x, 54, 60), new Vector3(0, 0, -1));
      return tris.some(t => {
        const p = ray.intersectTriangle(new Vector3(...t.p[0]), new Vector3(...t.p[1]), new Vector3(...t.p[2]), false, new Vector3());
        return p !== null && p.z > 40;
      });
    };
    expect(hit(14.6 - 3.15)).toBe(false);
    expect(hit(14.6 + 3.15)).toBe(false);
    expect(hit(14.6)).toBe(true);
  });

  it("keeps the two western fronts on the reference axes", () => {
    for (const design of GOTHIC_CATHEDRALS) {
      const tree = design.build().sourceTree(design.id, design.title);
      const front = tree.root.children.find(n => n.id === "west-facade")!;
      if (design.build === notreDame) expect(front.min![2]).toBeGreaterThan(40);
      else expect(front.max![0]).toBeLessThan(-48);
      expect(design.catalog?.defaultScale).toBe(1);
    }
  });
});
