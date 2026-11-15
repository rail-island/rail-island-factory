// The NS Mat '54 "Hondekop" (dog's head): the two-car (ElD-2, Bo'2' + 2'Bo') and four-car (ElD-4,
// Bo'Bo' + 2'2' + 2'2' + Bo'Bo') electric units of 1956 - 1962, on the series kit (shinkansen.ts)
// with its own cab face (seriesCab.ts): the low, round bonnet standing 1.7 m ahead of the raised
// cab, its top rising gently to the foot of the raked three-pane windscreen, the dark roof cap with
// its two marker lamps, the big headlights in their housings and the black chin hanging under the
// bonnet round the Scharfenberg coupler. The leading end car is the baggage car (BDk / ABDk) with
// its pantograph behind the cab; the rear end car of a train is the Bk, whose pantograph stands
// over its inner end; the middle cars are the ElD-4's trailers. Matched to the photographs and
// figures in assets/ns-mat54/ (SOURCES.md): the side-on works photographs of unit 790 (BDk, A and
// B cars), the museum units 386 (head-on) and 766 (three-quarter), 341 and 351 (the ElD-2 in the
// 1950s green), 777 and the Deventer photograph (the yellow scheme). See
// docs/models/netherlands-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the bonnet's front); elsewhere d behind the
// tip too where it says "tip", else behind the body's front end (the face's join, JOIN behind the tip).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the cab roof at full height, just ahead of the cab door. */
const JOIN = 2.7;
/** The coupler's face ahead of the bonnet. */
const REACH = 0.3;
/** Lengths over the couplers: the ElD-2 51.12 m (two end cars), the ElD-4 99.26 m (de.wikipedia "NS-Baureihe Mat '54"). */
const END_LENGTH = 25.56;
const MID_LENGTH = 24.07;
/** The end car's body from the bonnet's front to its inner end (the coupling gap 0.25 m behind it). */
const TIP_TO_END = END_LENGTH - REACH - 0.25;
const MID_BODY = MID_LENGTH - 0.5;
/** The crown, the shoulder (the roof's dark paint from there), the body's bottom edge and the chin's foot. */
const C = 3.92;
const S = 3.6;
const A = 0.9;
const B = 0.75;

/**
 * The bonnet and cab in profile, measured on the side-on photograph of BDk 790 (77.5 px/m, the motor
 * bogie's 3.5 m wheelbase and the 3.92 m crown): upright from the body's foot to the lamps, rounding
 * over to the bonnet's top, which rises gently from 0.9 m to the windscreen's foot 1.67 m behind the
 * tip at 2.84 m; the windscreen raked back to 2.05 m at its head (3.41 m), the roof cap rounding into
 * the crown 2.7 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.02], [A, 0], [1.75, 0], [2.0, 0.05], [2.2, 0.13], [2.37, 0.25], [2.55, 0.45], [2.66, 0.65], [2.74, 0.9],
  [2.8, 1.25], [2.84, 1.67], [3.41, 2.05], [3.6, 2.22], [3.75, 2.39], [3.85, 2.53], [C, JOIN],
];

/** The three front panes in their aluminium frames (head-on, the museum unit 386) and the corner panes wrapping round onto the cab sides. */
const PANES: ReadonlyArray<{ lat: readonly [number, number]; y: readonly [number, number] }> = [
  { lat: [-0.52, 0.52], y: [2.92, 3.37] },
  { lat: [0.61, 1.1], y: [2.9, 3.35] }, { lat: [-1.1, -0.61], y: [2.9, 3.35] },
];
/** The cab side window behind the corner, its front edge raked with the windscreen ([y, d] behind the tip) (painted glass). */
const SIDE_GLASS = { front: [[2.9, 2.08], [3.3, 2.3]] as Pt[], back: [[2.9, 2.6], [3.3, 2.6]] as Pt[] };
const FRAME = 0.05;

/** The face's paint boundaries and fittings' heights, as grid rows. */
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.01, 1.14, 1.27, 1.47, 1.72, 2.86, 3.38, 3.42, 3.47])].sort((a, b) => a - b);

export const MAT54_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 2.65, reach: REACH, first: 2.76, roofFrom: 3.47, bulge: 0.06, cols: [5, 2, 1, 1], tolerance: 0.04,
  profile: PROFILE,
  // the bonnet round in plan, its shoulders rounding back over the top; the cab's corners tighter round the corner panes
  corner: [[B, 0.72], [1.5, 0.75], [2.0, 0.85], [2.4, 1.0], [2.74, 1.05], [2.84, 0.7], [3.0, 0.6], [3.4, 0.58], [3.6, 0.5], [3.75, 0.35], [C, 0.05]],
  cornerDepth: [[B, 1.0], [1.5, 1.1], [2.0, 1.2], [2.4, 1.2], [2.74, 0.9], [2.84, 0.55], [3.0, 0.5], [3.4, 0.45], [3.6, 0.33], [3.75, 0.2], [C, 0.02]],
  rows: ROWS,
  paint: [{ mat: "cabGlass", ...SIDE_GLASS, top: 3.31 }],
  masks: PANES.map((p) => ({ lat: [p.lat[0] - FRAME, p.lat[1] + FRAME] as const, y: [p.y[0] - FRAME, p.y[1] + FRAME] as const, r: 0.05, mat: "frameSilver" })),
  panes: PANES.map((p) => ({ lat: p.lat, y: p.y, r: 0.03 })),
  // the big headlights in their round housings standing out of the bonnet
  pods: [
    ...[-0.68, 0.68].map((lat) => ({ lat, y: 1.47, w: 0.4, h: 0.4, r: 0.2, proud: 0.09, depth: 0.12, mat: "lampRim", lamps: [[0, 0.16, "lampHead"] as const] })),
    // the oval plate between them carrying the number (barely proud: the number lies on the skin in front of it)
    { lat: 0, y: 1.47, w: 0.3, h: 0.58, r: 0.15, proud: 0.002, depth: 0.03, mat: "plate" },
  ],
  // the two marker lamps on the roof cap over the windscreen
  // and the upper headlight on the bonnet's top (most units from the 1960s, the museum unit 766)
  lamps: [[-0.48, 3.6, 0.075, "lampHead"], [0.48, 3.6, 0.075, "lampHead"], [0, 2.45, 0.07, "lampHead"]],
  // the running number on the plate between the headlights
  number: { lat: -0.075, y: 1.36, h: 0.09, mat: "faceNo" },
  wipers: [[[-0.25, 2.97], [0.1, 3.3]], [[0.75, 2.95], [0.95, 3.28]], [[-0.95, 2.95], [-0.75, 3.28]]],
};

const NS_YELLOW = "#ffc917";
const COMMON = { frameSilver: c("#b9bdc0", 0.3), roofG: c("#2e3133", 0.6), skirtG: c("#1d1e1f", 0.8), cabMask: c("#1d1f22", 0.3) };
/** A rounded rectangle [lat0, lat1] x [y0, y1] with ends of radius r, as a polygon (k + 1 points a corner). */
function stadium(l0: number, l1: number, y0: number, y1: number, r: number, k = 3): Pt[] {
  const out: Pt[] = [];
  for (const [cx, cy, a0] of [[l1 - r, y0 + r, -90], [l1 - r, y1 - r, 0], [l0 + r, y1 - r, 90], [l0 + r, y0 + r, 180]] as const)
    for (let j = 0; j <= k; j++) { const a = ((a0 + (90 / k) * j) * Math.PI) / 180; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}

/**
 * The 1950s green as the museum units 386 and 766 wear it: green over the black underframe, thin
 * cream lines along the sill and under the dark grey roof, and the cream "moustache" on the bonnet -
 * the band through the headlights tapering back along the cab sides to a point before the cab door,
 * and under it the cream V over the sill line; the NS plate with the number between the lamps.
 */
const GREEN: ShinkansenLivery = {
  title: "NS green", number: "766",
  palette: { ...COMMON, green: c("#17704a", 0.35), cream: c("#e9dcae", 0.4), lampRim: c("#0f5a39", 0.35), plate: c("#e9dcae", 0.35), faceNo: c("#103b29", 0.4) },
  bands: [[0, A, "green"], [A, 0.97, "cream"], [0.97, 3.52, "green"], [3.52, 9, "cream"]],
  front: [[0, A, "skirtG"], [A, 1.01, "cream"], [1.01, 3.42, "green"], [3.42, 9, "cream"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [{ mat: "cream", face: true, front: [[1.27, -9], [1.72, -9]], back: [[1.27, 0.55], [1.5, 1.2], [1.72, 2.4]] }],
  faceFields: [
    // the V under the band, its point on the sill line
    { mat: "cream", pts: [[-0.68, 1.14], [0.68, 1.14], [0, A + 0.02]] },
    // the plate: the emblem ring and the number's dark disc on it
  ],
};

/** NS yellow (from 1968; 777 and the Deventer photograph): yellow all over the body, the dark grey roof and underframe, the grey moustache band through the headlights. */
const YELLOW: ShinkansenLivery = {
  title: "NS yellow, grey", number: "786",
  palette: { ...COMMON, yellow: c(NS_YELLOW, 0.4), snor: c("#4a4e52", 0.45), plate: c("#3f4347", 0.45), lampRim: c("#3a3d40", 0.45), faceNo: c("#f2f2ee", 0.4) },
  bands: [[0, 9, "yellow"]],
  front: [[0, A, "skirtG"], [A, 9, "yellow"]],
  roof: "roofG", skirt: "skirtG",
  faceFields: [{ mat: "snor", pts: stadium(-0.98, 0.98, 1.29, 1.65, 0.18) }],
};

/** Body spans of a door's two leaves, from its front edge (tip d) on the end car, each 0.8 m. */
const leaves = (d0: number, dTip = 0): Array<readonly [number, number, number]> => [[d0 - dTip, d0 + 0.8 - dTip, -1], [d0 + 0.8 - dTip, d0 + 1.6 - dTip, 1]];
const win = (d0: number, w: number, dTip = 0): readonly [number, number] => [d0 - dTip, d0 + w - dTip];
/** A row of n windows w wide at this pitch, from d0. */
const rowOf = (d0: number, n: number, w = 1.3, pitch = 1.85, dTip = 0): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => win(d0 + i * pitch, w, dTip));
/** The inner end's passenger door of an end car: 0.94 - 2.54 m from the body's end (the BDk / B photograph). */
const INNER_DOOR = TIP_TO_END - 2.54;

/**
 * The leading end car, the baggage car (BDk of 790, measured side-on, tip d): the cab door, a small
 * window, the double baggage door with a window in each leaf, two more small windows, then the
 * passengers' five windows to the door at the inner end.
 */
const END_LAYOUT: SeriesLayout = {
  doors: [...leaves(6.6, JOIN), ...leaves(INNER_DOOR, JOIN)],
  windows: [win(4.98, 0.65, JOIN), win(9.47, 0.63, JOIN), win(11.9, 0.63, JOIN), ...rowOf(INNER_DOOR - 0.35 - 1.3 - 4 * 1.85, 5, 1.3, 1.85, JOIN)],
};
/** The rear end car, the Bk (351, 341): the cab door, two windows, a passenger door, seven windows and the door at the inner end. */
const REAR_LAYOUT: SeriesLayout = {
  doors: [...leaves(7.55, JOIN), ...leaves(INNER_DOOR, JOIN)],
  windows: [...rowOf(4.0, 2, 1.3, 1.85, JOIN), ...rowOf(INNER_DOOR - 0.35 - 1.3 - 6 * 1.85, 7, 1.3, 1.85, JOIN)],
};
/** The ElD-4's trailers (the A and B cars of 790): a door at each end, nine windows between. */
const MID_LAYOUT: SeriesLayout = {
  doors: [...leaves(0.9), ...leaves(MID_BODY - 2.5)],
  windows: rowOf((MID_BODY - (8 * 1.85 + 1.3)) / 2, 9),
};

/** The black chin hanging under the bonnet round the coupler, its plan rounded like the bonnet's. */
function chin(m: MeshBuilder, X: (d: number) => number): void {
  // wound as ngon() winds (from +z round the front to -z): the back edge, the rounded front corners
  const ring = (front: number, back: number, hw: number, r: number): Ring => {
    const [xf, xb, k] = [X(front - JOIN), X(back - JOIN), 6];
    const out: Ring = [[xb, hw]];
    for (let j = 0; j <= k; j++) { const a = (Math.PI / 2) * (1 - j / k); out.push([xf - r + r * Math.cos(a), hw - r + r * Math.sin(a)]); }
    for (let j = 0; j <= k; j++) { const a = -(Math.PI / 2) * (j / k); out.push([xf - r + r * Math.cos(a), -(hw - r) + r * Math.sin(a)]); }
    out.push([xb, -hw]);
    return out;
  };
  // tip d of its front, its back, half width and the corners' radius at its foot and inside the face
  const lo = ring(0.18, 1.85, 0.95, 0.55), hi = ring(0.06, 1.85, 1.36, 0.7);
  m.loft("skirtG", lo, 0.3, hi, B + 0.05);
  m.cap("skirtG", lo, 0.3, false);
}

function mat54Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("chin", () => chin(m, X));
  // the Scharfenberg coupler standing out of the chin's recess: its shank and head (tip d -REACH at its face)
  if (car.end) m.scope("coupler", () => {
    const x = (d: number) => X(d - JOIN);
    block(m, "steel", Math.min(x(-0.12), x(0.3)), Math.max(x(-0.12), x(0.3)), 0.56, 0.66, -0.07, 0.07);
    block(m, "steel", Math.min(x(-REACH), x(-0.12)), Math.max(x(-REACH), x(-0.12)), 0.47, 0.75, -0.17, 0.17);
  });
  m.scope("underfloor", () => {
    // the resistors and the switchgear between the bogies
    const [t0, t1] = car.trucks as [number, number];
    block(m, "under", Math.min(X(t0 + 2.6), X(t1 - 2.6)), Math.max(X(t0 + 2.6), X(t1 - 2.6)), B - 0.4, B + 0.02, -1.1, 1.1);
  });
}

export const MAT54: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W: 1.47, Y: 1.2, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: MAT54_FACE,
  // the window row 2.15 - 3.17 m, 1.3 m wide at 1.85 m (the B car); the doors' two 0.8 m leaves, a window in each
  windows: [[2.15, 3.17]], windowW: 1.3, pitch: 1.85, door: [1.0, 3.32, 2.15, 3.15], doorW: 1.6, doorGlassW: 0.55,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  rearEnd: { layout: REAR_LAYOUT, rearPantographD: TIP_TO_END - 2.2 },
  sidePanels: {
    // the cab door: its outline and its window (tip d)
    end: [
      { d: [2.76, 3.47], y: [1.0, 3.41], kind: "seam" },
      { d: [2.9, 3.33], y: [2.18, 3.08], kind: "window" },
    ],
  },
  // the motor bogie under the cab 4.37 m behind the tip (3.5 m wheelbase), the trailer bogie 3.3 m in from the inner end
  bogieCentres: 17.0, wheelR: 0.5, wheelbase: 3.2, endBogies: [4.37 - JOIN, TIP_TO_END - 3.3 - JOIN], midBogies: [3.3, MID_BODY - 3.3],
  // the diamond pantograph behind the cab of the leading end car; the rear one folded
  pantograph: "diamond", pantographD: 4.9, endPantograph: true, trailingLowered: true,
  couplerY: 0.62, cars: [2, 4],
  fittings: mat54Fittings,
  liveries: { green: GREEN, yellowGrey: YELLOW },
  // ElD-2 110 t and 680 kW, ElD-4 210 t (two motor cars and two trailers)
  weight: { end: 55, middle: 50 }, power: 340, maxspeed: 140,
};
