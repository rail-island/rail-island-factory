// Swiss units on the series kit (shinkansen.ts): the RAe TEE II, the "Roter
// Pfeil" railcar, the tilting ICN, the Giruno, the FV-Dosto, SBB's FLIRT and
// KISS (the Stadler bases, seriesHelpers.ts) and the Rhaetian Railway's
// metre-gauge Allegra. See docs/models/switzerland-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flirt, kiss, nose, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";

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
 * The Roter Pfeil's ends (photo-sbb-rae-2-4.jpg, photo-sbb-rae-2-4-rapperswil-hurden.jpg and the works
 * drawing photo-sbb-historic-pl-166-00003-cle-2-4-203-206-sbb.jpg): a low bonnet 2 m long, round in
 * plan, its top at 2.0 m, the lamps on its front; behind it the driver's cab stands up with three
 * front panes under the roof's rounded brow and the top lamp.
 */
const ARROW_END: SeriesCabFace = {
  dJoin: 2.8, dSide: 2.6, first: 5.7, roofFrom: 3.3, cols: [6, 4, 1, 1], tolerance: 0.02, bulge: 0.08,
  profile: [[0.9, 0.15], [1.05, 0.03], [1.2, 0], [1.6, 0], [1.8, 0.08], [1.9, 0.28], [1.96, 0.65], [1.99, 1.3], [2.02, 1.9], [2.1, 2.05], [2.8, 2.18], [3.0, 2.28], [3.25, 2.42], [3.5, 2.6], [3.65, 2.8]],
  corner: [[0.9, 0.95], [1.96, 0.95], [2.1, 0.5], [2.8, 0.45], [3.3, 0.35], [3.65, 0.1]],
  rows: [0.9, 1.05, 1.2, 1.35, 1.55, 1.6, 1.8, 1.9, 1.96, 1.99, 2.02, 2.1, 2.16, 2.78, 2.86, 3.0, 3.25, 3.3, 3.5, 3.65],
  masks: [
    { lat: [-1.19, -0.41], y: [2.12, 2.86], r: 0.05, mat: "rubber" }, { lat: [-0.37, 0.37], y: [2.12, 2.86], r: 0.05, mat: "rubber" },
    { lat: [0.41, 1.19], y: [2.12, 2.86], r: 0.05, mat: "rubber" },
  ],
  panes: [{ lat: [-1.15, -0.45], y: [2.16, 2.82], r: 0.04 }, { lat: [-0.33, 0.33], y: [2.16, 2.82], r: 0.04 }, { lat: [0.45, 1.15], y: [2.16, 2.82], r: 0.04 }],
  lamps: [[-0.82, 1.45, 0.11, "lampHead"], [0.82, 1.45, 0.11, "lampHead"]], roofLamp: [0, 3.08, 0.08],
  wipers: [[[-0.75, 2.2], [-0.55, 2.7]], [[0.1, 2.2], [0.25, 2.7]]],
};

export const RED_ARROW: ShinkansenSeries = {
  endLength: 22.4, midLength: 22.4, W: 1.45, Y: 1.4, S: 2.9, C: 3.65, lean: 0.95, B: 0.9, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ARROW_END, endCoupler: "buffers",
  // the cab's two side windows over the bonnet's end, d behind the join
  cabWindows: [[0.1, 0.9, 1.92, 2.7], [1.0, 1.8, 1.92, 2.7]],
  windows: [[1.9, 2.65]], windowW: 1.2, pitch: 1.5, door: [1.2, 2.95, 1.9, 2.55], doorW: 0.8,
  // the diamond pantograph of the photographs and the works drawing
  bogieCentres: 17.1, wheelR: 0.45, wheelbase: 2.7, single: true, endPantograph: true, pantograph: "diamond",
  liveries: { redArrow: chLivery("redArrow", "RCE 203") },
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
 * The FV-Dosto's livery, read from photo-sbb-rabe-502-203-ossingen.jpg, photo-sbb-rabe-502-405.jpg, the
 * near side view photo-sbb-rabe-502-at-94-85-1-502-201-0-velim.jpg (its door leaf and service door as the
 * scale) and a side view: white over a dark lower band, red doors with a blue head; the red cab carried
 * back over the roof's edge to 7.7 m and a black sweep under it, its front edge curving from the chin up
 * and back to the shoulder at 4.4 m, its back edge one straight line from the white's point 1.4 m behind
 * the tip just over the dark band up to the shoulder at 6.75 m, the cab's side window in it.
 */
const DOSTO_WHITE_EDGE: Pt[] = [[1.2, 1.36], [1.22, 1.38], [1.72, 2.45], [2.1, 3.2], [2.48, 3.95], [2.86, 4.6], [3.24, 5.4], [3.6, 6.1], [3.95, 6.75]];
const DOSTO_RED_EDGE: Pt[] = [[0.9, 1.05], [1.0, 1.15], [1.34, 1.36], [1.72, 1.5], [2.1, 1.76], [2.48, 2.03], [2.86, 2.38], [3.24, 2.78], [3.53, 3.27], [3.78, 3.85], [3.9, 4.4], [3.95, 5.0]];
const DOSTO_SBB: ShinkansenLivery = {
  title: "SBB", number: "502 203",
  palette: {
    white: c("#f1f1ee"), dark: c("#2c3034", 0.55), red: c(SBB_RED), black: c("#17191b", 0.45), roofG: c("#5c6166", 0.6), skirtG: c("#232528", 0.75), cabMask: c("#17191b", 0.3),
    blue: c("#2a4f9e"), cream: c("#ddd5b8", 0.5), lampBox: c("#8d9397", 0.25), amber: c("#f08a1c", 0.4),
  },
  // white up to the upper deck's window tops, the dark grey roof band from the shoulder just above them
  bands: [[0, 1.2, "dark"], [1.2, 3.94, "white"], [3.94, 9, "roofG"]], doors: [[0, 2.62, "red"], [2.62, 9, "blue"]],
  roof: "roofG", skirt: "skirtG",
  // d behind the tip; the red covers the body up to the black's front edge
  endSweeps: [
    { mat: "red", front: [[0.9, -9], [3.95, -9]], back: DOSTO_RED_EDGE },
    // on the cab's sides: the dark lower band forward to the red, the white's point over it
    { mat: "dark", front: DOSTO_RED_EDGE, back: [[0.9, 3.3], [1.2, 3.3]] },
    { mat: "white", front: DOSTO_WHITE_EDGE, back: [[1.2, 3.3], [2.2, 3.3]] },
    { mat: "black", front: DOSTO_RED_EDGE, back: DOSTO_WHITE_EDGE },
    // the cab's side window in the black: a flat sill, its front edge raked parallel to the sweep
    { mat: "cabGlass", front: [[2.55, 2.72], [3.45, 3.82]], back: [[2.55, 3.98], [3.45, 3.98]] },
  ],
  // the red over the roof's edge, its rear end slanted back toward the top
  endRoofEdge: { mat: "red", y: 4.45, d: [3.3, 6.75, 7.7] },
  endLettering: [{ text: "SBB CFF FFS", d: 8.05, y: 2.66, h: 0.13, mat: "lettering" }],
};

/**
 * The FV-Dosto's front (photo-sbb-rabde-502-009.jpg, -203-ossingen, -405 and a side view): the chin
 * forward at the coupler and the face raked back about 45 degrees over 3.3 m to the roof, with wide
 * rounded corners. A tall black mask nearly the face's width holds the windscreen, the two lamp
 * clusters under its lower corners and the SBB emblem on a narrower panel below; a white rim follows
 * it, the red round it.
 */
const DOSTO_FACE: SeriesCabFace = {
  dJoin: 3.3, dSide: 2.6, first: 10.3, roofFrom: 4.45, wrap: true, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: [[0.72, 0.35], [0.9, 0.08], [1.15, 0], [1.4, 0.03], [1.75, 0.15], [2.2, 0.45], [2.7, 0.85], [3.3, 1.4], [3.8, 1.95], [4.1, 2.35], [4.35, 2.75], [4.5, 3.05], [4.6, 3.3]],
  corner: [[0.72, 0.8], [2.2, 0.8], [3.3, 0.75], [4.0, 0.6], [4.35, 0.4], [4.6, 0.1]],
  rows: [0.72, 0.9, 0.95, 1.15, 1.24, 1.47, 1.75, 2.0, 2.12, 2.25, 2.45, 2.5, 2.64, 2.7, 3.3, 3.55, 3.7, 3.8, 3.85, 3.95, 4.04, 4.15, 4.28, 4.35, 4.45, 4.52, 4.6],
  bands: () => [[0, 0.95, "skirtG"], [0.95, 9, "red"]],
  // the black mask narrows from the windscreen to the emblem's panel; the white rim follows it
  fields: [
    { mat: "white", pts: [[-1.16, 4.28], [1.16, 4.28], [1.22, 2.6], [1.18, 2.2], [1.03, 1.6], [0.88, 1.33], [0.62, 1.24], [-0.62, 1.24], [-0.88, 1.33], [-1.03, 1.6], [-1.18, 2.2], [-1.22, 2.6]] },
    { mat: "cabMask", pts: [[-1.1, 4.7], [1.1, 4.7], [1.12, 2.6], [1.08, 2.12], [0.95, 2.0], [0.9, 1.7], [0.78, 1.53], [0.58, 1.47], [-0.58, 1.47], [-0.78, 1.53], [-0.9, 1.7], [-0.95, 2.0], [-1.08, 2.12], [-1.12, 2.6]] },
  ],
  // the lamp clusters' pale housings under the windscreen's lower corners
  masks: [{ lat: [-1.1, -0.58], y: [2.15, 2.48], r: 0.09, mat: "lampBox" }, { lat: [0.58, 1.1], y: [2.15, 2.48], r: 0.09, mat: "lampBox" }],
  panes: [{ lat: [-1.0, 1.0], y: [2.64, 4.15], r: 0.12 }],
  // the destination display behind the windscreen's top (line and destination in amber); the SBB
  // emblem: a cross, its bar ending in arrowheads
  decals: [
    { mat: "amber", pts: [[-0.62, 3.96], [-0.45, 3.96], [-0.45, 4.04], [-0.62, 4.04]] },
    { mat: "amber", pts: [[-0.38, 3.97], [0.12, 3.97], [0.12, 4.03], [-0.38, 4.03]] },
    { mat: "white", pts: [[-0.13, 1.83], [0.13, 1.83], [0.13, 1.87], [-0.13, 1.87]] },
    { mat: "white", pts: [[-0.025, 1.76], [0.025, 1.76], [0.025, 1.94], [-0.025, 1.94]] },
    { mat: "white", pts: [[-0.22, 1.85], [-0.12, 1.76], [-0.12, 1.94]] },
    { mat: "white", pts: [[0.22, 1.85], [0.12, 1.94], [0.12, 1.76]] },
  ],
  lamps: [[-0.9, 2.32, 0.11, "lampHead"], [0.9, 2.32, 0.11, "lampHead"], [-0.71, 2.28, 0.06, "lampHead"], [0.71, 2.28, 0.06, "lampHead"]], roofLamp: [0, 4.32, 0.07],
  wipers: [[[0.0, 2.68], [-0.55, 3.55]]],
};

export const FV_DOSTO: ShinkansenSeries = {
  endLength: 26.8, midLength: 25.0, W: 1.4, Y: 1.2, S: 3.95, C: 4.6, lean: 0.97, B: 0.72, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DOSTO_FACE,
  // the doors under the upper deck's windows, a narrow window in the leaf
  windows: [[1.18, 1.9], [3.3, 3.93]], windowW: 1.0, pitch: 1.5, door: [1.0, 2.85, 1.5, 2.4], doorW: 1.4, doorGlassW: 0.32, upperOverDoors: true,
  // the doors at the low floor's ends, inside the bogies, its windows between them (d behind the body's end):
  // the end car's from a side view and photo-sbb-rabe-502-405.jpg with the upper windows as the ruler
  // (1.5 m pitch), the intermediate car's from photo-sbb-rabde-502-009.jpg
  layout: {
    end: { doors: [[6.05, 7.5, -1], [14.3, 15.8, 1]], windows: [[8.25, 9.35], [9.8, 10.9], [11.2, 11.75]] },
    middle: { doors: [[5.2, 6.65, -1], [17.85, 19.3, 1]], windows: [[7.1, 8.1], [8.57, 9.57], [10.04, 11.04], [11.51, 12.51], [12.98, 13.98], [14.45, 15.45], [15.92, 16.92]] },
  },
  // behind the cab: a hatch, the destination display, the white service door (its window and grille) and
  // the SBB emblem by the first door; over the bogies at the cars' ends: white service doors
  sidePanels: {
    end: [
      { d: [2.96, 3.34], y: [1.35, 1.67], kind: "seam" },
      { d: [5.43, 6.27], y: [1.7, 2.41], kind: "panel", mat: "cream", screen: "black" },
      { d: [6.45, 7.3], y: [1.08, 3.17], kind: "seam" },
      { d: [6.57, 7.16], y: [2.67, 3.03], kind: "window" },
      { d: [6.6, 7.2], y: [1.22, 1.87], kind: "louvres", louvres: 8 },
      { d: [10.95, 11.27], y: [2.6, 2.92], kind: "panel", mat: "red" },
      { d: [20.0, 20.75], y: [1.1, 3.0], kind: "seam" },
      { d: [20.1, 20.65], y: [2.5, 2.85], kind: "window" },
      { d: [21.6, 22.35], y: [1.1, 3.0], kind: "seam" },
      { d: [21.7, 22.25], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
    ],
    middle: [
      { d: [1.6, 2.35], y: [1.1, 3.0], kind: "seam" },
      { d: [1.7, 2.25], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
      { d: [3.2, 3.95], y: [1.1, 3.0], kind: "seam" },
      { d: [3.3, 3.85], y: [2.5, 2.85], kind: "window" },
      { d: [20.55, 21.3], y: [1.1, 3.0], kind: "seam" },
      { d: [20.65, 21.2], y: [2.5, 2.85], kind: "window" },
      { d: [22.15, 22.9], y: [1.1, 3.0], kind: "seam" },
      { d: [22.25, 22.8], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
    ],
  },
  // the pantograph on each end car's roof behind the cab, the leading one raised
  endPantograph: true, trailingLowered: true, pantographD: 5.0,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, cars: [4, 8],
  liveries: { sbb: DOSTO_SBB },
  weight: { end: 64, middle: 55 }, power: 500, maxspeed: 200,
};

export const SBB_FLIRT: ShinkansenSeries = flirt({ W: 1.44, liveries: { sbbRegio: chLivery("sbbRegio", "523 001") }, weight: { end: 42, middle: 32 }, power: 650, maxspeed: 160 });
/**
 * The KISS's S-Bahn paint (photo-rabe-511-044-...-weinfelden.jpg, photo-sbb-rabe-511-tossmuhle.jpg): white
 * over a navy lower band, a navy stripe between the decks, red doors, a dark roof; the front's red
 * wrapping round the cab's corners and up its edge to the roof, the cab's big side window behind.
 */
const KISS_RED_BACK: Pt[] = [[1.55, 0.75], [2.2, 0.95], [3.0, 1.45], [3.6, 1.95], [3.85, 2.2]];
const KISS_SBB: ShinkansenLivery = {
  title: "SBB Regio", number: "511 044",
  palette: { white: c("#f1f1ee"), blue: c("#1f2f6b"), red: c(SBB_RED), roofG: c("#3d4247", 0.6), skirtG: c("#2a2d31", 0.75), cabMask: c("#1b1d20", 0.3) },
  bands: [[0, 1.35, "blue"], [1.35, 2.82, "white"], [2.82, 2.94, "blue"], [2.94, 9, "white"]], doors: [[0, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // d behind the tip: the red edge on the cab side, then the cab's side window, its front rounded
    { mat: "red", front: [[1.55, -9], [3.85, -9]], back: KISS_RED_BACK },
    { mat: "cabGlass", front: [[2.3, 2.2], [2.45, 2.0], [2.9, 1.9], [3.15, 2.0], [3.25, 2.15]], back: [[2.3, 3.85], [3.25, 3.85]] },
  ],
};

/**
 * The KISS's front (the photographs above and photo-sbb-ir-dosto-rabe-512-...jpg in profile): upright
 * from the skirt to the chin, the windscreen raked about 37 degrees and the dark dome over it rounding
 * 3.2 m back to the roof. The red chin under the windscreen holds the SBB emblem between two black
 * lamp pods; white and the number under them, the navy apron with the coupler below.
 */
const KISS_FACE: SeriesCabFace = {
  dJoin: 3.2, dSide: 2.6, first: 5.0, roofFrom: 4.4, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: [[0.6, 0.18], [0.75, 0.05], [1.0, 0], [1.6, 0], [2.0, 0.1], [2.2, 0.2], [2.75, 0.6], [3.35, 1.05], [3.9, 1.5], [4.2, 1.9], [4.45, 2.45], [4.6, 3.2]],
  corner: [[0.6, 0.55], [2.2, 0.55], [3.35, 0.5], [4.0, 0.45], [4.4, 0.3], [4.6, 0.1]],
  rows: [0.6, 0.75, 1.0, 1.35, 1.48, 1.55, 1.76, 2.0, 2.2, 2.3, 2.75, 3.35, 3.45, 3.7, 3.9, 4.2, 4.4, 4.45, 4.6],
  bands: () => [[0, 0.75, "skirtG"], [0.75, 1.35, "blue"], [1.35, 1.55, "white"], [1.55, 9, "red"]],
  masks: [
    // the dark dome over the windscreen, up to the roof, and the lamp pods
    { lat: [-1.06, 1.06], y: [2.12, 4.8], r: 0.3, mat: "cabMask" },
    { lat: [-1.34, -0.74], y: [1.47, 1.77], r: 0.12, mat: "cabMask" }, { lat: [0.74, 1.34], y: [1.47, 1.77], r: 0.12, mat: "cabMask" },
  ],
  panes: [{ lat: [-1.0, 1.0], y: [2.2, 3.35], r: 0.1 }, { lat: [-0.55, 0.55], y: [3.45, 3.7], r: 0.04 }],
  decals: [
    { mat: "white", pts: [[-0.11, 1.64], [0.11, 1.64], [0.11, 1.675], [-0.11, 1.675]] },
    { mat: "white", pts: [[-0.02, 1.58], [0.02, 1.58], [0.02, 1.735], [-0.02, 1.735]] },
    { mat: "white", pts: [[-0.19, 1.657], [-0.1, 1.58], [-0.1, 1.735]] },
    { mat: "white", pts: [[0.19, 1.657], [0.1, 1.735], [0.1, 1.58]] },
  ],
  lamps: [[-0.95, 1.62, 0.08, "lampRed"], [0.95, 1.62, 0.08, "lampRed"], [-1.17, 1.62, 0.07, "lampHead"], [1.17, 1.62, 0.07, "lampHead"]], roofLamp: [0, 3.95, 0.09],
  number: { lat: -0.4, y: 1.4, h: 0.08, mat: "cabMask" },
  wipers: [[[0.1, 2.28], [0.55, 3.1]]],
};

export const SBB_KISS: ShinkansenSeries = {
  ...kiss({ liveries: { sbbRegio: KISS_SBB }, weight: { end: 62, middle: 50 }, power: 1000, maxspeed: 160 }),
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: KISS_FACE,
  windows: [[1.5, 2.25], [3.1, 3.75]], door: [0.95, 2.8, 1.6, 2.55], upperOverDoors: true,
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
