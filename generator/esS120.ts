// Renfe's class 120 / 121 (CAF / Alstom 2004 - 2010; proc-vehicle-renfe-s120): four-car dual-gauge,
// dual-voltage EMUs (MCT-MIT-MIP-MCP, every car motored, BRAVA gauge-changing bogies), 250 km/h on
// standard gauge, the class 120 in Renfe's Alvia scheme and the class 121 in Media Distancia's (Avant).
// Drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the rounded white
// bumper standing out under the cab with the coupler hatch and the renfe logo on it, the black face
// over it with the two headlight housings low at its corners, the big windscreen raked about 47
// degrees, the grey cap with the black lamp strip and its twin roof lights; the black window band from
// the triangular cab side window back, the crew door with its tall narrow window behind it, one plug
// door a side on every car, the black fairings over the car joints, the pantographs over the end cars'
// inner ends. Matched to the photographs in assets/renfe-s120/ (SOURCES.md) and the published figures
// (es.wikipedia "Serie 120 de Renfe": 106.96 m over four cars, 2.92 m wide, 225 t, 4,000 kW, 250 km/h).
//
// Scales used (SOURCES.md): photo-s-120-san-sebastian.jpg close crop at the crew door, 404 px/m
// vertically (the window band taken as 0.83 m, 2.03 - 2.86 m); photo-renfe-s120-32719577967.jpg (121,
// side three-quarter) by a projective fit over the nose tip and the two joints (end car 27.35 m,
// intermediate car 26.13 m over the couplers): the end car's windows and doors, about 7.3 px/m at the
// joint; photo-alvia-120-y-470-100c.jpg head-on for the face (about 124 px/m at the bumper).
//
// Heights over the rail; on the face d behind its tip (the bumper's front), on the body d behind the
// body's front end (the face's join on the end car, the coupling gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body (the cap reaches the crown's last few centimetres just behind it), the coupling plane's reach. */
const JOIN = 3.3;
const REACH = 0.1;
/** Half width (2.92 m), belly, shoulder (the grey roof from there), crown; the skirt's bottom and top. */
const W = 1.46;
const Y = 1.0;
const S = 3.7;
const C = 4.05;
const B = 0.55;
const A = 0.92;
/** Lengths over the couplers: 106.96 m over the four cars. */
const END_LENGTH = 27.35;
const MID_LENGTH = 26.13;

/** The window band (black) and the two stripes under it (photo-s-120-san-sebastian.jpg at the crew door). */
const BAND: readonly [number, number] = [2.03, 2.86];
const LOWER: readonly [number, number] = [1.06, 1.17];
const UPPER: readonly [number, number] = [1.24, 1.33];

/** d behind the tip to d behind the end car's body front. */
const body = (d: number) => +(d - JOIN).toFixed(3);

/**
 * The face's centre line (photo-alvia-120-861 and photo-s-120-san-sebastian three-quarter, the 470 photograph head-on):
 * the dark plough tucked 0.5 m back under the bumper; the bumper's front upright from 1.0 to 1.65 m, rounding over to its
 * top edge at 1.98 m, 0.3 m back; the black face set back on the ledge, the headlights at 2.2 m; the windscreen from 2.42 m
 * (0.7 m back) raked about 47 degrees to 3.48 m (1.85 m back); the grey cap with the lamp strip rounding into the crown.
 */
const PROFILE: Pt[] = [
  [B, 0.5], [0.62, 0.36], [0.7, 0.2], [0.78, 0.1], [1.0, 0.01], [1.15, 0], [1.6, 0], [1.82, 0.07],
  [1.9, 0.14], [1.96, 0.24], [1.99, 0.34], [2.02, 0.5], [2.2, 0.57], [2.42, 0.7], [2.9, 1.22], [3.48, 1.86], [3.62, 2.08],
  [3.76, 2.36], [3.88, 2.66], [3.96, 2.95], [4.0, 3.15], [C - 0.03, JOIN],
];

/** The black face over the bumper: its outline [lat, y], widest at the windscreen's head (the white A pillars beside it). */
const MASK: Pt[] = [[-0.72, 2.0], [0.72, 2.0], [0.86, 2.15], [0.95, 2.45], [1.06, 3.1], [1.1, 3.53], [-1.1, 3.53], [-1.06, 3.1], [-0.95, 2.45], [-0.86, 2.15]];
/** The windscreen's glass inside it: a trapezoid wider at its head. */
const GLASS: Pt[] = [[-0.86, 2.47], [0.86, 2.47], [0.98, 3.1], [1.02, 3.45], [-1.02, 3.45], [-0.98, 3.1]];
/** The lamp strip on the cap: a black band with the two roof lights in its middle. */
const STRIP = [3.62, 3.86] as const;

const ROWS = [...new Set([
  ...PROFILE.map(([y]) => y), 0.85, A, LOWER[0], LOWER[1], UPPER[0], UPPER[1], BAND[0], 2.15, 2.47, BAND[1], 3.1, 3.45, 3.53, STRIP[0], STRIP[1],
])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * Renfe's lower-case logo as strokes in letter heights (x along, y up from the baseline; x height 0.6, the f's ascender 1.0
 * and its descender to -0.3): r, e, n, f, e, each glyph's strokes and its advance.
 */
const GLYPHS: Record<string, { strokes: Pt[][]; adv: number }> = {
  r: { strokes: [[[0.08, 0], [0.08, 0.6]], [[0.08, 0.38], [0.22, 0.55], [0.38, 0.6], [0.48, 0.58]]], adv: 0.52 },
  e: { strokes: [[[0.06, 0.3], [0.5, 0.3], [0.49, 0.45], [0.4, 0.57], [0.28, 0.6], [0.14, 0.55], [0.06, 0.42], [0.05, 0.22], [0.12, 0.07], [0.26, 0], [0.4, 0.02], [0.5, 0.09]]], adv: 0.6 },
  n: { strokes: [[[0.08, 0], [0.08, 0.6]], [[0.08, 0.4], [0.2, 0.56], [0.34, 0.6], [0.46, 0.55], [0.5, 0.42], [0.5, 0]]], adv: 0.62 },
  f: { strokes: [[[0.56, 0.98], [0.44, 1.0], [0.32, 0.94], [0.27, 0.8], [0.25, 0.2], [0.2, -0.16], [0.08, -0.3]], [[0.06, 0.6], [0.5, 0.6]]], adv: 0.56 },
};

/** The logo's strokes as convex quads [x, y] in metres, `h` the letter height, the word centred on x = 0 with its baseline at y = 0. */
function logoQuads(text: string, h: number): Pt[][] {
  const t = 0.11 * h;
  const width = [...text].reduce((s, ch) => s + GLYPHS[ch]!.adv, 0) * h;
  const out: Pt[][] = [];
  let x0 = -width / 2;
  for (const ch of text) {
    const g = GLYPHS[ch]!;
    for (const line of g.strokes)
      for (let i = 1; i < line.length; i++) {
        const [ax, ay] = [x0 + line[i - 1]![0] * h, line[i - 1]![1] * h], [bx, by] = [x0 + line[i]![0] * h, line[i]![1] * h];
        const L = Math.hypot(bx - ax, by - ay) || 1, [nx, ny] = [(-(by - ay) / L) * t / 2, ((bx - ax) / L) * t / 2];
        // each segment a little longer, so that the joints close
        const [ex, ey] = [((bx - ax) / L) * t * 0.3, ((by - ay) / L) * t * 0.3];
        out.push([[ax - ex - nx, ay - ey - ny], [bx + ex - nx, by + ey - ny], [bx + ex + nx, by + ey + ny], [ax - ex + nx, ay - ey + ny]]);
      }
    x0 += g.adv * h;
  }
  return out;
}

/** The logo as triangles [x, y]. */
const logoTris = (text: string, h: number): Pt[] => logoQuads(text, h).flatMap((q) => [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!]);

/** The bumper's coupler hatch: an outline 2 cm wide round a rounded rectangle on the bumper's front. */
const HATCH = { lat: [-0.62, 0.62] as const, y: [0.9, 1.84] as const, r: 0.18 };

/** The outline of a rounded rectangle (half width hw, centre height yc, half height hh, corner radius r) as convex quads `t` wide. */
function ring(hw: number, yc: number, hh: number, r: number, t: number): Pt[][] {
  const outer: Pt[] = [], inner: Pt[] = [];
  for (const [cx, cy, a0] of [[hw - r, hh - r, 0], [-hw + r, hh - r, 90], [-hw + r, -hh + r, 180], [hw - r, -hh + r, 270]] as const)
    for (let j = 0; j <= 3; j++) {
      const a = ((a0 + 30 * j) * Math.PI) / 180;
      outer.push([cx + r * Math.cos(a), yc + cy + r * Math.sin(a)]);
      inner.push([cx + (r - t) * Math.cos(a), yc + cy + (r - t) * Math.sin(a)]);
    }
  return outer.map((p, i) => { const k = (i + 1) % outer.length; return [p, outer[k]!, inner[k]!, inner[i]!]; });
}

const S120_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 2.2, reach: REACH, first: 3.45, roofFrom: 3.53, tolerance: 0.035, cols: [6, 4, 1, 1],
  profile: PROFILE,
  // the bumper broad, its corners rounding 0.6 m and sweeping back to the crease 1.6 m behind its front; the face over it
  // narrower and rounder, the cap round
  corner: [[B, 0.8], [1.0, 0.82], [1.7, 0.82], [1.99, 0.8], [2.02, 0.62], [2.42, 0.6], [3.1, 0.62], [3.48, 0.72], [3.76, 0.95], [3.96, 1.2], [C - 0.03, 1.3]],
  cornerDepth: [[B, 1.3], [1.0, 1.5], [1.7, 1.55], [1.99, 1.45], [2.02, 1.2], [2.42, 1.1], [3.1, 0.95], [3.48, 0.75], [3.76, 0.5], [3.96, 0.25], [C - 0.03, 0.02]],
  // the bumper bowed forward in plan
  bulge: [[B, 0.06], [1.6, 0.1], [1.99, 0.08], [2.02, 0.05], [3.48, 0.05], [C - 0.03, 0]],
  rows: ROWS,
  // the face is white over the dark plough; its own bands from the livery's `front`
  bands: (l) => l.front ?? [[0, 0.85, "skirtG"], [0.85, 9, "white"]],
  lodBands: [[0, 0.85, "skirtG"], [0.85, 2.0, "white"], [2.0, 3.53, "black"], [3.53, 9, "roofG"]],
  lodGlass: { hw: 0.95, y: [2.47, 3.45] },
  fields: [
    { mat: "black", pts: MASK },
    { mat: "cabGlass", pts: GLASS },
    // the lamp strip over the windscreen
    { mat: "black", pts: box(-0.76, 0.76, STRIP[0], STRIP[1]) },
  ],
  masks: [
    // the headlight housings low at the black face's corners: a grey surround round the lenses
    { lat: [0.36, 0.84], y: [2.08, 2.36], r: 0.08, mat: "lampBox" },
    { lat: [-0.84, -0.36], y: [2.08, 2.36], r: 0.08, mat: "lampBox" },
  ],
  panes: [],
  decals: [
    // the coupler hatch's outline on the bumper (the Avant's stripes run on under it), the renfe logo on the hatch
    ...ring(HATCH.lat[1], (HATCH.y[0] + HATCH.y[1]) / 2, (HATCH.y[1] - HATCH.y[0]) / 2, HATCH.r, 0.022).map((pts) => ({ mat: "seam", pts, fine: 1 })),
    ...logoQuads("renfe", 0.27).map((q) => ({ mat: "logo", pts: q.map(([x, y]): Pt => [x, y + 1.42]), fine: 1 })),
  ],
  lamps: [
    [0.68, 2.22, 0.1, "lampHead"], [0.49, 2.22, 0.045, "lampRed"],
    [-0.68, 2.22, 0.1, "lampHead"], [-0.49, 2.22, 0.045, "lampRed"],
    // the twin roof lights in the strip
    [0.11, 3.74, 0.075, "lampHead"], [-0.11, 3.74, 0.075, "lampHead"],
  ],
  wipers: [[[0.18, 2.55], [-0.35, 3.25]], [[0.82, 2.55], [0.3, 3.2]]],
};

/** The cab's side window: a black triangle ahead of the crew door, its front edge raked with the windscreen. */
const CAB_FRONT: Pt[] = [[BAND[0], 2.25], [BAND[1], 3.02]];
const CREW: readonly [number, number] = [3.45, 4.1];

/** Renfe's purple and the Avant's orange as the photographs show them. */
const PURPLE = "#86235f";
const ORANGE = "#e0602a";

function s120Livery(title: string, number: string, avant: boolean): ShinkansenLivery {
  const stripes: Array<readonly [number, number, string]> = [[A, LOWER[0], "white"], [LOWER[0], LOWER[1], "purple"], [LOWER[1], UPPER[0], "white"], [UPPER[0], UPPER[1], avant ? "orange" : "purple"]];
  return {
    title, number,
    palette: {
      white: c("#f2f2ef"), black: c("#16181b", 0.3), purple: c(PURPLE), orange: c(ORANGE), logo: c(PURPLE),
      roofG: c("#b3b7ba", 0.5), skirtG: c("#45484c", 0.75), cabMask: c("#16181b", 0.3), lampBox: c("#6d7176", 0.35),
      seam: c("#9a9ea2", 0.5), joint: c("#1b1c1e", 0.8), roofE: c("#9da2a6", 0.5), grille: c("#3a3d41", 0.6),
    },
    bands: [[0, A, "skirtG"], ...stripes, [UPPER[1], BAND[0], "white"], [BAND[0], BAND[1], "black"], [BAND[1], 9, "white"]],
    doors: [[0, A, "skirtG"], ...stripes, [UPPER[1], 9, "white"]],
    // the face: the Avant's stripes run on across the bumper's front, the Alvia's end at its corners
    front: avant ? [[0, 0.85, "skirtG"], [0.85, LOWER[0], "white"], ...stripes.slice(1), [UPPER[1], 9, "white"]] : [[0, 0.85, "skirtG"], [0.85, 9, "white"]],
    roof: "roofG", skirt: "skirtG",
    frontRoof: "roofG",
    endSweeps: [
      // white ahead of the cab side window, over the window band
      { mat: "white", front: [[BAND[0] - 0.01, -9], [BAND[1] + 0.01, -9]], back: CAB_FRONT.map(([y, d]): Pt => [y, d]) },
      // the cab side window, black glass from its raked front edge back to the crew door
      { mat: "cabGlass", front: CAB_FRONT, back: [[BAND[0], CREW[0] - 0.06], [BAND[1], CREW[0] - 0.06]] },
      // the crew door white over the band
      { mat: "white", front: [[BAND[0] - 0.01, CREW[0]], [BAND[1] + 0.01, CREW[0]]], back: [[BAND[0] - 0.01, CREW[1]], [BAND[1] + 0.01, CREW[1]]] },
    ],
  };
}

/** Windows 1.36 m long from d0 (a short one 0.55 m). */
const win = (d0: number, w = 1.36): readonly [number, number] => [+d0.toFixed(3), +(d0 + w).toFixed(3)];
/** A plug door 1.0 m wide from d0. */
const door = (d0: number): readonly [number, number, number] => [+d0.toFixed(3), +(d0 + 1.0).toFixed(3), 1];

/**
 * The end car (photo-renfe-s120-32719577967, projective fit; d behind the tip): the crew door 3.45 - 4.1 m, four windows
 * from 5.55 m at 1.75 m pitch and a short one, the blank wall, the door at 14.85 m, a short window, four windows and a short one.
 */
const END_LAYOUT: SeriesLayout = {
  doors: [door(body(14.85))],
  windows: [
    win(body(5.55)), win(body(7.3)), win(body(9.05)), win(body(10.8)), win(body(12.55), 0.55),
    win(body(17.4), 0.55), win(body(18.35)), win(body(20.1)), win(body(21.85)), win(body(23.6)), win(body(25.35), 0.55),
  ],
};
/**
 * The intermediate car (the same photograph's second car): a short window and four windows, the blank wall of the toilet,
 * the door just behind the middle, then a short window, four windows and a short one; d behind the body's front end.
 */
const MID_LAYOUT: SeriesLayout = {
  doors: [door(13.6)],
  windows: [
    win(2.05, 0.55), win(2.95), win(4.7), win(6.45), win(8.2), win(9.95, 0.55),
    win(15.15, 0.55), win(16.1), win(17.85), win(19.6), win(21.35), win(23.1, 0.55),
  ],
};

/** The roof's fittings, the joints' black fairings, the logos on the sides and the front gear. */
function s120Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const Cr = b.C(L / 2);
  m.scope("roof equipment", () => {
    // the air conditioning units' low fairings with their grilles
    const ac = car.end ? [body(8.0), body(13.5)] : [3.0, 15.5];
    for (const d of ac) {
      at("roofE", d, d + 4.2, Cr - 0.05, Cr + 0.12, -0.78, 0.78);
      for (const z of [0.25, -0.55]) at("grille", d + 0.5, d + 1.7, Cr + 0.12, Cr + 0.125, z, z + 0.3);
    }
    if (car.end) {
      // the high-voltage gear ahead of the pantograph over the inner end: the breaker, the transformer's bushing, the roof line
      at("pantograph", L - 6.6, L - 5.2, Cr - 0.02, Cr + 0.32, -0.32, 0.32);
      at("insulator", L - 5.0, L - 4.75, Cr - 0.02, Cr + 0.36, -0.1, 0.1);
      at("pantograph", L - 6.4, L - 3.4, Cr + 0.3, Cr + 0.33, -0.03, 0.03);
    }
  });
  m.scope("joint fairings", () => {
    // the black rubber fairings over each coupled end, round the roof and down the sides to the skirt
    const ends: Array<[number, number]> = car.end ? [[L - 0.22, L - 0.006]] : [[0.006, 0.22], [L - 0.22, L - 0.006]];
    for (const [d0, d1] of ends)
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "joint", d0, d1, B + 0.05, S, 0.012, 0.02);
        crownPane(m, b, X, sd, "joint", [d0, d1], [0, W], 0.012);
      }
  });
  m.scope("markings", () => {
    // the renfe logo on the white under the windows, behind the crew door on the end car, by the door on the others
    const d = car.end ? body(5.4) : 11.6;
    const quads = logoTris("renfe", 0.24);
    for (const sd of [1, -1]) {
      // read from outside: along -d on the +Z side of a car facing +X
      const dir = Math.sign(X(0) - X(1));
      sideDecal(m, b, X, sd, "logo", quads.map(([x, y]): Pt => [d - dir * sd * x, y + 1.62]), 0.004);
    }
  });
  if (car.end) m.scope("front gear", () => {
    // the plough under the bumper
    at("skirtG", body(0.55), body(1.5), 0.34, B + 0.02, -0.9, 0.9);
  });
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    at("under", t0 + 1.7, t1 - 1.7, 0.42, A - 0.02, -1.15, 1.15);
  });
}

export const S120: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S120_FACE,
  endCrown: [[0, C - 0.03], [0.4, C - 0.01], [0.8, C]],
  // the windows' glass inside the black band; single plug doors (the leaf 1.12 - 3.12 m) with a narrow window
  windows: [[2.08, 2.8]], windowW: 1.36, pitch: 1.75, door: [1.12, 3.12, 2.02, 2.84], doorW: 1.0, doorGlassW: 0.42, doorGlassR: 0.08,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  // the crew door's tall narrow window
  cabWindows: [[body(CREW[0] + 0.18), body(CREW[1] - 0.18), 1.25, 3.2]],
  sidePanels: { end: [{ d: [CREW[0], CREW[1]], y: [1.12, 3.35], kind: "seam" }] },
  // the leading bogie behind the crew door, 6.0 m behind the tip; 18.0 m bogie centres; 0.88 m wheels
  endBogies: [body(6.0), body(24.0)], bogieCentres: 18.0, wheelR: 0.44, wheelbase: 2.6,
  // a single-arm pantograph over each end car's inner end, the leading one raised
  endPantograph: true, trailingLowered: true, pantographAt: body(24.3),
  lodRoof: { d: [8.0, 12.2], hw: 0.78, y: [C - 0.05, C + 0.12], mat: "roofE" },
  fittings: s120Fittings,
  cars: [4],
  liveries: { alvia: s120Livery("Alvia", "120 061", false), mediaDistancia: s120Livery("Media Distancia", "121 020", true) },
  // 225 t empty over four cars, every car motored: 4,000 kW
  weight: { end: 57, middle: 55 }, power: 1000, maxspeed: 250,
};

const S120_PARAMS = seriesParams(S120);
export function renfeS120(v?: ParamValues): MeshBuilder { return buildSeries(S120, S120_PARAMS, v); }
export function renfeS120Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S120, S120_PARAMS, v); }
