// German units on the series kit (shinkansen.ts): the ICE 3 (BR 403, its own
// cab face in deIce3.ts), the ICE 4 (BR 412), the tilting ICE T (BR 411), the
// Munich and Stuttgart S-Bahn's BR 423, the Desiro Classic (BR 642) and the
// RegioShuttle (BR 650) diesel railcars, the Uerdinger railbus (VT 98) and the
// Fliegender Hamburger (SVT 877); and the ICE 2, the ICE 1's power car and coach
// (ice1.ts) with a driving trailer on the series kit. See docs/models/germany-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { ice1, ice1Lod } from "./ice1.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, nose, NO_NOSE, striped } from "./seriesHelpers.ts";
import { ICE3 } from "./deIce3.ts";
import { ICE4 } from "./deIce4.ts";
import { ICE_T } from "./deIceT.ts";

export { ICE3 };

const ICE_WHITE = "#eceeee";
const TRAFFIC_RED = "#ec0016";


const sBahn = (title: string, number: string) => ({
  title, palette: { red: c(TRAFFIC_RED), grey: c("#d7dadc", 0.35), dark: c("#404346", 0.5), roofG: c("#bcc0c2", 0.55), skirtG: c("#404346", 0.7) },
  bands: [[0, 1.6, "red"], [1.6, 1.72, "dark"], [1.72, 2.9, "grey"], [2.9, 3.05, "red"], [3.05, 9, "grey"]] as const, roof: "roofG", skirt: "skirtG", number,
});

export const BR423: ShinkansenSeries = {
  endLength: 17.5, midLength: 16.2, W: 1.51, Y: 1.4, S: 3.3, C: 3.85, lean: 0.97, B: 0.95, A: 1.1,
  // the rounded S-Bahn front, its big windscreen leaning back
  nose: nose(1.6, 0.45, 2.4, [[0, 2.6], [0.4, 3.2], [1.2, 3.65], [1.8, 3.85]], [[0, 2.5], [0.4, 3.0], [1.2, 3.25], [1.8, 3.3]], [[0, 1.5], [0.8, 1.4]], [[0, 1.2], [0.6, 1.1]], [[0, 1.1], [0.3, 0.95]]),
  windscreen: [0.3, 1.5, 0.07, 1.2], lamps: [0.15, 1.5],
  windows: [[1.85, 2.8]], windowW: 1.4, pitch: 1.6, door: [1.15, 3.1, 1.85, 2.75], doorW: 1.4, doorCount: 2,
  bogieCentres: 11.5, wheelR: 0.43, wheelbase: 2.2, endPantograph: true, cars: [4],
  liveries: { sBahn: sBahn("S-Bahn", "423 001") },
  weight: { end: 31, middle: 28 }, power: 590, maxspeed: 140,
};

const dbRegio = (title: string, number: string) => ({
  title, palette: { red: c(TRAFFIC_RED), grey: c("#d7dadc", 0.35), roofG: c("#bcc0c2", 0.55), skirtG: c("#404346", 0.7), cabMask: c("#1d1f22", 0.3) },
  bands: [[0, 1.75, "red"], [1.75, 2.85, "grey"], [2.85, 9, "red"]] as const, roof: "roofG", skirt: "skirtG", number,
});

export const BR642: ShinkansenSeries = {
  endLength: 20.85, midLength: 20.85, W: 1.415, Y: 1.3, S: 3.15, C: 3.83, lean: 0.96, B: 0.72, A: 0.85,
  // the Desiro's rounded front, raked windscreen and low floor
  nose: nose(1.8, 0.35, 2.4, [[0, 2.4], [0.4, 3.05], [1.3, 3.6], [2.0, 3.83]], [[0, 2.3], [0.4, 2.85], [1.3, 3.1], [2.0, 3.15]], [[0, 1.5], [0.8, 1.35]], [[0, 1.25], [0.6, 1.1]], [[0, 1.15], [0.3, 0.95]]),
  windscreen: [0.35, 1.6, 0.07, 1.15], lamps: [0.2, 1.45],
  windows: [[1.6, 2.7]], windowW: 1.5, pitch: 1.75, door: [1.0, 3.0, 1.6, 2.6], doorW: 1.3,
  bogieCentres: 13.5, wheelR: 0.385, wheelbase: 2.2, traction: "diesel", cars: [2],
  liveries: { dbRegio: dbRegio("DB Regio", "642 001"), erzgebirgsbahn: { ...dbRegio("Erzgebirgsbahn", "642 039"), palette: { ...dbRegio("", "").palette, red: c("#0a6a3a") } } },
  weight: { end: 34, middle: 34 }, power: 275, maxspeed: 120,
};

export const BR650: ShinkansenSeries = {
  endLength: 25.5, midLength: 25.5, W: 1.52, Y: 1.3, S: 3.15, C: 3.85, lean: 0.96, B: 0.75, A: 0.9,
  nose: nose(0.1, 1, 2, [[0, 3.85]], [[0, 3.15]], [[0, 1.35]], [[0, 1.15]], [[0, 1.0]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.52, 2.0, 2.85, "cabMask", 1.55),
  windows: [[1.7, 2.75]], windowW: 1.5, pitch: 1.75, door: [1.05, 3.0, 1.65, 2.6], doorW: 1.3,
  bogieCentres: 17.0, wheelR: 0.385, wheelbase: 2.2, traction: "diesel", single: true,
  liveries: { dbRegio: dbRegio("DB Regio", "650 001"), odeg: { ...dbRegio("ODEG", "VT 650.62"), palette: { ...dbRegio("", "").palette, red: c("#00843d"), grey: c("#f3f3ef", 0.35) } } },
  weight: { end: 40, middle: 40 }, power: 514, maxspeed: 120,
};

export const VT98: ShinkansenSeries = {
  endLength: 13.95, midLength: 13.95, W: 1.5, Y: 1.4, S: 3.0, C: 3.28, lean: 0.97, B: 1.0, A: 1.15,
  // the railbus's upright ends, bowed in plan with wide rounded corners: the two big front
  // windows wrapping round them up to the roof dome, the lamps low at the corners, the roof lamp
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  cabFace: {
    dJoin: 0.5, dSide: 0.45, profile: [[1.0, 0.02], [1.15, 0], [2.9, 0], [3.05, 0.07], [3.18, 0.2], [3.28, 0.5]],
    corner: [[1.0, 0.5], [2.9, 0.5], [3.18, 0.3], [3.28, 0.1]], bulge: 0.1, rows: [1.0, 1.15, 1.4, 1.9, 2.0, 2.45, 2.9, 3.05, 3.18, 3.28], roofFrom: 3.0,
    masks: [{ lat: [-1.32, -0.02], y: [1.95, 2.9], r: 0.1, mat: "rubber" }, { lat: [0.02, 1.32], y: [1.95, 2.9], r: 0.1, mat: "rubber" }],
    panes: [{ lat: [-1.28, -0.07], y: [1.99, 2.86], r: 0.08 }, { lat: [0.07, 1.28], y: [1.99, 2.86], r: 0.08 }],
    lamps: [[-1.05, 1.55, 0.1, "lampHead"], [1.05, 1.55, 0.1, "lampHead"]], roofLamp: [0, 3.12, 0.08],
    wipers: [[[-0.7, 2.04], [-0.35, 2.7]], [[0.55, 2.04], [0.9, 2.7]]], first: 2.4,
  },
  windows: [[1.95, 2.75]], windowW: 1.05, pitch: 1.2, door: [1.2, 2.85, 1.95, 2.6], doorW: 0.9,
  bogieCentres: 6.0, wheelR: 0.45, wheelbase: 0, traction: "diesel", single: true, endCoupler: "buffers",
  liveries: {
    dbRed: { title: "DB red", palette: { red: c("#a9221d"), cream: c("#e8dfc4"), roofG: c("#a9221d", 0.55), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 2.85, "red"], [2.85, 9, "cream"]], roof: "roofG", skirt: "skirtG", number: "798 652" },
    orientRed: { title: "Orient red", palette: { red: c("#c8462a"), white: c("#efefea"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.7, "red"], [1.7, 1.8, "white"], [1.8, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "798 776" },
  },
  weight: { end: 21, middle: 21 }, power: 220, maxspeed: 90,
};

export const SVT877: ShinkansenSeries = {
  endLength: 20.95, midLength: 20.95, W: 1.425, Y: 1.4, S: 3.0, C: 3.6, lean: 0.95, B: 0.8, A: 1.05,
  // the streamlined 1932 front: a round snout, the windscreen in the curve of the roof
  nose: nose(2.8, 0.2, 2.0, [[0, 1.6], [0.4, 2.2], [1.4, 2.9], [2.4, 3.35], [3.2, 3.6]], [[0, 1.55], [0.4, 2.05], [1.4, 2.65], [2.4, 2.9], [3.2, 3.0]], [[0, 1.4], [1.0, 1.4]], [[0, 1.2], [1.0, 1.05]], [[0, 1.1], [0.5, 0.8]]),
  windscreen: [1.3, 2.5, 0.07, 1.0], lamps: [0.35, 1.55],
  windows: [[1.9, 2.65]], windowW: 1.3, pitch: 1.6, door: [1.2, 2.95, 1.9, 2.55], doorW: 0.8,
  bogieCentres: 14.5, wheelR: 0.5, wheelbase: 3.0, traction: "diesel", cars: [2],
  liveries: {
    drg: { title: "Violet and cream", palette: { violet: c("#4a3466"), cream: c("#e6dcc0"), roofG: c("#5b5f63", 0.6), skirtG: c("#4a3466", 0.6) }, bands: [[0, 1.85, "violet"], [1.85, 2.75, "cream"], [2.75, 9, "violet"]], roof: "roofG", skirt: "skirtG", number: "877 a" },
    dbVt04: { title: "DB VT 04", palette: { red: c("#a9221d"), cream: c("#e6dcc0"), roofG: c("#5b5f63", 0.6), skirtG: c("#2a2c2f", 0.7) }, bands: [[0, 1.85, "red"], [1.85, 2.75, "cream"], [2.75, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "VT 04 000" },
  },
  weight: { end: 39, middle: 39 }, power: 302, maxspeed: 160,
};

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
