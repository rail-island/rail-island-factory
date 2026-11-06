// Dutch units on the series kit (shinkansen.ts): the Mat '46 and the Mat '54
// "Hondekop", the Plan V, the DE-I "Blauwe Engel" railcar, the ICM "Koploper",
// the VIRM and DDZ double-deckers, the SGM, SLT, SNG and ICNG, NS's Stadler
// FLIRT and the Fyra V250. See docs/models/netherlands-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, flirt, nose, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** NS's schemes by name, with the heights of their bands for a body whose eaves are at `s`. */
export function nsLivery(kind: "yellowBlue" | "yellowGrey" | "green" | "fyra" | "sprinter", number: string, s = 3.2): ShinkansenLivery {
  const pal = (p: Record<string, string>) => ({ roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, c(v)])) });
  switch (kind) {
    case "yellowBlue": return { title: "NS yellow, blue", number, palette: pal({ yellow: NS_YELLOW, blue: NS_BLUE }), bands: [[0, 1.45, "blue"], [1.45, 9, "yellow"]], roof: "roofG", skirt: "skirtG" };
    case "yellowGrey": return { title: "NS yellow, grey", number, palette: pal({ yellow: NS_YELLOW, grey: "#6f757a" }), bands: [[0, 1.4, "grey"], [1.4, 9, "yellow"]], roof: "roofG", skirt: "skirtG" };
    case "green": return { title: "NS green", number, palette: pal({ green: "#2d5d3a", yellowLine: "#d9b54a" }), bands: [[0, 1.7, "green"], [1.7, 1.75, "yellowLine"], [1.75, 9, "green"]], roof: "roofG", skirt: "skirtG" };
    case "sprinter": return { title: "NS Sprinter", number, palette: pal({ white: "#f1f1ee", yellow: NS_YELLOW, blue: NS_BLUE }), bands: [[0, 1.3, "blue"], [1.3, 1.45, "yellow"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "fyra": return { title: "Fyra", number, palette: pal({ burgundy: "#6b1d3a", grey: "#c9cccd", magenta: "#c8007a" }), bands: [[0, 1.6, "burgundy"], [1.6, 1.68, "magenta"], [1.68, s - 0.3, "grey"], [s - 0.3, 9, "burgundy"]], roof: "roofG", skirt: "skirtG" };
  }
}

const DD_ROWS: ReadonlyArray<readonly [number, number]> = [[1.25, 1.95], [2.8, 3.5]];

/** The Mat '46 in NS green, read from photo-spoorwegmuseum-treinstel-ns-273.jpg: the silver skirt, the red waist and cantrail bands, the silver roof; the red band rising over the front's windows. */
const MAT46_GREEN: ShinkansenLivery = {
  title: "NS green", number: "273",
  palette: { green: c("#2f4a36"), red: c("#c42127"), silver: c("#b6babd", 0.35), roofG: c("#aeb2b5", 0.45), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) },
  bands: [[0, 1.22, "silver"], [1.22, 1.36, "red"], [1.36, 2.95, "green"], [2.95, 9, "red"]],
  front: [[0, 1.22, "silver"], [1.22, 1.36, "red"], [1.36, 2.98, "green"], [2.98, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
};

/**
 * The "Muizenneus" (mouse nose): the end half-round in plan, a band of five windows wrapping
 * round it under the red band and the silver dome, two lamps low, the Scharfenberg coupler.
 */
const MOUSE_NOSE: SeriesCabFace = {
  dJoin: 1.35, dSide: 1.3, reach: 0.35, first: 3.2, roofFrom: 3.32,
  profile: [[1.0, 0.15], [1.15, 0.05], [1.35, 0], [2.0, 0], [2.9, 0.06], [3.15, 0.16], [3.4, 0.36], [3.65, 0.72], [3.85, 1.35]],
  corner: [[1.0, 1.0], [3.0, 1.0], [3.5, 0.6], [3.85, 0.1]], bulge: 0.04,
  rows: [1.0, 1.15, 1.22, 1.36, 1.55, 2.0, 2.05, 2.45, 2.88, 2.98, 3.15, 3.32, 3.45, 3.65, 3.85],
  masks: [{ lat: [-1.37, 1.37], y: [2.0, 2.93], r: 0.06, mat: "frameSilver" }],
  panes: [-2, -1, 0, 1, 2].map((k) => ({ lat: [k * 0.535 - 0.235, k * 0.535 + 0.235] as const, y: [2.05, 2.88] as const, r: 0.05 })),
  lamps: [[-0.42, 1.6, 0.13, "lampHead"], [0.42, 1.6, 0.13, "lampHead"]], roofLamp: [0, 3.18, 0.06],
  wipers: [[[-0.6, 2.1], [-0.4, 2.7]], [[0.4, 2.1], [0.6, 2.7]]],
};

export const MAT46: ShinkansenSeries = {
  endLength: 25.9, midLength: 25.9, W: 1.47, Y: 1.4, S: 3.15, C: 3.85, lean: 0.97, B: 1.0, A: 1.15,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: MOUSE_NOSE,
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.2, 3.05, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.5, wheelbase: 3.0, cars: [2], endPantograph: true,
  liveries: { green: MAT46_GREEN, yellowGrey: nsLivery("yellowGrey", "283") },
  weight: { end: 55, middle: 55 }, power: 280, maxspeed: 120,
};

export const MAT54: ShinkansenSeries = {
  endLength: 26.0, midLength: 25.5, W: 1.47, Y: 1.4, S: 3.15, C: 3.9, lean: 0.97, B: 1.0, A: 1.15,
  // the "dog's head": a short bonnet ahead of the raised cab
  nose: nose(2.3, 0.4, 2.3, [[0, 2.2], [0.3, 2.45], [1.4, 2.65], [2.0, 3.3], [2.6, 3.75], [3.2, 3.9]], [[0, 2.15], [0.3, 2.35], [1.4, 2.5], [2.2, 3.05], [3.2, 3.15]], [[0, 1.5], [1.0, 1.4]], [[0, 1.3], [0.6, 1.15]], [[0, 1.2], [0.4, 1.0]]),
  windscreen: [2.0, 2.7, 0.07, 1.1], lamps: [0.4, 2.1],
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.2, 3.05, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.5, wheelbase: 3.0, cars: [2, 4],
  liveries: { green: nsLivery("green", "766"), yellowGrey: nsLivery("yellowGrey", "786") },
  weight: { end: 50, middle: 45 }, power: 330, maxspeed: 140,
};

export const PLAN_V: ShinkansenSeries = {
  endLength: 26.0, midLength: 26.0, W: 1.45, Y: 1.4, S: 3.15, C: 3.9, lean: 0.97, B: 1.0, A: 1.15,
  nose: nose(0.1, 1, 2, [[0, 3.9]], [[0, 3.15]], [[0, 1.4]], [[0, 1.15]], [[0, 1.0]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.45, 2.0, 2.8, "cabMask", 1.55),
  windows: [[1.95, 2.8]], windowW: 1.2, pitch: 1.45, door: [1.2, 3.05, 1.95, 2.65], doorW: 1.1, doorCount: 2,
  bogieCentres: 18.0, wheelR: 0.5, wheelbase: 2.8, cars: [2], endPantograph: true,
  liveries: { yellowGrey: nsLivery("yellowGrey", "448"), yellowBlue: nsLivery("yellowBlue", "907") },
  weight: { end: 52, middle: 52 }, power: 310, maxspeed: 140,
};

export const DE1: ShinkansenSeries = {
  endLength: 26.0, midLength: 26.0, W: 1.45, Y: 1.4, S: 3.15, C: 3.85, lean: 0.97, B: 1.0, A: 1.15,
  nose: nose(0.8, 0.6, 2.2, [[0, 3.3], [0.3, 3.65], [0.8, 3.85]], [[0, 3.1], [0.4, 3.15]], [[0, 1.4], [0.5, 1.4]], [[0, 1.2], [0.4, 1.15]], [[0, 1.1], [0.2, 1.0]]),
  windscreen: [0.05, 0.6, 0.07, 1.25], lamps: [0.05, 1.55],
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.2, 3.05, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.5, wheelbase: 3.0, traction: "diesel", single: true, endCoupler: "buffers",
  liveries: { blue: { title: "Blue Angel", palette: { blue: c("#2b5d8a"), cream: c("#e6dcc0"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.75) }, bands: [[0, 1.85, "blue"], [1.85, 2.85, "cream"], [2.85, 9, "blue"]], roof: "roofG", skirt: "skirtG", number: "DE 41" } },
  weight: { end: 64, middle: 64 }, power: 300, maxspeed: 120,
};

export const ICM: ShinkansenSeries = {
  endLength: 27.0, midLength: 26.4, W: 1.41, Y: 1.4, S: 3.15, C: 4.03, lean: 0.97, B: 1.0, A: 1.15,
  // the "Koploper": the cab raised over the nose's gangway door
  nose: nose(1.8, 0.6, 2.3, [[0, 2.6], [0.4, 2.8], [1.0, 3.45], [1.8, 3.95], [2.4, 4.03]], [[0, 2.5], [0.4, 2.7], [1.0, 3.05], [1.8, 3.15]], [[0, 1.5], [0.8, 1.4]], [[0, 1.3], [0.6, 1.15]], [[0, 1.2], [0.3, 1.0]]),
  windscreen: [0.5, 1.6, 0.07, 1.15], lamps: [0.1, 1.6],
  windows: [[1.95, 2.85]], windowW: 1.3, pitch: 1.55, door: [1.2, 3.05, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 19.0, wheelR: 0.47, wheelbase: 2.5, cars: [3, 4],
  liveries: { yellowBlue: nsLivery("yellowBlue", "4011"), yellowGrey: nsLivery("yellowGrey", "4201") },
  weight: { end: 54, middle: 48 }, power: 320, maxspeed: 160,
};

export const VIRM: ShinkansenSeries = {
  endLength: 27.0, midLength: 26.4, W: 1.41, Y: 1.2, S: 3.85, C: 4.6, lean: 0.97, B: 0.75, A: 0.95,
  nose: nose(1.8, 0.4, 2.3, [[0, 2.8], [0.5, 3.6], [1.4, 4.35], [2.0, 4.6]], [[0, 2.7], [0.5, 3.35], [1.4, 3.8], [2.0, 3.85]], [[0, 1.2], [0.8, 1.2]], [[0, 1.0], [0.6, 0.95]], [[0, 0.9], [0.3, 0.75]]),
  windscreen: [0.35, 1.6, 0.07, 1.15], lamps: [0.1, 1.5],
  windows: DD_ROWS, windowW: 1.3, pitch: 1.55, door: [1.1, 3.05, 1.8, 2.6], doorW: 1.3,
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, cars: [4, 6],
  liveries: { yellowBlue: nsLivery("yellowBlue", "9401", 3.85), yellowGrey: nsLivery("yellowGrey", "8601", 3.85) },
  weight: { end: 62, middle: 55 }, power: 330, maxspeed: 160,
};

export const DDZ: ShinkansenSeries = {
  ...VIRM,
  nose: nose(0.1, 1, 2, [[0, 4.6]], [[0, 3.85]], [[0, 1.2]], [[0, 0.95]], [[0, 0.75]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.41, 2.8, 3.55, "cabMask", 1.5),
  liveries: { yellowBlue: nsLivery("yellowBlue", "7501", 3.85), yellowGrey: nsLivery("yellowGrey", "7301", 3.85) },
  weight: { end: 64, middle: 50 }, power: 400, maxspeed: 140,
};

export const SGM: ShinkansenSeries = {
  endLength: 26.1, midLength: 26.1, W: 1.43, Y: 1.4, S: 3.2, C: 4.02, lean: 0.97, B: 1.0, A: 1.15,
  nose: nose(0.1, 1, 2, [[0, 4.02]], [[0, 3.2]], [[0, 1.4]], [[0, 1.15]], [[0, 1.0]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.43, 2.0, 2.9, "cabMask", 1.55),
  windows: [[1.95, 2.85]], windowW: 1.4, pitch: 1.65, door: [1.2, 3.05, 1.95, 2.65], doorW: 1.3, doorCount: 2,
  bogieCentres: 18.0, wheelR: 0.47, wheelbase: 2.5, cars: [2, 3],
  liveries: { yellowGrey: nsLivery("yellowGrey", "2001"), sprinter: nsLivery("sprinter", "2101") },
  weight: { end: 45, middle: 40 }, power: 320, maxspeed: 125,
};

export const SLT: ShinkansenSeries = {
  endLength: 17.5, midLength: 15.8, W: 1.4, Y: 1.25, S: 3.2, C: 4.0, lean: 0.96, B: 0.6, A: 0.8,
  nose: nose(1.8, 0.35, 2.3, [[0, 2.4], [0.4, 3.1], [1.3, 3.75], [2.0, 4.0]], [[0, 2.3], [0.4, 2.9], [1.3, 3.15], [2.0, 3.2]], [[0, 1.25], [0.8, 1.25]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
  windscreen: [0.4, 1.6, 0.07, 1.2], lamps: [0.15, 1.35],
  windows: [[1.45, 2.65]], windowW: 1.5, pitch: 1.75, door: [0.95, 3.0, 1.5, 2.6], doorW: 1.3, doorCount: 2,
  bogieCentres: 11.5, wheelR: 0.42, wheelbase: 2.3, cars: [4, 6],
  liveries: { sprinter: nsLivery("sprinter", "2401") },
  weight: { end: 40, middle: 32 }, power: 380, maxspeed: 160,
};

export const SNG: ShinkansenSeries = {
  ...SLT,
  endLength: 18.4, midLength: 16.6,
  nose: nose(1.6, 0.4, 2.4, [[0, 2.6], [0.4, 3.25], [1.2, 3.8], [1.8, 4.0]], [[0, 2.5], [0.4, 3.0], [1.2, 3.2]], [[0, 1.25], [0.8, 1.25]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
  cars: [3, 4],
  liveries: { sprinter: nsLivery("sprinter", "2301") },
  weight: { end: 42, middle: 34 }, power: 360, maxspeed: 160,
};

export const ICNG: ShinkansenSeries = {
  endLength: 23.6, midLength: 18.4, W: 1.41, Y: 1.3, S: 3.2, C: 4.1, lean: 0.95, B: 0.65, A: 0.85,
  // the Coradia Stream's long, smooth nose: its lower front rounded in plan and in profile to a small tip
  nose: nose(3.0, 0.14, 2.2, [[0, 1.6], [0.15, 1.85], [0.5, 2.45], [1.0, 2.9], [1.8, 3.5], [3.2, 4.1]], [[0, 1.55], [0.15, 1.78], [0.5, 2.3], [1.0, 2.65], [1.8, 3.0], [3.2, 3.2]], [[0, 1.3], [1.0, 1.3]], [[0, 1.15], [0.15, 1.02], [0.45, 0.92], [0.9, 0.85]], [[0, 1.1], [0.12, 0.92], [0.35, 0.72], [0.6, 0.65]]),
  windscreen: [1.0, 2.8, 0.07, 1.15], windscreenMask: 0.18, lamps: [0.3, 1.35],
  windows: [[1.55, 2.7]], windowW: 1.6, pitch: 1.85, door: [1.0, 3.0, 1.55, 2.6], doorW: 1.3,
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.5, cars: [5, 8],
  liveries: { yellowBlue: nsLivery("yellowBlue", "3101") },
  weight: { end: 48, middle: 38 }, power: 400, maxspeed: 200,
};

export const NS_FLIRT: ShinkansenSeries = flirt({
  liveries: { sprinter: nsLivery("sprinter", "2501") },
  weight: { end: 42, middle: 32 }, power: 375, maxspeed: 160,
});

export const V250: ShinkansenSeries = {
  endLength: 27.15, midLength: 26.0, W: 1.45, Y: 1.4, S: 3.1, C: 4.08, lean: 0.95, B: 0.8, A: 1.05,
  // the Fyra's long sloping nose, the windscreen far back
  nose: nose(6.0, 0.08, 2.4, [[0, 1.2], [0.6, 1.6], [2.4, 2.3], [4.2, 3.0], [5.8, 3.7], [7.0, 4.08]], [[0, 1.15], [0.6, 1.5], [2.4, 2.1], [4.2, 2.65], [5.8, 2.95], [7.0, 3.1]], [[0, 1.1], [1.5, 1.3], [3.0, 1.4]], [[0, 1.05], [1.5, 1.05]], [[0, 1.0], [0.6, 0.6], [2.0, 0.8]]),
  windscreen: [4.0, 5.9, 0.07, 1.05], lamps: [1.4, 1.45],
  windows: [[1.95, 2.75]], windowW: 1.3, pitch: 1.6, door: [1.3, 3.1, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.7,
  liveries: { fyra: nsLivery("fyra", "4801", 3.1) },
  weight: { end: 55, middle: 52 }, power: 680, maxspeed: 250,
};

const P = {
  mat46: seriesParams(MAT46), mat54: seriesParams(MAT54), planV: seriesParams(PLAN_V), de1: seriesParams(DE1), icm: seriesParams(ICM), virm: seriesParams(VIRM),
  ddz: seriesParams(DDZ), sgm: seriesParams(SGM), slt: seriesParams(SLT), sng: seriesParams(SNG), icng: seriesParams(ICNG), flirt: seriesParams(NS_FLIRT), v250: seriesParams(V250),
};

export function nsMat46(v?: ParamValues): MeshBuilder { return buildSeries(MAT46, P.mat46, v); }
export function nsMat46Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MAT46, P.mat46, v); }
export function nsMat54(v?: ParamValues): MeshBuilder { return buildSeries(MAT54, P.mat54, v); }
export function nsMat54Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MAT54, P.mat54, v); }
export function nsPlanV(v?: ParamValues): MeshBuilder { return buildSeries(PLAN_V, P.planV, v); }
export function nsPlanVLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(PLAN_V, P.planV, v); }
export function nsDe1(v?: ParamValues): MeshBuilder { return buildSeries(DE1, P.de1, v); }
export function nsDe1Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(DE1, P.de1, v); }
export function nsIcm(v?: ParamValues): MeshBuilder { return buildSeries(ICM, P.icm, v); }
export function nsIcmLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICM, P.icm, v); }
export function nsVirm(v?: ParamValues): MeshBuilder { return buildSeries(VIRM, P.virm, v); }
export function nsVirmLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(VIRM, P.virm, v); }
export function nsDdz(v?: ParamValues): MeshBuilder { return buildSeries(DDZ, P.ddz, v); }
export function nsDdzLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(DDZ, P.ddz, v); }
export function nsSgm(v?: ParamValues): MeshBuilder { return buildSeries(SGM, P.sgm, v); }
export function nsSgmLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SGM, P.sgm, v); }
export function nsSlt(v?: ParamValues): MeshBuilder { return buildSeries(SLT, P.slt, v); }
export function nsSltLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SLT, P.slt, v); }
export function nsSng(v?: ParamValues): MeshBuilder { return buildSeries(SNG, P.sng, v); }
export function nsSngLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SNG, P.sng, v); }
export function nsIcng(v?: ParamValues): MeshBuilder { return buildSeries(ICNG, P.icng, v); }
export function nsIcngLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICNG, P.icng, v); }
export function nsFlirt(v?: ParamValues): MeshBuilder { return buildSeries(NS_FLIRT, P.flirt, v); }
export function nsFlirtLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(NS_FLIRT, P.flirt, v); }
export function nsV250(v?: ParamValues): MeshBuilder { return buildSeries(V250, P.v250, v); }
export function nsV250Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(V250, P.v250, v); }

export const NL_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-ns-mat46", "NS Mat '46", MAT46, P.mat46, nsMat46, nsMat46Lod, "ns-mat46", "uic"),
  seriesDesign("proc-vehicle-ns-mat54", "NS Mat '54 Hondekop", MAT54, P.mat54, nsMat54, nsMat54Lod, "ns-mat54", "uic"),
  seriesDesign("proc-vehicle-ns-plan-v", "NS Plan V", PLAN_V, P.planV, nsPlanV, nsPlanVLod, "ns-plan-v", "uic"),
  seriesDesign("proc-vehicle-ns-de1", "NS DE-I Blauwe Engel", DE1, P.de1, nsDe1, nsDe1Lod, "ns-de1", "uic"),
  seriesDesign("proc-vehicle-ns-icm", "NS ICM Koploper", ICM, P.icm, nsIcm, nsIcmLod, "ns-icm", "uic"),
  seriesDesign("proc-vehicle-ns-virm", "NS VIRM", VIRM, P.virm, nsVirm, nsVirmLod, "ns-virm", "uic"),
  seriesDesign("proc-vehicle-ns-ddz", "NS DDZ", DDZ, P.ddz, nsDdz, nsDdzLod, "ns-ddz", "uic"),
  seriesDesign("proc-vehicle-ns-sgm", "NS SGM Sprinter", SGM, P.sgm, nsSgm, nsSgmLod, "ns-sgm", "uic"),
  seriesDesign("proc-vehicle-ns-slt", "NS SLT", SLT, P.slt, nsSlt, nsSltLod, "ns-slt", "uic"),
  seriesDesign("proc-vehicle-ns-sng", "NS SNG", SNG, P.sng, nsSng, nsSngLod, "ns-sng", "uic"),
  seriesDesign("proc-vehicle-ns-icng", "NS ICNG", ICNG, P.icng, nsIcng, nsIcngLod, "ns-icng", "uic"),
  seriesDesign("proc-vehicle-ns-flirt", "NS Flirt", NS_FLIRT, P.flirt, nsFlirt, nsFlirtLod, "ns-flirt", "uic"),
  seriesDesign("proc-vehicle-ns-v250", "Fyra V250", V250, P.v250, nsV250, nsV250Lod, "ns-v250", "uic"),
];
