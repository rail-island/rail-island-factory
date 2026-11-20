// The SNCF Z 20500 ("Z 2N", CIMT / ANF / GEC-Alsthom 1988 - 1998, MBD design), drawn on the series
// kit (shinkansen.ts) with its own cab face (seriesCab.ts): the double-deck suburban unit of the RER C
// and D and the Transilien, two motor cars (ZBe, 25.10 m over the couplers, Bo'Bo') with two or three
// long trailers between them (ZRBe / ZRABe, 26.40 m, 2'2'): the 4-car unit 103.00 m, the 5-car one
// 129.40 m (fr.wikipedia "Z 20500"; the short 24.28 m trailers of the second series are not drawn).
//
// - The cab: the flat, faceted MBD face, upright from the lamp band (1.34 - 1.98 m) and leaning back
//   about 10 degrees over the windscreen to the destination box, the top edge bevelled back to the
//   roof, both corners cut in 45-degree chamfers (0.23 m across) that widen into the lower corner; the
//   two-pane windscreen and the destination box in one dark panel, the lamp band dark under the
//   band carrying the unit number; anti-climber pads and the centre coupler under the face; the
//   cab's roof box over the face.
// - The motor car: the cab side window, the equipment room's big panel with its grille high up and
//   the crew door, the first double door (centre 7.1 m behind the tip), the double deck (five
//   windows a deck, the lower deck in the well between the bogies), the second door (17.8 m) and the
//   end section over the motor bogie (two windows at the intermediate level, a grille panel) under the
//   lowered roof holding the single-arm pantograph.
// - The trailer: a double door over each bogie (the doors centred 3.2 m inside the ends), between
//   them the double deck, ten windows a deck, the lower deck in the well.
//
// Measured on the photographs in assets/sncf-z20500/ (SOURCES.md): the 5-car Transilien unit side-on
// at Etigny (a 1-D projective fit over the cab, the motor car's end at 25.10 m and the first
// trailer's at 51.50 m: about 33 px/m at the motor car's double deck, 13 px/m at the trailer's end;
// heights about 32.9 px/m up the motor car's side from the crown), 20580 at Montigny head-on (the
// face at 78 px/m, the crown 4.32 m to the coupler 1.0 m), 20840 at Enghien from above (the face's
// width 2.82 m = 213 px: the chamfers, panes and lamps), 20559 at Paris-Est (the face's rake and
// corners), 20834 at Paris-Est 2023 (the cab side, Transilien scheme), 20578 (390) and the roof
// from above at La Ferte-sous-Jouarre (the pantograph in the end section's well).
//
// Heights over the rail; on the face d behind its tip (`t` below), else d behind the body's front end
// (the face's join on the motor car, the coupling gap on a trailer). See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Lengths over the couplers: the motor car ZBe and the long trailer ZRBe (fr.wikipedia). */
const MOTOR_LENGTH = 25.1;
const TRAILER_LENGTH = 26.4;
/** The face meets the body 0.7 m behind its tip (the bevelled top edge reaching the crown); the coupling plane 0.3 m ahead of it. */
const JOIN = 0.7;
const REACH = 0.3;
/** d behind the face's tip on the motor car's body. */
const T = (t: number) => t - JOIN;
/** The bodies: the motor car's (the kit's 0.25 m gap at its inner end) and the trailer's. */
const MOTOR_L = MOTOR_LENGTH - 0.25 - JOIN - REACH;
const TRAILER_L = TRAILER_LENGTH - 0.5;

/** Half width (2.82 m), shoulder and crown (4.32 m, fr.wikipedia). */
const W = 1.41;
const S = 3.95;
const C = 4.32;
/** Over the bogies and at the ends (the vestibules, 1.05 m): belly, skirt top and bottom. */
const Y_END = 1.08;
const A_END = 1.0;
const B_END = 0.95;

/** The window rows: the lower deck (in the well), the upper deck, the end section's intermediate level. */
const LOWER: readonly [number, number] = [0.98, 1.86];
const UPPER: readonly [number, number] = [2.92, 3.68];
const MID: readonly [number, number] = [1.92, 2.55];
/** The band between the decks (navy on the original scheme, white on the Transilien one). */
const BAND: readonly [number, number] = [1.86, 2.92];

/** The face's lamp band, the band under the windscreen, the windscreen's panel. */
const LAMPS: readonly [number, number] = [1.53, 1.98];
const PANEL: readonly [number, number] = [2.28, 4.06];

/**
 * The face's centre line (20580 head-on, 20559 three-quarter): the black under-front to 1.34 m, upright
 * past the lamp band, leaning back about 10 degrees from the band under the windscreen to the top of
 * the destination box, then the bevelled top edge to the crown.
 */
const PROFILE: Pt[] = [[B_END, 0.12], [1.15, 0.04], [1.34, 0], [1.98, 0], [2.28, 0.04], [3.44, 0.25], [4.06, 0.35], [4.12, 0.39], [4.24, 0.54], [C, JOIN]];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), LAMPS[0], 2.34, 3.42, 3.5, 3.58, 3.62, 3.98])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The cab face, painted by material so that one face serves both schemes: `frame` the face's own colour
 * (red on the original scheme, blue on the Transilien one), `faceDark` the windscreen's panel and the
 * lamp band.
 */
const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.35, reach: REACH, first: 6.4, roofFrom: C - 0.01, bulge: 0, tolerance: 0.02,
  // one column across each chamfer: a flat cut, not a round corner
  cols: [6, 1, 1, 1],
  profile: PROFILE,
  // the 45-degree chamfers 0.23 m across, widening into the cut lower corner
  corner: [[B_END, 0.42], [1.34, 0.26], [1.98, 0.23], [4.06, 0.23], [4.24, 0.3], [C, 0.4]],
  rows: ROWS,
  bands: () => [[0, 1.34, "black"], [1.34, 9, "frame"]],
  lodBands: [[0, 1.34, "black"], [1.34, LAMPS[0], "frame"], [LAMPS[0], LAMPS[1], "faceDark"], [LAMPS[1], PANEL[0], "frame"], [PANEL[0], PANEL[1], "faceDark"], [PANEL[1], 9, "frame"]],
  lodGlass: { hw: 1.1, y: [2.34, 3.42] },
  masks: [
    // the lamp band and the windscreen's panel across the flat face
    { lat: [-1.17, 1.17], y: LAMPS, r: 0.03, mat: "faceDark" },
    { lat: [-1.17, 1.17], y: PANEL, r: 0.04, mat: "faceDark" },
  ],
  // the two windscreen panes and the destination box
  panes: [{ lat: [-1.1, -0.035], y: [2.34, 3.42], r: 0.03 }, { lat: [0.035, 1.1], y: [2.34, 3.42], r: 0.03 }, { lat: [-1.08, 1.08], y: [3.62, 3.98], r: 0.02 }],
  decals: [
    // the visor's grey bars over the windscreen, the number plate in the lamp band
    { mat: "faceTrim", pts: box(-1.1, 1.1, 3.5, 3.58), fine: 1 },
    { mat: "plate", pts: box(-0.5, 0.5, 1.58, 1.93), fine: 1 },
  ],
  // the headlights outside, the tail lamps inside them
  lamps: [[-0.95, 1.755, 0.13, "lampHead"], [0.95, 1.755, 0.13, "lampHead"], [-0.69, 1.755, 0.085, "lampRed"], [0.69, 1.755, 0.085, "lampRed"]],
  // the running number on the plate
  number: { lat: -0.36, y: 1.67, h: 0.17, mat: "white" },
  // the wipers hang from the visor
  wipers: [[[-0.6, 3.44], [-0.85, 2.55]], [[0.5, 3.44], [0.3, 2.55]]],
};

/** A double door 1.4 m wide centred at d, its leaves sliding apart. */
const DOOR_W = 1.4;
const door = (dc: number): Array<readonly [number, number, number]> => [[dc - DOOR_W / 2, dc, -1], [dc, dc + DOOR_W / 2, 1]];
/** n windows of width w centred on d at pitch p. */
const row = (centre: number, n: number, w: number, p: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => { const m = centre + (i - (n - 1) / 2) * p; return [m - w / 2, m + w / 2] as const; });

/**
 * The motor car (Etigny's projective fit, t behind the tip): the doors centred 7.1 and 17.8 m behind the
 * tip, five windows a deck 1.2 m wide at 1.53 m between them, the end section's two windows.
 */
const M_DOORS = [T(7.1), T(17.8)] as const;
const M_DD = row(T(12.45), 5, 1.2, 1.53);
const M_MID: Array<readonly [number, number]> = [[T(19.0), T(19.6)], [T(20.45), T(21.0)]];
const MOTOR_LAYOUT: SeriesLayout = { doors: [...door(M_DOORS[0]), ...door(M_DOORS[1])], windows: [], rows: [M_DD, M_DD, M_MID] };
/** The trailer: the doors over the bogies (3.2 m inside the coupling planes), ten windows a deck 1.25 m wide at 1.6 m. */
const R_DOORS = [3.2 - 0.25, TRAILER_L - 3.2 + 0.25] as const;
const R_DD = row(TRAILER_L / 2, 10, 1.25, 1.6);
const TRAILER_LAYOUT: SeriesLayout = { doors: [...door(R_DOORS[0]), ...door(R_DOORS[1])], windows: [], rows: [R_DD, R_DD, []] };

const rect = (d0: number, d1: number, [y0, y1]: readonly [number, number]): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y1]];
type Field = { mat: string; pts: Pt[] };

/** The original scheme's navy: the panel round the cab side window and the grille, the band between the decks broken by the doors. */
function navyFields(end: boolean): Field[] {
  const h = DOOR_W / 2;
  if (end) {
    const [f, r] = M_DOORS;
    return [
      { mat: "navy", pts: rect(0.02, T(4.8), [1.75, 3.7]) },
      { mat: "navy", pts: rect(f + h, r - h, BAND) },
      { mat: "navy", pts: rect(r + h, MOTOR_L - 0.02, BAND) },
      // the red SNCF bubble under the panel
      { mat: "red", pts: [[T(4.05), 1.28], [T(4.5), 1.24], [T(4.62), 1.45], [T(4.55), 1.66], [T(4.1), 1.7], [T(3.98), 1.5]] },
    ];
  }
  const [f, r] = R_DOORS;
  return [rect(0.02, f - h, BAND), rect(f + h, r - h, BAND), rect(r + h, TRAILER_L - 0.02, BAND)].map((pts) => ({ mat: "navy", pts }));
}

/** The fruit's red beside the leaves and its white rim (the teardrop about 2.2 m wide, its point 3.7 m up). */
const FRUIT_PAD = 0.38;
const FRUIT_RIM = 0.1;

/** A Transilien fruit round the door centred at dc: red beside and over the leaves in a white rim, the teardrop's point on top. */
function fruit(dc: number): Field[] {
  const a = dc - DOOR_W / 2, e = dc + DOOR_W / 2, p = FRUIT_PAD, k = FRUIT_RIM, y0 = 1.12, top = 3.1;
  const [l, rt] = [a - p, e + p];
  const out: Field[] = [
    { mat: "red", pts: rect(l, a, [y0, top]) },
    { mat: "red", pts: rect(e, rt, [y0, top]) },
    { mat: "red", pts: [[l, top], [rt, top], [rt - 0.2, 3.42], [dc, 3.6], [l + 0.2, 3.42]] },
    { mat: "white", pts: rect(l - k, l, [y0, top]) },
    { mat: "white", pts: rect(rt, rt + k, [y0, top]) },
  ];
  // the rim round the point, in four slanted strips
  for (const sd of [1, -1]) {
    const x = (u: number) => dc + sd * u, half = DOOR_W / 2 + p;
    const q = (pts: Pt[]): Pt[] => (sd > 0 ? pts : pts.map(([d, y]): Pt => [d, y]).reverse());
    out.push({ mat: "white", pts: q([[x(half), top], [x(half + k), top], [x(half - 0.2 + k * 0.7), 3.42 + k * 0.7], [x(half - 0.2), 3.42]]) });
    out.push({ mat: "white", pts: q([[x(half - 0.2), 3.42], [x(half - 0.2 + k * 0.7), 3.42 + k * 0.7], [x(0), 3.6 + k], [x(0), 3.6]]) });
  }
  return out;
}

/** The Transilien scheme's white band between the decks, broken by the fruits; the fruits; the motor car's green leaf round its cab side window. */
function transilienFields(end: boolean): Field[] {
  const s = DOOR_W / 2 + FRUIT_PAD + FRUIT_RIM;
  if (end) {
    const [f, r] = M_DOORS;
    return [
      { mat: "white", pts: rect(f + s, r - s, BAND) },
      { mat: "white", pts: rect(r + s, MOTOR_L - 0.02, BAND) },
      ...fruit(f), ...fruit(r),
      // the leaf, its point up ahead of the window, its stalk under it
      { mat: "green", pts: [[0.5, 3.85], [1.4, 3.15], [1.62, 2.3], [1.5, 1.6], [1.15, 1.18], [0.66, 1.42], [0.36, 2.1], [0.36, 3.1]] },
      { mat: "green", pts: [[1.13, 1.18], [1.2, 1.18], [1.26, 1.02], [1.21, 1.02]] },
    ];
  }
  const [f, r] = R_DOORS;
  return [
    { mat: "white", pts: rect(0.02, f - s, BAND) },
    { mat: "white", pts: rect(f + s, r - s, BAND) },
    { mat: "white", pts: rect(r + s, TRAILER_L - 0.02, BAND) },
    ...fruit(f), ...fruit(r),
  ];
}

const BASE_PALETTE = {
  black: c("#17191b", 0.5), roofG: c("#8e9296", 0.6), skirtG: c("#3b3e42", 0.75), grille: c("#2b2e32", 0.6), roofBox: c("#3d4146", 0.6),
  faceTrim: c("#9a9fa4", 0.4), plate: c("#2b2f34", 0.45), white: c("#f1f2ef"), red: c("#d0202f"), cabMask: c("#1d1f22", 0.3),
};

/**
 * The original Ile-de-France scheme (20580 at Montigny, 20840 at Enghien, 20559): light grey, the navy
 * band between the decks and the panel round the cab side window, red doors, the face red round its
 * dark panels.
 */
const ILE_DE_FRANCE: ShinkansenLivery = {
  title: "Ile-de-France", number: "20580",
  palette: { ...BASE_PALETTE, grey: c("#cdd0d3"), lower: c("#cdd0d3"), navy: c("#28336a"), frame: c("#d0202f"), faceDark: c("#33373c", 0.45) },
  bands: [[0, 9, "grey"]], doors: [[0, 9, "red"]], roof: "roofG", skirt: "skirtG",
  front: [[0, 1.34, "black"], [1.34, 9, "frame"]],
  sideFields: { end: navyFields(true), middle: navyFields(false) },
  lodSides: [[0, BAND[0], "grey"], [BAND[0], BAND[1], "navy"], [BAND[1], 9, "grey"]],
  // the distant model's navy panel behind the cab
  lodSideFields: { end: [{ d: [0.75, 4.8], bands: [[0, 1.75, "grey"], [1.75, 3.7, "navy"], [3.7, 9, "grey"]] }] },
};

/**
 * The Transilien scheme of the Paris-Est units (20834 at Paris-Est 2023, the 5-car unit at Etigny):
 * blue, the white band between the decks, each door in a fruit (drawn red: the real ones are red,
 * green, orange or light blue), the green leaf round the motor car's cab side window, the face blue
 * round its dark panels.
 */
const TRANSILIEN: ShinkansenLivery = {
  title: "Transilien", number: "20834",
  palette: { ...BASE_PALETTE, blue: c("#2050bb"), lower: c("#2050bb"), green: c("#43c13e"), frame: c("#2050bb"), faceDark: c("#1c1e22", 0.4) },
  bands: [[0, 9, "blue"]], doors: [[0, 9, "red"]], roof: "roofG", skirt: "skirtG",
  front: [[0, 1.34, "black"], [1.34, 9, "frame"]],
  sideFields: { end: transilienFields(true), middle: transilienFields(false) },
  lodSides: [[0, BAND[0], "blue"], [BAND[0], BAND[1], "white"], [BAND[1], 9, "blue"]],
  // the distant model's blue ahead of the first fruit
  lodSideFields: { end: [{ d: [0.7, 6.2], bands: [[0, 9, "blue"]] }] },
};

/** The motor car's lowered roof over its end section (the pantograph's well): crown and shoulder, the ramp, its length. */
const WELL = { C: 3.86, S: 3.78, ramp: 0.35, end: MOTOR_L - T(18.65), front: 0, rear: 0, step: 0.25, endCarOnly: true };

/** The fittings: the cab's lower front and roof box, the equipment under the motor car's floor outside the well. */
function z2nFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (!car.end) return;
  // t behind the tip
  const at = (mat: string, t0: number, t1: number, y0: number, y1: number, z0: number, z1: number) => {
    const [x0, x1] = [X(T(t0)), X(T(t1))];
    block(m, mat, Math.min(x0, x1), Math.max(x0, x1), y0, y1, z0, z1);
  };
  m.scope("lower front", () => {
    // the dark structure under the face, the anti-climber pads at the corners
    at("skirtG", 0.1, 1.2, 0.74, B_END + 0.02, -0.95, 0.95);
    for (const sd of [1, -1]) at("black", -0.22, 0.12, 0.84, 1.24, sd > 0 ? 0.72 : -1.28, sd > 0 ? 1.28 : -0.72);
  });
  m.scope("coupler", () => {
    at("carbon", -REACH, 0.12, 0.92, 1.08, -0.1, 0.1);
    at("carbon", -REACH - 0.05, -REACH + 0.12, 0.82, 1.16, -0.22, 0.22);
  });
  m.scope("roof box", () => at("roofBox", 0.78, 2.15, C - 0.06, C + 0.13, -0.72, 0.72));
  m.scope("underfloor", () => {
    // the traction equipment between the front bogie and the well, and ahead of the rear bogie
    at("under", 5.15, 8.1, 0.5, B_END - 0.01, -1.12, 1.12);
    at("under", 16.85, 19.3, 0.52, B_END - 0.01, -1.12, 1.12);
  });
}

export const Z20500: ShinkansenSeries = {
  endLength: MOTOR_LENGTH, midLength: TRAILER_LENGTH, W, Y: Y_END, S, C, lean: 0.95, B: B_END, A: A_END,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [LOWER, UPPER, MID], windowW: 1.2, pitch: 1.53,
  // plug doors of two leaves, a narrow window in each leaf
  door: [1.05, 3.1, 1.8, 2.9], doorW: DOOR_W, doorGlassW: 0.3,
  layout: { end: MOTOR_LAYOUT, middle: TRAILER_LAYOUT },
  // the cab side window (its upper part sliding)
  cabWindows: [[T(1.38), T(2.03), 2.2, 3.35]],
  sidePanels: {
    end: [
      // the equipment room's panel and its grille high up, the crew door; the end section's grille
      { d: [2.8, 4.78], y: [1.2, 3.38], kind: "seam" },
      { d: [2.88, 4.7], y: [2.55, 3.25], kind: "panel", mat: "grille" },
      { d: [4.86, 5.46], y: [1.15, 3.0], kind: "seam" },
      { d: [21.6, 23.4], y: [2.2, 2.88], kind: "panel", mat: "grille" },
    ],
  },
  // the lower deck in the well between the bogies (the body's foot 0.45 m)
  lowWell: { end: [T(8.25), T(16.65)], middle: [4.1, TRAILER_L - 4.1], Y: 0.62, A: 0.56, B: 0.45, lodMat: "lower" },
  // Bo'Bo' motor cars, bogie centres 17.8 m, centred on the car; the trailers' 20.0 m; 2.4 m wheelbase
  endBogies: [MOTOR_LENGTH / 2 - REACH - 8.9 - JOIN, MOTOR_LENGTH / 2 - REACH + 8.9 - JOIN], midBogies: [3.2 - 0.25, TRAILER_L - 3.2 + 0.25],
  bogieCentres: 17.8, wheelR: 0.46, wheelbase: 2.4,
  // a single-arm pantograph on each motor car, in the well over its end section
  endPantograph: true, pantographAt: T(21.4), roofWells: WELL,
  fittings: z2nFittings,
  cars: [4, 5],
  liveries: { transilien: TRANSILIEN, ileDeFrance: ILE_DE_FRANCE },
  // 2,800 kW a unit (700 kW a car of four); 4-car 229.0 t, 5-car 273.5 t: motor cars 70 t, trailers 44.5 t
  weight: { end: 70, middle: 44.5 }, power: 700, maxspeed: 140,
};

export const Z20500_PARAMS = seriesParams(Z20500);

export function sncfZ20500(v?: ParamValues): MeshBuilder { return buildSeries(Z20500, Z20500_PARAMS, v); }
export function sncfZ20500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(Z20500, Z20500_PARAMS, v); }

export const Z20500_DESIGN = seriesDesign("proc-vehicle-sncf-z20500", "SNCF Z 20500", Z20500, Z20500_PARAMS, sncfZ20500, sncfZ20500Lod, "sncf-z20500", "uic");
