// A cable car station's shed, one per station type (docs/models/props.md): the
// station hall, and the roof it carries forward over the boarding platform and the
// back half of the bull wheel. The head itself -- the pedestal and the bull wheel the
// rope wraps -- and the boarding platform built to a cabin's door are the game's,
// because every type shares the one and the cabin decides the other.
//
// Station-local frame: +Z faces the first support along the rope (the head stands
// out in front, `headZ` along +Z), +X is the station's right, y = 0 is the terrain
// level the station is placed at. Only the footprint (w x d about the origin) is
// levelled, so everything that stands on the ground stands inside it; what reaches
// out over the platform is carried from there.
//
// THE CLEARANCES are hard rules (`shedFouls`, test/props.test.ts): nothing may stand
// in the ring a cabin sweeps round the wheel, on the wheel or the grips riding it,
// ahead of the wheel axis where the rope leaves, in the game's boarding platform
// (a column may pass through its deck) or over the game's stairs down from it.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import { propBoxCorners, propModel, separateCoplanar, type PropBox, type Rgb } from "./propKit.ts";

const STEEL: Rgb = [120, 128, 136];
const STEEL_DARK: Rgb = [62, 66, 72];
const TIMBER: Rgb = [140, 96, 56];
const TIMBER_DARK: Rgb = [96, 64, 38];
const GLASS: Rgb = [180, 205, 225];
const CONCRETE: Rgb = [168, 165, 158];
const STONE: Rgb = [140, 136, 128];
const DECK: Rgb = [96, 92, 88];

/** The station types, with the footprint and rope-head height each is placed with. */
export const STATION_DIMS = {
  open_gantry: { w: 14, d: 18, ropeHeadY: 16 },
  alpine_chalet: { w: 18, d: 24, ropeHeadY: 15 },
  glass_modern: { w: 18, d: 26, ropeHeadY: 17 },
  concrete_drive: { w: 22, d: 30, ropeHeadY: 19 },
} as const;
export type StationType = keyof typeof STATION_DIMS;
export const STATION_TYPES = Object.keys(STATION_DIMS) as StationType[];

// --- the loading gauge (the game's core/rail/CableCar.ts and CableCarStation.ts) ---
/** The bull wheel's radius: the two rope strands are its diameter. */
export const WHEEL_RADIUS = 5;
const HEAD_CLEARANCE = 2;
/** How far the deepest cabin hangs below the rope. */
export const CABIN_DROP = 10;
const CABIN_HALF_WIDTH = 2.5;
export const SWEEP_INNER_R = WHEEL_RADIUS - CABIN_HALF_WIDTH;
export const SWEEP_OUTER_R = WHEEL_RADIUS + CABIN_HALF_WIDTH;
/** Local +Z of the wheel axis for a shed `depth` deep. */
export function headOverhangFor(depth: number): number {
  return depth / 2 + WHEEL_RADIUS + HEAD_CLEARANCE;
}

/** A box's axis-aligned extent in the station frame, its tilts applied. */
export function boxExtent(b: PropBox): { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number } {
  const p = propBoxCorners(b);
  const xs = p.map((v) => v[0]), ys = p.map((v) => v[1]), zs = p.map((v) => v[2]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), z0: Math.min(...zs), z1: Math.max(...zs) };
}

/** The closest and farthest horizontal distance from the wheel axis to a box's extent. */
function radial(e: ReturnType<typeof boxExtent>, headZ: number): { near: number; far: number } {
  const z0 = e.z0 - headZ, z1 = e.z1 - headZ;
  return {
    near: Math.hypot(Math.max(e.x0, 0, -e.x1), Math.max(z0, 0, -z1)),
    far: Math.hypot(Math.max(Math.abs(e.x0), Math.abs(e.x1)), Math.max(Math.abs(z0), Math.abs(z1))),
  };
}

/** Whether a box's axis-aligned extent fouls the ring a cabin sweeps about the wheel. */
export function intrudesOnCabin(ropeHeadY: number, headZ: number, b: PropBox): boolean {
  const e = boxExtent(b);
  if (e.y1 <= ropeHeadY - CABIN_DROP || e.y0 >= ropeHeadY - 0.5) return false;
  const { near, far } = radial(e, headZ);
  return !(far < SWEEP_INNER_R || near > SWEEP_OUTER_R);
}

// --- the game's head and boarding platform (core/rail/CableCarStation.ts) ---
/** Above the rope the wheel's bearing cap and the cabins' grips reach this high. */
export const HEAD_TOP = 1.3;
/** The lowest a roof may come over the head and the platform, above the rope. */
const ROOF_CLEAR = 2.5;
/** The platform's radial band about the wheel axis, every catalog cabin's. */
export const PLATFORM_R_IN = 7.8;
export const PLATFORM_R_OUT = 12.4;
/** The platform's deck and railing, below the rope (sill drops 8.13..8.54, the step, the rail). */
export const PLATFORM_Y = { below: 9.4, above: 6.9 };
const STAIR_HALF_WIDTH = 2.35;
/** Head room kept over every tread of the game's stairs. */
export const STAIR_HEADROOM = 2.4;

/** The game's stairs from the platform (default cabin): each tread's z range and top. */
export function stairTreads(type: StationType): { z0: number; z1: number; top: number }[] {
  const dims = STATION_DIMS[type];
  const headZ = headOverhangFor(dims.d);
  const surfaceY = dims.ropeHeadY - 8.3 - 0.25;
  const topZ = headZ - (7.8 + 4.5) - 0.45;
  const steps = Math.max(3, Math.round(surfaceY / 0.55));
  return Array.from({ length: steps }, (_, i) => {
    const z = topZ - (0.5 + i) * 0.9;
    return { z0: z - 0.45, z1: z + 0.45, top: surfaceY - (surfaceY * i) / steps };
  });
}

/** Why a shed box fouls the station the game builds round it, or null when it is clear. */
export function shedFouls(type: StationType, b: PropBox): string | null {
  const dims = STATION_DIMS[type];
  const headY = dims.ropeHeadY;
  const headZ = headOverhangFor(dims.d);
  const e = boxExtent(b);
  const { near, far } = radial(e, headZ);
  if (intrudesOnCabin(headY, headZ, b)) return "cabin ring";
  if (near < SWEEP_OUTER_R + 0.1 && e.y0 < headY + HEAD_TOP && e.y1 > headY - CABIN_DROP - 2) return "head";
  if (e.z1 > headZ + 0.6) return "rope";
  const column = !b.rotX && !b.rotZ && b.sx <= 1.6 && b.sz <= 1.6 && far < PLATFORM_R_OUT - 0.4;
  if (!column && near < PLATFORM_R_OUT && far > PLATFORM_R_IN && e.y1 > headY - PLATFORM_Y.below && e.y0 < headY - PLATFORM_Y.above) return "platform";
  if (e.x0 < STAIR_HALF_WIDTH && e.x1 > -STAIR_HALF_WIDTH) {
    for (const t of stairTreads(type)) {
      if (e.z0 < t.z1 && e.z1 > t.z0 && e.y1 > t.top + 0.3 && e.y0 < t.top + STAIR_HEADROOM) return "stairs";
    }
  }
  return null;
}

// --- drawing ---

type Ctx = {
  w: number; d: number; headY: number; headZ: number;
  /** The underside of a roof over the head and the platform. */
  eaveY: number;
  /** The roof's front edge, over the wheel axis. */
  zF: number;
  out: PropBox[];
  /** The low detail: its own few boxes, the same silhouette. */
  low: PropBox[];
};

/** Which levels a box is drawn at: the full one (default), the low one or both. */
type Lv = "full" | "low" | "both";

function put(c: Ctx, b: PropBox, lv: Lv): void {
  if (lv !== "low") c.out.push(b);
  if (lv !== "full") c.low.push({ ...b });
}

/** An axis-aligned box between two corners. */
function blk(c: Ctx, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: Rgb, material: string, lv: Lv = "full"): void {
  put(c, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, sx: Math.abs(x1 - x0), sy: Math.abs(y1 - y0), sz: Math.abs(z1 - z0), color, material }, lv);
}

/**
 * A hall's low detail: its two sides and, over the game's stairs climbing out of its
 * front, only its back wall and what stands above the door (`doorY`).
 */
function hallLow(c: Ctx, x: number, top: number, doorY: number, z0: number, z1: number, color: Rgb, material: string): void {
  pair(c, STAIR_HALF_WIDTH + 0.05, x, 0, top, z0, z1, color, material, "low");
  blk(c, -STAIR_HALF_WIDTH - 0.05, STAIR_HALF_WIDTH + 0.05, doorY, top, z0, z1, color, material, "low");
  blk(c, -STAIR_HALF_WIDTH - 0.05, STAIR_HALF_WIDTH + 0.05, 0, doorY, z0, z0 + 0.8, color, material, "low");
}

/** The same box on both sides of the centre line (x0 < x1 on the +X side). */
function pair(c: Ctx, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: Rgb, material: string, lv: Lv = "full"): void {
  blk(c, x0, x1, y0, y1, z0, z1, color, material, lv);
  blk(c, -x1, -x0, y0, y1, z0, z1, color, material, lv);
}

/** A square-section bar from a to b, in any direction (its length along the box's own y). */
function bar(c: Ctx, a: Vec3, b: Vec3, t: number, color: Rgb, material: string, lv: Lv = "full"): void {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  // the box's y axis turned by Rz, then Rx: (-sin rz, cos rz cos rx, cos rz sin rx)
  const rotZ = -Math.asin(dx / len);
  const rotX = Math.atan2(dz, dy);
  put(c, {
    cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, cz: (a[2] + b[2]) / 2, sx: t, sy: len, sz: t,
    ...(rotX ? { rotX } : {}), ...(rotZ ? { rotZ } : {}), color, material,
  }, lv);
}

/** A bar and its mirror image across the centre line. */
function bars(c: Ctx, a: Vec3, b: Vec3, t: number, color: Rgb, material: string, lv: Lv = "full"): void {
  bar(c, a, b, t, color, material, lv);
  bar(c, [-a[0], a[1], a[2]], [-b[0], b[1], b[2]], t, color, material, lv);
}

/**
 * A two-sided pitched roof, ridge along Z: each slab's underside runs from the
 * ridge (x = 0, `ridgeY`) down to the eave (x = +-`eaveX`, `eaveY`).
 */
function pitchedRoof(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, z0: number, z1: number, thick: number, color: Rgb, material: string, lv: Lv = "full"): void {
  const a = Math.atan2(ridgeY - eaveY, eaveX);
  const len = Math.hypot(eaveX, ridgeY - eaveY) + thick * Math.tan(a);
  for (const s of [-1, 1]) {
    const mx = (s * eaveX) / 2 + s * Math.sin(a) * (thick / 2), my = (eaveY + ridgeY) / 2 + Math.cos(a) * (thick / 2);
    put(c, { cx: mx - s * Math.cos(a) * (thick * Math.tan(a)) / 2, cy: my + Math.sin(a) * (thick * Math.tan(a)) / 2, cz: (z0 + z1) / 2, sx: len, sy: thick, sz: z1 - z0, rotZ: -s * a, color, material }, lv);
  }
}

/** A strip lying on a pitched roof, along Z, `at` (0..1) of the way from ridge to eave. */
function roofStrip(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, at: number, z0: number, z1: number, width: number, height: number, color: Rgb, material: string): void {
  const a = Math.atan2(ridgeY - eaveY, eaveX);
  for (const s of [-1, 1]) {
    const x = s * eaveX * at, y = ridgeY - (ridgeY - eaveY) * at;
    put(c, { cx: x + s * Math.sin(a) * (height / 2), cy: y + Math.cos(a) * (height / 2), cz: (z0 + z1) / 2, sx: width, sy: height, sz: z1 - z0, rotZ: -s * a, color, material }, "full");
  }
}

/** Ribs down a pitched roof's slope (corrugation, seams), every `step` along Z. */
function roofRibs(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, thick: number, z0: number, z1: number, step: number, color: Rgb, material: string): void {
  const a = Math.atan2(ridgeY - eaveY, eaveX);
  const len = Math.hypot(eaveX, ridgeY - eaveY);
  const n = Math.floor((z1 - z0) / step);
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * (i / n);
    for (const s of [-1, 1]) {
      const off = thick + 0.05;
      put(c, { cx: (s * eaveX) / 2 + s * Math.sin(a) * off, cy: (eaveY + ridgeY) / 2 + Math.cos(a) * off, cz: z, sx: len, sy: 0.16, sz: 0.2, rotZ: -s * a, color, material }, "full");
    }
  }
}

// --- the open gantry: a red steel table frame under a corrugated roof ---

const FRAME: Rgb = [164, 52, 40];
const CLAD: Rgb = [150, 156, 160];
const SIGN: Rgb = [236, 234, 226];

/** A lattice girder in the plane x = `x`, from z0 to z1, chords at y0 and y1. */
function girder(c: Ctx, x: number, y0: number, y1: number, z0: number, z1: number, panels: number): void {
  blk(c, x - 0.22, x + 0.22, y0, y0 + 0.4, z0, z1, FRAME, "steel");
  blk(c, x - 0.22, x + 0.22, y1 - 0.4, y1, z0, z1, FRAME, "steel");
  for (let i = 0; i <= panels; i++) {
    const z = z0 + 0.15 + ((z1 - z0 - 0.3) * i) / panels;
    blk(c, x - 0.15, x + 0.15, y0 + 0.4, y1 - 0.4, z - 0.15, z + 0.15, FRAME, "steel");
    if (i < panels) {
      const zn = z0 + 0.15 + ((z1 - z0 - 0.3) * (i + 1)) / panels;
      bar(c, [x, i % 2 ? y0 + 0.4 : y1 - 0.4, z], [x, i % 2 ? y1 - 0.4 : y0 + 0.4, zn], 0.2, FRAME, "steel");
    }
  }
}

/** A roof truss across the frame at `z`: a bottom chord, two rafters and the web. */
function truss(c: Ctx, z: number, halfSpan: number, y0: number, ridgeY: number): void {
  const yTop = (x: number): number => ridgeY - ((ridgeY - y0) * Math.abs(x)) / halfSpan;
  blk(c, -halfSpan, halfSpan, y0, y0 + 0.4, z - 0.2, z + 0.2, FRAME, "steel");
  for (const s of [-1, 1]) {
    bar(c, [s * halfSpan, y0 + 0.2, z], [0, ridgeY, z], 0.4, FRAME, "steel");
    const xs = [halfSpan * 0.75, halfSpan * 0.5, halfSpan * 0.25];
    xs.forEach((x, i) => {
      blk(c, s * x - 0.12, s * x + 0.12, y0 + 0.4, yTop(x), z - 0.12, z + 0.12, FRAME, "steel");
      const xi = i === 0 ? halfSpan : xs[i - 1]!;
      bar(c, [s * xi, y0 + 0.4, z], [s * x, yTop(x) - 0.1, z], 0.18, FRAME, "steel");
    });
  }
  blk(c, -0.15, 0.15, y0 + 0.4, ridgeY, z - 0.15, z + 0.15, FRAME, "steel");
}

/** A glazed booth standing on the hall floor. */
function booth(c: Ctx, x0: number, x1: number, y: number, z0: number, z1: number, base: Rgb): void {
  blk(c, x0, x1, y, y + 1.1, z0, z1, base, "steel");
  blk(c, x0 + 0.08, x1 - 0.08, y + 1.1, y + 2.9, z0 + 0.08, z1 - 0.08, GLASS, "glass");
  for (const x of [x0 + 0.1, x1 - 0.1]) for (const z of [z0 + 0.1, z1 - 0.1]) blk(c, x - 0.1, x + 0.1, y + 1.1, y + 2.9, z - 0.1, z + 0.1, STEEL_DARK, "steel");
  blk(c, x0 - 0.25, x1 + 0.25, y + 2.9, y + 3.15, z0 - 0.25, z1 + 0.25, STEEL_DARK, "steel");
}

function buildOpenGantry(c: Ctx): void {
  const hw = c.w / 2, hd = c.d / 2;
  const colX = hw - 0.6;
  const colZ = [-hd + 0.6, 0, hd - 0.6];
  const y0 = c.eaveY;
  const span = 13.8;
  const ridgeY = y0 + 3.2;
  const zB = -hd - 0.2;
  // the hall floor: a grating deck under the back bay (the game's stairs land on it)
  blk(c, -hw, hw, 0, 0.3, -hd, 0.5, DECK, "deck", "both");
  for (let x = -hw + 1.2; x <= hw - 1.2; x += 2.4) blk(c, x - 0.12, x + 0.12, 0.3, 0.36, -hd + 0.3, 0.2, STEEL_DARK, "steel");
  // the columns: H sections on concrete plinths
  for (const z of colZ) {
    for (const s of [-1, 1]) {
      const x = s * colX;
      blk(c, x - 0.8, x + 0.8, 0, 0.7, z - 0.8, z + 0.8, CONCRETE, "concrete");
      blk(c, x - 0.45, x + 0.45, 0.7, y0, z - 0.45, z - 0.29, FRAME, "steel");
      blk(c, x - 0.45, x + 0.45, 0.7, y0, z + 0.29, z + 0.45, FRAME, "steel");
      blk(c, x - 0.09, x + 0.09, 0.7, y0, z - 0.29, z + 0.29, FRAME, "steel");
      if (z !== colZ[1]) blk(c, x - 0.45, x + 0.45, 0.7, y0, z - 0.45, z + 0.45, FRAME, "steel", "low");
      // knee braces out to the roof's side overhang
      bar(c, [x + s * 0.4, y0 - 4.5, z], [s * (colX + 4.4), y0 + 0.1, z], 0.3, FRAME, "steel");
    }
  }
  // the longitudinal girders, cantilevered forward over the platform to the wheel
  for (const s of [-1, 1]) {
    girder(c, s * colX, y0, y0 + 2.2, zB, c.zF, 12);
    blk(c, s * colX - 0.25, s * colX + 0.25, y0, y0 + 2.2, zB, c.zF, FRAME, "steel", "low");
    // the forward knee brace that carries the cantilever
    bar(c, [s * colX, y0 - 3.6, colZ[2]! + 0.5], [s * colX, y0 + 0.1, colZ[2]! + 3], 0.32, FRAME, "steel");
    // X-bracing in the back bay's sides
    bar(c, [s * (colX + 0.3), 0.8, colZ[0]! + 0.5], [s * (colX + 0.3), y0 - 0.2, colZ[1]! - 0.5], 0.22, FRAME, "steel");
    bar(c, [s * (colX + 0.3), y0 - 0.2, colZ[0]! + 0.5], [s * (colX + 0.3), 0.8, colZ[1]! - 0.5], 0.22, FRAME, "steel");
  }
  // the roof trusses across, at every column line and over the wheel
  for (const z of [colZ[0]!, colZ[1]!, colZ[2]!, c.zF - 0.35]) truss(c, z, span, y0 + 2.2, ridgeY);
  // the corrugated roof, its ribs and ridge lantern
  const eaveX = span + 0.6;
  const roofEaveY = y0 + 2.2 + 0.4 - (0.6 * (ridgeY - y0 - 2.6)) / span;
  pitchedRoof(c, eaveX, roofEaveY, ridgeY + 0.2, zB - 0.4, c.zF + 0.1, 0.25, CLAD, "steel", "both");
  roofRibs(c, eaveX - 0.2, roofEaveY, ridgeY + 0.2, 0.2, zB - 0.2, c.zF - 0.1, 1.3, STEEL, "steel");
  blk(c, -0.7, 0.7, ridgeY + 0.3, ridgeY + 0.6, zB - 0.4, c.zF + 0.1, STEEL_DARK, "steel");
  blk(c, -1.2, 1.2, ridgeY + 0.3, ridgeY + 1.3, -6, 4, STEEL_DARK, "steel");
  blk(c, -1.6, 1.6, ridgeY + 1.3, ridgeY + 1.55, -6.3, 4.3, CLAD, "steel");
  // the machine room on the roof over the wheel, and the gearbox hung under it
  const mz0 = c.headZ - 6.5, mz1 = c.zF - 0.6;
  blk(c, -3, 3, ridgeY - 0.4, ridgeY + 2.8, mz0, mz1, CLAD, "steel", "both");
  blk(c, -3.3, 3.3, ridgeY + 2.8, ridgeY + 3.1, mz0 - 0.3, mz1 + 0.3, STEEL_DARK, "steel");
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) blk(c, s * 3, s * 3.08, ridgeY + 0.9 + i * 0.55, ridgeY + 1.2 + i * 0.55, mz0 + 1, mz1 - 1, STEEL_DARK, "steel");
  blk(c, -0.8, 0.8, ridgeY + 2.4, ridgeY + 2.7, mz0 + 0.2, mz0 + 1.2, FRAME, "steel");
  blk(c, 1.4, 1.9, ridgeY + 3.1, ridgeY + 5, mz0 + 1.2, mz0 + 1.7, STEEL_DARK, "steel");
  for (const z of [c.headZ - 2.3, c.zF - 0.35]) blk(c, -colX, colX, y0 + 1.6, y0 + 2.2, z - 0.25, z + 0.25, STEEL_DARK, "steel");
  blk(c, -1.2, 1.2, c.headY + 1.4, y0 + 1.6, c.headZ - 1.6, c.headZ + 0.5, STEEL_DARK, "steel");
  blk(c, 1.2, 2.8, c.headY + 1.8, y0 + 1.2, c.headZ - 1.4, c.headZ + 0.2, STEEL, "steel");
  // the back wall: clad either side of the stairs' door, a lintel over it
  pair(c, 2.6, hw, 0.3, y0 + 2.2, zB - 0.15, zB + 0.15, CLAD, "steel");
  blk(c, -2.6, 2.6, 3.6, y0 + 2.2, zB - 0.15, zB + 0.15, CLAD, "steel");
  blk(c, -hw, hw, 0, y0 + 2.2, zB - 0.45, zB - 0.15, CLAD, "steel", "low");
  for (let x = -hw + 0.6; x <= hw - 0.5; x += 1.1) if (Math.abs(x) > 2.8) blk(c, x - 0.1, x + 0.1, 0.3, y0 + 2.2, zB - 0.25, zB - 0.15, STEEL, "steel");
  blk(c, -2.9, 2.9, 3.4, 3.7, zB + 0.15, zB + 0.45, FRAME, "steel");
  // the back bay's sides: a wind screen below and a clad band under the girders
  for (const s of [-1, 1]) {
    blk(c, s * (hw - 0.05) - 0.08, s * (hw - 0.05) + 0.08, 0.3, 2.6, -hd + 0.4, -0.5, CLAD, "steel");
    blk(c, s * (hw - 0.05) - 0.08, s * (hw - 0.05) + 0.08, y0 - 2.6, y0, -hd + 0.4, -0.5, CLAD, "steel");
    blk(c, s * (hw - 0.1) - 0.1, s * (hw - 0.1) + 0.1, 0.3, y0, -hd + 0.4, -0.5, CLAD, "steel", "low");
  }
  // the operator's booth and the ticket booth on the hall floor
  booth(c, 3, colX - 0.7, 0.3, -hd + 1.6, -hd + 5.4, FRAME);
  booth(c, -colX + 0.7, -3, 0.3, -hd + 1.6, -hd + 4.6, STEEL_DARK);
  pair(c, 3, colX - 0.7, 0.3, 3.45, -hd + 1.6, -hd + 5.4, CLAD, "steel", "low");
  // the station board hung on the front truss
  blk(c, -4.6, 4.6, y0 + 0.7, y0 + 2.1, c.zF - 0.15, c.zF, SIGN, "concrete");
  blk(c, -4.4, 4.4, y0 + 0.95, y0 + 1.25, c.zF, c.zF + 0.06, FRAME, "steel");
}

// --- the alpine chalet: stone and timber under one steep roof reaching over the wheel ---

const PLASTER: Rgb = [228, 222, 206];
const ROOF_SHINGLE: Rgb = [84, 66, 54];
const SHUTTER: Rgb = [58, 98, 64];
const FLOWERS: Rgb = [196, 46, 52];

/** A window in the wall at x = +-`x` (facing out), its shutters and flower box. */
function chaletWindow(c: Ctx, x: number, y: number, z: number, flowers: boolean): void {
  const s = Math.sign(x), ax = Math.abs(x);
  blk(c, s * ax, s * (ax + 0.08), y, y + 1.9, z - 0.65, z + 0.65, GLASS, "glass");
  blk(c, s * ax, s * (ax + 0.16), y - 0.15, y, z - 0.8, z + 0.8, PLASTER, "concrete");
  blk(c, s * ax, s * (ax + 0.16), y + 1.9, y + 2.05, z - 0.8, z + 0.8, PLASTER, "concrete");
  blk(c, s * (ax + 0.08), s * (ax + 0.12), y + 0.9, y + 1.0, z - 0.65, z + 0.65, PLASTER, "concrete");
  for (const sz of [-1, 1]) blk(c, s * ax, s * (ax + 0.12), y, y + 1.9, z + sz * 0.8, z + sz * 1.45, SHUTTER, "timber");
  if (flowers) {
    blk(c, s * ax, s * (ax + 0.5), y - 0.6, y - 0.2, z - 0.8, z + 0.8, TIMBER_DARK, "timber");
    blk(c, s * (ax + 0.04), s * (ax + 0.46), y - 0.2, y + 0.1, z - 0.75, z + 0.75, FLOWERS, "timber");
  }
}

/** The same window in the wall at z = `z`, facing +Z (`dir` 1) or -Z (-1). */
function chaletWindowZ(c: Ctx, x: number, y: number, z: number, dir: 1 | -1, flowers: boolean): void {
  const o = (a: number, b: number): [number, number] => (dir > 0 ? [z + a, z + b] : [z - b, z - a]);
  blk(c, x - 0.65, x + 0.65, y, y + 1.9, ...o(0, 0.08), GLASS, "glass");
  blk(c, x - 0.8, x + 0.8, y - 0.15, y, ...o(0, 0.16), PLASTER, "concrete");
  blk(c, x - 0.8, x + 0.8, y + 1.9, y + 2.05, ...o(0, 0.16), PLASTER, "concrete");
  for (const sx of [-1, 1]) blk(c, x + sx * 0.8, x + sx * 1.45, y, y + 1.9, ...o(0, 0.12), SHUTTER, "timber");
  if (flowers) {
    blk(c, x - 0.8, x + 0.8, y - 0.6, y - 0.2, ...o(0, 0.5), TIMBER_DARK, "timber");
    blk(c, x - 0.75, x + 0.75, y - 0.2, y + 0.1, ...o(0.04, 0.46), FLOWERS, "timber");
  }
}

function buildAlpineChalet(c: Ctx): void {
  const hw = c.w / 2, hd = c.d / 2;
  const pitch = 0.47; // tan of the roof's 25 degrees
  const eaveX = 14.4;
  const roofUnder = (x: number): number => c.eaveY + (eaveX - Math.abs(x)) * pitch;
  const ridgeY = roofUnder(0);
  const plinth = 4.5;
  const wallX = hw; // the hall's outer face
  const wallTop = roofUnder(wallX);
  const zB = -hd, zH = 0; // the hall, back to front
  const postX = hw - 0.6;
  const posts = [hd / 2 - 0.3, hd - 0.6];
  const zFront = c.zF - 0.35;
  // the hall: a stone ground floor, two timber storeys over it
  pair(c, wallX - 0.8, wallX, 0, plinth, zB, zH, STONE, "stone");
  blk(c, -wallX, wallX, 0, plinth, zB, zB + 0.8, STONE, "stone");
  pair(c, 2.6, wallX - 0.8, 0, plinth, zH - 0.8, zH, STONE, "stone");
  pair(c, wallX - 0.8, wallX + 0.25, 0, 0.8, zB - 0.25, zH + 0.25, STONE, "stone");
  blk(c, -wallX + 0.8, wallX - 0.8, 0, 0.8, zB - 0.25, zB + 0.8, STONE, "stone");
  pair(c, wallX - 0.75, wallX - 0.05, plinth, wallTop, zB + 0.05, zH - 0.05, TIMBER, "timber");
  blk(c, -wallX + 0.05, wallX - 0.05, plinth, wallTop, zB + 0.05, zB + 0.75, TIMBER, "timber");
  pair(c, 2.6, wallX - 0.75, plinth, 7.4, zH - 0.75, zH - 0.05, TIMBER, "timber");
  blk(c, -wallX + 0.05, wallX - 0.05, 7.4, wallTop, zH - 0.75, zH - 0.05, TIMBER, "timber");
  hallLow(c, wallX, wallTop, 7.4, zB, zH, TIMBER, "timber");
  // the gables over the hall's back and front walls, the front one inside the roof
  for (const [z0, z1] of [[zB + 0.05, zB + 0.75], [zH - 0.75, zH - 0.05]] as const) {
    put(c, { cx: 0, cy: (wallTop + ridgeY - 0.05) / 2, cz: (z0 + z1) / 2, sx: 2 * wallX - 0.1, sy: ridgeY - 0.05 - wallTop, sz: z1 - z0, profile: "gable", color: TIMBER, material: "timber" }, "both");
  }
  // dark timber: corner posts, the storey bands, the door frame over the stairs
  for (const s of [-1, 1]) {
    for (const z of [zB + 0.3, zH - 0.3]) blk(c, s * (wallX + 0.05) - 0.4, s * (wallX + 0.05) + 0.4, plinth, wallTop, z - 0.4, z + 0.4, TIMBER_DARK, "timber");
    for (const y of [plinth, 9.6, 14.4]) blk(c, s * wallX - 0.1, s * wallX + 0.1, y, y + 0.35, zB + 0.7, zH - 0.7, TIMBER_DARK, "timber");
  }
  for (const y of [plinth, 9.6, 14.4]) {
    if (y > 7.4) blk(c, -wallX + 0.7, wallX - 0.7, y, y + 0.35, zH - 0.05, zH + 0.15, TIMBER_DARK, "timber");
    else pair(c, 2.6, wallX - 0.7, y, y + 0.35, zH - 0.05, zH + 0.15, TIMBER_DARK, "timber");
  }
  blk(c, -2.9, 2.9, 7.4, 7.9, zH - 0.05, zH + 0.25, TIMBER_DARK, "timber");
  pair(c, 2.6, 2.95, 0, 7.4, zH - 0.05, zH + 0.25, TIMBER_DARK, "timber");
  // the windows: stone-framed below, shuttered with flower boxes above
  for (const s of [-1, 1]) {
    for (const z of [zB + 2.4, (zB + zH) / 2, zH - 2.4]) {
      blk(c, s * wallX, s * (wallX + 0.08), 1.5, 3.5, z - 0.7, z + 0.7, GLASS, "glass");
      blk(c, s * wallX, s * (wallX + 0.2), 3.5, 3.85, z - 1, z + 1, PLASTER, "concrete");
      for (const y of [5.8, 10.6]) chaletWindow(c, s * wallX, y, z, true);
      chaletWindow(c, s * wallX, 15.4, z, false);
    }
    for (const x of [hw - 2.8]) {
      chaletWindowZ(c, s * x, 10.6, zH, 1, true);
      chaletWindowZ(c, s * x, 15.4, zH, 1, false);
      chaletWindowZ(c, s * x, 10.6, zB, -1, true);
    }
    // the balcony along each side, on brackets
    const bx0 = wallX, bx1 = wallX + 1.6;
    blk(c, s * bx0, s * bx1, 9.95, 10.25, zB + 1.2, zH - 1.2, TIMBER_DARK, "timber");
    blk(c, s * (bx1 - 0.15), s * bx1, 11.2, 11.45, zB + 1.2, zH - 1.2, TIMBER_DARK, "timber");
    for (let z = zB + 1.4; z <= zH - 1.3; z += 0.7) blk(c, s * (bx1 - 0.13), s * (bx1 - 0.02), 10.25, 11.2, z - 0.14, z + 0.14, TIMBER, "timber");
    for (const z of [zB + 1.6, (zB + zH) / 2, zH - 1.6]) bar(c, [s * wallX, 8.6, z], [s * (bx1 - 0.2), 9.95, z], 0.25, TIMBER_DARK, "timber");
  }
  // the clock on the inner gable, over the stairs
  blk(c, -1.1, 1.1, wallTop + 0.6, wallTop + 2.8, zH - 0.05, zH + 0.05, PLASTER, "concrete");
  blk(c, -0.08, 0.08, wallTop + 1.7, wallTop + 2.55, zH + 0.05, zH + 0.1, TIMBER_DARK, "timber");
  blk(c, -0.08, 0.6, wallTop + 1.62, wallTop + 1.78, zH + 0.05, zH + 0.1, TIMBER_DARK, "timber");
  // eave brackets under the hall's deep eaves
  for (const s of [-1, 1]) for (const z of [zB + 0.6, (zB + zH) / 2, zH - 0.6]) bar(c, [s * (wallX + 0.05), wallTop - 3.2, z], [s * (eaveX - 1.2), roofUnder(eaveX - 1.2) - 0.25, z], 0.35, TIMBER_DARK, "timber");
  // the open frame over the platform: posts, wall plates, eave purlins, tie beams
  for (const s of [-1, 1]) {
    for (const z of posts) {
      blk(c, s * postX - 0.75, s * postX + 0.75, 0, 1.0, z - 0.75, z + 0.75, STONE, "stone");
      blk(c, s * postX - 0.45, s * postX + 0.45, 1.0, roofUnder(postX) - 0.45, z - 0.45, z + 0.45, TIMBER_DARK, "timber", z === posts[1] ? "both" : "full");
      // knee braces out to the eave purlin
      bar(c, [s * postX, c.eaveY - 3.6, z], [s * (eaveX - 1.9), c.eaveY + 0.1, z], 0.32, TIMBER_DARK, "timber");
    }
    blk(c, s * postX - 0.4, s * postX + 0.4, roofUnder(postX) - 0.85, roofUnder(postX) - 0.1, zH, c.zF, TIMBER_DARK, "timber", "both");
    blk(c, s * (eaveX - 1.2) - 0.3, s * (eaveX - 1.2) + 0.3, c.eaveY + 0.1, roofUnder(eaveX - 0.9) - 0.05, zB - 0.6, c.zF, TIMBER_DARK, "timber");
    // the braces that carry the frame forward over the wheel
    bar(c, [s * postX, c.eaveY - 6.5, posts[1]! + 0.4], [s * postX, roofUnder(postX) - 0.9, zFront - 0.3], 0.4, TIMBER_DARK, "timber");
    bar(c, [s * postX, c.eaveY - 3, posts[0]! + 0.4], [s * postX, roofUnder(postX) - 0.9, posts[1]! - 0.5], 0.3, TIMBER_DARK, "timber");
    bar(c, [s * postX, c.eaveY - 3, posts[1]! - 0.4], [s * postX, roofUnder(postX) - 0.9, posts[0]! + 0.5], 0.3, TIMBER_DARK, "timber");
    // the boarded apron under the eaves between the posts
    blk(c, s * (eaveX - 1.2) - 0.1, s * (eaveX - 1.2) + 0.1, c.eaveY + 0.25, roofUnder(eaveX - 1.3) - 0.1, zH + 0.3, c.zF - 0.3, TIMBER, "timber");
  }
  for (const z of [...posts, zFront]) {
    blk(c, -eaveX + 0.9, eaveX - 0.9, c.eaveY, c.eaveY + 0.6, z - 0.35, z + 0.35, TIMBER_DARK, "timber", z === zFront ? "both" : "full");
    blk(c, -0.25, 0.25, c.eaveY + 0.6, ridgeY - 0.1, z - 0.25, z + 0.25, TIMBER_DARK, "timber");
    for (const s of [-1, 1]) bar(c, [s * 0.25, ridgeY - 2.6, z], [s * 7, roofUnder(7) - 0.15, z], 0.3, TIMBER_DARK, "timber");
  }
  // the front truss: a collar, struts to the tie beam, the station board
  const collarY = c.eaveY + 4.2;
  const collarX = eaveX - (collarY - c.eaveY) / pitch - 0.2;
  blk(c, -collarX, collarX, collarY, collarY + 0.45, zFront - 0.25, zFront + 0.25, TIMBER_DARK, "timber");
  for (const s of [-1, 1]) bar(c, [s * 4.4, c.eaveY + 0.6, zFront], [s * 1.6, collarY, zFront], 0.3, TIMBER_DARK, "timber");
  blk(c, -3.6, 3.6, c.eaveY + 1.2, c.eaveY + 2.4, zFront + 0.25, zFront + 0.4, PLASTER, "concrete");
  blk(c, -3.4, 3.4, c.eaveY + 1.6, c.eaveY + 2.0, zFront + 0.4, zFront + 0.45, TIMBER_DARK, "timber");
  // the roof: shingle courses, carved barge boards, snow logs, a ridge cap
  pitchedRoof(c, eaveX + 0.6, c.eaveY - 0.6 * pitch, ridgeY, zB - 0.8, c.zF, 0.6, ROOF_SHINGLE, "timber", "both");
  for (const at of [0.25, 0.5, 0.75]) roofStrip(c, eaveX + 0.6, c.eaveY - 0.6 * pitch, ridgeY + 0.6 / Math.cos(Math.atan(pitch)), at, zB - 0.7, c.zF - 0.1, 0.35, 0.12, TIMBER_DARK, "timber");
  roofStrip(c, eaveX + 0.6, c.eaveY - 0.6 * pitch, ridgeY + 0.6 / Math.cos(Math.atan(pitch)), 0.93, zB - 0.6, c.zF - 0.2, 0.35, 0.35, TIMBER, "timber");
  blk(c, -0.55, 0.55, ridgeY + 0.35, ridgeY + 0.9, zB - 0.8, c.zF, TIMBER_DARK, "timber");
  for (const z of [zB - 0.8, c.zF - 0.16]) {
    const a = Math.atan(pitch);
    for (const s of [-1, 1]) {
      const len = (eaveX + 0.6) / Math.cos(a);
      put(c, { cx: (s * (eaveX + 0.6)) / 2, cy: (c.eaveY - 0.6 * pitch + ridgeY) / 2 + 0.2, cz: z + 0.12, sx: len, sy: 1.1, sz: 0.25, rotZ: -s * a, color: TIMBER, material: "timber" }, "full");
    }
  }
  // the ridge turret and the chimney
  const tz = zB + 4.5;
  blk(c, -1.1, 1.1, ridgeY - 1, ridgeY + 2.6, tz - 1.1, tz + 1.1, TIMBER, "timber", "both");
  pair(c, 1.1, 1.18, ridgeY + 1, ridgeY + 2.2, tz - 0.6, tz + 0.6, TIMBER_DARK, "timber");
  put(c, { cx: 0, cy: ridgeY + 3.4, cz: tz, sx: 3, sy: 1.6, sz: 3, profile: "gable", color: ROOF_SHINGLE, material: "timber" }, "full");
  blk(c, -0.08, 0.08, ridgeY + 4.2, ridgeY + 5.2, tz - 0.08, tz + 0.08, STEEL_DARK, "steel");
  const chx = -4.2, chz = zB + 2.4;
  blk(c, chx - 0.8, chx + 0.8, roofUnder(chx) - 1, ridgeY + 1.6, chz - 0.8, chz + 0.8, STONE, "stone", "both");
  blk(c, chx - 1, chx + 1, ridgeY + 1.6, ridgeY + 1.9, chz - 1, chz + 1, STONE, "stone");
}

// --- glass modern: a two-storey glass box under a white wing on tree columns ---

const WHITE: Rgb = [222, 222, 216];
const MULLION: Rgb = [58, 62, 68];
const ACCENT: Rgb = [0, 128, 140];
const SOLAR: Rgb = [40, 56, 92];
const SHRUB: Rgb = [74, 118, 58];

function buildGlassModern(c: Ctx): void {
  const hw = c.w / 2, hd = c.d / 2;
  const gx = hw - 0.4; // the curtain wall
  const zB = -hd + 0.4, zH = -0.6;
  const slab0 = 9.3, slab1 = 10;
  const roof0 = c.eaveY, roof1 = c.eaveY + 1;
  const roofX = 14.6;
  // the wing: one white slab from the back of the hall to over the wheel
  blk(c, -roofX, roofX, roof0, roof1, zB - 0.8, c.zF, WHITE, "concrete", "both");
  blk(c, -roofX - 0.05, roofX + 0.05, roof0 + 0.25, roof0 + 0.7, c.zF - 0.05, c.zF + 0.05, ACCENT, "steel");
  pair(c, roofX, roofX + 0.05, roof0 + 0.25, roof0 + 0.7, zB - 0.8, c.zF - 0.05, ACCENT, "steel");
  blk(c, -2.6, 2.6, roof1, roof1 + 0.5, 2, c.zF - 3, GLASS, "glass");
  for (let z = 2.9; z < c.zF - 3; z += 1.8) blk(c, -2.7, 2.7, roof1 + 0.5, roof1 + 0.62, z - 0.08, z + 0.08, MULLION, "steel");
  // the glass box: two storeys, the floor slab showing between them
  pair(c, gx - 0.06, gx + 0.06, 0, slab0, zB, zH, GLASS, "glass");
  pair(c, gx - 0.06, gx + 0.06, slab1, roof0, zB, zH, GLASS, "glass");
  blk(c, -gx, gx, 0, slab0, zB - 0.06, zB + 0.06, GLASS, "glass");
  blk(c, -gx, gx, slab1, roof0, zB - 0.06, zB + 0.06, GLASS, "glass");
  pair(c, 2.6, gx, 0, slab0, zH - 0.06, zH + 0.06, GLASS, "glass");
  blk(c, -2.6, 2.6, 7.2, slab0, zH - 0.06, zH + 0.06, GLASS, "glass");
  blk(c, -gx, gx, slab1, roof0, zH - 0.06, zH + 0.06, GLASS, "glass");
  hallLow(c, gx, roof0, 7.2, zB, zH, GLASS, "glass");
  blk(c, -gx - 0.3, gx + 0.3, slab0, slab1, zB - 0.3, zH + 0.3, WHITE, "concrete");
  // mullions and transoms
  for (const s of [-1, 1]) {
    for (let z = zB; z <= zH + 0.01; z += (zH - zB) / 6) blk(c, s * (gx + 0.06), s * (gx + 0.22), 0, roof0, z - 0.09, z + 0.09, MULLION, "steel");
    for (const y of [4.6, 14.7]) blk(c, s * (gx + 0.06), s * (gx + 0.18), y - 0.08, y + 0.08, zB, zH, MULLION, "steel");
    // sun fins on the upper storey
    for (const y of [12.4, 14.7, 17]) blk(c, s * (gx + 0.22), s * (gx + 1.1), y - 0.06, y + 0.06, zB + 0.3, zH - 0.3, STEEL, "steel");
  }
  for (let x = -gx; x <= gx + 0.01; x += (2 * gx) / 6) {
    const mid = Math.abs(x) < 2.7;
    blk(c, x - 0.09, x + 0.09, mid ? 7.2 : 0, roof0, zH + 0.06, zH + 0.22, MULLION, "steel");
    blk(c, x - 0.09, x + 0.09, 0, roof0, zB - 0.22, zB - 0.06, MULLION, "steel");
  }
  blk(c, -2.7, 2.7, 7.1, 7.35, zH + 0.06, zH + 0.3, MULLION, "steel");
  blk(c, -gx, gx, 14.62, 14.78, zH + 0.06, zH + 0.18, MULLION, "steel");
  // the terraces in front of the upper storey, glass balustrades
  for (const s of [-1, 1]) {
    blk(c, s * 3, s * gx, slab0, slab1, zH + 0.3, zH + 3.2, WHITE, "concrete");
    blk(c, s * 3, s * gx, slab1, slab1 + 1.1, zH + 3.1, zH + 3.2, GLASS, "glass");
    blk(c, s * 2.95, s * 3.05, slab1, slab1 + 1.1, zH + 0.3, zH + 3.2, GLASS, "glass");
    blk(c, s * 3, s * gx, slab1 + 1.1, slab1 + 1.2, zH + 3.05, zH + 3.25, MULLION, "steel");
  }
  // inside: a timber ticket counter and benches
  blk(c, 3.2, 7.2, 0, 1.1, zB + 0.8, zB + 1.6, TIMBER, "timber");
  for (const z of [zB + 4, zB + 6.5]) pair(c, 4, 7.6, 0.4, 0.8, z - 0.35, z + 0.35, TIMBER, "timber");
  // the lift core: a white tower through the wing, a glass lantern on top
  const cx0 = -gx + 0.4, cx1 = -gx + 4, cz0 = zB + 0.4, cz1 = zB + 4;
  blk(c, cx0, cx1, 0, roof1 + 5, cz0, cz1, WHITE, "concrete", "both");
  blk(c, cx0 - 0.05, cx1 + 0.05, roof1 + 2.4, roof1 + 3, cz0 - 0.05, cz1 + 0.05, ACCENT, "steel");
  blk(c, cx0 + 0.2, cx1 - 0.2, roof1 + 5, roof1 + 7.4, cz0 + 0.2, cz1 - 0.2, GLASS, "glass", "both");
  blk(c, cx0 - 0.3, cx1 + 0.3, roof1 + 7.4, roof1 + 7.9, cz0 - 0.3, cz1 + 0.3, WHITE, "concrete");
  // solar panels on the wing over the hall
  for (let x = -gx + 5.6; x <= gx - 1.5; x += 2.7) {
    for (const z of [zB + 1.5, zB + 4.5, zB + 7.5]) {
      put(c, { cx: x, cy: roof1 + 0.45, cz: z, sx: 2.4, sy: 0.12, sz: 2.2, rotX: -0.3, color: SOLAR, material: "steel" }, "full");
      blk(c, x - 0.1, x + 0.1, roof1, roof1 + 0.4, z - 0.1, z + 0.1, MULLION, "steel");
    }
  }
  // the tree columns that carry the wing over the platform
  // the fork stands over the platform's railing, so only the trunk passes its deck
  const tx = hw - 0.6, tz = hd - 0.6, fork = c.headY - PLATFORM_Y.above + 0.4;
  for (const s of [-1, 1]) {
    blk(c, s * tx - 0.9, s * tx + 0.9, 0, 0.5, tz - 0.9, tz + 0.9, WHITE, "concrete");
    blk(c, s * tx - 0.4, s * tx + 0.4, 0.5, fork, tz - 0.4, tz + 0.4, STEEL, "steel", "both");
    for (const [bx, bz] of [[tx + 3, tz - 6], [tx + 3, c.zF - 1.2], [tx - 3, tz]] as const) {
      bar(c, [s * tx, fork - 0.2, tz], [s * bx, roof0 + 0.1, bz], 0.45, STEEL, "steel", bx > tx && bz > tz ? "both" : "full");
    }
  }
  // the hall's own columns at its front corners carry the wing's back half
  pair(c, gx - 0.3, gx + 0.3, 0, roof0, zH + 3.4, zH + 4, STEEL, "steel");
  // a timber slat soffit under the wing over the platform
  for (let x = -roofX + 0.8; x <= roofX - 0.7; x += 1.2) blk(c, x - 0.2, x + 0.2, roof0 - 0.25, roof0, zH + 0.4, c.zF - 0.4, TIMBER, "timber");
  for (const z of [zH + 0.4, c.zF - 0.6]) blk(c, -roofX + 0.4, roofX - 0.4, roof0 - 0.45, roof0 - 0.25, z, z + 0.2, MULLION, "steel");
  // glass wind screens beside the stairs' landing, planters at the columns' feet
  for (const s of [-1, 1]) {
    for (let z = zH + 4.6; z < tz - 1.5; z += 2.2) {
      blk(c, s * (gx - 0.05), s * (gx + 0.05), 0.15, 2.6, z, z + 2, GLASS, "glass");
      blk(c, s * (gx - 0.12), s * (gx + 0.12), 0, 2.7, z - 0.1, z + 0.02, MULLION, "steel");
    }
    blk(c, s * (tx - 2.2), s * (tx - 1), 0, 0.7, tz - 2.4, tz + 0.6, WHITE, "concrete");
    blk(c, s * (tx - 2.1), s * (tx - 1.1), 0.7, 0.9, tz - 2.3, tz + 0.5, SHRUB, "timber");
  }
  // the panorama box cantilevered off the upper storey's right side
  const p0 = -hd + 3.5, p1 = -hd + 9.5, px1 = gx + 3.6;
  blk(c, gx, px1, slab0 + 1.2, slab0 + 1.7, p0, p1, WHITE, "concrete", "both");
  blk(c, gx, px1, slab0 + 7, slab0 + 7.5, p0, p1, WHITE, "concrete");
  blk(c, px1 - 0.1, px1, slab0 + 1.7, slab0 + 7, p0 + 0.1, p1 - 0.1, GLASS, "glass");
  for (const z of [p0, p1 - 0.1]) blk(c, gx + 0.25, px1, slab0 + 1.7, slab0 + 7, z, z + 0.1, GLASS, "glass");
  for (const z of [p0 + 0.1, (p0 + p1) / 2, p1 - 0.1]) blk(c, px1 - 0.05, px1 + 0.12, slab0 + 1.7, slab0 + 7, z - 0.08, z + 0.08, MULLION, "steel");
  blk(c, gx, px1 + 0.05, slab0 + 6.6, slab0 + 7, p0 - 0.05, p1 + 0.05, ACCENT, "steel");
  bar(c, [gx + 0.2, slab0 - 2, (p0 + p1) / 2], [px1 - 0.4, slab0 + 1.2, (p0 + p1) / 2], 0.35, STEEL, "steel");
}

// --- the concrete drive: a brutalist hall, portal frames and the drive room over the wheel ---

const CONC_DARK: Rgb = [136, 133, 126];
const CONC_LIGHT: Rgb = [190, 187, 180];
const ORANGE: Rgb = [214, 110, 40];

function buildConcreteDrive(c: Ctx): void {
  const hw = c.w / 2, hd = c.d / 2;
  const wx = hw - 0.4; // the hall's outer face
  const zB = -hd, zH = -0.6;
  const roof0 = c.eaveY + 1.8, roof1 = roof0 + 1;
  const roofX = 14.8;
  // the hall: concrete walls, a deep fin every bay, ribbon windows between
  pair(c, wx - 0.8, wx, 0, roof0, zB, zH, CONCRETE, "concrete");
  blk(c, -wx, wx, 0, roof0, zB, zB + 0.8, CONCRETE, "concrete");
  pair(c, 2.6, wx, 0, roof0, zH - 0.8, zH, CONCRETE, "concrete");
  blk(c, -2.6, 2.6, 9, roof0, zH - 0.8, zH, CONCRETE, "concrete");
  hallLow(c, wx, roof0, 9, zB, zH, CONCRETE, "concrete");
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 5; i++) {
      const z = zB + 0.5 + ((zH - zB - 1) * i) / 5;
      blk(c, s * (wx - 0.05), s * (wx + 0.55), 0, roof0, z - 0.35, z + 0.35, CONC_LIGHT, "concrete");
    }
    blk(c, s * wx, s * (wx + 0.08), 12.4, 17.6, zB + 0.9, zH - 0.9, GLASS, "glass");
    blk(c, s * wx, s * (wx + 0.08), 2, 5, zB + 0.9, zH - 0.9, GLASS, "glass");
    blk(c, s * (wx - 0.1), s * (wx + 0.25), 11.8, 12.4, zB + 0.85, zH - 0.85, CONC_DARK, "concrete");
    blk(c, s * (wx - 0.1), s * (wx + 0.25), 17.6, 18.2, zB + 0.85, zH - 0.85, CONC_DARK, "concrete");
    blk(c, s * (wx - 0.1), s * (wx + 0.2), 0, 1, zB + 0.85, zH - 0.85, CONC_DARK, "concrete");
  }
  // the back: a door and the canopy over it
  blk(c, -2.4, 2.4, 0, 4.2, zB - 0.06, zB, GLASS, "glass");
  blk(c, -4, 4, 4.6, 5.1, zB - 2.4, zB, CONC_LIGHT, "concrete");
  blk(c, -wx + 1, wx - 1, 12.4, 17.6, zB - 0.08, zB, GLASS, "glass");
  // the front over the platform: the stairs' door and the control room's bay window
  pair(c, 2.6, 3, 0, 9, zH, zH + 0.3, CONC_DARK, "concrete");
  blk(c, -3, 3, 9, 9.6, zH, zH + 0.3, CONC_DARK, "concrete");
  const bx0 = 3.8, bx1 = wx - 1.2, by0 = 12.6, by1 = 16.8;
  blk(c, bx0, bx1, by0 - 0.5, by0, zH, zH + 2.4, CONC_LIGHT, "concrete", "both");
  blk(c, bx0, bx1, by1, by1 + 0.5, zH, zH + 2.4, CONC_LIGHT, "concrete");
  blk(c, bx0 + 0.1, bx1 - 0.1, by0, by1, zH + 2.2, zH + 2.3, GLASS, "glass");
  blk(c, bx1 - 0.1, bx1, by0, by1, zH, zH + 2.3, GLASS, "glass");
  blk(c, bx0, bx0 + 0.1, by0, by1, zH, zH + 2.3, GLASS, "glass");
  for (let x = bx0 + 1.2; x < bx1 - 0.5; x += 1.4) blk(c, x - 0.07, x + 0.07, by0, by1, zH + 2.3, zH + 2.4, STEEL_DARK, "steel");
  blk(c, -bx1, -bx0, by0, by1, zH, zH + 0.08, GLASS, "glass");
  // the portal frames over the platform, beams cantilevered out to the roof's edge
  const px = hw - 0.8;
  const portals = [hd / 2 - 1.5, hd - 2];
  const front = c.zF - 0.7;
  for (const z of portals) {
    pair(c, px - 0.7, px + 0.7, 0, roof0, z - 0.7, z + 0.7, CONCRETE, "concrete", "both");
    blk(c, -roofX, roofX, c.eaveY, roof0, z - 0.6, z + 0.6, CONCRETE, "concrete", z === portals[1] ? "both" : "full");
    bars(c, [px + 0.5, c.eaveY - 4, z], [roofX - 1.2, c.eaveY + 0.2, z], 0.8, CONCRETE, "concrete");
  }
  blk(c, -roofX, roofX, c.eaveY, roof0, front - 0.6, front + 0.6, CONCRETE, "concrete", "both");
  pair(c, roofX - 1.2, roofX, c.eaveY, roof0, zH, front - 0.6, CONCRETE, "concrete", "both");
  for (const s of [-1, 1]) bar(c, [s * px, c.eaveY - 5, portals[1]! + 0.6], [s * px, c.eaveY + 0.2, front - 0.6], 0.8, CONCRETE, "concrete");
  // the roof slab, its parapet and the hall's roof lights
  blk(c, -roofX, roofX, roof0, roof1, zB - 0.6, c.zF, CONC_LIGHT, "concrete", "both");
  blk(c, -roofX, roofX, roof1, roof1 + 0.8, zB - 0.6, zB - 0.1, CONC_LIGHT, "concrete");
  pair(c, roofX - 0.5, roofX, roof1, roof1 + 0.8, zB - 0.1, c.zF - 0.5, CONC_LIGHT, "concrete");
  blk(c, -roofX, roofX, roof1, roof1 + 0.8, c.zF - 0.5, c.zF, CONC_LIGHT, "concrete");
  blk(c, -6.5, 6.5, roof0 + 0.25, roof0 + 0.95, c.zF, c.zF + 0.08, ORANGE, "steel");
  for (const x of [-6, 0, 6]) put(c, { cx: x, cy: roof1 + 0.7, cz: (zB + zH) / 2, sx: 2.6, sy: 1.4, sz: zH - zB - 3, profile: "gable", color: GLASS, material: "glass" }, "full");
  // the drive room over the wheel: concrete, a ribbon of glass, the louvred plant wall
  const dz0 = c.headZ - 10, dz1 = c.zF - 0.3, dy1 = roof1 + 6;
  blk(c, -6.5, 6.5, roof1, dy1, dz0, dz1, CONCRETE, "concrete", "both");
  blk(c, -6.8, 6.8, dy1, dy1 + 0.6, dz0 - 0.3, dz1, CONC_LIGHT, "concrete");
  blk(c, -6.8, 6.8, dy1 - 0.9, dy1 - 0.4, dz0 - 0.08, dz1, ORANGE, "steel");
  pair(c, 6.5, 6.58, roof1 + 2, roof1 + 4.4, dz0 + 0.6, dz1 - 0.6, GLASS, "glass");
  blk(c, -6, 6, roof1 + 2, roof1 + 4.4, dz1, dz1 + 0.08, GLASS, "glass");
  for (let i = 0; i < 5; i++) blk(c, -5, 5, roof1 + 1 + i * 0.85, roof1 + 1.35 + i * 0.85, dz0 - 0.12, dz0, STEEL_DARK, "steel");
  blk(c, 3.5, 3.8, dy1 + 0.6, dy1 + 6, dz0 + 1.5, dz0 + 1.8, STEEL_DARK, "steel");
  // the gearbox and motor under the front beam, on the wheel's axis
  blk(c, -1.3, 1.3, c.headY + 1.4, c.eaveY, c.headZ - 1.8, c.headZ + 0.4, STEEL_DARK, "steel");
  blk(c, 1.3, 3.1, c.headY + 1.9, c.eaveY - 0.3, c.headZ - 1.6, c.headZ + 0.2, STEEL, "steel");
  blk(c, -1.6, 1.6, c.eaveY, c.eaveY + 0.6, c.headZ - 6, c.zF - 1.3, STEEL_DARK, "steel");
  // a coffered ceiling over the platform: ribs between the frames
  for (const x of [-10, -5, 5, 10]) blk(c, x - 0.35, x + 0.35, c.eaveY + 0.8, roof0, zH, front - 0.6, CONC_DARK, "concrete");
  // the relief on the hall's front, over the bay window
  for (let row = 0; row < 3; row++) {
    for (let x = -wx + 1.4; x <= wx - 1.3; x += 1.85) {
      const k = (row + Math.round((x + wx) / 1.85)) % 2;
      blk(c, x - 0.6, x + 0.6, by1 + 1.2 + row * 1.3, by1 + 2.2 + row * 1.3, zH, zH + 0.25 + 0.25 * k, k ? CONC_LIGHT : CONC_DARK, "concrete");
    }
  }
  // slit windows either side of the stairs' door
  for (const s of [-1, 1]) for (const x of [4.5, 6.2, 7.9]) blk(c, s * x - 0.3, s * x + 0.3, 1.5, 9.5, zH, zH + 0.08, GLASS, "glass");
  // capitals on the frame columns
  for (const z of portals) pair(c, px - 1, px + 1, c.eaveY - 1.2, c.eaveY, z - 1, z + 1, CONCRETE, "concrete");
  // plant on the drive room's roof: cooling units, a hoist beam, a railing
  for (const x of [-4, -1.2]) blk(c, x - 1.1, x + 1.1, dy1 + 0.6, dy1 + 2, dz0 + 1.2, dz0 + 3.4, CONC_LIGHT, "concrete");
  for (const x of [-4, -1.2]) blk(c, x - 0.7, x + 0.7, dy1 + 2, dy1 + 2.15, dz0 + 1.6, dz0 + 3, STEEL_DARK, "steel");
  blk(c, -6.4, 6.4, dy1 + 1.6, dy1 + 1.7, dz1 - 0.4, dz1 - 0.3, STEEL, "steel");
  for (let x = -6.3; x <= 6.31; x += 2.1) blk(c, x - 0.05, x + 0.05, dy1 + 0.6, dy1 + 1.6, dz1 - 0.4, dz1 - 0.3, STEEL, "steel");
  // the station's name band on each side of the hall, and a flag mast at the back
  pair(c, wx + 0.55, wx + 0.62, roof0 - 2.2, roof0 - 0.8, zB + 2, zB + 9, ORANGE, "steel");
  blk(c, -wx + 1, -wx + 1.3, roof1, roof1 + 9, zB + 1, zB + 1.3, STEEL, "steel");
  blk(c, -wx + 1.3, -wx + 3.3, roof1 + 7.6, roof1 + 8.9, zB + 1.1, zB + 1.2, ORANGE, "steel");
}

const BUILDERS: Record<StationType, (c: Ctx) => void> = {
  open_gantry: buildOpenGantry,
  alpine_chalet: buildAlpineChalet,
  glass_modern: buildGlassModern,
  concrete_drive: buildConcreteDrive,
};

function shedCtx(type: StationType): Ctx {
  const dims = STATION_DIMS[type];
  const headZ = headOverhangFor(dims.d);
  const c: Ctx = { w: dims.w, d: dims.d, headY: dims.ropeHeadY, headZ, eaveY: dims.ropeHeadY + ROOF_CLEAR, zF: headZ + 0.5, out: [], low: [] };
  BUILDERS[type](c);
  return c;
}

/** Every box of a station type's shed, at the type's own footprint and head height. */
export function shedBoxes(type: StationType): PropBox[] {
  return shedCtx(type).out;
}

/** The low detail's boxes: the deck, the hall, the roof and what carries it. */
export function shedLodBoxes(type: StationType): PropBox[] {
  return shedCtx(type).low;
}

/** The shed parameter's value per station type (parameter values are plain words). */
export const SHED_VALUES: Readonly<Record<StationType, string>> = {
  open_gantry: "gantry", alpine_chalet: "chalet", glass_modern: "glass", concrete_drive: "drive",
};
const SHED_PARAMS: ParamSpec[] = [{
  name: "type", title: "Station type", default: "gantry",
  values: [
    { value: "gantry", title: "Open gantry" },
    { value: "chalet", title: "Alpine chalet" },
    { value: "glass", title: "Glass modern" },
    { value: "drive", title: "Concrete drive" },
  ],
}];
const typeOf = (values?: Record<string, string>): StationType => {
  const v = resolveParams(SHED_PARAMS, values).type;
  return STATION_TYPES.find((t) => SHED_VALUES[t] === v)!;
};
export function cableCarShed(values?: Record<string, string>): MeshBuilder {
  return propModel(separateCoplanar(shedBoxes(typeOf(values))));
}
export function cableCarShedLod(values?: Record<string, string>): MeshBuilder {
  return propModel(separateCoplanar(shedLodBoxes(typeOf(values))));
}

export const CABLE_CAR_PROPS: ProceduralDesign[] = [{
  id: "proc-prop-cablecar-shed",
  title: "Cable Car Station Shed",
  build: cableCarShed,
  buildLod: cableCarShedLod,
  lodTriangles: 200,
  params: SHED_PARAMS,
  catalog: { category: "Props", group: "props", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" },
}];
