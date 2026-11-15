// The CRH5A (Alstom / CNR Changchun, from the Pendolino ETR 600 family), drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): the blunt, rounded Pendolino snout with its
// bulbous coupler cover, the dark glass canopy reaching back over the cab roof, the slanted lamp
// lozenges under its lower corners and the "eye" cab side window, matched to the photographs in
// assets/cr-crh5a/ (SOURCES.md). See docs/models/china-trains.md, "The CRH5A's body".
//
// Heights over the rail, d behind the snout's tip (the coupler cover's front, 1.0 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { bodyHalf, edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

const WHITE = "#f1f2ef";
const CRH_BLUE = "#1f4f9f";

/** Where the face meets the body: the roof reaches its full 4.05 m there. */
const JOIN = 7.0;
/** The body's bottom (the white skirt panels' foot) and the skirts' top. */
const B = 0.4;
const A = 1.15;

/**
 * The snout's centre line, behind the coupler cover (drawn apart, `coverDome`): upright from the
 * spoiler to 1.5 m, 0.5 m back, then rounding over to the canopy's foot at 2.1 m, 1.3 m back, the
 * glass leaning back at about 25 degrees (3.0 m at 3.1 m back, 3.4 m at 4.0 m back) to the crown
 * about 6.4 m back (photo-crh5a-5043d6930.jpg, 48 px/m).
 */
const PROFILE: Pt[] = [
  [B, 0.95], [0.5, 0.66], [0.62, 0.53], [0.75, 0.48], [1.0, 0.48], [1.25, 0.5], [1.5, 0.56], [1.7, 0.7], [1.85, 0.86], [2.0, 1.08], [2.15, 1.42],
  [2.3, 1.68], [2.5, 1.98], [2.7, 2.3], [2.9, 2.65], [3.1, 3.03], [3.3, 3.45], [3.5, 3.95], [3.7, 4.55], [3.85, 5.15], [3.95, 5.7], [4.02, 6.3], [4.05, JOIN],
];

/** The coupler cover: half an ellipsoid on the snout's foot - its centre height, half width and half height, its tip's d and how deep it reaches back. */
const COVER = { y: 0.93, hw: 0.76, hh: 0.52, d: 0.0, depth: 0.95 };

/**
 * The canopy's lower edge on the snout's sides ([y, d]): its foot 2.1 m up on the centre line, nearly
 * level across the face to the lamps' tops, then rising along the sides to the crown 6.5 m back.
 */
const GLASS_BACK: Pt[] = [[2.1, 1.3], [2.2, 2.0], [2.4, 2.65], [2.65, 3.35], [2.95, 4.0], [3.35, 4.8], [3.7, 5.6], [3.95, 6.2], [4.06, 6.55]];
/** The "eye": the cab side window, a slanted tear pointing forward and down (front 4.1 m back, 2.33 m up; its round rear 6.2 m back, 2.75 - 3.25 m). */
const EYE_FRONT: Pt[] = [[2.3, 4.0], [2.8, 5.05], [3.15, 5.8], [3.32, 6.15]];
const EYE_BACK: Pt[] = [[2.3, 4.0], [2.55, 5.2], [2.7, 5.95], [2.8, 6.2], [3.05, 6.32], [3.32, 6.25]];

/** The blue band's end on the nose: from the body's 1.82 - 1.94 m it dips and thins to a point 3.0 m behind the tip, 1.66 m up. */
const BAND_FRONT: Pt[] = [[1.66, 3.0], [1.94, 6.6]];
const BAND_BACK: Pt[] = [[1.66, 3.0], [1.82, 6.6], [1.8201, JOIN + 0.05], [1.94, JOIN + 0.05]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.46, 0.62, 0.85, 1.12, 1.38, 1.6, 1.66, 1.78, 1.82, 1.94, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6])].sort((a, b) => a - b);

/** A lamp lozenge under the canopy's lower corner (viewer's right), rising toward the outside; `k` scales it about its centre (the lens inside the housing). */
const lozenge = (k: number, s: 1 | -1): Pt[] => {
  const pts: Pt[] = [[0.55, 1.5], [0.72, 1.44], [1.24, 1.76], [1.38, 1.9], [1.35, 2.04], [1.18, 2.04], [0.58, 1.66]];
  const [cx, cy] = [0.97, 1.75];
  const out = pts.map(([l, y]): Pt => [s * (cx + (l - cx) * k), cy + (y - cy) * k]);
  return s > 0 ? out : out.reverse();
};

export const CRH5A_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 7.35, roofFrom: 9, cols: [1, 12, 1, 1], tolerance: 0.035, wrap: true,
  profile: PROFILE,
  // a round snout: the corner is the whole half width, elliptic, reaching full width 2.6 m behind the
  // centre line low down, deeper over the canopy, and at the join at the crown
  corner: [[B, 2.0], [4.05, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, 2.6 + Math.max(0, y - 2.0) * 2.2))]),
  rows: ROWS,
  // the face is white; its paint (the canopy, the eye, the lamps, the band) is drawn below
  bands: (l) => [[0, 9, l.bands[0]![2]]],
  lodBands: [[0, 9, "white"]],
  lod: { profile: PROFILE, corner: [[B, 2.0], [4.05, 2.0]], rows: [B, 0.75, 1.0, 1.5, 2.0, 2.3, 2.7, 3.1, 3.5, 3.85, 4.05], cornerDepth: [[B, 2.6], [2.0, 2.6], [2.7, 4.1], [3.1, 3.7], [3.5, 2.75], [3.85, 1.65], [4.05, 0.05]] },
  lodGlass: { hw: 1.1, y: [2.15, 3.95] },
  paint: [
    // white below the skirts' top on the snout's sides
    { mat: "white", front: [[B, -9], [A, -9]], back: [[B, JOIN + 1], [A, JOIN + 1]] },
    // the canopy: one dark glass from its foot over the cab roof, a darker rim round it
    { mat: "cabMask", front: [[2.06, -9], [4.1, -9]], back: GLASS_BACK.map(([y, d]): Pt => [y - 0.05, d + 0.07]), top: 4.1 },
    { mat: "cabGlass", front: [[2.1, -9], [4.1, -9]], back: GLASS_BACK, top: 4.1 },
    // the eye: the cab side window
    { mat: "cabGlass", front: EYE_FRONT, back: EYE_BACK },
  ],
  fields: [
    // the lamp lozenges: a black housing, the lens inside
    { mat: "cabMask", pts: lozenge(1, 1) }, { mat: "cabMask", pts: lozenge(1, -1) },
    { mat: "lampLens", pts: lozenge(0.72, 1) }, { mat: "lampLens", pts: lozenge(0.72, -1) },
    // the windscreen proper in the canopy's front: a lighter pane inside the dark frame
    { mat: "screen", pts: [[-0.9, 2.26], [0.9, 2.26], [0.98, 2.36], [0.9, 2.66], [0.7, 2.78], [-0.7, 2.78], [-0.9, 2.66], [-0.98, 2.36]] },
  ],
  wipers: [[[0.08, 2.3], [0.48, 2.7]], [[-0.62, 2.3], [-0.22, 2.7]]],
  panes: [],
  lamps: [[1.12, 1.86, 0.05, "lampHead"], [-1.12, 1.86, 0.05, "lampHead"], [0.8, 1.66, 0.035, "lampRed"], [-0.8, 1.66, 0.035, "lampRed"]],
};

/** CRH white, the blue band just under the windows carried down onto the nose. */
function crhLivery(): ShinkansenLivery {
  return {
    title: "CRH blue", number: "CRH5A-5043",
    palette: {
      white: c(WHITE), blue: c(CRH_BLUE), roofG: c("#dcdfe1", 0.55), skirtG: c("#e7e9e8", 0.55), cabMask: c("#15181b", 0.3),
      seam: c("#8d9296", 0.6), lampLens: { color: "#c9d3dc", metallic: 0.3, roughness: 0.1, glass: true }, slat: c("#b3b8bc", 0.6), screen: { color: "#3d4d5b", metallic: 0.25, roughness: 0.08, glass: true },
    },
    bands: [[0, 1.82, "white"], [1.82, 1.94, "blue"], [1.94, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [{ mat: "blue", front: BAND_FRONT, back: BAND_BACK, face: true }],
    endLettering: [{ text: "CRH", d: 6.05 - JOIN, y: 2.02, h: 0.3, mat: "blue" }],
  };
}

/** The windows of a run: `n` panes `w` wide from d0, `pitch` apart. */
const run = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

const MID_BODY = 25.0 - 0.5;

/** The roof's air-conditioning hood on every car (d span on the car's body). */
const hoodAt = (end: boolean, L: number): readonly [number, number] => (end ? [22.4 - JOIN, 25.4 - JOIN] : [L - 4.5, L - 1.5]);

/** A triangle wound outward from a centre point. */
function outward(m: MeshBuilder, mat: string, c: Vec3, a: Vec3, b: Vec3, e: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [e[0] - a[0], e[1] - a[1], e[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const g = [a[0] + b[0] + e[0] - 3 * c[0], a[1] + b[1] + e[1] - 3 * c[1], a[2] + b[2] + e[2] - 3 * c[2]];
  if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] >= 0) m.tri(mat, a, b, e);
  else m.tri(mat, a, e, b);
}

/**
 * The coupler cover: half an ellipsoid standing forward of the snout's foot, its rim sunk in the face
 * (the joint reads as a dark line: the rim's last ring is the seam's paint), a slot for the coupler low on it.
 */
function coverDome(m: MeshBuilder, X: (d: number) => number): void {
  const xc = X(COVER.d + COVER.depth - JOIN), fwd = Math.sign(X(-1) - X(0));
  const [na, nb] = [7, 18];
  // the rings from the tip (0) to the rim (na): the last a thin seam, 3 % of the quarter arc
  const PHI = Array.from({ length: na + 1 }, (_, i) => (Math.PI / 2) * (i < na ? (0.97 * i) / (na - 1) : 1));
  const at = (i: number, j: number): Vec3 => {
    // i: from the tip (0) to the rim (na); j: round the rim
    const phi = PHI[i]!, th = (2 * Math.PI * j) / nb;
    return [xc + fwd * COVER.depth * Math.cos(phi), COVER.y + COVER.hh * Math.sin(phi) * Math.sin(th), COVER.hw * Math.sin(phi) * Math.cos(th)];
  };
  const ctr: Vec3 = [xc, COVER.y, 0];
  for (let i = 0; i < na; i++)
    for (let j = 0; j < nb; j++) {
      const mat = i === na - 1 ? "seam" : "white";
      const [a, b, e, f] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      outward(m, mat, ctr, a, b, e);
      if (i > 0) outward(m, mat, ctr, a, e, f);
    }
  // the coupler's slot, a dark plate on the dome's lower front
  const ys = COVER.y - 0.3, k = Math.sqrt(1 - ((ys - COVER.y) / COVER.hh) ** 2), xs = X(-JOIN) - fwd * (COVER.depth * (1 - k)) ;
  m.scope("slot", () => block(m, "seam", Math.min(xs - fwd * 0.08, xs + fwd * 0.01), Math.max(xs - fwd * 0.08, xs + fwd * 0.01), ys - 0.035, ys + 0.035, -0.13, 0.13));
}

/** The CRH5A's own fittings: the coupler cover, the underfloor, the slats of the white skirt panels between the bogies and the roof's air-conditioning hood. */
function crh5aFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = car.trucks as [number, number];
  if (car.end) m.scope("coupler cover", () => coverDome(m, X));
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(t0 + 2.6), B - 0.1, B + 0.05, -1.6 * 0.8, 1.6 * 0.8));
  // the skirts' vertical slats, about 0.5 m apart between the bogies (photo-crh5a-5043d6930.jpg), on the skirt's tucked-in face
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
  // the air-conditioning hood: a low box on the roof, grilles of dark slats along its sides
  m.scope("roof hood", () => {
    const [d0, d1] = hoodAt(car.end, car.length);
    const [x0, x1] = [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))];
    const top = 4.27, hw = 0.68;
    block(m, "roofG", x0, x1, 3.95, top, -hw, hw);
    m.scope("grilles", () => {
      const n = 9, w = (x1 - x0 - 0.5) / n;
      for (const sd of [1, -1]) for (let i = 0; i < n; i++) {
        const xa = x0 + 0.25 + i * w + 0.05;
        block(m, "slat", xa, xa + w - 0.1, 4.03, top - 0.05, sd > 0 ? hw - 0.005 : -hw - 0.012, sd > 0 ? hw + 0.012 : -hw + 0.005);
      }
    });
  });
}

/** The small square windows by the doors: sill and head. */
const SQUARE: readonly [number, number] = [2.3, 2.6];

export const CRH5A: ShinkansenSeries = {
  // 3.2 m wide (the Pendolino's wide body), its sides leaning in above the windows; 4.05 m at the crown
  endLength: 27.6, midLength: 25.0, W: 1.6, Y: 1.55, S: 3.2, C: 4.05, lean: 0.9, B, A,
  tiltSection: { wa: 0.95, wl: 0.9 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH5A_FACE,
  // the window row 1.98 - 2.74 m (1.2 m by 0.76 m panes about 1.9 m apart); single plug doors with a narrow window
  windows: [[1.98, 2.74]], windowW: 1.2, pitch: 1.9, door: [1.25, 3.07, 2.15, 2.8], doorW: 0.85, doorGlassW: 0.26,
  layout: {
    // the end car: the door just behind the CRH mark, a narrow pane, seven windows, the rear door at the car's end
    end: { doors: [[7.35 - JOIN, 8.2 - JOIN, 1], [26.25 - JOIN, 27.1 - JOIN, -1]], windows: [[8.7 - JOIN, 9.15 - JOIN], ...run(9.6 - JOIN, 7, 1.2, 1.9)] },
    // the intermediate cars: a door at each end, a narrow pane, eight windows, the toilets' blank side at the rear
    middle: { doors: [[0.35, 1.2, 1], [MID_BODY - 1.2, MID_BODY - 0.35, -1]], windows: [[2.2, 2.65], ...run(3.1, 8, 1.2, 2.0)] },
  },
  sidePanels: {
    end: [{ d: [25.35, 25.65], y: SQUARE, kind: "window" }],
    middle: [{ d: [1.55, 1.85], y: SQUARE, kind: "window" }, { d: [MID_BODY - 1.95, MID_BODY - 1.65], y: SQUARE, kind: "window" }],
  },
  // the leading bogie 5.6 m behind the tip, 19.0 m bogie centres; the intermediate cars' 2.75 m in from each body end
  endBogies: [5.6 - JOIN, 24.6 - JOIN], midBogies: [2.75, MID_BODY - 2.75],
  bogieCentres: 19.0, wheelR: 0.445, wheelbase: 2.7,
  // single-arm pantographs on the Tp trailers, the third car and the third from last (Mc M Tp M T Tp M Mc)
  pantographAt: 17.0,
  liveries: { crh: crhLivery() },
  fittings: crh5aFittings,
  // 451 t the eight cars, 5,500 kW from five motor cars
  weight: { end: 58, middle: 55 }, power: 1100, maxspeed: 250,
};
