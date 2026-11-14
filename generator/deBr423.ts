// The DB class 423 S-Bahn unit (Munich, Stuttgart, Frankfurt, Cologne), drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): four aluminium cars on five bogies
// (Bo'(Bo')(2')(Bo')Bo', Jacobs bogies under the joints), three double plug doors a side on every car,
// the blunt front with the big grey mask round the windscreen and the destination display, the two oval
// lamps low on the corners and the third on the grey cab roof, the single pantograph on one
// intermediate car. Matched to the works drawing and the photographs in assets/db-423/ (SOURCES.md).
// See docs/models/germany-trains.md.
//
// Heights over the rail; d behind the face's tip (the bumper's front 1.33 m up) on the face, else d
// behind the body's front end (the face's join on the end car, the joint's gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const TRAFFIC_RED = "#ec0016";

/** Where the face meets the body: the crown reaches full height 1.4 m behind the tip (the works drawing). */
const JOIN = 1.4;
/** The crown, over the rail (the drawing: 3.79 m; 4.295 m over the air-conditioning units). */
const C = 3.79;

/**
 * The face's centre line (the works drawing at 15.04 px/m): the dark foot 0.22 m back at 0.78 m, the
 * bumper's front at 1.33 m, then the face leaning back about 20 degrees past the lamps and the
 * windscreen to the display's head, rounding over into the roof 1.4 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.78, 0.22], [0.95, 0.12], [1.1, 0.05], [1.22, 0.02], [1.33, 0], [1.5, 0.04], [1.66, 0.09], [1.86, 0.15], [2.1, 0.21], [2.4, 0.3],
  [2.7, 0.4], [3.0, 0.53], [3.2, 0.62], [3.4, 0.71], [3.55, 0.8], [3.66, 0.92], [3.74, 1.06], [3.78, 1.22], [C, JOIN],
];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.3, 1.42, 1.55, 1.6, 1.7, 2.08, 2.13, 2.6, 3.16, 3.46, 3.5])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The DB logo under the mask, 0.42 by 0.28 m round (0, 1.46): its red frame and the letters D and B in bars. */
const LOGO_Y = 1.46;
const logo = (pts: Pt[]): Pt[] => pts.map(([l, y]): Pt => [l * 1.05, LOGO_Y + (y - 2.115) * 1.5]);
const DB_LOGO: Pt[][] = ([
  box(-0.2, 0.2, 2.02, 2.035), box(-0.2, 0.2, 2.195, 2.21), box(-0.2, -0.185, 2.035, 2.195), box(0.185, 0.2, 2.035, 2.195),
  box(-0.14, -0.12, 2.065, 2.165), box(-0.12, -0.05, 2.065, 2.083), box(-0.12, -0.05, 2.147, 2.165),
  [[-0.05, 2.065], [-0.032, 2.083], [-0.05, 2.083]], [[-0.05, 2.147], [-0.032, 2.147], [-0.05, 2.165]],
  box(-0.05, -0.032, 2.083, 2.147),
  box(0.02, 0.04, 2.065, 2.165), box(0.04, 0.11, 2.065, 2.083), box(0.04, 0.105, 2.106, 2.124), box(0.04, 0.105, 2.147, 2.165),
  box(0.11, 0.128, 2.083, 2.106), box(0.105, 0.123, 2.124, 2.147),
] as Pt[][]).map(logo);

export const BR423_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.0, reach: 0.3, first: 3.9, roofFrom: 3.785, bulge: 0.06, tolerance: 0.02,
  profile: PROFILE,
  // the drawing's plan: the front nearly flat over 2 m, its corners rounding back 0.8 m into the sides
  corner: [[0.78, 0.5], [1.33, 0.55], [3.2, 0.55], [3.6, 0.45], [C, 0.2]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.05, 0.8))]),
  rows: ROWS,
  // red over the light grey bumper band and the dark foot; the grey mask, the glass and the fittings below
  bands: () => [[0, 0.95, "dark"], [0.95, 1.22, "lightG"], [1.22, 9, "red"]],
  lodBands: [[0, 0.95, "dark"], [0.95, 1.22, "lightG"], [1.22, 1.66, "red"], [1.66, 9, "cabMask"]],
  lodGlass: { hw: 0.9, y: [2.13, 3.46] },
  fields: [
    // the coupler's recess in the bumper, and the logo's white ground
    { mat: "black", pts: box(-0.85, 0.85, 0.78, 1.3) },
    { mat: "white", pts: box(-0.215, 0.215, LOGO_Y - 0.14, LOGO_Y + 0.14) },
  ],
  masks: [
    // the big grey mask: from just above the lamps up over the face's top onto the cab roof
    { lat: [-1.02, 1.02], y: [1.66, 4.4], r: 0.18, mat: "cabMask" },
    // the windscreen's black surround, holding the destination display over the glass
    { lat: [-0.93, 0.93], y: [2.08, 3.5], r: 0.08, mat: "black" },
  ],
  panes: [{ lat: [-0.88, 0.88], y: [2.13, 3.16], r: 0.05 }, { lat: [-0.86, 0.86], y: [3.2, 3.46], r: 0.03, mat: "display" }],
  decals: DB_LOGO.map((pts) => ({ mat: "red", pts, fine: 1 })),
  // the oval lamps on the corners, the headlight inside and the tail light outside
  pods: [1, -1].map((sd) => ({ lat: sd * 1.1, y: 1.55, w: 0.4, h: 0.28, r: 0.14, proud: 0.015, depth: 0.04, mat: "black", lamps: [[-sd * 0.06, 0.1, "lampHead"], [sd * 0.11, 0.055, "lampRed"]] as const })),
  // the third headlight on the grey cab roof over the display
  lamps: [[0, 3.62, 0.065, "lampHead"]],
  texts: [{ text: "423 449-8", lat: -0.45, y: 1.8, h: 0.085, mat: "white" }],
  wipers: [[[0.05, 2.15], [0.68, 2.95]]],
};

/** The S-Bahn paint: traffic red over a light grey band at the floor and a dark grey foot, a light grey line under the roof's edge, light grey doors. */
function sBahn(title: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      red: c(TRAFFIC_RED), roofR: c("#d8101e", 0.55), lightG: c("#d9dcdc", 0.4), dark: c("#4a4e52", 0.6), cabMask: c("#5a5f64", 0.4),
      black: c("#141618", 0.3), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true }, white: c("#f4f4f2"), yellow: c("#f2c300", 0.45),
      acGrey: c("#8d9296", 0.55), grille: c("#2e3134", 0.7),
    },
    bands: [[0, 0.95, "dark"], [0.95, 1.22, "lightG"], [1.22, 3.14, "red"], [3.14, 3.22, "lightG"], [3.22, 9, "red"]],
    doors: [[0, 9, "lightG"]],
    roof: "roofR", skirt: "dark",
    // the first-class mark: the roof line yellow over the first window behind the cab
    endSweeps: [{ mat: "yellow", front: [[3.14, 2.55], [3.22, 2.55]], back: [[3.14, 4.0], [3.22, 4.0]] }],
  };
}

/** Body spans [d0, d1] of a double plug door centred at d, its two 0.75 m leaves parting. */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.75, d, -1], [d, d + 0.75, 1]];

/** The roof, the cab door, the coupler and the underfloor of a car. */
function br423Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  // an air-conditioning unit on the crown: a grey box with two grilles on each side
  const ac = (d0: number, d1: number) => m.scope("air conditioning", () => {
    at("acGrey", d0, d1, C - 0.06, C + 0.48, 0.78);
    const w = (d1 - d0) / 2;
    for (const k of [0, 1]) for (const sd of [1, -1]) {
      const [a, e] = [d0 + k * w + 0.12, d0 + (k + 1) * w - 0.12];
      block(m, "grille", Math.min(X(a), X(e)), Math.max(X(a), X(e)), C + 0.08, C + 0.4, sd > 0 ? 0.78 : -0.79, sd > 0 ? 0.79 : -0.78);
    }
  });
  m.scope("roof equipment", () => {
    if (car.end) {
      // the grey cap over the cab (the third lamp's housing at its front), then the cooling unit
      m.scope("cab cap", () => at("cabMask", -0.1, 2.0, C - 0.05, C + 0.12, 0.66));
      ac(2.95, 6.9);
    } else ac(car.length / 2 - 2.0, car.length / 2 + 2.0);
  });
  if (car.end) {
    m.scope("cab door", () => {
      // the red cab door behind the face, its narrow window drawn with the cab windows
      const [d0, d1, y0, y1, k] = [0.05, 1.0, 1.0, 3.12, 0.02];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.005, 0.02);
      }
    });
    m.scope("coupler", () => {
      // the Scharfenberg coupler in its recess, its head on the coupling plane 0.3 m ahead of the tip
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.3, 0.2, 0.93, 1.07, 0.1);
      out("carbon", 0.2, 0.3, 0.86, 1.14, 0.19);
    });
  }
  m.scope("underfloor", () => {
    const y0 = 0.32, y1 = 0.8;
    if (car.end) { at("under", 3.9, 5.9, y0, y1, 1.1); at("under", 6.2, 11.3, y0, y1, 1.15); }
    else { at("under", 2.8, 4.0, 0.45, y1, 0.3); at("under", 6.2, 8.2, y0, y1, 1.1); at("under", 8.5, 10.4, y0, y1, 1.1); }
  });
}

export const BR423: ShinkansenSeries = {
  // 67.4 m over the couplers: end cars 18.24 m from the coupler to the joint, intermediate cars 15.46 m
  // joint to joint; 3.02 m wide (de.wikipedia "DB-Baureihe 423", the works drawing)
  endLength: 18.24, midLength: 15.46, W: 1.51, Y: 1.25, S: 3.22, C, lean: 0.985, B: 0.78, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BR423_FACE,
  // the drawing's window band 1.8 - 2.88 m; double plug doors 1.5 m wide (1.3 m opening), a narrow window in each leaf
  windows: [[1.8, 2.88]], windowW: 1.28, pitch: 1.6, door: [0.97, 3.14, 1.82, 2.88], doorW: 1.5, doorGlassW: 0.42,
  layout: {
    // d behind the body's front end; the works drawing's positions
    end: {
      doors: [...door(3.52), ...door(8.82), ...door(13.79)],
      windows: [[1.23, 2.49], [4.55, 5.88], [6.48, 7.81], [9.87, 11.13], [11.45, 12.77], [14.86, 16.05]],
    },
    middle: {
      doors: [...door(2.52), ...door(7.48), ...door(12.44)],
      windows: [[0.2, 1.45], [3.55, 4.83], [5.15, 6.43], [8.53, 9.81], [10.13, 11.41], [13.51, 14.76]],
    },
  },
  // the cab door's narrow window
  cabWindows: [[0.15, 0.55, 2.05, 3.0]],
  // Bo'(Bo')(2')(Bo')Bo': the end bogie 3.1 m behind the coupler (15.14 m from the joint), Jacobs bogies
  // under the joints 15.46 m apart; 850 mm wheels, the end bogies' 2.2 m wheelbase
  jacobs: true, bogieCentres: 15.14, wheelR: 0.425, wheelbase: 2.2,
  // one single-arm pantograph, on the second car next to the middle joint
  onePantograph: true, pantographAt: 13.3,
  lodRoof: { d: [JOIN + 2.95, JOIN + 6.9], hw: 0.78, y: [C - 0.05, C + 0.48], mat: "acGrey" },
  fittings: br423Fittings,
  cars: [4],
  liveries: { sBahn: sBahn("S-Bahn", "423 449-8") },
  weight: { end: 31, middle: 28 }, power: 590, maxspeed: 140,
};
