// NS's Stadler FLIRT 3 ("Sprinter Flirt", NS FLIRT; 2016 - 2017): 33 three-car units 2201 - 2233
// (mABk + B + mABk, 63.2 m) and 25 four-car units 2501 - 2525 (mABk + B + Bz + mABk, 80.7 m), the end
// cars 22.85 m to the joint, the middle cars 17.5 m, 2.82 m wide, 4.12 m high, on Jacobs bogies
// (Bo'(2)'(2)'Bo': the motor bogie under each cab, 920 mm wheels), 1500 V DC, 160 km/h. Drawn on the
// series kit (shinkansen.ts) with its own cab face (seriesCab.ts), not the shared `flirt()` base: the
// FLIRT 3's blunt front - the dark grey apron with the coupler and the two louvred boxes, the white band
// with the lamp clusters in dark housings, the big windscreen in its black surround with the V-shaped
// foot, the black cap with the destination display over it - in the yellow front NS gave the units from
// 2023 (the 2200s by 2024) over the Sprinter scheme: white, the big blue field over the windows from
// behind the cab to the car's end, the white stripe at the cantrail, the blue roof, the yellow line over
// the dark underframe, yellow doors with a narrow window in each leaf. Matched to the photographs in
// assets/ns-flirt/ (SOURCES.md: 2203, 2211, 2218, 2501, 2504, Boxtel 2024, InnoTrans 2016) and the
// published figures (nl.wikipedia "NS FLIRT", Stadler's data sheet cited there).
// See docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip on the face, in `endSweeps` and `sidePanels`, else d
// behind the body's front end (the face's join on an end car, the coupling gap on a middle car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, sideLettering, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** The coupling plane's reach ahead of the face's tip (the Scharfenberg coupler's head). */
const REACH = 0.3;
/** Where the face meets the body, behind the tip: the cab's roof at full height. */
const JOIN = 2.2;
/** Half width (2.82 m), the side's shoulder (the roof from there) and the crown (4.02 m; 4.12 m over the roof fittings). */
const W = 1.41;
const S = 3.45;
const C = 4.02;
/** The skirt's bottom and top, the belly. */
const B = 0.5;
const A = 0.62;
const Y = 0.64;
/** End car 22.85 m from the coupler to the joint, middle cars 17.5 m joint to joint. */
const END_LENGTH = 22.85;
const MID_LENGTH = 17.5;
/** d measured from the coupler's face (the projective fits) to d behind the tip and behind the body's front. */
const tip = (dc: number) => +(dc - REACH).toFixed(3);
const body = (dc: number) => +(dc - REACH - JOIN).toFixed(3);

/** Paint heights on the sides: the yellow line, the blue field, the white cantrail stripe. */
const LINE: readonly [number, number] = [Y, 0.72];
const FIELD: readonly [number, number] = [1.25, 3.22];
const STRIPE: readonly [number, number] = [3.22, 3.42];

/**
 * The window rows (sill, head), measured on the 2504 and 2211 photographs in door heights (the yellow
 * leaf 0.6 - 3.05 m): the second class 1.41 - 2.51 m, the first class over the motor bogie's raised floor
 * higher, 1.79 - 2.66 m.
 */
const SECOND: readonly [number, number] = [1.41, 2.51];
const FIRST: readonly [number, number] = [1.79, 2.66];

/**
 * The face's centre line: the apron upright to 1.4 m with the coupler, the white band set back over it
 * holding the lamp housings (1.58 - 1.92 m), the yellow panel and the windscreen leaning back about
 * 31 degrees (2.6 - 3.72 m, 0.7 m back), the black cap rounding into the roof 2.2 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.16], [0.5, 0.06], [0.62, 0.015], [0.75, 0], [1.3, 0], [1.42, 0.025], [1.5, 0.08], [1.58, 0.11], [1.92, 0.15], [2.0, 0.18],
  [2.35, 0.36], [2.6, 0.5], [3.2, 0.84], [3.72, 1.16], [3.84, 1.32], [3.93, 1.56], [3.98, 1.84], [C, JOIN],
];

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/**
 * The FLIRT 3's front, measured head-on on the InnoTrans 2016 photograph (113 px/m, the face 2.82 m wide)
 * and on the Boxtel 2024 close view of 2220: the dark grey apron 0.42 - 1.5 m with the coupler in its
 * recess and the two louvred boxes at its corners (0.75 - 1.3 m); the white band to 2.0 m and the lamp
 * housings at its ends (lat 0.63 - 1.34 m, the round headlight outside, the LED cluster and the red tail
 * light inside); the yellow from 2.0 m round the windscreen and over the corners; the windscreen's black
 * surround coming to a point at 2.35 m, its glass 2.6 - 3.72 m, narrowing upward; the black cap over it
 * to the roof with the destination display (3.78 - 3.9 m); the NS logo in the yellow under the point.
 */
const FLIRT3_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.4, reach: REACH, first: 7.75, roofFrom: 4.5, bulge: 0.07, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: PROFILE,
  // nearly as wide as the body up to the windscreen's head, the corners rounded 0.3 - 0.5 m and swept back
  corner: [[B, 0.3], [1.5, 0.32], [2.0, 0.4], [2.6, 0.48], [3.4, 0.58], [3.84, 0.62], [3.95, 0.5], [C, 0.3]],
  cornerDepth: [[B, 0.3], [1.5, 0.35], [2.0, 0.5], [2.6, 0.65], [3.4, 0.8], [3.84, 0.8], [C, 0.4]],
  rows: [...new Set([...PROFILE.map(([y]) => y), 0.75, 1.02, 1.3, 1.6, 1.72, 1.76, 1.85, 2.08, 2.17, 2.45, 2.52, 2.62, 2.68, 2.9, 3.45, 3.6, 3.74, 3.79, 3.9])].sort((a, b) => a - b),
  bands: () => [[0, 1.5, "grey"], [1.5, 2.0, "white"], [2.0, 9, "yellow"]],
  lodBands: [[0, 1.5, "grey"], [1.5, 2.0, "white"], [2.0, 2.58, "yellow"], [2.58, 9, "cabMask"]],
  lodGlass: { hw: 1.05, y: [2.68, 3.74] },
  fields: [
    // the windscreen's black surround: a shallow point at its foot, narrowing upward, running on as the cap over the crown
    { mat: "cabMask", pts: [[-1.26, 2.62], [0, 2.52], [1.26, 2.62], [1.24, 3.2], [1.1, 3.8], [0.96, 4.4], [-0.96, 4.4], [-1.1, 3.8], [-1.24, 3.2]] },
    // the apron's dark grey rising at the corners to the lamp housings, the white band over them
    ...[1, -1].map((sd) => ({ mat: "grey", pts: ([[0.62, 1.49], [1.7, 1.49], [1.7, 1.76], [0.66, 1.76], [0.62, 1.7]] as Pt[]).map(([l, y]): Pt => [sd * l, y]) })),
  ],
  masks: [
    // the coupler's recess in the apron
    { lat: [-0.52, 0.52], y: [0.58, 1.32], r: 0.08, mat: "black" },
  ],
  panes: [
    { lat: [-1.06, 1.06], y: [2.68, 3.74], r: 0.12 },
    { lat: [-0.36, 0.36], y: [3.79, 3.9], r: 0.02, mat: "display" },
  ],
  decals: [
    // the NS logo under the surround's point
    ...nsLogo(0, 2.17, 0.1).map((pts) => ({ mat: "blue", pts, fine: 1 })),
    // the pressed V-shaped crease across the yellow panel
    ...[1, -1].map((sd) => ({ mat: "crease", pts: ([[0, 2.33], [1.1, 2.44], [1.1, 2.46], [0, 2.35]] as Pt[]).map(([l, y]): Pt => [sd * l, y]), fine: 2 })),
  ],
  pods: [
    // the lamp housings at the white band's ends: the round headlight outside, the LED cluster and the tail light inside
    ...[1, -1].map((sd) => ({
      lat: sd * 0.99, y: 1.72, w: 0.7, h: 0.28, r: 0.1, proud: 0.04, depth: 0.06, mat: "cabMask",
      lamps: [[sd * 0.2, 0.075, "lampHead"], [-sd * 0.02, 0.045, "lampHead"], [-sd * 0.15, 0.045, "lampRed"]] as const,
    })),
    // the louvred boxes at the apron's corners
    ...[1, -1].map((sd) => ({ lat: sd * 1.15, y: 1.02, w: 0.42, h: 0.55, r: 0.05, proud: 0.1, depth: 0.05, mat: "grille" })),
  ],
  wipers: [[[0.68, 2.72], [0.4, 3.35]]],
};

/** The NS logo as convex pieces (two bars, an arrow tip on each, the diagonal joining them), h tall, centred at (u, v). */
function nsLogo(u: number, v: number, h: number): Pt[][] {
  const k = h / 2, P = (x: number, y: number): Pt => [u + x * k, v + y * k];
  return [
    [P(-0.55, 0.42), P(0.75, 0.42), P(0.75, 0.68), P(-0.55, 0.68)], [P(0.75, 0.28), P(1.15, 0.55), P(0.75, 0.82)],
    [P(-0.75, -0.68), P(0.55, -0.68), P(0.55, -0.42), P(-0.75, -0.42)], [P(-0.75, -0.28), P(-0.75, -0.82), P(-1.15, -0.55)],
    [P(-0.42, -0.42), P(-0.12, -0.42), P(0.42, 0.42), P(0.12, 0.42)],
  ];
}

/** Convex pieces as triangles (fans), counter-clockwise seen in (x, y). */
const fans = (polys: readonly Pt[][]): Pt[] => polys.flatMap((q) => q.slice(1, -1).flatMap((_, i) => [q[0]!, q[i + 1]!, q[i + 2]!]));

/**
 * The cab end's paint on the sides (d behind the tip): the apron's dark grey wrapping round the corner
 * and dropping behind the lamps to the underframe, which it keeps back to the motor bogie; white over
 * the cab section, the blue field starting behind it in a round front edge (5.2 m from the coupler at
 * mid height, 6.6 m at the stripe); the yellow carried round the corner to the windscreen's side and up
 * to the roof's edge; the cab side window, its front edge raked with the windscreen (2011 / 2504 photos).
 */
const SWEEPS: ShinkansenLivery["endSweeps"] = [
  {
    mat: "white", front: [[0.95, -9], [FIELD[1], -9]],
    back: [[0.95, tip(6.5)], [FIELD[0], tip(6.3)], [1.6, tip(5.55)], [1.9, tip(5.27)], [2.2, tip(5.17)], [2.5, tip(5.25)], [2.8, tip(5.5)], [3.05, tip(5.95)], [FIELD[1], tip(6.64)]],
  },
  { mat: "grey", front: [[Y, -9], [0.95, -9]], back: [[Y, tip(6.5)], [0.95, tip(6.5)]] },
  { mat: "grey", front: [[0.95, -9], [2.0, -9]], back: [[0.95, tip(3.0)], [1.2, tip(2.0)], [1.5, tip(1.1)], [1.75, tip(0.75)], [2.0, tip(0.55)]] },
  { mat: "yellow", front: [[2.0, -9], [S, -9]], back: [[2.0, tip(0.65)], [2.5, tip(1.0)], [3.0, tip(1.7)], [3.25, tip(2.45)], [S, tip(3.2)]] },
  {
    mat: "cabSideGlass",
    front: [[2.36, tip(3.1)], [2.4, tip(2.98)], [2.48, tip(2.94)], [2.9, tip(3.08)], [3.2, tip(3.22)], [3.3, tip(3.32)]],
    back: [[2.36, tip(3.75)], [2.42, tip(3.85)], [3.22, tip(3.85)], [3.3, tip(3.76)]],
  },
];

/**
 * The scheme (the Sprinter colours with the yellow front of 2023): white, the blue field from 1.25 to
 * 3.22 m, the white cantrail stripe, the blue roof, the yellow line over the dark grey underframe,
 * yellow doors; the number is 2203's (photographed at Hulten in 2024).
 */
const FLIRT_SPRINTER: ShinkansenLivery = {
  title: "NS Sprinter", number: "2203",
  palette: {
    white: c("#f1f2f0"), blue: c(NS_BLUE), yellow: c(NS_YELLOW), grey: c("#3e444b", 0.6), roofB: c(NS_BLUE, 0.6), roofE: c("#5d636a", 0.6),
    skirtG: c("#2c3034", 0.75), cabMask: c("#15171a", 0.3), display: c("#3a2a12", 0.35), black: c("#111316", 0.5), grille: c("#2a2e33", 0.6), crease: c("#e3ad0c"),
    // the cab side window (the windscreen's own glass is the kit's cabGlass)
    cabSideGlass: { color: "#1b222b", metallic: 0.3, roughness: 0.08, glass: true },
  },
  bands: [[0, LINE[0], "grey"], [LINE[0], LINE[1], "yellow"], [LINE[1], FIELD[0], "white"], [FIELD[0], FIELD[1], "blue"], [STRIPE[0], STRIPE[1], "white"], [STRIPE[1], 9, "blue"]],
  doors: [[0, LINE[0], "grey"], [LINE[0], 9, "yellow"]],
  roof: "roofB", skirt: "skirtG",
  endSweeps: SWEEPS,
  // the first class's white bar over its windows
  sideFields: { end: [{ mat: "white", pts: box(body(7.05), body(9.95), 2.79, 2.86) }] },
};

/** A double door of two leaves from d (each leaf with its own narrow window), the leaves sliding apart. */
const door = (d: number, w = 1.3): Array<readonly [number, number, number]> => [[d, d + w / 2, -1], [d + w / 2, d + w, 1]];
const span = (d0: number, d1: number) => [d0, d1] as const;

/**
 * The end car (the 2504 photograph by a projective fit over the coupler, both 1.3 m doors and the
 * joint; checked on 2218): the cab's side window and door, the white cab section, the blue field with
 * the two first-class windows, a door at 10.25 m from the coupler, three windows, a door at 17.1 m,
 * two windows to the joint.
 */
const END_LAYOUT: SeriesLayout = {
  doors: [...door(body(10.25)), ...door(body(17.1))],
  windows: [],
  rows: [
    [span(body(11.95), body(13.2)), span(body(13.6), body(14.9)), span(body(15.35), body(16.65)), span(body(18.9), body(20.3)), span(body(20.75), body(22.05))],
    [span(body(7.2), body(8.25)), span(body(8.8), body(9.85))],
  ],
};
/**
 * A middle car (the 2218 photograph, fitted on its joints and doors; d from the joint less the gap):
 * two windows, a door, two windows, the blank toilet wall, a door, two windows.
 */
const mid = (d: number) => +(d - 0.25).toFixed(3);
const MID_LAYOUT: SeriesLayout = {
  doors: [...door(mid(4.1)), ...door(mid(11.15))],
  windows: [],
  rows: [
    [span(mid(1.1), mid(2.05)), span(mid(2.55), mid(3.85)), span(mid(5.95), mid(7.35)), span(mid(7.65), mid(9.1)), span(mid(13.2), mid(14.7)), span(mid(14.98), mid(16.6))],
    [],
  ],
};

/** The roof's fittings, the cab's front gear and the side markings. */
function flirt3Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const Cr = b.C(L / 2);
  m.scope("roof equipment", () => {
    if (car.end) {
      // the cab's air conditioning behind the face; the traction converter and the brake resistors over the passenger room
      at("roofE", body(6.5), body(9.4), Cr - 0.05, Cr + 0.16, -0.85, 0.85);
      at("roofE", body(10.6), body(15.4), Cr - 0.05, Cr + 0.22, -0.8, 0.8);
      at("grille", body(10.8), body(15.2), Cr + 0.22, Cr + 0.24, -0.7, 0.7);
      at("roofE", body(17.4), body(21.6), Cr - 0.05, Cr + 0.18, -0.8, 0.8);
    } else {
      // the pantograph's insulators and the main switch ahead of it, the air conditioning behind
      at("roofE", 0.6, 2.0, Cr - 0.05, Cr + 0.14, -0.6, 0.6);
      at("roofE", 5.2, 10.5, Cr - 0.05, Cr + 0.18, -0.8, 0.8);
      at("roofE", L - 4.6, L - 1.4, Cr - 0.05, Cr + 0.16, -0.85, 0.85);
    }
  });
  m.scope("markings", () => {
    for (const sd of [1, -1]) {
      // the NS logo in the white under the windows, the class numerals beside the windows
      const logo = car.end ? body(14.6) : L / 2 - 0.2;
      // read from outside: mirrored along d on the -Z side
      const tris = fans(nsLogo(logo, 0.97, 0.36));
      sideDecal(m, b, X, sd, "blue", sd > 0 ? tris : tris.map(([d, y]): Pt => [2 * logo - d, y]), 0.004);
      if (car.end) sideLettering(m, b, X, sd, "1", body(8.53), 2.2, 0.28, "white");
      for (const d of car.end ? [body(13.4), body(19.6)] : [mid(2.3), mid(7.5), mid(14.85)]) sideLettering(m, b, X, sd, "2", d, 2.2, 0.24, "white");
    }
  });
  if (car.end) m.scope("front gear", () => {
    // the Scharfenberg coupler standing out of its recess, the plough under the apron
    const t = (d: number) => d - JOIN;
    at("carbon", t(-REACH), t(-0.12), 0.8, 1.1, -0.18, 0.18);
    at("carbon", t(-0.14), t(0.25), 0.88, 1.02, -0.08, 0.08);
    at("skirtG", t(0.05), t(0.9), 0.2, B + 0.03, -1.1, 1.1);
    // the cab roof's black cap carried on behind the face between the yellow edges
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "cabMask", [0, 0.6], [0, 0.8], 0.004);
  });
}

/** The NS FLIRT 3: the end car leads (motor bogie under the cab), Jacobs bogies under the joints. */
export const NS_FLIRT: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FLIRT3_FACE,
  windows: [SECOND, FIRST], windowW: 1.3, pitch: 1.6, windowCornerR: 0.1,
  // 1.3 m double doors (the leaf 0.6 - 3.05 m), a narrow rounded window in each leaf
  door: [0.6, 3.05, 1.46, 2.71], doorW: 1.3, doorGlassW: 0.28, doorGlassR: 0.1,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  // the cab door's droplight (its outline a seam) behind the cab's side window
  cabWindows: [[body(4.1), body(4.32), 2.5, 3.05]],
  sidePanels: {
    end: [{ d: [tip(4.0), tip(4.7)], y: [0.97, 3.2], kind: "seam" }, { d: [tip(5.6), tip(6.2)], y: [1.4, 2.55], kind: "seam" }],
  },
  // the motor bogie under the cab (5.3 m from the coupler), Jacobs bogies under the joints; 920 / 760 mm wheels
  jacobs: true, endBogies: [body(5.3), 0], bogieCentres: 12.0, wheelR: 0.43, wheelbase: 2.5,
  // one single-arm pantograph, on the middle car (the second car of a four-car unit) near its front
  onePantograph: true, pantographAt: 3.0,
  lodEndPatches: [{ d: [1.6, tip(5.3)], hw: W + 0.012, y: [FIELD[0], FIELD[1]], mat: "white" }],
  fittings: flirt3Fittings,
  cars: [3, 4],
  liveries: { sprinter: FLIRT_SPRINTER },
  weight: { end: 42, middle: 32 }, power: 375, maxspeed: 160,
};
