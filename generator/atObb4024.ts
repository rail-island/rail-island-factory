// The OBB class 4024 (Bombardier Talent, 2004 - 2008) on the series kit (shinkansen.ts): four cars on
// five bogies, Bo'2'2'2'Bo' - a motor bogie under each cab, Jacobs bogies under the three joints. The
// end cars stand high over their motor bogies (the window band raised from the cab to the door) and
// low (590 mm at the doors) toward the joints; one double sliding door a side on an end car, two on
// an intermediate car. The rounded GRP front: the plough, the coupler in its recess, the black mask
// holding the lamp panel, the raked windscreen and the destination display, wrapping round the
// corners to a red pillar before the cab's own side window; the dark grey cap on the cab roof with
// its lamps and grilles. The "Triebwagen" (the leading end car) carries the single-arm pantograph on
// its high-voltage module, the "Steuerwagen" at the rear its air conditioning. Two liveries: the
// delivery paint (white, red front and red joints, the black window band) and the Cityjet repaint
// (white, a red band under the windows, the red-framed mask, black doors). Registered in atUnits.ts.
// See docs/models/austria-trains.md and assets/obb-4024/SOURCES.md.
//
// Heights over the rail; d behind the face's tip (the lower face's front, 0.8 - 1.45 m up) on the
// face, else d behind the body's front end (the face's join on an end car, the joint's gap on an
// intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries, type SeriesLayout } from "./shinkansen.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, shapedCrownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const OBB_RED = "#e2001a";

/** Where the face meets the body; the coupling plane ahead of the tip. */
const DJOIN = 2.4;
const REACH = 0.35;
/** The crown over the rail; the cab roof's hump (the dark grey cap) rises to CAB_C over the cab and falls back behind it. */
const C = 3.85;
const CAB_C = 4.02;
/** The face's centre line, [y, d behind the tip] (see the face). */
const CAB_PROFILE: Pt[] = [
  [0.45, 0.18], [0.6, 0.07], [0.75, 0.01], [0.85, 0], [1.2, 0.03], [1.6, 0.1], [2.0, 0.2], [2.35, 0.3], [2.75, 0.5], [3.05, 0.74],
  [3.35, 1.02], [3.58, 1.3], [3.75, 1.6], [3.9, 1.95], [3.98, 2.2], [CAB_C, DJOIN],
];
/** The hump behind the face's join: flat to 1.8 m, down to the crown by 2.9 m (body d). */
const CAB_HUMP: Pt[] = [[0, CAB_C], [1.8, CAB_C], [2.3, 3.95], [2.9, C]];

/**
 * The window bands, measured on the Ennstal photograph (28 px/m up the side at the door): over the
 * low floor 1.36 - 2.64 m, over the end car's high floor (cab to door) 1.96 - 3.25 m.
 */
const LOW_BAND: readonly [number, number] = [1.36, 2.64];
const HIGH_BAND: readonly [number, number] = [1.96, 3.25];
const LOW: readonly [number, number] = [1.4, 2.6];
const HIGH: readonly [number, number] = [2.0, 3.21];

/** The end car's door (tip d), the high windows ahead of it and the low ones behind it. */
const T_DOOR: readonly [number, number] = [11.4, 12.9];
const B0 = DJOIN;
const t = (d: number) => d - B0;
/** Windows from d0 to d1, n of them, `post` between them. */
const paneRow = (d0: number, d1: number, n: number, post: number): Array<readonly [number, number]> => {
  const w = (d1 - d0 - (n - 1) * post) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * (w + post), d0 + i * (w + post) + w] as const);
};
const END_HIGH = paneRow(t(5.3), t(11.15), 4, 0.12);
const END_LOW = paneRow(t(13.15), t(16.75), 2, 0.12);
/** The end car's body from the join to its inner end (the joint's gap behind the coupling plane). */
const END_BODY = 18.685 - REACH - DJOIN - 0.25;

/** An intermediate car (14.25 m body): doors centred 4.25 and 10.0 m from its front, a window between joint and door, two between the doors. */
const MID_BODY = 14.75 - 0.5;
const MID_DOORS: ReadonlyArray<readonly [number, number]> = [[3.5, 5.0], [9.25, 10.75]];
const MID_WINDOWS: Array<readonly [number, number]> = [[0.35, 3.35], ...paneRow(5.2, 9.05, 2, 0.12), [10.95, 13.9]];

/** Body spans of a double sliding door, its two leaves parting. */
const leaves = ([d0, d1]: readonly [number, number]): Array<readonly [number, number, number]> => [[d0, (d0 + d1) / 2, -1], [(d0 + d1) / 2, d1, 1]];

const END_LAYOUT: SeriesLayout = { doors: leaves([t(T_DOOR[0]), t(T_DOOR[1])]), windows: [], rows: [END_LOW, END_HIGH] };
const MID_LAYOUT: SeriesLayout = { doors: MID_DOORS.flatMap(leaves), windows: [], rows: [MID_WINDOWS, []] };

/** The red joint panels: this far from each joint, full height but for the window band. */
const JOINT_RED = 1.5;

const rect = (d0: number, d1: number, y0: number, y1: number): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y1]];
/** Red panels at body d [d0, d1] around the low window band. */
const jointRed = (d0: number, d1: number) => [
  { mat: "red", pts: rect(d0, d1, 0.64, LOW_BAND[0]) },
  { mat: "red", pts: rect(d0, d1, LOW_BAND[1], 3.36) },
];

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** A closed outline from a right half (foot's centre to head's centre). */
const closed = (half: Pt[]): Pt[] => [...half, ...mirror(half).slice(1, -1)];
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The black mask seen head-on (right half, foot's centre to head's centre), grown by g: the lamp
 * panel's foot bowed down at the middle, the sides following the face's corners up past the
 * windscreen, the head rounding in under the cap (Graz and Seefeld photographs).
 */
function maskHalf(g: number): Pt[] {
  return [[0, 1.62 - g], [0.55, 1.64 - g], [0.92 + g * 0.8, 1.7 - g * 0.8], [1.06 + g, 1.88], [1.12 + g, 2.25], [1.12 + g, 2.75], [1.05 + g, 3.1], [0.92 + g * 0.8, 3.4 + g * 0.6], [0.6, 3.55 + g], [0, 3.58 + g]];
}
/** The windscreen's glass and the display over it. */
const SCREEN: Pt[] = closed([[0, 2.24], [1.0, 2.24], [1.05, 2.5], [1.04, 2.9], [0.96, 3.12], [0, 3.16]]);

const FACE: SeriesCabFace = {
    dJoin: DJOIN, dSide: 2.0, reach: REACH, first: T_DOOR[0], roofFrom: 3.58, cols: [5, 3, 1, 1], tolerance: 0.035,
    // the face's silhouette on the Ennstal photograph (8x crop at the tip: 251 px/m up, 208 px/m along):
    // its foremost point at the coupler (0.85 m), leaning back ever more steeply past the logo, the mask's
    // foot (0.1 m back at 1.6 m), the lamps and the windscreen (0.3 m at 2.35 m, 0.74 m at 3.05 m) to the
    // display's head (1.3 m at 3.58 m), then rounding over into the cab roof's hump, 4.02 m high 2.4 m
    // behind the tip - the whole nose about 2.75 m from the coupling plane to the full roof
    profile: CAB_PROFILE,
    // in plan a broad front rounding strongly into the sides, the corners swept back 1.0 - 1.45 m
    corner: [[0.45, 0.7], [0.85, 0.75], [1.6, 0.85], [2.35, 0.95], [3.05, 1.05], [3.35, 1.0], [3.58, 0.9], [3.75, 0.75], [3.9, 0.5], [3.98, 0.3], [CAB_C, 0.12]],
    cornerDepth: [[0.45, 1.0], [0.85, 1.1], [1.6, 1.3], [2.35, 1.45], [3.05, 1.4], [3.35, 1.25], [3.58, 1.0], [3.75, 0.7], [3.9, 0.38], [3.98, 0.15], [CAB_C, 0.08]],
    // the front bowed: most at the lamps and the windscreen's foot, flattening toward the roof
    bulge: [[0.45, 0.08], [1.6, 0.14], [2.35, 0.16], [3.05, 0.12], [3.58, 0.07], [CAB_C, 0.03]],
    rows: [...new Set([...CAB_PROFILE.map(([y]) => y), 1.3, 1.36, 1.45, 1.62, 1.75, 2.24, 3.17, 3.42, 3.72, 3.84])].sort((a, b) => a - b),
    // the dark grey cap: the roof's paint from the display's head over the hump (the body's part in the fittings)
    paint: [{ mat: "capG", front: [[3.58, -9], [CAB_C + 0.1, -9]], back: [[3.58, DJOIN + 0.1], [CAB_C + 0.1, DJOIN + 0.1]], top: CAB_C + 0.1 }],
    // (the face's paint is the livery's `front`; the distant model's face red under the black mask)
    lodBands: [[0, 1.62, "red"], [1.62, 3.58, "band"]],
    fields: [
      // the coupler's recess
      { mat: "recess", pts: box(-0.45, 0.45, 0.78, 1.18) },
      { mat: "band", pts: closed(maskHalf(0)) },
      { mat: "screen", pts: SCREEN },
      // the destination display and the lamp panel's grille
      { mat: "recess", pts: box(-0.72, 0.72, 3.22, 3.42) },
      { mat: "grille", pts: box(-0.5, 0.5, 1.72, 2.1) },
      // the cap's lamp slot over the display
      { mat: "recess", pts: box(-0.5, 0.5, 3.72, 3.84) },
    ],
    panes: [],
    lodGlass: { hw: 1.0, y: [2.24, 3.16] },
    texts: [
      { text: "WIEN HBF", lat: 0, y: 3.27, h: 0.09, mat: "display" },
      // the OBB letters under the mask (white on the red, red on the Cityjet's white: the livery's logo paint)
      { text: "OBB", lat: 0, y: 1.3, h: 0.14, mat: "logo" },
    ],
    // the headlights outside, the tail lamps inside them, in the lamp panel
    lamps: [[-0.82, 1.92, 0.075, "lampHead"], [0.82, 1.92, 0.075, "lampHead"], [-0.64, 1.92, 0.05, "lampRed"], [0.64, 1.92, 0.05, "lampRed"], [-0.34, 3.78, 0.04, "lampHead"], [0.34, 3.78, 0.04, "lampHead"]],
    // one wiper parked leaning left from its pivot on the panel
    wipers: [[[0.05, 2.28], [-0.55, 3.0]]],
};

/** The delivery paint: white, the red front back to 6.7 m, red at the joints, the black window band and white doors. */
function delivery(): ShinkansenLivery {
  return {
    title: "OBB", number: "4024 076-4",
    palette: { ...PALETTE, logo: c("#f4f4f4", 0.4) },
    bands: [[0, 0.62, "skirtG"], [0.62, 9, "white"]], front: [[0, 9, "red"]],
    doors: [[0, 9, "white"]], roof: "roofG", skirt: "skirtG",
    // the distant model: the black band, the red front and the raised band ahead of the door
    lodSides: [[0, 0.62, "skirtG"], [0.62, LOW_BAND[0], "white"], [LOW_BAND[0], LOW_BAND[1], "band"], [LOW_BAND[1], 9, "white"]],
    lodSideFields: { end: [
      { d: [0, 6.7], bands: [[0, 0.62, "skirtG"], [0.62, HIGH_BAND[0], "red"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "red"]] },
      { d: [6.7, T_DOOR[0]], bands: [[0, 0.62, "skirtG"], [0.62, HIGH_BAND[0], "white"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "white"]] },
    ] },
    endSweeps: [
      // the red front, its back edge upright behind the cab side window
      { mat: "red", face: true, front: [[0.6, -9], [3.4, -9]], back: [[0.6, 6.7], [3.4, 6.7]] },
      // the black band over the high floor from the cab side window to the door, its front raked with the windscreen
      { mat: "band", face: true, front: [[HIGH_BAND[0], 1.55], [HIGH_BAND[1], 2.35]], back: [[HIGH_BAND[0], T_DOOR[0] - 0.05], [HIGH_BAND[1], T_DOOR[0] - 0.05]] },
    ],
    sideFields: { end: jointRed(END_BODY - JOINT_RED, END_BODY - 0.02), middle: [...jointRed(0.02, JOINT_RED), ...jointRed(MID_BODY - JOINT_RED, MID_BODY - 0.02)] },
    endLettering: [
      { text: "4024 076-4", d: t(4.2), y: 1.2, h: 0.08, mat: "logoWhite" },
      { text: "OBB", d: t(9.0), y: 1.5, h: 0.24, mat: "red", letterStroke: 0.035 },
    ],
  };
}

/** The Cityjet repaint: white, a red band under the windows rising under the high windows and onto the front, black doors. */
function cityjetLivery(): ShinkansenLivery {
  return {
    title: "Cityjet", number: "4024 039-1",
    palette: { ...PALETTE, logo: c(OBB_RED, 0.35) },
    bands: [[0, 0.62, "skirtG"], [0.62, LOW_BAND[0], "red"], [LOW_BAND[0], 9, "white"]], front: [[0, 1.26, "red"], [1.26, 9, "white"]],
    // the red line round the mask, white between it and the mask
    faceFields: [{ mat: "red", pts: closed(maskHalf(0.1)) }, { mat: "white", pts: closed(maskHalf(0.05)) }],
    doors: [[0, 9, "doorBlack"]], roof: "roofG", skirt: "skirtG",
    // the distant model: the black band over the red band, the red rising under the high band to the door
    lodSides: [[0, 0.62, "skirtG"], [0.62, LOW_BAND[0], "red"], [LOW_BAND[0], LOW_BAND[1], "band"], [LOW_BAND[1], 9, "white"]],
    lodSideFields: { end: [{ d: [0, T_DOOR[0]], bands: [[0, 0.62, "skirtG"], [0.62, 1.75, "red"], [1.75, HIGH_BAND[0], "white"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "white"]] }] },
    endSweeps: [
      // the red rising from the face's corners to the high band's foot and running back to the door
      { mat: "red", face: true, front: [[0.6, -9], [1.26, -9], [1.6, 0.9], [1.75, 1.5]], back: [[0.6, T_DOOR[0] - 0.05], [1.75, T_DOOR[0] - 0.05]] },
      { mat: "band", face: true, front: [[HIGH_BAND[0], 1.55], [HIGH_BAND[1], 2.35]], back: [[HIGH_BAND[0], T_DOOR[0] - 0.05], [HIGH_BAND[1], T_DOOR[0] - 0.05]] },
    ],
    endLettering: [{ text: "OBB", d: t(13.4), y: 2.74, h: 0.22, mat: "red", letterStroke: 0.032 }],
  };
}

const PALETTE = {
  red: c(OBB_RED, 0.35), white: c("#eef0f0", 0.35), roofG: c("#b5babd", 0.55), skirtG: c("#4e5357", 0.7), capG: c("#3b3f43", 0.5),
  band: c("#15171a", 0.15), screen: c("#3e4a54", 0.06), recess: c("#141517", 0.7), display: c("#f2a63a", 0.3), grille: c("#2a2d30", 0.7),
  logoWhite: c("#f4f4f4", 0.4), doorBlack: c("#25282b", 0.35), acG: c("#9aa0a4", 0.55), plough: c("#1d1f21", 0.6), yellow: c("#f2c300", 0.45),
};

/** The cab cap, the roof equipment, the window bands, the plough and the coupler. */
function talentFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[]; rearEndCar?: boolean }): void {
  const L = car.length;
  const xs = (d0: number, d1: number): [number, number] => [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))];
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => { const [a, e] = xs(d0, d1); block(m, mat, a, e, y0, y1, -hw, hw); };
  m.scope("window bands", () => {
    // the low band behind the end car's door and along an intermediate car, broken by its doors
    const spans: Array<[number, number]> = car.end ? [[t(T_DOOR[1]) + 0.05, L - 0.05]] : [[0.05, MID_DOORS[0]![0] - 0.05], [MID_DOORS[0]![1] + 0.05, MID_DOORS[1]![0] - 0.05], [MID_DOORS[1]![1] + 0.05, L - 0.05]];
    for (const sd of [1, -1]) for (const [d0, d1] of spans) sidePanel(m, b, X, sd, "band", d0, d1, LOW_BAND[0], LOW_BAND[1], 0.003, 0.003);
  });
  const R = C - 0.06;
  if (car.end) {
    m.scope("cab cap", () => {
      // the dark grey cap: paint over the roof's hump (the face carries it from the display's head), its
      // rear edge rounding in where the hump falls back to the crown; the cab air conditioning's grilles on its flanks
      const hw = (d: number) => (d <= 1.8 ? 1.08 : Math.max(0.05, 1.08 * Math.cos(((d - 1.8) / 1.15) * (Math.PI / 2))));
      for (const sd of [1, -1]) {
        shapedCrownPane(m, b, X, sd, "capG", [0, 2.9], () => 0, hw, 0.004, [1.8, 2.1, 2.4, 2.65]);
        for (let k = 0; k < 4; k++) crownPane(m, b, X, sd, "grille", [0.3 + k * 0.38, 0.6 + k * 0.38], [0.78, 0.98], 0.008);
      }
    });
    if (!car.rearEndCar) m.scope("high-voltage module", () => {
      // the Triebwagen's module behind the pantograph: breaker, transformers, arresters on a low frame
      at("capG", t(8.9), t(11.2), R - 0.03, C + 0.32, 0.8);
      at("acG", t(9.1), t(11.0), C + 0.32, C + 0.36, 0.7);
    });
    else m.scope("air conditioning", () => {
      at("acG", t(6.2), t(10.4), R, C + 0.36, 0.82);
      for (const sd of [1, -1]) block(m, "grille", ...xs(t(6.6), t(10.0)), C + 0.05, C + 0.28, sd > 0 ? 0.82 : -0.83, sd > 0 ? 0.83 : -0.82);
    });
    m.scope("plough", () => {
      // the black plough under the face, standing out ahead of the coupler
      const [p0, p1] = xs(t(0.0), t(0.8));
      block(m, "plough", p0, p1, 0.22, 0.6, -1.12, 1.12);
      // its front leaning back from the foot (0.25 m ahead of the face) to the top, the corners rounded off
      const full: Ring = [[-1.12, 0.22], [1.12, 0.22], [1.12, 0.6], [-1.12, 0.6]];
      const nose: Ring = [[-0.95, 0.22], [0.95, 0.22], [0.95, 0.4], [-0.95, 0.4]];
      const [xf, xt] = [X(t(-0.25)), X(t(0.0))];
      if (xf > xt) m.sweep("plough", "x", full, xt, nose, xf);
      else m.sweep("plough", "x", nose, xf, full, xt);
    });
    m.scope("coupler", () => {
      // the Scharfenberg coupler in its recess, its head on the coupling plane
      at("recess", -B0 - REACH + 0.12, -B0 + 0.1, 0.94, 1.06, 0.07);
      at("grille", -B0 - REACH, -B0 - REACH + 0.14, 0.84, 1.16, 0.2);
    });
  } else m.scope("air conditioning", () => {
    at("acG", 4.6, 8.4, R, C + 0.36, 0.82);
    for (const sd of [1, -1]) block(m, "grille", ...xs(5.0, 8.0), C + 0.05, C + 0.28, sd > 0 ? 0.82 : -0.83, sd > 0 ? 0.83 : -0.82);
  });
  m.scope("underfloor", () => {
    // the power pack and the auxiliary converters under the high floor, the tanks under the low floor
    if (car.end) { at("under", t(6.3), t(10.9), 0.48, 0.66, 1.05); at("under", t(13.4), t(15.6), 0.45, 0.62, 0.9); }
    else at("under", 5.6, 8.6, 0.45, 0.62, 0.9);
  });
}

export const OBB_4024: ShinkansenSeries = {
  // 66.87 m over the couplers, 2.925 m wide (de.wikipedia "OBB 4023/4024/4124"); the end cars 18.685 m from
  // the coupler to the joint, the intermediate cars 14.75 m joint to joint (the three-car 4023's 52.12 m)
  endLength: 18.685, midLength: 14.75, W: 1.4625, Y: 0.62, S: 3.36, C, lean: 0.97, B: 0.42, A: 0.55,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  endCrown: CAB_HUMP, endCrownStep: 0.45,
  windows: [LOW, HIGH], windowW: 1.3, pitch: 1.45, door: [0.59, 2.62, 1.42, 2.5], doorW: 1.5, doorGlassW: 0.22, doorGlassPair: 0.62,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  rearEnd: { layout: END_LAYOUT },
  // Bo'2'2'2'Bo': the motor bogie 4.05 m behind the tip, Jacobs bogies under the joints; 760 mm wheels
  jacobs: true, bogieCentres: 18.685 - REACH - 4.05, wheelR: 0.38, wheelbase: 2.2,
  // the single-arm pantograph on the leading end car's module behind the cab (Graz and MAV photographs)
  endPantograph: "lead", pantographD: 7.6,
  lodRoof: { d: [1.6, 4.7], hw: 0.95, y: [C - 0.1, CAB_C - 0.02], mat: "capG" },
  fittings: talentFittings,
  cars: [3, 4],
  liveries: { obb: delivery(), cityjet: cityjetLivery() },
  weight: { end: 31, middle: 27 }, power: 380, maxspeed: 140,
};

const PARAMS = seriesParams(OBB_4024);
export function obb4024(v?: ParamValues): MeshBuilder { return buildSeries(OBB_4024, PARAMS, v); }
export function obb4024Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(OBB_4024, PARAMS, v); }
export const OBB_4024_DESIGN: ProceduralDesign = seriesDesign("proc-vehicle-obb-4024", "OBB 4024 Talent", OBB_4024, PARAMS, obb4024, obb4024Lod, "obb-4024", "uic");
