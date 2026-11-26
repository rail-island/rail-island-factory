// The CRH380D (Bombardier Sifang (Qingdao), the Zefiro 380) on the series kit (shinkansen.ts): its own
// cab face (seriesCab.ts) - the long, low "duck bill" nose, one smooth convex surface from the coupler
// cover's round front up the 21-degree slope of the big wrap-around windscreen to the roof (the cover
// only a thin seam outline flush in the surface, no knob or lip), the black panel under the windscreen
// in its grey border, the lamp strips along the nose's corners, the black almond cab side window and the
// grey canopy cap - and its measured window and door layout. The livery: white, the black window band
// with its pointed front, the blue stripe rising from a point low on the nose. Narrowed from its real
// 3.36 m to the Shinkansen gauge. See docs/models/china-units.md, "The CRH380D's body".
//
// Measured from assets/cr-crh380d/ (SOURCES.md): CRH380D-1501 near side-on from above (a projective fit
// along the end car through its tip, both bogies' axles and its coupling plane; heights scaled on the
// door, 1.24 - 3.2 m), the 1514, 1516, 1529 and 1530 three-quarter views (the face's paint, the bill, the
// cover's seams, the lamps) and 1527 from above (the plan, the intermediate car). Published figures
// (china-emu.cn): end car 27.85 m, intermediate cars 26.6 m, 215.3 m for eight; 18.8 m bogie centres,
// 2.7 m wheelbase, 920 mm wheels; Mc Tp M T T M Tp Mc, the pantographs on cars 2 and 7. Heights over
// the rail, d behind the tip.

import type { MaterialSpec } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

type Band = readonly [number, number, string];

/** Where the face meets the body: the roof's full height just behind the grey canopy cap. */
const DJOIN = 10.5;
/** The end car over its couplers and an intermediate car (eight cars 215.3 m). */
const END_LENGTH = 27.85;
const MID_LENGTH = 26.6;
/** The coupling gap at each inner end (the kit's): the bodies' lengths. */
const GAP = 0.25;
const END_BODY = END_LENGTH - DJOIN - GAP;
const MID_BODY = MID_LENGTH - 2 * GAP;
/** The body's bottom, skirt top, belly, shoulder and crown; the half width (3.36 m drawn 3.22 m, the door frames inside the gauge). */
const [B, A, Y, S, C, W] = [0.45, 0.8, 1.25, 3.1, 4.0, 1.61];

/** The livery's heights (1501 at the door): the blue stripe, the black window band. */
const STRIPE: readonly [number, number] = [1.62, 1.73];
const BAND: readonly [number, number] = [1.88, 2.62];

/**
 * The centre line's profile [y, d] (1501 side on, 1516 low three-quarters): one smooth convex curve.
 * The tip is the coupler cover's round front 0.85 m up; its underside tucks back to the skirt; above
 * it the cover rounds over (0.4 m back at 1.35 m) into the long straight slope of the black panel and
 * the windscreen, about 21 degrees (2.7 m back for each metre up: 1.36 m back at 1.7 m, 4.1 m at 2.7 m,
 * the windscreen's head 3.56 m up 6.8 m back), flattening over the canopy to the roof 10.5 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.62], [0.55, 0.27], [0.65, 0.11], [0.75, 0.03], [0.85, 0], [1.05, 0.05], [1.25, 0.24], [1.35, 0.42],
  [1.45, 0.68], [1.55, 0.95], [1.7, 1.365], [1.9, 1.91], [2.4, 3.29], [2.7, 4.13], [3.0, 4.98], [3.5, 6.45],
  [3.78, 7.5], [3.88, 8.2], [3.95, 9.0], [C, DJOIN],
];
/** Paint heights the grid needs as rows besides the profile's. */
const PAINT_ROWS: number[] = [];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), ...PAINT_ROWS])].sort((a, b) => a - b);
/** The cover a little inside the body's half width low down. */
const INSET: Pt[] = [[B, 0.15], [1.0, 0.05], [1.3, 0]];
const CORNER: Pt[] = [[B, W], [C, W]];
/** How far back the round plan reaches full width (1527 from above): a broad, round bill, the canopy narrowing above. */
const DEPTH: Pt[] = [[B, 3.5], [0.85, 3.9], [1.3, 3.8], [1.7, 3.6], [2.2, 3.3], [2.8, 3.0], [3.3, 2.6], [3.7, 1.8], [3.9, 1.0], [C, 0.05]];

/** Linear interpolation in a [x, y] table (held past its ends). */
function at(t: readonly Pt[], x: number): number {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    const [xa, ya] = t[i - 1]!, [xb, yb] = t[i]!;
    if (x <= xb) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return t[t.length - 1]![1];
}
/** The body's half width by height (its section at the join, approximately). */
const HALF: Pt[] = [[B, W * 0.9], [A, W * 0.97], [Y, W], [S, W * 0.95], [3.5, 1.3], [3.85, 0.85], [C, 0.2]];
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** The d behind the tip of the point on the round nose at height y whose head-on half width is w. */
function edgeD(y: number, w: number): number {
  const hw = (at(HALF, y) - at(INSET, y)) * 0.98, rd = at(DEPTH, y), k = Math.min(0.999, w / hw);
  return r4(at(PROFILE, y) + rd * (1 - Math.sqrt(1 - k * k)));
}
/** An edge given head-on ([y, half width]) on the face and by d on the cab side ([y, null, d]): [y, d]. */
type Spec = ReadonlyArray<readonly [number, number | null, number?]>;
const edge = (s: Spec, shift = 0): Pt[] => s.map(([y, w, d]): Pt => [r4(y), w === null ? r4(d! + shift) : edgeD(y, w)]);
const ahead = (e: readonly Pt[]): Pt[] => e.map(([y]): Pt => [y, -9]);

/** The grey border's lower edge: a shallow vee on the chin under the black panel, along the corners to the lamps. */
const TRIM: Spec = [[1.55, 0.03], [1.57, 0.35], [1.62, 0.7], [1.68, 1.0], [1.75, 1.18], [1.82, 1.3], [1.88, 1.36]];
/** The black panel under the windscreen: its foot over the border, round the corners into the lamp strips. */
const PANEL: Spec = [[1.69, 0.03], [1.71, 0.4], [1.75, 0.8], [1.8, 1.05], [1.85, 1.2], [1.9, 1.3], [1.95, null, 3.25], [2.0, null, 4.6], [2.05, null, 6.6], [2.15, null, 6.95], [2.3, null, 7.3], [2.45, null, 7.57], [2.55, null, 7.45], [2.62, null, 7.31], [2.66, null, 5.33]];
/** The lamp strip's foot on the nose's corner, rising back to the cab window's point (1501). */
const LAMP_FOOT: Pt[] = [[1.46, 0.95], [1.58, 1.8], [1.68, 2.7], [1.95, 3.3]];
/** The lamp strip's front: outside the panel's corner. */
const LAMP_FRONT: Pt[] = [[1.46, edgeD(1.46, 1.05)], [1.6, edgeD(1.6, 1.15)], [1.8, edgeD(1.8, 1.25)], [1.95, edgeD(1.95, 1.3)]];
/** The windscreen's foot: level across the face just over the characters, rising back along the sides to the cap. */
const GLASS: Spec = [[2.15, 0.03], [2.17, 0.5], [2.21, 0.9], [2.29, 1.15], [2.38, 1.28], [2.45, null, 4.1], [2.61, null, 5.19], [2.8, null, 5.95], [3.0, null, 6.5], [3.3, null, 6.75], [3.56, null, 6.8], [4.1, null, 6.8]];
/** The grey cap over the canopy behind the windscreen, back to its round end on the roof. */
const CAP: Pt[] = [[3.25, 7.2], [3.5, 8.6], [3.8, 9.6], [4.1, 9.9]];
/** The lighter glass in the black almond cab side window. */
const SIDE_GLASS_FRONT: Pt[] = [[2.14, 5.55], [2.38, 5.35], [2.58, 5.45]];
const SIDE_GLASS_BACK: Pt[] = [[2.14, 6.45], [2.38, 6.65], [2.58, 6.55]];

/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** Thin bars along an outline ([lat, y] points), each a decal: a seam. */
function outline(mat: string, pts: readonly Pt[], t: number, closed = true): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let i = 0; i + (closed ? 0 : 1) < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy) || 1, [nx, ny] = [(-dy / l) * t, (dx / l) * t];
    out.push({ mat, pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]], fine: 2 });
  }
  return out;
}
/** The coupler cover head-on (1514, 1530): the bill's rounded front, 1.9 m wide, from the skirt to its top 1.42 m up - right half. */
const COVER: Pt[] = [[0, 0.5], [0.62, 0.5], [0.86, 0.58], [0.95, 0.78], [0.95, 1.02], [0.86, 1.22], [0.66, 1.36], [0.34, 1.42], [0, 1.43]];
/** The cover's seams, flush on the bill: its outline (open at the foot) and the leaves' joint down its middle. */
function coverSeams(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const ring = mirror(COVER).slice(1, -1).concat();
  const fine = ring.flatMap((p, i): Pt[] => { const q = ring[(i + 1) % ring.length]!; return i + 1 < ring.length ? [p, [r4((p[0] + q[0]) / 2), r4((p[1] + q[1]) / 2)]] : [p]; });
  const joint = Array.from({ length: 9 }, (_, i): Pt => [0, r4(0.52 + (0.9 * i) / 8)]);
  return [...outline("seam", fine, 0.011, false), ...outline("seam", joint, 0.008, false)];
}

const FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 3.6, reach: 0.07, first: 12.8, roofFrom: C, wrap: true, cols: [2, 4, 1, 2], tolerance: 0.06,
  profile: PROFILE, corner: CORNER, cornerDepth: DEPTH, planInset: INSET, rows: ROWS,
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, 1.7, "white"], [1.7, 9, "cabMask"]],
  lod: { profile: [[B, 0.62], [0.85, 0], [1.35, 0.42], [1.7, 1.365], [2.4, 3.29], [3.0, 4.98], [3.5, 6.45], [3.78, 7.5], [3.95, 9.0], [C, DJOIN]], corner: [[B, 1.15], [1.35, 1.35], [C, W]], rows: [B, 0.85, 1.35, 1.7, 2.4, 3.0, 3.5, 3.78, 3.95, C], cornerDepth: [[B, 3.5], [1.3, 3.8], [2.2, 3.3], [3.3, 2.6], [3.9, 1.0], [C, 0.05]] },
  paint: [
    // the grey cap over the canopy, back to the roof
    { mat: "cap", front: ahead(CAP), back: CAP, top: 4.1 },
    // the grey border round the black panel, then the lamp strips on the corners and the black panel with the cab side window
    { mat: "trim", front: ahead(edge(TRIM)), back: edge(TRIM) },
    { mat: "cabMask", front: LAMP_FRONT, back: LAMP_FOOT },
    // (on the cab side it stops 0.12 m short of the windscreen's foot: the white pillar line between them)
    { mat: "cabMask", front: [[1.69, -9], [2.14, -9], ...edge(GLASS, 0.12).filter(([y]) => y <= 2.66)], back: edge(PANEL) },
    // the windscreen over the whole canopy
    { mat: "glassD", front: ahead(edge(GLASS)), back: edge(GLASS), top: 4.1 },
    // the lamps in the strip: the red tail lamp ahead, the white LED headlamp at its rising end
    { mat: "lampRed", front: [[1.62, 1.75], [1.68, 1.7]], back: [[1.62, 2.05], [1.68, 2.25]] },
    { mat: "lampHead", front: [[1.86, 2.7], [1.94, 2.6]], back: [[1.86, 3.05], [1.94, 3.12]] },
    // the cab side window's lighter pane in the almond
    { mat: "glassD", front: SIDE_GLASS_FRONT, back: SIDE_GLASS_BACK },
  ],
  decals: coverSeams(),
  panes: [], lodGlass: { hw: 1.2, y: [2.15, 3.56] },
  wipers: [[[0.6, 2.16], [0.2, 2.85]]],
};

/** The side's paint ahead of the join: the blue stripe from its point low on the bill's flank, the window band's pointed front, the first window. */
const sweeps = (): NonNullable<ShinkansenLivery["endSweeps"]> => [
  { mat: "blue", front: [[0.86, 1.45], [1.04, 3.0], [1.32, 5.7], [1.555, DJOIN + 0.1]], back: [[0.86, 1.45], [0.97, 3.0], [1.22, 5.7], [1.445, DJOIN + 0.1]], face: true },
  { mat: "band", front: [[BAND[0], 7.45], [1.93, 7.25], [2.0, 7.32], [BAND[1], 8.35]], back: [[BAND[0], DJOIN + 0.1], [BAND[1], DJOIN + 0.1]] },
  { mat: "cabGlass", front: [[1.98, 8.55], [2.02, 8.5], [2.5, 8.5], [2.54, 8.55]], back: [[1.98, 9.65], [2.02, 9.7], [2.5, 9.7], [2.54, 9.65]] },
];

/** The blue stripe on the end car's body (d behind the body's front): still rising to the side's line 6 m behind the join, broken by the door. */
const STRIPE_FIELDS = (): Array<{ mat: string; pts: Pt[] }> => {
  const t = 0.11, quad = (d0: number, y0: number, d1: number, y1: number): Pt[] => [[d0, y0 - t / 2], [d1, y1 - t / 2], [d1, y1 + t / 2], [d0, y0 + t / 2]];
  return [
    { mat: "blue", pts: quad(0, 1.5, 12.75 - DJOIN, 1.58) },
    { mat: "blue", pts: quad(13.75 - DJOIN, 1.605, 15.0 - DJOIN, 1.64) },
    { mat: "blue", pts: quad(15.0 - DJOIN, 1.64, 16.5 - DJOIN, (STRIPE[0] + STRIPE[1]) / 2) },
    { mat: "blue", pts: quad(16.5 - DJOIN, (STRIPE[0] + STRIPE[1]) / 2, END_BODY, (STRIPE[0] + STRIPE[1]) / 2) },
  ];
};

const BANDS: Band[] = [[0, STRIPE[0], "white"], [STRIPE[0], STRIPE[1], "blue"], [STRIPE[1], BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]];

/** The windscreen: dark glass under a grey sheen (the photographs). */
const GLASS_D: MaterialSpec = { color: "#2d3742", metallic: 0.35, roughness: 0.08, glass: true };

export const CRH380D_LIVERY: ShinkansenLivery = {
  title: "CRH blue", number: "CRH380D-1501",
  palette: {
    white: c("#eef0ef", 0.35), band: c("#1d2024", 0.3), blue: c("#1f3d9c", 0.35), cabMask: c("#141618", 0.25), trim: c("#8e959b", 0.4),
    cap: c("#a7adb2", 0.35), glassD: GLASS_D, seam: c("#5b6066", 0.5), roofG: c("#dfe2e2", 0.55), skirtG: c("#e6e8e8", 0.5),
    grille: c("#8c7b5c", 0.6), navy: c("#1b2a5c", 0.4),
  },
  bands: BANDS,
  // the end car: the stripe still rising along the body (its own fields), the band as the side's
  endBands: [[0, BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]],
  endCarDoors: [[0, 1.555, "white"], [1.555, 1.66, "blue"], [1.66, BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: sweeps(),
  sideFields: { end: STRIPE_FIELDS() },
  endLettering: [{ text: "CRH", d: 24.3 - DJOIN, y: 2.0, h: 0.45, mat: "navy" }],
};

/** Windows on a pitch: `n` from d0, `w` wide. */
const run = (d0: number, n: number, w: number, pitch: number): Array<[number, number]> => Array.from({ length: n }, (_, i): [number, number] => [r4(d0 + i * pitch), r4(d0 + i * pitch + w)]);

/** The bronze grilles on the skirts between the bogies (1501), d behind the body's front. */
const grilles = (spans: ReadonlyArray<readonly [number, number]>) => spans.map(([d0, d1]) => ({ d: [d0, d1] as const, y: [0.62, 0.98] as const, kind: "panel" as const, mat: "grille" }));

export const CRH380D: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  // the windows low in the narrow black band; plug doors with a window in the band
  windows: [[1.97, 2.55]], windowW: 1.4, pitch: 1.94,
  door: [1.24, 3.2, 1.97, 2.55], doorW: 0.9, doorGlassW: 0.5,
  layout: {
    // the end car: a window behind the join, the door, five windows, the blank rear end with the CRH mark
    end: { doors: [[12.8 - DJOIN, 13.7 - DJOIN, -1]], windows: [[10.55 - DJOIN, 11.75 - DJOIN], ...run(14.55 - DJOIN, 5, 1.4, 1.94)] },
    // an intermediate car: a door at each end, eleven windows between
    middle: { doors: [[0.6, 1.5, -1], [MID_BODY - 1.5, MID_BODY - 0.6, 1]], windows: run(2.4, 11, 1.4, 1.96) },
  },
  sidePanels: {
    end: grilles([[10.9, 12.1], [14.0, 14.6], [15.4, 16.2], [16.8, 17.6], [18.1, 18.9], [19.3, 20.1], [21.6, 22.2]]),
    middle: grilles([[6.4, 7.2], [7.7, 8.5], [9.0, 9.8], [17.0, 17.8], [18.3, 19.1]]),
  },
  numberAt: [0.7 - END_BODY / 2, 1.28, 0.11],
  // 18.8 m bogie centres, 920 mm wheels, 2.7 m wheelbase; the leading bogie 5.2 m behind the tip
  endBogies: [5.2 - DJOIN, 24.0 - DJOIN], midBogies: [3.9 - GAP, 22.7 - GAP], bogieCentres: 18.8, wheelR: 0.46, wheelbase: 2.7,
  // the pantographs on the Tp cars next to the end cars (cars 2 and 7 of eight), only the rear one raised
  pantographSlots: (n) => (n >= 4 ? [{ k: 1, lowered: true }, { k: n - 2 }] : n === 3 ? [{ k: 1 }] : []),
  liveries: { crh: CRH380D_LIVERY },
  // the skirts reach down to 0.45 m: no underfloor box below them
  fittings: () => {},
  // 465.2 t empty for eight cars; 10,080 kW
  weight: { end: 60, middle: 57 }, power: 1260, maxspeed: 350,
};
