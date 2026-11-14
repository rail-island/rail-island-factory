// The Uerdingen railbus VT 98 (DB class 798), drawn on the series kit (shinkansen.ts) as one
// double-ended railcar with its own cab face (seriesCab.ts) at both ends: the upright end with its
// corners rounded 0.42 m in plan, the two big front windows and the corner windows wrapping round the
// corners, the roof dome curving down into the end with the roof lamp on it, the round headlamps in
// chrome rings, the buffers and screw coupling; along the sides the aluminium strip under the window
// band, the black solebar band at the body's foot hiding the wheels' tops, a folding door just behind
// each end's corner window, seven windows with their top-hung upper lights, the radiator louvre at the
// middle, the roof vents along the cant; two single axles 6 m apart on leaf springs and the two
// underfloor engines between them. Matched to the photographs in assets/db-vt98/ (SOURCES.md).
// See docs/models/germany-trains.md.
//
// Heights over the rail; d behind the face's tip (its front plane) on the face, else d behind the
// body's front end (the face's join, JOIN behind the tip).

import { ngon, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { horn } from "./dieselParts.ts";

/** Over the buffers 13.95 m; the buffers reach 0.65 m out, so 12.65 m from face to face. */
const LENGTH = 13.95;
const TIPS = LENGTH - 2 * 0.65;
/** Where the end's roof dome reaches the crown, behind the face (the photographs: the dome's lamp about 0.25 m back). */
const JOIN = 0.55;
/** The crown (3.28 m over the rail), the gutter over the windows, the body's foot. */
const C = 3.28;
const GUTTER = 2.75;
const FOOT = 0.58;

/** The paint edges, measured on the head-on photograph (394 px/m at the face; buffer centres 1.05 m up). */
const BLACK_TOP = 0.77;
const STRIP: readonly [number, number] = [1.8, 1.9];
const WIN: readonly [number, number] = [1.95, 2.72];
const DRIP: readonly [number, number] = [GUTTER, 2.79];

/** The side's window bays: seven windows 1.285 m wide at a 1.375 m pitch, the first 1.557 m behind the tip (the side photographs' projective fit). */
const PITCH = 1.375;
const WINDOW_W = 1.285;
const FIRST_WINDOW = (TIPS - (6 * PITCH + WINDOW_W)) / 2;
/** The folding door behind each end's corner window: 0.56 - 1.435 m behind the tip. */
const DOOR: readonly [number, number] = [0.56, 1.435];

/**
 * The end's centre line: upright from the black buffer beam to the gutter over the windows, then the
 * roof dome rounding back to the crown 0.55 m behind the face.
 */
const PROFILE: Pt[] = [
  [FOOT, 0.01], [BLACK_TOP, 0], [GUTTER, 0], [2.84, 0.02], [2.93, 0.06], [3.02, 0.12], [3.1, 0.19], [3.17, 0.27], [3.22, 0.35], [3.26, 0.44], [C, JOIN],
];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.0, 1.26, 1.38, 1.51, 1.64, ...STRIP, 1.93, ...WIN, 2.74, ...DRIP])].sort((a, b) => a - b);

/** A regular polygon round (lat, y): a lamp ring or a grille. */
const disc = (lat: number, y: number, r: number, n = 12): Pt[] => Array.from({ length: n }, (_, k): Pt => [lat + r * Math.cos((2 * Math.PI * k) / n), y + r * Math.sin((2 * Math.PI * k) / n)]);

/** The big front windows (lat spans, glass) and the corner windows wrapping round the corners (lat 1.09 to the side). */
const BIG: Array<readonly [number, number]> = [[-0.98, -0.05], [0.05, 0.98]];
const CORNER: Array<readonly [number, number]> = [[-1.47, -1.09], [1.09, 1.47]];

export const VT98_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.42, roofFrom: DRIP[1], first: JOIN + DOOR[0] + 1.0, bulge: 0.05, tolerance: 0.02,
  profile: PROFILE,
  // the plan: the face nearly flat across, its corners rounded 0.42 m; the dome's corners widening over the roof
  corner: [[FOOT, 0.42], [GUTTER, 0.42], [3.02, 0.45], [3.17, 0.4], [3.26, 0.2], [C, 0.08]],
  rows: ROWS,
  masks: [
    ...BIG.map(([a, e]) => ({ lat: [a - 0.03, e + 0.03] as const, y: [WIN[0] - 0.02, WIN[1] + 0.02] as const, r: 0.09, mat: "rubber" })),
    ...CORNER.map(([a, e]) => ({ lat: [a - 0.03, e + 0.03] as const, y: [WIN[0] - 0.02, WIN[1] + 0.02] as const, r: 0.06, mat: "rubber" })),
  ],
  panes: [
    ...BIG.map(([a, e]) => ({ lat: [a, e] as const, y: [WIN[0] + 0.01, WIN[1] - 0.01] as const, r: 0.07 })),
    ...CORNER.map(([a, e]) => ({ lat: [a, e] as const, y: [WIN[0] + 0.01, WIN[1] - 0.01] as const, r: 0.04 })),
  ],
  // the corner windows' glass carried round onto the cab side, up to the door's pillar
  paint: [
    { mat: "rubber", front: [[WIN[0] - 0.02, 0.36], [WIN[1] + 0.02, 0.36]], back: [[WIN[0] - 0.02, 0.5], [WIN[1] + 0.02, 0.5]] },
    { mat: "cabGlass", front: [[WIN[0] + 0.01, 0.36], [WIN[1] - 0.01, 0.36]], back: [[WIN[0] + 0.01, 0.48], [WIN[1] - 0.01, 0.48]] },
  ],
  // the horn's round grille left of the middle, and the Uerdingen badge on the strip
  decals: [
    { mat: "grille", pts: disc(-0.17, 1.36, 0.11) },
    { mat: "badge", pts: [[-0.09, 1.85], [0, 1.91], [0.09, 1.85], [0, 1.79]] },
  ],
  // the headlamps in their chrome rings, standing off the face
  pods: [1, -1].map((sd) => ({ lat: sd * 0.87, y: 1.51, w: 0.26, h: 0.26, r: 0.13, proud: 0.03, depth: 0.03, mat: "chrome", lamps: [[0, 0.1, "lampHead"]] as const })),
  roofLamp: [0, 2.96, 0.1],
  wipers: [[[-0.52, 1.99], [-0.86, 2.42]], [[0.52, 1.99], [0.18, 2.42]]],
};

/** The DB paint: one red all over, the aluminium strip under the windows and the drip rail over them, the black solebar band. */
function railbus(title: string, red: string, number: string): ShinkansenLivery {
  return {
    title, number,
    palette: {
      red: c(red, 0.45), roofR: c(red, 0.6), black: c("#16171a", 0.6), alu: { color: "#b9bec2", metallic: 0.6, roughness: 0.35 },
      chrome: { color: "#d4d7da", metallic: 0.8, roughness: 0.2 }, grille: c("#2a1214", 0.7), badge: c("#2b2d30", 0.5),
      horn: c("#3a3c3f", 0.5), vent: c("#1d1e20", 0.7), white: c("#e9e9e4", 0.5),
      // the buffers' stocks and heads black, not bare steel
      steel: c("#46494c", 0.55), underframe: c("#1c1d1f", 0.7),
    },
    bands: [[0, BLACK_TOP, "black"], [BLACK_TOP, STRIP[0], "red"], [STRIP[0], STRIP[1], "alu"], [STRIP[1], DRIP[0], "red"], [DRIP[0], DRIP[1], "alu"], [DRIP[1], 9, "red"]],
    roof: "roofR", skirt: "black",
  };
}

/** The roof vents along the cant over the windows (d behind the tip on the +Z side; the other side turned). */
const VENTS: Array<readonly [number, number]> = [[3.7, 4.3], [6.35, 6.95], [8.35, 8.95]];

/** The roof's vents and horns, the window lights' frames and the underfloor engines. */
function vt98Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("roof vents", () => {
    for (const sd of [1, -1]) for (const [a, e] of VENTS) {
      // the +Z side's from the front, the other side's from the rear: the car is the same seen from either end
      const [d0, d1] = sd > 0 ? [a - JOIN, e - JOIN] : [L - (e - JOIN), L - (a - JOIN)];
      for (let k = 0; k < 4; k++) crownPane(m, b, X, sd, "vent", [d0, d1], [1.3 + k * 0.035, 1.316 + k * 0.035], 0.006);
    }
  });
  m.scope("buffer rims", () => {
    // the white-painted rims round the buffer heads, wider than high (the head-on photograph)
    for (const e of [1, -1]) {
      const plane = e > 0 ? X(-JOIN) + 0.65 : X(L + JOIN) - 0.65;
      const [a, z1] = e > 0 ? [plane - 0.045, plane - 0.006] : [plane + 0.006, plane + 0.045];
      for (const z of [-0.875, 0.875]) {
        const oval: Ring = ngon(20, 1, 0, 0, 0).map(([u, v]): [number, number] => [z + 0.25 * u, 1.05 + 0.2 * v]);
        m.sweep("white", "x", oval, a, oval, z1);
      }
    }
  });
  m.scope("horns", () => {
    // a horn on the crown behind each end's dome, pointing out over the end
    horn(m, 1, X(0.5), 0.25, C + 0.08);
    horn(m, -1, X(L - 0.5), -0.25, C + 0.08);
  });
  m.scope("window lights", () => {
    // each side window's top-hung upper light: a transom across it and a bar between the two lights
    for (const sd of [1, -1]) for (let i = 0; i < 7; i++) {
      const d0 = FIRST_WINDOW + i * PITCH - JOIN, d1 = d0 + WINDOW_W;
      sidePanel(m, b, X, sd, "alu", d0, d1, 2.47, 2.5, 0.016, 0.01);
      sidePanel(m, b, X, sd, "alu", (d0 + d1) / 2 - 0.015, (d0 + d1) / 2 + 0.015, 2.5, WIN[1], 0.016, 0.01);
    }
  });
  m.scope("underfloor", () => {
    const mid = L / 2;
    // the two engines with their gearboxes, one in each half between the axles, offset to either side
    at("under", mid - 2.3, mid - 0.5, 0.32, FOOT + 0.05, -0.85, 0.35);
    at("under", mid + 0.5, mid + 2.3, 0.32, FOOT + 0.05, -0.35, 0.85);
    // the fuel tank and the battery boxes between them
    at("under", mid - 0.45, mid + 0.45, 0.4, FOOT + 0.05, -0.9, 0.9);
    // the air reservoirs along the outer ends, behind the axles
    for (const e of [1, -1]) at("under", e > 0 ? 0.45 : L - 1.55, e > 0 ? 1.55 : L - 0.45, 0.4, FOOT + 0.05, -0.75, 0.75);
  });
}

export const VT98: ShinkansenSeries = {
  // 13.95 m over the buffers, 2.92 m wide over the sides, 3.28 m high (de.wikipedia "Uerdinger Schienenbus"; the head-on photograph)
  endLength: LENGTH, midLength: LENGTH, W: 1.46, Y: 0.7, S: 2.8, C, lean: 0.995, B: FOOT, A: 0.6,
  // the side walls upright to their foot, not tucked in under the floor: they hide the wheels' tops
  tiltSection: { wa: 1, wl: 1 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: VT98_FACE,
  windows: [WIN], windowW: WINDOW_W, pitch: PITCH,
  // the folding doors: two leaves, a narrow window in each
  door: [0.62, GUTTER, WIN[0] + 0.02, WIN[1] - 0.04], doorW: DOOR[1] - DOOR[0], doorGlassW: 0.16, doorGlassPair: 0.44,
  layout: (() => {
    const L = TIPS - 2 * JOIN, [d0, d1] = [DOOR[0] - JOIN, DOOR[1] - JOIN], mid = (d0 + d1) / 2;
    const windows = Array.from({ length: 7 }, (_, i): readonly [number, number] => [FIRST_WINDOW - JOIN + i * PITCH, FIRST_WINDOW - JOIN + i * PITCH + WINDOW_W]);
    const doors: Array<readonly [number, number, number]> = [[d0, mid, -1], [mid, d1, 1], [L - d1, L - mid, -1], [L - mid, L - d0, 1]];
    return { end: { doors, windows }, middle: { doors, windows } };
  })(),
  // the radiator louvre at the middle of each side, under the fourth window
  sidePanels: { end: [{ d: [TIPS / 2 - 0.32, TIPS / 2 + 0.32], y: [1.38, 1.73], kind: "louvres", louvres: 9 }] },
  numberAt: [1.6, 0.98, 0.09],
  // two single axles 6.0 m apart on leaf springs, 900 mm wheels
  bogieCentres: 6.0, wheelR: 0.45, wheelbase: 0, traction: "diesel", single: true, endCoupler: "buffers", bufferBeam: false,
  fittings: vt98Fittings,
  liveries: {
    dbRed: railbus("DB red", "#731619", "798 652"),
    orientRed: railbus("Orient red", "#b23a26", "798 776"),
  },
  weight: { end: 21, middle: 21 }, power: 220, maxspeed: 90,
};
