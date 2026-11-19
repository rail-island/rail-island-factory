// Renfe class 446 (CAF, Macosa, MTM; 1989 - 1993): the three-car Cercanias EMU (M-R-M, Bo'Bo' + 2'2' +
// Bo'Bo', 3,000 V DC), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts) - the
// flat front with its slight rake, the big black windscreen in one pane, the red cap over it (the running
// number, the destination display, the twin headlight in its box and the two marker lamps), the white
// lower face with the C emblem, the lamp boxes low on the corners over the dark bumper and the coupler's
// recess - and the side as the photographs show it: three double sliding-plug doors a side on every car,
// the windows set in a dark band, the red line under the roof, the red and purple lines low on the side
// sweeping down to the skirt behind the cab, the red cab sides. The motor cars carry the long louvred
// resistor fairing on the roof; the trailer both single-arm pantographs, one near each end (the rear one
// raised). The current Cercanias scheme (Renfe lettering, purple line; 180M, 260M, 281M, 030M).
// Matched to the photographs in assets/renfe-446/ (SOURCES.md). See docs/models/spain-trains.md.
//
// Measurements. Published (es.wikipedia "Serie 446 de Renfe"): 75.993 m over the couplers, 2.94 m wide,
// 4.185 m high (over the resistor fairing), 166.6 t, 2,400 kW (four 300 kW motors on each motor car),
// 100 km/h, 240 seats. Photographs:
// - photo-renfe-446-los-alamos.jpg (176M head-on): 108 px/m across the 2.94 m body; the heights over the
//   rail from the crown (3.82 m) and the fairing's top (4.185 m): the windscreen 2.31 - 3.15 m, the red
//   under it from 2.13 m, the lamp boxes 1.24 - 1.48 m, the display 3.22 - 3.33 m, the coupler's recess
//   1.39 m wide.
// - photo-l06-233-bf-san-pol-del-mar-446-225.jpg (446 225 from above, weak perspective): the motor car at
//   11.5 px/m (287 px from the face to the joint), the trailer at 10.6 px/m; the doors' places along both
//   cars (the orange door tops of the Rodalies scheme), the fairing's length, the trailer's roof.
// - photo-hugh-llewelyn-180-5553135644.jpg (180M) and photo-ut446.jpg (281M): the face's paint, the cab
//   side, the sweep of the red and purple lines; about 225 px/m on 180M's side by the window band.
// - photo-renfe-s-446-emu-at-pozuelo-...-1 and photo-pantograph-on-top-...jpg: the trailer (7-446) with a
//   pantograph near each end; photo-class-446-250-1.jpg and photo-renfe-class-446-arriving-at-bilbao.jpg:
//   the fairing and both pantographs from above.
//
// Heights over the rail. On the face, d behind its tip (the bumper's front); elsewhere d behind the body's
// front end (the face's join, JOIN behind the tip, on a motor car; the +X end on the trailer).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { insulator, singleArm } from "./czElectricKit.ts";

/** Where the face meets the body: the cab's roof dome has reached the crown. */
const JOIN = 0.6;
/** The crown over the rail (the fairing's top at the published 4.185 m stands 0.37 m over it). */
const C = 3.82;
/** The shoulder, where the roof's arc starts (the red line under it at 3.12 - 3.17 m). */
const S = 3.45;
/** The coupler's head ahead of the face's tip. */
const REACH = 0.3;

/**
 * The face's centre line (the head-on and three-quarter photographs): the skirt rounding under to the
 * bumper's front (0.8 - 1.17 m), the white lower face standing 0.1 m behind it and leaning back a little,
 * the windscreen raked about 13 degrees (2.31 - 3.17 m), the red cap over it rounding into the roof dome,
 * which reaches the crown 0.6 m behind the tip.
 */
const PROFILE: Pt[] = [
  [0.5, 0.3], [0.62, 0.14], [0.72, 0.05], [0.8, 0], [1.17, 0], [1.2, 0.08], [1.5, 0.1], [2.13, 0.12], [2.31, 0.14],
  [2.7, 0.23], [3.17, 0.33], [3.4, 0.37], [3.55, 0.41], [3.64, 0.45], [3.72, 0.5], [3.78, 0.55], [C, JOIN],
];

/** The windscreen's black surround and its one pane. */
const WS: readonly [number, number] = [2.31, 3.17];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.6, 0.95, 1.22, 1.28, 1.46, 1.6, 1.85, 2.36, 3.12, 3.21, 3.33, 3.42, 3.48])].sort((a, b) => a - b);

const R446_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: REACH, first: 7.1 - 0.65, roofFrom: C + 1, bulge: 0.03, tolerance: 0.02, cols: [6, 4, 1, 1],
  profile: PROFILE,
  // square in plan with rounded corners (0.18 - 0.25 m), tightening where the dome rounds into the roof
  corner: [[0.5, 0.15], [1.17, 0.18], [2.3, 0.22], [3.2, 0.25], [3.55, 0.28], [3.72, 0.2], [C, 0.02]],
  rows: ROWS,
  // the dark bumper and skirt, the white lower face, the red cap from the line under the windscreen up
  bands: () => [[0, 1.19, "bumperG"], [1.19, 2.13, "white"], [2.13, 9, "red"]],
  lodGlass: { hw: 1.15, y: [2.36, 3.12] },
  masks: [
    // the coupler's recess, cut up into the white over the bumper
    { lat: [-0.66, 0.66], y: [0.62, 1.29], r: 0.14, mat: "recess" },
    // the windscreen's black surround, round onto the corners
    { lat: [-1.38, 1.38], y: WS, r: 0.06, mat: "black" },
  ],
  panes: [
    { lat: [-1.17, 1.17], y: [2.36, 3.12], r: 0.04 },
    { lat: [-0.38, 0.66], y: [3.21, 3.33], r: 0.02, mat: "display" },
  ],
  pods: [
    // the lamp boxes over the bumper: the headlight inward, the tail light outward
    ...[1, -1].map((sd) => ({ lat: sd * 0.93, y: 1.35, w: 0.52, h: 0.23, r: 0.03, proud: 0.015, depth: 0.03, mat: "lampPod", lamps: [[-sd * 0.07, 0.085, "lampHead"], [sd * 0.17, 0.045, "lampRed"]] as const })),
    // the twin headlight's box on the red cap
    { lat: 0.03, y: 3.54, w: 0.44, h: 0.17, r: 0.03, proud: 0.012, depth: 0.03, mat: "lampPod", lamps: [[-0.1, 0.055, "lampHead"], [0.1, 0.055, "lampHead"]] as const },
    // the marker lamps at the cap's corners
    ...[1, -1].map((sd) => ({ lat: sd * 0.95, y: 3.48, w: 0.32, h: 0.1, r: 0.02, proud: 0.01, depth: 0.03, mat: "lampPod" })),
  ],
  // the C emblem: a red disc under the (left out) lettering
  lamps: [[0, 1.62, 0.1, "red"]],
  texts: [{ text: "180M", lat: -0.78, y: 3.21, h: 0.12, mat: "white" }],
  wipers: [[[-0.38, 2.4], [-0.62, 3.02]], [[0.45, 2.4], [0.21, 3.02]]],
};

const PURPLE = "#7b2a83";

/**
 * The current Cercanias scheme (180M, 260M, 281M, 030M): white, the windows in a dark band, a red line
 * under the roof, a red over a purple line low on the side, white doors; the face's red cap carried back
 * over the cab sides and the roof's edges, the low lines sweeping down to the skirt behind the cab.
 */
const CERCANIAS: ShinkansenLivery = {
  title: "Cercanias", number: "446 180",
  palette: {
    white: c("#f1f1ee", 0.4), red: c("#d81e2c", 0.4), purple: c(PURPLE, 0.4), winBand: c("#33383d", 0.35),
    roofG: c("#6f7478", 0.65), skirtG: c("#3a3d40", 0.75), bumperG: c("#45494d", 0.6), recess: c("#1b1d1f", 0.8),
    black: c("#141618", 0.3), lampPod: c("#1d1f22", 0.4), display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true },
    fairing: c("#3b3f43", 0.7), louvre: c("#1e2023", 0.8), pantograph: c("#b8463b", 0.55), cabMask: c("#1d1f22", 0.3),
    lampRed: { color: "#b3261e", metallic: 0, roughness: 0.2, lamp: { role: "tail" } },
  },
  bands: [
    [0, 1.0, "skirtG"], [1.0, 1.33, "white"], [1.33, 1.45, "purple"], [1.45, 1.5, "white"], [1.5, 1.55, "red"], [1.55, 1.76, "white"],
    [1.76, 2.82, "winBand"], [2.82, 3.12, "white"], [3.12, 3.17, "red"], [3.17, 9, "white"],
  ],
  doors: [[0, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the cab sides and the cab door white over the window band
    { mat: "white", front: [[1.75, 0], [2.83, 0]], back: [[1.75, 2.15], [2.83, 2.15]] },
    // the red cap's cab sides, back past the cab side window
    { mat: "red", front: [[2.13, 0], [S, 0]], back: [[2.13, 1.3], [S, 1.3]] },
    // ahead of the sweep the side is white
    { mat: "white", front: [[1.0, 0], [1.56, 0]], back: [[1.0, 1.0], [1.3, 1.08], [1.4, 1.16], [1.44, 1.3], [1.45, 1.5], [1.56, 1.5]] },
    // the red line turning down to the skirt, wider on the way down
    { mat: "red", front: [[1.0, 0.7], [1.56, 0.93]], back: [[1.0, 0.9], [1.35, 1.0], [1.45, 1.08], [1.49, 1.2], [1.5, 1.3], [1.56, 1.6]] },
    // the purple line turning down behind it
    { mat: "purple", front: [[1.0, 1.0], [1.3, 1.08], [1.4, 1.16], [1.45, 1.4]], back: [[1.0, 1.16], [1.2, 1.22], [1.3, 1.3], [1.45, 1.7]] },
  ],
  // the red cap over the roof's edges above the cab
  endRoofEdge: { mat: "red", y: C - 0.02, d: [0, 1.3, 0.9] },
};

/** Body spans of a 1.3 m double sliding-plug door centred at d, its two leaves parting. */
const door = (d: number): Array<readonly [number, number, number]> => [[d - 0.65, d, -1], [d, d + 0.65, 1]];
/** Two windows filling [a, e], a 0.1 m pillar between them. */
const pair = (a: number, e: number): Array<readonly [number, number]> => [[a, (a + e) / 2 - 0.05], [(a + e) / 2 + 0.05, e]];

/** The motor car (body d behind the join): the doors 7.1, 13.2 and 19.1 m behind the tip (San Pol, 11.5 px/m), two windows between each. */
const MOTOR: SeriesLayout = {
  doors: [...door(7.1 - JOIN), ...door(13.2 - JOIN), ...door(19.1 - JOIN)],
  windows: [...pair(1.6, 5.7), ...pair(7.3, 11.8), ...pair(13.4, 17.7), ...pair(19.3, 24.2)],
};
/** The trailer (body d behind its +X end): the doors 7.45, 13.1 and 18.65 m from the end toward the leading motor car (San Pol, 10.6 px/m). */
const TRAILER: SeriesLayout = {
  doors: [...door(7.45), ...door(13.1), ...door(18.65)],
  windows: [[0.35, 2.4], [2.5, 4.55], [4.65, 6.65], ...pair(8.25, 12.3), ...pair(13.9, 17.85), ...pair(19.45, 23.95)],
};

/** The pantographs' places on the trailer, from each end. */
const PAN_IN = 2.7;
const MID_LENGTH = 24.8;
const MID_BODY = MID_LENGTH - 0.5;

/** The roof and underfloor equipment, the cab door and the mirrors. */
function r446Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  if (car.end) {
    m.scope("roof equipment", () => {
      // the resistors' fairing over the front two thirds of the car: a dark louvred box in six modules
      m.scope("resistor fairing", () => {
        const [d0, d1] = [FAIRING[0] - JOIN, FAIRING[1] - JOIN];
        // a wide lower part and a narrower top, each louvred along its sides, in six modules
        blk("fairing", d0, d1, C - 0.25, C + 0.1, -1.08, 1.08);
        blk("fairing", d0 + 0.1, d1 - 0.1, C + 0.1, C + 0.365, -0.86, 0.86);
        const n = 6, w = (d1 - d0) / n;
        for (let k = 0; k < n; k++) {
          const [a, e] = [d0 + k * w + 0.1, d0 + (k + 1) * w - 0.1];
          for (const sd of [1, -1]) {
            for (const [y0, y1] of [[C - 0.02, C + 0.05]]) blk("louvre", a, e, y0!, y1!, sd > 0 ? 1.08 : -1.09, sd > 0 ? 1.09 : -1.08);
            for (const [y0, y1] of [[C + 0.16, C + 0.21], [C + 0.27, C + 0.32]]) blk("louvre", a, e, y0!, y1!, sd > 0 ? 0.86 : -0.87, sd > 0 ? 0.87 : -0.86);
          }
          // the grille on the top
          blk("louvre", a + 0.15, e - 0.15, C + 0.365, C + 0.372, -0.6, 0.6);
        }
      });
      // the horn's red housing on the cab roof, off to the right
      m.scope("horn", () => blk("red", 0.05, 0.4, C - 0.06, C + 0.1, 0.56, 0.78));
    });
    m.scope("cab door", () => {
      // the cab door's outline behind the red cab side, its window drawn with the cab windows
      const [d0, d1, y0, y1, k] = [CAB_DOOR[0] - JOIN, CAB_DOOR[1] - JOIN, 1.05, 3.05, 0.018];
      for (const sd of [1, -1]) {
        sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.02);
        sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.005, 0.02);
      }
    });
    m.scope("coupler", () => {
      // the Scharfenberg coupler in its recess, its head on the coupling plane REACH ahead of the tip
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
      out("under", -0.25, REACH - 0.12, 0.93, 1.07, 0.09);
      out("under", REACH - 0.12, REACH, 0.84, 1.16, 0.2);
    });
    m.scope("mirrors", () => {
      // the rear-view mirrors' dark housings ahead of the cab side windows
      for (const sd of [1, -1]) blk("lampPod", -0.08, 0.02, 2.62, 2.98, sd > 0 ? 1.44 : -1.54, sd > 0 ? 1.54 : -1.44);
    });
  } else {
    m.scope("roof equipment", () => {
      // the front pantograph, folded (the kit draws the rear one, raised), on its roof plate
      m.scope("pantograph 1", () => {
        const x = X(PAN_IN);
        block(m, "roofG", x - 1.6, x + 1.6, C - 0.06, C + 0.05, -0.85, 0.85);
        singleArm(m, { xc: x, roofY: C + 0.05, baseY: C + 0.3, h: -1, raised: false });
      });
      // the roof line between the two on its insulators, the main switch behind the front one
      m.scope("roof line", () => {
        const [a, e] = [PAN_IN + 1.0, MID_BODY - PAN_IN - 1.0];
        blk("pantograph", a, e, C + 0.22, C + 0.26, 0.2, 0.24);
        for (let k = 0, n = 7; k <= n; k++) insulator(m, X(a + ((e - a) * k) / n), 0.22, C - 0.04, C + 0.22);
      });
      m.scope("main switch", () => blk("fairing", 4.5, 6.2, C - 0.08, C + 0.22, -0.45, 0.1));
    });
  }
  m.scope("underfloor", () => {
    // the equipment cases between the bogies
    const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
    blk("under", t0 + 2.1, t1 - 2.1, 0.42, 0.86, -1.2, 1.2);
  });
}

/** The fairing's span, d behind the tip. */
const FAIRING: readonly [number, number] = [1.5, 18.2];
/** The cab door's span, d behind the tip. */
const CAB_DOOR: readonly [number, number] = [1.35, 1.98];

export const R446: ShinkansenSeries = {
  // 75.993 m over the couplers: motor cars 25.6 m, the trailer 24.8 m; 2.94 m wide
  endLength: 25.6, midLength: MID_LENGTH, W: 1.47, Y: 1.0, S, C, lean: 0.98, B: 0.76, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: R446_FACE,
  // the window band 1.82 - 2.78 m; the doors' two leaves each with a big window
  windows: [[1.82, 2.78]], windowW: 2.0, pitch: 2.2, door: [1.02, 3.02, 1.86, 2.72], doorW: 1.3, doorGlassW: 0.48, doorGlassPair: 0.65,
  layout: { end: MOTOR, middle: TRAILER },
  // the cab side window behind the corner, the cab door's window behind the red
  cabWindows: [[0.62 - JOIN + 0.02, 1.22 - JOIN, 2.31, 3.18], [CAB_DOOR[0] - JOIN + 0.1, CAB_DOOR[1] - JOIN - 0.1, 2.32, 3.0]],
  // Bo'Bo' motor cars (the leading bogie under the first windows), the trailer's 2'2' 3.4 m from its ends
  bogieCentres: 18.2, wheelR: 0.47, wheelbase: 2.5, endBogies: [3.3 - JOIN, 21.5 - JOIN], midBogies: [3.4, MID_BODY - 3.4],
  // both pantographs on the trailer near its ends, the rear one raised (the kit's)
  pantographAt: MID_BODY - PAN_IN,
  lodRoof: { d: FAIRING, hw: 1.15, y: [C - 0.05, C + 0.365], mat: "fairing" },
  // the red cab sides in the distant model
  lodEndPatches: [{ d: [JOIN, 1.3], hw: 1.475, y: [2.13, S], mat: "red" }],
  fittings: r446Fittings,
  cars: [3],
  liveries: { cercanias: CERCANIAS },
  // 166.6 t: 59 t a motor car, 48.6 t the trailer; 1,200 kW a motor car
  weight: { end: 59, middle: 48.6 }, power: 1200, maxspeed: 100,
};

/** The game's figures, the kit's with the trailer unpowered: 2,400 kW for the unit (the kit gives every car the motor car's power). */
export function r446Game(g: GameProperties): GameProperties {
  return {
    ...g,
    variants: g.variants?.map((v) => (v.params.unit === "middleCar" ? { ...v, power: 0 } : v.params.unit === "train" ? { ...v, power: 2 * R446.power } : v)),
  };
}
