// The Renfe S-130 (Talgo 250 "Patito", assets/renfe-s130/SOURCES.md): two Talgo/Bombardier
// dual-voltage power cars and the low Talgo coaches between them, drawn on the series kit
// (shinkansen.ts) with a cab face of its own (seriesCab.ts) whose depth is a solid of this
// module (`s130Depth`): the round coupler cover (the duck's bill) standing out of the nose
// under a short, blunt bonnet with its louvred grille and the wedge headlights wrapped round its
// corners, the grey cab canopy above the bonnet's crease with the near-upright windscreen, the
// lamp strip over it and the cab side windows, and the white of the sides rising under the
// canopy to the roof at the crew door. The coaches ride on single axles shared at the joints
// (the series kit's `jacobsTrailers` on a zero wheelbase), the power cars on two-axle bogies of
// their own (`endCarBogie`). The livery: white, a grey roof on the power cars, two purple
// stripes along the train that dip toward the nose. See docs/models/spain-trains.md.
//
// Heights over the rail, d behind the tip (the coupler cover's front, 1.0 m up), lat from the
// centre line. Scales: the side photo photo-renfe-class-130-12249678646.jpg (x4 crop) about
// 47 px/m along the power car and 85 px/m up it (perspective; heights read against the 4.0 m
// roof); the head-on photo-serie-130-a-su-llegada-a-valladolid.jpg (x2 crop) 238 px/m across
// the coupler cover (2.96 m body) and about 300 px/m up the bonnet; the three-quarter
// photo-renfe-130-14356370257.jpg (x2 crop) about 190 px/m up the nose; the coach side
// photo-renfe-class-130-12249678646.jpg (x4 crop) 68 px/m up a coach (3.36 m roof).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { crownPane, sideDecal } from "./sliceBody.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { block } from "./vehicleParts.ts";
import { insulator, singleArm } from "./czElectricKit.ts";
import { c, nose } from "./seriesHelpers.ts";

/** The power car's section: half width (2.96 m), belly, shoulder, crown (4.0 m), lean, skirt bottom and top. */
const [W, Y, S, C, LEAN, B, A] = [1.47, 1.0, 3.35, 4.0, 0.95, 0.43, 0.62];
/** The Talgo coach's shoulder and crown (3.36 m high, Talgo 7). */
const COACH: { S: number; C: number } = { S: 3.0, C: 3.36 };
/** Where the face meets the body's own section: just ahead of the crew door. */
const JOIN = 7.6;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerpT = (t: readonly Pt[], x: number): number => {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    const [xa, va] = t[i - 1]!, [xb, vb] = t[i]!;
    if (x <= xb) return xb - xa < 1e-9 ? vb : va + ((x - xa) / (xb - xa)) * (vb - va);
  }
  return t[t.length - 1]![1];
};

/** The body's half width at height y (the kit's section: tucked in under the belly, leaning in to the shoulder, the roof's arc). */
function bodyHalf(y: number): number {
  if (y <= A) return W * (0.9 + 0.07 * clamp01((y - B) / (A - B)));
  if (y <= Y) return W * (0.97 + 0.03 * ((y - A) / (Y - A)));
  if (y <= S) return W * (1 - (1 - LEAN) * Math.min(1, (y - Y) / (S - Y)));
  return y < C ? W * LEAN * Math.sqrt(Math.max(0, 1 - ((y - S) / (C - S)) ** 2)) : 0;
}

/**
 * The nose's centre line without the bill (heights from the head-on photo at about 297 px/m, the
 * side from photo-renfe-130-14356370257): the recess under the bill, the bonnet's front just over the
 * bill's top (0.72 m back at 1.6 m), rising to its crease at 2.4 m (1.85 m back), the canopy's
 * steeper foot, the windscreen 2.8 - 3.62 m leaning back about 45 degrees, the lamp strip over it
 * and the roof's curve reaching the crown 4.9 m back.
 */
const PROFILE_BODY: Pt[] = [
  [B, 1.3], [0.5, 1.25], [1.0, 1.05], [1.45, 0.88], [1.52, 0.8], [1.6, 0.72], [1.75, 0.8], [2.0, 1.1], [2.2, 1.43], [2.4, 1.85],
  [2.6, 2.1], [2.8, 2.36], [3.2, 2.8], [3.62, 3.3], [3.8, 3.58], [3.9, 3.84], [3.96, 4.15], [3.99, 4.6], [C, 4.9],
];
/**
 * How far back the plan's corner reaches full width, by height: the bonnet blunt (its headlights
 * wrapping round its corners), the canopy narrowing above the crease - its corners sweeping back
 * 3.6 m, the cab side windows set on them, seen from ahead beside the windscreen.
 */
const DEPTH_BODY: Pt[] = [[B, 1.5], [1.5, 1.5], [1.6, 1.7], [2.3, 1.9], [2.55, 2.6], [2.8, 3.5], [3.62, 3.6], [3.85, 2.8], [3.97, 1.3], [C, 0.6]];
/** The corner's superellipse power by height (2 round; more a flatter front with tighter corners). */
const POW_BODY: Pt[] = [[B, 2.0], [2.3, 2.2], [2.8, 2.6], [3.9, 2.6], [C, 2.5]];

/** The bill (the coupler cover): from 0.5 m to 1.5 m, its front at 0.95 m, a broad U seen head on, 2.56 m wide. */
const [BILL_LO, BILL_HI, BILL_Y, BILL_HW] = [0.55, 1.45, 0.95, 1.28];
/** The bill's centre line: an elliptic bulge, 0.45 m back at its top and bottom edges. */
function billFront(y: number): number {
  const h = y >= BILL_Y ? BILL_HI - BILL_Y : BILL_Y - BILL_LO;
  const u = Math.min(0.995, Math.abs(y - BILL_Y) / h);
  return 0.3 * (1 - Math.sqrt(1 - u * u));
}
/** The bill's half width at y: rounded shoulders (0.3 m corners) at its top, a broad round U below. */
function billHalf(y: number): number {
  if (y <= BILL_LO || y >= BILL_HI) return 0;
  const rt = 0.3, rb = 0.58;
  if (y > BILL_HI - rt) { const v = (y - (BILL_HI - rt)) / rt; return BILL_HW - rt + rt * Math.sqrt(Math.max(0, 1 - v * v)); }
  if (y < BILL_LO + rb) { const v = (BILL_LO + rb - y) / rb; return BILL_HW - rb + rb * Math.sqrt(Math.max(0, 1 - v * v)); }
  return BILL_HW;
}

/** The body's depth (without the bill) at lat, y. */
function bodyDepth(lat: number, y: number): number {
  const hw = bodyHalf(y);
  if (hw <= 1e-6 || lat >= hw) return JOIN;
  const n = lerpT(POW_BODY, y), t = lat / hw;
  return Math.min(JOIN, lerpT(PROFILE_BODY, y) + lerpT(DEPTH_BODY, y) * (1 - Math.pow(1 - Math.pow(t, n), 1 / n)));
}

/** The bill's depth at lat, y (Infinity off it). */
function billDepth(lat: number, y: number): number {
  const hb = billHalf(y);
  if (hb <= 1e-6 || lat >= hb) return Infinity;
  const t = lat / hb, n = 2.6;
  return billFront(y) + 1.1 * (1 - Math.pow(1 - Math.pow(t, n), 1 / n));
}

/** The surface's depth at (lat, y): the body's, or the bill's where it stands ahead of it; cached by row. */
const DEPTH = new Map<number, Map<number, number>>();
export function s130Depth(lat: number, y: number): number {
  let row = DEPTH.get(y);
  if (!row) DEPTH.set(y, (row = new Map()));
  let v = row.get(lat);
  if (v === undefined) { v = Math.round(Math.min(bodyDepth(Math.abs(lat), y), billDepth(Math.abs(lat), y)) * 1e5) / 1e5; row.set(lat, v); }
  return v;
}

/** The grid's rows: the shape's and the paint's heights. */
const ROWS = [
  B, 0.55, 0.68, 0.85, 1.05, 1.25, 1.45, 1.5, 1.6, 1.75, 1.95, 2.1, 2.25, 2.4,
  2.6, 2.8, 3.05, 3.35, 3.62, 3.8, 3.9, 3.96, C,
];
const PROFILE: Pt[] = ROWS.map((y): Pt => [y, y >= C ? JOIN : s130Depth(0, y)]);

/** A symmetric outline [lat, y] from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
const flip = (pts: Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/**
 * The bonnet's crease (white below, the grey canopy above), seen head on: 2.4 m at the centre,
 * falling to 2.1 m 1.15 m out; from there the canopy's edge turns up and out to the cab side
 * window's foot (1.42 m out, 2.8 m up), the white rising under the window
 * (photo-serie-130-a-su-llegada-a-valladolid).
 */
const CREASE_LAT = (y: number) => 1.15 * Math.sqrt(Math.max(0, (2.4 - y) / 0.3));
/** The crease as the canopy's front edge [y, d]: under 2.4 m only its outer parts are grey. */
const CREASE: Pt[] = [2.1, 2.16, 2.22, 2.28, 2.33, 2.37, 2.395].map((y): Pt => [y, r4(s130Depth(Math.min(bodyHalf(y) - 0.01, CREASE_LAT(y)), y))]);
/** The canopy's outer edge seen head on, from the crease's end up to the window's foot; then the window's outer edge; over the shoulder the grey roof, to the join. */
const CANOPY_LAT: Pt[] = [[2.1, 1.15], [2.3, 1.08], [2.5, 1.02], [2.7, 0.98], [2.82, 0.96]];
const CANOPY_BACK: Pt[] = [...CANOPY_LAT.map(([y, l]): Pt => [y, r4(s130Depth(Math.min(l, bodyHalf(y) - 0.01), y))]), [2.84, r4(s130Depth(1.38, 2.84))], [3.4, JOIN + 0.05], [C + 0.1, JOIN + 0.05]];

/** The cab side window seen head on (viewer's right): its inner edge raked like the windscreen's pillar, its outer edge upright, rounded corners. */
const SIDE_WIN: Pt[] = [[0.97, 2.86], [1.22, 2.84], [1.36, 2.88], [1.4, 2.98], [1.38, 3.3], [1.33, 3.45], [1.22, 3.56], [1.06, 3.58], [0.98, 3.5], [0.95, 3.2]];
const sideWin = (sd: number, grow: number): Pt[] => {
  const [cl, cy] = [1.17, 3.2];
  const out = SIDE_WIN.map(([l, y]): Pt => [r4(Math.min(bodyHalf(y) - 0.02, cl + (l - cl) * (1 + grow))), r4(cy + (y - cy) * (1 + grow))]);
  return sd > 0 ? out : flip(out);
};

/** The windscreen's glass and its black frame (with the lamp strip over it), seen head on. */
const SCREEN: Pt[] = mirror([[0, 2.8], [0.6, 2.8], [0.69, 2.84], [0.72, 2.92], [0.7, 3.62], [0, 3.62]]);
const FRAME: Pt[] = mirror([[0, 2.75], [0.62, 2.75], [0.74, 2.8], [0.78, 2.9], [0.76, 3.94], [0, 3.95]]);
const STRIP: Pt[] = mirror([[0, 3.67], [0.68, 3.67], [0.68, 3.9], [0, 3.91]]);
/** The grey U-panel's outline under the windscreen (the canopy's seam). */
const U_SEAM = (sd: number): Pt[] => {
  const o: Pt[] = [[0.75, 2.76], [0.73, 2.64], [0.65, 2.52], [0.5, 2.465], [0, 2.46]];
  const i: Pt[] = [[0, 2.475], [0.5, 2.48], [0.64, 2.535], [0.715, 2.65], [0.735, 2.76]];
  const pts = [...o, ...i];
  return sd > 0 ? pts : flip(pts);
};

/** A wedge headlight on viewer's side sd (head on): the inner end low and pointed, the outer end high and round, wrapping round the corner (1.6 - 1.97 m). */
const lampShape = (sd: number, grow: number): Pt[] => {
  const pts: Pt[] = [[0.86, 1.6], [1.18, 1.6], [1.31, 1.62], [1.37, 1.69], [1.38, 1.83], [1.33, 1.93], [1.22, 1.97], [1.1, 1.9], [0.97, 1.76]];
  const [cl, cy] = [1.2, 1.79];
  const out = pts.map(([l, y]): Pt => [r4(cl + (l - cl) * (1 + grow)), r4(cy + (y - cy) * (1 + grow * 2.5))]);
  return sd > 0 ? out : flip(out);
};


/** A polyline as thin quads, each counter-clockwise seen head-on. */
const strokeQuads = (pts: readonly Pt[], t: number): Pt[][] => pts.slice(1).map((b, i): Pt[] => {
  const a = pts[i]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * t, ny = ((b[0] - a[0]) / len) * t;
  const q: Pt[] = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area < 0 ? q.reverse() : q;
});

/** The bill's seam seen head on: a thin dark line just inside its outline (up its U-shaped flanks, round its shoulders, across its top) and down its middle to the coupler's slot. */
function billSeam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const ys = Array.from({ length: 14 }, (_, i) => BILL_LO + 0.06 + ((BILL_HI - 0.04 - (BILL_LO + 0.06)) * i) / 13);
  const half: Pt[] = [...ys.map((y): Pt => [billHalf(y) - 0.035, y]), [BILL_HW - 0.4, BILL_HI - 0.035], [0, BILL_HI - 0.035]];
  const line: Pt[] = [...half.map(([l, y]): Pt => [-l, y]), ...half.slice(0, -1).reverse()];
  return [
    ...strokeQuads(line, 0.007).map((pts) => ({ mat: "seam", pts, fine: 2 })),
    { mat: "seam", pts: [[-0.008, 0.84], [0.008, 0.84], [0.008, BILL_HI - 0.04], [-0.008, BILL_HI - 0.04]], fine: 3 },
  ];
}

/** Renfe's lowercase "renfe" (the same strokes as the S-103's, esS103.ts): unit cells, x-height 0.65, the f's ascender to 1 and its tail below the line. */
const RENFE: ReadonlyArray<ReadonlyArray<readonly Pt[]>> = [
  [[[0.22, 0], [0.22, 0.65]], [[0.22, 0.42], [0.42, 0.63], [0.72, 0.62]]],
  [[[0.14, 0.34], [0.84, 0.34], [0.82, 0.52], [0.66, 0.65], [0.34, 0.65], [0.16, 0.5], [0.14, 0.18], [0.32, 0.01], [0.78, 0.04]]],
  [[[0.16, 0], [0.16, 0.65]], [[0.16, 0.46], [0.36, 0.64], [0.64, 0.64], [0.82, 0.48], [0.82, 0]]],
  [[[0.82, 0.92], [0.66, 1], [0.48, 0.96], [0.4, 0.82], [0.4, 0.1], [0.32, -0.12], [0.14, -0.18]], [[0.1, 0.62], [0.72, 0.62]]],
  [[[0.14, 0.34], [0.84, 0.34], [0.82, 0.52], [0.66, 0.65], [0.34, 0.65], [0.16, 0.5], [0.14, 0.18], [0.32, 0.01], [0.78, 0.04]]],
];
const RENFE_ADV = 0.86;
/** The logo's strokes as quads [u, v] (u from its left end, v up from its foot), `h` its cell height, `t` its stroke's half width. */
const renfeQuads = (h: number, t: number): Pt[][] => RENFE.flatMap((glyph, i) => glyph.flatMap((line) => strokeQuads(line.map(([x, y]): Pt => [(i * RENFE_ADV + x) * h, y * h]), t)));
const renfeWidth = (h: number) => (RENFE.length - 1) * RENFE_ADV * h + h;
/** The face's logo between the headlights (photo-serie-130-a-su-llegada-a-valladolid: 1.15 m wide). */
const LOGO_H = 0.21, LOGO_Y = 1.66;

/** The grille's louvres on the bonnet, under the crease (1.98 - 2.28 m, 1.2 m wide): a dark frame and seven slats. */
const GRILLE: Pt[] = [[-0.5, 2.0], [0.5, 2.0], [0.52, 2.26], [-0.52, 2.26]];

const S130_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: JOIN - 0.3, reach: 0.07, first: JOIN + 0.4, roofFrom: 9, cols: [3, 5, 1, 1], tolerance: 0.05,
  profile: PROFILE, corner: [[B, 1.0], [C, 1.0]], cornerDepth: [[B, 1.0], [C, 1.0]], rows: ROWS,
  reshape: (lat, y) => s130Depth(lat, y),
  // the skirt open over the leading bogie, whose front wheels stand under the face (8.4 m behind the tip, 2.6 m wheelbase)
  wheelCut: { d: 8.4 - 2.07, y: A },
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, BILL_LO, "under"], [BILL_LO, 2.4, "white"], [2.4, 9, "canopyG"]],
  // the distant model's nose: the bill, the bonnet and the canopy on few rows
  lod: {
    profile: [[B, 0.6], [BILL_Y, 0], [BILL_HI, 0.45], [1.6, 0.72], [2.4, 1.85], [2.8, 2.36], [3.62, 3.3], [3.94, 4.1], [C, JOIN]],
    corner: [[B, 1.2], [C, 1.0]], cornerDepth: [[B, 1.5], [BILL_HI, 1.5], [2.4, 1.9], [2.8, 3.4], [3.62, 3.5], [3.94, 1.4], [C, 0.05]],
    rows: [B, BILL_Y, BILL_HI, 1.6, 2.4, 2.8, 3.62, 3.94, C],
  },
  lodGlass: { hw: 0.72, y: [2.8, 3.62] },
  paint: [
    // the dark recess under the bill (its slot's grille) and under the bonnet's corners
    { mat: "under", front: [[B - 0.05, -9], [BILL_LO + 0.01, -9]], back: [[B - 0.05, 1.9], [BILL_LO + 0.01, 1.9]], top: BILL_LO + 0.01 },
    // the grey canopy over the crease, its outer edge rising to the side window, on over the roof to the join
    { mat: "canopyG", front: [...CREASE, [2.4, -9], [C + 0.1, -9]], back: CANOPY_BACK },
  ],
  decals: [
    ...billSeam(),
    { mat: "seam", pts: U_SEAM(1), fine: 2 }, { mat: "seam", pts: U_SEAM(-1), fine: 2 },
    // the grille's slats
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => { const y = 2.025 + i * 0.032; return { mat: "black", pts: [[-0.47, y], [0.47, y], [0.475, y + 0.018], [-0.475, y + 0.018]] as Pt[], fine: 2 }; }),
    ...renfeQuads(LOGO_H, 0.014).map((q) => ({ mat: "purple", pts: q.map(([u, v]): Pt => [u - renfeWidth(LOGO_H) / 2, LOGO_Y + v]), fine: 1 })),
  ],
  fields: [
    { mat: "cabMask", pts: FRAME },
    { mat: "cabGlass", pts: SCREEN },
    { mat: "lampStrip", pts: STRIP },
    { mat: "frameDark", pts: GRILLE },
    { mat: "lampRim", pts: lampShape(1, 0.06) }, { mat: "lampRim", pts: lampShape(-1, 0.06) },
    { mat: "lampCover", pts: lampShape(1, 0) }, { mat: "lampCover", pts: lampShape(-1, 0) },
    // the cab side windows on the canopy's swept corners, in black rims
    { mat: "cabMask", pts: sideWin(1, 0.08) }, { mat: "cabMask", pts: sideWin(-1, 0.08) },
    { mat: "cabGlass", pts: sideWin(1, 0) }, { mat: "cabGlass", pts: sideWin(-1, 0) },
  ],
  panes: [],
  lamps: [
    // the three lamps in the strip over the windscreen
    [-0.2, 3.785, 0.065, "lampHead"], [0, 3.785, 0.065, "lampHead"], [0.2, 3.785, 0.065, "lampHead"],
    // the headlight pair and the red tail lamp in each wedge
    [1.1, 1.76, 0.07, "lampHead"], [1.28, 1.79, 0.075, "lampHead"], [0.97, 1.68, 0.035, "lampRed"],
    [-1.1, 1.76, 0.07, "lampHead"], [-1.28, 1.79, 0.075, "lampHead"], [-0.97, 1.68, 0.035, "lampRed"],
  ],
  wipers: [[[0.12, 2.84], [-0.28, 3.42]]],
};


/** The two purple stripes' feet and thicknesses along the train (photo-renfe-class-130-12249678646, photo-bf-bilbao-abando-triebkopf-br-130). */
const STRIPES: ReadonlyArray<readonly [number, number]> = [[1.1, 0.12], [1.34, 0.08]];
/** Where the stripes start dipping toward the nose (just behind the crew door) and their front end, d behind the tip, and how far they drop. */
const [DIP_FROM, STRIPE_END, DIP] = [8.6, 2.75, 0.34];

/** The crew door's span behind the tip (endSides): the stripes break over it. */
const CREW_DOOR: readonly [number, number] = [JOIN + 0.2, JOIN + 0.95];
/** A stripe's centre line [d, y]: level at height y behind DIP_FROM, falling ever faster toward its front end; with points at the crew door's edges. */
const stripeLine = (y: number): Pt[] => {
  const yAt = (d: number) => (d >= DIP_FROM ? y : y - DIP * ((DIP_FROM - d) / (DIP_FROM - STRIPE_END)) ** 1.4);
  const n = Math.round((DIP_FROM - STRIPE_END) / 0.25);
  const ds = [...new Set([...Array.from({ length: n + 1 }, (_, i) => STRIPE_END + ((DIP_FROM - STRIPE_END) * i) / n), ...CREW_DOOR, 19.6])].sort((a, b) => a - b);
  return ds.map((d): Pt => [d, yAt(d)]);
};

const PURPLE = "#74214f";
/** The scheme the S-130s carried in Alvia and Euromed service from delivery (2007): white, a grey canopy and power-car roof, two purple stripes. */
export function s130Livery(number: string): ShinkansenLivery {
  const sides = (white: string): Array<[number, number, string]> => [[0, STRIPES[0]![0], white], [STRIPES[0]![0], STRIPES[0]![0] + STRIPES[0]![1], "purple"], [STRIPES[0]![0] + STRIPES[0]![1], STRIPES[1]![0], white], [STRIPES[1]![0], STRIPES[1]![0] + STRIPES[1]![1], "purple"], [STRIPES[1]![0] + STRIPES[1]![1], 9, white]];
  return {
    title: "Alvia", number,
    palette: {
      white: c("#eeefec"), purple: c(PURPLE, 0.4), canopyG: c("#b3b8bc", 0.55), roofG: c("#d5d8da", 0.55), skirtG: c("#c4c8ca", 0.6),
      cabMask: c("#1b1d20", 0.3), seam: c("#7a7f84", 0.5), frameDark: c("#6b7075", 0.5), black: c("#151719", 0.6),
      lampCover: c("#262c33", 0.2), lampRim: c("#8d9398", 0.35),
      lampStrip: c("#c9ced2", 0.3),
    },
    bands: sides("white"),
    roof: "roofG", skirt: "skirtG",
    // the power car's side: white over its whole height (the stripes are its sweeps, dipping toward the nose)
    endBands: [[0, 9, "white"]],
    // the distant power car: its stripes level behind the dip
    lodSideFields: { end: [{ d: [DIP_FROM - 1.0, 20.5], bands: sides("white") }] },
    endRoofEdge: { mat: "canopyG", y: C - 0.001, d: [JOIN, JOIN, JOIN] },
  };
}

/** The coach: one plug door near its front end with a narrow window, five wide windows to its rear end (photo-renfe-class-130-12249678646, x4 crop). */
const COACH_WINDOWS: Array<readonly [number, number]> = Array.from({ length: 5 }, (_, i) => [3.35 + 1.82 * i, 3.35 + 1.82 * i + 1.5] as const);

/** The power car's two single-arm pantographs on the roof's middle (photo-130-07-en-el-cambiador-de-valdestillas, photo-l06-270-bf-gerona-130-027): the front one raised, the rear one folded. */
const PAN_FRONT = 11.0, PAN_REAR = 14.4;

/**
 * The power car's two stripes on both sides, from their upright front end on the nose's flank (ahead
 * of the face's join, where a sweep would only reach the face's coarse side cells) dipping toward the
 * nose, level from just behind the crew door to the car's inner end: strips standing 4 mm off the
 * section (the kit's own: `bodyHalf`).
 */
function stripes(m: MeshBuilder, X: (d: number) => number): void {
  for (const [y0, t] of STRIPES) {
    const line = stripeLine(y0 + t / 2);
    for (const sd of [1, -1]) {
      const pts: Array<[number, number, number]> = [];
      const at = (d: number, y: number): [number, number, number] => [X(d - JOIN), y, sd * (bodyHalf(y) + 0.004)];
      for (let i = 0; i + 1 < line.length; i++) {
        const [[da, ya], [db, yb]] = [line[i]!, line[i + 1]!];
        if ((da + db) / 2 > CREW_DOOR[0] && (da + db) / 2 < CREW_DOOR[1]) continue;
        pts.push(at(da, ya - t / 2), at(db, yb - t / 2), at(db, yb + t / 2), at(da, ya - t / 2), at(db, yb + t / 2), at(da, ya + t / 2));
      }
      m.facets("purple", pts, [0, 0, sd]);
    }
  }
}

/** The power car's "renfe" on both sides, d its centre behind the body's front, reading left to right on both (photo-renfe-class-130-12249678646: 2.5 m wide, its foot 2.05 m up, 11.9 m behind the tip). */
function sideMark(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d: number): void {
  const h = 0.56, w = renfeWidth(h), dir = Math.sign(X(0) - X(1));
  for (const sd of [1, -1]) {
    const at = ([u, v]: Pt): Pt => [d - dir * sd * (u - w / 2), 2.05 + v];
    sideDecal(m, b, X, sd, "purple", renfeQuads(h, 0.04).flatMap((q) => [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!].map(at)), 0.004);
  }
}

/** The power car's roof equipment, the second (folded) pantograph and its underframe; the coach's underframe. */
function s130Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) {
    m.scope("roof gear", () => {
      // the folded pantograph's base plate and arm, the roof line between the two and its insulators
      const xr = X(PAN_REAR - JOIN);
      block(m, "roofG", Math.min(xr - 1.6, xr + 1.6), Math.max(xr - 1.6, xr + 1.6), C - 0.06, C + 0.05, -0.85, 0.85);
      singleArm(m, { xc: xr, roofY: C + 0.05, baseY: C + 0.3, h: -1, raised: false });
      const [a, e] = [PAN_FRONT - JOIN + 1.3, PAN_REAR - JOIN - 1.3];
      block(m, "pantograph", Math.min(X(a), X(e)), Math.max(X(a), X(e)), C + 0.2, C + 0.24, 0.3, 0.34);
      insulator(m, X((a + e) / 2), 0.32, C - 0.04, C + 0.2);
      // the main breaker and the roof hatch behind the pantographs
      const xb = X(PAN_REAR - JOIN + 2.2);
      block(m, "canopyG", xb - 0.7, xb + 0.7, C - 0.05, C + 0.2, -0.4, 0.4);
      for (const sd of [1, -1]) crownPane(m, b, X, sd, "frameDark", [PAN_REAR - JOIN + 3.2, PAN_REAR - JOIN + 4.6], [0.05, 0.55], 0.004);
    });
    m.scope("renfe mark", () => sideMark(m, b, X, 11.9 - JOIN));
    m.scope("stripes", () => stripes(m, X));
    // the underframe between the bogies: transformer and converter cases, dark
    m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 1.9), X(car.trucks[0]! + 1.9), B - 0.32, B, -W * 0.85, W * 0.85));
    return;
  }
  // the coach's low floor: a shallow tank between its single axles
  m.scope("underfloor", () => block(m, "under", X(car.length - 2.4), X(2.4), B - 0.12, B, -W * 0.8, W * 0.8));
}

/** The S-130: 20.0 m power cars (Bo'Bo', 1,040 mm wheels) and 13.14 m Talgo coaches on 880 mm single wheelsets. */
export const S130: ShinkansenSeries = {
  endLength: 20.0, midLength: 13.14, W, Y, S, C, lean: LEAN, B, A,
  nose: nose(0.1, 1, 2, [[0, C]], [[0, S]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]), windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S130_FACE,
  trailerSection: COACH,
  // the coach's window band 1.5 - 2.5 m under the stripes; the door 0.85 m wide with a narrow window high in the leaf
  windows: [[1.5, 2.5]], windowW: 1.5, pitch: 1.82, door: [0.62, 2.62, 1.62, 2.4], doorW: 0.85, doorGlassW: 0.3,
  layout: {
    // the power car: its crew door (endSides below); the coach: one door at its front end, five windows behind it
    end: { doors: [[0.25, 0.9, -1]], windows: [] },
    middle: { doors: [[1.0, 1.85, -1]], windows: COACH_WINDOWS },
  },
  // the power car: no passenger window; its crew door just behind the cab (drawn at the coaches' door heights, the series' one door section)
  endSides: { windows: [], doors: [[0.25, 0.9]] },
  sidePanels: {
    end: [
      // the two small ventilation grilles under the roof's edge
      { d: [9.2, 10.0], y: [3.0, 3.28], kind: "louvres", louvres: 5 },
      { d: [15.6, 16.4], y: [3.0, 3.28], kind: "louvres", louvres: 5 },
      // the equipment hatch on the nose's flank, ahead of the crew door
      { d: [5.9 + 0.0, 6.5], y: [1.6, 1.98], kind: "seam" },
    ],
  },
  numberAt: [-6.0, 1.52, 0.09],
  // the power car's bogies: under the crew door and 2.6 m from its inner end; the coaches' single axles at their joints
  endBogies: [8.4 - JOIN, 17.4 - JOIN], endCarBogie: { wheelbase: 2.6, wheelR: 0.52 },
  bogieCentres: 9.1, wheelR: 0.44, wheelbase: 0, jacobsTrailers: 0.55, minCars: 3, cars: [4, 8],
  endPantograph: true, pantograph: "single", pantographAt: PAN_FRONT - JOIN,
  fittings: s130Fittings,
  liveries: { alvia: s130Livery("130 007") },
  weight: { end: 72, middle: 18 }, power: 2400, maxspeed: 250,
};
