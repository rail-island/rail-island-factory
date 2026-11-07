// Japanese conventional-line electric units on the series kit (shinkansen.ts):
// JR East's E235 (the Yamanote line, 2015) and JNR's 103 series commuter cars
// (1963), Odakyu's Romancecar GSE (2018), Kintetsu's Hinotori (2020), the E259
// Narita Express (2009), JNR's 485 series bonnet-nosed express (1964) and the
// Hankyu 9000 series (2006). Each
// an end car, a middle car and a train of 3 - 8. Their narrow-gauge (1,067 mm)
// bodies keep their real 2.8 - 2.95 m width within the UIC gauge, on the game's
// standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge").
// See docs/models/jp-emus.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import type { Ring } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { pilotPlate } from "./carbodyKit.ts";
import { centreCoupler } from "./emuParts.ts";
import { loftHalves } from "./sliceLoft.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });
const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

// ---------------------------------------------------------------------------
// The E235 (assets/jr-e235/SOURCES.md): published 20.0 m over couplers, bodies 19.57 / 19.5 m,
// 2.95 m wide, 3.62 m high, floor 1.13 m; the sides upright from the waist (no lean), tucked in
// below it. Measured from photo-e235-0.jpg (head-on, 192 px/m across the 2.95 m face) and the
// side photographs (89 px/m at the middle car's near door, 1.3 m wide).

/** A rectangle as a polygon in [lat, y], its top corners rounded (radius r), the bottom square. */
function e235TopRounded(l: number, y0: number, y1: number, r: number): Pt[] {
  const pts: Pt[] = [[-l, y0], [l, y0]];
  for (let i = 0; i <= 3; i++) { const a = (Math.PI / 2) * (i / 3); pts.push([l - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 0; i <= 3; i++) { const a = Math.PI / 2 + (Math.PI / 2) * (i / 3); pts.push([-l + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  return pts;
}

/** The E235 face's halftone: square dots of the lower colour growing downward over the upper one, merging at the foot. */
function e235Dots(l: number, y0: number, y1: number, pitch: number): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const rows = Math.round((y1 - y0) / pitch), cols = Math.floor((2 * l) / pitch);
  const [py, px] = [(y1 - y0) / rows, (2 * l) / cols];
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let k = 0; k < rows; k++) {
    const yc = y1 - py * (k + 0.5), h = 0.5 * py * (0.1 + 0.88 * ((k + 0.5) / rows) ** 1.3);
    for (let j = 0; j < cols; j++) {
      const xc = -l + px * (j + 0.5), w = (h * px) / py;
      out.push({ mat: "dotBottom", fine: 1, pts: [[xc - w, yc - h], [xc + w, yc - h], [xc + w, yc + h], [xc - w, yc + h]] });
    }
  }
  return out;
}

/** The face's black field and the halftone's ground under it: half width, heights. */
const E235_FIELD = { l: 1.37, dots: [1.42, 1.96] as const, top: 3.51 };

/**
 * The E235's cab face (photo-e235-0.jpg head-on, photo-jr-east-kuhae235-1.jpg from the side): an
 * upright face as wide as the body, its plan corners rounded 0.25 m, the lower lip curving back under
 * it and the crown rounding over to the roof. The livery's frame colour wraps round the corners
 * 0.7 m back along the cab sides (the green band down the face's side). Inside the frame one black
 * field from 1.96 m to 3.51 m, its top corners rounded: the destination board and the LED head and
 * tail lamps across its top, under them the one big windscreen (2.17 - 3.19 m) wrapping into the
 * corners; below the field the halftone of square dots grading down into the frame colour (Yamanote:
 * green dots on black; Yokosuka: blue dots on cream). No gangway door: the face is closed.
 */
const E235_FACE: SeriesCabFace = {
  dJoin: 0.7, dSide: 0.55, first: 3.6, roofFrom: 3.7, wrap: true,
  profile: [[0.9, 0.14], [1.0, 0.05], [1.15, 0.01], [1.3, 0], [2.2, 0], [3.0, 0.015], [3.35, 0.045], [3.5, 0.1], [3.57, 0.19], [3.61, 0.36], [3.62, 0.7]],
  corner: [[0.9, 0.2], [1.3, 0.25], [3.35, 0.25], [3.5, 0.2], [3.6, 0.1], [3.62, 0.05]], bulge: 0.05, cols: [8, 4, 1, 1],
  rows: [0.9, 1.0, 1.15, 1.3, 1.42, 1.96, 2.17, 2.7, 3.19, 3.35, 3.51, 3.57, 3.61, 3.62],
  bands: () => [[0, 9, "frame"]],
  // the distant face: the halftone as its two colours, half each
  lodBands: [[0, 1.69, "frame"], [1.69, E235_FIELD.dots[1], "dotTop"], [E235_FIELD.dots[1], E235_FIELD.top, "cabMask"], [E235_FIELD.top, 9, "frame"]],
  fields: [
    { mat: "dotTop", pts: [[-E235_FIELD.l, E235_FIELD.dots[0]], [E235_FIELD.l, E235_FIELD.dots[0]], [E235_FIELD.l, E235_FIELD.dots[1]], [-E235_FIELD.l, E235_FIELD.dots[1]]] },
    { mat: "cabMask", pts: e235TopRounded(E235_FIELD.l, E235_FIELD.dots[1], E235_FIELD.top, 0.2) },
  ],
  decals: e235Dots(E235_FIELD.l - 0.02, E235_FIELD.dots[0], E235_FIELD.dots[1], 0.077),
  // the windscreen, and the destination board over it
  panes: [{ lat: [-1.33, 1.33], y: [2.17, 3.19], r: 0.06, mat: "screen" }, { lat: [-0.53, 0.53], y: [3.24, 3.38], r: 0.02, mat: "destBoard" }],
  // the LED head lamps at the field's top corners, the tail lamps inboard of them
  lamps: [[-0.93, 3.36, 0.065, "lampHead"], [0.93, 3.36, 0.065, "lampHead"], [-0.7, 3.36, 0.05, "lampRed"], [0.7, 3.36, 0.05, "lampRed"]],
  // one parked along the windscreen's foot, the other upright at its right
  wipers: [[[0.2, 2.22], [-0.68, 2.33]], [[0.98, 2.22], [1.28, 2.7]]],
};

/** Door leaves: each 1.3 m double door as two leaves sliding apart, at their centres (d). */
const e235Doors = (centres: readonly number[]): Array<readonly [number, number, number]> => centres.flatMap((d): Array<readonly [number, number, number]> => [[d - 0.65, d, -1], [d, d + 0.65, 1]]);

/**
 * The E235's sides, d behind the body's front end (the face's join on the end car): the doors 4.82 m
 * apart, the outer ones 2.52 m from the body's ends; one big 1.9 m window between doors, a 0.8 m
 * one at each end. The cab car's first door sits 3.6 m ahead of the second (tip-d 3.74 m), a small
 * window between them (photo-jr-east-kuhae235-1.jpg).
 */
const E235_LAYOUT = {
  // the body 18.98 m from the face's join (its tip 0.07 m short of the coupling plane): the rear part 0.1 m longer than the real one's
  end: { doors: e235Doors([3.04, 6.64, 11.56, 16.46]), windows: [[4.44, 5.24], [8.65, 10.55], [13.56, 15.46], [17.93, 18.73]] },
  middle: { doors: e235Doors([2.52, 7.34, 12.16, 16.98]), windows: [[0.25, 1.05], [3.98, 5.88], [8.8, 10.7], [13.62, 15.52], [18.45, 19.25]] },
} as const;

/** The E235's own fittings: the air conditioner, the cab's crew door and antennas, the skirt under the face, the underfloor boxes. */
function e235Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const box = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const C = E235.C, L = car.length, [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("air conditioner", () => {
    // the one roof unit in the middle of the car: a low base and its narrower hood
    box("roofE", L / 2 - 1.9, L / 2 + 1.9, C - 0.05, C + 0.2, -1.0, 1.0);
    box("roofE", L / 2 - 1.75, L / 2 + 1.75, C + 0.2, C + 0.34, -0.85, 0.85);
  });
  m.scope("underfloor", () => {
    // the equipment boxes between the bogies, in three groups
    const [a, e] = [t0 + 1.9, t1 - 1.9], w = (e - a - 0.8) / 3;
    for (let i = 0; i < 3; i++) box("under", a + i * (w + 0.4), a + i * (w + 0.4) + w, E235.B - (i === 1 ? 0.5 : 0.4), E235.B + 0.02, -1.15, 1.15);
  });
  if (!car.end) return;
  const dj = E235_FACE.dJoin, tip = X(-dj), k = Math.sign(tip - X(0));
  m.scope("crew door", () => {
    // the stainless cab door behind the cab window (tip-d 1.62 - 2.27 m), its outline
    const [d0, d1, y0, y1, q] = [1.62 - dj, 2.27 - dj, 1.15, 3.0, 0.02];
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "rubber", d0, d0 + q, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d1 - q, d1, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + q, d1 - q, y0, y0 + q, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + q, d1 - q, y1 - q, y1, 0.006, 0.02);
    }
  });
  m.scope("antennas", () => {
    for (const [d, z] of [[0.9, 0.35], [2.3, -0.3]] as const) box("under", d - 0.04, d + 0.04, C - 0.05, C + 0.3, z - 0.04, z + 0.04);
  });
  m.scope("skirt", () => {
    // the deflector under the face: its plate 0.2 m behind the tip, from 0.15 m to 0.66 m over the rail
    pilotPlate(m, "skirtG", k, k * (tip - k * 0.2), 0.15, 0.66, 1.24, 0.08, 0.45);
    // its cheeks running back to the leading bogie (tip-d 1.3 m)
    box("skirtG", -dj + 0.6, 1.3 - dj, 0.22, 0.6, -1.2, 1.2);
    // the dark gear between it and the body
    box("under", -dj + 0.62, 2.0, 0.62, E235.B + 0.02, -1.1, 1.1);
  });
  // the series kit leaves a cab face without a coupler: the E235's stands out under the face, its head at the coupling plane
  m.scope("coupler", () => centreCoupler(m, k, tip - k * 1.0, tip + k * 0.07, E235.couplerY!, "knuckle"));
}

/** Both liveries' stainless, black, glass and grey paints. */
const E235_PALETTE = {
  ss: c("#c3c7ca", 0.3), mask: c("#1d1f22", 0.3), cabMask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), roofE: c("#a9aeb2", 0.5), skirtG: c("#55595e", 0.7),
  // the windscreen lighter than the black field round it (the cab behind it), the destination board darker
  screen: { color: "#3a4a5a", metallic: 0.25, roughness: 0.1, glass: true }, destBoard: { color: "#121416", metallic: 0.2, roughness: 0.15, glass: true },
};
/** The JR emblem on the cab side under the eaves, over the crew door (tip-d 1.75 m). */
const E235_JR = [{ text: "JR", d: 1.05, y: 3.05, h: 0.2, mat: "lettering" }];

export const E235: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.475, Y: 1.8, S: 3.34, C: 3.62, lean: 1, B: 0.9, A: 1.0,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: E235_FACE,
  windows: [[2.0, 2.9]], windowW: 1.9, pitch: 4.82, door: [1.15, 2.95, 1.94, 2.86], doorW: 1.3, doorCount: 4, doorGlassW: 0.37,
  layout: E235_LAYOUT,
  // the cab side window (tip-d 0.66 - 1.48 m) and the crew door's window
  cabWindows: [[0.66 - E235_FACE.dJoin, 1.48 - E235_FACE.dJoin, 2.35, 3.05], [1.775 - E235_FACE.dJoin, 2.115 - E235_FACE.dJoin, 2.11, 2.88]],
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, couplerY: 0.85,
  // the end car's bogies centred on its 19.5 m body (tip-d 2.88 and 16.68 m), the middle car's on its own
  endBogies: [2.18, 15.98], centredBogies: true, pantographAt: 16.3,
  numberAt: [-4.0, 1.5, 0.08],
  liveries: {
    // stainless; the uguisu green on the doors, over them under the eaves and round the face
    yamanote: {
      title: "Yamanote green", palette: { ...E235_PALETTE, green: c("#8cc63f"), frame: c("#8cc63f"), dotTop: c("#1d1f22", 0.3), dotBottom: c("#8cc63f") },
      bands: [[0, 9, "ss"]], doors: [[0, 9, "green"]], overDoors: [[3.02, 3.3, "green"]], roof: "roofG", skirt: "ss", number: "TOU-01", endLettering: E235_JR,
    },
    // E235-1000: the cream-over-blue stripes under the windows and under the eaves, plain doors, the blue face
    yokosuka: {
      title: "Yokosuka blue", palette: { ...E235_PALETTE, blue: c("#1d3d9c"), cream: c("#e9dfc0"), frame: c("#1d3d9c"), dotTop: c("#e9dfc0"), dotBottom: c("#1d3d9c") },
      bands: [[0, 1.72, "ss"], [1.72, 1.86, "blue"], [1.86, 1.98, "cream"], [1.98, 3.06, "ss"], [3.06, 3.18, "cream"], [3.18, 3.32, "blue"], [3.32, 9, "ss"]], doors: [[0, 9, "ss"]], roof: "roofG", skirt: "ss", number: "F-01", endLettering: E235_JR,
    },
  },
  weight: { end: 28, middle: 33 }, power: 560, maxspeed: 120, fittings: e235Fittings,
};

// --- JNR 103 series (S103) ------------------------------------------------
// The low-cab Kuha 103 as it ran from the 1970s (photo-kuha103-1.jpg, photo-1986-kuha103-149.jpg,
// photo-jnr-ec-tc103-188.jpg, photo-l25-tc103-178-680.jpg; assets/jnr-103/SOURCES.md): the flat,
// upright steel front without a gangway door, its three windscreens in one recessed frame, the
// twin sealed-beam headlights in a housing on the forehead between the train-number box (left)
// and the destination box (right), the tail lights in round housings low at the corners; the
// AU75 air conditioner and the flat ventilators on the roof, the PS16 diamond pantograph on the
// Moha. Lateral positions are seen from ahead (the viewer's right positive), heights over the rail,
// d behind the face (measured at 235 px/m on the head-on photo of Kuha 103-188).

/** The 103's door pitch along the side (4.78 m, a projective fit over the four doors of Kuha 103-178). */
const S103_PITCH = 4.78;
/** Where the face meets the body's own section, behind the face (the forehead's round over into the roof). */
const S103_JOIN = 0.35;
/** The door centres: the Kuha's d behind its face, the intermediate car's d behind its body's end. */
const S103_END_DOORS = [0, 1, 2, 3].map((i) => 2.52 + S103_PITCH * i);
const S103_MID_DOORS = [0, 1, 2, 3].map((i) => 2.58 + S103_PITCH * i);

/** One car side's windows from its door centres: a door-pocket window beside each door, a pair of sashes between them, one window and its pocket at the car's plain end. */
function s103Windows(doors: readonly number[], end: "cab" | "plain", L: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (end === "cab") out.push([doors[0]! - 0.65 - 0.63, doors[0]! - 0.65 - 0.2]);
  else out.push([doors[0]! - 0.65 - 1.7, doors[0]! - 0.65 - 0.78], [doors[0]! - 0.65 - 0.63, doors[0]! - 0.65 - 0.2]);
  for (let i = 0; i + 1 < doors.length; i++) {
    const e = doors[i]! + 0.65;
    out.push([e + 0.2, e + 0.63], [e + 0.78, e + 1.7], [e + 1.78, e + 2.7], [e + 2.85, e + 3.28]);
  }
  const e = doors[doors.length - 1]! + 0.65;
  out.push([e + 0.2, e + 0.63], [e + 0.78, Math.min(e + 1.7, L - 0.2)]);
  return out;
}

const S103_LAYOUT = {
  end: {
    doors: S103_END_DOORS.map((c, i): [number, number, number] => [c - 0.65 - S103_JOIN, c + 0.65 - S103_JOIN, i % 2 ? -1 : 1]),
    windows: s103Windows(S103_END_DOORS, "cab", 19.5).map(([a, b]): [number, number] => [a - S103_JOIN, b - S103_JOIN]),
  },
  middle: {
    doors: S103_MID_DOORS.map((c, i): [number, number, number] => [c - 0.65, c + 0.65, i % 2 ? -1 : 1]),
    windows: s103Windows(S103_MID_DOORS, "plain", 19.5),
  },
};

/** The 103's flat front (all positions measured on photo-jnr-ec-tc103-188.jpg). */
const S103_FACE: SeriesCabFace = {
  // the coupler plane 0.13 m ahead of the face, so that the step plate over the coupler reaches it
  dJoin: S103_JOIN, dSide: 0.2, reach: 0.13, roofFrom: 9,
  // upright from the body's foot to the forehead, rounding over into the roof
  profile: [[1.0, 0], [3.3, 0], [3.45, 0.02], [3.55, 0.07], [3.61, 0.15], [3.65, S103_JOIN]],
  corner: [[1.0, 0.13], [3.3, 0.13], [3.55, 0.09], [3.65, 0.04]], cols: [6, 3, 1, 1],
  rows: [1.0, 1.12, 1.3, 1.75, 2.03, 2.45, 2.89, 3.1, 3.3, 3.45, 3.55, 3.61, 3.65],
  masks: [
    // the windscreens' recessed frame, its H-rubber, the number and destination boxes
    { lat: [-1.3, 1.3], y: [2.03, 2.89], r: 0.08, mat: "recess" },
    { lat: [-1.24, 1.24], y: [2.09, 2.85], r: 0.06, mat: "sash" },
    { lat: [-1.1, -0.54], y: [2.97, 3.21], r: 0.1, mat: "frameSilver" },
    { lat: [-1.07, -0.57], y: [3.0, 3.18], r: 0.08, mat: "blind" },
    { lat: [0.48, 1.16], y: [2.96, 3.33], r: 0.1, mat: "frameSilver" },
    { lat: [0.51, 1.13], y: [2.99, 3.3], r: 0.08, mat: "blind" },
  ],
  // three windscreens of one height, the two pillars between them narrow
  panes: [{ lat: [-1.21, -0.43], y: [2.12, 2.82], r: 0.04 }, { lat: [-0.39, 0.39], y: [2.12, 2.82], r: 0.03 }, { lat: [0.43, 1.21], y: [2.12, 2.82], r: 0.04 }],
  texts: [{ text: "21T", lat: -0.82, y: 3.04, h: 0.1, mat: "black" }, { text: "TOKYO", lat: 0.82, y: 3.09, h: 0.11, mat: "black" }],
  pods: [
    // the twin sealed-beam headlights' housing on the forehead
    { lat: 0, y: 3.445, w: 0.56, h: 0.3, r: 0.14, proud: 0.06, depth: 0.05, mat: "body", level: true, lamps: [[-0.135, 0.085, "lampHead"], [0.135, 0.085, "lampHead"]] },
    // the tail lights' round housings low at the corners
    { lat: -1.11, y: 1.23, w: 0.2, h: 0.2, proud: 0.05, depth: 0.04, mat: "body", lamps: [[0, 0.07, "lampRed"]] },
    { lat: 1.11, y: 1.23, w: 0.2, h: 0.2, proud: 0.05, depth: 0.04, mat: "body", lamps: [[0, 0.07, "lampRed"]] },
    // the two footsteps under the windscreens and the step plate over the coupler
    { lat: -0.41, y: 1.81, w: 0.16, h: 0.035, r: 0.01, proud: 0.05, depth: 0.03, mat: "body" },
    { lat: 0.39, y: 1.81, w: 0.16, h: 0.035, r: 0.01, proud: 0.05, depth: 0.03, mat: "body" },
    { lat: 0, y: 1.12, w: 0.46, h: 0.04, r: 0.01, proud: 0.12, depth: 0.03, mat: "body" },
  ],
  wipers: [[[0.82, 2.15], [0.57, 2.62]], [[-0.82, 2.15], [-0.57, 2.62]]],
};

/** The roof's equipment, the gutters and the window sashes, and the underfloor box (the series' fittings). */
function s103Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length, j = car.end ? S103_JOIN : 0, C = S103.C;
  // the equipment boxes between the bogies, not one long case: the Moha's control and resistor boxes, the Kuha's few
  const boxes: ReadonlyArray<readonly [number, number, number, number]> = car.end
    ? [[4.6, 6.4, 0.55, 1.1], [7.6, 8.6, 0.4, 0.9], [10.4, 12.6, 0.6, 1.15], [13.2, 13.9, 0.45, 0.6]]
    : [[4.5, 6.9, 0.6, 1.15], [7.4, 9.3, 0.55, 1.1], [9.8, 11.2, 0.5, 1.15], [11.7, 13.9, 0.62, 1.15]];
  m.scope("underfloor", () => {
    block(m, "under", X(car.trucks[1]! - 1.9), X(car.trucks[0]! + 1.9), S103.B - 0.12, S103.B, -S103.W * 0.8, S103.W * 0.8);
    boxes.forEach(([d0, d1, h, hw], i) => m.scope(`box ${i + 1}`, () => block(m, "under", X(d1 - j), X(d0 - j), S103.B - h, S103.B - 0.12, -hw, hw)));
  });
  // the AU75 air conditioner across the middle of the roof: a low box, its top chamfered
  const au: Array<[number, number]> = [[-1.0, C - 0.22], [1.0, C - 0.22], [1.0, C + 0.22], [0.85, C + 0.36], [-0.85, C + 0.36], [-1.0, C + 0.22]];
  const mid = (car.end ? 9.75 - j : L / 2);
  m.scope("air conditioner", () => {
    m.sweep("au75", "x", au, X(mid + 2.3), au, X(mid - 2.3));
    // its louvres along both sides
    for (const z of [1, -1]) block(m, "louvre", X(mid + 1.9), X(mid - 1.9), C + 0.02, C + 0.18, z > 0 ? 1.0 : -1.012, z > 0 ? 1.012 : -1.0);
  });
  // the flat ventilators on the crown
  const vent: Array<[number, number]> = [[-0.38, C - 0.12], [0.38, C - 0.12], [0.38, C + 0.08], [0.25, C + 0.15], [-0.25, C + 0.15], [-0.38, C + 0.08]];
  const vents = car.end ? [1.9, 4.4, 14.9, 17.4].map((d) => d - j) : [2.9, 5.4, 14.1];
  m.scope("ventilators", () => vents.forEach((d, i) => m.scope(`ventilator ${i + 1}`, () => m.sweep("au75", "x", vent, X(d + 0.5), vent, X(d - 0.5)))));
  // the rain gutters along the roof's edges
  m.scope("gutters", () => { for (const sd of [1, -1]) sidePanel(m, b, X, sd, "body", 0.05, L - 0.05, S103.S - 0.06, S103.S - 0.01, 0.02, 0.03); });
  // the two-pane windows' aluminium sashes: the meeting rail of the lowering upper and the rising lower sash
  const rows = car.end ? S103_LAYOUT.end.windows : S103_LAYOUT.middle.windows;
  const [w0, w1] = S103.windows[0]!;
  m.scope("sashes", () => {
    for (const sd of [1, -1]) for (const [a, e] of rows) if (e - a > 0.6)
      for (const [p, q, y0, y1] of [[a + 0.03, e - 0.03, 2.38, 2.42], [a + 0.03, e - 0.03, w0 + 0.03, w0 + 0.065], [a + 0.03, e - 0.03, w1 - 0.065, w1 - 0.03], [a + 0.03, a + 0.065, w0 + 0.065, w1 - 0.065], [e - 0.065, e - 0.03, w0 + 0.065, w1 - 0.065]] as const)
        sidePanel(m, b, X, sd, "frameSilver", p, q, y0, y1, 0.016, 0.006);
  });
  if (car.end) m.scope("crew door", () => {
    // the crew door behind the cab, its window and grab rail
    for (const sd of [1, -1]) {
      const [d0, d1] = [0.45 - j, 1.03 - j];
      for (const [a, e, y0, y1] of [[d0, d0 + 0.02, 1.03, 2.97], [d1 - 0.02, d1, 1.03, 2.97], [d0, d1, 2.95, 2.97], [d0, d1, 1.03, 1.05]] as const)
        sidePanel(m, b, X, sd, "rubber", a, e, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + 0.1, d1 - 0.1, 2.02, 2.8, 0.007, 0.03);
      sidePanel(m, b, X, sd, "glass", d0 + 0.13, d1 - 0.13, 2.05, 2.77, 0.012, 0.004);
      sidePanel(m, b, X, sd, "frameSilver", d1 + 0.06, d1 + 0.09, 1.5, 2.6, 0.018, 0.008);
    }
  });
}

/** The 103's paint: one colour all over, the roof grey; the recess, the blinds and the roof units. */
const s103Palette = (body: string, recess: string) => ({ body: c(body, 0.45), recess: c(recess, 0.5), cabMask: c(body, 0.45), blind: c("#f2f1ea", 0.4), sash: c("#8c9194", 0.4), black: c("#1d1f22", 0.5), au75: c("#b4b8ba", 0.55), louvre: c("#6b6f72", 0.6), roofG: c("#8f9396", 0.65), skirtG: c("#2a2c2f") });

export const S103: ShinkansenSeries = {
  // 20.0 m over the couplers, a 19.5 m body 2.832 m wide (Wikipedia "103 series"), its sides upright
  endLength: 20.0, midLength: 20.0, W: 1.416, Y: 1.2, S: 3.22, C: 3.65, lean: 0.99, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S103_FACE, layout: S103_LAYOUT,
  windows: [[1.97, 2.78]], windowW: 0.92, pitch: 1.2, door: [1.17, 2.97, 2.08, 2.85], doorW: 1.3, doorCount: 4, doorGlassW: 0.4, doorGlassPair: 0.65,
  // DT33 / TR64 bogies 13.8 m apart, centred on the 19.5 m body; the PS16 over the Moha's rear bogie, one
  // in the 4-car Kuha-Moha-Moha-Kuha set (the Moha 102 has none)
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond", pantographAt: 16.5, onePantograph: true,
  endBogies: [2.85 - S103_JOIN, 16.65 - S103_JOIN], midBogies: [2.85, 16.65], fittings: s103Fittings,
  liveries: {
    chuo: { title: "Chuo orange", palette: s103Palette("#f15a22", "#c94a1b"), bands: [[0, 9, "body"]], roof: "roofG", skirt: "body", number: "KUHA 103-1" },
    yamanote: { title: "Yamanote green", palette: s103Palette("#9acd32", "#7eaa28"), bands: [[0, 9, "body"]], roof: "roofG", skirt: "body", number: "KUHA 103-271" },
  },
  weight: { end: 30, middle: 40 }, power: 440, maxspeed: 100,
};

// --- Odakyu 70000 "GSE" (assets/odakyu-gse/; docs/models/jp-emus.md, "The GSE") ---------------
// Published (ja.wikipedia, SUBWAY 2018/5): 21.3 m end and 20.0 m intermediate cars on their own
// bogies (not articulated), 2,878 mm wide, roof 3,700 mm, 4,057 mm over the raised cab, floor
// 1,150 mm, side windows 1.0 m tall, 860 mm wheels, 2.1 m wheelbase. Heights and the nose's
// profile measured on the near side view at Odawara (81.8 px/m: the 1.0 m windows, 4.057 m over the
// cab), the plan and face widths on the head-on view at Shinjuku (211 px/m: the 2.878 m width).

/** The tip-to-body join of the GSE's face: the face runs from the bumper up to the band under the cab dome. */
const GSE_JOIN = 3.9;
/** The end car's body length behind the join (21.3 m less the face, its 2 cm reach to the coupling plane and the 0.25 m coupling gap). */
const GSE_END = 21.3 - GSE_JOIN - 0.02 - 0.25;
/** The silver pillars beside the observation windscreen, [y, d behind the tip]: they run from the bumper's top up and back to the cab. */
const GSE_PILLAR_FRONT: Pt[] = [[1.74, 0.7], [3.07, 2.3]];
const GSE_PILLAR_BACK: Pt[] = [[1.74, 1.1], [3.07, 3.03]];

/**
 * The observation end: a blunt bumper (its most forward point 1.11 m up, raked back to 0.45 m and to
 * 1.64 m), the saloon's windscreen raked 42 degrees from 1.74 m (0.5 m behind the tip) up to 3.03 m
 * (1.7 m behind), the red band over it whose top slopes back to 3.39 m at 2.5 m, where the cab dome
 * (gseFittings) stands; nearly flat in plan with 0.3 m corners. The windscreen glass wraps round the
 * corners to the silver pillars.
 */
const GSE_FACE: SeriesCabFace = {
  dJoin: GSE_JOIN, dSide: 1.4, first: 4.2, reach: 0.02, roofFrom: 3.47, cols: [8, 5, 1, 2], tolerance: 0.02,
  // under the dome the face's top runs nearly level back to 3.6 m and only then rises to the roof's
  // crown, inside the dome, so that the dome stands clear of it seen from ahead
  profile: [[0.2, 0.9], [0.45, 0.78], [0.48, 0.42], [0.61, 0.25], [0.86, 0.1], [1.11, 0], [1.4, 0.12], [1.64, 0.32], [1.74, 0.52], [3.03, 1.7], [3.18, 1.8], [3.3, 1.98], [3.39, 2.5], [3.42, 3.4], [3.55, 3.75], [3.7, GSE_JOIN]],
  // the lower bumper and the chin narrower than the body (the head-on view: 2.28 m at 0.5 m)
  corner: [[0.2, 0.5], [0.48, 0.45], [0.86, 0.32], [1.11, 0.3], [1.74, 0.3], [3.03, 0.45], [3.3, 0.4], [3.42, 0.3], [3.6, 0.15], [3.7, 0.03]],
  cornerRatio: [[0.2, 1.3], [1.74, 1.3], [3.03, 1.7], [3.42, 1.4], [3.7, 1.0]],
  bulge: [[0.2, 0.1], [1.11, 0.12], [1.74, 0.06], [3.7, 0.02]],
  rows: [0.2, 0.45, 0.48, 0.61, 0.86, 1.11, 1.4, 1.64, 1.7, 1.74, 1.76, 2.1, 2.5, 2.8, 3.03, 3.07, 3.14, 3.18, 3.28, 3.3, 3.39, 3.42, 3.45, 3.47, 3.55, 3.7],
  bands: (l) => [[0, 0.45, "skirtG"], [0.45, 9, l.bands.find(([, top]) => top > 1.0)![2]]],
  paint: [
    // the body's colour down to 0.45 m on the nose's sides (the underframe cover starts behind the leading bogie)
    { mat: "gseBody", front: [[0.45, -9], [0.86, -9]], back: [[0.45, 99], [0.86, 99]] },
    // the windscreen wrapping round the corners ahead of the pillars, and the pillars
    { mat: "cabGlass", front: [[1.74, -9], [3.07, -9]], back: GSE_PILLAR_FRONT },
    { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
  ],
  panes: [{ lat: [-1.17, 1.17], y: [1.76, 3.03], r: 0.08, mat: "cabGlass" }],
  // the coupler cover in the bumper; the square headlights on the band under the dome
  masks: [{ lat: [-0.52, 0.52], y: [0.5, 0.86], r: 0.06, mat: "gseCover" }, { lat: [-1.1, -0.88], y: [3.12, 3.29], r: 0.03, mat: "black" }, { lat: [0.88, 1.1], y: [3.12, 3.29], r: 0.03, mat: "black" }],
  lamps: [[-0.99, 3.205, 0.07, "lampHead"], [0.99, 3.205, 0.07, "lampHead"], [-0.71, 0.63, 0.04, "lampRed"], [0.71, 0.63, 0.04, "lampRed"]],
};

/** The cab dome's half section at full height ([z, y], base to crown): from the head-on view, its sides upright to 3.7 m, then arched to 4.05 m. */
const GSE_DOME: Pt[] = [[1.2, 3.36], [1.18, 3.52], [1.13, 3.7], [1.0, 3.87], [0.78, 3.97], [0.43, 4.03], [0, 4.05]];
/** Its stations, d behind the tip: the section's height and width scale. The glass dome rises from 2.5 m to 3.67 m; the cab's roof runs back to 6.2 m, then fairs down into the car's roof by 9.4 m. */
const GSE_DOME_AT: ReadonlyArray<readonly [number, number, number]> = [[2.5, 0, 0.96], [2.79, 0.25, 0.97], [3.08, 0.5, 0.98], [3.37, 0.75, 0.99], [3.67, 1, 1], [3.75, 1, 1], [4.4, 1, 1], [4.45, 1, 1], [5.05, 1, 1], [6.2, 1, 1], [7.4, 0.7, 0.93], [8.6, 0.38, 0.82], [9.4, 0.2, 0.72]];

/** A roof fairing over an air conditioner (d span on the car's body): rounded humps with black louvres at their ends. */
function gseHump(m: MeshBuilder, X: (d: number) => number, C: number, d0: number, d1: number): void {
  const sec: Pt[] = [[0.82, C - 0.16], [0.8, C + 0.1], [0.62, C + 0.2], [0, C + 0.22]];
  const at: ReadonlyArray<readonly [number, number]> = [[d0, 0], [d0 + 0.45, 1], [d1 - 0.45, 1], [d1, 0]];
  const halves = at.map(([, k]) => sec.map(([z, y]): Pt => [z * (0.85 + 0.15 * k), C - 0.16 + (y - C + 0.16) * k]));
  loftHalves(m, at.map(([d]) => X(d)), halves, () => "gseRoof", () => C - 0.16);
  for (const [a, e] of [[d0 + 0.5, d0 + 1.3], [d1 - 1.3, d1 - 0.5]] as const)
    for (const sd of [1, -1]) block(m, "black", Math.min(X(a), X(e)), Math.max(X(a), X(e)), C - 0.03, C + 0.07, sd > 0 ? 0.795 : -0.83, sd > 0 ? 0.83 : -0.795);
}

/** The GSE's own fittings: the end car's raised cab dome, the roof fairings and the underfloor equipment. */
function gseFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = 3.7, L = car.length;
  if (car.end) m.scope("cab dome", () => {
    const halves = GSE_DOME_AT.map(([, kh, kz]) => GSE_DOME.map(([z, y]): Pt => [z * kz, 3.36 + (y - 3.36) * kh]));
    // glass over the dome's front and in the cab's two side windows, the roof's colour over the top
    const sideWindow = (d: number) => (d >= 3.75 && d < 4.4) || (d >= 4.45 && d < 5.05);
    loftHalves(m, GSE_DOME_AT.map(([d]) => X(d - GSE_JOIN)), halves, (seg, edge) => {
      const d = GSE_DOME_AT[seg]![0];
      if (d < 3.67) return edge === 0 ? "gseBody" : "cabGlass";
      if (edge >= 3 || (d >= 6.2 && edge >= 1)) return "gseRoof";
      return sideWindow(d) && edge >= 1 ? "cabGlass" : "gseBody";
    }, () => 3.36);
  });
  // the red valance low on the nose's sides, over the leading bogie, back to the underframe cover at 6.65 m
  if (car.end) m.scope("valance", () => {
    const [x0, x1] = [X(6.65 - GSE_JOIN), X(-0.02)];
    for (const sd of [1, -1]) block(m, "gseBody", Math.min(x0, x1), Math.max(x0, x1), 0.45, 0.86, sd > 0 ? 1.37 : -1.405, sd > 0 ? 1.405 : -1.37);
  });
  m.scope("roof fairings", () => {
    for (const [d0, d1] of car.end ? [[10.6 - GSE_JOIN, 14.0 - GSE_JOIN], [L - 4.2, L - 0.8]] : [[1.0, 4.4], [9.6, 13.0]]) gseHump(m, X, C, d0!, d1!);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), 0.34, 0.62, -1.15, 1.15));
  void b;
}

/** The GSE's paint by livery: its body, roof and line colours under the names its fittings draw with. */
const gsePalette = (body: string, roof: string) => ({ gseBody: c(body, 0.3), gseRoof: c(roof, 0.4), gseSilver: c("#d8d8da", 0.3), gseCover: c(body, 0.45), gseText: c("#ece6d6", 0.4), skirtG: c("#d8d8da", 0.35), black: c("#16181b", 0.4) });

export const GSE: ShinkansenSeries = {
  endLength: 21.3, midLength: 20.0, W: 1.439, Y: 1.3, S: 3.45, C: 3.7, lean: 0.97, B: 0.2, A: 0.86,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: GSE_FACE,
  // the 1.0 m windows in a black band, 1.18 m panes 1.36 m apart; narrow doors (0.6 m by 1.82 m, a
  // small window 2.28 - 2.73 m up), one behind the observation saloon and one at the inner end on the
  // end car, one at the front of each middle car
  windows: [[1.84, 2.86]], windowW: 1.18, pitch: 1.36, door: [1.13, 2.95, 2.28, 2.73], doorW: 0.6, doorGlassW: 0.26,
  layout: {
    end: { doors: [[6.8 - GSE_JOIN, 7.4 - GSE_JOIN, 1], [GSE_END - 1.6, GSE_END - 1.0, -1]], windows: [[4.77 - GSE_JOIN, 6.51 - GSE_JOIN], ...gseRow(7.58 - GSE_JOIN, GSE_END - 1.78)] },
    middle: { doors: [[0.5, 1.1, 1]], windows: gseRow(1.5, 19.0) },
  },
  // the end car's leading bogie 5.0 m behind the tip (the side view), all others 13.8 m apart on the bodies
  bogieCentres: 13.8, centredBogies: true, endBogies: [5.0 - GSE_JOIN, GSE_END - 2.85], wheelR: 0.43, wheelbase: 2.1,
  fittings: gseFittings,
  lodRoof: { d: [3.1, 7.4], hw: 1.1, y: [3.6, 4.05], mat: "gseRoof" },
  liveries: {
    // rose vermilion with the "rouge bordeaux" roof, a vermilion-orange line under the windows and the
    // "moonlight silver" underframe covers (ja.wikipedia, the colours' names and swatches; the body and
    // the line sampled from the sunlit photographs, 249/49/9 and 209/28/11, where the published
    // swatch #d04b26 reads brown)
    rose: {
      title: "Rose vermilion", number: "70051",
      palette: { ...gsePalette("#e0401c", "#9f3042"), red: c("#e0401c", 0.3), line: c("#f2601e", 0.3) },
      bands: [[0, 0.86, "skirtG"], [0.86, 1.66, "red"], [1.66, 1.7, "line"], [1.7, 1.84, "red"], [1.84, 2.86, "black"], [2.86, 9, "red"]], doors: [[0, 9, "red"]],
      roof: "gseRoof", skirt: "skirtG",
      endSweeps: [
        { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
        { mat: "cabGlass", front: [[1.78, 1.158], [2.95, 2.856]], back: [[1.78, 4.36], [2.95, 4.36]] },
      ],
      endLettering: [{ text: "ROMANCECAR GSE", d: 5.2 - GSE_JOIN, y: 1.42, h: 0.1, mat: "gseText" }],
    },
    // the LSE's (7000 series) Romancecar colours: vermilion orange with two white lines low on the
    // body, a grey window band, orange over it (a livery the GSE never carried)
    lse: {
      title: "LSE colours", number: "70052",
      palette: { ...gsePalette("#ef2300", "#9a9da1"), orange: c("#ef2300", 0.3), grey: c("#6a6a6a", 0.35), white: c("#f2f2ef") },
      bands: [[0, 0.86, "skirtG"], [0.86, 1.3, "orange"], [1.3, 1.36, "white"], [1.36, 1.44, "orange"], [1.44, 1.5, "white"], [1.5, 1.74, "orange"], [1.74, 2.96, "grey"], [2.96, 9, "orange"]], doors: [[0, 9, "orange"]],
      roof: "gseRoof", skirt: "skirtG",
      endSweeps: [
        { mat: "gseSilver", front: GSE_PILLAR_FRONT, back: GSE_PILLAR_BACK },
        { mat: "cabGlass", front: [[1.78, 1.158], [2.95, 2.856]], back: [[1.78, 4.36], [2.95, 4.36]] },
      ],
      endLettering: [{ text: "ROMANCECAR GSE", d: 5.2 - GSE_JOIN, y: 1.55, h: 0.1, mat: "white" }],
    },
  },
  // 268.7 t a 7-car set (Tc about 35 t); 4 of 7 cars motored, 4 x 190 kW each: 435 kW a car on average
  weight: { end: 35, middle: 40 }, power: 435, maxspeed: 110,
};

/** The GSE's window panes from d0 to d1 on a car's body: about 1.18 m panes and 0.18 m black pillars, 1.36 m apart (the side view). */
function gseRow(d0: number, d1: number): Array<readonly [number, number]> {
  const n = Math.max(1, Math.round((d1 - d0 + 0.18) / 1.36)), w = (d1 - d0 + 0.18) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w, d0 + (i + 1) * w - 0.18] as const);
}

// ---------------------------------------------------------------------------
// Kintetsu 80000 "Hinotori" (2020): the cab face, the window band, the premium end car's high windows.
// Measured from assets/kintetsu-hinotori/ (SOURCES.md): heights and the nose's profile from the near
// side view photo-80000.jpg (147 px/m, rail to roof 3.74 m), the face from photo-hinotori-10.jpg and
// photo-kintetsu-80000-series-hinotori-2022-04-02.jpg, the layout from the Kasumigaura photograph.
// Edges along the car are [y, d behind the nose's tip].

/** The red frame's back edge on the cab side: up beside the nose, then back along the roof's edge as the red line. */
const HINO_FRAME: Pt[] = [[1.45, 0.66], [1.55, 0.72], [1.95, 1.0], [2.35, 1.34], [2.6, 1.66], [2.85, 2.05], [3.0, 2.45], [3.08, 2.8], [3.12, 3.05]];
/** The cab's side window in the dark field: its front edge raked with the frame, a flat sill, its back square before the door. */
const HINO_CAB_WINDOW: { front: Pt[]; back: Pt[] } = { front: [[1.75, 1.02], [2.1, 1.28], [2.4, 1.6], [2.62, 1.92], [2.78, 2.25], [2.86, 2.5]], back: [[1.75, 2.82], [2.86, 2.82]] };

/**
 * The Hinotori's front: a long curved nose, the face raked about 45 degrees from the LED headlight
 * bar (1.5 - 1.66 m) to the roof, which it reaches 3 m behind the tip. A dark centre panel holds the
 * big windscreen and over it, set in the roof's curve, the upper glass the premium car's passengers
 * look forward through; the red frame round it runs up the face's corners and back along the roof's
 * edge as the red line under the dark roof. Under the face the red bumper and the coupler's black recess.
 */
const HINO_FACE: SeriesCabFace = {
  dJoin: 3.0, dSide: 2.4, first: 4.35, roofFrom: 3.38, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.02, reach: 0.02,
  profile: [[0.85, 0.03], [0.95, 0.0], [1.19, 0.08], [1.5, 0.28], [1.98, 0.64], [2.45, 0.98], [2.76, 1.3], [3.05, 1.68], [3.25, 2.0], [3.45, 2.35], [3.6, 2.62], [3.7, 2.85], [3.74, 3.0]],
  corner: [[0.85, 0.3], [2.0, 0.32], [2.8, 0.4], [3.2, 0.5], [3.5, 0.45], [3.74, 0.12]],
  cornerDepth: [[0.85, 0.28], [2.0, 0.3], [2.8, 0.42], [3.2, 0.6], [3.5, 0.55], [3.74, 0.2]],
  rows: [0.85, 0.95, 1.19, 1.36, 1.395, 1.45, 1.5, 1.58, 1.66, 1.75, 1.98, 2.2, 2.45, 2.6, 2.76, 2.9, 3.05, 3.12, 3.25, 3.38, 3.45, 3.55, 3.6, 3.66, 3.7, 3.74],
  bands: () => [[0, 9, "frame"]],
  lodBands: [[0, 1.48, "frame"], [1.48, 9, "faceDark"]],
  fields: [
    // the dark centre panel inside the frame, rounded at the bottom under the headlight bar; over the
    // windscreen it opens out to the roof as the frame turns back along the roof's edge
    { mat: "faceDark", pts: [[-0.82, 1.47], [0.82, 1.47], [0.94, 1.5], [0.99, 1.58], [1.0, 2.2], [0.98, 3.0], [1.05, 3.18], [1.2, 3.3], [1.5, 3.36], [1.5, 3.9], [-1.5, 3.9], [-1.5, 3.36], [-1.2, 3.3], [-1.05, 3.18], [-0.98, 3.0], [-1.0, 2.2], [-0.99, 1.58], [-0.94, 1.5]] },
    // the windscreen, a little wider at its foot, and the upper glass over it in the roof's curve
    { mat: "cabGlass", pts: [[-0.86, 1.98], [0.86, 1.98], [0.93, 2.04], [0.91, 2.98], [0.85, 3.05], [-0.85, 3.05], [-0.91, 2.98], [-0.93, 2.04]] },
    { mat: "cabGlass", pts: [[-0.82, 3.11], [0.82, 3.11], [0.9, 3.17], [0.93, 3.3], [0.85, 3.5], [0.62, 3.6], [-0.62, 3.6], [-0.85, 3.5], [-0.93, 3.3], [-0.9, 3.17]] },
  ],
  // the headlight bar: two rows of twenty LEDs in a black bezel
  masks: [{ lat: [-0.86, 0.86], y: [1.5, 1.665], r: 0.05, mat: "black" }],
  panes: [],
  decals: Array.from({ length: 40 }, (_, i) => {
    const [k, row] = [i % 20, Math.floor(i / 20)];
    const [lat, y, h] = [-0.76 + k * 0.08, row ? 1.6 : 1.535, 0.022];
    return { mat: "lampHead", pts: [[lat - h, y - h], [lat + h, y - h], [lat + h, y + h], [lat - h, y + h]] as Pt[], fine: 1 };
  }),
  wipers: [[[0.1, 2.02], [0.55, 2.7]]],
};

/** The bumper under the face: [y, d of its front, d of its back, half width, corner across, corner depth]. */
const HINO_CHIN: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [0.2, 0.42, 2.3, 1.05, 0.45, 0.55], [0.28, 0.28, 2.35, 1.12, 0.4, 0.45], [0.42, 0.16, 2.4, 1.18, 0.36, 0.38], [0.62, 0.08, 2.45, 1.22, 0.32, 0.32], [0.88, 0.03, 2.5, 1.25, 0.3, 0.29],
];

/** The phoenix logo as triangles, [d behind the tip, y] (photo-80000.jpg: 0.8 m long, 2.44 - 2.79 m): beak, body, three wing and three tail feathers. */
const HINO_PHOENIX: Pt[] = [
  [3.85, 2.55], [3.95, 2.6], [3.95, 2.5],
  [3.95, 2.6], [3.95, 2.5], [4.3, 2.44], [3.95, 2.6], [4.3, 2.44], [4.2, 2.56],
  [4.05, 2.57], [4.12, 2.565], [4.42, 2.79], [4.1, 2.565], [4.18, 2.56], [4.5, 2.74], [4.15, 2.56], [4.22, 2.55], [4.55, 2.67],
  [4.22, 2.53], [4.27, 2.49], [4.6, 2.62], [4.25, 2.5], [4.3, 2.46], [4.66, 2.55], [4.28, 2.47], [4.32, 2.44], [4.6, 2.46],
];

/** The Hinotori's own fittings: the bumper and its coupler recess on the end car, the underfloor equipment. */
function hinotoriFittings(m: MeshBuilder, b: SliceBody, X: (dd: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(t0 + 2.6), HINOTORI.B - 0.4, HINOTORI.B, -HINOTORI.W * 0.82, HINOTORI.W * 0.82));
  if (!car.end) return;
  const dj = HINO_FACE.dJoin;
  // the gold phoenix (the logo), beak forward, over its lettering beside both doors; the crew door's grab rails
  const bird = (at: number): Pt[] => HINO_PHOENIX.map(([d, y]): Pt => [d + at - dj, y]);
  m.scope("emblems", () => {
    for (const sd of [1, -1]) for (const at of [0, 14.85]) sideDecal(m, b, X, sd, "gold", bird(at), 0.006);
    for (const sd of [1, -1]) for (const d of [3.14, 3.84]) sidePanel(m, b, X, sd, "frameSilver", d - dj, d + 0.03 - dj, 1.2, 2.0, 0.02, 0.025);
  });
  // a rounded rectangle in plan, d behind the tip, the back square; `notch` m deep and 0.56 m to each side the coupler's recess in its front
  const ring = ([, df, db, hw, r, rd]: readonly [number, number, number, number, number, number], notch: number): Ring => {
    const pts: Array<[number, number]> = [];
    const n = 5;
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.sin(t)), -(hw - r + r * Math.cos(t))]); }
    if (notch > 0) pts.push([df, -0.56], [df + notch, -0.56], [df + notch, 0.56], [df, 0.56]);
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]); }
    pts.push([db, hw], [db, -hw]);
    const out: Ring = pts.map(([d, z]): [number, number] => [X(d - dj), z]);
    let area = 0;
    for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
    return area > 0 ? out.reverse() : out;
  };
  // the lip under the recess, capped on top (the recess's floor); over it the bumper round the recess, open at its foot
  const ys = HINO_CHIN.map((rw) => rw[0]);
  m.scope("bumper", () => {
    const lip = HINO_CHIN.slice(0, 3).map((rw) => ring(rw, 0)), up = HINO_CHIN.slice(2).map((rw) => ring(rw, 0.2));
    m.cap("bumper", lip[0]!, ys[0]!, false);
    for (let i = 0; i + 1 < lip.length; i++) m.loft("bumper", lip[i]!, ys[i]!, lip[i + 1]!, ys[i + 1]!, i + 2 === lip.length);
    for (let i = 0; i + 1 < up.length; i++) m.loft("bumper", up[i]!, ys[i + 2]!, up[i + 1]!, ys[i + 3]!, false);
  });
  // the recess's black back, the retracted coupler in it
  m.scope("coupler recess", () => block(m, "black", X(0.6 - dj), X(0.21 - dj), ys[2]! + 0.005, 0.87, -0.55, 0.55));
}

/** Side bands: the fine dark lines under the window band, its semi-transparent black, the red line under the roof. */
const hinoBands = (body: string, line: string, stripe: string, band: string, frame: string): ShinkansenLivery["bands"] => [
  [0, 1.36, body], [1.36, 1.395, line], [1.395, 1.62, body], [1.62, 1.635, stripe], [1.635, 1.7, body], [1.7, 1.72, stripe], [1.72, 1.78, body],
  [1.78, 1.805, stripe], [1.805, 1.86, body], [1.86, 1.89, stripe], [1.89, 1.93, body], [1.93, 3.12, band], [3.12, 9, frame],
];
const hinoSweeps = (frame: string, band: string): NonNullable<ShinkansenLivery["endSweeps"]> => [
  // the frame red forward of its back edge, the dark field behind it down to 1.55 m, the cab's side window in it
  { mat: frame, front: [[1.45, -9], [3.12, -9]], back: HINO_FRAME },
  { mat: band, front: HINO_FRAME.slice(1), back: [[1.55, 3.1], [3.12, 3.1]] },
  { mat: "cabGlass", ...HINO_CAB_WINDOW },
];

/** Windows in the dark band: the premium end car's seven at its 1.3 m seat pitch, the regular cars' long ones; d behind the body's +X end (the end car's 3 m behind the tip). */
const HINO_PREMIUM = Array.from({ length: 7 }, (_, i): readonly [number, number] => [1.65 + 1.3 * i, 1.65 + 1.3 * i + 1.08]);
const HINO_REGULAR = Array.from({ length: 7 }, (_, i): readonly [number, number] => [2.3 + 2.4 * i, 2.3 + 2.4 * i + 2.18]);
const HINO_LAYOUT: { end: SeriesLayout; middle: SeriesLayout } = {
  // the crew door behind the cab, the passengers' door at the rear deck over the rear bogie
  end: { doors: [[0.2, 0.78, 1], [14.55, 15.5, -1]], windows: HINO_PREMIUM },
  middle: { doors: [[0.55, 1.5, 1]], windows: HINO_REGULAR },
};

export const HINOTORI: ShinkansenSeries = {
  // 21.6 m end cars and 20.5 m intermediate cars over the couplers, 2.79 m wide, roof 3.74 m (ja.wikipedia)
  endLength: 21.6, midLength: 20.5, W: 1.395, Y: 1.1, S: 3.38, C: 3.74, lean: 0.96, B: 0.85, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: HINO_FACE,
  windows: [[2.12, 3.08]], windowW: 1.08, pitch: 1.3, door: [0.95, 2.62, 1.84, 2.48], doorW: 0.95, doorGlassW: 0.3,
  layout: HINO_LAYOUT,
  // the leading bogie under the cab door 3.9 m behind the tip, 14.15 m bogie centres
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, endBogies: [0.9, 15.05], midBogies: [2.925, 17.075], couplerY: 0.62, fittings: hinotoriFittings,
  liveries: {
    hinotori: {
      title: "Hinotori red", number: "80101",
      // metallic red #ad2320, premium gold #c29d3b (ja.wikipedia); the dark roof and face panel
      palette: { body: c("#a8211f", 0.22), frame: c("#b42420", 0.2), line: c("#c29d3b", 0.3), stripe: c("#5a1416", 0.35), band: c("#2a2224", 0.2), faceDark: c("#3e3a39", 0.3), roofG: c("#3b3837", 0.45), skirtG: c("#a8211f", 0.3), bumper: c("#b42420", 0.2), black: c("#141516", 0.5), gold: c("#c29d3b", 0.3) },
      bands: hinoBands("body", "line", "stripe", "band", "frame"), roof: "roofG", skirt: "skirtG",
      endSweeps: hinoSweeps("frame", "band"),
      doors: [[0, 1.93, "body"], [1.93, 9, "band"]],
      // under the phoenix beside the crew door and behind the passengers' door
      endLettering: [{ text: "HINOTORI", d: 1.25, y: 2.33, h: 0.065, mat: "gold" }, { text: "HINOTORI", d: 16.15, y: 2.33, h: 0.065, mat: "gold" }],
    },
    ace: {
      title: "Ace orange", number: "HV02",
      palette: { body: c("#1d2a4a"), frame: c("#e46c1d"), line: c("#efefea"), stripe: c("#1d2a4a"), band: c("#e46c1d"), faceDark: c("#1d2a4a", 0.3), roofG: c("#d9d9d5", 0.5), skirtG: c("#1d2a4a"), bumper: c("#1d2a4a"), black: c("#141516", 0.5), gold: c("#e46c1d") },
      bands: [[0, 1.31, "body"], [1.31, 1.37, "line"], [1.37, 9, "band"]], roof: "roofG", skirt: "skirtG",
      endSweeps: [{ mat: "cabGlass", ...HINO_CAB_WINDOW }],
    },
  },
  weight: { end: 46, middle: 44 }, power: 300, maxspeed: 130,
};

// the E259 Narita Express: its own module, drawn from its photographs
import { E259 } from "./jrE259.ts";
export { E259 };

// the 485 series and its bonnet: generator/jnr485.ts
import { S485 } from "./jnr485.ts";
export { S485 };

// --- Hankyu 9000 series (HANKYU9000) ---------------------------------------
// The 2006 Kobe / Takarazuka line set from photographs (assets/hankyu-9000/SOURCES.md): the glossy
// Hankyu maroon body under the ivory roof (its colour from the shoulder up, over the eaves), the
// slightly raked cab face with its two big round-cornered windscreens and the gangway door between
// them in a stainless frame running up into the headlight box under the roof, the rectangular
// tail and marker lamp boxes low in the face with chrome strips under them, the pale grey skirt
// round the coupler; on the sides three double doors 5.75 m apart, one big window between them and
// a smaller one at each end. Lateral positions on the face are seen from ahead (the viewer's right
// positive), heights over the rail: measured on the head-on photograph of 9002 (photo-hankyu-9002f.jpg,
// 197 px/m upright from the face's foot at 1.0 m to its top at 3.65 m, 190 px/m across) and along
// the side of 9000 (photo-hankyu-series9000-9000.jpg, a projective fit over its body ends and doors).

import type { SeriesCabFace as HkCabFace } from "./seriesCab.ts";
import { sidePanel as hkPanel, type SliceBody as HkBody } from "./sliceBody.ts";
import { block as hkBlock } from "./vehicleParts.ts";
import { centreCoupler as hkCoupler } from "./emuParts.ts";

/** Where the face meets the body's own section, behind its tip; the coupling plane ahead of the tip. */
const HK_JOIN = 0.45;
const HK_REACH = 0.12;
/** The door pitch (5.75 m) and the door centres: the end car's d behind its face's tip, an intermediate car's d behind its body's end. */
const HK_PITCH = 5.75;
const HK_END_DOORS = [0, 1, 2].map((i) => 3.65 + HK_PITCH * i);
const HK_MID_DOORS = [0, 1, 2].map((i) => 3.5 + HK_PITCH * i);
/** The end car's raised pantograph, d behind its body's front (tip-d 15.6 m, over the inner bogie: photo-hankyu-9100.jpg). */
const HK_PANTO = 15.6 - HK_JOIN;

/** One side's windows from its door centres: a 2.8 m two-pane window between doors (a mullion at its middle), a 1.5 m one at a plain end, a narrow one behind the cab. */
function hkWindows(doors: readonly number[], end: "cab" | "plain", L: number): Array<[number, number]> {
  const out: Array<[number, number]> = [end === "cab" ? [1.75, 2.3] : [0.4, 1.9]];
  for (let i = 0; i + 1 < doors.length; i++) { const c = (doors[i]! + doors[i + 1]!) / 2; out.push([c - 1.4, c + 1.4]); }
  out.push([L - 1.9, L - 0.4]);
  return out;
}

/** The end car's body from its face's tip to its inner end (19.0 m over the couplers). */
const HK_END_L = 19.0 - 0.25 - HK_REACH;
const HK_LAYOUT = {
  end: {
    doors: HK_END_DOORS.map((c, i): [number, number, number] => [c - 0.65 - HK_JOIN, c + 0.65 - HK_JOIN, i % 2 ? -1 : 1]),
    windows: hkWindows(HK_END_DOORS, "cab", HK_END_L).map(([a, b]): [number, number] => [a - HK_JOIN, b - HK_JOIN]),
  },
  middle: {
    doors: HK_MID_DOORS.map((c, i): [number, number, number] => [c - 0.65, c + 0.65, i % 2 ? -1 : 1]),
    windows: hkWindows(HK_MID_DOORS, "plain", 18.5),
  },
};

/** A rect on the face and its mirror across the centre line. */
const hkPair = (l0: number, l1: number, y0: number, y1: number, r: number, mat?: string) =>
  [{ lat: [-l1, -l0] as [number, number], y: [y0, y1] as [number, number], r, ...(mat ? { mat } : {}) }, { lat: [l0, l1] as [number, number], y: [y0, y1] as [number, number], r, ...(mat ? { mat } : {}) }];

/** The 9000's cab face (photo-hankyu-9002f.jpg head-on, photo-hankyu-9100.jpg and the side photographs for the rake and the corners). */
const HK_FACE: HkCabFace = {
  dJoin: HK_JOIN, dSide: 0.3, reach: HK_REACH, first: 3.0, roofFrom: 3.6,
  // upright at the lamps, leaning back 8 cm up the windscreens, the forehead rounding over into the roof
  profile: [[1.0, 0.03], [1.12, 0], [1.9, 0], [3.0, 0.05], [3.35, 0.09], [3.48, 0.14], [3.56, 0.21], [3.62, 0.31], [3.65, HK_JOIN]],
  // the plan's corners rounded 0.22 m and swept 0.3 m back; the face bowed 5 cm
  corner: [[1.0, 0.2], [3.35, 0.22], [3.5, 0.18], [3.62, 0.1], [3.65, 0.05]], cornerDepth: [[1.0, 0.3], [3.35, 0.32], [3.55, 0.24], [3.65, 0.08]], bulge: 0.05,
  cols: [8, 4, 1, 1],
  rows: [1.0, 1.08, 1.17, 1.37, 1.56, 1.76, 1.9, 2.4, 2.92, 3.03, 3.3, 3.41, 3.48, 3.56, 3.6, 3.62, 3.65],
  bands: () => [[0, 9, "maroon"]],
  masks: [
    // the stainless frame of the gangway door, from the chrome strips' height up into the roof
    { lat: [-0.44, 0.44], y: [1.08, 3.7], r: 0.03, mat: "stainless" },
    // the gangway door's maroon leaf and the white frame of its window
    { lat: [-0.37, 0.37], y: [1.17, 3.03], r: 0.05, mat: "maroon" },
    { lat: [-0.31, 0.31], y: [1.73, 2.95], r: 0.07, mat: "frameW" },
    // the windscreens' white frames
    ...hkPair(0.46, 1.27, 1.9, 3.41, 0.15, "frameW"),
    // the headlight box over the door: its bright surround and the dark recess
    { lat: [-0.31, 0.31], y: [3.3, 3.56], r: 0.06, mat: "frameW" },
    { lat: [-0.27, 0.27], y: [3.33, 3.53], r: 0.05, mat: "lampBox" },
    // the tail and marker lamp boxes, their bright rims
    ...hkPair(0.64, 1.08, 1.37, 1.56, 0.035, "frameW"),
    ...hkPair(0.67, 1.05, 1.4, 1.53, 0.025, "lampBox"),
    // the lamp boxes' lenses (painted here, not panes, so that the distant face's glass stays above them):
    // the red tail lamp outboard, the white marker lamp inboard
    ...hkPair(0.87, 1.02, 1.43, 1.5, 0.01, "lampRed"),
    ...hkPair(0.7, 0.85, 1.43, 1.5, 0.01, "lampHead"),
    // the thin bright strips under the windscreens
    ...hkPair(0.52, 1.16, 1.835, 1.852, 0.0, "frameW"),
  ],
  panes: [
    ...hkPair(0.49, 1.24, 1.93, 3.38, 0.13),
    { lat: [-0.28, 0.28], y: [1.76, 2.92], r: 0.05 },
    // the destination board (left) and the train type board (right) behind the windscreens' heads
    ...hkPair(0.64, 1.08, 3.06, 3.25, 0.02, "destBoard"),
  ],
  // the four LED headlights in the box, in two pairs
  lamps: [[-0.185, 3.43, 0.045, "lampHead"], [-0.095, 3.43, 0.045, "lampHead"], [0.095, 3.43, 0.045, "lampHead"], [0.185, 3.43, 0.045, "lampHead"]],
  pods: [
    // the chrome strips across the face's foot either side of the door
    { lat: -0.84, y: 1.115, w: 0.62, h: 0.05, r: 0.015, proud: 0.03, depth: 0.02, mat: "chrome" },
    { lat: 0.84, y: 1.115, w: 0.62, h: 0.05, r: 0.015, proud: 0.03, depth: 0.02, mat: "chrome" },
  ],
  texts: [{ text: "9000", lat: -0.85, y: 1.64, h: 0.13, mat: "numberW" }],
  // one parked on each windscreen and one on the door's window
  wipers: [[[0.92, 1.99], [0.64, 2.6]], [[-0.92, 1.99], [-1.2, 2.6]], [[0.2, 2.86], [0.02, 2.3]]],
};

/** The 9000's fittings: the skirt and coupler under the face, the crew door, the window frames, the side destination boards, the roof cover and the underfloor boxes. */
function hkFittings(m: MeshBuilder, b: HkBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const box = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => hkBlock(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const L = car.length, C = HANKYU9000.C, [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => {
    // the equipment boxes between the bogies, in four groups
    const [a, e] = [t0 + 1.9, t1 - 1.9], w = (e - a - 1.2) / 4;
    for (let i = 0; i < 4; i++) m.scope(`box ${i + 1}`, () => box("under", a + i * (w + 0.4), a + i * (w + 0.4) + w, HANKYU9000.B - (i % 2 ? 0.55 : 0.45), HANKYU9000.B + 0.02, -1.15, 1.15));
  });
  m.scope("roof cover", () => {
    // the long low cover over the air conditioning along the crown, its edges chamfered
    // on an end car it stops short of the pantograph's base over the rear bogie
    const j = car.end ? HK_JOIN : 0, [d0, d1] = [car.end ? 1.6 - j : 1.2, car.end ? HK_PANTO - 1.75 : L - 1.2];
    const sec: Array<[number, number]> = [[-0.9, C - 0.12], [0.9, C - 0.12], [0.9, C + 0.02], [0.75, C + 0.07], [-0.75, C + 0.07], [-0.9, C + 0.02]];
    m.sweep("roofCover", "x", sec, X(d1), sec, X(d0));
    // its louvres either side
    for (const d of [0.3, 0.7]) for (const z of [1, -1]) box("louvre", d0 + (d1 - d0) * d - 0.5, d0 + (d1 - d0) * d + 0.5, C - 0.06, C + 0.015, z > 0 ? 0.9 : -0.912, z > 0 ? 0.912 : -0.9);
  });
  const rows = car.end ? HK_LAYOUT.end.windows : HK_LAYOUT.middle.windows;
  const [w0, w1] = HANKYU9000.windows[0]!;
  m.scope("window frames", () => {
    // the bright aluminium frames round every window
    for (const sd of [1, -1]) for (const [a, e] of rows)
      for (const [p, q, y0, y1] of [[a, e, w0, w0 + 0.05], [a, e, w1 - 0.05, w1], [a, a + 0.05, w0 + 0.05, w1 - 0.05], [e - 0.05, e, w0 + 0.05, w1 - 0.05], ...(e - a > 2 ? [[(a + e) / 2 - 0.025, (a + e) / 2 + 0.025, w0 + 0.05, w1 - 0.05]] : [])] as const)
        hkPanel(m, b, X, sd, "frameW", p, q, y0, y1, 0.016, 0.006);
  });
  m.scope("destination boards", () => {
    // the small LED boards under the eaves over the window behind the middle door
    const c = (rows[2]![0] + rows[2]![1]) / 2;
    for (const sd of [1, -1]) { hkPanel(m, b, X, sd, "lampBox", c - 0.55, c + 0.05, 2.96, 3.14, 0.012, 0.004); hkPanel(m, b, X, sd, "lampBox", c + 0.2, c + 0.45, 2.96, 3.14, 0.012, 0.004); }
  });
  if (!car.end) return;
  const dj = HK_JOIN, tip = X(-dj), k = Math.sign(tip - X(0));
  m.scope("crew door", () => {
    // the crew door behind the cab (tip-d 0.65 - 1.3 m), its outline and the two grab rails beside it
    const [d0, d1, y0, y1, q] = [0.65 - dj, 1.3 - dj, 1.15, 3.0, 0.02];
    for (const sd of [1, -1]) {
      for (const [a, e, p, r] of [[d0, d0 + q, y0, y1], [d1 - q, d1, y0, y1], [d0 + q, d1 - q, y1 - q, y1], [d0 + q, d1 - q, y0, y0 + q]] as const) hkPanel(m, b, X, sd, "rubber", a, e, p, r, 0.006, 0.02);
      for (const d of [d0 - 0.1, d1 + 0.08]) hkPanel(m, b, X, sd, "chrome", d - 0.015, d + 0.015, 1.45, 2.7, 0.022, 0.01);
    }
  });
  m.scope("skirt", () => {
    // the pale grey skirt under the face: a bar across under the coupler and two cheeks either side of it,
    // their outer ends turning back round the corners
    const f = tip - k * 0.04, plate = (y0: number, y1: number, z0: number, z1: number, back0 = 0, back1 = 0) => {
      const sec = (bk: number): Array<[number, number]> => (k > 0
        ? [[f - bk - 0.35, y0], [f - bk - 0.06, y0], [f - bk, y1], [f - bk - 0.35, y1]]
        : [[f + bk + 0.35, y0], [f + bk + 0.35, y1], [f + bk, y1], [f + bk + 0.06, y0]]);
      m.sweep("skirtL", "z", sec(back0), z0, sec(back1), z1);
    };
    plate(0.28, 0.45, -0.62, 0.62);
    for (const sd of [1, -1]) {
      const [a, e] = sd > 0 ? [0.62, 1.18] : [-1.18, -0.62];
      plate(0.28, 1.0, a, e);
      // the corner: back 0.3 m over the last 0.14 m
      if (sd > 0) plate(0.28, 1.0, 1.18, 1.32, 0, 0.3); else plate(0.28, 1.0, -1.32, -1.18, 0.3, 0);
    }
    // the dark gear behind the skirt over the coupler
    box("under", -dj + 0.55, 1.9 - dj, 0.45, HANKYU9000.B + 0.01, -0.6, 0.6);
  });
  // the tight-lock coupler under the face, its head at the coupling plane
  m.scope("coupler", () => hkCoupler(m, k, tip - k * 1.0, tip + k * HK_REACH, HANKYU9000.couplerY!, "couplerG"));
}

/** Both liveries' face, frame, lamp and fitting paints. */
const hkPalette = (roof: string) => ({
  maroon: c("#561520", 0.25), cabMask: c("#561520", 0.25), roofG: c(roof, 0.5), skirtG: c("#561520", 0.25),
  stainless: { color: "#a6a39a", metallic: 0.7, roughness: 0.3 }, chrome: { color: "#d6d7d8", metallic: 0.85, roughness: 0.2 },
  frameW: c("#e4e3dc", 0.35), lampBox: c("#202225", 0.4), numberW: c("#eeeeea", 0.4), skirtL: c("#c4c6c8", 0.5),
  roofCover: c(roof, 0.55), louvre: c("#6b6e72", 0.6), couplerG: c("#8d8f91", 0.5),
  destBoard: { color: "#121416", metallic: 0.2, roughness: 0.15, glass: true },
});

export const HANKYU9000: ShinkansenSeries = {
  // 19.0 m over the couplers, 2.75 m wide, the roof 3.65 m over the rail (Wikipedia "Hankyu 9000 series");
  // the sides upright, the ivory roof from the shoulder at 3.22 m
  endLength: 19.0, midLength: 19.0, W: 1.375, Y: 1.2, S: 3.22, C: 3.65, lean: 0.99, B: 1.0, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: HK_FACE, layout: HK_LAYOUT, couplerY: 0.88,
  windows: [[1.94, 2.91]], windowW: 2.8, pitch: HK_PITCH, door: [1.15, 3.0, 1.85, 2.88], doorW: 1.3, doorCount: 3, doorGlassW: 0.34, doorGlassPair: 0.62,
  // the bogies 13.0 m apart, centred on the body
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.1,
  endBogies: [2.825 - HK_JOIN, 15.825 - HK_JOIN], midBogies: [2.75, 15.75], fittings: hkFittings,
  // the single-arm pantographs on the end cars (9000, 9100) over their inner bogies, both raised; the intermediate cars have none
  endPantograph: true, pantographAt: HK_PANTO,
  liveries: {
    maroon: { title: "Hankyu maroon", palette: hkPalette("#e6dfca"), bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9000" },
    allMaroon: { title: "Plain maroon", palette: hkPalette("#7d8084"), bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9300" },
  },
  weight: { end: 32, middle: 36 }, power: 600, maxspeed: 115,
};

const P = { e235: seriesParams(E235), s103: seriesParams(S103), gse: seriesParams(GSE), hinotori: seriesParams(HINOTORI), e259: seriesParams(E259), s485: seriesParams(S485), hankyu: seriesParams(HANKYU9000) };

export function jrE235(v?: ParamValues): MeshBuilder { return buildSeries(E235, P.e235, v); }
export function jrE235Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E235, P.e235, v); }
export function jnr103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function jnr103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function odakyuGse(v?: ParamValues): MeshBuilder { return buildSeries(GSE, P.gse, v); }
export function odakyuGseLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GSE, P.gse, v); }
export function kintetsuHinotori(v?: ParamValues): MeshBuilder { return buildSeries(HINOTORI, P.hinotori, v); }
export function kintetsuHinotoriLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HINOTORI, P.hinotori, v); }
export function jrE259(v?: ParamValues): MeshBuilder { return buildSeries(E259, P.e259, v); }
export function jrE259Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E259, P.e259, v); }
export function jnr485(v?: ParamValues): MeshBuilder { return buildSeries(S485, P.s485, v); }
export function jnr485Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S485, P.s485, v); }

export function hankyu9000(v?: ParamValues): MeshBuilder { return buildSeries(HANKYU9000, P.hankyu, v); }
export function hankyu9000Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HANKYU9000, P.hankyu, v); }

export const JP_EMU_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-jr-e235": E235, "proc-vehicle-jnr-103": S103, "proc-vehicle-odakyu-gse": GSE,
  "proc-vehicle-kintetsu-hinotori": HINOTORI, "proc-vehicle-jr-e259": E259, "proc-vehicle-jnr-485": S485, "proc-vehicle-hankyu-9000": HANKYU9000,
};

export const JP_EMUS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-jr-e235", "JR E235", E235, P.e235, jrE235, jrE235Lod, "jr-e235", "uic"),
  seriesDesign("proc-vehicle-jnr-103", "JNR 103 series", S103, P.s103, jnr103, jnr103Lod, "jnr-103", "uic"),
  seriesDesign("proc-vehicle-odakyu-gse", "Odakyu Romancecar GSE", GSE, P.gse, odakyuGse, odakyuGseLod, "odakyu-gse", "uic"),
  seriesDesign("proc-vehicle-kintetsu-hinotori", "Kintetsu Hinotori", HINOTORI, P.hinotori, kintetsuHinotori, kintetsuHinotoriLod, "kintetsu-hinotori", "uic"),
  seriesDesign("proc-vehicle-jr-e259", "JR E259 Narita Express", E259, P.e259, jrE259, jrE259Lod, "jr-e259", "uic"),
  seriesDesign("proc-vehicle-jnr-485", "JNR 485 series", S485, P.s485, jnr485, jnr485Lod, "jnr-485", "uic"),
  seriesDesign("proc-vehicle-hankyu-9000", "Hankyu 9000 series", HANKYU9000, P.hankyu, hankyu9000, hankyu9000Lod, "hankyu-9000", "uic"),
];
