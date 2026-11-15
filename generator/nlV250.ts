// The Fyra V250 "Albatros" (AnsaldoBreda V250, NS Hispeed / SNCB 2009 - 2013; Trenitalia's ETR 700
// since), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the blunt,
// bulbous nose cone with the black coupler opening and the four lamps in their scoops, the bonnet
// rising to the wide, raked windscreen under the roof's brow, the dark "eye" round the cab's small side
// window; the Fyra scheme of white with red, magenta and pink fields sweeping up the cars. Matched to
// the photographs in assets/ns-v250/ (SOURCES.md): the side-on nose of 4806 in Den Haag, its
// three-quarter views at Rotterdam Centraal, Amsterdam and on test, the pantograph close-up.
// See docs/models/netherlands-trains.md.
//
// Heights over the rail, d behind the nose's tip (its most forward point, 1.65 m up), lat from the
// centre line; the side photograph (Den Haag) at about 197 px/m.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, shapedCrownPane, sideDecal, sideLettering, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const WHITE = "#eef0f0";
const RED = "#d42b26";
const MAGENTA = "#cc4f8f";
const PINK = "#eea3c5";

/** Where the face meets the body (the roof reaches its full 4.08 m), 0.1 m ahead of the cab door. */
const JOIN = 5.2;
/** Lengths over the couplers (26.95 m end cars, 24.5 m intermediate cars, 200.9 m for eight) and the bodies they leave. */
const END_LENGTH = 26.95;
const MID_LENGTH = 24.5;
/** The end car's body's rear end, d behind the tip; an intermediate car's body length. */
const END = END_LENGTH - 0.25 - 0.07;
const MID = MID_LENGTH - 0.5;
/** Section: half width (2.87 m), belly, shoulder, crown; skirt bottom and top. */
const W = 1.435, Y = 0.92, S = 3.3, C = 4.08, B = 0.5, A = 0.86;
/** The window band (black-framed panes, thin mullions) and the single plug doors with their narrow window. */
const SILL = 2.05, HEAD = 2.95;

/**
 * The nose's centre line: the face nearly upright from the skirt's dark apron (0.5 m) past the
 * coupler opening to the tip between the lamps (1.65 m), the nose cone rounding over to the
 * bonnet (2.2 - 2.65 m, about 28 degrees), the windscreen leaning back at about 36 degrees from its
 * foot (2.68 m, 1.15 m back) to its head under the brow (3.75 m, 2.75 m back), the roof reaching
 * its full height at the join.
 */
const PROFILE: Pt[] = [
  [0.5, 0.36], [0.6, 0.26], [0.72, 0.17], [0.9, 0.1], [1.1, 0.05], [1.3, 0.02], [1.5, 0.004], [1.65, 0], [1.8, 0.02], [1.95, 0.07],
  [2.1, 0.16], [2.25, 0.32], [2.4, 0.55], [2.55, 0.85], [2.68, 1.15], [2.85, 1.42], [3.05, 1.7], [3.25, 1.98], [3.45, 2.25], [3.62, 2.5],
  [3.75, 2.75], [3.86, 3.05], [3.95, 3.4], [4.01, 3.85], [4.05, 4.4], [4.075, 4.85], [C, JOIN],
];

/** How far back the corners sweep before the side is straight, by height: the bulbous cone, the bonnet, the cab narrowing under the roof. */
const DEPTH: Pt[] = [[0.5, 1.0], [1.0, 1.15], [1.65, 1.3], [2.0, 1.35], [2.4, 1.5], [2.7, 1.8], [3.0, 1.95], [3.5, 2.2], [3.9, 2.0], [C, 1.9]];
const depthAt = (y: number): number => {
  for (let i = 1; i < DEPTH.length; i++) if (y <= DEPTH[i]![0]) { const [a, b] = [DEPTH[i - 1]!, DEPTH[i]!]; return a[1] + ((b[1] - a[1]) * (y - a[0])) / (b[0] - a[0]); }
  return DEPTH[DEPTH.length - 1]![1];
};

/** The cab's dark "eye" on each side (Den Haag: d 1.75 - 4.65 m, its lower edge level, its top rising to the roof's curve). */
const EYE_FRONT: Pt[] = [[2.76, 1.75], [2.82, 1.8], [3.0, 2.02], [3.2, 2.32], [3.4, 2.72], [3.55, 3.15], [3.66, 3.7], [3.72, 4.45]];
const EYE_BACK: Pt[] = [[2.76, 1.75], [2.8, 3.85], [2.9, 4.18], [3.1, 4.4], [3.3, 4.53], [3.5, 4.6], [3.72, 4.62]];

/** The windscreen seen head-on: a trapezoid with rounded corners, 2.04 m wide at its foot, 1.68 m at its head. */
const screen = (hw0: number, hw1: number, y0: number, y1: number, r: number): Pt[] => {
  const pts: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => { for (let j = 0; j <= 3; j++) { const a = ((a0 + 30 * j) * Math.PI) / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  corner(hw0 - r, y0 + r, -90);
  corner(hw1 - r, y1 - r, 0);
  corner(-hw1 + r, y1 - r, 90);
  corner(-hw0 + r, y0 + r, 180);
  return pts;
};

/** The scoops round the lamps (a pale shadow) and the lamps: the inner pair over the coupler opening's corners, the outer pair higher. */
const LAMPS: Array<readonly [number, number, number, string]> = [
  [0.82, 1.64, 0.085, "lampHead"], [-0.82, 1.64, 0.085, "lampHead"],
  [1.03, 1.97, 0.075, "lampHead"], [-1.03, 1.97, 0.075, "lampHead"],
  // the tail lamps beside the inner pair
  [0.98, 1.58, 0.032, "lampRed"], [-0.98, 1.58, 0.032, "lampRed"],
];
const scoop = (lat: number, y: number, r: number) => ({ lat: [lat - r, lat + r] as const, y: [y - r * 0.85, y + r * 0.85] as const, r: r * 0.85, mat: "v250Scoop" });

export const V250_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 5.3, roofFrom: 9, cols: [1, 7, 1, 1], tolerance: 0.045, wrap: true,
  profile: PROFILE,
  // round in plan at every height: the corner is the whole half width, swept back as DEPTH says
  corner: [[B, 2.0], [C, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, depthAt(y)))]),
  rows: [B, 0.6, 0.9, 1.2, 1.45, 1.65, 1.95, 2.2, 2.45, 2.7, 2.95, 3.2, 3.45, 3.72, 3.88, 3.98, 4.04, C],
  // the face is white over the dark apron; its paint (the opening, the scoops, the glass, the eye) below
  bands: () => [[0, 0.56, "skirtG"], [0.56, 9, "white"]],
  lodBands: [[0, 0.56, "skirtG"], [0.56, 0.6, "white"], [0.6, 1.45, "black"], [1.45, 9, "white"]],
  lod: {
    profile: PROFILE, corner: [[B, 2.0], [C, 2.0]], rows: [0.5, 0.9, 1.3, 1.65, 2.0, 2.4, 2.68, 3.05, 3.45, 3.75, 3.95, C],
    cornerDepth: [[0.5, 1.0], [1.65, 1.3], [2.4, 1.5], [2.68, 1.8], [3.05, 1.95], [3.45, 2.2], [3.75, 2.0], [3.95, 1.6], [C, 0.05]],
  },
  lodGlass: { hw: 0.95, y: [2.7, 3.72] },
  paint: [
    // the nose cone's joint, running round the cone over the bonnet
    { mat: "v250Seam", front: [[0.6, 0.73], [2.45, 0.73]], back: [[0.6, 0.742], [2.45, 0.742]], top: 2.45 },
    // the cab's eye, its small side window in a black frame
    { mat: "v250Eye", front: EYE_FRONT, back: EYE_BACK, top: 3.72 },
    { mat: "cabGlass", front: [[2.92, 2.64], [3.38, 2.64]], back: [[2.92, 2.96], [3.38, 2.96]], top: 3.38 },
  ],
  fields: [
    // the windscreen
    { mat: "cabGlass", pts: screen(1.04, 0.86, 2.7, 3.73, 0.14) },
  ],
  masks: [
    // the coupler opening, black, a white lip under it
    { lat: [-0.88, 0.88], y: [0.6, 1.45], r: 0.18, mat: "black" },
    scoop(0.82, 1.64, 0.15), scoop(-0.82, 1.64, 0.15), scoop(1.03, 1.97, 0.13), scoop(-1.03, 1.97, 0.13),
  ],
  panes: [],
  lamps: LAMPS,
  // the long lamp on the brow over the windscreen
  roofLamp: [0, 3.86, 0.07],
  wipers: [[[0.3, 2.76], [0.78, 3.3]], [[-0.08, 2.76], [-0.62, 3.25]]],
};

/** The end car's red (photo 4806, Den Haag; Rotterdam Centraal): from the nose cone's joint rising 0.23 m a metre past the cab door, then curving up over the window band to the shoulder 12.8 m back and over the roof to the crown 17.5 m back. */
const RED_FRONT: Pt[] = [[Y + 0.01, 0.86], [1.34, 0.89], [1.69, 2.26], [2.05, 3.78], [2.33, 5.15], [2.6, 6.4], [HEAD, 9.0], [3.12, 10.6], [3.25, 12.0], [S - 0.01, 12.8]];

function fyraLivery(): ShinkansenLivery {
  return {
    title: "Fyra", number: "4806",
    palette: {
      white: c(WHITE, 0.3), red: c(RED, 0.35), magenta: c(MAGENTA, 0.35), pink: c(PINK, 0.35),
      roofG: c(WHITE, 0.4), skirtG: c("#3b3d40", 0.7), cabMask: c("#17191b", 0.3), black: c("#111213", 0.5),
      v250Eye: c("#3d4145", 0.3), v250Scoop: c("#c9cdcf", 0.35), v250Seam: c("#b4b8bb", 0.5), grille: c("#2f3235", 0.6), v250Band: c("#1b1d20", 0.25),
    },
    bands: [[0, 9, "white"]], roof: "roofG", skirt: "skirtG",
    // the cab door white over red, the intermediate cars' the same
    doors: [[0, 2.3, "red"], [2.3, 9, "white"]],
    endSweeps: [
      { mat: "red", front: RED_FRONT, back: [[Y + 0.01, END], [S - 0.01, END]], face: true },
      // the magenta corner low at the end car's inner end
      { mat: "magenta", front: [[Y + 0.01, END - 4.6], [SILL, END - 0.3]], back: [[Y + 0.01, END], [SILL, END]] },
    ],
    // far off: white over red, the nose white
    lodSides: [[0, SILL, "red"], [SILL, 9, "white"]],
  };
}

/** Panes of a window band from d0 to d1, n of them, 8 cm mullions between them. */
const paneRow = (d0: number, d1: number, n: number): Array<readonly [number, number]> => {
  const w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w + (i ? 0.04 : 0), d0 + (i + 1) * w - (i < n - 1 ? 0.04 : 0)] as const);
};

const LAYOUT: { end: SeriesLayout; middle: SeriesLayout } = {
  // the end car: the cab door 5.3 m behind the tip, thirteen panes from just behind it to 1.1 m from the inner end
  end: { doors: [[5.3 - JOIN, 6.2 - JOIN, 1]], windows: paneRow(6.45 - JOIN, END - 1.1 - JOIN, 13) },
  // the intermediate cars: one door a side at the end toward the leading cab, fourteen panes behind it
  middle: { doors: [[0.45, 1.35, -1]], windows: paneRow(1.6, MID - 1.0, 14) },
};

/** Ear-clipping triangulation of a simple polygon in (d, y), counter-clockwise. */
function triangulate(poly: readonly Pt[]): Pt[] {
  const pts = [...poly], out: Pt[] = [];
  const cross = (a: Pt, b: Pt, q: Pt) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
  let guard = 0;
  while (pts.length > 3 && guard++ < 500) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length]!, b = pts[i]!, q = pts[(i + 1) % pts.length]!;
      if (cross(a, b, q) <= 1e-9) continue;
      if (pts.some((p) => p !== a && p !== b && p !== q && cross(a, b, p) > 0 && cross(b, q, p) > 0 && cross(q, a, p) > 0)) continue;
      out.push(a, b, q);
      pts.splice(i, 1);
      break;
    }
  }
  if (pts.length === 3) out.push(pts[0]!, pts[1]!, pts[2]!);
  return out;
}

/** Paint over the roof's arc from d0 to d1 (body d), its front edge slanting from the shoulder at d0 to the crown at dC. */
function roofField(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: string, d0: number, dC: number, d1: number, proud: number): void {
  const zS = b.w(d0) * b.lean + 0.05;
  const extra = Array.from({ length: 12 }, (_, i) => d0 + ((dC - d0) * (i + 1)) / 13);
  const edge = (d: number) => (d >= dC ? 0 : zS * (1 - (d - d0) / (dC - d0)));
  for (const sd of [1, -1]) shapedCrownPane(m, b, X, sd, mat, [d0, d1], edge, () => zS, proud, extra);
}

/** The side's fields on both sides, polygons in (d, y). */
function sideFields(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: string, polys: readonly Pt[][], proud: number): void {
  for (const sd of [1, -1]) for (const poly of polys) sideDecal(m, b, X, sd, mat, triangulate(poly), proud);
}

/**
 * The fittings: the roof's grille behind the cab, the red carried over the end car's roof, the
 * intermediate cars' fields (Rotterdam Centraal and 4806's second car: red over the windows and the
 * roof's front half, magenta below them sweeping back to the pink, white at the rear, the Fyra name),
 * the underfloor equipment between the bogies.
 */
function v250Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length, tr = car.trucks;
  if (car.end) {
    m.scope("roof grille", () => {
      for (const sd of [1, -1]) {
        crownPane(m, b, X, sd, "grille", [0.1, 0.9], [0.98, 1.26], 0.006);
        for (let i = 1; i < 5; i++) crownPane(m, b, X, sd, "black", [0.1 + i * 0.16 - 0.02, 0.1 + i * 0.16 + 0.02], [1.0, 1.24], 0.01);
      }
    });
    m.scope("red roof", () => roofField(m, b, X, "red", 12.8 - JOIN, 17.5 - JOIN, L, 0.004));
  } else {
    m.scope("roof", () => {
      roofField(m, b, X, "red", 0, 0.01, 12.5, 0.004);
      roofField(m, b, X, "pink", 12.5, 14.5, L, 0.005);
    });
    m.scope("side fields", () => {
      // over the windows: red from the door back to 13 m, pink behind
      sideFields(m, b, X, "red", [[[1.4, HEAD], [13.0, HEAD], [14.0, S - 0.01], [1.4, S - 0.01]], [[0, HEAD], [0.4, HEAD], [0.4, S - 0.01], [0, S - 0.01]]], 0.003);
      sideFields(m, b, X, "pink", [[[13.0, HEAD], [L, HEAD], [L, S - 0.01], [14.0, S - 0.01]]], 0.003);
      // under the windows: magenta from the door, its rear edge leaning back up to the sill; pink behind it; white at the rear
      sideFields(m, b, X, "magenta", [[[1.4, Y + 0.01], [12.4, Y + 0.01], [17.5, SILL], [1.4, SILL]], [[0, Y + 0.01], [0.4, Y + 0.01], [0.4, SILL], [0, SILL]]], 0.003);
      sideFields(m, b, X, "pink", [[[12.4, Y + 0.01], [16.4, Y + 0.01], [21.5, SILL], [17.5, SILL]]], 0.003);
    });
    m.scope("name", () => { for (const sd of [1, -1]) sideLettering(m, b, X, sd, "FYRA", 20.2, 1.15, 0.55, "red", 0.004); });
  }
  // the window band dark between the panes, from the first pane to the last
  const w = car.end ? LAYOUT.end.windows : LAYOUT.middle.windows;
  m.scope("window band", () => sideFields(m, b, X, "v250Band", [[[w[0]![0], SILL], [w[w.length - 1]![1], SILL], [w[w.length - 1]![1], HEAD], [w[0]![0], HEAD]]], 0.0052));
  m.scope("underfloor", () => {
    const at = (d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, "under", Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
    at(tr[0]! + 2.0, tr[1]! - 2.0, B - 0.38, B, W * 0.8);
  });
}

export const V250: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: V250_FACE,
  windows: [[SILL, HEAD]], windowW: 1.4, pitch: 1.48, door: [1.0, 3.25, SILL, 2.85], doorW: 0.9, doorGlassW: 0.28,
  layout: LAYOUT,
  // the leading bogie under the cab's eye, 3.8 m behind the tip; the others 2.8 m in from the inner ends; 920 mm wheels
  endBogies: [3.8 - JOIN, END - 2.8 - JOIN], midBogies: [2.8, MID - 2.8],
  bogieCentres: MID - 5.6, wheelR: 0.46, wheelbase: 2.75,
  // single-arm pantographs on the second and the next-to-last car, over their leading end (photo: the
  // red car's roof well at its end)
  pantographsBesideEnds: true, pantographAt: 2.6,
  fittings: v250Fittings,
  // far off: the white ahead of the red sweep, stepped (the sweep crosses the belly 0.9 m back, the sill 3.8 m back)
  lodEndPatches: [{ d: [1.4, 6.0], hw: W + 0.012, y: [B + 0.05, 1.9], mat: "white" }, { d: [2.2, 6.0], hw: W + 0.012, y: [1.9, SILL], mat: "white" }],
  liveries: { fyra: fyraLivery() },
  weight: { end: 55, middle: 52 }, power: 680, maxspeed: 250,
};
