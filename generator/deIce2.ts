// The ICE 2 (DB class 402 power car, 805 - 807 intermediate cars, 808 driving trailer; Siemens, AEG,
// Adtranz, Duewag and LHB 1996): a half train of one power car, six coaches and a driving trailer.
// The power car and the coaches are the ICE 1's (ice1.ts) in the ICE 2's paint (`ice2`: the single
// traffic-red stripe without the pink line, raised under the coaches' windows and sweeping down to the
// power car's nose, the 402's split coupler flap and guide horn). The driving trailer (Steuerwagen 808)
// is its own car on the series kit (shinkansen.ts) with a cab face (seriesCab.ts) matched to the
// photographs in assets/db-ice2/ (SOURCES.md): the 402's face - the wide two-pane windscreen with its
// wipers parked at the foot, the lamp over it, the paired head and tail lamps with the slatted grille
// between them, the bulging split coupler flap with the stripe across it - on a 26.4 m coach body with
// the raked cab side window, the "ICE" lettering, one door and the saloon's window band; no pantograph.
// Registered in deUnits.ts. See docs/models/germany-trains.md.
//
// Heights over the rail, d behind the tip (the coupler flap's front, 0.88 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { ice1, ice1Lod, ICE2_STRIPE } from "./ice1.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { buildSeries, buildSeriesLod, seriesParams } from "./shinkansen.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";

/** The ICE 1's white and the ICE 2's traffic red (ice1.ts). */
const ICE_WHITE = "#f4f4f2";
const TRAFFIC_RED = "#ec0016";

/** Where the face meets the body: the roof reaches the full 3.84 m there. */
const JOIN = 4.4;

/**
 * The centre line (head-on photograph at Radbruch, about 130 px/m; the oblique ones for the rake): the
 * coupler flap bulging from 0.3 m to its top at 1.57 m, its front 0.88 m up; the face above it set back
 * 0.4 m and leaning back past the lamps (1.62 - 1.82 m) to the windscreen's foot at 2.56 m, 1.0 m behind
 * the tip; the windscreen raked about 38 degrees to its head at 3.34 m, 2.0 m back; the roof rounding
 * over to the full 3.84 m at the join.
 */
const PROFILE: Pt[] = [
  [0.3, 0.42], [0.4, 0.2], [0.5, 0.1], [0.62, 0.04], [0.75, 0.01], [0.88, 0], [1.0, 0.005], [1.12, 0.025], [1.25, 0.06], [1.38, 0.12],
  [1.48, 0.2], [1.55, 0.3], [1.58, 0.42], [1.65, 0.48], [1.8, 0.55], [2.0, 0.63], [2.2, 0.73], [2.4, 0.85], [2.56, 0.98], [2.8, 1.29],
  [3.05, 1.61], [3.34, 1.98], [3.5, 2.35], [3.62, 2.75], [3.72, 3.25], [3.79, 3.8], [3.84, JOIN],
];
/** The plan's corners: the flap's broad rounded bulge, the face rolling into the sides in deep corners under the roof's curve. */
const CORNER: Pt[] = [[0.3, 0.6], [0.88, 0.75], [1.25, 0.8], [1.55, 0.85], [1.6, 0.9], [2.0, 0.9], [2.56, 0.75], [3.34, 0.6], [3.62, 0.45], [3.84, 0.3]];
const DEPTH_TABLE: Pt[] = [[0.3, 1.0], [0.88, 1.3], [1.55, 1.5], [1.6, 1.6], [2.56, 1.9], [3.34, 1.5], [3.62, 1.0], [3.84, 0.05]];
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

/** The stripe across the coupler flap (1.01 - 1.22 m) and its sweep up the flanks to the side's stripe 3.75 m behind the tip. */
const STRIPE_TOP: Pt[] = [[1.22, 1.15], [1.3, 1.6], [1.45, 2.2], [1.62, 2.8], [1.78, 3.3], [ICE2_STRIPE[1], 3.6]];
const STRIPE_FOOT: Pt[] = [[1.01, 1.35], [1.1, 1.8], [1.25, 2.4], [1.42, 3.0], [1.58, 3.55], [ICE2_STRIPE[0], 3.75], [ICE2_STRIPE[1], 3.9]];

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** A thin line along a polyline ([lat, y]), one quad a segment. */
const line = (pts: readonly Pt[], w: number): Pt[][] =>
  pts.slice(1).map((b, i) => {
    const a = pts[i]!;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / l) * w / 2, (dx / l) * w / 2];
    return [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  });

/** A head lamp housing (viewer's right): a rounded box, its outer lower corner cut. */
const HOUSING: Pt[] = [[0.62, 1.62], [1.07, 1.62], [1.14, 1.67], [1.14, 1.8], [1.12, 1.82], [0.62, 1.82], [0.6, 1.8], [0.6, 1.64]];
/** The grille between the housings: three rows of slats, a long middle group and a short one either side. */
const SLATS: Pt[][] = [1.645, 1.695, 1.745].flatMap((y) => [box(-0.3, 0.3, y, y + 0.028), box(0.37, 0.53, y, y + 0.028), box(-0.53, -0.37, y, y + 0.028)]);
/** The coupler flap's outline: its top edge across the face, rounding down its shoulders (right half). */
const FLAP_EDGE: Pt[] = [[0, 1.565], [0.95, 1.565], [1.15, 1.53], [1.28, 1.45], [1.36, 1.32]];
/** The face panel's seam, from the windscreen's lower corners down round the face's shoulders (right half). */
const PANEL_SEAM: Pt[] = [[1.2, 2.5], [1.3, 2.36], [1.37, 2.18], [1.41, 2.0], [1.42, 1.88]];

const ICE2_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 3.6, first: 5.15, roofFrom: 9, cols: [6, 4, 1, 1], tolerance: 0.03, wrap: true,
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH,
  rows: [...new Set([...PROFILE.map(([y]) => y), 1.01, 1.22, 1.62, 1.82, 1.86, 2.3, 2.5, 2.6, 3.3])].sort((a, b) => a - b),
  // the face is white; the stripe is the livery's sweep, the rest painted below
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, 1.01, "white"], [1.01, 1.22, "red"], [1.22, 2.56, "white"], [2.56, 3.34, "cabMask"], [3.34, 9, "white"]],
  lod: {
    profile: [[0.3, 0.42], [0.5, 0.1], [0.88, 0], [1.25, 0.06], [1.55, 0.3], [1.6, 0.45], [2.56, 0.98], [3.34, 1.98], [3.62, 2.75], [3.84, JOIN]],
    corner: [[0.3, 0.6], [1.55, 0.85], [2.56, 0.9], [3.34, 0.7], [3.84, 0.3]],
    rows: [0.3, 0.5, 0.88, 1.25, 1.55, 1.6, 2.0, 2.56, 3.0, 3.34, 3.62, 3.84],
    cornerDepth: [[0.3, 1.0], [0.88, 1.3], [1.55, 1.5], [1.6, 1.6], [2.56, 1.9], [3.34, 1.5], [3.62, 1.0], [3.84, 0.05]],
  },
  lodGlass: { hw: 1.22, y: [2.56, 3.34] },
  // the windscreen: a black frame, two panes either side of the centre pillar
  masks: [{ lat: [-1.27, 1.27], y: [2.53, 3.37], r: 0.08, mat: "cabMask" }],
  panes: [{ lat: [-1.22, -0.035], y: [2.58, 3.32], r: 0.05, mat: "screen" }, { lat: [0.035, 1.22], y: [2.58, 3.32], r: 0.05, mat: "screen" }],
  fields: [
    // the head lamp housings and the upper lamp's under the windscreen
    { mat: "lampG", pts: HOUSING }, { mat: "lampG", pts: mirror(HOUSING) },
    { mat: "lampG", pts: [[-0.1, 2.31], [0.1, 2.31], [0.15, 2.5], [-0.15, 2.5]] },
  ],
  decals: [
    ...SLATS.map((pts) => ({ mat: "cabMask", pts, fine: 1 })),
    // the flap's two halves meeting down its middle, its outline, and the face panel's seam
    { mat: "rubber", pts: box(-0.008, 0.008, 0.33, 1.56), fine: 1 },
    ...[...line(FLAP_EDGE, 0.016), ...line(mirror(FLAP_EDGE), 0.016), ...line(PANEL_SEAM, 0.012), ...line(mirror(PANEL_SEAM), 0.012)].map((pts) => ({ mat: "rubber", pts, fine: 1 })),
  ],
  lamps: [
    [0.98, 1.72, 0.08, "lampHead"], [0.75, 1.72, 0.07, "lampRed"],
    [-0.98, 1.72, 0.08, "lampHead"], [-0.75, 1.72, 0.07, "lampRed"],
    [0, 2.41, 0.06, "lampHead"],
  ],
  // the Scharfenberg coupler's guide horn under the flap, right of its split
  pods: [{ lat: 0.12, y: 0.68, w: 0.2, h: 0.06, r: 0.03, proud: 0.14, depth: 0.05, mat: "greifer" }],
  // the wipers parked at the screen's foot, rising to the centre pillar
  wipers: [[[0.82, 2.62], [0.23, 3.1]], [[-0.82, 2.62], [-0.23, 3.1]]],
};

/** The livery: white, the stripe under the windows, across the coupler flap and sweeping up to the side; the cab side window; the grey "ICE". */
function ice2Livery(title: string, number: string): ShinkansenLivery {
  const [s0, s1] = ICE2_STRIPE;
  return {
    title, number,
    palette: {
      white: c(ICE_WHITE), red: c(TRAFFIC_RED), iceGrey: c("#c4c8cb", 0.45), roofG: c("#d9dbdc", 0.55), skirtG: c("#c0c0c0", 0.6),
      cabMask: c("#1c1e21", 0.3), band: c("#5a5a5a", 0.5), lampG: c("#8d9399", 0.3), screen: c("#3a4651", 0.08), greifer: c("#3a3c3f", 0.5),
    },
    bands: [[0, s0, "white"], [s0, s1, "red"], [s1, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // across the flap and up its flanks, then the side's stripe on to the body's
      { mat: "red", face: true, front: [[1.01, -9], [1.22, -9], ...STRIPE_TOP.map(([y, d]): Pt => [y + 1e-4, d])], back: STRIPE_FOOT },
      { mat: "red", face: true, front: [[s0, 3.7], [s1, 3.55]], back: [[s0, JOIN + 0.05], [s1, JOIN + 0.05]] },
      // the cab side window: its front edge raked with the windscreen, upright behind, in a black rubber
      { mat: "rubber", face: true, front: [[2.52, 2.7], [3.27, 3.28]], back: [[2.52, 3.49], [3.27, 3.49]] },
      { mat: "cabGlass", face: true, front: [[2.56, 2.79], [3.23, 3.33]], back: [[2.56, 3.45], [3.23, 3.45]] },
    ],
    endLettering: [{ text: "ICE", d: 4.5 - JOIN, y: 2.1, h: 0.78, mat: "iceGrey" }],
  };
}

/** The door behind the cab and the saloon's nine windows, 1.5 m panes 2.1 m apart (the ICE 1's coach), in a dark band. */
const DOOR: readonly [number, number] = [5.15 - JOIN, 6.05 - JOIN];
const PANES: Array<readonly [number, number]> = Array.from({ length: 9 }, (_, k) => [6.6 - JOIN + k * 2.1, 8.1 - JOIN + k * 2.1] as const);
const BAND: readonly [number, number] = [PANES[0]![0] - 0.25, PANES[PANES.length - 1]![1] + 0.25];
/** A coach's two doors and windows, for the kit's intermediate car (unused by the design). */
const MID_PANES: Array<readonly [number, number]> = Array.from({ length: 11 }, (_, k) => [2.0 + k * 2.1, 3.5 + k * 2.1] as const);

function ice2Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number }): void {
  const spans: Array<readonly [number, number]> = car.end ? [BAND] : [[MID_PANES[0]![0] - 0.25, MID_PANES[MID_PANES.length - 1]![1] + 0.25]];
  m.scope("window band", () => { for (const sd of [1, -1]) for (const [d0, d1] of spans) sidePanel(m, b, X, sd, "band", d0, d1, 2.1, 3.0, 0.003, 0.003); });
}

/** The ICE 2's driving trailer (class 808). */
export const ICE2_DT: ShinkansenSeries = {
  // 26.4 m over the couplers (the half train's published 205.36 m less the 20.56 m power car and six
  // 26.4 m coaches), 3.02 m wide and 3.84 m high like the coaches, their section (ice1.ts)
  endLength: 26.4, midLength: 26.4, W: 1.51, Y: 0.9, S: 3.3, C: 3.84, lean: 1.0, B: 0.3, A: 0.55,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICE2_FACE,
  windows: [[2.2, 2.9]], windowW: 1.5, pitch: 2.1, door: [0.9, 3.25, 2.0, 3.0], doorW: 0.9, doorGlassW: 0.22, doorGlassR: 0.11,
  layout: {
    end: { doors: [[DOOR[0], DOOR[1], -1]], windows: PANES },
    middle: { doors: [[0.4, 1.3, -1], [24.7, 25.6, 1]], windows: MID_PANES },
  },
  // the coaches' bogies: 19.0 m apart, 2.5 m wheelbase, 920 mm wheels; the leading one under the cab
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, endBogies: [3.9 - JOIN, 22.9 - JOIN],
  fittings: ice2Fittings,
  liveries: { dbIce: ice2Livery("DB ICE", "808 001") },
  weight: { end: 50, middle: 50 }, power: 0, maxspeed: 280,
};

export const ICE2_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { powerCar: "Power car", coach: "Coach", drivingTrailer: "Driving trailer" })];
const DT_PARAMS = seriesParams(ICE2_DT);

export function dbIce2(v?: ParamValues): MeshBuilder {
  const u = resolveParams(ICE2_PARAMS, v).unit;
  return u === "drivingTrailer" ? buildSeries(ICE2_DT, DT_PARAMS, { unit: "endCar" }) : ice1({ unit: u! }, { ice2: true });
}
export function dbIce2Lod(v?: ParamValues): MeshBuilder {
  const u = resolveParams(ICE2_PARAMS, v).unit;
  return u === "drivingTrailer" ? buildSeriesLod(ICE2_DT, DT_PARAMS, { unit: "endCar" }) : ice1Lod({ unit: u! }, { ice2: true });
}

export const ICE2_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-db-ice2", title: "ICE 2", build: dbIce2, buildLod: dbIce2Lod, params: ICE2_PARAMS, catalog: EMU_CATALOG, references: "db-ice2",
  game: { weight: 78, power: 4800, maxspeed: 280, accel: null, variants: [{ params: { unit: "coach" }, weight: 53, power: 0 }, { params: { unit: "drivingTrailer" }, weight: 50, power: 0 }] },
};
