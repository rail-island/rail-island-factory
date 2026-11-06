// Spanish units on the series kit (shinkansen.ts): the AVE S-100 and S-103
// (on the shared Velaro body), the Talgo S-102 "Pato", S-106 Avril and S-130
// Alvia and the Talgo III coaches (the Talgo base, seriesHelpers.ts), the
// dual-gauge S-120, the Civia, the 446 and 440 EMUs, the 592 DMU and Iryo's
// Frecciarossa 1000 (S-109). See docs/models/spain-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, nose, NO_NOSE, talgo, velaro } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";

/** Renfe's schemes and its operators'. */
export function esLivery(kind: "ave" | "avlo" | "alvia" | "cercanias" | "regional" | "mediaDistancia" | "talgo" | "iryo" | "estrella", number: string): ShinkansenLivery {
  const pal = (p: Record<string, string>) => ({ roofG: c("#b9bdc0", 0.6), skirtG: c("#3a3d40", 0.75), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, c(v)])) });
  switch (kind) {
    case "ave": return { title: "AVE", number, palette: pal({ white: "#f1f1ee", grey: "#6f757a", purple: "#6c2a7a" }), bands: [[0, 1.18, "grey"], [1.18, 1.28, "purple"], [1.28, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "avlo": return { title: "Avlo", number, palette: pal({ white: "#f1f1ee", purple: "#7a2c8e", lime: "#b5d334" }), bands: [[0, 1.18, "purple"], [1.18, 1.28, "lime"], [1.28, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "alvia": return { title: "Alvia", number, palette: pal({ white: "#f1f1ee", grey: "#6f757a", orange: "#e8701e" }), bands: [[0, 1.18, "grey"], [1.18, 1.28, "orange"], [1.28, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "cercanias": return { title: "Cercanias", number, palette: pal({ white: "#f1f1ee", red: "#d81e2c", grey: "#6f757a" }), bands: [[0, 1.25, "grey"], [1.25, 1.45, "red"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "regional": return { title: "Regionales", number, palette: pal({ white: "#f1f1ee", green: "#2f8a5a", grey: "#6f757a" }), bands: [[0, 1.25, "grey"], [1.25, 1.45, "green"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "mediaDistancia": return { title: "Media Distancia", number, palette: pal({ white: "#f1f1ee", grey: "#6f757a", violet: "#7a3e8e" }), bands: [[0, 1.25, "grey"], [1.25, 1.4, "violet"], [1.4, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    // the Talgo III's, read from photo-bf-granada-talgo-iii-endwagen-tg1-26.jpg: the stainless lower body and roof, the red window band between dark lines
    case "talgo": return { title: "Talgo", number, palette: pal({ silver: "#c3c7ca", red: "#c8282e", line: "#2e3033", flute: "#9ea3a7" }), bands: [[0, 1.45, "silver"], [1.45, 1.5, "line"], [1.5, 2.5, "red"], [2.5, 2.55, "line"], [2.55, 9, "silver"]], roof: "roofG", skirt: "skirtG" };
    case "iryo": return { title: "Iryo", number, palette: pal({ red: "#c8102e", white: "#f1f1ee", dark: "#3a1d24" }), bands: [[0, 1.3, "dark"], [1.3, 9, "red"]], roof: "roofG", skirt: "skirtG" };
    case "estrella": return { title: "Estrella", number, palette: pal({ blue: "#1d3f80", white: "#f1f1ee" }), bands: [[0, 1.45, "blue"], [1.45, 1.55, "white"], [1.55, 9, "blue"]], roof: "roofG", skirt: "skirtG" };
  }
}

/** A long, pointed high-speed nose. */
const HSR_NOSE = nose(5.5, 0.06, 2.4, [[0, 1.2], [0.6, 1.6], [2.4, 2.3], [4.0, 3.0], [5.4, 3.6], [6.4, 3.9]], [[0, 1.15], [0.6, 1.5], [2.4, 2.1], [4.0, 2.65], [5.4, 2.95], [6.4, 3.1]], [[0, 1.1], [1.5, 1.3], [3.0, 1.4]], [[0, 1.05], [1.5, 1.05]], [[0, 1.0], [0.6, 0.6], [2.0, 0.8]]);

export const S100: ShinkansenSeries = {
  endLength: 22.15, midLength: 18.7, W: 1.45, Y: 1.4, S: 3.1, C: 3.9, lean: 0.95, B: 0.8, A: 1.05,
  // the TGV Atlantique's nose
  nose: HSR_NOSE, windscreen: [3.6, 5.4, 0.07, 1.05], lamps: [1.3, 1.45],
  windows: [[1.95, 2.7]], windowW: 1.1, pitch: 1.4, door: [1.3, 3.0, 1.95, 2.6], doorW: 0.8,
  bogieCentres: 11.2, wheelR: 0.46, wheelbase: 3.0,
  liveries: { ave: esLivery("ave", "100 001"), avlo: esLivery("avlo", "100 025") },
  weight: { end: 68, middle: 44 }, power: 1100, maxspeed: 300,
};

export const S103: ShinkansenSeries = velaro({ liveries: { ave: esLivery("ave", "103 001") }, weight: { end: 55, middle: 50 }, power: 1100, maxspeed: 350 });

export const S102: ShinkansenSeries = talgo({
  endLength: 20.0, C: 3.95,
  // the "Pato": the duck-bill nose of the power car
  nose: nose(6.5, 0.3, 3.0, [[0, 1.15], [0.6, 1.4], [3.0, 1.85], [5.5, 2.6], [6.6, 3.4], [7.6, 3.95]], [[0, 1.12], [0.6, 1.33], [3.0, 1.7], [5.5, 2.35], [6.6, 2.85], [7.6, 2.95]], [[0, 1.08], [1.5, 1.25]], [[0, 1.05], [1.5, 0.95]], [[0, 1.0], [0.6, 0.6], [2.0, 0.75]]),
  windscreen: [5.2, 6.8, 0.07, 1.0], lamps: [1.6, 1.62],
  liveries: { ave: esLivery("ave", "102 001"), avlo: esLivery("avlo", "112 015") },
  weight: { end: 70, middle: 18 }, power: 2000, maxspeed: 330,
});

export const S106: ShinkansenSeries = talgo({
  endLength: 20.0, C: 3.6,
  // the Avril's long, low nose and the low wide body
  nose: nose(6.0, 0.1, 2.5, [[0, 1.2], [0.6, 1.55], [2.6, 2.2], [4.6, 2.9], [6.4, 3.6]], [[0, 1.15], [0.6, 1.45], [2.6, 2.05], [4.6, 2.65], [6.4, 2.95]], [[0, 1.1], [1.5, 1.25]], [[0, 1.05], [1.5, 0.95]], [[0, 1.0], [0.6, 0.6], [2.0, 0.75]]),
  windscreen: [4.0, 5.9, 0.07, 1.0], lamps: [1.4, 1.4],
  liveries: { avlo: esLivery("avlo", "106 001"), ave: esLivery("ave", "106 010") },
  weight: { end: 40, middle: 20 }, power: 800, maxspeed: 330,
});

export const S130: ShinkansenSeries = talgo({
  endLength: 20.0, C: 3.95,
  nose: nose(6.0, 0.3, 3.0, [[0, 1.15], [0.6, 1.4], [3.0, 1.9], [5.2, 2.7], [6.2, 3.5], [7.0, 3.95]], [[0, 1.12], [0.6, 1.33], [3.0, 1.75], [5.2, 2.4], [6.2, 2.85], [7.0, 2.95]], [[0, 1.08], [1.5, 1.25]], [[0, 1.05], [1.5, 0.95]], [[0, 1.0], [0.6, 0.6], [2.0, 0.75]]),
  windscreen: [4.8, 6.3, 0.07, 1.0], lamps: [1.6, 1.62],
  liveries: { alvia: esLivery("alvia", "130 001") },
  weight: { end: 72, middle: 18 }, power: 2400, maxspeed: 250,
});

/**
 * The Talgo III's tail: a bowed, upright end with rounded corners and no windscreen, the red
 * band round it, the door off to one side with its porthole, the marker lamps high and low,
 * buffers. Read from photo-s00-199-bf-bilbao-abando-talgo-iii-endwagen.jpg.
 */
const TALGO_TAIL: SeriesCabFace = {
  // dJoin clears the face's top corners (profile + bow + corner radius), so none of it is pressed into the join plane
  dJoin: 0.75, dSide: 0.6, first: 2.2, roofFrom: 2.95,
  profile: [[0.75, 0.08], [0.9, 0.02], [1.1, 0], [2.6, 0], [2.8, 0.06], [3.0, 0.18], [3.2, 0.4], [3.3, 0.75]],
  corner: [[0.75, 0.45], [2.8, 0.45], [3.2, 0.2], [3.3, 0.02]], bulge: 0.1, cols: [6, 3, 1, 1],
  rows: [0.75, 0.9, 1.1, 1.45, 1.5, 2.0, 2.5, 2.55, 2.8, 3.0, 3.2, 3.3],
  masks: [{ lat: [-0.88, -0.3], y: [1.28, 2.82], r: 0.08, mat: "red" }],
  panes: [],
  // the door's outline
  decals: [
    { mat: "line", pts: [[-0.9, 1.26], [-0.87, 1.26], [-0.87, 2.84], [-0.9, 2.84]] },
    { mat: "line", pts: [[-0.31, 1.26], [-0.28, 1.26], [-0.28, 2.84], [-0.31, 2.84]] },
    { mat: "line", pts: [[-0.865, 2.81], [-0.315, 2.81], [-0.315, 2.84], [-0.865, 2.84]] },
  ],
  // the porthole, then the marker lamps: two high, a white and a red one low
  lamps: [[-0.59, 2.42, 0.17, "cabGlass"], [-1.12, 2.68, 0.06, "lampRed"], [0.3, 2.68, 0.06, "lampRed"], [-1.0, 1.32, 0.08, "lampHead"], [0.05, 1.32, 0.07, "lampRed"]],
  number: { lat: 0.55, y: 2.1, h: 0.13, mat: "white" },
};

export const TALGO_III: ShinkansenSeries = {
  ...talgo({
    endLength: 13.14, C: 3.3, traction: "none", cars: [4, 8],
    nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
    liveries: { talgo: esLivery("talgo", "1B19") },
    weight: { end: 14, middle: 12 }, power: 0, maxspeed: 140,
  }),
  // the buffers' beam 2 cm clear of the low body's bottom (0.75 m)
  cabFace: TALGO_TAIL, endCoupler: "buffers", couplerY: 1.02,
  // the stainless body's fluting below and above the red band, the roof's ribs (photo-bf-granada-...jpg)
  fluting: [{ y0: 0.96, y1: 1.42, pitch: 0.075, mat: "flute" }, { y0: 2.6, y1: 2.92, pitch: 0.075, mat: "flute" }],
  roofRibs: { pitch: 0.13, zMax: 1.3, mat: "flute" },
};

export const S120: ShinkansenSeries = {
  endLength: 26.0, midLength: 25.0, W: 1.47, Y: 1.35, S: 3.1, C: 4.0, lean: 0.95, B: 0.8, A: 1.0,
  nose: nose(3.4, 0.2, 2.4, [[0, 1.5], [0.5, 2.1], [1.8, 2.9], [3.0, 3.6], [3.8, 4.0]], [[0, 1.45], [0.5, 1.95], [1.8, 2.6], [3.0, 2.95], [3.8, 3.1]], [[0, 1.35], [1.0, 1.35]], [[0, 1.15], [0.8, 1.0]], [[0, 1.05], [0.4, 0.8]]),
  windscreen: [1.6, 3.2, 0.07, 1.1], lamps: [0.4, 1.5],
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.65, door: [1.2, 3.0, 1.9, 2.6], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.43, wheelbase: 2.5, cars: [4],
  liveries: { alvia: esLivery("alvia", "120 001"), mediaDistancia: esLivery("mediaDistancia", "121 001") },
  weight: { end: 58, middle: 54 }, power: 1100, maxspeed: 250,
};

export const CIVIA: ShinkansenSeries = {
  endLength: 20.6, midLength: 19.0, W: 1.47, Y: 1.25, S: 3.2, C: 4.1, lean: 0.95, B: 0.6, A: 0.8,
  nose: nose(2.2, 0.35, 2.3, [[0, 2.2], [0.4, 2.9], [1.5, 3.7], [2.4, 4.1]], [[0, 2.1], [0.4, 2.75], [1.5, 3.1], [2.4, 3.2]], [[0, 1.25], [0.8, 1.25]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
  windscreen: [0.45, 2.0, 0.07, 1.2], lamps: [0.15, 1.35],
  windows: [[1.45, 2.65]], windowW: 1.5, pitch: 1.75, door: [0.95, 3.0, 1.5, 2.6], doorW: 1.3, doorCount: 2,
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.5, cars: [3, 4, 5],
  liveries: { cercanias: esLivery("cercanias", "463 001") },
  weight: { end: 44, middle: 36 }, power: 550, maxspeed: 120,
};

const flatEmu = (o: { number: string; livery: "cercanias" | "regional" | "mediaDistancia"; second?: "cercanias" | "regional" | "mediaDistancia"; doorCount?: number; doorW: number; power: number; maxspeed: number; diesel?: boolean; endLength?: number }): ShinkansenSeries => ({
  endLength: o.endLength ?? 26.5, midLength: 26.0, W: 1.47, Y: 1.35, S: 3.2, C: 4.0, lean: 0.97, B: 1.0, A: 1.15,
  nose: nose(0.1, 1, 2, [[0, 4.0]], [[0, 3.2]], [[0, 1.35]], [[0, 1.15]], [[0, 1.0]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.47, 2.0, 2.85, "cabMask", 1.55),
  windows: [[1.95, 2.85]], windowW: 1.3, pitch: 1.55, door: [1.2, 3.05, 1.95, 2.65], doorW: o.doorW, ...(o.doorCount ? { doorCount: o.doorCount } : {}),
  bogieCentres: 18.0, wheelR: 0.48, wheelbase: 2.5, cars: [3], ...(o.diesel ? { traction: "diesel" as const } : {}),
  liveries: { [o.livery]: esLivery(o.livery, o.number), ...(o.second ? { [o.second]: esLivery(o.second, o.number.replace(/1$/, "7")) } : {}) },
  weight: { end: 56, middle: 48 }, power: o.power, maxspeed: o.maxspeed,
});

export const R446 = flatEmu({ number: "446 001", livery: "cercanias", doorCount: 3, doorW: 1.3, power: 290, maxspeed: 100, endLength: 23.4 });
export const R440 = flatEmu({ number: "440 001", livery: "regional", second: "cercanias", doorW: 1.0, power: 290, maxspeed: 140 });
export const R592 = flatEmu({ number: "592 001", livery: "regional", second: "mediaDistancia", doorW: 1.0, power: 290, maxspeed: 120, diesel: true });

export const S109: ShinkansenSeries = {
  endLength: 26.5, midLength: 25.4, W: 1.46, Y: 1.4, S: 3.1, C: 4.05, lean: 0.95, B: 0.8, A: 1.05,
  // the Frecciarossa 1000's long nose, its windscreen in one sweep
  nose: nose(6.0, 0.06, 2.5, [[0, 1.2], [0.6, 1.6], [2.4, 2.3], [4.2, 3.0], [5.8, 3.65], [6.8, 4.05]], [[0, 1.15], [0.6, 1.5], [2.4, 2.1], [4.2, 2.65], [5.8, 2.95], [6.8, 3.1]], [[0, 1.1], [1.5, 1.3], [3.0, 1.4]], [[0, 1.05], [1.5, 1.05]], [[0, 1.0], [0.6, 0.6], [2.0, 0.8]]),
  windscreen: [4.0, 6.0, 0.07, 1.05], lamps: [1.4, 1.45],
  windows: [[1.95, 2.75]], windowW: 1.3, pitch: 1.55, door: [1.3, 3.05, 1.95, 2.65], doorW: 0.9,
  bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.65, cars: [4, 8],
  liveries: { iryo: esLivery("iryo", "109 001") },
  weight: { end: 58, middle: 54 }, power: 1100, maxspeed: 360,
};

const P = {
  s100: seriesParams(S100), s103: seriesParams(S103), s102: seriesParams(S102), s106: seriesParams(S106), s130: seriesParams(S130), talgo3: seriesParams(TALGO_III),
  s120: seriesParams(S120), civia: seriesParams(CIVIA), r446: seriesParams(R446), r440: seriesParams(R440), r592: seriesParams(R592), s109: seriesParams(S109),
};

export function renfeS100(v?: ParamValues): MeshBuilder { return buildSeries(S100, P.s100, v); }
export function renfeS100Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S100, P.s100, v); }
export function renfeS103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function renfeS103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function renfeS102(v?: ParamValues): MeshBuilder { return buildSeries(S102, P.s102, v); }
export function renfeS102Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S102, P.s102, v); }
export function renfeS106(v?: ParamValues): MeshBuilder { return buildSeries(S106, P.s106, v); }
export function renfeS106Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S106, P.s106, v); }
export function renfeS130(v?: ParamValues): MeshBuilder { return buildSeries(S130, P.s130, v); }
export function renfeS130Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S130, P.s130, v); }
export function talgoIii(v?: ParamValues): MeshBuilder { return buildSeries(TALGO_III, P.talgo3, v); }
export function talgoIiiLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(TALGO_III, P.talgo3, v); }
export function renfeS120(v?: ParamValues): MeshBuilder { return buildSeries(S120, P.s120, v); }
export function renfeS120Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S120, P.s120, v); }
export function renfeCivia(v?: ParamValues): MeshBuilder { return buildSeries(CIVIA, P.civia, v); }
export function renfeCiviaLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CIVIA, P.civia, v); }
export function renfe446(v?: ParamValues): MeshBuilder { return buildSeries(R446, P.r446, v); }
export function renfe446Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R446, P.r446, v); }
export function renfe440(v?: ParamValues): MeshBuilder { return buildSeries(R440, P.r440, v); }
export function renfe440Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R440, P.r440, v); }
export function renfe592(v?: ParamValues): MeshBuilder { return buildSeries(R592, P.r592, v); }
export function renfe592Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R592, P.r592, v); }
export function iryoS109(v?: ParamValues): MeshBuilder { return buildSeries(S109, P.s109, v); }
export function iryoS109Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S109, P.s109, v); }

export const ES_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-renfe-s100", "AVE S-100", S100, P.s100, renfeS100, renfeS100Lod, "renfe-s100", "uic"),
  seriesDesign("proc-vehicle-renfe-s103", "AVE S-103", S103, P.s103, renfeS103, renfeS103Lod, "renfe-s103", "uic"),
  seriesDesign("proc-vehicle-renfe-s102", "AVE S-102 Pato", S102, P.s102, renfeS102, renfeS102Lod, "renfe-s102", "uic"),
  seriesDesign("proc-vehicle-renfe-s106", "Talgo Avril S-106", S106, P.s106, renfeS106, renfeS106Lod, "renfe-s106", "uic"),
  seriesDesign("proc-vehicle-renfe-s130", "Alvia S-130", S130, P.s130, renfeS130, renfeS130Lod, "renfe-s130", "uic"),
  seriesDesign("proc-vehicle-talgo-iii", "Talgo III", TALGO_III, P.talgo3, talgoIii, talgoIiiLod, "talgo-iii", "uic"),
  seriesDesign("proc-vehicle-renfe-s120", "Renfe S-120", S120, P.s120, renfeS120, renfeS120Lod, "renfe-s120", "uic"),
  seriesDesign("proc-vehicle-renfe-civia", "Renfe Civia", CIVIA, P.civia, renfeCivia, renfeCiviaLod, "renfe-civia", "uic"),
  seriesDesign("proc-vehicle-renfe-446", "Renfe 446", R446, P.r446, renfe446, renfe446Lod, "renfe-446", "uic"),
  seriesDesign("proc-vehicle-renfe-440", "Renfe 440", R440, P.r440, renfe440, renfe440Lod, "renfe-440", "uic"),
  seriesDesign("proc-vehicle-renfe-592", "Renfe 592", R592, P.r592, renfe592, renfe592Lod, "renfe-592", "uic"),
  seriesDesign("proc-vehicle-iryo-s109", "Iryo Frecciarossa 1000", S109, P.s109, iryoS109, iryoS109Lod, "iryo-s109", "uic"),
];
