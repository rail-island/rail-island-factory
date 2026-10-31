// The passenger view of a structure page (docs/site/catalog-site.md, "Passenger
// view"): where a passenger can stand on the drawn model and how they walk. Nothing
// here is per family: the walkable surfaces are found from the model's own
// triangles - an upward face (normal.y > WALKABLE_NY) with the passenger's height
// free above it - so a station, a bus station, a port or an airport gets the view
// without describing its decks.
//
// The triangles are indexed once per build in a grid over x/z (Ground), so the
// vertical rays that find the floor and the headroom, and the short horizontal rays
// that stop a passenger at a wall, test only the triangles of a cell or two. Pure
// arithmetic on a triangle soup: trianglesOf() is the only part that reads three.

import { Mesh, Vector3, type Object3D } from "three";
import type { PassengerHints, PassengerTrack } from "../generator/passengerHints.ts";

export type { PassengerHints, PassengerTrack };

/** A passenger's eye above the floor, in studs (the previews' unit), when the model states none. */
export const PASSENGER_EYE = 2.55;
/** A face is walkable when its normal points up at least this much. */
export const WALKABLE_NY = 0.7;
/** The highest step a passenger takes up or down, model units: a stair's riser, not a platform edge. */
export const MAX_STEP = 0.6;
/** What must stay free above the eye for a floor to count. */
export const HEAD_MARGIN = 0.25;
/** A passenger's radius, as a share of the eye height: how close they come to a wall. */
const BODY = 0.14;
/** Presets stand no higher than this many eye heights over the model's lowest point. */
export const PRESET_REACH = 4;

/** A floor found under a point: its height and the room above it (Infinity under the sky). */
export interface Floor {
  y: number;
  head: number;
}

/** Where the passenger stands (the floor under their feet) and where they look. */
export interface Stance {
  x: number;
  y: number;
  z: number;
  /** Radians about +Y; 0 looks along -Z (three's camera). */
  yaw: number;
  /** Radians up (+) or down (-), clamped to +-PITCH_LIMIT. */
  pitch: number;
}

/** A named viewpoint to jump to. */
export interface Preset extends Stance {
  name: string;
}

export const PITCH_LIMIT = 1.35;

/** The model's triangles in world space, 9 numbers each: every visible mesh. */
export function trianglesOf(root: Object3D): Float32Array {
  root.updateMatrixWorld(true);
  const out: number[] = [];
  const v = new Vector3();
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    for (let up: Object3D | null = o; up; up = up.parent) if (!up.visible) return;
    const pos = o.geometry.getAttribute("position");
    if (!pos) return;
    const index = o.geometry.index;
    const n = index ? index.count : pos.count;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(o.matrixWorld);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
}

/** A triangle soup indexed in an x/z grid, for vertical and short horizontal rays. */
export class Ground {
  readonly min: [number, number, number] = [Infinity, Infinity, Infinity];
  readonly max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  private readonly cell: number;
  private readonly nx: number;
  private readonly nz: number;
  private readonly cells: number[][];
  /** Each triangle's unit normal (3 numbers), by winding: three's front faces are counter-clockwise. */
  private readonly normals: Float32Array;

  constructor(private readonly tris: Float32Array) {
    const count = Math.floor(tris.length / 9);
    for (let i = 0; i < count * 3; i++) {
      for (let k = 0; k < 3; k++) {
        const c = tris[i * 3 + k]!;
        if (c < this.min[k]!) this.min[k] = c;
        if (c > this.max[k]!) this.max[k] = c;
      }
    }
    if (!count) this.min.fill(0), this.max.fill(0);
    const w = this.max[0] - this.min[0], d = this.max[2] - this.min[2];
    // no more than about 64 x 64 cells, none under a quarter of a unit
    this.cell = Math.max(0.25, Math.max(w, d) / 64);
    this.nx = Math.max(1, Math.ceil(w / this.cell) + 1);
    this.nz = Math.max(1, Math.ceil(d / this.cell) + 1);
    this.cells = Array.from({ length: this.nx * this.nz }, () => []);
    this.normals = new Float32Array(count * 3);
    for (let t = 0; t < count; t++) {
      const o = t * 9;
      const ux = tris[o + 3]! - tris[o]!, uy = tris[o + 4]! - tris[o + 1]!, uz = tris[o + 5]! - tris[o + 2]!;
      const vx = tris[o + 6]! - tris[o]!, vy = tris[o + 7]! - tris[o + 1]!, vz = tris[o + 8]! - tris[o + 2]!;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz);
      if (!(l > 1e-12)) continue;
      this.normals[t * 3] = nx / l;
      this.normals[t * 3 + 1] = ny / l;
      this.normals[t * 3 + 2] = nz / l;
      const x0 = Math.min(tris[o]!, tris[o + 3]!, tris[o + 6]!), x1 = Math.max(tris[o]!, tris[o + 3]!, tris[o + 6]!);
      const z0 = Math.min(tris[o + 2]!, tris[o + 5]!, tris[o + 8]!), z1 = Math.max(tris[o + 2]!, tris[o + 5]!, tris[o + 8]!);
      const [i0, k0] = this.cellOf(x0, z0), [i1, k1] = this.cellOf(x1, z1);
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) this.cells[k * this.nx + i]!.push(t);
    }
  }

  /** The number of triangles indexed. */
  get size(): number {
    return Math.floor(this.tris.length / 9);
  }

  private cellOf(x: number, z: number): [number, number] {
    const i = Math.min(this.nx - 1, Math.max(0, Math.floor((x - this.min[0]) / this.cell)));
    const k = Math.min(this.nz - 1, Math.max(0, Math.floor((z - this.min[2]) / this.cell)));
    return [i, k];
  }

  /** Whether (x, z) lies over the model's footprint at all. */
  inside(x: number, z: number, margin = 0): boolean {
    return x >= this.min[0] - margin && x <= this.max[0] + margin && z >= this.min[2] - margin && z <= this.max[2] + margin;
  }

  /** Every surface a vertical line through (x, z) crosses: its height and normal's y, highest first. */
  column(x: number, z: number): Array<{ y: number; ny: number }> {
    if (!this.inside(x, z)) return [];
    const [i, k] = this.cellOf(x, z);
    const t = this.tris;
    const out: Array<{ y: number; ny: number }> = [];
    for (const tri of this.cells[k * this.nx + i]!) {
      const o = tri * 9;
      const ax = t[o]!, az = t[o + 2]!, bx = t[o + 3]!, bz = t[o + 5]!, cx = t[o + 6]!, cz = t[o + 8]!;
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(det) < 1e-12) continue; // a vertical face: no vertical ray crosses it
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
      const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
      const l3 = 1 - l1 - l2;
      const e = -1e-7;
      if (l1 < e || l2 < e || l3 < e) continue;
      out.push({ y: l1 * t[o + 1]! + l2 * t[o + 4]! + l3 * t[o + 7]!, ny: this.normals[tri * 3 + 1]! });
    }
    return out.sort((a, b) => b.y - a.y);
  }

  /**
   * Every floor at (x, z), highest first: an upward face with at least `eye` +
   * HEAD_MARGIN free above it up to the next surface (any surface: a ceiling, a roof,
   * the underside of a deck).
   */
  floors(x: number, z: number, eye: number): Floor[] {
    const col = this.column(x, z);
    const out: Floor[] = [];
    for (let i = 0; i < col.length; i++) {
      const h = col[i]!;
      if (h.ny <= WALKABLE_NY) continue;
      // the nearest surface above it, skipping the face itself (and its coincident twins)
      let above = Infinity;
      for (let j = i - 1; j >= 0; j--) {
        if (col[j]!.y > h.y + 1e-3) {
          above = col[j]!.y;
          break;
        }
      }
      // a floor's twin faces (two materials flush) count once
      if (out.length && Math.abs(out[out.length - 1]!.y - h.y) < 1e-3) continue;
      const head = above - h.y;
      if (head >= eye + HEAD_MARGIN) out.push({ y: h.y, head });
    }
    return out;
  }

  /** The highest floor at (x, z) no higher than `fromY`, or null. */
  floorAt(x: number, z: number, fromY: number, eye: number): Floor | null {
    for (const f of this.floors(x, z, eye)) if (f.y <= fromY + 1e-6) return f;
    return null;
  }

  /**
   * Whether a horizontal segment from (x0, z0) to (x1, z1) at height y crosses a
   * triangle (either side), reaching `reach` past its end.
   */
  hits(x0: number, z0: number, x1: number, z1: number, y: number, reach: number): boolean {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 1e-9) return false;
    const ux = dx / len, uz = dz / len, far = len + reach;
    const ex = x0 + ux * far, ez = z0 + uz * far;
    const [i0, k0] = this.cellOf(Math.min(x0, ex), Math.min(z0, ez));
    const [i1, k1] = this.cellOf(Math.max(x0, ex), Math.max(z0, ez));
    const t = this.tris;
    const seen = new Set<number>();
    for (let k = k0; k <= k1; k++) {
      for (let i = i0; i <= i1; i++) {
        for (const tri of this.cells[k * this.nx + i]!) {
          if (seen.has(tri)) continue;
          seen.add(tri);
          const o = tri * 9;
          // Moller-Trumbore, both sides, the ray (x0, y, z0) + s (ux, 0, uz)
          const e1x = t[o + 3]! - t[o]!, e1y = t[o + 4]! - t[o + 1]!, e1z = t[o + 5]! - t[o + 2]!;
          const e2x = t[o + 6]! - t[o]!, e2y = t[o + 7]! - t[o + 1]!, e2z = t[o + 8]! - t[o + 2]!;
          const px = -uz * e2y, py = uz * e2x - ux * e2z, pz = ux * e2y;
          const det = e1x * px + e1y * py + e1z * pz;
          if (Math.abs(det) < 1e-12) continue;
          const inv = 1 / det;
          const sx = x0 - t[o]!, sy = y - t[o + 1]!, sz = z0 - t[o + 2]!;
          const u = (sx * px + sy * py + sz * pz) * inv;
          if (u < 0 || u > 1) continue;
          const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
          const v = (ux * qx + uz * qz) * inv;
          if (v < 0 || u + v > 1) continue;
          const s = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (s > 1e-6 && s <= far) return true;
        }
      }
    }
    return false;
  }
}

/** The eye height a model's hints state, or PASSENGER_EYE. */
export function eyeOf(hints: PassengerHints | undefined | null): number {
  return hints && hints.eye > 0 ? hints.eye : PASSENGER_EYE;
}

/** The passenger hints a built model's group carries (userData.passenger), or null. */
export function hintsOf(root: Object3D | null): PassengerHints | null {
  const h = root?.userData.passenger as PassengerHints | undefined;
  return h && typeof h.eye === "number" ? h : null;
}

/**
 * One step of a walk: from `at` by (dx, dz). The passenger moves only onto a floor
 * at most MAX_STEP above or below the one they stand on, with no wall in the way
 * (rays at knee, waist and eye height) and within the model's bounds (plus an eye
 * height); a blocked move slides along x or z alone, else stays put. Long moves go
 * in short steps, so a wall is never jumped.
 */
export function walk(ground: Ground, at: Stance, dx: number, dz: number, eye: number): Stance {
  const len = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(len / (eye * 0.1)));
  let here = at;
  for (let s = 0; s < steps; s++) {
    const sx = dx / steps, sz = dz / steps;
    here = tryStep(ground, here, sx, sz, eye) ?? tryStep(ground, here, sx, 0, eye) ?? tryStep(ground, here, 0, sz, eye) ?? here;
  }
  return here;
}

function tryStep(ground: Ground, at: Stance, dx: number, dz: number, eye: number): Stance | null {
  if (dx === 0 && dz === 0) return null;
  const x = at.x + dx, z = at.z + dz;
  if (!ground.inside(x, z, eye)) return null;
  const reach = eye * BODY;
  // the knee ray reaches less far, so the riser after next on a stair does not stop the step
  if (ground.hits(at.x, at.z, x, z, at.y + MAX_STEP + 0.05, reach * 0.3)) return null;
  for (const h of [eye * 0.5, eye]) if (ground.hits(at.x, at.z, x, z, at.y + h, reach)) return null;
  const f = ground.floorAt(x, z, at.y + MAX_STEP, eye);
  if (!f || f.y < at.y - MAX_STEP) return null;
  return { ...at, x, z, y: f.y };
}

/** The yaw that looks from (x, z) toward (tx, tz). */
export function yawToward(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(-(tx - x), -(tz - z));
}

/** The point a stance's eye looks along, one unit out: (dx, dz) on the ground plane. */
export function forwardOf(yaw: number): [number, number] {
  return [-Math.sin(yaw), -Math.cos(yaw)];
}

interface Spot {
  x: number;
  z: number;
  y: number;
  head: number;
  /** Its sample's column and row on the grid. */
  i: number;
  k: number;
  /** The lowest floor of its column: it stands on something, not over another floor. */
  grounded: boolean;
}

/**
 * A handful of named viewpoints at eye height, in a fixed order: the ends of the
 * walkable area along its long axis, its middle, its side, a place under the roof
 * where there is one and an upper level where there is one. Found on a grid over the
 * model, on floors no higher than PRESET_REACH eye heights over its lowest point and
 * - where the model has raised decks (platforms, islands, quays) - on those rather
 * than the ground between them; never on a track of `tracks` (hints). Each preset
 * stands at least two eye heights from the ones before it.
 */
export function findPresets(ground: Ground, eye: number, tracks: readonly PassengerTrack[] = []): Preset[] {
  if (!ground.size) return [];
  const w = ground.max[0] - ground.min[0], d = ground.max[2] - ground.min[2];
  const step = Math.max(eye * 0.6, Math.max(w, d) / 64);
  const limit = ground.min[1] + PRESET_REACH * eye;
  const onTrack = (x: number, z: number): boolean => tracks.some((t) => Math.abs(x - t.x) < 2.6 && z >= Math.min(t.z0, t.z1) - 1 && z <= Math.max(t.z0, t.z1) + 1);
  const spots: Spot[] = [];
  const nx = Math.max(1, Math.floor(w / step)), nz = Math.max(1, Math.floor(d / step));
  for (let k = 0; k <= nz; k++) {
    for (let i = 0; i <= nx; i++) {
      const x = ground.min[0] + (w * (i + 0.5)) / (nx + 1), z = ground.min[2] + (d * (k + 0.5)) / (nz + 1);
      if (onTrack(x, z)) continue;
      const floors = ground.floors(x, z, eye);
      floors.forEach((f, n) => {
        // standing room for a body, not the top of a post
        if (f.y <= limit && roomy(ground, x, z, f.y, eye, step)) spots.push({ x, z, y: f.y, head: f.head, i, k, grounded: n === floors.length - 1 });
      });
    }
  }
  if (!spots.length) return [];
  const pool = deck(ground, spots, eye);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const s of pool) {
    x0 = Math.min(x0, s.x), x1 = Math.max(x1, s.x), z0 = Math.min(z0, s.z), z1 = Math.max(z1, s.z);
  }
  const alongZ = z1 - z0 >= x1 - x0;
  const along = (s: Spot): number => (alongZ ? s.z : s.x);
  const across = (s: Spot): number => (alongZ ? s.x : s.z);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const cAlong = alongZ ? cz : cx, cAcross = alongZ ? cx : cz;
  const aMin = alongZ ? z0 : x0, aMax = alongZ ? z1 : x1, cMin = alongZ ? x0 : z0;
  const best = (list: Spot[], score: (s: Spot) => number): Spot | null => {
    let out: Spot | null = null, at = Infinity;
    for (const s of list) {
      const v = score(s);
      if (v < at - 1e-9) out = s, at = v;
    }
    return out;
  };
  const rail = tracks.length > 0;
  const out: Preset[] = [];
  const add = (name: string, s: Spot | null, look: (s: Spot) => number) => {
    if (!s || out.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 2 * eye && Math.abs(p.y - s.y) < 0.5)) return;
    out.push({ name, x: s.x, y: s.y, z: s.z, yaw: look(s), pitch: 0 });
  };
  // a direction along the long axis (+1 toward its far end) as a yaw
  const lookAlong = (sign: number) => () => (alongZ ? yawToward(0, 0, 0, sign) : yawToward(0, 0, sign, 0));
  const lookAt = (tx: number, tz: number) => (s: Spot) => yawToward(s.x, s.z, tx, tz);
  const inset = 1.5 * step;
  add(rail ? "Platform end" : "End", best(pool, (s) => Math.abs(along(s) - (aMin + inset)) + 0.5 * Math.abs(across(s) - cAcross)), lookAlong(1));
  add(rail ? "Platform middle" : "Middle", best(pool, (s) => Math.hypot(s.x - cx, s.z - cz)), lookAlong(1));
  const covered = pool.filter((s) => s.head < 6 * eye);
  add("Under the roof", best(covered.filter((s) => !out.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 2 * eye)), (s) => Math.hypot(s.x - cx, s.z - cz)), lookAlong(-1));
  add("Side", best(pool, (s) => Math.abs(across(s) - (cMin + inset)) + 0.5 * Math.abs(along(s) - cAlong)), lookAt(cx, cz));
  add(rail ? "Other platform end" : "Far end", best(pool, (s) => Math.abs(along(s) - (aMax - inset)) + 0.5 * Math.abs(across(s) - cAcross)), lookAlong(-1));
  const top = Math.max(...pool.map((s) => s.y));
  const level = median(pool.map((s) => s.y));
  if (top > level + eye) add("Upper level", best(pool.filter((s) => s.y > top - 0.3), (s) => Math.hypot(s.x - cx, s.z - cz)), lookAt(cx, cz));
  return out;
}

/**
 * The spots a passenger stands on: where the model has raised decks (platforms,
 * islands, quays) those rather than the ground between them. The spots are joined
 * into areas a passenger can walk between (neighbours on the grid, a step or a stair
 * apart); the deck is every area of a fair size that starts at the lowest level such
 * an area starts at - so stairs and the concourse they climb to belong to it, while
 * a roof's or a shelf's top, which no stair reaches, does not.
 */
function deck(ground: Ground, base: Spot[], eye: number): Spot[] {
  // union-find over the grid's neighbours
  const parent = base.map((_, n) => n);
  const find = (n: number): number => {
    while (parent[n] !== n) n = parent[n] = parent[parent[n]!]!;
    return n;
  };
  const byCell = new Map<string, number[]>();
  base.forEach((s, n) => {
    const key = `${s.i},${s.k}`;
    const list = byCell.get(key);
    if (list) list.push(n);
    else byCell.set(key, [n]);
  });
  base.forEach((s, n) => {
    for (const [di, dk] of [[1, 0], [0, 1]] as const) {
      for (const m of byCell.get(`${s.i + di},${s.k + dk}`) ?? []) {
        if (linked(ground, s, base[m]!, eye, 3)) parent[find(n)] = find(m);
      }
    }
  });
  const areas = new Map<number, Spot[]>();
  base.forEach((s, n) => {
    const root = find(n);
    const list = areas.get(root);
    if (list) list.push(s);
    else areas.set(root, [s]);
  });
  const start = (a: Spot[]): number => Math.min(...a.map((s) => s.y));
  const count = (list: Spot[][]): number => list.reduce((n, a) => n + a.length, 0);
  const all = [...areas.values()];
  const largest = Math.max(...all.map((a) => a.length));
  // of a fair size beside the largest: not a bench's seat or a post's top
  const fair = all.filter((a) => a.length >= Math.max(4, largest * 0.05));
  let chosen = fair.length ? fair : all;
  // areas that stand on something rather than over another floor: not a roof's top
  // (a bridge's deck, over its valley, keeps its place when nothing else is fair)
  const solid = chosen.filter((a) => a.filter((s) => s.grounded).length * 2 >= a.length && a.length >= largest * 0.15);
  if (solid.length) chosen = chosen.filter((a) => a.filter((s) => s.grounded).length * 2 >= a.length);
  // raised decks, level by level, where they cover a fair share, rather than the
  // ground between them: the track beds over the ground, the platforms over the beds
  // (a deck no more than an eye height up: a shed's flat top is not one)
  for (;;) {
    const low = Math.min(...chosen.map(start));
    const raised = chosen.filter((a) => start(a) > low + 0.2 && start(a) <= low + eye);
    if (!raised.length || count(raised) < count(chosen) * 0.1) break;
    chosen = raised;
  }
  const level = Math.min(...chosen.map(start));
  // in the grid's order, so the presets do not depend on how the areas were joined
  const keep = new Set(chosen.filter((a) => start(a) <= level + 0.5).flat());
  const kept = base.filter((s) => keep.has(s));
  // one area may hold the ground and the decks a ramp climbs to (a platform end
  // sloping down to the track bed): the decks then, where they are a fair share
  const foot = Math.min(...kept.map((s) => s.y));
  const up = kept.filter((s) => s.y > foot + 0.2);
  return up.length >= kept.length * 0.25 ? up : kept;
}

/** Whether a passenger walks from one spot to the next: a step apart, or a stair of steps between them. */
function linked(ground: Ground, a: Spot, b: Spot, eye: number, depth: number): boolean {
  if (Math.abs(a.y - b.y) <= MAX_STEP) return true;
  if (depth <= 0) return false;
  const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2;
  const f = ground.floorAt(x, z, Math.max(a.y, b.y) + MAX_STEP, eye);
  if (!f || f.y < Math.min(a.y, b.y) - MAX_STEP) return false;
  const mid: Spot = { x, z, y: f.y, head: f.head, i: a.i, k: a.k, grounded: false };
  return linked(ground, a, mid, eye, depth - 1) && linked(ground, mid, b, eye, depth - 1);
}

/** Whether a body fits at (x, z) on the floor at y: the same floor a little way off on every side. */
function roomy(ground: Ground, x: number, z: number, y: number, eye: number, step: number): boolean {
  const r = Math.min(eye * BODY * 2, step * 0.5);
  for (const [ox, oz] of [[r, 0], [-r, 0], [0, r], [0, -r]] as const) {
    const f = ground.floorAt(x + ox, z + oz, y + MAX_STEP * 0.5, eye);
    if (!f || Math.abs(f.y - y) > MAX_STEP * 0.5) return false;
  }
  return true;
}

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}
