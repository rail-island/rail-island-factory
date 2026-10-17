// The dedicated LODs of the ordinary buildings (docs/models/lod.md): the commercial
// kits, the village houses, the stations and the fountains. Every parameter
// combination fits its budget without windows or flicker, stands on the ground
// within the full model's bounds, paints only with the full model's colours and
// wears every finish it is given.
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_BUILDINGS } from '../generator/commercial';
import { COMMERCIAL } from '../generator/commercialStreets';
import { VILLAGE_HOUSES } from '../generator/village';
import { STATIONS } from '../generator/stations';
import { FOUNTAINS } from '../generator/fountains';
import { coverageCombinations, resolveParams, type ParamValues, type ProceduralDesign } from '../generator/design';
import { lodBudget } from '../generator/lod';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';

const GROUP: ProceduralDesign[] = [...COMMERCIAL_BUILDINGS, ...COMMERCIAL, ...VILLAGE_HOUSES, ...STATIONS, ...FOUNTAINS];

/** The base colour of each material a GLB uses, as hex. */
function colours(glb: Uint8Array): Map<string, string> {
  const { json } = parseGlb(glb) as { json: { materials: Array<{ name: string; pbrMetallicRoughness?: { baseColorFactor?: number[] } }> } };
  return new Map(json.materials.map(m => [m.name, (m.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1]).slice(0, 3).map(v => v.toFixed(3)).join(',')]));
}

describe('ordinary building LODs', () => {
  it('covers the 31 designs of the group, each with its own builder', () => {
    expect(GROUP).toHaveLength(31);
    for (const d of GROUP) expect(d.buildLod?.name).toBe(`${d.build.name}Lod`);
    expect(lodBudget(STATIONS.find(d => d.id.endsWith('prague-main-station'))!)).toBe(500);
  });
  for (const d of GROUP) {
    for (const v of coverageCombinations(d.params, d.finishParams)) {
      it(`${d.id} ${JSON.stringify(v)}: fits its budget, no windows, within the full model's bounds and colours`, () => {
        const low = d.buildLod!(v), glb = low.toGlb('test'), budget = lodBudget(d);
        expect(low.triangleCount()).toBeLessThanOrEqual(budget);
        expect(low.triangleCount()).toBeGreaterThan(budget * 0.3);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const { json, bin } = parseGlb(glb);
        expect(collectTriangles(json, bin).some(f => /glass|glazing|window/i.test(f.material))).toBe(false);
        const fullGlb = d.build(v).toGlb('full');
        const full = glbStats(fullGlb), lod = glbStats(glb);
        expect(lod.min[1]).toBeCloseTo(0, 3);
        expect(lod.max[1]).toBeGreaterThan(full.max[1] * 0.85);
        expect(lod.max[1]).toBeLessThanOrEqual(full.max[1] + 0.01);
        for (const k of [0, 2]) {
          expect(lod.max[k]! - lod.min[k]!).toBeGreaterThan((full.max[k]! - full.min[k]!) * 0.75);
          expect(lod.min[k]!).toBeGreaterThanOrEqual(full.min[k]! - 0.01);
          expect(lod.max[k]!).toBeLessThanOrEqual(full.max[k]! + 0.01);
        }
        // the LOD paints with the full model's own colours
        const fullColours = new Set(colours(fullGlb).values());
        for (const c of colours(glb).values()) expect(fullColours).toContain(c);
      });
    }
  }
  // a finish changes no geometry, only colours: each of its values shows in the LOD
  for (const d of GROUP.filter(g => g.finishParams?.length)) {
    for (const name of d.finishParams!) {
      it(`${d.id}: every ${name} finish shows in the LOD`, () => {
        const spec = d.params!.find(p => p.name === name)!;
        const seen = new Set<string>();
        for (const { value } of spec.values) {
          const v: ParamValues = { ...resolveParams(d.params!, {}), [name]: value };
          seen.add([...colours(d.buildLod!(v).toGlb('low')).values()].sort().join('|'));
        }
        expect(seen.size).toBe(spec.values.length);
      });
    }
  }
  it('mirrors the village houses with their side parameter', () => {
    for (const id of ['village-l-house', 'village-family-house']) {
      const d = VILLAGE_HOUSES.find(h => h.id.endsWith(id))!;
      const [left, right] = (['left', 'right'] as const).map(side => glbStats(d.buildLod!({ side }).toGlb('low')));
      expect(left!.min[0]).toBeCloseTo(-right!.max[0], 4);
      expect(left!.max[0]).toBeCloseTo(-right!.min[0], 4);
      expect(left!.triangles).toBe(right!.triangles);
    }
  });
  it('keeps the shape options a distant viewer tells apart', () => {
    const tris = (d: ProceduralDesign, v: ParamValues) => glbStats(d.buildLod!(v).toGlb('low'));
    const pitched = COMMERCIAL.find(d => d.id.endsWith('commercial-brick'))!;
    // a pitched roof rises over the flat roof's parapet
    expect(tris(pitched, { roof: 'pitched' }).max[1]).toBeGreaterThan(tris(pitched, { roof: 'flat' }).max[1] + 2);
    const cottage = VILLAGE_HOUSES.find(d => d.id.endsWith('village-cottage'))!;
    expect(tris(cottage, { storeys: 'two' }).max[1]).toBeGreaterThan(tris(cottage, { storeys: 'one' }).max[1] + 2);
    const hut = VILLAGE_HOUSES.find(d => d.id.endsWith('village-alpine-hut'))!;
    // a wrapped balcony widens the roof over it
    expect(tris(hut, { balcony: 'wrap' }).max[0]).toBeGreaterThan(tris(hut, { balcony: 'front' }).max[0] + 0.5);
  });
});
