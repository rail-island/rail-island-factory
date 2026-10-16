// The procedural aircraft: the 1922 Aero A.10 biplane airliner, the Airbus A380
// and a Learjet-like light business jet. See docs/models/aircraft.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/aircraft/glb), procedurally: the same
// axes and nose direction (the webapp's yaw in db/aircraft/aircraft.meta.json is
// measured off them), about the same bounding box (test/referenceModels.test.ts),
// the same look, with detail taken from the photos in assets/.
//
// Modelled in metres, +Y up. The A.10 and the A380 lie along Z with the nose at
// +Z and the wings along X; the light jet lies along X with the nose at +X and
// the wings along Z. The A.10 and the A380 stand on y = 0; the light jet keeps
// its reference's datum, the fuselage axis on y = 0 and the wheels at y = -2.55.
//
// Almost everything is a BODY: equal-length convex cross-sections at stations
// along an axis, joined by MeshBuilder.sweep -- a fuselage, a nacelle, a wing
// (airfoil sections along the span). Windows, windscreens and stripes are
// DECALS: triangles laid a few millimetres off a body's skin (found by casting
// a ray inside its interpolated section), so no two materials ever share a plane.
//
// The A380 and the light jet retract their gear in the game: the webapp hides
// the GLB node named exactly "gear" in flight, so both are drawn as two parts,
// "airframe" and "gear". The A.10's gear is fixed and it has no parts.
//
// The ids are stored in the game's saved maps, so a design is never renamed
// once shipped.

import { MeshBuilder, ngon, type MaterialSpec, type Ring, type SweepAxis } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";

// The colours are the reference models' own. Metal is only mildly metallic:
// the game lights models without an environment map.
const PALETTE: Record<string, MaterialSpec> = {
  // the A.10
  fabric: { color: "#e4d9a8", roughness: 0.8 },
  aluminium: { color: "#c3c7cb", metallic: 0.3, roughness: 0.4 },
  steel: { color: "#6d7076", metallic: 0.2, roughness: 0.5 },
  walnut: { color: "#8d6337", roughness: 0.55 },
  slot: { color: "#1e2529", roughness: 0.6 },
  radiator: { color: "#1d1d20", roughness: 0.7 },
  // the airliners
  white: { color: "#f3f2ef", roughness: 0.4 },
  paint: { color: "#f0f2f4", roughness: 0.35 },
  belly: { color: "#e2e4e7", roughness: 0.45 },
  door: { color: "#d6d9dd", roughness: 0.45 },
  alloy: { color: "#c7cbd1", metallic: 0.25, roughness: 0.45 },
  navy: { color: "#1d2b48", roughness: 0.4 },
  red: { color: "#8e1f2b", roughness: 0.35 },
  darkGrey: { color: "#2b2e32", roughness: 0.5 },
  metalGrey: { color: "#b6bcc2", metallic: 0.3, roughness: 0.4 },
  glass: { color: "#161b22", metallic: 0.2, roughness: 0.15 },
  tyre: { color: "#1b1c1e", roughness: 0.95 },
};

// --- bodies, decals and rods ---------------------------------------------------------

/** A point of a cross-section: (lateral, y) -- (x, y) on a body along z, (z, y) on one along x. */
type P2 = [number, number];
type Sec = P2[];
/** A cross-section at position `a` along the body's axis. */
interface Station { a: number; sec: Sec }

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The model point of section point `p` at position `a` along `axis`. */
function at(axis: SweepAxis, a: number, p: P2): Vec3 {
  return axis === "z" ? [p[0], p[1], a] : [a, p[1], p[0]];
}

/** The unit vector along `axis`, signed. */
function along(axis: SweepAxis, s: number): Vec3 {
  return axis === "z" ? [0, 0, s] : [s, 0, 0];
}

function centroid(sec: Sec): P2 {
  let u = 0;
  let y = 0;
  for (const p of sec) {
    u += p[0];
    y += p[1];
  }
  return [u / sec.length, y / sec.length];
}

/**
 * An oval cross-section of `n` points about (cu, cy): half-width `hw`, `top`
 * above and `bot` below, a superellipse of exponent `e` (2 = an ellipse, more =
 * squarer). The points sit half a step off the axes, so the section has a
 * vertical facet on each side.
 */
function oval(n: number, cu: number, cy: number, hw: number, top: number, bot: number, e = 2): Sec {
  const f = (v: number): number => Math.sign(v) * Math.pow(Math.abs(v), 2 / e);
  const out: Sec = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    const s = Math.sin(t);
    out.push([cu + hw * f(Math.cos(t)), cy + (s >= 0 ? top : bot) * f(s)]);
  }
  return out;
}

/** A circle of `n` points about (cu, cy), half a step off the axes. */
const circle = (n: number, cu: number, cy: number, r: number): Sec => oval(n, cu, cy, r, r, r);

/**
 * An airfoil section, leading edge at `lead`, `chord` long towards -dir,
 * `thick` thick about `mid`: six points, convex.
 */
function foil(lead: number, chord: number, thick: number, mid: number, dir = 1): Sec {
  const u = (f: number): number => lead - dir * f * chord;
  return [
    [u(0), mid], [u(0.08), mid + 0.4 * thick], [u(0.35), mid + 0.5 * thick],
    [u(1), mid], [u(0.35), mid - 0.5 * thick], [u(0.08), mid - 0.38 * thick],
  ];
}

/** The skin of a body: its stations joined by open sweeps (cap the ends with `fan`). */
function body(m: MeshBuilder, mat: string, axis: SweepAxis, st: Station[]): void {
  for (let i = 0; i + 1 < st.length; i++) {
    const s0 = st[i]!;
    const s1 = st[i + 1]!;
    m.sweep(mat, axis, s0.sec, s0.a, s1.sec, s1.a, false);
  }
}

/**
 * Closes a section at `a`: a fan to `tip` (a cone), or, without one, a flat cap.
 * `dir` is the way the closed end faces along the axis.
 */
function fan(m: MeshBuilder, mat: string, axis: SweepAxis, sec: Sec, a: number, dir: number, tip?: Vec3): void {
  const apex = tip ?? at(axis, a, centroid(sec));
  const pts: Vec3[] = [];
  for (let i = 0; i < sec.length; i++) pts.push(at(axis, a, sec[i]!), at(axis, a, sec[(i + 1) % sec.length]!), apex);
  m.facets(mat, pts, along(axis, dir));
}

/** A flat ring between two sections at `a` (an intake lip, a nozzle rim), facing `dir`. */
function annulus(m: MeshBuilder, mat: string, axis: SweepAxis, outer: Sec, inner: Sec, a: number, dir: number): void {
  const pts: Vec3[] = [];
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const o0 = at(axis, a, outer[i]!);
    const o1 = at(axis, a, outer[j]!);
    const i0 = at(axis, a, inner[i]!);
    const i1 = at(axis, a, inner[j]!);
    pts.push(o0, o1, i1, o0, i1, i0);
  }
  m.facets(mat, pts, along(axis, dir));
}

/** A body's section at `a`: exactly what the sweep between the two stations draws there. */
function secAt(st: Station[], a: number): Sec {
  const lo = st[0]!.a < st[st.length - 1]!.a;
  for (let i = 0; i + 1 < st.length; i++) {
    const s0 = st[i]!;
    const s1 = st[i + 1]!;
    const inside = lo ? a >= s0.a && a <= s1.a : a <= s0.a && a >= s1.a;
    if (!inside && i + 2 < st.length) continue;
    const t = Math.min(1, Math.max(0, (a - s0.a) / (s1.a - s0.a)));
    return s0.sec.map((p, k) => [lerp(p[0], s1.sec[k]![0], t), lerp(p[1], s1.sec[k]![1], t)]);
  }
  return st[0]!.sec;
}

const cross2 = (a: P2, b: P2): number => a[0] * b[1] - a[1] * b[0];

/** Where the ray from `o` along `d` leaves the convex section. */
function exitPoint(sec: Sec, o: P2, d: P2): P2 {
  let best = -Infinity;
  for (let i = 0; i < sec.length; i++) {
    const p = sec[i]!;
    const q = sec[(i + 1) % sec.length]!;
    const e: P2 = [q[0] - p[0], q[1] - p[1]];
    const den = cross2(d, e);
    if (Math.abs(den) < 1e-12) continue;
    const w: P2 = [p[0] - o[0], p[1] - o[1]];
    const t = cross2(w, e) / den;
    const s = cross2(w, d) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9 && t > best) best = t;
  }
  return [o[0] + d[0] * best, o[1] + d[1] * best];
}

/**
 * The skin of body `st` at `a` and height `y` on side `side` (+1 / -1 lateral),
 * `off` proud of it (pushed away from the section's centre, near enough the
 * normal on a rounded body).
 */
function skinY(axis: SweepAxis, st: Station[], a: number, y: number, side: number, off: number): Vec3 {
  const sec = secAt(st, a);
  const c = centroid(sec);
  const p = exitPoint(sec, [c[0], y], [side, 0]);
  const du = p[0] - c[0];
  const dy = (p[1] - c[1]) * 0.5; // lean towards the horizontal: a flat-sided body's normal is
  const l = Math.hypot(du, dy) || 1;
  return at(axis, a, [p[0] + (du / l) * off, p[1] + (dy / l) * off]);
}

/** The skin of body `st` at `a`, in the direction `ang` (radians from +lateral) from the section's centre. */
function skinAng(axis: SweepAxis, st: Station[], a: number, ang: number, off: number): Vec3 {
  const sec = secAt(st, a);
  const d: P2 = [Math.cos(ang), Math.sin(ang)];
  const p = exitPoint(sec, centroid(sec), d);
  return at(axis, a, [p[0] + d[0] * off, p[1] + d[1] * off]);
}

function insideSec(sec: Sec, p: P2): boolean {
  let sign = 0;
  for (let i = 0; i < sec.length; i++) {
    const a = sec[i]!;
    const b = sec[(i + 1) % sec.length]!;
    const c = cross2([b[0] - a[0], b[1] - a[1]], [p[0] - a[0], p[1] - a[1]]);
    if (Math.abs(c) < 1e-12) continue;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}

/**
 * The skin of a nose or tail: the point at lateral `u` and height `y` where the
 * body ends between `aIn` (inside) and `aOut` (outside), pushed `off` further out.
 */
function skinEnd(axis: SweepAxis, st: Station[], u: number, y: number, aIn: number, aOut: number, off: number): Vec3 {
  let lo = aIn;
  let hi = aOut;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (insideSec(secAt(st, mid), [u, y])) lo = mid;
    else hi = mid;
  }
  return at(axis, lo + Math.sign(aOut - aIn) * off, [u, y]);
}

/** A convex polygon's triangles, fanned from its first point (for `facets`). */
function fanTris(pts: Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) out.push(pts[0]!, pts[i]!, pts[i + 1]!);
  return out;
}

/** The triangles of a patch mapped from the unit square by `f`, in nu x nv cells. */
function gridTris(f: (s: number, t: number) => Vec3, nu: number, nv: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = f(i / nu, j / nv);
      const b = f((i + 1) / nu, j / nv);
      const c = f((i + 1) / nu, (j + 1) / nv);
      const d = f(i / nu, (j + 1) / nv);
      out.push(a, b, c, a, c, d);
    }
  }
  return out;
}

/**
 * A decal following the side of body `st`: a convex outline in (a, y), cut into
 * horizontal bands (at its corners and `bands` more) so the triangles hug a
 * curved skin (and `steps` pieces along the axis, for a tapering one), each
 * corner laid on the skin by `skinY`.
 */
function skinDecal(axis: SweepAxis, st: Station[], outline: P2[], side: number, off: number, bands = 4, steps = 1): Vec3[] {
  const y0 = Math.min(...outline.map((p) => p[1]));
  const y1 = Math.max(...outline.map((p) => p[1]));
  const levels = new Set<number>(outline.map((p) => p[1]));
  for (let i = 1; i < bands; i++) levels.add(lerp(y0, y1, i / bands));
  const ys = [...levels].sort((a, b) => a - b);
  const slice = (y: number): [number, number] => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i]!;
      const q = outline[(i + 1) % outline.length]!;
      if ((p[1] - y) * (q[1] - y) > 0) continue;
      const t = q[1] === p[1] ? 0 : (y - p[1]) / (q[1] - p[1]);
      const a = lerp(p[0], q[0], t);
      lo = Math.min(lo, a, q[1] === p[1] ? q[0] : a);
      hi = Math.max(hi, a, q[1] === p[1] ? q[0] : a);
    }
    return [lo, hi];
  };
  const out: Vec3[] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const ya = ys[i]!;
    const yb = ys[i + 1]!;
    const [a0, a1] = slice(ya);
    const [b0, b1] = slice(yb);
    for (let k = 0; k < steps; k++) {
      const f0 = k / steps;
      const f1 = (k + 1) / steps;
      const q = [
        skinY(axis, st, lerp(a0, a1, f0), ya, side, off), skinY(axis, st, lerp(a0, a1, f1), ya, side, off),
        skinY(axis, st, lerp(b0, b1, f1), yb, side, off), skinY(axis, st, lerp(b0, b1, f0), yb, side, off),
      ];
      out.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
    }
  }
  return out;
}

/** A rounded window outline: `n` points of an ellipse of half-sizes (ra, ry) about (ca, cy) in (a, y). */
function ovalOutline(ca: number, cy: number, ra: number, ry: number, n: number): P2[] {
  const out: P2[] = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    out.push([ca + ra * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return out;
}

function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function unit(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** A straight `n`-sided rod of radius `r` from p0 to p1, in any direction: a strut, a wire. */
function rod(m: MeshBuilder, mat: string, p0: Vec3, p1: Vec3, r: number, n = 6): void {
  const d = sub3(p1, p0);
  const dn = unit(d);
  const e1 = unit(cross3(dn, Math.abs(dn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const e2 = cross3(dn, e1);
  const outline: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    const c = Math.cos(t) * r;
    const s = Math.sin(t) * r;
    outline.push([p0[0] + e1[0] * c + e2[0] * s, p0[1] + e1[1] * c + e2[1] * s, p0[2] + e1[2] * c + e2[2] * s]);
  }
  m.slab(mat, outline, d);
}

/** A flat convex plate `thick` thick: outline points (p, q) in the plane through `o` spanned by e1, e2. */
function plate(m: MeshBuilder, mat: string, o: Vec3, e1: Vec3, e2: Vec3, outline: P2[], thick: number): void {
  const u = unit(e1);
  const v = unit(e2);
  const n = unit(cross3(u, v));
  const pts = outline.map(([p, q]): Vec3 => [o[0] + u[0] * p + v[0] * q, o[1] + u[1] * p + v[1] * q, o[2] + u[2] * p + v[2] * q]);
  m.slab(mat, pts, [n[0] * thick, n[1] * thick, n[2] * thick]);
}

/** A ring in loft order (counter-clockwise from above, as `ngon` returns). */
function ccw(r: Ring): Ring {
  let area = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i]!;
    const q = r[(i + 1) % r.length]!;
    area += p[0] * q[1] - q[0] * p[1];
  }
  return area > 0 ? [...r].reverse() : r;
}

/** One spanwise station of a wing: span position, leading edge, chord, thickness, height of the chord line. */
interface WingStation { s: number; lead: number; chord: number; thick: number; mid: number }

/** A wing or tailplane along the span `axis`, its chord along the other horizontal axis, nose at +dir. */
function wing(m: MeshBuilder, mat: string, axis: SweepAxis, st: WingStation[], dir = 1): void {
  const ss = st.map((w): Station => ({ a: w.s, sec: foil(w.lead, w.chord, w.thick, w.mid, dir) }));
  body(m, mat, axis, ss);
  const first = ss[0]!;
  const last = ss[ss.length - 1]!;
  fan(m, mat, axis, first.sec, first.a, Math.sign(first.a - ss[1]!.a));
  fan(m, mat, axis, last.sec, last.a, Math.sign(last.a - ss[ss.length - 2]!.a));
}

/** The wing's leading edge, chord, thickness and chord height interpolated at span position `s`. */
function wingAt(st: WingStation[], s: number): WingStation {
  const x = Math.abs(s);
  for (let i = 0; i + 1 < st.length; i++) {
    const a = st[i]!;
    const b = st[i + 1]!;
    if (x > b.s && i + 2 < st.length) continue;
    const t = Math.min(1, Math.max(0, (x - a.s) / (b.s - a.s)));
    return { s, lead: lerp(a.lead, b.lead, t), chord: lerp(a.chord, b.chord, t), thick: lerp(a.thick, b.thick, t), mid: lerp(a.mid, b.mid, t) };
  }
  return st[0]!;
}

/**
 * A fin or winglet: a loft through airfoil rings at rising heights. Each ring is
 * (y, lead, chord, thick, centre across the chord) with the chord along `chordAxis`.
 */
function fin(m: MeshBuilder, mat: string, chordAxis: SweepAxis, rings: Array<[number, number, number, number, number]>, dir = 1, top = true): void {
  const ringOf = ([, lead, chord, thick, c]: [number, number, number, number, number]): Ring =>
    ccw(foil(lead, chord, thick, c, dir).map(([u, t]) => (chordAxis === "z" ? [t, u] : [u, t])));
  for (let i = 0; i + 1 < rings.length; i++) {
    m.loft(mat, ringOf(rings[i]!), rings[i]![0], ringOf(rings[i + 1]!), rings[i + 1]![0], top && i + 2 === rings.length);
  }
}

/**
 * A wheel on an axle along `axis` from a0 to a1, centred at `c` in the section
 * plane: a tyre with a flat on the ground and a hub proud of both faces.
 */
function wheel(m: MeshBuilder, axis: SweepAxis, a0: number, a1: number, c: P2, r: number, hubR: number, hubMat: string, n = 16): void {
  const tyre = ngon(n, r, Math.PI / n, c[0], c[1]);
  m.sweep("tyre", axis, tyre, a0, tyre, a1);
  const hub = ngon(10, hubR, 0, c[0], c[1]);
  const lip = Math.min(0.02, (a1 - a0) * 0.1);
  m.sweep(hubMat, axis, hub, a0 - lip, hub, a1 + lip);
}

/** The axle height of a wheel of radius r whose flat (n-gon) rests on `ground`. */
const axleY = (ground: number, r: number, n = 16): number => ground + r * Math.cos(Math.PI / n);

/**
 * A turbofan nacelle along `axis`, nose at +dir: a cowl from `front` to `back`
 * of radius `r` about `c`, an intake lip, a dark duct with the fan face and a
 * spinner set back in it, and behind the cowl a nozzle and an exhaust plug.
 */
interface NacelleSpec {
  c: P2;
  front: number;
  back: number;
  r: number;
  nozzle: number; // the nozzle's length behind the cowl
  plug: number; // how far the plug sticks out of the nozzle
  mats: { cowl: string; lip: string; duct: string; fan: string; nozzle: string; plug: string };
}

function nacelle(m: MeshBuilder, axis: SweepAxis, dir: number, n: NacelleSpec, sides = 20): void {
  const len = Math.abs(n.front - n.back);
  const a = (f: number): number => n.front - dir * f * len;
  const ring = (rr: number): Sec => circle(sides, n.c[0], n.c[1], rr);
  m.scope("cowl", () => {
    const prof: Array<[number, number]> = [[0, 0.84], [0.05, 0.95], [0.16, 1], [0.6, 1], [0.86, 0.93], [1, 0.82]];
    body(m, n.mats.cowl, axis, prof.map(([f, k]) => ({ a: a(f), sec: ring(n.r * k) })));
  });
  m.scope("intake", () => {
    annulus(m, n.mats.lip, axis, ring(n.r * 0.84), ring(n.r * 0.7), n.front, dir);
    const depth = a(0.12);
    body(m, n.mats.duct, axis, [{ a: n.front, sec: ring(n.r * 0.7) }, { a: depth, sec: ring(n.r * 0.7) }]);
    fan(m, n.mats.fan, axis, ring(n.r * 0.7), depth, dir);
    fan(m, n.mats.lip, axis, ring(n.r * 0.2), depth + dir * 0.01, dir, at(axis, depth + dir * n.r * 0.32, n.c));
  });
  m.scope("exhaust", () => {
    const end = n.back - dir * n.nozzle;
    annulus(m, n.mats.nozzle, axis, ring(n.r * 0.82), ring(n.r * 0.7), n.back, -dir);
    body(m, n.mats.nozzle, axis, [{ a: n.back, sec: ring(n.r * 0.7) }, { a: end, sec: ring(n.r * 0.6) }]);
    annulus(m, n.mats.duct, axis, ring(n.r * 0.6), ring(n.r * 0.36), end, -dir);
    fan(m, n.mats.plug, axis, ring(n.r * 0.36), end, -dir, at(axis, end - dir * n.plug, n.c));
  });
}

// --- the Aero A.10 ---------------------------------------------------------------------
//
// Czechoslovakia's first airliner (1922): a fabric-covered biplane, 10.0 m long
// and 14.7 m across, nose at +Z. A boxy fuselage with a four-seat cabin (four
// round-topped windows a side), an aluminium engine cowling with louvres,
// radiators on the flanks, a two-blade walnut propeller, an open cockpit behind
// the cabin, two straight wings on N-struts and wire bracing, a cruciform tail,
// a fixed V-strut undercarriage and a tail skid. The aircraft stands level.

/** (z, half-width, bottom, top, height of the widest point). */
const A10_FUSELAGE: Array<[number, number, number, number, number]> = [
  [-5.45, 0.05, 2.21, 2.63, 2.42], [-4.7, 0.17, 2.09, 2.67, 2.38], [-3.4, 0.31, 1.88, 2.72, 2.3],
  [-2.1, 0.43, 1.68, 2.74, 2.21], [-0.6, 0.53, 1.47, 2.78, 2.13], [0.6, 0.57, 1.36, 2.8, 2.08],
  [1.9, 0.58, 1.35, 2.81, 2.08], [2.7, 0.565, 1.37, 2.77, 2.07], [3.1, 0.55, 1.4, 2.72, 2.06],
];
const A10_COWL: Array<[number, number, number, number, number]> = [
  [3.04, 0.555, 1.39, 2.73, 2.06], [3.6, 0.52, 1.5, 2.66, 2.08], [4.15, 0.46, 1.63, 2.59, 2.11], [4.45, 0.35, 1.77, 2.49, 2.13],
];
/** The wings: (span, leading edge, chord, thickness, chord height) at the root and towards the rounded tip. */
const A10_LOWER = { y: 1.48, lead: 1.1, chord: 2.1, thick: 0.36, span: 6.97 };
const A10_UPPER = { y: 3.63, lead: 1.41, chord: 2.1, thick: 0.36, span: 7.34 };
/** The interplane struts: span stations, and the front and rear spar positions (z at the lower, upper wing). */
const A10_BAYS = [2.55, 5.3];
const A10_PROP: Vec3 = [0, 2.13, 4.545];

function a10Stations(rows: Array<[number, number, number, number, number]>, n: number, e: number): Station[] {
  return rows.map(([z, hw, lo, hi, mw]) => ({ a: z, sec: oval(n, 0, mw, hw, hi - mw, mw - lo, e) }));
}

function a10Wing(m: MeshBuilder, w: typeof A10_LOWER): void {
  // a straight wing whose last metre rounds off in plan: the chord shrinks
  // from both edges, the leading edge more
  const tip: Array<[number, number, number]> = [[0.62, 0, 0], [0.3, 0.06, 0.03], [0.12, 0.2, 0.08], [0, 0.42, 0.2]];
  const st: WingStation[] = [];
  for (const s of [-1, 1]) {
    const half = tip.map(([d, le, te]): WingStation => ({
      s: s * (w.span - d), lead: w.lead - le, chord: w.chord - le - te, thick: w.thick * (1 - (le + te) * 0.9), mid: w.y,
    }));
    st.push(...(s < 0 ? half.reverse() : half));
  }
  wing(m, "fabric", "x", st);
}

/** The lower and upper wing's spar z at the strut stations: (front, rear). */
const A10_SPARS = { lower: [0.81, -0.36], upper: [0.81, -0.36] };

export function aeroA10(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const fus = a10Stations(A10_FUSELAGE, 20, 3.2);
  const cowl = a10Stations(A10_COWL, 20, 3.6);
  const lowerTop = A10_LOWER.y + A10_LOWER.thick * 0.45;
  const upperBot = A10_UPPER.y - A10_UPPER.thick * 0.4;

  m.scope("fuselage", () => {
    m.scope("skin", () => {
      body(m, "fabric", "z", fus);
      fan(m, "fabric", "z", fus[0]!.sec, fus[0]!.a, -1);
    });
    m.scope("cabin windows", () => {
      // four round-topped windows a side (the photo), 0.44 wide
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (const z0 of [-0.05, 0.6, 1.25, 1.9]) {
          const outline: P2[] = [[z0, 2.16], [z0 + 0.44, 2.16], [z0 + 0.44, 2.4], [z0 + 0.4, 2.5], [z0 + 0.3, 2.555], [z0 + 0.14, 2.555], [z0 + 0.04, 2.5], [z0, 2.4]];
          pts.push(...skinDecal("z", fus, outline, s, 0.008));
        }
        m.facets("slot", pts, [s, 0, 0]);
      }
    });
    m.scope("cockpit", () => {
      // the pilot's open cockpit behind the cabin, a dark opening in the deck
      m.facets("slot", gridTris((u, v) => skinAng("z", fus, lerp(-1.65, -1.05, u), lerp(0.95, 2.19, v), 0.008), 2, 4), [0, 1, 0]);
      m.slab("glass", [[-0.33, 2.74, -0.97], [0.33, 2.74, -0.97], [0.3, 2.9, -1.04], [-0.3, 2.9, -1.04]], [0, 0, -0.025]);
    });
    m.scope("tail skid", () => rod(m, "walnut", [0, 2.12, -4.35], [0, 1.82, -5.1], 0.045, 4));
  });

  m.scope("engine", () => {
    m.scope("cowling", () => {
      body(m, "aluminium", "z", cowl);
      fan(m, "aluminium", "z", cowl[cowl.length - 1]!.sec, 4.45, 1);
    });
    m.scope("louvres", () => {
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (let i = 0; i < 9; i++) {
          const z = 3.2 + i * 0.116;
          pts.push(...skinDecal("z", cowl, [[z, 2.1], [z + 0.035, 2.1], [z + 0.035, 2.4], [z, 2.4]], s, 0.006, 3));
        }
        m.facets("slot", pts, [s, 0, 0]);
      }
    });
    m.scope("radiators", () => {
      for (const s of [-1, 1]) block(m, "radiator", s > 0 ? 0.45 : -0.6, s > 0 ? 0.6 : -0.45, 2.04, 2.56, 2.32, 2.72);
    });
    m.scope("exhaust pipe", () => {
      const p = circle(8, -0.53, 1.72, 0.05);
      m.sweep("steel", "z", p, 2.7, p, 4.2);
    });
  });

  m.scope("propeller", () => {
    const [px, py, pz] = A10_PROP;
    m.scope("spinner", () => {
      const r = circle(12, px, py, 0.16);
      body(m, "steel", "z", [{ a: 4.42, sec: r }, { a: 4.52, sec: r }]);
      fan(m, "steel", "z", r, 4.52, 1, [px, py, 4.64]);
    });
    m.scope("blades", () => {
      // two walnut blades, broadest at two thirds of the radius, twisted from
      // 33 degrees of pitch at the root to 14 at the tip
      const blade = (h: number, chord: number, thick: number): Ring => {
        const pitch = 0.58 - 0.24 * h;
        return ccw(foil(chord / 2, chord, thick, 0).map(([u, t]): [number, number] => [
          px + u * Math.cos(pitch) - t * Math.sin(pitch), pz + u * Math.sin(pitch) + t * Math.cos(pitch),
        ]));
      };
      const span: Array<[number, number, number]> = [[0.1, 0.12, 0.08], [0.55, 0.2, 0.06], [1.0, 0.22, 0.045], [1.3, 0.15, 0.035], [1.42, 0.06, 0.02]];
      for (const s of [1, -1]) {
        const rings = span.map(([h, c, t]): [number, Ring] => [py + s * h, blade(h, c, t)]);
        if (s < 0) rings.reverse();
        for (let i = 0; i + 1 < rings.length; i++) m.loft("walnut", rings[i]![1], rings[i]![0], rings[i + 1]![1], rings[i + 1]![0], s > 0 && i + 2 === rings.length);
        if (s < 0) m.cap("walnut", rings[0]![1], rings[0]![0], false);
      }
    });
  });

  m.scope("wings", () => {
    m.scope("lower wing", () => a10Wing(m, A10_LOWER));
    m.scope("upper wing", () => a10Wing(m, A10_UPPER));
    m.scope("interplane struts", () => {
      for (const s of [-1, 1]) {
        for (const x of A10_BAYS) {
          for (const k of [0, 1]) {
            const zl = A10_SPARS.lower[k]!;
            const zu = A10_SPARS.upper[k]! + (k ? -0.1 : 0.05);
            rod(m, "steel", [s * x, lowerTop - 0.05, zl], [s * x, upperBot + 0.05, zu], 0.05, 6);
          }
        }
      }
    });
    m.scope("cabane struts", () => {
      for (const s of [-1, 1]) {
        rod(m, "steel", [s * 0.42, 2.7, 0.9], [s * 0.65, upperBot + 0.05, 1.5], 0.04, 6);
        rod(m, "steel", [s * 0.42, 2.7, 0.9], [s * 0.65, upperBot + 0.05, 0.4], 0.04, 6);
        rod(m, "steel", [s * 0.42, 2.66, -0.2], [s * 0.65, upperBot + 0.05, -0.2], 0.04, 6);
      }
    });
    m.scope("bracing wires", () => {
      // an X of wires in the front and rear plane of each bay, wires from the
      // fuselage to the inner struts, and a wire out to each tip
      const wire = (p: Vec3, q: Vec3): void => rod(m, "steel", p, q, 0.012, 4);
      for (const s of [-1, 1]) {
        for (const k of [0, 1]) {
          const z = (A10_SPARS.lower[k]! + A10_SPARS.upper[k]!) / 2 + (k ? -0.04 : 0.02);
          const bays: Array<[number, number]> = [[0.6, A10_BAYS[0]!], [A10_BAYS[0]!, A10_BAYS[1]!]];
          for (const [x0, x1] of bays) {
            wire([s * x0, lowerTop, z], [s * x1, upperBot, z]);
            wire([s * x0, upperBot, z], [s * x1, lowerTop, z]);
          }
        }
        wire([s * A10_BAYS[1]!, upperBot, 0.85], [s * 6.9, A10_UPPER.y, 0.6]);
        wire([s * A10_BAYS[1]!, lowerTop, 0.7], [s * 6.5, A10_LOWER.y, 0.3]);
      }
    });
  });

  m.scope("tail", () => {
    m.scope("tailplane", () => {
      const st: WingStation[] = [];
      for (const s of [-1, 1]) {
        const half: WingStation[] = [
          { s: s * 2.24, lead: -4.35, chord: 0.55, thick: 0.05, mid: 2.375 },
          { s: s * 2.05, lead: -4.05, chord: 1.1, thick: 0.12, mid: 2.375 },
          { s: s * 1.5, lead: -3.91, chord: 1.28, thick: 0.18, mid: 2.375 },
        ];
        st.push(...(s < 0 ? half : half.reverse()));
      }
      wing(m, "fabric", "x", st);
    });
    m.scope("fin and rudder", () => {
      fin(m, "fabric", "z", [
        [2.4, -4.01, 1.44, 0.18, 0], [3.3, -4.45, 1.14, 0.16, 0], [3.75, -4.85, 0.74, 0.12, 0], [3.99, -5.12, 0.3, 0.06, 0],
      ]);
    });
    m.scope("tail bracing", () => {
      for (const s of [-1, 1]) {
        rod(m, "steel", [s * 1.6, 2.42, -4.6], [s * 0.06, 3.6, -4.65], 0.012, 4);
        rod(m, "steel", [s * 1.05, 2.3, -4.45], [s * 0.2, 2.12, -4.45], 0.025, 4);
      }
    });
  });

  m.scope("undercarriage", () => {
    const zc = 1.15;
    const r = 0.46;
    const yc = axleY(0, r);
    m.scope("axle", () => {
      const p = circle(8, zc, yc, 0.055);
      m.sweep("steel", "x", p, -1.1, p, 1.1);
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right leg" : "left leg", () => {
        rod(m, "steel", [s * 0.46, 1.42, 1.93], [s * 0.98, yc, zc], 0.045, 6);
        rod(m, "steel", [s * 0.46, 1.42, 0.37], [s * 0.98, yc, zc], 0.045, 6);
        rod(m, "steel", [s * 0.4, 1.42, 1.15], [-s * 0.9, yc + 0.03, zc], 0.025, 4);
      });
      m.scope(s > 0 ? "right wheel" : "left wheel", () => {
        const [a0, a1] = s > 0 ? [0.92, 1.14] : [-1.14, -0.92];
        wheel(m, "x", a0, a1, [zc, yc], r, 0.33, "fabric", 20);
      });
    }
  });
  return m;
}

// --- the Airbus A380 ------------------------------------------------------------------
//
// The double-deck airliner at its real size (72.7 m long here as in the
// reference, 78.9 m span, 23.5 m tall), nose at +Z. A tall oval fuselage with
// two rows of windows and the doors, the cockpit glazing below the upper deck,
// a belly fairing, a cranked swept wing with dihedral, four engines with their
// pylons, wingtip fences and flap-track fairings, the tailplane and the fin in
// the reference's neutral navy livery (the photo's airline livery is not
// copied). The gear -- a twin-wheel nose leg, two four-wheel wing bogies and two
// six-wheel body bogies -- is the part "gear", the rest is "airframe".

/** (z, half-width, bottom, top, height of the widest point), measured off the reference. */
const A380_FUSELAGE: Array<[number, number, number, number, number]> = [
  [-36.3, 0.16, 8.61, 8.99, 8.8], [-35.4, 0.54, 7.98, 9.24, 8.61], [-34, 0.96, 7.2, 9.46, 8.33],
  [-32, 1.46, 6.24, 9.69, 7.96], [-30, 1.89, 5.41, 9.86, 7.64], [-28, 2.28, 4.66, 10.03, 7.35],
  [-26, 2.64, 3.99, 10.2, 7.09], [-24, 2.93, 3.44, 10.33, 6.88], [-22, 3.18, 2.97, 10.45, 6.71],
  [-20, 3.37, 2.6, 10.54, 6.57], [-18, 3.5, 2.36, 10.59, 6.48], [-16, 3.57, 2.22, 10.62, 6.42],
  [23, 3.57, 2.2, 10.6, 6.4], [25.5, 3.53, 2.24, 10.56, 6.4], [28, 3.41, 2.39, 10.41, 6.4],
  [30, 3.18, 2.61, 10.09, 6.35], [31.5, 2.89, 2.85, 9.65, 6.25], [33, 2.5, 3.15, 9.03, 6.09],
  [34.3, 2.02, 3.54, 8.28, 5.91], [35.3, 1.43, 4.06, 7.42, 5.74], [36, 0.8, 4.67, 6.56, 5.61],
];
const A380_NOSE: Vec3 = [0, 5.6, 36.3];
const A380_WING: WingStation[] = [
  { s: 0, lead: 6.5, chord: 17.7, thick: 2.58, mid: 3.45 },
  { s: 4.5, lead: 2.1, chord: 13.7, thick: 2.16, mid: 3.9 },
  { s: 11.5, lead: -2.25, chord: 10.2, thick: 1.72, mid: 4.55 },
  { s: 25.9, lead: -11.4, chord: 6.2, thick: 0.99, mid: 6.0 },
  { s: 35.8, lead: -17.7, chord: 3.7, thick: 0.55, mid: 6.97 },
  { s: 39.43, lead: -20.1, chord: 2.7, thick: 0.39, mid: 7.32 },
];
/** The engines: x, height of the axis, intake z. */
const A380_ENGINES: Array<[number, number, number]> = [[12.6, 2.45, 4.27], [22.6, 3.49, -2.05]];
const A380_ENGINE_R = 1.68;

/** The A380's fuselage stations. */
function a380Fuselage(): Station[] {
  return A380_FUSELAGE.map(([z, hw, lo, hi, mw]) => ({ a: z, sec: oval(32, 0, mw, hw, hi - mw, mw - lo, 2.1) }));
}

function a380Airframe(m: MeshBuilder): void {
  const fus = a380Fuselage();
  m.scope("fuselage", () => {
    m.scope("skin", () => {
      body(m, "white", "z", fus);
      fan(m, "white", "z", fus[fus.length - 1]!.sec, 36, 1, A380_NOSE);
      fan(m, "white", "z", fus[0]!.sec, -36.3, -1);
    });
    m.scope("cabin windows", () => {
      // two decks of windows, every 1.05 m (the reference has one every 1.62,
      // the photo shows them close-set), broken at the doors
      const decks: Array<{ y: number; z0: number; z1: number; doors: number[] }> = [
        { y: 5.85, z0: -27, z1: 29.6, doors: [-25.5, -14.5, 2.0, 17.5, 28.4] },
        { y: 8.25, z0: -21, z1: 25.6, doors: [-17.5, 4.5, 24.3] },
      ];
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (const d of decks) {
          for (let z = d.z0; z <= d.z1; z += 1.05) {
            if (d.doors.some((dz) => Math.abs(z - dz) < 1.3)) continue;
            const outline = ovalOutline(z, d.y, 0.2, 0.27, 8);
            pts.push(...skinDecal("z", fus, outline, s, 0.03, 2));
          }
        }
        m.facets("glass", pts, [s, 0, 0]);
      }
    });
    m.scope("doors", () => {
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        const door = (z: number, y0: number): void => {
          pts.push(...gridTris((u, v) => skinY("z", fus, lerp(z - 0.55, z + 0.55, u), lerp(y0, y0 + 1.95, v), s, 0.025), 1, 2));
        };
        for (const z of [-25.5, -14.5, 2.0, 17.5, 28.4]) door(z, 4.75);
        for (const z of [-17.5, 4.5, 24.3]) door(z, 7.3);
        m.facets("door", pts, [s, 0, 0]);
      }
    });
    m.scope("cockpit windows", () => {
      // two side panes a side, then the windscreen wrapping onto the nose
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (const [z0, z1] of [[29.7, 30.75], [30.95, 32.0]] as Array<[number, number]>) {
          pts.push(...gridTris((u, v) => skinY("z", fus, lerp(z0, z1, u), lerp(7.85, 8.5, v), s, 0.04), 2, 2));
        }
        m.facets("glass", pts, [s, 0, 0]);
        const screen = gridTris((u, v) => skinEnd("z", fus, s * lerp(1.85, 0.1, u), lerp(7.8, 8.4, v), 30, 36.3, 0.05), 4, 2);
        m.facets("glass", screen, [s * 0.5, 0.3, 0.8]);
      }
    });
    m.scope("belly fairing", () => {
      const st: Station[] = [
        [-12.4, 0.2, 0.3], [-11, 1.6, 0.9], [-8, 2.7, 1.35], [-3.4, 3.1, 1.5], [1.5, 2.9, 1.45], [4.4, 2.0, 1.0], [5.6, 0.3, 0.3],
      ].map(([z, hw, dy]) => ({ a: z!, sec: oval(16, 0, 2.95, hw!, dy!, dy!) }));
      body(m, "belly", "z", st);
      fan(m, "belly", "z", st[0]!.sec, -12.4, -1);
      fan(m, "belly", "z", st[st.length - 1]!.sec, 5.6, 1);
    });
    m.scope("wing root fairings", () => {
      for (const s of [-1, 1]) {
        const st: Station[] = [
          [-14.7, 0.3, 0.3], [-12, 0.95, 1.0], [-6, 1.2, 1.3], [2, 1.15, 1.25], [6.5, 0.8, 0.9], [8.3, 0.2, 0.2],
        ].map(([z, hw, dy]) => ({ a: z!, sec: oval(12, s * 2.95, 4.2, hw!, dy!, dy!) }));
        body(m, "white", "z", st);
        fan(m, "white", "z", st[0]!.sec, -14.7, -1);
        fan(m, "white", "z", st[st.length - 1]!.sec, 8.3, 1);
      }
    });
    m.scope("APU exhaust", () => {
      const r = circle(10, 0, 8.8, 0.4);
      m.sweep("alloy", "z", r, -37.6, r, -36.0);
    });
  });

  m.scope("wings", () => {
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right wing" : "left wing", () => {
        m.scope("wing", () => wing(m, "alloy", "x", A380_WING.map((w) => ({ ...w, s: s * w.s }))));
        m.scope("wingtip fence", () => {
          const outline: Array<[number, number]> = [[-20.12, 7.3], [-21.6, 6.63], [-22.68, 6.75], [-22.68, 8.66], [-21.9, 8.4]];
          const x0 = s > 0 ? 38.98 : -39.24;
          m.slab("alloy", outline.map(([z, y]): Vec3 => [x0, y, z]), [0.26, 0, 0]);
        });
        m.scope("flap track fairings", () => {
          for (const x of [7.5, 16.5, 23.5, 30.5]) {
            const w = wingAt(A380_WING, x);
            const te = w.lead - w.chord;
            const yb = w.mid - w.thick * 0.42;
            const len = Math.min(6, w.chord * 0.75);
            const st: Station[] = [
              [te + len * 0.55, 0.12], [te + len * 0.3, 0.32], [te - len * 0.05, 0.36], [te - len * 0.45, 0.06],
            ].map(([z, r]) => ({ a: z!, sec: oval(6, 0, yb - 0.25 * r! / 0.36, r! * 0.75, r!, r!) }));
            const st2 = st.map((t) => ({ a: t.a, sec: t.sec.map(([u, y]): P2 => [u + s * x, y]) }));
            body(m, "alloy", "z", st2);
            fan(m, "alloy", "z", st2[0]!.sec, st2[0]!.a, 1);
            fan(m, "alloy", "z", st2[3]!.sec, st2[3]!.a, -1);
          }
        });
        A380_ENGINES.forEach(([x, y, z], i) => m.scope(`engine ${i + 1}`, () => {
          nacelle(m, "z", 1, {
            c: [s * x, y], front: z, back: z - 5.0, r: A380_ENGINE_R, nozzle: 2.5, plug: 1.4,
            mats: { cowl: "white", lip: "alloy", duct: "glass", fan: "glass", nozzle: "alloy", plug: "navy" },
          }, 24);
          m.scope("pylon", () => {
            const w = wingAt(A380_WING, x);
            const yb = w.mid - w.thick * 0.3;
            const sec: Sec = [[z - 1.9, y + 1.5], [w.lead - w.chord * 0.6, yb - 0.1], [w.lead - w.chord * 0.6, yb + 0.25], [w.lead - 0.4, yb + 0.55]];
            m.sweep("white", "x", sec, s * x - 0.25, sec, s * x + 0.25);
          });
        }));
      });
    }
  });

  m.scope("tail", () => {
    m.scope("tailplane", () => {
      const half: WingStation[] = [
        { s: 0, lead: -24.4, chord: 7.8, thick: 1.14, mid: 7.45 },
        { s: 15.15, lead: -35.0, chord: 3.0, thick: 0.3, mid: 8.82 },
      ];
      for (const s of [-1, 1]) wing(m, "alloy", "x", half.map((w) => ({ ...w, s: s * w.s })));
    });
    m.scope("fin", () => {
      fin(m, "navy", "z", [[8.5, -22.8, 12.9, 1.5, 0], [16.0, -27.9, 8.6, 1.0, 0], [23.5, -32.9, 4.9, 0.5, 0]]);
    });
  });
}

function a380Gear(m: MeshBuilder): void {
  const tyreN = 16;
  m.scope("nose gear", () => {
    const r = 0.62;
    const yc = axleY(0, r, tyreN);
    rod(m, "alloy", [0, 2.7, 25.0], [0, yc, 25.0], 0.2, 8);
    const ax = circle(8, 25.0, yc, 0.1);
    m.sweep("alloy", "x", ax, -0.3, ax, 0.3);
    for (const s of [-1, 1]) wheel(m, "x", ...(s > 0 ? [0.3, 0.8] : [-0.8, -0.3]) as [number, number], [25.0, yc], r, 0.3, "alloy", tyreN);
  });
  const bogie = (name: string, x: number, top: number, axles: number[]): void => {
    m.scope(name, () => {
      const r = 0.72;
      const yc = axleY(0, r, tyreN);
      const zc = (axles[0]! + axles[axles.length - 1]!) / 2;
      rod(m, "alloy", [x, top, zc], [x, yc + 0.3, zc], 0.3, 8);
      block(m, "alloy", x - 0.18, x + 0.18, yc - 0.06, yc + 0.3, axles[axles.length - 1]! - 0.45, axles[0]! + 0.45);
      for (const z of axles) {
        const ax = circle(8, z, yc, 0.1);
        m.sweep("alloy", "x", ax, x - 0.75, ax, x + 0.75);
        wheel(m, "x", x - 0.97, x - 0.47, [z, yc], r, 0.32, "alloy", tyreN);
        wheel(m, "x", x + 0.47, x + 0.97, [z, yc], r, 0.32, "alloy", tyreN);
      }
    });
  };
  for (const s of [-1, 1]) {
    const side = s > 0 ? "right" : "left";
    bogie(`${side} wing gear`, s * 10.6, 3.8, [-4.4, -6.0]);
    bogie(`${side} body gear`, s * 4.1, 2.6, [-0.8, -2.4, -4.0]);
  }
}

export function airbusA380(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part("airframe", [0, 0, 0], () => a380Airframe(m));
  m.part("gear", [0, 0, 0], () => a380Gear(m));
  return m;
}

// --- the light jet ------------------------------------------------------------------------
//
// A Learjet-like business jet, 17.6 m long and 15.3 m across, nose at +X and
// wings along Z. A slender round fuselage with a drooped nose and a raked
// windscreen, seven oval windows a side and a red cheatline (the photo), a low
// swept wing with red-striped winglets, two engines on pylons on the rear
// fuselage, a red T-tail with a bullet fairing, and ventral strakes. Its datum
// is the reference's: the fuselage axis on y = 0, the tall gear (the part "gear")
// reaching down to y = -2.55 under the airframe (the part "airframe").

/** (x, radius) of the fuselage, measured off the reference. */
const JET_FUSELAGE: Array<[number, number]> = [
  [-8.62, 0.12], [-8.2, 0.26], [-7.4, 0.46], [-6.4, 0.64], [-5.2, 0.78], [-3.9, 0.87], [-2.7, 0.9],
  [2.7, 0.9], [4.1, 0.86], [5.3, 0.79], [6.3, 0.7], [7.1, 0.62], [7.75, 0.51], [8.2, 0.4], [8.52, 0.28], [8.7, 0.16],
];
/** The nose droops: the section centre's height at x. */
const jetDroop = (x: number): number => -0.2 * Math.pow(Math.max(0, (x - 4.5) / 4.3), 1.6);
const JET_WING: WingStation[] = [
  { s: 0, lead: -0.75, chord: 3.09, thick: 0.28, mid: -0.5 },
  { s: 2.6, lead: -1.3, chord: 2.62, thick: 0.25, mid: -0.38 },
  { s: 7.2, lead: -2.64, chord: 1.16, thick: 0.13, mid: -0.12 },
];
const JET_NACELLE = { x0: -3.05, x1: -5.9, y: 0.52, z: 1.72, r: 0.64 };

function jetFuselage(): Station[] {
  return JET_FUSELAGE.map(([x, r]) => ({ a: x, sec: circle(24, 0, jetDroop(x), r) }));
}

function jetAirframe(m: MeshBuilder): void {
  const fus = jetFuselage();
  m.scope("fuselage", () => {
    m.scope("skin", () => {
      body(m, "paint", "x", fus);
      fan(m, "paint", "x", fus[fus.length - 1]!.sec, 8.7, 1, [8.8, jetDroop(8.8), 0]);
    });
    m.scope("tailcone", () => fan(m, "darkGrey", "x", fus[0]!.sec, -8.62, -1, [-8.8, 0, 0]));
    m.scope("windows", () => {
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (let i = 0; i < 7; i++) {
          const x = 1.85 - i * 0.88;
          pts.push(...skinDecal("x", fus, ovalOutline(x, 0.3, 0.14, 0.19, 10), s, 0.012, 3));
        }
        m.facets("glass", pts, [0, 0, s]);
      }
    });
    m.scope("windscreen", () => {
      for (const s of [-1, 1]) {
        // the side pane, raked at the front, and the windscreen on the nose
        const side: P2[] = [[4.72, 0.22], [5.62, 0.22], [5.45, 0.56], [4.72, 0.58]];
        m.facets("glass", skinDecal("x", fus, side, s, 0.012, 3, 3), [0, 0, s]);
        // up the nose from the side pane to a narrow centre post; the angle is
        // measured from the side (+z for s = 1) towards the top
        const deg = Math.PI / 180;
        const screen = gridTris((u, v) => {
          const ang = lerp(lerp(19, 34, u), lerp(84, 85, u), v) * deg;
          return skinAng("x", fus, lerp(5.72, 6.55, u), s > 0 ? ang : Math.PI - ang, 0.012);
        }, 4, 4);
        m.facets("glass", screen, [0.5, 0.6, s * 0.6]);
      }
    });
    m.scope("cheatline", () => {
      // the photo's red line along the cabin, below the windows
      const xs = [7.6, 7.1, 6.3, 5.3, 4.1, 2.7, -2.7, -3.9, -5.2, -6.4, -7.0];
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        for (let i = 0; i + 1 < xs.length; i++) {
          const [a0, a1] = [xs[i]!, xs[i + 1]!];
          const y0 = (x: number): number => -0.16 + jetDroop(x) * 0.5;
          pts.push(...fanTris([skinY("x", fus, a0, y0(a0), s, 0.01), skinY("x", fus, a1, y0(a1), s, 0.01), skinY("x", fus, a1, y0(a1) + 0.07, s, 0.01), skinY("x", fus, a0, y0(a0) + 0.07, s, 0.01)]));
        }
        m.facets("red", pts, [0, 0, s]);
      }
    });
    m.scope("wing fairing", () => {
      const st: Station[] = [[-4.46, 0.2, 0.12], [-3.9, 1.2, 0.42], [-1.1, 1.25, 0.45], [-0.33, 0.25, 0.12]]
        .map(([x, hw, dy]) => ({ a: x!, sec: oval(12, 0, -0.66, hw!, dy!, dy!) }));
      body(m, "paint", "x", st);
      fan(m, "paint", "x", st[0]!.sec, -4.46, -1);
      fan(m, "paint", "x", st[3]!.sec, -0.33, 1);
    });
    m.scope("dorsal antenna", () => m.slab("paint", [[-0.95, 0.82, 0], [-1.25, 1.03, 0], [-1.55, 1.03, 0], [-1.6, 0.82, 0]], [0, 0, 0.04]));
    m.scope("ventral strakes", () => {
      for (const s of [-1, 1]) {
        // a flat plate leaning out and down from the tailcone's underside
        plate(m, "paint", [-6.37, -0.45, s * 0.3], [-1, 0, 0], [0, -0.6, s * 0.8], [[0, 0], [1.51, 0], [1.51, 0.18], [0.75, 0.5]], 0.04);
      }
    });
  });

  m.scope("wings", () => {
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right wing" : "left wing", () => {
        m.scope("wing", () => wing(m, "paint", "z", JET_WING.map((w) => ({ ...w, s: s * w.s }))));
        m.scope("winglet", () => {
          // canted outward, striped red as in the photo
          const ring = (y: number, lead: number, chord: number, thick: number, z: number): [number, number, number, number, number] => [y, lead, chord, thick, s * z];
          const rings = [ring(-0.15, -2.58, 1.2, 0.16, 7.08), ring(0.5, -2.95, 0.74, 0.13, 7.37), ring(0.85, -3.13, 0.56, 0.11, 7.49), ring(1.17, -3.26, 0.47, 0.1, 7.6)];
          const finRings = (rs: typeof rings, mat: string, top: boolean): void => {
            for (let i = 0; i + 1 < rs.length; i++) {
              const toRing = ([, lead, chord, thick, z]: [number, number, number, number, number]): Ring => ccw(foil(lead, chord, thick, z).map(([u, t]): [number, number] => [u, t]));
              m.loft(mat, toRing(rs[i]!), rs[i]![0], toRing(rs[i + 1]!), rs[i + 1]![0], top && i + 2 === rs.length);
            }
          };
          finRings([rings[0]!, rings[1]!], "paint", false);
          finRings([rings[1]!, rings[2]!], "red", false);
          finRings([rings[2]!, rings[3]!], "paint", true);
        });
      });
    }
  });

  m.scope("engines", () => {
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right engine" : "left engine", () => {
        const n = JET_NACELLE;
        nacelle(m, "x", 1, {
          c: [s * n.z, n.y], front: n.x0, back: n.x1, r: n.r, nozzle: 0.55, plug: 0.25,
          mats: { cowl: "paint", lip: "metalGrey", duct: "darkGrey", fan: "metalGrey", nozzle: "darkGrey", plug: "metalGrey" },
        }, 20);
        m.scope("pylon", () => {
          const sec: Sec = [[-2.84, 0.5], [-3.4, 0.74], [-4.51, 0.68], [-4.51, 0.36], [-3.6, 0.34]];
          m.sweep("paint", "z", sec, s * 0.6, sec, s * 1.4);
        });
      });
    }
  });

  m.scope("tail", () => {
    m.scope("fin", () => {
      fin(m, "red", "x", [[0.35, -4.4, 3.55, 0.4, 0], [1.1, -5.15, 2.87, 0.36, 0], [3.3, -6.7, 1.18, 0.26, 0]]);
    });
    m.scope("tail bullet", () => {
      const st: Station[] = [[-8.23, 0.06], [-7.95, 0.22], [-7.5, 0.29], [-6.95, 0.27], [-6.6, 0.15]].map(([x, r]) => ({ a: x!, sec: circle(14, 0, 3.32, r!) }));
      body(m, "paint", "x", st);
      fan(m, "paint", "x", st[0]!.sec, -8.23, -1);
      fan(m, "paint", "x", st[4]!.sec, -6.6, 1, [-6.47, 3.32, 0]);
    });
    m.scope("tailplane", () => {
      const half: WingStation[] = [
        { s: 0, lead: -6.72, chord: 1.52, thick: 0.22, mid: 3.3 },
        { s: 2.59, lead: -7.5, chord: 0.64, thick: 0.12, mid: 3.39 },
      ];
      for (const s of [-1, 1]) wing(m, "paint", "z", half.map((w) => ({ ...w, s: s * w.s })));
    });
  });
}

function jetGear(m: MeshBuilder): void {
  const ground = -2.55;
  m.scope("nose gear", () => {
    const r = 0.27;
    const yc = axleY(ground, r);
    rod(m, "metalGrey", [5.35, -0.5, 0], [5.24, yc, 0], 0.06, 8);
    rod(m, "darkGrey", [5.31, -1.04, 0], [5.29, -1.52, 0], 0.095, 8);
    const ax = circle(8, 5.24, yc, 0.04);
    m.sweep("metalGrey", "z", ax, -0.1, ax, 0.1);
    for (const s of [-1, 1]) wheel(m, "z", ...(s > 0 ? [0.07, 0.21] : [-0.21, -0.07]) as [number, number], [5.24, yc], r, 0.13, "metalGrey");
    m.scope("door", () => m.slab("paint", [[4.22, -0.86, 0.3], [5.65, -0.86, 0.3], [5.65, -0.3, 0.3], [4.22, -0.22, 0.3]], [0, 0, 0.03]));
  });
  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "right main gear" : "left main gear", () => {
      const r = 0.35;
      const yc = axleY(ground, r);
      const z = s * 1.62;
      rod(m, "metalGrey", [-1.76, -0.5, z], [-1.82, yc, z], 0.085, 8);
      rod(m, "darkGrey", [-1.76, -1.16, z], [-1.77, -1.68, z], 0.13, 8);
      rod(m, "metalGrey", [-1.75, -0.85, s * 1.1], [-1.76, -1.5, s * 1.58], 0.04, 6);
      const ax = circle(8, -1.82, yc, 0.05);
      m.sweep("metalGrey", "z", ax, s > 0 ? 1.45 : -1.79, ax, s > 0 ? 1.79 : -1.45);
      wheel(m, "z", ...(s > 0 ? [1.5, 1.74] : [-1.74, -1.5]) as [number, number], [-1.82, yc], r, 0.17, "metalGrey");
      m.scope("door", () => m.slab("paint", [[-2.93, -1.07, s * 1.92], [-1.34, -1.07, s * 1.92], [-1.34, -0.34, s * 1.92], [-2.93, -0.34, s * 1.92]], [0, 0, s * 0.03]));
    });
  }
}

export function lightJet(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part("airframe", [0, 0, 0], () => jetAirframe(m));
  m.part("gear", [0, 0, 0], () => jetGear(m));
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const AIRCRAFT_CATALOG: CatalogFields = {
  category: "Aircraft",
  group: "aircraft",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const AIRCRAFT: ProceduralDesign[] = [
  { id: "proc-vehicle-aero-a10", title: "Aero A.10", build: aeroA10, references: "aero-a10", catalog: { ...AIRCRAFT_CATALOG, yaw:270 } },
  { id: "proc-vehicle-airbus-a380", title: "Airbus A380", build: airbusA380, references: "airbus-a380", catalog: { ...AIRCRAFT_CATALOG, yaw:270 } },
  { id: "proc-vehicle-light-jet", title: "Light Jet", build: lightJet, references: "light-jet", catalog: { ...AIRCRAFT_CATALOG, yaw:180 } },
];
