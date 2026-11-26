// The CRH2G (CRRC Qingdao Sifang, 2015; also built by CRRC Nanjing Puzhen): the 8-car, 250 km/h
// cold-, wind- and sand-resistant CRH2 for the Lanzhou - Xinjiang line and the north-west, with the
// new long nose of the CRH2E "NG" sets in place of the CRH2A's E2-1000 face. Drawn on the series kit
// (shinkansen.ts) with the CRH2A's body section (cnCrh2a.ts) and its own measured cab face
// (seriesCab.ts). See docs/models/china-units.md, "The CRH2G's body".
//
// Measured on assets/cr-crh2g/ (SOURCES.md): photo-crh2g-0001-bcr-20170927151209.jpg square to the
// side (83 px/m from the leading bogie's 2.5 m wheelbase and the 3.7 m roof) for the profile, the door,
// the windows, the stripes and the paint; photo-crh2g-0001-bcr-20170927150440.jpg and
// photo-crh2g-at-xi-anbei-20200429.jpg for the face (the grey mask, the windscreen, the lamps, the
// coupler hatch's seam); photo-201908-crh2g-2422-..., photo-crh2g-2421.jpg and the two Chengdu East
// photographs of 4072 for the series sets and the roof. Published: 201.4 m over the 8 cars (painted on
// the cars), so 25.7 m end cars and 25 m intermediate cars as the CRH2A; 3.38 m wide (3.3 m in the
// gauge), 3.7 m high; 6M2T (Tc M M Mp M Mp M Tc), the pantographs on cars 4 and 6.
//
// The nose: one smooth surface from the skirt over the low snout (its tip 0.84 m up) and the long,
// gently curving bonnet to the roof 7.45 m behind the tip; the coupler hatch only a thin seam on it, no
// cover standing out. A grey mask over the top of the nose round the windscreen, narrowing down to the
// hatch, with the slanted lamp units at its edges; white below, the grey lower body wrapping under the
// snout. On the cab sides an almond side window, three dark slanted strokes and the window band ending
// in a slant ahead of the door; the blue stripe rising over the bonnet and diving to a point by the tip.
// Heights over the rail, d behind the nose's tip, lat across the face (viewer's right positive).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { CRH2A } from "./cnCrh2a.ts";
import { HEXIE, mirror, seam } from "./cnCrh3c.ts";
import { c } from "./seriesHelpers.ts";
import { block } from "./vehicleParts.ts";

/** Where the nose meets the body's own section: the door follows at once. */
const J = 7.45;
/** The body's (skirt's) bottom: the grey side skirts hang lower than the CRH2A's. */
const B = 0.55;
/** The passenger door behind the cab (its outline 7.68 - 8.70 m behind the tip). */
const DOOR: readonly [number, number] = [7.73, 8.65];
/** The dark window band along the cars, the blue stripe under it and the grey lower body's top. */
const BAND: readonly [number, number] = [1.86, 2.73];
const STRIPE: readonly [number, number] = [1.58, 1.68];
const GREY_TOP = 0.96;

/** The centre line [y, d]: the snout's foot, the tip 0.84 m up, the bonnet rising ever steeper to the roof (one convex curve). */
const PROFILE: Pt[] = [
  [B, 0.26], [0.6, 0.165], [0.66, 0.09], [0.72, 0.04], [0.78, 0.01], [0.84, 0], [0.92, 0.015], [1.0, 0.05], [1.1, 0.13], [1.23, 0.28],
  [1.43, 0.58], [1.73, 1.07], [2.1, 1.67], [2.43, 2.27], [2.73, 2.87], [3.0, 3.47], [3.24, 4.08], [3.42, 4.68], [3.54, 5.28], [3.64, 5.95],
  [3.69, 6.7], [3.7, J],
];

/** How far the mask reaches back by height: the grey shield's sides narrowing down to the hatch's top (with `lat` its width round the windscreen). */
const MASK_BACK: Pt[] = [[1.56, 0.95], [1.8, 1.48], [2.1, 2.16], [2.4, 2.89], [2.58, 3.4], [2.9, 4.5], [3.3, 6.0], [3.6, 7.0], [3.75, J + 0.1]];

/** The coupler hatch's seam on the snout (viewer's right half, mirrored), measured head-on, and its split down the middle. */
const HATCH: Pt[] = [[0, 1.535], [0.22, 1.53], [0.42, 1.5], [0.6, 1.42], [0.73, 1.29], [0.81, 1.12], [0.83, 0.95], [0.8, 0.78], [0.72, 0.64], [0.63, 0.56]];
const SPLIT: Pt[] = [[0, B + 0.01], [0, 1.535]];

/** The lamp unit at each lower corner of the mask (viewer's right): a slanted quadrilateral, its tail lamp in the top. */
const LAMP: Pt[] = [[0.38, 2.44], [0.36, 1.84], [0.54, 1.82], [0.86, 2.52]];
const LENS: Pt[] = [[0.405, 2.415], [0.39, 1.87], [0.525, 1.855], [0.815, 2.49]];
const TAIL: Pt[] = [[0.405, 2.415], [0.4, 2.26], [0.69, 2.3], [0.815, 2.49]];

/** The characters "Hexie hao" on the mask over the hatch. */
const CHAR_AT: readonly number[] = [-0.26, 0, 0.26];
const CHAR_Y = 1.62, CHAR_H = 0.13;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.73, GREY_TOP, 1.56, 1.85, 2.58, 3.43])].sort((a, b) => a - b);

export const CRH2G_FACE: SeriesCabFace = {
  dJoin: J, dSide: J - 0.05, reach: 0, first: DOOR[0] + 1.0, roofFrom: 9, cols: [1, 8, 1, 1], tolerance: 0.06,
  profile: PROFILE,
  // a broad, round snout: the corner the whole half width, reaching full width 4 m behind the centre line low down; the
  // bonnet over the lamps flatter, its top broad (the windscreen and the mask lie on it, hardly seen from the side)
  corner: [[B, 2.0], [3.7, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(J - d, y <= 1.8 ? 4.0 : y >= 2.4 ? 2.2 : 4.0 - ((y - 1.8) / 0.6) * 1.8))]),
  rows: ROWS,
  bands: () => [[0, 9, "white"]],
  wrap: true,
  lodGlass: { hw: 0.98, y: [2.6, 3.42] },
  lodPaint: [{ lat: [-0.75, 0.75], y: [1.56, 2.6], mat: "mask" }],
  paint: [
    // the grey lower body carried under the snout's sides
    { mat: "grey", front: [[B, 1.1], [0.73, 2.16], [GREY_TOP, 3.96]], back: [[B, 40], [GREY_TOP, 40]], top: GREY_TOP },
    // the grey mask over the top of the nose
    { mat: "mask", front: [[1.56, -9], [3.75, -9]], back: MASK_BACK, top: 3.75, lat: 1.1 },
  ],
  fields: [
    { mat: "lampRim", pts: LAMP }, { mat: "lampRim", pts: mirror(LAMP) },
    { mat: "lens", pts: LENS }, { mat: "lens", pts: mirror(LENS) },
    { mat: "tail", pts: TAIL }, { mat: "tail", pts: mirror(TAIL) },
  ],
  decals: [
    ...[...seam(HATCH, 0.009), ...seam(SPLIT, 0.006)].flatMap((pts) => [{ mat: "hatchSeam", pts, fine: 1 }, { mat: "hatchSeam", pts: mirror(pts), fine: 1 }]),
    ...HEXIE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [CHAR_AT[i]! + (x - 0.5) * CHAR_H, CHAR_Y + y * CHAR_H]), 0.006)))
      .map((pts) => ({ mat: "ink", pts, fine: 1 })),
  ],
  // the windscreen in its dark rim, split down the middle
  masks: [],
  panes: [
    { lat: [-0.98, 0.98], y: [2.6, 3.42], r: 0.22, mat: "cabGlass" },
    { lat: [-0.012, 0.012], y: [2.61, 3.41], r: 0, mat: "cabMask" },
  ],
  lamps: [],
  wipers: [[[-0.1, 2.64], [0.36, 3.12]]],
};

/** A table of [d, y] linear between its points (clamped). */
function along(t: readonly Pt[], d: number): number {
  if (d <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) if (d <= t[i]![0]) { const [a, b] = [t[i - 1]!, t[i]!]; return a[1] + ((b[1] - a[1]) * (d - a[0])) / (b[0] - a[0]); }
  return t[t.length - 1]![1];
}

/** The blue stripe's centre line [d, y]: on the body's level at the join, rising to its crest 5.2 m behind the tip over the bonnet, diving to its point 0.71 m behind the tip. */
const STRIPE_C: Pt[] = [[0.71, 1.11], [1.07, 1.16], [1.68, 1.31], [2.8, 1.54], [4.1, 1.7], [5.2, 1.775], [6.4, 1.69], [J, (STRIPE[0] + STRIPE[1]) / 2], [J + 0.2, (STRIPE[0] + STRIPE[1]) / 2]];
const CREST = 5.2;
/** Its thickness: the body's 0.1 m, tapering to the point. */
const stripeT = (d: number): number => (STRIPE[1] - STRIPE[0]) * Math.min(1, Math.sqrt(Math.max(0, d - 0.71) / 2.1));
const stripeTop = (d: number): number => along(STRIPE_C, d) + stripeT(d) / 2;
const stripeBottom = (d: number): number => along(STRIPE_C, d) - stripeT(d) / 2;
const FALL_D = [0.71, 0.85, 1.07, 1.35, 1.68, 2.2, 2.8, 3.4, 4.1, 4.6, CREST];
const RISE_D = [CREST, 5.8, 6.4, 6.9, J + 0.2];
/** The stripe from its point up to the crest: between its top line (front) and bottom line (back), [y, d]. */
const STRIPE_FALL = {
  front: FALL_D.map((d): Pt => [stripeTop(d), d]),
  back: [...FALL_D.map((d): Pt => [stripeBottom(d), d]), [stripeTop(CREST), CREST]] as Pt[],
};
/** From the crest back to the body's band: between its bottom line (front) and top line (back). */
const STRIPE_RISE = {
  front: [...[...RISE_D].reverse().map((d): Pt => [stripeBottom(d), d]), [stripeTop(CREST), CREST]] as Pt[],
  back: [[stripeBottom(J + 0.2), J + 0.2], ...[...RISE_D].reverse().map((d): Pt => [stripeTop(d), d])] as Pt[],
};

/** The window band's front end: its foot 7.49 m behind the tip, slanting forward to its top corner, the top edge rising back to the band's top. */
const BAND_FRONT: Pt[] = [[BAND[0], 7.49], [2.62, 6.53], [BAND[1], 7.44]];

const WHITE = "#eef0ee";
const BLUE = "#2350a8";

/** The CRH livery of the CRH2G: white, the dark window band, the blue stripe under it, the grey lower body and the grey mask on the nose. */
const LIVERY: ShinkansenLivery = {
  title: "CRH blue",
  palette: {
    white: c(WHITE), ink: c("#f6f7f5", 0.4), blue: c(BLUE), band: c("#36383c", 0.3), grey: c("#8a8e91", 0.5), mask: c("#565b60", 0.3),
    cabMask: c("#1d1f22", 0.3), hatchSeam: c("#45494e", 0.6), roofG: c("#e1e3e4", 0.6),
    lampRim: c("#25282b", 0.3), lens: { color: "#c3c9ce", metallic: 0.2, roughness: 0.1, glass: true }, tail: c("#d8302c", 0.25),
    roofBox: c("#dcdfe0", 0.5), grille: c("#4f5357", 0.6), panCover: c("#c0c4c7", 0.45),
  },
  bands: [[0, GREY_TOP, "grey"], [GREY_TOP, STRIPE[0], "white"], [STRIPE[0], STRIPE[1], "blue"], [STRIPE[1], BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]],
  roof: "roofG", skirt: "grey", number: "CRH2G-2422",
  endSweeps: [
    // the band's front end on the body white, then the band on the cab side up to its slanted end
    { mat: "white", front: [[BAND[0], -9], [BAND[1], -9]], back: BAND_FRONT },
    { mat: "band", front: BAND_FRONT, back: [[BAND[0], J + 0.3], [BAND[1], J + 0.3]], face: true },
    // three dark strokes ahead of it, each slanting forward going up, shorter toward the nose
    { mat: "band", front: [[1.86, 7.16], [1.91, 6.75], [2.55, 5.74], [2.59, 6.25]], back: [[1.86, 7.16], [2.59, 6.25]], face: true },
    { mat: "band", front: [[1.92, 6.44], [1.97, 6.0], [2.46, 5.11], [2.52, 5.51]], back: [[1.92, 6.44], [2.52, 5.51]], face: true },
    { mat: "band", front: [[2.05, 5.68], [2.08, 5.45], [2.34, 4.54], [2.44, 4.98]], back: [[2.05, 5.68], [2.44, 4.98]], face: true },
    // the almond cab side window over them
    { mat: "cabGlass", front: [[2.51, 4.13], [2.69, 3.71], [2.85, 4.18], [2.98, 4.73]], back: [[2.51, 4.9], [2.65, 5.25], [2.98, 4.73]], face: true },
    // the blue stripe over the bonnet to its point
    { mat: "blue", ...STRIPE_FALL, face: true },
    { mat: "blue", ...STRIPE_RISE, face: true },
  ],
};

/** A raised roof unit (the air conditioning under its sand-proof cover): sloped ends, upright sides with dark grilles, from body d0 to d1. */
function roofUnit(m: MeshBuilder, X: (d: number) => number, d0: number, d1: number): void {
  const C = CRH2A.C, hw = 0.8;
  const [xf, xr] = [X(d0), X(d1)];
  const ring = (a: number, e: number): Array<[number, number]> => [[e, -hw], [a, -hw], [a, hw], [e, hw]];
  m.loft("roofBox", ring(xf, xr), C - 0.2, ring(xf - 0.6, xr + 0.3), C + 0.26);
  const n = 4, len = (d1 - d0 - 1.4) / n;
  for (let i = 0; i < n; i++) {
    const [a, e] = [X(d0 + 0.85 + i * len + 0.08), X(d0 + 0.85 + (i + 1) * len - 0.08)];
    for (const sd of [1, -1]) block(m, "grille", e, a, C + 0.02, C + 0.2, sd > 0 ? hw - 0.01 : -hw - 0.012, sd > 0 ? hw + 0.012 : -hw + 0.01);
  }
}

/** The CRH2G's fittings: the grey plough under the snout, the skirts between the bogies, the roof units. */
function fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("skirt", () => {
    // the plough set back under the snout and ending ahead of the leading bogie's wheels: its top ring
    // just inside the face's bottom edge, its bottom ring behind and narrower
    const ring = (pts: readonly Pt[]): Array<[number, number]> => [...pts.map(([d, l]): [number, number] => [X(d - J), l]), ...[...pts].reverse().map(([d, l]): [number, number] => [X(d - J), -l])];
    const top = ring([[2.2, 1.2], [1.8, 1.06], [1.2, 0.86], [0.7, 0.58], [0.42, 0.29], [0.34, 0]]);
    const bottom = ring([[2.2, 1.06], [1.9, 1.0], [1.35, 0.84], [1.05, 0.6], [0.93, 0.3], [0.9, 0]]);
    const [lo, hi] = [bottom.reverse(), top.reverse()];
    m.loft("grey", lo, 0.13, hi, B + 0.015);
    m.cap("under", lo, 0.13, false);
  });
  m.scope("underfloor", () => {
    // the equipment behind the skirts, and the grey skirt panels' grilles
    const [x0, x1] = [X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6)];
    block(m, "under", x0, x1, 0.3, B + 0.02, -1.25, 1.25);
    const z = CRH2A.W - 0.02;
    for (const f of [0.22, 0.7]) {
      const xc = x0 + (x1 - x0) * f;
      for (const sd of [1, -1]) block(m, "grille", xc - 0.35, xc + 0.35, 0.62, 0.86, sd > 0 ? z - 0.2 : -z + 0.19, sd > 0 ? z - 0.19 : -z + 0.2);
    }
  });
  m.scope("roof units", () => {
    if (car.end) roofUnit(m, X, 19.7 - J, 24.5 - J);
    else roofUnit(m, X, 0.4, 5.1);
  });
}

/** The end car's windows (one for two rows of seats, 1.38 m wide at a 2.03 m pitch) behind the door, then the blank rear end with the CRH mark. */
const endWindows: Array<[number, number]> = Array.from({ length: 7 }, (_, i): [number, number] => [9.48 + 2.03 * i - J, 10.86 + 2.03 * i - J]);

export const CRH2G: ShinkansenSeries = {
  ...CRH2A,
  B,
  cabFace: CRH2G_FACE,
  fittings,
  windows: [[1.98, 2.65]], windowW: 1.38, pitch: 2.03, door: [1.22, 3.26, 2.05, 2.92], doorW: 0.92, doorGlassW: 0.45, doorGlassR: 0.12,
  layout: {
    end: { doors: [[DOOR[0] - J, DOOR[1] - J, 1]], windows: endWindows },
    middle: CRH2A.layout!.middle,
  },
  // the destination display high over the door's rear
  sidePanels: { end: [{ d: [9.74, 10.29], y: [2.9, 3.06], kind: "window" }] },
  // the Mp cars 4 and 6 of eight carry the pantographs
  pantographCars: (n) => (n === 8 ? [3, 5] : undefined),
  // the leading bogie 4.0 m behind the tip (side photograph), 17.5 m ahead of the rear one
  endBogies: [4.0 - J, 21.5 - J],
  liveries: { crh: LIVERY },
  // 6M2T: six motor cars of 4 x 300 kW, 7,200 kW, given as each car's share
  weight: { end: 44, middle: 46 }, power: 900, maxspeed: 250,
};
