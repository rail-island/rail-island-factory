// The world jets (docs/models/world-aircraft.md): airliners, regional and business
// jets from around the world, each an AirframeSpec on the airframe kit at its real
// size, written as a `Brief` (worldAircraft.ts), from the photographs and the
// published figures in assets/<references>/. The ids are stored in the game's
// saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { airframe, airframeLod, type AirframeSpec } from "./airframeKit.ts";
import { colourSchemes, COLOURS, schemes, SCHEMES } from "./airlineSchemes.ts";
import { air, aircraftDesigns, brief, chosen, fixed, liveries, type WorldAircraft } from "./worldAircraft.ts";

/** A livery parameter over the named carriers. */
const L = (...keys: string[]) => liveries(schemes(...keys));
/** A business jet's colour parameter. */
const COLOUR = /* @__PURE__ */ liveries(colourSchemes(...COLOURS), "colour", "Colour");

// ---------------------------------------------------------------------------
// Boeing

const B707 = /* @__PURE__ */ L("panAm", "qantas", "lufthansa");
export const boeing707Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 46.61, H: 12.93, W: 3.76, D: 4.1, k: 1.35, nose: "airliner", ns: 1.1, tl: 11.5, ty: 0.7,
  span: 44.42, root: 10.4, kink: [0.3, 6.6], tip: 2.3, sweep: 36, dih: 7, at: 15.8,
  eng: [{ kind: "pod", s: [7.4, 12.6], r: 0.72, len: 5.6, ahead: 3.4, drop: 0.8, jet: true }],
  fin: [7.4, 2.3, 40, 36.6, 2.5], tp: [13.95, 4.6, 1.5, 36, 39.6, 7],
  ng: [5.9, 0.44, true], mg: [[23.9, 3.37, 0.62, true, 2]],
  win: [[6.2, 37.5, 0.51]], doors: [5.1, 38.6],
}), ...chosen(B707, p) });

const B727 = /* @__PURE__ */ L("eastern", "lufthansa", "american");
export const boeing727Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 46.68, H: 10.36, W: 3.76, D: 4.1, k: 1.2, nose: "airliner", tl: 10.5, ty: 0.62, te: 0.6,
  span: 32.92, root: 9.0, kink: [0.32, 5.4], tip: 1.6, sweep: 34, dih: 3, at: 16.8,
  eng: [{ kind: "rear", d: 37.0, y: 4.3, z: 2.55, r: 0.68, len: 4.6 }, { kind: "tail", d: 36.9, r: 0.72, len: 3.0, duct: "s" }],
  tk: "T", fin: [6.6, 3.6, 48, 38.2], tp: [10.9, 3.6, 1.5, 36, 0],
  ng: [3.6, 0.4, true], mg: [[23.1, 2.87, 0.6, true]],
  win: [[6.0, 35.0, 0.51]], doors: [4.8],
}), ...chosen(B727, p) });

const B737_200 = /* @__PURE__ */ L("lufthansa", "united", "malaysia");
export const boeing737200Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 30.53, H: 11.28, W: 3.76, D: 4.01, k: 1.0, nose: "airliner", tl: 8.5,
  span: 28.35, root: 7.3, kink: [0.3, 4.5], tip: 1.4, sweep: 27, dih: 6, at: 11.0,
  eng: [{ kind: "pod", s: [4.9], r: 0.56, len: 3.9, ahead: 2.4, drop: 0.25, jet: true }],
  fin: [5.5, 1.8, 37, 23.5, 3.0], tp: [10.97, 3.6, 1.2, 30, 25.0, 7],
  ng: [3.4, 0.33, true], mg: [[14.1, 2.6, 0.5, true]],
  win: [[5.0, 25.6, 0.51]], doors: [3.8, 27.0],
}), ...chosen(B737_200, p) });

const B737_MAX = /* @__PURE__ */ L("southwest", "ryanair", "aeromexico");
export const boeing737MaxSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 39.52, H: 12.3, W: 3.76, D: 4.01, k: 1.25, nose: "airliner", tl: 9.2,
  span: 35.92, root: 8.1, kink: [0.3, 5.0], tip: 1.3, sweep: 27, dih: 6, at: 14.0, dev: "split", dh: 2.9,
  eng: [{ kind: "pod", s: [4.9], r: 1.0, len: 4.2, ahead: 3.6, drop: 0.5 }],
  fin: [5.7, 2.3, 37, 30.3, 3.2], tp: [14.35, 4.6, 1.3, 32, 33.0, 7],
  ng: [5.7, 0.35, true], mg: [[21.3, 2.86, 0.56, true]],
  win: [[6.6, 31.5, 0.51]], doors: [5.0, 35.6],
}), ...chosen(B737_MAX, p) });

/** The 747-8's variants: the Intercontinental in Lufthansa's colours, the freighter in Cargolux's. */
const B747_8_PARAMS: readonly ParamSpec[] = [{ name: "variant", title: "Variant", default: "passenger", values: [{ value: "passenger", title: "Passenger" }, { value: "freighter", title: "Freighter" }] }];
export const boeing7478Spec = (p?: ParamValues): AirframeSpec => {
  const cargo = resolveParams(B747_8_PARAMS, p).variant === "freighter";
  return { ...brief({
    L: 76.25, H: 19.35, W: 6.5, D: 6.8, k: 2.15, nose: "airliner", tl: 17, ty: 0.75,
    hump: cargo ? { start: 0.6, full: 11, end: 24, crown: 10.4, hw: 2.55 } : { start: 0.6, full: 12, end: 39, crown: 10.42, hw: 2.55 },
    span: 68.4, root: 16.6, kink: [0.37, 7.7], tip: 3.6, sweep: 40, dih: 7, at: 28.7, dev: "raked",
    eng: [{ kind: "pod", s: [11.9, 21.0], r: 1.6, len: 5.6, ahead: 3.9, drop: 1.1 }],
    fin: [13.6, 4.5, 45, 57.0, 3], tp: [22.17, 9.6, 2.7, 36, 61.2, 7],
    ng: [9.6, 0.62, true], mg: [[37.6, 5.5, 0.62, true, 2], [40.6, 1.9, 0.62, true, 2]],
    win: [[8.0, 66, 0.53], [8.5, 37, 0.53, 1.06]], doors: [7.5, 18.5, 30.5, 48, 63.5], cargo,
  }), ...(cargo ? fixed(SCHEMES, "cargolux") : fixed(SCHEMES, "lufthansa2018")) };
};

const B757 = /* @__PURE__ */ L("delta", "britishAirways", "icelandair");
export const boeing757Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 47.32, H: 13.56, W: 3.76, D: 4.1, k: 1.45, nose: "airliner", tl: 10.0,
  span: 38.05, root: 9.0, kink: [0.3, 5.5], tip: 1.7, sweep: 27, dih: 5, at: 17.5,
  eng: [{ kind: "pod", s: [6.4], r: 1.1, len: 5.0, ahead: 3.5, drop: 0.7 }],
  fin: [7.2, 2.3, 39, 37.3, 3.0], tp: [15.2, 4.7, 1.4, 33, 40.5, 7],
  ng: [4.6, 0.4, true], mg: [[22.9, 3.66, 0.58, true, 2]],
  win: [[6.2, 41, 0.51]], doors: [4.9, 16.5, 42.5],
}), ...chosen(B757, p) });

const B767 = /* @__PURE__ */ L("ana", "american", "lot");
export const boeing767Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 54.94, H: 15.85, W: 5.03, D: 5.41, k: 1.65, nose: "airliner", tl: 13.0,
  span: 47.57, root: 12.0, kink: [0.33, 6.6], tip: 2.2, sweep: 34, dih: 6, at: 19.5,
  eng: [{ kind: "pod", s: [7.6], r: 1.4, len: 5.2, ahead: 3.8, drop: 0.9 }],
  fin: [8.8, 2.8, 42, 44.2, 3], tp: [18.6, 5.8, 1.7, 35, 47.0, 7],
  ng: [5.2, 0.48, true], mg: [[27.9, 4.65, 0.63, true, 2]],
  win: [[6.5, 48, 0.51]], doors: [5.5, 18, 47.5],
}), ...chosen(B767, p) });

const B777 = /* @__PURE__ */ L("emirates", "airFrance", "cathay");
export const boeing777Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 73.86, H: 18.5, W: 6.2, D: 6.2, k: 2.0, nose: "airliner", tl: 17,
  span: 64.8, root: 15.5, kink: [0.32, 8.3], tip: 2.6, sweep: 35, dih: 6, at: 27.5, dev: "raked",
  eng: [{ kind: "pod", s: [9.7], r: 1.95, len: 7.3, ahead: 4.7, drop: 0.9 }],
  fin: [11.0, 3.8, 42, 59.3, 3], tp: [21.5, 7.5, 2.5, 35, 62.5, 7],
  ng: [7.0, 0.6, true], mg: [[38.2, 5.5, 0.64, true, 3]],
  win: [[8.0, 66, 0.53]], doors: [6.5, 19.5, 41, 63],
}), ...chosen(B777, p) });

const B787 = /* @__PURE__ */ L("airNewZealand", "qatar", "united");
export const boeing787Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 62.81, H: 17.02, W: 5.77, D: 5.97, k: 1.9, nose: "airliner", ns: 1.15, tl: 15,
  span: 60.12, root: 13.5, kink: [0.33, 7.5], tip: 2.0, sweep: 35, dih: 6, at: 23.6, dev: "raked",
  eng: [{ kind: "pod", s: [9.8], r: 1.6, len: 6.5, ahead: 4.3, drop: 0.7 }],
  fin: [9.6, 3.2, 42, 50.2, 3], tp: [21.0, 6.5, 2.0, 36, 52.5, 7],
  ng: [5.5, 0.53, true], mg: [[31.8, 4.9, 0.63, true, 2]],
  win: [[7.0, 55, 0.55, 0.6, 0.16, 0.26]], doors: [6, 17, 38, 56],
}), ...chosen(B787, p) });

// ---------------------------------------------------------------------------
// Douglas, McDonnell Douglas, Lockheed, Convair

const DC8 = /* @__PURE__ */ L("klm", "sas", "united");
export const douglasDc8Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 57.12, H: 12.92, W: 3.73, D: 4.0, k: 1.4, nose: "airliner", ns: 1.25, tl: 12,
  span: 45.23, root: 10.5, kink: [0.3, 6.8], tip: 2.3, sweep: 33, dih: 6.5, at: 21.0,
  eng: [{ kind: "pod", s: [7.3, 13.0], r: 0.85, len: 6.0, ahead: 3.6, drop: 0.8, jet: true }],
  fin: [7.2, 2.4, 38, 46.6, 2.5], tp: [14.8, 4.7, 1.5, 35, 49.2, 8],
  ng: [6.5, 0.44, true], mg: [[30.5, 3.2, 0.6, true, 2]],
  win: [[6.5, 49, 0.51]], doors: [5.5, 48.5],
}), ...chosen(DC8, p) });

const DC9 = /* @__PURE__ */ L("swissair", "delta", "alitalia");
export const douglasDc9Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 36.37, H: 8.38, W: 3.34, D: 3.6, k: 1.0, nose: "airliner", tl: 9.5,
  span: 28.47, root: 6.8, kink: [0.3, 4.3], tip: 1.4, sweep: 26, dih: 3, at: 13.5,
  eng: [{ kind: "rear", d: 26.0, y: 3.6, z: 2.25, r: 0.62, len: 4.3 }],
  tk: "T", fin: [5.0, 2.6, 45, 28.3], tp: [11.2, 3.3, 1.2, 33, 0],
  ng: [3.3, 0.33, true], mg: [[19.5, 2.5, 0.5, true]],
  win: [[5.0, 26, 0.51]], doors: [3.8],
}), ...chosen(DC9, p) });

const MD80 = /* @__PURE__ */ L("american", "alitalia", "sas");
export const md80Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 45.06, H: 9.04, W: 3.34, D: 3.6, k: 1.05, nose: "airliner", tl: 9.8,
  span: 32.87, root: 7.6, kink: [0.3, 4.8], tip: 1.5, sweep: 27, dih: 3, at: 18.5,
  eng: [{ kind: "rear", d: 34.0, y: 3.65, z: 2.3, r: 0.66, len: 5.2 }],
  tk: "T", fin: [5.4, 2.8, 45, 36.8], tp: [12.2, 3.6, 1.2, 33, 0],
  ng: [3.8, 0.35, true], mg: [[25.9, 2.55, 0.55, true]],
  win: [[5.0, 35, 0.51]], doors: [3.9],
}), ...chosen(MD80, p) });

const DC10 = /* @__PURE__ */ L("american", "lufthansa", "swissair");
export const douglasDc10Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 55.5, H: 17.7, W: 6.02, D: 6.02, k: 1.99, nose: "airliner", tl: 14,
  span: 50.4, root: 12.0, kink: [0.33, 6.3], tip: 2.3, sweep: 38, dih: 5, at: 19.5,
  eng: [{ kind: "pod", s: [8.6], r: 1.36, len: 4.6, ahead: 3.9, drop: 1.25 }, { kind: "tail", d: 42.5, r: 1.36, len: 6.3, duct: "straight" }],
  fin: [7.4, 3.4, 40, 43.4], tp: [21.7, 7.4, 2.3, 37, 46.0, 5],
  ng: [3.7, 0.5, true], mg: [[25.8, 5.3, 0.66, true, 2], [26.8, 0, 0.66, true]],
  win: [[6, 45, 0.53]], doors: [4.8, 14.2, 31.5, 44],
}), ...chosen(DC10, p) });

const L1011 = /* @__PURE__ */ L("eastern", "twa", "britishAirways");
export const lockheedTristarSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 54.17, H: 16.87, W: 5.97, D: 6.0, k: 1.9, nose: "airliner", tl: 13, te: 0.95,
  span: 47.35, root: 11.5, kink: [0.32, 6.4], tip: 2.2, sweep: 35, dih: 7, at: 19.5,
  eng: [{ kind: "pod", s: [9.5], r: 1.25, len: 5.0, ahead: 4.0, drop: 1.0 }, { kind: "tail", d: 43.5, r: 1.2, len: 4, duct: "s" }],
  fin: [8.5, 3.3, 40, 44.5], tp: [21.8, 7.0, 2.2, 35, 47.5, 3],
  ng: [4.5, 0.5, true], mg: [[26, 5.3, 0.63, true, 2]],
  win: [[6, 46, 0.53]], doors: [5, 15, 31, 44],
}), ...chosen(L1011, p) });

const CV880 = /* @__PURE__ */ L("delta", "twa", "cathay");
export const convair880Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 39.42, H: 11.0, W: 3.5, D: 3.75, k: 1.3, nose: "airliner", ns: 1.2, tl: 10,
  span: 36.58, root: 8.7, kink: [0.3, 5.6], tip: 2.0, sweep: 35, dih: 7, at: 14.0,
  eng: [{ kind: "pod", s: [5.9, 10.4], r: 0.62, len: 5.0, ahead: 3.2, drop: 0.6, jet: true }],
  fin: [6.3, 2.0, 40, 30.8, 2.0], tp: [12.3, 4.0, 1.3, 36, 33.2, 7],
  ng: [4.5, 0.4, true], mg: [[20.3, 3.1, 0.55, true, 2]],
  win: [[5, 30, 0.51]], doors: [4.2, 31],
}), ...chosen(CV880, p) });

// ---------------------------------------------------------------------------
// Airbus

const A300 = /* @__PURE__ */ L("airFrance", "lufthansa", "thai");
export const airbusA300Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 53.62, H: 16.53, W: 5.64, D: 5.64, k: 1.95, nose: "airliner", tl: 13.5,
  span: 44.84, root: 11.0, kink: [0.33, 6.1], tip: 2.5, sweep: 32, dih: 5, at: 18.5,
  eng: [{ kind: "pod", s: [7.6], r: 1.25, len: 4.5, ahead: 3.9, drop: 1.0 }],
  fin: [8.5, 3.0, 40, 43.0, 2], tp: [16.94, 6.2, 2.3, 34, 46.0, 6],
  ng: [5.0, 0.46, true], mg: [[23.6, 4.8, 0.62, true, 2]],
  win: [[6, 46, 0.53]], doors: [5, 16.5, 44],
}), ...chosen(A300, p) });

const A310 = /* @__PURE__ */ L("swissair", "lufthansa", "airIndia");
export const airbusA310Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 46.66, H: 15.8, W: 5.64, D: 5.64, k: 1.95, nose: "airliner", tl: 12,
  span: 43.9, root: 10.5, kink: [0.33, 5.8], tip: 2.0, sweep: 31, dih: 5, at: 16.0, dev: "fence",
  eng: [{ kind: "pod", s: [7.4], r: 1.25, len: 4.5, ahead: 3.9, drop: 1.0 }],
  fin: [8.6, 3.0, 40, 37.0], tp: [16.26, 6.0, 2.2, 34, 40.0, 6],
  ng: [5.0, 0.46, true], mg: [[20.8, 4.8, 0.62, true, 2]],
  win: [[6, 39, 0.53]], doors: [5, 14.5, 38],
}), ...chosen(A310, p) });

/** The A320 family's lengths: the A319, A320 and A321, their wings moved with their plugs. */
const A320_LENGTH: ParamSpec = { name: "length", title: "Length", default: "a320", values: [{ value: "a319", title: "A319" }, { value: "a320", title: "A320" }, { value: "a321", title: "A321" }] };
const A320 = /* @__PURE__ */ L("lufthansa", "easyJet", "iberia");
export const airbusA320Spec = (p?: ParamValues): AirframeSpec => {
  const len = resolveParams([A320_LENGTH, ...A320.params], p).length!;
  const [l, fwd, base] = len === "a319" ? [33.84, -1.6, 11.04] : len === "a321" ? [44.51, 3.4, 16.9] : [37.57, 0, 12.64];
  return { ...brief({
    L: l, H: 11.76, W: 3.95, D: 4.14, k: 1.15, nose: "airliner", tl: 9.5,
    span: 34.1, root: 7.0, kink: [0.33, 4.2], tip: 1.5, sweep: 27, dih: 5, at: 13.2 + fwd, dev: "fence",
    eng: [{ kind: "pod", s: [5.75], r: 1.1, len: 4.4, ahead: 3.0, drop: 0.6 }],
    fin: [6.0, 2.0, 40, l - 8.0, 2.5], tp: [12.45, 3.8, 1.3, 32, l - 5.8, 6],
    ng: [5.1, 0.38, true], mg: [[5.1 + base, 3.8, 0.57, true]],
    win: [[6.2, l - 7, 0.53]], doors: [4.5, ...(len === "a321" ? [12.5, 30.0] : []), l - 5.5],
  }), ...chosen(A320, p, [A320_LENGTH]) };
};

const A321NEO = /* @__PURE__ */ L("wizz", "turkish", "chinaSouthern");
export const airbusA321neoSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 44.51, H: 11.76, W: 3.95, D: 4.14, k: 1.2, nose: "airliner", tl: 9.5,
  span: 35.8, root: 7.0, kink: [0.33, 4.2], tip: 1.4, sweep: 27, dih: 5, at: 16.6, dev: "sharklet", dh: 2.43,
  eng: [{ kind: "pod", s: [5.75], r: 1.2, len: 4.6, ahead: 3.4, drop: 0.55 }],
  fin: [6.0, 2.0, 40, 36.5, 2.5], tp: [12.45, 3.8, 1.3, 32, 38.7, 6],
  ng: [5.1, 0.38, true], mg: [[22.0, 3.8, 0.57, true]],
  win: [[6.2, 37.5, 0.53]], doors: [4.5, 12.5, 30.0, 39.0],
}), ...chosen(A321NEO, p) });

const A330 = /* @__PURE__ */ L("cathay", "turkish", "aerLingus");
export const airbusA330Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 63.66, H: 16.79, W: 5.64, D: 5.64, k: 2.0, nose: "airliner", tl: 15,
  span: 60.3, root: 12.5, kink: [0.3, 7.8], tip: 2.6, sweep: 33, dih: 5.5, at: 24.0, dev: "canted", dh: 2.74,
  eng: [{ kind: "pod", s: [9.4], r: 1.5, len: 5.6, ahead: 4.1, drop: 1.0 }],
  fin: [9.4, 3.2, 40, 51.0, 2.5], tp: [19.4, 6.8, 2.4, 35, 54.5, 6],
  ng: [5.2, 0.5, true], mg: [[30.6, 5.4, 0.63, true, 2]],
  win: [[6.5, 56, 0.53]], doors: [5.5, 18, 37, 55],
}), ...chosen(A330, p) });

const A340 = /* @__PURE__ */ L("lufthansa2018", "iberia", "etihad");
export const airbusA340Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 75.36, H: 17.22, W: 5.64, D: 5.64, k: 2.1, nose: "airliner", tl: 16,
  span: 63.45, root: 14.0, kink: [0.3, 8.5], tip: 2.4, sweep: 33, dih: 5.5, at: 30.5, dev: "canted", dh: 2.74,
  eng: [{ kind: "pod", s: [11.5, 20.0], r: 1.5, len: 5.6, ahead: 4.0, drop: 0.9 }],
  fin: [10.0, 3.3, 40, 62.5, 3], tp: [21.5, 7.2, 2.4, 35, 66.0, 6],
  ng: [5.5, 0.5, true], mg: [[38.4, 5.4, 0.63, true, 2], [39.4, 0, 0.63, true, 2]],
  win: [[6.5, 67, 0.53]], doors: [5.5, 20, 42, 66],
}), ...chosen(A340, p) });

const A350 = /* @__PURE__ */ L("qatar", "singapore", "finnair");
export const airbusA350Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 66.8, H: 17.05, W: 5.96, D: 6.09, k: 2.0, nose: "airliner", ns: 1.15, tl: 15.5,
  span: 64.75, root: 15, kink: [0.3, 8.0], tip: 1.8, sweep: 34, dih: 6, at: 25.5, dev: "curved", dh: 3.2,
  eng: [{ kind: "pod", s: [10.3], r: 1.75, len: 6.4, ahead: 4.5, drop: 0.8 }],
  fin: [10.2, 3.4, 42, 53.2, 2.5], tp: [19.5, 6.8, 2.2, 35, 56.5, 6],
  ng: [5.6, 0.53, true], mg: [[34.3, 5.3, 0.63, true, 2]],
  win: [[7, 58, 0.54, 0.6, 0.14, 0.2]], doors: [6, 18, 39, 58],
}), ...chosen(A350, p) });

const A220 = /* @__PURE__ */ L("swiss", "airCanada", "delta");
export const airbusA220Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 38.71, H: 11.5, W: 3.7, D: 3.7, k: 1.25, nose: "airliner", tl: 9.5,
  span: 35.1, root: 7.5, kink: [0.3, 4.4], tip: 1.3, sweep: 27, dih: 5, at: 14.5, dev: "blended", dh: 2.0,
  eng: [{ kind: "pod", s: [5.2], r: 1.05, len: 4.0, ahead: 3.0, drop: 0.55 }],
  fin: [6.3, 2.2, 40, 30.0, 2.5], tp: [11.6, 3.8, 1.3, 32, 33.0, 6],
  ng: [5.0, 0.37, true], mg: [[21.9, 3.4, 0.55, true]],
  win: [[6, 31, 0.51]], doors: [4.8, 34.5],
}), ...chosen(A220, p) });

// ---------------------------------------------------------------------------
// Europe: France, Britain, the Netherlands

const CONCORDE = /* @__PURE__ */ L("britishAirways", "airFrance");
export const concordeSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 61.66, H: 12.2, W: 2.88, D: 3.32, k: 2.45, nose: "pointed", ns: 0.85, tl: 14, ty: 0.55,
  span: 25.6, root: 37.5, tip: 3.2, sweep: 60, dih: 0, at: 21.0, wy: 2.95, thick: [0.035, 0.03],
  plan: [[0, 21.0, 37.5], [1.5, 22.5, 36.0], [3.5, 30.5, 28.0], [6.0, 38.0, 20.5], [9.0, 45.5, 13.0], [11.5, 51.5, 7.0], [12.8, 54.5, 3.2]],
  eng: [{ kind: "pod", s: [3.6, 5.0], r: 0.62, len: 11, ahead: -7, drop: 0.65, jet: true }],
  fin: [10.5, 2.0, 50, 49.5],
  ng: [18.0, 0.4, true], mg: [[36.2, 3.86, 0.6, true, 2]],
  win: [[12, 47, 0.55, 0.62, 0.08, 0.11]], doors: [11.5, 45],
}), ...chosen(CONCORDE, p) });

const CARAVELLE = /* @__PURE__ */ L("airFrance", "sas", "sabena");
export const caravelleSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 32.01, H: 8.72, W: 3.2, D: 3.2, k: 1.05, nose: "airliner", ns: 1.2, tl: 9.5,
  span: 34.3, root: 7.0, tip: 2.3, sweep: 20, dih: 3, at: 11.5,
  eng: [{ kind: "rear", d: 23.5, y: 3.3, z: 2.25, r: 0.62, len: 4.6 }],
  tk: "cruciform", fin: [5.2, 1.9, 40, 26.5, 2.5], tp: [10.6, 3.0, 1.2, 25, 28.5, 8],
  ng: [3.4, 0.35, true], mg: [[15.8, 2.6, 0.5, true, 2]],
  win: [[5, 23, 0.86, 0.6, 0.22, 0.2, "tri"]], doors: [3.8, 24.5],
}), ...chosen(CARAVELLE, p) });

const COMET = /* @__PURE__ */ L("boac", "bea", "aerolineas");
export const dhCometSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 33.99, H: 8.99, W: 3.0, D: 3.0, k: 1.1, nose: "airliner", ns: 1.4, tl: 9.5,
  span: 35.0, root: 9.0, tip: 2.0, sweep: 20, dih: 2, at: 10.5,
  eng: [{ kind: "buried", s: [1.95, 3.0], r: 0.52, len: 6.5 }],
  fin: [5.5, 1.7, 40, 27.0, 2.0], tp: [11.6, 3.5, 1.4, 25, 29.0, 10],
  ng: [3.0, 0.38, true], mg: [[13.5, 4.6, 0.5, true, 2]],
  win: [[4.5, 25, 1.0, 0.6, 0.2, 0.14]], doors: [3.7, 24.0],
}), ...chosen(COMET, p) });

const VC10 = /* @__PURE__ */ L("boac", "britishAirways", "kenya");
export const vickersVc10Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 48.36, H: 12.04, W: 3.76, D: 3.9, k: 1.4, nose: "airliner", ns: 1.15, tl: 12,
  span: 44.55, root: 10.5, kink: [0.3, 6.0], tip: 2.3, sweep: 32.5, dih: 3, at: 15.0,
  eng: [{ kind: "rear", d: 36.5, y: 3.9, z: 2.45, r: 0.6, len: 5.0, pair: true }],
  tk: "T", fin: [7.2, 4.0, 40, 39.2, 1.5], tp: [13.4, 3.6, 1.6, 35, 0],
  ng: [4.5, 0.42, true], mg: [[24.1, 3.25, 0.6, true, 2]],
  win: [[6, 35, 0.53]], doors: [5.0, 34.0],
}), ...chosen(VC10, p) });

const TRIDENT = /* @__PURE__ */ L("bea", "britishAirways", "airChina");
export const hsTridentSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 35.0, H: 8.23, W: 3.44, D: 3.7, k: 1.2, nose: "airliner", tl: 9, te: 0.5,
  span: 29.87, root: 7.5, kink: [0.3, 4.5], tip: 1.5, sweep: 35, dih: 3, at: 13.0,
  eng: [{ kind: "rear", d: 26.0, y: 3.5, z: 2.3, r: 0.6, len: 4.0 }, { kind: "tail", d: 26, r: 0.6, len: 3, duct: "s" }],
  tk: "T", fin: [5.0, 3.0, 45, 28.0], tp: [10.4, 3.0, 1.2, 35, 0],
  ng: [3.0, 0.33, true], mg: [[16.0, 2.9, 0.5, true, 2]],
  win: [[5, 25, 0.51]], doors: [3.6],
}), ...chosen(TRIDENT, p) });

const BAC111 = /* @__PURE__ */ L("bea", "tarom", "aerLingus");
export const bac111Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 32.61, H: 7.47, W: 3.15, D: 3.3, k: 0.95, nose: "airliner", tl: 8.5,
  span: 28.5, root: 6.5, kink: [0.3, 4.0], tip: 1.4, sweep: 20, dih: 2, at: 13.0,
  eng: [{ kind: "rear", d: 24.0, y: 3.15, z: 2.2, r: 0.6, len: 4.0 }],
  tk: "T", fin: [4.8, 2.5, 40, 26.0], tp: [8.99, 2.9, 1.1, 28, 0],
  ng: [3.1, 0.32, true], mg: [[15.7, 2.1, 0.5, true]],
  win: [[4.5, 24, 0.51]], doors: [3.4],
}), ...chosen(BAC111, p) });

const BAE146 = /* @__PURE__ */ L("britishAirways", "lufthansa", "swiss");
export const bae146Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 28.6, H: 8.61, W: 3.56, D: 3.6, k: 0.85, nose: "blunt", tl: 8.5,
  span: 26.21, root: 4.6, tip: 1.5, sweep: 15, dih: -3, at: 11.0, pos: "high",
  eng: [{ kind: "pod", s: [3.4, 6.0], r: 0.62, len: 3.4, ahead: 2.2, drop: 0.55 }],
  tk: "T", fin: [5.0, 3.0, 40, 22.5, 2], tp: [11.09, 3.1, 1.3, 25, 0],
  ng: [3.0, 0.33, true], mg: [[14.2, 2.36, 0.45, true, undefined, 1.25]], gx: { fairing: { d0: 12.0, d1: 16.6, hw: 2.15, h: 1.1 } },
  win: [[4, 23, 0.55]], doors: [3.2, 24.5],
}), ...chosen(BAE146, p) });

const F28 = /* @__PURE__ */ L("klm", "garuda", "sas");
export const fokkerF28Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 29.61, H: 8.47, W: 3.3, D: 3.3, k: 0.9, nose: "airliner", tl: 8,
  span: 25.07, root: 5.5, tip: 1.6, sweep: 16, dih: 2.5, at: 11.5,
  eng: [{ kind: "rear", d: 21.0, y: 3.1, z: 2.15, r: 0.6, len: 4.0 }],
  tk: "T", fin: [4.8, 2.6, 40, 22.7], tp: [8.64, 2.6, 1.1, 28, 0],
  ng: [3.0, 0.32, true], mg: [[13.5, 2.5, 0.47, true]],
  win: [[4.5, 22, 0.51]], doors: [3.3],
}), ...chosen(F28, p) });

const F100 = /* @__PURE__ */ L("klm", "swissair", "american");
export const fokker100Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 35.53, H: 8.5, W: 3.3, D: 3.3, k: 0.95, nose: "airliner", tl: 8.5,
  span: 28.08, root: 6.0, tip: 1.5, sweep: 17, dih: 2.5, at: 14.5,
  eng: [{ kind: "rear", d: 26.5, y: 3.2, z: 2.2, r: 0.66, len: 4.5 }],
  tk: "T", fin: [4.8, 2.6, 40, 28.4], tp: [10.04, 2.8, 1.1, 28, 0],
  ng: [3.0, 0.33, true], mg: [[17.0, 2.52, 0.5, true]],
  win: [[4.5, 27, 0.51]], doors: [3.3, 33.5],
}), ...chosen(F100, p) });

// ---------------------------------------------------------------------------
// The Soviet Union and Russia

const TU104 = /* @__PURE__ */ L("aeroflot", "csa");
export const tupolevTu104Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 38.85, H: 11.9, W: 3.5, D: 3.5, k: 1.6, nose: "glazed", tl: 10,
  span: 34.54, root: 9.0, kink: [0.25, 6.0], tip: 2.5, sweep: 37, dih: -3, at: 13.5,
  eng: [{ kind: "buried", s: [2.7], r: 0.85, len: 8 }],
  fin: [6.5, 2.4, 40, 30.5, 2], tp: [11.75, 3.8, 1.4, 40, 33, 6],
  ng: [5.0, 0.45, true], mg: [[19.0, 5.0, 0.6, true, 2]], gx: { pods: true },
  win: [[6, 30, 0.9, 0.6, 0.17, 0.17, "round"]], doors: [5.6, 29.5],
}), ...chosen(TU104, p) });

const TU134 = /* @__PURE__ */ L("aeroflot", "csa", "interflug");
export const tupolevTu134Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 37.1, H: 9.02, W: 2.9, D: 2.9, k: 1.05, nose: "glazed", tl: 9.5,
  span: 29.01, root: 6.5, kink: [0.3, 4.5], tip: 1.4, sweep: 38, dih: -1.5, at: 13.5,
  eng: [{ kind: "rear", d: 25.5, y: 3.3, z: 2.05, r: 0.58, len: 4.5 }],
  tk: "T", fin: [5.0, 2.7, 50, 27.2], tp: [9.2, 3.0, 1.1, 40, 0],
  ng: [4.5, 0.33, true], mg: [[19.0, 4.8, 0.5, true, 2]], gx: { pods: true },
  win: [[5, 25, 0.9, 0.6, 0.17, 0.17, "round"]], doors: [5.0],
}), ...chosen(TU134, p) });

const TU154 = /* @__PURE__ */ L("aeroflot", "balkan", "malev");
export const tupolevTu154Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 47.9, H: 11.4, W: 3.8, D: 3.8, k: 1.4, nose: "airliner", tl: 11.5, te: 0.6,
  span: 37.55, root: 8.5, kink: [0.3, 5.5], tip: 1.8, sweep: 41, dih: -1, at: 18.5,
  eng: [{ kind: "rear", d: 37.5, y: 4.3, z: 2.55, r: 0.7, len: 5.0 }, { kind: "tail", d: 37.5, r: 0.7, len: 3.5, duct: "s" }],
  tk: "T", fin: [6.5, 3.5, 45, 38.5], tp: [13.4, 3.8, 1.4, 40, 0],
  ng: [6.0, 0.45, true], mg: [[24.5, 5.7, 0.5, true, 3]], gx: { pods: true },
  win: [[6, 37, 0.51]], doors: [5.5, 15.5],
}), ...chosen(TU154, p) });

const TU144 = /* @__PURE__ */ L("aeroflot", "plain");
export const tupolevTu144Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 65.7, H: 12.5, W: 3.4, D: 3.6, k: 2.6, nose: "pointed", ns: 0.85, tl: 14, ty: 0.55,
  span: 28.8, root: 38.0, tip: 3.0, sweep: 60, dih: 0, at: 25.0, wy: 3.15, thick: [0.035, 0.03],
  plan: [[0, 25.0, 38.0], [2.0, 27.0, 36.0], [3.5, 33.0, 30.0], [5.0, 44.0, 19.5], [9.0, 49.5, 12.5], [12.5, 55.0, 6.0], [14.4, 57.5, 3.0]],
  eng: [{ kind: "pod", s: [1.0, 2.6], r: 0.7, len: 15, ahead: -8, drop: 0.75, jet: true }],
  fin: [12.0, 2.3, 48, 51.5],
  ng: [21.0, 0.45, true], mg: [[40.0, 3.4, 0.5, true, 3]],
  win: [[12, 52, 0.6, 0.62, 0.08, 0.11]], doors: [11.5],
  extra: (m, g) => m.scope("canards", () => {
    // the retractable canards behind the cockpit, deployed
    const d = 8.5;
    const y = g.crown(d) - 0.25;
    for (const side of [-1, 1]) m.facets("alloy", [[g.x(d) + 0.6, y, side * g.hw(d) * 0.9], [g.x(d) - 1.2, y, side * g.hw(d) * 0.9], [g.x(d) - 0.6, y, side * 4.0]], [0, 1, 0]);
    for (const side of [-1, 1]) m.facets("alloy", [[g.x(d) + 0.6, y - 0.03, side * g.hw(d) * 0.9], [g.x(d) - 1.2, y - 0.03, side * g.hw(d) * 0.9], [g.x(d) - 0.6, y - 0.03, side * 4.0]], [0, -1, 0]);
  }),
}), ...chosen(TU144, p) });

const IL62 = /* @__PURE__ */ L("aeroflot", "csa", "interflug");
export const ilyushinIl62Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 53.12, H: 12.35, W: 3.75, D: 4.1, k: 1.4, nose: "airliner", ns: 1.15, tl: 12,
  span: 43.2, root: 10.0, kink: [0.3, 6.5], tip: 2.2, sweep: 35, dih: -1, at: 19.0,
  eng: [{ kind: "rear", d: 40.5, y: 4.2, z: 2.5, r: 0.65, len: 5.5, pair: true }],
  tk: "T", fin: [7.2, 3.4, 45, 42.0], tp: [12.2, 3.6, 1.4, 40, 0],
  ng: [4.5, 0.44, true], mg: [[29.0, 3.4, 0.55, true, 2]],
  win: [[6, 39, 0.51, 0.6, 0.15, 0.15, "round"]], doors: [5.5, 24],
}), ...chosen(IL62, p) });

const IL86 = /* @__PURE__ */ L("aeroflot", "aeroflotNew");
export const ilyushinIl86Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 59.54, H: 15.81, W: 6.08, D: 6.08, k: 2.0, nose: "airliner", tl: 14,
  span: 48.06, root: 12.5, kink: [0.33, 7.3], tip: 2.6, sweep: 35, dih: 6, at: 23.0,
  eng: [{ kind: "pod", s: [9.0, 16.0], r: 1.05, len: 6.0, ahead: 4.5, drop: 1.3, jet: true }],
  fin: [9.0, 3.3, 45, 48.0], tp: [20.6, 6.8, 2.4, 40, 51.5, 6],
  ng: [5.0, 0.5, true], mg: [[26.3, 5.3, 0.6, true, 2], [27.0, 0, 0.6, true, 2]],
  win: [[7, 50, 0.55]], doors: [6, 18, 33, 49],
}), ...chosen(IL86, p) });

const IL96 = /* @__PURE__ */ L("aeroflotNew", "cubana", "rossiya");
export const ilyushinIl96Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 55.35, H: 17.57, W: 6.08, D: 6.08, k: 2.05, nose: "airliner", tl: 14,
  span: 57.66, root: 12.5, kink: [0.3, 7.3], tip: 2.2, sweep: 30, dih: 5, at: 21.5, dev: "canted", dh: 2.6,
  eng: [{ kind: "pod", s: [9.0, 17.0], r: 1.3, len: 5.2, ahead: 4.0, drop: 1.0 }],
  fin: [9.5, 3.3, 42, 44.0, 2], tp: [20.6, 6.8, 2.4, 38, 47.5, 6],
  ng: [5.0, 0.5, true], mg: [[26.3, 5.3, 0.6, true, 2], [27.0, 0, 0.6, true, 2]],
  win: [[7, 47, 0.55]], doors: [6.5, 17, 33, 46],
}), ...chosen(IL96, p) });

const YAK40 = /* @__PURE__ */ L("aeroflot", "csa");
export const yakovlevYak40Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 20.36, H: 6.5, W: 2.4, D: 2.4, k: 0.65, nose: "blunt", ns: 1.2, tl: 6.5, te: 0.42,
  span: 25.0, root: 4.0, tip: 1.4, sweep: 1, dih: 4, at: 7.5,
  eng: [{ kind: "rear", d: 15.5, y: 2.15, z: 1.6, r: 0.45, len: 3.0 }, { kind: "tail", d: 15.0, r: 0.45, len: 2.2, duct: "s" }],
  tk: "T", fin: [3.8, 2.2, 45, 16.0], tp: [7.5, 2.0, 1.0, 25, 0],
  ng: [2.4, 0.3, true], mg: [[9.9, 1.8, 0.45]],
  win: [[3, 14, 0.8, 0.6, 0.17, 0.17, "round"]], doors: [2.8],
}), ...chosen(YAK40, p) });

const YAK42 = /* @__PURE__ */ L("aeroflot", "cubana");
export const yakovlevYak42Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 36.38, H: 9.83, W: 3.8, D: 3.8, k: 1.1, nose: "airliner", tl: 10, te: 0.6,
  span: 34.88, root: 6.5, kink: [0.3, 4.5], tip: 1.5, sweep: 23, dih: -2, at: 14.0,
  eng: [{ kind: "rear", d: 27.5, y: 3.6, z: 2.5, r: 0.68, len: 4.4 }, { kind: "tail", d: 27, r: 0.68, len: 3.0, duct: "s" }],
  tk: "T", fin: [5.8, 3.2, 40, 28.5], tp: [12.0, 3.4, 1.3, 35, 0],
  ng: [3.6, 0.35, true], mg: [[18.3, 2.9, 0.45, true, 2]],
  win: [[5, 26, 0.55, 0.6, 0.15, 0.15, "round"]], doors: [4.0, 30],
}), ...chosen(YAK42, p) });

const SSJ = /* @__PURE__ */ L("aeroflotNew", "rossiya");
export const sukhoiSuperjetSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 29.94, H: 10.28, W: 3.46, D: 3.24, k: 1.05, nose: "airliner", tl: 8,
  span: 27.8, root: 6.3, kink: [0.3, 4.0], tip: 1.3, sweep: 27, dih: 5, at: 11.5, dev: "sharklet", dh: 1.6,
  eng: [{ kind: "pod", s: [4.5], r: 0.95, len: 3.8, ahead: 2.7, drop: 0.6 }],
  fin: [5.8, 2.0, 40, 22.5, 2], tp: [10.6, 3.3, 1.2, 32, 25.3, 6],
  ng: [3.4, 0.35, true], mg: [[14.1, 3.2, 0.55, true]],
  win: [[4.5, 24, 0.51]], doors: [3.8, 27.5],
}), ...chosen(SSJ, p) });

const AN148 = /* @__PURE__ */ L("rossiya", "ukraine");
export const antonovAn148Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 29.13, H: 8.19, W: 3.35, D: 3.35, k: 0.9, nose: "blunt", tl: 8.5,
  span: 28.91, root: 4.8, tip: 1.6, sweep: 25, dih: -3, at: 10.5, pos: "high", dev: "blended", dh: 1.4,
  eng: [{ kind: "pod", s: [3.7], r: 0.75, len: 3.7, ahead: 2.4, drop: 0.55 }],
  tk: "T", fin: [5.5, 3.2, 40, 22.0, 2], tp: [10.0, 2.7, 1.2, 30, 0],
  ng: [3.0, 0.33, true], mg: [[13.9, 2.1, 0.45, true, undefined, 1.25]], gx: { fairing: { d0: 11.8, d1: 16.0, hw: 2.0, h: 1.05 } },
  win: [[4, 22, 0.55]], doors: [3.0, 24.5],
}), ...chosen(AN148, p) });

// ---------------------------------------------------------------------------
// Regional jets: Brazil, Canada, China

const E190 = /* @__PURE__ */ L("klm", "lot", "aeromexico");
export const embraerE190Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 36.24, H: 10.57, W: 3.01, D: 3.35, k: 1.05, nose: "airliner", ns: 1.1, tl: 8.5,
  span: 28.72, root: 6.0, kink: [0.3, 3.8], tip: 1.3, sweep: 24, dih: 5, at: 13.5, dev: "blended", dh: 1.5,
  eng: [{ kind: "pod", s: [4.8], r: 0.85, len: 3.6, ahead: 2.6, drop: 0.55 }],
  fin: [5.8, 2.2, 40, 27.4, 2], tp: [10.0, 3.4, 1.2, 30, 30.0, 6],
  ng: [3.3, 0.33, true], mg: [[17.4, 2.97, 0.5, true]],
  win: [[4.5, 28, 0.51]], doors: [3.7, 33.5],
}), ...chosen(E190, p) });

const E195E2 = /* @__PURE__ */ L("azul", "embraer", "klm");
export const embraerE195E2Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 41.5, H: 10.9, W: 3.01, D: 3.35, k: 1.15, nose: "airliner", ns: 1.1, tl: 9,
  span: 35.12, root: 7.0, kink: [0.3, 4.3], tip: 1.2, sweep: 26, dih: 5, at: 15.5, dev: "raked",
  eng: [{ kind: "pod", s: [5.0], r: 1.05, len: 4.1, ahead: 3.0, drop: 0.55 }],
  fin: [5.8, 2.3, 40, 32.4, 2], tp: [10.5, 3.4, 1.2, 30, 35.0, 6],
  ng: [3.5, 0.35, true], mg: [[20.5, 3.0, 0.55, true]],
  win: [[4.5, 33, 0.51]], doors: [3.8, 38.5],
}), ...chosen(E195E2, p) });

const ERJ145 = /* @__PURE__ */ L("american", "airFrance", "lot");
export const embraerErj145Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 29.87, H: 6.76, W: 2.28, D: 2.28, k: 0.75, nose: "bizjet", tl: 7.5,
  span: 20.04, root: 3.9, tip: 1.2, sweep: 23, dih: 4, at: 12.0, dev: "blended", dh: 0.9,
  eng: [{ kind: "rear", d: 21.5, y: 2.4, z: 1.65, r: 0.55, len: 3.8 }],
  tk: "T", fin: [3.8, 2.3, 40, 23.2], tp: [7.6, 2.3, 1.0, 28, 0],
  ng: [2.7, 0.3, true], mg: [[17.1, 2.05, 0.4, true]],
  win: [[4, 22, 0.55, 0.6, 0.13, 0.16]], doors: [3.0],
}), ...chosen(ERJ145, p) });

const CRJ200 = /* @__PURE__ */ L("lufthansa", "delta", "airCanada");
export const bombardierCrj200Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 26.77, H: 6.22, W: 2.69, D: 2.69, k: 0.8, nose: "bizjet", tl: 7.5,
  span: 21.21, root: 4.2, kink: [0.3, 2.9], tip: 1.0, sweep: 26, dih: 3, at: 10.5, dev: "blended", dh: 1.2,
  eng: [{ kind: "rear", d: 18.8, y: 2.6, z: 1.75, r: 0.6, len: 3.5 }],
  tk: "T", fin: [3.8, 2.5, 45, 20.0], tp: [6.2, 2.0, 1.0, 30, 0],
  ng: [2.4, 0.3, true], mg: [[13.8, 1.6, 0.4, true]],
  win: [[4, 19, 0.51]], doors: [2.9],
}), ...chosen(CRJ200, p) });

const CRJ900 = /* @__PURE__ */ L("delta", "lufthansa", "garuda");
export const bombardierCrj900Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 36.2, H: 7.51, W: 2.69, D: 2.69, k: 0.85, nose: "bizjet", tl: 8.5,
  span: 24.85, root: 5.0, kink: [0.3, 3.3], tip: 1.1, sweep: 26, dih: 3, at: 15.5, dev: "blended", dh: 1.3,
  eng: [{ kind: "rear", d: 27.8, y: 2.65, z: 1.8, r: 0.65, len: 3.8 }],
  tk: "T", fin: [4.0, 2.5, 45, 29.3], tp: [8.5, 2.3, 1.1, 30, 0],
  ng: [2.6, 0.3, true], mg: [[19.9, 2.0, 0.45, true]],
  win: [[4, 28, 0.51]], doors: [3.0, 33],
}), ...chosen(CRJ900, p) });

const C919 = /* @__PURE__ */ L("chinaEastern", "comac", "airChina");
export const comacC919Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 38.9, H: 11.95, W: 3.96, D: 4.17, k: 1.2, nose: "airliner", tl: 9.5,
  span: 35.8, root: 7.6, kink: [0.3, 4.6], tip: 1.4, sweep: 27, dih: 5, at: 14.3, dev: "sharklet", dh: 2.4,
  eng: [{ kind: "pod", s: [5.8], r: 1.08, len: 4.2, ahead: 3.1, drop: 0.55 }],
  fin: [6.3, 2.1, 40, 30.6, 2.5], tp: [12.8, 3.9, 1.3, 32, 33.3, 6],
  ng: [5.2, 0.38, true], mg: [[18.7, 3.9, 0.57, true]],
  win: [[6, 32, 0.51]], doors: [5.0, 35.5],
}), ...chosen(C919, p) });

const ARJ21 = /* @__PURE__ */ L("comac", "chinaSouthern", "airChina");
export const comacArj21Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 33.46, H: 8.44, W: 3.14, D: 3.14, k: 1.0, nose: "airliner", tl: 8.5,
  span: 27.29, root: 5.8, kink: [0.3, 3.9], tip: 1.3, sweep: 25, dih: 4, at: 13.7, dev: "blended", dh: 1.4,
  eng: [{ kind: "rear", d: 24.5, y: 3.15, z: 2.15, r: 0.7, len: 4.2 }],
  tk: "T", fin: [5.0, 2.8, 40, 26.2], tp: [9.6, 2.8, 1.1, 30, 0],
  ng: [3.3, 0.33, true], mg: [[16.8, 2.47, 0.5, true]],
  win: [[4.5, 24.5, 0.51]], doors: [3.6],
}), ...chosen(ARJ21, p) });

// ---------------------------------------------------------------------------
// Business jets

export const gulfstreamG650Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 30.41, H: 7.82, W: 2.6, D: 2.5, k: 0.95, nose: "bizjet", tl: 8.5,
  span: 30.36, root: 5.5, kink: [0.3, 3.6], tip: 1.0, sweep: 36, dih: 4, at: 12.8, dev: "blended", dh: 1.6,
  eng: [{ kind: "rear", d: 21.5, y: 2.8, z: 1.95, r: 0.72, len: 4.5 }],
  tk: "T", fin: [4.5, 2.5, 45, 24.0], tp: [9.98, 2.6, 1.0, 35, 0],
  ng: [3.2, 0.3, true], mg: [[17.0, 2.15, 0.45, true]],
  win: [[6, 18, 1.05, 0.55, 0.24, 0.19]], doors: [4.5],
}), ...chosen(COLOUR, p) });

export const bombardierGlobalSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 33.88, H: 8.23, W: 2.69, D: 2.6, k: 1.0, nose: "bizjet", tl: 9,
  span: 31.68, root: 6.0, kink: [0.3, 3.9], tip: 1.0, sweep: 33, dih: 4, at: 14.5, dev: "blended", dh: 1.6,
  eng: [{ kind: "rear", d: 24.5, y: 2.95, z: 2.0, r: 0.75, len: 4.6 }],
  tk: "T", fin: [4.8, 2.6, 45, 27.0], tp: [9.6, 2.7, 1.0, 35, 0],
  ng: [3.4, 0.3, true], mg: [[18.9, 2.1, 0.47, true]],
  win: [[6, 21, 1.05, 0.55, 0.24, 0.19]], doors: [4.2],
}), ...chosen(COLOUR, p) });

export const falcon7xSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 23.38, H: 7.83, W: 2.34, D: 2.3, k: 1.0, nose: "bizjet", tl: 7.5, te: 0.38,
  span: 26.21, root: 5.4, kink: [0.3, 3.4], tip: 1.0, sweep: 34, dih: 4, at: 9.5, dev: "blended", dh: 1.5,
  eng: [{ kind: "rear", d: 16.0, y: 2.55, z: 1.55, r: 0.52, len: 3.4 }, { kind: "tail", d: 15.8, r: 0.5, len: 2.5, duct: "s" }],
  tk: "cruciform", fin: [4.2, 2.0, 45, 17.5], tp: [8.0, 2.4, 1.0, 35, 19.0],
  ng: [2.6, 0.28, true], mg: [[11.7, 2.6, 0.42, true]],
  win: [[5, 15, 0.85, 0.55, 0.22, 0.18]], doors: [3.2],
}), ...chosen(COLOUR, p) });

export const learjet35Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 14.83, H: 3.73, W: 1.6, D: 1.65, k: 0.75, nose: "bizjet", tl: 5.0, n: 28,
  span: 12.04, root: 2.8, tip: 1.3, sweep: 13, dih: 2.5, at: 6.3, dev: "tiptank",
  eng: [{ kind: "rear", d: 9.8, y: 1.65, z: 1.25, r: 0.42, len: 2.6 }],
  tk: "T", fin: [2.5, 1.5, 40, 10.8], tp: [4.5, 1.4, 0.8, 30, 0],
  ng: [2.0, 0.25, true], mg: [[8.1, 1.25, 0.33]],
  win: [[4.0, 8.5, 0.7, 0.55, 0.2, 0.24]], doors: [3.0],
}), ...chosen(COLOUR, p) });

export const embraerPhenom300Spec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 15.64, H: 5.1, W: 1.68, D: 1.7, k: 0.75, nose: "bizjet", tl: 5.0, n: 28,
  span: 16.2, root: 2.6, tip: 1.0, sweep: 12, dih: 4, at: 6.5, dev: "blended", dh: 0.9,
  eng: [{ kind: "rear", d: 10.5, y: 1.95, z: 1.3, r: 0.45, len: 2.4 }],
  tk: "T", fin: [2.4, 1.3, 40, 11.5], tp: [5.4, 1.4, 0.7, 30, 0],
  ng: [1.8, 0.22], mg: [[8.1, 1.4, 0.3]],
  win: [[4, 8, 0.7, 0.55, 0.18, 0.22]], doors: [2.8],
}), ...chosen(COLOUR, p) });

export const hondajetSpec = (p?: ParamValues): AirframeSpec => ({ ...brief({
  L: 12.99, H: 4.54, W: 1.52, D: 1.6, k: 0.62, nose: "bizjet", tl: 4.5, n: 28,
  span: 12.12, root: 2.0, tip: 1.0, sweep: 5, dih: 3, at: 5.2, dev: "blended", dh: 0.5,
  eng: [{ kind: "pod", s: [2.0], r: 0.38, len: 2.3, ahead: -0.6, drop: 0.45, over: true }],
  fin: [2.2, 1.0, 45, 10.3, 1.0], tp: [5.0, 1.3, 0.7, 30, 10.9],
  ng: [1.6, 0.2], mg: [[6.5, 1.4, 0.3]],
  win: [[3.6, 7.0, 0.7, 0.55, 0.17, 0.2]], doors: [2.4],
}), ...chosen(COLOUR, p) });

// ---------------------------------------------------------------------------
// the builders: named exports, so a design's JS model imports them by name (jsModel.ts)

export function boeing707(p?: ParamValues): MeshBuilder { return airframe(boeing707Spec(p)); }
export function boeing707Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing707Spec(p)); }
export function boeing727(p?: ParamValues): MeshBuilder { return airframe(boeing727Spec(p)); }
export function boeing727Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing727Spec(p)); }
export function boeing737200(p?: ParamValues): MeshBuilder { return airframe(boeing737200Spec(p)); }
export function boeing737200Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing737200Spec(p)); }
export function boeing737Max(p?: ParamValues): MeshBuilder { return airframe(boeing737MaxSpec(p)); }
export function boeing737MaxLod(p?: ParamValues): MeshBuilder { return airframeLod(boeing737MaxSpec(p)); }
export function boeing7478(p?: ParamValues): MeshBuilder { return airframe(boeing7478Spec(p)); }
export function boeing7478Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing7478Spec(p)); }
export function boeing757(p?: ParamValues): MeshBuilder { return airframe(boeing757Spec(p)); }
export function boeing757Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing757Spec(p)); }
export function boeing767(p?: ParamValues): MeshBuilder { return airframe(boeing767Spec(p)); }
export function boeing767Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing767Spec(p)); }
export function boeing777(p?: ParamValues): MeshBuilder { return airframe(boeing777Spec(p)); }
export function boeing777Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing777Spec(p)); }
export function boeing787(p?: ParamValues): MeshBuilder { return airframe(boeing787Spec(p)); }
export function boeing787Lod(p?: ParamValues): MeshBuilder { return airframeLod(boeing787Spec(p)); }
export function douglasDc8(p?: ParamValues): MeshBuilder { return airframe(douglasDc8Spec(p)); }
export function douglasDc8Lod(p?: ParamValues): MeshBuilder { return airframeLod(douglasDc8Spec(p)); }
export function douglasDc9(p?: ParamValues): MeshBuilder { return airframe(douglasDc9Spec(p)); }
export function douglasDc9Lod(p?: ParamValues): MeshBuilder { return airframeLod(douglasDc9Spec(p)); }
export function md80(p?: ParamValues): MeshBuilder { return airframe(md80Spec(p)); }
export function md80Lod(p?: ParamValues): MeshBuilder { return airframeLod(md80Spec(p)); }
export function douglasDc10(p?: ParamValues): MeshBuilder { return airframe(douglasDc10Spec(p)); }
export function douglasDc10Lod(p?: ParamValues): MeshBuilder { return airframeLod(douglasDc10Spec(p)); }
export function lockheedTristar(p?: ParamValues): MeshBuilder { return airframe(lockheedTristarSpec(p)); }
export function lockheedTristarLod(p?: ParamValues): MeshBuilder { return airframeLod(lockheedTristarSpec(p)); }
export function convair880(p?: ParamValues): MeshBuilder { return airframe(convair880Spec(p)); }
export function convair880Lod(p?: ParamValues): MeshBuilder { return airframeLod(convair880Spec(p)); }
export function airbusA300(p?: ParamValues): MeshBuilder { return airframe(airbusA300Spec(p)); }
export function airbusA300Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA300Spec(p)); }
export function airbusA310(p?: ParamValues): MeshBuilder { return airframe(airbusA310Spec(p)); }
export function airbusA310Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA310Spec(p)); }
export function airbusA320(p?: ParamValues): MeshBuilder { return airframe(airbusA320Spec(p)); }
export function airbusA320Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA320Spec(p)); }
export function airbusA321neo(p?: ParamValues): MeshBuilder { return airframe(airbusA321neoSpec(p)); }
export function airbusA321neoLod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA321neoSpec(p)); }
export function airbusA330(p?: ParamValues): MeshBuilder { return airframe(airbusA330Spec(p)); }
export function airbusA330Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA330Spec(p)); }
export function airbusA340(p?: ParamValues): MeshBuilder { return airframe(airbusA340Spec(p)); }
export function airbusA340Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA340Spec(p)); }
export function airbusA350(p?: ParamValues): MeshBuilder { return airframe(airbusA350Spec(p)); }
export function airbusA350Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA350Spec(p)); }
export function airbusA220(p?: ParamValues): MeshBuilder { return airframe(airbusA220Spec(p)); }
export function airbusA220Lod(p?: ParamValues): MeshBuilder { return airframeLod(airbusA220Spec(p)); }
export function concorde(p?: ParamValues): MeshBuilder { return airframe(concordeSpec(p)); }
export function concordeLod(p?: ParamValues): MeshBuilder { return airframeLod(concordeSpec(p)); }
export function caravelle(p?: ParamValues): MeshBuilder { return airframe(caravelleSpec(p)); }
export function caravelleLod(p?: ParamValues): MeshBuilder { return airframeLod(caravelleSpec(p)); }
export function dhComet(p?: ParamValues): MeshBuilder { return airframe(dhCometSpec(p)); }
export function dhCometLod(p?: ParamValues): MeshBuilder { return airframeLod(dhCometSpec(p)); }
export function vickersVc10(p?: ParamValues): MeshBuilder { return airframe(vickersVc10Spec(p)); }
export function vickersVc10Lod(p?: ParamValues): MeshBuilder { return airframeLod(vickersVc10Spec(p)); }
export function hsTrident(p?: ParamValues): MeshBuilder { return airframe(hsTridentSpec(p)); }
export function hsTridentLod(p?: ParamValues): MeshBuilder { return airframeLod(hsTridentSpec(p)); }
export function bac111(p?: ParamValues): MeshBuilder { return airframe(bac111Spec(p)); }
export function bac111Lod(p?: ParamValues): MeshBuilder { return airframeLod(bac111Spec(p)); }
export function bae146(p?: ParamValues): MeshBuilder { return airframe(bae146Spec(p)); }
export function bae146Lod(p?: ParamValues): MeshBuilder { return airframeLod(bae146Spec(p)); }
export function fokkerF28(p?: ParamValues): MeshBuilder { return airframe(fokkerF28Spec(p)); }
export function fokkerF28Lod(p?: ParamValues): MeshBuilder { return airframeLod(fokkerF28Spec(p)); }
export function fokker100(p?: ParamValues): MeshBuilder { return airframe(fokker100Spec(p)); }
export function fokker100Lod(p?: ParamValues): MeshBuilder { return airframeLod(fokker100Spec(p)); }
export function tupolevTu104(p?: ParamValues): MeshBuilder { return airframe(tupolevTu104Spec(p)); }
export function tupolevTu104Lod(p?: ParamValues): MeshBuilder { return airframeLod(tupolevTu104Spec(p)); }
export function tupolevTu134(p?: ParamValues): MeshBuilder { return airframe(tupolevTu134Spec(p)); }
export function tupolevTu134Lod(p?: ParamValues): MeshBuilder { return airframeLod(tupolevTu134Spec(p)); }
export function tupolevTu154(p?: ParamValues): MeshBuilder { return airframe(tupolevTu154Spec(p)); }
export function tupolevTu154Lod(p?: ParamValues): MeshBuilder { return airframeLod(tupolevTu154Spec(p)); }
export function tupolevTu144(p?: ParamValues): MeshBuilder { return airframe(tupolevTu144Spec(p)); }
export function tupolevTu144Lod(p?: ParamValues): MeshBuilder { return airframeLod(tupolevTu144Spec(p)); }
export function ilyushinIl62(p?: ParamValues): MeshBuilder { return airframe(ilyushinIl62Spec(p)); }
export function ilyushinIl62Lod(p?: ParamValues): MeshBuilder { return airframeLod(ilyushinIl62Spec(p)); }
export function ilyushinIl86(p?: ParamValues): MeshBuilder { return airframe(ilyushinIl86Spec(p)); }
export function ilyushinIl86Lod(p?: ParamValues): MeshBuilder { return airframeLod(ilyushinIl86Spec(p)); }
export function ilyushinIl96(p?: ParamValues): MeshBuilder { return airframe(ilyushinIl96Spec(p)); }
export function ilyushinIl96Lod(p?: ParamValues): MeshBuilder { return airframeLod(ilyushinIl96Spec(p)); }
export function yakovlevYak40(p?: ParamValues): MeshBuilder { return airframe(yakovlevYak40Spec(p)); }
export function yakovlevYak40Lod(p?: ParamValues): MeshBuilder { return airframeLod(yakovlevYak40Spec(p)); }
export function yakovlevYak42(p?: ParamValues): MeshBuilder { return airframe(yakovlevYak42Spec(p)); }
export function yakovlevYak42Lod(p?: ParamValues): MeshBuilder { return airframeLod(yakovlevYak42Spec(p)); }
export function sukhoiSuperjet(p?: ParamValues): MeshBuilder { return airframe(sukhoiSuperjetSpec(p)); }
export function sukhoiSuperjetLod(p?: ParamValues): MeshBuilder { return airframeLod(sukhoiSuperjetSpec(p)); }
export function antonovAn148(p?: ParamValues): MeshBuilder { return airframe(antonovAn148Spec(p)); }
export function antonovAn148Lod(p?: ParamValues): MeshBuilder { return airframeLod(antonovAn148Spec(p)); }
export function embraerE190(p?: ParamValues): MeshBuilder { return airframe(embraerE190Spec(p)); }
export function embraerE190Lod(p?: ParamValues): MeshBuilder { return airframeLod(embraerE190Spec(p)); }
export function embraerE195E2(p?: ParamValues): MeshBuilder { return airframe(embraerE195E2Spec(p)); }
export function embraerE195E2Lod(p?: ParamValues): MeshBuilder { return airframeLod(embraerE195E2Spec(p)); }
export function embraerErj145(p?: ParamValues): MeshBuilder { return airframe(embraerErj145Spec(p)); }
export function embraerErj145Lod(p?: ParamValues): MeshBuilder { return airframeLod(embraerErj145Spec(p)); }
export function bombardierCrj200(p?: ParamValues): MeshBuilder { return airframe(bombardierCrj200Spec(p)); }
export function bombardierCrj200Lod(p?: ParamValues): MeshBuilder { return airframeLod(bombardierCrj200Spec(p)); }
export function bombardierCrj900(p?: ParamValues): MeshBuilder { return airframe(bombardierCrj900Spec(p)); }
export function bombardierCrj900Lod(p?: ParamValues): MeshBuilder { return airframeLod(bombardierCrj900Spec(p)); }
export function comacC919(p?: ParamValues): MeshBuilder { return airframe(comacC919Spec(p)); }
export function comacC919Lod(p?: ParamValues): MeshBuilder { return airframeLod(comacC919Spec(p)); }
export function comacArj21(p?: ParamValues): MeshBuilder { return airframe(comacArj21Spec(p)); }
export function comacArj21Lod(p?: ParamValues): MeshBuilder { return airframeLod(comacArj21Spec(p)); }
export function gulfstreamG650(p?: ParamValues): MeshBuilder { return airframe(gulfstreamG650Spec(p)); }
export function gulfstreamG650Lod(p?: ParamValues): MeshBuilder { return airframeLod(gulfstreamG650Spec(p)); }
export function bombardierGlobal(p?: ParamValues): MeshBuilder { return airframe(bombardierGlobalSpec(p)); }
export function bombardierGlobalLod(p?: ParamValues): MeshBuilder { return airframeLod(bombardierGlobalSpec(p)); }
export function falcon7x(p?: ParamValues): MeshBuilder { return airframe(falcon7xSpec(p)); }
export function falcon7xLod(p?: ParamValues): MeshBuilder { return airframeLod(falcon7xSpec(p)); }
export function learjet35(p?: ParamValues): MeshBuilder { return airframe(learjet35Spec(p)); }
export function learjet35Lod(p?: ParamValues): MeshBuilder { return airframeLod(learjet35Spec(p)); }
export function embraerPhenom300(p?: ParamValues): MeshBuilder { return airframe(embraerPhenom300Spec(p)); }
export function embraerPhenom300Lod(p?: ParamValues): MeshBuilder { return airframeLod(embraerPhenom300Spec(p)); }
export function hondajet(p?: ParamValues): MeshBuilder { return airframe(hondajetSpec(p)); }
export function hondajetLod(p?: ParamValues): MeshBuilder { return airframeLod(hondajetSpec(p)); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md):
// game properties from the published maximum take-off mass, thrust and cruising speed

type Entry = [id: string, title: string, spec: (p?: ParamValues) => AirframeSpec, build: (p?: ParamValues) => MeshBuilder, lod: (p?: ParamValues) => MeshBuilder, params: ReturnType<typeof L> | ParamSpec[] | null, game: WorldAircraft["game"]];

const entry = ([id, title, spec, build, buildLod, params, game]: Entry): WorldAircraft => {
  const ps = params === null ? undefined : Array.isArray(params) ? params : params.params;
  return { id, title, spec, build, buildLod, ...(ps ? { params: ps, finishParams: ps.filter((x) => x.name === "livery" || x.name === "colour").map((x) => x.name) } : {}), game, references: id.replace(/^veh-/, "") };
};

export const WORLD_JET_SPECS: readonly WorldAircraft[] = /* @__PURE__ */ ([
  ["veh-boeing-707", "Boeing 707-320", boeing707Spec, boeing707, boeing707Lod, B707, air(151, 3200, 960, "big", 0.3)],
  ["veh-boeing-727", "Boeing 727-200", boeing727Spec, boeing727, boeing727Lod, B727, air(95, 2130, 950, "medium", 0.32)],
  ["veh-boeing-737-200", "Boeing 737-200", boeing737200Spec, boeing737200, boeing737200Lod, B737_200, air(52, 1420, 780, "medium", 0.3)],
  ["veh-boeing-737-max", "Boeing 737 MAX 8", boeing737MaxSpec, boeing737Max, boeing737MaxLod, B737_MAX, air(82, 2600, 840, "medium", 0.3)],
  ["veh-boeing-747-8", "Boeing 747-8", boeing7478Spec, boeing7478, boeing7478Lod, [...B747_8_PARAMS], air(448, 11840, 920, "big", 0.28)],
  ["veh-boeing-757", "Boeing 757-200", boeing757Spec, boeing757, boeing757Lod, B757, air(116, 3600, 850, "medium", 0.3)],
  ["veh-boeing-767", "Boeing 767-300ER", boeing767Spec, boeing767, boeing767Lod, B767, air(187, 5640, 850, "big", 0.3)],
  ["veh-boeing-777", "Boeing 777-300ER", boeing777Spec, boeing777, boeing777Lod, B777, air(352, 10260, 905, "big", 0.3)],
  ["veh-boeing-787", "Boeing 787-9", boeing787Spec, boeing787, boeing787Lod, B787, air(254, 6400, 903, "big", 0.3)],
  ["veh-douglas-dc8", "Douglas DC-8-63", douglasDc8Spec, douglasDc8, douglasDc8Lod, DC8, air(161, 3400, 880, "big", 0.3)],
  ["veh-douglas-dc9", "McDonnell Douglas DC-9-30", douglasDc9Spec, douglasDc9, douglasDc9Lod, DC9, air(49, 1280, 810, "medium", 0.3)],
  ["veh-md-80", "McDonnell Douglas MD-82", md80Spec, md80, md80Lod, MD80, air(68, 1780, 810, "medium", 0.3)],
  ["veh-douglas-dc10", "McDonnell Douglas DC-10-30", douglasDc10Spec, douglasDc10, douglasDc10Lod, DC10, air(263, 6810, 908, "big", 0.3)],
  ["veh-lockheed-tristar", "Lockheed L-1011 TriStar", lockheedTristarSpec, lockheedTristar, lockheedTristarLod, L1011, air(211, 5610, 890, "big", 0.3)],
  ["veh-convair-880", "Convair 880", convair880Spec, convair880, convair880Lod, CV880, air(87, 2000, 880, "medium", 0.3)],
  ["veh-airbus-a300", "Airbus A300B4", airbusA300Spec, airbusA300, airbusA300Lod, A300, air(165, 4540, 850, "big", 0.3)],
  ["veh-airbus-a310", "Airbus A310", airbusA310Spec, airbusA310, airbusA310Lod, A310, air(164, 4760, 850, "big", 0.3)],
  ["veh-airbus-a320", "Airbus A320", airbusA320Spec, airbusA320, airbusA320Lod, [A320_LENGTH, ...A320.params], air(78, 2360, 830, "medium", 0.3, [{ params: { length: "a319" }, weight: 75.5 }, { params: { length: "a321" }, weight: 93.5, power: 2940 }])],
  ["veh-airbus-a320neo", "Airbus A321neo", airbusA321neoSpec, airbusA321neo, airbusA321neoLod, A321NEO, air(97, 2940, 830, "medium", 0.3)],
  ["veh-airbus-a330", "Airbus A330-300", airbusA330Spec, airbusA330, airbusA330Lod, A330, air(242, 6400, 870, "big", 0.3)],
  ["veh-airbus-a340", "Airbus A340-600", airbusA340Spec, airbusA340, airbusA340Lod, A340, air(380, 10680, 880, "big", 0.3)],
  ["veh-airbus-a350", "Airbus A350-900", airbusA350Spec, airbusA350, airbusA350Lod, A350, air(283, 7500, 903, "big", 0.3)],
  ["veh-airbus-a220", "Airbus A220-300", airbusA220Spec, airbusA220, airbusA220Lod, A220, air(70.9, 2060, 830, "medium", 0.3)],
  ["veh-concorde", "Concorde", concordeSpec, concorde, concordeLod, CONCORDE, air(185, 6760, 2180, "big", 0.3)],
  ["veh-caravelle", "Sud Aviation Caravelle", caravelleSpec, caravelle, caravelleLod, CARAVELLE, air(52, 1060, 780, "medium", 0.35)],
  ["veh-dh-comet", "de Havilland Comet 4", dhCometSpec, dhComet, dhCometLod, COMET, air(73.5, 1840, 800, "medium", 0.3)],
  ["veh-vickers-vc10", "Vickers VC10", vickersVc10Spec, vickersVc10, vickersVc10Lod, VC10, air(152, 4000, 900, "big", 0.3)],
  ["veh-hs-trident", "Hawker Siddeley Trident", hsTridentSpec, hsTrident, hsTridentLod, TRIDENT, air(65, 1600, 950, "medium", 0.32)],
  ["veh-bac-111", "BAC One-Eleven", bac111Spec, bac111, bac111Lod, BAC111, air(47, 1110, 760, "medium", 0.3)],
  ["veh-bae-146", "BAe 146-200", bae146Spec, bae146, bae146Lod, BAE146, air(42, 1240, 760, "medium", 0.4)],
  ["veh-fokker-f28", "Fokker F28 Fellowship", fokkerF28Spec, fokkerF28, fokkerF28Lod, F28, air(33, 880, 780, "medium", 0.32)],
  ["veh-fokker-100", "Fokker 100", fokker100Spec, fokker100, fokker100Lod, F100, air(46, 1340, 760, "medium", 0.32)],
  ["veh-tupolev-tu104", "Tupolev Tu-104", tupolevTu104Spec, tupolevTu104, tupolevTu104Lod, TU104, air(76, 1900, 800, "medium", 0.3)],
  ["veh-tupolev-tu134", "Tupolev Tu-134", tupolevTu134Spec, tupolevTu134, tupolevTu134Lod, TU134, air(47, 1320, 850, "medium", 0.3)],
  ["veh-tupolev-tu154", "Tupolev Tu-154M", tupolevTu154Spec, tupolevTu154, tupolevTu154Lod, TU154, air(100, 3090, 900, "medium", 0.3)],
  ["veh-tupolev-tu144", "Tupolev Tu-144", tupolevTu144Spec, tupolevTu144, tupolevTu144Lod, TU144, air(207, 7840, 2300, "big", 0.3)],
  ["veh-ilyushin-il62", "Ilyushin Il-62M", ilyushinIl62Spec, ilyushinIl62, ilyushinIl62Lod, IL62, air(165, 4280, 850, "big", 0.3)],
  ["veh-ilyushin-il86", "Ilyushin Il-86", ilyushinIl86Spec, ilyushinIl86, ilyushinIl86Lod, IL86, air(208, 5080, 900, "big", 0.3)],
  ["veh-ilyushin-il96", "Ilyushin Il-96-300", ilyushinIl96Spec, ilyushinIl96, ilyushinIl96Lod, IL96, air(250, 6280, 870, "big", 0.3)],
  ["veh-yakovlev-yak40", "Yakovlev Yak-40", yakovlevYak40Spec, yakovlevYak40, yakovlevYak40Lod, YAK40, air(16, 440, 550, "small", 0.3)],
  ["veh-yakovlev-yak42", "Yakovlev Yak-42", yakovlevYak42Spec, yakovlevYak42, yakovlevYak42Lod, YAK42, air(57, 1890, 810, "medium", 0.3)],
  ["veh-sukhoi-superjet", "Sukhoi Superjet 100", sukhoiSuperjetSpec, sukhoiSuperjet, sukhoiSuperjetLod, SSJ, air(49.45, 1540, 830, "medium", 0.3)],
  ["veh-antonov-an148", "Antonov An-148", antonovAn148Spec, antonovAn148, antonovAn148Lod, AN148, air(43.7, 1340, 820, "medium", 0.4)],
  ["veh-embraer-e190", "Embraer E190", embraerE190Spec, embraerE190, embraerE190Lod, E190, air(51.8, 1780, 830, "medium", 0.3)],
  ["veh-embraer-e195-e2", "Embraer E195-E2", embraerE195E2Spec, embraerE195E2, embraerE195E2Lod, E195E2, air(61.5, 2000, 830, "medium", 0.3)],
  ["veh-embraer-erj145", "Embraer ERJ 145", embraerErj145Spec, embraerErj145, embraerErj145Lod, ERJ145, air(22, 660, 830, "medium", 0.3)],
  ["veh-bombardier-crj200", "Bombardier CRJ200", bombardierCrj200Spec, bombardierCrj200, bombardierCrj200Lod, CRJ200, air(24, 820, 785, "medium", 0.3)],
  ["veh-bombardier-crj900", "Bombardier CRJ900", bombardierCrj900Spec, bombardierCrj900, bombardierCrj900Lod, CRJ900, air(38, 1300, 830, "medium", 0.3)],
  ["veh-comac-c919", "COMAC C919", comacC919Spec, comacC919, comacC919Lod, C919, air(78, 2600, 830, "medium", 0.3)],
  ["veh-comac-arj21", "COMAC ARJ21", comacArj21Spec, comacArj21, comacArj21Lod, ARJ21, air(43.5, 1520, 830, "medium", 0.3)],
  ["veh-gulfstream-g650", "Gulfstream G650", gulfstreamG650Spec, gulfstreamG650, gulfstreamG650Lod, COLOUR, air(45.2, 1500, 950, "small", 0.35)],
  ["veh-bombardier-global", "Bombardier Global 7500", bombardierGlobalSpec, bombardierGlobal, bombardierGlobalLod, COLOUR, air(52, 1600, 950, "small", 0.35)],
  ["veh-dassault-falcon-7x", "Dassault Falcon 7X", falcon7xSpec, falcon7x, falcon7xLod, COLOUR, air(31.7, 840, 900, "small", 0.35)],
  ["veh-learjet-35", "Learjet 35", learjet35Spec, learjet35, learjet35Lod, COLOUR, air(8.3, 320, 770, "small", 0.35)],
  ["veh-embraer-phenom-300", "Embraer Phenom 300", embraerPhenom300Spec, embraerPhenom300, embraerPhenom300Lod, COLOUR, air(8.15, 300, 830, "small", 0.35)],
  ["veh-hondajet", "HondaJet HA-420", hondajetSpec, hondajet, hondajetLod, COLOUR, air(4.8, 180, 780, "small", 0.35)],
] as Entry[]).map(entry);

export const WORLD_JETS = /* @__PURE__ */ aircraftDesigns(WORLD_JET_SPECS);
