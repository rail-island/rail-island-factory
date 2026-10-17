import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { lodBudget } from '../generator/lod';
import { buildLodModel } from '../generator/lodModel';
import { coverageCombinations } from '../generator/design';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { LOD_GLASS } from '../generator/lodKit';

// The dedicated LODs of the trams, the CZ/SK livery coaches and the German
// double-deck coaches (generator/lodTrams.ts).
const TRAMS = ['tatra-t3', 'tatra-t6', 'tatra-kt8', 'tatra-kt4', 'kvag-gt4'];
const COACHES = ['cd-y-coach', 'zsr-coach', 'uic-z-coach', 'db-dosto', 'dr-sbahn-berlin'];
const faces = (id: string, values?: Record<string, string>) => {
  const { json, bin } = parseGlb(buildLodModel(DESIGNS.get(id)!, values).toGlb(id));
  return collectTriangles(json, bin);
};

describe('tram and coach LODs', () => {
  for (const name of [...TRAMS, ...COACHES]) {
    const id = `proc-vehicle-${name}`;
    it(`${name}: a dedicated LOD that uses its budget, with glass, bands and gear on the rail`, () => {
      const d = DESIGNS.get(id)!;
      expect(d.buildLod).toBeDefined();
      for (const v of coverageCombinations(d.params, d.finishParams)) {
        const m = buildLodModel(d, v);
        // within the budget and not far below it
        expect(m.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
        expect(m.triangleCount()).toBeGreaterThan(lodBudget(d) * 0.8);
        const fs = faces(id, v);
        expect(fs.some((f) => f.material === LOD_GLASS)).toBe(true);
        // the running gear reaches the rail
        expect(Math.min(...fs.flatMap((f) => f.p.map((p) => p[1])))).toBeLessThan(0.1);
        // the livery: three colours or more besides glass and the dark gear
        const mats = new Set(fs.map((f) => f.material).filter((x) => !/lodGlass|bogie|underframe|bellows|pantograph/.test(x)));
        expect(mats.size).toBeGreaterThanOrEqual(2);
      }
    });
  }

  for (const name of ['tatra-kt8', 'tatra-kt4', 'kvag-gt4']) {
    it(`${name}: keeps the full rig's sections and joints`, () => {
      const d = DESIGNS.get(`proc-vehicle-${name}`)!;
      const full = d.build().rig!, low = buildLodModel(d).rig!;
      expect(low.sections!.map((s) => [s.node, ...s.pivot.map((x) => x.toFixed(6))])).toEqual(full.sections!.map((s) => [s.node, ...s.pivot.map((x) => x.toFixed(6))]));
      expect(low.joints!.map((j) => [j.sections, j.front.toFixed(6), j.rear.toFixed(6)])).toEqual(full.joints!.map((j) => [j.sections, j.front.toFixed(6), j.rear.toFixed(6)]));
      expect(low.maxBendDeg).toBe(full.maxBendDeg);
      expect(lodBudget(d)).toBe(Math.min(300, 100 * full.sections!.length));
    });
  }

  it('trams draw one raised pantograph reaching the wire', () => {
    for (const name of TRAMS) {
      const top = Math.max(...faces(`proc-vehicle-${name}`).filter((f) => f.material === 'pantograph').flatMap((f) => f.p.map((p) => p[1])));
      expect(top).toBeGreaterThan(5.3);
    }
  });

  it('double-deck coaches show two decks of windows', () => {
    for (const id of ['proc-vehicle-db-dosto', 'proc-vehicle-dr-sbahn-berlin']) {
      const glass = faces(id).filter((f) => f.material === LOD_GLASS && Math.abs(Math.abs(f.p[0][2]) - 1.5) < 0.01);
      const ys = glass.flatMap((f) => f.p.map((p) => p[1]));
      expect(ys.some((y) => y < 2)).toBe(true);
      expect(ys.some((y) => y > 3.5)).toBe(true);
    }
  });
});
