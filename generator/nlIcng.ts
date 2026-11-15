// The NS ICNG (Intercity Nieuwe Generatie, Alstom Coradia Stream, in service from 2023), drawn on
// the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): five- and eight-car units on
// Jacobs bogies (the series kit's `jacobs`), the long nose - the lower front upright and broad round
// the big recess of the Scharfenberg coupler, the oval black lamp housings on its corners, the
// windscreen raked about 45 degrees in the black visor that wraps round the cab and runs back as the
// window band, the yellow cap with its roof lamp -, NS's domestic scheme (yellow, the blue window
// band rising and darkening to black at the cab, a yellow line and a blue cantrail band under the grey
// roof, yellow doors), one wide swing-plug door a side behind the cab and two on each intermediate
// car, the roof fairing over the motor bogie behind the cab. Matched to the photographs in
// assets/ns-icng/ (SOURCES.md: 3146 side-on at Rotterdam, 3110 and 3137 three-quarter and head-on,
// 3114 at the coupled joint, 3137 / 3222 on the line) and the published figures (nl.wikipedia
// "Intercity Nieuwe Generatie": 110 m over five cars, 164.9 m over eight, 198.7 / 285.7 t,
// 2,545 / 3,390 kW, 200 km/h; Jacobs cars 18.3 m, the cars with an own bogie at the coupled joint
// 21.4 m, so the end cars 24.45 m). See docs/models/netherlands-trains.md.
//
// Heights over the rail; on the face d behind its tip (the upright lower front), on the body d behind
// the body's front end (the face's join on the end car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import type { Pt } from "./sliceLoft.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** Where the face meets the body: the cap reaches the crown 2.4 m behind the tip, at the cab door's front. */
const JOIN = 2.4;
/** The crown, the shoulder (the cantrail band's top), the skirt's top, the yellow's foot on the sides over the dark skirt. */
const C = 4.2;
const S = 3.88;
const A = 0.85;
const FOOT = 1.0;

/**
 * The face's centre line, measured on 3146 side-on (100 px/m, the 0.9 m wheels): the dark lip 0.6 m up
 * tucked 0.18 m back, the front upright from 0.8 to 1.8 m, rounding back past the lamp housings, then
 * the windscreen raked about 45 degrees from 2.7 m (0.8 m back) to 3.8 m (1.95 m back), the yellow cap
 * rounding over to the crown 2.4 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.6, 0.18], [0.65, 0.07], [0.72, 0.03], [0.8, 0.015], [1.0, 0], [1.8, 0], [1.95, 0.03], [2.15, 0.09], [2.35, 0.2], [2.5, 0.36],
  [2.65, 0.57], [2.8, 0.8], [3.1, 1.16], [3.4, 1.5], [3.7, 1.85], [3.85, 2.03], [4.0, 2.19], [4.12, 2.31], [C, JOIN],
];

/** The visor: its foot on the front and its top under the cap; the windscreen inside it. */
const VISOR = [2.56, 3.86] as const;
const GLASS = [2.74, 3.7] as const;
/** The lamp housings' centre. */
const LAMP_Y = 2.14;
/** The coupler's recess in the lower front. */
const RECESS = [0.94, 1.72] as const;

const ROWS = [...new Set([
  ...PROFILE.map(([y]) => y), 0.72, RECESS[0], RECESS[1], LAMP_Y - 0.135, LAMP_Y, LAMP_Y + 0.135, 2.32, 2.38, 2.54, VISOR[0], 2.67, 2.82,
  3.45, 3.5, 3.52, 3.66, GLASS[1], VISOR[1], 3.92, 3.98, 4.06,
])].sort((a, b) => a - b);

/** An ellipse round (lat, y), half axes a and b, as a convex polygon. */
const oval = (lat: number, y: number, a: number, b: number): Pt[] => Array.from({ length: 16 }, (_, k): Pt => [lat + a * Math.cos((Math.PI * k) / 8), y + b * Math.sin((Math.PI * k) / 8)]);
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

export const ICNG_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.0, reach: 0.2, first: 9.5, roofFrom: 4.3, tolerance: 0.02,
  profile: PROFILE,
  // the front broad and flat low down, its corners rounding more and sweeping further back up to the windscreen, the cap round
  corner: [[0.48, 0.55], [1.0, 0.5], [2.0, 0.55], [2.5, 0.7], [3.0, 0.9], [3.5, 1.1], [3.9, 1.25], [C, 1.3]],
  cornerDepth: [[0.48, 0.45], [1.0, 0.5], [2.0, 0.6], [2.5, 0.72], [2.8, 0.78], [3.1, 0.72], [3.4, 0.6], [3.7, 0.38], [3.85, 0.24], [4.0, 0.12], [4.12, 0.05], [C, 0.01]],
  bulge: [[0.48, 0.06], [2.2, 0.1], [3.4, 0.09], [3.86, 0.09], [4.0, 0.04], [C, 0]],
  rows: ROWS,
  // the dark lip under the yellow front
  bands: () => [[0, 0.72, "skirtG"], [0.72, 9, "yellow"]],
  lodBands: [[0, 0.72, "skirtG"], [0.72, VISOR[0], "yellow"], [VISOR[0], VISOR[1], "black"], [VISOR[1], 9, "yellow"]],
  lodGlass: { hw: 1.1, y: [GLASS[0], GLASS[1]] },
  paint: [
    // the cab sides yellow up to the cap (over the side's bands)
    { mat: "yellow", front: [[FOOT, -1], [4.3, -1]], back: [[FOOT, 9], [4.3, 9]] },
    // the black visor: under the cap on the front, wrapping round the corners and back along the cab sides to the join,
    // its top falling from the cap's edge to 3.52 m at the join
    { mat: "black", front: [[VISOR[0], -1], [VISOR[1], -1]], back: [[VISOR[0], 0.62], [2.67, JOIN + 0.05], [3.52, JOIN + 0.05], [3.75, 2.08], [VISOR[1], 2.05]] },
    // the dark skirt carried up round the lower front's corners to 1.0 m along the nose's sides
    { mat: "skirtG", front: [[0.4, -1], [0.75, -1], [0.78, 0.1], [0.98, 0.85], [FOOT, 1.0]], back: [[0.4, 9], [FOOT, 9]] },
    // the cab's side window in the visor, its front edge raked with the windscreen
    { mat: "glass", front: [[2.82, 1.3], [3.45, 1.88]], back: [[2.82, 2.28], [3.45, 2.28]] },
  ],
  fields: [
    // the coupler's recess, its bottom corners rounded
    { mat: "black", pts: [[-0.78, RECESS[0] + 0.08], [-0.72, RECESS[0]], [0.72, RECESS[0]], [0.78, RECESS[0] + 0.08], [0.78, RECESS[1]], [-0.78, RECESS[1]]] },
    // the visor's foot dipping to the lamp housings at the corners
    { mat: "black", pts: [[-1.45, 2.32], [-1.0, 2.38], [-0.55, 2.54], [0.55, 2.54], [1.0, 2.38], [1.45, 2.32], [1.45, 2.6], [-1.45, 2.6]] },
    // the roof lamp's black surround on the cap
    { mat: "black", pts: [[-0.2, 3.92], [0.2, 3.92], [0.16, 4.06], [-0.16, 4.06]] },
  ],
  // the three vent slots either side of the roof lamp
  decals: [
    ...[1, -1].flatMap((sd) => [0.36, 0.43, 0.5].map((l) => ({ mat: "black", pts: box(sd * l - 0.015, sd * l + 0.015, 3.94, 4.04), fine: 1 }))),
    // the lamp housings' black ovals, laid on the corners' curve
    ...[1, -1].map((sd) => ({ mat: "black", pts: oval(sd * 1.06, LAMP_Y, 0.33, 0.155), fine: 3 })),
  ],
  panes: [
    { lat: [-1.12, 1.12], y: [GLASS[0], GLASS[1]], r: 0.12 },
    // the destination display at the windscreen's head
    { lat: [-0.62, 0.62], y: [3.5, 3.66], r: 0.03, mat: "display" },
  ],
  // the oval lamp housings on the corners, the headlight in their outer half, the tail light inside
  pods: [1, -1].map((sd) => ({
    lat: sd * 1.06, y: LAMP_Y, w: 0.44, h: 0.22, r: 0.11, proud: 0.025, depth: 0.05, mat: "black",
    lamps: [[sd * 0.07, 0.1, "lampHead"], [-sd * 0.15, 0.04, "lampRed"]] as const,
  })),
  roofLamp: [0, 3.99, 0.06],
  wipers: [[[0.12, 2.8], [0.6, 3.35]]],
};

/** NS's domestic scheme on the ICNG ("Wesp"): the side's bands, the window band's rise and fade at the cab, yellow doors. */
const ICNG_YELLOW_BLUE: ShinkansenLivery = {
  title: "NS yellow, blue", number: "3146",
  palette: {
    yellow: c(NS_YELLOW), blue: c(NS_BLUE), navy: c("#0d1c46"), black: c("#141618", 0.3), skirtG: c("#3b3f44", 0.7), roofG: c("#7d8286", 0.6),
    cabMask: c("#1d1f22", 0.3), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true }, acGrey: c("#8d9296", 0.55), grille: c("#2e3134", 0.7),
  },
  // measured on 3146 and 3114: the dark skirt, yellow, the blue window band, a yellow line, the blue cantrail band, the grey roof
  bands: [[0, FOOT, "skirtG"], [FOOT, 1.5, "yellow"], [1.5, 2.95, "blue"], [2.95, 3.53, "yellow"], [3.53, 9, "blue"]],
  doors: [[0, FOOT, "skirtG"], [FOOT, 9, "yellow"]],
  roof: "roofG", skirt: "skirtG",
  frontRoof: "yellow",
  // the yellow cap carried back over the roof to 2.75 m behind the tip at the crown
  capSlope: { y: S - 0.01, d: [0, 0.5, 0.35] },
  // d behind the tip, [y, d] edges by height (the cab face's sides take them too)
  endSweeps: [
    // the window band's top rising toward the cab: 2.96 m at the door, 3.1 m 3.9 m back, 3.45 m at the cab door
    { mat: "blue", front: [[2.95, -1], [3.45, -1]], back: [[2.95, 9.3], [3.1, 3.9], [3.45, 2.2]] },
    // ... darkening to black over the cab door
    { mat: "navy", front: [[2.18, -1], [3.45, -1]], back: [[2.18, 4.8], [3.077, 4.8], [3.1, 3.9], [3.45, 2.2]] },
    { mat: "black", front: [[2.18, -1], [3.45, -1]], back: [[2.18, 4.0], [3.096, 4.0], [3.1, 3.9], [3.45, 2.2]] },
    // the window band's foot rising from 1.5 m at the door to 2.18 m at the cab door: yellow under it
    { mat: "yellow", front: [[1.5, -1], [2.25, -1]], back: [[1.5, 9.3], [1.68, 7.2], [1.89, 5.3], [2.18, 3.4], [2.25, JOIN]] },
    // the cantrail band tapering to its point over the cab door: yellow over it
    { mat: "yellow", front: [[3.53, -1], [S, -1]], back: [[3.53, 9.4], [3.64, 5.3], [3.79, 3.4], [S, 3.0]] },
  ],
};

/** The end car's roof fairing, the cab's cooling unit, the cab door, the coupler and every car's underfloor and air conditioning. */
function icngFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  m.scope("roof equipment", () => {
    if (car.end) {
      // the cab's cooling unit, then the long fairing over the motor bogie's traction equipment with its grilles
      m.scope("cab cooling", () => at("acGrey", 3.1 - JOIN, 5.65 - JOIN, C - 0.06, C + 0.14, 0.62));
      m.scope("fairing", () => {
        at("roofG", 6.35 - JOIN, 10.25 - JOIN, C - 0.06, C + 0.2, 0.92);
        for (const sd of [1, -1]) for (let k = 0; k < 4; k++) {
          const d0 = 6.55 - JOIN + k * 0.92;
          block(m, "grille", Math.min(X(d0), X(d0 + 0.78)), Math.max(X(d0), X(d0 + 0.78)), C + 0.2, C + 0.205, sd > 0 ? 0.12 : -0.82, sd > 0 ? 0.82 : -0.12);
        }
      });
      m.scope("air conditioning", () => at("acGrey", 15.0 - JOIN, 18.4 - JOIN, C - 0.06, C + 0.26, 0.8));
    } else m.scope("air conditioning", () => at("acGrey", car.length / 2 - 1.7, car.length / 2 + 1.7, C - 0.06, C + 0.26, 0.8));
  });
  if (car.end) {
    m.scope("cab door", () => {
      // the yellow cab door at the join, its outline and the two silver handrails beside it
      const [d0, d1, y0, y1, k] = [0.02, 0.98, 1.2, 3.42, 0.02];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.005, 0.02);
        for (const t of [-0.08, 1.08]) sidePanel(m, b, X, sd, "frameSilver", t - 0.015, t + 0.015, 1.25, 3.3, 0.035, 0.03);
      }
    });
    m.scope("coupler", () => {
      // the Scharfenberg head in its recess, on the coupling plane 0.2 m ahead of the tip
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.45, 0.1, 0.94, 1.08, 0.1);
      out("carbon", 0.1, 0.2, 0.88, 1.16, 0.2);
    });
  }
  // the end beam under each inner end wall, closing the skirt's cut over the joint's bogie
  m.scope("end beams", () => {
    for (const [d0, d1] of car.end ? [[car.length - 0.14, car.length - 0.04]] : [[0.04, 0.14], [car.length - 0.14, car.length - 0.04]]) at("under", d0!, d1!, 0.6, A - 0.02, 1.2);
  });
  m.scope("underfloor", () => {
    const [y0, y1] = [0.4, 0.95];
    if (car.end) { at("under", 7.3 - JOIN, 11.2 - JOIN, y0, y1, 1.1); at("under", 11.8 - JOIN, 17.5 - JOIN, y0, y1, 1.15); at("under", 18.0 - JOIN, 20.8 - JOIN, y0, y1, 1.05); }
    else { at("under", 2.6, 6.8, y0, y1, 1.1); at("under", 7.4, 12.2, y0, y1, 1.15); at("under", 12.8, 16.4, y0, y1, 1.05); }
  });
}

/** A single swing-plug door, 1.88 m over its frame (1.6 m clear), d0 its front edge. */
const door = (d0: number): readonly [number, number, number] => [d0, d0 + 1.88, 1];
/** Windows 1.6 m long, from d0. */
const win = (d0: number, w = 1.6): readonly [number, number] => [d0, d0 + w];

export const ICNG: ShinkansenSeries = {
  // end cars 24.45 m from the coupler to the joint, intermediate cars 19.85 m (between the 18.3 m Jacobs cars and the
  // 21.4 m cars at the coupled joint: 108.5 m over five cars, 168.0 m over eight); 2.84 m wide, 4.2 m high
  endLength: 24.45, midLength: 19.85, W: 1.42, Y: 1.05, S, C, lean: 0.97, B: 0.6, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICNG_FACE,
  // windows 1.6 m long, 2.0 - 2.87 m; the doors' leaf 1.0 - 3.41 m, its window 0.9 m wide, rounded
  windows: [[2.0, 2.87]], windowW: 1.6, pitch: 2.35, door: [0.71, 3.41, 1.76, 3.02], doorW: 1.88, doorGlassW: 0.9, doorGlassR: 0.1,
  layout: {
    // d behind the body's front end: the end car measured on 3146 side-on, the rear half and the intermediate car in projective fits on 3110
    end: {
      doors: [door(7.08)],
      windows: [win(2.37), win(4.67), win(9.7), win(12.05), win(14.4), win(16.75), win(19.1)],
    },
    middle: {
      doors: [door(3.6), door(12.0)],
      windows: [win(0.75, 2.2), win(6.2), win(8.5), win(14.6), win(16.9)],
    },
  },
  // the cab door's window
  cabWindows: [[0.31, 0.68, 2.7, 3.2]],
  // the destination displays in the yellow line over a window
  sidePanels: {
    end: [{ d: [12.45 + JOIN, 13.25 + JOIN], y: [3.1, 3.38], kind: "panel", mat: "black", screen: "display" }],
    middle: [{ d: [8.9, 9.7], y: [3.1, 3.38], kind: "panel", mat: "black", screen: "display" }],
  },
  // Jacobs bogies under the joints; the end car's motor bogie 5.28 m behind the tip; 0.9 m wheels, 2.6 m wheelbase
  jacobs: true, endBogies: [5.28 - JOIN, 24.45 - 0.2 - JOIN], bogieCentres: 19.0, wheelR: 0.45, wheelbase: 2.6,
  // the single-arm pantograph near an intermediate car's end (on the real unit over the coupled joint's own bogie)
  pantographAt: 2.0,
  lodRoof: { d: [6.35, 10.25], hw: 0.92, y: [C - 0.06, C + 0.2], mat: "roofG" },
  // the yellow and black at the cab door in the distant model, over the side's blue band
  lodEndPatches: [
    { d: [JOIN, 4.6], hw: 1.425, y: [FOOT, 2.2], mat: "yellow" },
    { d: [JOIN, 4.2], hw: 1.425, y: [2.2, 3.4], mat: "black" },
  ],
  fittings: icngFittings,
  cars: [5, 8],
  liveries: { yellowBlue: ICNG_YELLOW_BLUE },
  // 198.7 t over five cars and 285.7 t over eight (ERATV); 2,545 / 3,390 kW, here 460 kW a car (2,300 / 3,680 kW)
  weight: { end: 56, middle: 29 }, power: 460, maxspeed: 200,
};
