// The later Shinkansen series: N700S, E5 (and the H5's livery), 500, 700 (and
// the 923 Doctor Yellow), E6, 100 and the double-deck E4 Max. One spec per
// series - car lengths, the nose's tables, liveries, window rows, doors and
// which cars raise a pantograph - drawn by the passenger car builder
// (usTransit.ts drawCar) on the carbody kit; each design builds the end car (the
// default), an intermediate car or the articulated train of 3 - 8 cars. Narrowed
// from their real 3.35 - 3.38 m to the Shinkansen gauge's 3.3 m (loadingGauge.ts;
// the E6, a mini-shinkansen, keeps its 2.945 m). See docs/models/shinkansen.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import { bogieGeometry, exhaust } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownDisc, crownPane, sideDecal, sidePanel, surfaceDisc, type SliceBody } from "./sliceBody.ts";
import { decalX } from "./usHoodKit.ts";
import { CARBODY_PALETTE, faceLamps, type NoseShape } from "./carbodyKit.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { drawCar, type CarDef, type Flutes } from "./usTransit.ts";
import { diamond, insulator, singleArm } from "./czElectricKit.ts";
import type { LoadingGauge } from "./loadingGauge.ts";
import { DMU_CATALOG, EMU_CATALOG, enumParam } from "./emuParts.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { METRO_CATALOG } from "./metro.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, turnBody, type UnitBody } from "./lodUnits.ts";
import { carbody } from "./carbodyKit.ts";
import { bodyHalf, cabFaceLod, drawCabFace, edgeAt, type FacePaint, type SeriesCabFace } from "./seriesCab.ts";
import { RAIL_COLLECTOR_TOP } from "./collector.ts";

type Band = readonly [number, number, string];
export type ShinkansenUnit = "endCar" | "middleCar" | "powerCar" | "train";
export const SHINKANSEN_CARS = [3, 4, 5, 6, 7, 8];
const GAP = 0.25;
const COUPLER_Y = 1.0;

export interface ShinkansenLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** Side bands by height; the roof, the skirt and the nose's colour fields (d from the tip, up to a height). */
  bands: readonly Band[];
  roof: string;
  skirt: string;
  /** Number on the sides. */
  number: string;
  /** The door leaves' bands (default the side's). */
  doors?: readonly Band[];
  /** The cab front's bands, over the nose (default the side's). */
  front?: readonly Band[];
  /** How far behind the tip the front's bands reach (default the nose's length and 5 cm): a cab roof painted with the nose. */
  frontD?: number;
  /** The front's roof paint (default the livery's roof). */
  frontRoof?: string;
  /** The front's colour carried back over the cab roof along a slanted edge, drawn over the bands in `frontRoof` paint: from d[0] (the front's `frontD`) at height y up to d[1] at the shoulder and d[2] at the crown. */
  capSlope?: { y: number; d: readonly [number, number, number] };
  /** The end car's own markings on both sides (d from the body's front, foot, height): a power car's emblem and name. */
  endLettering?: ReadonlyArray<{ text: string; d: number; y: number; h: number; mat: string }>;
  /** The end car's own side bands (default the livery's): a power car painted apart from its coaches. */
  endBands?: readonly Band[];
  /**
   * Sweeps of paint on both sides of the end car, between the belly and the shoulder: each fills
   * the side between a front and a back edge, [y, d] by height (d behind the nose's or cab face's
   * tip, ascending y), later sweeps over earlier ones; a cab face paints them on its cab sides too.
   */
  endSweeps?: ReadonlyArray<{ mat: string; front: readonly Pt[]; back: readonly Pt[]; top?: number; face?: boolean }>;
  /** Polygons painted on a cab face ([lat, y] seen head-on, under the face's own fields): a canopy painted round its windscreen. */
  faceFields?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  /** A flag of paint beside every door, on the side toward the car's middle: its width, gap from the door, heights and paint (SBB's red door marks). */
  doorFlags?: { w: number; gap: number; y: readonly [number, number]; mat: string };
  /** Paint over each door's span above its head on every car, bands [y0, y1, mat]: a door's colour carried up the side. */
  overDoors?: readonly Band[];
  /**
   * Paint along the end car's roof edges, from the shoulder up to height y on the roof's arc: from
   * d[0] behind the tip back to d[1] at the shoulder and d[2] at y (a slanted rear end); both sides.
   */
  endRoofEdge?: { mat: string; y: number; d: readonly [number, number, number] };
}

/** A fitting on a car's sides, both sides (d span behind the car's front, the end car's from its tip; sill and head). */
export interface SeriesSidePanel {
  d: readonly [number, number];
  y: readonly [number, number];
  /** A seam (a service door's outline in thin dark lines), a framed window, louvres pressed in the side's paint, or a framed panel. */
  kind: "seam" | "window" | "louvres" | "panel";
  /** A panel's paint and the screen inset in it (a display), or the louvres' count. */
  mat?: string;
  screen?: string;
  louvres?: number;
}

export interface ShinkansenSeries {
  /** Lengths over the couplers: the end car's (nose to its inner coupling plane) and an intermediate car's. */
  endLength: number;
  midLength: number;
  /** Half width, belly, shoulder and crown; the side's lean; the skirt's bottom and top. */
  W: number;
  Y: number;
  S: number;
  C: number;
  lean: number;
  B: number;
  A: number;
  nose: NoseShape;
  /** The windscreen on the nose: d span and half widths. */
  windscreen: readonly [number, number, number, number];
  /** A black band round the windscreen, on the nose under its rubber: how far it reaches past the panes (d and half width), joined over the centre pillar. */
  windscreenMask?: number;
  /** The headlights on the nose's sides: d and height. */
  lamps: readonly [number, number];
  /** Twin headlights side by side on the crown at d, at two half widths, in one black surround reaching `surround` past them (in place of `lamps`). */
  lampPair?: { d: number; z: readonly [number, number]; r: number; surround: number };
  /** A black grille across the nose's front on the crown: its d span and half width. */
  noseGrille?: { d: readonly [number, number]; z: number };
  /** Window rows: sill and head of each (two on a double-deck car), the window's width and pitch. */
  windows: ReadonlyArray<readonly [number, number]>;
  windowW: number;
  pitch: number;
  /** Doors: sill, head, the leaf's window; their width. */
  door: readonly [number, number, number, number];
  doorW: number;
  /** The door leaf's window: its width, centred (default the leaf's width less 0.24 m). */
  doorGlassW?: number;
  /** The upper window rows run on over the doors, from the first door to the car's end (a double-deck car's upper deck). */
  upperOverDoors?: boolean;
  /** The door's two leaves, each with a narrow window (`doorGlassW` wide) this far apart, centre to centre. */
  doorGlassPair?: number;
  bogieCentres: number;
  wheelR: number;
  wheelbase: number;
  liveries: Record<string, ShinkansenLivery>;
  /** Per car, for the game: weight (t), power (kW) of a motor car, the top speed, seats. */
  weight: { end: number; middle: number };
  /** A commuter car's doors: this many a side, evenly along the car, windows between them (default: one at each end). */
  doorCount?: number;
  /** The pantograph: a single arm (default) or a diamond. */
  pantograph?: "single" | "diamond";
  /** The pantograph's centre, d behind the car's front (an end car's tip), in place of 1.5 m ahead of the rear bogie. */
  pantographD?: number;
  /** A streamlined cover on the roof round the pantograph's base, the arm standing on its top: its length and half width at the roof and at its top, its height and paint (the N700S's). */
  pantographCover?: { len: number; hw: number; top: readonly [number, number]; h: number; mat: string };
  /** With `endPantograph` true: the rear end car's pantograph folded down, only the leading one raised. */
  trailingLowered?: boolean;
  /** Fittings on the sides of the end car and of an intermediate car: service doors, grilles, displays. */
  sidePanels?: { end?: readonly SeriesSidePanel[]; middle?: readonly SeriesSidePanel[] };
  /** One pantograph only, on the second car (default two from four cars up). */
  onePantograph?: boolean;
  /** Jacobs bogies: the cars' inner ends share one bogie centred on each joint (the end car's leading bogie at `endBogies[0]`, else bogieCentres ahead of the joint); a lone car stands on its joint bogies, half beyond its body (the FLIRT; `jacobsInset` the Giruno's). */
  jacobs?: boolean;
  /** A flat cab front in place of the nose: its windscreen panes (z0, z1, y0, y1), lamps (z, y, r, lens) and the front's mask. */
  flatCab?: NonNullable<CarDef["cab"]>;
  /** An upright cab on the nose's flat front face (its tip): the panes and lamps drawn there, in place of the windscreen and headlights on the crown, and a gangway door's outline (half width, sill and head). */
  noseCab?: NonNullable<CarDef["cab"]> & { gangway?: readonly [number, number, number] };
  /** The cab's side windows on the end car (d span behind the body's front end, sill and head), both sides or only on side +1 (+Z) or -1. */
  cabWindows?: ReadonlyArray<readonly [number, number, number, number] | readonly [number, number, number, number, number]>;
  /** A cab face drawn as one painted surface (seriesCab.ts) in place of the nose: the body ends square `dJoin` behind its tip (both ends of a `single` railcar). */
  cabFace?: SeriesCabFace;
  power: number;
  maxspeed: number;
  /** A diesel unit: no pantograph, exhaust stacks on the roof, filed with the DMUs (default electric); `none` an unpowered set of coaches. */
  traction?: "electric" | "diesel" | "none";
  /** The train lengths offered (default 3 - 8; 4 the default when offered, else the shortest). */
  cars?: readonly number[];
  /** One double-ended railcar, a cab or nose at both ends: no car or train choice. */
  single?: boolean;
  /** The end cars raise the pantographs (a short unit without intermediate motor cars); `lead` only the leading one (a locomotive and its driving trailer), `trail` only the rear one (a power-car train feeding both from one collector). */
  endPantograph?: boolean | "lead" | "trail";
  /** The end car's bogies (d behind the nose tip) where they do not follow the coaches' rule: a locomotive's, centred under its body. */
  endBogies?: readonly [number, number];
  /** An intermediate car's bogies (d behind its +X end) where they do not follow the rule: a low-floor car's, near both ends. */
  midBogies?: readonly [number, number];
  /** Where the raised pantograph stands, d behind the body's +X end of the car raising it (default 1.5 m ahead of its rear bogie); an end car's measured on its body, not from its tip as `pantographD` is. */
  pantographAt?: number;
  /** A locomotive end car's sides: its windows (d spans, on the first window row) and doors in place of the passenger layout. */
  endSides?: { windows: ReadonlyArray<readonly [number, number]>; doors: ReadonlyArray<readonly [number, number]> };
  /** Headlights on the nose's front face (z, y, radius, lens) in place of the side lamps: a blunt nose. */
  faceLamps?: ReadonlyArray<readonly [number, number, number, string]>;
  /** A grille on the nose's front face between the face lamps: its half width, bottom and top, and its slats. */
  faceGrille?: { z: number; y: readonly [number, number]; slats: number };
  /** A locomotive end car's side grilles (d0, d1, y0, y1, vertical slats): a power car's radiator and air intakes. */
  endGrilles?: ReadonlyArray<readonly [number, number, number, number, number] | readonly [number, number, number, number, number, "h"]>;
  /** Ribs on every car's sides (the kit car's fluting), skipping the windows and doors: a stainless body. */
  fluting?: readonly Flutes[];
  /** Ribs along the roof: either side of the crown out to |z| = zMax, one every `pitch`. */
  roofRibs?: { pitch: number; zMax: number; mat: string };
  /** A warning panel on the nose: painted up to d behind the tip, between two heights. */
  cabPanel?: { d: number; y: readonly [number, number]; colour: string };
  /** A metro or tube train fed from a conductor rail: no pantograph, filed with the metros. */
  metro?: boolean;
  /** The coupler at a cab end: the unit's centre coupler (default) or buffers and a screw coupling. */
  endCoupler?: "centre" | "buffers";
  /** The roof arc's segments (default 8). */
  arc?: number;
  /** The centre coupler's height (default 1.0 m; a tube car's sits under its low floor). */
  couplerY?: number;
  /** A flat cab's plan and dome: a short nose the cab's decals stand on (default a square end). */
  cabNose?: NoseShape;
  /**
   * The set rides on Jacobs bogies: in the train one bogie under each joint carries both cars; a lone
   * car stands on its own bogie this far inside each inner end (an end car's leading bogie as the rule
   * or `endBogies` places it); in the train the skirt is cut open at the inner ends over the joints
   * (the Giruno; `jacobs` is the FLIRT's set, whose lone car stands on its joint bogies instead).
   */
  jacobsInset?: number;
  /** Both bogies of every car centred on its body, bogieCentres apart (default 3.5 m in from the rear, the other ahead of it). */
  centredBogies?: boolean;
  /** The doors and windows of the end and the middle car (d from the body's +X end), in place of the generated layout. */
  layout?: { end: SeriesLayout; middle: SeriesLayout };
  /** The side number: d behind the body's centre, its foot and height (default 3 m from the rear, just above the belly). */
  numberAt?: readonly [number, number, number];
  /** A block on the end car's roof in the distant model (d span behind the tip, half width, heights, paint): a cab turret's silhouette. */
  lodRoof?: { d: readonly [number, number]; hw: number; y: readonly [number, number]; mat: string };
  /** A power car of its own among the intermediate cars (the unit value `powerCar`): the train's only pantograph car. */
  powerCar?: SeriesPowerCar;
  /** Fittings of the series' own, drawn in place of the plain underfloor box. */
  fittings?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }) => void;
}

/**
 * A machine car among the intermediate cars (the RAe TEE II's): its own length, bogies and layout, its
 * pantographs on the roof (d behind the body's +X end; one raised, the others folded, a folded one's
 * base `lift` higher where two interlace), the louvres along its roof's edges and where it stands in a train.
 */
export interface SeriesPowerCar {
  length: number;
  bogieCentres: number;
  wheelR: number;
  /** The axles' offsets from the bogie's centre. */
  axles: readonly number[];
  /** The window row's sill and head. */
  windows: readonly [number, number];
  layout: SeriesLayout;
  pantographs: ReadonlyArray<{ d: number; raised?: boolean; lift?: number }>;
  /** Louvres on both edges of the roof: d span, half widths on the roof's arc and how many panels side by side. */
  louvres?: ReadonlyArray<readonly [number, number, number, number, number]>;
  /** Its index in a train of n cars. */
  slot: (n: number) => number;
  weight: number;
  power: number;
}

/** A car's own layout: door leaves (d0, d1 and the way each slides, +1 toward the rear) and window spans. */
export interface SeriesLayout {
  doors: ReadonlyArray<readonly [number, number, number]>;
  windows: ReadonlyArray<readonly [number, number]>;
  /** Each window row's own spans (by the series' `windows` index), in place of `windows` for that row. */
  rows?: ReadonlyArray<ReadonlyArray<readonly [number, number]> | undefined>;
}

/** The coupling plane's distance beyond a buffered cab end. */
const BUFFER_GAP = 0.65;
const isDiesel = (s: ShinkansenSeries) => s.traction === "diesel";
const couplerOf = (s: ShinkansenSeries) => s.couplerY ?? COUPLER_Y;
/** No pantograph: a diesel unit or an unpowered set. */
const unwired = (s: ShinkansenSeries) => s.traction === "diesel" || s.traction === "none" || s.metro === true;
/** The train lengths a series offers, and its default. */
export const carsOf = (s: ShinkansenSeries): readonly number[] => s.cars ?? SHINKANSEN_CARS;
const defaultCars = (s: ShinkansenSeries) => (carsOf(s).includes(4) ? 4 : carsOf(s)[0]!);

// ---------------------------------------------------------------------------
// Building a series

/** The body's +X end behind the car's front: the nose tip at it, a flat cab's lamps 7 cm proud of the wall, an inner wall a coupling gap behind. */
const frontGap = (s: ShinkansenSeries, end: boolean) => (end ? (s.cabFace ? s.cabFace.dJoin : 0) + (s.endCoupler === "buffers" ? BUFFER_GAP : s.cabFace ? s.cabFace.reach ?? 0.07 : s.flatCab || s.noseCab ? 0.07 : 0) : GAP);
const endBody = (s: ShinkansenSeries) => s.endLength - (s.single ? frontGap(s, true) : GAP) - frontGap(s, true);
const midBody = (s: ShinkansenSeries) => s.midLength - 2 * GAP;

/** Bogie positions (d) of a car: 2.5 m in from each body end, the end car's leading one behind the nose. */
function bogies(s: ShinkansenSeries, end: boolean, power?: SeriesPowerCar): [number, number] {
  if (power) { const L = power.length - 2 * GAP; return [L / 2 - power.bogieCentres / 2, L / 2 + power.bogieCentres / 2]; }
  const L = end ? endBody(s) : midBody(s);
  // under the joints: GAP beyond each inner body end
  if (s.jacobs) return end ? [s.endBogies?.[0] ?? L + GAP - s.bogieCentres, L + GAP] : [-GAP, L + GAP];
  if (end && s.endBogies) return [s.endBogies[0], s.endBogies[1]];
  if (!end && s.midBogies) return [s.midBogies[0], s.midBogies[1]];
  if (s.jacobsInset !== undefined && !end) return [s.jacobsInset, L - s.jacobsInset];
  if (s.single || s.centredBogies) return [L / 2 - s.bogieCentres / 2, L / 2 + s.bogieCentres / 2];
  const back = s.jacobsInset !== undefined ? L - s.jacobsInset : L - 3.5;
  // a short car's leading bogie comes in so that its wheels stay under the body
  return [Math.max(back - s.bogieCentres, s.wheelbase / 2 + s.wheelR + 0.2), back];
}

function carDef(s: ShinkansenSeries, l: ShinkansenLivery, end: boolean, pantograph: boolean | "lowered", number: string, joint = false, power?: SeriesPowerCar): CarDef {
  // the centre coupler's draft gear ends 0.3 m below its centre: a skirt bottom there would lie on it
  if (Math.abs(s.B - (couplerOf(s) - 0.3)) < 0.005) throw new Error(`series: skirt bottom ${s.B} m lies on the coupler's draft gear`);
  // the bogie's brake cylinders stand 0.55 m inside its axles: a shorter wheelbase puts them on its transoms (0 is a single axle)
  if (s.wheelbase > 0 && s.wheelbase < 2.05) throw new Error(`series: wheelbase ${s.wheelbase} m is shorter than the bogie kit's 2.05 m`);
  // the bogie's end transoms reach down to 0.2 m above the wheel radius: the car's underside must not lie there
  if (Math.abs(s.B - (s.wheelR + 0.2)) < 0.005) throw new Error(`series: skirt bottom ${s.B} m lies on the bogies' transoms`);
  const L = power ? power.length - 2 * GAP : end ? endBody(s) : midBody(s);
  const tr = bogies(s, end, power);
  const first = end ? (s.cabFace ? (s.cabFace.first ?? 2.4) - s.cabFace.dJoin : s.flatCab ? 2.2 : Math.max(s.nose.len, s.windscreen[1]) + 1.6) : 2.0;
  const last = s.single ? L - first + 1.0 : L - 1.4;
  let doors: Array<[number, number]> = end ? [[first - 1.0, first - 1.0 + s.doorW], [last - s.doorW, last]] : [[0.6, 0.6 + s.doorW], [L - 0.6 - s.doorW, L - 0.6]];
  const row = (from: number, to: number): Array<[number, number]> => {
    const n = Math.max(1, Math.floor((to - from) / s.pitch));
    return Array.from({ length: n }, (_, i): [number, number] => {
      const d = from + (to - from) * ((i + 0.5) / n);
      return [d - s.windowW / 2, d + s.windowW / 2];
    });
  };
  let spans = row(end ? first + 0.4 : 0.6 + s.doorW + 0.8, last - s.doorW - 0.8);
  if (s.doorCount) {
    // a commuter car: doors evenly along it, windows in the piers between them
    const [a, b] = [end ? first - 0.6 : 0.4, s.single ? L - first + 0.6 : L - 0.4];
    const k = s.doorCount;
    doors = Array.from({ length: k }, (_, i): [number, number] => { const c = a + ((b - a) * (i + 0.5)) / k; return [c - s.doorW / 2, c + s.doorW / 2]; });
    const edges = [end ? first - 0.4 : 0.6, ...doors.flatMap(([p, q]) => [p, q]), s.single ? L - first + 0.4 : L - 0.6];
    spans = [];
    for (let i = 0; i + 1 < edges.length; i += 2) if (edges[i + 1]! - edges[i]! > s.windowW + 0.4) spans.push(...row(edges[i]! + 0.2, edges[i + 1]! - 0.2));
  }
  const own = power ? power.layout : s.layout?.[end ? "end" : "middle"];
  if (own) {
    doors = own.doors.map(([a, e]): [number, number] => [a, e]);
    spans = own.windows.map(([a, e]): [number, number] => [a, e]);
  }
  if (end && s.endSides) {
    spans = s.endSides.windows.map(([a, e]) => [a, e]);
    doors = s.endSides.doors.map(([a, e]) => [a, e]);
  }
  const axles = power ? power.axles : s.wheelbase > 0 ? [-s.wheelbase / 2, s.wheelbase / 2] : [0];
  const wheelR = power ? power.wheelR : s.wheelR;
  const reach = power ? Math.max(...axles.map(Math.abs)) + wheelR + 0.25 : s.wheelbase / 2 + s.wheelR + 0.25;
  return {
    spec: {
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: s.lean, arc: s.arc ?? 8, B: s.B, wl: s.W * 0.9, A: s.A, wa: s.W * 0.97,
      ...(end && !s.flatCab && !s.cabFace ? { front: s.nose, ...(s.single ? { rear: s.nose } : {}) } : {}),
      ...(end && s.flatCab && s.cabNose ? { front: s.cabNose, ...(s.single ? { rear: s.cabNose } : {}) } : {}), cuts: jacobsCuts(s, end, L, tr, reach, joint), edges: [], step: 1.0, noseStep: 0.25,
    },
    bands: (end && l.endBands) || l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    ...(end && s.cabPanel ? { field: { d: s.cabPanel.d, y: s.cabPanel.y, mat: "cabPanel" } } : {}),
    windows: power ? [{ y: power.windows, spans, frame: "rubber" }] : s.windows.map((y, r) => ({ y, spans: own?.rows?.[r] ? own.rows[r]!.map(([a, e]): [number, number] => [a, e]) : end && s.endSides && r > 0 ? [] : r > 0 && s.upperOverDoors ? row(end ? doors[0]![0] : 0.6, s.single ? L - doors[0]![0] : L - 0.6) : spans, frame: "rubber" })),
    ...(s.fluting ? { fluting: s.fluting } : {}),
    doors: { spans: doors, y: [s.door[0], s.door[1]], glass: [s.door[2], s.door[3]], ...(s.doorGlassW ? { glassW: s.doorGlassW } : {}), ...(s.doorGlassPair ? { glassPair: s.doorGlassPair } : {}), ...(own && !(end && s.endSides) ? { slides: own.doors.map((o) => o[2]) } : {}) },
    ...(l.doors ? { doorBands: l.doors } : {}), ...(end && l.front && !s.flatCab ? { front: { d: l.frontD ?? s.nose.len + 0.05, bands: l.front, ...(l.frontRoof ? { roof: l.frontRoof } : {}) } } : {}),
    // a cab face draws its own panes and lamps: an empty cab keeps the gangway frame off its end
    ...(s.flatCab ? { cab: s.flatCab } : end && s.noseCab ? { cab: s.noseCab } : end && s.cabFace ? { cab: { panes: [], lamps: [] } } : {}), cabEnds: end && (s.flatCab || s.noseCab || s.cabFace) ? (s.single ? [1, -1] : [1]) : [], diaphragm: [s.door[0], s.door[1] + 0.3],
    trucks: tr, truck: {
      axles, wheelR, frameHalf: power ? reach - 0.1 : s.wheelbase > 0 ? s.wheelbase / 2 + s.wheelR + 0.15 : s.wheelR + 0.45,
      // a single axle's horn guides reach up into the body over the skirt's cut (no gap under it), on leaf springs
      frameTop: s.wheelbase > 0 ? wheelR + 0.4 : s.A + 0.03, frameBottom: wheelR + 0.08,
      frameZ: [0.92, 1.04], primary: s.wheelbase > 0 ? "coil" : "leaf", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: s.B,
    },
    coupler: s.endCoupler === "buffers" ? "buffers" : "centre", couplerY: couplerOf(s),
    gap: [end ? frontGap(s, true) : GAP, s.single ? frontGap(s, true) : GAP],
    // a Jacobs bogie's skirt cut reaches in from the joint: the cabin stops short of it
    ...(s.jacobs ? { cabin: [end ? first - 1.2 : reach - GAP + 0.05, L - (reach - GAP) - 0.05] as const } : end ? { cabin: [first - 1.2, s.single ? L - first + 1.2 : L] as const } : {}),
    lettering: [s.numberAt ? { text: number, d: L / 2 + s.numberAt[0], y: s.numberAt[1], h: s.numberAt[2], mat: "lettering" } : { text: number, d: L - 3.0, y: s.Y + 0.1, h: 0.1, mat: "lettering" }, ...(end ? (l.endLettering ?? []) : [])],
    extras: (m, b, X) => {
      if (end && s.cabFace) {
        const f = s.cabFace, half = bodyHalf(b, 0), fp = facePaint(s, l, number);
        m.scope("cab face", () => drawCabFace(m, f, 1, X(-f.dJoin), half, fp));
        if (s.single) m.scope("rear cab face", () => drawCabFace(m, f, -1, -X(L + f.dJoin), half, fp));
      } else if (end && !s.flatCab) noseFittings(m, s, b, X);
      if (end && l.capSlope && l.frontRoof) m.scope("cab roof", () => capSlope(m, b, X, l.capSlope!, l.frontRoof!));
      if (l.overDoors) m.scope("over doors", () => {
        for (const sd of [1, -1]) for (const [d0, d1] of doors) for (const [y0, y1, mat] of l.overDoors!) sidePanel(m, b, X, sd, mat, d0, d1, y0, y1, 0.004, 0.003);
      });
      if (end && l.endSweeps) m.scope("sweeps", () => l.endSweeps!.forEach((w, i) => m.scope(`sweep ${i + 1}`, () => endSweep(m, b, X, w, s.cabFace?.dJoin ?? 0, 0.003 + 0.0015 * i))));
      if (l.doorFlags) m.scope("door flags", () => {
        const f = l.doorFlags!;
        for (const [d0, d1] of doors) {
          // toward the car's middle
          const [a, e] = (d0 + d1) / 2 < L / 2 ? [d1 + f.gap, d1 + f.gap + f.w] : [d0 - f.gap - f.w, d0 - f.gap];
          const tris: Pt[] = [[a, f.y[0]], [e, f.y[0]], [e, f.y[1]], [a, f.y[0]], [e, f.y[1]], [a, f.y[1]]];
          for (const sd of [1, -1]) sideDecal(m, b, X, sd, f.mat, tris, 0.004);
        }
      });
      if (end && s.cabWindows) m.scope("cab windows", () => {
        // a single railcar's rear cab too, mirrored
        const spans = s.cabWindows!.flatMap(([d0, d1, y0, y1, side]) => [[d0, d1, y0, y1, side], ...(s.single ? [[L - d1, L - d0, y0, y1, side]] : [])]);
        for (const sd of [1, -1]) for (const [d0, d1, y0, y1, side] of spans) {
          if (side !== undefined && side !== sd) continue;
          sidePanel(m, b, X, sd, "rubber", d0!, d1!, y0!, y1!, 0.007, 0.03);
          sidePanel(m, b, X, sd, "glass", d0! + 0.04, d1! - 0.04, y0! + 0.04, y1! - 0.04, 0.012, 0.004);
        }
      });
      if (end && s.endGrilles) m.scope("grilles", () => {
        for (const sd of [1, -1]) for (const [d0, d1, y0, y1, n, dir] of s.endGrilles!) {
          // vertical slats on black, or horizontal louvres ("h") pressed in the side's own paint
          sidePanel(m, b, X, sd, dir === "h" ? l.bands.find(([, top]) => top > y0)![2] : "black", d0, d1, y0, y1, 0.006, 0.03);
          for (let i = 1; i < n; i++) {
            if (dir === "h") {
              const y = y0 + ((y1 - y0) * i) / n;
              sidePanel(m, b, X, sd, "black", d0 + 0.03, d1 - 0.03, y - 0.01, y + 0.01, 0.014, 0.008);
            } else {
              const d = d0 + ((d1 - d0) * i) / n;
              sidePanel(m, b, X, sd, "rubber", d - 0.012, d + 0.012, y0 + 0.03, y1 - 0.03, 0.014, 0.008);
            }
          }
        }
      });
      if (s.single && !s.flatCab && !s.cabFace) m.scope("rear nose", () => m.turned((X(0) + X(L)) / 2, () => noseFittings(m, s, b, X)));
      if (s.roofRibs) m.scope("roof ribs", () => {
        const r = s.roofRibs!;
        for (const sd of [1, -1])
          for (let z = r.pitch / 2; z + 0.025 <= r.zMax; z += r.pitch) crownPane(m, b, X, sd, r.mat, [0.3, L - 0.3], [z, z + 0.025], 0.004);
      });
      if (isDiesel(s))
        m.scope("exhaust", () => exhaust(m, X(L / 2), 0, s.C - 0.05, s.C + 0.1, 0.14, 0.14));
      if (end && l.endRoofEdge) m.scope("roof edge", () => roofEdge(m, b, X, l.endRoofEdge!, s.cabFace?.dJoin ?? 0));
      const panels = s.sidePanels?.[end ? "end" : "middle"];
      if (panels) m.scope("side panels", () => sidePanels(m, b, X, l, panels, end ? (s.cabFace?.dJoin ?? 0) : 0));
      if (power) {
        m.scope("pantographs", () => power.pantographs.forEach((pg, i) => m.scope(`pantograph ${i + 1}`, () => {
          const x = X(pg.d), base = s.C + 0.35 + (pg.lift ?? 0);
          block(m, l.roof, x - 0.9, x + 0.9, s.C - 0.06, s.C + 0.05 + (pg.lift ?? 0), -0.8, 0.8);
          diamond(m, { xc: x, roofY: s.C + 0.05 + (pg.lift ?? 0), baseY: base, raised: pg.raised === true });
        })));
        // the roof line between the two pairs, on its insulators
        const ds = power.pantographs.map((pg) => pg.d), [a, e] = [Math.min(...ds) + 1.0, Math.max(...ds) - 1.0];
        if (e > a + 1) m.scope("roof line", () => {
          block(m, "pantograph", Math.min(X(a), X(e)), Math.max(X(a), X(e)), s.C + 0.22, s.C + 0.26, 0.2, 0.24);
          for (let k = 0, n = Math.max(2, Math.round((e - a) / 2.5)); k <= n; k++) insulator(m, X(a + ((e - a) * k) / n), 0.22, s.C - 0.04, s.C + 0.22);
        });
        if (power.louvres) m.scope("louvres", () => {
          for (const sd of [1, -1]) for (const [d0, d1, z0, z1, n] of power.louvres!) {
            const w = (d1 - d0) / n;
            for (let i = 0; i < n; i++) crownPane(m, b, X, sd, "black", [d0 + i * w + 0.04, d0 + (i + 1) * w - 0.04], [z0, z1], 0.006);
          }
        });
      } else if (pantograph) m.scope("pantograph", () => {
        const x = X(pantographAt(s, end, tr));
        const raised = pantograph !== "lowered";
        const cv = s.pantographCover;
        if (cv) {
          m.scope("cover", () => pantographCover(m, x, s.C, cv));
          singleArm(m, { xc: x, roofY: s.C + cv.h, baseY: s.C + cv.h + 0.2, h: 1, raised });
        } else {
          block(m, l.roof, x - 1.6, x + 1.6, s.C - 0.06, s.C + 0.05, -0.85, 0.85);
          if (s.pantograph === "diamond") diamond(m, { xc: x, roofY: s.C + 0.05, baseY: s.C + 0.35, raised });
          else singleArm(m, { xc: x, roofY: s.C + 0.05, baseY: s.C + 0.3, h: 1, raised });
        }
      });
      if (s.fittings) s.fittings(m, b, X, { end, length: L, trucks: tr });
      else m.scope("underfloor", () => block(m, "under", X(tr[1] - 2.6), X(tr[0] + 2.6), s.B - 0.35, s.B, -s.W * 0.8, s.W * 0.8));
    },
  };
}

/** A pantograph's streamlined cover: a frustum from a rounded rectangle sunk in the roof to a smaller one at its top. */
function pantographCover(m: MeshBuilder, x: number, C: number, cv: NonNullable<ShinkansenSeries["pantographCover"]>): void {
  const ring = (len: number, hw: number): Array<[number, number]> => {
    const r = Math.min(hw * 0.9, len / 2 - 0.01), k = 4, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[len / 2 - r, -(hw - r), -90], [len / 2 - r, hw - r, 0], [-(len / 2 - r), hw - r, 90], [-(len / 2 - r), -(hw - r), 180]] as const)
      for (let j = 0; j <= k; j++) { const a = ((a0 + (90 * j) / k) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    // counter-clockwise seen from above (+y) is a negative shoelace area in (x, z)
    return out.reverse();
  };
  m.loft(cv.mat, ring(cv.len, cv.hw), C - 0.08, ring(cv.top[0], cv.top[1]), C + cv.h);
}

/** The skirt's cuts round a car's bogies; a Jacobs set's car in the train open at its inner ends over the joints' bogies (`joint`). */
function jacobsCuts(s: ShinkansenSeries, end: boolean, L: number, tr: readonly number[], reach: number, joint: boolean): Array<readonly [number, number]> {
  if (s.jacobsInset === undefined || !joint) return tr.map((d) => [d - reach, d + reach] as const);
  return [end ? [tr[0]! - reach, tr[0]! + reach] : [-0.01, reach - GAP], [L + GAP - reach, L + 0.01]];
}

/** The paint a cab face takes from a livery. */
function facePaint(s: ShinkansenSeries, l: ShinkansenLivery, number: string): FacePaint {
  const face = s.cabFace?.bands?.(l) ?? l.front ?? l.bands;
  return { sides: l.bands, face, roof: l.roof, skirt: l.skirt, S: s.S, A: s.A, number, ...(l.endSweeps ? { sweeps: l.endSweeps } : {}), ...(l.faceFields ? { fields: l.faceFields } : {}) };
}

/** A sweep of paint on both sides between its front and back edges, in strips 0.1 m tall, clamped to the belly and the shoulder. */
function endSweep(m: MeshBuilder, b: SliceBody, X: (d: number) => number, w: NonNullable<ShinkansenLivery["endSweeps"]>[number], dTip: number, proud: number): void {
  const lo = Math.max(w.front[0]![0], w.back[0]![0], b.Y(0) + 0.005);
  const hi = Math.min(w.front[w.front.length - 1]![0], w.back[w.back.length - 1]![0], b.S(0) - 0.005);
  const n = Math.max(1, Math.ceil((hi - lo) / 0.1));
  const tris: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const [ya, yb] = [lo + ((hi - lo) * i) / n, lo + ((hi - lo) * (i + 1)) / n];
    // on the body only: from its front end (a cab face's join) back
    const [fa, fb, ba, bb] = [Math.max(-0.03, edgeAt(w.front, ya) - dTip), Math.max(-0.03, edgeAt(w.front, yb) - dTip), edgeAt(w.back, ya) - dTip, edgeAt(w.back, yb) - dTip];
    if (ba - fa < 0.005 && bb - fb < 0.005) continue;
    if (ba - fa >= 0.005) tris.push([fa, ya], [ba, ya], [bb, yb]);
    if (bb - fb >= 0.005) tris.push([fa, ya], [bb, yb], [fb, yb]);
  }
  for (const sd of [1, -1]) sideDecal(m, b, X, sd, w.mat, tris, proud);
}

/** The pantograph's centre on a car (d behind the body's front): the series' own place (`pantographAt` on the car's body, `pantographD` from an end car's tip), else 1.5 m ahead of the rear bogie. */
function pantographAt(s: ShinkansenSeries, end: boolean, tr: readonly number[]): number {
  if (s.pantographAt !== undefined) return s.pantographAt;
  return s.pantographD !== undefined ? s.pantographD - (end && s.cabFace ? s.cabFace.dJoin : 0) : tr[1]! - 1.5;
}

/** Paint along the roof's edges from the shoulder up to a height: strips in half width, each ending further back toward the top. */
function roofEdge(m: MeshBuilder, b: SliceBody, X: (d: number) => number, r: NonNullable<ShinkansenLivery["endRoofEdge"]>, dTip: number): void {
  const [d0, dS, dY] = [Math.max(0, r.d[0] - dTip), r.d[1] - dTip, r.d[2] - dTip];
  const half = bodyHalf(b, Math.max(0, dS));
  const zS = b.w(Math.max(0, dS)) * b.lean, zY = edgeAt(half, r.y);
  const k = 16;
  for (const sd of [1, -1])
    for (let i = 0; i < k; i++) {
      const [zHi, zLo] = [zS - ((zS - zY) * i) / k, zS - ((zS - zY) * (i + 1)) / k];
      crownPane(m, b, X, sd, r.mat, [d0, dS + ((dY - dS) * (i + 0.5)) / k], [zLo, zHi + (i === 0 ? 0.05 : 0)], 0.004);
    }
}

/** A car's side fittings on both sides (d behind the car's front, less `dTip` on the body). */
function sidePanels(m: MeshBuilder, b: SliceBody, X: (d: number) => number, l: ShinkansenLivery, panels: readonly SeriesSidePanel[], dTip: number): void {
  const paintAt = (y: number) => l.bands.find(([, top]) => top > y)?.[2] ?? l.bands[l.bands.length - 1]![2];
  for (const sd of [1, -1]) for (const p of panels) {
    const [d0, d1, y0, y1] = [p.d[0] - dTip, p.d[1] - dTip, p.y[0], p.y[1]];
    if (p.kind === "seam") {
      const t = 0.012;
      sidePanel(m, b, X, sd, "rubber", d0, d0 + t, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d1 - t, d1, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + t, d1 - t, y1 - t, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + t, d1 - t, y0, y0 + t, 0.005, 0.004);
    } else if (p.kind === "window") {
      sidePanel(m, b, X, sd, "rubber", d0, d1, y0, y1, 0.007, 0.03);
      sidePanel(m, b, X, sd, "glass", d0 + 0.04, d1 - 0.04, y0 + 0.04, y1 - 0.04, 0.012, 0.004);
    } else if (p.kind === "louvres") {
      const n = p.louvres ?? 6;
      sidePanel(m, b, X, sd, paintAt(y0), d0, d1, y0, y1, 0.006, 0.03);
      for (let i = 1; i < n; i++) {
        const y = y0 + ((y1 - y0) * i) / n;
        sidePanel(m, b, X, sd, "black", d0 + 0.03, d1 - 0.03, y - 0.01, y + 0.01, 0.014, 0.008);
      }
    } else {
      sidePanel(m, b, X, sd, p.mat ?? "rubber", d0, d1, y0, y1, 0.007, 0.03);
      if (p.screen) sidePanel(m, b, X, sd, p.screen, d0 + 0.06, d1 - 0.06, y0 + 0.06, y1 - 0.06, 0.012, 0.004);
    }
  }
}

/** The front's colour over the cab roof behind `frontD`, up to a slanted edge: strips on both sides and across the roof's arc. */
function capSlope(m: MeshBuilder, b: SliceBody, X: (d: number) => number, c: NonNullable<ShinkansenLivery["capSlope"]>, mat: string): void {
  const [d0, dS, dC] = c.d;
  const step = 0.2;
  const n = Math.max(1, Math.ceil((dS - d0) / step));
  // the side: columns from the slanted edge up to the shoulder
  const edge = (d: number) => c.y + ((d - d0) / (dS - d0)) * (b.S(d) - c.y);
  const tris: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const [a, e] = [d0 + ((dS - d0) * i) / n, d0 + ((dS - d0) * (i + 1)) / n];
    const [ya, ye, ta, te] = [edge(a), edge(e), b.S(a), b.S(e)];
    tris.push([a, ya], [e, ye], [e, te], [a, ya], [e, te], [a, ta]);
  }
  for (const sd of [1, -1]) sideDecal(m, b, X, sd, mat, tris, 0.004);
  // the arc: narrow strips in half width, each reaching further back toward the crown
  // (fine enough that the edge reads as one slanted line)
  const zS = b.w(dS) * b.lean, k = 16;
  for (const sd of [1, -1])
    for (let i = 0; i < k; i++) {
      const [zHi, zLo] = [(zS * (k - i)) / k, (zS * (k - i - 1)) / k];
      crownPane(m, b, X, sd, mat, [d0, dS + ((dC - dS) * (i + 0.5)) / k], [zLo, zHi + (i === 0 ? 0.05 : 0)], 0.004);
    }
}

function noseFittings(m: MeshBuilder, s: ShinkansenSeries, b: SliceBody, X: (d: number) => number): void {
  if (s.noseCab) {
    // the panes and lamps are the car's cab (drawCar); here the gangway door's outline on the front face
    const g = s.noseCab.gangway;
    if (g) m.scope("gangway door", () => {
      const [hw, y0, y1] = g, x = X(0) + 0.005, k = 0.025;
      decalX(m, "rubber", x, 1, -hw, -hw + k, y0, y1);
      decalX(m, "rubber", x, 1, hw - k, hw, y0, y1);
      decalX(m, "rubber", x, 1, -hw + k, hw - k, y0, y0 + k);
      decalX(m, "rubber", x, 1, -hw + k, hw - k, y1 - k, y1);
    });
    return;
  }
  const [d0, d1, z0, z1] = s.windscreen;
  m.scope("windscreen", () => {
    const k = s.windscreenMask;
    if (k) for (const sd of [1, -1]) crownPane(m, b, X, sd, "cabMask", [d0 - k, d1 + k * 0.5], [0, z1 + k], 0.006);
    for (const sd of [1, -1]) {
      crownPane(m, b, X, sd, "rubber", [d0, d1], [z0, z1], 0.012, 5, 3);
      crownPane(m, b, X, sd, "cabGlass", [d0 + 0.08, d1 - 0.08], [z0 + 0.05, z1 - 0.05], 0.04, 5, 3);
    }
  });
  if (s.faceLamps) {
    m.scope("headlights", () => faceLamps(m, 1, X(0), s.faceLamps!));
    const g = s.faceGrille;
    if (g) m.scope("grille", () => {
      const x = X(0);
      block(m, "black", x - 0.01, x + 0.03, g.y[0], g.y[1], -g.z, g.z);
      const pitch = (g.y[1] - g.y[0]) / (g.slats + 1);
      for (let i = 1; i <= g.slats; i++) block(m, "rubber", x + 0.03, x + 0.045, g.y[0] + i * pitch - 0.012, g.y[0] + i * pitch + 0.012, -g.z + 0.03, g.z - 0.03);
    });
    return;
  }
  const g = s.noseGrille;
  if (g) m.scope("grille", () => {
    for (const sd of [1, -1]) {
      crownPane(m, b, X, sd, "black", [g.d[0], g.d[1]], [0, g.z], 0.006);
      const n = 4, k = (g.d[1] - g.d[0]) / (n + 1);
      for (let i = 1; i <= n; i++) crownPane(m, b, X, sd, "rubber", [g.d[0] + i * k - 0.012, g.d[0] + i * k + 0.012], [0, g.z - 0.03], 0.012);
    }
  });
  const pair = s.lampPair;
  if (pair) {
    m.scope("headlights", () => {
      // side by side across the front at d, in one black surround
      const [za, zb] = pair.z;
      for (const sd of [1, -1]) {
        const steps = 4;
        for (let i = 0; i <= steps; i++) { const z = za + ((zb - za) * i) / steps; crownDisc(m, b, X, pair.d, z, sd, "black", pair.r + pair.surround, 0.004 + 0.0015 * i, 0.04, 14); }
        for (const z of [za, zb]) {
          crownDisc(m, b, X, pair.d, z, sd, "rubber", pair.r, 0.014, 0.004, 14);
          crownDisc(m, b, X, pair.d, z, sd, "lampHead", pair.r - 0.025, 0.02, 0.004, 14);
        }
      }
    });
    return;
  }
  m.scope("headlights", () => {
    const [d, y] = s.lamps;
    for (const sd of [1, -1]) {
      surfaceDisc(m, b, X, d, y, sd, "rubber", 0.17, 0.004, 0.04, 14);
      surfaceDisc(m, b, X, d, y, sd, "lampHead", 0.13, 0.012, 0.004, 14);
      surfaceDisc(m, b, X, d + 0.35, y - 0.05, sd, "lampRed", 0.06, 0.012, 0.004, 10);
    }
  });
}

const PALETTE: Record<string, MaterialSpec> = {
  ...INTERIOR_PALETTE, ...CARBODY_PALETTE,
  under: paint("#2a2c2f", 0.85), lettering: paint("#2a2c30"),
};

/** The nose's warning panel paint, when the series has one. */
const panelPaint = (s: ShinkansenSeries): Record<string, MaterialSpec> => (s.cabPanel ? { cabPanel: paint(s.cabPanel.colour, 0.45) } : {});

export interface ShinkansenSlot { end: boolean; pantograph: boolean; lo: number; hi: number; turned: boolean; power?: boolean }

/** The cars of an n-car train, front first: an end car at each end (the rear one turned), the second and the next-to-last raising a pantograph (the middle one of three). */
export function shinkansenTrain(s: ShinkansenSeries, n: number): ShinkansenSlot[] {
  const pc = s.powerCar;
  if (pc) {
    // the power car in its place among the intermediate cars, the train's only pantograph car
    const at = pc.slot(n);
    const lenOf = (k: number) => (k === 0 || k === n - 1 ? s.endLength : k === at ? pc.length : s.midLength);
    let top = Array.from({ length: n }, (_, k) => lenOf(k)).reduce((a, b) => a + b, 0) / 2;
    return Array.from({ length: n }, (_, k) => {
      const lo = top - lenOf(k);
      const out: ShinkansenSlot = { end: k === 0 || k === n - 1, pantograph: k === at, lo, hi: top, turned: k === n - 1, ...(k === at ? { power: true } : {}) };
      top = lo;
      return out;
    });
  }
  const pan = (k: number) => (unwired(s) ? false : s.onePantograph && !s.endPantograph ? k === 1 : s.endPantograph === "lead" ? k === 0 : s.endPantograph === "trail" ? k === n - 1 : s.endPantograph ? k === 0 || k === n - 1 : n <= 3 ? k === 1 : k === 2 || k === n - 3);
  const total = 2 * s.endLength + (n - 2) * s.midLength;
  let hi = total / 2;
  return Array.from({ length: n }, (_, k) => {
    const end = k === 0 || k === n - 1;
    const lo = hi - (end ? s.endLength : s.midLength);
    const out = { end, pantograph: (s.endPantograph ? end : !end) && pan(k), lo, hi, turned: k === n - 1 };
    hi = lo;
    return out;
  });
}

export function buildSeries(s: ShinkansenSeries, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const p = resolveParams(params, v);
  const l = liveryOf(s, p);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette, ...panelPaint(s) });
  const unit = (s.single ? "endCar" : p.unit) as ShinkansenUnit;
  if (unit !== "train") {
    const end = unit === "endCar";
    const power = unit === "powerCar" ? s.powerCar : undefined;
    const len = power ? power.length : end ? s.endLength : s.midLength;
    const panto = !unwired(s) && (s.powerCar ? !!power : s.endPantograph ? end : !end);
    // the nose covers its coupler; buffers stand out at a cab end
    const inside = !end || s.endCoupler === "buffers" ? [] : s.single ? [1, -1] : [1];
    drawCar(m, carDef(s, l, end, panto, l.number, false, power), (d) => len / 2 - frontGap(s, end) - d, inside.length ? { inside } : {});
    return m;
  }
  const slots = shinkansenTrain(s, carsIn(s, p));
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = slot.power ? s.powerCar!.length : slot.end ? s.endLength : s.midLength;
    const X = (d: number) => cx + len / 2 - frontGap(s, slot.end) - d;
    const def = carDef(s, l, slot.end, slot.pantograph && s.trailingLowered && s.endPantograph === true && slot.turned ? "lowered" : slot.pantograph, l.number, s.jacobsInset !== undefined, slot.power ? s.powerCar : undefined);
    // a buffered cab end keeps its buffers at the train's two ends
    const inside = slot.end && s.endCoupler === "buffers" ? [-1] : [1, -1];
    if (s.jacobs) {
      // Jacobs bogies: a car keeps only an end car's leading bogie; each joint's bogie is drawn once, carrying both cars
      const o = { inside, trucks: [slot.end, false] };
      return {
        x0: slot.lo + GAP, x1: slot.hi - (k === 0 ? 0 : GAP),
        draw: () => m.scope(`car ${k + 1}`, () => {
          if (slot.turned) m.turned(cx, () => drawCar(m, def, X, o));
          else drawCar(m, def, X, o);
          if (k < slots.length - 1) m.scope("jacobs bogie", () => m.bogie(() => bogieGeometry(m, slot.lo, def.truck), { sections: [k, k + 1] }));
        }),
      };
    }
    // a Jacobs set with inset lone-car bogies: the cars' inner-end bogies give way to the joints' own
    const o = s.jacobsInset !== undefined ? { inside, trucks: slot.end ? [true, false] : [false, false] } : { inside };
    return {
      x0: slot.lo + GAP, x1: slot.hi - (k === 0 ? 0 : GAP),
      draw: () => {
        m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, () => drawCar(m, def, X, o)) : drawCar(m, def, X, o)));
        if (s.jacobsInset !== undefined && k + 1 < slots.length) m.scope(`jacobs bogie ${k + 1}`, () => m.bogie(() => bogieGeometry(m, slot.lo, def.truck), { sections: [k, k + 1] }));
      },
    };
  });
  const bellows: Array<[number, number]> = [[-0.78, s.door[0]], [0.78, s.door[0]], [0.78, s.door[1] + 0.25], [-0.78, s.door[1] + 0.25]];
  articulate({ m }, sections, couplerOf(s), { profile: bellows, folds: 4, depth: 0.03 }, 10, slots.slice(0, -1).map((x) => x.lo));
  return m;
}

function carLod(s: ShinkansenSeries, l: ShinkansenLivery, end: boolean, pantograph: boolean, X: (d: number) => number, cx: number, turned: boolean, section?: number, trucks: readonly boolean[] = [true, true], power?: SeriesPowerCar): { body: UnitBody; parts: LodPart[] } {
  const def = carDef(s, l, end, pantograph, l.number, false, power);
  const b = carbody({ ...def.spec, edges: [] });
  const side: LodBand[] = [...((end && l.endBands) || l.bands).map(([a, e, mt]): [number, number, string] => [Math.max(a, s.B), Math.min(e, s.S), mt]).filter(([a, e]) => e > a + 1e-6), [s.S, s.C, l.roof]];
  const at = (y: number) => { for (let k = 0; k <= 2000; k++) { const d = k * 0.01; if (b.B(d) <= y && b.C(d) >= y) return d; } return 0; };
  const ys = [s.B, s.Y, (s.Y + s.S) / 2, s.S, (s.S + s.C) / 2, s.C - 0.02];
  const spans = def.windows[0]!.spans;
  let body: UnitBody = {
    y0: s.B, hw: [[s.B, s.W * 0.9], [s.A, s.W * 0.97], [s.Y, s.W], [s.S, s.W * s.lean], [s.C, 0.4]], side, roof: l.roof,
    front: end && s.cabFace ? cabFaceLod(s.cabFace, 1, X(-s.cabFace.dJoin), bodyHalf(b, 0), facePaint(s, l, l.number), s.C) : end ? { tip: ys.map((y) => [y, X(at(y))] as const), setback: [[s.B, 2.0], [s.C, 1.0]] } : { tip: [[s.B, X(0)]], ...(section !== undefined ? { hidden: true } : {}) },
    rear: end && s.single && s.cabFace ? cabFaceLod(s.cabFace, -1, -X(b.length + s.cabFace.dJoin), bodyHalf(b, 0), facePaint(s, l, l.number), s.C) : { tip: [[s.B, X(b.length)]], ...(section !== undefined ? { hidden: true } : {}) },
    windows: [{ u: [Math.min(X(spans[0]![0]), X(spans[spans.length - 1]![1])), Math.max(X(spans[0]![0]), X(spans[spans.length - 1]![1]))], y: [def.windows[0]!.y[0], def.windows[0]!.y[1]], mat: LOD_GLASS }],
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  // Jacobs bogies in a train: each joint's bogie once, with the car ahead of it
  const all = bogies(s, end, power), tr = all.filter((_, i) => !(s.jacobs && section !== undefined) || (i === 0 ? end : !turned));
  // the power car's raised pantograph, else the kit's place
  const panD = power ? (power.pantographs.find((p) => p.raised) ?? power.pantographs[0]!).d : pantographAt(s, end, all);
  const parts: LodPart[] = [
    ...bogieParts(tr.filter((_, i) => trucks[i] !== false).map((d) => [T(X(d)), power ? Math.max(...power.axles.map(Math.abs)) + power.wheelR + 0.2 : s.wheelbase / 2 + s.wheelR + 0.2, ...(section !== undefined ? [section] : [])] as const) as unknown as ReadonlyArray<readonly [number, number, number?]>, s.B),
    ...(end && s.lodRoof ? [roofPart(s.lodRoof.mat, T(X(s.lodRoof.d[0] - (s.cabFace?.dJoin ?? 0))), T(X(s.lodRoof.d[1] - (s.cabFace?.dJoin ?? 0))), s.lodRoof.hw, s.lodRoof.hw, s.lodRoof.y[0], s.lodRoof.y[1], section)] : []),
    ...(pantograph ? [{ ...roofPart("pantograph", T(X(panD)) - 0.8, T(X(panD)) + 0.8, 0.45, 0.45, s.C, RAIL_COLLECTOR_TOP, section), optional: 8 }] : []),
  ];
  return { body, parts };
}

export function buildSeriesLod(s: ShinkansenSeries, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const p = resolveParams(params, v);
  const l = liveryOf(s, p);
  const palette = { ...PALETTE, ...l.palette };
  const unit = (s.single ? "endCar" : p.unit) as ShinkansenUnit;
  if (unit !== "train") {
    const end = unit === "endCar";
    const power = unit === "powerCar" ? s.powerCar : undefined;
    const len = power ? power.length : end ? s.endLength : s.midLength;
    const { body, parts } = carLod(s, l, end, !unwired(s) && (s.powerCar ? !!power : s.endPantograph ? end : !end), (d) => len / 2 - frontGap(s, end) - d, 0, false, undefined, undefined, power);
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const slots = shinkansenTrain(s, carsIn(s, p));
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = slot.power ? s.powerCar!.length : slot.end ? s.endLength : s.midLength;
    const own = s.jacobsInset === undefined ? [true, true] : slot.end ? [true, false] : [false, false];
    const car = carLod(s, l, slot.end, slot.pantograph && !(s.trailingLowered && s.endPantograph === true && slot.turned), (d) => cx + len / 2 - frontGap(s, slot.end) - d, cx, slot.turned, k, own, slot.power ? s.powerCar : undefined);
    // a Jacobs set's bogie under the joint behind this car
    if (s.jacobsInset !== undefined && k + 1 < slots.length) car.parts.push(...bogieParts([[slot.lo, s.wheelbase / 2 + s.wheelR + 0.2, k]], s.B));
    return car;
  });
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, couplerOf(s), 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number], front: slot.lo + GAP, rear: slots[i + 1]!.hi - GAP,
      profile: [[-0.78, s.door[0]], [0.78, s.door[0]], [0.78, s.door[1] + 0.25], [-0.78, s.door[1] + 0.25]] as Array<[number, number]>,
    })),
    maxBendDeg: 10,
  };
  return fitUnit({ palette, bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * slots.length));
}

export function seriesParams(s: ShinkansenSeries): ParamSpec[] {
  // a parameter of one value is no choice: a single livery or train length is left out
  const livery = Object.keys(s.liveries).length > 1 ? [enumParam("livery", "Livery", Object.fromEntries(Object.entries(s.liveries).map(([k, v]) => [k, v.title])))] : [];
  if (s.single) return livery;
  // a two-car unit has no intermediate car
  const units: Record<string, string> = carsOf(s).every((n) => n <= 2) ? { endCar: "End car", train: "Full train" } : s.powerCar ? { endCar: "End car", middleCar: "Middle car", powerCar: "Power car", train: "Full train" } : { endCar: "End car", middleCar: "Middle car", train: "Full train" };
  return [
    enumParam("unit", "Car", units),
    ...(carsOf(s).length > 1 ? [{ ...enumParam("cars", "Cars", Object.fromEntries(carsOf(s).map((n) => [String(n), `${n} cars`]))), default: String(defaultCars(s)), when: { name: "unit", values: ["train"] } }] : []),
    ...livery,
  ];
}

/** The livery and train length of a series' values, a left-out parameter at its only value. */
const liveryOf = (s: ShinkansenSeries, p: ParamValues): ShinkansenLivery => s.liveries[p.livery ?? Object.keys(s.liveries)[0]!]!;
const carsIn = (s: ShinkansenSeries, p: ParamValues): number => (p.cars ? Number(p.cars) : defaultCars(s));

function gameOf(s: ShinkansenSeries, params: readonly ParamSpec[]): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  const lp = params.find((p) => p.name === "livery");
  const liveries = lp ? lp.values.map((v) => v.value) : [""];
  if (s.single) return { weight: s.weight.end, power: s.power, maxspeed: s.maxspeed, accel: null };
  for (const livery of liveries) {
    const base: ParamValues = !lp || livery === lp.default ? {} : { livery };
    const pc = s.powerCar;
    if (carsOf(s).some((n) => n > 2)) variants.push({ params: { ...base, unit: "middleCar" }, weight: s.weight.middle, ...(pc ? { power: 0 } : {}) });
    if (pc) variants.push({ params: { ...base, unit: "powerCar" }, weight: pc.weight, power: pc.power });
    for (const n of carsOf(s))
      variants.push({ params: { ...(n === defaultCars(s) || carsOf(s).length < 2 ? {} : { cars: String(n) }), ...base, unit: "train" }, ...(pc ? { weight: 2 * s.weight.end + (n - 3) * s.weight.middle + pc.weight, power: pc.power } : { weight: 2 * s.weight.end + (n - 2) * s.weight.middle, power: s.power * n }) });
  }
  return { weight: s.weight.end, power: s.power, maxspeed: s.maxspeed, accel: null, variants };
}

// ---------------------------------------------------------------------------
// The series

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });

// N700S (assets/shinkansen-n700s/SOURCES.md): the "dual supreme wing" nose as a cab face whose depth
// is reshaped across it (`n7Reshape`): a broad, rounded snout; above it the wing body, whose two
// crests run from the headlights back and up to the body's shoulder with a shallow valley between
// them; and the canopy, a narrow spine rising out of the valley ahead of the windscreen and widening
// into the cab's bubble, which merges into the roof at the join. Heights above the rail, d behind
// the tip, lat from the centre line; the side photograph at about 125 px/m on the body's side.

/** Where the nose meets the body's section (the canopy reaches the roof), and the side's half width. */
const N7_JOIN = 9.0;
const N7_HW = 1.62;
type N7Tab = readonly Pt[];
const n7 = (t: N7Tab, x: number) => edgeAt(t, x);
/** The snout's centre line [y, d]: the chin curving under, the tip at 1.0 m, the top rounding back to the upper nose. */
const N7_SNOUT: N7Tab = [[0.3, 2.6], [0.36, 1.8], [0.44, 1.25], [0.52, 0.9], [0.6, 0.62], [0.7, 0.38], [0.78, 0.22], [0.86, 0.1], [0.94, 0.03], [1.02, 0], [1.1, 0.01], [1.18, 0.06], [1.26, 0.14], [1.34, 0.25], [1.42, 0.4], [1.5, 0.58], [1.58, 0.8], [1.66, 1.0], [2.0, 1.4], [3.6, 2.0]];
/** The snout's plan: its corner radius and the corner's depth back along the car by height (a broad, deep U). */
const N7_CORNER: N7Tab = [[0.3, 1.25], [0.5, 1.2], [0.9, 1.1], [1.3, 1.05], [1.6, 1.1], [3.6, 1.1]];
const N7_DEPTH: N7Tab = [[0.3, 1.5], [0.5, 1.6], [0.9, 2.1], [1.3, 2.4], [1.6, 2.6], [1.9, 1.5], [2.2, 0.6], [3.6, 0.3]];
/** The wing body by d: the valley's height on the centre line, the crests' height and lat, the side's top at the body's half width. */
const N7_H0: N7Tab = [[0.6, 1.52], [1.0, 1.58], [2.0, 1.68], [3.0, 1.75], [4.0, 1.85], [5.0, 1.95], [6.0, 2.08], [7.0, 2.25], [8.0, 2.55], [9.0, 2.95]];
const N7_HC: N7Tab = [[0.6, 1.56], [1.0, 1.64], [2.0, 1.76], [3.0, 1.85], [4.0, 1.95], [5.0, 2.07], [6.0, 2.22], [7.0, 2.45], [8.0, 2.82], [9.0, 3.3]];
const N7_LR: N7Tab = [[0.6, 1.1], [1.0, 1.18], [2.0, 1.28], [4.0, 1.36], [6.0, 1.42], [8.0, 1.48], [9.0, 1.5]];
const N7_HS: N7Tab = [[0.6, 1.15], [1.0, 1.25], [2.0, 1.38], [3.0, 1.48], [4.0, 1.58], [5.0, 1.7], [6.0, 1.85], [7.0, 2.08], [8.0, 2.5], [9.0, 3.05]];
/** The spine and canopy by d: the centre's height, the half width and how far its edge drops below the centre. */
const N7_HB: N7Tab = [[0.8, 1.68], [1.5, 1.8], [2.5, 1.97], [3.3, 2.1], [3.7, 2.2], [3.95, 2.32], [4.35, 2.55], [4.7, 2.7], [5.1, 2.88], [5.5, 3.0], [6.1, 3.14], [7.0, 3.3], [8.0, 3.45], [9.0, 3.62]];
const N7_WB: N7Tab = [[0.8, 0.32], [2.0, 0.42], [3.3, 0.55], [3.8, 0.72], [4.5, 0.82], [6.0, 0.86], [7.0, 0.97], [7.8, 1.2], [8.4, 1.45], [9.0, 1.7]];
const N7_DROP: N7Tab = [[0.8, 0.16], [2.5, 0.18], [3.3, 0.25], [3.8, 0.55], [4.5, 0.9], [5.5, 1.1], [7.0, 1.1], [8.0, 0.8], [8.6, 0.62], [9.0, 0.5]];

/** The nose's top surface height at (d, lat): the wing body or the canopy over it. */
function n7Height(d: number, lat: number): number {
  const [h0, hc, lr, hs] = [n7(N7_H0, d), n7(N7_HC, d), n7(N7_LR, d), n7(N7_HS, d)];
  // the valley between the crests, then the crest rounding down to the side
  const t = Math.min(1, Math.max(0, (lat - lr) / (N7_HW - lr)));
  const wing = lat <= lr ? h0 + (hc - h0) * (lat / lr) ** 2 : hc - (hc - hs) * t * t;
  // the canopy blended into the wing body (a smooth maximum, no crease the grid cannot follow)
  const canopy = n7(N7_HB, d) - n7(N7_DROP, d) * (lat / n7(N7_WB, d)) ** 2.4;
  const k = 0.07, h = Math.min(1, Math.max(0, 0.5 + (canopy - wing) / (2 * k)));
  return wing + (canopy - wing) * h + k * h * (1 - h);
}

/** The first d at which the top surface reaches height y at lat (bisection; the surface rises toward the join). */
function n7Top(lat: number, y: number): number {
  if (n7Height(0, lat) >= y) return 0;
  if (n7Height(N7_JOIN, lat) < y) return N7_JOIN;
  let [a, b] = [0, N7_JOIN];
  for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (n7Height(m, lat) >= y) b = m; else a = m; }
  return (a + b) / 2;
}

/** The grid's rows (the paint's and the shape's heights). */
const N7_ROWS = [0.3, 0.36, 0.44, 0.52, 0.6, 0.7, 0.78, 0.86, 0.9, 0.95, 1.0, 1.05, 1.12, 1.2, 1.28, 1.36, 1.42, 1.48, 1.54, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.06, 2.12, 2.18, 2.25, 2.32, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.48, 3.55, 3.6];
/** The face's centre line, the snout's or the top's (the distant model's tip by height too). */
const N7_PROFILE: Pt[] = N7_ROWS.map((y): Pt => [y, Math.round(Math.max(n7(N7_SNOUT, y), n7Top(0, y)) * 1e4) / 1e4]);
/** The face's depth: behind both the snout's rounded front and the top surface. */
const n7Reshape = (lat: number, y: number, d: number): number => Math.max(n7(N7_SNOUT, y) + d - n7(N7_PROFILE, y), n7Top(lat, y));

/** An almond headlight on viewer's side sd: [lat, y], the inner end low, the outer end high under the crest. */
const n7Lamp = (sd: number, grow: number): Pt[] =>
  ([[0.93, 1.43], [1.04, 1.385], [1.2, 1.4], [1.33, 1.48], [1.4, 1.6], [1.3, 1.635], [1.15, 1.585], [1.0, 1.515]] as Pt[]).map(([l, y]): Pt => {
    const [cl, cy] = [1.16, 1.5];
    return [sd * (cl - 0.08 + (l - cl) * (1 + grow)), cy + (y - cy) * (1 + grow * 1.6)];
  });
/** A rounded oval seen head-on, [lat, y]: half width hw, from y0 to y1, the top narrower by `taper`, the corners squarer for a larger exponent. */
const n7Oval = (hw: number, y0: number, y1: number, taper: number, ex: number, n = 40): Pt[] => {
  const [cy, hy] = [(y0 + y1) / 2, (y1 - y0) / 2];
  return Array.from({ length: n }, (_, i): Pt => {
    const a = (2 * Math.PI * i) / n, c = Math.cos(a), s = Math.sin(a);
    const x = Math.sign(c) * Math.abs(c) ** (2 / ex), y = Math.sign(s) * Math.abs(s) ** (2 / ex);
    return [Math.round(hw * x * (1 - taper * Math.max(0, y)) * 1e4) / 1e4, Math.round((cy + hy * y) * 1e4) / 1e4];
  });
};
/** The windscreen (J22, Kyoto: about 1.5 m across, 0.85 m tall): one wide rounded glass wrapping the canopy's front, its foot 2.3 m high. */
const N7_SCREEN: Pt[] = n7Oval(0.76, 2.29, 3.12, 0.3, 3.2);

const N700S_FACE: SeriesCabFace = {
  dJoin: N7_JOIN, dSide: 6.0, first: N7_JOIN + 1.3, reach: 0, roofFrom: 9, wrap: true, cols: [10, 10, 1, 2], tolerance: 0.03,
  profile: N7_PROFILE, corner: [...N7_CORNER], cornerDepth: [...N7_DEPTH], rows: N7_ROWS, reshape: n7Reshape,
  // the lower snout in the skirt's colour (silver grey, JR Kyushu's red), white above
  bands: (l) => [[0, 0.9, l.bands[0]![2]], [0.9, 9, "white"]],
  // the windscreen: one pane, no centre pillar (J30, Kyoto), a single wiper
  fields: [{ mat: "cabGlass", pts: N7_SCREEN }, { mat: "cabMask", pts: n7Lamp(1, 0.14) }, { mat: "cabMask", pts: n7Lamp(-1, 0.14) }, { mat: "cabGlass", pts: n7Lamp(1, 0) }, { mat: "cabGlass", pts: n7Lamp(-1, 0) }, { mat: "lampHead", pts: n7Lamp(1, -0.35) }, { mat: "lampHead", pts: n7Lamp(-1, -0.35) }],
  // the distant model's glass: inside the windscreen's outline
  panes: [{ lat: [-0.6, 0.6], y: [2.34, 3.05], r: 0.25 }],
  wipers: [[[0.3, 2.37], [-0.16, 2.86]]],
};

/** A thin line of paint along a centre line (d, y; y ascending) as a sweep's front and back edges by height. */
function n7Line(pts: ReadonlyArray<readonly [number, number]>, t: number): { front: Pt[]; back: Pt[] } {
  const dAt = (y: number) => edgeAt(pts.map(([d, yy]): Pt => [yy, d]), y);
  const [y0, y1] = [pts[0]![1], pts[pts.length - 1]![1]];
  const ys = Array.from({ length: 13 }, (_, i) => y0 + ((y1 - y0) * i) / 12);
  return { front: ys.map((y): Pt => [y, dAt(y - t / 2)]), back: ys.map((y): Pt => [y, dAt(y + t / 2)]) };
}

const N7_PALETTE = { white: c("#f3f3f0"), roofG: c("#e8e8e5", 0.6), cabMask: c("#1b1d20", 0.3) };

export const N700S: ShinkansenSeries = {
  endLength: 27.35, midLength: 25.0, W: N7_HW, Y: 1.45, S: 3.0, C: 3.6, lean: 0.96, B: 0.3, A: 0.9,
  nose: nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: N700S_FACE,
  // small windows with rounded ends, one a seat row (1.04 m); single-leaf plug doors, a narrow window high in the leaf
  windows: [[2.09, 2.66]], windowW: 0.5, pitch: 1.04, door: [1.32, 3.25, 2.3, 2.9], doorW: 0.8, doorGlassW: 0.3,
  layout: {
    // the crew door just behind the canopy, the front passenger door, 13 seat rows, the rear door 0.75 m from the end
    end: { doors: [[0.15, 0.75, -1], [1.15, 1.95, -1], [16.48, 17.28, 1]], windows: Array.from({ length: 13 }, (_, i): [number, number] => [2.85 + 1.04 * i, 3.35 + 1.04 * i]) },
    // a door at each end, 20 seat rows between them
    middle: { doors: [[0.35, 1.15, -1], [23.35, 24.15, 1]], windows: Array.from({ length: 20 }, (_, i): [number, number] => [2.12 + 1.04 * i, 2.62 + 1.04 * i]) },
  },
  // the leading bogie under the canopy's rear, 17.5 m ahead of the rear one; the skirts hang low: no underfloor box below them
  endBogies: [6.1 - N7_JOIN, 23.6 - N7_JOIN], bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5, fittings: () => {},
  pantographCover: { len: 3.6, hw: 0.72, top: [2.5, 0.52], h: 0.42, mat: "white" },
  liveries: {
    jrCentral: {
      title: "JR Central", palette: { ...N7_PALETTE, blue: c("#123c96"), skirtG: c("#ccd0d3", 0.35) },
      // the wide blue line under the windows, the thin one under it
      bands: [[0, 0.9, "skirtG"], [0.9, 1.62, "white"], [1.62, 1.7, "blue"], [1.7, 1.8, "white"], [1.8, 2.0, "blue"], [2.0, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "783-1",
      endSweeps: [
        // the wide line's pointed front end just ahead of the crew door, and the blade ahead of it rising to the door
        { mat: "blue", front: [[1.8, 9.0], [2.0, 8.45]], back: [[1.8, 9.0], [2.0, 9.0]] },
        { mat: "blue", front: [[1.66, 5.45], [2.14, 8.1]], back: [[1.66, 5.45], [1.97, 9.1], [2.14, 8.1]] },
      ],
    },
    jrKyushu: {
      title: "JR Kyushu", palette: { ...N7_PALETTE, red: c("#c8102e", 0.45), kBlack: c("#141517", 0.35) },
      // Nishi Kyushu Shinkansen "Kamome": red below 0.9 m, a thin red line under the windows
      bands: [[0, 0.9, "red"], [0.9, 1.7, "white"], [1.7, 1.74, "red"], [1.74, 9, "white"]], roof: "roofG", skirt: "red", number: "Y1",
      endSweeps: [
        // the thin line dipping along the nose's side ahead of the crew door
        { mat: "red", ...n7Line([[5.4, 1.41], [6.3, 1.44], [7.2, 1.53], [8.0, 1.62], [8.7, 1.68], [9.0, 1.7]], 0.04) },
      ],
      // the black canopy round the windscreen, one oval seen head-on (its thin gold edging is left out)
      faceFields: [{ mat: "kBlack", pts: n7Oval(0.9, 2.17, 3.5, 0.25, 2.8) }],
    },
  },
  weight: { end: 44, middle: 42 }, power: 1220, maxspeed: 300,
};

export const E5: ShinkansenSeries = {
  endLength: 26.5, midLength: 25.0, W: 1.62, Y: 1.45, S: 3.0, C: 3.65, lean: 0.95, B: 0.75, A: 1.05,
  // the 15 m nose rising in a long line to the canopy cab
  nose: nose(13.0, 0.04, 2.3, [[0, 1.2], [1.0, 1.55], [5.0, 2.0], [10.0, 2.5], [12.4, 3.0], [14.0, 3.45], [15.0, 3.65]], [[0, 1.15], [1.0, 1.45], [5.0, 1.75], [10.0, 2.1], [12.4, 2.45], [14.0, 2.85], [15.0, 3.0]], [[0, 1.1], [3.0, 1.3], [6.0, 1.45]], [[0, 1.05], [2.0, 1.05]], [[0, 1.03], [0.8, 0.55], [3.0, 0.75]]),
  windscreen: [12.3, 14.0, 0.07, 0.95], lamps: [4.0, 1.5],
  windows: [[2.0, 2.55]], windowW: 0.75, pitch: 1.0, door: [1.3, 3.05, 1.95, 2.6], doorW: 1.0,
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    hayabusa: { title: "E5 Hayabusa", palette: { green: c("#00825a"), white: c("#f2f2ef"), pink: c("#e5649a"), roofG: c("#00825a", 0.5), skirtG: c("#d9d9d6") }, bands: [[0, 2.0, "white"], [2.0, 2.06, "pink"], [2.06, 9, "green"]], roof: "roofG", skirt: "skirtG", number: "E514-1" },
    h5: { title: "H5 Hokkaido", palette: { green: c("#00825a"), white: c("#f2f2ef"), purple: c("#7a4a9e"), roofG: c("#00825a", 0.5), skirtG: c("#d9d9d6") }, bands: [[0, 2.0, "white"], [2.0, 2.06, "purple"], [2.06, 9, "green"]], roof: "roofG", skirt: "skirtG", number: "H514-1" },
  },
  weight: { end: 46, middle: 45 }, power: 1200, maxspeed: 320,
};

export const S500: ShinkansenSeries = {
  endLength: 27.0, midLength: 25.0, W: 1.6, Y: 1.3, S: 2.6, C: 3.69, lean: 0.92, B: 0.75, A: 1.1,
  // the round body and the 15 m needle nose, the cab canopy far back
  nose: nose(14.0, 0.03, 2.0, [[0, 1.55], [2.0, 2.0], [6.0, 2.55], [10.0, 3.05], [13.0, 3.45], [15.0, 3.69]], [[0, 1.5], [2.0, 1.85], [6.0, 2.15], [10.0, 2.35], [13.0, 2.5], [15.0, 2.6]], [[0, 1.45], [3.0, 1.35], [8.0, 1.3]], [[0, 1.4], [3.0, 1.1]], [[0, 1.35], [1.0, 0.7], [3.0, 0.75]]),
  windscreen: [11.6, 13.4, 0.07, 0.9], lamps: [3.4, 1.85],
  windows: [[1.95, 2.5]], windowW: 0.75, pitch: 1.0, door: [1.3, 3.0, 1.95, 2.55], doorW: 1.0,
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    original: { title: "Nozomi", palette: { grey: c("#a7b0b8"), dark: c("#3a4555"), blue: c("#2a4f9a"), roofG: c("#9aa3ab", 0.5), skirtG: c("#5d6670") }, bands: [[0, 1.85, "grey"], [1.85, 1.9, "blue"], [1.9, 2.55, "dark"], [2.55, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "521-1" },
    kodama: { title: "Kodama", palette: { grey: c("#b9c0c6"), dark: c("#3a4555"), blue: c("#2a4f9a"), white: c("#eef0f1"), roofG: c("#a9b0b6", 0.5), skirtG: c("#5d6670") }, bands: [[0, 1.85, "white"], [1.85, 1.92, "blue"], [1.92, 2.55, "dark"], [2.55, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "521-7001" },
  },
  weight: { end: 41, middle: 40 }, power: 1140, maxspeed: 300,
};

export const S700: ShinkansenSeries = {
  endLength: 27.35, midLength: 25.0, W: 1.62, Y: 1.45, S: 3.0, C: 3.65, lean: 0.96, B: 0.75, A: 1.05,
  // the "duck bill": the nose flattened wide and low ahead of the cab
  nose: nose(9.2, 0.18, 3.2, [[0, 1.15], [0.5, 1.4], [3.0, 1.75], [6.5, 2.2], [8.3, 2.85], [9.4, 3.4], [10.2, 3.65]], [[0, 1.12], [0.5, 1.33], [3.0, 1.6], [6.5, 1.9], [8.3, 2.4], [9.4, 2.85], [10.2, 3.0]], [[0, 1.08], [1.5, 1.3], [4.0, 1.45]], [[0, 1.05], [1.5, 1.05]], [[0, 1.02], [0.5, 0.6], [2.0, 0.75]]),
  windscreen: [7.8, 9.4, 0.07, 1.05], lamps: [1.6, 1.4],
  windows: [[2.0, 2.6]], windowW: 0.9, pitch: 1.04, door: [1.3, 3.05, 1.95, 2.6], doorW: 1.0,
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    jrCentral: { title: "JR Central", palette: { white: c("#f3f3f0"), blue: c("#1a3f9a"), roofG: c("#e6e6e3", 0.6), skirtG: c("#dcdcd8") }, bands: [[0, 1.75, "white"], [1.75, 1.92, "blue"], [1.92, 2.65, "white"], [2.65, 2.7, "blue"], [2.7, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "723-1" },
    doctorYellow: { title: "Doctor Yellow", palette: { yellow: c("#f0cf12"), blue: c("#1d4596"), roofG: c("#dcc02a", 0.6), skirtG: c("#1d4596") }, bands: [[0, 1.75, "yellow"], [1.75, 1.92, "blue"], [1.92, 9, "yellow"]], roof: "roofG", skirt: "skirtG", number: "923-1" },
  },
  weight: { end: 45, middle: 43 }, power: 1100, maxspeed: 285,
};

export const E6: ShinkansenSeries = {
  endLength: 23.075, midLength: 20.5, W: 1.4725, Y: 1.45, S: 3.0, C: 3.65, lean: 0.95, B: 0.75, A: 1.05,
  nose: nose(12.0, 0.04, 2.3, [[0, 1.2], [1.0, 1.55], [5.0, 2.05], [9.0, 2.55], [11.2, 3.05], [12.6, 3.45], [13.0, 3.65]], [[0, 1.15], [1.0, 1.45], [5.0, 1.8], [9.0, 2.15], [11.2, 2.5], [12.6, 2.9], [13.0, 3.0]], [[0, 1.1], [3.0, 1.3], [6.0, 1.45]], [[0, 1.05], [2.0, 1.05]], [[0, 1.03], [0.8, 0.55], [3.0, 0.75]]),
  windscreen: [10.9, 12.6, 0.07, 0.85], lamps: [3.6, 1.5],
  windows: [[2.0, 2.55]], windowW: 0.75, pitch: 1.0, door: [1.3, 3.05, 1.95, 2.6], doorW: 0.9,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    komachi: { title: "E6 Komachi", palette: { red: c("#c8102e"), white: c("#f2f2ef"), silver: c("#a9adb1", 0.35), roofG: c("#c8102e", 0.5), skirtG: c("#d9d9d6") }, bands: [[0, 2.02, "white"], [2.02, 2.08, "silver"], [2.08, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "E611-1" },
    akita: { title: "Akita", palette: { red: c("#c8102e"), white: c("#f2f2ef"), silver: c("#a9adb1", 0.35), roofG: c("#e4e4e1", 0.5), skirtG: c("#d9d9d6") }, bands: [[0, 2.02, "white"], [2.02, 2.1, "red"], [2.1, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E611-9" },
  },
  weight: { end: 41, middle: 39 }, power: 1200, maxspeed: 320,
};

export const S100: ShinkansenSeries = {
  endLength: 26.05, midLength: 25.0, W: 1.62, Y: 1.5, S: 3.1, C: 4.0, lean: 0.965, B: 0.85, A: 1.0,
  // the sharper "shark" nose after the 0 series, the cab windscreen in a flat crown
  nose: nose(5.2, 0.05, 2.2, [[0, 1.7], [0.3, 2.05], [1.5, 2.45], [4.0, 2.85], [5.0, 3.25], [5.8, 3.7], [7.0, 4.0]], [[0, 1.65], [0.3, 1.9], [1.5, 2.2], [4.0, 2.55], [5.8, 2.95], [7.0, 3.1]], [[0, 1.6], [1.0, 1.55], [2.5, 1.5]], [[0, 1.55], [0.8, 1.0]], [[0, 1.5], [0.4, 0.6], [2.0, 0.85]]),
  windscreen: [4.6, 6.0, 0.07, 1.05], lamps: [1.6, 1.8],
  windows: [[2.0, 2.6]], windowW: 0.9, pitch: 1.04, door: [1.35, 3.0, 2.05, 2.6], doorW: 0.7,
  bogieCentres: 17.5, wheelR: 0.455, wheelbase: 2.5,
  liveries: {
    jnr: { title: "JNR ivory, blue", palette: { ivory: c("#eeece2"), blue: c("#1d4596"), roofG: c("#e2e0d6", 0.6), skirtG: c("#1d4596") }, bands: [[0, 1.85, "ivory"], [1.85, 1.95, "blue"], [1.95, 2.72, "ivory"], [2.72, 2.95, "blue"], [2.95, 9, "ivory"]], roof: "roofG", skirt: "skirtG", number: "123-1" },
    jrWest: { title: "JR West green", palette: { grey: c("#d9dcdd"), dark: c("#545a60"), green: c("#7dbb2e"), roofG: c("#c9cccd", 0.6), skirtG: c("#5b6167") }, bands: [[0, 1.85, "grey"], [1.85, 1.95, "green"], [1.95, 2.72, "grey"], [2.72, 2.95, "dark"], [2.95, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "121-3001" },
  },
  weight: { end: 57, middle: 56 }, power: 920, maxspeed: 230,
};

export const E4: ShinkansenSeries = {
  endLength: 25.7, midLength: 25.0, W: 1.62, Y: 1.2, S: 3.85, C: 4.485, lean: 0.97, B: 0.65, A: 0.9,
  // the double-deck car's long nose: a low pointed snout under a tall cab
  nose: nose(9.4, 0.06, 2.4, [[0, 1.3], [1.0, 1.7], [4.5, 2.4], [7.5, 3.1], [9.4, 3.7], [10.8, 4.2], [11.5, 4.485]], [[0, 1.25], [1.0, 1.6], [4.5, 2.2], [7.5, 2.85], [9.4, 3.4], [11.5, 3.85]], [[0, 1.2], [2.0, 1.2]], [[0, 1.15], [1.5, 0.9]], [[0, 1.1], [0.6, 0.5], [2.0, 0.65]]),
  windscreen: [9.3, 10.9, 0.07, 1.05], lamps: [2.4, 1.6],
  windows: [[1.25, 1.85], [2.7, 3.35]], windowW: 0.85, pitch: 1.0, door: [1.1, 3.05, 1.8, 2.6], doorW: 1.0,
  bogieCentres: 17.5, wheelR: 0.455, wheelbase: 2.5,
  liveries: {
    max: { title: "E4 Max", palette: { white: c("#eef0f1"), blue: c("#2a4f9a"), yellow: c("#f2c31a"), roofG: c("#d9dcdf", 0.6), skirtG: c("#2a4f9a") }, bands: [[0, 2.15, "blue"], [2.15, 2.25, "yellow"], [2.25, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E453-101" },
    toki: { title: "Toki", palette: { white: c("#eef0f1"), blue: c("#2a4f9a"), pink: c("#e58aa6"), roofG: c("#d9dcdf", 0.6), skirtG: c("#2a4f9a") }, bands: [[0, 2.15, "blue"], [2.15, 2.25, "pink"], [2.25, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E453-104" },
  },
  weight: { end: 52, middle: 50 }, power: 840, maxspeed: 240,
};

// ---------------------------------------------------------------------------
// Designs: named builders (a design's JS model imports its builder by name)

const P = { n700s: seriesParams(N700S), e5: seriesParams(E5), s500: seriesParams(S500), s700: seriesParams(S700), e6: seriesParams(E6), s100: seriesParams(S100), e4: seriesParams(E4) };

export function shinkansenN700s(v?: ParamValues): MeshBuilder { return buildSeries(N700S, P.n700s, v); }
export function shinkansenN700sLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(N700S, P.n700s, v); }
export function shinkansenE5(v?: ParamValues): MeshBuilder { return buildSeries(E5, P.e5, v); }
export function shinkansenE5Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E5, P.e5, v); }
export function shinkansen500(v?: ParamValues): MeshBuilder { return buildSeries(S500, P.s500, v); }
export function shinkansen500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S500, P.s500, v); }
export function shinkansen700(v?: ParamValues): MeshBuilder { return buildSeries(S700, P.s700, v); }
export function shinkansen700Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S700, P.s700, v); }
export function shinkansenE6(v?: ParamValues): MeshBuilder { return buildSeries(E6, P.e6, v); }
export function shinkansenE6Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E6, P.e6, v); }
export function shinkansen100(v?: ParamValues): MeshBuilder { return buildSeries(S100, P.s100, v); }
export function shinkansen100Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S100, P.s100, v); }
export function shinkansenE4(v?: ParamValues): MeshBuilder { return buildSeries(E4, P.e4, v); }
export function shinkansenE4Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E4, P.e4, v); }

export const SHINKANSEN_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-shinkansen-n700s": N700S, "proc-vehicle-shinkansen-e5": E5, "proc-vehicle-shinkansen-500": S500, "proc-vehicle-shinkansen-700": S700,
  "proc-vehicle-shinkansen-e6": E6, "proc-vehicle-shinkansen-100": S100, "proc-vehicle-shinkansen-e4": E4,
};

/** A series' design: its builders (named exports of its module), parameters and gauge. */
export const seriesDesign = (id: string, title: string, s: ShinkansenSeries, params: ParamSpec[], b: (v?: ParamValues) => MeshBuilder, l: (v?: ParamValues) => MeshBuilder, refs: string, gauge: LoadingGauge = "shinkansen"): ProceduralDesign => ({
  id, title, build: b, buildLod: l, params, lodTriangles: s.single ? 100 : 500, game: gameOf(s, params), catalog: s.metro ? METRO_CATALOG : s.traction === "none" ? COACH_CATALOG : isDiesel(s) ? DMU_CATALOG : EMU_CATALOG, ...(gauge === "uic" ? {} : { loadingGauge: gauge }), references: refs,
});

export const SHINKANSEN_DESIGNS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-shinkansen-n700s", "Shinkansen N700S", N700S, P.n700s, shinkansenN700s, shinkansenN700sLod, "shinkansen-n700s"),
  seriesDesign("proc-vehicle-shinkansen-e5", "Shinkansen E5 / H5", E5, P.e5, shinkansenE5, shinkansenE5Lod, "shinkansen-e5"),
  seriesDesign("proc-vehicle-shinkansen-500", "Shinkansen 500 series", S500, P.s500, shinkansen500, shinkansen500Lod, "shinkansen-500"),
  seriesDesign("proc-vehicle-shinkansen-700", "Shinkansen 700 / 923", S700, P.s700, shinkansen700, shinkansen700Lod, "shinkansen-700"),
  seriesDesign("proc-vehicle-shinkansen-e6", "Shinkansen E6", E6, P.e6, shinkansenE6, shinkansenE6Lod, "shinkansen-e6"),
  seriesDesign("proc-vehicle-shinkansen-100", "Shinkansen 100 series", S100, P.s100, shinkansen100, shinkansen100Lod, "shinkansen-100"),
  seriesDesign("proc-vehicle-shinkansen-e4", "Shinkansen E4 Max", E4, P.e4, shinkansenE4, shinkansenE4Lod, "shinkansen-e4"),
];
