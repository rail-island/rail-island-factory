// French units on the series kit (shinkansen.ts): the TGV M (Avelia Horizon)
// double-deck high-speed train, the Z 20500 and MI 09 double-deck suburban
// units, the Regio 2N, the Regiolis, the X 3800 "Picasso" railcar and the
// X 73500. See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";
import { TGV_M, tgvMGame } from "./frTgvM.ts";
export { TGV_M };
import { REGIO2N_DD as REGIO2N, REGIO2N_DESIGN } from "./frRegio2n.ts";
import { REGIOLIS_SERIES as REGIOLIS, REGIOLIS_DESIGN } from "./frRegiolis.ts";
import { Z20500, Z20500_DESIGN } from "./frZ20500.ts";
import { MI09 } from "./frMi09.ts";
export { MI09 };
import { X3800 } from "./frX3800.ts";
export { X3800 };

/** A livery of bands bottom first: [top of band, paint] pairs over a body colour list. */
const livery = (title: string, number: string, palette: Record<string, string>, bands: Array<[number, number, string]>, roof = "roofG", skirt = "skirtG"): ShinkansenLivery => ({
  title, number, roof, skirt, bands,
  palette: { roofG: c("#c9cccd", 0.55), skirtG: c("#3a3d40", 0.7), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, c(v)])) },
});

export const X73500: ShinkansenSeries = {
  endLength: 28.9, midLength: 28.9, W: 1.45, Y: 1.3, S: 3.15, C: 3.85, lean: 0.96, B: 0.75, A: 0.9,
  // the Lint's angular front, the windscreen raked back
  nose: nose(1.6, 0.4, 2.4, [[0, 2.5], [0.4, 3.15], [1.4, 3.7], [1.8, 3.85]], [[0, 2.4], [0.4, 2.95], [1.4, 3.15]], [[0, 1.3], [0.8, 1.3]], [[0, 1.0], [0.6, 0.9]], [[0, 0.95], [0.3, 0.75]]),
  windscreen: [0.35, 1.5, 0.07, 1.15], lamps: [0.15, 1.45],
  windows: [[1.65, 2.75]], windowW: 1.5, pitch: 1.8, door: [1.05, 3.0, 1.65, 2.6], doorW: 1.3,
  bogieCentres: 20.0, wheelR: 0.42, wheelbase: 2.3, traction: "diesel", single: true,
  liveries: {
    ter: livery("TER", "X 73501", { body: "#e9ebec", grey: "#4d5257", blue: "#00a3e0" }, [[0, 1.05, "grey"], [1.05, 1.15, "blue"], [1.15, 9, "body"]]),
    alsace: livery("TER Alsace", "X 73901", { body: "#e9ebec", grey: "#4d5257", red: "#c8102e" }, [[0, 1.05, "grey"], [1.05, 1.15, "red"], [1.15, 9, "body"]]),
  },
  weight: { end: 49, middle: 49 }, power: 514, maxspeed: 140,
};

const P = { tgvM: seriesParams(TGV_M), z20500: seriesParams(Z20500), mi09: seriesParams(MI09), regio2n: seriesParams(REGIO2N), regiolis: seriesParams(REGIOLIS), x3800: seriesParams(X3800), x73500: seriesParams(X73500) };

export function sncfTgvM(v?: ParamValues): MeshBuilder { return buildSeries(TGV_M, P.tgvM, v); }
export function sncfTgvMLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(TGV_M, P.tgvM, v); }
export { sncfZ20500, sncfZ20500Lod } from "./frZ20500.ts";
export function ratpMi09(v?: ParamValues): MeshBuilder { return buildSeries(MI09, P.mi09, v); }
export function ratpMi09Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MI09, P.mi09, v); }
export { sncfRegio2n, sncfRegio2nLod } from "./frRegio2n.ts";
export { sncfRegiolis, sncfRegiolisLod } from "./frRegiolis.ts";
export function sncfX3800(v?: ParamValues): MeshBuilder { return buildSeries(X3800, P.x3800, v); }
export function sncfX3800Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(X3800, P.x3800, v); }
export function sncfX73500(v?: ParamValues): MeshBuilder { return buildSeries(X73500, P.x73500, v); }
export function sncfX73500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(X73500, P.x73500, v); }

export const FR_UNITS: ProceduralDesign[] = [
  tgvMGame(seriesDesign("proc-vehicle-sncf-tgv-m", "TGV M", TGV_M, P.tgvM, sncfTgvM, sncfTgvMLod, "sncf-tgv-m", "uic")),
  Z20500_DESIGN,
  seriesDesign("proc-vehicle-ratp-mi09", "RER MI 09", MI09, P.mi09, ratpMi09, ratpMi09Lod, "ratp-mi09", "uic"),
  REGIO2N_DESIGN,
  REGIOLIS_DESIGN,
  seriesDesign("proc-vehicle-sncf-x3800", "SNCF X 3800 Picasso", X3800, P.x3800, sncfX3800, sncfX3800Lod, "sncf-x3800", "uic"),
  seriesDesign("proc-vehicle-sncf-x73500", "SNCF X 73500", X73500, P.x73500, sncfX73500, sncfX73500Lod, "sncf-x73500", "uic"),
];
