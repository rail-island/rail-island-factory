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
import type { SliceBody } from "./sliceBody.ts";
import { loftHalves } from "./sliceLoft.ts";
import { block } from "./vehicleParts.ts";

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

// --- Odakyu 70000 "GSE" (assets/odakyu-gse/; docs/models/jp-emus.md, "The GSE") ---------------
// Published (ja.wikipedia, SUBWAY 2018/5): 21.3 m end and 20.0 m intermediate cars on their own
// bogies (not articulated), 2,878 mm wide, roof 3,700 mm, 4,057 mm over the raised cab, floor
// 1,150 mm, side windows 1.0 m tall, 860 mm wheels, 2.1 m wheelbase. Heights and the nose's
// profile measured on the near side view at Odawara (81.8 px/m: the 1.0 m windows, 4.057 m over the
// cab), the plan and face widths on the head-on view at Shinjuku (211 px/m: the 2.878 m width).

/** The tip-to-body join of the GSE's face: the face runs from the bumper up to the band under the cab dome. */
const GSE_JOIN = 3.9;
/** The end car's body length behind the join (21.3 m less the face, its 2 cm reach to the coupling plane and the 0.25 m coupling gap). */
const GSE_END = 21.3 - GSE_JOIN - 0.02 - 0.25;
/** The silver pillars beside the observation windscreen, [y, d behind the tip]: they run from the bumper's top up and back to the cab. */
const GSE_PILLAR_FRONT: Pt[] = [[1.74, 0.7], [3.07, 2.3]];
const GSE_PILLAR_BACK: Pt[] = [[1.74, 1.1], [3.07, 3.03]];

/**
 * The observation end: a blunt bumper (its most forward point 1.11 m up, raked back to 0.45 m and to
 * 1.64 m), the saloon's windscreen raked 42 degrees from 1.74 m (0.5 m behind the tip) up to 3.03 m
 * (1.7 m behind), the red band over it whose top slopes back to 3.39 m at 2.5 m, where the cab dome
 * (gseFittings) stands; nearly flat in plan with 0.3 m corners. The windscreen glass wraps round the
 * corners to the silver pillars.
 */
const GSE_FACE: SeriesCabFace = {
  dJoin: GSE_JOIN, dSide: 1.4, first: 4.2, reach: 0.02, roofFrom: 3.47, cols: [8, 5, 1, 2], tolerance: 0.02,
  // under the dome the face's top runs nearly level back to 3.6 m and only then rises to the roof's
  // crown, inside the dome, so that the dome stands clear of it seen from ahead
  profile: [[0.2, 0.9], [0.45, 0.78], [0.48, 0.42], [0.61, 0.25], [0.86, 0.1], [1.11, 0], [1.4, 0.12], [1.64, 0.32], [1.74, 0.52], [3.03, 1.7], [3.18, 1.8], [3.3, 1.98], [3.39, 2.5], [3.42, 3.4], [3.55, 3.75], [3.7, GSE_JOIN]],
  // the lower bumper and the chin narrower than the body (the head-on view: 2.28 m at 0.5 m)
  corner: [[0.2, 0.5], [0.48, 0.45], [0.86, 0.32], [1.11, 0.3], [1.74, 0.3], [3.03, 0.45], [3.3, 0.4], [3.42, 0.3], [3.6, 0.15], [3.7, 0.03]],
  cornerRatio: [[0.2, 1.3], [1.74, 1.3], [3.03, 1.7], [3.42, 1.4], [3.7, 1.0]],
  bulge: [[0.2, 0.1], [1.11, 0.12], [1.74, 0.06], [3.7, 0.02]],
  rows: [0.2, 0.45, 0.48, 0.61, 0.86, 1.11, 1.4, 1.64, 1.7, 1.74, 1.76, 2.1, 2.5, 2.8, 3.03, 3.07, 3.14, 3.18, 3.28, 3.3, 3.39, 3.42, 3.45, 3.47, 3.55, 3.7],
  bands: (l) => [[0, 0.45, "skirtG"], [0.45, 9, l.bands.find(([, top]) => top > 1.0)![2]]],
  paint: [
    // the body's colour down to 0.45 m on the nose's sides (the underframe cover starts behind the leading bogie)
    { mat: "gseBody", front: [[0.45, -9], [0.86, -9]], back: [[0.45, 99], [0.86, 99]] },
    // the windscreen wrapping round the corners ahead of the pillars, and the pillars
    { mat: "cabGlass", front: [[1.74, -9], [3.07, -9]], back: GSE_PILLAR_FRONT },
    { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
  ],
  panes: [{ lat: [-1.17, 1.17], y: [1.76, 3.03], r: 0.08, mat: "cabGlass" }],
  // the coupler cover in the bumper; the square headlights on the band under the dome
  masks: [{ lat: [-0.52, 0.52], y: [0.5, 0.86], r: 0.06, mat: "gseCover" }, { lat: [-1.1, -0.88], y: [3.12, 3.29], r: 0.03, mat: "black" }, { lat: [0.88, 1.1], y: [3.12, 3.29], r: 0.03, mat: "black" }],
  lamps: [[-0.99, 3.205, 0.07, "lampHead"], [0.99, 3.205, 0.07, "lampHead"], [-0.71, 0.63, 0.04, "lampRed"], [0.71, 0.63, 0.04, "lampRed"]],
};

/** The cab dome's half section at full height ([z, y], base to crown): from the head-on view, its sides upright to 3.7 m, then arched to 4.05 m. */
const GSE_DOME: Pt[] = [[1.2, 3.36], [1.18, 3.52], [1.13, 3.7], [1.0, 3.87], [0.78, 3.97], [0.43, 4.03], [0, 4.05]];
/** Its stations, d behind the tip: the section's height and width scale. The glass dome rises from 2.5 m to 3.67 m; the cab's roof runs back to 6.2 m, then fairs down into the car's roof by 9.4 m. */
const GSE_DOME_AT: ReadonlyArray<readonly [number, number, number]> = [[2.5, 0, 0.96], [2.79, 0.25, 0.97], [3.08, 0.5, 0.98], [3.37, 0.75, 0.99], [3.67, 1, 1], [3.75, 1, 1], [4.4, 1, 1], [4.45, 1, 1], [5.05, 1, 1], [6.2, 1, 1], [7.4, 0.7, 0.93], [8.6, 0.38, 0.82], [9.4, 0.2, 0.72]];

/** A roof fairing over an air conditioner (d span on the car's body): rounded humps with black louvres at their ends. */
function gseHump(m: MeshBuilder, X: (d: number) => number, C: number, d0: number, d1: number): void {
  const sec: Pt[] = [[0.82, C - 0.16], [0.8, C + 0.1], [0.62, C + 0.2], [0, C + 0.22]];
  const at: ReadonlyArray<readonly [number, number]> = [[d0, 0], [d0 + 0.45, 1], [d1 - 0.45, 1], [d1, 0]];
  const halves = at.map(([, k]) => sec.map(([z, y]): Pt => [z * (0.85 + 0.15 * k), C - 0.16 + (y - C + 0.16) * k]));
  loftHalves(m, at.map(([d]) => X(d)), halves, () => "gseRoof", () => C - 0.16);
  for (const [a, e] of [[d0 + 0.5, d0 + 1.3], [d1 - 1.3, d1 - 0.5]] as const)
    for (const sd of [1, -1]) block(m, "black", Math.min(X(a), X(e)), Math.max(X(a), X(e)), C - 0.03, C + 0.07, sd > 0 ? 0.795 : -0.83, sd > 0 ? 0.83 : -0.795);
}

/** The GSE's own fittings: the end car's raised cab dome, the roof fairings and the underfloor equipment. */
function gseFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = 3.7, L = car.length;
  if (car.end) m.scope("cab dome", () => {
    const halves = GSE_DOME_AT.map(([, kh, kz]) => GSE_DOME.map(([z, y]): Pt => [z * kz, 3.36 + (y - 3.36) * kh]));
    // glass over the dome's front and in the cab's two side windows, the roof's colour over the top
    const sideWindow = (d: number) => (d >= 3.75 && d < 4.4) || (d >= 4.45 && d < 5.05);
    loftHalves(m, GSE_DOME_AT.map(([d]) => X(d - GSE_JOIN)), halves, (seg, edge) => {
      const d = GSE_DOME_AT[seg]![0];
      if (d < 3.67) return edge === 0 ? "gseBody" : "cabGlass";
      if (edge >= 3 || (d >= 6.2 && edge >= 1)) return "gseRoof";
      return sideWindow(d) && edge >= 1 ? "cabGlass" : "gseBody";
    }, () => 3.36);
  });
  // the red valance low on the nose's sides, over the leading bogie, back to the underframe cover at 6.65 m
  if (car.end) m.scope("valance", () => {
    const [x0, x1] = [X(6.65 - GSE_JOIN), X(-0.02)];
    for (const sd of [1, -1]) block(m, "gseBody", Math.min(x0, x1), Math.max(x0, x1), 0.45, 0.86, sd > 0 ? 1.37 : -1.405, sd > 0 ? 1.405 : -1.37);
  });
  m.scope("roof fairings", () => {
    for (const [d0, d1] of car.end ? [[10.6 - GSE_JOIN, 14.0 - GSE_JOIN], [L - 4.2, L - 0.8]] : [[1.0, 4.4], [9.6, 13.0]]) gseHump(m, X, C, d0!, d1!);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), 0.34, 0.62, -1.15, 1.15));
  void b;
}

/** The GSE's paint by livery: its body, roof and line colours under the names its fittings draw with. */
const gsePalette = (body: string, roof: string) => ({ gseBody: c(body, 0.3), gseRoof: c(roof, 0.4), gseSilver: c("#d8d8da", 0.3), gseCover: c(body, 0.45), gseText: c("#ece6d6", 0.4), skirtG: c("#d8d8da", 0.35), black: c("#16181b", 0.4) });

export const GSE: ShinkansenSeries = {
  endLength: 21.3, midLength: 20.0, W: 1.439, Y: 1.3, S: 3.45, C: 3.7, lean: 0.97, B: 0.2, A: 0.86,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: GSE_FACE,
  // the 1.0 m windows in a black band, 1.18 m panes 1.36 m apart; narrow doors (0.6 m by 1.82 m, a
  // small window 2.28 - 2.73 m up), one behind the observation saloon and one at the inner end on the
  // end car, one at the front of each middle car
  windows: [[1.84, 2.86]], windowW: 1.18, pitch: 1.36, door: [1.13, 2.95, 2.28, 2.73], doorW: 0.6, doorGlassW: 0.26,
  layout: {
    end: { doors: [[6.8 - GSE_JOIN, 7.4 - GSE_JOIN, 1], [GSE_END - 1.6, GSE_END - 1.0, -1]], windows: [[4.77 - GSE_JOIN, 6.51 - GSE_JOIN], ...gseRow(7.58 - GSE_JOIN, GSE_END - 1.78)] },
    middle: { doors: [[0.5, 1.1, 1]], windows: gseRow(1.5, 19.0) },
  },
  // the end car's leading bogie 5.0 m behind the tip (the side view), all others 13.8 m apart on the bodies
  bogieCentres: 13.8, centredBogies: true, endBogies: [5.0 - GSE_JOIN, GSE_END - 2.85], wheelR: 0.43, wheelbase: 2.1,
  fittings: gseFittings,
  lodRoof: { d: [3.1, 7.4], hw: 1.1, y: [3.6, 4.05], mat: "gseRoof" },
  liveries: {
    // rose vermilion with the "rouge bordeaux" roof, a vermilion-orange line under the windows and the
    // "moonlight silver" underframe covers (ja.wikipedia, the colours' names and swatches; the body and
    // the line sampled from the sunlit photographs, 249/49/9 and 209/28/11, where the published
    // swatch #d04b26 reads brown)
    rose: {
      title: "Rose vermilion", number: "70051",
      palette: { ...gsePalette("#e0401c", "#9f3042"), red: c("#e0401c", 0.3), line: c("#f2601e", 0.3) },
      bands: [[0, 0.86, "skirtG"], [0.86, 1.66, "red"], [1.66, 1.7, "line"], [1.7, 1.84, "red"], [1.84, 2.86, "black"], [2.86, 9, "red"]], doors: [[0, 9, "red"]],
      roof: "gseRoof", skirt: "skirtG",
      endSweeps: [
        { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
        { mat: "cabGlass", front: [[1.78, 1.158], [2.95, 2.856]], back: [[1.78, 4.36], [2.95, 4.36]] },
      ],
      endLettering: [{ text: "ROMANCECAR GSE", d: 5.2 - GSE_JOIN, y: 1.42, h: 0.1, mat: "gseText" }],
    },
    // the LSE's (7000 series) Romancecar colours: vermilion orange with two white lines low on the
    // body, a grey window band, orange over it (a livery the GSE never carried)
    lse: {
      title: "LSE colours", number: "70052",
      palette: { ...gsePalette("#ef2300", "#9a9da1"), orange: c("#ef2300", 0.3), grey: c("#6a6a6a", 0.35), white: c("#f2f2ef") },
      bands: [[0, 0.86, "skirtG"], [0.86, 1.3, "orange"], [1.3, 1.36, "white"], [1.36, 1.44, "orange"], [1.44, 1.5, "white"], [1.5, 1.74, "orange"], [1.74, 2.96, "grey"], [2.96, 9, "orange"]], doors: [[0, 9, "orange"]],
      roof: "gseRoof", skirt: "skirtG",
      endSweeps: [
        { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
        { mat: "cabGlass", front: [[1.78, 1.158], [2.95, 2.856]], back: [[1.78, 4.36], [2.95, 4.36]] },
      ],
      endLettering: [{ text: "ROMANCECAR GSE", d: 5.2 - GSE_JOIN, y: 1.55, h: 0.1, mat: "white" }],
    },
  },
  // 268.7 t a 7-car set (Tc about 35 t); 4 of 7 cars motored, 4 x 190 kW each: 435 kW a car on average
  weight: { end: 35, middle: 40 }, power: 435, maxspeed: 110,
};

/** The GSE's window panes from d0 to d1 on a car's body: about 1.18 m panes and 0.18 m black pillars, 1.36 m apart (the side view). */
function gseRow(d0: number, d1: number): Array<readonly [number, number]> {
  const n = Math.max(1, Math.round((d1 - d0 + 0.18) / 1.36)), w = (d1 - d0 + 0.18) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w, d0 + (i + 1) * w - 0.18] as const);
}

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
