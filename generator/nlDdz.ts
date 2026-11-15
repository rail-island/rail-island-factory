// The NS DDZ ("Dubbeldekker Zonering", also NID), drawn on the series kit (shinkansen.ts) with its
// own cab face (seriesCab.ts): the 1990s DD-AR double-deck coaches and their mDDM motor cars,
// rebuilt by NedTrain 2010-2014 into 4- and 6-car intercity units. The unit leads with the motor car
// mBk (ex mDDM: 21.39 m on three bogies, Bo'Bo'Bo', one passenger level over the machinery, the
// pantograph) and ends with the driving trailer ABvk (26.9 m, double-deck); between them the Bv and
// ABv coaches (26.4 m), whose lower deck lies in a well between the bogies (floor 0.35 m) and whose
// ends are an intermediate level with the doors over the bogies. Both cab ends carry the rebuilt
// face: one large windscreen in a black surround in place of the three panes (the old pillars still
// behind it), the blue band under it with the marker lamp, the blue cap, the lamp housings either
// side of the grille and the BSI coupler between the buffer pads. The blue bands follow the decks:
// high and low on the coaches, joined round the doors and stepping up at the ends; one high band on
// the mBk. Matched to the photographs in assets/ns-ddz/ (SOURCES.md) and the published figures
// (nl.wikipedia "DDZ", "mDDM", "DD-AR"). See docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip on the face (`t` below), else d behind the body's
// front end (the face's join on an end car, the gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { resolveParams } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** The face meets the body 1.35 m behind its tip (the dome rounding back to the crown); the coupling plane 0.35 m ahead of it. */
const JOIN = 1.35;
/** Half width (2.78 m wide), shoulder and crown (4.606 m). */
const W = 1.39;
const S = 4.1;
const C = 4.6;
/** Over the bogies and at the ends (the intermediate level, balcony floor 1.183 m): the belly, skirt top and bottom. */
const Y_END = 1.22;
const A_END = 1.18;
const B_END = 0.72;

/** Lengths over the couplers: ABvk 26.896 m, Bv / ABv 26.4 m, mBk 21.39 m (nl.wikipedia "DD-AR", "mDDM"). */
const ABVK_LENGTH = 26.896;
const COACH_LENGTH = 26.4;
const MBK_LENGTH = 21.39;
/** Their bodies (the kit's 0.25 m gap at an inner end, the face and the coupler's reach at the cab). */
const ABVK_L = ABVK_LENGTH - 0.25 - JOIN - 0.35;
const COACH_L = COACH_LENGTH - 0.5;

/**
 * The face's centre line, measured head-on on photo-olst-ddz-7618 (165 px/m, the crown at 4.6 m) and
 * on the three-quarter views of 7526 and 7530: the dark lower front to 1.21 m, upright past the lamps
 * to the blue band (2.25 - 2.59 m), the windscreen leaning back about 12 degrees to 3.61 m, then the
 * blue dome rounding back to the crown 1.35 m behind the tip.
 */
const PROFILE: Pt[] = [[1.18, 0.03], [1.21, 0], [1.6, 0.005], [2.25, 0.03], [2.59, 0.06], [3.0, 0.14], [3.61, 0.26], [3.78, 0.33], [3.95, 0.44], [4.15, 0.6], [4.35, 0.82], [4.5, 1.04], [4.6, JOIN]];

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The rebuilt cab end of the mBk and the ABvk. Its paint by material, so one face serves both
 * schemes: `ddzBand` the band under the windscreen, `ddzCap` the dome over it, `ddzPillar` the three
 * panes' old pillars (behind the DDZ's one windscreen, the DD-AR's black frames).
 */
export const DDZ_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.7, reach: 0.35, first: 3.0, roofFrom: S + 0.05, bulge: 0.02, tolerance: 0.02, cols: [7, 3, 1, 1],
  profile: PROFILE,
  // flat across, the corners rounded 0.25 m (the head-on photos), the dome's wider
  corner: [[1.18, 0.25], [2.59, 0.25], [3.61, 0.28], [3.95, 0.33], [4.35, 0.45], [4.6, 0.25]],
  rows: [...new Set([...PROFILE.map(([y]) => y), 1.4, 1.565, 1.73, 1.77, 2.42, 2.66, 3.54])].sort((a, b) => a - b),
  bands: () => [[0, 1.21, "skirtG"], [1.21, 2.25, "yellow"], [2.25, 2.59, "ddzBand"], [2.59, 9, "yellow"]],
  lodBands: [[0, 1.21, "skirtG"], [1.21, 2.25, "yellow"], [2.25, 2.59, "ddzBand"], [2.59, 3.61, "black"], [3.61, 9, "ddzCap"]],
  lodGlass: { hw: 1.2, y: [2.66, 3.54] },
  // the cap over the windscreen on the front, and the dome over the shoulder all round
  fields: [{ mat: "ddzCap", pts: box(-1.7, 1.7, 3.61, 4.7) }],
  paint: [{ mat: "ddzCap", front: [[S, -1], [4.7, -1]], back: [[S, 3], [4.7, 3]], top: 9 }],
  masks: [
    // the windscreen's black surround, 2.55 m wide
    { lat: [-1.27, 1.27], y: [2.59, 3.61], r: 0.05, mat: "black" },
    // the grille between the lamp housings, its black foot
    { lat: [-0.41, 0.41], y: [1.21, 1.77], r: 0.02, mat: "grille" },
  ],
  panes: [{ lat: [-1.2, 1.2], y: [2.66, 3.54], r: 0.04 }],
  decals: [
    // the three panes' pillars
    ...[-0.6, 0.6].map((l) => ({ mat: "ddzPillar", pts: box(l - 0.045, l + 0.045, 2.66, 3.54), fine: 1 })),
    // the grille's louvres
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ mat: "black", pts: box(-0.37, 0.37, 1.32 + k * 0.075, 1.345 + k * 0.075), fine: 1 })),
  ],
  // the lamp housings: 0.6 by 0.33 m at 1.57 m, the headlight inside, the tail light outside
  pods: [1, -1].map((sd) => ({ lat: sd * 0.75, y: 1.565, w: 0.6, h: 0.33, r: 0.13, proud: 0.03, depth: 0.05, mat: "black", lamps: [[-sd * 0.13, 0.085, "lampHead"], [sd * 0.13, 0.085, "lampRed"]] as const })),
  // the marker lamp in the band under the windscreen
  lamps: [[0, 2.42, 0.085, "lampHead"]],
  // both wipers parked left of the middle
  wipers: [[[-0.95, 2.68], [-0.72, 3.35]], [[-0.4, 2.68], [-0.62, 3.35]]],
};

/** A double door of two leaves from d (each leaf its own narrow window), the leaves sliding apart. */
const door = (d: number, w: number): Array<readonly [number, number, number]> => [[d, d + w / 2, -1], [d + w / 2, d + w, 1]];
/** n windows of width w, centred on d at pitch p. */
const row = (centre: number, n: number, w: number, p: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, i) => { const m = centre + (i - (n - 1) / 2) * p; return [m - w / 2, m + w / 2] as const; });

/**
 * The window rows (lower deck, upper deck) of the double-deck cars: the lower deck's tall windows in the
 * well, 0.95 - 1.96 m (floor 0.352 m), the upper deck's 3.15 - 3.68 m (floor 2.434 m).
 */
const DD_ROWS: ReadonlyArray<readonly [number, number]> = [[0.95, 1.96], [3.15, 3.68]];

/**
 * The ABvk, measured on photo-ns-ddz-dubbeldekker-op-station-heerhugowaard (7632) by a projective fit
 * over the face, the 1.3 m front door and the car's end: the cab door, the 1.3 m double door over the
 * front bogie, three lower windows, two blank panels, five more; eleven upper windows; the 1.9 m door
 * over the rear bogie.
 */
const ABVK_LAYOUT: SeriesLayout = {
  doors: [...door(1.72, 1.3), ...door(ABVK_L - 2.45, 1.9)],
  windows: [],
  rows: [
    [[4.1, 5.0], [5.4, 6.55], [6.95, 8.1], [11.7, 12.85], [13.2, 14.35], [14.7, 15.85], [16.2, 17.35], [17.7, 18.85]],
    row(12.05, 11, 1.15, 1.5),
  ],
};
/** The Bv and ABv: a 1.9 m door over each bogie, eleven lower and thirteen upper windows. */
const COACH_LAYOUT: SeriesLayout = {
  doors: [...door(0.55, 1.9), ...door(COACH_L - 2.45, 1.9)],
  windows: [],
  rows: [row(COACH_L / 2, 11, 1.15, 1.48), row(COACH_L / 2, 13, 1.15, 1.5)],
};
/** The mBk (photo-ddz-7515, photo-nid-te-den-haag-centraal 7529): the cab door, a 1.0 m door, six windows and a small one on the one high level. */
const MBK_LAYOUT: SeriesLayout = {
  doors: [...door(1.6, 1.0)],
  windows: [...row(8.25, 6, 1.25, 1.6), [14.1, 14.5]],
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

/** Band heights: the lower band's foot in the well and its head, the upper band's foot and head, a door field's foot and head. */
const LO = [0.74, 2.2] as const;
const UP = [2.97, 3.85] as const;
const FIELD = [1.25, 3.12] as const;

/**
 * A double-deck car's blue (photo 7632): round each door a field up to 3.12 m, joined behind it to the
 * lower band, whose foot slants down into the well and whose head slants down from the field to 2.2 m;
 * the upper band from just behind the front field to just ahead of the rear one, its ends slanted. The
 * front door [a, e] and the well's start w0; the rear door [ra, re] and the well's end w1.
 */
function ddBlue(a: number, e: number, w0: number, ra: number, re: number, w1: number): Pt[][] {
  const lower: Pt[] = [
    [a - 0.15, FIELD[0]], [w0, FIELD[0]], [w0 + 0.55, LO[0]], [w1 - 0.55, LO[0]], [w1, FIELD[0]], [re + 0.15, FIELD[0]],
    [re + 0.15, FIELD[1]], [ra - 0.15, FIELD[1]], [ra - 0.15, UP[0]], [ra - 0.45, UP[0]], [ra - 1.05, LO[1]],
    [e + 1.05, LO[1]], [e + 0.45, UP[0]], [e + 0.15, UP[0]], [e + 0.15, FIELD[1]], [a - 0.15, FIELD[1]],
  ];
  const upper: Pt[] = [[e + 0.15, UP[0]], [ra - 0.15, UP[0]], [ra - 0.15, FIELD[1]], [ra - 0.6, UP[1]], [e + 0.6, UP[1]], [e + 0.15, FIELD[1]]];
  return [lower, upper];
}

/** The mBk's blue (photos 7515, 7529): the field round its door joined to the one high band, whose foot drops toward the car's rear end. */
function mbkBlue(L: number): Pt[][] {
  return [[[1.45, 1.3], [2.75, 1.3], [2.75, 2.6], [L - 2.9, 2.6], [L - 0.35, 2.15], [L, 2.15], [L, 3.75], [3.2, 3.75], [2.75, 3.1], [1.45, 3.1]]];
}

/** The fittings every car shares: the cab end's lower front, buffer pads and coupler, the roof's air intakes. */
function cabFront(m: MeshBuilder, X: (d: number) => number): void {
  // t behind the tip
  const at = (mat: string, t0: number, t1: number, y0: number, y1: number, z0: number, z1: number) => {
    const [x0, x1] = [X(t0 - JOIN), X(t1 - JOIN)];
    block(m, mat, Math.min(x0, x1), Math.max(x0, x1), y0, y1, z0, z1);
  };
  m.scope("lower front", () => {
    // the dark apron under the face, behind it the front bogie
    at("skirtG", 0.04, 1.2, 0.45, 1.19, -1.22, 1.22);
    // the buffer pads at the corners, the coupler between them
    for (const sd of [1, -1]) at("skirtG", -0.28, 0.05, 0.82, 1.18, sd > 0 ? 0.86 : -1.36, sd > 0 ? 1.36 : -0.86);
    for (const sd of [1, -1]) at("black", -0.3, -0.27, 0.86, 1.14, sd > 0 ? 0.9 : -1.32, sd > 0 ? 1.32 : -0.9);
  });
  m.scope("coupler", () => {
    at("carbon", -0.3, 0.05, 0.86, 0.98, -0.09, 0.09);
    at("carbon", -0.35, -0.22, 0.74, 1.08, -0.2, 0.2);
  });
}

/** The blue cap's middle over the crown, where the roof edge's strips from both sides leave a seam. */
function capSeam(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  m.scope("cap crown", () => { for (const sd of [1, -1]) crownPane(m, b, X, sd, "blue", [0, 2.35 - JOIN], [0, 0.12], 0.005); });
}

/** The roof's recessed air intakes at a car's end, on both edges (d span on the body). */
function roofIntakes(m: MeshBuilder, b: SliceBody, X: (d: number) => number, spans: ReadonlyArray<readonly [number, number]>, n: number): void {
  m.scope("roof intakes", () => {
    for (const sd of [1, -1]) for (const [d0, d1] of spans) {
      crownPane(m, b, X, sd, "grille", [d0, d1], [1.02, 1.3], 0.006);
      const k = (d1 - d0) / n;
      for (let i = 1; i < n; i++) crownPane(m, b, X, sd, "black", [d0 + i * k - 0.025, d0 + i * k + 0.025], [1.04, 1.28], 0.01);
    }
  });
}

/**
 * The NS logo (blue on the yellow), h tall, centred at (d, y): two bars, one arrow tip each (the upper
 * pointing ahead, the lower back), joined by the diagonal.
 */
function nsLogo(d: number, y: number, h: number): Pt[] {
  const k = h / 2, P = (u: number, v: number): Pt => [d + u * k, y + v * k];
  const quad = (a: Pt, b: Pt, q: Pt, e: Pt): Pt[] => [a, b, q, a, q, e];
  return [
    // the upper bar and its tip, the lower bar and its tip
    ...quad(P(-0.55, 0.42), P(0.75, 0.42), P(0.75, 0.68), P(-0.55, 0.68)), P(0.75, 0.28), P(1.15, 0.55), P(0.75, 0.82),
    ...quad(P(-0.75, -0.68), P(0.55, -0.68), P(0.55, -0.42), P(-0.75, -0.42)), P(-0.75, -0.28), P(-1.15, -0.55), P(-0.75, -0.82),
    // the diagonal between them
    ...quad(P(-0.42, -0.42), P(-0.12, -0.42), P(0.42, 0.42), P(0.12, 0.42)),
  ];
}

/** The blue shapes on both sides of a car, triangulated. */
function blueShapes(m: MeshBuilder, b: SliceBody, X: (d: number) => number, polys: readonly Pt[][], logo: readonly [number, number]): void {
  m.scope("blue bands", () => { for (const sd of [1, -1]) for (const poly of polys) sideDecal(m, b, X, sd, "blue", triangulate(poly), 0.003); });
  m.scope("logo", () => { for (const sd of [1, -1]) sideDecal(m, b, X, sd, "blue", nsLogo(logo[0], logo[1], 0.48), 0.004); });
}

/** The ABvk's and the coaches' fittings: their cab end, the roof intakes and (DDZ) the blue bands. */
function ddFittings(blue: boolean) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number }): void => {
    const L = car.length;
    if (car.end) cabFront(m, X);
    if (car.end && blue) capSeam(m, b, X);
    roofIntakes(m, b, X, car.end ? [[1.3, 2.5], [L - 1.6, L - 0.4]] : [[0.4, 1.6], [L - 1.6, L - 0.4]], 5);
    if (blue)
      blueShapes(m, b, X, car.end ? ddBlue(1.72, 3.02, 3.65, L - 2.45, L - 0.55, L - 4.5) : ddBlue(0.55, 2.45, 4.5, L - 2.45, L - 0.55, L - 4.5), [car.end ? 8.5 : L / 2, 2.58]);
  };
}

/** The mBk's fittings: the cab end, the motor room's intakes along both roof edges, its underfloor equipment, (DDZ) the blue band. */
function mbkFittings(blue: boolean) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void => {
    const L = car.length;
    cabFront(m, X);
    if (blue) capSeam(m, b, X);
    roofIntakes(m, b, X, [[1.6, 7.0], [8.0, 11.2]], 14);
    m.scope("underfloor", () => {
      const at = (d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, "under", Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
      // the traction converters and the compressor between the bogies
      at(3.95, 6.75, 0.42, A_END - 0.02, 1.2);
      at(11.2, 14.05, 0.42, A_END - 0.02, 1.2);
      at(17.9, L - 0.1, 0.6, A_END - 0.02, 1.0);
    });
    if (blue) blueShapes(m, b, X, mbkBlue(L), [5.5, 2.2]);
  };
}

/** The DDZ's NS yellow with the blue bands following the decks, the blue cab cap, blue doors. */
function ddzLivery(lodSides: ShinkansenLivery["lodSides"]): ShinkansenLivery {
  return {
    title: "NS yellow, blue", number: "7515",
    palette: {
      yellow: c(NS_YELLOW), blue: c(NS_BLUE), roofG: c("#4d535c", 0.6), skirtG: c("#3a3d41", 0.75), black: c("#16181a", 0.35), grille: c("#2c2f33", 0.6),
      cabMask: c("#16181a", 0.3), ddzBand: c(NS_BLUE), ddzCap: c(NS_BLUE),
      // the old pillars seen through the one windscreen
      ddzPillar: { color: "#182029", metallic: 0.25, roughness: 0.12, glass: true },
    },
    bands: [[0, 9, "yellow"]], doors: [[0, 9, "blue"]], roof: "roofG", skirt: "skirtG",
    // the blue cap carried back over the roof: to 2.0 m behind the tip at the shoulder, 2.4 m at the crown
    endRoofEdge: { mat: "blue", y: C - 0.001, d: [JOIN, 2.0, 2.4] },
    ...(lodSides ? { lodSides } : {}),
  };
}

/**
 * The DD-AR's scheme before the rebuild (livery `yellowGrey`, photo-ddar-den-haag-laan-van-noi and the
 * mDDM in photo-mddm-en-ddz-op-station-bilthoven): NS yellow, the grey roof and cab dome, the dark grey
 * underframe, grey doors, the three windscreen panes in black frames. Drawn on the rebuilt body: the
 * DD-AR's cab side windows (closed in the rebuild) are not drawn.
 */
const DDAR_LIVERY: ShinkansenLivery = {
  title: "NS yellow, grey", number: "7847",
  palette: {
    yellow: c(NS_YELLOW), roofG: c("#9a9ea2", 0.5), skirtG: c("#3a3d41", 0.75), black: c("#16181a", 0.35), grille: c("#2c2f33", 0.6), doorGrey: c("#8d9297", 0.45),
    cabMask: c("#16181a", 0.3), ddzBand: c(NS_YELLOW), ddzCap: c("#9a9ea2", 0.5), ddzPillar: c("#16181a", 0.35), blue: c(NS_BLUE),
  },
  bands: [[0, 9, "yellow"]], doors: [[0, 9, "doorGrey"]], roof: "roofG", skirt: "skirtG",
};

/** The double-deck cars' distant bands (the well's lower band and the upper one) and the mBk's (its one high band). */
const DD_LOD_SIDES: ShinkansenLivery["lodSides"] = [[0, LO[0], "yellow"], [LO[0], LO[1], "blue"], [LO[1], UP[0], "yellow"], [UP[0], UP[1], "blue"], [UP[1], 9, "yellow"]];
const MBK_LOD_SIDES: ShinkansenLivery["lodSides"] = [[0, 2.6, "yellow"], [2.6, 3.75, "blue"], [3.75, 9, "yellow"]];

/** The series of one scheme: the DDZ's blue (`blue`) or the DD-AR's plain yellow. */
function ddzSeries(blue: boolean): ShinkansenSeries {
  const liveries = (lod: ShinkansenLivery["lodSides"]) => ({ yellowBlue: ddzLivery(lod), yellowGrey: DDAR_LIVERY });
  return {
    // the ABvk and the coaches; the mBk below (leadEnd)
    endLength: ABVK_LENGTH, midLength: COACH_LENGTH, W, Y: Y_END, S, C, lean: 0.985, B: B_END, A: A_END,
    nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DDZ_FACE,
    windows: DD_ROWS, windowW: 1.15, pitch: 1.5,
    // doors 1.9 m (the ABvk's front one 1.3 m) from the balcony floor (1.183 m), a narrow window in each leaf
    door: [Y_END, 3.06, 2.05, 2.95], doorW: 1.9, doorGlassW: 0.2,
    layout: { end: ABVK_LAYOUT, middle: COACH_LAYOUT },
    // the cab door's narrow window behind the face
    cabWindows: [[0.72, 0.94, 2.05, 3.0]],
    sidePanels: {
      // the cab door; the two blank panels on the lower deck; the small window at the upper band's rear end
      end: [
        { d: [1.85, 2.6], y: [1.25, 3.2], kind: "seam" },
        { d: [9.8, 11.25], y: [1.0, 1.95], kind: "seam" }, { d: [11.3, 12.75], y: [1.0, 1.95], kind: "seam" },
        { d: [JOIN + ABVK_L - 4.35, JOIN + ABVK_L - 4.0], y: [2.42, 2.75], kind: "window" },
      ],
    },
    // the lower deck in the well between the bogies (floor 0.352 m)
    lowWell: { end: [3.65, ABVK_L - 4.5], middle: [4.5, COACH_L - 4.5], Y: 0.42, A: 0.36, B: 0.28, lodMat: "yellow" },
    // bogies 2.5 m inside the coaches' ends (the ABvk's leading one under its front door), 920 mm wheels
    endBogies: [1.65, ABVK_L - 2.5], midBogies: [2.5, COACH_L - 2.5], bogieCentres: 20.9, wheelR: 0.46, wheelbase: 2.5,
    // the mBk leads and raises the pantograph
    endPantograph: "lead", cars: [4, 6],
    fittings: ddFittings(blue),
    liveries: liveries(blue ? DD_LOD_SIDES : undefined),
    leadEnd: {
      // the mBk (ex mDDM): 21.39 m, one passenger level 2.85 - 3.5 m over the machinery, no well
      endLength: MBK_LENGTH, windows: [[2.85, 3.5]], windowW: 1.25, pitch: 1.6,
      door: [Y_END, 3.06, 2.05, 2.95], doorW: 1.0, doorGlassW: 0.16,
      layout: { end: MBK_LAYOUT, middle: COACH_LAYOUT },
      cabWindows: [[0.72, 0.94, 2.05, 3.0]],
      sidePanels: {
        end: [
          { d: [1.85, 2.6], y: [1.25, 3.2], kind: "seam" },
          // the machinery lockers under the band
          ...[5.3, 7.0, 8.7, 10.4, 12.1, 13.8, 15.5].map((d) => ({ d: [d, d + 1.6] as const, y: [1.32, 2.42] as const, kind: "seam" as const })),
        ],
      },
      lowWell: undefined,
      // Bo'Bo'Bo': three bogies 7.25 m apart, centred on the car; 920 mm wheels, 2.75 m wheelbase
      endBogies: [MBK_LENGTH / 2 - 0.35 - JOIN - 7.25, MBK_LENGTH / 2 - 0.35 - JOIN + 7.25], endMiddleBogies: [MBK_LENGTH / 2 - 0.35 - JOIN], wheelbase: 2.75,
      // the single-arm pantograph behind the middle bogie
      pantographAt: 12.6,
      fittings: mbkFittings(blue),
      liveries: liveries(blue ? MBK_LOD_SIDES : undefined),
      lodRoof: undefined,
    },
    weight: { end: 64, middle: 50 }, power: 400, maxspeed: 140,
  };
}

/** The DDZ in its own blue bands (the design's series: its game figures and parameters). */
export const DDZ: ShinkansenSeries = ddzSeries(true);
/** The same cars in the DD-AR's scheme. */
const DDAR: ShinkansenSeries = ddzSeries(false);

const PARAMS = seriesParams(DDZ);
const seriesOf = (v?: ParamValues): ShinkansenSeries => (resolveParams(PARAMS, v).livery === "yellowGrey" ? DDAR : DDZ);

export function nsDdz(v?: ParamValues): MeshBuilder { return buildSeries(seriesOf(v), PARAMS, v); }
export function nsDdzLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(seriesOf(v), PARAMS, v); }
