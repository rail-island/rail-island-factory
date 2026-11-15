// The NS Sprinter Lighttrain (SLT, Bombardier/Siemens 2007 - 2012): the four-car SLT-IV (2401 - 2469,
// 69.36 m) and the six-car SLT-VI (2601 - 2662, 100.54 m), drawn on the series kit (shinkansen.ts) with
// its own cab face (seriesCab.ts). Short car bodies on Jacobs bogies (Bo'(Bo)'(2)'(2)'Bo'); the rounded
// front with the big raked windscreen under the light grey cap, the blue surround sweeping from under the
// lamps round the corners and back over the cab roof, the dark bumper round the Scharfenberg coupler's
// recess; white sides with the blue window band starting in a point behind the cab, yellow doors, the
// yellow line at the floor. Matched to the photographs in assets/ns-slt/ (SOURCES.md): 2463 at 't Harde
// (the front three-quarter), 2632 at Woudenberg (the side, measured by a projective fit on the joints),
// 2401 at Schiedam and an SLT-VI head-on (the face), 2607 at Amsterdam Amstel (the pantograph).
// See docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip (the bumper's front) on the face and in the livery's
// sweeps, else d behind the body's front end (the face's join on the end car, the joint on a middle car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** Where the face meets the body: the cap rounds into the roof 1.5 m behind the bumper's front. */
const JOIN = 1.5;
/** The crown over the rail (the head-on photographs at 45 px/m: 4.08 m; 4.21 m published over the roof equipment). */
const C = 4.08;
/** The shoulder, where the white side turns into the roof. */
const S = 3.45;

/**
 * The face's centre line (2463 and the head-on SLT-VI, 45 px/m): the dark bumper upright from its foot to
 * 1.5 m, the white face under the lamps leaning back a little to the windscreen's foot at 2.35 m, then the
 * glass raked about 27 degrees to its head at 3.75 m, 0.86 m back, and the light grey cap rounding over
 * into the roof 1.5 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.6, 0.06], [0.72, 0.02], [0.85, 0], [1.3, 0], [1.45, 0.015], [1.6, 0.035], [1.9, 0.07], [2.15, 0.1], [2.35, 0.14], [2.7, 0.31],
  [3.05, 0.49], [3.4, 0.67], [3.62, 0.79], [3.75, 0.87], [3.88, 0.98], [3.97, 1.1], [4.04, 1.27], [C, JOIN],
];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.74, 0.88, 1.5, 1.7, 1.81, 2.06, 2.4, 3.44, 3.66, 3.78])].sort((a, b) => a - b);

/** The blue round the windscreen, on the cab sides: its back edge from under the lamps at the corner up past the windscreen to the roof (d behind the tip). */
const SWOOSH_BACK: Pt[] = [[1.7, 0.25], [2.0, 0.33], [2.3, 0.43], [2.7, 0.58], [3.05, 0.75], [3.3, 0.95], [3.45, 1.15], [4.6, 2.0]];
/** The window band's pointed front behind the face: top corner 1.75 m back, the point 1.2 m back at 2.28 m, the foot 1.55 m back. */
const BAND_FRONT: Pt[] = [[1.48, 1.55], [2.28, 1.2], [3.05, 1.75]];
/** The dark bumper's top on the cab sides, falling from the face's corner to the yellow line under the cab door. */
const BUMPER_BACK: Pt[] = [[0.74, 2.05], [0.9, 1.95], [1.1, 1.45], [1.25, 0.95], [1.38, 0.5]];

export const SLT_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.9, reach: 0.35, first: 9.24, roofFrom: 3.78, bulge: 0.05, tolerance: 0.04, cols: [6, 3, 1, 1],
  profile: PROFILE,
  // a flat front, its corners rounding back about half a metre into the sides; tighter at the bumper
  corner: [[0.6, 0.38], [1.4, 0.45], [2.3, 0.52], [3.4, 0.6], [3.9, 0.55], [C, 0.25]],
  rows: ROWS,
  // the dark bumper under the white face
  bands: () => [[0, 1.45, "dark"], [1.45, 9, "white"]],
  lodBands: [[0, 1.45, "dark"], [1.45, 1.75, "white"], [1.75, 3.78, "blue"], [3.78, 9, "roofG"]],
  lodGlass: { hw: 0.95, y: [2.38, 3.77] },
  fields: [
    // the blue U round the windscreen: a strip under the lamps and up beside the glass, widening round the upper corners into the cab sides' sweep
    { mat: "blue", pts: [[-1.5, 2.9], [-1.32, 2.3], [-1.17, 1.95], [-0.95, 1.7], [0.95, 1.7], [1.17, 1.95], [1.32, 2.3], [1.5, 2.9], [1.5, 4.6], [-1.5, 4.6]] },
  ],
  masks: [
    // the white panel under the windscreen holding the lamps, rounded at its foot inside the blue U
    { lat: [-0.86, 0.86], y: [1.81, 2.55], r: 0.3, mat: "white" },
    // the wiper's housing under the windscreen
    { lat: [-0.14, 0.14], y: [2.29, 2.42], r: 0.04, mat: "black" },
    // the light grey cap over the windscreen, the blue running up beside it onto the roof
    { lat: [-1.02, 1.02], y: [3.78, 4.6], r: 0.2, mat: "roofG" },
    // the coupler's recess in the bumper
    { lat: [-0.72, 0.72], y: [0.6, 1.4], r: 0.12, mat: "black" },
  ],
  // the windscreen, the destination display behind its head
  panes: [{ lat: [-0.96, 0.96], y: [2.38, 3.77], r: 0.1 }, { lat: [-0.72, 0.72], y: [3.45, 3.66], r: 0.02, mat: "display" }],
  lamps: [[-0.56, 2.06, 0.11, "lampHead"], [0.56, 2.06, 0.11, "lampHead"]],
  // the grilles low on the bumper's corners
  pods: [1, -1].map((sd) => ({ lat: sd * 0.93, y: 0.75, w: 0.36, h: 0.17, r: 0.03, proud: 0.012, depth: 0.03, mat: "grille" })),
  // the third headlight in the cap, left of the centre seen from ahead
  roofLamp: [-0.17, 3.92, 0.075],
  wipers: [[[0.12, 2.44], [0.6, 3.2]]],
};

/** NS's Sprinter scheme on the SLT: white, the blue window band, the yellow line at the floor and yellow doors; light grey roof, the cab's blue over its roof. */
function sltSprinter(title: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      white: c("#f3f4f2"), blue: c(NS_BLUE), yellow: c(NS_YELLOW), silverG: c("#b8bcbf", 0.45), roofG: c("#c4c8ca", 0.5), skirtG: c("#55595d", 0.7),
      dark: c("#3d4246", 0.6), black: c("#141618", 0.3), grille: c("#2b2e31", 0.7), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true },
      cabMask: c("#1d1f22", 0.3),
    },
    bands: [[0, 0.74, "silverG"], [0.74, 0.88, "yellow"], [0.88, 1.48, "white"], [1.48, 3.05, "blue"], [3.05, 9, "white"]],
    doors: [[0, 9, "yellow"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the dark bumper round the cab's lower corners, down to the yellow line under the cab door
      { mat: "dark", front: [[0.74, -9], [1.38, -9]], back: BUMPER_BACK, face: false },
      // white ahead of the window band's point
      { mat: "white", front: [[1.48, -9], [3.05, -9]], back: BAND_FRONT },
      // the blue from round the windscreen back over the cab roof, on the cab sides (the face draws its U)
      { mat: "blue", front: [[1.7, -9], [4.6, -9]], back: SWOOSH_BACK, top: 4.6 },
      // the first class's white line over its two windows
      { mat: "white", front: [[2.66, 4.27], [2.72, 4.27]], back: [[2.66, 8.41], [2.72, 8.41]] },
    ],
    // the blue over the cab roof, ending slanted: 8.2 m behind the tip at the shoulder, 6.2 m at the crown
    endRoofEdge: { mat: "blue", y: C, d: [JOIN, 8.2, 6.2] },
  };
}

/** Body spans [d0, d1] of a door 1.4 m wide centred at d, its two leaves parting. */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.7, d, -1], [d, d + 0.7, 1]];

/** The NS emblem (the two arrows), 0.42 m wide, as convex pieces in (u, v) round its centre: u along the car, v up. */
const NS_LOGO: Pt[][] = [
  // the upper bar, its outer end turned down, the lower bar, its outer end turned up (u along the car toward its back)
  [[-0.1, 0.055], [0.13, 0.055], [0.13, 0.12], [-0.1, 0.12]],
  [[0.13, 0.055], [0.215, -0.015], [0.215, 0.035], [0.13, 0.12]],
  [[-0.13, -0.12], [0.1, -0.12], [0.1, -0.055], [-0.13, -0.055]],
  [[-0.215, -0.035], [-0.13, -0.12], [-0.13, -0.055], [-0.215, 0.015]],
  // the diagonal joining the upper bar's inner end to the lower bar's
  [[-0.1, 0.055], [-0.1, 0.12], [-0.055, 0.12], [0.1, -0.055], [0.1, -0.12], [0.055, -0.12]],
];

/** The emblem is drawn 0.75 m wide and 0.42 m tall (2463: about 0.7 by 0.37 m). */
const LOGO_SCALE = 1.75;

/** The cab door, the roof's grilles, the side's emblems, the coupler, the front skirt and the underfloor of a car. */
function sltFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const emblem = (d: number, y: number) => {
    // the car faces +X with d growing toward -X: u along the car toward its front
    const dir = Math.sign(X(0) - X(1));
    for (const sd of [1, -1]) {
      const flip = dir * sd;
      const tris: Pt[] = [];
      for (const p of NS_LOGO) for (let i = 1; i + 1 < p.length; i++) for (const q of [p[0]!, p[i]!, p[i + 1]!]) tris.push([d + flip * q[0] * LOGO_SCALE, y + q[1] * LOGO_SCALE]);
      sideDecal(m, b, X, sd, "blue", tris, 0.005);
    }
  };
  m.scope("emblems", () => {
    if (car.end) emblem(4.95, 1.3);
    else emblem(car.length / 2, 1.3);
  });
  m.scope("roof equipment", () => {
    if (car.end) {
      // the cooling grilles in the blue roof behind the cab: one pair high behind the cap, a row of five lower on each side
      for (const sd of [1, -1]) {
        crownPane(m, b, X, sd, "grille", [0.6, 1.3], [0.35, 0.62], 0.012);
        for (let k = 0; k < 5; k++) crownPane(m, b, X, sd, "grille", [2.6 + k * 0.62, 3.05 + k * 0.62], [0.95, 1.12], 0.012);
      }
    }
  });
  if (car.end) {
    m.scope("cab door", () => {
      // the cab door over the leading bogie: its outline in the blue band, the grab rails beside it
      const [d0, d1, y0, y1, k] = [0.55, 1.55, 1.22, 3.2, 0.014];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.005, 0.02);
        sidePanel(m, b, X, sd, "steel", d0 - 0.09, d0 - 0.06, 1.55, 2.95, 0.03, 0.02);
        sidePanel(m, b, X, sd, "steel", d1 + 0.06, d1 + 0.09, 1.55, 2.95, 0.03, 0.02);
      }
    });
    m.scope("coupler", () => {
      // the Scharfenberg coupler in its recess, its head on the coupling plane 0.35 m ahead of the tip
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.3, 0.22, 0.93, 1.07, 0.1);
      out("carbon", 0.22, 0.35, 0.82, 1.18, 0.21);
    });
    m.scope("front skirt", () => {
      // the bumper's foot under the face: down to 0.25 m over the rail, rounded at its corners like the face
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const ring = (inset: number, hw: number, r: number, depth: number): Array<[number, number]> => {
        const pts: Array<[number, number]> = [];
        const xf = tip - k * inset, xb = tip - k * depth;
        for (let i = 0; i <= 4; i++) { const a = (i / 4) * (Math.PI / 2); pts.push([xf - k * (r - r * Math.cos(a)), -(hw - r + r * Math.sin(a))]); }
        pts.push([xb, -hw], [xb, hw]);
        for (let i = 4; i >= 0; i--) { const a = (i / 4) * (Math.PI / 2); pts.push([xf - k * (r - r * Math.cos(a)), hw - r + r * Math.sin(a)]); }
        return k < 0 ? pts.reverse() : pts;
      };
      m.loft("dark", ring(0.16, 1.18, 0.3, 1.9), 0.25, ring(0.06, 1.26, 0.36, 1.9), 0.62);
    });
  }
  m.scope("underfloor", () => {
    const y0 = 0.3, y1 = 0.6;
    if (car.end) { at("under", 4.2, 6.6, y0, y1, -1.05, 1.05); at("under", 7.0, 12.4, y0, y1, -1.1, 1.1); }
    else { at("under", 2.6, 6.4, y0, y1, -1.0, 1.0); at("under", 9.2, 12.9, y0, y1, -1.0, 1.0); }
  });
}

export const SLT_SERIES: ShinkansenSeries = {
  // SLT-IV 69.36 m, SLT-VI 100.54 m over the couplers (nl.wikipedia "Sprinter Lighttrain"): the difference
  // gives the intermediate car 15.59 m joint to joint and the end car 19.09 m from its coupler to the
  // joint; 2.84 m wide
  endLength: 19.09, midLength: 15.59, W: 1.42, Y: 0.74, S, C, lean: 0.965, B: 0.6, A: 0.72,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: SLT_FACE,
  // the window band's panes 1.6 - 2.64 m; doors 1.4 m wide, sill at the low floor, a narrow window in each leaf
  windows: [[1.6, 2.64]], windowW: 1.25, pitch: 1.65, door: [0.8, 3.22, 1.63, 2.78], doorW: 1.4, doorGlassW: 0.22, doorGlassPair: 0.7,
  layout: {
    // d behind the body's front end; the Woudenberg photograph's projective fit
    end: {
      doors: door(8.5),
      windows: [[2.77, 4.54], [5.07, 6.91], [10.03, 11.23], [11.66, 12.93], [13.4, 14.65], [15.05, 16.26]],
    },
    middle: {
      doors: [...door(4.78), ...door(10.81)],
      windows: [[0.55, 1.8], [2.15, 3.5], [6.05, 7.6], [7.99, 9.54], [12.09, 13.44], [13.79, 15.04]],
    },
  },
  // the cab door's narrow window
  cabWindows: [[0.9, 1.25, 2.43, 3.06]],
  sidePanels: {
    // the destination displays over the window behind a door
    end: [{ d: [11.6, 12.65], y: [2.78, 2.96], kind: "panel", mat: "black", screen: "display" }],
    middle: [{ d: [6.15, 7.5], y: [2.78, 2.96], kind: "panel", mat: "black", screen: "display" }],
  },
  // Bo'(Bo)'(2)'(2)'Bo': the end bogie 3.43 m behind the coupler (15.66 m from the joint), Jacobs bogies
  // under the joints 15.59 m apart; 850 mm wheels, 2.3 m wheelbase (the SF 6000 bogies)
  jacobs: true, bogieCentres: 15.66, wheelR: 0.425, wheelbase: 2.3,
  // one single-arm pantograph, on the second car behind its front joint (2607 at Amsterdam Amstel)
  onePantograph: true, pantographAt: 3.4,
  numberAt: [-6.95, 1.0, 0.09],
  fittings: sltFittings,
  cars: [4, 6],
  liveries: { sprinter: sltSprinter("NS Sprinter", "2463") },
  weight: { end: 40, middle: 32 }, power: 380, maxspeed: 160,
};
