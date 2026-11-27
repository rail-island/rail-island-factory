// The OBB 4010 "Transalpin" (proc-vehicle-obb-4010): the SGP six-car electric multiple unit of
// 1965-1978 (designer Johann Benda), drawn on the series kit (shinkansen.ts) with its own cab face
// (seriesCab.ts), measured on the reference photographs (assets/obb-4010/SOURCES.md;
// docs/models/austria-units.md):
//
// - the 4010 power car (16.82 m, Bo'Bo', 2,500 kW) leads: the cab, the machine room behind its
//   louvred grilles, the luggage and guard's compartment, no seats; the single-arm pantograph at its
//   inner end and the brake resistors' long housing on its roof;
// - the 7010 intermediate cars (26.4 m), a door at each end, the open saloon's windows between;
// - the 6010 driving trailer (26.7 m): the same face, the luggage compartment behind the cab, a door
//   and the first-class saloon;
// - the face: nearly upright under the roof's dome, the two big windscreens and the corner windows
//   wrapping round onto the cab sides, the round head lamps over the tail lamps low on the corners,
//   the top lamp on the dome, buffers and a screw coupling at the cab ends (Scharfenberg couplers
//   between the cars);
// - two liveries: the delivery's blue window band on ivory with the blue face, the lamps on red
//   fields framed in ivory (blueIvory: sapphire, from the 1970s ultramarine with the "Pflatsch"), and
//   the 1990s rebuild's traffic red with the umbra grey window band over the grey-white band
//   (trafficRed, Valousek design).
//
// Heights over the rail; on the face d behind its tip, else d behind the body's front end (the
// face's join, JOIN behind the tip).

import { ngon, type MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";

/** Lengths over the buffers (cab end) and couplers (de.wikipedia "OBB 4010": 149.12 m in six cars). */
const POWER_LENGTH = 16.82;
const MIDDLE_LENGTH = 26.4;
const TRAILER_LENGTH = 26.7;
/** Where the face's dome reaches the crown, behind the tip. */
const JOIN = 1.0;
/** The body: 2.83 m wide, the crown 3.86 m, the shoulder (the eave) 3.42 m, the side's foot 1.0 m. */
const W = 1.415;
const C = 3.85;
const S = 3.34;
const FOOT = 1.0;

/** The side's paint and window heights (Leoben and Salzburg photographs, about 63 and 135 px/m). */
const WIN: readonly [number, number] = [2.11, 3.14];
/** The windscreen and the corner windows (the head-on photographs, about 200 px/m at the face). */
const SCREEN: readonly [number, number] = [2.34, 3.2];
/** The face's lamps: the head lamps' and the tail lamps' heights and their lat. */
const LAMP_Y = 1.9;
const TAIL_Y = 1.6;
const LAMP_LAT = 1.0;

/**
 * The face's centre line: upright from the buffer beam to the windscreen's foot, the windscreen
 * leaning back about 9 degrees, the dome rounding back over its head to the crown 1.0 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.82, 0.05], [1.3, 0], [2.2, 0.01], [SCREEN[0], 0.02], [SCREEN[1], 0.15], [3.31, 0.2], [3.42, 0.27], [3.54, 0.37], [3.64, 0.5], [3.73, 0.64], [3.8, 0.8], [C, JOIN],
];
/** The plan: the face flat across, its corners rounded about 0.42 m; the dome's corners widening as it falls back. */
const CORNER: Pt[] = [[0.82, 0.4], [SCREEN[1], 0.42], [3.42, 0.46], [3.64, 0.42], [3.8, 0.3], [C, 0.1]];

/** The windscreens (lat spans); the corner windows are painted round the corners onto the cab side (`paint`). */
const BIG: Array<readonly [number, number]> = [[-1.08, -0.045], [0.045, 1.08]];
/** How far back the corner windows reach along the cab side, behind the tip. */
const CORNER_BACK = 0.98;
/** Where they start round the corner at their foot, behind the tip (the windscreen's pillar beside them). */
const CORNER_FRONT = 0.075;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.08, 1.33, 1.36, 1.77, 2.27, 3.25, 3.28])].sort((a, b) => a - b);

/** The Pflatsch (the OBB emblem of 1974) over the number: three slanted strokes, [lat, y] about its centre, 0.72 m by 0.45 m. */
const EMBLEM_AT: Pt = [0.04, LAMP_Y + 0.1];
const EMBLEM: Pt[][] = [
  [[-0.12, 0.06], [0.36, 0.06], [0.36, 0.225], [-0.02, 0.225]],
  [[-0.18, -0.06], [0.06, -0.06], [0.2, 0.06], [-0.04, 0.06]],
  [[-0.36, -0.225], [0.02, -0.225], [0.12, -0.06], [-0.36, -0.06]],
].map((q) => q.map(([l, y]): Pt => [EMBLEM_AT[0] + l, EMBLEM_AT[1] + y]));

/** The OBB 4010's face (Selzthal and Wien Westbahnhof head-on photographs, the Basel and Wien West 1970 ones). */
const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.42, roofFrom: 3.31, first: JOIN + 5.6, bulge: 0.03, tolerance: 0.04, cols: [4, 2, 1, 1],
  profile: PROFILE,
  corner: CORNER,
  rows: ROWS,
  panes: [
    ...BIG.map(([a, e]) => ({ lat: [a, e] as const, y: [SCREEN[0], SCREEN[1]] as const, r: 0.09 })),
  ],
  // the corner windows' glass carried round onto the cab side, back to the cab door's pillar
  paint: [
    { mat: "cabGlass", front: [[SCREEN[0], CORNER_FRONT + 0.02], [SCREEN[1], CORNER_FRONT + 0.15]], back: [[SCREEN[0], CORNER_BACK], [SCREEN[1] - 0.03, CORNER_BACK - 0.03]] },
  ],
  // the round head lamps over the red tail lamps in their rings, low on each corner of the face
  pods: [1, -1].flatMap((sd): NonNullable<SeriesCabFace["pods"]> => [
    { lat: sd * LAMP_LAT, y: LAMP_Y + 0.02, w: 0.4, h: 0.4, r: 0.2, proud: 0.05, depth: 0.03, mat: "lampPlate", lamps: [[0, 0.13, "lampHead"]] as const },
    { lat: sd * LAMP_LAT, y: TAIL_Y - 0.02, w: 0.32, h: 0.32, r: 0.16, proud: 0.03, depth: 0.03, mat: "lampPlate", lamps: [[0, 0.075, "lampRed"]] as const },
  ]),
  decals: EMBLEM.map((pts) => ({ mat: "emblem", pts })),
  number: { lat: -0.52, y: 1.53, h: 0.14, mat: "faceNumber" },
  wipers: [[[-0.75, 3.14], [-0.4, 2.52]], [[0.35, 3.14], [0.7, 2.52]]],
};

// ---------------------------------------------------------------------------
// Liveries

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/** The red field round a lamp pair (viewer's right side; the other mirrored): its inner edge leaning out toward the top; grown by g for its ivory frame. */
const lampField = (g: number): Pt[] => [[0.64 - g, 1.36 - g], [1.36 + g, 1.36 - g], [1.3 + g, 2.27 + g], [0.82 - g, 2.27 + g]];

/** The blue window band and the lines under it (Leoben photograph): heights. */
const BLUE_BAND: readonly [number, number] = [2.08, 3.23];
const LINE_IVORY: readonly [number, number] = [2.02, 2.08];
const LINE_BLUE: readonly [number, number] = [1.93, 2.02];
const LOW_LINE: readonly [number, number] = [1.19, 1.3];
/** The face's blue carried onto the cab side down to the low line: its back edge, [y, d behind the tip]. */
const SWEEP_BACK: Pt[] = [[LOW_LINE[0], 0.55], [1.4, 0.75], [1.6, 1.05], [1.8, 1.45], [LINE_BLUE[1], 1.95], [BLUE_BAND[0], 2.15]];
const grow = (pts: readonly Pt[], g: number): Pt[] => pts.map(([y, d]): Pt => [y, d + g]);

function blueIvory(number: string): ShinkansenLivery {
  return {
    title: "Blue, ivory", number,
    palette: {
      blue: c("#1f3f8f", 0.45), ivory: c("#ece3c4", 0.45), roofI: c("#e4dbbd", 0.55), red: c("#d22a2e", 0.45),
      skirtG: c("#2f3236", 0.7), rubber: c("#1b1c1e", 0.6), chrome: { color: "#d4d7da", metallic: 0.8, roughness: 0.2 },
      lettering: c("#2a2c30", 0.4), emblem: c("#f2efe6", 0.4), faceNumber: c("#f2efe6", 0.4), lampPlate: c("#ece3c4", 0.45), domeLamp: c("#e4dbbd", 0.5), resFrame: c("#a3a8ad", 0.45), steel: c("#3a3d40", 0.55), underframe: c("#1f2124", 0.7), frame: c("#9da3a8", 0.4), grid: c("#26292c", 0.7),
    },
    bands: [[0, LOW_LINE[0], "ivory"], [LOW_LINE[0], LOW_LINE[1], "blue"], [LOW_LINE[1], LINE_BLUE[0], "ivory"], [LINE_BLUE[0], LINE_BLUE[1], "blue"], [LINE_IVORY[0], LINE_IVORY[1], "ivory"], [BLUE_BAND[0], BLUE_BAND[1], "blue"], [BLUE_BAND[1], 9, "ivory"]],
    // the face: the blue under the ivory dome, the ivory line along its foot and the blue line over the windscreens
    front: [[0, 1.08, "skirtG"], [1.08, 1.3, "blue"], [1.3, 1.36, "ivory"], [1.36, 3.25, "blue"], [3.25, 3.28, "ivory"], [3.28, 3.31, "blue"], [3.31, 9, "ivory"]],
    roof: "roofI", skirt: "skirtG",
    // the face's blue wrapping round the corners onto the cab side, framed by the ivory line
    endSweeps: [
      { mat: "ivory", front: [[LOW_LINE[0], 0], [BLUE_BAND[0], 0]], back: grow(SWEEP_BACK, 0.07) },
      { mat: "blue", front: [[LOW_LINE[0], 0], [BLUE_BAND[0], 0]], back: SWEEP_BACK },
    ],
    faceFields: [
      { mat: "ivory", pts: lampField(0.05) }, { mat: "ivory", pts: mirror(lampField(0.05)) },
      { mat: "red", pts: lampField(0) }, { mat: "red", pts: mirror(lampField(0)) },
    ],
  };
}

/** The Valousek scheme's heights (Salzburg and Selzthal photographs): red, the grey-white band, red, the umbra grey window band, red. */
const VG_WHITE: readonly [number, number] = [1.33, 1.77];
const VG_GREY: readonly [number, number] = [2.0, 3.11];

function trafficRed(number: string, greyFrom: number): ShinkansenLivery {
  return {
    title: "Traffic red", number,
    palette: {
      red: c("#cf1f1b", 0.45), roofR: c("#bf201c", 0.6), white: c("#e4e4df", 0.45), umbra: c("#4a4e52", 0.45),
      skirtG: c("#2f3236", 0.7), rubber: c("#1b1c1e", 0.6), chrome: { color: "#d4d7da", metallic: 0.8, roughness: 0.2 },
      lettering: c("#f2f2ee", 0.4), emblem: c("#f2f2ee", 0.4), faceNumber: c("#2a2c30", 0.4), lampPlate: c("#cf1f1b", 0.45), domeLamp: c("#bf201c", 0.5), resFrame: c("#a3a8ad", 0.45), steel: c("#3a3d40", 0.55), underframe: c("#1f2124", 0.7), frame: c("#9da3a8", 0.4), grid: c("#26292c", 0.7),
    },
    bands: [[0, VG_WHITE[0], "red"], [VG_WHITE[0], VG_WHITE[1], "white"], [VG_WHITE[1], VG_GREY[0], "red"], [VG_GREY[0], VG_GREY[1], "umbra"], [VG_GREY[1], 9, "red"]],
    front: [[0, 1.08, "skirtG"], [1.08, VG_WHITE[0], "red"], [VG_WHITE[0], VG_WHITE[1], "white"], [VG_WHITE[1], 9, "red"]],
    roof: "roofR", skirt: "skirtG",
    // the cab section red over the grey band, the umbra grey round the corner windows
    endSweeps: [
      { mat: "red", front: [[VG_GREY[0], 0], [VG_GREY[1], 0]], back: [[VG_GREY[0], greyFrom], [VG_GREY[1], greyFrom]] },
      { mat: "umbra", front: [[SCREEN[0] - 0.09, 0], [SCREEN[1] + 0.06, 0]], back: [[SCREEN[0] - 0.09, CORNER_BACK + 0.12], [SCREEN[1] + 0.06, CORNER_BACK + 0.12]] },
    ],
    faceFields: [
      { mat: "umbra", pts: [[-1.42, SCREEN[0] - 0.09], [1.42, SCREEN[0] - 0.09], [1.42, SCREEN[1] + 0.06], [-1.42, SCREEN[1] + 0.06]] },
    ],
  };
}

// ---------------------------------------------------------------------------
// The cars' sides

const span = (d0: number, d1: number): readonly [number, number] => [d0 - JOIN, d1 - JOIN];
/** n windows w wide at a pitch, the first starting at d0 (d behind the body's front). */
const row = (d0: number, n: number, pitch: number, w: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i): readonly [number, number] => [d0 + i * pitch, d0 + i * pitch + w]);

/** The 7010's body between its end walls, and the 6010's and 4010's from the face's join. */
const MID_L = MIDDLE_LENGTH - 0.5;
/**
 * The 7010 (open saloon, second class): a door at each end, the toilet's small window beside one, eleven
 * windows 1.22 m wide at a 1.95 m pitch between (the Leoben and Muerzzuschlag photographs).
 */
const MIDDLE: SeriesLayout = {
  doors: [[0.55, 1.4, -1], [MID_L - 1.4, MID_L - 0.55, 1]],
  windows: [[1.8, 2.25], ...row(2.75, 11, 1.95, 1.22), [MID_L - 2.25, MID_L - 1.8]],
};
/**
 * The 6010 (driving trailer, d behind the tip; Salzburg photograph of 6010 008, projective fit): the cab
 * door, the luggage compartment's one window, the passenger door, the first-class saloon's seven windows,
 * the rear door.
 */
const TRAILER_L = TRAILER_LENGTH - 0.25 - JOIN - 0.65;
const TRAILER: SeriesLayout = {
  doors: [[...span(6.6, 7.45), 1], [TRAILER_L - 1.4, TRAILER_L - 0.55, 1]],
  windows: [span(2.55, 3.55), ...row(8.4 - JOIN, 7, 2.3, 1.45).map(([a, e]): readonly [number, number] => [a, e]), [TRAILER_L - 2.25, TRAILER_L - 1.8]],
};
/**
 * The 4010 (power car, d behind the tip; Salzburg photograph of 4010 008, projective fit): the cab door
 * and its window, the machine room's two grilles, the luggage door and window, two more grilles, the
 * narrow windows of the guard's compartment and the vestibule at the inner end.
 */
const POWER_L = POWER_LENGTH - 0.25 - JOIN - 0.65;
const POWER: SeriesLayout = {
  doors: [[...span(7.4, 8.2), 1]],
  windows: [span(8.35, 9.5), span(14.1, 14.6), span(15.1, 15.55)],
};
const POWER_GRILLES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [...span(3.2, 4.6), 2.15, 3.02, 6], [...span(5.75, 7.1), 2.15, 3.02, 6], [...span(10.4, 11.55), 2.15, 3.02, 5], [...span(12.25, 13.5), 2.15, 3.02, 5],
];

/** The power car's roof: the brake resistors' unpainted housing (d behind the body's front; 0.22 m over the crown on 4010 008), its louvred sides and grid top. */
const RESISTORS: readonly [number, number] = span(2.4, 8.6);

function powerFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("resistors", () => {
    const [d0, d1] = RESISTORS, hw = 0.95;
    // the housing's frame on the roof, its louvred sides and the grids on its top
    at("resFrame", d0, d1, C - 0.12, C + 0.22, -hw, hw);
    for (const sd of [1, -1]) {
      at("grid", d0 + 0.15, d1 - 0.15, C + 0.02, C + 0.18, sd > 0 ? hw - 0.003 : -hw - 0.006, sd > 0 ? hw + 0.006 : -hw + 0.003);
      for (let d = d0 + 0.3; d < d1 - 0.2; d += 1.1) at("resFrame", d - 0.03, d + 0.03, C + 0.02, C + 0.18, sd > 0 ? hw + 0.006 : -hw - 0.012, sd > 0 ? hw + 0.012 : -hw - 0.006);
    }
    at("grid", d0 + 0.1, d1 - 0.1, C + 0.217, C + 0.226, -hw + 0.08, hw - 0.08);
    for (let d = d0 + 1.1; d < d1 - 0.2; d += 1.1) at("resFrame", d - 0.03, d + 0.03, C + 0.21, C + 0.235, -hw + 0.07, hw - 0.07);
  });
  m.scope("roof line", () => {
    // from the pantograph forward along the roof to the main switch beside the housing's rear
    const p = PANTOGRAPH_AT;
    at("frame", RESISTORS[1] + 0.2, p - 1.0, C + 0.18, C + 0.22, 0.3, 0.34);
    for (const d of [RESISTORS[1] + 0.4, p - 1.2]) at("insulator", d - 0.06, d + 0.06, C - 0.02, C + 0.2, 0.26, 0.38);
    at("insulator", RESISTORS[1] + 0.25, RESISTORS[1] + 0.75, C - 0.02, C + 0.3, -0.25, 0.1);
  });
  domeLamps(m, X);
  underfloor(m, X, car, true);
}

/**
 * The top lamp's round housing standing forward off the dome over the windscreens, the red marker
 * under it (the head-on photographs), d behind the tip: drawn here, level, since the face's pods
 * follow its slope.
 */
function domeLamps(m: MeshBuilder, X: (d: number) => number): void {
  const along = (mat: string, d0: number, d1: number, ring: ReturnType<typeof ngon>) => m.sweep(mat, "x", ring, Math.min(X(d0 - JOIN), X(d1 - JOIN)), ring, Math.max(X(d0 - JOIN), X(d1 - JOIN)));
  m.scope("top lamp", () => {
    along("domeLamp", 0.36, 0.8, ngon(12, 0.15, 0, 0, 3.76));
    along("frameSilver", 0.34, 0.36, ngon(12, 0.125, 0, 0, 3.76));
    along("lampHead", 0.335, 0.34, ngon(12, 0.1, 0, 0, 3.76));
  });
  m.scope("marker", () => {
    along("domeLamp", 0.24, 0.45, ngon(10, 0.09, 0, 0, 3.5));
    along("lampRed", 0.235, 0.24, ngon(10, 0.065, 0, 0, 3.5));
  });
}

function underfloor(m: MeshBuilder, X: (d: number) => number, car: { length: number; trucks: readonly number[] }, power: boolean): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("underfloor", () => {
    const [t0, t1] = [car.trucks[0]!, car.trucks[car.trucks.length - 1]!];
    if (power) {
      // the transformer between the bogies, the compressor and the batteries
      at("under", t0 + 2.0, t1 - 2.0, 0.5, FOOT - 0.12, -1.1, 1.1);
    } else {
      // the tanks and boxes between the bogies, a gap at the middle
      const mid = (t0 + t1) / 2;
      at("under", t0 + 2.2, mid - 0.6, 0.55, FOOT - 0.12, -1.05, 1.05);
      at("under", mid + 0.6, t1 - 2.2, 0.55, FOOT - 0.12, -1.05, 1.05);
    }
  });
}

/** The coaches' and the driving trailer's roof vents along the crown. */
function coachFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("roof vents", () => {
    for (let d = car.end ? 3.0 : 2.0; d < car.length - 1.5; d += 2.6) crownPane(m, b, X, 1, "frame", [d, d + 0.5], [0, 0.22], 0.05);
    for (let d = car.end ? 3.0 : 2.0; d < car.length - 1.5; d += 2.6) crownPane(m, b, X, -1, "frame", [d, d + 0.5], [0, 0.22], 0.05);
  });
  if (car.end) domeLamps(m, X);
  underfloor(m, X, car, false);
}

/** The pantograph's centre on the power car, d behind the body's front (the Salzburg photograph: over the rear bogie's front). */
const PANTOGRAPH_AT = 11.0 - JOIN;

/**
 * The series: the 6010 driving trailer as the end car, the 7010 coaches, and the 4010 power car leading
 * (leadEnd). Bogies: the coaches' and the trailer's 19.0 m apart (2.5 m wheelbase, 920 mm wheels), the
 * power car's centred under its body 9.0 m apart (2.8 m wheelbase, 1,040 mm wheels).
 */
export const OBB4010: ShinkansenSeries = {
  endLength: TRAILER_LENGTH, midLength: MIDDLE_LENGTH, W, Y: 1.12, S, C, lean: 0.975, B: 0.88, A: FOOT,
  tiltSection: { wa: 0.995, wl: 0.97 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [WIN], windowW: 1.35, pitch: 1.95,
  door: [1.15, 3.12, 2.2, 2.98], doorW: 0.85, doorGlassW: 0.26,
  layout: { end: TRAILER, middle: MIDDLE },
  cabWindows: [[...span(1.14, 1.7), 2.45, 3.12]],
  sidePanels: { end: [{ d: span(1.06, 1.78), y: [1.15, 3.2], kind: "seam" }] },
  endBogies: [3.0, TRAILER_L - 3.0], midBogies: [(MID_L - 19.0) / 2, (MID_L + 19.0) / 2], bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5,
  endCoupler: "buffers", bufferHeadShape: "rect", endPantograph: "lead", cars: [4, 5, 6],
  numberAt: [-2.0, 1.04, 0.1],
  fittings: coachFittings,
  liveries: { blueIvory: blueIvory("6010 012-0"), trafficRed: trafficRed("6010 008-8", 2.2) },
  leadEnd: {
    endLength: POWER_LENGTH,
    layout: { end: POWER, middle: MIDDLE },
    cabWindows: [[...span(1.95, 2.6), 2.45, 3.12]],
    sidePanels: { end: [{ d: span(1.3, 1.9), y: [1.15, 3.2], kind: "seam" }] },
    endGrilles: POWER_GRILLES,
    endBogies: [POWER_L / 2 - 4.5, POWER_L / 2 + 4.5], wheelR: 0.52, wheelbase: 2.8,
    pantographAt: PANTOGRAPH_AT,
    fittings: powerFittings,
    liveries: { blueIvory: blueIvory("4010 027-3"), trafficRed: trafficRed("4010 008-3", 2.75) },
  },
  weight: { end: 43, middle: 44 }, power: 2500, maxspeed: 150,
};

/** The lone driving trailer: the series' end car without the power car's fields, no pantograph. */
const TRAILER_SERIES: ShinkansenSeries = { ...OBB4010, leadEnd: undefined, endPantograph: undefined, traction: "none" };

const P = seriesParams(OBB4010);
const POWER_WEIGHT = 64;

/** The design's parameters: the power car first (it leads and is the catalog's picture). */
export const OBB4010_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", { powerCar: "Power car", middleCar: "Middle car", endCar: "Driving trailer", train: "Full train" }),
  ...P.filter((p) => p.name !== "unit"),
];

/** The series' own selection for a design selection, and the series that builds it. */
function seriesOf(v?: ParamValues): [ShinkansenSeries, ParamValues] {
  const p = resolveParams(OBB4010_PARAMS, v);
  const rest: ParamValues = { livery: p.livery!, ...(p.unit === "train" ? { cars: p.cars! } : {}) };
  if (p.unit === "powerCar") return [OBB4010, { ...rest, unit: "endCar" }];
  if (p.unit === "endCar") return [TRAILER_SERIES, { ...rest, unit: "endCar" }];
  return [OBB4010, { ...rest, unit: p.unit! }];
}

export function obb4010(v?: ParamValues): MeshBuilder { const [s, p] = seriesOf(v); return buildSeries(s, P, p); }
export function obb4010Lod(v?: ParamValues): MeshBuilder { const [s, p] = seriesOf(v); return buildSeriesLod(s, P, p); }

/** Weight and power of every car and train length, in every livery. */
function game(): GameProperties {
  const cars = OBB4010_PARAMS.find((p) => p.name === "cars")!, liveries = OBB4010_PARAMS.find((p) => p.name === "livery")!;
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const lv of liveries.values.map((x) => x.value)) {
    const base: ParamValues = lv === liveries.default ? {} : { livery: lv };
    variants.push({ params: { ...base, unit: "middleCar" }, weight: OBB4010.weight.middle, power: 0 });
    variants.push({ params: { ...base, unit: "endCar" }, weight: OBB4010.weight.end, power: 0 });
    for (const n of cars.values.map((x) => Number(x.value)))
      variants.push({ params: { ...base, unit: "train", ...(String(n) === cars.default ? {} : { cars: String(n) }) }, weight: POWER_WEIGHT + (n - 2) * OBB4010.weight.middle + OBB4010.weight.end });
  }
  return { weight: POWER_WEIGHT, power: OBB4010.power, maxspeed: OBB4010.maxspeed, accel: null, variants };
}

export const OBB4010_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-4010", title: "OBB 4010 Transalpin", build: obb4010, buildLod: obb4010Lod, params: OBB4010_PARAMS,
  lodTriangles: 500, game: game(), catalog: EMU_CATALOG, references: "obb-4010",
};
