// The DJJ1 "Blue Arrow" (Lanjian; Zhuzhou Electric Locomotive Works with Changchun car works, 2000):
// China's first 200 km/h push-pull set, eight built for the Guangzhou - Shenzhen line (later Shaoguan -
// Pingshi and the Chengdu bureau's lines), retired in 2012. One streamlined Bo-Bo power car (4,800 kW,
// 78 t) leads five coaches and a driving trailer with the same rounded nose at the other end. Drawn on
// the series kit (shinkansen.ts) like the CR200J: the coaches and the driving trailer are one series
// (`BLUE_ARROW`, unwired), the power car its lead car (`leadCar`) with its own body - the cab side
// window, one crew door, plain sides, louvres along both roof edges, two single-arm pantographs (the
// rear one raised), Bo-Bo bogies on 1.05 m wheels. Both noses are one cab face (seriesCab.ts) matched
// to the photographs in assets/cr-blue-arrow/ (SOURCES.md): one smooth surface from the skirt to the
// roof, the coupler hatch only a seam on its rounded bumper.
//
// Heights over the rail, d behind the nose's tip (the bumper's front, 1.0 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { singleArm } from "./czElectricKit.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the cab face meets the body; the crown reaches the roof just behind it. */
const JOIN = 4.4;
/** The face's crown at the join. */
const FACE_TOP = 3.93;

/**
 * The centre line (the side-on photograph of 0001A at Zhaoqing, about 44.5 px/m, and the three-quarter
 * views): the rounded bumper (its front 1.0 m up) tucking under to the skirt 0.2 m behind the tip, the
 * face rising above it at about 45 degrees past the lamps (2.5 m, 0.85 m back) to the windscreen's foot
 * (2.92 m, 1.4 m back), the windscreen raked about 30 degrees to its head (3.48 m, 2.4 m back), the
 * canopy rounding over to the roof (3.95 m) 4.4 m behind the tip. One smooth convex curve: no step at
 * the coupler hatch.
 */
const PROFILE: Pt[] = [
  [0.35, 0.2], [0.42, 0.11], [0.52, 0.06], [0.66, 0.025], [0.82, 0.006], [1.0, 0], [1.2, 0.015], [1.45, 0.07], [1.7, 0.18], [1.95, 0.32],
  [2.2, 0.53], [2.5, 0.85], [2.8, 1.24], [3.08, 1.68], [3.4, 2.25], [3.6, 2.66], [3.73, 2.98], [3.84, 3.4], [3.9, 3.85], [FACE_TOP, JOIN],
];
/** The plan: a broad bumper rounding into the sides in big corners, the face narrowing a little up to the windscreen. */
const CORNER: Pt[] = [[0.35, 1.15], [0.8, 1.2], [1.4, 1.2], [2.2, 1.25], [2.8, 1.25], [3.4, 1.05], [3.73, 0.8], [FACE_TOP, 0.6]];
const DEPTH_TABLE: Pt[] = [[0.35, 1.2], [1.0, 1.3], [1.8, 1.3], [2.5, 1.2], [3.08, 0.9], [3.6, 0.55], [FACE_TOP, 0.1]];
/** The face's bow in plan: its edges this far behind its centre. */
const BULGE: Pt[] = [[0.35, 0.04], [2.5, 0.05], [3.6, 0.03], [FACE_TOP, 0.01]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
};
/** The corner's depth by height, kept ahead of the join. */
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - edge(BULGE, y) - 0.02, edge(DEPTH_TABLE, y)))]);

/** The side's bands: the navy line along every car (1.45 - 1.62 m), the grey under it. */
const LINE: readonly [number, number] = [1.45, 1.62];
/** The coaches' dark window band. */
const PANEL: readonly [number, number] = [1.94, 2.84];
/** The front's teal line along the bumper's lower edge, where the side's line ends. */
const FRONT_LINE: readonly [number, number] = [0.92, 1.02];

/** The grey canopy's back edge on the nose's flanks: from under the windscreen past the cab side window to the roof. */
const CANOPY_BACK: Pt[] = [[2.84, 1.3], [3.0, 1.7], [3.15, 2.3], [3.22, 3.0], [3.35, 4.0], [3.45, 5.2]];

/** The coupler hatch's seam: the cap's upper edge arching over the bumper from the teal line's ends (head-on, [lat, y]). */
const HATCH: Pt[] = (() => {
  const out: Pt[] = [], [hw, y0, y1, r] = [0.98, FRONT_LINE[1], 1.6, 0.36];
  for (let i = 0; i <= 6; i++) out.push([-hw, y0 + ((y1 - r - y0) * i) / 6]);
  for (let i = 1; i <= 6; i++) { const a = Math.PI - (i / 6) * (Math.PI / 2); out.push([-hw + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 1; i <= 6; i++) out.push([-hw + r + ((2 * (hw - r)) * i) / 6, y1]);
  for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 - (i / 6) * (Math.PI / 2); out.push([hw - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 1; i <= 6; i++) out.push([hw, y1 - r - ((y1 - r - y0) * i) / 6]);
  return out;
})();
/** A line along a path as thin quads (decals), `w` wide. */
const lineQuads = (path: readonly Pt[], w: number): Pt[][] => path.slice(1).map(([l1, y1], i) => {
  const [l0, y0] = path[i]!, len = Math.hypot(l1 - l0, y1 - y0) || 1, [nl, ny] = [(-(y1 - y0) / len) * w / 2, ((l1 - l0) / len) * w / 2];
  const q: Pt[] = [[l0 - nl, y0 - ny], [l1 - nl, y1 - ny], [l1 + nl, y1 + ny], [l0 + nl, y0 + ny]];
  // counter-clockwise seen head-on
  const area = q.reduce((s, [a, b], k) => s + a * q[(k + 1) % 4]![1] - q[(k + 1) % 4]![0] * b, 0);
  return area < 0 ? q.reverse() : q;
});

const ROWS = [...new Set([...PROFILE.map(([y]) => y), FRONT_LINE[0], FRONT_LINE[1], 2.84, 1.6])].sort((a, b) => a - b);

/** The cab face of the power car and of the driving trailer. */
export const BLUE_ARROW_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.9, first: 5.2, wheelCut: { d: 2.75, y: 0.62 }, roofFrom: 9, cols: [3, 4, 1, 1], tolerance: 0.06, wrap: true,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, bulge: BULGE, rows: ROWS,
  lodBands: [[0, 0.3, "plough"], [0.3, FRONT_LINE[0], "lower"], [FRONT_LINE[0], FRONT_LINE[1], "teal"], [FRONT_LINE[1], 2.84, "body"], [2.84, 9, "canopy"]],
  lod: {
    profile: [[0.35, 0.2], [0.52, 0.06], [0.95, 0], [1.4, 0.06], [1.95, 0.32], [2.5, 0.85], [3.08, 1.68], [3.6, 2.66], [3.84, 3.4], [FACE_TOP, JOIN]],
    corner: [[0.35, 1.15], [1.4, 1.2], [2.8, 1.25], [3.4, 1.05], [FACE_TOP, 0.6]],
    rows: [0.35, 0.52, 0.95, 1.4, 1.95, 2.5, 3.08, 3.6, 3.84, FACE_TOP],
    cornerDepth: [[0.35, 1.0], [1.4, 1.1], [2.5, 1.0], [3.08, 0.8], [3.6, 0.45], [3.84, 0.3], [FACE_TOP, 0.05]],
    bulge: BULGE,
  },
  lodGlass: { hw: 0.95, y: [2.95, 3.45] },
  paint: [
    // the grey canopy round the windscreens, from under them over the crown and back past the cab side window
    { mat: "canopy", front: [[2.84, -9], [FACE_TOP + 0.1, -9]], back: CANOPY_BACK, top: 9 },
    // the cab side window on the nose's flanks just behind the windscreen: its dark frame and pane
    { mat: "frame", front: [[2.19, 2.2], [2.26, 2.13], [2.86, 2.13], [2.93, 2.2]], back: [[2.19, 2.83], [2.26, 2.9], [2.86, 2.9], [2.93, 2.83]], top: 9 },
    { mat: "screen", front: [[2.24, 2.25], [2.3, 2.19], [2.82, 2.19], [2.88, 2.25]], back: [[2.24, 2.78], [2.3, 2.84], [2.82, 2.84], [2.88, 2.78]], top: 9 },
  ],
  decals: [
    // the coupler hatch: only its seam, flush with the bumper
    ...lineQuads(HATCH, 0.018).map((pts) => ({ mat: "seam", pts, fine: 1 })),
    // the arrow of the "Lanjian / ARROW" emblem under the right lamp
    { mat: "navy", pts: [[-0.05, 1.86], [0.4, 1.86], [0.44, 1.95], [0.12, 2.12]], fine: 1 },
    { mat: "navy", pts: [[0.12, 2.12], [0.44, 1.95], [0.5, 2.02], [0.26, 2.16]], fine: 1 },
  ],
  texts: [{ text: "ARROW", lat: 0.78, y: 1.86, h: 0.12, mat: "navy" }],
  // the lamp windows under the windscreen: the head lamps' clear covers at the sides, the dark marker window in the middle
  masks: [
    { lat: [-1.08, -0.05], y: [2.9, 3.52], r: 0.15, mat: "frame" },
    { lat: [0.05, 1.08], y: [2.9, 3.52], r: 0.15, mat: "frame" },
    { lat: [-1.04, -0.54], y: [2.34, 2.62], r: 0.06, mat: "lampBox" },
    { lat: [0.54, 1.04], y: [2.34, 2.62], r: 0.06, mat: "lampBox" },
    { lat: [-1.0, -0.58], y: [2.38, 2.58], r: 0.04, mat: "lampGlass" },
    { lat: [0.58, 1.0], y: [2.38, 2.58], r: 0.04, mat: "lampGlass" },
    { lat: [-0.24, 0.24], y: [2.38, 2.6], r: 0.04, mat: "lampBox" },
  ],
  // the two windscreens either side of a broad pillar, in the grey canopy
  panes: [{ lat: [-1.04, -0.09], y: [2.94, 3.48], r: 0.12, mat: "screen" }, { lat: [0.09, 1.04], y: [2.94, 3.48], r: 0.12, mat: "screen" }],
  wipers: [[[0.55, 2.97], [0.3, 3.32]], [[-0.45, 2.97], [-0.7, 3.32]]],
};

// ---------------------------------------------------------------------------
// The livery

const WHITE = "#e8ebee";
const LOWER = "#a5afbb";
const NAVY = "#1f3a8c";
const TEAL = "#27a3b5";
const CANOPY = "#5d6570";

/** The navy line's lower and upper edge along the nose: from the bumper's teal line rising to the side's line 4.9 m back, ahead of the crew door. */
const ease = (t: number): number => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const lineLow = (d: number): number => FRONT_LINE[0] + (LINE[0] - FRONT_LINE[0]) * ease((d - 0.7) / 4.2);
const lineHigh = (d: number): number => lineLow(d) + (FRONT_LINE[1] - FRONT_LINE[0]) + ((LINE[1] - LINE[0]) - (FRONT_LINE[1] - FRONT_LINE[0])) * ease((d - 0.7) / 4.2);
/** Where an edge (rising with d) passes height y: d behind the tip. */
const inverse = (f: (d: number) => number, y: number): number => {
  let [a, b] = [0, 4.95];
  if (y <= f(a)) return a;
  if (y >= f(b)) return b;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (f(m) < y) a = m; else b = m; }
  return (a + b) / 2;
};
const edgeAt = (f: (d: number) => number, y0: number, y1: number, n: number, below: number, above: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const y = y0 + ((y1 - y0) * i) / n; return [y, y <= f(0) ? below : y >= f(4.95) ? above : inverse(f, y)] as Pt; });

/**
 * The Guangshen sets' paint: silver white, a navy line along every car at the floor with the grey under
 * it; on the cab cars the line sweeping down the nose's flanks to the bumper, where it ends in the teal
 * line under the coupler hatch's white cap; the grey canopy round the windscreens and over the crown,
 * the dark roof louvres; the coaches' dark window band.
 */
function blueArrowLivery(number: string, lettering: ShinkansenLivery["endLettering"]): ShinkansenLivery {
  return {
    title: "Blue Arrow", number,
    palette: {
      body: c(WHITE, 0.4), lower: c(LOWER, 0.5), navy: c(NAVY, 0.4), teal: c(TEAL, 0.4), canopy: c(CANOPY, 0.35), dark: c("#3b4148", 0.3),
      plough: c("#2a2d31", 0.6), skirtG: c("#6d747c", 0.7), seam: c("#4a5058", 0.5), screen: c("#33485a", 0.08), frame: c("#2c3035", 0.35),
      lampBox: c("#30353b", 0.15), lampGlass: c("#e6e1c8", 0.1), roofG: c("#9aa1a8", 0.55), roofP: c("#8d949b", 0.55), louvre: c("#42484f", 0.6), lettering: c(NAVY, 0.4),
      cabMask: c("#1d1f22", 0.3), under: c("#2a2c2f", 0.85),
    },
    bands: [[0, LINE[0], "lower"], [LINE[0], LINE[1], "navy"], [LINE[1], 9, "body"]],
    front: [[0, 0.3, "plough"], [0.3, FRONT_LINE[0], "lower"], [FRONT_LINE[0], FRONT_LINE[1], "teal"], [FRONT_LINE[1], 9, "body"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the body's white over the side's line ahead of where the nose's line has risen to it
      { mat: "body", front: [[LINE[0], JOIN - 0.05], [LINE[1], JOIN - 0.05]], back: edgeAt(lineHigh, LINE[0], LINE[1], 2, 0, 5.0) },
      // the grey under the nose's line
      { mat: "lower", front: edgeAt(lineLow, FRONT_LINE[0], LINE[0], 4, -1, 5.0), back: [[FRONT_LINE[0], 5.0], [LINE[0], 5.0]] },
      // the navy line itself, sweeping down the nose's flank to the bumper
      { mat: "navy", front: edgeAt(lineHigh, FRONT_LINE[0], LINE[1], 5, -1, 5.0), back: edgeAt(lineLow, FRONT_LINE[0], LINE[1], 5, -1, 5.0) },
    ],
    ...(lettering ? { endLettering: lettering } : {}),
  };
}

// ---------------------------------------------------------------------------
// Fittings

/** A low roof unit (an air-conditioning unit): a frustum from a rounded rectangle sunk in the roof to a smaller one at its top. */
function roofUnit(m: MeshBuilder, x0: number, x1: number, y: number, hw: number, h: number, mat: string): void {
  const ring = (len: number, w: number): Ring => {
    const r = Math.min(w * 0.5, len / 2 - 0.01), x = (x0 + x1) / 2, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[len / 2 - r, -(w - r), -90], [len / 2 - r, w - r, 0], [-(len / 2 - r), w - r, 90], [-(len / 2 - r), -(w - r), 180]] as const)
      for (let j = 0; j <= 3; j++) { const a = ((a0 + (90 * j) / 3) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return out.reverse() as Ring;
  };
  const len = Math.abs(x1 - x0);
  m.loft(mat, ring(len, hw), y - 0.1, ring(len - 0.2, hw - 0.1), y + h);
}

/** Louvres on both roof edges over a d span (behind the join): a dark panel on the roof's arc and the slats across it in the roof's paint. */
function louvres(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d0: number, d1: number, z: readonly [number, number], slats: number, mat: string): void {
  for (const sd of [1, -1]) {
    crownPane(m, b, X, sd, "louvre", [d0, d1], [z[0], z[1]], 0.004);
    const w = (d1 - d0) / slats;
    for (let i = 0; i < slats; i++) crownPane(m, b, X, sd, mat, [d0 + i * w + w * 0.6, d0 + (i + 1) * w], [z[0] - 0.01, z[1] + 0.01], 0.008);
  }
}

/** The power car's roof: the folded front pantograph, the breaker and the roof line, the louvres along both edges; the transformer under it. */
function powerFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = POWER.C;
  // the front pantograph, folded, 6.2 m behind the tip on its insulators
  m.scope("front pantograph", () => {
    const x = X(6.2 - JOIN);
    block(m, "roofP", x - 0.95, x + 0.95, C - 0.06, C + 0.05, -0.75, 0.75);
    singleArm(m, { xc: x, roofY: C + 0.05, baseY: C + 0.38, h: 1, raised: false });
  });
  m.scope("roof equipment", () => {
    block(m, "roofP", X(10.9 - JOIN), X(9.3 - JOIN), C - 0.06, C + 0.05, -0.7, 0.7);
    block(m, "pantograph", X(10.7 - JOIN), X(9.5 - JOIN), C + 0.05, C + 0.36, -0.3, 0.3);
    block(m, "pantograph", X(13.9 - JOIN), X(7.0 - JOIN), C + 0.38, C + 0.42, 0.16, 0.2);
  });
  m.scope("louvres", () => {
    louvres(m, b, X, 4.0 - JOIN, 8.3 - JOIN, [0.95, 1.4], 10, "roofP");
    louvres(m, b, X, 8.6 - JOIN, 13.4 - JOIN, [0.95, 1.4], 11, "roofP");
    louvres(m, b, X, 13.7 - JOIN, 17.6 - JOIN, [0.95, 1.4], 9, "roofP");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 1.9), X(car.trucks[0]! + 1.9), POWER.B - 0.2, POWER.B + 0.05, -POWER.W * 0.8, POWER.W * 0.8));
}

/** The coaches' and the driving trailer's fittings: the air-conditioning units over the ends, the underframe. */
function trailerFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = BLUE_ARROW.C, L = car.length;
  m.scope("air conditioning", () => {
    roofUnit(m, X(L - 0.7), X(L - 3.6), C, 0.85, 0.16, "roofG");
    if (!car.end) roofUnit(m, X(0.7), X(3.6), C, 0.85, 0.16, "roofG");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), BLUE_ARROW.B - 0.15, BLUE_ARROW.B + 0.05, -BLUE_ARROW.W * 0.8, BLUE_ARROW.W * 0.8));
}

// ---------------------------------------------------------------------------
// The cars

/** The power car: 20.5 m over the couplers (published), less the face, the tip's reach and half the gap. */
const POWER_LENGTH = 20.5;
const POWER_BODY = POWER_LENGTH - 0.25 - JOIN - 0.07;
/** The driving trailer: 25.325 m over the couplers (published); a coach 25.5 m. */
const DT_LENGTH = 25.325;
const DT_BODY = DT_LENGTH - 0.25 - JOIN - 0.07;
const COACH_LENGTH = 25.5;
const COACH_BODY = COACH_LENGTH - 0.5;

/** A row of n windows, `w` wide and `pitch` apart, the first from d0. */
const windowRow = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

/** The coaches' window band: from just ahead of the first window to just behind the last. */
const COACH_WINDOWS = windowRow(2.15, 13, 1.1, 1.62);
const COACH_BAND: Pt[] = [[COACH_WINDOWS[0]![0] - 0.25, PANEL[0]], [COACH_WINDOWS[12]![1] + 0.25, PANEL[0]], [COACH_WINDOWS[12]![1] + 0.25, PANEL[1]], [COACH_WINDOWS[0]![0] - 0.25, PANEL[1]]];

/**
 * The power car (Zhuzhou): 20.5 m over the couplers, its roof at 3.95 m, 3.1 m wide; the cab side window,
 * one crew door 5.1 m behind the tip, plain sides; Bo-Bo bogies 10.5 m apart on 1.05 m wheels, 2.8 m
 * wheelbase; the rear pantograph raised 14.8 m behind the tip, the front one folded (fittings).
 */
export const POWER: ShinkansenSeries = {
  endLength: POWER_LENGTH, midLength: COACH_LENGTH, W: 1.55, Y: 0.7, S: 3.4, C: 3.95, lean: 0.96, B: 0.35, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BLUE_ARROW_FACE,
  endCrown: [[0, FACE_TOP], [0.6, 3.95]], endCrownStep: 0.6,
  windows: [[2.3, 2.9]], windowW: 0.7, pitch: 1.7, door: [1.0, 3.28, 2.55, 3.08], doorW: 0.82, doorGlassW: 0.24, doorGlassR: 0.1,
  endSides: { windows: [], doors: [[5.08 - JOIN, 5.9 - JOIN]] },
  endBogies: [4.7 - JOIN, 15.2 - JOIN], bogieCentres: 10.5, wheelR: 0.525, wheelbase: 2.8,
  endPantograph: "lead", pantographD: 14.8,
  numberAt: [6.9 - JOIN - POWER_BODY / 2, 2.3, 0.1],
  fittings: powerFittings,
  liveries: { blueArrow: blueArrowLivery("DJJ1-0007A", [{ text: "GUANGSHEN RAILWAY", d: 10.5 - JOIN, y: 2.05, h: 0.16, mat: "navy" }]) },
  weight: { end: 78, middle: 45 }, power: 4800, maxspeed: 200,
};

/**
 * The coaches and the driving trailer (Changchun; the series the design builds): 25.5 m coaches with a door
 * at each end and thirteen 1.1 m windows in a dark band, the roof at 4.0 m with an air-conditioning unit over
 * each end; the driving trailer 25.325 m with the power car's nose, a crew door, two small windows, a
 * passenger door, six windows and the rear door.
 */
export const BLUE_ARROW: ShinkansenSeries = {
  endLength: DT_LENGTH, midLength: COACH_LENGTH, W: 1.55, Y: 0.7, S: 3.45, C: 4.0, lean: 0.96, B: 0.35, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BLUE_ARROW_FACE,
  endCrown: [[0, FACE_TOP], [0.6, 3.98], [1.2, 4.0]], endCrownStep: 0.6,
  windows: [[2.02, 2.76]], windowW: 1.1, pitch: 1.62, door: [1.0, 3.05, 2.05, 2.75], doorW: 0.8, doorGlassW: 0.3, doorGlassR: 0.12,
  layout: {
    end: {
      doors: [[5.15 - JOIN, 5.85 - JOIN, -1], [10.8 - JOIN, 11.6 - JOIN, -1], [DT_BODY - 1.15, DT_BODY - 0.35, 1]],
      windows: [[6.7 - JOIN, 7.6 - JOIN], [8.2 - JOIN, 9.1 - JOIN], ...windowRow(12.3 - JOIN, 6, 1.1, 1.75)],
    },
    middle: { doors: [[0.35, 1.15, -1], [COACH_BODY - 1.15, COACH_BODY - 0.35, 1]], windows: COACH_WINDOWS },
  },
  endBogies: [4.5 - JOIN, 22.0 - JOIN], bogieCentres: 18.0, wheelR: 0.4575, wheelbase: 2.5,
  traction: "none", cars: [3, 4, 5, 6, 7], leadCar: POWER,
  fittings: trailerFittings,
  liveries: { blueArrow: { ...blueArrowLivery("DJJ1-0007", undefined), sideFields: { middle: [{ mat: "dark", pts: COACH_BAND }] } } },
  weight: { end: 47, middle: 45 }, power: 0, maxspeed: 200,
};

// ---------------------------------------------------------------------------
// The design

/** The train lengths: the power car, one coach and the driving trailer up to the set's seven cars (four the default). */
export const BLUE_ARROW_CARS: readonly number[] = [3, 4, 5, 6, 7];

/** The cars: the power car (the default, the train's locomotive), a coach, the driving trailer, the train. */
export const BLUE_ARROW_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { endCar: "Power car", middleCar: "Coach", drivingTrailer: "Driving trailer", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(BLUE_ARROW_CARS.map((n) => [String(n), `${n} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
];

/** Which series builds a selection, and the values its own build reads. */
function pick(v?: ParamValues): { s: ShinkansenSeries; values: ParamValues } {
  const p = resolveParams(BLUE_ARROW_PARAMS, v);
  if (p.unit === "endCar") return { s: POWER, values: { ...p, unit: "endCar" } };
  return { s: BLUE_ARROW, values: { ...p, unit: p.unit === "drivingTrailer" ? "endCar" : p.unit! } };
}

export function blueArrow(v?: ParamValues): MeshBuilder {
  const { s, values } = pick(v);
  return buildSeries(s, BLUE_ARROW_PARAMS, values);
}
export function blueArrowLod(v?: ParamValues): MeshBuilder {
  const { s, values } = pick(v);
  return buildSeriesLod(s, BLUE_ARROW_PARAMS, values);
}

/** The game's figures: the power car 78 t and 4,800 kW, a coach 45 t, the driving trailer 47 t; a train adds them up. */
function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [
    { params: { unit: "middleCar" }, weight: BLUE_ARROW.weight.middle, power: 0 },
    { params: { unit: "drivingTrailer" }, weight: BLUE_ARROW.weight.end, power: 0 },
  ];
  for (const n of BLUE_ARROW_CARS)
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train" }, weight: POWER.weight.end + (n - 2) * BLUE_ARROW.weight.middle + BLUE_ARROW.weight.end, power: POWER.power });
  return { weight: POWER.weight.end, power: POWER.power, maxspeed: 200, accel: null, variants };
}

export const BLUE_ARROW_DESIGN = (build: (v?: ParamValues) => MeshBuilder, lod: (v?: ParamValues) => MeshBuilder): ProceduralDesign => ({
  ...seriesDesign("proc-vehicle-cr-blue-arrow", "DJJ1 Blue Arrow", POWER, BLUE_ARROW_PARAMS, build, lod, "cr-blue-arrow", "us"),
  game: game(),
});
