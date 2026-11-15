// The Delhi Metro RS1 (Mitsubishi / Hyundai Rotem / BEML, 2002+), the broad-gauge stock of the
// Red, Yellow and Blue Lines, drawn on the series kit (shinkansen.ts) with its own cab face
// (seriesCab.ts): 3.2 m wide stainless-steel cars, four double sliding doors a side with a tall
// window in each leaf, one wide window between the doors and a narrow one at each car end, the
// line's stripe under the windows; the grey cab front with the emergency door in its middle (the
// DMRC emblem and the line's number on it), a tall black field either side holding the windscreen,
// the destination display over it and the red lamp housing under it. Matched to the photographs in
// assets/dmrc-rs1/ (SOURCES.md). See docs/models/india-trains.md.
//
// Heights over the rail; d behind the face's tip (the bumper band's front, 1.3 m up) on the face,
// else d behind the body's front end (the face's join on the end car, the gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body's own section: the top of the face rounds into the roof this far behind the tip. */
const JOIN = 0.95;
/** The crown over the rail, without the air conditioners (the MTR K-stock sister: 3.698 m; the front photographs: 3.75 - 3.8 m). */
const C = 3.75;

/**
 * The face's centre line (the front three-quarter photographs at about 235 px/m on the vertical): the
 * apron under the coupler 0.15 m back, the bumper band's front at 1.3 m, the face leaning back gently
 * past the lamp housings and the windscreens (0.22 m at the black fields' head, 3.4 m), then rounding
 * over into the roof.
 */
const PROFILE: Pt[] = [
  [0.8, 0.16], [0.95, 0.07], [1.1, 0.02], [1.3, 0], [1.45, 0.02], [1.8, 0.06], [2.4, 0.12], [3.0, 0.18], [3.4, 0.23],
  [3.55, 0.29], [3.64, 0.38], [3.7, 0.5], [3.735, 0.66], [C, JOIN],
];

/** The black fields: their bottom and head, inner and outer edge (half widths). */
const FIELD = { y0: 1.53, y1: 3.4, l0: 0.57, l1: 1.3 };
/** The emergency door: its half width, foot and head. */
const DOOR = { hw: 0.53, y0: 1.38, y1: 3.42 };
/** The lamp housing under each windscreen: centre height, width and height. */
const LAMP = { y: 1.72, w: 0.62, h: 0.27 };

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.17, 1.38, FIELD.y0, 1.6, 1.74, 2.05, 2.5, 3.0, 3.06, 3.28])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The DMRC emblem on the emergency door: a red ring round a Z - the top and bottom
 * bars reaching the ring, joined by the diagonal (the photographs: centre 2.5 m, ring 0.6 m across, 0.065 m wide).
 */
const LOGO = { y: 2.5, r: 0.3, t: 0.065 };
function emblem(): Pt[][] {
  const out: Pt[][] = [];
  const n = 20, [r0, r1] = [LOGO.r - LOGO.t, LOGO.r];
  for (let i = 0; i < n; i++) {
    const [a, e] = [(2 * Math.PI * i) / n, (2 * Math.PI * (i + 1)) / n];
    out.push([[r0 * Math.cos(a), LOGO.y + r0 * Math.sin(a)], [r1 * Math.cos(a), LOGO.y + r1 * Math.sin(a)], [r1 * Math.cos(e), LOGO.y + r1 * Math.sin(e)], [r0 * Math.cos(e), LOGO.y + r0 * Math.sin(e)]]);
  }
  // the two bars of the Z, ring to ring, and its diagonal from the top bar's right to the bottom bar's left
  const bar = (y: number) => { const h = Math.sqrt(r0 * r0 - y * y) + 0.01; out.push(box(-h, h, LOGO.y + y - 0.025, LOGO.y + y + 0.025)); };
  bar(0.07); bar(-0.07);
  out.push([[0.1, LOGO.y + 0.035], [0.16, LOGO.y + 0.035], [-0.1, LOGO.y - 0.035], [-0.16, LOGO.y - 0.035]]);
  return out;
}

/** The door's outline: a dark seam round it, standing as decals on the face. */
const SEAM = 0.022;
const doorSeams = (): Pt[][] => [
  box(-DOOR.hw - SEAM, -DOOR.hw, DOOR.y0, DOOR.y1), box(DOOR.hw, DOOR.hw + SEAM, DOOR.y0, DOOR.y1),
  box(-DOOR.hw - SEAM, DOOR.hw + SEAM, DOOR.y1, DOOR.y1 + SEAM), box(-DOOR.hw - SEAM, DOOR.hw + SEAM, DOOR.y0 - SEAM, DOOR.y0),
];

export const RS1_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.75, reach: 0.25, first: 2.45, roofFrom: 3.72, bulge: 0.05, tolerance: 0.02,
  profile: PROFILE,
  // the face flat across, its corners rounding back about 0.3 m into the sides, more under the roof
  corner: [[0.8, 0.32], [1.3, 0.3], [3.2, 0.32], [3.45, 0.42], [3.62, 0.5], [3.7, 0.42], [C, 0.25]],
  cols: [6, 4, 1, 1],
  rows: ROWS,
  // the face is the body's grey all over: the line's stripe ends at the corners
  bands: () => [[0, 9, "b0"]],
  lodBands: [[0, 9, "b0"]],
  lodGlass: { hw: 1.25, y: [2.05, 3.0] },
  fields: [
    // the coupler's recess in the apron under the bumper band
    { mat: "black", pts: box(-0.42, 0.42, 0.8, 1.12) },
  ],
  masks: [
    // the two tall black fields, their outer top corners rounded with the face
    { lat: [-FIELD.l1, -FIELD.l0], y: [FIELD.y0, FIELD.y1], r: 0.12, mat: "cabMask" },
    { lat: [FIELD.l0, FIELD.l1], y: [FIELD.y0, FIELD.y1], r: 0.12, mat: "cabMask" },
  ],
  panes: [
    { lat: [-1.24, -0.62], y: [2.05, 3.0], r: 0.05 }, { lat: [0.62, 1.24], y: [2.05, 3.0], r: 0.05 },
    // the destination displays over the windscreens
    { lat: [-1.14, -0.72], y: [3.07, 3.27], r: 0.02, mat: "display" }, { lat: [0.72, 1.14], y: [3.07, 3.27], r: 0.02, mat: "display" },
  ],
  decals: [
    ...doorSeams().map((pts) => ({ mat: "rubber", pts })),
    ...emblem().map((pts) => ({ mat: "red", pts, fine: 1 })),
  ],
  // the red-framed lamp housings at the black fields' foot: the tail light outboard, the headlight inboard
  pods: [
    ...[1, -1].map((sd) => ({ lat: sd * 0.935, y: LAMP.y, w: LAMP.w, h: LAMP.h, r: 0.08, proud: 0.015, depth: 0.04, mat: "lampFrame", lamps: [[sd * 0.15, 0.07, "lampRed"], [-sd * 0.09, 0.065, "lampHead"]] as const })),
    // the bumper band across the face under the door, standing out of the bodywork
    { lat: 0, y: 1.25, w: 2.3, h: 0.17, r: 0.05, proud: 0.04, depth: 0.05, mat: "bumper", level: true },
    // the amber marker light over the door
    { lat: 0, y: 3.52, w: 0.3, h: 0.07, r: 0.03, proud: 0.01, depth: 0.03, mat: "marker" },
  ],
  // the line's number on the door, under the emblem
  texts: [{ text: "1", lat: 0, y: 1.6, h: 0.42, mat: "red" }],
  // one wiper each, parked from the windscreen's foot
  wipers: [[[-0.88, 2.08], [-0.72, 2.82]], [[0.88, 2.08], [0.72, 2.82]]],
};

/** The RS1's stainless steel; the Red Line's red stripe under the windows (the side photograph: 1.6 - 1.74 m). */
const STAINLESS = "#bfc3c6";
function rs1Livery(): ShinkansenLivery {
  return {
    title: "DMRC", number: "TS 01",
    palette: {
      b0: { color: STAINLESS, metallic: 0.55, roughness: 0.35 }, b1: c("#d8434a", 0.45),
      roofG: c("#a6abaf", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#17191b", 0.3),
      black: c("#141618", 0.4), red: c("#d6343c", 0.45), bumper: c("#9fa4a8", 0.5), lampFrame: c("#d23a44", 0.4),
      marker: c("#ff8a24", 0.3), display: { color: "#4a2a12", metallic: 0.2, roughness: 0.15, glass: true },
      acGrey: c("#b4b8bb", 0.5), grille: c("#3a3e42", 0.7), under: c("#2e3134", 0.8), frameDark: c("#2b2e31", 0.6),
    },
    bands: [[0, 1.6, "b0"], [1.6, 1.74, "b1"], [1.74, 9, "b0"]],
    roof: "roofG", skirt: "skirtG",
  };
}

/** A double sliding door centred at d: two 0.9 m leaves parting from its middle. */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.9, d, -1], [d, d + 0.9, 1]];

/**
 * The cars' layout (the Red Line side photograph, a 1-D projective fit over the four door centres of a
 * motor car, the door pitch 5.11 m): a narrow window 1.08 - 1.52 m from each end, four doors 1.8 m wide
 * 2.75 m from the ends, a 1.75 m window centred between each pair. The end car's first door stands
 * 2.45 m behind the tip (0.65 m of plain side behind the face's corner, the front photographs).
 */
const MID_BODY = 21.34 - 0.5;
const PITCH = (MID_BODY - 2 * 2.75) / 3;
const MID_DOORS = [0, 1, 2, 3].map((i) => 2.75 + i * PITCH);
const between = (a: number, e: number): readonly [number, number] => [(a + e) / 2 - 0.875, (a + e) / 2 + 0.875];
const END_LENGTH = 21.84;
/** The end car's body behind the face's join: over couplers less the face, its reach and the inner gap. */
const END_BODY = END_LENGTH - JOIN - 0.25 - 0.25;
const END_DOORS = [0, 1, 2, 3].map((i) => 2.45 - JOIN + i * PITCH);

export const RS1_LAYOUT: NonNullable<ShinkansenSeries["layout"]> = {
  end: {
    doors: END_DOORS.flatMap(door),
    windows: [between(END_DOORS[0]!, END_DOORS[1]!), between(END_DOORS[1]!, END_DOORS[2]!), between(END_DOORS[2]!, END_DOORS[3]!), [END_BODY - 1.52, END_BODY - 1.08]],
  },
  middle: {
    doors: MID_DOORS.flatMap(door),
    windows: [[1.08, 1.52], between(MID_DOORS[0]!, MID_DOORS[1]!), between(MID_DOORS[1]!, MID_DOORS[2]!), between(MID_DOORS[2]!, MID_DOORS[3]!), [MID_BODY - 1.52, MID_BODY - 1.08]],
  },
};

/** The roof's air conditioners, the rain strips over the doors and the underfloor equipment of a car. */
function rs1Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const L = car.length;
  // two packaged units on the crown, a quarter in from each end: grey boxes with a grille down each side
  const ac = (dc: number) => m.scope("air conditioner", () => {
    const [d0, d1] = [dc - 1.6, dc + 1.6];
    at("acGrey", d0, d1, C - 0.06, C + 0.3, -0.82, 0.82);
    for (const sd of [1, -1]) at("grille", d0 + 0.2, d1 - 0.2, C + 0.04, C + 0.24, sd > 0 ? 0.82 : -0.83, sd > 0 ? 0.83 : -0.82);
    for (const z of [-0.4, 0.4]) for (const k of [0.25, 0.75]) at("grille", d0 + (d1 - d0) * k - 0.32, d0 + (d1 - d0) * k + 0.32, C + 0.3, C + 0.31, z - 0.3, z + 0.3);
  });
  m.scope("roof equipment", () => {
    if (car.end) { ac(4.9 - JOIN); ac(L - 5.6); }
    else { ac(5.6); ac(L - 5.6); }
  });
  // the rain strip along the roof's edge over the doors
  m.scope("rain strips", () => {
    for (const sd of [1, -1]) sidePanel(m, b, X, sd, "b0", 0.1, L - 0.1, 3.16, 3.2, 0.03, 0.02);
  });
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    const span = (a: number, e: number, hw: number, mat = "under") => at(mat, a, e, 0.42, 0.9, -hw, hw);
    // the traction converter, transformer or auxiliary boxes between the bogies, the air tanks beside them
    span(t0 + 2.0, t0 + 5.6, 1.15);
    span(t0 + 6.0, t1 - 4.2, 1.2);
    span(t1 - 3.9, t1 - 2.0, 1.05);
  });
}

export const DELHI_METRO: ShinkansenSeries = {
  // 21.84 m end and 21.34 m intermediate cars over the couplers, 3.2 m wide (en.wikipedia "Delhi Metro")
  endLength: END_LENGTH, midLength: 21.34, W: 1.6, Y: 1.15, S: 3.25, C, lean: 0.985, B: 0.8, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: RS1_FACE,
  // the side photograph at about 200 px/m by the 1.95 m doors: floor 1.1 m, windows 2.05 - 2.95 m, a tall window in each leaf
  windows: [[2.05, 2.95]], windowW: 1.75, pitch: PITCH, door: [1.1, 3.05, 2.05, 2.95], doorW: 1.8, doorCount: 4, doorGlassW: 0.45, doorGlassR: 0.07,
  layout: RS1_LAYOUT,
  // bogies 3.1 m in from the coupler at the cab and from each end of the bodies; 860 mm wheels, 2.5 m wheelbase (the K-stock sister)
  bogieCentres: 14.64, wheelR: 0.43, wheelbase: 2.5,
  endBogies: [3.1 - JOIN - 0.25, 3.1 - JOIN - 0.25 + 14.64], midBogies: [2.85, MID_BODY - 2.85],
  // the single-arm pantographs on the motor cars next to the driving trailers, over the rear bogie behind the air conditioner
  pantographsBesideEnds: true, pantographAt: MID_BODY - 2.3,
  fittings: rs1Fittings,
  cars: [4, 6, 8],
  liveries: { dmrc: rs1Livery() },
  weight: { end: 42, middle: 40 }, power: 500, maxspeed: 80,
};

const PARAMS = seriesParams(DELHI_METRO);

export function dmrcRs1(v?: ParamValues): MeshBuilder { return buildSeries(DELHI_METRO, PARAMS, v); }
export function dmrcRs1Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(DELHI_METRO, PARAMS, v); }
