// The CD 810 two-axle railcar (CSD M 152.0, the "orchestrion") and its one
// rebuilt sister, the CD 812 "Esmeralda" with the 912 driving trailer: one
// design `veh-cd-810` whose `variant` picks the body - the 810, the 812 motor
// car or the 912 driving trailer - and whose `livery` picks one of the four 810
// paints vlakosimdb holds (the 812 and 912 have one paint and ignore it).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-810/native
// (db/train/dmu/cd_810#1..#4, dmu/812/cd_812.613 and cd_912.001): the XML
// sections, plans and elevations, windows, doors and paint laid from native
// pixel boxes (0.1 m a pixel), the lengths scaled to the published 13.103 m
// body (810) and 14.47 m over the buffers (812). See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import {
  Car, DMU_CATALOG, buffersBoth, endItems, enumParam, exhaust, sideEmblem, sideItems, sideNumber, slopePanel, tractionNumber, underBoxes,
  type EndItem, type PxBox, type SideItem,
} from "./dmuKit.ts";

export type Cd810Variant = "cd810" | "cd812" | "cd912";
export type Cd810Livery = "red" | "yellowBand" | "blueWhite" | "ivoryBand";

export const CD810_PARAMS: readonly ParamSpec[] = [
  enumParam("variant", "Vehicle", {
    cd810: "CD 810 railcar",
    cd812: "CD 812 Esmeralda (rebuilt motor car)",
    cd912: "CD 912 driving trailer (to the 812)",
  }),
  enumParam("livery", "Livery (810 only)", {
    red: "Red with a cream window band (vlakosimdb cd_810#1)",
    yellowBand: "Red with a yellow band (cd_810#2)",
    blueWhite: "Blue and white (cd_810#3)",
    ivoryBand: "Red with an ivory band (cd_810#4)",
  }),
];

/** The published 810 body (13.103 m) over the XML's 12.5 m; 13.97 m over the buffers. */
export const K810 = 13.103 / 12.5;
/** The published 812 length over the buffers (14.47 m) over the XML's 15.0 m. */
export const K812 = 14.47 / 15.0;

/** The running numbers: 810 225 is photographed in the yellow-band paint; the rest are illustrative. */
const NUMBERS: Record<Cd810Livery, string> = { red: "604", yellowBand: "225", blueWhite: "472", ivoryBand: "509" };

/** The running number a variant and livery carry, e.g. `810 225-3`. */
export function cd810Number(variant: Cd810Variant, livery: Cd810Livery): string {
  if (variant === "cd812") return tractionNumber("812", "613");
  if (variant === "cd912") return tractionNumber("912", "001");
  return tractionNumber("810", NUMBERS[livery]);
}

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** Horizontal bands of the 810 body, source heights. */
  bands: Array<[number, number, string]>;
  /** A front band laid over the end below the windscreen (native front rows), when it differs from the side. */
  front?: { rows: [number, number]; mat: string };
  /** Yellow corner stripes at the ends of the sides. */
  corners?: string;
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

// the native z_dec / x_both colours of each 810 paint
const PAINTS: Record<Cd810Livery, Paint> = {
  red: {
    palette: { red: c("#b0080f"), cream: c("#ffffaf"), roofGrey: c("#808780", 0.75), yellow: c("#ffff00") },
    bands: [[0.4, 1.9, "red"], [1.9, 3.0, "cream"], [3.0, 3.4, "roofGrey"]],
    front: { rows: [23, 26], mat: "yellow" },
  },
  yellowBand: {
    palette: { red: c("#c01810"), yellow: c("#ffff00"), roofGrey: c("#808780", 0.75) },
    bands: [[0.4, 1.2, "red"], [1.2, 1.8, "yellow"], [1.8, 3.0, "red"], [3.0, 3.4, "roofGrey"]],
  },
  blueWhite: {
    palette: { blue: c("#004080"), white: c("#efe8ef"), roofLight: c("#d0d7d0", 0.7), yellow: c("#f0df0f") },
    bands: [[0.4, 0.9, "blue"], [0.9, 1.9, "white"], [1.9, 3.0, "blue"], [3.0, 3.4, "roofLight"]],
    front: { rows: [22, 28], mat: "yellow" },
    corners: "yellow",
  },
  ivoryBand: {
    palette: { red: c("#c01810"), ivory: c("#ffffcf"), roofGrey: c("#808780", 0.75) },
    bands: [[0.4, 1.2, "red"], [1.2, 1.8, "ivory"], [1.8, 3.0, "red"], [3.0, 3.4, "roofGrey"]],
  },
};

// ---------------------------------------------------------------------------
// CD 810: z_dec / z_inc 140 x 40 px (14 x 4 m), x_both 30 x 40 px

/** The XML section (alongx base), source metres. */
const SECTION_810: Pt[] = [[-1.5, 0], [1.5, 0], [1.5, 3], [1.4, 3.15], [1.2, 3.2], [0, 3.3], [-1.2, 3.2], [-1.4, 3.15], [-1.5, 3]];

const WINDOWS_810: SideItem[] = [
  ...[7, 122].map((u): SideItem => ({ kind: "window", box: [u, 11, u + 5, 20], name: "end window", fw: 0.05 })),
  ...[22, 37, 52, 67, 82, 97].map((u): SideItem => ({ kind: "window", box: [u, 11, u + 14, 20], sash: 15 })),
];

/** The two folding doors and their windows. */
const DOORS_810: Array<{ door: PxBox; glass: PxBox }> = [
  { door: [13, 10, 21, 35], glass: [15, 12, 19, 20] },
  { door: [112, 10, 120, 35], glass: [114, 12, 118, 20] },
];

const FRONT_810: EndItem[] = [
  { kind: "lamp", box: [0.2, 23, 5.8, 26], name: "lamp" },
  { kind: "lamp", box: [24.2, 23, 29.8, 26], name: "lamp" },
];

function cd810Car(livery: Cd810Livery): MeshBuilder {
  const paint = PAINTS[livery];
  const car = new Car(paint.palette, { kx: K810, ky: 1, kz: 1, centre: 6.65, sideH: 4, frontH: 4 });
  const m = car.m;
  const d = 0.01;
  // the elevation: the windscreens rake back 0.1 m from 2.0 to 2.9 m under the
  // roof's visor (a separate overhang); the floor at 0.8 m drops to 0.4 m at the steps
  const body = car.volume({
    name: "body",
    section: SECTION_810,
    plan: [[0.4, 1.25], [0.5, 1.5], [12.8, 1.5], [12.9, 1.25]],
    top: [[0.4, 2.0], [0.5, 2.9], [0.52, 3.4], [12.78, 3.4], [12.8, 2.9], [12.9, 2.0]],
    bottom: [[0.4, 0.7], [1.3 - d, 0.7], [1.3, 0.45], [2.1, 0.45], [2.1 + d, 0.7], [2.3, 0.8], [11.0, 0.8], [11.2 - d, 0.7], [11.2, 0.45], [12.0, 0.45], [12.0 + d, 0.7], [12.9, 0.7]],
    bands: paint.bands,
  });
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS_810));
        m.scope("doors", () =>
          DOORS_810.forEach((dd, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(dd.door), "bands", { seam: 0.03 });
              m.scope("glass", () => car.c.window(body, s, car.side(dd.glass), { fw: 0.04 }));
            }),
          ),
        );
        if (paint.corners) m.scope("corner stripes", () => sideItems(car, body, s, [[3, 12, 7, 28], [126, 12, 130, 28]].map((b): SideItem => ({ kind: "panel", box: b as PxBox, mat: paint.corners, name: "stripe" }))));
        m.scope("emblem", () => sideEmblem(car, body, s, s > 0 ? [32, 23, 38, 27] : [95, 23, 101, 27], "lettering"));
        m.scope("running number", () => sideNumber(car, body, s, [60, 24, 70, 26], cd810Number("cd810", livery)));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const tip = e > 0 ? 12.9 : 0.4;
      const back = e > 0 ? 12.8 : 0.5;
      const plane = { x0: car.X(tip), y0: 2.0, x1: car.X(back), y1: 2.9 };
      m.scope("visor", () => visor(car, e, tip, back, paint.bands.find(([a, b]) => a <= 2.5 && b > 2.5)![2]));
      m.scope("windscreen", () => {
        for (const [i, [za, zb]] of ([[0.12, 1.22], [-1.22, -0.12]] as const).entries())
          m.scope(`pane ${i + 1}`, () => {
            m.scope("frame", () => slopePanel(m, "frame", e, plane, za, zb, 2.02, 2.88, 0.008, 0.01));
            m.scope("glass", () => slopePanel(m, "glass", e, plane, za + 0.02, zb - 0.02, 2.04, 2.68, 0.016, 0.006));
          });
      });
      if (paint.front) {
        const [r0, r1] = paint.front.rows;
        m.scope("front band", () => endItems(car, body, e, [{ kind: "panel", box: [0, r0, 30, r1], mat: paint.front!.mat, name: "band" }]));
      }
      m.scope("lamps", () => endItems(car, body, e, FRONT_810));
      m.scope("top lamp", () => {
        const x = car.X(tip) + e * 0.005;
        block(m, "frame", Math.min(x, x + e * 0.06), Math.max(x, x + e * 0.06), 3.0, 3.18, -0.28, 0.28);
      });
    });
  m.scope("buffers", () => buffersBoth(car, [6.65 - 6.985 / K810, 6.65 + 6.985 / K810], [0.4, 12.9], 1.0));
  m.scope("running gear", () => {
    for (const [i, x] of [-4.0, 4.0].entries())
      m.scope(`axle ${i + 1}`, () => car.c.axle(x + car.c.centre, 0.42, 0.8));
  });
  m.scope("underframe", () => {
    underBoxes(car, [
      { name: "engine", x0: 4.3, x1: 8.1, y0: 0.25, y1: 0.8, hw: 1.2 },
      { name: "gearbox", x0: 8.1, x1: 9.6, y0: 0.32, y1: 0.8, hw: 0.9 },
      { name: "fuel tank", x0: 3.0, x1: 4.3, y0: 0.4, y1: 0.79, hw: 1.0, mat: "tank" },
    ]);
  });
  m.scope("roof equipment", () => {
    m.scope("exhaust", () => exhaust(car, 4.8, 0, 3.25, 3.45, 0.09));
    m.scope("ventilator", () => block(m, "grey", car.X(8.2), car.X(8.6), 3.25, 3.42, -0.15, 0.15));
  });
  return m;
}

/** The roof's overhang over a raked windscreen: the section above 2.9 m, from the tip to the full plan. */
function visor(car: Car, e: number, tip: number, back: number, mat: string): void {
  const top = SECTION_810.filter(([, y]) => y > 2.95).map(([z, y]): [number, number] => [z * 1.004, y + 0.004]).sort((a, b) => b[0] - a[0]);
  const full: Array<[number, number]> = [[-1.506, 2.9], [1.506, 2.9], ...top];
  const narrow = full.map(([z, y]): [number, number] => [z * (1.25 / 1.5), y]);
  const xa = car.X(tip) + e * 0.004;
  const xb = car.X(back - e * 0.02);
  if (e > 0) car.m.sweep(mat, "x", full, xb, narrow, xa);
  else car.m.sweep(mat, "x", narrow, xa, full, xb);
}

export function cd810(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD810_PARAMS, params);
  const variant = p.variant as Cd810Variant;
  const livery = p.livery as Cd810Livery;
  if (variant === "cd810") return cd810Car(livery);
  return esmeralda(variant === "cd912");
}

// ---------------------------------------------------------------------------
// CD 812 / 912: z_dec = z_inc 160 x 60 px (16 x 6 m), x_both 30 x 60 px

const SECTION_812: Pt[] = [[-1.5, 1.2], [-1.4, 0.4], [-1.3, 0.2], [1.3, 0.2], [1.4, 0.4], [1.5, 1.2], [1.5, 3.5], [1.4, 3.6], [0.5, 3.7], [-0.5, 3.7], [-1.4, 3.6], [-1.5, 3.5]];
const PLAN_812: Pt[] = [[0.5, 0.5], [0.6, 1.3], [0.7, 1.4], [1.6, 1.5], [13.4, 1.5], [14.3, 1.4], [14.4, 1.3], [14.5, 0.5]];
const TOP_812: Pt[] = [[0.5, 2.6], [0.6, 3.1], [0.7, 3.3], [0.8, 3.4], [1.0, 3.5], [1.3, 3.6], [13.8, 3.6], [14.0, 3.5], [14.2, 3.4], [14.3, 3.3], [14.4, 3.1], [14.5, 2.6]];

/** The ends' aprons (XML `pl`) and the centre skirt (4.2..10.9 m) reach down to 0.2 m; the rest of the floor is at 1.0 m. */
const BOTTOM_812: Pt[] = [[0.5, 0.25], [0.7, 0.25], [1.3, 0.5], [2.8, 0.5], [3.2, 1.0], [4.19, 1.0], [4.2, 0.2], [10.9, 0.2], [10.91, 1.0], [11.8, 1.0], [12.2, 0.5], [13.8, 0.5], [14.3, 0.25], [14.5, 0.25]];

const ESMERALDA_PALETTE: Record<string, MaterialSpec> = {
  skirtGrey: c("#848484", 0.7),
  white: c("#f0f0f0"),
  green: c("#15a515"),
  lightGreen: c("#54c354"),
  doorGreen: c("#008400"),
  greyLine: c("#cccccc"),
  mask: c("#c9cbcc", 0.4),
  apronYellow: c("#f2c40f"),
  signBlack: c("#202020", 0.6),
};

/** Where the green sweeps down over the white band toward each end (native rows 41..46). */
const SWEEP: PxBox[] = [[8, 41, 16, 42], [8, 42, 13, 43], [8, 43, 11, 44], [8, 44, 9, 45]];
const mirror = (b: PxBox): PxBox => [150 - b[2], b[1], 150 - b[0], b[3]];

interface EsmeraldaLayout {
  windows: SideItem[];
  doors: Array<{ door: PxBox; glass: PxBox[] }>;
}

const LAYOUT_812: EsmeraldaLayout = {
  windows: [
    ...[9, 134].map((u): SideItem => ({ kind: "window", box: [u, 29, u + 7, 39], mat: "doorGreen", name: "cab window" })),
    ...[31, 46, 61, 76, 91, 106].map((u): SideItem => ({ kind: "window", box: [u, 30, u + 13, 39] })),
  ],
  doors: [
    { door: [18, 28, 28, 55], glass: [[20, 32, 26, 42]] },
    { door: [122, 28, 132, 55], glass: [[124, 32, 130, 42]] },
  ],
};

const LAYOUT_912: EsmeraldaLayout = {
  windows: [
    ...[9, 134].map((u): SideItem => ({ kind: "window", box: [u, 29, u + 7, 39], mat: "doorGreen", name: "cab window" })),
    { kind: "window", box: [18, 30, 27, 39] },
    { kind: "window", box: [29, 30, 42, 39] },
    { kind: "window", box: [46, 34, 59, 43], name: "low window" },
    { kind: "window", box: [91, 34, 104, 43], name: "low window" },
    { kind: "window", box: [108, 30, 121, 39] },
    { kind: "window", box: [123, 30, 132, 39] },
  ],
  doors: [{ door: [65, 28, 84, 56], glass: [[67, 32, 73, 42], [76, 32, 82, 42]] }],
};

const FRONT_812: EndItem[] = [
  { kind: "lamp", box: [4, 38, 8, 43], name: "lamp" },
  { kind: "lamp", box: [22, 38, 26, 43], name: "lamp" },
  { kind: "panel", box: [0, 47, 30, 48], mat: "greyLine", name: "line" },
];

function esmeralda(trailer: boolean): MeshBuilder {
  const car = new Car(ESMERALDA_PALETTE, { kx: K812, ky: 1, kz: 1, centre: 7.5, sideH: 6, frontH: 6 });
  const m = car.m;
  const L = trailer ? LAYOUT_912 : LAYOUT_812;
  const body: Volume = car.volume({
    name: "body",
    section: SECTION_812,
    plan: PLAN_812,
    top: TOP_812,
    bottom: BOTTOM_812,
    bands: [[0.2, 1.0, "skirtGrey"], [1.0, 1.9, "white"], [1.9, 3.3, "green"], [3.3, 3.7, "lightGreen"]],
  });
  const number = cd810Number(trailer ? "cd912" : "cd812", "red");
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("paint lines", () => {
          sideItems(car, body, s, [...SWEEP, ...SWEEP.map(mirror)].map((b): SideItem => ({ kind: "panel", box: b, mat: "green", name: "sweep" })));
        });
        m.scope("windows", () => sideItems(car, body, s, L.windows));
        m.scope("doors", () =>
          L.doors.forEach((dd, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(dd.door), "green", { seam: 0.03 });
              dd.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.04 })));
            }),
          ),
        );
        m.scope("emblem", () => sideEmblem(car, body, s, [47, 42, 55, 47], "signBlack", "emblemBack"));
        if (!trailer) m.scope("name board", () => sideItems(car, body, s, [{ kind: "panel", box: [76, 41, 88, 45], mat: "signBlack", name: "board" }]));
        m.scope("running number", () => sideNumber(car, body, s, trailer ? [100, 43, 118, 46] : [96, 43, 114, 46], number, "signBlack"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const X = (x: number) => car.X(e > 0 ? 15 - x : x);
      // the windscreen on two planes up the rounded nose: 2.6..3.1 m and 3.1..3.4 m
      const lower = { x0: X(0.5), y0: 2.6, x1: X(0.6), y1: 3.1 };
      const upper = { x0: X(0.6), y0: 3.1, x1: X(0.7), y1: 3.3 };
      m.scope("windscreen", () => {
        m.scope("lower", () => {
          m.scope("frame", () => slopePanel(m, "black", e, lower, -1.2, 1.2, 2.61, 3.1, 0.008, 0.01));
          m.scope("glass", () => slopePanel(m, "glass", e, lower, -1.15, 1.15, 2.64, 3.1, 0.016, 0.006));
        });
        m.scope("upper", () => {
          m.scope("frame", () => slopePanel(m, "black", e, upper, -1.2, 1.2, 3.1, 3.29, 0.008, 0.01));
          m.scope("glass", () => slopePanel(m, "glass", e, upper, -1.15, 1.15, 3.1, 3.25, 0.016, 0.006));
        });
      });
      m.scope("lamps", () => endItems(car, body, e, FRONT_812));
      m.scope("mask", () => endItems(car, body, e, [{ kind: "panel", box: [3, 37, 27, 44], mat: "mask", name: "panel" }, { kind: "panel", box: [6, 55, 24, 57], mat: "apronYellow", name: "edge" }]));
    });
  m.scope("buffers", () => buffersBoth(car, [0, 15], [0.62, 14.38], 1.0));
  m.scope("running gear", () => {
    for (const [i, x] of [3.35, 11.6].entries()) m.scope(`axle ${i + 1}`, () => car.c.axle(car.sx(x), 0.42, 1.0));
  });
  if (!trailer)
    m.scope("roof equipment", () => {
      m.scope("exhaust", () => exhaust(car, 5.2, 0.35, 3.66, 3.85, 0.08));
      m.scope("cooler", () => block(m, "grey", car.X(8.4), car.X(10.0), 3.68, 3.8, -0.6, 0.6));
    });
  return m;
}

/** Every combination the tests build: [variant, livery]. */
export const CD810_BUILDS: ReadonlyArray<[Cd810Variant, Cd810Livery]> = [
  ...(["red", "yellowBand", "blueWhite", "ivoryBand"] as const).map((l): [Cd810Variant, Cd810Livery] => ["cd810", l]),
  ["cd812", "red"],
  ["cd912", "red"],
];

export const DMU810_DESIGNS: ProceduralDesign[] = [
  { id: "veh-cd-810", title: "CD 810 / 812 / 912", build: cd810, params: CD810_PARAMS, catalog: DMU_CATALOG, references: "cd-810" },
];
