// The Fuxing CR300AF (CRRC Qingdao Sifang, the 250 km/h Fuxing: prototypes 2018, in service from
// December 2020), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the
// CR400AF's family nose, blunter and with its own face - a broad, round coupler cover that is one
// smooth surface with the nose (its seam only a dark line), the gunmetal visor round the windscreen
// edged in red and running back over the cab to a point on the roof, a warm grey chin panel with
// the China Railway emblem, slanted lamp strips at its corners and a lozenge cab side window - and
// the "blue sister" livery: sky blue, the black window band over a white line and a red stripe,
// and the red arrow on the nose (an upper and a lower arm round the band's point). Measured on the
// photographs in assets/cr-cr300af/ (SOURCES.md) and set to the published figures.
//
// Heights over the rail, d behind the nose's tip (the coupler cover's front, 1.0 m up).

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the face meets the body: the crown reaches its full 4.05 m there. */
const JOIN = 9.6;

const SKY = "#a3b9d0";
const CR_RED = "#cf2230";
const BAND = "#2a2b2e";
const VISOR = "#58606a";
const CHIN = "#aaa6a3";

/**
 * The nose's centre line, one convex curve (its slope growing steadily from the coupler cover up):
 * the skirt's foot 0.5 m up and 0.85 m back, the coupler cover's round front at 1.0 m and its seam
 * 1.6 m up, the chin (1.97 - 2.5 m), the windscreen's foot (2.5 m, 1.6 m back) and head (3.45 m,
 * 3.4 m back), the crown nearly at its full 4.05 m 7 m back, reaching it at the join. No step, lip or
 * knob: the cover is one surface with the nose, its seam only painted (a dark line).
 */
const PROFILE: Pt[] = [
  [0.5, 0.85], [0.62, 0.42], [0.8, 0.12], [1.0, 0], [1.25, 0.09], [1.5, 0.37], [1.8, 0.72], [2.1, 1.08],
  [2.5, 1.62], [2.8, 2.1], [3.1, 2.65], [3.4, 3.35], [3.6, 4.0], [3.8, 4.9], [3.95, 5.9], [4.0, 6.9], [4.05, JOIN],
];

/** How far behind the centre line the plan reaches the body's width, by height: a blunt, round snout low down, tapering over the visor. */
const DEPTH: Pt[] = [[0.5, 3.0], [1.0, 3.2], [1.6, 3.6], [2.0, 4.0], [2.5, 4.1], [3.0, 3.8], [3.5, 3.0], [3.9, 1.8], [4.05, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [a, b] = [pts[i - 1]!, pts[i]!]; return a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH, y)))]);
const shift = (pts: readonly Pt[], dd: number): Pt[] => pts.map(([y, d]): Pt => [y, d + dd]);

/** The visor's lower edge seen from the side ([y, d]: the gunmetal ahead of it): from the lamp's top over the cab side window to its point on the roof 9.55 m back; its red edge 0.13 m behind it. */
const VISOR_BACK: Pt[] = [[2.5, 2.95], [2.8, 3.4], [3.0, 4.3], [3.2, 5.2], [3.4, 6.0], [3.6, 6.8], [3.8, 7.5], [3.9, 7.9], [3.97, 8.3], [4.02, 8.8], [4.045, 9.3], [4.06, 9.55]];
/** The cab side window: a lozenge under the visor's edge, 6.6 - 9.2 m back, 2.72 - 3.3 m up. */
const CABWIN_FRONT: Pt[] = [[2.72, 7.0], [3.0, 6.6], [3.3, 7.3]];
const CABWIN_BACK: Pt[] = [[2.72, 9.0], [3.05, 9.2], [3.3, 8.7]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.72, 1.97])].sort((a, b) => a - b);

export const CR300AF_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 12.3, roofFrom: 9, cols: [1, 8, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  // a blunt snout low down (a 1.15 m corner on a front about 1 m wide), a broad, gently bowed face
  // over it, its elliptic corners reaching full width 3 - 4 m behind the centre line
  corner: [[0.5, 1.15], [1.6, 1.15], [2.0, 1.1], [2.4, 1.0], [2.8, 0.95], [3.2, 1.0], [3.6, 1.2], [3.9, 1.6], [4.05, 2.0]],
  cornerDepth: CORNER_DEPTH,
  bulge: [[0.5, 0], [1.6, 0], [2.0, 0.08], [2.5, 0.14], [3.2, 0.14], [3.6, 0.08], [4.05, 0]],
  rows: ROWS,
  // sky blue, the skirt dark grey; the visor, chin, lamps and windows are painted below, the livery's sweeps under them
  bands: () => [[0, 0.72, "skirtG"], [0.72, 9, "sky"]],
  lodBands: [[0, 0.72, "skirtG"], [0.72, 1.97, "sky"], [1.97, 2.48, "chin"], [2.48, 9, "gunmetal"]],
  lod: { profile: PROFILE.filter((_, i) => i % 3 === 0 || i === PROFILE.length - 1), corner: [[0.5, 2.0], [4.05, 2.0]], rows: [0.5, 0.8, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.0, 4.05], cornerDepth: [[0.5, 4.8], [1.0, 5.0], [1.8, 5.2], [2.2, 5.0], [2.6, 4.7], [3.0, 4.0], [3.4, 3.2], [3.8, 1.9], [4.0, 1.0], [4.05, 0.05]] },
  lodGlass: { hw: 0.88, y: [2.54, 3.45] },
  paint: [
    // the coupler cover's seam, flush with the nose: a dark line across the face 1.58 m up and down
    // each side to the skirt 2.5 m behind the tip (the cover is one surface with the nose, no lip)
    { mat: "under", front: [[0.8, 2.3], [1.6, 0.93]], back: [[0.8, 2.36], [1.6, 0.99]] },
    // the warm grey chin panel under the windscreen, between the lamps
    { mat: "chin", front: [[1.95, -9], [2.8, -9]], back: [[1.95, 1.2], [2.05, 1.45], [2.12, 1.33], [2.8, 3.1]] },
    // the visor's red edge, under the windscreen and along the visor's side, then the gunmetal visor over it
    { mat: "red", front: [[2.44, -9], [4.1, -9]], back: shift(VISOR_BACK, 0.13) },
    { mat: "gunmetal", front: [[2.5, -9], [4.1, -9]], back: VISOR_BACK },
    // the cab side windows
    { mat: "cabGlass", front: CABWIN_FRONT, back: CABWIN_BACK },
  ],
  // the windscreen: one rounded pane on the visor, in a thin dark rim
  masks: [{ lat: [-0.94, 0.94], y: [2.5, 3.49], r: 0.3, mat: "cabMask" }],
  panes: [{ lat: [-0.9, 0.9], y: [2.54, 3.45], r: 0.27 }],
  wipers: [[[0.1, 2.6], [0.5, 3.3]]],
  decals: [
    // the coupler cover's seam across the face 1.58 m up (its sides are painted, above) and its split down its middle
    { mat: "under", pts: [[-1.0, 1.565], [1.0, 1.565], [1.0, 1.595], [-1.0, 1.595]], fine: 12 },
    // the lamp strips at the chin's corners, from its foot up to the windscreen's outer corner
    ...[1, -1].map((k) => ({ mat: "lampLens", pts: ([[0.5, 2.08], [0.62, 2.04], [1.08, 2.7], [0.98, 2.78]] as Pt[]).map(([l, y]): Pt => [k * l, y]), fine: 3 })),
    { mat: "under", pts: [[-0.01, 0.6], [0.01, 0.6], [0.01, 1.57], [-0.01, 1.57]], fine: 3 },
    // the roof lamp's box over the windscreen
    { mat: "frameSilver", pts: [[-0.2, 3.56], [0.2, 3.56], [0.2, 3.72], [-0.2, 3.72]], fine: 1 },
    { mat: "lampHead", pts: [[-0.16, 3.59], [0.16, 3.59], [0.16, 3.69], [-0.16, 3.69]], fine: 1 },
    // China Railway's emblem on the chin: an orange ring over a rail's foot
    ...Array.from({ length: 10 }, (_, i) => {
      const at = (a: number, k: number): Pt => [Math.cos(a) * 0.16 * k, 2.3 + Math.sin(a) * 0.075 * k];
      const [a0, a1] = [(2 * Math.PI * i) / 10, (2 * Math.PI * (i + 1)) / 10];
      return { mat: "orange", pts: [at(a0, 0.72), at(a1, 0.72), at(a1, 1.0), at(a0, 1.0)], fine: 1 };
    }),
    { mat: "orange", pts: [[-0.025, 2.2], [0.025, 2.2], [0.025, 2.3], [-0.025, 2.3]], fine: 1 },
    { mat: "orange", pts: [[-0.1, 2.2], [0.1, 2.2], [0.1, 2.22], [-0.1, 2.22]], fine: 1 },
  ],
};

/** The window band's front edge ([y, d] seen from the side): its point 7.95 m back at the band's foot, rounding up to the top 11.5 m back. */
const BAND_FRONT: Pt[] = [[1.85, 7.95], [2.15, 8.6], [2.43, 9.4], [2.65, 10.1], [2.8, 10.8], [2.88, 11.5]];
/** The red arrow's upper arm: from its point on the nose's cheek (4.8 m back, 1.5 m up) rising to the band's top 9.6 m back, 0.65 m deep over the band's point; its lower edge along the band's white rim. */
const ARM_FRONT: Pt[] = [[1.5, 4.8], [2.3, 7.2], [2.95, 9.6]];
const ARM_BACK: Pt[] = [[1.5, 4.8], [1.72, 6.6], [1.85, 7.7], ...BAND_FRONT.slice(1).map(([y, d]): Pt => [y, d - 0.13]), [2.95, 11.2]];
/** The lower arm: from the same point under the band's foot, widening into the side's red stripe (1.64 - 1.77 m) 9 m back. */
const STRIPE_FRONT: Pt[] = [[1.5, 4.8], [1.77, 7.8]];
const STRIPE_BACK: Pt[] = [[1.5, 4.8], [1.64, 9.0], [1.641, 12.5], [1.77, 12.5]];

const bodyBands = (): Array<[number, number, string]> => [
  [0, 0.72, "skirtG"], [0.72, 1.64, "sky"], [1.64, 1.77, "red"], [1.77, 1.85, "white"], [1.85, 2.88, "band"], [2.88, 9, "sky"],
];

function cr300afLivery(title: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      sky: c(SKY, 0.3), red: c(CR_RED), white: c("#eef1f3"), band: c(BAND, 0.3), gunmetal: c(VISOR, 0.25), chin: c(CHIN, 0.35),
      orange: c("#ee7d1e"), frameSilver: c("#c9cdd1", 0.3),
      roofG: c("#9fb2c6", 0.45), skirtG: c("#5f6670", 0.7), cabMask: c("#1d1f22", 0.3), lampLens: c("#3b3f46", 0.2),
    },
    bands: bodyBands(),
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // sky blue ahead of the band's front (the body's band, white line and stripe start behind the arrow)
      { mat: "sky", front: [[2.3, JOIN - 0.02], [2.95, JOIN - 0.02]], back: [[2.3, 12.5], [2.95, 12.5]] },
      // the white between the arrow's arms and round the band's point
      { mat: "white", front: ARM_BACK, back: [[1.5, 4.8], [1.64, 9.0], [1.641, 12.5], [2.95, 12.5]] },
      { mat: "band", front: BAND_FRONT, back: [[1.85, 12.5], [2.88, 12.5]] },
      { mat: "red", front: STRIPE_FRONT, back: STRIPE_BACK, face: true },
      { mat: "red", front: ARM_FRONT, back: ARM_BACK },
    ],
    endLettering: [{ text: "CR", d: 25.4 - JOIN, y: 2.18, h: 0.3, mat: "white" }],
  };
}

/** Panes along a car (d from the body's front): n of width w from d0, `pitch` apart. */
const panes = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);
const J = (d: number) => d - JOIN;

export const CR300AF: ShinkansenSeries = {
  // 208.95 m for eight cars: the end cars 27.525 m from the tip to the coupling plane, the others 25.65 m between the couplers
  endLength: 27.525, midLength: 25.65, W: 1.62, Y: 1.35, S: 3.25, C: 4.05, lean: 0.96, B: 0.55, A: 0.72,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CR300AF_FACE,
  // the panes inside the black band (the end car's six measured on CR300AF-2013); plug doors with a narrow, round-headed window
  windows: [[1.95, 2.78]], windowW: 1.15, pitch: 1.85, door: [1.12, 3.36, 2.3, 3.0], doorW: 1.0, doorGlassW: 0.42, doorGlassR: 0.2,
  layout: {
    // the end car: the one door 12.3 m behind the tip, six panes behind it, a blank rear end with "CR"
    end: { doors: [[J(12.3), J(13.3), -1]], windows: panes(J(14.4), 6, 1.15, 1.85) },
    // the intermediate cars: a door at each end, nine panes 1.96 m apart between the vestibules
    middle: { doors: [[0.35, 1.35, -1], [23.8, 24.8, 1]], windows: panes(5.15, 9, 1.4, 1.9625) },
  },
  // 17.8 m bogie centres: the leading bogie 5.8 m behind the tip
  endBogies: [J(5.8), J(23.6)], midBogies: [3.6, 21.4],
  bogieCentres: 17.8, wheelR: 0.46, wheelbase: 2.5,
  sidePanels: {
    end: [{ d: [14.0, 14.55], y: [2.95, 3.1], kind: "panel", mat: "black" }],
    middle: [{ d: [5.15, 5.85], y: [2.93, 3.08], kind: "panel", mat: "black" }, { d: [21.35, 22.05], y: [2.93, 3.08], kind: "panel", mat: "black" }],
  },
  // the running number under the band 10.2 m behind the tip (the photographs' about 8 m: the body starts at the join)
  numberAt: [-8.2, 1.12, 0.13],
  liveries: {
    blue: cr300afLivery("Blue", "CR300AF-2038"),
  },
  // about 400 t empty for eight cars (17 t maximum axle load); 5,600 kW from four motor cars
  weight: { end: 48, middle: 50 }, power: 700, maxspeed: 250,
};
