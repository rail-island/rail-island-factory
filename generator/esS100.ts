// The AVE S-100 (Renfe class 100, GEC-Alsthom 1992, the TGV Atlantique's Spanish sister) on the
// series kit (shinkansen.ts) with its own cab face (seriesCab.ts): two power cars with the TGV's
// round-wedge nose - the big white bumper with its centre seam over the graphite plough, the dark
// lamp slot across the face with the perforated grille between the lamps, the long bonnet up to the
// slatted visor, the two-pane windscreen in the graphite canopy and the roof lamp over it - their
// locomotive sides (the nose hatch, the cab door with its oval window, the machine-room door, the
// long grey machine-room panel), the raised roof with its louvres and the raised single-arm
// pantograph at the rear; between them the low trailers on Jacobs bogies, the end trailers on their
// own bogie beside the power car with the vestibule's two doors there. Matched to the photographs in
// assets/renfe-s100/ (SOURCES.md). See docs/models/spain-trains.md.
//
// Published figures (Renfe, Wikipedia): 200.15 m over couplers, power cars 22.13 m and 2.814 m
// wide, end trailers 21.845 m, intermediate trailers 18.70 m and 2.904 m wide, power car 4.10 m
// high (the trailers 3.42 m), bogies 3.0 m wheelbase with 920 mm wheels, the power car's 14.0 m
// apart; 392.6 t empty, 8,800 kW under 25 kV (5,400 kW under 3 kV), 300 km/h, 329 seats in 8
// trailers (M-8R-M).
//
// Scales measured: photo-j29-336 (100 210, 3/4 at the nose): 83 px/m at the face in the original
// (249 px/m in the 3x crop; rail to the canopy top 4.1 m) - bumper 0.45 .. 1.55 m, lamp slot
// 1.65 .. 1.95, visor 2.72 .. 2.88, windscreen 2.9 .. 3.43; on the trailer behind (61 px/m,
// 184 px/m in the 4x crop): purple band 1.12 .. 1.27, grey line to 1.32, windows 1.8 .. 2.53.
// photo-ave-s100-001 (Puertollano 2019, near side-on): about 60 px/m at the nose (176 px/m in
// the 3x crop) - visor 2.4 m and the windscreen's head 3.6 m behind the tip, the nose hatch 3.3 ..
// 4.1 m. photo-ave-s-100-venta-de-alhama (side, 18 px/m on the trailers in the 3x crop): window
// pitch about 1.95 m. The rest follows tgv.ts (the TGV Atlantique's vlakosimdb maps): the raised
// machine-room roof 6.2 .. 18.5 m, the pantograph 19.5 m behind the tip.
//
// Heights over the rail; d behind the nose's tip (the bumper's front, 1.02 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type SeriesSidePanel, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { SliceBody } from "./sliceBody.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the power car's body: the canopy's rear edge over the cab. */
const JOIN = 5.0;

/**
 * The nose's centre line: the bumper bulging forward at 1.02 m over the plough and rounding back
 * to its top at 1.56 m, the lamp slot set back above it, the bonnet rising to the visor's foot at
 * 2.72 m 2.35 m back, the upright visor, the windscreen raked back to 3.45 m 3.6 m back, and the
 * canopy rounding into the 3.9 m cab roof at the join.
 */
const PROFILE: Pt[] = [
  [0.74, 0.3], [0.82, 0.15], [0.92, 0.05], [1.02, 0], [1.18, 0], [1.32, 0.04], [1.44, 0.11], [1.52, 0.2], [1.57, 0.31],
  [1.61, 0.48], [1.65, 0.55], [1.93, 0.68], [2.05, 0.8], [2.3, 1.22], [2.5, 1.7], [2.66, 2.17], [2.72, 2.35], [2.88, 2.42],
  [2.92, 2.52], [3.2, 3.08], [3.45, 3.6], [3.62, 4.02], [3.76, 4.42], [3.86, 4.78], [3.9, JOIN],
];

/** The low bands' top edges on the face and the cab sides, [y, d]: down under the bumper at the front, up to the sides' heights by the hatch. */
const GREY_TOP: Pt[] = [[0.74, -9], [0.9, 0], [0.93, 1.0], [0.98, 2.0], [1.12, 2.8], [1.28, 3.4], [1.41, 4.0]];
const PURPLE_TOP: Pt[] = [[0.74, -9], [0.86, 0], [0.89, 1.0], [0.93, 2.0], [1.07, 2.8], [1.23, 3.4], [1.36, 4.0]];
const DARK_TOP: Pt[] = [[0.74, -9], [0.78, 0], [0.8, 1.0], [0.82, 2.0], [0.93, 2.8], [1.05, 3.4], [1.15, 4.0]];
const BEHIND: Pt[] = [[0, 99], [9, 99]];

/** The canopy's lower edge on the sides, [y, d]: from the visor's foot back under the cab side window to the join. */
const CANOPY_BACK: Pt[] = [[2.7, JOIN + 0.05], [9, JOIN + 0.05]];
/** The cab side window behind the windscreen's corner pillar: its raked front edge and upright back. */
const SIDE_WINDOW = { front: [[2.95, 3.25], [3.4, 3.78]] as Pt[], back: [[2.95, 4.45], [3.4, 4.45]] as Pt[] };

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.78, 0.86, 1.15, 1.36, 1.41, 1.78, 3.4])].sort((a, b) => a - b);

/** A thin seam along a polyline [lat, y], as decals. */
const seamLine = (pts: Pt[], t: number): Array<{ mat: string; pts: Pt[]; fine: number }> =>
  pts.slice(1).map((b, i) => {
    const a = pts[i]!;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], k = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / k) * t, (dx / k) * t];
    return { mat: "seam", pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]] as Pt[], fine: 2 };
  });
/** The bumper's top seam: across under the lamp slot and down round its corners. */
const BUMPER_TOP: Pt[] = [[-1.14, 0.84], [-1.14, 1.1], [-1.1, 1.3], [-1.0, 1.45], [-0.82, 1.54], [-0.5, 1.57], [0, 1.575], [0.5, 1.57], [0.82, 1.54], [1.0, 1.45], [1.1, 1.3], [1.14, 1.1], [1.14, 0.84]];
/** The lamp housing's outline (viewer's right), its outer end slanting out and round. */
const LAMP_SLOT = (s: number): Pt[] => {
  const pts: Pt[] = [[0.27, 1.64], [1.3, 1.64], [1.5, 1.68], [1.62, 1.76], [1.64, 1.84], [1.56, 1.92], [0.27, 1.93]];
  const q = pts.map(([l, y]): Pt => [s * l, y]);
  return s > 0 ? q : q.reverse();
};

export const S100_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 3.2, reach: 0.07, first: 5.2, roofFrom: 9, cols: [2, 4, 1, 1], tolerance: 0.08, wrap: true,
  profile: PROFILE,
  // a nose round in plan: the corner the whole half width, deep at the bumper and the long bonnet, blunter at the canopy
  corner: [[0.74, 2.0], [3.9, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => {
    const want = y < 1.6 ? 0.95 : y < 2.0 ? 0.75 : y < 2.8 ? 0.75 + (y - 2.0) * 0.5 : 1.15 - (y - 2.8) * 0.9;
    return [y, Math.max(0.05, Math.min(JOIN - d, want))];
  }),
  rows: ROWS,
  bands: () => [[0, 9, "faceBase"]],
  lodBands: [[0, 0.86, "skirtE"], [0.86, 2.72, "faceBase"], [2.72, 9, "canopy"]],
  lodGlass: { hw: 0.85, y: [2.92, 3.43] },
  paint: [
    // the low bands dipping under the bumper: grey line, purple, graphite
    { mat: "greyLine", front: GREY_TOP, back: BEHIND, top: 1.41 },
    { mat: "purple", front: PURPLE_TOP, back: BEHIND, top: 1.36 },
    { mat: "skirtE", front: DARK_TOP, back: BEHIND, top: 1.15 },
    // the graphite canopy from the visor over the cab roof back to the join, and the cab side window in it
    { mat: "canopy", front: [[2.72, -9], [9, -9]], back: CANOPY_BACK },
    { mat: "cabGlass", front: SIDE_WINDOW.front, back: SIDE_WINDOW.back, top: 3.4 },
  ],
  fields: [
    // the lamp housings either side and the grille's light frame between them
    { mat: "lampBand", pts: LAMP_SLOT(1) },
    { mat: "lampBand", pts: LAMP_SLOT(-1) },
    { mat: "grilleFrame", pts: [[-0.25, 1.64], [0.25, 1.64], [0.25, 1.93], [-0.25, 1.93]] },
    // the visor's slatted bar under the windscreen
    { mat: "visor", pts: [[-1.0, 2.72], [1.0, 2.72], [1.0, 2.88], [-1.0, 2.88]] },
  ],
  // the windscreen's two panes either side of the centre pillar
  panes: [{ lat: [-0.86, -0.07], y: [2.93, 3.42], r: 0.06 }, { lat: [0.07, 0.86], y: [2.93, 3.42], r: 0.06 }],
  decals: [
    // the grille's holes as rows of dark dots
    ...[1.69, 1.74, 1.79, 1.84, 1.89].map((y) => ({ mat: "seam", pts: [[-0.2, y - 0.012], [0.2, y - 0.012], [0.2, y + 0.012], [-0.2, y + 0.012]] as Pt[], fine: 2 })),
    // the visor's slats
    ...[-0.6, -0.2, 0.2, 0.6].map((l) => ({ mat: "seam", pts: [[l - 0.012, 2.74], [l + 0.012, 2.74], [l + 0.012, 2.86], [l - 0.012, 2.86]] as Pt[], fine: 1 })),
    // the bumper's seam over its top and round the corners, and its centre seam
    ...seamLine(BUMPER_TOP, 0.012),
    { mat: "seam", pts: [[-0.015, 0.76], [0.015, 0.76], [0.015, 1.57], [-0.015, 1.57]], fine: 6 },
    // the nose cap's seam arching over the lamp slot
    ...seamLine([[-1.22, 1.72], [-1.1, 2.0], [-0.7, 2.12], [0, 2.15], [0.7, 2.12], [1.1, 2.0], [1.22, 1.72]], 0.01),
  ],
  texts: [{ text: "renfe", lat: 0, y: 2.2, h: 0.24, mat: "noseBrand" }, { text: "AVE", lat: 0.55, y: 2.0, h: 0.11, mat: "noseLogo" }],
  lamps: [[0.88, 1.785, 0.1, "lampHead"], [0.55, 1.785, 0.065, "lampRed"], [-0.88, 1.785, 0.1, "lampHead"], [-0.55, 1.785, 0.065, "lampRed"]],
  roofLamp: [0, 3.78, 0.12],
  wipers: [[[0.3, 2.97], [0.62, 3.36]], [[-0.62, 2.97], [-0.3, 3.36]]],
  lod: {
    profile: PROFILE, corner: [[0.74, 2.0], [3.9, 2.0]], rows: [0.74, 1.02, 1.56, 1.65, 2.05, 2.5, 2.72, 2.92, 3.45, 3.76, 3.9],
    cornerDepth: [[0.74, 0.95], [1.56, 0.95], [1.65, 0.75], [2.05, 0.78], [2.72, 1.11], [2.92, 1.05], [3.45, 0.57], [3.76, 0.38], [3.9, 0.05]],
  },
};

/** An outline of thin seams on the cab sides (d behind the tip): a hatch or a door, its front edge raked by `rake` over its height. */
const outline = (d0: number, d1: number, y0: number, y1: number, rake = 0): NonNullable<ShinkansenLivery["endSweeps"]> => {
  const t = 0.02;
  return [
    { mat: "seam", front: [[y0, d0], [y1, d0 - rake]], back: [[y0, d0 + t], [y1, d0 - rake + t]] },
    { mat: "seam", front: [[y0, d1 - t], [y1, d1 - t]], back: [[y0, d1], [y1, d1]] },
    { mat: "seam", front: [[y1 - t, d0 - rake], [y1, d0 - rake]], back: [[y1 - t, d1], [y1, d1]] },
    { mat: "seam", front: [[y0, d0], [y0 + t, d0]], back: [[y0, d1], [y0 + t, d1]] },
  ];
};
/** The nose hatch behind the face (its front raked with the nose), the small hatch below the canopy, the cab door's oval window. */
const CAB_SIDE: NonNullable<ShinkansenLivery["endSweeps"]> = [
  // the lamp slot wrapping round the corner and running back along the nose's side to a point
  { mat: "lampBand", front: [[1.66, -9], [1.92, -9]], back: [[1.66, 1.55], [1.8, 1.9], [1.92, 1.75]] },
  ...outline(3.45, 4.15, 1.5, 2.6, -0.2), ...outline(4.45, 4.7, 1.55, 1.95),
];

/** The power car's sides behind the join (d behind the tip): the cab door's oval window, the machine-room door, the long grey panel. */
const POWER_SIDE: SeriesSidePanel[] = [
  { d: [5.33, 5.72], y: [2.95, 3.32], kind: "window" },
  { d: [6.55, 7.15], y: [1.45, 3.3], kind: "seam" },
  { d: [7.5, 21.3], y: [1.62, 2.8], kind: "panel", mat: "seam", screen: "panelGrey" },
];

interface S100Paint {
  base: string; skirt: string; roof: string; powerRoof: string; canopy: string; purple: string; grey: string; lampBand: string;
  /** The power car's and the trailers' side bands, bottom first. */
  power: Array<[number, number, string]>;
  trailer: Array<[number, number, string]>;
}

function s100Livery(title: string, number: string, p: S100Paint & { brand: string; logo: string; panel: string }, extra: Record<string, string>, sweeps: NonNullable<ShinkansenLivery["endSweeps"]>, lettering: NonNullable<ShinkansenLivery["endLettering"]>, more: Partial<ShinkansenLivery> = {}): ShinkansenLivery {
  return {
    title, number,
    palette: {
      faceBase: c(p.base, 0.35), skirtE: c(p.skirt, 0.65), roofE: c(p.roof, 0.55), powerRoof: c(p.powerRoof, 0.55), canopy: c(p.canopy, 0.3),
      purple: c(p.purple, 0.4), greyLine: c(p.grey, 0.45), lampBand: c(p.lampBand, 0.15), grilleFrame: c("#d9dcdf", 0.4), visor: c("#1d1f23", 0.5),
      panelGrey: c(p.panel, 0.45), noseBrand: c(p.brand, 0.4), noseLogo: c(p.logo, 0.45), louvre: c("#2a2d31", 0.7), seam: c("#3a3d42", 0.6), cabMask: c("#15181d", 0.3), lettering: c("#3a3d42", 0.5), under: c("#2a2c2f", 0.8),
      ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, c(v, 0.4)])),
    },
    bands: p.trailer, endBands: p.power, roof: "roofE", skirt: "skirtE",
    endSweeps: [...sweeps, ...CAB_SIDE],
    endLettering: lettering,
    // the distant power car keeps its machine-room panel
    lodSideFields: { end: [{ d: [7.5, 21.3], bands: [...p.power.filter(([y0]) => y0 < 1.41), [1.41, 1.62, "faceBase"], [1.62, 2.8, "panelGrey"], [2.8, 9, "faceBase"]] }] },
    ...more,
  };
}

/** Renfe's AVE scheme (from the 2000s, as photographed 2019 - 2022): white over a grey line, the purple band and the graphite skirt; graphite canopy and roof. */
const AVE: S100Paint & { brand: string; logo: string; panel: string } = {
  brand: "#6e2455", logo: "#5b6a80", panel: "#d2d5d8",
  base: "#f0f0ec", skirt: "#3a3d41", roof: "#a9adb1", powerRoof: "#6d7277", canopy: "#53585e", purple: "#6e2455", grey: "#8e9297", lampBand: "#1d2024",
  power: [[0, 1.15, "skirtE"], [1.15, 1.36, "purple"], [1.36, 1.41, "greyLine"], [1.41, 9, "faceBase"]],
  trailer: [[0, 1.12, "skirtE"], [1.12, 1.27, "purple"], [1.27, 1.32, "greyLine"], [1.32, 9, "faceBase"]],
};

/**
 * Avlo's scheme (photo-avlo-51001291620, on an S-112): the S-100 never ran as Avlo, so this is the
 * Avlo paint applied to it - the magenta body, the light blue-grey roof, orange doors, the orange
 * and turquoise swashes sweeping up the power car's side from the nose.
 */
const AVLO: S100Paint & { brand: string; logo: string; panel: string } = {
  brand: "#f6f4f6", logo: "#9b2789", panel: "#86207a",
  base: "#9b2789", skirt: "#4b1a46", roof: "#b2bccb", powerRoof: "#b2bccb", canopy: "#2b2140", purple: "#4b1a46", grey: "#7d1f6f", lampBand: "#1d1a24",
  power: [[0, 1.15, "skirtE"], [1.15, 1.36, "purple"], [1.36, 1.41, "greyLine"], [1.41, 9, "faceBase"]],
  trailer: [[0, 1.12, "skirtE"], [1.12, 1.27, "purple"], [1.27, 1.32, "greyLine"], [1.32, 9, "faceBase"]],
};
/** A swash: a band leaning back as it rises, [y0, y1] and its front edge's d at both heights, `w` wide. */
const swash = (mat: string, y0: number, y1: number, d0: number, d1: number, w: number) => ({
  mat, front: [[y0, d0], [y1, d1]] as Pt[], back: [[y0, d0 + w], [y1, d1 + w]] as Pt[], top: y1,
});

/** The trailers: the door at the front end over the joint, seven windows along the saloon (d from the body's +X end). */
const TRAILER: SeriesLayout = {
  doors: [[0.45, 1.25, 1]],
  windows: Array.from({ length: 7 }, (_, i): readonly [number, number] => [3.1 + i * 1.92, 3.1 + i * 1.92 + 1.3]),
};
/** The end trailers: the vestibule's two doors by the power car, five wider-spaced first-class windows behind it. */
const END_TRAILER: SeriesLayout = {
  doors: [[1.85, 2.65, -1], [4.9, 5.7, 1]],
  windows: Array.from({ length: 5 }, (_, i): readonly [number, number] => [7.5 + i * 2.12, 7.5 + i * 2.12 + 1.35]),
};

export const S100: ShinkansenSeries = {
  endLength: 22.15, midLength: 18.7, W: 1.43, Y: 1.3, S: 3.35, C: 3.9, lean: 0.95, B: 0.74, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S100_FACE,
  // the trailers, lower than the power cars
  trailerSection: { S: 2.95, C: 3.42 },
  windows: [[1.8, 2.53]], windowW: 1.3, pitch: 1.92, door: [1.2, 2.85, 1.95, 2.6], doorW: 0.8, doorGlassW: 0.26, windowCornerRadius: 0.1,
  layout: { end: { doors: [[0.2, 0.85, 1]], windows: [] }, middle: TRAILER },
  jacobsEndTrailerLayout: END_TRAILER,
  bogieCentres: 14.0, wheelR: 0.46, wheelbase: 3.0, minCars: 3,
  // the power cars are locomotives: bogies 14 m apart, 5.1 m and 19.1 m behind the tip (tgv.ts), the cab
  // door behind the join; the single-arm pantograph over the rear bogie raised on both power cars
  endBogies: [5.1 - JOIN, 19.1 - JOIN],
  endSides: { windows: [], doors: [[5.2 - JOIN, 5.85 - JOIN]] },
  sidePanels: { end: POWER_SIDE },
  endPantograph: true, pantographAt: 19.6 - JOIN,
  // the trailers articulated on Jacobs bogies, the end ones on their own bogie 3 m inside the end beside the power car
  jacobsTrailers: 3.0,
  fittings: s100Fittings,
  lodRoof: { d: [6.2, 18.5], hw: 0.95, y: [3.75, 4.1], mat: "powerRoof" },
  liveries: {
    ave: s100Livery("AVE", "100 001", AVE, {}, [], [
      { text: "renfe", d: 4.6 - JOIN, y: 2.45, h: 0.3, mat: "purple" },
      { text: "AVE", d: 4.75 - JOIN, y: 2.05, h: 0.16, mat: "lettering" },
    ]),
    avlo: s100Livery("Avlo", "100 017", AVLO, { orange: "#f08236", teal: "#4fc3cf", markWhite: "#f6f4f6" }, [
      // the orange and turquoise swashes from the nose's foot up the side to the cab door
      swash("teal", 1.45, 3.1, 5.05, 6.3, 0.45),
      swash("orange", 1.45, 3.2, 5.6, 6.9, 0.5),
    ], [
      { text: "avlo", d: 9.0 - JOIN, y: 2.88, h: 0.42, mat: "markWhite" },
    ], { doors: [[0, 9, "orange"]] }),
  },
  // 392.6 t empty: two 68 t power cars and eight 32 t trailers; 8,800 kW spread over the ten vehicles
  weight: { end: 68, middle: 32 }, power: 880, maxspeed: 300,
};

/** The underfloor equipment between the bogies; on a power car the plough under the nose and the raised machine-room roof with its louvres. */
function s100Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const s = S100, tr = car.trucks;
  m.scope("underfloor", () => block(m, "under", Math.min(X(tr[1]! - 2.6), X(tr[0]! + 2.6)), Math.max(X(tr[1]! - 2.6), X(tr[0]! + 2.6)), s.B - 0.3, s.B, -s.W * 0.8, s.W * 0.8));
  if (!car.end) return;
  m.scope("raised roof", () => {
    // tgv.ts: the machine room's roof raised to 4.1 m from 6.2 m to 18.5 m behind the tip, its sloping sides louvred
    const [d0, d1] = [6.2 - JOIN, 18.5 - JOIN];
    const ring = (a: number, e: number, hw: number): Array<[number, number]> => [[X(a), -hw], [X(a), hw], [X(e), hw], [X(e), -hw]];
    m.loft("powerRoof", ring(d0, d1, 1.12), s.C - 0.12, ring(d0 + 0.3, d1 - 0.05, 0.9), 4.1);
    for (const sd of [1, -1]) {
      // the louvre panels on the slope: dark, with lighter slats
      const zIn = 0.93, zOut = 1.09, y0 = s.C - 0.06, y1 = 4.06;
      for (const [a, e] of [[8.4, 12.6], [12.8, 17.8]] as const) {
        const [xa, xe] = [X(a - JOIN), X(e - JOIN)];
        m.facets("louvre", [[xa, y0 + 0.02, sd * (zOut + 0.006)], [xe, y0 + 0.02, sd * (zOut + 0.006)], [xe, y1 - 0.02, sd * (zIn + 0.006)], [xa, y1 - 0.02, sd * (zIn + 0.006)]], [0, 0.6, sd]);
        for (let k = 1; k * 0.35 < e - a - 0.1; k++) {
          const x = X(a - JOIN + k * 0.35);
          m.facets("seam", [[x - 0.03, y0 + 0.03, sd * (zOut + 0.012)], [x + 0.03, y0 + 0.03, sd * (zOut + 0.012)], [x + 0.03, y1 - 0.03, sd * (zIn + 0.012)], [x - 0.03, y1 - 0.03, sd * (zIn + 0.012)]], [0, 0.6, sd]);
        }
      }
    }
  });
  m.scope("plough", () => {
    // rings round the plough in plan (x, z), d behind the tip, its front rounded under the bumper
    const ring = (front: number, back: number, hw: number, depth: number): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 8; i++) {
        const a = -Math.PI / 2 + (Math.PI * i) / 8;
        pts.push([X(-JOIN + front + depth * (1 - Math.cos(a))), hw * Math.sin(a)]);
      }
      pts.push([X(-JOIN + back), hw], [X(-JOIN + back), -hw]);
      const area = pts.reduce((acc, p, i) => { const q = pts[(i + 1) % pts.length]!; return acc + p[0] * q[1] - q[0] * p[1]; }, 0);
      return area > 0 ? pts.reverse() : pts;
    };
    // the bumper's graphite foot, flush with its front, tucking in to the plough's edge
    m.loft("skirtE", ring(0.75, 2.6, 0.95, 0.8), 0.36, ring(0.48, 2.6, 1.08, 0.9), 0.52, false);
    m.loft("skirtE", ring(0.48, 2.6, 1.08, 0.9), 0.52, ring(0.31, 2.6, 1.17, 0.95), s.B + 0.005);
  });
}

const P = seriesParams(S100);
export function renfeS100(v?: ParamValues): MeshBuilder { return buildSeries(S100, P, v); }
export function renfeS100Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S100, P, v); }
export const S100_PARAMS = P;
