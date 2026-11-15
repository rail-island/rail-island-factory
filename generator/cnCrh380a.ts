// The CRH380A (CSR Sifang; assets/cr-crh380a/SOURCES.md): its 12 m "fish head"
// nose as a cab face (seriesCab.ts) whose depth is a solid of its own
// (`a380Depth`): a silver coupler dome on the tip, behind it the slender nose
// rising in a long gentle line, its lower flank narrow over the leading bogie and
// flaring out behind it, and the raised cab canopy - a bubble standing out of the
// nose's top - with its black windscreen oval and the almond headlights beside
// its foot. The livery: white, a dark window band ending in a rounded point
// behind the canopy, the blue stripe under it rising along the nose and sweeping
// down to a point on its flank. Heights above the rail, d behind the tip, lat
// from the centre line. See docs/models/china-units.md, "The CRH380A's body".

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";

/** Where the nose meets the body's own section (the published 12.0 m nose). */
const JOIN = 12.0;
/** The body: half width (3.38 m narrowed to the Shinkansen gauge's 3.3 m), belly, shoulder, crown, lean, skirt bottom and top. */
const [W, Y, S, C, LEAN, B, A] = [1.63, 1.45, 3.0, 3.7, 0.96, 0.5, 1.0];

type Tab = readonly Pt[];
const at = (t: Tab, x: number) => edgeAt(t, x);

/** The body's half width at height y below the shoulder (the kit's section: tucked in under the belly, leaning in to the shoulder). */
function sideHalf(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * Math.max(0, (y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  return W * (1 - (1 - LEAN) * Math.min(1, (y - Y) / (S - Y)));
}

/** A smooth (monotone cubic, C1) interpolation through a table [x, v], held past its ends: no kinks for the grid to show as creases. */
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
 * The nose's section by d: a superellipse round its widest height (half width, top, bottom, the
 * widest height, the upper and lower powers), the tip a blunt bullet - the coupler cover, as wide and
 * high as the nose there and flowing into it - drawn into the body's own section over the last 4 m.
 */
const NA = smooth([[0, 0], [0.08, 0.36], [0.25, 0.6], [0.5, 0.76], [0.9, 0.88], [1.4, 0.96], [2.0, 1.04], [3.0, 1.16], [4.5, 1.3], [6.0, 1.42], [8.0, 1.53], [10.0, 1.6], [12.0, W]]);
const NT = smooth([[0, 1.08], [0.08, 1.28], [0.25, 1.4], [0.5, 1.5], [0.9, 1.59], [1.4, 1.68], [2.0, 1.82], [3.0, 2.04], [4.0, 2.22], [5.0, 2.38], [6.0, 2.53], [7.0, 2.7], [8.0, 2.88], [9.0, 3.07], [10.0, 3.27], [11.0, 3.5], [11.6, 3.64], [12.0, C]]);
const NB = smooth([[0, 1.08], [0.08, 0.88], [0.25, 0.74], [0.5, 0.64], [0.9, 0.56], [1.4, 0.5], [2.0, 0.42], [3.0, 0.3], [12.0, 0.3]]);
const YC = smooth([[0, 1.08], [1.4, 1.08], [3.0, 1.2], [5.0, 1.35], [8.0, 1.45], [12.0, Y]]);
const NTE = smooth([[0, 2.3], [1.4, 2.3], [3.0, 2.15], [6.0, 2.05], [12.0, 2.0]]);
const NBE = smooth([[0, 2.3], [1.4, 2.4], [3.0, 3.0], [6.0, 5.0], [12.0, 6.0]]);
/** The tip's height (the coupler cover's centre) for the distant model. */
const TIP_Y = 1.08;
/** The canopy, by d: its crown, its half width and how far its rounded top drops to its walls. */
const HB = smooth([[4.2, 2.3], [4.6, 2.55], [5.2, 2.8], [5.8, 3.0], [6.5, 3.15], [7.3, 3.26], [8.2, 3.34], [9.2, 3.42], [10.2, 3.5], [11.2, 3.62], [12.0, 3.7]]);
const WB = smooth([[4.2, 0.0], [4.4, 0.45], [4.8, 0.65], [5.4, 0.78], [6.2, 0.86], [7.5, 0.92], [9.0, 0.97], [10.2, 1.05], [11.0, 1.18], [12.0, 1.3]]);
const DROP = smooth([[4.2, 0.2], [4.8, 0.32], [6.0, 0.45], [7.5, 0.52], [9.0, 0.56], [10.5, 0.6], [12.0, 0.7]]);
const CANOPY_D = 4.2;
/** The lower flank over the leading bogie: narrow below BOGIE_TOP from BOGIE_START back to BOGIE_END, flaring out to the body behind it. */
const [BOGIE_TOP, BOGIE_HW, BOGIE_START, BOGIE_END, FLARE_END] = [0.95, 0.55, 2.0, 7.25, 7.9];
/** The coupler cover's seam, d behind the tip: the silver ahead of it. */
const SEAM_D = 1.0;

/** The body's own section's half width at height y. */
const bodyHalf0 = (y: number) => (y <= S ? sideHalf(y) : y < C ? W * LEAN * Math.sqrt(1 - ((y - S) / (C - S)) ** 2) : 0);

/** The superellipse section's half width at d and height y (0 off it). */
function superHalf(d: number, y: number): number {
  const [a, top, bot, yc] = [NA(d), NT(d), NB(d), YC(d)];
  const [u, n] = y >= yc ? [(y - yc) / Math.max(1e-6, top - yc), NTE(d)] : [(yc - y) / Math.max(1e-6, yc - bot), NBE(d)];
  return u >= 1 ? 0 : a * Math.pow(1 - Math.pow(u, n), 1 / n);
}

/** The nose's half width at d and height y: its section (drawn into the body's toward the join) or the canopy's, whichever is wider. */
function halfAt(d: number, y: number): number {
  let w = superHalf(d, y);
  if (w > 0 && d > 8) {
    const t = Math.min(1, (d - 8) / 4), s = t * t * (3 - 2 * t);
    w += (bodyHalf0(y) - w) * s;
  }
  if (y < BOGIE_TOP && d > BOGIE_START && d < FLARE_END) {
    const cut = Math.max(BOGIE_HW, superHalf(BOGIE_START, y));
    w = Math.min(w, d <= BOGIE_END ? cut : cut + (w - cut) * ((d - BOGIE_END) / (FLARE_END - BOGIE_END)));
  }
  if (d >= CANOPY_D) {
    const [hb, wb, dr] = [HB(d), WB(d), DROP(d)];
    const y0 = hb - dr;
    const cw = y <= y0 ? wb : y < hb ? wb * Math.sqrt(1 - ((y - y0) / dr) ** 2) : 0;
    w = Math.max(w, cw);
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
export function a380Depth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = Math.round(sectionDepth(lat, y) * 1e5) / 1e5; row.set(lat, v); }
  return v;
}

/** The grid's rows (the shape's and the paint's heights): dense over the tip, the bogie's fender and the canopy. */
const ROWS = [0.5, 0.62, 0.74, 0.86, 0.9, 0.95, 1.01, 1.08, 1.18, 1.4, 1.52, 1.64, 1.76, 1.88, 2.0, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.66, 3.7];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, a380Depth(0, y)]);

/** The nose's own top (without the canopy) at d and lat: where the canopy's wall stands out of it. */
function noseTop(d: number, lat: number): number {
  const [a, top, yc, n] = [NA(d), NT(d), YC(d), NTE(d)];
  return lat >= a ? yc : yc + (top - yc) * Math.pow(1 - Math.pow(lat / a, n), 1 / n);
}

/** The valley where the canopy's wall meets the nose's top, by d. */
const valley = (d: number) => noseTop(d, WB(d));

/**
 * A paint's back edge [y, d] cut to the canopy: at each height no further back than where the valley
 * rises above it less `gap` (the paint on the canopy's walls only, never on the nose's top beside it).
 */
function onCanopy(back: Pt[], gap: number): Pt[] {
  const [y0, y1] = [back[0]![0], back[back.length - 1]![0]];
  return Array.from({ length: 7 }, (_, i): Pt => {
    const y = y0 + ((y1 - y0) * i) / 6;
    let dv = 12;
    for (let d = 4.6; d <= 12; d += 0.02) if (valley(d) > y - gap) { dv = d; break; }
    return [Math.round(y * 1e4) / 1e4, Math.round(Math.min(edgeAt(back, y), dv) * 1e4) / 1e4];
  });
}

/** The coupler cover's seam seen head on: a thin dark line round the nose's section SEAM_D behind the tip, short bars [lat, y]. */
function seam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [a, top, bot, yc, nt, nb] = [NA(SEAM_D), NT(SEAM_D), NB(SEAM_D), YC(SEAM_D), NTE(SEAM_D), NBE(SEAM_D)];
  const [t, n] = [0.009, 40];
  const o = (th: number, e: number): Pt => {
    const c = Math.cos(th), s = Math.sin(th), up = s >= 0, pw = up ? nt : nb, h = up ? top - yc : yc - bot;
    const k = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / pw);
    return [Math.round((a + e) * k(c) * 1e4) / 1e4, Math.round((yc + (h + e) * k(s)) * 1e4) / 1e4];
  };
  return Array.from({ length: n }, (_, i) => {
    const [p, q] = [(2 * Math.PI * i) / n, (2 * Math.PI * (i + 1)) / n];
    return { mat: "seam", pts: [o(p, -t - 0.012), o(q, -t - 0.012), o(q, t - 0.012), o(p, t - 0.012)], fine: 2 };
  });
}

/** A symmetric outline [lat, y] from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The windscreen seen head on (photo-crh380a-2785-jox, -6068l): one wide pane with rounded corners, its top under the canopy's crown. */
const SCREEN: Pt[] = mirror([[0, 2.5], [0.42, 2.5], [0.56, 2.53], [0.63, 2.6], [0.66, 2.72], [0.66, 2.92], [0.62, 3.04], [0.52, 3.11], [0.3, 3.15], [0, 3.16]]);
/** An almond headlight on viewer's side sd, beside the canopy's foot: its inner end low and pointed, the outer end high and round. */
const lamp = (sd: number, grow: number): Pt[] =>
  ([[0.66, 2.36], [0.8, 2.27], [0.98, 2.18], [1.16, 2.11], [1.3, 2.09], [1.36, 2.13], [1.3, 2.2], [1.12, 2.28], [0.92, 2.35], [0.75, 2.4]] as Pt[]).map(([l, y]): Pt => {
    const [cl, cy] = [1.0, 2.24];
    return [sd * (cl + (l - cl) * (1 + grow)), cy + (y - cy) * (1 + grow * 3)];
  });

/** A line of paint along a centre line [d, y] of a thickness [d, t] (t 0 at a pointed end), as a sweep's front and back edges by height; `up` the line rising toward its rear, else falling. */
function line(centre: Tab, thick: Tab, up: boolean): { front: Pt[]; back: Pt[] } {
  const ds = Array.from({ length: 41 }, (_, i) => centre[0]![0] + ((centre[centre.length - 1]![0] - centre[0]![0]) * i) / 40);
  const hi = ds.map((d): Pt => [at(centre, d) + at(thick, d) / 2, d]);
  const lo = ds.map((d): Pt => [at(centre, d) - at(thick, d) / 2, d]);
  // each edge as d by height (both edges monotone in d)
  const byY = (pts: Pt[]) => [...pts].sort((p, q) => p[0] - q[0]).filter((p, i, a) => i === 0 || p[0] > a[i - 1]![0] + 1e-6).map(([y, d]): Pt => [Math.round(y * 1e4) / 1e4, Math.round(d * 1e4) / 1e4]);
  // rising rearward the upper edge is reached first going back, falling the lower one
  return up ? { front: byY(hi), back: byY(lo) } : { front: byY(lo), back: byY(hi) };
}

/** The blue stripe: level 1.72 - 1.85 m along the cars, rising toward the nose to its crest 9.6 m behind the tip, then sweeping down the flank to its point (photo-sifang-crh2-380a-at-shanghai-expo.jpg). */
const STRIPE_REAR = line([[9.3, 1.98], [10.4, 1.94], [11.5, 1.87], [12.6, 1.8], [13.4, 1.785]], [[9.3, 0.13], [13.4, 0.13]], false);
const STRIPE_FRONT = line([[6.0, 1.42], [6.7, 1.56], [7.4, 1.7], [8.1, 1.82], [8.7, 1.92], [9.3, 1.98]], [[6.0, 0.0], [6.8, 0.06], [7.8, 0.1], [8.8, 0.125], [9.3, 0.13]], true);
/** The window band's front: its foot rising from 1.97 m to 2.15 m, then a rounded point climbing back to the shoulder at the join. */
const BAND_FRONT: Pt[] = [[1.97, 13.4], [2.03, 12.0], [2.09, 10.9], [2.15, 9.7], [2.24, 9.68], [2.36, 9.78], [2.5, 10.0], [2.64, 10.3], [2.78, 10.8], [2.88, 11.4], [2.95, 12.0]];

/** The end car's sightseeing windows ahead of the front door, on the nose's flank in the band: [d0, d1, sill, head] (the first one's head following the band's point). */
const NOSE_WINDOWS: ReadonlyArray<{ front: Pt[]; back: Pt[] }> = [
  { front: [[2.22, 10.45], [2.4, 10.32], [2.56, 10.5]], back: [[2.22, 11.1], [2.56, 11.1]] },
  { front: [[2.17, 11.35], [2.72, 11.35]], back: [[2.17, 12.0], [2.72, 12.0]] },
];

const A380_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 11.0, first: JOIN + 2.0, reach: 0, roofFrom: 9, cols: [6, 9, 1, 2], tolerance: 0.07,
  // the plan: the face's columns across the centre, the corners out to the body's side (the depth is a380Depth's)
  profile: PROFILE, corner: [[B, 1.0], [C, 1.0]], cornerDepth: [[B, 1.0], [C, 1.0]], rows: ROWS,
  reshape: (lat, y) => a380Depth(lat, y),
  bands: () => [[0, 9, "white"]],
  paint: [
    // the nose's lower flank white down to its bottom ahead of the skirts, the grey skirt behind the leading bogie
    { mat: "white", front: [[B - 0.1, -9], [A, -9]], back: [[B - 0.1, FLARE_END], [A, FLARE_END]], top: A },
    { mat: "skirtG", front: [[B - 0.1, FLARE_END - 0.7], [A - 0.02, FLARE_END - 0.7]], back: [[B - 0.1, 99], [A - 0.02, 99]], top: A - 0.02 },
    // the coupler dome's seam and its silver
    { mat: "dome", front: [[B - 0.1, -9], [2.0, -9]], back: [[B - 0.1, SEAM_D - 0.01], [2.0, SEAM_D - 0.01]], top: 2.0 },
    // the canopy's black oval round its glass, then the side windows in it
    { mat: "cabMask", front: [[2.42, -9], [3.2, -9]], back: onCanopy([[2.42, 5.2], [2.5, 6.6], [2.6, 8.0], [2.75, 9.0], [2.95, 9.5], [3.2, 9.7]], 0), top: 3.2, lat: 1.1 },
  ],
  decals: seam(),
  fields: [
    { mat: "screenGlass", pts: SCREEN },
    { mat: "lampRim", pts: lamp(1, 0.07) }, { mat: "lampRim", pts: lamp(-1, 0.07) },
    { mat: "lampCover", pts: lamp(1, 0) }, { mat: "lampCover", pts: lamp(-1, 0) },
    { mat: "lampHead", pts: lamp(1, -0.5) }, { mat: "lampHead", pts: lamp(-1, -0.5) },
  ],
  panes: [], lodGlass: { hw: 0.62, y: [2.5, 3.12] },
  wipers: Array.from({ length: 5 }, (_, i): [Pt, Pt] => {
    const p = (t: number): Pt => [0.08 - 0.34 * t, 2.54 + 0.4 * t];
    return [p(i / 5), p((i + 1) / 5)];
  }),
  // the distant model's nose: the dome, the long rising top and the canopy, on few rows
  lod: { profile: [[B, 1.9], [TIP_Y, 0], [1.7, 1.6], [2.5, 4.9], [3.25, 7.8], [C, JOIN]], corner: [[B, 1.4], [C, 1.2]], cornerDepth: [[B, 6.5], [TIP_Y, 5.5], [1.7, 5.5], [2.5, 4.5], [3.25, 3.0], [C, 0.02]], rows: [B, TIP_Y, 1.7, 2.5, 3.25, C] },
};

const WHITE = "#f1f2f0";
export const CRH380A_LIVERY: ShinkansenLivery = {
  title: "CRH blue", number: "CRH380A-2670",
  palette: {
    white: c(WHITE), blue: c("#1d47a5", 0.4), dark: c("#24282d", 0.3), roofG: c("#e8eae9", 0.55), skirtG: c("#8f969c", 0.7),
    cabMask: { color: "#16191c", metallic: 0.3, roughness: 0.15, glass: true }, dome: c("#b9bec3", 0.25), seam: c("#3b3f44", 0.5), lampCover: { color: "#d3d8dc", metallic: 0.3, roughness: 0.12, glass: true }, lampRim: c("#5d646a", 0.35),
    screenGlass: { color: "#34444f", metallic: 0.4, roughness: 0.08, glass: true },
  },
  // white, the blue stripe, a white gap and the dark window band up to the shoulder
  bands: [[0, 1.72, "white"], [1.72, 1.85, "blue"], [1.85, 1.97, "white"], [1.97, 2.95, "dark"], [2.95, 9, "white"]],
  doors: [[0, 1.72, "white"], [1.72, 1.85, "blue"], [1.85, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "CRH", d: 1.15, y: 2.32, h: 0.3, mat: "white" }],
  endSweeps: [
    // white over the bands ahead of the window band's foot, then the band's point, the stripe and the sightseeing windows
    { mat: "white", front: [[A, -9], [S, -9]], back: [[A, 13.45], [S, 13.45]], face: false },
    { mat: "dark", front: BAND_FRONT, back: [[1.97, 13.6], [S, 13.6]], face: true },
    { mat: "blue", ...STRIPE_REAR, face: true },
    { mat: "blue", ...STRIPE_FRONT, face: true },
    ...NOSE_WINDOWS.map((w) => ({ mat: "cabGlass", ...w, face: true })),
  ],
};

/** The pantograph's side shields (photo-crh380al.jpg, photo-crh380a-hexie-emu.jpg): a tall plate on each roof edge ahead of and behind the arm. */
function shields(m: MeshBuilder, x: number, C0: number): void {
  for (const dx of [-1.9, 1.9]) for (const sd of [1, -1]) {
    const z = sd * 0.98, base = C0 - 0.22;
    // a fin rising from the roof, its top edge raked toward the car's ends
    const lean = dx > 0 ? 1 : -1;
    const pts: Array<[number, number, number]> = [[x + dx - lean * 0.55, base, z], [x + dx + lean * 0.55, base, z], [x + dx + lean * 0.12, C0 + 0.62, z], [x + dx - lean * 0.3, C0 + 0.62, z]];
    m.slab("roofG", sd > 0 ? pts : [...pts].reverse(), [0, 0, -sd * 0.06]);
  }
}

/** The pantographs on cars 4 and 6 of eight, only the rear one raised (ja.wikipedia CRH380A); in a shorter train the rear one third from the end and the other two cars ahead of it. */
const panSlots = (n: number): Array<{ k: number; lowered?: boolean }> => {
  const rear = Math.max(1, n - 3), front = rear - 2;
  return front >= 1 ? [{ k: front, lowered: true }, { k: rear }] : [{ k: rear }];
};

/** The end car's layout (d behind the body's front at the join): the front door 2 m behind the nose, ten windows to the inner end; the intermediate car's door at its rear end only. */
const END_DOOR: readonly [number, number, number] = [2.0, 2.95, -1];
const MID_DOOR: readonly [number, number, number] = [23.1, 24.05, 1];

export const CRH380A: ShinkansenSeries = {
  // 26.5 m end car (12.0 m of nose), 25.0 m intermediate car, 3.7 m high (ja.wikipedia)
  endLength: 26.5, midLength: 25.0, W, Y, S, C, lean: LEAN, B, A,
  nose: nose(0.1, 1, 2, [[0, C]], [[0, S]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: A380_FACE,
  // single-leaf plug doors with a narrow window high in the leaf; one window a seat row (1.04 m) in the dark band
  windows: [[2.12, 2.78]], windowW: 0.8, pitch: 1.04, door: [1.3, 3.1, 2.3, 2.85], doorW: 0.95, doorGlassW: 0.26,
  layout: {
    end: { doors: [END_DOOR], windows: Array.from({ length: 10 }, (_, i): [number, number] => [3.45 + 1.04 * i, 4.25 + 1.04 * i]) },
    middle: { doors: [MID_DOOR], windows: Array.from({ length: 21 }, (_, i): [number, number] => [0.6 + 1.04 * i, 1.4 + 1.04 * i]) },
  },
  numberAt: [-6.75, 1.42, 0.11],
  // 17.5 m bogie centres (860 mm wheels, 2.5 m wheelbase); the end car's leading bogie under the canopy's front, the rear one 3.4 m from the inner end
  endBogies: [5.35 - JOIN, 22.85 - JOIN], bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  pantographSlots: panSlots, pantographFittings: shields,
  liveries: { crh: CRH380A_LIVERY },
  weight: { end: 50, middle: 48 }, power: 1200, maxspeed: 350,
};
