// London Underground's 1938 tube stock on the series kit (shinkansen.ts): the
// low tube profile with its domed roof, the flat cab front with its centre door,
// two windscreens, destination blind, set number, marker lights and handrails,
// the roof dome's fan vent, the cab side door, and the equipment under the floor
// that made the type (the first tube stock with no equipment room behind the
// cab). Measured on the photographs in assets/lu-1938-stock/. See
// docs/models/uk-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { decalX } from "./usHoodKit.ts";
import { block } from "./vehicleParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import type { SeriesLayout } from "./shinkansen.ts";

/** The door sill and head, and the leaves' and windows' glass. */
export const TUBE_DOOR = [0.72, 2.25, 1.3, 2.13] as const;
export const TUBE_WINDOW = [1.3, 2.2] as const;
/** The cab side door's span (d from the front). */
const CAB_DOOR = [0.3, 0.95] as const;
/** The set number in the box on the cab door, and the plate beside it. */
export const TUBE_SET = "747";
const CAR_LETTER = "D";

/** Window spans of n panes w wide, centred on c with gap g between them. */
const bay = (c: number, n: number, w: number, g: number): Array<[number, number]> => {
  const total = n * w + (n - 1) * g;
  return Array.from({ length: n }, (_, i): [number, number] => [c - total / 2 + i * (w + g), c - total / 2 + i * (w + g) + w]);
};

/** A pair of leaves over a..b, parting in the middle. */
const pair = (a: number, b: number): Array<[number, number, number]> => [[a, (a + b) / 2, -1], [(a + b) / 2, b, 1]];

/**
 * The driving motor car (15.68 m body) and the trailer (15.0 m): the cab door and
 * a window, double doors either side of a bay of four windows, and a single door
 * near the rear end; the trailer a single door at each end.
 */
export const TUBE_LAYOUT: { end: SeriesLayout; middle: SeriesLayout } = {
  end: {
    doors: [...pair(2.15, 3.55), ...pair(8.25, 9.65), [13.25, 13.95, -1]],
    windows: [[CAB_DOOR[0] + 0.12, CAB_DOOR[1] - 0.12], [1.15, 1.95], ...bay(5.9, 4, 1.0, 0.12), ...bay(11.45, 3, 0.95, 0.1), [14.15, 15.0]],
  },
  middle: {
    doors: [[0.35, 1.05, 1], ...pair(3.45, 4.85), ...pair(10.15, 11.55), [13.95, 14.65, -1]],
    windows: [...bay(2.25, 2, 0.95, 0.1), ...bay(7.5, 4, 1.0, 0.12), ...bay(12.75, 2, 0.95, 0.1)],
  },
};

/** The cab front's windscreens (z0, z1, y0, y1) and its lamps (z, y, r, lens): the lamps, the blind and the car letter on the +Z half, the left seen from ahead. */
export const TUBE_CAB = {
  panes: [[-1.04, -0.4, 1.5, 2.15], [-0.25, 0.25, 1.45, 2.15], [0.4, 1.04, 1.5, 2.15]] as Array<readonly [number, number, number, number]>,
  lamps: [[0.9, 1.04, 0.05, "lampHead"], [0.55, 1.04, 0.05, "lampHead"], [0.725, 0.93, 0.045, "lampHead"], [0.725, 0.81, 0.045, "lampRed"], [0.9, 0.7, 0.05, "lampRed"]] as Array<readonly [number, number, number, string]>,
};

/** Text on the cab front's plane x, centred on z = zc, foot at y, h tall, reading left to right seen from ahead. */
function frontText(m: MeshBuilder, mat: string, x: number, text: string, zc: number, y: number, h: number): void {
  const w = h * 0.6, gap = h * 0.22;
  const width = strokeWidth(text, w, gap);
  // seen from ahead (+X) the viewer's right is -Z
  const pts = strokeText(text, -width / 2, y, h, w, gap, false, h * 0.14).map(([u, v]): Vec3 => [x, v, zc - u]);
  m.facets(mat, pts, [1, 0, 0]);
}

/** The cab end's fittings on the front face at model x = f (the car faces +X there). */
function cabFront(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const f = X(0);
  m.scope("cab door", () => {
    // the door's outline and its handle
    for (const z of [-0.3, 0.3]) decalX(m, "rubber", f + 0.004, 1, z - 0.012, z + 0.012, 0.74, 2.26);
    decalX(m, "rubber", f + 0.004, 1, -0.3, 0.3, 2.25, 2.275);
    m.rod("black", [f + 0.03, 1.3, 0.16], [f + 0.03, 1.38, 0.22], 0.012, 6);
  });
  m.scope("set number", () => {
    decalX(m, "black", f + 0.005, 1, -0.2, 0.2, 1.24, 1.4);
    frontText(m, "blind", f + 0.007, TUBE_SET, 0, 1.27, 0.1);
  });
  m.scope("destination", () => {
    decalX(m, "black", f + 0.005, 1, 0.42, 1.0, 1.15, 1.43);
    frontText(m, "blind", f + 0.007, "WATFORD", 0.71, 1.32, 0.07);
    decalX(m, "lineMagenta", f + 0.007, 1, 0.45, 0.97, 1.18, 1.26);
  });
  m.scope("car letter", () => {
    decalX(m, "lineBlue", f + 0.005, 1, 0.29, 0.38, 2.0, 2.13);
    frontText(m, "blind", f + 0.007, CAR_LETTER, 0.335, 2.025, 0.08);
  });
  m.scope("handrails", () => {
    // upright grab handles beside the door and at the front's outer edges, on stand-offs
    for (const [z, y0, y1] of [[-0.36, 1.45, 2.0], [0.36, 1.45, 2.0], [-1.1, 1.1, 1.85], [1.1, 1.1, 1.85]] as const) {
      m.rod("black", [f + 0.045, y0, z], [f + 0.045, y1, z], 0.013, 6);
      for (const y of [y0, y1]) m.rod("black", [f - 0.005, y, z], [f + 0.045, y, z], 0.01, 6, false);
    }
  });
  m.scope("anticlimber", () => {
    // the headstock under the front and the step on it
    block(m, "under", f - 0.35, f + 0.03, 0.44, 0.62, -0.95, 0.95);
    block(m, "step", f + 0.03, f + 0.06, 0.62, 0.66, -0.32, 0.32);
  });
  m.scope("roof vent", () => {
    // the fan of louvres on the roof's front dome
    for (const sd of [1, -1])
      for (let i = 0; i < 5; i++) crownPane(m, b, X, sd, "vent", [0.08 + 0.015 * i, 0.5 - 0.06 * i], [0.03 + 0.055 * i, 0.06 + 0.055 * i], 0.008);
  });
}

/** The frame strips' width around a window, and the rain strip under the shoulder. */
const FRAME = 0.035;
const GUTTER = [2.265, 2.295] as const;
/** The roof's transverse panel seams: their pitch and width. */
const SEAM_PITCH = 1.3, SEAM_W = 0.03;

/**
 * What breaks up the plain red: a polished frame around every side window, the
 * rain strip along the side under the roof's edge, and the roof's transverse panel
 * seams (the photographs in assets/lu-1938-stock/).
 */
function bodyDetail(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number }): void {
  const [y0, y1] = TUBE_WINDOW;
  const windows = (car.end ? TUBE_LAYOUT.end : TUBE_LAYOUT.middle).windows;
  const front = car.end ? 0.25 : 0.2, back = car.length - 0.2;
  for (const s of [1, -1]) {
    m.scope("window frames", () => {
      for (const [d0, d1] of windows)
        for (const [a, e, v0, v1] of [[d0 - FRAME, d1 + FRAME, y1, y1 + FRAME], [d0 - FRAME, d1 + FRAME, y0 - FRAME, y0], [d0 - FRAME, d0, y0, y1], [d1, d1 + FRAME, y0, y1]] as const)
          sidePanel(m, b, X, s, "winFrame", a, e, v0, v1, 0.005, 0.012);
    });
    m.scope("rain strip", () => sidePanel(m, b, X, s, "gutter", front, back, GUTTER[0], GUTTER[1], 0.012, 0.02));
    m.scope("roof seams", () => {
      const n = Math.floor((back - front) / SEAM_PITCH);
      const start = (front + back - (n - 1) * SEAM_PITCH) / 2;
      for (let i = 0; i < n; i++) {
        const d = start + i * SEAM_PITCH;
        crownPane(m, b, X, s, "seam", [d - SEAM_W / 2, d + SEAM_W / 2], [0, b.w(d) * 0.97], 0.003);
      }
    });
  }
}

/** The fittings of a car: the cab front and cab side doors on the driving car, the underfloor equipment on both. */
export function tubeFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) {
    m.scope("cab front", () => cabFront(m, b, X));
    m.scope("cab side doors", () => {
      for (const s of [1, -1]) {
        const [a, e] = CAB_DOOR;
        for (const [d0, d1, y0, y1] of [[a, a + 0.025, 0.74, 2.26], [e - 0.025, e, 0.74, 2.26], [a, e, 2.235, 2.26]] as const)
          sidePanel(m, b, X, s, "rubber", d0, d1, y0, y1, 0.004, 0.01);
      }
    });
  }
  m.scope("body detail", () => bodyDetail(m, b, X, car));
  m.scope("underfloor", () => {
    // control and resistance boxes between the bogies: the 1938 Stock's equipment is all under the floor
    const c = car.length / 2;
    const boxes: Array<readonly [number, number, number, number]> = car.end
      ? [[-3.1, -1.75, 0.28, 0.95], [-1.55, 0.25, 0.22, 1.0], [0.45, 1.6, 0.3, 0.85], [1.8, 3.1, 0.26, 0.95]]
      : [[-2.6, -1.0, 0.3, 0.9], [-0.7, 0.7, 0.26, 0.95], [1.0, 2.6, 0.3, 0.85]];
    boxes.forEach(([d0, d1, y0, z], i) => m.scope(`box ${i + 1}`, () => block(m, i % 2 ? "under" : "underBox", X(c + d1), X(c + d0), y0, 0.62, -z, z)));
  });
}
