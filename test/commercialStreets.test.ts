import { describe, it, expect } from "vitest";
import { COMMERCIAL } from "../generator/commercialStreets";
import { coverageCombinations, resolveParams } from "../generator/design";
import { DESIGNS } from "../generator/generate";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import inventory from "../assets/commercial/inventory.json";

describe("commercial architecture", () => {
  it("registers eleven families in Commercial with usable legacy suggestions", () => {
    expect(COMMERCIAL).toHaveLength(11);
    expect(inventory.models).toHaveLength(82);
    expect(new Set(inventory.models.map(r => r.legacyId)).size).toBe(82);
    for (const d of COMMERCIAL) {
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(d.catalog?.category).toBe("Commercial");
    }
    for (const row of inventory.models) {
      if (row.status !== "covered") continue;
      const d = DESIGNS.get(row.targetId!)!;
      expect(d, row.legacyId).toBeDefined();
      expect(() => resolveParams(d.params!, row.params as Record<string, string>)).not.toThrow();
    }
  });
  for (const d of COMMERCIAL) it(`${d.id}: all shapes are grounded, deterministic and below 10k triangles without flicker`, () => {
    for (const p of coverageCombinations(d.params, d.finishParams)) {
      const glb = d.build(p).toGlb(d.id), s = glbStats(glb);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.triangles).toBeLessThanOrEqual(10_000);
      expect(s.triangles).toBeGreaterThan(500);
      expect(s.max.every(Number.isFinite)).toBe(true);
      expect(findCoplanarOverlaps(glb), JSON.stringify(p)).toEqual([]);
    }
    expect(d.build().toGlb(d.id)).toEqual(d.build().toGlb(d.id));
  }, 30_000);
  it("changes height and footprint through the exposed parameters", () => {
    for (const d of COMMERCIAL) {
      const heights = d.params!.find(p => p.name === "storeys")!.values;
      const small = glbStats(d.build({ storeys: heights[0].value, width: "narrow" }).toGlb(d.id));
      const large = glbStats(d.build({ storeys: heights[heights.length - 1].value, width: "wide" }).toGlb(d.id));
      expect(large.max[1]).toBeGreaterThan(small.max[1] + 3);
      expect(large.max[0] - large.min[0]).toBeGreaterThan(small.max[0] - small.min[0] + 5);
    }
  });
});
