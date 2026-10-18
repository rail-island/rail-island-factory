// The dedicated LODs of the Czech electrics, the mainline diesels and the small
// diesels (generator/lodLocos.ts): every variant within its budget and using it,
// the running gear reaching the rail, the livery's colours and the pantographs.
import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { coverageCombinations } from '../generator/design';
import { lodBudget } from '../generator/lod';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { LOD_GLASS } from '../generator/lodKit';
import { sample } from './catalogCache';

const ELECTRICS = ['cd-110', 'cd-130', 'cd-140', 'cd-169'];
const DIESELS = ['cd-750', 'cd-749', 'cd-781', 'csd-t679-0', 'csd-t499', 'cd-771', 'cd-704', 'cd-710', 'cd-714', 'cd-742', 'db-212', 'muv-69'];

const faces = (id: string, values?: Record<string, string>) => {
  const m = DESIGNS.get(id)!.buildLod(values);
  const { json, bin } = parseGlb(m.toGlb(id));
  return { m, faces: collectTriangles(json, bin) };
};

describe('dedicated locomotive LODs', () => {
  for (const short of [...ELECTRICS, ...DIESELS]) {
    const id = `proc-vehicle-${short}`;
    it(`${id}: every variant fits and uses its budget, standing on the rail`, () => {
      const d = DESIGNS.get(id)!;
      expect(d.buildLod).toBeDefined();
      for (const v of sample(coverageCombinations(d.params, d.finishParams))) {
        const { m } = faces(id, v);
        expect(m.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
        expect(m.triangleCount()).toBeGreaterThanOrEqual(lodBudget(d) * 0.75);
        const low = glbStats(m.toGlb(id)), full = glbStats(d.build(v).toGlb(id));
        // running gear reaches the rail; the body keeps the full model's length
        expect(low.min[1]).toBeLessThan(0.1);
        expect(low.max[0] - low.min[0]).toBeGreaterThan((full.max[0] - full.min[0]) * 0.85);
      }
    });
  }

  it('paints the liveries: the CD 130 in green and cream, the CD 750 with its yellow sweep, the CD 742 Viamont in yellow', () => {
    const mats = (id: string, v?: Record<string, string>) => new Set(faces(id, v).faces.map((f) => f.material));
    expect([...mats('proc-vehicle-cd-130', { livery: 'cd130' })]).toEqual(expect.arrayContaining(['green', 'cream', 'roof', 'bogie']));
    expect([...mats('proc-vehicle-cd-750', { livery: 'cd750' })]).toEqual(expect.arrayContaining(['green', 'grey', 'yellow']));
    expect([...mats('proc-vehicle-cd-742', { variant: 'viamont742' })]).toEqual(expect.arrayContaining(['body', 'black']));
    // windscreens and window bands in the one LOD glass
    expect(mats('proc-vehicle-cd-140').has(LOD_GLASS)).toBe(true);
    expect(mats('proc-vehicle-csd-t679-0').has(LOD_GLASS)).toBe(true);
  });

  it('raises a pantograph over the roof of the electrics and none on the diesels', () => {
    for (const short of ELECTRICS) {
      const { m } = faces(`proc-vehicle-${short}`);
      expect(glbStats(m.toGlb(short)).max[1]).toBeGreaterThan(5.5);
      // the raised one at the rear (or the CD 110's single one over its centre cab)
      const top = faces(`proc-vehicle-${short}`).faces.filter((f) => f.material === 'pantograph' && f.p.some((p) => p[1] > 5.5));
      expect(top.length).toBeGreaterThan(0);
      expect(Math.max(...top.flatMap((f) => f.p.map((p) => p[0])))).toBeLessThan(0.8);
    }
    for (const short of DIESELS) expect(faces(`proc-vehicle-${short}`).faces.some((f) => f.material === 'pantograph')).toBe(false);
  });

  it('keeps the hood units\' cabs standing over their hoods', () => {
    // [id, the cab's x span, a stretch of hood]
    const cases: Array<[string, [number, number], [number, number]]> = [
      ['proc-vehicle-cd-771', [3.4, 5.7], [-7, 0]],
      ['proc-vehicle-cd-714', [0.6, 2.9], [-6, 0]],
      ['proc-vehicle-db-212', [-0.7, 2.3], [-5.5, -1]],
      ['proc-vehicle-cd-710', [-0.7, 1.8], [-3.9, -1]],
    ];
    for (const [id, cab, hood] of cases) {
      const fs = faces(id).faces;
      const top = ([a, b]: [number, number]) => Math.max(...fs.filter((f) => f.p.every((p) => p[0] >= a && p[0] <= b)).flatMap((f) => f.p.map((p) => p[1])));
      expect(top(cab)).toBeGreaterThan(top(hood) + 0.5);
    }
  });
});
