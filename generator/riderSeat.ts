// Where the game's avatar sits when it rides a vehicle (docs/models/rider-seat.md).
//
// Measured from the built model, not declared: every vehicle's top surface is laid
// out as a height map seen from above, and the seat is the first flat stretch of
// roof from the nose back -- in the head section, as near the front end as the roof
// allows -- that is at roof level (not a low buffer beam or a bonnet's nose) and
// clear of anything standing on the roof around it (a pantograph, a horn, a fan, an
// exhaust). Only where the front has no such spot does the seat move back along the
// roof; with none at all it is the top of the body's middle. Never inside: the
// interior is left out of the triangles.
//
// The search runs in the game's vehicle frame (nose at min X, the yaw the game
// turns the model by) and the seat is handed back in the model's own frame, so the
// game carries it into its frame as it carries the smoke anchors.

import type { Tri, Vec3 } from "./glbTriangles.ts";

/** The height map's cell, metres. */
const CELL = 0.1;
/** The seat's footprint: along the body and across it, metres (a sitting figure). */
const SEAT_LENGTH = 0.8;
const SEAT_WIDTH = 0.6;
/** How uneven the roof under the seat may be, metres: a cab roof's gentle slope still seats a figure. */
const FLAT = 0.25;
/** How far round the seat nothing may stand above it, metres along and across. */
const MARGIN_ALONG = 0.3;
const MARGIN_ACROSS = 0.2;
/** How much higher than the seat a part round it may stand before it is in the way, metres. */
const CLEAR_ABOVE = 0.15;
/**
 * The share of the roof's height above the body's bottom the seat must reach: the
 * roof, not a buffer beam or a low bonnet. The roof's height is the centreline's
 * typical top (ROOF_QUANTILE of its cells), not its highest point -- a tail fin, a
 * funnel or a raised pantograph is not the roof.
 */
const ROOF_SHARE = 0.7;
const ROOF_QUANTILE = 0.75;
/** How far over the roof's height the seat may be: on the roof, never on top of a box standing on it (an air conditioner, a pantograph's frame). */
const ROOF_ABOVE = 0.35;

/** Turn a point about +Y by `deg` (three.js rotation.y: +Z turns toward +X). */
function turn(p: Vec3, deg: number): Vec3 {
  if (deg === 0) return p;
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

/** The roof's height map: the highest surface over each cell, seen from above; -Infinity where nothing is. */
export interface HeightMap {
  x0: number;
  z0: number;
  nx: number;
  nz: number;
  top: Float64Array;
  minY: number;
  maxY: number;
}

/** Lay the triangles (already in the vehicle frame) out as a height map. */
export function heightMap(tris: readonly (readonly [Vec3, Vec3, Vec3])[]): HeightMap {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const t of tris) {
    for (const p of t) {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    }
  }
  const nx = Math.max(1, Math.ceil((x1 - x0) / CELL) + 1);
  const nz = Math.max(1, Math.ceil((z1 - z0) / CELL) + 1);
  const top = new Float64Array(nx * nz).fill(-Infinity);
  for (const [a, b, c] of tris) {
    const ix0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - x0) / CELL));
    const ix1 = Math.min(nx - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - x0) / CELL));
    const iz0 = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - z0) / CELL));
    const iz1 = Math.min(nz - 1, Math.ceil((Math.max(a[2], b[2], c[2]) - z0) / CELL));
    // the triangle's plan, for the barycentric height at each cell centre it covers
    const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    const flat = Math.abs(d) < 1e-12;
    const highest = Math.max(a[1], b[1], c[1]);
    for (let ix = ix0; ix <= ix1; ix++) {
      const x = x0 + ix * CELL;
      for (let iz = iz0; iz <= iz1; iz++) {
        const z = z0 + iz * CELL;
        let y: number;
        if (flat) {
          // seen edge-on from above (a wall): its top edge counts only on the cells it passes over
          if (!nearSegment(x, z, a, b) && !nearSegment(x, z, b, c) && !nearSegment(x, z, c, a)) continue;
          y = highest;
        } else {
          let l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d;
          let l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
          let l3 = 1 - l1 - l2;
          if (l1 < 0 || l2 < 0 || l3 < 0) {
            // a cell centre just outside: the triangle still covers part of the cell
            // when one of its edges passes within half a cell
            if (!nearSegment(x, z, a, b, 0.5) && !nearSegment(x, z, b, c, 0.5) && !nearSegment(x, z, c, a, 0.5)) continue;
            l1 = Math.max(0, l1); l2 = Math.max(0, l2); l3 = Math.max(0, l3);
            const sum = l1 + l2 + l3 || 1;
            l1 /= sum; l2 /= sum; l3 /= sum;
          }
          y = l1 * a[1] + l2 * b[1] + l3 * c[1];
          y = Math.min(highest, y);
        }
        const k = ix * nz + iz;
        if (y > top[k]!) top[k] = y;
      }
    }
  }
  return { x0, z0, nx, nz, top, minY, maxY };
}

function nearSegment(x: number, z: number, a: Vec3, b: Vec3, cells = 0.75): boolean {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len2 = dx * dx + dz * dz;
  const t = len2 > 1e-12 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / len2)) : 0;
  return Math.hypot(x - (a[0] + dx * t), z - (a[2] + dz * t)) <= CELL * cells;
}

/** The highest and lowest top over a rectangle of cells, and whether every cell has a top. */
function span(m: HeightMap, ix0: number, ix1: number, iz0: number, iz1: number): { lo: number; hi: number; full: boolean } {
  let lo = Infinity;
  let hi = -Infinity;
  let full = true;
  for (let ix = Math.max(0, ix0); ix <= Math.min(m.nx - 1, ix1); ix++) {
    for (let iz = Math.max(0, iz0); iz <= Math.min(m.nz - 1, iz1); iz++) {
      const y = m.top[ix * m.nz + iz]!;
      if (y === -Infinity) {
        full = false;
        continue;
      }
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  if (ix0 < 0 || iz0 < 0 || ix1 >= m.nx || iz1 >= m.nz) full = false;
  return { lo, hi, full };
}

/**
 * The seat on a height map in the vehicle frame (nose at min X): the first flat,
 * clear stretch of roof from the nose back, on the centreline. Metres, the seat's
 * surface point.
 */
export function seatOnMap(m: HeightMap): Vec3 {
  const len = Math.max(1, Math.round(SEAT_LENGTH / CELL));
  const half = Math.max(1, Math.round(SEAT_WIDTH / 2 / CELL));
  const marginX = Math.round(MARGIN_ALONG / CELL);
  const marginZ = Math.round(MARGIN_ACROSS / CELL);
  const izc = Math.round(-m.z0 / CELL);
  const line: number[] = [];
  for (let ix = 0; ix < m.nx; ix++) {
    const y = m.top[ix * m.nz + Math.max(0, Math.min(m.nz - 1, izc))]!;
    if (y !== -Infinity) line.push(y);
  }
  line.sort((a, b) => a - b);
  const roof = line.length ? line[Math.min(line.length - 1, Math.floor(line.length * ROOF_QUANTILE))]! : m.maxY;
  const roofLine = m.minY + (roof - m.minY) * ROOF_SHARE;
  let fallback: { x: number; y: number; flat: number } | null = null;
  for (let ix = 0; ix + len - 1 < m.nx; ix++) {
    const seat = span(m, ix, ix + len - 1, izc - half, izc + half);
    if (!seat.full || seat.hi < roofLine || seat.hi > roof + ROOF_ABOVE) continue;
    const x = m.x0 + (ix + (len - 1) / 2) * CELL;
    const flatness = seat.hi - seat.lo;
    if (!fallback || flatness < fallback.flat) fallback = { x, y: seat.hi, flat: flatness };
    if (flatness > FLAT) continue;
    const round = span(m, ix - marginX, ix + len - 1 + marginX, izc - half - marginZ, izc + half + marginZ);
    if (round.hi > seat.hi + CLEAR_ABOVE) continue;
    return [x, seat.hi, 0];
  }
  if (fallback) return [fallback.x, fallback.y, 0];
  return [m.x0 + ((m.nx - 1) * CELL) / 2, m.maxY, 0];
}

/**
 * The rider seat of a vehicle model, in the model's own frame (metres): measured
 * in the game's vehicle frame, which the model reaches by turning `yaw` degrees
 * about +Y (180 for the factory's nose-along-+X road and rail vehicles).
 */
export function riderSeat(tris: readonly Tri[], yaw: number): Vec3 {
  const inFrame = tris.map((t) => [turn(t.p[0], yaw), turn(t.p[1], yaw), turn(t.p[2], yaw)] as const);
  const seat = seatOnMap(heightMap(inFrame));
  const back = turn(seat, -yaw);
  const r = (v: number): number => Math.round(v * 1e4) / 1e4 + 0;
  return [r(back[0]), r(back[1]), r(back[2])];
}

/** The yaw the game turns a vehicle by into its frame (nose at min X), as rail-island-webapp's build does. */
export function gameYaw(category: string, yaw: number | undefined): number {
  return yaw ?? (category === "Rail vehicles" || category === "Road vehicles" ? 180 : 0);
}
