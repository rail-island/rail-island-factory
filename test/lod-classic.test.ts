import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../generator/vehicles';
import { lodBudget } from '../generator/lod';
import { coverageCombinations } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { glbStats } from '../generator/glbStats';
import { LOD_GLASS } from '../generator/lodKit';
import { coachLod } from '../generator/lodClassic';
import { csdBalm } from '../generator/csdCoaches';
import { sample } from './catalogCache';

// The classic group's dedicated LODs (lodClassic.ts): the CD 150 and CD 230, the
// coaches of the CSD coach kit, the freight wagons and the American truck.
const IDS = [
  'proc-vehicle-american-truck', 'proc-vehicle-cd-150', 'proc-vehicle-cd-230',
  'proc-vehicle-csd-classic-green-coach', 'proc-vehicle-csd-balm', 'proc-vehicle-csd-bam', 'proc-vehicle-csd-bdmtee',
  'proc-vehicle-csd-be31', 'proc-vehicle-csd-bi20', 'proc-vehicle-csd-dsk',
  'proc-vehicle-bmo-double-deck-coach', 'proc-vehicle-cd-green-white-coach',
  'proc-vehicle-nas-flat-wagon', 'proc-vehicle-ua-open-wagon', 'proc-vehicle-eas-open-wagon',
  'proc-vehicle-raj-hopper-wagon', 'proc-vehicle-rah-tank-wagon',
];
const design = (id: string) => VEHICLES.find((d) => d.id === id)!;
function materials(m: { toGlb(name: string): Uint8Array }): Map<string, number> {
  const { json, bin } = parseGlb(m.toGlb('lod'));
  const out = new Map<string, number>();
  for (const f of collectTriangles(json, bin)) out.set(f.material, (out.get(f.material) ?? 0) + 1);
  return out;
}

describe('classic LODs', () => {
  for (const id of IDS) {
    const d = design(id);
    it(`${id}: every variant fits its budget well, without flicker, standing on the rail or road`, () => {
      expect(d.buildLod).toBeDefined();
      const budget = lodBudget(d);
      for (const values of sample(coverageCombinations(d.params, d.finishParams))) {
        const m = d.buildLod(values);
        const n = m.triangleCount();
        expect(n).toBeLessThanOrEqual(budget);
        // a dedicated LOD uses its budget: no variant falls far below it
        expect(n).toBeGreaterThan(budget * 0.4);
        const glb = m.toGlb(id);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        // running gear reaches the rail (bogie blocks at 8 cm) or the road
        expect(glbStats(glb).min[1]).toBeLessThan(0.1);
        expect(glbStats(glb).min[1]).toBeGreaterThanOrEqual(0);
        for (const mat of materials(m).keys()) if (mat !== LOD_GLASS) expect(mat).not.toMatch(/glass|window|rubber|tyre|lamp|logo|badge|number/i);
      }
    });
  }

  it('keeps the electric locomotives\' liveries, windscreens and raised pantograph', () => {
    const cd150 = materials(design('proc-vehicle-cd-150').buildLod());
    for (const mat of ['green', 'cream', 'roof', 'cooler', 'pantograph', LOD_GLASS]) expect(cd150.get(mat)).toBeGreaterThan(0);
    const cd230 = materials(design('proc-vehicle-cd-230').buildLod());
    for (const mat of ['red', 'yellow', 'pantograph', LOD_GLASS]) expect(cd230.get(mat)).toBeGreaterThan(0);
    const cd340 = materials(design('proc-vehicle-cd-230').buildLod({ livery: 'cd340' }));
    expect(cd340.get('blue')).toBeGreaterThan(0);
    // the raised pantograph stands well above the roof
    expect(glbStats(design('proc-vehicle-cd-150').buildLod().toGlb('x')).max[1]).toBeGreaterThan(5.5);
  });

  it('paints the coaches in their bands, with a continuous window band and a roof', () => {
    const y = materials(design('proc-vehicle-csd-classic-green-coach').buildLod());
    for (const mat of ['green', 'yellow', 'roof', LOD_GLASS]) expect(y.get(mat)).toBeGreaterThan(0);
    const gw = materials(design('proc-vehicle-cd-green-white-coach').buildLod({ variant: 'b' }));
    for (const mat of ['green', 'white', 'roof', LOD_GLASS]) expect(gw.get(mat)).toBeGreaterThan(0);
    // the Be31's roof is a volume of its own over the compartments and vestibules
    expect(materials(design('proc-vehicle-csd-be31').buildLod()).get('roof')).toBeGreaterThan(0);
    // the Bmo's well between its bogies reaches down to 0.2 m, its upper deck to 4.5 m
    const bmo = glbStats(design('proc-vehicle-bmo-double-deck-coach').buildLod().toGlb('x'));
    expect(bmo.max[1]).toBeCloseTo(4.5, 5);
  });

  it('records a coach builder without changing its full model', () => {
    const before = csdBalm().toGlb('x');
    coachLod(() => csdBalm());
    expect(csdBalm().toGlb('x')).toEqual(before);
  });

  it('shows each wagon load in its own colours', () => {
    const nas = design('proc-vehicle-nas-flat-wagon');
    expect(materials(nas.buildLod({ cargo: 'tubes' })).get('tube')).toBeGreaterThan(0);
    expect(materials(nas.buildLod({ cargo: 'reels' })).get('reel')).toBeGreaterThan(0);
    expect(materials(nas.buildLod({ cargo: 'wood' })).get('logEnd')).toBeGreaterThan(0);
    expect(materials(design('proc-vehicle-eas-open-wagon').buildLod({ cargo: 'coal' })).get('coal')).toBeGreaterThan(0);
    expect(materials(design('proc-vehicle-ua-open-wagon').buildLod({ cargo: 'sand' })).get('sand')).toBeGreaterThan(0);
    expect(materials(design('proc-vehicle-rah-tank-wagon').buildLod()).get('band')).toBeGreaterThan(0);
  });

  it('keeps the truck and its trailer as two sections about the king pin', () => {
    const d = design('proc-vehicle-american-truck');
    expect(lodBudget(d)).toBe(200);
    const m = d.buildLod();
    expect(m.rig?.sections?.map((s) => s.node)).toEqual(['section0', 'section1']);
    expect(m.rig?.sections?.[1]!.pivot).toEqual(d.build().rig!.sections![1]!.pivot);
    expect(m.rig?.steer).toBeUndefined();
    expect(materials(m).get('tread')).toBeGreaterThan(0);
  });
});
