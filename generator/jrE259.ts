// JR East's E259 series "Narita Express" (2009) on the series kit (shinkansen.ts), drawn
// from the photographs and figures in assets/jr-e259/SOURCES.md: its high cab with the
// gangway door in a flat white face, the wide raked windscreen under a black cap, the
// wedge of the cab's side window, the skirt's white corner fairings over a black lip; the
// white body with its continuous dark window band, the carmine roof. Two liveries: the
// renewed one of 2023 (`nex`: the gangway door silver with "SERIES E259") and the
// original of 2009 (`original`: the door black with the vertical N'EX and its aeroplane).
// Used by jpEmus.ts. See docs/models/jp-emus.md, "JR E259".

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import type { SliceBody } from "./sliceBody.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { block } from "./vehicleParts.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);

// Published figures (ja.wikipedia "JR東日本E259系電車"): 21,430 mm end car and 20,500 mm
// intermediate car over the couplers (bodies 21.0 and 20.0 m), body 2,946 mm wide, roof
// 3,655 mm and floor 1,140 mm above the rail; single-leaf doors 935 mm wide; the window band's
// glass 745 mm tall.
const W = 1.473, B = 0.95, S = 3.2, C = 3.655;
/** The face meets the body 3.6 m behind its tip: the cab's side window lies on the face's own sides. */
const DJOIN = 3.6;
const REACH = 0.18;

/**
 * The bars of stroke-font letters, laid on the face turned a quarter left (the original's
 * vertical "N'EX", reading upward, the letters' tops toward the viewer's left): each segment
 * [u0, v0, u1, v1] in a letter's own unit box, the letter at u from y0 up, w long and h tall,
 * its foot at lat `foot`; t the bar's width. Convex quads in [lat, y].
 */
function upwardBars(segs: ReadonlyArray<readonly [number, number, number, number]>, y0: number, w: number, foot: number, h: number, t: number): Pt[][] {
  return segs.map(([u0, v0, u1, v1]) => {
    const [a, b] = [[y0 + u0 * w, foot - v0 * h], [y0 + u1 * w, foot - v1 * h]] as const;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [dy, dl] = [((b[0] - a[0]) / len) * (t / 2), ((b[1] - a[1]) / len) * (t / 2)];
    const [ny, nl] = [-dl, dy];
    // overrun by half the bar so that joints close; [lat, y]
    const q: Array<[number, number]> = [[a[0] - dy + ny, a[1] - dl + nl], [a[0] - dy - ny, a[1] - dl - nl], [b[0] + dy - ny, b[1] + dl - nl], [b[0] + dy + ny, b[1] + dl + nl]];
    const pts = q.map(([y, l]): Pt => [l, y]);
    // counter-clockwise seen from ahead
    let area = 0;
    for (let i = 0; i < 4; i++) { const [p, r] = [pts[i]!, pts[(i + 1) % 4]!]; area += p[0] * r[1] - r[0] * p[1]; }
    return area < 0 ? pts.reverse() : pts;
  });
}

// The original's "N'EX" (photo-e259-ne018.jpg head on, 202 px/m on the face): white block letters
// 0.42 m tall reading upward on the left of the door, N from 1.26 m, E, X to 2.51 m; the X's
// crossing gives way to the red diamond.
const NEX_FOOT = -0.21, NEX_H = 0.42, NEX_T = 0.085;
const NEX_LETTERS: Pt[][] = [
  ...upwardBars([[0.1, 0, 0.1, 1], [0.1, 1, 0.9, 0], [0.9, 0, 0.9, 1]], 1.26, 0.36, NEX_FOOT, NEX_H, NEX_T),
  // the apostrophe, high on the line
  ...upwardBars([[0.5, 1, 0.3, 0.72]], 1.63, 0.12, NEX_FOOT, NEX_H, NEX_T * 0.8),
  ...upwardBars([[0.9, 1, 0.1, 1], [0.1, 1, 0.1, 0], [0.1, 0, 0.9, 0], [0.1, 0.52, 0.75, 0.52]], 1.78, 0.33, NEX_FOOT, NEX_H, NEX_T),
  // the X's four arms, stopping short of the diamond at its crossing
  ...upwardBars([[0.1, 0, 0.36, 0.33], [0.64, 0.67, 0.9, 1], [0.1, 1, 0.36, 0.67], [0.64, 0.33, 0.9, 0]], 2.15, 0.36, NEX_FOOT, NEX_H, NEX_T),
];
const NEX_DIAMOND: Pt[] = [[NEX_FOOT - NEX_H / 2, 2.27], [NEX_FOOT - NEX_H / 2 + 0.06, 2.33], [NEX_FOOT - NEX_H / 2, 2.39], [NEX_FOOT - NEX_H / 2 - 0.06, 2.33]];
/** The grey aeroplane flying toward the viewer's right at the top of the door, its trail running back to the X. */
const NEX_PLANE: Pt[][] = [
  [[-0.16, 2.513], [0.46, 2.5], [0.46, 2.54], [-0.16, 2.527]],
  [[0.44, 2.495], [0.7, 2.505], [0.73, 2.52], [0.7, 2.535], [0.44, 2.545]],
  // the swept wings
  [[0.3, 2.54], [0.68, 2.54], [0.6, 2.85]],
  [[0.6, 2.19], [0.68, 2.5], [0.3, 2.5]],
];

/**
 * The E259's cab face (photo-e259-ne018.jpg and -ne007.jpg head on, photo-kuroe259-1.jpg and
 * photo-e259-ne002-... from the side): a white face, flat across the gangway door (1.4 m wide,
 * from the body's bottom up to the windscreen at 3.12 m) and leaning back 0.15 m over its
 * height, its corners rounding back 0.9 m with the teardrop lamp housings on them; the wide
 * windscreen raked back to the black cap over the cab, the white pillars beside it running
 * back over the cab's side windows.
 */
const E259_FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 2.2, first: 5.02, roofFrom: 9, reach: REACH, wrap: true, cols: [8, 6, 1, 2], tolerance: 0.015, bulge: 0.04,
  profile: [[0.95, 0.1], [1.05, 0.05], [1.3, 0.01], [1.6, 0], [2.6, 0.06], [3.12, 0.16], [3.2, 0.22], [3.3, 0.36], [3.45, 0.7], [3.52, 0.95], [3.58, 1.3], [3.62, 1.75], [3.645, 2.4], [C, DJOIN]],
  corner: [[0.95, 0.72], [2.6, 0.76], [3.12, 0.76], [3.3, 0.7], [3.52, 0.55], [3.62, 0.35], [C, 0.08]],
  cornerDepth: [[0.95, 0.85], [2.6, 0.95], [3.12, 0.95], [3.3, 0.9], [3.52, 0.75], [3.62, 0.5], [C, 0.12]],
  rows: [0.95, 1.05, 1.3, 1.45, 1.6, 1.9, 2.2, 2.45, 2.6, 2.9, 3.0, 3.12, 3.16, 3.2, 3.3, 3.38, 3.45, 3.5, 3.52, 3.56, 3.58, 3.62, 3.645, C],
  // white up to the shoulder, the black cap over the cab above it (the cab's sides too)
  bands: () => [[0, S, "white"], [S, 9, "black"]],
  lodBands: [[0, S, "white"], [S, 9, "black"]],
  fields: [
    // the narrow white pillars beside the windscreen (lat 0.88 - 1.02 m), the side window outside them
    { mat: "white", pts: [[0.84, 3.1], [1.02, 3.1], [1.02, 3.46], [0.98, 3.52], [0.86, 3.54]] },
    { mat: "white", pts: [[-1.02, 3.1], [-0.84, 3.1], [-0.86, 3.54], [-0.98, 3.52], [-1.02, 3.46]] },
  ],
  masks: [
    // the windscreen's black surround, then the gangway door over it
    { lat: [-0.88, 0.88], y: [3.08, 3.64], r: 0.12, mat: "black" },
    { lat: [-0.7, 0.7], y: [0.95, 3.13], r: 0.05, mat: "facePanel" },
    // the teardrop lamp housings on the corners
    { lat: [0.86, 1.08], y: [1.96, 2.62], r: 0.11, mat: "black" },
    { lat: [-1.08, -0.86], y: [1.96, 2.62], r: 0.11, mat: "black" },
  ],
  panes: [{ lat: [-0.84, 0.84], y: [3.16, 3.56], r: 0.1 }],
  decals: [
    ...NEX_LETTERS.map((pts) => ({ mat: "nexInk", pts, fine: 1 })),
    { mat: "nexRed", pts: NEX_DIAMOND, fine: 1 },
    ...NEX_PLANE.map((pts) => ({ mat: "nexPlane", pts, fine: 1 })),
    // the door's two leaves meet in the middle, below and above the aeroplane's trail
    { mat: "rubber", pts: [[-0.008, 0.98], [0.008, 0.98], [0.008, 2.47], [-0.008, 2.47]], fine: 1 },
    { mat: "rubber", pts: [[-0.008, 2.58], [0.008, 2.58], [0.008, 3.1], [-0.008, 3.1]], fine: 1 },
  ],
  // the renewed livery's "SERIES E259" over the door (in the door's own paint on the original), the JR mark low on it
  texts: [
    { text: "SERIES", lat: -0.38, y: 2.9, h: 0.09, mat: "seriesInk" },
    { text: "E259", lat: 0, y: 2.56, h: 0.27, mat: "seriesInk" },
    { text: "JR", lat: 0.52, y: 1.34, h: 0.08, mat: "jrInk" },
  ],
  lamps: [[-0.97, 2.42, 0.075, "lampHead"], [0.97, 2.42, 0.075, "lampHead"], [-0.97, 2.2, 0.05, "lampRed"], [0.97, 2.2, 0.05, "lampRed"]],
  wipers: [[[-0.45, 3.18], [-0.05, 3.45]], [[0.35, 3.18], [0.75, 3.45]]],
};

/** The skirt under the face: [y, d of its front and back behind the tip, half width, corner across and its depth]. */
const E259_LIP: ReadonlyArray<readonly [number, number, number, number, number, number]> = [[0.2, -0.04, 0.85, 1.3, 0.6, 0.7], [0.42, -0.04, 1.0, 1.36, 0.65, 0.75]];
const E259_FAIRING: ReadonlyArray<readonly [number, number, number, number, number, number]> = [[0.42, 0.0, 1.0, 1.36, 0.65, 0.75], [0.7, 0.03, 1.3, 1.4, 0.7, 0.8], [0.98, 0.07, 1.55, 1.43, 0.72, 0.85]];

/** The E259's underfloor box, and on the end car the skirt (white corner fairings over a black lip, the dark coupler pocket between them) and the coupler. */
function e259Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(t0 + 2.6), B - 0.35, B, -W * 0.8, W * 0.8));
  if (!car.end) return;
  const ring = ([, df, db, hw, r, rd]: readonly [number, number, number, number, number, number]): Ring => {
    const pts: Array<[number, number]> = [];
    const n = 5;
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.sin(t)), -(hw - r + r * Math.cos(t))]); }
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]); }
    pts.push([db, hw], [db, -hw]);
    const out: Ring = pts.map(([d, z]): [number, number] => [X(d - DJOIN), z]);
    let area = 0;
    for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
    // counter-clockwise seen from above (+y): negative shoelace area in (x, z)
    return area > 0 ? out.reverse() : out;
  };
  const loft = (mat: string, rows: typeof E259_LIP, bottom: boolean) => {
    const rings = rows.map(ring);
    if (bottom) m.cap(mat, rings[0]!, rows[0]![0], false);
    for (let i = 0; i + 1 < rings.length; i++) m.loft(mat, rings[i]!, rows[i]![0], rings[i + 1]!, rows[i + 1]![0], false);
  };
  m.scope("skirt", () => {
    m.scope("lip", () => loft("skirtG", E259_LIP, true));
    m.scope("fairings", () => loft("white", E259_FAIRING, false));
    m.scope("coupler pocket", () => block(m, "black", X(0.65 - DJOIN), X(-0.01 - DJOIN), 0.44, B + 0.02, -0.62, 0.62));
  });
  m.scope("coupler", () => {
    block(m, "rubber", X(0.6 - DJOIN), X(-0.05 - DJOIN), 0.78, 0.9, -0.08, 0.08);
    block(m, "under", X(-0.05 - DJOIN), X(-REACH - DJOIN), 0.72, 0.96, -0.16, 0.16);
  });
}

/**
 * The cab's side window ([y, d] edges behind the tip, on the face's corners and its cab sides) and
 * the white round it (photo-jre-series-e259r-ne003.jpg head on: the glass from lat 1.02 m out and
 * down to 2.86 m behind the narrow white pillar; photo-kuroe259-1.jpg and photo-e259-ne002-... from
 * the side): the window's foot rising steeply behind the corner and running nearly level just over
 * the shoulder back past the join, its head under a white arch 0.07 m wide that carries the pillar
 * back over the window (at half width 1.0 - 1.15 m on the roof's arc), the black cap over that.
 */
const CAB_WINDOW = {
  front: [[2.86, 0.23], [3.1, 0.28], [3.2, 0.34], [3.3, 0.49], [3.4, 0.78], [3.46, 1.02]] as Pt[],
  // the foot, then the head falling from 3.46 m to 3.42 m at the join
  back: [[2.86, 0.26], [2.95, 0.45], [3.05, 0.8], [3.15, 1.3], [3.21, 2.0], [3.25, 2.8], [3.28, 3.62], [3.42, 3.62], [3.46, 1.12]] as Pt[],
  face: true,
};
const CAB_SURROUND = {
  // from the shoulder up only: white is the face's own band below it
  front: [[3.18, 0.27], [3.3, 0.42], [3.4, 0.7], [3.45, 0.87], [3.5, 1.12], [3.54, 1.42]] as Pt[],
  back: [[3.18, 3.62], [3.5, 3.62], [3.54, 1.5]] as Pt[],
  face: true,
};

/** Both liveries' white body, carmine roof and the end car's cab roof: the black cap to 5.2 m behind the tip, then white up to the roof's slanted red edge. */
const e259Livery = (title: string, number: string, palette: ShinkansenLivery["palette"], endLettering: ShinkansenLivery["endLettering"]): ShinkansenLivery => ({
  title, number, endLettering,
  palette: {
    // the carmine as the photographs show it: a crimson leaning to pink (sunlit roof sides sample
    // 238,128,159 on Ne003, 253,134,161 on Moha E259-1, 211,135,158 on NE018), darker than those
    // highlights; the published #e30304 reads too orange-red beside them
    white: c("#f4f5f3", 0.35), red: c("#d4325c", 0.35), black: c("#0b0c0e", 0.3), skirtG: c("#2a2c2f", 0.6), under: c("#3d4044", 0.8),
    ...palette,
  },
  bands: [[0, 9, "white"]], roof: "red", skirt: "skirtG",
  endSweeps: [
    { mat: "white", ...CAB_SURROUND, top: 3.55 },
    { mat: "cabGlass", ...CAB_WINDOW, top: 3.55 },
  ],
  endRoofEdge: { mat: "black", y: C, d: [DJOIN, 5.2, 5.2] },
  frontRoof: "white",
  capSlope: { y: S - 0.02, d: [5.2 - DJOIN, 8.4 - DJOIN, 6.8 - DJOIN] },
});

/** The E259's end car (Kuro E259, the Green car) and intermediate car (Moha E259) sides, d behind the body's front. */
const E259_LAYOUT = {
  // the passenger door behind the crew door, the Green saloon's long window, a small one near the rear
  end: { doors: [[5.02 - DJOIN, 5.96 - DJOIN, 1]], windows: [[8.7 - DJOIN, 16.0 - DJOIN]] },
  // a door near each end, the continuous window between (photo-mohae259-1.jpg, 78 px/m at its near end)
  middle: { doors: [[0.55, 1.49, -1], [18.51, 19.45, 1]], windows: [[3.5, 17.6]] },
} as const;

const NO_NOSE: NoseShape = { len: 0.1, tip: 1, power: 2, C: [[0, 3.6]], S: [[0, 3.3]], Y: [[0, 1.3]], A: [[0, 1.1]], B: [[0, 1.0]] };

export const E259: ShinkansenSeries = {
  endLength: 21.43, midLength: 20.5, W, Y: 1.3, S, C, lean: 0.97, B, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: E259_FACE,
  // the continuous window band: the glass and the black over it up to the shoulder in one dark frame
  windows: [[1.84, 3.17]], windowW: 1.4, pitch: 1.75, door: [1.1, 3.08, 1.82, 2.88], doorW: 0.935, doorGlassW: 0.45,
  layout: { end: E259_LAYOUT.end, middle: E259_LAYOUT.middle },
  sidePanels: {
    end: [
      // the crew door behind the cab, its window high in the leaf; the small window near the rear
      { d: [4.05, 4.75], y: [1.15, 3.05], kind: "seam" },
      { d: [4.17, 4.63], y: [2.2, 2.85], kind: "window" },
      { d: [17.2, 17.9], y: [1.95, 2.75], kind: "window" },
    ],
  },
  // the bogies 13.8 m apart, 3.1 m in from the inner ends; the end car's leading one under its doors
  endBogies: [4.3 - DJOIN, 18.1 - DJOIN], midBogies: [3.1, 16.9],
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  // the PS33D single-arm pantograph over the rear bogie of the Moha E259
  pantographAt: 16.6,
  liveries: {
    nex: e259Livery("Narita Express", "KURO E259-1",
      // 2023: the door silver with "SERIES E259" in navy; the N'EX gone from the front
      { facePanel: c("#c5c5c5", 0.3), nexInk: c("#c5c5c5", 0.3), nexRed: c("#c5c5c5", 0.3), nexPlane: c("#c5c5c5", 0.3), seriesInk: c("#1c2a4e", 0.4), jrInk: c("#1c2a4e", 0.4) },
      [{ text: "SERIES E259", d: 19.6 - DJOIN, y: 2.3, h: 0.14, mat: "seriesInk" }]),
    original: e259Livery("NEX 2009", "KURO E259-2",
      // 2009: the door black with the white N'EX, its red diamond and the grey aeroplane; the red N'EX over the cab's doors
      { facePanel: c("#0b0c0e", 0.3), nexInk: c("#f4f5f3", 0.35), nexRed: c("#d4325c", 0.35), nexPlane: c("#8f959b", 0.4), seriesInk: c("#0b0c0e", 0.3), jrInk: c("#b9bdc1", 0.4) },
      [{ text: "NEX", d: 6.0 - DJOIN, y: 2.95, h: 0.2, mat: "red" }, { text: "SERIES E259", d: 7.2 - DJOIN, y: 2.95, h: 0.07, mat: "red" }, { text: "NEX", d: 19.6 - DJOIN, y: 2.3, h: 0.2, mat: "nexPlane" }]),
  },
  fittings: e259Fittings,
  // the distant model: the black cap over the cab (the white strip behind it is left to the full model)
  lodRoof: { d: [0.6, 5.2], hw: 1.1, y: [3.25, C + 0.01], mat: "black" },
  weight: { end: 44, middle: 41 }, power: 560, maxspeed: 130,
};
