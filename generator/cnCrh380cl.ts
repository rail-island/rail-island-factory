// The CRH380CL (CNR Changchun, 2012), the 16-car 380 km/h train on the Velaro CN's body with a nose of
// its own (designed with Hitachi), drawn on the series kit (shinkansen.ts). Its photographs
// (assets/cr-crh380cl/, SOURCES.md) show the CRH3C's body behind the nose unchanged - doors, window
// band, roof units, pantograph cars, the white livery with its thin blue band - so the design reuses the
// CRH3C's body (cnCrh3c.ts) and draws its own cab face: a nose about 1.85 m longer and lower than the
// Velaro's, its tip 1.05 m up; the coupler hatch only a seam outline on the one smooth surface (no bulb);
// an oval canopy over a silver louvred grille; teardrop lamps on the nose's flanks; a small cab side
// window ahead of a long lounge window; the blue band diving down the flank to a point under the lamps.
// See docs/models/china-units.md.
//
// Heights over the rail, lat across the face (viewer's right positive), d behind the nose's tip.

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c } from "./seriesHelpers.ts";
import { CRH3C, CRH3C_FACE, CRH_LIVERY, HEXIE, mirror, seam } from "./cnCrh3c.ts";

/** The CRH3C's join (7.0 m) moved forward by the longer nose: 403 m over the 16 cars against the CRH380BL's 399.27 m, 1.85 m an end. */
const LONGER = 1.85;
const JOIN = CRH3C_FACE.dJoin + LONGER;

/** The blue band along the cars (the CRH3C's): 1.865 - 1.935 m. */
const BAND: readonly [number, number] = [1.865, 1.935];

/**
 * The nose's centre line, one smooth convex curve (photo-crh380cl-5603, about 180 px/m at the nose): the
 * plough's foot at 0.64 m, the tip 1.05 m up, the coupler hatch's seam to 1.53 m (0.3 m back), the
 * characters, the grille's foot at 1.88 m 0.77 m back, the glass's foot at 2.35 m 1.5 m back, the canopy
 * rising at about 22 degrees and the roof reaching full height at the join.
 */
const PROFILE: Pt[] = [
  [0.64, 0.62], [0.72, 0.4], [0.8, 0.24], [0.9, 0.11], [1.05, 0], [1.15, 0.015], [1.27, 0.07], [1.4, 0.17], [1.52, 0.3],
  [1.65, 0.46], [1.8, 0.66], [1.97, 0.9], [2.15, 1.18], [2.35, 1.5], [2.6, 2.05], [2.85, 2.65], [3.1, 3.35], [3.3, 4.05], [3.5, 4.9],
  [3.65, 5.75], [3.75, 6.6], [3.84, JOIN],
];

/** The canopy's glass on the nose's sides ([y, d] edges), its foot over the grille, running back over the cab to 6.3 m. */
const GLASS_BACK: Pt[] = [[2.35, 1.55], [2.45, 2.6], [2.6, 3.5], [2.8, 4.4], [3.05, 5.1], [3.35, 5.7], [3.72, 6.3]];
const RIM_BACK: Pt[] = GLASS_BACK.map(([y, d]): Pt => [y, d + 0.07]);
/** The louvred grille under the glass: its foot 1.88 m on the centre line, rising back along the flanks under the canopy's edge. */
const GRILLE_BACK: Pt[] = [[1.88, 0.85], [1.97, 1.15], [2.15, 1.75], [2.3, 2.45], [2.45, 3.0]];

/** The coupler hatch's seam (viewer's right half, mirrored), measured head-on on photo-crh380cl-5606, and its centre split. */
const HATCH: Pt[] = [[0, 1.53], [0.3, 1.53], [0.55, 1.5], [0.71, 1.43], [0.78, 1.3], [0.8, 1.1], [0.79, 0.9], [0.73, 0.78], [0.6, 0.7], [0.35, 0.68], [0, 0.68]];
const SPLIT: Pt[] = [[0, 0.68], [0, 1.53]];

/** The grille's louvres: dark vertical strokes 7.5 cm apart across it. */
const LOUVRES = Array.from({ length: 12 }, (_, i) => 0.0375 + i * 0.075).map((l): Pt[] => {
  // the grille's foot rising toward its ends
  const foot = 1.9 + 0.5 * l * l;
  return [[l - 0.008, foot], [l + 0.008, foot], [l + 0.008, 2.36], [l - 0.008, 2.36]];
});

/** The characters "Hexie hao" over the hatch (photo-crh380cl-5606): he, xie, hao 0.5 m apart. */
const CHAR_AT: readonly number[] = [-0.5, 0, 0.5];
const CHAR_Y = 1.62, CHAR_H = 0.15;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.6, 1.88, BAND[0], BAND[1], 2.05, 2.25, 2.45, 2.73, 3.72])].sort((a, b) => a - b);

export const CRH380CL_FACE: SeriesCabFace = {
  ...CRH3C_FACE,
  dJoin: JOIN, first: 8.45 + LONGER, tolerance: 0.06,
  profile: PROFILE,
  // a broad, round snout: the corner the whole half width, reaching full width 2.9 m behind the centre
  // line low down, further back over the lamps and the canopy (to the join over the cab)
  corner: [[0.64, 2.0], [3.84, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, 2.9 + Math.max(0, y - 2.1) * 4.5))]),
  rows: ROWS,
  lodBands: [[0, 9, "white"]],
  lod: {
    profile: PROFILE, corner: [[0.64, 2.0], [3.84, 2.0]], rows: [0.64, 0.9, 1.05, 1.4, 1.8, 2.15, 2.6, 3.1, 3.5, 3.84],
    cornerDepth: [[0.64, 2.9], [1.9, 2.9], [2.6, 5.0], [3.1, 4.9], [3.5, 3.9], [3.84, 0.05]],
  },
  lodGlass: { hw: 1.0, y: [2.35, 3.7] },
  paint: [
    // the silver grille under the canopy, the canopy's dark rim and its tinted glass
    { mat: "grille", front: [[1.88, -9], [2.45, -9]], back: GRILLE_BACK, top: 2.45, lat: 1.12 },
    { mat: "cabMask", front: [[2.31, -9], [3.75, -9]], back: RIM_BACK, top: 3.75, lat: 1.12 },
    { mat: "cabGlass", front: [[2.35, -9], [3.72, -9]], back: GLASS_BACK, top: 3.72, lat: 1.07 },
    // the windscreen proper: the canopy's clearer lower part (the cab seen through it) under the tinted roof glass
    { mat: "screen", front: [[2.4, -9], [3.0, -9]], back: [[2.4, 1.75], [2.6, 2.6], [3.0, 3.6]], top: 3.0, lat: 0.98 },
  ],
  fields: [],
  decals: [
    ...LOUVRES.flatMap((pts) => [{ mat: "slat", pts, fine: 1 }, { mat: "slat", pts: mirror(pts), fine: 1 }]),
    ...[...seam(HATCH, 0.008), ...seam(SPLIT, 0.006)].flatMap((pts) => [{ mat: "hatchSeam", pts, fine: 2 }, { mat: "hatchSeam", pts: mirror(pts), fine: 2 }]),
    ...HEXIE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [CHAR_AT[i]! + (x - 0.5) * CHAR_H, CHAR_Y + y * CHAR_H]), 0.0075)))
      .map((pts) => ({ mat: "cabMask", pts, fine: 1 })),
  ],
  texts: [],
  lamps: [],
  wipers: [[[0.1, 2.42], [0.5, 2.95]]],
};

/** The teardrop lamp on each flank ([y, d] edges): rounded at its front foot 1.8 m behind the tip, slim and rising to its pointed rear top 3.75 m back, 2.56 m up. */
const LAMP_FRONT: Pt[] = [[1.97, 1.98], [2.03, 1.84], [2.1, 1.81], [2.18, 1.93], [2.29, 2.45], [2.4, 2.95], [2.5, 3.45], [2.56, 3.75]];
const LAMP_BACK: Pt[] = [[1.97, 1.98], [2.03, 2.45], [2.1, 2.85], [2.2, 3.2], [2.35, 3.5], [2.56, 3.75]];
const RIM_FRONT: Pt[] = [[1.94, 1.95], [2.01, 1.78], [2.1, 1.75], [2.19, 1.88], [2.3, 2.42], [2.41, 2.93], [2.51, 3.43], [2.59, 3.81]];
const RIM_BACK_L: Pt[] = [[1.94, 1.95], [2.0, 2.45], [2.08, 2.88], [2.18, 3.25], [2.33, 3.56], [2.59, 3.81]];

/** The CRH livery on the CRH380CL's nose; unit CRH380CL-5603 (photo-crh380cl-5603). */
const CRH380CL_LIVERY: ShinkansenLivery = {
  ...CRH_LIVERY,
  number: "CRH380CL-5603",
  palette: { ...CRH_LIVERY.palette, grille: c("#a7acaf", 0.4), slat: c("#6d7376", 0.5), lampRim: c("#2a2d30", 0.3), screen: c("#4f5f69", 0.15), hatchSeam: c("#55595c", 0.5) },
  endSweeps: [
    // the band falling from the body's level just ahead of the join to its point on the flank under the lamp, 2.6 m behind the tip
    { mat: "blue", front: [[1.5, 2.6], [BAND[1], JOIN - 0.1]], back: [[1.5, 2.6], [BAND[0], JOIN - 0.1], [BAND[1], JOIN + 0.05]], face: true },
    // the lamps: a dark rim round a clear lens, the red lamp at its front foot, the headlamp behind it
    { mat: "lampRim", front: RIM_FRONT, back: RIM_BACK_L, face: true },
    { mat: "lens", front: LAMP_FRONT, back: LAMP_BACK, face: true },
    { mat: "lampRed", front: [[2.0, 1.95], [2.04, 1.9], [2.09, 1.93]], back: [[2.0, 1.95], [2.04, 2.15], [2.09, 2.12]], face: true },
    { mat: "lampHead", front: [[2.15, 2.5], [2.22, 2.42], [2.29, 2.55]], back: [[2.15, 2.5], [2.22, 2.9], [2.29, 2.85]], face: true },
    // the small cab side window under the lamp's tail, leaning forward
    { mat: "cabGlass", front: [[1.66, 3.83], [1.95, 3.65], [2.05, 4.37]], back: [[1.66, 3.83], [1.78, 4.53], [2.05, 4.37]], face: true },
    // the lounge window behind it, its top falling to the front with the roof, two black frames between its panes
    { mat: "cabGlass", front: [[1.82, 5.06], [2.19, 4.75], [2.6, 6.5], [2.73, 9.1]], back: [[1.82, 5.06], [2.02, 9.1], [2.73, 9.1]], face: true },
    { mat: "rubber", front: [[1.9, 6.6], [2.7, 6.6]], back: [[1.9, 6.68], [2.7, 6.68]] },
    { mat: "rubber", front: [[1.95, 7.9], [2.73, 7.9]], back: [[1.95, 7.98], [2.73, 7.98]] },
  ],
};

export const CRH380CL: ShinkansenSeries = {
  ...CRH3C,
  // 27.525 m end cars (the CRH3C's 25.675 m and the longer nose), the body behind the join the CRH3C's
  endLength: CRH3C.endLength + LONGER,
  cabFace: CRH380CL_FACE,
  liveries: { crh: CRH380CL_LIVERY },
  // the 16-car train: 19,200 kW (eight motor cars, 8 x 4 x 600 kW), 380 km/h design, 350 km/h in service; drawn to 8 cars
  weight: { end: 58, middle: 52 }, power: 1200, maxspeed: 350,
};
