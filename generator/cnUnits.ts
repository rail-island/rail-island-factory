// Chinese units on the series kit (shinkansen.ts): the Fuxing CR400AF and
// CR400BF, the CRH380A and CRH2A (the Shinkansen-derived noses), the CRH3C on
// the shared Velaro body, the CRH5A, the CR200J "Green Giant" and the CRH6A.
// The high-speed trains on the Shinkansen gauge, narrowed from their real
// 3.36 - 3.38 m. See docs/models/china-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, nose, velaro } from "./seriesHelpers.ts";

const lv = (title: string, number: string, ...list: Array<[number, string]>): ShinkansenLivery => {
  const palette: ShinkansenLivery["palette"] = { roofG: c("#d9dcde", 0.6), skirtG: c("#9aa0a5", 0.7), cabMask: c("#1d1f22", 0.3) };
  const bands: Array<[number, number, string]> = [];
  let y = 0;
  list.forEach(([top, colour], i) => { palette[`b${i}`] = c(colour); bands.push([y, top, `b${i}`]); y = top; });
  return { title, number, palette, bands, roof: "roofG", skirt: "skirtG" };
};
const WHITE = "#f1f1ee";

/** A long Chinese high-speed nose: its length and the crown's rise. */
const hsrNose = (len: number, C: number) => nose(len, 0.05, 2.4,
  [[0, 1.15], [len * 0.1, 1.5], [len * 0.4, 2.15], [len * 0.7, 2.85], [len * 0.92, 3.4], [len * 1.08, C]],
  [[0, 1.1], [len * 0.1, 1.4], [len * 0.4, 1.95], [len * 0.7, 2.5], [len * 0.92, 2.85], [len * 1.08, 3.0]],
  [[0, 1.05], [len * 0.25, 1.3], [len * 0.5, 1.45]], [[0, 1.0], [len * 0.25, 1.05]], [[0, 0.98], [0.6, 0.55], [2.0, 0.75]]);

const hsr = (o: { endLength: number; midLength: number; noseLen: number; C: number; liveries: ShinkansenSeries["liveries"]; power: number; maxspeed: number; weight: ShinkansenSeries["weight"] }): ShinkansenSeries => ({
  endLength: o.endLength, midLength: o.midLength, W: 1.62, Y: 1.45, S: 3.0, C: o.C, lean: 0.96, B: 0.75, A: 1.05,
  nose: hsrNose(o.noseLen, o.C), windscreen: [o.noseLen * 0.72, o.noseLen * 0.95, 0.07, 1.0], lamps: [o.noseLen * 0.25, 1.5],
  windows: [[2.0, 2.6]], windowW: 0.9, pitch: 1.04, door: [1.3, 3.05, 1.95, 2.6], doorW: 1.0,
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: o.liveries, weight: o.weight, power: o.power, maxspeed: o.maxspeed,
});

export const CR400AF = hsr({ endLength: 27.2, midLength: 25.0, noseLen: 9.0, C: 4.05, power: 1250, maxspeed: 350, weight: { end: 52, middle: 50 },
  liveries: { red: lv("Fuxing red", "CR400AF-2001", [1.7, WHITE], [1.85, "#c8102e"], [9, WHITE]), smart: lv("Fuxing gold", "CR400AF-C-2214", [1.7, WHITE], [1.85, "#c9a55a"], [9, WHITE]) } });
export const CR400BF = hsr({ endLength: 27.2, midLength: 25.0, noseLen: 9.5, C: 4.05, power: 1250, maxspeed: 350, weight: { end: 52, middle: 50 },
  liveries: { gold: lv("Fuxing gold", "CR400BF-5001", [1.7, WHITE], [1.85, "#c9a55a"], [9, WHITE]), red: lv("Fuxing red", "CR400BF-5033", [1.7, WHITE], [1.85, "#c8102e"], [9, WHITE]) } });
export const CRH380A = hsr({ endLength: 26.5, midLength: 25.0, noseLen: 11.5, C: 3.7, power: 1200, maxspeed: 350, weight: { end: 50, middle: 48 },
  liveries: { crh: lv("CRH blue", "CRH380A-6041", [1.75, WHITE], [1.9, "#1d3f80"], [9, WHITE]) } });
export const CRH2A = hsr({ endLength: 25.7, midLength: 25.0, noseLen: 7.0, C: 3.7, power: 1050, maxspeed: 250, weight: { end: 46, middle: 44 },
  liveries: { crh: lv("CRH blue", "CRH2A-2001", [1.75, WHITE], [1.9, "#1d3f80"], [9, WHITE]) } });
export const CRH3C: ShinkansenSeries = velaro({ W: 1.5, endLength: 25.675, midLength: 24.775, liveries: { crh: lv("CRH blue", "CRH3C-3001", [1.68, WHITE], [1.82, "#1d3f80"], [9, WHITE]) }, weight: { end: 55, middle: 50 }, power: 1100, maxspeed: 350 });

export const CRH5A: ShinkansenSeries = {
  endLength: 27.6, midLength: 25.0, W: 1.6, Y: 1.4, S: 3.0, C: 4.0, lean: 0.93, B: 0.8, A: 1.05,
  // the Pendolino-derived nose
  nose: nose(4.2, 0.12, 2.3, [[0, 1.4], [0.5, 1.95], [2.0, 2.7], [3.6, 3.45], [4.6, 4.0]], [[0, 1.35], [0.5, 1.85], [2.0, 2.5], [3.6, 2.9], [4.6, 3.0]], [[0, 1.3], [1.2, 1.4]], [[0, 1.1], [1.0, 1.05]], [[0, 1.05], [0.5, 0.8]]),
  windscreen: [2.4, 4.1, 0.07, 1.05], lamps: [0.6, 1.5],
  windows: [[1.95, 2.7]], windowW: 1.1, pitch: 1.3, door: [1.3, 3.05, 1.95, 2.6], doorW: 0.9,
  bogieCentres: 19.0, wheelR: 0.45, wheelbase: 2.7,
  liveries: { crh: lv("CRH blue", "CRH5A-5001", [1.75, WHITE], [1.9, "#1d3f80"], [9, WHITE]) },
  weight: { end: 55, middle: 50 }, power: 1100, maxspeed: 250,
};

export const CR200J: ShinkansenSeries = {
  endLength: 19.4, midLength: 25.5, W: 1.55, Y: 1.4, S: 3.3, C: 4.3, lean: 0.97, B: 0.9, A: 1.1,
  // the power car's rounded nose; the coaches behind it
  nose: nose(3.4, 0.2, 2.4, [[0, 1.6], [0.5, 2.2], [1.8, 3.1], [3.0, 3.85], [3.8, 4.3]], [[0, 1.55], [0.5, 2.05], [1.8, 2.8], [3.0, 3.2], [3.8, 3.3]], [[0, 1.4], [1.0, 1.4]], [[0, 1.2], [0.8, 1.1]], [[0, 1.1], [0.4, 0.9]]),
  windscreen: [1.7, 3.3, 0.07, 1.15], lamps: [0.4, 1.55],
  windows: [[1.95, 2.8]], windowW: 1.1, pitch: 1.35, door: [1.25, 3.1, 1.95, 2.65], doorW: 0.8,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, endPantograph: true, cars: [4, 8],
  liveries: { green: lv("Green Giant", "CR200J-1001", [1.6, "#0b6b3a"], [1.72, "#f2c31a"], [9, "#0b6b3a"]), whiteRed: lv("White and red", "CR200J-2001", [1.6, WHITE], [1.72, "#c8102e"], [9, WHITE]) },
  weight: { end: 85, middle: 47 }, power: 5600, maxspeed: 160,
};

export const CRH6A: ShinkansenSeries = {
  endLength: 25.5, midLength: 24.5, W: 1.6, Y: 1.35, S: 3.1, C: 4.0, lean: 0.95, B: 0.8, A: 1.0,
  nose: nose(3.6, 0.2, 2.4, [[0, 1.5], [0.5, 2.05], [1.8, 2.8], [3.2, 3.55], [4.0, 4.0]], [[0, 1.45], [0.5, 1.95], [1.8, 2.6], [3.2, 3.0], [4.0, 3.1]], [[0, 1.35], [1.0, 1.35]], [[0, 1.15], [0.8, 1.0]], [[0, 1.05], [0.4, 0.8]]),
  windscreen: [1.6, 3.4, 0.07, 1.15], lamps: [0.5, 1.5],
  windows: [[1.9, 2.75]], windowW: 1.3, pitch: 1.55, door: [1.2, 3.05, 1.9, 2.65], doorW: 1.3, doorCount: 3,
  bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.5, cars: [4, 8],
  liveries: { crh: lv("CRH red", "CRH6A-0401", [1.7, WHITE], [1.85, "#c8102e"], [9, WHITE]) },
  weight: { end: 52, middle: 48 }, power: 600, maxspeed: 200,
};

const P = { af: seriesParams(CR400AF), bf: seriesParams(CR400BF), a380: seriesParams(CRH380A), c2a: seriesParams(CRH2A), c3c: seriesParams(CRH3C), c5a: seriesParams(CRH5A), j: seriesParams(CR200J), c6a: seriesParams(CRH6A) };

export function crCr400af(v?: ParamValues): MeshBuilder { return buildSeries(CR400AF, P.af, v); }
export function crCr400afLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR400AF, P.af, v); }
export function crCr400bf(v?: ParamValues): MeshBuilder { return buildSeries(CR400BF, P.bf, v); }
export function crCr400bfLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR400BF, P.bf, v); }
export function crCrh380a(v?: ParamValues): MeshBuilder { return buildSeries(CRH380A, P.a380, v); }
export function crCrh380aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH380A, P.a380, v); }
export function crCrh2a(v?: ParamValues): MeshBuilder { return buildSeries(CRH2A, P.c2a, v); }
export function crCrh2aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH2A, P.c2a, v); }
export function crCrh3c(v?: ParamValues): MeshBuilder { return buildSeries(CRH3C, P.c3c, v); }
export function crCrh3cLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH3C, P.c3c, v); }
export function crCrh5a(v?: ParamValues): MeshBuilder { return buildSeries(CRH5A, P.c5a, v); }
export function crCrh5aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH5A, P.c5a, v); }
export function crCr200j(v?: ParamValues): MeshBuilder { return buildSeries(CR200J, P.j, v); }
export function crCr200jLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR200J, P.j, v); }
export function crCrh6a(v?: ParamValues): MeshBuilder { return buildSeries(CRH6A, P.c6a, v); }
export function crCrh6aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH6A, P.c6a, v); }

export const CN_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-cr-cr400af", "Fuxing CR400AF", CR400AF, P.af, crCr400af, crCr400afLod, "cr-cr400af"),
  seriesDesign("proc-vehicle-cr-cr400bf", "Fuxing CR400BF", CR400BF, P.bf, crCr400bf, crCr400bfLod, "cr-cr400bf"),
  seriesDesign("proc-vehicle-cr-crh380a", "CRH380A", CRH380A, P.a380, crCrh380a, crCrh380aLod, "cr-crh380a"),
  seriesDesign("proc-vehicle-cr-crh2a", "CRH2A", CRH2A, P.c2a, crCrh2a, crCrh2aLod, "cr-crh2a"),
  seriesDesign("proc-vehicle-cr-crh3c", "CRH3C", CRH3C, P.c3c, crCrh3c, crCrh3cLod, "cr-crh3c", "uic"),
  seriesDesign("proc-vehicle-cr-crh5a", "CRH5A", CRH5A, P.c5a, crCrh5a, crCrh5aLod, "cr-crh5a"),
  seriesDesign("proc-vehicle-cr-cr200j", "Fuxing CR200J", CR200J, P.j, crCr200j, crCr200jLod, "cr-cr200j", "us"),
  seriesDesign("proc-vehicle-cr-crh6a", "CRH6A", CRH6A, P.c6a, crCrh6a, crCrh6aLod, "cr-crh6a"),
];
