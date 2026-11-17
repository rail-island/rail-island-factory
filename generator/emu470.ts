// The CD 470, the Studenka double-deck electric unit of 1991 (two prototype
// sets, in service until 2009): one design `veh-cd-470` whose `unit` picks the
// single-deck 470 motor car with its cab (default), the 070 double-deck
// trailer, both in the dark green and yellow of the first set, 470 001/002, or
// the full train (`cars` 2 .. 8: a motor car at each end, the rear one turned,
// trailers between; `cd470Train`).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-470/native
// (db/train/emu/cd 470/cd_470 and cd_070): the XML `alongx` sections, the
// `alongz` elevations (the cab's lower face leaning forward under the raked
// windscreen, the low floor between the bogies, the motor car's raised roof at
// its inner end where it meets the double-deck trailer) and windows, doors,
// louvres and paint laid from native pixel boxes, 0.1 m a pixel. The length is
// scaled to the published 132 m of the five-car set (26.4 m a car against the
// XML's 24.5 m); heights and widths are the XML's. Every car faces +X: the
// motor car's cab is its +X end. See docs/models/czech-emus-classic.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { articulate } from "./tramKit.ts";
import type { LodPart, LodSections } from "./lodKit.ts";
import { shiftBody, turnBody, type UnitBody } from "./lodUnits.ts";
import type { GameProperties } from "./design.ts";
import { Coach, type Box, type Opening, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, pantographParts, roofPart, shifted, sideGlass } from "./lodUnits.ts";
import { blockX, EMU_CATALOG, enumParam, pantograph, slopePanel, tractionNumber } from "./emuParts.ts";
import { bOf, CLASSIC_PALETTE, emuBogie, endBuffers, frontNumber, gangwayEnd, lens, louvre, sb, toB, type CarFrame, type PxBox } from "./emuClassicKit.ts";

/** The published 132 m of the five-car set over the XML's 5 x 24.5 m. */
export const K_X = 132 / (5 * 24.5);

export type Unit470 = "motorCar" | "trailer";

/** The full train's vehicle counts: two motor cars and 0 .. 3 trailers, up to the prototype's five cars; four by default. */
export const CD470_MIN_CARS = 2;
export const CD470_MAX_CARS = 5;
export const CD470_DEFAULT_CARS = 4;

export const CD470_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailer: "Trailer",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(Array.from({ length: CD470_MAX_CARS - CD470_MIN_CARS + 1 }, (_, i) => [String(i + CD470_MIN_CARS), `${i + CD470_MIN_CARS} cars`]))),
    default: String(CD470_DEFAULT_CARS),
    when: { name: "unit", values: ["train"] },
  },
];

/** The green set 470 001/002 (photographed at Ostrava-Svinov in 1991) and its first trailer. */
export const NUMBERS_470: Record<Unit470, string> = { motorCar: tractionNumber("470", "001"), trailer: tractionNumber("070", "001") };

const PALETTE: Record<string, MaterialSpec> = {
  ...CLASSIC_PALETTE,
  // the native colours of z_both and x_inc
  green: { color: "#3f603f", roughness: 0.5 },
  darkGreen: { color: "#2f502f", roughness: 0.6 },
  yellow: { color: "#f0cf4f", roughness: 0.5 },
  louvreGreen: { color: "#407840", roughness: 0.6 },
  skirt: { color: "#a0a790", roughness: 0.7 },
  roofGrey: { color: "#707070", roughness: 0.7 },
  doorRed: { color: "#af200f", roughness: 0.5 },
  frame: { color: "#909f9f", roughness: 0.45 },
  logoRed: { color: "#d01010", roughness: 0.5 },
};

interface Car {
  F: CarFrame;
  rear: number;
  front: number;
}
const CARS: Record<Unit470, Car> = {
  // buffers at source x 0 (the cab) and 24.5 (the inner end); walls at 0.2 .. 24.3
  motorCar: { F: { srcEnd: 24.3, kx: K_X, H: 6 }, rear: -0.2 * K_X, front: 24.3 * K_X },
  trailer: { F: { srcEnd: 24.3, kx: K_X, H: 5 }, rear: -0.2 * K_X, front: 24.3 * K_X },
};
export const length470 = (unit: Unit470): number => CARS[unit].front - CARS[unit].rear;

/** The motor car's section (XML alongx): walls to 3.3 m, the roof's curve to 4.1 m. */
const SECTION_470: Pt[] = [[-1.3, 0.3], [1.3, 0.3], [1.5, 0.5], [1.5, 3.3], [1.4, 3.8], [1.2, 4.0], [0.9, 4.1], [-0.9, 4.1], [-1.2, 4.0], [-1.4, 3.8], [-1.5, 3.3], [-1.5, 0.5]];
/** The trailer's double-deck section: the upper wall leaning in from 3.8 m to the 4.7 m roof. */
const SECTION_070: Pt[] = [[-1.3, 0.3], [1.3, 0.3], [1.5, 0.5], [1.5, 3.3], [1.4, 3.8], [0.8, 4.6], [0.6, 4.7], [-0.6, 4.7], [-0.8, 4.6], [-1.4, 3.8], [-1.5, 3.3], [-1.5, 0.5]];

/** The cab (XML alongz): the windscreen raked from source x 0.2 at 1.8 m to 0.5 at 3.6 m; the face below leans forward from 0.4 at 0.9 m. */
const upperAt = (y: number): Pt => [0.2 + (0.3 * (y - 1.8)) / 1.8, y];
const lowerAt = (y: number): Pt => [0.4 - (0.2 * (y - 0.9)) / 0.9, y];
const CAB_PLAN: Pt[] = [[0.2, 1.2], [0.3, 1.4], [0.6, 1.5], [1.7, 1.5]];

/** A car of the CD 470 set, or the full train. */
export function cd470(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD470_PARAMS, params);
  if (p.unit === "train") return train470(Number(p.cars));
  const unit = p.unit as Unit470;
  return unit === "motorCar" ? motorCar() : trailer();
}

/** The motor car's volumes: the body, the cab above the windscreen's foot and the face below it. */
function motorVolumes(): { body: Volume; upper: Volume; lower: Volume } {
  const F = CARS.motorCar.F;
  const body: Volume = {
    name: "body",
    section: SECTION_470,
    plan: toB(F, [[1.7, 1.5], [24.3, 1.5]]),
    bottom: toB(F, [[1.7, 0.9], [5.4, 0.9], [6.0, 0.3], [18.4, 0.3], [19.0, 0.9], [24.3, 0.9]]),
    bands: [[0.3, 0.9, "skirt"], [0.9, 2.7, "green"], [2.7, 3.3, "yellow"], [3.3, 4.1, "darkGreen"]],
    endPaint: "green",
  };
  const upper: Volume = {
    name: "cab",
    section: SECTION_470,
    plan: toB(F, CAB_PLAN),
    top: toB(F, [upperAt(1.8), upperAt(2.1), upperAt(3.6), [0.7, 4.0], [1.0, 4.1], [1.7, 4.1]]),
    bottom: toB(F, [[0.2, 1.8], [1.7, 1.8]]),
    bands: [[1.8, 2.1, "yellow"], [2.1, 4.1, "green"]],
  };
  const lower: Volume = {
    name: "lower front",
    section: SECTION_470,
    plan: toB(F, CAB_PLAN),
    top: toB(F, [[0.2, 1.8], [1.7, 1.8]]),
    bottom: toB(F, [lowerAt(1.8), lowerAt(1.4), lowerAt(0.9), [1.7, 0.9]]),
    bands: [[0.9, 1.4, "green"], [1.4, 1.8, "yellow"]],
  };
  return { body, upper, lower };
}

/** The trailer's double-deck body. */
function trailerVolume(): Volume {
  const F = CARS.trailer.F;
  return {
    name: "body",
    section: SECTION_070,
    plan: toB(F, [[0.2, 1.5], [24.3, 1.5]]),
    bottom: toB(F, [[0.2, 0.9], [5.0, 0.9], [5.6, 0.3], [18.9, 0.3], [19.5, 0.9], [24.3, 0.9]]),
    bands: [[0.3, 0.9, "skirt"], [0.9, 2.7, "green"], [2.7, 3.3, "yellow"], [3.3, 4.2, "darkGreen"], [4.2, 4.7, "roofGrey"]],
    endPaint: "green",
  };
}

/** The motor car's side windows, and the trailer's upper, lower and end windows (native boxes). */
const WINDOWS_470: PxBox[] = [[54, 29, 59, 40], [81, 36, 94, 47], [99, 36, 112, 47], [116, 36, 129, 47], [133, 36, 146, 47], [150, 36, 163, 47], [186, 29, 194, 38], [197, 29, 210, 38]];
const UPPER_070: PxBox[] = Array.from({ length: 9 }, (_, i): PxBox => [56 + 15 * i, 8, 69 + 15 * i, 17]);
const LOWER_070: PxBox[] = Array.from({ length: 7 }, (_, i): PxBox => [71 + 15 * i, 26, 84 + 15 * i, 37]);
const END_070: PxBox[] = [[8, 19, 21, 30], [24, 19, 37, 30], [40, 19, 47, 30], [198, 19, 205, 30], [208, 19, 221, 30], [224, 19, 237, 30]];

/** The passenger doors of the motor car and of the trailer: the door box and its leaves' windows (native boxes). */
const DOORS_470: Array<[PxBox, PxBox[]]> = [[[64, 34, 79, 56], [[65, 37, 70, 49], [73, 37, 78, 49]]], [[165, 34, 180, 56], [[166, 37, 171, 49], [174, 37, 179, 49]]]];
const DOORS_070: Array<[PxBox, PxBox[]]> = [[[54, 23, 69, 45], [[55, 27, 60, 38], [63, 27, 68, 38]]], [[176, 23, 191, 45], [[177, 27, 182, 38], [185, 27, 190, 38]]]];

/** The doorways of `doors` on both sides (`Volume.openings`), so an open door shows the interior (doors.ts). */
function doorways(c: Coach, doors: Array<[PxBox, PxBox[]]>, box: (b: PxBox) => Box): Opening[] {
  return [1, -1].flatMap((s) => doors.map(([d]) => c.doorOpening(s, box(d), 0.03)));
}

/** A passenger door: two sliding plug leaves, a window riding on each (doors.ts). */
function passengerDoor(c: Coach, body: Volume, s: number, b: Box, glass: Box[]): void {
  c.door(body, s, b, "doorRed", {
    seam: 0.03,
    opens: { kind: "plug", leaves: 2 },
    leafWork: (clip) => {
      for (const g of glass) {
        const w = clip(g);
        if (w) c.window(body, s, w, { fw: 0.04 });
      }
    },
  });
}

/** The motor car, into its own builder or into `into` (a car of the full train: no gangway frame at its inner end). */
function motorCar(into?: MeshBuilder): MeshBuilder {
  const car = CARS.motorCar;
  const F = car.F;
  const c = new Coach(PALETTE, (car.front + car.rear) / 2, into);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const X = (x: number) => c.X(bOf(F, x));
  const { body, upper, lower } = motorVolumes();
  body.openings = doorways(c, DOORS_470, box);
  // the cab section (source x 0.2 .. 1.7, back to the cab door as z_both paints it) in the front's bands (x_inc): the yellow band at 1.4 .. 2.1 m
  m.scope("body", () => {
    c.volume(body);
    m.scope("cab", () => c.volume(upper));
    m.scope("lower front", () => c.volume(lower));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab window", () => c.window(upper, s, box([5, 29, 9, 34]), { fw: 0.05 }));
        m.scope("cab door", () => {
          c.door(upper, s, box([10, 28, 17, 50.6]), "green", { seam: 0.03 }); // its foot kept off the body's underside
          c.window(upper, s, box([11, 29, 16, 34]), { fw: 0.05 });
        });
        m.scope("louvres", () => {
          m.scope("louvre 1", () => louvre(c, body, s, box([38, 29, 51, 47]), "louvreGreen", 9));
          m.scope("louvre 2", () => louvre(c, body, s, box([214, 29, 222, 47]), "louvreGreen", 9));
        });
        m.scope("windows", () =>
          WINDOWS_470.forEach((b, i) =>
            m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 })),
          ),
        );
        m.scope("doors", () =>
          DOORS_470.forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => passengerDoor(c, body, s, box(d), glass.map(box))),
          ),
        );
        m.scope("running number", () => {
          const b = box([110, 49, 140, 51]);
          c.numeral(body, s, NUMBERS_470.motorCar, (b.x0 + b.x1) / 2, b.y0, 0.16, 0.006, "lettering");
        });
      });
  });
  m.scope("cab", () => {
    const plane = { x0: X(0.2), y0: 1.8, x1: X(0.5), y1: 3.6 };
    const xAt = (y: number) => plane.x0 + ((y - plane.y0) / (plane.y1 - plane.y0)) * (plane.x1 - plane.x0);
    const lowAt = (y: number) => X(lowerAt(y)[0]);
    m.scope("windscreen", () => {
      // x_inc columns 3..27, rows 24..35: the frame, two panes
      slopePanel(m, "frame", 1, plane, -1.2, 1.2, 2.5, 3.6 - 0.005, 0.006, 0.01);
      for (const [z0, z1] of [[-1.1, -0.1], [0.1, 1.1]]) slopePanel(m, "glass", 1, plane, z0, z1, 2.6, 3.5, 0.014, 0.006);
    });
    m.scope("top lamp", () => {
      const roofPlane = { x0: X(0.5), y0: 3.6, x1: X(0.7), y1: 4.0 };
      slopePanel(m, "lampWhite", 1, roofPlane, -0.2, 0.2, 3.66, 3.86, 0.008, 0.01);
    });
    m.scope("lamps", () => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right" : "left", () => {
          lens(m, "lampWhite", xAt(1.92), s * 1.2, 1.92, 0.09, 0.06);
          lens(m, "lampRed", lowAt(1.6), s * 1.2, 1.6, 0.09, 0.06);
        });
    });
    m.scope("running number", () => frontNumber(m, "letteringDark", NUMBERS_470.motorCar, -0.5, 1.95, 0.09, xAt));
    // the plough plates (XML `front`, x 0.4 .. 0.5, 0.2 .. 0.7 m), parted for the coupling
    m.scope("plough", () => {
      for (const s of [1, -1]) blockX(m, "underframe", X(0.5), X(0.42), 0.25, 0.62, ...(s > 0 ? [0.2, 1.45] : [-1.45, -0.2]) as [number, number]);
    });
    m.scope("buffers", () => endBuffers(c, 1, bOf(F, 0.45), bOf(F, 0), 1.0, "rect"));
  });
  m.scope("rear end", () => gangwayEnd(c, body, { wall: 0, e: -1, face: 0.2 * K_X, door: { x0: -0.6, x1: 0.6, y0: 1.4, y1: 3.3 }, doorPaint: "green", couplerY: 1.0, buffers: { y: 1.0, head: "rect" }, ...(into ? { frame: false } : {}) }));
  m.scope("roof equipment", () => {
    // the inner end rises to the trailer's double-deck roof, to 4.7 m: from source x 21.4 as z_both draws it (the XML clips it from 22.6)
    m.scope("raised roof", () => {
      const ring: Array<[number, number]> = [[-1.17, 4.1], [1.17, 4.1], [0.8, 4.6], [0.6, 4.7], [-0.6, 4.7], [-0.8, 4.6]];
      const ramp: Array<[number, number]> = [[-1.17, 4.1], [1.17, 4.1], [0.85, 4.16], [0.6, 4.2], [-0.6, 4.2], [-0.85, 4.16]];
      m.sweep("roofGrey", "x", ring, X(24.27), ring, X(21.7));
      m.sweep("roofGrey", "x", ring, X(21.7), ramp, X(21.4));
    });
    m.scope("roof plate", () => blockX(m, "roofGrey", X(21.5), X(1.8), 4.08, 4.16, -0.85, 0.85));
    m.scope("roof box", () => blockX(m, "roofGrey", X(7.6), X(5.8), 4.16, 4.4, -0.4, 0.4));
    m.scope("pantographs", () => {
      // where z_both draws them (the XML pant1 inlines stand at their ends, 3.7 and 21.2 m): over the cab bogie folded, over the inner one raised; the knee toward the cab
      m.scope("pantograph 1", () => pantograph(m, { x: X(2.8), roof: 4.16, hinge: -1, raised: false }));
      m.scope("pantograph 2", () => pantograph(m, { x: X(20.4), roof: 4.16, hinge: -1, raised: true }));
    });
  });
  m.scope("running gear", () => {
    [3.55, 20.95].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.4, 0.5, 0.88, true)));
  });
  return m;
}

/** The trailer, into its own builder or into `into` (a car of the full train: no gangway frames). */
function trailer(into?: MeshBuilder): MeshBuilder {
  const car = CARS.trailer;
  const F = car.F;
  const c = new Coach(PALETTE, (car.front + car.rear) / 2, into);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const body = trailerVolume();
  body.openings = doorways(c, DOORS_070, box);
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("upper windows", () => {
          UPPER_070.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 })));
        });
        m.scope("lower windows", () => {
          LOWER_070.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 })));
        });
        m.scope("end windows", () =>
          END_070.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 }))),
        );
        m.scope("doors", () =>
          DOORS_070.forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => passengerDoor(c, body, s, box(d), glass.map(box))),
          ),
        );
        m.scope("emblem", () => c.sidePanel(body, "logoRed", s, box([75, 20, 81, 22]), 0.006, 0.003));
        m.scope("running number", () => {
          const b = box([110, 38, 140, 40]);
          c.numeral(body, s, NUMBERS_470.trailer, (b.x0 + b.x1) / 2, b.y0, 0.16, 0.006, "lettering");
        });
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () =>
      gangwayEnd(c, body, { wall: e > 0 ? bOf(F, 0.2) : 0, e, face: 0.2 * K_X, door: { x0: -0.6, x1: 0.6, y0: 1.4, y1: 3.3 }, doorPaint: "green", couplerY: 1.0, buffers: { y: 1.0, head: "rect" }, ...(into ? { frame: false } : {}) }),
    );
  m.scope("running gear", () => {
    [3.05, 21.45].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.4, 0.45, 0.88, false)));
  });
  return m;
}

/**
 * A car of the 470 for distant views (lodUnits.ts): the motor car's raked cab
 * with its windscreen and paint, the trailer's double-deck section with both
 * window rows, the bands, the bogies, the motor car's raised roof over its
 * inner end and its raised rear pantograph.
 */
export function cd470Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD470_PARAMS, params);
  if (p.unit === "train") return train470Lod(Number(p.cars));
  const { body, parts } = lodCar(p.unit as Unit470);
  return fitUnit({ palette: PALETTE, bodies: [body], parts }, 100);
}

/**
 * A car's distant body (lone-car coordinates) and its parts; in the train
 * (`slot`, `section`) the parts are placed by `T` from lone-car x to the
 * train's, only the raised pantograph is kept and the inner ends are hidden.
 */
function lodCar(unit: Unit470, train?: { T: (x: number) => number; section: number }): { body: UnitBody; parts: LodPart[] } {
  const car = CARS[unit];
  const F = car.F;
  const centre = (car.front + car.rear) / 2;
  const T = train?.T ?? ((x: number) => x);
  const sec = train ? [train.section] as const : ([] as const);
  const X = (x: number) => bOf(F, x) - centre;
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const glass = (boxes: PxBox[], rows = 1) => sideGlass(shifted(boxes.map((b) => sb(F, b)), centre), 0.6, rows);
  if (unit === "trailer") {
    const body = coachBody([place(trailerVolume())], { y0: 0.9, windows: glass([...UPPER_070, ...LOWER_070, ...END_070], 2) });
    return { body, parts: bogieParts([[T(X(3.05)), 1.85, ...sec], [T(X(21.45)), 1.85, ...sec]], 0.9) };
  }
  const { body, upper, lower } = motorVolumes();
  const shell = coachBody([place(body), place(upper), place(lower)], {
    y0: 0.9, main: 0, windows: glass(WINDOWS_470), frontWindows: [{ u: [-1.2, 1.2], y: [2.5, 3.6], mat: LOD_GLASS }],
  });
  return {
    body: shell,
    parts: [
      ...bogieParts([[T(X(3.55)), 1.9, ...sec], [T(X(20.95)), 1.9, ...sec]], 0.9),
      // the raised roof over the inner end: given up before a colour band
      { ...roofPart("roofGrey", T(X(24.27)), T(X(21.7)), 1.17, 0.6, 4.1, 4.7, train?.section), optional: 45 },
      roofPart("roofGrey", T(X(7.6)), T(X(5.8)), 0.4, 0.4, 4.1, 4.4, train?.section),
      // the train keeps each motor car's raised pantograph alone (the first of the list is drawn raised)
      ...(train ? pantographParts([T(X(20.4))], 4.1, 4.3, { section: train.section }) : pantographParts([X(20.4), X(2.8)], 4.1, 4.3)),
    ],
  };
}

// --- the full train ---------------------------------------------------------------------------

/** One vehicle of the train: its span lo..hi over its coupling planes (model x) and whether it is turned. */
export interface Slot470 {
  car: Unit470;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The vehicles of a train of `n` (2 .. 8), front first: a motor car at each
 * end, the rear one turned (its cab facing -X), and n - 2 trailers between
 * them (the prototype's five-car set 470 + 3 x 070 + 470). Each with its span
 * over its coupling planes, the train centred on x = 0.
 */
export function cd470Train(n: number): Slot470[] {
  if (!Number.isInteger(n) || n < CD470_MIN_CARS || n > CD470_MAX_CARS) throw new Error(`CD 470: no ${n}-car train`);
  const cars: Unit470[] = ["motorCar", ...Array.from({ length: n - 2 }, (): Unit470 => "trailer"), "motorCar"];
  let hi = cars.reduce((t, car) => t + length470(car), 0) / 2;
  return cars.map((car, i) => {
    const lo = hi - length470(car);
    const out = { car, lo, hi, turned: i === n - 1 };
    hi = lo;
    return out;
  });
}

/** The bellows over a gap between two cars' end walls (round the end door), and the hinges' height (the buffers'). */
const BELLOWS_470: Array<[number, number]> = [[-0.78, 1.26], [0.78, 1.26], [0.78, 3.44], [-0.78, 3.44]];
const COUPLER_Y = 1.0;
const BELLOWS_PAINT: MaterialSpec = { color: "#26272a", roughness: 0.95 };
const MAX_BEND_DEG = 10;

/** A slot's mapping from lone-car x to train x, and its end walls in train x [low, high]. */
function placement(slot: Slot470): { T: (x: number) => number; walls: [number, number] } {
  const cx = (slot.lo + slot.hi) / 2;
  const car = CARS[slot.car];
  const centre = (car.front + car.rear) / 2;
  const T = (x: number) => (slot.turned ? cx - x : cx + x);
  // the inner end wall at body 0; the trailer's other wall at source 0.2, the motor car's cab out to its coupling plane
  const front = slot.car === "trailer" ? bOf(car.F, 0.2) : car.front;
  const [a, b] = [T(0 - centre), T(front - centre)];
  return { T, walls: [Math.min(a, b), Math.max(a, b)] };
}

function train470(n: number): MeshBuilder {
  const slots = cd470Train(n);
  const m = new Coach({ ...PALETTE, bellows: BELLOWS_PAINT }, 0).m;
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const { walls } = placement(slot);
    return {
      x0: walls[0],
      x1: walls[1],
      draw: () =>
        m.scope(`car ${k + 1}`, () => {
          const draw = () => m.moved(([x, y, z]) => [x + cx, y, z], () => (slot.car === "motorCar" ? motorCar(m) : trailer(m)));
          if (slot.turned) m.turned(cx, draw);
          else draw();
        }),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS_470, folds: 3, depth: 0.03 }, MAX_BEND_DEG, slots.slice(0, -1).map((slot) => slot.lo));
  return m;
}

/** The distant model's budget: 100 triangles a car, 500 for the longest trains. */
export const CD470_LOD = 500;

function train470Lod(n: number): MeshBuilder {
  const slots = cd470Train(n);
  const built = slots.map((slot, k) => {
    const { T } = placement(slot);
    const { body, parts } = lodCar(slot.car, { T, section: k });
    const cx = (slot.lo + slot.hi) / 2;
    // the inner ends stay under the bellows
    const inner: UnitBody = { ...body, rear: { ...body.rear, hidden: true }, ...(slot.car === "trailer" ? { front: { ...body.front, hidden: true } } : {}), section: k };
    return { body: slot.turned ? turnBody(shiftBody(inner, cx), cx) : shiftBody(inner, cx), parts };
  });
  const walls = slots.map((slot) => placement(slot).walls);
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((_, i) => ({ sections: [i, i + 1] as [number, number], front: walls[i]![0], rear: walls[i + 1]![1], profile: BELLOWS_470 })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({ palette: PALETTE, bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(CD470_LOD, 100 * n));
}

/** A car's source mapping and the body x of its centre, for the comparison. */
export const frame470 = (unit: Unit470): { F: CarFrame; centre: number } => ({ F: CARS[unit].F, centre: (CARS[unit].front + CARS[unit].rear) / 2 });

/** Every car, for the tests. */
export const CARS_470: readonly Unit470[] = ["motorCar", "trailer"];

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
/** A car's weight (t) and power (kW). */
const WEIGHT_470: Record<Unit470, number> = { motorCar: 70, trailer: 55 };
const POWER_470: Record<Unit470, number> = { motorCar: 1000, trailer: 0 };

const CD_470_GAME: GameProperties = {
  weight: WEIGHT_470.motorCar,
  power: POWER_470.motorCar,
  maxspeed: 120,
  accel: null,
  variants: [
    { params: { unit: "trailer" }, weight: WEIGHT_470.trailer, power: POWER_470.trailer },
    // every train length: its cars' weights and the motor cars' power added up; the default length named by the unit alone
    ...Array.from({ length: CD470_MAX_CARS - CD470_MIN_CARS + 1 }, (_, i) => {
      const n = i + CD470_MIN_CARS;
      const slots = cd470Train(n);
      return {
        params: { unit: "train", ...(n === CD470_DEFAULT_CARS ? {} : { cars: String(n) }) },
        weight: slots.reduce((t, s) => t + WEIGHT_470[s.car], 0),
        power: slots.reduce((t, s) => t + POWER_470[s.car], 0),
      };
    }),
  ],
};

export const EMU470_DESIGNS: ProceduralDesign[] = [{ id: "proc-vehicle-cd-470", game: CD_470_GAME, title: "CD 470", build: cd470, buildLod: cd470Lod, lodTriangles: CD470_LOD, params: CD470_PARAMS, catalog: EMU_CATALOG, references: "cd-470" }];
