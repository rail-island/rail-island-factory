// The Renfe 440 (CAF, Macosa, MTM 1974 - 1985; body design Schindler Waggon), the three-car 3 kV
// electric unit M-R-Rc of Renfe's regional and suburban services, drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts) as the unrebuilt 440 of the 1990s: the flat
// front leaning back slightly over the windscreens, its corners rounded, the two windscreens either
// side of the gangway door (the low screens every unit had after the first rebuild), the roof dome
// rounding over the top with the double headlamp in its housing over the door and the two marker
// lamps at its corners, the lamp housings low in the front's band (a head lamp on the left, the tail
// and head lamp on the right), the buffers and screw coupling - then on each car two double doors a
// side reaching down to the low platforms, the drop windows in rows between them, the motor car's
// former luggage room and cab window ahead of its first door, the driving trailer's cab door and three
// windows there; on the motor car the resistor grids along the roof between its two single-arm
// pantographs (the rear one raised, both knees inward as on units 080 - 253). The two schemes of the
// unrebuilt units in their last years: Cercanias (white, the red ends with the white and navy sweeps
// behind the cab, the red roof and front) and Regionales (white and orange, the orange front, roof,
// cab section and doors). Matched to the photographs in assets/renfe-440/ (SOURCES.md). See
// docs/models/spain-trains.md.
//
// Heights over the rail. On the face, d behind its tip; the layout's d behind the body's front end
// (the face's join, JOIN behind the tip).
//
// Photographs and scales: photo-19980929a-puigcerda.jpg (the two-car 252M + C side-on, a 1-D
// projective fit over the cars' ends and their coupling, 23 - 30 px/m along the cars, about 34 px/m
// vertically at the motor car's front); photo-440113-renfe-estacion-de-cadiz-phil-richards.jpg (the
// driving trailer's side, projective fit over its front and both doors, 13 - 30 px/m; the face at
// 228 px/m from its crown to the buffers' centre); photo-rn440-125.jpg (the face head-on, 37 px/m);
// photo-rn-440-088.jpg and photo-rn-440-213.jpg (the roof); photo-tren-renfe-470-011-8.jpg (the
// Regionales scheme's paint on the rebuilt 470).

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { GameProperties, ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { singleArm } from "./czElectricKit.ts";

/** Lengths over the buffers and couplings: 80.164 m for three cars, 53.494 m for M + Rc (es.wikipedia "Serie 440 de Renfe"). */
const END_LENGTH = 26.75;
const MID_LENGTH = 26.67;
/** Where the face meets the body: the roof dome has reached the crown. */
const JOIN = 0.35;
/** The end car's body from the face's tip to its inner end (the buffers 0.65 m ahead, the coupling gap behind). */
const TIP_TO_END = END_LENGTH - 0.65 - 0.25;
/** A position measured on the photographs (m behind the front corner of a 26.55 m body) scaled onto the model's, behind the tip. */
const tipD = (p: number): number => (p * TIP_TO_END) / 26.55;
/** The same as d behind the body's front end. */
const at = (p: number): number => tipD(p) - JOIN;

/** The side's foot, skirt top and belly; the eaves and the crown (3.9 m: the head-on photographs, the buffers' centre 1.06 m up). */
const B = 0.72;
const A = 0.84;
const Y = 1.25;
const S = 3.45;
const C = 3.9;
const W = 1.45;

/** The windows' and the doors' leaves' sill and head; the doors' foot (the low platforms' steps) and head. */
const WIN: readonly [number, number] = [2.2, 3.25];
const DOOR: readonly [number, number] = [0.87, 3.31];
/** The navy (Cercanias) or grey (Regionales) foot band's top, and the front's lamp band. */
const FOOT = 1.33;
const BAND: readonly [number, number] = [FOOT, 2.06];
/** The windscreens: the low screens of the rebuilt cabs, their sill and head. */
const SCREEN: readonly [number, number] = [2.12, 3.15];

/**
 * The face's centre line (the head-on photograph of 125M, the three-quarter one of 113 and the side
 * of 252M): the foot upright from the buffers' level to the band's top, the screens leaning back
 * 0.12 m to their head, then the roof dome rounding back over the lamps to the crown at the join.
 */
const PROFILE: Pt[] = [
  [B, 0.03], [0.95, 0.005], [1.2, 0], [BAND[1], 0], [SCREEN[0], 0.006], [SCREEN[1], 0.12], [3.3, 0.14], [3.45, 0.165], [3.56, 0.19], [3.66, 0.22], [3.75, 0.255],
  [3.82, 0.29], [3.87, 0.32], [C, JOIN],
];

/** The two windscreens either side of the gangway door, in light grey rubbers. */
const PANES = [
  { lat: [0.4, 1.3] as const, y: SCREEN, r: 0.1 },
  { lat: [-1.3, -0.4] as const, y: SCREEN, r: 0.1 },
];
/** The gangway door in its frame: half width, sill and head; its window. */
const GANGWAY = { hw: 0.29, y0: 1.36, y1: 3.3, bar: 0.035 };
const GANGWAY_PANE = { lat: [-0.19, 0.19] as const, y: [2.2, 3.12] as const, r: 0.05 };

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), FOOT, SCREEN[0] - 0.04, GANGWAY_PANE.y[0] - 0.03, GANGWAY_PANE.y[1] + 0.03, SCREEN[1] + 0.04])].sort((a, b) => a - b);

const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.2, roofFrom: 3.84, first: tipD(7.25), bulge: 0.03, tolerance: 0.03, cols: [5, 3, 1, 1],
  profile: PROFILE,
  // the corners rounded 0.2 m in plan, the dome's corners rounding wider into the roof
  corner: [[B, 0.2], [BAND[1], 0.2], [SCREEN[1], 0.22], [3.45, 0.28], [3.62, 0.34], [3.75, 0.3], [3.85, 0.16], [C, 0.04]],
  rows: ROWS,
  masks: [
    // the windscreens' and the door window's light grey rubbers
    ...PANES.map((p) => ({ lat: [p.lat[0] - 0.04, p.lat[1] + 0.04] as const, y: [p.y[0] - 0.04, p.y[1] + 0.04] as const, r: p.r + 0.04, mat: "screenRubber" })),
    { lat: [GANGWAY_PANE.lat[0] - 0.03, GANGWAY_PANE.lat[1] + 0.03] as const, y: [GANGWAY_PANE.y[0] - 0.03, GANGWAY_PANE.y[1] + 0.03] as const, r: 0.08, mat: "screenRubber" },
  ],
  panes: [...PANES, GANGWAY_PANE],
  decals: [
    // the gangway door's frame: its rubber bars, the leaf between them in the face's own bands
    { mat: "rubber", pts: box(-GANGWAY.hw, -GANGWAY.hw + GANGWAY.bar, GANGWAY.y0, GANGWAY.y1), fine: 3 },
    { mat: "rubber", pts: box(GANGWAY.hw - GANGWAY.bar, GANGWAY.hw, GANGWAY.y0, GANGWAY.y1), fine: 3 },
    { mat: "rubber", pts: box(-GANGWAY.hw + GANGWAY.bar, GANGWAY.hw - GANGWAY.bar, GANGWAY.y1 - GANGWAY.bar, GANGWAY.y1), fine: 1 },
    { mat: "rubber", pts: box(-GANGWAY.hw + GANGWAY.bar, GANGWAY.hw - GANGWAY.bar, GANGWAY.y0, GANGWAY.y0 + GANGWAY.bar), fine: 1 },
    // the door's handle and the step plate under it
    { mat: "rubber", pts: box(0.17, 0.21, 2.02, 2.1), fine: 1 },
    { mat: "rubber", pts: box(-0.25, 0.25, 1.24, 1.3), fine: 1 },
  ],
  pods: [
    // the lamp housings in the band: the head lamp on the left, the tail and head lamp on the right
    { lat: -1.08, y: 1.76, w: 0.3, h: 0.2, r: 0.04, proud: 0.03, depth: 0.03, mat: "lampPod", lamps: [[0, 0.075, "lampHead"]] },
    { lat: 1.0, y: 1.76, w: 0.58, h: 0.2, r: 0.04, proud: 0.03, depth: 0.03, mat: "lampPod", lamps: [[-0.14, 0.075, "lampRed"], [0.14, 0.075, "lampHead"]] },
    // the double headlamp over the door, and the double marker lamps at the dome's corners
    { lat: 0, y: 3.6, w: 0.52, h: 0.27, r: 0.06, proud: 0.03, depth: 0.05, mat: "topPod", level: true, lamps: [[-0.125, 0.095, "lampHead"], [0.125, 0.095, "lampHead"]] },
    { lat: -1.12, y: 3.55, w: 0.34, h: 0.18, r: 0.04, proud: 0.025, depth: 0.05, mat: "topPod", level: true, lamps: [[-0.075, 0.05, "lampHead"], [0.075, 0.05, "lampRed"]] },
    { lat: 1.12, y: 3.55, w: 0.34, h: 0.18, r: 0.04, proud: 0.025, depth: 0.05, mat: "topPod", level: true, lamps: [[-0.075, 0.05, "lampRed"], [0.075, 0.05, "lampHead"]] },
  ],
  // the unit's car number over the left screen
  number: { lat: -1.26, y: 3.24, h: 0.13, mat: "faceNo" },
  wipers: [[[-0.78, SCREEN[0] + 0.05], [-1.08, 2.9]], [[1.0, SCREEN[0] + 0.05], [0.7, 2.9]]],
  lodGlass: { hw: 1.27, y: SCREEN },
};

/** n windows w wide at pitch p from d (photo metres behind the front corner). */
const row = (d: number, n: number, w: number, p: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d + i * p, d + i * p + w] as const);
/** A double door's two leaves from d, 1.6 m wide (photo metres). */
const door = (d: number): Array<readonly [number, number, number]> => [[at(d), at(d + 0.8), -1], [at(d + 0.8), at(d + 1.6), 1]];
const body = (spans: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => spans.map(([a, e]) => [at(a), at(e)] as const);

/** The passenger windows behind the first door, alike on both end cars: five between the doors, four behind the second. */
const SALOON = [...row(9.65, 5, 1.12, 1.63), ...row(20.45, 4, 1.08, 1.6)];
const DOORS = [...door(7.25), ...door(18.05)];
/** The motor car (M, leading): the former luggage room's window and the narrow one ahead of the first door (252M). */
const M_END: SeriesLayout = { doors: DOORS, windows: body([[3.65, 4.9], [5.75, 6.4], ...SALOON]) };
/** The driving trailer (Rc, at the rear): three windows behind its cab (113C, the 2-car unit's C). */
const RC_END: SeriesLayout = { doors: DOORS, windows: body([[2.11, 3.31], [3.79, 4.98], [5.43, 6.46], ...SALOON]) };

/** The intermediate trailer (R): its doors as far from its ends as the end cars' second door from their inner end, four windows at each end, five between the doors. */
const MID_BODY = MID_LENGTH - 0.5;
const MID: SeriesLayout = (() => {
  const toEnd = (d: number) => TIP_TO_END - tipD(d);
  const ends = row(20.45, 4, 1.08, 1.6).map(([a, e]): [number, number] => [toEnd(e), toEnd(a)]);
  const d0 = toEnd(19.65), w = tipD(1.6);
  const [a, e] = [d0 + w, MID_BODY - d0 - w];
  const n = 5, ww = tipD(1.12), pitch = tipD(1.63), first = (a + e) / 2 - (pitch * (n - 1) + ww) / 2;
  return {
    doors: [[d0, d0 + w / 2, -1], [d0 + w / 2, d0 + w, 1], [MID_BODY - d0 - w, MID_BODY - d0 - w / 2, -1], [MID_BODY - d0 - w / 2, MID_BODY - d0, 1]],
    windows: [
      ...ends.slice().reverse(),
      ...Array.from({ length: n }, (_, i): [number, number] => [first + i * pitch, first + i * pitch + ww]),
      ...ends.map(([p, q]): [number, number] => [MID_BODY - q, MID_BODY - p]),
    ],
  };
})();

/** The cab's side windows: the motor car's one wide window; the driving trailer's narrow window and its cab door's. */
const M_CAB: Array<readonly [number, number, number, number]> = [[at(0.38), at(1.25), WIN[0], 3.15]];
const RC_CAB: Array<readonly [number, number, number, number]> = [[at(0.42), at(0.74), WIN[0], 3.15], [at(0.98), at(1.38), WIN[0], 3.15]];

/** The inclined edges of the Cercanias sweeps: d at the foot band's top and at the eaves (photo metres, about 43 degrees). */
const lean = (dTop: number): Pt[] => [[FOOT, tipD(dTop - 0.93 * (S - FOOT))], [S, tipD(dTop)]];

const COMMON: Record<string, MaterialSpec> = {
  rubber: c("#2a2c2f", 0.6), screenRubber: c("#c9ccce", 0.45), lampPod: c("#b8bcbf", 0.35), topPod: c("#d6d8d9", 0.35), faceNo: c("#f4f4f2"),
  lampRed: { color: "#b3261e", metallic: 0, roughness: 0.2, lamp: { role: "tail" } },
  resistor: c("#53575b", 0.7), resistorGrid: c("#34373a", 0.8), steel: c("#46494c", 0.55), seam: c("#8e9296", 0.5),
  cabMask: c("#1d1f22", 0.3), roofG: c("#5f6367", 0.7),
};

/**
 * Cercanias (125M, 252M + C at Puigcerda in 1998): the white sides over the navy foot band, the red
 * roof and the red front over the white lamp band; behind each cab the red end with the white and the
 * navy sweeps leaning back, the red inner ends of the cars behind a sweep's edge; the white doors.
 */
const CERCANIAS: ShinkansenLivery = {
  title: "Cercanias", number: "125M",
  palette: {
    ...COMMON, white: c("#f1f1ee", 0.45), red: c("#d0202b", 0.45), navy: c("#23314f", 0.5), roofP: c("#c41f29", 0.6), skirtG: c("#1f2329", 0.75),
    lettering: c("#f4f4f2"),
  },
  bands: [[0, FOOT, "navy"], [FOOT, 9, "white"]],
  front: [[0, BAND[0], "navy"], [BAND[0], BAND[1], "white"], [BAND[1], 9, "red"]],
  doors: [[0, 9, "white"]],
  roof: "roofP", skirt: "skirtG", roofStripe: { z: 0.72, mat: "roofG" },
  endSweeps: [
    // the red cab end, back to the white side's leaning edge
    { mat: "red", front: [[FOOT, -9], [S, -9]], back: lean(7.2) },
    // the navy sweep, then the white one coming down into the lamp band carried round from the front
    { mat: "navy", front: lean(3.97), back: lean(5.5) },
    // an empty sweep: the third one would lie in the windows' frames' plane (the kit lays sweep i 3 + 1.5 i mm proud)
    { mat: "white", front: lean(0), back: lean(0) },
    { mat: "white", front: [[FOOT, -9], [BAND[1], -9], [BAND[1] + 0.005, tipD(2.9 - 0.93 * (S - BAND[1]))], [S, tipD(2.9)]], back: lean(3.97) },
    // the red inner end
    { mat: "red", front: lean(26.0), back: [[FOOT, TIP_TO_END], [S, TIP_TO_END]] },
  ],
  sideFields: {
    // the intermediate car's red ends, their edges leaning like the end cars' inner ends
    middle: [
      { mat: "red", pts: [[0, FOOT], [tipD(2.55), FOOT], [tipD(0.5), S], [0, S]] },
      { mat: "red", pts: [[MID_BODY - tipD(2.55), FOOT], [MID_BODY, FOOT], [MID_BODY, S], [MID_BODY - tipD(0.5), S]] },
    ],
  },
  lodSideFields: {
    end: [{ d: [0, tipD(6.2)], bands: [[0, FOOT, "navy"], [FOOT, 9, "red"]] }, { d: [tipD(25.0), TIP_TO_END], bands: [[0, FOOT, "navy"], [FOOT, 9, "red"]] }],
    middle: [{ d: [0, tipD(1.4)], bands: [[0, FOOT, "navy"], [FOOT, 9, "red"]] }, { d: [MID_BODY - tipD(1.4), MID_BODY], bands: [[0, FOOT, "navy"], [FOOT, 9, "red"]] }],
  },
};

/**
 * Regionales, the second scheme (440-088 at Busdongo in 2001; the 470's): the white sides over the
 * grey foot and a thin orange line, the orange roof, front, cab section (back to a leaning edge before
 * the first door) and doors.
 */
const REGIONAL: ShinkansenLivery = {
  title: "Regionales", number: "088M",
  palette: {
    ...COMMON, white: c("#f1f1ee", 0.45), orange: c("#e8621c", 0.45), grey: c("#6b6f74", 0.55), roofP: c("#d95b1b", 0.6), skirtG: c("#2c2f33", 0.75),
    lettering: c("#2a2c30"),
  },
  bands: [[0, FOOT - 0.1, "grey"], [FOOT - 0.1, FOOT, "orange"], [FOOT, 9, "white"]],
  front: [[0, FOOT - 0.1, "grey"], [FOOT - 0.1, 9, "orange"]],
  doors: [[0, 9, "orange"]],
  roof: "roofP", skirt: "skirtG",
  endSweeps: [{ mat: "orange", front: [[FOOT, -9], [S, -9]], back: [[FOOT, tipD(5.1)], [S, tipD(7.2)]] }],
  lodSideFields: { end: [{ d: [0, tipD(6.2)], bands: [[0, FOOT - 0.1, "grey"], [FOOT - 0.1, 9, "orange"]] }] },
};

/** The motor car's roof: the hood behind the cab, the folded front pantograph, the resistor grids; the driving trailer's cab door; the underfloor. */
function fittings440(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[]; rearEndCar?: boolean }): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  // the motor car leads (a lone end car is always it); the rear end car of a train is the driving trailer
  const front = Math.sign(X(0) - X(1));
  const motor = car.end && !car.rearEndCar;
  if (motor) {
    m.scope("roof equipment", () => {
      m.scope("hood", () => blk("roofP", at(0.8), at(2.1), C - 0.08, C + 0.12, -0.55, 0.55));
      m.scope("front pantograph", () => {
        // folded, its knee toward the middle of the car like the raised rear one's
        const x = X(at(3.4));
        blk("roofP", at(2.3), at(4.5), C - 0.06, C + 0.05, -0.8, 0.8);
        singleArm(m, { xc: x, roofY: C + 0.05, baseY: C + 0.3, h: front, raised: false });
      });
      m.scope("resistors", () => {
        const [d0, d1] = [at(8.6), at(18.3)];
        blk("resistor", d0, d1, C - 0.08, C + 0.08, -0.82, 0.82);
        const n = Math.round((d1 - d0) / 1.2);
        for (let k = 0; k < n; k++) {
          const [a, e] = [d0 + ((d1 - d0) * k) / n + 0.06, d0 + ((d1 - d0) * (k + 1)) / n - 0.06];
          blk("resistorGrid", a, e, C + 0.08, C + 0.3, -0.74, 0.74);
        }
      });
    });
    m.scope("luggage door", () => {
      // the former luggage room's sliding door round the window ahead of the first door
      const [d0, d1, k] = [at(3.5), at(5.05), 0.018];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "seam", d0, d0 + k, DOOR[0] + 0.25, DOOR[1], 0.004, 0.02);
        sidePanel(m, b, X, sd, "seam", d1 - k, d1, DOOR[0] + 0.25, DOOR[1], 0.004, 0.02);
        sidePanel(m, b, X, sd, "seam", d0 + k, d1 - k, DOOR[1] - k, DOOR[1], 0.004, 0.02);
      }
    });
  }
  if (car.end && !motor)
    m.scope("cab door", () => {
      // the driving trailer's cab door round its second narrow window, the grab rail behind it
      const [d0, d1, k] = [at(0.88), at(1.5), 0.018];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "seam", d0, d0 + k, 1.0, DOOR[1], 0.004, 0.02);
        sidePanel(m, b, X, sd, "seam", d1 - k, d1, 1.0, DOOR[1], 0.004, 0.02);
        sidePanel(m, b, X, sd, "seam", d0 + k, d1 - k, DOOR[1] - k, DOOR[1], 0.004, 0.02);
        sidePanel(m, b, X, sd, "steel", d1 + 0.08, d1 + 0.11, 1.3, 2.9, 0.03, 0.02);
      }
    });
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    // the motor car's control and resistor cases, the trailers' auxiliary sets and reservoirs, between the bogies and the doors' steps
    if (motor) {
      blk("under", t0 + 2.0, at(7.1), 0.42, B + 0.02, -1.1, 1.1);
      blk("under", at(9.0), at(17.9), 0.38, B + 0.02, -1.15, 1.15);
    } else {
      // between the first door and the second: the end car from its first door, the trailer from its first door's rear jamb
      const a = car.end ? at(9.0) : MID.doors[1]![1] + 0.15;
      blk("under", a + 0.4, a + 4.5, 0.48, B + 0.02, -1.0, 1.0);
      blk("under", a + 5.0, Math.min(t1 - 2.0, a + 8.0), 0.55, B + 0.02, -0.9, 0.9);
    }
  });
}

export const R440: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.975, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [WIN], windowW: 1.1, pitch: 1.6, windowCornerR: 0.07,
  // the double doors: each leaf (a span of the layout) with its tall window
  door: [DOOR[0], DOOR[1], WIN[0], 3.2], doorW: tipD(0.8), doorGlassW: 0.56,
  layout: { end: M_END, middle: MID },
  cabWindows: M_CAB,
  rearEnd: { layout: RC_END, cabWindows: RC_CAB },
  // the number over the cab window
  numberAt: [-(TIP_TO_END - JOIN) / 2 + at(0.45), 3.27, 0.13],
  // bogies 3.5 m behind the front corner and as far from the inner end; 930 mm wheels
  bogieCentres: 19.0, endBogies: [at(3.55), at(26.55 - 3.45)], midBogies: [tipD(3.45), MID_BODY - tipD(3.45)], wheelR: 0.465, wheelbase: 2.5,
  // the motor car leads with its rear pantograph raised (the front one is the fittings')
  endPantograph: "lead", pantographAt: at(21.2), pantographKneeForward: true, minCars: 2, cars: [3],
  endCoupler: "buffers", bufferBeam: false,
  fittings: fittings440,
  // the roof equipment in the distant model
  lodRoof: { d: [tipD(8.6), tipD(18.3)], hw: 0.8, y: [C - 0.1, C + 0.25], mat: "resistor" },
  liveries: { regional: REGIONAL, cercanias: CERCANIAS },
  // 150.4 t for three cars, 110 t for M + Rc (empty); 4 x 290 kW on the motor car
  weight: { end: 55, middle: 40.4 }, power: 1160, maxspeed: 140,
};

export const R440_PARAMS = seriesParams(R440);

export function renfe440(v?: ParamValues): MeshBuilder { return buildSeries(R440, R440_PARAMS, v); }
export function renfe440Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R440, R440_PARAMS, v); }

/**
 * The game's figures: the motor car (the default unit) 62 t with all four 290 kW motors, the
 * intermediate trailer 40.4 t and unpowered, the trains 110 t (M + Rc) and 150.4 t, 1,160 kW.
 */
export function r440Game(g: GameProperties): GameProperties {
  return {
    ...g, weight: 62, power: 1160,
    variants: g.variants?.map((v) => (v.params.unit === "middleCar" ? { ...v, weight: 40.4, power: 0 } : v.params.unit === "train" ? { ...v, weight: v.params.cars === "2" ? 110 : 150.4, power: 1160 } : v)),
  };
}
