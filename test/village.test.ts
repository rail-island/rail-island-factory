import { proceduralId } from "../generator/modelId.ts";
// The procedural village houses: seven parametric plan families in the style
// of the webapp's Kenney suburban houses and Quaternius timber cottages. The parametric
// suite (params.test.ts) builds every shape combination for flicker and checks
// the JS model; this file holds what is particular to the houses.

import { describe, expect, it } from "vitest";
import { TIMBER_CATALOG, VILLAGE_CATALOG, VILLAGE_FINISH_PARAMS, VILLAGE_HOUSES } from "../generator/village";
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
  it("are eight parametric designs with unique village- ids, in the Village category", () => {
    expect(VILLAGE_HOUSES.map((d) => d.id)).toEqual([
      "proc-building-village-timber-cottage", "proc-building-village-timber-house",
      "proc-building-village-cottage", "proc-building-village-l-house", "proc-building-village-family-house", "proc-building-village-modern-house", "proc-building-village-narrow-house",
      "proc-building-village-alpine-hut",
    ]);
    for (const d of VILLAGE_HOUSES) {
      expect(DESIGNS.get(proceduralId(d.id))).toBe(d);
      expect(d.catalog).toEqual(d.id.startsWith("proc-building-village-timber-") ? TIMBER_CATALOG : VILLAGE_CATALOG);
      expect(d.params?.length).toBeGreaterThan(0);
    }
    expect(VILLAGE_CATALOG).toMatchObject({ category: "Village", group: "village" });
    // the export entries carry the village fields, not the skyscrapers'
    for (const e of exportMeta(VILLAGE_HOUSES).buildings) expect(e).toMatchObject({ category: "Village", group: e.id.startsWith("proc-building-village-timber-") ? "village_red" : "village", defaultScale: 1 });
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

  it("adds 1,728 distinct timber variants with effective shape controls", () => {
    const timber = VILLAGE_HOUSES.filter(d => d.id.startsWith("proc-building-village-timber-"));
    expect(timber).toHaveLength(2);
    for (const d of timber) {
      expect(paramCombinations(d.params)).toHaveLength(864);
      const shapes = coverageCombinations(d.params, d.finishParams).slice(0, 24);
      const meshes = new Set(shapes.map(p => Buffer.from(d.build(p).toGlb(d.id)).toString("base64")));
      expect(meshes.size).toBe(24);
      const steep = glbStats(d.build({ pitch: "steep" }).toGlb(d.id));
      const gentle = glbStats(d.build({ pitch: "gentle" }).toGlb(d.id));
      expect(steep.max[1]).toBeGreaterThan(gentle.max[1] + 0.8);
    }
  });

  it("mirror the L-house and the family house with their side parameter", () => {
    for (const id of ["proc-building-village-l-house", "proc-building-village-family-house"]) {
      const d = DESIGNS.get(proceduralId(id))!;
      const left = glbStats(d.build({ side: "left" }).toGlb(id));
      const right = glbStats(d.build({ side: "right" }).toGlb(id));
      expect(left.min[0]).toBeCloseTo(-right.max[0], 4);
      expect(left.max[0]).toBeCloseTo(-right.min[0], 4);
      expect(left.triangles).toBe(right.triangles);
    }
  });

  it("put their shape options into the geometry", () => {
    const tris = (id: string, combo: ParamValues): number => DESIGNS.get(proceduralId(id))!.build(combo).triangleCount();
    const height = (id: string, combo: ParamValues): number => glbStats(DESIGNS.get(proceduralId(id))!.build(combo).toGlb(id)).max[1];
    expect(height("proc-building-village-cottage", { storeys: "two" })).toBeGreaterThan(height("proc-building-village-cottage", { storeys: "one" }) + 2);
    expect(height("proc-building-village-narrow-house", { storeys: "three" })).toBeGreaterThan(height("proc-building-village-narrow-house", { storeys: "two" }) + 2);
    expect(tris("proc-building-village-cottage", { dormers: "dormers" })).toBeGreaterThan(tris("proc-building-village-cottage", { dormers: "none" }));
    expect(tris("proc-building-village-narrow-house", { shutters: "shutters" })).toBeGreaterThan(tris("proc-building-village-narrow-house", { shutters: "none" }));
    expect(tris("proc-building-village-modern-house", { solar: "panels" })).toBeGreaterThan(tris("proc-building-village-modern-house", { solar: "none" }));
    const materials = (id: string, combo: ParamValues): string[] => [...colours(DESIGNS.get(proceduralId(id))!, combo).keys()];
    expect(materials("proc-building-village-family-house", { annex: "garage" })).toContain("garageDoor");
    expect(materials("proc-building-village-family-house", { annex: "terrace" })).not.toContain("garageDoor");
    expect(materials("proc-building-village-l-house", { extras: "solar" })).toContain("solar");
    expect(materials("proc-building-village-cottage", { entrance: "garden" })).toContain("flowers");
  });

  it("build the alpine hut's balcony, season and storeys into the geometry", () => {
    const id = "proc-building-village-alpine-hut";
    const d = DESIGNS.get(proceduralId(id))!;
    expect(d.references).toBe("alpine-hut");
    expect(paramCombinations(d.params)).toHaveLength((3 + 1) * 2 * 2 * 2 * 4 * 3 * 3 * 3);
    // the balcony applies to the two-storey hut only
    expect(paramCombinations(d.params).filter((c) => c.storeys === "one").every((c) => c.balcony === undefined)).toBe(true);
    const stats = (combo: ParamValues) => glbStats(d.build(combo).toGlb(id));
    expect(stats({ storeys: "two" }).max[1]).toBeGreaterThan(stats({ storeys: "one" }).max[1] + 1.5);
    // a wrap-round balcony widens the roof
    expect(stats({ balcony: "wrap" }).max[0]).toBeGreaterThan(stats({ balcony: "front" }).max[0] + 0.5);
    expect(stats({ balcony: "front" }).max[2]).toBeGreaterThan(stats({ balcony: "none" }).max[2] + 0.4);
    const materials = (combo: ParamValues): string[] => [...colours(d, combo).keys()];
    expect(materials({ season: "winter" })).toContain("snow");
    expect(materials({ season: "summer" })).not.toContain("snow");
    expect(materials({ season: "summer" })).toContain("flower");
    expect(d.build({ chimney: "stone" }).triangleCount()).toBeGreaterThan(d.build({ chimney: "none" }).triangleCount());
  });
});
