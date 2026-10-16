import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three';
import { castle, pagoda, castleLod, pagodaLod } from '../generator/historicalLandmarks';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';
import { findCoplanarOverlaps } from '../generator/coplanar';

describe('Historical landmarks',()=>{
  for(const [id,build] of [ ['pagoda',pagoda], ...['courtyard','keep','fortress'].map(layout=>[layout,()=>castle({layout})] as const) ] as const){
    it(`${id} meets the landmark budget and exports clean deterministic geometry`,()=>{
      const bytes=build().toGlb(id),stats=glbStats(bytes);
      expect(stats.triangles).toBeGreaterThanOrEqual(20000);
      expect(stats.triangles).toBeLessThanOrEqual(30000);
      expect(stats.min[1]).toBe(0);
      expect(stats.primitives).toBeLessThanOrEqual(12);
      expect(Buffer.from(bytes).equals(Buffer.from(build().toGlb(id)))).toBe(true);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
      const {json,bin}=parseGlb(bytes);
      for(const t of collectTriangles(json,bin)){
        expect(t.p.flat().every(Number.isFinite)).toBe(true);
        const [a,b,c]=t.p.map(p=>new Vector3(...p));
        expect(b!.sub(a!).cross(c!.sub(a!)).length()).toBeGreaterThan(1e-8);
      }
    });
  }
  for(const [name,build] of [ ['pagoda',pagodaLod], ...['courtyard','keep','fortress'].map(layout=>[layout,()=>castleLod({layout})] as const) ] as const){
    it(`${name} keeps a clean grounded LOD within 500 triangles`,()=>{
      const model=build(),bytes=model.toGlb(name);
      expect(model.triangleCount()).toBeGreaterThan(0);
      expect(model.triangleCount()).toBeLessThanOrEqual(500);
      expect(glbStats(bytes).min[1]).toBe(0);
      expect(findCoplanarOverlaps(bytes)).toEqual([]);
    });
  }
  for(const layout of ['courtyard','keep','fortress'])it(`${layout} has a walk-through gate`,()=>{
    const {json,bin}=parseGlb(castle({layout}).toGlb('castle'));
    const depth=layout==='keep'?13:27;
    const tris=collectTriangles(json,bin);
    const ray=new Ray(new Vector3(0,2,depth+10),new Vector3(0,0,-1));
    expect(tris.some(t=>{
      const p=ray.intersectTriangle(...t.p.map(v=>new Vector3(...v)) as [Vector3,Vector3,Vector3],false,new Vector3());
      return p!==null && p.z>depth-2;
    })).toBe(false);
  });
});
