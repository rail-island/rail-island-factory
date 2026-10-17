// The dedicated low level of detail of the road vehicles (docs/models/lod.md):
// the buses (busKit / busBody / busAssembly, fed by cityBuses.ts and karosa.ts)
// and the trucks (trucks.ts, photoTrucks.ts). A road vehicle from afar is a few
// prismatic masses -- a bus body, a cab, a bonnet, a box, a canopy -- each a
// stack of layers between its own front and rear profiles (which differ, unlike
// a rail vehicle's ends: a bus's raked windscreen against its upright tail, a
// cab-over's front against its flat back wall), painted in the livery's bands;
// windscreens and window bands laid a little proud of them in the one LOD glass;
// the wheels as dark discs on the sides, standing on the road; and the round
// masses (a tank, a mixer drum) as coarse tubes. `roadLod` fits it all into
// the budget with the shared kit's `fitLod`, which also keeps an articulated
// bus's or a semi-truck's sections (LodSpec.sections).
//
// Metres, +X forward, +Y up, +Z right, as the full models; the wheels stand on
// y = 0. Bogie-like running gear stays static: the steered wheels are discs
// fixed to the front section.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { fitLod, lerp, lodBandAt, lodBands, lodPolygon, mergeBand, simplifyTable, type LodBand, type LodPart, type LodSections, type Table } from "./lodKit.ts";
import { LOD_GLASS, windowBands } from "./lodKit.ts";
import type { BusSpec } from "./busAssembly.ts";
import { busSections } from "./busAssembly.ts";
import type { Paint } from "./busBody.ts";

// --- the body: layers between a front and a rear profile ------------------------------

/**
 * A prismatic mass from afar: at height y it reaches from rear(y) to front(y)
 * along x and hw(y) either side of the centre line. The three tables share
 * their bottom and top heights (the hw table's are used); the sides, the front
 * and the rear are painted in their own bands, the top capped in `roof`. A
 * horizontal slice of it is a rectangle: rounded plan corners are left out.
 */
export interface RoadBody {
  /** [y, x] of the front and the rear end, bottom first. */
  front: Table;
  rear: Table;
  /** [y, half width], bottom first; its first and last heights are the body's bottom and top. */
  hw: Table;
  side: readonly LodBand[];
  /** The ends' paint, bottom first; the sides' by default. */
  frontEnd?: readonly LodBand[];
  rearEnd?: readonly LodBand[];
  roof: string;
  /** Which ends are drawn (+1 front, -1 rear): an end abutting another mass is hidden. Default both. */
  ends?: readonly number[];
  /** The top is left open (it is under another mass). */
  open?: boolean;
}

const bottomOf = (b: RoadBody) => b.hw[0]![0];
const topOf = (b: RoadBody) => b.hw[b.hw.length - 1]![0];
/** The inner heights of a table: where its profile kinks. */
const inner = (t: Table, y0: number, y1: number) => t.map(([y]) => y).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6);
const sortedUnique = (ys: number[]) => [...new Set(ys.map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);

/** The layers between `breaks` whose paint `at` gives, neighbours of one paint joined unless a profile kinks between them. */
function layers(breaks: number[], kinks: Set<number>, at: (ym: number) => string): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (let i = 1; i < breaks.length; i++) {
    const [ya, yb] = [breaks[i - 1]!, breaks[i]!];
    const mat = at((ya + yb) / 2);
    const last = out[out.length - 1];
    if (last && last[2] === mat && !kinks.has(ya)) last[1] = yb;
    else out.push([ya, yb, mat]);
  }
  return out;
}

/** Draws `b`: each side one convex polygon per paint layer, each end a quad per layer and kink, the top a quad. */
export function roadBody(m: MeshBuilder, b: RoadBody): void {
  const y0 = bottomOf(b), top = topOf(b);
  const xf = (y: number) => lerp(b.front, y), xr = (y: number) => lerp(b.rear, y), hw = (y: number) => lerp(b.hw, y);
  const edges = (bands: readonly LodBand[]) => bands.flatMap(([a, c]) => [a, c]).filter((y) => y > y0 + 1e-6 && y < top - 1e-6);
  const hwKinks = inner(b.hw, y0, top);

  // the sides: a slice of the side outline per layer, in the plane z = s hw(y) (no hw kink inside it)
  const sideLayers = layers(sortedUnique([y0, top, ...hwKinks, ...edges(b.side)]), new Set(hwKinks), (y) => lodBandAt(b.side, y));
  for (const s of [-1, 1]) {
    for (const [ya, yb, mat] of sideLayers) {
      const fk = inner(b.front, ya, yb), rk = inner(b.rear, ya, yb).reverse();
      const pts: Array<[number, number]> = [[xr(ya), ya], [xf(ya), ya], ...fk.map((y): [number, number] => [xf(y), y]), [xf(yb), yb], [xr(yb), yb], ...rk.map((y): [number, number] => [xr(y), y])];
      lodPolygon(m, mat, pts.map(([x, y]): Vec3 => [x, y, s * hw(y)]), [0, 0, s]);
    }
  }
  // the ends: a quad per layer between the end's and the width's kinks
  for (const e of b.ends ?? [1, -1]) {
    const table = e > 0 ? b.front : b.rear;
    const bands = (e > 0 ? b.frontEnd : b.rearEnd) ?? b.side;
    const kinks = [...inner(table, y0, top), ...hwKinks];
    const x = (y: number) => lerp(table, y);
    for (const [ya, yb, mat] of layers(sortedUnique([y0, top, ...kinks, ...edges(bands)]), new Set(kinks), (y) => lodBandAt(bands, y))) {
      lodPolygon(m, mat, [[x(ya), ya, -hw(ya)], [x(ya), ya, hw(ya)], [x(yb), yb, hw(yb)], [x(yb), yb, -hw(yb)]], [e, 0, 0]);
    }
  }
  if (!b.open && hw(top) > 1e-6 && xf(top) - xr(top) > 1e-6) {
    lodPolygon(m, b.roof, [[xr(top), top, -hw(top)], [xf(top), top, -hw(top)], [xf(top), top, hw(top)], [xr(top), top, hw(top)]], [0, 1, 0]);
  }
}

/**
 * A rectangle x0..x1, y0..y1 laid `proud` off side `s` of `b` (a window band,
 * a door), cut where the side's plane bends and kept inside its outline.
 */
export function bodySideRect(m: MeshBuilder, b: RoadBody, s: number, mat: string, x0: number, x1: number, y0: number, y1: number, proud = 0.015): void {
  const xf = (y: number) => lerp(b.front, y) - 0.02, xr = (y: number) => lerp(b.rear, y) + 0.02, hw = (y: number) => lerp(b.hw, y);
  const [lo, hi] = [Math.max(y0, bottomOf(b)), Math.min(y1, topOf(b))];
  const cuts = sortedUnique([lo, hi, ...inner(b.hw, lo, hi), ...inner(b.front, lo, hi), ...inner(b.rear, lo, hi)]);
  for (let i = 1; i < cuts.length; i++) {
    const [ya, yb] = [cuts[i - 1]!, cuts[i]!];
    const pt = (x: number, y: number, end: number): Vec3 => [end > 0 ? Math.min(x, xf(y)) : Math.max(x, xr(y)), y, s * (hw(y) + proud)];
    const q = [pt(x0, ya, -1), pt(x1, ya, 1), pt(x1, yb, 1), pt(x0, yb, -1)];
    if (q[1]![0] - q[0]![0] < 0.05 || q[2]![0] - q[3]![0] < 0.05) continue;
    lodPolygon(m, mat, q, [0, 0, s]);
  }
}

/** A convex outline (x, y) laid `proud` off side `s` of `b`: keep it inside the side's outline and one plane of it. */
export function bodySideShape(m: MeshBuilder, b: RoadBody, s: number, mat: string, pts: ReadonlyArray<readonly [number, number]>, proud = 0.015): void {
  lodPolygon(m, mat, pts.map(([x, y]): Vec3 => [x, y, s * (lerp(b.hw, y) + proud)]), [0, 0, s]);
}

/** A rectangle z0..z1, y0..y1 laid `proud` off end `e` of `b` (a windscreen, a grille), cut where the end bends. */
export function bodyEndRect(m: MeshBuilder, b: RoadBody, e: number, mat: string, z0: number, z1: number, y0: number, y1: number, proud = 0.015): void {
  const table = e > 0 ? b.front : b.rear;
  const hw = (y: number) => lerp(b.hw, y) - 0.02;
  const [lo, hi] = [Math.max(y0, bottomOf(b)), Math.min(y1, topOf(b))];
  const cuts = sortedUnique([lo, hi, ...inner(b.hw, lo, hi), ...inner(table, lo, hi)]);
  for (let i = 1; i < cuts.length; i++) {
    const [ya, yb] = [cuts[i - 1]!, cuts[i]!];
    const pt = (z: number, y: number): Vec3 => [lerp(table, y) + e * proud, y, Math.max(-hw(y), Math.min(hw(y), z))];
    const q = [pt(z0, ya), pt(z1, ya), pt(z1, yb), pt(z0, yb)];
    if (q[1]![2] - q[0]![2] < 0.05 || q[2]![2] - q[3]![2] < 0.05) continue;
    lodPolygon(m, mat, q, [e, 0, 0]);
  }
}

// --- bodies from the full kits' outlines ------------------------------------------------------

/** The x of a convex (x, y) outline's front (`end` +1) or rear (-1) edge at height y. */
function outlineEnd(outline: ReadonlyArray<readonly [number, number]>, y: number, end: number): number {
  let best = end > 0 ? -Infinity : Infinity;
  for (let i = 0; i < outline.length; i++) {
    const [xa, ya] = outline[i]!, [xb, yb] = outline[(i + 1) % outline.length]!;
    if (y < Math.min(ya, yb) - 1e-9 || y > Math.max(ya, yb) + 1e-9) continue;
    const x = Math.abs(yb - ya) < 1e-9 ? (end > 0 ? Math.max(xa, xb) : Math.min(xa, xb)) : xa + ((xb - xa) * (y - ya)) / (yb - ya);
    best = end > 0 ? Math.max(best, x) : Math.min(best, x);
  }
  return best;
}

/**
 * The front and rear tables of a convex side outline (x, y) between y0 and
 * top. A chamfer within `foot` of the bottom (a bumper's) is stood upright: the
 * end below the first kink above it is vertical.
 */
export function outlineEnds(outline: ReadonlyArray<readonly [number, number]>, y0: number, top: number, foot = 0, tol = 0.03): { front: Table; rear: Table } {
  const end = (e: number): Table => {
    const hs = sortedUnique([...outline.map(([, y]) => y).filter((y) => y > y0 + foot + 1e-6 && y < top - 1e-6), top]);
    const t: Array<[number, number]> = hs.map((y) => [y, outlineEnd(outline, y, e)]);
    return simplifyTable([[y0, t[0]![1]], ...t], tol);
  };
  return { front: end(1), rear: end(-1) };
}

/** The half width of a convex cross-section (z, y), as a table bottom first; a crown on the centre line is left out. */
export function sectionHalfWidth(section: ReadonlyArray<readonly [number, number]>, tol = 0.03): Table {
  const right = section.filter(([z]) => z > 1e-6).map(([z, y]) => [y, z] as [number, number]).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const t = right.filter(([y], i) => i === 0 || y > right[i - 1]![0] + 1e-6);
  return simplifyTable(t, tol);
}

/** A side profile (x, y) swept across z = -hw..hw: a cab, a tipper. */
export function profileBody(profile: ReadonlyArray<readonly [number, number]>, hw: number, paint: Omit<RoadBody, "front" | "rear" | "hw">, foot = 0): RoadBody {
  const ys = profile.map(([, y]) => y);
  const [y0, top] = [Math.min(...ys), Math.max(...ys)];
  return { ...outlineEnds(profile, y0, top, foot), hw: [[y0, hw], [top, hw]], ...paint };
}

/** A cross-section (z, y) swept along x from x0 to x1: a bonnet, a canopy, a box. */
export function sectionBody(section: ReadonlyArray<readonly [number, number]>, x0: number, x1: number, paint: Omit<RoadBody, "front" | "rear" | "hw">): RoadBody {
  const hw = sectionHalfWidth(section);
  const [y0, top] = [hw[0]![0], hw[hw.length - 1]![0]];
  return { front: [[y0, x1], [top, x1]], rear: [[y0, x0], [top, x0]], hw, ...paint };
}

// --- round masses and wheels -----------------------------------------------------------------

/**
 * A tube along x through rings [x, radius, centre height] (front or rear first),
 * each an n-gon with a flat top; `caps` closes the first and last ring ("cone":
 * to a point `capLength` beyond it, else flat). A tank, a mixer drum.
 */
export function lodTube(m: MeshBuilder, mat: string, rings: ReadonlyArray<readonly [x: number, r: number, y: number]>, n: number, caps: readonly ["flat" | "cone" | "none", "flat" | "cone" | "none"], coneLength = 0.3): void {
  const ring = ([x, r, y]: readonly [number, number, number]): Vec3[] =>
    Array.from({ length: n }, (_, i) => { const a = Math.PI / n + (2 * Math.PI * i) / n; return [x, y + r * Math.sin(a), r * Math.cos(a)] as Vec3; });
  const pts = rings.map(ring);
  for (let k = 0; k + 1 < rings.length; k++) {
    const [a, b] = [pts[k]!, pts[k + 1]!];
    const yc = (rings[k]![2] + rings[k + 1]![2]) / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const q = [a[i]!, a[j]!, b[j]!, b[i]!];
      const c = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4, s[2] + p[2] / 4] as Vec3, [0, 0, 0] as Vec3);
      lodPolygon(m, mat, q, [0, c[1] - yc, c[2]]);
    }
  }
  ([[0, 1], [rings.length - 1, -1]] as const).forEach(([k, dir], c) => {
    const kind = caps[c]!;
    if (kind === "none") return;
    // outward: away from the neighbouring ring
    const out = Math.sign(rings[k]![0] - rings[k + dir]![0]);
    if (kind === "flat") lodPolygon(m, mat, pts[k]!, [out, 0, 0]);
    else {
      const tip: Vec3 = [rings[k]![0] + out * coneLength, rings[k]![2], 0];
      for (let i = 0; i < n; i++) {
        const [p, q] = [pts[k]![i]!, pts[k]![(i + 1) % n]!];
        lodPolygon(m, mat, [p, q, tip], [out, (p[1] + q[1]) / 2 - rings[k]![2], (p[2] + q[2]) / 2]);
      }
    }
  });
}

/** A road wheel from afar: a dark n-gon disc in the plane z, facing out, its flat bottom on the road. */
export function lodRoadWheel(m: MeshBuilder, mat: string, x: number, r: number, z: number, n = 6): void {
  const y = r * Math.cos(Math.PI / n);
  const pts = Array.from({ length: n }, (_, i): Vec3 => {
    const a = 1.5 * Math.PI - Math.PI / n + (2 * Math.PI * i) / n;
    return [x + r * Math.cos(a), y + r * Math.sin(a), z];
  });
  lodPolygon(m, mat, pts, [0, 0, Math.sign(z)]);
}

/** A box x0..x1, y0..y1, z0..z1: its four walls and top (no bottom), the ends left out unless `ends`. */
export function lodBlock(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, ends = true, topFace = true): void {
  for (const [z, s] of [[z0, -1], [z1, 1]] as const) lodPolygon(m, mat, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, s]);
  if (ends) for (const [x, s] of [[x0, -1], [x1, 1]] as const) lodPolygon(m, mat, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [s, 0, 0]);
  if (topFace) lodPolygon(m, mat, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
}

// --- the shared fitting --------------------------------------------------------------------------

/** A window or panel on one face of a body: a side's (`side` +1 right, -1 left, 0 both; u = x) or an end's (`end`; u = z). */
export interface RoadRect {
  side?: number;
  end?: number;
  u: readonly [number, number];
  y: readonly [number, number];
  mat?: string;
  /** Given up first, lowest first. */
  optional?: number;
}

/** A road vehicle's distant model: masses, the windows and panels on them, wheels and other parts. */
export interface RoadLodSpec {
  palette: Record<string, MaterialSpec>;
  bodies: Array<{ body: RoadBody; name: string; rects?: RoadRect[]; section?: number; optional?: number }>;
  wheels: { mat: string; at: Array<{ x: number; r: number; z: number; section?: number }> };
  parts?: LodPart[];
  sections?: LodSections;
}

/** Builds a road vehicle's LOD within `budget` (fitLod: optional parts give way first, lowest first). */
export function roadLod(spec: RoadLodSpec, budget: number): MeshBuilder {
  const parts: LodPart[] = [];
  for (const { body, name, rects = [], section, optional } of spec.bodies) {
    const sec = section !== undefined ? { section } : {};
    parts.push({ ...sec, ...(optional !== undefined ? { optional } : {}), draw: (m) => m.scope(name, () => roadBody(m, body)) });
    const draw = (m: MeshBuilder, r: RoadRect) => m.scope(`${name} ${r.end ? "end" : "side"} ${r.mat ?? "glazing"}`, () => r.end
      ? bodyEndRect(m, body, r.end, r.mat ?? LOD_GLASS, r.u[0], r.u[1], r.y[0], r.y[1])
      : (r.side ? [r.side] : [-1, 1]).forEach((s) => bodySideRect(m, body, s, r.mat ?? LOD_GLASS, r.u[0], r.u[1], r.y[0], r.y[1])));
    // the kept rectangles one by one; the optional ones of one rank together (a bus's doors go or stay as a set)
    for (const r of rects) if (r.optional === undefined) parts.push({ ...sec, draw: (m) => draw(m, r) });
    for (const rank of [...new Set(rects.map((r) => r.optional).filter((o) => o !== undefined))]) {
      const set = rects.filter((r) => r.optional === rank);
      parts.push({ ...sec, optional: rank!, draw: (m) => { for (const r of set) draw(m, r); } });
    }
  }
  const sections = [...new Set(spec.wheels.at.map((w) => w.section ?? 0))];
  for (const s of sections) {
    parts.push({ section: s, draw: (m) => m.scope("wheels", () => {
      for (const w of spec.wheels.at) if ((w.section ?? 0) === s) lodRoadWheel(m, spec.wheels.mat, w.x, w.r, w.z);
    }) });
  }
  parts.push(...(spec.parts ?? []));
  return fitLod({ palette: spec.palette, shells: [], parts, ...(spec.sections ? { sections: spec.sections } : {}) }, budget);
}

// --- the bus adapter ----------------------------------------------------------------------------

/**
 * What a distant bus keeps of its fittings, recorded by the bus draft beside
 * them (busAssembly.ts BusDraft): the side glass and doors, the end glass, end
 * paint the shell's panels do not carry (bumpers), the roof equipment and the
 * stretches of a side something hides the windows on.
 */
export interface BusLodNotes {
  glass: Array<{ s: number; x: [number, number]; y: [number, number] }>;
  doors: Array<{ s: number; x: [number, number]; y: [number, number] }>;
  ends: Array<{ end: number; z: [number, number]; y: [number, number]; mat?: string }>;
  endPaint: Array<{ end: number; y: [number, number]; mat: string }>;
  roof: Array<{ x: [number, number]; z: [number, number]; y: [number, number]; mat: string }>;
  covers: Array<{ s: number; x: [number, number] }>;
  /** Paint laid on a side: a rectangle, or a convex outline (x, y) within one plane of the side. */
  panels: Array<{ s: number; x: [number, number]; y: [number, number]; mat: string }>;
  shapes: Array<{ s: number; pts: Array<[number, number]>; mat: string }>;
}

export const emptyBusLodNotes = (): BusLodNotes => ({ glass: [], doors: [], ends: [], endPaint: [], roof: [], covers: [], panels: [], shapes: [] });

/** The colour of the shell's paint at (x, y), later panels over earlier ones (busBody.ts drawShell). */
function paintAt(base: string, paint: readonly Paint[], x: number, y: number): string {
  let mat = base;
  for (const p of paint) if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1) mat = p.mat;
  return mat;
}

/** The paint over most of x0..x1 at height y. */
function dominantPaint(base: string, paint: readonly Paint[], x0: number, x1: number, y: number): string {
  const xs = sortedUnique([x0, x1, ...paint.flatMap((p) => [p.x0, p.x1]).filter((x) => x > x0 && x < x1)]);
  const length = new Map<string, number>();
  for (let i = 1; i < xs.length; i++) {
    const mat = paintAt(base, paint, (xs[i - 1]! + xs[i]!) / 2, y);
    length.set(mat, (length.get(mat) ?? 0) + xs[i]! - xs[i - 1]!);
  }
  return [...length].reduce((a, b) => (b[1] > a[1] + 1e-9 ? b : a))[0];
}

/** Bands bottom first from `at`, sampled between the heights `ys`; bands thinner than `thin` painted over by a neighbour. */
function sampledBands(ys: number[], at: (y: number) => string, thin: number): LodBand[] {
  let bands: LodBand[] = lodBands(ys.slice(1).map((y, i): LodBand => [ys[i]!, y, at((ys[i]! + y) / 2)]), ys[0]!, ys[ys.length - 1]!);
  for (;;) {
    const i = bands.findIndex(([a, b]) => b - a < thin);
    if (i < 0 || bands.length < 2) return bands;
    bands = mergeBand(bands, i);
  }
}

/** A colour's relative luminance (0 black .. 1 white). */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** `ranges` less `cut`, pieces shorter than 0.3 m dropped. */
function subtract(ranges: Array<[number, number]>, cut: readonly [number, number]): Array<[number, number]> {
  return ranges.flatMap(([a, b]): Array<[number, number]> => {
    if (cut[1] <= a || cut[0] >= b) return [[a, b]];
    return ([[a, cut[0]], [cut[1], b]] as Array<[number, number]>).filter(([p, q]) => q - p > 0.3);
  });
}

/**
 * A bus from afar (busAssembly.ts BusSpec plus the draft's notes): each section's
 * shell between its own ends -- the nose's and the tail's profiles, a flat cut at
 * a joint -- painted in the shell panels' bands (the sides in the colour over most
 * of their length, the ends in the colour at the nose and the tail, plus the
 * bumpers), one window band per side and stretch of glazing, the doors below it,
 * the windscreen and the rear window, the roof equipment and a dark disc per
 * wheel. An articulated bus keeps its sections and bellows (LodSpec.sections),
 * 100 triangles a section.
 */
export function busLod(spec: Omit<BusSpec, "fittings">, notes: BusLodNotes): MeshBuilder {
  const hw = sectionHalfWidth(spec.section);
  const y0 = hw[0]![0], top = hw[hw.length - 1]![0];
  // the bumper's chamfer stood upright: the body is a box below 0.4 m off its bottom
  const ends = outlineEnds(spec.side, y0, top, 0.4);
  const nose = lerp(ends.front, (y0 + top) / 2), tail = lerp(ends.rear, (y0 + top) / 2);
  const n = spec.bodies.length;
  const kinks = [...hw, ...ends.front, ...ends.rear].map(([y]) => y);
  // heights where the paint changes, a band's edge within 4 cm of a kink moved onto it
  const snap = (y: number) => kinks.find((k) => Math.abs(k - y) < 0.04) ?? y;
  const ys = sortedUnique([y0, top, ...spec.paint.flatMap((p) => [p.y0, p.y1]).map(snap).filter((y) => y > y0 && y < top)]);
  const lum = (mat: string) => luminance(spec.palette[mat]?.color ?? "#ffffff");
  const endBands = (end: number, x: number): LodBand[] => {
    const own = notes.endPaint.filter((p) => p.end === end);
    const ys2 = sortedUnique([...ys, ...own.flatMap((p) => p.y.map(snap)).filter((y) => y > y0 && y < top)]);
    return sampledBands(ys2, (y) => own.reduce((mat, p) => (y > p.y[0] && y < p.y[1] ? p.mat : mat), paintAt(spec.base, spec.paint, x, y)), 0.06);
  };
  const front = endBands(1, nose), rear = endBands(-1, tail);

  const bodies: RoadLodSpec["bodies"] = spec.bodies.map(([lo, hi], i) => {
    const flat = (x: number): Table => [[y0, x], [top, x]];
    const side = sampledBands(ys, (y) => dominantPaint(spec.base, spec.paint, lo, hi, y), 0.06);
    const cutBands = (x: number) => sampledBands(ys, (y) => paintAt(spec.base, spec.paint, x, y), 0.06);
    const body: RoadBody = {
      front: i === 0 ? ends.front : flat(hi), rear: i === n - 1 ? ends.rear : flat(lo), hw,
      side, frontEnd: i === 0 ? front : cutBands(hi), rearEnd: i === n - 1 ? rear : cutBands(lo), roof: dominantPaint(spec.base, spec.paint, lo, hi, top),
    };
    const rects: RoadRect[] = [];
    for (const s of [-1, 1]) {
      // the window band: the side glass and the doors at its height joined into stretches, less what hides it
      const mine = <T extends { s: number; x: [number, number] }>(r: T) => r.s === s && r.x[1] > lo && r.x[0] < hi;
      const glass = notes.glass.filter(mine);
      if (!glass.length) continue;
      const gy = glass.reduce((a, g) => (g.x[1] - g.x[0] > a.x[1] - a.x[0] ? g : a)).y;
      const doors = notes.doors.filter(mine);
      let runs: Array<[number, number]> = windowBands([...glass, ...doors].map((g) => ({ u: g.x, y: gy })), 0.8).map((w) => [Math.max(w.u[0], lo + 0.1), Math.min(w.u[1], hi - 0.1)]);
      for (const c of notes.covers.filter((c) => c.s === s)) runs = runs.flatMap((r) => subtract([r], c.x));
      // on a dark band the glass does not show from afar
      const under = lodBandAt(side, (gy[0] + gy[1]) / 2);
      if (lum(under) > 0.05) for (const r of runs) rects.push({ side: s, u: r, y: gy });
      // the doors below the band, the right side's in full
      doors.forEach((d) => {
        if (d.y[0] < gy[0] - 0.3 && lum(lodBandAt(side, (d.y[0] + gy[0]) / 2)) > 0.05) rects.push({ side: s, u: d.x, y: [d.y[0], gy[0]], optional: 30 + i });
      });
    }
    for (const g of notes.ends) {
      if ((g.end > 0 && i === 0) || (g.end < 0 && i === n - 1)) rects.push({ end: g.end, u: g.z, y: g.y, ...(g.mat ? { mat: g.mat } : {}) });
    }
    for (const p of notes.panels) if (p.x[1] > lo && p.x[0] < hi) rects.push({ side: p.s, u: [Math.max(p.x[0], lo), Math.min(p.x[1], hi)], y: p.y, mat: p.mat });
    return { body, name: n > 1 ? `body ${i}` : "body", rects, section: i };
  });

  const sectionOf = (x: number) => Math.max(0, spec.bodies.findIndex(([lo, hi]) => x >= lo - 0.5 && x <= hi + 0.5));
  const shapes: LodPart[] = notes.shapes.map((sh) => {
    const i = sectionOf(sh.pts.reduce((a, p) => a + p[0], 0) / sh.pts.length);
    return { section: i, draw: (m: MeshBuilder) => m.scope("side paint", () => bodySideShape(m, bodies[i]!.body, sh.s, sh.mat, sh.pts)) };
  });
  const parts: LodPart[] = notes.roof.map((r) => ({
    section: sectionOf((r.x[0] + r.x[1]) / 2),
    // the short and low boxes give way first
    optional: 10 + (r.x[1] - r.x[0]) * (r.y[1] - top),
    draw: (m: MeshBuilder) => m.scope("roof equipment", () => lodBlock(m, r.mat, r.x[0], r.x[1], Math.min(r.y[0], top - 0.01), r.y[1], r.z[0], r.z[1])),
  }));

  const wz = lerp(hw, y0) + 0.03;
  const wheels = spec.axles.flatMap((a) => [-1, 1].map((s) => ({ x: a.x, r: spec.wheelRadius, z: s * wz, section: sectionOf(a.x) })));
  let sections: LodSections | undefined;
  if (n > 1) {
    const rig = busSections(spec);
    const prof = spec.bellows!.profile;
    const w = Math.max(...prof.map(([z]) => z));
    const yb = Math.min(...prof.map(([, y]) => y)), yc = Math.max(...prof.map(([, y]) => y));
    const ys0 = Math.max(...prof.filter(([z]) => z >= w - 1e-6).map(([, y]) => y));
    sections = {
      pivots: rig.map((s) => s.pivot as Vec3),
      // the bellows from afar: its cross-section's sides, shoulders and crown
      joints: spec.bodies.slice(1).map((b, i) => ({ sections: [i, i + 1] as [number, number], front: spec.bodies[i]![0], rear: b[1], profile: [[-w, yb], [w, yb], [w, ys0], [0, yc], [-w, ys0]] as Array<[number, number]> })),
      maxBendDeg: spec.maxBendDeg ?? 45,
    };
  }
  return roadLod({ palette: spec.palette, bodies, wheels: { mat: "under", at: wheels }, parts: [...shapes, ...parts], ...(sections ? { sections } : {}) }, Math.min(300, 100 * n));
}

// --- the truck adapter ----------------------------------------------------------------------------

/** A cab-over cab's level (trucks.ts Level): at height y its front at xf, half width hw. */
export interface LodCabLevel {
  y: number;
  xf: number;
  hw: number;
}

/**
 * A cab-over cab from afar, from the full kit's levels (trucks.ts cabShell):
 * the flat back wall at x0, the front raked level by level, carried down to
 * the bumper's bottom `foot` -- the bumper standing `foot.xf` forward up to
 * `foot.top` -- as one mass; rounded corners left out.
 */
export function levelCab(x0: number, levels: readonly LodCabLevel[], foot: { y: number; top: number; xf: number }, paint: Omit<RoadBody, "front" | "rear" | "hw">): RoadBody {
  const above = levels.filter((l) => l.y > foot.top);
  const front: Table = simplifyTable([[foot.y, foot.xf], [foot.top, Math.max(foot.xf, lerp(levels.map((l) => [l.y, l.xf] as const), foot.top))], ...above.map((l) => [l.y, l.xf] as const)], 0.08);
  const hw: Table = simplifyTable([[foot.y, levels[0]!.hw], ...levels.map((l) => [l.y, l.hw] as const).filter(([y]) => y > foot.y)], 0.05);
  const top = hw[hw.length - 1]![0];
  return { front, rear: [[foot.y, x0], [top, x0]], hw, ...paint };
}

/** A truck from afar: the cab with its glazing and grille, the other masses, the wheels; a semi-truck's two sections. */
export interface TruckLodSpec {
  palette: Record<string, MaterialSpec>;
  cab: {
    body: RoadBody;
    /** The windscreen across the front, half its width and its heights. */
    windscreen: { half: number; y: readonly [number, number] };
    /** The side windows (x, y), drawn on both sides. */
    sideWindows?: Array<{ x: readonly [number, number]; y: readonly [number, number] }>;
    /** Panels on the front: a grille, a sun visor. */
    front?: Array<{ half: number; y: readonly [number, number]; mat: string; optional?: number }>;
  };
  masses?: RoadLodSpec["bodies"];
  parts?: LodPart[];
  wheels: { mat: string; r: number; axles: Array<{ x: number; z: number; section?: number }> };
  sections?: LodSections;
}

/** Builds a truck's LOD (roadLod): the cab's side windows give way first, then the parts the family marks optional. */
export function truckLod(t: TruckLodSpec, budget: number): MeshBuilder {
  const rects: RoadRect[] = [
    { end: 1, u: [-t.cab.windscreen.half, t.cab.windscreen.half], y: t.cab.windscreen.y },
    ...(t.cab.front ?? []).map((f): RoadRect => ({ end: 1, u: [-f.half, f.half], y: f.y, mat: f.mat, ...(f.optional !== undefined ? { optional: f.optional } : {}) })),
    ...(t.cab.sideWindows ?? []).map((w): RoadRect => ({ side: 0, u: w.x, y: w.y, optional: 20 })),
  ];
  return roadLod({
    palette: t.palette,
    bodies: [{ body: t.cab.body, name: "cab", rects }, ...(t.masses ?? [])],
    wheels: { mat: t.wheels.mat, at: t.wheels.axles.flatMap((a) => [-1, 1].map((s) => ({ x: a.x, r: t.wheels.r, z: s * a.z, ...(a.section !== undefined ? { section: a.section } : {}) }))) },
    ...(t.parts ? { parts: t.parts } : {}),
    ...(t.sections ? { sections: t.sections } : {}),
  }, budget);
}

/** A part drawing a block (lodBlock) in a named scope; `optional` gives way first, lowest first. */
export function blockPart(name: string, mat: string, x: readonly [number, number], y: readonly [number, number], z: readonly [number, number], o: { section?: number; optional?: number; ends?: boolean; top?: boolean } = {}): LodPart {
  return {
    ...(o.section !== undefined ? { section: o.section } : {}),
    ...(o.optional !== undefined ? { optional: o.optional } : {}),
    draw: (m) => m.scope(name, () => lodBlock(m, mat, x[0], x[1], y[0], y[1], z[0], z[1], o.ends ?? true, o.top ?? true)),
  };
}
