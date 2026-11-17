// The Fuxing CR200J "Green Giant" (CRRC, 2019): a power-car train for 160 km/h on the conventional
// lines - one locomotive-like power car (FXD1-J from Dalian, FXD3-J from Datong), the unpowered
// coaches and, in the short sets (Mc + 7T + Tc), a driving trailer with the same blunt nose at the
// other end. Drawn on the series kit (shinkansen.ts): the coaches and the driving trailer are one
// series (`CR200J`, unwired), the power car its lead car (`leadCar`), with its own body - a cab,
// the machine room's plain sides with one crew door and the louvres along its roof's edges, two
// single-arm pantographs (the rear one raised), Bo-Bo bogies on 1.25 m wheels. Both noses are one
// cab face (seriesCab.ts) matched to the photographs in assets/cr-cr200j/ (SOURCES.md).
// See docs/models/china-units.md ("The CR200J's body").
//
// Heights over the rail, d behind the nose's tip (the bumper's front, 0.85 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownPane, shapedCrownPane, type SliceBody } from "./sliceBody.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { singleArm } from "./czElectricKit.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the cab face meets the body; the crown still rises behind it (`endCrown`). */
const JOIN = 5.3;
/** The face's crown at the join. */
const FACE_TOP = 4.28;

/**
 * The centre line (the side-on photograph of FXD1-J0009, about 71 px/m): the plough under a broad,
 * rounded bumper (front 0.85 m up, its top lip 1.15 m), the face above it set back and leaning
 * evenly back past the lamps to the windscreen's foot (2.45 m, 1.85 m behind the tip), the
 * windscreen raked about 45 degrees to its head (3.62 m, 3.4 m back), the canopy rounding over to
 * the roof.
 */
const PROFILE: Pt[] = [
  [0.35, 0.32], [0.45, 0.2], [0.6, 0.06], [0.9, 0], [1.1, 0.1], [1.2, 0.3], [1.3, 0.38], [1.69, 0.74], [2.13, 1.19],
  [2.56, 1.64], [3.03, 2.14], [3.48, 2.7], [3.68, 2.98], [3.82, 3.26], [4.02, 3.71], [4.12, 4.0], [4.19, 4.2], [4.24, 4.55], [FACE_TOP, JOIN],
];
/** The plan: a broad bumper rounding into the sides in deep corners, the face narrowing a little to the windscreen. */
const CORNER: Pt[] = [[0.35, 0.75], [1.2, 0.7], [1.5, 0.65], [2.0, 0.6], [2.56, 0.65], [3.26, 0.7], [3.82, 0.8], [4.12, 0.8], [FACE_TOP, 0.7]];
const DEPTH_TABLE: Pt[] = [[0.35, 1.0], [1.2, 1.0], [1.5, 0.8], [2.0, 0.6], [2.56, 0.65], [3.26, 0.8], [3.82, 0.6], [4.12, 0.4], [FACE_TOP, 0.1]];
/** The face's bow in plan: its edges this far behind its centre, so that the lamps at its edges stand 1.3 m behind the chin and still face ahead. */
const BULGE: Pt[] = [[0.35, 0.3], [1.0, 0.35], [1.2, 0.45], [1.5, 0.8], [2.0, 1.0], [2.56, 0.95], [3.26, 0.85], [3.82, 0.5], [4.12, 0.25], [FACE_TOP, 0.05]];
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

/**
 * The dark mask's back edge on the nose's flanks: the eyes holding the lamps, rising from the
 * bumper's corners to the windscreen's frame, and the canopy over the windscreen running back
 * over the roof (behind the join on the body, `canopyTail`).
 */
const MASK_BACK: Pt[] = [[1.5, 1.1], [1.7, 1.75], [1.9, 2.35], [2.2, 3.15], [2.5, 3.4], [2.8, 3.5], [3.1, 3.65], [3.4, 3.9], [3.6, 4.3], [3.8, 4.7], [4.1, 5.2], [4.4, 5.8]];
/** The chin under the windscreen (head-on, [lat, y]): the emblem's field between the two stripes of body paint that part it from the eyes. */
const CHIN: Pt[] = [[-0.98, 1.2], [0.98, 1.2], [1.08, 1.45], [0.95, 2.56], [-0.95, 2.56], [-1.08, 1.45]];
const STRIPE: Pt[] = [[0.98, 1.2], [1.16, 1.2], [1.26, 1.45], [1.12, 2.56], [0.95, 2.56], [1.08, 1.45]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** The China Railway emblem on the chin: an orange ring (the rail's section in a circle, drawn as its ring). */
const EMBLEM: Pt[][] = Array.from({ length: 16 }, (_, i) => {
  const [a0, a1] = [(i / 16) * 2 * Math.PI, ((i + 1) / 16) * 2 * Math.PI], [r0, r1, cy] = [0.1, 0.13, 1.66];
  return [[r0 * Math.cos(a0), cy + r0 * Math.sin(a0)], [r1 * Math.cos(a0), cy + r1 * Math.sin(a0)], [r1 * Math.cos(a1), cy + r1 * Math.sin(a1)], [r0 * Math.cos(a1), cy + r0 * Math.sin(a1)]];
});

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.56, 0.72])].sort((a, b) => a - b);

/** The cab face of the power car and of the driving trailer. */
export const CR200J_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 3.0, first: 11.0, roofFrom: 9, cols: [4, 3, 1, 1], tolerance: 0.06, wrap: true,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH, bulge: BULGE, rows: ROWS,
  lodBands: [[0, 0.56, "plough"], [0.56, 1.2, "body"], [1.2, 2.56, "chin"], [2.56, 9, "mask"]],
  lod: {
    profile: [[0.35, 0.32], [0.55, 0.1], [0.9, 0], [1.2, 0.3], [1.69, 0.74], [2.56, 1.64], [3.48, 2.7], [4.02, 3.71], [4.19, 4.2], [FACE_TOP, JOIN]],
    corner: [[0.35, 0.75], [1.2, 0.7], [2.0, 0.6], [3.26, 0.7], [4.12, 0.8], [FACE_TOP, 0.7]],
    rows: [0.35, 0.55, 0.9, 1.2, 1.69, 2.56, 3.48, 4.02, 4.19, FACE_TOP],
    cornerDepth: [[0.35, 1.0], [1.2, 1.0], [2.0, 0.6], [3.26, 0.8], [4.02, 0.4], [4.19, 0.2], [FACE_TOP, 0.05]],
    bulge: BULGE,
  },
  lodGlass: { hw: 1.0, y: [2.62, 3.5] },
  paint: [
    // the eyes, the windscreen's frame and the canopy, dark; the chin below the windscreen
    { mat: "mask", front: [[1.5, -9], [3.75, -9]], back: MASK_BACK.filter(([y]) => y <= 3.8) },
    { mat: "mask", front: [[3.75, -9], [4.4, -9]], back: MASK_BACK.filter(([y]) => y >= 3.6), top: 9, lat: 1.15 },
    { mat: "chin", front: [[1.2, -9], [1.5, -9]], back: [[1.2, 2.0], [1.5, 2.0]], lat: 1.05 },
  ],
  fields: [
    { mat: "chin", pts: CHIN },
    { mat: "body", pts: STRIPE }, { mat: "body", pts: mirror(STRIPE) },
  ],
  decals: [
    ...EMBLEM.map((pts) => ({ mat: "emblem", pts, fine: 1 })),
    // the bumper's two halves (the coupler cover) meeting down its middle
    { mat: "seam", pts: [[-0.008, 0.58], [0.008, 0.58], [0.008, 1.18], [-0.008, 1.18]], fine: 2 },
  ],
  // the windscreen: one wide pane, rounded, in the dark frame
  panes: [{ lat: [-1.0, 1.0], y: [2.62, 3.5], r: 0.3, mat: "screen" }],
  // the lamps in the eyes: the head lamp and the red tail lamp above it, toward the corner
  lamps: [[1.27, 2.03, 0.11, "lampHead"], [-1.27, 2.03, 0.11, "lampHead"], [1.37, 2.3, 0.065, "lampRed"], [-1.37, 2.3, 0.065, "lampRed"]],
  roofLamp: [0, 3.88, 0.07],
  wipers: [[[0.15, 2.62], [0.75, 3.05]], [[-0.75, 2.62], [-0.15, 3.05]]],
};

// ---------------------------------------------------------------------------
// Liveries

const GREEN = "#3fae4b";
const DARK = "#3a3f44";
const YELLOW = "#f2c014";
const WHITE = "#f6f7f6";
const DEEP_GREEN = "#0f6b3a";
const RED = "#c4161c";

/** The side's bands (every car): the yellow (green livery) or red (white) line, the dark window band from 1.66 m to 2.92 m. */
const LINE: readonly [number, number] = [1.36, 1.54];
const RED_LINE: readonly [number, number] = [1.46, 1.56];
const PANEL: readonly [number, number] = [1.66, 2.92];

/** The cab side window's frame, a slanted band from a point 3.9 m behind the tip back to the join's rear, and its front pane. */
const FRAME_FRONT: Pt[] = [[1.97, 3.92], [3.48, 5.8], [3.56, 6.8]];
const FRAME_BACK: Pt[] = [[1.97, 3.92], [3.0, 6.8], [3.56, 6.85]];
const PANE_FRONT: Pt[] = [[2.42, 4.68], [2.95, 4.98]];
const PANE_BACK: Pt[] = [[2.42, 5.05], [2.6, 5.45], [2.95, 5.5]];

/** The panel's slanted front, parallel to the chevron's upper leg: the body's paint carried over the band ahead of it. */
const PANEL_FRONT: Pt[] = [[PANEL[0], 6.05], [PANEL[1], 9.0]];

/** The palette both liveries share: lamps, glass, the plough, the seams. */
const common = (lettering: string): ShinkansenLivery["palette"] => ({
  plough: c("#26292c", 0.6), skirtG: c("#55595c", 0.7), seam: c("#1c1e20", 0.5), emblem: c("#e8762d", 0.4), screen: c("#5f7584", 0.08),
  cabMask: c("#1d1f22", 0.3), lettering: c(lettering, 0.4), crWhite: c("#f4f4f2", 0.4), under: c("#2a2c2f", 0.85),
});

/**
 * The "Green Giant": bright green, the dark window band with a yellow line under it on every car;
 * on the cab ends the yellow chevron - the line running forward to a point under the cab window, its
 * upper leg rising back to the band's top - and the band's slanted front behind it; the nose's
 * dark mask round the windscreen and the eyes, the green bumper and the stripes beside the chin.
 */
function greenLivery(roof: string, number: string, roofMat = "roofG"): ShinkansenLivery {
  return {
    title: "Green Giant", number,
    palette: { ...common(YELLOW), body: c(GREEN), dark: c(DARK, 0.35), yellow: c(YELLOW), mask: c(DARK, 0.3), chin: c(DARK, 0.3), frame: c(DARK, 0.3), [roofMat]: c(roof, 0.55) },
    bands: [[0, LINE[0], "body"], [LINE[0], LINE[1], "yellow"], [LINE[1], PANEL[0], "body"], [PANEL[0], PANEL[1], "dark"], [PANEL[1], 9, "body"]],
    front: [[0, 0.56, "plough"], [0.56, 9, "body"]],
    roof: roofMat, skirt: "skirtG",
    endSweeps: [
      // the body's green over the band ahead of its slanted front, and the band's dark on the cab's sides behind it
      { mat: "body", front: [[LINE[1], JOIN - 0.05], [2.95, JOIN - 0.05]], back: [[LINE[1], 6.05], [2.95, 9.05]] },
      { mat: "dark", front: PANEL_FRONT, back: [[PANEL[0], 7.6], [PANEL[1], 9.1]] },
      // the yellow chevron: the line running forward and down to its point, the upper leg rising back from it
      { mat: "yellow", front: [[1.12, 4.05], [LINE[1], 5.07]], back: [[1.12, 4.05], [LINE[0], 6.0], [LINE[0] + 0.005, 7.6], [LINE[1], 7.6]] },
      { mat: "yellow", front: [[LINE[1], 5.07], [2.82, 8.2], [2.84, 8.25]], back: [[LINE[1], 5.75], [2.84, 8.6]] },
      // the cab side window: its slanted dark frame and the front pane (the rear pane is the car's window)
      { mat: "frame", front: FRAME_FRONT, back: FRAME_BACK },
      { mat: "screen", front: PANE_FRONT, back: PANE_BACK },
    ],
    endLettering: [{ text: "CR", d: 12.0, y: 2.05, h: 0.24, mat: "crWhite" }],
  };
}

/**
 * The white sets (FXD3-J0271's): white, a deep green window band with a red line under it and a
 * green line low along every car; on the cab ends the green carried round the cab window and the
 * two red waves rising toward it, the green line sweeping up the nose's lower flanks; the nose's
 * deep green chin and grey mask, the white bumper with a green line under it.
 */
function whiteLivery(roof: string, number: string, roofMat = "roofG"): ShinkansenLivery {
  return {
    title: "White and red", number,
    palette: { ...common("#2a2c30"), body: c(WHITE), dark: c(DEEP_GREEN, 0.35), green: c(DEEP_GREEN, 0.35), red: c(RED), mask: c("#33383c", 0.3), chin: c(DEEP_GREEN, 0.3), frame: c(DEEP_GREEN, 0.35), [roofMat]: c(roof, 0.55) },
    bands: [[0, 0.78, "green"], [0.78, RED_LINE[0], "body"], [RED_LINE[0], RED_LINE[1], "red"], [RED_LINE[1], PANEL[0], "body"], [PANEL[0], PANEL[1], "dark"], [PANEL[1], 9, "body"]],
    front: [[0, 0.72, "green"], [0.72, 9, "body"]],
    roof: roofMat, skirt: "skirtG",
    endSweeps: [
      { mat: "body", front: [[RED_LINE[1], JOIN - 0.05], [2.95, JOIN - 0.05]], back: [[RED_LINE[1], 6.05], [2.95, 9.05]] },
      { mat: "dark", front: PANEL_FRONT, back: [[PANEL[0], 7.6], [PANEL[1], 9.1]] },
      // the green line swelling up the nose's lower flanks
      { mat: "green", front: [[0.62, 2.6], [1.08, 2.6]], back: [[0.62, 9.0], [0.78, 9.0], [0.95, 6.6], [1.08, 4.6]] },
      // the red line carried forward to the cab, and its two waves rising toward the window
      { mat: "red", front: [[RED_LINE[0], 8.6], [2.0, 6.3], [2.35, 4.5]], back: [[RED_LINE[0], 8.95], [2.0, 6.6], [2.35, 4.6]] },
      { mat: "red", front: [[RED_LINE[0], 7.9], [1.9, 6.4], [2.15, 5.4]], back: [[RED_LINE[0], 8.25], [1.9, 6.7], [2.15, 5.5]] },
      { mat: "frame", front: FRAME_FRONT, back: FRAME_BACK },
      { mat: "screen", front: PANE_FRONT, back: PANE_BACK },
    ],
    endLettering: [{ text: "CR", d: 12.0, y: 2.05, h: 0.24, mat: "crWhite" }],
  };
}

// ---------------------------------------------------------------------------
// Fittings

/** The dark canopy's tail on the crown just behind the join, narrowing to its rear point. */
function canopyTail(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  for (const sd of [1, -1]) shapedCrownPane(m, b, X, sd, "mask", [0, 0.45], () => 0, (d) => Math.max(0.02, 0.85 * (1 - d / 0.5)), 0.004);
}

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

/** Louvres on both roof edges over a d span: a dark panel on the roof's arc and the slats across it in the roof's paint. */
function louvres(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d0: number, d1: number, z: readonly [number, number], slats: number, mat: string): void {
  for (const sd of [1, -1]) {
    crownPane(m, b, X, sd, "cabMask", [d0, d1], [z[0], z[1]], 0.004);
    const w = (d1 - d0) / slats;
    for (let i = 0; i < slats; i++) crownPane(m, b, X, sd, mat, [d0 + i * w + w * 0.55, d0 + (i + 1) * w], [z[0] - 0.01, z[1] + 0.01], 0.008);
  }
}

/** The power car's roof: the folded front pantograph on its insulators, the roof equipment, the louvres, the canopy's tail; its machine room's underframe. */
function powerFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = POWER.C;
  m.scope("canopy", () => canopyTail(m, b, X));
  // the front pantograph, folded: 7.6 m behind the tip, its base on tall insulators
  m.scope("front pantograph", () => {
    const x = X(7.6 - JOIN);
    block(m, "roofP", x - 1.0, x + 1.0, C - 0.06, C + 0.05, -0.8, 0.8);
    singleArm(m, { xc: x, roofY: C + 0.05, baseY: C + 0.42, h: 1, raised: false });
  });
  // the main breaker and the roof line between the pantographs
  m.scope("roof equipment", () => {
    block(m, "roofP", X(12.4 - JOIN), X(10.6 - JOIN), C - 0.06, C + 0.05, -0.75, 0.75);
    block(m, "pantograph", X(12.2 - JOIN), X(10.8 - JOIN), C + 0.05, C + 0.38, -0.32, 0.32);
    block(m, "pantograph", X(15.0 - JOIN), X(8.4 - JOIN), C + 0.42, C + 0.46, 0.18, 0.22);
  });
  m.scope("louvres", () => {
    louvres(m, b, X, 7.05 - JOIN, 9.9 - JOIN, [0.9, 1.4], 8, "roofP");
    louvres(m, b, X, 15.4 - JOIN, 18.5 - JOIN, [0.9, 1.4], 9, "roofP");
  });
  // the transformer and the tanks between the bogies, under the skirt
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.0), X(car.trucks[0]! + 2.0), POWER.B - 0.2, POWER.B + 0.05, -POWER.W * 0.8, POWER.W * 0.8));
}

/** The coaches' and the driving trailer's fittings: the air-conditioning unit over one end, the canopy's tail on the driving trailer, the underframe. */
function trailerFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = CR200J.C, L = car.length;
  if (car.end) m.scope("canopy", () => canopyTail(m, b, X));
  m.scope("air conditioning", () => roofUnit(m, X(L - 0.6), X(L - 3.6), C, 0.9, 0.22, "roofG"));
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), CR200J.B - 0.15, CR200J.B + 0.05, -CR200J.W * 0.8, CR200J.W * 0.8));
}

// ---------------------------------------------------------------------------
// The cars

/** The power car's body behind the join: 20.0 m over the couplers less the face, the tip's reach and half the gap. */
const POWER_LENGTH = 20.0;
const POWER_BODY = POWER_LENGTH - 0.25 - JOIN - 0.07;
/** The driving trailer: 27.955 m over the couplers (published); a coach 25.5 m. */
const DT_LENGTH = 27.955;
const DT_BODY = DT_LENGTH - 0.25 - JOIN - 0.07;
const COACH_LENGTH = 25.5;
const COACH_BODY = COACH_LENGTH - 0.5;

/** A row of n windows, `w` wide and `pitch` apart, the first from d0. */
const windowRow = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

/**
 * The power car (FXD1-J / FXD3-J): 20.0 m over the couplers, its roof at 4.33 m, 3.105 m wide;
 * the cab's two side panes in their slanted frame (the rear one the car's only window), one crew
 * door 9.2 m behind the tip, plain machine-room sides; Bo-Bo bogies 7.9 m apart on 1.25 m wheels,
 * 2.8 m wheelbase; the rear pantograph raised 15.8 m behind the tip, the front one folded (fittings).
 */
export const POWER: ShinkansenSeries = {
  endLength: POWER_LENGTH, midLength: COACH_LENGTH, W: 1.55, Y: 0.7, S: 3.7, C: 4.33, lean: 0.96, B: 0.35, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CR200J_FACE,
  endCrown: [[0, FACE_TOP], [0.8, 4.315], [1.5, 4.33]], endCrownStep: 0.75,
  windows: [[2.88, 3.38]], windowW: 0.8, pitch: 1.7, door: [0.95, 3.25, 2.45, 3.0], doorW: 0.85, doorGlassW: 0.22,
  endSides: { windows: [[5.78 - JOIN, 6.55 - JOIN]], doors: [[9.2 - JOIN, 10.05 - JOIN]] },
  endBogies: [8.28 - JOIN, 16.2 - JOIN], bogieCentres: 7.92, wheelR: 0.625, wheelbase: 2.8,
  endPantograph: "lead", pantographD: 15.8,
  numberAt: [10.4 - JOIN - POWER_BODY / 2, 1.0, 0.13],
  fittings: powerFittings,
  liveries: { green: greenLivery(GREEN, "FXD1-J0010", "roofP"), whiteRed: whiteLivery("#d6dad8", "FXD3-J0271", "roofP") },
  weight: { end: 84, middle: 45 }, power: 5600, maxspeed: 160,
};

/**
 * The coaches and the driving trailer (the series the design builds): 25.5 m coaches with a door
 * at each end and 1.05 m windows 1.72 m apart in the dark band, the roof at 4.43 m, light grey over
 * the shoulder; the driving trailer 27.955 m with the power car's nose, the chevron's blank panel,
 * a door 11.0 m behind the tip, seven windows 1.7 m apart, a small one and the rear door.
 */
export const CR200J: ShinkansenSeries = {
  endLength: DT_LENGTH, midLength: COACH_LENGTH, W: 1.55, Y: 0.7, S: 3.9, C: 4.43, lean: 0.96, B: 0.35, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CR200J_FACE,
  endCrown: [[0, FACE_TOP], [0.8, 4.36], [1.6, 4.41], [2.4, 4.43]], endCrownStep: 0.8,
  windows: [[1.86, 2.66]], windowW: 1.05, pitch: 1.72, door: [1.0, 3.05, 1.9, 2.75], doorW: 0.85, doorGlassW: 0.3, doorGlassR: 0.14,
  layout: {
    end: {
      doors: [[11.0 - JOIN, 11.85 - JOIN, -1], [DT_BODY - 1.15, DT_BODY - 0.3, 1]],
      windows: [...windowRow(13.1 - JOIN, 7, 1.05, 1.7), [25.2 - JOIN, 25.8 - JOIN]],
    },
    middle: { doors: [[0.35, 1.2, -1], [COACH_BODY - 1.2, COACH_BODY - 0.35, 1]], windows: windowRow(2.25, 12, 1.05, 1.72) },
  },
  endBogies: [7.6 - JOIN, 24.1 - JOIN], bogieCentres: 18.0, wheelR: 0.4575, wheelbase: 2.5,
  traction: "none", cars: [4, 5, 6, 7, 8], leadCar: POWER,
  fittings: trailerFittings,
  liveries: { green: { ...greenLivery("#3c9f48", "CR200J-1009"), endLettering: [{ text: "CR", d: 8.4 - JOIN, y: 2.05, h: 0.24, mat: "crWhite" }] }, whiteRed: { ...whiteLivery("#d6dad8", "CR200J-1009"), endLettering: [{ text: "CR", d: 8.4 - JOIN, y: 2.05, h: 0.24, mat: "crWhite" }] } },
  weight: { end: 47, middle: 45 }, power: 0, maxspeed: 160,
};

// ---------------------------------------------------------------------------
// The design

/** The train lengths: the power car, one coach and the driving trailer up to eight cars (four the default). */
export const CR200J_CARS: readonly number[] = [3, 4, 5, 6, 7, 8];

/** The cars: the power car (the default, the train's locomotive), a coach, the driving trailer, the train. */
export const CR200J_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { endCar: "Power car", middleCar: "Coach", drivingTrailer: "Driving trailer", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(CR200J_CARS.map((n) => [String(n), `${n} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
  enumParam("livery", "Livery", { green: "Green Giant", whiteRed: "White and red" }),
];

/** Which series builds a selection, and the values its own build reads. */
function pick(v?: ParamValues): { s: ShinkansenSeries; values: ParamValues } {
  const p = resolveParams(CR200J_PARAMS, v);
  if (p.unit === "endCar") return { s: POWER, values: { ...p, unit: "endCar" } };
  return { s: CR200J, values: { ...p, unit: p.unit === "drivingTrailer" ? "endCar" : p.unit! } };
}

export function cr200j(v?: ParamValues): MeshBuilder {
  const { s, values } = pick(v);
  return buildSeries(s, CR200J_PARAMS, values);
}
export function cr200jLod(v?: ParamValues): MeshBuilder {
  const { s, values } = pick(v);
  return buildSeriesLod(s, CR200J_PARAMS, values);
}

/** The game's figures: the power car 84 t and 5,600 kW, a coach 45 t, the driving trailer 47 t; a train adds them up. */
function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of ["green", "whiteRed"]) {
    const base: ParamValues = livery === "green" ? {} : { livery };
    variants.push({ params: { ...base, unit: "middleCar" }, weight: CR200J.weight.middle, power: 0 });
    variants.push({ params: { ...base, unit: "drivingTrailer" }, weight: CR200J.weight.end, power: 0 });
    for (const n of CR200J_CARS)
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: POWER.weight.end + (n - 2) * CR200J.weight.middle + CR200J.weight.end, power: POWER.power });
  }
  return { weight: POWER.weight.end, power: POWER.power, maxspeed: 160, accel: null, variants };
}

export const CR200J_DESIGN = (build: (v?: ParamValues) => MeshBuilder, lod: (v?: ParamValues) => MeshBuilder): ProceduralDesign => ({
  ...seriesDesign("proc-vehicle-cr-cr200j", "Fuxing CR200J", POWER, CR200J_PARAMS, build, lod, "cr-cr200j", "us"),
  game: game(),
});
