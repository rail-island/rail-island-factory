// The OBB class 4744 "Cityjet" (Siemens Desiro ML, 2016-), drawn on the series kit (shinkansen.ts)
// with its own cab face (seriesCab.ts): three aluminium cars on conventional bogies (Bo'Bo' + 2'2' +
// Bo'Bo', no Jacobs bogies), 75.152 m over the couplers. The regional ("R-Bahn") layout: one double
// plug door a side on each end car and two on the middle car, four a side in all; the long, low
// windows of the low-floor section between the bogies and the shorter, higher windows over them.
// The strongly raked face with the big black windscreen surround framed in red, the white band with
// the OBB logo, the two lamp pods in the red band and the black buffer blocks; the Cityjet paint:
// white over three red bands, dark grey doors. One pantograph, on the 4744.0 end car over its rear
// bogie. Matched to the photographs in assets/obb-4744/ (SOURCES.md). See docs/models/austria-trains.md.
//
// Heights over the rail; d behind the face's tip on the face and in the end car's sweeps, else d behind
// the body's front end (the face's join on the end car, the body's end on the middle car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the crown reaches full height 2.7 m behind the tip (the side-on photo). */
const JOIN = 2.7;
/** The crown, over the rail (4.257 m over the roof equipment). */
const C = 3.92;
/** The running number of the photographed pantograph car (photo-class-4744-desiro-emu.jpg). */
const NUMBER = "4744 036";

/**
 * The face's centre line (photo-eisenbahn-o-bb-4744-065-5.jpg, about 56 px/m at the nose): the plough
 * 0.2 m back at the bottom, the red bumper upright from 1.0 to 2.05 m, the white band leaning back to the
 * windscreen's foot at 2.45 m, then the windscreen and its black surround raked about 50 degrees back
 * to the roof, 2.7 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.35, 0.22], [0.6, 0.14], [0.85, 0.05], [1.0, 0.01], [1.4, 0], [2.0, 0], [2.1, 0.04], [2.3, 0.14], [2.45, 0.27],
  [2.7, 0.52], [3.0, 0.86], [3.3, 1.24], [3.55, 1.62], [3.72, 1.98], [3.84, 2.3], [3.9, 2.52], [C, JOIN],
];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.8, 1.36, 1.89, 2.08, 2.43])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

export const OBB4744_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.65, reach: 0.3, first: 9.3, roofFrom: 3.9, bulge: 0.08, tolerance: 0.05, cols: [6, 4, 1, 1],
  profile: PROFILE,
  // the head-on photo (photo-obb-4744-053.jpg, 125 px/m): the bumper 2.35 m wide, its corners rounding
  // 0.5 m back into the sides; the raked windscreen hood narrower, its corners rounding wider
  corner: [[0.35, 0.5], [1.4, 0.45], [2.05, 0.45], [2.45, 0.55], [3.0, 0.7], [3.55, 0.8], [C, 0.4]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.05, y < 2.1 ? 0.9 : 1.3))]),
  rows: ROWS,
  // the side's bands wrap round the bumper; the white band above them and the white hood round the windscreen
  bands: () => [[0, 0.8, "skirtB"], [0.8, 1.36, "red"], [1.36, 1.89, "orange"], [1.89, 2.08, "red2"], [2.08, 9, "white"]],
  lodBands: [[0, 0.8, "skirtB"], [0.8, 2.08, "red"], [2.08, 2.43, "white"], [2.43, 9, "black"]],
  lodGlass: { hw: 0.82, y: [2.52, 3.32] },
  fields: [
    // the coupler's recess between the buffer blocks
    { mat: "black", pts: box(-0.55, 0.55, 0.8, 1.6) },
  ],
  masks: [
    // the red frame round the windscreen: a bar under it and the two strips up its sides into the roof
    { lat: [-1.04, 1.04], y: [2.43, 3.95], r: 0.05, mat: "red2" },
    // the big black surround holding the windscreen, the destination display and the number
    { lat: [-0.87, 0.87], y: [2.5, 4.2], r: 0.04, mat: "black" },
  ],
  panes: [{ lat: [-0.82, 0.82], y: [2.53, 3.32], r: 0.06 }, { lat: [-0.62, 0.62], y: [3.37, 3.55], r: 0.03, mat: "display" }],
  // the two lamp pods in the red band, two round LED headlights each; the black buffer blocks either side of the coupler
  pods: [
    ...[1, -1].map((sd) => ({ lat: sd * 0.62, y: 1.78, w: 0.5, h: 0.31, r: 0.04, proud: 0.03, depth: 0.04, mat: "black", lamps: [[-0.1, 0.07, "lampHead"], [0.1, 0.07, "lampHead"]] as const })),
    ...[1, -1].map((sd) => ({ lat: sd * 0.84, y: 1.1, w: 0.55, h: 0.6, r: 0.04, proud: 0.12, depth: 0.05, mat: "black" })),
  ],
  texts: [
    { text: "OBB", lat: 0, y: 2.16, h: 0.2, mat: "red2" },
  ],
  wipers: [[[0.1, 2.56], [0.7, 3.1]]],
};

/** The Cityjet paint: white over three red bands (the brightest in the middle), a dark grey foot and dark grey doors. */
function cityjet(): ShinkansenLivery {
  return {
    title: "Cityjet", number: NUMBER,
    palette: {
      white: c("#eef0f0", 0.35), red: c("#cc2229"), orange: c("#e5401f"), red2: c("#d92226"), dark: c("#3c3f42", 0.6), skirtB: c("#1d1f21", 0.6),
      roofG: c("#c9ccce", 0.55), black: c("#141618", 0.3), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true },
      doorG: c("#3a3d40", 0.45), equip: c("#55595d", 0.55), equipDark: c("#3d4145", 0.6), grille: c("#2a2d30", 0.7),
    },
    // the side (photo-eisenbahn-o-bb-4744-065-5.jpg): dark grey up to 0.98 m, red to 1.36 m, the brighter
    // red-orange band to 1.89 m, red to the low windows' heads at 2.27 m, white above
    bands: [[0, 0.98, "dark"], [0.98, 1.36, "red"], [1.36, 1.89, "orange"], [1.89, 2.27, "red2"], [2.27, 9, "white"]],
    // the distant model: the three reds as one band
    lodSides: [[0, 0.98, "dark"], [0.98, 2.27, "red2"], [2.27, 9, "white"]],
    doors: [[0, 9, "doorG"]],
    leafEdgeStripe: { w: 0.06, mat: "white", glassShift: 0.06 },
    roof: "roofG", skirt: "dark",
    endSweeps: [
      // the red's top drops from the side's 2.27 m to the face's white band (2.08 m) ahead of the cab side
      { mat: "white", front: [[2.03, -9], [2.27, -9]], back: [[2.03, 1.2], [2.27, 1.8]], face: true },
      // the cab side window: its front edge rounding up and back from the sill, its rear edge upright
      { mat: "cabGlass", front: [[2.24, 2.02], [2.45, 2.05], [2.7, 2.2], [2.9, 2.45], [3.02, 2.75], [3.1, 3.15], [3.12, 3.5]], back: [[2.24, 4.44], [3.12, 4.44]], top: 3.12 },
    ],
    endLettering: [
      { text: "OBB", d: 5.9 - JOIN, y: 2.9, h: 0.24, mat: "red2" },
    ],
  };
}

/** Body spans [d0, d1] of a double plug door from d, its two 0.9 m leaves parting. */
const door = (d: number): Array<readonly [number, number, number]> => [[d, d + 0.9, -1], [d + 0.9, d + 1.8, 1]];

/** The end car's body behind the join: 25.18 m from the tip to its inner coupling plane, less the gap. */
const END_BODY = 25.18 - JOIN - 0.3;
/** The middle car's body: 24.79 m over the couplers less the gaps. */
const MID_BODY = 24.79 - 0.5;

/** The roof equipment, the coupler and the underfloor of a car. */
function obb4744Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  /** A roof box with a grille panel on each side at its rear end. */
  const roofBox = (name: string, d0: number, d1: number, h: number, hw: number, mat: string) => m.scope(name, () => {
    at(mat, d0, d1, C - 0.08, C + h, hw);
    for (const sd of [1, -1]) block(m, "grille", Math.min(X(d1 - 1.2), X(d1 - 0.2)), Math.max(X(d1 - 1.2), X(d1 - 0.2)), C + 0.05, C + h - 0.06, sd > 0 ? hw : -hw - 0.01, sd > 0 ? hw + 0.01 : -hw);
  });
  m.scope("roof equipment", () => {
    if (car.end) {
      // (photo-eisenbahn-o-bb-4744-065-5.jpg) the cab's cooling unit, the converter, the transformer's
      // cooler and the low high-voltage deck by the pantograph over the rear bogie
      roofBox("cab cooling unit", -0.3, 1.5, 0.34, 0.72, "equipDark");
      roofBox("converter", 2.2, 7.1, 0.33, 0.9, "equip");
      roofBox("transformer cooler", 7.3, 13.7, 0.33, 0.9, "equipDark");
      m.scope("high-voltage deck", () => at("equip", 14.0, END_BODY - 0.5, C - 0.08, C + 0.12, 0.75));
    } else {
      // one air-conditioning unit over the front half of the middle car (photo-class-4744-desiro-emu.jpg)
      roofBox("air conditioning", 2.4, 7.2, 0.3, 0.8, "equip");
    }
  });
  if (car.end) {
    m.scope("coupler", () => {
      // the Scharfenberg coupler in its recess, its head on the coupling plane 0.3 m ahead of the tip
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.3, 0.2, 0.93, 1.07, 0.1);
      out("carbon", 0.2, 0.3, 0.86, 1.14, 0.19);
    });
  }
  m.scope("underfloor", () => {
    // the batteries and the air reservoirs between the bogies, under the low floor
    const y0 = 0.36, y1 = 0.62;
    if (car.end) { at("under", 5.6, 9.0, y0, y1, 1.05); at("under", 9.6, 14.6, y0, y1, 1.05); }
    else { at("under", 6.0, 10.5, y0, y1, 1.05); at("under", 11.2, 15.6, y0, y1, 1.05); }
  });
}

/** The low windows' panes between the bogies (wide and narrow by turns, black pillars), the end car's d behind its join. */
const END_LOW: Array<readonly [number, number]> = [[9.3, 11.4], [11.85, 13.17], [13.63, 15.42], [15.83, 16.97]];
const MID_LOW: Array<readonly [number, number]> = [[7.9, 9.8], [10.2, 11.5], [11.95, 13.75], [14.2, 16.4]];

export const OBB4744: ShinkansenSeries = {
  // 75.152 m over the couplers (de.wikipedia "OBB 4744"): end cars 25.18 m tip to coupler, the middle car
  // 24.79 m (a projective fit of the photographed unit); 2.82 m wide
  endLength: 25.18, midLength: 24.79, W: 1.41, Y: 0.7, S: 3.5, C, lean: 0.985, B: 0.36, A: 0.5,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: OBB4744_FACE,
  // two rows: the higher windows over the bogies (1.66 - 2.72 m) and the low-floor section's long ones (1.17 - 2.27 m)
  windows: [[1.66, 2.72], [1.17, 2.27]], windowW: 1.8, pitch: 2.0, door: [0.58, 2.95, 1.2, 2.75], doorW: 1.8, doorGlassW: 0.55,
  layout: {
    // the end car (d behind the join): the high window behind the cab, the door, the four low panes, the high pair over the rear bogie
    end: {
      doors: door(6.6),
      windows: [],
      rows: [[[2.9, 5.4], [18.23, 19.85], [19.95, 21.53]], END_LOW],
    },
    // the middle car: high windows over both bogies, a door behind each, the low panes between
    middle: {
      doors: [...door(5.2), ...door(MID_BODY - 7.0)],
      windows: [],
      rows: [[[0.8, 4.3], [MID_BODY - 4.3, MID_BODY - 0.8]], MID_LOW],
    },
  },
  // conventional SF 6500 bogies: 16.24 m centres, 2.3 m wheelbase; 850 mm motor wheels, 760 mm trailer wheels
  endBogies: [4.9 - JOIN, 4.9 - JOIN + 16.24], midBogies: [(MID_BODY - 16.24) / 2, (MID_BODY + 16.24) / 2],
  bogieCentres: 16.24, wheelR: 0.38, wheelbase: 2.3, endCarBogie: { wheelbase: 2.3, wheelR: 0.425 },
  // one single-arm pantograph, on the 4744.0 end car over its rear bogie
  endPantograph: "lead", pantographAt: 18.3,
  lodRoof: { d: [JOIN + 2.2, JOIN + 13.7], hw: 0.9, y: [C - 0.08, C + 0.33], mat: "equip" },
  fittings: obb4744Fittings,
  cars: [3],
  liveries: { cityjet: cityjet() },
  weight: { end: 52, middle: 41 }, power: 867, maxspeed: 160,
};

const P = seriesParams(OBB4744);

export function obb4744(v?: ParamValues): MeshBuilder { return buildSeries(OBB4744, P, v); }
export function obb4744Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(OBB4744, P, v); }

export const OBB4744_DESIGN = seriesDesign("proc-vehicle-obb-4744", "OBB 4744 Cityjet", OBB4744, P, obb4744, obb4744Lod, "obb-4744", "uic");
