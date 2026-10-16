import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three';
import { castle, castleLod, CASTLE_PARAMS } from '../generator/historicalLandmarks';
import { palace, palaceLod, PALACE_PARAMS } from '../generator/palace';
import { paramCombinations } from '../generator/design';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { DESIGNS } from '../generator/generate';

describe('Castle and Palace architectural variants',()=>{
  for(const [id,build,lod,specs] of [
    ['proc-building-castle',castle,castleLod,CASTLE_PARAMS],
    ['proc-building-hist-palace',palace,palaceLod,PALACE_PARAMS],
  ] as const){
    it(`${id} exposes its parameters under its shipped catalog id`,()=>{
      expect(DESIGNS.get(id)?.params).toEqual(specs);
      expect(()=>build({windows:'unknown'})).toThrow();
      expect(()=>lod({unknown:'value'})).toThrow();
      const defaults=Buffer.from(build().toGlb(id));
      for(const spec of specs)for(const value of spec.values.filter(v=>v.value!==spec.default)){
        expect(Buffer.from(build({[spec.name]:value.value}).toGlb(id)).equals(defaults)).toBe(false);
      }
    });
    for(const p of paramCombinations(specs))it(`${id}: ${Object.values(p).join('/')}`,()=>{
      const bytes=build(p).toGlb(id),stats=glbStats(bytes);
      expect(stats.triangles).toBeGreaterThanOrEqual(20000);
      expect(stats.triangles).toBeLessThanOrEqual(30000);
      expect(stats.min[1]).toBe(0);
      expect(Buffer.from(bytes).equals(Buffer.from(build(p).toGlb(id)))).toBe(true);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
      const low=lod(p).toGlb(id),ls=glbStats(low);
      expect(ls.triangles).toBeLessThanOrEqual(500);
      expect(ls.min[1]).toBe(0);
      expect(findCoplanarOverlaps(low)).toEqual([]);
      for(const data of [bytes,low]){
        const {json,bin}=parseGlb(data),tris=collectTriangles(json,bin);
        expect(tris.every(t=>{
          if(!t.p.flat().every(Number.isFinite))return false;
          const [a,b,c]=t.p.map(v=>new Vector3(...v));
          return b!.sub(a!).cross(c!.sub(a!)).length()>1e-8;
        })).toBe(true);
        const depth=id==='proc-building-castle'?(p.layout==='keep'?13:27):34;
        const ray=new Ray(new Vector3(0,2,depth+10),new Vector3(0,0,-1));
        expect(tris.some(t=>{
          const hit=ray.intersectTriangle(...t.p.map(v=>new Vector3(...v)) as [Vector3,Vector3,Vector3],false,new Vector3());
          return hit!==null && hit.z>depth-2;
        })).toBe(false);
      }
    });
  }
});
