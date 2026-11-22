// The Gateway of India (Mumbai, Apollo Bunder, 1924; George Wittet), a plaza landmark
// the game may stand on a city's rectangular main square. See
// docs/models/plaza-landmarks.md.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. The long axis runs
// along X (38 m between the wings' end faces, 42 m over the plinth), the depth along Z;
// the central arch passes along Z, its city face looks +Z (the main view) and its sea
// face -Z. Overall 26 m high to the turrets' finials, as published. The rest is
// measured on the photographs in assets/gateway-of-india/ (see its SOURCES.md): the
// central block 17.8 m wide and 22 m deep, its pointed arch 8.4 m wide and 12 m high
// to the crown, the domed hall behind it 13 m square, the wings 16 m high.
//
// What it carries: the plinth; the central block with its open pointed arch (a real
// passage along Z, the soffit a pointed barrel vault), the square hall inside with its
// pendentives and dome, and the pointed side arches into the two wing halls; the
// piers' stepped pedestals with their little chhatri pinnacles, the pilasters, the
// moulded archivolt and the spandrel roundels; the deep row of corbels under the
// central chhajja (the sloping stone eave); the attic with the framed inscription
// panel, the crenellated parapet and the four corner turrets (square piers, an
// octagonal drum with jali windows, a broad eave and a stepped, ribbed dome with its
// bulb and finial); the two wings with their recessed bays - a pointed lunette filled
// with a jali (a stone lattice standing in a real recess) over a pointed door that
// opens into the wing's hall - on the front, back and end faces, the string courses,
// the corbelled chhajja, the frieze of jali relief panels and the parapet.
//
// Deterministic: the same code gives the same bytes. The id is what the game's saved
// maps store, so the design is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#c4a272", roughness: 0.9 },
  stoneLight: { color: "#d5b98a", roughness: 0.88 },
  stoneShade: { color: "#a6865b", roughness: 0.92 },
  carving: { color: "#8e714b", roughness: 0.95 },
  deep: { color: "#7a7265", roughness: 0.95 },
  vault: { color: "#cdb78f", roughness: 0.9 },
  jaliBack: { color: "#2f2a24", roughness: 1 },
  roof: { color: "#a48d69", roughness: 0.92 },
};

// --- the measured datums --------------------------------------------------------------

/** The plinth's top: every wall stands on it, and it is the floor of the passages. */
const P = 0.45;
/** The central block: half width and half depth. */
const XC = 8.9;
const ZC = 11.0;
/** The square hall inside it: half side. */
const HX = 6.5;
/** The central arch: half span, springing and rise of its pointed head (12 m to the crown). */
const ARCH = { a: 4.2, ys: 6.2, h: 5.8 };
/** The side arches from the hall into the wing halls. */
const SIDE_ARCH = { a: 2.4, ys: 4.4, h: 3.2 };
/** Top of the central block's arch face, where the corbel band begins. */
const YCP = 12.9;
/** Top of the hall's walls, where the pendentives begin. */
const YHALL = 12.2;
/** The wings: end faces at x = +-XW, faces at z = +-ZW; the hall inside them. */
const XW = 19.0;
const ZW = 9.6;
const WALL = 1.2;
const WING_HALL_X0 = 10.0;
const WING_CEIL = 9.4;
/** The wings' corbel band starts here (top of the faces). */
const YW = 10.0;
/** The bays: half width, top, recess depth; door and lunette inside. */
const BAY_HALF = 2.6;
const BAY_TOP = 9.4;
const BAY_RECESS = 0.45;
const DOOR = { a: 1.05, ys: 2.75, h: 1.25 };
const LUNETTE = { a: 1.9, sill: 5.7, ys: 6.3, h: 2.3 };
const LUNETTE_DEPTH = 0.4;
/** The turrets: centres of the four corner piers. */
const TX = 6.9;
const TZ = 9.5;
/** The finial's tip: the overall height. */
const Y_TOP = 26.0;

// --- vector helpers -------------------------------------------------------------------

type P2 = [number, number];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

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

/** A closed box spanning x0..x1, y0..y1, z0..z1 (with its underside). */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/** A box given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** The quads between two closed rings (equal length) at their heights, facing up or down. */
function ringBand(m: MeshBuilder, mat: string, A: Ring, ya: number, B: Ring, yb: number, up: boolean): void {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    oquad(m, mat, [A[i]![0], ya, A[i]![1]], [A[j]![0], ya, A[j]![1]], [B[j]![0], yb, B[j]![1]], [B[i]![0], yb, B[i]![1]], [0, up ? 1 : -1, 0]);
  }
}

/** A rectangle ring by its spans. */
const box2 = (x0: number, x1: number, z0: number, z1: number): Ring => rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);

/**
 * A chhajja, the thin sloping stone eave: the wall line `inner` (the top edge at yTop,
 * the soffit meeting the wall at yWall), the drip edge `outer` from yEdge0 to yEdge1.
 */
function chhajja(m: MeshBuilder, mat: string, inner: Ring, outer: Ring, yWall: number, yTop: number, yEdge0: number, yEdge1: number): void {
  ringBand(m, mat, outer, yEdge1, inner, yTop, true);
  m.prism(mat, outer, yEdge0, yEdge1, false);
  ringBand(m, mat, outer, yEdge0, inner, yWall, false);
}

// --- faces: a vertical wall plane with its own across axis -----------------------------

/**
 * A vertical face: its origin `o` (u = 0, y = 0), the outward normal N (horizontal) and
 * the across axis U = Y x N. Points are (u, y, d), d the distance out of the face.
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

/** A box on an axis-aligned face: u0..u1 across, y0..y1, d0..d1 out of the face. */
function fbox(m: MeshBuilder, mat: string, F: Face, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, closed = false, top = true): void {
  const a = fp(F, u0, 0, d0);
  const b = fp(F, u1, 0, d1);
  const x0 = Math.min(a[0], b[0]);
  const x1 = Math.max(a[0], b[0]);
  const z0 = Math.min(a[2], b[2]);
  const z1 = Math.max(a[2], b[2]);
  if (closed) cube(m, mat, x0, x1, y0, y1, z0, z1, top);
  else span(m, mat, x0, x1, y0, y1, z0, z1, top);
}

/** A flat convex outline (u, y) on a face at d = front, extruded back to d = back. */
function fslab(m: MeshBuilder, mat: string, F: Face, pts: P2[], front: number, back: number): void {
  m.slab(mat, pts.map(([u, y]) => fp(F, u, y, front)), mul(F.N, back - front));
}

/** A side profile (d, y) at u, extruded across the face by w (a corbel, a bracket). */
function fprofile(m: MeshBuilder, mat: string, F: Face, u: number, w: number, prof: P2[]): void {
  m.slab(mat, prof.map(([d, y]) => fp(F, u - w / 2, y, d)), mul(F.U, w));
}

// --- pointed arches --------------------------------------------------------------------

interface Arch {
  a: number;
  ys: number;
  h: number;
}

/** The two-centred arc: centre offset c (the right half's centre at u = -c) and radius R. */
function arcOf(a: number, h: number): { c: number; R: number } {
  const c = (h * h - a * a) / (2 * a);
  return { c, R: a + c };
}

/** The right half of a pointed arc of radius R + w, springing to crown, n + 1 points (u, v from the springing). */
function halfArc(A: Arch, w: number, n: number): P2[] {
  const { c, R } = arcOf(A.a, A.h);
  const r = R + w;
  const tm = Math.acos(Math.max(-1, Math.min(1, c / r)));
  const out: P2[] = [];
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * tm;
    out.push([k === n ? 0 : -c + r * Math.cos(t), r * Math.sin(t)]);
  }
  return out;
}

/** The pointed arch's height above the springing at u (for |u| <= a). */
function archRise(A: Arch, u: number): number {
  const { c, R } = arcOf(A.a, A.h);
  const x = Math.abs(u) + c;
  return Math.sqrt(Math.max(0, R * R - x * x));
}

/** A pointed-arch opening centred on uc, open down to v0: a counter-clockwise outline (u, v). */
function archHole(uc: number, A: Arch, v0: number, n: number): P2[] {
  const half = halfArc(A, 0, n);
  const out: P2[] = [];
  out.push([uc + A.a, v0]);
  for (const [u, v] of half) out.push([uc + u, A.ys + v]);
  for (let k = n - 1; k >= 0; k--) out.push([uc - half[k]![0], A.ys + half[k]![1]]);
  out.push([uc - A.a, v0]);
  // drop a springing point that repeats the bottom corner
  return out.filter((p, i) => {
    const q = out[(i + out.length - 1) % out.length]!;
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-9;
  });
}

const rectHole = (u0: number, u1: number, v0: number, v1: number): P2[] => [[u1, v0], [u1, v1], [u0, v1], [u0, v0]];

function centroid(pts: P2[]): P2 {
  let u = 0;
  let v = 0;
  for (const p of pts) {
    u += p[0];
    v += p[1];
  }
  return [u / pts.length, v / pts.length];
}

/**
 * A flat wall u0..u1 x v0..v1 on face F at depth d, pierced by one star-shaped hole
 * (counter-clockwise in u, v). Each hole edge is joined to the stretch of the boundary
 * it sees from the hole's centre. `flip` turns the wall to look against F.N (an inner face).
 */
function wall(m: MeshBuilder, mat: string, F: Face, u0: number, u1: number, v0: number, v1: number, d: number, hole: P2[] | null, flip = false): void {
  const n = flip ? mul(F.N, -1) : F.N;
  const P3 = (p: P2): Vec3 => fp(F, p[0], p[1], d);
  if (!hole) {
    oquad(m, mat, P3([u0, v0]), P3([u1, v0]), P3([u1, v1]), P3([u0, v1]), n);
    return;
  }
  const W = u1 - u0;
  const H = v1 - v0;
  const per = 2 * W + 2 * H;
  const eps = 1e-7;
  const sOf = (p: P2): number => {
    if (Math.abs(p[1] - v0) < eps) return p[0] - u0;
    if (Math.abs(p[0] - u1) < eps) return W + (p[1] - v0);
    if (Math.abs(p[1] - v1) < eps) return W + H + (u1 - p[0]);
    return 2 * W + H + (v1 - p[1]);
  };
  const c = centroid(hole);
  const exit = (p: P2): P2 => {
    const du = p[0] - c[0];
    const dv = p[1] - c[1];
    let t = Infinity;
    if (du > 1e-12) t = Math.min(t, (u1 - c[0]) / du);
    if (du < -1e-12) t = Math.min(t, (u0 - c[0]) / du);
    if (dv > 1e-12) t = Math.min(t, (v1 - c[1]) / dv);
    if (dv < -1e-12) t = Math.min(t, (v0 - c[1]) / dv);
    const q: P2 = [c[0] + du * t, c[1] + dv * t];
    // snap onto the boundary
    const snap = (x: number, a: number, b: number): number => (Math.abs(x - a) < 1e-6 ? a : Math.abs(x - b) < 1e-6 ? b : x);
    return [snap(q[0], u0, u1), snap(q[1], v0, v1)];
  };
  const corners: Array<{ p: P2; s: number }> = [
    { p: [u0, v0], s: 0 },
    { p: [u1, v0], s: W },
    { p: [u1, v1], s: W + H },
    { p: [u0, v1], s: 2 * W + H },
  ];
  const bs = hole.map(exit);
  const ss = bs.map(sOf);
  for (let i = 0; i < hole.length; i++) {
    const j = (i + 1) % hole.length;
    const pi = hole[i]!;
    const pj = hole[j]!;
    const ds = (ss[j]! - ss[i]! + per) % per;
    const mids = corners
      .map((k) => ({ p: k.p, t: (k.s - ss[i]! + per) % per }))
      .filter((k) => k.t > 1e-6 && k.t < ds - 1e-6)
      .sort((x, y) => y.t - x.t)
      .map((k) => k.p);
    const chain: P2[] = [bs[j]!, ...mids, bs[i]!];
    otri(m, mat, P3(pi), P3(pj), P3(bs[j]!), n);
    for (let k = 0; k + 1 < chain.length; k++) otri(m, mat, P3(pi), P3(chain[k]!), P3(chain[k + 1]!), n);
  }
}

/** The reveal of a hole through face F from depth dA to dB, facing the hole's centre; edges on the floor `skipV` are left open. */
function reveal(m: MeshBuilder, mat: string, F: Face, hole: P2[], dA: number, dB: number, skipV: number | null = null): void {
  const c = centroid(hole);
  for (let i = 0; i < hole.length; i++) {
    const p = hole[i]!;
    const q = hole[(i + 1) % hole.length]!;
    if (skipV !== null && Math.abs(p[1] - skipV) < 1e-7 && Math.abs(q[1] - skipV) < 1e-7) continue;
    const eu = q[0] - p[0];
    const ev = q[1] - p[1];
    let nu = -ev;
    let nv = eu;
    const mu = (p[0] + q[0]) / 2;
    const mv = (p[1] + q[1]) / 2;
    if (nu * (c[0] - mu) + nv * (c[1] - mv) < 0) {
      nu = -nu;
      nv = -nv;
    }
    const n = add(mul(F.U, nu), [0, nv, 0]);
    oquad(m, mat, fp(F, p[0], p[1], dA), fp(F, q[0], q[1], dA), fp(F, q[0], q[1], dB), fp(F, p[0], p[1], dB), n);
  }
}

/** A flat plate filling a convex outline on face F at depth d, looking out of the face. */
function plate(m: MeshBuilder, mat: string, F: Face, pts: P2[], d: number): void {
  const c = centroid(pts);
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    otri(m, mat, fp(F, c[0], c[1], d), fp(F, pts[i]![0], pts[i]![1], d), fp(F, pts[j]![0], pts[j]![1], d), F.N);
  }
}

/** A moulded pointed ring round an arch on a face, w wide, from the springing to the crown, d0..d1 out. */
function archRing(m: MeshBuilder, mat: string, F: Face, uc: number, A: Arch, w0: number, w1: number, d0: number, d1: number, n: number): void {
  const inner = halfArc(A, w0, n);
  const outer = halfArc(A, w1, n);
  for (const s of [-1, 1]) {
    for (let k = 0; k < n; k++) {
      const q: P2[] = [
        [uc + s * inner[k]![0], A.ys + inner[k]![1]],
        [uc + s * outer[k]![0], A.ys + outer[k]![1]],
        [uc + s * outer[k + 1]![0], A.ys + outer[k + 1]![1]],
        [uc + s * inner[k + 1]![0], A.ys + inner[k + 1]![1]],
      ];
      fslab(m, mat, F, q, d1, d0);
    }
  }
}

/** A round boss (a roundel) on a face. */
function roundel(m: MeshBuilder, mat: string, F: Face, u: number, v: number, r: number, d0: number, d1: number): void {
  const pts: P2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    pts.push([u + r * Math.cos(a), v + r * Math.sin(a)]);
  }
  fslab(m, mat, F, pts, d1, d0);
  const inner = pts.map(([pu, pv]): P2 => [u + (pu - u) * 0.55, v + (pv - v) * 0.55]);
  fslab(m, "stoneLight", F, inner, d1 + 0.05, d1 - 0.02);
}

// --- jali ------------------------------------------------------------------------------

/**
 * A jali screen in a pointed lunette on face F: the lattice of crossed stone bars
 * standing in the recess between d = dFront and the dark back at dBack. Vertical bars
 * and horizontal bars sit at different depths so no faces coincide.
 */
function jaliLattice(m: MeshBuilder, F: Face, uc: number, A: Arch, sill: number, dFront: number, dBack: number, pitch: number): void {
  const t = 0.07;
  const span2 = dFront - dBack;
  const vd0 = dBack + span2 * 0.25;
  const vd1 = dBack + span2 * 0.6;
  const hd0 = dBack + span2 * 0.3;
  const hd1 = dBack + span2 * 0.55;
  const nv = Math.floor((A.a - 0.1) / pitch);
  for (let k = -nv; k <= nv; k++) {
    const u = uc + k * pitch;
    const top = A.ys + archRise(A, Math.abs(k * pitch) - t / 2) + 0.03;
    fbox(m, "carving", F, u - t / 2, u + t / 2, sill - 0.04, top, vd0, vd1, false, false);
  }
  for (let v = sill + pitch; v < A.ys + A.h - 0.15; v += pitch) {
    let half = A.a;
    if (v > A.ys) {
      // the half width of the arch at height v (bisect the rise)
      let lo = 0;
      let hi = A.a;
      for (let it = 0; it < 30; it++) {
        const mid = (lo + hi) / 2;
        if (A.ys + archRise(A, mid) > v) lo = mid;
        else hi = mid;
      }
      half = lo;
    }
    if (half < 0.12) continue;
    fbox(m, "carving", F, uc - half - 0.03, uc + half + 0.03, v - t / 2, v + t / 2, hd0, hd1, true);
  }
}

/** A relief panel of carved lattice: a plate with rows of diamonds standing on it. */
function reliefPanel(m: MeshBuilder, F: Face, u0: number, u1: number, v0: number, v1: number): void {
  fslab(m, "stoneShade", F, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], 0.06, -0.05);
  const cols = Math.max(2, Math.round((u1 - u0) / 0.56));
  const rows = Math.max(2, Math.round((v1 - v0) / 0.56));
  const du = (u1 - u0) / cols;
  const dv = (v1 - v0) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cu = u0 + (i + 0.5) * du;
      const cv = v0 + (j + 0.5) * dv;
      const ru = du * 0.42;
      const rv = dv * 0.42;
      fslab(m, "carving", F, [[cu, cv - rv], [cu + ru, cv], [cu, cv + rv], [cu - ru, cv]], 0.13, 0.03);
    }
  }
}

/** A small arched jali window on a face: the dark panel, its pointed frame, two bars. */
function smallWindow(m: MeshBuilder, F: Face, u: number, v0: number, w: number, h: number): void {
  const A: Arch = { a: w / 2, ys: v0 + h - w * 0.62, h: w * 0.62 };
  const outline = archHole(u, { a: A.a - 0.02, ys: A.ys, h: A.h - 0.01 }, v0 + 0.02, 3);
  fslab(m, "jaliBack", F, outline, 0.03, -0.03);
  archRing(m, "stoneLight", F, u, A, 0.0, 0.08, -0.03, 0.09, 3);
  fbox(m, "stoneLight", F, u - A.a - 0.08, u - A.a, v0, A.ys, -0.03, 0.09);
  fbox(m, "stoneLight", F, u + A.a, u + A.a + 0.08, v0, A.ys, -0.03, 0.09);
  fbox(m, "stoneLight", F, u - A.a - 0.08, u + A.a + 0.08, v0 - 0.08, v0, -0.03, 0.11, true);
  fbox(m, "carving", F, u - 0.025, u + 0.025, v0 - 0.02, A.ys + A.h - 0.05, 0.0, 0.06, true);
  fbox(m, "carving", F, u - A.a, u + A.a, (v0 + A.ys) / 2 - 0.025, (v0 + A.ys) / 2 + 0.025, 0.01, 0.055, true);
}

// --- the turret ------------------------------------------------------------------------

/** An octagon (flat faces on the axes) of circumradius r about (cx, cz). */
const oct = (r: number, cx: number, cz: number): Ring => ngon(8, r, Math.PI / 8, cx, cz);

/** A 16-point ribbed ring: every other point drawn in (the stone ribs of the turret dome). */
function ribbed(r: number, cx: number, cz: number): Ring {
  const out: Ring = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.9;
    out.push([cx + rr * Math.cos(a), cz - rr * Math.sin(a)]);
  }
  return out;
}

function turret(m: MeshBuilder, cx: number, cz: number, sx: number, sz: number): void {
  const yPier = 20.3;
  m.scope("pier", () => {
    span(m, "stone", cx - 1.45, cx + 1.45, 15.4, yPier - 0.4, cz - 1.45, cz + 1.45, false);
    cube(m, "stoneLight", cx - 1.6, cx + 1.6, yPier - 0.4, yPier, cz - 1.6, cz + 1.6);
    // a string course and the small arched niches on the two outer faces
    cube(m, "stoneShade", cx - 1.53, cx + 1.53, 17.0, 17.2, cz - 1.53, cz + 1.53);
    const Fz = faceOf([cx, 0, cz + sz * 1.45], [0, 0, sz]);
    const Fx = faceOf([cx + sx * 1.45, 0, cz], [sx, 0, 0]);
    for (const F of [Fz, Fx]) {
      smallWindow(m, F, -0.55, 17.4, 0.5, 1.5);
      smallWindow(m, F, 0.55, 17.4, 0.5, 1.5);
    }
  });
  m.scope("balcony", () => {
    chhajja(m, "stoneLight", oct(1.42, cx, cz), oct(1.85, cx, cz), 20.42, 20.75, yPier + 0.02, 20.47);
  });
  m.scope("drum", () => {
    const r = 1.3;
    m.prism("stone", oct(r, cx, cz), 20.5, 23.25, false);
    const ap = r * Math.cos(Math.PI / 8);
    const side = 2 * r * Math.sin(Math.PI / 8);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const N: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      const F = faceOf([cx + N[0] * ap, 0, cz + N[2] * ap], N);
      smallWindow(m, F, 0, 21.15, side * 0.52, 1.6);
      // the corner shafts
      m.rod("stoneLight", [cx + r * Math.cos(a + Math.PI / 8), 20.75, cz - r * Math.sin(a + Math.PI / 8)], [cx + r * Math.cos(a + Math.PI / 8), 23.25, cz - r * Math.sin(a + Math.PI / 8)], 0.07, 4, false);
    }
  });
  m.scope("eave", () => {
    chhajja(m, "stoneLight", oct(1.25, cx, cz), oct(1.78, cx, cz), 23.2, 23.62, 23.12, 23.28);
    m.cap("stoneLight", oct(1.25, cx, cz), 23.62);
  });
  m.scope("dome", () => {
    // five stepped, ribbed tiers rising to the bulb
    let y = 23.62;
    let r = 1.22;
    for (let k = 0; k < 5; k++) {
      const r1 = r - 0.17;
      m.prism("stone", ribbed(r, cx, cz), y, y + 0.12, false);
      m.loft("stoneLight", ribbed(r, cx, cz), y + 0.12, ribbed(r1, cx, cz), y + 0.34, false);
      y += 0.34;
      r = r1;
    }
    // the top of the last tier, the neck and the bulb
    m.cap("stone", ribbed(r, cx, cz), y);
    const prof: Array<[number, number]> = [[0.22, y], [0.22, y + 0.06], [0.34, y + 0.18], [0.36, y + 0.32], [0.26, y + 0.45], [0.1, y + 0.53]];
    for (let k = 0; k + 1 < prof.length; k++) {
      m.loft("stoneLight", ngon(10, prof[k]![0], 0, cx, cz), prof[k]![1], ngon(10, prof[k + 1]![0], 0, cx, cz), prof[k + 1]![1], false);
    }
    const yb = prof[prof.length - 1]![1];
    m.spire("carving", ngon(6, 0.1, 0, cx, cz), yb, Y_TOP);
  });
}

// --- the build -------------------------------------------------------------------------

export function gatewayOfIndia(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);

  m.scope("plinth", () => {
    m.prism("stoneShade", rect(43.4, 27.4), 0, 0.2);
    m.prism("stone", rect(42, 26), 0.2, P);
  });

  // the central block's two arch faces: +Z (city) and -Z (sea)
  const centralFaces = [faceOf([0, 0, ZC], [0, 0, 1]), faceOf([0, 0, -ZC], [0, 0, -1])];
  const archHoleC = archHole(0, ARCH, P, 10);

  m.scope("central block", () => {
    for (const F of centralFaces) {
      m.scope("arch face", () => wall(m, "stone", F, -XC, XC, P, YCP, 0, archHoleC));
      m.scope("passage vault", () => reveal(m, "deep", F, archHoleC, 0, -(ZC - HX), P));
      m.scope("hall wall", () => wall(m, "stoneShade", F, -HX, HX, P, YHALL, -(ZC - HX), archHoleC, true));
      m.scope("archivolt", () => {
        archRing(m, "stoneLight", F, 0, ARCH, 0.02, 0.4, -0.05, 0.18, 10);
        archRing(m, "stoneShade", F, 0, ARCH, 0.4, 0.6, -0.05, 0.26, 10);
        for (const s of [-1, 1]) {
          const [u0, u1] = s > 0 ? [ARCH.a + 0.02, ARCH.a + 0.35] : [-ARCH.a - 0.35, -ARCH.a - 0.02];
          fbox(m, "stoneLight", F, u0, u1, P, ARCH.ys + 0.1, -0.06, 0.18);
          roundel(m, "stoneShade", F, s * 3.6, 11.6, 0.45, -0.05, 0.12);
        }
      });
      m.scope("piers", () => {
        for (const s of [-1, 1]) {
          const u = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
          // the stepped pedestal and its cap
          fbox(m, "stoneShade", F, ...u(4.45, 8.75), P, 2.6, -0.05, 0.8, false, false);
          fbox(m, "stoneLight", F, ...u(4.35, 8.85), 2.6, 2.85, -0.04, 0.9, true);
          fbox(m, "stoneShade", F, ...u(4.6, 8.6), 0.9, 2.2, 0.75, 0.86);
          // two chhatri pinnacles on the cap
          for (const pu of [4.65, 8.55]) {
            const c = fp(F, s * pu, 0, 0.62);
            m.prism("stoneLight", ngon(6, 0.16, 0, c[0], c[2]), 2.85, 3.45, false);
            chhajja(m, "stoneLight", ngon(6, 0.16, 0, c[0], c[2]), ngon(6, 0.26, 0, c[0], c[2]), 3.45, 3.55, 3.42, 3.47);
            m.spire("stone", ngon(6, 0.16, 0, c[0], c[2]), 3.55, 3.95);
          }
          // the pilaster with its rings and capital
          fbox(m, "stone", F, ...u(4.6, 8.5), 2.85, 12.0, -0.07, 0.3, false, false);
          fbox(m, "stoneShade", F, ...u(5.0, 8.1), 3.4, 11.4, 0.25, 0.36);
          for (const y of [6.0, 9.0]) fbox(m, "stoneLight", F, ...u(4.55, 8.55), y, y + 0.25, -0.04, 0.42, true);
          fbox(m, "stoneLight", F, ...u(4.45, 8.65), 12.0, 12.4, -0.03, 0.5, true);
        }
      });
    }
    m.scope("returns", () => {
      // the short side faces of the central block in front of the wings
      for (const sx of [-1, 1]) {
        const F = faceOf([sx * XC, 0, 0], [sx, 0, 0]);
        for (const sz of [-1, 1]) {
          // u = U . (x, z): U = Y x N
          const u0 = F.U[2] * sz * ZW;
          const u1 = F.U[2] * sz * ZC;
          wall(m, "stone", F, Math.min(u0, u1), Math.max(u0, u1), P, YCP, 0, null);
        }
      }
    });
    m.scope("hall", () => {
      for (const sx of [-1, 1]) {
        const F = faceOf([sx * HX, 0, 0], [sx, 0, 0]);
        const hole = archHole(0, SIDE_ARCH, P, 8);
        wall(m, "stoneShade", F, -HX, HX, P, YHALL, 0, hole, true);
        reveal(m, "deep", F, hole, 0, WING_HALL_X0 - HX, P);
        wall(m, "stoneShade", F, -(ZW - WALL), ZW - WALL, P, WING_CEIL, WING_HALL_X0 - HX, hole);
        archRing(m, "stoneLight", faceOf([sx * HX, 0, 0], [-sx, 0, 0]), 0, SIDE_ARCH, 0.02, 0.3, -0.05, 0.1, 8);
      }
      m.scope("pendentives and dome", () => {
        const N = 32;
        const circle = ngon(N, HX);
        const square: Ring = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const c = Math.cos(a);
          const s = Math.sin(a);
          const k = HX / Math.max(Math.abs(c), Math.abs(s));
          square.push([k * c, -k * s]);
        }
        const inward = (r: Ring): Ring => [...r].reverse();
        const yRing = 13.8;
        m.loft("vault", inward(square), YHALL, inward(circle), yRing, false);
        const rows = 7;
        let prev = circle;
        let prevY = yRing;
        for (let k = 1; k <= rows; k++) {
          const phi = (k / rows) * (Math.PI / 2);
          const y = yRing + 4.6 * Math.sin(phi);
          if (k === rows) {
            const ring = inward(prev);
            for (let i = 0; i < N; i++) {
              const j = (i + 1) % N;
              otri(m, "vault", [ring[i]![0], prevY, ring[i]![1]], [ring[j]![0], prevY, ring[j]![1]], [0, y, 0], [0, -1, 0]);
            }
          } else {
            const ring = ngon(N, HX * Math.cos(phi));
            m.loft("vault", inward(prev), prevY, inward(ring), y, false);
            prev = ring;
            prevY = y;
          }
        }
        // the moulded ring at the dome's foot
        ringBand(m, "stoneLight", inward(circle), yRing, inward(ngon(N, HX - 0.25)), yRing, false);
      });
    });
    m.scope("corbel band", () => {
      m.prism("stoneShade", box2(-XC, XC, -ZC, ZC), YCP, 15.0, false);
      for (const F of centralFaces) {
        for (let k = 0; k < 12; k++) {
          const u = -8.25 + k * 1.5;
          fprofile(m, "stone", F, u, 0.4, [[-0.05, YCP], [0.22, YCP], [0.85, 14.2], [0.85, 14.95], [-0.05, 14.95]]);
          fbox(m, "carving", F, u - 0.12, u + 0.12, YCP - 0.45, YCP + 0.05, 0.03, 0.19, true);
        }
      }
      chhajja(m, "stoneLight", box2(-XC, XC, -ZC, ZC), box2(-XC - 0.9, XC + 0.9, -ZC - 0.9, ZC + 0.9), 15.0, 15.4, 14.86, 15.05);
    });
    m.scope("attic", () => {
      const AX = 8.2;
      const AZ = 10.7;
      ringBand(m, "stoneLight", box2(-XC, XC, -ZC, ZC), 15.4, box2(-AX, AX, -AZ, AZ), 15.4, true);
      m.prism("stone", box2(-AX, AX, -AZ, AZ), 15.4, 19.0, false);
      for (const sz of [-1, 1]) {
        const F = faceOf([0, 0, sz * AZ], [0, 0, sz]);
        // the framed inscription panel and its lines of lettering
        fbox(m, "stoneLight", F, -4.8, 4.8, 15.75, 15.95, -0.05, 0.14, true);
        fbox(m, "stoneLight", F, -4.8, 4.8, 18.4, 18.6, -0.05, 0.14, true);
        fbox(m, "stoneLight", F, -4.8, -4.6, 15.95, 18.4, -0.05, 0.12);
        fbox(m, "stoneLight", F, 4.6, 4.8, 15.95, 18.4, -0.05, 0.12);
        const lines: Array<[number, number]> = [[16.35, 3.9], [16.85, 4.05], [17.35, 4.0], [17.85, 3.3]];
        for (const [y, w] of lines) fbox(m, "carving", F, -w, w, y, y + 0.2, -0.05, 0.04, true);
        roundel(m, "stoneShade", faceOf([0, 0, sz * (AZ + 0.15)], [0, 0, sz]), 0, 20.15, 0.3, -0.05, 0.06);
      }
      cube(m, "stoneLight", -AX - 0.25, AX + 0.25, 19.0, 19.4, -AZ - 0.2, AZ + 0.2, false);
      m.cap("roof", box2(-AX - 0.25, AX + 0.25, -AZ - 0.2, AZ + 0.2), 19.4);
      m.scope("crenellated parapet", () => {
        for (const sz of [-1, 1]) {
          const [z0, z1] = sz > 0 ? [AZ - 0.15, AZ + 0.15] : [-AZ - 0.15, -AZ + 0.15];
          span(m, "stone", -5.5, 5.5, 19.4, 19.95, z0, z1);
          for (let k = 0; k < 15; k++) {
            const x = -4.9 + k * 0.7;
            span(m, "stone", x - 0.18, x + 0.18, 19.95, 20.4, z0 + 0.02, z1 - 0.02);
          }
        }
        for (const sx of [-1, 1]) {
          const [x0, x1] = sx > 0 ? [AX - 0.3, AX] : [-AX, -AX + 0.3];
          span(m, "stone", x0, x1, 19.4, 19.95, -8.1, 8.1);
        }
      });
    });
  });

  m.scope("turrets", () => {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) m.scope("turret", () => turret(m, sx * TX, sz * TZ, sx, sz));
    }
  });

  m.scope("wings", () => {
    for (const sx of [-1, 1]) {
      m.scope("wing", () => {
        const xIn = sx > 0 ? XC : -XW;
        const xOut = sx > 0 ? XW : -XC;
        // the faces: front (+Z), back (-Z) and the end face
        const front = faceOf([0, 0, ZW], [0, 0, 1]);
        const back = faceOf([0, 0, -ZW], [0, 0, -1]);
        const end = faceOf([sx * XW, 0, 0], [sx, 0, 0]);
        const uRange = (F: Face): [number, number] => {
          const a = F.U[0] * xIn;
          const b = F.U[0] * xOut;
          return [Math.min(a, b), Math.max(a, b)];
        };
        const bays: Array<{ F: Face; u0: number; u1: number; bays: number[] }> = [];
        for (const F of [front, back]) {
          const [u0, u1] = uRange(F);
          bays.push({ F, u0, u1, bays: [F.U[0] * sx * 12.0] });
        }
        bays.push({ F: end, u0: -ZW, u1: ZW, bays: [-4.8, 4.8] });
        const hallHalfU = (F: Face): [number, number] => {
          if (F === end) return [-(ZW - WALL), ZW - WALL];
          const a = F.U[0] * sx * WING_HALL_X0;
          const b = F.U[0] * sx * (XW - WALL);
          return [Math.min(a, b), Math.max(a, b)];
        };
        for (const { F, u0, u1, bays: centres } of bays) {
          const half = F === end ? 2.3 : BAY_HALF;
          // split the face between its bays so each piece has one hole
          const cuts = [u0];
          for (let k = 0; k + 1 < centres.length; k++) cuts.push((centres[k]! + centres[k + 1]!) / 2);
          cuts.push(u1);
          const [h0, h1] = hallHalfU(F);
          const hcuts = [h0, ...cuts.slice(1, -1), h1];
          centres.forEach((uc, k) => {
            const bay = rectHole(uc - half, uc + half, P, BAY_TOP);
            const door = archHole(uc, DOOR, P, 6);
            const lun: Arch = { a: LUNETTE.a, ys: LUNETTE.ys, h: LUNETTE.h };
            const lunHole = archHole(uc, lun, LUNETTE.sill, 8);
            m.scope("face", () => wall(m, "stone", F, cuts[k]!, cuts[k + 1]!, P, YW, 0, bay));
            m.scope("bay", () => {
              reveal(m, "stoneShade", F, bay, 0, -BAY_RECESS, P);
              wall(m, "stoneShade", F, uc - half, uc + half, P, 5.4, -BAY_RECESS, door);
              wall(m, "stoneShade", F, uc - half, uc + half, 5.4, BAY_TOP, -BAY_RECESS, lunHole);
              reveal(m, "deep", F, door, -BAY_RECESS, -WALL, P);
              reveal(m, "stoneShade", F, lunHole, -BAY_RECESS, -BAY_RECESS - LUNETTE_DEPTH);
              plate(m, "jaliBack", F, lunHole, -BAY_RECESS - LUNETTE_DEPTH);
              jaliLattice(m, F, uc, lun, LUNETTE.sill, -BAY_RECESS, -BAY_RECESS - LUNETTE_DEPTH, 0.34);
              // the frame round the bay, the hoods, roundels and the slim jali beside the door
              fbox(m, "stoneLight", F, uc - half - 0.27, uc - half - 0.02, P, BAY_TOP + 0.02, -0.03, 0.1);
              fbox(m, "stoneLight", F, uc + half + 0.02, uc + half + 0.27, P, BAY_TOP + 0.02, -0.03, 0.1);
              fbox(m, "stoneLight", F, uc - half - 0.27, uc + half + 0.27, BAY_TOP + 0.02, BAY_TOP + 0.27, -0.03, 0.12, true);
              archRing(m, "stoneLight", F, uc, lun, 0.02, 0.2, -BAY_RECESS - 0.03, -BAY_RECESS + 0.1, 8);
              archRing(m, "stoneLight", F, uc, DOOR, 0.02, 0.15, -BAY_RECESS - 0.03, -BAY_RECESS + 0.08, 6);
              fbox(m, "stoneLight", F, uc - lun.a - 0.1, uc + lun.a + 0.1, LUNETTE.sill - 0.2, LUNETTE.sill - 0.02, -BAY_RECESS - 0.03, -BAY_RECESS + 0.12, true);
              for (const s of [-1, 1]) {
                roundel(m, "stone", F, uc + s * 1.95, 8.75, 0.3, -BAY_RECESS - 0.03, -BAY_RECESS + 0.08);
                const su = uc + s * 1.6;
                fslab(m, "jaliBack", F, [[su - 0.16, 1.0], [su + 0.16, 1.0], [su + 0.16, 4.4], [su - 0.16, 4.4]], -BAY_RECESS + 0.03, -BAY_RECESS - 0.03);
                for (let v = 1.3; v < 4.3; v += 0.35) fbox(m, "carving", F, su - 0.14, su + 0.14, v, v + 0.05, -BAY_RECESS - 0.02, -BAY_RECESS + 0.06, true);
              }
            });
            m.scope("hall", () => wall(m, "deep", F, hcuts[k]!, hcuts[k + 1]!, P, WING_CEIL, -WALL, door, true));
            m.scope("frieze panel", () => reliefPanel(m, F, uc - half + 0.1, uc + half - 0.1, 12.1, 14.0));
          });
          m.scope("string courses", () => {
            // on the solid stretches between the bays
            // the end face's courses stop short of the corners, the front and back faces' run past them
            const isEnd = F === end;
            const lo = isEnd ? u0 + 0.1 : u0;
            const hi = isEnd ? u1 - 0.1 : u1;
            const endAt = F.U[0] * sx * XW; // the u of the wing's end corner on a front or back face
            const solids: Array<[number, number]> = [];
            let at = lo;
            for (const uc of centres) {
              if (uc - half - 0.27 - at > 0.3) solids.push([at, uc - half - 0.27]);
              at = uc + half + 0.27;
            }
            if (hi - at > 0.3) solids.push([at, hi]);
            const ext = (a: number, b: number, by: number): [number, number] => {
              if (isEnd) return [a, b];
              return [Math.abs(a - endAt) < 1e-6 ? a - by : a, Math.abs(b - endAt) < 1e-6 ? b + by : b];
            };
            for (const [a, b] of solids) {
              fbox(m, "stoneShade", F, ...ext(a, b, 0.15), P, 1.1, -0.05, 0.15, false);
              for (const y of [2.3, 4.95, 7.6]) fbox(m, "stoneLight", F, ...ext(a, b, 0.07), y, y + 0.15, -0.05, 0.07, true);
            }
          });
        }
        m.scope("hall ceiling", () => {
          const x0 = sx > 0 ? WING_HALL_X0 : -(XW - WALL);
          const x1 = sx > 0 ? XW - WALL : -WING_HALL_X0;
          m.cap("deep", box2(x0, x1, -(ZW - WALL), ZW - WALL), WING_CEIL, false);
        });
        m.scope("cornice and frieze", () => {
          const xi = sx > 0 ? 8.5 : -XW;
          const xo = sx > 0 ? XW : -8.5;
          const ring = box2(xi, xo, -ZW, ZW);
          m.prism("stoneShade", ring, YW, 10.95, false);
          // the corbels under the chhajja
          for (const { F, u0, u1 } of bays) {
            const a = u0 + 0.4;
            const b = u1 - 0.4;
            const n = Math.round((b - a) / 0.95);
            for (let k = 0; k <= n; k++) {
              const u = a + ((b - a) * k) / n;
              fprofile(m, "stone", F, u, 0.3, [[-0.05, YW], [0.15, YW], [0.75, 10.72], [0.75, 10.92], [-0.05, 10.92]]);
            }
          }
          const xo2 = sx > 0 ? XW + 1.0 : -8.45;
          const xi2 = sx > 0 ? 8.45 : -XW - 1.0;
          chhajja(m, "stoneLight", ring, box2(xi2, xo2, -ZW - 1.0, ZW + 1.0), 10.95, 11.35, 10.8, 10.98);
          m.prism("stone", ring, 11.35, 15.3, false);
          const band = box2(sx > 0 ? 8.45 : -XW - 0.12, sx > 0 ? XW + 0.12 : -8.45, -ZW - 0.12, ZW + 0.12);
          m.prism("stoneLight", band, 14.4, 14.6);
          m.cap("stoneLight", band, 14.4, false);
          const cop = box2(sx > 0 ? 8.5 : -XW - 0.25, sx > 0 ? XW + 0.25 : -8.5, -ZW - 0.25, ZW + 0.25);
          m.prism("stoneLight", cop, 15.3, 15.75, false);
          m.cap("stoneLight", cop, 15.3, false);
          m.cap("roof", cop, 15.75);
          // the low parapet round the wing's roof
          const xe0 = sx > 0 ? XW - 0.05 : -XW - 0.25;
          const xe1 = sx > 0 ? XW + 0.25 : -XW + 0.05;
          const xa = sx > 0 ? 8.6 : -XW - 0.25;
          const xb = sx > 0 ? XW + 0.25 : -8.6;
          span(m, "stone", xa, xb, 15.75, 16.2, ZW - 0.05, ZW + 0.25);
          span(m, "stone", xa, xb, 15.75, 16.2, -ZW - 0.25, -ZW + 0.05);
          span(m, "stone", xe0, xe1, 15.75, 16.2, -ZW + 0.1, ZW - 0.1);
        });
      });
    }
  });

  return m;
}

// --- the low level of detail -----------------------------------------------------------

/** The distant silhouette: plinth, wings, the open central arch, the attic and the four turrets. */
export function gatewayOfIndiaLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodBox(m, "stone", 0, 0, 42, 26, 0, P);
  for (const s of [-1, 1]) {
    const cx = s * (XC + XW) / 2;
    lodBox(m, "stone", cx, 0, XW - XC, 2 * ZW, P, 10.8);
    lodBox(m, "stoneLight", s * (XC + XW + 1.0) / 2, 0, XW - XC + 1.0, 2 * ZW + 2.0, 10.8, 11.35);
    lodBox(m, "stone", cx, 0, XW - XC, 2 * ZW, 11.35, 15.75);
    // the piers of the central arch
    lodBox(m, "stone", s * (ARCH.a + XC) / 2, 0, XC - ARCH.a, 2 * ZC, P, YCP);
  }
  // the spandrels over the arch: pointed sections swept through the depth
  const half = halfArc(ARCH, 0, 3);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const [u0, v0] = half[k]!;
      const [u1, v1] = half[k + 1]!;
      const sec: Array<[number, number]> = [
        [s * u0, ARCH.ys + v0],
        [s * u1, ARCH.ys + v1],
        [s * u1, YCP],
        [s * u0, YCP],
      ];
      m.sweep("stone", "z", sec, -ZC, sec, ZC);
    }
  }
  lodBox(m, "stoneShade", 0, 0, 2 * XC, 2 * ZC, YCP, 15.0);
  lodBox(m, "stoneLight", 0, 0, 2 * XC + 1.8, 2 * ZC + 1.8, 15.0, 15.4);
  lodBox(m, "stone", 0, 0, 16.4, 21.4, 15.4, 19.9);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * TX;
      const z = sz * TZ;
      lodBox(m, "stone", x, z, 2.9, 2.9, 15.4, 20.3);
      m.prism("stone", oct(1.3, x, z), 20.3, 23.3, false);
      m.prism("stoneLight", oct(1.75, x, z), 23.3, 23.6, false);
      m.cap("stoneLight", oct(1.75, x, z), 23.3, false);
      m.spire("stoneLight", oct(1.75, x, z), 23.6, 25.9);
    }
  }
  return m;
}

export const GATEWAY_OF_INDIA: ProceduralDesign[] = [
  {
    id: "bld-gateway-of-india",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Gateway of India",
    build: gatewayOfIndia,
    buildLod: gatewayOfIndiaLod,
    references: "gateway-of-india",
    catalog: PLAZA_CATALOG,
  },
];
