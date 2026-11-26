// The CRH1A (Bombardier Sifang (Qingdao) Transportation, 2007; the Regina C2008 adapted for China)
// on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the original sets'
// blunt, rounded nose (CRH1-001A ... 040A, later CRH1A-1001 ...; not the CRH1A-A's Zefiro nose) -
// one smooth surface from the apron to the roof: the white lower nose (the coupler hatch only a thin
// seam outline flush in it), above it the dark navy panel with "CRH" and the lamp clusters at its
// ends, the large raked windscreen and the dark cap over the roof's front edge. Stainless sides with
// the CRH blue stripe under the large windows, one plug door a side on every car, the pantograph
// on the end car near its inner end. Matched to the photographs in assets/cr-crh1a/ (SOURCES.md).
// See docs/models/china-units.md, "The CRH1A's body".
//
// Heights over the rail, d behind the nose's tip (the lower nose's front, 1.0 m up). The constants
// are exported for the CRH1E sleeper, which shares this face and body.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** The end car (26.95 m) and an intermediate car (26.6 m) over the couplers: eight cars 213.5 m. */
export const CRH1A_END_LENGTH = 26.95;
export const CRH1A_MID_LENGTH = 26.6;
/** Where the face meets the body: the roof at its full height just ahead of the cab side window. */
export const CRH1A_JOIN = 2.5;
/** The body's bottom (the underfloor skirts' foot), the skirts' top (the side's lower edge), belly, shoulder (cant rail) and crown (4,040 mm). */
export const CRH1A_B = 0.45;
export const CRH1A_A = 0.95;
export const CRH1A_Y = 1.3;
export const CRH1A_S = 3.45;
export const CRH1A_C = 4.04;
/** Half width: 3.328 m drawn 3.27 m inside the Shinkansen gauge. */
export const CRH1A_W = 1.635;

const [B, A, C, JOIN] = [CRH1A_B, CRH1A_A, CRH1A_C, CRH1A_JOIN];

/** The window band (1140's side: 1.83 - 2.79 m) and the blue stripe under it with a white gap. */
export const CRH1A_WINDOWS: readonly [number, number] = [1.83, 2.79];
export const CRH1A_STRIPE: readonly [number, number] = [1.6, 1.74];
/** The lower nose's top, where the dark panel starts, and the windscreen's foot and head on the centre line. */
const PANEL = 1.55;
const SCREEN_FOOT = 2.27;
const SCREEN_HEAD = 3.5;

/**
 * The centre line's profile [y, d]: one smooth convex curve. The lower nose's front 1.0 m up, rounding
 * back 0.22 m to the apron below and 0.1 m to its top at 1.55 m; the dark panel leaning back at about 30
 * degrees to the windscreen's foot (0.5 m back), the windscreen at about 40 degrees to its head 3.5 m
 * up 1.6 m back, the cap rounding over to the crown 2.5 m behind the tip (003A, 019, 1140, 1003).
 */
export const CRH1A_PROFILE: Pt[] = [
  [B, 0.22], [0.55, 0.16], [0.65, 0.1], [0.8, 0.035], [1.0, 0.0], [1.2, 0.01], [1.4, 0.05], [PANEL, 0.11], [1.75, 0.24], [2.0, 0.4], [SCREEN_FOOT, 0.58],
  [2.55, 0.78], [2.85, 1.01], [3.15, 1.27], [3.35, 1.45], [SCREEN_HEAD, 1.6], [3.65, 1.8], [3.78, 1.98], [3.88, 2.14], [3.96, 2.29], [4.01, 2.41], [C, JOIN],
];

/** The plan's corner radius by height: a broad face, its corners 0.5 m round at the lower nose, rounder up the windscreen. */
export const CRH1A_CORNER: Pt[] = [[B, 0.5], [PANEL, 0.55], [SCREEN_FOOT, 0.7], [3.2, 0.85], [3.8, 0.9], [C, 0.9]];
/** How far back the corners reach the body's full width, by height (never past the join). */
const depth = (y: number, d: number) => Math.round(Math.max(0.03, Math.min(JOIN - d - 0.04, y < PANEL ? 0.62 : y < SCREEN_FOOT ? 0.62 + ((y - PANEL) / (SCREEN_FOOT - PANEL)) * 0.3 : 0.92 + (y - SCREEN_FOOT) * 0.25)) * 1e4) / 1e4;
export const CRH1A_DEPTH: Pt[] = CRH1A_PROFILE.map(([y, d]): Pt => [y, depth(y, d)]);

const ROWS = [...new Set([...CRH1A_PROFILE.map(([y]) => y), 0.62, 0.75, 0.9, 1.1, 1.3, 1.62, 1.68, 1.85, 2.1, 2.2, 2.33, 2.7, 3.0, 3.3, 3.43, 3.58, 3.72])].sort((a, b) => a - b);

/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
const flip = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** Thin bars along an outline ([lat, y] points), each a decal: a seam. */
function outline(mat: string, pts: readonly Pt[], t: number, closed = true): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let i = 0; i + (closed ? 0 : 1) < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy) || 1, [nx, ny] = [(-dy / l) * t, (dx / l) * t];
    const q: Pt[] = [[r4(a[0] - nx), r4(a[1] - ny)], [r4(b[0] - nx), r4(b[1] - ny)], [r4(b[0] + nx), r4(b[1] + ny)], [r4(a[0] + nx), r4(a[1] + ny)]];
    const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
    out.push({ mat, pts: area < 0 ? q.reverse() : q, fine: 2 });
  }
  return out;
}
/** A polyline cut into pieces about `step` long, so that its bars follow the nose's curve. */
function finer(pts: readonly Pt[], step: number, closed = true): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([r4(a[0] + ((b[0] - a[0]) * k) / n), r4(a[1] + ((b[1] - a[1]) * k) / n)]);
  }
  if (!closed) out.push(pts[pts.length - 1]!);
  return out;
}

/**
 * The dark area head-on (1140, 003A, 1003): the navy panel from the lower nose's top, the windscreen's
 * frame and the cap over the roof's front edge, between the white corner pillars - right half.
 */
const MASK: Pt[] = mirror([[0, PANEL], [0.95, PANEL], [0.97, 1.58], [0.98, 2.12], [1.06, 2.22], [1.17, 2.3], [1.19, 2.45], [1.13, 3.0], [1.05, 3.5], [0.95, 3.75], [0.8, 3.92], [0.5, 3.98], [0, 4.0]]);
/** The windscreen: one large pane, nearly as wide as the dark area, its top corners rounded. */
const GLASS: Pt[] = mirror([[0, SCREEN_FOOT + 0.04], [1.06, SCREEN_FOOT + 0.04], [1.1, SCREEN_FOOT + 0.1], [1.06, 2.9], [1.0, 3.3], [0.93, 3.45], [0.8, 3.5], [0, 3.52]]);
/** The lamp cluster at each end of the dark panel: a clear cover, the red tail lamp above the head lamp (viewer's right). */
const LENS: Pt[] = [[0.74, 1.64], [0.91, 1.64], [0.93, 1.68], [0.93, 2.1], [0.9, 2.14], [0.76, 2.14], [0.73, 2.1]];
/** The coupler hatch's seam in the lower nose: a box 1.7 m wide from its foot to the panel, its lower corners round (right half). */
const HATCH: Pt[] = [[0, 0.6], [0.65, 0.6], [0.78, 0.65], [0.84, 0.76], [0.85, 1.0], [0.85, PANEL - 0.02], [0, PANEL - 0.02]];
/** The small square cover and the louvred vent on the lower nose beside the hatch (viewer's right). */
const COVER: Pt[] = [[1.08, 1.12], [1.3, 1.12], [1.3, 1.34], [1.08, 1.34]];

function hatchSeams(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  // the hatch's outline without its top, which is the panel's own edge
  const half = finer(HATCH.slice(0, -1), 0.12, false);
  return [...outline("seam", half, 0.01, false), ...outline("seam", flip(half), 0.01, false), ...outline("seam", finer(COVER, 0.1), 0.008), ...outline("seam", finer(flip(COVER), 0.1), 0.008)];
}
/** The vent's slats beside the hatch, both sides. */
const VENT: Array<{ mat: string; pts: Pt[]; fine: number }> = [0.82, 0.87, 0.92, 0.97].flatMap((y) => [
  { mat: "seam", pts: [[1.1, y], [1.3, y], [1.3, y + 0.025], [1.1, y + 0.025]] as Pt[], fine: 2 },
  { mat: "seam", pts: [[-1.3, y], [-1.1, y], [-1.1, y + 0.025], [-1.3, y + 0.025]] as Pt[], fine: 2 },
]);

/** The cab face shared by the CRH1A and the original CRH1E. */
export const CRH1A_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (3.8 m behind the tip, 2.7 m wheelbase) runs on into the face
  wheelCut: { d: 3.8 - 1.95, y: A },
  dJoin: JOIN, reach: 0.07, first: 8.85, roofFrom: 9, cols: [3, 5, 1, 1], tolerance: 0.035, wrap: true, bulge: 0.1,
  profile: CRH1A_PROFILE, corner: CRH1A_CORNER, cornerDepth: CRH1A_DEPTH, rows: ROWS,
  // the face white; the dark area, the glass, the lamps and the seams are its paint
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, PANEL, "white"], [PANEL, 9, "cabMask"]],
  lod: { profile: [[B, 0.22], [1.0, 0], [PANEL, 0.11], [SCREEN_FOOT, 0.58], [2.85, 1.01], [SCREEN_HEAD, 1.6], [3.88, 2.14], [C, JOIN]], corner: [[B, 0.5], [C, 0.9]], rows: [B, 1.0, PANEL, SCREEN_FOOT, 2.85, SCREEN_HEAD, 3.88, C], cornerDepth: [[B, 0.6], [PANEL, 0.62], [SCREEN_FOOT, 0.9], [SCREEN_HEAD, 0.85], [3.88, 0.3], [C, 0.03]] },
  lodGlass: { hw: 1.05, y: [SCREEN_FOOT, SCREEN_HEAD] },
  paint: [],
  fields: [
    { mat: "cabMask", pts: MASK },
    { mat: "screen", pts: GLASS },
    { mat: "lens", pts: LENS }, { mat: "lens", pts: flip(LENS) },
    // the destination display on the cap
    { mat: "display", pts: [[-0.3, 3.62], [0.3, 3.62], [0.3, 3.76], [-0.3, 3.76]] },
  ],
  decals: [...hatchSeams(), ...VENT, { mat: "black", pts: [[-0.09, 0.61], [0.09, 0.61], [0.09, 0.66], [-0.09, 0.66]], fine: 2 }],
  texts: [{ text: "CRH", lat: 0, y: 1.74, h: 0.25, mat: "white" }],
  panes: [],
  // the head lamp below the red tail lamp in each cluster; the upper lamp over the windscreen
  lamps: [[0.83, 1.79, 0.055, "lampHead"], [-0.83, 1.79, 0.055, "lampHead"], [0.83, 1.99, 0.045, "lampRed"], [-0.83, 1.99, 0.045, "lampRed"]],
  roofLamp: [0, 3.86, 0.05],
  // one wiper, parked upright on the viewer's left
  wipers: [[[-0.3, 2.35], [-0.72, 3.2]]],
};

/** The cab side window (a tall pane with round corners just behind the face, 2.27 - 3.26 m up), d behind the body's front. */
const cabWindow = (d0: number, d1: number, y0: number, y1: number, r: number): Pt[] => {
  const out: Pt[] = [];
  for (const [cx, cy, a0] of [[d1 - r, y0 + r, -90], [d1 - r, y1 - r, 0], [d0 + r, y1 - r, 90], [d0 + r, y0 + r, 180]] as const)
    for (let j = 0; j <= 3; j++) { const a = ((a0 + (90 * j) / 3) * Math.PI) / 180; out.push([r4(cx + r * Math.cos(a)), r4(cy + r * Math.sin(a))]); }
  return out;
};

/**
 * The CRH livery of the original sets (CRH1A-1003, the former CRH1-003A): stainless white, the royal
 * blue stripe under the window band, tapering forward on the cab to a point at the face's corner; the
 * "CRH" mark behind the cab window, the seam between the cab's shell and the stainless body.
 */
function crhLivery(): ShinkansenLivery {
  const [s0, s1] = CRH1A_STRIPE;
  return {
    title: "CRH blue stripe", number: "CRH1A-1003",
    palette: {
      white: c("#eceeec", 0.35), stripe: c("#164aa1", 0.35), roofG: c("#b9bcbd", 0.55), skirtG: c("#d9dad8", 0.5),
      cabMask: c("#171c2b", 0.25), screen: { color: "#2c3c51", metallic: 0.3, roughness: 0.08, glass: true }, lens: c("#aab3bd", 0.2),
      display: c("#202326", 0.4), seam: c("#4a4e52", 0.5), navy: c("#1f2f6e", 0.4), fairing: c("#c4c6c6", 0.5), roofRib: c("#9ea1a2", 0.55), pillar: c("#1b2027", 0.4),
    },
    bands: [[0, s0, "white"], [s0, s1, "stripe"], [s1, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // white over the stripe ahead of its upper edge, which falls toward the nose
      { mat: "white", front: [[s0, -9], [s1, -9]], back: [[s0, 2.75], [s1, 5.0]], face: true },
      // the stripe's point: its lower edge rising forward to meet the upper one 0.5 m behind the tip
      { mat: "stripe", front: [[1.47, 0.5], [s0, 2.75]], back: [[1.47, 0.5], [s0 - 0.002, 4.0]], face: true },
    ],
    endLettering: [{ text: "CRH", d: 0.15, y: 1.86, h: 0.26, mat: "navy" }],
    sideFields: {
      end: [
        { mat: "screen", pts: cabWindow(0.12, 0.6, 2.27, 3.26, 0.12) },
        // the seam between the cab's shell and the stainless body
        { mat: "seam", pts: [[1.18, A + 0.05], [1.21, A + 0.05], [1.21, CRH1A_S - 0.05], [1.18, CRH1A_S - 0.05]] },
        ...RUNS.end.map(([d0, d1]) => pillars(d0, d1)),
      ],
      middle: RUNS.middle.map(([d0, d1]) => pillars(d0, d1)),
    },
  };
}

/** The window runs (d behind the body's front): their panes' black pillars are one dark band behind the glass. */
const RUNS = { end: [[3.9 - JOIN, 3.9 - JOIN + 4.7], [10.25 - JOIN, 10.25 - JOIN + 15.64]], middle: [[0.75, 8.25], [9.9, 25.3]] } as const;
const pillars = (d0: number, d1: number) => ({ mat: "pillar", pts: [[r4(d0 + 0.02), CRH1A_WINDOWS[0] + 0.02], [r4(d1 - 0.02), CRH1A_WINDOWS[0] + 0.02], [r4(d1 - 0.02), CRH1A_WINDOWS[1] - 0.02], [r4(d0 + 0.02), CRH1A_WINDOWS[1] - 0.02]] as Pt[] });

/** Panes `w` long, `gap` apart, from d0. */
const run = (d0: number, n: number, w: number, gap: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [r4(d0 + i * (w + gap)), r4(d0 + i * (w + gap) + w)] as const);

/** An intermediate car's body: 26.6 m over the couplers less the gaps. */
const MID_BODY = CRH1A_MID_LENGTH - 0.5;

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

/** The CRH1A's fittings: the air conditioning unit on every roof (behind the cab on the end car, at the front end of an intermediate car), the underfloor box. */
function crh1aFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("air conditioning", () => {
    const [d0, d1] = car.end ? [4.9 - JOIN, 8.7 - JOIN] : [1.4, 5.2];
    roofBox(m, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C, 1.0, 0.24, "fairing");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), B - 0.12, B + 0.02, -CRH1A_W * 0.82, CRH1A_W * 0.82));
}

export const CRH1A: ShinkansenSeries = {
  endLength: CRH1A_END_LENGTH, midLength: CRH1A_MID_LENGTH, W: CRH1A_W, Y: CRH1A_Y, S: CRH1A_S, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH1A_FACE,
  // the large windows with narrow pillars; one plug door a side on every car, a tall narrow window in it
  windows: [CRH1A_WINDOWS], windowW: 1.85, pitch: 1.97, door: [1.25, 3.2, 1.97, 2.97], doorW: 1.15, doorGlassW: 0.5, doorGlassR: 0.08,
  layout: {
    // the end car: two panes behind the cab, the door 8.85 m behind the tip, eight panes to the rear
    end: { doors: [[8.85 - JOIN, 10.0 - JOIN, -1]], windows: [...run(3.9 - JOIN, 2, 2.3, 0.1), ...run(10.25 - JOIN, 8, 1.85, 0.12)] },
    // an intermediate car: four panes, the door 8.5 m from its front end, eight panes
    middle: { doors: [[8.5, 9.65, -1]], windows: [...run(0.75, 4, 1.8, 0.1), ...run(9.9, 8, 1.82, 0.12)] },
  },
  // the leading bogie under the cab's seam, 3.8 m behind the tip; 19.0 m bogie centres on the intermediate cars
  endBogies: [3.8 - JOIN, 23.1 - JOIN], midBogies: [3.55, MID_BODY - 3.55],
  bogieCentres: 19.0, wheelR: 0.4575, wheelbase: 2.7, cars: [4, 8],
  // the pantograph on the end car near its inner end: the leading one raised, the rear one folded
  endPantograph: true, trailingLowered: true, pantographD: 23.4,
  roofRibs: { pitch: 0.16, zMax: 1.1, mat: "roofRib" },
  numberAt: [-10.55, 1.3, 0.1],
  liveries: { crh: crhLivery() },
  fittings: crh1aFittings,
  // 420 t for eight cars; 5,300 kW from five motor cars, given as each car's share
  weight: { end: 54, middle: 52 }, power: 662.5, maxspeed: 200,
};
