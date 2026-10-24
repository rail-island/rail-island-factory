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
import { RAIL_COLLECTOR_TOP } from "./collector.ts";

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
export const sameBands = (a: readonly LodBand[], b: readonly LodBand[]): boolean =>
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
  /** The collector's top when raised (the game's contact wire unless given). */
  raisedTop?: number;
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
  const headY = (p.raisedTop ?? RAIL_COLLECTOR_TOP) - 0.07;
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

/** One end of a shell drawn from its own tables, in model x (a shell whose two ends differ). */
export interface LodEnd {
  /** [y, x] of the end's centre line in model x, bottom first; the last height is the crown. */
  tip: Table;
  /** [y, setback] of the corners behind the tip (toward the body's middle); omitted for a flat end. */
  setback?: Table;
  /** The end's paint, bottom first, to the crown; default the shell's `end`. */
  paint?: readonly LodBand[];
}

/**
 * A body as a stack of plan rings: the half width hw(y), and each end's centre
 * line and its corners' setback behind it (a vee-shaped or rounded nose seen
 * from above becomes a vee). A symmetric body gives one end as `tip` (|x| from
 * `xc`) and `setback`; a body whose ends differ (a tram section's cab and joint
 * ends, a driving trailer) gives `front` and `rear`. The bottom is open.
 */
export interface LodShell {
  y0: number;
  /** [y, half width], bottom first. */
  hw: Table;
  /** A symmetric body: [y, |x|] of both ends' centre line from `xc`, bottom first; the last height is the crown. */
  tip?: Table;
  /** A symmetric body: [y, setback] of the corners behind the tip; omitted for a flat end. */
  setback?: Table;
  xc?: number;
  /** A body whose ends differ: each end from its own tables. */
  front?: LodEnd;
  rear?: LodEnd;
  /** Paint of the sides, bottom first, to the crown. */
  side: readonly LodBand[];
  /** Paint of the ends; default the sides'. */
  end?: readonly LodBand[];
  /** The cab sections of a symmetric body (|x - xc| beyond `x`) painted in their own bands on the sides. */
  cab?: { x: number; side: readonly LodBand[] };
  /** Side paint of its own over model x0..x1 (cab sections, a driving trailer's cab). */
  cabs?: ReadonlyArray<{ x0: number; x1: number; side: readonly LodBand[] }>;
  /** The crown's cap. */
  roof: string;
  /** Windows: on the sides (u = x) and on the ends (u = z seen from the front). */
  sideWindows?: readonly LodRect[];
  endWindows?: readonly LodRect[];
  /** Which ends are drawn: a hood abutting a cab, an end inside an articulated set hides one. Default both. */
  ends?: readonly number[];
  /** The section of an articulated LOD it belongs to (LodSpec.sections); default 0. */
  section?: number;
}

/** An end in its general form: model x, its paint resolved. */
interface GeneralEnd {
  tip: Table;
  setback?: Table;
  paint: readonly LodBand[];
}

/** A shell in its general form: both ends in model x with their paint, the cab paint as x ranges. */
type GeneralShell = Omit<LodShell, "tip" | "setback" | "xc" | "front" | "rear" | "end" | "cab" | "cabs"> & {
  front: GeneralEnd;
  rear: GeneralEnd;
  cabs: ReadonlyArray<{ x0: number; x1: number; side: readonly LodBand[] }>;
};

function general(sh: LodShell): GeneralShell {
  const { tip, setback, xc = 0, front, rear, end, cab, cabs, ...rest } = sh;
  const paint = end ?? sh.side;
  const own = (e: LodEnd | undefined, sign: number): GeneralEnd => {
    if (e) return { tip: e.tip, paint: e.paint ?? paint, ...(e.setback ? { setback: e.setback } : {}) };
    if (!tip) throw new Error("a LOD shell needs `tip` or both `front` and `rear`");
    return { tip: tip.map(([y, x]) => [y, xc + sign * x] as const), paint, ...(setback ? { setback } : {}) };
  };
  return {
    ...rest, front: own(front, 1), rear: own(rear, -1),
    cabs: [...(cabs ?? []), ...(cab ? [{ x0: -1e3, x1: xc - cab.x, side: cab.side }, { x0: xc + cab.x, x1: 1e3, side: cab.side }] : [])],
  };
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

/** Draws `sh`; `tol` simplifies its profile tables first, `flat` draws a vee nose as a flat end halfway back. */
export function lodShell(m: MeshBuilder, sh: LodShell, tol = 0, flat = false): void {
  drawShell(m, general(sh), tol, flat);
}

function drawShell(m: MeshBuilder, sh: GeneralShell, tol: number, flat: boolean): void {
  const prep = (end: GeneralEnd, e: number) => {
    const tip0: Table = flat && end.setback ? end.tip.map(([y, x]) => [y, x - (e * lerp(end.setback!, y)) / 2] as const) : end.tip;
    return { tip: simplifyTable(tip0, tol), sb: end.setback && !flat ? simplifyTable(end.setback, tol) : null, paint: end.paint };
  };
  const F = prep(sh.front, 1), R = prep(sh.rear, -1);
  const of = (e: number) => (e > 0 ? F : R);
  const hwT = simplifyTable(sh.hw, tol);
  const y0 = sh.y0, top = F.tip[F.tip.length - 1]![0];
  const hw = (y: number) => lerp(hwT, y);
  const tip = (e: number, y: number) => lerp(of(e).tip, y);
  const sb = (e: number, y: number) => (of(e).sb ? lerp(of(e).sb!, y) : 0);
  const corner = (e: number, y: number) => tip(e, y) - e * sb(e, y);
  const kinks = new Set([...F.tip, ...R.tip, ...hwT, ...(F.sb ?? []), ...(R.sb ?? [])].map(([y]) => y).filter((y) => y > y0 && y < top));
  const breaks = (bands: readonly LodBand[], wins: readonly LodRect[]) => [
    y0, top, ...kinks,
    ...bands.flatMap(([a, b]) => [a, b]),
    ...wins.flatMap((w) => [w.y[0], w.y[1]]),
  ];
  const sorted = (ys: number[]) => [...new Set(ys.filter((y) => y >= y0 && y <= top).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);

  // the sides: x cells between the two ends' corners
  const sideW = sh.sideWindows ?? [];
  for (const s of [-1, 1]) {
    const wins = sideW.filter((w) => !w.sides || w.sides.includes(s)).flatMap((w) => (w.mirror ? [w, { ...w, u: [-w.u[1], -w.u[0]] as const }] : [w]));
    const hs = sorted(breaks([...sh.side, ...sh.cabs.flatMap((c) => c.side)], wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const ym = (ya + yb) / 2;
      const base = lodBandAt(sh.side, ym);
      const regions: Array<[number, number, string]> = [];
      for (const c of sh.cabs) {
        const cm = lodBandAt(c.side, ym);
        if (cm !== base) regions.push([c.x0, c.x1, cm]);
      }
      // the layer heights are rounded to 1e-6 (sorted): a window edge between is the same height
      for (const w of wins) if (w.y[0] <= ya + 1e-6 && w.y[1] >= yb - 1e-6) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(base, regions);
    });
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        const pt = (u: number | null, y: number, end: number): Vec3 => [u === null ? corner(end, y) : Math.max(corner(-1, y), Math.min(corner(1, y), u)), y, s * hw(y)];
        lodPolygon(m, mat, [pt(u0, ya, -1), pt(u1, ya, 1), pt(u1, yb, 1), pt(u0, yb, -1)], [0, 0, s]);
      }
    }
  }

  // the ends: z cells across the face; a vee nose splits at the centre line
  for (const e of sh.ends ?? [-1, 1]) {
    // a windscreen within 0.2 m of the corners spans the whole face: one cell, not three
    const snap = (u: number, y: number) => (Math.abs(u) >= hw(y) - 0.2 ? Math.sign(u) * 1e3 : u);
    const wins = (sh.endWindows ?? []).filter((w) => !w.ends || w.ends.includes(e)).map((w) => {
      const u = e > 0 ? w.u : [-w.u[1], -w.u[0]];
      const y = (w.y[0] + w.y[1]) / 2;
      return { ...w, u: [snap(u[0]!, y), snap(u[1]!, y)] as readonly [number, number] };
    });
    const paint = of(e).paint;
    const hs = sorted(breaks(paint, wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const regions: Array<[number, number, string]> = [];
      for (const w of wins) if (w.y[0] <= ya + 1e-6 && w.y[1] >= yb - 1e-6) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(lodBandAt(paint, (ya + yb) / 2), regions);
    });
    const vee = of(e).sb !== null;
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        // the vee: split each cell at z = 0, where the plan kinks
        const spans: Array<[number | null, number | null]> = vee && (u0 === null || u0 < 0) && (u1 === null || u1 > 0) ? [[u0, 0], [0, u1]] : [[u0, u1]];
        for (const [a, b] of spans) {
          const pt = (u: number | null, y: number, side: number): Vec3 => {
            const z = u === null ? side * hw(y) : Math.max(-hw(y), Math.min(hw(y), u));
            // where the section closes to a ridge (hw = 0) the vee has met its corner
            const w = hw(y);
            return [tip(e, y) - e * (w > 1e-9 ? (sb(e, y) * Math.abs(z)) / w : sb(e, y)), y, z];
          };
          const q = [pt(a, ya, -1), pt(b, ya, 1), pt(b, yb, 1), pt(a, yb, -1)];
          lodPolygon(m, mat, [q[0]!, q[1]!, q[2]!], [e, 0, 0]);
          lodPolygon(m, mat, [q[0]!, q[2]!, q[3]!], [e, 0, 0]);
        }
      }
    }
  }

  // the crown: from the front's centre line (or its -z corner) round by +z, the rear and -z
  const cw = hw(top);
  if (cw <= 1e-6) return;
  const [ft, fc, rt, rc] = [tip(1, top), corner(1, top), tip(-1, top), corner(-1, top)];
  const ring: Vec3[] = [
    ...((F.sb ? [[ft, top, 0], [fc, top, cw]] : [[ft, top, -cw], [ft, top, cw]]) as Vec3[]),
    ...((R.sb ? [[rc, top, cw], [rt, top, 0], [rc, top, -cw]] : [[rt, top, cw], [rt, top, -cw]]) as Vec3[]),
    ...((F.sb ? [[fc, top, -cw]] : []) as Vec3[]),
  ];
  lodPolygon(m, sh.roof, ring, [0, 1, 0]);
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
  /** The profile may be simplified within 0.7 and 1.0 m too before bands are given up (a unit's cars). */
  coarse?: boolean;
}

/** Draws an articulated LOD's sections and joints, `draw(i)` drawing section i, and sets its rig. */
export function drawSections(m: MeshBuilder, sp: LodSections, draw: (i: number) => void): void {
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

/**
 * The profile's detail, step by step: how far the tables may be simplified, and
 * whether a vee nose is flattened. The last two steps only for a spec that
 * allows them (`coarse`): a unit's long, smooth car, not a locomotive's cab.
 */
const PROFILE: ReadonlyArray<readonly [tol: number, flat: boolean]> = [[0, false], [0.03, false], [0.08, false], [0.08, true], [0.15, true], [0.25, true], [0.4, true], [0.7, true], [1.0, true]];
const FINE_STEPS = 7;

/** An optional part or window ranked this or higher (a second window row) gives way after the profile's detail, before any colour band. */
export const LATE = 100;

const bandKey = (b: LodBand) => `${b[0]}|${b[1]}|${b[2]}`;

/**
 * Builds `spec` within `budget` triangles. Detail goes in a fixed order: the
 * optional parts and small windows (lowest `optional` first; those ranked LATE
 * or higher only after the profile), the profile's finer kinks, the least
 * visible colour band (`leastVisibleBand`), then the smallest window. Optional
 * parts that fit again afterwards come back. Deterministic.
 */
export function fitLod(spec: LodSpec, budget: number): MeshBuilder {
  let shells = spec.shells.map(general);
  // the optional parts and small windows, in the order they give way
  type Optional = { rank: number; part?: LodPart; win?: LodRect };
  const optional: Optional[] = [
    ...spec.parts.filter((p) => p.optional !== undefined).map((p) => ({ rank: p.optional!, part: p })),
    ...shells.flatMap((sh) => [...(sh.sideWindows ?? []), ...(sh.endWindows ?? [])]).filter((w) => w.optional !== undefined).map((w) => ({ rank: w.optional!, win: w })),
  ].sort((a, b) => a.rank - b.rank);
  let dropped = 0;
  // optional parts given up but brought back once the bands and profile have made room, best first
  const back = new Set<Optional>();
  let tol = 0;
  const lastStep = (spec.coarse ? PROFILE.length : FINE_STEPS) - 1;
  const build = (): MeshBuilder => {
    const m = new MeshBuilder({ ...LOD_PALETTE, ...spec.palette });
    const gone = new Set(optional.slice(0, dropped).filter((o) => !back.has(o)).flatMap((o) => [o.part, o.win]));
    const keep = (ws?: readonly LodRect[]) => ws?.filter((w) => !gone.has(w));
    const draw = (section: number | null) => {
      const mine = (x: { section?: number }) => section === null || (x.section ?? 0) === section;
      m.scope("body", () => { for (const sh of shells) if (mine(sh)) drawShell(m, { ...sh, sideWindows: keep(sh.sideWindows), endWindows: keep(sh.endWindows) }, ...PROFILE[tol]!); });
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
    if (dropped < optional.length && (optional[dropped]!.rank < LATE || tol === lastStep)) { dropped++; continue; }
    if (tol < lastStep) { tol++; continue; }
    const band = leastVisibleBand(shells);
    if (band) { shells = band(); continue; }
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

/**
 * The least visible colour band of any shell, as the shells with it given up:
 * a side band (counting 1.5 when the ends are painted with it too, and going
 * from them as well), an end band (counting half) or a cab band (counting half;
 * the cab then shows the sides' colours at its height). A band goes from the
 * shell and from every other section's shell that paints it, so the cars of a
 * set stay alike; the other shells of its own section keep theirs. A body's roof band -
 * its top band from about its eave to its crown - stays, and nothing is painted
 * over by it. Null when no band is left to give up.
 */
function leastVisibleBand(shells: readonly GeneralShell[]): (() => GeneralShell[]) | null {
  let best: { score: number; apply: () => GeneralShell[] } | null = null;
  const offer = (score: number, apply: () => GeneralShell[]) => { if (!best || score < best.score - 1e-9) best = { score, apply }; };
  const merge = (bands: readonly LodBand[], key: string): readonly LodBand[] => {
    const i = bands.findIndex((x) => bandKey(x) === key);
    return bands.length > 1 && i >= 0 ? mergeBand(bands, i) : bands;
  };
  const inEnds = (sh: GeneralShell, key: string) => [sh.front.paint, sh.rear.paint].some((p) => p.length > 1 && p.some((x) => bandKey(x) === key));
  for (const sh of shells) {
    // the band goes from this shell and from the other sections' (the cars of a set alike), not from the
    // other shells of its own section (a hood unit's cab and hoods keep their own)
    const alike = (x: GeneralShell) => x === sh || (x.section ?? 0) !== (sh.section ?? 0);
    const crown = sh.hw[sh.hw.length - 1]![0];
    const wmax = Math.max(...sh.hw.map(([, w]) => w));
    const eave = Math.max(...sh.hw.filter(([, w]) => w >= wmax - 0.02).map(([y]) => y));
    const roofBand = (bands: readonly LodBand[], i: number) => bands.length > 1 && i === bands.length - 1 && bands[i]![1] >= crown - 1e-6 && bands[i]![0] >= eave - 0.15;
    const intoRoof = (bands: readonly LodBand[], i: number) => {
      const t = (k: number) => (bands[k] ? bands[k]![1] - bands[k]![0] : -1);
      return roofBand(bands, t(i - 1) >= t(i + 1) ? i - 1 : i + 1);
    };
    const visible = (bands: readonly LodBand[], i: number) => bands.length > 1 && !roofBand(bands, i) && !intoRoof(bands, i);
    sh.side.forEach((b, i) => {
      if (!visible(sh.side, i)) return;
      const key = bandKey(b);
      const twin = inEnds(sh, key);
      offer((b[1] - b[0]) * (twin ? 1.5 : 1), () => shells.map((x) => !alike(x) ? x : ({
        ...x, side: merge(x.side, key),
        ...(twin ? { front: { ...x.front, paint: merge(x.front.paint, key) }, rear: { ...x.rear, paint: merge(x.rear.paint, key) } } : {}),
      })));
    });
    for (const p of [sh.front.paint, sh.rear.paint]) p.forEach((b, i) => {
      const key = bandKey(b);
      if (!visible(p, i) || sh.side.some((x) => bandKey(x) === key)) return;
      offer((b[1] - b[0]) * 0.5, () => shells.map((x) => !alike(x) ? x : ({ ...x, front: { ...x.front, paint: merge(x.front.paint, key) }, rear: { ...x.rear, paint: merge(x.rear.paint, key) } })));
    });
    for (const c of sh.cabs) for (const b of c.side) {
      const [a, z, mat] = b;
      if (lodBands(sh.side, a, z).every(([, , bm]) => bm === mat)) continue;
      const key = bandKey(b);
      offer((z - a) * 0.5, () => shells.map((x) => !alike(x) ? x : ({
        ...x,
        cabs: x.cabs.map((cc) => {
          const i = cc.side.findIndex((y) => bandKey(y) === key);
          if (i < 0) return cc;
          const side = lodBands([...cc.side.slice(0, i), ...lodBands(x.side, a, z), ...cc.side.slice(i + 1)], cc.side[0]![0], cc.side[cc.side.length - 1]![1]);
          return { ...cc, side };
        }).filter((cc) => !sameBands(cc.side, lodBands(x.side, cc.side[0]![0], cc.side[cc.side.length - 1]![1]))),
      })));
    }
  }
  return best ? (best as { apply: () => GeneralShell[] }).apply : null;
}

/**
 * `fitLod` for a model made of parts only (a building): the optional parts give
 * way lowest rank first, and come back afterwards where they fit. Kept apart from
 * fitLod so a model without shells does not bundle the shell painter.
 */
export function fitParts(palette: Record<string, MaterialSpec>, parts: readonly LodPart[], budget: number): MeshBuilder {
  const optional = parts.filter((p) => p.optional !== undefined).sort((a, b) => a.optional! - b.optional!);
  const gone = new Set<LodPart>();
  const build = (): MeshBuilder => {
    const m = new MeshBuilder(palette);
    m.scope("parts", () => { for (const p of parts) if (!gone.has(p)) p.draw(m); });
    return m;
  };
  let m = build();
  for (const o of optional) {
    if (m.triangleCount() <= budget) break;
    gone.add(o);
    m = build();
  }
  if (m.triangleCount() > budget) throw new Error(`the LOD does not fit ${budget} triangles`);
  for (const o of [...optional].reverse()) {
    if (!gone.has(o)) continue;
    gone.delete(o);
    const more = build();
    if (more.triangleCount() <= budget) m = more;
    else gone.add(o);
  }
  return m;
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

/**
 * A road vehicle's wheel from afar: an n-gon standing on a flat side at y = 0,
 * its outer face at whichever of z0 and z1 lies further out. `tread` says which
 * of its tread faces are drawn: all of them, the lower slanted ones only (the
 * tyre's bulge seen from the side; the one on the road and those under the
 * body are not), or none (a flat disc).
 */
export function lodWheel(m: MeshBuilder, mat: string, x: number, r: number, z0: number, z1: number, n = 6, tread: "all" | "lower" | "none" = "all"): void {
  const y = r * Math.cos(Math.PI / n);
  // a flat side, not a vertex, on the road
  const ring = lodNgon(n, r, x, y, Math.PI / n - Math.PI / 2).map(([px, py]): [number, number] => [px, Math.abs(py) < 1e-9 ? 0 : py]);
  const outer = Math.abs(z1) > Math.abs(z0) ? z1 : z0, inner = outer === z1 ? z0 : z1;
  if (tread !== "none") for (let i = 0; i < n; i++) {
    const [a, b] = [ring[i]!, ring[(i + 1) % n]!];
    const ny = (a[1] + b[1]) / 2 - y;
    if (tread === "lower" && !(ny < -1e-6 && ny > -r * Math.cos(Math.PI / n) + 1e-6)) continue;
    lodPolygon(m, mat, [[a[0], a[1], inner], [b[0], b[1], inner], [b[0], b[1], outer], [a[0], a[1], outer]], [(a[0] + b[0]) / 2 - x, ny, 0]);
  }
  lodPolygon(m, mat, ring.map(([px, py]): Vec3 => [px, py, outer]), [0, 0, Math.sign(outer)]);
}

/**
 * A box x0..x1, y0..y1, z0..z1: its long sides (the z faces), its ends (the x
 * faces), its top and its bottom, each in its own material; a face whose
 * material is null is left out. The ends and top default to the sides'
 * material, the bottom to none (it stands on something).
 */
export function lodBlock(
  m: MeshBuilder,
  x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  mats: { side?: string | null; end?: string | null; top?: string | null; bottom?: string | null },
): void {
  const { side = null, end = side, top = side, bottom = null } = mats;
  if (side) for (const [z, s] of [[z0, -1], [z1, 1]] as const) lodPolygon(m, side, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, s]);
  if (end) for (const [x, s] of [[x0, -1], [x1, 1]] as const) lodPolygon(m, end, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [s, 0, 0]);
  if (top) lodPolygon(m, top, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
  if (bottom) lodPolygon(m, bottom, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
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
