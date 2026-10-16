import { expect, it } from 'vitest';
import { INDUSTRY } from '../generator/industry.ts';
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
    const d = INDUSTRY.find(d => d.id === entry.designId)!;
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
  const d = INDUSTRY.find(d => d.id === 'industry-wind-turbine')!;
  const { json } = parseGlb(d.build().toGlb('wind'));
  const animated = json as unknown as { nodes: { name?: string }[]; animations: unknown[] };
  expect(animated.nodes.some(n => n.name === 'rotor')).toBe(true);
  expect(animated.animations).toHaveLength(1);
});
