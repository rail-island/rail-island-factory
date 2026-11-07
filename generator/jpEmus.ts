// Japanese conventional-line electric units on the series kit (shinkansen.ts):
// JR East's E235 (the Yamanote line, 2015) and JNR's 103 series commuter cars
// (1963), Odakyu's Romancecar GSE (2018), Kintetsu's Hinotori (2020), the E259
// Narita Express (2009), JNR's 485 series bonnet-nosed express (1964) and the
// Hankyu 9000 series (2006). Each
// an end car, a middle car and a train of 3 - 8. Their narrow-gauge (1,067 mm)
// bodies keep their real 2.8 - 2.95 m width within the UIC gauge, on the game's
// standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge").
// See docs/models/jp-emus.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });
/** A flat cab front's mask and three panes across a w-wide end, lamps low at its corners. */
const flatCab = (w: number, y0: number, y1: number, mask: string, lampY: number) => ({
  mask: [y0 - 0.2, y1 + 0.15, mask] as const,
  panes: [[0.25, w - 0.12, y0, y1], [-0.2, 0.2, y0 - 0.25, y1 + 0.05], [-(w - 0.12), -0.25, y0, y1]] as Array<[number, number, number, number]>,
  lamps: [[-(w - 0.3), lampY, 0.08, "lampHead"], [w - 0.3, lampY, 0.08, "lampHead"], [-(w - 0.15), lampY, 0.05, "lampRed"], [w - 0.15, lampY, 0.05, "lampRed"]] as Array<[number, number, number, string]>,
});
const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

export const E235: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.2, C: 3.62, lean: 0.98, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.475, 1.95, 2.85, "mask", 1.45),
  windows: [[1.95, 2.75]], windowW: 1.1, pitch: 1.35, door: [1.15, 3.05, 1.95, 2.7], doorW: 1.3, doorCount: 4,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    yamanote: { title: "Yamanote green", palette: { ss: c("#c5c9cc", 0.3), green: c("#9acd32"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.24, "green"], [1.24, 2.9, "ss"], [2.9, 3.0, "green"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "TOU-01" },
    yokosuka: { title: "Yokosuka blue", palette: { ss: c("#c5c9cc", 0.3), blue: c("#1d3f80"), cream: c("#e5d9b6"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.2, "cream"], [1.2, 1.3, "blue"], [1.3, 2.9, "ss"], [2.9, 3.0, "blue"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "F-01" },
  },
  weight: { end: 28, middle: 33 }, power: 560, maxspeed: 120,
};

export const S103: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.416, Y: 1.35, S: 3.2, C: 3.65, lean: 0.985, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.416, 2.0, 2.75, "cabMask", 1.55),
  windows: [[1.95, 2.75]], windowW: 1.0, pitch: 1.2, door: [1.15, 3.0, 1.95, 2.7], doorW: 1.3, doorCount: 4,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  liveries: {
    chuo: { title: "Chuo orange", palette: { body: c("#f15a22", 0.45), cabMask: c("#f15a22", 0.45), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "body"]], roof: "roofG", skirt: "skirtG", number: "KUHA 103-1" },
    yamanote: { title: "Yamanote green", palette: { body: c("#9acd32", 0.45), cabMask: c("#9acd32", 0.45), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "body"]], roof: "roofG", skirt: "skirtG", number: "KUHA 103-271" },
  },
  weight: { end: 30, middle: 40 }, power: 440, maxspeed: 100,
};

export const GSE: ShinkansenSeries = {
  endLength: 19.6, midLength: 16.0, W: 1.45, Y: 1.25, S: 3.0, C: 3.55, lean: 0.96, B: 0.9, A: 1.05,
  // the observation front: a long rounded nose of glass, the driver's cab over the saloon
  nose: nose(3.2, 0.25, 2.4, [[0, 1.5], [0.4, 2.2], [1.6, 3.0], [2.8, 3.45], [3.6, 3.55]], [[0, 1.45], [0.4, 2.05], [1.6, 2.7], [2.8, 2.95], [3.6, 3.0]], [[0, 1.35], [1.0, 1.25]], [[0, 1.25], [1.0, 1.05]], [[0, 1.2], [0.5, 0.9]]),
  windscreen: [0.45, 2.7, 0.07, 1.25], lamps: [0.5, 1.45],
  windows: [[1.85, 2.75]], windowW: 1.6, pitch: 1.95, door: [1.15, 3.0, 1.85, 2.6], doorW: 0.9,
  bogieCentres: 9.5, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    rose: { title: "Rose vermilion", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#c8102e") }, bands: [[0, 1.6, "red"], [1.6, 1.68, "white"], [1.68, 9, "red"]], roof: "red", skirt: "skirtG", number: "70051" },
    lse: { title: "LSE colours", palette: { orange: c("#e86a1f"), grey: c("#7d8084"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#7d8084") }, bands: [[0, 1.6, "grey"], [1.6, 1.7, "white"], [1.7, 2.8, "orange"], [2.8, 2.86, "white"], [2.86, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "7001" },
  },
  weight: { end: 36, middle: 30 }, power: 380, maxspeed: 110,
};

// ---------------------------------------------------------------------------
// Kintetsu 80000 "Hinotori" (2020): the cab face, the window band, the premium end car's high windows.
// Measured from assets/kintetsu-hinotori/ (SOURCES.md): heights and the nose's profile from the near
// side view photo-80000.jpg (147 px/m, rail to roof 3.74 m), the face from photo-hinotori-10.jpg and
// photo-kintetsu-80000-series-hinotori-2022-04-02.jpg, the layout from the Kasumigaura photograph.
// Edges along the car are [y, d behind the nose's tip].

import type { Ring } from "./meshCore.ts";
import { sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { SeriesLayout, ShinkansenLivery } from "./shinkansen.ts";
import { block } from "./vehicleParts.ts";

/** The red frame's back edge on the cab side: up beside the nose, then back along the roof's edge as the red line. */
const HINO_FRAME: Pt[] = [[1.45, 0.66], [1.55, 0.72], [1.95, 1.0], [2.35, 1.34], [2.6, 1.66], [2.85, 2.05], [3.0, 2.45], [3.08, 2.8], [3.12, 3.05]];
/** The cab's side window in the dark field: its front edge raked with the frame, a flat sill, its back square before the door. */
const HINO_CAB_WINDOW: { front: Pt[]; back: Pt[] } = { front: [[1.75, 1.02], [2.1, 1.28], [2.4, 1.6], [2.62, 1.92], [2.78, 2.25], [2.86, 2.5]], back: [[1.75, 2.82], [2.86, 2.82]] };

/**
 * The Hinotori's front: a long curved nose, the face raked about 45 degrees from the LED headlight
 * bar (1.5 - 1.66 m) to the roof, which it reaches 3 m behind the tip. A dark centre panel holds the
 * big windscreen and over it, set in the roof's curve, the upper glass the premium car's passengers
 * look forward through; the red frame round it runs up the face's corners and back along the roof's
 * edge as the red line under the dark roof. Under the face the red bumper and the coupler's black recess.
 */
const HINO_FACE: SeriesCabFace = {
  dJoin: 3.0, dSide: 2.4, first: 4.35, roofFrom: 3.38, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.02, reach: 0.02,
  profile: [[0.85, 0.03], [0.95, 0.0], [1.19, 0.08], [1.5, 0.28], [1.98, 0.64], [2.45, 0.98], [2.76, 1.3], [3.05, 1.68], [3.25, 2.0], [3.45, 2.35], [3.6, 2.62], [3.7, 2.85], [3.74, 3.0]],
  corner: [[0.85, 0.3], [2.0, 0.32], [2.8, 0.4], [3.2, 0.5], [3.5, 0.45], [3.74, 0.12]],
  cornerDepth: [[0.85, 0.28], [2.0, 0.3], [2.8, 0.42], [3.2, 0.6], [3.5, 0.55], [3.74, 0.2]],
  rows: [0.85, 0.95, 1.19, 1.36, 1.395, 1.45, 1.5, 1.58, 1.66, 1.75, 1.98, 2.2, 2.45, 2.6, 2.76, 2.9, 3.05, 3.12, 3.25, 3.38, 3.45, 3.55, 3.6, 3.66, 3.7, 3.74],
  bands: () => [[0, 9, "frame"]],
  lodBands: [[0, 1.48, "frame"], [1.48, 9, "faceDark"]],
  fields: [
    // the dark centre panel inside the frame, rounded at the bottom under the headlight bar; over the
    // windscreen it opens out to the roof as the frame turns back along the roof's edge
    { mat: "faceDark", pts: [[-0.82, 1.47], [0.82, 1.47], [0.94, 1.5], [0.99, 1.58], [1.0, 2.2], [0.98, 3.0], [1.05, 3.18], [1.2, 3.3], [1.5, 3.36], [1.5, 3.9], [-1.5, 3.9], [-1.5, 3.36], [-1.2, 3.3], [-1.05, 3.18], [-0.98, 3.0], [-1.0, 2.2], [-0.99, 1.58], [-0.94, 1.5]] },
    // the windscreen, a little wider at its foot, and the upper glass over it in the roof's curve
    { mat: "cabGlass", pts: [[-0.86, 1.98], [0.86, 1.98], [0.93, 2.04], [0.91, 2.98], [0.85, 3.05], [-0.85, 3.05], [-0.91, 2.98], [-0.93, 2.04]] },
    { mat: "cabGlass", pts: [[-0.82, 3.11], [0.82, 3.11], [0.9, 3.17], [0.93, 3.3], [0.85, 3.5], [0.62, 3.6], [-0.62, 3.6], [-0.85, 3.5], [-0.93, 3.3], [-0.9, 3.17]] },
  ],
  // the headlight bar: two rows of twenty LEDs in a black bezel
  masks: [{ lat: [-0.86, 0.86], y: [1.5, 1.665], r: 0.05, mat: "black" }],
  panes: [],
  decals: Array.from({ length: 40 }, (_, i) => {
    const [k, row] = [i % 20, Math.floor(i / 20)];
    const [lat, y, h] = [-0.76 + k * 0.08, row ? 1.6 : 1.535, 0.022];
    return { mat: "lampHead", pts: [[lat - h, y - h], [lat + h, y - h], [lat + h, y + h], [lat - h, y + h]] as Pt[], fine: 1 };
  }),
  wipers: [[[0.1, 2.02], [0.55, 2.7]]],
};

/** The bumper under the face: [y, d of its front, d of its back, half width, corner across, corner depth]. */
const HINO_CHIN: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [0.2, 0.42, 2.3, 1.05, 0.45, 0.55], [0.28, 0.28, 2.35, 1.12, 0.4, 0.45], [0.42, 0.16, 2.4, 1.18, 0.36, 0.38], [0.62, 0.08, 2.45, 1.22, 0.32, 0.32], [0.88, 0.03, 2.5, 1.25, 0.3, 0.29],
];

/** The phoenix logo as triangles, [d behind the tip, y] (photo-80000.jpg: 0.8 m long, 2.44 - 2.79 m): beak, body, three wing and three tail feathers. */
const HINO_PHOENIX: Pt[] = [
  [3.85, 2.55], [3.95, 2.6], [3.95, 2.5],
  [3.95, 2.6], [3.95, 2.5], [4.3, 2.44], [3.95, 2.6], [4.3, 2.44], [4.2, 2.56],
  [4.05, 2.57], [4.12, 2.565], [4.42, 2.79], [4.1, 2.565], [4.18, 2.56], [4.5, 2.74], [4.15, 2.56], [4.22, 2.55], [4.55, 2.67],
  [4.22, 2.53], [4.27, 2.49], [4.6, 2.62], [4.25, 2.5], [4.3, 2.46], [4.66, 2.55], [4.28, 2.47], [4.32, 2.44], [4.6, 2.46],
];

/** The Hinotori's own fittings: the bumper and its coupler recess on the end car, the underfloor equipment. */
function hinotoriFittings(m: MeshBuilder, b: SliceBody, X: (dd: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(t0 + 2.6), HINOTORI.B - 0.4, HINOTORI.B, -HINOTORI.W * 0.82, HINOTORI.W * 0.82));
  if (!car.end) return;
  const dj = HINO_FACE.dJoin;
  // the gold phoenix (the logo), beak forward, over its lettering beside both doors; the crew door's grab rails
  const bird = (at: number): Pt[] => HINO_PHOENIX.map(([d, y]): Pt => [d + at - dj, y]);
  m.scope("emblems", () => {
    for (const sd of [1, -1]) for (const at of [0, 14.85]) sideDecal(m, b, X, sd, "gold", bird(at), 0.006);
    for (const sd of [1, -1]) for (const d of [3.14, 3.84]) sidePanel(m, b, X, sd, "frameSilver", d - dj, d + 0.03 - dj, 1.2, 2.0, 0.02, 0.025);
  });
  // a rounded rectangle in plan, d behind the tip, the back square; `notch` m deep and 0.56 m to each side the coupler's recess in its front
  const ring = ([, df, db, hw, r, rd]: readonly [number, number, number, number, number, number], notch: number): Ring => {
    const pts: Array<[number, number]> = [];
    const n = 5;
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.sin(t)), -(hw - r + r * Math.cos(t))]); }
    if (notch > 0) pts.push([df, -0.56], [df + notch, -0.56], [df + notch, 0.56], [df, 0.56]);
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]); }
    pts.push([db, hw], [db, -hw]);
    const out: Ring = pts.map(([d, z]): [number, number] => [X(d - dj), z]);
    let area = 0;
    for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
    return area > 0 ? out.reverse() : out;
  };
  // the lip under the recess, capped on top (the recess's floor); over it the bumper round the recess, open at its foot
  const ys = HINO_CHIN.map((rw) => rw[0]);
  m.scope("bumper", () => {
    const lip = HINO_CHIN.slice(0, 3).map((rw) => ring(rw, 0)), up = HINO_CHIN.slice(2).map((rw) => ring(rw, 0.2));
    m.cap("bumper", lip[0]!, ys[0]!, false);
    for (let i = 0; i + 1 < lip.length; i++) m.loft("bumper", lip[i]!, ys[i]!, lip[i + 1]!, ys[i + 1]!, i + 2 === lip.length);
    for (let i = 0; i + 1 < up.length; i++) m.loft("bumper", up[i]!, ys[i + 2]!, up[i + 1]!, ys[i + 3]!, false);
  });
  // the recess's black back, the retracted coupler in it
  m.scope("coupler recess", () => block(m, "black", X(0.6 - dj), X(0.21 - dj), ys[2]! + 0.005, 0.87, -0.55, 0.55));
}

/** Side bands: the fine dark lines under the window band, its semi-transparent black, the red line under the roof. */
const hinoBands = (body: string, line: string, stripe: string, band: string, frame: string): ShinkansenLivery["bands"] => [
  [0, 1.36, body], [1.36, 1.395, line], [1.395, 1.62, body], [1.62, 1.635, stripe], [1.635, 1.7, body], [1.7, 1.72, stripe], [1.72, 1.78, body],
  [1.78, 1.805, stripe], [1.805, 1.86, body], [1.86, 1.89, stripe], [1.89, 1.93, body], [1.93, 3.12, band], [3.12, 9, frame],
];
const hinoSweeps = (frame: string, band: string): NonNullable<ShinkansenLivery["endSweeps"]> => [
  // the frame red forward of its back edge, the dark field behind it down to 1.55 m, the cab's side window in it
  { mat: frame, front: [[1.45, -9], [3.12, -9]], back: HINO_FRAME },
  { mat: band, front: HINO_FRAME.slice(1), back: [[1.55, 3.1], [3.12, 3.1]] },
  { mat: "cabGlass", ...HINO_CAB_WINDOW },
];

/** Windows in the dark band: the premium end car's seven at its 1.3 m seat pitch, the regular cars' long ones; d behind the body's +X end (the end car's 3 m behind the tip). */
const HINO_PREMIUM = Array.from({ length: 7 }, (_, i): readonly [number, number] => [1.65 + 1.3 * i, 1.65 + 1.3 * i + 1.08]);
const HINO_REGULAR = Array.from({ length: 7 }, (_, i): readonly [number, number] => [2.3 + 2.4 * i, 2.3 + 2.4 * i + 2.18]);
const HINO_LAYOUT: { end: SeriesLayout; middle: SeriesLayout } = {
  // the crew door behind the cab, the passengers' door at the rear deck over the rear bogie
  end: { doors: [[0.2, 0.78, 1], [14.55, 15.5, -1]], windows: HINO_PREMIUM },
  middle: { doors: [[0.55, 1.5, 1]], windows: HINO_REGULAR },
};

export const HINOTORI: ShinkansenSeries = {
  // 21.6 m end cars and 20.5 m intermediate cars over the couplers, 2.79 m wide, roof 3.74 m (ja.wikipedia)
  endLength: 21.6, midLength: 20.5, W: 1.395, Y: 1.1, S: 3.38, C: 3.74, lean: 0.96, B: 0.85, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: HINO_FACE,
  windows: [[2.12, 3.08]], windowW: 1.08, pitch: 1.3, door: [0.95, 2.62, 1.84, 2.48], doorW: 0.95, doorGlassW: 0.3,
  layout: HINO_LAYOUT,
  // the leading bogie under the cab door 3.9 m behind the tip, 14.15 m bogie centres
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, endBogies: [0.9, 15.05], midBogies: [2.925, 17.075], couplerY: 0.62, fittings: hinotoriFittings,
  liveries: {
    hinotori: {
      title: "Hinotori red", number: "80101",
      // metallic red #ad2320, premium gold #c29d3b (ja.wikipedia); the dark roof and face panel
      palette: { body: c("#a8211f", 0.22), frame: c("#b42420", 0.2), line: c("#c29d3b", 0.3), stripe: c("#5a1416", 0.35), band: c("#2a2224", 0.2), faceDark: c("#3e3a39", 0.3), roofG: c("#3b3837", 0.45), skirtG: c("#a8211f", 0.3), bumper: c("#b42420", 0.2), black: c("#141516", 0.5), gold: c("#c29d3b", 0.3) },
      bands: hinoBands("body", "line", "stripe", "band", "frame"), roof: "roofG", skirt: "skirtG",
      endSweeps: hinoSweeps("frame", "band"),
      doors: [[0, 1.93, "body"], [1.93, 9, "band"]],
      // under the phoenix beside the crew door and behind the passengers' door
      endLettering: [{ text: "HINOTORI", d: 1.25, y: 2.33, h: 0.065, mat: "gold" }, { text: "HINOTORI", d: 16.15, y: 2.33, h: 0.065, mat: "gold" }],
    },
    ace: {
      title: "Ace orange", number: "HV02",
      palette: { body: c("#1d2a4a"), frame: c("#e46c1d"), line: c("#efefea"), stripe: c("#1d2a4a"), band: c("#e46c1d"), faceDark: c("#1d2a4a", 0.3), roofG: c("#d9d9d5", 0.5), skirtG: c("#1d2a4a"), bumper: c("#1d2a4a"), black: c("#141516", 0.5), gold: c("#e46c1d") },
      bands: [[0, 1.31, "body"], [1.31, 1.37, "line"], [1.37, 9, "band"]], roof: "roofG", skirt: "skirtG",
      endSweeps: [{ mat: "cabGlass", ...HINO_CAB_WINDOW }],
    },
  },
  weight: { end: 46, middle: 44 }, power: 300, maxspeed: 130,
};

export const E259: ShinkansenSeries = {
  endLength: 20.5, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.1, C: 3.65, lean: 0.97, B: 0.95, A: 1.1,
  // the raked nose, its gangway door, the cab windows wrapping round
  nose: nose(2.2, 0.45, 2.6, [[0, 2.2], [0.4, 2.85], [1.4, 3.35], [2.2, 3.65]], [[0, 2.15], [0.4, 2.7], [1.4, 3.0], [2.2, 3.1]], [[0, 1.6], [0.8, 1.3]], [[0, 1.3], [0.6, 1.1]], [[0, 1.2], [0.3, 0.95]]),
  windscreen: [0.15, 1.6, 0.07, 1.25], lamps: [0.25, 1.6],
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.75, door: [1.15, 3.0, 1.9, 2.6], doorW: 1.0,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    nex: { title: "Narita Express", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "grey"], [1.5, 1.62, "red"], [1.62, 1.8, "white"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-1" },
    original: { title: "NEX 2009", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.6, "white"], [1.6, 1.8, "red"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-2" },
  },
  weight: { end: 44, middle: 41 }, power: 540, maxspeed: 130,
};

export const S485: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.45, Y: 1.35, S: 3.25, C: 3.9, lean: 0.97, B: 1.0, A: 1.1,
  // the bonnet nose: a rounded hood ahead of the raised cab, its headlight on top
  nose: nose(2.4, 0.3, 2.3, [[0, 1.9], [0.3, 2.25], [1.2, 2.45], [2.1, 2.55], [2.35, 3.25], [2.9, 3.7], [3.4, 3.9]], [[0, 1.85], [0.3, 2.1], [1.2, 2.3], [2.1, 2.4], [2.6, 3.1], [3.4, 3.25]], [[0, 1.6], [1.0, 1.4]], [[0, 1.4], [0.6, 1.1]], [[0, 1.3], [0.4, 1.0]]),
  windscreen: [2.4, 3.0, 0.07, 1.1], lamps: [0.6, 1.95],
  windows: [[1.9, 2.75]], windowW: 1.0, pitch: 1.2, door: [1.15, 3.0, 1.95, 2.6], doorW: 0.7,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  liveries: {
    jnr: { title: "JNR express", palette: { cream: c("#efe3c2"), red: c("#b5202b"), roofG: c("#7d8084", 0.6), skirtG: c("#b5202b") }, bands: [[0, 1.45, "red"], [1.45, 1.92, "cream"], [1.92, 2.75, "red"], [2.75, 9, "cream"]], roof: "cream", skirt: "skirtG", number: "KUHA 481-1" },
    kyushu: { title: "JR Kyushu red", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#7d8084", 0.6), skirtG: c("#3a3b3d") }, bands: [[0, 1.45, "white"], [1.45, 9, "red"]], roof: "red", skirt: "skirtG", number: "KUHA 481-201" },
  },
  weight: { end: 41, middle: 44 }, power: 480, maxspeed: 120,
};

export const HANKYU9000: ShinkansenSeries = {
  endLength: 19.0, midLength: 19.0, W: 1.375, Y: 1.3, S: 3.2, C: 3.65, lean: 0.985, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.375, 1.95, 2.8, "cabMask", 1.4),
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.15, 3.0, 1.95, 2.7], doorW: 1.3, doorCount: 3,
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    maroon: { title: "Hankyu maroon", palette: { maroon: c("#5a1418", 0.3), ivory: c("#e8e0c8"), cabMask: c("#5a1418", 0.3), roofG: c("#e8e0c8", 0.5), skirtG: c("#2a2c2f") }, bands: [[0, 3.05, "maroon"], [3.05, 9, "ivory"]], roof: "roofG", skirt: "skirtG", number: "9000" },
    allMaroon: { title: "Plain maroon", palette: { maroon: c("#5a1418", 0.3), cabMask: c("#5a1418", 0.3), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9300" },
  },
  weight: { end: 32, middle: 36 }, power: 600, maxspeed: 115,
};

const P = { e235: seriesParams(E235), s103: seriesParams(S103), gse: seriesParams(GSE), hinotori: seriesParams(HINOTORI), e259: seriesParams(E259), s485: seriesParams(S485), hankyu: seriesParams(HANKYU9000) };

export function jrE235(v?: ParamValues): MeshBuilder { return buildSeries(E235, P.e235, v); }
export function jrE235Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E235, P.e235, v); }
export function jnr103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function jnr103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function odakyuGse(v?: ParamValues): MeshBuilder { return buildSeries(GSE, P.gse, v); }
export function odakyuGseLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GSE, P.gse, v); }
export function kintetsuHinotori(v?: ParamValues): MeshBuilder { return buildSeries(HINOTORI, P.hinotori, v); }
export function kintetsuHinotoriLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HINOTORI, P.hinotori, v); }
export function jrE259(v?: ParamValues): MeshBuilder { return buildSeries(E259, P.e259, v); }
export function jrE259Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E259, P.e259, v); }
export function jnr485(v?: ParamValues): MeshBuilder { return buildSeries(S485, P.s485, v); }
export function jnr485Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S485, P.s485, v); }

export function hankyu9000(v?: ParamValues): MeshBuilder { return buildSeries(HANKYU9000, P.hankyu, v); }
export function hankyu9000Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HANKYU9000, P.hankyu, v); }

export const JP_EMU_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-jr-e235": E235, "proc-vehicle-jnr-103": S103, "proc-vehicle-odakyu-gse": GSE,
  "proc-vehicle-kintetsu-hinotori": HINOTORI, "proc-vehicle-jr-e259": E259, "proc-vehicle-jnr-485": S485, "proc-vehicle-hankyu-9000": HANKYU9000,
};

export const JP_EMUS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-jr-e235", "JR E235", E235, P.e235, jrE235, jrE235Lod, "jr-e235", "uic"),
  seriesDesign("proc-vehicle-jnr-103", "JNR 103 series", S103, P.s103, jnr103, jnr103Lod, "jnr-103", "uic"),
  seriesDesign("proc-vehicle-odakyu-gse", "Odakyu Romancecar GSE", GSE, P.gse, odakyuGse, odakyuGseLod, "odakyu-gse", "uic"),
  seriesDesign("proc-vehicle-kintetsu-hinotori", "Kintetsu Hinotori", HINOTORI, P.hinotori, kintetsuHinotori, kintetsuHinotoriLod, "kintetsu-hinotori", "uic"),
  seriesDesign("proc-vehicle-jr-e259", "JR E259 Narita Express", E259, P.e259, jrE259, jrE259Lod, "jr-e259", "uic"),
  seriesDesign("proc-vehicle-jnr-485", "JNR 485 series", S485, P.s485, jnr485, jnr485Lod, "jnr-485", "uic"),
  seriesDesign("proc-vehicle-hankyu-9000", "Hankyu 9000 series", HANKYU9000, P.hankyu, hankyu9000, hankyu9000Lod, "hankyu-9000", "uic"),
];
