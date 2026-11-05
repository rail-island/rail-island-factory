// The airline and operator liveries of the world aircraft (docs/models/world-aircraft.md):
// one `Scheme` per carrier and era, in the airframe kit's relative terms, so a
// scheme fits any airframe - colour fields by section height (-1 keel .. 1 crown),
// cheatlines by height above the keel (0 .. 1 of the depth), fin bands by fin
// height, fin shapes in (chord fraction, height fraction), plain titles. Colour
// fields and plain lettering only: simplified emblems, no logos.
//
// The colours are taken from the carriers' published schemes and photographs,
// approximately. A design's `livery` parameter picks its carriers from here
// (`schemes`), the first the default.

import type { Scheme } from "./airframeKit.ts";
import type { P2 } from "./airframeShapes.ts";

/** A disc on the fin. */
const disc = (f: number, h: number, rf: number, rh: number, n = 14): P2[] =>
  Array.from({ length: n }, (_, k) => {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    return [f + rf * Math.cos(t), h + rh * Math.sin(t)];
  });
/** A rectangle on the fin. */
const rect = (f0: number, h0: number, f1: number, h1: number): P2[] => [[f0, h0], [f1, h0], [f1, h1], [f0, h1]];
/** A band slanting up and back across the fin, between two heights at the leading edge. */
const slant = (h0: number, h1: number, rise = 0.25): P2[] => [[0.02, h0], [0.98, h0 + rise], [0.98, h1 + rise], [0.02, h1]];
/** A thin ring on the fin (a roundel's rim). */
const ring = (f: number, h: number, rf: number, rh: number, w: number, n = 12): P2[][] =>
  Array.from({ length: n }, (_, i): P2[] => {
    const a = (i / n) * Math.PI * 2;
    const b = ((i + 1) / n) * Math.PI * 2;
    return [[f + rf * Math.cos(a), h + rh * Math.sin(a)], [f + rf * Math.cos(b), h + rh * Math.sin(b)], [f + (rf - w) * Math.cos(b), h + (rh - w * rh / rf) * Math.sin(b)], [f + (rf - w) * Math.cos(a), h + (rh - w * rh / rf) * Math.sin(a)]];
  });

const GREY = "#9ea4ab";

export const SCHEMES: Record<string, Scheme> = {
  // --- North America
  panAm: { title: "Pan Am", colors: { blue: "#0f5ea8", grey: GREY }, belly: [-0.45, "grey"], stripes: [[0.53, 0.67, "blue"]], fin: "white", art: [{ mat: "blue", polys: [disc(0.5, 0.55, 0.26, 0.26)] }, { mat: "white", polys: [rect(0.2, 0.5, 0.8, 0.53), rect(0.2, 0.6, 0.8, 0.63)] }], cowl: "white", titles: { text: "PAN AM", mat: "blue" } },
  twa: { title: "TWA", colors: { red: "#c8102e", grey: GREY }, belly: [-0.45, "grey"], stripes: [[0.51, 0.56, "red"], [0.66, 0.7, "red"]], fin: "white", art: [{ mat: "red", polys: [slant(0.35, 0.5, 0.2), slant(0.6, 0.75, 0.2)] }], titles: { text: "TWA", mat: "red" } },
  american: { title: "American", colors: { silver: "#c3c8ce", red: "#c8102e", blue: "#0b3b8c" }, body: "silver", stripes: [[0.47, 0.5, "red"], [0.5, 0.52, "white"], [0.52, 0.55, "blue"]], fin: "silver", art: [{ mat: "red", polys: [rect(0.25, 0.45, 0.45, 0.7)] }, { mat: "blue", polys: [rect(0.5, 0.45, 0.7, 0.7)] }], cowl: "silver", winglet: "silver", titles: { text: "AMERICAN", mat: "red" } },
  united: { title: "United", colors: { blue: "#0033a0", sky: "#1f6fc5", grey: "#8e959c" }, belly: [-0.3, "grey"], fin: "blue", art: [{ mat: "sky", polys: [disc(0.5, 0.55, 0.28, 0.28)] }], cowl: "blue", winglet: "blue", titles: { text: "UNITED", mat: "blue" } },
  delta: { title: "Delta", colors: { navy: "#0b1f45", red: "#c01933" }, belly: [-0.25, "navy"], fin: "navy", art: [{ mat: "red", polys: [[[0.15, 0.2], [0.85, 0.2], [0.6, 0.85]]] }], cowl: "navy", winglet: "navy", titles: { text: "DELTA", mat: "navy" } },
  eastern: { title: "Eastern", colors: { blue: "#0b3d91", sky: "#2c8ad6", silver: "#c3c8ce" }, belly: [-0.35, "silver"], stripes: [[0.47, 0.53, "blue"], [0.53, 0.57, "sky"]], fin: "white", art: [{ mat: "blue", polys: [slant(0.25, 0.45, 0.3)] }, { mat: "sky", polys: [slant(0.48, 0.6, 0.3)] }], titles: { text: "EASTERN", mat: "blue" } },
  southwest: { title: "Southwest", colors: { blue: "#304cb2", red: "#c8102e", yellow: "#ffbf27", silver: "#c3c8ce" }, top: [-0.1, "blue"], bands: [[-0.3, -0.1, "yellow"], [-0.45, -0.3, "red"]], belly: [-0.45, "silver"], fin: [[0, "blue"], [0.4, "red"], [0.55, "yellow"], [0.7, "blue"]], cowl: "blue", winglet: "blue" },
  alaska: { title: "Alaska", colors: { navy: "#01426a", teal: "#48a9c5", green: "#a5d16b" }, fin: "navy", art: [{ mat: "teal", polys: [rect(0.1, 0.1, 0.9, 0.2)] }, { mat: "white", polys: [disc(0.5, 0.55, 0.25, 0.25)] }], cowl: "navy", winglet: "navy", titles: { text: "ALASKA", mat: "navy" } },
  fedex: { title: "FedEx", colors: { purple: "#4d148c", orange: "#ff6600" }, top: [0.35, "purple"], fin: "purple", art: [{ mat: "orange", polys: [rect(0.25, 0.4, 0.75, 0.55)] }], cowl: "white", winglet: "purple", titles: { text: "FEDEX", mat: "white" } },
  ups: { title: "UPS", colors: { brown: "#4b2e1f", gold: "#f5b400" }, belly: [-0.2, "brown"], fin: "brown", art: [{ mat: "gold", polys: [[[0.25, 0.35], [0.75, 0.35], [0.75, 0.8], [0.5, 0.88], [0.25, 0.8]]] }], cowl: "brown", winglet: "brown", titles: { text: "UPS", mat: "brown" } },
  airCanada: { title: "Air Canada", colors: { black: "#181818", red: "#d22630", grey: "#a7acb1" }, belly: [-0.5, "grey"], fin: "black", art: [{ mat: "red", polys: [disc(0.5, 0.5, 0.3, 0.3)] }, { mat: "white", polys: [[[0.5, 0.3], [0.62, 0.5], [0.55, 0.5], [0.58, 0.7], [0.5, 0.62], [0.42, 0.7], [0.45, 0.5], [0.38, 0.5]]] }], cowl: "black", winglet: "black", titles: { text: "AIR CANADA", mat: "black" } },
  westjet: { title: "WestJet", colors: { teal: "#00a1af", navy: "#1b365d" }, belly: [-0.4, "navy"], fin: "teal", art: [{ mat: "navy", polys: [slant(0.0, 0.3, 0.2)] }], cowl: "teal", winglet: "teal", titles: { text: "WESTJET", mat: "navy" } },
  // --- Latin America
  aeromexico: { title: "Aeromexico", colors: { navy: "#0b2343", silver: "#a7acb1" }, belly: [-0.3, "navy"], fin: "navy", art: [{ mat: "silver", polys: [disc(0.5, 0.55, 0.25, 0.3)] }], cowl: "navy", winglet: "navy", titles: { text: "AEROMEXICO", mat: "navy" } },
  latam: { title: "LATAM", colors: { indigo: "#1b0088", coral: "#ed1650" }, belly: [-0.35, "indigo"], fin: "indigo", art: [{ mat: "coral", polys: [rect(0.1, 0.25, 0.9, 0.35)] }], cowl: "indigo", winglet: "coral", titles: { text: "LATAM", mat: "indigo" } },
  avianca: { title: "Avianca", colors: { red: "#e1251b" }, fin: "red", art: [{ mat: "white", polys: [rect(0.2, 0.45, 0.8, 0.55)] }], cowl: "red", winglet: "red", titles: { text: "AVIANCA", mat: "red" } },
  azul: { title: "Azul", colors: { blue: "#0a3d91", cyan: "#00aeef" }, belly: [-0.4, "blue"], fin: "blue", art: [{ mat: "cyan", polys: [slant(0.2, 0.35, 0.3), slant(0.5, 0.65, 0.3)] }], cowl: "blue", winglet: "cyan", titles: { text: "AZUL", mat: "blue" } },
  gol: { title: "GOL", colors: { orange: "#ff6600", grey: "#6e7378" }, belly: [-0.45, "orange"], fin: "orange", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.2, 0.2)] }], cowl: "grey", winglet: "orange", titles: { text: "GOL", mat: "orange" } },
  aerolineas: { title: "Aerolineas", colors: { sky: "#6cace4", navy: "#00205b" }, belly: [-0.35, "sky"], fin: "sky", art: [{ mat: "white", polys: [slant(0.3, 0.45, 0.2)] }], cowl: "sky", winglet: "sky", titles: { text: "AEROLINEAS", mat: "navy" } },
  cubana: { title: "Cubana", colors: { blue: "#002a8f", red: "#cf142b" }, stripes: [[0.5, 0.64, "blue"]], fin: "white", art: [{ mat: "blue", polys: [rect(0.2, 0.2, 0.8, 0.35), rect(0.2, 0.5, 0.8, 0.65)] }, { mat: "red", polys: [[[0.15, 0.15], [0.55, 0.45], [0.15, 0.75]]] }], titles: { text: "CUBANA", mat: "blue" } },
  // --- Europe, west
  lufthansa: { title: "Lufthansa", colors: { blue: "#0a1d3d", yellow: "#f9ba00", grey: "#b5b9bd" }, belly: [-0.35, "grey"], stripes: [[0.52, 0.66, "blue"]], fin: "blue", art: [{ mat: "yellow", polys: [disc(0.5, 0.55, 0.28, 0.28)] }, { mat: "blue", polys: [[[0.3, 0.5], [0.6, 0.62], [0.68, 0.55], [0.4, 0.45]]] }], cowl: "blue", winglet: "blue", titles: { text: "LUFTHANSA", mat: "blue" } },
  lufthansa2018: { title: "Lufthansa (2018)", colors: { blue: "#05164d" }, belly: [-0.55, "blue"], tail: { from: 0.86, mat: "blue", slope: 0.5 }, fin: "blue", art: [{ mat: "white", polys: ring(0.5, 0.55, 0.3, 0.3, 0.05) }, { mat: "white", polys: [[[0.3, 0.58], [0.62, 0.45], [0.66, 0.5], [0.36, 0.64]]] }], cowl: "blue", winglet: "blue", titles: { text: "LUFTHANSA", mat: "blue" } },
  condor: { title: "Condor", colors: { yellow: "#fdb913", grey: GREY }, belly: [-0.45, "grey"], fin: "yellow", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.22, 0.22)] }], cowl: "yellow", winglet: "yellow", titles: { text: "CONDOR", mat: "yellow" } },
  airFrance: { title: "Air France", colors: { navy: "#002157", red: "#e2001a", grey: GREY }, belly: [-0.5, "grey"], fin: "white", art: [{ mat: "navy", polys: [slant(0.1, 0.32, 0.25)] }, { mat: "red", polys: [slant(0.4, 0.52, 0.25)] }], cowl: "white", winglet: "navy", titles: { text: "AIR FRANCE", mat: "navy" } },
  britishAirways: { title: "British Airways", colors: { navy: "#0d2c6c", red: "#c8102e" }, belly: [-0.3, "navy"], fin: "navy", art: [{ mat: "white", polys: [slant(0.4, 0.58, 0.0), [[0.4, 0.05], [0.6, 0.05], [0.6, 0.98], [0.4, 0.98]]] }, { mat: "red", polys: [slant(0.45, 0.53, 0.0), [[0.45, 0.05], [0.55, 0.05], [0.55, 0.98], [0.45, 0.98]]] }], cowl: "navy", winglet: "navy", titles: { text: "BRITISH AIRWAYS", mat: "navy" } },
  boac: { title: "BOAC", colors: { navy: "#0d2c6c", gold: "#c7a02c" }, top: [0.25, "white"], belly: [-0.2, "alloy"], bands: [[0.05, 0.25, "navy"]], fin: "navy", art: [{ mat: "gold", polys: [disc(0.5, 0.55, 0.2, 0.2)] }], cowl: "alloy", titles: { text: "BOAC", mat: "navy" } },
  bea: { title: "BEA", colors: { red: "#c8102e", black: "#1d1d1f" }, belly: [-0.3, "black"], fin: "red", art: [{ mat: "white", polys: [rect(0.1, 0.4, 0.9, 0.6)] }], cowl: "white", titles: { text: "BEA", mat: "red" } },
  klm: { title: "KLM", colors: { blue: "#00a1de", dark: "#003082" }, top: [-0.1, "blue"], bands: [[-0.3, -0.1, "dark"]], fin: "blue", art: [{ mat: "white", polys: [rect(0.3, 0.5, 0.7, 0.58), [[0.38, 0.58], [0.46, 0.58], [0.42, 0.7]], [[0.46, 0.58], [0.54, 0.58], [0.5, 0.74]], [[0.54, 0.58], [0.62, 0.58], [0.58, 0.7]]] }], cowl: "blue", winglet: "blue", titles: { text: "KLM", mat: "white" } },
  sabena: { title: "Sabena", colors: { blue: "#0a3d91", sky: "#7fb2e5" }, stripes: [[0.52, 0.66, "blue"]], fin: "white", art: [{ mat: "blue", polys: [disc(0.5, 0.5, 0.28, 0.28)] }, { mat: "white", polys: [disc(0.5, 0.5, 0.18, 0.18)] }], titles: { text: "SABENA", mat: "blue" } },
  swissair: { title: "Swissair", colors: { red: "#d71920" }, belly: [-0.5, "alloy"], stripes: [[0.47, 0.53, "red"]], fin: "red", art: [{ mat: "white", polys: [rect(0.42, 0.25, 0.58, 0.8), rect(0.25, 0.45, 0.75, 0.6)] }], cowl: "alloy", winglet: "red", titles: { text: "SWISSAIR", mat: "red" } },
  swiss: { title: "Swiss", colors: { red: "#e2001a" }, fin: "red", art: [{ mat: "white", polys: [rect(0.42, 0.25, 0.58, 0.8), rect(0.25, 0.45, 0.75, 0.6)] }], cowl: "white", winglet: "red", titles: { text: "SWISS", mat: "red" } },
  austrian: { title: "Austrian", colors: { red: "#d81e05" }, belly: [-0.45, "red"], fin: [[0, "red"], [0.4, "white"], [0.6, "red"]], cowl: "red", winglet: "red", titles: { text: "AUSTRIAN", mat: "red" } },
  sas: { title: "SAS", colors: { navy: "#000a6e", red: "#e3001b", gold: "#b59b5c" }, belly: [-0.3, "gold"], fin: "navy", art: [{ mat: "white", polys: [slant(0.3, 0.45, 0.2)] }], cowl: "navy", winglet: "navy", titles: { text: "SAS", mat: "navy" } },
  finnair: { title: "Finnair", colors: { blue: "#0b1560" }, fin: "white", art: [{ mat: "blue", polys: [rect(0.05, 0.1, 0.95, 0.3), rect(0.42, 0.3, 0.58, 0.95)] }], cowl: "white", winglet: "blue", titles: { text: "FINNAIR", mat: "blue" } },
  iberia: { title: "Iberia", colors: { red: "#d7192d", yellow: "#fcb813" }, fin: [[0, "red"], [0.45, "yellow"], [0.75, "red"]], cowl: "white", winglet: "red", titles: { text: "IBERIA", mat: "red" } },
  alitalia: { title: "Alitalia", colors: { green: "#006643", red: "#d2232a" }, fin: "green", art: [{ mat: "red", polys: [[[0.55, 0.05], [0.98, 0.05], [0.98, 0.98], [0.75, 0.98]]] }, { mat: "white", polys: [[[0.4, 0.2], [0.6, 0.85], [0.5, 0.85], [0.3, 0.2]]] }], cowl: "white", winglet: "green", titles: { text: "ALITALIA", mat: "green" } },
  tap: { title: "TAP", colors: { red: "#e2001a", green: "#00843d" }, fin: "white", art: [{ mat: "red", polys: [slant(0.15, 0.4, 0.3)] }, { mat: "green", polys: [slant(0.5, 0.62, 0.3)] }], titles: { text: "TAP", mat: "green" } },
  aerLingus: { title: "Aer Lingus", colors: { green: "#006272", teal: "#46c5c4" }, belly: [-0.45, "green"], fin: "green", art: [{ mat: "white", polys: [[[0.5, 0.35], [0.65, 0.55], [0.5, 0.75], [0.35, 0.55]]] }], cowl: "green", winglet: "teal", titles: { text: "AER LINGUS", mat: "green" } },
  olympic: { title: "Olympic", colors: { blue: "#005eb8", red: "#d50032", yellow: "#ffcd00" }, stripes: [[0.47, 0.52, "blue"]], fin: "white", art: [{ mat: "blue", polys: ring(0.32, 0.5, 0.12, 0.12, 0.03, 8) }, { mat: "yellow", polys: ring(0.5, 0.5, 0.12, 0.12, 0.03, 8) }, { mat: "red", polys: ring(0.68, 0.5, 0.12, 0.12, 0.03, 8) }], titles: { text: "OLYMPIC", mat: "blue" } },
  ryanair: { title: "Ryanair", colors: { blue: "#073590", yellow: "#f1c933" }, belly: [-0.3, "blue"], fin: "blue", art: [{ mat: "yellow", polys: [[[0.3, 0.35], [0.45, 0.3], [0.65, 0.8], [0.55, 0.84]]] }], cowl: "blue", winglet: "blue", titles: { text: "RYANAIR", mat: "blue" } },
  easyJet: { title: "easyJet", colors: { orange: "#ff6600" }, belly: [-0.35, "orange"], fin: "orange", cowl: "orange", winglet: "orange", titles: { text: "EASYJET", mat: "orange" } },
  wizz: { title: "Wizz Air", colors: { purple: "#c6007e", navy: "#2f2a6b" }, belly: [-0.35, "navy"], fin: "navy", art: [{ mat: "purple", polys: [slant(0.15, 0.45, 0.3)] }], cowl: "purple", winglet: "purple", titles: { text: "WIZZ", mat: "navy" } },
  icelandair: { title: "Icelandair", colors: { blue: "#003a7d", yellow: "#f6b300" }, belly: [-0.5, "blue"], fin: "blue", art: [{ mat: "yellow", polys: [rect(0.1, 0.15, 0.9, 0.22)] }], cowl: "blue", winglet: "yellow", titles: { text: "ICELANDAIR", mat: "blue" } },
  airbus: { title: "Airbus", colors: { blue: "#00205b" }, tail: { from: 0.8, mat: "blue", slope: 0.8 }, fin: "blue", cowl: "white", winglet: "blue", titles: { text: "AIRBUS", mat: "blue" } },
  // --- Europe, east
  aeroflot: { title: "Aeroflot", colors: { blue: "#1f4e9c", grey: GREY, red: "#c8102e" }, belly: [-0.45, "grey"], stripes: [[0.53, 0.66, "blue"], [0.49, 0.51, "blue"]], fin: "white", art: [{ mat: "red", polys: [rect(0.3, 0.45, 0.85, 0.75)] }], cowl: "alloy", wing: "alloy", titles: { text: "AEROFLOT", mat: "blue" } },
  aeroflotNew: { title: "Aeroflot (2003)", colors: { navy: "#0b2a5c", red: "#c8102e", silver: "#c3c8ce" }, belly: [-0.5, "silver"], fin: "navy", art: [{ mat: "red", polys: [rect(0.05, 0.05, 0.95, 0.22), rect(0.05, 0.25, 0.95, 0.3)] }], cowl: "navy", winglet: "navy", titles: { text: "AEROFLOT", mat: "navy" } },
  csa: { title: "CSA", colors: { red: "#d7141a", blue: "#11457e" }, stripes: [[0.53, 0.66, "red"], [0.49, 0.52, "blue"]], fin: "white", art: [{ mat: "red", polys: [rect(0.25, 0.35, 0.75, 0.6)] }, { mat: "blue", polys: [rect(0.25, 0.62, 0.75, 0.7)] }], cowl: "white", titles: { text: "CSA", mat: "red" } },
  interflug: { title: "Interflug", colors: { red: "#d71920", grey: GREY }, belly: [-0.45, "grey"], stripes: [[0.53, 0.66, "red"]], fin: "white", art: [{ mat: "red", polys: [slant(0.3, 0.5, 0.2)] }], cowl: "alloy", titles: { text: "INTERFLUG", mat: "red" } },
  lot: { title: "LOT", colors: { navy: "#11397e" }, belly: [-0.5, "alloy"], stripes: [[0.5, 0.56, "navy"]], fin: "navy", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.22, 0.22)] }], cowl: "navy", winglet: "navy", titles: { text: "LOT", mat: "navy" } },
  malev: { title: "Malev", colors: { red: "#ce1126", green: "#008751", navy: "#1c2e5a" }, stripes: [[0.53, 0.66, "navy"]], fin: [[0, "red"], [0.33, "white"], [0.66, "green"]], titles: { text: "MALEV", mat: "navy" } },
  tarom: { title: "Tarom", colors: { navy: "#002b7f", red: "#ce1126" }, stripes: [[0.53, 0.66, "navy"]], fin: "navy", art: [{ mat: "white", polys: [[[0.3, 0.3], [0.7, 0.45], [0.3, 0.6]]] }], titles: { text: "TAROM", mat: "navy" } },
  balkan: { title: "Balkan", colors: { green: "#00966e", red: "#d62612" }, stripes: [[0.53, 0.66, "green"]], fin: "white", art: [{ mat: "green", polys: [rect(0.2, 0.3, 0.8, 0.45)] }, { mat: "red", polys: [rect(0.2, 0.48, 0.8, 0.6)] }], titles: { text: "BALKAN", mat: "green" } },
  jat: { title: "JAT", colors: { blue: "#0c4076", red: "#c6363c" }, stripes: [[0.53, 0.66, "blue"]], fin: "white", art: [{ mat: "red", polys: [disc(0.5, 0.5, 0.22, 0.22)] }, { mat: "blue", polys: [rect(0.2, 0.45, 0.8, 0.55)] }], titles: { text: "JAT", mat: "blue" } },
  s7: { title: "S7 Airlines", colors: { lime: "#b6d433", green: "#53a832" }, body: "lime", belly: [-0.6, "green"], fin: "green", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.18, 0.18)] }], cowl: "green", winglet: "green", titles: { text: "S7", mat: "green" } },
  utair: { title: "UTair", colors: { blue: "#0055a4", sky: "#5a9bd5" }, belly: [-0.4, "blue"], fin: "blue", art: [{ mat: "sky", polys: [slant(0.4, 0.55, 0.2)] }], cowl: "blue", winglet: "blue", titles: { text: "UTAIR", mat: "blue" } },
  rossiya: { title: "Rossiya", colors: { red: "#d52b1e", blue: "#0039a6" }, fin: [[0, "red"], [0.33, "blue"], [0.66, "white"]], cowl: "white", winglet: "red", titles: { text: "ROSSIYA", mat: "blue" } },
  aerosvit: { title: "Aerosvit", colors: { blue: "#0057b7", yellow: "#ffd700" }, fin: "blue", art: [{ mat: "yellow", polys: [rect(0.1, 0.1, 0.9, 0.35)] }], cowl: "blue", winglet: "blue", titles: { text: "AEROSVIT", mat: "blue" } },
  ukraine: { title: "UIA", colors: { navy: "#0b2a5c", yellow: "#f7c600" }, belly: [-0.45, "navy"], fin: "navy", art: [{ mat: "yellow", polys: [rect(0.1, 0.6, 0.9, 0.8)] }], cowl: "navy", winglet: "yellow", titles: { text: "UKRAINE", mat: "navy" } },
  antonov: { title: "Antonov Airlines", colors: { blue: "#0d4ea2", yellow: "#ffd700" }, stripes: [[0.4, 0.55, "blue"], [0.55, 0.6, "yellow"]], fin: [[0, "white"], [0.55, "blue"], [0.8, "yellow"]], cowl: "white", titles: { text: "ANTONOV", mat: "blue" } },
  volgaDnepr: { title: "Volga-Dnepr", colors: { blue: "#1a4da1", sky: "#7cb8e8" }, stripes: [[0.42, 0.56, "blue"], [0.56, 0.6, "sky"]], fin: "blue", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.2, 0.2)] }], cowl: "white", titles: { text: "VOLGA-DNEPR", mat: "blue" } },
  // --- Middle East and Africa
  turkish: { title: "Turkish Airlines", colors: { red: "#c8102e", grey: GREY }, belly: [-0.75, "grey"], fin: "red", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.26, 0.26)] }, { mat: "red", polys: [[[0.38, 0.6], [0.6, 0.42], [0.66, 0.48], [0.45, 0.66]]] }], cowl: "white", winglet: "red", titles: { text: "TURKISH AIRLINES", mat: "red" } },
  emirates: { title: "Emirates", colors: { red: "#d71921", green: "#00843d", black: "#1d1d1b", gold: "#b09766" }, fin: "white", art: [{ mat: "red", polys: [[[0.05, 0.05], [0.95, 0.05], [0.95, 0.3], [0.05, 0.3]]] }, { mat: "green", polys: [rect(0.3, 0.35, 0.95, 0.55)] }, { mat: "black", polys: [rect(0.3, 0.75, 0.95, 0.95)] }], cowl: "white", winglet: "red", titles: { text: "EMIRATES", mat: "gold" } },
  qatar: { title: "Qatar Airways", colors: { maroon: "#5c0632", grey: "#a7a9ac" }, belly: [-0.6, "grey"], fin: "maroon", art: [{ mat: "white", polys: [[[0.3, 0.3], [0.7, 0.5], [0.4, 0.75]]] }], cowl: "maroon", winglet: "maroon", titles: { text: "QATAR", mat: "maroon" } },
  etihad: { title: "Etihad", colors: { gold: "#bd8b13", grey: "#a8a39a" }, fin: "gold", art: [{ mat: "grey", polys: [slant(0.2, 0.4, 0.2), slant(0.55, 0.7, 0.2)] }], cowl: "white", winglet: "gold", titles: { text: "ETIHAD", mat: "gold" } },
  egyptair: { title: "EgyptAir", colors: { navy: "#0b2f6b", gold: "#d5a80f" }, belly: [-0.5, "navy"], fin: "navy", art: [{ mat: "gold", polys: [disc(0.5, 0.55, 0.2, 0.24)] }], cowl: "navy", winglet: "navy", titles: { text: "EGYPTAIR", mat: "navy" } },
  ethiopian: { title: "Ethiopian", colors: { green: "#078930", yellow: "#fcdd09", red: "#da121a" }, fin: [[0, "green"], [0.33, "yellow"], [0.66, "red"]], cowl: "white", winglet: "green", titles: { text: "ETHIOPIAN", mat: "green" } },
  kenya: { title: "Kenya Airways", colors: { red: "#c8102e", black: "#1d1d1b", green: "#006600" }, stripes: [[0.45, 0.5, "red"], [0.5, 0.53, "green"]], fin: "red", art: [{ mat: "black", polys: [[[0.2, 0.2], [0.8, 0.2], [0.5, 0.8]]] }], cowl: "red", winglet: "red", titles: { text: "KENYA AIRWAYS", mat: "red" } },
  saa: { title: "South African", colors: { blue: "#0c2b64", gold: "#f3a800", green: "#007749", red: "#d7282f" }, fin: "blue", art: [{ mat: "red", polys: [[[0.05, 0.6], [0.95, 0.75], [0.95, 0.98], [0.05, 0.98]]] }, { mat: "green", polys: [[[0.05, 0.4], [0.95, 0.55], [0.95, 0.65], [0.05, 0.5]]] }, { mat: "gold", polys: [[[0.05, 0.1], [0.7, 0.45], [0.05, 0.35]]] }], cowl: "blue", winglet: "blue", titles: { text: "SOUTH AFRICAN", mat: "blue" } },
  royalMaroc: { title: "Royal Air Maroc", colors: { red: "#c1272d", green: "#006233" }, fin: "red", art: [{ mat: "green", polys: [[[0.5, 0.3], [0.62, 0.65], [0.32, 0.43], [0.68, 0.43], [0.38, 0.65]]] }], cowl: "white", winglet: "red", titles: { text: "ROYAL AIR MAROC", mat: "red" } },
  elAl: { title: "El Al", colors: { navy: "#002d72", silver: "#c3c8ce" }, stripes: [[0.47, 0.53, "navy"]], fin: "white", art: [{ mat: "navy", polys: [rect(0.1, 0.1, 0.9, 0.2), rect(0.1, 0.8, 0.9, 0.9)] }], titles: { text: "EL AL", mat: "navy" } },
  // --- Asia and Oceania
  qantas: { title: "Qantas", colors: { red: "#e40000", silver: "#c3c8ce" }, tail: { from: 0.82, mat: "red", slope: 0.8 }, fin: "red", art: [{ mat: "white", polys: [[[0.3, 0.3], [0.55, 0.45], [0.75, 0.85], [0.6, 0.8], [0.45, 0.55], [0.35, 0.5]]] }], cowl: "white", winglet: "red", titles: { text: "QANTAS", mat: "red" } },
  singapore: { title: "Singapore", colors: { blue: "#0e2a5c", yellow: "#f5b120" }, bands: [[-0.55, -0.42, "blue"], [-0.42, -0.36, "yellow"]], fin: "blue", art: [{ mat: "yellow", polys: [[[0.3, 0.35], [0.7, 0.55], [0.35, 0.75], [0.5, 0.55]]] }], cowl: "white", winglet: "blue", titles: { text: "SINGAPORE", mat: "blue" } },
  cathay: { title: "Cathay Pacific", colors: { green: "#005d63", grey: "#c3c8ce" }, stripes: [[0.42, 0.47, "green"]], fin: "green", art: [{ mat: "white", polys: [[[0.2, 0.45], [0.8, 0.55], [0.75, 0.6], [0.25, 0.52]]] }], cowl: "green", winglet: "green", titles: { text: "CATHAY PACIFIC", mat: "green" } },
  jal: { title: "Japan Airlines", colors: { red: "#cc0000" }, fin: "white", art: [{ mat: "red", polys: [disc(0.5, 0.55, 0.3, 0.3)] }, { mat: "white", polys: [disc(0.5, 0.55, 0.2, 0.2)] }], cowl: "white", winglet: "red", titles: { text: "JAL", mat: "red" } },
  jalClassic: { title: "JAL (1960)", colors: { red: "#cc0000", navy: "#1e2a5a" }, stripes: [[0.52, 0.66, "navy"]], fin: "white", art: [{ mat: "red", polys: [disc(0.5, 0.55, 0.28, 0.28)] }], titles: { text: "JAPAN AIR LINES", mat: "navy" } },
  ana: { title: "ANA", colors: { blue: "#13448f", sky: "#1ba1e2" }, belly: [-0.45, "blue"], bands: [[-0.45, -0.38, "sky"]], fin: "blue", cowl: "blue", winglet: "blue", titles: { text: "ANA", mat: "blue" } },
  airChina: { title: "Air China", colors: { red: "#d71920", grey: "#9ea4ab" }, belly: [-0.6, "grey"], fin: "white", art: [{ mat: "red", polys: [[[0.35, 0.25], [0.65, 0.4], [0.6, 0.8], [0.4, 0.65]]] }], cowl: "white", winglet: "red", titles: { text: "AIR CHINA", mat: "red" } },
  chinaEastern: { title: "China Eastern", colors: { navy: "#1c3f94", red: "#d71920" }, belly: [-0.5, "navy"], fin: "white", art: [{ mat: "red", polys: [disc(0.5, 0.5, 0.25, 0.25)] }, { mat: "navy", polys: [rect(0.2, 0.47, 0.8, 0.53)] }], cowl: "navy", winglet: "navy", titles: { text: "CHINA EASTERN", mat: "navy" } },
  chinaSouthern: { title: "China Southern", colors: { blue: "#0b66b5", red: "#d71920" }, fin: "blue", art: [{ mat: "red", polys: [[[0.5, 0.25], [0.7, 0.55], [0.5, 0.85], [0.3, 0.55]]] }], cowl: "blue", winglet: "blue", titles: { text: "CHINA SOUTHERN", mat: "blue" } },
  comac: { title: "COMAC", colors: { blue: "#0050a0", green: "#3cb44b" }, fin: "white", art: [{ mat: "blue", polys: [slant(0.1, 0.35, 0.3)] }, { mat: "green", polys: [slant(0.45, 0.55, 0.3)] }], cowl: "white", winglet: "blue", titles: { text: "COMAC", mat: "blue" } },
  airIndia: { title: "Air India", colors: { red: "#d71920", gold: "#ee7f00" }, belly: [-0.5, "red"], fin: "red", art: [{ mat: "gold", polys: [disc(0.5, 0.55, 0.2, 0.2)] }], cowl: "red", winglet: "red", titles: { text: "AIR INDIA", mat: "red" } },
  korean: { title: "Korean Air", colors: { sky: "#9cc5e3", blue: "#0064b0", red: "#c8102e" }, body: "sky", belly: [-0.45, "alloy"], fin: "sky", art: [{ mat: "red", polys: [disc(0.5, 0.55, 0.25, 0.25)] }, { mat: "blue", polys: [[[0.25, 0.55], [0.75, 0.55], [0.7, 0.4], [0.3, 0.4]]] }], cowl: "sky", winglet: "sky", titles: { text: "KOREAN AIR", mat: "blue" } },
  thai: { title: "Thai", colors: { purple: "#5a1e6e", gold: "#c99a2e", pink: "#d5317d" }, fin: "purple", art: [{ mat: "gold", polys: [[[0.3, 0.3], [0.7, 0.5], [0.3, 0.7]]] }, { mat: "pink", polys: [[[0.4, 0.4], [0.6, 0.5], [0.4, 0.6]]] }], cowl: "purple", winglet: "purple", titles: { text: "THAI", mat: "purple" } },
  malaysia: { title: "Malaysia", colors: { blue: "#002b5c", red: "#e3001b" }, stripes: [[0.42, 0.47, "blue"], [0.47, 0.52, "red"]], fin: "white", art: [{ mat: "red", polys: [[[0.2, 0.2], [0.6, 0.4], [0.3, 0.7]]] }, { mat: "blue", polys: [[[0.4, 0.3], [0.8, 0.5], [0.5, 0.85]]] }], titles: { text: "MALAYSIA", mat: "blue" } },
  garuda: { title: "Garuda Indonesia", colors: { teal: "#0b6e79", sky: "#8fc6ce" }, fin: "teal", art: [{ mat: "sky", polys: [slant(0.1, 0.3, 0.3)] }], cowl: "teal", winglet: "teal", titles: { text: "GARUDA", mat: "teal" } },
  vietnam: { title: "Vietnam Airlines", colors: { teal: "#00557a", gold: "#d5a940" }, fin: "teal", art: [{ mat: "gold", polys: [[[0.5, 0.3], [0.65, 0.55], [0.5, 0.8], [0.35, 0.55]]] }], cowl: "teal", winglet: "teal", titles: { text: "VIETNAM", mat: "teal" } },
  airNewZealand: { title: "Air New Zealand", colors: { black: "#171717" }, tail: { from: 0.85, mat: "black", slope: 0.6 }, fin: "black", art: [{ mat: "white", polys: [[[0.45, 0.2], [0.55, 0.2], [0.6, 0.75], [0.5, 0.85], [0.42, 0.75]]] }], cowl: "black", winglet: "black", titles: { text: "AIR NEW ZEALAND", mat: "black" } },
  uzbekistan: { title: "Uzbekistan", colors: { blue: "#0099b5", green: "#1eb53a" }, stripes: [[0.47, 0.53, "blue"]], fin: "white", art: [{ mat: "blue", polys: [rect(0.1, 0.2, 0.9, 0.35)] }, { mat: "green", polys: [rect(0.1, 0.65, 0.9, 0.8)] }], titles: { text: "UZBEKISTAN", mat: "blue" } },
  // --- makers' house colours, utility operators
  boeing: { title: "Boeing", colors: { blue: "#0039a6", sky: "#0f73d6" }, belly: [-0.4, "blue"], bands: [[-0.4, -0.3, "sky"]], fin: "blue", cowl: "white", winglet: "blue", titles: { text: "BOEING", mat: "blue" } },
  embraer: { title: "Embraer", colors: { navy: "#0f2c5c", blue: "#2a74c5" }, belly: [-0.45, "navy"], fin: "navy", art: [{ mat: "blue", polys: [slant(0.2, 0.35, 0.3)] }], cowl: "navy", winglet: "navy", titles: { text: "EMBRAER", mat: "navy" } },
  firefighter: { title: "Fire fighter", colors: { red: "#d7261e", yellow: "#f7c600" }, body: "yellow", top: [-0.15, "red"], fin: "red", cowl: "yellow", wing: "yellow", winglet: "red" },
  coastGuard: { title: "Coast guard", colors: { orange: "#ef5b25", blue: "#00264d" }, stripes: [[0.3, 0.55, "orange"]], fin: "white", art: [{ mat: "orange", polys: [slant(0.2, 0.4, 0.2)] }], cowl: "white" },
  jmsdf: { title: "JMSDF", colors: { grey: "#7d8892", blue: "#2c4f7c" }, body: "grey", belly: [-0.5, "white"], fin: "grey", art: [{ mat: "white", polys: [disc(0.5, 0.55, 0.18, 0.18)] }], cowl: "grey", wing: "grey" },
  cargolux: { title: "Cargolux", colors: { blue: "#2b4b9b", red: "#d6203a", grey: "#9aa0a6" }, belly: [-0.5, "grey"], fin: "blue", art: [{ mat: "red", polys: [rect(0.05, 0.15, 0.95, 0.35)] }], cowl: "white", winglet: "blue", titles: { text: "CARGOLUX", mat: "blue" } },
  bush: { title: "Bush yellow", colors: { yellow: "#f2b705", red: "#b3261e" }, body: "yellow", stripes: [[0.4, 0.5, "red"]], fin: [[0, "yellow"], [0.6, "red"]], cowl: "yellow", wing: "yellow", winglet: "red" },
  bareMetal: { title: "Bare metal", colors: { metal: "#b9bec4", black: "#1d1d1f" }, body: "metal", fin: "metal", cowl: "metal", wing: "metal", nose: { to: 0.02, mat: "black" } },
  vintage: { title: "Vintage", colors: { cream: "#e8dcc0", maroon: "#6d1f2a" }, body: "cream", stripes: [[0.45, 0.55, "maroon"]], fin: [[0, "cream"], [0.5, "maroon"]], cowl: "maroon", wing: "cream", winglet: "maroon" },
  rfds: { title: "RFDS", colors: { navy: "#0b2a5c", red: "#d2232a" }, stripes: [[0.36, 0.42, "red"], [0.42, 0.5, "navy"]], fin: "navy", art: [{ mat: "red", polys: [rect(0.4, 0.3, 0.6, 0.8), rect(0.25, 0.45, 0.75, 0.62)] }], cowl: "white", wing: "white", winglet: "navy" },
  offshore: { title: "Offshore", colors: { green: "#00573f", grey: "#8a9096" }, belly: [-0.4, "grey"], bands: [[-0.4, -0.2, "green"]], fin: "green", cowl: "white", winglet: "green" },
  rescue: { title: "Rescue", colors: { red: "#d42e12", navy: "#0b1f45" }, body: "white", top: [0.2, "red"], belly: [-0.5, "red"], fin: "red", art: [{ mat: "white", polys: [rect(0.1, 0.4, 0.9, 0.55)] }], cowl: "red", winglet: "red", titles: { text: "RESCUE", mat: "navy" } },
  airAmbulance: { title: "Air ambulance", colors: { yellow: "#ffcc00", red: "#d52b1e" }, body: "yellow", bands: [[-0.3, -0.05, "red"]], fin: "yellow", art: [{ mat: "red", polys: [rect(0.4, 0.3, 0.6, 0.8), rect(0.25, 0.45, 0.75, 0.62)] }], cowl: "yellow", winglet: "yellow" },
  police: { title: "Police", colors: { blue: "#0d3b8e", silver: "#c3c8ce" }, body: "silver", top: [0.15, "blue"], bands: [[-0.15, 0.0, "blue"]], fin: "blue", cowl: "blue", winglet: "blue", titles: { text: "POLICE", mat: "blue" } },
  zeppelin: { title: "Zeppelin", colors: { navy: "#173c6d" }, belly: [-0.75, "navy"], fin: "white", art: [{ mat: "navy", polys: [rect(0.1, 0.6, 0.9, 0.75)] }], cowl: "white", titles: { text: "ZEPPELIN NT", mat: "navy" } },
  goodyear: { title: "Goodyear", colors: { blue: "#1e3e8c", yellow: "#fdd20b" }, belly: [-0.6, "blue"], bands: [[-0.6, -0.45, "yellow"]], fin: "blue", cowl: "white", titles: { text: "GOODYEAR", mat: "blue" } },
  plain: { title: "Plain", colors: { grey: GREY }, belly: [-0.5, "grey"], fin: "white", cowl: "white" },
  navyBand: { title: "Navy stripe", colors: { navy: "#1d2b48" }, stripes: [[0.42, 0.5, "navy"]], fin: "navy", cowl: "white", winglet: "navy" },
};

/** The schemes `keys` name, in that order (a design's livery parameter's values). */
export function schemes(...keys: string[]): Record<string, Scheme> {
  const out: Record<string, Scheme> = {};
  for (const k of keys) {
    const s = SCHEMES[k];
    if (!s) throw new Error(`no scheme "${k}"`);
    out[k] = s;
  }
  return out;
}

/** A light aircraft's colour schemes: white with a coloured cheatline and fin band. */
export function colourSchemes(...colours: Array<[string, string, string]>): Record<string, Scheme> {
  const out: Record<string, Scheme> = {};
  for (const [key, title, hex] of colours) {
    out[key] = { title, colors: { trim: hex }, stripes: [[0.36, 0.46, "trim"]], fin: [[0, "white"], [0.55, "trim"]], cowl: "white", wing: "white", winglet: "trim" };
  }
  return out;
}

/** The colours a business jet or light aircraft offers. */
export const COLOURS: Array<[string, string, string]> = [
  ["blue", "Blue", "#1d4f9c"], ["red", "Red", "#c8102e"], ["green", "Green", "#1f7a45"], ["gold", "Gold", "#b8902f"], ["black", "Black", "#202124"],
];
