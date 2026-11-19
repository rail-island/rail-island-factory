// The Renfe Civia (CAF / Alstom / Siemens, series 462 - 465, 2003 -): Renfe's modular Cercanias EMU of
// two to five cars (A1 + [A5] + [A3] + [A4] + A2; 44.8 m with two cars, 98.05 m with five, 2.94 m wide,
// 4.265 m high), the end cars 22.4 m from the coupler to the joint, the intermediate cars 17.75 m joint to
// joint, on Jacobs bogies: a trailer bogie (BR) under each cab, a motor bogie (BM) shared under every joint;
// 3 kV DC, 120 km/h. Drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the
// raked glass-fibre front - the red frame round the dark grey shield holding the cap (the number, the
// oval headlight, the two red markers), the windscreen widening upward and the destination display under
// it; the red frame's foot dropping to the coupler cover between the white cheeks, its red top and white
// bottom; the round headlight and tail light on each lower corner; the anticlimber under it. The
// Cercanias scheme: white, the red line and the purple band under the windows sweeping down into the red
// wedge behind the cheeks, the red cantrail line turning down beside the frame to the cab's black side
// panel; white double doors with a narrow window in each leaf, two a side on every car; the light grey roof
// under its dark grey louvred fairings and the air conditioning between them; the two pantographs over
// the ends of the A3 car (the front one raised).
//
// Matched to the photographs and the drawing in assets/renfe-civia/ (SOURCES.md: 465-076 three-quarter
// and head-on, 463/465-226 at Silla and 465-048 at El Casar three-quarter with the closed coupler cover,
// 463-199 at Utebo for the cab side and the doors, 465-243 at Castellbisbal for the whole unit and the
// roof, the Commons side drawing of a 465 for the lengths and the layout) and the published figures
// (es.wikipedia "Civia"). Registered in esUnits.ts. See docs/models/spain-trains.md.
//
// Scales: the side drawing 13.03 px/m (98.05 m over 1278 px), lengths along the train; the 465-076
// head-on crop 170 px/m (the coupler head at 1.0 m), the face's heights and widths; the 226 head-on crop
// 142 px/m (the face 2.94 m wide), the windscreen's and the cover's widths; the Utebo cab side about
// 206 px/m vertically (the cantrail line 3.2 m to the body's foot 1.05 m), the side's heights.
//
// Heights over the rail; d behind the face's tip (the coupler cover's front) where it says "tip", in
// `endSweeps` and on the face, else behind the body's front end (the face's join on an end car, the
// coupling gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { singleArm } from "./czElectricKit.ts";

/** The coupling plane ahead of the cover's front (the coupler behind the closed cover). */
const REACH = 0.12;
/** Where the face meets the body: the crown 2.0 m behind the cover's front (the drawing's cab roof still rises to 2.65 m; drawn steeper, which keeps the cab side's paint cheap). */
const JOIN = 2.0;
/** Half width (2.94 m), the shoulder and the crown (4.265 m over the roof fairings). */
const W = 1.47;
const S = 3.4;
const C = 3.92;
/** The skirt's bottom and top and the belly: the white side ends at 1.05 m over the dark underframe. */
const B = 0.62;
const A = 1.0;
const Y = 1.06;
/** End car 22.4 m from the coupling plane to the joint (two of them make the 44.8 m 462), intermediate cars 17.75 m. */
const END_LENGTH = 22.4;
const MID_LENGTH = 17.75;
/** The coupling gap at every joint (the series kit's). */
const GAP = 0.25;
/** d behind the tip to d behind the end car's body front; d from an intermediate car's joint to d behind its body front. */
const body = (dTip: number) => +(dTip - JOIN).toFixed(3);
const mid = (dJoint: number) => +(dJoint - GAP).toFixed(3);

/** The side's paint heights (Utebo cab side): the purple band, the red line, the red cantrail line. */
const PURPLE: readonly [number, number] = [1.21, 1.3];
const RED_LINE: readonly [number, number] = [1.4, 1.49];
const CANTRAIL: readonly [number, number] = [3.17, 3.24];
/** The windows' sill and head (Utebo and 465-076: 1.9 - 2.84 m), the door leaves' sill and head. */
const WINDOWS: readonly [number, number] = [1.9, 2.84];

/**
 * The face's centre line (the side drawing, 13.03 px/m, and the 465-076 head-on heights): the anticlimber
 * curving back under the cover, the cover's front upright from 0.75 to 1.47 m, a step back to the red
 * frame and from there the face raked about 45 degrees - the display at 2.0 m 0.5 m back, the
 * windscreen 2.27 - 3.08 m (0.75 - 1.45 m back), the cap - rounding into the crown 2.0 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B - 0.17, 0.42], [0.58, 0.18], [0.72, 0.03], [0.8, 0], [1.47, 0], [1.52, 0.1], [1.7, 0.28],
  [2.0, 0.5], [2.7, 1.08], [3.08, 1.42], [3.4, 1.73], [3.62, 1.85], [3.8, 1.94], [C, JOIN],
];

/** The face's plan: nearly as wide as the body at the cheeks, the corners rounding and sweeping back further up; over the shoulder the face follows the body's own roof arc. */
const CORNER: Pt[] = [[B - 0.17, 0.35], [0.8, 0.3], [1.47, 0.32], [1.7, 0.42], [2.0, 0.5], [2.5, 0.7], [3.08, 0.85], [3.4, 0.9], [3.62, 0.8], [3.8, 0.5], [C, 0.2]];
const DEPTH: Pt[] = [[B - 0.17, 0.3], [1.47, 0.32], [1.7, 0.5], [2.0, 0.65], [2.5, 0.75], [3.08, 0.55], [3.4, 9], [C, 9]];
/** The profile's d at height y (linear between its points). */
const profileD = (y: number): number => {
  for (let i = 1; i < PROFILE.length; i++) {
    const [ya, da] = PROFILE[i - 1]!, [yb, db] = PROFILE[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return JOIN;
};

/** The face's own rows: the profile's heights and every paint edge. */
const ROWS = [...new Set([
  ...PROFILE.map(([y]) => y), 0.7, 1.13, 1.49, 1.92, 2.12, 2.27, 2.95, 3.18, 3.5,
])].sort((a, b) => a - b);

const mirror = (half: readonly Pt[]): Pt[] => [...half.map(([l, y]): Pt => [-l, y]).reverse(), ...half];
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The red frame's foot under the shield (465-076 and the 226 head-on): from the cover's top across the
 * middle, rising round the lamps to the face's edges, the white cheeks and corners below it.
 */
const RED_FOOT: Pt[] = mirror([[0, 1.47], [0.98, 1.47], [1.1, 1.56], [1.22, 1.72], [1.34, 1.9], [1.45, 2.05], [1.6, 2.2]]).reverse();

/**
 * The dark grey shield round the cap, the windscreen and the display (465-076, 170 px/m): its top at
 * 3.52 m, the sides 1.22 m out at the windscreen's head narrowing to 1.06 m at its foot, the chin
 * curving under the display to 1.7 m in the middle.
 */
const SHIELD: Pt[] = mirror([[0, 1.7], [0.45, 1.75], [0.82, 1.88], [1.07, 2.15], [1.2, 2.6], [1.3, 3.1], [1.27, 3.32], [1.12, 3.46], [0.88, 3.5]]).reverse();

/** The windscreen, widening upward (the 226 head-on: 1.96 m wide at its foot, 2.3 m at its head) with rounded corners. */
const GLASS: Pt[] = mirror([[0, 2.22], [0.88, 2.22], [0.97, 2.27], [1.03, 2.4], [1.12, 2.75], [1.19, 3.05], [1.18, 3.14], [1.1, 3.18]]).reverse();

export const CIVIA_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.6, reach: REACH, first: 8.75, roofFrom: C + 0.3, bulge: 0.1, tolerance: 0.04, cols: [5, 3, 1, 1],
  profile: PROFILE,
  corner: CORNER,
  // each corner reaching the full width 5 cm ahead of the join
  cornerDepth: DEPTH.map(([y, k]): Pt => [y, +Math.max(0.01, Math.min(JOIN - profileD(y) - 0.05, k)).toFixed(3)]),
  rows: ROWS,
  // the dark anticlimber, the white cover and cheeks, the red frame from the lamps up
  // (the cab's light grey roof over the frame: the body's end wall, which the face's top rows touch in the
  // join's plane, takes the same paint over the shoulder, so the two never show different colours there)
  bands: () => [[0, 0.7, "anti"], [0.7, 2.2, "white"], [2.2, 3.62, "red"], [3.62, 9, "cap"]],
  lodBands: [[0, 0.7, "anti"], [0.7, 1.49, "white"], [1.49, 3.62, "red"], [3.62, 9, "cap"]],
  lodGlass: { hw: 1.1, y: [2.22, 3.18] },
  lodPaint: [{ lat: [-0.62, 0.62], y: [1.92, 2.12], mat: "shield" }, { lat: [-1.1, 1.1], y: [3.2, 3.48], mat: "shield" }],
  fields: [
    // the red frame's foot round the lamps and over the cover
    { mat: "red", pts: [...RED_FOOT, [1.6, 2.22], [-1.6, 2.22]] },
    // the cover's red top between the cheeks
    { mat: "red", pts: mirror([[0, 1.1], [0.4, 1.12], [0.6, 1.16], [0.68, 1.22], [0.68, 1.38], [0.64, 1.45], [0.56, 1.47]]).reverse() },
    // the shield, the windscreen in it
    { mat: "shield", pts: SHIELD },
    { mat: "cabGlass", pts: GLASS },
  ],
  panes: [
    // the destination display under the windscreen
    { lat: [-0.62, 0.62], y: [1.92, 2.12], r: 0.06, mat: "display" },
  ],
  decals: [
    // the cover's seams: its top and its sides against the cheeks
    { mat: "seam", pts: box(-0.7, 0.7, 1.47, 1.49), fine: 1 },
    { mat: "seam", pts: box(-0.7, -0.68, 0.74, 1.47), fine: 1 },
    { mat: "seam", pts: box(0.68, 0.7, 0.74, 1.47), fine: 1 },
    // the Cercanias emblem on the cover's red top: a white ring
    ...Array.from({ length: 6 }, (_, i) => {
      const a0 = (i * Math.PI) / 3, a1 = ((i + 1) * Math.PI) / 3, [r0, r1, cy] = [0.06, 0.09, 1.3];
      return { mat: "white", pts: [[r0 * Math.cos(a0), cy + r0 * Math.sin(a0)], [r1 * Math.cos(a0), cy + r1 * Math.sin(a0)], [r1 * Math.cos(a1), cy + r1 * Math.sin(a1)], [r0 * Math.cos(a1), cy + r0 * Math.sin(a1)]] as Pt[], fine: 1 };
    }),
  ],
  pods: [
    // the oval headlight in the cap
    // the white cheeks standing forward on either side of the cover
    ...[1, -1].map((sd) => ({ lat: sd * 1.07, y: 1.1, w: 0.68, h: 0.72, r: 0.16, proud: 0.06, depth: 0.06, mat: "white" })),
    { lat: 0, y: 3.34, w: 0.44, h: 0.22, r: 0.11, proud: 0.015, depth: 0.04, mat: "rim", lamps: [[0, 0.09, "lampHead"]] as const },
  ],
  // the round headlight (outer, high) and tail light (inner, low) on each lower corner; the red markers in the cap's corners
  lamps: [
    ...[1, -1].flatMap((sd) => [[sd * 1.12, 1.95, 0.1, "lampHead"], [sd * 0.88, 1.68, 0.095, "lampRed"]] as const),
    [0.82, 3.38, 0.04, "lampRed"], [-0.82, 3.38, 0.04, "lampRed"],
  ],
  texts: [
    // the unit's number and its depot letter (Madrid) in the cap
    { text: "076", lat: -0.74, y: 3.24, h: 0.11, mat: "numRed" },
    { text: "M", lat: -0.45, y: 3.24, h: 0.11, mat: "numYellow" },
  ],
  // the two wipers, both parked on the right of their half
  wipers: [[[-0.62, 2.31], [-0.84, 2.98]], [[0.98, 2.31], [1.03, 2.98]]],
};

/** The red frame's rear edge on the cab side (the drawing): parallel to the face's rake, d behind the tip by height. */
const frame = (y: number) => +(0.92 + (y - 1.9) * 1.12).toFixed(3);
const edge = (k: number, ys: readonly number[]): Pt[] => ys.map((y): Pt => [y, +(frame(y) + k).toFixed(3)]);
/** The cab door (Utebo: 0.67 m wide, its front edge under the black panel's head) and the black panel's rear edge, behind the tip. */
const CAB_DOOR: readonly [number, number] = [2.45, 3.12];
const PANEL_END = 3.4;
const PANEL: readonly [number, number] = [1.88, 3.12];

/**
 * The cab end's paint on the sides (d behind the tip): white ahead of the red wedge, which leans
 * forward like the face from the red line down to the underframe, the purple band turning down behind
 * it; the red frame's back edge on the cab side, a white gap and the thin red cantrail line turning down
 * beside it to the black side panel, which holds the small cab window and the cab door's window.
 */
const SWEEPS: ShinkansenLivery["endSweeps"] = [
  // white over the side's lines ahead of the wedge and over the cantrail line ahead of its turn
  { mat: "white", front: [[PURPLE[0] - 0.01, -9], [RED_LINE[1] + 0.01, -9]], back: [[PURPLE[0] - 0.01, 0.96], [RED_LINE[1] + 0.01, 1.19]] },
  { mat: "white", front: [[CANTRAIL[0] - 0.01, -9], [CANTRAIL[1] + 0.01, -9]], back: edge(0.12, [CANTRAIL[0] - 0.01, CANTRAIL[1] + 0.01]) },
  // the red wedge (the drawing: 0.85 m long, leaning forward 37 degrees, 1.07 - 1.92 m behind the tip at
  // 1.31 m) and the purple band dropping to the underframe under the cab door
  { mat: "red", front: [[A, 0.8], [RED_LINE[1], 1.18]], back: [[A, 1.65], [RED_LINE[1], 2.03]] },
  { mat: "purple", front: [[A, 2.0], [PURPLE[0], 2.0]], back: [[A, 2.62], [PURPLE[0], 2.62]] },
  // the red frame round the face's corner, the white gap, the cantrail line turning down beside it
  { mat: "red", front: [[1.9, -9], [3.6, -9]], back: edge(0, [1.9, 3.6]), top: C + 0.3 },
  { mat: "red", front: edge(0.12, [PANEL[0], CANTRAIL[1]]), back: edge(0.19, [PANEL[0], CANTRAIL[1]]) },
  // the black side panel from the cantrail line's turn to behind the cab door
  { mat: "black", front: edge(0.19, [PANEL[0], PANEL[1]]), back: [[PANEL[0], PANEL_END], [PANEL[1], PANEL_END]] },
  // the cab door's tall narrow window
  { mat: "sideGlass", front: [[1.95, CAB_DOOR[0] + 0.1], [3.02, CAB_DOOR[0] + 0.1]], back: [[1.95, CAB_DOOR[1] - 0.1], [3.02, CAB_DOOR[1] - 0.1]] },
  // the cab door's seams under the panel
  { mat: "seam", front: [[1.08, CAB_DOOR[0]], [PANEL[0], CAB_DOOR[0]]], back: [[1.08, CAB_DOOR[0] + 0.02], [PANEL[0], CAB_DOOR[0] + 0.02]] },
  { mat: "seam", front: [[1.08, CAB_DOOR[1] - 0.02], [PANEL[0], CAB_DOOR[1] - 0.02]], back: [[1.08, CAB_DOOR[1]], [PANEL[0], CAB_DOOR[1]]] },
];

/** Renfe's Cercanias scheme as the 465-076 and 463-199 photographs show it. */
const CERCANIAS: ShinkansenLivery = {
  title: "Cercanias", number: "076",
  palette: {
    white: c("#f2f2ef", 0.35), red: c("#dc1f2a", 0.35), purple: c("#6e2a72", 0.4), roofG: c("#c3c7c9", 0.55), cantrail: c("#d6d9da", 0.45),
    skirtG: c("#3b3e41", 0.75), anti: c("#4a4d50", 0.6), shield: c("#3e4246", 0.35), black: c("#16181a", 0.3), seam: c("#8d9295", 0.5),
    display: { color: "#2a2014", metallic: 0.2, roughness: 0.15, glass: true }, sideGlass: { color: "#1b222b", metallic: 0.3, roughness: 0.08, glass: true },
    rim: c("#b9bdc0", 0.35), numRed: c("#e2401c", 0.4), numYellow: c("#f0c419", 0.4), cabMask: c("#1d1f22", 0.3),
    fairing: c("#45494d", 0.6), cap: c("#c3c7c9", 0.55), louvre: c("#2b2e31", 0.7), acGrey: c("#a9aeb1", 0.5), grille: c("#5d6266", 0.6), step: c("#9ea3a6", 0.5),
  },
  bands: [
    [0, A, "skirtG"], [A, PURPLE[0], "white"], [PURPLE[0], PURPLE[1], "purple"], [PURPLE[1], RED_LINE[0], "white"], [RED_LINE[0], RED_LINE[1], "red"],
    [RED_LINE[1], CANTRAIL[0], "white"], [CANTRAIL[0], CANTRAIL[1], "red"], [CANTRAIL[1], 3.3, "white"], [3.3, S, "cantrail"], [S, 9, "cap"],
  ],
  doors: [[0, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: SWEEPS,
};

/** Body spans [d0, d1] of a double door centred at d, its two 0.7 m leaves parting (1.3 m clear). */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.7, d, -1], [d, d + 0.7, 1]];
/** Windows of 1.3 m with 0.3 m pillars, starting at each d. */
const wins = (...ds: number[]): Array<readonly [number, number]> => ds.map((d) => [+d.toFixed(3), +(d + 1.3).toFixed(3)] as const);

/**
 * The end car (the side drawing, behind the tip): the cab's black panel and door, three windows, a door
 * 9.45 m behind the tip, four windows, a door at 17.8 m, two windows to the joint (22.28 m).
 */
const END: SeriesLayout = {
  doors: [...door(body(9.45)), ...door(body(17.8))],
  windows: wins(...[3.8, 5.4, 6.9, 10.575, 12.175, 13.775, 15.375, 18.95, 20.55].map(body)),
};
/** An intermediate car (the drawing, from its front joint): two windows, a door 4.725 m in, four windows, a door at 13.025 m, two windows; symmetric. */
const MIDDLE: SeriesLayout = {
  doors: [...door(mid(4.725)), ...door(mid(13.025))],
  windows: wins(...[0.6, 2.2, 5.825, 7.425, 9.025, 10.625, 14.25, 15.85].map(mid)),
};

/** The raised pantograph over the A3 car's front end, the folded one over its rear end (the drawing), on the body. */
const PANTO_D = 1.7;
const MID_BODY = MID_LENGTH - 2 * GAP;

/** The roof's fairings and air conditioning, the cab roof, the door steps and the underfloor. */
function civiaFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  /**
   * A louvred fairing over the roof (465-076, Utebo): a dark grey hood with sloping sides from the roof's
   * edges to a flat top 0.25 m over the crown, three louvres along each sloping side.
   */
  const fairing = (d0: number, d1: number) => m.scope("fairing", () => {
    const [x0, x1] = [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))];
    // counter-clockwise seen from above (+y): a negative shoelace area in (x, z)
    const ring = (a: number, e: number, hw: number): Array<[number, number]> => [[a, -hw], [a, hw], [e, hw], [e, -hw]];
    m.loft("fairing", ring(x0, x1, 1.15), S + 0.3, ring(x0 + 0.12, x1 - 0.12, 0.85), C + 0.25);
    for (let i = 0; i < 3; i++) {
      const t = (i + 0.5) / 3, y = S + 0.3 + t * (C - 0.05 - S), hw = 1.15 - t * 0.3;
      for (const sd of [1, -1]) block(m, "louvre", x0 + 0.25, x1 - 0.25, y - 0.025, y + 0.025, sd > 0 ? hw - 0.07 : -hw - 0.005, sd > 0 ? hw + 0.005 : -hw + 0.07);
    }
  });
  /** An air-conditioning unit between the fairings: a light grey box with a grille on each side. */
  const ac = (d0: number, d1: number) => m.scope("air conditioning", () => {
    at("acGrey", d0, d1, C - 0.06, C + 0.32, -0.95, 0.95);
    for (const sd of [1, -1]) at("grille", d0 + 0.25, d1 - 0.25, C + 0.04, C + 0.26, sd > 0 ? 0.95 : -0.96, sd > 0 ? 0.96 : -0.95);
  });
  m.scope("roof equipment", () => {
    if (car.end) {
      // the light grey cab roof behind the red frame, then a fairing, the air conditioning, a fairing to the joint
      fairing(body(3.6), body(11.35));
      ac(body(11.65), body(15.05));
      fairing(body(15.35), L - 0.25);
    } else {
      // low plinths over the joints (the pantographs' on the A3 car), the fairings, the air conditioning
      for (const [d0, d1] of [[0.2, 2.9], [L - 2.9, L - 0.2]] as const) at("fairing", d0, d1, C - 0.04, C + 0.1, -0.95, 0.95);
      fairing(3.0, 7.1);
      ac(7.4, 9.85);
      fairing(10.15, L - 3.0);
    }
  });
  m.scope("door steps", () => {
    // the sliding step under every door
    const ds = car.end ? [body(9.45), body(17.8)] : [mid(4.725), mid(13.025)];
    for (const d of ds) for (const sd of [1, -1]) at("step", d - 0.72, d + 0.72, A - 0.08, A + 0.02, sd > 0 ? W * 0.93 : -W - 0.02, sd > 0 ? W + 0.02 : -W * 0.93);
  });
  m.scope("underfloor", () => {
    // the end car's equipment between its bogies, an intermediate car's in its middle
    if (car.end) { at("skirtG", body(7.4), body(10.6), 0.42, A - 0.02, -1.1, 1.1); at("skirtG", body(11.2), body(16.4), 0.42, A - 0.02, -1.15, 1.15); }
    else at("skirtG", L / 2 - 4.0, L / 2 + 4.0, 0.42, A - 0.02, -1.1, 1.1);
  });
}

/** The folded pantograph over the A3 car's rear end, on its own plinth (the raised one stands over the front end). */
function civiaPantographs(m: MeshBuilder, x: number, Cr: number): void {
  const x2 = x - (MID_BODY - 2 * PANTO_D);
  m.scope("rear pantograph", () => {
    block(m, "roofG", x2 - 1.6, x2 + 1.6, Cr - 0.06, Cr + 0.05, -0.85, 0.85);
    singleArm(m, { xc: x2, roofY: Cr + 0.05, baseY: Cr + 0.3, h: -1, raised: false });
  });
}

export const CIVIA: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CIVIA_FACE,
  windows: [WINDOWS], windowW: 1.3, pitch: 1.6,
  // the 1.3 m sliding plug doors (1.4 m over the leaves), a narrow window in each leaf
  door: [1.08, 3.12, 1.86, 2.86], doorW: 1.4, doorGlassW: 0.3,
  layout: { end: END, middle: MIDDLE },
  // the trailer bogie (BR) 5.05 m behind the tip, the motor bogies (BM) under the joints; 2.3 m wheelbase, 850 mm wheels
  jacobs: true, endBogies: [body(5.05), 0], bogieCentres: 17.2, wheelR: 0.425, wheelbase: 2.3,
  // the A3 car carries the pantographs: the middle car of three, the third car of four and five
  pantographCars: (n) => (n === 4 ? [2] : undefined), pantographAt: PANTO_D, pantographFittings: civiaPantographs,
  lodRoof: { d: [3.6, 22.0], hw: 1.1, y: [C - 0.06, C + 0.25], mat: "fairing" },
  fittings: civiaFittings,
  numberAt: [-6.6, 2.95, 0.14],
  cars: [3, 4, 5],
  liveries: { cercanias: CERCANIAS },
  // 80 t with two cars, 157.3 t with five: end cars 40 t, intermediate cars 26 t; 2,200 kW for five cars
  weight: { end: 40, middle: 26 }, power: 440, maxspeed: 120,
};
