// The Fuxing CR450AF (CRRC Qingdao Sifang, the prototype CR450AF-0201 unveiled in December 2024),
// drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the long, low,
// pointed nose - one smooth surface from the skirt to the roof, the coupler hatch only a thin seam
// flush with it - under the dark canopy that runs from the face back over the cab, edged by a
// red line, the long headlamp sliver under that line, the red chevron rising into the cab's window
// band, and the silver body with its warm grey window band over an orange and a red line, the band
// orange with a red slash at every car's ends. The skirts reach down over the enclosed bogies.
// Measured on the photographs in assets/cr-cr450af/ (SOURCES.md). See docs/models/china-units.md.
//
// Heights over the rail, d behind the nose's tip (the coupler hatch's front, 1.05 m up). The near
// side-on photograph is rectified by a projective fit along the side (the tip, the end car's inner
// joint 28.725 m behind it and the second car's rear joint 25.65 m further), its heights scaled on
// the published 3.85 m body.

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** Where the face meets the body: the crown at its full height, the plan at full width, ahead of the crew door. */
const JOIN = 8.45;

const SILVER = "#c3c6c9";
const CR_RED = "#d3242c";
const ORANGE = "#ee6a22";
const BAND = "#3b3936";
const CANOPY = "#1d2128";

/**
 * The nose's centre line (measured on the side-on photograph, about 54 px/m at the tip): the underside
 * running back almost level from the hatch (0.59 m up 0.6 m back, 0.39 m at 1.8 m, the skirt's 0.25 m
 * at 4.2 m), the coupler hatch a blunt rounded bullet 0.77 - 1.32 m tall 0.24 m back, its front
 * round 1.03 m up at the tip, its top 1.47 m up 0.54 m back, then the long rise over the windscreen
 * (1.78 m 1.8 m back, 2.4 m at 3.4 m, 2.95 m at 4.6 m) to the roof's full 3.85 m about 8 m back.
 */
const PROFILE: Pt[] = [
  [0.25, 4.2], [0.33, 2.6], [0.39, 1.82], [0.46, 1.25], [0.59, 0.63], [0.77, 0.24], [0.86, 0.1], [0.95, 0.02], [1.03, 0], [1.12, 0.02], [1.2, 0.07], [1.32, 0.24],
  [1.47, 0.54], [1.6, 1.25], [1.78, 1.82], [1.9, 2.3], [2.12, 2.85], [2.4, 3.42], [2.68, 4.0], [2.95, 4.6], [3.2, 5.1],
  [3.42, 5.6], [3.6, 6.2], [3.72, 6.8], [3.8, 7.5], [3.84, 8.3], [3.85, JOIN],
];

/** How far behind the centre line the plan reaches the body's width, by height: a nose tapering to its narrow hatch. */
const DEPTH: Pt[] = [[0.25, 5.0], [0.6, 4.6], [1.0, 4.6], [1.4, 4.9], [1.8, 5.6], [2.2, 5.8], [2.5, 5.4], [3.0, 4.6], [3.4, 3.6], [3.7, 2.4], [3.85, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [a, b] = [pts[i - 1]!, pts[i]!]; return a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH, y)))]);

/** The red line along the canopy's lower edge seen from the side ([y, d]): from the hatch's top corner up past the windscreen toward the roof (it reaches the roof about 11 m back; drawn to the join). */
const RED_LINE: Pt[] = [[1.47, 1.95], [1.75, 2.7], [2.2, 3.7], [2.6, 4.6], [2.99, 5.75], [3.3, 7.3], [3.55, 8.6], [3.8, 10.2]];
/** The canopy's edge below the red line: the headlamp's dark sliver ending 6.2 m back, then up to the crown at the join. */
const CANOPY_BACK: Pt[] = [[1.46, 1.35], [1.73, 3.0], [2.06, 4.45], [2.42, 5.85], [2.52, 6.2], [2.8, 6.25], [3.0, 6.3], [3.3, 7.3], [3.5, 8.0], [3.6, 8.4], [3.87, 8.4]];
const shift = (pts: readonly Pt[], dd: number): Pt[] => pts.map(([y, d]): Pt => [y, d + dd]);

/** The headlamp: a long lens filling the dark sliver under the red line, 3.0 - 5.0 m back. */
const LAMP_FRONT: Pt[] = [[1.85, 3.05], [2.06, 3.5], [2.38, 4.3], [2.42, 4.85]];
const LAMP_BACK: Pt[] = [[1.85, 3.05], [2.06, 3.7], [2.38, 4.75], [2.42, 4.85]];
/** The small window high on the canopy behind the windscreen, 5.9 - 6.9 m back. */
const TOPWIN_FRONT: Pt[] = [[3.14, 6.05], [3.33, 5.9]];
const TOPWIN_BACK: Pt[] = [[3.14, 6.85], [3.33, 6.95]];
/** The cab side window in the band's point, its front leaning back with the chevron. */
const CABWIN_FRONT: Pt[] = [[2.17, 6.85], [2.68, 7.95]];
const CABWIN_BACK: Pt[] = [[2.17, 8.2], [2.68, 8.2]];

/** The coupler hatch's seam seen head-on: two thin dark arcs down its sides (about 1.25 m behind the tip), none across its front or foot. */
const HATCH_SEAM = Array.from({ length: 12 }, (_, i) => {
  const at = (a: number, k: number): Pt => [Math.cos(a) * 1.2 * k, 1.04 + Math.sin(a) * 0.43 * k];
  const a = (j: number) => ((j < 6 ? -55 + (110 * j) / 6 : 125 + (110 * (j - 6)) / 6) * Math.PI) / 180;
  const [a0, a1] = [a(i), i === 5 ? (55 * Math.PI) / 180 : i === 11 ? (235 * Math.PI) / 180 : a(i + 1)];
  return { mat: "under", pts: [at(a0, 0.97), at(a1, 0.97), at(a1, 1.0), at(a0, 1.0)], fine: 2 };
});

/** The distant model's centre line: the same nose from fewer rows. */
const LOD_PROFILE: Pt[] = [[0.25, 4.2], [0.46, 1.25], [0.77, 0.24], [1.03, 0], [1.32, 0.24], [1.6, 1.25], [2.12, 2.85], [2.68, 4.0], [3.2, 5.1], [3.6, 6.2], [3.8, 7.5], [3.85, JOIN]];

const ROWS = [0.25, 0.46, 0.59, 0.77, 0.9, 1.03, 1.2, 1.32, 1.47, 1.78, 2.12, 2.4, 2.95, 3.42, 3.72, 3.85];

export const CR450AF_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 8.53, roofFrom: 9, cols: [1, 8, 1, 1], tolerance: 0.1, wrap: true,
  profile: PROFILE,
  // a round, narrow hatch low down; a broad, gently bowed top over it under the canopy
  corner: [[0.25, 1.3], [0.6, 1.0], [1.3, 1.0], [1.55, 1.1], [1.8, 1.2], [2.1, 1.0], [2.5, 0.85], [3.0, 0.85], [3.4, 0.9], [3.7, 1.5], [3.85, 2.0]],
  cornerDepth: CORNER_DEPTH,
  bulge: [[0.25, 0.15], [0.6, 0.28], [1.3, 0.28], [1.6, 0.2], [2.0, 0.14], [2.4, 0.14], [3.2, 0.14], [3.6, 0.07], [3.85, 0]],
  rows: ROWS,
  // silver (the dark skirt from 5 m back is painted); the canopy, lamps and windows are painted below, the livery's sweeps under them
  bands: () => [[0, 9, "silver"]],
  lodBands: [[0, 0.9, "skirtG"], [0.9, 1.9, "silver"], [1.9, 9, "canopy"]],
  lod: { profile: LOD_PROFILE, corner: [[0.25, 2.0], [3.85, 2.0]], rows: LOD_PROFILE.map(([y]) => y), cornerDepth: LOD_PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH, y)))]) },
  lodGlass: { hw: 0.85, y: [1.95, 3.05] },
  paint: [
    // the dark canopy from the hatch's top over the windscreen and back over the cab to the roof
    { mat: "canopy", front: [[1.46, -9], [4.0, -9]], back: CANOPY_BACK },
    // the red line along its edge
    // (as two fills, red up to the line's back edge and the canopy again up to its front edge: a thin strip
    // painted on its own would fill across the corner where the surface runs nearly along the line)
    { mat: "red", front: [[RED_LINE[0]![0], -9], [RED_LINE[RED_LINE.length - 1]![0], -9]], back: shift(RED_LINE, 0.04) },
    { mat: "canopy", front: [[RED_LINE[0]![0], -9], [RED_LINE[RED_LINE.length - 1]![0], -9]], back: shift(RED_LINE, -0.04) },
    // the headlamp, the small canopy window and the cab side window
    { mat: "lampHead", front: LAMP_FRONT, back: LAMP_BACK },
    { mat: "cabGlass", front: TOPWIN_FRONT, back: TOPWIN_BACK },
    { mat: "cabGlass", front: CABWIN_FRONT, back: CABWIN_BACK },
    // the dark skirt along the cab sides from 5 m behind the tip, the nose silver ahead of it
    { mat: "skirtG", front: [[0.2, 5.0], [0.9, 5.0]], back: [[0.2, 99], [0.9, 99]] },
    // the crease along the nose's lower flank (a line in the paint, not a step): the flank under it in
    // shade from the hatch back to the skirt, its back edge falling from the crease 2.7 m back to the skirt
    // 5 m back: the silver "wing" above it points forward under the red chevron
    { mat: "silverShade", front: [[0.2, 1.28], [1.0, 1.28]], back: [[0.2, 5.0], [0.9, 5.0], [1.0, 2.7]] },
  ],
  // the windscreen: one broad rounded pane in the canopy, in a thin dark rim
  masks: [{ lat: [-0.95, 0.95], y: [1.9, 3.12], r: 0.36, mat: "frameDark" }],
  panes: [{ lat: [-0.9, 0.9], y: [1.95, 3.07], r: 0.32 }],
  wipers: [[[0.15, 2.02], [0.55, 2.7]]],
  decals: [
    // the coupler hatch's seam, flush with the surface: seen head-on a rounded outline 1.8 m wide from 0.62 m up to the canopy's edge
    ...HATCH_SEAM,
    // China Railway's emblem in gold on the canopy under the windscreen: a ring over a rail's foot
    ...Array.from({ length: 10 }, (_, i) => {
      const at = (a: number, k: number): Pt => [Math.cos(a) * 0.2 * k, 1.76 + Math.sin(a) * 0.085 * k];
      const [a0, a1] = [(2 * Math.PI * i) / 10, (2 * Math.PI * (i + 1)) / 10];
      return { mat: "gold", pts: [at(a0, 0.72), at(a1, 0.72), at(a1, 1.0), at(a0, 1.0)], fine: 1 };
    }),
    { mat: "gold", pts: [[-0.027, 1.645], [0.027, 1.645], [0.027, 1.76], [-0.027, 1.76]], fine: 1 },
    { mat: "gold", pts: [[-0.11, 1.645], [0.11, 1.645], [0.11, 1.67], [-0.11, 1.67]], fine: 1 },
  ],
};

/** The side's lines: the window band 2.08 - 3.05 m, a silver gap, the orange line 1.94 - 2.04 m and the red 1.79 - 1.94 m. */
const BANDS: Array<[number, number, string]> = [
  [0, 0.9, "skirtG"], [0.9, 1.79, "silver"], [1.79, 1.94, "red"], [1.94, 2.04, "orange"], [2.04, 2.08, "silver"], [2.08, 3.05, "band"], [3.05, 9, "silver"],
];
/** The door leaves of the intermediate cars stand in the orange ends of the band. */
const DOOR_BANDS: Array<[number, number, string]> = BANDS.map(([a, b, m]): [number, number, string] => [a, b, m === "band" ? "orange" : m]);

/** The red chevron: from its point on the nose's flank (5.05 m back, 1.56 m up) rising to the band's top 7.5 m back. */
const CHEVRON_FRONT: Pt[] = [[1.56, 5.05], [2.75, 7.45]];
const CHEVRON_BACK: Pt[] = [[1.56, 5.05], [1.79, 5.28], [2.75, 8.05]];
/** The window band on the nose: its front leaning with the chevron, its top falling to 2.75 m at the front. */
const BAND_FRONT: Pt[] = [[2.04, 6.0], [2.75, 7.95], [2.9, 8.9], [3.05, JOIN + 0.05]];

function cr450afLivery(): ShinkansenLivery {
  const at = (pts: readonly Pt[], y: number) => edge(pts, y);
  return {
    title: "Fuxing", number: "CR450AF-0201",
    palette: {
      silver: c(SILVER, 0.28), red: c(CR_RED), orange: c(ORANGE), band: c(BAND, 0.3), canopy: c(CANOPY, 0.2),
      gold: c("#d8a53a", 0.35), white: c("#f2f2ef"), frameDark: c("#101215", 0.4),
      roofG: c("#b8bbbe", 0.45), skirtG: c("#55585c", 0.7), silverShade: c("#a6aaae", 0.3), cabMask: c("#15181c", 0.3),
    },
    bands: BANDS, doors: DOOR_BANDS, endCarDoors: BANDS,
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the lines and the band on the nose, ahead of the body, met by the chevron
      { mat: "red", front: [[1.79, at(CHEVRON_BACK, 1.79) - 0.1], [1.94, at(CHEVRON_BACK, 1.94) - 0.1]], back: [[1.79, JOIN + 0.05], [1.94, JOIN + 0.05]], face: true },
      { mat: "orange", front: [[1.94, at(CHEVRON_BACK, 1.94) - 0.1], [2.04, at(CHEVRON_BACK, 2.04) - 0.1]], back: [[1.94, JOIN + 0.05], [2.04, JOIN + 0.05]], face: true },
      { mat: "band", front: BAND_FRONT, back: [[2.04, JOIN + 0.05], [3.05, JOIN + 0.05]], face: true },
      { mat: "red", front: CHEVRON_FRONT, back: CHEVRON_BACK, face: true },
    ],
    sideFields: {
      // the end car's inner end: the band orange behind a red slash leaning back
      end: [
        { mat: "red", pts: [[J(25.0), 2.08], [J(25.6), 2.08], [J(26.0), 3.05], [J(25.4), 3.05]] },
        { mat: "orange", pts: [[J(25.6), 2.08], [J(28.5), 2.08], [J(28.5), 3.05], [J(26.0), 3.05]] },
      ],
      // the intermediate car's ends, round the doors: orange, a red slash toward the middle
      middle: [
        { mat: "orange", pts: [[1.42, 2.08], [2.6, 2.08], [3.0, 3.05], [1.42, 3.05]] },
        { mat: "red", pts: [[2.6, 2.08], [3.2, 2.08], [3.6, 3.05], [3.0, 3.05]] },
        { mat: "orange", pts: [[0.02, 2.08], [0.3, 2.08], [0.3, 3.05], [0.02, 3.05]] },
        { mat: "red", pts: [[21.55, 2.08], [22.15, 2.08], [22.55, 3.05], [21.95, 3.05]] },
        { mat: "orange", pts: [[22.15, 2.08], [23.58, 2.08], [23.58, 3.05], [22.55, 3.05]] },
        { mat: "orange", pts: [[24.85, 2.08], [25.13, 2.08], [25.13, 3.05], [24.85, 3.05]] },
      ],
    },
    endLettering: [{ text: "CR450", d: J(26.2), y: 2.42, h: 0.28, mat: "white" }],
  };
}

/**
 * The enclosed bogies: the skirt carried down over each bogie's cut, 0.4 - 0.9 m, a little inside the
 * side, so only the wheels' feet show (the CR450's integrated bogies behind closed skirts). The skirts
 * hang low (0.25 m) between the bogies: no underfloor box below them.
 */
function cr450afFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const reach = 2.5 / 2 + 0.46 + 0.25 - 0.03;
  m.scope("bogie skirts", () => {
    for (const t of car.trucks) if (t - reach >= 0) for (const sd of [1, -1]) sidePanel(m, b, X, sd, "skirtG", t - reach, t + reach, 0.4, 0.895, -0.012, 0.02);
  });
}

/** Panes along a car (d from the body's front): n of width w from d0, `pitch` apart. */
const panes = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);
function J(d: number): number { return d - JOIN; }

export const CR450AF: ShinkansenSeries = {
  // 211.35 m for eight cars: the end cars 28.725 m from the tip to the coupling plane, the others 25.65 m; 3.85 m high
  endLength: 28.725, midLength: 25.65, W: 1.62, Y: 1.3, S: 3.1, C: 3.85, lean: 0.96, B: 0.25, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CR450AF_FACE,
  // the panes inside the band; plug doors with a narrow, round-headed window
  windows: [[2.17, 2.95]], windowW: 1.35, pitch: 1.95, door: [1.36, 3.18, 2.25, 2.95], doorW: 1.0, doorGlassW: 0.36, doorGlassR: 0.18,
  layout: {
    // the end car: the crew door behind the cab, the business saloon's three panes, the passenger door, four panes
    end: { doors: [[J(14.95), J(15.95), -1]], windows: [...panes(J(10.2), 3, 1.0, 1.42), ...panes(J(17.95), 4, 1.35, 1.95)] },
    // the intermediate cars: a door at each end in the orange, nine panes between them
    middle: { doors: [[0.35, 1.35, -1], [23.8, 24.8, 1]], windows: panes(3.85, 9, 1.35, 1.95) },
  },
  // bogie centres 17.8 m, the end car's leading bogie 7.0 m behind the tip, all hidden behind the skirts
  endBogies: [J(7.0), J(24.8)], midBogies: [3.67, 21.47],
  bogieCentres: 17.8, wheelR: 0.46, wheelbase: 2.5,
  sidePanels: {
    end: [{ d: [8.53, 9.2], y: [1.36, 3.18], kind: "seam" }, { d: [8.72, 9.01], y: [2.3, 2.92], kind: "window" }, { d: [17.2, 17.75], y: [3.12, 3.26], kind: "panel", mat: "black" }],
    middle: [{ d: [3.85, 4.4], y: [3.12, 3.26], kind: "panel", mat: "black" }, { d: [20.75, 21.3], y: [3.12, 3.26], kind: "panel", mat: "black" }],
  },
  numberAt: [-8.3, 1.58, 0.12],
  fittings: cr450afFittings,
  liveries: { fuxing: cr450afLivery() },
  // about 13 t a axle on average (52 t a car), 12,000 kW for the train (four motor cars), 400 km/h in service
  weight: { end: 48, middle: 52 }, power: 1500, maxspeed: 400,
};
