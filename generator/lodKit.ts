// The shared kit of the dedicated low level of detail (docs/models/lod.md): a
// vehicle's distant body as a stack of plan rings painted in its livery's
// colour bands, its windscreens and window bands in one dark glass, and coarse
// blocks for running gear, roof equipment and pantographs. A family's adapter
// fills a LodSpec from the family kit's own dimensions and livery; `fitLod`
// builds it and gives up detail in a fixed order until the budget holds:
// optional parts, then profile detail, then the least visible colour band, then
// windows.
//
// Metres, +X forward, +Y up, +Z right, as the full models. Every face is a
// planar convex polygon (a quad split in two where it is not quite planar);
// faces of different colours never overlap in one plane.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { drawJoint, type JointRig, type SectionRig } from "./rig.ts";

// --- bands ----------------------------------------------------------------------------

/** A colour band: from y0 to y1, its material (the full models' Band, ribs ignored). */
export type LodBand = readonly [y0: number, y1: number, mat: string, ...rest: unknown[]];

/** A lerp table [y, value], bottom first. */
export type Table = ReadonlyArray<readonly [number, number]>;

/** The material of `bands` at height y; below the first or above the last band, that band's. */
export function lodBandAt(bands: readonly LodBand[], y: number): string {
  const b = bands.find(([y0, y1]) => y >= y0 && y < y1) ?? (y < bands[0]![0] ? bands[0] : bands[bands.length - 1]);
  return b![2];
}

/** `bands` clipped to y0..y1, gaps closed and neighbours of one colour joined. */
export function lodBands(bands: readonly LodBand[], y0: number, y1: number): LodBand[] {
  const out: Array<[number, number, string]> = [];
  for (const [a, b, mat] of bands) {
    const lo = Math.max(a, y0);
    const hi = Math.min(b, y1);
    if (hi <= lo + 1e-9) continue;
    const last = out[out.length - 1];
    if (last && last[2] === mat) last[1] = hi;
    else out.push([last ? last[1] : y0, hi, mat]);
  }
  if (!out.length) throw new Error("no band between the heights");
  out[out.length - 1]![1] = y1;
  return out;
}

/** `bands` with band i painted over by its thicker neighbour. */
export function mergeBand(bands: readonly LodBand[], i: number): LodBand[] {
  const t = (k: number) => (bands[k] ? bands[k]![1] - bands[k]![0] : -1);
  const into = t(i - 1) >= t(i + 1) ? i - 1 : i + 1;
  const out = bands.map((b, k): LodBand => (k === i ? [b[0], b[1], bands[into]![2]] : b));
  return lodBands(out, out[0]![0], out[out.length - 1]![1]);
}

/** Two band lists paint alike. */
const sameBands = (a: readonly LodBand[], b: readonly LodBand[]): boolean =>
  a.length === b.length && a.every((x, k) => x[0] === b[k]![0] && x[1] === b[k]![1] && x[2] === b[k]![2]);

// --- tables -----------------------------------------------------------------------------

export function lerp(table: Table, y: number): number {
  if (y <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [y0, v0] = table[i - 1]!, [y1, v1] = table[i]!;
    if (y <= y1) return y1 === y0 ? v1 : v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
  }
  return table[table.length - 1]![1];
}

/** `table` with the points that lie within `tol` of the line through their neighbours dropped (Douglas-Peucker). */
export function simplifyTable(table: Table, tol: number): Table {
  if (table.length <= 2 || tol <= 0) return table;
  const keep = new Array<boolean>(table.length).fill(false);
  keep[0] = keep[table.length - 1] = true;
  const walk = (a: number, b: number) => {
    let worst = -1, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(table[i]![1] - lerp([table[a]!, table[b]!], table[i]![0]));
      if (d > worst) [worst, at] = [d, i];
    }
    if (worst > tol) {
      keep[at] = true;
      walk(a, at);
      walk(at, b);
    }
  };
  walk(0, table.length - 1);
  return table.filter((_, i) => keep[i]);
}

// --- primitives -------------------------------------------------------------------------

/** The one dark material of every vehicle LOD's windscreens and window bands. */
export const LOD_GLASS = "lodGlass";
export const LOD_PALETTE: Record<string, MaterialSpec> = {
  [LOD_GLASS]: { color: "#1f262e", metallic: 0.2, roughness: 0.3 },
};

const cross = (u: readonly number[], v: readonly number[]): Vec3 =>
  [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

/** One convex polygon, fanned from its first point, each triangle wound to face `n`. */
export function lodPolygon(m: MeshBuilder, mat: string, pts: readonly Vec3[], n: Vec3): void {
  for (let k = 1; k + 1 < pts.length; k++) {
    const [a, b, c] = [pts[0]!, pts[k]!, pts[k + 1]!];
    if (dot(cross(sub(b, a), sub(c, a)), n) >= 0) m.tri(mat, a, b, c);
    else m.tri(mat, a, c, b);
  }
}

/** A quad section (x, y) swept across z0..z1: both sides and, unless `ends` is false, both ends; no top or bottom. */
export function lodSideBox(m: MeshBuilder, mat: string, sec: ReadonlyArray<readonly [number, number]>, z0: number, z1: number, ends = true): void {
  for (const z of [z0, z1]) lodPolygon(m, mat, sec.map(([x, y]): Vec3 => [x, y, z]), [0, 0, Math.sign(z) || 1]);
  if (!ends) return;
  // sec runs bottom-rear, bottom-front, top-front, top-rear: the rear and front walls
  for (const [i, j, nx] of [[0, 3, -1], [1, 2, 1]] as const) {
    const [p, q] = [sec[i]!, sec[j]!];
    lodPolygon(m, mat, [[p[0], p[1], z0], [p[0], p[1], z1], [q[0], q[1], z1], [q[0], q[1], z0]], [nx, 0, 0]);
  }
}

/**
 * A box along x from x0 to x1 whose section narrows from half width w0 at y0
 * to w1 at y1: both sides, the top and both ends; no bottom (it stands on the roof).
 */
export function lodRoofBox(m: MeshBuilder, mat: string, x0: number, x1: number, w0: number, w1: number, y0: number, y1: number): void {
  const sec = (x: number): Vec3[] => [[x, y0, -w0], [x, y0, w0], [x, y1, w1], [x, y1, -w1]];
  const [r, f] = [sec(x0), sec(x1)];
  lodPolygon(m, mat, r, [-1, 0, 0]);
  lodPolygon(m, mat, f, [1, 0, 0]);
  lodPolygon(m, mat, [r[1]!, f[1]!, f[2]!, r[2]!], [0, 0, 1]);
  lodPolygon(m, mat, [r[0]!, f[0]!, f[3]!, r[3]!], [0, 0, -1]);
  lodPolygon(m, mat, [r[2]!, f[2]!, f[3]!, r[3]!], [0, 1, 0]);
}

/** A three-sided rod from p to q, r thick, open-ended, standing in an x-y plane: a pantograph arm from afar. */
export function lodRod(m: MeshBuilder, mat: string, p: Vec3, q: Vec3, r: number): void {
  const d = sub(q, p);
  const l = Math.hypot(...d);
  const t = d.map((x) => x / l);
  const a = [0, 0, 1];
  const b = cross(t, a);
  const off = (k: number): Vec3 => {
    const ang = (2 * Math.PI * k) / 3 + Math.PI / 2;
    return [0, 1, 2].map((i) => r * (Math.cos(ang) * a[i]! + Math.sin(ang) * b[i]!)) as Vec3;
  };
  // the three faces but the one looking down most: never seen from the game's camera
  const faces = [0, 1, 2].map((k) => {
    const [o0, o1] = [off(k), off(k + 1)];
    return { o0, o1, n: [o0[0] + o1[0], o0[1] + o1[1], o0[2] + o1[2]] as Vec3 };
  });
  const down = faces.reduce((a, f) => (f.n[1] < a.n[1] - 1e-9 ? f : a));
  const at = (c: Vec3, o: Vec3): Vec3 => [c[0] + o[0], c[1] + o[1], c[2] + o[2]];
  for (const f of faces) if (f !== down) lodPolygon(m, mat, [at(p, f.o0), at(p, f.o1), at(q, f.o1), at(q, f.o0)], f.n);
}

/** The wall across z (-hz..hz) on the edge i-j of the convex outline `poly` (x, y), facing away from its centre. */
function lodWall(m: MeshBuilder, mat: string, poly: ReadonlyArray<readonly [number, number]>, i: number, j: number, hz: number): void {
  const [p, q] = [poly[i]!, poly[j]!];
  const cx = poly.reduce((s, v) => s + v[0], 0) / poly.length;
  const cy = poly.reduce((s, v) => s + v[1], 0) / poly.length;
  const n: Vec3 = [(p[0] + q[0]) / 2 - cx, (p[1] + q[1]) / 2 - cy, 0];
  lodPolygon(m, mat, [[p[0], p[1], -hz], [q[0], q[1], -hz], [q[0], q[1], hz], [p[0], p[1], hz]], n);
}

export interface LodPantograph {
  /** The base frame's centre along x. */
  x: number;
  /** The roof it stands on and its base frame's top. */
  roofY: number;
  baseY: number;
  /** +1: the hinge stands toward +x of the centre and the knee points to -x. */
  h: number;
  raised: boolean;
  /** The collector's top when raised. */
  raisedTop: number;
  lower?: number;
  upper?: number;
  /** Half the collector's width. */
  halfHead?: number;
  mat?: string;
}

/**
 * A single-arm pantograph from afar: the lower and upper arm as thin rods (the
 * knee found as the full kits find it, intersecting circles about the hinge and
 * the head) and the collector as a ridged bar (6 triangles in all, its flat
 * underside left out); folded, one low ridge over the base frame (6 triangles).
 * A diamond pantograph is drawn the same way from afar.
 */
export function lodPantograph(m: MeshBuilder, p: LodPantograph): void {
  const mat = p.mat ?? "pantograph";
  const { x: xc, baseY: y, h } = p;
  const L1 = p.lower ?? 1.55, L2 = p.upper ?? 1.3;
  const half = p.halfHead ?? 0.92;
  if (!p.raised) {
    const ridge: Array<[number, number]> = [[xc - h * 0.75, p.roofY - 0.02], [xc + h * 1.05, p.roofY - 0.02], [xc + h * 0.2, y + 0.24]];
    lodPolygon(m, mat, ridge.map(([u, v]): Vec3 => [u, v, -0.62]), [0, 0, -1]);
    lodPolygon(m, mat, ridge.map(([u, v]): Vec3 => [u, v, 0.62]), [0, 0, 1]);
    lodWall(m, mat, ridge, 0, 2, 0.62);
    lodWall(m, mat, ridge, 2, 1, 0.62);
    return;
  }
  const xh = xc + h * 0.5;
  const hingeY = y + 0.11;
  const f1 = Math.sqrt(L1 * L1 - 0.11 * 0.11), f2 = Math.sqrt(L2 * L2 - 0.09 * 0.09);
  const hx = xh - h * f1 + h * f2;
  const headY = p.raisedTop - 0.07;
  const dx = hx - xh, dy = headY - 0.02 - hingeY;
  const dist = Math.hypot(dx, dy);
  const along = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const across = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  const cands = [1, -1].map((k) => [xh + (along * dx - k * across * dy) / dist, hingeY + (along * dy + k * across * dx) / dist] as const);
  const [kx, ky] = cands.reduce((p0, p1) => (h * (p1[0] - xh) < h * (p0[0] - xh) ? p1 : p0));
  lodRod(m, mat, [xh, p.roofY - 0.02, 0], [kx, ky, 0], 0.08);
  lodRod(m, mat, [kx, ky, 0], [hx, headY, 0], 0.06);
  const bar: Array<[number, number]> = [[hx - 0.15, headY - 0.02], [hx + 0.15, headY - 0.02], [hx, headY + 0.07]];
  lodWall(m, mat, bar, 1, 2, half);
  lodWall(m, mat, bar, 2, 0, half);
}

// --- the shell ----------------------------------------------------------------------------

/** A rectangle painted on a face: u along the face (x on a side, z on an end), y up. */
export interface LodRect {
  u: readonly [number, number];
  y: readonly [number, number];
  mat: string;
  /** Sides only: also at -x (a cab item drawn at both ends). */
  mirror?: boolean;
  /** Sides only: +1 right, -1 left; default both. */
  sides?: readonly number[];
  /** Ends only: +1 front, -1 rear; default both. */
  ends?: readonly number[];
  /** A small window is an optional part (given up first, lowest first), not a window band. */
  optional?: number;
}

/**
 * A body as a stack of plan rings: the end's centre line tip(y) from xc, the
 * half width hw(y), and the corner's setback behind the tip (a vee-shaped or
 * rounded nose seen from above becomes a vee). The bottom is open.
 */
export interface LodShell {
  y0: number;
  /** [y, |x|] of the end's centre line, bottom first; the last height is the crown. */
  tip: Table;
  /** [y, half width], bottom first. */
  hw: Table;
  /** [y, setback] of the corners behind the tip; omitted for a flat end. */
  setback?: Table;
  xc?: number;
  /** Paint of the sides and of the ends, bottom first, to the crown. */
  side: readonly LodBand[];
  end: readonly LodBand[];
  /** The cab sections (|x - xc| beyond `x`) painted in their own bands on the sides. */
  cab?: { x: number; side: readonly LodBand[] };
  /** The crown's cap. */
  roof: string;
  /** Windows: on the sides (u = x) and on the ends (u = z seen from the front). */
  sideWindows?: readonly LodRect[];
  endWindows?: readonly LodRect[];
  /** Which ends are drawn: a hood abutting a cab hides one. Default both. */
  ends?: readonly number[];
  /** The section of an articulated LOD it belongs to (LodSpec.sections); default 0. */
  section?: number;
}

/** A face cell: from u0 to u1 (null: the outline's own edge), one material. */
type Cell = [u0: number | null, u1: number | null, mat: string];

/** The cells of a layer of a face: band paint, cab regions and windows, neighbours of one colour joined. */
function cells(base: string, regions: ReadonlyArray<readonly [number, number, string]>): Cell[] {
  const cuts = [...new Set(regions.flatMap(([a, b]) => [a, b]))].sort((a, b) => a - b);
  const bounds: Array<number | null> = [null, ...cuts, null];
  const out: Cell[] = [];
  for (let i = 1; i < bounds.length; i++) {
    const [a, b] = [bounds[i - 1]!, bounds[i]!];
    const mid = a === null ? (b ?? 0) - 1e3 : b === null ? a + 1e3 : (a + b) / 2;
    let mat = base;
    for (const [r0, r1, rm] of regions) if (mid > r0 && mid < r1) mat = rm;
    const last = out[out.length - 1];
    if (last && last[2] === mat) last[1] = b;
    else out.push([a, b, mat]);
  }
  return out;
}

const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((c, k) => c[0] === b[k]![0] && c[1] === b[k]![1] && c[2] === b[k]![2]);

/** The layers of a face between `hs`, each with its cells; neighbours alike joined unless a profile kinks between them. */
function layers(hs: number[], kinks: Set<number>, at: (y0: number, y1: number) => Cell[]): Array<[number, number, Cell[]]> {
  const out: Array<[number, number, Cell[]]> = [];
  for (let i = 1; i < hs.length; i++) {
    const [y0, y1] = [hs[i - 1]!, hs[i]!];
    const c = at(y0, y1);
    const last = out[out.length - 1];
    if (last && !kinks.has(y0) && sameCells(last[2], c)) last[1] = y1;
    else out.push([y0, y1, c]);
  }
  return out;
}

/** Draws `sh`; `tol` simplifies its profile tables first. */
export function lodShell(m: MeshBuilder, sh: LodShell, tol = 0, flat = false): void {
  // flat: a vee nose drawn as a flat end halfway back
  const tipT0 = flat && sh.setback ? sh.tip.map(([y, x]) => [y, x - lerp(sh.setback!, y) / 2] as const) : sh.tip;
  const tipT = simplifyTable(tipT0, tol), hwT = simplifyTable(sh.hw, tol);
  const sbT = sh.setback && !flat ? simplifyTable(sh.setback, tol) : null;
  const y0 = sh.y0, top = tipT[tipT.length - 1]![0];
  const xc = sh.xc ?? 0;
  const tip = (y: number) => lerp(tipT, y);
  const hw = (y: number) => lerp(hwT, y);
  const sb = (y: number) => (sbT ? lerp(sbT, y) : 0);
  const corner = (y: number) => tip(y) - sb(y);
  const kinks = new Set([...tipT, ...hwT, ...(sbT ?? [])].map(([y]) => y).filter((y) => y > y0 && y < top));
  const breaks = (bands: readonly LodBand[], wins: readonly LodRect[]) => [
    y0, top, ...kinks,
    ...bands.flatMap(([a, b]) => [a, b]),
    ...wins.flatMap((w) => [w.y[0], w.y[1]]),
  ];
  const sorted = (ys: number[]) => [...new Set(ys.filter((y) => y >= y0 && y <= top).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);

  // the sides: x cells between the profile's two corners
  const sideW = sh.sideWindows ?? [];
  for (const s of [-1, 1]) {
    const wins = sideW.filter((w) => !w.sides || w.sides.includes(s)).flatMap((w) => (w.mirror ? [w, { ...w, u: [-w.u[1], -w.u[0]] as const }] : [w]));
    const hs = sorted(breaks([...sh.side, ...(sh.cab?.side ?? [])], wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const ym = (ya + yb) / 2;
      const regions: Array<[number, number, string]> = [];
      if (sh.cab) {
        const cm = lodBandAt(sh.cab.side, ym);
        if (cm !== lodBandAt(sh.side, ym)) regions.push([-1e3, xc - sh.cab.x, cm], [xc + sh.cab.x, 1e3, cm]);
      }
      for (const w of wins) if (w.y[0] <= ya + 1e-9 && w.y[1] >= yb - 1e-9) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(lodBandAt(sh.side, ym), regions);
    });
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        const pt = (u: number | null, y: number, end: number): Vec3 => [u === null ? xc + end * corner(y) : Math.max(xc - corner(y), Math.min(xc + corner(y), u)), y, s * hw(y)];
        lodPolygon(m, mat, [pt(u0, ya, -1), pt(u1, ya, 1), pt(u1, yb, 1), pt(u0, yb, -1)], [0, 0, s]);
      }
    }
  }

  // the ends: z cells across the face; a vee nose splits at the centre line
  for (const e of sh.ends ?? [-1, 1]) {
    // a windscreen within 0.2 m of the corners spans the whole face: one cell, not three
    const snap = (u: number, y: number) => (Math.abs(u) >= lerp(hwT, y) - 0.2 ? Math.sign(u) * 1e3 : u);
    const wins = (sh.endWindows ?? []).filter((w) => !w.ends || w.ends.includes(e)).map((w) => {
      const u = e > 0 ? w.u : [-w.u[1], -w.u[0]];
      const y = (w.y[0] + w.y[1]) / 2;
      return { ...w, u: [snap(u[0]!, y), snap(u[1]!, y)] as readonly [number, number] };
    });
    const hs = sorted(breaks(sh.end, wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const regions: Array<[number, number, string]> = [];
      for (const w of wins) if (w.y[0] <= ya + 1e-9 && w.y[1] >= yb - 1e-9) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(lodBandAt(sh.end, (ya + yb) / 2), regions);
    });
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        // the vee: split each cell at z = 0, where the plan kinks
        const spans: Array<[number | null, number | null]> = sbT && (u0 === null || u0 < 0) && (u1 === null || u1 > 0) ? [[u0, 0], [0, u1]] : [[u0, u1]];
        for (const [a, b] of spans) {
          const pt = (u: number | null, y: number, side: number): Vec3 => {
            const z = u === null ? side * hw(y) : Math.max(-hw(y), Math.min(hw(y), u));
            return [xc + e * (tip(y) - (sb(y) * Math.abs(z)) / hw(y)), y, z];
          };
          const q = [pt(a, ya, -1), pt(b, ya, 1), pt(b, yb, 1), pt(a, yb, -1)];
          lodPolygon(m, mat, [q[0]!, q[1]!, q[2]!], [e, 0, 0]);
          lodPolygon(m, mat, [q[0]!, q[2]!, q[3]!], [e, 0, 0]);
        }
      }
    }
  }

  // the crown
  const [ct, cw, cc] = [tip(top), hw(top), corner(top)];
  const ring: Vec3[] = sbT
    ? [[xc + ct, top, 0], [xc + cc, top, cw], [xc - cc, top, cw], [xc - ct, top, 0], [xc - cc, top, -cw], [xc + cc, top, -cw]]
    : [[xc + ct, top, -cw], [xc + ct, top, cw], [xc - ct, top, cw], [xc - ct, top, -cw]];
  if (cw > 1e-6) lodPolygon(m, sh.roof, ring, [0, 1, 0]);
}

// --- fitting --------------------------------------------------------------------------------

/** A part of the LOD besides the shells: drawn by `draw`; optional parts give way first, lowest `optional` first. */
export interface LodPart {
  draw: (m: MeshBuilder) => void;
  optional?: number;
  /** The section of an articulated LOD it belongs to (LodSpec.sections); default 0. */
  section?: number;
}

/**
 * An articulated LOD's sections (docs/models/vehicle-rig.md): section i is the
 * node `section<i>` pivoted at its hinge with section i - 1, and a bellows joins
 * each covered gap, drawn by the rig's own `drawJoint` so the game re-skins it.
 */
export interface LodSections {
  /** The sections' pivots, front first; the first is [0, 0, 0]. */
  pivots: Vec3[];
  /** The bellows of each covered gap: the sections it joins, its faces' x and its cross-section (z, y). */
  joints: Array<{ sections: [number, number]; front: number; rear: number; profile: Array<[number, number]> }>;
  maxBendDeg: number;
  /** The bellows' material (in the palette). */
  material?: string;
}

export interface LodSpec {
  palette: Record<string, MaterialSpec>;
  shells: LodShell[];
  parts: LodPart[];
  sections?: LodSections;
}

/** Draws an articulated LOD's sections and joints, `draw(i)` drawing section i, and sets its rig. */
function drawSections(m: MeshBuilder, sp: LodSections, draw: (i: number) => void): void {
  const rigSections: SectionRig[] = sp.pivots.map((pivot, i) => ({ node: `section${i}`, pivot }));
  rigSections.forEach((s, i) => m.part(s.node, s.pivot as Vec3, () => draw(i)));
  const joints: JointRig[] = sp.joints.map((j, i) => ({
    node: `joint${i}`, sections: j.sections, front: j.front, rear: j.rear, profile: j.profile,
    // one fold: the fewest rings the rig draws (2 x 2 triangles per profile edge)
    folds: 1, depth: 0, material: sp.material ?? "bellows",
  }));
  for (const j of joints) m.part(j.node, [0, 0, 0], () => drawJoint(m, j, rigSections));
  m.rig = { sections: rigSections, joints, maxBendDeg: sp.maxBendDeg };
}

/** The profile's detail, step by step: how far the tables may be simplified, and whether a vee nose is flattened. */
const PROFILE: ReadonlyArray<readonly [tol: number, flat: boolean]> = [[0, false], [0.03, false], [0.08, false], [0.08, true], [0.15, true], [0.25, true], [0.4, true]];

/**
 * Builds `spec` within `budget` triangles. Detail goes in a fixed order: the
 * optional parts (lowest `optional` first), the profile's finer kinks, the
 * least visible colour band (thin and short: end and cab bands count half),
 * then the smallest window. Deterministic.
 */
export function fitLod(spec: LodSpec, budget: number): MeshBuilder {
  let shells = spec.shells.map((s) => ({ ...s }));
  // the optional parts and small windows, in the order they give way
  type Optional = { rank: number; part?: LodPart; win?: LodRect };
  const optional: Optional[] = [
    ...spec.parts.filter((p) => p.optional !== undefined).map((p) => ({ rank: p.optional!, part: p })),
    ...spec.shells.flatMap((sh) => [...(sh.sideWindows ?? []), ...(sh.endWindows ?? [])]).filter((w) => w.optional !== undefined).map((w) => ({ rank: w.optional!, win: w })),
  ].sort((a, b) => a.rank - b.rank);
  let dropped = 0;
  // optional parts given up but brought back once the bands and profile have made room, best first
  const back = new Set<Optional>();
  let tol = 0;
  const build = (): MeshBuilder => {
    const m = new MeshBuilder({ ...LOD_PALETTE, ...spec.palette });
    const gone = new Set(optional.slice(0, dropped).filter((o) => !back.has(o)).flatMap((o) => [o.part, o.win]));
    const keep = (ws?: readonly LodRect[]) => ws?.filter((w) => !gone.has(w));
    const draw = (section: number | null) => {
      const mine = (x: { section?: number }) => section === null || (x.section ?? 0) === section;
      m.scope("body", () => { for (const sh of shells) if (mine(sh)) lodShell(m, { ...sh, sideWindows: keep(sh.sideWindows), endWindows: keep(sh.endWindows) }, ...PROFILE[tol]!); });
      m.scope("parts", () => { for (const p of spec.parts) if (mine(p) && !gone.has(p)) p.draw(m); });
    };
    if (spec.sections) drawSections(m, spec.sections, draw);
    else draw(null);
    return m;
  };
  for (;;) {
    const m = build();
    if (m.triangleCount() <= budget) {
      let best = m;
      for (let i = dropped - 1; i >= 0; i--) {
        back.add(optional[i]!);
        const more = build();
        if (more.triangleCount() <= budget) best = more;
        else back.delete(optional[i]!);
      }
      return best;
    }
    if (dropped < optional.length) { dropped++; continue; }
    if (tol < PROFILE.length - 1) { tol++; continue; }
    // the least visible band of any shell
    let best: { score: number; apply: () => void } | null = null;
    const offer = (score: number, apply: () => void) => { if (!best || score < best.score - 1e-9) best = { score, apply }; };
    shells.forEach((sh, k) => {
      const set = (patch: Partial<LodShell>) => { shells = shells.map((x, j) => (j === k ? { ...x, ...patch } : x)); };
      // a side band painted the same on the ends goes from both at once
      const twin = (b: LodBand) => sh.end.findIndex((e) => e[0] === b[0] && e[1] === b[1] && e[2] === b[2]);
      if (sh.side.length > 1) sh.side.forEach((b, i) => {
        const j = sh.end.length > 1 ? twin(b) : -1;
        offer((b[1] - b[0]) * (j >= 0 ? 1.5 : 1), () => set(j >= 0 ? { side: mergeBand(sh.side, i), end: mergeBand(sh.end, j) } : { side: mergeBand(sh.side, i) }));
      });
      if (sh.end.length > 1) sh.end.forEach((b, j) => {
        if (sh.side.some((x) => x[0] === b[0] && x[1] === b[1] && x[2] === b[2])) return;
        offer((b[1] - b[0]) * 0.5, () => set({ end: mergeBand(sh.end, j) }));
      });
      // a cab band given up shows the machine room's colours at its height
      if (sh.cab) sh.cab.side.forEach(([a, b, mat], i) => {
        if (lodBands(sh.side, a, b).every(([, , bm]) => bm === mat)) return;
        offer((b - a) * 0.5, () => {
          const merged = lodBands([...sh.cab!.side.slice(0, i), ...lodBands(sh.side, a, b), ...sh.cab!.side.slice(i + 1)], sh.cab!.side[0]![0], sh.cab!.side[sh.cab!.side.length - 1]![1]);
          set({ cab: sameBands(merged, lodBands(sh.side, merged[0]![0], merged[merged.length - 1]![1])) ? undefined : { ...sh.cab!, side: merged } });
        });
      });
    });
    if (best) { (best as { apply: () => void }).apply(); continue; }
    // the smallest window
    const wins = shells.flatMap((sh, k) => [
      ...(sh.sideWindows ?? []).map((w) => ({ k, w, side: true })),
      ...(sh.endWindows ?? []).map((w) => ({ k, w, side: false })),
    ]).filter(({ w }) => w.optional === undefined);
    if (!wins.length) throw new Error(`the LOD does not fit ${budget} triangles`);
    const area = (w: LodRect) => (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]);
    const small = wins.reduce((a, b) => (area(b.w) < area(a.w) - 1e-9 ? b : a));
    shells = shells.map((sh, j) => j !== small.k ? sh : small.side
      ? { ...sh, sideWindows: sh.sideWindows!.filter((w) => w !== small.w) }
      : { ...sh, endWindows: sh.endWindows!.filter((w) => w !== small.w) });
  }
}

// --- running gear -----------------------------------------------------------------------------

/** A rail bogie from afar: a dark block narrowing toward the rail like its wheels, from the rail to `top`. */
export function lodBogie(m: MeshBuilder, xc: number, halfLength: number, top: number, hz = 1.12, mat = "bogie"): void {
  lodSideBox(m, mat, [[xc - halfLength + 0.35, 0.08], [xc + halfLength - 0.35, 0.08], [xc + halfLength, top], [xc - halfLength, top]], -hz, hz);
}

/**
 * Windows seen from afar: rectangles whose heights overlap by half or more
 * and whose gaps are under `gap` become one (a split windscreen, a row of
 * side windows becomes a band), in `mat`.
 */
export function windowBands(rects: ReadonlyArray<{ u: readonly [number, number]; y: readonly [number, number] }>, gap: number, mat = LOD_GLASS): LodRect[] {
  const sorted = [...rects].sort((a, b) => a.u[0] - b.u[0] || a.y[0] - b.y[0]);
  const out: Array<{ u: [number, number]; y: [number, number] }> = [];
  for (const r of sorted) {
    const hit = out.find((o) => {
      const overlap = Math.min(o.y[1], r.y[1]) - Math.max(o.y[0], r.y[0]);
      return overlap >= 0.5 * Math.min(o.y[1] - o.y[0], r.y[1] - r.y[0]) && r.u[0] - o.u[1] <= gap && o.u[0] - r.u[1] <= gap;
    });
    if (hit) {
      hit.u = [Math.min(hit.u[0], r.u[0]), Math.max(hit.u[1], r.u[1])];
      hit.y = [Math.min(hit.y[0], r.y[0]), Math.max(hit.y[1], r.y[1])];
    } else out.push({ u: [r.u[0], r.u[1]], y: [r.y[0], r.y[1]] });
  }
  return out.map((o) => ({ ...o, mat }));
}

// --- generic solids -----------------------------------------------------------------------------

/** A vertical prism over the convex ring (x, z) from y0 to y1: walls and top, no bottom. */
export function lodPrism(m: MeshBuilder, mat: string, ring: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, top: string = mat): void {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  for (let i = 0; i < ring.length; i++) {
    const [a, b] = [ring[i]!, ring[(i + 1) % ring.length]!];
    lodPolygon(m, mat, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [(a[0] + b[0]) / 2 - cx, 0, (a[1] + b[1]) / 2 - cz]);
  }
  lodPolygon(m, top, ring.map(([x, z]): Vec3 => [x, y1, z]), [0, 1, 0]);
}

/** A regular n-gon (x, z) about (cx, cz), radius r. */
export function lodNgon(n: number, r: number, cx = 0, cz = 0, rot = 0): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (2 * Math.PI * i) / n;
    return [cx + r * Math.cos(a), cz + r * Math.sin(a)] as [number, number];
  });
}

/** A road vehicle's wheel from afar: an n-gon prism across z from z0 to z1 (outer face and tread), its inner face left out. */
export function lodWheel(m: MeshBuilder, mat: string, x: number, r: number, z0: number, z1: number, n = 6): void {
  const y = r * Math.cos(Math.PI / n);
  // a flat side, not a vertex, on the road
  const ring = lodNgon(n, r, x, y, Math.PI / n - Math.PI / 2);
  const outer = Math.abs(z1) > Math.abs(z0) ? z1 : z0, inner = outer === z1 ? z0 : z1;
  for (let i = 0; i < n; i++) {
    const [a, b] = [ring[i]!, ring[(i + 1) % n]!];
    lodPolygon(m, mat, [[a[0], a[1], inner], [b[0], b[1], inner], [b[0], b[1], outer], [a[0], a[1], outer]], [(a[0] + b[0]) / 2 - x, (a[1] + b[1]) / 2 - y, 0]);
  }
  lodPolygon(m, mat, ring.map(([px, py]): Vec3 => [px, py, outer]), [0, 0, Math.sign(outer)]);
}

/** A gabled roof over the rectangle x0..x1, z0..z1 from eave y0 to ridge y1, the ridge along `axis`: two slopes and two gables. */
export function lodGableRoof(m: MeshBuilder, mat: string, gable: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, axis: "x" | "z" = "x"): void {
  if (axis === "x") {
    const zm = (z0 + z1) / 2;
    lodPolygon(m, mat, [[x0, y0, z1], [x1, y0, z1], [x1, y1, zm], [x0, y1, zm]], [0, 1, 1]);
    lodPolygon(m, mat, [[x0, y0, z0], [x1, y0, z0], [x1, y1, zm], [x0, y1, zm]], [0, 1, -1]);
    lodPolygon(m, gable, [[x0, y0, z0], [x0, y0, z1], [x0, y1, zm]], [-1, 0, 0]);
    lodPolygon(m, gable, [[x1, y0, z0], [x1, y0, z1], [x1, y1, zm]], [1, 0, 0]);
  } else {
    const xm = (x0 + x1) / 2;
    lodPolygon(m, mat, [[x1, y0, z0], [x1, y0, z1], [xm, y1, z1], [xm, y1, z0]], [1, 1, 0]);
    lodPolygon(m, mat, [[x0, y0, z0], [x0, y0, z1], [xm, y1, z1], [xm, y1, z0]], [-1, 1, 0]);
    lodPolygon(m, gable, [[x0, y0, z0], [x1, y0, z0], [xm, y1, z0]], [0, 0, -1]);
    lodPolygon(m, gable, [[x0, y0, z1], [x1, y0, z1], [xm, y1, z1]], [0, 0, 1]);
  }
}

/** A hipped roof (or pyramid when the ridge shrinks to a point) over x0..x1, z0..z1: the eave rectangle to a ridge `inset` in from each end. */
export function lodHipRoof(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, inset: number): void {
  const zm = (z0 + z1) / 2, along = x1 - x0 >= z1 - z0;
  const [r0, r1]: Vec3[] = along
    ? [[x0 + inset, y1, zm], [x1 - inset, y1, zm]]
    : [[(x0 + x1) / 2, y1, z0 + inset], [(x0 + x1) / 2, y1, z1 - inset]];
  const c: Vec3[] = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]];
  const cx = (x0 + x1) / 2;
  const faces: Vec3[][] = along
    ? [[c[0]!, c[1]!, r1, r0], [c[1]!, c[2]!, r1], [c[2]!, c[3]!, r0, r1], [c[3]!, c[0]!, r0]]
    : [[c[0]!, c[1]!, r0], [c[1]!, c[2]!, r1, r0], [c[2]!, c[3]!, r1], [c[3]!, c[0]!, r0, r1]];
  for (const f of faces) {
    const mx = f.reduce((s, p) => s + p[0], 0) / f.length, mz = f.reduce((s, p) => s + p[2], 0) / f.length;
    const pts = f.filter((p, i) => f.findIndex((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]) === i);
    if (pts.length >= 3) lodPolygon(m, mat, pts, [mx - cx, 1, mz - zm]);
  }
}
