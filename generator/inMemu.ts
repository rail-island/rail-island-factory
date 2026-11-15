// The Indian Railways MEMU (Mainline EMU; ICF / BEML / RCF, 25 kV AC) on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): the flat, upright cab front of the ICF
// family with its top rounding back into the roof, the twin-lamp headlight housing standing on the
// dome, the spot lamp at its left corner, the two windscreens behind their bar grilles with the
// destination boxes over them, the front's paint (cream above the windscreens, the lower front in the
// scheme's colour with the red V of the Southern Railway units, or the cream V of the Northern
// Railway ones), the hood box and marker lamps, the flasher, the horns, the side buffers, the screw
// coupling and the cattle guard; along the driving motor coach the cab door, the louvred equipment
// hatch, two passenger doors with their footsteps and the barred windows in the window band; the
// trailer coaches with two doors a side; the single-arm pantograph near the motor coach's inner end;
// ICF bogies. Matched to the photographs in assets/ir-memu/ (SOURCES.md). The body keeps the 3.66 m
// width narrowed to the 3.3 m gauge. See docs/models/india-trains.md.
//
// Heights over the rail; d behind the face's tip on the face (and in the TIP_* tables), else d behind
// the body's front end (the face's join, JOIN behind the tip); lat seen from ahead, viewer's right
// positive.

import { ngon, type MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ParamValues } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesParams, type ShinkansenLivery, type ShinkansenSeries, type SeriesLayout } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { horn } from "./dieselParts.ts";

/** Body length face to inner end (about 21.3 m), the buffers' reach and the coupling gap (shinkansen.ts GAP). */
const BODY = 21.3;
const BUFFERS = 0.65;
const GAP = 0.25;
/** Where the face's dome reaches the crown, behind the tip. */
const JOIN = 0.45;
/** Half width (3.66 m narrowed to the 3.3 m gauge), body foot, skirt top, shoulder (the roof arc's foot) and crown. */
const W = 1.62;
const FOOT = 0.9;
const SHOULDER = 3.5;
const C = 4.1;

/** The side's window band (blue or maroon) and the barred windows in it, measured on the Kottayam photograph's motor coach (about 220 px/m up its side). */
const BAND: readonly [number, number] = [1.9, 2.81];
const WIN: readonly [number, number] = [2.06, 2.68];
const WINDOW_W = 0.62;
const PITCH = 0.78;
/** The front: cream above the windscreens' foot; the windscreens and the destination boxes over them (the head-on Delhi photograph, about 200 px/m on the face). */
const FRONT_TOP = 2.42;
const SCREEN: readonly [number, number] = [2.48, 3.28];
const DEST: readonly [number, number] = [3.37, 3.57];

/** The face's centre line: upright from the foot to 3.5 m, then the dome rounding back into the crown. */
const PROFILE: Pt[] = [[FOOT, 0], [3.5, 0], [3.68, 0.03], [3.83, 0.09], [3.95, 0.17], [4.04, 0.28], [C, JOIN]];

/** The red V of the Southern Railway units: two arms from the corners at the windscreens' foot to a point under the number. */
const RED_V: Array<{ mat: string; pts: Pt[] }> = [
  { mat: "vee", pts: [[-1.75, FRONT_TOP + 0.03], [0, 1.66], [0, 1.24], [-1.75, 2.0]] },
  { mat: "vee", pts: [[0, 1.66], [1.75, FRONT_TOP + 0.03], [1.75, 2.0], [0, 1.24]] },
];
/** The Northern Railway units' face: the lower colour rising at the corners to the windscreens' upper half, the cream reaching down between in a V to a point over the hood box (the Agra photograph). */
const NR_TOP = 3.05;
const CREAM_V: Array<{ mat: string; pts: Pt[] }> = [
  { mat: "cream", pts: [[-1.75, NR_TOP + 0.01], [0, 1.75], [0, NR_TOP + 0.01]] },
  { mat: "cream", pts: [[0, NR_TOP + 0.01], [0, 1.75], [1.75, NR_TOP + 0.01]] },
];

/** The windscreens (glass) and the destination boxes over them. */
const PANES: Array<readonly [number, number]> = [[-1.18, -0.1], [0.1, 1.18]];
const BOXES: Array<readonly [number, number]> = [[-1.0, -0.28], [0.28, 1.0]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.0, 1.24, 1.45, 1.5, 1.66, 1.68, 1.75, 1.8, 2.0, 2.1, FRONT_TOP, FRONT_TOP + 0.03, SCREEN[0], NR_TOP, NR_TOP + 0.01, SCREEN[1], 3.32, DEST[0], DEST[1]])].sort((a, b) => a - b);

function face(vee: ReadonlyArray<{ mat: string; pts: Pt[] }>, lowerTop: number): SeriesCabFace {
  return {
    dJoin: JOIN, dSide: 0.3, roofFrom: C + 0.1, first: 1.75, tolerance: 0.02, cols: [5, 2, 1, 1],
    profile: PROFILE,
    // the plan: flat across, the vertical corners rounded 0.12 m
    corner: [[FOOT, 0.12], [3.5, 0.12], [3.9, 0.1], [C, 0.05]],
    rows: ROWS,
    bands: () => [[0, lowerTop, "lower"], [lowerTop, 9, "cream"]],
    // the distant model's face: cream above the windscreens' foot on both faces (the V's average), keeping the pantograph within its budget
    lodBands: [[0, FRONT_TOP, "lower"], [FRONT_TOP, 9, "cream"]],
    fields: vee,
    masks: [
      ...PANES.map(([a, e]) => ({ lat: [a - 0.04, e + 0.04] as const, y: [SCREEN[0] - 0.04, SCREEN[1] + 0.04] as const, r: 0.08, mat: "rubber" })),
      ...BOXES.map(([a, e]) => ({ lat: [a, e] as const, y: DEST, r: 0.03, mat: "rubber" })),
      ...BOXES.map(([a, e]) => ({ lat: [a + 0.03, e - 0.03] as const, y: [DEST[0] + 0.03, DEST[1] - 0.03] as const, r: 0.02, mat: "display" })),
    ],
    panes: PANES.map(([a, e]) => ({ lat: [a, e] as const, y: SCREEN, r: 0.06 })),
    // the two marker lamps' black recesses under the hood box
    decals: [
      { mat: "rubber", pts: [[-0.05, 1.45], [0.35, 1.45], [0.35, 1.68], [-0.05, 1.68]] },
      { mat: "rubber", pts: [[0.55, 1.45], [0.95, 1.45], [0.95, 1.68], [0.55, 1.68]] },
    ],
    // the hood box over the marker lamps, the flasher left of it and the horns' boxes at the corners
    pods: [
      { lat: 0.42, y: 1.88, w: 1.3, h: 0.3, r: 0.02, proud: 0.14, depth: 0.03, mat: "lower" },
      { lat: -0.62, y: 1.86, w: 0.3, h: 0.3, r: 0.15, proud: 0.12, depth: 0.03, mat: "lower", lamps: [[0, 0.09, "lampHead"]] },
      { lat: -1.38, y: 1.92, w: 0.24, h: 0.24, r: 0.02, proud: 0.14, depth: 0.03, mat: "lower" },
      { lat: 1.38, y: 1.92, w: 0.24, h: 0.24, r: 0.02, proud: 0.14, depth: 0.03, mat: "lower" },
    ],
    number: { lat: -0.45, y: 2.2, h: 0.14, mat: "numInk" },
    wipers: [[[-0.5, 2.55], [-0.85, 3.0]], [[0.75, 2.55], [0.4, 3.0]]],
  };
}

/** A MEMU livery: cream with the window band and the lower front in one colour, the face's V. */
function memu(title: string, number: string, colour: string, vee: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      cream: c("#e2d9b2", 0.55), lower: c(colour, 0.5), vee: c(vee, 0.5), roofG: c("#8f908c", 0.7), skirtG: c("#b8aa84", 0.75),
      display: c("#d9c98a", 0.4), numInk: c("#efe6c4", 0.5), grilleBar: c("#2a2b2d", 0.5), lampBody: c("#c9c4b0", 0.4),
      steel: c("#3a3c3f", 0.55), stepG: c("#4a4c4f", 0.6), horn: c("#c8cacc", 0.35), vent: c("#7f807c", 0.7), lettering: c("#2a2c30"),
    },
    bands: [[0, BAND[0], "cream"], [BAND[0], BAND[1], "lower"], [BAND[1], 9, "cream"]],
    roof: "roofG", skirt: "skirtG",
  };
}

/** The motor coach's sides, d behind the tip: the cab door, the louvred hatch, two passenger doors, the windows in fours. */
const TIP_CAB_DOOR: readonly [number, number] = [0.55, 1.25];
const TIP_HATCH: readonly [number, number] = [1.42, 2.62];
const DOOR_W = 1.0;
const TIP_DOORS: Array<readonly [number, number]> = [TIP_CAB_DOOR, [2.8, 2.8 + DOOR_W], [15.4, 15.4 + DOOR_W]];
/** The pantograph's centre on the motor coach's body, 4 m from its inner end (the Kottayam photograph's folded one). */
const PANTO_AT = BODY - JOIN - 4.0;

/** Windows in fours between two doors (from, to: the piers' inner edges), each group centred, the groups spread evenly. */
function windowsBetween(from: number, to: number): Array<readonly [number, number]> {
  const groupLen = 3 * PITCH + WINDOW_W;
  const n = Math.max(1, Math.floor((to - from + 0.5) / (groupLen + 0.5)));
  const gap = (to - from - n * groupLen) / (n + 1);
  const out: Array<readonly [number, number]> = [];
  for (let g = 0; g < n; g++) {
    const a = from + gap + g * (groupLen + gap);
    for (let i = 0; i < 4; i++) out.push([a + i * PITCH, a + i * PITCH + WINDOW_W]);
  }
  return out;
}

/** A door's two halves, the leaves sliding apart (a single leaf for the narrow cab door). */
const leaves = ([a, e]: readonly [number, number]): Array<readonly [number, number, number]> => (e - a < 0.8 ? [[a, e, 1]] : [[a, (a + e) / 2, -1], [(a + e) / 2, e, 1]]);

const END_L = BODY - JOIN;
const END_DOORS = TIP_DOORS.map(([a, e]): readonly [number, number] => [a - JOIN, e - JOIN]);
const END_LAYOUT: SeriesLayout = {
  doors: END_DOORS.flatMap(leaves),
  windows: [...windowsBetween(END_DOORS[1]![1] + 0.15, END_DOORS[2]![0] - 0.15), ...windowsBetween(END_DOORS[2]![1] + 0.15, END_L - 0.2)],
};
/** The trailer coach: two doors a side, a quarter of the car in from each end, the windows in fours between and beyond them. */
const MID_L = BODY;
const MID_DOORS: Array<readonly [number, number]> = [[MID_L / 4 - DOOR_W / 2, MID_L / 4 + DOOR_W / 2], [(3 * MID_L) / 4 - DOOR_W / 2, (3 * MID_L) / 4 + DOOR_W / 2]];
const MID_LAYOUT: SeriesLayout = {
  doors: MID_DOORS.flatMap(leaves),
  windows: [...windowsBetween(0.2, MID_DOORS[0]![0] - 0.15), ...windowsBetween(MID_DOORS[0]![1] + 0.15, MID_DOORS[1]![0] - 0.15), ...windowsBetween(MID_DOORS[1]![1] + 0.15, MID_L - 0.2)],
};

/** The cab end's fittings (the tip at d = -JOIN): headlight housing, spot lamp, windscreen grilles, horns, cattle guard. */
function cabEnd(m: MeshBuilder, X: (d: number) => number): void {
  const tip = X(-JOIN);
  // lat (viewer's right, seen from ahead) to z
  const z = (lat: number) => -lat;
  m.scope("headlight", () => {
    // the twin headlights in a round housing standing on the dome's front
    const y = 3.9, r = 0.27, x0 = X(-JOIN + 0.3), x1 = tip + 0.08;
    m.sweep("lampBody", "x", ngon(16, r, 0, 0, y), x0, ngon(16, r, 0, 0, y), x1);
    m.sweep("rubber", "x", ngon(16, r - 0.04, 0, 0, y), x1, ngon(16, r - 0.04, 0, 0, y), x1 + 0.01);
    for (const l of [-0.09, 0.09]) m.sweep("lampHead", "x", ngon(10, 0.075, 0, z(l), y), x1 + 0.01, ngon(10, 0.075, 0, z(l), y), x1 + 0.02);
  });
  m.scope("spot lamp", () => {
    // the searchlight box at the face's upper left corner, on the dome
    block(m, "rubber", X(-JOIN + 0.25), tip + 0.08, 3.68, 3.86, z(-1.0) - 0.1, z(-1.0) + 0.1);
    block(m, "lampHead", tip + 0.08, tip + 0.09, 3.72, 3.82, z(-1.0) - 0.06, z(-1.0) + 0.06);
  });
  m.scope("grilles", () => {
    // the bar grilles over the windscreens: a frame and nine bars, standing 6 cm off the face
    const x0 = tip + 0.05, x1 = tip + 0.075;
    for (const [a, e] of PANES) {
      const [y0, y1] = [SCREEN[0] - 0.02, SCREEN[1] + 0.02];
      block(m, "grilleBar", x0, x1, y0, y0 + 0.025, z(e + 0.03), z(a - 0.03));
      block(m, "grilleBar", x0, x1, y1 - 0.025, y1, z(e + 0.03), z(a - 0.03));
      for (let i = 0; i <= 9; i++) {
        const l = a - 0.03 + ((e - a + 0.06) * i) / 9;
        block(m, "grilleBar", x0, x1, y0, y1, z(l) - 0.01, z(l) + 0.01);
      }
      // the brackets holding it off the face
      for (const l of [a, e]) block(m, "grilleBar", tip, x0, (y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02, z(l) - 0.015, z(l) + 0.015);
    }
  });
  m.scope("horns", () => {
    for (const l of [-1.38, 1.38]) horn(m, 1, tip + 0.1, z(l), 1.74);
  });
  m.scope("cattle guard", () => {
    // the grille hanging under the buffer beam: three rails and the uprights between them
    const [x0, x1] = [tip + 0.1, tip + 0.2];
    for (const y of [0.22, 0.45, 0.68]) block(m, "under", x0, x1, y, y + 0.06, -1.15, 1.15);
    for (let i = 0; i <= 8; i++) {
      const zz = -1.15 + (2.3 * i) / 8;
      block(m, "under", x0, x1, 0.22, 0.86, zz - 0.04, zz + 0.04);
    }
    // the dark plate behind the grille
    block(m, "under", x0 - 0.06, x0 - 0.02, 0.3, 0.84, -1.1, 1.1);
    // its stays back to the body
    for (const zz of [-1.0, 1.0]) block(m, "under", tip - 0.05, x0, 0.62, 0.86, zz - 0.04, zz + 0.04);
  });
}

/** Horizontal bars over every window (and the doors' windows), the doors' footsteps, the roof vents and the underfloor gear. */
function memuFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const lay = car.end ? END_LAYOUT : MID_LAYOUT;
  const doors = car.end ? END_DOORS : MID_DOORS;
  if (car.end) m.scope("cab end", () => cabEnd(m, X));
  m.scope("window bars", () => {
    // flat strips just proud of the glass: two triangles a bar
    const tris: Pt[] = [];
    for (const [a, e] of lay.windows) for (let k = 1; k <= 3; k++) {
      const y = WIN[0] + ((WIN[1] - WIN[0]) * k) / 4;
      const [d0, d1, y0, y1] = [a + 0.04, e - 0.04, y - 0.012, y + 0.012];
      tris.push([d0, y0], [d1, y0], [d1, y1], [d0, y0], [d1, y1], [d0, y1]);
    }
    for (const sd of [1, -1]) sideDecal(m, b, X, sd, "grilleBar", tris, 0.016);
  });
  m.scope("footsteps", () => {
    // two steps hanging under every doorway on their side frames, for the low platforms
    for (const sd of [1, -1]) for (const [a, e] of doors) {
      const [x0, x1] = [Math.min(X(a + 0.08), X(e - 0.08)), Math.max(X(a + 0.08), X(e - 0.08))];
      const [zi, zo] = [sd * (W - 0.32), sd * (W - 0.06)];
      for (const y of [0.72, 0.44]) block(m, "stepG", x0, x1, y - 0.03, y, Math.min(zi, zo), Math.max(zi, zo));
      for (const x of [x0, x1 - 0.03]) block(m, "stepG", x, x + 0.03, 0.41, FOOT + 0.05, Math.min(zo, zo - sd * 0.03), Math.max(zo, zo - sd * 0.03));
    }
  });
  m.scope("grab rails", () => {
    // a vertical handrail beside each doorway, standing off the side
    for (const sd of [1, -1]) for (const [a, e] of doors) for (const d of [a - 0.06, e + 0.06]) sidePanel(m, b, X, sd, "horn", d - 0.015, d + 0.015, 1.35, 2.75, 0.02, 0.012);
  });
  m.scope("roof vents", () => {
    // the cowled ventilators along both sides of the roof
    for (const sd of [1, -1]) for (let d = 1.6; d + 0.5 < L - 0.8; d += 2.6) crownPane(m, b, X, sd, "vent", [d, d + 0.5], [1.18, 1.36], 0.05);
  });
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    const mid = (t0 + t1) / 2;
    if (car.end) {
      // the transformer and the converter boxes of the motor coach
      block(m, "under", X(mid + 2.2), X(mid - 2.2), 0.42, FOOT, -1.0, 1.0);
      block(m, "under", X(t1 - 2.2), X(mid + 2.6), 0.52, FOOT, -1.2, 1.2);
      block(m, "under", X(mid - 2.6), X(t0 + 2.2), 0.52, FOOT, -1.2, 1.2);
    } else {
      // the trailer's water tanks and battery boxes
      block(m, "under", X(mid + 1.6), X(mid - 1.6), 0.55, FOOT, -0.9, 0.9);
      block(m, "under", X(t1 - 2.4), X(t1 - 3.6), 0.6, FOOT, -1.1, 1.1);
      block(m, "under", X(t0 + 3.6), X(t0 + 2.4), 0.6, FOOT, -1.1, 1.1);
    }
  });
}

export const MEMU: ShinkansenSeries = {
  endLength: BODY + BUFFERS + GAP, midLength: BODY + 2 * GAP, W, Y: 1.25, S: SHOULDER, C, lean: 0.99, B: FOOT, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: face(RED_V, FRONT_TOP),
  windows: [WIN], windowW: WINDOW_W, pitch: PITCH,
  // the doors: from the body's foot to under the roof, a barred window in each leaf
  door: [1.27, 3.3, WIN[0], WIN[1]], doorW: DOOR_W, doorGlassW: 0.3,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  // the equipment hatch behind the cab door: louvres over the band, a framed panel under it
  sidePanels: { end: [{ d: [TIP_HATCH[0], TIP_HATCH[1]], y: [1.88, 2.98], kind: "louvres", louvres: 11 }, { d: [TIP_HATCH[0], TIP_HATCH[1]], y: [1.02, 1.83], kind: "seam" }] },
  numberAt: [-(END_L / 2) + 6.5, 2.9, 0.15],
  // ICF bogies: 14.63 m apart, 2.896 m wheelbase, 952 mm wheels
  bogieCentres: 14.63, wheelR: 0.476, wheelbase: 2.896, cars: [4, 8],
  endPantograph: true, pantographAt: PANTO_AT, endCoupler: "buffers",
  fittings: memuFittings,
  liveries: {
    std: memu("MEMU maroon", "377", "#6b1d24", "#e2d9b2"),
    alt: memu("MEMU blue", "13029", "#24408a", "#d23a3c"),
  },
  weight: { end: 58, middle: 46 }, power: 920, maxspeed: 110,
};

/** The maroon livery takes the Northern Railway's face (the cream V), the blue one the Southern Railway's (the red V). */
const MEMU_NR: ShinkansenSeries = { ...MEMU, cabFace: face(CREAM_V, NR_TOP) };
const seriesOf = (v?: ParamValues): ShinkansenSeries => ((v?.livery ?? "std") === "std" ? MEMU_NR : MEMU);

export const MEMU_PARAMS = seriesParams(MEMU);
export function irMemu(v?: ParamValues): MeshBuilder { return buildSeries(seriesOf(v), MEMU_PARAMS, v); }
export function irMemuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(seriesOf(v), MEMU_PARAMS, v); }
