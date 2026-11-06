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
import { add, capSlice, cross, dot, loftQuad, mul, sub, unit as norm, type Pt } from "./sliceLoft.ts";
import { CABIN_INSET, drawCabin } from "./interior.ts";

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

/** A doorway through side `s` (+1 the +z side) over d0..d1 and y0..y1: the shell is left open there. */
export interface SliceDoorway {
  s: number;
  d0: number;
  d1: number;
  y0: number;
  y1: number;
}

/**
 * Lofts the slices: quads wound outward, each painted by `mat` from the middle
 * of its station span and its edge (k as in halfSlice); and the end caps,
 * painted in `bands` (bottom to crown) of their slice. Both ends are always
 * closed: a nose's tip too, however narrow (a blunt tip left open is a hole
 * through the front). Over a
 * doorway (its ends are stations too) a side's quads leave out what lies
 * between its sill and head.
 */
export function drawShell(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: (d: number, k: number) => string, bands: (d: number) => Array<[number, number, string]>, doorways: readonly SliceDoorway[] = []): void {
  const ds = doorways.length ? [...new Set([...b.stations, ...doorways.flatMap((o) => [o.d0, o.d1])])].sort((p, q) => p - q) : b.stations;
  // a doorway's ends cut the shell without reshaping it: between two stations they lie on the straight line the shell draws there
  const halves = ds.map((d) => (b.stations.includes(d) ? halfSlice(b, d) : between(b, d)));
  for (const s of [1, -1])
    for (let i = 0; i + 1 < ds.length; i++) {
      const [ha, hb] = [halves[i]!, halves[i + 1]!];
      const dm = (ds[i]! + ds[i + 1]!) / 2;
      const [xa, xb] = [X(ds[i]!), X(ds[i + 1]!)];
      const axis: Vec3 = [(xa + xb) / 2, (b.B(dm) + b.C(dm)) / 2, 0];
      const door = doorways.find((o) => o.s === s && o.d0 <= ds[i]! + 1e-9 && ds[i + 1]! <= o.d1 + 1e-9);
      for (let k = 0; k + 1 < ha.length; k++) {
        const P = (h: Pt[], x: number, j: number): Vec3 => [x, h[j]![1], s * h[j]![0]];
        const a = P(ha, xa, k), q = P(ha, xa, k + 1), cc = P(hb, xb, k + 1), dd = P(hb, xb, k);
        const centre = mul(add(add(a, q), add(cc, dd)), 0.25);
        let n = cross(sub(cc, a), sub(dd, q));
        if (Math.hypot(...n) < 1e-12) continue;
        if (dot(n, sub(centre, axis)) < 0) n = mul(n, -1);
        loftQuad(m, mat(dm, k), [a, q, cc, dd], n, door ? [door.y0, door.y1] : null);
      }
    }
  m.scope("end caps", () => {
    capSlice(m, halves[0]!, X(ds[0]!), Math.sign(X(ds[0]!) - X(ds[ds.length - 1]!)), bands(ds[0]!));
    capSlice(m, halves[ds.length - 1]!, X(ds[ds.length - 1]!), Math.sign(X(ds[ds.length - 1]!) - X(ds[0]!)), bands(ds[ds.length - 1]!));
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

/** The shell's slice at d between two stations: the straight line between theirs, point by point (on a station, its own). */
function between(b: SliceBody, d: number): Pt[] {
  const st = b.stations;
  let i = 0;
  while (i + 2 < st.length && st[i + 1]! < d) i++;
  const [a, c] = [st[i]!, st[i + 1] ?? st[i]!];
  const t = c - a < 1e-9 ? 0 : Math.min(1, Math.max(0, (d - a) / (c - a)));
  const [ha, hc] = [halfSlice(b, a), halfSlice(b, c)];
  return ha.map((p, k): Pt => [p[0] + (hc[k]![0] - p[0]) * t, p[1] + (hc[k]![1] - p[1]) * t]);
}

/**
 * A pane laid on the body's upper surface over d0..d1 and half widths z0..z1
 * on side s -- a windscreen, a cab's side window: `proud` off the lofted shell
 * and following it facet for facet. Its rows stand on the shell's own stations
 * (d0 and d1 between two of them on the straight line the shell draws there),
 * its columns on the slices' own points over the shoulder and the arc, each
 * row cut to z0..z1, and every cell is split along the shell's own diagonal, so
 * no chord of the pane dips into the body however coarse or curved the nose.
 * Over a slice narrower than z1 the pane ends at the shoulder. `nd` and `nz`
 * are kept for the callers; the shell sets the pane's resolution.
 */
export function crownPane(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, [d0, d1]: [number, number], [z0, z1]: [number, number], proud: number, _nd = 6, _nz = 4): void {
  if (d1 - d0 < 1e-6 || z1 - z0 < 1e-6) return;
  const st = b.stations;
  const ds = [d0, ...st.filter((d) => d > d0 + 1e-6 && d < d1 - 1e-6), d1];
  const rows = ds.map((d) => between(b, d));
  const k0 = 4 + b.edges(d0).length;
  const n = rows[0]!.length;
  // the slice's point at parameter u (k0 the shoulder, n - 1 the crown) and the u where its half width is z
  const at = (h: Pt[], u: number): Pt => {
    const k = Math.min(n - 2, Math.floor(u));
    const t = u - k;
    return [h[k]![0] + (h[k + 1]![0] - h[k]![0]) * t, h[k]![1] + (h[k + 1]![1] - h[k]![1]) * t];
  };
  const uOf = (h: Pt[], z: number): number => {
    if (z >= h[k0]![0]) return k0;
    for (let k = k0; k + 1 < n; k++) {
      const [za, zb] = [h[k]![0], h[k + 1]![0]];
      if (z <= za + 1e-12 && z >= zb - 1e-12) return za - zb < 1e-12 ? k : k + (za - z) / (za - zb);
    }
    return n - 1;
  };
  const lo = rows.map((h) => uOf(h, z1)), hi = rows.map((h) => uOf(h, z0));
  // the columns: every slice point between the pane's widest reach, each row clamped to its own cut
  const cols = [...new Set([Math.min(...lo), ...Array.from({ length: n - k0 }, (_, i) => k0 + i), Math.max(...hi)])]
    .filter((u) => u >= Math.min(...lo) - 1e-9 && u <= Math.max(...hi) + 1e-9).sort((p, q) => p - q);
  const P = (r: number, u: number): Vec3 => {
    const [z, y] = at(rows[r]!, Math.min(hi[r]!, Math.max(lo[r]!, u)));
    return [X(ds[r]!), y, s * z];
  };
  const raw = (r: number, u: number): Vec3 => {
    const [z, y] = at(rows[r]!, u);
    return [X(ds[r]!), y, s * z];
  };
  // outward: away from the body's axis line at the slice's mid height
  const out = (v: Vec3, p: Vec3, r: number): Vec3 => {
    const axis: Vec3 = [p[0], (rows[r]![0]![1] + rows[r]![n - 1]![1]) / 2, 0];
    return dot(v, sub(p, axis)) < 0 ? mul(v, -1) : v;
  };
  const normalAt = (r: number, u: number): Vec3 => {
    const e = 0.02;
    const tu = sub(raw(r, Math.min(n - 1, u + e)), raw(r, Math.max(k0, u - e)));
    const td = sub(raw(Math.min(rows.length - 1, r + 1), u), raw(Math.max(0, r - 1), u));
    let v = cross(td, tu);
    if (Math.hypot(...v) < 1e-12) v = [0, 1, 0];
    return out(norm(v), raw(r, u), r);
  };
  const Q = (r: number, u: number): Vec3 => {
    const cu = Math.min(hi[r]!, Math.max(lo[r]!, u));
    return add(P(r, u), mul(normalAt(r, cu), proud));
  };
  for (let r = 0; r + 1 < rows.length; r++)
    for (let j = 0; j + 1 < cols.length; j++) {
      const [ua, ub] = [cols[j]!, cols[j + 1]!];
      // the shell's quad (r, ua) (r, ub) (r + 1, ub) (r + 1, ua), split along its own diagonal
      const a = Q(r, ua), q = Q(r, ub), c = Q(r + 1, ub), e = Q(r + 1, ua);
      for (const tri of [[a, q, c], [a, c, e]] as Vec3[][]) {
        const fn = cross(sub(tri[1]!, tri[0]!), sub(tri[2]!, tri[0]!));
        if (Math.hypot(...fn) < 1e-10) continue;
        const centre = mul(add(add(tri[0]!, tri[1]!), tri[2]!), 1 / 3);
        m.facets(mat, tri, out(norm(fn), centre, r));
      }
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

/** The half width (z >= 0) of the slice at d at height y: where the line at y crosses its outline, or 0 off it. */
export function sliceHalf(b: SliceBody, d: number, y: number): number {
  const h = halfSlice(b, d);
  let best = 0;
  for (let i = 0; i + 1 < h.length; i++) {
    const [[za, ya], [zb, yb]] = [h[i]!, h[i + 1]!];
    if (y < Math.min(ya, yb) - 1e-9 || y > Math.max(ya, yb) + 1e-9) continue;
    best = Math.max(best, Math.abs(yb - ya) < 1e-12 ? Math.max(za, zb) : za + ((zb - za) * (y - ya)) / (yb - ya));
  }
  return best;
}

/**
 * The cabin of a slice body's car from d0 to d1 behind its `doors` (their leaf
 * boxes, interior.ts): a floor at the lowest sill, a ceiling above the highest
 * head, the side walls CABIN_INSET inside the narrowest side between them where the
 * car keeps 90 % of its full width, its `windows` (glass boxes, d and y) on them,
 * a seat row only where the side holds it.
 */
export function sliceCabin(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d0: number, d1: number, doors: readonly SliceDoorway[], windows: readonly SliceDoorway[] = []): void {
  const floor = Math.min(...doors.map((o) => o.y0)) + 0.003;
  const [a, c] = [d0 + CABIN_INSET, d1 - CABIN_INSET];
  const ds = [a, c, ...b.stations.filter((d) => d > a && d < c)];
  const ceiling = Math.min(Math.max(...doors.map((o) => o.y1)) + 0.12, ...ds.map((d) => b.C(d) - 0.08));
  const wide = Math.max(...ds.map((d) => b.w(d)));
  const narrowest = (d: number) => Math.min(...[floor, ceiling, ...halfSlice(b, d).map((p) => p[1]).filter((y) => y > floor && y < ceiling)].map((y) => sliceHalf(b, d, y)));
  const half = Math.min(...ds.filter((d) => b.w(d) >= 0.9 * wide).map(narrowest)) - CABIN_INSET;
  // model x back to d (X is a shift, perhaps turned)
  const [x0, k] = [X(0), X(1) - X(0)];
  const dOf = (x: number) => (x - x0) / k;
  const span = (p: number, q: number): [number, number] => (p < q ? [p, q] : [q, p]);
  const [cx0, cx1] = span(X(a), X(c));
  drawCabin(m, {
    x0: cx0,
    x1: cx1,
    floor,
    ceiling,
    half,
    doors: doors.map((o) => {
      const [x0d, x1d] = span(X(o.d0), X(o.d1));
      const dm = (o.d0 + o.d1) / 2;
      return { s: o.s, x0: x0d, x1: x1d, y0: o.y0 + 0.003, y1: o.y1 - 0.003, skin: (y: number) => sliceHalf(b, dm, y) };
    }),
    windows: windows.map((w) => {
      const [x0w, x1w] = span(X(w.d0), X(w.d1));
      return { s: w.s, x0: x0w, x1: x1w, y0: w.y0, y1: w.y1 };
    }),
    // the body: the slice at x, 0 past its ends
    shell: (x, y) => {
      const d = dOf(x);
      return d < 0 || d > b.length ? 0 : sliceHalf(b, d, y);
    },
    room: (xa, xb) => {
      const at = [xa, (xa + xb) / 2, xb].map(dOf);
      if (!at.every((d) => narrowest(d) >= half - 0.01)) return null;
      return { base: Math.max(floor, ...at.map((d) => b.B(d) + 0.01)), top: Math.min(...at.map((d) => b.C(d))) };
    },
  });
}
