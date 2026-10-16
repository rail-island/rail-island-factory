import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DESIGNS, designSource } from '../generator/generate';
import { bundleDesign } from '../generator/jsModel';
import { lodBudget, simplifyLod } from '../generator/lod';
import { previewKey } from '../src/catalogQuery';
import { glbStats } from '../generator/glbStats';

interface Module {
  default: (three: typeof THREE, params?: Record<string,string>, lod?: boolean) => THREE.Group;
  lodTriangleBudget: number;
  pose?: (root: THREE.Group, pose: {steer: number; bend: number[]}) => void;
  renderJoint?: (root: THREE.Group, i: number) => void;
}
function triangles(group: THREE.Group): number {
  let count = 0;
  group.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    const p = o.geometry.getAttribute('position'), n = o.geometry.getAttribute('normal');
    count += p.count / 3;
    expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(n.array).every(Number.isFinite)).toBe(true);
    for (let i=0;i<n.count;i++) expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);
  });
  return count;
}

describe('low detail exports', () => {
  for (const [id, d] of DESIGNS) {
    it(`${id}: standalone LOD and every individual parameter value stay inside the budget`, async () => {
      const text = await bundleDesign(d, designSource(id));
      const mod = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`) as Module;
      expect(mod.lodTriangleBudget).toBe(lodBudget(d));
      const full = mod.default(THREE), low = mod.default(THREE, undefined, true);
      expect(full.userData.lod).toBe(false);
      expect(low.userData.lod).toBe(true);
      expect(low.name).toBe(id);
      expect(triangles(low)).toBeGreaterThan(0);
      expect(triangles(low)).toBeLessThanOrEqual(lodBudget(d));
      const expected = (d.buildLod?.() ?? d.build()).lowDetail(lodBudget(d));
      expect(triangles(low)).toBe(expected.triangleCount());
      const again = (d.buildLod?.() ?? d.build()).lowDetail(lodBudget(d));
      expect(again.toGlb('determinism')).toEqual(expected.toGlb('determinism'));
      const fullBox = new THREE.Box3().setFromObject(full), lowBox = new THREE.Box3().setFromObject(low);
      expect(fullBox.expandByScalar(.001).containsBox(lowBox)).toBe(true);
      // All pivots survive, including nodes whose small visual detail was removed.
      full.traverse(o => { if(o instanceof THREE.Group && o !== full) expect(low.getObjectByName(o.name)).toBeDefined(); });
      if (mod.pose) {
        const before = low.toJSON();
        mod.pose(low, {steer:.4,bend:[.3,.2]});
        mod.renderJoint?.(low,0);
        expect(low.toJSON()).toEqual(before);
      }
      for(const p of d.params ?? []) for(const value of p.values) {
        if(value.value === p.default) continue;
        const mesh = mod.default(THREE, {[p.name]:value.value}, true);
        expect(triangles(mesh), `${p.name}=${value.value}`).toBeGreaterThan(0);
        expect(triangles(mesh), `${p.name}=${value.value}`).toBeLessThanOrEqual(lodBudget(d));
      }
    });
  }
  it('keeps the Eiffel Tower continuous from its piers to the antenna', () => {
    const d = DESIGNS.get('proc-building-tower-eiffel')!;
    const m = d.buildLod!();
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
  it('rejects invalid simplification budgets', () => {
    for(const budget of [-1,0,3,4.5,NaN,Infinity]) expect(()=>simplifyLod([],budget)).toThrow('invalid LOD budget');
  });
});
