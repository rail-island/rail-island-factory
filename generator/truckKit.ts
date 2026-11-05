// The world truck kit, part 1 (docs/models/world-trucks.md): the typed spec a
// truck is built from, its palette, the drawing primitives (blocks, slabs on a
// shell's planes, tyres, fenders, mirrors) and the cab library - cab-overs (EU
// day, sleeper and high-roof cabs, Japanese and Chinese narrow cabs, US cab-overs,
// kei cabs, low-entry and crew cabs), US conventional and modern hoods, historic
// bonneted cabs with separate fenders, integrated vans and the off-highway cab on
// a mining truck's deck. Part 2 (truckBodies.ts) draws the chassis, the bodies,
// the trailers and puts a truck together with its rig and its LOD.
//
// Axes as every road vehicle's: metres, +X forward (the nose at the largest x),
// +Y up, +Z right, centred on z = 0, the wheels standing on y = 0. A spec gives
// lengths as `u`, metres back from its unit's front (the truck's nose, a
// trailer's front wall); the kit turns them into x.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { arc, block, plate } from "./vehicleParts.ts";

// ---------------------------------------------------------------------------
// the spec

/** The colours of a truck by role; anything left out takes the kit's default. */
export interface Livery {
  /** The cab's paint. */
  cab: string;
  /** A second cab colour: the lower band, a stripe. */
  cab2?: string;
  /** The body's (and a trailer's) paint, the curtain, the tank. */
  body?: string;
  body2?: string;
  chassis?: string;
  /** The wheel discs. */
  rim?: string;
  /** The bumper and the grille surround. */
  bumper?: string;
  grille?: string;
  /** A tilt's canvas, a curtain. */
  canvas?: string;
  /** Decoration: a dekotora's lights, a painted truck's panels. */
  art?: string;
  art2?: string;
  /** What the body carries: gravel, logs' bark, a car's paint. */
  load?: string;
}

export type CabKind = "cabover" | "hood" | "bonnet" | "van" | "mining";

export interface CabSpec {
  kind: CabKind;
  /** The crew cab from its front face to its back wall (a van: its whole shell). */
  length: number;
  width: number;
  /** The shell's bottom and its roof above the road. */
  floor: number;
  top: number;
  /** The windscreen's bottom and top. */
  screen: [number, number];
  /** How far the windscreen's top stands back of its bottom. */
  rake: number;
  /** The front corners' radius in plan. */
  corner?: number;
  /** A hood or bonnet ahead of the cab: its length, top, half width, its look. */
  hood?: { length: number; top: number; hw: number; style: "square" | "round" | "aero" | "sloped" };
  /** A US sleeper box behind the cab, or a crew cab's rear part: its length and top. */
  sleeper?: { length: number; top: number };
  /** A van's bonnet: its length and the height of its top at the windscreen. */
  bonnet?: { length: number; y: number };
  grille: "bars" | "slots" | "mesh" | "chrome" | "round" | "none";
  lamps: "round" | "rect" | "slim";
  mirrors: "arm" | "camera" | "post" | "small";
  /** Exhaust stacks behind the cab (US), air cleaners beside the hood. */
  stacks?: boolean;
  cleaners?: boolean;
  /** A sun visor over the windscreen; a roof deflector to `deflector` metres; a light bar or beacon. */
  visor?: boolean;
  deflector?: number;
  beacon?: "amber" | "blue" | "bar";
  /** A second row of doors (a fire crew cab). */
  crew?: boolean;
  /** No roof: an open cab behind its windscreen. */
  open?: boolean;
  /** The cab's centre line off the truck's (a mining truck's or a crane carrier's cab), z. */
  offset?: number;
  /** A colour band along the cab's bottom up to this height. */
  band?: number;
  /** A stripe along the cab's sides: height range. */
  stripe?: [number, number];
  /** The windscreen split by a centre post. */
  split?: boolean;
  /** A mining truck's deck: its height and how far back of the nose it reaches. */
  deck?: { y: number; to: number };
  /** A van's corrugated sides: the ribs' pitch. */
  ribs?: number;
}

export interface AxleSpec {
  /** Metres back from the unit's front. */
  at: number;
  steer?: boolean;
  dual?: boolean;
  drive?: boolean;
  /** A lift axle or a tag axle: drawn as any other. */
  tag?: boolean;
}

export interface ChassisSpec {
  /** From the nose to the frame's rear end. */
  length: number;
  /** Tyre radius and width. */
  wheel: number;
  tyre?: number;
  axles: AxleSpec[];
  /** The frame rails' top above the road. */
  frame: number;
  /** The outer tyre faces' half track; default from the cab's width. */
  track?: number;
  /** A tractor's king pin: metres back from the nose; the fifth wheel's top above the road. */
  fifth?: { at: number; y: number };
  /** Fuel tanks under the cab's sides: box tanks or round ones (US); none. */
  tanks?: "box" | "round" | "none";
  /** Side guards between the axles. */
  guards?: boolean;
  /** A rear hitch for a drawbar trailer: its height. */
  hitch?: number;
  /** Wheel discs' style: plain steel, spoked (an early truck), lite (no hub, fewer sides: a road train's trailers). */
  wheels?: "disc" | "spoke" | "lite";
}

export type BodyKind =
  | "box" | "curtain" | "reefer" | "container" | "tank" | "tipper" | "dump" | "flatbed" | "dropside" | "canvas"
  | "logs" | "mixer" | "refuse" | "crane" | "boom" | "carCarrier" | "fire" | "ladder" | "van" | "lowLoader"
  | "sweeper" | "plough" | "artBox" | "none";

export interface BodySpec {
  kind: BodyKind;
  /** Metres back from its unit's front: the body's front and rear. */
  from: number;
  to: number;
  /** Its floor (top of its subframe) and its top. */
  floor: number;
  top: number;
  hw?: number;
  /** What it carries: cars on a car carrier, an excavator on a low loader, nothing. */
  load?: "cars" | "machine" | "gravel" | "none";
  /** A tank's cross-section: round, or elliptical (wider than tall). */
  round?: boolean;
}

/**
 * A trailer behind the unit ahead: a semi-trailer on its fifth wheel (`semi`,
 * hinged at the king pin) or a drawbar trailer, a dolly with a semi-trailer on
 * it, a log truck's pole trailer (`drawbar`, hinged at the hitch behind the unit
 * ahead). Each is a section of the rig's hinged chain.
 */
export interface TrailerSpec {
  kind: "semi" | "drawbar";
  /** Its length from the front wall (u 0) to the rear. */
  length: number;
  /** A semi's king pin, metres back of its front; a drawbar's length from the hitch to its front. */
  pin: number;
  axles: AxleSpec[];
  wheel?: number;
  tyre?: number;
  body: BodySpec;
  /** Its frame's top: a drawbar trailer's floor. A semi's is the fifth wheel's top. */
  frame?: number;
  /** A hitch behind it for the next trailer: its height. */
  hitch?: number;
  /** A converter dolly under its front: metres back of its front to the dolly's king pin. */
  dolly?: number;
  /** The landing gear, metres back of the front (a semi). */
  legs?: number;
  wheels?: ChassisSpec["wheels"];
}

export interface TruckSpec {
  livery: Livery;
  cab: CabSpec;
  chassis: ChassisSpec;
  body: BodySpec;
  trailers?: TrailerSpec[];
  /** The inner front wheel's lock (default 40) and the hinges' largest bend (default 70). */
  steerDeg?: number;
  bendDeg?: number;
  /** Decoration: a dekotora's lights and chrome, a painted truck's panels and crown. */
  art?: "dekotora" | "jingle" | "painted";
}

// ---------------------------------------------------------------------------
// the palette

/** The kit's materials; a livery recolours the roles it names. */
export function truckPalette(l: Livery): Record<string, MaterialSpec> {
  const c = (hex: string | undefined, fallback: string): string => hex ?? fallback;
  return {
    cab: { color: l.cab, roughness: 0.45 },
    cab2: { color: c(l.cab2, "#2b2d31"), roughness: 0.5 },
    body: { color: c(l.body, "#e8e8e4"), roughness: 0.5 },
    body2: { color: c(l.body2, "#b9bdc3"), metallic: 0.2, roughness: 0.4 },
    canvas: { color: c(l.canvas, "#5b6650"), roughness: 0.85 },
    chassis: { color: c(l.chassis, "#26272a"), roughness: 0.6 },
    bumper: { color: c(l.bumper, "#33353a"), roughness: 0.55 },
    grille: { color: c(l.grille, "#1b1c1f"), roughness: 0.6 },
    trim: { color: "#2a2b2e", roughness: 0.7 },
    rubber: { color: "#1a1a1b", roughness: 0.95 },
    rim: { color: c(l.rim, "#c6c9ce"), metallic: 0.3, roughness: 0.35 },
    hub: { color: "#3b3c40", roughness: 0.5 },
    chrome: { color: "#d9dce1", metallic: 0.45, roughness: 0.2 },
    steel: { color: "#9aa0a8", metallic: 0.3, roughness: 0.4 },
    alloy: { color: "#cdd0d5", metallic: 0.35, roughness: 0.35 },
    deck: { color: "#6e5a43", roughness: 0.8 },
    load: { color: c(l.load, "#8f8574"), roughness: 0.9 },
    logEnd: { color: "#c9a874", roughness: 0.85 },
    art: { color: c(l.art, "#e0b02a"), roughness: 0.4 },
    art2: { color: c(l.art2, "#2a8fd0"), roughness: 0.4 },
    seam: { color: "#18191b", roughness: 0.7 },
    plate: { color: "#e9ebee", roughness: 0.4 },
    glass: { color: "#1f262f", metallic: 0.2, roughness: 0.15, glass: true },
    lampHead: { color: "#f2f0e9", roughness: 0.2, lamp: { role: "head" } },
    lampTail: { color: "#b22521", roughness: 0.3, lamp: { role: "tail" } },
    lampAmber: { color: "#ffa01f", roughness: 0.3, lamp: { role: "indicator" } },
    // beacons, clearance lamps and side markers: lit colours that never blink
    marker: { color: "#ffa01f", roughness: 0.3 },
    beaconBlue: { color: "#2f6bff", roughness: 0.3 },
    reflector: { color: "#d8341f", roughness: 0.4 },
  };
}

// ---------------------------------------------------------------------------
// the drawing context: the mesh, and what the low detail keeps of it

/** A mass the distant model keeps: a box in one colour, in one section; `rank` gives way first (lowest first). */
export interface LodBox { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; mat: string; sec: number; rank?: number }
/** A window on a box's front (+x) face, or on its sides, in the LOD glass. */
export interface LodPane { x: [number, number]; y: [number, number]; z: [number, number]; face: "front" | "side"; sec: number; box: number; rank?: number }

export class Kit {
  readonly m: MeshBuilder;
  readonly boxes: LodBox[] = [];
  readonly panes: LodPane[] = [];
  readonly wheels: Array<{ x: number; r: number; z: number; sec: number }> = [];
  /** The section being drawn. */
  sec = 0;
  /** The last shell's box (its windows' owner at low detail). */
  lastShell = -1;
  constructor(readonly spec: TruckSpec) {
    this.m = new MeshBuilder(truckPalette(spec.livery));
  }
  /** A closed box. */
  blk(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    block(this.m, mat, x0, x1, y0, y1, z0, z1);
  }
  /** A box mirrored on both sides: z from a to b (a < b, both >= 0) and -b to -a. */
  pair(mat: string, x0: number, x1: number, y0: number, y1: number, a: number, b: number): void {
    this.blk(mat, x0, x1, y0, y1, a, b);
    this.blk(mat, x0, x1, y0, y1, -b, -a);
  }
  /** Records a mass for the low detail. */
  keep(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, rank?: number): void {
    if (x1 - x0 < 0.02 || y1 - y0 < 0.02 || z1 - z0 < 0.02) return;
    this.boxes.push({ x0, x1, y0, y1, z0, z1, mat, sec: this.sec, ...(rank !== undefined ? { rank } : {}) });
  }
  /** A closed box the low detail keeps too. */
  mass(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, rank?: number): void {
    this.blk(mat, x0, x1, y0, y1, z0, z1);
    this.keep(mat, x0, x1, y0, y1, z0, z1, rank);
  }
  pane(face: "front" | "side", x: [number, number], y: [number, number], z: [number, number], rank?: number): void {
    this.panes.push({ face, x, y, z, sec: this.sec, box: this.lastShell, ...(rank !== undefined ? { rank } : {}) });
  }
  /** A rod (n sides) from a to b. */
  rod(mat: string, a: Vec3, b: Vec3, r: number, n = 8): void {
    this.m.rod(mat, a, b, r, n);
  }
  /** A cylinder along x from x0 to x1 about (y, z), n sides. */
  cylX(mat: string, x0: number, x1: number, y: number, z: number, r: number, n = 12, rz = r): void {
    const s: Ring = ngon(n, 1, Math.PI / n).map(([a, b]) => [z + a * rz, y + b * r]);
    this.m.sweep(mat, "x", s, x0, s, x1);
  }
  /** A cylinder along z from z0 to z1 about (x, y). */
  cylZ(mat: string, x: number, y: number, z0: number, z1: number, r: number, n = 12): void {
    const s = ngon(n, r, Math.PI / n, x, y);
    this.m.sweep(mat, "z", s, z0, s, z1);
  }
  /** An upright cylinder (prism) at (x, z) from y0 to y1. */
  cylY(mat: string, x: number, z: number, y0: number, y1: number, r: number, n = 10): void {
    this.m.prism(mat, ngon(n, r, Math.PI / n, x, z), y0, y1);
  }
  /** A flat panel: an outline of points and its thickness `depth` into what it lies on. */
  slab(mat: string, outline: Vec3[], depth: Vec3): void {
    this.m.slab(mat, outline, depth);
  }
  /** A panel on a plane z = zs (sign s outward) from x0..x1, y0..y1, `proud` out of it. */
  sidePanel(mat: string, s: number, zs: number, x0: number, x1: number, y0: number, y1: number, proud = 0.01, depth = 0.025): void {
    const z = s * (zs + proud);
    this.slab(mat, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, -s * depth]);
  }
  /** A panel on a plane x = xs facing +x (e = 1) or -x (e = -1). */
  endPanel(mat: string, e: number, xs: number, z0: number, z1: number, y0: number, y1: number, proud = 0.01, depth = 0.025): void {
    const x = xs + e * proud;
    this.slab(mat, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [-e * depth, 0, 0]);
  }
}

// ---------------------------------------------------------------------------
// shells: lofts between levels of a rounded plan

/** One level of a shell: at height y the front at xf, the rear at xr, the half width hw, the corners' radii. */
export interface Level { y: number; xf: number; xr: number; hw: number; rf: number; rr: number }

const CORNER = 3;

/** The shell's plan at one level, centred on z = zc, wound like trucks.ts planRing (every level the same count). */
function planRing(l: Level, zc: number): Ring {
  const pts: Ring = [];
  const rf = Math.max(0.02, Math.min(l.rf, l.hw - 0.01, (l.xf - l.xr) / 2 - 0.01));
  const rr = Math.max(0.02, Math.min(l.rr, l.hw - 0.01, (l.xf - l.xr) / 2 - 0.01));
  const corner = (cx: number, cz: number, r: number, a0: number, n: number): void => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), zc + cz - r * Math.sin(a)]);
    }
  };
  corner(l.xf - rf, -(l.hw - rf), rf, 0, CORNER);
  corner(l.xr + rr, -(l.hw - rr), rr, Math.PI / 2, 1);
  corner(l.xr + rr, l.hw - rr, rr, Math.PI, 1);
  corner(l.xf - rf, l.hw - rf, rf, 1.5 * Math.PI, CORNER);
  return pts;
}

/** A shell: lofts between the levels, bottom to top, band i in mats[i] (the last for the rest), closed below and above. */
export function shell(k: Kit, levels: readonly Level[], mats: readonly string[], zc = 0, rank?: number): void {
  const m = k.m;
  m.cap(mats[0]!, planRing(levels[0]!, zc), levels[0]!.y, false);
  for (let i = 0; i + 1 < levels.length; i++) {
    const a = levels[i]!;
    const b = levels[i + 1]!;
    m.loft(mats[Math.min(i, mats.length - 1)]!, planRing(a, zc), a.y, planRing(b, zc), b.y, i + 2 === levels.length);
  }
  // the low detail: the shell's bounds, its front at mid height
  const mid = levels[Math.floor(levels.length / 2)]!;
  const lo = levels[0]!;
  const top = levels[levels.length - 1]!;
  k.keep(mats[mats.length - 1]!, Math.min(lo.xr, top.xr), (lo.xf + mid.xf) / 2, lo.y, top.y, zc - lo.hw, zc + lo.hw, rank);
  k.lastShell = k.boxes.length - 1;
}

/** Linear between the levels at height y, of one of a level's fields. */
export function at(levels: readonly Level[], y: number, f: (l: Level) => number): number {
  for (let i = 0; i + 1 < levels.length; i++) {
    const a = levels[i]!;
    const b = levels[i + 1]!;
    if (y <= b.y || i + 2 === levels.length) return f(a) + ((f(b) - f(a)) * (y - a.y)) / (b.y - a.y);
  }
  return f(levels[0]!);
}

/** A panel on the shell's flat front: outline (z, y), `proud` ahead of it; keep it inside one level band. */
export function frontPanel(k: Kit, mat: string, levels: readonly Level[], outline: ReadonlyArray<readonly [number, number]>, proud = 0.012, depth = 0.03): void {
  k.slab(mat, outline.map(([z, y]): Vec3 => [at(levels, y, (l) => l.xf) + proud, y, z]), [-depth, 0, 0]);
}

/** A panel on a shell's side s (+1 right, -1 left): outline (x, y), `proud` outside it; inside one band. */
export function sidePanelOn(k: Kit, mat: string, levels: readonly Level[], s: number, outline: ReadonlyArray<readonly [number, number]>, zc = 0, proud = 0.008, depth = 0.03): void {
  k.slab(mat, outline.map(([x, y]): Vec3 => [x, y, zc + s * (at(levels, y, (l) => l.hw) + proud)]), [0, 0, -s * depth]);
}

/** A rectangle (z, y) centred on z = zc. */
export const span = (half: number, y0: number, y1: number, zc = 0): Array<[number, number]> => [[zc - half, y0], [zc + half, y0], [zc + half, y1], [zc - half, y1]];

// ---------------------------------------------------------------------------
// wheels

export const TYRE_SIDES = 16;
/** The axle's height of a tyre of radius r: an n-gon with a flat side on the road. */
export const axleY = (r: number, n = TYRE_SIDES): number => r * Math.cos(Math.PI / n);
/** A tyre's default width for its radius. */
export const tyreWidth = (r: number): number => Math.min(0.42, Math.max(0.16, r * 0.62));
/** The radius a steered tyre sweeps about its steering axis, plus clearance: fenders and bodies stay outside. */
export const sweepR = (r: number, w: number): number => Math.hypot(r, w / 2) + 0.03;

/** A tyre at axle x spanning z0..z1, and on its outer face (`face`) a disc and a hub. */
export function tyre(k: Kit, x: number, r: number, z0: number, z1: number, face: number | null, style: ChassisSpec["wheels"] = "disc"): void {
  const n = style === "lite" ? 12 : TYRE_SIDES;
  const ay = axleY(r, n);
  const tread = ngon(n, r, Math.PI / n, x, ay);
  k.m.sweep("rubber", "z", tread, z0, tread, z1);
  if (face === null) return;
  const f = face > 0 ? z1 : z0;
  const disc = ngon(style === "lite" ? 8 : 12, r * 0.62, 0, x, ay);
  k.m.sweep("rim", "z", disc, f - face * 0.02, disc, f + face * 0.012);
  if (style === "lite") return;
  if (style === "spoke") {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      k.rod("hub", [x + r * 0.2 * Math.cos(a), ay + r * 0.2 * Math.sin(a), f + face * 0.02], [x + r * 0.78 * Math.cos(a), ay + r * 0.78 * Math.sin(a), f + face * 0.02], 0.025, 4);
    }
  }
  const hub = ngon(6, r * 0.24, Math.PI / 6, x, ay);
  k.m.sweep("hub", "z", hub, f - face * 0.01, hub, f + face * 0.05);
}

/** The z spans of a side's tyres, outer face at `zo` (>= 0): one tyre, or a dual pair, outer first. */
export function tyreSpans(zo: number, w: number, dual: boolean): Array<[number, number]> {
  return dual ? [[zo - w, zo], [zo - 2 * w - 0.03, zo - w - 0.03]] : [[zo - w, zo]];
}

/** A fender arched over the wheel at axle x: a bent plate from angle a0 to a1 (degrees, 0 forward), z0..z1. */
export function fender(k: Kit, mat: string, x: number, ay: number, rIn: number, rOut: number, a0: number, a1: number, z0: number, z1: number): void {
  const d = Math.PI / 180;
  const n = Math.max(2, Math.round((a1 - a0) / 22));
  // the chords between the arc's points dip inside its radius: push the inner arc out by their sagitta
  const sag = 1 / Math.cos(((a1 - a0) * d) / n / 2);
  plate(k.m, mat, arc(x, ay, rOut * sag, a0 * d, a1 * d, n), arc(x, ay, rIn * sag, a0 * d, a1 * d, n), z0, z1);
}

/** The angles (degrees from forward) of an arch of radius r about height ay that stay below y. */
export function archBelow(ay: number, r: number, y: number): Array<[number, number]> {
  const h = (y - ay) / r;
  if (h >= 1) return [[0, 180]];
  if (h <= 0) return [];
  const a = (Math.asin(h) * 180) / Math.PI;
  return [[0, a], [180 - a, 180]];
}

// ---------------------------------------------------------------------------
// the cabs

/** Where a cab sits: its x frame and the front axle's wheel, for its arches. */
export interface CabPlace {
  /** x of the nose (u 0). */
  ox: number;
  /** The front axle's x, the tyre radius and width, its outer face's z. */
  wheelX: number;
  r: number;
  w: number;
  zo: number;
  /** The frame's top. */
  frame: number;
  /** The x of the next wheel behind (a second steered axle): the steps stay ahead of its sweep. */
  avoid?: number;
  /** Every axle's sweep, x ranges: nothing low at the sides inside them. */
  zones?: Array<[number, number]>;
}

/** What a drawn cab tells the rest: its back wall's x, the top of the cab, its half width. */
export interface CabResult {
  back: number;
  top: number;
  hw: number;
  front: number;
  /** Where, going back, the cab's steps end: the fuel tanks start behind it. */
  steps: number;
  /** The x of the roof's front edge (a painted truck's crown stands there). */
  roof: number;
}

/** The bumper: its depth and the lamps' height range on its face. */
function bumper(k: Kit, x: number, hw: number, y0: number, y1: number, depth = 0.22, lamps = true, mat = "bumper", clear = -1e9): void {
  // never back into the front wheel's sweep: a short front overhang gets a thinner bumper
  const d = Math.min(depth, x - clear);
  if (d < 0.04) return;
  k.mass(mat, x - d, x, y0, y1, -hw, hw, 30);
  if (!lamps) return;
  // the indicators at the corners and a plate in the middle
  const h = Math.min(0.1, (y1 - y0) * 0.4);
  for (const s of [-1, 1]) k.endPanel("lampAmber", 1, x, s > 0 ? hw - 0.2 : -hw + 0.06, s > 0 ? hw - 0.06 : -hw + 0.2, y1 - h - 0.03, y1 - 0.03);
  k.endPanel("plate", 1, x, -0.26, 0.26, y0 + 0.04, Math.min(y1 - 0.02, y0 + 0.16));
}

/** Head lamps on a plane facing +x at xs: rectangles or round pairs either side at height y0..y1, centred |z| = zc. */
function headLamps(k: Kit, kind: CabSpec["lamps"], xs: number, zc: number, y0: number, y1: number, w = 0.3, zoff = 0): void {
  for (const s of [-1, 1]) {
    const z = zoff + s * zc;
    if (kind === "round") {
      const r = Math.min((y1 - y0) / 2, w / 2);
      k.m.sweep("lampHead", "x", ngon(10, r, 0, z, (y0 + y1) / 2), xs - 0.03, ngon(10, r, 0, z, (y0 + y1) / 2), xs + 0.03);
    } else {
      const h = kind === "slim" ? Math.min(0.12, y1 - y0) : y1 - y0;
      k.endPanel("lampHead", 1, xs, z - w / 2, z + w / 2, y1 - h, y1, 0.012, 0.029);
    }
  }
}

/** A grille on a shell's front band: the panel and its slats. */
function grille(k: Kit, style: CabSpec["grille"], levels: readonly Level[], half: number, y0: number, y1: number, zc = 0): void {
  if (style === "none") return;
  const mat = style === "chrome" ? "chrome" : "grille";
  frontPanel(k, mat, levels, span(half, y0, y1, zc), 0.012);
  if (style === "bars" || style === "chrome") {
    const n = Math.max(2, Math.min(7, Math.floor((y1 - y0) / 0.13)));
    for (let i = 1; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / (n + 1);
      frontPanel(k, style === "chrome" ? "grille" : "chrome", levels, span(half - 0.03, y - 0.018, y + 0.018, zc), 0.026, 0.02);
    }
  } else if (style === "slots") {
    for (let i = -2; i <= 2; i++) frontPanel(k, "cab", levels, span(0.025, y0 + 0.03, y1 - 0.03, zc + (i * half) / 2.6), 0.026, 0.02);
  } else if (style === "round") {
    // a radiator shell with its badge (historic)
    frontPanel(k, "chrome", levels, span(half + 0.04, y1 - 0.05, y1 + 0.01, zc), 0.02, 0.02);
  }
}

/** Mirrors at the A-pillars, x their arm's foot, y their head's centre. */
function mirrors(k: Kit, style: CabSpec["mirrors"], x: number, y: number, hw: number, zc = 0): void {
  for (const s of [-1, 1]) {
    const z0 = zc + s * hw;
    if (style === "camera") {
      k.blk("trim", x - 0.05, x + 0.05, y - 0.03, y + 0.03, ...ord(z0, z0 + s * 0.3));
      k.blk("trim", x - 0.07, x + 0.09, y - 0.06, y + 0.06, ...ord(z0 + s * 0.24, z0 + s * 0.34));
    } else if (style === "post") {
      // a West Coast mirror on two arms
      k.blk("chrome", x - 0.02, x + 0.02, y - 0.35, y - 0.32, ...ord(z0, z0 + s * 0.3));
      k.blk("chrome", x - 0.02, x + 0.02, y + 0.15, y + 0.18, ...ord(z0, z0 + s * 0.3));
      k.blk("chrome", x - 0.04, x + 0.04, y - 0.38, y + 0.22, ...ord(z0 + s * 0.28, z0 + s * 0.36));
      k.blk("glass", x - 0.062, x - 0.042, y - 0.34, y + 0.18, ...ord(z0 + s * 0.29, z0 + s * 0.35));
    } else {
      const big = style === "arm";
      const len = big ? 0.34 : 0.2;
      k.blk("trim", x - 0.02, x + 0.02, y + 0.1, y + 0.14, ...ord(z0, z0 + s * len));
      k.blk("trim", x - 0.06, x + 0.06, y - (big ? 0.28 : 0.12), y + 0.16, ...ord(z0 + s * (len - 0.12), z0 + s * (len + 0.02)));
      k.blk("glass", x - 0.082, x - 0.06, y - (big ? 0.25 : 0.09), y + 0.13, ...ord(z0 + s * (len - 0.1), z0 + s * len));
    }
  }
}

/** The free parts of [x0, x1] outside the zones (each at least 12 cm). */
export function freeOf(x0: number, x1: number, zones: ReadonlyArray<readonly [number, number]>): Array<[number, number]> {
  let parts: Array<[number, number]> = [[x0, x1]];
  for (const [a, b] of zones) parts = parts.flatMap(([p, q]): Array<[number, number]> => (b <= p || a >= q ? [[p, q]] : [...(a > p ? [[p, a] as [number, number]] : []), ...(b < q ? [[b, q] as [number, number]] : [])]));
  return parts.filter(([p, q]) => q - p > 0.12);
}

/** The largest angle (degrees from forward) a front fender of radius r may reach back to, clear of a second steered axle's sweep. */
function rearAngle(p: CabPlace, r: number, a1: number): number {
  if (p.avoid === undefined) return a1;
  const c = Math.max(-1, Math.min(1, (p.avoid - p.wheelX) / r));
  return Math.min(a1, (Math.acos(c) * 180) / Math.PI);
}

/** a, b in rising order. */
export const ord = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

/** The levels of a cab box: an upright lower front, the raked windscreen, a roof edge rounded in. */
function cabLevels(c: CabSpec, xF: number, x0: number, bottom: number, lean = 0.03): Level[] {
  const hw = c.width / 2;
  const rf = c.corner ?? 0.16;
  const [s0, s1] = c.screen;
  const up = c.top - s1;
  const L: Level[] = [
    { y: bottom, xf: xF, xr: x0, hw, rf, rr: 0.05 },
    { y: s0, xf: xF - lean, xr: x0, hw, rf, rr: 0.05 },
    { y: s1, xf: xF - c.rake, xr: x0, hw, rf, rr: 0.05 },
  ];
  if (c.open) {
    // an open cab: the body up to the belt, no roof; the windscreen stands on its own frame
    return L.slice(0, 2);
  }
  if (up > 0.45) {
    // a high roof: the visor band rising gently back to the roof
    L.push({ y: s1 + up * 0.55, xf: xF - c.rake - up * 0.22, xr: x0, hw: hw - 0.015, rf, rr: 0.05 });
    L.push({ y: c.top - 0.06, xf: xF - c.rake - up * 0.42, xr: x0 + 0.02, hw: hw - 0.05, rf, rr: 0.06 });
  } else {
    L.push({ y: c.top - Math.min(0.1, up * 0.5), xf: xF - c.rake - 0.04, xr: x0, hw: hw - 0.02, rf, rr: 0.05 });
  }
  L.push({ y: c.top, xf: xF - c.rake - Math.max(0.12, up * 0.5), xr: x0 + 0.04, hw: hw - 0.1, rf: rf * 0.8, rr: 0.06 });
  return L;
}

/** The glazing and doors of a cab's sides: the side windows and door seams between x0 and the A-pillar. */
function cabSides(k: Kit, c: CabSpec, L: readonly Level[], x0: number, zc: number): void {
  const [s0, s1] = c.screen;
  const wy0 = s0 + 0.02;
  const wy1 = s1 - 0.05;
  const pillar = (y: number): number => at(L, y, (l) => l.xf) - (c.corner ?? 0.16) - 0.06;
  const doors = c.crew ? 2 : 1;
  const len = pillar(wy0) - x0;
  const doorW = Math.min(1.05, (len - 0.1) / doors);
  for (const s of [-1, 1]) {
    for (let d = 0; d < doors; d++) {
      const xa = pillar(wy0) - d * doorW;
      const xb = xa - doorW + 0.12;
      if (xb < x0 + 0.05) continue;
      const top0 = d === 0 ? pillar(wy0) : xa - 0.06;
      const top1 = d === 0 ? pillar(wy1) : xa - 0.06;
      sidePanelOn(k, "glass", L, s, [[xb, wy0], [top0, wy0], [top1, wy1], [xb, wy1]], zc);
      if (d === 0 && s > 0) k.pane("side", [xb, top0], [wy0, wy1], [zc - c.width / 2, zc + c.width / 2], 20);
      // the door's rear seam, down to the cab's bottom
      sidePanelOn(k, "seam", L, s, [[xb - 0.06, L[0]!.y + 0.08], [xb - 0.045, L[0]!.y + 0.08], [xb - 0.045, wy1], [xb - 0.06, wy1]], zc, 0.006, 0.02);
    }
    if (c.sleeper === undefined && len > 1.9 && !c.crew) {
      // a sleeper cab's rear quarter window
      sidePanelOn(k, "glass", L, s, [[x0 + 0.15, wy0 + 0.1], [x0 + 0.45, wy0 + 0.1], [x0 + 0.45, wy1 - 0.05], [x0 + 0.15, wy1 - 0.05]], zc);
    }
  }
}

/** The windscreen and, split or whole, its frame. */
function windscreen(k: Kit, c: CabSpec, L: readonly Level[], half: number, zc: number): void {
  const [s0, s1] = c.screen;
  const y0 = s0 + 0.03;
  const y1 = s1 - 0.03;
  if (c.split) {
    frontPanel(k, "glass", L, [[zc - half, y0], [zc - 0.04, y0], [zc - 0.04, y1], [zc - half, y1]]);
    frontPanel(k, "glass", L, [[zc + 0.04, y0], [zc + half, y0], [zc + half, y1], [zc + 0.04, y1]]);
  } else frontPanel(k, "glass", L, span(half, y0, y1, zc));
  k.pane("front", [at(L, y0, (l) => l.xf), at(L, y1, (l) => l.xf)], [y0, y1], [zc - half, zc + half]);
}

/** Roof equipment: a deflector, a beacon or light bar, clearance lamps. */
function roofKit(k: Kit, c: CabSpec, L: readonly Level[], zc: number): void {
  const top = L[L.length - 1]!;
  const hw = top.hw;
  if (c.deflector && c.deflector > top.y + 0.1) {
    // a roof deflector: a wedge rising back from the roof's front
    const x1 = top.xf - 0.1;
    const x0 = Math.max(top.xr + 0.1, x1 - 1.6);
    const h = c.deflector;
    k.m.sweep("cab", "z", [[x1, top.y - 0.02], [x0 + 0.1, h], [x0, h], [x0, top.y - 0.02]], zc - hw + 0.04, [[x1, top.y - 0.02], [x0 + 0.1, h], [x0, h], [x0, top.y - 0.02]], zc + hw - 0.04);
    k.keep("cab", x0, x1 - 0.4, top.y, h, zc - hw + 0.04, zc + hw - 0.04, 12);
  }
  if (c.beacon) {
    const x = top.xf - 0.25;
    if (c.beacon === "bar") k.blk("beaconBlue", x - 0.12, x + 0.12, top.y - 0.01, top.y + 0.1, zc - hw + 0.15, zc + hw - 0.15);
    else for (const s of [-1, 1]) k.cylY(c.beacon === "blue" ? "beaconBlue" : "marker", x, zc + s * (hw - 0.25), top.y - 0.01, top.y + 0.14, 0.08, 8);
  } else if (!c.open) {
    // clearance lamps along the roof's front edge
    for (const z of [-0.5, -0.25, 0.25, 0.5]) k.blk("marker", top.xf - 0.12, top.xf - 0.04, top.y - 0.01, top.y + 0.04, zc + z * hw - 0.04, zc + z * hw + 0.04);
  }
}

/**
 * A cab-over cab: its shell from the bottom (over the front wheels; a low cab's
 * lower band cut round the arch), the windscreen, the side glass and doors, the
 * grille, lamps and bumper, the steps behind the front wheel, the mirrors, the
 * roof equipment; a crew cab's second doors.
 */
export function caboverCab(k: Kit, c: CabSpec, p: CabPlace): CabResult {
  const zc = c.offset ?? 0;
  const hw = c.width / 2;
  const xF = p.ox - 0.06;
  const x0 = xF - c.length;
  const ay = axleY(p.r);
  const R = sweepR(p.r, p.w);
  const archTop = ay + R;
  const low = c.floor < archTop + 0.02 && Math.abs(zc) < 0.5;
  const bottom = low ? archTop + 0.02 : c.floor;
  if (c.screen[0] <= bottom + 0.05) throw new Error(`cab-over: the windscreen starts below the shell's bottom (${bottom.toFixed(2)})`);
  const L = cabLevels(c, xF, x0, bottom);
  shell(k, L, ["cab"], zc);
  if (low) {
    // the low cab's lower band round the front wheel's arch: ahead of it and behind it
    const ax = p.wheelX;
    const skirt = c.band ? "cab2" : "cab";
    k.mass(skirt, ax + R, xF, c.floor, bottom - 0.002, zc - hw, zc + hw, 25);
    if (x0 < ax - R - 0.05) k.mass(skirt, x0, ax - R, c.floor, bottom - 0.002, zc - hw, zc + hw, 25);
    for (const s of [-1, 1]) fender(k, "trim", ax, ay, R, R + 0.04, 0, rearAngle(p, R + 0.04, 180), ...ord(zc + s * (hw - 0.45), zc + s * (hw - 0.03)));
  }
  // the band along the bottom: a panel round the front and the sides
  const band = c.band ?? bottom + 0.3;
  if (c.band && band > bottom + 0.12) {
    frontPanel(k, "cab2", L, span(hw - (c.corner ?? 0.16) - 0.01, bottom + 0.02, Math.min(band, c.screen[0] - 0.05), zc), 0.006);
    for (const s of [-1, 1]) sidePanelOn(k, "cab2", L, s, [[x0 + 0.05, bottom + 0.02], [at(L, bottom, (l) => l.xf) - (c.corner ?? 0.16) - 0.02, bottom + 0.02], [at(L, band, (l) => l.xf) - (c.corner ?? 0.16) - 0.02, Math.min(band, c.screen[0] - 0.05)], [x0 + 0.05, Math.min(band, c.screen[0] - 0.05)]], zc, 0.004);
  }
  if (c.stripe) for (const s of [-1, 1]) sidePanelOn(k, "cab2", L, s, [[x0 + 0.05, c.stripe[0]], [at(L, c.stripe[0], (l) => l.xf) - 0.25, c.stripe[0]], [at(L, c.stripe[1], (l) => l.xf) - 0.25, c.stripe[1]], [x0 + 0.05, c.stripe[1]]], zc, 0.012);
  const half = hw - (c.corner ?? 0.16) - 0.04;
  if (c.open) {
    // the open cab's windscreen on its posts, the seats' backs behind it
    const xs = at(L, c.screen[0], (l) => l.xf) - 0.35;
    k.slab("glass", [[xs, c.screen[0], zc - half], [xs, c.screen[0], zc + half], [xs - c.rake, c.screen[1], zc + half], [xs - c.rake, c.screen[1], zc - half]], [-0.02, 0, 0]);
    for (const s of [-1, 1]) k.blk("trim", xs - c.rake - 0.04, xs + 0.02, c.screen[0] - 0.02, c.screen[1] + 0.02, ...ord(zc + s * (half + 0.01), zc + s * (half + 0.05)));
    k.blk("trim", xs - c.rake - 0.04, xs + 0.02, c.screen[1], c.screen[1] + 0.04, zc - half - 0.05, zc + half + 0.05);
    k.blk("seam", x0 + 0.1, x0 + 0.45, c.screen[0] - 0.05, c.screen[0] + 0.55, zc - hw + 0.15, zc + hw - 0.15);
    k.pane("front", [xs, xs - c.rake], [c.screen[0], c.screen[1]], [zc - half, zc + half]);
  } else {
    windscreen(k, c, L, half, zc);
    cabSides(k, c, L, x0, zc);
  }
  // the grille and the head lamps in the lower front
  const gy0 = bottom + 0.12;
  const gy1 = c.screen[0] - 0.1;
  if (gy1 > gy0 + 0.08) grille(k, c.grille, L, Math.min(0.75, hw * 0.6), gy0, gy1, zc);
  const ly0 = low ? c.floor + 0.25 : Math.max(bottom - 0.55, 0.45);
  // the bumper below (or on) the shell's bottom, its lamps
  const by1 = low ? c.floor + 0.42 : bottom + 0.02;
  bumper(k, xF + 0.05, hw - 0.03, Math.max(0.3, by1 - 0.5), by1, 0.3, true, "bumper", p.wheelX + R + 0.02);
  headLamps(k, c.lamps, xF + 0.05, hw - 0.32, ly0, ly0 + 0.2, 0.36, zc);
  if (c.visor && L.length > 3) frontPanel(k, "cab", L, span(half + 0.02, c.screen[1] + 0.02, Math.min(c.screen[1] + 0.2, L[3]!.y - 0.01), zc), 0.06, 0.06);
  // the steps behind the front wheel, under the door, and the mudguard round the wheel below the cab
  let steps = x0;
  if (!low) {
    const sx1 = p.wheelX - R - 0.02;
    const sx0 = Math.max(x0 - 0.3, sx1 - 0.7, p.avoid ?? -1e9);
    if (sx1 > sx0 + 0.15) {
      steps = sx0;
      for (const s of [-1, 1]) k.blk("trim", sx0, sx1, Math.max(0.35, bottom - 0.75), bottom - 0.01, ...ord(zc + s * (hw - 0.3), zc + s * (hw - 0.04)));
    }
    for (const s of [-1, 1]) for (const [a0, a1] of archBelow(ay, R + 0.04, bottom - 0.02)) {
      if (Math.min(a1, rearAngle(p, R + 0.04, a1)) - a0 > 8) fender(k, "trim", p.wheelX, ay, R, R + 0.04, a0, Math.min(a1, rearAngle(p, R + 0.04, a1)), ...ord(zc + s * (hw - 0.4), zc + s * (hw - 0.06)));
    }
  }
  mirrors(k, c.mirrors, at(L, c.screen[1], (l) => l.xf) - 0.2, (c.screen[0] + c.screen[1]) / 2, hw, zc);
  roofKit(k, c, L, zc);
  return { back: x0, top: L[L.length - 1]!.y, hw, front: xF, steps, roof: L[L.length - 1]!.xf };
}

/** The hood's levels: a narrow core between the wheels, widening over them to the hood's width. */
function hoodLevels(k: { hb: number; archTop: number; core: number }, h: NonNullable<CabSpec["hood"]>, xH: number, xr: number): Level[] {
  const aero = h.style === "aero" || h.style === "sloped";
  const rf = aero ? 0.3 : h.style === "round" ? 0.2 : 0.08;
  const L: Level[] = [{ y: k.hb, xf: xH, xr, hw: k.core, rf: Math.min(rf, k.core - 0.05), rr: 0.03 }];
  const wide = h.hw > k.core + 0.02;
  if (wide) {
    L.push({ y: k.archTop + 0.02, xf: xH - (aero ? 0.05 : 0), xr, hw: k.core, rf: Math.min(rf, k.core - 0.05), rr: 0.03 });
    L.push({ y: k.archTop + 0.04, xf: xH - (aero ? 0.08 : 0), xr, hw: h.hw, rf, rr: 0.03 });
  }
  const t = h.top;
  if (aero) {
    L.push({ y: t - 0.18, xf: xH - (h.style === "sloped" ? 0.5 : 0.3), xr, hw: h.hw - 0.04, rf, rr: 0.03 });
    L.push({ y: t, xf: xH - (h.style === "sloped" ? 1.1 : 0.75), xr, hw: h.hw - 0.14, rf: rf * 0.8, rr: 0.03 });
  } else if (h.style === "round") {
    L.push({ y: t - 0.14, xf: xH - 0.02, xr, hw: h.hw - 0.03, rf, rr: 0.03 });
    L.push({ y: t, xf: xH - 0.08, xr, hw: h.hw * 0.62, rf: rf * 0.7, rr: 0.03 });
  } else {
    L.push({ y: t - 0.05, xf: xH, xr, hw: h.hw - 0.01, rf, rr: 0.03 });
    L.push({ y: t, xf: xH - 0.04, xr, hw: h.hw - 0.05, rf, rr: 0.03 });
  }
  return L;
}

/**
 * A conventional cab behind a hood: the hood (a narrow core between the front
 * wheels, its full width over them), its grille and lamps, fenders over the
 * front wheels, the bumper; the cab box, a sleeper behind it, exhaust stacks,
 * air cleaners. `bonnet` cabs (historic) have round fenders and lamps on them,
 * running boards and a split windscreen.
 */
export function hoodCab(k: Kit, c: CabSpec, p: CabPlace): CabResult {
  const h = c.hood!;
  const hw = c.width / 2;
  const zc = c.offset ?? 0;
  const ay = axleY(p.r);
  const R = sweepR(p.r, p.w);
  const archTop = ay + R;
  const xB = p.ox - (c.kind === "bonnet" ? 0.08 : 0.14);
  const xH = xB - 0.04;
  const xCab = xH - h.length;
  const x0 = xCab - c.length;
  // the core between the steered wheels: clear of their sweep
  const zcIn = p.zo - p.w / 2;
  const core = Math.min(h.hw, zcIn - R - 0.02);
  const hb = Math.max(p.frame - 0.05, 0.45);
  if (h.top < archTop + 0.2) throw new Error(`hood: its top ${h.top} is too low over the wheels (${archTop.toFixed(2)})`);
  const HL = hoodLevels({ hb, archTop, core }, h, xH, xCab + 0.04);
  shell(k, HL, ["cab"], zc);
  // the grille on the hood's front, the lamps
  const aero = h.style === "aero" || h.style === "sloped";
  if (c.grille !== "none") {
    if (aero && HL.length > 3) grille(k, c.grille, HL, Math.min(h.hw - 0.35, 0.75), HL[2]!.y + 0.03, HL[3]!.y - 0.04, zc);
    else grille(k, c.grille, HL, Math.min(core, h.hw) - 0.05, hb + 0.25, (HL.length > 3 ? HL[HL.length - 2]!.y : h.top) - 0.04, zc);
  }
  // the fenders over the front wheels
  const fenderZ: [number, number] = [p.zo - p.w - 0.05, p.zo + 0.07];
  for (const s of [-1, 1]) {
    const [z0, z1] = ord(zc + s * fenderZ[0], zc + s * fenderZ[1]);
    if (c.kind === "bonnet") {
      // a round fender, carried forward and back, and the running board to the cab
      fender(k, "cab", p.wheelX, ay, R, R + 0.04, 0, rearAngle(p, R + 0.04, 180), z0, z1);
      for (const [a, b] of freeOf(xCab - 0.3, p.wheelX - R - 0.02, p.zones ?? [])) k.blk("cab", a, b, 0.5, 0.56, ...ord(zc + s * (core - 0.02), zc + s * fenderZ[1]));
      k.keep("cab", p.wheelX - R, p.wheelX + R, ay, archTop + 0.04, z0, z1, 26);
      // the head lamp on the fender's top
      k.cylX("lampHead", p.wheelX + R * 0.55, p.wheelX + R * 0.55 + 0.14, archTop + 0.16, zc + s * (p.zo - p.w / 2 - 0.05), 0.11, 10);
      k.cylX("chrome", p.wheelX + R * 0.55 - 0.1, p.wheelX + R * 0.55 + 0.01, archTop + 0.16, zc + s * (p.zo - p.w / 2 - 0.05), 0.12, 10);
    } else {
      fender(k, "cab", p.wheelX, ay, R, R + 0.05, 0, rearAngle(p, R + 0.05, 180), z0, z1);
      // the fender's skirt back to the cab's step
      if (p.wheelX - R - 0.02 > xCab) k.blk("cab", xCab - 0.05, p.wheelX - R - 0.02, archTop - 0.25, archTop + 0.04, ...ord(zc + s * (p.zo - 0.12), zc + s * (p.zo + 0.07)));
      k.keep("cab", p.wheelX - R, p.wheelX + R, ay, archTop + 0.05, z0, z1, 26);
    }
  }
  if (c.kind !== "bonnet") {
    const lz = h.style === "aero" || h.style === "sloped" ? h.hw - 0.28 : Math.min(h.hw + 0.15, p.zo - 0.12);
    if (h.style === "aero" || h.style === "sloped") headLamps(k, "slim", at(HL, archTop + 0.12, (l) => l.xf) + 0.0, lz, archTop + 0.06, archTop + 0.16, 0.42, zc);
    else for (const s of [-1, 1]) {
      // round lamps on brackets beside the grille
      const z = zc + s * lz;
      k.cylX("lampHead", xH - 0.12, xH - 0.01, archTop + 0.2, z, 0.11, 10);
      k.cylX("chrome", xH - 0.24, xH - 0.11, archTop + 0.2, z, 0.125, 10);
    }
  }
  bumper(k, xB, Math.max(hw, p.zo + 0.05) - 0.02, Math.max(0.3, hb - 0.12), hb + 0.22, 0.2, true, h.style === "square" || c.grille === "chrome" ? "chrome" : "bumper", p.wheelX + R + 0.02);
  // the cab: behind the front wheel's sweep, or above it
  const floor = c.floor;
  if (xCab > p.wheelX - R && floor < archTop) throw new Error(`hood: the cab's front (${xCab.toFixed(2)}) stands over the front wheel's sweep below its top`);
  const L = cabLevels(c, xCab, x0, floor, 0.02);
  shell(k, L, ["cab"], zc);
  windscreen(k, c, L, hw - (c.corner ?? 0.16) - 0.06, zc);
  cabSides(k, c, L, x0, zc);
  // the steps under the door
  for (const [a, b] of freeOf(x0 + 0.1, Math.min(xCab - 0.1, p.wheelX - R - 0.05), p.zones ?? [])) for (const s of [-1, 1]) k.blk("trim", a, b, Math.max(0.35, floor - 0.6), floor - 0.01, ...ord(zc + s * (hw - 0.3), zc + s * (hw - 0.05)));
  if (c.stripe) for (const s of [-1, 1]) {
    sidePanelOn(k, "cab2", L, s, [[x0 + 0.04, c.stripe[0]], [xCab - 0.1, c.stripe[0]], [xCab - 0.1, c.stripe[1]], [x0 + 0.04, c.stripe[1]]], zc, 0.012);
    if (c.stripe[1] < h.top - 0.05) sidePanelOn(k, "cab2", HL, s, [[xCab + 0.05, c.stripe[0]], [xH - 0.2, c.stripe[0]], [xH - 0.2, c.stripe[1]], [xCab + 0.05, c.stripe[1]]], zc, 0.012);
  }
  let back = x0;
  let top = L[L.length - 1]!.y;
  if (c.sleeper) {
    const sl = c.sleeper;
    const xs0 = x0 - sl.length;
    const SL: Level[] = [
      { y: floor + 0.02, xf: x0 + 0.06, xr: xs0, hw: hw - 0.01, rf: 0.05, rr: 0.08 },
      { y: sl.top - 0.12, xf: x0 + 0.06, xr: xs0, hw: hw - 0.01, rf: 0.05, rr: 0.08 },
      { y: sl.top, xf: x0 + 0.06, xr: xs0 + 0.05, hw: hw - 0.1, rf: 0.05, rr: 0.08 },
    ];
    shell(k, SL, ["cab"], zc);
    if (sl.top > top + 0.2) {
      // the raised sleeper's front over the cab's roof, faired in
      const t = L[L.length - 1]!;
      k.m.sweep("cab", "z", [[x0 + 0.06, t.y - 0.03], [x0 + 0.06, sl.top - 0.12], [x0 - 0.1, sl.top - 0.12], [x0 - 0.1, t.y - 0.03]].map(([x, y]) => [x!, y!] as [number, number]), zc - hw + 0.12, [[x0 + 0.06, t.y - 0.03], [x0 + 0.06, sl.top - 0.12], [x0 - 0.1, sl.top - 0.12], [x0 - 0.1, t.y - 0.03]].map(([x, y]) => [x!, y!] as [number, number]), zc + hw - 0.12);
      k.m.sweep("cab", "z", [[t.xf - 0.1, t.y - 0.02], [x0 + 0.05, sl.top - 0.13], [x0 - 0.05, sl.top - 0.13], [x0 - 0.05, t.y - 0.02]], zc - hw + 0.14, [[t.xf - 0.1, t.y - 0.02], [x0 + 0.05, sl.top - 0.13], [x0 - 0.05, sl.top - 0.13], [x0 - 0.05, t.y - 0.02]], zc + hw - 0.14);
    }
    for (const s of [-1, 1]) sidePanelOn(k, "seam", SL, s, [[xs0 + 0.3, floor + 0.3], [xs0 + 0.9, floor + 0.3], [xs0 + 0.9, floor + 0.36], [xs0 + 0.3, floor + 0.36]], zc, 0.006, 0.02);
    back = xs0;
    top = Math.max(top, sl.top);
  }
  if (c.stacks) for (const s of [-1, 1]) {
    // chrome exhaust stacks at the cab's (or sleeper's) rear corners
    const x = back + 0.12;
    const z = zc + s * (hw - 0.14);
    k.cylY("chrome", x, z, floor - 0.2, top + 0.45, 0.075, 8);
    k.cylY("trim", x, z, floor - 0.25, floor + 0.6, 0.11, 8);
  }
  if (c.cleaners) for (const s of [-1, 1]) {
    // round air cleaners on the cowl
    k.cylY("chrome", xCab + 0.3, zc + s * (h.hw + 0.12), archTop + 0.05, h.top + 0.05, 0.16, 10);
  }
  mirrors(k, c.mirrors, xCab - 0.15, (c.screen[0] + c.screen[1]) / 2, hw, zc);
  roofKit(k, c, L, zc);
  return { back, top, hw, front: xB, steps: x0 + 0.05, roof: L[L.length - 1]!.xf };
}

/**
 * A van's shell: bonnet, windscreen and the box behind in one, cut round its
 * wheels' arches, from the nose to `length` back.
 */
export function vanCab(k: Kit, c: CabSpec, p: CabPlace, rearAxle: number | null): CabResult {
  const hw = c.width / 2;
  const xN = p.ox - 0.05;
  const x0 = xN - c.length;
  const b = c.bonnet!;
  const ay = axleY(p.r);
  const R = sweepR(p.r, p.w);
  const archTop = ay + R;
  const bottom = archTop + 0.02;
  const rf = c.corner ?? 0.25;
  const L: Level[] = [
    { y: bottom, xf: xN, xr: x0, hw, rf, rr: 0.06 },
    { y: b.y - 0.08, xf: xN - 0.06, xr: x0, hw, rf, rr: 0.06 },
    { y: b.y, xf: xN - b.length, xr: x0, hw: hw - 0.02, rf, rr: 0.06 },
    { y: c.screen[1], xf: xN - b.length - c.rake, xr: x0, hw: hw - 0.04, rf, rr: 0.06 },
    { y: c.top - 0.06, xf: xN - b.length - c.rake - 0.12, xr: x0, hw: hw - 0.07, rf, rr: 0.06 },
    { y: c.top, xf: xN - b.length - c.rake - 0.28, xr: x0 + 0.04, hw: hw - 0.14, rf: rf * 0.7, rr: 0.06 },
  ];
  if (b.y - 0.08 <= bottom + 0.02) L.splice(1, 1);
  shell(k, L, ["cab"], 0);
  // the lower band round the arches
  const arches = [p.wheelX, ...(rearAxle !== null ? [rearAxle] : [])];
  let x = xN;
  for (const ax of arches) {
    if (x > ax + R) k.mass("cab", ax + R, x - (x === xN ? 0.0 : 0), c.floor, bottom + 0.005, -hw, hw, 25);
    x = ax - R;
  }
  if (x > x0 + 0.05) k.mass("cab", x0, x, c.floor, bottom + 0.005, -hw, hw, 25);
  for (const ax of arches) for (const s of [-1, 1]) fender(k, "trim", ax, ay, R, R + 0.03, 0, 180, ...ord(s * (hw - 0.35), s * (hw - 0.02)));
  const Lw = L.findIndex((l) => l.y === c.screen[1]);
  const screenLevels = L.slice(Lw - 1, Lw + 1);
  frontPanel(k, "glass", screenLevels, span(hw - rf - 0.08, b.y + 0.04, c.screen[1] - 0.04));
  k.pane("front", [xN - b.length, xN - b.length - c.rake], [b.y + 0.04, c.screen[1] - 0.04], [-hw + rf, hw - rf]);
  // the corrugated sides behind the doors (the Citroen H)
  if (c.ribs) {
    const ry0 = bottom + 0.12;
    const ry1 = Math.min(c.screen[1] - 0.1, b.y - 0.02);
    for (const s of [-1, 1]) for (let x = x0 + 0.15; x < xN - b.length - 1.2; x += c.ribs * 2) sidePanelOn(k, "cab", L, s, [[x, ry0], [x + c.ribs, ry0], [x + c.ribs, ry1], [x, ry1]], 0, 0.012, 0.03);
    for (const s of [-1, 1]) for (let x = x0 + 0.15; x < xN - b.length - 1.2; x += c.ribs * 2) sidePanelOn(k, "cab", L, s, [[x, b.y + 0.06], [x + c.ribs, b.y + 0.06], [x + c.ribs, c.screen[1] - 0.06], [x, c.screen[1] - 0.06]], 0, 0.012, 0.03);
  }
  // the cab doors' windows
  const xp = (y: number): number => at(L, y, (l) => l.xf) - rf - 0.05;
  for (const s of [-1, 1]) {
    const xb = xp(b.y + 0.05) - 0.9;
    sidePanelOn(k, "glass", screenLevels, s, [[xb, b.y + 0.05], [xp(b.y + 0.05), b.y + 0.05], [xp(c.screen[1] - 0.06), c.screen[1] - 0.06], [xb, c.screen[1] - 0.06]]);
    sidePanelOn(k, "seam", L, s, [[xb - 0.05, bottom + 0.08], [xb - 0.035, bottom + 0.08], [xb - 0.035, c.screen[1] - 0.06], [xb - 0.05, c.screen[1] - 0.06]], 0, 0.006, 0.02);
  }
  // the nose: grille, lamps, bumper
  const gy0 = Math.max(bottom + 0.06, b.y - 0.38);
  if (c.grille !== "none") grille(k, c.grille, L.slice(0, 2), hw * 0.45, gy0, b.y - 0.12);
  headLamps(k, c.lamps, at(L, b.y - 0.2, (l) => l.xf), hw - 0.3, b.y - 0.3, b.y - 0.12, 0.3);
  bumper(k, xN + 0.05, hw - 0.02, Math.max(0.2, c.floor + 0.05), c.floor + 0.3, 0.16, false);
  for (const s of [-1, 1]) k.endPanel("lampAmber", 1, xN + 0.05, s > 0 ? hw - 0.2 : -hw + 0.08, s > 0 ? hw - 0.08 : -hw + 0.2, c.floor + 0.18, c.floor + 0.28);
  mirrors(k, "small", xp(b.y + 0.2) + 0.05, b.y + 0.22, hw - 0.04);
  return { back: x0, top: c.top, hw, front: xN, steps: x0, roof: L[L.length - 1]!.xf };
}

/**
 * A mining truck's off-highway front: the upper deck across the front over the
 * radiator and the engine, its handrails and the diagonal stairway, the cab on
 * the deck's left (offset), the giant bumper.
 */
export function miningCab(k: Kit, c: CabSpec, p: CabPlace): CabResult {
  const d = c.deck!;
  const hw = Math.max(p.zo + 0.1, c.width / 2);
  const xF = p.ox - 0.1;
  const xD = xF - d.to;
  const ay = axleY(p.r);
  const R = sweepR(p.r, p.w);
  // the engine bay and radiator between the front wheels
  const core = p.zo - p.w / 2 - R - 0.05;
  k.mass("cab", xD + 0.3, xF - 0.35, p.frame, d.y - 0.02, -core, core);
  k.endPanel("grille", 1, xF - 0.35, -core + 0.1, core - 0.1, p.frame + 0.25, d.y - 0.15, 0.012, 0.03);
  for (let i = 1; i < 6; i++) k.endPanel("chrome", 1, xF - 0.35, -core + 0.15, core - 0.15, p.frame + 0.25 + i * (d.y - 0.4 - p.frame) / 6, p.frame + 0.29 + i * (d.y - 0.4 - p.frame) / 6, 0.025, 0.02);
  // the deck
  k.mass("cab", xD, xF, d.y - 0.15, d.y, -hw, hw);
  // the front bumper beam and its lamps
  k.mass("bumper", xF - 0.6, xF, p.frame - 0.3, p.frame + 0.3, -core - 0.2, core + 0.2, 30);
  headLamps(k, "rect", xF, core - 0.3, d.y - 0.55, d.y - 0.35, 0.5);
  for (const s of [-1, 1]) k.endPanel("lampAmber", 1, xF, s > 0 ? core - 0.05 : -core - 0.15, s > 0 ? core + 0.15 : -core + 0.05, p.frame + 0.1, p.frame + 0.22);
  // the handrails round the deck's front and sides
  for (const z of [-hw + 0.05, hw - 0.05]) k.rod("marker", [xF - 0.05, d.y + 1.05, z], [xD + 0.1, d.y + 1.05, z], 0.03, 6);
  k.rod("marker", [xF - 0.05, d.y + 1.05, -hw + 0.05], [xF - 0.05, d.y + 1.05, hw - 0.05], 0.03, 6);
  for (const z of [-hw + 0.05, -0.3, 0.6, hw - 0.05]) k.rod("marker", [xF - 0.05, d.y, z], [xF - 0.05, d.y + 1.05, z], 0.03, 6);
  // the diagonal stairway across the front, from the bumper to the deck
  const sx = xF - 0.15;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const y = p.frame + 0.35 + t * (d.y - p.frame - 0.4);
    const z = -core + 0.3 + t * (2 * core - 0.6);
    k.blk("steel", sx - 0.28, sx, y - 0.03, y, z - 0.35, z + 0.35);
  }
  // the fenders over the front wheels, at the deck's sides
  for (const s of [-1, 1]) fender(k, "cab", p.wheelX, ay, R, R + 0.08, 15, rearAngle(p, R + 0.08, 165), ...ord(s * (p.zo - p.w - 0.05), s * (p.zo + 0.1)));
  // the cab on the deck's left
  const zc = c.offset ?? -(hw - c.width / 2 - 0.1);
  const cx0 = xF - 0.45 - c.length;
  const L = cabLevels({ ...c, corner: 0.08 }, xF - 0.45, cx0, d.y, 0.02);
  shell(k, L, ["cab"], zc);
  windscreen(k, c, L, c.width / 2 - 0.12, zc);
  cabSides(k, { ...c, corner: 0.08 }, L, cx0, zc);
  roofKit(k, { ...c, beacon: "amber" }, L, zc);
  // the radiator's air cleaners and the right-hand deck's equipment box
  k.mass("cab2", xD + 0.4, xF - 1.0, d.y, d.y + 0.9, 0.4, hw - 0.4, 15);
  return { back: Math.min(xD, cx0), top: c.top, hw, front: xF, steps: Math.min(xD, cx0), roof: L[L.length - 1]!.xf };
}
