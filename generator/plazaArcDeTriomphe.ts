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
function fslab(m: MeshBuilder, mat: string, F: Face, pts: Array<[number, number]>, front: number, back: number): void {
  m.slab(mat, pts.map(([u, y]) => fp(F, u, y, front)), mul(F.N, back - front));
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
  const ring = (r0: number, r1: number, front: number, mat: string, back: number): void => {
    for (let i = 0; i < segs; i++) {
      const t0 = (i / segs) * Math.PI;
      const t1 = ((i + 1) / segs) * Math.PI;
      const pt = (r: number, t: number): [number, number] => [r * Math.cos(t), ys + r * Math.sin(t)];
      fslab(m, mat, F, [pt(r0, t0), pt(r1, t0), pt(r1, t1), pt(r0, t1)], front, back);
    }
  };
  ring(a + 0.03, a + width, proud, "stone", -0.06);
  ring(a + width, a + width + 0.22, proud + 0.14, "stoneShade", -0.09);
}

// --- figures ----------------------------------------------------------------------------

/**
 * A sculpted figure on a face, all in face coordinates: feet at (u, y), body at
 * d out of the wall, h tall. `lean` moves the shoulders across (in h), the arms
 * end at shoulder + arm * h (u, y, d), `spread` sets the stance; a helmet adds a
 * crest, a cloak a drape behind the back.
 */
interface Pose {
  u: number;
  y: number;
  d: number;
  h: number;
  lean?: number;
  armL?: [number, number, number];
  armR?: [number, number, number];
  spread?: number;
  helmet?: boolean;
  cloak?: boolean;
  kneel?: boolean;
}

function figure(m: MeshBuilder, mat: string, F: Face, p: Pose): void {
  const h = p.h;
  const lean = (p.lean ?? 0) * h;
  const P = (u: number, y: number, d: number): Vec3 => fp(F, u, y, d);
  const hipY = p.y + (p.kneel ? 0.3 : 0.48) * h;
  const hip = P(p.u, hipY, p.d);
  const neck = P(p.u + lean, hipY + 0.34 * h, p.d + 0.02 * h);
  m.scope("body", () => beam(m, mat, hip, neck, 0.31 * h, 0.2 * h, F.N));
  m.scope("legs", () => {
    const sp = p.spread ?? 0.11;
    for (const s of [-1, 1]) {
      const top = P(p.u + s * 0.065 * h, hipY + 0.03 * h, p.d);
      if (p.kneel && s < 0) {
        const knee = P(p.u - 0.2 * h, p.y + 0.06 * h, p.d + 0.05 * h);
        m.rod(mat, top, knee, 0.06 * h, 6);
        m.rod(mat, knee, P(p.u - 0.42 * h, p.y + 0.03 * h, p.d - 0.02 * h), 0.05 * h, 6);
      } else {
        m.rod(mat, top, P(p.u + s * sp * h, p.y - 0.02 * h, p.d + 0.02 * h), 0.07 * h, 6);
      }
    }
  });
  m.scope("arms", () => {
    for (const s of [-1, 1]) {
      const sh = P(p.u + lean + s * 0.13 * h, hipY + 0.3 * h, p.d + 0.02 * h);
      const arm = (s < 0 ? p.armL : p.armR) ?? [s * 0.1, -0.36, 0.04];
      const end = add(sh, add(add(mul(F.U, arm[0] * h), [0, arm[1] * h, 0]), mul(F.N, arm[2] * h)));
      m.rod(mat, sh, end, 0.05 * h, 5);
    }
  });
  m.scope("head", () => {
    const c = add(neck, [0, 0.09 * h, 0]);
    blob(m, mat, c, 0.068 * h, 0.085 * h, 0.075 * h, 6);
    if (p.helmet) beam(m, mat, add(c, [0, 0.06 * h, -0.02 * h]), add(c, [0, 0.14 * h, 0.03 * h]), 0.03 * h, 0.12 * h, F.N);
  });
  if (p.cloak) {
    m.scope("cloak", () => {
      const back = p.d - 0.1 * h;
      fslab(m, mat, F, [[p.u + lean - 0.16 * h, hipY + 0.32 * h], [p.u + lean + 0.16 * h, hipY + 0.32 * h], [p.u + 0.26 * h, p.y + 0.12 * h], [p.u - 0.3 * h, p.y + 0.12 * h]], back + 0.08 * h, back);
    });
  }
}

/** Spread wings behind a figure at shoulder (u, y), d0..d1 deep: two convex feathered slabs. */
function wings(m: MeshBuilder, mat: string, F: Face, u: number, y: number, span2: number, d0: number, d1: number): void {
  for (const s of [-1, 1]) {
    fslab(m, mat, F, [
      [u + s * 0.25, y + 0.1],
      [u + s * span2 * 0.55, y + span2 * 0.62],
      [u + s * span2, y + span2 * 0.5],
      [u + s * span2 * 0.85, y + span2 * 0.05],
      [u + s * 0.6, y - span2 * 0.45],
    ], d1, d0);
  }
}

/** A round shield standing out of a face: a 12-gon disc and its boss. */
function shield(m: MeshBuilder, F: Face, u: number, y: number, r: number, front: number, mat = "stone"): void {
  const ring = (n: number, rr: number): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push([u + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    return out;
  };
  fslab(m, "stoneShade", F, ring(12, r), front, -0.06);
  fslab(m, mat, F, ring(12, r * 0.78), front + 0.1, front - 0.04);
  fslab(m, "stoneShade", F, ring(6, r * 0.3), front + 0.22, front + 0.05);
}

// --- the sculpture groups ---------------------------------------------------------------

/**
 * One of the four groups on the pier fronts, standing on its pedestal at
 * u = uc on face F. `kind` picks the composition: 0 Le Depart (the winged
 * Marseillaise over the volunteers), 1 Le Triomphe (the Emperor crowned by
 * Victory, Fame above), 2 La Resistance (the defender, the fallen horseman), 3
 * La Paix (the warrior sheathing his sword, Minerva above).
 */
function sculptureGroup(m: MeshBuilder, F: Face, uc: number, kind: number): void {
  const s = uc > 0 ? 1 : -1; // the side of the pier facing out, for mirrored poses
  const R = "relief";
  const yP = 5.2; // the pedestal top
  m.scope("pedestal", () => {
    fbox(m, "weathered", F, uc - 4.6, uc + 4.6, 0, 1.0, -0.2, 2.95);
    fbox(m, "stone", F, uc - 4.35, uc + 4.35, 1.0, 4.7, -0.2, 2.7);
    fbox(m, "stoneShade", F, uc - 4.55, uc + 4.55, 4.7, yP, -0.2, 2.9, true);
    fbox(m, "stoneShade", F, uc - 3.2, uc + 3.2, 2.1, 3.7, 2.7, 2.78); // the inscription tablet
  });
  m.scope("backing", () => {
    // the rock and drapery the group is carved against
    fslab(m, R, F, [[uc - 4.1, yP], [uc + 4.1, yP], [uc + 4.0, 12.2], [uc + 2.8, 16.6], [uc - 2.8, 16.6], [uc - 4.0, 12.2]], 0.8, -0.05);
    fslab(m, R, F, [[uc - 3.6, yP], [uc + 3.6, yP], [uc + 3.4, 8.6], [uc - 3.4, 8.6]], 1.25, 0.6);
  });
  m.scope("upper figure", () => {
    const gu = uc + s * 0.3;
    if (kind === 3) {
      // Minerva standing above, helmeted, with her shield
      figure(m, R, F, { u: gu, y: 12.0, d: 1.35, h: 6.2, lean: -0.04 * s, armR: [0.25 * s, 0.05, 0.25], armL: [-0.28 * s, -0.12, 0.2], helmet: true, cloak: true });
      shield(m, F, gu - 2.1 * s, 14.6, 1.2, 1.75, R);
    } else {
      // a winged genius flying out of the wall, arms flung forward
      const big = kind === 0 ? 1 : 0.88;
      figure(m, R, F, {
        u: gu, y: 11.6, d: 1.5, h: 6.4 * big, lean: 0.12 * s,
        armR: [0.42 * s, 0.24, 0.3], armL: [-0.36 * s, 0.3, 0.2], spread: 0.22, helmet: kind === 0, cloak: true,
      });
      wings(m, R, F, gu + 0.12 * s, 11.6 + 4.2 * big, 3.9 * big, 0.7, 1.45);
      if (kind === 1) m.rod(R, fp(F, gu + 2.1 * s, 17.2, 2.1), fp(F, gu + 3.7 * s, 18.4, 2.5), 0.2, 6); // Fame's trumpet
    }
  });
  m.scope("lower figures", () => {
    // the central hero, then his companions either side and one behind
    const heroArm: [number, number, number] = kind === 0 ? [0.12 * s, 0.5, 0.1] : kind === 1 ? [0.2 * s, -0.25, 0.15] : kind === 2 ? [0.3 * s, 0.32, 0.25] : [0.05 * s, -0.42, 0.1];
    const hh = 7.6;
    figure(m, R, F, { u: uc + 0.3 * s, y: yP, d: 1.85, h: hh, lean: 0.03 * s, armR: heroArm, armL: [-0.22 * s, -0.2, 0.25], helmet: kind !== 1, cloak: true, spread: 0.13 });
    if (kind === 0) m.rod(R, fp(F, uc + 1.2 * s, yP + hh * 0.82 + 3.5, 2.0), fp(F, uc + 1.1 * s, yP + hh * 0.82 + 4.4, 2.05), 0.3, 6); // the raised helmet
    if (kind === 1) {
      // the Victory crowning the Emperor, hovering over his shoulder
      figure(m, R, F, { u: uc - 1.7 * s, y: 9.8, d: 2.0, h: 4.4, lean: 0.12 * s, armR: [0.4 * s, 0.3, 0.1], armL: [0.2 * s, 0.38, 0.15], cloak: true });
      wings(m, R, F, uc - 1.6 * s, 13.3, 2.3, 1.3, 1.8);
    }
    figure(m, R, F, { u: uc - 2.0 * s, y: yP, d: 1.1, h: 6.8, lean: -0.05 * s, armR: [0.18 * s, 0.38, 0.12], helmet: true, cloak: true });
    figure(m, R, F, { u: uc - 2.7 * s, y: yP, d: 1.75, h: 6.2, lean: -0.08 * s, armR: [0.3 * s, 0.1, 0.25], armL: [-0.2 * s, 0.35, 0.1], helmet: kind === 2, kneel: kind === 3, cloak: true });
    shield(m, F, uc - 3.3 * s, 8.4, 1.0, 2.55, R);
    if (kind === 2) {
      // the fallen horseman and his horse across the foot of the group
      beam(m, R, fp(F, uc - 3.6, yP + 0.7, 2.3), fp(F, uc + 3.6, yP + 1.2, 2.3), 1.3, 1.2, F.N);
      blob(m, R, fp(F, uc + 3.2 * s, yP + 2.0, 2.2), 0.8, 0.65, 0.6);
      figure(m, R, F, { u: uc + 2.8 * s, y: yP, d: 1.6, h: 5.4, lean: 0.1 * s, armR: [0.05 * s, 0.42, 0.1], kneel: true });
    } else {
      figure(m, R, F, { u: uc + 2.9 * s, y: yP, d: 1.55, h: kind === 3 ? 5.6 : 4.6, lean: 0.05 * s, armR: [0.25 * s, 0.3, 0.2], kneel: kind === 0, cloak: kind === 3 });
    }
    if (kind === 3) beam(m, R, fp(F, uc + 1.5 * s, yP + 2.6, 2.4), fp(F, uc + 1.0 * s, yP + 5.6, 2.5), 0.18, 0.18, F.N); // the sword going into its sheath
  });
}

// --- the high-relief panels and the frieze ----------------------------------------------

/**
 * A framed high-relief panel u0..u1 x y0..y1 on face F: its frame, the sunk
 * ground and a battle or funeral scene of `n` figures (seed varies the poses).
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
    const h = (y1 - y0) * 0.72;
    const step = (u1 - u0 - 1.6) / (n - 1);
    for (let k = 0; k < n; k++) {
      const q = (k * 7 + seed * 3) % 5; // a fixed spread of poses
      const u = u0 + 0.8 + k * step;
      const tall = q === 3 ? 0.82 : 1;
      const lean = [0.1, -0.08, 0.04, 0.14, -0.12][q]!;
      const armR: [number, number, number] = [[0.3, 0.3, 0.1], [0.2, -0.3, 0.1], [0.12, 0.45, 0.05], [0.38, 0.05, 0.1], [-0.1, 0.4, 0.1]][q] as [number, number, number];
      figure(m, "relief", F, { u, y: y0 + 0.34, d: 0.12 + 0.17 * h * tall * 0.55, h: h * tall, lean, armR, armL: [-0.25, 0.1 * (q - 2), 0.08], helmet: q % 2 === 0, kneel: q === 3, spread: 0.14 });
    }
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

/** A winged Victory lying in a spandrel of the main arch, on face F, on the u > 0 side when s = 1. */
function spandrelVictory(m: MeshBuilder, F: Face, s: number): void {
  const R = "relief";
  const P = (u: number, y: number, d: number): Vec3 => fp(F, s * u, y, d);
  // a body reclined along the arch's back, from the feet low on the pier to the head near the crown
  beam(m, R, P(8.7, 24.0, 0.34), P(4.4, 28.75, 0.36), 1.05, 0.6, F.N);
  blob(m, R, P(3.85, 29.3, 0.36), 0.42, 0.42, 0.36, 6);
  fslab(m, R, F, [[s * 5.0, 28.3], [s * 6.0, 30.2], [s * 7.9, 30.25], [s * 8.3, 28.1]], 0.36, -0.05);
  m.rod(R, P(4.5, 28.6, 0.55), P(1.9, 29.4, 0.7), 0.2, 6);
  blob(m, R, P(1.7, 29.45, 0.72), 0.32, 0.32, 0.2, 6);
  beam(m, R, P(9.3, 23.3, 0.3), P(8.3, 25.4, 0.3), 1.1, 0.42, F.N); // the drapery at her feet
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
      frieze(m, faceOf([0, 0, fz], [0, 0, 1]), -fx + 0.7, fx - 0.7, 31.75, 35.25, 1.45);
      frieze(m, faceOf([0, 0, -fz], [0, 0, -1]), -fx + 0.7, fx - 0.7, 31.75, 35.25, 1.45);
      frieze(m, faceOf([fx, 0, 0], [1, 0, 0]), -fz + 0.7, fz - 0.7, 31.75, 35.25, 1.45);
      frieze(m, faceOf([-fx, 0, 0], [-1, 0, 0]), -fz + 0.7, fz - 0.7, 31.75, 35.25, 1.45);
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
