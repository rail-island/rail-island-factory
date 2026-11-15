// NS's VIRM double-deck InterCity unit (Talbot / Bombardier, 1994 - 2009; the IRM lengthened to
// four and six cars), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts):
// the raked dark grey hood holding the one-piece windscreen and the round headlight, the yellow front
// below it with the four lamps in their housings and the Scharfenberg coupler in its black recess; each
// car's double deck between two end sections over the bogies (the "balcony" at 1.16 m, with the door
// and a window); two doors a side on every car; the upper deck's band running the whole train, sweeping
// down to the end car's first door. Matched to NS's own side drawings of the cars (poster "Intercity
// (VIRM)", 20.85 px/m) and the photographs in assets/ns-virm/ (SOURCES.md).
// See docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip on the face (and in `endSweeps`), else d behind the
// body's front end (the face's join on the end car, the coupling gap on an intermediate car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** Where the face meets the body, behind the tip: just ahead of the first door. */
const JOIN = 2.6;
/** The body's crown (4.67 m, nl.wikipedia) and the cab's roof at the join, rising to it 1.3 m further back. */
const C = 4.67;
const CAB_TOP = 4.52;
/** The side's shoulder, where the roof starts; the roof's paint from 5 mm under it. */
const S = 4.06;
const ROOF_EDGE = S - 0.005;

/** The window rows: the lower deck, the upper deck, the end sections (the drawing). */
const LOWER: readonly [number, number] = [1.11, 1.92];
const UPPER: readonly [number, number] = [3.17, 3.8];
const MID: readonly [number, number] = [1.97, 2.8];
/** The blue bands: the lower deck's, the end sections' (across the door leaves), the upper deck's. */
const LOWER_BAND: readonly [number, number] = [1.01, 2.02];
const MID_BAND: readonly [number, number] = [1.87, 2.88];
const UPPER_BAND: readonly [number, number] = [3.12, 3.85];

/** The face's centre line (the end car's drawing): the chin, the lamp band forward, the windscreen raked about 32 degrees to the hood's flat top. */
const PROFILE: Pt[] = [
  [0.2, 0.25], [0.45, 0.18], [0.8, 0.12], [1.2, 0.05], [1.65, 0], [1.87, 0], [2.0, 0.08], [2.5, 0.33], [3.0, 0.61], [3.5, 0.87],
  [3.75, 1.05], [3.95, 1.3], [4.12, 1.55], [4.3, 1.73], [4.45, 1.95], [CAB_TOP, JOIN],
];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.3, 3.12, 3.85, 4.06])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/**
 * The VIRM's front (photo-virm-9553-eindhoven.jpg head on at 178 px/m, photo-virm-8632.jpg, the
 * drawing's profile): the yellow front upright from the chin to the lamps, the dark grey hood coming
 * down to 1.89 m in the middle and rising round the corners, the one-piece windscreen (2.56 - 3.49 m)
 * in its black frame, the round headlight under it between two slots and the small marker lamps; the
 * four lamps (white outside, red inside) in their square housings at 1.75 m; the coupler's black
 * recess 1.45 m wide.
 */
const HOOD: Pt[] = [[-1.65, 2.75], [-1.5, 2.42], [-1.3, 2.2], [-1.0, 2.02], [-0.6, 1.93], [0, 1.89], [0.6, 1.93], [1.0, 2.02], [1.3, 2.2], [1.5, 2.42], [1.65, 2.75], [1.65, 4.9], [-1.65, 4.9]];
const VIRM_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (3.33 m behind the tip, reach 1.96 m) runs on into the face
  wheelCut: { d: 3.33 - 1.96, y: 0.96 },
  dJoin: JOIN, dSide: 1.6, first: 2.87, roofFrom: 4.06, bulge: 0.08, cols: [6, 3, 1, 1], tolerance: 0.03,
  profile: PROFILE,
  corner: [[0.2, 0.42], [1.87, 0.45], [2.5, 0.6], [3.5, 0.75], [4.0, 0.65], [4.3, 0.42], [CAB_TOP, 0.12]],
  rows: ROWS,
  bands: () => [[0, 0.3, "skirtG"], [0.3, 9, "yellow"]],
  // the distant model's face: the yellow front under the grey hood
  lodBands: [[0, 0.3, "skirtG"], [0.3, 1.95, "yellow"], [1.95, 9, "hood"]],
  fields: [{ mat: "hood", pts: HOOD }],
  masks: [
    // the windscreen's black frame, the lamp housings, the coupler's recess
    { lat: [-1.03, 1.03], y: [2.5, 3.55], r: 0.04, mat: "black" },
    ...[[-0.83, -0.57], [-0.49, -0.23], [0.23, 0.49], [0.57, 0.83]].map(([a, e]) => ({ lat: [a!, e!] as const, y: [1.62, 1.86] as const, r: 0.03, mat: "lampBox" })),
    { lat: [-0.72, 0.72], y: [0.52, 1.43], r: 0.06, mat: "black" },
  ],
  panes: [{ lat: [-0.97, 0.97], y: [2.56, 3.49], r: 0.02 }],
  decals: [
    // the slots either side of the headlight
    { mat: "black", pts: box(0.32, 0.95, 2.36, 2.41) }, { mat: "black", pts: mirror(box(0.32, 0.95, 2.36, 2.41)) },
    // the small marker lamps over the slots
    { mat: "lampHead", pts: box(0.355, 0.405, 2.445, 2.495) }, { mat: "lampHead", pts: mirror(box(0.355, 0.405, 2.445, 2.495)) },
  ],
  lamps: [[0, 2.24, 0.1, "lampHead"], [-0.7, 1.74, 0.085, "lampHead"], [0.7, 1.74, 0.085, "lampHead"], [-0.36, 1.74, 0.075, "lampRed"], [0.36, 1.74, 0.075, "lampRed"]],
  wipers: [[[-0.8, 2.6], [0.1, 2.76]], [[-0.15, 2.6], [0.75, 2.76]]],
};

/** A door leaf pair 1.3 m wide (the published 1300 mm) centred at d, its leaves sliding apart. */
const door = (dc: number): Array<[number, number, number]> => [[dc - 0.65, dc, -1], [dc, dc + 0.65, 1]];
/** A field's rectangle in [d, y]. */
const rect = (d0: number, d1: number, [y0, y1]: readonly [number, number]): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y1]];

// The cars' sides, d behind the body's front end (the drawing at 20.85 px/m; the end car's d less the join)
const E = (d: number) => d - JOIN;
/** The end car: the door behind the cab, the double deck, the end section over the rear (motor) bogie with its door and window. */
const END = {
  doors: [E(3.52), E(22.62)] as const,
  upper: [[6.95, 7.53], [7.91, 9.5], [9.88, 11.46], [11.85, 13.43], [13.81, 15.4], [15.78, 17.36], [17.75, 19.33]].map(([a, e]): [number, number] => [E(a!), E(e!)]),
  lower: [[6.95, 7.53], [7.91, 9.5], [9.88, 11.46], [11.85, 13.43], [13.81, 15.4], [15.78, 17.36], [17.75, 18.32]].map(([a, e]): [number, number] => [E(a!), E(e!)]),
  mid: [[E(24.36), E(25.8)]] as Array<[number, number]>,
  lowerBand: [E(6.43), E(20.05)] as const,
  length: 27.28 - 0.25 - JOIN - 0.07,
};
/** An intermediate car (the first-class pantograph car of the drawing): an end section at each end, the long one at the front. */
const MIDDLE = {
  doors: [3.49, 23.0] as const,
  upper: [[6.32, 7.88], [8.45, 10.02], [10.59, 12.16], [12.73, 14.29], [14.77, 16.33], [16.71, 18.28], [18.66, 20.23]] as Array<[number, number]>,
  lower: [[7.31, 7.88], [8.45, 10.02], [10.59, 12.16], [12.73, 14.29], [14.77, 16.33], [16.71, 18.28], [18.66, 20.23]] as Array<[number, number]>,
  mid: [[0.85, 2.28], [25.12, 25.69]] as Array<[number, number]>,
  lowerBand: [6.08, 20.47] as const,
  length: 27.0 - 0.5,
};

/** The original scheme's fields: the lower deck's band, the end sections' bands either side of the doors. */
function originalFields(car: typeof END | typeof MIDDLE, end: boolean): Array<{ mat: string; pts: Pt[] }> {
  const [f, r] = car.doors, L = car.length - 0.02;
  const out = [{ mat: "blue", pts: rect(car.lowerBand[0], car.lowerBand[1], LOWER_BAND) }];
  // the end car's front section is painted by its sweeps
  if (!end) out.push({ mat: "blue", pts: rect(0.02, f - 0.65, MID_BAND) }, { mat: "blue", pts: rect(f + 0.65, f + 1.11, MID_BAND) });
  out.push({ mat: "blue", pts: rect(car === END ? E(21.49) : r - 1.11, r - 0.65, MID_BAND) }, { mat: "blue", pts: rect(r + 0.65, L, MID_BAND) });
  return out;
}

/**
 * The refurbished VIRMm's fields (photo-ns-virm-m-treinen-in-verschillende-uitvoeringen.jpg, 9404):
 * the upper deck's band round its windows only; one band from door to door, at the end sections'
 * height beside the doors, stepping down to the lower deck's band over the first windows; blue frames
 * round the yellow doors.
 */
function modernFields(car: typeof END | typeof MIDDLE, end: boolean): Array<{ mat: string; pts: Pt[] }> {
  const [f, r] = car.doors, L = car.length - 0.02, k = 0.1;
  const [a, e] = car.lowerBand, top = MID_BAND[1] + 0.07;
  const up = car.upper;
  const out: Array<{ mat: string; pts: Pt[] }> = [{ mat: "blue", pts: rect(up[0]![0] - 0.3, end ? E(20.65) : up[up.length - 1]![1] + 0.3, [UPPER_BAND[0] - 0.02, UPPER_BAND[1] + 0.02]) }];
  // the frames round both doors
  for (const dc of [f, r]) {
    out.push({ mat: "blue", pts: rect(dc - 0.65 - k, dc - 0.65, [1.05, 3.23]) }, { mat: "blue", pts: rect(dc + 0.65, dc + 0.65 + k, [1.05, 3.23]) }, { mat: "blue", pts: rect(dc - 0.65, dc + 0.65, [3.13, 3.23]) });
  }
  // behind the first door: full height, then the top stepping down to the lower band
  const f1 = f + 0.65 + k;
  out.push({ mat: "blue", pts: [[f1, 1.45], [f1 + 0.45, LOWER_BAND[0]], [a, LOWER_BAND[0]], [a, LOWER_BAND[1]], [f1 + 0.35, top], [f1, top]] });
  out.push({ mat: "blue", pts: rect(a, e, LOWER_BAND) });
  // ahead of the rear door: rising back to the end section's band
  const r0 = r - 0.65 - k;
  out.push({ mat: "blue", pts: [[e, LOWER_BAND[0]], [r0 - 0.6, MID_BAND[0]], [r0 - 0.6, top], [e, LOWER_BAND[1]]] });
  out.push({ mat: "blue", pts: rect(r0 - 0.6, r0, [MID_BAND[0], top]) });
  out.push({ mat: "blue", pts: rect(r + 0.65 + k, L, [MID_BAND[0], top]) });
  if (!end) out.push({ mat: "blue", pts: rect(0.02, f - 0.65 - k, [MID_BAND[0], top]) });
  return out;
}

const PALETTE = {
  yellow: c(NS_YELLOW), blue: c(NS_BLUE), hood: c("#3f4347", 0.45), roofG: c("#4c5054", 0.6), skirtG: c("#2a2c2f", 0.75),
  black: c("#151618", 0.4), lampBox: c("#c49a12", 0.4), roofE: c("#5d6165", 0.6), cabMask: c("#1d1f22", 0.3),
};

/** The hood: grey from the face back along the cab's sides, its lower edge rising from the lamps to 3.5 m, then back to the roof's edge 5.5 m behind the tip. */
const HOOD_SWEEP = {
  mat: "hood", front: [[1.55, -9], [4.07, -9]] as Pt[],
  back: [[1.55, 0.0], [1.87, 0.19], [2.0, 0.29], [2.5, 0.62], [3.0, 1.1], [3.5, 1.82], [3.52, 4.5], [3.65, 4.7], [3.84, 4.99], [4.07, 5.5]] as Pt[],
};
/** The hood's paint over the last 5 mm under the shoulder, where its sweep stops. */
const HOOD_EDGE = { mat: "hood", pts: rect(0, E(5.45), [ROOF_EDGE, S]) };

/** The original scheme, after NS's drawing and photo-horst-sevenum-irm-9585-...jpg: yellow, the decks' and end sections' window bands blue, the hood dark grey. */
const ORIGINAL: ShinkansenLivery = {
  title: "NS yellow, blue", number: "8632",
  palette: PALETTE,
  // the roof's grey from 5 mm under the shoulder (the hood's sweep stops there)
  bands: [[0, UPPER_BAND[0], "yellow"], [UPPER_BAND[0], UPPER_BAND[1], "blue"], [UPPER_BAND[1], ROOF_EDGE, "yellow"], [ROOF_EDGE, 9, "roofG"]],
  doors: [[0, MID_BAND[0], "yellow"], [MID_BAND[0], MID_BAND[1], "blue"], [MID_BAND[1], 9, "yellow"]],
  roof: "roofG", skirt: "yellow",
  endSweeps: [
    // no upper band ahead of its sweep down to the first door
    { mat: "yellow", front: [[3.1, -9], [3.87, -9]], back: [[3.1, 4.78], [3.5, 5.42], [3.87, 6.17]] },
    { mat: "blue", front: [[1.87, 4.17], [2.88, 4.17], [2.9, 4.3], [3.12, 4.78]], back: [[1.87, 4.6], [2.02, 4.6], [2.16, 4.84], [2.54, 5.52], [2.93, 6.14], [3.02, 6.33], [3.12, 6.78]] },
    // the band ahead of the first door
    { mat: "blue", front: [[1.87, 2.49], [2.88, 2.49]], back: [[1.87, 2.87], [2.88, 2.87]] },
    HOOD_SWEEP,
  ],
  sideFields: { end: [...originalFields(END, true), HOOD_EDGE], middle: originalFields(MIDDLE, false) },
};

/** The refurbished VIRMm (2016 - 2020) after photo-ns-virm-m-treinen-...jpg (9404): the stepped band, blue door frames, yellow doors. */
const MODERN: ShinkansenLivery = {
  title: "NS VIRMm", number: "9404",
  palette: PALETTE,
  bands: [[0, ROOF_EDGE, "yellow"], [ROOF_EDGE, 9, "roofG"]],
  roof: "roofG", skirt: "yellow",
  endSweeps: [HOOD_SWEEP],
  sideFields: { end: [...modernFields(END, true), HOOD_EDGE], middle: modernFields(MIDDLE, false) },
};

/** The roof wells over the cars' inner end sections: the end car's 4.9 m long, an intermediate car's 4.13 m at the front and 4.2 m at the rear. */
const WELLS = { C: 4.27, S: 3.68, ramp: 0.3, end: 4.9, front: 4.13, rear: 4.2, step: 4.0 };

/** Roof fittings, the bottom strip under the lower deck, the coupler, the cab's horns and grilles. */
function virmFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  // the dark strip along the low floor's bottom, between the bogies (the skirt's own slant)
  const reach = 1.25 + 0.46 + 0.25;
  const [s0, s1] = [car.trucks[0]! + reach + 0.03, car.trucks[1]! - reach - 0.03];
  const B = b.B(car.length / 2), A = b.A(car.length / 2), wl = b.wl(car.length / 2), wa = b.wa(car.length / 2);
  const z = (y: number) => wl + ((wa - wl) * (y - B)) / (A - B) + 0.004;
  m.scope("bottom strip", () => {
    for (const sd of [1, -1]) {
      const [x0, x1] = [X(s0), X(s1)];
      const p = [[x0, B + 0.005, sd * z(B + 0.005)], [x1, B + 0.005, sd * z(B + 0.005)], [x1, 0.58, sd * z(0.58)], [x0, 0.58, sd * z(0.58)]] as Array<[number, number, number]>;
      m.facets("skirtG", [p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!], [0, 0, sd]);
    }
  });
  m.scope("roof equipment", () => {
    // the grilles over the end sections' equipment, on the lowered roof of the well
    const Cw = WELLS.C;
    const grille = (d0: number, d1: number) => {
      at("roofE", d0, d1, Cw - 0.17, Cw + 0.04, -0.8, 0.8);
      for (let d = d0 + 0.3; d < d1 - 0.2; d += 0.45) at("black", d, d + 0.25, Cw + 0.04, Cw + 0.05, -0.7, 0.7);
    };
    if (car.end) {
      grille(car.length - WELLS.end + 0.4, car.length - 0.3);
      // the hood's two horns over the windscreen
      for (const sd of [1, -1]) at("black", E(1.85), E(2.35), CAB_TOP - 0.1, CAB_TOP + 0.08, sd > 0 ? 0.35 : -0.65, sd > 0 ? 0.65 : -0.35);
    } else grille(car.length - WELLS.rear + 0.4, car.length - 0.3);
  });
  if (car.end) {
    m.scope("coupler", () => {
      // the Scharfenberg coupler standing out of its recess
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.45, 0.02, 0.9, 1.06, 0.09);
      out("carbon", 0.02, 0.12, 0.82, 1.14, 0.2);
    });
  }
}

export const VIRM: ShinkansenSeries = {
  // VIRM-IV 108.56 m: end cars mBvk 27.28 m, intermediate cars ABv 26.5 / 27.5 m (here 27.0 m each); 3.02 m
  // wide, 4.67 m high (nl.wikipedia "VIRM"); the decks' floors 0.36 and 2.44 m, the end sections' 1.16 m
  endLength: 27.28, midLength: 27.0, W: 1.51, Y: 1.0, S, C, lean: 0.92, B: 0.2, A: 0.96,
  tiltSection: { wa: 0.99, wl: 0.975 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: VIRM_FACE,
  endCrown: [[0, CAB_TOP], [0.9, 4.58], [1.3, C]],
  windows: [LOWER, UPPER, MID], windowW: 1.55, pitch: 1.97,
  // the doors' narrow window in each leaf (the drawing)
  door: [1.12, 3.13, 1.9, 2.77], doorW: 1.3, doorGlassW: 0.28, doorGlassPair: 0.72,
  layout: {
    end: { doors: [...door(END.doors[0]), ...door(END.doors[1])], windows: END.lower, rows: [END.lower, END.upper, END.mid] },
    middle: { doors: [...door(MIDDLE.doors[0]), ...door(MIDDLE.doors[1])], windows: MIDDLE.lower, rows: [MIDDLE.lower, MIDDLE.upper, MIDDLE.mid] },
  },
  // the crew door's outline and window behind the face; the grilles on the hood's shoulders
  sidePanels: {
    end: [
      { d: [1.58, 2.22], y: [1.15, 3.12], kind: "seam" },
      { d: [1.68, 2.05], y: [2.25, 2.85], kind: "window" },
      ...[[2.7, 3.2], [3.27, 3.77], [3.84, 4.34]].map(([a, e]) => ({ d: [a!, e!] as const, y: [3.62, 3.98] as const, kind: "panel" as const, mat: "black" })),
      { d: [19.71, 20.43], y: [3.24, 3.72], kind: "panel", mat: "black" },
    ],
  },
  // 2'Bo' + 2'2' + 2'2' + Bo'2': the bogies under the end sections, 920 mm wheels
  bogieCentres: 19.8, wheelR: 0.46, wheelbase: 2.5, endBogies: [E(3.33), E(23.43)], midBogies: [3.35, 23.15],
  // the single-arm pantograph over an intermediate car's front end section (NS's drawing; one per four cars)
  onePantograph: true, pantographAt: 2.0,
  // the lowered roofs over the end sections (the drawing: 4.27 m, the side's top 3.68 m)
  roofWells: WELLS, endCrownStep: 0.65,
  fittings: virmFittings,
  cars: [4, 6],
  liveries: { yellowBlue: ORIGINAL, yellowGrey: MODERN },
  // 1,608 kW a four-car unit, 2,412 kW a six-car one (402 kW a car); 234 t / 349 t
  weight: { end: 62, middle: 55 }, power: 402, maxspeed: 160,
};
