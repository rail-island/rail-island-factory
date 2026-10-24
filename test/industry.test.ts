import { proceduralId } from "../generator/modelId.ts";
import { expect, it } from 'vitest';
import { buildingSpec, INDUSTRY } from '../generator/industry.ts';
import { bayLayout, FACES, faceLength, hallOpenings, PLINTH } from '../generator/industryHall.ts';
import { INDUSTRY_MIGRATION } from '../generator/industryMigration.ts';
import { paramCombinations, resolveParams } from '../generator/design.ts';
import { findCoplanarOverlaps } from '../generator/coplanar.ts';
import { glbStats } from '../generator/glbStats.ts';
import { parseGlb } from '../generator/glbTriangles.ts';
it('covers the 35 audited Industry entries with valid target parameters', () => {
  expect(INDUSTRY_MIGRATION).toHaveLength(35);
  expect(new Set(INDUSTRY_MIGRATION.map(e => e.sourceId)).size).toBe(35);
  expect(INDUSTRY_MIGRATION.filter(e => e.sourceGroup === 'industry')).toHaveLength(31);
  for (const entry of INDUSTRY_MIGRATION) {
    const d = INDUSTRY.find(d => proceduralId(d.id) === proceduralId(entry.designId))!;
    expect(d).toBeDefined();
    expect(() => resolveParams(d.params ?? [], entry.params)).not.toThrow();
  }
  const buildings = INDUSTRY_MIGRATION.filter(e => e.sourceId.startsWith('ind-building-'));
  expect(buildings).toHaveLength(20);
  expect(new Set(buildings.map(e => e.designId)).size).toBe(4);
});
for (const d of INDUSTRY) it(`${d.id}: all variants deterministic, grounded and under 10k triangles`, () => {
  const shapes = new Set<string>();
  for (const p of paramCombinations(d.params)) {
    const m = d.build(p), glb = m.toGlb('industry test');
    expect(m.triangleCount()).toBeLessThanOrEqual(10000);
    expect(m.triangleCount()).toBeGreaterThan(200);
    expect(Buffer.from(glb).equals(Buffer.from(d.build(p).toGlb('industry test')))).toBe(true);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
    const stats = glbStats(glb);
    expect(stats.min[1]).toBe(0);
    for (let i = 0; i < 3; i++) { expect(Number.isFinite(stats.max[i])).toBe(true); expect(stats.max[i]!).toBeGreaterThan(stats.min[i]!); }
    shapes.add(Buffer.from(glb).toString('base64'));
  }
  expect(shapes.size).toBe(paramCombinations(d.params).length);
});
it('exports a separate animated turbine rotor', () => {
  const d = INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-wind-turbine')!;
  const { json } = parseGlb(d.build().toGlb('wind'));
  const animated = json as unknown as { nodes: { name?: string }[]; animations: unknown[] };
  expect(animated.nodes.some(n => n.name === 'rotor')).toBe(true);
  expect(animated.animations).toHaveLength(1);
});
// Regression: dock doors were drawn in front of the ground-floor windows (the roller
// shutters read as ventilators over the glass). The hall kit now plans every opening
// and builds the wall around them, so no two may overlap or cut a pilaster.
it('plans hall openings that never overlap each other or a pilaster', () => {
  const specs = ['mill', 'hall', 'saw', 'warehouse'].flatMap(kind => ['compact', 'extended'].map(size => buildingSpec(kind, size)));
  specs.push({ w: 16, d: 12, h: 8, roof: 'gable', floors: [PLINTH] }, { w: 24, d: 14, h: 10, roof: 'saw', floors: [PLINTH] });
  for (const s of specs) {
    const openings = hallOpenings(s);
    expect(openings.filter(o => o.kind === 'dock').length).toBeGreaterThan(1);
    for (const face of FACES) {
      const mine = openings.filter(o => o.face === face), { centres, bay } = bayLayout(s, face);
      for (const [i, a] of mine.entries()) {
        expect(a.u0).toBeGreaterThan(-faceLength(s, face) / 2 + .5);
        expect(a.u1).toBeLessThan(faceLength(s, face) / 2 - .5);
        expect(a.y1).toBeLessThan(s.h);
        for (const c of centres.slice(1)) expect(a.u1 < c - bay / 2 - .3 || a.u0 > c - bay / 2 + .3).toBe(true);
        for (const b of mine.slice(i + 1)) expect(a.u1 <= b.u0 || b.u1 <= a.u0 || a.y1 <= b.y0 || b.y1 <= a.y0, `${face} ${JSON.stringify([a, b])}`).toBe(true);
      }
    }
  }
});
