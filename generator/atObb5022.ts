// The OBB class 5022 (Siemens Desiro Classic, 2004 - 2008, in service from 2005): the DB class 642's
// sister on the series kit (shinkansen.ts), built on its body, face, running gear and window layout
// (generator/deBr642.ts, `BR642`): two cars articulated on a Jacobs bogie (B'2'B'), 41.7 m over the
// couplers, an engine under each car's high-floor end. What the OBB units differ in is paint: the
// delivery "Schraegdesign" - silver grey sides, a red front whose rear edge leans forward from the skirt
// to the roof behind the first window, the dark grey skirt and window bands, the white OBB letters in
// the face's lamp panel and the red ones on the sides - and the Cityjet repaint every unit wears since
// 2017 (white over a red band the low-floor windows reach into, a black cap, a red line round the mask,
// a white lamp panel with the red OBB letters, dark grey doors). Matched to the photographs in
// assets/obb-5022/ (SOURCES.md). See docs/models/austria-units.md.
//
// Heights over the rail; d behind the face's tip on the face and in the end car's sweeps, else d behind
// the body's front end (the face's join, DJOIN behind the tip).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
type Band = readonly [number, number, string];
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c } from "./seriesHelpers.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { BR642 } from "./deBr642.ts";

/** The BR 642's face join behind the tip, the coupling plane's reach ahead of it (deBr642.ts). */
const DJOIN = 2.9;
const B0 = DJOIN;
const REACH = 0.35;
/** The skirt's top: dark grey below (the BR 642's light grey stripe is not there). */
const SKIRT = 0.82;
/** The black window band over the high floor (2.05 - 3.3 m) and the low floor's (1.28 - 3.3 m), as on the BR 642. */
const HIGH_BAND: readonly [number, number] = [2.05, 3.3];
const LOW_BAND: readonly [number, number] = [1.28, 3.3];
/** Where the Cityjet's red band ends under the white (the high-floor windows' foot, Pachern photograph). */
const CJ_RED = 2.02;

const OBB_RED = "#d8261c";

/** The door, tip d 10.62 - 12.0 (deBr642.ts). */
const T_DOOR: readonly [number, number] = [10.62, 12.0];
/** The red front's rear edge on the delivery paint (Uebersbach photograph): [y, d behind the tip]. */
const RED_BACK: Pt[] = [[SKIRT, 6.45], [HIGH_BAND[0], 5.9], [HIGH_BAND[1], 5.35], [3.6, 5.2]];

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** A closed outline from a right half (foot's centre to head's centre). */
const closed = (half: Pt[]): Pt[] => [...half, ...mirror(half).slice(1, -1)];

/** The BR 642's black mask (head-on, right half), grown by g all round (deBr642.ts `maskHalf`). */
function maskHalf(g: number): Pt[] {
  return [[0, 1.68 - g], [1.1 + g, 1.68 - g], [1.18 + g, 2.0], [1.21 + g, 2.47], [1.2 + g, 2.8], [1.12 + g, 3.08], [0.94 + g * 0.8, 3.28 + g * 0.7], [0.6, 3.42 + g], [0, 3.47 + g]];
}
/** The Cityjet's mask: the BR 642's from the lamp panel's head (2.0 m) up, grown by g. */
function cityjetMask(g: number): Pt[] {
  return [[0, 2.0 - g], [1.18 + g, 2.0 - g], ...maskHalf(g).slice(3)];
}
/** The windscreen's glass inside the mask, above the bar at 2.47 - 2.53 m. */
const SCREEN: Pt[] = closed([[0, 2.53], [1.15, 2.53], [1.15, 2.8], [1.08, 3.06], [0.9, 3.25], [0.58, 3.38], [0, 3.42]]);

// (the BR 642's face takes its side bands; this one the livery's `front`)
const { bands: _sideBands, ...BASE_FACE } = BR642.cabFace!;

/**
 * The face: the BR 642's shape, wipers and lamps (Graz Hbf and Graz Ostbahnhof photographs, about 230 px/m
 * up the face): the coupler's black recess wider (most of the face's width), the number on the grey strip
 * over it, the white OBB letters centred in the lamp panel between the headlights (1.81 - 1.98 m), the
 * destination display over them. The mask, the lamp panel and the number strip are the livery's
 * (`faceFields`, under the face's own fields): the Cityjet's mask ends at the lamp panel's head (2.0 m), a
 * red line round it, the panel white with black boxes round the lamps; its cap black.
 */
const FACE: SeriesCabFace = {
  ...BASE_FACE,
  // a coarser paint-edge tolerance than the BR 642's 0.035 m (still within 8 cm of every edge): this face carries more fields (the budget)
  tolerance: 0.08,
  lodBands: [[0, SKIRT, "skirtG"], [SKIRT, 1.55, "recess"], [1.55, 1.68, "numStrip"], [1.68, 2.0, "lowPanel"], [2.0, 3.44, "cabMask"]],
  paint: [
    // the cap's paint carried back over the cab sides, its edge rising from the windscreen's head to the shoulder
    { mat: "capG", front: [[3.42, -9], [3.6, -9]], back: [[3.42, 1.2], [3.5, 2.4], [3.56, 3.0], [3.6, 3.5]], top: 3.6 },
  ],
  fields: [
    // the coupler's black recess and the windscreen
    { mat: "recess", pts: [[-0.95, 0.8], [0.95, 0.8], [1.0, 1.55], [-1.0, 1.55]] },
    { mat: "screen", pts: SCREEN },
    // the destination display
    { mat: "recess", pts: box(-0.6, 0.6, 2.1, 2.36) },
    // the roof lamp's housing on the cap
    { mat: "cabMask", pts: box(-0.2, 0.2, 3.57, 3.7) },
    { mat: "frameSilver", pts: box(-0.16, 0.16, 3.6, 3.67) },
  ],
  decals: [],
  texts: [
    { text: "WEIZ", lat: 0, y: 2.17, h: 0.1, mat: "display" },
    { text: "OBB", lat: 0, y: 1.81, h: 0.15, mat: "logo" },
  ],
  // the headlights larger than the BR 642's (Graz Ostbahnhof photograph), the tail lamps inside them
  lamps: [[-0.86, 1.88, 0.085, "lampHead"], [0.86, 1.88, 0.085, "lampHead"], [-0.68, 1.88, 0.045, "lampRed"], [0.68, 1.88, 0.045, "lampRed"]],
  number: { lat: -0.33, y: 1.57, h: 0.09, mat: "numText" },
};

/** The two paints' shared colours. */
const PALETTE = {
  red: c(OBB_RED, 0.35), silver: c("#c6c9cb", 0.3), white: c("#eceeef", 0.35),
  roofG: c("#a9aeb1", 0.5), skirtG: c("#55595d", 0.6), cabMask: c("#141618", 0.2), screen: c("#44515c", 0.06),
  panelGlass: c("#1c2024", 0.1), recess: c("#1a1b1d", 0.7), display: c("#f0a83a", 0.3),
  grille: c("#4a5055", 0.6), cooler: c("#8e9498", 0.55), numText: c("#f2f2f2", 0.4), letterW: c("#f2f2f2", 0.4),
};

/** The delivery paint (2005 -): silver, the red front, dark grey skirt and window bands, light grey doors. */
function deliveryLivery(): ShinkansenLivery {
  const band = "#565b5f";
  return {
    title: "OBB", number: "5022 007-8",
    palette: {
      ...PALETTE, capG: c("#b3b8bb", 0.45), band: c(band, 0.2), bandLow: c(band, 0.2), doorG: c("#d3d6d7", 0.35),
      numStrip: c("#55595d", 0.6), lowPanel: c("#1c2024", 0.1), logo: c("#f4f4f4", 0.4),
    },
    // the number's grey strip, the black mask and the lamp panel's dark glass
    faceFields: [
      { mat: "numStrip", pts: box(-1.06, 1.06, 1.55, 1.68) },
      { mat: "cabMask", pts: closed(maskHalf(0)) },
      { mat: "panelGlass", pts: [[-1.08, 1.71], [1.08, 1.71], [1.16, 2.44], [-1.16, 2.44]] },
    ],
    bands: [[0, SKIRT, "skirtG"], [SKIRT, 9, "silver"]], front: [[0, SKIRT, "skirtG"], [SKIRT, 9, "red"]],
    doors: [[0, 9, "doorG"]], roof: "roofG", skirt: "skirtG",
    lodSides: [[0, SKIRT, "skirtG"], [SKIRT, HIGH_BAND[0], "silver"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "silver"]],
    lodSideFields: { end: [
      { d: [0, 5.9], bands: [[0, SKIRT, "skirtG"], [SKIRT, HIGH_BAND[0], "red"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "red"]] },
      { d: [5.9, T_DOOR[0]], bands: [[0, SKIRT, "skirtG"], [SKIRT, HIGH_BAND[0], "silver"], [HIGH_BAND[0], HIGH_BAND[1], "band"], [HIGH_BAND[1], 9, "silver"]] },
    ] },
    endSweeps: [
      // the red front, its rear edge leaning forward from the skirt to the roof (Uebersbach photograph)
      { mat: "red", front: [[SKIRT, -9], [3.6, -9]], back: RED_BACK, top: 3.6 },
      // the cab's dark side band: its front edge raked back with the face, back to the door
      { mat: "band", face: true, front: [[HIGH_BAND[0], 2.0], [HIGH_BAND[1], 2.62]], back: [[HIGH_BAND[0], 10.25], [HIGH_BAND[1], 10.25]] },
      // the raked cab side window in it
      { mat: "screen", face: true, front: [[2.15, 2.12], [3.14, 2.74]], back: [[2.15, 2.86], [3.14, 2.86]] },
    ],
    // the red OBB letters on the silver between the red front and the door
    endLettering: [{ text: "OBB", d: 8.0 - B0, y: 1.38, h: 0.32, mat: "red", letterStroke: 0.06 }],
  };
}

/** The Cityjet repaint (2017 -): white over a red band, a black cap, a red line round the mask, dark grey doors. */
function cityjetLivery(): ShinkansenLivery {
  const sides: Band[] = [[0, SKIRT - 0.2, "skirtG"], [SKIRT - 0.2, CJ_RED, "red"], [CJ_RED, 9, "white"]];
  return {
    title: "Cityjet", number: "5022 051-6",
    palette: {
      ...PALETTE, capG: c("#1d1f22", 0.3), roofG: c("#646b70", 0.5), band: c("#eceeef", 0.35), bandLow: c(OBB_RED, 0.35),
      doorG: c("#3b3e41", 0.35), numStrip: c("#eceeef", 0.35), numText: c("#3b3e41", 0.4), lowPanel: c("#eceeef", 0.35),
      logo: c(OBB_RED, 0.35),
    },
    bands: sides, front: [[0, SKIRT - 0.2, "skirtG"], [SKIRT - 0.2, 9, "white"]],
    // the red line round the mask (the thin white gap inside it left out: the budget), the mask from the
    // lamp panel's head up reaching down round the lamps at the sides (their black boxes), the white panel between
    faceFields: [
      { mat: "red", pts: closed(cityjetMask(0.05)) },
      { mat: "cabMask", pts: closed([[0, 2.0], [0.58, 2.0], [0.58, 1.76], [1.11, 1.76], ...cityjetMask(0).slice(2)]) },
    ],
    doors: [[0, 9, "doorG"]], roof: "roofG", skirt: "skirtG",
    lodSides: sides,
    lodSideFields: { end: [{ d: [0, 3.2], bands: [[0, SKIRT - 0.2, "skirtG"], [SKIRT - 0.2, 1.75, "red"], [1.75, 9, "white"]] }] },
    endSweeps: [
      // the red rising from the face's corners to the band's head behind the cab side window
      { mat: "red", face: true, front: [[SKIRT - 0.2, -9], [1.55, -9], [CJ_RED, 2.2]], back: [[SKIRT - 0.2, 4.0], [CJ_RED, 4.0]] },
      // the raked cab side window
      { mat: "screen", face: true, front: [[2.15, 2.12], [3.14, 2.74]], back: [[2.15, 2.86], [3.14, 2.86]] },
    ],
  };
}

/** The window bands (the low band in two paints: the Cityjet's red under its white), the roof's cooler, exhaust and air conditioning, the skirt's grille and the engine. */
function fittings5022(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const door: readonly [number, number] = [T_DOOR[0] - B0, T_DOOR[1] - B0];
  m.scope("window band", () => {
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "bandLow", door[1] + 0.4, Math.min(L - 0.65, 19.6 - B0), LOW_BAND[0], CJ_RED, 0.003, 0.003);
      sidePanel(m, b, X, sd, "band", door[1] + 0.4, Math.min(L - 0.65, 19.6 - B0), CJ_RED, LOW_BAND[1], 0.003, 0.003);
    }
  });
  const C = 3.85;
  m.scope("cooler", () => {
    // the cooler's long low fairing behind the cab (tip d 3.9 - 8.1), its grilles on top
    const [d0, d1] = [3.9 - B0, 8.1 - B0];
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "cooler", [d0, d1], [0, 0.78], 0.006);
    block(m, "cooler", Math.min(X(d0 + 0.25), X(d1 - 0.25)), Math.max(X(d0 + 0.25), X(d1 - 0.25)), C - 0.04, C + 0.12, -0.72, 0.72);
    for (let k = 0; k < 4; k++) {
      const a = d0 + 0.6 + k * 0.85;
      block(m, "grille", Math.min(X(a), X(a + 0.6)), Math.max(X(a), X(a + 0.6)), C + 0.12, C + 0.13, -0.6, 0.6);
    }
  });
  m.scope("air conditioning", () => {
    // over the low floor (tip d 13.0 - 16.5)
    const [d0, d1] = [13.0 - B0, 16.5 - B0];
    block(m, "roofG", Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C - 0.04, C + 0.16, -0.75, 0.75);
    block(m, "grille", Math.min(X(d0 + 0.4), X(d0 + 1.4)), Math.max(X(d0 + 0.4), X(d0 + 1.4)), C + 0.16, C + 0.17, -0.55, 0.55);
  });
  m.scope("door foot", () => {
    // the door leaves reach down past the skirt's top to the step at 0.5 m
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "doorG", door[0], door[1], 0.5, 0.835, 0.009, 0.01);
      sidePanel(m, b, X, sd, "recess", (door[0] + door[1]) / 2 - 0.008, (door[0] + door[1]) / 2 + 0.008, 0.5, 0.835, 0.013, 0.004);
    }
  });
  m.scope("skirt grille", () => {
    // the engine's air intake on the skirt ahead of the door (tip d 8.0 - 9.5)
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "grille", 8.0 - B0, 9.5 - B0, 0.45, 0.76, 0.004, 0.02);
      for (let k = 1; k < 6; k++) {
        const y = 0.45 + (0.31 * k) / 6;
        sidePanel(m, b, X, sd, "recess", 8.05 - B0, 9.45 - B0, y - 0.008, y + 0.008, 0.008, 0.004);
      }
    }
  });
  if (car.end) m.scope("coupler", () => {
    // the Scharfenberg coupler in the face's recess: its shaft and head reaching to the coupling plane
    const [a, e] = [X(-B0 - REACH + 0.08), X(-B0 + 0.1)];
    block(m, "recess", Math.min(a, e), Math.max(a, e), 0.97, 1.07, -0.07, 0.07);
    const [h0, h1] = [X(-B0 - REACH), X(-B0 - REACH + 0.18)];
    block(m, "grille", Math.min(h0, h1), Math.max(h0, h1), 0.86, 1.18, -0.2, 0.2);
  });
  m.scope("underfloor", () => {
    // the engine and gearbox under the high floor, behind the motor bogie
    block(m, "under", X(car.trucks[0]! + 1.7), X(door[0] - 0.3), 0.3, 0.42, -1.0, 1.0);
  });
}

export const OBB5022: ShinkansenSeries = {
  // the BR 642's body and running gear: 41.7 m over the couplers, 2.83 m wide (de.wikipedia "OBB 5022")
  ...BR642,
  cabFace: FACE,
  fittings: fittings5022,
  liveries: { obb: deliveryLivery(), cityjet: cityjetLivery() },
  // 70.3 t empty; 5022 001 - 020 2 x 315 kW (021 - 060 2 x 335 kW); 120 km/h
  weight: { end: 35, middle: 35 }, power: 315, maxspeed: 120,
};

const P = seriesParams(OBB5022);
export function obb5022(v?: ParamValues): MeshBuilder { return buildSeries(OBB5022, P, v); }
export function obb5022Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(OBB5022, P, v); }
export const OBB5022_DESIGN: ProceduralDesign = seriesDesign("proc-vehicle-obb-5022", "OBB 5022 Desiro", OBB5022, P, obb5022, obb5022Lod, "obb-5022", "uic");
