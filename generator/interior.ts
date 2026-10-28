// A vehicle's generic interior (docs/models/interiors.md): one cabin per car, a
// floor, a ceiling, side and end walls and rows of seats across the car, drawn
// into the car's interior part (a child part `interior-<car>`, interiorTable.ts),
// which consumers hide while every door of the car is shut. Nothing in it is particular to a design but the
// doors: a row of seats is left out wherever it would reach into a door's clear
// zone, on either side, and the side walls are open over each doorway, with its
// reveal (threshold, jambs and head) reaching out to the skin. Apart from
// meshCore.ts, and swapped for a no-op in the bundle of a design that draws no
// interior (jsModel.ts), so only the designs with one carry this code in their
// standalone JS model.

import type { MaterialSpec, MeshCore, Vec3 } from "./meshCore.ts";

/** The shared interior materials, the same in every vehicle: a kit drawing cabins puts them in its palette. */
export const INTERIOR_PALETTE: Record<string, MaterialSpec> = {
  interiorFloor: { color: "#5b5f62", roughness: 0.9 },
  interiorWall: { color: "#d8d4c8", roughness: 0.8 },
  interiorSeat: { color: "#3e5a80", roughness: 0.85 },
  interiorGlass: { color: "#26323c", metallic: 0.2, roughness: 0.15, glass: true },
};

/** The most triangles one car's interior may have (test/interiors.test.ts). */
export const INTERIOR_TRIANGLE_BUDGET = 1500;

/** A seat row's length along the car, cushion and back (metres). */
const ROW_DEPTH = 0.55;
/** The distance from one row to the next. */
const ROW_PITCH = 0.9;
/** How far a door's clear zone reaches beyond each jamb along the car. */
const DOOR_CLEARANCE = 0.35;
/** One seat's width across the car, and the narrowest aisle. */
const SEAT_WIDTH = 0.46;
const MIN_AISLE = 0.45;
/** A seat's height above the floor, its back's above the seat, and the thinnest cushion on a raised base. */
const SEAT_HEIGHT = 0.45;
const BACK_HEIGHT = 0.65;
const CUSHION = 0.15;
/** How far the seats keep from the side and end walls (an odd figure, so their faces meet no design's round one). */
const WALL_GAP = 0.037;
/**
 * How far a cabin's walls stand inside the shell: the side walls inside the
 * narrowest skin, the end walls inside the body's ends -- clear of the panels
 * laid on the skin, and an odd figure, so they meet no design's round one.
 */
export const CABIN_INSET = 0.047;

/**
 * A doorway into the cabin (model coordinates): side `s` (+1 the +z side), x0..x1
 * along the car, and the heights of its threshold `y0` and head `y1` -- just
 * inside the doorway's sill and head, clear of the shell's own faces there.
 */
export interface CabinDoor {
  s: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /**
   * The skin's |z| at height y over the doorway (at x along it, where the body
   * narrows across the door), for its reveal: the threshold, jambs and head from
   * the skin in to the cabin's side wall. Omit where something else lines the doorway.
   */
  skin?: (y: number, x: number) => number;
}

/** A window seen from inside (model coordinates): side `s`, x0..x1 along the car, y0..y1 its glass. */
export interface CabinWindow {
  s: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A car's cabin (model coordinates): x0..x1 along the car, floor and ceiling heights, the side walls at |z| = half. */
export interface Cabin {
  x0: number;
  x1: number;
  floor: number;
  ceiling: number;
  half: number;
  doors: CabinDoor[];
  /**
   * What the shell leaves a seat row over x0..x1 (model x): the lowest height it
   * may stand on -- the floor, or a wheel arch's top or a skirt cut away over the
   * wheels, which the seats then stand on -- and the highest it may reach (the
   * roof), or null where no row fits across the cabin (a tapered nose). The cabin
   * may reach past the shell there, where only its inward faces stand, but a seat
   * would show outside. Omit where every row fits on the floor.
   */
  room?: (x0: number, x1: number) => { base: number; top: number } | null;
  /**
   * The body's bottom edge at x where it stands above the floor (a skirt cut away
   * over the wheels), with the x where it bends: the walls stop there, so they
   * never show below the body. Omit where the body's bottom stays under the floor.
   */
  bottom?: { at: (x: number) => number; xs: number[] };
  /**
   * The shell's half width |z| at x and height y, 0 where (x, y) lies outside the
   * body (past its ends, under its bottom, over its roof). The cabin is shortened
   * to where the shell holds it from the floor (or `bottom`) to the ceiling, so its
   * end walls, floor and ceiling never stand outside a tapered nose or a rounded
   * end (`fitCabin`); it still reaches every door. Omit where x0..x1 already fits.
   */
  shell?: (x: number, y: number) => number;
  /** The car's windows, laid on the side walls as dark panes facing in (`windowPanes`). */
  windows?: CabinWindow[];
  /**
   * Wheel housings (a bus's arches): x0..x1 along the car, up to `top`, a box on
   * each side from the side wall in to |z| = z, or with z 0 one box across the car.
   */
  housings?: Array<{ x0: number; x1: number; top: number; z: number }>;
}

/** The interior parts each model has drawn, for their names. */
const drawn = new WeakMap<MeshCore, Set<string>>();

/**
 * The name of the next interior part of the car being drawn: `interior-<car>`
 * (`interior` outside any part), then `-2`, `-3` for a car with cabins in several
 * bodies (interiorTable.ts reads the car back from the part's parent).
 */
function interiorName(m: MeshCore): string {
  const car = m.currentPartName();
  const base = car ? `interior-${car}` : "interior";
  const used = drawn.get(m) ?? new Set<string>();
  drawn.set(m, used);
  let name = base;
  for (let k = 2; used.has(name); k++) name = `${base}-${k}`;
  used.add(name);
  return name;
}

/** The x spans along the car no seat row may reach into: each door's, widened by its clearance. */
export function clearZones(c: Cabin): Array<[number, number]> {
  const zones = c.doors.map((d): [number, number] => [Math.min(d.x0, d.x1) - DOOR_CLEARANCE, Math.max(d.x0, d.x1) + DOOR_CLEARANCE]).sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  for (const z of zones) {
    const last = out[out.length - 1];
    if (last && z[0] <= last[1]) last[1] = Math.max(last[1], z[1]);
    else out.push([...z]);
  }
  return out;
}

/** Where the seat rows stand: the x of each row's low end, rows spread evenly over the spans between the clear zones. */
export function seatRows(c: Cabin): number[] {
  const free: Array<[number, number]> = [];
  let at = c.x0 + WALL_GAP;
  for (const [a, b] of clearZones(c)) {
    if (a > at) free.push([at, Math.min(a, c.x1 - WALL_GAP)]);
    at = Math.max(at, b);
  }
  if (c.x1 - WALL_GAP > at) free.push([at, c.x1 - WALL_GAP]);
  const rows: number[] = [];
  for (const [a, b] of free) {
    const n = Math.floor((b - a - ROW_DEPTH) / ROW_PITCH + 1e-9) + 1;
    if (b - a < ROW_DEPTH) continue;
    const start = a + (b - a - ROW_DEPTH - (n - 1) * ROW_PITCH) / 2;
    for (let k = 0; k < n; k++) rows.push(start + k * ROW_PITCH);
  }
  return rows;
}

/** How many seats stand on each side of the aisle, for an inner width `w`: 2+2, 2+1 or 1+1. */
export function seatLayout(w: number): [number, number] {
  const room = w - 2 * WALL_GAP - MIN_AISLE;
  if (room >= 4 * SEAT_WIDTH) return [2, 2];
  if (room >= 3 * SEAT_WIDTH) return [2, 1];
  return [1, 1];
}

/** An axis-aligned box, every face outward. */
function box(m: MeshCore, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const s = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]] as Array<[number, number]>;
  m.sweep(mat, "x", s, x0, s, x1);
}

/** A flat quad facing `n` (its corners in either winding). */
function face(m: MeshCore, mat: string, pts: Vec3[], n: Vec3): void {
  m.facets(mat, pts.slice(1, -1).flatMap((p, i) => [pts[0]!, p, pts[i + 2]!]), n);
}

/**
 * The windows on the cabin's side walls, seen from inside: a dark pane facing in,
 * 4 mm off the wall, over each window's glass cut to the wall (between floor and
 * ceiling, x0..x1); a window wholly off the wall (an upper deck's) has none.
 */
export function windowPanes(m: MeshCore, c: Pick<Cabin, "x0" | "x1" | "floor" | "ceiling" | "half">, windows: readonly CabinWindow[]): void {
  for (const w of windows) {
    const [a, b] = [Math.max(c.x0, Math.min(w.x0, w.x1)), Math.min(c.x1, Math.max(w.x0, w.x1))];
    const [p, q] = [Math.max(c.floor + 0.01, w.y0), Math.min(c.ceiling - 0.01, w.y1)];
    if (b - a < 0.05 || q - p < 0.05) continue;
    const z = w.s * (c.half - 0.004);
    face(m, "interiorGlass", [[a, p, z], [b, p, z], [b, q, z], [a, q, z]], [0, 0, -w.s]);
  }
}

/** The cabins drawn into each model, by the interior part they went into, with their car, for `laterWindows`. */
const cabins = new WeakMap<MeshCore, Map<string, Pick<Cabin, "x0" | "x1" | "floor" | "ceiling" | "half"> & { car: string | null }>>();

/**
 * Lays windows drawn after the cabin (the coach kit's) on its walls: each into
 * the interior part of the cabin of the car being drawn that spans it, its
 * triangles routed there (MeshCore.drawRouted) so the panes hide and show with the
 * rest of the cabin. A window no cabin spans (a cab's, a car without doors) has none.
 */
export function laterWindows(m: MeshCore, windows: readonly CabinWindow[]): void {
  const car = m.currentPartName();
  for (const [name, c] of cabins.get(m) ?? []) {
    const mine = windows.filter((w) => c.car === car && (w.x0 + w.x1) / 2 > c.x0 && (w.x0 + w.x1) / 2 < c.x1);
    if (!mine.length) continue;
    const index = (m as unknown as { parts: Array<{ name: string }> }).parts.findIndex((p) => p.name === name);
    const draw = (mm: MeshCore) => mm.scope("cabin windows", () => windowPanes(mm, c, mine));
    const sample = m.sampleDraw(draw);
    if (sample.size) m.drawRouted(new Map([...sample].map(([mat, pos]) => [mat, new Array<number>(pos.length / 9).fill(index)])), () => draw(m));
    return;
  }
}

/** How far apart `fitCabin` tries the cabin's ends, and the heights it checks at each. */
const FIT_STEP = 0.02;
const FIT_RISE = 0.05;

/**
 * Cabin `c` fitted into its shell (`Cabin.shell`): each end moved in to the first
 * x where the skin stands outside the side walls (by 2 mm) at every height from
 * the walls' foot to the ceiling, found in FIT_STEP steps and refined by
 * bisection. An end never moves past a door's jamb, so every doorway keeps the
 * cabin behind it: where the skin is still too narrow there (a door in a tapered
 * cab), the whole cabin narrows to CABIN_INSET inside the narrowest skin between
 * that jamb and where the cabin would have fitted.
 */
export function fitCabin(c: Cabin): Cabin {
  const shell = c.shell;
  if (!shell) return c;
  const foot = (x: number) => Math.max(c.floor, c.bottom ? c.bottom.at(x) : c.floor);
  // the skin's narrowest half width at x, from the walls' foot to the ceiling
  const narrowest = (x: number) => {
    const lo = foot(x) + 0.004;
    const n = Math.max(1, Math.ceil((c.ceiling - lo) / FIT_RISE));
    let w = Infinity;
    for (let i = 0; i <= n; i++) w = Math.min(w, shell(x, lo + ((c.ceiling - lo) * i) / n));
    return w;
  };
  const xs = c.doors.flatMap((d) => [d.x0, d.x1]);
  const mid = (c.x0 + c.x1) / 2;
  const limits: Array<[number, number]> = [[c.x0, Math.min(mid, ...xs)], [c.x1, Math.max(mid, ...xs)]];
  // from end `from` in toward `limit`: the first x where a cabin `half` wide fits, or `limit`
  const end = (from: number, limit: number, half: number) => {
    const fits = (x: number) => narrowest(x) >= half + 0.002;
    const dir = Math.sign(limit - from);
    if (fits(from)) return from;
    let out = from;
    for (let x = from + dir * FIT_STEP; dir * (limit - x) > 0; x += dir * FIT_STEP) {
      if (!fits(x)) {
        out = x;
        continue;
      }
      let inn = x;
      for (let k = 0; k < 10; k++) {
        const m = (out + inn) / 2;
        if (fits(m)) inn = m;
        else out = m;
      }
      return inn;
    }
    return limit;
  };
  let half = c.half;
  for (const [from, limit] of limits) {
    const at = end(from, limit, half);
    if (narrowest(at) >= half + 0.002) continue;
    // a door holds this end where the cabin does not fit: narrow it over the span up to where it would
    const fitted = end(limit, mid, c.half);
    const dir = Math.sign(fitted - at);
    if (dir) for (let x = at; dir * (fitted - x) > 0; x += dir * FIT_STEP) half = Math.min(half, narrowest(x) - CABIN_INSET);
    half = Math.min(half, narrowest(fitted) - CABIN_INSET);
  }
  return { ...c, half, x0: end(c.x0, limits[0]![1], half), x1: end(c.x1, limits[1]![1], half) };
}

/**
 * Draws cabin `c` into the interior of the car being drawn: the floor, the
 * ceiling, the end walls, the side walls open over each doorway with its reveal,
 * the windows on them, and the seat rows, every row facing the middle of the car,
 * its back toward the nearer end. Returns the interior part's name.
 */
export function drawCabin(m: MeshCore, cabin: Cabin): string {
  const c = fitCabin(cabin);
  if (!(c.x1 - c.x0 > 0.5 && c.ceiling - c.floor > 1 && c.half > 0.4)) throw new Error(`drawCabin: a cabin too small to stand in (${JSON.stringify({ x0: c.x0, x1: c.x1, floor: c.floor, ceiling: c.ceiling, half: c.half })})`);
  const { x0, x1, floor: y0, ceiling: y1, half: h } = c;
  const name = interiorName(m);
  const drawnHere = cabins.get(m) ?? new Map();
  cabins.set(m, drawnHere.set(name, { x0, x1, floor: y0, ceiling: y1, half: h, car: m.currentPartName() }));
  m.spin(name, [0, 0, 0], () => {
    // a housing across the car stands on the arch, not on the floor
    const across = (c.housings ?? []).filter((hs) => hs.z <= 1e-6);
    // where the walls start: the floor, or the body's bottom edge above it
    const foot = (x: number) => Math.max(y0, c.bottom ? c.bottom.at(x) : y0);
    // the floor rises onto the body's bottom edge where that stands higher, 3 mm above it, so it never shows below the body
    const level = (x: number) => (c.bottom ? Math.max(y0, c.bottom.at(x) + 0.003) : y0);
    m.scope("floor", () => {
      const xs = [...new Set([x0, x1, ...[...across.flatMap((hs) => [hs.x0, hs.x1]), ...(c.bottom?.xs ?? [])].filter((x) => x > x0 && x < x1)])].sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i++) {
        const [a, b] = [xs[i]!, xs[i + 1]!];
        if (across.some((hs) => hs.x0 < (a + b) / 2 && (a + b) / 2 < hs.x1)) continue;
        const [ya, yb] = [level(a), level(b)];
        face(m, "interiorFloor", [[a, ya, -h], [b, yb, -h], [b, yb, h], [a, ya, h]], [0, 1, 0]);
      }
    });
    m.scope("ceiling", () => face(m, "interiorWall", [[x0, y1, -h], [x1, y1, -h], [x1, y1, h], [x0, y1, h]], [0, -1, 0]));
    m.scope("end walls", () => {
      face(m, "interiorWall", [[x0, foot(x0), -h], [x0, foot(x0), h], [x0, y1, h], [x0, y1, -h]], [1, 0, 0]);
      face(m, "interiorWall", [[x1, foot(x1), -h], [x1, foot(x1), h], [x1, y1, h], [x1, y1, -h]], [-1, 0, 0]);
    });
    m.scope("side walls", () => {
      for (const s of [-1, 1]) {
        const z = s * h;
        // a piece from the floor up starts at the body's bottom edge where that stands higher
        const wall = (a: number, b: number, p: number, q: number) => {
          const [pa, pb] = p <= y0 + 1e-9 ? [foot(a), foot(b)] : [p, p];
          if (b - a > 1e-4 && q - Math.min(pa, pb) > 1e-4) face(m, "interiorWall", [[a, Math.min(pa, q), z], [b, Math.min(pb, q), z], [b, q, z], [a, q, z]], [0, 0, -s]);
        };
        // what the wall leaves out on this side: its doorways, and what a housing covers
        const holes = [
          ...c.doors.filter((d) => d.s === s).map((d) => ({ x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 })),
          ...(c.housings ?? []).map((hs) => ({ x0: hs.x0, x1: hs.x1, y0: -Infinity, y1: hs.top })),
        ];
        const xs = [...new Set([x0, x1, ...[...holes.flatMap((o) => [o.x0, o.x1]), ...(c.bottom?.xs ?? [])].filter((x) => x > x0 && x < x1)])].sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i++) {
          const [a, b] = [xs[i]!, xs[i + 1]!];
          const cuts = holes
            .filter((o) => o.x0 < (a + b) / 2 && (a + b) / 2 < o.x1)
            .map((o): [number, number] => [Math.max(y0, o.y0), Math.min(y1, o.y1)])
            .sort((p, q) => p[0] - q[0]);
          let at = y0;
          for (const [p, q] of cuts) {
            wall(a, b, at, p);
            at = Math.max(at, q);
          }
          wall(a, b, at, y1);
        }
      }
    });
    if (c.windows?.length) m.scope("windows", () => windowPanes(m, c, c.windows!));
    if (c.housings?.length)
      m.scope("wheel housings", () => {
        for (const hs of c.housings!) {
          const [a, b] = [Math.max(x0, hs.x0), Math.min(x1, hs.x1)];
          if (b - a < 1e-3) continue;
          // the box's top and its ends, from the inner face (or across the car) out to the side walls
          const across = hs.z <= 1e-6;
          for (const s of across ? [1] : [-1, 1]) {
            const [zi, zo] = across ? [-h, h] : [s * hs.z, s * h];
            face(m, "interiorWall", [[a, hs.top, zi], [b, hs.top, zi], [b, hs.top, zo], [a, hs.top, zo]], [0, 1, 0]);
            if (!across) face(m, "interiorWall", [[a, y0, zi], [b, y0, zi], [b, hs.top, zi], [a, hs.top, zi]], [0, 0, -s]);
            face(m, "interiorWall", [[a, y0, zi], [a, y0, zo], [a, hs.top, zo], [a, hs.top, zi]], [-1, 0, 0]);
            face(m, "interiorWall", [[b, y0, zi], [b, y0, zo], [b, hs.top, zo], [b, hs.top, zi]], [1, 0, 0]);
          }
        }
      });
    c.doors.forEach((d, i) => {
      if (d.skin) m.scope(`doorway ${i + 1}`, () => reveal(m, d, h, level, c.bottom, d.skin!));
    });
    m.scope("seats", () => {
      const [lo, hi] = seatLayout(2 * h);
      const mid = (x0 + x1) / 2;
      for (const x of seatRows(c)) {
        const room = c.room ? c.room(x - 0.1, x + ROW_DEPTH + 0.1) : { base: y0, top: y1 };
        if (!room) continue;
        // a seat on a raised base keeps a cushion at least CUSHION thick
        const base = Math.max(y0 + 0.005, room.base);
        const seat = Math.max(y0 + SEAT_HEIGHT, base + CUSHION);
        const top = seat + BACK_HEIGHT;
        if (top > Math.min(room.top, y1) - 0.03) continue;
        // the back on the row's end toward the nearer car end
        const back = x + ROW_DEPTH / 2 < mid ? x : x + ROW_DEPTH;
        const dir = back === x ? 1 : -1;
        for (const [s, n] of [[-1, lo], [1, hi]] as const) {
          const [za, zb] = [h - WALL_GAP - n * SEAT_WIDTH, h - WALL_GAP];
          const [z0, z1] = s > 0 ? [za, zb] : [-zb, -za];
          box(m, "interiorSeat", x, x + ROW_DEPTH, base, seat, z0, z1);
          // the back stands 5 mm behind the cushion's end and 1 cm inside its sides, so no faces meet
          const [b0, b1] = dir > 0 ? [back - 0.005, back + 0.1] : [back - 0.1, back + 0.005];
          box(m, "interiorSeat", b0, b1, seat - 0.15, top, z0 + 0.01, z1 - 0.01);
        }
      }
    });
  });
  return name;
}

/**
 * A doorway's reveal, from the skin in to the cabin's side wall at |z| = `h`: the
 * threshold at the sill, the head and the two jambs, which follow the skin's
 * profile; a sill below the cabin's `floor` (a step well) gets a riser up to it.
 */
function reveal(m: MeshCore, d: CabinDoor, h: number, level: (x: number) => number, bottom: Cabin["bottom"], skin: (y: number, x: number) => number): void {
  const s = d.s;
  const zi = s * h;
  const b = d.y1;
  const zs = (y: number, x: number) => s * skin(y, x);
  // the sill, raised onto the body's bottom edge where that stands higher (a nose's rising underside)
  const sill = (x: number) => Math.min(b - 0.01, Math.max(d.y0, bottom ? bottom.at(x) + 0.003 : d.y0));
  const xs = [...new Set([d.x0, d.x1, ...(bottom?.xs ?? []).filter((x) => x > d.x0 && x < d.x1)])].sort((p, q) => p - q);
  for (let i = 0; i + 1 < xs.length; i++) {
    const [p, q] = [xs[i]!, xs[i + 1]!];
    const [sp, sq] = [sill(p), sill(q)];
    const [fp, fq] = [Math.max(sp, level(p)), Math.max(sq, level(q))];
    if (fp > sp + 1e-4 || fq > sq + 1e-4) face(m, "interiorWall", [[p, sp, zi], [q, sq, zi], [q, fq, zi], [p, fp, zi]], [0, 0, s]);
    face(m, "interiorFloor", [[p, sp, zs(sp, p)], [q, sq, zs(sq, q)], [q, sq, zi], [p, sp, zi]], [0, 1, 0]);
  }
  face(m, "interiorWall", [[d.x0, b, zs(b, d.x0)], [d.x1, b, zs(b, d.x1)], [d.x1, b, zi], [d.x0, b, zi]], [0, -1, 0]);
  const steps = 8;
  // the jambs 3 mm inside the doorway, off the inner walls of the door's frame at its edges
  for (const [x, dir] of [[d.x0 + 0.003, 1], [d.x1 - 0.003, -1]] as const) {
    const a = sill(x);
    const prof = Array.from({ length: steps + 1 }, (_, k) => a + ((b - a) * k) / steps);
    face(m, "interiorWall", [...prof.map((y): Vec3 => [x, y, zs(y, x)]), [x, b, zi], [x, a, zi]], [dir, 0, 0]);
  }
}
