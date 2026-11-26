// The OBB Railjet (Siemens Viaggio Comfort, 2008 -): a push-pull set of seven coaches - the driving
// trailer Afmpz with its business and first class, the first-class Ampz, the restaurant car ARbmpz,
// the economy coaches Bmpz and the coupling car Bmpvz - hauled by a 1116 / 1216 Taurus (its own design,
// not drawn here). Drawn on the series kit (shinkansen.ts), unwired (`traction: "none"`): the driving
// trailer is the series' end car with a cab face (seriesCab.ts) matched to the photographs in
// assets/obb-railjet/ (SOURCES.md) - the buffer beam with the rectangular buffers, the red face leaning
// back past the tall lamp housings to the big raked windscreen in its frame, the dark grey cap over it
// carrying the roof lamp and the number, the cab side's black glass field (its front following the
// windscreen's curve, its rear raked) and the small raked window behind it; the dark grey band's
// rounded point ahead of the door. The coaches are the series' intermediate car (doors at both ends, the
// display beside the first, ten panes in the black band) and the restaurant car its own series with
// the restaurant's window pattern and the loading door. `unit` `train` is the set the driving trailer
// leads (railjetTrain): 3 .. 7 cars, the restaurant car third (second in three), coaches to the rear.
// Registered in atUnits.ts. See docs/models/austria-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the buffer beam's front); elsewhere d behind
// the body's front end (the face's join, JOIN behind the tip). Positions along the driving trailer were
// measured behind the buffer heads (0.45 m ahead of the tip) and are written as `dt(p)`.

import { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { sideLettering, sidePanel, type SliceBody } from "./sliceBody.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, drawSeriesCar, SERIES_GAP, seriesCarLod, seriesCarPalette, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { articulate } from "./tramKit.ts";
import { block } from "./vehicleParts.ts";
import { fitUnit } from "./lodUnits.ts";
import type { LodSections } from "./lodKit.ts";

/** Where the face meets the body: the cap has rounded down to the full 4.05 m roof. */
const JOIN = 3.0;
/** The buffer heads ahead of the tip (the beam's front). */
const BUFFERS = 0.35;
/** A position measured behind the driving trailer's buffer heads, as d behind its body's front end. */
const dt = (p: number): number => p - BUFFERS - JOIN;

/** Published figures (de.wikipedia "Railjet 1. Generation"): 26.85 m driving trailer, 26.50 m coaches, 2.825 m wide, 4.05 m high, bogie centres 19.0 m, 2.5 m wheelbase. */
const DT_LENGTH = 26.85;
const COACH_LENGTH = 26.5;
const W = 2.825 / 2;
const C = 4.05;
const S = 3.5;
/**
 * The side's paint: the dark grey ("umbra") band from the floor to just under the windows, red above;
 * the light grey skirt between the bogies up to the floor (1.25 m), the body's own skirt (cut open
 * over the bogies) reaching up to A, the strip above it a side field.
 */
const A = 1.0;
const FLOOR = 1.25;
const BAND_TOP = 1.84;
/** The window band (sill, head; St. Valentin's Bmpz photograph, about 88 px/m at its near end). */
const WIN: readonly [number, number] = [1.95, 2.77];

/**
 * The face's centre line (the side-on photograph near Pfarrwerfen and Wien Hbf's 80-90 728): the buffer
 * beam upright from the plough to 1.42 m, the red face set back 0.22 m over it and leaning back about 12
 * degrees past the lamps to the windscreen's foot (2.47 m, 0.48 m behind the tip), the windscreen raked
 * about 45 degrees to its head (3.45 m, 1.42 m back), the dark grey cap rounding over to the roof.
 */
const PROFILE: Pt[] = [
  [0.55, 0.06], [0.7, 0], [1.42, 0], [1.46, 0.22], [1.6, 0.25], [2.0, 0.33], [2.38, 0.43], [2.47, 0.48], [2.95, 0.95], [3.45, 1.42],
  [3.6, 1.7], [3.75, 2.0], [3.88, 2.3], [3.97, 2.58], [4.02, 2.8], [C, JOIN],
];
/** The plan's corners: tight round the beam, rounder over the face and the windscreen, the cap rolling into the roof. */
const CORNER: Pt[] = [[0.55, 0.2], [1.42, 0.22], [1.46, 0.3], [2.0, 0.34], [2.47, 0.4], [3.45, 0.55], [3.78, 0.7], [3.98, 0.6], [C, 0.3]];
const DEPTH_TABLE: Pt[] = [[0.55, 0.25], [1.42, 0.3], [1.46, 0.5], [2.0, 0.6], [2.47, 0.8], [3.45, 1.0], [3.78, 0.9], [3.98, 0.5], [C, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
};
/** The corner's depth by height, kept ahead of the join. */
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH_TABLE, y)))]);

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The head lamp housing (viewer's right): a tall dark rectangle at the face's lower corner, its outer edge following the corner. */
const HOUSING: Pt[] = [[0.88, 1.56], [1.2, 1.56], [1.23, 1.6], [1.23, 2.16], [1.2, 2.2], [0.88, 2.2], [0.86, 2.16], [0.86, 1.6]];

const ROWS = [0.55, 0.62, 0.7, 1.42, 1.44, 1.46, 1.56, 2.2, 2.47, 3.45, 3.47, 3.6, 3.75, 3.88, 3.97, 4.02, C];

/** The driving trailer's cab face. */
const RAILJET_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (4.3 m behind the buffers, reach 1.96 m) runs on into the face
  wheelCut: { d: dt(4.3) + JOIN - 1.96, y: A },
  dJoin: JOIN, dSide: 2.2, first: dt(6.45) + JOIN, roofFrom: 9, cols: [4, 2, 1, 1], tolerance: 0.06, wrap: false, reach: BUFFERS,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, rows: ROWS,
  // the livery's own face bands (`front`)
  bands: (l) => l.front ?? l.bands,
  lodBands: [[0, 0.62, "face"], [0.62, 1.44, "beam"], [1.44, 2.47, "face"], [2.47, 3.45, "cabMask"], [3.45, 9, "cap"]],
  lod: {
    profile: [[0.55, 0.06], [0.7, 0], [1.42, 0], [1.46, 0.22], [2.47, 0.48], [3.45, 1.42], [3.75, 2.0], [3.97, 2.58], [C, JOIN]],
    corner: [[0.55, 0.2], [1.46, 0.3], [2.47, 0.4], [3.45, 0.55], [3.78, 0.7], [C, 0.3]],
    rows: [0.55, 0.7, 1.42, 1.46, 2.0, 2.47, 3.0, 3.45, 3.78, 3.98, C],
    cornerDepth: [[0.55, 0.25], [1.46, 0.5], [2.47, 0.8], [3.45, 1.0], [3.78, 0.9], [3.98, 0.5], [C, 0.05]],
  },
  lodGlass: { hw: 1.15, y: [2.5, 3.42] },
  // the windscreen: one wide pane in a dark frame
  masks: [{ lat: [-1.22, 1.22], y: [2.46, 3.47], r: 0.1, mat: "cabMask" }],
  panes: [{ lat: [-1.17, 1.17], y: [2.51, 3.42], r: 0.08, mat: "screen" }],
  fields: [{ mat: "lampG", pts: HOUSING }, { mat: "lampG", pts: mirror(HOUSING) }],
  // the beam's dark grey round the cab's lower corners and sides, over the skirt's paint
  paint: [{ mat: "beam", front: [[0.63, -9], [A, -9]], back: [[0.63, 9], [A, 9]] }],
  decals: [
    // the grab rail across the face under the windscreen
    { mat: "rubber", pts: box(-1.0, 1.0, 2.36, 2.39), fine: 1 },
  ],
  // the head lamp over the tail lamp in each housing
  lamps: [[1.05, 1.98, 0.12, "lampHead"], [1.05, 1.7, 0.07, "lampRed"], [-1.05, 1.98, 0.12, "lampHead"], [-1.05, 1.7, 0.07, "lampRed"]],
  roofLamp: [0, 3.7, 0.08],
  number: { lat: 0.2, y: 3.56, h: 0.08, mat: "faceText" },
  texts: [{ text: "railjet", lat: 0.62, y: 2.12, h: 0.1, mat: "faceText" }],
  // the wipers parked at the screen's foot, rising toward the centre pillar
  wipers: [[[0.05, 2.56], [-0.25, 3.3]], [[-0.45, 2.56], [-0.75, 3.3]]],
};

// ---------------------------------------------------------------------------
// Liveries

const RED = "#cf1220";
const UMBRA = "#4a4b4a";
const SILVER = "#c5c8ca";
const CAP = "#3e4043";

/** The cab side: one black glass field (its front following the windscreen's curve, its rear raked) and the small raked window behind it. */
const CAB_FIELD = { front: [[2.51, 1.15], [2.8, 1.25], [3.1, 1.55], [3.35, 2.05]] as Pt[], back: [[2.51, 2.2], [2.69, 3.3], [3.35, 3.52]] as Pt[] };
const CAB_SMALL = { front: [[2.83, 3.62], [3.26, 3.62]] as Pt[], back: [[2.83, 3.8], [3.26, 4.2]] as Pt[] };
/** The dark grey band's rounded point ahead of the door, 1.45 m up (Wien Hbf, 80-90 728): everything ahead of it red down to the skirt. */
const BAND_POINT: Pt[] = [[A, 6.0], [FLOOR, 5.0], [1.3, 4.6], [1.38, 3.9], [1.45, 3.6], [1.52, 3.8], [1.62, 4.4], [1.74, 5.3], [BAND_TOP, 6.2]];

/** The light grey skirt's top between the bogies, from the skirt's cut (reach 1.96 m) up to the floor: the driving trailer's from its door back. */
const quad = (d0: number, d1: number): Pt[] => [[d0, A - 0.01], [d1, A - 0.01], [d1, FLOOR], [d0, FLOOR]];
const skirtTop = (mat: string): ShinkansenLivery["sideFields"] => ({
  end: [{ mat, pts: quad(dt(7.5), dt(4.3) + 19.0 - 1.96) }],
  middle: [{ mat, pts: quad(3.5 + 1.96, 22.5 - 1.96) }],
});

/** The palette both liveries share: glass, lamps, the beam. */
const common: ShinkansenLivery["palette"] = {
  cabMask: c("#1b1c1e", 0.3), screen: c("#2f3a43", 0.08), lampG: c("#2a2c2f", 0.3), beam: c("#45474a", 0.6), under: c("#2a2c2f", 0.85),
  band: c("#141516", 0.25), display: c("#d8a84a", 0.3), faceText: c("#f2f2f2", 0.4), lettering: c("#e8e8e8", 0.4),
  // the buffers, coupling and running gear dark, as on the photographs (not bright steel)
  steel: c("#4a4c4f", 0.5),
};

/**
 * OBB: red above the windows and in the black band's pillars, the umbra grey band under the windows
 * from the floor, the light grey skirt between the bogies, a light grey roof; the driving trailer's red
 * face over the dark grey beam, its dark grey cap over the windscreen carried back over the cab roof.
 */
function obbLivery(number: string): ShinkansenLivery {
  return {
    title: "OBB", number,
    palette: { ...common, bigText: c("#9a9c9d", 0.4), red: c(RED), redLine: c("#e4232c"), umbra: c(UMBRA, 0.45), skirtG: c(SILVER, 0.35), roofG: c("#b3b7ba", 0.55), cap: c(CAP, 0.4), face: c(RED) },
    // the brighter red line between the grey band and the windows
    bands: [[0, BAND_TOP, "umbra"], [BAND_TOP, WIN[0], "redLine"], [WIN[0], 9, "red"]],
    front: [[0, 0.62, "red"], [0.62, 1.44, "beam"], [1.44, 3.47, "red"], [3.47, 9, "cap"]],
    roof: "roofG", skirt: "skirtG", sideFields: skirtTop("skirtG"),
    frontRoof: "cap", capSlope: { y: S - 0.05, d: [0, 0.2, 0.7] },
    endSweeps: [
      { mat: "red", front: [[A, -9], [BAND_TOP, -9]], back: BAND_POINT },
      { mat: "cabMask", face: true, ...CAB_FIELD },
      { mat: "cabMask", face: true, ...CAB_SMALL },
    ],
    endLettering: [{ text: "railjet", d: dt(4.9), y: 3.05, h: 0.13, mat: "faceText" }],
  };
}

const SKY = "#2b86d1";
/** The CD front's back edge on the driving trailer's sides: from the cant rail behind the cab side window down to the face's lower corners. */
const CD_LINE: Pt[] = [[A, 0.45], [1.6, 0.6], [2.2, 0.95], [2.8, 1.35], [3.2, 1.75], [3.48, 2.2]];
const NAVY = "#1f3d7a";

/**
 * CD: sky blue round the windows with a white line at the cant rail and a navy line under the band,
 * light grey below, a navy roof; the driving trailer's navy front and cap, swept back behind the cab
 * side window to a white line that runs down to the face's lower corners.
 */
function cdLivery(number: string): ShinkansenLivery {
  return {
    title: "CD", number,
    palette: { ...common, bigText: c("#c9cdd0", 0.4), sky: c(SKY), navy: c(NAVY, 0.4), white: c("#f3f4f4", 0.4), greyL: c("#d6d9db", 0.4), skirtG: c("#b9bdc0", 0.4), roofG: c(NAVY, 0.5), cap: c(NAVY, 0.4), face: c(NAVY, 0.4) },
    bands: [[0, BAND_TOP, "greyL"], [BAND_TOP, 1.92, "navy"], [1.92, 3.42, "sky"], [3.42, 9, "white"]],
    front: [[0, 0.62, "navy"], [0.62, 1.44, "beam"], [1.44, 9, "navy"]],
    roof: "roofG", skirt: "skirtG", sideFields: skirtTop("skirtG"), doors: [[0, 9, "navy"]],
    frontRoof: "cap", capSlope: { y: S - 0.05, d: [0, 0.2, 0.7] },
    endSweeps: [
      // the navy front swept back over the cab sides behind a white line from the cant rail down to the face's corners
      { mat: "navy", front: [[A, -9], [3.48, -9]], back: CD_LINE },
      { mat: "white", front: CD_LINE, back: CD_LINE.map(([y, d]): Pt => [y, d + 0.14]) },
      // the navy sweep low along the driving trailer's flanks, tapering back under the band
      { mat: "navy", front: [[A, 0.6], [1.6, 0.75], [BAND_TOP, 0.95]], back: [[A, 3.6], [1.3, 5.2], [1.5, 7.0], [1.7, 8.8], [BAND_TOP, 10.4]] },
      { mat: "cabMask", face: true, ...CAB_FIELD },
      { mat: "cabMask", face: true, ...CAB_SMALL },
    ],
    endLettering: [{ text: "railjet", d: dt(6.0), y: 3.05, h: 0.13, mat: "white" }],
  };
}

// ---------------------------------------------------------------------------
// Layouts and fittings

/** The driving trailer's body behind the join and an intermediate car's. */
const DT_BODY = DT_LENGTH - SERIES_GAP - BUFFERS - JOIN;
const COACH_BODY = COACH_LENGTH - 2 * SERIES_GAP;

/** A row of n panes w wide and `pitch` apart, the first from d0. */
const row = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

/**
 * The driving trailer (80-90 728 at Wien Hbf, 80-90 727 at Guntramsdorf; a projective fit along the car
 * on its bogie centres): the door 6.45 - 7.45 m behind the buffers, nine panes in the black band
 * from 8.4 m, the rear door at the inner end; the small dark square (the WC's) 5.2 - 5.7 m back.
 */
const DT_LAYOUT = {
  doors: [[dt(6.45), dt(7.45), -1], [DT_BODY - 1.4, DT_BODY - 0.4, 1]] as Array<readonly [number, number, number]>,
  windows: row(dt(8.6), 9, 1.55, 1.8),
};
/** The economy coach (Bmpz 73 81 22-90 553-7 at St. Valentin): a door at each end, the reservation display beside the first, ten 1.5 m panes 1.88 m apart. */
const COACH_LAYOUT = {
  doors: [[0.6, 1.6, -1], [COACH_BODY - 1.6, COACH_BODY - 0.6, 1]] as Array<readonly [number, number, number]>,
  windows: row(3.75, 10, 1.5, 1.88),
};
/**
 * The restaurant car (ARbmpz; seen only far off at Guntramsdorf and Pfarrwerfen): the passenger door at
 * its front end, the first-class section's three panes, a short pane at the wheelchair space, the
 * restaurant's four wider-spaced panes, the kitchen's blank wall and the catering loading door at the rear.
 */
const REST_LAYOUT = {
  doors: [[0.6, 1.6, -1], [COACH_BODY - 1.6, COACH_BODY - 0.6, 1]] as Array<readonly [number, number, number]>,
  windows: [...row(3.4, 3, 1.5, 1.9), [9.6, 10.4] as const, ...row(11.6, 4, 1.5, 2.15)],
};

/** The black band behind every car's panes, from the first pane to the last; the display beside the coach's first door. */
function fittings(layout: { doors: ReadonlyArray<readonly [number, number, number]>; windows: ReadonlyArray<readonly [number, number]> }, display: boolean, cls: string) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void => {
    const own = car.end ? DT_LAYOUT : layout;
    const w = own.windows;
    m.scope("window band", () => { for (const sd of [1, -1]) sidePanel(m, b, X, sd, "band", w[0]![0] - 0.12, w[w.length - 1]![1] + 0.12, WIN[0] - 0.03, WIN[1] + 0.03, 0.003, 0.003); });
    if (car.end) m.scope("wc window", () => { for (const sd of [1, -1]) { sidePanel(m, b, X, sd, "cabMask", dt(5.2), dt(5.7), 2.3, 2.8, 0.004, 0.03); sidePanel(m, b, X, sd, "display", dt(5.28), dt(5.62), 2.38, 2.72, 0.01, 0.004); } });
    else if (display) m.scope("display", () => { for (const sd of [1, -1]) { sidePanel(m, b, X, sd, "cabMask", 2.7, 3.3, 2.3, 2.65, 0.004, 0.03); sidePanel(m, b, X, sd, "display", 2.76, 3.24, 2.36, 2.59, 0.01, 0.004); } });
    // each door leaf's dark frame in the body, and the class sign (a dark plate with the white numeral) beside it toward the car's middle
    m.scope("door frames", () => {
      const [y0, y1] = [RAILJET.door[0], RAILJET.door[1]], t = 0.035, mid = (car.end ? DT_BODY : car.length) / 2;
      for (const sd of [1, -1]) for (const [d0, d1] of own.doors) {
        sidePanel(m, b, X, sd, "cabMask", d0 - t, d0, y0, y1 + t, 0.004, 0.003);
        sidePanel(m, b, X, sd, "cabMask", d1, d1 + t, y0, y1 + t, 0.004, 0.003);
        sidePanel(m, b, X, sd, "cabMask", d0, d1, y1, y1 + t, 0.004, 0.003);
        const e = (d0 + d1) / 2 < mid ? d1 + 0.1 : d0 - 0.36;
        sidePanel(m, b, X, sd, "cabMask", e, e + 0.26, 2.42, 2.74, 0.004, 0.003);
        sideLettering(m, b, X, sd, car.end ? "1" : cls, e + 0.13, 2.47, 0.22, "faceText", 0.008, 0.035);
      }
    });
    // the big outlined "railjet" on the grey band (OBB; the CD paint keeps it in the band's own grey)
    m.scope("railjet lettering", () => { for (const sd of [1, -1]) sideLettering(m, b, X, sd, "railjet", car.end ? DT_BODY / 2 + 1.5 : car.length / 2, 1.3, 0.5, "bigText", 0.004, 0.045); });
    // the underfloor equipment between the bogies, behind the skirt
    m.scope("underfloor", () => {
      const [t0, t1] = [Math.min(car.trucks[0]!, car.trucks[1]!), Math.max(car.trucks[0]!, car.trucks[1]!)];
      const [x0, x1] = [X(t0 + 2.0), X(t1 - 2.0)];
      block(m, "under", Math.min(x0, x1), Math.max(x0, x1), 0.62, A - 0.02, -W * 0.8, W * 0.8);
    });
  };
}

/** The driving trailer and the coaches. */
export const RAILJET: ShinkansenSeries = {
  endLength: DT_LENGTH, midLength: COACH_LENGTH, W, Y: 1.15, S, C, lean: 0.96, B: 0.58, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: RAILJET_FACE,
  endCoupler: "buffers", bufferGap: BUFFERS, bufferHeadShape: "rect", couplerY: 1.05,
  windows: [WIN], windowW: 1.5, pitch: 1.88,
  // the single-leaf plug doors: sill at the lowest step, the leaf's narrow window rounded at both ends
  door: [1.02, 2.98, 1.25, 2.68], doorW: 1.0, doorGlassW: 0.26, doorGlassR: 0.13,
  layout: { end: DT_LAYOUT, middle: COACH_LAYOUT },
  // the SF 400 bogies: 19.0 m apart, 2.5 m wheelbase, 920 mm wheels; the driving trailer's leading one 4.3 m behind its buffers
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, endBogies: [dt(4.3), dt(4.3) + 19.0],
  traction: "none", cars: [4, 7],
  numberAt: [DT_BODY / 2 - 4.0, 1.38, 0.09],
  fittings: fittings(COACH_LAYOUT, true, "2"),
  liveries: { obb: obbLivery("80-90 728"), cd: cdLivery("80-91 005") },
  weight: { end: 61, middle: 59 }, power: 0, maxspeed: 230,
};
/** The restaurant car: the coaches' series with its own layout. */
const RAILJET_REST: ShinkansenSeries = { ...RAILJET, layout: { end: DT_LAYOUT, middle: REST_LAYOUT }, fittings: fittings(REST_LAYOUT, false, "1"), weight: { end: 61, middle: 60 } };

// ---------------------------------------------------------------------------
// The train

export type RailjetKind = "drivingTrailer" | "coach" | "restaurant";
export interface RailjetSlot { kind: RailjetKind; lo: number; hi: number }

const LENGTH: Record<RailjetKind, number> = { drivingTrailer: DT_LENGTH, coach: COACH_LENGTH, restaurant: COACH_LENGTH };
export const RAILJET_CARS = [3, 4, 5, 6, 7];

/**
 * The cars of an n-car set (3 .. 7), front first, centred on x = 0: the driving trailer leading, then
 * (from four cars) the first-class coach, the restaurant car and economy coaches to the rear, where
 * the locomotive couples (the seven-car set: Afmpz, Ampz, ARbmpz, Bmpz, Bmpz, Bmpz, Bmpvz); three cars
 * the driving trailer, the restaurant car and a coach.
 */
export function railjetTrain(n: number): RailjetSlot[] {
  if (!RAILJET_CARS.includes(n)) throw new Error(`Railjet: no ${n}-car set`);
  const rest = n === 3 ? 1 : 2;
  const kinds = Array.from({ length: n }, (_, k): RailjetKind => (k === 0 ? "drivingTrailer" : k === rest ? "restaurant" : "coach"));
  let hi = kinds.reduce((a, kd) => a + LENGTH[kd], 0) / 2;
  return kinds.map((kind) => {
    const lo = hi - LENGTH[kind];
    const slot: RailjetSlot = { kind, lo, hi };
    hi = lo;
    return slot;
  });
}

const seriesOf = (kind: RailjetKind): ShinkansenSeries => (kind === "restaurant" ? RAILJET_REST : RAILJET);
/** The gangways' bellows: the wide pressure-tight gangway. */
const BELLOWS: Array<[number, number]> = [[-0.8, 0.6], [0.8, 0.6], [0.8, 3.2], [-0.8, 3.2]];
const MAX_BEND = 10;

const trainPalette = (key: string) => ({ ...seriesCarPalette(RAILJET, key), ...seriesCarPalette(RAILJET_REST, key) });

function drawTrain(key: string, n: number): MeshBuilder {
  const m = new MeshBuilder(trainPalette(key));
  const slots = railjetTrain(n);
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const end = slot.kind === "drivingTrailer";
    // the driving trailer's buffers at the front, the last coach's coupler at the rear (the locomotive's end)
    const inside = end ? [-1] : k === slots.length - 1 ? [1] : [1, -1];
    return {
      x0: slot.lo + SERIES_GAP, x1: slot.hi - (k === 0 ? 0 : SERIES_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => m.moved(([x, y, z]) => [x + cx, y, z], () => drawSeriesCar(m, seriesOf(slot.kind), key, { end, pantograph: false, inside }))),
    };
  });
  articulate({ m }, sections, RAILJET.couplerY!, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND, slots.slice(0, -1).map((x) => x.lo));
  return m;
}

function trainLod(key: string, n: number): MeshBuilder {
  const slots = railjetTrain(n);
  const built = slots.map((slot, k) => seriesCarLod(seriesOf(slot.kind), key, { end: slot.kind === "drivingTrailer", pantograph: false, cx: (slot.lo + slot.hi) / 2, turned: false, section: k }));
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, RAILJET.couplerY!, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({ sections: [i, i + 1] as [number, number], front: slot.lo + SERIES_GAP, rear: slots[i + 1]!.hi - SERIES_GAP, profile: BELLOWS })),
    maxBendDeg: MAX_BEND,
  };
  return fitUnit({ palette: trainPalette(key), bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * n));
}

// ---------------------------------------------------------------------------
// The design

export const RAILJET_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { endCar: "Driving trailer", middleCar: "Coach", restaurant: "Restaurant car", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(RAILJET_CARS.map((k) => [String(k), `${k} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
  enumParam("livery", "Livery", { obb: "OBB", cd: "CD" }),
];

/** The kit's parameters a lone car is built with. */
const KIT_PARAMS = seriesParams(RAILJET);
const lone = (unit: string, key: string): { s: ShinkansenSeries; v: ParamValues } =>
  unit === "restaurant" ? { s: RAILJET_REST, v: { unit: "middleCar", livery: key } } : { s: RAILJET, v: { unit, livery: key } };

export function obbRailjet(v?: ParamValues): MeshBuilder {
  const p = resolveParams(RAILJET_PARAMS, v);
  if (p.unit === "train") return drawTrain(p.livery!, Number(p.cars));
  const { s, v: values } = lone(p.unit!, p.livery!);
  return buildSeries(s, KIT_PARAMS, values);
}

export function obbRailjetLod(v?: ParamValues): MeshBuilder {
  const p = resolveParams(RAILJET_PARAMS, v);
  if (p.unit === "train") return trainLod(p.livery!, Number(p.cars));
  const { s, v: values } = lone(p.unit!, p.livery!);
  return buildSeriesLod(s, KIT_PARAMS, values);
}

/** Weights (t; 417.2 t empty for the seven-car set): the driving trailer 61, a coach 59, the restaurant car 60. */
const WEIGHT: Record<RailjetKind, number> = { drivingTrailer: 61, coach: 59, restaurant: 60 };

function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const key of ["obb", "cd"]) {
    const base: ParamValues = key === "obb" ? {} : { livery: key };
    variants.push({ params: { ...base, unit: "middleCar" }, weight: WEIGHT.coach, power: 0 });
    variants.push({ params: { ...base, unit: "restaurant" }, weight: WEIGHT.restaurant, power: 0 });
    for (const n of RAILJET_CARS)
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: railjetTrain(n).reduce((a, s) => a + WEIGHT[s.kind], 0), power: 0 });
  }
  return { weight: WEIGHT.drivingTrailer, power: 0, maxspeed: 230, accel: null, variants };
}

export const RAILJET_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-railjet", title: "OBB Railjet", build: obbRailjet, buildLod: obbRailjetLod, params: RAILJET_PARAMS,
  lodTriangles: 500, game: game(), catalog: COACH_CATALOG, references: "obb-railjet",
};
