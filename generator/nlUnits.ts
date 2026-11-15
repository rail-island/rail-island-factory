// Dutch units on the series kit (shinkansen.ts): the Mat '46 and the Mat '54
// "Hondekop", the Plan V, the DE-I "Blauwe Engel" railcar, the ICM "Koploper",
// the VIRM and DDZ double-deckers, the SGM, SLT, SNG and ICNG, NS's Stadler
// FLIRT and the Fyra V250. See docs/models/netherlands-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flirt, nose } from "./seriesHelpers.ts";
import { DE1 } from "./nlDe1.ts";
import { SGM, sgmGame, sgmSeries } from "./nlSgm.ts";
import { SLT_SERIES } from "./nlSlt.ts";
import { PLAN_V } from "./nlPlanV.ts";
import { MAT54 } from "./nlMat54.ts";
import { DDZ, nsDdz, nsDdzLod } from "./nlDdz.ts";
import { ICM } from "./nlIcm.ts";
import { MAT46 } from "./nlMat46.ts";
import { VIRM } from "./nlVirm.ts";
import { V250 } from "./nlV250.ts";

export { DE1, MAT46, VIRM };
import { SNG } from "./nlSng.ts";

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

const P = {
  mat46: seriesParams(MAT46), mat54: seriesParams(MAT54), planV: seriesParams(PLAN_V), de1: seriesParams(DE1), icm: seriesParams(ICM), virm: seriesParams(VIRM),
  ddz: seriesParams(DDZ), sgm: seriesParams(SGM), slt: seriesParams(SLT_SERIES), sng: seriesParams(SNG), icng: seriesParams(ICNG), flirt: seriesParams(NS_FLIRT), v250: seriesParams(V250),
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
export function nsSgm(v?: ParamValues): MeshBuilder { return buildSeries(sgmSeries(v), P.sgm, v); }
export function nsSgmLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(sgmSeries(v), P.sgm, v); }
export function nsSlt(v?: ParamValues): MeshBuilder { return buildSeries(SLT_SERIES, P.slt, v); }
export function nsSltLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SLT_SERIES, P.slt, v); }
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
  ((d) => ({ ...d, game: sgmGame(d.game!) }))(seriesDesign("proc-vehicle-ns-sgm", "NS SGM Sprinter", SGM, P.sgm, nsSgm, nsSgmLod, "ns-sgm", "uic")),
  seriesDesign("proc-vehicle-ns-slt", "NS SLT", SLT_SERIES, P.slt, nsSlt, nsSltLod, "ns-slt", "uic"),
  seriesDesign("proc-vehicle-ns-sng", "NS SNG", SNG, P.sng, nsSng, nsSngLod, "ns-sng", "uic"),
  seriesDesign("proc-vehicle-ns-icng", "NS ICNG", ICNG, P.icng, nsIcng, nsIcngLod, "ns-icng", "uic"),
  seriesDesign("proc-vehicle-ns-flirt", "NS Flirt", NS_FLIRT, P.flirt, nsFlirt, nsFlirtLod, "ns-flirt", "uic"),
  seriesDesign("proc-vehicle-ns-v250", "Fyra V250", V250, P.v250, nsV250, nsV250Lod, "ns-v250", "uic"),
];
