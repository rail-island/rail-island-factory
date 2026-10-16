// A railcar's cab nose as one painted surface (docs/models/czech-dmus.md): the
// front, its rounded corners and the cab sides back to the body, lofted through
// horizontal slices and painted by regions instead of by horizontal bands, so a
// face can carry a rounded windscreen, a lamp mask, a livery sweep over the
// corner and the cab side window as exact paint boundaries on a curved skin.
//
// The surface is a grid over (u, y). y is the height; every slice is a rounded
// rectangle seen from above: its centreline face `d` (the distance back from the
// tip plane, `profile`), its half width (`half`, the body's section) and the
// corner radius. u runs across the slice, viewer's left to right as seen from
// ahead of the end: |u| <= 1 the face (optionally bulged), 1..2 the corner arc,
// 2..3 a straight run back to `dSide`, 3..4 the cab side back to `dJoin`, where
// the slice is the body's own section and the body volume takes over.
//
// Paint is a list of layers over a base material, later layers on top. A layer
// is a predicate on a surface point, which must hold on at most one y-interval
// at each u; the grid's columns are refined until each layer's boundary is
// straight within a tolerance, and each grid cell is cut along the boundaries,
// so the boundaries are exact up to that tolerance. Points inside a cell are
// mapped bilinearly from the cell's corners, so cells meet without cracks.
// No `node:` imports.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";

export type Pt = [number, number];

/** A surface point as a layer predicate sees it. */
export interface NoseQuery {
  u: number;
  y: number;
  /** Distance back from the tip plane. */
  d: number;
  /** Signed lateral position, viewer's right positive, seen from ahead of the end. */
  lat: number;
  /** Half width of the body at this height. */
  hw: number;
  /** On the flat cab side (|u| >= 2). */
  side: boolean;
}

export interface NoseLayer {
  mat: string;
  /** The scope its pieces are drawn in (the material's name when omitted). */
  name?: string;
  inside: (q: NoseQuery) => boolean;
}

export interface NoseSpec {
  /** +1 the +X end, -1 the -X end. */
  e: number;
  /** Model x of the +X end's tip plane (mirrored for e = -1). */
  xTip: number;
  /** Where the slices meet the body volume, back from the tip. */
  dJoin: number;
  /** Where the cab side starts at the latest (the straight run's end), back from the tip. */
  dSide: number;
  /** The centreline face: [y, d], ascending y, from the bottom row to the crown. */
  profile: Pt[];
  /** The body's half width: [y, hw], ascending y; the last point is the crown. */
  half: Pt[];
  /** The plan's corner radius: [y, r], ascending y. */
  corner: Pt[];
  /** Extra recess of the face at its edges (|u| = 1) over its centre: a parabolic plan bulge. */
  bulge?: number;
  /** The grid's rows, ascending; the first is the bottom, the last the crown. */
  rows: number[];
  base: string;
  layers: NoseLayer[];
  /** Base columns per half: face, corner arc, straight run, side. */
  cols?: [number, number, number, number];
  /** How far (m) a layer boundary may depart from a straight line within a column. */
  tolerance?: number;
  /** The material of the crown cap and the bottom cap. */
  capTop?: string;
  capBottom?: string;
}

const lerp = (pts: Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, va] = pts[i - 1]!;
    const [yb, vb] = pts[i]!;
    if (y <= yb + 1e-12) return yb - ya < 1e-12 ? vb : va + ((y - ya) / (yb - ya)) * (vb - va);
  }
  return pts[pts.length - 1]![1];
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l < 1e-12 ? [0, 0, 0] : mul(a, 1 / l);
};

interface Interval {
  id: number;
  y0: number;
  y1: number;
}

export class CabNose {
  readonly yBot: number;
  readonly yTop: number;
  private readonly memo = new Map<string, [number, number] | null>();
  /** The pieces drawn so far, by scope name: material, triangles, normal. */
  private readonly out = new Map<string, Array<[string, Vec3[], Vec3]>>();

  constructor(readonly m: MeshBuilder, readonly s: NoseSpec) {
    this.yBot = s.rows[0]!;
    this.yTop = s.rows[s.rows.length - 1]!;
  }

  /** The surface at (u, y): the query a layer sees and the model point. */
  at(u: number, y: number): NoseQuery & { p: Vec3 } {
    const s = this.s;
    const hw = lerp(s.half, y);
    const r = Math.min(lerp(s.corner, y), hw * 0.98);
    const a = hw - r;
    const dF = lerp(s.profile, y);
    const b = s.bulge ?? 0;
    const au = Math.min(4, Math.abs(u));
    const sg = u < 0 ? -1 : 1;
    let lat: number;
    let d: number;
    if (au <= 1) {
      lat = au * a;
      d = dF + b * au * au;
    } else if (au <= 2) {
      const th = ((au - 1) * Math.PI) / 2;
      lat = a + r * Math.sin(th);
      d = dF + b + r * (1 - Math.cos(th));
    } else {
      lat = hw;
      const dA = dF + b + r;
      const dS = Math.min(Math.max(dA, s.dSide), s.dJoin);
      d = au <= 3 ? dA + (au - 2) * (dS - dA) : dS + (au - 3) * (s.dJoin - dS);
    }
    d = Math.min(d, s.dJoin);
    const e = s.e;
    return { u, y, d, lat: sg * lat, hw, side: au >= 2, p: [e * (s.xTip - d), y, -e * sg * lat] };
  }

  /** The outward normal at (u, y). */
  normal(u: number, y: number): Vec3 {
    const h = 1e-3;
    const du = sub(this.at(Math.min(4, u + h), y).p, this.at(Math.max(-4, u - h), y).p);
    const dy = sub(this.at(u, Math.min(this.yTop, y + h)).p, this.at(u, Math.max(this.yBot, y - h)).p);
    return this.outward(cross(du, dy), this.at(u, y).p);
  }

  /** u of a lateral position on the face or its corner arc at height y. */
  uAt(lat: number, y: number): number {
    const s = this.s;
    const hw = lerp(s.half, y);
    const r = Math.min(lerp(s.corner, y), hw * 0.98);
    const a = hw - r;
    const al = Math.abs(lat);
    const sg = lat < 0 ? -1 : 1;
    if (al <= a) return (sg * al) / Math.max(a, 1e-9);
    const th = Math.asin(Math.min(1, (al - a) / r));
    return sg * (1 + th / (Math.PI / 2));
  }

  private outward(n: Vec3, p: Vec3): Vec3 {
    const s = this.s;
    const inner: Vec3 = [s.e * (s.xTip - s.dJoin - 1.5), (this.yBot + this.yTop) / 2, 0];
    const k = dot(n, sub(p, inner)) < 0 ? -1 : 1;
    return unit(mul(n, k));
  }

  /** The y-interval where a layer holds at u, or null. */
  private interval(li: number, u: number): [number, number] | null {
    const key = `${li}:${u.toFixed(7)}`;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;
    const L = this.s.layers[li]!;
    const test = (y: number) => L.inside(this.at(u, y));
    const n = Math.max(80, Math.ceil((this.yTop - this.yBot) / 0.006));
    let first = -1;
    let last = -1;
    for (let i = 0; i <= n; i++) {
      const y = this.yBot + ((this.yTop - this.yBot) * i) / n;
      if (test(y)) {
        if (first < 0) first = i;
        last = i;
      }
    }
    let out: [number, number] | null = null;
    if (first >= 0) {
      const step = (this.yTop - this.yBot) / n;
      const edge = (inY: number, outY: number): number => {
        for (let k = 0; k < 14; k++) {
          const mid = (inY + outY) / 2;
          if (test(mid)) inY = mid;
          else outY = mid;
        }
        return (inY + outY) / 2;
      };
      const y0 = this.yBot + first * step;
      const y1 = this.yBot + last * step;
      out = [first > 0 ? edge(y0, y0 - step) : y0, last < n ? edge(y1, y1 + step) : y1];
    }
    this.memo.set(key, out);
    return out;
  }

  /** The base columns, refined where a layer boundary bends or a layer starts or ends. */
  private columns(): { base: number[]; all: number[] } {
    const [cf, cc, cs, cd] = this.s.cols ?? [8, 4, 1, 2];
    const half: number[] = [];
    for (let i = 0; i <= cf; i++) half.push(i / cf);
    for (let i = 1; i <= cc; i++) half.push(1 + i / cc);
    for (let i = 1; i <= cs; i++) half.push(2 + i / cs);
    for (let i = 1; i <= cd; i++) half.push(3 + i / cd);
    const base = [...half.slice(1).map((u) => -u).reverse(), ...half];
    const tol = this.s.tolerance ?? 0.012;
    const out = new Set(base.map((u) => +u.toFixed(7)));
    const refine = (li: number, ua: number, ub: number, depth: number): void => {
      if (depth > 8 || ub - ua < 0.008) return;
      const um = (ua + ub) / 2;
      const [a, b, c] = [this.interval(li, ua), this.interval(li, ub), this.interval(li, um)];
      let split = false;
      if (!a !== !b || !a !== !c) split = true;
      else if (a && b && c)
        split = Math.abs(c[0] - (a[0] + b[0]) / 2) > tol || Math.abs(c[1] - (a[1] + b[1]) / 2) > tol;
      if (!split) return;
      out.add(+um.toFixed(7));
      refine(li, ua, um, depth + 1);
      refine(li, um, ub, depth + 1);
    };
    for (let li = 0; li < this.s.layers.length; li++)
      for (let i = 0; i + 1 < base.length; i++) refine(li, base[i]!, base[i + 1]!, 0);
    return { base, all: [...out].sort((p, q) => p - q) };
  }

  /** The painted intervals at u: the base, then each active layer laid over it. */
  private paint(u: number, active: number[], mid: Map<number, [number, number]>): Interval[] {
    let iv: Interval[] = [{ id: -1, y0: this.yBot, y1: this.yTop }];
    for (const li of active) {
      const got = this.interval(li, u);
      const m = mid.get(li)!;
      let [lo, hi] = got ?? [(m[0] + m[1]) / 2, (m[0] + m[1]) / 2];
      if (hi < lo) hi = lo;
      // what lies below the layer, the layer, what lies above it; zero-length
      // intervals outside the layer survive, so both edges of a column match
      const below = iv.filter((I) => I.y0 < lo).map((I) => ({ ...I, y1: Math.min(I.y1, lo) }));
      const above = iv.filter((I) => I.y1 > hi).map((I) => ({ ...I, y0: Math.max(I.y0, hi) }));
      iv = [...below, { id: li, y0: lo, y1: hi }, ...above];
    }
    return iv;
  }

  private mat(id: number): string {
    return id < 0 ? this.s.base : this.s.layers[id]!.mat;
  }

  private scopeName(id: number): string {
    return id < 0 ? this.s.base : (this.s.layers[id]!.name ?? this.s.layers[id]!.mat);
  }

  /** Draws the nose: the painted surface and the crown and bottom caps. */
  draw(): void {
    const { base, all } = this.columns();
    const rows = this.s.rows;
    const P = (u: number, y: number) => this.at(u, y).p;
    for (let c = 0; c + 1 < base.length; c++) {
      const ua = base[c]!;
      const ub = base[c + 1]!;
      // the base cell's corners, row by row: everything inside is mapped bilinearly
      // onto them, so the refined columns add no cracks between rows
      const corners = rows.map((y) => [P(ua, y), P(ub, y)] as const);
      const cuts = [ua, ...all.filter((u) => u > ua + 1e-6 && u < ub - 1e-6), ub];
      // per row, the sub-columns' pieces; a cell painted all one colour is kept whole
      const perRow: Array<Array<{ sa: number; sb: number; uniform?: number; pieces: Array<[number, Pt[]]> }>> = rows.slice(1).map(() => []);
      const emit = (sa: number, sb: number, depth: number): void => {
        const um = (sa + sb) / 2;
        const mid = new Map<number, [number, number]>();
        const active: number[] = [];
        this.s.layers.forEach((_, li) => {
          const iv = this.interval(li, um);
          if (iv) {
            active.push(li);
            mid.set(li, iv);
          }
        });
        const A = this.paint(sa, active, mid);
        const B = this.paint(sb, active, mid);
        const same = A.length === B.length && A.every((x, i) => x.id === B[i]!.id);
        if (!same && depth < 5) {
          emit(sa, um, depth + 1);
          emit(um, sb, depth + 1);
          return;
        }
        for (let j = 0; j + 1 < rows.length; j++) {
          const [y0, y1] = [rows[j]!, rows[j + 1]!];
          const full = (sb - sa) * (y1 - y0);
          const pieces: Array<[number, Pt[]]> = [];
          if (!same) {
            // a crossing too narrow to resolve: the cell takes its centre's paint
            const M = this.paint(um, active, mid);
            const yc = (y0 + y1) / 2;
            const at = M.find((x) => x.y0 <= yc && yc <= x.y1) ?? M[0]!;
            pieces.push([at.id, [[sa, y0], [sb, y0], [sb, y1], [sa, y1]]]);
          } else
            for (let i = 0; i < A.length; i++) {
              const poly = clipSlab([[sa, A[i]!.y0], [sb, B[i]!.y0], [sb, B[i]!.y1], [sa, A[i]!.y1]], y0, y1);
              if (poly.length >= 3 && Math.abs(polyArea(poly)) > 1e-9) pieces.push([A[i]!.id, poly]);
            }
          const uniform = pieces.length === 1 && Math.abs(Math.abs(polyArea(pieces[0]![1])) - full) < full * 1e-6 ? pieces[0]![0] : undefined;
          perRow[j]!.push({ sa, sb, pieces, ...(uniform !== undefined ? { uniform } : {}) });
        }
      };
      for (let k = 0; k + 1 < cuts.length; k++) emit(cuts[k]!, cuts[k + 1]!, 0);
      perRow.forEach((cells, j) => {
        const [y0, y1] = [rows[j]!, rows[j + 1]!];
        for (let k = 0; k < cells.length; ) {
          const cell = cells[k]!;
          if (cell.uniform !== undefined) {
            let l = k;
            while (l + 1 < cells.length && cells[l + 1]!.uniform === cell.uniform) l++;
            this.piece(cell.uniform, [[cell.sa, y0], [cells[l]!.sb, y0], [cells[l]!.sb, y1], [cell.sa, y1]], ua, ub, j, corners);
            k = l + 1;
          } else {
            for (const [id, poly] of cell.pieces) this.piece(id, poly, ua, ub, j, corners);
            k++;
          }
        }
      });
    }
    for (const [name, list] of this.out) this.m.scope(name, () => list.forEach(([mat, tris, n]) => this.m.facets(mat, tris, n)));
    this.out.clear();
    this.caps(base);
  }

  /** One convex piece of a cell (u, y points), mapped bilinearly onto the cell. */
  private piece(id: number, poly: Pt[], ua: number, ub: number, j: number, corners: ReadonlyArray<readonly [Vec3, Vec3]>): void {
    if (Math.abs(polyArea(poly)) < 1e-9) return;
    const rows = this.s.rows;
    const [y0, y1] = [rows[j]!, rows[j + 1]!];
    const [a0, b0] = corners[j]!;
    const [a1, b1] = corners[j + 1]!;
    const map = ([u, y]: Pt): Vec3 => {
      const t = (u - ua) / (ub - ua);
      const v = (y - y0) / (y1 - y0);
      const lo = add(mul(a0, 1 - t), mul(b0, t));
      const hi = add(mul(a1, 1 - t), mul(b1, t));
      return add(mul(lo, 1 - v), mul(hi, v));
    };
    const pts = poly.map(map);
    const n = cross(add(sub(b0, a0), sub(b1, a1)), add(sub(a1, a0), sub(b1, b0)));
    if (Math.hypot(...n) < 1e-10) return;
    const centre = mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / pts.length);
    const normal = this.outward(n, centre);
    const tris: Vec3[] = [];
    for (let i = 1; i + 1 < pts.length; i++) tris.push(pts[0]!, pts[i]!, pts[i + 1]!);
    const key = this.scopeName(id);
    if (!this.out.has(key)) this.out.set(key, []);
    this.out.get(key)!.push([this.mat(id), tris, normal]);
  }

  /** The crown and bottom caps: each slice outline closed along the join. */
  private caps(cols: number[]): void {
    for (const [y, up, mat] of [[this.yTop, true, this.s.capTop], [this.yBot, false, this.s.capBottom]] as const) {
      const ring = cols.map((u) => this.at(u, y).p);
      // a crown that closes to a ridge or a point has no cap
      if (Math.abs(polyArea(ring.map((p): Pt => [p[0], p[2]]))) < 1e-6) continue;
      const tris: Vec3[] = [];
      for (let i = 1; i + 1 < ring.length; i++) tris.push(ring[0]!, ring[i]!, ring[i + 1]!);
      this.m.scope(up ? "crown" : "bottom", () => this.m.facets(mat ?? this.s.base, tris, [0, up ? 1 : -1, 0]));
    }
  }

  /** A frame in the surface at (lat, y) on the face: the point, the outward normal, across (viewer's right) and up along the surface. */
  frameAt(lat: number, y: number): { p: Vec3; n: Vec3; t: Vec3; b: Vec3 } {
    const u = this.uAt(lat, y);
    const p = this.at(u, y).p;
    const n = this.normal(u, y);
    const right: Vec3 = [0, 0, -this.s.e];
    const t = unit(sub(right, mul(n, dot(right, n))));
    const b = unit(cross(n, t));
    return { p, n, t, b: b[1] < 0 ? mul(b, -1) : b };
  }

  /**
   * A flat disc or polygon standing `proud` off the surface at (lat, y), its
   * outline in the local frame (across, up), `depth` deep into the surface.
   */
  plate(mat: string, lat: number, y: number, outline: Pt[], proud: number, depth: number, at: { lat: number; y: number } = { lat, y }): void {
    const f = this.frameAt(at.lat, at.y);
    f.p = add(f.p, add(mul(f.t, lat - at.lat), mul(f.b, y - at.y)));
    const pts = outline.map(([a, b]): Vec3 => add(add(f.p, mul(f.n, proud)), add(mul(f.t, a), mul(f.b, b))));
    this.m.slab(mat, pts, mul(f.n, -depth));
  }

  /** A round lamp: a bezel and its lens, radius r, at (lat, y). */
  lamp(lat: number, y: number, r: number, lens: string, bezel = "frame", sides = 12, lift = 0): void {
    const ring = (rr: number): Pt[] => Array.from({ length: sides }, (_, i) => [rr * Math.cos((2 * Math.PI * i) / sides), rr * Math.sin((2 * Math.PI * i) / sides)]);
    this.m.scope("bezel", () => this.plate(bezel, lat, y, ring(r), lift + 0.03, 0.05));
    this.m.scope("lens", () => this.plate(lens, lat, y, ring(r * 0.78), lift + 0.036, 0.008));
  }

  /**
   * Flat triangles (lat, y pairs, three per triangle) laid on the face `proud`
   * off it: an emblem or lettering. Each point follows the surface.
   */
  decal(mat: string, tris: Pt[], proud = 0.004): void {
    if (!tris.length) return;
    const pts = tris.map(([lat, y]): Vec3 => {
      const u = this.uAt(lat, y);
      return add(this.at(u, y).p, mul(this.normal(u, y), proud));
    });
    const cl = tris.reduce((s, p) => s + p[0], 0) / tris.length;
    const cy = tris.reduce((s, p) => s + p[1], 0) / tris.length;
    this.m.facets(mat, pts, this.normal(this.uAt(cl, cy), cy));
  }
}

const polyArea = (poly: Pt[]): number =>
  poly.reduce((s, p, i) => {
    const q = poly[(i + 1) % poly.length]!;
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;

/** A convex polygon (u, y) clipped to y0 <= y <= y1. */
function clipSlab(poly: Pt[], y0: number, y1: number): Pt[] {
  const cut = (ring: Pt[], h: number, above: boolean): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[1] >= h - 1e-12 : a[1] <= h + 1e-12;
      const inB = above ? b[1] >= h - 1e-12 : b[1] <= h + 1e-12;
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

/** Inside a rounded rectangle centred (cx, cy), half sizes (hx, hy), corner radius r. */
export function inRoundRect(x: number, y: number, cx: number, cy: number, hx: number, hy: number, r: number): boolean {
  const dx = Math.abs(x - cx) - (hx - r);
  const dy = Math.abs(y - cy) - (hy - r);
  if (dx <= 0 || dy <= 0) return Math.abs(x - cx) <= hx && Math.abs(y - cy) <= hy;
  return dx * dx + dy * dy <= r * r;
}
