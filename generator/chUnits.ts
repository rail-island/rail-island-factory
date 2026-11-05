// Swiss units on the series kit (shinkansen.ts): the RAe TEE II, the "Roter
// Pfeil" railcar, the tilting ICN, the Giruno, the FV-Dosto, SBB's FLIRT and
// KISS (the Stadler bases, seriesHelpers.ts) and the Rhaetian Railway's
// metre-gauge Allegra. See docs/models/switzerland-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flirt, kiss, nose } from "./seriesHelpers.ts";

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
    case "redArrow": return { title: "Red Arrow", number, palette: pal({ red: "#c8102e", cream: "#e6dcc0" }), bands: [[0, 9, "red"]], roof: "red", skirt: "skirtG" };
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

export const RED_ARROW: ShinkansenSeries = {
  endLength: 22.4, midLength: 22.4, W: 1.45, Y: 1.4, S: 2.9, C: 3.65, lean: 0.95, B: 0.9, A: 1.05,
  // the 1935 streamliner: rounded ends, the driver's windows wrapping round them
  nose: nose(2.2, 0.35, 2.0, [[0, 2.0], [0.4, 2.6], [1.4, 3.3], [2.4, 3.65]], [[0, 1.95], [0.4, 2.45], [1.4, 2.8], [2.4, 2.9]], [[0, 1.45], [1.0, 1.4]], [[0, 1.25], [0.8, 1.05]], [[0, 1.15], [0.4, 0.9]]),
  windscreen: [0.6, 1.9, 0.07, 1.1], lamps: [0.25, 1.6],
  windows: [[1.9, 2.65]], windowW: 1.2, pitch: 1.5, door: [1.2, 2.95, 1.9, 2.55], doorW: 0.8,
  bogieCentres: 14.0, wheelR: 0.45, wheelbase: 2.6, single: true, endPantograph: true,
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

export const FV_DOSTO: ShinkansenSeries = {
  endLength: 26.8, midLength: 25.0, W: 1.4, Y: 1.2, S: 3.85, C: 4.6, lean: 0.97, B: 0.72, A: 0.9,
  nose: nose(2.8, 0.3, 2.3, [[0, 2.2], [0.5, 3.2], [1.8, 4.2], [3.0, 4.6]], [[0, 2.1], [0.5, 3.0], [1.8, 3.65], [3.0, 3.85]], [[0, 1.2], [1.0, 1.2]], [[0, 1.0], [0.8, 0.9]], [[0, 0.9], [0.4, 0.7]]),
  windscreen: [0.8, 2.6, 0.07, 1.15], lamps: [0.2, 1.4],
  windows: [[1.25, 1.95], [2.85, 3.55]], windowW: 1.4, pitch: 1.7, door: [1.0, 3.05, 1.65, 2.6], doorW: 1.3,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, cars: [4, 8],
  liveries: { sbb: chLivery("sbb", "502 001") },
  weight: { end: 64, middle: 55 }, power: 500, maxspeed: 200,
};

export const SBB_FLIRT: ShinkansenSeries = flirt({ W: 1.44, liveries: { sbbRegio: chLivery("sbbRegio", "523 001") }, weight: { end: 42, middle: 32 }, power: 650, maxspeed: 160 });
export const SBB_KISS: ShinkansenSeries = kiss({ liveries: { sbbRegio: chLivery("sbbRegio", "511 001") }, weight: { end: 62, middle: 50 }, power: 1000, maxspeed: 160 });

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
