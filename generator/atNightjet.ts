// The OBB Nightjet of the new generation (Siemens Viaggio Comfort, in service from December 2023): a
// seven-car push-pull set - the control car Bfmpz with its seats and a cab, the multi-purpose car
// ABbmpvz (seats, bicycles, the barrier-free sleeping compartment), three couchette cars Bcmz with the
// "mini cabins" and two sleeping cars WLAmz - hauled by a Taurus or Vectron at the sleeping cars' end
// (not drawn here). The Railjet's body family (atRailjet.ts): drawn on the series kit (shinkansen.ts)
// with the Railjet's section, unwired (`traction: "none"`). The control car is the series' end car
// with its own cab face (seriesCab.ts), the Vectron-like face of the second Railjet generation measured
// on the photographs in assets/obb-nightjet/ (SOURCES.md): the dark grey buffer beam, the blue face set
// back over it with the black louvred panel between the tall lamp housings, the blue band with the
// "nightjet" lettering, the black band and the two-pane windscreen raked back into the black cap; the
// red swoosh with its dark grey wedge along the cab's sides. The coaches are copies of the series with
// their own layouts: the couchette car's two-storey mini cabins (upper and lower frames of two panes
// each) and the sleeping car's cabin windows. `unit` `train` is the set the control car leads.
// Registered in atUnits.ts. See docs/models/austria-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the buffer beam's front); on the control car's
// sides d behind the tip too, written as `t(d)` where the kit takes d behind the body's front end (the
// face's join, JOIN behind the tip); on a coach d behind the body's front end.

import { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { sideLettering, sidePanel, type SliceBody } from "./sliceBody.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, drawSeriesCar, SERIES_GAP, seriesCarLod, seriesCarPalette, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c } from "./seriesHelpers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { articulate } from "./tramKit.ts";
import { block } from "./vehicleParts.ts";
import { fitUnit } from "./lodUnits.ts";
import type { LodSections } from "./lodKit.ts";
import { RAILJET } from "./atRailjet.ts";

/** Where the face meets the body: the cap has rounded down to the full roof. */
const JOIN = 2.6;
/** The buffer heads ahead of the beam's front (the side-on photograph of 80-91 721, 120 px/m). */
const BUFFERS = 0.33;
/** A position behind the control car's tip, as d behind its body's front end. */
const t = (d: number): number => d - JOIN;

/** Published figures (de.wikipedia "Nightjet", "Railjet"): 26.5 m coaches over buffers; the control car as the Railjet's 26.85 m; 230 km/h. */
const DT_LENGTH = 26.85;
const COACH_LENGTH = 26.5;
const { W, C, S, A } = RAILJET;
/** The light grey skirt between the bogies up to the floor. */
const FLOOR = 1.25;
/** The side's bands (80-91 721, 120 px/m): navy, the dark grey line, the red band over it reaching into the windows' lower part, navy above. */
const GREY_LINE: readonly [number, number] = [1.71, 1.86];
const RED_BAND: readonly [number, number] = [1.86, 2.23];
/** The window row (sill, head) of the seats, the couchettes' compartments and the sleeping cabins. */
const WIN: readonly [number, number] = [2.0, 2.86];
/** The mini cabins' two storeys (the couchette car at Wien Hbf, about 222 px/m at the nearest column). */
const MINI_LOW: readonly [number, number] = [1.5, 2.29];
const MINI_HIGH: readonly [number, number] = [2.45, 3.33];

/**
 * The face's centre line (the side-on photograph of 80-91 721 at Wien Hbf, 120 px/m): the buffer beam
 * upright to 1.38 m, the face set back 0.4 m over it and leaning slightly forward to its foremost line
 * at 2.3 m (0.31 m back), the black band and the windscreen leaning back ever more steeply to the cap
 * (3.55 m, 0.95 m back), the cap rounding over to the roof about 2.3 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.5, 0.04], [0.6, 0], [1.38, 0], [1.4, 0.38], [1.47, 0.38], [1.8, 0.35], [2.3, 0.31], [2.5, 0.33], [2.72, 0.4], [3.0, 0.5],
  [3.25, 0.66], [3.55, 0.93], [3.68, 1.12], [3.8, 1.36], [3.92, 1.62], [4.0, 1.92], [C, 2.3],
];
/** The plan's corners: tight round the beam, round blue pillars beside the lamps and the windscreen, the cap rolling into the roof. */
const CORNER: Pt[] = [[0.5, 0.15], [1.38, 0.15], [1.4, 0.3], [2.39, 0.33], [2.72, 0.4], [3.55, 0.6], [3.8, 0.7], [4.0, 0.5], [C, 0.3]];
const DEPTH_TABLE: Pt[] = [[0.5, 0.2], [1.38, 0.25], [1.4, 0.5], [2.39, 0.6], [2.72, 0.75], [3.55, 0.95], [3.8, 0.85], [4.0, 0.5], [C, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH_TABLE, y)))]);

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The black louvred panel between the lamp housings (Hamburg Hbf, 80-91 713 head-on). */
const GRILLE: readonly [number, number] = [1.47, 2.04];
/** The lamp housing (viewer's right): a tall dark rectangle in the face's corner, the head lamp over the tail lamp. */
const HOUSING: Pt[] = [[0.98, 1.56], [1.24, 1.56], [1.27, 1.6], [1.27, 2.06], [1.24, 2.1], [0.98, 2.1]];

const ROWS = [0.5, 0.6, 1.38, 1.4, 1.47, 1.56, 1.8, 2.04, 2.1, 2.3, 2.39, 2.5, 2.66, 2.72, 3.0, 3.25, 3.5, 3.55, 3.68, 3.8, 3.92, 4.0, C];

/** The control car's cab face. */
const NIGHTJET_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (4.15 m behind the tip, reach 1.96 m) runs on into the face
  wheelCut: { d: 4.15 - 1.96, y: A },
  dJoin: JOIN, dSide: 1.7, first: 6.25, roofFrom: 9, cols: [4, 2, 1, 1], tolerance: 0.06, wrap: false, reach: BUFFERS,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, rows: ROWS,
  bands: (l) => l.front ?? l.bands,
  lodBands: [[0, 1.4, "beam"], [1.4, 2.39, "navy"], [2.39, 9, "cap"]],
  lod: {
    profile: [[0.5, 0.04], [0.6, 0], [1.38, 0], [1.4, 0.38], [2.3, 0.31], [2.72, 0.4], [3.55, 0.93], [3.8, 1.36], [4.0, 1.92], [C, 2.3]],
    corner: [[0.5, 0.15], [1.4, 0.3], [2.39, 0.33], [3.55, 0.6], [3.8, 0.7], [C, 0.3]],
    rows: [0.5, 0.6, 1.38, 1.4, 2.0, 2.39, 2.72, 3.1, 3.55, 3.8, 4.0, C],
    cornerDepth: [[0.5, 0.2], [1.4, 0.5], [2.39, 0.6], [3.55, 0.95], [3.8, 0.85], [4.0, 0.5], [C, 0.05]],
  },
  lodGlass: { hw: 1.1, y: [2.72, 3.54] },
  // the black band, the windscreen's frame and the cap between the blue corner pillars
  masks: [{ lat: [-1.17, 1.17], y: [2.39, 3.6], r: 0.06, mat: "cap" }],
  panes: [{ lat: [-1.12, -0.05], y: [2.72, 3.54], r: 0.04, mat: "screen" }, { lat: [0.05, 1.12], y: [2.72, 3.54], r: 0.04, mat: "screen" }],
  // the beam's dark grey round the cab's lower corners and sides, under the body's foot
  paint: [{ mat: "beam", front: [[0.5, -9], [A, -9]], back: [[0.5, 9], [A, 9]] }],
  fields: [
    { mat: "grille", pts: box(-0.97, 0.97, GRILLE[0], GRILLE[1]) },
    { mat: "lampG", pts: HOUSING }, { mat: "lampG", pts: mirror(HOUSING) },
  ],
  decals: [
    // the louvres' slats across the black panel
    ...[1.6, 1.74, 1.88].map((y) => ({ mat: "slat", pts: box(-0.93, 0.93, y, y + 0.025), fine: 1 })),
    // the two grab handles on the black band under the windscreen
    { mat: "steel", pts: box(-0.42, -0.26, 2.5, 2.55), fine: 1 },
    { mat: "steel", pts: box(0.26, 0.42, 2.5, 2.55), fine: 1 },
  ],
  // the head lamp over the tail lamp in each housing
  lamps: [[1.12, 1.93, 0.11, "lampHead"], [1.12, 1.7, 0.09, "lampRed"], [-1.12, 1.93, 0.11, "lampHead"], [-1.12, 1.7, 0.09, "lampRed"]],
  roofLamp: [0, 3.72, 0.08],
  number: { lat: 0.25, y: 3.64, h: 0.08, mat: "faceText" },
  texts: [
    { text: "nightjet", lat: 0.6, y: 2.18, h: 0.1, mat: "faceText" },
    { text: "OBB", lat: -0.55, y: 3.63, h: 0.1, mat: "obbRed" },
  ],
  // the wipers parked at the panes' foot, rising toward the centre pillar
  wipers: [[[0.75, 2.8], [0.35, 3.3]], [[-0.3, 2.8], [-0.7, 3.3]]],
};

// ---------------------------------------------------------------------------
// The livery

const NAVY = "#22357f";
const RED = "#e0221c";

/** The cab side: the black field round the side window, its front following the face's corner (80-91 721). */
const CAB_FIELD = { front: [[2.3, 1.04], [2.6, 0.98], [3.0, 1.0], [3.28, 1.1]] as Pt[], back: [[2.3, 2.25], [3.28, 2.25]] as Pt[] };
/**
 * The swoosh ahead of the door (80-91 721, 120 px/m): the red band's top falling forward in a long curve
 * to a point low over the leading bogie, the red down to the body's foot; the dark grey wedge inside it
 * from the door to a point 3.45 m behind the tip, a red stripe under it.
 */
const RED_FRONT: Pt[] = [[A, 1.42], [1.11, 1.6], [1.48, 2.18], [1.9, 3.18], [2.15, 4.52], [RED_BAND[1], 5.85]];
const GREY_FRONT: Pt[] = [[1.1, 3.46], [1.4, 3.62], [1.73, 4.43], [GREY_LINE[1], 5.85]];
const AHEAD = 5.88;

/** The light grey skirt's top between the bogies, from the skirt's cut (reach 1.96 m) up to the floor. */
const quad = (d0: number, d1: number): Pt[] => [[d0, A - 0.01], [d1, A - 0.01], [d1, FLOOR], [d0, FLOOR]];

/** The distant model's sides: the red band alone. */
const LOD_BANDS: ShinkansenLivery["bands"] = [[0, GREY_LINE[1], "navy"], [GREY_LINE[1], RED_BAND[1], "red"], [RED_BAND[1], 9, "navy"]];
const SIDE_BANDS: ShinkansenLivery["bands"] = [[0, GREY_LINE[0], "navy"], [GREY_LINE[0], GREY_LINE[1], "greyB"], [GREY_LINE[1], RED_BAND[1], "red"], [RED_BAND[1], 9, "navy"]];

function nightjetLivery(number: string, title: string): ShinkansenLivery {
  return {
    title, number,
    // the distant model: the control car's swoosh (the couchette car's mini cabins do not fit its 100 triangles)
    lodSideFields: {
      end: [{ d: [1.6, AHEAD], bands: [[0, 1.9, "red"], [1.9, 9, "navy"]] }, { d: [AHEAD, DT_LENGTH], bands: LOD_BANDS }],
    },
    palette: {
      navy: c(NAVY, 0.3), red: c(RED, 0.35), greyB: c("#3d4045", 0.4), roofG: c("#b4b8bc", 0.55), skirtG: c("#c9cdd1", 0.35), cap: c("#17191c", 0.3),
      beam: c("#45484c", 0.6), under: c("#2a2c2f", 0.85), band: c("#121315", 0.25), cabMask: c("#121315", 0.25), screen: c("#2f3a43", 0.08),
      lampG: c("#202225", 0.3), grille: c("#1b1c1f", 0.5), slat: c("#34373b", 0.5), frameG: c("#c3c7cb", 0.4), display: c("#d8a84a", 0.3),
      faceText: c("#f2f2f2", 0.4), lettering: c("#e8e8e8", 0.4), bigText: c("#e6e8ea", 0.4), obbRed: c(RED, 0.35), doorTop: c("#3d4045", 0.4),
      steel: c("#4a4c4f", 0.5),
    },
    bands: SIDE_BANDS, lodSides: LOD_BANDS,
    front: [[0, 1.4, "beam"], [1.4, 3.55, "navy"], [3.55, 9, "cap"]],
    roof: "roofG", skirt: "skirtG",
    sideFields: { end: [{ mat: "skirtG", pts: quad(t(7.5), t(4.15) + 19.0 - 1.96) }], middle: [{ mat: "skirtG", pts: quad(3.5 + 1.96, 22.5 - 1.96) }] },
    frontRoof: "cap", capSlope: { y: S - 0.05, d: [0, 0.15, 0.5] },
    endSweeps: [
      // the bands ahead of the door painted out in navy, then the red swoosh and the grey wedge in it
      { mat: "navy", front: [[A, -9], [S, -9]], back: [[A, AHEAD], [S, AHEAD]] },
      { mat: "red", front: RED_FRONT, back: [[A, AHEAD], [RED_BAND[1], AHEAD]] },
      { mat: "greyB", front: GREY_FRONT, back: [[1.1, AHEAD], [GREY_LINE[1], AHEAD]] },
      { mat: "cabMask", face: true, ...CAB_FIELD },
      // the side window in its frame at the field's rear
      { mat: "screen", face: true, front: [[2.55, 1.76], [3.15, 1.76]], back: [[2.55, 2.17], [3.15, 2.17]] },
    ],
    endLettering: [
      { text: "OBB", d: t(5.55), y: 3.05, h: 0.13, mat: "obbRed" },
      { text: "nightjet", d: t(4.9), y: 3.05, h: 0.13, mat: "bigText" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Layouts and fittings

/** The control car's body behind the join and a coach's. */
const DT_BODY = DT_LENGTH - SERIES_GAP - BUFFERS - JOIN;
const COACH_BODY = COACH_LENGTH - 2 * SERIES_GAP;

type Span = readonly [number, number];
type Layout = { doors: Array<readonly [number, number, number]>; windows: Span[] };
/** A row of n panes w wide and `pitch` apart, the first from d0. */
const row = (d0: number, n: number, w: number, pitch: number): Span[] => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);
const coachDoors = (): Layout["doors"] => [[0.6, 1.6, -1], [COACH_BODY - 1.6, COACH_BODY - 0.6, 1]];

/** The control car (80-91 721 side-on, 80-91 709): the door 6.25 - 7.25 m behind the tip, nine panes in the black band from 8.1 m, the rear door at the inner end. */
const DT_LAYOUT: Layout = { doors: [[t(6.25), t(7.25), -1], [DT_BODY - 1.4, DT_BODY - 0.4, 1]], windows: row(t(8.1), 9, 1.55, 1.8) };
/** The multi-purpose car (ABbmpvz 38-91 609): the seats' wide panes, the bicycle room's two narrow ones and the barrier-free compartment's pane at the rear. */
const SEAT_LAYOUT: Layout = { doors: coachDoors(), windows: [...row(3.6, 5, 1.55, 1.85), [13.4, 14.2], [15.3, 16.1], ...row(17.6, 2, 1.55, 1.85), [21.8, 22.8]] };
/**
 * The couchette car (Bcmz 52-91 509 at Wien Hbf): behind the front door a narrow pane (the attendant's),
 * the three four-berth compartments' panes, then seven columns of mini cabins, each an upper and a lower
 * frame of two panes; the window row holds only the single-storey panes.
 */
const MINI_COLUMNS = row(8.6, 7, 1.4, 2.1);
const COUCHETTE_LAYOUT: Layout = { doors: coachDoors(), windows: [[2.05, 2.4], [3.0, 4.0], [4.7, 5.7], [6.3, 7.6]] };
/** The sleeping car (WLAmz at Bregenz): a narrow pane behind the door, ten cabins' panes in the black band, the shower cabins' small low windows under the first two. */
const SLEEPER_CABINS = row(3.3, 10, 0.95, 2.0);
const SLEEPER_LAYOUT: Layout = { doors: coachDoors(), windows: [[2.05, 2.5], ...SLEEPER_CABINS] };

type Kind = "control" | "seat" | "couchette" | "sleeper";

/** The black band, the door frames, the mini cabins, the lettering and the underfloor box of one kind of car. */
function fittings(kind: Kind) {
  const own = kind === "control" ? DT_LAYOUT : kind === "seat" ? SEAT_LAYOUT : kind === "couchette" ? COUCHETTE_LAYOUT : SLEEPER_LAYOUT;
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void => {
    const lay = car.end ? DT_LAYOUT : own;
    const k: Kind = car.end ? "control" : kind;
    const w = lay.windows;
    const len = car.end ? DT_BODY : car.length;
    const sides = [1, -1];
    // the black band: one strip from the first pane to the last on the seats' and sleeping cars, a frame round each couchette compartment's pane
    m.scope("window band", () => {
      for (const sd of sides) {
        if (k === "couchette") for (const [d0, d1] of w) sidePanel(m, b, X, sd, "band", d0 - 0.09, d1 + 0.09, WIN[0] - 0.06, WIN[1] + 0.06, 0.003, 0.003);
        else sidePanel(m, b, X, sd, "band", w[0]![0] - 0.12, w[w.length - 1]![1] + 0.12, WIN[0] - 0.05, WIN[1] + 0.05, 0.003, 0.003);
      }
    });
    if (k === "couchette") m.scope("mini cabins", () => {
      for (const sd of sides) for (const [d0, d1] of MINI_COLUMNS) for (const [y0, y1] of [MINI_LOW, MINI_HIGH]) {
        sidePanel(m, b, X, sd, "band", d0, d1, y0, y1, 0.004, 0.003);
        const half = (d1 - d0) / 2;
        for (const e of [d0 + 0.08, d0 + half + 0.04]) sidePanel(m, b, X, sd, "screen", e, e + half - 0.12, y0 + 0.08, y1 - 0.08, 0.008, 0.004);
      }
    });
    if (k === "sleeper") m.scope("shower windows", () => {
      for (const sd of sides) for (const [d0] of SLEEPER_CABINS.slice(0, 2)) {
        sidePanel(m, b, X, sd, "band", d0 + 0.25, d0 + 0.7, 1.22, 1.62, 0.004, 0.003);
        sidePanel(m, b, X, sd, "screen", d0 + 0.3, d0 + 0.65, 1.27, 1.57, 0.008, 0.004);
      }
    });
    // each door in its light grey frame, the leaf's dark grey head with the car's name
    m.scope("door frames", () => {
      const [y0, y1] = [NIGHTJET.door[0], NIGHTJET.door[1]];
      for (const sd of sides) for (const [d0, d1] of lay.doors) {
        sidePanel(m, b, X, sd, "frameG", d0 - 0.3, d0, y0 - 0.06, y1 + 0.2, 0.004, 0.003);
        sidePanel(m, b, X, sd, "frameG", d1, d1 + 0.3, y0 - 0.06, y1 + 0.2, 0.004, 0.003);
        sidePanel(m, b, X, sd, "frameG", d0, d1, y1, y1 + 0.2, 0.004, 0.003);
      }
    });
    // the big outlined "nightjet" low on the seats' cars, high over the mini cabins' first columns on the couchette car; the car's name
    m.scope("lettering", () => {
      for (const sd of sides) {
        if (k === "couchette") sideLettering(m, b, X, sd, "nightjet", 5.0, 2.93, 0.56, "bigText", 0.004, 0.04);
        else if (k !== "control") sideLettering(m, b, X, sd, "nightjet", len / 2, 1.0, 0.62, "bigText", 0.004, 0.04);
        else sideLettering(m, b, X, sd, "nightjet", len / 2 + 2.0, 1.0, 0.62, "bigText", 0.004, 0.04);
        const name = k === "couchette" ? "couchette" : k === "sleeper" ? "sleeping car" : "seat car";
        sideLettering(m, b, X, sd, name, k === "couchette" ? 6.5 : 4.3, 1.45, 0.16, "lettering", 0.006, 0.025);
      }
    });
    m.scope("underfloor", () => {
      const [t0, t1] = [Math.min(car.trucks[0]!, car.trucks[1]!), Math.max(car.trucks[0]!, car.trucks[1]!)];
      const [x0, x1] = [X(t0 + 2.0), X(t1 - 2.0)];
      block(m, "under", Math.min(x0, x1), Math.max(x0, x1), 0.62, A - 0.02, -W * 0.8, W * 0.8);
    });
  };
}

/** The control car and the multi-purpose car: the Railjet's section, bogies and doors with the Nightjet's face and paint. */
export const NIGHTJET: ShinkansenSeries = {
  ...RAILJET,
  endLength: DT_LENGTH, midLength: COACH_LENGTH,
  cabFace: NIGHTJET_FACE, bufferGap: BUFFERS,
  windows: [WIN], windowW: 1.55, pitch: 1.85,
  // the plug door: the leaf's window as tall as the side's panes, rounded
  door: [1.02, 3.15, WIN[0], WIN[1]], doorW: 1.0, doorGlassW: 0.5, doorGlassR: 0.1,
  layout: { end: DT_LAYOUT, middle: SEAT_LAYOUT },
  endBogies: [t(4.15), t(4.15) + 19.0],
  cars: [3, 7],
  numberAt: [DT_BODY / 2 - 3.0, 1.32, 0.08],
  fittings: fittings("seat"),
  liveries: { nightjet: nightjetLivery("80-91 713", "Nightjet") },
  weight: { end: 60, middle: 58 }, power: 0, maxspeed: 230,
};
const COUCHETTE: ShinkansenSeries = { ...NIGHTJET, layout: { end: DT_LAYOUT, middle: COUCHETTE_LAYOUT }, fittings: fittings("couchette"), liveries: { nightjet: nightjetLivery("52-91 509", "Nightjet") } };
const SLEEPER: ShinkansenSeries = { ...NIGHTJET, layout: { end: DT_LAYOUT, middle: SLEEPER_LAYOUT }, fittings: fittings("sleeper"), liveries: { nightjet: nightjetLivery("70-91 006", "Nightjet") } };
const SEAT: ShinkansenSeries = { ...NIGHTJET, liveries: { nightjet: nightjetLivery("38-91 609", "Nightjet") } };

// ---------------------------------------------------------------------------
// The train

export type NightjetKind = "controlCar" | "seat" | "couchette" | "sleeper";
export interface NightjetSlot { kind: NightjetKind; lo: number; hi: number }

const LENGTH: Record<NightjetKind, number> = { controlCar: DT_LENGTH, seat: COACH_LENGTH, couchette: COACH_LENGTH, sleeper: COACH_LENGTH };
export const NIGHTJET_CARS = [3, 4, 5, 6, 7];

/**
 * The cars of an n-car set (3 .. 7), front first, centred on x = 0: the control car leading, the
 * multi-purpose car (from four cars), the couchette cars and the sleeping cars at the rear, where the
 * locomotive couples. Seven cars: Bfmpz, ABbmpvz, 3 x Bcmz, 2 x WLAmz; three: control car, couchette, sleeper.
 */
export function nightjetTrain(n: number): NightjetSlot[] {
  if (!NIGHTJET_CARS.includes(n)) throw new Error(`Nightjet: no ${n}-car set`);
  const kinds: NightjetKind[] = ["controlCar"];
  if (n >= 4) kinds.push("seat");
  const sleepers = n === 7 ? 2 : 1;
  while (kinds.length < n - sleepers) kinds.push("couchette");
  while (kinds.length < n) kinds.push("sleeper");
  let hi = kinds.reduce((a, kd) => a + LENGTH[kd], 0) / 2;
  return kinds.map((kind) => {
    const lo = hi - LENGTH[kind];
    const slot: NightjetSlot = { kind, lo, hi };
    hi = lo;
    return slot;
  });
}

const seriesOf = (kind: NightjetKind): ShinkansenSeries => (kind === "couchette" ? COUCHETTE : kind === "sleeper" ? SLEEPER : kind === "seat" ? SEAT : NIGHTJET);
const BELLOWS: Array<[number, number]> = [[-0.8, 0.6], [0.8, 0.6], [0.8, 3.2], [-0.8, 3.2]];
const MAX_BEND = 10;
const KEY = "nightjet";

const trainPalette = () => ({ ...seriesCarPalette(NIGHTJET, KEY), ...seriesCarPalette(COUCHETTE, KEY), ...seriesCarPalette(SLEEPER, KEY) });

function drawTrain(n: number): MeshBuilder {
  const m = new MeshBuilder(trainPalette());
  const slots = nightjetTrain(n);
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const end = slot.kind === "controlCar";
    const inside = end ? [-1] : k === slots.length - 1 ? [1] : [1, -1];
    return {
      x0: slot.lo + SERIES_GAP, x1: slot.hi - (k === 0 ? 0 : SERIES_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => m.moved(([x, y, z]) => [x + cx, y, z], () => drawSeriesCar(m, seriesOf(slot.kind), KEY, { end, pantograph: false, inside }))),
    };
  });
  articulate({ m }, sections, NIGHTJET.couplerY!, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND, slots.slice(0, -1).map((x) => x.lo));
  return m;
}

function trainLod(n: number): MeshBuilder {
  const slots = nightjetTrain(n);
  const built = slots.map((slot, k) => seriesCarLod(seriesOf(slot.kind), KEY, { end: slot.kind === "controlCar", pantograph: false, cx: (slot.lo + slot.hi) / 2, turned: false, section: k }));
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, NIGHTJET.couplerY!, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({ sections: [i, i + 1] as [number, number], front: slot.lo + SERIES_GAP, rear: slots[i + 1]!.hi - SERIES_GAP, profile: BELLOWS })),
    maxBendDeg: MAX_BEND,
  };
  return fitUnit({ palette: trainPalette(), bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * n));
}

// ---------------------------------------------------------------------------
// The design

export const NIGHTJET_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { endCar: "Driving trailer", middleCar: "Coach", couchette: "Couchette car", sleeper: "Sleeping car", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(NIGHTJET_CARS.map((k) => [String(k), `${k} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
];

const KIT_PARAMS = seriesParams(NIGHTJET);
const lone = (unit: string): { s: ShinkansenSeries; v: ParamValues } =>
  unit === "couchette" ? { s: COUCHETTE, v: { unit: "middleCar" } } : unit === "sleeper" ? { s: SLEEPER, v: { unit: "middleCar" } } : unit === "middleCar" ? { s: SEAT, v: { unit } } : { s: NIGHTJET, v: { unit } };

export function obbNightjet(v?: ParamValues): MeshBuilder {
  const p = resolveParams(NIGHTJET_PARAMS, v);
  if (p.unit === "train") return drawTrain(Number(p.cars));
  const { s, v: values } = lone(p.unit!);
  return buildSeries(s, KIT_PARAMS, values);
}

export function obbNightjetLod(v?: ParamValues): MeshBuilder {
  const p = resolveParams(NIGHTJET_PARAMS, v);
  if (p.unit === "train") return trainLod(Number(p.cars));
  const { s, v: values } = lone(p.unit!);
  return buildSeriesLod(s, KIT_PARAMS, values);
}

/** Weights (t): the couchette car 57 (its plate), the others estimated on the Railjet's. */
const WEIGHT: Record<NightjetKind, number> = { controlCar: 60, seat: 58, couchette: 57, sleeper: 59 };

function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [
    { params: { unit: "middleCar" }, weight: WEIGHT.seat, power: 0 },
    { params: { unit: "couchette" }, weight: WEIGHT.couchette, power: 0 },
    { params: { unit: "sleeper" }, weight: WEIGHT.sleeper, power: 0 },
  ];
  for (const n of NIGHTJET_CARS)
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train" }, weight: nightjetTrain(n).reduce((a, s) => a + WEIGHT[s.kind], 0), power: 0 });
  return { weight: WEIGHT.controlCar, power: 0, maxspeed: 230, accel: null, variants };
}

export const NIGHTJET_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-nightjet", title: "OBB Nightjet", build: obbNightjet, buildLod: obbNightjetLod, params: NIGHTJET_PARAMS,
  lodTriangles: 500, game: game(), catalog: COACH_CATALOG, references: "obb-nightjet",
};
