// The Vande Bharat Express (ICF Chennai's Train 18) on the series kit (shinkansen.ts):
// its cab face (seriesCab.ts) measured from the photographs in assets/ir-vande-bharat/,
// the white-and-blue and the saffron-and-grey liveries, the cars' window bands and the
// plug doors at both ends of every car, the underslung equipment. See
// docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/**
 * The nose's centre line, [y, d behind the tip] (photo-vb-express-in-lonavala.jpg nearly side-on,
 * about 97 px/m along the nose and 131 px/m in height): the bulbous coupler cover is the tip,
 * upright from 1.1 to 1.75 m and rounding under; above its top at 2.0 m the face steps back to
 * the emblem plate, then the windscreen rakes back about 58 degrees from 2.4 m (1.0 m behind
 * the tip) to 3.55 m (3.0 m behind); the destination display over it and the head lamp's dome,
 * the roof at full height 4.6 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.85, 0.55], [0.95, 0.3], [1.1, 0.1], [1.3, 0.02], [1.5, 0], [1.75, 0.04], [1.9, 0.12], [2.0, 0.24], [2.05, 0.42],
  [2.15, 0.52], [2.3, 0.72], [2.4, 0.9], [2.7, 1.42], [3.0, 1.95], [3.3, 2.5], [3.55, 2.98], [3.7, 3.3], [3.82, 3.62],
  [3.92, 3.95], [3.98, 4.3], [4.0, 4.6],
];

/** d behind the tip of a paint edge running beside the centre line, `off` behind it (by height). */
const along = (off: (y: number) => number, y0: number, y1: number): Pt[] =>
  PROFILE.filter(([y]) => y >= y0 && y <= y1).map(([y, d]): Pt => [y, d + off(y)]);

/**
 * The swoosh (blue, or saffron): the face's corners from the bottom up beside the windscreen to the
 * roof's edge, about 0.75 m wide along the car (the Lonavala photo), the white face's edge just
 * outside the windscreen's black surround (photo-vande-bharat-express-around-mumbai.jpg head on).
 */
const SWOOSH_FRONT = (y0: number): Pt[] => along((y) => (y < 2.0 ? 0.27 : y < 2.4 ? 0.27 + (y - 2.0) * 0.7 : 0.55), y0, 4.0);
const SWOOSH_BACK = (y0: number): Pt[] => along((y) => (y < 2.0 ? 1.4 : y < 2.4 ? 1.4 - (y - 2.0) * 0.6 : 1.16), y0, 4.0);

/** The cab's side window behind the swoosh: its front edge raked like it, the rear upright (the Lonavala photo). */
const CAB_WINDOW = { mat: "cabGlass", front: [[2.32, 3.05], [3.2, 4.35]] as Pt[], back: [[2.32, 5.0], [3.2, 5.0]] as Pt[] };

/**
 * The face (the photographs head on and three-quarter): the white coupler cover with its centre
 * seam under a raised emblem plate; the lamp slots slanting up and out at its shoulders, two lamps
 * in each; the large windscreen, 2.45 m wide, in a black surround that runs up round the
 * destination display to the head lamp's dome; in plan the cover 2.1 m wide, the corners receding
 * 1.3 m behind it, the face nearly the body's width at the windscreen.
 */
const VB_FACE: SeriesCabFace = {
  dJoin: 4.6, dSide: 3.4, first: 9.0, roofFrom: 9, reach: 0.07, bulge: [[0.85, 0.22], [1.9, 0.22], [2.1, 0.12], [4.0, 0.1]], cols: [8, 5, 1, 2], tolerance: 0.02,
  profile: PROFILE,
  corner: [[0.85, 0.7], [1.9, 0.6], [2.1, 0.5], [2.5, 0.4], [3.5, 0.4], [3.85, 0.3], [4.0, 0.08]],
  cornerDepth: [[0.85, 1.2], [1.9, 1.3], [2.1, 1.0], [2.5, 0.8], [3.5, 0.8], [3.85, 0.6], [4.0, 0.15]],
  rows: [0.85, 0.95, 1.1, 1.3, 1.5, 1.75, 1.86, 2.0, 2.05, 2.15, 2.36, 2.7, 3.0, 3.3, 3.55, 3.7, 3.82, 3.9, 3.98, 4.0],
  // the surround and glass, the display, the lamp slots
  fields: [
    { mat: "black", pts: [[-1.28, 2.36], [1.28, 2.36], [1.28, 3.9], [-1.28, 3.9]] },
    { mat: "black", pts: [[0.98, 1.84], [1.15, 1.8], [1.47, 2.48], [1.34, 2.56]] },
    { mat: "black", pts: [[-0.98, 1.84], [-1.34, 2.56], [-1.47, 2.48], [-1.15, 1.8]] },
  ],
  masks: [
    { lat: [-0.56, 0.56], y: [3.63, 3.78], r: 0.02, mat: "display" },
    // the marker lamps either side of the display, the destination's lit letters
    { lat: [-0.88, -0.78], y: [3.66, 3.75], r: 0.04, mat: "lampHead" }, { lat: [0.78, 0.88], y: [3.66, 3.75], r: 0.04, mat: "lampHead" },
    { lat: [-0.42, 0.42], y: [3.68, 3.73], r: 0, mat: "amber" },
    // the head lamp's lens on the dome
    { lat: [-0.3, 0.3], y: [3.9, 3.975], r: 0.03, mat: "lampHead" },
  ],
  panes: [{ lat: [-1.17, 1.17], y: [2.44, 3.52], r: 0.08 }],
  decals: [
    // the coupler cover's centre seam
    { mat: "rubber", pts: [[-0.012, 0.95], [0.012, 0.95], [0.012, 1.95], [-0.012, 1.95]], fine: 2 },
    // the IR emblem on the plate
    { mat: "emblemRed", pts: [[-0.45, 2.08], [-0.39, 2.1], [-0.37, 2.16], [-0.39, 2.22], [-0.45, 2.24], [-0.51, 2.22], [-0.53, 2.16], [-0.51, 2.1]], fine: 2 },
    { mat: "emblemGold", pts: [[-0.45, 2.11], [-0.41, 2.12], [-0.4, 2.16], [-0.41, 2.2], [-0.45, 2.21], [-0.49, 2.2], [-0.5, 2.16], [-0.49, 2.12]], fine: 2 },
  ],
  pods: [{ lat: 0, y: 2.16, w: 2.0, h: 0.28, r: 0.05, proud: 0.03, depth: 0.12, mat: "plate" }],
  lamps: [
    [1.15, 2.02, 0.05, "lampRed"], [1.28, 2.28, 0.06, "lampHead"], [-1.15, 2.02, 0.05, "lampRed"], [-1.28, 2.28, 0.06, "lampHead"],
  ],
  wipers: [[[-0.95, 2.5], [-0.82, 3.2]], [[0.2, 2.5], [0.72, 3.2]]],
};

/** Window panes from d0 to d1 (body d), about `pitch` apart, thin pillars between them. */
const panes = (d0: number, d1: number, pitch: number): Array<readonly [number, number]> => {
  const n = Math.max(1, Math.round((d1 - d0) / pitch)), w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w + (i ? 0.05 : 0), d0 + (i + 1) * w - (i < n - 1 ? 0.05 : 0)] as const);
};

/**
 * The cars' sides (photo-vande-bharat-express-around-mumbai.jpg, photo-vande-bharat-express-coaches.jpg):
 * a plug door near each end of every car; on the end car the crew door behind the cab's side window,
 * a narrow window, then the first passenger door 9 m behind the tip; the big panes, about 1.45 m
 * apart, run from door to door. Body d (the end car's body starts 4.6 m behind its tip).
 */
const LAYOUT: { end: SeriesLayout; middle: SeriesLayout } = {
  end: { doors: [[4.4, 5.35, -1], [17.0, 17.95, 1]], windows: panes(5.7, 16.65, 1.45) },
  middle: { doors: [[0.3, 1.25, -1], [21.25, 22.2, 1]], windows: panes(1.6, 20.9, 1.45) },
};

/** Low and wide underslung equipment between the bogies, the deflector under the nose, two air-conditioning units on the roof. */
function vbFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  const [a, e] = [t0 + 2.2, t1 - 2.2];
  m.scope("underfloor", () => {
    const n = 4, w = (e - a) / n;
    for (let i = 0; i < n; i++) {
      const [d0, d1] = [a + i * w + 0.08, a + (i + 1) * w - 0.08];
      const lo = i % 2 ? 0.42 : 0.5;
      block(m, "under", X(d1), X(d0), lo, VB.B + 0.02, -1.3, 1.3);
    }
  });
  m.scope("roof units", () => {
    for (const [d0, d1] of [[1.2, 3.8], [car.length - 3.8, car.length - 1.2]] as const)
      block(m, "acUnit", X(d1), X(d0), VB.C - 0.12, VB.C + 0.14, -0.75, 0.75);
  });
  if (!car.end) return;
  const dj = VB_FACE.dJoin;
  m.scope("deflector", () => {
    block(m, "deflector", X(0.95 - dj), X(0.35 - dj), 0.34, 0.86, -1.0, 1.0);
    for (const sd of [1, -1]) block(m, "deflSide", X(1.6 - dj), X(0.95 - dj), 0.45, 0.86, sd > 0 ? 1.0 : -1.38, sd > 0 ? 1.38 : -1.0);
  });
}

const BLUE = "#1d3a8a";
const SAFFRON = "#f26b1d";
const GREY = "#3d4246";

const WHITE_BLUE: ShinkansenLivery = {
  title: "White and blue", number: "22436",
  palette: {
    white: c("#f1f1ee"), blue: c(BLUE), roofW: c("#dcdedf", 0.55), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3),
    black: c("#15171a", 0.3), display: c("#26282b", 0.3), amber: c("#f2a03a", 0.4), plate: c("#f1f1ee"), emblemRed: c("#c8312b"), emblemGold: c("#e8b830"),
    deflector: c("#ecece8"), deflSide: c(BLUE), acUnit: c("#c9ccce", 0.6),
  },
  // a thin blue line under the windows, the blue band along the roof's edges
  bands: [[0, 1.68, "white"], [1.68, 1.78, "blue"], [1.78, 3.36, "white"], [3.36, 9, "blue"]],
  front: [[0, 9, "white"]],
  doors: [[0, 9, "blue"]],
  roof: "blue", skirt: "skirtG", roofStripe: { z: 1.05, mat: "roofW" },
  endSweeps: [
    { mat: "blue", front: SWOOSH_FRONT(0.85), back: SWOOSH_BACK(0.85), top: 3.95, face: true },
    CAB_WINDOW,
  ],
};

const SAFFRON_GREY: ShinkansenLivery = {
  title: "Saffron, grey", number: "20901",
  palette: {
    orange: c(SAFFRON), grey: c(GREY, 0.5), roofG: c("#b9bcbe", 0.55), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3),
    black: c("#15171a", 0.3), display: c("#26282b", 0.3), amber: c("#f2a03a", 0.4), plate: c(GREY, 0.5), emblemRed: c("#c8312b"), emblemGold: c("#e8b830"),
    deflector: c("#8d9296", 0.5), deflSide: c(GREY, 0.5), acUnit: c("#9a9ea1", 0.6),
  },
  // grey sides, a saffron stripe under the windows, saffron above them to the roof
  bands: [[0, 1.68, "grey"], [1.68, 1.86, "orange"], [1.86, 3.2, "grey"], [3.2, 9, "orange"]],
  // the face saffron, a grey band across it at the lamps
  front: [[0, 1.86, "orange"], [1.86, 2.36, "grey"], [2.36, 3.9, "orange"], [3.9, 9, "roofG"]],
  doors: [[0, 9, "orange"]],
  roof: "orange", skirt: "skirtG", roofStripe: { z: 1.05, mat: "roofG" },
  endSweeps: [
    // the saffron of the nose's bottom running back along the cab's lower side
    { mat: "orange", front: [[1.0, -9], [1.86, -9]], back: [[1.0, 3.4], [1.4, 2.9], [1.86, 2.0]] },
    { mat: "orange", front: SWOOSH_FRONT(2.36), back: SWOOSH_BACK(2.36), top: 3.95, face: true },
    CAB_WINDOW,
  ],
};

export const VANDE_BHARAT: ShinkansenSeries = {
  // 23 m cars, 3.24 m wide, 4.0 m high
  endLength: 23.0, midLength: 23.0, W: 1.62, Y: 1.35, S: 3.45, C: 4.0, lean: 0.95, B: 0.85, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: VB_FACE,
  // big panes 2.0 - 3.0 m; single-leaf plug doors with a narrow window high in the leaf
  windows: [[2.0, 3.0]], windowW: 1.35, pitch: 1.45, door: [1.2, 3.15, 2.05, 2.95], doorW: 0.95, doorGlassW: 0.26,
  layout: LAYOUT,
  // the crew door with its louvre and window, the narrow window behind it (d from the tip)
  sidePanels: {
    end: [
      { d: [5.75, 6.45], y: [1.2, 3.2], kind: "seam" }, { d: [5.88, 6.32], y: [2.05, 2.85], kind: "window" }, { d: [5.88, 6.32], y: [2.92, 3.12], kind: "louvres", louvres: 4 },
      { d: [7.8, 8.15], y: [2.05, 2.95], kind: "window" },
    ],
  },
  // (body d) the end car's leading bogie under the crew door 6.3 m behind the tip, the rear ones
  // 4.05 m from the coupling planes: 14.9 m bogie centres on the intermediate cars
  endBogies: [6.3 - 4.6, 23.0 - 0.07 - 4.05 - 4.6], midBogies: [3.8, 22.5 - 3.8],
  bogieCentres: 14.9, wheelR: 0.476, wheelbase: 2.56, cars: [4, 8], fittings: vbFittings,
  liveries: { whiteBlue: WHITE_BLUE, saffron: SAFFRON_GREY },
  weight: { end: 52, middle: 50 }, power: 1100, maxspeed: 180,
};
const VB = VANDE_BHARAT;

const P = seriesParams(VANDE_BHARAT);

export function irVandeBharat(v?: ParamValues): MeshBuilder { return buildSeries(VANDE_BHARAT, P, v); }
export function irVandeBharatLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(VANDE_BHARAT, P, v); }
