import { describe, expect, it } from 'vitest';
import { DESIGNS } from '../generator/generate';
import { previewKey } from '../src/catalogQuery';
import { glbStats } from '../generator/glbStats';
import { buildLodModel } from '../generator/lodModel';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';

describe('low detail exports', () => {
  // Every design's standalone LOD and its sampled variants' LODs: the catalog
  // sweep (test/catalogSweep.ts).
  it('keeps the Eiffel Tower continuous from its piers to the antenna', () => {
    const d = DESIGNS.get('proc-building-tower-eiffel')!;
    const m = d.buildLod();
    const stats = glbStats(m.toGlb('test'));
    expect(m.triangleCount()).toBeLessThanOrEqual(500);
    expect(stats.min[1]).toBe(0);
    expect(stats.max[1]).toBe(330);
  });
  it('separates preview identities while preserving the existing full-detail keys', () => {
    expect(previewKey('model',{},false)).toBe(previewKey('model',{}));
    expect(previewKey('model',{},true)).not.toBe(previewKey('model',{}));
    expect(previewKey('model',{b:'2',a:'1'},true)).toBe(previewKey('model',{a:'1',b:'2'},true));
  });
});


describe('dedicated silhouette regressions', () => {
  for(const id of ['cd-742','db-212','cd-771','csd-386'])it(`${id} retains its long hood or boiler instead of only a cab`,()=>{
    const d=DESIGNS.get(`proc-vehicle-${id}`)!,full=glbStats(d.build().toGlb('full')),low=glbStats(buildLodModel(d).toGlb('low'));
    expect(low.max[0]-low.min[0]).toBeGreaterThan((full.max[0]-full.min[0])*.75);
  });
  it('keeps the Colosseum arena open',()=>{
    const d=DESIGNS.get('proc-building-hist-colosseum')!;
    const {json,bin}=parseGlb(buildLodModel(d).toGlb('low'));
    for(const f of collectTriangles(json,bin))for(const p of f.p)expect(Math.hypot(p[0]/94,p[2]/78)).toBeGreaterThan(.51);
  });
});
