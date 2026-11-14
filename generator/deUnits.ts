// German units on the series kit (shinkansen.ts): the ICE 3 (BR 403, its own
// cab face in deIce3.ts), the ICE 4 (BR 412), the tilting ICE T (BR 411), the
// Munich and Stuttgart S-Bahn's BR 423 (deBr423.ts), the Desiro Classic (BR 642) and the
// RegioShuttle (BR 650, deBr650.ts) diesel railcars, the Uerdinger railbus (VT 98, deVt98.ts) and the
// Fliegender Hamburger (SVT 877); and the ICE 2, the ICE 1's power car and coach
// (ice1.ts) with a driving trailer on the series kit. See docs/models/germany-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { ice1, ice1Lod } from "./ice1.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";
import { nose, striped } from "./seriesHelpers.ts";
import { ICE3 } from "./deIce3.ts";
import { ICE4 } from "./deIce4.ts";
import { ICE_T } from "./deIceT.ts";
import { BR423 } from "./deBr423.ts";
import { BR642 } from "./deBr642.ts";
import { BR650 } from "./deBr650.ts";
import { VT98 } from "./deVt98.ts";
import { SVT877 } from "./deSvt877.ts";

export { ICE3, VT98 };

const ICE_WHITE = "#eceeee";
const TRAFFIC_RED = "#ec0016";





/** The ICE 2's driving trailer (class 808): the ICE 1's coach body under a nose with a cab. */
export const ICE2_DT: ShinkansenSeries = {
  endLength: 26.58, midLength: 26.4, W: 1.5, Y: 1.4, S: 3.15, C: 3.84, lean: 0.95, B: 0.8, A: 1.05,
  nose: nose(4.2, 0.12, 2.4, [[0, 1.4], [0.4, 1.95], [1.8, 2.7], [3.4, 3.4], [4.6, 3.84]], [[0, 1.35], [0.4, 1.85], [1.8, 2.5], [3.4, 2.95], [4.6, 3.15]], [[0, 1.3], [1.2, 1.4]], [[0, 1.15], [1.0, 1.05]], [[0, 1.1], [0.4, 0.8]]),
  windscreen: [2.6, 4.2, 0.07, 1.1], lamps: [0.7, 1.55],
  windows: [[1.95, 2.75]], windowW: 1.3, pitch: 1.65, door: [1.3, 3.1, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5,
  liveries: { dbIce: striped("DB ICE", ICE_WHITE, TRAFFIC_RED, 1.68, 1.82, "808 001") },
  weight: { end: 50, middle: 50 }, power: 0, maxspeed: 280,
};

export const ICE2_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { powerCar: "Power car", coach: "Coach", drivingTrailer: "Driving trailer" })];
const DT_PARAMS = seriesParams(ICE2_DT);

const P = {
  ice3: seriesParams(ICE3), ice4: seriesParams(ICE4), iceT: seriesParams(ICE_T), br423: seriesParams(BR423),
  br642: seriesParams(BR642), br650: seriesParams(BR650), vt98: seriesParams(VT98), svt877: seriesParams(SVT877),
};

export function dbIce3(v?: ParamValues): MeshBuilder { return buildSeries(ICE3, P.ice3, v); }
export function dbIce3Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICE3, P.ice3, v); }
export function dbIce4(v?: ParamValues): MeshBuilder { return buildSeries(ICE4, P.ice4, v); }
export function dbIce4Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICE4, P.ice4, v); }
export function dbIceT(v?: ParamValues): MeshBuilder { return buildSeries(ICE_T, P.iceT, v); }
export function dbIceTLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICE_T, P.iceT, v); }
export function db423(v?: ParamValues): MeshBuilder { return buildSeries(BR423, P.br423, v); }
export function db423Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(BR423, P.br423, v); }
export function db642(v?: ParamValues): MeshBuilder { return buildSeries(BR642, P.br642, v); }
export function db642Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(BR642, P.br642, v); }
export function db650(v?: ParamValues): MeshBuilder { return buildSeries(BR650, P.br650, v); }
export function db650Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(BR650, P.br650, v); }
export function dbVt98(v?: ParamValues): MeshBuilder { return buildSeries(VT98, P.vt98, v); }
export function dbVt98Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(VT98, P.vt98, v); }
export function drgSvt877(v?: ParamValues): MeshBuilder { return buildSeries(SVT877, P.svt877, v); }
export function drgSvt877Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SVT877, P.svt877, v); }

export function dbIce2(v?: ParamValues): MeshBuilder {
  const u = resolveParams(ICE2_PARAMS, v).unit;
  return u === "drivingTrailer" ? buildSeries(ICE2_DT, DT_PARAMS, { unit: "endCar" }) : ice1({ unit: u! });
}
export function dbIce2Lod(v?: ParamValues): MeshBuilder {
  const u = resolveParams(ICE2_PARAMS, v).unit;
  return u === "drivingTrailer" ? buildSeriesLod(ICE2_DT, DT_PARAMS, { unit: "endCar" }) : ice1Lod({ unit: u! });
}

export const DE_UNIT_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-db-ice3": ICE3, "proc-vehicle-db-ice4": ICE4, "proc-vehicle-db-ice-t": ICE_T, "proc-vehicle-db-423": BR423,
  "proc-vehicle-db-642": BR642, "proc-vehicle-db-650": BR650, "proc-vehicle-db-vt98": VT98, "proc-vehicle-drg-svt877": SVT877,
};

export const DE_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-db-ice3", "ICE 3", ICE3, P.ice3, dbIce3, dbIce3Lod, "db-ice3", "uic"),
  seriesDesign("proc-vehicle-db-ice4", "ICE 4", ICE4, P.ice4, dbIce4, dbIce4Lod, "db-ice4", "uic"),
  seriesDesign("proc-vehicle-db-ice-t", "ICE T", ICE_T, P.iceT, dbIceT, dbIceTLod, "db-ice-t", "uic"),
  seriesDesign("proc-vehicle-db-423", "DB 423", BR423, P.br423, db423, db423Lod, "db-423", "uic"),
  seriesDesign("proc-vehicle-db-642", "DB 642 Desiro", BR642, P.br642, db642, db642Lod, "db-642", "uic"),
  seriesDesign("proc-vehicle-db-650", "RegioShuttle RS1", BR650, P.br650, db650, db650Lod, "db-650", "uic"),
  seriesDesign("proc-vehicle-db-vt98", "Uerdingen railbus VT 98", VT98, P.vt98, dbVt98, dbVt98Lod, "db-vt98", "uic"),
  {
    id: "proc-vehicle-db-ice2", title: "ICE 2", build: dbIce2, buildLod: dbIce2Lod, params: ICE2_PARAMS, catalog: EMU_CATALOG, references: "db-ice2",
    game: { weight: 78, power: 4800, maxspeed: 280, accel: null, variants: [{ params: { unit: "coach" }, weight: 53, power: 0 }, { params: { unit: "drivingTrailer" }, weight: 50, power: 0 }] },
  },
  seriesDesign("proc-vehicle-drg-svt877", "Fliegender Hamburger", SVT877, P.svt877, drgSvt877, drgSvt877Lod, "drg-svt877", "uic"),
];
