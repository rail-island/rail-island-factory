// A car body lofted through vertical slices (sliceLoft.ts) with a fixed
// cross-section scheme: the bottom, a skirt or apron, the lower body curving
// out to the belly, the side leaning in from the belly to the shoulder with the
// livery's paint edges on it, and a quarter ellipse over the shoulder to the
// crown. Every quantity is a function of d, metres back from the car's +X end,
// so a nose (its plan, its dome, its apron) is the same body with other
// functions. Fittings are laid on the lofted surface: panels and decals on the
// side, discs and panes found on the slices. Used by the Shinkansen 0 series
// (shinkansen0.ts) and the TGV Duplex (tgvDuplex.ts).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { add, capSlice, cross, dot, mul, sub, unit as norm, type Pt } from "./sliceLoft.ts";

/** A car's body as functions of d, metres back from its +X end. */
export interface SliceBody {
  /** The body's length (a power or end car's from the nose tip). */
  length: number;
  /** Bottom of the skirt or apron, its half width there; the skirt's top and its half width there. */
  B: (d: number) => number;
  wl: (d: number) => number;
  A: (d: number) => number;
  wa: (d: number) => number;
  /** The belly (the widest line) and its half width; the shoulder, where the roof's arc starts; the crown. */
  Y: (d: number) => number;
  w: (d: number) => number;
  S: (d: number) => number;
  C: (d: number) => number;
  /** The paint edges on the side between the belly and the shoulder, bottom up; always as many. */
  edges: (d: number) => number[];
  /** The side leans in from the belly to the shoulder: z there is w * lean. */
  lean: number;
  /** Segments of the roof's quarter arc. */
  arc: number;
  /** Where the slices stand, ascending from 0 to the length. */
  stations: number[];
}

/** The side's z at height y between the belly and the shoulder of the slice at d. */
const sideZ = (b: SliceBody, d: number, y: number): number => {
  const [Y, S, w] = [b.Y(d), b.S(d), b.w(d)];
  return w * (1 - ((1 - b.lean) * (y - Y)) / Math.max(1e-6, S - Y));
};

/**
 * One half slice (z >= 0) from the bottom's centre to the crown: the bottom
 * (point 0), the skirt's foot (1) and top (2), the belly (3), the paint edges,
 * the shoulder and the arc. Edge k joins points k and k + 1.
 */
export function halfSlice(b: SliceBody, d: number): Pt[] {
  const [B, A, Y, S, C, w] = [b.B(d), b.A(d), b.Y(d), b.S(d), b.C(d), b.w(d)];
  const edges = b.edges(d).map((y) => Math.min(S, Math.max(Y, y)));
  const pts: Pt[] = [[0, B], [b.wl(d), B], [b.wa(d), A], [w, Y], ...edges.map((y): Pt => [sideZ(b, d, y), y]), [w * b.lean, S]];
  for (let i = 1; i <= b.arc; i++) {
    const t = (i / b.arc) * (Math.PI / 2);
    pts.push(i === b.arc ? [0, C] : [w * b.lean * Math.cos(t), S + (C - S) * Math.sin(t)]);
  }
  return pts;
}

/** What edge k of a slice is: the bottom, the skirt, the lower body, side segment `seg` (0 below the first paint edge) or the arc. */
export function edgeRole(b: SliceBody, k: number): { kind: "bottom" | "skirt" | "lower" | "side" | "arc"; seg?: number } {
  const n = b.edges(0).length;
  if (k === 0) return { kind: "bottom" };
  if (k === 1) return { kind: "skirt" };
  if (k === 2) return { kind: "lower" };
  if (k <= 3 + n) return { kind: "side", seg: k - 3 };
  return { kind: "arc" };
}

/**
 * Lofts the slices: quads wound outward, each painted by `mat` from the middle
 * of its station span and its edge (k as in halfSlice); and the end caps,
 * painted in `bands` (bottom to crown) of their slice, unless left out.
 */
export function drawShell(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: (d: number, k: number) => string, bands: (d: number) => Array<[number, number, string]>, caps: { front: boolean; rear: boolean }): void {
  const ds = b.stations;
  const halves = ds.map((d) => halfSlice(b, d));
  for (const s of [1, -1])
    for (let i = 0; i + 1 < ds.length; i++) {
      const [ha, hb] = [halves[i]!, halves[i + 1]!];
      const dm = (ds[i]! + ds[i + 1]!) / 2;
      const [xa, xb] = [X(ds[i]!), X(ds[i + 1]!)];
      const axis: Vec3 = [(xa + xb) / 2, (b.B(dm) + b.C(dm)) / 2, 0];
      for (let k = 0; k + 1 < ha.length; k++) {
        const P = (h: Pt[], x: number, j: number): Vec3 => [x, h[j]![1], s * h[j]![0]];
        const a = P(ha, xa, k), q = P(ha, xa, k + 1), cc = P(hb, xb, k + 1), dd = P(hb, xb, k);
        const centre = mul(add(add(a, q), add(cc, dd)), 0.25);
        let n = cross(sub(cc, a), sub(dd, q));
        if (Math.hypot(...n) < 1e-12) continue;
        if (dot(n, sub(centre, axis)) < 0) n = mul(n, -1);
        m.facets(mat(dm, k), [a, q, cc, a, cc, dd], n);
      }
    }
  m.scope("end caps", () => {
    if (caps.front) capSlice(m, halves[0]!, X(ds[0]!), Math.sign(X(ds[0]!) - X(ds[ds.length - 1]!)), bands(ds[0]!));
    if (caps.rear) capSlice(m, halves[ds.length - 1]!, X(ds[ds.length - 1]!), Math.sign(X(ds[ds.length - 1]!) - X(ds[0]!)), bands(ds[ds.length - 1]!));
  });
}

/** The side at height y (belly <= y <= shoulder) of the slice at d on side s: its z and outward normal. */
export function sideAt(b: SliceBody, d: number, y: number, s: number): { z: number; n: Vec3 } {
  const [Y, S, w] = [b.Y(d), b.S(d), b.w(d)];
  const lean = (w * (1 - b.lean)) / (S - Y);
  return { z: s * sideZ(b, d, y), n: norm([0, lean, s]) };
}

/** A panel on the side over d0..d1 and y0..y1: its face `proud` off the skin, `depth` deep. */
export function sidePanel(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, proud: number, depth: number): void {
  const dm = (d0 + d1) / 2;
  const pt = (d: number, y: number): Vec3 => {
    const q = sideAt(b, dm, y, s);
    return add([X(d), y, q.z], mul(q.n, proud));
  };
  const n = sideAt(b, dm, (y0 + y1) / 2, s).n;
  m.slab(mat, [pt(d0, y0), pt(d1, y0), pt(d1, y1), pt(d0, y1)], mul(n, -depth));
}

/** Flat decal triangles in (d, y) on the side, `proud` off it (each point on its own slice, so it follows a nose's plan). */
export function sideDecal(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, tris: Pt[], proud = 0.004): void {
  const pts = tris.map(([d, y]): Vec3 => {
    const q = sideAt(b, d, y, s);
    return add([X(d), y, q.z], mul(q.n, proud));
  });
  m.facets(mat, pts, [0, 0, s]);
}

/** Lettering on the side, centred at d, its foot at y, h tall, reading left to right from outside. */
export function sideLettering(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, text: string, d: number, y: number, h: number, mat: string, proud = 0.004): void {
  const w = h * 0.58, gap = h * 0.18;
  const width = strokeWidth(text, w, gap);
  // seen from outside the +Z side reads toward +X (against d when the car faces +X), the -Z side the other way
  const dir = Math.sign(X(0) - X(1));
  const tris = strokeText(text, -width / 2, y, h, w, gap, false, h * 0.13).map(([u, v]): Pt => [d - dir * s * u, v]);
  sideDecal(m, b, X, s, mat, tris, proud);
}

/** The point of the slice at d at height y on its outer side (the lower body, the side or the arc), with the surface's outward normal, on side s. */
export function surfacePoint(b: SliceBody, d: number, y: number, s: number): { p: Pt; n: Vec3 } {
  const zAt = (dd: number, yy: number): number => {
    const h = halfSlice(b, dd);
    for (let k = 2; k + 1 < h.length; k++) {
      const [za, ya] = h[k]!;
      const [zb, yb] = h[k + 1]!;
      if ((yy - ya) * (yy - yb) <= 0 && Math.abs(yb - ya) > 1e-9) return za + ((yy - ya) / (yb - ya)) * (zb - za);
    }
    return h[3]![0];
  };
  const z = zAt(d, y);
  // tangents along the car (d grows toward -X when it faces +X; the caller's X decides) and up the slice
  const tD: Vec3 = [-0.04, 0, zAt(d + 0.02, y) - zAt(d - 0.02, y)];
  const tY: Vec3 = [0, 0.02, zAt(d, y + 0.01) - zAt(d, y - 0.01)];
  let n = norm(cross(tD, tY));
  if (n[2] < 0) n = mul(n, -1);
  return { p: [z, y], n: [n[0], n[1], s * n[2]] };
}

/** A disc tangent to the body at (d, y) on side s: radius r, `proud` off it, `depth` into it. `e` is +1 when d grows toward -X. */
export function surfaceDisc(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d: number, y: number, s: number, mat: string, r: number, proud: number, depth: number, sides = 18): void {
  const q = surfacePoint(b, d, y, s);
  const e = Math.sign(X(0) - X(1));
  const n: Vec3 = [e * q.n[0], q.n[1], q.n[2]];
  const base: Vec3 = [X(d), y, s * q.p[0]];
  const u = norm(cross([0, 1, 0], n));
  const v = norm(cross(n, u));
  const pts = Array.from({ length: sides }, (_, i): Vec3 => {
    const a = (2 * Math.PI * i) / sides;
    return add(add(base, mul(n, proud)), add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a))));
  });
  m.slab(mat, pts, mul(n, -depth));
}

/** The point of the slice at d whose half width is z on its upper side (the shoulder and the arc), z clamped to the slice. */
export function crownPoint(b: SliceBody, d: number, z: number): Pt {
  const h = halfSlice(b, d);
  const k0 = 4 + b.edges(d).length;
  for (let k = k0; k + 1 < h.length; k++) {
    const [za, ya] = h[k]!;
    const [zb, yb] = h[k + 1]!;
    if (z <= za + 1e-9 && z >= zb - 1e-9) return [z, za - zb < 1e-9 ? ya : ya + ((za - z) / (za - zb)) * (yb - ya)];
  }
  return z > h[k0]![0] ? h[k0]! : [0, b.C(d)];
}

/**
 * A pane laid on the body's upper surface over d0..d1 and half widths z0..z1
 * on side s -- a windscreen, a cab's side window: a grid of facets following
 * the lofted surface, `proud` off it.
 */
export function crownPane(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, [d0, d1]: [number, number], [z0, z1]: [number, number], proud: number, nd = 6, nz = 4): void {
  const P = (i: number, j: number): Vec3 => {
    const d = d0 + ((d1 - d0) * i) / nd;
    const [z, y] = crownPoint(b, d, z0 + ((z1 - z0) * j) / nz);
    return [X(d), y, s * z];
  };
  const grid = Array.from({ length: nd + 1 }, (_, i) => Array.from({ length: nz + 1 }, (_, j) => P(i, j)));
  const normalAt = (i: number, j: number): Vec3 => {
    const a = grid[Math.min(nd, i + 1)]![j]!, c = grid[Math.max(0, i - 1)]![j]!;
    const e = grid[i]![Math.min(nz, j + 1)]!, f = grid[i]![Math.max(0, j - 1)]!;
    let n = norm(cross(sub(a, c), sub(e, f)));
    if (n[1] < 0) n = mul(n, -1);
    return n;
  };
  const out = grid.map((row, i) => row.map((q, j) => add(q, mul(normalAt(i, j), proud))));
  for (let i = 0; i < nd; i++)
    for (let j = 0; j < nz; j++) {
      const [a, q, c, e] = [out[i]![j]!, out[i + 1]![j]!, out[i + 1]![j + 1]!, out[i]![j + 1]!];
      m.facets(mat, [a, q, c, a, c, e], normalAt(i, j));
    }
}

/** A plan that rounds from a point at d = 0 to the full half width `w` at d = len (an ellipse), at least `min`. */
export const ellipsePlan = (w: number, len: number, min = 0.03) => (d: number): number =>
  Math.max(min, w * Math.sqrt(Math.max(0, 1 - (1 - Math.min(d, len) / len) ** 2)));

/**
 * A pane laid on the body's outer surface over d0..d1 and heights y0..y1 on
 * side s -- a lamp band around a nose: a grid of facets on the slices, `proud`
 * off them.
 */
export function sidePane(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, [d0, d1]: [number, number], [y0, y1]: [number, number], proud: number, nd = 6, ny = 2): void {
  const e = Math.sign(X(0) - X(1));
  const out: Vec3[][] = [];
  const normals: Vec3[][] = [];
  for (let i = 0; i <= nd; i++) {
    const row: Vec3[] = [];
    const nrow: Vec3[] = [];
    for (let j = 0; j <= ny; j++) {
      const d = d0 + ((d1 - d0) * i) / nd;
      const y = y0 + ((y1 - y0) * j) / ny;
      const q = surfacePoint(b, d, y, s);
      const n: Vec3 = [e * q.n[0], q.n[1], q.n[2]];
      row.push(add([X(d), y, s * q.p[0]], mul(n, proud)));
      nrow.push(n);
    }
    out.push(row);
    normals.push(nrow);
  }
  for (let i = 0; i < nd; i++)
    for (let j = 0; j < ny; j++) {
      const [a, q, c, f] = [out[i]![j]!, out[i + 1]![j]!, out[i + 1]![j + 1]!, out[i]![j + 1]!];
      m.facets(mat, [a, q, c, a, c, f], normals[i]![j]!);
    }
}
