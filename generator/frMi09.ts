// The RER MI 09 (Alstom / Bombardier, 2011 - 2017, RATP 3601 - 3740; the X'Trapolis Duplex derived
// from the MI 2N Alteo), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts).
// Five double-deck cars, R + M + M + M + R (112.0 m over the couplers: the end cars 24.5 m, the three
// motor cars 21.0 m; 2.90 m wide, 4.32 m high; bogie centres 16.7 m, bogie wheelbase 2.45 m; fr.wikipedia
// "MI 09" and "MI 2N"). Every car has three 2 m doors a side at the platform's level over the bogies and
// in the middle, a double-deck section between them with two big windows on each deck, and a short end
// section at its inner ends (the end car's cab at its front). The STIF scheme: white, the "vif-argent"
// grey band between the decks (across the door leaves too), the jade stripe down each door's middle (a
// stripe on each leaf's meeting edge, carried up over the door to the roof), the dark grey roof. The
// face: the dark grey mask round the one big windscreen widening below it into a trapezoid with the
// RATP emblem, the white cheeks at the lower corners with the oval tail-lamp housings and the headlights
// on the mask's edge, the dark grey bumper with its grilles and the coupler. A single-arm pantograph
// over the inner door of each end car, the leading one raised.
//
// Measured on the photographs in assets/ratp-mi09/ (SOURCES.md): the end car side-on on the Ile
// Corbiere bridge (photo-rer-a-sur-l-ile-corbiere.jpg, about 10.9 px/m, a linear perspective correction
// of 5 % over a door pitch; the doors, windows and cab door along the car), the end car three-quarter at
// Fontenay-sous-Bois (1858; heights at about 47 - 50 px/m between the side's bottom and its shoulder,
// a 1-D projective fit over the three doors), 1626 on the Nanterre viaduct (the middle car's end
// sections, the pantograph), 1622 head-on at Houilles (the face at 140 px/m across its 2.9 m), 1610's
// cab side at Charles-de-Gaulle - Etoile (the face's rake, the cab door), two units at Noisy-Champs
// (the face from above), La Defense (the grey band and door stripes), the St-Maur roof and the AX
// pantograph. See docs/models/france-trains.md.
//
// Heights over the rail; on the face d behind its tip (`t`), on the body d behind the body's front end
// (the face's join on the end car, the coupling gap on a middle car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body, behind the tip (just ahead of the cab door). */
const JOIN = 1.7;
/** d behind the tip to d on the end car's body. */
const T = (t: number) => t - JOIN;
/** The car lengths over the couplers and the coupling gap. */
const END_LENGTH = 24.5;
const MID_LENGTH = 21.0;
const GAP = 0.25;

/** The section: the shoulder and crown, the side's white bottom edge (the skirt below it). */
const S = 3.95;
const C = 4.32;
const SIDE_FOOT = 0.8;

/** The window rows: the lower deck, the upper deck, the end sections' small windows. */
const LOWER: readonly [number, number] = [1.25, 2.38];
const UPPER: readonly [number, number] = [3.13, 3.82];
const MID: readonly [number, number] = [2.3, 2.92];
/** The grey band between the decks: from just above the lower windows' head to the upper windows' sill. */
const GREY: readonly [number, number] = [2.27, UPPER[0]];
/** The doors: sill, head, the leaves' windows; the leaf pair's width and the jade stripe across their meeting edges. */
const DOOR: readonly [number, number, number, number] = [1.24, 3.55, 1.78, 3.0];
const DOOR_W = 2.45;
const STRIPE = 0.96;

// ---------------------------------------------------------------------------
// The cab face

/**
 * The face's centre line (1610 side-on, 1858, 1622 head-on): the bumper tucked under, the cheeks and
 * lamps upright, the windscreen raked back about 20 degrees from its foot (2.2 m) to its head (3.62 m),
 * the dome rounding over to the roof 1.7 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.42, 0.3], [0.6, 0.14], [0.85, 0.05], [1.1, 0], [1.6, 0], [2.1, 0.05], [2.6, 0.2], [3.1, 0.36], [3.62, 0.56],
  [3.95, 0.8], [4.12, 1.05], [4.25, 1.35], [C, JOIN],
];
/** The windscreen's glass and its black surround; the mask's top; the bumper's top. */
const GLASS: readonly [number, number] = [2.2, 3.62];
const MASK_TOP = 3.98;
const BUMPER = 1.02;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.55, 0.88, BUMPER, 1.5, GLASS[0] - 0.06, GLASS[0], GLASS[1], GLASS[1] + 0.06, MASK_TOP])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/**
 * The dark grey mask (1622 head-on): round the windscreen 0.1 m wide, its sides at 1.12 m down to the
 * windscreen's foot, then running in and down past the headlights to the bumper 0.62 m either side of
 * the centre - the white cheeks outside it.
 */
const MASK: Pt[] = [
  [-0.62, BUMPER - 0.02], [0.62, BUMPER - 0.02], [0.74, 1.3], [0.86, 1.62], [0.98, 1.95], [1.12, 2.16], [1.12, MASK_TOP],
  [-1.12, MASK_TOP], [-1.12, 2.16], [-0.98, 1.95], [-0.86, 1.62], [-0.74, 1.3],
];

const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.1, first: 3.64, reach: 0.07, roofFrom: 4.27, tolerance: 0.04, cols: [5, 3, 1, 1],
  profile: PROFILE,
  // broad and flat across, the corners rounded (Noisy-Champs from above), tighter up the dome
  corner: [[0.42, 0.42], [1.1, 0.45], [2.1, 0.4], [3.62, 0.34], [4.12, 0.22], [C, 0.06]],
  bulge: [[0.42, 0.03], [1.6, 0.06], [3.0, 0.05], [C, 0]],
  rows: ROWS,
  bands: () => [[0, BUMPER, "mask"], [BUMPER, 9, "body"]],
  lodBands: [[0, BUMPER, "mask"], [BUMPER, 1.95, "body"], [1.95, MASK_TOP, "mask"], [MASK_TOP, 9, "body"]],
  lodGlass: { hw: 1.0, y: GLASS },
  fields: [{ mat: "mask", pts: MASK }],
  masks: [
    // the windscreen's black surround; the oval tail-lamp housings in the cheeks; the coupler's recess
    { lat: [-1.06, 1.06], y: [GLASS[0] - 0.06, GLASS[1] + 0.06], r: 0.1, mat: "black" },
    { lat: [-1.36, -0.98], y: [1.34, 1.68], r: 0.17, mat: "black" },
    { lat: [0.98, 1.36], y: [1.34, 1.68], r: 0.17, mat: "black" },
    { lat: [-0.36, 0.36], y: [0.55, 0.88], r: 0.05, mat: "black" },
  ],
  panes: [{ lat: [-1.0, 1.0], y: GLASS, r: 0.08 }],
  decals: [
    // the bumper's grilles either side of the coupler
    ...[0.6, 0.7, 0.8].flatMap((y) => [{ mat: "black", pts: box(0.5, 1.05, y - 0.035, y), fine: 1 }, { mat: "black", pts: mirror(box(0.5, 1.05, y - 0.035, y)), fine: 1 }]),
  ],
  lamps: [
    [-0.82, 1.48, 0.1, "lampHead"], [0.82, 1.48, 0.1, "lampHead"], [-1.17, 1.51, 0.09, "lampRed"], [1.17, 1.51, 0.09, "lampRed"],
    // the chromed RATP emblem on the mask
    [0, 1.62, 0.12, "silver"],
  ],
  roofLamp: [0, 3.8, 0.08],
  wipers: [[[-0.15, 2.28], [-0.65, 3.3]]],
};

// ---------------------------------------------------------------------------
// The cars' sides

/** A door's two leaves centred at d (DOOR_W wide), sliding apart. */
const door = (dc: number): Array<[number, number, number]> => [[dc - DOOR_W / 2, dc, -1], [dc, dc + DOOR_W / 2, 1]];

/** The end car (t behind the tip, Corbiere side-on): the cab door, three doors, the double-deck sections' windows, the rear section's window. */
const END_T = {
  cabDoor: [1.9, 2.5] as const,
  doors: [4.88, 12.86, 20.8] as const,
  windows: [[7.0, 8.88], [8.98, 10.95], [14.67, 16.68], [16.78, 18.8]] as Array<[number, number]>,
  rear: [[22.95, 23.45]] as Array<[number, number]>,
};
/** A middle car's body: 1.13 m end sections, the 5.45 m double-deck sections, symmetric. */
const MID_BODY = MID_LENGTH - 2 * GAP;
const MID_D = {
  doors: [2.35, MID_BODY / 2, MID_BODY - 2.35] as const,
  windows: [[4.3, 6.25], [6.35, 8.3], [12.2, 14.15], [14.25, 16.2]] as Array<[number, number]>,
  ends: [[0.35, 0.85], [MID_BODY - 0.85, MID_BODY - 0.35]] as Array<[number, number]>,
};
const tt = (spans: ReadonlyArray<readonly [number, number]>) => spans.map(([a, e]): [number, number] => [T(a), T(e)]);

const END_LAYOUT: SeriesLayout = {
  doors: END_T.doors.flatMap((t) => door(T(t))), windows: tt(END_T.windows), rows: [tt(END_T.windows), tt(END_T.windows), tt(END_T.rear)],
};
const MID_LAYOUT: SeriesLayout = { doors: MID_D.doors.flatMap(door), windows: MID_D.windows, rows: [MID_D.windows, MID_D.windows, MID_D.ends] };

// ---------------------------------------------------------------------------
// The livery

/** A field's rectangle in [d, y]. */
const rect = (d0: number, d1: number, y0: number, y1: number): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y1]];

/** The jade stripe carried up from each door's head to the roof. */
const overDoors = (centres: readonly number[]) => centres.map((dc) => ({ mat: "jade", pts: rect(dc - STRIPE / 2, dc + STRIPE / 2, DOOR[1] + 0.01, S - 0.006) }));

const RATP: ShinkansenLivery = {
  title: "RATP", number: "1622",
  palette: {
    body: c("#eef0f0", 0.35), grey: c("#9a9fa4", 0.3), jade: c("#00a88e", 0.35), mask: c("#4a4f55", 0.4), roofG: c("#5f6468", 0.55),
    skirtG: c("#34373a", 0.7), black: c("#151618", 0.35), silver: c("#c9cdd1", 0.25), roofE: c("#4d5155", 0.6), cabMask: c("#1d1f22", 0.3),
  },
  bands: [[0, SIDE_FOOT, "skirtG"], [SIDE_FOOT, GREY[0], "body"], [GREY[0], GREY[1], "grey"], [GREY[1], S - 0.005, "body"], [S - 0.005, 9, "roofG"]],
  roof: "roofG", skirt: "skirtG",
  // the jade stripe down the door's middle, half of it on each leaf, the leaf's window over its inner part (1610 at Etoile)
  leafEdgeStripe: { w: STRIPE / 2 - 0.02, mat: "jade", glassShift: 0.2 },
  // the cab's side white ahead of the cab door's rear edge, the grey band starting behind it (1858, 1626)
  endSweeps: [{ mat: "body", front: [[GREY[0], -9], [GREY[1], -9]], back: [[GREY[0], END_T.cabDoor[1] + 0.05], [GREY[1], END_T.cabDoor[1] + 0.05]] }],
  sideFields: { end: overDoors(END_T.doors.map(T)), middle: overDoors(MID_D.doors) },
};

// ---------------------------------------------------------------------------
// Fittings

/** The roof's flush air-conditioning grilles over each double-deck section, the pantograph's equipment boxes, the coupler. */
function mi09Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const sections: Array<[number, number]> = car.end ? [[T(7.4), T(9.4)], [T(15.2), T(17.2)]] : [[4.8, 6.8], [12.7, 14.7]];
  m.scope("roof grilles", () => {
    for (const [d0, d1] of sections) for (const sd of [1, -1]) {
      crownPane(m, b, X, sd, "roofE", [d0, d1], [0.2, 0.75], 0.005);
      for (let d = d0 + 0.15; d + 0.12 < d1; d += 0.42) crownPane(m, b, X, sd, "black", [d, d + 0.12], [0.25, 0.7], 0.009);
    }
  });
  m.scope("roof equipment", () => {
    if (car.end) {
      // the boxes ahead of the pantograph and the fairing behind it over the rear section
      at("roofE", T(17.9), T(19.6), C - 0.1, C + 0.16, -0.75, 0.75);
      at("roofE", T(22.0), T(24.0), C - 0.1, C + 0.2, -0.82, 0.82);
    } else {
      // the motor cars' traction equipment over their end sections
      at("roofE", 0.3, 2.6, C - 0.1, C + 0.14, -0.8, 0.8);
      at("roofE", car.length - 2.6, car.length - 0.3, C - 0.1, C + 0.14, -0.8, 0.8);
    }
  });
  if (car.end) {
    m.scope("coupler", () => {
      // the automatic coupler standing out of its recess
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("carbon", -0.35, 0.02, 0.66, 0.8, 0.09);
      out("carbon", 0.02, 0.1, 0.6, 0.86, 0.2);
    });
  }
}

export const MI09: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W: 1.45, Y: 1.0, S, C, lean: 0.97, B: 0.42, A: SIDE_FOOT,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [LOWER, UPPER, MID], windowW: 1.9, pitch: 2.0, windowCornerR: 0.12,
  // a big window in each leaf, the jade stripe on its meeting edge
  door: DOOR, doorW: DOOR_W, doorGlassW: 0.6, doorGlassR: 0.1,
  layout: { end: END_LAYOUT, middle: MID_LAYOUT },
  sidePanels: {
    // the cab door's outline and its tall window (d behind the tip)
    end: [{ d: END_T.cabDoor, y: [DOOR[0], DOOR[1]], kind: "seam" }, { d: [2.05, 2.35], y: [1.84, 3.34], kind: "window" }],
  },
  // Bo'Bo' motor cars, the trailers' bogies under the end doors; 840 mm wheels, 2.45 m wheelbase
  bogieCentres: 16.7, wheelR: 0.42, wheelbase: 2.45, endBogies: [T(4.6), T(21.3)], midBogies: [1.9, MID_BODY - 1.9],
  // the pantographs on the end cars over their inner door, the leading one raised
  pantograph: "single", endPantograph: true, trailingLowered: true, pantographAt: T(20.7),
  fittings: mi09Fittings,
  cars: [5],
  liveries: { ratp: RATP },
  // 288 t and 3,900 kW the five-car unit: about 51 t a trailer, 62 t a motor car; the power shared over the cars
  weight: { end: 51, middle: 62 }, power: 780, maxspeed: 120,
};
