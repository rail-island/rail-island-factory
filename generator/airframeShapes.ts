// The airframe shapes (docs/models/world-aircraft.md): the bodies, decals, rods,
// wings, fins, wheels, nacelles, liveries and two-lobe sections the procedural
// aircraft are drawn with, extracted from aircraft.ts for the airframe kit
// (airframeKit.ts) and the rotor kit (rotorKit.ts).
//
// The code is a copy of aircraft.ts's helpers, unchanged: aircraft.ts keeps its
// own, so the eight original aircraft's GLBs and standalone JS models stay
// byte-identical (exporting them from aircraft.ts renames the minified JS
// models' symbols). Change a shape here and in aircraft.ts only together, and
// only on purpose.
//
// Metres, +Y up. A body is equal-length convex cross-sections at stations along
// an axis, joined by MeshBuilder.sweep; a decal is triangles laid a few
// millimetres off a body's skin, so no two materials share a plane.

import { MeshBuilder, ngon, type MaterialSpec, type Ring, type SweepAxis } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ParamSpec } from "./design.ts";

// The colours are the reference models' own. Metal is only mildly metallic:
// the game lights models without an environment map.
export const PALETTE: Record<string, MaterialSpec> = {
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
  glass: { color: "#161b22", metallic: 0.2, roughness: 0.15, glass: true },
  tyre: { color: "#1b1c1e", roughness: 0.95 },
};

// --- bodies, decals and rods ---------------------------------------------------------

/** A point of a cross-section: (lateral, y) -- (x, y) on a body along z, (z, y) on one along x. */
export type P2 = [number, number];
export type Sec = P2[];
/** A cross-section at position `a` along the body's axis. */
export interface Station { a: number; sec: Sec }

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The model point of section point `p` at position `a` along `axis`. */
export function at(axis: SweepAxis, a: number, p: P2): Vec3 {
  return axis === "z" ? [p[0], p[1], a] : [a, p[1], p[0]];
}

/** The unit vector along `axis`, signed. */
export function along(axis: SweepAxis, s: number): Vec3 {
  return axis === "z" ? [0, 0, s] : [s, 0, 0];
}

export function centroid(sec: Sec): P2 {
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
export function oval(n: number, cu: number, cy: number, hw: number, top: number, bot: number, e = 2): Sec {
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
export const circle = (n: number, cu: number, cy: number, r: number): Sec => oval(n, cu, cy, r, r, r);

/**
 * An airfoil section, leading edge at `lead`, `chord` long towards -dir,
 * `thick` thick about `mid`: six points, convex.
 */
export function foil(lead: number, chord: number, thick: number, mid: number, dir = 1): Sec {
  const u = (f: number): number => lead - dir * f * chord;
  return [
    [u(0), mid], [u(0.08), mid + 0.4 * thick], [u(0.35), mid + 0.5 * thick],
    [u(1), mid], [u(0.35), mid - 0.5 * thick], [u(0.08), mid - 0.38 * thick],
  ];
}

/** The skin of a body: its stations joined by open sweeps (cap the ends with `fan`). */
export function body(m: MeshBuilder, mat: string, axis: SweepAxis, st: Station[]): void {
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
export function fan(m: MeshBuilder, mat: string, axis: SweepAxis, sec: Sec, a: number, dir: number, tip?: Vec3): void {
  const apex = tip ?? at(axis, a, centroid(sec));
  const pts: Vec3[] = [];
  for (let i = 0; i < sec.length; i++) pts.push(at(axis, a, sec[i]!), at(axis, a, sec[(i + 1) % sec.length]!), apex);
  m.facets(mat, pts, along(axis, dir));
}

/** A flat ring between two sections at `a` (an intake lip, a nozzle rim), facing `dir`. */
export function annulus(m: MeshBuilder, mat: string, axis: SweepAxis, outer: Sec, inner: Sec, a: number, dir: number): void {
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
export function secAt(st: Station[], a: number): Sec {
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

export const cross2 = (a: P2, b: P2): number => a[0] * b[1] - a[1] * b[0];

/** Where the ray from `o` along `d` leaves the convex section. */
export function exitPoint(sec: Sec, o: P2, d: P2): P2 {
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
export function skinY(axis: SweepAxis, st: Station[], a: number, y: number, side: number, off: number): Vec3 {
  const sec = secAt(st, a);
  const c = centroid(sec);
  const p = exitPoint(sec, [c[0], y], [side, 0]);
  const du = p[0] - c[0];
  const dy = (p[1] - c[1]) * 0.5; // lean towards the horizontal: a flat-sided body's normal is
  const l = Math.hypot(du, dy) || 1;
  return at(axis, a, [p[0] + (du / l) * off, p[1] + (dy / l) * off]);
}

/** The skin of body `st` at `a`, in the direction `ang` (radians from +lateral) from the section's centre. */
export function skinAng(axis: SweepAxis, st: Station[], a: number, ang: number, off: number): Vec3 {
  const sec = secAt(st, a);
  const d: P2 = [Math.cos(ang), Math.sin(ang)];
  const p = exitPoint(sec, centroid(sec), d);
  return at(axis, a, [p[0] + d[0] * off, p[1] + d[1] * off]);
}

export function insideSec(sec: Sec, p: P2): boolean {
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

/** Whether p is inside a section that may be slightly concave (the wide bodies' waisted ones): the crossing rule. */
export function insideAny(sec: Sec, p: P2): boolean {
  let inside = false;
  for (let i = 0, j = sec.length - 1; i < sec.length; j = i++) {
    const a = sec[i]!;
    const b = sec[j]!;
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) inside = !inside;
  }
  return inside;
}

/**
 * The skin of a nose or tail: the point at lateral `u` and height `y` where the
 * body ends between `aIn` (inside) and `aOut` (outside), pushed `off` further out.
 */
export function skinEnd(axis: SweepAxis, st: Station[], u: number, y: number, aIn: number, aOut: number, off: number, inside = insideSec): Vec3 {
  let lo = aIn;
  let hi = aOut;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (inside(secAt(st, mid), [u, y])) lo = mid;
    else hi = mid;
  }
  return at(axis, lo + Math.sign(aOut - aIn) * off, [u, y]);
}

/** A convex polygon's triangles, fanned from its first point (for `facets`). */
export function fanTris(pts: Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) out.push(pts[0]!, pts[i]!, pts[i + 1]!);
  return out;
}

/** The triangles of a patch mapped from the unit square by `f`, in nu x nv cells. */
export function gridTris(f: (s: number, t: number) => Vec3, nu: number, nv: number): Vec3[] {
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
export function skinDecal(axis: SweepAxis, st: Station[], outline: P2[], side: number, off: number, bands = 4, steps = 1): Vec3[] {
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
export function ovalOutline(ca: number, cy: number, ra: number, ry: number, n: number): P2[] {
  const out: P2[] = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    out.push([ca + ra * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return out;
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function unit(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** A straight `n`-sided rod of radius `r` from p0 to p1, in any direction: a strut, a wire. */
export function rod(m: MeshBuilder, mat: string, p0: Vec3, p1: Vec3, r: number, n = 6): void {
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
export function plate(m: MeshBuilder, mat: string, o: Vec3, e1: Vec3, e2: Vec3, outline: P2[], thick: number): void {
  const u = unit(e1);
  const v = unit(e2);
  const n = unit(cross3(u, v));
  const pts = outline.map(([p, q]): Vec3 => [o[0] + u[0] * p + v[0] * q, o[1] + u[1] * p + v[1] * q, o[2] + u[2] * p + v[2] * q]);
  m.slab(mat, pts, [n[0] * thick, n[1] * thick, n[2] * thick]);
}

/** A ring in loft order (counter-clockwise from above, as `ngon` returns). */
export function ccw(r: Ring): Ring {
  let area = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i]!;
    const q = r[(i + 1) % r.length]!;
    area += p[0] * q[1] - q[0] * p[1];
  }
  return area > 0 ? [...r].reverse() : r;
}

/** One spanwise station of a wing: span position, leading edge, chord, thickness, height of the chord line. */
export interface WingStation { s: number; lead: number; chord: number; thick: number; mid: number }

/** A wing or tailplane along the span `axis`, its chord along the other horizontal axis, nose at +dir. */
export function wing(m: MeshBuilder, mat: string, axis: SweepAxis, st: WingStation[], dir = 1): void {
  const ss = st.map((w): Station => ({ a: w.s, sec: foil(w.lead, w.chord, w.thick, w.mid, dir) }));
  body(m, mat, axis, ss);
  const first = ss[0]!;
  const last = ss[ss.length - 1]!;
  fan(m, mat, axis, first.sec, first.a, Math.sign(first.a - ss[1]!.a));
  fan(m, mat, axis, last.sec, last.a, Math.sign(last.a - ss[ss.length - 2]!.a));
}

/** The wing's leading edge, chord, thickness and chord height interpolated at span position `s`. */
export function wingAt(st: WingStation[], s: number): WingStation {
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
export function fin(m: MeshBuilder, mat: string, chordAxis: SweepAxis, rings: Array<[number, number, number, number, number]>, dir = 1, top = true): void {
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
export function wheel(m: MeshBuilder, axis: SweepAxis, a0: number, a1: number, c: P2, r: number, hubR: number, hubMat: string, n = 16): void {
  const tyre = ngon(n, r, Math.PI / n, c[0], c[1]);
  m.sweep("tyre", axis, tyre, a0, tyre, a1);
  const hub = ngon(10, hubR, 0, c[0], c[1]);
  const lip = Math.min(0.02, (a1 - a0) * 0.1);
  m.sweep(hubMat, axis, hub, a0 - lip, hub, a1 + lip);
}

/** The axle height of a wheel of radius r whose flat (n-gon) rests on `ground`. */
export const axleY = (ground: number, r: number, n = 16): number => ground + r * Math.cos(Math.PI / n);

/**
 * A turbofan nacelle along `axis`, nose at +dir: a cowl from `front` to `back`
 * of radius `r` about `c`, an intake lip, a dark duct with the fan face and a
 * spinner set back in it, and behind the cowl a nozzle and an exhaust plug.
 */
export interface NacelleSpec {
  c: P2;
  front: number;
  back: number;
  r: number;
  nozzle: number; // the nozzle's length behind the cowl
  plug: number; // how far the plug sticks out of the nozzle
  squash?: number; // the depth below the axis as a fraction of `r` (the 737's flat-bottomed intake); 1 = round
  mats: { cowl: string; lip: string; duct: string; fan: string; nozzle: string; plug: string };
}

export function nacelle(m: MeshBuilder, axis: SweepAxis, dir: number, n: NacelleSpec, sides = 20): void {
  const len = Math.abs(n.front - n.back);
  const a = (f: number): number => n.front - dir * f * len;
  const ring = (rr: number): Sec => oval(sides, n.c[0], n.c[1], rr, rr, rr * (n.squash ?? 1));
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

// --- liveries ----------------------------------------------------------------------------
//
// The airliners come in airline liveries (a `livery` parameter): the colours of
// the main carriers' schemes, without their titles and with simplified logos.
// A livery paints the fuselage skin by height and position (`paintedBody`: each
// triangle of the sweep takes its own material, so a colour boundary runs along
// a section edge and needs no decal), adds thin cheatlines as decals
// (`skinStripe`), paints the fin in horizontal bands (`paintedFin`) and lays
// flat-coloured shapes on both sides of it (`finDecal`), and picks the engine
// cowls' and winglets' colours.

/** An airline livery of one aircraft type. */
export interface Livery {
  /** What the picker shows, e.g. "Lufthansa (2018)". */
  title: string;
  /** The livery's own materials, added to the palette. */
  colors: Record<string, MaterialSpec>;
  /**
   * The fuselage skin's material at height `s` on the section (-1 at the keel,
   * 0 at the widest point, 1 at the crown) and position `a` along the axis;
   * absent for a plain white fuselage.
   */
  skin?: (s: number, a: number) => string;
  /** Painted lines on both sides of the fuselage: from a0 to a1, between heights y0 and y1. */
  stripes?: Array<{ mat: string; a0: number; a1: number; y0: number; y1: number }>;
  /** The fin's colour bands: [lowest height, material], rising; the first starts at the root. */
  fin: Array<[number, string]>;
  /**
   * Shapes on both sides of the fin, each a list of convex outlines in (fraction
   * of the chord from the leading edge, height); later shapes lie over earlier ones.
   */
  finArt?: Array<{ mat: string; polys: P2[][] }>;
  /** The engine cowls' material. */
  cowl: string;
  /** The winglets' (737) or wingtip fences' (A380) material. */
  winglet: string;
  /**
   * A colour field behind a slanted plane (the wide bodies only): the fuselage
   * skin aft of x = x0 - slope * (y - y0) takes `mat`, cut exactly along the
   * plane, a straight diagonal in side view.
   */
  cut?: { mat: string; x0: number; y0: number; slope: number };
}

/** The `livery` parameter of a design with these liveries, the first one the default. */
export function liveryParam(liveries: Record<string, Livery>): ParamSpec {
  const values = Object.entries(liveries).map(([value, l]) => ({ value, title: l.title }));
  return { name: "livery", title: "Livery", default: values[0]!.value, values };
}

/** The design's palette with the livery's materials. */
export const liveryPalette = (l: Livery): Record<string, MaterialSpec> => ({ ...PALETTE, ...l.colors });

/**
 * The skin of a body in a livery: the same surface as `body` (open sweeps between
 * the stations), but every triangle takes the material `paint` gives for its
 * height on the section (the sine of its edge's angle: -1 at the keel, 1 at the
 * crown) and its position along the axis. The sections must be `oval`s.
 */
export function paintedBody(m: MeshBuilder, axis: SweepAxis, st: Station[], paint: (s: number, a: number) => string): void {
  for (let i = 0; i + 1 < st.length; i++) {
    const s0 = st[i]!;
    const s1 = st[i + 1]!;
    const n = s0.sec.length;
    const c0 = centroid(s0.sec);
    const c1 = centroid(s1.sec);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const p0 = at(axis, s0.a, s0.sec[k]!);
      const p1 = at(axis, s0.a, s0.sec[j]!);
      const q0 = at(axis, s1.a, s1.sec[k]!);
      const q1 = at(axis, s1.a, s1.sec[j]!);
      // the edge between points k and k + 1 of an oval lies at angle (k + 1) / n of a turn
      const s = Math.sin(((k + 1) / n) * Math.PI * 2);
      const tris: Array<[Vec3[], number]> = [[[p0, p1, q1], 1 / 3], [[p0, q1, q0], 2 / 3]];
      for (const [tri, f] of tris) {
        const a = lerp(s0.a, s1.a, f);
        const mid: Vec3 = [(tri[0]![0] + tri[1]![0] + tri[2]![0]) / 3, (tri[0]![1] + tri[1]![1] + tri[2]![1]) / 3, (tri[0]![2] + tri[1]![2] + tri[2]![2]) / 3];
        const c = at(axis, a, [lerp(c0[0], c1[0], f), lerp(c0[1], c1[1], f)]);
        m.facets(paint(s, a), tri, sub3(mid, c));
      }
    }
  }
}

/**
 * A painted line along the side `side` of body `st`, `off` proud of the skin:
 * from a0 to a1 between heights y0 and y1, cut at the body's stations so it
 * follows the skin.
 */
export function skinStripe(axis: SweepAxis, st: Station[], a0: number, a1: number, y0: number, y1: number, side: number, off: number): Vec3[] {
  const lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  const cuts = [lo, ...st.map((x) => x.a).filter((a) => a > lo && a < hi), hi].sort((a, b) => a - b);
  const out: Vec3[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const [ca, cb] = [cuts[i]!, cuts[i + 1]!];
    out.push(...fanTris([skinY(axis, st, ca, y0, side, off), skinY(axis, st, cb, y0, side, off), skinY(axis, st, cb, y1, side, off), skinY(axis, st, ca, y1, side, off)]));
  }
  return out;
}

/** A fin ring: (height, leading edge, chord, thickness, centre across the chord), as `fin` takes them. */
export type FinRing = [number, number, number, number, number];

/** The fin's ring at height y, interpolated as the loft between the two rings draws it. */
export function finRingAt(rings: FinRing[], y: number): FinRing {
  for (let i = 0; i + 1 < rings.length; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    if (y > r1[0] && i + 2 < rings.length) continue;
    const t = (y - r0[0]) / (r1[0] - r0[0]);
    return r0.map((v, k) => lerp(v, r1[k]!, t)) as FinRing;
  }
  return rings[0]!;
}

/** A fin in the livery's colour bands: `fin` with rings added at the bands' edges. */
export function paintedFin(m: MeshBuilder, chordAxis: SweepAxis, rings: FinRing[], bands: Array<[number, string]>, dir = 1): void {
  if (bands.length === 1) {
    fin(m, bands[0]![1], chordAxis, rings, dir);
    return;
  }
  const y0 = rings[0]![0];
  const y1 = rings[rings.length - 1]![0];
  const ys = [...new Set([...rings.map((r) => r[0]), ...bands.map((b) => b[0]).filter((y) => y > y0 && y < y1)])].sort((a, b) => a - b);
  const rs = ys.map((y) => finRingAt(rings, y));
  for (let i = 0; i + 1 < rs.length; i++) {
    const mid = (rs[i]![0] + rs[i + 1]![0]) / 2;
    let mat = bands[0]![1];
    for (const [from, b] of bands) if (mid >= from) mat = b;
    fin(m, mat, chordAxis, [rs[i]!, rs[i + 1]!], dir, i + 2 === rs.length);
  }
}

/**
 * The point of the fin's skin at chord fraction `f` (0 at the leading edge) and
 * height y, on side `side` across the chord, `off` proud: the foil's half
 * thickness there, which is piecewise linear in f (`foil`).
 */
export function finSkin(chordAxis: SweepAxis, rings: FinRing[], dir: number, f: number, y: number, side: number, off: number): Vec3 {
  const [, lead, chord, thick, c] = finRingAt(rings, y);
  const knots: Array<[number, number]> = [[0, 0], [0.08, side > 0 ? 0.4 : 0.38], [0.35, 0.5], [1, 0]];
  let h = 0;
  for (let i = 0; i + 1 < knots.length; i++) {
    const [fa, ha] = knots[i]!;
    const [fb, hb] = knots[i + 1]!;
    if (f >= fa && f <= fb) h = lerp(ha, hb, (f - fa) / (fb - fa));
  }
  const lateral = c + side * (h * thick + off);
  const u = lead - dir * f * chord;
  return chordAxis === "z" ? [lateral, y, u] : [u, y, lateral];
}

/** The part of convex outline `poly` on the side of f = cut that `keep` gives (-1 below, 1 above). */
export function clipF(poly: P2[], cut: number, keep: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const ip = (p[0] - cut) * keep >= 0;
    const iq = (q[0] - cut) * keep >= 0;
    if (ip) out.push(p);
    if (ip !== iq) {
      const t = (cut - p[0]) / (q[0] - p[0]);
      out.push([cut, lerp(p[1], q[1], t)]);
    }
  }
  return out;
}

/**
 * Flat-coloured shapes on both sides of a fin (a logo, a flag), each convex
 * outline in (chord fraction, height) cut where the foil's thickness bends so
 * every piece lies flat on the skin; `off` proud of it.
 */
export function finDecal(m: MeshBuilder, mat: string, chordAxis: SweepAxis, rings: FinRing[], dir: number, polys: P2[][], off: number): void {
  const cuts = [0.08, 0.2, 0.35, 0.55, 0.75];
  for (const side of [-1, 1]) {
    const pts: Vec3[] = [];
    for (const poly of polys) {
      let pieces = [poly];
      for (const c of cuts) pieces = pieces.flatMap((p) => [clipF(p, c, -1), clipF(p, c, 1)]).filter((p) => p.length >= 3);
      for (const p of pieces) pts.push(...fanTris(p.map(([f, y]) => finSkin(chordAxis, rings, dir, f, y, side, off))));
    }
    m.facets(mat, pts, chordAxis === "z" ? [side, 0, 0] : [0, 0, side]);
  }
}

/** A livery's fin: its bands, then its shapes, each a little further off the skin than the last. */
export function liveryFin(m: MeshBuilder, l: Livery, chordAxis: SweepAxis, rings: FinRing[], dir = 1): void {
  paintedFin(m, chordAxis, rings, l.fin, dir);
  const art = l.finArt ?? [];
  if (art.length > 0) m.scope("fin art", () => art.forEach((a, i) => finDecal(m, a.mat, chordAxis, rings, dir, a.polys, 0.03 + 0.012 * i)));
}

/** A circle's outline in (chord fraction, height): `n` points about (f, y), `rf` across the chord, `ry` up. */
export function finDisc(f: number, y: number, rf: number, ry: number, n = 16): P2[] {
  return ovalOutline(f, y, rf, ry, n);
}
/** Draws everything turned 180 degrees about Y: a model drawn nose at +X comes out nose at -X. */
export class TurnedBuilder extends MeshBuilder {
  constructor(palette: Record<string, MaterialSpec>) {
    super(palette);
    this.frame = ([x, y, z]) => [-x, y, -z];
  }
}
export interface Lobe { mid: number; hw: number; top: number; bot: number }

/** The point of `l` whose outward normal is (cos t, sin t). */
export function lobePoint(l: Lobe, t: number): P2 {
  const nx = Math.cos(t);
  const ny = Math.sin(t);
  const b = ny >= 0 ? l.top : l.bot;
  const k = Math.hypot(l.hw * nx, b * ny) || 1;
  return [(l.hw * l.hw * nx) / k, l.mid + (b * b * ny) / k];
}

/**
 * The lobes' outline as an `n`-point section: point k lies where the outline's
 * normal is at (k + 0.5) / n of a turn, as `oval` places its points, so
 * `paintedBody` paints it by height like an oval. It is the lobes' convex hull
 * with the switch between them blended over `soft` metres of their support
 * values: a smooth, slightly waisted join instead of a hull whose seam jumps
 * between points from one station to the next.
 */
export function hullSec(n: number, lobes: Lobe[], soft = 0.3): Sec {
  const out: Sec = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    const pts = lobes.map((l) => lobePoint(l, t));
    const h = pts.map((p) => p[0] * Math.cos(t) + p[1] * Math.sin(t));
    const top = Math.max(...h);
    const w = h.map((v) => Math.exp((v - top) / soft));
    const sum = w.reduce((a, b) => a + b, 0);
    out.push([pts.reduce((a, p, i) => a + p[0] * w[i]!, 0) / sum, pts.reduce((a, p, i) => a + p[1] * w[i]!, 0) / sum]);
  }
  return out;
}

/** A lobe from its keel, crown, half-width and widest height (kept strictly between keel and crown). */
export function lobe(keel: number, crown: number, hw: number, mid: number): Lobe {
  const m = Math.min(Math.max(mid, keel + 0.01), crown - 0.01);
  return { mid: m, hw: Math.max(hw, 0.01), top: Math.max(crown - m, 0.01), bot: Math.max(m - keel, 0.01) };
}

/** The superellipse closure towards a tip: 1 at and beyond `full`, 0 at `tip`, with a vertical tangent there. */
export function closeTo(d: number, tip: number, full: number, p: number): number {
  if (d >= full) return 1;
  if (d <= tip) return 0;
  const u = (full - d) / (full - tip);
  return Math.pow(1 - Math.pow(u, p), 1 / p);
}

/** A smooth monotone curve through keyframes (d, value), held flat beyond the ends (Fritsch-Carlson). */
export function curve(keys: Array<[number, number]>): (d: number) => number {
  const n = keys.length;
  const dx = keys.slice(1).map(([d], i) => d - keys[i]![0]);
  const sl = keys.slice(1).map(([, v], i) => (v - keys[i]![1]) / dx[i]!);
  const m = keys.map((_, i) => {
    if (i === 0) return sl[0]!;
    if (i === n - 1) return sl[n - 2]!;
    const a = sl[i - 1]!;
    const b = sl[i]!;
    return a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b);
  });
  return (d) => {
    if (d <= keys[0]![0]) return keys[0]![1];
    if (d >= keys[n - 1]![0]) return keys[n - 1]![1];
    let i = 0;
    while (d > keys[i + 1]![0]) i++;
    const h = dx[i]!;
    const t = (d - keys[i]![0]) / h;
    const [y0, y1] = [keys[i]![1], keys[i + 1]![1]];
    return (2 * t ** 3 - 3 * t * t + 1) * y0 + (t ** 3 - 2 * t * t + t) * h * m[i]! + (-2 * t ** 3 + 3 * t * t) * y1 + (t ** 3 - t * t) * h * m[i + 1]!;
  };
}

/** A smoothstep from 0 at a to 1 at b. */
export const smooth = (d: number, a: number, b: number): number => {
  const t = Math.min(1, Math.max(0, (d - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * `paintedBody` with a livery's slanted cut: every skin triangle that the plane
 * crosses is clipped into its two pieces, so the colour boundary is a straight
 * line instead of a staircase of whole triangles.
 */
export function cutBody(m: MeshBuilder, axis: SweepAxis, st: Station[], paint: (s: number, a: number) => string, cut: NonNullable<Livery["cut"]>): void {
  const f = (p: Vec3): number => p[0] - (cut.x0 - cut.slope * (p[1] - cut.y0));
  const mix = (p: Vec3, q: Vec3): Vec3 => {
    const t = f(p) / (f(p) - f(q));
    return [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
  };
  for (let i = 0; i + 1 < st.length; i++) {
    const s0 = st[i]!;
    const s1 = st[i + 1]!;
    const n = s0.sec.length;
    const c0 = centroid(s0.sec);
    const c1 = centroid(s1.sec);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const p0 = at(axis, s0.a, s0.sec[k]!);
      const p1 = at(axis, s0.a, s0.sec[j]!);
      const q0 = at(axis, s1.a, s1.sec[k]!);
      const q1 = at(axis, s1.a, s1.sec[j]!);
      const s = Math.sin(((k + 1) / n) * Math.PI * 2);
      for (const [tri, fr] of [[[p0, p1, q1], 1 / 3], [[p0, q1, q0], 2 / 3]] as Array<[Vec3[], number]>) {
        const a = lerp(s0.a, s1.a, fr);
        const mid: Vec3 = [(tri[0]![0] + tri[1]![0] + tri[2]![0]) / 3, (tri[0]![1] + tri[1]![1] + tri[2]![1]) / 3, (tri[0]![2] + tri[1]![2] + tri[2]![2]) / 3];
        const normal = sub3(mid, at(axis, a, [lerp(c0[0], c1[0], fr), lerp(c0[1], c1[1], fr)]));
        // Sutherland-Hodgman against the plane, once for each side
        for (const side of [-1, 1]) {
          const poly: Vec3[] = [];
          for (let e = 0; e < 3; e++) {
            const p = tri[e]!;
            const q = tri[(e + 1) % 3]!;
            const ip = f(p) * side >= 0;
            const iq = f(q) * side >= 0;
            if (ip) poly.push(p);
            if (ip !== iq) poly.push(mix(p, q));
          }
          if (poly.length < 3) continue;
          // drop slivers left by a vertex lying on the plane
          const area = Math.hypot(...cross3(sub3(poly[1]!, poly[0]!), sub3(poly[poly.length - 1]!, poly[0]!)));
          if (area < 1e-9) continue;
          m.facets(side < 0 ? cut.mat : paint(s, a), fanTris(poly), normal);
        }
      }
    }
  }
}

/** Triangles in (u, v) halved along their longest edge until none is longer than `max`: a flat decal that follows a curved skin. */
export function splitLong(tris: P2[], max: number): P2[] {
  const out: P2[] = [];
  const split = (a: P2, b: P2, c: P2): void => {
    const e: Array<[P2, P2, P2]> = [[a, b, c], [b, c, a], [c, a, b]];
    const len = e.map(([p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]));
    const i = len.indexOf(Math.max(...len));
    if (len[i]! <= max) {
      out.push(a, b, c);
      return;
    }
    const [p, q, r] = e[i]!;
    const mid: P2 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    split(p, mid, r);
    split(mid, q, r);
  };
  for (let i = 0; i + 2 < tris.length; i += 3) split(tris[i]!, tris[i + 1]!, tris[i + 2]!);
  return out;
}
