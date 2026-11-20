// The AVE S-103 (Siemens Velaro E, Renfe class 103), drawn on the series kit (shinkansen.ts) with
// the Velaro cab face measured for the ICE 3 (deIce3.ts `ICE3_FACE`): the same snout and canopy, the
// Velaro E's own paint - the silver-grey lip under the glass holding the upper lamp, the slanted
// lamp clusters with their slats on the inner half, the purple "renfe" between them - and the AVE
// livery: white, a purple band with a thin grey line over it along every car, both diving down the
// nose and across its front over the coupler cover. The end car's raked window behind the canopy,
// its door, the one long window band and the blank rear section with the "renfe AVE" mark; the
// intermediate cars' door at the front end, a blank vestibule and the window band of wide and narrow
// panes. Matched to the photographs in assets/renfe-s103/ (SOURCES.md). See docs/models/spain-trains.md.
//
// Scales (assets/renfe-s103/): photo-renfe-class-103-vinaixa.jpg, about 24 px/m on the leading car's
// side (a projective fit over the nose tip and the first three car joints; heights at about 193 px/m
// in a 6x crop); photo-renfe-ave-s103-siemens-velaro-e-5374360458.jpg, side-on, about 24 px/m over
// the end car (tip to joint 25.8 m); photo-s3274-bf-madrid-atocha-103-xxx.jpg, the door (1.2 - 3.22 m)
// as scale, about 312 px/m in a 3x crop; photo-velaro-e-car.jpg, about 210 px/m at the end car's rear.
//
// Heights over the rail, d behind the snout's tip (the coupler cover's front, 1.24 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { strokeText } from "./strokeFont.ts";
import { block } from "./vehicleParts.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { ICE3_FACE } from "./deIce3.ts";

/** The AVE colours, sampled in the photographs: the white, the magenta purple of the band and the logo, the grey line. */
const AVE_WHITE = "#eeeeea";
const AVE_PURPLE = "#86205a";
const AVE_GREY = "#676a6c";

/** Where the face meets the body (the ICE 3's). */
const JOIN = ICE3_FACE.dJoin;

/** Lengths over the couplers: 200.32 m for eight cars, the intermediate cars the ICE 3's. */
const END_LENGTH = 25.835;
const MID_LENGTH = 24.775;
/** The end car's body behind the join (d from the join), an intermediate car's body. */
const END_BODY = END_LENGTH - 0.25 - JOIN - 0.07;
const MID_BODY = MID_LENGTH - 0.5;

/** The purple band along every car and the thin grey line over it (photo-velaro-e-car.jpg, photo-s3274-...). */
const PURPLE: readonly [number, number] = [1.36, 1.6];
const LINE: readonly [number, number] = [1.65, 1.7];

/**
 * The band on the nose: across the coupler cover's lower half at the tip (1.02 - 1.2 m) and rising
 * along the flanks to the body's level 6.8 m back, a little thicker as it rises; the grey line
 * follows 4 - 5 cm over it (photo-renfe-clase-103.jpg, photo-s3274-...).
 */
const BAND_D = [0, 1, 2, 3, 4, 5, 6, 6.8];
const BAND_FOOT = [1.02, 1.04, 1.08, 1.13, 1.19, 1.26, 1.32, PURPLE[0]];
const BAND_TOP = [1.2, 1.23, 1.28, 1.34, 1.41, 1.49, 1.56, PURPLE[1]];
const LINE_FOOT = BAND_TOP.map((y, i) => y + 0.04 + (0.01 * BAND_D[i]!) / 6.8);
const LINE_TOP = LINE_FOOT.map((y, i) => y + 0.04 + (0.01 * BAND_D[i]!) / 6.8);

/** A band between two edges (y by d) as a sweep: across the front from the tip, joining the body's band at the join. */
function noseBand(mat: string, foot: readonly number[], top: readonly number[]): { mat: string; front: Pt[]; back: Pt[]; face: boolean } {
  const n = BAND_D.length - 1;
  return {
    mat, face: true,
    front: [[foot[0]!, -9], ...BAND_D.map((d, i): Pt => [top[i]!, d])],
    back: [...BAND_D.map((d, i): Pt => [foot[i]!, d]), [foot[n]! + 1e-4, JOIN + 0.05], [top[n]!, JOIN + 0.05]],
  };
}

/**
 * The raked window behind the canopy: its sill level at 2.02 m, its front rounded, 3.5 m behind the tip
 * low down (just behind the canopy's foot), its head falling to it from the full 2.73 m 5.6 m back (photo-renfe-class-
 * 103-vinaixa.jpg, a 6x crop); three panes, the door just behind it.
 */
const RAKED_FRONT: Pt[] = [[2.02, 3.85], [2.1, 3.6], [2.25, 3.52], [2.45, 3.72], [2.6, 4.25], [2.7, 4.95], [2.73, 5.5]];
const RAKED_BACK = 8.15;

/** The canopy's outline ([y, d] edges on the nose's sides): the ICE 3's glass, the Velaro E's taller silver lip below it from 2.06 m. */
const GLASS_BACK: Pt[] = [[2.47, 1.2], [2.55, 1.6], [2.75, 2.3], [3.0, 2.85], [3.25, 3.15], [3.45, 3.3], [3.6, 3.45], [3.65, 3.5]];
/** The lip: under the glass down to the upper lamp, and a silver surround 10 - 15 cm wide up the canopy's sides (photo-estacion-de-zaragoza-...). */
const LIP_BACK: Pt[] = [[2.06, 0.5], [2.2, 0.8], [2.35, 1.15], [2.5, 1.75], [2.75, 3.0], [3.0, 3.55], [3.25, 3.85], [3.4, 3.95]];
const RIM_BACK: Pt[] = GLASS_BACK.map(([y, d]): Pt => [y, d + 0.05]);

/** One lamp cluster (viewer's right, mirrored): a lens leaning out at its top, the lamps on its outer half, slats on its inner half. */
const CLUSTER: Pt[] = [[0.18, 1.56], [0.86, 1.56], [0.96, 1.94], [0.3, 1.94]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const SLATS = [1.62, 1.68, 1.74, 1.8, 1.86].map((y): Pt[] => {
  const inner = (yy: number) => 0.18 + ((yy - 1.56) / 0.38) * 0.12 + 0.04;
  return [[inner(y), y], [0.54, y], [0.54, y + 0.028], [inner(y + 0.028), y + 0.028]];
});

/** The coupler cover's seam: a thin dark line over its top and down its flanks (viewer's right half, mirrored). */
const COVER: Pt[] = [[0.86, 0.86], [0.88, 1.1], [0.84, 1.3], [0.72, 1.44], [0.5, 1.51], [0.2, 1.53], [0, 1.535]];
/** A polyline as thin quads, each counter-clockwise seen head-on. */
const seam = (pts: readonly Pt[], t: number): Pt[][] => pts.slice(1).map((b, i): Pt[] => {
  const a = pts[i]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * t, ny = ((b[0] - a[0]) / len) * t;
  const q: Pt[] = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area < 0 ? q.reverse() : q;
});

/**
 * Renfe's lowercase "renfe", strokes in unit cells (x right, the x-height 0.65, the f's ascender to 1
 * and its tail below the line), the cells `RENFE_ADV` apart.
 */
const RENFE: ReadonlyArray<ReadonlyArray<readonly Pt[]>> = [
  [[[0.22, 0], [0.22, 0.65]], [[0.22, 0.42], [0.42, 0.63], [0.72, 0.62]]],
  [[[0.14, 0.34], [0.84, 0.34], [0.82, 0.52], [0.66, 0.65], [0.34, 0.65], [0.16, 0.5], [0.14, 0.18], [0.32, 0.01], [0.78, 0.04]]],
  [[[0.16, 0], [0.16, 0.65]], [[0.16, 0.46], [0.36, 0.64], [0.64, 0.64], [0.82, 0.48], [0.82, 0]]],
  [[[0.82, 0.92], [0.66, 1], [0.48, 0.96], [0.4, 0.82], [0.4, 0.1], [0.32, -0.12], [0.14, -0.18]], [[0.1, 0.62], [0.72, 0.62]]],
  [[[0.14, 0.34], [0.84, 0.34], [0.82, 0.52], [0.66, 0.65], [0.34, 0.65], [0.16, 0.5], [0.14, 0.18], [0.32, 0.01], [0.78, 0.04]]],
];
const RENFE_ADV = 0.86;

/** The logo's strokes as quads [u, v] (u from its left end, v up from its foot), `h` its cell height, `t` its stroke's half width. */
function renfeQuads(h: number, t: number): Pt[][] {
  return RENFE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [(i * RENFE_ADV + x) * h, y * h]), t)));
}
const renfeWidth = (h: number) => (RENFE.length - 1) * RENFE_ADV * h + h;

/** Panes of a window band from d0 to d1: a wide and a narrow pane per seat bay about 2 m long, 4 cm pillars (photo-velaro-e-car.jpg). */
const paneRow = (d0: number, d1: number, pitch: number): Array<readonly [number, number]> => {
  const n = Math.max(1, Math.round((d1 - d0) / pitch)), w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => {
    const s = d0 + i * w, cut = s + w * 0.76;
    return [[s + (i ? 0.02 : 0), cut - 0.02], [cut + 0.02, s + w - (i < n - 1 ? 0.02 : 0)]] as const;
  }).flat();
};

const ROWS = [...new Set([...ICE3_FACE.rows, BAND_FOOT[0]!, BAND_TOP[0]!, LINE_FOOT[0]!, LINE_TOP[0]!, 1.56, 1.94, 2.06, 2.47, 3.15].map((y) => Math.round(y * 1e4) / 1e4))]
  .filter((y) => y >= 0.64 && y <= 3.84).sort((a, b) => a - b);

/** The face's logo: "renfe" in purple between the clusters (the small "AVE" under it is left out). */
const LOGO_H = 0.085, LOGO_Y = 1.74;
const LOGO_L0 = -renfeWidth(LOGO_H) / 2;

export const S103_FACE: SeriesCabFace = {
  ...ICE3_FACE,
  rows: ROWS,
  // the silver-grey roof from the shoulder up, over the canopy
  roofFrom: 3.3,
  lodBands: [[0, BAND_FOOT[0]!, "white"], [BAND_FOOT[0]!, BAND_TOP[0]!, "purple"], [BAND_TOP[0]!, 9, "white"]],
  paint: [
    // the canopy: the silver lip holding the upper lamp and framing the glass, a dark rim, the tinted glass
    { mat: "lip", front: [[2.06, -9], [3.4, -9]], back: LIP_BACK, top: 3.4, lat: 1.42 },
    { mat: "cabMask", front: [[2.43, -9], [3.68, -9]], back: RIM_BACK, top: 3.68, lat: 1.3 },
    { mat: "cabGlass", front: [[2.47, -9], [3.65, -9]], back: GLASS_BACK, top: 3.65, lat: 1.26 },
    // the white plough's grey foot under the coupler cover
    { mat: "skirtG", front: [[0.64, -9], [0.8, -9]], back: [[0.64, 1.3], [0.8, 0.9]] },
  ],
  fields: [
    { mat: "lens", pts: CLUSTER },
    { mat: "lens", pts: mirror(CLUSTER) },
  ],
  decals: [
    ...SLATS.flatMap((pts) => [{ mat: "cabMask", pts, fine: 1 }, { mat: "cabMask", pts: mirror(pts), fine: 1 }]),
    ...seam(COVER, 0.008).flatMap((pts) => [{ mat: "seam", pts, fine: 2 }, { mat: "seam", pts: mirror(pts), fine: 2 }]),
    ...renfeQuads(LOGO_H, 0.008).map((q) => ({ mat: "purple", pts: q.map(([u, v]): Pt => [LOGO_L0 + u, LOGO_Y + v]), fine: 1 })),
  ],
  texts: [],
  tolerance: 0.05,
  lamps: [
    [0, 2.22, 0.075, "lampHead"],
    [0.78, 1.84, 0.09, "lampHead"], [0.72, 1.66, 0.075, "lampRed"],
    [-0.78, 1.84, 0.09, "lampHead"], [-0.72, 1.66, 0.075, "lampRed"],
  ],
};

/** The AVE livery of the S-103: white, the purple band and the grey line over it on every car, diving down the nose to cross its front. */
const AVE_LIVERY: ShinkansenLivery = {
  title: "AVE", number: "103 019",
  palette: {
    white: c(AVE_WHITE), purple: c(AVE_PURPLE), line: c(AVE_GREY), slate: c("#3f5568"),
    lip: c("#a9b3b9", 0.3), lens: c("#a3acb1", 0.2), seam: c("#9a9fa2", 0.5),
    roofG: c("#b4babe", 0.5), skirtG: c("#cfd1cf", 0.6), cabMask: c("#1d1f22", 0.3),
  },
  bands: [[0, PURPLE[0], "white"], [PURPLE[0], PURPLE[1], "purple"], [PURPLE[1], LINE[0], "white"], [LINE[0], LINE[1], "line"], [LINE[1], 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the band and the line from the body's level down the nose's flanks and across its front
    noseBand("purple", BAND_FOOT, BAND_TOP),
    noseBand("line", LINE_FOOT, LINE_TOP),
    // the raked window behind the canopy, black frames between its three panes
    { mat: "cabGlass", front: RAKED_FRONT, back: [[2.02, RAKED_BACK], [2.73, RAKED_BACK]], face: true },
    { mat: "rubber", front: [[2.02, 5.45], [2.73, 5.45]], back: [[2.02, 5.53], [2.73, 5.53]] },
    { mat: "rubber", front: [[2.02, 6.85], [2.73, 6.85]], back: [[2.02, 6.93], [2.73, 6.93]] },
  ],
};

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

/** The end car's "renfe" over "AVE" on its blank rear section (photo-velaro-e-car.jpg), d its centre behind the body's front, reading forward on both sides. */
function sideMark(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d: number): void {
  const h = 0.36, w = renfeWidth(h), dir = Math.sign(X(0) - X(1));
  for (const sd of [1, -1]) {
    const at = ([u, v]: Pt): Pt => [d - dir * sd * (u - w / 2), 2.34 + v];
    const tris: Pt[] = renfeQuads(h, 0.022).flatMap((q) => [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!].map(at));
    sideDecal(m, b, X, sd, "purple", tris, 0.004);
    const ah = 0.2, aw = ah * 0.58, gap = ah * 0.18, ave = 3 * aw + 2 * gap;
    sideDecal(m, b, X, sd, "slate", strokeText("AVE", -ave / 2 + 0.3, 1.98, ah, aw, gap, false, ah * 0.14).map(([u, v]): Pt => [d - dir * sd * u, v]), 0.004);
  }
}

/** The S-103's fittings: the air-conditioning unit over each car's rear end, the end car's mark, the plain underfloor box on every car. */
function s103Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("roof units", () => {
    const [d0, d1] = car.end ? [19.4 - JOIN, END_BODY - 0.5] : [MID_BODY - 5.6, MID_BODY - 0.6];
    roofUnit(m, X(d1), X(d0), S103.C, 0.78, 0.16, "roofG");
  });
  if (car.end) m.scope("renfe mark", () => sideMark(m, b, X, 22.6 - JOIN));
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), S103.B - 0.35, S103.B, -S103.W * 0.8, S103.W * 0.8));
}

export const S103: ShinkansenSeries = {
  // 2.95 m wide, 3.89 m high
  endLength: END_LENGTH, midLength: MID_LENGTH, W: 1.475, Y: 1.4, S: 3.15, C: 3.89, lean: 0.95, B: 0.62, A: 1.0,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S103_FACE,
  endCrown: [[0, 3.84], [1.0, 3.88], [1.5, 3.89]],
  // the window band 2.02 - 2.73 m; single plug doors with a tall oval window
  windows: [[2.02, 2.73]], windowW: 1.9, pitch: 2.0, door: [1.2, 3.22, 2.0, 2.9], doorW: 0.97, doorGlassW: 0.32, doorGlassR: 0.16,
  layout: {
    // the end car: the raked window (painted on the nose), its door 8.45 m behind the tip, the band from 10.2 to 19.4 m, the blank rear section with the mark
    end: { doors: [[8.45 - JOIN, 9.42 - JOIN, 1]], windows: paneRow(10.2 - JOIN, 19.4 - JOIN, 2.0) },
    // the intermediate cars: one door a side at the front end, a blank vestibule, the band to 2.5 m from the rear
    middle: { doors: [[0.6, 1.57, -1]], windows: paneRow(3.7, MID_BODY - 2.5, 2.0) },
  },
  // the leading bogie 5.0 m behind the tip; 17.375 m bogie centres
  endBogies: [5.0 - JOIN, 5.0 - JOIN + 17.375],
  bogieCentres: 17.375, wheelR: 0.46, wheelbase: 2.5,
  // the single-arm pantographs on the transformer cars, the second and the next-to-last, on a low fairing
  pantographsBesideEnds: true, pantographAt: 9.0,
  pantographCover: { len: 7.0, hw: 0.85, top: [6.2, 0.62], h: 0.2, mat: "roofG" },
  // the UIC number in the white under the purple band
  numberAt: [7.0, 1.16, 0.09],
  fittings: s103Fittings,
  liveries: { ave: AVE_LIVERY },
  // 425 t empty for eight cars, 8,800 kW, 350 km/h
  weight: { end: 55, middle: 52.5 }, power: 1100, maxspeed: 350,
};
