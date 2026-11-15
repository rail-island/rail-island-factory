// The CRH3C (Siemens Velaro CN, built with CNR Tangshan), drawn on the series kit (shinkansen.ts)
// with the Velaro cab face measured for the ICE 3 (deIce3.ts `ICE3_FACE`): the same snout and
// canopy, the CRH face's own paint (the grey lip under the glass holding the upper lamp, the
// lamp clusters with their slats on the inner half) and the CRH livery's thin blue band, which
// runs under the windows and dives down the nose to a point, a thin line rising back from it.
// Matched to the photographs in assets/cr-crh3c/ (SOURCES.md). The shared `velaro()` body
// (seriesHelpers.ts) is left as the AVE S-103 has it. See docs/models/china-units.md.
//
// Heights over the rail, d behind the snout's tip (the coupler cover's front, 1.24 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { block } from "./vehicleParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { ICE3_FACE } from "./deIce3.ts";

const CRH_WHITE = "#eff1f0";
/** The band's royal blue, sampled in sunlight (photo-crh3c-hexie-emu.jpg). */
const CRH_BLUE = "#1048a8";

/** Where the face meets the body (the ICE 3's). */
const JOIN = ICE3_FACE.dJoin;

/** The blue band along every car: 7 cm, 8.5 cm under the windows' foot (2.02 m). */
const BAND: readonly [number, number] = [1.865, 1.935];

/**
 * The band's point on the nose's flank (just behind the coupler cover, under the lamp clusters) and
 * the line rising back from it to just ahead of the lounge window's foot: a chevron opening backward.
 */
const TIP: Pt = [1.48, 1.35];
const INNER: Pt = [1.56, 1.45];
const STROKE_TOP: Pt = [2.26, 2.42];

/** The canopy's outline ([y, d] edges on the nose's sides): the ICE 3's glass, its grey lip below from 2.17 m. */
const GLASS_BACK: Pt[] = [[2.47, 1.2], [2.55, 1.6], [2.75, 2.3], [3.0, 2.85], [3.25, 3.15], [3.45, 3.3], [3.6, 3.45], [3.65, 3.5]];
const LIP_BACK: Pt[] = [[2.17, 0.6], [2.3, 0.85], [2.49, 1.25]];
const RIM_BACK: Pt[] = [[2.14, 0.64], [2.3, 0.92], ...GLASS_BACK.slice(0, -1).map(([y, d]): Pt => [y, d + 0.06]), [3.68, 3.56]];
/** Where the lounge's window band starts: its front edge raked further than the ICE 3's (photo-crh3-in-changsha.jpg). */
const LOUNGE_FRONT: Pt[] = [[2.02, 2.6], [2.3, 2.92], [2.55, 3.3], [2.73, 3.65]];

/** One lamp cluster (viewer's right, mirrored): a lens leaning out at its top, the lamps on its outer half, slats on its inner half. */
const CLUSTER: Pt[] = [[0.13, 1.55], [0.88, 1.55], [0.99, 1.98], [0.27, 1.98]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const SLATS = [1.61, 1.67, 1.73, 1.79, 1.85, 1.91].map((y): Pt[] => {
  const inner = (yy: number) => 0.13 + ((yy - 1.55) / 0.43) * 0.14 + 0.04;
  return [[inner(y), y], [0.52, y], [0.52, y + 0.026], [inner(y + 0.026), y + 0.026]];
});

/** The coupler cover's seam: a thin dark line over its top and down its flanks (viewer's right half, mirrored). */
const COVER: Pt[] = [[0.86, 0.86], [0.88, 1.1], [0.84, 1.3], [0.72, 1.46], [0.5, 1.55], [0.2, 1.575], [0, 1.58]];
/** A polyline as thin quads, each counter-clockwise seen head-on. */
const seam = (pts: readonly Pt[], t: number): Pt[][] => pts.slice(1).map((b, i): Pt[] => {
  const a = pts[i]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * t, ny = ((b[0] - a[0]) / len) * t;
  const q: Pt[] = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area < 0 ? q.reverse() : q;
});

/**
 * The face's black "Hexie hao" (the three characters he, xie, hao), simplified strokes in a unit cell
 * (x right, y up): he over the left cluster, xie between them, hao over the right one (seen head-on),
 * just under the canopy's lip.
 */
const HEXIE: ReadonlyArray<ReadonlyArray<readonly Pt[]>> = [
  [[[0.38, 0.97], [0.08, 0.88]], [[0.04, 0.7], [0.46, 0.7]], [[0.25, 0.9], [0.25, 0.0]], [[0.24, 0.62], [0.04, 0.28]], [[0.27, 0.6], [0.44, 0.42]],
    [[0.56, 0.22], [0.56, 0.76], [0.94, 0.76], [0.94, 0.22], [0.56, 0.22]]],
  [[[0.06, 0.94], [0.16, 0.84]], [[0.02, 0.62], [0.15, 0.62], [0.15, 0.08], [0.26, 0.2]],
    [[0.4, 0.98], [0.4, 0.56], [0.6, 0.62]], [[0.4, 0.78], [0.56, 0.8]], [[0.72, 0.98], [0.72, 0.6], [0.97, 0.58]], [[0.88, 0.88], [0.74, 0.8]],
    [[0.42, 0.0], [0.42, 0.44], [0.9, 0.44], [0.9, 0.0], [0.42, 0.0]], [[0.42, 0.22], [0.9, 0.22]], [[0.68, 0.52], [0.62, 0.45]]],
  [[[0.26, 0.6], [0.26, 0.96], [0.74, 0.96], [0.74, 0.6], [0.26, 0.6]], [[0.04, 0.48], [0.96, 0.48]],
    [[0.36, 0.48], [0.28, 0.28], [0.86, 0.28], [0.8, 0.02], [0.58, 0.06]]],
];
const HEXIE_AT: readonly number[] = [-0.66, 0, 0.66];
const HEXIE_Y = 2.0, HEXIE_H = 0.16;

const ROWS =[...new Set([...ICE3_FACE.rows, TIP[0], INNER[0], 1.55, 1.98, BAND[0], BAND[1], 2.14, 2.17, 2.47, STROKE_TOP[0]])].sort((a, b) => a - b);

export const CRH3C_FACE: SeriesCabFace = {
  ...ICE3_FACE,
  rows: ROWS,
  lodBands: [[0, 9, "white"]],
  paint: [
    // the canopy: a dark rim, the light grey lip holding the upper lamp, the tinted glass over it
    { mat: "cabMask", front: [[2.14, -9], [3.68, -9]], back: RIM_BACK, top: 3.68, lat: 1.3 },
    { mat: "lip", front: [[2.17, -9], [2.49, -9]], back: LIP_BACK, top: 2.49, lat: 1.26 },
    { mat: "cabGlass", front: [[2.47, -9], [3.65, -9]], back: GLASS_BACK, top: 3.65, lat: 1.26 },
    // the light grey plough under the white coupler cover
    { mat: "skirtG", front: [[0.64, -9], [0.86, -9]], back: [[0.64, 1.3], [0.86, 0.9]] },
  ],
  fields: [
    { mat: "lens", pts: CLUSTER },
    { mat: "lens", pts: mirror(CLUSTER) },
  ],
  decals: [
    ...SLATS.flatMap((pts) => [{ mat: "cabMask", pts, fine: 1 }, { mat: "cabMask", pts: mirror(pts), fine: 1 }]),
    ...seam(COVER, 0.008).flatMap((pts) => [{ mat: "seam", pts, fine: 2 }, { mat: "seam", pts: mirror(pts), fine: 2 }]),
    ...HEXIE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [HEXIE_AT[i]! + (x - 0.5) * HEXIE_H, HEXIE_Y + y * HEXIE_H]), 0.0075)))
      .map((pts) => ({ mat: "cabMask", pts, fine: 1 })),
  ],
  texts: [],
  lamps: [
    [0, 2.3, 0.075, "lampHead"],
    [0.76, 1.88, 0.1, "lampHead"], [0.7, 1.68, 0.08, "lampRed"],
    [-0.76, 1.88, 0.1, "lampHead"], [-0.7, 1.68, 0.08, "lampRed"],
  ],
};

/** The CRH livery: white, the thin blue band under the windows on every car, diving down the nose to its point. */
const CRH_LIVERY: ShinkansenLivery = {
  title: "CRH blue", number: "CRH3-037C",
  palette: {
    white: c(CRH_WHITE), blue: c(CRH_BLUE), navy: c("#1b2547"), lip: c("#b9bec2", 0.35), lens: c("#bfc6ca", 0.2), seam: c("#8d9396", 0.5),
    roofG: c("#dcdfe0", 0.55), skirtG: c("#d6d9da", 0.6), cabMask: c("#1d1f22", 0.3),
  },
  bands: [[0, BAND[0], "white"], [BAND[0], BAND[1], "blue"], [BAND[1], 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the band falling from the body's level at the join to its point, 7 cm thick
    { mat: "blue", front: [TIP, INNER, [BAND[1], JOIN + 0.05]], back: [TIP, [BAND[0], JOIN + 0.05], [BAND[1], JOIN + 0.1]], face: true },
    // the thin line rising back from the point, tapering
    { mat: "blue", front: [INNER, STROKE_TOP], back: [[INNER[0], INNER[1] + 0.1], [STROKE_TOP[0], STROKE_TOP[1] + 0.03]], face: true },
    // the VIP lounge's window band behind the cab's glass partition, its front raked, black frames between the panes
    { mat: "cabGlass", front: LOUNGE_FRONT, back: [[2.02, 8.15], [2.73, 8.15]], face: true },
    { mat: "white", front: [[2.5, -9], [2.74, -9]], back: [[2.5, 3.05], [2.74, 4.4]], face: true },
    { mat: "rubber", front: [[2.02, 5.05], [2.73, 5.05]], back: [[2.02, 5.13], [2.73, 5.13]] },
    { mat: "rubber", front: [[2.02, 6.6], [2.73, 6.6]], back: [[2.02, 6.68], [2.73, 6.68]] },
  ],
  endLettering: [{ text: "CRH", d: 25.675 - 0.25 - JOIN - 0.07 - 0.8, y: 2.12, h: 0.42, mat: "navy" }],
};

/** Panes of a window band from d0 to d1, about `pitch` apart, black 8 cm pillars between them. */
const paneRow = (d0: number, d1: number, pitch: number): Array<readonly [number, number]> => {
  const n = Math.max(1, Math.round((d1 - d0) / pitch)), w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w + (i ? 0.04 : 0), d0 + (i + 1) * w - (i < n - 1 ? 0.04 : 0)] as const);
};

/** The end car's body behind the join: 25.675 m over the couplers less the face, the tip's reach and half the gap. */
const END_BODY = 25.675 - 0.25 - JOIN - 0.07;
const MID_BODY = 24.775 - 0.5;

/** A low roof unit: a frustum from a rounded rectangle sunk in the roof to a smaller one at its top. */
function roofUnit(m: MeshBuilder, x0: number, x1: number, y: number, hw: number, h: number, mat: string): void {
  const ring = (len: number, w: number): Ring => {
    const r = Math.min(w * 0.6, len / 2 - 0.01), x = (x0 + x1) / 2, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[len / 2 - r, -(w - r), -90], [len / 2 - r, w - r, 0], [-(len / 2 - r), w - r, 90], [-(len / 2 - r), -(w - r), 180]] as const)
      for (let j = 0; j <= 3; j++) { const a = ((a0 + (90 * j) / 3) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return out.reverse() as Ring;
  };
  const len = Math.abs(x1 - x0);
  m.loft(mat, ring(len, hw), y - 0.08, ring(len - 0.3, hw - 0.12), y + h);
}

/** The CRH3C's fittings: the two air-conditioning units on the rear half of the end car's roof, the plain underfloor box on every car. */
function crh3cFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("roof units", () => {
    for (const [d0, d1] of [[11.8 - JOIN, 16.6 - JOIN], [17.8 - JOIN, 23.4 - JOIN]] as const) roofUnit(m, X(d1), X(d0), CRH3C.C, 0.78, 0.2, "roofG");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), CRH3C.B - 0.35, CRH3C.B, -CRH3C.W * 0.8, CRH3C.W * 0.8));
}

export const CRH3C: ShinkansenSeries = {
  // 3.265 m wide in China, drawn at the UIC gauge's 3.1 m; 3.89 m high
  endLength: 25.675, midLength: 24.775, W: 1.53, Y: 1.4, S: 3.15, C: 3.89, lean: 0.95, B: 0.62, A: 1.0,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH3C_FACE,
  endCrown: [[0, 3.84], [1.0, 3.88], [1.5, 3.89]],
  // the window band 2.02 - 2.73 m (black-framed panes, thin pillars); single plug doors with an oval window
  windows: [[2.02, 2.73]], windowW: 1.9, pitch: 2.0, door: [1.2, 3.22, 2.02, 2.86], doorW: 0.97, doorGlassW: 0.5,
  layout: {
    // the end car: the VIP lounge (painted on the nose), its door 8.45 m behind the tip, the saloon's windows to the CRH mark
    end: { doors: [[8.45 - JOIN, 9.42 - JOIN, 1]], windows: paneRow(10.0 - JOIN, END_BODY - 1.5, 2.0) },
    // the intermediate cars: a door a side at each end (the photographs' second and third cars), the windows between
    middle: { doors: [[0.6, 1.57, -1], [MID_BODY - 1.57, MID_BODY - 0.6, 1]], windows: paneRow(2.2, MID_BODY - 2.2, 2.0) },
  },
  endBogies: [5.0 - JOIN, 5.0 - JOIN + 17.375],
  bogieCentres: 17.375, wheelR: 0.46, wheelbase: 2.5,
  // the single-arm pantographs on the transformer cars, the second and the next-to-last, on a low fairing
  pantographsBesideEnds: true, pantographAt: 9.0,
  pantographCover: { len: 7.0, hw: 0.85, top: [6.2, 0.62], h: 0.2, mat: "roofG" },
  fittings: crh3cFittings,
  liveries: { crh: CRH_LIVERY },
  weight: { end: 55, middle: 50 }, power: 1100, maxspeed: 350,
};
