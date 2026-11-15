// NS SGM "Sprinter" (Stadsgewestelijk Materieel, Plan Y; Talbot 1975-1983): the two-car SGM-II and
// the three-car SGM-III suburban units, drawn on the series kit (shinkansen.ts) with their own cab face
// (seriesCab.ts) - the short, upright front bowed in plan with generously rounded corners, the three
// windscreen panes in black frames (the outer two wrapping round the corners onto the cab sides), the
// round marker lamp under the middle pane, the crease at 1.88 m over the lamp band with its two lamp
// housings (head and tail lamp each) and the grille between them, the Scharfenberg coupler in its
// recess and the skirt rounding under - and the side as the photographs show it: the cab door with its
// narrow window, three double swing-plug doors a side on an end car (one behind the cab, one in the
// middle, one at the inner end; 1.3 m wide, a narrow window in each leaf) with five windows ahead of the
// middle door and four wider ones behind it, the single-arm pantograph over the middle door of each end
// car. Two schemes: the original NS yellow with grey doors and roof (1975 - the 1990s), and the
// modernised SGMm's Sprinter scheme of 2003 - 2009 (white over yellow and blue, the windows set in blue
// bands, yellow doors, the blue cab front), whose middle car carries the third door the revision added.
// Matched to the photographs and published figures in assets/ns-sgm/ (SOURCES.md). See
// docs/models/netherlands-trains.md.
//
// Heights over the rail. On the face, d behind its tip (the bumper band's front); elsewhere d behind
// the body's front end (the face's join, JOIN behind the tip, on the end car).

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** Where the face meets the body: the cab's roof dome has reached the crown (the side windows of the windscreen end 0.63 m behind the tip). */
const JOIN = 0.8;
/** The crown over the rail (3.89 m, nl.wikipedia "Stadsgewestelijk Materieel"). */
const C = 3.89;
/** Lengths over the couplers: 52.2 m for two cars, 78.7 m for three (the middle car 26.5 m). */
const END_LENGTH = 26.1;
const MID_LENGTH = 26.5;
/** The coupler's head ahead of the face's tip. */
const REACH = 0.3;
/** The end car's body from the tip to its inner end (the kit's coupling gap behind it). */
const TIP_TO_END = END_LENGTH - REACH - 0.25;
/**
 * A position measured on the photographs (m behind the tip of a 25.9 m body: the projective fit over
 * three side views, 2873, the 1980s unit at Amsterdam CS and 2983) scaled onto the model's body, as d
 * behind the body's front end.
 */
const at = (p: number): number => (p * TIP_TO_END) / 25.9 - JOIN;

/**
 * The face's centre line, read from the head-on (SGM-III at 91 px/m) and the three-quarter photographs:
 * the skirt rounding under from the coupler's foot, the bumper band upright from 1.3 to the crease at
 * 1.88 m, the upper face set back a few centimetres there and leaning back past the windscreen
 * (2.81 - 3.54 m), the roof dome rounding back to the crown 0.8 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.8, 0.3], [0.92, 0.18], [1.04, 0.09], [1.16, 0.035], [1.3, 0], [1.86, 0], [1.9, 0.035], [2.36, 0.065], [2.81, 0.1], [3.2, 0.15],
  [3.54, 0.21], [3.64, 0.27], [3.73, 0.36], [3.8, 0.47], [3.85, 0.6], [3.88, 0.72], [C, JOIN],
];

/** The windscreen: the middle pane and the two outer panes wrapping round the corners, each in its black frame. */
const WS: readonly [number, number] = [2.81, 3.54];
const FRAME = 0.04;
const PANES = [
  { lat: [-0.6, 0.6] as const, y: WS, r: 0.07 },
  { lat: [0.73, 1.7] as const, y: WS, r: 0.09 },
  { lat: [-1.7, -0.73] as const, y: WS, r: 0.09 },
];

/** The lamp band's housings: their centres (lat), the white head lamp inward and the red tail lamp outward. */
const POD = { lat: 0.725, y: 1.705, w: 0.53, h: 0.3 };

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.0, 1.2, 1.38, 1.53, 1.56, 1.84, 2.77, 2.4, 2.6, 3.58, 3.66])].sort((a, b) => a - b);

/** The original face (no number on the front). */
const SGM_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.62, reach: REACH, first: at(2.1) + JOIN, roofFrom: 3.73, bulge: 0.08, wrap: true, tolerance: 0.02, cols: [6, 4, 1, 1],
  profile: PROFILE,
  // rounded 0.35 - 0.42 m in plan, tightening where the dome rounds into the roof
  corner: [[0.8, 0.3], [1.3, 0.36], [2.8, 0.42], [3.3, 0.46], [3.54, 0.5], [3.73, 0.4], [3.85, 0.18], [C, 0.02]],
  rows: ROWS,
  fields: [
    // the coupler's recess under the lamp band, and the grille's ground between the housings
    { mat: "recess", pts: [[-0.5, 0.8], [0.5, 0.8], [0.5, 1.33], [0.44, 1.38], [-0.44, 1.38], [-0.5, 1.33]] },
    { mat: "grilleGround", pts: box(-0.32, 0.32, 1.56, 1.84) },
  ],
  masks: PANES.map((p) => ({ lat: [p.lat[0] - FRAME, p.lat[1] + FRAME] as const, y: [WS[0] - FRAME, WS[1] + FRAME] as const, r: p.r + FRAME, mat: "black" })),
  panes: PANES,
  // the grille's five slats
  decals: [0, 1, 2, 3, 4].map((k) => ({ mat: "grilleSlat", pts: box(-0.29, 0.29, 1.6 + k * 0.05, 1.625 + k * 0.05), fine: 1 })),
  pods: [1, -1].map((sd) => ({
    lat: sd * POD.lat, y: POD.y, w: POD.w, h: POD.h, r: 0.12, proud: 0.02, depth: 0.04, mat: "lampPod",
    lamps: [[-sd * 0.11, 0.095, "lampHead"], [sd * 0.12, 0.095, "lampRed"]] as const,
  })),
  // the marker lamp under the middle pane
  lamps: [[0, 2.52, 0.105, "lampHead"]],
  wipers: [[[0.18, 3.5], [0.4, 2.92]]],
  lodGlass: { hw: 1.3, y: WS },
};

/** The modernised face: the running number low on the left of the blue skirt. */
const SGM_M_FACE: SeriesCabFace = { ...SGM_FACE, number: { lat: -1.0, y: 0.95, h: 0.13, mat: "faceNo" } };

const COMMON: Record<string, MaterialSpec> = {
  black: c("#141618", 0.3), recess: c("#1f2124", 0.7), grilleSlat: c("#4a4e52", 0.5), resistor: c("#3b3e42", 0.7), resistorGrid: c("#1c1e20", 0.8),
  couplerCover: c("#c8322b", 0.5),
  lampRed: { color: "#b3261e", metallic: 0, roughness: 0.2, lamp: { role: "tail" } },
};

/** The original scheme (2873 in 1990, the 1980s unit at Amsterdam CS): NS yellow all over, grey doors, the dark grey roof, black skirt and frames. */
const SGM_YELLOW: ShinkansenLivery = {
  title: "NS yellow, grey", number: "2023",
  palette: {
    ...COMMON, yellow: c(NS_YELLOW, 0.45), doorGrey: c("#676d72", 0.5), roofG: c("#55595d", 0.65), skirtG: c("#25272a", 0.75),
    lampPod: c("#18191b", 0.4), grilleGround: c("#18191b", 0.6), faceNo: c("#18191b"), lettering: c("#18191b"),
  },
  bands: [[0, 1.0, "skirtG"], [1.0, 9, "yellow"]],
  front: [[0, 1.04, "skirtG"], [1.04, 9, "yellow"]],
  doors: [[0, 9, "doorGrey"]],
  roof: "roofG", skirt: "skirtG",
};

/** The SGMm's Sprinter scheme (2133, 2140, 2983): blue skirt, yellow band, white sides, the blue roof edge and the blue front over the lamp band. */
const SGM_SPRINTER: ShinkansenLivery = {
  title: "NS Sprinter", number: "2133",
  palette: {
    ...COMMON, white: c("#f1f1ee", 0.4), yellow: c(NS_YELLOW, 0.45), blue: c(NS_BLUE, 0.4), roofG: c("#a9adb0", 0.6), skirtG: c("#25272a", 0.75),
    lampPod: c(NS_BLUE, 0.4), grilleGround: c("#c7cacc", 0.35), faceNo: c("#f4f4f2"), roofBox: c("#3d4145", 0.6), lettering: c("#2a2c30"),
  },
  bands: [[0, 1.16, "blue"], [1.16, 1.53, "yellow"], [1.53, 3.2, "white"], [3.2, 9, "blue"]],
  front: [[0, 1.16, "blue"], [1.16, 1.53, "yellow"], [1.53, 2.36, "white"], [2.36, 9, "blue"]],
  doors: [[0, 9, "yellow"]],
  // the blue carried over the roof's edges, the equipment's grey along the crown
  roof: "blue", skirt: "skirtG", roofStripe: { z: 0.95, mat: "roofG" },
};

/** Body spans of a 1.3 m double swing-plug door's two leaves, from d. */
const door = (d: number): Array<readonly [number, number, number]> => [[d, d + 0.65, -1], [d + 0.65, d + 1.3, 1]];
/** n windows w wide at pitch p from d. */
const row = (d: number, n: number, w: number, p: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d + i * p, d + i * p + w] as const);

/** The end car (both schemes): the door behind the cab, five windows, the middle door, four wider windows, the door at the inner end. */
const END: SeriesLayout = {
  doors: [...door(at(2.1)), ...door(at(11.95)), ...door(at(22.25))],
  windows: [...row(at(3.88), 5, 1.2, 1.53), ...row(at(14.1), 4, 1.43, 1.88)],
};
/** The original middle car: two doors a side ("maar twee balkons"), two windows at one end, eight between the doors. */
const MID: SeriesLayout = {
  doors: [...door(5.9), ...door(21.1)],
  windows: [...row(2.3, 2, 1.25, 1.55), ...row(7.75, 8, 1.25, 1.6)],
};
/** The SGMm's middle car: the revision's third door among the eight windows (2, 3 and 4 between the doors). */
const MID_M: SeriesLayout = {
  doors: [...door(5.9), ...door(12.7), ...door(21.1)],
  windows: [...row(2.3, 2, 1.25, 1.55), ...row(7.75, 3, 1.25, 1.55), ...row(14.55, 4, 1.25, 1.55)],
};

/** The window rows' sill and head, the doors' sill and head and their leaves' windows. */
const WIN: readonly [number, number] = [2.05, 2.98];

/** Consecutive windows less than 0.5 m apart, as one group's span. */
function groups(spans: ReadonlyArray<readonly [number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [a, e] of spans) {
    const last = out[out.length - 1];
    if (last && a - last[1] < 0.5) last[1] = e;
    else out.push([a, e]);
  }
  return out;
}

/** The roof equipment, the window bands (the Sprinter scheme's), the cab door and the underfloor of a car. */
function sgmFittings(modern: boolean) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void => {
    const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
    if (modern) m.scope("window bands", () => {
      // the blue band each group of windows is set in, behind the windows' frames
      const spans = car.end ? END.windows : MID_M.windows;
      for (const sd of [1, -1]) for (const [a, e] of groups(spans)) sidePanel(m, b, X, sd, "blue", a - 0.1, e + 0.1, WIN[0] - 0.1, WIN[1] + 0.1, 0.003, 0.002);
    });
    if (car.end) {
      m.scope("cab door", () => {
        // the cab door's outline behind the face's join, its narrow window drawn with the cab windows
        const [d0, d1, y0, y1, k] = [at(0.96), at(1.56), 1.05, 3.18, 0.018];
        for (const sd of [1, -1]) {
          sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
          sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
          sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
          sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.005, 0.02);
        }
      });
      m.scope("coupler", () => {
        // the red cover over the Scharfenberg coupler's head (the kit draws the coupler)
        const tip = X(-JOIN), k = Math.sign(tip - X(0));
        const out = (mat: string, a: number, e: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, z0, z1);
        out("couplerCover", 0.0, REACH - 0.06, 1.16, 1.3, -0.2, 0.2);
      });
      if (modern) m.scope("mirrors", () => {
        // the SGMm's rear-view mirrors in blue housings beside the windscreen's outer panes
        for (const sd of [1, -1]) {
          const z = sd * 1.4;
          blk("blue", -0.05, 0.12, 2.75, 3.25, Math.min(z, z + sd * 0.12), Math.max(z, z + sd * 0.12));
        }
      });
      m.scope("roof equipment", () => {
        // the SGMm's air-conditioning unit right behind the cab
        if (modern) m.scope("air conditioning", () => blk("roofBox", at(1.15), at(3.7), C - 0.06, C + 0.34, -0.72, 0.72));
        // the starting resistors' grids ahead of the pantograph, on a low frame
        m.scope("resistors", () => {
          const [d0, d1] = [at(modern ? 4.1 : 2.6), at(11.0)];
          blk("resistor", d0, d1, C - 0.08, C + 0.06, -0.78, 0.78);
          const n = Math.round((d1 - d0) / 1.1);
          for (let k = 0; k < n; k++) {
            const [a, e] = [d0 + ((d1 - d0) * k) / n + 0.06, d0 + ((d1 - d0) * (k + 1)) / n - 0.06];
            blk("resistorGrid", a, e, C + 0.06, C + 0.24, -0.7, 0.7);
          }
        });
      });
    }
    m.scope("underfloor", () => {
      // the equipment cases between the bogies
      const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
      blk("under", t0 + 2.2, t1 - 2.2, 0.45, 0.82, -1.15, 1.15);
    });
  };
}

const BASE = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W: 1.4, Y: 1.25, S: 3.4, C, lean: 0.97, B: 0.8, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0] as const, lamps: [0, 0] as const,
  // the window band 2.05 - 2.98 m; doors 1.3 m wide (nl.wikipedia), a narrow window in each leaf
  windows: [WIN], windowW: 1.2, pitch: 1.53, door: [1.0, 3.18, WIN[0], WIN[1]] as const, doorW: 1.3, doorGlassW: 0.2,
  // the cab door's narrow window
  cabWindows: [[at(1.12), at(1.36), 2.2, 2.88]] as const,
  // Bo'Bo' end cars, the leading bogie under the cab door, the trailing one ahead of the inner door; the middle car's 2'2'
  bogieCentres: 18.5, wheelR: 0.47, wheelbase: 2.5, endBogies: [at(2.5), at(21.0)] as const, midBogies: [3.9, 22.1] as const,
  // a single-arm pantograph over the middle door of each end car
  endPantograph: true, pantographAt: at(12.6),
  cars: [2, 3],
  // 106 t for two cars, 142 t for three; 8 x 160 kW, all on the end cars (nl.wikipedia)
  weight: { end: 53, middle: 36 }, power: 640, maxspeed: 125,
} satisfies Omit<ShinkansenSeries, "liveries" | "cabFace">;

/** The original SGM (the default, `yellowGrey`). */
export const SGM: ShinkansenSeries = {
  ...BASE, cabFace: SGM_FACE,
  layout: { end: END, middle: MID },
  fittings: sgmFittings(false),
  liveries: { yellowGrey: SGM_YELLOW, sprinter: SGM_SPRINTER },
};

/** The modernised SGMm (the `sprinter` scheme): the air conditioning behind the cab (left out of the distant model, which keeps the pantograph), the middle car's third door, the number on the front. */
export const SGM_M: ShinkansenSeries = {
  ...SGM, cabFace: SGM_M_FACE,
  layout: { end: END, middle: MID_M },
  fittings: sgmFittings(true),
};

/** The series a selection draws: the Sprinter scheme is the modernised unit. */
export const sgmSeries = (v?: { livery?: string }): ShinkansenSeries => (v?.livery === "sprinter" ? SGM_M : SGM);

/**
 * The game's figures, the series kit's with the middle car unpowered: the kit gives every car the
 * motor car's power, the SGM-III's middle car (2'2') has none (1,280 kW for two and three cars).
 */
export function sgmGame(g: GameProperties): GameProperties {
  return {
    ...g,
    variants: g.variants?.map((v) => (v.params.unit === "middleCar" ? { ...v, power: 0 } : v.params.unit === "train" ? { ...v, power: 2 * BASE.power } : v)),
  };
}
