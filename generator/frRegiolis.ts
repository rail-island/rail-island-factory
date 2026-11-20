// The Regiolis (Alstom Coradia Polyvalent; SNCF B 83500 / B 84500 / B 85000 bimodes, Z 51500 / Z 54500
// electrics ...; 2014 -): a low-floor articulated unit, 3, 4 or 6 cars on Jacobs bogies (the end car's
// leading motor bogie under its cab section), 2.85 m wide, 4.295 m high, 160 km/h. The 3-car set is
// 56 m, the 4-car 71.82 m: the end car 20.1 m from its coupler to the joint, the intermediate car
// 15.8 m joint to joint - the end car is an intermediate car with the 4.3 m cab section ahead of it.
// Drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the low white "chin"
// box standing out under the face round the open recess of the Scharfenberg coupler, the headlights in
// black teardrop housings at the face's creased corners (the round headlight outside, the red tail lamp
// inside), the black band under the windscreen with the Alstom roundel, the big windscreen leaning back
// about 43 degrees in its black surround and wrapping round onto the cab sides, the black helmet over
// the cab roof. Every car: the window rows of the low floor (sill 1.2 m) and the raised windows over
// the bogies at the car ends (sill 1.6 m), one 1.3 m double door a side with a narrow window in each
// leaf, the roof equipment and the side fairings at the cantrail; the pantograph on the second car.
//
// Two schemes: `ter`, the Pays de la Loire's (B 84549, photographed at Montreuil-Bellay): silver,
// the windows in black glazed bands with sloped ends, magenta doors with the TER yellow and green
// stripes ahead of them, the cyan sweep over the cab sides and round the windscreen; `grandEst`, the
// Fluo Grand Est (B 83559 at Strasbourg, B 85073 / B 85075 at Paris-Est): white over a navy window
// band, lime blocks beside blue doors, the yellow block over each car's end window, the blue swoosh
// from the headlights back over the cab sides to the first window.
//
// Measured on the photographs in assets/sncf-regiolis/ (SOURCES.md): B 84549 at Montreuil-Bellay (1),
// a three-quarter view of the whole 4-car set, by a 1-D projective fit over its three joints and the
// rear end (residuals under 1.5 px; about 6.5 px/m at the first joint, 4.3 px/m at the rear) for the
// door and window groups; B 85075 at Paris-Est (2), the intermediate car side-on at about 138 px/m
// over its 1.3 m door for the heights (door 0.6 - 2.87 m, its leaf windows 1.7 - 2.53 m, the navy band
// 1.09 - 2.64 m, the shoulder 3.55 m); the face head-on on Montreuil-Bellay (1) (72 px/m over the
// 2.85 m face: coupler recess 0.62 - 1.53 m, lamps 1.71 m, black band 2.16 - 2.41 m, windscreen to
// 3.87 m); its profile and the swoosh on B 83559 / B 85075 three-quarter. See docs/models/france-trains.md.
//
// Heights over the rail; on the face d behind its tip, in `endSweeps` and `sidePanels` d behind the
// tip, elsewhere d behind the body's front end (the face's join on an end car, the coupling gap on an
// intermediate car); `t()` and `p()` convert from the tip and from an intermediate car's coupling plane.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** The coupling plane ahead of the face's tip (the coupler's head in its recess) and the face's join behind it. */
const REACH = 0.2;
const JOIN = 2.9;
/** The kit's gap between an intermediate car's coupling plane and its body. */
const GAP = 0.25;
/** End car 20.1 m (coupler to joint), intermediate 15.8 m: 3 cars 56.0 m, 4 cars 71.8 m (published 56 / 71.82 m). */
const END_LENGTH = 20.1;
const MID_LENGTH = 15.8;
/** The cab section ahead of the end car's passenger part (an intermediate car's layout behind it). */
const CAB = END_LENGTH - MID_LENGTH;
/** Half width (2.85 m), shoulder, crown (4.0 m; 4.295 m over the roof equipment), belly and skirt. */
const W = 1.425;
const S = 3.55;
const C = 4.0;
const Y = 0.55;
const A = 0.52;
const B = 0.4;

/** d behind the tip to d on the end car's body. */
const t = (d: number) => +(d - JOIN).toFixed(3);
/** d behind an intermediate car's coupling plane to d on its body. */
const p = (d: number) => +(d - GAP).toFixed(3);
/** An intermediate car's position on the end car, behind its tip (the end car's passenger part starts at the cab section's end). */
const onEnd = (d: number) => +(d + CAB - REACH).toFixed(3);

/** The window rows: the low floor's and the raised windows over the bogies (sill, head). */
const LOW: readonly [number, number] = [1.2, 2.42];
const HIGH: readonly [number, number] = [1.62, 2.42];

/**
 * An intermediate car's side from its front coupling plane (B 84549's three cars by the projective fit,
 * B 85075's car side-on): the raised window over the front Jacobs bogie, the big window, the 1.3 m
 * door, four windows, the raised window over the rear Jacobs bogie.
 */
const SIDE = {
  front: [0.75, 1.95] as const,
  big: [2.15, 4.55] as const,
  door: 5.0,
  windows: [[6.75, 8.1], [8.3, 9.65], [9.85, 11.2], [11.4, 12.75]] as Array<[number, number]>,
  rear: [13.6, 15.0] as const,
};
/** The glazed band's ends sloping up over the bogies (the black band of the TER scheme). */
const GLAZE: readonly [number, number] = [1.12, 2.5];
const GLAZE_HIGH = 1.55;

// ---------------------------------------------------------------------------
// The cab face

/**
 * The centre line (B 83559 / B 85075 three-quarter, B 84549 head-on): the chin box upright from 0.58 to
 * 1.45 m round the coupler's recess, the face stepping back over it to the lamps (1.6 - 1.95 m), the
 * black band under the windscreen, the windscreen leaning back about 43 degrees from 2.42 m (0.72 m
 * back) to 3.85 m (2.0 m back), the helmet rounding into the roof 2.9 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.14], [0.48, 0.04], [0.58, 0], [1.45, 0], [1.52, 0.12], [1.6, 0.34], [1.95, 0.55], [2.15, 0.68], [2.42, 0.86],
  [2.9, 1.22], [3.4, 1.6], [3.72, 1.9], [3.86, 2.1], [3.95, 2.42], [C, JOIN],
];
const RECESS: readonly [number, number] = [0.58, 1.48];
const SURROUND: readonly [number, number] = [2.15, 3.95];
const GLASS: readonly [number, number] = [2.42, 3.84];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.52, RECESS[0], RECESS[1], 1.58, 1.72, 1.85, 2.02, 2.3, 3.0, 3.6, 3.9])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** The headlight housing on the viewer's right: a black teardrop from beside the recess up and out to the face's corner. */
const HOUSING: Pt[] = [[0.62, 1.6], [0.9, 1.55], [1.2, 1.58], [1.38, 1.7], [1.42, 1.9], [1.3, 2.02], [1.05, 1.96], [0.8, 1.82], [0.64, 1.7]];

/** The surround's foot at the corner (viewer's right), joining the housing's outer top. */
const SURROUND_FOOT: Pt[] = [[1.02, 2.1], [1.28, 1.99], [1.42, 1.88], [1.44, 2.3], [1.15, 2.42], [1.0, 2.3]];

const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.6, reach: REACH, first: onEnd(SIDE.door), roofFrom: C - 0.02, tolerance: 0.03, cols: [7, 4, 1, 1],
  profile: PROFILE,
  // the chin box's corners chamfered, the face narrowing up the windscreen into its wrap-round corners
  corner: [[B, 0.5], [1.45, 0.55], [1.7, 0.75], [2.2, 0.9], [3.0, 1.0], [3.7, 0.95], [3.95, 0.7], [C, 0.5]],
  cornerDepth: [[B, 0.8], [1.45, 0.85], [1.7, 1.15], [2.2, 1.45], [3.0, 1.65], [3.7, 1.5], [3.95, 0.9], [C, 0.4]],
  bulge: [[B, 0.06], [1.45, 0.08], [1.7, 0.14], [2.4, 0.16], [3.4, 0.1], [3.9, 0.04], [C, 0]],
  rows: ROWS,
  bands: () => [[0, 0.46, "skirtG"], [0.46, 3.92, "face"], [3.92, 9, "black"]],
  lodBands: [[0, 0.46, "skirtG"], [0.46, SURROUND[0], "face"], [SURROUND[0], 9, "black"]],
  lodGlass: { hw: 1.0, y: [GLASS[0], GLASS[1]] },
  fields: [
    // the headlights' black housings at the creased corners
    { mat: "black", pts: HOUSING }, { mat: "black", pts: mirror(HOUSING) },
    // the windscreen's surround running down its outer corners into the housings
    { mat: "black", pts: SURROUND_FOOT }, { mat: "black", pts: mirror(SURROUND_FOOT) },
  ],
  masks: [
    // the black surround of the windscreen with the band under it, the coupler's open recess
    { lat: [-1.12, 1.12], y: SURROUND, r: 0.3, mat: "black" },
    { lat: [-0.66, 0.66], y: RECESS, r: 0.14, mat: "recess" },
  ],
  panes: [{ lat: [-1.0, 1.0], y: GLASS, r: 0.2 }],
  decals: [
    // the Alstom roundel in the band under the windscreen
    { mat: "roundel", pts: box(-0.08, 0.08, 2.2, 2.34), fine: 1 },
  ],
  lamps: [[-1.1, 1.8, 0.12, "lampHead"], [1.1, 1.8, 0.12, "lampHead"], [-0.84, 1.72, 0.09, "lampRed"], [0.84, 1.72, 0.09, "lampRed"], [-1.33, 1.86, 0.04, "lampHead"], [1.33, 1.86, 0.04, "lampHead"]],
  number: { lat: -1.25, y: 1.38, h: 0.11, mat: "lettering" },
  wipers: [[[-0.3, 2.5], [-0.85, 3.4]], [[0.45, 2.5], [-0.05, 3.4]]],
};

// ---------------------------------------------------------------------------
// The sides

/** A double door of two leaves from d (each leaf with its own narrow window), the leaves sliding apart. */
const door = (d: number, w = 1.3): Array<readonly [number, number, number]> => [[d, d + w / 2, -1], [d + w / 2, d + w, 1]];
const span = (d0: number, d1: number) => [d0, d1] as const;

const MID_LAYOUT: SeriesLayout = {
  doors: door(p(SIDE.door)),
  windows: [],
  rows: [
    [span(p(SIDE.big[0]), p(SIDE.big[1])), ...SIDE.windows.map(([a, e]) => span(p(a), p(e)))],
    [span(p(SIDE.front[0]), p(SIDE.front[1])), span(p(SIDE.rear[0]), p(SIDE.rear[1]))],
  ],
};
const END_LAYOUT: SeriesLayout = {
  doors: door(t(onEnd(SIDE.door))),
  windows: [],
  rows: [
    [span(t(onEnd(SIDE.big[0])), t(onEnd(SIDE.big[1]))), ...SIDE.windows.map(([a, e]) => span(t(onEnd(a)), t(onEnd(e))))],
    [span(t(onEnd(SIDE.front[0])), t(onEnd(SIDE.front[1]))), span(t(onEnd(SIDE.rear[0])), t(onEnd(SIDE.rear[1])))],
  ],
};

/** The cab door behind the face (t), its droplight. */
const CAB_DOOR: readonly [number, number] = [3.15, 3.85];

/**
 * The TER scheme's black glazed bands round each window group (d on the body), as convex pieces: the
 * front group (the raised window and the big one) its bottom stepping down behind the raised window,
 * the rear group (four windows and the raised one) its bottom rising at the end over the bogie.
 */
function glazing(at: (d: number) => number): Array<{ mat: string; pts: Pt[] }> {
  const [g0, g1] = GLAZE, k = 0.1;
  const [f0, f1, b0, b1, w0, r0, r1] = [SIDE.front[0] - k, SIDE.front[1], SIDE.big[0], SIDE.big[1] + k, SIDE.windows[0]![0] - k, SIDE.rear[0], SIDE.rear[1] + k];
  return [
    { mat: "glazing", pts: [[at(f0), GLAZE_HIGH], [at(f1 + 0.1), GLAZE_HIGH], [at(b0 + 0.1), g0], [at(b1), g0], [at(b1), g1], [at(f0), g1]] },
    { mat: "glazing", pts: [[at(w0), g0], [at(r0 - 0.2), g0], [at(r0 + 0.2), GLAZE_HIGH], [at(r1), GLAZE_HIGH], [at(r1), g1], [at(w0), g1]] },
  ];
}

/** The TER stripes ahead of each door: the yellow, and the green beside the door's lower half. */
function terStripes(at: (d: number) => number): Array<{ mat: string; pts: Pt[] }> {
  const d = SIDE.door;
  return [
    { mat: "yellow", pts: box(at(d - 0.3), at(d - 0.17), 0.78, 3.25) },
    { mat: "green", pts: box(at(d - 0.15), at(d - 0.06), 0.78, 2.0) },
  ];
}

/** Fluo Grand Est's blocks: lime beside the door, the yellow over the rear raised window, the blue "fluo Grand Est" plate. */
function fluoBlocks(at: (d: number) => number, plate: boolean): Array<{ mat: string; pts: Pt[] }> {
  const d = SIDE.door;
  return [
    { mat: "lime", pts: box(at(d - 1.25), at(d - 0.05), 0.86, 1.62) },
    { mat: "lime", pts: [[at(d + 1.35), 0.86], [at(SIDE.windows[0]![1] + 0.15), 0.86], [at(SIDE.windows[0]![1] + 0.15), 1.5], [at(SIDE.windows[0]![1]), 1.65], [at(d + 1.35), 1.65]] },
    { mat: "yellow", pts: [[at(SIDE.rear[0] - 0.05), 2.46], [at(SIDE.rear[1] + 0.1), 2.46], [at(SIDE.rear[1] + 0.1), 2.82], [at(SIDE.rear[0] - 0.05), 2.82]] },
    ...(plate ? [{ mat: "plate", pts: box(at(d + 1.85), at(d + 6.4), 2.74, 3.18) }] : []),
  ];
}

const shiftEnd = (dm: number) => t(onEnd(dm));

/**
 * TER Pays de la Loire (B 84549): silver, the dark grey skirt, the windows in black glazed bands,
 * magenta doors; the cyan sweep over the cab sides from the face's corners back to the cab door, with
 * the cyan framing the windscreen on the face.
 */
const TER: ShinkansenLivery = {
  title: "TER", number: "B 84549",
  palette: {
    silver: c("#c2c6ca", 0.35), face: c("#e4e6e8", 0.35), cyan: c("#109fd8", 0.4), magenta: c("#8f1d55", 0.45), sncfRed: c("#c4203c", 0.4), yellow: c("#e3cf1b"), green: c("#3aa346"),
    glazing: c("#16191c", 0.25), black: c("#141618", 0.35), recess: c("#1c1e21", 0.8), roofG: c("#a3a8ad", 0.55), roofE: c("#8d9297", 0.6), skirtG: c("#4c5055", 0.7),
    silverTrim: c("#b9bec3", 0.3), lettering: c("#2a2c30"), whiteLine: c("#eef0f1"),
    grille: c("#3a3e43", 0.6), roundel: c("#b5babf", 0.3),
    cabSideGlass: { color: "#1b222b", metallic: 0.3, roughness: 0.08, glass: true },
  },
  bands: [[0, 0.78, "skirtG"], [0.78, 3.5, "silver"], [3.5, 9, "black"]],
  doors: [[0, 0.62, "skirtG"], [0.62, 9, "magenta"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the cyan from the face's corners over the cab sides to the cab door, a thin white line across it
    { mat: "cyan", front: [[A, -9], [S, -9]], back: [[A, 2.1], [1.2, 2.6], [2.2, 3.0], [S, 3.05]], face: false },
    { mat: "whiteLine", front: [[A, 1.75], [1.4, 2.25], [2.4, 2.75], [2.6, 2.8]], back: [[A, 1.82], [1.4, 2.32], [2.4, 2.82], [2.6, 2.87]] },
    // the windscreen wrapping round onto the cab sides under the helmet's edge
    { mat: "black", front: [[2.05, -9], [3.62, -9]], back: [[2.05, 0.95], [2.6, 1.6], [3.2, 2.35], [3.62, 2.75]], top: 3.62 },
    { mat: "cabSideGlass", front: [[2.4, -9], [3.5, -9]], back: [[2.4, 0.9], [2.9, 1.5], [3.3, 2.05], [3.5, 2.35]], top: 3.5 },
  ],
  faceFields: [
    // the cyan up the face's corners round the windscreen
    { mat: "cyan", pts: [[1.12, 1.4], [1.5, 1.2], [1.5, 4.0], [1.0, 4.0], [1.1, 2.4]] },
    { mat: "cyan", pts: mirror([[1.12, 1.4], [1.5, 1.2], [1.5, 4.0], [1.0, 4.0], [1.1, 2.4]]) },
    // the SNCF plate between the lamps
    { mat: "sncfRed", pts: box(0.12, 0.6, 1.84, 2.0) },
  ],
  sideFields: {
    end: [...glazing(shiftEnd), ...terStripes(shiftEnd)],
    middle: [...glazing(p), ...terStripes(p)],
  },
  lodSideFields: { end: [{ d: [0, 3.05], bands: [[0, A, "skirtG"], [A, 9, "cyan"]] }] },
  lodSides: [[0, 0.78, "skirtG"], [0.78, GLAZE[0], "silver"], [GLAZE[0], GLAZE[1], "glazing"], [GLAZE[1], 9, "silver"]],
};

/**
 * Fluo Grand Est (B 83559, B 85073, B 85075): white over the navy window band, the white line and the
 * dark grey skirt under it, blue doors with lime in their lower half, lime blocks beside them; on the end
 * car the white cab section and the blue swoosh from the headlights back over the cab sides.
 */
const GRAND_EST: ShinkansenLivery = {
  title: "Grand Est", number: "B 83559",
  palette: {
    white: c("#eceef0", 0.35), face: c("#e2e5e8", 0.35), navy: c("#1d2735", 0.4), blue: c("#1d71c4", 0.4), lime: c("#bfd400"), yellow: c("#f2cf00"), doorBlue: c("#1f7ccc", 0.4),
    plate: c("#1f73c6", 0.4), black: c("#121416", 0.35), recess: c("#1c1e21", 0.8), roofG: c("#3c4046", 0.55), roofE: c("#9aa0a6", 0.6), skirtG: c("#4b4f54", 0.7),
    lettering: c("#2a2c30"), silverTrim: c("#c9cdd1", 0.3),
    grille: c("#3a3e43", 0.6), roundel: c("#b5babf", 0.3),
    cabSideGlass: { color: "#1b222b", metallic: 0.3, roughness: 0.08, glass: true },
  },
  bands: [[0, 0.84, "skirtG"], [0.84, 1.09, "white"], [1.09, 2.64, "navy"], [2.64, 3.48, "white"], [3.48, 9, "black"]],
  doors: [[0, 0.62, "skirtG"], [0.62, 0.9, "doorBlue"], [0.9, 1.62, "lime"], [1.62, 9, "doorBlue"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the cab section white over the navy band, back to the first window
    { mat: "white", front: [[0.84, -9], [3.48, -9]], back: [[0.84, onEnd(SIDE.front[0]) - 0.35], [3.48, onEnd(SIDE.front[0]) - 0.35]] },
    // the blue swoosh: a point at the headlights, widening over the cab door to the rounded end over the first windows
    { mat: "blue", front: [[1.95, 1.2], [2.1, 0.75], [2.6, 0.95], [3.2, 1.6], [3.46, 2.1]], back: [[1.95, 1.3], [2.0, 3.6], [2.1, 6.6], [2.4, 8.1], [2.9, 8.5], [3.3, 8.3], [3.46, 7.9]] },
    { mat: "black", front: [[2.05, -9], [3.62, -9]], back: [[2.05, 0.95], [2.6, 1.6], [3.2, 2.35], [3.62, 2.75]], top: 3.62 },
    { mat: "cabSideGlass", front: [[2.4, -9], [3.5, -9]], back: [[2.4, 0.9], [2.9, 1.5], [3.3, 2.05], [3.5, 2.35]], top: 3.5 },
  ],
  // the Grand Est plate between the lamps
  faceFields: [{ mat: "plate", pts: box(0.1, 0.78, 1.86, 2.04) }],
  sideFields: {
    end: fluoBlocks(shiftEnd, false),
    middle: fluoBlocks(p, true),
  },
  lodSideFields: { end: [{ d: [0, 3.8], bands: [[0, 0.84, "skirtG"], [0.84, 2.0, "white"], [2.0, 3.48, "blue"], [3.48, 9, "black"]] }, { d: [3.8, 8.0], bands: [[0, 0.84, "skirtG"], [0.84, 1.09, "white"], [1.09, 2.05, "navy"], [2.05, 3.48, "blue"], [3.48, 9, "black"]] }] },
};

/** The roof equipment of every car, the cab's front gear and helmet. */
function regiolisFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const Cr = b.C(L / 2);
  // the body's own start on this car: an end car's passenger part begins behind the cab section
  const o = car.end ? t(onEnd(0)) : -GAP;
  m.scope("roof equipment", () => {
    // the side fairings at the cantrail hiding the equipment, louvred over the boxes
    for (const sd of [1, -1]) at("roofE", o + 1.0, o + 14.6, Cr - 0.3, Cr + 0.08, sd * 1.08, sd * 1.16);
    // the air conditioning over the front end, the converter / power pack over the middle, the brake resistors behind
    at("roofE", o + 1.2, o + 4.4, Cr - 0.05, Cr + 0.22, -0.95, 0.95);
    at("grille", o + 1.4, o + 4.2, Cr + 0.22, Cr + 0.24, -0.8, 0.8);
    at("roofE", o + 9.6, o + 14.3, Cr - 0.05, Cr + 0.25, -0.95, 0.95);
    at("grille", o + 9.8, o + 14.1, Cr + 0.25, Cr + 0.27, -0.75, 0.75);
    if (car.end) at("roofE", 0.6, o + 0.9, Cr - 0.05, Cr + 0.14, -0.8, 0.8);
  });
  if (car.end) m.scope("front gear", () => {
    // the Scharfenberg coupler in its recess, the plough under the chin
    const f = (d: number) => d - JOIN;
    at("carbon", f(-REACH), f(0.1), 0.85, 1.15, -0.17, 0.17);
    at("carbon", f(0.05), f(0.5), 0.93, 1.07, -0.08, 0.08);
    at("skirtG", f(0.15), f(0.8), 0.2, B + 0.03, -1.0, 1.0);
    // the helmet's black carried back over the cab roof
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "black", [0, 0.9], [0, 1.0], 0.004);
  });
}

/** The Regiolis: the end car leads (its motor bogie under the cab section), Jacobs bogies under the joints. */
export const REGIOLIS_SERIES: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.97, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [LOW, HIGH], windowW: 1.35, pitch: 1.55, windowCornerR: 0.12,
  // 1.3 m double doors (0.6 - 2.87 m), a narrow rounded window in each leaf 0.67 m apart
  door: [0.6, 2.87, 1.7, 2.53], doorW: 1.3, doorGlassW: 0.36, doorGlassR: 0.08,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  // the cab door's droplight
  cabWindows: [[t(CAB_DOOR[0] + 0.12), t(CAB_DOOR[1] - 0.12), 2.3, 2.85]],
  sidePanels: {
    // the cab door's outline, the lockers behind it
    end: [{ d: CAB_DOOR, y: [0.62, 2.95], kind: "seam" }, { d: [4.0, 4.55], y: [0.85, 2.3], kind: "seam" }],
  },
  // the motor bogie under the cab section, Jacobs bogies under the joints; 840 mm wheels
  jacobs: true, endBogies: [t(4.6), 0], bogieCentres: 12.0, wheelR: 0.42, wheelbase: 2.5,
  // one single-arm pantograph, on the second car near its middle
  onePantograph: true, pantographAt: p(7.5),
  fittings: regiolisFittings,
  cars: [3, 4, 6],
  liveries: { ter: TER, grandEst: GRAND_EST },
  weight: { end: 45, middle: 35 }, power: 450, maxspeed: 160,
};

const PARAMS = seriesParams(REGIOLIS_SERIES);

export function sncfRegiolis(v?: ParamValues): MeshBuilder { return buildSeries(REGIOLIS_SERIES, PARAMS, v); }
export function sncfRegiolisLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(REGIOLIS_SERIES, PARAMS, v); }

export const REGIOLIS_DESIGN: ProceduralDesign = seriesDesign("proc-vehicle-sncf-regiolis", "Regiolis", REGIOLIS_SERIES, PARAMS, sncfRegiolis, sncfRegiolisLod, "sncf-regiolis", "uic");
