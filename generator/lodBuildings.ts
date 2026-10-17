// The dedicated low level of detail of the ordinary buildings (docs/models/lod.md):
// the commercial street kits, the village house kit, the timber cottages, the
// alpine hut, the stations and the fountains. A building from afar keeps its
// masses (storeys, wings, plinths), its roof shapes (gable, hip, mansard,
// barrel, flat behind a parapet) and its wall and roof colours as bands; it has
// no windows (docs/specs/2026-10-17-dedicated-model-lods.md). Each kit has one
// adapter fed by the kit's own constants, palette and parameters; the shared
// fitting rule (`fitLod`) gives up the optional parts - belts, chimneys, porches,
// balconies, roof plant - lowest rank first, until the budget holds.
//
// Metres, +X right along the street, +Y up, +Z the street front, ground at y = 0,
// as the full models. Every face is a planar convex polygon drawn through
// `lodPolygon`; faces of different colours never overlap in one plane.

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { fitLod, lodBands, lodHipRoof, lodNgon, lodPolygon, lodPrism, type LodBand, type LodPart } from "./lodKit.ts";
import {
  BALCONY_PARAMS, BLOCK_PARAMS, NUM as K_NUM, OFFICE_PARAMS, PL as K_PL, SHOP_PARAMS, ST as K_ST, TERRACE_PARAMS,
  palette as kenneyPalette,
} from "./commercial.ts";
import { historic, specs as streetSpecs, streetPalette, type Style } from "./commercialStreets.ts";
import {
  CLADDING_COLOURS, COTTAGE_PARAMS, FAMILY_HOUSE_PARAMS, House, L_HOUSE_PARAMS, MODERN_HOUSE_PARAMS, NARROW_HOUSE_PARAMS,
  OH as V_OH, PL as V_PL, RT as V_RT, ROOF_COLOURS, WALL_COLOURS, floorY, knee, palette as villagePalette, volume,
  type RoofKind, type Volume,
} from "./village.ts";
import { TIMBER_COTTAGE_PARAMS, roofs as T_ROOFS, timbers as T_TIMBERS, walls as T_WALLS } from "./timberCottages.ts";
import { ACCENTS as A_ACCENTS, ALPINE_HUT_PARAMS, ROOFS as A_ROOFS, TIMBERS as A_TIMBERS, WALLS as A_WALLS } from "./alpineHut.ts";
import { HALT, PRAGUE, STUCCO, SUBURBAN } from "./stations.ts";
import { palette as fountainPalette } from "./fountains.ts";

/** An ordinary building's LOD budget (lodBudget in lod.ts); Prague main station has 500. */
const BUDGET = 100;

type XZ = readonly [number, number];
type XY = readonly [number, number];
/** A rectangle in plan: x0, x1, z0, z1. */
type Rect = readonly [number, number, number, number];

// --- generic solids -------------------------------------------------------------------------

/** The rectangle w x d about (cx, cz) as a ring; its edges run back (-z), right (+x), front (+z), left (-x). */
export function lodRect(cx: number, cz: number, w: number, d: number): Array<[number, number]> {
  return [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx + w / 2, cz + d / 2], [cx - w / 2, cz + d / 2]];
}

const bounds = (cx: number, cz: number, w: number, d: number): Rect => [cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2];

function centre(ring: readonly XZ[]): [number, number] {
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
export function lodBlock(m: MeshBuilder, ring: readonly XZ[], bands: readonly LodBand[], top: string, skip: readonly number[] = []): void {
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
function distinct(pts: readonly Vec3[]): Vec3[] {
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
function faceQuad(m: MeshBuilder, mat: string, at: (u: number, y: number) => Vec3, u0: number, u1: number, y0: number, y1: number, n: Vec3): void {
  lodPolygon(m, mat, [at(u0, y0), at(u1, y0), at(u1, y1), at(u0, y1)], n);
}

/** A thin post from y0 to y1 at (x, z): three walls, no top. */
function lodPost(m: MeshBuilder, mat: string, x: number, z: number, r: number, y0: number, y1: number): void {
  lodWalls(m, lodNgon(3, r, x, z, Math.PI / 2), [[y0, y1, mat]]);
}

/** A thin box from y0 to y1: walls and top. */
function lodBox(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, top = mat): void {
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
const part = (draw: (m: MeshBuilder) => void, rank?: number): LodPart => (rank === undefined ? { draw } : { draw, optional: rank });

/** Draws into `m` mirrored in x when mx is -1 (a design's `side` parameter). */
function mirror(m: MeshBuilder, mx: 1 | -1): MeshBuilder {
  if (mx === 1) return m;
  const f = (p: Vec3): Vec3 => [-p[0], p[1], p[2]];
  return { tri: (mat: string, a: Vec3, b: Vec3, c: Vec3) => m.tri(mat, f(a), f(c), f(b)) } as unknown as MeshBuilder;
}

function fit(palette: Record<string, MaterialSpec>, parts: LodPart[], budget = BUDGET, mx: 1 | -1 = 1): MeshBuilder {
  return fitLod({ palette, shells: [], parts: parts.map((p) => ({ ...p, draw: (m: MeshBuilder) => p.draw(mirror(m, mx)) })) }, budget);
}

// --- the commercial house kit (commercial.ts) ----------------------------------------------------

interface KFootprint { w: number; d: number; x: number; z: number }
/** A face of a footprint: the plane `axis` = `at`, facing `sign`; `len` and `mid` along it. */
interface KFace { axis: "x" | "z"; sign: 1 | -1; at: number; len: number; mid: number }

function kFaces(b: KFootprint): KFace[] {
  return [
    { axis: "z", sign: 1, at: b.z + b.d / 2, len: b.w, mid: b.x }, { axis: "x", sign: 1, at: b.x + b.w / 2, len: b.d, mid: b.z },
    { axis: "z", sign: -1, at: b.z - b.d / 2, len: b.w, mid: b.x }, { axis: "x", sign: -1, at: b.x - b.w / 2, len: b.d, mid: b.z },
  ];
}
const kPoint = (f: KFace, u: number, y: number, off: number): Vec3 => (f.axis === "z" ? [u, y, f.at + f.sign * off] : [f.at + f.sign * off, y, u]);
const kNormal = (f: KFace, up = 0): Vec3 => (f.axis === "z" ? [0, up, f.sign] : [f.sign, up, 0]);

/** A storey stack: walls from y0 to the roof at `top` in the kit's bands, the parapet and the flat roof. */
function kenneyMass(m: MeshBuilder, b: KFootprint, bands: LodBand[], top: number): void {
  lodWalls(m, lodRect(b.x, b.z, b.w, b.d), [...bands, [top, top + 0.7, "trim"]]);
  lodParapet(m, bounds(b.x, b.z, b.w, b.d), top + 0.22, top + 0.7, 0.28, "roof", "trim");
}

/** The floor belt over storey `level` (a proud ring, no top). */
function kenneyBelt(b: KFootprint, level: number, rank: number): LodPart {
  const y = K_PL + level * K_ST;
  return part((m) => lodWalls(m, lodRect(b.x, b.z, b.w + 0.22, b.d + 0.22), [[y + K_ST - 0.2, y + K_ST + 0.02, "trim"]]), rank);
}

/** The shop canopies along the faces' ground floor: a sloping awning with its valance, or a sign fascia. */
function kenneyShops(b: KFootprint, frontage: string, corner: boolean): LodPart {
  return part((m) => {
    for (const f of kFaces(b).slice(0, corner ? 2 : 1)) {
      const u0 = f.mid - (f.len - 0.8) / 2 + 0.1, u1 = f.mid + (f.len - 0.8) / 2 - 0.1;
      if (frontage === "sign") {
        faceQuad(m, "accent", (u, y) => kPoint(f, u, y, 0.27), u0, u1, K_PL + 2.47, K_PL + 2.83, kNormal(f));
        lodPolygon(m, "accent", [kPoint(f, u0, K_PL + 2.83, 0.04), kPoint(f, u1, K_PL + 2.83, 0.04), kPoint(f, u1, K_PL + 2.83, 0.27), kPoint(f, u0, K_PL + 2.83, 0.27)], [0, 1, 0]);
      } else {
        lodPolygon(m, "accent", [kPoint(f, u0, K_PL + 2.82, 0.04), kPoint(f, u1, K_PL + 2.82, 0.04), kPoint(f, u1, K_PL + 2.55, 0.96), kPoint(f, u0, K_PL + 2.55, 0.96)], kNormal(f, 3));
        faceQuad(m, "accent", (u, y) => kPoint(f, u, y, 0.96), u0, u1, K_PL + 2.38, K_PL + 2.55, kNormal(f));
      }
    }
  });
}

/** The roof's use on a flat roof at y: a plant box, or planters and a pergola. */
function kenneyRoofUse(b: KFootprint, y: number, use: string, rank: number): LodPart[] {
  if (use === "plant") return [part((m) => lodBox(m, "metal", b.x + 1.1, b.z - 0.7, 2, 1.45, y + 0.22, y + 0.85), rank)];
  if (use !== "garden") return [];
  return [
    part((m) => { for (const s of [-1, 1]) lodBox(m, "planter", b.x + s * (b.w / 2 - 1.2), b.z + b.d / 2 - 1.2, 1.7, 0.75, y + 0.22, y + 0.9, "foliage"); }, rank),
    part((m) => {
      lodBox(m, "timber", b.x, b.z, 3.55, 2.7, y + 2.48, y + 2.73);
      for (const x of [-1.4, 1.4]) for (const z of [-1.1, 1.1]) lodPost(m, "timber", b.x + x, b.z + z, 0.1, y + 0.22, y + 2.48);
    }, rank - 0.5),
  ];
}

function kenneyUpright(specs: readonly ParamSpec[], given: ParamValues | undefined, kind: "shop" | "balcony" | "block" | "office"): MeshBuilder {
  const p = resolveParams(specs, given);
  const floors = K_NUM[p.storeys!]!;
  const bays = kind === "block" ? K_NUM[p.bays!]! : p.width === "broad" ? 3 : 2;
  const b: KFootprint = { w: bays * 3.25 + 0.8, d: kind === "office" ? 9.6 : 8.4, x: 0, z: 0 };
  const top = K_PL + floors * K_ST;
  const parts: LodPart[] = [
    // the ground floor is dark (trim), the upper storeys the wall colour
    part((m) => kenneyMass(m, b, [[0, K_PL + K_ST, "trim"], [K_PL + K_ST, top, "wall"]], top)),
    kenneyShops(b, kind === "office" || kind === "balcony" ? "awning" : p.frontage!, kind === "shop"),
    ...kenneyRoofUse(b, top, p.roof!, 2),
  ];
  for (let level = 1; level < floors - 1; level++) parts.push(kenneyBelt(b, level, 1 - level / 20));
  if (kind === "balcony") {
    const pitch = (b.w - 0.8) / bays;
    const gallery = p.balconies === "gallery";
    for (let level = 1; level < floors; level++) {
      const y = K_PL + level * K_ST + 0.18, z = b.z + b.d / 2;
      parts.push(part((m) => {
        for (let i = 0; i < (gallery ? 1 : bays); i++) {
          const w = gallery ? b.w - 0.65 : pitch - 0.45;
          const x = gallery ? b.x : b.x + (i - (bays - 1) / 2) * pitch;
          lodCap(m, "stone", lodRect(x, z + 0.68, w + 0.12, 1.36), y);
          faceQuad(m, "metal", (u, yy) => [u, yy, z + 1.36], x - w / 2 - 0.06, x + w / 2 + 0.06, y - 0.17, y + 1.05, [0, 0, 1]);
        }
      }, 5 - level / 10));
    }
  }
  return fit(kenneyPalette(p), parts);
}

export function cornerShopLod(p?: ParamValues): MeshBuilder { return kenneyUpright(SHOP_PARAMS, p, "shop"); }
export function balconyHouseLod(p?: ParamValues): MeshBuilder { return kenneyUpright(BALCONY_PARAMS, p, "balcony"); }
export function marketBlockLod(p?: ParamValues): MeshBuilder { return kenneyUpright(BLOCK_PARAMS, p, "block"); }
export function officeHouseLod(p?: ParamValues): MeshBuilder { return kenneyUpright(OFFICE_PARAMS, p, "office"); }

/** The terraced house: a lower stack whose roof is a terrace, the top two storeys set back. */
export function terraceHouseLod(given?: ParamValues): MeshBuilder {
  const p = resolveParams(TERRACE_PARAMS, given);
  const floors = K_NUM[p.storeys!]!;
  const corner = p.setback === "corner";
  const lower: KFootprint = { w: 12.4, d: 10.2, x: 0, z: 0 };
  const upper: KFootprint = { w: corner ? 8 : lower.w, d: 6.6, x: corner ? -2.2 : 0, z: -1.8 };
  const terraceY = K_PL + (floors - 2) * K_ST + 0.12;
  const top = K_PL + floors * K_ST;
  const parts: LodPart[] = [
    part((m) => {
      lodBlock(m, lodRect(lower.x, lower.z, lower.w, lower.d),
        [[0, K_PL + K_ST, "trim"], [K_PL + K_ST, terraceY - 0.32, "wall"], [terraceY - 0.32, terraceY, "trim"]], "stone");
      kenneyMass(m, upper, [[terraceY, top, "wall"]], top);
    }),
    kenneyShops(lower, p.frontage!, true),
    // the terrace railings: along the front, and around the corner terrace
    part((m) => {
      const y0 = terraceY + 0.02, y1 = terraceY + 1.07;
      lodWalls(m, [[-6, 1.75], [6, 1.75], [6, 4.95], [-6, 4.95]], [[y0, y1, "metal"]], [0]);
      if (corner) lodWalls(m, [[2, -4.85], [6.2, -4.85], [6.2, 1.25], [2, 1.25]], [[y0, y1, "metal"]], [0]);
    }, 4),
    ...kenneyRoofUse(upper, top, p.roof === "garden" ? "garden" : "plant", 2),
  ];
  for (let level = 1; level < floors - 1; level++) if (level !== floors - 3) parts.push(kenneyBelt(level >= floors - 2 ? upper : lower, level, 1 - level / 20));
  if (p.roof === "garden") {
    parts.push(part((m) => { for (const x of [-4.5, 4.5]) lodBox(m, "planter", x, 4.4, 1.7, 0.75, terraceY, terraceY + 0.7, "foliage"); }, 3));
  } else {
    parts.push(part((m) => { for (let i = 0; i < 3; i++) lodBox(m, "solar", -3.6 + i * 3.6, 3.4, 2.7, 1.7, terraceY, terraceY + 0.4); }, 3));
  }
  return fit(kenneyPalette(p), parts);
}

// --- the commercial street kit (commercialStreets.ts) ---------------------------------------------

function streetLod(s: Style, given?: ParamValues): MeshBuilder {
  const p = resolveParams(streetSpecs(s), given);
  const n = Number(p.storeys), bays = p.width === "narrow" ? 2 : p.width === "wide" ? 5 : p.width === "extraWide" ? 8 : 3;
  const w = bays * 2.7, d = historic(s) ? 9 : 8, floor = 3.2, h = n * floor + 0.45;
  const roof = p.roof === "pitched" ? "terrace" : s;
  const flat = !["terrace", "gable", "classical", "barrel"].includes(roof);
  const parts: LodPart[] = [];
  // the walls on a stone plinth; a flat roof's parapet stands out over the cornice
  parts.push(part((m) => {
    lodWalls(m, lodRect(0, 0, w, d), [[0, 0.45, "stone"], [0.45, h, "wall"]]);
    if (flat) {
      lodWalls(m, lodRect(0, 0, w + 0.5, d + 0.5), [[h, h + 0.7, "trim"]]);
      lodCap(m, "trim", lodRect(0, 0, w + 0.5, d + 0.5), h, false);
      lodParapet(m, bounds(0, 0, w + 0.5, d + 0.5), h + 0.33, h + 0.7, 0.3, "roof", "trim");
    } else {
      lodWalls(m, lodRect(0, 0, w + 0.5, d + 0.5), [[h, h + 0.26, "trim"]]);
      lodCap(m, "trim", lodRect(0, 0, w + 0.5, d + 0.5), h, false);
    }
  }));
  for (let f = 1; f < n; f++) {
    const y = 0.45 + f * floor;
    parts.push(part((m) => lodWalls(m, lodRect(0, 0, w + 0.22, d + 0.22), [[y - 0.19, y, "trim"]]), 1 - f / 20));
  }
  // the roof
  if (roof === "terrace" || roof === "gable" || roof === "classical") {
    const rise = roof === "classical" ? 2.1 : 3.2;
    const rw = roof === "classical" ? w * 0.65 : w + 0.65;
    parts.push(part((m) => lodFrustum(m, "roof", bounds(0, 0, w + 0.65, d + 0.65), h + 0.26, bounds(0, 0, rw, 0.08), h + rise)));
    if (roof !== "classical") {
      parts.push(part((m) => {
        for (const x of [-w * 0.26, w * 0.26]) {
          const z = d * 0.24;
          lodWalls(m, lodRect(x, z, 1.5, 1.4), [[h + 1.2, h + 2.25, "wall"]], [0]);
          lodFrustum(m, "roof", bounds(x, z, 1.8, 1.65), h + 2.26, bounds(x, z, 0.08, 1.65), h + 2.9, null);
        }
      }, 3));
    }
  } else if (roof === "barrel") {
    parts.push(part((m) => {
      const sec: XY[] = [[-w / 2 - 0.2, h + 0.26]];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI - (i * Math.PI) / 8;
        sec.push([Math.cos(a) * (w / 2 + 0.2), h + 0.3 + Math.sin(a) * 3]);
      }
      sec.push([w / 2 + 0.2, h + 0.26]);
      lodPlate(m, "roof", sec, -d / 2 - 0.25, d / 2 + 0.25);
    }));
  } else {
    parts.push(part((m) => { for (const x of [-w * 0.24, w * 0.24]) lodBox(m, "metal", x, -d * 0.2, 1.5, 1.25, h + 0.33, h + 0.96); }, 2));
  }
  if (historic(s)) parts.push(part((m) => lodBox(m, "wall", -w * 0.34, -d * 0.23, 0.85, 0.8, h + 0.35, h + 3.8, "trim"), 4));
  // the shop canopies, the balconies and the sign board on the street front
  const shop = ["modern", "shop", "annex", "balcony"].includes(s);
  if (shop && p.awning !== "none") {
    parts.push(part((m) => {
      const x0 = -w / 2 + 0.125, x1 = w / 2 - 0.125, z = d / 2;
      lodCap(m, "awning", [[x0, z], [x1, z], [x1, z + 1.3], [x0, z + 1.3]], 3.35);
      lodWalls(m, [[x0, z], [x1, z], [x1, z + 1.3], [x0, z + 1.3]], [[2.95, 3.35, "awning"]], [0]);
    }));
  }
  const balconyRows = s === "balcony" ? [[0, bays]] : s === "tenement" ? Array.from({ length: Math.ceil(bays / 2) }, (_, k) => [2 * k, 2 * k + 1]) : [];
  for (let f = 1; f < n && balconyRows.length; f++) {
    const y = 0.45 + f * floor + 0.4;
    parts.push(part((m) => {
      for (const [i0, i1] of balconyRows) {
        const x0 = -w / 2 + i0! * 2.7 + 0.3, x1 = -w / 2 + i1! * 2.7 - 0.3, z = d / 2;
        lodCap(m, "trim", [[x0, z], [x1, z], [x1, z + 1.4], [x0, z + 1.4]], y - 0.08);
        faceQuad(m, "trim", (u, yy) => [u, yy, z + 1.4], x0, x1, y - 0.24, y + 0.92, [0, 0, 1]);
      }
    }, 5 - f / 10));
  }
  if (p.sign === "board") {
    parts.push(part((m) => {
      const bw = Math.min(w - 1, 4.8) / 2;
      faceQuad(m, "door", (u, y) => [u, y, d / 2 + 0.43], -bw, bw, 3.06, 3.48, [0, 0, 1]);
      lodCap(m, "door", [[-bw, d / 2], [bw, d / 2], [bw, d / 2 + 0.43], [-bw, d / 2 + 0.43]], 3.48);
    }, 6));
  }
  if (s === "annex") {
    parts.push(part((m) => {
      const x = w / 2 + 2.2;
      lodWalls(m, lodRect(x, -1, 4.4, 6), [[0.05, 3.56, "wall"]], [3]);
      lodBox(m, "roof", x, -1, 4.65, 6.25, 3.56, 3.85);
    }));
  }
  if (s === "baroque") {
    // the layered curved gable, in two convex pieces
    const widths = [0.86, 0.84, 0.75, 0.60, 0.49, 0.45, 0.43, 0.40, 0.30, 0.14];
    const pts = widths.map((k, i): [number, number] => [w * k / 2 + 0.14, h + 0.3 + i * 0.3]);
    const piece = (from: number, to: number): XY[] => lodHull(pts.slice(from, to + 1).flatMap(([x, y]) => [[x, y], [-x, y]] as XY[]));
    parts.push(part((m) => {
      lodPlate(m, "wall", piece(0, 4), d / 2 - 0.34, d / 2 + 0.31);
      lodPlate(m, "wall", piece(4, 9), d / 2 - 0.34, d / 2 + 0.31);
    }));
  }
  if (s === "gable") {
    // the stepped street gable: each step's face, its trim top and its ends
    const widths = [0.8, 0.65, 0.5, 0.35, 0.2];
    parts.push(part((m) => {
      widths.forEach((k, i) => {
        const hw = (w * k) / 2, y0 = h + 0.3 + i * 0.48, y1 = y0 + 0.48, z0 = d / 2 - 0.325, z1 = d / 2 + 0.165;
        faceQuad(m, "wall", (u, y) => [u, y, z1], -hw, hw, y0, y1, [0, 0, 1]);
        lodCap(m, "trim", [[-hw, z0], [hw, z0], [hw, z1], [-hw, z1]], y1);
        for (const sx of [-1, 1]) lodPolygon(m, "wall", [[sx * hw, y0, z0], [sx * hw, y0, z1], [sx * hw, y1, z1], [sx * hw, y1, z0]], [sx, 0, 0]);
      });
    }));
  }
  return fit(streetPalette(s, p), parts);
}

export function commercialModernLod(p?: ParamValues): MeshBuilder { return streetLod("modern", p); }
export function commercialBalconyLod(p?: ParamValues): MeshBuilder { return streetLod("balcony", p); }
export function commercialAnnexLod(p?: ParamValues): MeshBuilder { return streetLod("annex", p); }
export function commercialBrickLod(p?: ParamValues): MeshBuilder { return streetLod("brick", p); }
export function commercialTenementLod(p?: ParamValues): MeshBuilder { return streetLod("tenement", p); }
export function commercialShopLod(p?: ParamValues): MeshBuilder { return streetLod("shop", p); }
export function commercialBarrelLod(p?: ParamValues): MeshBuilder { return streetLod("barrel", p); }
export function commercialTerraceLod(p?: ParamValues): MeshBuilder { return streetLod("terrace", p); }
export function commercialGableLod(p?: ParamValues): MeshBuilder { return streetLod("gable", p); }
export function commercialBaroqueLod(p?: ParamValues): MeshBuilder { return streetLod("baroque", p); }
export function commercialClassicalLod(p?: ParamValues): MeshBuilder { return streetLod("classical", p); }

// --- the village house kit (village.ts) -------------------------------------------------------------

/** A village wall face, as House.faces gives it: the plane `axis` = `at`, facing `s`. */
interface VFace { axis: "x" | "z"; s: 1 | -1; at: number }

function vFaces(vol: Volume): { front: VFace; back: VFace; right: VFace; left: VFace } {
  return {
    front: { axis: "z", s: 1, at: vol.cz + vol.d / 2 }, back: { axis: "z", s: -1, at: vol.cz - vol.d / 2 },
    right: { axis: "x", s: 1, at: vol.cx + vol.w / 2 }, left: { axis: "x", s: -1, at: vol.cx - vol.w / 2 },
  };
}
const vPoint = (f: VFace, u: number, y: number, off: number): Vec3 => (f.axis === "x" ? [f.at + f.s * off, y, u] : [u, y, f.at + f.s * off]);
const vNormal = (f: VFace): Vec3 => (f.axis === "x" ? [f.s, 0, 0] : [0, 0, f.s]);

/** A volume of the House kit: its walls on the dark plinth and its roof; `skip` leaves out walls against another block. */
function vVolume(vol: Volume, skip: number[] = []): LodPart {
  return part((m) => {
    const wall = vol.wallMat ?? "wall";
    lodWalls(m, lodRect(vol.cx, vol.cz, vol.w, vol.d), [[0, V_PL, "trim"], [V_PL, vol.eave, wall]], skip);
    vRoof(m, vol);
  });
}

function vRoof(m: MeshBuilder, vol: Volume): void {
  const t = V_RT * Math.hypot(1, vol.pitch);
  if (vol.roof === "gable") {
    lodGable(m, { cx: vol.cx, cz: vol.cz, w: vol.w, d: vol.d, axis: vol.axis, eave: vol.eave, pitch: vol.pitch, oh: V_OH, t, roof: "roof", gable: vol.wallMat ?? "wall", gables: vol.gables });
  } else if (vol.roof === "hip") {
    lodHip(m, { cx: vol.cx, cz: vol.cz, w: vol.w, d: vol.d, eave: vol.eave, pitch: vol.pitch, oh: V_OH, t, roof: "roof" });
  } else if (vol.roof === "flat") {
    const r = lodRect(vol.cx, vol.cz, vol.w + 0.4, vol.d + 0.4);
    lodWalls(m, r, [[vol.eave, vol.eave + 0.6, "trim"]]);
    lodCap(m, "trim", r, vol.eave, false);
    lodParapet(m, bounds(vol.cx, vol.cz, vol.w + 0.4, vol.d + 0.4), vol.eave + 0.3, vol.eave + 0.6, 0.3, "trim", "trim");
  }
}

/** The floor bands of a volume, proud rings. */
function vBands(vol: Volume, rank: number): LodPart | null {
  if (!vol.bands.length) return null;
  return part((m) => { for (const y of vol.bands) lodWalls(m, lodRect(vol.cx, vol.cz, vol.w + 0.16, vol.d + 0.16), [[y, y + 0.22, "trim"]]); }, rank);
}

const roofTopOf = (vol: Volume, x: number, z: number): number => new House({}).roofTop(vol, x, z);

/** A brick chimney through a pitched roof at (x, z), as House.chimney. */
function vChimney(vol: Volume, x: number, z: number, rank?: number): LodPart {
  const corners = [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([dx, dz]) => roofTopOf(vol, x + dx!, z + dz!));
  const top = Math.max(...corners) + 0.9;
  return part((m) => lodBox(m, "stone", x, z, 0.8, 0.8, Math.min(...corners) - 0.1, top + 0.18, "trim"), rank);
}

/** A dormer on the front slope of a roof whose ridge runs along x, as House.dormer. */
function vDormer(vol: Volume, x: number, w = 1.4): (m: MeshBuilder) => void {
  const zf = vol.cz + (vol.d / 2) * 0.72;
  const yR = roofTopOf(vol, x, zf);
  const dorm: Volume = { cx: x, cz: zf - 1.0, w, d: 2.0, eave: yR + 1.25, roof: "gable", axis: "z", pitch: 0.5, bands: [], gables: [false, true], gutters: false };
  return (m) => {
    lodWalls(m, lodRect(dorm.cx, dorm.cz, dorm.w, dorm.d), [[yR - 0.6, dorm.eave, "wall"]], [0]);
    vRoof(m, dorm);
  };
}

/** A shed canopy over a door, and for a porch its deck and two posts, as House.canopy. */
function vCanopy(f: VFace, u: number, width: number, depth: number, y: number, posts: boolean, rank?: number): LodPart[] {
  const drop = 0.25 * depth, th = 0.16, u0 = u - width / 2, u1 = u + width / 2;
  const out: LodPart[] = [part((m) => {
    const up: Vec3 = f.axis === "x" ? [f.s * drop, depth, 0] : [0, depth, f.s * drop];
    lodPolygon(m, "roof", [vPoint(f, u0, y + th, -0.1), vPoint(f, u1, y + th, -0.1), vPoint(f, u1, y + th - drop, depth), vPoint(f, u0, y + th - drop, depth)], up);
    faceQuad(m, "roof", (uu, yy) => vPoint(f, uu, yy, depth), u0, u1, y - drop, y + th - drop, vNormal(f));
  }, rank)];
  if (posts) {
    out.push(part((m) => {
      for (const pu of [u0 + 0.2, u1 - 0.2]) {
        const c = vPoint(f, pu, 0, depth - 0.2);
        lodPost(m, "metal", c[0], c[2], 0.1, 0.34, y - drop + 0.1);
      }
      const a = vPoint(f, u0 + 0.05, 0, 0), b = vPoint(f, u1 - 0.05, 0, depth);
      lodBox(m, "trim", (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 0, 0.34);
    }, (rank ?? 6) - 0.5));
  }
  return out;
}

/** A planter box in front of a face with its bushes as one green top, as House.planter. */
function vPlanter(f: VFace, u: number, len: number, rank: number): LodPart {
  const a = vPoint(f, u - len / 2, 0, 0.3), b = vPoint(f, u + len / 2, 0, 1.0);
  return part((m) => lodBox(m, "planter", (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 0, 0.85, "bush"), rank);
}

/** A front door, its leaf a flat panel on the wall. */
function vDoor(f: VFace, u: number, mat = "door", rank = 0.5): LodPart {
  return part((m) => faceQuad(m, mat, (uu, y) => vPoint(f, uu, y, 0.1), u - 0.55, u + 0.55, V_PL, V_PL + 2.2, vNormal(f)), rank);
}

/** Solar panels lying on the slope of a pitched roof over x0..x1, z0..z1, as House.solar. */
function vSolar(vol: Volume, x0: number, x1: number, z0: number, z1: number): LodPart {
  return part((m) => {
    const pt = (x: number, z: number): Vec3 => [x, roofTopOf(vol, x, z) + 0.14, z];
    const pts = [pt(x0, z0), pt(x1, z0), pt(x1, z1), pt(x0, z1)];
    lodPolygon(m, "solar", pts, [0, 1, 0]);
  }, 5);
}

function villageFit(pal: Record<string, MaterialSpec>, parts: Array<LodPart | null>, mx: 1 | -1 = 1): MeshBuilder {
  return fit(pal, parts.filter((p): p is LodPart => p !== null), BUDGET, mx);
}

export function villageCottageLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(COTTAGE_PARAMS, params);
  const storeys = p.storeys === "two" ? 2 : 1;
  const main = volume(0, 0, 9, 7, storeys, p.roofShape === "hip" ? "hip" : "gable", "x");
  main.eave += knee(storeys);
  const f = vFaces(main);
  const parts: Array<LodPart | null> = [vVolume(main), vBands(main, 1), vDoor(f.front, -1.2)];
  if (p.entrance === "canopy") parts.push(...vCanopy(f.front, -1.2, 2.0, 1.1, V_PL + 2.65, false));
  if (p.entrance === "porch") parts.push(...vCanopy(f.front, -1.2, 2.6, 2.0, V_PL + 2.75, true));
  if (p.entrance === "garden") parts.push(vPlanter(f.front, 2.3, 2.6, 2), vPlanter(f.right, -1.2, 2.2, 1.5));
  if (p.dormers === "dormers") {
    parts.push(main.roof === "gable" ? part((m) => { vDormer(main, -2.2)(m); vDormer(main, 2.3)(m); }) : part(vDormer(main, 0, 1.3)));
  }
  if (p.chimney === "brick") parts.push(vChimney(main, -2.6, -1.0));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts);
}

export function villageLHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(L_HOUSE_PARAMS, params);
  const storeys = p.storeys === "two" ? 2 : 1;
  const shape: RoofKind = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(0, -1.5, 10, 7, storeys, shape, "x");
  main.eave += knee(storeys);
  const wing: Volume = { ...volume(1.9, 1.5, 4.6, 6, storeys, shape, "z"), gables: [false, true] };
  wing.eave += knee(storeys);
  const fm = vFaces(main), fw = vFaces(wing);
  const parts: Array<LodPart | null> = [
    vVolume(main), vVolume(wing, [0]), vBands(main, 1), vBands(wing, 0.9), vDoor(fm.front, -1.6),
    ...vCanopy(fm.front, -1.6, 2.0, 1.0, V_PL + 2.65, false, 3), vChimney(main, -2.2, -3.0, 4),
  ];
  if (p.extras === "planters") parts.push(vPlanter(fm.front, -3.6, 1.8, 2), vPlanter(fw.left, 3.65, 1.5, 1.5));
  if (p.extras === "solar") parts.push(shape === "gable" ? vSolar(main, -4.4, -0.9, -1.0, 1.4) : vSolar(main, -2.2, -0.9, -0.5, 1.4));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts, p.side === "left" ? -1 : 1);
}

export function villageFamilyHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(FAMILY_HOUSE_PARAMS, params);
  const shape: RoofKind = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(-1.5, 0, 8, 8, 2, shape, "x", 0.85);
  const annexRoof: RoofKind = p.annex === "terrace" ? "flat" : p.annex === "garage" ? "gable" : shape;
  const annex: Volume = { ...volume(4.75, -0.5, 4.5, 6.5, 1, annexRoof, "z", 0.6), eave: p.annex === "garage" ? V_PL + 2.6 : floorY(1) - 0.11, open: ["left"] };
  const fm = vFaces(main), fa = vFaces(annex);
  const parts: Array<LodPart | null> = [
    vVolume(main), vVolume(annex, [3]), vBands(main, 1), vDoor(fm.front, -2.6),
    ...vCanopy(fm.front, -2.6, 2.4, 1.6, V_PL + 2.7, true, 4),
  ];
  if (p.annex === "garage") {
    parts.push(part((m) => faceQuad(m, "garageDoor", (u, y) => vPoint(fa.front, u, y, 0.36), annex.cx - 1.3, annex.cx + 1.3, 0.04, 2.3, vNormal(fa.front)), 6));
  } else {
    parts.push(vPlanter(fa.front, annex.cx, 2.6, 2));
  }
  if (p.annex === "terrace") {
    parts.push(part((m) => {
      const y = annex.eave + 0.6;
      lodWalls(m, lodRect(annex.cx + 0.05, annex.cz, annex.w + 0.1, annex.d + 0.1), [[y, y + 0.9, "metal"]], [3]);
    }, 3));
  }
  if (p.chimney === "brick") parts.push(vChimney(main, -3.2, -1.4));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts, p.side === "left" ? -1 : 1);
}

export function villageModernHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(MODERN_HOUSE_PARAMS, params);
  const two = p.storeys === "two";
  // under an upper storey the ground floor's walls stop at its floor band
  const ground: Volume = { ...volume(0, -0.8, 10, 7.4, 1, two ? "none" : "flat", "x"), bands: [], ...(two ? { eave: floorY(1) - 0.11 } : {}) };
  const upper: Volume = { ...volume(0.25, 0, 10.5, 9, 1, "flat", "x"), eave: floorY(2), bands: [], wallMat: "cladding" };
  const fg = vFaces(ground);
  const roofY = (two ? upper.eave : ground.eave) + 0.3;
  const parts: Array<LodPart | null> = [vVolume(ground)];
  if (two) {
    parts.push(part((m) => {
      const r = lodRect(upper.cx, upper.cz, upper.w, upper.d);
      lodWalls(m, r, [[floorY(1) - 0.11, floorY(1) + 0.15, "trim"], [floorY(1) + 0.15, upper.eave, "cladding"]]);
      lodCap(m, "trim", r, floorY(1) - 0.11, false);
      vRoof(m, upper);
    }));
    parts.push(part((m) => { for (const x of [-4.5, 5.0]) lodPost(m, "metal", x, 3.9, 0.16, V_PL - 0.1, floorY(1) - 0.11); }, 4));
  } else {
    // the clad entrance block standing out of the front
    parts.push(part((m) => lodWalls(m, lodRect(-2.8, fg.front.at + 0.42, 2.4, 1.24), [[0, ground.eave + 0.75, "cladding"]], [0]) ));
    parts.push(part((m) => lodCap(m, "cladding", lodRect(-2.8, fg.front.at + 0.42, 2.4, 1.24), ground.eave + 0.75)));
  }
  parts.push(part((m) => lodBox(m, "stone", 4.2, 2.0, 0.7, 0.7, roofY - 0.1, roofY + 0.55, "trim"), 1));
  if (p.annex === "carport") {
    parts.push(part((m) => {
      const y = V_PL + 2.55;
      // (from the ground floor's side wall out)
      lodBox(m, "trim", 7.4, -0.3, 4.8, 6.4, y, y + 0.25);
      lodCap(m, "trim", lodRect(7.4, -0.3, 4.8, 6.4), y, false);
    }));
    parts.push(part((m) => { for (const [x, z] of [[9.5, 2.6], [9.5, -3.2]] as const) lodPost(m, "metal", x, z, 0.14, 0, V_PL + 2.55); }, 4));
  }
  if (p.annex === "wing") parts.push(vVolume({ ...volume(-7.4, -1.6, 4.8, 5.8, 1, "flat", "x"), eave: V_PL + 2.8, bands: [] }, [1]));
  if (p.solar === "panels") {
    parts.push(part((m) => {
      for (const z of [-2.6, 0.6]) for (const x of [-2.7, 1.5]) {
        lodPolygon(m, "solar", [[x - 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.25, z + 0.6], [x - 1.9, roofY + 0.25, z + 0.6]], [0, 1.6, 0.7]);
      }
    }, 5));
  }
  return villageFit(villagePalette(ROOF_COLOURS.slate!, WALL_COLOURS[p.walls!]!, CLADDING_COLOURS[p.cladding!]!), parts);
}

export function villageNarrowHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(NARROW_HOUSE_PARAMS, params);
  const storeys = p.storeys === "three" ? 3 : 2;
  const main = volume(0, 0, 6.2, 8.5, storeys, "gable", "z", 1.05);
  const f = vFaces(main);
  const top = storeys - 1;
  const balcony = p.balcony === "balcony";
  const parts: Array<LodPart | null> = [vVolume(main), vBands(main, 1), vDoor(f.front, -1.4), vChimney(main, 1.2, -2.2, 4)];
  if (p.entrance === "canopy") parts.push(...vCanopy(f.front, -1.4, 1.9, 1.0, V_PL + 2.6, false));
  if (p.entrance === "porch") parts.push(...vCanopy(f.front, -0.4, 5.0, 2.0, V_PL + 2.7, true));
  if (p.entrance !== "porch") parts.push(vPlanter(f.front, 1.5, 2.0, 2));
  if (balcony) {
    parts.push(part((m) => {
      const y = floorY(top) - 0.11, z0 = f.front.at;
      lodBox(m, "trim", 0, z0 + 0.7, 5.2, 1.4, y - 0.2, y + 0.11);
      lodWalls(m, [[-2.55, z0 + 0.1], [2.55, z0 + 0.1], [2.55, z0 + 1.35], [-2.55, z0 + 1.35]], [[y + 0.11, y + 1.11, "metal"]], [0]);
    }));
  }
  if (p.shutters === "shutters") {
    // the shutters beside the front windows, in the roof's colour
    parts.push(part((m) => {
      for (let s = 0; s < storeys; s++) {
        const us = s === 0 ? [1.4] : s === top && balcony ? [1.4] : [-1.4, 1.4];
        const y0 = floorY(s) + 0.85;
        for (const u of us) for (const side of [-1, 1]) {
          const su = u + side * (0.65 + 0.15 + 0.273);
          faceQuad(m, "shutter", (uu, y) => vPoint(f.front, uu, y, 0.06), su - 0.273, su + 0.273, y0 - 0.1, y0 + 1.55, vNormal(f.front));
        }
      }
    }, 3));
  }
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts);
}

// --- the timber cottages (timberCottages.ts) -----------------------------------------------------

function timberLod(tall: boolean, values?: ParamValues): MeshBuilder {
  const p = resolveParams(TIMBER_COTTAGE_PARAMS, values);
  const pal: Record<string, MaterialSpec> = {
    tile: { color: T_ROOFS[p.roof!]! }, plaster: { color: T_WALLS[p.walls!]! }, timber: { color: T_TIMBERS[p.timber!]! },
    stone: { color: "#989a91" }, quoin: { color: "#b9bbae" }, door: { color: "#ad8b55" },
  };
  const w = tall ? 7.8 : 7, d = tall ? 8.6 : 6.6;
  const eave = tall ? 6.2 : 3.5, pitch = p.pitch === "steep" ? 1.12 : 0.85;
  const ridge = eave + (w / 2) * pitch;
  const roofY = (x: number) => ridge - Math.abs(x) * pitch;
  const base = tall ? 2.95 : 0.55, bottom = tall ? 3.02 : 0.6;
  const parts: LodPart[] = [
    // stone base, the sill beam and the wall plate of the frame, plaster between
    part((m) => {
      lodWalls(m, lodRect(0, 0, w, d), [[0, base, "stone"], [base, bottom + 0.22, "timber"], [bottom + 0.22, eave - 0.25, "plaster"], [eave - 0.25, eave, "timber"]]);
      lodGable(m, { cx: 0, cz: 0, w, d, axis: "z", eave, pitch, oh: 0.6, ends: [0.48, 0.48], t: 0.42, top: eave + 0.23, roof: "tile", edge: "timber", gable: "plaster" });
    }),
    // the ridge beam
    part((m) => lodBox(m, "timber", 0, 0, 0.34, d + 1.55, ridge + 0.1, ridge + 0.52), 3),
    // the framing posts on the four faces, and the braces of a braced frame
    part((m) => {
      for (const s of [-1, 1]) {
        for (const x of [-w / 2 + 0.12, 0, w / 2 - 0.12]) faceQuad(m, "timber", (u, y) => [u, y, s * (d / 2 + 0.2)], x - 0.11, x + 0.11, bottom + 0.22, eave - 0.25, [0, 0, s]);
        for (const z of [-d / 2 + 0.12, 0, d / 2 - 0.12]) faceQuad(m, "timber", (u, y) => [s * (w / 2 + 0.19), y, u], z - 0.11, z + 0.11, bottom + 0.22, eave - 0.25, [s, 0, 0]);
      }
    }, 1),
    part((m) => {
      for (const s of [-1, 1]) {
        const z = s * (d / 2 + 0.24);
        // the king post up the gable
        faceQuad(m, "timber", (u, y) => [u, y, z], -0.11, 0.11, eave + 0.03, ridge - 0.22, [0, 0, s]);
        if (p.framing === "braced") for (const x of [-1, 1]) {
          const a: XY = [x * (w / 2 - 0.35), bottom + 0.35], b: XY = [x * (w / 2 - 1.2), bottom + 1.05];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (-(b[1] - a[1]) / len) * 0.09, ny = ((b[0] - a[0]) / len) * 0.09;
          lodPolygon(m, "timber", [[a[0] + nx, a[1] + ny, z], [b[0] + nx, b[1] + ny, z], [b[0] - nx, b[1] - ny, z], [a[0] - nx, a[1] - ny, z]], [0, 0, s]);
        }
      }
    }, 2),
    part((m) => faceQuad(m, "door", (u, y) => [u, y, d / 2 + 0.3], -0.81, 0.81, 0.36, 2.66, [0, 0, 1]), 4),
  ];
  if (p.entrance !== "step") {
    const reach = p.entrance === "porch" ? 1.9 : 1.05, z = d / 2;
    parts.push(part((m) => {
      lodPolygon(m, "tile", [[-1.3, 2.95, z], [1.3, 2.95, z], [1.3, 2.63, z + reach], [-1.3, 2.63, z + reach]], [0, reach, 0.32]);
      faceQuad(m, "tile", (u, y) => [u, y, z + reach], -1.3, 1.3, 2.47, 2.63, [0, 0, 1]);
    }, 5));
    if (p.entrance === "porch") {
      parts.push(part((m) => {
        for (const x of [-1.13, 1.13]) lodPost(m, "timber", x, z + reach - 0.16, 0.12, 0.16, 2.47);
        lodBox(m, "stone", 0, z + 1.0, 2.75, 2.2, 0, 0.16);
      }, 4.5));
    }
  } else {
    parts.push(part((m) => lodBox(m, "stone", 0, d / 2 + 0.55, 2.1, 1.0, 0, 0.28), 0.5));
  }
  if (p.chimney === "stone") {
    const x = w * 0.24, z = -d * 0.23, top = ridge + 0.65;
    parts.push(part((m) => lodBox(m, "stone", x, z, 0.72, 0.86, roofY(x) - 0.2, top + 0.16, "quoin")));
  }
  return fit(pal, parts);
}

export function villageTimberCottageLod(params?: ParamValues): MeshBuilder { return timberLod(false, params); }
export function villageTimberHouseLod(params?: ParamValues): MeshBuilder { return timberLod(true, params); }

// --- the alpine hut (alpineHut.ts) ------------------------------------------------------------

export function villageAlpineHutLod(values?: ParamValues): MeshBuilder {
  const p = resolveParams(ALPINE_HUT_PARAMS, values);
  const [timber, boards] = A_TIMBERS[p.timber!]!;
  const pal: Record<string, MaterialSpec> = {
    plaster: { color: A_WALLS[p.walls!]! }, timber: { color: timber }, boards: { color: boards }, trim: { color: "#b98450" },
    roof: { color: A_ROOFS[p.roof!]! }, snow: { color: "#f4f8fb", roughness: 0.9 }, stone: { color: "#56616c" },
    block: { color: "#9ba4ac" }, accent: { color: A_ACCENTS[p.accent!]! }, log: { color: "#a77a4c" },
  };
  const winter = p.season === "winter";
  const two = p.storeys === "two";
  const balcony = two ? p.balcony : "none";
  const W = 5.6, D = 4.8, P = 0.55, H = 2.55, F = P + H;
  const E = two ? P + 2 * H : P + H + 0.55, k = 0.62;
  const hx = W / 2 + (balcony === "wrap" ? 1.3 : 0.55);
  const zf = D / 2 + (balcony !== "none" ? 1.35 : p.entrance === "porch" ? 1.1 : 0.65);
  const zb = -D / 2 - 0.6;
  const R = E + 0.2 + (W / 2) * k;
  const roofTop = (x: number) => R - Math.abs(x) * k;
  const front = (u: number, y: number, off: number): Vec3 => [u, y, D / 2 + off];
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, 0, W, D), [[0, P, "stone"], [P, E - 0.24, "plaster"], [E - 0.24, E, "timber"]]);
      lodGable(m, { cx: 0, cz: 0, w: W, d: D, axis: "z", eave: E, pitch: k, oh: hx - W / 2, ends: [-zb - D / 2, zf - D / 2], t: 0.2, roof: winter ? "snow" : "roof", edge: "roof", rake: "trim", gable: "boards" });
    }),
    // the plank door and the ground floor's shutters, in the accent colour
    part((m) => {
      faceQuad(m, "accent", (u, y) => front(u, y, 0.04), -0.5, 0.5, P, P + 2.05, [0, 0, 1]);
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        const c = s * 1.7 + e * (0.36 + 0.09 + 0.18 + 0.02);
        faceQuad(m, "accent", (u, y) => front(u, y, 0.05), c - 0.2, c + 0.2, P + 0.83, P + 2.04, [0, 0, 1]);
      }
    }),
    part((m) => {
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        const c = s * 0.9 + e * 0.65;
        faceQuad(m, "accent", (u, y) => [s * (W / 2 + 0.05), y, u], c - 0.2, c + 0.2, P + 0.83, P + 2.04, [s, 0, 0]);
      }
    }, 2),
    // the half-timber frame: the corner posts, the sill and floor beams
    part((m) => {
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        faceQuad(m, "timber", (u, y) => [u, y, s * (D / 2 + 0.07)], e * (W / 2 - 0.06) - 0.12, e * (W / 2 - 0.06) + 0.12, P + 0.18, E - 0.24, [0, 0, s]);
        faceQuad(m, "timber", (u, y) => [s * (W / 2 + 0.07), y, u], e * (D / 2 - 0.06) - 0.12, e * (D / 2 - 0.06) + 0.12, P + 0.18, E - 0.24, [s, 0, 0]);
      }
    }, 1),
    part((m) => lodWalls(m, lodRect(0, 0, W + 0.12, D + 0.12), [[P - 0.03, P + 0.18, "timber"]]), 0.5),
  ];
  if (two) parts.push(part((m) => lodWalls(m, lodRect(0, 0, W + 0.12, D + 0.12), [[F - 0.1, F + 0.1, "timber"]]), 0.6));
  if (p.chimney === "stone") {
    parts.push(part((m) => lodBox(m, "stone", 1.25, -0.9, 0.62, 0.62, roofTop(1.25 + 0.31) - 0.5, R + 0.75 + 0.3, winter ? "snow" : "block")));
  }
  if (balcony !== "none") {
    const out = 1.15, deckY = F + 0.12, zEdge = D / 2 + out, wrap = balcony === "wrap";
    const x0 = wrap ? W / 2 + out : W / 2 - 0.35, zBack = -D / 2 + 0.7;
    parts.push(part((m) => {
      lodBox(m, "trim", 0, D / 2 + out / 2, 2 * x0, out, F - 0.05, deckY);
      lodCap(m, "trim", lodRect(0, D / 2 + out / 2, 2 * x0, out), F - 0.05, false);
      if (wrap) for (const s of [-1, 1]) {
        const r = lodRect(s * (W / 2 + out / 2), (zBack + D / 2) / 2, out, D / 2 - zBack);
        lodWalls(m, r, [[F - 0.05, deckY, "trim"]], [s > 0 ? 3 : 1, 2]);
        lodCap(m, "trim", r, deckY);
      }
      // the boarded railing
      const y0 = deckY, y1 = deckY + 1.02;
      if (wrap) lodWalls(m, [[-x0, zBack], [x0, zBack], [x0, zEdge], [-x0, zEdge]], [[y0, y1, "trim"]], [0]);
      else lodWalls(m, [[-x0, D / 2], [x0, D / 2], [x0, zEdge], [-x0, zEdge]], [[y0, y1, "trim"]], [0]);
    }));
  }
  if (p.entrance === "porch") {
    const depth = balcony !== "none" ? 1.2 : 1.0, z1 = D / 2 + depth;
    parts.push(part((m) => lodBox(m, "stone", 0, D / 2 + depth / 2, 2.5, depth, 0, P - 0.02), 3));
    const postTop = balcony !== "none" ? F - 0.05 : P + 2.6;
    parts.push(part((m) => { for (const s of [-1, 1]) lodPost(m, "timber", s * 1.08, z1 - 0.12, 0.11, P - 0.02, postTop); }, 2.5));
    if (balcony === "none") {
      parts.push(part((m) => {
        const y = P + 2.6, rise = 0.55, hw = 1.45;
        lodGable(m, { cx: 0, cz: (D / 2 - 0.07 + z1 + 0.12) / 2, w: 2 * hw - 0.5, d: z1 + 0.19 - D / 2, axis: "z", eave: y + 0.02, top: y + 0.04 + 0.25 * (rise / hw), pitch: rise / hw, oh: 0.25, ends: [0, 0.08], roof: winter ? "snow" : "roof", gable: "boards", gables: [false, true] });
      }, 4));
    }
  } else {
    parts.push(part((m) => lodBox(m, "stone", 0, D / 2 + 0.45, 1.6, 0.9, 0, P), 1.5));
  }
  parts.push(part((m) => lodBox(m, "log", -W / 2 - 0.36, 0.45 + 6.1 * 0.11, 0.52, 13 * 0.11, 0, 0.8, winter ? "snow" : "log"), 0.2));
  return fit(pal, parts);
}

// --- the stations (stations.ts) ---------------------------------------------------------------

/** The Mikulasovice halt: a stucco block under a red hip roof, a gabled centre bay and a platform canopy on posts. */
export function stationHaltLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, -1.73, 18, 8), [[0, 0.55, "plinth"], [0.55, 6.95, "stucco"]]);
      lodHipRoof(m, "tile", -9.7, 9.7, -6.43, 2.97, 6.95, 9.45, 4.7);
      lodWalls(m, lodRect(0, -1.73, 19.4, 9.4), [[6.73, 6.95, "tile"]]);
      // the centre bay: its walls, its gable and its own gable roof
      lodWalls(m, lodRect(0, 2.52, 6.8, 0.5), [[0, 0.55, "plinth"], [0.55, 7.4, "stucco"]], [0]);
      lodGable(m, { cx: 0, cz: 0.52, w: 6.8, d: 4.5, axis: "z", eave: 7.4, top: 7.12 + 0.6 * (2.33 / 4), pitch: 2.33 / 4, oh: 0.6, ends: [0, 0.33], t: 0.2, roof: "tile", rake: "timber", gable: "stucco", gables: [false, true] });
      // the platform canopy
      lodPolygon(m, "tile", [[-9.6, 4.16, 2.3], [9.6, 4.16, 2.3], [9.6, 3.66, 6.5], [-9.6, 3.66, 6.5]], [0, 4.2, 0.5]);
      faceQuad(m, "timber", (u, y) => [u, y, 6.56], -9.6, 9.6, 3.38, 3.66, [0, 0, 1]);
    }),
    // the blue name board on the bay
    part((m) => faceQuad(m, "sign", (u, y) => [u, y, 2.92], -1.78, 1.78, 6.28, 6.98, [0, 0, 1]), 6),
    part((m) => { for (const x of [-5.6, 5.6]) lodBox(m, "brick", x, -2.13, 0.86, 0.75, 7.6, 10.46, "plinth"); }, 4),
    // the corner pilasters in brick
    part((m) => {
      for (const s of [-1, 1]) {
        faceQuad(m, "brick", (u, y) => [u, y, 2.36], s > 0 ? 8.1 : -9.1, s > 0 ? 9.1 : -8.1, 0.6, 6.85, [0, 0, 1]);
        faceQuad(m, "brick", (u, y) => [s * 9.09, y, u], 1.27, 2.36, 0.6, 6.85, [s, 0, 0]);
        faceQuad(m, "brick", (u, y) => [u, y, 2.86], s > 0 ? 2.7 : -3.5, s > 0 ? 3.5 : -2.7, 0.6, 7.3, [0, 0, 1]);
      }
    }, 3),
  ];
  // the canopy posts, every other one first
  [[-9.0, 9.0], [-3.0, 3.0], [-6.0, 6.0]].forEach((xs, i) => parts.push(part((m) => { for (const x of xs) lodPost(m, "post", x, 6.15, 0.14, 0, 3.5); }, 5 - i)));
  return fit(HALT, parts);
}

/** The ochre stucco station: a long block under a hip roof, the central pavilion, the end pavilion and the platform canopy. */
export function stationBuildingLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      // the long block: its east end is in the end pavilion
      lodWalls(m, lodRect(-2.29, -1.43, 22.0, 7.0), [[0, 0.62, "stone"], [0.62, 4.37, "ochre"]], [1]);
      lodHipRoof(m, "tile", -13.89, 9.31, -5.62, 2.72, 4.37, 5.52, 4.17);
      // the pavilion: walls over the long block's roof, a gable to the platform and a hip behind
      // (its sides show only over the long block)
      lodWalls(m, lodRect(-0.29, -1.18, 6.4, 7.9), [[0, 0.62, "stone"], [0.62, 6.75, "ochre"], [6.75, 6.97, "plaster"]], [1, 3]);
      lodWalls(m, lodRect(-0.29, -1.18, 6.4, 7.9), [[4.37, 6.75, "ochre"], [6.75, 6.97, "plaster"]], [0, 2]);
      const [x0, x1, z0, z1, y0, y1, xc] = [-4.04, 3.46, -5.62, 3.27, 6.85, 8.45, -0.29];
      lodPolygon(m, "tile", [[x1, y0, z0], [x1, y0, z1], [xc, y1, z1], [xc, y1, z0 + 2.6]], [1, 1, 0]);
      lodPolygon(m, "tile", [[x0, y0, z1], [x0, y0, z0], [xc, y1, z0 + 2.6], [xc, y1, z1]], [-1, 1, 0]);
      lodPolygon(m, "tile", [[x0, y0, z0], [x1, y0, z0], [xc, y1, z0 + 2.6]], [0, 1, -1]);
      lodPolygon(m, "ochre", [[xc - 3.0, 6.97, 2.77], [xc + 3.0, 6.97, 2.77], [xc, y1 - 0.2, 2.77]], [0, 0, 1]);
      lodPolygon(m, "green", [[x0, y0, z1 + 0.01], [xc, y1, z1 + 0.01], [xc, y1 - 0.3, z1 + 0.01], [x0, y0 - 0.3, z1 + 0.01]], [0, 0, 1]);
      lodPolygon(m, "green", [[xc, y1, z1 + 0.01], [x1, y0, z1 + 0.01], [x1, y0 - 0.3, z1 + 0.01], [xc, y1 - 0.3, z1 + 0.01]], [0, 0, 1]);
      // the end pavilion under its own gable roof
      lodWalls(m, lodRect(10.91, -0.73, 4.6, 8.8), [[0, 0.62, "stone"], [0.62, 4.77, "ochre"]]);
      lodGable(m, { cx: 10.91, cz: -0.73, w: 4.6, d: 8.8, axis: "z", eave: 4.77, top: 4.67 + 0.65 * (1.45 / 2.95), pitch: 1.45 / 2.95, oh: 0.65, ends: [0.67, 0.73], t: 0.3, roof: "tile", rake: "green", gable: "ochre" });
      // the platform canopy and its green valance
      lodPolygon(m, "canopy", [[-13.69, 3.78, 1.95], [8.91, 3.78, 1.95], [8.91, 3.28, 5.85], [-13.69, 3.28, 5.85]], [0, 3.9, 0.5]);
      faceQuad(m, "green", (u, y) => [u, y, 5.9], -13.69, 8.91, 2.92, 3.28, [0, 0, 1]);
    }),
    part((m) => lodBox(m, "ochre", -2.19, -3.33, 0.66, 0.66, 7.3, 8.64, "stone"), 4),
  ];
  // the canopy posts, flat to the platform, the end ones first
  [[0, 7], [3, 4], [1, 6], [2, 5]].forEach((is, k) => parts.push(part((m) => {
    for (const i of is) faceQuad(m, "wood", (u, y) => [u, y, 5.72], -12.79 + i! * 3 - 0.1, -12.79 + i! * 3 + 0.1, 0, 3.0, [0, 0, 1]);
  }, 5 - k)));
  return fit(STUCCO, parts);
}

/** The red-brick suburban station: two flat-roofed wings, the tall hall with its attic and clock tower, the street canopy. */
export function suburbanStationLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, 0, 24, 10), [[0, 0.45, "stone"], [0.45, 6.58, "brick"], [6.58, 7.0, "trim"]]);
      lodCap(m, "roof", lodRect(0, 0, 24, 10), 7.0);
      lodWalls(m, lodRect(0, 0, 10, 10), [[7.0, 9.7, "brick"], [9.7, 10.2, "trim"]]);
      lodCap(m, "roof", lodRect(0, 0, 10, 10), 10.2);
      lodBox(m, "trim", 0, 0, 7, 8.6, 10.2, 11.42);
      lodBox(m, "trim", 0, 2.9, 4.4, 2.8, 11.42, 13.88);
      // the street canopy, a slab on posts
      lodBox(m, "trim", 0, 6.5, 24.8, 3.0, 4.2, 4.5);
      lodCap(m, "trim", lodRect(0, 6.5, 24.8, 3.0), 4.2, false);
      lodPolygon(m, "forecourt", [[-12.6, 0.3, 5.32], [12.6, 0.3, 5.32], [12.6, 0.3, 8.3], [-12.6, 0.3, 8.3]], [0, 1, 0]);
      faceQuad(m, "forecourt", (u, y) => [u, y, 8.3], -12.6, 12.6, 0, 0.3, [0, 0, 1]);
    }),
  ];
  // the clock face on the tower and the hall's string course
  parts.push(part((m) => {
    const ring = lodNgon(8, 0.85, 0, 12.65, Math.PI / 8);
    lodPolygon(m, "clockFace", ring.map(([x, y]): Vec3 => [x, y, 4.36]), [0, 0, 1]);
  }, 6));
  parts.push(part((m) => faceQuad(m, "trim", (u, y) => [u, y, 5.06], -5.1, 5.1, 4.9, 5.2, [0, 0, 1]), 2));
  [[0, 8], [4], [2, 6], [1, 7], [3, 5]].forEach((is, k) => parts.push(part((m) => {
    for (const i of is) lodPost(m, "trim", -11.6 + i! * 2.9, 7.75, 0.14, 0.3, 4.2);
  }, 5 - k * 0.5)));
  return fit(SUBURBAN, parts);
}

/** Prague main station: the central hall with its arched front and gable, the two domed towers, the links and the mansard wings. */
export function pragueMainStationLod(): MeshBuilder {
  const BIG = 500;
  const parts: LodPart[] = [];
  // the central hall
  parts.push(part((m) => {
    lodWalls(m, lodRect(0, -2.8, 26, 19.6), [[0, 2.6, "trim"], [2.6, 21.5, "stone"]], [2]);
    lodWalls(m, lodRect(0, -2, 27.6, 22), [[21.5, 22.5, "trim"]]);
    lodCap(m, "trim", lodRect(0, -2, 27.6, 22), 22.5);
    // the front: piers, lintel, the lower block of the doors and the great arch's recess
    const z = 8.6, n: Vec3 = [0, 0, 1];
    for (const s of [-1, 1]) {
      faceQuad(m, "trim", (u, y) => [s * u, y, z], 7.5, 13, 0, 2.6, [0, 0, 1]);
      faceQuad(m, "stone", (u, y) => [s * u, y, z], 7.5, 13, 2.6, 21.5, [0, 0, 1]);
      // the step from the piers back to the doors' block
      lodPolygon(m, "stone", [[s * 7.5, 0, 8.2], [s * 7.5, 0, z], [s * 7.5, 7.6, z], [s * 7.5, 7.6, 8.2]], [-s, 0, 0]);
    }
    faceQuad(m, "stone", (u, y) => [u, y, z], -7.5, 7.5, 19.5, 21.5, n);
    faceQuad(m, "trim", (u, y) => [u, y, 8.2], -7.5, 7.5, 0, 2.6, n);
    faceQuad(m, "stone", (u, y) => [u, y, 8.2], -7.5, 7.5, 2.6, 7.6, n);
    lodCap(m, "stone", [[-7.5, 7.4], [7.5, 7.4], [7.5, 8.2], [-7.5, 8.2]], 7.6);
    const k = 6, arc = Array.from({ length: k + 1 }, (_, i): XY => [7.5 * Math.cos(Math.PI - (i * Math.PI) / k), 12 + 7.5 * Math.sin(Math.PI - (i * Math.PI) / k)]);
    for (let i = 0; i < k; i++) {
      const [a, b] = [arc[i]!, arc[i + 1]!];
      // the spandrel over the arc, the arch's soffit back to the recess
      lodPolygon(m, "stone", distinct([[a[0], a[1], z], [b[0], b[1], z], [b[0], 19.5, z], [a[0], 19.5, z]]), n);
      lodPolygon(m, "trim", [[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], 7.4], [a[0], a[1], 7.4]], [-(a[0] + b[0]) / 2, 12 - (a[1] + b[1]) / 2, 0]);
    }
    lodPolygon(m, "trim", [[-7.5, 7.6, z], [-7.5, 12, z], [-7.5, 12, 7.4], [-7.5, 7.6, 7.4]], [1, 0, 0]);
    lodPolygon(m, "trim", [[7.5, 7.6, z], [7.5, 12, z], [7.5, 12, 7.4], [7.5, 7.6, 7.4]], [-1, 0, 0]);
    // the recess's back wall
    lodPolygon(m, "trim", arc.map(([x, y]): Vec3 => [x, y, 7.4]), n);
    faceQuad(m, "trim", (u, y) => [u, y, 7.4], -7.5, 7.5, 7.6, 12, n);
    // the hall's barrel roof and its stone rear gable
    const sec = Array.from({ length: 7 }, (_, i): XY => {
      const a0 = Math.asin((22.4 - 13.5) / 11.4), a = a0 + (i * (Math.PI - 2 * a0)) / 6;
      return [11.4 * Math.cos(a), 13.5 + 11.4 * Math.sin(a)];
    });
    // its front end is behind the gable screen
    lodPlate(m, "slate", sec, 5.15, -12.35, false);
  }));
  // the archivolt round the great arch
  parts.push(part((m) => {
    const k = 6, at = (r: number, i: number): Vec3 => [r * Math.cos(Math.PI - (i * Math.PI) / k), 12 + r * Math.sin(Math.PI - (i * Math.PI) / k), 9.02];
    for (let i = 0; i < k; i++) lodPolygon(m, "trim", [at(7.5, i), at(7.5, i + 1), at(8.55, i + 1), at(8.55, i)], [0, 0, 1]);
  }, 5));
  // the gable screen with its red panels
  parts.push(part((m) => {
    const pieces: XY[][] = [[[-12.25, 22.3], [12.25, 22.3], [12.25, 25.2], [-12.25, 25.2]],
      [[-8, 25.2], [8, 25.2], [8, 27.4], [4.8, 31.5], [-4.8, 31.5], [-8, 27.4]],
      [[8, 25.2], [12.25, 25.2], [8, 27.4]], [[-8, 25.2], [-8, 27.4], [-12.25, 25.2]]];
    // the pieces' edges against each other are left out; the lowest piece's back is behind the hall roof
    lodPlate(m, "stone", pieces[0]!, 4.4, 7.4, false, [2]);
    lodPlate(m, "stone", pieces[1]!, 4.4, 7.4, true, [1, 5]);
    lodPlate(m, "stone", pieces[2]!, 4.4, 7.4, true, [2]);
    lodPlate(m, "stone", pieces[3]!, 4.4, 7.4, true, [0]);
    const fields: XY[][] = [[[-11.9, 22.8], [11.9, 22.8], [11.9, 24.9], [-11.9, 24.9]], [[-4.5, 25.5], [4.5, 25.5], [4.5, 31.1], [-4.5, 31.1]]];
    for (const s of [-1, 1]) {
      fields.push([[s * 8.3, 25.5], [s * 11.3, 25.5], [s * 8.3, 27.04]]);
      fields.push([[s * 5.1, 25.5], [s * 7.7, 25.5], [s * 7.7, 27.4], [s * 5.1, 30.7]]);
    }
    for (const f of fields) lodPolygon(m, "ochre", f.map(([x, y]): Vec3 => [x, y, 7.48]), [0, 0, 1]);
  }));
  parts.push(part((m) => {
    for (const s of [-1, 1]) for (const [x, y0, y1, w] of [[11.4, 24.5, 25.9, 1.8], [8, 26.8, 28.0, 1.5]] as const) {
      lodBox(m, "trim", s * x, 5.9, w, 3.9, y0, y1);
      lodSpire(m, "slate", lodRect(s * x, 5.9, w * 0.8, 3.0), y1, y1 + 1.2);
    }
  }, 6));
  // the copper entrance canopy on its columns
  parts.push(part((m) => {
    const prof = (t: number): XY => [8.62 + 4.72 * Math.sin(t), 5.1 + 2.85 * Math.cos(t)];
    for (let k = 0; k < 4; k++) {
      const [a, b] = [prof((k / 4) * Math.PI / 2), prof(((k + 1) / 4) * Math.PI / 2)];
      lodPolygon(m, "copper", [[-12, a[1], a[0]], [12, a[1], a[0]], [12, b[1], b[0]], [-12, b[1], b[0]]], [0, a[1] - b[1], b[0] - a[0]]);
    }
  }, 7));
  // its columns, flat to the street
  parts.push(part((m) => { for (let i = 0; i < 7; i++) faceQuad(m, "copper", (u, y) => [u, y, 12.5], -11.1 + i * 3.7 - 0.25, -11.1 + i * 3.7 + 0.25, 0, 5.4, [0, 0, 1]); }, 7.5));
  // the towers
  for (const s of [-1, 1]) {
    const cx = s * 15.5, cz = 5.5;
    parts.push(part((m) => {
      lodWalls(m, lodRect(cx, cz, 8.4, 9), [[0, 3, "trim"], [3, 27, "stone"], [27, 29.8, "trim"]]);
      lodCap(m, "trim", lodRect(cx, cz, 8.4, 9), 29.8);
      lodWalls(m, lodNgon(8, 3.42, cx, cz, Math.PI / 8), [[29.8, 32.6, "stone"]]);
      lodWalls(m, lodNgon(8, 3.95, cx, cz, Math.PI / 8), [[32.6, 33.0, "trim"]]);
      // the dome, open at its crown under the lantern, and the lantern
      lodRevolve(m, "copper", 8, cx, cz, [[3.95, 33.0], [3.2, 35.5], [1.15, 37.3]], Math.PI / 8, false);
      lodWalls(m, lodNgon(6, 1.12, cx, cz), [[37.0, 39.45, "copper"]]);
      lodRevolve(m, "copper", 6, cx, cz, [[1.25, 39.45], [0, 40.5]]);
      lodSpire(m, "gilt", lodNgon(4, 0.2, cx, cz), 40.4, 42.1);
    }));
  }
  // the links and the mansard wings
  for (const s of [-1, 1]) {
    parts.push(part((m) => {
      // only the link's back and its face behind the tower show
      lodWalls(m, lodRect(s * 20.2, -0.7, 4.2, 14.6), [[0, 2.6, "trim"], [2.6, 13, "stone"], [13, 13.8, "trim"]], [2, s > 0 ? 1 : 3]);
      lodCap(m, "trim", lodRect(s * 20.2, -0.7, 4.2, 14.6), 13.8);
      const cx = s * 25.5;
      lodWalls(m, lodRect(cx, -1.5, 12, 17), [[0, 2.8, "trim"], [2.8, 16, "stone"], [16, 16.9, "trim"]]);
      lodCap(m, "trim", lodRect(cx, -1.5, 12, 17), 16.9);
      lodWalls(m, lodRect(cx, -1.5, 11, 16), [[16.9, 19.05, "stone"]]);
      lodFrustum(m, "slate", bounds(cx, -1.5, 11.2, 16.2), 19.05, bounds(cx, -1.5, 9.18, 13.28), 20.95, null);
      lodHipRoof(m, "slate", cx - 4.59, cx + 4.59, -8.14, 5.14, 20.95, 21.9, 4.59);
    }));
    parts.push(part((m) => lodWalls(m, lodRect(s * 25.5, -1.5, 12.16, 17.16), [[8.0, 8.35, "trim"]]), 2));
    parts.push(part((m) => {
      for (const k of [-1, 0, 1]) {
        const x = s * 25.5 + k * 3.4;
        lodWalls(m, lodRect(x, 5.7, 1.5, 1.2), [[19.45, 20.95, "trim"]], [0]);
        lodFrustum(m, "slate", bounds(x, 5.725, 1.8, 1.45), 20.85, bounds(x, 5.725, 0.08, 1.45), 21.55, null);
      }
    }, 3));
    parts.push(part((m) => {
      for (const y of [9.25, 17.25]) lodWalls(m, lodRect(s * 15.5, 5.5, 8.56, 9.16), [[y, y + 0.5, "trim"]]);
    }, 1));
  }
  return fit(PRAGUE, parts, BIG);
}

// --- the fountains (fountains.ts) ---------------------------------------------------------------

/** A basin from afar: its stone wall, the trim rim sloping in to the water, and the water. */
function lodBasin(m: MeshBuilder, outer: readonly XZ[], inner: readonly XZ[], height: number): void {
  lodWalls(m, outer, [[0, height, "stone"]]);
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const [a, b, c, d] = [outer[i]!, outer[j]!, inner[j]!, inner[i]!];
    lodPolygon(m, "trim", [[a[0], height, a[1]], [b[0], height, b[1]], [c[0], height - 0.1, c[1]], [d[0], height - 0.1, d[1]]], [0, 1, 0]);
  }
  lodCap(m, "water", inner, height - 0.1);
}

export function classicalFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodNgon(10, 3.35), lodNgon(10, 3.02), 0.55);
    lodWalls(m, lodNgon(6, 0.24), [[0.45, 2.8, "stone"]]);
    for (const [y, r] of [[1.6, 1.32], [2.5, 0.62]] as const) {
      lodRevolve(m, "stone", 6, 0, 0, [[r * 0.22, y - 0.32], [r, y + 0.04]], 0, false);
      lodCap(m, "water", lodNgon(6, r), y + 0.04);
    }
    lodSpire(m, "stone", lodNgon(6, 0.16), 2.54, 2.95);
  })]);
}

export function modernFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodRect(0, 0, 6.4, 6.4), lodRect(0, 0, 5.9, 5.9), 0.45);
    for (const x of [-1.7, 0, 1.7]) for (const z of [-1.7, 0, 1.7]) lodPrism(m, "bronze", lodNgon(3, 0.16, x, z, Math.PI / 2), 0.3, 0.45, "trim");
  })]);
}

export function obeliskFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodNgon(8, 3.3, 0, 0, Math.PI / 8), lodNgon(8, 2.98, 0, 0, Math.PI / 8), 0.5);
    lodBox(m, "granite", 0, 0, 1.3, 1.3, 0.4, 1.35);
    lodBox(m, "granite", 0, 0, 1.6, 1.6, 1.35, 1.53);
    lodFrustum(m, "granite", bounds(0, 0, 0.96, 0.96), 1.53, bounds(0, 0, 0.65, 0.65), 5.02, null);
    lodSpire(m, "bronze", lodRect(0, 0, 0.65, 0.65), 5.02, 5.48);
    for (const [dx, dz] of [[1, 0], [0, -1], [-1, 0], [0, 1]] as const) {
      const n: Vec3 = [dx, 0, dz];
      const at = (u: number, y: number): Vec3 => [dx * 0.95 + dz * u, y, dz * 0.95 - dx * u];
      lodPolygon(m, "bronze", [at(-0.15, 0.8), at(0.15, 0.8), at(0.15, 0.94), at(-0.15, 0.94)], n);
      lodPolygon(m, "bronze", [at(-0.15, 0.94), at(0.15, 0.94), [dx * 0.65 + dz * 0.15, 0.94, dz * 0.65 - dx * 0.15], [dx * 0.65 - dz * 0.15, 0.94, dz * 0.65 + dx * 0.15]], [0, 1, 0]);
    }
  })]);
}
