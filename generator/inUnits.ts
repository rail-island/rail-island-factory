// Indian units on the series kit (shinkansen.ts): the Vande Bharat, the Namo
// Bharat (RRTS), the Mumbai suburban EMU and the MEMU, at the broad gauge's
// width narrowed to the 3.3 m gauge ("us"), and the Delhi Metro RS1 (its own
// module, inDelhiMetro.ts). See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, nose } from "./seriesHelpers.ts";
import { irVandeBharat, irVandeBharatLod, VANDE_BHARAT } from "./inVandeBharat.ts";
import { DELHI_METRO, dmrcRs1, dmrcRs1Lod } from "./inDelhiMetro.ts";

export { irVandeBharat, irVandeBharatLod, VANDE_BHARAT };
export { DELHI_METRO, dmrcRs1, dmrcRs1Lod } from "./inDelhiMetro.ts";

const lv = (title: string, number: string, ...list: Array<[number, string]>): ShinkansenLivery => {
  const palette: ShinkansenLivery["palette"] = { roofG: c("#9aa0a5", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) };
  const bands: Array<[number, number, string]> = [];
  let y = 0;
  list.forEach(([top, colour], i) => { palette[`b${i}`] = c(colour); bands.push([y, top, `b${i}`]); y = top; });
  return { title, number, palette, bands, roof: "roofG", skirt: "skirtG" };
};

// the Namo Bharat lives in its own module (its cab face and livery)
import { NAMO_BHARAT, ncrtcNamoBharat, ncrtcNamoBharatLod } from "./inNamoBharat.ts";
export { NAMO_BHARAT, ncrtcNamoBharat, ncrtcNamoBharatLod };

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

const P = { vb: seriesParams(VANDE_BHARAT), nb: seriesParams(NAMO_BHARAT), mumbai: seriesParams(MUMBAI_EMU), memu: seriesParams(MEMU), dmrc: seriesParams(DELHI_METRO) };

export function irMumbaiEmu(v?: ParamValues): MeshBuilder { return buildSeries(MUMBAI_EMU, P.mumbai, v); }
export function irMumbaiEmuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MUMBAI_EMU, P.mumbai, v); }
export function irMemu(v?: ParamValues): MeshBuilder { return buildSeries(MEMU, P.memu, v); }
export function irMemuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MEMU, P.memu, v); }

export const IN_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-ir-vande-bharat", "Vande Bharat", VANDE_BHARAT, P.vb, irVandeBharat, irVandeBharatLod, "ir-vande-bharat", "us"),
  seriesDesign("proc-vehicle-ncrtc-namo-bharat", "Namo Bharat", NAMO_BHARAT, P.nb, ncrtcNamoBharat, ncrtcNamoBharatLod, "ncrtc-namo-bharat", "us"),
  seriesDesign("proc-vehicle-ir-mumbai-emu", "Mumbai suburban EMU", MUMBAI_EMU, P.mumbai, irMumbaiEmu, irMumbaiEmuLod, "ir-mumbai-emu", "us"),
  seriesDesign("proc-vehicle-ir-memu", "IR MEMU", MEMU, P.memu, irMemu, irMemuLod, "ir-memu", "us"),
  seriesDesign("proc-vehicle-dmrc-rs1", "Delhi Metro RS1", DELHI_METRO, P.dmrc, dmrcRs1, dmrcRs1Lod, "dmrc-rs1", "us"),
];
