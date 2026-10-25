// The panel houses (generator/panelHouses.ts, docs/models/panel-houses.md): the slab
// and the point tower of a housing estate, their city use and the panel_estate block.
import { describe, expect, it } from "vitest";
import { proceduralId } from "../generator/modelId.ts";
import { BAY, PANEL_CATALOG, PANEL_HOUSES, PL, SLAB_DEPTH, ST } from "../generator/panelHouses.ts";
import { coverageCombinations, type ParamValues, type ProceduralDesign } from "../generator/design.ts";
import { BUILDINGS, DESIGNS, designSource } from "../generator/generate.ts";
import { metaEntry } from "../generator/catalog.ts";
import { cityShapes, heightBand } from "../generator/cityVariants.ts";
import { glbStats } from "../generator/glbStats.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { TYPE_META } from "../generator/sets/blockType.ts";
import { sample } from "./catalogCache.ts";

const [slab, tower] = PANEL_HOUSES as [ProceduralDesign, ProceduralDesign];

function shape(d: ProceduralDesign, values: ParamValues): string {
  const { json, bin } = parseGlb(d.build(values).toGlb(d.id));
  const out: Record<string, number[]> = {};
  for (const t of collectTriangles(json, bin)) (out[t.material] ??= []).push(...t.p.flat());
  return JSON.stringify(out);
}

const stats = (d: ProceduralDesign, values: ParamValues) => glbStats(d.build(values).toGlb(d.id));

describe("the panel houses", () => {
  it("are a building category of their own, in the panel pool, with references", () => {
    expect(PANEL_HOUSES.map((d) => d.id)).toEqual(["proc-building-panel-slab", "proc-building-panel-tower"]);
    expect(PANEL_CATALOG).toMatchObject({ category: "Panel houses", group: "panel", defaultScale: 1 });
    for (const d of PANEL_HOUSES) {
      expect(DESIGNS.get(proceduralId(d.id))).toBe(d);
      expect(BUILDINGS).toContain(d);
      expect(designSource(d.id)).toBe("panelHouses.ts");
      expect(d.references).toBe("panel-houses");
      // the entry alone, without measuring every city variant (the export test does that)
      expect(metaEntry(d, PANEL_CATALOG)).toMatchObject({ ...PANEL_CATALOG, params: d.params });
    }
  });

  for (const d of PANEL_HOUSES) {
    it(`${d.id}: every shape is finite, grounded and within 10,000 triangles`, () => {
      for (const values of sample(coverageCombinations(d.params, d.finishParams))) {
        const glb = d.build(values).toGlb(d.id);
        const { json, bin } = parseGlb(glb);
        expect(collectTriangles(json, bin).every((t) => t.p.flat().every(Number.isFinite))).toBe(true);
        const s = glbStats(glb);
        expect(s.min[1], JSON.stringify(values)).toBeCloseTo(0, 5);
        expect(s.triangles, JSON.stringify(values)).toBeLessThanOrEqual(10_000);
        expect(d.buildLod(values).triangleCount()).toBeLessThanOrEqual(100);
      }
    });

    it(`${d.id}: every shape value changes the geometry; the colours only recolour`, () => {
      // one parameter at a time from the defaults, not every combination: the test stays quick
      const base = shape(d, {});
      for (const p of d.params!.filter((s) => !d.finishParams!.includes(s.name))) {
        for (const v of p.values) if (v.value !== p.default) expect(shape(d, { [p.name]: v.value }), `${p.name}=${v.value}`).not.toBe(base);
      }
      for (const name of d.finishParams!) {
        const p = d.params!.find((s) => s.name === name)!;
        for (const v of p.values) {
          expect(shape(d, { [name]: v.value })).toBe(base);
          if (v.value !== p.default) {
            const colours = (values: ParamValues) => JSON.stringify(parseGlb(d.build(values).toGlb(d.id)).json.materials);
            expect(colours({ [name]: v.value })).not.toBe(colours({}));
          }
        }
      }
    });
  }

  it("measure the slab by its sections and both by their storeys", () => {
    for (const n of [1, 2, 3]) {
      const s = stats(slab, { sections: String(n), roofShape: "pitched" });
      expect(s.max[0] - s.min[0]).toBeCloseTo(n * 5 * BAY + 0.9, 3);
    }
    expect(stats(slab, { storeys: "12" }).max[1] - stats(slab, { storeys: "4" }).max[1]).toBeCloseTo(8 * ST, 3);
    expect(stats(tower, { storeys: "14" }).max[1] - stats(tower, { storeys: "10" }).max[1]).toBeCloseTo(4 * ST, 3);
    // the balcony stacks stand out of the street front only, no farther than the entrance canopies
    const plain = stats(slab, { balconies: "none" }), deep = stats(slab, { balconies: "balcony" });
    expect(deep.max[2]).toBeGreaterThan(SLAB_DEPTH / 2 + 1.2);
    expect(deep.max[2]).toBeCloseTo(plain.max[2], 5);
    expect(deep.min[2]).toBeCloseTo(plain.min[2], 5);
    expect(plain.max[2] - plain.min[2]).toBeGreaterThan(SLAB_DEPTH);
    expect(plain.max[1]).toBeGreaterThan(PL + 8 * ST);
  });

  it("draw a blank party wall on the slab's ends and keep the extent", () => {
    for (const roofShape of ["flat", "pitched"]) {
      const open = stats(slab, { roofShape }), blank = stats(slab, { roofShape, partyLeft: "yes", partyRight: "yes" });
      expect(blank.min).toEqual(open.min);
      expect(blank.max).toEqual(open.max);
      expect(shape(slab, { roofShape, partyLeft: "yes" })).not.toBe(shape(slab, { roofShape }));
    }
    expect(tower.params!.some((p) => p.name.startsWith("party"))).toBe(false);
  });

  it("stand in cities by sections, storeys, roof, facade and balconies, banded by the estate's own heights", () => {
    expect(cityShapes(slab, "panel")).toHaveLength(3 * 4 * 2 * 2 * 3);
    expect(cityShapes(tower, "panel")).toHaveLength(3 * 2 * 2 * 3);
    expect(heightBand(slab, "panel", { storeys: "4" })).toBe("low");
    expect(heightBand(slab, "panel", { storeys: "8" })).toBe("mid");
    expect(heightBand(slab, "panel", { storeys: "12" })).toBe("tall");
    expect(heightBand(tower, "panel", {})).toBe("tall");
  });

  it("fill the housing estate block", () => {
    const t = TYPE_META.panel_estate!;
    expect(t.pools).toEqual([{ group: "panel", weight: 1 }]);
    expect(t).toMatchObject({ placement: "perimeter", ground: null, district: "residential", overlay: "residential" });
    expect(Object.keys(t.cities)).toEqual(["town", "city"]);
  });
});
