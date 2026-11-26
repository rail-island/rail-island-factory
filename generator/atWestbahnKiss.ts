// The WESTbahn's Stadler KISS (class 4010, Vienna - Salzburg, 2011-), drawn on the series kit
// (shinkansen.ts) from Stadler's KISS base (seriesHelpers.ts `kiss()`), with its own cab face
// (seriesCab.ts), layout and paint. A double-deck EMU for 200 km/h: two motor end cars on Bo'Bo'
// (the leading bogie under the cab section) and trailer middle cars on 2'2', 150.0 m over the
// couplers as six cars (100.36 m as four). The face is the KISS's (the SBB KISS's profile and plan,
// chUnits.ts) with the KISS 2's smaller rectangular windscreen in a dark dome, the white face and the
// light blue apron; the sides in the WESTbahn's white, light blue and lime green with diagonal sweeps
// and orange door frames. Matched to the photographs in assets/westbahn-kiss/ (SOURCES.md).
// See docs/models/austria-trains.md.
//
// Heights over the rail; d behind the face's tip on the face and in the end car's sweeps, else d behind
// the body's front end (the face's join on the end car, the body's end on the middle car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, kiss, NO_NOSE } from "./seriesHelpers.ts";

/** Where the face meets the body. */
const JOIN = 3.2;
/** The running number of the photographed six-car set (photo-westbahn-4010-008-melk.jpg). */
const NUMBER = "4010 008";

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The lamp pods (photo-lr24-kiss-westbahn-stuttgart-hbf.jpg): silver-rimmed housings 0.68 m wide, a round lamp inboard and an LED bar outboard. */
const pod = (lat: number) => ({ lat, y: 1.79, w: 0.68, h: 0.27, r: 0.1, proud: 0.03, depth: 0.06, mat: "podG", lamps: [[-Math.sign(lat) * 0.15, 0.075, "lampHead"], [Math.sign(lat) * 0.15, 0.07, "lampHead"]] as Array<readonly [number, number, string]> });

/**
 * The WESTbahn KISS's front (photo-lr24-kiss-westbahn-stuttgart-hbf.jpg head on, about 189 px/m at the
 * lamps; photo-westbahn-4010-008-melk.jpg): the KISS's face - upright from the apron to the lamps,
 * raked back to the roof - painted white, the light blue apron to 1.58 m with two big grilles either
 * side of the coupler, the white band with two silver-rimmed lamp pods (a round lamp inboard, an LED
 * bar outboard) and the "westbahn" mark between them; the dark dome from 2.05 m to the roof, 1.8 m wide
 * at its foot and widening upward, white wedges left at the face's corners, the KISS 2's smaller
 * rectangular windscreen (1.36 m wide) in it and the roof lamp over it.
 */
const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 2.6, first: 8.7, roofFrom: 4.4, bulge: 0.1, cols: [6, 4, 1, 1], tolerance: 0.05,
  profile: [[0.6, 0.18], [0.75, 0.05], [1.0, 0], [1.6, 0], [1.9, 0.05], [2.2, 0.2], [2.75, 0.6], [3.47, 1.15], [3.9, 1.5], [4.2, 1.8], [4.45, 2.3], [4.6, 3.2]],
  corner: [[0.6, 0.55], [1.5, 0.6], [2.2, 0.75], [3.35, 0.7], [4.0, 0.55], [4.4, 0.35], [4.6, 0.1]],
  rows: [0.6, 0.75, 1.0, 1.58, 2.05, 2.2, 2.75, 3.47, 3.9, 4.2, 4.45, 4.6],
  bands: () => [[0, 0.75, "skirtG"], [0.75, 1.58, "blue"], [1.58, 9, "white"]],
  lodBands: [[0, 0.75, "skirtG"], [0.75, 1.58, "blue"], [1.58, 2.05, "white"], [2.05, 9, "cabMask"]],
  lodGlass: { hw: 0.68, y: [2.3, 3.4] },
  fields: [
    // the dark dome over the windscreen, up to the roof
    { mat: "cabMask", pts: [[-1.0, 2.05], [1.0, 2.05], [1.18, 3.47], [1.18, 4.9], [-1.18, 4.9], [-1.18, 3.47]] },
    { mat: "rubber", pts: [[-0.72, 2.26], [0.72, 2.26], [0.72, 3.44], [-0.72, 3.44]] },
    { mat: "cabGlass", pts: [[-0.68, 2.3], [0.68, 2.3], [0.68, 3.4], [-0.68, 3.4]] },
    { mat: "white", pts: box(-0.36, 0.36, 1.98, 2.2) },
  ],
  // the windscreen (the distant model's glass)
  panes: [{ lat: [-0.66, 0.66], y: [2.32, 3.38], r: 0.03 }],
  decals: [
    // the apron's grilles either side of the coupler, the plate over the coupler
    { mat: "rubber", pts: box(-1.18, -0.68, 0.86, 1.4) }, { mat: "rubber", pts: box(0.68, 1.18, 0.86, 1.4) },
    { mat: "plate", pts: box(-0.34, 0.34, 1.3, 1.52) },
    // the WESTbahn mark: a lime and a blue chevron, then the name
    { mat: "green", pts: [[-0.5, 1.64], [-0.42, 1.64], [-0.36, 1.74], [-0.44, 1.74]] },
    { mat: "blue", pts: [[-0.44, 1.74], [-0.36, 1.74], [-0.3, 1.64], [-0.38, 1.64]] },
    { mat: "markBlue", pts: box(-0.24, 0.42, 1.665, 1.725) },
  ],
  // the name (lower case on the prototype) as a blue bar
  pods: [pod(-0.87), pod(0.87)], roofLamp: [0, 3.98, 0.08],
  number: { lat: 0.1, y: 1.535, h: 0.05, mat: "cabMask" },
  wipers: [[[0.1, 2.36], [0.55, 3.2]]],
};

/** n windows w wide, evenly over d0..d1. */
const row = (d0: number, d1: number, n: number, w: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i): [number, number] => { const d = d0 + ((d1 - d0) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });

/**
 * The sides (photo-westbahn-4010-003-0-wien-westbahnhof.jpg in a projective fit along the end car,
 * photo-westbahn-4010-008-melk.jpg along the middle cars): the end car's cab section with a tall,
 * narrow window and a short one at the mid floor, the first door 8.7 m behind the tip, four wide
 * lower-deck windows between the doors and six on the upper deck from over the first door to over
 * the second; a small mid-floor window and a tall one over the rear bogie. The middle car: a door
 * behind each mid-floor section, five lower windows, seven upper ones, a narrow window over each bogie.
 */
const END: SeriesLayout = {
  doors: [[5.5, 7.0, 1], [15.0, 16.5, -1]],
  windows: row(7.7, 14.6, 4, 1.45),
  rows: [row(7.7, 14.6, 4, 1.45), row(5.6, 16.4, 6, 1.6), [[3.25, 3.85], [17.8, 18.6]], [[0.8, 1.6], [20.4, 21.0]]],
};
const MIDDLE: SeriesLayout = {
  doors: [[5.5, 7.0, 1], [17.3, 18.8, -1]],
  windows: row(7.65, 16.65, 5, 1.5),
  rows: [row(7.65, 16.65, 5, 1.5), row(5.6, 18.7, 7, 1.6), [[2.85, 3.55], [20.75, 21.45]], []],
};

/** Door sill and head, the window rows' sills and heads (lower deck, upper deck). */
const DOOR = [0.68, 2.8] as const;
const LOWER = [1.36, 2.15] as const;
const UPPER = [3.2, 4.0] as const;

/** Orange frames round the doors: strips beside and over each leaf. */
const frames = (l: SeriesLayout): Array<{ mat: string; pts: Pt[] }> =>
  l.doors.flatMap(([d0, d1]) => [
    { mat: "orange", pts: box(d0 - 0.07, d0 - 0.005, DOOR[0] + 0.04, DOOR[1] + 0.07) },
    { mat: "orange", pts: box(d1 + 0.005, d1 + 0.07, DOOR[0] + 0.04, DOOR[1] + 0.07) },
    { mat: "orange", pts: box(d0 - 0.07, d1 + 0.07, DOOR[1] + 0.005, DOOR[1] + 0.07) },
  ]);

/** The dark window bands: the pillars between each deck's windows. */
const windowBands = (l: SeriesLayout): Array<{ mat: string; pts: Pt[] }> =>
  ([[0, LOWER], [1, UPPER]] as const).map(([r, [y0, y1]]) => {
    const sp = l.rows![r]!;
    return { mat: "dark", pts: box(sp[0]![0] - 0.04, sp[sp.length - 1]![1] + 0.04, y0 - 0.04, y1 + 0.04) };
  });

/** A rectangle [d, y] on the end car's body as a sweep (d behind the tip). */
const asSweep = (mat: string, pts: readonly Pt[]) => {
  const [d0, d1] = [Math.min(...pts.map((p) => p[0])) + JOIN, Math.max(...pts.map((p) => p[0])) + JOIN];
  const [y0, y1] = [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
  return { mat, front: [[y0, d0], [y1, d0]] as Pt[], back: [[y0, d1], [y1, d1]] as Pt[] };
};

/** The end of the end car's lower window band, d behind the tip. */
const LOWER_END = 7.7 + 6.9 * 7 / 8 + 0.725 + 0.04 + JOIN;

/** A diagonal stripe w wide rising backward from d at the skirt (about 0.9 m back for each metre up), in pieces between the window bands. */
const diagonal = (mat: string, d: number, w: number): Array<{ mat: string; pts: Pt[] }> => {
  const at = (y: number) => d + (y - 0.75) * 0.88;
  return ([[0.75, LOWER[0] - 0.04], [LOWER[1] + 0.04, UPPER[0] - 0.04]] as const).map(([y0, y1]) => ({ mat, pts: [[at(y0), y0], [at(y0) + w, y0], [at(y1) + w, y1], [at(y1), y1]] as Pt[] }));
};

/**
 * The WESTbahn paint (photo-westbahn-4010-008-melk.jpg, photo-20250519-westbahn-4010023.jpg,
 * photo-2018-06-15-...-st-valentin-...jpg): light grey-white over a light blue skirt band, a lime
 * green band at the lower windows; on the end car a white sweep rising from the face's white band to
 * the roof, a broad light blue one behind it that holds the upper deck to the car's end, a dark wedge
 * under the cab's roof fairing, a white wedge over the lower windows and the lime green coming up
 * behind them; on the middle cars a lime and a blue diagonal behind the first door. The windows in
 * dark bands, orange frames round the doors, a white roof.
 */
const WESTBAHN: ShinkansenLivery = {
  title: "WESTbahn", number: NUMBER,
  palette: {
    white: c("#eef0f0"), blue: c("#6cc3e6"), green: c("#bcd631"), dark: c("#2c3238", 0.4), orange: c("#e58a3c"),
    roofG: c("#dfe2e3", 0.5), skirtG: c("#2b2e31", 0.75), cabMask: c("#1e2124", 0.3), podG: c("#c4c8cb", 0.35), plate: c("#d9dbdc", 0.5), markBlue: c("#2a6fa8"),
  },
  bands: [[0, 1.5, "blue"], [1.5, 2.2, "green"], [2.2, 9, "white"]],
  // the end car: white between the blue skirt band and the blue upper deck, the dark window bands
  // laid under the sweeps (sideFields), which keep off them; only the first two sweeps, under the
  // windows' frames, may cross a window
  endBands: [[0, 1.5, "blue"], [1.5, 3.1, "white"], [3.1, 9, "blue"]],
  // the first door in the blue sweep, the second in the lime
  endCarDoors: [[0, 9, "blue"]], endCarDoorsEach: [undefined, [[0, 9, "green"]]],
  roof: "roofG", skirt: "skirtG",
  // d behind the tip
  endSweeps: [
    // the broad blue sweep rising behind the cab, up to the lower windows' band and the white wedge over it
    { mat: "blue", front: [[1.5, 4.9], [2.5, 6.0], [3.1, 6.66]], back: [[1.5, 11.0], [2.2, 11.0], [2.25, 10.95], [3.1, 12.65]] },
    // white ahead of it on the upper deck
    { mat: "white", front: [[3.1, -9], [4.1, -9]], back: [[3.1, 6.66], [3.5, 7.1], [4.1, 7.8]] },
    // the face's white band on the cab sides (the face takes the middle cars' bands there), short of the tall window
    { mat: "white", front: [[1.5, -9], [2.2, -9]], back: [[1.5, 3.95], [2.2, 3.95]] },
    // the lime green behind the lower windows
    { mat: "green", front: [[1.5, LOWER_END], [2.2, LOWER_END]], back: [[1.5, 25.1], [2.2, 25.1]] },
    // the dark wedge under the cab's roof fairing
    { mat: "dark", front: [[3.5, 3.45], [4.05, 3.2]], back: [[3.5, 3.6], [4.05, 6.6]] },
    // the cab window: a raked pane in its dark surround
    { mat: "cabMask", front: [[2.0, 1.4], [2.6, 1.8], [3.3, 2.3], [3.45, 2.6]], back: [[2.0, 3.55], [3.45, 3.55]] },
    { mat: "cabGlass", front: [[2.1, 1.75], [3.3, 2.5]], back: [[2.1, 3.4], [3.3, 3.4]] },
    // the door frames
    ...frames(END).map(({ mat, pts }) => asSweep(mat, pts)),
  ],
  // the distant end car: blue behind the white cab section (its triangle budget merges finer fields)
  lodSideFields: { end: [{ d: [6.0, 25.4], bands: [[0, 9, "blue"]] }] },
  sideFields: {
    end: windowBands(END),
    middle: [
      ...windowBands(MIDDLE),
      // the lime and the blue diagonals behind the first door, cut round the window bands
      ...diagonal("green", 8.8, 0.7), ...diagonal("blue", 9.6, 0.8),
      ...frames(MIDDLE),
    ],
  },
};

/**
 * The WESTbahn KISS (class 4010): the KISS base with the WESTbahn's car lengths - end cars 25.36 m
 * from the tip to the coupling plane, middle cars 24.82 m, which give the published 150.0 m for six
 * cars and 100.36 m for four - its 2.8 m width and 4.595 m height, 920 mm wheels; the leading bogie
 * under the cab section, the others under the mid-floor ends; one single-arm pantograph on each end
 * car. 296 t as six cars (end cars 62 t, middle cars 43 t), 6,000 kW (1,000 kW a car for the game, as
 * the SBB KISS), 200 km/h.
 */
export const WESTBAHN_KISS: ShinkansenSeries = {
  ...kiss({ liveries: { westbahn: WESTBAHN }, weight: { end: 62, middle: 43 }, power: 1000, maxspeed: 200, cars: [4, 6] }),
  endLength: 25.36, midLength: 24.82,
  // the side upright to the upper windows' heads, the roof's tight edge above them
  S: 4.1, A: 0.68,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  // lower deck, upper deck, the mid-floor windows over the bogies, the cab section's tall window
  windows: [LOWER, UPPER, [2.4, 3.25], [1.6, 3.05]], door: [DOOR[0], DOOR[1], 1.65, 2.45], doorW: 1.5, doorGlassW: 0.3,
  layout: { end: END, middle: MIDDLE },
  endBogies: [2.3, 19.3], centredBogies: true, bogieCentres: 18.7, wheelR: 0.46, endPantograph: true,
};

const P = seriesParams(WESTBAHN_KISS);

export function westbahnKiss(v?: ParamValues): MeshBuilder { return buildSeries(WESTBAHN_KISS, P, v); }
export function westbahnKissLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(WESTBAHN_KISS, P, v); }

export const WESTBAHN_KISS_DESIGN = seriesDesign("proc-vehicle-westbahn-kiss", "WESTbahn KISS", WESTBAHN_KISS, P, westbahnKiss, westbahnKissLod, "westbahn-kiss", "uic");
