// The DJJ2 "China Star" (Zhonghua Zhixing; Zhuzhou and Datong power cars, Changchun and Sifang
// trailers, 2002): China's own 270 km/h power-car train - two Bo-Bo power cars of 4,800 kW and nine
// 25DT trailers - that set the Chinese record of 321.5 km/h on the Qinhuangdao - Shenyang line in
// November 2002, ran there in service 2005 - 2006 and is preserved (0001B and three trailers at the
// China Railway Museum, 0001A at Shenyang). Drawn on the series kit (shinkansen.ts): the end car is
// the power car - its "platypus" nose a cab face (seriesCab.ts), plain machine-room sides with one
// crew door, louvres along both roof slopes, one single-arm pantograph over the rear bogie raised -
// and the intermediate car a trailer. Matched to the photographs and the side drawings in
// assets/cr-china-star/ (SOURCES.md). See docs/models/china-units.md ("The China Star's body").
//
// Heights over the rail, d behind the nose's tip, lat from the centre line.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the nose meets the body: the published 5.5 m head. */
const JOIN = 5.5;
/** The body's crown (about 3.9 m on the side drawing at 15.2 px/m) and shoulder. */
const CROWN = 3.95;
const SHOULDER = 3.4;

/**
 * The centre line (the side drawing, 15.2 px/m, and the photographs): the bill's rounded tip 0.95 m
 * up over the flared foot, its top rounding over at 1.5 m into the hood rising evenly at about 33
 * degrees past the lamps to the windscreen's foot (2.5 m, 2.6 m behind the tip), the windscreen to
 * 3.45 m (4.1 m back), the canopy rounding over to the roof 5.5 m back. One smooth, convex curve.
 */
const PROFILE: Pt[] = [
  [0.3, 0.42], [0.42, 0.24], [0.56, 0.11], [0.72, 0.03], [0.95, 0], [1.15, 0.05], [1.32, 0.18], [1.48, 0.42], [1.62, 0.72],
  [1.8, 1.08], [2.05, 1.55], [2.3, 2.03], [2.5, 2.45], [2.78, 2.98], [3.05, 3.45], [3.28, 3.85], [3.45, 4.12], [3.62, 4.45],
  [3.76, 4.78], [3.86, 5.1], [CROWN, JOIN],
];
/** The plan: the bill round in plan, the hood narrowing a little to the windscreen, which wraps round the corners. */
const CORNER: Pt[] = [[0.3, 1.3], [0.95, 1.35], [1.5, 1.3], [2.05, 1.15], [2.5, 1.0], [3.05, 0.9], [3.45, 0.75], [3.76, 0.5], [CROWN, 0.3]];
const DEPTH_TABLE: Pt[] = [[0.3, 1.8], [0.95, 1.9], [1.5, 1.9], [2.05, 1.7], [2.5, 1.5], [3.05, 1.2], [3.45, 0.9], [3.76, 0.5], [CROWN, 0.1]];
/** The face's bow in plan: the bill round, the hood gently bowed. */
const BULGE: Pt[] = [[0.3, 0.02], [0.95, 0.02], [1.5, 0.03], [2.05, 0.05], [2.5, 0.06], [3.05, 0.06], [3.45, 0.05], [3.76, 0.03], [CROWN, 0.01]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
};
/** The corner's depth by height, kept ahead of the join. */
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - edge(BULGE, y) - 0.02, edge(DEPTH_TABLE, y)))]);

/** The teal foot's top edge on the nose: from the bill's lower seam at the tip rising back to the side band's top at the join. */
const TEAL_TOP = 1.4;
const TEAL_EDGE: Pt[] = [[0.62, -9], [0.66, 0.15], [0.8, 1.2], [1.0, 2.6], [1.2, 3.9], [TEAL_TOP, JOIN + 0.05]];
/** The blue under the windscreen on the nose's flanks: its lower edge rising back from the face to the band over the side at the join. */
const BLUE_BACK: Pt[] = [[2.2, 2.2], [2.45, 3.0], [2.75, 4.0], [3.05, 4.85], [3.3, JOIN + 0.05], [3.35, 9]];
/** The blue head-on under the windscreen: dipping in a tongue round the centre lamp ([lat, y]). */
const BLUE_TONGUE: Pt[] = [[-1.45, 2.55], [-1.45, 2.3], [-1.1, 2.2], [-0.6, 2.0], [-0.35, 1.9], [0.35, 1.9], [0.6, 2.0], [1.1, 2.2], [1.45, 2.3], [1.45, 2.55]];
/** The bill's cap outline (the movable front cover): a thin flush seam arching over the bill, and its middle seam. */
const CAP: Pt[] = [[-1.22, 0.7], [-1.15, 1.05], [-0.95, 1.3], [-0.6, 1.47], [0, 1.53], [0.6, 1.47], [0.95, 1.3], [1.15, 1.05], [1.22, 0.7]];
const seamLine = (pts: readonly Pt[], w: number): Pt[][] => pts.slice(1).map((b, i) => {
  const a = pts[i]!, [dx, dy] = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(dx, dy), [nx, ny] = [(-dy / n) * w, (dx / n) * w];
  return [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
});

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.62, 0.66, 1.9, 2.2, 3.55])].sort((a, b) => a - b);

/** The power car's cab face. */
export const CHINA_STAR_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 2.6, first: 7.2, roofFrom: 9, cols: [7, 4, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, bulge: BULGE, rows: ROWS,
  lodBands: [[0, 0.64, "teal"], [0.64, 2.2, "body"], [2.2, 9, "blue"]],
  lod: {
    profile: [[0.3, 0.42], [0.56, 0.11], [0.95, 0], [1.32, 0.18], [1.62, 0.72], [2.05, 1.55], [2.5, 2.45], [3.05, 3.45], [3.45, 4.12], [3.76, 4.78], [CROWN, JOIN]],
    corner: [[0.3, 1.3], [0.95, 1.35], [2.05, 1.15], [3.05, 0.9], [3.76, 0.5], [CROWN, 0.3]],
    rows: [0.3, 0.56, 0.95, 1.32, 1.62, 2.05, 2.5, 3.05, 3.45, 3.76, CROWN],
    cornerDepth: [[0.3, 2.2], [0.95, 2.4], [2.05, 1.5], [3.05, 1.0], [3.45, 0.6], [3.76, 0.3], [CROWN, 0.05]],
    bulge: BULGE,
  },
  lodGlass: { hw: 1.1, y: [2.55, 3.4] },
  paint: [
    // the teal foot: the bill's flared lip, its edge rising back along the flanks
    { mat: "teal", front: TEAL_EDGE.map(([y]): Pt => [y, -9]), back: [[0, 9], [TEAL_TOP, 9]], top: TEAL_TOP },
    { mat: "body", front: TEAL_EDGE.map(([y]): Pt => [y, -9]), back: TEAL_EDGE, top: TEAL_TOP },
    // the blue round the windscreen and over the canopy, its edge on the flanks
    { mat: "blue", front: [[2.2, -9], [9, -9]], back: BLUE_BACK, top: 9 },
  ],
  fields: [{ mat: "blue", pts: BLUE_TONGUE }],
  masks: [
    // the grey visor over the windscreen
    { lat: [-1.16, 1.16], y: [3.3, 3.5], r: 0.1, mat: "visor" },
    // the lamp eyes: dark housings on the hood's flanks, and the centre one in the tongue
    { lat: [-1.48, -0.72], y: [1.8, 2.03], r: 0.11, mat: "eye" },
    { lat: [0.72, 1.48], y: [1.8, 2.03], r: 0.11, mat: "eye" },
    { lat: [-0.32, 0.32], y: [2.1, 2.4], r: 0.1, mat: "eye" },
    // the grille panel under the centre lamp
    { lat: [-0.25, 0.25], y: [1.6, 1.86], r: 0.03, mat: "grille" },
  ],
  decals: [
    ...seamLine(CAP, 0.008).map((pts) => ({ mat: "seam", pts, fine: 4 })),
    // the cover's two halves meeting down its middle
    { mat: "seam", pts: [[-0.008, 0.66], [0.008, 0.66], [0.008, 1.53], [-0.008, 1.53]], fine: 12 },
  ],
  // the windscreen: one wide curved pane wrapping round the corners
  panes: [{ lat: [-1.12, 1.12], y: [2.55, 3.35], r: 0.32, mat: "screen" }],
  lamps: [[1.2, 1.915, 0.075, "lampHead"], [-1.2, 1.915, 0.075, "lampHead"], [0.12, 2.25, 0.08, "lampHead"]],
  wipers: [[[0.2, 2.6], [0.8, 3.0]], [[-0.8, 2.6], [-0.2, 3.0]]],
  // the skirt open over the leading bogie, whose front wheels stand under the nose
  wheelCut: { d: 4.15, y: 0.6 },
};

// ---------------------------------------------------------------------------
// The livery (as built and as preserved): ivory white, the teal foot, the blue roof band

const WHITE = "#f1f0ea";
const TEAL = "#16848f";
const BLUE = "#6f86cf";

/** The side's bands, every car: the teal foot to 1.4 m, white, the blue from 3.25 m over the roof's slopes. */
const BLUE_LINE = 3.25;

/** The cab side window behind the windscreen: an upright pane, its front leaning with the windscreen. */
const CAB_PANE_FRONT: Pt[] = [[2.62, 5.62], [3.2, 5.68]];
const CAB_PANE_BACK: Pt[] = [[2.62, 6.18], [3.2, 6.18]];

/** The power car preserved at the China Railway Museum (its sister 0001A at Shenyang). */
export const NUMBER = "DJJ2 0001B";

const LIVERY: ShinkansenLivery = {
  title: "China Star", number: "",
  palette: {
    body: c(WHITE), teal: c(TEAL, 0.4), blue: c(BLUE, 0.4), roofB: c(BLUE, 0.5), visor: c("#7b8089", 0.35), eye: c("#2a2e34", 0.25),
    grille: c("#b9bdc2", 0.6), seam: c("#3b3e42", 0.5), screen: c("#3d4c58", 0.08), lettering: c("#c8262b", 0.4), starBlue: c("#2b4f9e", 0.4),
    orange: c("#ef8a1e", 0.4), skirtT: c("#0f6670", 0.6), under: c("#2a2c2f", 0.85), louvre: c("#3f4c78", 0.5), roofP: c("#8592b8", 0.55), insulator: c("#9a5a3a", 0.5),
  },
  bands: [[0, TEAL_TOP, "teal"], [TEAL_TOP, BLUE_LINE, "body"], [BLUE_LINE, 9, "blue"]],
  front: [[0, 0.64, "teal"], [0.64, 9, "body"]],
  roof: "roofB", skirt: "skirtT",
  endSweeps: [
    // the cab side window, and the orange swoosh over the logo
    { mat: "screen", front: CAB_PANE_FRONT, back: CAB_PANE_BACK },
    { mat: "orange", front: [[2.3, 10.7], [3.0, 12.3]], back: [[2.3, 11.0], [3.0, 12.6]] },
  ],
  endLettering: [
    { text: "CHINA STAR", d: 10.6 - JOIN, y: 1.95, h: 0.24, mat: "starBlue" },
    // the running number in red under the cab side window
    { text: NUMBER, d: 5.75 - JOIN, y: 2.3, h: 0.13, mat: "lettering" },
  ],
};

// ---------------------------------------------------------------------------
// Fittings

/** Louvres on both roof slopes over a d span: a dark panel on the roof's arc and slats across it. */
function louvres(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d0: number, d1: number, z: readonly [number, number], slats: number): void {
  for (const sd of [1, -1]) {
    crownPane(m, b, X, sd, "louvre", [d0, d1], [z[0], z[1]], 0.004);
    const w = (d1 - d0) / slats;
    for (let i = 0; i < slats; i++) crownPane(m, b, X, sd, "roofB", [d0 + i * w + w * 0.55, d0 + (i + 1) * w], [z[0] - 0.01, z[1] + 0.01], 0.008);
  }
}

/** The power car: the louvre panels along both roof slopes, the roof line and the earthing gear by the pantograph, the transformer under the floor. */
function powerFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = CHINA_STAR.C;
  if (!car.end) {
    m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), CHINA_STAR.B - 0.15, CHINA_STAR.B + 0.05, -CHINA_STAR.W * 0.8, CHINA_STAR.W * 0.8));
    m.scope("air conditioning", () => block(m, "louvre", X(car.length - 1.0), X(car.length - 2.6), C - 0.06, C + 0.04, -0.55, 0.55));
    return;
  }
  // the ten louvre panels from the cab's rear to the pantograph's well, the last one behind it
  m.scope("louvres", () => {
    for (let k = 0; k < 7; k++) louvres(m, b, X, 6.0 - JOIN + k * 1.45, 6.0 - JOIN + k * 1.45 + 1.3, [0.82, 1.32], 6);
    louvres(m, b, X, 19.4 - JOIN, 20.7 - JOIN, [0.82, 1.32], 6);
  });
  // the high-voltage gear on the roof ahead of the pantograph: the disconnector and the line on its insulators
  m.scope("roof equipment", () => {
    block(m, "roofP", X(16.4 - JOIN), X(14.6 - JOIN), C - 0.083, C + 0.065, -0.55, 0.55);
    for (const d of [14.9, 16.3]) block(m, "insulator", X(d + 0.08 - JOIN), X(d - 0.08 - JOIN), C + 0.05, C + 0.36, -0.08, 0.08);
    block(m, "pantograph", X(17.0 - JOIN), X(14.7 - JOIN), C + 0.36, C + 0.4, -0.02, 0.02);
  });
  // the transformer and the main reservoirs between the bogies, behind the skirt
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.2), X(car.trucks[0]! + 2.2), CHINA_STAR.B - 0.2, CHINA_STAR.B + 0.05, -CHINA_STAR.W * 0.8, CHINA_STAR.W * 0.8));
}

// ---------------------------------------------------------------------------
// The train

/** The power car 21.7 m over the couplers (published); a 25DT trailer 26.6 m (25.5 m body). */
const POWER_LENGTH = 21.7;
const COACH_LENGTH = 26.6;
const COACH_BODY = COACH_LENGTH - 0.5;

/** A row of n windows, `w` wide and `pitch` apart, the first from d0. */
const windowRow = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

/**
 * The China Star: the power car (the end car) 21.7 m over the couplers, its roof 3.95 m, the 5.5 m
 * nose; no passenger windows, the cab side window and one crew door 7.2 m behind the tip; Bo-Bo
 * bogies 11.3 m apart (6.35 m and 17.65 m behind the tip) on 1.25 m wheels, 3.0 m wheelbase; one
 * single-arm pantograph (Stemmann DSA380) over the rear bogie, raised on both power cars. The
 * trailers 26.6 m: a plug door at each end, ten 1.5 m windows 1.9 m apart and the blank panel of
 * the toilets, bogies 18 m apart on 0.915 m wheels.
 */
export const CHINA_STAR: ShinkansenSeries = {
  endLength: POWER_LENGTH, midLength: COACH_LENGTH, W: 1.6, Y: 0.75, S: SHOULDER, C: CROWN, lean: 0.95, B: 0.3, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CHINA_STAR_FACE,
  windows: [[1.95, 2.75]], windowW: 1.5, pitch: 1.9, door: [1.25, 3.0, 2.0, 2.72], doorW: 0.8, doorGlassW: 0.26, doorGlassR: 0.1,
  layout: {
    end: { doors: [], windows: [] },
    middle: { doors: [[0.4, 1.2, -1], [COACH_BODY - 1.2, COACH_BODY - 0.4, 1]], windows: [...windowRow(1.9, 10, 1.6, 1.9), [20.95, 23.35]] },
  },
  endSides: { windows: [], doors: [[7.2 - JOIN, 8.0 - JOIN]] },
  endBogies: [6.35 - JOIN, 17.65 - JOIN], bogieCentres: 18.0, wheelR: 0.4575, wheelbase: 2.5,
  endCarRunningGear: { wheelbase: 3.0, wheelR: 0.625 },
  endPantograph: true, pantographAt: 17.6 - JOIN,
  cars: [4, 5, 11],
  fittings: powerFittings,
  liveries: { chinaStar: LIVERY },
  weight: { end: 78, middle: 48 }, power: 4800, maxspeed: 270,
};

// ---------------------------------------------------------------------------
// The design

/** The train lengths: two power cars with one to six trailers (the record run's five cars; the full set of eleven not offered). */
export const CHINA_STAR_CARS: readonly number[] = [3, 4, 5, 6, 7, 8];

/** The cars: the power car (the default, the train's locomotive), a trailer, the train. */
export const CHINA_STAR_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { endCar: "Power car", middleCar: "Coach", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(CHINA_STAR_CARS.map((n) => [String(n), `${n} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
];

export function chinaStar(v?: ParamValues): MeshBuilder {
  return buildSeries(CHINA_STAR, CHINA_STAR_PARAMS, resolveParams(CHINA_STAR_PARAMS, v));
}
export function chinaStarLod(v?: ParamValues): MeshBuilder {
  return buildSeriesLod(CHINA_STAR, CHINA_STAR_PARAMS, resolveParams(CHINA_STAR_PARAMS, v));
}

/** The game's figures: a power car 78 t and 4,800 kW, a trailer 48 t; a train adds them up, its two power cars 9,600 kW. */
function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [{ params: { unit: "middleCar" }, weight: CHINA_STAR.weight.middle, power: 0 }];
  for (const n of CHINA_STAR_CARS)
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train" }, weight: 2 * CHINA_STAR.weight.end + (n - 2) * CHINA_STAR.weight.middle, power: 2 * CHINA_STAR.power });
  return { weight: CHINA_STAR.weight.end, power: CHINA_STAR.power, maxspeed: 270, accel: null, variants };
}

export const CHINA_STAR_DESIGN: ProceduralDesign = {
  ...seriesDesign("proc-vehicle-cr-china-star", "DJJ2 China Star", CHINA_STAR, CHINA_STAR_PARAMS, chinaStar, chinaStarLod, "cr-china-star"),
  game: game(),
};
