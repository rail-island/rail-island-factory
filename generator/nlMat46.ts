// The NS Mat '46 two-car unit (ELD2, 1949 - 1983; officially plan A/AB/B/C, nicknamed the
// "Muizenneus", the mouse nose), drawn on the series kit (shinkansen.ts) with its own cab face
// (seriesCab.ts): two cars on three bogies (Bo'2'Bo', a motor bogie under each cab and a Jacobs bogie
// under the joint), 44.7 m over the Scharfenberg couplers. The rounded nose under the silver dome: the
// five front panes in silver frames (the outer two wrapping round the corners onto the sides), the wide
// red band over them and the red band low across the front, both running back along the cab to the cab
// door, the two round headlamps, the two small lamps in the red band, the low Scharfenberg coupler under
// the rounded silver skirt. The leading car is the ABDk (cab, luggage room with its double door, the
// first class, the toilet), the rear car the Bk (cab, second class); a diamond pantograph over each cab,
// the rear one raised. Matched to the photographs in assets/ns-mat46/ (SOURCES.md: the museum unit 273
// side-on at the Jacobs bogie, head-on, three-quarter from both ends, and the yellow unit side-on in the
// NS photo archive) and the published figures (nl.wikipedia "Mat '46"). See
// docs/models/netherlands-trains.md.
//
// Heights over the rail; d behind the face's tip (the lower red band's front, 0.9 m up) where it says
// "tip", else behind the body's front end (the face's join at the cab door).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the cab door's front edge, where the red bands end (side photographs). */
const JOIN = 1.72;
/** The coupling plane's reach ahead of the tip: the Scharfenberg head standing out under the skirt. */
const REACH = 0.4;
/** The skirt's bottom along the cars, its top (where the side rounds in under the lower red band), the belly, the eaves, the crown (the Jacobs photograph at 139.5 px/m). */
const B = 0.4;
const A = 0.8;
/** The red line along the side at the green's foot (the skirt's silver below it). */
const LINE = 1.0;
const Y = 1.3;
const S = 3.36;
const C = 3.8;
/** The front's paint edges: the lower red band's foot and head, the red band over the panes. */
const LOW_RED: [number, number] = [0.77, 1.05];
const HIGH_RED = 2.88;
/** The cab panes' sill and head (the side and head-on photographs: 2.0 - 2.84 m), the passenger windows' (2.15 - 3.1 m). */
const PANE: [number, number] = [2.0, 2.84];
const WIN: [number, number] = [2.15, 3.1];

/**
 * The face's centre line (the side photographs, the head-on one at 85 px/m): the silver apron under the
 * lower red band, 0.37 m tall, rounding under to the body's foot 0.34 m back (the coupler in front of it), the
 * front upright through the red band and the lamps, leaning back a little at the panes and the red band,
 * then the silver dome falling to the crown 1.35 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.34], [0.46, 0.2], [0.55, 0.12], [0.65, 0.075], [LOW_RED[0], 0.04], [0.84, 0.015], [0.9, 0], [1.6, 0], [PANE[0], 0.02],
  [PANE[1], 0.065], [HIGH_RED, 0.07], [3.1, 0.1], [S, 0.16], [3.48, 0.25], [3.6, 0.4], [3.69, 0.6], [3.75, 0.86], [3.79, 1.25], [C, JOIN],
];

/** The plan: a flat front over the centre pane, then corners of 1.22 m reaching the side about 1 m behind the tip (the outer panes wrap round them). */
const CORNER: Pt[] = [[B, 1.22], [S, 1.22], [3.5, 1.0], [3.7, 0.6], [C, 0.1]];

/** The outer panes' and the cab side windows' edges on the cab's sides, d behind the tip by height (their front edges lean back with the face). */
const lean = (d: number, y0: number, y1: number, k = 0.06): Pt[] => [[y0, d], [y1, d + k]];

/** A polygon of a rounded rectangle-like quad in [lat, y]: corners cut by c (cheap rounding for a painted field). */
function chamfered(pts: readonly Pt[], c: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!, prev = pts[(i + pts.length - 1) % pts.length]!, next = pts[(i + 1) % pts.length]!;
    const to = (q: Pt): Pt => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [p[0] + (dx / l) * c, p[1] + (dy / l) * c]; };
    out.push(to(prev), to(next));
  }
  return out;
}

/**
 * The panes beside the centre one (head-on photograph): each in its own silver frame, a 0.1 m green
 * pillar between it and the centre pane's frame, its outer pillar leaning out toward the top (the pane
 * wider at its head), the frame 4 cm wide; for side sd.
 */
const SIDE_FRAME = (sd: number): Pt[] => chamfered([[sd * 0.35, PANE[0] - 0.04], [sd * 0.74, PANE[0] - 0.04], [sd * 0.81, PANE[1] + 0.04], [sd * 0.35, PANE[1] + 0.04]], 0.06);
const SIDE_GLASS = (sd: number): Pt[] => chamfered([[sd * 0.39, PANE[0]], [sd * 0.705, PANE[0]], [sd * 0.77, PANE[1]], [sd * 0.39, PANE[1]]], 0.04);

const ROWS = [...new Set([...PROFILE.map(([y]) => y), LOW_RED[1], 1.24, 1.4, 1.56, PANE[0] - 0.04, PANE[0] + 0.04, PANE[1] - 0.04, PANE[1] + 0.04, 3.04, 3.13, 3.22])].sort((a, b) => a - b);

export const MAT46_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.0, reach: REACH, first: JOIN, roofFrom: S, bulge: 0.04, tolerance: 0.02, cols: [6, 6, 1, 1], wrap: true,
  profile: PROFILE,
  corner: CORNER,
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.05, 1.0))]),
  rows: ROWS,
  lodGlass: { hw: 1.3, y: PANE },
  paint: [
    // the outer panes round the corners back to 0.92 m, then the cab side window 1.02 - 1.42 m behind the
    // tip (the yellow unit's side view): silver frames, glass inside
    // (a 0.1 m green pillar, leaning out toward the top, between each corner pane and the pane beside the
    // centre one; another between the corner pane and the cab side window)
    { mat: "rubber", front: lean(0.145, PANE[0] - 0.04, PANE[1] + 0.04, 0.075), back: lean(0.92, PANE[0] - 0.04, PANE[1] + 0.04, 0) },
    { mat: "cabGlass", front: lean(0.175, PANE[0], PANE[1], 0.075), back: lean(0.88, PANE[0], PANE[1], 0) },
    { mat: "rubber", front: lean(1.02, PANE[0] - 0.04, PANE[1] + 0.04, 0), back: lean(1.44, PANE[0] - 0.04, PANE[1] + 0.04, 0) },
    { mat: "cabGlass", front: lean(1.06, PANE[0], PANE[1], 0), back: lean(1.4, PANE[0], PANE[1], 0) },
  ],
  // the panes beside the centre one: their silver frames and glass, the outer pillars leaning
  fields: [1, -1].flatMap((sd) => [{ mat: "rubber", pts: SIDE_FRAME(sd) }, { mat: "cabGlass", pts: SIDE_GLASS(sd) }]),
  // the centre pane (0.42 m wide head-on) in its own rounded silver frame
  masks: [{ lat: [-0.25, 0.25], y: [PANE[0] - 0.04, PANE[1] + 0.04], r: 0.08, mat: "rubber" }],
  panes: [{ lat: [-0.21, 0.21], y: PANE, r: 0.05 }],
  // the two round headlamps, 0.28 m lenses in wide silver rings, 0.51 m either side, 1.4 m up; the two
  // small lamps in the red band in silver rings 0.18 m across
  pods: [
    ...[1, -1].map((sd) => ({ lat: sd * 0.51, y: 1.4, w: 0.42, h: 0.42, r: 0.21, proud: 0.035, depth: 0.04, mat: "frameSilver", lamps: [[0, 0.14, "lampHead"]] as const })),
    ...[1, -1].map((sd) => ({ lat: sd * 0.47, y: 3.13, w: 0.18, h: 0.18, r: 0.09, proud: 0.02, depth: 0.03, mat: "frameSilver", lamps: [[0, 0.06, "lampHead"]] as const })),
  ],
  // the wipers on the centre pane and the driver's (left) pane, parked upright from the sill
  wipers: [[[0.04, PANE[0] + 0.06], [-0.04, 2.6]], [[-0.46, PANE[0] + 0.06], [-0.54, 2.6]]],
};

/** Tip distance to body d. */
const b = (t: number) => t - JOIN;
/** A double door (two leaves, a narrow window in each) from t0 to t1 behind the tip. */
const door = (t0: number, t1: number): readonly [number, number, number] => [b(t0), b(t1), 1];
const win = (t0: number, t1: number): readonly [number, number] => [b(t0), b(t1)];

/**
 * The leading car, the ABDk (the yellow unit's right-hand car, side-on at 72 px/m with a projective
 * correction, and the museum photograph): behind the cab door a narrow window, the luggage room's double
 * door, a narrow window, the first class's two windows, the passenger door, two windows, the toilet's
 * narrow window and one more window before the joint.
 */
const LEAD: SeriesLayout = {
  doors: [door(4.63, 6.16), door(12.42, 13.87)],
  windows: [win(3.39, 3.86), win(7.43, 7.96), win(8.47, 9.79), win(10.34, 11.66), win(14.68, 16.0), win(16.68, 18.0), win(18.76, 19.38), win(20.06, 21.38)],
};
/**
 * The rear car, the Bk (the 2017 photograph of 273's Bk end and the yellow unit's left-hand car): behind
 * the cab door two windows, the double door, five windows, the second door and two windows to the joint.
 */
const TRAIL: SeriesLayout = {
  doors: [door(6.25, 7.75), door(16.4, 17.9)],
  windows: [win(2.95, 4.25), win(4.61, 5.91), win(8.1, 9.4), win(9.76, 11.06), win(11.42, 12.72), win(13.08, 14.38), win(14.74, 16.04), win(18.4, 19.7), win(20.06, 21.36)],
};
/** The cab door's tall window, 1.85 - 2.33 m behind the tip, on both cars. */
const CAB_DOOR_WINDOW: ShinkansenSeries["cabWindows"] = [[b(1.86), b(2.32), 2.1, 3.12]];

/** The headlamps' yellowish lenses in dark chrome rings (the head-on photograph). */
const MAT46_LAMPS: ShinkansenLivery["palette"] = {
  lampHead: { color: "#f2cf6a", roughness: 0.2, lamp: { role: "head" } },
  lampRing: c("#4a4f52", 0.3),
};

/** The coupler's centre over the rail: low, under the nose's skirt (every photograph). */
const COUPLER_Y = 0.55;

/**
 * The underframe's equipment boxes between the bogies, set in under the skirt, and at a cab end the
 * Scharfenberg coupler: the draw bar out from under the skirt and the head in its red cover.
 */
function mat46Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const reach = MAT46.wheelbase / 2 + MAT46.wheelR + 0.3;
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underframe", () => {
    // two boxes between the bogies, a gap between them
    const [a, e] = [Math.max(0, t0 + reach), Math.min(car.length, t1 - reach)], mid = (a + e) / 2;
    for (const [d0, d1] of [[a + 0.3, mid - 0.4], [mid + 0.4, e - 0.3]] as const) if (d1 > d0 + 0.5) block(m, "under", Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), 0.2, B + 0.05, -1.0, 1.0);
  });
  if (!car.end) return;
  const k = Math.sign(X(0) - X(1)), tip = X(-JOIN), plane = tip + k * REACH;
  m.scope("coupler", () => {
    // the draw bar from under the face, the head's cover reaching the coupling plane
    block(m, "carbon", Math.min(tip - k * 0.7, plane - k * 0.25), Math.max(tip - k * 0.7, plane - k * 0.25), COUPLER_Y - 0.07, COUPLER_Y + 0.07, -0.08, 0.08);
    // the head: a rounded body behind a wider face plate, the centring cone standing out of the plate
    const round = (hw: number, hh: number, r: number): Array<[number, number]> => {
      const out: Array<[number, number]> = [];
      for (const [cz, cy, a0] of [[hw - r, -(hh - r), -90], [hw - r, hh - r, 0], [-(hw - r), hh - r, 90], [-(hw - r), -(hh - r), 180]] as const)
        for (let j = 0; j <= 2; j++) { const a = ((a0 + 45 * j) * Math.PI) / 180; out.push([cz + r * Math.cos(a), COUPLER_Y + cy + r * Math.sin(a)]); }
      return out;
    };
    const at = (u: number) => plane - k * u;
    const seg = (mat: string, ring: Array<[number, number]>, u0: number, u1: number, ring1 = ring) => (k > 0 ? m.sweep(mat, "x", ring, at(u0), ring1, at(u1)) : m.sweep(mat, "x", ring1, at(u1), ring, at(u0)));
    seg("couplerRed", round(0.15, 0.15, 0.09), 0.42, 0.12);
    seg("couplerRed", round(0.19, 0.2, 0.07), 0.12, 0.07);
    seg("carbon", round(0.07, 0.07, 0.06), 0.07, 0.0, round(0.035, 0.035, 0.03));
  });
}

/** The museum unit 273: olive green over the silver skirt, red lines at its foot and the eaves, the cab's wide red bands, the silver roof. */
const MAT46_GREEN: ShinkansenLivery = {
  title: "NS green", number: "273",
  palette: { ...MAT46_LAMPS, couplerRed: c("#c42127", 0.4), green: c("#27402f", 0.3), red: c("#c42127", 0.35), silver: c("#b6babd", 0.35), rubber: c("#b2b6b9", 0.35), roofG: c("#aeb2b5", 0.45), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) },
  bands: [[0, LINE, "silver"], [LINE, LINE + 0.05, "red"], [LINE + 0.05, S - 0.05, "green"], [S - 0.05, 9, "red"]],
  front: [[0, LOW_RED[0], "silver"], [LOW_RED[0], LOW_RED[1], "red"], [LOW_RED[1], HIGH_RED, "green"], [HIGH_RED, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
};

/** The four units painted yellow about 1970 (279, 281, 295 and 299; the NS archive photograph of one at Velperbroek): yellow over a dark grey skirt, grey doors, a grey roof. */
const MAT46_YELLOW: ShinkansenLivery = {
  title: "NS yellow, grey", number: "279",
  palette: { ...MAT46_LAMPS, couplerRed: c("#c42127", 0.4), yellow: c("#ffc917", 0.4), grey: c("#55595d", 0.5), rubber: c("#2a2c2f", 0.4), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3) },
  bands: [[0, LINE + 0.05, "grey"], [LINE + 0.05, 9, "yellow"]],
  front: [[0, LOW_RED[0], "grey"], [LOW_RED[0], 9, "yellow"]],
  doors: [[0, 9, "grey"]],
  roof: "roofG", skirt: "skirtG",
};

export const MAT46: ShinkansenSeries = {
  // 44.7 m over the couplers for the two cars (nl.wikipedia), 22.35 m a car; 2.94 m wide
  endLength: 22.35, midLength: 22.35, W: 1.47, Y, S, C, lean: 0.95, B, A,
  // the silver skirt rounding in under the belly
  tiltSection: { wa: 0.99, wl: 0.86 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: MAT46_FACE,
  // the silver-framed windows with rounded corners; the doors' two leaves each with a narrow window
  windows: [WIN], windowW: 1.32, pitch: 1.85, windowCornerR: 0.13,
  door: [LINE + 0.05, 3.17, 2.15, 3.05], doorW: 1.45, doorGlassW: 0.38, doorGlassPair: 0.72, doorGlassR: 0.08,
  layout: { end: LEAD, middle: LEAD },
  rearEnd: { layout: TRAIL, cabWindows: CAB_DOOR_WINDOW },
  cabWindows: CAB_DOOR_WINDOW,
  sidePanels: { end: [{ d: [1.75, 2.45], y: [LINE + 0.05, 3.2], kind: "seam" }] },
  // Bo'2'Bo': the motor bogie's centre 3.9 m behind the tip (under the cab door's rear and the first
  // window, the 2017 photograph), the Jacobs bogie's under the joint; 3.1 m wheelbase (the Jacobs
  // photograph), the wheels drawn at 0.92 m
  jacobs: true, bogieCentres: 18.05, wheelR: 0.46, wheelbase: 3.1, couplerY: COUPLER_Y, fittings: mat46Fittings,
  // a diamond pantograph over each cab (on the cab door and the first window), the leading one raised
  pantograph: "diamond", pantographD: 3.0, endPantograph: true, trailingLowered: true,
  cars: [2],
  liveries: { green: MAT46_GREEN, yellowGrey: MAT46_YELLOW },
  // 89 t, 796 kW (four 199 kW Heemaf motors) for the two cars; 140 km/h allowed (nl.wikipedia)
  weight: { end: 45, middle: 45 }, power: 398, maxspeed: 140,
};
