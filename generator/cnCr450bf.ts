// The Fuxing CR450BF (CRRC Changchun, the "Light of Technology" prototype CR450BF-0501 unveiled in
// December 2024) on the series kit (shinkansen.ts): its long pointed nose as a cab face
// (seriesCab.ts) whose depth is a solid of the module's own (`bfDepth`) - one smooth surface from
// the chin to the roof, the rounded tip a part of it (the coupler cover only a thin flush seam,
// never a lump standing out), the dark navy canopy over the whole upper nose with its red-edged
// front point and the gold emblem, the windscreen in it, the black line sweeping up the flank into
// the window band, the raked cab side window, the gunmetal lower body and the red stripe under the
// charcoal window band. Narrowed from its real 3.36 m to the Shinkansen gauge.
//
// Measured on the photographs in assets/cr-cr450bf/ (SOURCES.md): the near side-on view from the
// Dongguantou bridge (December 2025) and the three-quarter view from the same bridge (July 2025),
// each rectified by a 1-D projective fit along the end car (the tip, the joint 28.75 m behind it,
// the body's height at two places), the Jinanxi station three-quarter view (the canopy's red
// point, the emblem, the coupler cover's seam, the crew door) and the CIIE 2025 model from above
// (the plan). Heights over the rail, d behind the tip, lat from the centre line.
// See docs/models/china-units.md, "The CR450BF's body".

import type { MaterialSpec } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";

/** Where the nose meets the body's own section: just behind the canopy's end on the crown. */
const JOIN = 11.5;
/** The end car over its couplers (211.4 m for eight cars: 2 x 28.75 + 6 x 25.65) and an intermediate car. */
const END_LENGTH = 28.75;
const MID_LENGTH = 25.65;
/** The body: half width (3.36 m narrowed to 3.24 m in the gauge), belly, shoulder, crown (0.2 m lower than the CR400BF's 4.05 m), lean, skirt bottom and top. */
const [W, Y, S, C, LEAN, B, A] = [1.62, 1.45, 3.0, 3.85, 0.96, 0.42, 0.9];

type Tab = readonly Pt[];

/** The body's half width at height y (the kit's section: tucked in under the belly, leaning in to the shoulder, the roof's arc). */
function bodyHalf0(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * Math.max(0, (y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  if (y <= S) return W * (1 - (1 - LEAN) * ((y - Y) / (S - Y)));
  return y < C ? W * LEAN * Math.sqrt(1 - ((y - S) / (C - S)) ** 2) : 0;
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

/** The tip's height: the centre of the rounded point (the side views: 1.1 - 1.17 m). */
const TIP_Y = 1.12;
/**
 * The nose's section by d: a superellipse round its widest height. The top line rises from the tip
 * and only flattens going back (its slope falls all the way: no knob, no neck, no step - the side
 * views: 1.8 m 1 m back, 2.6 m at 3 m, 3.25 m at 5 m, the crown 3.85 m 10 m back); the bottom line
 * falls from the tip to the skirt 3 m back, its slope only easing; the half width the plan of the
 * CIIE model (a round point, 1.8 m wide 1 m back).
 */
const NT = smooth([[0, TIP_Y], [0.12, 1.36], [0.35, 1.55], [0.8, 1.77], [1.5, 2.05], [2.5, 2.42], [3.5, 2.75], [4.5, 3.03], [5.5, 3.27], [6.5, 3.46], [7.5, 3.61], [8.5, 3.72], [9.5, 3.8], [10.5, 3.84], [JOIN, C]]);
const NB = smooth([[0, TIP_Y], [0.12, 0.88], [0.35, 0.7], [0.8, 0.55], [1.4, 0.46], [2.2, 0.43], [3.2, B]]);
const NA = smooth([[0, 0], [0.06, 0.3], [0.2, 0.52], [0.5, 0.72], [1.0, 0.89], [1.6, 1.02], [2.5, 1.16], [3.5, 1.28], [5.0, 1.41], [6.5, 1.5], [8.0, 1.56], [9.5, 1.6], [JOIN, W]]);
const YC = smooth([[0, TIP_Y], [1.5, 1.16], [4.0, 1.3], [8.0, 1.42], [JOIN, Y]]);
/** The superellipse's powers above and below the widest height: round at the tip, fuller toward the body. */
const NTE = smooth([[0, 2.2], [2.0, 2.15], [6.0, 2.3], [JOIN, 2.6]]);
const NBE = smooth([[0, 2.2], [1.5, 2.5], [4.0, 3.6], [8.0, 5.0], [JOIN, 6.0]]);
/** The section blends into the body's own over its last BLEND m. */
const BLEND = 4.0;

/** The nose's half width at d and height y (0 off it): its superellipse drawn into the body's section toward the join. */
function halfAt(d: number, y: number): number {
  const [a, top, bot, yc] = [NA(d), NT(d), NB(d), YC(d)];
  const [u, n] = y >= yc ? [(y - yc) / Math.max(1e-6, top - yc), NTE(d)] : [(yc - y) / Math.max(1e-6, yc - bot), NBE(d)];
  let w = u >= 1 ? 0 : a * Math.pow(1 - Math.pow(u, n), 1 / n);
  if (w > 0 && d > JOIN - BLEND) {
    const t = Math.min(1, (d - (JOIN - BLEND)) / BLEND), s = t * t * (3 - 2 * t);
    w += (bodyHalf0(y) - w) * s;
  }
  return w;
}

/** The first d at which the nose reaches lat at height y (bisection; the half width only grows toward the join). */
function sectionDepth(lat: number, y: number): number {
  if (halfAt(JOIN, y) <= lat) return JOIN;
  let [a, b] = [0, JOIN];
  for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (halfAt(m, y) > lat) b = m; else a = m; }
  return b;
}

/** The surface's depth at (lat, y); cached (the grid asks each point many times). */
const DEPTH = new Map<number, Map<number, number>>();
export function bfDepth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = Math.round(sectionDepth(Math.abs(lat), y) * 1e5) / 1e5; row.set(lat, v); }
  return v;
}

/** The grid's rows: dense over the tip and the canopy's front, the paint's heights. */
const ROWS = [B, 0.46, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9, 1.0, 1.05, TIP_Y, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.35, 2.5, 2.65, 2.8, 2.95, 3.1, 3.25, 3.4, 3.55, 3.7, 3.8, C];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, bfDepth(0, y)]);

/** The d on the surface at height y and lat (4 decimals). */
const dAt = (lat: number, y: number) => Math.round(bfDepth(Math.round(lat * 1e4) / 1e4, y) * 1e4) / 1e4;

/**
 * The canopy's lower edge [y, head-on half width | null, d on the side] (Jinanxi, the bridge views):
 * its front a rounded point 1.52 m up just over the coupler cover, widening up the face, then on the
 * side rising back - 1.76 m 2.6 m back, 2.05 m at 4.5 m, 2.6 m at 7.8 m - to the crown 11.3 m back.
 */
const CANOPY: ReadonlyArray<readonly [number, number | null, number?]> = [
  [1.52, 0.04], [1.55, 0.16], [1.59, 0.27], [1.64, 0.38], [1.7, 0.49], [1.76, 0.6],
  [1.82, null, 2.7], [1.9, null, 3.4], [2.05, null, 4.5], [2.3, null, 6.0], [2.6, null, 7.8], [2.85, null, 9.2], [3.1, null, 10.2], [3.4, null, 10.9], [3.65, null, 11.2], [C, null, 11.3],
];
const canopyEdge = (): Pt[] => CANOPY.map(([y, w, side]): Pt => [y, w === null ? side! : dAt(w, y)]);
/** The red edge round the canopy's front, 0.06 m wide, running out along its sides to nothing 5.5 m back. */
const redEdge = (): Pt[] => {
  const out: Pt[] = [[1.46, dAt(0.03, 1.46)]];
  for (const [y, w, side] of CANOPY) {
    if (w !== null) { out.push([y, dAt(w + 0.07, y)]); continue; }
    const t = Math.max(0, Math.min(1, (5.5 - side!) / 2.5)), yy = Math.round((y - 0.06 * t) * 1e4) / 1e4;
    if (yy > out[out.length - 1]![0] + 1e-6) out.push([yy, side!]);
  }
  return out;
};
/** The windscreen in the canopy's front (h1: the clear glass with the wiper, 2.45 - 3.55 m up), within 0.95 m of the centre line. */
const SCREEN: Pt[] = [[2.45, 4.9], [2.8, 6.0], [3.1, 6.9], [3.35, 7.6], [3.55, 8.1]];

/** The lower body's edge on the nose: from under the coupler cover rising along the flank to the side's 1.05 m. */
const LOWER: Pt[] = [[B - 0.1, 1.55], [0.45, 1.55], [0.6, 2.2], [0.75, 3.0], [0.9, 4.0], [1.0, 5.0], [1.05, 6.0]];

/**
 * The coupler cover's seam (Jinanxi, h1): a thin dark ring over the tip, its top under the canopy's
 * point (1.0 m back), its sides 1.9 m back, its foot 1.6 m back: short bars [lat, y] on the surface,
 * flush with it - the cover is the nose's own skin.
 */
function seam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [n, t] = [36, 0.006];
  const ring = (e: number): Pt[] => Array.from({ length: n }, (_, i): Pt => {
    const th = (2 * Math.PI * i) / n, [cs, sn] = [Math.cos(th), Math.sin(th)];
    // the ring's d: 1.0 m at its top, 1.9 m on its sides, 1.6 m at its foot
    const d = sn >= 0 ? 1.9 - 0.9 * sn * sn : 1.9 - 0.3 * sn * sn;
    const [a, top, bot, yc] = [NA(d) + e, NT(d) + e, NB(d) - e, YC(d)];
    const [nt, nb] = [NTE(d), NBE(d)];
    const k = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / p);
    const pw = sn >= 0 ? nt : nb, h = sn >= 0 ? top - yc : yc - bot;
    return [Math.round(a * k(cs, pw) * 1e4) / 1e4, Math.round((yc + h * k(sn, pw)) * 1e4) / 1e4];
  });
  const [inner, outer] = [ring(-t - 0.01), ring(t - 0.01)];
  return Array.from({ length: n }, (_, i) => {
    const j = (i + 1) % n;
    return { mat: "seam", pts: [inner[i]!, inner[j]!, outer[j]!, outer[i]!], fine: 2 };
  });
}

/** Thin bars along a closed outline ([lat, y] points), each a decal: an emblem's ring. */
function outline(mat: string, pts: readonly Pt[], t: number): Array<{ mat: string; pts: Pt[]; fine: number }> {
  return pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length]!;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy) || 1, [nx, ny] = [(-dy / l) * t, (dx / l) * t];
    return { mat, pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]] as Pt[], fine: 2 };
  });
}
/** China Railway's emblem in gold on the canopy's red-edged point (Jinanxi): a ring, the rail's head across it and its web. */
function emblem(mat: string): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [cy, rx, ry] = [1.75, 0.17, 0.085];
  const ring = Array.from({ length: 16 }, (_, i): Pt => [Math.round(rx * Math.cos((2 * Math.PI * i) / 16) * 1e4) / 1e4, Math.round((cy + ry * Math.sin((2 * Math.PI * i) / 16)) * 1e4) / 1e4]);
  return [
    ...outline(mat, ring, 0.014),
    { mat, pts: [[-0.1, cy + 0.012], [0.1, cy + 0.012], [0.1, cy + 0.032], [-0.1, cy + 0.032]], fine: 2 },
    { mat, pts: [[-0.016, cy - 0.06], [0.016, cy - 0.06], [0.016, cy + 0.012], [-0.016, cy + 0.012]], fine: 2 },
  ];
}

/** The headlamp strips inside the canopy's glass near its front, along its lower edge (the CIIE model, h1). */
const LAMP: Pt[] = [[0.5, 1.86], [0.68, 1.95], [0.8, 2.03], [0.78, 2.07], [0.66, 2.0], [0.49, 1.91]];
const flip = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

const BF_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 10.5, first: 11.7, reach: 0, roofFrom: 9, cols: [6, 9, 1, 2], tolerance: 0.06, wrap: true,
  // the plan: the face's columns across the centre, the corners out to the body's side (the depth is bfDepth's)
  profile: PROFILE, corner: [[B, 1.0], [C, 1.0]], cornerDepth: [[B, 1.0], [C, 1.0]], rows: ROWS,
  reshape: (lat, y) => bfDepth(lat, y),
  // silver all round; the lower body, the canopy and its edge are paint, the lines and the band the livery's sweeps
  bands: () => [[0, 9, "silver"]],
  lodBands: [[0, 1.0, "lower"], [1.0, 2.2, "silver"], [2.2, 9, "canopy"]],
  paint: [
    { mat: "lower", front: LOWER, back: LOWER.map(([y]): Pt => [y, 99]), top: 1.05 },
    { mat: "red", front: redEdge().map(([y]): Pt => [y, -9]), back: redEdge() },
    { mat: "canopy", front: canopyEdge().map(([y]): Pt => [y, -9]), back: canopyEdge() },
    { mat: "bfGlass", front: SCREEN.map(([y]): Pt => [y, -9]), back: SCREEN, lat: 0.95 },
  ],
  decals: [...seam(), ...emblem("gold")],
  fields: [{ mat: "lampHead", pts: LAMP }, { mat: "lampHead", pts: flip(LAMP) }],
  panes: [], lodGlass: { hw: 0.9, y: [2.5, 3.45] },
  wipers: Array.from({ length: 5 }, (_, i): [Pt, Pt] => {
    const p = (t: number): Pt => [0.32 - 0.5 * t, 2.55 + 0.5 * t];
    return [p(i / 5), p((i + 1) / 5)];
  }),
  // the distant model's nose: the rounded tip, the long rising top, on few rows
  lod: { profile: [[B, 1.6], [0.7, 0.4], [TIP_Y, 0], [1.6, 0.6], [2.4, 2.5], [3.2, 5.3], [3.7, 7.8], [C, JOIN]], corner: [[B, 1.4], [C, 1.2]], cornerDepth: [[B, 6.0], [TIP_Y, 6.5], [2.4, 5.5], [3.2, 4.0], [3.7, 2.2], [C, 0.02]], rows: [B, 0.7, TIP_Y, 1.6, 2.4, 3.2, 3.7, C] },
};

/** A line of paint along a centre line [d, y] of a thickness [d, t] (t 0 at a pointed end), as a sweep's front and back edges by height, rising toward its rear. */
function risingLine(centre: Tab, thick: Tab): { front: Pt[]; back: Pt[] } {
  const ds = Array.from({ length: 31 }, (_, i) => centre[0]![0] + ((centre[centre.length - 1]![0] - centre[0]![0]) * i) / 30);
  const byY = (pts: Pt[]) => [...pts].sort((p, q) => p[0] - q[0]).filter((p, i, a) => i === 0 || p[0] > a[i - 1]![0] + 1e-6).map(([y, d]): Pt => [Math.round(y * 1e4) / 1e4, Math.round(d * 1e4) / 1e4]);
  return {
    front: byY(ds.map((d): Pt => [edgeAt(centre, d) + edgeAt(thick, d) / 2, d])),
    back: byY(ds.map((d): Pt => [edgeAt(centre, d) - edgeAt(thick, d) / 2, d])),
  };
}

/** The livery's lines: the red stripe under the charcoal window band, the lower body's edge. */
const RED: readonly [number, number] = [1.8, 1.93];
const BAND: readonly [number, number] = [1.93, 2.95];
const LOW = 1.05;

/**
 * The end car's sweeps ahead of the body (the bridge views, Jinanxi): the black line from the
 * flank 2.2 m behind the tip, just behind the coupler cover, rising into the window band's foot 8.8 m back; the band's raked front;
 * the red stripe's point under it; the raked cab side window in the band. Later over earlier.
 */
const SWEEPS: NonNullable<ShinkansenLivery["endSweeps"]> = [
  { mat: "black", ...risingLine([[2.2, 1.4], [4.0, 1.55], [6.0, 1.71], [8.9, BAND[0] + 0.02]], [[2.2, 0], [2.8, 0.07], [5.0, 0.11], [8.9, 0.13]]), face: true },
  { mat: "band", front: [[BAND[0], 8.75], [2.3, 8.95], [2.7, 9.25], [BAND[1], 9.55]], back: [[BAND[0], JOIN], [BAND[1], JOIN]], face: true },
  { mat: "red", front: [[RED[0], 11.4], [1.87, 10.8], [RED[1], 10.4]], back: [[RED[0], JOIN], [RED[1], JOIN]], face: true },
  { mat: "cabGlass", front: [[2.08, 9.45], [2.4, 9.7], [2.76, 10.0]], back: [[2.08, 11.25], [2.76, 11.35]], face: true },
];

const SILVER: MaterialSpec = { color: "#c5c9cd", metallic: 0.55, roughness: 0.28 };
const LOWER_MAT: MaterialSpec = { color: "#4b4f55", metallic: 0.5, roughness: 0.35 };
/** The canopy: dark navy glass over the whole upper nose (the photographs: near black in shade, blue under the sky). */
const CANOPY_MAT: MaterialSpec = { color: "#18233a", metallic: 0.35, roughness: 0.12, glass: true };
const BF_GLASS: MaterialSpec = { color: "#2e4258", metallic: 0.4, roughness: 0.06, glass: true };

export const CR450BF_LIVERY: ShinkansenLivery = {
  title: "Light of Technology", number: "CR450BF-0501",
  palette: {
    silver: SILVER, lower: LOWER_MAT, band: c("#2a2d32", 0.3), red: c("#c8102e", 0.35), black: c("#141619", 0.3),
    canopy: CANOPY_MAT, bfGlass: BF_GLASS, gold: { color: "#d6a83c", metallic: 0.7, roughness: 0.3 }, seam: c("#6e7379", 0.45),
    roofG: { color: "#c9cdd1", metallic: 0.5, roughness: 0.35 }, skirtG: LOWER_MAT, white: c("#f4f4f2"),
  },
  // the gunmetal lower body, silver, the red stripe, the charcoal window band, silver up to the roof
  bands: [[0, LOW, "lower"], [LOW, RED[0], "silver"], [RED[0], RED[1], "red"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "silver"]],
  doors: [[0, LOW, "lower"], [LOW, 9, "silver"]],
  roof: "roofG", skirt: "skirtG",
  // "CR450" on the band behind the end car's last window (CR with a small 450 on the real one)
  endLettering: [{ text: "CR450", d: 26.45 - JOIN, y: 2.3, h: 0.3, mat: "white" }],
  endSweeps: SWEEPS,
};

/** The pantographs on cars 3 and 6 of eight (the trailers), only the rear one raised; a shorter train's on the third from its end and the third car. */
const panSlots = (n: number): Array<{ k: number; lowered?: boolean }> => {
  const rear = Math.max(1, n - 3);
  return rear > 2 ? [{ k: 2, lowered: true }, { k: rear }] : [{ k: rear }];
};

/** d on the end car's body (behind the join) from d behind the tip. */
const body = (d: number) => Math.round((d - JOIN) * 1e4) / 1e4;
const span = (a: number, b: number): [number, number] => [body(a), body(b)];

export const CR450BF: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: LEAN, B, A,
  nose: nose(0.1, 1, 2, [[0, C]], [[0, S]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BF_FACE,
  // plug doors with a narrow rounded window; the windows 1.2 m wide in the dark band
  windows: [[2.1, 2.8]], windowW: 1.2, pitch: 1.8,
  door: [1.25, 3.2, 2.15, 3.0], doorW: 1.0, doorGlassW: 0.36, doorGlassR: 0.18,
  layout: {
    // the crew door behind the cab window (seen on the left side), three business windows, the passenger door, three first-class windows
    end: { doors: [[...span(11.7, 12.45), -1], [...span(17.85, 18.9), 1]], windows: [span(13.0, 14.2), span(14.6, 15.8), span(16.2, 17.4), span(20.9, 22.1), span(22.7, 23.9), span(24.5, 25.7)] },
    // one door a side at the front end, eleven windows behind it
    middle: { doors: [[0.85, 1.9, -1]], windows: Array.from({ length: 11 }, (_, i): [number, number] => [Math.round((3.6 + 1.8 * i) * 1e4) / 1e4, Math.round((4.8 + 1.8 * i) * 1e4) / 1e4]) },
  },
  numberAt: [-6.8, 1.45, 0.11],
  // 17.5 m bogie centres, 920 mm wheels behind the full skirts; the end car's leading bogie 7.6 m behind the tip
  endBogies: [body(7.6), body(25.1)], bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.5,
  pantographSlots: panSlots,
  liveries: { tech: CR450BF_LIVERY },
  // the CR400BF's 52 / 50 t less the 10 % CRRC quotes; 16 permanent-magnet motors, about 10.4 MW
  weight: { end: 47, middle: 45 }, power: 1300, maxspeed: 400,
};
