// British units on the series kit (shinkansen.ts), at their real size on the
// W6a gauge ("uk", loadingGauge.ts): the InterCity 125 and InterCity 225 (their
// power car and driving end as the end cars), the Class 800 and the Class 390
// Pendolino, the Eurostar e300, the Class 158 (its own cars, brClass158.ts) and
// the Class 142 Pacer (its own two-axle cars, brClass142.ts), and London Underground's 1938 tube stock, and
// London Overground's Class 378 Capitalstar. See docs/models/uk-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamValues, type ProceduralDesign } from "./design.ts";
import { class142, class142Lod, type C142Livery, type C142Unit } from "./brClass142.ts";
import { class158, class158Lod, type C158Livery, type C158Unit } from "./brClass158.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";
import { TUBE_CAB, TUBE_DOOR, TUBE_LAYOUT, TUBE_WINDOW, tubeFittings } from "./lu1938Parts.ts";

/** A livery from [top of band, colour] pairs, bottom first. */
const lv = (title: string, number: string, ...list: Array<[number, string]>): ShinkansenLivery => {
  const palette: ShinkansenLivery["palette"] = { roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) };
  const bands: Array<[number, number, string]> = [];
  let y = 0;
  list.forEach(([top, colour], i) => { palette[`b${i}`] = c(colour); bands.push([y, top, `b${i}`]); y = top; });
  return { title, number, palette, bands, roof: "roofG", skirt: "skirtG" };
};

const MK3 = { midLength: 23.0, W: 1.37, Y: 1.3, S: 3.1, C: 3.88, lean: 0.95, B: 0.85, A: 1.05, windows: [[1.85, 2.65]] as Array<readonly [number, number]>, windowW: 1.6, pitch: 2.1, door: [1.15, 2.95, 1.85, 2.55] as const, doorW: 0.8, bogieCentres: 16.0, wheelR: 0.46, wheelbase: 2.6 };

export const HST: ShinkansenSeries = {
  ...MK3, endLength: 17.79,
  // the Class 43's wedge nose, the cab windscreen low in it
  nose: nose(3.6, 0.2, 2.4, [[0, 1.45], [0.4, 1.95], [1.8, 2.7], [3.2, 3.5], [4.2, 3.88]], [[0, 1.4], [0.4, 1.85], [1.8, 2.5], [3.2, 2.95], [4.2, 3.1]], [[0, 1.3], [1.0, 1.3]], [[0, 1.15], [0.8, 1.05]], [[0, 0.85], [0.5, 0.6], [1.5, 0.6], [1.7, 0.85]]),
  windscreen: [1.7, 3.0, 0.07, 1.0], lamps: [0.4, 1.4], traction: "diesel", cars: [4, 6, 8],
  // a locomotive, not a coach: its bogies 10.29 m apart under the middle of the
  // power car, plain sides with the cab door, the radiator grille and the van's
  // door and window at the inner end, the yellow nose below the windscreen
  endBogies: [3.75, 14.04],
  endSides: { windows: [[3.1, 3.6], [15.3, 15.8]], doors: [[3.85, 4.5], [16.2, 16.85]] },
  endGrilles: [[12.6, 14.4, 2.05, 3.0, 14], [5.2, 6.2, 2.25, 2.85, 8]],
  cabPanel: { d: 1.6, y: [0.5, 2.75], colour: "#f2c400" },
  liveries: {
    swallow: lv("InterCity", "43 096", [1.0, "#3a3d40"], [1.75, "#f1f1ee"], [1.83, "#c8102e"], [1.88, "#f1f1ee"], [9, "#3a3d40"]),
    blueGrey: lv("BR blue, grey", "43 002", [1.85, "#1d3f80"], [9, "#c9cccd"]),
  },
  weight: { end: 70, middle: 34 }, power: 1680, maxspeed: 200,
};

export const IC225: ShinkansenSeries = {
  ...MK3, endLength: 19.4,
  // the Class 91's No. 1 end: a short wedge, its lower front nearly upright under
  // the yellow panel, the windscreen raked back to the roof; buffers at the beam
  nose: nose(0.9, 0.72, 2.4, [[0, 1.65], [0.35, 2.3], [1.0, 3.0], [1.7, 3.55], [2.3, 3.82], [2.6, 3.88]], [[0, 1.6], [0.35, 2.25], [1.0, 2.75], [1.7, 3.0], [2.3, 3.1]], [[0, 1.3], [1.0, 1.3]], [[0, 1.15], [0.8, 1.05]], [[0, 1.05], [0.4, 0.85]]),
  windscreen: [0.45, 1.6, 0.07, 1.05], lamps: [0.05, 1.5], faceLamps: [[0.62, 1.4, 0.08, "lampHead"], [-0.62, 1.4, 0.08, "lampHead"], [0.8, 1.4, 0.05, "lampRed"], [-0.8, 1.4, 0.05, "lampRed"]], faceGrille: { z: 0.45, y: [1.28, 1.52], slats: 4 }, endPantograph: "lead", endCoupler: "buffers", cars: [4, 6, 8],
  // a locomotive, not a coach: its bogies 10.5 m apart under the middle of the
  // body (18.5 m between the buffer beams), plain sides with the cab doors and a
  // few small windows
  endBogies: [3.8, 14.3],
  endSides: { windows: [[1.45, 2.05], [5.4, 5.8], [11.0, 11.4], [16.2, 16.6]], doors: [[2.3, 2.95], [17.3, 17.95]] },
  cabPanel: { d: 0.6, y: [1.05, 2.3], colour: "#f2c400" },
  liveries: {
    intercity: lv("InterCity", "91 101", [1.0, "#3a3d40"], [1.75, "#f1f1ee"], [1.83, "#c8102e"], [1.88, "#f1f1ee"], [9, "#3a3d40"]),
    lner: lv("LNER", "91 111", [1.75, "#c8102e"], [9, "#f1f1ee"]),
  },
  weight: { end: 84, middle: 41 }, power: 4700, maxspeed: 225,
};

export const C800: ShinkansenSeries = {
  endLength: 26.0, midLength: 26.0, W: 1.35, Y: 1.3, S: 3.05, C: 3.85, lean: 0.95, B: 0.8, A: 1.0,
  nose: nose(3.8, 0.2, 2.4, [[0, 1.4], [0.5, 1.95], [1.8, 2.65], [3.2, 3.4], [4.2, 3.85]], [[0, 1.35], [0.5, 1.85], [1.8, 2.45], [3.2, 2.9], [4.2, 3.05]], [[0, 1.3], [1.0, 1.3]], [[0, 1.1], [0.8, 1.0]], [[0, 1.0], [0.4, 0.8]]),
  windscreen: [1.8, 3.6, 0.07, 1.0], lamps: [0.5, 1.4],
  windows: [[1.85, 2.65]], windowW: 1.3, pitch: 1.6, door: [1.15, 2.95, 1.85, 2.55], doorW: 0.9,
  bogieCentres: 18.0, wheelR: 0.43, wheelbase: 2.6, cars: [5, 8],
  liveries: { gwr: lv("GWR green", "800 001", [9, "#0b4d3a"]), azuma: lv("LNER Azuma", "800 101", [1.1, "#c8102e"], [9, "#f1f1ee"]) },
  weight: { end: 50, middle: 45 }, power: 700, maxspeed: 200,
};

export const C390: ShinkansenSeries = {
  endLength: 24.8, midLength: 23.9, W: 1.36, Y: 1.3, S: 2.95, C: 3.56, lean: 0.9, B: 0.8, A: 1.0,
  // the tilting Pendolino's narrowing body and pointed nose
  nose: nose(3.6, 0.15, 2.3, [[0, 1.4], [0.5, 1.9], [1.8, 2.6], [3.2, 3.25], [4.0, 3.56]], [[0, 1.35], [0.5, 1.8], [1.8, 2.4], [3.2, 2.85], [4.0, 2.95]], [[0, 1.3], [1.0, 1.3]], [[0, 1.1], [0.8, 1.0]], [[0, 1.0], [0.4, 0.8]]),
  windscreen: [1.8, 3.4, 0.07, 0.95], lamps: [0.5, 1.4],
  windows: [[1.8, 2.6]], windowW: 1.2, pitch: 1.5, door: [1.15, 2.9, 1.8, 2.5], doorW: 0.85,
  bogieCentres: 17.0, wheelR: 0.43, wheelbase: 2.7, cars: [4, 6, 8],
  liveries: { virgin: lv("Virgin", "390 001", [1.2, "#3a3d40"], [1.3, "#c8102e"], [9, "#9aa0a5"]), avanti: lv("Avanti", "390 103", [1.2, "#003b4a"], [1.3, "#e86a5c"], [9, "#003b4a"]) },
  weight: { end: 57, middle: 50 }, power: 850, maxspeed: 225,
};

export const E300: ShinkansenSeries = {
  endLength: 22.15, midLength: 18.7, W: 1.39, Y: 1.35, S: 3.0, C: 3.9, lean: 0.95, B: 0.8, A: 1.05,
  nose: nose(5.5, 0.06, 2.4, [[0, 1.2], [0.6, 1.6], [2.4, 2.3], [4.0, 3.0], [5.4, 3.6], [6.4, 3.9]], [[0, 1.15], [0.6, 1.5], [2.4, 2.1], [4.0, 2.65], [5.4, 2.9], [6.4, 3.0]], [[0, 1.1], [1.5, 1.3], [3.0, 1.35]], [[0, 1.05], [1.5, 1.05]], [[0, 1.0], [0.6, 0.6], [2.0, 0.8]]),
  windscreen: [3.6, 5.4, 0.07, 1.0], lamps: [1.3, 1.45],
  windows: [[1.9, 2.65]], windowW: 1.1, pitch: 1.4, door: [1.25, 2.95, 1.9, 2.55], doorW: 0.8,
  bogieCentres: 14.0, wheelR: 0.46, wheelbase: 3.0, cars: [4, 6, 8],
  // the power cars are locomotives, not coaches: bogies 14 m apart under the
  // middle, the cab door and a porthole behind the cab, the machine room's long
  // louvre band; the pantograph on the power car, the rear one raised in a train
  endBogies: [4.07, 18.07],
  endSides: { windows: [[5.25, 5.55]], doors: [[4.35, 5.0]] },
  endGrilles: [[8.6, 20.3, 2.15, 3.1, 36]],
  endPantograph: "trail",
  liveries: {
    eurostar: lv("Eurostar", "3001", [1.25, "#1d2a5a"], [1.35, "#f2c31a"], [9, "#f1f1ee"]),
    eurostar2011: lv("Eurostar 2011", "3201", [1.25, "#1d2a5a"], [1.33, "#e8c547"], [9, "#e9ebec"]),
  },
  weight: { end: 68, middle: 44 }, power: 1500, maxspeed: 300,
};

export const C158: ShinkansenSeries = {
  endLength: 22.57, midLength: 22.57, W: 1.35, Y: 1.3, S: 3.0, C: 3.81, lean: 0.96, B: 0.98, A: 1.1,
  // the Express Sprinter: its cars drawn by brClass158.ts (the series kit's fields here give the
  // design its parameters and figures)
  nose: nose(0.75, 0.8, 2.6, [[0, 3.15], [0.3, 3.55], [0.75, 3.81]], [[0, 3.0], [0.3, 3.1]], [[0, 1.3]], [[0, 1.1], [0.3, 1.05]], [[0, 0.98], [0.2, 0.95]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  windows: [[1.92, 2.72]], windowW: 1.44, pitch: 1.79, door: [1.02, 2.98, 1.85, 2.72], doorW: 1.0,
  bogieCentres: 16.0, wheelR: 0.42, wheelbase: 2.6, traction: "diesel", cars: [2],
  liveries: {
    regional: lv("Regional Rail", "158 819", [1.6, "#cdd0d2"], [1.84, "#4f8fd0"], [2.8, "#1d2f6e"], [9, "#cdd0d2"]),
    northern: lv("Northern", "158 784", [3.05, "#e7e8e9"], [9, "#7d8084"]),
  },
  weight: { end: 38, middle: 38 }, power: 260, maxspeed: 145,
};

export const C142: ShinkansenSeries = {
  endLength: 15.45, midLength: 15.45, W: 1.39, Y: 1.3, S: 2.95, C: 3.6, lean: 0.97, B: 1.0, A: 1.15,
  // the Pacer: a bus body on a two-axle wagon underframe, drawn by brClass142.ts (the series
  // kit's fields here give the design its parameters and figures)
  nose: nose(0.5, 0.7, 2.2, [[0, 3.1], [0.3, 3.45], [0.5, 3.6]], [[0, 2.85], [0.3, 2.95]], [[0, 1.35], [0.3, 1.3]], [[0, 1.2], [0.3, 1.15]], [[0, 1.1], [0.2, 1.0]]),
  windscreen: [0.02, 0.35, 0.07, 1.2], lamps: [0.03, 1.5],
  windows: [[1.8, 2.6]], windowW: 1.1, pitch: 1.35, door: [1.2, 2.85, 1.8, 2.5], doorW: 1.0,
  bogieCentres: 9.0, wheelR: 0.43, wheelbase: 0, traction: "diesel", cars: [2],
  liveries: { provincial: lv("Provincial", "142 001", [1.75, "#7a4a2a"], [2.7, "#e6dcc0"], [9, "#7a4a2a"]), northern: lv("Northern", "142 096", [1.45, "#262262"], [9, "#d0d3d4"]), walesTeal: lv("Wales teal", "142 080", [9, "#0f8c9c"]), provincialBlue: lv("Provincial blue", "142 088", [1.72, "#1f3f8f"], [9, "#8fb0d8"]), metro: lv("Metro", "142 066", [9, "#1497a6"]), walesWrap: lv("Wales navy wrap", "142 075", [9, "#0f8c9c"]) },
  weight: { end: 25, middle: 25 }, power: 165, maxspeed: 120,
};

export const TUBE1938: ShinkansenSeries = {
  // the tube profile: 2.62 m wide and 2.88 m high, the sides upright to the window heads, a low dome over them
  endLength: 16.0, midLength: 15.5, W: 1.31, Y: 0.7, S: 2.3, C: 2.88, lean: 0.985, B: 0.6, A: 0.66, arc: 10,
  nose: nose(0.6, 0.5, 2.2, [[0, 2.3], [0.3, 2.65], [0.6, 2.88]], [[0, 2.2], [0.3, 2.4]], [[0, 0.95], [0.3, 0.95]], [[0, 0.7], [0.3, 0.62]], [[0, 0.6], [0.2, 0.5]]),
  // the flat cab front, its corners rounded in plan and its roof domed down to it
  flatCab: TUBE_CAB, cabNose: nose(0.3, 0.9, 2.5, [[0, 2.62], [0.25, 2.8], [0.6, 2.88]], [[0, 2.24], [0.25, 2.3]], [], [], []),
  windscreen: [0.05, 0.5, 0.07, 1.05], lamps: [0.05, 1.0],
  windows: [TUBE_WINDOW], windowW: 1.0, pitch: 1.12, door: TUBE_DOOR, doorW: 0.7, layout: TUBE_LAYOUT, numberAt: [-1.6, 0.92, 0.13],
  bogieCentres: 10.0, centredBogies: true, wheelR: 0.43, wheelbase: 2.1, couplerY: 0.45, metro: true, cars: [3, 4, 7], fittings: tubeFittings,
  liveries: {
    lu: {
      title: "London Transport", number: "10012", bands: [[0, 9, "ltRed"]], roof: "ltRoof", skirt: "skirtG",
      palette: {
        ltRed: c("#c3161c", 0.35), ltRoof: c("#8c3a30", 0.7), skirtG: c("#232426", 0.8), cabMask: c("#1d1f22", 0.3),
        lettering: c("#c9a24a", 0.35), blind: c("#f1efe6", 0.5), lineMagenta: c("#c0267e"), lineBlue: c("#1c2f6e"),
        vent: c("#5e2620", 0.7), step: c("#b9b6ae", 0.5), underBox: c("#3a3c3f", 0.8),
      },
    },
  },
  weight: { end: 28, middle: 22 }, power: 270, maxspeed: 72,
};

/** London Overground's scheme: blue skirt, white sides, a black window band, orange doors; the cab front yellow. */
const overground = (number: string): ShinkansenLivery => ({
  title: "London Overground", number,
  palette: { blue: c("#0019a8"), orange: c("#ee7c0e"), white: c("#f1f1ee"), black: c("#1d1f22", 0.3), yellow: c("#ffcd00"), roofG: c("#9a9ea2", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) },
  bands: [[0, 1.55, "blue"], [1.55, 1.62, "orange"], [1.62, 1.85, "white"], [1.85, 2.85, "black"], [2.85, 9, "white"]],
  doors: [[0, 9, "orange"]],
  front: [[0, 1.45, "blue"], [1.45, 1.52, "orange"], [1.52, 2.3, "yellow"], [2.3, 9, "black"]],
  roof: "roofG", skirt: "skirtG",
});

/** The Class 378 Capitalstar: Bombardier's Electrostar for London Overground, 2.8 m wide, two wide doors a side, five cars (101.35 m). */
export const C378: ShinkansenSeries = {
  endLength: 20.4, midLength: 20.1, W: 1.395, Y: 1.3, S: 3.3, C: 3.77, lean: 0.96, B: 0.9, A: 1.05,
  // the Electrostar's upright cab: a flat front face, its top and corners rounded, the windscreens either side of the gangway door
  nose: nose(0.7, 0.8, 2.6, [[0, 3.3], [0.3, 3.6], [0.7, 3.77]], [[0, 3.2], [0.35, 3.3]], [[0, 1.3]], [[0, 1.1], [0.3, 1.05]], [[0, 0.95], [0.2, 0.9]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  noseCab: {
    panes: [[0.4, 1.02, 2.35, 3.05], [-0.26, 0.26, 2.4, 3.05], [-1.02, -0.4, 2.35, 3.05]],
    lamps: [[-0.72, 1.85, 0.09, "lampHead"], [0.72, 1.85, 0.09, "lampHead"], [-0.95, 1.85, 0.05, "lampRed"], [0.95, 1.85, 0.05, "lampRed"]],
    gangway: [0.32, 1.35, 3.12],
  },
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.75, door: [1.15, 3.05, 1.9, 2.7], doorW: 1.6, doorCount: 2,
  bogieCentres: 14.173, wheelR: 0.42, wheelbase: 2.6, cars: [3, 4, 5],
  liveries: { overground: overground("378 204") },
  weight: { end: 45.5, middle: 40.7 }, power: 480, maxspeed: 121,
};

const P = { hst: seriesParams(HST), ic225: seriesParams(IC225), c800: seriesParams(C800), c390: seriesParams(C390), e300: seriesParams(E300), c158: seriesParams(C158), c142: seriesParams(C142), tube: seriesParams(TUBE1938), c378: seriesParams(C378) };

export function brHst(v?: ParamValues): MeshBuilder { return buildSeries(HST, P.hst, v); }
export function brHstLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HST, P.hst, v); }
export function brIc225(v?: ParamValues): MeshBuilder { return buildSeries(IC225, P.ic225, v); }
export function brIc225Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(IC225, P.ic225, v); }
export function brClass800(v?: ParamValues): MeshBuilder { return buildSeries(C800, P.c800, v); }
export function brClass800Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(C800, P.c800, v); }
export function brClass390(v?: ParamValues): MeshBuilder { return buildSeries(C390, P.c390, v); }
export function brClass390Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(C390, P.c390, v); }
export function eurostar373(v?: ParamValues): MeshBuilder { return buildSeries(E300, P.e300, v); }
export function eurostar373Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E300, P.e300, v); }
export function brClass158(v?: ParamValues): MeshBuilder { const p = resolveParams(P.c158, v); return class158(p.unit as C158Unit, p.livery as C158Livery); }
export function brClass158Lod(v?: ParamValues): MeshBuilder { const p = resolveParams(P.c158, v); return class158Lod(p.unit as C158Unit, p.livery as C158Livery); }
export function brClass142(v?: ParamValues): MeshBuilder { const p = resolveParams(P.c142, v); return class142(p.unit as C142Unit, p.livery as C142Livery); }
export function brClass142Lod(v?: ParamValues): MeshBuilder { const p = resolveParams(P.c142, v); return class142Lod(p.unit as C142Unit, p.livery as C142Livery); }
export function lu1938Stock(v?: ParamValues): MeshBuilder { return buildSeries(TUBE1938, P.tube, v); }
export function lu1938StockLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(TUBE1938, P.tube, v); }

export function brClass378(v?: ParamValues): MeshBuilder { return buildSeries(C378, P.c378, v); }
export function brClass378Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(C378, P.c378, v); }

export const UK_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-br-hst", "InterCity 125", HST, P.hst, brHst, brHstLod, "br-hst", "uk"),
  seriesDesign("proc-vehicle-br-ic225", "InterCity 225", IC225, P.ic225, brIc225, brIc225Lod, "br-ic225", "uk"),
  seriesDesign("proc-vehicle-br-class-800", "Class 800 IET", C800, P.c800, brClass800, brClass800Lod, "br-class-800", "uk"),
  seriesDesign("proc-vehicle-br-class-390", "Class 390 Pendolino", C390, P.c390, brClass390, brClass390Lod, "br-class-390", "uk"),
  seriesDesign("proc-vehicle-eurostar-373", "Eurostar e300", E300, P.e300, eurostar373, eurostar373Lod, "eurostar-373", "uk"),
  seriesDesign("proc-vehicle-br-class-158", "Class 158", C158, P.c158, brClass158, brClass158Lod, "br-class-158", "uk"),
  seriesDesign("proc-vehicle-br-class-142", "Class 142 Pacer", C142, P.c142, brClass142, brClass142Lod, "br-class-142", "uk"),
  seriesDesign("proc-vehicle-lu-1938-stock", "London 1938 Stock", TUBE1938, P.tube, lu1938Stock, lu1938StockLod, "lu-1938-stock", "uk"),
  seriesDesign("proc-vehicle-br-class-378", "Class 378 Capitalstar", C378, P.c378, brClass378, brClass378Lod, "br-class-378", "uk"),
];
