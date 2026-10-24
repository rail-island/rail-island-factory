import { proceduralId } from "../generator/modelId.ts";
import { describe, expect, it } from "vitest";
import { COMMERCIAL_BUILDINGS, COMMERCIAL_CATALOG } from "../generator/commercial";
import { coverageCombinations, paramCombinations, type ParamValues, type ProceduralDesign } from "../generator/design";
import { BUILDINGS, DESIGNS, designSource } from "../generator/generate";
import { exportMeta } from "../generator/catalog";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { sample } from "./catalogCache";

function shape(d: ProceduralDesign, values: ParamValues): Map<string, number[]> {
  const { json, bin } = parseGlb(d.build(values).toGlb(d.id));
  const out = new Map<string, number[]>();
  for (const t of collectTriangles(json, bin)) {
    if (!out.has(t.material)) out.set(t.material, []);
    out.get(t.material)!.push(...t.p.flat());
  }
  return out;
}

describe("the commercial buildings", () => {
  it("exports five original commercial families in the classic city pool, with 3,000 selectable variants", () => {
    expect(COMMERCIAL_BUILDINGS.map((d) => d.id)).toEqual([
      "proc-building-comm-corner-shop", "proc-building-comm-balcony-house", "proc-building-comm-market-block", "proc-building-comm-terrace-house", "proc-building-comm-office-house",
    ]);
    // the party walls (partyWalls.ts) only blank a side a neighbour covers: not a variant of their own
    expect(COMMERCIAL_BUILDINGS.reduce((n, d) => n + paramCombinations(d.params?.filter((p) => !p.name.startsWith("party"))).length, 0)).toBe(3000);
    expect(COMMERCIAL_CATALOG).toMatchObject({ category: "Commercial", group: "comm_classic", defaultScale: 1 });
    const exported = exportMeta(BUILDINGS).buildings;
    for (const d of COMMERCIAL_BUILDINGS) {
      expect(DESIGNS.get(proceduralId(d.id))).toBe(d);
      expect(designSource(proceduralId(d.id))).toBe("commercial.ts");
      expect(exported.find((e) => e.id === d.id)).toMatchObject({ ...COMMERCIAL_CATALOG, params: d.params });
    }
  });

  for (const d of COMMERCIAL_BUILDINGS) {
    it(`${d.id}: every shape is finite, grounded, commercial-sized and within 10,000 triangles`, () => {
      for (const values of sample(coverageCombinations(d.params, d.finishParams))) {
        const { json, bin } = parseGlb(d.build(values).toGlb(d.id));
        const triangles = collectTriangles(json, bin);
        expect(triangles.every((t) => t.p.flat().every(Number.isFinite))).toBe(true);
        const stats = glbStats(d.build(values).toGlb(d.id));
        expect(stats.min[1], JSON.stringify(values)).toBeCloseTo(0, 5);
        expect(stats.triangles, JSON.stringify(values)).toBeLessThanOrEqual(10_000);
        expect(stats.triangles).toBeGreaterThan(1000);
        expect(stats.max[1]).toBeGreaterThan(7);
        expect(stats.max[1]).toBeLessThan(34);
        expect(stats.max[0] - stats.min[0]).toBeGreaterThan(7);
        expect(stats.max[0] - stats.min[0]).toBeLessThan(23);
      }
    });

    it(`${d.id}: every shape choice changes the geometry and all shape combinations are distinct`, () => {
      const signatures = new Set<string>();
      for (const values of coverageCombinations(d.params, d.finishParams).filter((v) =>
        d.finishParams!.every((name) => v[name] === d.params!.find((p) => p.name === name)!.default))) {
        const positions = shape(d, values);
        signatures.add(JSON.stringify([...positions]));
      }
      // a party wall (partyWalls.ts) is covered one side at a time, and each blank side is a shape of its own
      const party = d.params!.filter((p) => p.name.startsWith("party")).length;
      const shapeCount = paramCombinations(d.params!.filter((p) => !d.finishParams!.includes(p.name) && !p.name.startsWith("party"))).length + party;
      expect(signatures.size).toBe(shapeCount);
    });

    it(`${d.id}: finish choices only recolour, so reduced shape coverage is valid`, () => {
      const baseShape = shape(d, {});
      const colours = (values: ParamValues) => parseGlb(d.build(values).toGlb(d.id)).json.materials;
      for (const name of d.finishParams!) {
        const p = d.params!.find((s) => s.name === name)!;
        for (const value of p.values) {
          expect(shape(d, { [name]: value.value })).toEqual(baseShape);
          if (value.value !== p.default) expect(colours({ [name]: value.value })).not.toEqual(colours({}));
        }
      }
    });
  }

  it("uses floor counts, widths and setbacks as architectural choices", () => {
    const stats = (index: number, values: ParamValues) => glbStats(COMMERCIAL_BUILDINGS[index]!.build(values).toGlb("commercial"));
    expect(stats(0, { storeys: "four" }).max[1] - stats(0, { storeys: "two" }).max[1]).toBeCloseTo(6.5);
    expect(stats(4, { storeys: "nine" }).max[1] - stats(4, { storeys: "five" }).max[1]).toBeCloseTo(13);
    expect(stats(2, { bays: "six" }).max[0] - stats(2, { bays: "four" }).max[0]).toBeCloseTo(3.25);
    expect(shape(COMMERCIAL_BUILDINGS[3]!, { setback: "corner" })).not.toEqual(shape(COMMERCIAL_BUILDINGS[3]!, { setback: "front" }));
  });
});
