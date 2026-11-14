// The Stadler (Adtranz) RegioShuttle RS1, DB class 650: a single diesel railcar on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts) at both ends - the flat front leaning back
// and rounding over into the roof, the big windscreen in its black surround with the destination
// display, the two round headlights low on the face over the small lamps, the third lamp on the
// crest, the buffers and screw coupling in the dark recess - its low-floor middle between the two
// double doors a side, the raised ends over the bogies, and the trapezoid window bands with their
// slanting pillars; the cooling and air-conditioning units on the roof and an exhaust behind each
// cab. Matched to the photographs and figures in assets/db-650/ (SOURCES.md). See
// docs/models/germany-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the face's foot); elsewhere d behind the
// body's front end (the face's join, JOIN behind the tip). The model is 24.2 m from tip to tip (the
// buffers 0.65 m out, 25.5 m over them; the real body is 24.46 m): the photographs' positions along
// the car are scaled about its middle by 24.2 / 24.46.

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const TRAFFIC_RED = "#ec0016";

/** Where the face meets the body: the cab's seam, where the crown has reached full height. */
const JOIN = 1.3;
/** The crown over the rail (3.70 m, de.wikipedia "Stadler Regio-Shuttle RS 1"). */
const C = 3.7;
/** The body from tip to tip and its own length between the joins. */
const TIP_TO_TIP = 24.2;
const L = TIP_TO_TIP - 2 * JOIN;
/** A position along the car in the side photograph (m behind the front tip of its 24.46 m body) scaled onto the model, as d behind the body's front end. */
const at = (p: number): number => TIP_TO_TIP / 2 + (p - 12.23) * (TIP_TO_TIP / 24.46) - JOIN;

/**
 * The face's centre line, measured on the side-on photograph (19.25 px/m): upright from the foot to
 * the lamps, leaning back past the windscreen (0.18 m back at its middle) and rounding over into the
 * roof above the destination display, the crown reached 1.2 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.5, 0.02], [0.6, 0], [1.2, 0], [1.7, 0.03], [2.2, 0.08], [2.7, 0.17], [3.0, 0.27], [3.25, 0.42], [3.42, 0.6], [3.55, 0.8], [3.64, 1.0], [3.69, 1.18], [C, JOIN],
];

/** The windscreen's black surround (with the display at its head), the glass and the display. */
const MASK = { lat: [-1.13, 1.13] as const, y: [1.88, 3.47] as const };
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.9, 1.88, 3.47])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The grille left of the face's centre: black, with four slats. */
const GRILLE = { lat: [-0.64, -0.2] as const, y: [1.56, 1.73] as const };

/** The DB logo on the face's centre under the windscreen, 0.28 by 0.2 m: its white ground inside the face's own red frame and the letters in bars (the ODEG's paint takes the face's yellow for both). */
const LOGO: Pt = [0.03, 1.6];
const logo = (pts: Pt[]): Pt[] => pts.map(([l, y]): Pt => [LOGO[0] + l * 0.7, LOGO[1] + (y - 2.115) * 1.05]);
const LOGO_GROUND = logo(box(-0.185, 0.185, 2.035, 2.195));
const LOGO_LETTERS: Pt[][] = ([
  box(-0.14, -0.115, 2.065, 2.165), box(-0.115, -0.05, 2.065, 2.085), box(-0.115, -0.05, 2.145, 2.165), box(-0.05, -0.028, 2.085, 2.145),
  box(0.02, 0.045, 2.065, 2.165), box(0.045, 0.11, 2.065, 2.085), box(0.045, 0.105, 2.105, 2.125), box(0.045, 0.11, 2.145, 2.165),
  box(0.11, 0.132, 2.085, 2.105), box(0.105, 0.127, 2.125, 2.145),
] as Pt[][]).map(logo);

export const BR650_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.0, reach: 0.3, first: 2.4, roofFrom: C + 0.01, bulge: 0.04, tolerance: 0.03, cols: [5, 2, 1, 1],
  profile: PROFILE,
  // the face's corners rounded 0.3 m in plan, tightening where the face rounds over into the roof (inside the join)
  corner: [[0.5, 0.25], [1.7, 0.28], [2.9, 0.3], [3.3, 0.35], [3.55, 0.3], [3.64, 0.2], [3.69, 0.06], [C, 0.02]],
  rows: ROWS,
  fields: [{ mat: "logoWhite", pts: LOGO_GROUND }],
  masks: [{ lat: MASK.lat, y: MASK.y, r: 0.1, mat: "black" }],
  panes: [{ lat: [-1.08, 1.08], y: [1.93, 3.22], r: 0.06 }],
  // single layers on the skin (decals laid over one another would lie in one plane)
  decals: [
    // the destination display over the black surround, the coupler's recess between the buffers
    { mat: "display", pts: box(-0.86, 0.86, 3.28, 3.45), fine: 2 },
    { mat: "recess", pts: [[-0.74, 0.88], [0.74, 0.88], [0.74, 1.36], [0.66, 1.43], [-0.66, 1.43], [-0.74, 1.36]], fine: 1 },
    // the grille's four slots, and the small lamps under the headlights
    ...[0, 1, 2, 3].map((k) => ({ mat: "black", pts: box(GRILLE.lat[0], GRILLE.lat[1], GRILLE.y[0] + k * 0.045, GRILLE.y[0] + 0.03 + k * 0.045), fine: 1 })),
    ...[1, -1].map((sd) => ({ mat: "lampHead", pts: box(sd * 0.9 - 0.09, sd * 0.9 + 0.09, 1.49, 1.56), fine: 1 })),
    ...LOGO_LETTERS.map((pts) => ({ mat: "logoRed", pts, fine: 1 })),
  ],
  lamps: [[-0.9, 1.69, 0.105, "lampHead"], [0.9, 1.69, 0.105, "lampHead"], [0, 3.6, 0.055, "lampHead"]],
  number: { lat: -0.68, y: 1.77, h: 0.085, mat: "faceNo" },
  wipers: [[[0.03, 1.96], [0.92, 2.66]]],
  lodGlass: { hw: 1.08, y: [1.93, 3.22] },
};

/** The cab side window behind the face's corner (on the cab's flat side), its front edge raked with the face: [y, d front, d back] behind the tip. */
const CAB_WINDOW: ReadonlyArray<readonly [number, number, number]> = [[2.44, 0.46, 1.16], [3.2, 0.8, 1.16]];

const COMMON = {
  black: c("#141618", 0.3), recess: c("#3a3d40", 0.6), slat: c("#5c6064", 0.5), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true },
  roofBox: c("#e4e5e3", 0.45), grille: c("#2e3134", 0.7), exhaustPipe: c("#2b2c2e", 0.6),
};

/** DB Regio: traffic red, a light grey stripe low on the sides, light grey doors, the dark foot and underframe. */
function dbRegio(title: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: { ...COMMON, red: c(TRAFFIC_RED), lightG: c("#d7dadc", 0.35), dark: c("#3c3f43", 0.7), roofG: c("#c9cccd", 0.55), faceNo: c("#f4f4f2"), logoWhite: c("#f4f4f2"), logoRed: c(TRAFFIC_RED) },
    bands: [[0, 0.6, "dark"], [0.6, 0.95, "lightG"], [0.95, 9, "red"]],
    front: [[0, 0.9, "dark"], [0.9, 9, "red"]],
    doors: [[0, 9, "lightG"]],
    roof: "roofG", skirt: "dark",
  };
}

/** The ODEG's paint: silver sides, the cab ends and door bays yellow, green stripes and skirt, thin yellow lines fading toward the middle. */
const ODEG_STRIPES: ReadonlyArray<readonly [number, number, number]> = [
  // [y0, y1, how far behind the tip]: five lines over the end windows, shortening upward, and three under them
  [2.86, 2.91, 4.9], [2.96, 3.01, 4.55], [3.06, 3.11, 4.2], [3.16, 3.21, 3.85], [3.26, 3.3, 3.5],
  [1.31, 1.36, 4.6], [1.07, 1.12, 4.3], [0.97, 1.02, 3.6],
];
function odeg(title: string, number: string): ShinkansenLivery {
  const front = (p: number): Pt[] => [[0.6, p], [3.4, p]];
  // the end sections' lines, and the same at the rear end (d behind the front tip)
  const lines = ODEG_STRIPES.flatMap(([y0, y1, d]) => [
    { mat: "yellow", front: [[y0, JOIN], [y1, JOIN]] as Pt[], back: [[y0, d], [y1, d]] as Pt[] },
    { mat: "yellow", front: [[y0, TIP_TO_TIP - d], [y1, TIP_TO_TIP - d]] as Pt[], back: [[y0, TIP_TO_TIP - JOIN - 0.01], [y1, TIP_TO_TIP - JOIN - 0.01]] as Pt[] },
  ]);
  // the yellow bays round the doors: 0.3 m beside the leaves from the skirt to the roof, and over the doors (overDoors)
  const bays = [at(6.27) + JOIN, TIP_TO_TIP - at(6.27) - JOIN].flatMap((dc) => [[dc - 1.1, dc - 0.8], [dc + 0.8, dc + 1.1]].map(([a, e]) => ({ mat: "yellow", front: front(a!), back: front(e!) })));
  return {
    title, number,
    palette: { ...COMMON, silver: c("#e7e8e5", 0.35), yellow: c("#f3ae00", 0.4), green: c("#00705a", 0.45), roofG: c("#d9dbd9", 0.55), faceNo: c("#24302c"), logoWhite: c("#f3ae00", 0.4), logoRed: c("#f3ae00", 0.4) },
    bands: [[0, 0.6, "green"], [0.6, 0.95, "green"], [0.95, 1.2, "silver"], [1.2, 1.26, "green"], [1.26, 1.42, "silver"], [1.42, 1.6, "green"], [1.6, 9, "silver"]],
    front: [[0, 0.95, "green"], [0.95, 9, "yellow"]],
    doors: [[0, 9, "yellow"]], overDoors: [[3.2, 3.3, "yellow"]],
    roof: "roofG", skirt: "green",
    endSweeps: [
      // the yellow cab ends with the green stripes carried on round them
      { mat: "yellow", front: [[0.6, -9], [3.4, -9]], back: [[0.6, JOIN + 0.06], [3.4, JOIN + 0.06]] },
      { mat: "yellow", front: [[0.6, TIP_TO_TIP - JOIN - 0.06], [3.4, TIP_TO_TIP - JOIN - 0.06]], back: [[0.6, TIP_TO_TIP - JOIN - 0.01], [3.4, TIP_TO_TIP - JOIN - 0.01]] },
      ...[[1.2, 1.26], [1.42, 1.6]].flatMap(([y0, y1]) => [
        { mat: "green", front: [[y0!, -9], [y1!, -9]] as Pt[], back: [[y0!, JOIN + 0.06], [y1!, JOIN + 0.06]] as Pt[] },
        { mat: "green", front: [[y0!, TIP_TO_TIP - JOIN - 0.06], [y1!, TIP_TO_TIP - JOIN - 0.06]] as Pt[], back: [[y0!, TIP_TO_TIP - JOIN - 0.01], [y1!, TIP_TO_TIP - JOIN - 0.01]] as Pt[] },
      ]),
      ...bays,
      ...lines,
    ],
  };
}

/** Body spans of a double door's two 0.8 m leaves parting at d. */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.8, d, -1], [d, d + 0.8, 1]];
const DOOR_1 = at(6.27);
const DOOR_2 = L - DOOR_1;
/** The window bands: the end sections' (a black blank panel next to the cab) and the middle's, symmetric about the car's middle. */
const END_WIN: readonly [number, number] = [0.04, at(4.95)];
const BLANK = at(2.0);
const MID_HALF = 4.53;
const WIN_Y: readonly [number, number] = [1.65, 2.75];

/**
 * The slanting pillars of the trapezoid window bands, [d at the head, d at the sill] behind the body's
 * front: the side photograph's six in the middle (V shapes about its centre) and two in each end window.
 */
const PILLARS: ReadonlyArray<readonly [number, number]> = (() => {
  const mid = L / 2;
  const m: Array<readonly [number, number]> = [[-3.97, -3.53], [-1.98, -2.43], [-1.0, -0.56]];
  const end: Array<readonly [number, number]> = [[at(2.48), at(2.87)], [at(4.37), at(3.98)]];
  return [
    ...end, ...end.map(([a, b]): readonly [number, number] => [L - a, L - b]),
    ...m.map(([a, b]): readonly [number, number] => [mid + a, mid + b]), ...m.map(([a, b]): readonly [number, number] => [mid - a, mid - b]),
  ];
})();

/** The roof units, the exhausts, the window pillars and the underfloor of the railcar. */
function br650Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("window pillars", () => {
    const w = 0.06, [y0, y1] = [WIN_Y[0] + 0.04, WIN_Y[1] - 0.04];
    for (const sd of [1, -1]) {
      const tris: Pt[] = [];
      for (const [top, foot] of PILLARS) tris.push([foot - w, y0], [foot + w, y0], [top + w, y1], [foot - w, y0], [top + w, y1], [top - w, y1]);
      // the black blank panels next to the cabs
      for (const [a, e] of [[END_WIN[0] + 0.04, BLANK], [L - BLANK, L - END_WIN[0] - 0.04]] as const) tris.push([a, y0], [e, y0], [e, y1], [a, y0], [e, y1], [a, y1]);
      sideDecal(m, b, X, sd, "black", tris, 0.016);
      // the transom over the hopper lights across each band (under the pillars)
      const bars: Pt[] = [];
      for (const [a, e] of [[BLANK, END_WIN[1] - 0.04], [L / 2 - MID_HALF + 0.04, L / 2 + MID_HALF - 0.04], [L - END_WIN[1] + 0.04, L - BLANK]] as const)
        bars.push([a, 2.5], [e, 2.5], [e, 2.54], [a, 2.5], [e, 2.54], [a, 2.54]);
      sideDecal(m, b, X, sd, "black", bars, 0.014);
    }
  });
  m.scope("cab windows", () => {
    // on the cab's flat side ahead of the join (d < 0), at both ends: a black frame and the glass
    const [[ya, fa, ba], [yb, fb, bb]] = CAB_WINDOW as [readonly [number, number, number], readonly [number, number, number]];
    const quad = (k: number, end: number): Pt[] => {
      const dd = (dt: number) => (end > 0 ? dt - JOIN : L + JOIN - dt);
      const p: Pt[] = [[dd(fa - k), ya - k], [dd(ba + k), ya - k], [dd(bb + k), yb + k], [dd(fb - k * 0.6), yb + k]];
      return end > 0 ? [p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!] : [p[0]!, p[2]!, p[1]!, p[0]!, p[3]!, p[2]!];
    };
    for (const sd of [1, -1]) for (const end of [1, -1]) {
      sideDecal(m, b, X, sd, "black", quad(0.04, end), 0.006);
      sideDecal(m, b, X, sd, "cabGlass", quad(0, end), 0.011);
    }
  });
  m.scope("roof equipment", () => {
    // a low unit with grilles along its sides
    const unit = (name: string, d0: number, d1: number) => m.scope(name, () => {
      blk("roofBox", d0 + 0.3, d1 - 0.3, C - 0.1, C + 0.16, -0.82, 0.82);
      blk("roofBox", d0, d1, C - 0.1, C + 0.11, -0.82, 0.82);
      for (const sd of [1, -1]) for (let k = 0; k < 3; k++) {
        const [a, e] = [d0 + 0.5 + k * ((d1 - d0 - 1.0) / 3) + 0.08, d0 + 0.5 + (k + 1) * ((d1 - d0 - 1.0) / 3) - 0.08];
        blk("grille", a, e, C - 0.04, C + 0.07, sd > 0 ? 0.82 : -0.83, sd > 0 ? 0.83 : -0.82);
      }
    });
    // the cooling unit over the front end section and the air conditioning over the rear of the middle
    unit("cooling unit", 0.1, 5.3);
    unit("air conditioning", L / 2 - 0.4, DOOR_2 + 0.5);
    // an exhaust behind each cab on the cab's left, the rear one on the other side (the photographs' black stacks)
    for (const [d, z] of [[0.25, -0.55], [L - 0.25, 0.55]] as const)
      m.scope("exhaust stack", () => {
        const x = X(d);
        m.emit("smoke", [x, C + 0.32, z], 0.06);
        m.loft("exhaustPipe", ngon(8, 0.06, 0, x, z), C - 0.06, ngon(8, 0.06, 0, x, z), C + 0.22);
        m.loft("exhaustPipe", ngon(10, 0.12, 0, x, z), C + 0.22, ngon(10, 0.09, 0, x, z), C + 0.32);
      });
  });
  m.scope("underfloor", () => {
    // the power packs beside the bogies under the raised ends, the tanks under the low floor
    const y1 = 0.5;
    for (const d of [5.75, L - 5.75]) blk("under", d - 0.7, d + 0.7, 0.28, y1, -1.0, 1.0);
    blk("under", 7.2, 9.8, 0.3, y1, -0.95, 0.95);
    blk("under", L - 9.8, L - 7.2, 0.3, y1, -0.95, 0.95);
  });
}

export const BR650: ShinkansenSeries = {
  // 25.5 m over the buffers, 24.46 m body, 2.9 m wide, 3.7 m high; low floor 0.6 m (de.wikipedia)
  endLength: 25.5, midLength: 25.5, W: 1.45, Y: 0.95, S: 3.3, C, lean: 0.985, B: 0.5, A: 0.6,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BR650_FACE,
  // the window bands 1.65 - 2.75 m; double plug doors 1.6 m wide, a narrow window 0.3 m wide in each leaf
  windows: [WIN_Y], windowW: 1.2, pitch: 1.6, door: [0.62, 3.2, 1.32, 2.76], doorW: 1.6, doorGlassW: 0.3,
  layout: {
    end: {
      doors: [...door(DOOR_1), ...door(DOOR_2)],
      windows: [END_WIN, [L / 2 - MID_HALF, L / 2 + MID_HALF], [L - END_WIN[1], L - END_WIN[0]]],
    },
    middle: { doors: [], windows: [] },
  },
  sidePanels: {
    // the louvres over the end windows and over the middle's windows next to the doors (d behind the tip)
    end: [[3.55, 4.48], [8.2, 9.15], [15.31, 16.26], [19.98, 20.91]].map(([a, e]) => ({ d: [at(a!) + JOIN, at(e!) + JOIN] as const, y: [2.9, 3.06] as const, kind: "louvres" as const, louvres: 6 })),
  },
  // B'B': the bogies 17.1 m apart, 1.8 m wheelbase (the kit's least 2.05 m), 770 mm wheels
  bogieCentres: 17.1, wheelR: 0.385, wheelbase: 2.2, traction: "diesel", single: true, endCoupler: "buffers",
  fittings: (m, b, X) => br650Fittings(m, b, X),
  // the front cooling unit in the distant model
  lodRoof: { d: [JOIN + 0.1, JOIN + 5.3], hw: 0.82, y: [C - 0.1, C + 0.13], mat: "roofBox" },
  liveries: { dbRegio: dbRegio("DB Regio", "650 322"), odeg: odeg("ODEG", "VT 650.62") },
  weight: { end: 40, middle: 40 }, power: 514, maxspeed: 120,
};
