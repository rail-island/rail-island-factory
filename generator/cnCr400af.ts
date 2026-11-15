// The Fuxing CR400AF (CRRC Qingdao Sifang), drawn on the series kit (shinkansen.ts) with its own
// cab face (seriesCab.ts): the long "dragon" nose with its bullet coupler cover, the gunmetal
// visor round the windscreen edged in red, the long pointed headlamps and cab side windows, the
// red sweep rising from the nose into the cab's window band, and the silver body with its black
// window band over a red stripe. Measured on the line-scan side photograph and the photographs in
// assets/cr-cr400af/ (SOURCES.md). See docs/models/china-units.md, "The CR400AF's body".
//
// Heights over the rail, d behind the nose's tip (the coupler cover's front, 1.0 m up). The line
// scan's scale is 22.6 px/m both ways (its intermediate car 25.65 m between the joints, its body
// 4.05 m over the rail).

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the face meets the body: the crown reaches its full 4.05 m there. */
const JOIN = 9.4;

const SILVER = "#c4c7ca";
const CR_RED = "#d0202e";
const BAND = "#2b2a2c";
const VISOR = "#4a4f55";

/**
 * The nose's centre line: the plough's foot 0.55 m up and 0.75 m back, the bullet coupler cover's
 * round front at 1.0 m, its top seam 1.58 m up and 0.62 m back, then the nose rising at about 25
 * degrees past the visor's red edge (1.95 m), the windscreen's foot (2.36 m, 2.6 m back) and its
 * head (3.0 m, 4.1 m back), the roof reaching its full height 9 m back.
 */
const PROFILE: Pt[] = [
  [0.55, 0.75], [0.7, 0.37], [0.85, 0.13], [1.0, 0], [1.18, 0.08], [1.38, 0.27], [1.58, 0.62],
  [1.68, 1.05], [1.86, 1.5], [2.07, 2.0], [2.3, 2.5], [2.52, 3.0], [2.96, 4.0], [3.36, 5.0],
  [3.7, 6.0], [3.92, 7.0], [4.02, 8.1], [4.05, JOIN],
];

/** How far behind the centre line the plan reaches the body's width, by height: a nose tapering to its bullet. */
const DEPTH: Pt[] = [[0.55, 5.0], [1.0, 5.0], [1.6, 5.2], [2.0, 5.0], [2.5, 4.6], [3.0, 4.0], [3.5, 3.2], [3.9, 2.0], [4.05, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [a, b] = [pts[i - 1]!, pts[i]!]; return a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH, y)))]);

/** The visor's edge seen from the side ([y, d]: the gunmetal ahead of it), from the face's front up over the cab to the roof; its red edge 0.15 m behind it. */
const VISOR_BACK: Pt[] = [[1.95, 1.75], [2.15, 2.45], [2.45, 3.05], [2.75, 3.75], [3.0, 4.45], [3.2, 4.95], [3.45, 5.5], [3.7, 6.3], [3.95, 7.4], [4.06, 8.4]];
const shift = (pts: readonly Pt[], dd: number): Pt[] => pts.map(([y, d]): Pt => [y, d + dd]);

/** The headlamp: a long pointed lens over the dragon's arm, 2.9 - 5.6 m back, under the cab side window's front. */
const LAMP_FRONT: Pt[] = [[2.12, 2.9], [2.45, 4.0], [2.64, 5.6]];
const LAMP_BACK: Pt[] = [[2.12, 2.9], [2.24, 4.4], [2.58, 5.6], [2.64, 5.6]];
/** The cab side window: a dark sliver behind the windscreen, its point 4.0 m back, its head rising to 3.33 m. */
const CABWIN_FRONT: Pt[] = [[2.65, 4.0], [3.33, 6.5]];
const CABWIN_BACK: Pt[] = [[2.65, 4.0], [2.85, 5.7], [3.33, 6.5]];
const grow = (front: readonly Pt[], back: readonly Pt[], k: number) => ({ front: front.map(([y, d], i): Pt => [y + (i === 0 ? -k : i === front.length - 1 ? k : 0), d - k]), back: back.map(([y, d], i): Pt => [y + (i === 0 ? -k : i === back.length - 1 ? k : 0), d + k]) });

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.72])].sort((a, b) => a - b);

export const CR400AF_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 12.37, roofFrom: 9, cols: [1, 8, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  // a round bullet low down (the corner the whole half width), a broad, gently bowed top over it under the visor,
  // its elliptic corners reaching full width about 6 m behind the centre line
  corner: [[0.55, 2.0], [1.6, 2.0], [1.85, 1.2], [2.1, 0.95], [2.45, 0.8], [3.0, 0.8], [3.4, 0.85], [3.8, 1.5], [4.05, 2.0]],
  cornerDepth: CORNER_DEPTH,
  bulge: [[0.55, 0], [1.6, 0], [1.85, 0.1], [2.45, 0.16], [3.2, 0.16], [3.6, 0.08], [4.05, 0]],
  rows: ROWS,
  // silver, the plough dark grey; the visor, lamps and windows are painted below, the livery's sweeps under them
  bands: () => [[0, 0.72, "skirtG"], [0.72, 9, "silver"]],
  lodBands: [[0, 0.72, "skirtG"], [0.72, 2.3, "silver"], [2.3, 9, "gunmetal"]],
  lod: { profile: PROFILE.filter((_, i) => i % 3 === 0 || i === PROFILE.length - 1), corner: [[0.55, 2.0], [4.05, 2.0]], rows: [0.55, 0.85, 1.0, 1.3, 1.58, 2.07, 2.52, 2.96, 3.36, 3.7, 3.92, 4.05], cornerDepth: [[0.55, 6.0], [1.0, 6.3], [1.58, 6.3], [2.07, 5.9], [2.52, 5.6], [2.96, 4.8], [3.36, 3.5], [3.7, 2.4], [3.92, 1.6], [4.05, 0.05]] },
  lodGlass: { hw: 0.82, y: [2.36, 3.0] },
  paint: [
    // the gunmetal visor over the windscreen, from the face's front over the cab to the roof
    { mat: "gunmetal", front: [[1.85, -9], [4.1, -9]], back: VISOR_BACK },
    // the headlamps and the cab side windows, each in a silver rim
    { mat: "frameSilver", ...grow(LAMP_FRONT, LAMP_BACK, 0.04) },
    { mat: "lampHead", front: LAMP_FRONT, back: LAMP_BACK },
    { mat: "frameSilver", ...grow(CABWIN_FRONT, CABWIN_BACK, 0.04) },
    { mat: "cabGlass", front: CABWIN_FRONT, back: CABWIN_BACK },
  ],
  // the windscreen: one rounded pane on the visor, in a thin silver rim
  masks: [{ lat: [-0.87, 0.87], y: [2.32, 3.04], r: 0.3, mat: "frameSilver" }],
  panes: [{ lat: [-0.82, 0.82], y: [2.36, 3.0], r: 0.26 }],
  wipers: [[[0.12, 2.42], [0.5, 2.95]]],
  // the seam round the bullet coupler cover, seen head-on an ellipse 1.56 m wide and 1.0 m high
  decals: [
    ...Array.from({ length: 14 }, (_, i) => {
      const at = (a: number, k: number): Pt => [Math.cos(a) * 0.78 * k, 1.08 + Math.sin(a) * 0.5 * k];
      const [a0, a1] = [(2 * Math.PI * i) / 14, (2 * Math.PI * (i + 1)) / 14];
      return { mat: "under", pts: [at(a0, 0.97), at(a1, 0.97), at(a1, 1.0), at(a0, 1.0)], fine: 2 };
    }),
    // China Railway's emblem on the visor ahead of the windscreen: an orange ring over a rail's foot
    ...Array.from({ length: 10 }, (_, i) => {
      const at = (a: number, k: number): Pt => [Math.cos(a) * 0.17 * k, 2.2 + Math.sin(a) * 0.075 * k];
      const [a0, a1] = [(2 * Math.PI * i) / 10, (2 * Math.PI * (i + 1)) / 10];
      return { mat: "orange", pts: [at(a0, 0.72), at(a1, 0.72), at(a1, 1.0), at(a0, 1.0)], fine: 1 };
    }),
    { mat: "orange", pts: [[-0.025, 2.1], [0.025, 2.1], [0.025, 2.2], [-0.025, 2.2]], fine: 1 },
    { mat: "orange", pts: [[-0.1, 2.1], [0.1, 2.1], [0.1, 2.12], [-0.1, 2.12]], fine: 1 },
  ],
};

/** The window band's top and bottom edges on the nose ([y, d] seen from the side): its point 3.85 m back, 1.6 m up. */
const BAND_FRONT: Pt[] = [[1.6, 3.85], [1.68, 4.0], [1.9, 4.5], [2.12, 5.0], [2.26, 5.5], [2.39, 6.0], [2.48, 6.5], [2.53, 7.0], [2.61, 7.5], [2.74, 8.5], [2.88, JOIN + 0.05]];
const BAND_BACK: Pt[] = [[1.6, 3.85], [1.64, 5.0], [1.66, 6.0], [1.72, 6.5], [1.77, 7.5], [1.81, 8.5], [1.85, JOIN + 0.05], [2.88, JOIN + 0.05]];
/** The red stripe under the band, falling toward the nose to meet the sweep 3.65 m back. */
const STRIPE_FRONT: Pt[] = [[1.36, 3.65], [1.44, 3.65], [1.55, 5.0], [1.59, 6.0], [1.64, 6.5], [1.72, 8.0], [1.77, JOIN + 0.05]];
const STRIPE_BACK: Pt[] = [[1.36, 3.65], [1.37, 4.0], [1.46, 5.0], [1.5, 6.0], [1.55, 6.5], [1.57, 8.0], [1.64, JOIN + 0.05], [1.77, JOIN + 0.05]];
/** The red dragon: from its point on the nose's cheek (1.55 m back, 1.17 m up) up along the band's front to its tip 6.9 m back. */
const DRAGON_FRONT: Pt[] = [[1.17, 1.55], [1.37, 2.0], [1.55, 2.5], [1.77, 3.0], [1.9, 3.5], [2.08, 4.0], [2.21, 4.5], [2.35, 5.0], [2.43, 5.5], [2.52, 6.0], [2.6, 6.5], [2.66, 6.9]];
const DRAGON_BACK: Pt[] = [[1.17, 1.55], [1.19, 2.5], [1.28, 3.0], [1.45, 3.5], [1.6, 3.85], [1.9, 5.0], [2.66, 6.9]];

const bodyBands = (extra: Array<[number, number, string]> = []): Array<[number, number, string]> => [
  [0, 0.72, "skirtG"], [0.72, 1.64, "silver"], [1.64, 1.77, "red"], [1.77, 1.85, "white"], [1.85, 2.88, "band"], ...extra,
];

function cr400afLivery(title: string, number: string, smart: boolean): ShinkansenLivery {
  // the band's white rim, the band and the red stripe under it, on the nose
  const band = [
    { mat: "white", front: shift(BAND_FRONT, -0.06), back: BAND_BACK.map(([y, d]): Pt => [y, Math.min(d + 0.06, JOIN + 0.05)]), face: true },
    { mat: "red", front: STRIPE_FRONT, back: STRIPE_BACK, face: true },
    { mat: "band", front: BAND_FRONT, back: BAND_BACK, face: true },  ];
  // the smart Fuxing's ribbon: red, orange and yellow strips along the visor's edge from the U across the face,
  // leaving it 2.9 - 3.2 m up to run back along the side over the band (the end car's own bands)
  const ribbon = (mat: string, off: number, yLow: number, top: number) => ({
    mat, front: [[1.75, -9], [top, -9]] as Pt[], top, face: true,
    back: [...VISOR_BACK.filter(([y]) => y < yLow).map(([y, d]): Pt => [y, d + off]), [yLow - 1e-3, edge(VISOR_BACK, yLow) + off], [yLow, JOIN + 0.05], [top, JOIN + 0.05]] as Pt[],
  });
  return {
    title, number,
    palette: {
      silver: c(SILVER, 0.3), red: c(CR_RED), white: c("#f2f2ef"), band: c(BAND, 0.3), gunmetal: c(VISOR, 0.25),
      orange: c("#ee7d1e"), yellow: c("#f5c518"),
      roofG: c("#b9bcbf", 0.45), skirtG: c("#6f7377", 0.7), cabMask: c("#1d1f22", 0.3),
    },
    bands: bodyBands([[2.88, 9, "silver"]]),
    ...(smart ? { endBands: bodyBands([[2.88, 2.93, "silver"], [2.93, 3.0, "yellow"], [3.0, 3.07, "orange"], [3.07, 3.24, "red"], [3.24, 9, "silver"]]) } : {}),
    roof: "roofG", skirt: "skirtG",
    endSweeps: smart
      ? [ribbon("yellow", 0.5, 2.93, 3.0), ribbon("orange", 0.36, 3.0, 3.07), ribbon("red", 0.22, 3.07, 3.24), ...band]
      : [
          { mat: "white", front: shift(DRAGON_FRONT, -0.05), back: shift(DRAGON_BACK, 0.05), face: true },
          { mat: "red", front: DRAGON_FRONT, back: DRAGON_BACK, face: true },
          ...band,
          // the visor's red edge (the visor is painted over it)
          { mat: "red", front: [[1.75, -9], [4.1, -9]], back: shift(VISOR_BACK, 0.15), top: 9, face: true },
        ],
    endLettering: [{ text: "CR", d: 24.6 - JOIN, y: 2.18, h: 0.3, mat: "white" }],
  };
}

/** Panes along a car (d from the body's front): n of width w from d0, `pitch` apart. */
const panes = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);
const J = (d: number) => d - JOIN;

export const CR400AF: ShinkansenSeries = {
  // 209 m for eight cars: the end cars 27.6 m from the tip to the coupling plane (the line scan), the others 25.65 m
  endLength: 27.6, midLength: 25.65, W: 1.62, Y: 1.35, S: 3.25, C: 4.05, lean: 0.96, B: 0.55, A: 0.72,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CR400AF_FACE,
  // the panes inside the black band; plug doors with a narrow, round-headed window
  windows: [[1.95, 2.78]], windowW: 1.4, pitch: 2.0, door: [1.12, 3.36, 2.3, 3.0], doorW: 1.0, doorGlassW: 0.42, doorGlassR: 0.2,
  layout: {
    // the end car: the business saloon behind the cab, the one door 12.4 m behind the tip, the first-class saloon behind it
    end: { doors: [[J(12.37), J(13.37), -1]], windows: [[J(9.95), J(11.3)], ...panes(J(15.6), 4, 1.35, 2.0)] },
    // the intermediate cars: a door at each end, nine panes 1.96 m apart between the vestibules
    middle: { doors: [[0.35, 1.35, -1], [23.8, 24.8, 1]], windows: panes(5.15, 9, 1.4, 1.9625) },
  },
  // the leading bogie 5.35 m behind the tip, 18.15 m bogie centres on the end car, 17.85 m on the others
  endBogies: [J(5.35), J(23.5)], midBogies: [3.65, 21.5],
  bogieCentres: 17.85, wheelR: 0.46, wheelbase: 2.5,
  sidePanels: {
    end: [{ d: [15.45, 16.2], y: [2.93, 3.08], kind: "panel", mat: "black" }],
    middle: [{ d: [5.15, 5.85], y: [2.93, 3.08], kind: "panel", mat: "black" }, { d: [21.35, 22.05], y: [2.93, 3.08], kind: "panel", mat: "black" }],
  },
  numberAt: [-9.3, 1.38, 0.12],
  liveries: {
    red: cr400afLivery("Fuxing red", "CR400AF-2146", false),
    smart: cr400afLivery("Smart Fuxing", "CR400AF-C-2214", true),
  },
  weight: { end: 52, middle: 50 }, power: 1250, maxspeed: 350,
};
