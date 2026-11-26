// The CRH1E (Bombardier Sifang (Qingdao) Transportation, 2009 - 2010): China's first 16-car sleeper EMU,
// 250 km/h, the original batch CRH1-061E ... 080E (CRH1E-1061 ... 1080 since 2012) - not the later
// CRH1E "NG" (1229 ...) with the Zefiro-style nose. Drawn on the series kit (shinkansen.ts) with the
// CRH1A's body section and side stripe (cnCrh1a.ts) and its own cab face (seriesCab.ts): the long,
// smooth "ECO" nose - one surface from the apron to the roof, the coupler hatch only a seam outline
// flush in the lower nose (no knob or lip), the long raked windscreen in a dark area framed in blue
// with "Hexie hao" under the glass, the slanted lamp clusters on the flanks, the diamond cab side
// window. The sleeper cars' continuous dark window band, one plug door at the rear end of every
// sleeper and behind the cab on the end car. See docs/models/china-units.md, "The CRH1E's body".
//
// Measured on assets/cr-crh1e/ (SOURCES.md): photo-201906-crh1e-1061-at-wuxi-station.jpg (nearly
// side-on from above, the right side: a projective fit through the tip and three joints at the
// published car lengths), photo-crh1e-hexie-emu.jpg (near head-on and the left side), photo-crh1e.jpg
// and photo-crh1e-shanghai-hongqiao-railway-station2.jpg (front three-quarter and head-on), the
// original nose beside the CRH1A's in photo-201604-two-kinds-of-crh1b-emus-at-shq.jpg.
// Published: 428.9 m for sixteen cars (end cars 28.25 m, intermediate cars 26.6 m as the CRH1A's),
// 3.328 m wide (3.27 m in the gauge), 4.04 m high; 10M6T, 11,000 kW, 250 km/h.
// Heights over the rail, d behind the nose's tip (the lower nose's front, 1.0 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { CRH1A, CRH1A_A, CRH1A_B, CRH1A_C, CRH1A_MID_LENGTH, CRH1A_STRIPE, CRH1A_W, CRH1A_WINDOWS } from "./cnCrh1a.ts";
import { HEXIE, mirror, seam } from "./cnCrh3c.ts";

/** The end car (28.25 m) and an intermediate car (26.6 m) over the couplers: sixteen cars 428.9 m. */
export const CRH1E_END_LENGTH = 28.25;
/** Where the face meets the body: the roof at its full height just ahead of the diamond cab window's rear corner. */
const JOIN = 5.4;
const [B, A, C, W] = [CRH1A_B, CRH1A_A, CRH1A_C, CRH1A_W];

/** The coupler hatch's top, the blue frame's and the dark area's foot on the centre line, the windscreen glass. */
const HATCH_TOP = 1.62;
const FRAME_FOOT = 1.96;
const MASK_FOOT = 2.08;
const GLASS: readonly [number, number] = [2.6, 3.56];
const MASK_TOP = 3.78;

/**
 * The centre line's profile [y, d]: one smooth convex curve. The lower nose's front (the hatch) 1.0 m
 * up, rounding back 0.34 m to the apron below and 0.19 m to the hatch's top; above it the nose leans
 * back at about 34 degrees from the horizontal, the windscreen at about 28 degrees from its foot 0.9 m
 * back to the dark area's top 3.78 m up 4.4 m back, the roof rounding over to the crown 5.4 m behind
 * the tip (Wuxi, side-on; Hongqiao and Hexie, head-on).
 */
export const CRH1E_PROFILE: Pt[] = [
  [B, 0.34], [0.55, 0.2], [0.65, 0.11], [0.8, 0.04], [1.0, 0.0], [1.2, 0.015], [1.4, 0.07], [HATCH_TOP, 0.19], [1.8, 0.43], [FRAME_FOOT, 0.69], [MASK_FOOT, 0.88],
  [2.3, 1.24], [2.6, 1.77], [2.9, 2.32], [3.2, 2.9], [3.45, 3.42], [3.65, 3.9], [MASK_TOP, 4.26], [3.9, 4.62], [3.97, 4.9], [4.01, 5.12], [C, JOIN],
];

/** The plan's corner radius by height: the lower nose broad, its corners round, narrowing up the long windscreen. */
const CORNER: Pt[] = [[B, 1.0], [HATCH_TOP, 1.05], [MASK_FOOT, 1.07], [3.0, 1.12], [3.8, 1.15], [C, 1.15]];
/** How far back the corners reach the body's full width, by height (never past the join): the nose's flanks long and tapering. */
const depth = (y: number, d: number) => Math.round(Math.max(0.03, Math.min(JOIN - d - 0.04, y < HATCH_TOP ? 2.4 : y < MASK_FOOT ? 2.4 + ((y - HATCH_TOP) / (MASK_FOOT - HATCH_TOP)) * 0.4 : 2.8 - (y - MASK_FOOT) * 0.3)) * 1e4) / 1e4;
const DEPTH: Pt[] = CRH1E_PROFILE.map(([y, d]): Pt => [y, depth(y, d)]);

const ROWS = [...new Set([...CRH1E_PROFILE.map(([y]) => y), 0.62, 0.75, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.15, 2.31, 2.45, GLASS[0], 2.75, 3.05, 3.35, GLASS[1], 3.72, 3.84])].sort((a, b) => a - b);

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const both = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** A polyline cut into pieces about `step` long, so that its seam bars follow the nose's curve. */
function finer(pts: readonly Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[i + 1]!], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([r4(a[0] + ((b[0] - a[0]) * k) / n), r4(a[1] + ((b[1] - a[1]) * k) / n)]);
  }
  out.push(pts[pts.length - 1]!);
  return out;
}
const seamDecals = (pts: readonly Pt[], t: number, mat = "seam") => seam(pts, t).map((p) => ({ mat, pts: p, fine: 2 }));

/**
 * The dark area's rear edge [y, d] seen from the side (Wuxi, Hexie): from its foot on the centre line it
 * rises back along the cab side to its top corner at the shoulder 4.7 m behind the tip; the plan's round corners make
 * its foot a U head-on. The blue frame round it 0.17 m behind.
 */
const MASK_BACK: Pt[] = [[MASK_FOOT - 0.02, -9], [MASK_FOOT, 0.9], [2.3, 1.6], [2.5, 2.35], [2.8, 3.25], [3.1, 3.95], [3.4, 4.5], [3.6, 4.7], [3.75, 4.76], [3.84, 4.55], [3.87, -9]];
const FRAME_BACK: Pt[] = [[FRAME_FOOT - 0.02, -9], [FRAME_FOOT, 0.72], [2.3, 1.78], [2.5, 2.53], [2.8, 3.43], [3.1, 4.13], [3.4, 4.68], [3.6, 4.88], [MASK_TOP, 4.94]];
/** The windscreen glass head-on: a wide pane, its top corners rounded (right half). */
const GLASS_PTS: Pt[] = both([[0, GLASS[0]], [0.93, GLASS[0]], [0.96, GLASS[0] + 0.05], [0.9, 3.3], [0.84, 3.48], [0.74, GLASS[1]], [0, GLASS[1]]]);
/** The lamp cluster on each flank, slanting down inward from its outer end (Hexie, head-on): its clear cover, right half. */
const CLUSTER: Pt[] = [[0.76, 1.76], [0.82, 1.68], [1.34, 2.08], [1.33, 2.24], [1.26, 2.25]];
/** The grille under the cluster's inner end: four slats. */
const SLATS: Pt[][] = [0, 1, 2, 3].map((i) => { const [l, y] = [0.76 + i * 0.035, 1.64 + i * 0.03]; return [[l, y], [l + 0.06, y - 0.055], [l + 0.08, y - 0.04], [l + 0.02, y + 0.015]] as Pt[]; });
/** The light grey panel's outline outboard of the cluster. */
const PANEL: Pt[] = [[1.0, 1.66], [1.08, 1.62], [1.42, 1.93], [1.36, 1.98], [1.0, 1.66]];
/** The coupler hatch's seam in the lower nose: its sides and rounded foot, 1.34 m wide, and the cover's centre split (right half). */
const HATCH: Pt[] = [[0, 0.62], [0.45, 0.62], [0.58, 0.67], [0.65, 0.78], [0.67, 1.0], [0.67, 1.45], [0.65, HATCH_TOP]];
/** The hatch's top edge: an arc from lamp to lamp, highest on the centre line. */
const HATCH_HEAD: Pt[] = [[0.65, HATCH_TOP], [0.35, HATCH_TOP + 0.03], [0, HATCH_TOP + 0.04]];
/** The apron's seam under the hatch. */
const APRON: Pt[] = [[0, 0.56], [0.45, 0.56], [0.66, 0.62]];

/** The "Hexie hao" characters on the dark area under the glass, white. */
const CHAR_AT: readonly number[] = [-0.3, 0, 0.3];
const CHAR_Y = 2.16, CHAR_H = 0.16;

export const CRH1E_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (5.1 m behind the tip, 2.7 m wheelbase) runs on into the face
  wheelCut: { d: 5.1 - 1.95, y: A },
  dJoin: JOIN, reach: 0.07, first: 7.15, roofFrom: 9, cols: [3, 5, 1, 1], tolerance: 0.035, wrap: true, bulge: 0.12,
  profile: CRH1E_PROFILE, corner: CORNER, cornerDepth: DEPTH, rows: ROWS,
  // the face white; the dark area, its blue frame, the glass, the lamps and the seams are its paint
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, FRAME_FOOT, "white"], [FRAME_FOOT, 9, "cabMask"]],
  lod: {
    profile: [[B, 0.34], [1.0, 0], [HATCH_TOP, 0.19], [MASK_FOOT, 0.88], [2.9, 2.32], [MASK_TOP, 4.26], [3.97, 4.9], [C, JOIN]],
    corner: [[B, 0.75], [C, 1.15]], rows: [B, 1.0, HATCH_TOP, MASK_FOOT, 2.9, MASK_TOP, 3.97, C],
    cornerDepth: [[B, 2.4], [HATCH_TOP, 2.4], [MASK_FOOT, 2.8], [2.9, 2.0], [MASK_TOP, 1.1], [3.97, 0.46], [C, 0.03]],
  },
  lodGlass: { hw: 0.95, y: [MASK_FOOT, MASK_TOP] },
  paint: [
    { mat: "stripe", front: [[FRAME_FOOT - 0.02, -9], [MASK_TOP, -9]], back: FRAME_BACK, top: MASK_TOP },
    { mat: "cabMask", front: [[MASK_FOOT - 0.02, -9], [3.87, -9]], back: MASK_BACK, top: 3.87 },
  ],
  fields: [
    { mat: "screen", pts: GLASS_PTS },
    { mat: "lens", pts: CLUSTER }, { mat: "lens", pts: mirror(CLUSTER) },
  ],
  decals: [
    ...SLATS.flatMap((pts) => [{ mat: "seam", pts, fine: 1 }, { mat: "seam", pts: mirror(pts), fine: 1 }]),
    ...[PANEL, mirror(PANEL)].flatMap((p) => seamDecals(finer(p, 0.1), 0.007)),
    ...[finer(HATCH, 0.12), mirror(finer(HATCH, 0.12)), finer(HATCH_HEAD, 0.12), mirror(finer(HATCH_HEAD, 0.12)), finer(APRON, 0.15), mirror(finer(APRON, 0.15))].flatMap((p) => seamDecals(p, 0.009)),
    // the cover's centre split
    ...seamDecals([[0, 0.63], [0, HATCH_TOP + 0.03]], 0.007),
    ...HEXIE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [CHAR_AT[i]! + (x - 0.5) * CHAR_H, CHAR_Y + y * CHAR_H]), 0.0075)))
      .map((pts) => ({ mat: "white", pts, fine: 1 })),
  ],
  texts: [],
  panes: [],
  // in each cluster the red tail lamp at its outer end, two head lamps inboard of it
  lamps: [[1.22, 2.11, 0.055, "lampRed"], [-1.22, 2.11, 0.055, "lampRed"], [1.08, 1.99, 0.06, "lampHead"], [-1.08, 1.99, 0.06, "lampHead"], [0.94, 1.87, 0.06, "lampHead"], [-0.94, 1.87, 0.06, "lampHead"]],
  // one wiper, parked on the viewer's left, slanting down to the right
  wipers: [[[0.25, GLASS[0] + 0.08], [-0.45, 3.15]]],
};

/**
 * The CRH livery as the original sets ran it (CRH1E-1061, Wuxi 2019): stainless white, the dark window
 * band, the royal blue stripe under it falling forward along the cab side to a point 3.2 m behind the
 * tip, 1.0 m up; the diamond cab side window and the "CRH" mark under it.
 */
function crhLivery(): ShinkansenLivery {
  const [s0, s1] = CRH1A_STRIPE;
  // the stripe's lower and upper edges [y, d] on the cab side, meeting in the point
  const POINT: Pt = [1.0, 3.2];
  return {
    title: "CRH blue stripe", number: "CRH1E-1061",
    palette: {
      white: c("#eceeec", 0.35), stripe: c("#164aa1", 0.35), roofG: c("#b9bcbd", 0.55), skirtG: c("#d9dad8", 0.5),
      cabMask: c("#171c2b", 0.25), screen: { color: "#2c3c51", metallic: 0.3, roughness: 0.08, glass: true }, lens: { color: "#4d5866", metallic: 0.3, roughness: 0.1, glass: true },
      seam: c("#4a4e52", 0.5), navy: c("#1f2f6e", 0.4), fairing: c("#c4c6c6", 0.5), roofRib: c("#9ea1a2", 0.55), pillar: c("#1b2027", 0.4),
      cabGlass: { color: "#5d6c7c", metallic: 0.3, roughness: 0.08, glass: true },
    },
    bands: [[0, s0, "white"], [s0, s1, "stripe"], [s1, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // white over the body's stripe ahead of the sweep's upper edge
      { mat: "white", front: [[s0, -9], [s1, -9]], back: [[s0, 6.2], [s1, 7.4]], face: true },
      // the stripe falling forward: at each height between its upper edge (front) and its lower edge (back)
      { mat: "stripe", front: [POINT, [1.3, 4.0], [1.5, 4.9], [s0, 5.55], [s1, 7.4]], back: [POINT, [1.2, 4.3], [1.35, 5.3], [1.5, 6.5], [s0, 8.2], [s1 - 0.001, 8.2]], face: true },
      // the diamond cab side window: a dark frame, the glass inside it
      { mat: "cabMask", front: [[2.5, 5.45], [2.92, 4.97], [3.34, 5.45]], back: [[2.5, 5.45], [2.92, 5.93], [3.34, 5.45]] },
      { mat: "cabGlass", front: [[2.6, 5.45], [2.92, 5.09], [3.24, 5.45]], back: [[2.6, 5.45], [2.92, 5.81], [3.24, 5.45]] },
    ],
    endLettering: [{ text: "CRH", d: 5.2 - JOIN, y: 2.08, h: 0.3, mat: "navy" }],
    sideFields: {
      end: RUNS.end.map(([d0, d1]) => pillars(d0, d1)),
      middle: RUNS.middle.map(([d0, d1]) => pillars(d0, d1)),
    },
  };
}

/** An intermediate car's body: 26.6 m over the couplers less the gaps. */
const MID_BODY = CRH1A_MID_LENGTH - 0.5;
/** Panes `w` long, `gap` apart, from d0. */
const run = (d0: number, n: number, w: number, gap: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [r4(d0 + i * (w + gap)), r4(d0 + i * (w + gap) + w)] as const);

/**
 * The end car (d behind the body's front, 5.4 m behind the tip): the window band from 6.75 m behind the
 * tip, the door 7.15 - 8.3 m back with its window in the band, then ten panes to the rear end. The
 * sleeper: one long band of twelve compartment and corridor panes at a 1.96 m pitch, the door at its
 * rear end (both sides alike within the photographs' detail).
 */
const END_WINDOWS = [[6.75 - JOIN, 7.07 - JOIN] as const, ...run(8.42 - JOIN, 10, 1.81, 0.12)];
const MID_WINDOWS = run(0.6, 12, 1.84, 0.12);
const MID_DOOR: readonly [number, number] = [24.45, 25.6];
const RUNS = { end: [[6.75 - JOIN, 27.6 - JOIN - 0.25]], middle: [[0.6, 24.08]] } as const;
const pillars = (d0: number, d1: number) => ({ mat: "pillar", pts: [[r4(d0 + 0.02), CRH1A_WINDOWS[0] + 0.02], [r4(d1 - 0.02), CRH1A_WINDOWS[0] + 0.02], [r4(d1 - 0.02), CRH1A_WINDOWS[1] - 0.02], [r4(d0 + 0.02), CRH1A_WINDOWS[1] - 0.02]] as Pt[] });

/** A low roof box (the air conditioning unit): a frustum from a rounded rectangle sunk in the roof to a smaller one at its top. */
function roofBox(m: MeshBuilder, x0: number, x1: number, y: number, hw: number, h: number, mat: string): void {
  const ring = (len: number, w: number): Ring => {
    const r = Math.min(0.25, w * 0.5, len / 2 - 0.01), x = (x0 + x1) / 2, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[len / 2 - r, -(w - r), -90], [len / 2 - r, w - r, 0], [-(len / 2 - r), w - r, 90], [-(len / 2 - r), -(w - r), 180]] as const)
      for (let j = 0; j <= 2; j++) { const a = ((a0 + (90 * j) / 2) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return out.reverse() as Ring;
  };
  const len = Math.abs(x1 - x0);
  m.loft(mat, ring(len, hw), y - 0.12, ring(len - 0.6, hw - 0.08), y + h);
}

/** The fittings: the air conditioning unit on every roof (behind the cab on the end car, at the rear end of a sleeper, clear of the pantograph), the underfloor box. */
function crh1eFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("air conditioning", () => {
    const [d0, d1] = car.end ? [6.6 - JOIN, 10.4 - JOIN] : [MID_BODY - 5.6, MID_BODY - 1.8];
    roofBox(m, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C, 1.0, 0.24, "fairing");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), B - 0.12, B + 0.02, -W * 0.82, W * 0.82));
}

export const CRH1E: ShinkansenSeries = {
  ...CRH1A,
  endLength: CRH1E_END_LENGTH, cabFace: CRH1E_FACE, nose: NO_NOSE,
  layout: {
    end: { doors: [[7.15 - JOIN, 8.3 - JOIN, -1]], windows: END_WINDOWS },
    middle: { doors: [[MID_DOOR[0], MID_DOOR[1], 1]], windows: MID_WINDOWS },
  },
  // the leading bogie 5.1 m behind the tip; 19.0 m bogie centres on every car
  endBogies: [5.1 - JOIN, 24.1 - JOIN], midBogies: [3.55, MID_BODY - 3.55],
  // the pantographs on the Tp cars next to the end cars (cars 2 and 15 of sixteen; zh.wikipedia), near the
  // car's front end (Wuxi); one collects current, the rear one raised, the other folded
  endPantograph: false, trailingLowered: false, pantographsBesideEnds: true, pantographAt: 3.0,
  pantographSlots: (n) => (n <= 3 ? [{ k: 1 }] : [{ k: 1, lowered: true }, { k: n - 2 }]),
  numberAt: [-8.5, 1.3, 0.1],
  liveries: { crh: crhLivery() },
  fittings: crh1eFittings,
  // 16 cars about 890 t; 11,000 kW from ten motor cars of sixteen, given as each car's share
  weight: { end: 57, middle: 55 }, power: 687.5, maxspeed: 250,
};
