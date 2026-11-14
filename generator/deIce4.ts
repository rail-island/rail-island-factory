// The ICE 4 (DB class 412/812, Siemens 2017) on the series kit (shinkansen.ts): its short, angular
// nose on a protruding bumper (the Voith GFRP front module), the raked windscreen in its black mask,
// the slanted LED lamp clusters, the red (or green) stripe that runs round the bumper and sweeps up
// the cab side to the window line, the window band in anthracite, a door at each end of every car,
// and the end car's lower roof rising to the middle cars' over its rear third. Registered in
// deUnits.ts. See docs/models/germany-trains.md and assets/db-ice4/SOURCES.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const ICE_WHITE = "#eceeee";

/** Where the cab face meets the body, behind the tip: the roof reaches its full (end car) height there. */
const DJOIN = 5.9;

/** The side stripe on every car (DB data sheet drawing, 66.5 px/m, and the Fulda photograph: 0.23 m tall, 0.28 m under the window band). */
const STRIPE: readonly [number, number] = [1.45, 1.68];
/** The window band (anthracite) and the windows in it. */
const BAND: readonly [number, number] = [1.95, 2.81];

/** The livery: white, the stripe, the anthracite window band; the stripe round the bumper and up the cab side to the "ICE" lettering. */
function ice4Livery(title: string, stripe: string, number: string): ShinkansenLivery {
  const bands: ShinkansenLivery["bands"] = [[0, STRIPE[0], "body"], [STRIPE[0], STRIPE[1], "stripe"], [STRIPE[1], 9, "body"]];
  return {
    title, number,
    palette: {
      body: c(ICE_WHITE), stripe: c(stripe), roofG: c("#dfe2e4", 0.55), skirtG: c("#9a9fa4", 0.6), cabMask: c("#17191c", 0.3),
      band: c("#33373c", 0.35), pillarG: c("#aeb3b8", 0.45), iceGrey: c("#aab0b7", 0.45), logoRed: c("#ec0016"), lampG: c("#646a71", 0.35), screen: c("#3e4a55", 0.08),
    },
    bands, doors: bands, roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the window band's pointed front under the windscreen (the cab's side window in it), back to the first passenger window
      { mat: "band", front: [[BAND[0] + 0.02, 2.8], [2.25, 2.5], [2.53, 3.3], [2.535, 4.1], [BAND[1], 4.1]], back: [[BAND[0] + 0.02, 7.6], [BAND[1], 7.6]] },
      // the end car's stripe ends ahead of the "ICE" lettering: white over it from the cab back to 7.35 m
      { mat: "body", front: [[STRIPE[0] - 0.01, -9], [STRIPE[1] + 0.01, -9]], back: [[STRIPE[0] - 0.01, 7.35], [STRIPE[1] + 0.01, 7.35]] },
      // round the bumper at 1.05 - 1.25 m, then rising along the cab side to the window line 5.8 m behind the tip
      {
        mat: "stripe", face: true,
        front: [[1.05, -9], [1.25, -9], [1.252, 1.6], [1.32, 2.6], [1.4, 3.6], [1.55, 4.6], [1.68, 5.5]],
        back: [[1.05, 1.6], [1.1, 2.5], [1.2, 3.6], [1.33, 4.6], [1.45, 5.5], [1.455, 5.8], [1.68, 5.8]],
      },
    ],
    endLettering: [{ text: "ICE", d: 0.75, y: 1.3, h: 0.55, mat: "iceGrey" }],
  };
}

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** A lamp cluster (viewer's right), leaning out toward its top, and its five grille slats. */
const CLUSTER: Pt[] = [[0.52, 1.8], [0.79, 1.8], [0.92, 2.4], [0.65, 2.4]];
const SLATS: Pt[][] = [0, 1, 2, 3, 4].map((k) => {
  const l = 0.64 + k * 0.05;
  return [[l, 2.27], [l + 0.025, 2.27], [l + 0.045, 2.37], [l + 0.02, 2.37]];
});
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** The DB logo, 0.4 by 0.19 m: its red frame and the letters D and B drawn in bars (cheaper than lettering). */
const DB_LOGO: Pt[][] = [
  box(-0.2, 0.2, 2.02, 2.04), box(-0.2, 0.2, 2.19, 2.21), box(-0.2, -0.18, 2.04, 2.19), box(0.18, 0.2, 2.04, 2.19),
  // D: its upright, top and foot, the bowl's slanted ends and its back
  box(-0.14, -0.12, 2.065, 2.165), box(-0.12, -0.05, 2.065, 2.083), box(-0.12, -0.05, 2.147, 2.165),
  [[-0.05, 2.065], [-0.032, 2.083], [-0.05, 2.083]], [[-0.05, 2.147], [-0.032, 2.147], [-0.05, 2.165]],
  box(-0.05, -0.032, 2.083, 2.147),
  // B: its upright, three bars and two bowls' backs
  box(0.02, 0.04, 2.065, 2.165), box(0.04, 0.11, 2.065, 2.083), box(0.04, 0.105, 2.106, 2.124), box(0.04, 0.105, 2.147, 2.165),
  box(0.11, 0.128, 2.083, 2.106), box(0.105, 0.123, 2.124, 2.147),
];
const PILLAR: Pt[] = [[0.6, 2.4], [0.78, 2.4], [1.05, 3.74], [0.84, 3.74]];

/**
 * The nose (the DB data sheet's side drawing at 142 px/m; photo-j40-336-bf-munchen-hbf-812.jpg and
 * photo-412-002-koln-kalk-nord-2015-11-09-01.jpg head-on): the bumper upright from 0.85 to 1.4 m, its
 * top rounding back to the face 0.45 m behind; the face raked about 45 degrees to the windscreen's foot
 * at 2.4 m, 1.4 m behind the tip; the windscreen raked about 27 degrees to 3.45 m, the roof reaching
 * the end car's 3.87 m 5.9 m behind the tip. In plan the bumper is 2.25 m wide with rounded corners;
 * the cab above it rolls into the sides in ever deeper corners.
 */
const ICE4_FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 4.2, first: 7.2, roofFrom: 3.8, cols: [6, 4, 1, 1], tolerance: 0.03,
  profile: [[0.65, 0.32], [0.72, 0.16], [0.82, 0.06], [0.95, 0.015], [1.1, 0], [1.35, 0.01], [1.5, 0.06], [1.58, 0.14], [1.63, 0.28], [1.68, 0.42], [1.85, 0.62], [2.05, 0.9], [2.25, 1.15], [2.4, 1.38], [2.55, 1.62], [2.7, 1.9], [3.0, 2.45], [3.25, 2.95], [3.45, 3.5], [3.6, 4.05], [3.72, 4.7], [3.8, 5.3], [3.87, DJOIN]],
  corner: [[0.65, 0.5], [0.95, 0.38], [1.5, 0.36], [1.7, 0.45], [2.0, 0.55], [2.4, 0.7], [3.0, 0.9], [3.45, 0.9], [3.7, 0.7], [3.87, 0.2]],
  cornerDepth: [[0.65, 0.9], [0.95, 1.2], [1.5, 1.3], [1.7, 1.4], [2.0, 1.8], [2.4, 2.3], [3.0, 2.9], [3.45, 2.0], [3.7, 1.0], [3.87, 0.4]],
  rows: [0.65, 0.72, 0.82, 0.95, 1.05, 1.1, 1.25, 1.35, 1.5, 1.58, 1.63, 1.68, 1.78, 1.85, 2.05, 2.25, 2.4, 2.55, 2.7, 3.0, 3.25, 3.45, 3.6, 3.72, 3.8, 3.87],
  bands: () => [[0, 9, "body"]],
  // (the distant model's face: the stripe round the bumper, the black mask)
  lodBands: [[0, 1.05, "body"], [1.05, 1.25, "stripe"], [1.25, 2.4, "body"], [2.4, 3.72, "cabMask"]],
  fields: [
    // the grey bands beside the windscreen's mask, widening up to the roof
    { mat: "pillarG", pts: PILLAR }, { mat: "pillarG", pts: mirror(PILLAR) },
    // the black mask, wider at its head, and the windscreen in it
    { mat: "cabMask", pts: [[-0.62, 2.4], [0.62, 2.4], [0.84, 3.74], [-0.84, 3.74]] },
    { mat: "screen", pts: [[-0.5, 2.58], [0.5, 2.58], [0.66, 3.45], [-0.66, 3.45]] },
    // the lamp clusters, leaning out toward their tops
    { mat: "lampG", pts: CLUSTER }, { mat: "lampG", pts: mirror(CLUSTER) },
    // the bumper's joint under the face
    { mat: "rubber", pts: [[-1.1, 1.69], [1.1, 1.69], [1.1, 1.715], [-1.1, 1.715]] },
  ],
  // the coupler's hatch slot in the bumper
  masks: [{ lat: [-0.06, 0.06], y: [0.7, 0.98], r: 0.02, mat: "cabMask" }],
  panes: [],
  lodGlass: { hw: 0.6, y: [2.58, 3.45] },
  decals: [...[...SLATS, ...SLATS.map(mirror)].map((pts) => ({ mat: "pillarG", pts, fine: 1 })), ...DB_LOGO.map((pts) => ({ mat: "logoRed", pts, fine: 1 }))],
  lamps: [[0.73, 2.12, 0.085, "lampHead"], [0.68, 1.93, 0.085, "lampHead"], [-0.73, 2.12, 0.085, "lampHead"], [-0.68, 1.93, 0.085, "lampHead"]],
  roofLamp: [0, 3.6, 0.05],
  // one pantograph wiper, parked along the screen's foot
  wipers: [[[0.12, 2.62], [0.55, 2.95]]],
};

/** Windows in the band: n of them w wide, `pitch` apart, the first centred at d0 (body d). */
const windowRow = (d0: number, n: number, pitch: number, w: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, k) => [d0 + k * pitch - w / 2, d0 + k * pitch + w / 2] as const);

/** The window band's spans (body d) behind the end car's first door, and along an intermediate car. */
const END_BAND: readonly [number, number] = [3.85, 19.4];
const MID_BAND: readonly [number, number] = [2.0, 24.8];

/** The anthracite window band behind the windows, the roof equipment and the underfloor. */
function ice4Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [d0, d1] = car.end ? END_BAND : MID_BAND;
  m.scope("window band", () => { for (const sd of [1, -1]) sidePanel(m, b, X, sd, "band", d0, d1, BAND[0], BAND[1], 0.003, 0.003); });
  // the pantograph car's roof line ahead of the pantograph: the main breaker's box on two insulators, the line on to the pantograph
  if (!car.end) m.scope("roof line", () => {
    const C = 4.1;
    block(m, "roofG", X(21.2), X(19.5), C - 0.05, C + 0.06, -0.45, 0.45);
    for (const d of [19.85, 20.85]) block(m, "insulator", X(d + 0.07), X(d - 0.07), C + 0.06, C + 0.3, -0.07, 0.07);
    block(m, "pantograph", X(21.0), X(19.7), C + 0.3, C + 0.42, -0.12, 0.12);
    block(m, "pantograph", X(22.75), X(21.0), C + 0.33, C + 0.37, -0.02, 0.02);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), 0.35, 0.66, -1.426 * 0.8, 1.426 * 0.8));
}

export const ICE4: ShinkansenSeries = {
  // 29.106 m end cars and 28.75 m intermediate cars over the couplers, 2.852 m wide, 4.11 m high (the end car's
  // front 3.87 m) (de.wikipedia "DB-Baureihe 412", DB Einsatzmerkblatt)
  endLength: 29.106, midLength: 28.75, W: 1.426, Y: 1.35, S: 3.3, C: 4.1, lean: 0.95, B: 0.65, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICE4_FACE,
  // the end car's roof: 3.87 m from the cab back to 11.0 m behind the join, rising to the middle cars' 4.1 m
  endCrown: [[0, 3.87], [11.0, 3.87], [11.6, 4.02], [12.2, 4.1]], endCrownStep: 1.0,
  // from the data sheet's drawing: a door at each end of every car, 1.75 m windows 2.5 m apart in the band
  layout: {
    end: { doors: [[2.05, 3.1, 1], [21.35, 22.4, -1]], windows: [[0.15, 1.6], ...windowRow(5.4, 6, 2.48, 1.75)] },
    middle: { doors: [[0.4, 1.45, 1], [26.8, 27.85, -1]], windows: windowRow(3.04, 9, 2.53, 1.75) },
  },
  windows: [[2.0, 2.76]], windowW: 1.75, pitch: 2.5, door: [0.9, 3.15, 1.95, 2.95], doorW: 1.05, doorGlassW: 0.5,
  // bogie centres 19.5 m; the trailer bogies (Bombardier FLEXX Eco: 2.3 m wheelbase, 825 mm wheels) of the end
  // and the unpowered pantograph car
  bogieCentres: 19.5, wheelR: 0.4125, wheelbase: 2.3, endBogies: [4.9 - DJOIN, 24.4 - DJOIN], midBogies: [4.3, 23.8],
  // the raised pantograph over the rear bogie (the data sheet's Mittelwagen 3812)
  pantographAt: 24.3,
  fittings: ice4Fittings,
  liveries: {
    dbIce: ice4Livery("DB ICE", "#ec0016", "412 001"),
    greenStripe: ice4Livery("Green stripe", "#3c9b38", "412 013"),
  },
  weight: { end: 55, middle: 53 }, power: 825, maxspeed: 250,
};
