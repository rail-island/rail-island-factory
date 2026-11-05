// Indian units on the series kit (shinkansen.ts): the Vande Bharat, the Namo
// Bharat (RRTS), the Mumbai suburban EMU and the MEMU, at the broad gauge's
// width narrowed to the 3.3 m gauge ("us"), and the standard-gauge Delhi Metro
// RS1. See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, nose } from "./seriesHelpers.ts";

const lv = (title: string, number: string, ...list: Array<[number, string]>): ShinkansenLivery => {
  const palette: ShinkansenLivery["palette"] = { roofG: c("#9aa0a5", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) };
  const bands: Array<[number, number, string]> = [];
  let y = 0;
  list.forEach(([top, colour], i) => { palette[`b${i}`] = c(colour); bands.push([y, top, `b${i}`]); y = top; });
  return { title, number, palette, bands, roof: "roofG", skirt: "skirtG" };
};

export const VANDE_BHARAT: ShinkansenSeries = {
  endLength: 23.0, midLength: 23.0, W: 1.62, Y: 1.35, S: 3.25, C: 4.0, lean: 0.95, B: 0.85, A: 1.05,
  // the aerodynamic nose of Train 18
  nose: nose(3.6, 0.15, 2.4, [[0, 1.5], [0.5, 2.05], [1.8, 2.85], [3.2, 3.55], [4.0, 4.0]], [[0, 1.45], [0.5, 1.95], [1.8, 2.65], [3.2, 3.1], [4.0, 3.25]], [[0, 1.35], [1.0, 1.35]], [[0, 1.15], [0.8, 1.05]], [[0, 1.05], [0.4, 0.85]]),
  windscreen: [1.6, 3.4, 0.07, 1.15], lamps: [0.5, 1.5],
  windows: [[1.95, 2.8]], windowW: 1.5, pitch: 1.8, door: [1.25, 3.05, 1.95, 2.65], doorW: 1.0,
  bogieCentres: 14.9, wheelR: 0.46, wheelbase: 2.56, cars: [4, 8],
  liveries: { whiteBlue: lv("White and blue", "22436", [1.1, "#1d3f80"], [1.75, "#f1f1ee"], [1.85, "#1d3f80"], [9, "#f1f1ee"]), saffron: lv("Saffron, grey", "20901", [1.1, "#4d5257"], [1.75, "#f1f1ee"], [1.9, "#f08a24"], [9, "#e9ebec"]) },
  weight: { end: 52, middle: 50 }, power: 1100, maxspeed: 180,
};

export const NAMO_BHARAT: ShinkansenSeries = {
  endLength: 22.5, midLength: 22.0, W: 1.6, Y: 1.3, S: 3.25, C: 4.0, lean: 0.95, B: 0.72, A: 0.9,
  nose: nose(2.6, 0.25, 2.4, [[0, 1.9], [0.4, 2.6], [1.5, 3.4], [2.8, 4.0]], [[0, 1.8], [0.4, 2.45], [1.5, 3.05], [2.8, 3.25]], [[0, 1.3], [0.8, 1.3]], [[0, 1.0], [0.6, 0.9]], [[0, 0.9], [0.3, 0.7]]),
  windscreen: [0.8, 2.4, 0.07, 1.2], lamps: [0.2, 1.4],
  windows: [[1.6, 2.7]], windowW: 1.5, pitch: 1.8, door: [1.05, 3.0, 1.6, 2.6], doorW: 1.4, doorCount: 3,
  bogieCentres: 15.0, wheelR: 0.43, wheelbase: 2.5, cars: [3, 6],
  liveries: { namoBharat: lv("Namo Bharat", "RRTS 001", [1.1, "#3a3d40"], [1.25, "#f08a24"], [9, "#d9dcde"]) },
  weight: { end: 45, middle: 42 }, power: 900, maxspeed: 180,
};

const flatEmu = (o: { number: string; title: string; colours: Array<[number, string]>; second?: [string, Array<[number, string]>]; doorCount: number; doorW: number; power: number; maxspeed: number; cars: readonly number[] }): ShinkansenSeries => ({
  endLength: 21.2, midLength: 21.0, W: 1.62, Y: 1.35, S: 3.3, C: 4.0, lean: 0.98, B: 1.0, A: 1.15,
  nose: nose(0.1, 1, 2, [[0, 4.0]], [[0, 3.3]], [[0, 1.35]], [[0, 1.15]], [[0, 1.0]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.62, 2.0, 2.85, "cabMask", 1.55),
  windows: [[1.95, 2.85]], windowW: 1.1, pitch: 1.3, door: [1.2, 3.1, 1.95, 2.7], doorW: o.doorW, doorCount: o.doorCount,
  bogieCentres: 14.6, wheelR: 0.48, wheelbase: 2.9, cars: o.cars,
  liveries: { std: lv(o.title, o.number, ...o.colours), ...(o.second ? { alt: lv(o.second[0], o.number.replace(/1$/, "5"), ...o.second[1]) } : {}) },
  weight: { end: 58, middle: 46 }, power: o.power, maxspeed: o.maxspeed,
});

export const MUMBAI_EMU = flatEmu({ number: "SIEMENS 001", title: "Mumbai suburban", colours: [[1.85, "#6a2c8e"], [2.95, "#e8dcc0"], [9, "#6a2c8e"]], second: ["Western Railway", [[1.85, "#b5232b"], [2.95, "#e8dcc0"], [9, "#b5232b"]]], doorCount: 3, doorW: 1.25, power: 920, maxspeed: 100, cars: [3, 6] });
export const MEMU = flatEmu({ number: "MEMU 001", title: "MEMU maroon", colours: [[1.85, "#6b1d24"], [2.95, "#e8dcc0"], [9, "#6b1d24"]], second: ["MEMU blue", [[1.85, "#1d3f80"], [2.95, "#e8dcc0"], [9, "#1d3f80"]]], doorCount: 2, doorW: 1.0, power: 920, maxspeed: 110, cars: [4, 8] });

export const DELHI_METRO: ShinkansenSeries = {
  endLength: 21.6, midLength: 21.3, W: 1.6, Y: 1.25, S: 3.25, C: 3.9, lean: 0.97, B: 0.75, A: 0.9,
  nose: nose(1.2, 0.5, 2.3, [[0, 2.9], [0.4, 3.45], [1.2, 3.9]], [[0, 2.8], [0.5, 3.25]], [[0, 1.25], [0.6, 1.25]], [[0, 1.0], [0.4, 0.9]], [[0, 0.9], [0.3, 0.75]]),
  windscreen: [0.1, 1.0, 0.07, 1.25], lamps: [0.05, 1.45],
  windows: [[1.75, 2.75]], windowW: 1.2, pitch: 1.45, door: [1.1, 3.05, 1.75, 2.7], doorW: 1.4, doorCount: 4,
  bogieCentres: 14.7, wheelR: 0.43, wheelbase: 2.2, cars: [4, 6, 8],
  liveries: { dmrc: lv("DMRC", "TS 01", [1.2, "#3a3d40"], [1.4, "#c8102e"], [9, "#c9cccd"]) },
  weight: { end: 42, middle: 40 }, power: 500, maxspeed: 80,
};

const P = { vb: seriesParams(VANDE_BHARAT), nb: seriesParams(NAMO_BHARAT), mumbai: seriesParams(MUMBAI_EMU), memu: seriesParams(MEMU), dmrc: seriesParams(DELHI_METRO) };

export function irVandeBharat(v?: ParamValues): MeshBuilder { return buildSeries(VANDE_BHARAT, P.vb, v); }
export function irVandeBharatLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(VANDE_BHARAT, P.vb, v); }
export function ncrtcNamoBharat(v?: ParamValues): MeshBuilder { return buildSeries(NAMO_BHARAT, P.nb, v); }
export function ncrtcNamoBharatLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(NAMO_BHARAT, P.nb, v); }
export function irMumbaiEmu(v?: ParamValues): MeshBuilder { return buildSeries(MUMBAI_EMU, P.mumbai, v); }
export function irMumbaiEmuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MUMBAI_EMU, P.mumbai, v); }
export function irMemu(v?: ParamValues): MeshBuilder { return buildSeries(MEMU, P.memu, v); }
export function irMemuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MEMU, P.memu, v); }
export function dmrcRs1(v?: ParamValues): MeshBuilder { return buildSeries(DELHI_METRO, P.dmrc, v); }
export function dmrcRs1Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(DELHI_METRO, P.dmrc, v); }

export const IN_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-ir-vande-bharat", "Vande Bharat", VANDE_BHARAT, P.vb, irVandeBharat, irVandeBharatLod, "ir-vande-bharat", "us"),
  seriesDesign("proc-vehicle-ncrtc-namo-bharat", "Namo Bharat", NAMO_BHARAT, P.nb, ncrtcNamoBharat, ncrtcNamoBharatLod, "ncrtc-namo-bharat", "us"),
  seriesDesign("proc-vehicle-ir-mumbai-emu", "Mumbai suburban EMU", MUMBAI_EMU, P.mumbai, irMumbaiEmu, irMumbaiEmuLod, "ir-mumbai-emu", "us"),
  seriesDesign("proc-vehicle-ir-memu", "IR MEMU", MEMU, P.memu, irMemu, irMemuLod, "ir-memu", "us"),
  seriesDesign("proc-vehicle-dmrc-rs1", "Delhi Metro RS1", DELHI_METRO, P.dmrc, dmrcRs1, dmrcRs1Lod, "dmrc-rs1", "us"),
];
