import { proceduralId } from "../generator/modelId.ts";
import { describe, expect, it } from 'vitest';
import { TOWERS } from '../generator/towers';
import { DESIGNS, designSource } from '../generator/generate';
import { paramCombinations } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';

const HEIGHTS: Record<string,number> = {
  'proc-building-tower-bell':24.584785,'proc-building-tower-bigben':96,'proc-building-tower-eiffel':330,
  'proc-building-tower-radio':37,'proc-building-tower-stone':21.6,'proc-building-tower-kenney':13.5,
  'proc-building-tower-transmission':38.017048,'proc-building-tower-watch':21.6,
};
describe('Towers imported into the factory',()=>{
  it('covers exactly the eight shipped ids and registers building exports',()=>{
    expect(TOWERS.map(d=>d.id).sort()).toEqual(Object.keys(HEIGHTS).sort());
    for(const d of TOWERS){expect(DESIGNS.get(proceduralId(d.id))).toBe(d);expect(designSource(proceduralId(d.id))).toBe('towers.ts');expect(d.catalog?.category).toBe('Towers');expect(d.catalog?.group).toBe('towers');}
  });
  for(const d of TOWERS){
    it(`${d.id} exports its real height and an explicit exceptional placement scale`,()=>{
      const stats=glbStats(d.build().toGlb('test'));
      expect(stats.max[1]).toBeCloseTo(HEIGHTS[d.id]!,3);
      expect(d.catalog!.defaultScale).toBe(d.id.endsWith('tower-eiffel')?.55:1);
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
