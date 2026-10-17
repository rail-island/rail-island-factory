// The shared solids of the ordinary buildings' dedicated low level of detail
// (docs/models/lod.md): masses, walls in colour bands, parapets, frusta, gabled
// and hipped roofs, spires, lathe solids and plates, the optional-part helper and
// the fitting wrapper (`fit`). A building from afar keeps its masses, roof shapes
// and wall and roof colours; it has no windows
// (docs/specs/2026-10-17-dedicated-model-lods.md). Each kit's adapter lives in its
// own file (lodCommercial.ts, lodStreets.ts, lodVillage.ts, lodStations.ts,
// lodFountains.ts), so a model's standalone JS bundles only its own kit.
//
// Metres, +X right along the street, +Y up, +Z the street front, ground at y = 0,
// as the full models. Every face is a planar convex polygon drawn through
// `lodPolygon`; faces of different colours never overlap in one plane.

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { fitParts, lodBands, lodHipRoof, lodNgon, lodPolygon, lodPrism, type LodBand, type LodPart } from "./lodKit.ts";

/** An ordinary building's LOD budget (lodBudget in lod.ts); Prague main station has 500. */
export const BUDGET = 100;

export type XZ = readonly [number, number];
export type XY = readonly [number, number];
/** A rectangle in plan: x0, x1, z0, z1. */
export type Rect = readonly [number, number, number, number];

// --- generic solids -------------------------------------------------------------------------

/** The rectangle w x d about (cx, cz) as a ring; its edges run back (-z), right (+x), front (+z), left (-x). */
export function lodRect(cx: number, cz: number, w: number, d: number): Array<[number, number]> {
  return [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx + w / 2, cz + d / 2], [cx - w / 2, cz + d / 2]];
}

export const bounds = (cx: number, cz: number, w: number, d: number): Rect => [cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2];

export function centre(ring: readonly XZ[]): [number, number] {
  return [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
}

/** The walls of the convex ring from bottom to top painted in `bands` (neighbours alike joined); edges in `skip` left out. */
export function lodWalls(m: MeshBuilder, ring: readonly XZ[], bands: readonly LodBand[], skip: readonly number[] = []): void {
  const [cx, cz] = centre(ring);
  for (const [y0, y1, mat] of lodBands(bands, bands[0]![0], bands[bands.length - 1]![1])) {
    for (let i = 0; i < ring.length; i++) {
      if (skip.includes(i)) continue;
      const [a, b] = [ring[i]!, ring[(i + 1) % ring.length]!];
      lodPolygon(m, mat, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [(a[0] + b[0]) / 2 - cx, 0, (a[1] + b[1]) / 2 - cz]);
    }
  }
}

/** A horizontal convex polygon at y, facing up (or down). */
export function lodCap(m: MeshBuilder, mat: string, ring: readonly XZ[], y: number, up = true): void {
  lodPolygon(m, mat, ring.map(([x, z]): Vec3 => [x, y, z]), [0, up ? 1 : -1, 0]);
}

/** A block: the walls of the ring in bands and a flat top. */
export function lodMass(m: MeshBuilder, ring: readonly XZ[], bands: readonly LodBand[], top: string, skip: readonly number[] = []): void {
  lodWalls(m, ring, bands, skip);
  lodCap(m, top, ring, bands[bands.length - 1]![1]);
}

/**
 * A flat roof behind a parapet over the rectangle `r`: the parapet's inner face
 * slopes from the outer edge at `top` in by `inset` and down to the roof at `y`.
 * The outer face is the walls' business.
 */
export function lodParapet(m: MeshBuilder, r: Rect, y: number, top: number, inset: number, roof: string, lip: string): void {
  const [x0, x1, z0, z1] = r;
  const outer: Vec3[] = [[x0, top, z0], [x1, top, z0], [x1, top, z1], [x0, top, z1]];
  const inner: Vec3[] = [[x0 + inset, y, z0 + inset], [x1 - inset, y, z0 + inset], [x1 - inset, y, z1 - inset], [x0 + inset, y, z1 - inset]];
  const into: XZ[] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const [ux, uz] = into[i]!;
    lodPolygon(m, lip, [outer[i]!, outer[j]!, inner[j]!, inner[i]!], [ux * (top - y), inset, uz * (top - y)]);
  }
  lodPolygon(m, roof, inner, [0, 1, 0]);
}

/** Points with near duplicates dropped. */
export function distinct(pts: readonly Vec3[]): Vec3[] {
  return pts.filter((p, i) => pts.findIndex((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6) === i);
}

/** A loft from the rectangle `lo` at y0 to `hi` at y1: four sides (a side whose top edge shrinks to a point is a triangle) and, unless `top` is null, the top. */
export function lodFrustum(m: MeshBuilder, mat: string, lo: Rect, y0: number, hi: Rect, y1: number, top: string | null = mat): void {
  const ring = (r: Rect, y: number): Vec3[] => [[r[0], y, r[2]], [r[1], y, r[2]], [r[1], y, r[3]], [r[0], y, r[3]]];
  const [L, H] = [ring(lo, y0), ring(hi, y1)];
  const cx = (lo[0] + lo[1]) / 2, cz = (lo[2] + lo[3]) / 2;
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const pts = distinct([L[i]!, L[j]!, H[j]!, H[i]!]);
    if (pts.length >= 3) lodPolygon(m, mat, pts, [(L[i]![0] + L[j]![0]) / 2 - cx, 0, (L[i]![2] + L[j]![2]) / 2 - cz]);
  }
  if (top && hi[1] - hi[0] > 1e-3 && hi[3] - hi[2] > 1e-3) lodPolygon(m, top, H, [0, 1, 0]);
}

/** A pyramid over the convex ring from y0 to its apex (x, y1, z). */
export function lodSpire(m: MeshBuilder, mat: string, ring: readonly XZ[], y0: number, y1: number, apex?: XZ): void {
  const [cx, cz] = apex ?? centre(ring);
  for (let i = 0; i < ring.length; i++) {
    const [a, b] = [ring[i]!, ring[(i + 1) % ring.length]!];
    const mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz;
    lodPolygon(m, mat, [[a[0], y0, a[1]], [b[0], y0, b[1]], [cx, y1, cz]], [mx, Math.hypot(mx, mz) * Math.hypot(mx, mz) / Math.max(1e-6, y1 - y0), mz]);
  }
}

/** A solid of revolution about (cx, cz): `profile` is (radius, y) bottom up, n facets around; a last radius of 0 ends in a point. */
export function lodRevolve(m: MeshBuilder, mat: string, n: number, cx: number, cz: number, profile: ReadonlyArray<readonly [number, number]>, rot = 0, cap = true): void {
  for (let k = 0; k + 1 < profile.length; k++) {
    const [r0, y0] = profile[k]!, [r1, y1] = profile[k + 1]!;
    const lo = lodNgon(n, r0, cx, cz, rot), hi = lodNgon(n, r1, cx, cz, rot);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const pts = distinct([[lo[i]![0], y0, lo[i]![1]], [lo[j]![0], y0, lo[j]![1]], [hi[j]![0], y1, hi[j]![1]], [hi[i]![0], y1, hi[i]![1]]]);
      const a = rot + ((i + 0.5) * 2 * Math.PI) / n;
      // outward and, where the profile closes in, upward
      if (pts.length >= 3) lodPolygon(m, mat, pts, [Math.cos(a) * (y1 - y0), r0 - r1, Math.sin(a) * (y1 - y0)]);
    }
  }
  const [rl, yl] = profile[profile.length - 1]!;
  if (cap && rl > 1e-6) lodCap(m, mat, lodNgon(n, rl, cx, cz, rot), yl);
}

/**
 * A convex outline (x, y) between the planes z0 and z1: its face at z1 (and at z0
 * unless `back` is false) and the walls of its edges but the lowest one.
 */
export function lodPlate(m: MeshBuilder, mat: string, poly: readonly XY[], z0: number, z1: number, back = true, skip: readonly number[] = []): void {
  const s = Math.sign(z1 - z0);
  lodPolygon(m, mat, poly.map(([x, y]): Vec3 => [x, y, z1]), [0, 0, s]);
  if (back) lodPolygon(m, mat, poly.map(([x, y]): Vec3 => [x, y, z0]), [0, 0, -s]);
  const [cx, cy] = centre(poly);
  const low = Math.min(...poly.map((p) => p[1]));
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i]!, poly[(i + 1) % poly.length]!];
    if ((a[1] - low < 1e-6 && b[1] - low < 1e-6) || skip.includes(i)) continue;
    lodPolygon(m, mat, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], [(a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy, 0]);
  }
}

/** The convex hull of points (x, y), counter-clockwise (monotone chain). */
export function lodHull(points: readonly XY[]): XY[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (pts: XY[]) => {
    const h: XY[] = [];
    for (const q of pts) {
      while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, q) <= 1e-9) h.pop();
      h.push(q);
    }
    return h.slice(0, -1);
  };
  return [...half(p), ...half([...p].reverse())];
}

/** A quad on a vertical face: `at` the point of (u, y) on the face, `n` the face's outward normal. */
export function faceQuad(m: MeshBuilder, mat: string, at: (u: number, y: number) => Vec3, u0: number, u1: number, y0: number, y1: number, n: Vec3): void {
  lodPolygon(m, mat, [at(u0, y0), at(u1, y0), at(u1, y1), at(u0, y1)], n);
}

/** A thin post from y0 to y1 at (x, z): three walls, no top. */
export function lodPost(m: MeshBuilder, mat: string, x: number, z: number, r: number, y0: number, y1: number): void {
  lodWalls(m, lodNgon(3, r, x, z, Math.PI / 2), [[y0, y1, mat]]);
}

/** A thin box from y0 to y1: walls and top. */
export function lodBox(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, top = mat): void {
  lodPrism(m, mat, lodRect(cx, cz, w, d), y0, y1, top);
}

// --- roofs -----------------------------------------------------------------------------------

/** A pitched roof over the walls w x d about (cx, cz), its ridge along `axis`. */
export interface LodPitched {
  cx: number;
  cz: number;
  w: number;
  d: number;
  axis: "x" | "z";
  /** The wall top: the gable walls start here. */
  eave: number;
  /** Rise per run. */
  pitch: number;
  /** The overhang across the slopes and at the low / high end of the ridge. */
  oh: number;
  ends?: readonly [number, number];
  /** The vertical thickness of the roof's edges (0: none drawn). */
  t?: number;
  /** The top surface's height over the wall line; eave + t unless set. */
  top?: number;
  roof: string;
  /** The eaves' and the rakes' edge material; the roof's unless set. */
  edge?: string;
  rake?: string;
  /** The gable walls' material; draw the gable at the low / high end. */
  gable: string;
  gables?: readonly [boolean, boolean];
}

/** A gable roof: two slopes, their edges and the gable walls under them. */
export function lodGable(m: MeshBuilder, g: LodPitched): void {
  const alongX = g.axis === "x";
  const A = (alongX ? g.w : g.d) / 2, B = (alongX ? g.d : g.w) / 2;
  const at = (a: number, y: number, b: number): Vec3 => (alongX ? [g.cx + a, y, g.cz + b] : [g.cx + b, y, g.cz + a]);
  const dir = (a: number, y: number, b: number): Vec3 => (alongX ? [a, y, b] : [b, y, a]);
  const t = g.t ?? 0, top = g.top ?? g.eave + t, p = g.pitch;
  const [e0, e1] = g.ends ?? [g.oh, g.oh];
  const E0 = -A - e0, E1 = A + e1, F = B + g.oh;
  const yR = top + B * p, yE = top - g.oh * p;
  for (const sb of [-1, 1]) {
    lodPolygon(m, g.roof, [at(E0, yR, 0), at(E1, yR, 0), at(E1, yE, sb * F), at(E0, yE, sb * F)], dir(0, 1, sb * p));
    if (t > 0) {
      lodPolygon(m, g.edge ?? g.roof, [at(E0, yE, sb * F), at(E1, yE, sb * F), at(E1, yE - t, sb * F), at(E0, yE - t, sb * F)], dir(0, 0, sb));
      for (const [a, sa] of [[E0, -1], [E1, 1]] as const) {
        lodPolygon(m, g.rake ?? g.edge ?? g.roof, [at(a, yR, 0), at(a, yE, sb * F), at(a, yE - t, sb * F), at(a, yR - t, 0)], dir(sa, 0, 0));
      }
    }
  }
  // the gable wall: up to the roof's underside, clipped where the underside dips under the wall top
  const under = top - t;
  const ends = g.gables ?? [true, true];
  for (const sa of [-1, 1]) {
    if (!ends[sa < 0 ? 0 : 1]) continue;
    const a = sa * A;
    const apex = under + B * p;
    if (apex <= g.eave + 1e-3) continue;
    const pts: Vec3[] = under >= g.eave
      ? distinct([at(a, g.eave, -B), at(a, g.eave, B), at(a, under, B), at(a, apex, 0), at(a, under, -B)])
      : [at(a, g.eave, -(B - (g.eave - under) / p)), at(a, g.eave, B - (g.eave - under) / p), at(a, apex, 0)];
    lodPolygon(m, g.gable, pts, dir(sa, 0, 0));
  }
}

/** A hipped roof (a pyramid over a square) over the walls, its eaves overhanging by `oh`. */
export function lodHip(m: MeshBuilder, g: Omit<LodPitched, "axis" | "gable" | "gables" | "ends">): void {
  const t = g.t ?? 0, top = g.top ?? g.eave + t;
  const yE = top - g.oh * g.pitch;
  const F = Math.min(g.w, g.d) / 2 + g.oh;
  const [x0, x1, z0, z1] = bounds(g.cx, g.cz, g.w + 2 * g.oh, g.d + 2 * g.oh);
  lodHipRoof(m, g.roof, x0, x1, z0, z1, yE, yE + F * g.pitch, F);
  if (t > 0) lodWalls(m, lodRect(g.cx, g.cz, g.w + 2 * g.oh, g.d + 2 * g.oh), [[yE - t, yE, g.edge ?? g.roof]]);
}

// --- fitting ---------------------------------------------------------------------------------

/** A part: `rank` undefined for what the building is made of, else optional (lowest rank gives way first). */
export const part = (draw: (m: MeshBuilder) => void, rank?: number): LodPart => (rank === undefined ? { draw } : { draw, optional: rank });

/** Draws into `m` mirrored in x when mx is -1 (a design's `side` parameter). */
export function mirror(m: MeshBuilder, mx: 1 | -1): MeshBuilder {
  if (mx === 1) return m;
  const f = (p: Vec3): Vec3 => [-p[0], p[1], p[2]];
  return { tri: (mat: string, a: Vec3, b: Vec3, c: Vec3) => m.tri(mat, f(a), f(c), f(b)) } as unknown as MeshBuilder;
}

export function fit(palette: Record<string, MaterialSpec>, parts: LodPart[], budget = BUDGET, mx: 1 | -1 = 1): MeshBuilder {
  return fitParts(palette, parts.map((p) => ({ ...p, draw: (m: MeshBuilder) => p.draw(mirror(m, mx)) })), budget);
}
