// The dedicated low level of detail of the remaining vehicles (docs/models/lod.md):
// aircraft, cable car cabins and the chairlift chair, and the stacked plan rings the
// ship LODs share with them.
//
// - `airLod` draws an aircraft from its full model's own data (`AirLodSpec`): the
//   fuselage stations resampled as an n-gon tube closed by a nose and a tail cone,
//   painted face by face in the livery's skin (as `paintedBody` paints the full
//   one) with the windscreen's faces in the one LOD glass; wings and tailplanes as
//   four-point airfoils swept along the span; the fin and winglets lofted through
//   their rings in the livery's fin bands; engines as n-gon nacelles with a dark
//   intake. It builds the finest level that fits 200 triangles: optional parts
//   give way first, then the tube's sides and stations, then the fin's thinnest
//   band; optional parts that fit again come back.
// - `cabinLod` draws a cabin as a stack of plan rings in its colour bands, its
//   glazing a band of the one LOD glass, under coarse hanger and grip parts; it
//   gives up optional parts, then ring detail, then the thinnest band.
//
// Metres, the full models' axes. Every face is a planar convex polygon wound to
// face away from its solid; faces of different colours never overlap in one plane.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { LOD_GLASS, LOD_PALETTE, lodPolygon, mergeBand, type LodBand } from "./lodKit.ts";

export type P2 = [number, number];
type Axis = "x" | "z";

/** The model point of section point p (lateral, y) at a along `axis` (as aircraft.ts `at`). */
const at = (axis: Axis, a: number, p: readonly [number, number]): Vec3 => (axis === "z" ? [p[0], p[1], a] : [a, p[1], p[0]]);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const mid3 = (pts: readonly Vec3[]): Vec3 => [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k]!, 0) / pts.length) as Vec3;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

// --- stacked plan rings ---------------------------------------------------------------

/**
 * A solid of horizontal plan rings (x, z), all of one length and convex, from the
 * first height to the last: band i between rings i and i + 1 in mats[i], a top
 * cap and, unless `bottom` is null, a bottom cap.
 */
export function lodStack(m: MeshBuilder, rings: ReadonlyArray<readonly [y: number, ring: ReadonlyArray<readonly [number, number]>]>, mats: readonly string[], top: string | null, bottom: string | null = null): void {
  const n = rings[0]![1].length;
  for (let i = 0; i + 1 < rings.length; i++) {
    const [y0, r0] = rings[i]!;
    const [y1, r1] = rings[i + 1]!;
    const c: Vec3 = [r0.reduce((s, p) => s + p[0], 0) / n, (y0 + y1) / 2, r0.reduce((s, p) => s + p[1], 0) / n];
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const q: Vec3[] = [[r0[k]![0], y0, r0[k]![1]], [r0[j]![0], y0, r0[j]![1]], [r1[j]![0], y1, r1[j]![1]], [r1[k]![0], y1, r1[k]![1]]];
      // a band edge shrunk to a point (a dome's apex) leaves a triangle
      const pts = q.filter((p, i2) => q.findIndex((o) => Math.hypot(o[0] - p[0], o[1] - p[1], o[2] - p[2]) < 1e-9) === i2);
      if (pts.length >= 3) lodPolygon(m, mats[i]!, pts, sub(mid3(pts), c));
    }
  }
  const cap = (y: number, ring: ReadonlyArray<readonly [number, number]>, mat: string, up: number) => {
    const pts = ring.map(([x, z]): Vec3 => [x, y, z]).filter((p, i, a) => a.findIndex((o) => Math.hypot(o[0] - p[0], o[2] - p[2]) < 1e-9) === i);
    if (pts.length >= 3) lodPolygon(m, mat, pts, [0, up, 0]);
  };
  if (top) cap(rings[rings.length - 1]![0], rings[rings.length - 1]![1], top, 1);
  if (bottom) cap(rings[0]![0], rings[0]![1], bottom, -1);
}

/** A plan rectangle (x, z) about (cx, cz), `ch` chamfered off its corners (8 points; 4 when ch is 0). */
export function lodPlanRect(hx: number, hz: number, ch = 0, cx = 0, cz = 0): Array<[number, number]> {
  const r: Array<[number, number]> = ch > 0
    ? [[hx, -hz + ch], [hx, hz - ch], [hx - ch, hz], [-hx + ch, hz], [-hx, hz - ch], [-hx, -hz + ch], [-hx + ch, -hz], [hx - ch, -hz]]
    : [[hx, -hz], [hx, hz], [-hx, hz], [-hx, -hz]];
  return r.map(([x, z]) => [cx + x, cz + z]);
}


/** An n-sided bar (4 by default: 8 triangles) from p to q, `r` from its axis to its corners, open-ended: a strut, a hanger arm. */
export function lodBar(m: MeshBuilder, mat: string, p: Vec3, q: Vec3, r: number, n = 4): void {
  const d = sub(q, p);
  const l = Math.hypot(...d);
  const t = d.map((v) => v / l) as Vec3;
  const ref: Vec3 = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cr = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const u = cr(t, ref);
  const lu = Math.hypot(...u);
  const e1 = u.map((v) => v / lu) as Vec3;
  const e2 = cr(t, e1);
  const off = (k: number): Vec3 => {
    const a = Math.PI / n + (2 * k * Math.PI) / n;
    return [0, 1, 2].map((i) => r * (Math.cos(a) * e1[i]! + Math.sin(a) * e2[i]!)) as Vec3;
  };
  for (let k = 0; k < n; k++) {
    const [o0, o1] = [off(k), off(k + 1)];
    const add = (c: Vec3, o: Vec3): Vec3 => [c[0] + o[0], c[1] + o[1], c[2] + o[2]];
    lodPolygon(m, mat, [add(p, o0), add(p, o1), add(q, o1), add(q, o0)], [o0[0] + o1[0], o0[1] + o1[1], o0[2] + o1[2]]);
  }
}

/** A wheel from afar on an axle along `axis` from a0 to a1, its centre (c, y) across it: an n-gon's tread and outer face, its flat on y - r. */
export function lodAxleWheel(m: MeshBuilder, mat: string, axis: Axis, c: number, y: number, r: number, a0: number, a1: number, n = 6): void {
  const yc = y;
  const ring = Array.from({ length: n }, (_, k): P2 => {
    const t = Math.PI / n + (2 * k * Math.PI) / n - Math.PI / 2;
    return [c + (r / Math.cos(Math.PI / n)) * Math.cos(t), yc + (r / Math.cos(Math.PI / n)) * Math.sin(t)];
  });
  const outer = Math.abs(a1) > Math.abs(a0) ? a1 : a0, inner = outer === a1 ? a0 : a1;
  const pt = (a: number, p: P2): Vec3 => (axis === "z" ? [p[0], p[1], a] : [a, p[1], p[0]]);
  for (let k = 0; k < n; k++) {
    const [p, q] = [ring[k]!, ring[(k + 1) % n]!];
    const nrm = pt(0, [(p[0] + q[0]) / 2 - c, (p[1] + q[1]) / 2 - yc]);
    lodPolygon(m, mat, [pt(inner, p), pt(inner, q), pt(outer, q), pt(outer, p)], axis === "z" ? [nrm[0], nrm[1], 0] : [0, nrm[1], nrm[2]]);
  }
  lodPolygon(m, mat, ring.map((p) => pt(outer, p)), axis === "z" ? [0, 0, Math.sign(outer)] : [Math.sign(outer), 0, 0]);
}

// --- aircraft ---------------------------------------------------------------------------

/** A full model's fuselage section at `a` along the axis: its points (lateral, y), convex or nearly. */
export interface AirStation { a: number; sec: ReadonlyArray<readonly [number, number]> }

/** A spanwise wing station, as aircraft.ts `WingStation`: span position, leading edge, chord, thickness, chord line height. */
export interface AirWingStation { s: number; lead: number; chord: number; thick: number; mid: number }

export interface AirWing {
  /** The span axis; the chord runs along the other horizontal axis, the nose toward +. */
  axis: Axis;
  /** Stations by rising s; `mirror`: a half wing from the root (s >= 0), drawn on both sides. */
  stations: readonly AirWingStation[];
  mirror: boolean;
  mat: string;
  optional?: number;
}

/** A fin ring, as aircraft.ts `FinRing`: height, leading edge, chord, thickness, centre across the chord. */
export type AirFinRing = readonly [y: number, lead: number, chord: number, thick: number, c: number];

export interface AirFin {
  chordAxis: Axis;
  rings: readonly AirFinRing[];
  /** The livery's bands: [lowest height, material], rising; the first starts at the root. */
  bands: ReadonlyArray<readonly [number, string]>;
  /** Close the top ring (a fin's tip); false for a winglet under its upper part. */
  top?: boolean;
  optional?: number;
}

export interface AirEngine {
  axis: Axis;
  /** The nacelle's axis in the section plane (lateral, y), its intake at `front`, its nozzle at `back`. */
  c: P2;
  front: number;
  back: number;
  r: number;
  cowl: string;
  intake: string;
  nozzle: string;
  optional?: number;
}

/** A small body besides the fuselage (a canopy, a tail bullet): stations swept as a 6-gon in one material. */
export interface AirPod {
  axis: Axis;
  stations: readonly AirStation[];
  mat: string;
  /** The tips the ends close to; absent: a flat cap. */
  front?: Vec3;
  back?: Vec3;
  sides?: number;
  optional?: number;
}

export interface AirLodSpec {
  palette: Record<string, MaterialSpec>;
  /** A builder in the full model's frame (the 737 is drawn in a turned one). */
  builder?: (palette: Record<string, MaterialSpec>) => MeshBuilder;
  axis: Axis;
  /** The fuselage's stations by rising a; the nose is at the last. */
  fuselage: readonly AirStation[];
  /** The nose and tail cones' tips; absent: a flat cap. */
  nose?: Vec3;
  tail?: Vec3;
  noseMat?: string;
  tailMat?: string;
  /** The skin's material by height on the section (-1 keel .. 1 crown), position along the axis and the face's centre. */
  paint: (s: number, a: number, p: Vec3) => string;
  /** The windscreen: the faces between a0 and a1 at section height s or more are LOD glass. */
  windscreen?: { a0: number; a1: number; s: number };
  /** Positions along the axis where the tube keeps a ring whatever its tolerance (a paint boundary). */
  keep?: readonly number[];
  wings: readonly AirWing[];
  fins: readonly AirFin[];
  engines: readonly AirEngine[];
  pods?: readonly AirPod[];
  /** Anything else (a propeller, struts, fixed gear). */
  parts?: ReadonlyArray<{ draw: (m: MeshBuilder) => void; optional?: number }>;
}

const cross2 = (a: P2, b: P2): number => a[0] * b[1] - a[1] * b[0];

/** Where the ray from o along d leaves the section (its farthest crossing). */
function exitPoint(sec: ReadonlyArray<readonly [number, number]>, o: P2, d: P2): P2 {
  let best = 0;
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

/** A section resampled as an n-gon: point k where the ray from its centre at (k + 0.5) / n of a turn leaves it. */
function resample(sec: ReadonlyArray<readonly [number, number]>, n: number): P2[] {
  const c: P2 = [sec.reduce((s, p) => s + p[0], 0) / sec.length, sec.reduce((s, p) => s + p[1], 0) / sec.length];
  return Array.from({ length: n }, (_, k) => {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    return exitPoint(sec, c, [Math.cos(t), Math.sin(t)]);
  });
}

interface Ring { a: number; pts: P2[]; keep?: boolean }

/** The ring at a, interpolated between the stations either side. */
function ringAt(rs: readonly Ring[], a: number): Ring {
  for (let i = 0; i + 1 < rs.length; i++) {
    const [r0, r1] = [rs[i]!, rs[i + 1]!];
    if (a > r1.a && i + 2 < rs.length) continue;
    const t = Math.min(1, Math.max(0, (a - r0.a) / (r1.a - r0.a)));
    return { a, pts: r0.pts.map((p, k) => [lerp(p[0], r1.pts[k]![0], t), lerp(p[1], r1.pts[k]![1], t)]) };
  }
  return rs[0]!;
}

/** The rings with those within `tol` of the line between their kept neighbours dropped (Douglas-Peucker); ends and `keep` stay. */
function simplifyRings(rs: readonly Ring[], tol: number): Ring[] {
  const keep = rs.map((r, i) => i === 0 || i === rs.length - 1 || !!r.keep);
  const walk = (a: number, b: number) => {
    let worst = -1, at2 = -1;
    for (let i = a + 1; i < b; i++) {
      const t = (rs[i]!.a - rs[a]!.a) / (rs[b]!.a - rs[a]!.a);
      const d = Math.max(...rs[i]!.pts.map((p, k) => Math.hypot(p[0] - lerp(rs[a]!.pts[k]![0], rs[b]!.pts[k]![0], t), p[1] - lerp(rs[a]!.pts[k]![1], rs[b]!.pts[k]![1], t))));
      if (d > worst) [worst, at2] = [d, i];
    }
    if (worst > tol) {
      keep[at2] = true;
      walk(a, at2);
      walk(at2, b);
    }
  };
  // walk between the forced stations
  const forced = keep.map((k, i) => (k ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i + 1 < forced.length; i++) walk(forced[i]!, forced[i + 1]!);
  return rs.filter((_, i) => keep[i]);
}

/**
 * A tube through `rings` along `axis`, each face painted by `paint(s, a, centre)` with s
 * the sine of its edge's angle on the section; closed at both ends by a cone to `tip`
 * or a flat cap (`endMat`, or the paint).
 */
function tube(m: MeshBuilder, axis: Axis, rings: readonly Ring[], paint: (s: number, a: number, p: Vec3) => string,
  ends: { start?: Vec3; end?: Vec3; startMat?: string; endMat?: string }): void {
  const n = rings[0]!.pts.length;
  const centre = (r: Ring): Vec3 => at(axis, r.a, [r.pts.reduce((s, p) => s + p[0], 0) / n, r.pts.reduce((s, p) => s + p[1], 0) / n]);
  const face = (pts: Vec3[], s: number, a: number, inside: Vec3, mat?: string) => {
    const c = mid3(pts);
    lodPolygon(m, mat ?? paint(s, a, c), pts, sub(c, inside));
  };
  for (let i = 0; i + 1 < rings.length; i++) {
    const [r0, r1] = [rings[i]!, rings[i + 1]!];
    const inside = mid3([centre(r0), centre(r1)]);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const s = Math.sin(((k + 1) / n) * Math.PI * 2);
      const am = (r0.a + r1.a) / 2;
      // two triangles, so a face whose corners do not quite lie in a plane stays true
      face([at(axis, r0.a, r0.pts[k]!), at(axis, r0.a, r0.pts[j]!), at(axis, r1.a, r1.pts[j]!)], s, am, inside);
      face([at(axis, r0.a, r0.pts[k]!), at(axis, r1.a, r1.pts[j]!), at(axis, r1.a, r1.pts[k]!)], s, am, inside);
    }
  }
  for (const [r, tip, mat, dir] of [[rings[0]!, ends.start, ends.startMat, -1], [rings[rings.length - 1]!, ends.end, ends.endMat, 1]] as const) {
    const c = centre(r);
    if (tip) {
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n;
        face([at(axis, r.a, r.pts[k]!), at(axis, r.a, r.pts[j]!), tip], Math.sin(((k + 1) / n) * Math.PI * 2), r.a, c, mat);
      }
    } else {
      const pts = r.pts.map((p) => at(axis, r.a, p));
      const out: Vec3 = axis === "z" ? [0, 0, dir] : [dir, 0, 0];
      lodPolygon(m, mat ?? paint(0, r.a, c), pts, out);
    }
  }
}

/** A four-point airfoil (leading edge, crown, trailing edge, belly) in (chord, y). */
function foil4(w: AirWingStation): P2[] {
  return [[w.lead, w.mid], [w.lead - 0.35 * w.chord, w.mid + 0.5 * w.thick], [w.lead - w.chord, w.mid], [w.lead - 0.35 * w.chord, w.mid - 0.5 * w.thick]];
}

/** The wing stations with those within `tol` of their neighbours' line dropped. */
function simplifyWing(st: readonly AirWingStation[], tol: number): AirWingStation[] {
  const rs: Ring[] = st.map((w) => ({ a: w.s, pts: foil4(w) }));
  const kept = new Set(simplifyRings(rs, tol).map((r) => r.a));
  return st.filter((w) => kept.has(w.s));
}

function drawWing(m: MeshBuilder, w: AirWing, tol: number): void {
  const st = simplifyWing(w.stations, tol);
  // the span axis carries the stations; a section is (chord, y): the chord runs along the other axis
  const axis = w.axis;
  const halves = w.mirror ? [1, -1] : [1];
  for (const side of halves) {
    const rings: Ring[] = st.map((s) => ({ a: side * s.s, pts: foil4(s) }));
    if (side < 0) rings.reverse();
    const n = 4;
    const pt = (a: number, p: P2): Vec3 => (axis === "x" ? [a, p[1], p[0]] : [p[0], p[1], a]);
    for (let i = 0; i + 1 < rings.length; i++) {
      const [r0, r1] = [rings[i]!, rings[i + 1]!];
      const inside: Vec3 = pt((r0.a + r1.a) / 2, [(r0.pts[0]![0] + r0.pts[2]![0] + r1.pts[0]![0] + r1.pts[2]![0]) / 4, (r0.pts[0]![1] + r1.pts[0]![1]) / 2]);
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n;
        const q = [pt(r0.a, r0.pts[k]!), pt(r0.a, r0.pts[j]!), pt(r1.a, r1.pts[j]!), pt(r1.a, r1.pts[k]!)];
        lodPolygon(m, w.mat, [q[0]!, q[1]!, q[2]!], sub(mid3(q), inside));
        lodPolygon(m, w.mat, [q[0]!, q[2]!, q[3]!], sub(mid3(q), inside));
      }
    }
    // the tip (and, on a wing spanning both sides, the other tip); a half wing's root lies in the fuselage
    const tips = w.mirror ? [rings[side > 0 ? rings.length - 1 : 0]!] : [rings[0]!, rings[rings.length - 1]!];
    for (const r of tips) {
      const out = Math.sign(r.a) || 1;
      lodPolygon(m, w.mat, r.pts.map((p) => pt(r.a, p)), axis === "x" ? [out, 0, 0] : [0, 0, out]);
    }
  }
}

/** The fin's ring at height y, interpolated between its rings. */
function finRingAt(rings: readonly AirFinRing[], y: number): AirFinRing {
  for (let i = 0; i + 1 < rings.length; i++) {
    const [r0, r1] = [rings[i]!, rings[i + 1]!];
    if (y > r1[0] && i + 2 < rings.length) continue;
    const t = (y - r0[0]) / (r1[0] - r0[0]);
    return r0.map((v, k) => lerp(v, r1[k]!, t)) as unknown as AirFinRing;
  }
  return rings[0]!;
}

function drawFin(m: MeshBuilder, f: AirFin, bands: ReadonlyArray<readonly [number, string]>): void {
  const y0 = f.rings[0]![0], y1 = f.rings[f.rings.length - 1]![0];
  const ys = [...new Set([...f.rings.map((r) => r[0]), ...bands.map((b) => b[0]).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6)])].sort((a, b) => a - b);
  const rs = ys.map((y) => finRingAt(f.rings, y));
  const pt = (y: number, u: number, lat: number): Vec3 => (f.chordAxis === "x" ? [u, y, lat] : [lat, y, u]);
  const ring = ([y, lead, chord, thick, c]: AirFinRing): Vec3[] => [
    pt(y, lead, c), pt(y, lead - 0.35 * chord, c + thick / 2), pt(y, lead - chord, c), pt(y, lead - 0.35 * chord, c - thick / 2),
  ];
  for (let i = 0; i + 1 < rs.length; i++) {
    const ym = (rs[i]![0] + rs[i + 1]![0]) / 2;
    let mat = bands[0]![1];
    for (const [from, b] of bands) if (ym >= from) mat = b;
    const [a, b] = [ring(rs[i]!), ring(rs[i + 1]!)];
    const inside = mid3([...a, ...b]);
    for (let k = 0; k < 4; k++) {
      const j = (k + 1) % 4;
      const q = [a[k]!, a[j]!, b[j]!, b[k]!];
      lodPolygon(m, mat, [q[0]!, q[1]!, q[2]!], sub(mid3(q), inside));
      lodPolygon(m, mat, [q[0]!, q[2]!, q[3]!], sub(mid3(q), inside));
    }
    if (i + 2 === rs.length && f.top !== false) lodPolygon(m, mat, b, [0, 1, 0]);
  }
}

/** A nacelle: an n-gon tube narrowing a little to the nozzle, the dark intake face and the nozzle's face. */
function drawEngine(m: MeshBuilder, e: AirEngine, n: number): void {
  const ring = (r: number): P2[] => Array.from({ length: n }, (_, k) => {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    return [e.c[0] + r * Math.cos(t), e.c[1] + r * Math.sin(t)];
  });
  const dir = Math.sign(e.front - e.back);
  const [f, b] = [ring(e.r), ring(e.r * 0.82)];
  const cf = at(e.axis, e.front, e.c), cb = at(e.axis, e.back, e.c);
  const inside = mid3([cf, cb]);
  for (let k = 0; k < n; k++) {
    const j = (k + 1) % n;
    const q = [at(e.axis, e.front, f[k]!), at(e.axis, e.front, f[j]!), at(e.axis, e.back, b[j]!), at(e.axis, e.back, b[k]!)];
    lodPolygon(m, e.cowl, [q[0]!, q[1]!, q[2]!], sub(mid3(q), inside));
    lodPolygon(m, e.cowl, [q[0]!, q[2]!, q[3]!], sub(mid3(q), inside));
  }
  const fwd: Vec3 = e.axis === "z" ? [0, 0, dir] : [dir, 0, 0];
  lodPolygon(m, e.intake, f.map((p) => at(e.axis, e.front, p)), fwd);
  lodPolygon(m, e.nozzle, b.map((p) => at(e.axis, e.back, p)), [-fwd[0], -fwd[1], -fwd[2]]);
}

/** The levels of detail, finest first: the fuselage's sides, the engines' sides, the stations' tolerance (of the fuselage's largest radius). */
const AIR_LEVELS: ReadonlyArray<readonly [n: number, ne: number, tol: number]> = [
  [14, 8, 0.01], [12, 8, 0.01], [12, 8, 0.03], [10, 8, 0.03], [10, 6, 0.03], [10, 6, 0.06], [8, 6, 0.06], [8, 5, 0.06],
  [8, 5, 0.12], [8, 4, 0.12], [6, 5, 0.12], [6, 4, 0.12], [6, 4, 0.25], [6, 4, 0.5],
];

/**
 * Builds the aircraft LOD within `budget` triangles at the finest level that fits:
 * optional parts give way first (lowest `optional` first), then the levels coarsen,
 * then the fins lose their thinnest band; the optional parts that fit again come back.
 */
export function airLod(spec: AirLodSpec, budget = 200): MeshBuilder {
  const palette = { ...LOD_PALETTE, ...spec.palette };
  const radius = Math.max(...spec.fuselage.flatMap((st) => {
    const c = [st.sec.reduce((s, p) => s + p[0], 0) / st.sec.length, st.sec.reduce((s, p) => s + p[1], 0) / st.sec.length];
    return st.sec.map((p) => Math.hypot(p[0] - c[0]!, p[1] - c[1]!));
  }));
  type Opt = { rank: number; key: object };
  const optional: Opt[] = [
    ...spec.wings.filter((w) => w.optional !== undefined).map((w) => ({ rank: w.optional!, key: w })),
    ...spec.fins.filter((f) => f.optional !== undefined).map((f) => ({ rank: f.optional!, key: f })),
    ...spec.engines.filter((e) => e.optional !== undefined).map((e) => ({ rank: e.optional!, key: e })),
    ...(spec.pods ?? []).filter((p) => p.optional !== undefined).map((p) => ({ rank: p.optional!, key: p })),
    ...(spec.parts ?? []).filter((p) => p.optional !== undefined).map((p) => ({ rank: p.optional!, key: p })),
  ].sort((a, b) => a.rank - b.rank);
  const finBands = new Map<AirFin, ReadonlyArray<readonly [number, string]>>(spec.fins.map((f) => [f, f.bands]));
  const build = (level: readonly [number, number, number], gone: Set<object>): MeshBuilder => {
    const [n, ne, tolRel] = level;
    const tol = tolRel * radius;
    const m = spec.builder ? spec.builder(palette) : new MeshBuilder(palette);
    const full: Ring[] = spec.fuselage.map((st) => ({ a: st.a, pts: resample(st.sec, n) }));
    const ws = spec.windscreen;
    const forced = [...(ws ? [ws.a0, ws.a1] : []), ...(spec.keep ?? [])];
    const withScreen = [...full, ...forced.map((a) => ({ ...ringAt(full, a), keep: true }))].sort((p, q) => p.a - q.a);
    const rings = simplifyRings(withScreen, tol);
    const paint = (s: number, a: number, p: Vec3) => (ws && a > ws.a0 && a < ws.a1 && s >= ws.s - 1e-9 ? LOD_GLASS : spec.paint(s, a, p));
    m.scope("fuselage", () => tube(m, spec.axis, rings, paint, { start: spec.tail, end: spec.nose, startMat: spec.tailMat, endMat: spec.noseMat }));
    m.scope("wings", () => { for (const w of spec.wings) if (!gone.has(w)) drawWing(m, w, tol); });
    m.scope("tail", () => { for (const f of spec.fins) if (!gone.has(f)) drawFin(m, f, finBands.get(f)!); });
    m.scope("engines", () => { for (const e of spec.engines) if (!gone.has(e)) drawEngine(m, e, ne); });
    for (const p of spec.pods ?? []) {
      if (gone.has(p)) continue;
      const pr = simplifyRings(p.stations.map((st) => ({ a: st.a, pts: resample(st.sec, p.sides ?? 6) })), tol);
      m.scope("pods", () => tube(m, p.axis, pr, () => p.mat, { start: p.back, end: p.front }));
    }
    m.scope("parts", () => { for (const p of spec.parts ?? []) if (!gone.has(p)) p.draw(m); });
    return m;
  };
  for (;;) {
    for (const level of AIR_LEVELS) {
      // optional parts first, then the next level
      for (let dropped = 0; dropped <= optional.length; dropped++) {
        const gone = new Set(optional.slice(0, dropped).map((o) => o.key));
        if (build(level, gone).triangleCount() > budget) continue;
        // bring back the optional parts that fit again, the most valued first
        for (let i = dropped - 1; i >= 0; i--) {
          gone.delete(optional[i]!.key);
          if (build(level, gone).triangleCount() > budget) gone.add(optional[i]!.key);
        }
        return build(level, gone);
      }
    }
    // the thinnest fin band, painted over by its thicker neighbour
    let best: { f: AirFin; i: number; t: number } | null = null;
    for (const f of spec.fins) {
      const b = finBands.get(f)!;
      if (b.length < 2) continue;
      const top = f.rings[f.rings.length - 1]![0];
      b.forEach(([y], i) => {
        const t = (b[i + 1]?.[0] ?? top) - Math.max(y, f.rings[0]![0]);
        if (!best || t < best.t) best = { f, i, t };
      });
    }
    if (!best) throw new Error(`the aircraft LOD does not fit ${budget} triangles`);
    const { f, i } = best as { f: AirFin; i: number };
    const b = finBands.get(f)!;
    const top = f.rings[f.rings.length - 1]![0];
    const asBands: LodBand[] = b.map(([y, mat], k) => [Math.max(y, f.rings[0]![0]), b[k + 1]?.[0] ?? top, mat]);
    finBands.set(f, mergeBand(asBands, i).map(([y, , mat]) => [y, mat] as const));
  }
}

// --- cable car cabins -----------------------------------------------------------------------

/** A cabin's body: plan rings by height, each band painted, glazing in LOD_GLASS. */
export interface CabinBody {
  /** The plan ring at `size` (an inset or a radius), at detail level `detail` (0 finest). */
  ring: (size: number, detail: number) => ReadonlyArray<readonly [number, number]>;
  /** The levels of ring detail there are. */
  details: number;
  /** [height, size] of the stations, bottom first. */
  stations: ReadonlyArray<readonly [number, number]>;
  /** The paint by height, bottom first, to the top (LodBand: y0, y1, material). */
  bands: readonly LodBand[];
  top: string;
  bottom: string;
}

export interface CabinLodSpec {
  palette: Record<string, MaterialSpec>;
  body?: CabinBody;
  parts: ReadonlyArray<{ draw: (m: MeshBuilder) => void; optional?: number }>;
}

/** Draws a cabin body at ring detail `detail` in `bands`. */
function cabinBody(m: MeshBuilder, b: CabinBody, detail: number, bands: readonly LodBand[]): void {
  // the stations plus a ring at every band edge, the size lerped
  const st = b.stations;
  const size = (y: number): number => {
    for (let i = 0; i + 1 < st.length; i++) if (y <= st[i + 1]![0] || i + 2 === st.length) return lerp(st[i]![1], st[i + 1]![1], (y - st[i]![0]) / (st[i + 1]![0] - st[i]![0]));
    return st[0]![1];
  };
  const ys = [...new Set([...st.map(([y]) => y), ...bands.flatMap(([a, c]) => [a, c])].filter((y) => y >= st[0]![0] - 1e-9 && y <= st[st.length - 1]![0] + 1e-9).map((y) => Math.round(y * 1e6) / 1e6))].sort((p, q) => p - q);
  const mats: string[] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const ym = (ys[i]! + ys[i + 1]!) / 2;
    mats.push((bands.find(([a, c]) => ym >= a && ym < c) ?? bands[bands.length - 1]!)[2]);
  }
  lodStack(m, ys.map((y) => [y, b.ring(size(y), detail)] as const), mats, b.top, b.bottom);
}

/**
 * Builds the cabin LOD within `budget` triangles: optional parts give way first,
 * then the rings' detail, then the thinnest colour band; optional parts that fit
 * again come back.
 */
export function cabinLod(spec: CabinLodSpec, budget = 100): MeshBuilder {
  const palette = { ...LOD_PALETTE, ...spec.palette };
  const optional = spec.parts.filter((p) => p.optional !== undefined).sort((a, b) => a.optional! - b.optional!);
  let bands = spec.body?.bands ?? [];
  const build = (detail: number, gone: Set<object>): MeshBuilder => {
    const m = new MeshBuilder(palette);
    if (spec.body) m.scope("body", () => cabinBody(m, spec.body!, detail, bands));
    m.scope("parts", () => { for (const p of spec.parts) if (!gone.has(p)) p.draw(m); });
    return m;
  };
  for (;;) {
    for (let detail = 0; detail < (spec.body?.details ?? 1); detail++) {
      for (let dropped = 0; dropped <= optional.length; dropped++) {
        const gone = new Set<object>(optional.slice(0, dropped));
        if (build(detail, gone).triangleCount() > budget) continue;
        for (let i = dropped - 1; i >= 0; i--) {
          gone.delete(optional[i]!);
          if (build(detail, gone).triangleCount() > budget) gone.add(optional[i]!);
        }
        return build(detail, gone);
      }
    }
    if (bands.length < 2) throw new Error(`the cabin LOD does not fit ${budget} triangles`);
    // the thinnest band goes, painted by its thicker neighbour
    let thin = 0;
    bands.forEach((b, i) => { if (b[1] - b[0] < bands[thin]![1] - bands[thin]![0]) thin = i; });
    bands = mergeBand(bands, thin);
  }
}
