import { describe, expect, it } from 'vitest';
import { TOWERS } from '../generator/towers';
import { DESIGNS, designSource } from '../generator/generate';
import { paramCombinations } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';

const HEIGHTS: Record<string,number> = {
  'tower-bell':34.18117,'tower-bigben':81.52325,'tower-eiffel':183.02439,
  'tower-radio':51.99029,'tower-stone':41.66234,'tower-kenney':34.69810,
  'tower-transmission':48.56582,'tower-watch':55.87389,
};
describe('Towers imported into the factory',()=>{
  it('covers exactly the eight shipped ids and registers building exports',()=>{
    expect(TOWERS.map(d=>d.id).sort()).toEqual(Object.keys(HEIGHTS).sort());
    for(const d of TOWERS){expect(DESIGNS.get(d.id)).toBe(d);expect(designSource(d.id)).toBe('towers.ts');expect(d.catalog?.category).toBe('Towers');expect(d.catalog?.group).toBe('towers');}
  });
  for(const d of TOWERS){
    it(`${d.id} preserves the default placed height`,()=>{
      const stats=glbStats(d.build().toGlb('test'));
      expect(stats.max[1]*d.catalog!.defaultScale).toBeCloseTo(HEIGHTS[d.id]!,3);
    });
    for(const p of paramCombinations(d.params))it(`${d.id} ${JSON.stringify(p)} is deterministic, grounded, finite and within budget`,()=>{
      const m=d.build(p),bytes=m.toGlb('test'),stats=glbStats(bytes);
      expect(stats.triangles).toBeLessThanOrEqual(10000);
      expect(stats.triangles).toBeGreaterThan(100);
      expect(stats.min[1]).toBeCloseTo(0,4);
      expect([...stats.min,...stats.max].every(Number.isFinite)).toBe(true);
      expect(Buffer.from(bytes).equals(Buffer.from(d.build(p).toGlb('test')))).toBe(true);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
      const {json,bin}=parseGlb(bytes);
      expect(collectTriangles(json,bin).every(t=>t.p.flat().every(Number.isFinite))).toBe(true);
    });
    it(`${d.id} rejects unsupported parameters`,()=>{expect(()=>d.build({unknown:'x'})).toThrow(/unknown parameter/);});
  }
});
