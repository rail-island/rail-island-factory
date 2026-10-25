// Bodies lofted through vertical slices along a car: each slice a half
// cross-section (z >= 0, mirrored for the other side) from the bottom's centre
// to the crown, whose vertices carry the paint edges, so a curved nose keeps its
// paint lines exact. Used by the DR VT 18.16 (drVt1816.ts), the Shinkansen 0
// series (shinkansen0.ts) and the TGV Duplex (tgvDuplex.ts).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";

export type Pt = [number, number];

/** A table's value at x: linear between its rows, clamped at both ends. */
export const lerp = (t: readonly Pt[], x: number): number => {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    const [xa, ya] = t[i - 1]!;
    const [xb, yb] = t[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return t[t.length - 1]![1];
};

/** A convex polygon (z, y) cut to y0 <= y <= y1. */
export function clipY(poly: Pt[], y0: number, y1: number): Pt[] {
  const cut = (ring: Pt[], h: number, above: boolean): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[1] >= h - 1e-9 : a[1] <= h + 1e-9;
      const inB = above ? b[1] >= h - 1e-9 : b[1] <= h + 1e-9;
      if (inA) out.push(a);
      if (inA !== inB) {
        const t = (h - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), h]);
      }
    }
    return out;
  };
  return cut(cut(poly, y0, true), y1, false);
}

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a: Vec3): Vec3 => mul(a, 1 / Math.max(1e-12, Math.hypot(...a)));

/**
 * Lofts half slices (z >= 0, mirrored for the other side) between stations at
 * model x `xs`: quads wound outward from the axis at height `axisY`. Where
 * `hole(s, seg)` names a doorway's sill and head for side s over segment seg,
 * the side's quads leave out what lies between them (`loftQuad`).
 */
export function loftHalves(m: MeshBuilder, xs: number[], halves: Pt[][], mat: (seg: number, edge: number) => string, axisY: (seg: number) => number, hole: (s: number, seg: number) => [number, number] | null = () => null): void {
  for (const s of [1, -1])
    for (let i = 0; i + 1 < xs.length; i++) {
      const [ha, hb] = [halves[i]!, halves[i + 1]!];
      const yc = axisY(i);
      const xm = (xs[i]! + xs[i + 1]!) / 2;
      const cut = hole(s, i);
      for (let k = 0; k + 1 < ha.length; k++) {
        const P = (h: Pt[], x: number, j: number): Vec3 => [x, h[j]![1], s * h[j]![0]];
        const a = P(ha, xs[i]!, k), b = P(ha, xs[i]!, k + 1), cc = P(hb, xs[i + 1]!, k + 1), d = P(hb, xs[i + 1]!, k);
        const centre = mul(add(add(a, b), add(cc, d)), 0.25);
        let n = cross(sub(cc, a), sub(d, b));
        if (Math.hypot(...n) < 1e-12) continue;
        if (dot(n, sub(centre, [xm, yc, 0])) < 0) n = mul(n, -1);
        loftQuad(m, mat(i, k), [a, b, cc, d], n, cut);
      }
    }
}

/**
 * One quad of a loft, a..b at the near station and d..c at the far one (its
 * upright edges), facing `n`; with `hole` (a doorway's sill and head) only its
 * pieces below the sill and above the head, cut along the upright edges. A piece
 * that comes to a point at one end draws as one triangle: tri() drops the other.
 */
export function loftQuad(m: MeshBuilder, mat: string, [a, b, c, d]: [Vec3, Vec3, Vec3, Vec3], n: Vec3, hole: [number, number] | null): void {
  if (!hole) {
    m.facets(mat, [a, b, c, a, c, d], n);
    return;
  }
  for (const [lo, hi] of [[-Infinity, hole[0]], [hole[1], Infinity]] as const) {
    // the part of edge p..r within lo..hi, a single point where none is (a level
    // edge is all in or all out)
    const part = (p: Vec3, r: Vec3): [Vec3, Vec3] => {
      if (Math.abs(r[1] - p[1]) < 1e-12) return p[1] >= lo && p[1] <= hi ? [p, r] : [p, p];
      const t = (y: number) => Math.min(1, Math.max(0, (Math.min(hi, Math.max(lo, y)) - p[1]) / (r[1] - p[1])));
      return [add(p, mul(sub(r, p), t(p[1]))), add(p, mul(sub(r, p), t(r[1])))];
    };
    const [near, far] = [part(a, b), part(d, c)];
    // nothing of the quad on this side of the doorway
    const point = (e: [Vec3, Vec3]) => Math.hypot(...sub(e[1], e[0])) < 1e-9;
    if (point(near) && point(far)) continue;
    m.facets(mat, [near[0], near[1], far[1], near[0], far[1], far[0]], n);
  }
}

/** A slice's end cap at model x, facing `dir` along x, painted in `bands`. */
export function capSlice(m: MeshBuilder, half: Pt[], x: number, dir: number, bands: Array<[number, number, string]>): void {
  const ring: Pt[] = [...half, ...half.slice(1, -1).reverse().map(([z, y]): Pt => [-z, y])];
  for (const [y0, y1, mat] of bands) {
    const poly = clipY(ring, y0, y1);
    if (poly.length < 3) continue;
    const tris: Vec3[] = [];
    for (let i = 1; i + 1 < poly.length; i++) tris.push(...[poly[0]!, poly[i]!, poly[i + 1]!].map(([z, y]): Vec3 => [x, y, z]));
    m.facets(mat, tris, [dir, 0, 0]);
  }
}
