// Iryo's Frecciarossa 1000 (Renfe class 109; the Hitachi/Bombardier Zefiro V300, FS ETR 1000):
// eight cars, 202 m, after the photographs in assets/iryo-s109/ (SOURCES.md). Its long "shark"
// nose as a cab face (seriesCab.ts) whose depth is a solid of its own (`s109Depth`): the round
// coupler cap on the tip, behind it the nose rising in one long convex line to the roof 6.2 m
// back, the black visor round the windscreen on its top, the round headlamp under the glass and
// the lamp slits on the nose's flanks at the front of the black stripe. The livery: a red body,
// the dark roof, the black window band between thin silver lines, the silver lower body; on the
// nose the black band runs down to the lamps under a silver line that meets the cap's own
// stripe, and the silver lower body rises toward the cab door. See docs/models/spain-trains.md.
//
// Heights over the rail, d behind the tip (the cap's front, 0.95 m up), lat from the centre line.
// Measured in photo-iryo-109-manzanares-03.jpg (side, 3/4 from below; a 1-D projective fit along
// the end car - its tip, its joint and six equal window pitches - gives the d of every feature
// and the leading bogie's wheelbase as the published 2.85 m with a 27.6 m end car; heights at
// about 30 px/m, rail to crown 4.0 m) and photo-s109-de-iryo-realizando-un-trayecto-madrid-malaga.jpg
// (the end car's length over an intermediate car's, 1.13 - 1.16, from the joints along the
// train); the face's colours and lamps from photo-etr-1000-spain.jpg and
// photo-iryo-frecciarossa-a-barcelona-sants.jpg, the roof from photo-iryo-fr-1000-quatre-camins-2023.jpg.

import type { Pt } from "./sliceLoft.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";

/** Where the nose meets the body's own section: behind the leading bogie (the nose's skirt covers both its wheelsets alike), the crown at full height from 6.2 m. */
const JOIN = 7.4;
/** The body: half width (2,924 mm), belly, shoulder, crown, lean, skirt bottom and top. */
const [W, Y, S, C, LEAN, B, A] = [1.46, 1.35, 3.7, 4.0, 0.95, 0.55, 1.0];
/** The lengths over the couplers: the end car's and an intermediate car's (202.0 m in eight cars). */
const END_LENGTH = 27.6;
const MID_LENGTH = 24.47;

type Tab = readonly Pt[];

/** The body's half width at height y (the kit's section: tucked in under the belly, leaning in to the shoulder, the roof's arc). */
function bodyHalf0(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * Math.max(0, (y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  if (y <= S) return W * (1 - (1 - LEAN) * ((y - Y) / (S - Y)));
  return y < C ? W * LEAN * Math.sqrt(1 - ((y - S) / (C - S)) ** 2) : 0;
}

/** A smooth (monotone cubic, C1) interpolation through a table [x, v], held past its ends. */
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
 * The nose's section by d: a superellipse round its widest height (half width, top, bottom, the widest
 * height, the upper and lower powers). The tip is the coupler cap: a blunt, upright bumper 0.55 - 1.76 m
 * high, its front 0.95 m up; behind it the top rises in one convex line (the measured profile:
 * 2.17 m at 1.1 m, 2.53 m at 1.9 m, 3.28 m at 3.5 m, 3.83 m at 5.3 m, the crown 6.2 m back).
 */
const NA = smooth([[0, 0], [0.03, 0.42], [0.1, 0.66], [0.25, 0.84], [0.45, 0.95], [0.7, 1.03], [1.0, 1.1], [1.5, 1.18], [2.0, 1.24], [3.0, 1.32], [4.0, 1.38], [5.0, 1.43], [6.2, W]]);
const NT = smooth([[0, 0.95], [0.05, 1.22], [0.19, 1.53], [0.4, 1.76], [0.7, 1.96], [1.14, 2.17], [1.91, 2.53], [2.71, 2.91], [3.54, 3.28], [4.4, 3.59], [5.29, 3.83], [5.8, 3.94], [6.2, C]]);
const NB = smooth([[0, 0.95], [0.04, 0.7], [0.15, 0.6], [0.4, 0.5], [1.0, 0.42], [6.2, 0.42]]);
const YC = smooth([[0, 0.95], [0.4, 1.0], [1.0, 1.05], [2.0, 1.15], [4.0, 1.28], [6.2, Y]]);
const NTE = smooth([[0, 3.2], [0.4, 2.8], [1.5, 2.4], [3.0, 2.3], [6.2, 2.3]]);
const NBE = smooth([[0, 3.0], [0.4, 3.6], [1.5, 5.0], [6.2, 6.0]]);
/** The tip's height (the cap's front) for the distant model. */
const TIP_Y = 0.95;

/** The superellipse section's half width at d and height y (0 off it). */
function superHalf(d: number, y: number): number {
  const [a, top, bot, yc] = [NA(d), NT(d), NB(d), YC(d)];
  const [u, n] = y >= yc ? [(y - yc) / Math.max(1e-6, top - yc), NTE(d)] : [(yc - y) / Math.max(1e-6, yc - bot), NBE(d)];
  return u >= 1 ? 0 : a * Math.pow(1 - Math.pow(u, n), 1 / n);
}

/** The nose's half width at d and height y: its section, drawn into the body's own over the last 2.2 m. */
function halfAt(d: number, y: number): number {
  let w = superHalf(d, y);
  if (d > 4.0) {
    const t = Math.min(1, (d - 4.0) / (JOIN - 4.0)), s = t * t * (3 - 2 * t);
    w += (bodyHalf0(y) - w) * s;
  }
  return w;
}

/** The first d at which the nose reaches lat at height y (bisection; the half width only grows toward the join). */
function sectionDepth(lat: number, y: number): number {
  if (halfAt(JOIN, y) <= lat) return JOIN;
  let [a, b] = [0, JOIN];
  for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (halfAt(m, y) > lat) b = m; else a = m; }
  return b;
}

/** The surface's depth at (lat, y); cached (the grid asks each point many times). */
const DEPTH = new Map<number, Map<number, number>>();
export function s109Depth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = Math.round(sectionDepth(lat, y) * 1e5) / 1e5; row.set(lat, v); }
  return v;
}

/** The grid's rows: dense over the cap and its stripes, the lamps and the visor. */
const ROWS = [B, 0.75, 0.95, A, 1.15, 1.48, 1.64, 1.76, 2.05, 2.35, 2.65, 2.95, 3.25, 3.55, 3.8, 3.94, C];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, s109Depth(0, y)]);

/** A stripe between two edges given as [d, y] polylines along the nose (both rising rearward, `top` above `bottom`), as a sweep's front and back edges by height. */
function between(top: Tab, bottom: Tab): { front: Pt[]; back: Pt[] } {
  const byY = (pts: Tab) => pts.map(([d, y]): Pt => [y, d]).sort((p, q) => p[0] - q[0]);
  return { front: byY(top), back: byY(bottom) };
}

/** The silver line over the black band: from the cap's stripe up along the nose to the band's top behind the cab window. */
const LINE_TOP: Pt[] = [[0.5, 1.64], [1.14, 1.93], [1.91, 2.2], [3.54, 2.6], [5.0, 2.98], [6.22, 3.3], [7.3, 3.37]];
const LINE_FOOT: Pt[] = [[0.5, 1.48], [1.14, 1.77], [1.91, 2.06], [3.54, 2.45], [5.0, 2.82], [6.22, 3.14], [7.3, 3.17]];
/** The black band's foot on the nose: from its point at the lamps up to 2.8 m over the lettering. */
const BLACK_FOOT: Pt[] = [[1.9, 2.0], [2.6, 2.1], [3.54, 2.24], [5.0, 2.52], [6.22, 2.78], [6.9, 2.86]];
/** Where the black band drops to its full depth at the cab door (d by height). */
const BLACK_STEP: Pt[] = [[1.95, 8.32], [2.3, 8.15], [2.6, 7.75], [2.8, 7.25], [2.9, 6.8], [3.2, 6.8]];
/** The silver lower body's top on the nose: from the cap's red band up toward the cab door, where it drops to the body's 1.39 m. */
const SILVER_TOP: Pt[] = [[B - 0.1, -9], [1.149, -9], [1.15, 0.45], [1.39, 1.9], [1.67, 3.7], [1.81, 5.3], [1.98, 7.2], [2.02, 7.9]];
const CAB_DOOR = 8.3;

/** The cab side window: a small parallelogram over the silver line, its top leaning forward. */
const CAB_WINDOW = { front: [[2.98, 5.78], [3.5, 5.5]] as Pt[], back: [[2.98, 6.24], [3.5, 5.96]] as Pt[] };

/** The lamp housing at the black band's point on each flank (d by height): dark glass, its lighter cover inside, the red lamp at its foot. */
const LAMP_TOP: Pt[] = [[1.85, 2.12], [2.4, 2.3], [3.0, 2.48]];
const LAMP_FOOT: Pt[] = [[1.85, 2.0], [2.4, 2.07], [3.0, 2.17]];
const inset = (t: Tab, k: number): Pt[] => t.map(([d, y]): Pt => [d, y + k]);
/** The cap's seam seen head on: thin dark bars round the nose's section 1.0 m behind the tip, up to the cap's top, and across the front there. */
const SEAM_D = 1.0;
function seam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const t = 0.012, ys = Array.from({ length: 9 }, (_, i) => B + 0.02 + ((1.75 - B - 0.02) * i) / 8);
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (const sd of [1, -1]) for (let i = 0; i + 1 < ys.length; i++) {
    const [ya, yb] = [ys[i]!, ys[i + 1]!];
    const [la, lb] = [halfAt(SEAM_D, ya) - 0.01, halfAt(SEAM_D, yb) - 0.01];
    const q: Pt[] = [[sd * (la - t), ya], [sd * la, ya], [sd * lb, yb], [sd * (lb - t), yb]];
    out.push({ mat: "seam", pts: sd > 0 ? q : [...q].reverse(), fine: 2 });
  }
  out.push(...strips(halfAt(SEAM_D, 1.75) - 0.01, 1.745, 1.772, "seam"));
  return out;
}
/** A band across the face from -l to l between two heights, as narrow decals that each follow the curve. */
function strips(l: number, y0: number, y1: number, mat: string): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const n = 8, at = (i: number) => -l + (2 * l * i) / n;
  return Array.from({ length: n }, (_, i) => ({ mat, pts: [[at(i), y0], [at(i + 1), y0], [at(i + 1), y1], [at(i), y1]] as Pt[], fine: 2 }));
}
/** The cap's silver stripe across its front, meeting the silver line on the flanks. */
const CAP_STRIPE = strips(halfAt(0.6, 1.56), 1.48, 1.64, "line");
/** The cap's marker lamps: a dark slit in its red band on each side. */
const capSlit = (sd: number): Pt[] => [[sd * 0.38, 1.22], [sd * 0.7, 1.2], [sd * 0.76, 1.3], [sd * 0.72, 1.38], [sd * 0.4, 1.38], [sd * 0.36, 1.3]];

const S109_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: JOIN - 0.5, first: JOIN + 3.4, reach: 0, roofFrom: 9, cols: [4, 6, 1, 1], tolerance: 0.08,
  profile: PROFILE, corner: [[B, 1.0], [C, 1.0]], cornerDepth: [[B, 1.0], [C, 1.0]], rows: ROWS,
  reshape: (lat, y) => s109Depth(lat, y),
  bands: () => [[0, 9, "red"]],
  paint: [
    // the black visor round the windscreen, wrapping round the nose's top back toward the cab window
    { mat: "cabMask", front: [[2.34, -9], [3.76, -9]], back: [[2.34, 1.95], [2.6, 2.75], [2.9, 3.5], [3.2, 4.35], [3.5, 4.95], [3.76, 5.3]], top: 3.76 },
    // the glass in it: the upright pane seen head on, its sides following the visor's
    { mat: "screenGlass", front: [[2.56, -9], [3.68, -9]], back: [[2.56, 2.15], [2.9, 3.25], [3.3, 4.2], [3.68, 4.95]], top: 3.68, lat: 0.8 },
  ],
  // the cap's seam, its stripe and its marker lamps, laid on the face
  decals: [...seam(), ...CAP_STRIPE, { mat: "lampSlit", pts: capSlit(1), fine: 2 }, { mat: "lampSlit", pts: [...capSlit(-1)].reverse(), fine: 2 }],
  panes: [], lodGlass: { hw: 0.8, y: [2.56, 3.68] },
  lamps: [
    // the round headlamp under the windscreen, on the centre line
    [0, 2.44, 0.09, "lampHead"],
  ],
  texts: [{ text: "iryo", lat: 0, y: 1.85, h: 0.17, mat: "white" }],
  wipers: [[[0.1, 2.62], [0.55, 3.15]]],
  // the distant model's nose: the cap and the long rising top, on few rows
  lod: { profile: [[B, 0.5], [TIP_Y, 0], [1.76, 0.4], [2.53, 1.91], [3.28, 3.54], [3.83, 5.29], [C, JOIN]], corner: [[B, 1.4], [C, 1.2]], cornerDepth: [[B, 5.0], [TIP_Y, 5.2], [1.76, 5.2], [2.53, 4.5], [3.28, 2.8], [3.83, 1.0], [C, 0.02]], rows: [B, TIP_Y, 1.76, 2.53, 3.28, 3.83, C] },
};

/** The end car's body behind the join (the inner coupling plane less the gap) and an intermediate car's. */
const END_BODY = END_LENGTH - 0.25 - JOIN;
const MID_BODY = MID_LENGTH - 0.5;
/** The passenger doors: one a side at the end car's inner end, one at each end of an intermediate car (28 in the train). */
const DOOR_W = 1.0;
const END_DOOR: readonly [number, number, number] = [END_BODY - 1.45, END_BODY - 1.45 + DOOR_W, 1];
const MID_DOORS: ReadonlyArray<readonly [number, number, number]> = [[0.4, 0.4 + DOOR_W, -1], [MID_BODY - 0.4 - DOOR_W, MID_BODY - 0.4, 1]];
/** The end car's windows (d behind the tip): a short one behind the cab door, then six 1.5 m windows 2.2 m apart. */
const END_WINDOWS: Array<readonly [number, number]> = [[9.9, 10.5] as const, ...Array.from({ length: 6 }, (_, i) => [11.2 + 2.2 * i, 12.7 + 2.2 * i] as const)].map(([a, e]) => [a - JOIN, e - JOIN] as const);
/** An intermediate car's ten windows between its doors. */
const MID_WINDOWS: Array<readonly [number, number]> = Array.from({ length: 10 }, (_, i) => [2.3 + 1.98 * i, 3.7 + 1.98 * i] as const);

/** The white outline round every passenger door (a frame of four thin fields). */
const doorFrame = (doors: ReadonlyArray<readonly [number, number, number]>): Array<{ mat: string; pts: Pt[] }> => doors.flatMap(([d0, d1]) => {
  const [y0, y1, t] = [1.2, 3.12, 0.05];
  const r = (a: number, e: number, b: number, f: number): { mat: string; pts: Pt[] } => ({ mat: "white", pts: [[a, b], [e, b], [e, f], [a, f]] });
  return [r(d0 - 0.1, d0 - 0.1 + t, y0, y1), r(d1 + 0.1 - t, d1 + 0.1, y0, y1), r(d0 - 0.1, d1 + 0.1, y1 - t, y1), r(d0 - 0.1, d1 + 0.1, y0, y0 + t)];
});

const RED = "#d0182b";
export const S109_LIVERY: ShinkansenLivery = {
  title: "Iryo", number: "109 001",
  palette: {
    red: c(RED, 0.3), black: c("#1c1f23", 0.3), silver: { color: "#b3b7bb", metallic: 0.55, roughness: 0.35 }, line: { color: "#c6cacd", metallic: 0.5, roughness: 0.3 },
    white: c("#f2f2f0", 0.4), roofD: c("#3b4148", 0.55), skirtG: { color: "#a3a8ad", metallic: 0.5, roughness: 0.45 },
    cabMask: { color: "#141619", metallic: 0.3, roughness: 0.15, glass: true }, seam: c("#55181f", 0.5),
    screenGlass: { color: "#2e3b45", metallic: 0.4, roughness: 0.08, glass: true },
    lampCover: { color: "#6f7a83", metallic: 0.5, roughness: 0.1, glass: true }, lampRim: c("#16181b", 0.3), lampSlit: c("#1a1c1f", 0.3), lampRed: c("#ff3a3a", 0.3),
  },
  // silver, the red band, a thin silver line, the black window band, the silver line, red up to the shoulder; the dark roof over it
  bands: [[0, 1.39, "silver"], [1.39, 1.88, "red"], [1.88, 1.95, "line"], [1.95, 3.17, "black"], [3.17, 3.37, "line"], [3.37, 9, "red"]],
  doors: [[0, 1.39, "silver"], [1.39, 1.88, "red"], [1.88, 9, "silver"]],
  roof: "roofD", skirt: "skirtG",
  // the white outline round every passenger door
  sideFields: { end: doorFrame([END_DOOR]), middle: doorFrame(MID_DOORS) },
  // the bold wordmark behind the nose, over the red between the silver and the black
  endLettering: [{ text: "iryo", d: 7.05 - JOIN, y: 1.86, h: 0.56, mat: "white", letterStroke: 0.22 }],
  // the distant model: red ahead of the cab door over the silver
  lodSideFields: { end: [{ d: [0, CAB_DOOR], bands: [[0, 1.75, "silver"], [1.75, 9, "red"]] }] },
  endSweeps: [
    // ahead of the cab door the side is red between the silver lower body and the black band
    { mat: "red", front: [[B - 0.1, JOIN - 0.1], [3.2, JOIN - 0.1]], back: [[B - 0.1, CAB_DOOR + 0.02], [3.2, CAB_DOOR + 0.02]] },
    { mat: "silver", front: SILVER_TOP, back: [[B - 0.1, CAB_DOOR], [2.02, CAB_DOOR]], face: true },
    // the black band at full depth behind the cab door, then its point along the nose to the lamps
    { mat: "black", front: BLACK_STEP, back: [[1.95, CAB_DOOR + 0.5], [3.2, CAB_DOOR + 0.5]], top: 3.2 },
    { mat: "black", ...between(LINE_FOOT.filter(([d]) => d >= 1.9).map(([d, y]): Pt => [d, y + 0.02]), BLACK_FOOT), face: true },
    { mat: "line", ...between(LINE_TOP, LINE_FOOT), face: true },
    { mat: "cabGlass", ...CAB_WINDOW, face: true },
    // the lamp housing at the black band's point and its cover
    { mat: "lampRim", ...between(inset(LAMP_TOP, 0.02), inset(LAMP_FOOT, -0.01)), face: true },
    { mat: "lampCover", ...between(inset(LAMP_TOP, -0.015).filter(([d]) => d > 2.0), inset(LAMP_FOOT, 0.02).filter(([d]) => d > 2.0)), face: true },
  ],
};

/** Each slot's pantographs (car k of n, front first): the 25 kV pair on the two middle cars (T4, T5), the rear one raised, and the folded 3 kV ones on the second and the next-to-last (TT2, TT7). */
const panSlots = (n: number): Array<{ k: number; lowered?: boolean }> => {
  if (n <= 3) return n === 3 ? [{ k: 1 }] : [];
  const [ac0, ac1] = [Math.floor(n / 2) - 1, Math.floor(n / 2)];
  const out: Array<{ k: number; lowered?: boolean }> = [{ k: ac0, lowered: true }, { k: ac1 }];
  if (n >= 6) out.push({ k: 1, lowered: true }, { k: n - 2, lowered: true });
  return out.sort((a, b) => a.k - b.k);
};

export const S109: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: LEAN, B, A,
  nose: nose(0.1, 1, 2, [[0, C]], [[0, S]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S109_FACE,
  // the windows in the black band (2.1 - 2.78 m); single plug doors with a narrow window high in the leaf
  windows: [[2.1, 2.78]], windowW: 1.5, pitch: 2.2, door: [1.25, 3.07, 2.0, 2.85], doorW: DOOR_W, doorGlassW: 0.22,
  layout: {
    end: { doors: [END_DOOR], windows: END_WINDOWS },
    middle: { doors: MID_DOORS, windows: MID_WINDOWS },
  },
  // the cab door behind the nose's crown, the side number under the black band
  sidePanels: { end: [{ d: [CAB_DOOR, CAB_DOOR + 0.95], y: [1.3, 3.1], kind: "seam" }] },
  numberAt: [-4.0, 1.5, 0.11],
  // 17.4 m bogie centres, 2.85 m wheelbase, 920 mm wheels; the end car's leading bogie 5.4 m behind the tip, under the cab
  endBogies: [5.4 - JOIN, 5.4 + 17.4 - JOIN], bogieCentres: 17.4, wheelR: 0.46, wheelbase: 2.85,
  pantographSlots: panSlots,
  cars: [4, 8],
  liveries: { iryo: S109_LIVERY },
  // 461 t ready to run in eight cars, 9,800 kW (distributed over four motor cars)
  weight: { end: 60, middle: 57 }, power: 1225, maxspeed: 360,
};

