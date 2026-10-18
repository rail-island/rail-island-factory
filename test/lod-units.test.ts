import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { buildLodModel } from '../generator/lodModel';
import { lodBudget } from '../generator/lod';
import { coverageCombinations } from '../generator/design';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { LOD_GLASS } from '../generator/lodKit';
import { MeshBuilder } from '../generator/meshBuilder';
import { fitUnit, sideGlass, type UnitBody } from '../generator/lodUnits';
import { sample } from './catalogCache';

// The dedicated LODs of the multiple units and railcars (lodUnits.ts, docs/models/lod.md).
const UNITS = ['cd-810', 'cd-812', 'cd-843', 'csd-m131', 'csd-m240', 'csd-m296', 'db-628', 'cd-451', 'cd-460', 'cd-470', 'cd-471', 'cd-680', 'ice-1', 'tgv', 'jr-kiha40', 'mav-mdmot', 'metro-81-71'];

const faces = (m: MeshBuilder) => {
  const { json, bin } = parseGlb(m.toGlb('lod'));
  return collectTriangles(json, bin);
};

describe('unit LODs', () => {
  for (const id of UNITS) {
    const d = DESIGNS.get(`proc-vehicle-${id}`)!;
    it(`${id}: every car and livery fits its budget, uses the budget, reaches the rail and keeps its livery`, () => {
      expect(d.buildLod).toBeDefined();
      for (const v of sample(coverageCombinations(d.params, d.finishParams))) {
        const m = buildLodModel(d, v);
        const n = m.triangleCount();
        // an articulated set gets 100 a car, 300 at most; a single car 100
        const cars = v.unit === 'set' ? Number(v.cars) : 1;
        expect(n).toBeLessThanOrEqual(Math.min(lodBudget(d), Math.min(300, 100 * cars)));
        // at least 70 % (a plain trailer, the MDmot's, shows all it has in 70)
        expect(n).toBeGreaterThanOrEqual(Math.min(300, 100 * cars) * 0.7);
        const f = faces(m);
        // the running gear stands on the rail
        expect(Math.min(...f.filter((t) => /bogie/.test(t.material)).flatMap((t) => t.p.map((p) => p[1])))).toBeLessThan(0.1);
        // at least two colours of the livery besides the glass and the running gear
        const paint = new Set(f.map((t) => t.material).filter((mat) => !/^(lodGlass|bogie|underframe|pantograph|bellows)$/.test(mat)));
        expect(paint.size).toBeGreaterThanOrEqual(2);
      }
    });
  }

  it('keeps the windscreens and window bands in the one LOD glass', () => {
    for (const id of ['cd-810', 'cd-843', 'cd-471', 'ice-1', 'jr-kiha40']) {
      const f = faces(buildLodModel(DESIGNS.get(`proc-vehicle-${id}`)!));
      expect(f.some((t) => t.material === LOD_GLASS)).toBe(true);
    }
  });

  it('raises the rear pantograph of an electric unit', () => {
    for (const id of ['cd-451', 'cd-460', 'cd-470', 'cd-471', 'ice-1', 'tgv']) {
      const f = faces(buildLodModel(DESIGNS.get(`proc-vehicle-${id}`)!)).filter((t) => t.material === 'pantograph');
      const top = Math.max(...f.flatMap((t) => t.p.map((p) => p[1])));
      expect(top).toBeGreaterThan(4.9);
      // the raised head stands behind the middle of the car
      const head = f.flatMap((t) => t.p).filter((p) => p[1] > top - 0.2);
      expect(Math.max(...head.map((p) => p[0]))).toBeLessThan(0);
    }
  });

  it('keeps a TGV trailer set articulated: a section per car, a bellows per joint, as the full rig', () => {
    const d = DESIGNS.get('proc-vehicle-tgv')!;
    for (const cars of ['2', '4', '6']) {
      const full = d.build({ unit: 'set', cars }).rig!;
      const low = buildLodModel(d, { unit: 'set', cars }).rig!;
      expect(low.sections!.map((s) => s.pivot)).toEqual(full.sections!.map((s) => s.pivot));
      expect(low.joints!.map((j) => j.sections)).toEqual(full.joints!.map((j) => j.sections));
      expect(low.supports).toBeUndefined();
    }
    expect(buildLodModel(d).rig ?? undefined).toBeUndefined();
  });

  it('draws a single-cab car square at its inner end and painted in its own paint there', () => {
    const body: UnitBody = {
      y0: 1, hw: [[1, 1.5], [3.5, 1.5], [4, 1]], side: [[1, 2, 'red'], [2, 4, 'white']], roof: 'white',
      front: { tip: [[1, 10], [2.5, 10], [4, 9]], paint: [[1, 4, 'red']] },
      rear: { tip: [[1, -10]], paint: [[1, 4, 'grey']] },
    };
    const m = fitUnit({ palette: { red: { color: '#f00' }, white: { color: '#fff' }, grey: { color: '#888' } }, bodies: [body], parts: [] }, 100);
    const f = faces(m);
    const rear = f.filter((t) => t.p.every((p) => Math.abs(p[0] + 10) < 1e-4));
    expect(rear.length).toBeGreaterThan(0);
    expect(new Set(rear.map((t) => t.material))).toEqual(new Set(['grey']));
    // no point behind the inner end, the raked nose ahead
    expect(Math.min(...f.flatMap((t) => t.p.map((p) => p[0])))).toBeCloseTo(-10, 4);
    expect(Math.max(...f.flatMap((t) => t.p.map((p) => p[0])))).toBeCloseTo(10, 4);
  });

  it('joins a row of windows into one band and leaves a short one optional', () => {
    const w = sideGlass([{ x0: 0, x1: 1, y0: 2, y1: 3 }, { x0: 1.3, x1: 2.3, y0: 2, y1: 3 }, { x0: 2.6, x1: 3.6, y0: 2, y1: 3 }, { x0: 8, x1: 8.5, y0: 2, y1: 3 }], 0.6);
    expect(w.map((r) => [r.u[0], r.u[1], r.optional === undefined])).toEqual([[0, 3.6, true], [8, 8.5, false]]);
  });
});
