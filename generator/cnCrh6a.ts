// The CRH6A (CRRC Qingdao Sifang's "Cinova" intercity unit, 200 km/h), drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): the short, blunt intercity nose - a big
// rounded lower nose (the coupler cover, its seam a thin dark line) under a strip of six headlamps,
// the dark canopy round the windscreen rising back to the crown 4.5 m behind the tip, the slanted
// cab side window - and the Pearl River Delta livery of the first sets: white, a black window band
// from just behind the cab door, a thin orange line over it that dives down the nose's flank, a grey
// skirt. Wide plug doors, two a side on every car. Matched to the photographs in assets/cr-crh6a/
// (SOURCES.md). See docs/models/china-units.md, "The CRH6A's body".
//
// Heights over the rail, d behind the nose's tip (the coupler cover's front, 1.15 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

const WHITE = "#f0f1ee";
/** The thin line over the window band, sampled in sunlight (photo-crh6a-0407-...jpg). */
const ORANGE = "#e2701e";

/** Where the face meets the body: the crown at its full 3.86 m, just ahead of the cab door. */
const JOIN = 4.9;
/** The body's bottom (the grey skirt's foot) and the skirt's top. */
const B = 0.45;
const A = 1.1;
/** The crown over the rail (3,860 mm). */
const C = 3.86;

/** The black window band along the cars and the orange line over it. */
const BAND: readonly [number, number] = [1.96, 2.92];
const LINE: readonly [number, number] = [3.0, 3.07];

/**
 * The nose's centre line: the plough under the big rounded lower nose (the coupler cover), its front
 * 1.15 m up, its top 1.97 m up 0.42 m back; the lamp strip above it, the windscreen from 2.6 m leaning
 * back to its head about 3.55 m up 2.2 m back, the canopy rounding over to the crown 4.5 m behind the
 * tip (photo-crh6a-0427-train-...jpg, a projective fit along the train; photo-crh6a-0407-...jpg head-on).
 */
const PROFILE: Pt[] = [
  [B, 0.85], [0.55, 0.55], [0.7, 0.28], [0.85, 0.12], [1.0, 0.03], [1.15, 0.0], [1.3, 0.01], [1.5, 0.07], [1.7, 0.19], [1.85, 0.32], [1.97, 0.48],
  [2.05, 0.66], [2.2, 0.74], [2.4, 0.85], [2.6, 1.0], [2.84, 1.25], [3.1, 1.58], [3.3, 1.85], [3.44, 2.06], [3.6, 2.4], [3.72, 2.9], [3.8, 3.4], [3.84, 3.9], [3.855, 4.4], [C, JOIN],
];

/** The plan's corner depth by height: the rounded lower nose reaches the body's full width 2.1 m back, the canopy further back, the crown at the join. */
const DEPTH = (y: number, d: number) => Math.max(0.05, Math.min(JOIN - d, y < 2.0 ? 3.0 : 3.0 + (y - 2.0) * 1.0));

/** The canopy's lower edge on the nose's sides ([y, d]): from the lamp strip's ends a straight line rising back to the crown 4.6 m behind the tip. */
const CANOPY: Pt[] = [[2.03, 1.25], [2.3, 1.6], [2.6, 2.0], [3.0, 2.6], [3.4, 3.25], [3.7, 4.05], [3.86, 4.6]];

/** The cab side window: a parallelogram leaning forward, its foot 2.5 m up from 3.05 to 4.45 m behind the tip, its head 3.22 m up. */
const CAB_WIN_FRONT: Pt[] = [[2.5, 3.05], [3.22, 3.9]];
const CAB_WIN_BACK: Pt[] = [[2.5, 4.45], [3.22, 4.45]];

/** The orange line's dive: from the line over the band, over the cab door, down the nose's flank behind the cab window to its point 1.85 m up, 2.6 m back. */
const DIVE_FRONT: Pt[] = [[1.85, 2.6], [2.4, 3.48], [2.75, 4.15], [2.95, 4.75], [LINE[1], 5.4]];
const DIVE_BACK: Pt[] = [[1.85, 2.6], [2.4, 3.62], [2.75, 4.3], [2.95, 4.98], [LINE[0], 5.35], [LINE[1], 6.2]];

/** The black band's front, just behind the cab door, leaning forward at its top. */
const BAND_FRONT: Pt[] = [[BAND[0], 6.22], [BAND[1], 5.15]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.62, 0.78, 0.93, 1.07, 1.22, 1.38, 1.6, 2.0, 2.1, 2.3, 2.5, 2.7, 2.95, 3.22, 3.4, 3.52, 3.66])].sort((a, b) => a - b);

/** The coupler cover's seam (viewer's right half, mirrored): its flat top 2.0 m up, the sides down to 0.8 m, closing under the nose at 0.5 m. */
const COVER: Pt[] = [[0, 1.99], [0.45, 1.98], [0.76, 1.92], [0.95, 1.75], [1.04, 1.48], [1.06, 1.15], [1.01, 0.88], [0.86, 0.66], [0.62, 0.53], [0.32, 0.49], [0, 0.48]];
/** A polyline as thin quads, each counter-clockwise seen head-on. */
const seam = (pts: readonly Pt[], t: number): Pt[][] => pts.slice(1).map((b, i): Pt[] => {
  const a = pts[i]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * t, ny = ((b[0] - a[0]) / len) * t;
  const q: Pt[] = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area < 0 ? q.reverse() : q;
});
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** The lamp strip: a dark rounded band across the face under the windscreen. */
const STRIP: Pt[] = [[-0.92, 2.07], [0.92, 2.07], [0.99, 2.16], [0.97, 2.31], [0.9, 2.38], [-0.9, 2.38], [-0.97, 2.31], [-0.99, 2.16]];
/** The windscreen proper: a lighter pane in the canopy, wider at its foot. */
const SCREEN: Pt[] = [[-0.86, 2.62], [0.86, 2.62], [0.95, 2.72], [0.94, 3.35], [0.86, 3.62], [0.66, 3.72], [-0.66, 3.72], [-0.86, 3.62], [-0.94, 3.35], [-0.95, 2.72]];

export const CRH6A_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 5.4, roofFrom: 9, cols: [1, 12, 1, 1], tolerance: 0.035, wrap: true,
  profile: PROFILE,
  // a round nose: the corner is the whole half width, elliptic, reaching full width 2.1 m behind the
  // centre line low down, further back over the canopy, at the join at the crown
  corner: [[B, 2.0], [C, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, DEPTH(y, d)]),
  rows: ROWS,
  // the face is white; its paint (the canopy, the lamp strip, the seam, the cab window) is drawn below
  bands: (l) => [[0, 9, l.bands[l.bands.length - 1]![2]]],
  lodBands: [[0, 0.62, "skirtG"], [0.62, 9, "white"]],
  lod: { profile: PROFILE, corner: [[B, 2.0], [C, 2.0]], rows: [B, 0.7, 1.15, 1.6, 1.97, 2.4, 2.84, 3.3, 3.6, 3.8, C], cornerDepth: [[B, 3.0], [2.0, 3.0], [2.84, 3.3], [3.3, 2.9], [3.6, 2.5], [3.8, 1.5], [C, 0.05]] },
  lodGlass: { hw: 1.0, y: [2.05, 3.6] },
  paint: [
    // the grey skirt carried forward under the nose, falling to the plough
    { mat: "skirtG", front: [[B, -9], [0.62, -9]], back: [[B, JOIN + 1], [0.62, JOIN + 1]] },
    { mat: "skirtG", front: [[0.62, 1.6], [A, 3.6]], back: [[0.62, JOIN + 1], [A, JOIN + 1]] },
    // the canopy: dark from the lamp strip over the windscreen to the crown
    { mat: "cabMask", front: [[2.03, -9], [4.0, -9]], back: CANOPY, top: 4.0 },
    // the cab side window
    { mat: "cabGlass", front: CAB_WIN_FRONT, back: CAB_WIN_BACK },
  ],
  fields: [
    { mat: "strip", pts: STRIP },
    { mat: "screen", pts: SCREEN },
  ],
  decals: [
    ...seam(COVER, 0.008).flatMap((pts) => [{ mat: "seam", pts, fine: 2 }, { mat: "seam", pts: mirror(pts), fine: 2 }]),
    // the red tail lamps: a thin line along the strip's foot
    { mat: "lampRed", pts: [[0.2, 2.09], [0.86, 2.09], [0.86, 2.12], [0.2, 2.12]], fine: 1 },
    { mat: "lampRed", pts: [[-0.86, 2.09], [-0.2, 2.09], [-0.2, 2.12], [-0.86, 2.12]], fine: 1 },
  ],
  wipers: [[[0.12, 2.68], [0.2, 3.45]]],
  panes: [],
  // six headlamps in a row across the strip
  lamps: [0.15, 0.45, 0.75].flatMap((l): Array<readonly [number, number, number, string]> => [[l, 2.23, 0.07, "lampHead"], [-l, 2.23, 0.07, "lampHead"]]),
};

/** The Pearl River Delta livery (CRH6A-0407): white, the black window band, the orange line over it diving down the nose, a grey skirt. */
function crhLivery(): ShinkansenLivery {
  const bands: Array<readonly [number, number, string]> = [[0, BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], LINE[0], "white"], [LINE[0], LINE[1], "orange"], [LINE[1], 9, "white"]];
  return {
    title: "CRH orange line", number: "CRH6A-0407",
    palette: {
      white: c(WHITE), band: c("#16181b", 0.25), orange: c(ORANGE), roofG: c("#c9cdd0", 0.55), skirtG: c("#a3a8ac", 0.45), cabMask: c("#131518", 0.25),
      seam: c("#3a3d41", 0.5), strip: c("#24272b", 0.3), screen: { color: "#3b4a57", metallic: 0.25, roughness: 0.08, glass: true },
      lampRed: c("#c4202a", 0.3), fairing: c("#d9dcde", 0.5),
    },
    bands,
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the band starts just behind the cab door: white ahead of its slanted front
      { mat: "white", front: [[BAND[0], -9], [BAND[1], -9]], back: BAND_FRONT },
      // the orange line's dive down the nose's flank
      { mat: "orange", front: DIVE_FRONT, back: DIVE_BACK, face: true },
    ],
    endLettering: [{ text: "CRH", d: 6.75 - JOIN, y: 2.27, h: 0.32, mat: "white" }],
  };
}

/** The windows of a run: `n` panes `w` wide from d0, `pitch` apart. */
const run = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);

/** The intermediate car's body: 25.0 m over the couplers less the gaps. */
const MID_BODY = 25.0 - 0.5;

/** A low roof fairing: a frustum from a rounded rectangle sunk in the roof to a smaller one at its top. */
function fairing(m: MeshBuilder, x0: number, x1: number, y: number, hw: number, h: number, mat: string): void {
  const ring = (len: number, w: number): Ring => {
    const r = Math.min(w * 0.6, len / 2 - 0.01), x = (x0 + x1) / 2, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[len / 2 - r, -(w - r), -90], [len / 2 - r, w - r, 0], [-(len / 2 - r), w - r, 90], [-(len / 2 - r), -(w - r), 180]] as const)
      for (let j = 0; j <= 3; j++) { const a = ((a0 + (90 * j) / 3) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return out.reverse() as Ring;
  };
  const len = Math.abs(x1 - x0);
  m.loft(mat, ring(len, hw), y - 0.12, ring(len - 0.5, hw - 0.15), y + h);
}

/** The CRH6A's fittings: the long equipment fairing on every car's roof (clear of the pantograph), the underfloor box. */
function crh6aFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("roof fairing", () => {
    const [d0, d1] = car.end ? [5.5 - JOIN, 19.0 - JOIN] : [4.0, 16.0];
    fairing(m, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C, 1.0, 0.15, "fairing");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), B - 0.12, B + 0.02, -1.62 * 0.82, 1.62 * 0.82));
}

export const CRH6A: ShinkansenSeries = {
  // 3.3 m wide, drawn 3.24 m so that its door frames stay inside the Shinkansen gauge; 3.86 m high
  endLength: 25.7, midLength: 25.0, W: 1.62, Y: 1.6, S: 3.42, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH6A_FACE,
  // the windows in the black band; wide single plug doors whose window lies in the band
  windows: [[2.02, 2.86]], windowW: 1.35, pitch: 1.85, door: [1.25, 3.3, 2.0, 3.18], doorW: 1.3, doorGlassW: 0.8,
  layout: {
    // the end car: the CRH mark behind the cab door, a narrow pane, two windows, a door, three windows, a door near the rear, one window
    end: { doors: [[13.35 - JOIN, 14.65 - JOIN, -1], [20.8 - JOIN, 22.1 - JOIN, 1]], windows: [[8.75 - JOIN, 9.5 - JOIN], ...run(9.95 - JOIN, 2, 1.3, 1.7), ...run(15.15 - JOIN, 3, 1.35, 1.85), [22.6 - JOIN, 23.9 - JOIN]] },
    // the intermediate cars: a door 4.2 m in from each end (over the bogies), eight windows between, a short one at each end
    middle: { doors: [[3.55, 4.85, -1], [MID_BODY - 4.85, MID_BODY - 3.55, 1]], windows: [[1.9, 3.05], ...run(5.25, 8, 1.35, 1.85), [MID_BODY - 3.05, MID_BODY - 1.9]] },
  },
  sidePanels: {
    // the cab door just behind the face, a narrow window in its top
    end: [{ d: [5.42, 6.2], y: [1.2, 3.35], kind: "seam" }, { d: [5.62, 6.0], y: [2.4, 3.18], kind: "window" }],
  },
  // the leading bogie 6.0 m behind the tip, the rear one 3 m from the end car's inner end; 17.5 m on the intermediate cars
  endBogies: [6.0 - JOIN, 22.4 - JOIN], midBogies: [3.5, MID_BODY - 3.5],
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5, cars: [4, 8],
  numberAt: [-7.24, 1.3, 0.12],
  liveries: { crh: crhLivery() },
  fittings: crh6aFittings,
  // 5,520 kW from four motor cars of eight, given as each car's share
  weight: { end: 52, middle: 48 }, power: 690, maxspeed: 200,
};
