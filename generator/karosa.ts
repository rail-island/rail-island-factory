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
import { assembleBus, type Axle, type BusSpec, type Fitting } from "./busAssembly.ts";
import { busPalette, endLamp, endSlab, mirror, sideSlab, type BusFrame } from "./busKit.ts";
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
  /** The axles in u, front first. */
  axles: Array<{ u: number; dual: boolean; drive?: boolean }>;
}

const SHORT_FRAME: Frame = {
  nose: 0.1, tail: 11.5, length: 10.97,
  bodies: [[0.1, 11.5]],
  axles: [{ u: 2.45, dual: false }, { u: 8.15, dual: true, drive: true }],
};
const LONG_FRAME: Frame = {
  nose: 0.2, tail: 17.9, length: 17.36,
  bodies: [[0.2, 9.7], [11.6, 17.9]],
  axles: [{ u: 2.55, dual: false }, { u: 8.25, dual: true }, { u: 14.65, dual: true, drive: true }],
};

/** Body half width (m) and the height of the belt, eave and roof crown. */
const HW = 1.25;
const BOTTOM = 0.3;
const BELT = 1.5;
const EAVE = 2.9;
const ROOF = 3.1;
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
  const K = new Karosa(long ? LONG_FRAME : SHORT_FRAME);
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
      ? [{ x0: nose - 0.14, x1: nose + 1, y0: 0.55, y1: 1.32, mat: stripe }]
      : [{ x0: nose - 0.14, x1: nose + 1, y0: 1.2, y1: 1.32, mat: stripe }, { x0: nose - 0.14, x1: nose + 1, y0: BOTTOM, y1: 0.85, mat: "maskGrey" }]),
    ...(variant.greyRoof ? [{ x0: tail - 1, x1: nose + 1, y0: 2.95, y1: ROOF + 1, mat: "roofGrey" }] : []),
  ];
  const axles: Axle[] = K.f.axles.map((a, i) => ({ x: x(a.u), dual: a.dual, steer: i === 0, drive: a.drive ?? false }));
  const arches: Arch[] = axles.map((a) => ({ x: a.x, half: a.steer ? 0.62 : 0.6, side: 0.72, top: 1.14 }));
  const bodies: Array<[number, number]> = K.f.bodies.map(([u0, u1]) => [x(u1), x(u0)]);

  const frame: BusFrame = { section, side };
  const fittings: Fitting[] = [];
  const fit = (group: string, at: number, draw: () => void): void => {
    fittings.push({ group, x: at, draw });
  };

  // --- glazing and doors ------------------------------------------------------------
  // the window band: glass 1.9..2.7 in a dark grey surround 1.75..2.82
  const GLASS: [number, number] = [1.92, 2.68];
  const SURROUND: [number, number] = [1.78, 2.8];
  const window = (s: number, u0: number, u1: number, vent = true): void => {
    const [x0, x1] = [x(u1), x(u0)];
    fit(s > 0 ? "right windows" : "left windows", (x0 + x1) / 2, () => {
      sideSlab(m(), "frame", frame, s, x0, x1, SURROUND[0], SURROUND[1], 0.012);
      sideSlab(m(), "glass", frame, s, x0 + 0.06, x1 - 0.06, GLASS[0], GLASS[1], 0.022);
      // the top-hung vent's lower rail
      if (vent && x1 - x0 > 0.9) sideSlab(m(), "frame", frame, s, x0 + 0.04, x1 - 0.04, 2.42, 2.46, 0.03);
    });
  };
  /** Fills u0..u1 with panes of about 1.8 m between narrow pillars. */
  const windowRun = (s: number, u0: number, u1: number): void => {
    const n = Math.max(1, Math.round((u1 - u0) / 1.8));
    const w = (u1 - u0) / n;
    for (let i = 0; i < n; i++) window(s, u0 + i * w + 0.05, u0 + (i + 1) * w - 0.05);
  };
  const door = (u0: number, u1: number): void => {
    const [x0, x1] = [x(u1), x(u0)];
    const leaves = x1 - x0 > 0.95 ? 2 : 1;
    fit("doors", (x0 + x1) / 2, () => {
      // the opening's dark surround, then each leaf: a light frame round two panes
      sideSlab(m(), "frame", frame, 1, x0, x1, BOTTOM + 0.04, 2.8, 0.01);
      const lw = (x1 - x0 - 0.06) / leaves;
      for (let l = 0; l < leaves; l++) {
        const a = x0 + 0.03 + l * lw;
        const b = a + lw - 0.02;
        block(m(), "doorFrame", a, b, BOTTOM + 0.08, 2.72, HW + 0.012, HW + 0.03);
        block(m(), "glass", a + 0.06, b - 0.06, 1.15, 2.6, HW + 0.025, HW + 0.04);
        block(m(), "glass", a + 0.06, b - 0.06, 0.45, 1.05, HW + 0.025, HW + 0.04);
      }
    });
  };
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
    // left side: the driver's window, then one run
    const start = b0 === K.f.nose ? 1.5 : b0 + 0.3;
    if (b0 === K.f.nose) window(-1, 0.55, 1.4, false);
    windowRun(-1, start, end);
  }
  for (const [d0, d1] of variant.doors) door(d0, d1);

  // --- the nose ---------------------------------------------------------------------
  fit("front", nose, () => {
    const wsTop = series === "951" ? 2.78 : 2.68;
    endSlab(m(), "frame", frame, 1, -1.18, 1.18, 1.36, wsTop + 0.08, 0.01);
    endSlab(m(), "glass", frame, 1, -1.12, 1.12, 1.42, wsTop, 0.02);
    // the destination display behind the windscreen's top
    endSlab(m(), "sign", frame, 1, -0.75, 0.75, wsTop - 0.24, wsTop - 0.04, 0.026);
    endSlab(m(), "signText", frame, 1, -0.6, 0.6, wsTop - 0.17, wsTop - 0.11, 0.03);
    if (series === "700") {
      // a black grille band with paired rectangular headlamps at its ends
      endSlab(m(), "grille", frame, 1, -0.82, 0.82, 0.74, 1.12, 0.012);
      for (const s of [-1, 1]) {
        endSlab(m(), "grille", frame, 1, s > 0 ? 0.86 : -1.18, s > 0 ? 1.18 : -0.86, 0.72, 1.14, 0.012);
        endSlab(m(), "lampHead", frame, 1, s * 1.12 - 0.1, s * 1.12 + 0.1, 0.8, 0.98, 0.02);
        endSlab(m(), "lampAmber", frame, 1, s * 1.1 - 0.07, s * 1.1 + 0.07, 1.02, 1.1, 0.02);
      }
      for (let i = 0; i < 6; i++) endSlab(m(), "frame", frame, 1, -0.78, 0.78, 0.78 + i * 0.06, 0.8 + i * 0.06, 0.018);
    } else {
      // the 900s' grey mask: headlamp clusters each side of a black grille
      endSlab(m(), "grille", frame, 1, -0.45, 0.45, 0.88, 1.12, 0.012);
      for (const s of [-1, 1]) {
        endSlab(m(), "frame", frame, 1, s > 0 ? 0.55 : -1.15, s > 0 ? 1.15 : -0.55, 0.9, 1.12, 0.012);
        endLamp(m(), "lampHead", frame, 1, s * 0.98, 1.01, 0.08, 0.02);
        endLamp(m(), "lampHead", frame, 1, s * 0.75, 1.01, 0.08, 0.02);
        endSlab(m(), "lampAmber", frame, 1, s * 1.08 - 0.06, s * 1.08 + 0.06, 0.6, 0.72, 0.02);
      }
    }
    // the number plate on the bumper, the bumper below
    endSlab(m(), "plate", frame, 1, -0.26, 0.26, 0.5, 0.62, 0.025);
    endSlab(m(), "bumper", frame, 1, -1.22, 1.22, 0.32, 0.5, 0.03, 0.05);
  });

  // --- the tail ---------------------------------------------------------------------
  fit("rear", tail, () => {
    endSlab(m(), "frame", frame, -1, -0.92, 0.92, 1.86, 2.66, 0.01);
    endSlab(m(), "glass", frame, -1, -0.86, 0.86, 1.92, 2.6, 0.02);
    // the engine flap's louvres
    for (let i = 0; i < 5; i++) endSlab(m(), "grille", frame, -1, -0.7, 0.7, 0.95 + i * 0.08, 0.99 + i * 0.08, 0.012);
    for (const s of [-1, 1]) {
      endSlab(m(), "lampRed", frame, -1, s * 1.05 - 0.09, s * 1.05 + 0.09, 1.0, 1.24, 0.015);
      endSlab(m(), "lampAmber", frame, -1, s * 1.05 - 0.09, s * 1.05 + 0.09, 1.26, 1.36, 0.015);
    }
    endSlab(m(), "plate", frame, -1, -0.26, 0.26, 0.62, 0.74, 0.02);
    endSlab(m(), "bumper", frame, -1, -1.2, 1.2, 0.34, 0.52, 0.03, 0.05);
  });

  // --- roof, mirrors, markers -------------------------------------------------------
  for (const [u0, u1, h] of [[1.0, 1.4, 0.1], [3.4, 3.9, 0.1], [6.2, 6.8, 0.1], [8.7, 9.3, 0.1], [10.3, 10.9, 0.1], [12.4, 13.0, 0.1], [15.1, 15.7, 0.1]] as const) {
    if (u1 > K.f.tail - 0.4) continue;
    if (bodyRanges.every(([b0, b1]) => u0 < b0 + 0.2 || u1 > b1 - 0.2)) continue;
    fit("roof hatches", x((u0 + u1) / 2), () => block(m(), "roofHatch", x(u1), x(u0), ROOF - 0.04, ROOF + h, -0.45, 0.45));
  }
  fit("mirrors", nose, () => {
    for (const s of [-1, 1]) mirror(m(), frame, s, nose - 0.35, 2.55, HW + 0.09, { h: 0.42, w: 0.2, drop: 0.08 });
  });

  const spec: BusSpec = {
    palette: busPalette({
      body: "#f4f4f1",
      stripe: liv.stripe,
      rub: liv.rub,
      doorFrame: "#c8cbcc",
      bumper: "#2e3034",
      maskGrey: "#7d8186",
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
    fittings,
  };
  // the mesh builder exists only once assembleBus runs; fittings draw into it then
  let builder: MeshBuilder | null = null;
  const m = (): MeshBuilder => builder!;
  return assembleBus(spec, (b) => (builder = b));
}

export function karosaShort(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(KAROSA_SHORT_PARAMS, params);
  return karosaBus(KAROSA_SHORT.find((v) => v.value === variant)!, false);
}

export function karosaLong(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(KAROSA_LONG_PARAMS, params);
  return karosaBus(KAROSA_LONG.find((v) => v.value === variant)!, true);
}

