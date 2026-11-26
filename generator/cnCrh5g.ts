// The CRH5G (CRRC Changchun), the cold- and sand-resistant CRH5 for the northwest, drawn on the series
// kit (shinkansen.ts) on the CRH5A's body (cnCrh5a.ts) with its own cab face (seriesCab.ts): the new
// nose of the enhanced sets CRH5G-5218 - 5229 (2017) - a fuller snout with a separate windscreen under a
// white cab roof, slanted lamp lozenges, a grille between them and the big coupler cover as the snout's
// own lower part (only its seams painted, one smooth convex profile; test/crh5gNose.test.ts) - and their
// livery: a dark window band from the cab side window to the car's end, two dark chevrons ahead of it,
// the blue stripe under it. Matched to the photographs in assets/cr-crh5g/ (SOURCES.md).
//
// Heights over the rail, d behind the snout's tip (the coupler cover's front, 1.0 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { bodyHalf, edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

const WHITE = "#f1f2ef";
const CRH_BLUE = "#1f4f9f";
const BAND = "#1b2027";

/** Where the face meets the body: the roof reaches its full 4.05 m there. */
const JOIN = 7.0;
/** The body's bottom (the white skirt panels' foot) and the skirts' top. */
const B = 0.4;
const A = 1.15;

/**
 * The snout's centre line, one convex curve (photo-crh5g-5227-bji-20190105140658.jpg, a projective fit
 * over the tip, the windows' pitch and the car's end; the front photographs for the heights): the big
 * coupler cover's round front 1.15 m up is the tip, its underside tucking back to the spoiler 0.75 m
 * behind it at the body's foot; above the tip the face leans back ever more steeply over the cover's
 * top (1.78 m up), the lamps and the grille to the windscreen's foot (2.45 m up, 1.17 m back), the glass
 * leaning back at about 25 degrees to its head (3.35 m up, 3.1 m back), the white cab roof over it
 * reaching the crown 7.0 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.75], [0.48, 0.55], [0.58, 0.38], [0.7, 0.22], [0.85, 0.1], [1.0, 0.03], [1.15, 0.0], [1.3, 0.04], [1.45, 0.1], [1.6, 0.19], [1.75, 0.3], [1.9, 0.43],
  [2.05, 0.59], [2.2, 0.78], [2.3, 0.93], [2.45, 1.17], [2.6, 1.43], [2.8, 1.78], [3.0, 2.16], [3.2, 2.6], [3.35, 2.97], [3.5, 3.4], [3.65, 3.9], [3.8, 4.55], [3.92, 5.25], [4.0, 5.95], [4.04, 6.5], [4.05, JOIN],
];

/** The coupler cover's seam seen head-on: a rounded square 2.84 m wide (nearly the face's width), 0.58 - 1.78 m up, its top just under the lamps' inner ends; split down the middle. */
const COVER = { y: 1.18, hw: 1.42, hh: 0.6 };
/** A point of the seam's rounded-square outline (a superellipse of power 3) at angle a, scaled by k. */
const sq = (v: number): number => Math.sign(v) * Math.abs(v) ** (2 / 3);
const SEAM = Array.from({ length: 20 }, (_, i) => {
  const at = (a: number, k: number): Pt => [sq(Math.cos(a)) * COVER.hw * k, COVER.y + sq(Math.sin(a)) * COVER.hh * k];
  const [a0, a1] = [(2 * Math.PI * i) / 20, (2 * Math.PI * (i + 1)) / 20];
  return { mat: "seam", pts: [at(a0, 0.975), at(a1, 0.975), at(a1, 1.0), at(a0, 1.0)], fine: 2 };
});
/** The cover's two halves meet down its middle (drawn down to where its front turns under). */
const SPLIT: Pt[] = [[-0.016, 0.72], [0.016, 0.72], [0.016, COVER.y + COVER.hh - 0.02], [-0.016, COVER.y + COVER.hh - 0.02]];

/** The windscreen's outline on the snout's sides ([y, d]): its foot 2.45 m up, its rounded head 3.35 m up, its top rear corner 4.85 m back. */
const SCREEN_BACK: Pt[] = [[2.45, 2.85], [2.6, 3.25], [2.9, 3.85], [3.15, 4.35], [3.3, 4.75], [3.35, 4.85]];
const SCREEN_TOP = 3.35;

/** The cab side window in the dark band (front 5.2 - 5.3 m back, rear 6.1 m; 2.36 - 2.95 m up, its head rising to the rear). */
const SIDE_FRONT: Pt[] = [[2.36, 5.32], [2.6, 5.22], [2.86, 5.3]];
const SIDE_BACK: Pt[] = [[2.36, 6.1], [2.95, 6.12]];

/**
 * The dark band's front on the nose, [y, d] (photo-crh5g-5228-bji-20171207140545.jpg): a straight edge
 * leaning forward from its foot (1.97 m up, 4.75 m behind the tip) to its corner (2.44 m, 4.19 m), its
 * head then curving up and back to the band's top 3.08 m up at 6.4 m. Ahead of it two dark chevrons, a
 * parallelogram and a triangle, their rear edges parallel to the band's front, their heads on the line
 * running down from the band's corner to the triangle's point (1.86 m up, 3.07 m back).
 */
const BAND_FRONT: Pt[] = [[1.97, 4.75], [2.44, 4.19], [2.65, 4.6], [2.83, 5.15], [3.0, 5.6], [3.08, 6.4]];
const BAND_BACK: Pt[] = [[1.97, JOIN + 0.05], [3.08, JOIN + 0.05]];
const CHEVRON_1: { front: Pt[]; back: Pt[] } = { front: [[1.86, 3.07], [2.17, 3.7]], back: [[1.86, 3.07], [1.95, 4.04], [2.17, 3.7]] };
const CHEVRON_2: { front: Pt[]; back: Pt[] } = { front: [[1.96, 4.17], [2.25, 3.8], [2.37, 4.07]], back: [[1.96, 4.17], [1.98, 4.6], [2.37, 4.07]] };
/** The blue stripe's end on the nose: from the body's 1.72 - 1.84 m it thins to a point 2.2 m behind the tip, 1.62 m up. */
const STRIPE_FRONT: Pt[] = [[1.62, 2.2], [1.84, 6.7]];
const STRIPE_BACK: Pt[] = [[1.62, 2.2], [1.72, 6.7], [1.7201, JOIN + 0.05], [1.84, JOIN + 0.05]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.72, 1.84, 1.97, 2.37, 2.7, 2.9, 3.08])].sort((a, b) => a - b);

/** A lamp lozenge (viewer's right): its blunt inner end low by the cover's top, its point high at the corner; `k` scales it about its centre. */
const lozenge = (k: number, s: 1 | -1): Pt[] => {
  const pts: Pt[] = [[0.52, 1.82], [0.68, 1.76], [1.12, 2.2], [1.16, 2.42], [0.98, 2.38], [0.52, 1.98], [0.48, 1.9]];
  const [cx, cy] = [0.82, 2.08];
  const out = pts.map(([l, y]): Pt => [s * (cx + (l - cx) * k), cy + (y - cy) * k]);
  return s > 0 ? out : out.reverse();
};

export const CRH5G_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 9.0, roofFrom: 9, cols: [1, 10, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  // a round snout: the corner is the whole half width, elliptic, reaching full width 2.6 m behind the
  // centre line low down, deeper over the windscreen, and at the join at the crown
  corner: [[B, 2.0], [4.05, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, 2.6 + Math.max(0, y - 2.0) * 2.0))]),
  rows: ROWS,
  // the face is white; its paint (the windscreen, the side window, the lamps, the dark band) is drawn below
  bands: (l) => [[0, 9, l.bands[0]![2]]],
  lodBands: [[0, 9, "white"]],
  lod: { profile: PROFILE, corner: [[B, 2.0], [4.05, 2.0]], rows: [B, 0.58, 0.85, 1.15, 1.45, 1.75, 2.05, 2.45, 2.8, 3.2, 3.5, 3.8, 4.0, 4.05], cornerDepth: [[B, 2.6], [2.0, 2.6], [2.8, 4.2], [3.2, 3.85], [3.5, 3.15], [3.8, 2.0], [4.0, 0.7], [4.05, 0.05]] },
  lodGlass: { hw: 1.0, y: [2.45, 3.35] },
  paint: [
    // white below the skirts' top on the snout's sides
    { mat: "white", front: [[B, -9], [A, -9]], back: [[B, JOIN + 1], [A, JOIN + 1]] },
    // the windscreen: a dark rim round the glass under the white cab roof
    { mat: "cabMask", front: [[2.36, -9], [SCREEN_TOP + 0.05, -9]], back: SCREEN_BACK.map(([y, d]): Pt => [y - 0.04, d + 0.07]), top: SCREEN_TOP + 0.05 },
    { mat: "cabGlass", front: [[2.4, -9], [SCREEN_TOP, -9]], back: SCREEN_BACK, top: SCREEN_TOP },
  ],
  fields: [
    // the lamp lozenges: a black housing, the lens inside
    { mat: "cabMask", pts: lozenge(1, 1) }, { mat: "cabMask", pts: lozenge(1, -1) },
    { mat: "lampLens", pts: lozenge(0.8, 1) }, { mat: "lampLens", pts: lozenge(0.8, -1) },
    // the windscreen proper: a lighter pane inside the dark glass
    { mat: "screen", pts: [[-0.92, 2.53], [0.92, 2.53], [0.96, 2.65], [0.84, 3.15], [0.66, 3.28], [-0.66, 3.28], [-0.84, 3.15], [-0.96, 2.65]] },
    // the grille under the windscreen: a light frame, two dark slots
    { mat: "grille", pts: [[-0.3, 2.16], [0.3, 2.16], [0.3, 2.34], [-0.3, 2.34]] },
    { mat: "slot", pts: [[-0.26, 2.19], [0.26, 2.19], [0.26, 2.23], [-0.26, 2.23]] },
    { mat: "slot", pts: [[-0.26, 2.27], [0.26, 2.27], [0.26, 2.31], [-0.26, 2.31]] },
  ],
  // the coupler cover's seams, thin dark lines flush with the face; the grille's slots
  decals: [...SEAM, { mat: "seam", pts: SPLIT, fine: 6 }],
  wipers: [[[0.1, 2.5], [0.55, 3.05]], [[-0.7, 2.5], [-0.25, 3.05]]],
  panes: [],
  lamps: [[0.96, 2.22, 0.07, "lampHead"], [-0.96, 2.22, 0.07, "lampHead"], [0.68, 1.92, 0.045, "lampRed"], [-0.68, 1.92, 0.045, "lampRed"]],
};

/** The enhanced sets' livery: white, the dark window band from the cab side window to the car's end, the CRH blue stripe under it. */
function crhLivery(): ShinkansenLivery {
  return {
    title: "CRH blue", number: "CRH5G-5228",
    palette: {
      white: c(WHITE), blue: c(CRH_BLUE), band: c(BAND, 0.3), roofG: c("#dcdfe1", 0.55), skirtG: c("#e7e9e8", 0.55), cabMask: c("#15181b", 0.3),
      seam: c("#5f6468", 0.6), lampLens: { color: "#c9d3dc", metallic: 0.3, roughness: 0.1, glass: true }, slat: c("#b3b8bc", 0.6), screen: { color: "#3d4d5b", metallic: 0.25, roughness: 0.08, glass: true },
      grille: c("#d9dcdc", 0.5), slot: c("#3a3f44", 0.6),
      // the passenger windows lighter than the dark band round them, as they read on the photographs
      glass: { color: "#4f5c69", metallic: 0.3, roughness: 0.08, glass: true },
    },
    bands: [[0, 1.72, "white"], [1.72, 1.84, "blue"], [1.84, 1.97, "white"], [1.97, 3.08, "band"], [3.08, 9, "white"]],
    // the doors white, the stripe running over them
    doors: [[0, 1.72, "white"], [1.72, 1.84, "blue"], [1.84, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      { mat: "blue", front: STRIPE_FRONT, back: STRIPE_BACK, face: true },
      { mat: "band", front: CHEVRON_1.front, back: CHEVRON_1.back, face: true },
      { mat: "band", front: CHEVRON_2.front, back: CHEVRON_2.back, face: true },
      { mat: "band", front: BAND_FRONT, back: BAND_BACK, face: true },
      { mat: "screen", front: SIDE_FRONT, back: SIDE_BACK, face: true },
    ],
    // the distant model: the nose white ahead of the dark band
    lodSideFields: { end: [{ d: [0, 4.6], bands: [[0, 1.72, "white"], [1.72, 1.84, "blue"], [1.84, 9, "white"]] }] },
    endLettering: [{ text: "CRH", d: 8.0 - JOIN, y: 2.25, h: 0.36, mat: "white" }],
  };
}

/** The windows of a run: `n` panes `w` wide from d0, `pitch` apart. */
const run = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

const MID_BODY = 25.0 - 0.5;

/** The roof's air-conditioning hood on every car (d span on the car's body). */
const hoodAt = (end: boolean, L: number): readonly [number, number] => (end ? [22.4 - JOIN, 25.4 - JOIN] : [L - 4.5, L - 1.5]);
/** The end car's second hood, on the cab roof just behind the face (6.6 - 9.4 m behind the tip). */
const CAB_HOOD: readonly [number, number] = [6.6 - JOIN, 9.4 - JOIN];

/** The CRH5's fittings, as the CRH5A's: the underfloor, the slats of the white skirt panels between the bogies and the roof's air-conditioning hood. */
function crh5gFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = car.trucks as [number, number];
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(t0 + 2.6), B - 0.1, B + 0.05, -1.6 * 0.8, 1.6 * 0.8));
  m.scope("skirt slats", () => {
    const [a, e] = [t0 + 2.35, t1 - 2.35];
    const n = Math.max(1, Math.round((e - a) / 0.5));
    const half = bodyHalf(b, (a + e) / 2);
    const [ya, yb] = [B + 0.12, A - 0.1];
    const [za, zb] = [edgeAt(half, ya) + 0.004, edgeAt(half, yb) + 0.004];
    const l = Math.hypot(zb - za, yb - ya);
    for (const sd of [1, -1])
      for (let i = 0; i <= n; i++) {
        const d = a + ((e - a) * i) / n;
        const [x0, x1] = [X(d - 0.02), X(d + 0.02)];
        m.facets("slat", [[x0, ya, sd * za], [x1, ya, sd * za], [x1, yb, sd * zb], [x0, ya, sd * za], [x1, yb, sd * zb], [x0, yb, sd * zb]], [0, -(zb - za) / l, (sd * (yb - ya)) / l]);
      }
  });
  for (const [d0, d1] of car.end ? [CAB_HOOD, hoodAt(true, car.length)] : [hoodAt(false, car.length)]) m.scope("roof hood", () => {
    const [x0, x1] = [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))];
    const top = 4.27, hw = 0.68;
    block(m, "roofG", x0, x1, 3.95, top, -hw, hw);
    m.scope("grilles", () => {
      const n = Math.max(5, Math.round((x1 - x0) / 0.34)), w = (x1 - x0 - 0.5) / n;
      for (const sd of [1, -1]) for (let i = 0; i < n; i++) {
        const xa = x0 + 0.25 + i * w + 0.05;
        block(m, "slat", xa, xa + w - 0.1, 4.03, top - 0.05, sd > 0 ? hw - 0.005 : -hw - 0.012, sd > 0 ? hw + 0.012 : -hw + 0.005);
      }
    });
  });
}

/** The small square windows by the doors: sill and head. */
const SQUARE: readonly [number, number] = [2.3, 2.6];

export const CRH5G: ShinkansenSeries = {
  // the CRH5A's body: 3.2 m wide, its sides leaning in above the windows; 4.05 m at the crown
  endLength: 27.6, midLength: 25.0, W: 1.6, Y: 1.55, S: 3.2, C: 4.05, lean: 0.9, B, A,
  tiltSection: { wa: 0.95, wl: 0.9 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH5G_FACE,
  // the window row 1.98 - 2.74 m in the dark band (1.2 m by 0.76 m panes); single plug doors with a narrow window
  windows: [[1.98, 2.74]], windowW: 1.2, pitch: 1.85, door: [1.25, 3.07, 2.15, 2.8], doorW: 0.9, doorGlassW: 0.26,
  layout: {
    // the end car: the door 9.0 m behind the tip, a narrow pane, six windows, the rear blank (toilet)
    end: { doors: [[9.0 - JOIN, 9.9 - JOIN, 1]], windows: [[10.95 - JOIN, 11.4 - JOIN], ...run(11.9 - JOIN, 6, 1.2, 1.85)] },
    // the intermediate cars: a door at each end, a narrow pane, eight windows, the toilets' blank side at the rear
    middle: { doors: [[0.35, 1.2, 1], [MID_BODY - 1.2, MID_BODY - 0.35, -1]], windows: [[2.2, 2.65], ...run(3.1, 8, 1.2, 2.0)] },
  },
  sidePanels: {
    middle: [{ d: [1.55, 1.85], y: SQUARE, kind: "window" }, { d: [MID_BODY - 1.95, MID_BODY - 1.65], y: SQUARE, kind: "window" }],
  },
  // the leading bogie 6.2 m behind the tip, 19.0 m bogie centres; the intermediate cars' 2.75 m in from each body end
  endBogies: [6.2 - JOIN, 25.2 - JOIN], midBogies: [2.75, MID_BODY - 2.75],
  bogieCentres: 19.0, wheelR: 0.445, wheelbase: 2.7,
  // single-arm pantographs on the Tp trailers, the third car and the third from last (Mc M Tp M T Tp M Mc)
  pantographAt: 17.0,
  liveries: { crh: crhLivery() },
  fittings: crh5gFittings,
  // about 460 t the eight cars, 5,500 kW from five motor cars
  weight: { end: 59, middle: 56 }, power: 1100, maxspeed: 250,
};
