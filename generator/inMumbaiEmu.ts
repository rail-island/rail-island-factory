// The Mumbai suburban EMU of the Siemens / Bombardier / Medha era (2007 on), on the series
// kit (shinkansen.ts) with a cab face of its own (seriesCab.ts): a 25 kV AC rake of ~20.7 m
// cars, the 3.66 m body narrowed to the 3.3 m gauge ("us"). Measured from the photographs in
// assets/ir-mumbai-emu/ (SOURCES.md): the raked flat cab front with its two windscreens, the
// twin headlamps in black housings low on the face and the twin lamp on the roof, buffers and
// a cattle guard; four wide doorways a side on every car (open in service: drawn as the dark
// doorway with its grab pole), barred windows in pairs between them, the crew door behind the
// cab, the driver's roof unit, a single-arm pantograph on the motor car. Two schemes: the
// Siemens rakes' silver with the lavender band sweeping down to the yellow face ("std"), and
// Western Railway's Medha white with magenta bands and doors ("alt"). See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Body section: half width (3.24 m over the 3.3 m gauge), belly, shoulder, crown; skirt top and bottom. */
const W = 1.62, Y = 1.2, S = 3.28, C = 3.85, A = 1.1, B = 0.95;
/** The face meets the body this far behind its tip (the crown's set-back). */
const JOIN = 0.75;
/** The body's length: 20.0 m from the face's join, 20.75 m from the face's tip (the cars' 20.7 m). */
const L = 20.0;
/** Window row: sill and head (the photographs' 1.0 m tall barred windows); doorways: floor and head. */
const WIN: readonly [number, number] = [2.05, 3.0];
const DOOR: readonly [number, number] = [1.2, 3.08];
/** Doorway width (two leaves), pitch of the four doorways along a car, window width and the gap of a pair. */
const DW = 1.25, PITCH = 4.75, WW = 0.83, GAPW = 0.24;

/** Two leaves of a doorway centred at d (body coordinates), parting in the middle. */
const doorway = (d: number): Array<readonly [number, number, number]> => [[d - DW / 2, d, -1], [d, d + DW / 2, 1]];
/** A pair of windows centred on a pier at d. */
const pair = (d: number): Array<readonly [number, number]> => [[d - GAPW / 2 - WW, d - GAPW / 2], [d + GAPW / 2, d + GAPW / 2 + WW]];

/** End car (d from the tip): the four doorways' centres, the first 4.03 m behind the tip (side photographs 1168C, 2125C). */
const END_DOORS = [0, 1, 2, 3].map((k) => 4.025 + k * PITCH - JOIN);
/** Middle car: the four doorways symmetric about its middle. */
const MID_DOORS = [-1.5, -0.5, 0.5, 1.5].map((k) => L / 2 + k * PITCH);

const END_LAYOUT = {
  doors: END_DOORS.flatMap(doorway),
  windows: [
    // the one window between the crew door and the first doorway
    [2.1 - JOIN, 2.8 - JOIN] as const,
    ...[0, 1, 2].flatMap((k) => pair((END_DOORS[k]! + END_DOORS[k + 1]!) / 2)),
    // the one window between the last doorway and the inner end
    [L - 1.25, L - 0.5] as const,
  ],
};
const MID_LAYOUT = {
  doors: MID_DOORS.flatMap(doorway),
  windows: [[0.5, 0.5 + WW + 0.02] as const, ...[0, 1, 2].flatMap((k) => pair((MID_DOORS[k]! + MID_DOORS[k + 1]!) / 2)), [L - 0.52 - WW, L - 0.5] as const],
};

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The cab face (photo-mumbai-train.jpg head-on at ~222 px/m, photo-2249-...jpg, the side views of
 * 1168C): upright from the buffer beam to the headlamps (1.95 m), then raked back 0.34 m to the
 * windscreens' head and rounded over into the roof; corners rounded 0.22 m. Two equal windscreens
 * 1.23 m wide either side of a 0.16 m pillar, 2.43 - 3.5 m, in black surrounds; the headlamps two
 * by two in black housings at 1.99 m, 0.75 m off the centre line; two red markers and the IR
 * monogram left of the centre; the running number under the left windscreen.
 */
export const MUMBAI_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.6, reach: 0.07, first: 3.4, roofFrom: 3.72, tolerance: 0.03, cols: [5, 2, 1, 1], bulge: 0.03,
  profile: [[B, 0.04], [A, 0.01], [Y, 0], [1.95, 0], [2.4, 0.08], [3.5, 0.34], [3.68, 0.45], [3.8, 0.6], [C, JOIN]],
  corner: [[B, 0.2], [1.95, 0.22], [3.5, 0.25], [3.7, 0.2], [3.8, 0.1], [C, 0.03]],
  rows: [B, A, Y, 1.45, 1.5, 1.62, 1.75, 1.8, 1.95, 2.38, 2.43, 3.5, 3.56, 3.68, 3.72, 3.8, C],
  masks: [1, -1].map((sd) => ({ lat: (sd > 0 ? [0.03, 1.4] : [-1.4, -0.03]) as readonly [number, number], y: [2.37, 3.56] as const, r: 0.14, mat: "black" })),
  panes: [1, -1].map((sd) => ({ lat: (sd > 0 ? [0.08, 1.33] : [-1.33, -0.08]) as readonly [number, number], y: [2.43, 3.5] as const, r: 0.1 })),
  decals: [
    // the IR monogram in red bars left of the centre, under the windscreens
    { mat: "monogram", pts: box(-0.46, -0.04, 2.26, 2.31), fine: 1 },
    { mat: "monogram", pts: [[-0.36, 2.2], [-0.3, 2.2], [-0.12, 2.26], [-0.18, 2.26]], fine: 1 },
    { mat: "monogram", pts: box(-0.38, 0.04, 2.14, 2.19), fine: 1 },
  ],
  pods: [1, -1].map((sd) => ({
    lat: sd * 0.75, y: 1.99, w: 0.5, h: 0.3, r: 0.13, proud: 0.05, depth: 0.04, mat: "black",
    lamps: [[-0.11, 0.075, "lampHead"], [0.11, 0.075, "lampHead"]] as ReadonlyArray<readonly [number, number, string]>,
  })),
  lamps: [[-0.3, 2.03, 0.035, "lampRed"], [-0.08, 2.03, 0.035, "lampRed"]],
  number: { lat: -0.92, y: 2.2, h: 0.1, mat: "faceNo" },
  wipers: [[[0.62, 2.5], [0.42, 3.2]], [[-0.62, 2.5], [-0.42, 3.2]]],
  lodGlass: { hw: 1.33, y: [2.43, 3.5] },
};

/** The paints both schemes share. */
const COMMON = {
  black: c("#16181a", 0.35), faceNo: c("#1d1f22", 0.5), monogram: c("#c8202a", 0.5),
  bars: c("#8c9094", 0.45), pole: c("#c4c8cb", 0.25), roofBox: c("#c3c6c4", 0.5), horn: c("#9a9ea2", 0.35),
  guard: c("#3a3d40", 0.6), under: c("#26282a", 0.8), skirtG: c("#2a2c2e", 0.75), cabMask: c("#16181a", 0.35),
  doorway: c("#2c2e30", 0.9), lettering: c("#3a3d40", 0.5),
};

/**
 * Siemens rake (photo-1168-...jpg, photo-2249-...jpg, photo-2125-...jpg): silver-white body, the
 * lavender band under the windows from 1.3 m to 1.96 m sweeping down at the cab to a stripe across
 * the face, an orange line under the roof, the face yellow above the headlamps, doorways open.
 */
const STD: ShinkansenLivery = {
  title: "Mumbai suburban", number: "1168C",
  palette: { ...COMMON, white: c("#e2e4e3", 0.35), lavender: c("#a28fcc", 0.4), orange: c("#ef6e0b", 0.4), yellow: c("#f2c230", 0.4), roofG: c("#c9cbc8", 0.55) },
  bands: [[0, 1.3, "white"], [1.3, 1.96, "lavender"], [1.96, 3.12, "white"], [3.12, 3.2, "orange"], [3.2, 9, "white"]],
  front: [[0, 1.5, "white"], [1.5, 1.62, "lavender"], [1.62, 1.8, "white"], [1.8, 9, "yellow"]],
  doors: [[0, 9, "doorway"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the band's top sweeping down from the sill to the face's stripe ahead of the first doorway (1168C)
    { mat: "white", front: [[1.62, -9], [1.96, -9]], back: [[1.62, 1.0], [1.7, 1.95], [1.8, 2.55], [1.9, 2.95], [1.96, 3.15]] },
    // and its foot rising to the stripe under the crew door
    { mat: "white", front: [[1.3, -9], [1.5, -9]], back: [[1.3, 1.7], [1.4, 1.2], [1.5, 0.95]] },
  ],
};

/** Medha rake of Western Railway (photo-western-railway-medha-emu.jpg): white, magenta under the windows and under the roof, magenta door leaves, the yellow face with the black lamp band. */
const ALT: ShinkansenLivery = {
  title: "Western Railway", number: "8073A",
  palette: { ...COMMON, white: c("#ebe8e3", 0.35), magenta: c("#b02a55", 0.4), yellow: c("#f1d43a", 0.4), roofG: c("#c4c2bd", 0.55) },
  bands: [[0, 1.3, "white"], [1.3, 1.75, "magenta"], [1.75, 3.1, "white"], [3.1, 3.22, "magenta"], [3.22, 9, "white"]],
  front: [[0, 1.45, "white"], [1.45, 1.62, "magenta"], [1.62, 1.78, "white"], [1.78, 9, "yellow"]],
  doors: [[0, 9, "magenta"]],
  roof: "roofG", skirt: "skirtG",
  // the band lowered to the face's stripe ahead of the crew door
  endSweeps: [{ mat: "white", front: [[1.3, -9], [1.45, -9]], back: [[1.3, 0.75], [1.45, 0.75]] }, { mat: "white", front: [[1.62, -9], [1.75, -9]], back: [[1.62, 0.75], [1.75, 0.75]] }],
  // the black band joining the headlamps across the face
  faceFields: [{ mat: "black", pts: [[-1.12, 1.86], [1.12, 1.86], [1.2, 1.92], [1.2, 2.06], [1.12, 2.12], [-1.12, 2.12], [-1.2, 2.06], [-1.2, 1.92]] }],
};

/** The bars over a window: four across and two upright, standing off its glass (the photographs' grilles). */
function bars(m: MeshBuilder, b: SliceBody, X: (d: number) => number, sd: number, d0: number, d1: number): void {
  const [y0, y1] = [WIN[0] + 0.04, WIN[1] - 0.04];
  const tris: Pt[] = [];
  const quad = (a: number, e: number, p: number, q: number) => tris.push([a, p], [e, p], [e, q], [a, p], [e, q], [a, q]);
  for (let k = 1; k <= 4; k++) { const y = y0 + ((y1 - y0) * k) / 5; quad(d0 + 0.04, d1 - 0.04, y - 0.012, y + 0.012); }
  sideDecal(m, b, X, sd, "bars", tris.splice(0), 0.022);
  // the uprights in front of the cross bars
  for (const f of [1 / 3, 2 / 3]) { const d = d0 + (d1 - d0) * f; quad(d - 0.012, d + 0.012, y0, y1); }
  sideDecal(m, b, X, sd, "bars", tris, 0.03);
}

/** Roof units, horns, roof headlamp, crew door step, cattle guard, grab poles, bars and the underframe. */
function mumbaiFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const layout = car.end ? END_LAYOUT : MID_LAYOUT;
  m.scope("window bars", () => { for (const sd of [1, -1]) for (const [d0, d1] of layout.windows) bars(m, b, X, sd, d0, d1); });
  m.scope("grab poles", () => {
    // the upright pole in the middle of every doorway, from the floor to the head
    for (const sd of [1, -1]) for (const d of car.end ? END_DOORS : MID_DOORS) sidePanel(m, b, X, sd, "pole", d - 0.017, d + 0.017, DOOR[0] + 0.05, DOOR[1] - 0.05, 0.03, 0.03);
  });
  if (car.end) {
    m.scope("crew door", () => {
      // the motorman's door behind the face (d from the tip 0.85 - 1.5): its outline, window and the steps under it
      for (const sd of [1, -1]) {
        const [a, e] = [0.85 - JOIN, 1.5 - JOIN];
        for (const [d0, d1, y0, y1] of [[a, a + 0.02, Y + 0.05, DOOR[1]], [e - 0.02, e, Y + 0.05, DOOR[1]], [a, e, DOOR[1] - 0.02, DOOR[1]]] as const) sidePanel(m, b, X, sd, "black", d0, d1, y0, y1, 0.008, 0.02);
        sidePanel(m, b, X, sd, "black", a + 0.06, e - 0.06, 2.12, 2.95, 0.01, 0.02);
        sidePanel(m, b, X, sd, "cabGlass", a + 0.09, e - 0.09, 2.15, 2.92, 0.014, 0.004);
        const [z0, z1] = sd > 0 ? [W - 0.3, W - 0.08] : [-(W - 0.08), -(W - 0.3)];
        for (const y of [0.55, 0.85]) blk("guard", a + 0.05, e - 0.05, y - 0.03, y, z0, z1);
        blk("guard", a + 0.05, a + 0.09, 0.5, A, z0, z1);
        blk("guard", e - 0.09, e - 0.05, 0.5, A, z0, z1);
      }
    });
    m.scope("roof", () => {
      // the driver's air conditioner over the crew door and the first window (1168C: 1.5 m long, 0.3 m high)
      blk("roofBox", 0.55, 2.05, C - 0.06, C + 0.28, -0.62, 0.62);
      blk("roofBox", 0.7, 1.9, C + 0.28, C + 0.33, -0.5, 0.5);
      // the twin headlamp's housing on the roof's front edge, its lenses ahead
      blk("roofBox", -0.6, -0.3, 3.7, 3.93, -0.24, 0.24);
      for (const z of [-0.1, 0.1]) block(m, "lampHead", X(-0.6), X(-0.6) + 0.015, 3.76, 3.88, z - 0.06, z + 0.06);
      // the two air horns on the roof's front corners, pointing ahead
      for (const z of [-0.95, 0.95]) {
        blk("horn", -0.35, -0.1, C - 0.2, C - 0.08, z - 0.05, z + 0.05);
        blk("horn", -0.55, -0.35, C - 0.21, C - 0.07, z - 0.07, z + 0.07);
      }
    });
    m.scope("cattle guard", () => {
      // the slatted guard under the buffer beam, standing ahead of the face's foot
      const x0 = X(-JOIN) + 0.02, x1 = X(-JOIN) + 0.42;
      block(m, "guard", x0, x1, 0.66, 0.74, -1.3, 1.3);
      block(m, "guard", x1 - 0.12, x1, 0.22, 0.3, -1.2, 1.2);
      for (let k = 0; k <= 8; k++) { const z = -1.12 + (2.24 * k) / 8; block(m, "guard", x1 - 0.06, x1, 0.3, 0.66, z - 0.03, z + 0.03); }
    });
  }
  m.scope("underframe", () => {
    // the equipment cases between the bogies (the motor car's converter, a trailer's tanks and batteries), and two air reservoirs
    const [t0, t1] = [Math.min(...car.trucks), Math.max(...car.trucks)];
    blk("under", t0 + 2.4, t0 + 6.6, B - 0.55, B, -1.15, 1.15);
    blk("under", t0 + 7.2, t1 - 4.6, B - 0.45, B, -1.0, 1.0);
    blk("under", t1 - 4.0, t1 - 2.4, B - 0.45, B, -1.2, 1.2);
    for (const z of [-1.17, 1.17]) blk("guard", t0 + 7.4, t1 - 4.8, B - 0.42, B - 0.12, z - 0.14, z + 0.14);
  });
}

export const MUMBAI_EMU: ShinkansenSeries = {
  // ~21.4 m over the buffers / couplers, the 20.75 m body; 3.66 m wide narrowed to the gauge; 3.85 m high
  endLength: 21.65, midLength: 20.5, W, Y, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: MUMBAI_FACE,
  windows: [WIN], windowW: WW, pitch: 1.3, door: [DOOR[0], DOOR[1], 2.15, 2.9], doorW: DW, doorGlassW: 0.2,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  // the crew door's outline drawn by the fittings; the end car's number by the first doorway
  numberAt: [2.0 - L / 2, 3.13, 0.12],
  // the ICF bogies: 14.63 m apart under the 20.7 m car, 2.9 m wheelbase, 952 mm wheels
  bogieCentres: 14.6, wheelR: 0.476, wheelbase: 2.9, centredBogies: true, cars: [3, 6],
  endCoupler: "buffers", couplerY: 1.05,
  // the motor car's single arm near its end beside the cab car (2125C)
  pantographsBesideEnds: true, pantographAt: 2.4,
  fittings: mumbaiFittings,
  lodRoof: { d: [JOIN + 0.55, JOIN + 2.05], hw: 0.62, y: [C - 0.06, C + 0.3], mat: "roofBox" },
  liveries: { std: STD, alt: ALT },
  weight: { end: 58, middle: 46 }, power: 920, maxspeed: 100,
};

const P = seriesParams(MUMBAI_EMU);
export function buildMumbaiEmu(v?: ParamValues): MeshBuilder { return buildSeries(MUMBAI_EMU, P, v); }
export function buildMumbaiEmuLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MUMBAI_EMU, P, v); }
