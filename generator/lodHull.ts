// Closed convex envelopes reconstructed from structural geometry. No source
// triangle is retained: detail cannot survive as a disconnected polygon.
export type Point = [number, number, number];
export interface EnvelopeFace { points: [Point, Point, Point]; material: string; part: number }
export const sub = (a: Point, b: Point): Point => a.map((x, k) => x - b[k]) as Point;
export const dot = (a: Point, b: Point): number => a.reduce((sum, x, k) => sum + x * b[k], 0);
export const cross = (a: Point, b: Point): Point => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export const normal = (p: Point[]): Point => cross(sub(p[1], p[0]), sub(p[2], p[0]));

/** Deterministic directional samples: 8, 14 or 26 vertices, at most 12/24/48 triangles. */
export function envelope(points: Point[], samples: 8 | 14 | 26, side: string, roof: string): EnvelopeFace[] {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of points) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  const size = max.map((x, k) => x - min[k]);
  if (size.some(x => x < 1e-7)) return [];
  const dirs: Point[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) dirs.push([x,y,z]);
  if (samples >= 14) for (let k = 0; k < 3; k++) for (const sign of [-1, 1]) {
    const d: Point = [0,0,0]; d[k] = sign; dirs.push(d);
  }
  if (samples === 26) for (let k = 0; k < 3; k++) for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const d: Point = [a,b,0]; if (k === 1) d.splice(0,3,a,0,b); if (k === 2) d.splice(0,3,0,a,b); dirs.push(d);
  }
  const selected = new Map<string, Point>();
  for (const d of dirs) {
    let best = -Infinity, chosen = points[0];
    for (const p of points) {
      const score = p.reduce((sum, x, k) => sum + d[k]*(x-min[k])/size[k], 0);
      if (score > best + 1e-10) { best = score; chosen = p; }
    }
    selected.set(chosen.join(','), chosen);
  }
  const p = [...selected.values()];
  // Supporting planes form convex polygons. Triangulate each polygon once,
  // with one material over its entire surface (never a per-triangle colour).
  const facets = new Set<string>(), out: EnvelopeFace[] = [];
  const eps = Math.max(...size) * 1e-9;
  for (let a = 0; a < p.length; a++) for (let b = a+1; b < p.length; b++) for (let c = b+1; c < p.length; c++) {
    let n = normal([p[a],p[b],p[c]]);
    const len = Math.hypot(...n); if (len < eps*eps) continue;
    n = n.map(x => x/len) as Point;
    let distances = p.map(v => dot(n, sub(v,p[a])));
    if (distances.some(x => x > eps) && distances.some(x => x < -eps)) continue;
    if (distances.some(x => x > eps)) { n = n.map(x => -x) as Point; distances = distances.map(x => -x); }
    const ids = distances.flatMap((x,k) => Math.abs(x) < eps ? [k] : []);
    const key = ids.join(','); if (facets.has(key)) continue; facets.add(key);
    // Drop the most perpendicular axis for a stable planar convex hull.
    const axis = n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
    const xy = (id: number) => p[id].filter((_,k) => k !== axis);
    const ordered = ids.sort((i,j) => xy(i)[0]-xy(j)[0] || xy(i)[1]-xy(j)[1]);
    const turn = (i:number,j:number,k:number) => {
      const [a,b,c] = [xy(i),xy(j),xy(k)]; return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    };
    const half = (list: number[]) => {
      const h: number[] = [];
      for (const id of list) { while (h.length > 1 && turn(h[h.length-2],h[h.length-1],id) <= eps*eps) h.pop(); h.push(id); }
      return h;
    };
    const ring = [...half(ordered).slice(0,-1), ...half([...ordered].reverse()).slice(0,-1)].map(i => p[i]);
    if (ring.length < 3) continue;
    if (dot(normal(ring),n) < 0) ring.reverse();
    const material = n[1] > .55 ? roof : side;
    for (let k=1;k<ring.length-1;k++) out.push({points:[ring[0],ring[k],ring[k+1]],material,part:-1});
  }
  return out;
}
