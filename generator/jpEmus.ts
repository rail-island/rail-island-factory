// Japanese conventional-line electric units on the series kit (shinkansen.ts):
// JR East's E235 (the Yamanote line, 2015) and JNR's 103 series commuter cars
// (1963), Odakyu's Romancecar GSE (2018), Kintetsu's Hinotori (2020), the E259
// Narita Express (2009), JNR's 485 series bonnet-nosed express (1964) and the
// Hankyu 9000 series (2006). Each
// an end car, a middle car and a train of 3 - 8. Their narrow-gauge (1,067 mm)
// bodies keep their real 2.8 - 2.95 m width within the UIC gauge, on the game's
// standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge").
// See docs/models/jp-emus.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { pilotPlate } from "./carbodyKit.ts";
import { centreCoupler } from "./emuParts.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });
/** A flat cab front's mask and three panes across a w-wide end, lamps low at its corners. */
const flatCab = (w: number, y0: number, y1: number, mask: string, lampY: number) => ({
  mask: [y0 - 0.2, y1 + 0.15, mask] as const,
  panes: [[0.25, w - 0.12, y0, y1], [-0.2, 0.2, y0 - 0.25, y1 + 0.05], [-(w - 0.12), -0.25, y0, y1]] as Array<[number, number, number, number]>,
  lamps: [[-(w - 0.3), lampY, 0.08, "lampHead"], [w - 0.3, lampY, 0.08, "lampHead"], [-(w - 0.15), lampY, 0.05, "lampRed"], [w - 0.15, lampY, 0.05, "lampRed"]] as Array<[number, number, number, string]>,
});
const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

// ---------------------------------------------------------------------------
// The E235 (assets/jr-e235/SOURCES.md): published 20.0 m over couplers, bodies 19.57 / 19.5 m,
// 2.95 m wide, 3.62 m high, floor 1.13 m; the sides upright from the waist (no lean), tucked in
// below it. Measured from photo-e235-0.jpg (head-on, 192 px/m across the 2.95 m face) and the
// side photographs (89 px/m at the middle car's near door, 1.3 m wide).

/** A rectangle as a polygon in [lat, y], its top corners rounded (radius r), the bottom square. */
function e235TopRounded(l: number, y0: number, y1: number, r: number): Pt[] {
  const pts: Pt[] = [[-l, y0], [l, y0]];
  for (let i = 0; i <= 3; i++) { const a = (Math.PI / 2) * (i / 3); pts.push([l - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 0; i <= 3; i++) { const a = Math.PI / 2 + (Math.PI / 2) * (i / 3); pts.push([-l + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  return pts;
}

/** The E235 face's halftone: square dots of the lower colour growing downward over the upper one, merging at the foot. */
function e235Dots(l: number, y0: number, y1: number, pitch: number): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const rows = Math.round((y1 - y0) / pitch), cols = Math.floor((2 * l) / pitch);
  const [py, px] = [(y1 - y0) / rows, (2 * l) / cols];
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let k = 0; k < rows; k++) {
    const yc = y1 - py * (k + 0.5), h = 0.5 * py * (0.1 + 0.88 * ((k + 0.5) / rows) ** 1.3);
    for (let j = 0; j < cols; j++) {
      const xc = -l + px * (j + 0.5), w = (h * px) / py;
      out.push({ mat: "dotBottom", fine: 1, pts: [[xc - w, yc - h], [xc + w, yc - h], [xc + w, yc + h], [xc - w, yc + h]] });
    }
  }
  return out;
}

/** The face's black field and the halftone's ground under it: half width, heights. */
const E235_FIELD = { l: 1.37, dots: [1.42, 1.96] as const, top: 3.51 };

/**
 * The E235's cab face (photo-e235-0.jpg head-on, photo-jr-east-kuhae235-1.jpg from the side): an
 * upright face as wide as the body, its plan corners rounded 0.25 m, the lower lip curving back under
 * it and the crown rounding over to the roof. The livery's frame colour wraps round the corners
 * 0.7 m back along the cab sides (the green band down the face's side). Inside the frame one black
 * field from 1.96 m to 3.51 m, its top corners rounded: the destination board and the LED head and
 * tail lamps across its top, under them the one big windscreen (2.17 - 3.19 m) wrapping into the
 * corners; below the field the halftone of square dots grading down into the frame colour (Yamanote:
 * green dots on black; Yokosuka: blue dots on cream). No gangway door: the face is closed.
 */
const E235_FACE: SeriesCabFace = {
  dJoin: 0.7, dSide: 0.55, first: 3.6, roofFrom: 3.7, wrap: true,
  profile: [[0.9, 0.14], [1.0, 0.05], [1.15, 0.01], [1.3, 0], [2.2, 0], [3.0, 0.015], [3.35, 0.045], [3.5, 0.1], [3.57, 0.19], [3.61, 0.36], [3.62, 0.7]],
  corner: [[0.9, 0.2], [1.3, 0.25], [3.35, 0.25], [3.5, 0.2], [3.6, 0.1], [3.62, 0.05]], bulge: 0.05, cols: [8, 4, 1, 1],
  rows: [0.9, 1.0, 1.15, 1.3, 1.42, 1.96, 2.17, 2.7, 3.19, 3.35, 3.51, 3.57, 3.61, 3.62],
  bands: () => [[0, 9, "frame"]],
  // the distant face: the halftone as its two colours, half each
  lodBands: [[0, 1.69, "frame"], [1.69, E235_FIELD.dots[1], "dotTop"], [E235_FIELD.dots[1], E235_FIELD.top, "cabMask"], [E235_FIELD.top, 9, "frame"]],
  fields: [
    { mat: "dotTop", pts: [[-E235_FIELD.l, E235_FIELD.dots[0]], [E235_FIELD.l, E235_FIELD.dots[0]], [E235_FIELD.l, E235_FIELD.dots[1]], [-E235_FIELD.l, E235_FIELD.dots[1]]] },
    { mat: "cabMask", pts: e235TopRounded(E235_FIELD.l, E235_FIELD.dots[1], E235_FIELD.top, 0.2) },
  ],
  decals: e235Dots(E235_FIELD.l - 0.02, E235_FIELD.dots[0], E235_FIELD.dots[1], 0.077),
  // the windscreen, and the destination board over it
  panes: [{ lat: [-1.33, 1.33], y: [2.17, 3.19], r: 0.06, mat: "screen" }, { lat: [-0.53, 0.53], y: [3.24, 3.38], r: 0.02, mat: "destBoard" }],
  // the LED head lamps at the field's top corners, the tail lamps inboard of them
  lamps: [[-0.93, 3.36, 0.065, "lampHead"], [0.93, 3.36, 0.065, "lampHead"], [-0.7, 3.36, 0.05, "lampRed"], [0.7, 3.36, 0.05, "lampRed"]],
  // one parked along the windscreen's foot, the other upright at its right
  wipers: [[[0.2, 2.22], [-0.68, 2.33]], [[0.98, 2.22], [1.28, 2.7]]],
};

/** Door leaves: each 1.3 m double door as two leaves sliding apart, at their centres (d). */
const e235Doors = (centres: readonly number[]): Array<readonly [number, number, number]> => centres.flatMap((d): Array<readonly [number, number, number]> => [[d - 0.65, d, -1], [d, d + 0.65, 1]]);

/**
 * The E235's sides, d behind the body's front end (the face's join on the end car): the doors 4.82 m
 * apart, the outer ones 2.52 m from the body's ends; one big 1.9 m window between doors, a 0.8 m
 * one at each end. The cab car's first door sits 3.6 m ahead of the second (tip-d 3.74 m), a small
 * window between them (photo-jr-east-kuhae235-1.jpg).
 */
const E235_LAYOUT = {
  // the body 18.98 m from the face's join (its tip 0.07 m short of the coupling plane): the rear part 0.1 m longer than the real one's
  end: { doors: e235Doors([3.04, 6.64, 11.56, 16.46]), windows: [[4.44, 5.24], [8.65, 10.55], [13.56, 15.46], [17.93, 18.73]] },
  middle: { doors: e235Doors([2.52, 7.34, 12.16, 16.98]), windows: [[0.25, 1.05], [3.98, 5.88], [8.8, 10.7], [13.62, 15.52], [18.45, 19.25]] },
} as const;

/** The E235's own fittings: the air conditioner, the cab's crew door and antennas, the skirt under the face, the underfloor boxes. */
function e235Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const box = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const C = E235.C, L = car.length, [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("air conditioner", () => {
    // the one roof unit in the middle of the car: a low base and its narrower hood
    box("roofE", L / 2 - 1.9, L / 2 + 1.9, C - 0.05, C + 0.2, -1.0, 1.0);
    box("roofE", L / 2 - 1.75, L / 2 + 1.75, C + 0.2, C + 0.34, -0.85, 0.85);
  });
  m.scope("underfloor", () => {
    // the equipment boxes between the bogies, in three groups
    const [a, e] = [t0 + 1.9, t1 - 1.9], w = (e - a - 0.8) / 3;
    for (let i = 0; i < 3; i++) box("under", a + i * (w + 0.4), a + i * (w + 0.4) + w, E235.B - (i === 1 ? 0.5 : 0.4), E235.B + 0.02, -1.15, 1.15);
  });
  if (!car.end) return;
  const dj = E235_FACE.dJoin, tip = X(-dj), k = Math.sign(tip - X(0));
  m.scope("crew door", () => {
    // the stainless cab door behind the cab window (tip-d 1.62 - 2.27 m), its outline
    const [d0, d1, y0, y1, q] = [1.62 - dj, 2.27 - dj, 1.15, 3.0, 0.02];
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "rubber", d0, d0 + q, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d1 - q, d1, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + q, d1 - q, y0, y0 + q, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + q, d1 - q, y1 - q, y1, 0.006, 0.02);
    }
  });
  m.scope("antennas", () => {
    for (const [d, z] of [[0.9, 0.35], [2.3, -0.3]] as const) box("under", d - 0.04, d + 0.04, C - 0.05, C + 0.3, z - 0.04, z + 0.04);
  });
  m.scope("skirt", () => {
    // the deflector under the face: its plate 0.2 m behind the tip, from 0.15 m to 0.66 m over the rail
    pilotPlate(m, "skirtG", k, k * (tip - k * 0.2), 0.15, 0.66, 1.24, 0.08, 0.45);
    // its cheeks running back to the leading bogie (tip-d 1.3 m)
    box("skirtG", -dj + 0.6, 1.3 - dj, 0.22, 0.6, -1.2, 1.2);
    // the dark gear between it and the body
    box("under", -dj + 0.62, 2.0, 0.62, E235.B + 0.02, -1.1, 1.1);
  });
  // the series kit leaves a cab face without a coupler: the E235's stands out under the face, its head at the coupling plane
  m.scope("coupler", () => centreCoupler(m, k, tip - k * 1.0, tip + k * 0.07, E235.couplerY!, "knuckle"));
}

/** Both liveries' stainless, black, glass and grey paints. */
const E235_PALETTE = {
  ss: c("#c3c7ca", 0.3), mask: c("#1d1f22", 0.3), cabMask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), roofE: c("#a9aeb2", 0.5), skirtG: c("#55595e", 0.7),
  // the windscreen lighter than the black field round it (the cab behind it), the destination board darker
  screen: { color: "#3a4a5a", metallic: 0.25, roughness: 0.1, glass: true }, destBoard: { color: "#121416", metallic: 0.2, roughness: 0.15, glass: true },
};
/** The JR emblem on the cab side under the eaves, over the crew door (tip-d 1.75 m). */
const E235_JR = [{ text: "JR", d: 1.05, y: 3.05, h: 0.2, mat: "lettering" }];

export const E235: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.475, Y: 1.8, S: 3.34, C: 3.62, lean: 1, B: 0.9, A: 1.0,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: E235_FACE,
  windows: [[2.0, 2.9]], windowW: 1.9, pitch: 4.82, door: [1.15, 2.95, 1.94, 2.86], doorW: 1.3, doorCount: 4, doorGlassW: 0.37,
  layout: E235_LAYOUT,
  // the cab side window (tip-d 0.66 - 1.48 m) and the crew door's window
  cabWindows: [[0.66 - E235_FACE.dJoin, 1.48 - E235_FACE.dJoin, 2.35, 3.05], [1.775 - E235_FACE.dJoin, 2.115 - E235_FACE.dJoin, 2.11, 2.88]],
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, couplerY: 0.85,
  // the end car's bogies centred on its 19.5 m body (tip-d 2.88 and 16.68 m), the middle car's on its own
  endBogies: [2.18, 15.98], centredBogies: true, pantographAt: 16.3,
  numberAt: [-4.0, 1.5, 0.08],
  liveries: {
    // stainless; the uguisu green on the doors, over them under the eaves and round the face
    yamanote: {
      title: "Yamanote green", palette: { ...E235_PALETTE, green: c("#8cc63f"), frame: c("#8cc63f"), dotTop: c("#1d1f22", 0.3), dotBottom: c("#8cc63f") },
      bands: [[0, 9, "ss"]], doors: [[0, 9, "green"]], overDoors: [[3.02, 3.3, "green"]], roof: "roofG", skirt: "ss", number: "TOU-01", endLettering: E235_JR,
    },
    // E235-1000: the cream-over-blue stripes under the windows and under the eaves, plain doors, the blue face
    yokosuka: {
      title: "Yokosuka blue", palette: { ...E235_PALETTE, blue: c("#1d3d9c"), cream: c("#e9dfc0"), frame: c("#1d3d9c"), dotTop: c("#e9dfc0"), dotBottom: c("#1d3d9c") },
      bands: [[0, 1.72, "ss"], [1.72, 1.86, "blue"], [1.86, 1.98, "cream"], [1.98, 3.06, "ss"], [3.06, 3.18, "cream"], [3.18, 3.32, "blue"], [3.32, 9, "ss"]], doors: [[0, 9, "ss"]], roof: "roofG", skirt: "ss", number: "F-01", endLettering: E235_JR,
    },
  },
  weight: { end: 28, middle: 33 }, power: 560, maxspeed: 120, fittings: e235Fittings,
};

export const S103: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.416, Y: 1.35, S: 3.2, C: 3.65, lean: 0.985, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.416, 2.0, 2.75, "cabMask", 1.55),
  windows: [[1.95, 2.75]], windowW: 1.0, pitch: 1.2, door: [1.15, 3.0, 1.95, 2.7], doorW: 1.3, doorCount: 4,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  liveries: {
    chuo: { title: "Chuo orange", palette: { body: c("#f15a22", 0.45), cabMask: c("#f15a22", 0.45), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "body"]], roof: "roofG", skirt: "skirtG", number: "KUHA 103-1" },
    yamanote: { title: "Yamanote green", palette: { body: c("#9acd32", 0.45), cabMask: c("#9acd32", 0.45), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "body"]], roof: "roofG", skirt: "skirtG", number: "KUHA 103-271" },
  },
  weight: { end: 30, middle: 40 }, power: 440, maxspeed: 100,
};

export const GSE: ShinkansenSeries = {
  endLength: 19.6, midLength: 16.0, W: 1.45, Y: 1.25, S: 3.0, C: 3.55, lean: 0.96, B: 0.9, A: 1.05,
  // the observation front: a long rounded nose of glass, the driver's cab over the saloon
  nose: nose(3.2, 0.25, 2.4, [[0, 1.5], [0.4, 2.2], [1.6, 3.0], [2.8, 3.45], [3.6, 3.55]], [[0, 1.45], [0.4, 2.05], [1.6, 2.7], [2.8, 2.95], [3.6, 3.0]], [[0, 1.35], [1.0, 1.25]], [[0, 1.25], [1.0, 1.05]], [[0, 1.2], [0.5, 0.9]]),
  windscreen: [0.45, 2.7, 0.07, 1.25], lamps: [0.5, 1.45],
  windows: [[1.85, 2.75]], windowW: 1.6, pitch: 1.95, door: [1.15, 3.0, 1.85, 2.6], doorW: 0.9,
  bogieCentres: 9.5, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    rose: { title: "Rose vermilion", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#c8102e") }, bands: [[0, 1.6, "red"], [1.6, 1.68, "white"], [1.68, 9, "red"]], roof: "red", skirt: "skirtG", number: "70051" },
    lse: { title: "LSE colours", palette: { orange: c("#e86a1f"), grey: c("#7d8084"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#7d8084") }, bands: [[0, 1.6, "grey"], [1.6, 1.7, "white"], [1.7, 2.8, "orange"], [2.8, 2.86, "white"], [2.86, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "7001" },
  },
  weight: { end: 36, middle: 30 }, power: 380, maxspeed: 110,
};

export const HINOTORI: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.4, Y: 1.25, S: 3.0, C: 3.68, lean: 0.95, B: 0.95, A: 1.05,
  // the metallic red nose leaning out under its big curved windscreen
  nose: nose(2.6, 0.2, 2.2, [[0, 1.6], [0.3, 2.2], [1.4, 3.0], [2.4, 3.5], [3.0, 3.68]], [[0, 1.55], [0.3, 2.05], [1.4, 2.7], [2.4, 2.95], [3.0, 3.0]], [[0, 1.4], [1.0, 1.25]], [[0, 1.3], [0.8, 1.05]], [[0, 1.25], [0.4, 0.95]]),
  windscreen: [0.35, 2.3, 0.07, 1.15], lamps: [0.45, 1.5],
  windows: [[1.8, 2.8]], windowW: 1.5, pitch: 1.85, door: [1.15, 3.0, 1.85, 2.6], doorW: 0.9,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    hinotori: { title: "Hinotori red", palette: { red: c("#8e1b22", 0.25), gold: c("#c9a55a", 0.3), roofG: c("#8e1b22", 0.4), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "red"], [1.5, 1.54, "gold"], [1.54, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "HV01" },
    ace: { title: "Ace orange", palette: { orange: c("#e46c1d"), navy: c("#1d2a4a"), white: c("#efefea"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "navy"], [1.5, 1.56, "white"], [1.56, 2.9, "orange"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "HV02" },
  },
  weight: { end: 46, middle: 44 }, power: 300, maxspeed: 130,
};

export const E259: ShinkansenSeries = {
  endLength: 20.5, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.1, C: 3.65, lean: 0.97, B: 0.95, A: 1.1,
  // the raked nose, its gangway door, the cab windows wrapping round
  nose: nose(2.2, 0.45, 2.6, [[0, 2.2], [0.4, 2.85], [1.4, 3.35], [2.2, 3.65]], [[0, 2.15], [0.4, 2.7], [1.4, 3.0], [2.2, 3.1]], [[0, 1.6], [0.8, 1.3]], [[0, 1.3], [0.6, 1.1]], [[0, 1.2], [0.3, 0.95]]),
  windscreen: [0.15, 1.6, 0.07, 1.25], lamps: [0.25, 1.6],
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.75, door: [1.15, 3.0, 1.9, 2.6], doorW: 1.0,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    nex: { title: "Narita Express", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "grey"], [1.5, 1.62, "red"], [1.62, 1.8, "white"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-1" },
    original: { title: "NEX 2009", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.6, "white"], [1.6, 1.8, "red"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-2" },
  },
  weight: { end: 44, middle: 41 }, power: 540, maxspeed: 130,
};

export const S485: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.45, Y: 1.35, S: 3.25, C: 3.9, lean: 0.97, B: 1.0, A: 1.1,
  // the bonnet nose: a rounded hood ahead of the raised cab, its headlight on top
  nose: nose(2.4, 0.3, 2.3, [[0, 1.9], [0.3, 2.25], [1.2, 2.45], [2.1, 2.55], [2.35, 3.25], [2.9, 3.7], [3.4, 3.9]], [[0, 1.85], [0.3, 2.1], [1.2, 2.3], [2.1, 2.4], [2.6, 3.1], [3.4, 3.25]], [[0, 1.6], [1.0, 1.4]], [[0, 1.4], [0.6, 1.1]], [[0, 1.3], [0.4, 1.0]]),
  windscreen: [2.4, 3.0, 0.07, 1.1], lamps: [0.6, 1.95],
  windows: [[1.9, 2.75]], windowW: 1.0, pitch: 1.2, door: [1.15, 3.0, 1.95, 2.6], doorW: 0.7,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  liveries: {
    jnr: { title: "JNR express", palette: { cream: c("#efe3c2"), red: c("#b5202b"), roofG: c("#7d8084", 0.6), skirtG: c("#b5202b") }, bands: [[0, 1.45, "red"], [1.45, 1.92, "cream"], [1.92, 2.75, "red"], [2.75, 9, "cream"]], roof: "cream", skirt: "skirtG", number: "KUHA 481-1" },
    kyushu: { title: "JR Kyushu red", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#7d8084", 0.6), skirtG: c("#3a3b3d") }, bands: [[0, 1.45, "white"], [1.45, 9, "red"]], roof: "red", skirt: "skirtG", number: "KUHA 481-201" },
  },
  weight: { end: 41, middle: 44 }, power: 480, maxspeed: 120,
};

export const HANKYU9000: ShinkansenSeries = {
  endLength: 19.0, midLength: 19.0, W: 1.375, Y: 1.3, S: 3.2, C: 3.65, lean: 0.985, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.375, 1.95, 2.8, "cabMask", 1.4),
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.15, 3.0, 1.95, 2.7], doorW: 1.3, doorCount: 3,
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    maroon: { title: "Hankyu maroon", palette: { maroon: c("#5a1418", 0.3), ivory: c("#e8e0c8"), cabMask: c("#5a1418", 0.3), roofG: c("#e8e0c8", 0.5), skirtG: c("#2a2c2f") }, bands: [[0, 3.05, "maroon"], [3.05, 9, "ivory"]], roof: "roofG", skirt: "skirtG", number: "9000" },
    allMaroon: { title: "Plain maroon", palette: { maroon: c("#5a1418", 0.3), cabMask: c("#5a1418", 0.3), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9300" },
  },
  weight: { end: 32, middle: 36 }, power: 600, maxspeed: 115,
};

const P = { e235: seriesParams(E235), s103: seriesParams(S103), gse: seriesParams(GSE), hinotori: seriesParams(HINOTORI), e259: seriesParams(E259), s485: seriesParams(S485), hankyu: seriesParams(HANKYU9000) };

export function jrE235(v?: ParamValues): MeshBuilder { return buildSeries(E235, P.e235, v); }
export function jrE235Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E235, P.e235, v); }
export function jnr103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function jnr103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function odakyuGse(v?: ParamValues): MeshBuilder { return buildSeries(GSE, P.gse, v); }
export function odakyuGseLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GSE, P.gse, v); }
export function kintetsuHinotori(v?: ParamValues): MeshBuilder { return buildSeries(HINOTORI, P.hinotori, v); }
export function kintetsuHinotoriLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HINOTORI, P.hinotori, v); }
export function jrE259(v?: ParamValues): MeshBuilder { return buildSeries(E259, P.e259, v); }
export function jrE259Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E259, P.e259, v); }
export function jnr485(v?: ParamValues): MeshBuilder { return buildSeries(S485, P.s485, v); }
export function jnr485Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S485, P.s485, v); }

export function hankyu9000(v?: ParamValues): MeshBuilder { return buildSeries(HANKYU9000, P.hankyu, v); }
export function hankyu9000Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HANKYU9000, P.hankyu, v); }

export const JP_EMU_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-jr-e235": E235, "proc-vehicle-jnr-103": S103, "proc-vehicle-odakyu-gse": GSE,
  "proc-vehicle-kintetsu-hinotori": HINOTORI, "proc-vehicle-jr-e259": E259, "proc-vehicle-jnr-485": S485, "proc-vehicle-hankyu-9000": HANKYU9000,
};

export const JP_EMUS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-jr-e235", "JR E235", E235, P.e235, jrE235, jrE235Lod, "jr-e235", "uic"),
  seriesDesign("proc-vehicle-jnr-103", "JNR 103 series", S103, P.s103, jnr103, jnr103Lod, "jnr-103", "uic"),
  seriesDesign("proc-vehicle-odakyu-gse", "Odakyu Romancecar GSE", GSE, P.gse, odakyuGse, odakyuGseLod, "odakyu-gse", "uic"),
  seriesDesign("proc-vehicle-kintetsu-hinotori", "Kintetsu Hinotori", HINOTORI, P.hinotori, kintetsuHinotori, kintetsuHinotoriLod, "kintetsu-hinotori", "uic"),
  seriesDesign("proc-vehicle-jr-e259", "JR E259 Narita Express", E259, P.e259, jrE259, jrE259Lod, "jr-e259", "uic"),
  seriesDesign("proc-vehicle-jnr-485", "JNR 485 series", S485, P.s485, jnr485, jnr485Lod, "jnr-485", "uic"),
  seriesDesign("proc-vehicle-hankyu-9000", "Hankyu 9000 series", HANKYU9000, P.hankyu, hankyu9000, hankyu9000Lod, "hankyu-9000", "uic"),
];
