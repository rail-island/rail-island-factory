// German units on the series kit (shinkansen.ts), each in its own module, measured on
// photographs and drawings: the ICE 3 (deIce3.ts), the ICE 4 (deIce4.ts), the tilting
// ICE T (deIceT.ts), the S-Bahn's BR 423 (deBr423.ts), the Desiro Classic BR 642
// (deBr642.ts) and the RegioShuttle BR 650 (deBr650.ts), the Uerdinger railbus VT 98
// (deVt98.ts), the Fliegender Hamburger SVT 877 (deSvt877.ts) and the ICE 2 (deIce2.ts:
// the ICE 1's power car and coach in the ICE 2's paint, its driving trailer on the series
// kit). This file is their registry. See docs/models/germany-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";
import { ICE3 } from "./deIce3.ts";
import { ICE4 } from "./deIce4.ts";
import { ICE_T } from "./deIceT.ts";
import { BR423 } from "./deBr423.ts";
import { BR642 } from "./deBr642.ts";
import { BR650 } from "./deBr650.ts";
import { VT98 } from "./deVt98.ts";
import { SVT877 } from "./deSvt877.ts";
import { ICE2_DESIGN, dbIce2, dbIce2Lod } from "./deIce2.ts";

export { ICE3, VT98, dbIce2, dbIce2Lod };

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
  ICE2_DESIGN,
  seriesDesign("proc-vehicle-drg-svt877", "Fliegender Hamburger", SVT877, P.svt877, drgSvt877, drgSvt877Lod, "drg-svt877", "uic"),
];
