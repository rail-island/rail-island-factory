import { describe, it, expect } from "vitest";
import { proceduralId } from "../generator/modelId";
import { COMMERCIAL, windowKind } from "../generator/commercialStreets";
import { coverageCombinations, resolveParams } from "../generator/design";
import { DESIGNS } from "../generator/generate";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import inventory from "../assets/commercial/inventory.json";
import { sample } from "./catalogCache";

describe("commercial architecture", () => {
  it("registers eleven families in Commercial with usable legacy suggestions", () => {
    expect(COMMERCIAL).toHaveLength(11);
    expect(inventory.models).toHaveLength(82);
    expect(new Set(inventory.models.map(r => r.legacyId)).size).toBe(82);
    for (const d of COMMERCIAL) {
      expect(DESIGNS.get(proceduralId(d.id))?.build).toBe(d.build);
      expect(d.catalog?.category).toBe("Commercial");
      expect(d.catalog?.defaultScale).toBe(1);
    }
    for (const row of inventory.models) {
      if (row.status !== "covered") continue;
      const d = DESIGNS.get(proceduralId(row.targetId!))!;
      expect(d, row.legacyId).toBeDefined();
      expect(() => resolveParams(d.params!, row.params as Record<string, string>)).not.toThrow();
      // every parameter but the party walls, which only a city sets (partyWalls.ts)
      expect(Object.keys(row.params).sort(), row.legacyId).toEqual(d.params!.map(p => p.name).filter(n => !n.startsWith("party")).sort());
    }
  });
  it("preserves distinguishing row-house entrances, signs and long facades", () => {
    const row = (id: string) => inventory.models.find(r => r.legacyId === id)!;
    expect(row("street-house-stairs").params).toMatchObject({ entrance: "stoop" });
    expect(row("street-house-double").params).toMatchObject({ entrance: "paired", width: "standard" });
    expect(row("street-house-wide-doors").params).toMatchObject({ entrance: "paired", width: "extraWide" });
    expect(row("street-house-sign").params).toMatchObject({ sign: "board" });
    const brick = COMMERCIAL.find(d => d.id === "proc-building-commercial-brick")!;
    const plain = brick.build().toGlb(brick.id);
    expect(brick.build({ entrance: "stoop" }).toGlb(brick.id)).not.toEqual(plain);
    expect(brick.build({ entrance: "paired" }).toGlb(brick.id)).not.toEqual(plain);
    expect(brick.build({ sign: "board" }).toGlb(brick.id)).not.toEqual(plain);
    const wide = glbStats(brick.build({ width: "wide" }).toGlb(brick.id));
    const extra = glbStats(brick.build({ width: "extraWide" }).toGlb(brick.id));
    expect(extra.max[0] - extra.min[0]).toBeGreaterThan(1.5 * (wide.max[0] - wide.min[0]));
  });
  for (const d of COMMERCIAL) it(`${d.id}: all shapes are grounded, deterministic and below 10k triangles without flicker`, () => {
    for (const p of sample(coverageCombinations(d.params, d.finishParams))) {
      const glb = d.build(p).toGlb(d.id), s = glbStats(glb);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.triangles).toBeLessThanOrEqual(10_000);
      expect(s.triangles).toBeGreaterThan(500);
      expect(s.max.every(Number.isFinite)).toBe(true);
      expect(findCoplanarOverlaps(glb), JSON.stringify(p)).toEqual([]);
    }
    expect(d.build().toGlb(d.id)).toEqual(d.build().toGlb(d.id));
  }, 120_000);
  it("sets every street window's glass back in its surround, glazing bars spanning it edge to edge", () => {
    // the family, its window kind and how far its head reaches above the glass
    const cases = [["balcony", "plain", 0.07], ["brick", "stone", 0.13], ["terrace", "moulded", 0.31], ["baroque", "baroque", 0.52]] as const;
    for (const [style, kind, head] of cases) {
      const id = `proc-building-commercial-${style}`;
      expect(windowKind(style)).toBe(kind);
      const m = COMMERCIAL.find(d => d.id === id)!.build() as unknown as { groups: Map<string, { pos: number[]; nrm: number[] }> };
      // the street-facing faces of a material, as x/y rectangles at a z
      const faces = (mat: string) => {
        const p = m.groups.get(mat)!.pos, n = m.groups.get(mat)!.nrm, out: { x0: number; x1: number; y0: number; y1: number; z: number }[] = [];
        for (let t = 0; t < p.length; t += 9) if (n[t + 2]! > 0.99) out.push({
          x0: Math.min(p[t]!, p[t + 3]!, p[t + 6]!), x1: Math.max(p[t]!, p[t + 3]!, p[t + 6]!),
          y0: Math.min(p[t + 1]!, p[t + 4]!, p[t + 7]!), y1: Math.max(p[t + 1]!, p[t + 4]!, p[t + 7]!), z: p[t + 2]!,
        });
        return out;
      };
      const panes = faces("glass").filter(g => Math.abs(g.x1 - g.x0 - 1.35) < 1e-6), bars = faces("frame"), surround = [...faces("trim"), ...bars];
      expect(panes.length, id).toBeGreaterThan(10);
      for (const g of panes) {
        const inside = bars.filter(b => b.x0 > g.x0 - 1e-6 && b.x1 < g.x1 + 1e-6 && b.y0 > g.y0 - 1e-6 && b.y1 < g.y1 + 1e-6);
        expect(Math.min(...inside.map(b => b.y0)), id).toBeCloseTo(g.y0, 6);
        expect(Math.max(...inside.map(b => b.y1)), id).toBeCloseTo(g.y1, 6);
        if (kind === "plain") {
          // one mullion and no transom
          expect(inside.every(b => b.y1 - b.y0 > g.y1 - g.y0 - 1e-6), id).toBe(true);
        } else {
          expect(Math.min(...inside.map(b => b.x0)), id).toBeCloseTo(g.x0, 6);
          expect(Math.max(...inside.map(b => b.x1)), id).toBeCloseTo(g.x1, 6);
        }
        // a jamb beside the pane stands proud of it
        const jamb = surround.filter(f => Math.abs(f.x1 - g.x0) < 1e-6 && f.y0 < g.y1 && f.y1 > g.y0);
        expect(Math.max(...jamb.map(f => f.z)) - g.z, id).toBeGreaterThan(0.04);
        const mid = (g.x0 + g.x1) / 2;
        const above = surround.filter(f => f.x0 <= mid && f.x1 >= mid && f.y0 > g.y1 - 0.1 && f.y0 < g.y1 + 0.5);
        expect(Math.max(...above.map(f => f.y1)) - g.y1, id).toBeCloseTo(head, 6);
      }
    }
  });
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
