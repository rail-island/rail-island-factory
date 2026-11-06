// Swiss units on the series kit (shinkansen.ts): the RAe TEE II, the "Roter
// Pfeil" railcar, the tilting ICN, the Giruno, the FV-Dosto, SBB's FLIRT and
// KISS (the Stadler bases, seriesHelpers.ts) and the Rhaetian Railway's
// metre-gauge Allegra. See docs/models/switzerland-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flirt, kiss, nose, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { arrowFittings } from "./roterPfeil.ts";

const SBB_RED = "#eb0000";

/** SBB's and the Rhaetian Railway's schemes: white with the red and grey bands, the TEE, the RhB red. */
export function chLivery(kind: "sbb" | "sbbRegio" | "tee" | "gottardo" | "rhb" | "redArrow", number: string): ShinkansenLivery {
  const pal = (p: Record<string, string>) => ({ roofG: c("#9aa0a5", 0.6), skirtG: c("#3a3d40", 0.75), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, c(v)])) });
  switch (kind) {
    case "sbb": return { title: "SBB", number, palette: pal({ white: "#f1f1ee", grey: "#4d5257", red: SBB_RED }), bands: [[0, 1.3, "grey"], [1.3, 1.42, "red"], [1.42, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "sbbRegio": return { title: "SBB Regio", number, palette: pal({ white: "#f1f1ee", red: SBB_RED, grey: "#4d5257" }), bands: [[0, 1.25, "grey"], [1.25, 1.45, "red"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "tee": return { title: "TEE", number, palette: pal({ red: "#8a1c2b", beige: "#e3d3a6" }), bands: [[0, 1.85, "red"], [1.85, 2.9, "beige"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" };
    case "gottardo": return { title: "Gottardo grey", number, palette: pal({ grey: "#9aa0a5", red: SBB_RED, dark: "#4d5257" }), bands: [[0, 1.85, "dark"], [1.85, 1.95, "red"], [1.95, 9, "grey"]], roof: "roofG", skirt: "skirtG" };
    case "rhb": return { title: "RhB red", number, palette: pal({ red: "#c8102e", white: "#f1f1ee", grey: "#4d5257" }), bands: [[0, 1.3, "grey"], [1.3, 9, "red"]], roof: "roofG", skirt: "skirtG" };
    case "redArrow": return { title: "Red Arrow", number, palette: { ...pal({ red: "#c8102e", cream: "#e6dcc0" }), roofS: c("#a9adb0", 0.45) }, bands: [[0, 9, "red"]], roof: "roofS", skirt: "skirtG" };
  }
}

export const RAE_TEE: ShinkansenSeries = {
  endLength: 23.0, midLength: 21.0, W: 1.45, Y: 1.4, S: 3.1, C: 3.9, lean: 0.95, B: 0.85, A: 1.05,
  // the rounded TEE front, its windscreen high under a bulging roof
  nose: nose(2.8, 0.25, 2.2, [[0, 1.8], [0.4, 2.35], [1.6, 3.05], [2.8, 3.6], [3.4, 3.9]], [[0, 1.75], [0.4, 2.2], [1.6, 2.8], [2.8, 3.05], [3.4, 3.1]], [[0, 1.5], [1.0, 1.45]], [[0, 1.25], [0.8, 1.05]], [[0, 1.15], [0.4, 0.85]]),
  windscreen: [1.6, 2.8, 0.07, 1.05], lamps: [0.4, 1.6],
  windows: [[1.95, 2.75]], windowW: 1.2, pitch: 1.45, door: [1.25, 3.0, 1.95, 2.6], doorW: 0.8,
  bogieCentres: 15.5, wheelR: 0.5, wheelbase: 2.8, cars: [4, 6],
  liveries: { tee: chLivery("tee", "1053"), gottardo: chLivery("gottardo", "1051") },
  weight: { end: 52, middle: 45 }, power: 580, maxspeed: 160,
};

/**
 * The Roter Pfeil's cab (the SBB works drawing L 56926, photo-sbb-historic-pl-166-00003-cle-2-4-203-206-sbb.jpg,
 * and the photographs): it stands behind the low bonnet (roterPfeil.ts), its front a vee in plan - two
 * panes either side of the centre post 2.0 m behind the tip, raked back 0.3 m, and a wide pane on each arm
 * reaching back to 3.05 m - under the roof's brow, which juts out over the panes with the top lamp on it.
 */
const ARROW_DJOIN = 3.25;
const ARROW_END: SeriesCabFace = {
  dJoin: ARROW_DJOIN, dSide: ARROW_DJOIN, first: 5.5, roofFrom: 2.85, cols: [8, 3, 1, 1], tolerance: 0.015, reach: 0.45,
  // the vee: 1.05 m deep under the windscreens, the arms' outer edge upright at 3.05 m; flattening over the roof
  bulge: [[1.55, 1.04], [2.1, 1.02], [2.68, 0.74], [2.76, 0.7], [2.86, 0.72], [2.94, 0.63], [3.026, 0.52], [3.106, 0.4], [3.175, 0.28], [3.232, 0.18], [3.275, 0.1], [3.31, 0]],
  // the rows above the windscreens are the body's own roof arc's, so the face meets it without a crack
  profile: [[1.55, 2.0], [2.12, 2.0], [2.68, 2.3], [2.76, 2.33], [2.83, 2.25], [2.85, 2.23], [2.94, 2.2], [3.026, 2.28], [3.106, 2.47], [3.175, 2.68], [3.232, 2.88], [3.275, 3.03], [3.301, 3.12], [3.31, 3.25]],
  corner: [[1.55, 0.2], [2.8, 0.2], [2.94, 0.3], [3.106, 0.3], [3.175, 0.2], [3.232, 0.12], [3.275, 0.07], [3.31, 0.01]],
  rows: [1.55, 1.64, 2.12, 2.4, 2.62, 2.68, 2.76, 2.83, 2.85, 2.94, 3.026, 3.106, 3.175, 3.232, 3.275, 3.301, 3.31],
  // the centre panes and their surrounds; the wide panes' sills follow the bonnet's dome down to the arms
  masks: [{ lat: [-0.61, -0.02], y: [2.15, 2.71], r: 0.04, mat: "rubber" }, { lat: [0.02, 0.61], y: [2.15, 2.71], r: 0.04, mat: "rubber" }],
  panes: [{ lat: [-0.58, -0.05], y: [2.18, 2.68], r: 0.03 }, { lat: [0.05, 0.58], y: [2.18, 2.68], r: 0.03 }],
  fields: [
    { mat: "rubber", pts: [[0.64, 2.11], [1.24, 1.97], [1.24, 2.71], [0.64, 2.71]] }, { mat: "rubber", pts: [[-1.24, 1.97], [-0.64, 2.11], [-0.64, 2.71], [-1.24, 2.71]] },
    { mat: "cabGlass", pts: [[0.67, 2.14], [1.21, 2.0], [1.21, 2.68], [0.67, 2.68]] }, { mat: "cabGlass", pts: [[-1.21, 2.0], [-0.67, 2.14], [-0.67, 2.68], [-1.21, 2.68]] },
  ],
  roofLamp: [0, 3.0, 0.1],
  // the distant model: the bonnet low ahead of the cab
  lod: {
    profile: [[0.62, 0.05], [1.6, 0.15], [2.12, 1.9], [3.31, 3.0]],
    corner: [[0.62, 0.1], [3.31, 0.1]], rows: [0.62, 1.6, 2.12, 3.31], bulge: 0, glass: false,
  },
};

/** The railcar's paint: SBB red, the grey roof, aluminium doors and "S B B - C F F" spaced out in metal letters, as on the drawing. */
const ARROW_LIVERY: ShinkansenLivery = {
  title: "Red Arrow", number: "RCe 604",
  palette: { roofG: c("#9aa0a5", 0.6), skirtG: c("#2e3134", 0.8), cabMask: c("#1d1f22", 0.3), red: c("#c41e1a"), roofS: c("#a9adb0", 0.45), alu: c("#c3c7ca", 0.3) },
  bands: [[0, 9, "red"]], roof: "roofS", skirt: "skirtG", doors: [[0, 9, "alu"]],
  // the third class numerals behind the doors
  endLettering: [{ text: "S B B - C F F", d: 7.5, y: 1.08, h: 0.2, mat: "alu" }, { text: "3", d: 2.95, y: 1.0, h: 0.2, mat: "alu" }, { text: "3", d: 12.05, y: 1.0, h: 0.2, mat: "alu" }],
};

/** The bonnet's, the roof's and the underfloor's fittings (roterPfeil.ts). */
const ARROW_FIT = {
  C: 3.31, dJoin: ARROW_DJOIN, roof: "roofS", B: 0.62, W: 1.45, paint: { body: "red", skirt: "skirtG" },
  // the three resistor grids of the electric brake, from the cab without the pantograph
  resistors: [[3.7, 5.7], [6.73, 8.73], [9.77, 11.71]] as ReadonlyArray<readonly [number, number]>,
};

/** The body between the cab faces (15.0 m): the doors behind the cabs, seven windows 1.5 m apart between them. */
const ARROW_LAYOUT = {
  doors: [[1.25, 2.03, -1], [12.97, 13.75, 1]] as ReadonlyArray<readonly [number, number, number]>,
  windows: Array.from({ length: 7 }, (_, i): readonly [number, number] => [2.41 + 1.5 * i, 3.6 + 1.5 * i]),
};

export const RED_ARROW: ShinkansenSeries = {
  // the RCe 2/4 after its buffers came in 1944: 21.5 m over the bonnets, 22.4 m over the buffers
  endLength: 22.4, midLength: 22.4, W: 1.45, Y: 1.0, S: 2.85, C: 3.31, lean: 0.97, B: 0.62, A: 0.7,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ARROW_END,
  // one cab side window behind the face's join, as on the drawing (the two rebuilt RAe 2/4 had a second)
  cabWindows: [[0.03, 0.83, 2.0, 2.66]],
  windows: [[1.64, 2.62]], windowW: 1.19, pitch: 1.5, door: [0.72, 2.66, 1.64, 2.6], doorW: 0.78,
  layout: { end: ARROW_LAYOUT, middle: ARROW_LAYOUT }, numberAt: [-7.0, 0.9, 0.1],
  // the diamond pantograph over the trailing bogie (cab I)
  bogieCentres: 16.3, wheelR: 0.45, wheelbase: 2.5, single: true, endPantograph: true, pantograph: "diamond",
  liveries: { redArrow: ARROW_LIVERY },
  fittings: (m, b, X, car) => arrowFittings(m, b, X, car, ARROW_FIT),
  weight: { end: 40, middle: 40 }, power: 380, maxspeed: 125,
};

export const ICN: ShinkansenSeries = {
  endLength: 27.0, midLength: 26.9, W: 1.42, Y: 1.35, S: 3.0, C: 4.0, lean: 0.92, B: 0.8, A: 1.0,
  // the tilting train's raked front and narrow, tucked-in body
  nose: nose(3.2, 0.2, 2.3, [[0, 1.6], [0.4, 2.2], [1.6, 3.0], [2.8, 3.7], [3.6, 4.0]], [[0, 1.55], [0.4, 2.05], [1.6, 2.65], [2.8, 2.95], [3.6, 3.0]], [[0, 1.35], [1.0, 1.35]], [[0, 1.15], [0.8, 1.0]], [[0, 1.05], [0.4, 0.8]]),
  windscreen: [1.4, 3.0, 0.07, 1.1], lamps: [0.4, 1.5],
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.65, door: [1.2, 3.05, 1.9, 2.6], doorW: 0.9,
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, cars: [7],
  liveries: { sbb: chLivery("sbb", "500 001") },
  weight: { end: 50, middle: 50 }, power: 740, maxspeed: 200,
};

export const GIRUNO: ShinkansenSeries = {
  endLength: 27.4, midLength: 24.0, W: 1.45, Y: 1.3, S: 3.15, C: 4.1, lean: 0.95, B: 0.65, A: 0.85,
  // the long, sharp nose of Stadler's SMILE
  nose: nose(5.0, 0.1, 2.4, [[0, 1.3], [0.6, 1.8], [2.2, 2.6], [3.8, 3.4], [5.2, 4.1]], [[0, 1.25], [0.6, 1.7], [2.2, 2.4], [3.8, 2.95], [5.2, 3.15]], [[0, 1.2], [1.5, 1.3]], [[0, 1.0], [1.0, 0.85]], [[0, 0.95], [0.5, 0.65]]),
  windscreen: [3.0, 4.8, 0.07, 1.1], lamps: [1.0, 1.4],
  windows: [[1.55, 2.7]], windowW: 1.5, pitch: 1.75, door: [0.95, 3.0, 1.55, 2.6], doorW: 1.0,
  bogieCentres: 14.0, wheelR: 0.46, wheelbase: 2.7, cars: [4, 8],
  liveries: { sbb: chLivery("sbb", "501 001") },
  weight: { end: 48, middle: 36 }, power: 750, maxspeed: 250,
};

/**
 * The FV-Dosto's livery, read from photo-sbb-rabe-502-203-ossingen.jpg, photo-sbb-rabe-502-405.jpg and a
 * side view: white over a dark lower band, red doors; the red cab carried back along the roof's edge
 * and a black sweep under it, from the shoulder 7.6 m behind the tip down and forward to the chin,
 * the cab's side window in it.
 */
const DOSTO_RED_EDGE: Pt[] = [[1.0, 0.6], [1.9, 1.6], [2.7, 2.45], [3.3, 3.25], [3.55, 3.8], [3.7, 4.7], [3.8, 7.0], [3.85, 7.6]];
const DOSTO_SBB: ShinkansenLivery = {
  title: "SBB", number: "502 203",
  palette: { white: c("#f1f1ee"), dark: c("#2c3034", 0.55), red: c(SBB_RED), black: c("#17191b", 0.45), roofG: c("#5c6166", 0.6), skirtG: c("#232528", 0.75), cabMask: c("#17191b", 0.3) },
  // the upper deck's windows in a grey band under the roof
  bands: [[0, 1.2, "dark"], [1.2, 3.15, "white"], [3.15, 9, "roofG"]], doors: [[0, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
  // d behind the tip; the red covers the body up to the black's front edge
  endSweeps: [
    { mat: "red", front: [[1.0, -9], [3.85, -9]], back: DOSTO_RED_EDGE },
    { mat: "black", front: DOSTO_RED_EDGE, back: [[1.0, 3.6], [1.2, 3.6], [2.0, 4.05], [2.7, 4.8], [3.55, 6.0], [3.85, 7.6]] },
    // the cab's side window in the black, its front edge raked with the windscreen
    { mat: "cabGlass", front: [[2.45, 2.65], [3.3, 3.2]], back: [[2.45, 4.05], [3.3, 4.05]] },
  ],
};

/**
 * The FV-Dosto's front (photo-sbb-rabde-502-009.jpg, -203-ossingen, -405 and a side view): the chin
 * forward at the coupler and the face raked back about 45 degrees over 3.3 m to the roof, with wide
 * rounded corners. A tall black mask holds the windscreen, the two lamp clusters and the SBB
 * emblem, narrowing to a rounded panel at the bottom; a white rim follows it, the red round it.
 */
const DOSTO_FACE: SeriesCabFace = {
  dJoin: 3.3, dSide: 2.6, first: 10.3, roofFrom: 4.45, wrap: true, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: [[0.72, 0.35], [0.9, 0.08], [1.15, 0], [1.4, 0.03], [1.75, 0.15], [2.2, 0.45], [2.7, 0.85], [3.3, 1.4], [3.8, 1.95], [4.1, 2.35], [4.35, 2.75], [4.5, 3.05], [4.6, 3.3]],
  corner: [[0.72, 0.8], [2.2, 0.8], [3.3, 0.75], [4.0, 0.6], [4.35, 0.4], [4.6, 0.1]],
  rows: [0.72, 0.9, 0.95, 1.15, 1.24, 1.47, 1.75, 2.0, 2.25, 2.45, 2.64, 2.7, 3.3, 3.55, 3.7, 3.8, 3.85, 3.95, 4.1, 4.35, 4.45, 4.52, 4.6],
  bands: () => [[0, 0.95, "skirtG"], [0.95, 9, "red"]],
  // the black mask narrows from the windscreen to the emblem's panel; the white rim follows it
  fields: [
    { mat: "white", pts: [[-1.1, 4.1], [1.1, 4.1], [1.03, 2.6], [0.99, 2.2], [0.91, 1.6], [0.8, 1.33], [0.56, 1.24], [-0.56, 1.24], [-0.8, 1.33], [-0.91, 1.6], [-0.99, 2.2], [-1.03, 2.6]] },
    { mat: "cabMask", pts: [[-1.0, 4.7], [1.0, 4.7], [0.94, 2.6], [0.9, 2.2], [0.82, 1.7], [0.72, 1.53], [0.55, 1.47], [-0.55, 1.47], [-0.72, 1.53], [-0.82, 1.7], [-0.9, 2.2], [-0.94, 2.6]] },
  ],
  panes: [{ lat: [-0.86, 0.86], y: [2.64, 3.95], r: 0.12 }],
  // the SBB emblem: a cross, its bar ending in arrowheads
  decals: [
    { mat: "white", pts: [[-0.13, 1.83], [0.13, 1.83], [0.13, 1.87], [-0.13, 1.87]] },
    { mat: "white", pts: [[-0.025, 1.76], [0.025, 1.76], [0.025, 1.94], [-0.025, 1.94]] },
    { mat: "white", pts: [[-0.22, 1.85], [-0.12, 1.76], [-0.12, 1.94]] },
    { mat: "white", pts: [[0.22, 1.85], [0.12, 1.94], [0.12, 1.76]] },
  ],
  lamps: [[-0.7, 2.38, 0.1, "lampHead"], [0.7, 2.38, 0.1, "lampHead"], [-0.52, 2.35, 0.06, "lampHead"], [0.52, 2.35, 0.06, "lampHead"]], roofLamp: [0, 4.32, 0.07],
  wipers: [[[0.15, 2.7], [0.55, 3.45]]],
};

export const FV_DOSTO: ShinkansenSeries = {
  endLength: 26.8, midLength: 25.0, W: 1.4, Y: 1.2, S: 3.85, C: 4.6, lean: 0.97, B: 0.72, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DOSTO_FACE,
  // the doors under the upper deck's windows, a narrow window in the leaf
  windows: [[1.25, 1.95], [3.25, 3.8]], windowW: 1.4, pitch: 1.7, door: [1.0, 2.85, 1.4, 2.45], doorW: 1.3, doorGlassW: 0.32, upperOverDoors: true,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, cars: [4, 8],
  liveries: { sbb: DOSTO_SBB },
  weight: { end: 64, middle: 55 }, power: 500, maxspeed: 200,
};

export const SBB_FLIRT: ShinkansenSeries = flirt({ W: 1.44, liveries: { sbbRegio: chLivery("sbbRegio", "523 001") }, weight: { end: 42, middle: 32 }, power: 650, maxspeed: 160 });
/**
 * The KISS's S-Bahn paint (photo-rabe-511-044-...-weinfelden.jpg, photo-sbb-rabe-511-tossmuhle.jpg,
 * photo-sbb-511-022-st-margrethen.jpg): white over a navy lower band 1.48 m high, a navy stripe
 * between the decks from behind the cab's locker back, red doors whose red runs on up to the upper
 * windows, a dark roof. On the cab side the face's red rises to the roof ahead of the cab window,
 * the window a raked pane and a narrow one behind its pillar; a dark equipment fairing over the cab
 * section, the locker panel and the SBB emblem behind it.
 */
const KISS_SBB: ShinkansenLivery = {
  title: "SBB Regio", number: "511 044",
  palette: { white: c("#f1f1ee"), blue: c("#1f2f6b"), red: c(SBB_RED), roofG: c("#3d4247", 0.6), skirtG: c("#2a2d31", 0.75), cabMask: c("#1b1d20", 0.3), lockerG: c("#c9cac6", 0.6) },
  bands: [[0, 1.48, "blue"], [1.48, 2.62, "white"], [2.62, 2.82, "blue"], [2.82, 9, "white"]], doors: [[0, 9, "red"]],
  // the red over each door up to the upper window, a navy class panel in it
  overDoors: [[2.82, 3.02, "red"], [3.02, 3.22, "blue"], [3.22, 3.32, "red"]],
  roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "SBB CFF FFS", d: 2.85, y: 3.33, h: 0.18, mat: "lettering" }],
  // d behind the tip
  endSweeps: [
    // no stripe ahead of the locker's back edge
    { mat: "white", front: [[2.58, -9], [2.86, -9]], back: [[2.58, 5.4], [2.86, 5.4]] },
    // the face's red over the cab window, up to the roof's edge
    { mat: "red", front: [[3.3, -9], [4.15, -9]], back: [[3.3, 1.45], [3.7, 2.1], [4.0, 3.0], [4.15, 3.6]] },
    // the cab window: a raked pane, its front corner rounded, and a narrow one behind the black pillar
    { mat: "cabGlass", front: [[2.22, 1.16], [3.2, 1.8], [3.4, 2.0], [3.5, 2.25]], back: [[2.22, 4.04], [3.5, 4.04]] },
    { mat: "cabMask", front: [[2.22, 3.45], [3.5, 3.45]], back: [[2.22, 3.58], [3.5, 3.58]] },
    // the equipment fairing over the cab section
    { mat: "roofG", front: [[3.78, 2.34], [4.0, 3.0], [4.15, 3.6]], back: [[3.78, 8.7], [4.15, 8.7]] },
    // the locker: its seam and grille panel; the SBB emblem's red square
    { mat: "roofG", front: [[1.57, 4.5], [3.03, 4.5]], back: [[1.57, 5.3], [3.03, 5.3]] },
    { mat: "lockerG", front: [[1.6, 4.525], [3.0, 4.525]], back: [[1.6, 5.275], [3.0, 5.275]] },
    { mat: "red", front: [[3.25, 4.5], [3.6, 4.5]], back: [[3.25, 4.95], [3.6, 4.95]] },
  ],
};

/** [lat, y] points mirrored to the face's other side. */
const kissMirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]);
const KISS_WEDGE: Pt[] = [[0.6, 1.6], [1.6, 1.6], [1.6, 3.62], [1.36, 3.62], [1.06, 2.67], [0.8, 1.99], [0.62, 1.9]];
const KISS_POD: Pt[] = [[0.48, 1.62], [0.55, 1.61], [1.0, 1.68], [1.13, 1.74], [1.17, 1.82], [1.12, 1.9], [0.55, 1.89], [0.48, 1.87]];

/**
 * The KISS's front (photo-ffs-rabe-511120-ziegelbruecke-...jpg head on, the photographs above): upright
 * from the apron to the lamps, the windscreen raked about 37 degrees and the dark dome over it rounding
 * 3.2 m back to the roof. The windscreen is narrower at its foot than at its head; the red runs down
 * from the roof's corners beside it to the chin between two black lamp pods, white wedges coming in
 * from the corners over the pods. White and the number under them, the navy apron with two grilles.
 */
const KISS_FACE: SeriesCabFace = {
  dJoin: 3.2, dSide: 2.6, first: 5.0, roofFrom: 4.4, bulge: 0.1, cols: [6, 4, 1, 1], tolerance: 0.05,
  profile: [[0.6, 0.18], [0.75, 0.05], [1.0, 0], [1.6, 0], [1.9, 0.05], [2.2, 0.2], [2.75, 0.6], [3.47, 1.15], [3.9, 1.5], [4.2, 1.8], [4.45, 2.3], [4.6, 3.2]],
  corner: [[0.6, 0.55], [1.5, 0.6], [2.2, 0.75], [3.35, 0.7], [4.0, 0.55], [4.4, 0.35], [4.6, 0.1]],
  rows: [0.6, 0.75, 1.0, 1.48, 1.6, 2.21, 2.75, 3.47, 3.9, 4.2, 4.45, 4.6],
  bands: () => [[0, 0.75, "skirtG"], [0.75, 1.48, "blue"], [1.48, 1.6, "white"], [1.6, 9, "red"]],
  fields: [
    { mat: "white", pts: KISS_WEDGE }, { mat: "white", pts: kissMirror(KISS_WEDGE) },
    // the dark dome over the windscreen, up to the roof, and the windscreen itself
    { mat: "cabMask", pts: [[-0.73, 2.18], [0.73, 2.18], [0.98, 3.47], [1.04, 3.47], [1.04, 4.9], [-1.04, 4.9], [-1.04, 3.47], [-0.98, 3.47]] },
    { mat: "cabGlass", pts: [[-0.71, 2.21], [0.71, 2.21], [0.95, 3.44], [-0.95, 3.44]] },
    { mat: "cabMask", pts: KISS_POD }, { mat: "cabMask", pts: kissMirror(KISS_POD) },
  ],
  // the windscreen's middle (the distant model's glass) and the destination display
  panes: [{ lat: [-0.7, 0.7], y: [2.21, 3.44], r: 0.02 }, { lat: [-0.68, 0.68], y: [3.54, 3.82], r: 0.02 }],
  decals: [
    // the apron's grilles either side of the coupler
    { mat: "rubber", pts: [[-1.1, 0.86], [-0.64, 0.86], [-0.64, 1.36], [-1.1, 1.36]] }, { mat: "rubber", pts: [[0.64, 0.86], [1.1, 0.86], [1.1, 1.36], [0.64, 1.36]] },
    { mat: "white", pts: [[-0.08, 1.705], [0.08, 1.705], [0.08, 1.735], [-0.08, 1.735]] },
    { mat: "white", pts: [[-0.016, 1.655], [0.016, 1.655], [0.016, 1.785], [-0.016, 1.785]] },
    { mat: "white", pts: [[-0.145, 1.72], [-0.075, 1.655], [-0.075, 1.785]] },
    { mat: "white", pts: [[0.145, 1.72], [0.075, 1.785], [0.075, 1.655]] },
  ],
  lamps: [[-0.73, 1.76, 0.085, "lampHead"], [0.73, 1.76, 0.085, "lampHead"], [-0.93, 1.78, 0.06, "lampHead"], [0.93, 1.78, 0.06, "lampHead"]], roofLamp: [0, 3.98, 0.08],
  number: { lat: -0.17, y: 1.515, h: 0.07, mat: "cabMask" },
  wipers: [[[0.05, 2.25], [0.6, 3.15]]],
};

/** n windows w wide, evenly over d0..d1. */
const kissRow = (d0: number, d1: number, n: number, w: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i): [number, number] => { const d = d0 + ((d1 - d0) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });

/**
 * The KISS's sides (d behind the body's ends; photographs above and photo-sbb-ir-dosto-rabe-512-...jpg
 * in profile, corrected for its perspective): each car's double deck lies between its two doors, the
 * lower windows between them, the upper ones from over the first door to over the second; the
 * mid-floor sections over the bogies have a narrow window each. The end car's first door stands
 * 9 m behind the tip, behind the cab section's locker.
 */
const KISS_END: SeriesLayout = {
  doors: [[5.85, 7.45, 1], [15.75, 17.35, -1]],
  windows: kissRow(8.0, 15.2, 5, 1.05),
  rows: [kissRow(8.0, 15.2, 5, 1.05), kissRow(5.8, 17.2, 7, 1.35), [[3.8, 4.4], [19.1, 19.8]]],
};
const KISS_MIDDLE: SeriesLayout = {
  doors: [[5.93, 7.53, 1], [16.97, 18.57, -1]],
  windows: kissRow(8.03, 16.47, 6, 1.05),
  rows: [kissRow(8.03, 16.47, 6, 1.05), kissRow(5.93, 18.57, 8, 1.32), [[3.48, 4.18], [20.32, 21.02]]],
};

export const SBB_KISS: ShinkansenSeries = {
  ...kiss({ liveries: { sbbRegio: KISS_SBB }, weight: { end: 62, middle: 50 }, power: 1000, maxspeed: 160 }),
  // the side upright to the upper windows' heads, the roof's tight edge above them
  S: 4.1, A: 0.68,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: KISS_FACE,
  // lower deck, upper deck, the mid-floor windows over the bogies
  windows: [[1.32, 2.05], [3.3, 4.05], [2.2, 3.05]], door: [0.68, 2.62, 1.3, 2.5], doorW: 1.6, doorGlassW: 0.28, doorGlassPair: 0.62,
  layout: { end: KISS_END, middle: KISS_MIDDLE },
  // the driving bogie under the cab section, the others under the mid-floor ends; one single-arm pantograph on each end car's rear
  endBogies: [2.5, 20.5], centredBogies: true, bogieCentres: 18.7, endPantograph: true,
};

export const ALLEGRA: ShinkansenSeries = {
  endLength: 17.8, midLength: 14.2, W: 1.32, Y: 1.2, S: 3.0, C: 3.6, lean: 0.95, B: 0.64, A: 0.8,
  // the metre-gauge unit's rounded front
  nose: nose(1.8, 0.35, 2.3, [[0, 2.1], [0.4, 2.8], [1.3, 3.35], [2.0, 3.6]], [[0, 2.0], [0.4, 2.6], [1.3, 2.9], [2.0, 3.0]], [[0, 1.2], [0.8, 1.2]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
  windscreen: [0.4, 1.6, 0.07, 1.1], lamps: [0.15, 1.3],
  windows: [[1.4, 2.5]], windowW: 1.3, pitch: 1.55, door: [0.9, 2.85, 1.45, 2.45], doorW: 1.2,
  bogieCentres: 10.5, wheelR: 0.4, wheelbase: 2.2, cars: [3], endPantograph: true,
  liveries: { rhb: chLivery("rhb", "3501") },
  weight: { end: 37, middle: 33 }, power: 1050, maxspeed: 120,
};

const P = { tee: seriesParams(RAE_TEE), arrow: seriesParams(RED_ARROW), icn: seriesParams(ICN), giruno: seriesParams(GIRUNO), dosto: seriesParams(FV_DOSTO), flirt: seriesParams(SBB_FLIRT), kiss: seriesParams(SBB_KISS), allegra: seriesParams(ALLEGRA) };

export function sbbRaeTee(v?: ParamValues): MeshBuilder { return buildSeries(RAE_TEE, P.tee, v); }
export function sbbRaeTeeLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(RAE_TEE, P.tee, v); }
export function sbbRoterPfeil(v?: ParamValues): MeshBuilder { return buildSeries(RED_ARROW, P.arrow, v); }
export function sbbRoterPfeilLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(RED_ARROW, P.arrow, v); }
export function sbbIcn(v?: ParamValues): MeshBuilder { return buildSeries(ICN, P.icn, v); }
export function sbbIcnLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICN, P.icn, v); }
export function sbbGiruno(v?: ParamValues): MeshBuilder { return buildSeries(GIRUNO, P.giruno, v); }
export function sbbGirunoLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GIRUNO, P.giruno, v); }
export function sbbFvDosto(v?: ParamValues): MeshBuilder { return buildSeries(FV_DOSTO, P.dosto, v); }
export function sbbFvDostoLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(FV_DOSTO, P.dosto, v); }
export function sbbFlirt(v?: ParamValues): MeshBuilder { return buildSeries(SBB_FLIRT, P.flirt, v); }
export function sbbFlirtLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SBB_FLIRT, P.flirt, v); }
export function sbbKiss(v?: ParamValues): MeshBuilder { return buildSeries(SBB_KISS, P.kiss, v); }
export function sbbKissLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SBB_KISS, P.kiss, v); }
export function rhbAllegra(v?: ParamValues): MeshBuilder { return buildSeries(ALLEGRA, P.allegra, v); }
export function rhbAllegraLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ALLEGRA, P.allegra, v); }

export const CH_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-sbb-rae-tee", "SBB RAe TEE II", RAE_TEE, P.tee, sbbRaeTee, sbbRaeTeeLod, "sbb-rae-tee", "uic"),
  seriesDesign("proc-vehicle-sbb-roter-pfeil", "SBB Roter Pfeil", RED_ARROW, P.arrow, sbbRoterPfeil, sbbRoterPfeilLod, "sbb-roter-pfeil", "uic"),
  seriesDesign("proc-vehicle-sbb-icn", "SBB ICN", ICN, P.icn, sbbIcn, sbbIcnLod, "sbb-icn", "uic"),
  seriesDesign("proc-vehicle-sbb-giruno", "SBB Giruno", GIRUNO, P.giruno, sbbGiruno, sbbGirunoLod, "sbb-giruno", "uic"),
  seriesDesign("proc-vehicle-sbb-fv-dosto", "SBB FV-Dosto", FV_DOSTO, P.dosto, sbbFvDosto, sbbFvDostoLod, "sbb-fv-dosto", "uic"),
  seriesDesign("proc-vehicle-sbb-flirt", "SBB FLIRT", SBB_FLIRT, P.flirt, sbbFlirt, sbbFlirtLod, "sbb-flirt", "uic"),
  seriesDesign("proc-vehicle-sbb-kiss", "SBB KISS", SBB_KISS, P.kiss, sbbKiss, sbbKissLod, "sbb-kiss", "uic"),
  seriesDesign("proc-vehicle-rhb-allegra", "RhB Allegra", ALLEGRA, P.allegra, rhbAllegra, rhbAllegraLod, "rhb-allegra", "uic"),
];
