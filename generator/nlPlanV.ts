// The NS Mat '64 Plan V (Werkspoor, Talbot, Duewag 1966 - 1976), the two-car electric stopping
// train, drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the "Apekop"
// - the bulbous lower nose with the dark lamp band wrapping round it (two tail and two head lamps,
// the grille between them), the head lamp in its oval housing on the bulge, the dark chin with the
// coupler's recess and the Scharfenberg coupler, the windscreen of three panes set back over the
// bulge, the side panes wrapping round the corners, the D-shaped corner windows behind them, the
// grey cab roof - then the cab door, two windows, a door, five windows and a narrow one, a door and
// three windows on each car (sub-series V4 - V6, 441 - 483), the grey swing-plug doors with a
// narrow window in each leaf, the three slanted blue stripes, the NS logo, one single-arm pantograph
// near the inner end of the leading car. Matched to the photographs in assets/ns-plan-v/
// (SOURCES.md). See docs/models/netherlands-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the lamp band's front); the layout's d are
// behind the body's front end (the face's join, JOIN behind the tip).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";

/** Where the face meets the body: the cab roof reaches the full height 2.3 m behind the tip. */
const JOIN = 2.3;
/** The crown, the eaves (the roof's grey from there) and the side's foot over the rail. */
const C = 3.95;
const S = 3.32;
const B = 0.8;
const A = 0.92;
/** The body's half width (2.9 m). */
const W = 1.45;

/**
 * The face's centre line, read from the side views (photo-planv-uitgeest.jpg at about 64 px/m, the
 * close-up photo-mat-64-plan-v-844-1.jpg) and scaled to the head-on photo-441-in-vlissingen.jpg: the
 * chin rounding under from the side's foot, the bulge's front upright through the lamp band
 * (1.25 - 1.65 m), leaning back ever more over the head lamp to the windscreen's foot 0.6 m behind
 * the tip at 2.85 m, the windscreen raked to its head at 3.38 m, the cab roof rounding over to the
 * crown at the join.
 */
const PROFILE: Pt[] = [
  [B, 0.12], [0.95, 0.05], [1.1, 0.015], [1.3, 0], [1.7, 0], [1.95, 0.05], [2.2, 0.13], [2.45, 0.25], [2.65, 0.37], [2.8, 0.48], [2.9, 0.58],
  [3.15, 0.66], [3.45, 0.76], [3.56, 0.9], [3.68, 1.12], [3.8, 1.45], [3.88, 1.8], [3.93, 2.05], [C, JOIN],
];

/** The plan: the bulge's front flat over about 1.2 m, its corners rounding back 1.5 m into the sides (the lamp band wraps round them); the cab's corners as round, the windscreen's side panes on them. */
const CORNER: Pt[] = [[B, 0.75], [1.3, 0.85], [1.7, 0.85], [2.45, 0.85], [2.9, 0.88], [3.45, 0.88], [3.68, 0.75], [3.88, 0.45], [C, 0.2]];
const DEPTH: Pt[] = [[B, 1.15], [1.3, 1.5], [1.7, 1.55], [2.45, 1.5], [2.9, 1.45], [3.45, 1.3], [3.68, 0.95], [3.88, 0.45], [C, 0.05]];
const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
};
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.05, edge(DEPTH, y)))]);

/** The lamp band (dark grey), wrapping round the bulge's corners back to 1.75 m behind the tip. */
const BAND: readonly [number, number] = [1.3, 1.7];
/** The windscreen: the centre pane and the side panes on the corners, their sills and heads. */
const SCREEN: readonly [number, number] = [2.92, 3.44];
/** The coupler's recess: its half width and top (it runs down through the chin to 0.62 m). */
const RECESS = { hw: 0.82, y0: 0.55, y1: 1.15 };

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.95, RECESS.y1, 1.37, 1.63, 2.35, 2.65, 2.84, 2.88, SCREEN[0], SCREEN[1], 3.6])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

export const PLAN_V_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.9, reach: 0.3, first: 3.2, roofFrom: 3.6, bulge: 0.02, tolerance: 0.02, cols: [6, 4, 1, 1],
  profile: PROFILE, corner: CORNER, cornerDepth: CORNER_DEPTH,
  rows: ROWS,
  // yellow over the dark chin; the lamp band is the livery's sweep (it runs on round the corners)
  bands: () => [[0, 0.95, "skirtG"], [0.95, 9, "yellow"]],
  lodBands: [[0, 0.95, "skirtG"], [0.95, BAND[0], "yellow"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "yellow"]],
  lodGlass: { hw: 1.35, y: SCREEN },
  fields: [
    // the coupler's recess, black down into the chin
    { mat: "black", pts: box(-RECESS.hw, RECESS.hw, 0.7, RECESS.y1) },
  ],
  masks: [
    // the head lamp's oval housing: its dark rim, the yellow inside
    { lat: [-0.22, 0.22], y: [2.35, 2.65], r: 0.14, mat: "rubber" },
    { lat: [-0.19, 0.19], y: [2.38, 2.62], r: 0.11, mat: "yellow" },
    // the windscreen's rubbers: the centre pane and the side panes on the corners
    { lat: [-0.57, 0.57], y: [SCREEN[0] - 0.03, SCREEN[1] + 0.03], r: 0.09, mat: "rubber" },
    { lat: [0.63, 1.43], y: [SCREEN[0] + 0.0, SCREEN[1] - 0.01], r: 0.09, mat: "rubber" },
    { lat: [-1.43, -0.63], y: [SCREEN[0] + 0.0, SCREEN[1] - 0.01], r: 0.09, mat: "rubber" },
  ],
  panes: [
    { lat: [-0.54, 0.54], y: [SCREEN[0], SCREEN[1]], r: 0.07, mat: "screen" },
    { lat: [0.66, 1.4], y: [SCREEN[0] + 0.03, SCREEN[1] - 0.04], r: 0.07, mat: "screen" },
    { lat: [-1.4, -0.66], y: [SCREEN[0] + 0.03, SCREEN[1] - 0.04], r: 0.07, mat: "screen" },
  ],
  decals: [
    // the grille between the head lamps: six slots
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ mat: "black", pts: box(-0.32, 0.32, 1.38 + k * 0.042, 1.405 + k * 0.042), fine: 1 })),
    // the light trim along the windscreen's foot
    { mat: "trim", pts: box(-1.2, 1.2, 2.84, 2.88), fine: 3 },
  ],
  lamps: [
    [-0.98, 1.5, 0.1, "lampRed"], [-0.7, 1.5, 0.1, "lampHead"], [0.7, 1.5, 0.1, "lampHead"], [0.98, 1.5, 0.1, "lampRed"],
    [0, 2.5, 0.085, "lampHead"],
  ],
  // the wipers hang from the screen's head on the left and centre panes; the right pane's parks along its foot
  wipers: [[[-0.97, 3.4], [-1.1, 3.02]], [[0.02, 3.42], [0.36, 3.0]], [[1.24, 2.98], [0.75, 2.99]]],
};

/** The D-shaped corner window on the cab side behind the side pane: its front edge rounding forward over the top. */
const CORNER_WIN_FRONT: Pt[] = [[2.92, 2.32], [3.01, 2.2], [3.12, 2.13], [3.26, 2.09], [3.38, 2.1], [3.44, 2.16]];
const CORNER_WIN_BACK: Pt[] = [[2.92, 2.78], [3.44, 2.78]];
/** Its glass, inside the rubber. */
const CORNER_GLASS_FRONT: Pt[] = [[2.96, 2.35], [3.03, 2.25], [3.13, 2.18], [3.26, 2.14], [3.36, 2.15], [3.4, 2.2]];
const CORNER_GLASS_BACK: Pt[] = [[2.96, 2.74], [3.4, 2.74]];

/** The layout behind the face, d behind the tip (photo-planv-uitgeest.jpg, photo-plan-v-454-te-deventer.jpg). */
const CAB_DOOR: readonly [number, number] = [3.2, 3.75];
const WIN: ReadonlyArray<readonly [number, number]> = [
  [4.05, 5.15], [5.4, 6.5],
  [8.3, 9.45], [9.9, 11.05], [11.5, 12.65], [13.1, 14.25], [14.7, 15.85], [16.25, 16.7],
  [19.85, 21.0], [21.55, 22.7], [23.25, 24.4],
];
const DOORS: ReadonlyArray<readonly [number, number]> = [[6.75, 8.05], [18.2, 19.5]];
/** The three slanted stripes: each 0.7 m wide, their feet 0.88 m apart from 11.0 m, leaning 0.3 m over their height. */
const STRIPES = { d: 11.0, w: 0.7, pitch: 0.88, lean: 0.3, y: [A + 0.01, 3.04] as const };

/** The NS logo (the two arrows in a hexagon), its strokes in a 1 x 0.62 box, [x, y] corners. */
const NS_LOGO: Pt[][] = (() => {
  const P = (x: number, y: number): Pt => [x, y * 0.62];
  // the hexagon open at its top right and bottom left, the bar across its middle
  const left = [P(0.62, 1), P(0.25, 1), P(0, 0.5), P(0.25, 0)];
  const right = left.map(([x, y]): Pt => [1 - x, 0.62 - y]);
  return [left, right, [P(0, 0.5), P(1, 0.5)]];
})();

/** A thick polyline as quads ([x, y] corners). */
function strokes(pts: readonly Pt[], w: number): Pt[][] {
  return pts.slice(1).map((b, i) => {
    const a = pts[i]!;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / l) * w / 2, (dx / l) * w / 2];
    // carried on past both ends by half the width, so the corners close
    const [ex, ey] = [(dx / l) * w / 2, (dy / l) * w / 2];
    return [[a[0] - nx - ex, a[1] - ny - ey], [b[0] - nx + ex, b[1] - ny + ey], [b[0] + nx + ex, b[1] + ny + ey], [a[0] + nx - ex, a[1] + ny - ey]];
  });
}

/** Quads as triangles. */
const tris = (quads: readonly Pt[][]): Pt[] => quads.flatMap((q) => [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!]);

/** A ring in plan round the chin at one height, [d behind the tip, z]: the front flat to `a`, elliptic corners `depth` deep, straight sides back to `back`. */
function chinRing(front: number, hw: number, r: number, depth: number, back: number, n = 6): Pt[] {
  const pts: Pt[] = [];
  // from the back on +z round the front to the back on -z
  pts.push([back, hw * 0.94], [back - 0.08, hw]);
  for (let i = n; i >= 0; i--) {
    const t = (i / n) * (Math.PI / 2);
    pts.push([front + depth * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]);
  }
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    pts.push([front + depth * (1 - Math.cos(t)), -(hw - r + r * Math.sin(t))]);
  }
  pts.push([back - 0.08, -hw], [back, -hw * 0.94]);
  return pts;
}

/** The chin, the coupler's cover, the cab door's rails and steps, the stripes and logo, the roof grilles and the underfloor. */
function planVFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (!car.end) return;
  /** d behind the tip to the body's d. */
  const T = (d: number) => d - JOIN;
  const k = Math.sign(X(1) - X(0));
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(T(d0)), X(T(d1))), Math.max(X(T(d0)), X(T(d1))), y0, y1, z0, z1);

  m.scope("chin", () => {
    // horizontal rings from the side's foot down to the chin's bottom, its back rising toward the bogie
    const levels: Array<readonly [number, number, number, number, number, number]> = [
      // y, front, half width, corner radius, corner depth, back
      [B + 0.02, 0.1, 1.36, 0.75, 1.1, 2.35],
      [0.6, 0.2, 1.3, 0.72, 1.0, 2.25],
      [0.4, 0.32, 1.12, 0.66, 0.86, 2.0],
      [0.27, 0.44, 0.88, 0.56, 0.7, 1.6],
      [0.2, 0.55, 0.62, 0.45, 0.5, 1.15],
    ];
    const ring = (l: (typeof levels)[number]): Ring => {
      const pts = chinRing(l[1], l[2], l[3], l[4], l[5]).map(([d, z]): [number, number] => [X(T(d)), z]);
      // counter-clockwise seen from above
      let a = 0;
      for (let i = 0; i < pts.length; i++) { const [x0, z0] = pts[i]!, [x1, z1] = pts[(i + 1) % pts.length]!; a += x0 * z1 - x1 * z0; }
      return a > 0 ? pts : pts.reverse();
    };
    const rings = levels.map(ring);
    for (let i = 0; i + 1 < levels.length; i++) {
      const [lo, hi] = [rings[i + 1]!, rings[i]!];
      const [ylo, yhi] = [levels[i + 1]![0], levels[i]![0]];
      for (let j = 0; j < lo.length; j++) {
        const jn = (j + 1) % lo.length;
        // the recess black across the front between its edges, above 0.62 m
        const zm = (hi[j]![1] + hi[jn]![1]) / 2, xm = (hi[j]![0] + hi[jn]![0]) / 2;
        const front = Math.abs(xm - X(T(0))) < 0.6;
        const mat = front && Math.abs(zm) < RECESS.hw && ylo >= RECESS.y0 - 1e-6 ? "black" : "skirtG";
        m.quad(mat, [lo[j]![0], ylo, lo[j]![1]], [lo[jn]![0], ylo, lo[jn]![1]], [hi[jn]![0], yhi, hi[jn]![1]], [hi[j]![0], yhi, hi[j]![1]]);
      }
    }
    // the bottom, facing down
    const bottom = rings[rings.length - 1]!;
    const y0 = levels[levels.length - 1]![0];
    const [cx, cz] = [bottom.reduce((s, p) => s + p[0], 0) / bottom.length, 0];
    for (let j = 0; j < bottom.length; j++) {
      const jn = (j + 1) % bottom.length;
      m.tri("skirtG", [cx, y0, cz], [bottom[jn]![0], y0, bottom[jn]![1]], [bottom[j]![0], y0, bottom[j]![1]]);
    }
  });

  m.scope("coupler", () => {
    // the Scharfenberg coupler standing out of the recess: its shaft, the head with the funnel, the red cover over its contacts
    blk("carbon", -0.1, 0.25, 0.82, 0.93, -0.08, 0.08);
    blk("carbon", -0.3, -0.1, 0.72, 1.0, -0.2, 0.2);
    blk("coverRed", -0.3, -0.02, 1.04, 1.18, -0.21, 0.21);
    blk("carbon", -0.2, -0.05, 1.0, 1.04, -0.05, 0.05);
  });

  m.scope("cab door", () => {
    for (const sd of [1, -1]) {
      const z0 = sd * (W + 0.0), z1 = sd * (W + 0.05);
      // the grab rails either side of the cab door, and the steps under it
      for (const d of [CAB_DOOR[0] - 0.08, CAB_DOOR[1] + 0.08]) blk("rail", d - 0.02, d + 0.02, 1.25, 2.65, Math.min(z0, z1), Math.max(z0, z1));
      blk("under", CAB_DOOR[0] + 0.05, CAB_DOOR[1] - 0.05, 0.42, 0.46, Math.min(sd * 1.2, sd * 1.4), Math.max(sd * 1.2, sd * 1.4));
      blk("under", CAB_DOOR[0] + 0.05, CAB_DOOR[1] - 0.05, 0.66, 0.7, Math.min(sd * 1.2, sd * 1.4), Math.max(sd * 1.2, sd * 1.4));
      for (const d of [CAB_DOOR[0] + 0.05, CAB_DOOR[1] - 0.09]) blk("under", d, d + 0.04, 0.42, B, Math.min(sd * 1.2, sd * 1.4), Math.max(sd * 1.2, sd * 1.4));
    }
  });

  m.scope("stripes", () => {
    for (const sd of [1, -1]) {
      // the stripes lean the same way seen from either side: their heads toward the viewer's right
      const lean = sd * k * STRIPES.lean;
      const [y0, y1] = STRIPES.y;
      const quads: Pt[][] = [0, 1, 2].map((i) => {
        const d0 = T(STRIPES.d + i * STRIPES.pitch);
        return [[d0, y0], [d0 + STRIPES.w, y0], [d0 + STRIPES.w + lean, y1], [d0 + lean, y1]];
      });
      sideDecal(m, b, X, sd, "stripe", tris(quads.map((q) => (sd * k > 0 ? q : [q[0]!, q[3]!, q[2]!, q[1]!]))), 0.004);
    }
  });

  m.scope("logo", () => {
    for (const sd of [1, -1]) {
      // under the first window, read from outside: x along the viewer's right
      const [w, h0, d0] = [0.8, 1.2, T(4.2)];
      const quads = NS_LOGO.flatMap((p) => strokes(p, 0.1)).map((q) => q.map(([x, y]): Pt => [d0 + (sd * k > 0 ? x : 1 - x) * w, h0 + y * w]));
      sideDecal(m, b, X, sd, "logo", tris(quads.map((q) => (sd * k > 0 ? q : [q[0]!, q[3]!, q[2]!, q[1]!]))), 0.004);
    }
  });

  m.scope("window frames", () => {
    // each window's aluminium transom under the top light, and the top light's mullion off its middle
    const bars: Pt[][] = WIN.filter(([d0, d1]) => d1 - d0 > 0.8).flatMap(([d0, d1]): Pt[][] => {
      const [a, e] = [T(d0) + 0.04, T(d1) - 0.04];
      const m0 = T(d0 + (d1 - d0) * 0.45);
      return [[[a, 2.56], [e, 2.56], [e, 2.6], [a, 2.6]], [[m0 - 0.02, 2.6], [m0 + 0.02, 2.6], [m0 + 0.02, 2.86], [m0 - 0.02, 2.86]]];
    });
    for (const sd of [1, -1]) sideDecal(m, b, X, sd, "trim", tris(bars.map((q) => (sd * k > 0 ? q : [q[0]!, q[3]!, q[2]!, q[1]!]))), 0.016);
  });

  m.scope("roof grilles", () => {
    // two louvred grilles on each roof edge over the first door
    for (const sd of [1, -1]) for (const [d0, d1] of [[6.2, 7.05], [7.25, 8.1]] as const) {
      const [za, zb] = [sd * (W - 0.24), sd * (W - 0.1)];
      blk("grille", d0, d1, S - 0.02, S + 0.24, Math.min(za, zb), Math.max(za, zb));
    }
  });

  m.scope("underfloor", () => {
    // the resistor and air boxes between the bogies, the battery box and the compressor
    blk("under", 7.0, 10.6, 0.48, B + 0.02, -1.05, 1.05);
    blk("under", 11.2, 14.4, 0.42, B + 0.02, -1.1, 1.1);
    blk("under", 15.0, 17.6, 0.5, B + 0.02, -0.95, 0.95);
  });
}

/** NS yellow with the grey doors, roof and chin, the dark lamp band, the slanted stripes in `stripe`; the corner windows glazed or painted over. */
function planVLivery(title: string, number: string, stripe: string, cornerGlass: boolean): ShinkansenLivery {
  return {
    title, number,
    palette: {
      yellow: c(NS_YELLOW), grey: c("#6a6f73", 0.5), roofG: c("#6c7073", 0.6), skirtG: c("#34373a", 0.75), band: c("#3b3f43", 0.45),
      black: c("#141618", 0.4), trim: c("#b9bcbe", 0.35), stripe: c(stripe), logo: c("#1b1c1e"), carbon: c("#2b2d30", 0.6),
      screen: { color: "#6b7f8c", metallic: 0.35, roughness: 0.08, glass: true }, coverRed: c("#c8202a", 0.45),
      rail: c("#3a3c3f", 0.4), grille: c("#2c2f32", 0.7), cabMask: c("#1d1f22", 0.3),
    },
    bands: [[0, A, "skirtG"], [A, 9, "yellow"]],
    doors: [[0, 9, "grey"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the lamp band across the front and round the corners, its end rounded
      { mat: "band", face: true, front: [[BAND[0], -9], [BAND[1], -9]], back: [[BAND[0], 1.2], [BAND[0] + 0.06, 1.32], [1.5, 1.4], [BAND[1] - 0.06, 1.32], [BAND[1], 1.2]] },
      // the corner window: its rubber, then the glass (or the yellow it was later painted over with)
      { mat: "rubber", face: true, front: CORNER_WIN_FRONT, back: CORNER_WIN_BACK },
      { mat: cornerGlass ? "cabGlass" : "yellow", face: true, front: CORNER_GLASS_FRONT, back: CORNER_GLASS_BACK },
    ],
  };
}

export const PLAN_V: ShinkansenSeries = {
  // 52.1 m over the couplers for the two cars (nl.wikipedia "Mat '64"); 2.9 m wide; the floor 1.23 m up
  endLength: 26.05, midLength: 26.05, W, Y: 1.2, S, C, lean: 0.975, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: PLAN_V_FACE,
  // windows 1.95 - 2.9 m; swing-plug doors 1.3 m wide, a narrow window in each leaf
  windows: [[1.95, 2.9]], windowW: 1.15, pitch: 1.6, door: [A + 0.03, 3.02, 1.95, 2.85], doorW: 1.3, doorGlassW: 0.2, doorGlassPair: 0.62,
  layout: {
    end: {
      doors: DOORS.map(([d0, d1]) => [T0(d0), T0(d1), d0 < 13 ? 1 : -1] as const),
      windows: WIN.map(([d0, d1]) => [T0(d0), T0(d1)] as const),
    },
    middle: { doors: [], windows: [] },
  },
  // the cab door's narrow window
  cabWindows: [[T0(CAB_DOOR[0] + 0.17), T0(CAB_DOOR[1] - 0.17), 2.15, 2.8]],
  sidePanels: { end: [{ d: CAB_DOOR, y: [A + 0.05, 3.05], kind: "seam" }] },
  // 2'Bo' + Bo'2': the trailer bogie under the cab door, the motor bogie 3.75 m from the inner end; 1.0 m wheels
  bogieCentres: 17.8, endBogies: [T0(4.2), T0(22.0)], wheelR: 0.5, wheelbase: 2.6,
  // one single-arm pantograph over the leading car's motor bogie
  endPantograph: "lead", pantographAt: T0(23.0),
  fittings: planVFittings,
  // the chin under the nose in the distant model
  lodRoof: { d: [0.35, 2.2], hw: 1.15, y: [0.3, B + 0.01], mat: "skirtG" },
  cars: [2],
  liveries: { yellowGrey: planVLivery("NS yellow, grey", "448", "#2c74c2", true), yellowBlue: planVLivery("NS yellow, blue", "454", "#5ab3e4", false) },
  weight: { end: 52, middle: 52 }, power: 310, maxspeed: 140,
};

/** d behind the tip to d behind the body's front end. */
function T0(d: number): number { return d - JOIN; }
