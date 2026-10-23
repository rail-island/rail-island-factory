// A cable car station's shed, one per station type (docs/models/props.md): the
// boarding deck, walls, roof and steelwork round the head. The head itself -- the
// pedestal and the bull wheel the rope wraps -- and the boarding platform built to a
// cabin's door are the game's, because every type shares the one and the cabin
// decides the other.
//
// Station-local frame: +Z faces the first support along the rope (the head stands
// out in front, `headZ` along +Z), +X is the station's right, y = 0 is the terrain
// level the station is placed at. THE LOADING GAUGE is a hard rule: nothing here may
// stand in the ring a cabin sweeps round the wheel (`intrudesOnCabin`,
// test/props.test.ts).

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { propModel, separateCoplanar, type PropBox, type Rgb } from "./propKit.ts";

const STEEL: Rgb = [120, 128, 136];
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

/** Whether a box's axis-aligned extent fouls the ring a cabin sweeps about the wheel. */
export function intrudesOnCabin(ropeHeadY: number, headZ: number, b: PropBox): boolean {
  const roll = b.rotZ ? Math.abs(b.rotZ) : b.rotX ? Math.abs(b.rotX) : 0;
  const sx = b.rotX ? b.sx : b.sx * Math.cos(roll) + b.sy * Math.sin(roll);
  const sy = b.sy * Math.cos(roll) + (b.rotX ? b.sz : b.sx) * Math.sin(roll);
  const sz = b.rotX ? b.sz * Math.cos(roll) + b.sy * Math.sin(roll) : b.sz;
  const y0 = b.cy - sy / 2, y1 = b.cy + sy / 2;
  if (y1 <= ropeHeadY - CABIN_DROP || y0 >= ropeHeadY - 0.5) return false;
  const x0 = b.cx - sx / 2, x1 = b.cx + sx / 2;
  const z0 = b.cz - sz / 2 - headZ, z1 = b.cz + sz / 2 - headZ;
  const near = Math.hypot(Math.max(x0, 0, -x1), Math.max(z0, 0, -z1));
  const far = Math.hypot(Math.max(Math.abs(x0), Math.abs(x1)), Math.max(Math.abs(z0), Math.abs(z1)));
  return !(far < SWEEP_INNER_R || near > SWEEP_OUTER_R);
}

type Ctx = { w: number; d: number; headY: number; out: PropBox[] };

function box(c: Ctx, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, color: Rgb, material: string, rotZ?: number): void {
  c.out.push({ cx: lx, cy: ly, cz: lz, sx, sy, sz, color, material, ...(rotZ !== undefined ? { rotZ } : {}) });
}

/** A square-section bar from a to b lying in a plane of constant x (a gantry's diagonal brace). */
function strut(c: Ctx, x: number, ay: number, az: number, by: number, bz: number, thick: number): void {
  const dy = by - ay, dz = bz - az;
  c.out.push({ cx: x, cy: (ay + by) / 2, cz: (az + bz) / 2, sx: thick, sy: thick, sz: Math.hypot(dy, dz), rotX: Math.atan2(-dy, dz), color: STEEL, material: "steel" });
}

function buildDeck(c: Ctx, height: number, color: Rgb, material: string): void {
  box(c, 0, height / 2, -c.d / 4, c.w, height, c.d / 2, color, material);
}

function buildOpenGantry(c: Ctx): void {
  const deckH = 1.2;
  buildDeck(c, deckH, DECK, "deck");
  const lx = c.w / 2 - 1;
  const lz = c.d / 2 - 1;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(c, sx * lx, c.headY / 2, sz * lz, 0.8, c.headY, 0.8, STEEL, "steel");
      box(c, sx * lx, 0.35, sz * lz, 2.2, 0.7, 2.2, CONCRETE, "concrete");
    }
  }
  for (const sx of [-1, 1]) {
    strut(c, sx * lx, deckH, -lz, c.headY, lz, 0.4);
    box(c, sx * lx, c.headY * 0.55, 0, 0.5, 0.5, 2 * lz, STEEL, "steel");
  }
  // a cross tie at the BACK only: at the front it would cross the cabin's hanger
  box(c, 0, c.headY - 0.6, -lz, 2 * lx, 0.5, 0.5, STEEL, "steel");
  for (const sx of [-1, 1]) {
    box(c, sx * (c.w / 2 - 0.3), 2.2, -c.d / 4, 0.2, 1.0, c.d / 2, STEEL, "steel");
    for (let z = -c.d / 2 + 1; z <= 0; z += 3) box(c, sx * (c.w / 2 - 0.3), 1.7, z, 0.25, 1.4, 0.25, STEEL, "steel");
  }
  box(c, 0, 2.2, -c.d / 2 + 0.3, c.w, 1.0, 0.2, STEEL, "steel");
  for (let x = -c.w / 2 + 1.2; x <= c.w / 2 - 1.2; x += 2.4) box(c, x, deckH + 0.06, -c.d / 4, 0.25, 0.12, c.d / 2 - 0.4, TIMBER_DARK, "timber");
  for (let i = 0; i < 3; i++) box(c, 0, (deckH * (i + 1)) / 3 / 2, -c.d / 2 - 0.6 - i * 0.9, 4, (deckH * (i + 1)) / 3, 0.9, DECK, "deck");
  box(c, 0, 3.4, -c.d / 2 - 1.2, 2.6, 3.0, 1.4, STEEL, "steel");
}

function buildAlpineChalet(c: Ctx): void {
  const plinth = 2;
  const wall = 6;
  const wallTop = plinth + wall;
  box(c, 0, plinth / 2, -c.d / 4, c.w, plinth, c.d / 2, STONE, "stone");
  for (let x = -c.w / 2 + 1; x <= c.w / 2 - 1; x += 2.2) box(c, x, plinth - 0.25, -c.d / 2 + 0.3, 1.8, 0.5, 0.4, STONE, "stone");
  buildDeck(c, 0.4, TIMBER_DARK, "timber");
  for (const sx of [-1, 1]) box(c, sx * (c.w / 2 - 0.4), plinth + wall / 2, -c.d / 4, 0.8, wall, c.d / 2, TIMBER, "timber");
  box(c, 0, plinth + wall / 2, -c.d / 2 + 0.4, c.w, wall, 0.8, TIMBER, "timber");
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) box(c, sx * (c.w / 2 - 0.4), plinth + wall / 2, sz === -1 ? -c.d / 2 + 0.5 : -0.5, 1.1, wall, 1.1, TIMBER_DARK, "timber");
    box(c, sx * (c.w / 2 - 0.5), plinth + wall * 0.55, -c.d / 4, 1.0, 0.4, c.d / 2, TIMBER_DARK, "timber");
  }
  for (const sx of [-1, 1]) {
    for (let z = -c.d / 2 + 3; z <= -2; z += 4.5) {
      box(c, sx * (c.w / 2 - 0.75), plinth + wall * 0.6, z, 0.3, 2.2, 2.2, GLASS, "glass");
      for (const sw of [-1, 1]) box(c, sx * (c.w / 2 - 0.55), plinth + wall * 0.6, z + sw * 1.5, 0.25, 2.4, 0.8, TIMBER_DARK, "timber");
    }
  }
  // the roof: two slabs falling from a ridge to the eaves (a positive roll lifts +X)
  const ridgeY = wallTop + 3;
  const eave = c.w / 2 + 2.5;
  const roofZ = -c.d / 4 - 1;
  const roofD = c.d / 2;
  for (const sx of [-1, 1]) {
    box(c, (sx * eave) / 2, ridgeY - 1.5, roofZ, eave + 1, 0.5, roofD, TIMBER_DARK, "timber", -sx * 0.52);
    box(c, sx * eave * 0.75, wallTop + 0.6, roofZ, 0.5, 0.5, roofD, TIMBER_DARK, "timber");
    box(c, sx * (eave + 0.4), wallTop + 0.35, roofZ, 0.5, 0.9, roofD, TIMBER, "timber");
  }
  box(c, 0, ridgeY, roofZ, 0.8, 0.8, roofD + 0.6, TIMBER_DARK, "timber");
  box(c, 0, wallTop + 1.5, -c.d / 2 + 0.5, c.w * 0.55, 3, 0.5, TIMBER, "timber");
  for (let z = -c.d / 2 + 1.5; z <= -1.5; z += 3) {
    for (const sx of [-1, 1]) box(c, sx * (eave - 0.6), wallTop + 0.9, z, 2.4, 0.35, 0.35, TIMBER_DARK, "timber");
  }
  box(c, -c.w / 2 + 1.5, ridgeY + 0.5, -c.d / 2 + 3, 1.8, 5, 1.8, STONE, "stone");
}

function buildGlassModern(c: Ctx): void {
  const wall = 8;
  const sill = 0.6;
  buildDeck(c, sill, CONCRETE, "concrete");
  for (const sx of [-1, 1]) box(c, sx * (c.w / 2 - 0.2), wall / 2 + sill, -c.d / 4, 0.25, wall, c.d / 2, GLASS, "glass");
  box(c, 0, wall / 2 + sill, -c.d / 2 + 0.2, c.w, wall, 0.25, GLASS, "glass");
  for (let x = -c.w / 2 + 0.4; x <= c.w / 2 - 0.4; x += 3) box(c, x, wall / 2 + sill, -c.d / 2 + 0.2, 0.4, wall, 0.4, STEEL, "steel");
  for (const sx of [-1, 1]) {
    for (let z = -c.d / 2 + 1; z <= -0.5; z += 3) box(c, sx * (c.w / 2 - 0.2), wall / 2 + sill, z, 0.45, wall, 0.45, STEEL, "steel");
    box(c, sx * (c.w / 2 - 0.2), sill + wall * 0.62, -c.d / 4, 0.5, 0.4, c.d / 2, STEEL, "steel");
  }
  box(c, 0, sill + wall * 0.62, -c.d / 2 + 0.2, c.w, 0.4, 0.5, STEEL, "steel");
  // the canopy is cut short of the head: carried forward it would cross the cabins
  const canopyY = wall + 1.2;
  box(c, 0, canopyY, -c.d / 4 - 1, c.w + 6, 0.6, c.d / 2, CONCRETE, "concrete");
  box(c, 0, canopyY - 0.45, -c.d / 4 - 1, c.w + 5, 0.3, c.d / 2 - 1, STEEL, "steel");
  for (const sx of [-1, 1]) {
    box(c, sx * (c.w / 2 + 2.4), (canopyY - 0.3) / 2 + sill, -c.d / 2 + 2, 0.5, canopyY - 0.3, 0.5, STEEL, "steel");
    box(c, sx * (c.w / 2 + 2.4), (canopyY - 0.3) / 2 + sill, -1.5, 0.5, canopyY - 0.3, 0.5, STEEL, "steel");
  }
  box(c, 0, sill + 0.2, -c.d / 2 + 0.8, c.w - 2, 0.4, 1.2, CONCRETE, "concrete");
  box(c, 0, sill + 0.9, -c.d / 2 + 2.6, c.w - 5, 0.35, 1.4, TIMBER, "timber");
  box(c, 0, canopyY + 1.2, -c.d / 2 + 3, c.w * 0.4, 1.8, 4, CONCRETE, "concrete");
}

function buildConcreteDrive(c: Ctx): void {
  const wall = 10;
  const deckH = 3.6;
  for (let i = 0; i < 3; i++) {
    const h = 1.2 * (i + 1);
    box(c, 0, h / 2, -c.d / 2 + 2 + i * 2.4, c.w - 2, h, 2.4, CONCRETE, "concrete");
    for (const sx of [-1, 1]) box(c, sx * (c.w / 2 - 1.4), h / 2 + 0.4, -c.d / 2 + 2 + i * 2.4, 0.7, h + 0.8, 2.4, STONE, "stone");
  }
  buildDeck(c, deckH, CONCRETE, "concrete");
  for (const sx of [-1, 1]) {
    box(c, sx * (c.w / 2 - 0.9), deckH + wall / 2, -c.d / 4, 1.8, wall, c.d / 2, CONCRETE, "concrete");
    for (let z = -c.d / 2 + 2; z <= -1; z += 4) box(c, sx * (c.w / 2 - 0.4), deckH + wall / 2, z, 1.0, wall, 1.4, CONCRETE, "concrete");
    box(c, sx * (c.w / 2 - 0.5), deckH + wall - 1.4, -c.d / 4, 0.6, 1.6, c.d / 2 - 3, GLASS, "glass");
  }
  box(c, 0, deckH + wall / 2, -c.d / 2 + 0.9, c.w, wall, 1.8, CONCRETE, "concrete");
  box(c, -c.w / 4, deckH + 2, -c.d / 2 + 0.6, 3, 4, 0.5, STEEL, "steel");
  box(c, c.w / 4, deckH + wall - 2.4, -c.d / 2 + 0.6, 4, 2.4, 0.5, STEEL, "steel");
  box(c, 0, deckH + wall + 0.4, -c.d / 4 - 1, c.w, 0.8, c.d / 2, CONCRETE, "concrete");
  box(c, 0, deckH + wall - 0.4, -c.d / 4 - 1, c.w + 1.2, 0.5, c.d / 2, STONE, "stone");
  box(c, 0, deckH + wall + 1.4, -c.d / 2 + 0.4, c.w, 1.2, 0.8, CONCRETE, "concrete");
  for (const sx of [-1, 1]) box(c, sx * (c.w / 2 - 0.4), deckH + wall + 1.4, -c.d / 4 - 1, 0.8, 1.2, c.d / 2, CONCRETE, "concrete");
  box(c, 0, deckH + wall * 0.6, -c.d / 2 - 1.6, 5, wall * 1.2, 3, CONCRETE, "concrete");
}

const BUILDERS: Record<StationType, (c: Ctx) => void> = {
  open_gantry: buildOpenGantry,
  alpine_chalet: buildAlpineChalet,
  glass_modern: buildGlassModern,
  concrete_drive: buildConcreteDrive,
};

/** Every box of a station type's shed, at the type's own footprint and head height. */
export function shedBoxes(type: StationType): PropBox[] {
  const dims = STATION_DIMS[type];
  const c: Ctx = { w: dims.w, d: dims.d, headY: dims.ropeHeadY, out: [] };
  BUILDERS[type](c);
  // the low detail keeps the deck, the walls and the roof: every box of a sixth of
  // the footprint or more
  const big = (dims.w * dims.d) / 6;
  for (const b of c.out) if (Math.max(b.sx * b.sz, b.sx * b.sy, b.sy * b.sz) >= big) b.lod = "shell";
  return c.out;
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
  return propModel(separateCoplanar(shedBoxes(typeOf(values))), true);
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
