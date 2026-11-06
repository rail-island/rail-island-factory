// The world tram kit (docs/models/world-trams.md): a tram from one typed
// `WorldTramSpec` in metres from the nose, on the coach builder underneath the
// existing trams (csdCoachParts.ts volumes, tramKit.ts's pantographs, couplers
// and `articulate`). It draws what every tram has from the spec:
//
// - the body: one or more sections (a rigid car, two- and three-section
//   articulated cars, multi-articulated low-floor cars whose floating modules
//   hang between the others), each a set of volumes - the cab, the saloon, the
//   rear end - lofted from a cross-section along a plan and clamped by an
//   elevation, painted in horizontal bands;
// - the ends from a front library (`FRONTS`: Tatra, PCC, Duewag, angular,
//   Citadis-like, pointed, flat, bulb, retro) with the windscreen and the
//   destination display as bands of the cab;
// - single or double deck, an open top deck, open cross-bench sides;
// - framed windows between the doors, and the doors themselves, opening onto the
//   car's generic cabin (doors.ts, coachCabin.ts);
// - the running gear: bogies, single trucks (two axles in a rigid frame), Jacobs
//   bogies under a joint carrying both sections, rubber-tyred guided axles;
// - the collector: a diamond or single-arm pantograph raised to the game's
//   trolley wire as a `liftable` mechanism (collector.ts TRAM_COLLECTOR_TOP), a
//   trolley pole raised to the same wire, or none;
// - roof equipment boxes, couplers, head and tail lamps, and an `extra` hook for
//   what the kit cannot say (a horse, a tram engine's chimney, a cable grip).
//
// Axes as every rail vehicle's: metres, +X forward (the nose at the largest x),
// +Y up, +Z to the right, centred on x 0 and z 0, the treads on y 0. The game has
// one track gauge: a metre- or narrow-gauge prototype keeps its real body on the
// factory's standard-gauge wheelsets (docs/models/loading-gauge.md); `gauge`
// records the real one.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { COACH_PALETTE, hiAt, lerp, loAt, planK, sectionHalf, type Box, type Opening, type Pt, type Volume } from "./csdCoachParts.ts";
import { Tram, TRAM_PALETTE, articulate, clipLine, knee, type TramSection } from "./tramKit.ts";
import { block, side } from "./vehicleParts.ts";
import { liftable } from "./liftable.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { TRAM_COLLECTOR_TOP } from "./collector.ts";
import type { DoorMotion } from "./doors.ts";
import { volumeShell } from "./lodTrams.ts";
import {
  fitLod, lodBands, lodPantograph, lodRod, lodRoofBox, lodSideBox, windowBands, LOD_GLASS,
  type LodBand, type LodPart, type LodRect, type LodSections, type LodShell,
} from "./lodKit.ts";
import { lodDiamond } from "./lodTrams.ts";

// ---------------------------------------------------------------------------
// the spec

/** An end shape: the plan's taper, the elevation's rake and dome, the apron under the bumper. */
export interface EndShape {
  /** [metres back from the end, fraction of the half width], from the end inward; the last is 1. */
  plan: ReadonlyArray<readonly [number, number]>;
  /** [metres back, fraction from the windscreen's foot (0) to the roof (1)]: where the top clamps the end. */
  top: ReadonlyArray<readonly [number, number]>;
  /** [metres back, height]: where the bottom clamps the end (a sloped apron); none for an upright end. */
  apron?: ReadonlyArray<readonly [number, number]>;
  /**
   * The plan at the eave, as `plan`: the end narrows to it from the windscreen's
   * foot up (the screen's corners leaning in, a hood over the cab). Omit for
   * upright sides.
   */
  upper?: ReadonlyArray<readonly [number, number]>;
}

/**
 * What a cab end carries beyond its shape (heights and offsets in metres, z from
 * the centre line, each offset drawn mirrored on both sides; 0 draws one):
 * head and tail lamps on the end's surface, the windscreen's pillars, the
 * wipers, rear-view mirrors or camera arms, a bumper across the nose.
 */
export interface NoseDress {
  /** Head lamps [y, z, radius]; with `tails`, these replace the kit's default lamps. */
  heads?: ReadonlyArray<readonly [number, number, number]>;
  /** Tail lamps [y, z, radius], at every end. */
  tails?: ReadonlyArray<readonly [number, number, number]>;
  /** The lamps' housing paint (default a dark grey). */
  housing?: string;
  /** The windscreen's pillars and frame bars: z of each bar (mirrored), its paint. */
  pillars?: readonly number[];
  pillarPaint?: string;
  /** A horizontal frame bar across the screen at each height (a split screen, a sash). */
  bars?: readonly number[];
  /** The wipers' pivots: z of each (as listed, not mirrored), their length. */
  wipers?: readonly number[];
  wiperLength?: number;
  /** Rear-view mirrors on arms, or camera arms, at the cab's top corners; their height. */
  mirrors?: "arm" | "camera";
  mirrorY?: number;
  /** A bumper across the nose: its bottom and top, paint, how far it stands proud. */
  bumper?: readonly [y0: number, y1: number, mat: string, depth?: number];
  /**
   * The end's windows as panes laid on its surface, each over y0..y1 and z0..z1
   * in a frame (glass, or a display's `mat`), in place of the screen band across
   * the whole end: an old car's three front windows, a double-decker's two rows.
   */
  panes?: ReadonlyArray<{ y: readonly [number, number]; z: readonly [number, number]; mat?: string }>;
  /** Keep the screen band (`screen`, `sign`) as well as the panes: a screen round the corners, a sign or upper windows laid on. */
  screenBand?: boolean;
  /**
   * The destination display's lit text: the route number at the display's left and the
   * destination as a row of lit characters after it, over the band's `sign` (or the
   * display pane `display`, its index in `panes`), in `ledPaint` (default amber).
   */
  route?: string;
  display?: number;
  ledPaint?: string;
  /** The fleet number painted on the nose: its text, the centre's z and height, the figures' height and paint. */
  number?: readonly [text: string, z: number, y: number, h: number, mat?: string];
  /** Emblems on the nose: [y, z, radius, paint] each, a disc in a steel ring. */
  badges?: ReadonlyArray<readonly [number, number, number, string]>;
  /** Direction indicators [y, z] (mirrored): small amber lamps. */
  indicators?: ReadonlyArray<readonly [number, number]>;
  /** A grille: slats from y0 to y1, `half` wide each side of the middle, `n` of them, in `mat`. */
  grille?: readonly [y0: number, y1: number, half: number, n: number, mat: string];
  /** No rubber gasket along the screen's foot and head (an end with panes has none either). */
  noGasket?: boolean;
}

/** The front library: one shape per kind of end. */
export const FRONTS = {
  // the Tatra T and K cars: a round plan, an upright screen under a domed roof end
  tatra: { plan: [[0, 0.5], [0.12, 0.7], [0.32, 0.85], [0.6, 0.95], [0.95, 1]], top: [[0, 0.62], [0.06, 0.82], [0.25, 0.95], [0.9, 1]], apron: [[0, 0.62], [0.15, -1]] },
  // the PCC and its descendants: a streamlined round nose, a raked screen, a sloped apron
  pcc: { plan: [[0, 0.42], [0.2, 0.68], [0.5, 0.87], [0.9, 0.97], [1.3, 1]], top: [[0, 0.55], [0.2, 0.84], [0.7, 1]], apron: [[0, 0.72], [0.35, -1]] },
  // the Duewag cars: a flat front with angled corners, a slightly raked screen
  duewag: { plan: [[0, 0.78], [0.45, 0.95], [0.85, 1]], top: [[0, 0.8], [0.25, 0.95], [0.5, 1]] },
  // the angular cars of the 1970s and 80s: flat, chamfered corners, an upright screen
  angular: { plan: [[0, 0.82], [0.32, 1]], top: [[0, 0.92], [0.12, 1]], apron: [[0, 0.58], [0.1, -1]] },
  // the Citadis-like modern nose: rounded, a deep raked screen down to a low bumper
  modern: { plan: [[0, 0.55], [0.3, 0.76], [0.8, 0.91], [1.4, 0.98], [2.0, 1]], top: [[0, 0.05], [0.4, 0.6], [0.75, 0.88], [1.05, 1]], apron: [[0, 0.48], [0.22, -1]] },
  // a pointed modern nose (Cobra, Avenio, Tango): a long taper, the screen leaning far back
  pointed: { plan: [[0, 0.6], [0.9, 0.9], [1.7, 1]], top: [[0, 0.15], [0.55, 0.85], [0.85, 1]], apron: [[0, 0.5], [0.2, -1]] },
  // a flat low-floor front (Combino, ULF, Variobahn): almost upright, round corners
  flat: { plan: [[0, 0.84], [0.25, 0.96], [0.45, 1]], top: [[0, 0.62], [0.3, 0.93], [0.5, 1]], apron: [[0, 0.42], [0.08, -1]] },
  // the bulb nose (Skoda 14T, Porsche design): a long round snout, the screen far back
  bulb: { plan: [[0, 0.4], [0.3, 0.64], [0.8, 0.85], [1.5, 0.97], [2.1, 1]], top: [[0, 0.02], [0.6, 0.62], [1.15, 0.9], [1.55, 1]], apron: [[0, 0.5], [0.3, -1]] },
  // a retro or wooden car's end: a bowed dash, an upright vestibule, the roof carried over it
  retro: { plan: [[0, 0.62], [0.25, 0.86], [0.6, 1]], top: [[0, 0.96], [0.1, 1]] },
} as const satisfies Record<string, EndShape>;

export type FrontKind = keyof typeof FRONTS;

/** A truck under the car: at metres from the nose. */
export interface TruckSpec {
  at: number;
  /**
   * A bogie (turns under the body), a single truck (two axles in a rigid frame),
   * a Jacobs bogie under a joint carrying both sections, a portal (one pair of
   * wheels under a joint, the ULF's), a rubber-tyred guided axle.
   */
  kind: "bogie" | "truck" | "jacobs" | "portal" | "guided";
  /** Its wheelbase (a portal or guided axle: 0). */
  wb: number;
}

/** Whether a truck stands under a joint, carrying the sections either side. */
const underJoint = (t: TruckSpec): boolean => t.kind === "jacobs" || t.kind === "portal";

export type Collector =
  | { kind: "diamond"; at: number; reach?: number; low?: boolean }
  | { kind: "single"; at: number; low?: boolean }
  | { kind: "pole"; at: number; length?: number }
  | { kind: "none" };

/** A band of paint: up to height y1 from the band below, in material `mat`. */
export type Stack = ReadonlyArray<readonly [y1: number, mat: string]>;

export interface WorldTramSpec {
  /** The sections' body lengths, front first; the joints' gap between them. */
  sections: readonly number[];
  gap?: number;
  width: number;
  /** The roof's crown above the rail (equipment aside), the eave where the roof starts, the body's underside (the skirt). */
  height: number;
  eave: number;
  floor: number;
  /** The roof's section: an arched roof, a flatter modern one with round corners. */
  roof: "arched" | "flat";
  /** The ends: the front and the rear shape, and whether the rear has a cab (a double-ended car). */
  front: FrontKind;
  /** A design's own end shapes, in place of the front library's `front` (and `rear`; the rear defaults to the front's). */
  frontShape?: EndShape;
  rearShape?: EndShape;
  /** What the cab ends carry (lamps, pillars, wipers, mirrors, a bumper). */
  nose?: NoseDress;
  /** The cab ends' own paint stack (a nose's lamp band, a screen's surround); default `paint`. */
  cabPaint?: Stack;
  rear?: FrontKind;
  doubleEnded: boolean;
  /** The side windows' band, the panes' pitch; a double-decker's upper band. */
  windows: readonly [number, number];
  pitch: number;
  upper?: readonly [number, number];
  /** The windscreen's band and the destination display's depth at its top. */
  screen: readonly [number, number];
  sign?: number;
  /** The doors, metres from the nose; on the right only (single-ended) or both sides. */
  doors: ReadonlyArray<readonly [number, number]>;
  doorKind: "plug" | "fold" | "swing";
  /** The sill and head of the doors; the leaves' paint. */
  doorSill?: number;
  doorTop?: number;
  doorPaint?: string;
  trucks: readonly TruckSpec[];
  wheelRadius: number;
  /** The real track gauge, mm (the model rides on standard-gauge wheelsets). */
  gauge: number;
  collector: Collector;
  /** Roof boxes: metres from the nose, half width, height over the crown, material; the ends' rake (a fairing sloping down to the roof). */
  roofBoxes?: ReadonlyArray<readonly [number, number, number, number, string, number?]>;
  /** A clerestory along the saloon (an old car's raised roof lights). */
  clerestory?: boolean;
  /** Colours by material name; the paint stack from the skirt up to the eave (the roof above is `roof`). */
  colors: Record<string, string>;
  paint: Stack;
  /** The head lamps' height. */
  lamps?: number;
  /** A double-decker: an open top deck (a railing and garden seats) instead of a covered one. */
  deck?: "covered" | "open";
  /** Open sides: a cross-bench car's posts and benches instead of a closed saloon. */
  open?: boolean;
  /** The joints' bend limit, degrees. */
  maxBendDeg?: number;
  /** A trailer: no driving cab, so no head lamps (its collector is none). */
  trailer?: boolean;
  /** Skirts down over the wheels (a tram engine's): no cut-outs over the trucks. */
  skirted?: boolean;
  /** What the kit cannot say, drawn into the first section (a horse, a chimney, a cable grip), and its distant model. */
  extra?: (k: TramCtx) => void;
  extraLod?: (m: MeshBuilder, k: { s: WorldTramSpec; X: (u: number) => number }) => void;
  /** Kit options to report beyond those the spec shows (worldFleet.ts), for an `extra`. */
  extraFeatures?: readonly string[];
}

// ---------------------------------------------------------------------------
// the layout

/** A section's span, metres from the nose, and its Factory x range. */
interface SectionLayout { i: number; u0: number; u1: number; x0: number; x1: number; front: boolean; rear: boolean }

export function tramLength(s: WorldTramSpec): number {
  return s.sections.reduce((a, b) => a + b, 0) + (s.gap ?? 0.5) * (s.sections.length - 1);
}

function layout(s: WorldTramSpec): { L: number; X: (u: number) => number; secs: SectionLayout[] } {
  const L = tramLength(s);
  const X = (u: number) => L / 2 - u;
  let u = 0;
  const secs = s.sections.map((len, i) => {
    const sec = { i, u0: u, u1: u + len, x0: X(u + len), x1: X(u), front: i === 0, rear: i === s.sections.length - 1 };
    u += len + (s.gap ?? 0.5);
    return sec;
  });
  return { L, X, secs };
}

const COLOR = (c: string): MaterialSpec => ({ color: c, roughness: 0.5 });

/** The palette: the tram kit's materials and the livery's colours. */
function paletteOf(s: WorldTramSpec): Record<string, MaterialSpec> {
  return {
    pole: { color: "#2b2d31", roughness: 0.6 },
    timber: { color: "#8a5a32", roughness: 0.8 },
    seatWood: { color: "#a0703e", roughness: 0.7 },
    tyre: { color: "#1c1c1e", roughness: 0.95 },
    displayLed: { color: "#ffb21f", roughness: 0.3 },
    lettering: { color: "#f4f4f2", roughness: 0.4 },
    ...Object.fromEntries(Object.entries(s.colors).map(([k, v]) => [k, COLOR(v)])),
  };
}

/** The shape of a section's front (+1) or rear (-1) end. */
function endShape(s: WorldTramSpec, e: number): EndShape {
  if (e > 0) return s.frontShape ?? FRONTS[s.front];
  return s.rearShape ?? (s.rear ? FRONTS[s.rear] : s.frontShape ?? FRONTS[s.front]);
}

/** The cross-section (z, y) of the body: vertical sides to the eave, the roof arched or flat. */
function sectionRing(s: WorldTramSpec): Pt[] {
  const hw = s.width / 2;
  const H = s.height;
  const e = s.eave;
  const r = H - e;
  const right: Pt[] = s.roof === "arched"
    ? [[hw, s.floor], [hw, e], [hw * 0.94, e + r * 0.45], [hw * 0.8, e + r * 0.8], [hw * 0.5, H]]
    : [[hw, s.floor], [hw, e], [hw * 0.96, e + r * 0.6], [hw * 0.86, H]];
  return [[-hw, s.floor], ...right, ...right.slice(1).reverse().map(([z, y]): Pt => [-z, y])];
}

/** A section's plan, elevation top and bottom (ascending Factory x), from its ends and the trucks under it. */
function profiles(s: WorldTramSpec, sec: SectionLayout, X: (u: number) => number): { plan: Pt[]; top: Pt[]; bottom: Pt[]; upper: Pt[] } {
  const hw = s.width / 2;
  const foot = s.screen[0] - 0.05;
  const end = (shape: EndShape | null, at: number, dir: number) => {
    // dir +1: the front end at x1, the shape running back toward -x
    const plan: Pt[] = shape ? shape.plan.map(([b, f]): Pt => [at - dir * b, f * hw]) : [[at, hw]];
    const upper: Pt[] = shape ? (shape.upper ?? shape.plan).map(([b, f]): Pt => [at - dir * b, f * hw]) : [[at, hw]];
    const top: Pt[] = shape ? shape.top.map(([b, f]): Pt => [at - dir * b, foot + f * (s.height - foot)]) : [[at, s.height]];
    const apron: Pt[] = shape?.apron ? shape.apron.map(([b, y]): Pt => [at - dir * b, y < 0 ? s.floor : Math.max(y, s.floor)]) : [[at, s.floor]];
    return { plan, top, apron, upper };
  };
  const f = end(sec.front ? endShape(s, 1) : null, sec.x1, 1);
  const r = end(sec.rear ? endShape(s, -1) : null, sec.x0, -1);
  const asc = (a: Pt[], b: Pt[]) => [...a, ...[...b].reverse()].sort((p, q) => p[0] - q[0]);
  const plan = asc(r.plan, f.plan);
  const upper = asc(r.upper, f.upper);
  const top = asc(r.top, f.top);
  // the bottom: the aprons, and each truck's cut-out (the skirt raised over its wheels)
  const cuts: Array<(x: number) => number> = [];
  const breaks = new Set<number>([sec.x0, sec.x1, ...r.apron.map((p) => p[0]), ...f.apron.map((p) => p[0])]);
  const rr = s.wheelRadius;
  for (const t of s.trucks) {
    const x = X(t.at);
    if (x < sec.x0 - 0.5 || x > sec.x1 + 0.5) continue;
    const lift = 2 * rr + (t.kind === "guided" ? 0.15 : 0.06);
    if (lift <= s.floor + 0.02 || s.skirted) continue;
    const c = t.wb / 2 + rr + 0.05;
    const pts: Pt[] = [[x - c - 0.12, s.floor], [x - c, lift], [x + c, lift], [x + c + 0.12, s.floor]];
    pts.forEach((p) => breaks.add(p[0]));
    cuts.push((xx) => lerpOut(pts, xx, s.floor));
  }
  const apronAt = (pts: Pt[]) => (xx: number) => lerp([...pts].sort((p, q) => p[0] - q[0]), xx);
  const lo = [apronAt(r.apron), apronAt(f.apron), ...cuts];
  const xs = [...breaks].filter((x) => x >= sec.x0 - 1e-9 && x <= sec.x1 + 1e-9).sort((a, b) => a - b);
  const bottom = xs.map((x): Pt => [x, Math.max(s.floor, ...lo.map((g) => g(x)))]);
  return { plan: dedupe(plan), top: dedupe(top), bottom: dedupe(bottom), upper: dedupe(upper) };
}

/** A polyline's value at x, `out` outside its span. */
function lerpOut(pts: Pt[], x: number, out: number): number {
  if (x <= pts[0]![0] || x >= pts[pts.length - 1]![0]) return out;
  return lerp(pts, x);
}

const dedupe = (pts: Pt[]): Pt[] => pts.filter((p, i) => i === 0 || p[0] - pts[i - 1]![0] > 1e-6);

/** The stack as volume bands, from the skirt to above the roof. */
function bands(s: WorldTramSpec, stack: Stack): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  let y = s.floor;
  for (const [y1, mat] of stack) {
    if (y1 > y + 1e-6) out.push([y, Math.min(y1, s.eave), mat]);
    y = Math.max(y, Math.min(y1, s.eave));
  }
  if (s.eave > y + 1e-6) out.push([y, s.eave, stack[stack.length - 1]![1]]);
  out.push([s.eave, s.height + 0.5, "roof"]);
  return out.filter(([a, b]) => b - a > 1e-6);
}

/** `stack` with the band y0..y1 painted `mat` over it. */
function overlay(st: Array<[number, number, string]>, y0: number, y1: number, mat: string): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (const [a, b, m] of st) {
    if (b <= y0 || a >= y1) { out.push([a, b, m]); continue; }
    if (a < y0) out.push([a, y0, m]);
    if (b > y1) out.push([y1, b, m]);
  }
  out.push([y0, y1, mat]);
  return out.sort((p, q) => p[0] - q[0]);
}

/** The cab's bands: the windscreen in glass, the display at its top (and a double-decker's upper front windows). */
function cabBands(s: WorldTramSpec): Array<[number, number, string]> {
  let b = bands(s, s.cabPaint ?? s.paint);
  // windows laid on the end as panes: no glass band across it
  if (s.nose?.panes && !s.nose.screenBand) return b;
  const sign = s.sign ?? 0.22;
  b = overlay(b, s.screen[0], s.screen[1] - sign, "glass");
  if (sign > 0) b = overlay(b, s.screen[1] - sign, s.screen[1], "display");
  if (s.upper && s.deck !== "open" && !s.nose?.panes) b = overlay(b, s.upper[0], s.upper[1], "glass");
  return b;
}

/** How far back from each end the cab volume reaches. */
function cabLength(sh: EndShape): number {
  return Math.max(sh.plan[sh.plan.length - 1]![0], ...(sh.upper ?? []).map((p) => p[0]), sh.top[sh.top.length - 1]![0], ...(sh.apron ?? []).map((p) => p[0])) + 0.15;
}

/** How far back from the end its plan tapers (the straight side starts beyond it). */
const taperLength = (sh: EndShape): number => Math.max(sh.plan[sh.plan.length - 1]![0], ...(sh.upper ?? []).map((p) => p[0]));

// ---------------------------------------------------------------------------
// drawing

/** What an `extra` hook gets: the coach builder, the layout, the spec. */
export interface TramCtx {
  t: Tram;
  m: MeshBuilder;
  s: WorldTramSpec;
  L: number;
  X: (u: number) => number;
}

const motionOf = (s: WorldTramSpec, w: number): DoorMotion =>
  s.doorKind === "plug" ? { kind: "plug", leaves: w > 1.0 ? 2 : 1 } : s.doorKind === "fold" ? { kind: "fold", leaves: w > 1.0 ? 4 : 2 } : { kind: "swing", leaves: w > 1.0 ? 2 : 1 };

/** The doors on side s (metres from the nose): the right side's, and on a double-ended car the left side's at the same places. */
function doorsOn(s: WorldTramSpec, side: number): ReadonlyArray<readonly [number, number]> {
  if (s.open) return [];
  return side > 0 || s.doubleEnded ? s.doors : [];
}

/** The panes of a window band between x0 and x1 that keep clear of the door boxes (Factory x). */
function panes(x0: number, x1: number, doors: Array<[number, number]>, pitch: number): Array<[number, number]> {
  const free: Array<[number, number]> = [];
  let a = x0;
  for (const [d0, d1] of [...doors].sort((p, q) => p[0] - q[0])) {
    if (d1 < x0 || d0 > x1) continue;
    if (d0 - 0.15 > a) free.push([a, d0 - 0.15]);
    a = Math.max(a, d1 + 0.15);
  }
  if (x1 > a) free.push([a, x1]);
  const out: Array<[number, number]> = [];
  for (const [p, q] of free) {
    const len = q - p;
    if (len < 0.45) continue;
    const n = Math.max(1, Math.round(len / pitch));
    const w = len / n;
    for (let k = 0; k < n; k++) out.push([p + k * w + 0.04, p + (k + 1) * w - 0.04]);
  }
  return out;
}

/** The Factory x span where a section's side is straight and full width (clear of the tapered ends). */
function straight(s: WorldTramSpec, sec: SectionLayout): [number, number] {
  const back = (e: number) => taperLength(endShape(s, e)) + 0.1;
  return [sec.x0 + (sec.rear ? back(-1) : 0.2), sec.x1 - (sec.front ? back(1) : 0.2)];
}

/** The volumes of a section: the cab (or rear end), the saloon with its doorways, the rear end. */
function volumes(s: WorldTramSpec, sec: SectionLayout, X: (u: number) => number, t: Tram): { vols: Volume[]; saloon: Volume } {
  const { plan, top, bottom, upper } = profiles(s, sec, X);
  const ring = sectionRing(s);
  const main = bands(s, s.paint);
  const cab = cabBands(s);
  const leans = upper.some((p) => Math.abs(p[1] - lerp(plan, p[0])) > 1e-6) || plan.some((p) => Math.abs(p[1] - lerp(upper, p[0])) > 1e-6);
  const vol = (name: string, a: number, b: number, bs: Array<[number, number, string]>, openings?: Opening[]): Volume => ({
    name, section: ring, plan: clipLine(plan, a, b), top: clipLine(top, a, b), bottom: clipLine(bottom, a, b), bands: bs,
    ...(openings?.length ? { openings } : {}), trimCaps: true,
    ...(leans && !openings ? { upper: { y0: s.screen[0], y1: s.eave, plan: clipLine(upper, a, b) } } : {}),
  });
  const doorX = (side: number) => doorsOn(s, side).map(([u0, u1]) => [X(u1), X(u0)] as [number, number]).filter(([a, b]) => a >= sec.x0 - 1e-6 && b <= sec.x1 + 1e-6);
  const firstDoor = Math.max(sec.x0, ...[1, -1].flatMap((sd) => doorX(sd).map(([, b]) => b)));
  const lastDoor = Math.min(sec.x1, ...[1, -1].flatMap((sd) => doorX(sd).map(([a]) => a)));
  const fCab = sec.front ? Math.max(sec.x1 - cabLength(endShape(s, 1)), firstDoor + 0.06) : sec.x1;
  const rCab = sec.rear ? Math.min(sec.x0 + cabLength(endShape(s, -1)), lastDoor - 0.06) : sec.x0;
  const openings = [1, -1].flatMap((sd) => doorX(sd).map(([a, b]) => t.doorOpening(sd, doorBox(s, a, b))));
  const saloon = vol("saloon", rCab, fCab, main, openings);
  const vols: Volume[] = [];
  if (sec.rear) vols.push(vol(s.doubleEnded ? "rear cab" : "rear end", sec.x0, rCab, cab));
  vols.push(saloon);
  if (sec.front) vols.push(vol("front cab", fCab, sec.x1, cab));
  return { vols, saloon };
}

const doorBox = (s: WorldTramSpec, x0: number, x1: number): Box => ({ x0, x1, y0: s.doorSill ?? s.floor + 0.06, y1: s.doorTop ?? s.eave - 0.12 });

/** A box on the roof from x0 to x1, `half` across, its top `h` over the crown, its foot sunk into the roof. */
function roofBox(m: MeshBuilder, s: WorldTramSpec, mat: string, x0: number, x1: number, half: number, h: number, rake = 0): void {
  const ring = sectionRing(s);
  // the roof's height at the box's edge: the section's outline there
  const yEdge = roofAt(ring, half);
  const y0 = Math.min(yEdge, s.height) - 0.04;
  const y1 = s.height + h;
  const c = Math.min(0.06, (y1 - y0) / 2, half / 2);
  const r: Ring = [[-half, y0], [half, y0], [half, y1 - c], [half - c, y1], [-half + c, y1], [-half, y1 - c]];
  const k = Math.min(rake, (x1 - x0) / 3);
  if (k <= 0) { m.sweep(mat, "x", r, x0, r, x1); return; }
  // a fairing: its ends slope down to the roof, in two steps (a rounded nose)
  const low = (f: number, w: number): Ring => r.map(([z, y]) => [z * w, y0 + (y - y0) * f]);
  const [a, b] = [low(0.08, 0.96), low(0.7, 0.99)];
  m.sweep(mat, "x", a, x0, b, x0 + k * 0.45, false);
  m.sweep(mat, "x", b, x0 + k * 0.45, r, x0 + k, false);
  m.sweep(mat, "x", r, x0 + k, r, x1 - k, false);
  m.sweep(mat, "x", r, x1 - k, b, x1 - k * 0.45, false);
  m.sweep(mat, "x", b, x1 - k * 0.45, a, x1, false);
  m.slab(mat, a.map(([z, y]): Vec3 => [x0, y, z]), [0.002, 0, 0]);
  m.slab(mat, a.map(([z, y]): Vec3 => [x1, y, z]), [-0.002, 0, 0]);
}

/** The height of the section's upper outline at |z|. */
function roofAt(ring: Pt[], z: number): number {
  let best = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if ((a[0] - z) * (b[0] - z) > 0 || Math.abs(a[0] - b[0]) < 1e-9) continue;
    best = Math.max(best, a[1] + ((z - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
  }
  return best;
}

/**
 * A tram bogie or truck at Factory x: two wheelsets `wb` apart (one, for a guided
 * axle), side frames inside the body's width, the bolster up to `top`. A bogie
 * and a Jacobs bogie are `m.bogie` nodes (a Jacobs bogie carrying the two
 * sections it stands under); a single truck's wheelsets ride in the body.
 */
function truck(t: Tram, s: WorldTramSpec, k: TruckSpec, x: number, top: number, sections?: number[]): void {
  const m = t.m;
  const r = s.wheelRadius;
  const ay = r * Math.cos(Math.PI / 24);
  const hz = Math.min(1.06, s.width / 2 - 0.04);
  const draw = () => {
    if (k.kind === "guided") {
      // a 16-sided tyre stands on a flat: its axle r cos(pi / 16) over the road
      const ay = r * Math.cos(Math.PI / 16);
      m.scope("wheelset", () => {
        const axle = ngon(10, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -hz + 0.18, axle, hz - 0.18);
        for (const sd of [-1, 1]) {
          const tyre = ngon(16, r, Math.PI / 16, x, ay);
          const [w0, w1] = side(sd, hz - 0.42, hz - 0.12);
          m.sweep("tyre", "z", tyre, w0, tyre, w1);
          const hub = ngon(10, r * 0.55, 0, x, ay);
          const [h0, h1] = side(sd, hz - 0.12, hz - 0.1);
          m.sweep("wheel", "z", hub, h0, hub, h1);
        }
      });
      // the guide: two inclined rollers on the central rail
      m.scope("guide rollers", () => {
        for (const d of [-0.45, 0.45]) {
          for (const sd of [-1, 1]) m.rod("steel", [x + d, 0.16, sd * 0.07], [x + d, 0.06, sd * 0.07], 0.05, 8);
          block(m, "bogie", x + d - 0.06, x + d + 0.06, 0.16, ay, -0.08, 0.08);
        }
        block(m, "bogie", x - 0.5, x + 0.5, ay - 0.06, ay + 0.04, -0.12, 0.12);
      });
      block(m, "bogie", x - 0.25, x + 0.25, ay + 0.05, top - 0.05, -hz + 0.2, hz - 0.2);
      return;
    }
    if (k.kind === "portal") {
      // one pair of wheels under the joint, the portal frame over them up to both sections
      m.scope("wheelset", () => t.wheelset(x, r));
      m.scope("frame", () => {
        for (const sd of [-1, 1]) block(m, "bogie", x - r - 0.08, x + r + 0.08, ay - 0.1, ay + 0.12, ...side(sd, hz - 0.18, hz));
        block(m, "bogie", x - 0.18, x + 0.18, ay + 0.12, Math.max(ay + 0.25, top - 0.03), -hz + 0.05, hz - 0.05);
      });
      return;
    }
    for (const dx of [-k.wb / 2, k.wb / 2]) m.scope("wheelset", () => t.wheelset(x + dx, r));
    m.scope("frame", () => {
      for (const sd of [-1, 1]) {
        block(m, "bogie", x - k.wb / 2 - 0.32, x + k.wb / 2 + 0.32, ay - 0.02, ay + 0.15, ...side(sd, hz - 0.14, hz));
        // the axle boxes, their outer faces clear of the axle's ends (1.02 m out)
        const box = Math.abs(hz + 0.01 - 1.02) < 0.006 ? 1.035 : hz + 0.01;
        for (const dx of [-k.wb / 2, k.wb / 2]) block(m, "bogie", x + dx - 0.15, x + dx + 0.15, ay - 0.12, ay + 0.11, ...side(sd, hz - 0.2, box));
        for (const dx of [-k.wb / 4, k.wb / 4]) m.prism("spring", ngon(8, 0.07, 0, x + dx, sd * (hz - 0.07)), ay + 0.15, ay + 0.3);
      }
      if (k.kind !== "truck") block(m, "bogie", x - 0.2, x + 0.2, ay + 0.02, Math.max(ay + 0.2, top - 0.03), -hz + 0.1, hz - 0.1);
      block(m, "bogie", x - k.wb / 2 + 0.28, x + k.wb / 2 - 0.28, ay + 0.03, ay + 0.13, -hz + 0.14, hz - 0.14);
      // the traction motor between the wheelsets
      if (k.wb > 1.2) {
        const motor = ngon(10, 0.16, 0, x, ay + 0.02);
        m.sweep("bogie", "z", motor, -0.4, motor, 0.4);
      }
    });
  };
  if (k.kind === "truck") m.scope("truck", draw);
  else m.bogie(draw, sections ? { sections } : {});
}

/**
 * A trolley pole: a rod from its base on the roof back to the wire, its shoe on
 * the end, a `liftable` mechanism ("trolleypole") from lowered on the roof to
 * raised with the shoe's top at the game's trolley wire.
 */
function trolleyPole(m: MeshBuilder, s: WorldTramSpec, xb: number, wanted: number, rear: number): void {
  const yb = s.height + 0.32;
  m.scope("base", () => {
    block(m, "pole", xb - 0.35, xb + 0.35, s.height - 0.05, yb - 0.12, -0.3, 0.3);
    block(m, "frame", xb - 0.12, xb + 0.12, yb - 0.13, yb - 0.04, -0.09, 0.09);
  });
  // the pole trails back from its base, its shoe over the body's rear end at the most
  const length = Math.min(wanted, poleReach(xb, rear));
  const shoe = 0.06;
  const shoeR = 0.035;
  // the six-sided shoe's top: its flat, r cos 30 degrees over its axis
  const up = Math.asin((TRAM_COLLECTOR_TOP - shoe - shoeR * Math.cos(Math.PI / 6) - yb) / length);
  const down = Math.asin(0.1 / length);
  liftable(m, "trolleypole", (mm, lift) => {
    const a = down + (up - down) * lift;
    const tip: Vec3 = [xb - length * Math.cos(a), yb + length * Math.sin(a), 0];
    mm.rod("pole", [xb, yb, 0], tip, 0.03, 6);
    mm.rod("frame", [tip[0] - 0.1, tip[1] + shoe, 0], [tip[0] + 0.1, tip[1] + shoe, 0], shoeR, 6);
  });
}

/** How far a double-decker's low diamond pantograph stands sunk under the roof's crown. */
const LOW_SINK = 0.15;

/** The longest pole from a base at Factory x `xb` whose lowered shoe stays over the body's rear end at `rear`. */
const poleReach = (xb: number, rear: number): number => xb - rear - 0.15;

/**
 * A single-arm pantograph that folds flat: the lower arm hinged half a metre
 * behind the collector, the knee toward -x. Raised, the carbon strip's top is at
 * the game's trolley wire; folding, the collector comes back toward the hinge
 * until both arms lie along the roof, the knee beyond the hinge (the arms' 1.45
 * and 1.6 m lengths fixed, the knee found by intersecting circles at every lift).
 * A `liftable` mechanism. A double-decker's (`low`) stands on short insulators,
 * its arms 0.7 and 0.76 m.
 */
function armPantograph(m: MeshBuilder, x: number, roof: number, low: boolean): void {
  // a double-decker's short lift takes short arms, or the knee would stand above the wire
  const [lower, upper] = low ? [0.7, 0.76] : [1.45, 1.6];
  const xh = x - 0.5;
  const base = roof + (low ? 0.06 : 0.2);
  const hinge: [number, number] = [xh, base + 0.08];
  const raised: [number, number] = [x, TRAM_COLLECTOR_TOP - 0.11];
  // folded: the collector just ahead of the hinge, the arms (nearly) in line
  const folded: [number, number] = [xh + upper - lower + 0.002, base + 0.1];
  liftable(m, "pantograph", (mm, lift) => {
    const c: [number, number] = [folded[0] + (raised[0] - folded[0]) * lift, folded[1] + (raised[1] - folded[1]) * lift];
    const k = knee(hinge, lower, c, upper, 1);
    mm.scope("base", () => {
      for (const sd of [-1, 1]) block(mm, "pantograph", xh - 0.35, x + 0.35, base - 0.04, base, sd * 0.32 - 0.03, sd * 0.32 + 0.03);
      for (const dx of [xh - 0.25, x + 0.25]) for (const sd of [-1, 1]) mm.prism("insulator", ngon(8, 0.045, 0, dx, sd * 0.32), roof - 0.01, base - 0.04);
      const shaft = ngon(8, 0.035, 0, hinge[0], hinge[1]);
      mm.sweep("pantograph", "z", shaft, -0.34, shaft, 0.34);
    });
    mm.scope("arms", () => {
      for (const sd of [-1, 1]) mm.rod("pantograph", [hinge[0], hinge[1], sd * 0.22], [k[0], k[1], sd * 0.05], 0.03, 6);
      const kt = ngon(6, 0.03, 0, k[0], k[1]);
      mm.sweep("pantograph", "z", kt, -0.08, kt, 0.08);
      for (const sd of [-1, 1]) mm.rod("pantograph", [k[0], k[1], sd * 0.04], [c[0], c[1], sd * 0.25], 0.018, 6);
    });
    mm.scope("collector", () => {
      const y = c[1];
      block(mm, "pantograph", c[0] - 0.06, c[0] + 0.06, y - 0.03, y + 0.03, -0.3, 0.3);
      block(mm, "pantograph", c[0] - 0.06, c[0] + 0.06, y + 0.03, y + 0.08, -0.8, 0.8);
      block(mm, "carbon", c[0] - 0.045, c[0] + 0.045, y + 0.08, y + 0.11, -0.75, 0.75);
      for (const sd of [-1, 1]) {
        const [a0, a1] = sd > 0 ? [0.8, 0.94] : [-0.94, -0.8];
        const horn: Ring = [[c[0] - 0.03, y + 0.08], [c[0] + 0.03, y + 0.08], [c[0] + 0.03, y - 0.08], [c[0] - 0.03, y - 0.08]];
        mm.sweep("pantograph", "z", horn, a0, horn, a1);
      }
    });
  });
}

/** The roof's top over Factory x in a section (the crown, or the end's rake). */
function crownAt(s: WorldTramSpec, top: Pt[], x: number): number {
  return Math.min(s.height, lerp(top, x));
}

/** An offset and its mirror image (0 once). */
const mirrored = (z: number): number[] => (Math.abs(z) < 1e-9 ? [0] : [z, -z]);

/**
 * The end surface of cab volume v at end e (+1 the larger x): the outermost x
 * where the body holds the point (y, z), searched back from the end in 5 mm
 * steps, with the outward normal there (from the neighbouring points).
 */
function noseAt(v: Volume, e: number, y: number, z: number): { x: number; n: Vec3 } {
  const xs = v.plan.map((p) => p[0]);
  const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
  const inside = (x: number, yy: number, zz: number) =>
    yy <= hiAt(v, x) + 1e-9 && yy >= loAt(v, x) - 1e-9 && Math.abs(zz) <= sectionHalf(v.section, yy) * planK(v, x, yy) + 1e-9;
  const find = (yy: number, zz: number): number => {
    // 2 cm steps to the body, then back and in 2.5 mm steps
    let x = e > 0 ? hi : lo;
    const stop = e > 0 ? lo : hi;
    while ((x - stop) * e > 0 && !inside(x, yy, zz)) x -= e * 0.02;
    if ((x - stop) * e <= 0) return stop;
    x += e * 0.02;
    while (!inside(x, yy, zz)) x -= e * 0.0025;
    return x;
  };
  const x = find(y, z);
  const d = 0.03;
  const fy = (find(y + d, z) - find(y - d, z)) / (2 * d);
  const fz = (find(y, z + d) - find(y, z - d)) / (2 * d);
  const n: Vec3 = [e, -fy, -fz];
  const len = Math.hypot(...n);
  return { x, n: [n[0] / len, n[1] / len, n[2] / len] };
}

/** A round lamp on the end surface of v at (y, z): its housing and lens along the surface's normal. */
function noseLamp(m: MeshBuilder, v: Volume, e: number, y: number, z: number, r: number, lens: string, housing: string): void {
  const { x, n } = noseAt(v, e, y, z);
  const at = (d: number): Vec3 => [x + n[0] * d, y + n[1] * d, z + n[2] * d];
  m.rod(housing, at(-0.02), at(0.025), r * 1.35, 16);
  // the reflector's chrome ring round the lens
  m.rod("steel", at(0.02), at(0.03), r * 1.14, 16);
  m.rod(lens, at(0.025), at(0.04), r, 16);
}

/**
 * Flat (u, v) triangles laid on the end surface of v, `lift` off it: u runs from
 * the viewer's left to right as seen from ahead of the end (toward -z at the
 * front, +z at the rear), v is the height.
 */
function onNoseFlat(m: MeshBuilder, v: Volume, e: number, mat: string, tris: ReadonlyArray<readonly [number, number]>, lift: number): void {
  if (!tris.length) return;
  const u = tris.map((p) => p[0]);
  const w = tris.map((p) => p[1]);
  const c = noseAt(v, e, (Math.min(...w) + Math.max(...w)) / 2, -e * (Math.min(...u) + Math.max(...u)) / 2);
  const pts = tris.map(([uu, y]): Vec3 => {
    const z = -e * uu;
    const { x } = noseAt(v, e, y, z);
    return [x + c.n[0] * lift, y + c.n[1] * lift, z + c.n[2] * lift];
  });
  m.facets(mat, pts, c.n);
}

/** A rectangle of (u, v) triangles. */
const rectUV = (u0: number, v0: number, u1: number, v1: number): Array<[number, number]> => [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];

/** Lettering in (u, v), centred on u = uc, from height v0, figures h tall (strokeFont.ts). */
function letters(text: string, uc: number, v0: number, h: number, stroke = h * 0.14): Array<[number, number]> {
  const [w, gap] = [h * 0.6, h * 0.18];
  return strokeText(text, uc - strokeWidth(text, w, gap) / 2, v0, h, w, gap, false, stroke);
}

/** A rod laid on the end surface of v along the (y, z) points, `lift` off it. */
function onNose(m: MeshBuilder, v: Volume, e: number, mat: string, pts: ReadonlyArray<readonly [number, number]>, r: number, lift: number): void {
  const ps = pts.map(([y, z]) => { const { x, n } = noseAt(v, e, y, z); return [x + n[0] * lift, y + n[1] * lift, z + n[2] * lift] as Vec3; });
  for (let i = 1; i < ps.length; i++) m.rod(mat, ps[i - 1]!, ps[i]!, r, 6);
}

/** What a cab end carries: the screen's pillars and bars, the wipers, the mirrors, the bumper (NoseDress). */
function noseDress(m: MeshBuilder, s: WorldTramSpec, v: Volume, e: number, cab: boolean): void {
  const d = cab ? s.nose! : { ...(s.nose!.panes ? { panes: s.nose!.panes } : {}), ...(s.nose!.bumper ? { bumper: s.nose!.bumper } : {}), ...(s.nose!.pillarPaint ? { pillarPaint: s.nose!.pillarPaint } : {}) };
  const hw = s.width / 2;
  const [g0, g1] = [s.screen[0], s.screen[1] - (s.sign ?? 0.22)];
  const steps = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const frame = d.pillarPaint ?? "seam";
  if (d.pillars?.length) m.scope("screen pillars", () => {
    for (const p of d.pillars!) for (const z of mirrored(p)) onNose(m, v, e, frame, steps(g0 + 0.02, g1 - 0.02, 6).map((y) => [y, z] as const), 0.035, 0.004);
  });
  if (d.bars?.length) m.scope("screen bars", () => {
    for (const y of d.bars!) {
      const w = sectionHalf(v.section, y) * planK(v, v.plan[e > 0 ? v.plan.length - 1 : 0]![0], y) * 0.96;
      onNose(m, v, e, frame, steps(-w, w, 10).map((z) => [y, z] as const), 0.03, 0.004);
    }
  });
  if (d.wipers?.length) m.scope("wipers", () => {
    const len = d.wiperLength ?? 0.8;
    for (const z0 of d.wipers!) {
      // parked, leaning toward the middle at 70 degrees
      const sgn = z0 > 0 ? -1 : 1;
      const [y0, y1, z1] = [g0 + 0.08, g0 + 0.08 + len * Math.sin(1.22), z0 + sgn * len * Math.cos(1.22)];
      // the arm, and the blade beside it along its outer four fifths
      onNose(m, v, e, "seam", steps(0, 1, 4).map((t) => [y0 + (y1 - y0) * t, z0 + (z1 - z0) * t] as const), 0.012, 0.03);
      const [oy, oz] = [-(z1 - z0) / len * 0.035, (y1 - y0) / len * 0.035];
      onNose(m, v, e, "rubber", steps(0.18, 1, 4).map((t) => [y0 + (y1 - y0) * t + oy, z0 + (z1 - z0) * t + oz] as const), 0.01, 0.016);
      const { x, n } = noseAt(v, e, y0, z0);
      m.rod("seam", [x, y0, z0], [x + n[0] * 0.05, y0 + n[1] * 0.05, z0 + n[2] * 0.05], 0.03, 8);
    }
  });
  // the screen's rubber gasket along its foot and its head
  const band = !s.nose!.panes || s.nose!.screenBand;
  const xEnd0 = v.plan[e > 0 ? v.plan.length - 1 : 0]![0];
  const faceAt = (y: number) => sectionHalf(v.section, y) * planK(v, xEnd0, y);
  if (cab && band && !d.noGasket) m.scope("screen gasket", () => {
    for (const y of [g0 + 0.01, g1 - 0.01]) {
      const w = faceAt(y) - 0.06;
      onNose(m, v, e, "rubber", steps(-w, w, 12).map((z) => [y, z] as const), 0.014, 0.004);
    }
  });
  if (cab && d.route !== undefined) m.scope("display text", () => {
    const pane = d.display !== undefined ? d.panes?.[d.display] : undefined;
    const [y0, y1] = pane ? pane.y : [g1, s.screen[1]];
    const half = pane ? Math.max(Math.abs(pane.z[0]), Math.abs(pane.z[1])) - 0.05 : faceAt(y1) * 0.8;
    const h = Math.min(0.2, (y1 - y0) * 0.62);
    const yb = (y0 + y1) / 2 - h / 2;
    const led = d.ledPaint ?? "displayLed";
    const lift = pane ? 0.02 : 0.01;
    const tris: Array<[number, number]> = d.route ? letters(d.route, -half + 0.08 + strokeWidth(d.route, h * 0.6, h * 0.18) / 2, yb, h) : [];
    // the destination: a row of lit characters after the number (words of five and six)
    const start = -half + 0.2 + (d.route ? strokeWidth(d.route, h * 0.6, h * 0.18) : 0);
    const cw = h * 0.42;
    let u = start;
    for (const word of [5, 6, 4]) {
      for (let k = 0; k < word && u + cw < half - 0.05; k++, u += cw * 1.3) tris.push(...rectUV(u, yb + h * 0.18, u + cw, yb + h * 0.8));
      u += cw * 1.3;
    }
    onNoseFlat(m, v, e, led, tris, lift);
  });
  if (cab && d.number) m.scope("fleet number", () => {
    const [text, z, y, h, mat] = d.number!;
    onNoseFlat(m, v, e, mat ?? "lettering", letters(text, -e * z, y - h / 2, h), 0.006);
  });
  if (cab && d.badges) m.scope("badges", () => d.badges!.forEach(([y, z, r, mat]) => {
    const { x, n } = noseAt(v, e, y, z);
    const at = (k: number): Vec3 => [x + n[0] * k, y + n[1] * k, z + n[2] * k];
    m.rod("steel", at(-0.01), at(0.008), r * 1.15, 16);
    m.rod(mat, at(0.006), at(0.014), r, 16);
  }));
  if (d.indicators) m.scope("indicators", () => {
    for (const [y, z0] of d.indicators!) for (const z of mirrored(z0)) noseLamp(m, v, e, y, z, 0.03, "lampAmber", d.housing ?? "underframe");
  });
  if (d.grille) m.scope("grille", () => {
    const [y0, y1, half, n, mat] = d.grille!;
    for (let k = 0; k < n; k++) {
      const y = n > 1 ? y0 + ((y1 - y0) * k) / (n - 1) : y0;
      onNose(m, v, e, mat, steps(-half, half, 6).map((z) => [y, z] as const), 0.012, 0.008);
    }
  });
  if (d.mirrors) m.scope("mirrors", () => {
    const y = d.mirrorY ?? g1 - 0.1;
    for (const sd of [-1, 1]) {
      const { x } = noseAt(v, e, y, sd * (sectionHalf(v.section, y) * planK(v, v.plan[e > 0 ? v.plan.length - 1 : 0]![0], y) - 0.02));
      const xb = x - e * 0.12;
      const zb = sd * hw;
      const camera = d.mirrors === "camera";
      const out = camera ? 0.16 : 0.24;
      const tip: Vec3 = [xb + e * (camera ? 0.12 : 0.22), y - 0.06, sd * (hw + out)];
      m.rod("seam", [xb, y + 0.04, zb - sd * 0.02], [xb + e * 0.05, y + 0.06, sd * (hw + out * 0.5)], 0.022, 6);
      m.rod("seam", [xb + e * 0.05, y + 0.06, sd * (hw + out * 0.5)], tip, 0.022, 6);
      const [hx, hy, hz] = camera ? [0.07, 0.06, 0.06] : [0.04, 0.17, 0.09];
      block(m, "seam", tip[0] - hx, tip[0] + hx, tip[1] - hy, tip[1] + hy * 0.6, tip[2] - hz, tip[2] + hz);
      if (!camera) block(m, "glass", e > 0 ? tip[0] - hx - 0.006 : tip[0] + hx, e > 0 ? tip[0] - hx : tip[0] + hx + 0.006, tip[1] - hy + 0.02, tip[1] + hy * 0.6 - 0.02, tip[2] - hz + 0.015, tip[2] + hz - 0.015);
    }
  });
  if (d.panes?.length) m.scope("panes", () => d.panes!.forEach((p, i) => m.scope(`pane ${i + 1}`, () => {
    // kept on the end's face, short of its corners
    const xEnd = v.plan[e > 0 ? v.plan.length - 1 : 0]![0];
    const face = Math.min(...[p.y[0], p.y[1]].map((y) => sectionHalf(v.section, y) * planK(v, xEnd, y))) - 0.08;
    const clampZ = (z: number) => Math.max(-face, Math.min(face, z));
    const patch = (mat: string, grow: number, lift: number) => {
      const ys = steps(p.y[0] - grow, p.y[1] + grow, 3);
      const zs = steps(clampZ(p.z[0]) - grow, clampZ(p.z[1]) + grow, 4);
      const at = ys.map((y) => zs.map((z) => { const { x, n } = noseAt(v, e, y, z); return { p: [x + n[0] * lift, y + n[1] * lift, z + n[2] * lift] as Vec3, n }; }));
      for (let a = 0; a + 1 < ys.length; a++) for (let b = 0; b + 1 < zs.length; b++) {
        const [p00, p01, p10, p11] = [at[a]![b]!, at[a]![b + 1]!, at[a + 1]![b]!, at[a + 1]![b + 1]!];
        const n: Vec3 = [(p00.n[0] + p11.n[0]) / 2, (p00.n[1] + p11.n[1]) / 2, (p00.n[2] + p11.n[2]) / 2];
        m.facets(mat, [p00.p, p01.p, p11.p, p00.p, p11.p, p10.p], n);
      }
    };
    patch(d.pillarPaint ?? "frame", 0.045, 0.004);
    patch(p.mat ?? "glass", 0, 0.014);
  })));
  if (d.bumper) m.scope("bumper", () => {
    const [y0, y1, mat, depth] = d.bumper!;
    // on the body's end: below its underside, at the underside's edge
    const xEnd = v.plan[e > 0 ? v.plan.length - 1 : 0]![0];
    const ym = Math.max((y0 + y1) / 2, loAt(v, xEnd) + 0.03);
    const w = sectionHalf(v.section, ym) * planK(v, xEnd, ym);
    const zs = steps(-w * 0.94, w * 0.94, 8);
    for (let i = 1; i < zs.length; i++) {
      const [za, zb] = [zs[i - 1]!, zs[i]!];
      const xa = e > 0 ? Math.min(noseAt(v, e, ym, za).x, noseAt(v, e, ym, zb).x) : Math.max(noseAt(v, e, ym, za).x, noseAt(v, e, ym, zb).x);
      const [p, q] = [xa - e * 0.08, xa + e * (depth ?? 0.06)];
      block(m, mat, Math.min(p, q), Math.max(p, q), y0, y1, za, zb);
    }
  });
}

/** Draws one section (its body, sides, ends, roof and the trucks it owns). */
function drawSection(k: TramCtx, sec: SectionLayout, n: number): void {
  const { t, m, s, X } = k;
  const { vols, saloon } = volumes(s, sec, X, t);
  const hw = s.width / 2;
  m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
  if (s.clerestory) {
    const [a, b] = straight(s, sec);
    m.scope("clerestory", () => roofBox(m, s, "roof", a + 0.4, b - 0.4, hw * 0.45, 0.19));
  }
  const [xa, xb] = straight(s, sec);
  for (const sd of [1, -1]) m.scope(sd > 0 ? "right side" : "left side", () => {
    const doors = doorsOn(s, sd).map(([u0, u1]) => [X(u1), X(u0)] as [number, number]).filter(([a, b]) => a >= sec.x0 - 1e-6 && b <= sec.x1 + 1e-6);
    const lower = panes(xa, xb, doors, s.pitch);
    m.scope("windows", () => lower.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => t.window(saloonAt(vols, (a + b) / 2) ?? saloon, sd, { x0: a, x1: b, y0: s.windows[0], y1: s.windows[1] }, { fw: 0.05 }))));
    if (s.upper) {
      const up = panes(xa, xb, [], s.pitch);
      if (s.deck !== "open") m.scope("upper windows", () => up.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => t.window(saloonAt(vols, (a + b) / 2) ?? saloon, sd, { x0: a, x1: b, y0: s.upper![0], y1: s.upper![1] }, { fw: 0.05 }))));
    }
    if (doors.length) m.scope("doors", () => doors.forEach(([a, b], i) => m.scope(`door ${i + 1}`, () => {
      const box = doorBox(s, a, b);
      const motion = motionOf(s, b - a);
      const leaves = motion.leaves;
      const lw = (b - a) / leaves;
      t.door(saloon, sd, box, s.doorPaint ?? "doorGrey", {
        opens: motion,
        leafWork: (clip) => {
          for (let q = 0; q < leaves; q++) {
            const lb = clip({ x0: a + q * lw + 0.06, x1: a + (q + 1) * lw - 0.06, y0: Math.max(box.y0 + 0.45, s.windows[0] - 0.4), y1: box.y1 - 0.12 });
            if (lb) m.scope(`light ${q + 1}`, () => t.window(saloon, sd, lb, { fw: 0.035 }));
          }
        },
      });
    })));
  });
  // the ends: lamps and couplers
  for (const e of [1, -1]) {
    const isEnd = e > 0 ? sec.front : sec.rear;
    if (!isEnd) continue;
    const v = e > 0 ? vols[vols.length - 1]! : vols[0]!;
    // a trailer leads nothing: tail lamps only
    const head = !s.trailer && (e > 0 || s.doubleEnded);
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const y = s.lamps ?? Math.max(s.floor + 0.3, 0.75);
      const dress = s.nose;
      if (dress?.heads || dress?.tails) m.scope("lamps", () => {
        const housing = dress.housing ?? "underframe";
        if (head) for (const [ly, lz, r] of dress.heads ?? []) for (const z of mirrored(lz)) noseLamp(m, v, e, ly, z, r, "lampHead", housing);
        for (const [ly, lz, r] of dress.tails ?? []) for (const z of mirrored(lz)) noseLamp(m, v, e, ly, z, r, "lampRed", housing);
      });
      else m.scope("lamps", () => {
        for (const sd of [-1, 1]) {
          if (head) t.cornerLamp(v, e, sd * hw * 0.62, y, 0.075, "lampHead");
          t.cornerLamp(v, e, sd * hw * 0.8, y + (head ? 0.2 : 0), 0.045, "lampRed");
        }
      });
      // a cab end's screen frame, wipers, mirrors and bumper
      // (a single-ended car's rear end keeps its windows, without wipers or mirrors)
      if (dress) m.scope("nose", () => noseDress(m, s, v, e, !s.trailer && (e > 0 || s.doubleEnded)));
      const xe = e > 0 ? sec.x1 : sec.x0;
      m.scope("coupler", () => t.coupler(e, xe - e * 0.7, xe + e * 0.18, Math.max(0.5, s.floor + 0.15)));
    });
  }
  // the roof: equipment boxes, the collector
  const { top } = profiles(s, sec, X);
  m.scope("roof equipment", () => {
    (s.roofBoxes ?? []).forEach(([u0, u1, half, h, mat, rake], i) => {
      const [a, b] = [X(u1), X(u0)];
      if ((a + b) / 2 < sec.x0 || (a + b) / 2 > sec.x1) return;
      m.scope(`box ${i + 1}`, () => roofBox(m, s, mat, Math.max(a, sec.x0 + 0.1), Math.min(b, sec.x1 - 0.1), half, h, rake ?? 0));
    });
    const c = s.collector;
    if (c.kind !== "none") {
      const x = X(c.at);
      if (x >= sec.x0 && x <= sec.x1) {
        const roof = crownAt(s, top, x);
        // a double-decker's diamond stands low on its insulators, so it folds half a metre below the wire
        if (c.kind === "diamond") m.scope("pantographs", () => m.scope("pantograph", () => t.diamond(x, roof - (c.low ? LOW_SINK : 0), TRAM_COLLECTOR_TOP, c.reach ? { reach: c.reach } : {})));
        else if (c.kind === "single") m.scope("pantographs", () => m.scope("pantograph", () => armPantograph(m, x, roof, c.low ?? false)));
        else m.scope("trolley pole", () => trolleyPole(m, s, x, c.length ?? 5.0, sec.x0));
      }
    }
  });
  // the running gear this section carries
  m.scope("running gear", () => s.trucks.forEach((tr, i) => {
    const x = X(tr.at);
    const own = x >= sec.x0 - 1e-6 && x <= sec.x1 + 1e-6;
    // a Jacobs bogie under the joint behind section i: drawn by section i, carrying i and i + 1
    const jacobsBehind = underJoint(tr) && sec.i + 1 < n && x < sec.x0 + 1e-6 && x > sec.x0 - (s.gap ?? 0.5) - 1e-6;
    if (underJoint(tr) ? !jacobsBehind : !own) return;
    const yTop = Math.max(s.floor, 2 * s.wheelRadius + 0.02);
    m.scope(`${tr.kind} ${i + 1}`, () => truck(t, s, tr, x, yTop, underJoint(tr) && n > 1 ? [sec.i, sec.i + 1] : undefined));
  }));
  if (s.deck === "open") m.scope("top deck", () => openDeck(m, s, sec));
  if (sec.front) m.scope("extra", () => s.extra?.(k));
}

/**
 * An open top deck over a section: its floor on the saloon's roof, a railing of
 * posts and rails round it, a knifeboard (a back-to-back bench along the middle)
 * and a stair at each end.
 */
function openDeck(m: MeshBuilder, s: WorldTramSpec, sec: SectionLayout): void {
  const hw = s.width / 2;
  const y = s.height;
  const [x0, x1] = [sec.x0 - 0.6, sec.x1 + 0.6];
  m.scope("floor", () => block(m, "timber", x0, x1, y - 0.02, y + 0.06, -hw - 0.05, hw + 0.05));
  m.scope("railing", () => {
    const n = Math.max(4, Math.round((x1 - x0) / 0.9));
    for (let q = 0; q <= n; q++) {
      const x = x0 + 0.04 + ((x1 - x0 - 0.08) * q) / n;
      for (const sd of [-1, 1]) m.prism("frame", ngon(6, 0.025, 0, x, sd * hw), y + 0.06, y + 1.0);
    }
    for (const sd of [-1, 1]) {
      for (const h of [0.45, 0.98]) block(m, "frame", x0, x1, y + h - 0.03, y + h + 0.02, ...side(sd, hw - 0.025, hw + 0.025));
      // the decency board under the top rail, painted
      block(m, s.paint[s.paint.length - 1]![1], x0 + 0.05, x1 - 0.05, y + 0.5, y + 0.9, ...side(sd, hw - 0.015, hw + 0.015));
    }
    for (const xe of [x0, x1]) m.prism("frame", ngon(6, 0.03, 0, xe, 0), y + 0.06, y + 1.0);
  });
  m.scope("knifeboard", () => {
    block(m, "seatWood", x0 + 0.9, x1 - 0.9, y + 0.06, y + 0.45, -0.32, 0.32);
    block(m, "seatWood", x0 + 0.9, x1 - 0.9, y + 0.45, y + 0.95, -0.05, 0.05);
  });
  m.scope("stairs", () => {
    for (const e of [1, -1]) {
      const xe = e > 0 ? x1 : x0;
      for (let k = 0; k < 6; k++) {
        const yy = s.floor + 0.3 + ((y - s.floor - 0.3) * (k + 1)) / 7;
        const xx = xe - e * (0.05 + k * 0.08);
        block(m, "timber", Math.min(xx, xx - e * 0.12), Math.max(xx, xx - e * 0.12), yy - 0.04, yy, hw - 0.62, hw - 0.08);
      }
    }
  });
}

/**
 * The problems of a spec the kit cannot draw well: a door off the straight side
 * or over a truck's cut-out, a truck or the collector off the body, a section too
 * short for its ends. Empty for a good spec (test/worldTrams.test.ts).
 */
export function checkSpec(s: WorldTramSpec): string[] {
  const { X, secs } = layout(s);
  const out: string[] = [];
  const secOf = (x: number) => secs.find((sec) => x >= sec.x0 - 1e-6 && x <= sec.x1 + 1e-6);
  for (const sec of secs) {
    const [a, b] = straight(s, sec);
    if (b - a < 0.5) out.push(`section ${sec.i}: too short for its ends`);
  }
  for (const [u0, u1] of s.open ? [] : s.doors) {
    const [x0, x1] = [X(u1), X(u0)];
    const sec = secOf((x0 + x1) / 2);
    if (!sec) { out.push(`door ${u0}: in a joint`); continue; }
    const [a, b] = straight(s, sec);
    if (x0 < a - 1e-6 || x1 > b + 1e-6) out.push(`door ${u0}: off the straight side`);
    for (const t of s.trucks) {
      const c = t.wb / 2 + s.wheelRadius + 0.16;
      const x = X(t.at);
      if (2 * s.wheelRadius + 0.06 > s.floor && x1 > x - c && x0 < x + c) out.push(`door ${u0}: over the truck at ${t.at}`);
    }
  }
  for (const t of s.trucks) {
    const x = X(t.at);
    if (underJoint(t) ? !secs.slice(1).some((sec, i) => x < secs[i]!.x0 + 1e-6 && x > sec.x1 - 1e-6) : !secOf(x)) out.push(`truck ${t.at}: not under ${underJoint(t) ? "a joint" : "a section"}`);
  }
  if (s.collector.kind !== "none" && !secOf(X(s.collector.at))) out.push("collector: off the body");
  return out;
}

/** The volume of `vols` at Factory x. */
const saloonAt = (vols: Volume[], x: number): Volume | undefined => vols.find((v) => x >= v.plan[0]![0] - 1e-6 && x <= v.plan[v.plan.length - 1]![0] + 1e-6);

/** A section's bellows: the cross-section 8 cm inside the body, from above the skirt to under the eave. */
function bellowsProfile(s: WorldTramSpec): Array<[number, number]> {
  const hw = s.width / 2 - 0.08;
  const y0 = Math.max(s.floor + 0.1, 0.45);
  const y1 = s.eave - 0.02;
  return [[-hw, y0], [hw, y0], [hw, y1], [hw - 0.25, s.height - 0.08], [-hw + 0.25, s.height - 0.08], [-hw, y1]];
}

const HINGE_Y = 0.9;

/** Builds a world tram. */
export function worldTram(s: WorldTramSpec): MeshBuilder {
  const { L, X, secs } = layout(s);
  const t = new Tram(paletteOf(s), { c: 0, kx: -1, ky: 1, kz: 1, side: 0, end: 0 });
  const k: TramCtx = { t, m: t.m, s, L, X };
  if (s.open) return openCar(k, secs[0]!);
  if (secs.length === 1) {
    drawSection(k, secs[0]!, 1);
    return t.m;
  }
  const sections: TramSection[] = secs.map((sec) => ({ x0: sec.x0, x1: sec.x1, draw: () => drawSection(k, sec, secs.length) }));
  // the hinges: over a Jacobs bogie under a joint, else mid gap
  const hinges = secs.slice(1).map((sec, i) => {
    const mid = (secs[i]!.x0 + sec.x1) / 2;
    const j = s.trucks.find((tr) => underJoint(tr) && Math.abs(X(tr.at) - mid) < (s.gap ?? 0.5));
    return j ? X(j.at) : mid;
  });
  articulate(t, sections, HINGE_Y, { profile: bellowsProfile(s), folds: 3, depth: 0.04 }, s.maxBendDeg ?? 30, hinges);
  return t.m;
}

/**
 * An open cross-bench car: the underframe and floor, the dashes at the ends, the
 * roof on its posts, the benches across, the running boards; its trucks,
 * collector, lamps and extra as a closed car's. No doors to open.
 */
function openCar(k: TramCtx, sec: SectionLayout): MeshBuilder {
  const { t, m, s, X } = k;
  const hw = s.width / 2;
  const y0 = s.floor;
  const deck = y0 + 0.18;
  const benches = Math.max(4, Math.round((sec.x1 - sec.x0 - 1.6) / 0.9));
  m.scope("body", () => {
    m.scope("underframe", () => block(m, "underframe", sec.x0 + 0.1, sec.x1 - 0.1, y0, deck - 0.02, -hw + 0.12, hw - 0.12));
    m.scope("floor", () => block(m, s.paint[0]![1], sec.x0, sec.x1, deck - 0.02, deck + 0.04, -hw + 0.02, hw - 0.02));
    for (const e of [1, -1]) m.scope(e > 0 ? "front dash" : "rear dash", () => {
      const xe = e > 0 ? sec.x1 : sec.x0;
      block(m, s.paint[0]![1], Math.min(xe, xe - e * 0.08), Math.max(xe, xe - e * 0.08), deck + 0.04, deck + 1.05, -hw + 0.06, hw - 0.06);
    });
    m.scope("posts", () => {
      for (let q = 0; q <= benches; q++) {
        const x = sec.x0 + 0.8 + ((sec.x1 - sec.x0 - 1.6) * q) / benches;
        for (const sd of [-1, 1]) {
          m.prism("frame", ngon(10, 0.045, 0, x, sd * (hw - 0.08)), deck + 0.04, s.eave + 0.02);
          // the post's foot and its bracket under the roof
          m.prism("frame", ngon(10, 0.065, 0, x, sd * (hw - 0.08)), deck + 0.04, deck + 0.16);
          block(m, "frame", x - 0.14, x + 0.14, s.eave - 0.11, s.eave - 0.03, ...side(sd, hw - 0.115, hw - 0.045));
        }
      }
    });
    m.scope("curtain rails", () => {
      for (const sd of [-1, 1]) m.rod("steel", [sec.x0 + 0.62, s.eave - 0.2, sd * (hw - 0.02)], [sec.x1 - 0.62, s.eave - 0.2, sd * (hw - 0.02)], 0.018, 6);
    });
    m.scope("roof", () => {
      const r0 = s.height - s.eave;
      const r: Ring = [[-hw - 0.05, s.eave], [hw + 0.05, s.eave], [hw + 0.05, s.eave + 0.05], [hw * 0.9, s.eave + r0 * 0.5], [hw * 0.62, s.eave + r0 * 0.86], [0, s.height], [-hw * 0.62, s.eave + r0 * 0.86], [-hw * 0.9, s.eave + r0 * 0.5], [-hw - 0.05, s.eave + 0.05]];
      m.sweep("roof", "x", r, sec.x0 - 0.15, r, sec.x1 + 0.15);
      const band: Ring = [[-hw - 0.05, s.eave - 0.18], [hw + 0.05, s.eave - 0.18], [hw + 0.05, s.eave - 0.005], [-hw - 0.05, s.eave - 0.005]];
      m.sweep(s.paint[s.paint.length - 1]![1], "x", band, sec.x0 - 0.12, band, sec.x1 + 0.12);
    });
    m.scope("benches", () => {
      for (let q = 0; q < benches; q++) {
        const x = sec.x0 + 0.8 + ((sec.x1 - sec.x0 - 1.6) * (q + 0.5)) / benches;
        // the seat's three slats, the back's three, on cast-iron ends
        for (const d of [-0.18, -0.045, 0.09]) block(m, "seatWood", x + d, x + d + 0.11, deck + 0.42, deck + 0.47, -hw + 0.15, hw - 0.15);
        for (const h of [0.52, 0.66, 0.8]) block(m, "seatWood", x - 0.25, x - 0.2, deck + h, deck + h + 0.1, -hw + 0.15, hw - 0.15);
        for (const sd of [-1, 1]) {
          block(m, "frame", x - 0.15, x + 0.15, deck + 0.04, deck + 0.415, ...side(sd, hw - 0.3, hw - 0.24));
          block(m, "frame", x - 0.27, x - 0.18, deck + 0.475, deck + 0.92, ...side(sd, hw - 0.29, hw - 0.25));
          m.rod("frame", [x - 0.2, deck + 0.62, sd * (hw - 0.2)], [x + 0.17, deck + 0.62, sd * (hw - 0.2)], 0.02, 6);
        }
      }
    });
    m.scope("running boards", () => {
      for (const sd of [-1, 1]) {
        block(m, "timber", sec.x0 + 0.5, sec.x1 - 0.5, y0 - 0.12, y0 - 0.06, ...side(sd, hw - 0.05, hw + 0.22));
        for (const x of [sec.x0 + 0.7, (sec.x0 + sec.x1) / 2, sec.x1 - 0.7]) block(m, "underframe", x - 0.04, x + 0.04, y0 - 0.06, y0 + 0.02, ...side(sd, hw - 0.1, hw + 0.1));
      }
    });
    m.scope("truss rods", () => {
      for (const sd of [-1, 1]) {
        const z = sd * (hw - 0.22);
        const [a, b] = [sec.x0 + 0.4, sec.x1 - 0.4];
        m.rod("steel", [a, y0 + 0.08, z], [a + 1.2, y0 - 0.1, z], 0.02, 6);
        m.rod("steel", [a + 1.2, y0 - 0.1, z], [b - 1.2, y0 - 0.1, z], 0.02, 6);
        m.rod("steel", [b - 1.2, y0 - 0.1, z], [b, y0 + 0.08, z], 0.02, 6);
      }
    });
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => {
    const xe = e > 0 ? sec.x1 : sec.x0;
    m.scope("lamps", () => {
      const lamp = ngon(12, 0.08, 0, 0, deck + 0.75);
      m.sweep("underframe", "x", lamp, xe, lamp, xe + e * 0.06);
      const lens = ngon(12, 0.06, 0, 0, deck + 0.75);
      m.sweep(e > 0 ? "lampHead" : "lampRed", "x", lens, xe + e * 0.055, lens, xe + e * 0.075);
    });
    m.scope("coupler", () => t.coupler(e, xe - e * 0.5, xe + e * 0.2, Math.max(0.5, y0 + 0.1)));
    // the dash's moulding and the route board over it
    m.scope("dash trim", () => {
      const [a, b] = [Math.min(xe, xe + e * 0.03), Math.max(xe, xe + e * 0.03)];
      block(m, "frame", a, b, deck + 0.98, deck + 1.04, -hw + 0.08, hw - 0.08);
      block(m, "frame", a, b, deck + 0.3, deck + 0.35, -hw + 0.08, hw - 0.08);
      block(m, "display", Math.min(xe - e * 0.02, xe - e * 0.06), Math.max(xe - e * 0.02, xe - e * 0.06), s.eave - 0.16, s.eave - 0.02, -0.6, 0.6);
    });
    // the lifeguard: a slatted tray under the dash
    m.scope("lifeguard", () => {
      for (const d of [0.08, 0.22, 0.36]) {
        const x = xe - e * d;
        block(m, "underframe", x - 0.03, x + 0.03, 0.1, 0.16, -hw + 0.25, hw - 0.25);
      }
    });
  });
  m.scope("roof equipment", () => {
    const c = s.collector;
    if (c.kind === "pole") m.scope("trolley pole", () => trolleyPole(m, { ...s, height: s.height + 0.02 }, X(c.at), c.length ?? 5.0, sec.x0));
  });
  m.scope("running gear", () => s.trucks.forEach((tr, i) => m.scope(`${tr.kind} ${i + 1}`, () => truck(t, s, tr, X(tr.at), Math.max(y0, 2 * s.wheelRadius + 0.02)))));
  m.scope("extra", () => s.extra?.(k));
  return m;
}

// ---------------------------------------------------------------------------
// the distant model

/** Bands with the glass painted in the LOD glass, clipped to y0..y1. */
const glazed = (bs: ReadonlyArray<readonly [number, number, string]>, y0: number, y1: number): LodBand[] =>
  lodBands(bs.map(([a, b, mat]): LodBand => [a, b, mat === "glass" ? LOD_GLASS : mat]), y0, y1);

/**
 * A world tram from afar: each section one shell from the same volumes, its cab
 * ends shaped and painted in the cab bands (the windscreen in LOD glass), its
 * joint ends flat under the bellows; the side windows as bands; the trucks as
 * dark blocks; the raised collector; roof boxes as optional parts. An articulated
 * tram keeps the full rig's sections and joints.
 */
export function worldTramLod(s: WorldTramSpec, budget: number): MeshBuilder {
  const { X, secs } = layout(s);
  const shells: LodShell[] = [];
  const parts: LodPart[] = [];
  const n = secs.length;
  const main = bands(s, s.paint);
  // the cab's own paint (a lamp band, a screen frame) is too fine to see from afar: the body's stack
  const { cabPaint: _fine, ...plain } = s;
  const cab = cabBands(plain);
  const crowns: number[] = [];
  for (const sec of secs) {
    const { plan, top, bottom } = profiles(s, sec, X);
    const v: Volume = { name: "lod", section: sectionRing(s), plan, top, bottom, bands: main };
    const tab = volumeShell(v, { flat: { front: !sec.front, rear: !sec.rear } });
    crowns.push(tab.top);
    const [xa, xb] = straight(s, sec);
    const rects = (sd: number): LodRect[] => {
      if (s.open) return [];
      const doors = doorsOn(s, sd).map(([u0, u1]) => [X(u1), X(u0)] as [number, number]);
      const list = panes(xa, xb, doors, s.pitch).map(([a, b]) => ({ u: [a, b] as const, y: s.windows }));
      const up = s.upper && s.deck !== "open" ? panes(xa, xb, [], s.pitch).map(([a, b]) => ({ u: [a, b] as const, y: s.upper! })) : [];
      return [...windowBands(list, 0.35), ...windowBands(up, 0.35)].map((w) => ({ ...w, sides: [sd] }));
    };
    const cl = (e: number) => cabLength(endShape(s, e));
    shells.push({
      y0: tab.y0, hw: tab.hw, front: tab.front, rear: tab.rear,
      side: glazed(main, tab.y0, tab.top),
      end: glazed(cab, tab.y0, tab.top),
      ...(sec.front || sec.rear ? { cabs: [
        ...(sec.front ? [{ x0: sec.x1 - cl(1), x1: 1e3, side: glazed(cab, tab.y0, tab.top) }] : []),
        ...(sec.rear ? [{ x0: -1e3, x1: sec.x0 + cl(-1), side: glazed(cab, tab.y0, tab.top) }] : []),
      ] } : {}),
      roof: "roof",
      sideWindows: [...rects(1), ...rects(-1)],
      ends: [...(sec.rear ? [-1] : []), ...(sec.front ? [1] : [])],
      section: sec.i,
    });
  }
  const sectionOf = (x: number) => {
    const k = secs.findIndex((sec) => x >= sec.x0 - 0.05 && x <= sec.x1 + 0.05);
    if (k >= 0) return k;
    const d = secs.map((sec) => Math.min(Math.abs(x - sec.x0), Math.abs(x - sec.x1)));
    return d.indexOf(Math.min(...d));
  };
  const yTop = Math.max(s.floor, 2 * s.wheelRadius + 0.02);
  for (const tr of s.trucks) {
    const x = X(tr.at);
    const l = tr.wb / 2 + s.wheelRadius + 0.15;
    parts.push({
      section: sectionOf(x),
      ...(underJoint(tr) && n > 3 ? { optional: 5 } : {}),
      draw: (m) => m.scope("running gear", () => lodSideBox(m, "bogie", [[x - l + 0.25, 0.06], [x + l - 0.25, 0.06], [x + l, yTop], [x - l, yTop]], -Math.min(1.0, s.width / 2 - 0.06), Math.min(1.0, s.width / 2 - 0.06), false)),
    });
  }
  (s.roofBoxes ?? []).forEach(([u0, u1, half, h, mat]) => {
    const [a, b] = [X(u1), X(u0)];
    const k = sectionOf((a + b) / 2);
    parts.push({ section: k, optional: 10 + (b - a), draw: (m) => m.scope("roof equipment", () => lodRoofBox(m, mat, a, b, half, half - 0.05, crowns[k]! - 0.02, s.height + h)) });
  });
  const c = s.collector;
  if (c.kind !== "none") {
    const x = X(c.at);
    const k = sectionOf(x);
    const roof = Math.min(crowns[k]!, s.height);
    parts.push({
      section: k,
      draw: (m) => m.scope("raised collector", () => {
        if (c.kind === "diamond") lodDiamond(m, { x, roof: roof - (c.low ? LOW_SINK : 0), head: TRAM_COLLECTOR_TOP, ...(c.reach ? { reach: c.reach } : {}) });
        else if (c.kind === "single") lodPantograph(m, { x: x - 0.5, roofY: roof, baseY: roof + (c.low ? 0.06 : 0.2), h: 1, raised: true, raisedTop: TRAM_COLLECTOR_TOP, lower: c.low ? 0.7 : 1.45, upper: c.low ? 0.76 : 1.6, halfHead: 0.8 });
        else {
          const yb = s.height + 0.32;
          const len = Math.min(c.length ?? 5.0, poleReach(x, secs[k]!.x0));
          const a = Math.asin((TRAM_COLLECTOR_TOP - 0.06 - 0.035 * Math.cos(Math.PI / 6) - yb) / len);
          lodRod(m, "pole", [x, roof - 0.02, 0], [x - len * Math.cos(a), yb + len * Math.sin(a), 0], 0.06);
        }
      }),
    });
  }
  if (s.extraLod) parts.push({ section: 0, draw: (m) => m.scope("extra", () => s.extraLod!(m, { s, X })) });
  const sections: LodSections | undefined = n > 1 ? {
    pivots: secs.map((sec, i): Vec3 => {
      if (i === 0) return [0, 0, 0];
      const mid = (secs[i - 1]!.x0 + sec.x1) / 2;
      const j = s.trucks.find((tr) => underJoint(tr) && Math.abs(X(tr.at) - mid) < (s.gap ?? 0.5));
      return [j ? X(j.at) : mid, HINGE_Y, 0];
    }),
    joints: secs.slice(0, -1).map((sec, i) => ({ sections: [i, i + 1] as [number, number], front: sec.x0, rear: secs[i + 1]!.x1, profile: lodBellows(s) })),
    maxBendDeg: s.maxBendDeg ?? 30,
    material: "bellows",
  } : undefined;
  return fitLod({ palette: { ...COACH_PALETTE, ...TRAM_PALETTE, ...paletteOf(s) }, shells, parts, ...(sections ? { sections } : {}) }, budget);
}

/** The distant bellows: a box of four sides. */
function lodBellows(s: WorldTramSpec): Array<[number, number]> {
  const hw = s.width / 2 - 0.08;
  const y0 = Math.max(s.floor + 0.1, 0.45);
  return [[-hw, y0], [hw, y0], [hw, s.height - 0.1], [-hw, s.height - 0.1]];
}

/**
 * A tram's full-detail triangle budget (exterior; docs/models/world-trams.md
 * "Triangle budget"): 10,000 for a single body, and 5,000 more for each joint -
 * 15,000 with one joint, 20,000 with two.
 */
export function tramTriangleBudget(sections: number): number {
  return 10_000 + 5_000 * Math.max(0, sections - 1);
}

/** The distant model's budget (docs/models/lod.md): 100 a section, at most 500. */
export function tramLodBudget(s: WorldTramSpec): 100 | 200 | 300 | 500 {
  const n = s.sections.length;
  return n === 1 ? 100 : n === 2 ? 200 : n === 3 ? 300 : 500;
}

// ---------------------------------------------------------------------------
// the harness

/** The kit options a tram spec uses (worldFleet.ts). */
export function tramFeatures(s: WorldTramSpec, params: readonly string[]): string[] {
  const n = s.sections.length;
  const kinds = new Set(s.trucks.map((t) => t.kind));
  const floating = n > 1 && s.sections.some((_, i) => !s.trucks.some((t) => {
    const { X, secs } = layout(s);
    const x = X(t.at);
    return (x >= secs[i]!.x0 - 1e-6 && x <= secs[i]!.x1 + 1e-6) || (underJoint(t) && (Math.abs(x - secs[i]!.x0) < 0.6 || Math.abs(x - secs[i]!.x1) < 0.6));
  }));
  return [
    n === 1 ? "sections:1" : n === 2 ? "sections:2" : n === 3 ? "sections:3" : "sections:many",
    ...[...kinds].map((k) => `truck:${k}`),
    ...(floating ? ["floating-module"] : []),
    `front:${s.front}`,
    ...(s.rear && s.rear !== s.front ? [`rear:${s.rear}`] : []),
    s.doubleEnded ? "double-ended" : "single-ended",
    `roof:${s.roof}`,
    `doors:${s.doorKind}`,
    `collector:${s.collector.kind}${s.collector.kind !== "pole" && s.collector.kind !== "none" && s.collector.low ? "-low" : ""}`,
    s.floor < 0.3 ? "floor:low" : "floor:high",
    ...(s.upper || s.deck ? [`deck:${s.deck ?? "covered"}`] : []),
    ...(s.open ? ["open-sides"] : []),
    ...(s.clerestory ? ["clerestory"] : []),
    ...(s.trailer ? ["trailer"] : []),
    ...(s.skirted ? ["skirted"] : []),
    ...(s.roofBoxes?.length ? ["roof-boxes"] : []),
    ...(s.extraFeatures ?? []),
    ...params.map((p) => `param:${p}`),
  ];
}

export { sectionRing as tramSectionRing, layout as tramLayout };
