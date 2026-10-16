// Deterministic, part-aware edge collapse for the standalone model's distant mesh.
// No renderer or Node dependency: this also runs inside exported JS models.
import type { ProceduralDesign } from './design.ts';

export function lodBudget(design: ProceduralDesign): number {
  if (design.lodTriangles) return design.lodTriangles;
  if (/^(proc-building-)?sky-/.test(design.id)) return 500;
  if (design.catalog?.category === 'Aircraft') return 200;
  if (['Historical', 'Towers'].includes(design.catalog?.category ?? '')) return 500;
  return 100;
}

export type LodPoint = [number, number, number];
export interface LodFace { points: [LodPoint, LodPoint, LodPoint]; material: string; part: number }
interface Vertex { p: LodPoint; q: number[]; faces: Set<number>; version: number }
interface Face { v: number[]; material: string; part: number; live: boolean; component: number }
interface Edge { a: number; b: number; av: number; bv: number; cost: number; p: LodPoint }

// A stable minimum heap; vertex ids break equal-cost ties across JS engines.
class Heap {
  items: Edge[] = [];
  less(a: Edge, b: Edge): boolean { return a.cost < b.cost || (a.cost === b.cost && (a.a < b.a || (a.a === b.a && a.b < b.b))); }
  push(e: Edge): void {
    let i = this.items.length;
    this.items.push(e);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(e, this.items[p])) break;
      this.items[i] = this.items[p]; i = p;
    }
    this.items[i] = e;
  }
  pop(): Edge | undefined {
    const first = this.items[0], last = this.items.pop();
    if (this.items.length && last) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let c = i * 2 + 1;
        if (c + 1 < this.items.length && this.less(this.items[c + 1], this.items[c])) c++;
        if (!this.less(this.items[c], last)) break;
        this.items[i] = this.items[c]; i = c;
      }
      this.items[i] = last;
    }
    return first;
  }
}

/** Reduces the whole model to a total budget, never welding across movable parts. */
export function simplifyLod(input: LodFace[], budget: number): LodFace[] {
  if (!Number.isInteger(budget) || budget < 4) throw new Error('invalid LOD budget');
  if (input.length <= budget) return input;
  const vertices: Vertex[] = [], faces: Face[] = [], weld = new Map<string, number>();
  for (const f of input) {
    const v = f.points.map(p => {
      const key = `${f.part}:${p.map(x => Math.round(x * 1e6)).join(',')}`;
      let id = weld.get(key);
      if (id === undefined) {
        id = vertices.length; weld.set(key, id);
        vertices.push({ p: [...p], q: Array(10).fill(0), faces: new Set(), version: 0 });
      }
      return id;
    });
    if (new Set(v).size !== 3) continue;
    const id = faces.length;
    faces.push({ v, material: f.material, part: f.part, live: true, component: -1 });
    for (const i of v) vertices[i].faces.add(id);
    const [a,b,c] = v.map(i => vertices[i].p);
    const u = b.map((x,k) => x-a[k]), w = c.map((x,k) => x-a[k]);
    const n = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]];
    const area = Math.hypot(...n);
    if (area < 1e-12) continue;
    const plane = [...n.map(x => x/area), -n.reduce((s,x,k) => s+x*a[k],0)/area];
    for (const i of v) {
      let k = 0;
      for (let r = 0; r < 4; r++) for (let c = r; c < 4; c++) vertices[i].q[k++] += plane[r]*plane[c]*area;
    }
  }
  // Separate closed solids and panels compete by spatial significance, not
  // by tessellation density. Reserve a small solid mesh for each survivor.
  const components: { faces: number[]; score: number; count: number; minimum: number }[] = [];
  for (let seed = 0; seed < faces.length; seed++) {
    if (faces[seed].component >= 0) continue;
    const id = components.length, ids: number[] = [], stack = [seed];
    const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
    faces[seed].component = id;
    while (stack.length) {
      const fi = stack.pop()!; ids.push(fi);
      for (const vi of faces[fi].v) {
        const vert = vertices[vi];
        vert.p.forEach((x,k) => { min[k]=Math.min(min[k],x); max[k]=Math.max(max[k],x); });
        for (const next of vert.faces) if (faces[next].component < 0) {
          faces[next].component = id; stack.push(next);
        }
      }
    }
    const size = max.map((x,k)=>x-min[k]).sort((a,b)=>a-b);
    const score = Math.max(size[0],size[2]*0.002)*size[1]*size[2];
    components.push({ faces: ids, score, count: ids.length, minimum: Math.min(12,ids.length) });
  }
  const ranked = components.map((c,id)=>({c,id})).sort((a,b)=>b.c.score-a.c.score||a.id-b.id);
  let reserved = 0;
  for (const {c} of ranked) {
    if (reserved+c.minimum <= budget*0.8 || reserved===0) reserved += c.minimum;
    else {
      c.count=0;
      for(const fi of c.faces) {
        faces[fi].live=false;
        for(const v of faces[fi].v) vertices[v].faces.delete(fi);
      }
    }
  }
  // Open edges need perpendicular constraint planes. Without them a facade
  // made from separate panels can collapse at zero error into floating roofs.
  const edges = new Map<string, { a: number; b: number; faces: number[] }>();
  faces.forEach((f, id) => {
    if (!f.live) return;
    for (let k = 0; k < 3; k++) {
      const a = Math.min(f.v[k], f.v[(k + 1) % 3]), b = Math.max(f.v[k], f.v[(k + 1) % 3]);
      const key = `${a}:${b}`;
      const edge = edges.get(key) ?? { a, b, faces: [] };
      edge.faces.push(id); edges.set(key, edge);
    }
  });
  for (const edge of edges.values()) {
    if (edge.faces.length !== 1) continue;
    const a = vertices[edge.a].p, b = vertices[edge.b].p;
    const third = faces[edge.faces[0]].v.find(v => v !== edge.a && v !== edge.b)!;
    const c = vertices[third].p;
    const u = b.map((x, k) => x - a[k]), v = c.map((x, k) => x - a[k]);
    const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    const w = [u[1]*n[2]-u[2]*n[1], u[2]*n[0]-u[0]*n[2], u[0]*n[1]-u[1]*n[0]];
    const length = Math.hypot(...w);
    if (!length) continue;
    const plane = [...w.map(x => x/length), -w.reduce((sum,x,k) => sum+x*a[k],0)/length];
    for (const id of [edge.a, edge.b]) {
      let k = 0;
      for (let r=0;r<4;r++) for(let c=r;c<4;c++) vertices[id].q[k++] += plane[r]*plane[c]*Math.hypot(...u)*10;
    }
  }
  const heap = new Heap();
  const enqueue = (ia: number, ib: number) => {
    const a = Math.min(ia,ib), b = Math.max(ia,ib);
    if (a === b) return;
    const va = vertices[a], vb = vertices[b];
    if (!va.faces.size || !vb.faces.size) return;
    const q = va.q.map((x,k) => x+vb.q[k]);
    const evalAt = (p: LodPoint) => {
      const h = [...p,1]; let value = 0, k = 0;
      for (let r=0;r<4;r++) for(let c=r;c<4;c++) value += q[k++]*h[r]*h[c]*(r===c?1:2);
      return Math.max(0,value);
    };
    // Endpoints keep sharp corners and do not overshoot the original envelope.
    const pa = va.p, pb = vb.p;
    const ca = evalAt(pa), cb = evalAt(pb);
    const distance = pa.reduce((s,x,k)=>s+(x-pb[k])**2,0);
    // The small length penalty removes small disconnected decoration first,
    // and avoids arbitrary zero-cost collapses across broad coplanar surfaces.
    heap.push({ a,b,av:va.version,bv:vb.version,cost:Math.min(ca,cb)+distance*1e-3,p:ca<=cb?pa:pb });
  };
  for (const f of faces) if (f.live) for(let k=0;k<3;k++) enqueue(f.v[k],f.v[(k+1)%3]);
  let count = components.reduce((sum,c)=>sum+c.count,0);
  while(count > budget) {
    const e = heap.pop();
    if (!e) break;
    const a=vertices[e.a],b=vertices[e.b];
    if(e.av!==a.version || e.bv!==b.version || !a.faces.size || !b.faces.size) continue;
    const touched = new Set([...a.faces,...b.faces]);
    const component = components[faces[[...a.faces][0]].component];
    const removed = [...touched].filter(id => faces[id].v.includes(e.a) && faces[id].v.includes(e.b)).length;
    if (component.count-removed < component.minimum) continue;
    component.count -= removed;
    a.p = e.p; a.q=a.q.map((x,k)=>x+b.q[k]); a.version++; b.version++;
    for(const id of touched) {
      const f=faces[id];
      for(const v of f.v) vertices[v].faces.delete(id);
      f.v=f.v.map(v=>v===e.b?e.a:v);
      if(new Set(f.v).size<3) { f.live=false; count--; }
      else for(const v of f.v) vertices[v].faces.add(id);
    }
    b.faces.clear();
    const neighbors = new Set<number>();
    for(const id of a.faces) for(const v of faces[id].v) if(v!==e.a) neighbors.add(v);
    for(const v of neighbors) enqueue(e.a,v);
  }
  return faces.filter(f=>f.live).map(f=>({ points:f.v.map(v=>vertices[v].p) as LodFace['points'],material:f.material,part:f.part }));
}
