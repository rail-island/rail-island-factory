// The plaza landmarks (docs/models/plaza-landmarks.md): each meets its triangle tier,
// stands on the ground, exports clean deterministic geometry, carries its plaza rule
// and its references, and has a dedicated LOD that keeps its silhouette.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAZA_LANDMARKS, PLAZA_TIERS, plazaName } from '../generator/plazaLandmarks';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { findCoplanarOverlaps } from '../generator/coplanar';
import catalogModels from '../generator/catalogModels.json';

describe('plaza landmarks', () => {
  it('are the designs of the first three batches, each with its own LOD builder and tier', () => {
    expect(PLAZA_LANDMARKS.map(d => plazaName(d.id)).sort()).toEqual([
      'arc-de-triomphe', 'atomium', 'bandstand', 'cloth-hall', 'equestrian-statue', 'gateway-of-india',
      'half-timbered-town-hall', 'leaning-tower-of-pisa', 'market-cross', 'nelsons-column', 'pantheon', 'parthenon',
      'plague-column', 'prague-old-town-hall', 'statue-of-liberty', 'taj-mahal', 'temple-of-heaven', 'war-memorial',
    ]);
    for (const d of PLAZA_LANDMARKS) {
      expect(d.buildLod.name).toBe(`${d.build.name}Lod`);
      expect(PLAZA_TIERS[plazaName(d.id)], d.id).toBeDefined();
    }
  });
  for (const d of PLAZA_LANDMARKS) {
    it(`${d.id} meets its tier and exports clean deterministic geometry`, () => {
      const [min, max] = PLAZA_TIERS[plazaName(d.id)]!;
      const bytes = d.build().toGlb('t'), stats = glbStats(bytes);
      expect(stats.triangles).toBeGreaterThanOrEqual(min);
      expect(stats.triangles).toBeLessThanOrEqual(max);
      expect(stats.min[1]).toBeCloseTo(0, 6);
      expect(stats.primitives).toBeLessThanOrEqual(12);
      expect(Buffer.from(bytes).equals(Buffer.from(d.build().toGlb('t')))).toBe(true);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
      const { json, bin } = parseGlb(bytes);
      for (const t of collectTriangles(json, bin)) {
        expect(t.p.flat().every(Number.isFinite)).toBe(true);
        const [a, b, c] = t.p;
        const u = [b![0] - a![0], b![1] - a![1], b![2] - a![2]], v = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
        expect(Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!)).toBeGreaterThan(1e-8);
      }
    });
    it(`${d.id} keeps a grounded LOD within 500 triangles with the full model's height and plan`, () => {
      const low = d.buildLod(), glb = low.toGlb('low');
      expect(low.triangleCount()).toBeGreaterThan(100);
      expect(low.triangleCount()).toBeLessThanOrEqual(500);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      const { json, bin } = parseGlb(glb);
      expect(collectTriangles(json, bin).some(f => /glass|window/i.test(f.material))).toBe(false);
      const full = glbStats(d.build().toGlb('full')), lod = glbStats(glb);
      expect(lod.min[1]).toBeCloseTo(0, 3);
      expect(lod.max[1]).toBeGreaterThan(full.max[1] * 0.93);
      expect(lod.max[1]).toBeLessThanOrEqual(full.max[1] + 0.01);
      for (const k of [0, 2]) {
        expect(lod.max[k]! - lod.min[k]!).toBeGreaterThan((full.max[k]! - full.min[k]!) * 0.8);
        expect(lod.max[k]! - lod.min[k]!).toBeLessThanOrEqual(full.max[k]! - full.min[k]! + 0.01);
      }
    });
    it(`${d.id} carries a plaza rule and its committed references`, () => {
      expect(d.game?.plaza?.cities.length).toBeGreaterThan(0);
      expect(fs.existsSync(`assets/${d.references}/SOURCES.md`)).toBe(true);
    });
  }
  it('stay drafts until the user confirms them', () => {
    for (const d of PLAZA_LANDMARKS) expect(catalogModels.ids).not.toContain(`proc-building-${plazaName(d.id)}`);
  });
});
