// The OBB class 4020 (SGP Graz, electrics by ELIN, BBC and Siemens, 1978 - 1987; design Johann
// Benda), the three-car 15 kV electric unit of the Vienna S-Bahn and of the regional services round
// Innsbruck, Linz and in Vorarlberg, drawn on the series kit (shinkansen.ts) with its own cab face
// (seriesCab.ts): the 4020 motor car with its cab leading, the 7020 intermediate trailer and the 6020
// driving trailer at the rear (Bo'Bo' + 2'2' + 2'2', 69.4 m). The flat front, upright to the lamp
// band and leaning back about 15 degrees past the big windscreen in its trapezoid frame to the roof
// lamp, the lamps low at the corners, the Scharfenberg coupler; on each car two double swing-plug
// doors a side (1.4 m clear) with a narrow window in each leaf, the 1.18 m windows at a 1.6 m pitch;
// the motor car's crew door and single window ahead of its first door where the driving trailer has
// two windows, its roof covered from the cab back by the brake resistors' mesh cage and the louvred
// housings, the single-arm pantograph behind them. Two schemes: the delivery livery (ivory with the
// blue window band, stripe, cab panels and front, the S-Bahn "S" on the front) and the red and grey
// "Schraegdesign" of the units repainted from 2004 (red ends, light grey between the doors, grey
// front). Matched to the photographs in assets/obb-4020/ (SOURCES.md) and the published figures
// (de.wikipedia "OBB 4020"). See docs/models/austria-units.md.
//
// Heights over the rail. On the face, d behind its tip (the lamp band's front); the layout's d behind
// the body's front end (the face's join, JOIN behind the tip).
//
// Photographs and scales: photo-obb-4020-in-traismauer.jpg (6020 304 nearly side-on: a 1-D projective
// fit over its front, its cab window from the side-on cab photograph and its rear end, the 1.18 m
// windows coming out 1.13 - 1.18 m); photo-4020-254-1-wien-meidling.jpg (4020 254: the motor car's
// side, a projective fit over its second door and four windows, and its roof); photo-4020-lackierungen.jpg
// (both cab sides side-on, about 240 px/m: the face's lean and the cab windows);
// photo-2018-09-09-...-4020-2.jpg (4020 246 head-on, about 130 px/m: the face's paint, lamps, frame and
// glass); photo-obb-4020-310-in-gumpoldskirchen.jpg and photo-2017-09-28-464-... (the red scheme).

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { GameProperties, ParamValues, ProceduralDesign } from "./design.ts";
import { resolveParams } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Lengths over the couplers: motor car and driving trailer 23.3 m, the intermediate trailer 22.8 m, 69.4 m the unit (de.wikipedia). */
const END_LENGTH = 23.3;
const MID_LENGTH = 22.8;
/** Where the face meets the body: the roof dome has reached the crown. */
const JOIN = 0.78;
/** The coupling plane ahead of the tip (the Scharfenberg coupler's head). */
const REACH = 0.4;
/** The end car's body from the face's tip to its inner end. */
const TIP_TO_END = END_LENGTH - REACH - 0.25;
const MID_BODY = MID_LENGTH - 0.5;
/** d behind the body's front end of a d behind the tip. */
const at = (d: number): number => d - JOIN;

/** Half width (2.872 m), the side's foot, skirt top and belly, the eaves and the crown (3.75 m). */
const W = 1.436;
const B = 0.95;
const A = 1.0;
const Y = 1.15;
const S = 3.36;
const C = 3.75;

/** The side's bands: the stripe, the window band and the line under the eaves. */
const STRIPE: readonly [number, number] = [1.24, 1.4];
const BAND: readonly [number, number] = [1.9, 3.1];
const EAVES: readonly [number, number] = [3.27, 3.33];
/** The passenger windows' sill and head; the doors' foot and head and their leaves' windows. */
const WIN: readonly [number, number] = [2.03, 2.9];
const DOOR: readonly [number, number] = [0.98, 3.02];
const DOOR_GLASS: readonly [number, number] = [1.97, 2.93];
/** The front: the lamp band (its top the side's cab panel's foot), the white line and the skirt below. */
const LAMPS: readonly [number, number] = [1.24, 1.79];
/** The windscreen's frame (a trapezoid) and the glass. */
const FRAME_Y: readonly [number, number] = [2.02, 3.34];
const SCREEN: readonly [number, number] = [2.06, 3.0];

/**
 * The face's centre line (the side-on cab photograph at 240 px/m and 4020 246 head-on): upright from
 * the white line's step to the lamp band's top, then leaning back about 15 degrees past the frame to
 * the roof lamp, the dome rounding back into the crown 0.78 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.05], [1.14, 0.05], [1.17, 0], [LAMPS[1], 0], [1.95, 0.02], [2.4, 0.135], [2.9, 0.27], [3.34, 0.39], [3.5, 0.44], [3.6, 0.49], [3.67, 0.55],
  [3.72, 0.63], [C, JOIN],
];

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The windscreen's frame: a trapezoid, 2.38 m wide at its foot and 2.08 m at its head, its corners cut. */
const FRAME: Pt[] = [
  [-1.13, FRAME_Y[0]], [1.13, FRAME_Y[0]], [1.19, FRAME_Y[0] + 0.07], [1.04, FRAME_Y[1] - 0.05], [0.99, FRAME_Y[1]],
  [-0.99, FRAME_Y[1]], [-1.04, FRAME_Y[1] - 0.05], [-1.19, FRAME_Y[0] + 0.07],
];

/**
 * The S-Bahn's "S" on the delivery livery's front: three leaning bars joined at opposite ends, in the
 * lamp band between the lamps (0.62 m wide, 0.42 m high); convex pieces that only touch.
 */
const S_LOGO: Pt[][] = (() => {
  const P = (u: number, v: number): Pt => [0.31 * u + 0.16 * (v - 0.5), 1.32 + 0.42 * v];
  const quad = (u0: number, u1: number, v0: number, v1: number): Pt[] => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  return [
    quad(-0.5, 1.0, 0.78, 1.0), [P(-1.0, 0.61), P(-0.5, 0.61), P(-0.5, 1.0), P(-0.82, 1.0), P(-1.0, 0.86)],
    quad(-1.0, 1.0, 0.39, 0.61), [P(0.5, 0.0), P(0.82, 0.0), P(1.0, 0.14), P(1.0, 0.39), P(0.5, 0.39)], quad(-1.0, 0.5, 0.0, 0.22),
  ];
})();

const ROWS = [...new Set([...PROFILE.map(([y]) => y), LAMPS[0], 1.2, 1.32, 1.53, 1.74, FRAME_Y[0], FRAME_Y[0] + 0.07, SCREEN[0], 2.5, SCREEN[1], 3.05, 3.29, FRAME_Y[1], 3.58])].sort((a, b) => a - b);

/** The face of one scheme: the "S" on the delivery livery, the OBB lettering on the red one. */
function face(red: boolean, number: string): SeriesCabFace {
  return {
    dJoin: JOIN, dSide: 0.3, reach: REACH, roofFrom: 3.7, first: 6.3, bulge: 0.02, tolerance: 0.02, cols: [5, 3, 1, 1],
    profile: PROFILE,
    // the corners rounded about 0.25 m in plan, the dome's corners wider into the roof
    corner: [[B, 0.22], [LAMPS[1], 0.24], [3.0, 0.26], [3.4, 0.3], [3.6, 0.32], [3.7, 0.2], [C, 0.04]],
    rows: ROWS,
    fields: [
      // the white line's step between the lamp band and the skirt, the frame round the glass and the display
      { mat: "faceLine", pts: box(-1.5, 1.5, 1.15, LAMPS[0]) },
      { mat: "frame", pts: FRAME },
    ],
    panes: [
      { lat: [-1.0, 1.0], y: SCREEN, r: 0.13 },
      { lat: [-0.78, 0.78], y: [3.06, 3.29], r: 0.04, mat: "display" },
    ],
    decals: red
      ? [
          // the umlaut's dots over the O of the lettering
          { mat: "lettering", pts: box(-0.2, -0.165, 1.71, 1.745), fine: 1 },
          { mat: "lettering", pts: box(-0.12, -0.085, 1.71, 1.745), fine: 1 },
        ]
      : S_LOGO.map((pts) => ({ mat: "lettering", pts, fine: 1 })),
    // the head lamps at the corners, the tail lamps inboard; the lamp on the roof dome in its box
    lamps: [[-1.18, 1.53, 0.14, "lampHead"], [1.18, 1.53, 0.14, "lampHead"], [-0.93, 1.52, 0.075, "lampRed"], [0.93, 1.52, 0.075, "lampRed"]],
    pods: [{ lat: 0, y: 3.56, w: 0.36, h: 0.32, r: 0.04, proud: 0.03, depth: 0.05, mat: "lampBox", level: true, lamps: [[0, 0.12, "lampHead"]] }],
    // the car's own number under the frame, left of the middle (spaced as painted)
    texts: [{ text: number, lat: -0.12, y: 1.83, h: 0.15, mat: "faceNo" }, ...(red ? [{ text: "OBB", lat: 0, y: 1.42, h: 0.2, mat: "lettering" }] : [])],
    wipers: [[[0.0, SCREEN[0] + 0.04], [0.85, 2.6]]],
    lodGlass: { hw: 1.0, y: SCREEN },
  };
}

/** n windows 1.15 m wide at the 1.6 m pitch from d (behind the tip). */
const row = (d: number, n: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d + i * 1.6, d + i * 1.6 + 1.15] as const);
/** A double door from d (behind the tip), 1.75 m between its frames, its two leaves parting. */
const doorAt = (d: number): Array<readonly [number, number, number]> => [[at(d), at(d + 0.875), -1], [at(d + 0.875), at(d + 1.75), 1]];
const body = (spans: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => spans.map(([a, e]) => [at(a), at(e)] as const);

/** The end cars' doors and the windows behind the first (6020 304 and 4020 254 alike): four between the doors, three behind the second. */
const DOOR1 = 6.3;
const DOOR2 = 15.25;
const SALOON = [...row(8.65, 4), ...row(17.65, 3)];
const DOORS = [...doorAt(DOOR1), ...doorAt(DOOR2)];
/** The driving trailer 6020: two windows behind its cab. */
const DT_END: SeriesLayout = { doors: DOORS, windows: body([...row(2.9, 2), ...SALOON]) };
/** The motor car 4020: the crew compartment's narrow door (its seam a side panel) and one window ahead of the first door. */
const MC_END: SeriesLayout = { doors: DOORS, windows: body([[2.45, 2.85], ...row(4.5, 1), ...SALOON]) };

/** The intermediate trailer 7020: its doors as far from its ends as the end cars' second door from their inner end; three windows at each end, four between. */
const MID: SeriesLayout = (() => {
  const d0 = TIP_TO_END - DOOR2 - 1.75;
  const ends = row(17.65, 3).map(([a, e]): [number, number] => [TIP_TO_END - e, TIP_TO_END - a]);
  const first = (MID_BODY - (3 * 1.6 + 1.15)) / 2;
  return {
    doors: [[d0, d0 + 0.875, -1], [d0 + 0.875, d0 + 1.75, 1], [MID_BODY - d0 - 1.75, MID_BODY - d0 - 0.875, -1], [MID_BODY - d0 - 0.875, MID_BODY - d0, 1]],
    windows: [
      ...ends.slice().reverse(),
      ...Array.from({ length: 4 }, (_, i): [number, number] => [first + i * 1.6, first + i * 1.6 + 1.15]),
      ...ends.map(([p, q]): [number, number] => [MID_BODY - q, MID_BODY - p]),
    ],
  };
})();

/** The cab's side window, high behind the face (the side-on cab photograph: 1.41 - 1.98 m behind the tip, 2.45 - 3.2 m up). */
const CAB_WINDOWS: Array<readonly [number, number, number, number]> = [[at(1.42), at(1.96), 2.45, 3.2]];

/** The cab panel's leaning rear edge (d behind the tip by height) and the ivory gap of even width behind it. */
const PANEL_BACK: Pt[] = [[B, 1.65], [LAMPS[0], 1.75], [S, 2.47]];
const GAP_W = 0.12;

const COMMON: Record<string, MaterialSpec> = {
  lampBox: c("#9da1a5", 0.4), rubber: c("#2a2c2f", 0.6), seam: c("#7d8186", 0.5), steel: c("#4a4d50", 0.55), yellow: c("#e6c21a", 0.45),
  display: { color: "#16181a", metallic: 0.2, roughness: 0.15, glass: true },
  lampRed: { color: "#b3261e", metallic: 0, roughness: 0.2, lamp: { role: "tail" } },
  roofG: c("#a9adb0", 0.7), mesh: c("#8c9094", 0.7), louvre: c("#b7b1a2", 0.6), resistor: c("#5f6367", 0.75), under: c("#2e3134", 0.8),
};

/**
 * The delivery livery (6020 095 at Huetteldorf in 1988, the same pattern on 4020 254 and 246 in
 * grey-white after 1993): ivory sides with the blue window band (the windows' frames in it), the
 * blue stripe below and the blue line under the eaves; the blue cab panel on each side from the face
 * to a leaning edge behind the cab window; the front ivory over the blue lamp band and skirt, the
 * windscreen in its blue frame, the white "S"; the doors in the side's bands.
 */
const ORIGINAL: ShinkansenLivery = {
  title: "Original", number: "4020 095-8",
  palette: {
    ...COMMON, ivory: c("#e9e4d2", 0.45), blue: c("#22409b", 0.45), frame: c("#22409b", 0.45), frontSkirt: c("#22409b", 0.5), faceLine: c("#22409b", 0.45), skirtG: c("#2b2e32", 0.8),
    lettering: c("#f4f4f2"), faceNo: c("#22409b"),
  },
  bands: [[0, STRIPE[0], "ivory"], [STRIPE[0], STRIPE[1], "blue"], [STRIPE[1], BAND[0], "ivory"], [BAND[0], BAND[1], "blue"], [BAND[1], EAVES[0], "ivory"], [EAVES[0], EAVES[1], "blue"], [EAVES[1], 9, "ivory"]],
  front: [[0, LAMPS[1], "blue"], [LAMPS[1], 9, "ivory"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the blue cab panel from the face (round its lower corners) back to its leaning edge
    { mat: "blue", front: [[B, -9], [LAMPS[1], -9], [LAMPS[1] + 0.001, 0.32], [S, 0.32]], back: PANEL_BACK },
    // the even ivory gap between the panel and the window band, up to the band's head
    { mat: "ivory", front: PANEL_BACK.map(([y, d]): Pt => [y, d + 0.001]), back: PANEL_BACK.map(([y, d]): Pt => [y, d + GAP_W]), top: BAND[1] },
  ],
  sideFields: {
    // the stripe carried on under the ivory gap (the sweep above paints from the belly)
    end: [
      { mat: "blue", pts: [[at(1.74), STRIPE[0]], [at(1.95), STRIPE[0]], [at(2.0), STRIPE[1]], [at(1.79), STRIPE[1]]] },
    ],
  },
  lodSideFields: { end: [{ d: [0.3, 2.1], bands: [[0, STRIPE[0], "ivory"], [STRIPE[0], S, "blue"], [S, 9, "ivory"]] }] },
};

/**
 * The red and grey scheme of the units repainted from 2004 (4020 310 at Gumpoldskirchen, 6020 314 at
 * Stockerau): light grey between the doors, the ends red - behind the cab to an edge leaning back
 * toward the foot before the first door, behind the second door square - over a dark grey foot; the
 * front grey over the red lamp band and the dark grey skirt, the glass in a dark grey frame; light
 * grey doors.
 */
const TRAFFIC_RED: ShinkansenLivery = {
  title: "Traffic red", number: "4020 310-1",
  palette: {
    ...COMMON, greyL: c("#dfe1e1", 0.45), red: c("#e2001a", 0.45), greyF: c("#8b9095", 0.45), frame: c("#4d5257", 0.4), faceLine: c("#3d4044", 0.6),
    footG: c("#3d4044", 0.6), frontSkirt: c("#3d4044", 0.6), skirtG: c("#2b2e32", 0.8), lettering: c("#f4f4f2"), faceNo: c("#f4f4f2"),
  },
  bands: [[0, 1.08, "footG"], [1.08, 9, "greyL"]],
  front: [[0, LAMPS[0], "footG"], [LAMPS[0], LAMPS[1], "red"], [LAMPS[1], 9, "greyF"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the red cab end, back to the edge before the first door (6.25 m at the foot, 5.95 m at the eaves)
    { mat: "red", front: [[B, -9], [S, -9]], back: [[1.08, DOOR1 - 0.05], [S, 5.95]] },
    // the red inner end behind the second door
    { mat: "red", front: [[B, DOOR2 + 1.85], [S, DOOR2 + 1.85]], back: [[B, TIP_TO_END], [S, TIP_TO_END]] },
  ],
  sideFields: {
    // the intermediate trailer's red ends outside its doors
    middle: [
      { mat: "red", pts: [[0, 1.08], [MID.doors[0]![0] - 0.1, 1.08], [MID.doors[0]![0] - 0.1, S], [0, S]] },
      { mat: "red", pts: [[MID.doors[3]![1] + 0.1, 1.08], [MID_BODY, 1.08], [MID_BODY, S], [MID.doors[3]![1] + 0.1, S]] },
    ],
  },
  lodSideFields: {
    end: [{ d: [0, DOOR1], bands: [[0, 1.08, "footG"], [1.08, 9, "red"]] }, { d: [DOOR2 + 1.85, TIP_TO_END], bands: [[0, 1.08, "footG"], [1.08, 9, "red"]] }],
    middle: [
      { d: [0, MID.doors[0]![0] - 0.1], bands: [[0, 1.08, "footG"], [1.08, 9, "red"]] },
      { d: [MID.doors[3]![1] + 0.1, MID_BODY], bands: [[0, 1.08, "footG"], [1.08, 9, "red"]] },
    ],
  },
};

type Car = { end: boolean; length: number; trucks: readonly number[]; rearEndCar?: boolean };

/** The coupler and the front skirt under the face, both end cars. */
function cabEnd(m: MeshBuilder, X: (d: number) => number): void {
  const tip = X(-JOIN), k = Math.sign(tip - X(0));
  const out = (mat: string, a: number, e: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, z0, z1);
  m.scope("front skirt", () => {
    // the blue (dark grey) skirt plate under the face, down to 0.72 m, either side of the coupler's opening
    for (const sd of [1, -1]) out("frontSkirt", -0.7, -0.04, 0.72, B + 0.01, sd > 0 ? 0.42 : -1.3, sd > 0 ? 1.3 : -0.42);
  });
  m.scope("coupler", () => {
    // the Scharfenberg coupler: the shank, the head on the coupling plane and the yellow guide frame
    out("steel", -0.05, 0.3, 0.86, 1.0, -0.09, 0.09);
    out("carbon", 0.3, REACH, 0.8, 1.06, -0.2, 0.2);
    out("yellow", 0.18, 0.3, 1.02, 1.1, -0.38, 0.38);
    for (const sd of [1, -1]) out("yellow", 0.18, 0.3, 0.78, 1.1, sd > 0 ? 0.3 : -0.38, sd > 0 ? 0.38 : -0.3);
  });
}

/** The underfloor between the bogies: the motor car's control and resistor cases, the trailers' auxiliaries. */
function underfloor(m: MeshBuilder, X: (d: number) => number, car: Car, motor: boolean): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    if (motor) {
      blk("under", t0 + 1.9, t0 + 5.6, 0.42, B + 0.02, 1.15);
      blk("under", t0 + 6.0, t1 - 1.9, 0.38, B + 0.02, 1.2);
    } else {
      blk("under", t0 + 2.1, t0 + 6.4, 0.5, B + 0.02, 1.0);
      blk("under", t0 + 7.0, t1 - 2.1, 0.55, B + 0.02, 0.95);
    }
  });
}

/** The driving trailer's and the intermediate trailer's fittings: the roof ventilators, the cab end, the underfloor. */
function trailerFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: Car): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  m.scope("roof equipment", () => {
    // the roof ventilators over the saloons (the trailers are aired from the roof)
    const spots = car.end ? [at(5.2), at(11.5), at(19.0)] : [3.6, car.length / 2, car.length - 3.6];
    for (const d of spots) m.scope("ventilator", () => blk("roofG", d - 0.35, d + 0.35, C - 0.04, C + 0.12, 0.3));
  });
  if (car.end) cabEnd(m, X);
  underfloor(m, X, car, false);
}

/** The motor car's roof (the resistors' mesh cage behind the cab, the louvred housings), its cab end and underfloor. */
function motorFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: Car): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("roof equipment", () => {
    m.scope("resistor cage", () => {
      // the brake resistors in their frame behind the cab, a mesh over the top and both sides
      const [d0, d1] = [at(0.95), at(4.4)];
      blk("mesh", d0, d1, C - 0.2, C + 0.32, -1.0, 1.0);
      // the dark resistor grids under the mesh lid, four in a row
      for (let k = 0; k < 4; k++) {
        const [a, e] = [d0 + ((d1 - d0) * k) / 4 + 0.06, d0 + ((d1 - d0) * (k + 1)) / 4 - 0.06];
        blk("resistor", a, e, C + 0.32, C + 0.4, -0.9, 0.9);
      }
    });
    m.scope("louvred housings", () => {
      // three low housings with louvred sides along the roof ahead of the pantograph
      for (const [a, e] of [[4.6, 7.0], [7.15, 9.55], [9.7, 12.1]] as const) {
        const [d0, d1] = [at(a), at(e)];
        blk("roofG", d0, d1, C - 0.05, C + 0.26, -0.78, 0.78);
        for (const sd of [1, -1]) blk("louvre", d0 + 0.1, d1 - 0.1, C - 0.02, C + 0.22, sd > 0 ? 0.78 : -0.8, sd > 0 ? 0.8 : -0.78);
      }
    });
  });
  cabEnd(m, X);
  underfloor(m, X, car, true);
}

/** The cab door's handle panel ahead of the cab window (both end cars) and the motor car's crew door. */
const CAB_PANEL = { d: [0.98, 1.29] as const, y: [2.46, 3.15] as const, kind: "seam" as const };

function series(red: boolean): ShinkansenSeries {
  return {
    // the driving trailer 6020 and the intermediate trailer 7020; the motor car below (leadEnd)
    endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.985, B, A,
    nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: face(red, red ? "6020 314-8" : "6020 095-3"),
    windows: [WIN], windowW: 1.15, pitch: 1.6, windowCornerR: 0.05,
    door: [DOOR[0], DOOR[1], DOOR_GLASS[0], DOOR_GLASS[1]], doorW: 0.875, doorGlassW: 0.3,
    layout: { end: DT_END, middle: MID },
    cabWindows: CAB_WINDOWS,
    sidePanels: { end: [CAB_PANEL] },
    // the bogies 16.0 m apart, centred on each car; the trailers' 2.3 m bogies on 850 mm wheels
    bogieCentres: 16.0, endBogies: [at(TIP_TO_END / 2 - 8.0), at(TIP_TO_END / 2 + 8.0)], midBogies: [MID_BODY / 2 - 8.0, MID_BODY / 2 + 8.0], wheelR: 0.425, wheelbase: 2.3,
    // the motor car leads and raises its pantograph
    endPantograph: "lead", minCars: 2, cars: [3],
    fittings: trailerFittings,
    lodRoof: { d: [5.0, 5.4], hw: 0.3, y: [C - 0.04, C + 0.12], mat: "roofG" },
    liveries: { original: ORIGINAL, trafficRed: TRAFFIC_RED },
    leadEnd: {
      // the motor car 4020: the crew door and one window ahead of the first door, the motor bogies (950 mm wheels, 2.5 m)
      cabFace: face(red, red ? "4020 310-1" : "4020 095-8"),
      layout: { end: MC_END, middle: MID },
      sidePanels: { end: [CAB_PANEL, { d: [2.3, 3.0], y: [DOOR[0], DOOR[1]], kind: "seam" }] },
      wheelR: 0.475, wheelbase: 2.5,
      // the single-arm pantograph behind the roof housings
      pantographAt: at(13.4),
      fittings: motorFittings,
      lodRoof: { d: [0.95, 12.1], hw: 0.85, y: [C - 0.06, C + 0.3], mat: "resistor" },
    },
    // in service: the motor car 62.4 t, the intermediate trailer 32 t (the driving trailer 33 t); 1,200 kW
    weight: { end: 62.4, middle: 32 }, power: 1200, maxspeed: 120,
  };
}

/** The unit in its delivery livery (the design's series: its game figures and parameters). */
export const OBB4020: ShinkansenSeries = series(false);
const OBB4020_RED: ShinkansenSeries = series(true);

export const OBB4020_PARAMS = seriesParams(OBB4020);
const seriesOf = (v?: ParamValues): ShinkansenSeries => (resolveParams(OBB4020_PARAMS, v).livery === "trafficRed" ? OBB4020_RED : OBB4020);

export function obb4020(v?: ParamValues): MeshBuilder { return buildSeries(seriesOf(v), OBB4020_PARAMS, v); }
export function obb4020Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(seriesOf(v), OBB4020_PARAMS, v); }

/**
 * The game's figures: the motor car (the default unit) 62.4 t with all four motors, 1,200 kW, 0.7 m/s2;
 * the intermediate trailer 32 t and unpowered; the trains 95.4 t (motor car and driving trailer) and
 * 127.4 t (three cars) with the motor car's 1,200 kW (de.wikipedia).
 */
export function obb4020Game(g: GameProperties): GameProperties {
  return {
    ...g, weight: 62.4, power: 1200, accel: 0.7,
    variants: g.variants?.map((v) => (v.params.unit === "middleCar" ? { ...v, weight: 32, power: 0 } : v.params.unit === "train" ? { ...v, weight: v.params.cars === "2" ? 95.4 : 127.4, power: 1200 } : v)),
  };
}

/** The design (generator/atUnits.ts lists it). */
export const OBB4020_DESIGN: ProceduralDesign = ((d) => ({ ...d, game: obb4020Game(d.game!) }))(seriesDesign("proc-vehicle-obb-4020", "OBB 4020", OBB4020, OBB4020_PARAMS, obb4020, obb4020Lod, "obb-4020", "uic"));
