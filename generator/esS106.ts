// The Talgo Avril, Renfe class 106 (assets/renfe-s106/SOURCES.md): two 19.37 m power cars - no
// passengers, a luggage room behind the cab - with the long, low nose, and between them the wide,
// low Talgo cars on single axles at their joints. The nose is a cab face (seriesCab.ts) whose depth
// is a solid of its own (`avrilDepth`): a rounded bumper (the "bulb") at the foot of the tip, standing
// out ahead of and beside a narrower hood that rises in one long, flat line to the roof 7.7 m back,
// the black cap over the hood from the bumper's top to the roof (windscreen, lamp window and grille in
// it), the almond headlights at the cap's lower corners. Liveries: Avlo (magenta, the orange, white and
// turquoise sweeps, orange doors) and AVE (pearl white, the aubergine line low on the power car and
// the cars, the big AVE and V), both as photographed on units 51 and 64.
//
// Measured (px/m): photo-talgo-avril-de-renfe-avlo-en-tres-cantos-... - a near side view from afar,
// a 1-D projective fit over the joints at 0, 19.37, 34.31, 47.52 and 60.73 m (12.2 px/m along the
// power car, residuals under 4 px): the cab door 7.0 - 8.0 m behind the tip, the leading bogie 7.6 m,
// the rear one 16.5 m, the cap reaching the roof 7.6 m back, the headlights 2.5 - 3.7 m, the bumper
// 2.6 m long. photo-renfe-s106-talgo-avril-in-zamora-... at the joint (about 52 px/m): the power car
// 4.0 m high, the Talgo cars 3.55 m, their windows 1.8 - 2.5 m. Published (fr.wikipedia, Transportrail
// 2021): power cars 19.37 m, cars 13.21 m (the two beside the power cars 14.94 m), 8,000 kW, 329 t
// empty, 3.2 m wide (drawn 3.02 m inside the UIC gauge's 3.1 m), 330 km/h.
//
// Heights over the rail, d behind the bumper's tip, lat from the centre line.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { bodyHalf, edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the face meets the body; the crown still rises behind it (`endCrown`) to the full 4.0 m. */
const JOIN = 7.0;
/** The power car's body: half width, belly (the crease under the door), shoulder, crown, lean, skirt bottom and top. */
const [W, Y, S, C, LEAN, B, A] = [1.51, 1.2, 3.3, 4.0, 0.93, 0.5, 0.95];
/** The crown at the join (the face's top), rising to C behind it. */
const C_JOIN = 3.95;
/** The Talgo cars' own lower roof. */
const TRAILER = { S: 3.0, C: 3.55 };

type Tab = readonly Pt[];

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

/** The body's section at the join: half width by height (tucked in below the belly, leaning in to the shoulder, the roof's ellipse to C_JOIN). */
function bodyHalf0(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * Math.max(0, (y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  if (y <= S) return W * (1 - (1 - LEAN) * ((y - Y) / (S - Y)));
  return y < C_JOIN ? W * LEAN * Math.sqrt(1 - ((y - S) / (C_JOIN - S)) ** 2) : 0;
}

/**
 * The hood: above HOOD_Y a superellipse section (half width NA, top NT, upper power NTE), below it
 * upright at NA - the bumper and the flank behind it stand out beside it. Its top line rises from the
 * bumper's top 0.45 m behind the tip to the roof at the join, about 17 degrees.
 */
const HOOD_Y = 1.76;
const NA = smooth([[0.3, 0], [0.36, 0.42], [0.5, 0.66], [0.8, 0.86], [1.2, 1.02], [1.8, 1.2], [2.6, 1.35], [3.4, 1.44], [4.4, 1.49], [5.5, W]]);
const NT = smooth([[0.3, HOOD_Y], [0.34, 1.95], [0.42, 2.12], [0.56, 2.3], [0.8, 2.5], [1.2, 2.76], [1.8, 3.08], [2.6, 3.42], [3.4, 3.66], [4.2, 3.82], [5.0, 3.91], [6.0, C_JOIN]]);
const NTE = smooth([[0.3, 2.2], [1.5, 2.5], [3.0, 3.0], [4.5, 3.5], [6.0, 3.8], [7.0, 3.8]]);
/** The bumper: a rounded block round BC, its top BT, bottom BB and half width BA by d; behind 2.6 m it runs into the flank (the body's lower section). */
const BC = 1.12;
const BT = smooth([[0, BC], [0.02, 1.42], [0.08, 1.6], [0.2, 1.69], [0.45, 1.74], [0.8, HOOD_Y], [2.6, HOOD_Y], [3.4, 1.78], [4.4, 1.84]]);
const BB = smooth([[0, BC], [0.02, 0.82], [0.08, 0.65], [0.2, 0.56], [0.45, 0.51], [0.8, B]]);
const BA = smooth([[0, 0], [0.02, 0.5], [0.08, 0.82], [0.2, 1.04], [0.45, 1.2], [0.9, 1.3], [1.5, 1.37], [2.2, 1.41], [2.6, 1.43]]);
const [BTE, BBE] = [2.6, 3.0];
/** The bumper's tip (the coupler cover's centre) for the distant model. */
const TIP_Y = BC;

/** A superellipse's half width at height y round yc (top, bottom, half width, upper and lower power). */
function superHalf(y: number, yc: number, top: number, bot: number, a: number, nt: number, nb: number): number {
  const [u, n] = y >= yc ? [(y - yc) / Math.max(1e-6, top - yc), nt] : [(yc - y) / Math.max(1e-6, yc - bot), nb];
  return u >= 1 ? 0 : a * Math.pow(1 - Math.pow(u, n), 1 / n);
}

/** The nose's half width at d and height y: the hood or the bumper and flank, whichever is wider, drawn into the body's section over the last metre. */
function halfAt(d: number, y: number): number {
  const top = NT(d);
  let w = y > top ? 0 : y <= HOOD_Y ? NA(d) : superHalf(y, HOOD_Y, top, HOOD_Y, NA(d), NTE(d), 2);
  // the bumper, and behind it the flank at the body's own width
  const bt = BT(d);
  if (y <= bt) {
    let lw = superHalf(y, BC, bt, BB(d), BA(d), BTE, BBE);
    if (d > 2.6) { const t = Math.min(1, (d - 2.6) / 0.8), s = t * t * (3 - 2 * t); lw += (Math.max(lw, bodyHalf0(y)) - lw) * s; }
    w = Math.max(w, lw);
  }
  if (d > 6.0 && w > 0) {
    const t = Math.min(1, (d - 6.0) / (JOIN - 6.0)), s = t * t * (3 - 2 * t);
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
export function avrilDepth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  // the last 4 cm of the flare left to the cab side's own columns (u 2 - 4), which run straight back to the join
  if (v === undefined) {
    const lim = halfAt(JOIN, y) - 0.04;
    v = Math.round(sectionDepth(lat > lim && lim > 0.2 ? lim : lat, y) * 1e5) / 1e5;
    row.set(lat, v);
  }
  return v;
}

/** The grid's rows: dense over the bumper, its top shelf and the headlights, then up the long hood. */
const ROWS = [B, 0.56, 0.64, 0.74, 0.86, 0.95, 1.04, 1.12, 1.24, 1.38, 1.5, 1.6, 1.68, 1.74, 1.78, 1.84, 1.92, 2.0, 2.1, 2.2, 2.32, 2.45, 2.6, 2.75, 2.9, 3.05, 3.2, 3.35, 3.5, 3.62, 3.74, 3.84, 3.9, C_JOIN];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, avrilDepth(0, y)]);

/**
 * The headlight seen from the side (photo-l04-226-...): an almond 1.4 m long rising 0.5 m from its
 * front tip on the bumper's top to its round rear end, its front and back edges [y, d] by height.
 */
const LAMP_FRONT: Pt[] = [[1.76, 0.85], [1.86, 0.88], [2.0, 1.0], [2.12, 1.25], [2.2, 1.6], [2.23, 1.82]];
const LAMP_BACK: Pt[] = [[1.76, 0.95], [1.8, 1.35], [1.9, 1.7], [2.04, 1.88], [2.17, 1.93], [2.23, 1.82]];
/** A lamp edge moved out by g (front edge ahead, back edge behind) and its heights spread by g. */
const grow = (e: Pt[], g: number, sd: number): Pt[] => e.map(([y, d], i): Pt => [y + (i === 0 ? -g : i === e.length - 1 ? g : 0), d + sd * g]);

/** A symmetric outline [lat, y] from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The windscreen seen head on (photo-talgo-avril-106-64-a-coruna, photo-106ave): wide at its foot, its sides curving in to an arched top. */
const SCREEN: Pt[] = mirror([[0, 2.42], [0.6, 2.44], [0.76, 2.5], [0.8, 2.64], [0.77, 3.2], [0.68, 3.46], [0.46, 3.6], [0, 3.64]]);
/** The dark mask round it, narrowing down the upright front to the bumper's top between the headlights. */
const MASK: Pt[] = mirror([[0, HOOD_Y], [0.5, HOOD_Y + 0.01], [0.7, 1.86], [0.84, 2.1], [0.9, 2.4], [0.92, 2.7], [0.88, 3.25], [0.78, 3.55], [0.52, 3.72], [0, 3.76]]);
const rect = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

const AVRIL_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 6.0, first: 7.15, reach: 0.07, roofFrom: 3.45, cols: [6, 10, 2, 3], tolerance: 0.06,
  // the plan: the face's columns across the centre, the corners out to the body's side (the depth is avrilDepth's)
  profile: PROFILE, corner: [[B, 1.0], [C_JOIN, 1.0]], cornerDepth: [[B, 1.0], [C_JOIN, 1.0]], rows: ROWS,
  reshape: (lat, y) => avrilDepth(lat, y),
  // the face in the livery's base colour; the cap, the bumper's dark foot and the sweeps painted over it
  bands: () => [[0, 9, "faceBase"]],
  lodBands: [[0, 0.66, "skirtG"], [0.66, 9, "faceBase"]],
  // the leading bogie's wheels (from 6.25 m) show under the face's sides
  wheelCut: { d: 5.75, y: A },
  paint: [
    // the dark foot round the bumper, and the skirt behind it
    { mat: "skirtG", front: [[B - 0.1, -9], [0.66, -9]], back: [[B - 0.1, 99], [0.66, 99]], top: 0.66 },
    { mat: "skirtG", front: [[B - 0.1, 3.4], [A, 3.4]], back: [[B - 0.1, 99], [A, 99]], top: A },
    // the headlight: its black surround, the cover and the lamps in it
    { mat: "black", front: grow(LAMP_FRONT, 0.05, -1), back: grow(LAMP_BACK, 0.05, 1), top: 4.1 },
    { mat: "lampCover", front: LAMP_FRONT, back: LAMP_BACK, top: 4.1 },
    { mat: "lampHead", front: [[1.86, 1.12], [1.94, 1.16], [2.03, 1.32], [2.08, 1.55]], back: [[1.86, 1.3], [1.94, 1.55], [2.03, 1.7], [2.08, 1.66]], top: 4.1 },
  ],
  fields: [
    // the dark mask: the windscreen's surround, carried down the upright front over the lamp window and grille
    { mat: "cabMask", pts: MASK },
    { mat: "screenGlass", pts: SCREEN },
    // the lamp window under the windscreen, the grille under it
    { mat: "lampRim", pts: rect(-0.21, 0.21, 2.12, 2.32) }, { mat: "lampWindow", pts: rect(-0.17, 0.17, 2.15, 2.29) },
    { mat: "grille", pts: rect(-0.4, 0.4, 1.8, 2.03) },
  ],
  // the grille's slats
  decals: Array.from({ length: 5 }, (_, i) => ({ mat: "black", pts: rect(-0.36, 0.36, 1.84 + 0.04 * i, 1.855 + 0.04 * i), fine: 2 })),
  panes: [], lodGlass: { hw: 0.8, y: [2.42, 3.64] },
  wipers: Array.from({ length: 4 }, (_, i): [Pt, Pt] => {
    const p = (t: number): Pt => [0.12 - 0.42 * t, 2.56 + 0.46 * t];
    return [p(i / 4), p((i + 1) / 4)];
  }),
  // the distant model's nose: the bumper, the long hood and its crown, on few rows
  lod: {
    profile: [[B, 0.5], [TIP_Y, 0], [HOOD_Y, 0.3], [2.3, 0.56], [3.0, 1.6], [3.6, 3.0], [C_JOIN, JOIN]], corner: [[B, 1.2], [C_JOIN, 1.2]],
    cornerDepth: [[B, 2.2], [TIP_Y, 2.4], [HOOD_Y, 1.8], [2.3, 1.8], [3.0, 1.5], [3.6, 0.8], [C_JOIN, 0.05]], rows: [B, TIP_Y, HOOD_Y, 2.3, 3.0, 3.6, C_JOIN],
  },
};

/** A line of paint along a centre line [d, y] of a thickness [d, t], as a sweep's front and back edges by height; `up` rising toward the front (smaller d). */
function line(centre: Tab, thick: Tab): { front: Pt[]; back: Pt[] } {
  const d0 = centre[0]![0], d1 = centre[centre.length - 1]![0];
  const ds = Array.from({ length: 41 }, (_, i) => d0 + ((d1 - d0) * i) / 40);
  const at = (t: Tab, x: number) => edgeAt(t, x);
  const hi = ds.map((d): Pt => [at(centre, d) + at(thick, d) / 2, d]);
  const lo = ds.map((d): Pt => [at(centre, d) - at(thick, d) / 2, d]);
  const byY = (pts: Pt[]) => [...pts].sort((p, q) => p[0] - q[0]).filter((p, i, a) => i === 0 || p[0] > a[i - 1]![0] + 1e-6).map(([y, d]): Pt => [Math.round(y * 1e4) / 1e4, Math.round(d * 1e4) / 1e4]);
  // rising toward the front, the lower edge is met first going back
  return { front: byY(lo), back: byY(hi) };
}

/** The Avlo sweeps on the power car (photo-l04-226-..., photo-renfe-avril-avlo): orange from low at the rear up to the cap over the door, a thin white line under it ending at the door, turquoise from under the door up to the cap's foot. Centre lines [d, y] by d ascending. */
const ORANGE = line([[6.9, 3.25], [8.5, 2.62], [10.5, 1.88], [12.5, 1.42], [15.0, 1.26], [19.4, 1.22]], [[6.9, 0.4], [12.5, 0.38], [19.4, 0.3]]);
const WHITE_LINE = line([[7.2, 2.52], [9.0, 1.92], [11.0, 1.42], [12.5, 1.25]], [[7.2, 0.14], [12.5, 0.12]]);
const TURQUOISE = line([[4.4, 3.05], [5.8, 2.5], [7.3, 1.92], [8.8, 1.45], [10.0, 1.25]], [[4.4, 0.3], [10.0, 0.26]]);

/** The Avlo cars' sweeps: a white and an orange wave along each car, d behind its +X end, kept off the door (0.45 - 1.35 m) and between the belly and the shoulder. */
function waves(): Array<{ mat: string; pts: Pt[] }> {
  const out: Array<{ mat: string; pts: Pt[] }> = [];
  const white = (d: number) => 2.3 + 0.5 * Math.sin((2 * Math.PI * (d - 1.5)) / 9);
  // the orange passes under the white where they cross: its piece there left out (no paint on paint)
  const wave = (mat: string, y: (d: number) => number, t: number, under?: (d: number) => number) => {
    for (let d = 1.5; d < 12.6 - 1e-6; d += 0.45) {
      const e = Math.min(12.6, d + 0.45);
      if (under) {
        const lo = Math.min(y(d), y(e)) - t / 2 - 0.08, hi = Math.max(y(d), y(e)) + t / 2 + 0.08;
        const [wl, wh] = [Math.min(under(d), under(e)), Math.max(under(d), under(e))];
        if (wh > lo && wl < hi) continue;
      }
      const r = (v: number) => Math.round(v * 1e4) / 1e4;
      out.push({ mat, pts: [[r(d), r(y(d) - t / 2)], [r(e), r(y(e) - t / 2)], [r(e), r(y(e) + t / 2)], [r(d), r(y(d) + t / 2)]] });
    }
  };
  wave("white", white, 0.1);
  wave("orange", (d) => 2.05 - 0.42 * Math.sin((2 * Math.PI * (d - 3.0)) / 10), 0.14, white);
  return out;
}

/** The AVE cars' window band: dark from the first window to the last (photo-renfe-s106-talgo-avril-in-zamora). */
const AVE_BAND: Pt[] = [[2.5, 1.74], [11.8, 1.74], [11.8, 2.56], [2.5, 2.56]];
/** The big V near the power car's inner end (d behind the body's front): a grey stroke, the aubergine one rising behind it. */
const AVE_V = [
  { mat: "aveGrey", pts: [[10.45, 3.08], [10.7, 3.08], [10.96, 2.18], [10.88, 2.12]] as Pt[] },
  { mat: "purple", pts: [[10.98, 2.12], [11.06, 2.12], [11.62, 3.08], [11.38, 3.08]] as Pt[] },
];

const common = { roofG: c("#c1c5c8", 0.5), skirtG: c("#26282b", 0.75), cabMask: { color: "#17191b", metallic: 0.3, roughness: 0.2, glass: true }, screenGlass: { color: "#253039", metallic: 0.4, roughness: 0.08, glass: true }, lampCover: { color: "#b6c0c6", metallic: 0.3, roughness: 0.1, glass: true }, lampRim: c("#8d9398", 0.35), lampWindow: { color: "#5d666d", metallic: 0.4, roughness: 0.1, glass: true }, grille: c("#2f3336", 0.6), black: c("#0e0f10", 0.6), handrail: { color: "#c8ccd0", metallic: 0.7, roughness: 0.3 } };

/** Avlo: magenta all over, the sweeps, orange doors, the light grey line under the roof. */
const AVLO: ShinkansenLivery = {
  title: "Avlo", number: "106 051",
  palette: { ...common, magenta: c("#a8148f", 0.35), faceBase: c("#a8148f", 0.35), orange: c("#f47a2c", 0.4), white: c("#f3f6f6", 0.4), turquoise: c("#5ad8d2", 0.4), edge: c("#b9bdc1", 0.5), cabMask: { color: "#2e1028", metallic: 0.3, roughness: 0.2, glass: true }, logo: c("#62d2ea", 0.4) },
  bands: [[0, 9, "magenta"]], endBands: [[0, 3.22, "magenta"], [3.22, 9, "edge"]],
  doors: [[0, 9, "orange"]], roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "avlo", d: 12.7 - JOIN, y: 1.85, h: 0.55, mat: "logo" }],
  endSweeps: [
    { mat: "orange", ...ORANGE, face: true },
    { mat: "white", ...WHITE_LINE, face: true },
    { mat: "turquoise", ...TURQUOISE, face: true },
  ],
  sideFields: { middle: waves() },
  lodSides: [[0, 9, "magenta"]],
};

/** AVE: pearl white, the aubergine line low along every car over the light grey foot, the dark window band on the cars, the dark grey line under the power car's roof. */
const AVE: ShinkansenLivery = {
  title: "AVE", number: "106 064",
  palette: { ...common, white: c("#eceae5", 0.35), faceBase: c("#eceae5", 0.35), lowGrey: c("#b4b6b6", 0.45), purple: c("#6e2650", 0.4), aveGrey: c("#8b8f93", 0.4), edge: c("#53575b", 0.5), band: c("#1d2023", 0.3) },
  bands: [[0, 1.05, "lowGrey"], [1.05, 1.16, "purple"], [1.16, 9, "white"]],
  endBands: [[0, 1.06, "lowGrey"], [1.06, 1.18, "purple"], [1.18, 3.22, "white"], [3.22, 9, "edge"]],
  roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "AVE", d: 12.6 - JOIN, y: 1.85, h: 0.6, mat: "aveGrey" }],
  endSweeps: [
    // on the face only (the body has them as bands): the line and the grey foot start over the leading bogie, the line's front end rising
    { mat: "lowGrey", front: [[A, 6.75], [1.08, 6.7]], back: [[A, 6.97], [1.08, 6.97]], face: true },
    { mat: "purple", front: [[1.08, 6.7], [1.2, 6.55]], back: [[1.08, 6.97], [1.2, 6.97]], face: true },
  ],
  sideFields: { end: AVE_V, middle: [{ mat: "band", pts: AVE_BAND }] },
};

/** The power car's handrails beside the cab door and its step (the series' fittings), and the plain underfloor box on every car. */
function avrilFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "under", Math.min(X(t1 - 2.6), X(t0 + 2.6)), Math.max(X(t1 - 2.6), X(t0 + 2.6)), B - 0.3, B, -W * 0.78, W * 0.78));
  if (!car.end) return;
  m.scope("handrails", () => {
    for (const sd of [1, -1]) for (const dt of [7.1, 8.0]) {
      const d = dt - JOIN, x = X(d), z = edgeAt(bodyHalf(b, Math.max(0, d)), 2.2) + 0.03;
      block(m, "handrail", x - 0.015, x + 0.015, 1.3, 3.0, sd * z - 0.015, sd * z + 0.015);
    }
  });
  m.scope("step", () => {
    for (const sd of [1, -1]) {
      const [x0, x1] = [X(7.95 - JOIN), X(7.2 - JOIN)], z = edgeAt(bodyHalf(b, 0.6), A);
      block(m, "handrail", Math.min(x0, x1), Math.max(x0, x1), A - 0.04, A, sd > 0 ? z - 0.2 : -z, sd > 0 ? z : -z + 0.2);
    }
  });
}

/** The power car's sides (d behind the tip): the cab door's outline behind the cap, two small windows in the luggage room and machine room. */
const POWER_SIDES = [
  { d: [7.15, 7.95] as const, y: [1.25, 3.2] as const, kind: "seam" as const },
  { d: [9.5, 9.95] as const, y: [2.1, 2.92] as const, kind: "window" as const },
  { d: [15.0, 15.45] as const, y: [2.1, 2.92] as const, kind: "window" as const },
];

/** The car's layout (d behind its +X end): one door at the front end, five windows behind it. */
const MID_WINDOWS: Array<readonly [number, number]> = Array.from({ length: 5 }, (_, i) => [2.6 + 1.95 * i, 3.9 + 1.95 * i] as const);

export const S106: ShinkansenSeries = {
  // 19.4 m power cars over the couplers, 13.21 m Talgo cars
  endLength: 19.4, midLength: 13.21, W, Y, S, C, lean: LEAN, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: AVRIL_FACE,
  endCrown: [[0, C_JOIN], [0.5, C]],
  trailerSection: TRAILER,
  // the cars' windows 1.8 - 2.5 m, a single plug door with a narrow window
  windows: [[1.8, 2.5]], windowW: 1.3, pitch: 1.95, door: [1.0, 2.75, 1.75, 2.5], doorW: 0.9, doorGlassW: 0.16,
  layout: { end: { doors: [], windows: [] }, middle: { doors: [[0.45, 1.35, 1]], windows: MID_WINDOWS } },
  endSides: { windows: [], doors: [] },
  sidePanels: { end: POWER_SIDES },
  // the power car's two-axle bogies (leading one under the cab door, 8.9 m apart); the cars on single axles at their joints
  endBogies: [7.6 - JOIN, 16.5 - JOIN], endCarRunningGear: { wheelbase: 2.7, wheelR: 0.46 },
  bogieCentres: 5.6, wheelR: 0.44, wheelbase: 0, jacobsTrailers: 1.4,
  cars: [4, 8], minCars: 3, endPantograph: true,
  fittings: avrilFittings,
  liveries: { avlo: AVLO, ave: AVE },
  weight: { end: 68, middle: 16 }, power: 4000, maxspeed: 330,
};
