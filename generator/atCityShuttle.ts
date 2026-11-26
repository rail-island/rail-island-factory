// The OBB CityShuttle double-deck push-pull coaches (SGP / Jenbacher / Siemens Prague and OBB-TS
// Simmering, 1996 - 2009; Siemens "Viaggio Twin"), nicknamed "Wiesel" after the Lower Austrian
// weasel branding: the double-deck coach (26-33, Bmpz-dl) and its driving trailer (80-33 / 86-33,
// Bbfmpz) with the cab face derived from the OBB 1014's - the grey buffer beam, the red lower face
// with two pairs of lamps, the grey windscreen band wrapping round onto the cab sides, the red cap
// raked back over it to the arched roof line. Drawn on the series kit (shinkansen.ts), unwired
// (`traction: "none"`): the driving trailer is the series' end car with a cab face (seriesCab.ts),
// the coach its intermediate car; both are double-deck cars whose lower deck lies in a well between
// the doors (`lowWell`), the doors at the well's ends inside the bogies, the end sections over the
// bogies an intermediate level with their own windows. `unit` `train` is the push-pull set the
// driving trailer leads (wieselTrain): 3 .. 5 cars, the locomotive (its own design) at the rear.
// Matched to the photographs in assets/obb-cityshuttle-dd/ (SOURCES.md) and the published figures
// (de.wikipedia "OBB Nahverkehrs-Doppelstockwagen"). Registered in atUnits.ts. See
// docs/models/austria-trains.md.
//
// Heights over the rail. On the face d behind its tip; elsewhere d behind the body's front end (the
// face's join on the driving trailer, the coupling gap on a coach).

import { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownPane, sideDecal, sideLettering, sidePanel, type SliceBody } from "./sliceBody.ts";
import { letters, wordWidth } from "./letters.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, drawSeriesCar, SERIES_GAP, seriesCarLod, seriesCarPalette, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { articulate } from "./tramKit.ts";
import { block } from "./vehicleParts.ts";
import { fitUnit } from "./lodUnits.ts";
import type { LodSections } from "./lodKit.ts";

// ---------------------------------------------------------------------------
// Figures

/** Lengths over the buffers (de.wikipedia): the driving trailer 27.1 m, the coach 26.8 m; 4.632 m high, bogie centres 20 m. */
const DT_LENGTH = 27.1;
const COACH_LENGTH = 26.8;
/** Half width (2.8 m), shoulder and crown. */
const W = 1.4;
const S = 4.18;
const C = 4.632;
/** The face meets the body this far behind its tip; the buffer heads ahead of the tip. */
const JOIN = 1.71;
const BUFFERS = 0.6;
/** Over the bogies and at the ends (the intermediate level): the belly, skirt top and bottom. */
const Y_END = 1.2;
const A_END = 1.16;
const B_END = 1.0;
/** In the well between the doors (the lower deck): belly, skirt top and bottom. */
const Y_WELL = 0.5;
const A_WELL = 0.47;
const B_WELL = 0.4;

/** The bodies: the driving trailer behind its face's join, the coach between its coupling gaps. */
const DT_L = DT_LENGTH - SERIES_GAP - BUFFERS - JOIN;
const COACH_L = COACH_LENGTH - 2 * SERIES_GAP;

/**
 * The sides, by a projective fit along the coach at Moedling (photo-wiesel-5914: its six lower windows
 * as the ruler, both doors in view) and the driving trailers 86-33 102 and 033: the windows of both
 * decks on one 1.7 m pitch, six in the lower deck between the doors and eight in the upper deck, the
 * outer ones over the doors; the doors 1.6 m, 5.17 m either side of the well's middle.
 */
const P = 1.7;
const DOOR_W = 1.6;
const DOOR_IN = 5.17;
/** Window rows (lower deck, upper deck): sill and head. */
const ROWS: ReadonlyArray<readonly [number, number]> = [[1.15, 1.95], [3.28, 4.1]];
const LOWER_W = 1.36;
const UPPER_W = 1.46;
/** The end sections' windows at the intermediate level (sill, head). */
const MID_ROW: readonly [number, number] = [1.97, 2.95];
/** The door: sill, head and its leaves' windows. */
const DOOR: readonly [number, number, number, number] = [Y_WELL, 2.72, 1.05, 2.45];

/** n spans of width w on pitch p, centred on m. */
const row = (m: number, n: number, w: number, p: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => { const x = m + (i - (n - 1) / 2) * p; return [x - w / 2, x + w / 2] as const; });
/** A double door of two leaves from d, sliding apart. */
const door = (d: number): Array<readonly [number, number, number]> => [[d, d + DOOR_W / 2, -1], [d + DOOR_W / 2, d + DOOR_W, 1]];

/** A car's sides around the middle m of its well: door spans, the well, the end sections' fittings. */
interface Sides {
  m: number;
  /** The front and rear door's spans. */
  front: readonly [number, number];
  rear: readonly [number, number];
  /** The well (d0, d1): the doors on its flat floor, 0.3 m ramps at its ends. */
  well: readonly [number, number];
  layout: SeriesLayout;
}

/**
 * The end sections beyond a door (e is the distance beyond its outer edge, toward the car's end): the
 * small upper window over the narrow intermediate-level one at 1.5 - 2.5 m, the wider one at 2.8 -
 * 4.0 m, the tall louvred locker at 4.4 - 5.3 m, the roof's grille at 3.4 - 4.4 m.
 */
const END_SMALL: readonly [number, number] = [1.5, 2.5];
const END_WIDE: readonly [number, number] = [2.8, 4.0];
const END_LOCKER: readonly [number, number] = [4.4, 5.3];
const END_GRILLE: readonly [number, number] = [3.4, 4.4];

function sides(mid: number, frontEnd: boolean): Sides {
  const front = [mid - DOOR_IN - DOOR_W, mid - DOOR_IN] as const, rear = [mid + DOOR_IN, mid + DOOR_IN + DOOR_W] as const;
  // beyond the rear door toward the car's rear end, and (a coach) beyond the front door toward its front
  const back = (e: readonly [number, number]) => [rear[1] + e[0], rear[1] + e[1]] as const;
  const fore = (e: readonly [number, number]) => [front[0] - e[1], front[0] - e[0]] as const;
  const upper = [...(frontEnd ? [fore(END_SMALL)] : []), ...row(mid, 8, UPPER_W, P), back(END_SMALL)];
  return {
    m: mid, front, rear, well: [front[0] - 0.7, rear[1] + 0.7],
    layout: { doors: [...door(front[0]), ...door(rear[0])], windows: [], rows: [row(mid, 6, LOWER_W, P), upper] },
  };
}

/** The coach: its well in the middle. */
const COACH = sides(COACH_L / 2, true);
/**
 * The driving trailer (86-33 102 at Wien Meidling, 033 at Krems): the cab, its side window behind the
 * mirror housing, the intermediate level over the leading bogie with one tall window, the front door
 * 4.6 m behind the face's join; then the coach's well, rear door and rear end section.
 */
const DT_FRONT_DOOR = 4.6;
const DT = sides(DT_FRONT_DOOR + DOOR_W + DOOR_IN, false);
/** The driving trailer's window at the intermediate level ahead of the front door (d on its body). */
const DT_MID_WIN: readonly [number, number] = [1.95, 2.9];

// ---------------------------------------------------------------------------
// The cab face

/**
 * The face's centre line (the head-on photograph of 86-33 100 at Graz Ostbahnhof, 129 px/m, and the
 * three-quarter views of 102, 031 and 80-33 008): the grey buffer beam upright from 0.55 to 1.21 m, the
 * red lower face over it leaning back slightly to the windscreen band's foot (2.38 m), the windscreen
 * raked about 27 degrees to its head (3.35 m), the red cap raked about 45 degrees to the arched roof line
 * (4.08 m at the middle), the grey roof rounding over to the crown 1.71 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.55, 0.04], [0.6, 0], [1.2, 0], [1.24, 0.06], [1.7, 0.09], [2.38, 0.14], [2.45, 0.17], [3.35, 0.63], [3.42, 0.7],
  [3.85, 1.12], [4.08, 1.33], [4.3, 1.5], [4.5, 1.63], [C, JOIN],
];
/** The plan's corners: the beam's tight, the face's and the band's rounder, the cap rolling into the roof. */
const CORNER: Pt[] = [[0.55, 0.12], [1.2, 0.12], [1.24, 0.3], [2.38, 0.34], [3.35, 0.38], [4.08, 0.42], [4.5, 0.32], [C, 0.15]];

/** The corners' depth back along the car: their radius, kept ahead of the join (where the cap meets the roof). */
const lerpAt = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, va] = pts[i - 1]!, [yb, vb] = pts[i]!;
    if (y <= yb) return va + ((y - ya) / (yb - ya)) * (vb - va);
  }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.03, Math.min(lerpAt(CORNER, y), JOIN - d - 0.03))]);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** The red cap's arched top: 4.08 m over the middle, 3.85 m 1.1 m out, 3.73 m at the corners. */
const CAP_TOP: Pt[] = [[-1.6, 3.73], [-1.35, 3.73], [-1.1, 3.85], [-0.6, 4.0], [0, 4.08], [0.6, 4.0], [1.1, 3.85], [1.35, 3.73], [1.6, 3.73], [1.6, 4.8], [-1.6, 4.8]];

const ROWS_FACE = [0.55, 0.6, 1.2, 1.24, 1.62, 1.78, 1.95, 2.12, 2.38, 2.45, 3.35, 3.42, 3.73, 3.85, 4.08, 4.3, 4.5, C];

/** The face of one livery: its bands and the paint of its cap and windscreen band by material. */
function wieselFace(bands: ReadonlyArray<readonly [number, number, string]>, cityjet: boolean): SeriesCabFace {
  return {
    dJoin: JOIN, dSide: 1.2, first: JOIN + DT_FRONT_DOOR, roofFrom: 9, reach: BUFFERS, wrap: true, bulge: 0.04, cols: [5, 3, 1, 1], tolerance: cityjet ? 0.08 : 0.05,
    // the leading bogie stands under the cab's sides: the skirt left open over it
    wheelCut: { d: JOIN + 1.5 - 1.25 - 0.55, y: A_END },
    profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, rows: ROWS_FACE,
    bands: () => bands,
    lodGlass: { hw: 1.09, y: [2.45, 3.3] },
    // the roof's grey over the cap's arched top
    fields: [{ mat: cityjet ? "bandG" : "roofG", pts: CAP_TOP }],
    masks: [
      // the lamp pairs' black surrounds, the grille between them, the marker lamp's box over the windscreen
      { lat: [-1.08, -0.58], y: [1.62, 1.79], r: 0.02, mat: "black" },
      { lat: [0.58, 1.08], y: [1.62, 1.79], r: 0.02, mat: "black" },
      { lat: [-0.17, 0.17], y: [1.6, 1.82], r: 0.01, mat: cityjet ? "redDark" : "grille" },
      { lat: [-0.15, 0.15], y: [3.42, 3.58], r: 0.01, mat: "black" },
    ],
    panes: [{ lat: [-1.09, 1.09], y: [2.47, 3.29], r: 0.06 }],
    decals: [
      // the two small grilles on the cap
      { mat: "grille", pts: box(-0.55, -0.3, 3.87, 3.97), fine: 1 },
      { mat: "grille", pts: box(0.3, 0.55, 3.87, 3.97), fine: 1 },
      // the grab rails at the lower face's corners
      { mat: "black", pts: box(-1.27, -1.24, 1.3, 2.25), fine: 1 },
      { mat: "black", pts: box(1.24, 1.27, 1.3, 2.25), fine: 1 },
    ],
    // each pair: the headlight outside, the tail light inside; the marker lamp over the windscreen
    lamps: [[-0.93, 1.705, 0.055, "lampHead"], [-0.72, 1.705, 0.05, "lampRed"], [0.72, 1.705, 0.05, "lampRed"], [0.93, 1.705, 0.055, "lampHead"], [0, 3.5, 0.05, "lampHead"]],
    number: { lat: 0.47, y: 1.93, h: 0.085, mat: "white" },
    texts: [{ text: "OBB", lat: 0.04, y: cityjet ? 2.12 : 1.93, h: 0.17, mat: cityjet ? "red" : "white" }],
    // the wipers hang from the windscreen's head, parked toward its corners
    wipers: [[[-0.52, 3.24], [-0.98, 2.62]], [[0.6, 3.24], [1.0, 2.66]]],
  };
}

// ---------------------------------------------------------------------------
// Liveries

const RED = "#d8141c";
const GREY = "#c7cacc";

/** The palette both liveries share. */
const common: ShinkansenLivery["palette"] = {
  black: c("#161718", 0.35), grille: c("#3a3c3f", 0.6), white: c("#f2f3f3", 0.4), red: c(RED), beam: c("#5c6064", 0.6),
  skirtG: c("#34373a", 0.8), under: c("#2a2c2f", 0.85), steel: c("#4a4c4f", 0.5), lettering: c("#3a3c3f", 0.5),
};

/**
 * The red half of a car (CityShuttle, 1997): the side red behind a diagonal across the well's middle,
 * from 1.9 m behind it at the belly to 2.2 m ahead of it at the shoulder, round the rear door (the door
 * leaves white) and over the rear end section; convex fields over the light grey.
 */
function redHalf(sd: Sides, L: number): Array<{ mat: string; pts: Pt[] }> {
  const y0 = Y_WELL + 0.03, top = S - 0.02;
  const [d0, d1] = [sd.m + 1.9, sd.m - 2.2];
  const [r0, r1] = sd.rear, w1 = sd.well[1];
  return [
    { mat: "red", pts: [[d0, y0], [r0, y0], [r0, top], [d1, top]] },
    { mat: "red", pts: [[r0, DOOR[1] + 0.03], [r1, DOOR[1] + 0.03], [r1, top], [r0, top]] },
    { mat: "red", pts: [[r1, y0], [w1 - 0.3, y0], [w1, Y_END + 0.03], [w1, top], [r1, top]] },
    { mat: "red", pts: [[w1, Y_END + 0.03], [L - 0.02, Y_END + 0.03], [L - 0.02, top], [w1, top]] },
  ];
}

/** The Cityjet's black window bands: over the upper deck's windows and the lower deck's between the doors. */
function windowBands(sd: Sides): Array<{ mat: string; pts: Pt[] }> {
  const up = sd.layout.rows![1]!.filter(([a]) => a > sd.front[0] - 0.5 && a < sd.rear[1]), lo = sd.layout.rows![0]!;
  return [
    { mat: "black", pts: box(up[0]![0] - 0.08, up[up.length - 1]![1] + 0.08, ROWS[1]![0] - 0.07, ROWS[1]![1] + 0.06) },
    { mat: "black", pts: box(lo[0]![0] - 0.1, lo[lo.length - 1]![1] + 0.1, ROWS[0]![0] - 0.07, ROWS[0]![1] + 0.05) },
  ];
}

type LiveryKey = "cityShuttle" | "cityjet";
type Kind = "drivingTrailer" | "coach";

/** Running numbers (UIC check digits valid): driving trailer 50 81 86-33 102-3 (Wien Meidling), coach 50 81 26-33 114-1 (Wien Floridsdorf). */
const NUMBERS: Record<LiveryKey, Record<Kind, string>> = {
  cityShuttle: { drivingTrailer: "86-33 102-3", coach: "26-33 114-1" },
  cityjet: { drivingTrailer: "86-33 113-0", coach: "26-33 114-1" },
};

/**
 * CityShuttle (1997, the OBB wordmark since 2005): light grey, the rear half red behind the diagonal,
 * white doors, a grey roof; the face red with the grey buffer beam and the grey windscreen band, which
 * wraps round onto the cab sides as the frame of the cab side window.
 */
function cityShuttle(kind: Kind): ShinkansenLivery {
  return {
    title: "CityShuttle", number: NUMBERS.cityShuttle[kind],
    palette: { ...common, body: c(GREY, 0.45), roofG: c("#a9adb0", 0.55), door: c("#eceeee", 0.4), bandG: c("#80868b", 0.45), cabGlass: { color: "#1d2329", metallic: 0.2, roughness: 0.1, glass: true } },
    bands: [[0, 9, "body"]], doors: [[0, 9, "door"]], roof: "roofG", skirt: "skirtG",
    sideFields: { end: redHalf(DT, DT_L), middle: redHalf(COACH, COACH_L) },
    lodSideFields: { end: [{ d: [JOIN + DT.m, JOIN + DT_L], bands: [[0, S, "red"], [S, 9, "roofG"]] }], middle: [{ d: [COACH.m, COACH_L], bands: [[0, S, "red"], [S, 9, "roofG"]] }] },
    endSweeps: [
      // the windscreen band carried back over the cab sides, the cab side window in it
      { mat: "bandG", front: [[2.38, -9], [3.35, -9]], back: [[2.38, JOIN + 1.15], [3.35, JOIN + 1.15]] },
      { mat: "cabGlass", front: [[2.5, JOIN + 0.62], [3.24, JOIN + 0.62]], back: [[2.5, JOIN + 1.05], [3.24, JOIN + 1.05]] },
    ],
  };
}

/**
 * Cityjet (the 2019 - upgrade, 86-33 113 near Peggau): white over the red band to the lower windows'
 * heads with a darker red line on top, the black window bands, dark grey doors; the face's red lower
 * part under a white band, the anthracite windscreen band and cap carried back over the cab sides
 * behind a slanted edge with a red line along it.
 */
const CJ_EDGE: Pt[] = [[2.38, JOIN - 0.3], [3.35, JOIN + 0.15], [4.18, JOIN + 0.7]];
function cityjet(kind: Kind): ShinkansenLivery {
  return {
    title: "Cityjet", number: NUMBERS.cityjet[kind],
    palette: { ...common, red: c("#e0321f"), body: c("#f2f3f3", 0.4), redDark: c("#b3191c", 0.5), roofG: c("#b9bdc0", 0.55), door: c("#3c3f42", 0.45), bandG: c("#2c2f33", 0.4), cabGlass: { color: "#1d2329", metallic: 0.2, roughness: 0.1, glass: true } },
    bands: [[0, 2.05, "red"], [2.05, 9, "body"]], doors: [[0, 9, "door"]], roof: "roofG", skirt: "skirtG",
    sideFields: { end: windowBands(DT), middle: windowBands(COACH) },
    leafEdgeStripe: { w: 0.05, mat: "white", glassShift: 0.05 },
    endSweeps: [
      // the anthracite cap swept back over the cab sides, a red line along its edge, the cab window behind it
      { mat: "bandG", front: [[2.38, -9], [4.18, -9]], back: CJ_EDGE },
      { mat: "red", front: CJ_EDGE, back: CJ_EDGE.map(([y, d]): Pt => [y, d + 0.07]) },
      { mat: "cabGlass", front: [[2.5, JOIN + 0.62], [3.24, JOIN + 0.62]], back: [[2.5, JOIN + 1.05], [3.24, JOIN + 1.05]] },
    ],
  };
}

const LIVERIES: Record<LiveryKey, (kind: Kind) => ShinkansenLivery> = { cityShuttle, cityjet };

const FACES: Record<LiveryKey, SeriesCabFace> = {
  cityShuttle: wieselFace([[0, 1.21, "beam"], [1.21, 2.38, "red"], [2.38, 3.35, "bandG"], [3.35, 4.1, "red"], [4.1, 9, "body"]], false),
  cityjet: wieselFace([[0, 1.21, "beam"], [1.21, 1.96, "red"], [1.96, 2.38, "white"], [2.38, 4.1, "bandG"], [4.1, 9, "body"]], true),
};

// ---------------------------------------------------------------------------
// Fittings

/** A word in capitals (letters.ts) on side sd, centred on d, foot y, h tall, reading toward the car's front on the +Z side. */
function capitals(m: MeshBuilder, b: SliceBody, X: (d: number) => number, sd: number, text: string, d: number, y: number, h: number, mat: string): void {
  const style = { weight: 0.16 };
  const dir = Math.sign(X(0) - X(1));
  const tris = letters(text, -wordWidth(text, h, style) / 2, y, h, false, style).map(([u, v]): Pt => [d - dir * sd * u, v]);
  sideDecal(m, b, X, sd, mat, tris, 0.005);
}

/** The end sections' lockers and roof grilles, the driving trailer's mirror housings and horn, the livery's lettering. */
function fittings(key: LiveryKey) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number }): void => {
    const L = car.length, sd = car.end ? DT : COACH;
    const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) =>
      block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
    // the end sections: beyond the rear door, and on a coach beyond the front door too
    const ends: Array<{ span: (e: readonly [number, number]) => [number, number]; red: boolean }> = [
      { span: (e) => [sd.rear[1] + e[0], sd.rear[1] + e[1]], red: key === "cityShuttle" },
      ...(car.end ? [] : [{ span: (e: readonly [number, number]) => [sd.front[0] - e[1], sd.front[0] - e[0]] as [number, number], red: false }]),
    ];
    m.scope("end sections", () => {
      for (const { span, red } of ends) {
        const [l0, l1] = span(END_LOCKER), [w0, w1] = span(END_WIDE), [s0, s1] = span(END_SMALL), [g0, g1] = span(END_GRILLE);
        const ground = red ? "red" : "body";
        for (const s of [1, -1]) {
          // the tall louvred locker, its slats pressed in the side's paint
          sidePanel(m, b, X, s, ground, l0, l1, 1.3, 3.0, 0.006, 0.03);
          for (let i = 1; i < 9; i++) { const y = 1.3 + (1.7 * i) / 9; sidePanel(m, b, X, s, "grille", l0 + 0.04, l1 - 0.04, y - 0.012, y + 0.012, 0.012, 0.008); }
          // the intermediate level's windows
          for (const [d0, d1] of [[s0, s1], [w0, w1]] as const) {
            sidePanel(m, b, X, s, "rubber", d0, d1, MID_ROW[0], MID_ROW[1], 0.007, 0.03);
            sidePanel(m, b, X, s, "glass", d0 + 0.05, d1 - 0.05, MID_ROW[0] + 0.05, MID_ROW[1] - 0.05, 0.012, 0.004);
          }
          // the air intakes high on the side under the roof's edge: the wide one and a small one beyond it
          for (const [d0, d1, y0, y1, n] of [[g0, g1, 3.62, 4.08, 5], [l0 + 0.1, l1 - 0.1, 3.2, 3.55, 3]] as const) {
            sidePanel(m, b, X, s, ground, d0, d1, y0, y1, 0.006, 0.03);
            for (let i = 1; i < n; i++) { const y = y0 + ((y1 - y0) * i) / n; sidePanel(m, b, X, s, "grille", d0 + 0.04, d1 - 0.04, y - 0.012, y + 0.012, 0.012, 0.008); }
          }
        }
      }
    });
    if (car.end) {
      m.scope("cab", () => {
        // the intermediate level's tall window ahead of the front door
        for (const s of [1, -1]) {
          sidePanel(m, b, X, s, "rubber", DT_MID_WIN[0], DT_MID_WIN[1], MID_ROW[0], MID_ROW[1], 0.007, 0.03);
          sidePanel(m, b, X, s, "glass", DT_MID_WIN[0] + 0.05, DT_MID_WIN[1] - 0.05, MID_ROW[0] + 0.05, MID_ROW[1] - 0.05, 0.012, 0.004);
          // the destination display's small box behind the mid window
          sidePanel(m, b, X, s, "grille", 3.45, 3.8, 2.5, 2.72, 0.006, 0.03);
        }
        // the mirror housings standing out ahead of the cab side windows (d on the body, just behind the join)
        for (const s of [1, -1]) at("bandG", 0.03, 0.6, 2.47, 3.3, s > 0 ? W - 0.12 : -W - 0.1, s > 0 ? W + 0.1 : -W + 0.12);
        // the horn housing on the roof over the face
        at("roofG", 0.1, 0.55, C - 0.1, C + 0.06, -0.09, 0.09);
        // the roof hatch over the cab
        for (const s of [1, -1]) crownPane(m, b, X, s, "grille", [0.3, 1.5], [0.55, 0.57], 0.005);
      });
    }
    m.scope("lettering", () => {
      for (const s of [1, -1]) {
        // the red OBB letters between the decks, ahead of the diagonal (CityShuttle) or the front door (Cityjet)
        if (key === "cityShuttle") sideLettering(m, b, X, s, "OBB", sd.m - 2.55, 2.27, 0.45, "red", 0.005, 0.08);
        else sideLettering(m, b, X, s, "OBB", sd.front[0] - (car.end ? 0.7 : 1.4), 2.75, 0.3, "red", 0.005, 0.055);
        // the brand on the rear end section (CityShuttle) or between the decks (Cityjet), in capitals
        if (key === "cityShuttle") capitals(m, b, X, s, "CITYSHUTTLE", sd.rear[1] + 2.7, 1.35, 0.42, "white");
        else capitals(m, b, X, s, "CITYJET", sd.m + 2.4, 2.42, 0.26, "grille");
      }
    });
    void L;
  };
}

// ---------------------------------------------------------------------------
// The series

function wieselSeries(key: LiveryKey, kind: Kind): ShinkansenSeries {
  return {
    endLength: DT_LENGTH, midLength: COACH_LENGTH, W, Y: Y_END, S, C, lean: 0.93, B: B_END, A: A_END,
    nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACES[key],
    endCoupler: "buffers", bufferGap: BUFFERS, bufferHeadShape: "rect", couplerY: 1.06,
    windows: ROWS, windowW: LOWER_W, pitch: P, windowCornerR: 0.1,
    // the double doors: a narrow, round-ended window in each leaf
    door: DOOR, doorW: DOOR_W, doorGlassW: 0.22, doorGlassR: 0.1,
    layout: { end: DT.layout, middle: COACH.layout },
    lowWell: { end: DT.well, middle: COACH.well, Y: Y_WELL, A: A_WELL, B: B_WELL, lodMat: key === "cityjet" ? "red" : "body" },
    // bogie centres 20 m, 2.5 m wheelbase, 920 mm wheels: the coach's 3.15 m in from its ends, the driving trailer's leading one 1.5 m behind the join
    bogieCentres: 20.0, wheelR: 0.46, wheelbase: 2.5, endBogies: [1.5, 21.5], midBogies: [3.15, COACH_L - 3.15],
    traction: "none", cars: [3, 5],
    numberAt: [-5.2, Y_END + 0.12, 0.09],
    fittings: fittings(key),
    liveries: { [key]: LIVERIES[key](kind) },
    weight: { end: 49, middle: 48 }, power: 0, maxspeed: 140,
  };
}

const SERIES: Record<LiveryKey, Record<Kind, ShinkansenSeries>> = {
  cityShuttle: { drivingTrailer: wieselSeries("cityShuttle", "drivingTrailer"), coach: wieselSeries("cityShuttle", "coach") },
  cityjet: { drivingTrailer: wieselSeries("cityjet", "drivingTrailer"), coach: wieselSeries("cityjet", "coach") },
};

// ---------------------------------------------------------------------------
// The train

export interface WieselSlot { kind: Kind; lo: number; hi: number; turned: boolean }
const LENGTH: Record<Kind, number> = { drivingTrailer: DT_LENGTH, coach: COACH_LENGTH };
export const WIESEL_CARS = [3, 4, 5];

/**
 * The cars of an n-car push-pull set (3 .. 5; usually a driving trailer and up to four coaches), front
 * first, centred on x = 0: the driving trailer leading, the coaches behind it, every second one turned
 * (their red halves meeting as on the Meidling photographs); the locomotive couples at the rear.
 */
export function wieselTrain(n: number): WieselSlot[] {
  if (!WIESEL_CARS.includes(n)) throw new Error(`CityShuttle: no ${n}-car set`);
  const kinds = Array.from({ length: n }, (_, k): Kind => (k === 0 ? "drivingTrailer" : "coach"));
  let hi = kinds.reduce((a, kd) => a + LENGTH[kd], 0) / 2;
  return kinds.map((kind, k) => {
    const lo = hi - LENGTH[kind];
    const slot: WieselSlot = { kind, lo, hi, turned: k > 0 && k % 2 === 0 };
    hi = lo;
    return slot;
  });
}

/** The gangways' bellows. */
const BELLOWS: Array<[number, number]> = [[-0.55, 1.25], [0.55, 1.25], [0.55, 3.2], [-0.55, 3.2]];
const MAX_BEND = 10;

const trainPalette = (key: LiveryKey) => ({ ...seriesCarPalette(SERIES[key].drivingTrailer, key), ...seriesCarPalette(SERIES[key].coach, key) });

function drawTrain(key: LiveryKey, n: number): MeshBuilder {
  const m = new MeshBuilder(trainPalette(key));
  const slots = wieselTrain(n);
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const end = slot.kind === "drivingTrailer";
    // the driving trailer's buffers at the front, the last coach's at the rear (the locomotive's end)
    const last = k === slots.length - 1;
    const inside = end ? [-1] : last ? [slot.turned ? -1 : 1] : [1, -1];
    const draw = () => drawSeriesCar(m, SERIES[key][slot.kind], key, { end, pantograph: false, inside });
    return {
      x0: slot.lo + SERIES_GAP, x1: slot.hi - (k === 0 ? 0 : SERIES_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => {
        const placed = () => m.moved(([x, y, z]) => [x + cx, y, z], draw);
        return slot.turned ? m.turned(cx, placed) : placed();
      }),
    };
  });
  articulate({ m }, sections, 1.06, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND, slots.slice(0, -1).map((x) => x.lo));
  return m;
}

function trainLod(key: LiveryKey, n: number): MeshBuilder {
  const slots = wieselTrain(n);
  const built = slots.map((slot, k) => seriesCarLod(SERIES[key][slot.kind], key, { end: slot.kind === "drivingTrailer", pantograph: false, cx: (slot.lo + slot.hi) / 2, turned: slot.turned, section: k }));
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, 1.06, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({ sections: [i, i + 1] as [number, number], front: slot.lo + SERIES_GAP, rear: slots[i + 1]!.hi - SERIES_GAP, profile: BELLOWS })),
    maxBendDeg: MAX_BEND,
  };
  return fitUnit({ palette: trainPalette(key), bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * n));
}

// ---------------------------------------------------------------------------
// The design

export const CITYSHUTTLE_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { drivingTrailer: "Driving trailer", coach: "Coach", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(WIESEL_CARS.map((k) => [String(k), `${k} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
  enumParam("livery", "Livery", { cityShuttle: "CityShuttle", cityjet: "Cityjet" }),
];

/** The kit's parameters a lone car is built with. */
const KIT_PARAMS = seriesParams(SERIES.cityShuttle.drivingTrailer);
const lone = (unit: string, key: LiveryKey): { s: ShinkansenSeries; v: ParamValues } =>
  unit === "coach" ? { s: SERIES[key].coach, v: { unit: "middleCar" } } : { s: SERIES[key].drivingTrailer, v: { unit: "endCar" } };

export function obbCityShuttle(v?: ParamValues): MeshBuilder {
  const p = resolveParams(CITYSHUTTLE_PARAMS, v);
  const key = p.livery as LiveryKey;
  if (p.unit === "train") return drawTrain(key, Number(p.cars));
  const { s, v: values } = lone(p.unit!, key);
  return buildSeries(s, KIT_PARAMS, values);
}

export function obbCityShuttleLod(v?: ParamValues): MeshBuilder {
  const p = resolveParams(CITYSHUTTLE_PARAMS, v);
  const key = p.livery as LiveryKey;
  if (p.unit === "train") return trainLod(key, Number(p.cars));
  const { s, v: values } = lone(p.unit!, key);
  return buildSeriesLod(s, KIT_PARAMS, values);
}

/** Empty weights (t): the driving trailer 49, a coach 48. */
const WEIGHT: Record<Kind, number> = { drivingTrailer: 49, coach: 48 };

function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const key of ["cityShuttle", "cityjet"] as const) {
    const base: ParamValues = key === "cityShuttle" ? {} : { livery: key };
    variants.push({ params: { ...base, unit: "coach" }, weight: WEIGHT.coach, power: 0 });
    for (const n of WIESEL_CARS)
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: wieselTrain(n).reduce((a, s) => a + WEIGHT[s.kind], 0), power: 0 });
  }
  return { weight: WEIGHT.drivingTrailer, power: 0, maxspeed: 140, accel: null, variants };
}

export const CITYSHUTTLE_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-cityshuttle-dd", title: "OBB CityShuttle double-deck coach", build: obbCityShuttle, buildLod: obbCityShuttleLod, params: CITYSHUTTLE_PARAMS,
  lodTriangles: 500, game: game(), catalog: COACH_CATALOG, references: "obb-cityshuttle-dd",
};
