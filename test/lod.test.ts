import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DESIGNS, designSource } from '../generator/generate';
import { bundleDesign } from '../generator/jsModel';
import { lodBudget } from '../generator/lod';
import { previewKey } from '../src/catalogQuery';
import { glbStats } from '../generator/glbStats';

import { buildLodModel } from '../generator/lodModel';
import { coverageCombinations } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { LOD_GLASS } from '../generator/lodKit';

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
    it(`${id}: standalone LOD matches the static silhouette and stays inside its budget`, async () => {
      const text = await bundleDesign(d, designSource(id));
      const mod = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`) as Module;
      expect(mod.lodTriangleBudget).toBe(lodBudget(d));
      const full = mod.default(THREE), low = mod.default(THREE, undefined, true);
      expect(full.userData.lod).toBe(false);
      expect(low.userData.lod).toBe(true);
      expect(low.name).toBe(id);
      expect(triangles(low)).toBeGreaterThan(0);
      expect(triangles(low)).toBeLessThanOrEqual(lodBudget(d));
      const expected = buildLodModel(d);
      expect(triangles(low)).toBe(expected.triangleCount());
      const again = buildLodModel(d);
      expect(again.toGlb('determinism')).toEqual(expected.toGlb('determinism'));
      expect(low.animations).toHaveLength(0);
      // a LOD is static but for an articulated vehicle's sections and joints (no supports, no steering)
      const rig = low.userData.rig;
      if (rig !== undefined) {
        expect(Object.keys(rig).sort()).toEqual(['joints','maxBendDeg','sections']);
        expect(rig.sections.length).toBeGreaterThan(1);
      }
      low.traverse(o => { if (o !== low && !(o instanceof THREE.Mesh)) expect(o.name).toMatch(/^(section|joint)[0-9]+$/); });
      // the same triangles, in model space, as the generator's GLB (compared as sets: node order may differ)
      const {json,bin} = parseGlb(expected.toGlb(id));
      const key = (p: number[]) => p.map(v => v.toFixed(4)).join(',');
      const reference = new Map<string, string[]>();
      for (const f of collectTriangles(json,bin)) {
        const list = reference.get(f.material) ?? []; list.push(f.p.map(key).join('|')); reference.set(f.material,list);
      }
      const got = new Map<string, string[]>();
      low.updateMatrixWorld(true);
      low.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return;
        const pos = o.geometry.getAttribute('position'), v = new THREE.Vector3();
        const list = got.get(o.name) ?? [];
        for (let i = 0; i < pos.count; i += 3) {
          const tri: string[] = [];
          for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, i + k).applyMatrix4(o.matrixWorld); tri.push(key([v.x, v.y, v.z])); }
          list.push(tri.join('|'));
        }
        got.set(o.name, list);
      });
      expect([...got.keys()].sort()).toEqual([...reference.keys()].sort());
      for (const [mat, list] of got) expect([...list].sort()).toEqual([...reference.get(mat)!].sort());
      if (mod.pose) {
        const before = low.toJSON();
        mod.pose(low, {steer:.4,bend:[.3,.2]});
        if (rig?.joints?.length) mod.renderJoint?.(low,0);
        // posing moves an articulated LOD's sections and nothing of a static one
        if (rig === undefined) expect(low.toJSON()).toEqual(before);
        else expect(low.getObjectByName('section1')!.rotation.y).not.toBe(0);
      }

    });
    for (const values of coverageCombinations(d.params,d.finishParams)) {
      it(`${id}: no flicker or detail fragments for ${JSON.stringify(values)}`, () => {
        const model = buildLodModel(d,values), glb = model.toGlb(id);
        expect(model.triangleCount()).toBeGreaterThan(0);
        expect(model.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const {json,bin} = parseGlb(glb), faces=collectTriangles(json,bin);
        expect(faces.every(f=>f.p.flat().every(Number.isFinite))).toBe(true);
        expect(model.animations()).toEqual([]);
        if (id.startsWith('proc-vehicle-')) {
          // detail materials never reach a LOD; the one dark LOD glass of windscreens and window bands may
          expect(faces.some(f=>f.material!==LOD_GLASS&&/glass|window|rubber|tyre|lamp|logo|badge|number/i.test(f.material))).toBe(false);
        }
      });
    }
  }
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
