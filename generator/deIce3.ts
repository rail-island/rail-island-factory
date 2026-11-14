// The ICE 3 (DB class 403, and the multi-system 406), drawn on the series kit (shinkansen.ts) with
// its own cab face (seriesCab.ts): the long, rounded snout and the tinted glass canopy over the cab,
// matched to the photographs in assets/db-ice3/ (SOURCES.md). The Velaro of the CRH3C and the
// AVE S-103 (`velaro()` in seriesHelpers.ts) is left as it was. See docs/models/germany-trains.md.
//
// Heights over the rail, d behind the snout's tip (the coupler cover's front, 1.24 m up).

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

const ICE_WHITE = "#eceeee";
const TRAFFIC_RED = "#ec0016";

/** Where the face meets the body; the crown still rises behind it (`endCrown`) to the full 3.89 m. */
const JOIN = 7.0;

/**
 * The snout's centre line: the plough's foot 0.64 m up (just over the leading bogie's bolster) and 0.5 m back, the coupler cover's round
 * front at 1.24 m, the face rising steeply past the lamps (1.7 - 2.1 m) to the canopy's foot at
 * 2.4 m, 0.55 m back, then the glass leaning back at about 25 degrees to 3.55 m, 2.85 m back, the roof falling from the full 3.89 m about 8 m back.
 */
const PROFILE: Pt[] = [
  [0.64, 0.44], [0.75, 0.3], [0.9, 0.16], [1.05, 0.06], [1.15, 0.015], [1.24, 0], [1.4, 0.01], [1.6, 0.05], [1.8, 0.12], [2.0, 0.22],
  [2.2, 0.36], [2.4, 0.55], [2.6, 0.75], [2.8, 1.0], [3.0, 1.32], [3.2, 1.72], [3.4, 2.25], [3.55, 2.85], [3.65, 3.5], [3.72, 4.3], [3.78, 5.2], [3.82, 6.1], [3.84, JOIN],
];

/** The traffic-red stripe on the nose: across the coupler cover at 1.24 - 1.38 m, rising along the sides to the body's stripe (1.66 - 1.84 m) and ending there, 4.8 m back, ahead of the grey ICE. */
const STRIPE_TOP: Pt[] = [[1.38, 0], [1.44, 1.0], [1.54, 2.0], [1.65, 3.0], [1.765, 4.0], [1.84, 4.75]];
const STRIPE_FOOT: Pt[] = [[1.24, 0.0], [1.28, 1.0], [1.36, 2.0], [1.47, 3.0], [1.595, 4.0], [1.66, 4.6], [1.84, 4.85]];
/** Where the lounge's window band starts: its front edge raked like the canopy, 2.6 m behind the tip at the sill. */
const LOUNGE_FRONT: Pt[] = [[2.02, 2.6], [2.3, 2.78], [2.55, 3.05], [2.73, 3.35]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.3, 1.45, 1.66, 1.84, 2.1, 2.3, 2.5, 2.73, 3.3])].sort((a, b) => a - b);

/** The canopy's glass ([y, d] edges on the nose's sides; the glass is drawn as far as `lat` from the centre line). */
const GLASS_BACK: Pt[] = [[2.4, 0.95], [2.55, 1.6], [2.75, 2.3], [3.0, 2.85], [3.25, 3.15], [3.45, 3.3], [3.6, 3.45], [3.65, 3.5]];

export const ICE3_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 8.45, roofFrom: 9, cols: [1, 9, 1, 1], tolerance: 0.04, wrap: true,
  profile: PROFILE,
  // a round snout: the corner is the whole half width, elliptic, reaching full width 3.6 m behind the
  // centre line low down and at the join over the canopy
  corner: [[0.64, 2.0], [3.84, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, 2.6 + Math.max(0, y - 2.4) * 6))]),
  rows: ROWS,
  // the face is white; its paint (the stripe, the canopy, the lamps) is drawn below
  bands: (l) => [[0, 9, l.bands[0]![2]]],
  lodBands: [[0, 1.24, "white"], [1.24, 1.38, "red"], [1.38, 9, "white"]],
  lod: { profile: PROFILE, corner: [[0.64, 2.0], [3.84, 2.0]], rows: [0.64, 0.9, 1.24, 1.6, 2.0, 2.4, 2.8, 3.2, 3.55, 3.84], cornerDepth: [[0.64, 2.6], [2.4, 2.6], [2.8, 5.0], [3.2, 5.0], [3.55, 3.6], [3.84, 0.05]] },
  lodGlass: { hw: 1.05, y: [2.4, 3.65] },
  paint: [
    // the canopy: a dark rim round the tinted glass, wrapping round onto the sides
    { mat: "cabMask", front: [[2.36, -9], [3.68, -9]], back: GLASS_BACK.map(([y, d]): Pt => [y, d + 0.06]), top: 3.68, lat: 1.3 },
    { mat: "cabGlass", front: [[2.4, -9], [3.65, -9]], back: GLASS_BACK, top: 3.65, lat: 1.26 },
    // the dark plough under the coupler cover
    { mat: "under", front: [[0.64, -9], [0.86, -9]], back: [[0.64, 1.3], [0.86, 0.9]] },
  ],
  fields: [
    // the lamp clusters on the snout's upper corners, slanting down to the outside
    // the canopy's lower corners curving up to its sides
    { mat: "white", pts: [[0.5, 2.3], [1.45, 2.3], [1.45, 2.8], [1.2, 2.7], [0.95, 2.56], [0.7, 2.45]] },
    { mat: "white", pts: [[-0.7, 2.45], [-0.95, 2.56], [-1.2, 2.7], [-1.45, 2.8], [-1.45, 2.3], [-0.5, 2.3]] },
    { mat: "frameSilver", pts: [[0.26, 1.7], [0.62, 1.68], [0.86, 2.06], [0.34, 2.1]] },
    { mat: "frameSilver", pts: [[-0.34, 2.1], [-0.86, 2.06], [-0.62, 1.68], [-0.26, 1.7]] },
    // the upper lamp's grey housing under the canopy, and the DB mark between the clusters
    { mat: "frameSilver", pts: [[-0.13, 2.16], [0.13, 2.16], [0.13, 2.36], [-0.13, 2.36]] },
    { mat: "red", pts: [[-0.15, 1.68], [0.15, 1.68], [0.15, 1.82], [-0.15, 1.82]] },
  ],
  panes: [],
  // the clusters' black louvres, parallel to their outer edges
  decals: [0.38, 0.5, 0.62].flatMap((l): Array<{ mat: string; pts: Pt[] }> => [
    { mat: "cabMask", pts: [[l - 0.08, 1.72], [l - 0.04, 1.72], [l + 0.2, 2.06], [l + 0.16, 2.06]] },
    { mat: "cabMask", pts: [[-l - 0.16, 2.06], [-l - 0.2, 2.06], [-l + 0.04, 1.72], [-l + 0.08, 1.72]] },
  ]),
  texts: [{ text: "DB", lat: 0, y: 1.71, h: 0.08, mat: "white" }],
  lamps: [
    [0, 2.26, 0.07, "lampHead"],
    [0.45, 1.82, 0.07, "lampHead"], [0.62, 1.96, 0.05, "lampHead"], [0.7, 2.03, 0.03, "lampRed"],
    [-0.45, 1.82, 0.07, "lampHead"], [-0.62, 1.96, 0.05, "lampHead"], [-0.7, 2.03, 0.03, "lampRed"],
  ],
  wipers: [[[0.15, 2.62], [0.55, 3.25]]],
};

/** The livery: white, the traffic-red stripe under the windows, carried down the nose to the coupler cover; the grey ICE ahead of the windows. */
function ice3Livery(title: string, number: string, skirt: string, extra: Record<string, ReturnType<typeof c>> = {}): ShinkansenLivery {
  return {
    title, number,
    palette: { white: c(ICE_WHITE), red: c(TRAFFIC_RED), grey: c("#8c9196", 0.45), roofG: c("#dfe2e3", 0.55), skirtG: c(skirt, 0.6), cabMask: c("#1d1f22", 0.3), ...extra },
    bands: [[0, 1.66, "white"], [1.66, 1.84, "red"], [1.84, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the side's stripe from just behind the grey ICE on to the body's (the face is white all round: `wrap`)
      { mat: "red", front: [[1.66, 6.25], [1.84, 6.25]], back: [[1.66, JOIN + 0.05], [1.84, JOIN + 0.05]], face: true },
      { mat: "red", front: [[1.24, -9], ...STRIPE_TOP.map(([y, d]): Pt => [y + 1e-4, d])], back: STRIPE_FOOT, face: true },
      // the lounge's window band behind the cab's glass partition, its front raked, black frames between the panes
      { mat: "cabGlass", front: LOUNGE_FRONT, back: [[2.02, 8.15], [2.73, 8.15]], face: true },
      // its top edge falling to the front with the roof
      { mat: "white", front: [[2.5, -9], [2.74, -9]], back: [[2.5, 3.05], [2.74, 4.4]], face: true },
      { mat: "rubber", front: [[2.02, 5.05], [2.73, 5.05]], back: [[2.02, 5.13], [2.73, 5.13]] },
      { mat: "rubber", front: [[2.02, 6.6], [2.73, 6.6]], back: [[2.02, 6.68], [2.73, 6.68]] },
    ],
    endLettering: [{ text: "ICE", d: 5.55 - JOIN, y: 1.4, h: 0.58, mat: "grey" }],
  };
}

/** Panes of a window band from d0 to d1, about `pitch` apart, black 8 cm pillars between them. */
const paneRow = (d0: number, d1: number, pitch: number): Array<readonly [number, number]> => {
  const n = Math.max(1, Math.round((d1 - d0) / pitch)), w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w + (i ? 0.04 : 0), d0 + (i + 1) * w - (i < n - 1 ? 0.04 : 0)] as const);
};

/** The end car's body behind the join (d from the join): 25.675 m over the couplers less the face, the tip's reach and half the gap. */
const END_BODY = 25.675 - 0.25 - JOIN - 0.07;
const MID_BODY = 24.775 - 0.5;

export const ICE3: ShinkansenSeries = {
  endLength: 25.675, midLength: 24.775, W: 1.475, Y: 1.4, S: 3.15, C: 3.89, lean: 0.95, B: 0.62, A: 1.0,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICE3_FACE,
  endCrown: [[0, 3.84], [1.0, 3.88], [1.5, 3.89]],
  // the window band 2.02 - 2.73 m (black-framed panes, thin pillars); single plug doors with an oval window
  windows: [[2.02, 2.73]], windowW: 1.9, pitch: 2.0, door: [1.2, 3.22, 2.02, 2.86], doorW: 0.97, doorGlassW: 0.5,
  layout: {
    // the end car: the lounge (painted on the nose), its door 8.45 m behind the tip, the saloon's windows to 1.5 m from the inner end
    end: { doors: [[8.45 - JOIN, 9.42 - JOIN, 1]], windows: paneRow(10.0 - JOIN, END_BODY - 1.5, 2.0) },
    // the intermediate cars: one door a side at the front end, the windows from just behind it
    middle: { doors: [[0.6, 1.57, -1]], windows: paneRow(2.2, MID_BODY - 1.5, 2.0) },
  },
  // the leading bogie under the lounge, 5.0 m behind the tip; 17.375 m bogie centres
  endBogies: [5.0 - JOIN, 5.0 - JOIN + 17.375],
  bogieCentres: 17.375, wheelR: 0.46, wheelbase: 2.5,
  // the single-arm pantographs on the transformer cars, the second and the next-to-last
  // (photo-ice-3-parallelfahrt-...: on a long, low roof fairing in the front half of the car)
  pantographsBesideEnds: true, pantographAt: 9.0,
  pantographCover: { len: 7.0, hw: 0.85, top: [6.2, 0.62], h: 0.2, mat: "roofG" },
  liveries: {
    dbIce: ice3Livery("DB ICE", "403 001", "#e0e3e4"),
    nsInternational: ice3Livery("NS International", "406 051", "#003082", { nsBlue: c("#003082") }),
  },
  weight: { end: 55, middle: 50 }, power: 1000, maxspeed: 330,
};
