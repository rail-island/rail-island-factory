// The procedural village houses (generator/village.ts): five parametric plan
// families in the style of the webapp's Kenney village houses. The parametric
// suite (params.test.ts) builds every shape combination for flicker and checks
// the JS model; this file holds what is particular to the houses.

import { describe, expect, it } from "vitest";
import { VILLAGE_CATALOG, VILLAGE_FINISH_PARAMS, VILLAGE_HOUSES } from "../generator/village";
import { DESIGNS } from "../generator/generate";
import { coverageCombinations, paramCombinations, type ParamValues } from "../generator/design";
import { exportMeta } from "../generator/catalog";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import type { ProceduralDesign } from "../generator/design";

/** The triangles' corner positions per material, in draw order. */
function positions(d: ProceduralDesign, combo: ParamValues): Map<string, number[]> {
  const { json, bin } = parseGlb(d.build(combo).toGlb(d.id));
  const out = new Map<string, number[]>();
  for (const t of collectTriangles(json, bin)) {
    if (!out.has(t.material)) out.set(t.material, []);
    out.get(t.material)!.push(...t.p.flat());
  }
  return out;
}

/** The base colour of each material of a built variant. */
function colours(d: ProceduralDesign, combo: ParamValues): Map<string, string> {
  const { json } = parseGlb(d.build(combo).toGlb(d.id));
  return new Map((json.materials ?? []).map((m) => [m.name ?? "", JSON.stringify(m.pbrMetallicRoughness?.baseColorFactor)]));
}

describe("the village houses", () => {
  it("are five parametric designs with unique village- ids, in the Village category", () => {
    expect(VILLAGE_HOUSES.map((d) => d.id)).toEqual([
      "village-cottage", "village-l-house", "village-family-house", "village-modern-house", "village-narrow-house",
    ]);
    for (const d of VILLAGE_HOUSES) {
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(d.catalog).toEqual(VILLAGE_CATALOG);
      expect(d.params?.length).toBeGreaterThan(0);
    }
    expect(VILLAGE_CATALOG).toMatchObject({ category: "Village", group: "village" });
    // the export entries carry the village fields, not the skyscrapers'
    for (const e of exportMeta(VILLAGE_HOUSES).buildings) expect(e).toMatchObject({ category: "Village", group: "village", defaultScale: 1.88 });
  });

  it("offer far more variants than designs", () => {
    const total = VILLAGE_HOUSES.reduce((n, d) => n + paramCombinations(d.params).length, 0);
    expect(total).toBeGreaterThanOrEqual(2000);
  });

  for (const d of VILLAGE_HOUSES) {
    it(`${d.id}: every shape stands on its plinth, is house-sized and stays under 10,000 triangles`, () => {
      for (const combo of coverageCombinations(d.params, d.finishParams)) {
        const s = glbStats(d.build(combo).toGlb(d.id));
        expect(s.min[1]).toBeCloseTo(0, 5);
        expect(s.triangles).toBeLessThanOrEqual(10_000);
        const w = s.max[0] - s.min[0];
        const dz = s.max[2] - s.min[2];
        const h = s.max[1] - s.min[1];
        // a village house: a plot under 20 m a side, lower than a three-storey townhouse's ridge
        expect(Math.max(w, dz)).toBeLessThan(20);
        expect(Math.min(w, dz)).toBeGreaterThan(5);
        expect(h).toBeGreaterThan(4);
        expect(h).toBeLessThan(15);
      }
    });

    it(`${d.id}: its finish parameters recolour the house without moving a vertex`, () => {
      const finish = d.finishParams ?? [];
      expect(finish.length).toBeGreaterThan(0);
      for (const name of finish) expect(VILLAGE_FINISH_PARAMS).toContain(name);
      const base = positions(d, {});
      const baseColours = colours(d, {});
      for (const name of finish) {
        for (const v of d.params!.find((p) => p.name === name)!.values) {
          expect(positions(d, { [name]: v.value })).toEqual(base);
          const changed = [...colours(d, { [name]: v.value })].filter(([m, c]) => baseColours.get(m) !== c);
          // a non-default colour changes at least one material
          if (v.value !== d.params!.find((p) => p.name === name)!.default) expect(changed.length).toBeGreaterThan(0);
        }
      }
    });
  }

  it("mirror the L-house and the family house with their side parameter", () => {
    for (const id of ["village-l-house", "village-family-house"]) {
      const d = DESIGNS.get(id)!;
      const left = glbStats(d.build({ side: "left" }).toGlb(id));
      const right = glbStats(d.build({ side: "right" }).toGlb(id));
      expect(left.min[0]).toBeCloseTo(-right.max[0], 4);
      expect(left.max[0]).toBeCloseTo(-right.min[0], 4);
      expect(left.triangles).toBe(right.triangles);
    }
  });

  it("put their shape options into the geometry", () => {
    const tris = (id: string, combo: ParamValues): number => DESIGNS.get(id)!.build(combo).triangleCount();
    const height = (id: string, combo: ParamValues): number => glbStats(DESIGNS.get(id)!.build(combo).toGlb(id)).max[1];
    expect(height("village-cottage", { storeys: "two" })).toBeGreaterThan(height("village-cottage", { storeys: "one" }) + 2);
    expect(height("village-narrow-house", { storeys: "three" })).toBeGreaterThan(height("village-narrow-house", { storeys: "two" }) + 2);
    expect(tris("village-cottage", { dormers: "dormers" })).toBeGreaterThan(tris("village-cottage", { dormers: "none" }));
    expect(tris("village-narrow-house", { shutters: "shutters" })).toBeGreaterThan(tris("village-narrow-house", { shutters: "none" }));
    expect(tris("village-modern-house", { solar: "panels" })).toBeGreaterThan(tris("village-modern-house", { solar: "none" }));
    const materials = (id: string, combo: ParamValues): string[] => [...colours(DESIGNS.get(id)!, combo).keys()];
    expect(materials("village-family-house", { annex: "garage" })).toContain("garageDoor");
    expect(materials("village-family-house", { annex: "terrace" })).not.toContain("garageDoor");
    expect(materials("village-l-house", { extras: "solar" })).toContain("solar");
    expect(materials("village-cottage", { entrance: "garden" })).toContain("flowers");
  });
});
