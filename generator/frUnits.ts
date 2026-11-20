// French units on the series kit (shinkansen.ts): the TGV M (Avelia Horizon)
// double-deck high-speed train, the Z 20500 and MI 09 double-deck suburban
// units, the Regio 2N, the Regiolis, the X 3800 "Picasso" railcar and the
// X 73500. See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams } from "./shinkansen.ts";
import { TGV_M, tgvMGame } from "./frTgvM.ts";
export { TGV_M };
import { REGIO2N_DD as REGIO2N, REGIO2N_DESIGN } from "./frRegio2n.ts";
import { REGIOLIS_SERIES as REGIOLIS, REGIOLIS_DESIGN } from "./frRegiolis.ts";
import { Z20500, Z20500_DESIGN } from "./frZ20500.ts";
import { MI09 } from "./frMi09.ts";
export { MI09 };
import { X3800 } from "./frX3800.ts";
export { X3800 };
import { X73500, sncfX73500, sncfX73500Lod } from "./frX73500.ts";

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
export { sncfX73500, sncfX73500Lod } from "./frX73500.ts";

export const FR_UNITS: ProceduralDesign[] = [
  tgvMGame(seriesDesign("proc-vehicle-sncf-tgv-m", "TGV M", TGV_M, P.tgvM, sncfTgvM, sncfTgvMLod, "sncf-tgv-m", "uic")),
  Z20500_DESIGN,
  seriesDesign("proc-vehicle-ratp-mi09", "RER MI 09", MI09, P.mi09, ratpMi09, ratpMi09Lod, "ratp-mi09", "uic"),
  REGIO2N_DESIGN,
  REGIOLIS_DESIGN,
  seriesDesign("proc-vehicle-sncf-x3800", "SNCF X 3800 Picasso", X3800, P.x3800, sncfX3800, sncfX3800Lod, "sncf-x3800", "uic"),
  seriesDesign("proc-vehicle-sncf-x73500", "SNCF X 73500", X73500, P.x73500, sncfX73500, sncfX73500Lod, "sncf-x73500", "uic"),
];
