// The NS SNG (Sprinter Nieuwe Generatie, CAF Civity, 2018 -): three-car (SNG-III, 2301 - 2368 and
// 3001 - 3050, mABk + B + mBk, Bo'(2)'(2)'Bo', 59.56 m) and four-car (SNG-IV, 2701 - 2788,
// mABk + mB + mBz + mABk, 75.76 m) low-floor units on Jacobs bogies, drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): the Civity front - the dark grey bumper
// standing out round the open Scharfenberg recess, the white band over it, the slanted lamp clusters
// on the corners, the big windscreen raked about 35 degrees in its black surround with the
// destination display in its head, the light grey cap over it; the yellow front (every unit since
// August 2022) carried round the corners to the white swoosh behind the raked cab side window and the
// blue wedge in front of the cab door. NS blue sides over the white band and the yellow line, the
// white line under the roof's edge, yellow double doors with a narrow window in each leaf, two doors
// a side on every car; the pantograph over each end car's inner end; the roof's equipment covers.
// Matched to the photographs in assets/ns-sng/ (SOURCES.md: 2302 side-on, 2340 side, 2324 and the
// Lelystad unit three-quarter and front, 2348 and 2710 whole units) and the published figures.
// Registered in nlUnits.ts. See docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip (the bumper's front) where it says "tip", else
// behind the body's front end (the face's join, JOIN behind the tip).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#0063d3";

/** Where the face meets the body: the crown at full height 2.6 m behind the bumper's front. */
const JOIN = 2.6;
/** The coupling plane ahead of the bumper: the Scharfenberg head in the open recess. */
const REACH = 0.35;
/** The crown (4.30 m over the roof equipment, nl.wikipedia) and the shoulder. */
const C = 3.9;
const S = 3.5;

/** The side's paint heights (2302 side-on, scaled on the 3.9 m crown): the yellow line, the white band, the white line under the roof's edge. */
const YELLOW_LINE: readonly [number, number] = [0.78, 0.9];
const WHITE_BAND: readonly [number, number] = [0.9, 1.15];
const ROOF_LINE: readonly [number, number] = [3.36, 3.46];
/** The windows' sill and head (2302 side-on: 1.55 - 2.9 m). */
const WINDOWS: readonly [number, number] = [1.55, 2.9];
/** The cab door's front edge, behind the tip (2302: 3.0 m). */
const CAB_DOOR = 2.98;

/**
 * The face's centre line (2302 side-on and the Lelystad and 2324 three-quarter views): the bumper's
 * dark grey front upright from 0.8 to 1.4 m, its top stepping back 0.25 m to the face; the face leaning
 * back past the lamps to the windscreen's foot (2.08 m, 0.45 m back), the windscreen raked about 35
 * degrees to its head (3.55 m, 1.5 m back); the cap rounding over into the crown 2.6 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.58, 0.14], [0.66, 0.04], [0.8, 0], [1.4, 0], [1.45, 0.05], [1.5, 0.22], [1.62, 0.27], [1.9, 0.37], [2.08, 0.45],
  [2.6, 0.8], [3.1, 1.15], [3.55, 1.5], [3.72, 1.8], [3.83, 2.15], [C, JOIN],
];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.48, 1.62, 1.7, 1.95, 2.0, 2.15, 3.25, 3.3, 3.48, 3.62])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The NS logo (0.36 by 0.17 m round (0, 1.83)): two bars, the diagonal joining them and the arrowheads at their outer ends, each convex. */
const LOGO_C: readonly [number, number] = [0, 1.83];
const NS_LOGO: Pt[][] = ([
  box(-0.1, 0.13, 0.045, 0.085), box(-0.13, 0.1, -0.085, -0.045),
  [[-0.1, 0.045], [-0.04, 0.045], [0.1, -0.045], [0.04, -0.045]],
  [[0.13, 0.085], [0.13, 0.045], [0.18, 0.0], [0.15, 0.0]],
  [[-0.13, -0.085], [-0.15, 0.0], [-0.18, 0.0], [-0.13, -0.045]],
  box(0.15, 0.18, -0.02, 0.0), box(-0.18, -0.15, 0.0, 0.02),
] as Pt[][]).map((pts) => pts.map(([l, y]): Pt => [l + LOGO_C[0], y + LOGO_C[1]]));

/** The face's plan: a broad bumper with round corners, the face over it narrowing toward the cap, its corners swept back deep (the lamps sit in them). */
const DEPTH: Pt[] = [[0.58, 0.7], [1.4, 0.8], [1.5, 1.05], [1.62, 1.15], [2.08, 1.2], [2.6, 1.1], [3.1, 0.95], [3.55, 0.8], [3.72, 0.6], [3.83, 0.4], [C, 0.15]];

export const SNG_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 2.2, reach: REACH, first: 9.2, roofFrom: C + 0.2, bulge: 0.08, tolerance: 0.025,
  profile: PROFILE,
  corner: [[0.58, 0.5], [1.4, 0.5], [1.62, 0.62], [2.08, 0.58], [3.1, 0.55], [3.55, 0.5], [3.83, 0.4], [C, 0.25]],
  cornerDepth: DEPTH.map(([y, k]): Pt => [y, Math.max(0.05, Math.min(JOIN - PROFILE.reduce((d, [py, pd]) => (py <= y ? pd : d), 0) - 0.05, k))]),
  rows: ROWS,
  // the dark grey bumper, the white band over it, the yellow front up to the cap
  bands: () => [[0, 1.48, "bumper"], [1.48, 1.62, "white"], [1.62, 9, "yellow"]],
  lodBands: [[0, 1.48, "bumper"], [1.48, 1.62, "white"], [1.62, 3.62, "yellow"], [3.62, 9, "capGrey"]],
  lodGlass: { hw: 0.9, y: [2.12, 3.5] },
  fields: [
    // the open coupler recess in the bumper
    { mat: "recess", pts: box(-0.48, 0.48, 0.72, 1.32) },
    // the white wedges under the lamps, widening to the corners
    { mat: "white", pts: [[0.62, 1.62], [1.5, 1.62], [1.5, 1.98]] },
    { mat: "white", pts: [[-1.5, 1.62], [-0.62, 1.62], [-1.5, 1.98]] },
    // the light grey cap over the windscreen between the yellow pillars, the camera's dark box in it
    { mat: "capGrey", pts: box(-1.0, 1.0, 3.6, 4.2) },
    { mat: "black", pts: box(-0.3, 0.3, 3.68, 3.82) },
  ],
  masks: [
    // the windscreen's black surround
    { lat: [-1.1, 1.1], y: [2.03, 3.62], r: 0.18, mat: "black" },
  ],
  panes: [
    { lat: [-1.02, 1.02], y: [2.12, 3.27], r: 0.12 },
    // the destination display in the windscreen's head
    { lat: [-0.62, 0.62], y: [3.31, 3.5], r: 0.03, mat: "display" },
  ],
  decals: NS_LOGO.map((pts) => ({ mat: "logoBlue", pts, fine: 1 })),
  // the slanted lamp clusters on the corners: the headlight outside, the tail lamp inside
  pods: [1, -1].map((sd) => ({ lat: sd * 0.88, y: 1.95, w: 0.66, h: 0.3, r: 0.14, proud: 0.015, depth: 0.04, mat: "black", lamps: [[sd * 0.1, 0.085, "lampHead"], [-sd * 0.13, 0.05, "lampRed"]] as const })),
  // the third headlight in the cap's box
  lamps: [[0, 3.75, 0.05, "lampHead"]],
  wipers: [[[0.2, 2.16], [0.55, 2.95]]],
};

/** The current NS scheme (2324, the Lelystad unit): blue sides, white band and yellow line, the yellow front with the white swoosh and the blue wedge. */
function sngLivery(title: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      blue: c(NS_BLUE, 0.35), roofB: c("#0a58b8", 0.5), white: c("#f2f2ef", 0.35), yellow: c(NS_YELLOW, 0.35), bumper: c("#3c4044", 0.55),
      skirtG: c("#2f3235", 0.7), capGrey: c("#d6d9da", 0.4), black: c("#141618", 0.25), recess: c("#1b1c1e", 0.75), logoBlue: c("#003082", 0.4),
      display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true }, cabMask: c("#1d1f22", 0.3),
      equip: c("#a9aeb1", 0.5), grille: c("#6e7376", 0.6), rubber: c("#1d1f22", 0.6),
    },
    bands: [[0, YELLOW_LINE[0], "skirtG"], [YELLOW_LINE[0], YELLOW_LINE[1], "yellow"], [WHITE_BAND[0], WHITE_BAND[1], "white"], [WHITE_BAND[1], ROOF_LINE[0], "blue"], [ROOF_LINE[0], ROOF_LINE[1], "white"], [ROOF_LINE[1], 9, "blue"]],
    doors: [[0, 9, "yellow"]],
    roof: "roofB", skirt: "skirtG",
    endSweeps: [
      // the nose's side white from the white band to the roof line, up to the cab door
      { mat: "white", front: [[WHITE_BAND[0], -9], [ROOF_LINE[1], -9]], back: [[WHITE_BAND[0], CAB_DOOR], [ROOF_LINE[1], CAB_DOOR]] },
      // the yellow front round the corners, its back edge the swoosh's front: rising from the lamps to behind the cab window
      { mat: "yellow", front: [[1.6, -9], [4.2, -9]], back: [[1.6, 0.35], [2.0, 0.65], [2.2, 1.05], [2.26, 2.4], [2.5, 2.56], [2.8, 2.64], [3.4, 2.68], [4.2, 2.74]], top: 9 },
      // the blue wedge in front of the cab door, its point forward
      { mat: "blue", front: [[1.25, CAB_DOOR - 0.01], [1.82, 1.5], [2.4, CAB_DOOR - 0.01]], back: [[1.25, CAB_DOOR + 0.02], [2.4, CAB_DOOR + 0.02]] },
      // the dark grey bumper wrapping round onto the sides, its top rising toward the front
      { mat: "bumper", front: [[0.5, -9], [1.5, -9]], back: [[0.5, 3.05], [0.9, 2.95], [1.05, 2.2], [1.22, 1.3], [1.4, 0.6], [1.5, 0.3]] },
      // the raked cab side window, its front edge along the windscreen's rake
      { mat: "black", front: [[2.25, 1.15], [3.33, 1.8]], back: [[2.25, 2.36], [2.5, 2.5], [3.15, 2.56], [3.33, 2.42]] },
      // the white bar over the first-class windows
      { mat: "white", front: [[2.98, 4.45], [3.04, 4.45]], back: [[2.98, 8.9], [3.04, 8.9]] },
    ],
  };
}

/** Body spans [d0, d1] of a double door centred at d, its two 0.68 m leaves parting (the photographs' door aspect: 1.35 m wide over 2.37 m). */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.68, d, -1], [d, d + 0.68, 1]];
/** Windows of 0.95 m (the photographs' aspect, 0.68 of their 1.35 m height) centred on the 1.12 m spans starting at each d. */
const wins = (...ds: number[]): Array<readonly [number, number]> => ds.map((d) => [d + 0.085, d + 1.035] as const);

/** The end car (tip d, the 2302 and 2340 side-on photographs): three first-class windows, a door, three windows, a door, two windows to the joint. */
const END = {
  doors: [...door(9.98 - JOIN), ...door(16.75 - JOIN)],
  windows: wins(4.55 - JOIN, 6.1 - JOIN, 7.65 - JOIN, 11.15 - JOIN, 12.68 - JOIN, 14.21 - JOIN, 17.9 - JOIN, 19.45 - JOIN),
};
/** The intermediate car (from its front joint, less the gap): two windows, a door, three windows, a door, two windows, symmetric. */
const G = 0.25;
const MIDDLE = {
  doors: [...door(4.35 - G), ...door(11.85 - G)],
  windows: wins(0.45 - G, 2.03 - G, 5.55 - G, 7.54 - G, 9.53 - G, 13.05 - G, 14.63 - G),
};

/** The roof's equipment covers, the cab door, the coupler and the underfloor. */
function sngFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  const L = car.length;
  m.scope("roof equipment", () => {
    // light grey covers on the crown (2710, 2348): a low one with grilles and a taller box
    const cover = (d0: number, d1: number, h: number, hw: number) => {
      at("equip", d0, d1, C - 0.06, C + h, hw);
      at("grille", d0 + 0.3, Math.min(d0 + 0.9, d1 - 0.3), C + h, C + h + 0.01, hw - 0.2);
    };
    if (car.end) {
      // over the cab: the horn and roof lamp box; then the converter and air conditioning covers to the pantograph
      at("equip", 0.1, 1.4, C - 0.06, C + 0.2, 0.55);
      cover(1.6, 7.6, 0.36, 0.8);
      cover(7.9, 12.2, 0.3, 0.75);
      cover(12.5, 14.6, 0.24, 0.7);
    } else {
      cover(L / 2 - 3.2, L / 2 - 0.2, 0.3, 0.75);
      cover(L / 2 + 0.2, L / 2 + 2.6, 0.24, 0.7);
    }
  });
  if (car.end) {
    m.scope("cab door", () => {
      // the blue cab door's outline behind the swoosh, its narrow window drawn with the cab windows
      const [d0, d1, y0, y1, k] = [CAB_DOOR - JOIN, CAB_DOOR - JOIN + 0.75, 0.86, 3.2, 0.02];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
      }
    });
    m.scope("coupler", () => {
      // the Scharfenberg coupler in the open recess, its head on the coupling plane
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("recess", -0.3, REACH - 0.12, 0.93, 1.07, 0.1);
      out("equip", REACH - 0.12, REACH, 0.84, 1.16, 0.2);
    });
  }
  m.scope("underfloor", () => {
    // the low floor leaves little under the body: tanks and boxes between the bogies
    if (car.end) { at("skirtG", 6.8 - JOIN, 8.6 - JOIN, 0.4, 0.62, 1.05); at("skirtG", 11.0 - JOIN, 15.0 - JOIN, 0.4, 0.62, 1.05); }
    else at("skirtG", L / 2 - 2.5, L / 2 + 2.5, 0.4, 0.62, 1.05);
  });
}

export const SNG: ShinkansenSeries = {
  // 59.56 m (three cars) and 75.76 m (four cars) over the couplers, 2.88 m wide (nl.wikipedia
  // "Sprinter Nieuwe Generatie", CAF): the intermediate car 16.2 m joint to joint, the end car 21.68 m
  // from the coupling plane to its joint
  endLength: 21.68, midLength: 16.2, W: 1.44, Y: 1.0, S, C, lean: 0.975, B: 0.58, A: YELLOW_LINE[0],
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: SNG_FACE,
  windows: [WINDOWS], windowW: 0.95, pitch: 1.55,
  // the 1.3 m sliding plug doors (1.35 m over the leaves), a narrow window in each leaf (layout: one span a leaf)
  door: [0.78, 3.15, 1.3, 2.85], doorW: 1.35, doorGlassW: 0.28,
  layout: { end: END, middle: MIDDLE },
  // the cab door's narrow window
  cabWindows: [[CAB_DOOR - JOIN + 0.2, CAB_DOOR - JOIN + 0.55, 2.2, 3.0]],
  // Bo'(2)'(2)'Bo': the motor bogie 5.1 m behind the tip (2302 side-on), 2.4 m wheelbase, Jacobs bogies under the joints; 850 mm wheels
  jacobs: true, endBogies: [5.1 - JOIN, 0], bogieCentres: 16.0, wheelR: 0.425, wheelbase: 2.4,
  // a single-arm pantograph over each end car's inner end, both raised
  endPantograph: true, pantographD: 19.4,
  lodRoof: { d: [JOIN + 1.6, JOIN + 14.6], hw: 0.8, y: [C - 0.06, C + 0.36], mat: "equip" },
  fittings: sngFittings,
  cars: [3, 4],
  liveries: { sprinter: sngLivery("NS Sprinter", "2324") },
  // 110 t (three cars) and 138 t (four cars): end cars 41 t, intermediate cars 28 t; 4 - 6 motors of 240 kW
  weight: { end: 41, middle: 28 }, power: 360, maxspeed: 160,
};
