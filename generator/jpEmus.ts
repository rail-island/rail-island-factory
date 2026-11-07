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

// the E259 Narita Express: its own module, drawn from its photographs
import { E259 } from "./jrE259.ts";
export { E259 };

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
