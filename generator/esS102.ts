// The AVE S-102 "Pato" (Talgo 350; the S-112 is its sister for Avlo) on the series kit
// (shinkansen.ts), matched to the photographs in assets/renfe-s102/ (SOURCES.md): two 20.0 m power
// cars on two-axle bogies with the duck-bill nose, and the low 13.14 m Talgo coaches on single axles
// shared at the joints. The nose is a cab face (seriesCab.ts) whose depth is a solid of its own
// (`patoDepth`, the CRH380A's technique): the long, wide, flat bill low in front, rounded in plan
// and in profile at its lip, the lamp "eyes" in pointed lenses on its upper corners, and behind it
// the raised cab canopy - narrower than the body, its raked windscreen and the side windows in
// silver - flowing back into the 4.0 m roof. The coach next to each power car carries a roof
// fairing up to the power car's height. See docs/models/spain-trains.md.
//
// Heights over the rail; d behind the bill's tip (1.02 m up). Scales: the line scans
// (photo-renfe-ave-class-102-...-01/-02) at 36.5 px/m along and 31.4 px/m up (scan 01: the coach
// pitch 13.14 m, the power car's 4.0 m roof and the coach's 3.365 m) and 48.5 / 43.4 px/m (scan 02).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import { resolveParams, type ParamValues } from "./design.ts";
import { seriesParams, shinkansenTrain, SERIES_GAP, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import { strokeText } from "./strokeFont.ts";
import { block } from "./vehicleParts.ts";
import { c, nose } from "./seriesHelpers.ts";

/** Where the nose meets the power car's body: the canopy's rear reaches the roof there (scan 01, d 6.9). */
const JOIN = 7.0;
/** The power car's body: half width (2.942 m), belly, shoulder, crown (4.0 m), lean, bottom and skirt top. */
const [W, Y, S, C, LEAN, B, A] = [1.47, 1.0, 3.35, 4.0, 0.94, 0.55, 0.75];
/** The coaches' own shoulder and crown (3.365 m). */
const [CS, CC] = [3.15, 3.365];

type Tab = readonly Pt[];

/** A smooth (monotone cubic) interpolation through a table [x, v], held past its ends. */
function smooth(t: Tab): (x: number) => number {
  const n = t.length, xs = t.map((p) => p[0]), vs = t.map((p) => p[1]);
  const dl = xs.slice(1).map((x, i) => (vs[i + 1]! - vs[i]!) / (x - xs[i]!));
  const m = xs.map((_, i) => {
    if (i === 0) return dl[0]!;
    if (i === n - 1) return dl[n - 2]!;
    const [a, b] = [dl[i - 1]!, dl[i]!];
    if (a * b <= 0) return 0;
    const [h0, h1] = [xs[i]! - xs[i - 1]!, xs[i + 1]! - xs[i]!];
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / a + (h1 + 2 * h0) / b);
  });
  return (x) => {
    if (x <= xs[0]!) return vs[0]!;
    if (x >= xs[n - 1]!) return vs[n - 1]!;
    let i = 0;
    while (x > xs[i + 1]!) i++;
    const h = xs[i + 1]! - xs[i]!, s = (x - xs[i]!) / h;
    const [h00, h10, h01, h11] = [2 * s ** 3 - 3 * s * s + 1, s ** 3 - 2 * s * s + s, -2 * s ** 3 + 3 * s * s, s ** 3 - s * s];
    return h00 * vs[i]! + h10 * h * m[i]! + h01 * vs[i + 1]! + h11 * h * m[i + 1]!;
  };
}

/**
 * The bill by d: its half width, its top and bottom on the centre line, the height of its widest
 * line and the superellipse powers of its upper and lower halves. In profile (scan 01): the rounded
 * lip at 1.02 m, the top rising from 1.31 m 0.36 m back to 2.13 m 3.0 m back at the windscreen's foot,
 * the underside 0.6 m up from 0.5 m back; in plan full width about 2.5 m back (photo-ave-s-102-renfe-sevilla-...).
 */
const NA = smooth([[0, 0], [0.04, 0.5], [0.12, 0.76], [0.25, 0.93], [0.5, 1.1], [0.9, 1.25], [1.4, 1.35], [2.0, 1.42], [2.8, 1.46], [3.5, W]]);
const NT = smooth([[0, 1.02], [0.05, 1.15], [0.15, 1.26], [0.36, 1.34], [0.7, 1.46], [1.0, 1.56], [1.5, 1.73], [2.0, 1.87], [2.5, 2.0], [3.0, 2.13], [4.0, 2.38], [5.0, 2.68], [6.0, 3.02], [JOIN, S]]);
const NB = smooth([[0, 1.02], [0.05, 0.86], [0.15, 0.74], [0.3, 0.66], [0.5, 0.6], [0.8, 0.565], [1.2, 0.54], [JOIN, 0.54]]);
const YC = smooth([[0, 1.02], [0.6, 1.02], [2.0, 1.06], [JOIN, Y]]);
const NTE = smooth([[0, 2.0], [0.4, 2.4], [1.5, 2.8], [3.0, 3.4], [5.0, 4.5], [JOIN, 6.0]]);
const NBE = smooth([[0, 2.0], [0.4, 2.6], [1.5, 4.0], [JOIN, 6.0]]);
/**
 * The canopy by d: its crown on the centre line (scan 01: the foot at the bill's top 3.05 m back, 2.83 m
 * at 3.64 m, 3.31 m at 4.19 m, 3.6 m at 4.74 m, 3.89 m at 5.84 m, the 4.0 m roof at the join) and its
 * half width at its foot (about two thirds of the body's at the windscreen, photo-ave-s-102.jpg).
 */
const CANOPY_D = 3.0;
const HB = smooth([[3.0, 2.1], [3.1, 2.3], [3.35, 2.58], [3.64, 2.83], [4.19, 3.31], [4.74, 3.6], [5.29, 3.79], [5.84, 3.89], [6.4, 3.96], [JOIN, C]]);
const WB = smooth([[3.0, 0.8], [3.3, 0.86], [3.8, 0.94], [4.5, 1.03], [5.5, 1.14], [6.4, 1.26], [JOIN, 1.34]]);
/** The canopy's walls rise from FOOT (inside the bill) and round over into its top. */
const [FOOT, CPOW] = [1.9, 2.6];

/** The power car body's own section: its half width at height y. */
function bodyHalf0(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * Math.max(0, (y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  if (y <= S) return W * (1 - (1 - LEAN) * ((y - Y) / (S - Y)));
  return y < C ? W * LEAN * Math.sqrt(1 - ((y - S) / (C - S)) ** 2) : 0;
}

function billHalf(d: number, y: number): number {
  const [a, top, bot, yc] = [NA(d), NT(d), NB(d), YC(d)];
  const [u, n] = y >= yc ? [(y - yc) / Math.max(1e-6, top - yc), NTE(d)] : [(yc - y) / Math.max(1e-6, yc - bot), NBE(d)];
  return u >= 1 ? 0 : a * Math.pow(1 - Math.pow(u, n), 1 / n);
}

function canopyHalf(d: number, y: number): number {
  if (d < CANOPY_D) return 0;
  const [hb, wb] = [HB(d), WB(d)];
  if (y >= hb) return 0;
  if (y <= FOOT) return wb;
  const u = (y - FOOT) / (hb - FOOT);
  return wb * Math.pow(1 - Math.pow(u, CPOW), 1 / CPOW);
}

/** The nose's half width at d and height y: the bill or the canopy, drawn into the body's section over the last metre, never wider than it. */
function halfAt(d: number, y: number): number {
  let w = Math.max(billHalf(d, y), canopyHalf(d, y));
  if (d > JOIN - 1.2) {
    const t = Math.min(1, (d - (JOIN - 1.2)) / 1.2), s = t * t * (3 - 2 * t);
    w += (bodyHalf0(y) - w) * s;
  }
  return Math.min(w, bodyHalf0(y));
}

/** The first d at which the nose reaches lat at height y (bisection: the half width grows toward the join). */
function sectionDepth(lat: number, y: number): number {
  if (halfAt(JOIN, y) <= lat) return JOIN;
  let [a, b] = [0, JOIN];
  for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (halfAt(m, y) > lat) b = m; else a = m; }
  return b;
}

/** The surface's depth at (lat, y); cached (the grid asks each point many times). */
const DEPTH = new Map<number, Map<number, number>>();
export function patoDepth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = Math.round(sectionDepth(lat, y) * 1e5) / 1e5; row.set(lat, v); }
  return v;
}

/** The surface's lateral position at depth d and height y (the inverse of patoDepth across the nose), or undefined where the nose does not reach. */
function latAt(d: number, y: number): number | undefined {
  const hw = bodyHalf0(y);
  if (sectionDepth(0, y) > d) return undefined;
  let [a, b] = [0, hw];
  for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (sectionDepth(m, y) <= d) a = m; else b = m; }
  return a;
}

/** The grid's rows: dense over the lip, the stripes, the lamps and the canopy. */
const ROWS = [B, 0.63, 0.72, 0.78, 0.86, 0.94, 1.02, 1.09, 1.16, 1.24, 1.32, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.42, 2.52, 2.64, 2.78, 2.92, 3.06, 3.2, 3.35, 3.5, 3.64, 3.8, 3.92, C];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, patoDepth(0, y)]);

/** The canopy's foot along the sides, [y, d]: where its wall meets the bill's top (the silver's lower edge). */
const CANOPY_EDGE: Pt[] = (() => {
  const out: Pt[] = [];
  for (const y of [2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4]) {
    // the first d at which the bill's top at the canopy's wall rises above y
    let dv = JOIN;
    for (let d = CANOPY_D; d <= JOIN; d += 0.02) if (billHalf(d, y) >= WB(d) - 0.01) { dv = d; break; }
    out.push([y, Math.round(dv * 1e3) / 1e3]);
  }
  return out;
})();

/** A symmetric outline [lat, y] from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The windscreen seen head on: one wide pane, its foot just over the canopy's, its top corners rounded under the crown. */
const SCREEN: Pt[] = mirror([[0, 2.34], [0.66, 2.34], [0.71, 2.39], [0.71, 2.62], [0.67, 3.0], [0.6, 3.3], [0.5, 3.43], [0.3, 3.48], [0, 3.49]]);

/** A line of paint along a centre line [d, y] of a thickness [d, t], as a sweep's front and back edges by height (`up` rising toward the rear). */
function line(centre: Tab, thick: Tab, up: boolean): { front: Pt[]; back: Pt[] } {
  const n = 30, [d0, d1] = [centre[0]![0], centre[centre.length - 1]![0]];
  const ds = Array.from({ length: n + 1 }, (_, i) => d0 + ((d1 - d0) * i) / n);
  const hi = ds.map((d): Pt => [edgeAt(centre, d) + edgeAt(thick, d) / 2, d]);
  const lo = ds.map((d): Pt => [edgeAt(centre, d) - edgeAt(thick, d) / 2, d]);
  const byY = (pts: Pt[]) => [...pts].sort((p, q) => p[0] - q[0]).filter((p, i, a) => i === 0 || p[0] > a[i - 1]![0] + 1e-6).map(([y, d]): Pt => [Math.round(y * 1e4) / 1e4, Math.round(d * 1e4) / 1e4]);
  return up ? { front: byY(hi), back: byY(lo) } : { front: byY(lo), back: byY(hi) };
}

/** The front module's seams (scan 01): upright down the bill's side 2.88 m back, then rising along the side to the roof behind the canopy. */
const SEAM_UP = { front: [[0.56, 2.865], [2.0, 2.865]] as Pt[], back: [[0.56, 2.895], [2.0, 2.895]] as Pt[] };
const SEAM_RISE = line([[2.88, 1.59], [3.8, 1.75], [4.74, 2.0], [5.3, 2.25], [5.84, 2.55], [6.4, 2.85], [6.88, 3.09]], [[2.88, 0.03], [6.88, 0.03]], true);

const PATO_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 6.0, first: JOIN + 1.0, reach: 0, roofFrom: 9, cols: [6, 8, 1, 2], tolerance: 0.08,
  profile: PROFILE, corner: [[B, 1.0], [C, 1.0]], cornerDepth: [[B, 1.0], [C, 1.0]], rows: ROWS,
  reshape: (lat, y) => patoDepth(lat, y),
  bands: (l) => l.bands,
  // the wheel arch over the leading bogie, under the canopy
  wheelCut: { d: 3.85, y: 0.8 },
  paint: [
    // the canopy's silver down to its foot, and the power car's roof behind it
    { mat: "canopy", front: [[2.2, -9], [C, -9]], back: [...CANOPY_EDGE, [C, JOIN + 0.1]], top: C + 0.1 },
    { mat: "roofG", front: [[S, JOIN - 0.35], [C, JOIN - 0.35]], back: [[S, JOIN + 0.1], [C, JOIN + 0.1]], top: C + 0.1 },
    // the cab's side window on the canopy's flank: its front edge raked like the windscreen
    { mat: "cabMask", front: [[2.47, 3.7], [3.3, 4.66]], back: [[2.47, 5.28], [3.3, 5.12]], lat: 1.1 },
    { mat: "screenGlass", front: [[2.52, 3.8], [3.25, 4.72]], back: [[2.52, 5.2], [3.25, 5.06]], lat: 1.1 },
  ],
  fields: [
    { mat: "cabMask", pts: mirror([[0, 2.3], [0.7, 2.3], [0.75, 2.36], [0.75, 2.62], [0.71, 3.02], [0.63, 3.34], [0.52, 3.48], [0.3, 3.53], [0, 3.54]]) },
    { mat: "screenGlass", pts: SCREEN },
    // the two air intakes on the bill's top at the windscreen's foot
    { mat: "cabMask", pts: [[0.08, 2.0], [0.42, 2.0], [0.4, 2.1], [0.1, 2.1]] },
    { mat: "cabMask", pts: [[-0.1, 2.1], [-0.4, 2.1], [-0.42, 2.0], [-0.08, 2.0]] },
  ],
  panes: [], lodGlass: { hw: 0.7, y: [2.34, 3.45] },
  wipers: [[[0.05, 2.38], [-0.3, 2.95]]],
  // the distant model's nose: the bill and the canopy on few rows
  lod: { profile: [[B, 1.2], [1.02, 0], [1.6, 1.0], [2.13, 3.0], [2.8, 3.6], [3.5, 4.55], [C, JOIN]], corner: [[B, 1.2], [C, 1.2]], cornerDepth: [[B, 2.2], [1.02, 2.2], [1.6, 2.2], [2.13, 3.4], [2.8, 2.6], [3.5, 1.8], [C, 0.02]], rows: [B, 1.02, 1.6, 2.13, 2.8, 3.5, C] },
};

// ---------------------------------------------------------------------------
// Liveries

/** The coaches' window band (both liveries' panes; the AVE's band dark round them): from behind the door to the inner end. */
const BAND: readonly [number, number] = [1.43, 2.33];
const BAND_D: readonly [number, number] = [1.95, 12.55];

/**
 * Renfe's AVE scheme since 2017 (the line scans, photo-202112-..., photo-ave-s-102-renfe-sevilla-...):
 * white, a grey line over a purple stripe low on the sides, both dipping along the bill to wrap round
 * its lip under the tip; the silver canopy; the coaches' dark window band.
 */
const AVE: ShinkansenLivery = {
  title: "AVE", number: "102 005",
  palette: {
    white: c("#efefeb", 0.35), purple: c("#7a1f5c", 0.35), grey: c("#8e9398", 0.4), roofG: c("#c8ccd0", 0.5), skirtG: c("#e2e2de", 0.5),
    canopy: { color: "#a9b1b9", metallic: 0.5, roughness: 0.25 }, band: c("#2c3440", 0.25), seam: c("#3a3d42", 0.6),
    cabMask: c("#1b1e22", 0.3), screenGlass: { color: "#2e3d4a", metallic: 0.4, roughness: 0.08, glass: true },
    lampCover: { color: "#cfd6dc", metallic: 0.3, roughness: 0.1, glass: true }, lampRim: c("#2a2d31", 0.4), logo: c("#7a1f5c", 0.4), logoBlue: c("#5a62a8", 0.4),
  },
  bands: [[0, 0.78, "white"], [0.78, 1.03, "purple"], [1.03, 1.09, "white"], [1.09, 1.16, "grey"], [1.16, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // on the bill: white over the stripes' level, then the stripes dipping to the lip
    { mat: "white", front: [[0.95, -9], [1.16, -9]], back: [[0.95, 3.0], [1.16, 3.0]], face: true },
    { mat: "purple", front: [[0.95, 0], [0.99, 1.2], [1.03, 2.6]], back: [[0.95, 3.02], [1.03, 3.02]], face: true },
    { mat: "grey", front: [[0.98, -9], [1.0299, -9], [1.03, 0], [1.1, 1.5], [1.16, 3.0]], back: [[0.98, 0], [1.04, 1.5], [1.09, 3.0], [1.16, 3.02]], face: true },
    { mat: "seam", ...SEAM_UP },
    { mat: "seam", ...SEAM_RISE },
  ],
  sideFields: { middle: [{ mat: "band", pts: [[BAND_D[0], BAND[0]], [BAND_D[1], BAND[0]], [BAND_D[1], BAND[1]], [BAND_D[0], BAND[1]]] }] },
  lodSideFields: { middle: [{ d: BAND_D, bands: [[0, 0.78, "white"], [0.78, 1.03, "purple"], [1.03, BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]] }] },
};

/** Avlo's three stripes falling from the canopy's foot along the power car: centre lines [d, y] and thicknesses [d, t] (photo-avlo-...). */
const AVLO_STRIPES: ReadonlyArray<{ mat: string; centre: Pt[]; thick: Pt[] }> = [
  { mat: "sky", centre: [[3.8, 1.98], [5.5, 1.68], [7.5, 1.34], [9.2, 1.08]], thick: [[3.8, 0.0], [4.6, 0.17], [8.6, 0.17], [9.2, 0.0]] },
  { mat: "white", centre: [[6.6, 1.78], [8.5, 1.4], [10.2, 1.06]], thick: [[6.6, 0.0], [7.2, 0.09], [9.6, 0.09], [10.2, 0.0]] },
  { mat: "orange", centre: [[5.3, 2.3], [7.0, 1.95], [9.0, 1.5], [11.0, 1.1]], thick: [[5.3, 0.0], [6.0, 0.24], [10.3, 0.24], [11.0, 0.0]] },
];

/** A sweep kept on the body behind the nose's join (the face's grid cannot hold a stripe crossing its bulging sides). */
const behindJoin = (w: { front: Pt[]; back: Pt[] }) => ({ front: w.front.map(([y, d]): Pt => [y, Math.max(d, JOIN + 0.01)]), back: w.back });

/** Avlo's (the S-112 sets since 2021, photo-avlo-51066210946.jpg): magenta all over, the lilac canopy and roof, orange, white and light-blue stripes falling from the canopy's foot along the power car; orange door leaves. */
const AVLO: ShinkansenLivery = {
  title: "Avlo", number: "112 015",
  palette: {
    magenta: c("#a8197c", 0.35), roofG: c("#aab4d8", 0.45), skirtG: c("#5a2350", 0.6), orange: c("#f08a3e", 0.35), sky: c("#86d3e4", 0.35), white: c("#f3f1f1", 0.35),
    canopy: { color: "#a3aed6", metallic: 0.35, roughness: 0.3 }, seam: c("#5e1146", 0.6),
    cabMask: c("#1b1e22", 0.3), screenGlass: { color: "#2e3d4a", metallic: 0.4, roughness: 0.08, glass: true },
    lampCover: { color: "#cfd6dc", metallic: 0.3, roughness: 0.1, glass: true }, lampRim: c("#2a2d31", 0.4), logo: c("#f3f1f1", 0.4), logoBlue: c("#86d3e4", 0.4),
  },
  bands: [[0, 9, "magenta"]],
  doors: [[0, 9, "orange"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    { mat: "seam", ...SEAM_UP },
    { mat: "seam", ...SEAM_RISE },
    // the three stripes, from the canopy's foot down along the power car
    // the three stripes on the body behind the nose (the nose's part drawn on its surface: patoFittings)
    // (clear of the crew door's leaf, 7.64 - 8.49 m back: the door keeps the coaches' orange)
    ...AVLO_STRIPES.flatMap((st) => { const w = behindJoin(line(st.centre, st.thick, false)); const cl = (e: Pt[], lo: number, hi: number) => e.map(([y, d]): Pt => [y, Math.min(hi, Math.max(lo, d))]); return [{ mat: st.mat, front: w.front, back: cl(w.back, -9, 7.6) }, { mat: st.mat, front: cl(w.front, 8.53, 99), back: w.back }]; }),
  ],
};

// ---------------------------------------------------------------------------
// The series

/** The power car's sides (d behind the tip; scan 01): the grille near the rear (the crew door: endSides). */
const POWER_PANELS = [
  { d: [14.4, 15.9] as const, y: [2.2, 3.0] as const, kind: "louvres" as const, louvres: 9 },
];

/** A coach (d from its +X end; scan 02): the door at the front end with a narrow rounded window, five windows 1.44 m wide, 1.86 m apart, in the band. */
const COACH_WINDOWS = Array.from({ length: 5 }, (_, i): readonly [number, number] => [3.0 + 1.86 * i, 4.44 + 1.86 * i]);

/** The lone axle's inset from a coach's end beside a power car (and a lone coach's at both ends), its frame inside the body. */
const COACH_AXLE_INSET = 0.95;

export const S102: ShinkansenSeries = {
  // 20.0 m power cars, 13.14 m coaches; the coaches 3.365 m high, the power cars 4.0 m
  endLength: 20.0, midLength: 13.14, W, Y, S, C, lean: LEAN, B, A,
  nose: nose(0.1, 1, 2, [[0, C]], [[0, S]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: PATO_FACE,
  trailerSection: { S: CS, C: CC },
  windows: [[1.47, 2.26]], windowW: 1.44, pitch: 1.86, door: [0.8, 2.95, 1.45, 2.3], doorW: 1.05, doorGlassW: 0.36, doorGlassR: 0.1,
  layout: {
    end: { doors: [], windows: [] },
    middle: { doors: [[0.8, 1.85, 1]], windows: COACH_WINDOWS },
  },
  // the crew door behind the cab (scan 01: 7.64 - 8.49 m behind the tip; drawn at the coaches' door heights)
  endSides: { windows: [], doors: [[7.64 - JOIN, 8.49 - JOIN]] },
  // the coach's seat-reservation display ahead of its door (scan 02)
  sidePanels: { end: POWER_PANELS, middle: [{ d: [0.22, 0.62], y: [1.98, 2.16], kind: "panel", mat: "cabMask", screen: "screenGlass" }] },
  numberAt: [2.4, 0.6, 0.1],
  // the power car's Bo'Bo' bogies 10.8 m apart (scan 01: 5.6 m and 16.4 m behind the tip, 2.65 m wheelbase)
  endBogies: [5.6 - JOIN, 16.4 - JOIN], endCarBogie: { wheelbase: 2.65, wheelR: 0.5 },
  // the Talgo coaches on single axles shared at the joints (wheelbase 0); beside a power car the coach's own axle
  bogieCentres: 5.6, wheelR: 0.44, wheelbase: 0, jacobsTrailers: COACH_AXLE_INSET,
  // each power car raises its single-arm pantograph over its rear bogie (scan 01: the roof equipment 16 - 19.4 m back)
  endPantograph: true, pantographAt: 17.2 - JOIN,
  cars: [4, 8], minCars: 3,
  liveries: { ave: AVE, avlo: AVLO },
  weight: { end: 72, middle: 15 }, power: 4000, maxspeed: 330,
};

const P = seriesParams(S102);

// ---------------------------------------------------------------------------
// Fittings: the lamp eyes, the "renfe" lettering, the coaches' roof fairing beside the power cars

/** A lens on the bill's upper corner, [d, y] corners (scan 01: the pointed kite 0.63 - 2.0 m back, 1.24 - 1.6 m up). */
const EYE: Pt[] = [[0.6, 1.31], [1.0, 1.47], [1.38, 1.6], [1.8, 1.6], [2.03, 1.45], [1.75, 1.33], [1.45, 1.24], [1.0, 1.25]];
/** Grown by k about its centre. */
const grow = (pts: Pt[], k: number, dy = 0): Pt[] => {
  const [cd, cy] = [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  return pts.map(([d, y]): Pt => [cd + (d - cd) * (1 + k), cy + (y - cy) * (1 + k * 2) + dy]);
};

/** A point on the nose's surface (d behind the tip, height y) on side sd, `proud` off it along its normal; undefined off the nose. */
function surfacePoint(X: (d: number) => number, sd: number, d: number, y: number, proud: number): Vec3 | undefined {
  const lat = latAt(d, y);
  if (lat === undefined) return undefined;
  // the normal from the surface's gradient: depth grows with lat and falls with y
  const e = 0.01, dl = (sectionDepth(lat + e, y) - sectionDepth(Math.max(0, lat - e), y)) / (lat + e - Math.max(0, lat - e)), dy = (sectionDepth(lat, y + e) - sectionDepth(lat, y - e)) / (2 * e);
  // surface: x = X(d - JOIN) (x falls as d grows), z = sd * lat; its outward normal points ahead (+x), outward (sd z) and down where it rises
  const nx = 1, nz = dl, ny = dy;
  const k = Math.hypot(nx, ny, nz);
  return [X(d - JOIN) + (nx / k) * proud, y + (ny / k) * proud, sd * (lat + (nz / k) * proud)];
}

/** A convex polygon on the nose's surface as triangles facing outward, its fan cut finer. */
function onNose(m: MeshBuilder, X: (d: number) => number, sd: number, mat: string, pts: Pt[], proud: number, k = 3): void {
  const c0: Pt = [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i < pts.length; i++) {
    const [p, q] = [pts[i]!, pts[(i + 1) % pts.length]!];
    for (let r = 0; r < k; r++) {
      const [a0, a1, b0, b1] = [lerp(c0, p, r / k), lerp(c0, p, (r + 1) / k), lerp(c0, q, r / k), lerp(c0, q, (r + 1) / k)];
      const quads: Pt[][] = r === 0 ? [[a0, a1, b1]] : [[a0, a1, b1], [a0, b1, b0]];
      for (const t of quads) {
        const v = t.map(([d, y]) => surfacePoint(X, sd, d, y, proud));
        if (v.some((x) => !x)) continue;
        const [A3, B3, C3] = v as [Vec3, Vec3, Vec3];
        // outward: the triangle's normal has the side's sign across
        const u = [B3[0] - A3[0], B3[1] - A3[1], B3[2] - A3[2]], w = [C3[0] - A3[0], C3[1] - A3[1], C3[2] - A3[2]];
        const nz = u[0]! * w[1]! - u[1]! * w[0]!;
        if (nz * sd >= 0) m.tri(mat, A3, B3, C3);
        else m.tri(mat, A3, C3, B3);
      }
    }
  }
}

/** A disc on the nose's surface, its centre [d, y], radius r (in d and y). */
const disc = (cd: number, cy: number, r: number, n = 10): Pt[] => Array.from({ length: n }, (_, i): Pt => [cd + r * Math.cos((2 * Math.PI * i) / n), cy + r * 0.8 * Math.sin((2 * Math.PI * i) / n)]);

/** Bars of width t along polylines in a glyph's unit cell (x 0..1 across, y 0..1 up), as triangles (u, v). */
function bars(lines: Pt[][], u0: number, v0: number, h: number, t: number): Pt[] {
  const out: Pt[] = [];
  const P = ([x, y]: Pt): Pt => [u0 + x * h * 0.58, v0 + y * h];
  for (const l of lines) for (let i = 0; i + 1 < l.length; i++) {
    const [a, b] = [P(l[i]!), P(l[i + 1]!)];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], k = Math.hypot(dx, dy), [nx, ny] = [(-dy / k) * t / 2, (dx / k) * t / 2];
    out.push([a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [a[0] + nx, a[1] + ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]);
  }
  return out;
}

/** The lower-case letters the stroke font lacks: Renfe's f, Avlo's v and l. */
const OWN_GLYPHS: Record<string, Pt[][]> = {
  f: [[[0.4, 0], [0.4, 0.82], [0.55, 1.0], [0.85, 1.0]], [[0.12, 0.62], [0.75, 0.62]]],
  v: [[[0.15, 0.65], [0.5, 0], [0.85, 0.65]]],
  l: [[[0.5, 0], [0.5, 1.0]]],
};

/** A lower-case word on the power car's side, d0 its front end behind the body's front: the stroke font's letters and our own. */
function word(text: string, d0: number, y: number, h: number): Pt[] {
  const [w, gap, t] = [h * 0.58, h * 0.16, h * 0.16];
  return [...text].flatMap((ch, i) => {
    const u = d0 + i * (w + gap);
    return OWN_GLYPHS[ch] ? bars(OWN_GLYPHS[ch]!, u, y, h, t) : strokeText(ch, u, y, h, w, gap, false, t);
  });
}

/** A word's width in `word`. */
const wordWidth = (text: string, h: number) => text.length * h * 0.74 - h * 0.16;

/** The power car's lettering by livery: [text, d0 behind the tip, foot, height, ink]. */
const LETTERING: Record<string, ReadonlyArray<readonly [string, number, number, number, string]>> = {
  // "renfe" over the AVE mark behind the crew door (scan 01: 10.8 - 13.2 m back, 2.22 m foot; AVE 12.65 - 13.9 m, 1.42 - 1.87 m up)
  ave: [["renfe", 10.8, 2.22, 0.68, "logo"], ["AVE", 12.65, 1.42, 0.45, "logoBlue"]],
  // a small "renfe" over the big white "avlo" (photo-avlo-...: 9.6 - 11.6 m back, 1.62 - 2.4 m up)
  avlo: [["renfe", 9.7, 2.5, 0.26, "logo"], ["avlo", 9.6, 1.62, 0.72, "logo"]],
};

/** The fairing on a coach's roof beside a power car (scan 01, photo-avlo-...): the power car's 4.0 m roof carried on 4.4 m, then falling to the coach's in 3.3 m. */
function fairing(m: MeshBuilder, X: (d: number) => number, front: boolean, L: number, mat: string): void {
  const top = smooth([[0, C - 0.02], [4.4, C - 0.02], [5.5, 3.82], [6.6, 3.55], [7.7, CC + 0.04]]);
  const hw = W * LEAN + 0.015, base = CS - 0.03, n = 9;
  const ds = [0, 1.1, 2.2, 3.3, 4.4, 4.95, 5.5, 6.05, 6.6, 7.15, 7.7];
  const ring = (d: number): Vec3[] => {
    const h = top(d), x = X(front ? d : L - d);
    return Array.from({ length: n + 1 }, (_, i): Vec3 => {
      const a = (Math.PI * i) / n, cz = Math.cos(a), sz = Math.sin(a);
      // a superellipse arch from one wall's foot over the crown to the other
      const z = hw * Math.sign(cz) * Math.pow(Math.abs(cz), 0.6), yy = base + (h - base) * Math.pow(sz, 0.45);
      return [x, yy, z];
    });
  };
  const rings = ds.map(ring);
  const fwd = (v: Vec3[], k: number) => (front ? v : v)[k]!;
  for (let j = 0; j + 1 < rings.length; j++)
    for (let i = 0; i < n; i++) {
      const [a, b, p, q] = [fwd(rings[j]!, i), fwd(rings[j]!, i + 1), fwd(rings[j + 1]!, i), fwd(rings[j + 1]!, i + 1)];
      // outward: the arch's normal points up and out
      if (front) { m.tri(mat, a, p, q); m.tri(mat, a, q, b); } else { m.tri(mat, a, q, p); m.tri(mat, a, b, q); }
    }
  // the end walls: at the joint and where it meets the coach's roof
  for (const [j, out] of [[0, 1], [rings.length - 1, -1]] as const) {
    const r = rings[j]!, ctr: Vec3 = [r[0]![0], base, 0];
    for (let i = 0; i < n; i++) {
      const sgn = (front ? out : -out);
      if (sgn > 0) m.tri(mat, ctr, r[i]!, r[i + 1]!); else m.tri(mat, ctr, r[i + 1]!, r[i]!);
    }
  }
}

function patoFittings(cars: number, livery: string) {
  const slots = cars ? shinkansenTrain(S102, cars) : [];
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void => {
    const tr = car.trucks;
    m.scope("underfloor", () => block(m, "under", Math.min(X(tr[1]! - 2.4), X(tr[0]! + 2.4)), Math.max(X(tr[1]! - 2.4), X(tr[0]! + 2.4)), B - 0.3, B, -W * 0.8, W * 0.8));
    if (car.end) {
      m.scope("lamps", () => {
        for (const sd of [1, -1]) {
          m.scope("rim", () => onNose(m, X, sd, "lampRim", grow(EYE, 0.05), 0.012));
          m.scope("lens", () => onNose(m, X, sd, "lampCover", EYE, 0.02));
          m.scope("lamp", () => onNose(m, X, sd, "lampHead", disc(1.28, 1.44, 0.075), 0.026, 1));
          m.scope("lamp", () => onNose(m, X, sd, "lampHead", disc(1.55, 1.44, 0.065), 0.026, 1));
        }
      });
      // "renfe" on the bill's flank behind the eye (photo-ave-s-102-renfe-sevilla-..., photo-202112-...: 2.0 - 3.2 m back, 1.62 - 1.9 m up)
      m.scope("bill lettering", () => {
        const [d0, y0, h] = [2.0, 1.6, 0.3], wd = wordWidth("renfe", h), t = word("renfe", d0, y0, h);
        for (const sd of [1, -1]) {
          const tris = sd > 0 ? t.map(([d, y]): Pt => [2 * d0 + wd - d, y]) : t;
          for (let i = 0; i + 2 < tris.length; i += 3) onNose(m, X, sd, "logo", [tris[i]!, tris[i + 1]!, tris[i + 2]!], 0.008, 1);
        }
      });
      if (livery === "avlo") m.scope("stripes", () => AVLO_STRIPES.forEach((st, i) => {
        // quads along the stripe on the nose's surface, ahead of the join
        const [d0, d1] = [st.centre[0]![0], Math.min(JOIN + 0.02, st.centre[st.centre.length - 1]![0])];
        const n = Math.max(1, Math.ceil((d1 - d0) / 0.2));
        const at = (d: number, e: number): Pt => [d, edgeAt(st.centre, d) + (e * edgeAt(st.thick, d)) / 2];
        for (const sd of [1, -1]) for (let k = 0; k < n; k++) {
          const [a, b2] = [d0 + ((d1 - d0) * k) / n, d0 + ((d1 - d0) * (k + 1)) / n];
          onNose(m, X, sd, st.mat, [at(a, -1), at(b2, -1), at(b2, 1), at(a, 1)], 0.006 + 0.002 * i, 1);
        }
      }));
      m.scope("lettering", () => {
        for (const [text, dt, y, h, ink] of LETTERING[livery] ?? []) {
          const d0 = dt - JOIN, wd = wordWidth(text, h);
          // upper case from the stroke font with its own proportions
          const tris = /[A-Z]/.test(text) ? strokeText(text, d0, y, h, h * 0.62, h * 0.14, false, h * 0.15) : word(text, d0, y, h);
          const w2 = /[A-Z]/.test(text) ? text.length * h * 0.76 - h * 0.14 : wd;
          // read front to back on the left (-Z) side, back to front on the right: mirrored there
          for (const sd of [1, -1]) sideDecal(m, b, X, sd, ink, sd > 0 ? tris.map(([d, yy]): Pt => [2 * d0 + w2 - d, yy]) : tris, 0.004);
        }
      });
      return;
    }
    // a coach beside a power car in a train: its roof fairing at that end
    const k = slots.findIndex((sl) => !sl.end && Math.abs(sl.hi - SERIES_GAP - X(0)) < 1e-6);
    if (k < 0) return;
    const roof = "roofG";
    if (k === 1) m.scope("fairing", () => fairing(m, X, true, car.length, roof));
    if (k === slots.length - 2) m.scope("rear fairing", () => fairing(m, X, false, car.length, roof));
  };
}

/** The series for one build: its fittings knowing the train's length (which coaches stand beside the power cars). */
export function s102Series(v?: ParamValues): ShinkansenSeries {
  const p = resolveParams(P, v);
  return { ...S102, fittings: patoFittings(p.unit === "train" ? Number(p.cars ?? 4) : 0, p.livery ?? "ave") };
}
