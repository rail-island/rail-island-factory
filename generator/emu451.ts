// The CD 451 (CSD EM 475.1), the Studenka suburban electric unit of 1964 known
// as the "zabotlam" (frog mouth) for its raked, lamp-podded nose: one design
// `veh-cd-451` whose `unit` picks the 451 motor car with its cab (default) or
// the 051 intermediate trailer.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-451/native
// (db/train/emu/cd 451/cd_451 and cd_051): the XML `alongx` sections, the
// `alongz` elevations (the raked nose over the lamp pods, the low floor between
// the bogies, the roof's ventilator housing) and windows, doors, louvres and
// paint laid from native pixel boxes, 0.1 m a pixel. The length is scaled to
// the published 95.29 m of the four-car set; heights and widths are the XML's.
// Every car faces +X: the motor car's cab is its +X end. See
// docs/models/czech-emus-classic.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { diamond } from "./czElectricKit.ts";
import { centreCoupler, EMU_CATALOG, enumParam, slopePanel, tractionNumber } from "./emuParts.ts";
import { block, side } from "./vehicleParts.ts";
import { bOf, CLASSIC_PALETTE, emuBogie, frontEmblem, frontNumber, gangwayEnd, lens, louvre, polyB, sb, sideNumber, toB, type CarFrame, type PxBox } from "./emuClassicKit.ts";

/** The published 95.29 m of the set (two motor cars, two trailers) over the XML's 98.8 m. */
export const K_X = 95.29 / 98.8;

export type Unit451 = "motorCar" | "trailer";

export const CD451_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car 451 (cab, pantograph)",
    trailer: "Trailer 051",
  }),
];

/** The set the running numbers name: 451 032 (photographed at Ricany in 2007) and its trailer. */
export const NUMBERS_451: Record<Unit451, string> = { motorCar: tractionNumber("451", "032"), trailer: tractionNumber("051", "032") };

const PALETTE: Record<string, MaterialSpec> = {
  ...CLASSIC_PALETTE,
  // the native BMP colours (em475_z_both, z_both)
  blue: { color: "#184abd", roughness: 0.5 },
  light: { color: "#c6c6c6", roughness: 0.5 },
  roof: { color: "#848484", roughness: 0.7 },
  roofTop: { color: "#b9bbbb", roughness: 0.7 },
  white: { color: "#f2f2f2", roughness: 0.5 },
  doorRed: { color: "#e3120b", roughness: 0.5 },
  frame: { color: "#ececec", roughness: 0.45 },
  apron: { color: "#26282a", roughness: 0.8 },
};

/** One car's mapping and its coupling faces (body metres). */
interface Car {
  F: CarFrame;
  rear: number;
  front: number;
}

const BELLOWS = 0.15;
const CARS: Record<Unit451, Car> = {
  // the nose tip at source x 0.5, the coupler face 0.55 m ahead of it; the inner wall at 24.8
  motorCar: { F: { srcEnd: 24.8, kx: K_X, H: 6 }, rear: -BELLOWS * K_X, front: K_X * 24.85 },
  trailer: { F: { srcEnd: 24.3, kx: K_X, H: 5 }, rear: -BELLOWS * K_X, front: K_X * (24.1 + BELLOWS) },
};

/** The length of a car over its coupling faces. */
export const length451 = (unit: Unit451): number => CARS[unit].front - CARS[unit].rear;

/** The motor car's section (XML alongx): vertical walls to 3.3 m, the roof's curve to 3.8 m. */
const SECTION_451: Pt[] = [[-1.5, 0.4], [1.5, 0.4], [1.5, 3.3], [1.4, 3.5], [1.2, 3.7], [0.8, 3.8], [-0.8, 3.8], [-1.2, 3.7], [-1.4, 3.5], [-1.5, 3.3]];
/** The trailer's: 3.2 m walls and a flat roof at 3.9 m. */
const SECTION_051: Pt[] = [[-1.5, 0.2], [1.5, 0.2], [1.5, 3.2], [1.3, 3.6], [0.8, 3.9], [-0.8, 3.9], [-1.3, 3.6], [-1.5, 3.2]];

/** The nose's face (XML alongz): from the tip at 1.2 m (source x 0.5) back to 3.3 m at x 1.1. */
const noseAt = (y: number): Pt => [0.5 + (0.6 * (y - 1.2)) / 2.1, y];

/** A car of the CD 451 set. */
export function cd451(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(CD451_PARAMS, params).unit as Unit451;
  return unit === "motorCar" ? motorCar() : trailer();
}

function motorCar(): MeshBuilder {
  const car = CARS.motorCar;
  const F = car.F;
  const c = new Coach(PALETTE, (car.front + car.rear) / 2);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const X = (x: number) => c.X(bOf(F, x));
  // the nose (source x 0.5 .. 2.4): rounded plan, the raked face; its bands from x_inc
  const nose: Volume = {
    name: "nose",
    section: SECTION_451,
    plan: toB(F, [[0.5, 0.4], [0.6, 0.75], [0.8, 1.1], [1.1, 1.3], [2.0, 1.5], [2.4, 1.5]]),
    // the face carries a station at every band edge, so each band's clamped ring stays on it
    top: toB(F, [noseAt(1.2), noseAt(2.2), noseAt(2.5), noseAt(3.25), [1.1, 3.3], [1.1 + 0.2 / 3, 3.4], [1.3, 3.6], [1.6, 3.8], [2.4, 3.9]]),
    bottom: toB(F, [[0.5, 1.2], [0.6, 0.8], [2.4, 0.8]]),
    bands: [[0.4, 1.2, "blue"], [1.2, 2.2, "light"], [2.2, 2.5, "blue"], [2.5, 3.25, "glass"], [3.25, 3.4, "blue"], [3.4, 3.8, "roof"]],
  };
  const body: Volume = {
    name: "body",
    section: SECTION_451,
    plan: toB(F, [[2.4, 1.5], [24.8, 1.5]]),
    // the low floor between the bogies (XML 6.6 .. 20.4 m at 0.4 m)
    bottom: toB(F, [[2.4, 0.8], [6.2, 0.8], [6.6, 0.4], [20.4, 0.4], [20.8, 0.8], [24.8, 0.8]]),
    bands: [[0.4, 1.2, "blue"], [1.2, 2.2, "light"], [2.2, 3.3, "blue"], [3.3, 3.72, "roof"], [3.72, 3.8, "roofTop"]],
    endPaint: "blue",
  };
  m.scope("body", () => {
    m.scope("nose", () => c.volume(nose));
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab windows", () => c.sidePanel(nose, "cabBlack", s, box([16, 28, 18, 35]), 0.01, 0.02));
        // the band under the windows: grey from the first door to the inner end
        m.scope("paint lines", () => c.sidePanel(body, "light", s, box([66, 33, 248, 38]), 0.004, 0.003));
        m.scope("louvres", () => ([[26, 28, 34, 36], [35, 28, 43, 36], [44, 28, 52, 36]] as PxBox[]).forEach((b, i) => m.scope(`louvre ${i + 1}`, () => louvre(c, body, s, box(b), "roof", 6))));
        m.scope("machine room door", () => c.door(body, s, box([35, 36, 52, 47]), "light", { seam: 0.03 }));
        m.scope("windows", () => {
          const ws: Array<[PxBox, string]> = [[[55, 28, 62, 36], "cab end window"], ...([[93, 36, 101, 46], [105, 36, 117, 46], [121, 36, 133, 46], [137, 36, 149, 46], [153, 36, 165, 46], [169, 36, 177, 46], [207, 29, 213, 39], [216, 29, 228, 39]] as PxBox[]).map((b, i): [PxBox, string] => [b, `window ${i + 1}`])];
          for (const [b, name] of ws) m.scope(name, () => c.window(body, s, box(b), { fw: 0.08 }));
        });
        m.scope("doors", () => {
          ([[[70, 31, 87, 55], [[72, 37, 77, 46], [80, 37, 85, 46]]], [[183, 31, 200, 55], [[185, 37, 190, 46], [193, 37, 198, 46]]]] as Array<[PxBox, PxBox[]]>).forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => {
              c.door(body, s, box(d), "doorRed", { seam: 0.03 });
              for (const g of glass) c.window(body, s, box(g), { fw: 0.05 });
            }),
          );
          m.scope("luggage door", () => c.door(body, s, box([232, 28, 245, 49]), "light", { seam: 0.03 }));
        });
        m.scope("running number", () => {
          const b = box([30, 49, 58, 51]);
          sideNumber(c, body, s, NUMBERS_451.motorCar, (b.x0 + b.x1) / 2, b.y0, 0.18, "lettering");
        });
      });
  });
  m.scope("cab", () => {
    // the face's plane at z = 0 (the plan rounds it back toward the sides)
    const plane = { x0: X(0.5), y0: 1.2, x1: X(1.1), y1: 3.3 };
    const xAt = (y: number) => plane.x0 + ((y - plane.y0) / (plane.y1 - plane.y0)) * (plane.x1 - plane.x0);
    m.scope("windscreen pillar", () => slopePanel(m, "cabBlack", 1, plane, -0.05, 0.05, 2.5, 3.25, 0.012, 0.01));
    m.scope("emblem", () => frontEmblem(m, "blue", 1.72, 0.3, xAt));
    m.scope("running number", () => frontNumber(m, "letteringDark", NUMBERS_451.motorCar, 0, 1.36, 0.12, xAt));
    // the lamp pods (XML `light`): z 0.95 .. 1.5, 1.0 .. 1.8 m, from source x 0.7 back into the nose
    m.scope("lamp pods", () => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right" : "left", () => {
          const ring: Array<[number, number]> = [[1.25, 1.0], [1.35, 1.05], [1.4, 1.1], [1.5, 1.7], [1.4, 1.8], [1.05, 1.8], [1.0, 1.7], [0.95, 1.2], [1.0, 1.1], [1.1, 1.0]].map(([z, y]) => [s * z, y] as [number, number]);
          m.sweep("light", "x", ring, X(2.0), ring, X(0.7));
          lens(m, "lampWhite", X(0.7), s * 1.22, 1.5, 0.15);
          lens(m, "lampRed", X(0.7), s * 1.22, 1.15, 0.06, 0.03, 8);
        });
    });
    // the roof lamp housing (XML `light`, x 1.1 .. 2.4) and its lamp
    m.scope("top lamp", () => {
      c.sideSweep("roof", polyB(F, [[1.1, 3.3], [2.35, 3.3], [2.35, 3.9], [1.6, 3.9], [1.1, 3.75]]), -0.45, 0.45);
      lens(m, "lampWhite", X(1.1), 0, 3.55, 0.12);
    });
    // the apron under the nose (XML base 0.6 .. 2.6, 0.5 .. 0.8 m), black as x_inc paints it
    m.scope("apron", () => c.sideSweep("apron", polyB(F, [[0.6, 0.8], [2.6, 0.8], [2.2, 0.5], [0.9, 0.5]]), -1.25, 1.25));
    m.scope("coupler", () => centreCoupler(m, 1, X(1.2), c.X(car.front), 0.8));
  });
  m.scope("rear end", () => gangwayEnd(c, body, { wall: 0, e: -1, face: BELLOWS * K_X, door: { x0: -0.45, x1: 0.45, y0: 1.4, y1: 3.3 }, doorPaint: "blue", couplerY: 0.75, markerY: 1.7 }));
  m.scope("roof equipment", () => {
    // the ventilator housing over the passenger saloon (XML roof, 9.3 .. 18.1 m, to 4.2 m)
    m.scope("ventilator", () => {
      const ring = (top: number): Array<[number, number]> => [[-0.8, 3.7], [0.8, 3.7], [0.8, top - 0.15], [0.6, top], [-0.6, top], [-0.8, top - 0.15]];
      m.sweep("roofTop", "x", ring(3.9), X(18.1), ring(4.2), X(17.8));
      m.sweep("roofTop", "x", ring(4.2), X(17.8), ring(4.2), X(9.6));
      m.sweep("roofTop", "x", ring(4.2), X(9.6), ring(3.9), X(9.3));
      // its louvres (em475_z_both row 19)
      m.scope("louvres", () => {
        for (const u of [104, 117, 129, 141, 153, 165]) for (const s of [-1, 1]) block(m, "louvreSlat", X((u + 3) / 10), X(u / 10), 3.95, 4.03, ...side(s, 0.79, 0.815));
      });
    });
    m.scope("pantographs", () => m.scope("pantograph", () => diamond(m, { xc: X(22.64), roofY: 3.8, baseY: 4.1, raised: true, raisedTop: 5.75 })));
  });
  m.scope("running gear", () => {
    [4.4, 22.6].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.5, 0.5, 0.78, true)));
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
    section: SECTION_051,
    plan: toB(F, [[0.2, 1.5], [24.3, 1.5]]),
    // the low floor between the bogies (XML 4.6 .. 19.9 m at 0.2 m)
    bottom: toB(F, [[0.2, 0.6], [4.2, 0.6], [4.6, 0.2], [19.9, 0.2], [20.3, 0.6], [24.3, 0.6]]),
    bands: [[0.2, 1.0, "blue"], [1.0, 2.5, "light"], [2.5, 3.1, "blue"], [3.1, 3.7, "roof"], [3.7, 3.9, "roofTop"]],
    endPaint: "blue",
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("end windows", () => ([[6, 21, 18, 31], [22, 21, 34, 31], [37, 21, 44, 31], [202, 21, 208, 31], [211, 21, 223, 31], [227, 21, 239, 31]] as PxBox[]).forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.08, ...(b[2] - b[0] > 8 ? { sash: 2.47 } : {}) }))));
        m.scope("windows", () => ([[74, 28, 83, 38], [89, 28, 101, 38], [107, 28, 119, 38], [126, 28, 138, 38], [144, 28, 156, 38], [162, 28, 171, 38]] as PxBox[]).forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.08, sash: 1.77 }))));
        m.scope("doors", () =>
          ([[[50, 23, 67, 47], [[52, 29, 57, 38], [60, 29, 65, 38]]], [[178, 23, 195, 47], [[181, 29, 185, 38], [188, 29, 193, 38]]]] as Array<[PxBox, PxBox[]]>).forEach(([d, glass], i) =>
            m.scope(`door ${i + 1}`, () => {
              c.door(body, s, box(d), "doorRed", { seam: 0.03 });
              for (const g of glass) c.window(body, s, box(g), { fw: 0.05 });
            }),
          ),
        );
        m.scope("running number", () => {
          const b: Box = box([110, 45, 140, 47]);
          sideNumber(c, body, s, NUMBERS_451.trailer, (b.x0 + b.x1) / 2, b.y0, 0.18, "lettering");
        });
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => gangwayEnd(c, body, { wall: e > 0 ? bOf(F, 0.2) : 0, e, face: BELLOWS * K_X, door: { x0: -0.45, x1: 0.45, y0: 1.2, y1: 2.8 }, doorPaint: "blue", couplerY: 0.7, markerY: 1.35 }));
  m.scope("running gear", () => {
    [2.4, 22.1].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.4, 0.46, 0.58, false)));
  });
  return m;
}

/** Every car, for the tests. */
export const CARS_451: readonly Unit451[] = ["motorCar", "trailer"];

export const EMU451_DESIGNS: ProceduralDesign[] = [{ id: "veh-cd-451", title: "CD 451 Zabotlam", build: cd451, params: CD451_PARAMS, catalog: EMU_CATALOG, references: "cd-451" }];

export { CARS as CARS_451_FRAMES };
