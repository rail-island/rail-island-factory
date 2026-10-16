// The CD 470, the Studenka double-deck electric unit of 1991 (two prototype
// sets, in service until 2009): one design `veh-cd-470` whose `unit` picks the
// single-deck 470 motor car with its cab (default) or the 070 double-deck
// trailer, both in the dark green and yellow of the first set, 470 001/002.
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
import { Coach, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { blockX, EMU_CATALOG, enumParam, pantograph, slopePanel, tractionNumber } from "./emuParts.ts";
import { bOf, CLASSIC_PALETTE, emuBogie, endBuffers, frontNumber, gangwayEnd, lens, louvre, sb, toB, type CarFrame, type PxBox } from "./emuClassicKit.ts";

/** The published 132 m of the five-car set over the XML's 5 x 24.5 m. */
export const K_X = 132 / (5 * 24.5);

export type Unit470 = "motorCar" | "trailer";

export const CD470_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car 470 (cab, pantographs)",
    trailer: "Double-deck trailer 070",
  }),
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

/** A car of the CD 470 set. */
export function cd470(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(CD470_PARAMS, params).unit as Unit470;
  return unit === "motorCar" ? motorCar() : trailer();
}

function motorCar(): MeshBuilder {
  const car = CARS.motorCar;
  const F = car.F;
  const c = new Coach(PALETTE, (car.front + car.rear) / 2);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const X = (x: number) => c.X(bOf(F, x));
  const body: Volume = {
    name: "body",
    section: SECTION_470,
    plan: toB(F, [[1.7, 1.5], [24.3, 1.5]]),
    bottom: toB(F, [[1.7, 0.9], [5.4, 0.9], [6.0, 0.3], [18.4, 0.3], [19.0, 0.9], [24.3, 0.9]]),
    bands: [[0.3, 0.9, "skirt"], [0.9, 2.7, "green"], [2.7, 3.3, "yellow"], [3.3, 4.1, "darkGreen"]],
    endPaint: "green",
  };
  // the cab section (source x 0.2 .. 1.7, back to the cab door as z_both paints it) in the front's bands (x_inc): the yellow band at 1.4 .. 2.1 m
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
          ([[54, 29, 59, 40], [81, 36, 94, 47], [99, 36, 112, 47], [116, 36, 129, 47], [133, 36, 146, 47], [150, 36, 163, 47], [186, 29, 194, 38], [197, 29, 210, 38]] as PxBox[]).forEach((b, i) =>
            m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 })),
          ),
        );
        m.scope("doors", () =>
          ([[[64, 34, 79, 56], [[65, 37, 70, 49], [73, 37, 78, 49]]], [[165, 34, 180, 56], [[166, 37, 171, 49], [174, 37, 179, 49]]]] as Array<[PxBox, PxBox[]]>).forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => {
              c.door(body, s, box(d), "doorRed", { seam: 0.03 });
              for (const g of glass) c.window(body, s, box(g), { fw: 0.04 });
            }),
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
  m.scope("rear end", () => gangwayEnd(c, body, { wall: 0, e: -1, face: 0.2 * K_X, door: { x0: -0.6, x1: 0.6, y0: 1.4, y1: 3.3 }, doorPaint: "green", couplerY: 1.0, buffers: { y: 1.0, head: "rect" } }));
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

function trailer(): MeshBuilder {
  const car = CARS.trailer;
  const F = car.F;
  const c = new Coach(PALETTE, (car.front + car.rear) / 2);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const body: Volume = {
    name: "body",
    section: SECTION_070,
    plan: toB(F, [[0.2, 1.5], [24.3, 1.5]]),
    bottom: toB(F, [[0.2, 0.9], [5.0, 0.9], [5.6, 0.3], [18.9, 0.3], [19.5, 0.9], [24.3, 0.9]]),
    bands: [[0.3, 0.9, "skirt"], [0.9, 2.7, "green"], [2.7, 3.3, "yellow"], [3.3, 4.2, "darkGreen"], [4.2, 4.7, "roofGrey"]],
    endPaint: "green",
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("upper windows", () => {
          for (let i = 0; i < 9; i++) m.scope(`window ${i + 1}`, () => c.window(body, s, box([56 + 15 * i, 8, 69 + 15 * i, 17]), { fw: 0.07 }));
        });
        m.scope("lower windows", () => {
          for (let i = 0; i < 7; i++) m.scope(`window ${i + 1}`, () => c.window(body, s, box([71 + 15 * i, 26, 84 + 15 * i, 37]), { fw: 0.07 }));
        });
        m.scope("end windows", () =>
          ([[8, 19, 21, 30], [24, 19, 37, 30], [40, 19, 47, 30], [198, 19, 205, 30], [208, 19, 221, 30], [224, 19, 237, 30]] as PxBox[]).forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.07 }))),
        );
        m.scope("doors", () =>
          ([[[54, 23, 69, 45], [[55, 27, 60, 38], [63, 27, 68, 38]]], [[176, 23, 191, 45], [[177, 27, 182, 38], [185, 27, 190, 38]]]] as Array<[PxBox, PxBox[]]>).forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => {
              c.door(body, s, box(d), "doorRed", { seam: 0.03 });
              for (const g of glass) c.window(body, s, box(g), { fw: 0.04 });
            }),
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
      gangwayEnd(c, body, { wall: e > 0 ? bOf(F, 0.2) : 0, e, face: 0.2 * K_X, door: { x0: -0.6, x1: 0.6, y0: 1.4, y1: 3.3 }, doorPaint: "green", couplerY: 1.0, buffers: { y: 1.0, head: "rect" } }),
    );
  m.scope("running gear", () => {
    [3.05, 21.45].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.4, 0.45, 0.88, false)));
  });
  return m;
}

/** A car's source mapping and the body x of its centre, for the comparison. */
export const frame470 = (unit: Unit470): { F: CarFrame; centre: number } => ({ F: CARS[unit].F, centre: (CARS[unit].front + CARS[unit].rear) / 2 });

/** Every car, for the tests. */
export const CARS_470: readonly Unit470[] = ["motorCar", "trailer"];

export const EMU470_DESIGNS: ProceduralDesign[] = [{ id: "proc-vehicle-cd-470", title: "CD 470", build: cd470, params: CD470_PARAMS, catalog: EMU_CATALOG, references: "cd-470" }];
