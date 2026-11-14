// The later Shinkansen series: N700S, E5 (and the H5's livery), 500, 700 (and
// the 923 Doctor Yellow), E6, 100 and the double-deck E4 Max. One spec per
// series - car lengths, the nose's tables, liveries, window rows, doors and
// which cars raise a pantograph - drawn by the passenger car builder
// (usTransit.ts drawCar) on the carbody kit; each design builds the end car (the
// default), an intermediate car or the articulated train of 3 - 8 cars. Narrowed
// from their real 3.35 - 3.38 m to the Shinkansen gauge's 3.3 m (loadingGauge.ts;
// the E6, a mini-shinkansen, keeps its 2.945 m). See docs/models/shinkansen.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import { liftable } from "./liftable.ts";
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
import type { Vec3 } from "./meshCore.ts";

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
  /** A stripe of its own paint along the crown of every car, out to half width z on the roof's arc (the 500's blue-grey roof over silver sides); the distant model's roof takes it. */
  roofStripe?: { z: number; mat: string };
  /** This livery's sets' pantograph, in place of the series' (the 500's W sets' T-shaped wing, its V sets' single arm). */
  pantograph?: "single" | "diamond" | "wing";
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
  /** The door leaf's window rounded at this corner radius (with `doorGlassW`; half its width makes a porthole: the ICE T's). */
  doorGlassR?: number;
  /** A tilting train's section: the skirt top's and the bottom's half widths over W (default 0.97 and 0.9: the side tucked in under the belly) and the roof arc's superellipse power (default 2). */
  tiltSection?: { wa: number; wl: number; roofPower?: number };
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
  /** With a cab face: the end car's crown still rising behind the face's join, [d behind the body's front, crown height] (the 500's roof reaching full height behind its first door). */
  endCrown?: Pt[];
  /** The body's slice spacing along `endCrown`'s table (default 0.25 m): a long, gentle crown table needs fewer slices (the ICE 4's). */
  endCrownStep?: number;
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
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: s.lean, arc: s.arc ?? 8, B: s.B, wl: s.W * (s.tiltSection?.wl ?? 0.9), A: s.A, wa: s.W * (s.tiltSection?.wa ?? 0.97),
      ...(s.tiltSection?.roofPower !== undefined ? { roofPower: s.tiltSection.roofPower } : {}),
      ...(end && !s.flatCab && !s.cabFace ? { front: s.nose, ...(s.single ? { rear: s.nose } : {}) } : {}),
      ...(end && s.flatCab && s.cabNose ? { front: s.cabNose, ...(s.single ? { rear: s.cabNose } : {}) } : {}),
      // a crown rising behind a cab face: a nose of the body's full plan whose crown table ends past the join
      ...(end && s.cabFace && s.endCrown ? { front: { len: 1e-3, tip: 1, power: 2, C: s.endCrown, S: [[0, s.S]] } } : {}), cuts: jacobsCuts(s, end, L, tr, reach, joint), edges: [], step: 1.0, noseStep: end && s.cabFace && s.endCrown ? (s.endCrownStep ?? 0.25) : 0.25,
    },
    bands: (end && l.endBands) || l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    ...(end && s.cabPanel ? { field: { d: s.cabPanel.d, y: s.cabPanel.y, mat: "cabPanel" } } : {}),
    windows: power ? [{ y: power.windows, spans, frame: "rubber" }] : s.windows.map((y, r) => ({ y, spans: own?.rows?.[r] ? own.rows[r]!.map(([a, e]): [number, number] => [a, e]) : end && s.endSides && r > 0 ? [] : r > 0 && s.upperOverDoors ? row(end ? doors[0]![0] : 0.6, s.single ? L - doors[0]![0] : L - 0.6) : spans, frame: "rubber" })),
    ...(s.fluting ? { fluting: s.fluting } : {}),
    doors: { spans: doors, y: [s.door[0], s.door[1]], glass: [s.door[2], s.door[3]], ...(s.doorGlassW ? { glassW: s.doorGlassW } : {}), ...(s.doorGlassPair ? { glassPair: s.doorGlassPair } : {}), ...(s.doorGlassR ? { glassCornerR: s.doorGlassR } : {}), ...(own && !(end && s.endSides) ? { slides: own.doors.map((o) => o[2]) } : {}) },
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
      if (l.roofStripe) m.scope("roof stripe", () => { for (const sd of [1, -1]) crownPane(m, b, X, sd, l.roofStripe!.mat, [0, L], [0, l.roofStripe!.z], 0.004); });
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
          const kind = l.pantograph ?? s.pantograph;
          if (kind === "diamond") diamond(m, { xc: x, roofY: s.C + 0.05, baseY: s.C + 0.35, raised });
          else if (kind === "wing") wingPantograph(m, x, s.C + 0.05, raised, l.roofStripe?.mat ?? l.roof);
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
  const roof = l.roofStripe?.mat ?? l.roof;
  const side: LodBand[] = [...((end && l.endBands) || l.bands).map(([a, e, mt]): [number, number, string] => [Math.max(a, s.B), Math.min(e, s.S), mt]).filter(([a, e]) => e > a + 1e-6), [s.S, s.C, roof]];
  const at = (y: number) => { for (let k = 0; k <= 2000; k++) { const d = k * 0.01; if (b.B(d) <= y && b.C(d) >= y) return d; } return 0; };
  const ys = [s.B, s.Y, (s.Y + s.S) / 2, s.S, (s.S + s.C) / 2, s.C - 0.02];
  const spans = def.windows[0]!.spans;
  let body: UnitBody = {
    y0: s.B, hw: [[s.B, s.W * (s.tiltSection?.wl ?? 0.9)], [s.A, s.W * (s.tiltSection?.wa ?? 0.97)], [s.Y, s.W], [s.S, s.W * s.lean], [s.C, 0.4]], side, roof,
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
/** n7Top by (lat, y): the face's grid and its paint query the same points many times; a pure function, so cached (same bytes). */
const N7_TOP = new Map<number, Map<number, number>>();
const n7TopCached = (lat: number, y: number): number => {
  let row = N7_TOP.get(y);
  if (!row) N7_TOP.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = n7Top(lat, y); row.set(lat, v); }
  return v;
};
const N7_SN = new Map<number, readonly [number, number]>();
const n7SnoutAt = (y: number): readonly [number, number] => {
  let v = N7_SN.get(y);
  if (!v) N7_SN.set(y, (v = [n7(N7_SNOUT, y), n7(N7_PROFILE, y)]));
  return v;
};
const n7Reshape = (lat: number, y: number, d: number): number => {
  const [sn, pr] = n7SnoutAt(y);
  return Math.max(sn + d - pr, n7TopCached(lat, y));
};

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
/**
 * The windscreen seen head-on (J30 at Nozomi, J22, Kyoto; the user's close-up of J30): a wide, low
 * opening in a grey frame on the canopy's front - its top nearly level under the canopy's crown, its
 * ends rounded - holding a wide centre pane (a little wider at its top, no centre pillar) and, behind
 * a grey pillar each side, a D-shaped side pane wrapping round the canopy's corner, its outer edge
 * leaning in toward the top. [lat, y]; the side panes for the viewer's side sd.
 */
/** A symmetric outline from its right half (bottom centre round to top centre). */
const n7Mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
const N7_FRAME: Pt[] = n7Mirror([[0, 2.285], [0.5, 2.285], [0.7, 2.29], [0.77, 2.32], [0.795, 2.38], [0.79, 2.48], [0.76, 2.6], [0.71, 2.72], [0.64, 2.83], [0.57, 2.91], [0.48, 2.955], [0.3, 2.97], [0, 2.975]]);
const N7_CENTRE: Pt[] = n7Mirror([[0, 2.335], [0.39, 2.335], [0.42, 2.35], [0.435, 2.4], [0.455, 2.85], [0.44, 2.9], [0.4, 2.92], [0, 2.925]]);
const n7SidePane = (sd: number): Pt[] =>
  ([[0.495, 2.345], [0.69, 2.34], [0.74, 2.37], [0.752, 2.45], [0.735, 2.56], [0.695, 2.67], [0.64, 2.77], [0.585, 2.85], [0.53, 2.89], [0.51, 2.88]] as Pt[]).map(([l, y]): Pt => [sd * l, y]);
/** The single wiper parked up the centre pane from its pivot near the bottom, as short pieces (a decal follows the curved glass only at its corners). */
const N7_WIPER: Array<[Pt, Pt]> = Array.from({ length: 6 }, (_, i): [Pt, Pt] => {
  const at = (t: number): Pt => [0.06 - 0.36 * t, 2.37 + 0.36 * t];
  return [at(i / 6), at((i + 1) / 6)];
});
/** The centre pane's lighter, blue-green glass (the photographs); the side panes, seen at a slant, are dark. */
const N7_GLASS: MaterialSpec = { color: "#3d6b74", metallic: 0.4, roughness: 0.08, glass: true };

const N700S_FACE: SeriesCabFace = {
  dJoin: N7_JOIN, dSide: 6.0, first: N7_JOIN + 1.3, reach: 0, roofFrom: 9, wrap: true, cols: [10, 10, 1, 2], tolerance: 0.03,
  profile: N7_PROFILE, corner: [...N7_CORNER], cornerDepth: [...N7_DEPTH], rows: N7_ROWS, reshape: n7Reshape,
  // the lower snout in the skirt's colour (silver grey, JR Kyushu's red), white above
  bands: (l) => [[0, 0.9, l.bands[0]![2]], [0.9, 9, "white"]],
  // the windscreen: the grey frame, the centre pane (no centre pillar) and the two side panes, a single wiper
  fields: [{ mat: "screenFrame", pts: N7_FRAME }, { mat: "n7Glass", pts: N7_CENTRE }, { mat: "cabGlass", pts: n7SidePane(1) }, { mat: "cabGlass", pts: n7SidePane(-1) }, { mat: "cabMask", pts: n7Lamp(1, 0.14) }, { mat: "cabMask", pts: n7Lamp(-1, 0.14) }, { mat: "cabGlass", pts: n7Lamp(1, 0) }, { mat: "cabGlass", pts: n7Lamp(-1, 0) }, { mat: "lampHead", pts: n7Lamp(1, -0.35) }, { mat: "lampHead", pts: n7Lamp(-1, -0.35) }],
  // the windscreen is paint; the distant model's glass inside its outline
  panes: [], lodGlass: { hw: 0.74, y: [2.33, 2.92] },
  wipers: N7_WIPER,
};

/** A thin line of paint along a centre line (d, y; y ascending) as a sweep's front and back edges by height. */
function n7Line(pts: ReadonlyArray<readonly [number, number]>, t: number): { front: Pt[]; back: Pt[] } {
  const dAt = (y: number) => edgeAt(pts.map(([d, yy]): Pt => [yy, d]), y);
  const [y0, y1] = [pts[0]![1], pts[pts.length - 1]![1]];
  const ys = Array.from({ length: 13 }, (_, i) => y0 + ((y1 - y0) * i) / 12);
  return { front: ys.map((y): Pt => [y, dAt(y - t / 2)]), back: ys.map((y): Pt => [y, dAt(y + t / 2)]) };
}

const N7_PALETTE = { white: c("#f3f3f0"), roofG: c("#e8e8e5", 0.6), cabMask: c("#1b1d20", 0.3), screenFrame: c("#9ca3aa", 0.35), n7Glass: N7_GLASS };

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
      title: "JR Kyushu", palette: { ...N7_PALETTE, red: c("#c8102e", 0.45), kBlack: c("#141517", 0.35), screenFrame: c("#202226", 0.3) },
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

/**
 * The E5's paint on its nose (photo-e5-s11-sendai-20090725.jpg near side-on, 46 - 53 px/m; the
 * E514-1, H514-1, U2, U15 and U44 photographs): the tokiwa green sweeps down from the roof over the
 * whole nose to the tip, where its edge crosses the coupler hatch at mid height; along the nose's
 * sides the edge runs level back to 4.5 m and then climbs over the white cheek to meet the stripe at
 * the body. The pink (the H5's purple) stripe runs forward from the body below that edge and dies
 * out on it 9 m behind the tip. Edges are [y, d behind the tip].
 */
const E5_GREEN_EDGE: Pt[] = [[1.27, 4.5], [1.32, 6.0], [1.45, 6.7], [1.68, 7.4], [1.9, 9.0], [2.06, 11.0], [2.17, 13.0], [2.22, 15.0]];
const E5_STRIPE_FOOT: Pt[] = [[1.88, 9.0], [1.95, 11.0], [2.03, 13.0], [2.079, 15.0], [2.08, 99]];
const E5_STRIPE: readonly [number, number] = [2.08, 2.22];

/** The coupler hatch's seam on the nose's tip: an ellipse across the front, [lat, y] corners of short bars. */
function e5HatchSeam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [cy, a, b, t, n] = [1.25, 0.98, 0.38, 0.022, 28];
  return Array.from({ length: n }, (_, i) => {
    const [p, q] = [(2 * Math.PI * i) / n, (2 * Math.PI * (i + 1)) / n];
    const o = (th: number, k: number): Pt => [(a + k) * Math.cos(th), cy + (b + k) * Math.sin(th)];
    return { mat: "rubber", pts: [o(p, -t), o(q, -t), o(q, t), o(p, t)], fine: 2 };
  });
}

/**
 * The E5's 15 m nose (the photographs above, the published 15 m): long and low, its tip at the coupler
 * (1.15 m) under a rounded hatch, the top rising in a gentle line (1.94 m 2.3 m back, 2.27 m at 6 m),
 * staying low under the canopy and then rising to the roof at the join. The white lower jaw (up to
 * the hatch's middle, about two thirds of the tip's height head on) is a blunt spatula reaching full
 * width 2.2 - 3.1 m back; the green hood over it is narrower, its elliptic corners reaching full
 * width 5 - 8 m back, so the jaw shows round its cheeks. The canopy cab stands out of it as its own
 * bubble (`e5Canopy`).
 */
const E5_FACE: SeriesCabFace = {
  dJoin: 15.0, dSide: 2.0, first: 17.4, roofFrom: 3.0, reach: 0, cols: [2, 12, 1, 3], tolerance: 0.02,
  profile: [[0.5, 0.45], [0.6, 0.18], [0.75, 0.05], [0.9, 0.01], [1.05, 0], [1.15, 0], [1.27, 0.01], [1.35, 0.03], [1.5, 0.15], [1.62, 0.4], [1.72, 0.8], [1.82, 1.45], [1.94, 2.3], [2.03, 3.2], [2.15, 4.1], [2.2, 5.1], [2.27, 6.0], [2.35, 7.3], [2.45, 8.6], [2.6, 9.9], [2.85, 11.0], [3.2, 11.9], [3.5, 12.8], [3.62, 13.8], [3.65, 15.0]],
  corner: [[0.5, 1.0], [1.27, 1.1], [1.35, 1.45], [3.0, 1.4], [3.65, 1.0]],
  cornerDepth: [[0.5, 2.2], [0.75, 2.4], [0.95, 2.6], [1.15, 2.9], [1.27, 3.1], [1.35, 5.0], [1.55, 7.0], [1.72, 7.8], [1.94, 8.0], [2.15, 7.6], [2.27, 6.0], [2.35, 5.0], [2.45, 4.0], [2.6, 3.1], [2.85, 2.4], [3.2, 2.0], [3.5, 1.6], [3.62, 1.15], [3.65, 0.02]],
  rows: [0.5, 0.6, 0.75, 0.9, 1.05, 1.15, 1.27, 1.35, 1.5, 1.62, 1.72, 1.82, 1.94, 2.03, 2.15, 2.27, 2.35, 2.45, 2.6, 2.85, 3.2, 3.5, 3.62, 3.65],
  bands: () => [[0, 1.27, "white"], [1.27, 9, "green"]],
  paint: [
    // the white lower nose round the tip and along its sides, ahead of the grey skirt
    { mat: "white", front: [[0.5, -9], [1.27, -9]], back: [[0.5, 3.5], [1.27, 4.5]], top: 1.27 },
    { mat: "white", front: E5_GREEN_EDGE, back: [[1.27, 99], [2.08, 99]], top: 2.08 },
    { mat: "stripe", front: E5_GREEN_EDGE.filter(([y]) => y >= 1.88), back: E5_STRIPE_FOOT, top: E5_STRIPE[1] },
    { mat: "green", front: [[1.27, -9], [2.22, -9]], back: E5_GREEN_EDGE, top: E5_STRIPE[1] },
  ],
  decals: e5HatchSeam(),
  panes: [],
};

/** The canopy's crown behind its rounded front (d behind the tip, height), out to where it sinks under the roof. */
const E5_CANOPY_TOP: Pt[] = [[7.4, 3.06], [8.4, 3.14], [9.5, 3.2], [10.1, 3.25], [11.0, 3.33], [12.0, 3.42], [12.6, 3.46], [13.2, 3.49]];
/** The nose's own centre line under it (the face's profile, d to height). */
const E5_NOSE_TOP: Pt[] = [[5.1, 2.2], [6.0, 2.27], [7.3, 2.35], [8.6, 2.45], [9.9, 2.6], [11.0, 2.85], [11.9, 3.2], [12.8, 3.5], [13.8, 3.62], [15.0, 3.65]];

/**
 * The E5's canopy cab (photo-h514-1-omiya-20160327.jpg, photo-e5-s11-sendai-20090725.jpg,
 * photo-series-e5-u15-yamabiko-50.jpg, photo-e5-u2.jpg): a green bubble 1.7 - 1.9 m wide rising out
 * of the nose 6 m behind the tip and sinking under the roof by 13 m, its front a quarter ellipsoid
 * (round in plan and in profile). Its windscreen is one dark glass on the front, seen head-on a wide
 * trapezoid: a level top edge (2.94 m, falling to the rear so that it reads level from slightly
 * above) under the green crown, a level foot (2.5 m), the sides the canopy's own flanks narrowing to
 * the top; it wraps round the front corners into the side windows (a thin pillar between), their
 * foot rising to meet the top 9.7 m behind the tip. A thin black seal rings it; the four headlights
 * stand inside the glass under its top edge. Every edge is a height line laid on fixed section
 * angles (with a section where an edge crosses the crown or the window closes), so the paint follows
 * the surface without steps. Drawn on its own, sunk into the nose.
 */
function e5Canopy(m: MeshBuilder, X: (d: number) => number, dJoin: number): void {
  // the canopy from its front foot (d0, buried in the nose) over its rounded front (to dFront) to under the roof (d1)
  const [d0, dFront, d1] = [5.85, 7.4, 13.0];
  // the crown: a quarter ellipse up the front (piercing the nose 6 m back, 3.06 m at dFront), then the table
  const top = (d: number) => (d < dFront ? 2.05 + 1.01 * Math.sqrt(Math.max(0, 1 - ((dFront - d) / (dFront - d0)) ** 2)) : edgeAt(E5_CANOPY_TOP, d));
  const base = (d: number) => edgeAt(E5_NOSE_TOP, d) - 0.55;
  const hgt = (d: number) => Math.max(0, top(d) - base(d));
  // the half width: round in plan over the front metre, widest 10.5 m back
  const W = (d: number) => {
    const w = d < 10.5 ? 0.86 + (Math.max(0, d - 7.3) / 3.2) * 0.1 : 0.96 - Math.min(1, (d - 10.5) / 2.5) * 0.12;
    const t = Math.min(1, Math.max(0, d - d0) / 1.0);
    return w * Math.sqrt(1 - (1 - t) * (1 - t));
  };
  // a section's shape: angle ph from the foot (0) to the crown (pi/2), a rounded superellipse
  const [PZ, PY] = [0.75, 0.7];
  const phOf = (d: number, y: number) => {
    const h = hgt(d), f = h > 1e-9 ? (y - base(d)) / h : 1;
    return f >= 1 ? Math.PI / 2 : f <= 0 ? 0 : Math.asin(Math.pow(f, 1 / PY));
  };
  // the surface's height over lateral z on the section at d
  const yAt = (d: number, z: number) => {
    const c = Math.pow(Math.min(1, Math.abs(z) / Math.max(W(d), 1e-6)), 1 / PZ);
    return base(d) + hgt(d) * Math.pow(Math.sqrt(Math.max(0, 1 - c * c)), PY);
  };
  // the glass between its foot (ybot, level on the front) and its top edge (ytop), the seal SEAL wide
  // round it and across it at the pillar (dPillar); past dEnd the foot overtakes the top and the side
  // window closes
  const SEAL = 0.03;
  const [yFoot, dLow, dEnd, dPillar] = [2.5, 6.7, 9.7, 7.6];
  const ytop = (d: number) => 2.94 - 0.1 * (d - 7.0);
  const ybot = (d: number) => yFoot + (ytop(dEnd) - yFoot) * Math.pow(Math.max(0, d - dLow) / (dEnd - dLow), 1.6);
  const edges = (d: number): [number, number, number, number] => {
    const mid = (ytop(d) + ybot(d)) / 2, half = (ytop(d) - ybot(d)) / 2;
    const [g, s] = [Math.max(0, half), Math.max(0, half + SEAL)];
    return [mid - s, mid - g, mid + g, mid + s];
  };
  const bisect = (f: (d: number) => number, a: number, b: number) => {
    let [lo, hi] = [a, b];
    for (let i = 0; i < 60; i++) { const md = (lo + hi) / 2; if ((f(lo) < 0) === (f(md) < 0)) lo = md; else hi = md; }
    return (lo + hi) / 2;
  };
  // the sections where an edge crosses the crown at the front, and where the side window closes
  const keys = [0, 1, 2, 3].map((i) => bisect((d) => top(d) - edges(d)[i]!, d0, dFront));
  const dShut = bisect((d) => ytop(d) - ybot(d) + 2 * SEAL, dLow, 12);
  const grid: number[] = [];
  for (let d = d0; d < d1 - 1e-9; d += d < 6.6 - 1e-9 ? 0.05 : d < 8 - 1e-9 ? 0.1 : 0.25) grid.push(d);
  const special = [...keys, dPillar, dPillar + SEAL, dEnd, dShut];
  const ds = [...grid.filter((d) => special.every((k) => Math.abs(d - k) > 0.02)), ...special, d1].sort((a, b) => a - b);
  // a half section's knots: the foot, the seal, the glass, the seal and the crown at fixed indices, so
  // that each edge runs along one line of facets; a knot above the crown sits on it (no facet), and
  // behind the closed side window the knots spread out evenly again over the crown
  const K = 22, KN = [0, 7, 8, 15, 16, K];
  const angles = (d: number): number[] => {
    const e = edges(d);
    const knots = [0, ...e.map((y) => phOf(d, y)), Math.PI / 2];
    const half = Array.from({ length: K + 1 }, (_, k) => {
      let i = 1;
      while (KN[i]! < k) i++;
      const [ka, kb] = [KN[i - 1]!, KN[i]!];
      return knots[i - 1]! + ((knots[i]! - knots[i - 1]!) * (k - ka)) / (kb - ka);
    });
    const w = d <= dShut ? 0 : Math.min(1, (d - dShut) / 0.8);
    const sm = w * w * (3 - 2 * w);
    return half.map((a, k) => a + (((Math.PI / 2) * k) / K - a) * sm);
  };
  // a section: from the left foot over the crown to the right foot (lat, y)
  const sec = (d: number): Array<[number, number]> => {
    const half = angles(d), all = [...half, ...half.slice(0, -1).reverse().map((a) => Math.PI - a)];
    return all.map((ph) => {
      const c = Math.cos(ph), s = Math.sin(ph);
      return [W(d) * Math.sign(c) * Math.pow(Math.abs(c), PZ), base(d) + hgt(d) * Math.pow(s, PY)];
    });
  };
  // a facet column's paint between two sections (dm between them): the glass and its seal, else green
  const column = (k: number, dm: number) => {
    const j = k < K ? k : 2 * K - 1 - k;
    if (dm > dShut || j < 7) return "green";
    if (j === 7 || j === 15) return "rubber";
    if (j < 15) return dm > dPillar && dm < dPillar + SEAL ? "rubber" : "e5Glass";
    return "green";
  };
  const P = (d: number, [z, y]: [number, number]): Vec3 => [X(d - dJoin), y, z];
  // each triangle wound to face away from the canopy's axis; a collapsed one (a knot on the crown) left out
  const out = (a: Vec3, b: Vec3, c: Vec3, ax: Vec3, mat: string) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 1e-14) return;
    const g = [(a[0] + b[0] + c[0]) / 3 - ax[0], (a[1] + b[1] + c[1]) / 3 - ax[1], (a[2] + b[2] + c[2]) / 3 - ax[2]];
    if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] >= 0) m.tri(mat, a, b, c);
    else m.tri(mat, a, c, b);
  };
  m.scope("skin", () => {
    for (let i = 0; i + 1 < ds.length; i++) {
      const [da, db] = [ds[i]!, ds[i + 1]!], [sa, sb] = [sec(da), sec(db)];
      const dm = (da + db) / 2, ax: Vec3 = [X(dm - dJoin), base(dm), 0];
      for (let k = 0; k < 2 * K; k++) {
        const mat = column(k, dm);
        out(P(da, sa[k]!), P(db, sb[k]!), P(db, sb[k + 1]!), ax, mat);
        out(P(da, sa[k]!), P(db, sb[k + 1]!), P(da, sa[k + 1]!), ax, mat);
      }
    }
  });
  // the four headlights in a row inside the glass under its top edge, standing just off its surface
  m.scope("headlights", () => {
    const dOn = (z: number, y: number) => bisect((d) => yAt(d, z) - y, d0 + 0.05, dFront);
    const Q = (z: number, y: number): Vec3 => P(dOn(z, y) - 0.012, [z, y + 0.004]);
    const [y0, y1, w] = [2.855, 2.91, 0.06];
    for (const z of [-0.29, -0.1, 0.1, 0.29]) {
      const ax: Vec3 = [X(dFront - dJoin), base(dFront), 0];
      out(Q(z - w, y0), Q(z + w, y0), Q(z + w, y1), ax, "lampHead");
      out(Q(z - w, y0), Q(z + w, y1), Q(z - w, y1), ax, "lampHead");
    }
  });
}

/** The E5's own fittings: the canopy on the end car, the plain underfloor box on every car. */
function e5Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("canopy", () => e5Canopy(m, X, E5_FACE.dJoin));
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), E5.B - 0.35, E5.B, -E5.W * 0.8, E5.W * 0.8));
}

/** The E5's tokiwa green, sampled from the photographs in diffuse light. */
const E5_GREEN = "#0f8676";
/** The canopy's windscreen: a very dark navy, glossy glass, the cab barely seen through it (the photographs). */
const E5_GLASS: MaterialSpec = { color: "#141c28", metallic: 0.2, roughness: 0.05, glass: true };

export const E5: ShinkansenSeries = {
  endLength: 26.5, midLength: 25.0, W: 1.62, Y: 1.45, S: 3.0, C: 3.65, lean: 0.95, B: 0.5, A: 1.05,
  // the 15 m nose with its canopy cab, drawn as a cab face (E5_FACE) and the canopy (e5Fittings)
  nose: nose(0.1, 1, 2, [[0, 3.65]], [[0, 3.0]], [[0, 1.45]], [[0, 1.05]], [[0, 0.75]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: E5_FACE, fittings: e5Fittings,
  // the distant canopy: its glass visor
  lodRoof: { d: [6.0, 9.4], hw: 0.82, y: [2.3, 2.95], mat: LOD_GLASS },
  // the windows standing on the stripe; the door's narrow window high in the leaf; the crew door
  // ahead of the passenger door behind the nose
  windows: [[2.25, 2.72]], windowW: 0.66, pitch: 1.04, door: [1.3, 3.2, 2.45, 3.0], doorW: 1.0, doorGlassW: 0.3,
  sidePanels: { end: [{ d: [15.3, 16.25], y: [1.35, 3.2], kind: "seam" }, { d: [15.62, 15.93], y: [2.45, 3.0], kind: "window" }] },
  // the leading bogie under the nose: 17.5 m bogie centres, the rear bogie 3.5 m from the inner end
  endBogies: [5.25 - 15.0, 22.75 - 15.0],
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    hayabusa: { title: "E5 Hayabusa", palette: { green: c(E5_GREEN), white: c("#eff0ee"), stripe: c("#e2509a"), roofG: c(E5_GREEN, 0.5), skirtG: c("#d9d9d6"), e5Glass: E5_GLASS }, bands: [[0, E5_STRIPE[0], "white"], [E5_STRIPE[0], E5_STRIPE[1], "stripe"], [E5_STRIPE[1], 9, "green"]], roof: "roofG", skirt: "skirtG", number: "E514-1" },
    h5: { title: "H5 Hokkaido", palette: { green: c(E5_GREEN), white: c("#eff0ee"), stripe: c("#7a4a9e"), roofG: c(E5_GREEN, 0.5), skirtG: c("#d9d9d6"), e5Glass: E5_GLASS }, bands: [[0, E5_STRIPE[0], "white"], [E5_STRIPE[0], E5_STRIPE[1], "stripe"], [E5_STRIPE[1], 9, "green"]], roof: "roofG", skirt: "skirtG", number: "H514-1" },
  },
  weight: { end: 46, middle: 45 }, power: 1200, maxspeed: 320,
};

// --- the 500 series ------------------------------------------------------------
//
// Read from the side-on photo of the V5 end car at Himeji (photo-500kei-himeji.jpg, 84 px/m from
// the 3.69 m body height and the 1.70 m door), the W2 end car 521-2 and the V2 end car 521-7002 at
// three quarters, and 521-1 at the Kyoto Railway Museum head on (assets/shinkansen-500/SOURCES.md).
// Heights over the rail, d behind the nose's tip.
//
// The nose: the tip at 0.79 m, a flat oval snout rising at a third to the canopy's foot 2.75 m back at
// 1.92 m; the fighter-like canopy (glass, then a dark hood) on top from 2.75 to 8.6 m; the roof still
// rising behind the first door (3.49 m at the join, 9.65 m, full 3.69 m 14 m back). In plan the nose
// rounds to a blunt spatula (elliptic corners): its lower half full width 6.5 m behind its centre line,
// its top at the join. A blue-grey tongue covers the top from the tip round the domed canopy into the
// roof's stripe; a crease runs round the snout at 1.0 m, the lower body's edge. The first door 9.8 -
// 10.45 m, the window band (dark, the blue band under it) from 10.86 m, windows 1.01 m apart.
const S500_JOIN = 9.65;
const S500_PROFILE: Pt[] = [
  [0.3, 1.9], [0.4, 1.2], [0.5, 0.62], [0.6, 0.32], [0.7, 0.12], [0.79, 0], [0.88, 0.03], [0.97, 0.2], [1.07, 0.47], [1.18, 0.74], [1.29, 1.0], [1.48, 1.5], [1.64, 2.0], [1.8, 2.5],
  [1.92, 2.78], [2.1, 3.15], [2.3, 3.6], [2.5, 4.07], [2.64, 4.45], [2.78, 4.8], [2.89, 5.1], [3.07, 6.0], [3.19, 7.0], [3.31, 8.0], [3.43, 9.0], [3.49, S500_JOIN],
];
/** The tongue's edge on the nose's sides ([y, d]): just under the snout's top, under the canopy, back into the roof stripe at the join. */
const S500_TONGUE: Pt[] = [[1.03, 0.3], [1.08, 0.55], [1.2, 1.1], [1.4, 1.8], [1.6, 2.5], [1.8, 3.15], [2.0, 3.8], [2.3, 4.7], [2.6, 5.7], [2.75, 6.6], [2.8, 8.0], [3.1, 9.0], [3.4, 9.66], [3.6, 9.66]];
/** A polygon from its right half ([lat, y], from the bottom of the centre line to its top), mirrored. */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
const S500_ROWS = [...new Set([...S500_PROFILE.map(([y]) => y), 1.0, 1.02, 1.4, 2.0, 2.2, 2.4, 2.6, 2.7, 2.83, 3.0, 3.1, 3.25, 3.33, 3.37])].sort((a, b) => a - b);
const S500_FACE: SeriesCabFace = {
  dJoin: S500_JOIN, reach: 0, first: S500_JOIN + 1.15, roofFrom: 9, cols: [1, 14, 1, 1], tolerance: 0.02,
  profile: S500_PROFILE,
  // a round nose: the corner is the whole half width, as deep as the nose ahead of the join
  corner: [[0.3, 2.0], [3.49, 2.0]],
  // the snout's lower half blunter: full width 6.5 m behind its centre line up to the tip's height, the top reaching it at the join
  cornerDepth: S500_PROFILE.map(([y, d]): Pt => { const t = Math.min(1, Math.max(0, (y - 1.1) / 0.8)); return [y, Math.max(0.05, Math.min(S500_JOIN - d, 6.5 + t * 9))]; }),
  rows: S500_ROWS,
  bands: (l) => [[0, 9, l.bands[0]![2]]],
  lodBands: [[0, 1.6, "silver"], [1.6, 9, "tongue"]],
  lod: { profile: [...S500_PROFILE.slice(0, -1), [3.69, S500_JOIN]], corner: [[0.3, 2.0], [3.69, 2.0]], rows: [0.3, 0.5, 0.79, 1.29, 1.92, 2.64, 3.07, 3.43, 3.69] },
  paint: [
    { mat: "tongue", front: [[1.03, -9], [3.7, -9]], back: S500_TONGUE, top: 9 },
    { mat: "crease", front: [[1.0, -9], [1.02, -9]], back: [[1.0, 99], [1.02, 99]] },
  ],
  fields: [
    // the canopy: its dark frame and hood, the glass in it (lat, y); the hood's rear end 8.6 m back
    { mat: "canopy", pts: mirror([[0, 1.92], [0.45, 1.97], [0.68, 2.1], [0.8, 2.35], [0.86, 2.7], [0.84, 3.05], [0.7, 3.25], [0.4, 3.34], [0, 3.37]]) },
    { mat: "cabGlass", pts: mirror([[0, 2.06], [0.42, 2.1], [0.62, 2.22], [0.74, 2.45], [0.79, 2.75], [0.76, 2.9], [0.6, 3.08], [0, 3.14]]) },
  ],
  panes: [],
  // the headlights in the canopy's dark foot, under the glass
  lamps: [[-0.6, 2.13, 0.05, "lampHead"], [-0.47, 2.05, 0.045, "lampHead"], [-0.32, 2.01, 0.035, "lampRed"], [0.32, 2.01, 0.035, "lampRed"], [0.47, 2.05, 0.045, "lampHead"], [0.6, 2.13, 0.05, "lampHead"]],
};
const S500_BLUE_GREY = "#8a90b6";
const s500Palette = (top: string, band: string, stripe = top): Record<string, MaterialSpec> => ({
  stripe: c(stripe, 0.4), silver: c("#c4cacf", 0.3), dark: c("#353c44", 0.4), blue: c(band), tongue: c(top, 0.35), crease: c("#5c6168", 0.6), canopy: c("#4a5159", 0.3), roofG: c("#b3b9bf", 0.4), skirtG: c("#b8bec3", 0.45),
});
// the window band dark, a blue band under it; silver ahead of the window band round the first door
const s500Bands = (): Band[] => [[0, 1.83, "silver"], [1.83, 2.14, "blue"], [2.14, 2.77, "dark"], [2.77, 9, "silver"]];
const S500_SWEEPS: ShinkansenLivery["endSweeps"] = [{ mat: "silver", front: [[1.8, -9], [2.8, -9]], back: [[1.8, 10.86], [2.8, 10.86]] }];

export const S500: ShinkansenSeries = {
  endLength: 27.0, midLength: 25.0, W: 1.6, Y: 1.5, S: 2.8, C: 3.69, lean: 0.93, B: 0.75, A: 1.05,
  nose: nose(14.0, 0.03, 2.0, [[0, 1.55], [15.0, 3.69]], [[0, 1.5], [15.0, 2.6]], [[0, 1.45], [8.0, 1.3]], [[0, 1.4], [3.0, 1.1]], [[0, 1.35], [3.0, 0.75]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S500_FACE,
  endCrown: [[0, 3.49], [0.35, 3.52], [1.35, 3.585], [2.35, 3.63], [3.35, 3.665], [4.35, 3.69]],
  // small windows in the dark band, 1.04 m apart; narrow single-leaf plug doors with a narrow window high up
  windows: [[2.2, 2.73]], windowW: 0.69, pitch: 1.04, door: [1.31, 3.0, 2.2, 2.72], doorW: 0.7, doorGlassW: 0.3,
  // the leading bogie 5.4 m behind the tip (the photo's wheels), the rear one 17.5 m behind it
  endBogies: [5.4 - S500_JOIN, 5.4 - S500_JOIN + 17.5],
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5, fittings: s500Fittings,
  // windows 1.01 m apart from 10.86 m behind the tip (body d 1.54), a door at each end
  layout: {
    end: { doors: [[0.15, 0.85, 1], [14.93, 15.63, 1]], windows: Array.from({ length: 13 }, (_, i): [number, number] => [1.54 + i * 1.01, 2.23 + i * 1.01]) },
    middle: { doors: [[0.6, 1.3, -1], [23.2, 23.9, 1]], windows: Array.from({ length: 21 }, (_, i): [number, number] => [2.0 + i * 1.01, 2.69 + i * 1.01]) },
  },
  liveries: {
    // the W sets: a lavender-grey top and roof, the T-shaped wing pantographs
    original: { title: "Nozomi", palette: s500Palette(S500_BLUE_GREY, "#34529f"), bands: s500Bands(), roof: "roofG", skirt: "skirtG", number: "521-1", endSweeps: S500_SWEEPS, roofStripe: { z: 0.75, mat: "stripe" }, pantograph: "wing" },
    // the V sets: a brighter blue top, single-arm pantographs
    kodama: { title: "Kodama", palette: s500Palette("#3d5f9c", "#3f63ad", "#6f7a96"), bands: s500Bands(), roof: "roofG", skirt: "skirtG", number: "521-7001", endSweeps: S500_SWEEPS, roofStripe: { z: 0.75, mat: "stripe" }, pantograph: "single" },
  },
  weight: { end: 41, middle: 40 }, power: 1140, maxspeed: 300,
};

/** The 500's underfloor and, on the end car, the bogie fairings ahead of and beside the leading bogie: capsules on the nose's sides. */
function s500Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  // the side skirt down to 0.31 m between the bogies' cuts (and from inside the nose over its join)
  const [t0, t1, reach] = [car.trucks[0]!, car.trucks[1]!, 2.5 / 2 + 0.43 + 0.25];
  const spans: Array<[number, number]> = car.end ? [[-0.3, t1 - reach], [t1 + reach, car.length - 0.02]] : [[0.02, t0 - reach], [t0 + reach, t1 - reach], [t1 + reach, car.length - 0.02]];
  m.scope("underfloor", () => { for (const [a, e] of spans) if (e > a + 0.05) block(m, "skirtG", X(e), X(a), 0.31, 0.76, -1.41, 1.41); });
  if (!car.end) return;
  m.scope("bogie fairings", () => {
    // d spans behind the tip; each a capsule of 8 sides round lat 1.36, 0.49 m up
    for (const [d0, d1] of [[3.25, 4.4], [4.4, 6.25], [6.25, 7.5]] as const)
      for (const sd of [1, -1]) {
        const ring = (k: number): Ring => Array.from({ length: 8 }, (_, i): [number, number] => { const a = (i / 8) * Math.PI * 2; return [sd * 1.36 + 0.1 * k * Math.cos(a), 0.49 + 0.16 * k * Math.sin(a)]; });
        const xa = X(d0 - S500_JOIN), xb = X(d1 - S500_JOIN), n = 4;
        // rounded ends: the section grows over the first and last 0.35 m
        const at = (t: number) => Math.sqrt(Math.max(0.04, 1 - Math.pow(Math.max(0, Math.abs(2 * t - 1) * (d1 - d0) / 2 - ((d1 - d0) / 2 - 0.35)) / 0.35, 2)));
        for (let i = 0; i < n; i++) m.sweep("skirtG", "x", ring(at(i / n)), xa + ((xb - xa) * i) / n, ring(at((i + 1) / n)), xa + ((xb - xa) * (i + 1)) / n, i === 0 || i === n - 1);
      }
  });
}

/**
 * A T-shaped wing pantograph (the 500's W sets): one streamlined post hinged at its foot, folding
 * flat toward +X, carrying a level wing with its carbon strip; on a low shroud of `shroud` paint.
 */
function wingPantograph(m: MeshBuilder, x: number, roofY: number, raised: boolean, shroud: string): void {
  const baseY = roofY + 0.25, post = RAIL_COLLECTOR_TOP - 0.12 - (baseY + 0.1);
  m.scope("shroud", () => {
    for (const sd of [1, -1]) m.slab(shroud, [[x - 2.2, roofY - 0.01, sd * 0.78], [x + 2.2, roofY - 0.01, sd * 0.78], [x + 1.6, roofY + 0.42, sd * 0.78], [x - 1.6, roofY + 0.42, sd * 0.78]], [0, 0, -sd * 0.05]);
  });
  m.scope("insulators", () => { for (const dx of [-0.25, 0.25]) insulator(m, x + dx, 0, roofY - 0.01, baseY); });
  m.scope("base", () => block(m, "pantograph", x - 0.35, x + 0.35, baseY, baseY + 0.08, -0.12, 0.12));
  const draw = (mm: MeshBuilder, lift: number) => {
    const a = (lift * Math.PI) / 2, [px, py] = [x - 0.2, baseY + 0.1];
    const [tx, ty] = [px + post * Math.cos(a), py + post * Math.sin(a)];
    mm.scope("post", () => mm.rod("pantograph", [px, py, 0], [tx, ty, 0], 0.055, 8));
    mm.scope("wing", () => {
      mm.rod("pantograph", [tx, ty + 0.04, -0.9], [tx, ty + 0.04, 0.9], 0.04, 8);
      block(mm, "carbon", tx - 0.025, tx + 0.025, ty + 0.08, ty + 0.12, -0.6, 0.6);
    });
  };
  if (raised) liftable(m, "pantograph", draw);
  else draw(m, 0);
}


// The 700's cab face (assets/shinkansen-700/SOURCES.md; docs/models/shinkansen.md, "The 700"): the
// "duck bill" (aero-stream) nose, 9.5 m to the full section. A broad, low beak with its tip at 1.1 m
// rounds forward of the cab, its top rising gently to the slit headlights; the cab stands up behind it,
// narrower, the windscreen's front pane and its wrapped side panes in one dark surround from 2.43 m to
// 3.0 m; deep elliptic corners carry the face back to the body's sides. The side's two blue bands end
// on the nose in points, the thick one ahead of the thin one.
const S700_DJOIN = 9.5;
/** The end car's body behind the face (endLength less the coupling gap and the face; the tip on the coupling plane). */
const S700_END_BODY = 27.35 - 0.25 - S700_DJOIN;
/** The sides' bands (body the livery's own colour): the thick blue band under the windows, the thin one under it. */
const S700_BANDS: readonly Band[] = [[0, 1.47, "body"], [1.47, 1.56, "blue"], [1.56, 1.64, "body"], [1.64, 1.93, "blue"], [1.93, 9, "body"]];
/** The lamp housings' outline, viewer's right (mirrored for the left): a slit under the windscreen, its outer end slanted. */
const S700_LAMP: Pt[] = [[0.13, 2.12], [0.74, 2.12], [0.82, 2.23], [0.15, 2.23]];
const S700_FACE: SeriesCabFace = {
  dJoin: S700_DJOIN, dSide: S700_DJOIN - 0.4, reach: 0, first: 11.2, roofFrom: 3.3, cols: [8, 6, 3, 2], tolerance: 0.015,
  profile: [[0.75, 0.4], [0.85, 0.15], [0.95, 0.04], [1.05, 0.0], [1.25, 0.0], [1.45, 0.08], [1.65, 0.28], [1.85, 0.62], [2.05, 1.05], [2.25, 1.5], [2.45, 1.95], [2.7, 2.5], [2.95, 3.15], [3.15, 4.0], [3.35, 5.2], [3.5, 6.5], [3.6, 7.9], [3.65, S700_DJOIN]],
  // the plan: the beak broad with tight corners, the cab over it rounding back in deep elliptic corners
  corner: [[0.75, 0.6], [1.05, 0.55], [1.4, 0.65], [1.8, 0.8], [2.2, 0.9], [2.6, 0.95], [3.0, 1.0], [3.4, 1.0], [3.65, 0.4]],
  cornerDepth: [[0.75, 1.3], [1.05, 1.2], [1.4, 1.4], [1.8, 1.9], [2.2, 3.0], [2.6, 4.5], [3.0, 4.2], [3.4, 2.4], [3.65, 0.4]],
  // the cab hump narrower than the beak's cheeks (C1 head-on, 229 px/m: 2.79 m wide at the lamps, 2.69 m at the
  // windscreen's foot, the beak 3.38 m), flaring out to the body's sides behind the windscreen
  planInset: [[1.6, 0], [1.7, 0.02], [1.8, 0.06], [1.9, 0.12], [2.0, 0.18], [2.1, 0.23], [2.2, 0.27], [2.3, 0.3], [2.45, 0.32], [2.8, 0.32], [3.0, 0.3], [3.15, 0.25], [3.3, 0.17], [3.45, 0.08], [3.6, 0]],
  rows: [0.75, 0.82, 0.9, 0.97, 1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.65, 1.75, 1.85, 1.95, 2.05, 2.15, 2.25, 2.35, 2.45, 2.58, 2.7, 2.83, 2.95, 3.05, 3.15, 3.25, 3.35, 3.43, 3.5, 3.56, 3.6, 3.65],
  // the nose in the body's colour over a grey lip
  bands: () => [[0, 0.95, "skirtG"], [0.95, 9, "body"]],
  paint: [
    // the grey lip rising back along the nose's bottom to the skirt's top
    { mat: "skirtG", front: [[0.75, -9], [0.95, -9], [0.96, 1.8], [1.05, 3.6]], back: [[0.75, 99], [1.05, 99]] },
    // the bands' pointed ends: the thin band's cut slanted, the thick band's point near its top
    { mat: "body", front: [[1.45, -9], [1.95, -9]], back: [[1.45, 9.45], [1.47, 9.45], [1.56, 8.97], [1.64, 8.43], [1.86, 7.24], [1.93, 7.8], [1.95, 7.8]] },
    // the windscreen's dark surround, round the front pane and the side panes
    { mat: "cabMask", front: [[2.43, -9], [2.99, -9]], back: [[2.43, 3.95], [2.47, 4.0], [2.6, 4.5], [2.75, 4.8], [2.9, 5.0], [2.99, 4.85]] },
    // the side panes, wrapped round the cab's corners behind a pillar
    { mat: "cabGlass", front: [[2.47, 2.3], [2.7, 2.8], [2.95, 3.45]], back: [[2.47, 3.9], [2.6, 4.45], [2.75, 4.75], [2.9, 4.95], [2.95, 4.8]] },
  ],
  fields: [
    { mat: "cabMask", pts: S700_LAMP },
    { mat: "cabMask", pts: S700_LAMP.map(([x, y]): Pt => [-x, y]).reverse() },
    // the 923's black hatch on the beak's top (the body's colour on the 700)
    { mat: "hatch", pts: [[-0.42, 1.68], [0.42, 1.68], [0.38, 1.84], [-0.38, 1.84]] },
  ],
  panes: [{ lat: [-0.74, 0.74], y: [2.47, 2.95], r: 0.08, mat: "cabGlass" }],
  lamps: [[-0.62, 2.175, 0.045, "lampHead"], [-0.36, 2.175, 0.045, "lampHead"], [0.36, 2.175, 0.045, "lampHead"], [0.62, 2.175, 0.045, "lampHead"]],
};

export const S700: ShinkansenSeries = {
  endLength: 27.35, midLength: 25.0, W: 1.62, Y: 1.45, S: 3.0, C: 3.65, lean: 0.96, B: 0.75, A: 1.05,
  nose: nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S700_FACE,
  // the leading bogie under the nose, 17.5 m ahead of the rear one (3.5 m in from the rear end)
  endBogies: [S700_END_BODY - 21.0, S700_END_BODY - 3.5],
  // the crew door with its narrow window, ahead of the passenger door behind the nose
  sidePanels: { end: [{ d: [9.52, 10.02], y: [1.32, 3.0], kind: "seam" }, { d: [9.66, 9.9], y: [2.22, 2.78], kind: "window" }] },
  windows: [[2.0, 2.55]], windowW: 0.68, pitch: 1.04, door: [1.3, 3.05, 2.36, 2.88], doorW: 0.78, doorGlassW: 0.32,
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: {
    jrCentral: { title: "JR Central", palette: { body: c("#f3f3f0"), blue: c("#1a3f9a"), hatch: c("#f3f3f0"), cabMask: c("#3a3f46", 0.35), roofG: c("#e6e6e3", 0.6), skirtG: c("#b9bcbe", 0.5) }, bands: S700_BANDS, roof: "roofG", skirt: "skirtG", number: "724-54" },
    doctorYellow: { title: "Doctor Yellow", palette: { body: c("#f0cf12"), blue: c("#1d4596"), hatch: c("#1b1d20", 0.3), cabMask: c("#3a3f46", 0.35), roofG: c("#dcc02a", 0.6), skirtG: c("#9da1a4", 0.5) }, bands: S700_BANDS, roof: "roofG", skirt: "skirtG", number: "923-1" },
  },
  weight: { end: 45, middle: 43 }, power: 1100, maxspeed: 285,
};

// The E6's nose and paint, measured on assets/shinkansen-e6/: photo-e6-z8.jpg in near profile,
// rectified to true scale by a projective fit along the side (the tip, seven windows 0.89 m apart and
// the car's end 22.85 m back), heights from the rail and the roof (3.65 m); photo-e6-z14.jpg and
// photo-jr-east-e6-series-z5-in-tazawako-20130924.jpg head on; photo-e611-1.jpg and photo-e621-1.jpg in
// three-quarter view. Edges are [y, d behind the tip].
/** The cab face's join: the body's own section from here back (the door follows at once). */
const E6_JOIN = 11.95;
/** The red's lower sweep: its lower edge, level with the coupler at the snout, rising to its point 10.9 m back. */
const E6_RED_LOW: Pt[] = [[1.0, 0], [1.02, 1.0], [1.04, 2.0], [1.17, 4.5], [1.4, 7.0], [1.66, 9.5], [2.0, 10.9], [2.02, 10.9]];
/** The white wedge's lower edge (the red sweep's upper one), from its point at the headlights. */
const E6_WEDGE_LOW: Pt[] = [[1.43, 4.4], [1.61, 7.0], [1.84, 9.5], [2.04, 10.9]];
/** The white wedge's upper edge (the silver arrow's lower one), up to the roof's edge at the join. */
const E6_WEDGE_TOP: Pt[] = [[1.43, 4.4], [2.02, 5.75], [2.09, 6.5], [2.34, 7.0], [2.6, 8.25], [2.8, 9.5], [2.96, 10.75], [3.1, E6_JOIN]];
/** The silver arrow's upper edge (the red's lower one), 0.11 m over the wedge. */
const E6_ARROW_TOP: Pt[] = [[1.43, 4.2], [1.6, 4.65], [2.1, 5.75], [2.17, 6.5], [2.43, 7.0], [2.69, 8.25], [2.89, 9.5], [3.05, 10.75], [3.19, E6_JOIN]];
/**
 * The canopy cab (photo-e6-z14.jpg head on, photo-e6-z8.jpg and photo-e611-1.jpg from the side): a
 * bubble 1.6 m wide standing on the nose, its front a broad, gently rounded windscreen, its sides
 * near upright walls running straight back to about 7.4 m behind the tip, where it runs into the roof.
 * The nose's slices are reshaped (`e6Reshape`) from about 2 m up: across the canopy's front the profile's
 * depth, then its side wall, then the nose beside it pushed back to a valley behind the wall.
 */
/** The canopy front's half width by height ([y, half width]): upright sides, rounded over its top. */
const E6_CANOPY_W: Pt[] = [[2.0, 0.7], [2.9, 0.7], [3.0, 0.62], [3.08, 0.45]];
/** How far its side wall runs back by height ([y, d behind the tip]). */
const E6_CANOPY_BACK: Pt[] = [[2.0, 6.6], [2.3, 7.3], [2.7, 7.6], [3.0, 7.6], [3.06, 7.7]];
/** The side wall's width across (one column of the corner arc). */
const E6_WALL = 0.08;
const e6Reshape = (lat: number, y: number, d: number): number => {
  if (y <= 1.93 || y >= 3.1) return d;
  // blended in over the canopy's foot and out over its crown into the roof
  const t = Math.min(1, ((y - 1.93) / 0.19) ** 2, (3.1 - y) / 0.1);
  const w = edgeAt(E6_CANOPY_W, y), back = Math.max(d, edgeAt(E6_CANOPY_BACK, y));
  const dF = edgeAt(E6_FACE_PROFILE, y), front = dF + 0.32 * Math.min(1, lat / w) ** 4;
  let r: number;
  if (lat <= w) r = front;
  else if (lat <= w + E6_WALL) r = front + ((lat - w) / E6_WALL) * (back - front);
  // beside the wall: the nose falls back to it, out to its own surface 0.5 m further out
  else r = Math.max(d, back - 4 * (lat - w - E6_WALL));
  return d + t * (r - d);
};
/** The glass's edges in side elevation ([y, d]): its foot level at 2.17 m, its rear end rounding up into the crown. */
const E6_GLASS_BACK: Pt[] = [[2.19, 6.9], [2.3, 7.2], [2.6, 7.35], [2.85, 7.3], [2.94, 7.05], [2.99, 6.6], [3.02, 6.3]];
const E6_MASK_BACK: Pt[] = [[2.13, 7.0], [2.3, 7.32], [2.6, 7.48], [2.85, 7.45], [2.95, 7.25], [3.01, 6.85], [3.04, 6.55]];
const E6_FACE_PROFILE: Pt[] = [[0.42, 0.5], [0.46, 0.33], [0.55, 0.16], [0.68, 0.06], [0.82, 0.01], [0.95, 0], [1.09, 0], [1.25, 0.07], [1.4, 0.3], [1.48, 0.6], [1.52, 1.06], [1.55, 1.6], [1.57, 1.95], [1.7, 2.3], [1.8, 2.55], [1.93, 3.0], [2.0, 3.55], [2.08, 3.75], [2.18, 4.0], [2.3, 4.25], [2.65, 5.0], [2.95, 6.0], [3.02, 7.0], [3.1, 7.8], [3.22, 8.9], [3.37, 10.7], [3.5, 11.4], [3.6, 11.75], [3.65, E6_JOIN]];
const at = (y0: number, y1: number): Pt[] => [[y0, -9], [y1, -9]];

/**
 * The E6's nose, 11.95 m to the body's full section (the published 13 m includes the roof's last
 * rise): a round snout at the coupler, 1.1 m tall, its cover split red over white at 1.0 m, the low
 * pilot behind it; the nose rising behind the snout to the canopy cab, whose windscreen runs from 3.75 m
 * to 7.5 m behind the tip and wraps down its sides. The canopy is narrower than the nose under it: the
 * face's bow (2 m deep at the windscreen) is the canopy's front, the corners behind it sweep out to the
 * body's width over 4 - 6.5 m. The akane red covers the snout's top, the nose and the roof; the white
 * wedge comes forward along the side from the body to a point at the headlights, the silver arrow line
 * along its top, the red's lower sweep under it running back to a point 10.9 m behind the tip, where the
 * grey line under the windows takes over.
 */
const E6_FACE: SeriesCabFace = {
  dJoin: E6_JOIN, dSide: E6_JOIN, first: 13.35, roofFrom: 9, wrap: true, reach: 0, cols: [4, 16, 2, 1], tolerance: 0.05,
  profile: E6_FACE_PROFILE, reshape: e6Reshape,
  corner: [[0.42, 1.25], [1.4, 1.3], [1.52, 1.25], [1.57, 1.15], [1.8, 1.15], [2.0, 0.85], [2.08, 0.77], [2.65, 0.77], [2.95, 0.75], [3.1, 0.8], [3.22, 0.9], [3.37, 0.9], [3.5, 0.7], [3.6, 0.4], [3.65, 0.05]],
  cornerDepth: [[0.42, 4.5], [0.78, 5.0], [1.09, 5.2], [1.4, 5.0], [1.52, 4.6], [1.57, 4.0], [1.8, 3.4], [1.93, 3.0], [2.08, 2.4], [2.18, 2.8], [2.3, 3.4], [2.65, 3.8], [2.95, 3.8], [3.1, 3.4], [3.22, 2.5], [3.37, 1.05], [3.5, 0.5], [3.6, 0.2], [3.65, 0.01]],
  bulge: [[0.42, 0.05], [1.4, 0.05], [1.52, 0.2], [1.57, 0.4], [1.8, 0.6], [2.08, 0.6], [2.18, 1.4], [2.3, 2.1], [2.65, 1.6], [2.95, 1.0], [3.1, 0.6], [3.22, 0.35], [3.37, 0.15], [3.5, 0.05], [3.6, 0]],
  rows: [0.42, 0.5, 0.62, 0.78, 1.0, 1.09, 1.25, 1.4, 1.52, 1.57, 1.8, 1.93, 2.0, 2.12, 2.18, 2.3, 2.65, 2.9, 2.99, 3.04, 3.1, 3.22, 3.37, 3.5, 3.6, 3.65],
  // the face white under its paint; the distant model's centre line: white under the coupler, red above
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, 1.0, "white"], [1.0, 9, "red"]],
  paint: [
    // the beige equipment covers along the lower side from 5.3 m back
    { mat: "skirtG", front: [[0.42, 5.3], [0.9, 5.6]], back: [[0.42, 99], [0.9, 99]] },
    // the red, its lower sweep under the white wedge (over the whole snout ahead of the wedge's point)
    // and its cap over the silver arrow: the wedge between them is the face's own white
    { mat: "red", front: [[1.0, -9], [1.43, -9], [1.43, 4.4], ...E6_WEDGE_LOW.slice(1)], back: E6_RED_LOW },
    { mat: "red", front: at(1.43, 9), back: [...E6_ARROW_TOP, [3.21, 99], [9, 99]], top: 9 },
    // the silver arrow over the wedge, and the grey line under the windows behind the sweep's point
    { mat: "arrow", front: E6_ARROW_TOP, back: [...E6_WEDGE_TOP.slice(0, -1), [3.1, E6_JOIN], [3.11, 99], [3.2, 99]], top: 3.2 },
    { mat: "arrow", front: [[2.02, 10.9], [2.09, 10.9]], back: [[2.02, 99], [2.09, 99]] },
    // the headlights' long lens at the top of the wedge's front
    { mat: "cabGlass", front: [[1.48, 4.5], [1.86, 5.3], [1.97, 5.65], [2.03, 6.3]], back: [[1.48, 4.56], [1.6, 5.2], [1.86, 6.17], [1.97, 6.45], [2.03, 6.5]] },
    // the canopy's glass, the windscreen wrapping into its side windows, in a thin black frame
    { mat: "cabMask", front: [[2.13, -9], [3.04, -9]], back: E6_MASK_BACK, top: 9, lat: E6_CANOPY_W[0]![1] + E6_WALL + 0.01 },
    { mat: "e6Glass", front: [[2.19, -9], [3.02, -9]], back: E6_GLASS_BACK, top: 9, lat: E6_CANOPY_W[0]![1] + E6_WALL + 0.01 },
  ],
  fields: [
    // the coupler cover's seam under the snout, white inside it below the red's split
    { mat: "rubber", pts: [[-1.08, 1.0], [1.08, 1.0], [0.95, 0.8], [0.66, 0.6], [0.32, 0.5], [0, 0.47], [-0.32, 0.5], [-0.66, 0.6], [-0.95, 0.8]] },
    { mat: "white", pts: [[-1.01, 1.0], [1.01, 1.0], [0.9, 0.83], [0.63, 0.64], [0.31, 0.54], [0, 0.51], [-0.31, 0.54], [-0.63, 0.64], [-0.9, 0.83]] },
  ],
  // the windscreen is paint; the distant model's glass over its front
  panes: [], lodGlass: { hw: 0.55, y: [2.05, 2.95] },
  // two headlights at the lens's front on each side
  lamps: [[-1.37, 1.6, 0.07, "lampHead"], [-1.39, 1.75, 0.07, "lampHead"], [1.37, 1.6, 0.07, "lampHead"], [1.39, 1.75, 0.07, "lampHead"]],
  wipers: [[[-0.36, 2.2], [-0.42, 2.6]], [[0.3, 2.2], [0.36, 2.6]]],
};

/** The E6's pilot under the nose: a low white plough from behind the snout back to the equipment covers. */
function e6Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (!car.end) return;
  const x = (d: number) => X(d - E6_JOIN);
  // in plan: rounded at the front behind the snout, then straight to its back; from 0.2 m up into the face
  const plan: Array<[number, number]> = [[1.9, 0], [2.0, 0.35], [2.3, 0.62], [2.8, 0.8], [5.2, 0.85]];
  const ring = [...plan.map(([d, z]): [number, number, number] => [x(d), 0.2, -z]), ...plan.slice().reverse().filter(([, z]) => z > 0).map(([d, z]): [number, number, number] => [x(d), 0.2, z])];
  m.scope("pilot", () => m.slab("white", ring, [0, E6.B + 0.03 - 0.2, 0]));
}

/** A window row: n windows `w` wide, `pitch` apart, the first centred at d0. */
const e6Row = (d0: number, n: number, w = 0.55, pitch = 0.9): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch - w / 2, d0 + i * pitch + w / 2] as const);

/** The canopy's glass: dark, blue-grey and reflective, lighter than its black frame (photo-e6-z14.jpg). */
const E6_GLASS: MaterialSpec = { color: "#34495c", metallic: 0.4, roughness: 0.1, glass: true };
const E6_PALETTE = { e6Glass: E6_GLASS, white: c("#ebecec", 0.3), red: c("#cc1234", 0.3), arrow: c("#9ea3a8", 0.3), cabMask: c("#15181b", 0.3), skirtG: c("#d6d2c8", 0.6) };

export const E6: ShinkansenSeries = {
  // a mini-shinkansen body 2.945 m wide, the side straight up to 3.2 m under a red roof, the beige
  // equipment covers down to 0.42 m
  endLength: 23.075, midLength: 20.5, W: 1.4725, Y: 1.45, S: 3.2, C: 3.65, lean: 0.95, B: 0.42, A: 0.9,
  nose: nose(12.0, 0.04, 2.3, [[0, 1.2], [1.0, 1.55], [5.0, 2.05], [9.0, 2.55], [11.2, 3.05], [12.6, 3.45], [13.0, 3.65]], [[0, 1.15], [1.0, 1.45], [5.0, 1.8], [9.0, 2.15], [11.2, 2.5], [12.6, 2.9], [13.0, 3.0]], [[0, 1.1], [3.0, 1.3], [6.0, 1.45]], [[0, 1.05], [2.0, 1.05]], [[0, 1.03], [0.8, 0.55], [3.0, 0.75]]),
  windscreen: [10.9, 12.6, 0.07, 0.85], lamps: [3.6, 1.5], cabFace: E6_FACE,
  // small windows, 0.55 m wide at 0.9 m pitch (photo-e6-z8.jpg, photo-e625-1.jpg); one door behind the
  // nose and one at the end car's rear, one door at the front of an intermediate car, its toilets at the rear
  windows: [[2.16, 2.66]], windowW: 0.55, pitch: 0.9, door: [1.3, 3.1, 2.45, 2.9], doorW: 0.85, doorGlassW: 0.3,
  layout: {
    end: { doors: [[0.25, 1.1, 1], [8.9, 9.75, -1]], windows: e6Row(2.0, 7) },
    middle: { doors: [[0.55, 1.4, 1]], windows: e6Row(2.3, 16) },
  },
  // the LED destination display beside each door, high on the side (d behind the tip / the car's front)
  sidePanels: { end: [{ d: [19.6, 20.15], y: [2.8, 2.97], kind: "panel", mat: "black" }], middle: [{ d: [1.65, 2.2], y: [2.8, 2.97], kind: "panel", mat: "black" }] },
  // the end car's leading bogie under the nose, 6.7 m behind the tip, 14.15 m from the rear one
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.5, endBogies: [6.7 - E6_JOIN, 20.85 - E6_JOIN], midBogies: [2.9, 17.05], fittings: e6Fittings,
  liveries: {
    komachi: { title: "E6 Komachi", palette: { ...E6_PALETTE, roofG: c("#cc1234", 0.4) }, bands: [[0, 2.02, "white"], [2.02, 2.09, "arrow"], [2.09, 3.1, "white"], [3.1, 3.2, "arrow"], [3.2, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "E621-1" },
    akita: { title: "Akita", palette: { ...E6_PALETTE, arrow: c("#cc1234", 0.3), roofG: c("#e4e4e1", 0.5) }, bands: [[0, 2.02, "white"], [2.02, 2.09, "arrow"], [2.09, 3.1, "white"], [3.1, 3.2, "arrow"], [3.2, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E611-9" },
  },
  weight: { end: 41, middle: 39 }, power: 1200, maxspeed: 320,
};

/**
 * The 100 series (1985, JNR), measured on photo-100-x1-hamamatsu-19981020.jpg (set X1 near side-on; a
 * projective fit along the car from the tip, the rear body end and the vertical scale at six columns,
 * 35 - 80 px/m, checked by the 1.04 m window pitch) and the three-quarter photographs of the preserved
 * 123-1. Distances are d behind the nose tip. The "shark" nose: an oval cap with its tip at 1.67 m, the
 * top rising in a nearly straight line to the windscreen's foot (3.24 m at d 2.54), the flat windscreen
 * raked about 42 degrees to the cab roof (3.91 m at d 3.29); in plan a wedge reaching the body's width
 * 4.4 m back; the slit headlights on its sides (d 1.12 - 1.98 at 1.75 m); a deep skirt under it, its
 * slanted rear edge ahead of the leading bogie. Not the 0 series' round bullet: no bulging dome, a far
 * flatter top line and a windscreen standing in it.
 */
const S100_JOIN = 5.9;
/** The face's centre line, [y, d]: the skirt's top under the cap, the cap's round front, the top line, the windscreen, the cab roof. */
const S100_PROFILE: Pt[] = [
  [1.04, 0.64], [1.12, 0.65], [1.21, 0.62], [1.31, 0.5], [1.45, 0.21], [1.56, 0.07], [1.67, 0], [1.78, 0.03], [1.9, 0.1], [2.06, 0.21],
  [2.33, 0.5], [2.5, 0.81], [2.8, 1.44], [3.06, 2.12], [3.24, 2.54], [3.4, 2.72], [3.6, 2.92], [3.8, 3.15], [3.91, 3.29], [3.96, 3.6], [4.0, S100_JOIN],
];
const S100_ROWS = [1.04, 1.12, 1.21, 1.26, 1.31, 1.38, 1.45, 1.51, 1.56, 1.63, 1.67, 1.71, 1.78, 1.87, 1.9, 1.98, 2.06, 2.14, 2.21, 2.27, 2.33, 2.42, 2.5, 2.58, 2.65, 2.73, 2.8, 2.88, 2.95, 3.06, 3.15, 3.24, 3.33, 3.4, 3.5, 3.6, 3.7, 3.8, 3.86, 3.91, 3.96, 4.0];
/** The plan: a flat front this wide (half width) by height, its corners reaching the body's side this far behind it. */
const S100_FLAT: Pt[] = [[1.04, 0.02], [2.5, 0.02], [2.8, 0.45], [3.06, 0.75], [3.24, 0.95], [3.4, 1.0], [3.6, 0.98], [3.8, 0.92], [3.91, 0.75], [3.96, 0.4], [4.0, 0.05]];
const S100_DEPTH: Pt[] = [[1.04, 2.2], [1.21, 2.75], [1.45, 3.8], [1.67, 4.3], [1.9, 4.3], [2.06, 4.2], [2.33, 3.9], [2.5, 3.6], [2.8, 3.0], [3.06, 2.4], [3.24, 2.1], [3.4, 1.95], [3.6, 1.75], [3.8, 1.55], [3.91, 1.4], [3.96, 1.0], [4.0, 0.3]];
/** The headlight slit's chrome rim and its lens, [y, d] edges with rounded ends. */
const s100Slit = (y0: number, y1: number, d0: number, d1: number, k: number): { front: Pt[]; back: Pt[] } => {
  const ym = (y0 + y1) / 2, h = (y1 - y0) / 2;
  return {
    front: [[y0, d0 + k], [ym - h * 0.7, d0 + k * 0.3], [ym, d0], [ym + h * 0.7, d0 + k * 0.3], [y1, d0 + k]],
    back: [[y0, d1 - k], [ym - h * 0.7, d1 - k * 0.3], [ym, d1], [ym + h * 0.7, d1 - k * 0.3], [y1, d1 - k]],
  };
};
/** The oval cap's seam round the tip, a thin line in [lat, y] (centre 1.67 m, 0.62 m half wide, 0.45 m half tall). */
const S100_CAP_SEAM = Array.from({ length: 20 }, (_, i) => {
  const [a, b] = [(2 * Math.PI * i) / 20, (2 * Math.PI * (i + 1)) / 20];
  const at = (t: number, k: number): Pt => [k * 0.62 * Math.cos(t), 1.67 + k * 0.45 * Math.sin(t)];
  return { mat: "seam", pts: [at(a, 1), at(b, 1), at(b, 1.045), at(a, 1.045)], fine: 2 };
});
const S100_FACE: SeriesCabFace = {
  dJoin: S100_JOIN, first: 7.95, roofFrom: 3.99, cols: [3, 16, 1, 1],
  // the tip is the end car's front: its coupler lies under the cap, inside the skirt
  reach: 0,
  profile: S100_PROFILE, rows: S100_ROWS,
  // r = the body's half width less the flat front (the kit holds it under 98 % of the half width)
  corner: S100_FLAT.map(([y, a]): Pt => [y, Math.max(0.05, S100_HALF(y) - a)]),
  cornerDepth: S100_DEPTH,
  // the face takes the body's colour; the livery's bands show on the cab sides behind the corners
  bands: (l) => [[0, 9, l.bands[0]![2]]],
  paint: [
    // the skirt's colour up under the cap, its edge rising from 1.04 m at d 2.8 to the cap
    { mat: "skirtG", front: [[1.04, -9], [1.21, -9]], back: [[1.04, 2.8], [1.12, 1.7], [1.18, 1.0], [1.21, 0.62]] },
    // the headlight slits: a chrome rim, the lamp ahead and dark glass behind
    { mat: "frameSilver", ...s100Slit(1.63, 1.87, 1.1, 2.0, 0.06) },
    { mat: "cabGlass", ...s100Slit(1.67, 1.83, 1.15, 1.95, 0.05) },
    { mat: "lampHead", ...s100Slit(1.67, 1.83, 1.15, 1.5, 0.05) },
    // the cab's side window, from the corner pillar back along the cab
    { mat: "cabGlass", front: [[3.42, 2.92], [3.6, 3.1], [3.8, 3.34]], back: [[3.42, 5.0], [3.8, 4.75]] },
  ],
  decals: S100_CAP_SEAM,
  // the flat windscreen in a thin black rubber
  masks: [{ lat: [-0.95, 0.95], y: [3.3, 3.87], r: 0.07, mat: "black" }],
  panes: [{ lat: [-0.91, 0.91], y: [3.33, 3.84], r: 0.05 }],
  wipers: [[[-0.55, 3.36], [-0.15, 3.74]], [[0.35, 3.36], [0.75, 3.72]]],
};
/** The body's half width by height at the join (its section: W 1.62 at the belly, the side leaning in to the shoulder, the roof's elliptic arc). */
function S100_HALF(y: number): number {
  const [W, Y, S, C, lean] = [1.62, 1.5, 3.6, 4.0, 0.965];
  if (y <= Y) return W * 0.97;
  if (y <= S) return W + ((y - Y) / (S - Y)) * (W * lean - W);
  return W * lean * Math.sqrt(Math.max(0, 1 - ((y - S) / (C - S)) ** 2));
}

/**
 * The skirt under the nose (below the face, which starts at 1.04 m): its front upright under the cap
 * (d 0.6 - 0.66), its plan boxier toward the bottom (0.3 m above the rail), its rear edge slanted from
 * d 3.2 at the top to 2.4 at the bottom, clear of the leading wheels; two small boxes at its front
 * corners; over the bogie behind it the dark underside; the radio fin on the cab roof.
 */
function s100Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) {
    const x = (t: number) => X(t - S100_JOIN);
    // a ring at height y: flat front +-a at d f, elliptic corners (r wide, D deep) to the side at hw, the rear at d r1
    const ring = (f: number, a: number, hw: number, D: number, r1: number): Array<[number, number]> => {
      const r = hw - a, k = 6, pts: Array<[number, number]> = [[r1, hw]];
      for (let i = k; i >= 0; i--) { const t = (i / k) * (Math.PI / 2); pts.push([f + D * (1 - Math.cos(t)), a + r * Math.sin(t)]); }
      for (let i = 0; i <= k; i++) { const t = (i / k) * (Math.PI / 2); pts.push([f + D * (1 - Math.cos(t)), -(a + r * Math.sin(t))]); }
      pts.push([r1, -hw]);
      const out = pts.map(([d, z]): [number, number] => [x(d), z]);
      // counter-clockwise from above, as the mesh helpers wind
      let area = 0;
      for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
      return area > 0 ? out.reverse() : out;
    };
    const [yb, ym, yt] = [0.3, 0.7, 1.03];
    const bottom = ring(0.6, 0.85, 1.53, 0.8, 2.4), mid = ring(0.63, 0.5, 1.53, 1.5, 2.84), top = ring(0.66, 0.02, 1.55, 2.2, 3.2);
    m.scope("skirt", () => {
      m.loft("skirtG", bottom, yb, mid, ym, false);
      m.loft("skirtG", mid, ym, top, yt, false);
      m.cap("skirtG", bottom, yb, false);
      for (const sd of [1, -1]) m.scope(sd > 0 ? "box right" : "box left", () => block(m, "skirtG", x(0.72), x(0.52), yb, yb + 0.15, ...(sd > 0 ? [0.45, 1.0] : [-1.0, -0.45]) as [number, number]));
    });
    // the underside over the leading bogie, between its wheels' tops and the nose
    m.scope("nose underside", () => block(m, "under", x(S100_JOIN), x(3.0), 0.93, 1.03, -1.2, 1.2));
    // the blue apron along the car's bottom, carried on over the leading bogie to the skirt
    for (const sd of [1, -1]) m.scope(sd > 0 ? "apron right" : "apron left", () => block(m, "skirtG", x(S100_JOIN + 0.02), x(3.15), 0.86, 1.035, ...(sd > 0 ? [1.5, 1.54] : [-1.54, -1.5]) as [number, number]));
    m.scope("radio fin", () => m.slab("roofG", [[x(4.25), 3.95, -0.015], [x(3.85), 3.95, -0.015], [x(4.15), 4.24, -0.015], [x(4.3), 4.24, -0.015]], [0, 0, 0.03]));
  }
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), 0.72 - 0.3, 0.72, -1.62 * 0.8, 1.62 * 0.8));
}

/** The 100's window pitch (one window a seat row, 1.04 m), 0.78 m wide. */
const s100Windows = (from: number, n: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [from + 1.04 * i, from + 1.04 * i + 0.78] as const);

/**
 * The JNR livery (photo-100-x1-...: ivory, the blue window band 2.14 - 2.95 m and a thin blue line
 * 1.98 - 2.06 m under it, both ending on the end car in one edge slanted forward at its foot, d 4.45 at
 * the line to 5.3 at the band's head, ahead of the cab doors) and JR West's 2002 renewal (photo-jrw-...
 * -121-5055: light grey, a dark grey window band over a yellow-green stripe, the same slant). The
 * ivory or grey is swept over the bands ahead of the slant.
 */
const S100_SLANT: Pt[] = [[1.95, 4.4], [2.98, 5.33]];
export const S100: ShinkansenSeries = {
  // 26.05 m end car, 25.0 m intermediate car, 4.0 m high; the body narrowed from 3.38 m to 3.24 m; a high
  // shoulder (3.6 m) under a flat roof, the cab's roof nearly as wide as its windscreen
  endLength: 26.05, midLength: 25.0, W: 1.62, Y: 1.5, S: 3.6, C: 4.0, lean: 0.965, B: 0.72, A: 1.04,
  nose: nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S100_FACE,
  // the leading bogie under the nose (d 4.73), the rear one 3.75 m in from the inner coupling
  endBogies: [26.05 - 0.25 - 3.5 - 17.5 - S100_JOIN, 26.05 - 0.25 - 3.5 - S100_JOIN],
  // the end car (photo-100-x1-...): the crew door (a seam) and then the passenger door behind the cab, 13
  // windows (the 65 seats' rows), the rear door over the rear bogie with the toilets behind it; the
  // intermediate car a door at each end and 20 windows (100 seats)
  layout: {
    end: { doors: [[6.84 - S100_JOIN, 7.62 - S100_JOIN, -1], [21.95 - S100_JOIN, 22.7 - S100_JOIN, 1]], windows: s100Windows(8.42 - S100_JOIN, 13) },
    middle: { doors: [[0.55, 1.3, -1], [23.2, 23.95, 1]], windows: s100Windows(1.95, 20) },
  },
  sidePanels: {
    end: [
      { d: [6.08, 6.68], y: [1.38, 3.15], kind: "seam" },
      { d: [6.24, 6.52], y: [2.55, 2.95], kind: "window" },
    ],
  },
  windows: [[2.24, 2.86]], windowW: 0.78, pitch: 1.04, door: [1.35, 3.15, 2.5, 2.95], doorW: 0.78, doorGlassW: 0.24,
  bogieCentres: 17.5, wheelR: 0.455, wheelbase: 2.5,
  // the diamond pantograph (PS202, photo-jrw-...-k58-pantograph.jpg) near the car's rear end
  pantograph: "diamond", pantographAt: 25.0 - 0.5 - 2.2,
  fittings: s100Fittings,
  lodRoof: { d: [0.62, 3.0], hw: 1.45, y: [0.3, 1.04], mat: "skirtG" },
  liveries: {
    jnr: {
      title: "JNR ivory, blue", number: "123-1",
      palette: { ivory: c("#f1efe6"), blue: c("#1d4596"), roofG: c("#e4e2d8", 0.6), skirtG: c("#1d4596"), seam: c("#a9a79e", 0.5) },
      bands: [[0, 1.98, "ivory"], [1.98, 2.06, "blue"], [2.06, 2.14, "ivory"], [2.14, 2.95, "blue"], [2.95, 9, "ivory"]], roof: "roofG", skirt: "skirtG",
      endSweeps: [{ mat: "ivory", front: [[1.95, -9], [2.98, -9]], back: S100_SLANT }],
    },
    jrWest: {
      title: "JR West green", number: "121-5055",
      palette: { grey: c("#d6d9da"), dark: c("#4d5358"), green: c("#8cc43c"), roofG: c("#c9cccd", 0.6), skirtG: c("#a5aaad", 0.45), seam: c("#9a9ea1", 0.5) },
      bands: [[0, 1.88, "grey"], [1.88, 2.11, "green"], [2.11, 2.95, "dark"], [2.95, 9, "grey"]], roof: "roofG", skirt: "skirtG",
      endSweeps: [{ mat: "grey", front: [[1.85, -9], [2.98, -9]], back: [[1.85, 4.3], [2.98, 5.33]] }],
    },
  },
  weight: { end: 57, middle: 56 }, power: 920, maxspeed: 230,
};

/**
 * The E4 Max's line under the white (photo-e453-113-kumagaya-20210918.jpg, measured side-on by a projective
 * fit over the window pitch): 2.08 - 2.37 m along the cars, falling along the nose's sides to the beak's rim,
 * 1.15 - 1.30 m at the tip. Edges [y, d behind the tip]: where the line's top and its bottom reach a height.
 */
const E4_LINE_TOP: Pt[] = [[1.3, 0], [1.52, 1.5], [1.72, 3.4], [1.89, 5.4], [2.07, 7.3], [2.22, 8.3], [2.33, 9.2], [2.37, 9.8]];
const E4_LINE_BOTTOM: Pt[] = [[1.15, 0], [1.32, 1.5], [1.5, 3.4], [1.68, 5.4], [1.87, 7.3], [2.0, 8.3], [2.08, 9.4]];
/** The windscreen's outline [lat, y]: a wide eye, its flat top under the head's brow, the ends pointed and raised (photo-e4-frontview.jpg). */
const E4_EYE: Pt[] = [[-1.05, 2.86], [-0.96, 2.68], [-0.75, 2.6], [0, 2.585], [0.75, 2.6], [0.96, 2.68], [1.05, 2.86], [0.95, 3.03], [0.7, 3.1], [-0.7, 3.1], [-0.95, 3.03]];
/** A headlight's oval housing, the left one [lat, y]; its two lamps at lat 1.14 and 1.36. */
const E4_LAMP: Pt[] = [[-1.5, 2.29], [-1.45, 2.18], [-1.3, 2.11], [-1.1, 2.11], [-0.98, 2.16], [-0.96, 2.25], [-1.04, 2.34], [-1.23, 2.39], [-1.42, 2.37]];
const mirrorLat = (pts: readonly Pt[]): Pt[] => pts.map(([a, y]): Pt => [-a, y]).reverse();
/** The beak's outline seen head on [lat, y]: the crease over its top, from the line at its sides up to 1.85 m (photo-e4-frontview.jpg). */
const E4_BEAK_ARC: Pt[] = [[-1.06, 1.3], [-1.0, 1.5], [-0.85, 1.68], [-0.55, 1.8], [0, 1.85], [0.55, 1.8], [0.85, 1.68], [1.0, 1.5], [1.06, 1.3]];
const E4_BEAK_CREASE: Pt[] = [...E4_BEAK_ARC, ...E4_BEAK_ARC.map(([a, y]): Pt => [a * 0.965, y - 0.035]).reverse()];

/**
 * The E4's 11.5 m nose (photo-e453-113-kumagaya-20210918.jpg side-on, photo-e4-frontview.jpg head on,
 * photo-shinkansene4newcolorandoldcolor.jpg and photo-e4-p13.jpg three-quarter): a rounded beak 2.1 m wide
 * standing out at the bottom, its tip 1.18 m above the rail and its top a shelf at 2.0 - 2.3 m, the
 * headlights in oval housings on the shelf's broad corners; behind it the tall head rises steeply, the
 * eye-shaped windscreen set high (2.6 - 3.1 m, 4.0 - 5.1 m behind the tip) under its brow, and runs back
 * over a bulbous dome to the roof; its sides hollow between the head and the beak's shelf.
 */
const E4_FACE: SeriesCabFace = {
  dJoin: 11.5, dSide: 8.0, first: 12.9, reach: 0, roofFrom: 4.48, cols: [7, 5, 1, 1], tolerance: 0.02, wrap: true,
  profile: [[0.42, 1.4], [0.62, 0.62], [0.8, 0.3], [1.0, 0.1], [1.18, 0], [1.4, 0.1], [1.66, 0.41], [1.89, 0.97], [2.04, 1.5], [2.15, 1.92], [2.23, 2.55], [2.32, 3.26], [2.43, 3.75], [2.54, 3.92], [2.65, 4.04], [3.06, 5.12], [3.3, 5.44], [3.6, 6.34], [3.81, 7.2], [4.02, 8.03], [4.19, 8.85], [4.3, 9.4], [4.42, 10.4], [4.485, 11.5]],
  // the plan: the beak's front rounded (a bow) and narrower than the shelf above it, whose corners carry
  // the lamps face on; the head over the eye rounded in deep corners that leave a hollow beside it
  corner: [[0.42, 0.8], [0.8, 0.7], [1.1, 0.6], [1.89, 0.55], [2.04, 0.4], [2.15, 0.3], [2.32, 0.3], [2.43, 0.4], [2.54, 0.6], [2.65, 0.8], [3.06, 1.0], [4.485, 1.0]],
  cornerDepth: [[0.42, 2.4], [0.8, 2.6], [1.1, 2.8], [1.89, 2.9], [2.04, 2.6], [2.15, 2.3], [2.32, 2.0], [2.43, 2.4], [2.54, 3.0], [2.65, 3.4], [3.06, 2.6], [3.3, 2.3], [3.6, 2.0], [3.81, 1.8], [4.02, 1.6], [4.19, 1.3], [4.3, 1.0], [4.42, 0.8], [4.485, 0]],
  bulge: [[0.42, 0.5], [0.8, 0.7], [1.1, 1.1], [1.89, 1.1], [2.04, 0.6], [2.15, 0.6], [2.32, 0.5], [2.43, 0.45], [2.54, 0.4], [2.65, 0.35], [3.06, 0.3], [3.3, 0.3], [3.6, 0.25], [3.81, 0.2], [4.02, 0.15], [4.19, 0.1], [4.3, 0.05], [4.42, 0]],
  rows: [0.42, 0.62, 0.8, 1.0, 1.18, 1.4, 1.66, 1.89, 2.04, 2.15, 2.32, 2.43, 2.54, 2.65, 2.85, 3.06, 3.3, 3.6, 3.81, 4.02, 4.19, 4.3, 4.42, 4.485],
  // the centre line's colours (the distant model's); the paint below draws the line along the sides
  bands: () => [[0, 1.15, "blue"], [1.15, 1.3, "line"], [1.3, 9, "white"]],
  // the distant model's nose on fewer rows: the beak, its shelf, the eye and the dome
  lod: { profile: [[0.42, 1.4], [1.18, 0], [2.2, 2.3], [3.0, 5.0], [4.485, 11.5]], corner: [[0.42, 0.8], [1.18, 0.6], [2.2, 0.4], [3.0, 1.0]], rows: [0.42, 1.18, 2.2, 3.0, 4.485], bulge: [[0.42, 0.6], [1.18, 1.0], [2.2, 0.55], [3.0, 0.3], [4.485, 0]], cornerDepth: [[0.42, 2.5], [1.18, 2.8], [2.2, 2.2], [3.0, 2.8], [4.485, 0]], glass: false },
  paint: [
    // blue under the line (reaching under it, so that no gap opens at its edge), the line falling forward
    // from the body's height to the beak's rim; the face's bands, wrapped round to the join, white over it
    { mat: "blue", front: [[0.3, -9], [1.299, -9], ...E4_LINE_TOP], back: [[0.3, 99], [2.37, 99]] },
    { mat: "line", front: [[1.15, -9], [1.299, -9], ...E4_LINE_TOP], back: [...E4_LINE_BOTTOM, [2.081, 99], [2.37, 99]] },
  ],
  fields: [
    // the windscreen's black rubber surround, and the headlights' dark housings
    { mat: "cabMask", pts: E4_EYE.map(([a, y]): Pt => [a * 1.045, 2.84 + (y - 2.84) * 1.17]) },
    { mat: "cabMask", pts: E4_LAMP },
    { mat: "cabMask", pts: mirrorLat(E4_LAMP) },
    { mat: "crease", pts: E4_BEAK_CREASE },
  ],
  panes: [{ lat: [-0.99, 0.99], y: [2.61, 3.07], r: 0.19 }],
  lamps: [[-1.36, 2.26, 0.075, "lampHead"], [-1.14, 2.24, 0.075, "lampHead"], [1.14, 2.24, 0.075, "lampHead"], [1.36, 2.26, 0.075, "lampHead"]],
  wipers: [[[0.45, 2.63], [0.62, 2.99]]],
};

/** The E4 end car's two narrow doors on the nose's sides (d behind the tip; sill, head; the window's width, sill and head), the -Z side's order (the +Z side's windows the other way round). */
const E4_NOSE_DOORS: ReadonlyArray<readonly [number, number, number, number]> = [[8.07, 8.69, 1.24, 3.07], [9.32, 9.98, 1.16, 3.14]];
const E4_NOSE_DOOR_GLASS: ReadonlyArray<readonly [number, number, number]> = [[0.3, 2.3, 2.82], [0.42, 2.19, 2.95]];

/** The E4's fittings: the end car's crew doors on the nose's sides and the underfloor equipment. */
function e4Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("nose doors", () => {
    const dTip = E4_FACE.dJoin, t = 0.014;
    for (const sd of [1, -1]) E4_NOSE_DOORS.forEach(([a, e, y0, y1], i) => {
      const [d0, d1] = [a - dTip, e - dTip];
      sidePanel(m, b, X, sd, "rubber", d0, d0 + t, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d1 - t, d1, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + t, d1 - t, y1 - t, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + t, d1 - t, y0, y0 + t, 0.005, 0.004);
      // the small window on the -Z side's first door, the tall one on its second; the +Z side the other way round
      const [w, g0, g1] = E4_NOSE_DOOR_GLASS[sd < 0 ? i : 1 - i]!, dm = (d0 + d1) / 2;
      sidePanel(m, b, X, sd, "rubber", dm - w / 2, dm + w / 2, g0, g1, 0.007, 0.03);
      sidePanel(m, b, X, sd, "glass", dm - w / 2 + 0.03, dm + w / 2 - 0.03, g0 + 0.03, g1 - 0.03, 0.012, 0.004);
    });
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), 0.3, 0.42, -1.62 * 0.75, 1.62 * 0.75));
}

/** The E4's window rows (body d): the end car's four on each deck behind the nose, the intermediate car's six between its doors. */
const E4_END_WINDOWS: Array<readonly [number, number]> = [[0.42, 1.94], [2.34, 3.86], [4.26, 5.78], [6.18, 6.8]];
const E4_MID_WINDOWS: Array<readonly [number, number]> = [[7.06, 8.6], [9.0, 10.54], [10.95, 12.49], [12.9, 14.44], [14.86, 16.4], [16.84, 17.46]];

export const E4: ShinkansenSeries = {
  // 25.7 m end cars (11.5 m of nose), 25.0 m intermediate cars, 4.485 m high (ja.wikipedia)
  endLength: 25.7, midLength: 25.0, W: 1.62, Y: 1.0, S: 3.9, C: 4.485, lean: 0.97, B: 0.42, A: 0.75,
  nose: nose(9.4, 0.06, 2.4, [[0, 1.3], [1.0, 1.7], [4.5, 2.4], [7.5, 3.1], [9.4, 3.7], [10.8, 4.2], [11.5, 4.485]], [[0, 1.25], [1.0, 1.6], [4.5, 2.2], [7.5, 2.85], [9.4, 3.4], [11.5, 3.85]], [[0, 1.2], [2.0, 1.2]], [[0, 1.15], [1.5, 0.9]], [[0, 1.1], [0.6, 0.5], [2.0, 0.65]]),
  windscreen: [9.3, 10.9, 0.07, 1.05], lamps: [2.4, 1.6], cabFace: E4_FACE,
  // two decks: the lower deck's windows 1.10 - 1.69 m, the upper's 3.03 - 3.72 m; the doors with a narrow window
  windows: [[1.1, 1.69], [3.03, 3.72]], windowW: 1.52, pitch: 1.94, door: [1.15, 3.14, 2.19, 2.93], doorW: 1.05, doorGlassW: 0.34,
  layout: {
    end: { doors: [[8.79, 9.84, 1]], windows: E4_END_WINDOWS },
    middle: { doors: [[4.02, 5.07, -1], [19.5, 20.55, 1]], windows: E4_MID_WINDOWS },
  },
  sidePanels: {
    // the intermediate car's three toilet windows across the line, and the two-leaf hatch at its rear end
    middle: [
      { d: [0.59, 1.15], y: [1.92, 2.62], kind: "window" }, { d: [1.6, 2.16], y: [1.92, 2.62], kind: "window" }, { d: [2.58, 3.14], y: [1.92, 2.62], kind: "window" },
      { d: [22.15, 23.38], y: [1.03, 3.46], kind: "seam" }, { d: [23.47, 24.43], y: [1.03, 3.46], kind: "seam" },
    ],
  },
  // 17.5 m bogie centres; the end car's rear bogie 3.0 m from its inner end, the leading one under the nose
  bogieCentres: 17.5, wheelR: 0.455, wheelbase: 2.5, endBogies: [-6.64, 10.86], midBogies: [3.95, 21.45],
  fittings: e4Fittings,
  liveries: {
    max: { title: "E4 Max", palette: { white: c("#eef0f1"), blue: c("#22327a"), line: c("#efb51c"), roofG: c("#eef0f1", 0.45), skirtG: c("#22327a"), cabMask: c("#15181c", 0.3), crease: c("#aeb4bb", 0.5) }, bands: [[0, 2.08, "blue"], [2.08, 2.37, "line"], [2.37, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E453-101" },
    toki: { title: "Toki", palette: { white: c("#eef0f1"), blue: c("#22327a"), line: c("#f2949a"), roofG: c("#eef0f1", 0.45), skirtG: c("#22327a"), cabMask: c("#15181c", 0.3), crease: c("#aeb4bb", 0.5) }, bands: [[0, 2.08, "blue"], [2.08, 2.37, "line"], [2.37, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "E453-104" },
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
