// The dedicated LODs of the steam locomotives and tenders and of the freight
// wagons (generator/lodSteam.ts): within budget for every parameter combination,
// running gear on the rail, the liveries' key colours, the full model's length.
import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { lodBudget } from '../generator/lod';
import { buildLodModel } from '../generator/lodModel';
import { coverageCombinations, type ParamValues } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { glbStats } from '../generator/glbStats';
import { LOD_GLASS } from '../generator/lodKit';
import { steamSpec } from '../generator/steamLocos';
import { hullOf, steamLocoLod } from '../generator/lodSteam';
import { sample } from './catalogCache';

const STEAM = ['csd-433-0', 'csd-456-0', 'csd-475-1', 'csd-477-0', 'csd-498-1', 'csd-556-0', 'csd-636', 'csd-386', 'csd-m112'].map((s) => `proc-vehicle-${s}`);
const WAGONS = ['sqns-container-wagon', 'pao-flat-wagon', 'habis-sliding-wall-wagon', 'hadgs-hopper-wagon', 'faccs-hopper-wagon', 'falls-hopper-wagon', 'wap-hopper-wagon', 'legacy-covered-wagon', 'legacy-open-wagon', 'legacy-heavy-wagon'].map((s) => `proc-vehicle-${s}`);

const faces = (id: string, values?: ParamValues) => {
  const { json, bin } = parseGlb(buildLodModel(DESIGNS.get(id)!, values).toGlb(id));
  return collectTriangles(json, bin);
};
const colours = (id: string, values?: ParamValues) => new Set(faces(id, values).map((f) => f.color.map((c) => c.toFixed(3)).join(',')));

describe('steam and freight wagon LODs', () => {
  for (const id of [...STEAM, ...WAGONS]) {
    const d = DESIGNS.get(id)!;
    it(`${id}: a dedicated builder, within budget and on the rail for every combination`, () => {
      expect(d.buildLod).toBeTypeOf('function');
      expect(lodBudget(d)).toBe(100);
      for (const values of sample(coverageCombinations(d.params, d.finishParams))) {
        const full = glbStats(d.build(values).toGlb('full'));
        const m = buildLodModel(d, values);
        // the budget used, not only kept
        expect(m.triangleCount()).toBeLessThanOrEqual(100);
        expect(m.triangleCount()).toBeGreaterThanOrEqual(50);
        const glb = m.toGlb(id);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const st = glbStats(glb);
        // the wheels or bogies reach the rail; the body is as long as the full model's, less its buffers
        expect(st.min[1]).toBeLessThanOrEqual(0.1);
        expect(st.min[1]).toBeGreaterThanOrEqual(0);
        expect(st.max[1]).toBeLessThanOrEqual(full.max[1] + 0.05);
        expect(st.max[0] - st.min[0]).toBeGreaterThan(full.max[0] - full.min[0] - 1.6);
        expect(faces(id, values).some((f) => f.material !== LOD_GLASS && /glass|window|rubber|tyre|lamp|logo|badge|number/i.test(f.material))).toBe(false);
      }
    });
  }

  it('reads the spec: a locomotive has its boiler and chimney, a tender none', () => {
    const loco = new Set(faces('proc-vehicle-csd-498-1').map((f) => f.material));
    const tender = new Set(faces('proc-vehicle-csd-498-1', { unit: 'tender' }).map((f) => f.material));
    expect(loco.has('smokebox')).toBe(true);
    expect(tender.has('smokebox')).toBe(false);
    // the coal on the tender's bunker
    expect(tender.has('coal')).toBe(true);
    // red wheels and frames, blue paint
    expect(loco.has('wheel')).toBe(true);
    expect(loco.has('paint')).toBe(true);
  });

  it('builds straight from each design spec within the budget', () => {
    for (const id of STEAM) expect(steamLocoLod(steamSpec(id)).triangleCount()).toBeLessThanOrEqual(100);
  });

  it('shows each livery and load', () => {
    expect(colours('proc-vehicle-falls-hopper-wagon', { livery: 'sd' })).not.toEqual(colours('proc-vehicle-falls-hopper-wagon', { livery: 'cd' }));
    expect(colours('proc-vehicle-habis-sliding-wall-wagon', { livery: 'tw2' })).not.toEqual(colours('proc-vehicle-habis-sliding-wall-wagon', { livery: 'tw1' }));
    expect(faces('proc-vehicle-sqns-container-wagon', { cargo: 'maersk' }).some((f) => f.material === 'container')).toBe(true);
    expect(faces('proc-vehicle-sqns-container-wagon', { cargo: 'empty' }).some((f) => f.material === 'container')).toBe(false);
    expect(faces('proc-vehicle-pao-flat-wagon', { cargo: 'tubes' }).some((f) => f.material === 'tube')).toBe(true);
    expect(faces('proc-vehicle-wap-hopper-wagon', { cargo: 'coal' }).some((f) => f.material === 'gravel')).toBe(true);
    expect(faces('proc-vehicle-wap-hopper-wagon', { cargo: 'empty' }).some((f) => f.material === 'gravel')).toBe(false);
    // the low loader's cabin keeps its glass band
    expect(faces('proc-vehicle-legacy-heavy-wagon').some((f) => f.material === LOD_GLASS)).toBe(true);
  });

  it('reduces a deflector outline to a convex hull of few corners', () => {
    const hull = hullOf([[0, 0], [2, 0], [2, 1], [1, 1.2], [0, 1], [1, 0.5]], 4);
    expect(hull).toHaveLength(4);
    expect(hull).not.toContainEqual([1, 0.5]);
  });
});
