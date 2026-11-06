// The world propeller aircraft, freighters and flying boats (docs/models/world-aircraft.md):
// turboprop and piston airliners, light aircraft, the Antonov and Boeing
// freighters, the Beluga XL and the amphibians, each an AirframeSpec on the
// airframe kit at its real size, written as a `Brief` (worldAircraft.ts), from
// the photographs and the published figures in assets/<references>/. The ids are
// stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { airframe, airframeLod, type AirframeSpec, type Geometry } from "./airframeKit.ts";
import { colourSchemes, COLOURS, schemes, SCHEMES } from "./airlineSchemes.ts";
import { air, aircraftDesigns, brief, chosen, fixed, liveries, type WorldAircraft } from "./worldAircraft.ts";
import { lobe, closeTo, curve } from "./airframeShapes.ts";

const L = (...keys: string[]) => liveries(schemes(...keys));
const COLOUR = /* @__PURE__ */ liveries(colourSchemes(...COLOURS), "colour", "Colour");

/** A gear parameter: wheels and the other choices named. */
const gearParam = (...values: Array<[string, string]>): ParamSpec => ({ name: "gear", title: "Gear", default: values[0]![0], values: values.map(([value, title]) => ({ value, title })) });
const gearOf = (ps: ParamSpec, p?: ParamValues): string => resolveParams([ps], p).gear!;

// ---------------------------------------------------------------------------
// Turboprop airliners

const YS11 = /* @__PURE__ */ L("ana", "jalClassic", "olympic");
export const namcYs11Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 26.3, H: 8.99, W: 2.88, D: 2.88, k: 1.1, nose: "blunt", tl: 8,
  span: 32.0, root: 3.8, tip: 1.5, sweep: 3, dih: 6, at: 9.5,
  eng: [{ kind: "prop", style: "turboprop", s: [5.0], r: 0.6, len: 5.5, blades: 4, prop: 2.2, ahead: 2.6 }],
  fin: [4.4, 1.4, 30, 20.0, 2.5], tp: [11.0, 2.6, 1.2, 10, 22.0, 0],
  ng: [3.0, 0.33, true], mg: [[11.6, 5.0, 0.5, true, undefined, 1.6]],
  win: [[5, 19, 0.85, 0.62, 0.16, 0.2, "rect"]], doors: [4.0, 20.5],
}), ...chosen(YS11, p) });

/** The ATR's lengths: the 42 and the 72. */
const ATR_LENGTH: ParamSpec = { name: "length", title: "Length", default: "72", values: [{ value: "42", title: "ATR 42" }, { value: "72", title: "ATR 72" }] };
const ATR = /* @__PURE__ */ L("airFrance", "alitalia", "malaysia");
export const atr72Spec = (p?: ParamValues): AirframeSpec => {
  const short = resolveParams([ATR_LENGTH, ...ATR.params], p).length === "42";
  const [l, span, at, base] = short ? [22.67, 24.57, 8.6, 8.78] : [27.17, 27.05, 10.6, 10.77];
  return { ...brief({
    L: l, H: 7.65, W: 2.57, D: 2.6, k: 0.55, nose: "blunt", tl: 7.5, ty: 0.75,
    span, root: 2.6, tip: 1.45, sweep: 3, dih: 2, at, pos: "high",
    eng: [{ kind: "prop", style: "turboprop", s: [short ? 4.05 : 4.1], r: 0.55, len: 4.6, blades: 6, prop: 1.95 }],
    tk: "T", fin: [4.0, 2.0, 38, l - 5.9, 2.0], tp: [7.31, 1.8, 1.1, 12, 0],
    ng: [2.3, 0.33, true], mg: [[2.3 + base, 2.05, 0.43, true, undefined, 1.05]], gx: { fairing: { d0: 1.3 + base, d1: 4.6 + base, hw: 1.65, h: 0.95 } },
    win: [[4.0, l - 6.2, 0.78, 0.6, 0.14, 0.2]], doors: [3.0, l - 5.2],
  }), ...chosen(ATR, p, [ATR_LENGTH]) };
};

const DASH8 = /* @__PURE__ */ L("alaska", "airCanada", "sas");
export const dhcDash8Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 32.81, H: 8.34, W: 2.69, D: 2.69, k: 0.95, nose: "blunt", ns: 1.1, tl: 8.5,
  span: 28.42, root: 3.1, tip: 1.3, sweep: 3, dih: 2.5, at: 13.0, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [4.2], r: 0.62, len: 6.5, blades: 6, prop: 2.05, ahead: 2.6 }],
  tk: "T", fin: [4.5, 2.6, 35, 25.3, 2], tp: [9.3, 2.0, 1.2, 15, 0],
  ng: [2.5, 0.35, true], mg: [[16.4, 4.2, 0.5, true, undefined, 2.5]],
  win: [[5, 27, 0.8, 0.6, 0.14, 0.2]], doors: [3.5, 29.0],
}), ...chosen(DASH8, p) });

const TWIN_OTTER_GEAR = /* @__PURE__ */ gearParam(["wheels", "Wheels"], ["floats", "Floats"], ["skis", "Skis"]);
export const dhcTwinOtterSpec = (p?: ParamValues): AirframeSpec => {
  const gear = gearOf(TWIN_OTTER_GEAR, p);
  const k = gear === "floats" ? 1.85 : gear === "skis" ? 0.67 : 0.55;
  return { ...brief({
    L: 15.77, H: 5.94 + (k - 0.55), W: 1.6, D: 1.65, k, nose: "blunt", ns: 1.5, tl: 6.5, corner: 0.3, n: 24,
    span: 19.81, root: 1.98, tip: 1.98, sweep: 0, dih: 3, at: 5.2, pos: "high", strut: 0.42, thick: [0.16, 0.14],
    eng: [{ kind: "prop", style: "turboprop", s: [3.2], r: 0.38, len: 3.0, blades: 3, prop: 1.3, ahead: 1.5 }],
    fin: [2.4, 1.6, 25, 12.9, 1], tp: [6.3, 1.6, 1.4, 0, 13.5, 0],
    gk: gear === "floats" ? "floats" : gear === "skis" ? "skis" : "tricycle", retract: false,
    ng: [1.8, 0.3], mg: [[6.3, 1.85, 0.4]], ...(gear === "floats" ? { gx: { floats: { len: 9.0, d: 0.4, track: 3.2, depth: 1.1 } } } : {}),
    win: [[3.5, 10, 0.75, 0.6, 0.18, 0.16, "rect"]], doors: [10.8],
  }), ...fixed(SCHEMES, "coastGuard") };
};

const BEAVER_GEAR = /* @__PURE__ */ gearParam(["wheels", "Wheels"], ["floats", "Floats"]);
export const dhcBeaverSpec = (p?: ParamValues): AirframeSpec => {
  const floats = gearOf(BEAVER_GEAR, p) === "floats";
  const k = floats ? 1.75 : 0.75;
  return { ...brief({
    L: 9.22, H: 2.74 + (k - 0.75), W: 1.25, D: 1.45, k, nose: "cowl", tl: 5.0, ty: 0.6, corner: 0.3, n: 24,
    span: 14.63, root: 1.59, tip: 1.59, sweep: 0, dih: 2, at: 2.4, pos: "high", strut: 0.5, thick: [0.16, 0.14],
    eng: [{ kind: "prop", style: "radial", s: [0], r: 0.65, len: 1.0, blades: 3, prop: 1.3 }],
    fin: [1.5, 0.9, 25, 7.8, 1], tp: [4.8, 1.2, 1.0, 5, 8.0],
    gk: floats ? "floats" : "taildragger", retract: false,
    ng: [8.9, 0.15], mg: [[2.2, 1.3, 0.38]], ...(floats ? { gx: { floats: { len: 7.6, d: -0.4, track: 2.7, depth: 0.95 } } } : {}),
    win: [[2.3, 3.8, 0.7, 0.75, 0.25, 0.18, "rect"]], doors: [],
  }), ...fixed(SCHEMES, "bush") };
};

const SAAB340 = /* @__PURE__ */ L("sas", "swissair", "finnair");
export const saab340Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 19.73, H: 6.97, W: 2.31, D: 2.31, k: 0.8, nose: "blunt", ns: 1.2, tl: 6.5,
  span: 21.44, root: 3.1, tip: 1.3, sweep: 3, dih: 7, at: 7.8,
  eng: [{ kind: "prop", style: "turboprop", s: [3.4], r: 0.5, len: 4.2, blades: 4, prop: 1.7, ahead: 2.0 }],
  fin: [3.7, 1.5, 30, 15.3, 2], tp: [9.24, 1.8, 1.0, 10, 16.8],
  ng: [2.0, 0.28, true], mg: [[9.1, 3.4, 0.4, true, undefined, 1.25]],
  win: [[4, 15, 0.75, 0.6, 0.14, 0.18]], doors: [3.0],
}), ...chosen(SAAB340, p) });

const SAAB2000 = /* @__PURE__ */ L("swissair", "swiss");
export const saab2000Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 27.28, H: 7.73, W: 2.31, D: 2.31, k: 0.95, nose: "blunt", ns: 1.3, tl: 7.5,
  span: 24.76, root: 3.2, tip: 1.2, sweep: 3, dih: 7, at: 10.5,
  eng: [{ kind: "prop", style: "turboprop", s: [3.9], r: 0.55, len: 4.8, blades: 6, prop: 1.9, ahead: 2.2 }],
  fin: [4.1, 1.8, 30, 21.6, 2], tp: [10.3, 2.0, 1.0, 10, 23.2],
  ng: [2.4, 0.3, true], mg: [[13.3, 3.9, 0.42, true, undefined, 1.3]],
  win: [[4, 22, 0.75, 0.6, 0.14, 0.18]], doors: [3.0],
}), ...chosen(SAAB2000, p) });

const F27 = /* @__PURE__ */ L("klm", "aerLingus", "sabena");
export const fokkerF27Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 23.56, H: 8.5, W: 2.7, D: 2.7, k: 0.95, nose: "blunt", tl: 7.5,
  span: 29.0, root: 3.45, tip: 1.4, sweep: 2, dih: 2.5, at: 9.0, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [3.7], r: 0.58, len: 5.5, blades: 4, prop: 1.75, ahead: 2.4 }],
  fin: [3.8, 1.5, 30, 18.3, 2], tp: [9.75, 2.0, 1.1, 8, 19.8],
  ng: [2.0, 0.33, true], mg: [[10.7, 3.7, 0.5, true, undefined, 2.6]],
  win: [[4, 18, 0.9, 0.6, 0.2, 0.3]], doors: [3.0, 18.0],
}), ...chosen(F27, p) });

const F50 = /* @__PURE__ */ L("klm", "sas", "austrian");
export const fokker50Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 25.25, H: 8.32, W: 2.7, D: 2.7, k: 0.95, nose: "blunt", tl: 7.5,
  span: 29.0, root: 3.45, tip: 1.4, sweep: 2, dih: 2.5, at: 9.7, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [3.7], r: 0.55, len: 5.0, blades: 6, prop: 1.83, ahead: 2.4 }],
  fin: [3.8, 1.5, 30, 20.0, 2], tp: [9.75, 2.0, 1.1, 8, 21.5],
  ng: [2.0, 0.33, true], mg: [[11.4, 3.7, 0.5, true, undefined, 2.6]],
  win: [[4, 19, 0.6, 0.6, 0.14, 0.2, "rect"]], doors: [3.0, 19.8],
}), ...chosen(F50, p) });

const EMB120 = /* @__PURE__ */ L("delta", "united", "embraer");
export const embraerBrasiliaSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 20.0, H: 6.35, W: 2.28, D: 2.28, k: 0.85, nose: "blunt", ns: 1.2, tl: 6.5,
  span: 19.78, root: 2.6, tip: 1.2, sweep: 3, dih: 6.5, at: 7.8,
  eng: [{ kind: "prop", style: "turboprop", s: [3.3], r: 0.5, len: 4.2, blades: 4, prop: 1.6, ahead: 2.0 }],
  tk: "T", fin: [3.5, 2.0, 35, 15.7, 1.5], tp: [6.9, 1.6, 0.9, 15, 0],
  ng: [2.0, 0.28, true], mg: [[8.9, 3.3, 0.4, true, undefined, 1.25]],
  win: [[4, 15, 0.7, 0.6, 0.13, 0.17]], doors: [3.0, 16],
}), ...chosen(EMB120, p) });

const EMB110 = /* @__PURE__ */ L("embraer", "navyBand");
export const embraerBandeiranteSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 15.1, H: 4.92, W: 1.65, D: 1.65, k: 0.7, nose: "blunt", ns: 1.6, tl: 5.5, n: 28,
  span: 15.33, root: 2.0, tip: 1.4, sweep: 0, dih: 7, at: 5.8,
  eng: [{ kind: "prop", style: "turboprop", s: [2.5], r: 0.38, len: 3.4, blades: 3, prop: 1.18, ahead: 1.6 }],
  fin: [2.4, 1.0, 30, 11.6, 1.2], tp: [6.6, 1.5, 1.0, 0, 12.6, 6],
  ng: [1.9, 0.25], mg: [[6.8, 2.5, 0.33, false, undefined, 1.0]],
  win: [[4, 10, 0.8, 0.6, 0.15, 0.15, "rect"]], doors: [10.5],
}), ...chosen(EMB110, p) });

const L410 = /* @__PURE__ */ L("csa", "aeroflot", "navyBand");
export const letL410Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 14.42, H: 5.83, W: 2.08, D: 1.92, k: 0.65, nose: "blunt", ns: 1.2, tl: 5.5, corner: 0.35, n: 24,
  span: 19.98, root: 2.5, tip: 1.2, sweep: 0, dih: 1.75, at: 5.0, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [2.3], r: 0.4, len: 3.2, blades: 5, prop: 1.15, ahead: 1.6 }],
  fin: [2.7, 1.4, 30, 11.3, 1.5], tp: [6.7, 1.6, 1.0, 0, 12.0, 7],
  ng: [1.8, 0.28], mg: [[6.3, 1.5, 0.4, false, undefined, 0.95]], gx: { fairing: { d0: 5.3, d1: 7.6, hw: 1.3, h: 0.7 } },
  win: [[4, 9.5, 0.65, 0.62, 0.2, 0.18, "rect"]], doors: [10.4],
}), ...chosen(L410, p) });

const MA60 = /* @__PURE__ */ L("chinaSouthern", "garuda", "plain");
export const xianMa60Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 24.71, H: 8.85, W: 2.9, D: 2.9, k: 0.95, nose: "blunt", tl: 7.5,
  span: 29.2, root: 3.4, tip: 1.45, sweep: 3, dih: 0, at: 9.5, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [3.9], r: 0.6, len: 5.8, blades: 4, prop: 1.95, ahead: 2.4 }],
  fin: [4.4, 1.6, 32, 19.0, 2.5], tp: [9.08, 2.2, 1.2, 10, 20.5, 9],
  ng: [2.5, 0.35, true], mg: [[10.4, 3.9, 0.5, true, undefined, 2.6]],
  win: [[4, 18, 0.8, 0.6, 0.16, 0.16, "round"]], doors: [3.5, 19.5],
}), ...chosen(MA60, p) });

const AN24 = /* @__PURE__ */ L("aeroflot", "interflug", "cubana");
export const antonovAn24Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 23.53, H: 8.32, W: 2.9, D: 2.9, k: 0.95, nose: "glazed", tl: 7.5,
  span: 29.2, root: 3.5, tip: 1.45, sweep: 3, dih: 0, at: 9.5, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [3.9], r: 0.62, len: 6.0, blades: 4, prop: 1.95, ahead: 2.4 }],
  fin: [4.5, 1.6, 32, 18.0, 2.5], tp: [9.08, 2.2, 1.2, 10, 19.5, 9],
  ng: [2.5, 0.35, true], mg: [[10.4, 3.9, 0.55, true, undefined, 2.6]],
  win: [[4, 17, 0.85, 0.6, 0.16, 0.16, "round"]], doors: [17.5],
}), ...chosen(AN24, p) });

const IL18 = /* @__PURE__ */ L("aeroflot", "interflug", "csa");
export const ilyushinIl18Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 35.9, H: 10.17, W: 3.5, D: 3.5, k: 1.25, nose: "blunt", ns: 1.2, tl: 9.5,
  span: 37.4, root: 5.6, tip: 1.8, sweep: 3, dih: 3, at: 12.5,
  eng: [{ kind: "prop", style: "turboprop", s: [5.8, 10.8], r: 0.65, len: 6.0, blades: 4, prop: 2.25, ahead: 2.8 }],
  fin: [5.6, 1.8, 30, 27.5, 3], tp: [11.8, 3.0, 1.4, 10, 30.0, 0],
  ng: [3.0, 0.4, true], mg: [[15.8, 5.8, 0.55, true, 2, 2.3]],
  win: [[5, 27, 0.9, 0.6, 0.16, 0.16, "round"]], doors: [5.0, 26],
}), ...chosen(IL18, p) });

const VISCOUNT = /* @__PURE__ */ L("bea", "aerLingus", "lufthansa");
export const vickersViscountSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 26.11, H: 8.15, W: 3.0, D: 3.0, k: 1.15, nose: "blunt", ns: 1.1, tl: 8,
  span: 28.56, root: 4.6, tip: 1.6, sweep: 2, dih: 7, at: 9.0,
  eng: [{ kind: "prop", style: "turboprop", s: [3.5, 7.0], r: 0.48, len: 4.5, blades: 4, prop: 1.5, ahead: 2.0 }],
  fin: [4.2, 1.3, 30, 20.3, 2.5], tp: [9.5, 2.3, 1.2, 5, 21.8, 8],
  ng: [2.5, 0.33, true], mg: [[11.0, 3.5, 0.5, true, undefined, 1.6]],
  win: [[4.5, 19, 1.1, 0.6, 0.3, 0.4]], doors: [3.3, 20],
}), ...chosen(VISCOUNT, p) });

const ELECTRA = /* @__PURE__ */ L("eastern", "american", "klm");
export const lockheedElectraSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 31.85, H: 10.0, W: 3.45, D: 3.45, k: 1.3, nose: "blunt", ns: 1.1, tl: 8.5,
  span: 30.18, root: 4.8, tip: 1.7, sweep: 0, dih: 6, at: 11.0,
  eng: [{ kind: "prop", style: "turboprop", s: [4.4, 9.0], r: 0.6, len: 6.0, blades: 4, prop: 2.06, ahead: 3.0 }],
  fin: [5.0, 1.8, 30, 25.0, 2], tp: [13.0, 3.0, 1.5, 8, 27.0, 0],
  ng: [3.0, 0.4, true], mg: [[14.6, 4.4, 0.55, true, undefined, 1.9]],
  win: [[5, 25, 0.9, 0.6, 0.16, 0.2, "rect"]], doors: [4.5, 25.5],
}), ...chosen(ELECTRA, p) });

// ---------------------------------------------------------------------------
// Piston airliners

const DC3 = /* @__PURE__ */ L("american", "klm", "swissair");
export const douglasDc3Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 19.7, H: 5.16, W: 2.35, D: 2.5, k: 1.35, nose: "blunt", ns: 1.15, tl: 8.5, ty: 0.68,
  span: 29.0, root: 4.4, tip: 1.3, sweep: 12, dih: 6, at: 5.6, thick: [0.16, 0.1],
  eng: [{ kind: "prop", style: "radial", s: [2.9], r: 0.72, len: 2.6, blades: 3, prop: 1.75, ahead: 2.4 }],
  fin: [3.8, 1.1, 32, 15.0, 2.8], tp: [8.2, 2.7, 1.0, 10, 16.4],
  gk: "taildragger", ng: [18.4, 0.3], mg: [[6.6, 2.9, 0.72, false, undefined, 1.6]],
  win: [[5.0, 13.0, 0.95, 0.6, 0.22, 0.18, "rect"]], doors: [14.5],
}), ...chosen(DC3, p) });

const DC6 = /* @__PURE__ */ L("panAm", "sas", "sabena");
export const douglasDc6Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 32.18, H: 8.74, W: 3.15, D: 3.15, k: 1.6, nose: "blunt", ns: 1.1, tl: 9,
  span: 35.81, root: 5.5, tip: 1.8, sweep: 5, dih: 6, at: 11.0,
  eng: [{ kind: "prop", style: "radial", s: [5.0, 9.5], r: 0.85, len: 3.0, blades: 3, prop: 2.0, ahead: 2.6 }],
  fin: [5.5, 1.5, 30, 25.5, 3], tp: [13.5, 3.2, 1.3, 8, 27.5, 0],
  ng: [3.0, 0.45, true], mg: [[14.2, 5.0, 0.65, true, undefined, 2.0]],
  win: [[5, 25, 1.0, 0.6, 0.2, 0.2, "rect"]], doors: [25.5],
}), ...chosen(DC6, p) });

const CONNIE = /* @__PURE__ */ L("twa", "lufthansa", "airFrance");
export const lockheedConstellationSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 35.42, H: 7.54, W: 3.5, D: 3.5, k: 1.7, nose: "blunt", ns: 1.5, tl: 11, ty: 0.65,
  span: 37.49, root: 5.6, tip: 1.8, sweep: 5, dih: 7, at: 12.5,
  eng: [{ kind: "prop", style: "radial", s: [5.0, 9.6], r: 0.9, len: 3.2, blades: 3, prop: 2.3, ahead: 2.8 }],
  tk: "triple", fin: [3.8, 2.4, 5, 31.0], tp: [15.0, 4.0, 2.0, 0, 30.5, 8],
  ng: [3.0, 0.45, true], mg: [[15.0, 5.0, 0.65, true, undefined, 2.0]],
  win: [[5, 27, 0.9, 0.6, 0.18, 0.2, "rect"]], doors: [27],
}), ...chosen(CONNIE, p) });

const B377 = /* @__PURE__ */ L("panAm", "boac", "united");
export const boeing377Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 33.63, H: 11.66, W: 3.0, D: 3.0, k: 1.6, nose: "blunt", ns: 1.1, tl: 9.5,
  hump: { start: 0.9, full: 6.5, end: 29, crown: 5.95, hw: 1.7 },
  span: 43.05, root: 6.0, tip: 2.0, sweep: 3, dih: 5, at: 11.0,
  eng: [{ kind: "prop", style: "radial", s: [5.0, 10.4], r: 0.85, len: 3.4, blades: 4, prop: 2.1, ahead: 2.6 }],
  fin: [6.0, 1.8, 25, 26.5, 3], tp: [14.0, 3.6, 1.5, 5, 28.5, 0],
  ng: [3.5, 0.45, true], mg: [[14.2, 4.8, 0.7, true, undefined, 2.0]],
  win: [[5, 27, 1.0, 1.08, 0.2, 0.22, "rect"]], doors: [27],
}), ...chosen(B377, p) });

/** The Trimotor's three radials: one on the nose, two slung under the wing. */
export const fordTrimotorSpec = (): AirframeSpec => ({ ...brief({
  L: 15.32, H: 3.86, W: 1.6, D: 1.9, k: 0.9, nose: "cowl", tl: 6.5, ty: 0.6, corner: 0.25, n: 24,
  span: 23.72, root: 4.0, tip: 2.0, sweep: 0, dih: 0, at: 4.0, pos: "high", thick: [0.2, 0.14],
  eng: [{ kind: "prop", style: "radial", s: [0], r: 0.6, len: 0.8, blades: 2, prop: 1.4 }, { kind: "prop", style: "radial", s: [3.0], r: 0.55, len: 1.0, blades: 2, prop: 1.35, ahead: 1.6, drop: 1.0 }],
  fin: [2.2, 1.4, 15, 13.6], tp: [6.0, 1.6, 1.2, 0, 14.0],
  gk: "taildragger", retract: false, ng: [15.0, 0.15], mg: [[4.5, 2.6, 0.45]],
  win: [[4, 8.5, 0.7, 0.62, 0.22, 0.18, "rect"]], doors: [9.5],
}), ...fixed(SCHEMES, "bareMetal") });

const JU52 = /* @__PURE__ */ L("bareMetal", "lufthansa");
export const junkersJu52Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 18.9, H: 4.5, W: 1.95, D: 2.2, k: 1.0, nose: "cowl", tl: 8.5, ty: 0.6, corner: 0.2, n: 24,
  span: 29.25, root: 5.0, tip: 2.0, sweep: 5, dih: 4, at: 4.5, thick: [0.18, 0.12],
  eng: [{ kind: "prop", style: "radial", s: [0], r: 0.7, len: 1.0, blades: 3, prop: 1.4 }, { kind: "prop", style: "radial", s: [4.3], r: 0.62, len: 1.5, blades: 3, prop: 1.4, ahead: 1.8 }],
  fin: [2.8, 1.2, 20, 16.5], tp: [7.0, 2.0, 1.2, 0, 17.0],
  gk: "taildragger", retract: false, ng: [18.4, 0.15], mg: [[4.0, 2.6, 0.5]], gx: { spats: true },
  win: [[4, 10, 0.8, 0.62, 0.22, 0.2, "rect"]], doors: [11],
}), ...chosen(JU52, p) });

export const dhDragonRapideSpec = (): AirframeSpec => ({ ...brief({
  L: 10.52, H: 3.12, W: 1.3, D: 1.5, k: 0.7, nose: "blunt", ns: 1.3, tl: 5.0, corner: 0.3, n: 24,
  span: 13.0, root: 1.7, tip: 1.0, sweep: 0, dih: 3, at: 2.8, thick: [0.12, 0.1],
  upper: { gap: 1.55, span: 14.63, chord: 1.9, stagger: 0.4, struts: [0.32, 0.62] },
  eng: [{ kind: "prop", style: "inline", s: [1.9], r: 0.38, len: 1.8, blades: 2, prop: 1.0, ahead: 1.4 }],
  fin: [1.5, 0.8, 25, 9.2, 0.8], tp: [4.3, 1.1, 0.8, 0, 9.4],
  gk: "taildragger", retract: false, ng: [10.2, 0.12], mg: [[2.6, 1.85, 0.4, false, undefined, 0.9]], gx: { spats: true },
  win: [[2.3, 5.3, 0.7, 0.65, 0.2, 0.16, "rect"]], doors: [6.3],
}), ...fixed(SCHEMES, "vintage") });

const ISLANDER = /* @__PURE__ */ L("navyBand", "coastGuard", "plain");
export const bnIslanderSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 10.86, H: 4.18, W: 1.2, D: 1.3, k: 0.62, nose: "blunt", ns: 1.4, tl: 5.0, corner: 0.3, n: 24,
  span: 14.94, root: 2.03, tip: 2.03, sweep: 0, dih: 0, at: 3.6, pos: "high", thick: [0.15, 0.14],
  eng: [{ kind: "prop", style: "inline", s: [1.8], r: 0.35, len: 2.5, blades: 2, prop: 0.98, ahead: 1.4 }],
  fin: [1.9, 1.1, 25, 9.0, 1], tp: [4.67, 1.4, 1.2, 0, 9.4],
  retract: false, ng: [1.0, 0.25], mg: [[4.0, 1.8, 0.3, false, undefined, 1.45]],
  win: [[2.5, 6.5, 0.9, 0.62, 0.25, 0.2, "rect"]], doors: [3.0, 5.0],
}), ...chosen(ISLANDER, p) });

// ---------------------------------------------------------------------------
// Light aircraft and business turboprops

const PC12 = /* @__PURE__ */ L("rfds", "navyBand", "plain");
export const pilatusPc12Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 14.4, H: 4.26, W: 1.52, D: 1.6, k: 0.7, nose: "cowl", tl: 5.0, n: 28,
  span: 16.28, root: 2.3, tip: 1.2, sweep: 2, dih: 6, at: 5.4, dev: "blended", dh: 0.8,
  eng: [{ kind: "prop", style: "turboprop", s: [0], r: 0.45, len: 1.8, blades: 4, prop: 1.34 }],
  tk: "T", fin: [2.6, 1.6, 40, 11.5, 1.5], tp: [5.2, 1.4, 0.8, 15, 0],
  ng: [1.6, 0.25], mg: [[5.9, 1.8, 0.32]],
  win: [[5, 8.3, 0.65, 0.62, 0.17, 0.17, "rect"]], doors: [9.5],
}), ...chosen(PC12, p) });

const C172 = COLOUR;
export const cessna172Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 8.28, H: 2.72, W: 1.1, D: 1.3, k: 0.62, nose: "cowl", tl: 4.6, ty: 0.55, corner: 0.35, n: 24,
  span: 11.0, root: 1.63, tip: 1.13, sweep: 0, dih: 1.7, at: 2.0, pos: "high", strut: 0.55,
  eng: [{ kind: "prop", style: "inline", s: [0], r: 0.45, len: 1.2, blades: 2, prop: 0.96 }],
  fin: [1.4, 0.65, 35, 6.4, 1.0], tp: [3.45, 1.15, 0.8, 5, 7.0],
  retract: false, ng: [0.75, 0.2], mg: [[2.45, 1.25, 0.26]], gx: { spats: true },
  win: [[2.1, 3.3, 0.6, 0.75, 0.28, 0.2, "rect"]], doors: [],
}), ...chosen(C172, p) });

const CARAVAN_GEAR = /* @__PURE__ */ gearParam(["wheels", "Wheels"], ["floats", "Amphibian floats"]);
export const cessnaCaravanSpec = (p?: ParamValues): AirframeSpec => {
  const floats = gearOf(CARAVAN_GEAR, p) === "floats";
  const k = floats ? 1.95 : 0.85;
  return { ...brief({
    L: 11.46, H: 4.53 + (k - 0.85), W: 1.65, D: 1.6, k, nose: "cowl", tl: 5.5, ty: 0.6, corner: 0.3, n: 24,
    span: 15.88, root: 1.98, tip: 1.25, sweep: 0, dih: 3, at: 3.6, pos: "high", strut: 0.5,
    eng: [{ kind: "prop", style: "turboprop", s: [0], r: 0.42, len: 2.0, blades: 3, prop: 1.06 }],
    fin: [2.2, 1.0, 30, 9.2, 1.5], tp: [6.25, 1.5, 1.0, 5, 9.9],
    gk: floats ? "floats" : "tricycle", retract: false, ng: [1.0, 0.28], mg: [[4.2, 1.8, 0.35]],
    ...(floats ? { gx: { floats: { len: 9.0, d: -0.2, track: 3.0, depth: 1.15 } } } : {}),
    win: [[3.6, 7.0, 0.7, 0.62, 0.2, 0.17, "rect"]], doors: [7.8],
  }), ...fixed(SCHEMES, "navyBand") };
};

export const piperCherokeeSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 7.25, H: 2.22, W: 1.1, D: 1.2, k: 0.55, nose: "cowl", tl: 4.0, ty: 0.55, corner: 0.35, n: 24,
  span: 9.14, root: 1.6, tip: 1.6, sweep: 0, dih: 7, at: 2.0, thick: [0.14, 0.13],
  eng: [{ kind: "prop", style: "inline", s: [0], r: 0.42, len: 1.1, blades: 2, prop: 0.94 }],
  fin: [1.3, 0.6, 40, 5.8, 0.8], tp: [3.8, 0.8, 0.8, 0, 6.3],
  retract: false, ng: [0.7, 0.2], mg: [[2.6, 1.55, 0.22]], gx: { spats: true },
  win: [[1.8, 2.6, 0.55, 0.78, 0.22, 0.16, "rect"]], doors: [],
}), ...chosen(COLOUR, p) });

export const beechKingAirSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 14.22, H: 4.37, W: 1.37, D: 1.45, k: 0.75, nose: "bizjet", tl: 5.2, n: 28,
  span: 17.65, root: 2.4, tip: 1.1, sweep: 2, dih: 6, at: 5.2, dev: "blended", dh: 0.8,
  eng: [{ kind: "prop", style: "turboprop", s: [2.6], r: 0.42, len: 3.8, blades: 4, prop: 1.2, ahead: 1.6 }],
  tk: "T", fin: [2.8, 1.6, 40, 11.0, 1.5], tp: [5.6, 1.3, 0.8, 10, 0],
  ng: [1.6, 0.25], mg: [[6.3, 2.6, 0.33, false, undefined, 1.0]],
  win: [[5, 10, 0.75, 0.6, 0.16, 0.17]], doors: [10.5],
}), ...chosen(COLOUR, p) });

// ---------------------------------------------------------------------------
// Freighters

const AN124 = /* @__PURE__ */ L("antonov", "volgaDnepr");
export const antonovAn124Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 69.1, H: 20.78, W: 7.3, D: 7.6, k: 1.4, nose: "airliner", ns: 0.9, tl: 18, ty: 0.78,
  span: 73.3, root: 15.5, kink: [0.3, 9.5], tip: 3.0, sweep: 35, dih: -3, at: 24.0, pos: "shoulder",
  eng: [{ kind: "pod", s: [9.5, 17.5], r: 1.45, len: 6.0, ahead: 4.0, drop: 1.1 }],
  fin: [11.0, 4.2, 40, 53.5, 3], tp: [27.0, 8.5, 2.5, 35, 56.0, 0],
  ng: [7.0, 0.65, true], mg: [30, 32.5, 35, 37.5, 40].map((d): [number, number, number, boolean] => [d, 3.7, 0.65, true]),
  gx: { fairing: { d0: 28, d1: 42, hw: 4.6, h: 2.2 } },
  win: [[8, 20, 1.5, 0.92, 0.12, 0.12, "round"]], doors: [6.5, 45], cargo: false,
}), ...chosen(AN124, p) });

export const antonovAn225Spec = (): AirframeSpec => ({ ...brief({
  L: 84.0, H: 18.1, W: 7.3, D: 7.6, k: 1.5, nose: "airliner", ns: 0.9, tl: 18, ty: 0.78,
  span: 88.4, root: 17.0, kink: [0.3, 10.0], tip: 3.2, sweep: 35, dih: -3, at: 28.0, pos: "shoulder", flaps: true,
  eng: [{ kind: "pod", s: [9.3, 17.0, 24.6], r: 1.45, len: 6.0, ahead: 4.0, drop: 1.1 }],
  tk: "twin", fin: [8.5, 4.0, 35, 70.0], tp: [32.65, 9.0, 4.0, 10, 68.5, 8, 9.6],
  ng: [7.5, 0.65, true], mg: [31, 33.5, 36, 38.5, 41, 43.5, 46].map((d): [number, number, number, boolean] => [d, 3.8, 0.65, true]),
  gx: { fairing: { d0: 29, d1: 48, hw: 4.6, h: 2.2 } },
  win: [[8, 20, 1.5, 0.92, 0.12, 0.12, "round"]], doors: [6.5, 50],
}), ...fixed(SCHEMES, "antonov") });

const AN2_GEAR = /* @__PURE__ */ gearParam(["wheels", "Wheels"], ["floats", "Floats"]);
export const antonovAn2Spec = (p?: ParamValues): AirframeSpec => {
  const floats = gearOf(AN2_GEAR, p) === "floats";
  const k = floats ? 2.25 : 1.1;
  return { ...brief({
    L: 12.4, H: 4.1 + (k - 1.1), W: 1.6, D: 1.8, k, nose: "cowl", tl: 6.0, ty: 0.6, corner: 0.3, n: 24,
    span: 14.24, root: 2.3, tip: 2.3, sweep: 0, dih: 2, at: 2.4, thick: [0.12, 0.11],
    upper: { gap: 2.0, span: 18.18, chord: 2.45, stagger: 0.4, struts: [0.55] },
    eng: [{ kind: "prop", style: "radial", s: [0], r: 0.7, len: 1.0, blades: 4, prop: 1.8 }],
    fin: [2.2, 1.3, 25, 10.4, 1], tp: [7.2, 1.9, 1.3, 0, 10.9],
    gk: floats ? "floats" : "taildragger", retract: false, ng: [12.0, 0.2], mg: [[2.6, 1.7, 0.45]],
    ...(floats ? { gx: { floats: { len: 9.4, d: 0.3, track: 3.4, depth: 1.2 } } } : {}),
    win: [[3.5, 7, 0.7, 0.62, 0.17, 0.17, "round"]], doors: [8.5],
  }), ...fixed(SCHEMES, "aeroflot") };
};

const L100 = /* @__PURE__ */ L("plain", "navyBand", "saa");
export const lockheedL100Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 34.37, H: 11.66, W: 4.3, D: 4.3, k: 0.9, nose: "blunt", ns: 0.95, tl: 12, ty: 0.85,
  span: 40.41, root: 4.9, tip: 2.5, sweep: 2, dih: 2.5, at: 11.5, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [4.9, 9.8], r: 0.65, len: 6.5, blades: 4, prop: 2.06, ahead: 3.0 }],
  fin: [6.4, 2.4, 30, 27.0, 3], tp: [15.85, 4.2, 1.6, 5, 30.0, 0],
  ng: [4.2, 0.4, true], mg: [[14.0, 2.2, 0.55, false, 2, 1.25]], gx: { fairing: { d0: 11.5, d1: 17.5, hw: 2.75, h: 1.6 } },
  win: [], doors: [5.0], cargo: true,
}), ...chosen(L100, p) });

/** The Dreamlifter's cargo bulge over a 747-400's lower lobe and upper deck. */
const dreamlifterBulge = (d: number) => {
  if (d < 9 || d > 67) return null;
  const crown = curve([[9, 8.2], [13, 10.6], [18, 12.0], [24, 12.45], [48, 12.45], [56, 11.7], [62, 10.2], [67, 8.6]])(d);
  const hw = curve([[9, 2.6], [15, 3.65], [48, 3.7], [58, 3.0], [67, 1.6]])(d);
  const keel = curve([[9, 6.5], [20, 4.2], [50, 4.2], [67, 6.2]])(d);
  return lobe(keel, crown, hw, keel + (crown - keel) * 0.42);
};
export const boeingDreamlifterSpec = (): AirframeSpec => ({ ...brief({
  L: 71.68, H: 21.54, W: 6.5, D: 6.8, k: 2.15, nose: "airliner", tl: 17, ty: 0.75,
  hump: { start: 0.6, full: 11, end: 20, crown: 10.42, hw: 2.55 }, bulge: dreamlifterBulge,
  span: 64.44, root: 16.6, kink: [0.37, 7.7], tip: 3.7, sweep: 40, dih: 7, at: 25.1, dev: "canted",
  eng: [{ kind: "pod", s: [11.9, 21.0], r: 1.32, len: 4.9, ahead: 3.5, drop: 1.15 }],
  fin: [14.5, 4.5, 45, 53.0, 3], tp: [22.17, 9.6, 2.7, 36, 56.5, 7],
  ng: [7.2, 0.62, true], mg: [[34.2, 5.5, 0.62, true, 2], [37.2, 1.9, 0.62, true, 2]],
  win: [], doors: [7.5], cargo: true,
}), ...fixed(SCHEMES, "boeing") });

/** The Beluga XL's bulge over an A330's lower lobe: its forehead rising right behind the lowered cockpit. */
const belugaXlBulge = (d: number) => {
  if (d < 2.0) return null;
  const crown = curve([[2.0, 6.2], [3.0, 7.6], [5, 9.6], [8, 11.6], [11.5, 12.8], [14, 13.1], [40, 13.1], [48, 12.0], [55, 10.0], [61, 8.4], [63.1, 7.6]])(d);
  const hw = 4.4 * closeTo(d, 2.0, 12.5, 2.2) * (d > 40 ? Math.max(0.2, 1 - ((d - 40) / 23.1) ** 1.6) : 1);
  const keel = curve([[2, 6.0], [6, 4.9], [12, 4.6], [40, 4.6], [55, 5.6], [63.1, 6.6]])(d);
  return lobe(keel, crown, Math.max(0.05, hw), keel + (crown - keel) * 0.45);
};
export const airbusBelugaXlSpec = (): AirframeSpec => ({ ...brief({
  L: 63.1, H: 18.9, W: 5.64, D: 5.64, k: 1.95, nose: "airliner", ns: 0.95, tl: 15, ty: 0.85,
  bulge: belugaXlBulge,
  span: 60.3, root: 12.5, kink: [0.3, 7.8], tip: 2.6, sweep: 33, dih: 5.5, at: 22.0, dev: "canted", dh: 2.74,
  eng: [{ kind: "pod", s: [9.4], r: 1.5, len: 5.6, ahead: 4.1, drop: 1.0 }],
  fin: [10.5, 3.6, 40, 50.5, 2.5], tp: [21.0, 7.0, 2.6, 33, 53.5, 6],
  ng: [5.2, 0.5, true], mg: [[30.6, 5.4, 0.63, true, 2]],
  win: [], doors: [5.5], cargo: true,
  extra: belugaSmile,
}), ...fixed(SCHEMES, "airbus") });

/** The Beluga XL's face: an eye each side of the forehead and the smile under the cockpit. */
function belugaSmile(m: MeshBuilder, g: Geometry): void {
  m.scope("smile", () => {
    for (const side of [-1, 1]) {
      const z = (d: number, y: number): number => {
        // the skin's lateral position at (d, y): searched along z from the centre line
        let lo = 0;
        let hi = 6;
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          const ls = g.lobes(d);
          const inside = ls.some((l) => {
            const t = y >= l.mid ? (y - l.mid) / l.top : (l.mid - y) / l.bot;
            return t < 1 && mid < l.hw * Math.sqrt(1 - t * t);
          });
          if (inside) lo = mid;
          else hi = mid;
        }
        return side * (lo + 0.05);
      };
      // the eye: a white disc with a dark pupil, high on the forehead
      const eye = (d: number, y: number, r: number, mat: string, off: number): void => {
        const pts: Array<[number, number, number]> = [];
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2;
          const b = ((k + 1) / 10) * Math.PI * 2;
          for (const [dd, yy] of [[d, y], [d + r * Math.cos(a), y + r * Math.sin(a)], [d + r * Math.cos(b), y + r * Math.sin(b)]] as Array<[number, number]>) pts.push([g.x(dd), yy, z(dd, yy) + side * off]);
        }
        m.facets(mat, pts, [0, 0, side]);
      };
      eye(6.2, 9.4, 0.9, "white", 0.02);
      eye(5.9, 9.4, 0.45, "airbusBlue", 0.05);
      // the smile: a curved band under the cockpit windows
      const band: Array<[number, number, number]> = [];
      for (let i = 0; i < 8; i++) {
        const [d0, d1] = [1.2 + i * 0.45, 1.2 + (i + 1) * 0.45];
        const y = (d: number): number => 3.95 + 0.06 * (d - 2.9) ** 2;
        const q = [[d0, y(d0)], [d1, y(d1)], [d1, y(d1) + 0.16], [d0, y(d0) + 0.16]].map(([dd, yy]) => [g.x(dd!), yy!, z(dd!, yy!) + side * 0.03] as [number, number, number]);
        band.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
      }
      m.facets("airbusBlue", band, [0, 0, side]);
    }
  });
}

// ---------------------------------------------------------------------------
// Flying boats and amphibians

const CL415 = /* @__PURE__ */ L("firefighter", "coastGuard");
export const canadairCl415Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 19.82, H: 8.98, W: 2.6, D: 2.8, k: 0.75, nose: "boat", tl: 8, hull: 0.5,
  span: 28.6, root: 3.9, tip: 3.6, sweep: 0, dih: 0, at: 6.5, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [3.6], r: 0.55, len: 5.0, blades: 4, prop: 1.98, ahead: 2.0 }],
  tk: "T", fin: [3.6, 2.4, 30, 15.0, 2], tp: [11.0, 1.8, 1.3, 0, 0],
  ng: [2.6, 0.33, true], mg: [[8.4, 2.6, 0.5, true, undefined, 1.25]],
  gx: { tipFloats: { s: 12.4, len: 2.6, drop: 1.2 } },
  win: [[3.5, 8, 1.2, 0.62, 0.18, 0.16, "round"]], doors: [9.5],
}), ...chosen(CL415, p) });

export const shinmaywaUs2Spec = (): AirframeSpec => ({ ...brief({
  L: 33.46, H: 9.8, W: 3.5, D: 4.0, k: 0.9, nose: "boat", tl: 11, hull: 0.45,
  span: 33.15, root: 5.0, tip: 2.6, sweep: 0, dih: 1, at: 11.0, pos: "high",
  eng: [{ kind: "prop", style: "turboprop", s: [4.0, 9.0], r: 0.6, len: 5.5, blades: 6, prop: 2.0, ahead: 2.4 }],
  tk: "T", fin: [5.8, 3.2, 25, 24.5, 3], tp: [12.3, 3.0, 1.6, 10, 0],
  ng: [3.5, 0.4, true], mg: [[15.0, 2.0, 0.55, true, undefined, 1.3]],
  gx: { tipFloats: { s: 14.5, len: 3.2, drop: 1.5 } },
  win: [[5, 12, 1.4, 0.62, 0.16, 0.16, "round"]], doors: [14],
}), ...fixed(SCHEMES, "jmsdf") });

export const boeing314Spec = (): AirframeSpec => ({ ...brief({
  L: 32.31, H: 8.41, W: 3.8, D: 4.6, k: 0.0, nose: "boat", tl: 11, hull: 0.4,
  span: 46.36, root: 7.0, tip: 2.5, sweep: 3, dih: 0, at: 9.0, pos: "high",
  eng: [{ kind: "prop", style: "radial", s: [5.6, 10.4], r: 0.85, len: 3.0, blades: 3, prop: 2.2, ahead: 2.6 }],
  tk: "triple", fin: [3.5, 2.2, 10, 28.4], tp: [11.7, 4.0, 2.0, 0, 27.6, 0],
  gk: "none", retract: false, gx: { sponsons: { d: 12.5, span: 3.6, chord: 4.0 } },
  win: [[5, 22, 1.2, 0.42, 0.22, 0.18, "rect"], [4.2, 8, 0.8, 0.85, 0.18, 0.14, "rect"]], doors: [14],
}), ...fixed(SCHEMES, "panAm") });

// ---------------------------------------------------------------------------
// the builders: named exports, so a design's JS model imports them by name (jsModel.ts)

export function namcYs11(p?: ParamValues): MeshBuilder { return airframe(namcYs11Spec(p)); }
export function namcYs11Lod(p?: ParamValues): MeshBuilder { return airframeLod(namcYs11Spec(p)); }
export function atr72(p?: ParamValues): MeshBuilder { return airframe(atr72Spec(p)); }
export function atr72Lod(p?: ParamValues): MeshBuilder { return airframeLod(atr72Spec(p)); }
export function dhcDash8(p?: ParamValues): MeshBuilder { return airframe(dhcDash8Spec(p)); }
export function dhcDash8Lod(p?: ParamValues): MeshBuilder { return airframeLod(dhcDash8Spec(p)); }
export function dhcTwinOtter(p?: ParamValues): MeshBuilder { return airframe(dhcTwinOtterSpec(p)); }
export function dhcTwinOtterLod(p?: ParamValues): MeshBuilder { return airframeLod(dhcTwinOtterSpec(p)); }
export function dhcBeaver(p?: ParamValues): MeshBuilder { return airframe(dhcBeaverSpec(p)); }
export function dhcBeaverLod(p?: ParamValues): MeshBuilder { return airframeLod(dhcBeaverSpec(p)); }
export function saab340(p?: ParamValues): MeshBuilder { return airframe(saab340Spec(p)); }
export function saab340Lod(p?: ParamValues): MeshBuilder { return airframeLod(saab340Spec(p)); }
export function saab2000(p?: ParamValues): MeshBuilder { return airframe(saab2000Spec(p)); }
export function saab2000Lod(p?: ParamValues): MeshBuilder { return airframeLod(saab2000Spec(p)); }
export function fokkerF27(p?: ParamValues): MeshBuilder { return airframe(fokkerF27Spec(p)); }
export function fokkerF27Lod(p?: ParamValues): MeshBuilder { return airframeLod(fokkerF27Spec(p)); }
export function fokker50(p?: ParamValues): MeshBuilder { return airframe(fokker50Spec(p)); }
export function fokker50Lod(p?: ParamValues): MeshBuilder { return airframeLod(fokker50Spec(p)); }
export function embraerBrasilia(p?: ParamValues): MeshBuilder { return airframe(embraerBrasiliaSpec(p)); }
export function embraerBrasiliaLod(p?: ParamValues): MeshBuilder { return airframeLod(embraerBrasiliaSpec(p)); }
export function embraerBandeirante(p?: ParamValues): MeshBuilder { return airframe(embraerBandeiranteSpec(p)); }
export function embraerBandeiranteLod(p?: ParamValues): MeshBuilder { return airframeLod(embraerBandeiranteSpec(p)); }
export function letL410(p?: ParamValues): MeshBuilder { return airframe(letL410Spec(p)); }
export function letL410Lod(p?: ParamValues): MeshBuilder { return airframeLod(letL410Spec(p)); }
export function xianMa60(p?: ParamValues): MeshBuilder { return airframe(xianMa60Spec(p)); }
export function xianMa60Lod(p?: ParamValues): MeshBuilder { return airframeLod(xianMa60Spec(p)); }
export function antonovAn24(p?: ParamValues): MeshBuilder { return airframe(antonovAn24Spec(p)); }
export function antonovAn24Lod(p?: ParamValues): MeshBuilder { return airframeLod(antonovAn24Spec(p)); }
export function ilyushinIl18(p?: ParamValues): MeshBuilder { return airframe(ilyushinIl18Spec(p)); }
export function ilyushinIl18Lod(p?: ParamValues): MeshBuilder { return airframeLod(ilyushinIl18Spec(p)); }
export function vickersViscount(p?: ParamValues): MeshBuilder { return airframe(vickersViscountSpec(p)); }
export function vickersViscountLod(p?: ParamValues): MeshBuilder { return airframeLod(vickersViscountSpec(p)); }
export function lockheedElectra(p?: ParamValues): MeshBuilder { return airframe(lockheedElectraSpec(p)); }
export function lockheedElectraLod(p?: ParamValues): MeshBuilder { return airframeLod(lockheedElectraSpec(p)); }
export function douglasDc3(p?: ParamValues): MeshBuilder { return airframe(douglasDc3Spec(p)); }
export function douglasDc3Lod(p?: ParamValues): MeshBuilder { return airframeLod(douglasDc3Spec(p)); }
export function douglasDc6(p?: ParamValues): MeshBuilder { return airframe(douglasDc6Spec(p)); }
export function douglasDc6Lod(p?: ParamValues): MeshBuilder { return airframeLod(douglasDc6Spec(p)); }
export function lockheedConstellation(p?: ParamValues): MeshBuilder { return airframe(lockheedConstellationSpec(p)); }
export function lockheedConstellationLod(p?: ParamValues): MeshBuilder { return airframeLod(lockheedConstellationSpec(p)); }
export function boeing377(p?: ParamValues): MeshBuilder { return airframe(boeing377Spec(p)); }
export function boeing377Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing377Spec(p)); }
export function fordTrimotor(): MeshBuilder { return airframe(fordTrimotorSpec()); }
export function fordTrimotorLod(): MeshBuilder { return airframeLod(fordTrimotorSpec()); }
export function junkersJu52(p?: ParamValues): MeshBuilder { return airframe(junkersJu52Spec(p)); }
export function junkersJu52Lod(p?: ParamValues): MeshBuilder { return airframeLod(junkersJu52Spec(p)); }
export function dhDragonRapide(): MeshBuilder { return airframe(dhDragonRapideSpec()); }
export function dhDragonRapideLod(): MeshBuilder { return airframeLod(dhDragonRapideSpec()); }
export function bnIslander(p?: ParamValues): MeshBuilder { return airframe(bnIslanderSpec(p)); }
export function bnIslanderLod(p?: ParamValues): MeshBuilder { return airframeLod(bnIslanderSpec(p)); }
export function pilatusPc12(p?: ParamValues): MeshBuilder { return airframe(pilatusPc12Spec(p)); }
export function pilatusPc12Lod(p?: ParamValues): MeshBuilder { return airframeLod(pilatusPc12Spec(p)); }
export function cessna172(p?: ParamValues): MeshBuilder { return airframe(cessna172Spec(p)); }
export function cessna172Lod(p?: ParamValues): MeshBuilder { return airframeLod(cessna172Spec(p)); }
export function cessnaCaravan(p?: ParamValues): MeshBuilder { return airframe(cessnaCaravanSpec(p)); }
export function cessnaCaravanLod(p?: ParamValues): MeshBuilder { return airframeLod(cessnaCaravanSpec(p)); }
export function piperCherokee(p?: ParamValues): MeshBuilder { return airframe(piperCherokeeSpec(p)); }
export function piperCherokeeLod(p?: ParamValues): MeshBuilder { return airframeLod(piperCherokeeSpec(p)); }
export function beechKingAir(p?: ParamValues): MeshBuilder { return airframe(beechKingAirSpec(p)); }
export function beechKingAirLod(p?: ParamValues): MeshBuilder { return airframeLod(beechKingAirSpec(p)); }
export function antonovAn124(p?: ParamValues): MeshBuilder { return airframe(antonovAn124Spec(p)); }
export function antonovAn124Lod(p?: ParamValues): MeshBuilder { return airframeLod(antonovAn124Spec(p)); }
export function antonovAn225(): MeshBuilder { return airframe(antonovAn225Spec()); }
export function antonovAn225Lod(): MeshBuilder { return airframeLod(antonovAn225Spec()); }
export function antonovAn2(p?: ParamValues): MeshBuilder { return airframe(antonovAn2Spec(p)); }
export function antonovAn2Lod(p?: ParamValues): MeshBuilder { return airframeLod(antonovAn2Spec(p)); }
export function lockheedL100(p?: ParamValues): MeshBuilder { return airframe(lockheedL100Spec(p)); }
export function lockheedL100Lod(p?: ParamValues): MeshBuilder { return airframeLod(lockheedL100Spec(p)); }
export function boeingDreamlifter(): MeshBuilder { return airframe(boeingDreamlifterSpec()); }
export function boeingDreamlifterLod(): MeshBuilder { return airframeLod(boeingDreamlifterSpec()); }
export function airbusBelugaXl(): MeshBuilder { return airframe(airbusBelugaXlSpec()); }
export function airbusBelugaXlLod(): MeshBuilder { return airframeLod(airbusBelugaXlSpec()); }
export function canadairCl415(p?: ParamValues): MeshBuilder { return airframe(canadairCl415Spec(p)); }
export function canadairCl415Lod(p?: ParamValues): MeshBuilder { return airframeLod(canadairCl415Spec(p)); }
export function shinmaywaUs2(): MeshBuilder { return airframe(shinmaywaUs2Spec()); }
export function shinmaywaUs2Lod(): MeshBuilder { return airframeLod(shinmaywaUs2Spec()); }
export function boeing314(): MeshBuilder { return airframe(boeing314Spec()); }
export function boeing314Lod(): MeshBuilder { return airframeLod(boeing314Spec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md):
// game properties from the published maximum take-off mass, shaft power (or thrust) and cruising speed

type Entry = [id: string, title: string, spec: (p?: ParamValues) => AirframeSpec, build: (p?: ParamValues) => MeshBuilder, lod: (p?: ParamValues) => MeshBuilder, params: ParamSpec[] | null, game: WorldAircraft["game"]];

const entry = ([id, title, spec, build, buildLod, params, game]: Entry): WorldAircraft => ({
  id, title, spec, build, buildLod,
  ...(params ? { params, finishParams: params.filter((x) => x.name === "livery" || x.name === "colour").map((x) => x.name) } : {}),
  game, references: id.replace(/^veh-/, ""),
});

export const WORLD_PROP_SPECS: readonly WorldAircraft[] = /* @__PURE__ */ ([
  ["veh-namc-ys11", "NAMC YS-11", namcYs11Spec, namcYs11, namcYs11Lod, YS11.params, air(24.5, 4540, 470, "medium", 0.3)],
  ["veh-atr-72", "ATR 72-600", atr72Spec, atr72, atr72Lod, [ATR_LENGTH, ...ATR.params], air(23, 3700, 510, "medium", 0.5, [{ params: { length: "42" }, weight: 18.6, power: 3000 }])],
  ["veh-dhc-dash8", "De Havilland Canada Dash 8 Q400", dhcDash8Spec, dhcDash8, dhcDash8Lod, DASH8.params, air(29.3, 7560, 667, "medium", 0.55)],
  ["veh-dhc-twin-otter", "DHC-6 Twin Otter", dhcTwinOtterSpec, dhcTwinOtter, dhcTwinOtterLod, [TWIN_OTTER_GEAR], air(5.67, 925, 337, "small", 0.3)],
  ["veh-dhc-beaver", "DHC-2 Beaver", dhcBeaverSpec, dhcBeaver, dhcBeaverLod, [BEAVER_GEAR], air(2.31, 336, 230, "small", 0.3)],
  ["veh-saab-340", "Saab 340", saab340Spec, saab340, saab340Lod, SAAB340.params, air(13.2, 2600, 520, "medium", 0.3)],
  ["veh-saab-2000", "Saab 2000", saab2000Spec, saab2000, saab2000Lod, SAAB2000.params, air(22.8, 6150, 665, "medium", 0.3)],
  ["veh-fokker-f27", "Fokker F27 Friendship", fokkerF27Spec, fokkerF27, fokkerF27Lod, F27.params, air(20.4, 3180, 460, "medium", 0.5)],
  ["veh-fokker-50", "Fokker 50", fokker50Spec, fokker50, fokker50Lod, F50.params, air(20.8, 3700, 520, "medium", 0.5)],
  ["veh-embraer-brasilia", "Embraer EMB 120 Brasilia", embraerBrasiliaSpec, embraerBrasilia, embraerBrasiliaLod, EMB120.params, air(11.99, 2680, 555, "small", 0.3)],
  ["veh-embraer-bandeirante", "Embraer EMB 110 Bandeirante", embraerBandeiranteSpec, embraerBandeirante, embraerBandeiranteLod, EMB110.params, air(5.67, 1120, 410, "small", 0.3)],
  ["veh-let-l410", "Let L-410 Turbolet", letL410Spec, letL410, letL410Lod, L410.params, air(6.6, 1100, 365, "small", 0.5)],
  ["veh-xian-ma60", "Xian MA60", xianMa60Spec, xianMa60, xianMa60Lod, MA60.params, air(21.8, 4100, 514, "medium", 0.5)],
  ["veh-antonov-an24", "Antonov An-24", antonovAn24Spec, antonovAn24, antonovAn24Lod, AN24.params, air(21, 3780, 450, "medium", 0.5)],
  ["veh-ilyushin-il18", "Ilyushin Il-18", ilyushinIl18Spec, ilyushinIl18, ilyushinIl18Lod, IL18.params, air(64, 12000, 625, "medium", 0.3)],
  ["veh-vickers-viscount", "Vickers Viscount", vickersViscountSpec, vickersViscount, vickersViscountLod, VISCOUNT.params, air(32.9, 5240, 565, "medium", 0.3)],
  ["veh-lockheed-electra", "Lockheed L-188 Electra", lockheedElectraSpec, lockheedElectra, lockheedElectraLod, ELECTRA.params, air(52.6, 11180, 600, "medium", 0.3)],
  ["veh-douglas-dc3", "Douglas DC-3", douglasDc3Spec, douglasDc3, douglasDc3Lod, DC3.params, air(11.4, 1340, 333, "small", 0.45)],
  ["veh-douglas-dc6", "Douglas DC-6B", douglasDc6Spec, douglasDc6, douglasDc6Lod, DC6.params, air(48.5, 7460, 507, "medium", 0.3)],
  ["veh-lockheed-constellation", "Lockheed L-1049 Super Constellation", lockheedConstellationSpec, lockheedConstellation, lockheedConstellationLod, CONNIE.params, air(62.4, 8200, 489, "medium", 0.3)],
  ["veh-boeing-377", "Boeing 377 Stratocruiser", boeing377Spec, boeing377, boeing377Lod, B377.params, air(67.1, 10440, 547, "medium", 0.3)],
  ["veh-ford-trimotor", "Ford Trimotor", fordTrimotorSpec, fordTrimotor, fordTrimotorLod, null, air(6.1, 1000, 196, "small", 0.4)],
  ["veh-junkers-ju52", "Junkers Ju 52/3m", junkersJu52Spec, junkersJu52, junkersJu52Lod, JU52.params, air(10.5, 1640, 245, "small", 0.4)],
  ["veh-dh-dragon-rapide", "de Havilland Dragon Rapide", dhDragonRapideSpec, dhDragonRapide, dhDragonRapideLod, null, air(2.5, 300, 212, "small", 0.4)],
  ["veh-bn-islander", "Britten-Norman Islander", bnIslanderSpec, bnIslander, bnIslanderLod, ISLANDER.params, air(2.99, 400, 273, "small", 0.4)],
  ["veh-pilatus-pc12", "Pilatus PC-12", pilatusPc12Spec, pilatusPc12, pilatusPc12Lod, PC12.params, air(4.74, 900, 528, "small", 0.4)],
  ["veh-cessna-172", "Cessna 172 Skyhawk", cessna172Spec, cessna172, cessna172Lod, C172.params, air(1.11, 120, 226, "small", 0.35)],
  ["veh-cessna-caravan", "Cessna 208 Caravan", cessnaCaravanSpec, cessnaCaravan, cessnaCaravanLod, [CARAVAN_GEAR], air(3.63, 503, 344, "small", 0.4, [{ params: { gear: "floats" }, weight: 3.7, maxspeed: 300 }])],
  ["veh-piper-cherokee", "Piper PA-28 Cherokee", piperCherokeeSpec, piperCherokee, piperCherokeeLod, COLOUR.params, air(0.98, 110, 200, "small", 0.35)],
  ["veh-beech-king-air", "Beechcraft King Air 350", beechKingAirSpec, beechKingAir, beechKingAirLod, COLOUR.params, air(6.8, 1560, 578, "small", 0.4)],
  ["veh-antonov-an124", "Antonov An-124 Ruslan", antonovAn124Spec, antonovAn124, antonovAn124Lod, AN124.params, air(405, 9200, 800, "big", 0.3)],
  ["veh-antonov-an225", "Antonov An-225 Mriya", antonovAn225Spec, antonovAn225, antonovAn225Lod, null, air(640, 13800, 800, "big", 0.3)],
  ["veh-antonov-an2", "Antonov An-2", antonovAn2Spec, antonovAn2, antonovAn2Lod, [AN2_GEAR], air(5.5, 750, 185, "small", 0.4)],
  ["veh-lockheed-l100", "Lockheed L-100 Hercules", lockheedL100Spec, lockheedL100, lockheedL100Lod, L100.params, air(70.3, 12200, 570, "medium", 0.3)],
  ["veh-boeing-dreamlifter", "Boeing 747 Dreamlifter", boeingDreamlifterSpec, boeingDreamlifter, boeingDreamlifterLod, null, air(364, 10800, 878, "big", 0.3)],
  ["veh-airbus-beluga-xl", "Airbus BelugaXL", airbusBelugaXlSpec, airbusBelugaXl, airbusBelugaXlLod, null, air(227, 6400, 737, "big", 0.3)],
  ["veh-canadair-cl415", "Canadair CL-415", canadairCl415Spec, canadairCl415, canadairCl415Lod, CL415.params, air(19.9, 3380, 333, "small", 0.4)],
  ["veh-shinmaywa-us2", "ShinMaywa US-2", shinmaywaUs2Spec, shinmaywaUs2, shinmaywaUs2Lod, null, air(47.7, 13800, 480, "medium", 0.4)],
  ["veh-boeing-314", "Boeing 314 Clipper", boeing314Spec, boeing314, boeing314Lod, null, air(38.1, 4470, 296, "medium", 0.4)],
] as Entry[]).map(entry);

export const WORLD_PROPS = /* @__PURE__ */ aircraftDesigns(WORLD_PROP_SPECS);
