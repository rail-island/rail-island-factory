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

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });
/** A flat cab front's mask and three panes across a w-wide end, lamps low at its corners. */
const flatCab = (w: number, y0: number, y1: number, mask: string, lampY: number) => ({
  mask: [y0 - 0.2, y1 + 0.15, mask] as const,
  panes: [[0.25, w - 0.12, y0, y1], [-0.2, 0.2, y0 - 0.25, y1 + 0.05], [-(w - 0.12), -0.25, y0, y1]] as Array<[number, number, number, number]>,
  lamps: [[-(w - 0.3), lampY, 0.08, "lampHead"], [w - 0.3, lampY, 0.08, "lampHead"], [-(w - 0.15), lampY, 0.05, "lampRed"], [w - 0.15, lampY, 0.05, "lampRed"]] as Array<[number, number, number, string]>,
});
const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

export const E235: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.2, C: 3.62, lean: 0.98, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.475, 1.95, 2.85, "mask", 1.45),
  windows: [[1.95, 2.75]], windowW: 1.1, pitch: 1.35, door: [1.15, 3.05, 1.95, 2.7], doorW: 1.3, doorCount: 4,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    yamanote: { title: "Yamanote green", palette: { ss: c("#c5c9cc", 0.3), green: c("#9acd32"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.24, "green"], [1.24, 2.9, "ss"], [2.9, 3.0, "green"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "TOU-01" },
    yokosuka: { title: "Yokosuka blue", palette: { ss: c("#c5c9cc", 0.3), blue: c("#1d3f80"), cream: c("#e5d9b6"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.2, "cream"], [1.2, 1.3, "blue"], [1.3, 2.9, "ss"], [2.9, 3.0, "blue"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "F-01" },
  },
  weight: { end: 28, middle: 33 }, power: 560, maxspeed: 120,
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

// --- Hankyu 9000 series (HANKYU9000) ---------------------------------------
// The 2006 Kobe / Takarazuka line set from photographs (assets/hankyu-9000/SOURCES.md): the glossy
// Hankyu maroon body under the ivory roof (its colour from the shoulder up, over the eaves), the
// slightly raked cab face with its two big round-cornered windscreens and the gangway door between
// them in a stainless frame running up into the headlight box under the roof, the rectangular
// tail and marker lamp boxes low in the face with chrome strips under them, the pale grey skirt
// round the coupler; on the sides three double doors 5.75 m apart, one big window between them and
// a smaller one at each end. Lateral positions on the face are seen from ahead (the viewer's right
// positive), heights over the rail: measured on the head-on photograph of 9002 (photo-hankyu-9002f.jpg,
// 197 px/m upright from the face's foot at 1.0 m to its top at 3.65 m, 190 px/m across) and along
// the side of 9000 (photo-hankyu-series9000-9000.jpg, a projective fit over its body ends and doors).

import type { SeriesCabFace as HkCabFace } from "./seriesCab.ts";
import { sidePanel as hkPanel, type SliceBody as HkBody } from "./sliceBody.ts";
import { block as hkBlock } from "./vehicleParts.ts";
import { centreCoupler as hkCoupler } from "./emuParts.ts";

/** Where the face meets the body's own section, behind its tip; the coupling plane ahead of the tip. */
const HK_JOIN = 0.45;
const HK_REACH = 0.12;
/** The door pitch (5.75 m) and the door centres: the end car's d behind its face's tip, an intermediate car's d behind its body's end. */
const HK_PITCH = 5.75;
const HK_END_DOORS = [0, 1, 2].map((i) => 3.65 + HK_PITCH * i);
const HK_MID_DOORS = [0, 1, 2].map((i) => 3.5 + HK_PITCH * i);
/** The end car's raised pantograph, d behind its body's front (tip-d 15.6 m, over the inner bogie: photo-hankyu-9100.jpg). */
const HK_PANTO = 15.6 - HK_JOIN;

/** One side's windows from its door centres: a 2.8 m two-pane window between doors (a mullion at its middle), a 1.5 m one at a plain end, a narrow one behind the cab. */
function hkWindows(doors: readonly number[], end: "cab" | "plain", L: number): Array<[number, number]> {
  const out: Array<[number, number]> = [end === "cab" ? [1.75, 2.3] : [0.4, 1.9]];
  for (let i = 0; i + 1 < doors.length; i++) { const c = (doors[i]! + doors[i + 1]!) / 2; out.push([c - 1.4, c + 1.4]); }
  out.push([L - 1.9, L - 0.4]);
  return out;
}

/** The end car's body from its face's tip to its inner end (19.0 m over the couplers). */
const HK_END_L = 19.0 - 0.25 - HK_REACH;
const HK_LAYOUT = {
  end: {
    doors: HK_END_DOORS.map((c, i): [number, number, number] => [c - 0.65 - HK_JOIN, c + 0.65 - HK_JOIN, i % 2 ? -1 : 1]),
    windows: hkWindows(HK_END_DOORS, "cab", HK_END_L).map(([a, b]): [number, number] => [a - HK_JOIN, b - HK_JOIN]),
  },
  middle: {
    doors: HK_MID_DOORS.map((c, i): [number, number, number] => [c - 0.65, c + 0.65, i % 2 ? -1 : 1]),
    windows: hkWindows(HK_MID_DOORS, "plain", 18.5),
  },
};

/** A rect on the face and its mirror across the centre line. */
const hkPair = (l0: number, l1: number, y0: number, y1: number, r: number, mat?: string) =>
  [{ lat: [-l1, -l0] as [number, number], y: [y0, y1] as [number, number], r, ...(mat ? { mat } : {}) }, { lat: [l0, l1] as [number, number], y: [y0, y1] as [number, number], r, ...(mat ? { mat } : {}) }];

/** The 9000's cab face (photo-hankyu-9002f.jpg head-on, photo-hankyu-9100.jpg and the side photographs for the rake and the corners). */
const HK_FACE: HkCabFace = {
  dJoin: HK_JOIN, dSide: 0.3, reach: HK_REACH, first: 3.0, roofFrom: 3.6,
  // upright at the lamps, leaning back 8 cm up the windscreens, the forehead rounding over into the roof
  profile: [[1.0, 0.03], [1.12, 0], [1.9, 0], [3.0, 0.05], [3.35, 0.09], [3.48, 0.14], [3.56, 0.21], [3.62, 0.31], [3.65, HK_JOIN]],
  // the plan's corners rounded 0.22 m and swept 0.3 m back; the face bowed 5 cm
  corner: [[1.0, 0.2], [3.35, 0.22], [3.5, 0.18], [3.62, 0.1], [3.65, 0.05]], cornerDepth: [[1.0, 0.3], [3.35, 0.32], [3.55, 0.24], [3.65, 0.08]], bulge: 0.05,
  cols: [8, 4, 1, 1],
  rows: [1.0, 1.08, 1.17, 1.37, 1.56, 1.76, 1.9, 2.4, 2.92, 3.03, 3.3, 3.41, 3.48, 3.56, 3.6, 3.62, 3.65],
  bands: () => [[0, 9, "maroon"]],
  masks: [
    // the stainless frame of the gangway door, from the chrome strips' height up into the roof
    { lat: [-0.44, 0.44], y: [1.08, 3.7], r: 0.03, mat: "stainless" },
    // the gangway door's maroon leaf and the white frame of its window
    { lat: [-0.37, 0.37], y: [1.17, 3.03], r: 0.05, mat: "maroon" },
    { lat: [-0.31, 0.31], y: [1.73, 2.95], r: 0.07, mat: "frameW" },
    // the windscreens' white frames
    ...hkPair(0.46, 1.27, 1.9, 3.41, 0.15, "frameW"),
    // the headlight box over the door: its bright surround and the dark recess
    { lat: [-0.31, 0.31], y: [3.3, 3.56], r: 0.06, mat: "frameW" },
    { lat: [-0.27, 0.27], y: [3.33, 3.53], r: 0.05, mat: "lampBox" },
    // the tail and marker lamp boxes, their bright rims
    ...hkPair(0.64, 1.08, 1.37, 1.56, 0.035, "frameW"),
    ...hkPair(0.67, 1.05, 1.4, 1.53, 0.025, "lampBox"),
    // the lamp boxes' lenses (painted here, not panes, so that the distant face's glass stays above them):
    // the red tail lamp outboard, the white marker lamp inboard
    ...hkPair(0.87, 1.02, 1.43, 1.5, 0.01, "lampRed"),
    ...hkPair(0.7, 0.85, 1.43, 1.5, 0.01, "lampHead"),
    // the thin bright strips under the windscreens
    ...hkPair(0.52, 1.16, 1.835, 1.852, 0.0, "frameW"),
  ],
  panes: [
    ...hkPair(0.49, 1.24, 1.93, 3.38, 0.13),
    { lat: [-0.28, 0.28], y: [1.76, 2.92], r: 0.05 },
    // the destination board (left) and the train type board (right) behind the windscreens' heads
    ...hkPair(0.64, 1.08, 3.06, 3.25, 0.02, "destBoard"),
  ],
  // the four LED headlights in the box, in two pairs
  lamps: [[-0.185, 3.43, 0.045, "lampHead"], [-0.095, 3.43, 0.045, "lampHead"], [0.095, 3.43, 0.045, "lampHead"], [0.185, 3.43, 0.045, "lampHead"]],
  pods: [
    // the chrome strips across the face's foot either side of the door
    { lat: -0.84, y: 1.115, w: 0.62, h: 0.05, r: 0.015, proud: 0.03, depth: 0.02, mat: "chrome" },
    { lat: 0.84, y: 1.115, w: 0.62, h: 0.05, r: 0.015, proud: 0.03, depth: 0.02, mat: "chrome" },
  ],
  texts: [{ text: "9000", lat: -0.85, y: 1.64, h: 0.13, mat: "numberW" }],
  // one parked on each windscreen and one on the door's window
  wipers: [[[0.92, 1.99], [0.64, 2.6]], [[-0.92, 1.99], [-1.2, 2.6]], [[0.2, 2.86], [0.02, 2.3]]],
};

/** The 9000's fittings: the skirt and coupler under the face, the crew door, the window frames, the side destination boards, the roof cover and the underfloor boxes. */
function hkFittings(m: MeshBuilder, b: HkBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const box = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => hkBlock(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const L = car.length, C = HANKYU9000.C, [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => {
    // the equipment boxes between the bogies, in four groups
    const [a, e] = [t0 + 1.9, t1 - 1.9], w = (e - a - 1.2) / 4;
    for (let i = 0; i < 4; i++) m.scope(`box ${i + 1}`, () => box("under", a + i * (w + 0.4), a + i * (w + 0.4) + w, HANKYU9000.B - (i % 2 ? 0.55 : 0.45), HANKYU9000.B + 0.02, -1.15, 1.15));
  });
  m.scope("roof cover", () => {
    // the long low cover over the air conditioning along the crown, its edges chamfered
    // on an end car it stops short of the pantograph's base over the rear bogie
    const j = car.end ? HK_JOIN : 0, [d0, d1] = [car.end ? 1.6 - j : 1.2, car.end ? HK_PANTO - 1.75 : L - 1.2];
    const sec: Array<[number, number]> = [[-0.9, C - 0.12], [0.9, C - 0.12], [0.9, C + 0.02], [0.75, C + 0.07], [-0.75, C + 0.07], [-0.9, C + 0.02]];
    m.sweep("roofCover", "x", sec, X(d1), sec, X(d0));
    // its louvres either side
    for (const d of [0.3, 0.7]) for (const z of [1, -1]) box("louvre", d0 + (d1 - d0) * d - 0.5, d0 + (d1 - d0) * d + 0.5, C - 0.06, C + 0.015, z > 0 ? 0.9 : -0.912, z > 0 ? 0.912 : -0.9);
  });
  const rows = car.end ? HK_LAYOUT.end.windows : HK_LAYOUT.middle.windows;
  const [w0, w1] = HANKYU9000.windows[0]!;
  m.scope("window frames", () => {
    // the bright aluminium frames round every window
    for (const sd of [1, -1]) for (const [a, e] of rows)
      for (const [p, q, y0, y1] of [[a, e, w0, w0 + 0.05], [a, e, w1 - 0.05, w1], [a, a + 0.05, w0 + 0.05, w1 - 0.05], [e - 0.05, e, w0 + 0.05, w1 - 0.05], ...(e - a > 2 ? [[(a + e) / 2 - 0.025, (a + e) / 2 + 0.025, w0 + 0.05, w1 - 0.05]] : [])] as const)
        hkPanel(m, b, X, sd, "frameW", p, q, y0, y1, 0.016, 0.006);
  });
  m.scope("destination boards", () => {
    // the small LED boards under the eaves over the window behind the middle door
    const c = (rows[2]![0] + rows[2]![1]) / 2;
    for (const sd of [1, -1]) { hkPanel(m, b, X, sd, "lampBox", c - 0.55, c + 0.05, 2.96, 3.14, 0.012, 0.004); hkPanel(m, b, X, sd, "lampBox", c + 0.2, c + 0.45, 2.96, 3.14, 0.012, 0.004); }
  });
  if (!car.end) return;
  const dj = HK_JOIN, tip = X(-dj), k = Math.sign(tip - X(0));
  m.scope("crew door", () => {
    // the crew door behind the cab (tip-d 0.65 - 1.3 m), its outline and the two grab rails beside it
    const [d0, d1, y0, y1, q] = [0.65 - dj, 1.3 - dj, 1.15, 3.0, 0.02];
    for (const sd of [1, -1]) {
      for (const [a, e, p, r] of [[d0, d0 + q, y0, y1], [d1 - q, d1, y0, y1], [d0 + q, d1 - q, y1 - q, y1], [d0 + q, d1 - q, y0, y0 + q]] as const) hkPanel(m, b, X, sd, "rubber", a, e, p, r, 0.006, 0.02);
      for (const d of [d0 - 0.1, d1 + 0.08]) hkPanel(m, b, X, sd, "chrome", d - 0.015, d + 0.015, 1.45, 2.7, 0.022, 0.01);
    }
  });
  m.scope("skirt", () => {
    // the pale grey skirt under the face: a bar across under the coupler and two cheeks either side of it,
    // their outer ends turning back round the corners
    const f = tip - k * 0.04, plate = (y0: number, y1: number, z0: number, z1: number, back0 = 0, back1 = 0) => {
      const sec = (bk: number): Array<[number, number]> => (k > 0
        ? [[f - bk - 0.35, y0], [f - bk - 0.06, y0], [f - bk, y1], [f - bk - 0.35, y1]]
        : [[f + bk + 0.35, y0], [f + bk + 0.35, y1], [f + bk, y1], [f + bk + 0.06, y0]]);
      m.sweep("skirtL", "z", sec(back0), z0, sec(back1), z1);
    };
    plate(0.28, 0.45, -0.62, 0.62);
    for (const sd of [1, -1]) {
      const [a, e] = sd > 0 ? [0.62, 1.18] : [-1.18, -0.62];
      plate(0.28, 1.0, a, e);
      // the corner: back 0.3 m over the last 0.14 m
      if (sd > 0) plate(0.28, 1.0, 1.18, 1.32, 0, 0.3); else plate(0.28, 1.0, -1.32, -1.18, 0.3, 0);
    }
    // the dark gear behind the skirt over the coupler
    box("under", -dj + 0.55, 1.9 - dj, 0.45, HANKYU9000.B + 0.01, -0.6, 0.6);
  });
  // the tight-lock coupler under the face, its head at the coupling plane
  m.scope("coupler", () => hkCoupler(m, k, tip - k * 1.0, tip + k * HK_REACH, HANKYU9000.couplerY!, "couplerG"));
}

/** Both liveries' face, frame, lamp and fitting paints. */
const hkPalette = (roof: string) => ({
  maroon: c("#561520", 0.25), cabMask: c("#561520", 0.25), roofG: c(roof, 0.5), skirtG: c("#561520", 0.25),
  stainless: { color: "#a6a39a", metallic: 0.7, roughness: 0.3 }, chrome: { color: "#d6d7d8", metallic: 0.85, roughness: 0.2 },
  frameW: c("#e4e3dc", 0.35), lampBox: c("#202225", 0.4), numberW: c("#eeeeea", 0.4), skirtL: c("#c4c6c8", 0.5),
  roofCover: c(roof, 0.55), louvre: c("#6b6e72", 0.6), couplerG: c("#8d8f91", 0.5),
  destBoard: { color: "#121416", metallic: 0.2, roughness: 0.15, glass: true },
});

export const HANKYU9000: ShinkansenSeries = {
  // 19.0 m over the couplers, 2.75 m wide, the roof 3.65 m over the rail (Wikipedia "Hankyu 9000 series");
  // the sides upright, the ivory roof from the shoulder at 3.22 m
  endLength: 19.0, midLength: 19.0, W: 1.375, Y: 1.2, S: 3.22, C: 3.65, lean: 0.99, B: 1.0, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: HK_FACE, layout: HK_LAYOUT, couplerY: 0.88,
  windows: [[1.94, 2.91]], windowW: 2.8, pitch: HK_PITCH, door: [1.15, 3.0, 1.85, 2.88], doorW: 1.3, doorCount: 3, doorGlassW: 0.34, doorGlassPair: 0.62,
  // the bogies 13.0 m apart, centred on the body
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.1,
  endBogies: [2.825 - HK_JOIN, 15.825 - HK_JOIN], midBogies: [2.75, 15.75], fittings: hkFittings,
  // the single-arm pantographs on the end cars (9000, 9100) over their inner bogies, both raised; the intermediate cars have none
  endPantograph: true, pantographAt: HK_PANTO,
  liveries: {
    maroon: { title: "Hankyu maroon", palette: hkPalette("#e6dfca"), bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9000" },
    allMaroon: { title: "Plain maroon", palette: hkPalette("#7d8084"), bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9300" },
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
