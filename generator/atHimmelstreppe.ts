// The NOVOG ET 1 - ET 9 "Die Himmelstreppe" (Stadler, 2012 - 2013), the three-car low-floor electric
// unit of the Mariazellerbahn (760 mm gauge, 6.5 kV 25 Hz), drawn on the series kit (shinkansen.ts)
// with its own cab face (seriesCab.ts): two motor end cars, each on one motor bogie under its
// high-floor cab section, and the low-floor middle car with the two single-arm pantographs
// (Bo'2'2'Bo', 50.74 m over the couplers, 2.65 m wide). The gold body with the grey window band,
// stepping down behind each end car's door where the floor drops to 400 mm; the face a wide, nearly
// flat front leaning back above the gold bumper, the grey shield round the tall windscreen and the
// two round lamps, the crash boxes and the Scharfenberg coupler low under it. Matched to the
// photographs in assets/noevog-himmelstreppe/ (SOURCES.md) and the published figures (de.wikipedia
// "NOVOG ET1-ET9"). See docs/models/austria-units.md.
//
// Heights over the rail. On the face, d behind its tip (the gold bumper's front); the layout's d
// behind the body's front end (the face's join, JOIN behind the tip; an intermediate car's from its
// +X end).
//
// Photographs and scales: photo-himmelstreppe1.jpg (the whole unit side-on across the lake, 19.41
// px/m over its 49.84 m of body: every car's windows, doors, joints and paint edges, the raised
// pantograph and the folded one); photo-mariazellerbahn-himmelstreppe-st-polten-20150711.jpg (the
// face nearly head-on, about 190 px/m: the shield, windscreen, lamps, plate, bumper, crash boxes and
// coupler); photo-2014-06-04-novog-bahnhof-laubenbachmuhle-02.jpg (ET 5 in three-quarter view: the cab
// side, the emblem, the high section's windows and paint heights, the roof); photo-die-himmelstreppe.jpg
// and photo-novog-et5-in-weienbach.jpg (the other side, the joints, the skirts down to the rail).
//
// Narrow gauge: drawn on the kit's running gear (the game lays one track); the body's 2.65 m and the
// 770 mm wheels are the prototype's.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties, ParamValues, ProceduralDesign } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sideDecal, sideLettering, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { pilotPlate } from "./carbodyKit.ts";
import { singleArm } from "./czElectricKit.ts";

/** Lengths over the couplers: each end car 17.07 m, the middle car 16.6 m, 50.74 m the unit (de.wikipedia; the side photograph's three bodies alike, 16.6 m between joints). */
const END_LENGTH = 17.07;
const MID_LENGTH = 16.6;
/** Where the face meets the body: the roof cap has rounded into the crown. */
const JOIN = 1.0;
/** The coupling plane ahead of the bumper (the Scharfenberg coupler's head). */
const REACH = 0.5;
/** d behind the body's front end of a d behind the tip. */
const at = (d: number): number => d - JOIN;
/** The end car's body from its join to its inner end. */
const END_BODY = END_LENGTH - REACH - JOIN - 0.25;

/** Half width (2.65 m), the belly, the shoulder and the crown (3.45 m; 3.55 m over the roof equipment), the skirt's bottom and top: the body down to 0.2 m over the rail. */
const W = 1.325;
const Y = 0.42;
const S = 3.1;
const C = 3.45;
const B = 0.2;
const A = 0.3;

/** The grey window band: down to 1.08 m in the low-floor sections, to 1.6 m in the end car's high-floor section; the gold from 2.75 m to the roof. */
const GREY: readonly [number, number] = [1.08, 2.75];
const GREY_HIGH = 1.6;
/** The windows' sill and head: the high-floor section's (floor 980 mm) and the low-floor sections' (floor 400 mm). */
const WIN_HIGH: readonly [number, number] = [1.66, 2.6];
const WIN_LOW: readonly [number, number] = [1.2, 2.6];
/** The end car's door, d behind the tip: the high-floor section ends at it. */
const DOOR_TIP: readonly [number, number] = [8.6, 10.1];

/**
 * The face's centre line (the side photograph's noses at 155 px/m, the three-quarter views): the dark
 * foot under the crash boxes, the gold bumper bulging forward to its crease, the grey shield leaning
 * back about 7 degrees over the lamps and the windscreen, the roof cap rounding back 1 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.2], [0.45, 0.14], [0.66, 0.05], [0.78, 0.01], [0.95, 0], [1.08, 0.03], [1.22, 0.09], [1.36, 0.12], [1.71, 0.19],
  [2.6, 0.3], [3.18, 0.47], [3.3, 0.56], [3.38, 0.68], [3.43, 0.82], [C, JOIN],
];

/** The windscreen's rubber frame and glass (lat, y), the destination display in its head. */
const SCREEN: readonly [number, number] = [1.75, 3.14];

/** The grey shield round the windscreen and the lamps: up to the roof cap, its foot a shallow U over the bumper. */
const SHIELD: Pt[] = [
  [-0.82, 3.29], [0.82, 3.29], [1.02, 2.98], [1.12, 2.55], [1.12, 1.5], [1.08, 1.36], [0.93, 1.22], [0.58, 1.09], [0, 1.04],
  [-0.58, 1.09], [-0.93, 1.22], [-1.08, 1.36], [-1.12, 1.5], [-1.12, 2.55], [-1.02, 2.98],
];

/** The windscreen's outline (lat, y), grown by g for its rubber frame: rounded at the foot, its upper corners cut back along the leaning A-pillars. */
function screen(g: number): Pt[] {
  const [y0, y1] = [SCREEN[0] - g, SCREEN[1] + g];
  const half: Pt[] = [[0.84 + g, y0], [0.93 + g, y0 + 0.05], [0.96 + g, y0 + 0.15], [0.96 + g, 2.55], [0.88 + g, 2.86], [0.7 + g, y1]];
  return [...half, ...half.slice().reverse().map(([l, y]): Pt => [-l, y])];
}

const ROWS = [...new Set([
  ...PROFILE.map(([y]) => y), 1.04, 1.09, 1.18, 1.23, 1.29, 1.46, 1.49, 1.5, 1.62, SCREEN[0], 1.8, 1.9, 1.95, 2.2, 2.5, 2.55, 2.86, 2.92, 2.98, 3.02, 3.1, SCREEN[1], 3.12, 3.29, 3.33,
])].sort((a, b) => a - b);

/**
 * The face (the St. Poelten photograph head-on, about 190 px/m, and ET 5 in three-quarter view): nearly
 * as wide as the body, its corners rounded about 0.3 m and swept back 0.45 m, wider over the roof cap;
 * the grey shield holding the windscreen (+-1.0 m, 1.75 - 3.14 m, its corners rounded) with the green
 * destination display in its head and, under it, the two round lamps (+-0.68 m, 1.36 m) either side of
 * the "Die Himmelstreppe" plate; the gold bumper below; the gold roof cap with its two round vents and
 * the top lamp; the dark foot behind the crash boxes.
 */
const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.5, reach: REACH, roofFrom: 3.3, first: DOOR_TIP[0], bulge: 0.04, tolerance: 0.015, cols: [6, 4, 1, 1],
  profile: PROFILE,
  corner: [[B, 0.3], [1.3, 0.3], [2.2, 0.34], [2.8, 0.42], [3.18, 0.52], [3.3, 0.56], [3.4, 0.4], [C, 0.1]],
  cornerDepth: [[B, 0.42], [1.3, 0.48], [2.2, 0.55], [2.8, 0.65], [3.18, 0.72], [3.3, 0.66], [3.4, 0.45], [C, 0.1]],
  rows: ROWS,
  bands: () => [[0, 0.66, "under"], [0.66, 9, "gold"]],
  fields: [{ mat: "grey", pts: SHIELD }, { mat: "rubber", pts: screen(0.04) }, { mat: "cabGlass", pts: screen(0) }],
  masks: [
    // the lamps' dark rings, the plate, the top lamp's housing and the roof cap's two vents
    { lat: [-0.83, -0.53], y: [1.21, 1.51], r: 0.15, mat: "rubber" }, { lat: [0.53, 0.83], y: [1.21, 1.51], r: 0.15, mat: "rubber" },
    { lat: [-0.37, 0.37], y: [1.18, 1.46], r: 0.04, mat: "plate" },
    { lat: [-0.13, 0.13], y: [3.31, 3.43], r: 0.04, mat: "rubber" },
    { lat: [-0.54, -0.38], y: [3.31, 3.43], r: 0.06, mat: "vent" }, { lat: [0.38, 0.54], y: [3.31, 3.43], r: 0.06, mat: "vent" },
  ],
  panes: [
    { lat: [-0.72, 0.72], y: [2.92, 3.1], r: 0.03, mat: "display" },
  ],
  lamps: [[-0.68, 1.36, 0.115, "lampHead"], [0.68, 1.36, 0.115, "lampHead"]],
  roofLamp: [0, 3.37, 0.045],
  texts: [{ text: "Die Himmelstreppe", lat: 0, y: 1.28, h: 0.07, mat: "goldInk" }],
  number: { lat: 0.42, y: 1.6, h: 0.06, mat: "lettering" },
  // the crash boxes either side of the coupler, ribbed light grey
  pods: [
    { lat: -0.87, y: 0.58, w: 0.52, h: 0.55, r: 0.05, proud: 0.32, depth: 0.12, mat: "crash", level: true },
    { lat: 0.87, y: 0.58, w: 0.52, h: 0.55, r: 0.05, proud: 0.32, depth: 0.12, mat: "crash", level: true },
  ],
  // the pantograph wiper from the windscreen's foot up to the right
  wipers: [[[0.0, 1.8], [0.95, 2.95]], [[0.12, 1.8], [1.0, 2.8]]],
  lodGlass: { hw: 0.96, y: SCREEN },
};

/**
 * The paint (all photographs): the gold body and roof, the grey band round the windows from 1.08 m
 * (1.6 m in the end car's high-floor section, from the cab back to the door) to 2.75 m, the light
 * grey door leaves; on the cab sides the gold A-pillar ahead of the cab window, which sits in a dark
 * frame (d behind the tip). The running number of the photographed ET 5.
 */
const NOVOG: ShinkansenLivery = {
  title: "NOVOG", number: "ET5",
  palette: {
    gold: c("#c49c4e", 0.3), grey: c("#9a9ea3", 0.4), doorG: c("#cdd0d3", 0.35), white: c("#f3f1ea"),
    emblem: c("#d8b25a", 0.3), emblemLine: c("#9c7633", 0.4), goldInk: c("#b08a3e", 0.4),
    crash: c("#c3c6c9", 0.4), coupler: c("#3b3d40", 0.6), plate: c("#b7babd", 0.35), vent: c("#6f5a32", 0.6), display: c("#1f3a1c", 0.2),
    cabMask: c("#17191b", 0.3), lettering: c("#f3f1ea"), roofDark: c("#45484c", 0.6), lampRing: c("#26282b", 0.5),
  },
  bands: [[0, GREY[0], "gold"], [GREY[0], GREY[1], "grey"], [GREY[1], 9, "gold"]],
  doors: [[0, 9, "doorG"]],
  roof: "gold", skirt: "gold",
  endSweeps: [
    // the high-floor section's gold up to its windows, from the cab back to the door
    { mat: "gold", front: [[A, -1], [GREY_HIGH, -1]], back: [[A, DOOR_TIP[0] - 0.02], [GREY_HIGH, DOOR_TIP[0] - 0.02]] },
    // the gold A-pillar ahead of the cab window
    { mat: "gold", front: [[GREY_HIGH, -1], [GREY[1], -1]], back: [[GREY_HIGH, 0.5], [GREY[1], 0.6]], top: GREY[1] },
    // the cab window in its dark frame, its front leaning with the A-pillar
    { mat: "cabMask", front: [[1.62, 0.6], [2.58, 0.7]], back: [[1.62, 1.66], [2.58, 1.66]] },
    { mat: "cabGlass", front: [[1.66, 0.65], [2.54, 0.74]], back: [[1.66, 1.61], [2.54, 1.61]] },
  ],
  lodSideFields: { end: [{ d: [0, DOOR_TIP[0]], bands: [[0, GREY_HIGH, "gold"], [GREY_HIGH, GREY[1], "grey"], [GREY[1], 9, "gold"]] }] },
};

/**
 * The windows and doors (the side photograph's projective-free 19.41 px/m, both sides of the end cars
 * alike): the end car's narrow window and two wide ones in the high-floor section behind the emblem,
 * the double door, a blank stretch and two tall windows to the joint; the middle car's three windows,
 * its door and four windows.
 */
const END: SeriesLayout = {
  doors: [[at(DOOR_TIP[0]), at(DOOR_TIP[1]), 1]],
  windows: [[at(3.93), at(4.45)], [at(4.76), at(6.19)], [at(6.5), at(7.97)]],
  rows: [
    [[at(3.93), at(4.45)], [at(4.76), at(6.19)], [at(6.5), at(7.97)]],
    [[at(12.45), at(13.93)], [at(14.22), at(15.7)]],
  ],
};
const MIDDLE: SeriesLayout = {
  doors: [[6.0, 7.5, 1]],
  windows: [],
  rows: [[], [[0.42, 1.92], [2.2, 3.7], [3.98, 5.48], [8.8, 10.3], [10.6, 12.1], [12.4, 13.9], [14.2, 15.7]]],
};

/** The pantographs' base frames, d behind the middle car's ends (the side photograph: the raised one's head 2.5 m inside the joint, its knee toward the car's middle). */
const PANTOGRAPH_D = 3.1;

/** A teardrop [d, y] about its centre, w wide and h tall, the point up: the emblem's outline. */
function drop(dc: number, yc: number, w: number, h: number, n = 14): Pt[] {
  return Array.from({ length: n }, (_, k) => {
    const t = (2 * Math.PI * k) / n;
    const v = -Math.cos(t);
    // a round foot narrowing to the point
    const r = (w / 2) * Math.sin(t) * (0.55 + 0.45 * (1 - v) / 2) * (v > 0.5 ? 1 - (v - 0.5) * 0.8 : 1);
    return [dc + r, yc + (h / 2) * v] as Pt;
  });
}
const fan = (pts: readonly Pt[]): Pt[] => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.flatMap((p, i) => [[cx, cy], p, pts[(i + 1) % pts.length]!] as Pt[]);
};

/**
 * The Himmelstreppe's emblem on the grey behind the cab window (ET 5 in three-quarter view): a gold
 * teardrop, its steps as dark lines, a white crescent on the side toward the viewer's left on both
 * sides of the car (toward the rear on the +Z side).
 */
function emblem(m: MeshBuilder, b: SliceBody, X: (d: number) => number, sd: number): void {
  const [dc, yc, w, h] = [at(2.75), 2.15, 0.6, 0.78];
  const outline = drop(dc, yc, w, h);
  sideDecal(m, b, X, sd, "emblem", fan(outline), 0.004);
  // the steps: short dark lines across the drop's lower part
  const lines: Pt[] = [];
  for (let k = 0; k < 6; k++) {
    const y = yc - h * 0.38 + k * 0.1, half = w * (0.36 - k * 0.035);
    lines.push([dc - half, y], [dc + half, y], [dc + half, y + 0.018], [dc - half, y], [dc + half, y + 0.018], [dc - half, y + 0.018]);
  }
  sideDecal(m, b, X, sd, "emblemLine", lines, 0.008);
  // the crescent: on the +Z side toward larger d, on the -Z side toward smaller d
  const e = sd > 0 ? 1 : -1;
  const arc: Pt[] = [];
  for (let k = 0; k < 6; k++) {
    const a0 = -1.1 + (2.2 * k) / 6, a1 = -1.1 + (2.2 * (k + 1)) / 6;
    const p = (a: number, r: number): Pt => [dc + e * r * Math.cos(a) * w * 0.5, yc - 0.05 + Math.sin(a) * h * 0.4];
    arc.push(p(a0, 0.95), p(a0, 0.62), p(a1, 0.62), p(a0, 0.95), p(a1, 0.62), p(a1, 0.95));
  }
  sideDecal(m, b, X, sd, "white", arc, 0.008);
}

/** The roof equipment, the foot plate under the face, the emblem and the lettering; the middle car's pantograph frames and its folded pantograph. */
function fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const x = (d0: number, d1: number) => [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))] as const;
  const housing = (d0: number, d1: number, hw: number) => {
    const [x0, x1] = x(d0, d1);
    block(m, "gold", x0, x1, C - 0.12, C + 0.08, -hw, hw);
    // a dark grille along its top
    block(m, "vent", x0 + 0.3, x1 - 0.3, C + 0.05, C + 0.1, -hw + 0.25, hw - 0.25);
  };
  if (car.end) {
    // the air conditioning over the high-floor section, a lower housing over the low-floor end
    m.scope("roof equipment", () => {
      housing(at(3.9), at(8.3), 0.85);
      housing(at(11.2), at(14.9), 0.7);
    });
    const tip = X(-JOIN);
    // the steel foot plate under the crash boxes and the coupler, its front leaning back
    m.scope("foot plate", () => pilotPlate(m, "crash", 1, tip + 0.18, 0.1, 0.32, 1.05, 0.1, 0.55));
    // the Scharfenberg coupler: its shaft under the face, the head on the coupling plane
    m.scope("coupler", () => {
      block(m, "under", tip - 0.35, tip + REACH - 0.15, 0.3, 0.5, -0.12, 0.12);
      block(m, "coupler", tip + REACH - 0.18, tip + REACH, 0.22, 0.62, -0.24, 0.24);
    });
    // the crash boxes' ribs
    m.scope("crash ribs", () => {
      for (const z of [-0.87, 0.87]) for (let k = 0; k < 4; k++) {
        const y = 0.4 + k * 0.12;
        block(m, "lampRing", tip + 0.2, tip + 0.235, y, y + 0.025, z - 0.24, z + 0.24);
      }
    });
    for (const sd of [1, -1]) {
      m.scope("emblem", () => emblem(m, b, X, sd));
      // the white script under the high-floor section's windows
      m.scope("lettering", () => sideLettering(m, b, X, sd, "Die Himmelstreppe", at(4.9), 1.0, 0.44, "white", 0.006, 0.05));
    }
  } else {
    m.scope("roof equipment", () => {
      // the transformer's and the converters' housings between the pantographs
      housing(5.0, 11.1, 0.8);
      // the raised pantograph's frame at the +X end and the folded one's at the -X end
      for (const d of [PANTOGRAPH_D, car.length - PANTOGRAPH_D]) {
        const [x0, x1] = x(d - 1.0, d + 1.0);
        block(m, "roofDark", x0, x1, C - 0.08, C + 0.035, -0.75, 0.75);
      }
    });
    const xc = X(car.length - PANTOGRAPH_D);
    m.scope("pantograph", () => singleArm(m, { xc, roofY: C + 0.05, baseY: C + 0.3, h: -1, raised: false }));
  }
}

export const HIMMELSTREPPE: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [WIN_HIGH, WIN_LOW], windowW: 1.48, pitch: 1.78, windowCornerR: 0.06,
  door: [0.42, 2.62, 1.2, 2.45], doorW: 1.5, doorGlassW: 0.2, doorGlassPair: 0.62,
  layout: { end: END, middle: MIDDLE },
  numberAt: [at(1.3) - END_BODY / 2, 1.42, 0.08],
  // the motor bogie under the high-floor section, the middle car's trailer bogies drawn under the
  // joints (the end cars hang on the middle car); a lone car stands on its own bogie 2.0 m inside its
  // inner end. 770 mm wheels; the kit's 2.2 m bogies (the motor bogies' wheelbase; the trailers' 1.9 m)
  bogieCentres: 9.5, endBogies: [at(4.8), END_BODY - 2.0], jacobsInset: 2.0, wheelR: 0.385, wheelbase: 2.2,
  couplerY: 0.42,
  // the bellows close the joint over the body's whole height
  jointShroudProfile: [[-1.2, 0.3], [1.2, 0.3], [1.22, 3.0], [1.0, 3.3], [-1.0, 3.3], [-1.22, 3.0]],
  cars: [3], pantographAt: PANTOGRAPH_D,
  fittings,
  lodMiddleRoofBlocks: [{ d: [5.0, 11.1], hw: 0.8, y: [C - 0.1, C + 0.08], mat: "gold" }],
  liveries: { novog: NOVOG },
  weight: { end: 26, middle: 23 }, power: 600, maxspeed: 80,
};

export const HIMMELSTREPPE_PARAMS = seriesParams(HIMMELSTREPPE);

export function noevogHimmelstreppe(v?: ParamValues): MeshBuilder { return buildSeries(HIMMELSTREPPE, HIMMELSTREPPE_PARAMS, v); }
export function noevogHimmelstreppeLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HIMMELSTREPPE, HIMMELSTREPPE_PARAMS, v); }

/**
 * The game's figures (de.wikipedia): 75 t in service, 1,200 kW from four motors on the end cars' two
 * motor bogies, 80 km/h, 0.9 m/s2; an end car taken as 26 t with half the power, the middle car 23 t.
 */
export function himmelstreppeGame(g: GameProperties): GameProperties {
  return {
    ...g, weight: 26, power: 600, accel: 0.9,
    variants: g.variants?.map((v) => (v.params.unit === "middleCar" ? { ...v, weight: 23, power: 0 } : v.params.unit === "train" ? { ...v, weight: 75, power: 1200 } : v)),
  };
}

/** The design (generator/atUnits.ts lists it). */
export const HIMMELSTREPPE_DESIGN: ProceduralDesign = ((d) => ({ ...d, game: himmelstreppeGame(d.game!) }))(
  seriesDesign("proc-vehicle-noevog-himmelstreppe", "Himmelstreppe", HIMMELSTREPPE, HIMMELSTREPPE_PARAMS, noevogHimmelstreppe, noevogHimmelstreppeLod, "noevog-himmelstreppe", "uic"),
);
