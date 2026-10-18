import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { buildLodModel } from '../generator/lodModel';
import { lodBudget } from '../generator/lod';
import { coverageCombinations } from '../generator/design';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { LOD_GLASS } from '../generator/lodKit';
import { sample } from './catalogCache';

// The road vehicles' dedicated LODs (generator/lodRoad.ts): buses from the bus
// kit's description and the draft's notes, trucks from the truck kits' cabs and masses.
const BUSES = ['proc-vehicle-karosa-renault-citybus-12m', 'proc-vehicle-karosa-renault-citybus-18m', 'proc-vehicle-mb-citaro', 'proc-vehicle-mb-citaro-blue', 'proc-vehicle-mb-o345-g', 'proc-vehicle-solaris-urbino-15', 'proc-vehicle-bus-1', 'proc-vehicle-karosa-short', 'proc-vehicle-karosa-long'];
const TRUCKS = ['proc-vehicle-tatra-815-tipper', 'proc-vehicle-praga-rv', 'proc-vehicle-mercedes-atego-1224', 'proc-vehicle-cistern-semi-truck', 'proc-vehicle-mixer-truck', 'proc-vehicle-reefer-semi-truck'];

const faces = (id: string, values?: Record<string, string>) => {
  const m = buildLodModel(DESIGNS.get(id)!, values);
  const { json, bin } = parseGlb(m.toGlb(id));
  return { m, faces: collectTriangles(json, bin) };
};

describe('road vehicle LODs', () => {
  for (const id of [...BUSES, ...TRUCKS]) {
    const d = DESIGNS.get(id)!;
    it(`${id}: a dedicated LOD that uses its budget well in every variant`, () => {
      expect(d.buildLod).toBeDefined();
      for (const v of sample(coverageCombinations(d.params, d.finishParams))) {
        const { m, faces: f } = faces(id, v);
        expect(m.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
        expect(m.triangleCount()).toBeGreaterThan(0.7 * lodBudget(d));
        // windscreens in the one LOD glass; the wheels stand on the road
        expect(f.some((t) => t.material === LOD_GLASS)).toBe(true);
        expect(Math.min(...f.flatMap((t) => t.p.map((p) => p[1]!)))).toBeCloseTo(0, 6);
        // as long as the full model
        const full = d.build(v).positions(), low = m.positions();
        const xs = (p: number[]) => p.filter((_, i) => i % 3 === 0);
        expect(Math.max(...xs(low)) - Math.min(...xs(low))).toBeGreaterThan(0.95 * (Math.max(...xs(full)) - Math.min(...xs(full))));
      }
    });
  }

  it('keeps the articulated buses and the semi-trucks bending at the full rig\'s hinges', () => {
    for (const id of ['proc-vehicle-karosa-renault-citybus-18m', 'proc-vehicle-mb-o345-g', 'proc-vehicle-karosa-long', 'proc-vehicle-cistern-semi-truck', 'proc-vehicle-reefer-semi-truck']) {
      const d = DESIGNS.get(id)!;
      for (const v of sample(coverageCombinations(d.params, d.finishParams))) {
        const full = d.build(v).rig!, low = buildLodModel(d, v).rig!;
        expect(lodBudget(d)).toBe(200);
        expect(low.sections!.map((s) => s.pivot)).toEqual(full.sections!.map((s) => s.pivot));
        expect(low.maxBendDeg).toBe(full.maxBendDeg);
        expect(low.steer).toBeUndefined();
        // a bus's bellows between the same faces as in full detail
        if (full.joints) expect(low.joints!.map((j) => [j.front, j.rear])).toEqual(full.joints.map((j) => [j.front, j.rear]));
        else expect(low.joints).toEqual([]); // a semi-trailer's hitch has no bellows, as in full detail
      }
    }
  });

  it('paints the livery: each variant keeps its colours', () => {
    const mats = (id: string, v?: Record<string, string>) => new Set(faces(id, v).faces.map((t) => t.material));
    expect([...mats('proc-vehicle-karosa-short', { variant: 'b731' })]).toEqual(expect.arrayContaining(['body', 'stripe', 'rub', 'under']));
    expect([...mats('proc-vehicle-karosa-long', { variant: 'b941e' })]).toContain('roofGrey');
    expect([...mats('proc-vehicle-mb-citaro')]).toEqual(expect.arrayContaining(['body', 'skirt', 'band']));
    expect([...mats('proc-vehicle-bus-1')]).toContain('mint');
    expect([...mats('proc-vehicle-cistern-semi-truck')]).toEqual(expect.arrayContaining(['copper', 'steel']));
    expect([...mats('proc-vehicle-reefer-semi-truck')]).toEqual(expect.arrayContaining(['white', 'blue', 'alloy']));
  });
});
