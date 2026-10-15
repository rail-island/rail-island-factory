// The Karosa city, suburban and intercity buses of the 700 and 900 series from
// vlakosimdb, as two parametric designs: the short rigid buses (B 731, B 732,
// C 734, LC 735, B 931, B 931 E, B 951 E) and the long articulated ones (B 741,
// B 941, B 941 E, B 961). One body each, from the XML's clip outlines; the
// variants differ in front mask, doors and livery, as the native BMPs do.
// See docs/models/buses.md.
//
// The layout is measured in the source's own frame and units -- u, metres from
// the nose, as the vlakosimdb texture columns run (10 pixels a metre) -- and
// carried into the factory's frame (+X forward, nose at the largest x) by
// `Karosa.x`, which also stretches it to the real bus's length.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { Arch, Paint } from "./busBody.ts";
import { BusDraft, type Axle, type DoorStyle, type PaneStyle } from "./busAssembly.ts";
import { busPalette, endLamp, endSlab, mirror, sideSlab } from "./busKit.ts";
import { block } from "./vehicleParts.ts";

type Series = "700" | "900" | "951";
type Livery = "red" | "blue" | "orange";

/** One Karosa: its parameter value, the vlakosimdb folder it is transferred from, and how it differs. */
export interface KarosaVariant {
  value: string;
  title: string;
  /** The vlakosimdb folder, under db/motocar. */
  source: string;
  series: Series;
  livery: Livery;
  /** The doors on the right (kerb) side, [from, to] in u. */
  doors: Array<[number, number]>;
  /** The grey roof of the B 941 E. */
  greyRoof?: boolean;
}

export const KAROSA_SHORT: readonly KarosaVariant[] = [
  { value: "b731", title: "B 731 (city, three doors)", source: "bus_kar_b731", series: "700", livery: "red", doors: [[0.5, 1.5], [5.2, 6.6], [9.3, 10.7]] },
  { value: "b732", title: "B 732 (city, three doors)", source: "bus_kar_b732", series: "700", livery: "red", doors: [[0.5, 1.5], [5.2, 6.7], [9.4, 10.7]] },
  { value: "c734", title: "C 734 (suburban, two doors)", source: "bus_kar_c734#1", series: "700", livery: "blue", doors: [[0.5, 1.5], [6.2, 7.3]] },
  { value: "lc735", title: "LC 735 (intercity coach, two doors)", source: "bus_kar_lc735#1", series: "700", livery: "orange", doors: [[0.5, 1.5], [9.2, 10.0]] },
  { value: "b931", title: "B 931 (city, three doors)", source: "bus_kar_b931", series: "900", livery: "red", doors: [[0.6, 1.6], [5.3, 6.7], [9.4, 10.8]] },
  { value: "b931e", title: "B 931 E (city, three doors)", source: "bus_kar_b931e", series: "900", livery: "red", doors: [[0.6, 1.6], [5.3, 6.7], [9.4, 10.8]] },
  { value: "b951e", title: "B 951 E (city, three doors)", source: "bus_kar_b951e", series: "951", livery: "red", doors: [[0.6, 1.6], [5.3, 6.7], [9.4, 10.8]] },
];

export const KAROSA_LONG: readonly KarosaVariant[] = [
  { value: "b741", title: "B 741 (articulated, four doors)", source: "bus_kar_b741", series: "700", livery: "red", doors: [[0.5, 1.5], [5.3, 6.7], [12.0, 13.4], [15.4, 16.6]] },
  { value: "b941", title: "B 941 (articulated, four doors)", source: "bus_kar_b941", series: "900", livery: "red", doors: [[0.5, 1.6], [5.2, 6.7], [11.9, 13.4], [15.3, 16.6]] },
  { value: "b941e", title: "B 941 E (articulated, four doors)", source: "bus_kar_b941e", series: "900", livery: "red", doors: [[0.5, 1.6], [5.2, 6.7], [11.9, 13.4], [15.3, 16.6]], greyRoof: true },
  { value: "b961", title: "B 961 (articulated, four doors)", source: "bus_kar_b961", series: "951", livery: "red", doors: [[0.5, 1.6], [5.2, 6.7], [11.9, 13.4], [15.3, 16.6]] },
];

const variantParam = (variants: readonly KarosaVariant[], def: string): ParamSpec => ({
  name: "variant",
  title: "Variant",
  default: def,
  values: variants.map((v) => ({ value: v.value, title: v.title })),
});

export const KAROSA_SHORT_PARAMS: readonly ParamSpec[] = [variantParam(KAROSA_SHORT, "b731")];
export const KAROSA_LONG_PARAMS: readonly ParamSpec[] = [variantParam(KAROSA_LONG, "b741")];

/** The livery colours, the native BMPs' toned down to paint. */
const LIVERY: Record<Livery, { stripe: string; rub: string }> = {
  red: { stripe: "#d3252b", rub: "#8e2a2e" },
  blue: { stripe: "#1d4fae", rub: "#14246b" },
  orange: { stripe: "#ef7f1a", rub: "#a9aaa8" },
};

/**
 * The body's measurements in u (the source's metres from the nose). Short: one
 * body from 0.1 to 11.5; long: two from 0.2 to 9.7 and 11.6 to 17.9.
 */
interface Frame {
  /** Source u of the nose and the tail. */
  nose: number;
  tail: number;
  /** Real length over the body (m), which `x` stretches the source to. */
  length: number;
  /** The rigid bodies in u, front first. */
  bodies: Array<[number, number]>;
  /** The axles, front first, at their real distance from the nose (m). */
  axles: Array<{ at: number; dual: boolean; drive?: boolean }>;
}

// Real lengths, overhangs and wheelbases (cs.wikipedia, assets/karosa-*/SOURCES.md):
// the 700s 2.29 + 5.60 + 3.085 m, the 900s 2.355 + 5.60 m and a longer tail; the
// articulated ones 6.27 m more from the middle to the driven rear axle (pushers).
const AXLES_SHORT = (front: number): Frame["axles"] => [{ at: front, dual: false }, { at: front + 5.6, dual: true, drive: true }];
const AXLES_LONG = (front: number): Frame["axles"] => [{ at: front, dual: false }, { at: front + 5.6, dual: true }, { at: front + 11.87, dual: true, drive: true }];

const FRAMES: Record<string, Frame> = {
  short700: { nose: 0.1, tail: 11.5, length: 10.975, bodies: [[0.1, 11.5]], axles: AXLES_SHORT(2.29) },
  short900: { nose: 0.1, tail: 11.7, length: 11.345, bodies: [[0.1, 11.7]], axles: AXLES_SHORT(2.355) },
  short951: { nose: 0.1, tail: 11.7, length: 11.32, bodies: [[0.1, 11.7]], axles: AXLES_SHORT(2.355) },
  long700: { nose: 0.2, tail: 17.9, length: 17.355, bodies: [[0.2, 9.7], [11.6, 17.9]], axles: AXLES_LONG(2.29) },
  long900: { nose: 0.0, tail: 18.0, length: 17.615, bodies: [[0.0, 9.6], [11.5, 18.0]], axles: AXLES_LONG(2.355) },
  long951: { nose: 0.0, tail: 17.9, length: 17.59, bodies: [[0.0, 9.6], [11.5, 17.9]], axles: AXLES_LONG(2.355) },
};

/** Body half width (m) and the height of the belt, eave and roof crown. */
const HW = 1.25;
const BOTTOM = 0.3;
const BELT = 1.5;
const EAVE = 2.9;
const ROOF = 3.1; // the XML's crown; the hatches bring it to the quoted 3.165 m
const WHEEL_R = 0.52;

/** The source-to-factory mapping of one family. */
class Karosa {
  readonly k: number;
  constructor(readonly f: Frame) {
    this.k = f.length / (f.tail - f.nose);
  }
  /** Factory x of source u: the tail at x = 0, the nose at x = length. */
  x(u: number): number {
    return (this.f.tail - u) * this.k;
  }
}

export function karosaBus(variant: KarosaVariant, long: boolean): MeshBuilder {
  const K = new Karosa(FRAMES[`${long ? "long" : "short"}${variant.series}`]!);
  const x = (u: number): number => K.x(u);
  const nose = x(K.f.nose);
  const tail = x(K.f.tail);
  const liv = LIVERY[variant.livery];
  const series = variant.series;

  const section: Array<[number, number]> = [
    [-HW, BOTTOM], [HW, BOTTOM], [HW, BELT], [HW - 0.05, EAVE], [HW - 0.15, 3.0], [0, ROOF], [-(HW - 0.15), 3.0], [-(HW - 0.05), EAVE], [-HW, BELT],
  ];
  // side elevation: an upright lower nose, the windscreen raked back to the roof; the
  // tail upright to the rear window, then raked in
  const side: Array<[number, number]> = [
    [x(0.3 + K.f.nose - 0.1), BOTTOM], [nose, 0.5], [nose, 1.4], [x(K.f.nose + 0.2), EAVE], [x(K.f.nose + 0.6), ROOF],
    [x(K.f.tail - 0.4), ROOF], [x(K.f.tail - 0.2), EAVE], [tail, 1.8], [tail, 0.5], [x(K.f.tail - 0.6), BOTTOM],
  ];
  // plan: the front corners rounded off (more on the 900s), small rear chamfers
  const fc = series === "700" ? [0.4, 0.06] : [0.5, 0.12];
  const plan: Array<[number, number]> = [
    [tail, -(HW - 0.08)], [tail + 0.12, -HW], [nose - fc[0]!, -HW], [nose - fc[0]! * 0.35, -(HW - fc[1]! * 0.45)], [nose, -(HW - fc[1]! * 1.6)],
    [nose, HW - fc[1]! * 1.6], [nose - fc[0]! * 0.35, HW - fc[1]! * 0.45], [nose - fc[0]!, HW], [tail + 0.12, HW], [tail, HW - 0.08],
  ];

  const stripe = "stripe";
  const paint: Paint[] = [
    { x0: tail - 1, x1: nose + 1, y0: 1.4, y1: 1.7, mat: stripe },
    { x0: tail - 1, x1: nose + 1, y0: 0.8, y1: 0.9, mat: "rub" },
    { x0: tail - 1, x1: nose + 1, y0: BOTTOM, y1: 0.8, mat: stripe },
    // the nose's lower panel, wrapping round the corners
    ...(series === "700"
      ? [{ x0: nose - 0.14, x1: nose + 1, y0: 1.15, y1: 1.55, mat: stripe }, { x0: nose - 0.14, x1: nose + 1, y0: 0.62, y1: 1.15, mat: "maskBlack" }]
      : []),
    { x0: tail - 1, x1: tail + 0.1, y0: 1.4, y1: 1.95, mat: stripe },
    ...(variant.greyRoof ? [{ x0: tail - 1, x1: nose + 1, y0: 2.95, y1: ROOF + 1, mat: "roofGrey" }] : []),
  ];
  const axles: Axle[] = K.f.axles.map((a, i) => ({ x: nose - a.at, dual: a.dual, steer: i === 0, drive: a.drive ?? false }));
  const arches: Arch[] = axles.map((a) => ({ x: a.x, half: a.steer ? 0.62 : 0.6, side: 0.72, top: 1.14 }));
  const bodies: Array<[number, number]> = K.f.bodies.map(([u0, u1]) => [x(u1), x(u0)]);

  const draft = new BusDraft({ section, side });
  const frame = draft.frame;
  const m = (): MeshBuilder => draft.m;
  const fit = (group: string, at: number, draw: () => void): void => draft.fit(group, at, draw);

  // --- glazing and doors ------------------------------------------------------------
  // (native BMPs: glass 1.9..2.7 m in a dark surround 1.8..2.8 m, the upper part a
  // top-hung vent; photographs: two-leaf folding doors, glazed in two panes)
  const PANE: PaneStyle = { glass: [1.92, 2.68], surround: [1.78, 2.8], vent: 2.42 };
  const DOOR: DoorStyle = { bottom: BOTTOM + 0.08, top: 2.72, leafMat: "doorFrame", panes: [[1.15, 2.6], [0.45, 1.05]], surround: "frame", leafWidth: 0.7 };
  /** Fills u0..u1 on side `s` with panes. */
  const windowRun = (s: number, u0: number, u1: number): void => draft.run(s, x(u1), x(u0), PANE);
  const bodyRanges = K.f.bodies;
  for (const [b0, b1] of bodyRanges) {
    // right side: the windows between the doors
    const doors = variant.doors.filter(([d0]) => d0 >= b0 && d0 <= b1).sort((a, b) => a[0] - b[0]);
    let at = b0 === K.f.nose ? doors[0]?.[1] ?? b0 + 0.5 : b0 + 0.3;
    for (const [d0, d1] of doors) {
      if (d0 - at > 0.6) windowRun(1, at + 0.1, d0 - 0.1);
      at = Math.max(at, d1);
    }
    const end = b1 === K.f.tail ? b1 - 0.6 : b1 - 0.3;
    if (end - at > 0.6) windowRun(1, at + 0.1, end);
    // left side: the driver's sliding window, then one run
    const start = b0 === K.f.nose ? 1.5 : b0 + 0.3;
    if (b0 === K.f.nose) draft.pane(-1, x(1.4), x(0.55), { ...PANE, vent: undefined });
    windowRun(-1, start, end);
  }
  for (const [d0, d1] of variant.doors) draft.door(x(d1), x(d0), DOOR);

  // --- the nose ---------------------------------------------------------------------
  // (photographs: a near-upright windscreen down to 1.65 m over a white strip, a
  // livery-coloured panel with louvres, a black band holding round headlamps and
  // the grille, the bumper in the livery colour)
  fit("front", nose, () => {
    const wsTop = series === "951" ? 2.9 : 2.88;
    const wsBottom = series === "700" ? 1.66 : 1.7;
    endSlab(m(), "frame", frame, 1, -1.21, 1.21, wsBottom - 0.04, wsTop + 0.02, 0.01);
    endSlab(m(), "glass", frame, 1, -1.15, 1.15, wsBottom, wsTop - 0.03, 0.02);
    // the destination display behind the windscreen's top, and the wipers at rest
    endSlab(m(), "sign", frame, 1, -0.72, 0.72, wsTop - 0.3, wsTop - 0.06, 0.026);
    endSlab(m(), "signText", frame, 1, -0.6, 0.6, wsTop - 0.22, wsTop - 0.14, 0.03);
    for (const z of [-0.98, 0.08]) endSlab(m(), "frame", frame, 1, z, z + 0.86, wsBottom + 0.05, wsBottom + 0.08, 0.03);
    if (series === "700") {
      // louvres right of the centre in the coloured panel, indicators at its ends
      endSlab(m(), "grille", frame, 1, -0.42, 0.98, 1.21, 1.47, 0.008);
      for (let i = 0; i < 16; i++) {
        const z = -0.38 + i * 0.086;
        endSlab(m(), "stripe", frame, 1, z, z + 0.035, 1.21, 1.47, 0.016);
      }
      for (const s of [-1, 1]) endSlab(m(), "lampAmber", frame, 1, s * 1.12 - 0.06, s * 1.12 + 0.06, 1.2, 1.44, 0.014);
      // the black band: the grille's mesh between two round headlamps in square housings
      endSlab(m(), "grille", frame, 1, -0.78, 0.78, 0.7, 1.08, 0.008);
      for (let i = 0; i < 5; i++) endSlab(m(), "frame", frame, 1, -0.76, 0.76, 0.74 + i * 0.07, 0.76 + i * 0.07, 0.014);
      for (const s of [-1, 1]) {
        endSlab(m(), "frame", frame, 1, s * 0.95 - 0.17, s * 0.95 + 0.17, 0.72, 1.06, 0.008);
        endLamp(m(), "lampHead", frame, 1, s * 0.95, 0.89, 0.105, 0.016, "chrome", 12);
      }
    } else {
      // the 900s (photographs of B 941 E, B 961 E): a white panel under the
      // windscreen -- a slatted grille on its right (the 931s and 941s) or two slots
      // (the 951 and 961) -- over a deep bumper in the livery colour that carries
      // round headlamps, the indicators outside them and a black slot between
      if (series === "900") {
        endSlab(m(), "grille", frame, 1, 0.3, 1.0, 1.08, 1.34, 0.008);
        for (let i = 0; i < 4; i++) endSlab(m(), "body", frame, 1, 0.32, 0.98, 1.1 + i * 0.065, 1.13 + i * 0.065, 0.016);
      } else {
        for (const [z0, z1] of [[-0.95, -0.3], [0.2, 0.85]] as const) endSlab(m(), "grille", frame, 1, z0, z1, 1.14, 1.22, 0.008);
      }
      const front = nose + 0.08;
      block(m(), "stripe", nose - 0.05, front, 0.33, 0.98, -1.24, 1.24);
      for (const s of [-1, 1]) {
        block(m(), "frame", front - 0.01, front + 0.008, 0.71, 0.89, s * 0.93 - 0.11, s * 0.93 + 0.11);
        block(m(), "lampHead", front, front + 0.015, 0.74, 0.86, s * 0.93 - 0.08, s * 0.93 + 0.08);
        block(m(), "lampAmber", front - 0.01, front + 0.012, 0.72, 0.86, s * 1.14 - 0.07, s * 1.14 + 0.07);
      }
      block(m(), "grille", front - 0.01, front + 0.008, 0.74, 0.87, -0.6, 0.6);
      block(m(), "plateYellow", front, front + 0.015, 0.47, 0.6, -0.26, 0.26);
    }
    if (series === "700") {
      // the bumper: a deep bar with rubber blocks; the plate on it, right of the centre
      block(m(), "stripe", nose - 0.04, nose + 0.08, 0.33, 0.62, -1.24, 1.24);
      for (const z of [-0.78, 0.86]) block(m(), "rubber", nose + 0.07, nose + 0.1, 0.36, 0.6, z - 0.05, z + 0.05);
      block(m(), "plateYellow", nose + 0.07, nose + 0.095, 0.41, 0.53, 0.02, 0.54);
    }
  });

  // --- the tail ---------------------------------------------------------------------
  // (photographs: a big rear window over the livery's belt, a vent on the left, the
  // engine flap with the plate, tail light columns at the corners)
  fit("rear", tail, () => {
    if (series === "700") {
      endSlab(m(), "frame", frame, -1, -1.1, 1.1, 1.93, 2.88, 0.01);
      endSlab(m(), "glass", frame, -1, -1.04, 1.04, 1.99, 2.82, 0.02);
      // the engine compartment's vent, high on the left
      endSlab(m(), "grille", frame, -1, -1.0, -0.72, 1.48, 1.86, 0.008);
      for (let i = 0; i < 5; i++) endSlab(m(), "frame", frame, -1, -0.99 + i * 0.056, -0.97 + i * 0.056, 1.5, 1.84, 0.014);
    } else {
      // (photograph of a B 941: a smaller window high up, louvres in the belt)
      endSlab(m(), "frame", frame, -1, -0.92, 0.92, 2.08, 2.84, 0.01);
      endSlab(m(), "glass", frame, -1, -0.87, 0.87, 2.13, 2.79, 0.02);
      for (let i = 0; i < 4; i++) endSlab(m(), "grille", frame, -1, -1.08, -0.1, 1.5 + i * 0.09, 1.54 + i * 0.09, 0.008);
    }
    // the engine flap: a seam round it, a handle above the plate
    endSlab(m(), "frame", frame, -1, -0.86, 0.86, 0.58, 1.36, 0.006);
    endSlab(m(), "body", frame, -1, -0.84, 0.84, 0.6, 1.34, 0.01);
    endSlab(m(), "chrome", frame, -1, -0.16, 0.16, 1.02, 1.06, 0.02);
    endSlab(m(), "plateYellow", frame, -1, -0.17, 0.17, 0.78, 0.98, 0.016);
    for (const s of [-1, 1]) {
      const z = s * 1.04;
      endSlab(m(), "lampAmber", frame, -1, z - 0.08, z + 0.08, 1.06, 1.16, 0.014);
      endSlab(m(), "lampRed", frame, -1, z - 0.08, z + 0.08, 0.88, 1.05, 0.014);
      endSlab(m(), "lampHead", frame, -1, z - 0.08, z + 0.08, 0.77, 0.87, 0.014);
    }
    block(m(), "stripe", tail - 0.07, tail + 0.03, 0.33, 0.56, -1.24, 1.24);
    for (const s of [-1, 1]) block(m(), "lampRed", tail - 0.085, tail - 0.065, 0.4, 0.48, s * 1.0 - 0.04, s * 1.0 + 0.04);
  });
  // the engine's side grille, low on the right behind the last door
  fit("engine grille", tail + 0.8, () => {
    for (let i = 0; i < 5; i++) sideSlab(m(), "grille", frame, 1, tail + 0.25, tail + 1.35, 0.4 + i * 0.09, 0.45 + i * 0.09, 0.012);
  });

  // --- roof, mirrors, markers -------------------------------------------------------
  // (the XML's roof boxes; the 951 and 961 carry an air-conditioning pod at the front instead of the first)
  if (series === "951") fit("roof", x(1.0), () => block(m(), "roofHatch", x(1.45), x(0.6), ROOF - 0.04, 3.32, -0.5, 0.5));
  for (const [u0, u1, h] of [[1.0, 1.4, 0.065], [3.4, 3.9, 0.065], [6.2, 6.8, 0.065], [8.7, 9.3, 0.065], [10.3, 10.9, 0.065], [12.4, 13.0, 0.065], [15.1, 15.7, 0.065]] as const) {
    if (series === "951" && u0 < 1.5) continue;
    if (u1 > K.f.tail - 0.4) continue;
    if (bodyRanges.every(([b0, b1]) => u0 < b0 + 0.2 || u1 > b1 - 0.2)) continue;
    fit("roof hatches", x((u0 + u1) / 2), () => block(m(), "roofHatch", x(u1), x(u0), ROOF - 0.04, ROOF + h, -0.4, 0.4));
  }
  fit("mirrors", nose, () => {
    for (const s of [-1, 1]) mirror(m(), frame, s, nose, s > 0 ? 2.8 : 2.55, { h: 0.42, w: 0.2, drop: 0.06 });
  });

  return draft.build({
    palette: busPalette({
      body: "#f4f4f1",
      stripe: liv.stripe,
      rub: liv.rub,
      doorFrame: "#c8cbcc",
      bumper: "#2e3034",
      maskGrey: "#7d8186",
      maskBlack: "#1d1e21",
      roofHatch: "#d9dbdb",
      roofGrey: "#a7aaad",
    }),
    section, side, plan, base: "body", paint, arches, bodies,
    axles, wheelRadius: WHEEL_R,
    tyres: { single: [0.94, 1.2], inner: [0.62, 0.9], outer: [0.93, 1.21] },
    bellows: { profile: [[-1.18, 0.42], [1.18, 0.42], [1.18, 2.7], [1.05, 2.92], [0, 2.98], [-1.05, 2.92], [-1.18, 2.7]], folds: 9, depth: 0.05 },
    hingeY: 0.6,
    maxSteerDeg: 50,
    maxBendDeg: 50,
  });
}

export function karosaShort(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(KAROSA_SHORT_PARAMS, params);
  return karosaBus(KAROSA_SHORT.find((v) => v.value === variant)!, false);
}

export function karosaLong(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(KAROSA_LONG_PARAMS, params);
  return karosaBus(KAROSA_LONG.find((v) => v.value === variant)!, true);
}

