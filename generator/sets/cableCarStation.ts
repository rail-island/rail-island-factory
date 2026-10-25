// The cable car station types (docs/models/sets.md, docs/models/cable-car-stations.md).
// A type is a footprint, a rope-head height and the whole station drawn round the head:
// the hall and the roof it carries forward over the platform, the head that holds the
// bull wheel, the wheel itself, the boarding platform and the stairs down from it. The
// game passes the VIEW -- what the line through the station needs: whether its cabins
// circulate (a curved platform round the wheel) or shuttle (a rectangular U), how far
// below the rope the cabin's door sill hangs (the platform's height) and how wide the
// cabin is (the platform's inner edge) -- and draws what `buildStation` returns. It
// solves the rope itself. This module also carries the PYLON: a sized part, built for
// whatever height the game's rope solver stands it at.
//
// Station-local frame: +Z faces the first support along the rope (the head stands out
// in front, `headZ` along +Z), +X is the station's right, y = 0 is the terrain level the
// station is placed at. Only the footprint (w x d about the origin) is levelled, so what
// stands outside it (the head, the platform's legs) is sunk COLUMN_SINK into the ground.
//
// THE CLEARANCES are hard rules (`stationFouls`, test/cableCarStation.test.ts): nothing
// but the wheel stands in the ring a cabin sweeps round it, nothing stands in the two
// lanes the cabins leave along, nothing but the platform stands in its band, and nothing
// stands over the stairs.
//
// Pure data, no imports: bundled into export/sets/cableCarStation.js for the game.

export type CableCarMaterial = "steel" | "timber" | "glass" | "concrete" | "stone" | "deck" | "rope" | "wheel";
export type Rgb = [number, number, number];

/** Which part of a station a box belongs to: `wheel` turns about the head, the rest stands still. */
export type StationPart = "hall" | "head" | "wheel" | "platform" | "stairs";
/** Which level of detail draws a box: the full one, the low (distant) one, or both. */
export type StationLevel = "full" | "low" | "both";

/** One box of a station, in the station-local frame. */
export interface StationBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  /** Tilt about X, then about Z (three.js Euler XYZ with no Y): Rz is applied first. */
  rotX?: number;
  rotZ?: number;
  /** A triangular prism instead of a box: two gable faces along Z, the ridge at +Y. */
  profile?: "gable";
  color: Rgb;
  material: CableCarMaterial;
  part: StationPart;
  level: StationLevel;
}

/**
 * A flat annular SECTOR, centred on (cx, cy, cz): the curved platform, its railing, the
 * wheel's rim and spokes. `apexX`, `apexZ` is the horizontal direction of the sector's
 * middle; it opens `halfAngle` each side of it (PI is a whole ring). `thick` is its
 * height, centred on cy.
 */
export interface StationSector {
  cx: number; cy: number; cz: number;
  apexX: number; apexZ: number;
  rIn: number; rOut: number;
  halfAngle: number;
  thick: number;
  color: Rgb;
  material: CableCarMaterial;
  part: StationPart;
  level: StationLevel;
}

/** What the game tells a station about the line through it. */
export interface StationView {
  /** Three or more cabins go round the wheel: a curved platform. Otherwise a rectangular U. */
  circulating: boolean;
  /** Studs from the rope down to the cabin's door sill: the platform stands just below it. */
  sillDrop: number;
  /** Half the cabin's width, so the platform's inner edge stands beside the cabin. */
  halfWidth: number;
}

/**
 * The view a station is drawn with before its line has a cabin: the middle of the
 * catalog's own range (gondola-cabin 8.13, cabin-classic 8.54, cablecar-cabin 8.22 below
 * the rope), and the shuttle's rectangular platform a new line starts with.
 */
export const DEFAULT_VIEW: StationView = { circulating: false, sillDrop: 8.3, halfWidth: 2.0 };

/** Everything a station is drawn from. The wheel turns about (0, headY, headZ). */
export interface StationModel {
  boxes: StationBox[];
  sectors: StationSector[];
  headY: number;
  headZ: number;
  /** The platform's walking surface, or null when the view leaves no room for one. */
  deckY: number | null;
}

/** One box in a pylon: x across the line, z along it, y up from the anchor. */
export interface PylonBox {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: CableCarMaterial;
}

/** Per type: the footprint and rope-head height a station is placed with. */
export const TYPE_META: Record<string, { w: number; d: number; ropeHeadY: number }> = {
  open_gantry: { w: 14, d: 18, ropeHeadY: 16 },
  alpine_chalet: { w: 18, d: 24, ropeHeadY: 15 },
  glass_modern: { w: 18, d: 26, ropeHeadY: 17 },
  concrete_drive: { w: 22, d: 30, ropeHeadY: 19 },
};

const STEEL: Rgb = [120, 128, 136];
const STEEL_DARK: Rgb = [62, 66, 72];
const TIMBER: Rgb = [140, 96, 56];
const TIMBER_DARK: Rgb = [96, 64, 38];
const GLASS: Rgb = [180, 205, 225];
const CONCRETE: Rgb = [168, 165, 158];
const STONE: Rgb = [140, 136, 128];
const DECK: Rgb = [96, 92, 88];
const WHEEL: Rgb = [70, 74, 80];

// --- the loading gauge (the game's core/rail/CableCar.ts) ---
/** How far a free-standing column reaches below its anchor, so sloping ground never shows a gap. */
export const COLUMN_SINK = 16;
/** The bull wheel's radius: the two rope strands are its diameter. */
export const WHEEL_RADIUS = 5;
/** How far the deepest cabin hangs below the rope. */
export const CABIN_DROP = 10;
/** Half the widest cabin's width, with a little margin. */
export const CABIN_HALF_WIDTH = 2.5;
/** The ring a cabin sweeps about the wheel axis. */
export const SWEEP_INNER_R: number = WHEEL_RADIUS - CABIN_HALF_WIDTH;
export const SWEEP_OUTER_R: number = WHEEL_RADIUS + CABIN_HALF_WIDTH;
/** Above the rope the wheel's bearing cap and the cabins' grips reach this high. */
export const HEAD_TOP = 1.3;
const HEAD_CLEARANCE = 2;
/** The lowest a roof may come over the head and the platform, above the rope. */
const ROOF_CLEAR = 2.5;

/** Local +Z of the wheel axis for a station `depth` deep. */
export function headOverhangFor(depth: number): number {
  return depth / 2 + WHEEL_RADIUS + HEAD_CLEARANCE;
}

// --- the platform's measure ---
/** How far the deck sits below the sill, so a passenger steps DOWN into the cabin. */
const PLATFORM_STEP = 0.25;
const PLATFORM_WIDTH = 4.5;
/** Air between the cabin's flank and the deck edge. */
const PLATFORM_GAP = 0.5;
const RAIL_HEIGHT = 1.1;
/** How much of the turn the curved deck wraps, each side of its apex behind the wheel. */
const BOARD_ARC_HALF = (100 * Math.PI) / 180;
const STEP_RISE = 0.55;
const STEP_TREAD = 0.9;
/** Half the stairs' width: the halls leave them a door this wide. */
export const STAIR_HALF_WIDTH = 2.35;
/** Head room kept over every tread of the stairs. */
export const STAIR_HEADROOM = 2.4;

/** The platform's radial band about the wheel axis for a view. */
export function platformBand(view: StationView): { rIn: number; rOut: number } {
  const rIn = Math.max(WHEEL_RADIUS + view.halfWidth + PLATFORM_GAP, SWEEP_OUTER_R + 0.3);
  return { rIn, rOut: rIn + PLATFORM_WIDTH };
}

/** The platform's walking surface for a view, above the station's level. */
export function deckLevel(ropeHeadY: number, view: StationView): number {
  return ropeHeadY - view.sillDrop - PLATFORM_STEP;
}

/** The stairs from the platform: each tread's z range and top, the first one level with the deck. */
export function stairTreads(type: string, view: StationView = DEFAULT_VIEW): { z0: number; z1: number; top: number }[] {
  const dims = TYPE_META[type] ?? TYPE_META.open_gantry!;
  const deckY = deckLevel(dims.ropeHeadY, view);
  if (deckY <= STEP_RISE) return [];
  const topZ = headOverhangFor(dims.d) - platformBand(view).rOut;
  const steps = Math.max(3, Math.round(deckY / STEP_RISE));
  return Array.from({ length: steps }, (_, i) => {
    const z = topZ - (0.5 + i) * STEP_TREAD;
    return { z0: z - STEP_TREAD / 2, z1: z + STEP_TREAD / 2, top: deckY - (deckY * i) / steps };
  });
}

/** The corners of a box (or the six of a gable prism), placed with its tilts. */
export function boxCorners(b: StationBox): [number, number, number][] {
  const x = b.sx / 2, y = b.sy / 2, z = b.sz / 2;
  const local: [number, number, number][] = b.profile === "gable"
    ? [[-x, -y, z], [x, -y, z], [0, y, z], [-x, -y, -z], [x, -y, -z], [0, y, -z]]
    : [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  const cz = Math.cos(b.rotZ ?? 0), sz = Math.sin(b.rotZ ?? 0);
  const cx = Math.cos(b.rotX ?? 0), sx = Math.sin(b.rotX ?? 0);
  return local.map(([px, py, pz]) => {
    const x1 = px * cz - py * sz, y1 = px * sz + py * cz, z1 = pz;
    const y2 = y1 * cx - z1 * sx, z2 = y1 * sx + z1 * cx;
    return [b.cx + x1, b.cy + y2, b.cz + z2];
  });
}

/** An axis-aligned extent, with the closest and farthest horizontal distance from the wheel axis. */
interface Extent { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; near: number; far: number }

function boxExtent(b: StationBox, headZ: number): Extent {
  const p = boxCorners(b);
  const xs = p.map((v) => v[0]), ys = p.map((v) => v[1]), zs = p.map((v) => v[2]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const dz0 = z0 - headZ, dz1 = z1 - headZ;
  return {
    x0, x1, y0: Math.min(...ys), y1: Math.max(...ys), z0, z1,
    near: Math.hypot(Math.max(x0, 0, -x1), Math.max(dz0, 0, -dz1)),
    far: Math.hypot(Math.max(Math.abs(x0), Math.abs(x1)), Math.max(Math.abs(dz0), Math.abs(dz1))),
  };
}

function sectorExtent(s: StationSector, headZ: number): Extent {
  // a sector about the wheel axis knows its own radial range exactly; one elsewhere is bounded by its circle
  const off = Math.hypot(s.cx, s.cz - headZ);
  return {
    x0: s.cx - s.rOut, x1: s.cx + s.rOut, y0: s.cy - s.thick / 2, y1: s.cy + s.thick / 2, z0: s.cz - s.rOut, z1: s.cz + s.rOut,
    near: Math.max(0, s.rIn - off), far: s.rOut + off,
  };
}

/** Points sampled over a sector's plan, those ahead of `zMin`. */
function sectorAhead(s: StationSector, zMin: number): [number, number][] {
  const out: [number, number][] = [];
  const mid = Math.atan2(s.apexX, -s.apexZ);
  for (let i = 0; i <= 96; i++) {
    const a = mid - s.halfAngle + (2 * s.halfAngle * i) / 96;
    for (const r of [s.rIn, (s.rIn + s.rOut) / 2, s.rOut]) {
      const x = s.cx + Math.sin(a) * r, z = s.cz - Math.cos(a) * r;
      if (z > zMin) out.push([x, z]);
    }
  }
  return out;
}

/** Whether an extent fouls the ring a cabin sweeps about the wheel. */
function inCabinRing(headY: number, e: Extent): boolean {
  if (e.y1 <= headY - CABIN_DROP || e.y0 >= headY - 0.5) return false;
  return !(e.far < SWEEP_INNER_R || e.near > SWEEP_OUTER_R);
}

/**
 * Why a part of a station fouls the station's own clearances, or null when it is clear:
 * - `cabin ring`: anything but the wheel in the ring a cabin sweeps round the head;
 * - `head`: anything but the head and the wheel on the wheel or the grips riding it;
 * - `lanes`: anything in the two lanes the cabins leave the head along (beside each
 *   strand, ahead of the wheel axis, from the cabin's floor to above the grips) or, above
 *   the rope, ahead of the axis at all (the rope may leave climbing steeply);
 * - `platform`: anything but the platform in its band, from just under the deck to above
 *   its railing -- no column of the hall stands in the deck;
 * - `stairs`: anything but the stairs over a tread, lower than the head room.
 */
export function stationFouls(type: string, view: StationView, item: StationBox | StationSector): string | null {
  const dims = TYPE_META[type] ?? TYPE_META.open_gantry!;
  const headY = dims.ropeHeadY, headZ = headOverhangFor(dims.d);
  const sector = "rIn" in item;
  const e = sector ? sectorExtent(item, headZ) : boxExtent(item, headZ);
  if (item.part === "wheel") return null;
  if (inCabinRing(headY, e)) return "cabin ring";
  if (item.part !== "head" && e.near < SWEEP_OUTER_R + 0.1 && e.y0 < headY + HEAD_TOP && e.y1 > headY - CABIN_DROP - 2) return "head";
  if (e.z1 > headZ + 0.6 && item.part !== "head") {
    if (e.y1 > headY + HEAD_TOP) return "lanes";
    // the lanes: a cabin of the view's width beside each strand, with a little air
    const lo = WHEEL_RADIUS - view.halfWidth - 0.3, hi = WHEEL_RADIUS + view.halfWidth + 0.3;
    const inLane = (x0: number, x1: number): boolean => (x0 < hi && x1 > lo) || (x0 < -lo && x1 > -hi);
    if (e.y1 > headY - CABIN_DROP) {
      if (sector) {
        if (sectorAhead(item, headZ + 0.6).some(([x]) => inLane(x, x))) return "lanes";
      } else if (inLane(e.x0, e.x1)) return "lanes";
    }
  }
  if (item.part !== "platform" && item.part !== "stairs") {
    const { rIn, rOut } = platformBand(view);
    const deckY = deckLevel(headY, view);
    const band = e.near < rOut && e.far > rIn && e.y1 > deckY - 1 && e.y0 < deckY + RAIL_HEIGHT + 0.3;
    if (band) return "platform";
  }
  if (item.part !== "stairs" && e.x0 < STAIR_HALF_WIDTH && e.x1 > -STAIR_HALF_WIDTH) {
    // a sector by the points of its plan (its bounding square would cover the gap left for the stairs)
    const plan = sector ? sectorAhead(item, -Infinity).filter(([x]) => Math.abs(x) < STAIR_HALF_WIDTH) : null;
    for (const t of stairTreads(type, view)) {
      const over = plan ? plan.some(([, z]) => z > t.z0 && z < t.z1) : e.z0 < t.z1 && e.z1 > t.z0;
      if (over && e.y1 > t.top + 0.3 && e.y0 < t.top + STAIR_HEADROOM) return "stairs";
    }
  }
  return null;
}

// --- drawing ---

type Vec3 = [number, number, number];

type Ctx = {
  w: number; d: number; headY: number; headZ: number;
  /** The underside of a roof over the head and the platform. */
  eaveY: number;
  /** The roof's front edge, over the wheel axis. */
  zF: number;
  /** Where a column beside the platform may branch: over its railing. */
  forkY: number;
  /** The platform's plan, which no column of the hall may stand in (null: no platform). */
  deck: { circulating: boolean; rIn: number; rOut: number; zFront: number } | null;
  /** The part the boxes being drawn belong to. */
  part: StationPart;
  boxes: StationBox[];
  sectors: StationSector[];
};

/** Which levels a box is drawn at: the full one (default), the low one or both. */
type Lv = StationLevel;

/**
 * Where a hall column wanted at (x, z), `half` wide each way, may stand: slid back
 * along -Z until it is clear of the platform with a little air -- behind the curved
 * deck's outer rim, or behind the rectangular deck's back edge -- so no column stands in
 * the deck. Each hall asks for its front columns through this, so they follow the plan.
 */
function clearZ(c: Ctx, x: number, z: number, half: number): number {
  const d = c.deck;
  if (!d) return z;
  const h = half + 0.3;
  const fouls = (cz: number): boolean => {
    const x0 = x - h, x1 = x + h, z0 = cz - h, z1 = cz + h;
    if (d.circulating) {
      const near = Math.hypot(Math.max(x0, 0, -x1), Math.max(z0 - c.headZ, 0, c.headZ - z1));
      const far = Math.hypot(Math.max(Math.abs(x0), Math.abs(x1)), Math.max(Math.abs(z0 - c.headZ), Math.abs(z1 - c.headZ)));
      return near < d.rOut && far > d.rIn;
    }
    const hit = (ax0: number, ax1: number, az0: number, az1: number): boolean => x0 < ax1 && x1 > ax0 && z0 < az1 && z1 > az0;
    return hit(-d.rOut, d.rOut, c.headZ - d.rOut, c.headZ - d.rIn)
      || hit(d.rIn, d.rOut, c.headZ - d.rIn, d.zFront) || hit(-d.rOut, -d.rIn, c.headZ - d.rIn, d.zFront);
  };
  let cz = z;
  while (fouls(cz)) cz -= 0.1;
  return Math.round(cz * 100) / 100;
}

function put(c: Ctx, b: Omit<StationBox, "part" | "level">, lv: Lv): void {
  c.boxes.push({ ...b, part: c.part, level: lv });
}

/** An axis-aligned box between two corners. */
function blk(c: Ctx, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void {
  put(c, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, sx: Math.abs(x1 - x0), sy: Math.abs(y1 - y0), sz: Math.abs(z1 - z0), color, material }, lv);
}

/** A sector about the wheel axis (or about `cz` along the centre line), its middle toward `apex` radians from -Z. */
function sector(c: Ctx, rIn: number, rOut: number, y: number, thick: number, apex: number, halfAngle: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full", cz = c.headZ): void {
  c.sectors.push({ cx: 0, cy: y, cz, apexX: Math.sin(apex), apexZ: -Math.cos(apex), rIn, rOut, halfAngle, thick, color, material, part: c.part, level: lv });
}

/**
 * A hall's low detail: its two sides and, over the stairs climbing out of its
 * front, only its back wall and what stands above the door (`doorY`).
 */
function hallLow(c: Ctx, x: number, top: number, doorY: number, z0: number, z1: number, color: Rgb, material: CableCarMaterial): void {
  pair(c, STAIR_HALF_WIDTH + 0.05, x, 0, top, z0, z1, color, material, "low");
  blk(c, -STAIR_HALF_WIDTH - 0.05, STAIR_HALF_WIDTH + 0.05, doorY, top, z0, z1, color, material, "low");
  blk(c, -STAIR_HALF_WIDTH - 0.05, STAIR_HALF_WIDTH + 0.05, 0, doorY, z0, z0 + 0.8, color, material, "low");
}

/** The same box on both sides of the centre line (x0 < x1 on the +X side). */
function pair(c: Ctx, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void {
  blk(c, x0, x1, y0, y1, z0, z1, color, material, lv);
  blk(c, -x1, -x0, y0, y1, z0, z1, color, material, lv);
}

/** A square-section bar from a to b, in any direction (its length along the box's own y). */
function bar(c: Ctx, a: Vec3, b: Vec3, t: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void {
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
function bars(c: Ctx, a: Vec3, b: Vec3, t: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void {
  bar(c, a, b, t, color, material, lv);
  bar(c, [-a[0], a[1], a[2]], [-b[0], b[1], b[2]], t, color, material, lv);
}

/**
 * A two-sided pitched roof, ridge along Z: each slab's underside runs from the
 * ridge (x = 0, `ridgeY`) down to the eave (x = +-`eaveX`, `eaveY`).
 */
function pitchedRoof(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, z0: number, z1: number, thick: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void {
  const a = Math.atan2(ridgeY - eaveY, eaveX);
  const len = Math.hypot(eaveX, ridgeY - eaveY) + thick * Math.tan(a);
  for (const s of [-1, 1]) {
    const mx = (s * eaveX) / 2 + s * Math.sin(a) * (thick / 2), my = (eaveY + ridgeY) / 2 + Math.cos(a) * (thick / 2);
    put(c, { cx: mx - s * Math.cos(a) * (thick * Math.tan(a)) / 2, cy: my + Math.sin(a) * (thick * Math.tan(a)) / 2, cz: (z0 + z1) / 2, sx: len, sy: thick, sz: z1 - z0, rotZ: -s * a, color, material }, lv);
  }
}

/** A strip lying on a pitched roof, along Z, `at` (0..1) of the way from ridge to eave. */
function roofStrip(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, at: number, z0: number, z1: number, width: number, height: number, color: Rgb, material: CableCarMaterial): void {
  const a = Math.atan2(ridgeY - eaveY, eaveX);
  for (const s of [-1, 1]) {
    const x = s * eaveX * at, y = ridgeY - (ridgeY - eaveY) * at;
    put(c, { cx: x + s * Math.sin(a) * (height / 2), cy: y + Math.cos(a) * (height / 2), cz: (z0 + z1) / 2, sx: width, sy: height, sz: z1 - z0, rotZ: -s * a, color, material }, "full");
  }
}

/** Ribs down a pitched roof's slope (corrugation, seams), every `step` along Z. */
function roofRibs(c: Ctx, eaveX: number, eaveY: number, ridgeY: number, thick: number, z0: number, z1: number, step: number, color: Rgb, material: CableCarMaterial): void {
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
  // the front pair stands behind the platform, whichever plan it has
  const colZ = [-hd + 0.6, 0, Math.max(1.6, clearZ(c, colX, hd - 0.6, 0.8))];
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
      // knee braces out under the truss's bottom chord, which carries the roof's side overhang
      bar(c, [x + s * 0.4, y0 - 4.5, z], [s * (colX + 4.4), y0 + 2.2, z], 0.3, FRAME, "steel");
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
  // the front posts stand behind the platform; where that brings them onto the inner pair, one pair carries the frame
  const front = clearZ(c, postX, hd - 0.6, 0.75);
  const posts = front - (hd / 2 - 0.3) < 2.5 ? [hd / 2 - 0.3] : [hd / 2 - 0.3, front];
  const lastPost = posts[posts.length - 1]!;
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
      blk(c, s * postX - 0.45, s * postX + 0.45, 1.0, roofUnder(postX) - 0.45, z - 0.45, z + 0.45, TIMBER_DARK, "timber", z === lastPost ? "both" : "full");
      // knee braces out to the eave purlin
      bar(c, [s * postX, c.eaveY - 3.6, z], [s * (eaveX - 1.9), c.eaveY + 0.1, z], 0.32, TIMBER_DARK, "timber");
    }
    blk(c, s * postX - 0.4, s * postX + 0.4, roofUnder(postX) - 0.85, roofUnder(postX) - 0.1, zH, c.zF, TIMBER_DARK, "timber", "both");
    blk(c, s * (eaveX - 1.2) - 0.3, s * (eaveX - 1.2) + 0.3, c.eaveY + 0.1, roofUnder(eaveX - 0.9) - 0.05, zB - 0.6, c.zF, TIMBER_DARK, "timber");
    // the braces that carry the frame forward over the wheel
    bar(c, [s * postX, c.eaveY - 6.5, lastPost + 0.4], [s * postX, roofUnder(postX) - 0.9, zFront - 0.3], 0.4, TIMBER_DARK, "timber");
    if (posts.length > 1) {
      bar(c, [s * postX, c.eaveY - 3, posts[0]! + 0.4], [s * postX, roofUnder(postX) - 0.9, lastPost - 0.5], 0.3, TIMBER_DARK, "timber");
      bar(c, [s * postX, c.eaveY - 3, lastPost - 0.4], [s * postX, roofUnder(postX) - 0.9, posts[0]! + 0.5], 0.3, TIMBER_DARK, "timber");
    }
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
  const tx = hw - 0.6, tz = clearZ(c, hw - 0.6, hd - 0.6, 0.9), fork = c.forkY;
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
  // the front portal stands behind the platform; where that brings it onto the inner one, one portal carries the roof
  const frontPortal = clearZ(c, px, hd - 2, 1.0);
  const portals = frontPortal - (hd / 2 - 1.5) < 2.5 ? [hd / 2 - 1.5] : [hd / 2 - 1.5, frontPortal];
  const lastPortal = portals[portals.length - 1]!;
  const front = c.zF - 0.7;
  for (const z of portals) {
    pair(c, px - 0.7, px + 0.7, 0, roof0, z - 0.7, z + 0.7, CONCRETE, "concrete", "both");
    blk(c, -roofX, roofX, c.eaveY, roof0, z - 0.6, z + 0.6, CONCRETE, "concrete", z === lastPortal ? "both" : "full");
    bars(c, [px + 0.5, c.eaveY - 4, z], [roofX - 1.2, c.eaveY + 0.2, z], 0.8, CONCRETE, "concrete");
  }
  blk(c, -roofX, roofX, c.eaveY, roof0, front - 0.6, front + 0.6, CONCRETE, "concrete", "both");
  pair(c, roofX - 1.2, roofX, c.eaveY, roof0, zH, front - 0.6, CONCRETE, "concrete", "both");
  for (const s of [-1, 1]) bar(c, [s * px, c.eaveY - 5, lastPortal + 0.6], [s * px, c.eaveY + 0.2, front - 0.6], 0.8, CONCRETE, "concrete");
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

const HALLS: Record<string, (c: Ctx) => void> = {
  open_gantry: buildOpenGantry,
  alpine_chalet: buildAlpineChalet,
  glass_modern: buildGlassModern,
  concrete_drive: buildConcreteDrive,
};

// --- the head and the bull wheel ---

/**
 * How each type holds its wheel and what it is painted: a pedestal rising from the
 * ground under it (a column, the machine housing and the bearing, all inside the ring
 * the cabins sweep), or -- where the hall's machine room stands over the wheel -- a
 * drive shaft hung from the gearbox under the roof.
 */
interface HeadStyle {
  mount: "pedestal" | "hung";
  column: Rgb;
  columnMaterial: CableCarMaterial;
  housing: Rgb;
  /** The spokes' paint; the rim is the dark wheel steel. */
  spokes: Rgb;
}

const HEADS: Record<string, HeadStyle> = {
  open_gantry: { mount: "hung", column: STEEL_DARK, columnMaterial: "steel", housing: STEEL_DARK, spokes: FRAME },
  alpine_chalet: { mount: "pedestal", column: STONE, columnMaterial: "stone", housing: TIMBER_DARK, spokes: STEEL },
  glass_modern: { mount: "pedestal", column: WHITE, columnMaterial: "concrete", housing: ACCENT, spokes: WHITE },
  concrete_drive: { mount: "hung", column: STEEL_DARK, columnMaterial: "steel", housing: STEEL_DARK, spokes: ORANGE },
};

const WHEEL_THICK = 0.75;

function buildHead(c: Ctx, style: HeadStyle): void {
  c.part = "head";
  const y = c.headY, z = c.headZ;
  if (style.mount === "pedestal") {
    // NO pad under the column: a slab on uneven ground reads as floating, so it is sunk
    blk(c, -1.4, 1.4, -COLUMN_SINK, y - 4.2, z - 1.4, z + 1.4, style.column, style.columnMaterial, "both");
    blk(c, -1.7, 1.7, y - 4.2, y - 1.0, z - 1.7, z + 1.7, style.housing, style.columnMaterial === "stone" ? "timber" : "steel", "both");
    blk(c, -1.75, 1.75, y - 3.0, y - 2.6, z - 1.75, z + 1.75, STEEL_DARK, "steel");
    blk(c, -1.1, 1.1, y - 1.0, y - 0.45, z - 1.1, z + 1.1, STEEL, "steel");
  } else {
    // the shaft down from the gearbox under the roof to the wheel's hub
    blk(c, -0.4, 0.4, y + 0.45, y + 1.45, z - 0.4, z + 0.4, STEEL, "steel");
    blk(c, -0.9, 0.9, y + 1.15, y + 1.45, z - 0.9, z + 0.9, style.housing, "steel");
  }
  // the bearing cap on the hub
  blk(c, -0.6, 0.6, y + 0.4, y + 0.85, z - 0.6, z + 0.6, STEEL, "steel");
}

/** The wheel the rope wraps: an open rim on spokes round a hub, turning about (0, headY, headZ). */
function buildWheel(c: Ctx, style: HeadStyle): void {
  c.part = "wheel";
  const y = c.headY;
  sector(c, WHEEL_RADIUS - 0.35, WHEEL_RADIUS + 0.35, y, WHEEL_THICK, 0, Math.PI, WHEEL, "wheel");
  for (let i = 0; i < 8; i++) sector(c, 0.7, WHEEL_RADIUS - 0.3, y, WHEEL_THICK * 0.4, (i / 8) * Math.PI * 2, 0.045, style.spokes, "steel");
  blk(c, -0.75, 0.75, y - WHEEL_THICK * 0.7, y + WHEEL_THICK * 0.55, c.headZ - 0.75, c.headZ + 0.75, STEEL_DARK, "steel");
}

// --- the boarding platform and its stairs ---

/**
 * How each type builds its platform, so it reads as part of the hall: the deck's paint
 * and depth, the edge beam under its rim, the railing, the legs and the stairs.
 */
interface PlatformStyle {
  deck: Rgb;
  deckThick: number;
  fascia: Rgb;
  fasciaMaterial: CableCarMaterial;
  fasciaDepth: number;
  railing: "steel" | "timber" | "glass" | "parapet";
  rail: Rgb;
  leg: Rgb;
  legMaterial: CableCarMaterial;
  legSize: number;
  /** A plinth at the foot of each leg, straddling grade. */
  plinth?: Rgb;
  /** Knee braces from each leg up to the deck's edges. */
  braces: boolean;
  /** Open treads on stringers, or a solid flight of blocks. */
  stairs: "open" | "solid";
  stair: Rgb;
  stairMaterial: CableCarMaterial;
}

const PLATFORMS: Record<string, PlatformStyle> = {
  open_gantry: {
    deck: [86, 90, 96], deckThick: 0.3, fascia: FRAME, fasciaMaterial: "steel", fasciaDepth: 0.7,
    railing: "steel", rail: FRAME, leg: FRAME, legMaterial: "steel", legSize: 0.6, plinth: CONCRETE, braces: true,
    stairs: "open", stair: FRAME, stairMaterial: "steel",
  },
  alpine_chalet: {
    deck: [158, 112, 68], deckThick: 0.35, fascia: TIMBER_DARK, fasciaMaterial: "timber", fasciaDepth: 0.6,
    railing: "timber", rail: TIMBER_DARK, leg: TIMBER_DARK, legMaterial: "timber", legSize: 0.7, plinth: STONE, braces: true,
    stairs: "open", stair: TIMBER_DARK, stairMaterial: "timber",
  },
  glass_modern: {
    deck: [196, 196, 190], deckThick: 0.4, fascia: WHITE, fasciaMaterial: "concrete", fasciaDepth: 0.5,
    railing: "glass", rail: MULLION, leg: STEEL, legMaterial: "steel", legSize: 0.5, braces: false,
    stairs: "solid", stair: WHITE, stairMaterial: "concrete",
  },
  concrete_drive: {
    deck: [176, 173, 166], deckThick: 0.7, fascia: CONC_LIGHT, fasciaMaterial: "concrete", fasciaDepth: 0.6,
    railing: "parapet", rail: CONCRETE, leg: CONCRETE, legMaterial: "concrete", legSize: 1.1, braces: false,
    stairs: "solid", stair: CONCRETE, stairMaterial: "concrete",
  },
};

/** A leg from under the deck at (x, z) down past the ground, with its plinth and braces. */
function leg(c: Ctx, st: PlatformStyle, x: number, z: number, under: number, braces: Array<[number, number]>): void {
  const h = st.legSize / 2;
  blk(c, x - h, x + h, -COLUMN_SINK, under, z - h, z + h, st.leg, st.legMaterial);
  if (st.plinth) blk(c, x - h - 0.3, x + h + 0.3, -1.2, 0.5, z - h - 0.3, z + h + 0.3, st.plinth, st.plinth === STONE ? "stone" : "concrete");
  if (!st.braces) return;
  for (const [bx, bz] of braces) bar(c, [x, under - 2, z], [bx, under - 0.05, bz], 0.25, st.leg, st.legMaterial);
}

/** A railing along a straight edge from (x0, z0) to (x1, z1), standing on the deck at `y`. */
function railRun(c: Ctx, st: PlatformStyle, x0: number, z0: number, x1: number, z1: number, y: number): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  if (len < 0.3) return;
  if (Math.abs(x1 - x0) > 0.01 && Math.abs(z1 - z0) > 0.01) {
    // a slanting run (the curve's ends): a top rail and a mid rail on a post at each end
    const material: CableCarMaterial = st.railing === "parapet" ? "concrete" : st.railing === "timber" ? "timber" : "steel";
    bar(c, [x0, y + RAIL_HEIGHT - 0.08, z0], [x1, y + RAIL_HEIGHT - 0.08, z1], st.railing === "parapet" ? 0.3 : 0.16, st.rail, material);
    if (st.railing !== "parapet") bar(c, [x0, y + 0.55, z0], [x1, y + 0.55, z1], 0.1, st.rail, material);
    // one post, at the inner end: the outer one is the curved railing's own last post
    blk(c, x0 - 0.08, x0 + 0.08, y, y + RAIL_HEIGHT - 0.1, z0 - 0.08, z0 + 0.08, st.rail, material);
    return;
  }
  const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const span = (t: number, h0: number, h1: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full"): void => {
    if (alongX) blk(c, mx - len / 2, mx + len / 2, y + h0, y + h1, mz - t / 2, mz + t / 2, color, material, lv);
    else blk(c, mx - t / 2, mx + t / 2, y + h0, y + h1, mz - len / 2, mz + len / 2, color, material, lv);
  };
  const posts = (step: number, t: number, color: Rgb, material: CableCarMaterial): void => {
    const n = Math.max(1, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const px = x0 + ((x1 - x0) * i) / n, pz = z0 + ((z1 - z0) * i) / n;
      blk(c, px - t / 2, px + t / 2, y, y + RAIL_HEIGHT, pz - t / 2, pz + t / 2, color, material);
    }
  };
  if (st.railing === "steel") {
    span(0.14, RAIL_HEIGHT - 0.12, RAIL_HEIGHT, st.rail, "steel");
    span(0.1, 0.5, 0.58, st.rail, "steel");
    span(0.1, 0, 0.15, st.rail, "steel");
    posts(1.6, 0.14, st.rail, "steel");
  } else if (st.railing === "timber") {
    span(0.24, RAIL_HEIGHT - 0.18, RAIL_HEIGHT, st.rail, "timber");
    span(0.16, 0.1, 0.24, st.rail, "timber");
    posts(0.9, 0.14, TIMBER, "timber");
  } else if (st.railing === "glass") {
    span(0.08, 0.05, RAIL_HEIGHT - 0.08, GLASS, "glass");
    span(0.14, RAIL_HEIGHT - 0.08, RAIL_HEIGHT, st.rail, "steel");
  } else {
    span(0.3, 0, RAIL_HEIGHT, st.rail, "concrete");
    span(0.4, RAIL_HEIGHT, RAIL_HEIGHT + 0.12, CONC_LIGHT, "concrete");
  }
}

/** The same railing round the outer rim of an arc about the wheel axis, `apex` radians from -Z. */
function railArc(c: Ctx, st: PlatformStyle, r: number, apex: number, half: number, y: number): void {
  if (half <= 0.01) return;
  // `out` sets a cap a little proud of what it caps: a sector is not pulled apart from its
  // neighbours as the boxes are, so no two of them may share a face
  const ring = (t: number, h0: number, h1: number, color: Rgb, material: CableCarMaterial, lv: Lv = "full", out = 0): void => {
    sector(c, r - t + out, r + out, y + (h0 + h1) / 2, h1 - h0, apex, half, color, material, lv);
  };
  const posts = (step: number, t: number, color: Rgb, material: CableCarMaterial): void => {
    const n = Math.max(1, Math.round((2 * half * r) / step));
    for (let i = 0; i <= n; i++) {
      const a = apex - half + (2 * half * i) / n;
      const px = Math.sin(a) * (r - t / 2), pz = c.headZ - Math.cos(a) * (r - t / 2);
      // each post stops inside the top rail rather than flush with its top
      blk(c, px - t / 2, px + t / 2, y, y + RAIL_HEIGHT - 0.06, pz - t / 2, pz + t / 2, color, material);
    }
  };
  if (st.railing === "steel") {
    ring(0.14, RAIL_HEIGHT - 0.12, RAIL_HEIGHT, st.rail, "steel");
    ring(0.1, 0.5, 0.58, st.rail, "steel");
    ring(0.1, 0, 0.15, st.rail, "steel");
    posts(1.6, 0.14, st.rail, "steel");
  } else if (st.railing === "timber") {
    ring(0.24, RAIL_HEIGHT - 0.18, RAIL_HEIGHT, st.rail, "timber");
    ring(0.16, 0.1, 0.24, st.rail, "timber");
    posts(0.9, 0.14, TIMBER, "timber");
  } else if (st.railing === "glass") {
    ring(0.08, 0.05, RAIL_HEIGHT - 0.08, GLASS, "glass");
    ring(0.14, RAIL_HEIGHT - 0.08, RAIL_HEIGHT, st.rail, "steel", "full", 0.03);
  } else {
    ring(0.3, 0, RAIL_HEIGHT, st.rail, "concrete");
    ring(0.4, RAIL_HEIGHT, RAIL_HEIGHT + 0.12, CONC_LIGHT, "concrete", "full", 0.05);
  }
}

/**
 * The curved platform a circulating line's cabins ride round: one sector of deck about
 * the wheel axis, its edge beams, the railing round its outer rim with a gap where the
 * stairs leave from the apex behind the wheel, and legs under it.
 */
function curvedPlatform(c: Ctx, st: PlatformStyle, deckY: number, rIn: number, rOut: number): void {
  const t = st.deckThick;
  sector(c, rIn, rOut, deckY - t / 2, t, 0, BOARD_ARC_HALF, st.deck, "deck", "both");
  const under = deckY - t;
  sector(c, rOut - 0.3, rOut, under - st.fasciaDepth / 2, st.fasciaDepth, 0, BOARD_ARC_HALF, st.fascia, st.fasciaMaterial);
  sector(c, rIn, rIn + 0.3, under - st.fasciaDepth / 2, st.fasciaDepth, 0, BOARD_ARC_HALF, st.fascia, st.fasciaMaterial);
  // the railing either side of the stairs' opening
  const gap = Math.asin(Math.min(1, (STAIR_HALF_WIDTH + 0.1) / rOut));
  const half = (BOARD_ARC_HALF - gap) / 2;
  for (const s of [-1, 1]) railArc(c, st, rOut, s * (gap + half), half, deckY);
  // closing each end of the curve
  for (const s of [-1, 1]) {
    const a = s * BOARD_ARC_HALF;
    const r0 = rIn + 0.2, r1 = rOut;
    railRun(c, st, Math.sin(a) * r0, c.headZ - Math.cos(a) * r0, Math.sin(a) * r1, c.headZ - Math.cos(a) * r1, deckY);
  }
  const rMid = (rIn + rOut) / 2;
  for (let i = -2; i <= 2; i++) {
    const a = (i / 2) * BOARD_ARC_HALF * 0.85;
    const x = Math.sin(a) * rMid, z = c.headZ - Math.cos(a) * rMid;
    const ex = (r: number): [number, number] => [Math.sin(a) * r, c.headZ - Math.cos(a) * r];
    leg(c, st, x, z, under - st.fasciaDepth * 0.5, [ex(rIn + 0.4), ex(rOut - 0.4)]);
  }
}

/**
 * The rectangular U a shuttling line's cabins stop at: a back deck across behind the
 * wheel and an arm forward along each strand, in the same band the curve would occupy,
 * with the railing on the outboard edges (the inboard edge is where you board) and a gap
 * in the back one where the stairs leave.
 */
function rectPlatform(c: Ctx, st: PlatformStyle, deckY: number, rIn: number, rOut: number): void {
  const t = st.deckThick, under = deckY - t;
  const zBack = c.headZ - rOut, zIn = c.headZ - rIn;
  // the arms reach as far forward as the curve's ends do
  const zFront = c.headZ + rOut * Math.max(0, -Math.cos(BOARD_ARC_HALF));
  const deck = (x0: number, x1: number, z0: number, z1: number): void => {
    blk(c, x0, x1, under, deckY, z0, z1, st.deck, "deck", "both");
  };
  deck(-rOut, rOut, zBack, zIn);
  for (const s of [-1, 1]) deck(s > 0 ? rIn : -rOut, s > 0 ? rOut : -rIn, zIn, zFront);
  const fd = st.fasciaDepth;
  const beam = (x0: number, x1: number, z0: number, z1: number): void => {
    blk(c, x0, x1, under - fd, under, z0, z1, st.fascia, st.fasciaMaterial);
  };
  beam(-rOut, rOut, zBack, zBack + 0.3);
  beam(-rIn, rIn, zIn - 0.3, zIn);
  for (const s of [-1, 1]) {
    beam(s > 0 ? rOut - 0.3 : -rOut, s > 0 ? rOut : -rOut + 0.3, zBack, zFront);
    beam(s > 0 ? rIn : -rIn - 0.3, s > 0 ? rIn + 0.3 : -rIn, zIn, zFront);
    beam(s > 0 ? rIn : -rOut, s > 0 ? rOut : -rIn, zFront - 0.3, zFront);
  }
  // the railing: the back edge either side of the stairs, each arm's outboard edge and front end
  const g = STAIR_HALF_WIDTH + 0.1;
  for (const s of [-1, 1]) {
    railRun(c, st, s * g, zBack + 0.15, s * (rOut - 0.15), zBack + 0.15, deckY);
    railRun(c, st, s * (rOut - 0.15), zBack + 0.15, s * (rOut - 0.15), zFront - 0.15, deckY);
    railRun(c, st, s * (rIn + 0.4), zFront - 0.15, s * (rOut - 0.15), zFront - 0.15, deckY);
  }
  // legs: three under each arm, three under the back deck between them
  const rMid = (rIn + rOut) / 2, zMid = (zBack + zIn) / 2;
  for (const s of [-1, 1]) {
    for (const z of [zMid, (zIn + zFront) / 2, zFront - 0.8]) leg(c, st, s * rMid, z, under - fd * 0.5, [[s * (rIn + 0.4), z], [s * (rOut - 0.4), z]]);
  }
  for (const x of [-rMid / 2, 0, rMid / 2]) leg(c, st, x, zMid, under - fd * 0.5, [[x, zBack + 0.4], [x, zIn - 0.4]]);
}

/** The stairs down from the platform's back edge toward the hall, which leaves them a door. */
function stairs(c: Ctx, st: PlatformStyle, deckY: number, topZ: number): void {
  if (deckY <= STEP_RISE) return;
  const steps = Math.max(3, Math.round(deckY / STEP_RISE));
  const w = STAIR_HALF_WIDTH - 0.1;
  const zAt = (i: number): number => topZ - (0.5 + i) * STEP_TREAD;
  const footZ = topZ - steps * STEP_TREAD;
  for (let i = 0; i < steps; i++) {
    const h = deckY - (deckY * i) / steps;
    const z = zAt(i);
    if (st.stairs === "solid") {
      // each tread is a block down past the ground, so a flight on a slope never floats
      blk(c, -w, w, -COLUMN_SINK, h, z - STEP_TREAD / 2, z + STEP_TREAD / 2, st.stair, st.stairMaterial, i % 4 === 0 ? "both" : "full");
    } else {
      blk(c, -w + 0.3, w - 0.3, h - 0.15, h, z - STEP_TREAD / 2, z + STEP_TREAD / 2, st.deck, "deck");
    }
  }
  if (st.stairs === "solid") {
    // a cheek wall each side, stepped with the flight
    for (const s of [-1, 1]) bar(c, [s * (w + 0.12), deckY * 0.5 + 0.2, topZ], [s * (w + 0.12), 0.2, footZ + STEP_TREAD], 0.24, CONC_LIGHT, "concrete");
    return;
  }
  // two stringers carry the open treads; a post under each at the deck end and halfway
  for (const s of [-1, 1]) {
    const x = s * (w - 0.15);
    bar(c, [x, deckY - 0.1, topZ], [x, 0.05, footZ], 0.3, st.stair, st.stairMaterial);
    bar(c, [s * (w + 0.05), deckY + RAIL_HEIGHT, topZ - 0.2], [s * (w + 0.05), RAIL_HEIGHT, footZ + 0.4], 0.12, st.stair, st.stairMaterial);
    for (const f of [0.15, 0.55]) {
      const z = topZ + (footZ - topZ) * f, top = deckY - deckY * f - 0.3;
      blk(c, x - 0.15, x + 0.15, -1, top, z - 0.15, z + 0.15, st.stair, st.stairMaterial);
    }
  }
  // the flight's silhouette for the distant level: a sloping beam
  bar(c, [0, deckY - 0.2, topZ - 0.3], [0, 0.1, footZ + 0.3], 0.3, st.stair, st.stairMaterial, "low");
}

// --- the whole station ---

/**
 * Flush faces of different materials pulled apart, so they never flicker: each colour
 * and material (in order of first use) is inset 0.0137 studs more than the one before,
 * a thin box proportionally less. Too small to see.
 */
function separateCoplanar(boxes: StationBox[]): StationBox[] {
  const rank = new Map<string, number>();
  for (const b of boxes) {
    const key = `${b.material}:${b.color.join(",")}`;
    if (!rank.has(key)) rank.set(key, rank.size);
  }
  return boxes.map((b) => {
    const r = rank.get(`${b.material}:${b.color.join(",")}`)!;
    const shrink = (v: number): number => v - 2 * r * Math.min(0.0137, v * 0.004);
    return { ...b, sx: shrink(b.sx), sy: shrink(b.sy), sz: shrink(b.sz) };
  });
}

/**
 * The whole station of a type, drawn for `view`: hall, head, wheel, platform and stairs,
 * at the type's own footprint and head height. An unknown type draws as the default.
 */
export function buildStation(type: string, view: StationView = DEFAULT_VIEW): StationModel {
  const key = TYPE_META[type] ? type : "open_gantry";
  const dims = TYPE_META[key]!;
  const headZ = headOverhangFor(dims.d);
  const deckY = deckLevel(dims.ropeHeadY, view);
  const hasDeck = deckY > 1;
  const c: Ctx = {
    w: dims.w, d: dims.d, headY: dims.ropeHeadY, headZ,
    eaveY: dims.ropeHeadY + ROOF_CLEAR, zF: headZ + 0.5,
    forkY: hasDeck ? deckY + RAIL_HEIGHT + 1.0 : dims.ropeHeadY - 6.5,
    deck: hasDeck ? { circulating: view.circulating, ...platformBand(view), zFront: headZ + platformBand(view).rOut * Math.max(0, -Math.cos(BOARD_ARC_HALF)) } : null,
    part: "hall", boxes: [], sectors: [],
  };
  HALLS[key]!(c);
  buildHead(c, HEADS[key]!);
  buildWheel(c, HEADS[key]!);
  if (hasDeck) {
    const st = PLATFORMS[key]!;
    const { rIn, rOut } = platformBand(view);
    c.part = "platform";
    if (view.circulating) curvedPlatform(c, st, deckY, rIn, rOut);
    else rectPlatform(c, st, deckY, rIn, rOut);
    c.part = "stairs";
    stairs(c, st, deckY, headZ - rOut);
  }
  return { boxes: separateCoplanar(c.boxes), sectors: c.sectors, headY: dims.ropeHeadY, headZ, deckY: hasDeck ? deckY : null };
}

// --- the pylon ---

const PYLON_PAINT: Rgb = [112, 122, 112];
const PYLON_DARK: Rgb = [70, 76, 72];

/**
 * A pylon `height` studs tall, the shape of a modern ropeway mast: a tubular steel mast
 * sunk into the ground (no footing pad -- a slab on uneven ground reads as floating),
 * flared in steps toward its foot, a collar straddling grade, a ladder up its back, the
 * cross-head carrying both strands with a maintenance walkway under it, and a rocker of
 * four sheaves under each strand, the rope riding their tops at `height`.
 *
 * The first three boxes are the mast, the collar and the cross-head: the silhouette a
 * distant pylon keeps.
 */
export function buildPylon(height: number): PylonBox[] {
  const out: PylonBox[] = [];
  const push = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: Rgb, material: CableCarMaterial): void => {
    out.push({ x, y, z, sx, sy, sz, color, material });
  };
  const top = height - 2.4;
  const arm = 2 * WHEEL_RADIUS + 2.4;
  push(0, (top - COLUMN_SINK) / 2, 0, 1.3, top + COLUMN_SINK, 1.3, PYLON_PAINT, "steel");
  push(0, -0.4, 0, 3.0, 2.4, 3.0, CONCRETE, "concrete");
  push(0, top + 0.45, 0, arm, 0.9, 1.1, PYLON_PAINT, "steel");
  // the mast flares toward its foot in two sleeves, each with a flange ring at its top
  const sleeves: Array<[number, number]> = [[0.55, 1.75], [0.3, 1.5]];
  for (const [frac, size] of sleeves) {
    const y1 = Math.max(1.2, top * frac);
    push(0, (y1 - COLUMN_SINK) / 2, 0, size, y1 + COLUMN_SINK, size, PYLON_PAINT, "steel");
    push(0, y1 - 0.12, 0, size + 0.3, 0.24, size + 0.3, PYLON_DARK, "steel");
  }
  push(0, top - 0.12, 0, 1.6, 0.24, 1.6, PYLON_DARK, "steel");
  // the ladder up the mast's back, its two rails standing off the tube
  for (const s of [-1, 1]) push(s * 0.3, (0.6 + top) / 2, -0.95, 0.08, top - 0.6, 0.08, PYLON_DARK, "steel");
  // the plate under the cross-head's root and its end plates
  for (const s of [-1, 1]) {
    push(s * 2.2, top - 0.6, 0, 3.2, 0.5, 0.6, PYLON_PAINT, "steel");
    push(s * (arm / 2 - 0.15), top + 0.45, 0, 0.3, 1.3, 1.3, PYLON_DARK, "steel");
  }
  // the walkway under the cross-head, its grating and the railing along its back
  push(0, top - 1.2, -1.15, arm - 0.6, 0.15, 1.2, PYLON_DARK, "steel");
  push(0, top - 0.2, -1.7, arm - 0.6, 0.08, 0.08, PYLON_DARK, "steel");
  for (const s of [-1, 1]) push(s * (arm / 2 - 0.35), top - 0.7, -1.7, 0.08, 1.0, 0.08, PYLON_DARK, "steel");
  // a rocker of four sheaves under each strand, hung from the cross-head
  for (const s of [-1, 1]) {
    const x = s * WHEEL_RADIUS;
    push(x, height - 1.25, 0, 0.35, 0.5, 0.35, PYLON_DARK, "steel");
    push(x, height - 0.85, 0, 0.5, 0.35, 4.2, PYLON_PAINT, "steel");
    for (const z of [-1.5, -0.5, 0.5, 1.5]) push(x, height - 0.45, z, 0.32, 0.8, 0.8, WHEEL, "wheel");
  }
  // the lightning rod
  push(0, top + 0.9 + 1.0, 0, 0.12, 2.0, 0.12, PYLON_DARK, "steel");
  return out;
}
