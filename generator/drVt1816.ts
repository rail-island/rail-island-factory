// The DR VT 18.16 "Delfin" (in Czech "Delfin", the SVT Gorlitz), the
// Deutsche Reichsbahn's diesel-hydraulic express unit of 1963-68: one design
// `veh-dr-vt1816` whose `unit` picks the car - the power car with its long
// rounded nose, the raised cockpit and the engine room's portholes (the
// default), one of the three intermediate cars (the VMc dining car, the VMd
// first and second class compartment car, the VMe second class car) - or the
// whole train, articulated: `cars` (2 .. 8) cars, a power car at each end and
// the intermediate cars between them, each car a section on its own bogies. A
// four-car train is power car, VMd, VMc, power car turned (98.06 m over the
// couplers).
//
// Modelled from the DEWAG sectional drawing of 175 015 / 016 (public domain,
// assets/dr-vt1816/drawing-vt175-section.png) and photographs: body lengths
// 24.81 m (power car) and 22.82 m (trailer), 0.70 m between the bodies, roof
// 4.20 m and cockpit 4.25 m, coupler at 1.03 m, the power car's motor bogie
// (4.0 m wheelbase) 5.15 m behind the nose and its other bogie 16.5 m further,
// the trailers' bogies 3.16 m from the ends and 16.5 m apart (2.5 m wheelbase,
// 900 mm wheels). The bodies are lofted here through vertical slices whose
// shoulder, crown, bottom and paint edges vary along the car, so the nose's hood
// and the red sweep under it are exact. See docs/models/dr-vt1816.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach } from "./csdCoachParts.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, DMU_CATALOG, enumParam } from "./emuParts.ts";
import { unitBogie } from "./unitParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { LOD_GLASS, lodPolygon, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";
import { articulate } from "./tramKit.ts";
import { openable, plugMove } from "./doors.ts";
import { CABIN_INSET, drawCabin } from "./interior.ts";
import { add, capSlice, cross, dot, lerp, loftHalves, mul, sub, unit, type Pt } from "./sliceLoft.ts";

/** What the design builds: one car, or the whole train. */
export type Vt1816Unit = "powerCar" | "dining" | "firstClass" | "trailer" | "train";
/** One car of the train: the power car, or an intermediate car (VMc, VMd, VMe). */
export type Vt1816Car = Exclude<Vt1816Unit, "train">;
/** The two bodies: the power car's, and the intermediate cars' (all 22.82 m). */
export type Vt1816Body = "powerCar" | "trailer";

/** The train's car counts: two power cars and up to six intermediate cars. */
export const VT1816_MIN_CARS = 2;
export const VT1816_MAX_CARS = 8;

export const VT1816_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    powerCar: "Power car",
    dining: "Dining car VMc",
    firstClass: "1st class VMd",
    trailer: "2nd class VMe",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(Array.from({ length: VT1816_MAX_CARS - VT1816_MIN_CARS + 1 }, (_, i) => [String(i + VT1816_MIN_CARS), `${i + VT1816_MIN_CARS} cars`]))),
    default: "4",
    when: { name: "unit", values: ["train"] },
  },
];

/** Body lengths (m), nose tip or end wall to end wall, from the drawing. */
export const VT1816_POWER_BODY = 24.81;
export const VT1816_TRAILER_BODY = 22.82;
/** Half the 0.70 m between two bodies: each car's coupling plane; the nose coupler reaches as far. */
export const VT1816_GAP = 0.35;
/** Lengths over the couplers: 2 x 25.51 + 2 x 23.52 = 98.06 m, the published four-car length. */
export const VT1816_LENGTH: Record<Vt1816Body, number> = {
  powerCar: VT1816_POWER_BODY + 2 * VT1816_GAP,
  trailer: VT1816_TRAILER_BODY + 2 * VT1816_GAP,
};
/** Axles, metres back from the nose tip (power car) or the +X end wall (trailer). */
export const VT1816_AXLES: Record<Vt1816Body, number[]> = {
  // the motor bogie: pivot 5.15 m, axles 1.94 m ahead and 2.06 m behind it
  powerCar: [3.21, 7.21, 20.4, 22.9],
  trailer: [1.91, 4.41, 18.41, 20.91],
};
/** The running number on the power car's nose and sides (the museum unit of the photos). */
export const VT1816_NUMBER = "VT 18.16.07";

/** Half the body width (2.94 m). */
const W = 1.47;
const WHEEL_R = 0.45;
const COUPLER_Y = 1.03;
/** The window band of every car: sills and heads. */
const WIN: [number, number] = [2.08, 2.86];

const c = (color: string, roughness = 0.5, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic !== undefined ? { metallic } : {}) });
const PALETTE: Record<string, MaterialSpec> = {
  cream: c("#ece5ca", 0.45),
  red: c("#a51f2d", 0.45),
  black: c("#1d1d1f", 0.6),
  white: c("#f2f2ee", 0.45),
  blue: c("#28479a", 0.45),
  skirt: c("#bfc2c1", 0.55),
  roof: c("#d6d2c0", 0.7),
  glass: { ...c("#26303a", 0.12, 0.2), glass: true },
  rubber: c("#1c1c1e", 0.9),
  bellows: c("#2a2b2d", 0.9),
  chrome: c("#c9ccd0", 0.25, 0.6),
  louvre: c("#d6d0b8", 0.6),
  slat: c("#5f5c54", 0.7),
  lettering: c("#ece5ca", 0.5),
  silver: c("#d8dadc", 0.3, 0.5),
  lampWhite: { ...c("#f3f5f6", 0.2), lamp: { role: "head" } },
  lampRed: { ...c("#c8202c", 0.3), lamp: { role: "tail" } },
  vent: c("#a9a79e", 0.7),
  engine: c("#2e3033", 0.8),
  motor: c("#2e3033", 0.8),
  coupler: c("#2a2b2d", 0.6, 0.3),
  equipment: c("#3b3d40", 0.8),
};


// --- the body: vertical slices along the car ---------------------------------------------------

/** The fixed stripes at the floor: the black band, white lines either side of the blue one. */
const STRIPES: Array<[number, string]> = [[1.05, "black"], [1.22, "white"], [1.25, "blue"], [1.31, "white"], [1.33, "red"]];
/** Segments of the roof's quarter arc. */
const ARC = 8;

/** A car's body as functions of d, metres back from its +X end. */
interface Profile {
  length: number;
  /** Half width. */
  w: (d: number) => number;
  /** Bottom of the sides (skirts). */
  B: (d: number) => number;
  /** Top of the vertical sides, where the roof's (or the hood's) arc starts. */
  S: (d: number) => number;
  /** The crown. */
  C: (d: number) => number;
  /** Top of the red: the cream above it. */
  H: (d: number) => number;
  /** The arc's paint between two stations, by their middle. */
  top: (d: number) => string;
  stations: number[];
}

/** One half slice (z >= 0) from the bottom's centre to the crown: points and the paint of each edge. */
function halfSlice(p: Profile, d: number): { pts: Pt[]; mats: string[] } {
  const w = p.w(d), B = p.B(d), S = p.S(d), C = p.C(d), H = p.H(d);
  const pts: Pt[] = [[0, B], [0.92 * w, B], [w, B + 0.08], ...STRIPES.map(([y]): Pt => [w, y]), [w, H], [w, S]];
  const mats = ["equipment", "skirt", "skirt", ...STRIPES.map(([, m]) => m), "cream"];
  for (let i = 1; i <= ARC; i++) {
    const t = (i / ARC) * (Math.PI / 2);
    pts.push(i === ARC ? [0, C] : [w * Math.cos(t), S + (C - S) * Math.sin(t)]);
    mats.push("arc");
  }
  return { pts, mats };
}

/** The bands of a slice from bottom to crown, for its end caps. */
function sliceBands(p: Profile, d: number): Array<[number, number, string]> {
  const ys = [p.B(d), ...STRIPES.map(([y]) => y), p.H(d), p.S(d), p.C(d)];
  const mats = ["skirt", ...STRIPES.map(([, m]) => m), "cream", p.top(d)];
  return mats.map((m, i): [number, number, string] => [ys[i]!, ys[i + 1]!, m]);
}


/** A passenger door's leaf box on side s (d along the car, y up): the doorway into the car's cabin. */
interface Leaf {
  s: number;
  d0: number;
  d1: number;
  y0: number;
  y1: number;
}

/** The glass of side windows over spans `d` (on the sides they stand on), as `sideWindow` lays it: its windows seen from inside. */
const glassOf = (list: ReadonlyArray<{ d: readonly [number, number]; sides?: number[] }>): Leaf[] =>
  [1, -1].flatMap((s) => list.filter((w) => !w.sides || w.sides.includes(s)).map(({ d: [a, b] }) => ({ s, d0: a + 0.05, d1: b - 0.05, y0: WIN[0] + 0.05, y1: WIN[1] - 0.05 })));

/** How far a door's leaf stands inside its outline. */
const LEAF_INSET = 0.025;

/** The leaf box of a door over d0..d1 and y0..y1 (its outline) on side s. */
const leafOf = (s: number, d0: number, d1: number, y0: number, y1: number): Leaf => ({ s, d0: d0 + LEAF_INSET, d1: d1 - LEAF_INSET, y0: y0 + LEAF_INSET, y1: y1 - LEAF_INSET });

/** Draws a car's body: the lofted slices, open over its doors' `leaves` (2 mm beyond, under the frame), and both end caps. */
function drawBody(m: MeshBuilder, p: Profile, X: (d: number) => number, leaves: readonly Leaf[] = []): void {
  const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
  const ds = cut.length ? [...new Set([...p.stations, ...cut.flatMap((o) => [o.d0, o.d1])])].sort((a, b) => a - b) : p.stations;
  const halves = ds.map((d) => halfSlice(p, d));
  m.scope("shell", () =>
    loftHalves(m, ds.map(X), halves.map((h) => h.pts), (seg, edge) => {
      const mat = halves[seg]!.mats[edge]!;
      return mat === "arc" ? p.top((ds[seg]! + ds[seg + 1]!) / 2) : mat;
    }, (seg) => {
      const d = (ds[seg]! + ds[seg + 1]!) / 2;
      return (p.B(d) + p.C(d)) / 2;
    }, (s, seg) => {
      const o = cut.find((c) => c.s === s && c.d0 <= ds[seg]! + 1e-9 && ds[seg + 1]! <= c.d1 + 1e-9);
      return o ? [o.y0, o.y1] : null;
    }),
  );
  m.scope("end caps", () => {
    capSlice(m, halves[0]!.pts, X(ds[0]!), 1, sliceBands(p, ds[0]!));
    capSlice(m, halves[ds.length - 1]!.pts, X(ds[ds.length - 1]!), -1, sliceBands(p, ds[ds.length - 1]!));
  });
}

// --- the profiles -----------------------------------------------------------------------------

/** The nose's plan: a flat front 0.5 m wide rounding into the sides over 1.4 m (an ellipse). */
const NOSE_W0 = 0.25;
const NOSE_D = 1.4;
const noseW = (d: number): number => (d >= NOSE_D ? W : NOSE_W0 + (W - NOSE_W0) * Math.sqrt(Math.max(0, 1 - (1 - d / NOSE_D) ** 2)));

/** The power car's side shoulder rising from the nose to the cant rail (the drawing's crease line). */
const POWER_S: Pt[] = [[0, 2.24], [0.2, 2.28], [0.6, 2.35], [1.9, 2.55], [3.55, 2.85], [5.0, 3.08], [6.4, 3.2]];
/** The hood's crown from the nose's top over the windscreen's foot to the roof behind the cockpit. */
const POWER_C: Pt[] = [[0, 2.3], [0.2, 2.38], [0.6, 2.64], [1.2, 2.85], [1.9, 3.02], [3.55, 3.46], [6.0, 3.85], [9.0, 4.08], [11.1, 4.2]];
/** The red rises toward the nose. */
const POWER_H: Pt[] = [[0, 2.2], [1.0, 2.13], [3.0, 2.01], [6.0, 1.95]];
/** The bottom: the nose's chin, the skirt over the motor bogie, open over the rear bogie. */
const POWER_B: Pt[] = [[0, 0.62], [0.12, 0.5], [0.35, 0.43], [1.2, 0.45], [1.9, 0.55], [2.4, 0.71], [19.5, 0.71], [19.6, 0.95], [VT1816_POWER_BODY, 0.95]];
/** Where the cockpit's roof meets the car's: the hood is cream ahead of it. */
const HOOD_END = 11.1;

const POWER: Profile = {
  length: VT1816_POWER_BODY,
  w: noseW,
  B: (d) => lerp(POWER_B, d),
  S: (d) => lerp(POWER_S, d),
  C: (d) => lerp(POWER_C, d),
  H: (d) => lerp(POWER_H, d),
  top: () => "cream",
  stations: [...new Set([0, 0.03, 0.08, 0.15, 0.25, 0.4, 0.6, 0.85, 1.1, 1.4, 1.9, 2.4, 3.0, 3.55, 4.3, 5.0, 6.0, 6.4, 7.5, 9.0, 10.0, 11.1, 12.0, ...POWER_B.map(([d]) => d)])].sort((a, b) => a - b),
};

/** The trailer's bottom: the door steps at the ends, open over the bogies, the apron between them. */
const TRAILER_B: Pt[] = [[0, 0.64], [1.05, 0.64], [1.1, 0.95], [5.6, 0.95], [6.1, 0.45], [16.72, 0.45], [17.22, 0.95], [21.72, 0.95], [21.77, 0.64], [VT1816_TRAILER_BODY, 0.64]];

const TRAILER: Profile = {
  length: VT1816_TRAILER_BODY,
  w: () => W,
  B: (d) => lerp(TRAILER_B, d),
  S: () => 3.2,
  C: () => 4.2,
  H: () => 1.95,
  top: () => "roof",
  stations: TRAILER_B.map(([d]) => d),
};


// --- side fittings --------------------------------------------------------------------------

interface Side {
  m: MeshBuilder;
  p: Profile;
  X: (d: number) => number;
  s: number;
}

/** A box on the flat side from d0 to d1, y0 to y1: its face `proud` off the skin, `depth` thick. */
function sideBox(f: Side, mat: string, d0: number, d1: number, y0: number, y1: number, proud: number, depth: number): void {
  const [a, b] = [f.X(d0), f.X(d1)].sort((p, q) => p - q) as [number, number];
  block(f.m, mat, a, b, y0, y1, ...side(f.s, W + proud - depth, W + proud));
}

/** A window: the rubber frame, the glass, and the top light's bar when `bar`. */
function sideWindow(f: Side, d0: number, d1: number, y0: number, y1: number, bar = true): void {
  f.m.scope("frame", () => sideBox(f, "rubber", d0, d1, y0, y1, 0.012, 0.04));
  f.m.scope("glass", () => sideBox(f, "glass", d0 + 0.05, d1 - 0.05, y0 + 0.05, y1 - 0.05, 0.02, 0.006));
  if (bar) f.m.scope("bar", () => sideBox(f, "rubber", d0 + 0.04, d1 - 0.04, y1 - 0.34, y1 - 0.3, 0.026, 0.005));
}

/**
 * A door: its seam, the leaf in the body's paint, its window, a grab handrail and
 * the step under it. A passenger door (`opens`) opens as one plug leaf with its
 * windows, sliding toward the car's middle (doors.ts).
 */
function sideDoor(f: Side, d0: number, d1: number, y0: number, y1: number, glass: Array<[number, number]>, opens = true): void {
  const m = f.m;
  const dm = (d0 + d1) / 2;
  const k = LEAF_INSET;
  // a passenger door's outline is the frame round its doorway cut through the shell
  m.scope("outline", () => {
    if (!opens) return sideBox(f, "rubber", d0, d1, y0, y1, 0.006, 0.04);
    sideBox(f, "rubber", d0, d0 + k, y0, y1, 0.006, 0.04);
    sideBox(f, "rubber", d1 - k, d1, y0, y1, 0.006, 0.04);
    sideBox(f, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.006, 0.04);
    sideBox(f, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.006, 0.04);
  });
  const leaf = (g: Side) => {
    g.m.scope("leaf", () => {
      for (const [a, b, mat] of sliceBands(g.p, dm)) {
        const [lo, hi] = [Math.max(a, y0 + 0.025), Math.min(b, y1 - 0.025)];
        if (hi - lo > 1e-6) sideBox(g, mat === "roof" ? "cream" : mat, d0 + 0.025, d1 - 0.025, lo, hi, 0.011, 0.004);
      }
    });
    g.m.scope("glass", () => glass.forEach(([a, b]) => {
      sideBox(g, "rubber", a, b, WIN[0], WIN[1], 0.016, 0.004);
      sideBox(g, "glass", a + 0.035, b - 0.035, WIN[0] + 0.035, WIN[1] - 0.035, 0.021, 0.004);
    }));
  };
  if (!opens) leaf(f);
  else {
    const dx = f.X(d0 + (dm < f.p.length / 2 ? 1 : -1) * (d1 - d0)) - f.X(d0);
    openable(m, (mm, o) => mm.moved(plugMove(o, f.s, dx), () => leaf({ ...f, m: mm })));
  }
  m.scope("handrails", () => {
    for (const d of [d0 - 0.07, d1 + 0.07]) {
      m.prism("chrome", ngon(6, 0.015, 0, f.X(d), f.s * (W + 0.045)), 1.35, 2.65);
      for (const y of [1.37, 2.6]) block(m, "chrome", f.X(d) - 0.014, f.X(d) + 0.014, y, y + 0.02, ...side(f.s, W - 0.01, W + 0.045));
    }
  });
  m.scope("step", () => sideBox(f, "equipment", d0 + 0.05, d1 - 0.05, 0.48, 0.54, 0.02, 0.25));
}

/**
 * The cabin of a car from d0 to d1 behind its doors' `leaves` (interior.ts): a
 * floor at the lowest sill, a ceiling above the highest head under the roof's
 * arc, the side walls CABIN_INSET inside the flat sides, its `windows` (glass boxes)
 * on them, a seat row only where the sides are full width, standing over the
 * body's bottom.
 */
function drawCarCabin(m: MeshBuilder, p: Profile, X: (d: number) => number, d0: number, d1: number, leaves: readonly Leaf[], windows: readonly Leaf[]): void {
  const floor = Math.min(...leaves.map((o) => o.y0)) + 0.003;
  const ds = [d0, d1, ...p.stations.filter((d) => d > d0 && d < d1)];
  const ceiling = Math.min(Math.max(...leaves.map((o) => o.y1)) + 0.12, ...ds.map((d) => p.C(d) - 0.08));
  const half = W - CABIN_INSET;
  const [x0, k] = [X(0), X(1) - X(0)];
  const dOf = (x: number) => (x - x0) / k;
  const span = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);
  const [cx0, cx1] = span(X(d0), X(d1));
  drawCabin(m, {
    x0: cx0,
    x1: cx1,
    floor,
    ceiling,
    half,
    doors: leaves.map((o) => {
      const [a, b] = span(X(o.d0), X(o.d1));
      return { s: o.s, x0: a, x1: b, y0: o.y0 + 0.003, y1: o.y1 - 0.003, skin: () => W };
    }),
    // the walls stop at the body's bottom edge where it rises above the floor (over the bogies)
    bottom: { at: (x) => p.B(dOf(x)), xs: p.stations.map(X) },
    windows: windows.map((w) => {
      const [a, b] = span(X(w.d0), X(w.d1));
      return { s: w.s, x0: a, x1: b, y0: w.y0, y1: w.y1 };
    }),
    room: (xa, xb) => {
      const at = [xa, (xa + xb) / 2, xb].map(dOf);
      if (!at.every((d) => p.w(d) >= W - 1e-6)) return null;
      return { base: Math.max(floor, ...at.map((d) => p.B(d) + 0.01)), top: Math.min(...at.map((d) => p.S(d))) };
    },
  });
}

/** Painted lettering on the side, centred at d, its foot at y, h tall, reading left to right from outside. */
function sideLettering(f: Side, text: string, d: number, y: number, h: number, mat = "lettering"): void {
  const w = h * 0.58;
  const gap = h * 0.16;
  const width = strokeWidth(text, w, gap);
  const u0 = f.X(d) + (f.s > 0 ? -width / 2 : width / 2);
  f.m.facets(mat, strokeText(text, u0, y, h, w, gap, f.s < 0).map(([u, v]): Vec3 => [u, v, f.s * (W + 0.005)]), [0, 0, f.s]);
}

/** Four porthole windows of the engine room. */
const PORTHOLES = [6.42, 7.53, 8.59, 9.67];
const PORTHOLE_Y = 2.73;

/** The power car's side, nose to inner end: the cab door, the portholes, the baggage double door, the passenger door and windows. */
const POWER_DOORS: Array<{ d: [number, number]; glass: Array<[number, number]> }> = [
  { d: [5.24, 5.91], glass: [[5.37, 5.78]] },
  { d: [10.85, 11.81], glass: [[10.96, 11.22], [11.44, 11.7]] },
  { d: [13.69, 14.57], glass: [[13.86, 14.4]] },
];
const POWER_WINDOWS: Array<[number, number]> = [[12.33, 12.89], [15.18, 16.29], [16.69, 17.79], [18.16, 19.24], [19.64, 20.82], [21.19, 22.34], [23.7, 24.26]];
/** The roof's louvres over the engine room, d0, d1, y0, y1. */
const LOUVRES: Array<[number, number, number, number]> = [[6.35, 7.57, 3.28, 3.69], [8.12, 9.94, 3.28, 3.69], [11.8, 13.6, 3.32, 3.69]];

/** The point of a slice's roof arc at d, height y, on side s (x left 0). */
function arcPoint(p: Profile, d: number, y: number, s: number): Vec3 {
  const w = p.w(d), S = p.S(d), C = p.C(d);
  const t = Math.asin(Math.min(1, Math.max(0, (y - S) / (C - S))));
  return [0, y, s * w * Math.cos(t)];
}

/** A louvre on the roof's shoulder: a plate through the arc's corners and its slats. */
function louvre(f: Side, d0: number, d1: number, y0: number, y1: number): void {
  const corner = (d: number, y: number): Vec3 => {
    const a = arcPoint(f.p, d, y, f.s);
    return [f.X(d), a[1], a[2]];
  };
  const q = [corner(d0, y0), corner(d1, y0), corner(d1, y1), corner(d0, y1)];
  let n = unit(cross(sub(q[1]!, q[0]!), sub(q[3]!, q[0]!)));
  if (n[2] * f.s < 0) n = mul(n, -1);
  const at = (u: number, v: number, proud: number): Vec3 => {
    const lo = add(mul(q[0]!, 1 - u), mul(q[1]!, u));
    const hi = add(mul(q[3]!, 1 - u), mul(q[2]!, u));
    return add(add(mul(lo, 1 - v), mul(hi, v)), mul(n, proud));
  };
  const rect = (u0: number, u1: number, v0: number, v1: number, proud: number) => [at(u0, v0, proud), at(u1, v0, proud), at(u1, v1, proud), at(u0, v1, proud)];
  f.m.slab("louvre", rect(0, 1, 0, 1, 0.025), mul(n, -0.07));
  const slats = Math.max(3, Math.round((y1 - y0) / 0.06));
  for (let i = 0; i < slats; i++) {
    const v0 = 0.08 + (0.84 * i) / slats;
    f.m.slab("slat", rect(0.03, 0.97, v0, v0 + (0.84 / slats) * 0.45, 0.032), mul(n, -0.005));
  }
}

// --- the nose -----------------------------------------------------------------------------

/**
 * The power car's nose surface at u across (the viewer's right as seen from
 * ahead, so z = -u) and height y on its vertical part: the point on the lofted
 * slices and their outward normal.
 */
function nosePoint(u: number, y: number, X: (d: number) => number): { p: Vec3; n: Vec3 } {
  const lat = Math.abs(u);
  const s = u < 0 ? 1 : -1;
  if (lat <= NOSE_W0) return { p: [X(0), y, -u], n: [1, 0, 0] };
  const ds = POWER.stations;
  for (let i = 0; i + 1 < ds.length; i++) {
    const [da, db] = [ds[i]!, ds[i + 1]!];
    const [wa, wb] = [noseW(da), noseW(db)];
    if (lat <= wb + 1e-9) {
      const t = (lat - wa) / Math.max(1e-9, wb - wa);
      const d = da + t * (db - da);
      return { p: [X(d), y, s * lat], n: unit([wb - wa, 0, s * (db - da)]) };
    }
  }
  return { p: [X(NOSE_D), y, s * W], n: [0, 0, s] };
}

/** Flat triangles (u, y) laid on the nose `proud` off it. */
function noseDecal(m: MeshBuilder, mat: string, tris: Pt[], X: (d: number) => number, proud = 0.008): void {
  const pts = tris.map(([u, y]): Vec3 => {
    const q = nosePoint(u, y, X);
    return add(q.p, mul(q.n, proud));
  });
  m.facets(mat, pts, [1, 0, 0]);
}

/** A flat disc tangent to the nose at (u, y): radius r, `proud` off it, `depth` into it. */
function noseDisc(m: MeshBuilder, mat: string, u: number, y: number, r: number, proud: number, depth: number, X: (d: number) => number, sides = 16): void {
  const q = nosePoint(u, y, X);
  const t = unit([q.n[2], 0, -q.n[0]]);
  const pts = Array.from({ length: sides }, (_, i): Vec3 => {
    const a = (2 * Math.PI * i) / sides;
    return add(add(q.p, mul(q.n, proud)), add(mul(t, r * Math.cos(a)), [0, r * Math.sin(a), 0]));
  });
  m.slab(mat, pts, mul(q.n, -depth));
}

/** A strip from u0 to u1 at y0..y1 (a wing of the emblem) split so it follows the nose's curve; `slant` cuts its outer end. */
function wingStrip(u0: number, u1: number, y0: number, y1: number, slant: number): Pt[] {
  const out: Pt[] = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const [a, b] = [u0 + ((u1 - u0) * i) / n, u0 + ((u1 - u0) * (i + 1)) / n];
    const top = (u: number) => (i === n - 1 && u === b ? y1 - slant : y1);
    out.push([a, y0], [b, y0], [b, top(b)], [a, y0], [b, top(b)], [a, y1]);
  }
  return out;
}

function drawNose(m: MeshBuilder, X: (d: number) => number): void {
  m.scope("headlights", () => {
    for (const u of [-0.64, 0.64])
      m.scope(u < 0 ? "left lamps" : "right lamps", () => {
        noseDisc(m, "chrome", u, 1.62, 0.155, 0.02, 0.07, X);
        noseDisc(m, "lampWhite", u, 1.62, 0.115, 0.03, 0.008, X);
        noseDisc(m, "chrome", u, 1.93, 0.085, 0.02, 0.07, X, 12);
        noseDisc(m, "lampWhite", u, 1.93, 0.06, 0.03, 0.008, X, 12);
      });
  });
  m.scope("emblem", () => {
    const tris: Pt[] = [];
    for (let k = 0; k < 3; k++) {
      const y0 = 1.69 - k * 0.045;
      const len = 0.44 - k * 0.06;
      for (const sg of [-1, 1]) {
        const strip = wingStrip(0.08, len, y0, y0 + 0.026, 0.015);
        tris.push(...strip.map(([u, y]): Pt => [sg * u, y]));
      }
    }
    // the winged wheel's hub between the wings
    tris.push([-0.055, 1.6], [0.055, 1.6], [0.055, 1.73], [-0.055, 1.6], [0.055, 1.73], [-0.055, 1.73]);
    for (const [ch, u] of [["D", -0.2], ["R", 0.2]] as const) tris.push(...strokeText(ch, u - 0.03, 1.47, 0.1, 0.06, 0.02, false, 0.018));
    noseDecal(m, "silver", tris, X);
  });
  m.scope("running number", () => {
    const h = 0.1, w = 0.055, gap = 0.018;
    const width = strokeWidth(VT1816_NUMBER, w, gap);
    noseDecal(m, "lettering", strokeText(VT1816_NUMBER, -width / 2, 1.86, h, w, gap, false, 0.016), X);
  });
  m.scope("coupler", () => centreCoupler(m, 1, X(0.7), X(-VT1816_GAP), COUPLER_Y));
}

// --- the cockpit ----------------------------------------------------------------------------

/** The hood's height at d, z on the lofted slices' ellipse. */
const hoodY = (d: number, z: number): number => {
  const w = noseW(d), S = POWER.S(d), C = POWER.C(d);
  return S + (C - S) * Math.sqrt(Math.max(0, 1 - (z / w) ** 2));
};

/** The raised cockpit: d, half width, roof; its foot is sunk into the hood. */
const COCKPIT: Array<[number, number, number]> = [[3.38, 0.7, 3.5], [3.62, 0.8, 4.18], [3.95, 0.95, 4.25], [5.4, 0.92, 4.25], [7.5, 0.6, 4.23], [HOOD_END, 0.3, 4.22]];

function cockpitHalf([d, cw, T]: [number, number, number]): Pt[] {
  const yb = hoodY(d, cw) - 0.1;
  return [[0, yb], [cw, yb], [cw, T - 0.15], [0.8 * cw, T], [0, T]];
}

function drawCockpit(m: MeshBuilder, X: (d: number) => number): void {
  const halves = COCKPIT.map(cockpitHalf);
  const xs = COCKPIT.map(([d]) => X(d));
  m.scope("shell", () => {
    loftHalves(m, xs, halves, () => "red", (i) => (halves[i]![0]![1] + halves[i]![4]![1]) / 2);
    capSlice(m, halves[0]!, xs[0]!, 1, [[0, 5, "red"]]);
    capSlice(m, halves[halves.length - 1]!, xs[xs.length - 1]!, -1, [[0, 5, "red"]]);
  });
  // a quad face of the loft between stations i and i + 1, corners (z, y) of edge k on side s
  const face = (i: number, k: number, s: number) => {
    const P = (j: number, kk: number): Vec3 => [xs[j]!, halves[j]![kk]![1], s * halves[j]![kk]![0]];
    return [P(i, k), P(i + 1, k), P(i + 1, k + 1), P(i, k + 1)] as const;
  };
  const pane = (q: readonly [Vec3, Vec3, Vec3, Vec3], u0: number, u1: number, v0: number, v1: number, out: Vec3, mat: string, proud: number, depth: number) => {
    let n = unit(cross(sub(q[1], q[0]), sub(q[3], q[0])));
    if (dot(n, out) < 0) n = mul(n, -1);
    const at = (u: number, v: number): Vec3 => {
      const lo = add(mul(q[0], 1 - u), mul(q[1], u));
      const hi = add(mul(q[3], 1 - u), mul(q[2], u));
      return add(add(mul(lo, 1 - v), mul(hi, v)), mul(n, proud));
    };
    m.slab(mat, [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], mul(n, -depth));
  };
  m.scope("windscreen", () => {
    // the front face between the top edges of the first two slices, both sides' halves
    for (const s of [1, -1]) {
      const P = (j: number, kk: number): Vec3 => [xs[j]!, halves[j]![kk]![1], s * halves[j]![kk]![0]];
      const q = [P(0, 4), P(0, 3), P(1, 3), P(1, 4)] as const;
      pane(q, 0.04, 0.95, 0.1, 0.9, [1, 0.5, 0], "glass", 0.012, 0.008);
    }
    // the corner panes on the faces turning back to the sides
    for (const s of [1, -1]) pane(face(1, 1, s), 0.08, 0.92, 0.42, 0.9, [0.3, 0, s], "glass", 0.012, 0.008);
  });
  m.scope("side windows", () => {
    for (const s of [1, -1]) {
      const [a, b] = [X(5.3), X(4.15)];
      block(m, "rubber", a, b, 3.62, 4.04, ...side(s, 0.93, 0.962));
      block(m, "glass", a + 0.04, b - 0.04, 3.66, 4.0, ...side(s, 0.95, 0.968));
    }
  });
  m.scope("roof lamp", () => {
    const x = X(4.05);
    m.prism("red", ngon(10, 0.1, 0, x, 0), 4.2, 4.36);
    const lens = ngon(10, 0.06, 0, 0, 4.29);
    m.sweep("lampWhite", "x", lens, x + 0.08, lens, x + 0.11);
  });
}


// --- the intermediate cars --------------------------------------------------------------------

/** A window (d0, d1) on the sides `sides` (+1 the +Z side); both when omitted. */
interface CarWindow {
  d: [number, number];
  sides?: number[];
}

/** An intermediate car's sides: its windows, doors and roof fittings, d from its +X end. */
interface MiddleLayout {
  windows: CarWindow[];
  doors: CarWindow[];
  /** Roof boxes: d0, d1, half width (the dining car's kitchen ventilation). */
  roofBoxes?: Array<[number, number, number]>;
}

const L = VT1816_TRAILER_BODY;
const pitch = (n: number, first: number, step: number, width: number): CarWindow[] => Array.from({ length: n }, (_, i) => ({ d: [first + i * step, first + i * step + width] }));

/**
 * The intermediate cars, from the drawing (the VMc is the upper middle car, its
 * +Z side; the VMd the lower one, its -Z side) and the type's description: an
 * entrance with doors on both sides behind one gangway, a single entrance on
 * one side at the other end; the VMe's two entrances diagonally opposite.
 */
const MIDDLE: Record<Exclude<Vt1816Car, "powerCar">, MiddleLayout> = {
  // three second class compartments, the dining room's seven windows, the kitchen's small one
  dining: {
    windows: [...[2.66, 4.95, 7.24].map((d): CarWindow => ({ d: [d, d + 1.18] })), ...pitch(7, 9.65, 1.74, 1.13), { d: [21.86, 22.45], sides: [1] }],
    doors: [{ d: [0.25, 1.0] }, { d: [L - 1.0, L - 0.25], sides: [-1] }],
    roofBoxes: [[20.6, 22.0, 0.45]],
  },
  // compartments at about 2.02 m
  firstClass: {
    windows: [2.81, 4.8, 6.87, 8.89, 11.0, 12.8, 14.84, 16.86, 18.9].map((d): CarWindow => ({ d: [d, d + 1.12] })),
    doors: [{ d: [0.25, 1.0], sides: [-1] }, { d: [L - 1.0, L - 0.25] }],
  },
  // ten compartment windows at 1.95 m
  trailer: {
    windows: Array.from({ length: 10 }, (_, i): CarWindow => {
      const x = L / 2 + (i - 4.5) * 1.95;
      return { d: [x - 0.575, x + 0.575] };
    }),
    doors: [{ d: [0.25, 1.0], sides: [1] }, { d: [L - 1.0, L - 0.25], sides: [-1] }],
  },
};

const onSide = (w: CarWindow, s: number): boolean => !w.sides || w.sides.includes(s);

// --- the cars -------------------------------------------------------------------------------

/**
 * The fittings at an inner end at d `wall` (e: +1 the +X end): the end door, the
 * gangway's frame (left out inside the train, whose joint draws the bellows) and
 * the centre coupler.
 */
function innerEnd(m: MeshBuilder, X: (d: number) => number, e: number, wall: number, gangway: boolean): void {
  const face = e > 0 ? -VT1816_GAP : wall + VT1816_GAP;
  m.scope("end door", () => {
    const [a, b] = [X(wall), X(wall) + e * 0.012].sort((p, q) => p - q) as [number, number];
    block(m, "rubber", a, b, 1.3, 3.0, -0.36, 0.36);
  });
  if (gangway)
    m.scope("gangway", () => {
      const [a, b] = [X(wall) - e * 0.02, X(face) - e * 0.01].sort((p, q) => p - q) as [number, number];
      for (const z of [-1, 1]) block(m, "rubber", a, b, 1.2, 3.3, ...side(z, 0.5, 0.72));
      block(m, "rubber", a, b, 3.1, 3.3, -0.5, 0.5);
      block(m, "rubber", a, b, 1.2, 1.32, -0.5, 0.5);
    });
  m.scope("coupler", () => centreCoupler(m, e, X(wall + e * 0.9), X(face), COUPLER_Y));
}

function roofVents(m: MeshBuilder, X: (d: number) => number, ds: number[]): void {
  m.scope("ventilators", () => ds.forEach((d, i) => m.scope(`ventilator ${i + 1}`, () => block(m, "vent", X(d) - 0.16, X(d) + 0.16, 4.14, 4.28, -0.13, 0.13))));
}

/** The power car into `coach`'s builder, model x = X(d). */
function drawPowerCar(coach: Coach, X: (d: number) => number, gangway: boolean): void {
  const m = coach.m;
  // the passenger door (the third) opens into the car's cabin
  const powerDoor = POWER_DOORS[2]!;
  const leaves = [1, -1].map((s) => leafOf(s, powerDoor.d[0], powerDoor.d[1], 1.25, Math.min(3.12, POWER.S(powerDoor.d[0]) - 0.04)));
  m.scope("body", () => {
    drawBody(m, POWER, X, leaves);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const f: Side = { m, p: POWER, X, s };
        // the cab door and the baggage double door stay shut; the passenger door (the third) opens
        m.scope("doors", () => POWER_DOORS.forEach((dr, i) => m.scope(`door ${i + 1}`, () => sideDoor(f, dr.d[0], dr.d[1], 1.25, Math.min(3.12, POWER.S(dr.d[0]) - 0.04), dr.glass, i === 2))));
        m.scope("windows", () => POWER_WINDOWS.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => sideWindow(f, a, b, WIN[0], WIN[1], b - a > 0.8))));
        m.scope("portholes", () =>
          PORTHOLES.forEach((d, i) =>
            m.scope(`porthole ${i + 1}`, () => {
              m.sweep("chrome", "z", ngon(16, 0.27, 0, X(d), PORTHOLE_Y), s * (W - 0.03), ngon(16, 0.27, 0, X(d), PORTHOLE_Y), s * (W + 0.015));
              m.sweep("glass", "z", ngon(16, 0.21, 0, X(d), PORTHOLE_Y), s * (W + 0.01), ngon(16, 0.21, 0, X(d), PORTHOLE_Y), s * (W + 0.022));
            }),
          ),
        );
        m.scope("louvres", () => LOUVRES.forEach(([a, b, y0, y1], i) => m.scope(`louvre ${i + 1}`, () => louvre(f, a, b, y0, y1))));
        m.scope("running number", () => sideLettering(f, VT1816_NUMBER, 3.6, 1.5, 0.12));
      });
    drawCarCabin(m, POWER, X, NOSE_D, VT1816_POWER_BODY - CABIN_INSET, leaves, glassOf(POWER_WINDOWS.map((d) => ({ d }))));
  });
  m.scope("nose", () => drawNose(m, X));
  m.scope("cockpit", () => drawCockpit(m, X));
  m.scope("rear end", () => innerEnd(m, X, -1, VT1816_POWER_BODY, gangway));
  m.scope("roof equipment", () => roofVents(m, X, [14.6, 16.6, 18.6, 20.6, 22.6]));
  m.scope("running gear", () => {
    const [a1, a2, a3, a4] = VT1816_AXLES.powerCar as [number, number, number, number];
    const xm = X((a1 + a2) / 2);
    m.scope("motor bogie", () =>
      m.bogie(() => {
        unitBogie(coach, xm, { wb: a2 - a1, r: WHEEL_R, top: 0.72, overhang: 0.35 });
        // the 12 KVD 18/21 engine and the Voith transmission hang in the bogie
        m.scope("engine", () => block(m, "engine", xm - 0.9, xm + 0.75, 0.42, 0.72, -0.62, 0.62));
        m.scope("transmission", () => block(m, "motor", xm - 1.45, xm - 0.95, 0.3, 0.68, -0.4, 0.4));
      }),
    );
    m.scope("trailing bogie", () => unitBogie(coach, X((a3 + a4) / 2), { wb: a4 - a3, r: WHEEL_R, top: 0.96 }));
    m.scope("underframe", () => {
      block(m, "equipment", X(17.6), X(13.0), 0.42, 0.73, -1.05, 1.05);
      block(m, "equipment", X(10.4), X(8.6), 0.48, 0.73, -0.9, 0.9);
    });
  });
}

/** An intermediate car into `coach`'s builder, model x = X(d). */
function drawMiddleCar(coach: Coach, kind: Exclude<Vt1816Car, "powerCar">, X: (d: number) => number, gangway: boolean): void {
  const m = coach.m;
  const lay = MIDDLE[kind];
  const leaves = [1, -1].flatMap((s) => lay.doors.filter((w) => onSide(w, s)).map(({ d: [a, b] }) => leafOf(s, a, b, 0.7, 3.15)));
  m.scope("body", () => {
    drawBody(m, TRAILER, X, leaves);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const f: Side = { m, p: TRAILER, X, s };
        m.scope("doors", () => lay.doors.filter((w) => onSide(w, s)).forEach(({ d: [a, b] }, i) => m.scope(`door ${i + 1}`, () => sideDoor(f, a, b, 0.7, 3.15, [[a + 0.15, b - 0.15]]))));
        m.scope("windows", () => lay.windows.filter((w) => onSide(w, s)).forEach(({ d: [a, b] }, i) => m.scope(`window ${i + 1}`, () => sideWindow(f, a, b, WIN[0], WIN[1], b - a > 0.8))));
        m.scope("lettering", () => sideLettering(f, "DR", L / 2, 1.5, 0.16));
      });
    drawCarCabin(m, TRAILER, X, CABIN_INSET, L - CABIN_INSET, leaves, glassOf(lay.windows));
  });
  m.scope("front end", () => innerEnd(m, X, 1, 0, gangway));
  m.scope("rear end", () => innerEnd(m, X, -1, L, gangway));
  m.scope("roof equipment", () => {
    roofVents(m, X, [2.4, 5.3, 8.2, 11.1, 14.0, 16.9, 19.8]);
    (lay.roofBoxes ?? []).forEach(([a, b, hw], i) => m.scope(`roof box ${i + 1}`, () => {
      const [x0, x1] = [X(a), X(b)].sort((p, q) => p - q) as [number, number];
      block(m, "vent", x0, x1, 4.1, 4.32, -hw, hw);
    }));
  });
  m.scope("running gear", () => {
    const ax = VT1816_AXLES.trailer;
    for (const [i, k] of [0, 2].entries()) m.scope(`bogie ${i + 1}`, () => unitBogie(coach, X((ax[k]! + ax[k + 1]!) / 2), { wb: ax[k + 1]! - ax[k]!, r: WHEEL_R, top: 0.96 }));
    m.scope("apron equipment", () => block(m, "equipment", X(15.5), X(7.3), 0.4, 0.47, -0.95, 0.95));
  });
}

const bodyOf = (car: Vt1816Car): Vt1816Body => (car === "powerCar" ? "powerCar" : "trailer");
const bodyLength = (car: Vt1816Car): number => (car === "powerCar" ? VT1816_POWER_BODY : VT1816_TRAILER_BODY);

function drawCar(coach: Coach, car: Vt1816Car, X: (d: number) => number, gangway: boolean): void {
  if (car === "powerCar") drawPowerCar(coach, X, gangway);
  else drawMiddleCar(coach, car, X, gangway);
}

/**
 * The cars of a train of `n`, front first: a power car at each end, the VMd
 * behind the leading one and the VMc ahead of the trailing one, VMe cars between
 * them (a three-car train has the VMc alone). Each with its span lo..hi over the
 * coupling planes, the whole train centred on x = 0, and whether it is turned.
 */
export function vt1816Train(n: number): Array<{ car: Vt1816Car; lo: number; hi: number; turned: boolean }> {
  const k = n - 2;
  const middle: Vt1816Car[] = k === 0 ? [] : k === 1 ? ["dining"] : ["firstClass", ...Array.from({ length: k - 2 }, (): Vt1816Car => "trailer"), "dining"];
  const cars: Vt1816Car[] = ["powerCar", ...middle, "powerCar"];
  const total = cars.reduce((t, c) => t + VT1816_LENGTH[bodyOf(c)], 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - VT1816_LENGTH[bodyOf(car)];
    const out = { car, lo, hi, turned: i === cars.length - 1 && n > 1 };
    hi = lo;
    return out;
  });
}

/** The bellows' cross-section between two cars (z, y). */
const BELLOWS: Array<[number, number]> = [[-0.72, 1.2], [0.72, 1.2], [0.72, 3.2], [0.6, 3.32], [-0.6, 3.32], [-0.72, 3.2]];
/** The bend a joint allows between two cars. */
const MAX_BEND_DEG = 12;

/**
 * The whole train as one articulated vehicle: each car a section (articulate,
 * tramKit.ts) hinged at the coupling plane ahead of it, riding on its own two
 * bogies, a bellows joint over the 0.70 m between two bodies.
 */
function train(n: number): MeshBuilder {
  const cars = vt1816Train(n);
  const coach = new Coach(PALETTE, 0);
  const m = coach.m;
  const sections = cars.map((c, k) => {
    const cx = (c.lo + c.hi) / 2;
    const len = bodyLength(c.car);
    // a car facing +X: its +X end wall 0.35 m behind its front coupling plane; the
    // trailing power car is laid out facing +X about its centre, then turned
    const X = (d: number) => cx + len / 2 - d;
    return {
      x0: c.lo + VT1816_GAP,
      x1: c.hi - VT1816_GAP,
      draw: () => m.scope(`car ${k + 1}`, () => (c.turned ? m.turned(cx, () => drawCar(coach, c.car, X, false)) : drawCar(coach, c.car, X, false))),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, cars.slice(0, -1).map((c) => c.lo));
  return m;
}

export function vt1816(params?: ParamValues): MeshBuilder {
  const p = resolveParams(VT1816_PARAMS, params);
  const unit = p.unit as Vt1816Unit;
  if (unit === "train") return train(Number(p.cars));
  const coach = new Coach(PALETTE, 0);
  const len = bodyLength(unit);
  drawCar(coach, unit, (d) => len / 2 - d, true);
  return coach.m;
}

// --- distant view ---------------------------------------------------------------------------

/** One car of the distant model: its body and parts, laid out by X(d) (facing +X), turned about cx when `turned`. */
function carLod(car: Vt1816Car, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined, inside: { front: boolean; rear: boolean }): { body: UnitBody; parts: LodPart[] } {
  const power = car === "powerCar";
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const dir = turned ? -1 : 1;
  const side: LodBand[] = [[0.71, 1.05, "skirt"], [1.05, 1.33, "black"], [1.33, 1.95, "red"], [1.95, 3.2, "cream"], [3.2, 4.2, power ? "cream" : "roof"]];
  const hw: Array<readonly [number, number]> = [[0.71, 1.35], [0.79, W], [3.2, W], [3.55, 1.38], [3.85, 1.2], [4.05, 0.9], [4.2, 0.3]];
  const flat = (d: number, hidden: boolean) => ({ tip: [[0.71, X(d)]] as Array<readonly [number, number]>, ...(hidden ? { hidden: true } : {}) });
  const glass = power
    ? [...POWER_WINDOWS, ...POWER_DOORS.flatMap((dr) => dr.glass)]
    : [...MIDDLE[car].windows.map((w) => w.d)];
  const boxes = glass.map(([a, b]) => ({ x0: X(b), x1: X(a), y0: WIN[0], y1: WIN[1] }));
  let body: UnitBody = {
    y0: 0.71,
    hw,
    side,
    roof: power ? "cream" : "roof",
    front: power
      ? {
          tip: [[0.71, X(0)], [2.24, X(0)], [2.38, X(0.2)], [2.64, X(0.6)], [3.02, X(1.9)], [3.46, X(3.55)], [3.85, X(6.0)], [4.2, X(HOOD_END)]],
          setback: [[0.71, 1.2], [2.24, 1.2], [3.02, 1.6], [4.2, 1.6]],
          paint: [[0.71, 1.05, "skirt"], [1.05, 1.33, "black"], [1.33, 2.2, "red"], [2.2, 4.2, "cream"]],
        }
      : flat(0, inside.front),
    rear: flat(bodyLength(car), inside.rear),
    windows: sideGlass(boxes, 0.6),
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const ax = VT1816_AXLES[bodyOf(car)];
  const bogies = [0, 2].map((k) => [T(X((ax[k]! + ax[k + 1]!) / 2)), (ax[k + 1]! - ax[k]!) / 2 + WHEEL_R + 0.2, ...(section !== undefined ? [section] : [])] as const);
  const inSection = (part: LodPart): LodPart => (section !== undefined ? { ...part, section } : part);
  const xs = T(X(3.62)) + dir * 0.01;
  const parts: LodPart[] = [
    // in a long train an intermediate car's bogies give way first: from afar the skirts hide them
    ...bogieParts(bogies as unknown as ReadonlyArray<readonly [number, number, number?]>, 0.71).map((part) => (!power && section !== undefined ? { ...part, optional: 5 } : part)),
    ...(power
      ? [
          inSection(roofPart("red", T(X(7.5)), T(X(3.62)), 0.95, 0.75, 3.35, 4.25)),
          inSection({ draw: (m: MeshBuilder) => m.scope("windscreen", () => lodPolygon(m, LOD_GLASS, [[xs, 3.55, 0.65], [xs, 3.55, -0.65], [xs, 4.1, -0.62], [xs, 4.1, 0.62]], [dir, 0, 0])) }),
        ]
      : []),
  ];
  return { body, parts };
}

/**
 * The VT 18.16 for distant views (lodUnits.ts): the body's section with the
 * floor stripes as one dark band, the red and the cream; the power car's nose
 * rising into the hood, the red cockpit with its windscreen; the window band
 * and the bogies. The train keeps the full model's sections and a plain bellows
 * over each joint, 100 triangles a car, 300 at most.
 */
export function vt1816Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(VT1816_PARAMS, params);
  const unit = p.unit as Vt1816Unit;
  if (unit !== "train") {
    const len = bodyLength(unit);
    const { body, parts } = carLod(unit, (d) => len / 2 - d, 0, false, undefined, { front: false, rear: false });
    return fitUnit({ palette: PALETTE, bodies: [body], parts }, 100);
  }
  const n = Number(p.cars);
  const cars = vt1816Train(n);
  const built = cars.map((c, k) => {
    const cx = (c.lo + c.hi) / 2;
    const len = bodyLength(c.car);
    // the inner ends stay under the bellows; the turned car's own rear faces the car ahead
    return carLod(c.car, (d) => cx + len / 2 - d, cx, c.turned, k, c.turned ? { front: false, rear: k > 0 } : { front: k > 0, rear: k < n - 1 });
  });
  const sections: LodSections = {
    pivots: cars.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [cars[i - 1]!.lo, COUPLER_Y, 0])),
    joints: cars.slice(0, -1).map((c, i) => ({
      sections: [i, i + 1] as [number, number],
      front: c.lo + VT1816_GAP,
      rear: cars[i + 1]!.hi - VT1816_GAP,
      profile: [[-0.72, 1.2], [0.72, 1.2], [0.72, 3.32], [-0.72, 3.32]] as Array<[number, number]>,
    })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({ palette: PALETTE, bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(300, 100 * n));
}

// --- what the game needs ----------------------------------------------------------------------

/**
 * The four-car set's 214.4 t empty split by estimate: 66 t a power car (engine,
 * transmission and fuel), 42.4 t the VMc dining car with its kitchen, 40 t the
 * VMd and the VMe; 736 kW (1000 PS) a power car; 160 km/h, 140 km/h from six cars
 * (the published limit of the six-car trains).
 */
const CAR_WEIGHT: Record<Vt1816Car, number> = { powerCar: 66, dining: 42.4, firstClass: 40, trailer: 40 };

const VT1816_GAME: GameProperties = {
  weight: CAR_WEIGHT.powerCar,
  power: 736,
  maxspeed: 160,
  accel: null,
  variants: [
    ...(["dining", "firstClass", "trailer"] as const).map((unit) => ({ params: { unit }, weight: CAR_WEIGHT[unit], power: 0 })),
    ...Array.from({ length: VT1816_MAX_CARS - VT1816_MIN_CARS + 1 }, (_, i) => {
      const n = i + VT1816_MIN_CARS;
      const weight = Math.round(vt1816Train(n).reduce((t, c) => t + CAR_WEIGHT[c.car], 0) * 10) / 10;
      // the default four cars are named by the unit alone
      const params: ParamValues = n === 4 ? { unit: "train" } : { cars: String(n), unit: "train" };
      return { params, weight, power: 2 * 736, maxspeed: n >= 6 ? 140 : 160 };
    }),
  ],
};

export const VT1816_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-dr-vt1816", game: VT1816_GAME, title: "DR VT 18.16 Delfin", build: vt1816, buildLod: vt1816Lod, lodTriangles: 300, params: VT1816_PARAMS, catalog: DMU_CATALOG, references: "dr-vt1816" },
];
