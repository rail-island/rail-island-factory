// The Arc de Triomphe de l'Etoile (Paris, Place Charles-de-Gaulle), a plaza
// landmark the game may stand in the middle of a round city square. See
// docs/models/plaza-landmarks.md.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. The long axis
// runs along X (45 m between the side faces), the depth along Z (22 m between the
// main faces); the main arch passes along Z and its Champs-Elysees face looks
// +Z, the two transverse arches pass along X through the piers. Heights follow
// the published figures: 50 m overall, the main arch 29.19 m high and 14.62 m
// wide, the transverse arches 18.68 m high and 8.44 m wide. The rest (the
// imposts, the relief panels, the entablature and the attic) is measured on the
// photographs in assets/arc-de-triomphe/ (see its SOURCES.md).
//
// What it carries: four piers with real, open barrel vaults whose soffits are
// coffered (each coffer a recess with a rosette), the archivolts and keystone,
// the four sculpture groups on their pedestals (Le Depart de 1792 -- La
// Marseillaise --, Le Triomphe de 1810, La Resistance and La Paix), the six high
// reliefs above them and on the side faces, the winged Victories in the main
// arch's spandrels, the grand frieze, the deep cornice on its modillions, the
// attic with its 30 round shields, the roof terrace and its parapet, and the
// Tomb of the Unknown Soldier under the arch.
//
// Deterministic: the same code gives the same bytes. The id is what the game's
// saved maps store, so the design is never renamed once shipped.

import { MeshBuilder, rect, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#ddd4c1", roughness: 0.9 },
  stoneShade: { color: "#c6baa1", roughness: 0.9 },
  weathered: { color: "#a39780", roughness: 0.95 },
  coffer: { color: "#8e8270", roughness: 0.95 },
  relief: { color: "#c9bc9f", roughness: 0.9 },
  terrace: { color: "#9a958c", roughness: 0.85 },
  granite: { color: "#55534f", roughness: 0.7 },
  bronze: { color: "#7a6238", metallic: 0.6, roughness: 0.45 },
};

// --- the published and measured datums ------------------------------------------------

/** Half the width (the side faces at x = +-W) and half the depth (the main faces at z = +-D). */
const W = 22.5;
const D = 11;
/** The main arch: half span and springing (29.19 m high, 14.62 m wide). */
const MAIN_A = 7.31;
const MAIN_YS = 29.19 - MAIN_A;
/** The transverse arches: half span and springing (18.68 m high, 8.44 m wide). */
const TR_A = 4.22;
const TR_YS = 18.68 - TR_A;
/** The centre of each pier, from the main arch to the side face. */
const PIER_C = (MAIN_A + W) / 2;
/** The underside of the architrave: the walls stop here. */
const Y_ARCH = 30.4;
/** Height of the parapet's top: the overall height. */
const Y_TOP = 50;

// --- vector helpers -------------------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A triangle wound so its face looks along `n`; a degenerate one is dropped. */
function otri(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, n: Vec3): void {
  const f = cross(sub(b, a), sub(c, a));
  if (Math.hypot(f[0], f[1], f[2]) < 1e-9) return;
  if (dot(f, n) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A quad (two triangles a-b-c, a-c-d) wound to look along `n`. */
function oquad(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  otri(m, mat, a, b, c, n);
  otri(m, mat, a, c, d, n);
}

/** The two unit axes across the segment a -> b: `v` as close to `up` as it can be, `u` beside it. */
function frameOf(a: Vec3, b: Vec3, up: Vec3): { u: Vec3; v: Vec3 } {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  return { u: cross(d, v), v };
}

/** A straight bar from a to b, w wide and h deep across it; `up` turns its h side. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const { u, v } = frameOf(a, b, up);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** A low-poly ellipsoid (a head, a helmet, a shoulder): two rings of n points and two poles. */
function blob(m: MeshBuilder, mat: string, c: Vec3, rx: number, ry: number, rz: number, n = 6): void {
  const ring = (y: number): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      out.push([c[0] + rx * 0.89 * Math.cos(a), c[1] + y, c[2] + rz * 0.89 * Math.sin(a)]);
    }
    return out;
  };
  const lo = ring(-0.45 * ry);
  const hi = ring(0.45 * ry);
  const bot: Vec3 = [c[0], c[1] - ry, c[2]];
  const top: Vec3 = [c[0], c[1] + ry, c[2]];
  const away = (a: Vec3, b: Vec3, d: Vec3): void => {
    const g = mul(add(add(a, b), d), 1 / 3);
    otri(m, mat, a, b, d, sub(g, c));
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    away(bot, lo[i]!, lo[j]!);
    away(lo[i]!, lo[j]!, hi[j]!);
    away(lo[i]!, hi[j]!, hi[i]!);
    away(hi[i]!, hi[j]!, top);
  }
}

/** A closed box spanning x0..x1, y0..y1, z0..z1: a box() plus its underside, `top` optional. */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/** A box() given by its spans instead of its centre and size; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

// --- faces: a vertical wall plane with its own across axis -------------------------------

/**
 * A vertical face: its origin `o` (u = 0, y = 0, on the wall), the outward normal
 * N (horizontal) and the across axis U = Y x N, so u runs to the right as one
 * looks at the face. Points are given as (u, y, d), d the distance out of the wall.
 */
interface Face {
  o: Vec3;
  U: Vec3;
  N: Vec3;
}

const faceOf = (o: Vec3, N: Vec3): Face => ({ o, N, U: cross([0, 1, 0], N) });
const fp = (F: Face, u: number, y: number, d = 0): Vec3 => [
  F.o[0] + F.U[0] * u + F.N[0] * d,
  F.o[1] + y,
  F.o[2] + F.U[2] * u + F.N[2] * d,
];

/** A box on a face: u0..u1 across, y0..y1, d0..d1 out of the wall (the faces are axis-aligned). */
function fbox(m: MeshBuilder, mat: string, F: Face, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, bottom = false, top = true): void {
  const a = fp(F, u0, 0, d0);
  const b = fp(F, u1, 0, d1);
  const x0 = Math.min(a[0], b[0]);
  const x1 = Math.max(a[0], b[0]);
  const z0 = Math.min(a[2], b[2]);
  const z1 = Math.max(a[2], b[2]);
  if (bottom) cube(m, mat, x0, x1, y0, y1, z0, z1, top);
  else span(m, mat, x0, x1, y0, y1, z0, z1, top);
}

/** A flat convex outline (face coordinates u, y) at d = front, extruded back into the wall to d = back. */
function fslab(m: MeshBuilder, mat: string, F: Face, pts: Array<[number, number]>, front: number, back: number, backFace = true): void {
  if (backFace) {
    m.slab(mat, pts.map(([u, y]) => fp(F, u, y, front)), mul(F.N, back - front));
    return;
  }
  // the back is buried in the wall: only the face and its walls are drawn
  const f = pts.map(([u, y]) => fp(F, u, y, front));
  const b = pts.map(([u, y]) => fp(F, u, y, back));
  const out = front > back ? F.N : mul(F.N, -1);
  for (let k = 1; k + 1 < f.length; k++) otri(m, mat, f[0]!, f[k]!, f[k + 1]!, out);
  const cu = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  for (let i = 0; i < f.length; i++) {
    const j = (i + 1) % f.length;
    oquad(m, mat, f[i]!, f[j]!, b[j]!, b[i]!, sub(fp(F, (pts[i]![0] + pts[j]![0]) / 2, (pts[i]![1] + pts[j]![1]) / 2), fp(F, cu, cy)));
  }
}

/**
 * The wall u0..u1 x v0..v1 of a face with a round-headed opening centred on
 * u = 0: half span a, springing at ys, open down to v0. The opening's arc has
 * `segs` straight pieces at the same angles as the vault behind it, so the two
 * meet without a crack.
 */
function archFace(m: MeshBuilder, mat: string, F: Face, u0: number, u1: number, v0: number, v1: number, a: number, ys: number, segs: number): void {
  const n = F.N;
  const P = (u: number, v: number): Vec3 => fp(F, u, v);
  oquad(m, mat, P(u0, v0), P(-a, v0), P(-a, v1), P(u0, v1), n);
  oquad(m, mat, P(a, v0), P(u1, v0), P(u1, v1), P(a, v1), n);
  const H = v1 - ys;
  type Side = 0 | 1 | 2; // right, top, left
  const bound = (t: number): { u: number; v: number; s: Side } => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    let k = Infinity;
    let side: Side = 1;
    if (c > 1e-9 && a / c < k) { k = a / c; side = 0; }
    if (c < -1e-9 && -a / c < k) { k = -a / c; side = 2; }
    if (s > 1e-9 && H / s <= k) { k = H / s; side = 1; }
    return { u: c * k, v: ys + s * k, s: side };
  };
  for (let i = 0; i < segs; i++) {
    const t0 = (i / segs) * Math.PI;
    const t1 = ((i + 1) / segs) * Math.PI;
    const p0 = P(a * Math.cos(t0), ys + a * Math.sin(t0));
    const p1 = P(a * Math.cos(t1), ys + a * Math.sin(t1));
    const q0 = bound(t0);
    const q1 = bound(t1);
    const poly: Vec3[] = [p0, p1, P(q1.u, q1.v)];
    if (q1.s === 2 && q0.s !== 2) poly.push(P(-a, v1));
    if (q0.s === 0 && q1.s !== 0) poly.push(P(a, v1));
    poly.push(P(q0.u, q0.v));
    for (let k = 1; k + 1 < poly.length; k++) otri(m, mat, p0, poly[k]!, poly[k + 1]!, n);
  }
}

// --- the vaults ------------------------------------------------------------------------

/**
 * A barrel vault: the half cylinder of radius R springing at ys about the line
 * through C along L (A is across it), from w0 to w1 along L, facing its axis.
 * A plain band `band` long at each end; between them `rows` rows of coffers,
 * each spanning two of the `segs` arc pieces: a frame, four walls down to the
 * recess `depth` deep and a pyramid rosette in it.
 */
interface Vault {
  C: Vec3;
  A: Vec3;
  L: Vec3;
  R: number;
  ys: number;
  w0: number;
  w1: number;
  segs: number;
  band: number;
  rows: number;
  depth: number;
}

function vault(m: MeshBuilder, v: Vault): void {
  const at = (t: number, w: number, r = v.R): Vec3 =>
    add(add(v.C, mul(v.A, r * Math.cos(t))), add([0, v.ys + r * Math.sin(t), 0], mul(v.L, w)));
  const inward = (t: number): Vec3 => mul(add(mul(v.A, Math.cos(t)), [0, Math.sin(t), 0]), -1);
  const T = (k: number): number => (k / v.segs) * Math.PI;
  m.scope("end bands", () => {
    for (const [a, b] of [[v.w0, v.w0 + v.band], [v.w1 - v.band, v.w1]] as const) {
      for (let k = 0; k < v.segs; k++) {
        oquad(m, "stoneShade", at(T(k), a), at(T(k + 1), a), at(T(k + 1), b), at(T(k), b), inward(T(k + 0.5)));
      }
    }
  });
  m.scope("coffers", () => {
    const cw = (v.w1 - v.w0 - 2 * v.band) / v.rows;
    const mf = 0.17;
    for (let j = 0; j < v.rows; j++) {
      const wA = v.w0 + v.band + j * cw;
      const wB = wA + cw;
      const wi0 = wA + mf * cw;
      const wi1 = wB - mf * cw;
      for (let i = 0; i < v.segs / 2; i++) {
        const ta = T(2 * i);
        const tm = T(2 * i + 1);
        const tb = T(2 * i + 2);
        const ti0 = ta + mf * (tb - ta);
        const ti1 = tb - mf * (tb - ta);
        const n = inward(tm);
        // the frame round the coffer, on the vault's surface
        otri(m, "stone", at(ta, wA), at(tm, wA), at(ti0, wi0), n);
        otri(m, "stone", at(tm, wA), at(ti1, wi0), at(ti0, wi0), n);
        otri(m, "stone", at(tm, wA), at(tb, wA), at(ti1, wi0), n);
        otri(m, "stone", at(ta, wB), at(ti0, wi1), at(tm, wB), n);
        otri(m, "stone", at(tm, wB), at(ti0, wi1), at(ti1, wi1), n);
        otri(m, "stone", at(tm, wB), at(ti1, wi1), at(tb, wB), n);
        oquad(m, "stone", at(ta, wA), at(ti0, wi0), at(ti0, wi1), at(ta, wB), inward(ta));
        oquad(m, "stone", at(tb, wA), at(ti1, wi0), at(ti1, wi1), at(tb, wB), inward(tb));
        // the recess: four walls and its floor
        const R2 = v.R + v.depth;
        const mid = at(tm, (wi0 + wi1) / 2, v.R + v.depth / 2);
        const corners: Array<[number, number]> = [[ti0, wi0], [ti1, wi0], [ti1, wi1], [ti0, wi1]];
        for (let k = 0; k < 4; k++) {
          const [s0, z0] = corners[k]!;
          const [s1, z1] = corners[(k + 1) % 4]!;
          const e0 = at(s0, z0);
          const e1 = at(s1, z1);
          oquad(m, "stoneShade", e0, e1, at(s1, z1, R2), at(s0, z0, R2), sub(mid, mul(add(e0, e1), 0.5)));
        }
        oquad(m, "coffer", at(ti0, wi0, R2), at(ti1, wi0, R2), at(ti1, wi1, R2), at(ti0, wi1, R2), n);
        // the rosette: a low pyramid standing on the recess floor
        const rb = R2 * Math.cos((ti1 - ti0) / 2) - 0.012;
        const dt = (ti1 - ti0) * 0.24;
        const dw = (wi1 - wi0) * 0.24;
        const wc = (wi0 + wi1) / 2;
        const base = [at(tm - dt, wc - dw, rb), at(tm + dt, wc - dw, rb), at(tm + dt, wc + dw, rb), at(tm - dt, wc + dw, rb)];
        const apex = at(tm, wc, rb - v.depth * 0.75);
        const behind = at(tm, wc, rb + 0.3);
        for (let k = 0; k < 4; k++) {
          const a = base[k]!;
          const b = base[(k + 1) % 4]!;
          otri(m, "stone", a, b, apex, sub(mul(add(add(a, b), apex), 1 / 3), behind));
        }
      }
    }
  });
}

// --- archivolts -------------------------------------------------------------------------

/** The moulded band round an opening on a face (half span a, springing ys) and its outer bead. */
function archivolt(m: MeshBuilder, F: Face, a: number, ys: number, segs: number, width: number, proud: number): void {
  // the face, the inner and outer walls and the two ends; the back is buried in the wall
  const ring = (r0: number, r1: number, front: number, mat: string, back: number): void => {
    const P = (r: number, t: number, d: number): Vec3 => fp(F, r * Math.cos(t), ys + r * Math.sin(t), d);
    const radial = (t: number): Vec3 => add(mul(F.U, Math.cos(t)), [0, Math.sin(t), 0]);
    for (let i = 0; i < segs; i++) {
      const t0 = (i / segs) * Math.PI;
      const t1 = ((i + 1) / segs) * Math.PI;
      const tm = (t0 + t1) / 2;
      oquad(m, mat, P(r0, t0, front), P(r1, t0, front), P(r1, t1, front), P(r0, t1, front), F.N);
      oquad(m, mat, P(r0, t0, front), P(r0, t1, front), P(r0, t1, back), P(r0, t0, back), mul(radial(tm), -1));
      oquad(m, mat, P(r1, t0, front), P(r1, t1, front), P(r1, t1, back), P(r1, t0, back), radial(tm));
      if (i === 0) oquad(m, mat, P(r0, t0, front), P(r1, t0, front), P(r1, t0, back), P(r0, t0, back), [0, -1, 0]);
      if (i === segs - 1) oquad(m, mat, P(r0, t1, front), P(r1, t1, front), P(r1, t1, back), P(r0, t1, back), [0, -1, 0]);
    }
  };
  ring(a + 0.03, a + width, proud, "stone", -0.06);
  ring(a + width, a + width + 0.22, proud + 0.14, "stoneShade", -0.09);
}

// --- sculpture: rounded volumes ------------------------------------------------------------

/** A spine point of a rounded volume on a face: u, y, d and its half widths across (rx) and out of the wall (rz). */
type J = [number, number, number, number, number];

/**
 * A rounded volume lofted along a spine on face F: a ring of n sides about each
 * spine point, rx across the spine and rz toward the face normal (as far as the
 * spine allows), closed at both ends. `half` keeps only the front half of each
 * ring: a high relief whose open back is buried in the ground behind it.
 * `open0` leaves the first end open where it is buried inside another volume.
 */
function shell(m: MeshBuilder, mat: string, F: Face, js: J[], n: number, half = false, open0 = false): void {
  const k = js.length;
  const P = js.map(([u, y, d]) => fp(F, u, y, d));
  const rings: Vec3[][] = [];
  for (let i = 0; i < k; i++) {
    const t = unit(sub(P[Math.min(i + 1, k - 1)]!, P[Math.max(i - 1, 0)]!));
    let D = sub(F.N, mul(t, dot(F.N, t)));
    if (Math.hypot(D[0], D[1], D[2]) < 0.25) D = sub([0, 1, 0], mul(t, t[1]));
    D = unit(D);
    const A = cross(D, t);
    const [, , , rx, rz] = js[i]!;
    const ring: Vec3[] = [];
    for (let q = 0; q < (half ? n + 1 : n); q++) {
      const th = half ? (q / n) * Math.PI : ((q + 0.5) / n) * Math.PI * 2;
      ring.push(add(P[i]!, add(mul(A, rx * Math.cos(th)), mul(D, rz * Math.sin(th)))));
    }
    rings.push(ring);
  }
  for (let i = 0; i + 1 < k; i++) {
    const c = mul(add(P[i]!, P[i + 1]!), 0.5);
    for (let q = 0; q < n; q++) {
      const q1 = half ? q + 1 : (q + 1) % n;
      const a = rings[i]![q]!;
      const b = rings[i]![q1]!;
      const e = rings[i + 1]![q1]!;
      const f = rings[i + 1]![q]!;
      oquad(m, mat, a, b, e, f, sub(mul(add(add(a, b), add(e, f)), 0.25), c));
    }
  }
  for (const [i, o] of [[0, 1], [k - 1, k - 2]] as const) {
    if (i === 0 && open0) continue; // the first end is buried in another volume
    const ring = rings[i]!;
    const out = sub(P[i]!, P[o]!);
    if (half) for (let q = 0; q < n; q++) otri(m, mat, P[i]!, ring[q]!, ring[q + 1]!, out);
    else for (let q = 1; q + 1 < n; q++) otri(m, mat, ring[0]!, ring[q]!, ring[q + 1]!, out);
  }
}

/**
 * A closed rounded lump (a head, a bust, a fold, foliage) on face F: ru across, ry
 * up, rd out of the wall. From 8 sides up it is an orb of three rings, rounder
 * than blob()'s two.
 */
function lump(m: MeshBuilder, mat: string, F: Face, u: number, y: number, d: number, ru: number, ry: number, rd: number, n = 6): void {
  const rx = Math.abs(F.U[0]) * ru + Math.abs(F.N[0]) * rd;
  const rz = Math.abs(F.U[2]) * ru + Math.abs(F.N[2]) * rd;
  const c = fp(F, u, y, d);
  if (n < 8) {
    blob(m, mat, c, rx, ry, rz, n);
    return;
  }
  const rings = [[-0.7, 0.71], [0, 1], [0.7, 0.71]].map(([fy, fr]) =>
    Array.from({ length: n }, (_, i): Vec3 => {
      const a = ((i + 0.5 * (fy === 0 ? 1 : 0)) / n) * Math.PI * 2;
      return [c[0] + rx * fr! * Math.cos(a), c[1] + ry * fy!, c[2] + rz * fr! * Math.sin(a)];
    }));
  const bot: Vec3 = [c[0], c[1] - ry, c[2]];
  const top: Vec3 = [c[0], c[1] + ry, c[2]];
  const away = (a: Vec3, b: Vec3, e: Vec3): void => otri(m, mat, a, b, e, sub(mul(add(add(a, b), e), 1 / 3), c));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    away(bot, rings[0]![i]!, rings[0]![j]!);
    away(top, rings[2]![i]!, rings[2]![j]!);
    for (const [lo, hi] of [[rings[0]!, rings[1]!], [rings[1]!, rings[2]!]] as const) {
      away(lo[i]!, lo[j]!, hi[j]!);
      away(lo[i]!, hi[j]!, hi[i]!);
    }
  }
}

/** How a figure is carved: full rings standing free of a mass, or half rings in a sunk relief. */
interface Carve {
  half: boolean;
  /** Sides of the torso and robe rings, of the limb rings and of the head. */
  n: number;
  nl: number;
  nh: number;
  /** The depth of every ring out of the wall, as a share of its width. */
  depth: number;
  /** No limb is thinner than this radius (m). */
  min: number;
  /** How much stouter than life the figures are carved, so they read from afar. */
  bulk: number;
  /** The furthest a spine point comes out of the wall (m). */
  maxD: number;
}

const FREE: Carve = { half: false, n: 8, nl: 5, nh: 8, depth: 1, min: 0.2, bulk: 1.2, maxD: 2.5 };
const RELIEF: Carve = { half: true, n: 4, nl: 3, nh: 6, depth: 1.0, min: 0.2, bulk: 1.3, maxD: 0.5 };

/** An arm: its angle from hanging straight down (toward its own side), the elbow's bend (+ folds the forearm inward), and its reach out of the wall (0..1). */
type Arm = [number, number, number];

/**
 * A sculpted figure on a face, all in face coordinates: feet on y at u, the
 * spine at d out of the wall, h tall. `mir` mirrors it across (-1 turns its
 * right side to -u). `lean` tilts the torso (radians, + toward its right),
 * `legs` sets the stance, a robe hides the legs under a draped skirt, a cloak
 * billows behind the back toward `cloak` (-1..1). Returns its hands.
 */
interface Body {
  u: number;
  y: number;
  d: number;
  h: number;
  mir?: number;
  lean?: number;
  legs?: "stand" | "kneel" | "seat" | "fly" | "lie" | "ride";
  spread?: number;
  armL?: Arm;
  armR?: Arm;
  robe?: boolean;
  cloak?: number;
  helmet?: boolean;
}

type UYD = [number, number, number];

function figure(m: MeshBuilder, mat: string, F: Face, p: Body, c: Carve): { hands: [UYD, UYD]; head: UYD; neck: UYD } {
  const h = p.h;
  const mir = p.mir ?? 1;
  const L = mir * (p.lean ?? 0);
  const T: [number, number] = [Math.sin(L), Math.cos(L)];
  const Q: [number, number] = [Math.cos(L), -Math.sin(L)];
  const legs = p.legs ?? "stand";
  const hipF = { stand: 0.47, kneel: 0.3, seat: 0.27, fly: 0.47, lie: 0.09, ride: 0.27 }[legs];
  const H: [number, number] = [p.u, p.y + hipF * h];
  const d = p.d;
  const z = c.depth;
  const k = c.bulk;
  const r = (f: number): number => Math.max(c.min / k, f * h); // J() scales it by the bulk
  /** A point up the torso (f of h) and across it (q of h, + to the figure's right). */
  const at = (f: number, q = 0, dd = 0): UYD => [H[0] + (T[0] * f + Q[0] * q) * h, H[1] + (T[1] * f + Q[1] * q) * h, d + dd * h];
  // no spine point comes further out of the wall than the plinth lets it
  const J = (pt: UYD, rx: number, rz: number): J => [pt[0], pt[1], Math.min(pt[2], c.maxD), rx * k, rz * z * k];
  m.scope("torso", () => {
    const rings = [
      J(at(-0.05), 0.085 * h, 0.055 * h),
      J(at(0.04), 0.125 * h, 0.075 * h),
      J(at(0.15), 0.11 * h, 0.07 * h),
      J(at(0.29), 0.15 * h, 0.08 * h),
      J(at(0.385), 0.05 * h, 0.045 * h),
    ];
    // a relief figure's torso drops the waist ring: its hips run straight into the chest
    shell(m, mat, F, c.half ? [rings[0]!, rings[1]!, rings[3]!, rings[4]!] : rings, c.n, c.half);
  });
  const headC = at(0.465, 0, c.half ? 0 : 0.012);
  m.scope("head", () => {
    const hb = 1 + (k - 1) * 0.6; // the head grows less than the limbs
    lump(m, mat, F, headC[0], headC[1], headC[2], 0.063 * h * hb, 0.074 * h * hb, 0.066 * h * z * hb, c.nh);
    if (p.helmet && !c.half) {
      const cr = at(0.53, 0, c.half ? 0 : -0.01);
      lump(m, mat, F, cr[0], cr[1], cr[2], 0.032 * h, 0.052 * h, 0.07 * h * z, c.half ? 4 : 6);
    }
  });
  const hands: UYD[] = [];
  m.scope("arms", () => {
    for (const side of [-1, 1]) {
      const sd = side * mir;
      const [a, bend, fw] = (side < 0 ? p.armL : p.armR) ?? [0.25, 0.25, 0];
      const reach = c.half ? 0 : fw;
      const dir = (ang: number, rc: number): UYD => {
        const v = unit([sd * Math.sin(ang) * (1 - rc), -Math.cos(ang) * (1 - rc), rc]);
        return [v[0], v[1], v[2]];
      };
      const sh = at(0.315, sd * 0.125);
      const e1 = dir(a, reach);
      const el: UYD = [sh[0] + e1[0] * 0.19 * h, sh[1] + e1[1] * 0.19 * h, sh[2] + e1[2] * 0.19 * h];
      // the elbow folds the forearm in across the body, and forward when it is out of the wall
      const e2 = dir(a - bend, c.half ? 0 : Math.min(0.75, reach + 0.3 * Math.max(0, bend)));
      const wr: UYD = [el[0] + e2[0] * 0.17 * h, el[1] + e2[1] * 0.17 * h, el[2] + e2[2] * 0.17 * h];
      shell(m, mat, F, [J(sh, r(0.046), r(0.046)), J(el, r(0.034), r(0.034)), J(wr, r(0.029), r(0.029))], c.nl, c.half, true);
      hands.push([wr[0], wr[1], Math.min(wr[2], c.maxD)]);
    }
  });
  m.scope("legs", () => {
    const thigh = (p.robe ? 0.07 : 0.06) * h;
    const leg = (hip: UYD, knee: UYD, foot: UYD): void => shell(m, mat, F, [J(hip, thigh, thigh), J(knee, r(0.042), r(0.042)), J(foot, r(0.03), r(0.03))], c.nl, c.half, true);
    const ground = p.y - 0.05;
    const fwd = c.half ? 0 : 1;
    if (p.robe && !c.half && (legs === "seat" || legs === "kneel")) {
      // the robe drawn over the lap and knees and falling to the plinth
      const lap = legs === "seat" ? 0.12 : 0.07;
      shell(m, mat, F, [J(at(0.06), 0.14 * h, 0.085 * h), J([p.u, H[1] - 0.04 * h, d + lap * h], 0.165 * h, 0.085 * h), J([p.u + mir * 0.03 * h, ground, d + (lap + 0.03) * h], 0.15 * h, 0.06 * h)], c.n, false, true);
      return;
    }
    for (const side of [-1, 1]) {
      const sd = side * mir;
      const hip = at(0.0, sd * 0.07);
      if (legs === "stand") {
        if (p.robe) continue;
        const sp = p.spread ?? 0.11;
        const foot: UYD = [p.u + sd * sp * h, ground, d + 0.02 * h * fwd];
        leg(hip, [(hip[0] + foot[0]) / 2 + sd * 0.01 * h, (hip[1] + foot[1]) / 2, d + 0.04 * h * fwd], foot);
      } else if (legs === "fly" || legs === "lie") {
        if (p.robe) continue;
        leg(hip, at(-0.24, sd * 0.06), at(-0.46, sd * 0.04 + 0.05));
      } else if (legs === "kneel" && side < 0) {
        leg(hip, [p.u + sd * 0.05 * h, p.y + 0.05 * h, d + 0.1 * h * fwd], [p.u + sd * 0.24 * h, ground + 0.03 * h, d - 0.04 * h * fwd]);
      } else if (legs === "kneel") {
        leg(hip, [p.u + sd * 0.21 * h, hip[1] + 0.02 * h, d + 0.08 * h * fwd], [p.u + sd * 0.23 * h, ground, d + 0.06 * h * fwd]);
      } else if (legs === "ride") {
        leg(hip, [hip[0] + mir * 0.12 * h, hip[1] - 0.14 * h, d], [hip[0] + mir * 0.06 * h, hip[1] - 0.4 * h, d]);
      } else {
        // seated: the thighs come forward out of the wall (or across, in a relief), the shins drop
        const kx = c.half ? sd * 0.16 * h : sd * 0.08 * h;
        leg(hip, [p.u + kx, hip[1] + 0.01 * h, d + 0.2 * h * fwd], [p.u + kx * 1.15, ground, d + 0.22 * h * fwd]);
      }
    }
    if (legs === "seat" && !c.half) lump(m, mat, F, p.u, p.y + 0.13 * h, d - 0.02 * h, 0.2 * h, 0.15 * h, 0.13 * h, 6);
  });
  if (p.robe) {
    m.scope("robe", () => {
      const b = p.cloak ?? 0;
      const hem: UYD = legs === "fly" ? at(-0.47, mir * b * 0.08) : [p.u + mir * b * 0.06 * h, p.y - 0.05, d];
      const knee: UYD = legs === "fly" ? at(-0.25, mir * b * 0.04) : [(H[0] + hem[0]) / 2, (H[1] + hem[1]) / 2, d];
      if (legs === "stand" || legs === "fly") {
        shell(m, mat, F, [J(at(0.17), 0.105 * h, 0.07 * h), J(at(0.0), 0.15 * h, 0.09 * h), J(knee, 0.165 * h, 0.095 * h), J(hem, 0.2 * h, 0.1 * h)], c.n, c.half, true);
      }
    });
  }
  if (!p.robe && !c.half && legs !== "fly" && legs !== "lie") {
    // the short tunic over the hips, so the legs grow out of drapery and not out of a joint
    m.scope("tunic", () => shell(m, mat, F, [J(at(0.13), 0.115 * h, 0.072 * h), J(at(-0.02), 0.15 * h, 0.09 * h), J(at(-0.17, 0, 0.01), 0.165 * h, 0.095 * h)], 6, false, true));
  }
  if (p.cloak !== undefined && !c.half) {
    m.scope("cloak", () => {
      const b = mir * p.cloak!;
      const low: UYD = legs === "fly" ? at(-0.4, b * 0.22, -0.07) : [p.u + b * 0.2 * h, p.y + (legs === "stand" ? 0.12 : 0.05) * h, d - 0.07 * h];
      shell(m, mat, F, [
        J(at(0.36, 0, -0.06), 0.13 * h, 0.03 * h),
        J(at(0.2, b * 0.08, -0.075), 0.21 * h, 0.045 * h),
        J([(at(0.2)[0] + low[0]) / 2 + b * 0.05 * h, (at(0.2)[1] + low[1]) / 2, d - 0.075 * h], 0.24 * h, 0.05 * h),
        J(low, 0.2 * h, 0.035 * h),
      ], c.nl, false);
    });
  }
  return { hands: [hands[0]!, hands[1]!], head: headC, neck: at(0.33) };
}

/**
 * A spread wing on face F rooted at (u, y), toward +u when side = 1: a thick
 * feathered slab of three stepped layers (the flight feathers, the coverts and
 * the small feathers at the shoulder) and three primaries splayed past its
 * trailing edge, `span` long and raised `rise` radians, its back at d0, `th` thick.
 */
function wing(m: MeshBuilder, mat: string, F: Face, u: number, y: number, side: number, span: number, rise: number, d0: number, th: number): void {
  const e: [number, number] = [side * Math.cos(rise), Math.sin(rise)];
  const f: [number, number] = [-side * Math.sin(rise), Math.cos(rise)];
  const P = (a: number, b: number): [number, number] => [u + (e[0] * a + f[0] * b) * span, y + (e[1] * a + f[1] * b) * span];
  fslab(m, mat, F, [P(0, 0.12), P(0.45, 0.2), P(1, 0.06), P(0.92, -0.14), P(0.55, -0.3), P(0.12, -0.24)], d0 + th, d0);
  fslab(m, mat, F, [P(0.02, 0.1), P(0.4, 0.17), P(0.62, 0.08), P(0.5, -0.12), P(0.1, -0.16)], d0 + th + 0.2, d0 + th * 0.5);
  fslab(m, mat, F, [P(0.04, 0.09), P(0.26, 0.13), P(0.32, 0.03), P(0.12, -0.07)], d0 + th + 0.38, d0 + th + 0.08);
  // the primaries: a broad fan turned down from the tip, so the trailing edge steps like feathers
  fslab(m, mat, F, [P(0.5, -0.02), P(0.98, -0.02), P(1.06, -0.2), P(0.86, -0.4), P(0.58, -0.38)], d0 + th * 0.85, d0 + th * 0.2);
}

/** A round shield standing out of a face: a 10-gon disc and its boss; their backs are buried. */
function shield(m: MeshBuilder, F: Face, u: number, y: number, r: number, front: number, mat = "stone"): void {
  const ring = (n: number, rr: number): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push([u + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    return out;
  };
  fslab(m, "stoneShade", F, ring(10, r), front, -0.06, false);
  fslab(m, mat, F, ring(10, r * 0.78), front + 0.1, front - 0.04, false);
  fslab(m, "stoneShade", F, ring(6, r * 0.3), front + 0.22, front + 0.05, false);
}

// --- the sculpture groups ---------------------------------------------------------------

/**
 * One of the four groups on the pier fronts, standing on its pedestal at
 * u = uc on face F. `kind` picks the composition: 0 Le Depart (the winged
 * Marseillaise over the volunteers), 1 Le Triomphe (the Emperor crowned by
 * Victory, Fame above), 2 La Resistance (the defender, the fallen horseman), 3
 * La Paix (the warrior sheathing his sword, Minerva above). Every group is a
 * pyramid of rounded figures carved out of one egg-shaped mass on the pier, a
 * base of drapery and bodies hugging the plinth, the winged genius (or Minerva)
 * at the top.
 */
function sculptureGroup(m: MeshBuilder, F: Face, uc: number, kind: number): void {
  const s = uc > 0 ? 1 : -1; // the side of the pier facing out, for mirrored poses
  const R = "relief";
  const yP = 5.2; // the pedestal top
  const G = (u: number): number => uc + s * u;
  const fig = (p: Body): { hands: [UYD, UYD]; head: UYD; neck: UYD } => m.scope("figure", () => figure(m, R, F, { ...p, u: G(p.u), y: yP + p.y, mir: s }, FREE));
  const lumpAt = (u: number, y: number, d: number, ru: number, ry: number, rd: number, n = 6): void => lump(m, R, F, G(u), yP + y, d, ru, ry, rd, n);
  m.scope("pedestal", () => {
    fbox(m, "weathered", F, uc - 4.6, uc + 4.6, 0, 1.0, -0.2, 2.95);
    fbox(m, "stone", F, uc - 4.35, uc + 4.35, 1.0, 4.7, -0.2, 2.7);
    fbox(m, "stoneShade", F, uc - 4.55, uc + 4.55, 4.7, yP, -0.2, 2.9, true);
    fbox(m, "stoneShade", F, uc - 3.2, uc + 3.2, 2.1, 3.7, 2.7, 2.78); // the inscription tablet
  });
  m.scope("mass", () => {
    // the egg-shaped block the group is carved from, shallow, its back buried in the pier
    // (in the darker stone: it reads as the deep shadow between the figures)
    shell(m, "weathered", F, [
      [uc, yP, -0.05, 3.7, 0.75],
      [uc, yP + 1.8, -0.05, 3.9, 0.95],
      [uc, yP + 4.8, -0.05, 3.8, 0.95],
      [G(0.1), yP + 7.2, -0.05, 3.1, 0.85],
      [G(0.15), yP + 8.9, -0.05, 2.1, 0.7],
      [G(0.25), yP + 10.0, -0.05, 0.9, 0.45],
      [G(0.3), yP + 10.4, -0.05, 0.2, 0.15],
    ], 8, true);
    // the drapery, rock and bodies heaped along the plinth
    shell(m, R, F, [
      [G(-3.9), yP + 0.45, 1.6, 0.5, 0.6],
      [G(-2.4), yP + 0.7, 1.9, 0.75, 0.8],
      [G(-0.4), yP + 0.55, 2.05, 0.6, 0.75],
      [G(1.6), yP + 0.75, 1.95, 0.8, 0.8],
      [G(3.9), yP + 0.45, 1.6, 0.5, 0.6],
    ], 8);
  });
  /** A pair of wings at a figure's shoulders, the outer one raised higher. */
  const wingsAt = (f: { neck: UYD }, span: number, th: number): void => {
    const [nu, ny, nd] = f.neck;
    for (const side of [-1, 1]) wing(m, R, F, nu + side * s * 0.25, ny - 0.1, side * s, span, side === 1 ? 0.8 : 0.5, nd - 0.55, th);
  };
  m.scope("upper figure", () => {
    if (kind === 0) {
      // the Marseillaise flying out of the wall, helmeted, her arm flung toward the enemy
      wingsAt(fig({ u: -0.2, y: 5.6, d: 1.3, h: 6.6, lean: 0.38, legs: "fly", robe: true, cloak: 0.8, helmet: true, armR: [2.45, 0.15, 0.35], armL: [1.5, 0.5, 0.35] }), 3.4, 0.42);
    } else if (kind === 1) {
      // Fame blowing her trumpet over the scene
      const g = fig({ u: 0.7, y: 6.6, d: 1.3, h: 5.6, lean: 0.2, legs: "fly", robe: true, cloak: -0.6, armR: [1.9, 3.6, 0.3], armL: [1.0, 0.6, 0.35] });
      wingsAt(g, 2.8, 0.4);
      const [hu, hy, hd] = g.hands[1];
      shell(m, R, F, [[hu, hy, hd, 0.22, 0.22], [hu + s * 0.7, hy + 0.35, hd + 0.15, 0.22, 0.22], [hu + s * 1.25, hy + 0.6, hd + 0.25, 0.52, 0.52]], 6, false, true);
    } else if (kind === 2) {
      // the Genius of the Future calling the defenders on
      wingsAt(fig({ u: 0.0, y: 6.0, d: 1.3, h: 6.2, lean: -0.3, legs: "fly", robe: true, cloak: 0.7, armR: [2.0, 0.2, 0.35], armL: [1.4, 0.6, 0.35] }), 3.2, 0.42);
    } else {
      // Minerva standing above, helmeted, with her shield and an olive branch
      fig({ u: 0.1, y: 5.9, d: 1.35, h: 6.4, lean: -0.04, robe: true, cloak: -0.3, helmet: true, armR: [0.8, 1.1, 0.45], armL: [0.45, 0.8, 0.45] });
      shield(m, F, G(-2.1), yP + 8.7, 1.15, 1.9, R);
      lumpAt(-2.6, 9.5, 0.8, 1.0, 1.3, 0.5, 8); // the olive tree
      lumpAt(-3.05, 8.1, 0.9, 0.85, 1.0, 0.5, 8);
      lumpAt(2.8, 9.3, 0.8, 0.85, 1.4, 0.5, 8); // the sheaf of corn
    }
  });
  m.scope("middle rank", () => {
    // heads and shoulders of the figures behind, filling the middle of the pyramid
    const busts: Array<[number, number]> = kind === 0 ? [[-1.8, 6.0], [1.9, 6.4]] : kind === 1 ? [[2.1, 6.2], [-0.4, 6.9]] : kind === 2 ? [[-1.9, 6.1], [1.9, 6.6]] : [[1.9, 6.0], [-1.6, 6.3]];
    for (const [u, y] of busts) {
      lumpAt(u, y, 1.2, 0.95, 0.85, 0.5, 8);
      lumpAt(u + 0.1, y + 1.05, 1.4, 0.44, 0.52, 0.44, 8);
    }
    // folds of drapery softening both flanks of the block
    for (const side of [-1, 1]) lumpAt(side * 3.2, 5.3 + side * 0.4, 0.7, 0.8, 1.35, 0.5, 8);
  });
  m.scope("lower figures", () => {
    if (kind === 0) {
      // the old volunteer striding and raising his helmet, a boy at his side, the bowman, the warrior behind
      const hero = fig({ u: 0.35, y: 0, d: 2.0, h: 7.0, lean: -0.05, spread: 0.14, cloak: -0.5, armR: [2.65, 0.2, 0.15], armL: [0.55, 0.6, 0.3] });
      const [hu, hy, hd] = hero.hands[1];
      lump(m, R, F, hu, hy + 0.4, hd, 0.42, 0.46, 0.42, 6); // the raised helmet
      fig({ u: -1.3, y: 0, d: 2.3, h: 4.4, lean: 0.1, spread: 0.09, armR: [2.0, 0.6, 0.2], armL: [0.3, 0.3, 0.1] });
      fig({ u: -2.6, y: 0, d: 1.8, h: 6.0, lean: 0.25, legs: "kneel", cloak: 0.4, armL: [0.6, 0.9, 0.5], armR: [1.0, 1.1, 0.4] });
      fig({ u: 2.4, y: 0.4, d: 1.55, h: 6.4, lean: -0.1, helmet: true, cloak: 0.6, spread: 0.1, armR: [2.3, 0.4, 0.15], armL: [0.7, 0.8, 0.3] });
      shield(m, F, G(3.3), yP + 3.6, 1.05, 2.45, R);
    } else if (kind === 1) {
      // the Emperor in his toga crowned by Victory, the kneeling city, History writing
      fig({ u: 0.15, y: 0, d: 2.05, h: 7.2, robe: true, cloak: 0.3, armR: [0.7, 1.4, 0.35], armL: [0.3, 0.25, 0.2] });
      wingsAt(fig({ u: -1.8, y: 4.4, d: 1.65, h: 4.8, lean: 0.5, legs: "fly", robe: true, cloak: -0.7, armR: [1.6, -0.3, 0.25], armL: [1.2, 0.3, 0.3] }), 2.3, 0.36);
      fig({ u: -2.75, y: 0, d: 1.85, h: 5.6, lean: 0.3, legs: "kneel", robe: true, helmet: true, cloak: -0.3, armR: [1.2, 0.6, 0.3], armL: [0.6, 0.5, 0.3] });
      fig({ u: 2.7, y: 0, d: 1.75, h: 5.4, lean: -0.1, legs: "seat", robe: true, armL: [0.9, 0.9, 0.4], armR: [0.4, 0.3, 0.25] });
    } else if (kind === 2) {
      // the young defender, his wounded father, the mother with her dead child, the fallen horseman
      fig({ u: 0.25, y: 0, d: 2.05, h: 7.0, lean: -0.08, spread: 0.16, cloak: 0.6, armR: [2.6, 0.2, 0.1], armL: [0.95, 0.3, 0.3] });
      fig({ u: 2.55, y: 0, d: 1.6, h: 6.2, lean: 0.35, spread: 0.16, cloak: -0.4, armR: [1.9, 0.5, 0.2], armL: [0.5, 0.3, 0.2] });
      fig({ u: -2.5, y: 0, d: 1.85, h: 5.6, lean: -0.15, legs: "seat", robe: true, cloak: -0.5, armL: [0.9, 0.8, 0.4], armR: [0.95, 0.9, 0.4] });
      shell(m, R, F, [[G(-3.3), yP + 2.1, 2.55, 0.36, 0.36], [G(-2.5), yP + 1.95, 2.65, 0.45, 0.42], [G(-1.7), yP + 1.7, 2.55, 0.36, 0.36]], 6); // the child
      // the horse fallen across the foot of the group, its head down at the edge
      shell(m, R, F, [
        [G(0.6), yP + 1.15, 2.05, 0.75, 0.7],
        [G(1.9), yP + 1.3, 2.1, 0.9, 0.75],
        [G(3.2), yP + 1.1, 2.05, 0.75, 0.7],
        [G(3.6), yP + 1.15, 2.05, 0.5, 0.5],
        [G(4.0), yP + 0.65, 2.15, 0.38, 0.38],
        [G(4.15), yP + 0.3, 2.2, 0.28, 0.28],
      ], 8);
    } else {
      // the warrior sheathing his sword, the mother and child, the kneeling husbandman and his ox
      fig({ u: 0.2, y: 0, d: 2.05, h: 7.0, lean: 0.05, spread: 0.13, helmet: true, cloak: -0.3, armR: [0.7, 0.6, 0.3], armL: [0.4, 1.2, 0.35] });
      shell(m, R, F, [[G(1.05), yP + 1.7, 2.7, 0.2, 0.2], [G(0.6), yP + 3.8, 2.65, 0.21, 0.21]], 6); // the sword going into its sheath
      fig({ u: -2.55, y: 0, d: 1.85, h: 5.4, lean: 0.1, legs: "seat", robe: true, cloak: 0.3, armL: [0.7, 1.0, 0.4], armR: [0.8, 1.1, 0.4] });
      lumpAt(-2.2, 2.6, 2.65, 0.48, 0.62, 0.42); // the child on her lap
      lumpAt(-2.15, 3.45, 2.6, 0.32, 0.34, 0.32);
      fig({ u: 2.5, y: 0, d: 1.85, h: 5.6, lean: 0.55, legs: "kneel", cloak: 0.5, armR: [0.6, 0.2, 0.3], armL: [0.9, 0.1, 0.3] });
      lumpAt(3.35, 5.6, 1.45, 0.62, 0.78, 0.62); // the ox's head
    }
  });
}

// --- the high-relief panels and the frieze ----------------------------------------------

/**
 * A framed high-relief panel u0..u1 x y0..y1 on face F: its frame, the sunk
 * ground and a battle or funeral scene carved in rounded half volumes 0.3 to 0.6 m
 * proud of the ground: `n` overlapping figures in two ranks, a horseman, and a
 * fallen soldier along the foot (seed varies the poses and the order).
 */
function reliefPanel(m: MeshBuilder, F: Face, u0: number, u1: number, y0: number, y1: number, n: number, seed: number): void {
  m.scope("ground", () => fslab(m, "stoneShade", F, [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], 0.12, -0.05));
  m.scope("frame", () => {
    const f = 0.34;
    fbox(m, "stone", F, u0 - 0.1, u1 + 0.1, y0 - 0.1, y0 + f, -0.08, 0.32, true);
    fbox(m, "stone", F, u0 - 0.1, u1 + 0.1, y1 - f, y1 + 0.1, -0.08, 0.32, true);
    fbox(m, "stone", F, u0 - 0.1, u0 + f, y0 + f, y1 - f, -0.08, 0.32);
    fbox(m, "stone", F, u1 - f, u1 + 0.1, y0 + f, y1 - f, -0.08, 0.32);
  });
  m.scope("figures", () => {
    const gy = y0 + 0.3; // the feet stand on the frame's lower rail
    const h = (y1 - y0) * 0.78;
    const dS = 0.08; // the spine, just inside the ground
    const mir = seed % 2 === 0 ? 1 : -1;
    const hk = seed % 3 === 0 ? 1 : n - 2; // where the horseman rides
    const sk = hk === 1 ? 2 : n - 3;
    const step = (u1 - u0 - 1.8) / (n - 1);
    for (let k = 0; k < n; k++) {
      const u = u0 + 0.9 + k * step;
      if (k === hk) {
        // the horse: barrel, neck and head, four thick legs, its rider
        const hm = mir * (k < n / 2 ? 1 : -1);
        const H = (du: number, y: number, rx: number, rz: number): J => [u + hm * du, gy + y, dS, rx, rz];
        m.scope("horse", () => {
          shell(m, "relief", F, [H(-1.75, 2.5, 0.3, 0.4), H(-1.35, 2.45, 0.68, 0.58), H(-0.2, 2.5, 0.8, 0.62), H(0.9, 2.6, 0.75, 0.6), H(1.3, 2.75, 0.4, 0.45)], 6, true);
          shell(m, "relief", F, [H(0.95, 2.9, 0.5, 0.55), H(1.55, 3.7, 0.4, 0.5), H(2.0, 3.45, 0.32, 0.45), H(2.25, 2.95, 0.2, 0.35)], 4, true);
          lump(m, "relief", F, u - hm * 1.85, gy + 2.1, dS, 0.25, 0.55, 0.3, 4); // the tail
          for (const [a, b, c] of [[-1.2, -1.35, -1.5], [-0.8, -0.95, -0.7], [0.5, 0.8, 0.9], [0.85, 1.25, 1.55]] as const) {
            shell(m, "relief", F, [H(a, 2.1, 0.27, 0.45), H(b, 1.05, 0.22, 0.4), H(c, -0.02, 0.2, 0.36)], 3, true);
          }
        });
        figure(m, "relief", F, { u: u - hm * 0.1, y: gy + 1.7, d: dS, h: h * 0.85, mir: hm, lean: 0.05, legs: "ride", armR: [2.3, 0.3, 0], armL: [1.2, 0.5, 0], helmet: true }, RELIEF);
        continue;
      }
      if (k === sk) continue; // the horse takes two places
      const q = (k * 7 + seed * 3) % 5; // a fixed spread of poses
      const front = k % 2 === 0;
      const carve: Carve = { ...RELIEF, depth: front ? 1.05 : 0.72 };
      const lean = [0.1, -0.06, 0.04, 0.16, -0.1][q]!;
      const armR = ([[2.5, 0.2, 0], [0.5, 1.2, 0], [1.3, 0.8, 0], [1.1, -0.3, 0], [0.5, 1.0, 0]] as Arm[])[q]!;
      const armL = ([[0.4, 0.9, 0], [0.3, 0.8, 0], [0.35, 0.4, 0], [0.6, 0.9, 0], [2.2, 0.3, 0]] as Arm[])[q]!;
      figure(m, "relief", F, {
        u, y: gy + (front ? 0 : 0.3), d: dS, h: h * (q === 3 ? 0.86 : front ? 1 : 0.95), mir: k % 3 === 0 ? -mir : mir,
        lean, armR, armL, helmet: q % 2 === 0, legs: q === 3 ? "kneel" : "stand", robe: q === 1 || q === 4, spread: 0.12,
      }, carve);
      // the rank behind, its heads and shoulders crowding the gap to the next figure
      if (k + 1 < n && k + 1 !== hk && k + 1 !== sk) {
        const bu = u + step / 2;
        lump(m, "relief", F, bu, gy + 0.62 * h, dS, 0.2 * h, 0.2 * h, 0.07 * h, 4);
        lump(m, "relief", F, bu, gy + 0.9 * h, dS, 0.07 * h, 0.08 * h, 0.07 * h, 4);
      }
    }
    // a fallen soldier along the foot of the scene
    const fu = u0 + 0.9 + (hk === 1 ? n - 2 : 2) * step;
    figure(m, "relief", F, { u: fu, y: gy, d: dS, h: h * 0.78, mir, lean: 1.42, legs: "lie", armR: [1.6, 0.4, 0], armL: [0.3, 0.2, 0] }, { ...RELIEF, depth: 1.1 });
  });
}

/** The grand frieze's procession of figures along a face of the frieze band, u0..u1 at y0..y1. */
function frieze(m: MeshBuilder, F: Face, u0: number, u1: number, y0: number, y1: number, pitch: number): void {
  const n = Math.max(2, Math.round((u1 - u0) / pitch));
  const step = (u1 - u0) / n;
  const h = y1 - y0;
  for (let k = 0; k <= n; k++) {
    const u = u0 + k * step;
    const lean = ((k * 5) % 3 - 1) * 0.12;
    fslab(m, "relief", F, [[u - 0.3, y0], [u + 0.3, y0], [u + 0.2 + lean, y0 + h * 0.72], [u - 0.2 + lean, y0 + h * 0.72]], 0.28, -0.05);
    blob(m, "relief", fp(F, u + lean, y0 + h * 0.84, 0.14), 0.2, 0.24, 0.16, 4);
    if (k % 3 === 0) beam(m, "relief", fp(F, u + lean + 0.15, y0 + h * 0.62, 0.15), fp(F, u + lean + 0.55, y0 + h * 0.95, 0.15), 0.16, 0.18, F.N);
  }
}

/**
 * A winged Victory lying in a spandrel of the main arch, on face F, on the u > 0
 * side when s = 1: her draped legs low on the pier, the body reclined along the
 * arch's back, the head near the crown, one arm holding a wreath out to the
 * keystone, the other a palm, a layered wing filling the corner above her.
 */
function spandrelVictory(m: MeshBuilder, F: Face, s: number): void {
  const R = "relief";
  const S = (u: number, y: number, d: number, rx: number, rz: number): J => [s * u, y, d, rx, rz];
  m.scope("wing", () => {
    // the wing raised behind her shoulders into the corner: the flight feathers, the coverts, the small feathers
    const P = (u: number, y: number): [number, number] => [s * u, y];
    fslab(m, R, F, [P(4.9, 29.1), P(5.7, 30.28), P(8.9, 30.28), P(9.3, 28.5), P(8.3, 27.3)], 0.22, -0.05);
    fslab(m, R, F, [P(7.2, 29.7), P(8.7, 30.2), P(9.28, 28.9), P(9.0, 27.9), P(8.0, 28.3)], 0.42, 0.1);
    fslab(m, R, F, [P(5.3, 29.25), P(6.0, 30.12), P(7.5, 30.12), P(7.8, 28.95), P(6.9, 28.3)], 0.55, 0.15);
    fslab(m, R, F, [P(5.6, 29.35), P(6.2, 29.98), P(6.9, 29.92), P(6.75, 29.05)], 0.78, 0.4);
  });
  m.scope("body", () => {
    // the robe from her feet to her hips, then the torso to the shoulders, all lying on the arch
    shell(m, R, F, [S(9.15, 22.9, -0.03, 0.4, 0.42), S(8.9, 24.2, -0.03, 0.8, 0.62), S(8.35, 25.6, -0.03, 0.92, 0.68), S(7.3, 26.95, -0.03, 0.85, 0.66)], 6, true);
    shell(m, R, F, [S(7.3, 26.95, -0.03, 0.82, 0.64), S(6.2, 28.1, -0.03, 0.7, 0.6), S(5.15, 28.85, -0.03, 0.78, 0.6), S(4.6, 29.2, -0.03, 0.28, 0.32)], 6, true);
    lump(m, R, F, s * 4.1, 29.62, 0.22, 0.46, 0.48, 0.46, 8);
  });
  m.scope("arms", () => {
    // one arm holds the wreath out toward the keystone, the other a palm along her side
    shell(m, R, F, [S(4.85, 29.2, 0.3, 0.27, 0.27), S(3.9, 29.68, 0.36, 0.24, 0.24), S(3.05, 29.82, 0.42, 0.22, 0.22)], 6);
    // the wreath: a flat ring of leaves held up edge-on to the keystone
    const wr: Array<[number, number]> = Array.from({ length: 8 }, (_, i) => [s * 2.55 + 0.46 * Math.cos((i / 8) * Math.PI * 2), 29.82 + 0.42 * Math.sin((i / 8) * Math.PI * 2)]);
    fslab(m, R, F, wr, 0.62, 0.3);
    shell(m, R, F, [S(5.4, 28.55, 0.34, 0.27, 0.27), S(6.0, 27.6, 0.52, 0.24, 0.24), S(6.9, 27.3, 0.58, 0.22, 0.22)], 6);
    shell(m, R, F, [S(6.95, 27.25, 0.6, 0.22, 0.2), S(7.95, 26.0, 0.55, 0.34, 0.18), S(8.6, 24.9, 0.48, 0.24, 0.14)], 4); // the palm
  });
}

// --- the build --------------------------------------------------------------------------

/** The four faces of the monument: +Z (Champs-Elysees), -Z (Grande Armee), +X and -X. */
const FRONT = faceOf([0, 0, D], [0, 0, 1]);
const BACK = faceOf([0, 0, -D], [0, 0, -1]);
const EAST = faceOf([W, 0, 0], [1, 0, 0]);
const WEST = faceOf([-W, 0, 0], [-1, 0, 0]);

/** Builds the Arc de Triomphe; see the header for the axes and sources. */
export function arcDeTriomphe(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);

  m.scope("piers and arches", () => {
    m.scope("main faces", () => {
      for (const F of [FRONT, BACK]) archFace(m, "stone", F, -W, W, 0, Y_ARCH, MAIN_A, MAIN_YS, 24);
    });
    m.scope("side faces", () => {
      for (const F of [EAST, WEST]) archFace(m, "stone", F, -D, D, 0, Y_ARCH, TR_A, TR_YS, 16);
    });
    m.scope("main passage walls", () => {
      for (const s of [-1, 1]) archFace(m, "stone", faceOf([s * MAIN_A, 0, 0], [-s, 0, 0]), -D, D, 0, MAIN_YS, TR_A, TR_YS, 16);
    });
    m.scope("transverse passage walls", () => {
      for (const s of [-1, 1]) {
        for (const z of [-1, 1]) {
          const x0 = s * MAIN_A;
          const x1 = s * W;
          oquad(m, "stone", [x0, 0, z * TR_A], [x1, 0, z * TR_A], [x1, TR_YS, z * TR_A], [x0, TR_YS, z * TR_A], [0, 0, -z]);
        }
      }
    });
    m.scope("main vault", () => {
      vault(m, { C: [0, 0, 0], A: [1, 0, 0], L: [0, 0, 1], R: MAIN_A, ys: MAIN_YS, w0: -D, w1: D, segs: 24, band: 2.4, rows: 8, depth: 0.38 });
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "east transverse vault" : "west transverse vault", () => {
        const [w0, w1] = s > 0 ? [MAIN_A, W] : [-W, -MAIN_A];
        vault(m, { C: [0, 0, 0], A: [0, 0, 1], L: [1, 0, 0], R: TR_A, ys: TR_YS, w0, w1, segs: 16, band: 1.5, rows: 7, depth: 0.28 });
      });
    }
  });

  m.scope("mouldings", () => {
    for (const s of [-1, 1]) {
      const X = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
      m.scope(s > 0 ? "east pier" : "west pier", () => {
        for (const z of [-1, 1]) {
          const Z = (a: number, b: number): [number, number] => (z > 0 ? [a, b] : [-b, -a]);
          m.scope("socle", () => {
            cube(m, "weathered", ...X(MAIN_A - 0.3, W + 0.3), 0, 2.0, ...Z(TR_A - 0.3, D + 0.3));
            span(m, "stoneShade", ...X(MAIN_A - 0.16, W + 0.16), 2.0, 2.4, ...Z(TR_A - 0.16, D + 0.16));
          });
          m.scope("transverse impost", () => span(m, "stoneShade", ...X(MAIN_A - 0.2, W + 0.2), TR_YS - 0.55, TR_YS, ...Z(TR_A - 0.2, D + 0.2)));
        }
        m.scope("main impost", () => span(m, "stoneShade", ...X(MAIN_A - 0.22, W + 0.22), MAIN_YS - 0.62, MAIN_YS, -D - 0.22, D + 0.22));
        m.scope("names of the generals", () => {
          // the engraved tablets on the walls of the main passage, either side of the transverse arch
          const F = faceOf([s * MAIN_A, 0, 0], [-s, 0, 0]);
          for (const u of [-1, 1]) {
            fslab(m, "stoneShade", F, [[u * 5.0, 3.0], [u * 10.3, 3.0], [u * 10.3, 13.2], [u * 5.0, 13.2]], 0.05, -0.05);
          }
        });
      });
    }
    m.scope("archivolts", () => {
      for (const F of [FRONT, BACK]) {
        archivolt(m, F, MAIN_A, MAIN_YS, 24, 0.6, 0.22);
        fslab(m, "stone", F, [[-0.55, MAIN_YS + MAIN_A - 0.3], [0.55, MAIN_YS + MAIN_A - 0.3], [0.75, Y_ARCH], [-0.75, Y_ARCH]], 0.48, -0.06); // keystone
      }
      for (const F of [EAST, WEST]) archivolt(m, F, TR_A, TR_YS, 16, 0.45, 0.2);
      for (const s of [-1, 1]) archivolt(m, faceOf([s * MAIN_A, 0, 0], [-s, 0, 0]), TR_A, TR_YS, 16, 0.45, 0.2);
    });
  });

  m.scope("sculpture groups", () => {
    m.scope("le depart de 1792", () => sculptureGroup(m, FRONT, PIER_C, 0));
    m.scope("le triomphe de 1810", () => sculptureGroup(m, FRONT, -PIER_C, 1));
    m.scope("la resistance de 1814", () => sculptureGroup(m, BACK, PIER_C, 2));
    m.scope("la paix de 1815", () => sculptureGroup(m, BACK, -PIER_C, 3));
  });

  m.scope("high reliefs", () => {
    let seed = 0;
    for (const F of [FRONT, BACK]) {
      for (const s of [-1, 1]) {
        m.scope("pier panel", () => reliefPanel(m, F, s * PIER_C - 5.4, s * PIER_C + 5.4, 22.55, 29.85, 7, seed++));
      }
      m.scope("spandrel victories", () => {
        for (const s of [-1, 1]) spandrelVictory(m, F, s);
      });
    }
    for (const F of [EAST, WEST]) m.scope("side panel", () => reliefPanel(m, F, -8.6, 8.6, 22.55, 29.85, 10, seed++));
  });

  m.scope("entablature", () => {
    m.scope("architrave", () => cube(m, "stone", -W - 0.15, W + 0.15, Y_ARCH, 31.6, -D - 0.15, D + 0.15));
    m.scope("frieze", () => {
      span(m, "stoneShade", -W - 0.05, W + 0.05, 31.6, 35.4, -D - 0.05, D + 0.05, false);
      const fx = W + 0.05;
      const fz = D + 0.05;
      frieze(m, faceOf([0, 0, fz], [0, 0, 1]), -fx + 0.7, fx - 0.7, 31.75, 35.25, 2.5);
      frieze(m, faceOf([0, 0, -fz], [0, 0, -1]), -fx + 0.7, fx - 0.7, 31.75, 35.25, 2.5);
      frieze(m, faceOf([fx, 0, 0], [1, 0, 0]), -fz + 0.7, fz - 0.7, 31.75, 35.25, 2.5);
      frieze(m, faceOf([-fx, 0, 0], [-1, 0, 0]), -fz + 0.7, fz - 0.7, 31.75, 35.25, 2.5);
    });
    m.scope("cornice", () => {
      span(m, "stone", -W - 0.35, W + 0.35, 35.4, 35.9, -D - 0.35, D + 0.35);
      // the modillions carrying the corona
      const mods = (len: number, pitch: number): number[] => {
        const n = Math.round(len / pitch);
        return Array.from({ length: n + 1 }, (_, k) => -len / 2 + (k * len) / n);
      };
      for (const x of mods(2 * W + 0.4, 0.95)) {
        for (const z of [-1, 1]) {
          const [z0, z1] = z > 0 ? [D + 0.3, D + 0.82] : [-D - 0.82, -D - 0.3];
          cube(m, "stoneShade", x - 0.16, x + 0.16, 35.5, 35.9, z0, z1, false);
        }
      }
      for (const zz of mods(2 * D + 0.4, 0.95)) {
        for (const x of [-1, 1]) {
          const [x0, x1] = x > 0 ? [W + 0.3, W + 0.82] : [-W - 0.82, -W - 0.3];
          cube(m, "stoneShade", x0, x1, 35.5, 35.9, zz - 0.16, zz + 0.16, false);
        }
      }
      cube(m, "stone", -W - 0.9, W + 0.9, 35.9, 37.2, -D - 0.9, D + 0.9);
      span(m, "stoneShade", -W - 0.7, W + 0.7, 37.2, 37.75, -D - 0.7, D + 0.7);
    });
  });

  m.scope("attic", () => {
    span(m, "stoneShade", -W - 0.1, W + 0.1, 37.75, 38.7, -D - 0.1, D + 0.1);
    span(m, "stone", -W + 0.25, W - 0.25, 38.7, 47.4, -D + 0.25, D - 0.25, false);
    span(m, "stoneShade", -W + 0.15, W - 0.15, 41.6, 42.0, -D + 0.15, D - 0.15, false);
    m.scope("shields", () => {
      // 30 round shields: nine on each main face, six on each side
      const AW = W - 0.25;
      const AD = D - 0.25;
      for (const F of [faceOf([0, 0, AD], [0, 0, 1]), faceOf([0, 0, -AD], [0, 0, -1])]) {
        for (let i = 0; i < 9; i++) shield(m, F, -19.6 + i * 4.9, 44.6, 1.15, 0.2);
      }
      for (const F of [faceOf([AW, 0, 0], [1, 0, 0]), faceOf([-AW, 0, 0], [-1, 0, 0])]) {
        for (let i = 0; i < 6; i++) shield(m, F, -8.75 + i * 3.5, 44.6, 1.15, 0.2);
      }
    });
    m.scope("attic cornice", () => {
      span(m, "stoneShade", -W + 0.05, W - 0.05, 47.4, 48.2, -D + 0.05, D - 0.05, false);
      cube(m, "stone", -W - 0.35, W + 0.35, 48.2, 49.2, -D - 0.35, D + 0.35, false);
      m.cap("terrace", rect(2 * W + 0.7, 2 * D + 0.7), 49.2);
    });
    m.scope("roof terrace parapet", () => {
      const o = W + 0.25;
      const p = D + 0.25;
      const t = 0.35;
      span(m, "stone", -o, o, 49.2, Y_TOP, p - t, p);
      span(m, "stone", -o, o, 49.2, Y_TOP, -p, -p + t);
      span(m, "stone", o - t, o, 49.2, Y_TOP, -p + t, p - t);
      span(m, "stone", -o, -o + t, 49.2, Y_TOP, -p + t, p - t);
      // the stair and lift house in the middle of the terrace
      span(m, "stoneShade", -2.6, 2.6, 49.2, 49.95, -1.8, 1.8);
    });
  });

  m.scope("tomb of the unknown soldier", () => {
    cube(m, "granite", -0.9, 0.9, 0, 0.12, -1.4, 1.4);
    span(m, "bronze", -0.3, 0.3, 0.12, 0.2, 0.6, 1.1); // the flame of remembrance
  });

  return m;
}

// --- the low level of detail ------------------------------------------------------------

/** The distant silhouette: the piers with both arches open, the entablature, the attic and the four groups. */
export function arcDeTriompheLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  for (const s of [-1, 1]) {
    const x = s * PIER_C;
    const w = W - MAIN_A;
    for (const z of [-1, 1]) {
      lodBox(m, "weathered", x, z * (D + TR_A) / 2, w + 0.6, D - TR_A + 0.6, 0, 2.0);
      lodBox(m, "stone", x, z * (D + TR_A) / 2, w, D - TR_A, 2.0, TR_YS + TR_A);
    }
    lodBox(m, "stone", x, 0, w, 2 * D, TR_YS + TR_A, Y_ARCH);
  }
  // the spandrels over the main arch: three trapezoids a side, swept through the depth
  const n = 3;
  for (let i = 0; i < 2 * n; i++) {
    const t0 = (i / (2 * n)) * Math.PI;
    const t1 = ((i + 1) / (2 * n)) * Math.PI;
    const x0 = MAIN_A * Math.cos(t0);
    const x1 = MAIN_A * Math.cos(t1);
    const sec: Array<[number, number]> = [
      [x0, MAIN_YS + MAIN_A * Math.sin(t0)],
      [x1, MAIN_YS + MAIN_A * Math.sin(t1)],
      [x1, Y_ARCH],
      [x0, Y_ARCH],
    ];
    m.sweep("stone", "z", sec, -D, sec, D);
  }
  lodBox(m, "stone", 0, 0, 2 * W + 0.3, 2 * D + 0.3, Y_ARCH, 31.6);
  lodBox(m, "stoneShade", 0, 0, 2 * W + 0.1, 2 * D + 0.1, 31.6, 35.4);
  lodBox(m, "stone", 0, 0, 2 * W + 1.8, 2 * D + 1.8, 35.4, 37.75);
  lodBox(m, "stone", 0, 0, 2 * W - 0.5, 2 * D - 0.5, 37.75, 48.2);
  lodBox(m, "stoneShade", 0, 0, 2 * W + 0.7, 2 * D + 0.7, 48.2, Y_TOP);
  for (const z of [-1, 1]) {
    for (const s of [-1, 1]) {
      lodBox(m, "weathered", s * PIER_C, z * (D + 1.4), 8.9, 2.8, 0, 4.8);
      lodBox(m, "relief", s * PIER_C, z * (D + 1.1), 7.6, 2.2, 4.8, 15.6);
    }
  }
  return m;
}

export const ARC_DE_TRIOMPHE: ProceduralDesign[] = [
  {
    id: "bld-arc-de-triomphe",
    game: { plaza: { cities: ["city"], layouts: ["radial"], round: true } },
    title: "Arc de Triomphe",
    build: arcDeTriomphe,
    buildLod: arcDeTriompheLod,
    references: "arc-de-triomphe",
    catalog: PLAZA_CATALOG,
  },
];
