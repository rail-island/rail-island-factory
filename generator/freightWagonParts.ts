// Shared parts of the container, flat, sliding-wall and hopper wagons
// (freightWagons.ts, hopperWagons.ts): the JT7 clip solid -- the intersection
// of an `alongx` section, an `alongz` elevation and an `alongy` plan, each a
// convex polygon, which is how a vlakosimdb simplemodel shapes its bodies --
// bold painted lettering, the Maersk star and a 40 ft container. Built on the wagons' Wagon (wagonParts.ts), in
// source coordinates: x along the wagon from 0, y up from the rail, +z the
// z_dec side. See docs/models/freight-wagons.md.

import type { Vec3 } from "./meshCore.ts";
import { Wagon } from "./wagonParts.ts";
import { strokeText } from "./strokeFont.ts";

export type Pt = [number, number];

/**
 * The running number each wagon carries on its sides: 12-digit UIC numbers with
 * their check digit, and where the number came from. See each SOURCES.md.
 */
export const FREIGHT_NUMBERS = {
  sqns: { number: "31 54 4571 018-1", source: "illustrative: the native lettering is not legible; UIC format of a CD container wagon" },
  pao: { number: "84 54 4606 400-6", source: "the Smm (ex Pao) on Commons photograph smm-paov-flat-wagon.jpg (RYKO Decin, 2006)" },
  habis: { number: "31 55 2763 185-9", source: "the Transwaggon Habis (H-MAV) on Commons photograph habis-kecskemet.jpg" },
  hadgs: { number: "31 54 2604 769-4", source: "read from Commons photograph hadgs-praha-01.jpg (the file description misprints it as 796-4)" },
  faccs: { number: "31 54 6990 999-0", source: "the Faccs on Commons photograph faccs-suchdol.jpg" },
  falls: { number: "31 54 6687 815-6", source: "the Falls on Commons photographs falls-ostrava-01/02.jpg" },
  wap: { number: "31 54 6650 213-7", source: "illustrative: the native lettering is not legible; UIC format of a CSD Falls (ex Wap)" },
} as const;

/** The UIC number in two painted lines (exchange code and country with the keeper, then the number), feet at y. */
export function numberLines(number: string, keeper: string, y: number, h: number): Array<{ text: string; y: number; h: number }> {
  const [code, country, type, serial] = number.split(" ") as [string, string, string, string];
  return [
    { text: `${code} ${country} ${keeper}`, y: y + h * 1.6, h },
    { text: `${type} ${serial}`, y, h },
  ];
}

/** A half-space n . p <= d. */
interface Plane {
  n: Vec3;
  d: number;
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * The half-spaces of a convex polygon in one of the three clip views: `axes`
 * names the model axes of the polygon's (u, v) -- [2, 1] for an alongx section
 * (z, y), [0, 1] for an alongz elevation (x, y), [0, 2] for an alongy plan (x, z).
 */
function polygonPlanes(poly: Pt[], axes: [number, number]): Plane[] {
  // a clip view must be convex: every turn the same way (a concave one is split into convex shapes by its caller)
  let turn = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b, d] = [poly[i]!, poly[(i + 1) % poly.length]!, poly[(i + 2) % poly.length]!];
    const cr = (b[0] - a[0]) * (d[1] - b[1]) - (b[1] - a[1]) * (d[0] - b[0]);
    if (Math.abs(cr) < 1e-9) continue;
    if (turn && Math.sign(cr) !== turn) throw new Error(`clip polygon is not convex at ${b.join(", ")}`);
    turn = Math.sign(cr);
  }
  const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
  const out: Plane[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    let [nu, nv] = [b[1] - a[1], -(b[0] - a[0])];
    const l = Math.hypot(nu, nv);
    if (l < 1e-9) continue;
    [nu, nv] = [nu / l, nv / l];
    if (nu * (c[0] - a[0]) + nv * (c[1] - a[1]) > 0) [nu, nv] = [-nu, -nv];
    const n: Vec3 = [0, 0, 0];
    n[axes[0]] = nu;
    n[axes[1]] = nv;
    const p: Vec3 = [0, 0, 0];
    p[axes[0]] = a[0];
    p[axes[1]] = a[1];
    out.push({ n, d: dot(n, p) });
  }
  return out;
}

/** The faces of a convex polyhedron (each an outward-wound loop with its normal) cut by the half-space `pl`. */
function clipFaces(faces: Array<{ pts: Vec3[]; n: Vec3 }>, pl: Plane): Array<{ pts: Vec3[]; n: Vec3 }> {
  const eps = 1e-9;
  const out: Array<{ pts: Vec3[]; n: Vec3 }> = [];
  const cap: Vec3[] = [];
  for (const f of faces) {
    const kept: Vec3[] = [];
    for (let i = 0; i < f.pts.length; i++) {
      const a = f.pts[i]!;
      const b = f.pts[(i + 1) % f.pts.length]!;
      const da = dot(pl.n, a) - pl.d;
      const db = dot(pl.n, b) - pl.d;
      if (da <= eps) kept.push(a);
      if (Math.abs(da) <= eps) cap.push(a);
      if ((da < -eps && db > eps) || (da > eps && db < -eps)) {
        const t = da / (da - db);
        const p: Vec3 = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
        kept.push(p);
        cap.push(p);
      }
    }
    if (kept.length >= 3) out.push({ pts: kept, n: f.n });
  }
  // the cap on the cutting plane: the distinct cut points in order about their centre
  const uniq: Vec3[] = [];
  for (const p of cap) if (!uniq.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-7)) uniq.push(p);
  // a plane that only touches the solid, or coincides with one of its faces, adds no cap
  const onPlane = out.some((f) => dot(f.n, pl.n) > 1 - 1e-9 && f.pts.every((p) => Math.abs(dot(pl.n, p) - pl.d) <= eps));
  if (uniq.length >= 3 && !onPlane) {
    const c = uniq.reduce<Vec3>((s, p) => [s[0] + p[0] / uniq.length, s[1] + p[1] / uniq.length, s[2] + p[2] / uniq.length], [0, 0, 0]);
    // an in-plane basis
    const ref: Vec3 = Math.abs(pl.n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u: Vec3 = [pl.n[1] * ref[2] - pl.n[2] * ref[1], pl.n[2] * ref[0] - pl.n[0] * ref[2], pl.n[0] * ref[1] - pl.n[1] * ref[0]];
    const v: Vec3 = [pl.n[1] * u[2] - pl.n[2] * u[1], pl.n[2] * u[0] - pl.n[0] * u[2], pl.n[0] * u[1] - pl.n[1] * u[0]];
    const ang = (p: Vec3) => {
      const q: Vec3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
      return Math.atan2(dot(q, v), dot(q, u));
    };
    uniq.sort((a, b) => ang(a) - ang(b));
    out.push({ pts: uniq, n: pl.n });
  }
  return out;
}

/** The three clip views of a JT7 simplemodel shape, each a convex polygon in source coordinates. */
export interface Clip {
  /** alongx: (z, y). */
  section?: Pt[];
  /** alongz: (x, y). */
  elevation?: Pt[];
  /** alongy: (x, z). */
  plan?: Pt[];
}

/**
 * The faces of a clip solid in source coordinates: the intersection of the
 * convex section, elevation and plan, each extruded across the other axis (as
 * JT7 draws a shape), as outward-wound loops with their normals.
 */
export function clipSolidFaces(clip: Clip): Array<{ pts: Vec3[]; n: Vec3 }> {
  const B = 100;
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Array<{ pts: Vec3[]; n: Vec3 }> => [
    { pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], n: [-1, 0, 0] },
    { pts: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], n: [1, 0, 0] },
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], n: [0, -1, 0] },
    { pts: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], n: [0, 1, 0] },
    { pts: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], n: [0, 0, -1] },
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], n: [0, 0, 1] },
  ];
  let faces = box(-B, B, -B, B, -B, B);
  const planes = [
    ...(clip.section ? polygonPlanes(clip.section, [2, 1]) : []),
    ...(clip.elevation ? polygonPlanes(clip.elevation, [0, 1]) : []),
    ...(clip.plan ? polygonPlanes(clip.plan, [0, 2]) : []),
  ];
  for (const pl of planes) faces = clipFaces(faces, pl);
  // the box's own faces survive only where no clip bounds that direction
  return faces.filter((f) => f.pts.every((p) => Math.abs(p[0]) < B - 1 && Math.abs(p[1]) < B - 1 && Math.abs(p[2]) < B - 1));
}

/**
 * Draws a clip solid (clipSolidFaces) on the wagon: every face, or only those
 * `keep` accepts (by outward normal) -- a face another part covers is left out.
 */
export function clipSolid(c: Wagon, mat: string, clip: Clip, keep?: (n: Vec3) => boolean): void {
  for (const f of clipSolidFaces(clip)) {
    if (keep && !keep(f.n)) continue;
    const pts: Vec3[] = [];
    const P = (p: Vec3): Vec3 => [c.X(p[0]), p[1], p[2]];
    for (let i = 1; i + 1 < f.pts.length; i++) pts.push(P(f.pts[0]!), P(f.pts[i]!), P(f.pts[i + 1]!));
    c.m.facets(mat, pts, f.n);
  }
}

/**
 * A painted strip on the side s of a clip solid with section `section`: source
 * x0..x1, from y0 to y1 up the section's outline, `proud` off each facet it
 * crosses (a stiffener, a crease line on a sloped hopper side).
 */
export function surfaceStrip(c: Wagon, mat: string, section: Pt[], s: number, x0: number, x1: number, y0: number, y1: number, proud: number): void {
  // the section's outline on side s, bottom to top
  const side = section.filter(([z]) => s * z > 0).sort((a, b) => a[1] - b[1]);
  for (let i = 0; i + 1 < side.length; i++) {
    const [za, ya] = side[i]!;
    const [zb, yb] = side[i + 1]!;
    const lo = Math.max(ya, y0);
    const hi = Math.min(yb, y1);
    if (hi - lo < 1e-6) continue;
    const zAt = (y: number) => za + ((y - ya) / (yb - ya)) * (zb - za);
    // the facet's outward normal in (z, y)
    const l = Math.hypot(yb - ya, za - zb);
    const [nz, ny] = [s * Math.abs(yb - ya) / l, ((za - zb) * s > 0 ? 1 : -1) * Math.abs(za - zb) / l];
    const P = (x: number, y: number): Vec3 => [c.X(x), y + ny * proud, zAt(y) + nz * proud];
    c.m.slab(mat, [P(x0, lo), P(x1, lo), P(x1, hi), P(x0, hi)], [0, -ny * proud * 0.5, -nz * proud * 0.5]);
  }
}

/**
 * Bold painted lettering on a flat face facing side s (+1: +z) at |z| = `face`:
 * `text` centred at source x, its foot at y, characters h tall and w wide `gap`
 * apart with strokes `stroke` wide, reading from outside.
 */
export function boldText(c: Wagon, mat: string, s: number, face: number, x: number, y: number, text: string, h: number, w: number, gap: number, stroke: number): void {
  const n = [...text].length;
  const width = n * w + (n - 1) * gap;
  const u0 = c.X(x) + (s > 0 ? -width / 2 : width / 2);
  c.m.facets(mat, strokeText(text, u0, y, h, w, gap, s < 0, stroke).map(([u, v]): Vec3 => [u, v, s * face]), [0, 0, s]);
}

/** A flat panel on a side face (|z| = face, side s): source x0..x1, y0..y1, `depth` deep into the face. */
export function sidePanel(c: Wagon, mat: string, s: number, face: number, x0: number, x1: number, y0: number, y1: number, depth = 0.01): void {
  c.sideBox(mat, s, x0, x1, y0, y1, face - depth, face);
}

/**
 * The Maersk seven-pointed star on its light blue square, on side s at |z| =
 * `face`: the square `size` across centred at (source x, y), the star a little
 * proud of it.
 */
export function maerskStar(c: Wagon, s: number, face: number, x: number, y: number, size: number): void {
  const m = c.m;
  m.scope("star square", () => sidePanel(c, "maerskBlue", s, face + 0.004, x - size / 2, x + size / 2, y - size / 2, y + size / 2, 0.006));
  m.scope("star", () => {
    const r1 = size * 0.42;
    const r0 = r1 * 0.42;
    const z = s * (face + 0.008);
    const pts: Vec3[] = [];
    const P = (r: number, a: number): Vec3 => [c.X(x) + r * Math.cos(a), y + r * Math.sin(a), z];
    for (let k = 0; k < 7; k++) {
      const a = Math.PI / 2 + (2 * Math.PI * k) / 7;
      const h = Math.PI / 7;
      // each point is a triangle; the centre a heptagon of the inner corners
      pts.push(P(r1, a), P(r0, a - h), P(r0, a + h));
      pts.push([c.X(x), y, z], P(r0, a + h), P(r0, a - h));
    }
    m.facets("letter", pts, [0, 0, s]);
  });
}

/**
 * An ISO 40 ft container (12.19 x 2.44 x 2.59 m) centred at source x `xc`, its
 * floor at y0: corrugated steel sides, end frames and corner castings, the doors
 * with four locking bars at the high-x end, and the corrugated front end.
 */
export function container40(c: Wagon, xc: number, y0: number): { x0: number; x1: number; y1: number; half: number } {
  const m = c.m;
  const L = 12.192;
  const half = 2.438 / 2;
  const H = 2.591;
  const [x0, x1, y1] = [xc - L / 2, xc + L / 2, y0 + H];
  m.scope("box", () => c.box("container", x0, x1, y0 + 0.003, y1 - 0.003, -half, half));
  m.scope("frame", () => {
    // the bottom and top rails along both sides
    for (const s of [-1, 1]) {
      c.sideBox("containerFrame", s, x0, x1, y0, y0 + 0.12, half - 0.01, half + 0.02);
      c.sideBox("containerFrame", s, x0, x1, y1 - 0.1, y1, half - 0.01, half + 0.02);
    }
    // the corner posts, proud of the ribs at both ends
    for (const s of [-1, 1])
      for (const [a, b] of [[x0 - 0.02, x0 + 0.14], [x1 - 0.14, x1 + 0.02]] as Array<[number, number]>) c.sideBox("containerFrame", s, a, b, y0, y1, half - 0.14, half + 0.03);
    // the end rails across
    for (const [a, b] of [[x0 - 0.02, x0 + 0.01], [x1 - 0.01, x1 + 0.02]] as Array<[number, number]>) {
      c.box("containerFrame", a, b, y0, y0 + 0.15, -half + 0.14, half - 0.14);
      c.box("containerFrame", a, b, y1 - 0.12, y1, -half + 0.14, half - 0.14);
    }
  });
  m.scope("side ribs", () => {
    // vertical corrugation: one rib every 0.278 m between the corner posts (the native z_dec's columns)
    const n = 42;
    const pitch = (L - 0.4) / n;
    for (const s of [-1, 1])
      for (let k = 0; k < n; k++) {
        const x = x0 + 0.2 + (k + 0.5) * pitch;
        c.sideBox("containerRib", s, x - 0.06, x + 0.06, y0 + 0.12, y1 - 0.1, half - 0.01, half + 0.012);
      }
  });
  m.scope("front end ribs", () => {
    for (let k = 0; k < 7; k++) {
      const z = -half + 0.24 + k * ((2 * half - 0.48) / 6);
      c.box("containerRib", x0 - 0.012, x0 + 0.01, y0 + 0.15, y1 - 0.12, z - 0.06, z + 0.06);
    }
  });
  m.scope("doors", () => {
    // two leaves, the seam between them, and four locking bars with their handles
    c.box("containerRib", x1 + 0.005, x1 + 0.012, y0 + 0.15, y1 - 0.12, -0.012, 0.012);
    for (const z of [-0.82, -0.42, 0.42, 0.82]) {
      c.box("containerFrame", x1 + 0.012, x1 + 0.06, y0 + 0.16, y1 - 0.13, z - 0.022, z + 0.022);
      c.box("containerFrame", x1 + 0.06, x1 + 0.09, y0 + 1.0, y0 + 1.08, z - 0.022, z + 0.18);
    }
  });
  m.scope("corner castings", () => {
    for (const x of [x0 - 0.03, x1 - 0.15])
      for (const y of [y0 - 0.01, y1 - 0.11])
        for (const s of [-1, 1]) c.sideBox("containerFrame", s, x, x + 0.18, y, y + 0.12, half - 0.15, half + 0.035);
  });
  return { x0, x1, y1, half };
}
