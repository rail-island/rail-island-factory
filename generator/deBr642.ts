// The Desiro Classic (DB class 642, Siemens 1998 - 2008) on the series kit (shinkansen.ts): two cars
// articulated on a Jacobs bogie, each with an MTU engine under its high-floor end over the motor bogie
// and a low-floor middle (575 mm at the doors) toward the joint. The round "bubble" front: a grey cap
// rolling down from the roof to the windscreen, the black mask holding the raked windscreen and, under
// a bar, the destination display, two headlights and two tail lamps and the DB logo; the number on a
// grey strip under it, the coupler in a black recess, the grey skirt; red flanks round the corners
// carrying the light grey stripe to the recess. On the side the black window band: the cab's raked
// side window, four windows over the high floor, one double door a side, five taller windows over the
// low floor; the cooler's fairing and the exhaust on the roof behind the cab, the air conditioning
// over the low floor. Registered in deUnits.ts. See docs/models/germany-trains.md and
// assets/db-642/SOURCES.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const TRAFFIC_RED = "#ec0016";

/** Where the cab face meets the body, behind the tip; the roof still rises behind it (`endCrown`). */
const DJOIN = 2.9;
/** The coupling plane ahead of the face: the Scharfenberg head in its recess. */
const REACH = 0.35;

/** The light grey stripe at the low floor's height (Scharfenstein photograph, 146 px/m at the cab: 0.82 - 0.97 m). */
const STRIPE: readonly [number, number] = [0.82, 0.97];
/** The black window band over the high floor and the windows in it (2.05 - 3.3 m; windows 2.12 - 3.2 m). */
const HIGH_BAND: readonly [number, number] = [2.05, 3.3];
const HIGH: readonly [number, number] = [2.12, 3.2];
/** The low floor's band and its taller windows (1.28 - 3.3 m; windows 1.37 - 3.2 m). */
const LOW_BAND: readonly [number, number] = [1.28, 3.3];
const LOW: readonly [number, number] = [1.37, 3.2];

/** d behind the tip of the body's front (the cab face's join). */
const B0 = DJOIN;

/** The livery: traffic red, the light grey stripe and the grey skirt; the cab's black side band with its raked window, the lettering (Erzgebirgsbahn) behind the cab. */
function desiroLivery(title: string, number: string, lettering?: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      red: c(TRAFFIC_RED), white: c("#e2e5e7", 0.35), roofG: c("#7c8388", 0.5), skirtG: c("#666d72", 0.6), capG: c("#7c8388", 0.45),
      cabMask: c("#141618", 0.2), band: c("#1b1d20", 0.15), screen: c("#44515c", 0.06), panelGlass: c("#202428", 0.1), doorG: c("#bfc4c7", 0.35),
      recess: c("#1a1b1d", 0.7), display: c("#e7a43a", 0.3), logoRed: c("#ec0016"), logoWhite: c("#f3f3f3", 0.4), letterW: c("#f2f2f2", 0.4),
      grille: c("#4a5055", 0.6), cooler: c("#5d6469", 0.55),
    },
    bands: [[0, STRIPE[0], "skirtG"], [STRIPE[0], STRIPE[1], "white"], [STRIPE[1], 9, "red"]],
    doors: [[0, 9, "doorG"]], roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the cab's black side band: its front edge raked back with the face, parallel to the windscreen
      { mat: "band", face: true, front: [[HIGH_BAND[0], 2.0], [HIGH_BAND[1], 2.62]], back: [[HIGH_BAND[0], 10.25], [HIGH_BAND[1], 10.25]] },
      // the raked cab side window in it, its front edge along the band's, a narrow head
      { mat: "screen", face: true, front: [[2.15, 2.12], [3.14, 2.74]], back: [[2.15, 2.86], [3.14, 2.86]] },
    ],
    ...(lettering ? { endLettering: [{ text: lettering, d: 0.1, y: 1.86, h: 0.14, mat: "letterW" }] } : {}),
  };
}

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** A closed outline from a right half (foot's centre to head's centre). */
const closed = (half: Pt[]): Pt[] => [...half, ...mirror(half).slice(1, -1)];

/**
 * The black mask (head-on, right half from the foot's centre to the head's): the lower panel widening a
 * little upward, then the windscreen wrapping round the corners, its head an arc lower at the sides
 * (Annaberg and Stockheim photographs, 106 px/m head-on).
 */
function maskHalf(g: number): Pt[] {
  return [[0, 1.68 - g], [1.1 + g, 1.68 - g], [1.18 + g, 2.0], [1.21 + g, 2.47], [1.2 + g, 2.8], [1.12 + g, 3.08], [0.94 + g * 0.8, 3.28 + g * 0.7], [0.6, 3.42 + g], [0, 3.47 + g]];
}
/** The windscreen's glass inside the mask, above the bar at 2.47 - 2.53 m. */
function screenHalf(): Pt[] {
  return [[0, 2.53], [1.15, 2.53], [1.15, 2.8], [1.08, 3.06], [0.9, 3.25], [0.58, 3.38], [0, 3.42]];
}
/** The lower panel's dark glass: the display, the lamps and the logo behind it. */
const PANEL: Pt[] = [[-1.08, 1.71], [1.08, 1.71], [1.16, 2.44], [-1.16, 2.44]];

/** The DB logo, 0.3 by 0.21 m, under the display: its white ground, red frame and the letters D and B in bars. */
const LOGO: readonly [number, number] = [0, 1.79];
const DB_LOGO: Pt[][] = [
  box(-0.15, 0.15, 0, 0.018), box(-0.15, 0.15, 0.192, 0.21), box(-0.15, -0.132, 0.018, 0.192), box(0.132, 0.15, 0.018, 0.192),
  box(-0.1, -0.082, 0.045, 0.165), box(-0.082, -0.03, 0.045, 0.063), box(-0.082, -0.03, 0.147, 0.165), box(-0.03, -0.012, 0.063, 0.147),
  box(0.012, 0.03, 0.045, 0.165), box(0.03, 0.085, 0.045, 0.063), box(0.03, 0.08, 0.096, 0.114), box(0.03, 0.085, 0.147, 0.165),
  box(0.085, 0.103, 0.063, 0.096), box(0.08, 0.098, 0.114, 0.147),
].map((pts) => pts.map(([l, y]): Pt => [l + LOGO[0], y + LOGO[1]]));

/**
 * The face (Augsburg, Scharfenstein, Annaberg and Stockheim photographs; 41.7 m over the couplers): the
 * skirt rounding under from 0.38 m; the face upright from the recess (0.75 - 1.55 m) to the bar at 2.5 m;
 * the windscreen raked about 40 degrees to its head at 3.42 m, 0.75 m behind the tip; the grey cap rolling
 * back to the crown, which reaches the body's 3.85 m about 3.5 m behind the tip. In plan a broad front
 * bowed a little, with deep round corners (the stripe turns the corner 1.1 m behind the tip, the
 * windscreen wraps round them).
 */
const DESIRO_FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 2.75, reach: REACH, first: 10.62, roofFrom: 3.44, cols: [5, 4, 1, 1], tolerance: 0.035,
  profile: [[0.3, 0.3], [0.38, 0.15], [0.5, 0.06], [0.68, 0.02], [0.82, 0], [1.62, 0], [1.68, 0.04], [1.74, 0.11], [2.0, 0.17], [2.47, 0.3], [2.53, 0.33], [2.8, 0.5], [3.1, 0.72], [3.3, 0.9], [3.44, 1.05], [3.54, 1.25], [3.62, 1.55], [3.68, 1.9], [3.72, 2.3], [3.76, DJOIN]],
  corner: [[0.3, 0.6], [0.82, 0.6], [1.62, 0.62], [2.0, 0.7], [2.5, 0.8], [3.0, 0.95], [3.44, 1.05], [3.62, 0.95], [3.72, 0.6], [3.76, 0.3]],
  cornerDepth: [[0.3, 1.0], [0.82, 1.05], [1.62, 1.1], [2.0, 1.3], [2.5, 1.5], [3.0, 1.65], [3.44, 1.65], [3.62, 1.2], [3.72, 0.6], [3.76, 0.3]],
  bulge: 0.1,
  rows: [0.3, 0.38, 0.5, 0.68, 0.82, 0.97, 1.0, 1.62, 1.68, 1.74, 2.0, 2.47, 2.53, 2.8, 3.1, 3.3, 3.44, 3.54, 3.62, 3.68, 3.72, 3.76],
  bands: (l) => l.bands,
  // (the distant model's face: the black mask between the red flanks)
  lodBands: [[0, 0.82, "skirtG"], [0.82, 1.55, "recess"], [1.55, 1.68, "skirtG"], [1.68, 3.44, "cabMask"]],
  paint: [
    // the cap's grey carried back over the cab sides, its edge rising from the windscreen's head to the shoulder
    { mat: "roofG", front: [[3.42, -9], [3.6, -9]], back: [[3.42, 1.2], [3.5, 2.4], [3.56, 3.0], [3.6, 3.5]], top: 3.6 },
  ],
  fields: [
    // the coupler's black recess and the number's grey strip over it
    { mat: "recess", pts: [[-0.8, 0.8], [0.8, 0.8], [0.88, 1.55], [-0.88, 1.55]] },
    { mat: "skirtG", pts: box(-1.06, 1.06, 1.55, 1.68) },
    // the mask, the windscreen and the lower panel's glass
    { mat: "cabMask", pts: closed(maskHalf(0)) },
    { mat: "screen", pts: closed(screenHalf()) },
    { mat: "panelGlass", pts: PANEL },
    // the destination display
    { mat: "recess", pts: box(-0.6, 0.6, 2.06, 2.34) },
    { mat: "logoWhite", pts: box(LOGO[0] - 0.15, LOGO[0] + 0.15, LOGO[1], LOGO[1] + 0.21) },
    // the roof lamp's housing on the cap
    { mat: "cabMask", pts: box(-0.2, 0.2, 3.57, 3.7) },
    { mat: "frameSilver", pts: box(-0.16, 0.16, 3.6, 3.67) },
  ],
  panes: [],
  lodGlass: { hw: 1.1, y: [2.53, 3.4] },
  decals: DB_LOGO.map((pts) => ({ mat: "logoRed", pts, fine: 1 })),
  texts: [{ text: "RB 73", lat: 0, y: 2.14, h: 0.1, mat: "display" }],
  // the headlights outside, the tail lamps inside them, low in the panel
  lamps: [[-0.9, 1.88, 0.07, "lampHead"], [0.9, 1.88, 0.07, "lampHead"], [-0.72, 1.88, 0.05, "lampRed"], [0.72, 1.88, 0.05, "lampRed"]],
  roofLamp: [0, 3.635, 0.045],
  number: { lat: -0.32, y: 1.585, h: 0.07, mat: "logoWhite" },
  // two wipers parked leaning right from pivots on the bar
  wipers: [[[-0.5, 2.56], [0.0, 3.22]], [[0.05, 2.56], [0.45, 3.24]]],
};

/** Windows from d0 to d1 (body d), n of them, `post` between them. */
const paneRow = (d0: number, d1: number, n: number, post: number): Array<readonly [number, number]> => {
  const w = (d1 - d0 - (n - 1) * post) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * (w + post), d0 + i * (w + post) + w] as const);
};

/** The door (tip d 10.62 - 12.0), the windows over the high floor and over the low floor (body d). */
const DOOR: readonly [number, number] = [10.62 - B0, 12.0 - B0];
const HIGH_WINDOWS = [...paneRow(4.6 - B0, 8.8 - B0, 3, 0.2), [9.05 - B0, 10.05 - B0] as const];
const LOW_WINDOWS = [...paneRow(12.5 - B0, 18.3 - B0, 4, 0.2), [18.5 - B0, 19.4 - B0] as const];
/** The cab's tall narrow side window behind the raked one (tip d 3.06 - 3.56). */
const CAB_WINDOW: readonly [number, number, number, number] = [3.06 - B0, 3.56 - B0, 2.15, 3.14];

/** The window bands, the roof's cooler fairing, exhaust and air conditioning, the skirt's grille and the underfloor engine. */
function desiroFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  m.scope("window band", () => {
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "band", DOOR[1] + 0.4, Math.min(L - 0.65, 19.6 - B0), LOW_BAND[0], LOW_BAND[1], 0.003, 0.003);
    }
  });
  // the high band behind the cab is the livery's sweep (it starts on the face's cab sides)
  const C = 3.85;
  m.scope("cooler", () => {
    // the cooler's long low fairing behind the cab (tip d 3.9 - 8.1), its grilles on top
    const [d0, d1] = [3.9 - B0, 8.1 - B0];
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "cooler", [d0, d1], [0, 0.78], 0.006);
    block(m, "cooler", Math.min(X(d0 + 0.25), X(d1 - 0.25)), Math.max(X(d0 + 0.25), X(d1 - 0.25)), C - 0.04, C + 0.12, -0.72, 0.72);
    for (let k = 0; k < 4; k++) {
      const a = d0 + 0.6 + k * 0.85;
      block(m, "grille", Math.min(X(a), X(a + 0.6)), Math.max(X(a), X(a + 0.6)), C + 0.12, C + 0.13, -0.6, 0.6);
    }
  });
  m.scope("air conditioning", () => {
    // over the low floor (tip d 13.0 - 16.5)
    const [d0, d1] = [13.0 - B0, 16.5 - B0];
    block(m, "roofG", Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C - 0.04, C + 0.16, -0.75, 0.75);
    block(m, "grille", Math.min(X(d0 + 0.4), X(d0 + 1.4)), Math.max(X(d0 + 0.4), X(d0 + 1.4)), C + 0.16, C + 0.17, -0.55, 0.55);
  });
  m.scope("door foot", () => {
    // the door leaves reach down past the stripe to the step at 0.5 m (the kit's leaves stand on the skirt's top)
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "doorG", DOOR[0], DOOR[1], 0.5, 0.835, 0.009, 0.01);
      sidePanel(m, b, X, sd, "recess", (DOOR[0] + DOOR[1]) / 2 - 0.008, (DOOR[0] + DOOR[1]) / 2 + 0.008, 0.5, 0.835, 0.013, 0.004);
    }
  });
  m.scope("skirt grille", () => {
    // the engine's air intake on the skirt ahead of the door (tip d 8.0 - 9.5)
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "grille", 8.0 - B0, 9.5 - B0, 0.45, 0.76, 0.004, 0.02);
      for (let k = 1; k < 6; k++) {
        const y = 0.45 + (0.31 * k) / 6;
        sidePanel(m, b, X, sd, "recess", 8.05 - B0, 9.45 - B0, y - 0.008, y + 0.008, 0.008, 0.004);
      }
    }
  });
  if (car.end) m.scope("coupler", () => {
    // the Scharfenberg coupler in the face's recess: its shaft and head reaching to the coupling plane
    const [a, e] = [X(-B0 - REACH + 0.08), X(-B0 + 0.1)];
    block(m, "recess", Math.min(a, e), Math.max(a, e), 0.97, 1.07, -0.07, 0.07);
    const [h0, h1] = [X(-B0 - REACH), X(-B0 - REACH + 0.18)];
    block(m, "grille", Math.min(h0, h1), Math.max(h0, h1), 0.86, 1.18, -0.2, 0.2);
  });
  m.scope("underfloor", () => {
    // the engine and gearbox under the high floor, behind the motor bogie
    block(m, "under", X(car.trucks[0]! + 1.7), X(DOOR[0] - 0.3), 0.3, 0.42, -1.0, 1.0);
  });
}

export const BR642: ShinkansenSeries = {
  // 41.7 m over the couplers, 2.83 m wide (de.wikipedia "DB-Baureihe 642"); 3.85 m high; two cars of 20.85 m to the joint
  endLength: 20.85, midLength: 20.85, W: 1.415, Y: 1.0, S: 3.55, C: 3.85, lean: 1.0, B: 0.3, A: STRIPE[0],
  // the skirt drawn in under the stripe
  tiltSection: { wa: 0.985, wl: 0.9 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DESIRO_FACE,
  // the crown rising from the face's 3.76 m to the body's 3.85 m
  endCrown: [[0, 3.76], [0.6, 3.82], [1.3, 3.85]],
  cabWindows: [CAB_WINDOW],
  layout: {
    end: { doors: [[DOOR[0], DOOR[1], 1]], windows: [], rows: [LOW_WINDOWS, HIGH_WINDOWS] },
    middle: { doors: [[DOOR[0], DOOR[1], 1]], windows: [], rows: [LOW_WINDOWS, HIGH_WINDOWS] },
  },
  windows: [LOW, HIGH], windowW: 1.25, pitch: 1.45, door: [0.83, 3.15, 1.15, 2.95], doorW: 1.38, doorGlassW: 0.36, doorGlassPair: 0.66,
  // B'2'B': the motor bogie 4.7 m behind the tip, the Jacobs bogie under the joint 15.8 m behind it; 0.77 m wheels
  bogieCentres: 15.8, wheelR: 0.385, wheelbase: 2.3, jacobsInset: 2.0, endBogies: [4.7 - B0, 20.85 - 0.25 - REACH - B0 - 2.0],
  traction: "diesel", cars: [2], exhaustAt: 5.9,
  fittings: desiroFittings,
  liveries: {
    dbRegio: desiroLivery("DB Regio", "642 620"),
    // the Erzgebirgsbahn's units are DB Regio's traffic red with its name behind the cab
    erzgebirgsbahn: desiroLivery("Erzgebirgsbahn", "642 055", "ERZGEBIRGSBAHN"),
  },
  weight: { end: 34, middle: 34 }, power: 275, maxspeed: 120,
};
