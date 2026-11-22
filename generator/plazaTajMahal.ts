// The Taj Mahal in Agra (1632-1653): the white marble mausoleum on its square
// plinth with the four minarets at the plinth's corners, without the mosque, the
// guest house and the gardens. A plaza landmark (docs/models/plaza-landmarks.md):
// the game may stand it on the rectangular main square of a city.
//
// What it reproduces (photos in assets/taj-mahal/, measured in px against the
// plinth's 95 m width and the 73 m height to the finial):
// - the plinth: a 95 m square marble platform 7 m high, its faces lined with a
//   band of recessed arched niches under a projecting cornice; the stair on the
//   front (+Z) cut into the plinth's middle;
// - the mausoleum: 57 m square with chamfered corners; on each face the great
//   iwan, a 14 m pointed arch recessed 6 m into the projecting pishtaq, its
//   calligraphy band (dark raised strips), the inlaid spandrels and the jali
//   window and door at its back; either side and on the chamfers two storeys of
//   arched niches 1.6 m deep in raised inlay frames; the cornice, the parapet
//   with its small finials, the crest of the pishtaqs; the sixteen pinnacles
//   (guldastas) at the pishtaqs' edges and the chamfers' corners;
// - the double dome: the drum (23.6 m across, 11.4 m above the roof) with its
//   blind arcade and mouldings; the onion bulb, which swells out over the drum
//   into an overhanging shoulder (27.9 m across 5.3 m up), closes over a full
//   body and runs up a recurved neck, with sixteen lotus petals in relief round
//   its top; the gilt finial; the four chattris round it, open kiosks of eight
//   columns under a chhajja and a small onion dome of the same character;
// - the four minarets, 40 m tall: tapering shafts in three stages with dark
//   inlay rings, three balconies on corbels with their railings, each topped by
//   an open chattri.
//
// Deviations: the iwan's back is flat (the real one is a half-octagon with a
// muqarnas half-dome); the niches are single recesses, not the paired arches of
// the real chamfers; the inlay and calligraphy are strips and plain shapes; the
// plinth stair is a single straight flight; the minarets stand plumb (the real
// ones lean slightly outward).
//
// Metres, +Y up, base at y = 0, centred on the mausoleum's axis; the iwan with
// the stair faces +Z (south). Deterministic: the same code gives the same bytes.
// The id is what the game's saved maps store, so it is never renamed once shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  marble: { color: "#f2ede3", roughness: 0.7 },
  marbleShade: { color: "#ddd5c7", roughness: 0.8 },
  plinth: { color: "#e9e2d5", roughness: 0.85 },
  inlay: { color: "#b3a690", roughness: 0.7 },
  callig: { color: "#4f463d", roughness: 0.75 },
  jali: { color: "#3a322b", roughness: 0.9 },
  gilt: { color: "#c9a14a", metallic: 0.6, roughness: 0.35 },
};

const SQ2 = Math.SQRT2;

// --- the plan ---------------------------------------------------------------------------

/** The plinth: half its side and its top. */
const PL = 47.5;
const Y_PL = 7;
/** The front stair cut into the plinth: half its width and how far it reaches in. */
const ST_HW = 4;
const ST_IN = 36.5;
/** The mausoleum: half its side, the chamfer, the roof and the parapet. */
const H = 28.5;
const C = 7.5;
const Y_ROOF = 30;
const Y_PAR = 31.3;
/** The pishtaq: half its width, how far it stands out, its top. */
const PI_HW = 10.3;
const PI_OUT = 0.7;
const Y_PI = 32.6;
/** The chamfer faces: their distance from the axis and half their length. */
const CH_D = (2 * H - C) / SQ2;
const CH_HL = C / SQ2;
/** The minarets' axes. */
const MIN_AT = 43.4;

/** Rotates a point of the local frame (x across, z outward along the axis phi = 0, +Z) to the axis phi. */
const turn = (phi: number) => ([x, y, z]: Vec3): Vec3 => [x * Math.cos(phi) + z * Math.sin(phi), y, -x * Math.sin(phi) + z * Math.cos(phi)];

/** A quad drawn as two triangles facing along n. */
function quad(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/** The surface between ring a at ya and ring b at yb (equal lengths), every face turned up or down. */
function band(m: MeshBuilder, mat: string, a: Ring, ya: number, b: Ring, yb: number, up: boolean): void {
  const pts: Vec3[] = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    pts.push([a[i]![0], ya, a[i]![1]], [a[j]![0], ya, a[j]![1]], [b[j]![0], yb, b[j]![1]]);
    pts.push([a[i]![0], ya, a[i]![1]], [b[j]![0], yb, b[j]![1]], [b[i]![0], yb, b[i]![1]]);
  }
  m.facets(mat, pts, [0, up ? 1 : -1, 0]);
}

/** A round band from y0 to y1 of radius r, its ledge under it from rIn (none when negative) and (optionally) on top to topIn. */
function ringBand(m: MeshBuilder, mat: string, n: number, r: number, y0: number, y1: number, rIn: number, topIn: number, cx = 0, cz = 0): void {
  const o = ngon(n, r, 0, cx, cz);
  m.loft(mat, o, y0, o, y1, false);
  if (rIn >= 0) band(m, mat, ngon(n, rIn, 0, cx, cz), y0, o, y0, false);
  if (topIn > 0) band(m, mat, ngon(n, topIn, 0, cx, cz), y1, o, y1, true);
}

/** The plan path offset by d (outward positive) with mitred corners; open paths end square. */
function offsetPath(pts: Ring, d: number, closed: boolean): Ring {
  const n = pts.length;
  const nrm = (i: number): [number, number] => {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  return pts.map((p, i) => {
    const prev = i > 0 ? nrm(i - 1) : closed ? nrm(n - 1) : nrm(0);
    const next = i < n - 1 || closed ? nrm(i) : nrm(n - 2);
    const mx = prev[0] + next[0];
    const mz = prev[1] + next[1];
    const ml = Math.hypot(mx, mz);
    const k = d / ((mx / ml) * next[0] + (mz / ml) * next[1]);
    return [p[0] + (mx / ml) * k, p[1] + (mz / ml) * k];
  });
}

/**
 * A moulding or thin wall along a plan path (wound like rect(), so positive
 * offsets grow outward): its outer face at offset
 * `out`, its inner face at `inn` (drawn when `inner`), the top, the underside
 * (when `under`) and, for an open path, the end caps.
 */
function pathWall(m: MeshBuilder, mat: string, pts: Ring, closed: boolean, inn: number, out: number, y0: number, y1: number, inner: boolean, under: boolean): void {
  const A = offsetPath(pts, inn, closed);
  const B = offsetPath(pts, out, closed);
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % n;
    const ex = pts[j]![0] - pts[i]![0];
    const ez = pts[j]![1] - pts[i]![1];
    const l = Math.hypot(ex, ez);
    const on: Vec3 = [-ez / l, 0, ex / l];
    const b0 = B[i]!;
    const b1 = B[j]!;
    const a0 = A[i]!;
    const a1 = A[j]!;
    quad(m, mat, [b0[0], y0, b0[1]], [b1[0], y0, b1[1]], [b1[0], y1, b1[1]], [b0[0], y1, b0[1]], on);
    if (inner) quad(m, mat, [a0[0], y0, a0[1]], [a1[0], y0, a1[1]], [a1[0], y1, a1[1]], [a0[0], y1, a0[1]], [-on[0], 0, -on[2]]);
    quad(m, mat, [a0[0], y1, a0[1]], [a1[0], y1, a1[1]], [b1[0], y1, b1[1]], [b0[0], y1, b0[1]], [0, 1, 0]);
    if (under) quad(m, mat, [a0[0], y0, a0[1]], [a1[0], y0, a1[1]], [b1[0], y0, b1[1]], [b0[0], y0, b0[1]], [0, -1, 0]);
  }
  if (!closed) {
    for (const i of [0, n - 1]) {
      const k = i === 0 ? 1 : n - 2;
      const dx = pts[i]![0] - pts[k]![0];
      const dz = pts[i]![1] - pts[k]![1];
      const a = A[i]!;
      const b = B[i]!;
      quad(m, mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [dx, 0, dz]);
    }
  }
}

// --- arches -------------------------------------------------------------------------------

/** A pointed (two-centred) arched opening in a wall's face: centre, width, sill, springing, apex, depth. */
interface Arch {
  cx: number;
  w: number;
  yb: number;
  ys: number;
  ya: number;
  dep: number;
}

/** The arch's intrados from the left springing over the apex to the right one (2k + 1 points), and its two centres. */
function archCurve(a: Arch, k: number): { pts: Array<[number, number]>; cl: number; cr: number } {
  const h = a.ya - a.ys;
  const R = (a.w * a.w) / 4 / a.w + (h * h) / a.w;
  const cl = a.cx - a.w / 2 + R;
  const cr = a.cx + a.w / 2 - R;
  const th = Math.atan2(h, a.cx - cl);
  const left: Array<[number, number]> = [];
  for (let i = 0; i <= k; i++) {
    const t = Math.PI + ((th - Math.PI) * i) / k;
    left.push([i === k ? a.cx : cl + R * Math.cos(t), i === k ? a.ya : a.ys + R * Math.sin(t)]);
  }
  const right = left.slice(0, k).reverse().map(([x, y]): [number, number] => [2 * a.cx - x, y]);
  return { pts: [...left, ...right], cl, cr };
}

/**
 * A wall face from x0 to x1 and y0 to y1 in the plane z = zf of the local frame,
 * pierced by arched recesses: the face, each recess's jambs, sill, soffit and
 * back. Arches must not overlap in x and must stay below y1.
 */
function archWall(m: MeshBuilder, mat: string, back: string, x0: number, x1: number, y0: number, y1: number, zf: number, arches: Arch[], k: number): void {
  const face: Vec3[] = [];
  const rq = (xa: number, xb: number, ya: number, yb: number): void => {
    if (xb - xa < 1e-6 || yb - ya < 1e-6) return;
    face.push([xa, ya, zf], [xb, ya, zf], [xb, yb, zf], [xa, ya, zf], [xb, yb, zf], [xa, yb, zf]);
  };
  let cur = x0;
  for (const a of arches) {
    const l = a.cx - a.w / 2;
    const r = a.cx + a.w / 2;
    const zb = zf - a.dep;
    rq(cur, l, y0, y1);
    rq(l, r, y0, a.yb);
    const { pts, cl, cr } = archCurve(a, k);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i]!;
      const [xb, yb] = pts[i + 1]!;
      face.push([xa, ya, zf], [xb, yb, zf], [xb, y1, zf], [xa, ya, zf], [xb, y1, zf], [xa, y1, zf]);
      const mx = (xa + xb) / 2;
      const my = (ya + yb) / 2;
      const c = i < k ? cl : cr;
      quad(m, back, [xa, ya, zf], [xb, yb, zf], [xb, yb, zb], [xa, ya, zb], [c - mx, a.ys - my, 0]);
    }
    quad(m, back, [l, a.yb, zf], [l, a.ys, zf], [l, a.ys, zb], [l, a.yb, zb], [1, 0, 0]);
    quad(m, back, [r, a.yb, zf], [r, a.ys, zf], [r, a.ys, zb], [r, a.yb, zb], [-1, 0, 0]);
    if (a.yb > y0 + 1e-6) quad(m, back, [l, a.yb, zf], [r, a.yb, zf], [r, a.yb, zb], [l, a.yb, zb], [0, 1, 0]);
    const ring: Vec3[] = [[l, a.yb, zb], [r, a.yb, zb], ...pts.slice().reverse().map(([x, y]): Vec3 => [x, y, zb])];
    const fan: Vec3[] = [];
    for (let i = 1; i + 1 < ring.length; i++) fan.push(ring[0]!, ring[i]!, ring[i + 1]!);
    m.facets(back, fan, [0, 0, 1]);
    cur = r;
  }
  rq(cur, x1, y0, y1);
  m.facets(mat, face, [0, 0, 1]);
}

/** A flat pointed-arch panel in the plane z (convex), proud by `proud` and sunk to z - sink. */
function archPanel(m: MeshBuilder, mat: string, a: Arch, z: number, proud: number, sink: number, k: number): void {
  const { pts } = archCurve(a, k);
  const outline: Vec3[] = [[a.cx - a.w / 2, a.yb, z + proud], [a.cx + a.w / 2, a.yb, z + proud], ...pts.slice().reverse().map(([x, y]): Vec3 => [x, y, z + proud])];
  m.slab(mat, outline, [0, 0, -(proud + sink)]);
}

/**
 * A raised rectangular frame of strips t wide round x0..x1, y0..y1 on the face
 * z = zf: the top (and bottom) strips stand 5 cm proud and reach past the sides,
 * the side strips 3.5 cm proud and run into them, so no faces coincide.
 */
function frame(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, t: number, zf: number, bottom: boolean): void {
  const hs = (ya: number, yb: number): void => m.slab(mat, [[x0 - 0.05, ya, zf + 0.05], [x1 + 0.05, ya, zf + 0.05], [x1 + 0.05, yb, zf + 0.05], [x0 - 0.05, yb, zf + 0.05]], [0, 0, -0.15]);
  const vs = (xa: number, xb: number): void => {
    const ya = bottom ? y0 + t / 2 : y0;
    const yb = y1 - t / 2;
    m.slab(mat, [[xa, ya, zf + 0.035], [xb, ya, zf + 0.035], [xb, yb, zf + 0.035], [xa, yb, zf + 0.035]], [0, 0, -0.135]);
  };
  hs(y1 - t, y1);
  if (bottom) hs(y0, y0 + t);
  vs(x0, x0 + t);
  vs(x1 - t, x1);
}

// --- small towers -------------------------------------------------------------------------

/** A lofted onion or bulb: (r, y) profile rings about (cx, cz), open at the bottom, closed by a point at the top. */
function bulb(m: MeshBuilder, mat: string, n: number, prof: Array<[number, number]>, cx: number, cz: number, tip: number): void {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [r0, y0] = prof[i]!;
    const [r1, y1] = prof[i + 1]!;
    m.loft(mat, ngon(n, r0, 0, cx, cz), y0, ngon(n, r1, 0, cx, cz), y1, false);
  }
  const [rl, yl] = prof[prof.length - 1]!;
  m.spire(mat, ngon(n, rl, 0, cx, cz), yl, tip);
}

/** A gilt finial from y: a neck, two balls and a spike to `top`. */
function finial(m: MeshBuilder, cx: number, cz: number, y: number, top: number, s: number): void {
  const n = 8;
  const at = (r: number): Ring => ngon(n, r * s, 0, cx, cz);
  const L = top - y;
  const b1 = y + L * 0.25;
  const b2 = y + L * 0.55;
  m.loft("gilt", at(0.12), y, at(0.12), b1 - 0.1 * L, false);
  for (const yc of [b1, b2]) {
    const rr = 0.1 * L;
    m.loft("gilt", at(0.12), yc - rr, at(0.1 * L / s), yc, false);
    m.loft("gilt", at(0.1 * L / s), yc, at(0.12), yc + rr, false);
  }
  m.loft("gilt", at(0.12), b1 + 0.1 * L, at(0.12), b2 - 0.1 * L, false);
  m.spire("gilt", at(0.12), b2 + 0.1 * L, top);
}

/**
 * An open chattri at (cx, cz) from y: a floor, eight columns, the lintel, the
 * sloping chhajja, a short drum, the onion dome and its finial; r is the
 * columns' radius from the axis.
 */
function chattri(m: MeshBuilder, cx: number, cz: number, y: number, r: number, colH: number, top: number, n = 16): void {
  const s = r / 3.2;
  const yl = y + colH;
  m.scope("columns", () => {
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      const px = cx + r * Math.cos(a);
      const pz = cz - r * Math.sin(a);
      m.prism("marble", ngon(6, 0.42 * s, 0, px, pz), y, y + 0.35 * s);
      m.prism("marble", ngon(6, 0.27 * s, 0, px, pz), y + 0.35 * s, yl, false);
    }
  });
  const ro = r + 0.45 * s;
  m.scope("lintel", () => {
    const o = ngon(8, ro / Math.cos(Math.PI / 8), Math.PI / 8, cx, cz);
    m.prism("marble", o, yl, yl + 0.8 * s);
    m.cap("marbleShade", o, yl, false);
  });
  const ye = yl + 0.8 * s;
  m.scope("chhajja", () => {
    const o = ngon(n, ro + 1.0 * s, 0, cx, cz);
    const i = ngon(n, ro - 0.1, 0, cx, cz);
    band(m, "marble", i, ye, o, ye - 0.5 * s, true);
    band(m, "marbleShade", i, ye - 0.25 * s, o, ye - 0.65 * s, false);
    m.loft("marble", o, ye - 0.65 * s, o, ye - 0.5 * s, false);
  });
  const yd = ye + 1.0 * s;
  m.scope("drum", () => {
    m.prism("marble", ngon(n, r - 0.1 * s, 0, cx, cz), ye - 0.3 * s, yd, false);
    ringBand(m, "inlay", n, r, yd - 0.35 * s, yd, r - 0.2 * s, r - 0.15 * s, cx, cz);
  });
  const yt = top - 2.2 * s;
  m.scope("dome", () => {
    // an onion like the great dome's: it swells out over the drum, is widest low down,
    // closes over a full body and runs up a recurved neck to the finial
    const h = yt - yd;
    const prof: Array<[number, number]> = [
      [r - 0.15 * s, yd], [r * 1.1, yd + h * 0.06], [r * 1.17, yd + h * 0.15], [r * 1.19, yd + h * 0.27],
      [r * 1.15, yd + h * 0.4], [r * 1.03, yd + h * 0.53], [r * 0.83, yd + h * 0.66], [r * 0.57, yd + h * 0.78],
      [r * 0.33, yd + h * 0.87], [r * 0.18, yd + h * 0.94], [0.2 * s, yd + h],
    ];
    bulb(m, "marble", n, prof, cx, cz, yt + 0.15 * s);
  });
  m.scope("finial", () => finial(m, cx, cz, yt, top, s));
}

/** A pinnacle (guldasta) at (cx, cz): a slim hexagonal shaft from y0, a ring, a little bulb, a gilt point at top. */
function guldasta(m: MeshBuilder, cx: number, cz: number, y0: number, top: number): void {
  const r = 0.55;
  const ys = top - 2.6;
  m.prism("marble", ngon(6, r, 0, cx, cz), y0, ys, false);
  ringBand(m, "inlay", 6, r + 0.2, ys - 0.9, ys - 0.7, r, r, cx, cz);
  ringBand(m, "marble", 6, r + 0.25, ys, ys + 0.25, r, 0, cx, cz);
  const prof: Array<[number, number]> = [[r + 0.25, ys + 0.25], [0.78, ys + 0.55], [0.6, ys + 0.95], [0.2, ys + 1.3]];
  bulb(m, "marble", 6, prof, cx, cz, ys + 1.45);
  m.spire("gilt", ngon(6, 0.1, 0, cx, cz), ys + 1.33, top);
}

/** A small parapet finial (merlon) standing on y. */
function merlon(m: MeshBuilder, mat: string, cx: number, cz: number, y: number, s: number): void {
  m.prism(mat, ngon(6, 0.18 * s, 0, cx, cz), y - 0.1, y + 0.5 * s, false);
  m.loft(mat, ngon(6, 0.18 * s, 0, cx, cz), y + 0.5 * s, ngon(6, 0.24 * s, 0, cx, cz), y + 0.7 * s, false);
  m.spire(mat, ngon(6, 0.24 * s, 0, cx, cz), y + 0.7 * s, y + 1.15 * s);
}

// --- the plinth ---------------------------------------------------------------------------

/** A run of plinth niches spaced evenly between x0 and x1. */
function plinthArches(x0: number, x1: number): Arch[] {
  const n = Math.max(1, Math.round((x1 - x0) / 4.3));
  const p = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => ({ cx: x0 + (i + 0.5) * p, w: 2.8, yb: 0.9, ys: 4.0, ya: 5.6, dep: 0.45 }));
}

function plinth(m: MeshBuilder): void {
  m.scope("faces", () => {
    for (const phi of [Math.PI / 2, Math.PI, -Math.PI / 2]) {
      m.moved(turn(phi), () => archWall(m, "plinth", "marbleShade", -PL, PL, 0, Y_PL, PL, plinthArches(-PL, PL), 2));
    }
    archWall(m, "plinth", "marbleShade", -PL, -ST_HW, 0, Y_PL, PL, plinthArches(-PL, -ST_HW - 1.2), 2);
    archWall(m, "plinth", "marbleShade", ST_HW, PL, 0, Y_PL, PL, plinthArches(ST_HW + 1.2, PL), 2);
  });
  m.scope("top", () => {
    m.cap("plinth", rect(2 * PL, PL + ST_IN, 0, (ST_IN - PL) / 2), Y_PL);
    m.cap("plinth", rect(PL - ST_HW, PL - ST_IN, -(PL + ST_HW) / 2, (PL + ST_IN) / 2), Y_PL);
    m.cap("plinth", rect(PL - ST_HW, PL - ST_IN, (PL + ST_HW) / 2, (PL + ST_IN) / 2), Y_PL);
  });
  m.scope("cornice", () => {
    const path: Ring = [[ST_HW, PL], [PL, PL], [PL, -PL], [-PL, -PL], [-PL, PL], [-ST_HW, PL]];
    pathWall(m, "plinth", path, false, 0, 0.35, Y_PL - 0.45, Y_PL, false, true);
    pathWall(m, "inlay", path, false, 0, 0.12, 0.0, 0.35, false, false);
  });
  m.scope("front stair", () => {
    for (const s of [-1, 1]) {
      const x = s * ST_HW;
      quad(m, "plinth", [x, 0, ST_IN], [x, 0, PL], [x, Y_PL, PL], [x, Y_PL, ST_IN], [-s, 0, 0]);
    }
    const n = 20;
    const rise = Y_PL / n;
    const run = (PL - ST_IN) / n;
    const tr: Vec3[] = [];
    const ri: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const z = PL - i * run;
      const y = i * rise;
      ri.push([-ST_HW, y, z], [ST_HW, y, z], [ST_HW, y + rise, z], [-ST_HW, y, z], [ST_HW, y + rise, z], [-ST_HW, y + rise, z]);
      tr.push([-ST_HW, y + rise, z], [ST_HW, y + rise, z], [ST_HW, y + rise, z - run], [-ST_HW, y + rise, z], [ST_HW, y + rise, z - run], [-ST_HW, y + rise, z - run]);
    }
    m.facets("marbleShade", ri, [0, 0, 1]);
    m.facets("plinth", tr, [0, 1, 0]);
  });
}

// --- the mausoleum ------------------------------------------------------------------------

/** The two storeys of niches on a wall from x0 to x1 in the plane zf. */
function niches(m: MeshBuilder, x0: number, x1: number, zf: number): void {
  const cx = (x0 + x1) / 2;
  const w = Math.min(6.4, x1 - x0 - 3.2);
  const h = w * 0.56;
  const lo: Arch = { cx, w, yb: Y_PL, ys: 17.2 - h, ya: 17.2, dep: 1.6 };
  const hi: Arch = { cx, w, yb: 19.6, ys: 28.6 - h, ya: 28.6, dep: 1.6 };
  archWall(m, "marble", "marbleShade", x0, x1, Y_PL, 18.6, zf, [lo], 6);
  archWall(m, "marble", "marbleShade", x0, x1, 18.6, Y_ROOF, zf, [hi], 6);
  m.scope("inlay frames", () => {
    frame(m, "inlay", cx - w / 2 - 0.65, cx + w / 2 + 0.65, Y_PL + 0.05, 17.2 + 0.75, 0.28, zf, false);
    frame(m, "inlay", cx - w / 2 - 0.65, cx + w / 2 + 0.65, 19.0, 28.6 + 0.75, 0.28, zf, true);
  });
}

/** The pishtaq of one face: the iwan, its back with the jali window and door, the calligraphy, the crest. */
function pishtaq(m: MeshBuilder): void {
  const zf = H + PI_OUT;
  const iwan: Arch = { cx: 0, w: 14, yb: Y_PL, ys: 18.2, ya: 27.2, dep: PI_OUT + 5.5 };
  const zb = zf - iwan.dep;
  m.scope("iwan", () => archWall(m, "marble", "marbleShade", -PI_HW, PI_HW, Y_PL, Y_PI, zf, [iwan], 10));
  m.scope("block", () => {
    for (const s of [-1, 1]) {
      const x = s * PI_HW;
      quad(m, "marble", [x, Y_PL, H], [x, Y_PL, zf], [x, Y_ROOF, zf], [x, Y_ROOF, H], [s, 0, 0]);
      quad(m, "marble", [x, Y_ROOF, H - 1.5], [x, Y_ROOF, zf], [x, Y_PI, zf], [x, Y_PI, H - 1.5], [s, 0, 0]);
    }
    quad(m, "marble", [-PI_HW, Y_PI, H - 1.5], [PI_HW, Y_PI, H - 1.5], [PI_HW, Y_PI, zf], [-PI_HW, Y_PI, zf], [0, 1, 0]);
    quad(m, "marble", [-PI_HW, Y_ROOF, H - 1.5], [PI_HW, Y_ROOF, H - 1.5], [PI_HW, Y_PI, H - 1.5], [-PI_HW, Y_PI, H - 1.5], [0, 0, -1]);
  });
  m.scope("calligraphy", () => frame(m, "callig", -PI_HW + 1.0, PI_HW - 1.0, Y_PL + 0.3, Y_PI - 0.8, 0.8, zf, false));
  m.scope("inlay", () => {
    frame(m, "inlay", -iwan.w / 2 - 0.75, iwan.w / 2 + 0.75, Y_PL + 0.05, iwan.ya + 0.75, 0.25, zf, false);
    // the floral spandrels: a raised field between the arch and the frame's corners
    const { pts, cl, cr } = archCurve(iwan, 10);
    for (const s of [-1, 1]) {
      const yTop = iwan.ya + 0.35;
      const xo = s * (iwan.w / 2 + 0.35);
      // wound counter-clockwise seen from +Z with the corner first, so the slab fans from it
      const field: Vec3[] = [[xo, yTop, zf + 0.04]];
      for (let q = 2; q <= 9; q++) {
        const [px, py] = pts[s < 0 ? q : 9 + q]!;
        const ox = px - (s < 0 ? cl : cr);
        const oy = py - iwan.ys;
        const ol = Math.hypot(ox, oy);
        field.push([px + (ox / ol) * 0.35, py + (oy / ol) * 0.35, zf + 0.04]);
      }
      m.slab("inlay", field, [0, 0, -0.12]);
    }
  });
  m.scope("iwan back", () => {
    frame(m, "callig", -3.4, 3.4, Y_PL + 0.05, 13.4, 0.35, zb, false);
    archPanel(m, "jali", { cx: 0, w: 4.0, yb: Y_PL + 0.05, ys: 10.4, ya: 12.4, dep: 0 }, zb, 0.04, 0.05, 6);
    archPanel(m, "inlay", { cx: 0, w: 5.6, yb: 16.2, ys: 20.8, ya: 23.6, dep: 0 }, zb, 0.03, 0.05, 6);
    archPanel(m, "jali", { cx: 0, w: 4.6, yb: 16.7, ys: 20.8, ya: 23.1, dep: 0 }, zb, 0.06, 0.09, 6);
    for (const s of [-1, 1]) {
      for (const [yb, ys, ya] of [[8.0, 10.6, 12.0], [14.3, 16.6, 17.8]] as Array<[number, number, number]>) {
        archPanel(m, "marbleShade", { cx: s * 5.1, w: 2.2, yb, ys, ya, dep: 0 }, zb, 0.05, 0.05, 4);
      }
    }
  });
  m.scope("crest", () => {
    for (let i = 0; i < 9; i++) merlon(m, "marble", -PI_HW + 1.2 + (i * (2 * PI_HW - 2.4)) / 8, H - 0.4, Y_PI, 1);
    // the crest band along the top front edge
    m.slab("inlay", [[-PI_HW + 0.3, Y_PI - 0.6, zf + 0.04], [PI_HW - 0.3, Y_PI - 0.6, zf + 0.04], [PI_HW - 0.3, Y_PI - 0.25, zf + 0.04], [-PI_HW + 0.3, Y_PI - 0.25, zf + 0.04]], [0, 0, -0.12]);
  });
}

/** One of the four main faces in the local frame: the pishtaq and the two niched bays either side. */
function mainFace(m: MeshBuilder): void {
  m.scope("pishtaq", () => pishtaq(m));
  m.scope("bays", () => {
    niches(m, -(H - C), -PI_HW, H);
    niches(m, PI_HW, H - C, H);
  });
  m.scope("parapet finials", () => {
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) merlon(m, "marble", s * (PI_HW + 1.4 + i * 2.75), H - 0.25, Y_PAR, 0.9);
  });
}

/** One chamfer face in its local frame (the plane z = CH_D). */
function chamferFace(m: MeshBuilder): void {
  niches(m, -CH_HL, CH_HL, CH_D);
  for (let i = 0; i < 3; i++) merlon(m, "marble", -2.8 + i * 2.8, CH_D - 0.25, Y_PAR, 0.9);
}

function mausoleum(m: MeshBuilder): void {
  for (let k = 0; k < 4; k++) {
    m.scope(`face ${k + 1}`, () => m.moved(turn((k * Math.PI) / 2), () => mainFace(m)));
    m.scope(`chamfer ${k + 1}`, () => m.moved(turn(Math.PI / 4 + (k * Math.PI) / 2), () => chamferFace(m)));
  }
  const ring = chamferedRect(2 * H, 2 * H, C);
  m.scope("roof", () => m.cap("marbleShade", ring, Y_ROOF));
  m.scope("cornice", () => {
    pathWall(m, "marble", ring, true, 0, 0.35, Y_ROOF - 0.55, Y_ROOF, false, true);
  });
  m.scope("parapet", () => {
    pathWall(m, "marble", ring, true, -0.5, 0, Y_ROOF, Y_PAR, true, false);
    pathWall(m, "inlay", ring, true, 0, 0.04, Y_ROOF + 0.45, Y_ROOF + 0.75, false, true);
  });
  m.scope("guldastas", () => {
    for (let k = 0; k < 4; k++) {
      m.moved(turn((k * Math.PI) / 2), () => {
        for (const s of [-1, 1]) {
          guldasta(m, s * PI_HW, H + PI_OUT, Y_PL, 37.6);
          guldasta(m, s * (H - C), H, Y_PL, 36.0);
        }
      });
    }
  });
}

// --- the dome -----------------------------------------------------------------------------

const DRUM_R = 11.8;
const Y_DRUM = 41.4;
/** The neck's tip under the finial. */
const Y_NECK = 64.4;
const Y_TOP = 73;

/**
 * The onion's profile (radius, height), measured on the front photographs against
 * the drum: from the drum's top it swells out at once into an overhanging shoulder,
 * widest (27.9 m, 1.18 times the drum) 5.3 m up, closes over a full rounded body to
 * a broad top under the lotus and runs up a recurved (concave) neck to a slender
 * point under the finial.
 */
const BULB: Array<[number, number]> = [
  [11.95, Y_DRUM], [12.8, 41.64], [13.3, 42.04], [13.62, 42.63], [13.82, 43.38], [13.88, 44.3], [13.94, 45.37],
  [13.95, 46.65], [13.8, 48.05], [13.53, 49.5], [13.12, 51.0], [12.55, 52.5], [11.82, 53.95], [10.92, 55.34],
  [9.88, 56.63], [8.8, 57.81], [7.85, 58.77], [6.85, 59.68], [5.82, 60.54], [4.85, 61.24], [3.85, 61.83],
  [2.92, 62.33], [2.1, 62.79], [1.48, 63.22], [1.07, 63.65], [0.83, 64.08], [0.72, Y_NECK],
];

/** The onion's radius at height y (linear between the profile's rings). */
function bulbR(y: number): number {
  for (let i = 0; i + 1 < BULB.length; i++) {
    const [r0, y0] = BULB[i]!;
    const [r1, y1] = BULB[i + 1]!;
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return BULB[BULB.length - 1]![0];
}

function dome(m: MeshBuilder): void {
  const N = 48;
  m.scope("drum", () => {
    m.prism("marble", ngon(N, DRUM_R), Y_ROOF, Y_DRUM, false);
    ringBand(m, "marble", N, DRUM_R + 0.35, Y_ROOF, 31.6, -1, DRUM_R);
    ringBand(m, "inlay", N, DRUM_R + 0.12, 33.9, 34.5, DRUM_R, DRUM_R);
    ringBand(m, "marble", N, DRUM_R + 0.4, Y_DRUM - 0.8, Y_DRUM, DRUM_R, DRUM_R);
    // the blind arcade round the drum's upper band, its arches on the flat facets
    const D = DRUM_R * Math.cos(Math.PI / N);
    for (let i = 0; i < 24; i++) {
      const phi = ((4 * i + 1) * Math.PI) / N + Math.PI / 2;
      const fw = 2 * DRUM_R * Math.sin(Math.PI / N) * 0.86;
      m.moved(turn(phi), () => archPanel(m, "inlay", { cx: 0, w: fw, yb: 35.3, ys: 38.3, ya: 39.7, dep: 0 }, D, 0.05, 0.05, 3));
    }
  });
  m.scope("bulb", () => {
    const NB = 40;
    for (let i = 0; i + 1 < BULB.length; i++) {
      const [r0, y0] = BULB[i]!;
      const [r1, y1] = BULB[i + 1]!;
      m.loft("marble", ngon(NB, r0), y0, ngon(NB, r1), y1, false);
    }
    m.cap("marble", ngon(NB, BULB[BULB.length - 1]![0]), Y_NECK);
  });
  m.scope("lotus crown", () => {
    // sixteen petals in relief on the onion's top, their tips hanging down, standing
    // about 0.25 m off the surface (0.4 m out from the axis) and sunk into it behind
    const n = 16;
    const off = 0.4;
    // (height, half width) round the petal from its tip: wide low down, pointed at the neck
    const outline: Array<[number, number]> = [[59.8, 0], [60.43, 0.72], [61.18, 0.9], [62.0, 0.5], [62.52, 0], [62.0, -0.5], [61.18, -0.9], [60.43, -0.72]];
    for (let i = 0; i < n; i++) {
      const phi = ((i + 0.5) / n) * Math.PI * 2;
      const cs = Math.cos(phi);
      const sn = Math.sin(phi);
      const at = ([y, t]: [number, number]): Vec3 => {
        const r = bulbR(y) + off;
        return [r * sn + t * cs, y, r * cs - t * sn];
      };
      m.slab("marbleShade", outline.map(at), [-sn * 0.3, -0.45, -cs * 0.3]);
    }
  });
  m.scope("finial", () => {
    const y0 = Y_NECK;
    const at = (r: number): Ring => ngon(12, r);
    m.loft("gilt", at(0.62), y0, at(0.95), y0 + 0.3, false);
    m.loft("gilt", at(0.95), y0 + 0.3, at(0.7), y0 + 0.6, false);
    m.loft("gilt", at(0.7), y0 + 0.6, at(0.28), y0 + 0.9, false);
    let y = y0 + 0.9;
    for (const r of [0.75, 0.65, 0.52]) {
      const lats = [-60, -25, 15, 55].map((d) => (d * Math.PI) / 180);
      const c = y + r * 0.85;
      m.loft("gilt", at(0.28), y, at(r * Math.cos(lats[0]!)), c + r * Math.sin(lats[0]!), false);
      for (let i = 0; i + 1 < lats.length; i++) m.loft("gilt", at(r * Math.cos(lats[i]!)), c + r * Math.sin(lats[i]!), at(r * Math.cos(lats[i + 1]!)), c + r * Math.sin(lats[i + 1]!), false);
      y = c + r * Math.sin(lats[3]!) + 0.3;
      m.loft("gilt", at(r * Math.cos(lats[3]!)), c + r * Math.sin(lats[3]!), at(0.28), y, false);
    }
    m.prism("gilt", at(0.16), y, Y_TOP - 2.4, false);
    // the crescent: a flat sickle of two slabs on the spike
    for (const s of [-1, 1]) {
      const yc = Y_TOP - 2.5;
      m.slab("gilt", [[s * 0.9, yc + 0.5, 0.06], [s * 0.35, yc, 0.06], [s * 0.12, yc, 0.06], [s * 0.12, yc + 0.25, 0.06]], [0, 0, -0.12]);
    }
    m.spire("gilt", at(0.16), Y_TOP - 2.4, Y_TOP);
  });
}

// --- the minarets -------------------------------------------------------------------------

/** The three shaft stages: bottom, top, radius at each; a balcony stands on each stage's top. */
const STAGES: Array<[number, number, number, number]> = [
  [8.6, 17.4, 3.0, 2.8],
  [18.3, 27.9, 2.7, 2.5],
  [28.8, 38.2, 2.4, 2.2],
];

function minaret(m: MeshBuilder, cx: number, cz: number): void {
  const n = 12;
  const c = (r: number): Ring => ngon(n, r, 0, cx, cz);
  m.scope("base", () => {
    m.prism("marble", ngon(8, 4.0, Math.PI / 8, cx, cz), Y_PL, 8.2);
    m.loft("marble", c(3.6), 8.2, c(3.0), STAGES[0]![0], false);
  });
  STAGES.forEach(([y0, y1, r0, r1], k) => {
    m.scope(`stage ${k + 1}`, () => {
      if (k > 0) m.loft("marble", c(STAGES[k - 1]![3] - 0.05), y0 - 0.9, c(r0), y0, false);
      m.loft("marble", c(r0), y0, c(r1), y1, false);
      for (const f of [0.33, 0.66]) {
        const y = y0 + (y1 - y0) * f;
        const r = r0 + (r1 - r0) * f;
        ringBand(m, "inlay", n, r + 0.06, y, y + 0.22, r - 0.1, r - 0.08, cx, cz);
      }
    });
    m.scope(`balcony ${k + 1}`, () => {
      const rb = r1 + 1.15;
      // the corbel: a flaring ring, then brackets under the deck
      m.loft("marble", c(r1), y1 - 1.6, c(r1 + 0.45), y1 - 0.5, false);
      for (let i = 0; i < n; i++) {
        const a = ((i + 0.5) / n) * Math.PI * 2;
        const ux = Math.cos(a);
        const uz = -Math.sin(a);
        const at = (r: number, y: number): Vec3 => [cx + ux * r + uz * 0.12, y, cz + uz * r - ux * 0.12];
        m.slab("marble", [at(r1 + 0.2, y1 - 0.53), at(rb - 0.15, y1 - 0.53), at(r1 + 0.2, y1 - 1.5)], [-uz * 0.24, 0, ux * 0.24]);
      }
      ringBand(m, "marble", n, rb, y1 - 0.5, y1, r1 + 0.45, 0, cx, cz);
      if (k < 2) band(m, "marbleShade", c(r1 - 0.05), y1, c(rb), y1, true);
      else m.cap("marbleShade", c(rb), y1);
      // the railing: a pierced-looking parapet of two bands
      m.loft("marble", c(rb), y1, c(rb), y1 + 1.0, false);
      m.loft("marble", c(rb - 0.18).slice().reverse(), y1, c(rb - 0.18).slice().reverse(), y1 + 1.0, false);
      band(m, "marble", c(rb - 0.18), y1 + 1.0, c(rb), y1 + 1.0, true);
    });
  });
  m.scope("chattri", () => chattri(m, cx, cz, STAGES[2]![1], 2.05, 3.3, Y_PL + 40.5, 12));
}

// --- the whole ----------------------------------------------------------------------------

export function tajMahal(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("plinth", () => plinth(m));
  m.scope("mausoleum", () => mausoleum(m));
  m.scope("dome", () => dome(m));
  m.scope("chattris", () => {
    for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as Array<[number, number]>) {
      const cx = sx * 15.6;
      const cz = sz * 15.6;
      m.scope("chattri", () => {
        m.prism("marble", ngon(8, 4.6, Math.PI / 8, cx, cz), Y_ROOF, Y_ROOF + 1.2);
        chattri(m, cx, cz, Y_ROOF + 1.2, 3.2, 4.4, 45.2);
      });
    }
  });
  m.scope("minarets", () => {
    for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as Array<[number, number]>) m.scope("minaret", () => minaret(m, sx * MIN_AT, sz * MIN_AT));
  });
  return m;
}

/** The distant model: the plinth, the chamfered block with its pishtaqs, the drum and the bulb, chattris, minarets. */
export function tajMahalLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("plinth", 0, 0, 2 * PL, 2 * PL, 0, Y_PL);
  m.prism("marble", chamferedRect(2 * H, 2 * H, C), Y_PL, Y_PAR);
  for (let k = 0; k < 4; k++) {
    m.moved(turn((k * Math.PI) / 2), () => {
      m.box("marble", 0, H - 0.4, 2 * PI_HW, 2.2, Y_PL, Y_PI);
      m.slab("marbleShade", [[-7, Y_PL + 0.05, H + 0.72], [7, Y_PL + 0.05, H + 0.72], [7, 18.2, H + 0.72], [0, 27.2, H + 0.72], [-7, 18.2, H + 0.72]], [0, 0, -0.05]);
    });
  }
  m.prism("marble", ngon(10, DRUM_R), Y_PAR, Y_DRUM, false);
  // the onion: the overhanging shoulder, the full body, the recurved neck
  const prof: Array<[number, number]> = [[DRUM_R, Y_DRUM], [13.55, 42.5], [13.95, 46.3], [12.0, 53.4], [7.9, 58.7], [3.9, 61.8], [1.5, 63.2]];
  for (let i = 0; i + 1 < prof.length; i++) m.loft("marble", ngon(10, prof[i]![0]), prof[i]![1], ngon(10, prof[i + 1]![0]), prof[i + 1]![1], false);
  m.spire("marble", ngon(10, 1.5), 63.2, Y_NECK + 0.6);
  m.spire("gilt", ngon(4, 0.25), Y_NECK, Y_TOP);
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as Array<[number, number]>) {
    m.prism("marble", ngon(6, 3.4, 0, sx * 15.6, sz * 15.6), Y_PAR, 39.0, false);
    m.spire("marble", ngon(6, 3.4, 0, sx * 15.6, sz * 15.6), 39.0, 45.2);
    const cx = sx * MIN_AT;
    const cz = sz * MIN_AT;
    m.loft("marble", ngon(6, 3.0, 0, cx, cz), Y_PL, ngon(6, 2.2, 0, cx, cz), 38.2, false);
    m.prism("marbleShade", ngon(6, 3.4, 0, cx, cz), 37.2, 39.2);
    m.spire("marble", ngon(6, 3.0, 0, cx, cz), 39.2, Y_PL + 40.5);
  }
  return m;
}

export const TAJ_MAHAL: ProceduralDesign[] = [
  {
    id: "bld-taj-mahal",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Taj Mahal",
    build: tajMahal,
    buildLod: tajMahalLod,
    references: "taj-mahal",
    catalog: PLAZA_CATALOG,
  },
];
