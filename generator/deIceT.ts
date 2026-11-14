// The ICE T (DB class 411/415, the OBB's 4011; Siemens, DWA and Fiat 1999) on the series kit
// (shinkansen.ts): the narrow tilting body, tucked in under the belly and drawn in over a flatter roof;
// the short, blunt nose on its round bumper, the big raked windscreen with its tinted head, the slanted
// lamp clusters and the DB logo between them; the lounge's black glass behind the cab, pointed toward
// the nose; the red stripe ending in a slant under it and broken by the "ICE" lettering; the black window
// band on every car, interrupted at the doors with their porthole windows ("Dritteleinstieg": one door a
// side about a third along each car); the pantograph over the end car's rear bogie. Registered in
// deUnits.ts. See docs/models/germany-trains.md and assets/db-ice-t/SOURCES.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { insulator } from "./czElectricKit.ts";
import { block } from "./vehicleParts.ts";

const ICE_WHITE = "#eceeee";

/** Where the cab face meets the body, behind the tip; the crown still rises behind it (`endCrown`). */
const DJOIN = 4.2;

/** The stripe (Kinding and Hannover photographs: 0.5 - 0.67 m over the door sill, under the window band). */
const STRIPE: readonly [number, number] = [1.66, 1.83];
/** The black window band and the windows in it (0.8 - 1.4 m over the door sill). */
const BAND: readonly [number, number] = [1.9, 2.6];
const WINDOWS: readonly [number, number] = [1.94, 2.56];

/** The livery: white, the stripe, the black band; the stripe's slanted front under the lounge glass, the "ICE" lettering in a gap of the stripe, the OBB's logo in another. */
function iceTLivery(title: string, number: string, obb = false): ShinkansenLivery {
  const bands: ShinkansenLivery["bands"] = [[0, STRIPE[0], "body"], [STRIPE[0], STRIPE[1], "stripe"], [STRIPE[1], 9, "body"]];
  const gap = (d0: number, d1: number) => ({ mat: "body", front: [[STRIPE[0] - 0.01, d0], [STRIPE[1] + 0.01, d0]] as Pt[], back: [[STRIPE[0] - 0.01, d1], [STRIPE[1] + 0.01, d1]] as Pt[] });
  return {
    title, number,
    palette: {
      body: c(ICE_WHITE), stripe: c("#ec0016"), roofG: c("#dfe2e4", 0.55), skirtG: c("#ced2d5", 0.55), cabMask: c("#17191c", 0.3),
      band: c("#1b1d21", 0.18), iceGrey: c("#8f969d", 0.45), logoRed: c("#ec0016"), lampG: c("#5a6068", 0.3), screen: c("#3e4a55", 0.08),
      screenTint: c("#40324f", 0.08), grille: c("#45494e", 0.6),
    },
    bands, doors: bands, roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the stripe's front end, slanted (its foot further forward), on the face's corners too
      { mat: "body", face: true, front: [[STRIPE[0] - 0.01, -9], [STRIPE[1] + 0.01, -9]], back: [[STRIPE[0] - 0.01, 2.05], [STRIPE[1] + 0.01, 2.3]] },
      // the gap for the "ICE" lettering, between the lounge and the door
      gap(4.15, 5.45),
      ...(obb ? [gap(13.15, 14.6)] : []),
      // the lounge's black glass behind the cab: pointed toward the nose at the sill, its head curving down along the cab's rear
      { mat: "band", front: [[BAND[0], 2.75], [2.05, 2.95], [2.2, 3.2], [2.35, 3.5], [2.48, 3.85], [BAND[1], 4.3]], back: [[BAND[0], 6.7], [BAND[1], 6.7]] },
      // the frame between the cab's side window and the lounge's
      { mat: "grille", front: [[BAND[0], 4.3], [BAND[1], 4.3]], back: [[BAND[0], 4.36], [BAND[1], 4.36]] },
    ],
    endLettering: [
      { text: "ICE", d: 4.3 - DJOIN, y: 1.5, h: 0.46, mat: "iceGrey" },
      ...(obb ? [{ text: "OBB", d: 13.3 - DJOIN, y: 1.625, h: 0.25, mat: "logoRed" }] : []),
    ],
  };
}

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** A lamp cluster (viewer's right): a parallelogram leaning out toward its top, under the windscreen's corner. */
const CLUSTER: Pt[] = [[0.56, 1.52], [0.9, 1.52], [1.04, 1.95], [0.7, 1.95]];
/** Its lens, the outer half. */
const LENS: Pt[] = [[0.76, 1.56], [0.88, 1.56], [1.0, 1.91], [0.88, 1.91]];
/** Its four slats on the inner side, beside the lens. */
const SLATS: Pt[][] = [0, 1, 2, 3].map((k) => {
  const y = 1.58 + k * 0.085;
  const l = 0.6 + (y - 1.52) * 0.33;
  return [[l, y], [l + 0.11, y], [l + 0.12, y + 0.035], [l + 0.01, y + 0.035]];
});
/** The DB logo, 0.4 by 0.19 m, between the lamp clusters: its red frame and the letters D and B drawn in bars. */
const LOGO_Y = -0.48;
const DB_LOGO: Pt[][] = [
  box(-0.2, 0.2, 2.02, 2.04), box(-0.2, 0.2, 2.19, 2.21), box(-0.2, -0.18, 2.04, 2.19), box(0.18, 0.2, 2.04, 2.19),
  box(-0.14, -0.12, 2.065, 2.165), box(-0.12, -0.05, 2.065, 2.083), box(-0.12, -0.05, 2.147, 2.165),
  [[-0.05, 2.065], [-0.032, 2.083], [-0.05, 2.083]], [[-0.05, 2.147], [-0.032, 2.147], [-0.05, 2.165]],
  box(-0.05, -0.032, 2.083, 2.147),
  box(0.02, 0.04, 2.065, 2.165), box(0.04, 0.11, 2.065, 2.083), box(0.04, 0.105, 2.106, 2.124), box(0.04, 0.105, 2.147, 2.165),
  box(0.11, 0.128, 2.083, 2.106), box(0.105, 0.123, 2.124, 2.147),
].map((pts) => pts.map(([l, y]): Pt => [l, y + LOGO_Y]));

/** The windscreen's outline (head-on), right half from the foot's centre to the head's: a rounded U, wider at its head. */
function screenHalf(grow: number): Pt[] {
  const g = grow;
  return [[0, 2.15 - g], [0.45, 2.17 - g], [0.66 + g * 0.7, 2.24 - g * 0.7], [0.82 + g, 2.4], [1.02 + g, 2.8], [1.16 + g, 3.2], [1.13 + g, 3.37], [0.95 + g * 0.7, 3.48 + g * 0.7], [0.55, 3.53 + g], [0, 3.54 + g]];
}
/** A closed outline from a right half (foot's centre to head's centre), counter-clockwise from the foot's centre. */
const closed = (half: Pt[]): Pt[] => [...half, ...mirror(half).slice(1, -1)];
/** The part of the windscreen above y (its tinted head). */
const screenAbove = (y: number): Pt[] => {
  const h = screenHalf(0).filter(([, py]) => py > y);
  const below = screenHalf(0).filter(([, py]) => py <= y);
  const [a, b] = [below[below.length - 1]!, h[0]!];
  const cut: Pt = [a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), y];
  return closed([[0, y], cut, ...h]);
};

/**
 * The nose (side-on and head-on photographs, Kinding at about 89 px/m over the rail at the tip): the round
 * bumper from the skirt to 1.45 m, its front 0.95 m up, its top rounding back 0.45 m to the face; the face
 * rising steeply past the lamp clusters (1.5 - 1.88 m) to the windscreen's foot at 2.17 m, 0.95 m behind
 * the tip; the windscreen raked about 35 degrees to its head at 3.5 m, 3.05 m behind the tip; the roof
 * reaching the body's 3.85 m 5.5 m behind the tip. In plan the bumper is round; the face above it rolls
 * into the sides in deep corners, the windscreen wrapping round them.
 */
const ICE_T_FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 3.6, first: 6.8, roofFrom: 3.6, cols: [6, 4, 1, 1], tolerance: 0.03,
  profile: [[0.6, 0.34], [0.68, 0.15], [0.8, 0.05], [0.95, 0], [1.15, 0.01], [1.28, 0.05], [1.38, 0.13], [1.45, 0.3], [1.48, 0.45], [1.53, 0.55], [1.7, 0.62], [1.9, 0.7], [2.1, 0.88], [2.3, 1.12], [2.6, 1.52], [2.9, 1.98], [3.2, 2.5], [3.5, 3.05], [3.6, 3.4], [3.66, 3.75], [3.7, DJOIN]],
  corner: [[0.6, 1.0], [0.95, 1.05], [1.4, 1.0], [1.48, 0.9], [1.55, 0.8], [1.9, 0.85], [2.3, 0.95], [2.9, 1.0], [3.4, 0.9], [3.6, 0.6], [3.7, 0.3]],
  cornerDepth: [[0.6, 1.25], [0.95, 1.35], [1.4, 1.35], [1.48, 1.3], [1.55, 1.25], [1.9, 1.5], [2.3, 1.9], [2.9, 2.2], [3.4, 1.8], [3.6, 1.0], [3.7, 0.4]],
  rows: [0.6, 0.68, 0.8, 0.95, 1.05, 1.15, 1.28, 1.38, 1.45, 1.48, 1.53, 1.6, 1.7, 1.8, 1.9, 2.1, 2.3, 2.6, 2.9, 3.2, 3.5, 3.6, 3.66, 3.7],
  bands: () => [[0, 9, "body"]],
  // (the distant model's face: the black screen)
  lodBands: [[0, 2.15, "body"], [2.15, 3.54, "cabMask"]],
  fields: [
    // the black rubber round the windscreen, the glass and its tinted head
    { mat: "cabMask", pts: closed(screenHalf(0.05)) },
    { mat: "screen", pts: closed(screenHalf(0)) },
    { mat: "screenTint", pts: screenAbove(3.22) },
    // the lamp clusters
    { mat: "lampG", pts: CLUSTER }, { mat: "lampG", pts: mirror(CLUSTER) },
    { mat: "lampHead", pts: LENS }, { mat: "lampHead", pts: mirror(LENS) },
    // the joint along the bumper's top
    { mat: "rubber", pts: [[-1.0, 1.46], [1.0, 1.46], [1.0, 1.48], [-1.0, 1.48]] },
  ],
  panes: [],
  lodGlass: { hw: 1.0, y: [2.17, 3.52] },
  decals: [
    // the coupler flap's two halves meeting down the bumper's middle
    { mat: "rubber", pts: [[-0.008, 0.66], [0.008, 0.66], [0.008, 1.44], [-0.008, 1.44]], fine: 1 },
    ...[...SLATS, ...SLATS.map(mirror)].map((pts) => ({ mat: "grille", pts, fine: 1 })),
    ...DB_LOGO.map((pts) => ({ mat: "logoRed", pts, fine: 1 })),
  ],
  // the third headlight over the windscreen
  roofLamp: [0, 3.6, 0.06],
  // one long wiper, parked upright at the screen's right edge
  wipers: [[[0.52, 2.28], [0.76, 3.05]]],
};

/** Windows n of them w wide, `pitch` apart, the first centred at d0 (body d). */
const windowRow = (d0: number, n: number, pitch: number, w: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, k) => [d0 + k * pitch - w / 2, d0 + k * pitch + w / 2] as const);

/** The end car's door (body d) behind the lounge, and the intermediate car's a third along it. */
const END_DOOR: readonly [number, number] = [6.8 - DJOIN, 7.8 - DJOIN];
const MID_DOOR: readonly [number, number] = [6.15, 7.15];
const W = 1.6, PITCH = 1.95;
/** The black band's spans (body d) on the end car and the intermediate car: between the doors and the car's ends. */
const END_BANDS: Array<readonly [number, number]> = [[END_DOOR[1] + 0.12, 22.6]];
const MID_BANDS: Array<readonly [number, number]> = [[0.35, MID_DOOR[0] - 0.12], [MID_DOOR[1] + 0.12, 25.05]];

/** The black window band, the roof equipment and the underfloor. */
function iceTFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("window band", () => { for (const sd of [1, -1]) for (const [d0, d1] of car.end ? END_BANDS : MID_BANDS) sidePanel(m, b, X, sd, "band", d0, d1, BAND[0], BAND[1], 0.003, 0.003); });
  const C = 3.85;
  // the air conditioning's grilles on the roof: the end car's behind the cab, the others' over the inner end
  m.scope("roof grilles", () => {
    const [d0, d1] = car.end ? [0.6, 2.2] : [car.length - 3.2, car.length - 1.6];
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "grille", [d0, d1], [0.1, 0.55], 0.006);
  });
  if (car.end) m.scope("roof line", () => {
    // ahead of the pantograph over the rear bogie: the main breaker on two insulators; the train's roof line on to the inner end
    const p = car.trucks[1]!;
    block(m, "roofG", X(p - 1.9), X(p - 3.5), C - 0.05, C + 0.06, -0.4, 0.4);
    for (const d of [p - 2.2, p - 3.2]) insulator(m, X(d), 0, C + 0.05, C + 0.28);
    block(m, "pantograph", X(p - 2.1), X(p - 3.3), C + 0.28, C + 0.38, -0.1, 0.1);
    block(m, "pantograph", X(car.length - 0.1), X(p + 1.2), C + 0.1, C + 0.14, -0.3, -0.26);
    for (const d of [p + 1.6, car.length - 0.5]) insulator(m, X(d), -0.28, C - 0.04, C + 0.1);
  });
  else m.scope("roof line", () => {
    block(m, "pantograph", X(car.length - 0.1), X(0.1), C + 0.1, C + 0.14, -0.3, -0.26);
    for (const d of [0.5, car.length / 2, car.length - 0.5]) insulator(m, X(d), -0.28, C - 0.04, C + 0.1);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.0), X(car.trucks[0]! + 2.0), 0.35, 0.62, -1.14 * 0.85, 1.14 * 0.85));
}

export const ICE_T: ShinkansenSeries = {
  // 27.45 m end cars and 25.9 m intermediate cars, up to 2.85 m wide and 3.91 m high, floor 1.25 m (de.wikipedia
  // "DB-Baureihe 411", after ETR 1999); widest from the window band up, tucked in below (the inner end's photograph)
  endLength: 27.45, midLength: 25.9, W: 1.4, Y: 1.5, S: 3.0, C: 3.85, lean: 1.425 / 1.4, B: 0.6, A: 1.0,
  tiltSection: { wa: 0.896, wl: 0.81, roofPower: 2.4 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICE_T_FACE,
  // the end car's roof rising from the face's 3.7 m to the body's 3.85 m
  endCrown: [[0, 3.7], [0.6, 3.78], [1.3, 3.85]],
  layout: {
    end: { doors: [[END_DOOR[0], END_DOOR[1], -1]], windows: windowRow(END_DOOR[1] + 0.25 + W / 2, 8, PITCH, W) },
    middle: { doors: [[MID_DOOR[0], MID_DOOR[1], 1]], windows: [...windowRow(1.4, 2, PITCH, W), ...windowRow(MID_DOOR[1] + 0.25 + W / 2, 9, PITCH, W)] },
  },
  windows: [WINDOWS], windowW: W, pitch: PITCH, door: [1.15, 3.12, 1.85, 2.62], doorW: 1.0, doorGlassW: 0.42, doorGlassR: 0.21,
  // bogie centres 19.0 m, wheelbase 2.7 m (Fiat); the end car's 5.0 and 24.0 m behind the tip
  bogieCentres: 19.0, wheelR: 0.445, wheelbase: 2.7, endBogies: [5.0 - DJOIN, 24.0 - DJOIN],
  // the end cars carry the pantographs (with the transformer), over their rear bogies; one raised in the train
  endPantograph: true, trailingLowered: true, pantographAt: 24.0 - DJOIN,
  fittings: iceTFittings,
  liveries: {
    dbIce: iceTLivery("DB ICE", "411 001"),
    obb: iceTLivery("OBB ICE T", "4011 090", true),
  },
  weight: { end: 52, middle: 48 }, power: 500, maxspeed: 230,
};
