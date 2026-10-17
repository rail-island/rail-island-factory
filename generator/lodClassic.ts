// Dedicated low levels of detail for the classic rolling stock of vehicles.ts
// (docs/models/lod.md): one adapter for every coach built on the CSD coach kit
// (csdCoachParts.ts: the CSD coaches, the Bmo and the CD green and white
// coaches), one for the freight wagons (wagons.ts), and the generic solids they
// and the American truck's LOD share. Built on the shared kit, lodKit.ts.
//
// The coach adapter reads each coach from its own builder: it runs it once with
// the kit's drawing calls (Coach.volume, window, door, bogie, axle) recorded
// instead of drawn, so the LOD follows the very sections, plans, elevations,
// paint bands, window boxes and running gear the full model is built from, in
// every livery and variant, with no second copy of the data.
//
// Metres, +X forward, +Y up, +Z right, as the full models.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ParamValues } from "./design.ts";
import { Coach, sectionHalf, type Box, type Volume } from "./csdCoachParts.ts";
import {
  fitLod,
  lerp,
  LOD_GLASS,
  lodBandAt,
  lodBands,
  lodBogie,
  lodPolygon,
  lodPrism,
  lodSideBox,
  windowBands,
  type LodBand,
  type LodPart,
  type LodRect,
  type LodShell,
  type Table,
} from "./lodKit.ts";
import { csdBalm, csdBam, csdBdmtee, csdBe31, csdBi20, csdClassicGreenCoach, csdDsk } from "./csdCoaches.ts";
import { bmoCoach } from "./bmoCoach.ts";
import { cdGreenWhiteCoach } from "./cdGreenWhiteCoach.ts";

// --- generic solids ------------------------------------------------------------------------

/** A convex section in its own plane: (z, y) for a sweep along x, (x, y) for one along z. */
export type Section = ReadonlyArray<readonly [number, number]>;

/** `sec` with a vertex added wherever an edge crosses one of the heights `ys`, so each wall lies in one band. */
function cutSection(sec: Section, ys: readonly number[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < sec.length; i++) {
    const [a, b] = [sec[i]!, sec[(i + 1) % sec.length]!];
    out.push([a[0], a[1]]);
    const hs = ys.filter((y) => (y - a[1]) * (y - b[1]) < -1e-12).sort((p, q) => (b[1] > a[1] ? p - q : q - p));
    for (const y of hs) out.push([a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), y]);
  }
  return out;
}

/**
 * A convex section swept along `axis` from a0 to a1: a wall on every edge
 * (painted by `wall` from the edge's mid height, or left out where it returns
 * null; a `floorless` one without its flat underside) and the two end caps
 * (`caps`: their materials, null for none).
 */
export function lodSweep(
  m: MeshBuilder,
  axis: "x" | "z",
  sec: Section,
  a0: number,
  a1: number,
  wall: string | readonly LodBand[] | ((u: number, y: number) => string | null),
  caps: readonly [string | null, string | null] | string | null = null,
  floorless = false,
): void {
  const bands = typeof wall === "object" ? wall : null;
  const ring = bands !== null ? cutSection(sec, bands.map((b) => b[0])) : sec.map(([u, v]) => [u, v] as [number, number]);
  const P = (u: number, y: number, a: number): Vec3 => (axis === "x" ? [a, y, u] : [u, y, a]);
  const cu = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  for (let i = 0; i < ring.length; i++) {
    const [p, q] = [ring[i]!, ring[(i + 1) % ring.length]!];
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue;
    // a floorless solid stands on something: its flat underside is never seen
    if (floorless && Math.abs(q[1] - p[1]) < 1e-9 && p[1] <= Math.min(...ring.map((r) => r[1])) + 1e-9) continue;
    const [um, ym] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const mat = typeof wall === "string" ? wall : typeof wall === "function" ? wall(um, ym) : lodBandAt(wall, ym);
    if (mat === null) continue;
    const n = P(um - cu, ym - cy, 0);
    lodPolygon(m, mat, [P(p[0], p[1], a0), P(q[0], q[1], a0), P(q[0], q[1], a1), P(p[0], p[1], a1)], n);
  }
  const [c0, c1] = typeof caps === "string" || caps === null ? [caps, caps] : caps;
  for (const [a, mat, d] of [[Math.min(a0, a1), c0, -1], [Math.max(a0, a1), c1, 1]] as const)
    if (mat) lodPolygon(m, mat, sec.map(([u, v]) => P(u, v, a)), P(0, 0, d));
}

/** A box x0..x1, y0..y1, z0..z1 without its bottom: its long sides (z), its ends (x) and its top, each in its own material (null: left out). */
export function lodBlock(
  m: MeshBuilder,
  x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  mats: { side?: string | null; end?: string | null; top?: string | null },
): void {
  const { side = null, end = side, top = side } = mats;
  if (side) for (const [z, s] of [[z0, -1], [z1, 1]] as const) lodPolygon(m, side, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, s]);
  if (end) for (const [x, s] of [[x0, -1], [x1, 1]] as const) lodPolygon(m, end, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [s, 0, 0]);
  if (top) lodPolygon(m, top, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
}

/**
 * An open-topped box (an open wagon's body): its outer walls from y0 to y1 in
 * `outer`, the inner walls from the floor up and the floor in `inner`, the
 * walls `t` thick; the rim between them left out (2 cm from afar).
 */
export function lodTub(m: MeshBuilder, x0: number, x1: number, y0: number, y1: number, hz: number, t: number, floor: number, outer: string, inner: string): void {
  lodBlock(m, x0, x1, y0, y1, -hz, hz, { side: outer, top: null });
  const [a, b, w] = [x0 + t, x1 - t, hz - t];
  for (const [z, s] of [[-w, 1], [w, -1]] as const) lodPolygon(m, inner, [[a, floor, z], [b, floor, z], [b, y1, z], [a, y1, z]], [0, 0, s]);
  for (const [x, s] of [[a, 1], [b, -1]] as const) lodPolygon(m, inner, [[x, floor, -w], [x, floor, w], [x, y1, w], [x, y1, -w]], [s, 0, 0]);
  lodPolygon(m, inner, [[a, floor, -w], [b, floor, -w], [b, floor, w], [a, floor, w]], [0, 1, 0]);
}

/** A heap (a bulk load from afar): a hipped mound over x0..x1 and -hz..hz from y0 to its ridge at y1, the ridge `inset` in from each end. */
export function lodHeap(m: MeshBuilder, mat: string, x0: number, x1: number, hz: number, y0: number, y1: number, inset: number, ridge = 0): void {
  const r0: Vec3 = [x0 + inset, y1, -ridge], r1: Vec3 = [x1 - inset, y1, -ridge];
  const q0: Vec3 = [x0 + inset, y1, ridge], q1: Vec3 = [x1 - inset, y1, ridge];
  lodPolygon(m, mat, [[x0, y0, hz], [x1, y0, hz], q1, q0], [0, 1, 1]);
  lodPolygon(m, mat, [[x0, y0, -hz], [x1, y0, -hz], r1, r0], [0, 1, -1]);
  lodPolygon(m, mat, ridge > 0 ? [[x0, y0, -hz], [x0, y0, hz], q0, r0] : [[x0, y0, -hz], [x0, y0, hz], r0], [-1, 1, 0]);
  lodPolygon(m, mat, ridge > 0 ? [[x1, y0, -hz], [x1, y0, hz], q1, r1] : [[x1, y0, -hz], [x1, y0, hz], r1], [1, 1, 0]);
  if (ridge > 0) lodPolygon(m, mat, [r0, r1, q1, q0], [0, 1, 0]);
}

/** Flat rectangles (x0, x1, y0, y1) on both sides at |z| = z, facing out: stanchions, doors, windows. */
export function lodPanels(m: MeshBuilder, mat: string, rects: ReadonlyArray<readonly [number, number, number, number]>, z: number): void {
  for (const [x0, x1, y0, y1] of rects)
    for (const s of [-1, 1]) lodPolygon(m, mat, [[x0, y0, s * z], [x1, y0, s * z], [x1, y1, s * z], [x0, y1, s * z]], [0, 0, s]);
}

/**
 * A road wheel from afar: a hexagon standing on its flat side, its outer face
 * and the two lower slanted faces of its tread (the flat bottom on the road,
 * the upper tread under the body and fenders and the inner face are not seen).
 */
export function lodRoadWheel(m: MeshBuilder, mat: string, x: number, r: number, z0: number, z1: number): void {
  const yc = r * Math.sin(Math.PI / 3);
  const ring = Array.from({ length: 6 }, (_, i): [number, number] => [x + r * Math.cos((i * Math.PI) / 3), yc + r * Math.sin((i * Math.PI) / 3)]);
  const outer = Math.abs(z1) > Math.abs(z0) ? z1 : z0, inner = outer === z1 ? z0 : z1;
  for (const i of [3, 5]) {
    const [a, b] = [ring[i]!, ring[(i + 1) % 6]!];
    lodPolygon(m, mat, [[a[0], a[1], inner], [b[0], b[1], inner], [b[0], b[1], outer], [a[0], a[1], outer]], [(a[0] + b[0]) / 2 - x, (a[1] + b[1]) / 2 - yc, 0]);
  }
  lodPolygon(m, mat, ring.map(([px, py]): Vec3 => [px, py, outer]), [0, 0, Math.sign(outer)]);
}

// --- the freight wagons (wagons.ts) ----------------------------------------------------------

/** A solid of a wagon's LOD, in the wagon's source x (Factory x + centre); optional ones give way first, lowest first. */
export type WagonLodItem = { optional?: number; name: string } & (
  /** A box without its bottom: z either a half width or a range; each face group in its own material (null: left out). */
  | { kind: "block"; x: readonly [number, number]; y: readonly [number, number]; z: number | readonly [number, number]; side?: string | null; end?: string | null; top?: string | null }
  /** An open-topped body: outer walls, inner walls and floor (lodTub). */
  | { kind: "tub"; x: readonly [number, number]; y: readonly [number, number]; hz: number; t: number; floor: number; outer: string; inner: string }
  /** A bulk load's mound (lodHeap). */
  | { kind: "heap"; x: readonly [number, number]; y: readonly [number, number]; hz: number; inset: number; ridge?: number; mat: string }
  /** A side profile (x, y; rear-bottom, front-bottom, front-top, rear-top) across -hz..hz: a fishbelly, a sill (lodSideBox). */
  | { kind: "profile"; sec: ReadonlyArray<readonly [number, number]>; hz: number; mat: string }
  /** A section swept along x (z, y) or along z (x, y) (lodSweep); its walls facing down left out. */
  | { kind: "sweep"; axis: "x" | "z"; sec: Section; a: readonly [number, number]; wall: string | readonly LodBand[]; caps?: string | null }
  /** Flat rectangles (x0, x1, y0, y1) on both long sides at |z| = z, facing out: stanchions, doors, boards. */
  | { kind: "panels"; rects: ReadonlyArray<readonly [number, number, number, number]>; z: number; mat: string }
  /** A vertical solid of rings (r, y) about (x, 0), n-sided: a hopper; a last ring of radius 0 ends in a point. */
  | { kind: "turned"; x: number; rings: ReadonlyArray<readonly [number, number]>; n: number; rot?: number; mat: string }
);

/** A freight wagon's LOD: its palette, the source x of its centre, its bogies (centre, wheelbase) and its solids. */
export interface WagonLodSpec {
  palette: Record<string, MaterialSpec>;
  centre: number;
  bogies: ReadonlyArray<readonly [xc: number, wb: number]>;
  items: readonly WagonLodItem[];
}

/** The freight bogies' side frames reach 0.42 m past the axles and stand 0.75 m tall (wagonParts.ts). */
const FREIGHT_BOGIE_REACH = 0.42, FREIGHT_BOGIE_TOP = 0.75;

/** Draws one wagon solid, its source x moved by -centre. */
function wagonItem(m: MeshBuilder, it: WagonLodItem, centre: number): void {
  const X = (x: number) => x - centre;
  switch (it.kind) {
    case "block": {
      const [z0, z1] = typeof it.z === "number" ? [-it.z, it.z] : it.z;
      lodBlock(m, X(it.x[0]), X(it.x[1]), it.y[0], it.y[1], z0, z1, { side: it.side, end: it.end, top: it.top });
      return;
    }
    case "tub": return lodTub(m, X(it.x[0]), X(it.x[1]), it.y[0], it.y[1], it.hz, it.t, it.floor, it.outer, it.inner);
    case "heap": return lodHeap(m, it.mat, X(it.x[0]), X(it.x[1]), it.hz, it.y[0], it.y[1], it.inset, it.ridge);
    case "profile": return lodSideBox(m, it.mat, it.sec.map(([x, y]) => [X(x), y] as const), -it.hz, it.hz);
    case "sweep": {
      const sec = it.axis === "z" ? it.sec.map(([x, y]) => [X(x), y] as const) : it.sec;
      const [a0, a1] = it.axis === "x" ? [X(it.a[0]), X(it.a[1])] : it.a;
      return lodSweep(m, it.axis, sec, a0, a1, it.wall, it.caps ?? null, true);
    }
    case "panels": return lodPanels(m, it.mat, it.rects.map(([x0, x1, y0, y1]) => [X(x0), X(x1), y0, y1] as const), it.z);
    case "turned": {
      const ring = (r: number, y: number): Vec3[] => Array.from({ length: it.n }, (_, i) => {
        const t = (it.rot ?? 0) + (2 * Math.PI * i) / it.n;
        return [X(it.x) + r * Math.cos(t), y, r * Math.sin(t)];
      });
      for (let k = 1; k < it.rings.length; k++) {
        const [[ra, ya], [rb, yb]] = [it.rings[k - 1]!, it.rings[k]!];
        const [lo, hi] = [ring(ra, ya), ring(rb, yb)];
        for (let i = 0; i < it.n; i++) {
          const j = (i + 1) % it.n;
          const t = (it.rot ?? 0) + (2 * Math.PI * (i + 0.5)) / it.n;
          const n: Vec3 = [Math.cos(t), (ra - rb) / Math.max(1e-6, yb - ya), Math.sin(t)];
          lodPolygon(m, it.mat, rb > 1e-6 ? [lo[i]!, lo[j]!, hi[j]!, hi[i]!] : [lo[i]!, lo[j]!, hi[0]!], n);
        }
      }
      const [rt, yt] = it.rings[it.rings.length - 1]!;
      if (rt > 1e-6) lodPolygon(m, it.mat, ring(rt, yt), [0, 1, 0]);
      return;
    }
  }
}

/**
 * A freight wagon for distant views: its solids (an open body with its inside,
 * a deck, a fishbelly, a tank, hoppers, a load in its own colours) and a dark
 * block per bogie reaching the rail. Within `budget` triangles; the optional
 * solids give way first.
 */
export function wagonLod(spec: WagonLodSpec, budget = 100): MeshBuilder {
  const parts: LodPart[] = [
    { draw: (m) => m.scope("running gear", () => {
      for (const [xc, wb] of spec.bogies) lodBogie(m, xc - spec.centre, wb / 2 + FREIGHT_BOGIE_REACH, FREIGHT_BOGIE_TOP, 1.1);
    }) },
    ...spec.items.map((it): LodPart => ({ ...(it.optional !== undefined ? { optional: it.optional } : {}), draw: (m) => m.scope(it.name, () => wagonItem(m, it, spec.centre)) })),
  ];
  return fitLod({ palette: spec.palette, shells: [], parts }, budget);
}

// --- the coach kit (csdCoachParts.ts) -----------------------------------------------------------

/** What a coach's builder asked of the kit: its bodies, windows, doors and running gear, in source x. */
interface CoachCalls {
  centre: number;
  palette: Record<string, MaterialSpec>;
  volumes: Volume[];
  windows: Array<{ v: Volume; s: number; b: Box; end: boolean }>;
  doors: Array<{ v: Volume; s: number; b: Box; paint: string; end: boolean }>;
  bogies: Array<{ xc: number; wb: number; r: number; top: number }>;
  axles: Array<{ xa: number; r: number; sole: number }>;
}

/**
 * Runs a coach builder with the kit's drawing calls recorded instead of drawn
 * (the rest of its geometry goes to a builder that is thrown away). Synchronous,
 * and the kit is restored before this returns.
 */
function recordCoach(build: () => MeshBuilder): CoachCalls {
  const rec: CoachCalls = { centre: NaN, palette: {}, volumes: [], windows: [], doors: [], bogies: [], axles: [] };
  const proto = Coach.prototype;
  const saved = { volume: proto.volume, window: proto.window, door: proto.door, bogie: proto.bogie, axle: proto.axle };
  const seen = (c: Coach) => {
    if (!Number.isNaN(rec.centre) && rec.centre !== c.centre) throw new Error("a coach LOD records one coach");
    rec.centre = c.centre;
    rec.palette = c.m["palette"];
  };
  proto.volume = function (this: Coach, v) { seen(this); rec.volumes.push(v); };
  proto.window = function (this: Coach, v, s, b, opts = {}) { seen(this); rec.windows.push({ v, s, b, end: !!opts.end }); };
  proto.door = function (this: Coach, v, s, b, paint, opts = {}) { seen(this); rec.doors.push({ v, s, b, paint, end: !!opts.end }); };
  proto.bogie = function (this: Coach, xc, wb, r, top) { seen(this); rec.bogies.push({ xc, wb, r, top }); };
  proto.axle = function (this: Coach, xa, r, sole) { seen(this); rec.axles.push({ xa, r, sole }); };
  try {
    build();
  } finally {
    Object.assign(proto, saved);
  }
  if (Number.isNaN(rec.centre)) throw new Error("the builder drew no coach");
  return rec;
}

/** The x extent of a volume at height y: where its elevation's top is at or above y and its bottom at or below. */
function extentAt(v: Volume, y: number): [number, number] | null {
  const [p0, p1] = [v.plan[0]![0], v.plan[v.plan.length - 1]![0]];
  const xs = new Set([p0, p1]);
  for (const el of [v.top, v.bottom])
    for (let i = 1; el && i < el.length; i++) {
      const [a, b] = [el[i - 1]!, el[i]!];
      xs.add(a[0]);
      if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.add(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
  const inside = [...xs].filter((x) => x >= p0 - 1e-9 && x <= p1 + 1e-9 && (!v.top || lerp(v.top, x) >= y - 1e-6) && (!v.bottom || lerp(v.bottom, x) <= y + 1e-6));
  return inside.length ? [Math.min(...inside), Math.max(...inside)] : null;
}

/** How far the corners of a plan narrowing toward the end at `x` (dir: -1 the low end) stand behind it, as a vee of the same area. */
function setbackAt(v: Volume, x: number, dir: number): number {
  const full = Math.max(...v.plan.map((p) => p[1]));
  const xs = [...new Set([x, ...v.plan.map((p) => p[0])])].filter((u) => dir * (x - u) >= -1e-9).sort((a, b) => dir * (b - a));
  let area = 0;
  for (let i = 1; i < xs.length; i++) {
    const [a, b] = [xs[i - 1]!, xs[i]!];
    const [da, db] = [full - lerp(v.plan, a), full - lerp(v.plan, b)];
    area += (Math.abs(a - b) * (da + db)) / 2;
    if (db < 1e-9) break;
  }
  return (2 * area) / full;
}

interface CoachShell { shell: LodShell; v: Volume; x: [number, number]; y: [number, number]; hw: number }

/** The heights of a volume's section and elevation vertices strictly between y0 and y1, with y0 and y1. */
function heights(v: Volume, y0: number, y1: number): number[] {
  const ys = [y0, y1, ...v.section.map((p) => p[1]), ...(v.top ?? []).map((p) => p[1]), ...(v.bottom ?? []).map((p) => p[1])];
  return [...new Set(ys.filter((y) => y >= y0 - 1e-9 && y <= y1 + 1e-9).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);
}

/**
 * A volume between heights y0 and y1 as a LOD shell: the plan rings' half
 * length from the elevation (an end rolling over into the roof, a well
 * between the bogies), the half width from the section, a vee nose where the
 * plan narrows toward the ends, painted in the volume's bands and its end paint.
 */
function volumeShell(c: CoachCalls, v: Volume, y0: number, y1: number, endPaint: boolean): CoachShell {
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  const full = Math.max(...v.plan.map((p) => p[1]));
  const ys = heights(v, y0, y1);
  const ext = ys.map((y) => extentAt(v, y)!);
  const [xa, xb] = ext[0]!;
  const xc = (xa + xb) / 2;
  const tip: Table = ys.map((y, i) => [y, (ext[i]![1] - ext[i]![0]) / 2]);
  const hw: Table = ys.map((y) => [y, (sectionHalf(v.section, Math.min(y, Math.max(...v.section.map((p) => p[1])) - 1e-6)) * full) / hw0]);
  const sb: Table = ys.map((y, i) => [y, Math.min((setbackAt(v, ext[i]![0], -1) + setbackAt(v, ext[i]![1], 1)) / 2, tip[i]![1] * 0.5)]);
  const side = lodBands(v.bands, y0, y1);
  // the end walls' paint covers the end caps, up to the elevation's top at the ends
  const capTop = Math.min(y1, v.top ? lerp(v.top, v.plan[v.plan.length - 1]![0]) : y1);
  const end: LodBand[] = !endPaint || !v.endPaint ? side
    : capTop >= y1 - 1e-6 ? [[y0, y1, v.endPaint]] : lodBands([[y0, capTop, v.endPaint], ...lodBands(v.bands, capTop, y1)], y0, y1);
  const shell: LodShell = {
    y0, tip, hw, xc: xc - c.centre,
    ...(sb.some(([, b]) => b > 0.12) ? { setback: sb } : {}),
    side, end, roof: lodBandAt(side, y1),
  };
  return { shell, v, x: [xa - c.centre, xb - c.centre], y: [y0, y1], hw: full };
}

/**
 * A coach for distant views: every body volume as a shell (a volume with a
 * well between its bogies as two: the full-length upper body and the well),
 * thin platforms and floors as optional slabs, each side's windows (door
 * windows included) joined into continuous bands (all but the longest
 * optional, the smallest first), the end windows (optional), door leaves painted apart from the body (optional),
 * a block per bogie or axle, an underframe block between them (optional) and,
 * where the body stands above its running gear, a solebar strip to close the gap.
 */
export function coachLod(build: () => MeshBuilder, budget = 100): MeshBuilder {
  const c = recordCoach(build);
  const X = (x: number) => x - c.centre;
  const yRange = (v: Volume): [number, number] => {
    const sy = v.section.map((p) => p[1]);
    // the crown: the highest section vertex still 0.35 m off the centre line, under the elevation's top
    const crown = Math.max(...v.section.filter((p) => Math.abs(p[0]) >= 0.35).map((p) => p[1]));
    const bottom = v.bottom ? Math.min(...v.bottom.map((p) => p[1])) : -Infinity;
    const top = v.top ? Math.max(...v.top.map((p) => p[1])) : Infinity;
    return [Math.max(Math.min(...sy), bottom), Math.min(crown, top)];
  };
  const xRange = (v: Volume): [number, number] => [v.plan[0]![0], v.plan[v.plan.length - 1]![0]];
  const halfOf = (v: Volume) => Math.max(...v.plan.map((p) => p[1]));
  // a thin flat slab: a rectangular section under 0.5 m (a platform, a van's floor; not a roof)
  const thin = (v: Volume) => { const [a, b] = yRange(v); return b - a < 0.5 && v.section.length === 4; };
  // a volume inside another (a lookout bay 2.5 cm proud) is not seen from afar
  const inside = (v: Volume) => c.volumes.some((o) => o !== v && !thin(o) && xRange(o)[0] <= xRange(v)[0] + 1e-6 && xRange(o)[1] >= xRange(v)[1] - 1e-6
    && yRange(o)[0] <= yRange(v)[0] + 1e-6 && yRange(o)[1] >= yRange(v)[1] - 1e-6 && halfOf(v) <= halfOf(o) + 0.05);
  const bodies = c.volumes.filter((v) => !thin(v) && !inside(v));

  const shells: CoachShell[] = [];
  for (const v of bodies) {
    const [y0, y1] = yRange(v);
    const bottoms = (v.bottom ?? []).map((p) => p[1]);
    const deck = bottoms.length ? Math.max(...bottoms) : y0;
    // a well between the bogies: the body above the ends' floor, the well below it
    if (deck > y0 + 1e-6) shells.push(volumeShell(c, v, y0, deck, false));
    shells.push(volumeShell(c, v, Math.max(y0, deck), y1, true));
  }
  // an end hidden inside a neighbouring body (a vestibule's inner end) is left out
  for (const a of shells) {
    const ends = [-1, 1].filter((e) => {
      const xe = a.x[e > 0 ? 1 : 0] + e * 0.05;
      return !shells.some((b) => b !== a && b.hw >= a.hw - 1e-6 && b.y[0] <= a.y[0] + 1e-6 && b.y[1] >= a.y[1] - 1e-6 && xe > b.x[0] && xe < b.x[1]);
    });
    if (ends.length < 2) a.shell.ends = ends;
  }

  // windows: each side's run of windows as bands; the ends' windows optional
  for (const a of shells) {
    const mine = (w: { v: Volume; b: Box; end: boolean }) => w.v === a.v && (w.end || ((w.b.y0 + w.b.y1) / 2 > a.y[0] && (w.b.y0 + w.b.y1) / 2 < a.y[1]));
    const wins = c.windows.filter((w) => mine(w) && !w.end);
    const doors = c.doors.filter((d) => mine(d) && !d.end && d.paint !== "bands");
    const sideRects = (s: number): LodRect[] => [
      // a door leaf in its own paint where it differs from the body's (glass over it)
      ...doors.filter((d) => d.s === s).flatMap((d): LodRect[] => {
        const y: [number, number] = [Math.max(d.b.y0, a.y[0]), Math.min(d.b.y1, a.y[1])];
        if (lodBands(a.shell.side, y[0], y[1]).every((b) => b[2] === d.paint)) return [];
        return [{ u: [X(d.b.x0), X(d.b.x1)], y, mat: d.paint, sides: [s], optional: 6 + (d.b.x1 - d.b.x0) / 10 }];
      }),
      // the longest band stays; shorter runs (door windows, another deck) give way first, the smallest first
      ...((bands: LodRect[]) => {
        const main = bands.reduce<LodRect | null>((a, w) => (!a || w.u[1] - w.u[0] > a.u[1] - a.u[0] + 1e-9 ? w : a), null);
        return bands.map((w): LodRect => ({ ...w, sides: [s], ...(w === main ? {} : { optional: 10 + (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) }) }));
      })(windowBands(wins.filter((w) => w.s === s).map((w) => ({ u: [X(w.b.x0), X(w.b.x1)] as const, y: [Math.max(w.b.y0, a.y[0]), Math.min(w.b.y1, a.y[1])] as const })), 1.3)),
    ];
    // a window edge within 0.15 m of a kink of the profile moves onto it (one layer of faces fewer), unless a paint edge lies between
    const paint = a.shell.side.flatMap((b) => [b[0], b[1]]);
    const kinks = a.shell.hw.map((p) => p[0]).filter((k) => k > a.y[0] + 1e-6 && k < a.y[1] - 1e-6);
    const snap = (y: number) => {
      const near = kinks.filter((k) => Math.abs(k - y) <= 0.15 && !paint.some((e) => e > Math.min(k, y) + 1e-6 && e <= Math.max(k, y) + 1e-6 && Math.abs(e - y) > 1e-6))
        .sort((p, q) => Math.abs(p - y) - Math.abs(q - y) || p - q);
      return near.length ? near[0]! : y;
    };
    const snapped = (w: LodRect): LodRect => (w.mat === LOD_GLASS ? { ...w, y: [snap(w.y[0]), snap(w.y[1])] } : w);
    const [r, l] = [sideRects(1).map(snapped), sideRects(-1).map(snapped)];
    const same = r.length === l.length && r.every((w, i) => w.u[0] === l[i]!.u[0] && w.u[1] === l[i]!.u[1] && w.y[0] === l[i]!.y[0] && w.y[1] === l[i]!.y[1] && w.mat === l[i]!.mat && w.optional === l[i]!.optional);
    a.shell.sideWindows = same ? r.map(({ sides: _, ...w }) => w) : [...r, ...l];
    a.shell.endWindows = [-1, 1].filter((e) => !a.shell.ends || a.shell.ends.includes(e)).flatMap((e) =>
      windowBands(c.windows.filter((w) => w.v === a.v && w.end && w.s === e).map((w) => ({ u: (e > 0 ? [w.b.x0, w.b.x1] : [-w.b.x1, -w.b.x0]) as readonly [number, number], y: [w.b.y0, w.b.y1] as const })), 0.4)
        .map((w) => ({ ...w, ends: [e], optional: 10 + (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) })));
  }

  // running gear: bogies and axles as dark blocks to the rail
  const gear = [
    ...c.bogies.map((b) => ({ x: X(b.xc), half: b.wb / 2 + b.r + 0.2, top: b.top })),
    ...c.axles.map((a) => ({ x: X(a.xa), half: a.r + 0.3, top: a.sole })),
  ].sort((p, q) => p.x - q.x);
  const floor = Math.min(...shells.map((s) => s.y[0]));
  const gearTop = Math.max(...gear.map((g) => g.top));
  const lowest = shells.filter((s) => s.y[0] <= floor + 1e-6);
  const [bx0, bx1] = [Math.min(...lowest.map((s) => s.x[0])), Math.max(...lowest.map((s) => s.x[1]))];
  const parts: LodPart[] = [
    { draw: (m) => m.scope("running gear", () => { for (const g of gear) lodBogie(m, g.x, g.half, g.top, 1.08); }) },
  ];
  if (floor > gearTop + 0.04)
    parts.push({ draw: (m) => m.scope("solebar", () => lodBlock(m, bx0 + 0.1, bx1 - 0.1, gearTop - 0.06, floor, -1.2, 1.2, { side: "underframe", top: null })) });
  const inner = [gear[0]!.x + gear[0]!.half, gear[gear.length - 1]!.x - gear[gear.length - 1]!.half];
  const well = shells.some((s) => s.y[0] < gearTop - 0.1);
  if (gear.length >= 2 && inner[1]! - inner[0]! > 2 && !well)
    parts.push({ optional: 5, draw: (m) => m.scope("underframe", () => lodBlock(m, inner[0]! + 0.2, inner[1]! - 0.2, 0.45, Math.min(floor, gearTop) - 0.02, -1.1, 1.1, { side: "underframe", top: null })) });
  // thin volumes (a vestibule's platform, a van's floor) as slabs
  for (const v of c.volumes.filter(thin)) {
    const [y0, y1] = yRange(v);
    const [p, q] = [v.plan[0]!, v.plan[v.plan.length - 1]!];
    const ring: Array<[number, number]> = [[X(p[0]), -p[1]], [X(q[0]), -q[1]], [X(q[0]), q[1]], [X(p[0]), p[1]]];
    parts.push({ optional: 40, draw: (m) => m.scope(v.name, () => lodPrism(m, v.bands[0]![2], ring, y0, y1, v.bands[v.bands.length - 1]![2])) });
  }
  return fitLod({ palette: c.palette, shells: shells.map((s) => s.shell), parts }, budget);
}

// The coaches' LOD builders, under the names the JS bundles import (vehicles.ts).
export function csdClassicGreenCoachLod(params?: ParamValues): MeshBuilder { return coachLod(() => csdClassicGreenCoach(params)); }
export function csdBdmteeLod(): MeshBuilder { return coachLod(() => csdBdmtee()); }
export function csdBalmLod(): MeshBuilder { return coachLod(() => csdBalm()); }
export function csdBamLod(): MeshBuilder { return coachLod(() => csdBam()); }
export function csdBe31Lod(): MeshBuilder { return coachLod(() => csdBe31()); }
export function csdBi20Lod(): MeshBuilder { return coachLod(() => csdBi20()); }
export function csdDskLod(): MeshBuilder { return coachLod(() => csdDsk()); }
export function bmoCoachLod(params?: ParamValues): MeshBuilder { return coachLod(() => bmoCoach(params)); }
export function cdGreenWhiteCoachLod(params?: ParamValues): MeshBuilder { return coachLod(() => cdGreenWhiteCoach(params)); }

/** Every coach design's LOD builder, by design id. */
export const COACH_LODS: Readonly<Record<string, (params?: ParamValues) => MeshBuilder>> = {
  "proc-vehicle-csd-classic-green-coach": csdClassicGreenCoachLod,
  "proc-vehicle-csd-bdmtee": csdBdmteeLod,
  "proc-vehicle-csd-balm": csdBalmLod,
  "proc-vehicle-csd-bam": csdBamLod,
  "proc-vehicle-csd-be31": csdBe31Lod,
  "proc-vehicle-csd-bi20": csdBi20Lod,
  "proc-vehicle-csd-dsk": csdDskLod,
  "proc-vehicle-bmo-double-deck-coach": bmoCoachLod,
  "proc-vehicle-cd-green-white-coach": cdGreenWhiteCoachLod,
};
