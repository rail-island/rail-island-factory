// The CD 451 (CSD EM 475.1), the Studenka suburban electric unit of 1964 known
// as the "zabotlam" (frog mouth) for its raked, lamp-podded nose: one design
// `veh-cd-451` whose `unit` picks the 451 motor car with its cab (default) or
// the 051 intermediate trailer, or the full train (`train`, `cars` 2 .. 8, four by
// default: the 451's basic unit of a motor car at each end and two trailers; a
// longer train is two units coupled cab to cab; cd451Train, emuClassicTrain.ts).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-451/native
// (db/train/emu/cd 451/cd_451 and cd_051): the XML `alongx` sections, the
// `alongz` elevations (the raked nose over the lamp pods, the low floor between
// the bogies, the roof's ventilator housing) and windows, doors, louvres and
// paint laid from native pixel boxes, 0.1 m a pixel. The length is scaled to
// the published 95.29 m of the four-car set; heights and widths are the XML's.
// Every car faces +X: the motor car's cab is its +X end. See
// docs/models/czech-emus-classic.md.
//
// The `livery` picks the paint: the CD blue and grey of the vlakosimdb BMPs
// (`cd`, the default) or CD's current blue (`cdBlue`, the Najbrt scheme, 451 056
// read from photographs).

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { diamond } from "./czElectricKit.ts";
import { articulateTrain, classicTrain, coupledCabs, lodBudget, sectionSpans, TRAIN_PALETTE, type ClassicSlot } from "./emuClassicTrain.ts";
import { centreCoupler, EMU_CATALOG, enumParam, slopePanel, tractionNumber } from "./emuParts.ts";
import { block, side } from "./vehicleParts.ts";
import { bogieParts, coachBody, fitUnit, pantographParts, roofPart, shiftBody, sideGlass, turnBody, underPart, type UnitBody } from "./lodUnits.ts";
import type { LodPart, LodSections } from "./lodKit.ts";
import { bOf, CLASSIC_PALETTE, emuBogie, frontEmblem, frontNumber, gangwayEnd, lens, louvre, polyB, sb, sideNumber, toB, type CarFrame, type PxBox } from "./emuClassicKit.ts";

/** The published 95.29 m of the set (two motor cars, two trailers) over the XML's 98.8 m. */
export const K_X = 95.29 / 98.8;

export type Unit451 = "motorCar" | "trailer";
export type Livery451 = "cd" | "cdBlue";

/** The full train's lengths: two motor cars back to back up to eight cars; four (the basic unit) by default. */
export const CD451_MIN_CARS = 2;
export const CD451_MAX_CARS = 8;
/** The basic unit: motor car, two trailers, motor car; a longer train is two units. */
export const CD451_UNIT_CARS = 4;

export const CD451_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailer: "Trailer",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(Array.from({ length: CD451_MAX_CARS - CD451_MIN_CARS + 1 }, (_, i) => [String(i + CD451_MIN_CARS), `${i + CD451_MIN_CARS} cars`]))),
    default: String(CD451_UNIT_CARS),
    when: { name: "unit", values: ["train"] },
  },
  enumParam("livery", "Livery", {
    cd: "CD 451",
    cdBlue: "CD 451 blue",
  }),
];

/** The set the running numbers name: 451 032 (photographed at Ricany in 2007) and its trailer. */
export const NUMBERS_451: Record<Unit451, string> = { motorCar: tractionNumber("451", "032"), trailer: tractionNumber("051", "032") };

/**
 * A livery: its colours over the base palette, the nose's and the bodies' bands
 * (the nose's edges are the face's stations), the paint laid over the saloon of
 * each car (the native panel under the windows, or the blue's window band), the
 * doors' and ends' paint, the front emblem's and the numbers' paint and the serial.
 */
interface Paint451 {
  palette?: Record<string, MaterialSpec>;
  nose: Array<[number, number, string]>;
  motorBody: Array<[number, number, string]>;
  trailerBody: Array<[number, number, string]>;
  /** Panels over the motor car's passenger part, [y0, y1, mat], from the first door to the inner end. */
  motorSaloon: Array<[number, number, string]>;
  /** Panels over the trailer's end compartments (the higher window band over the bogies), [y0, y1, mat]. */
  trailerEnds: Array<[number, number, string]>;
  door: string;
  machineDoor: string;
  luggageDoor: string;
  endPaint: string;
  endDoor: string;
  emblem: string;
  number: string;
  frontNumber: string;
  /** The lamp pods. */
  pods: string;
  serial: string;
}

const PAINTS_451: Record<Livery451, Paint451> = {
  cd: {
    nose: [[0.4, 1.2, "blue"], [1.2, 2.2, "light"], [2.2, 2.5, "blue"], [2.5, 3.25, "glass"], [3.25, 3.4, "blue"], [3.4, 3.8, "roof"]],
    motorBody: [[0.4, 1.2, "blue"], [1.2, 2.2, "light"], [2.2, 3.3, "blue"], [3.3, 3.72, "roof"], [3.72, 3.8, "roofTop"]],
    trailerBody: [[0.2, 1.0, "blue"], [1.0, 2.5, "light"], [2.5, 3.1, "blue"], [3.1, 3.7, "roof"], [3.7, 3.9, "roofTop"]],
    // the band under the windows: grey from the first door to the inner end
    motorSaloon: [[2.2, 2.7, "light"]],
    trailerEnds: [],
    door: "doorRed",
    machineDoor: "light",
    luggageDoor: "light",
    endPaint: "blue",
    endDoor: "blue",
    emblem: "blue",
    number: "lettering",
    frontNumber: "letteringDark",
    pods: "light",
    serial: "032",
  },
  // CD's current blue (the Najbrt scheme), read from photo-451-056-cd-blue-masarykovo-2014.jpg: the
  // nose white under a navy band, navy round the windscreen; behind it white under a navy line
  // and light blue to the eave over the machine room; over the saloons a light blue window band
  // between a navy line under the windows and white above; navy doors
  cdBlue: {
    palette: {
      navy: { color: "#1f3a7a", roughness: 0.5 },
      sky: { color: "#3c97de", roughness: 0.5 },
      white: { color: "#eef0f2", roughness: 0.5 },
    },
    nose: [[0.4, 1.2, "white"], [1.2, 2.2, "white"], [2.2, 2.5, "navy"], [2.5, 3.25, "glass"], [3.25, 3.4, "navy"], [3.4, 3.8, "roof"]],
    motorBody: [[0.4, 2.2, "white"], [2.2, 2.35, "navy"], [2.35, 3.3, "sky"], [3.3, 3.72, "roof"], [3.72, 3.8, "roofTop"]],
    trailerBody: [[0.2, 0.97, "white"], [0.97, 1.12, "navy"], [1.12, 2.32, "sky"], [2.32, 3.1, "white"], [3.1, 3.7, "roof"], [3.7, 3.9, "roofTop"]],
    motorSaloon: [[1.22, 1.37, "navy"], [1.37, 2.52, "sky"], [2.52, 3.3, "white"]],
    trailerEnds: [[0.97, 1.78, "white"], [1.78, 1.93, "navy"], [1.93, 3.0, "sky"]],
    door: "navy",
    machineDoor: "bands",
    luggageDoor: "navy",
    endPaint: "white",
    endDoor: "navy",
    emblem: "navy",
    number: "letteringDark",
    frontNumber: "letteringDark",
    pods: "white",
    serial: "056",
  },
};

/** The running number a car carries in a livery: `451 032-7`, its trailer `051 032-1`. */
export function number451(livery: Livery451, unit: Unit451): string {
  return tractionNumber(unit === "motorCar" ? "451" : "051", PAINTS_451[livery].serial);
}

const paletteOf = (paint: Paint451): Record<string, MaterialSpec> => (paint.palette ? { ...PALETTE, ...paint.palette } : PALETTE);

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
  const p = resolveParams(CD451_PARAMS, params);
  const livery = p.livery as Livery451;
  if (p.unit === "train") return train451(livery, Number(p.cars));
  return p.unit === "motorCar" ? motorCar(livery) : trailer(livery);
}

/**
 * The cars of a train of `n`, front first (emuClassicTrain.ts): up to four cars
 * one unit - a motor car leading, its trailers, a motor car turned (two cars: the
 * motor cars back to back); five to eight cars two units coupled cab to cab, the
 * longer one in front (5: 3 + 2, 6: 3 + 3, 7: 4 + 3, 8: 4 + 4), as the 451s ran
 * in multiple. Each car's span over its coupling planes, the train centred on x = 0.
 */
export function cd451Train(n: number): ClassicSlot[] {
  if (n < CD451_MIN_CARS || n > CD451_MAX_CARS) throw new Error(`a CD 451 train has ${CD451_MIN_CARS} to ${CD451_MAX_CARS} cars, not ${n}`);
  return classicTrain(n, CD451_UNIT_CARS, length451);
}

/** The bellows between two cars' gangways (z, y), and the short joint over two coupled cabs' couplers. */
const TRAIN_BELLOWS: Array<[number, number]> = [[-0.7, 1.1], [0.7, 1.1], [0.7, 3.3], [-0.7, 3.3]];
const COUPLER_JOINT: Array<[number, number]> = [[-0.15, 0.75], [0.15, 0.75], [0.15, 1.05], [-0.15, 1.05]];
/** How far a coupled cab's section stops short of its coupling plane (the coupler joint's half length). */
const CAB_JOINT = 0.15;
const HINGE_Y = 0.85;
const MAX_BEND_DEG = 10;

/**
 * The whole train as one articulated vehicle (emuClassicTrain.ts): each car a
 * section hinged at the coupling plane ahead of it, on its own two bogies, drawn
 * as the lone car is (without its gangway frames) and moved to its place, the
 * rear motor car of a unit turned; a bellows over each gangway, a coupler joint
 * between coupled cabs.
 */
function train451(livery: Livery451, n: number): MeshBuilder {
  const slots = cd451Train(n);
  const m = new Coach({ ...paletteOf(PAINTS_451[livery]), ...TRAIN_PALETTE }, 0).m;
  const spans = sectionSpans(slots, BELLOWS * K_X, CAB_JOINT);
  const sections = slots.map((s, k) => {
    const cx = (s.lo + s.hi) / 2;
    const draw = () => m.moved(([x, y, z]) => [x + cx, y, z], () => (s.car === "motorCar" ? motorCar : trailer)(livery, m));
    return { x0: spans[k]![0], x1: spans[k]![1], draw: () => m.scope(`car ${k + 1}`, () => (s.turned ? m.turned(cx, draw) : draw())) };
  });
  articulateTrain(m, slots, sections, HINGE_Y, TRAIN_BELLOWS, COUPLER_JOINT, MAX_BEND_DEG);
  return m;
}

/** The side windows (native boxes): the motor car's saloon, the trailer's saloon and end compartments. */
const WINDOWS_451: PxBox[] = [[93, 36, 101, 46], [105, 36, 117, 46], [121, 36, 133, 46], [137, 36, 149, 46], [153, 36, 165, 46], [169, 36, 177, 46], [207, 29, 213, 39], [216, 29, 228, 39]];
const WINDOWS_051: PxBox[] = [[74, 28, 83, 38], [89, 28, 101, 38], [107, 28, 119, 38], [126, 28, 138, 38], [144, 28, 156, 38], [162, 28, 171, 38]];
const END_WINDOWS_051: PxBox[] = [[6, 21, 18, 31], [22, 21, 34, 31], [37, 21, 44, 31], [202, 21, 208, 31], [211, 21, 223, 31], [227, 21, 239, 31]];

/** The motor car's volumes: the nose and the body behind it. */
function motorVolumes(paint: Paint451): { nose: Volume; body: Volume } {
  const F = CARS.motorCar.F;
  // the nose (source x 0.5 .. 2.4): rounded plan, the raked face; its bands from x_inc
  const nose: Volume = {
    name: "nose",
    section: SECTION_451,
    plan: toB(F, [[0.5, 0.4], [0.6, 0.75], [0.8, 1.1], [1.1, 1.3], [2.0, 1.5], [2.4, 1.5]]),
    // the face carries a station at every band edge, so each band's clamped ring stays on it
    top: toB(F, [noseAt(1.2), noseAt(2.2), noseAt(2.5), noseAt(3.25), [1.1, 3.3], [1.1 + 0.2 / 3, 3.4], [1.3, 3.6], [1.6, 3.8], [2.4, 3.9]]),
    bottom: toB(F, [[0.5, 1.2], [0.6, 0.8], [2.4, 0.8]]),
    bands: paint.nose,
  };
  const body: Volume = {
    name: "body",
    section: SECTION_451,
    plan: toB(F, [[2.4, 1.5], [24.8, 1.5]]),
    // the low floor between the bogies (XML 6.6 .. 20.4 m at 0.4 m)
    bottom: toB(F, [[2.4, 0.8], [6.2, 0.8], [6.6, 0.4], [20.4, 0.4], [20.8, 0.8], [24.8, 0.8]]),
    bands: paint.motorBody,
    endPaint: paint.endPaint,
  };
  return { nose, body };
}

/**
 * A passenger door: two leaves swinging inward from both jambs through its doorway
 * (`Volume.openings`), a window riding on each (doors.ts).
 */
function passengerDoor(c: Coach, body: Volume, s: number, b: Box, glass: Box[], paint: string): void {
  c.door(body, s, b, paint, {
    seam: 0.03,
    opens: { kind: "swing", leaves: 2 },
    // the side drawing runs against x: draw the leaves from that end, so the
    // windows keep their order
    fromHigh: true,
    leafWork: (clip) => {
      for (const g of glass) {
        const w = clip(g);
        if (w) c.window(body, s, w, { fw: 0.05 });
      }
    },
  });
}

/** The motor car, centred between its coupling faces; into `train` (a train's builder) without its gangway frame. */
function motorCar(livery: Livery451, train?: MeshBuilder): MeshBuilder {
  const paint = PAINTS_451[livery];
  const number = number451(livery, "motorCar");
  const car = CARS.motorCar;
  const F = car.F;
  const c = new Coach(paletteOf(paint), (car.front + car.rear) / 2, train);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const X = (x: number) => c.X(bOf(F, x));
  const { nose, body } = motorVolumes(paint);
  const doors = [[[70, 31, 87, 55], [[72, 37, 77, 46], [80, 37, 85, 46]]], [[183, 31, 200, 55], [[185, 37, 190, 46], [193, 37, 198, 46]]]] as Array<[PxBox, PxBox[]]>;
  body.openings = [1, -1].flatMap((s) => doors.map(([d]) => c.doorOpening(s, box(d), 0.03)));
  m.scope("body", () => {
    m.scope("nose", () => c.volume(nose));
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab windows", () => c.sidePanel(nose, "cabBlack", s, box([16, 28, 18, 35]), 0.01, 0.02));
        // the saloon's paint from the first door to the inner end (the native grey band under the windows)
        m.scope("paint lines", () => {
          const b = box([66, 33, 248, 38]);
          for (const [y0, y1, mat] of paint.motorSaloon) c.sidePanel(body, mat, s, { ...b, y0, y1 }, 0.004, 0.003);
        });
        m.scope("louvres", () => ([[26, 28, 34, 36], [35, 28, 43, 36], [44, 28, 52, 36]] as PxBox[]).forEach((b, i) => m.scope(`louvre ${i + 1}`, () => louvre(c, body, s, box(b), "roof", 6))));
        m.scope("machine room door", () => c.door(body, s, box([35, 36, 52, 47]), paint.machineDoor, { seam: 0.03 }));
        m.scope("windows", () => {
          const ws: Array<[PxBox, string]> = [[[55, 28, 62, 36], "cab end window"], ...WINDOWS_451.map((b, i): [PxBox, string] => [b, `window ${i + 1}`])];
          for (const [b, name] of ws) m.scope(name, () => c.window(body, s, box(b), { fw: 0.08 }));
        });
        m.scope("doors", () => {
          doors.forEach(([d, glass], i) => m.scope(`door ${i + 1}`, () => passengerDoor(c, body, s, box(d), glass.map(box), paint.door)));
          m.scope("luggage door", () => c.door(body, s, box([232, 28, 245, 49]), paint.luggageDoor, { seam: 0.03 }));
        });
        m.scope("running number", () => {
          const b = box([30, 49, 58, 51]);
          sideNumber(c, body, s, number, (b.x0 + b.x1) / 2, b.y0, 0.18, paint.number);
        });
      });
  });
  m.scope("cab", () => {
    // the face's plane at z = 0 (the plan rounds it back toward the sides)
    const plane = { x0: X(0.5), y0: 1.2, x1: X(1.1), y1: 3.3 };
    const xAt = (y: number) => plane.x0 + ((y - plane.y0) / (plane.y1 - plane.y0)) * (plane.x1 - plane.x0);
    m.scope("windscreen pillar", () => slopePanel(m, "cabBlack", 1, plane, -0.05, 0.05, 2.5, 3.25, 0.012, 0.01));
    m.scope("emblem", () => frontEmblem(m, paint.emblem, 1.53, 0.33, xAt));
    m.scope("running number", () => frontNumber(m, paint.frontNumber, number, 0, 1.36, 0.12, xAt));
    // the lamp pods (XML `light`): z 0.95 .. 1.5, 1.0 .. 1.8 m, from source x 0.7 back into the nose
    m.scope("lamp pods", () => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right" : "left", () => {
          const ring: Array<[number, number]> = [[1.25, 1.0], [1.35, 1.05], [1.4, 1.1], [1.5, 1.7], [1.4, 1.8], [1.05, 1.8], [1.0, 1.7], [0.95, 1.2], [1.0, 1.1], [1.1, 1.0]].map(([z, y]) => [s * z, y] as [number, number]);
          m.sweep(paint.pods, "x", ring, X(2.0), ring, X(0.7));
          lens(m, "lampWhite", X(0.7), s * 1.22, 1.5, 0.15);
          lens(m, "lampRed", X(0.7), s * 1.22, 1.15, 0.06, 0.03, 8);
        });
    });
    // the roof lamp housing (XML `light`, x 1.1 .. 2.4) and its lamp
    m.scope("top lamp", () => {
      c.sideSweep("roof", polyB(F, [[1.1, 3.3], [2.35, 3.3], [2.35, 3.82], [1.5, 3.82], [1.1, 3.72]]), -0.45, 0.45);
      lens(m, "lampWhite", X(1.1), 0, 3.55, 0.12);
    });
    // the apron under the nose (XML base 0.6 .. 2.6, 0.5 .. 0.8 m), black as x_inc paints it
    m.scope("apron", () => c.sideSweep("apron", polyB(F, [[0.6, 0.8], [2.6, 0.8], [2.2, 0.5], [0.9, 0.5]]), -1.25, 1.25));
    m.scope("coupler", () => centreCoupler(m, 1, X(1.2), c.X(car.front), 0.9));
  });
  m.scope("rear end", () => gangwayEnd(c, body, { wall: 0, e: -1, face: BELLOWS * K_X, door: { x0: -0.55, x1: 0.55, y0: 1.5, y1: 3.4 }, doorPaint: paint.endDoor, couplerY: 0.75, markerY: 1.65, markerZ: 0.8, ...(train ? { frame: false } : {}) }));
  m.scope("roof equipment", () => {
    // the ventilator housing over the passenger saloon (XML roof, 9.3 .. 18.1 m, to 4.2 m)
    m.scope("ventilator", () => {
      const ring = (top: number): Array<[number, number]> => [[-0.8, 3.78], [0.8, 3.78], [0.8, Math.max(3.82, top - 0.15)], [0.6, top], [-0.6, top], [-0.8, Math.max(3.82, top - 0.15)]];
      m.sweep("roofTop", "x", ring(3.9), X(18.1), ring(4.2), X(17.8));
      m.sweep("roofTop", "x", ring(4.2), X(17.8), ring(4.2), X(9.6));
      m.sweep("roofTop", "x", ring(4.2), X(9.6), ring(3.9), X(9.3));
      // its louvres (em475_z_both row 19)
      m.scope("louvres", () => {
        for (const u of [104, 117, 129, 141, 153, 165]) for (const s of [-1, 1]) block(m, "louvreSlat", X((u + 3) / 10), X(u / 10), 3.95, 4.03, ...side(s, 0.79, 0.815));
      });
    });
    m.scope("pantographs", () => m.scope("pantograph", () => diamond(m, { xc: X(22.64), roofY: 3.8, baseY: 4.1, raised: true })));
  });
  m.scope("running gear", () => {
    [4.4, 22.6].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.5, 0.5, 0.78, true)));
  });
  return m;
}

/** The trailer's body. */
function trailerVolume(paint: Paint451): Volume {
  const F = CARS.trailer.F;
  return {
    name: "body",
    section: SECTION_051,
    plan: toB(F, [[0.2, 1.5], [24.3, 1.5]]),
    // the low floor between the bogies (XML 4.6 .. 19.9 m at 0.2 m)
    bottom: toB(F, [[0.2, 0.6], [4.2, 0.6], [4.6, 0.2], [19.9, 0.2], [20.3, 0.6], [24.3, 0.6]]),
    bands: paint.trailerBody,
    endPaint: paint.endPaint,
  };
}

/** The trailer, centred between its coupling faces; into `train` without its gangway frames. */
function trailer(livery: Livery451, train?: MeshBuilder): MeshBuilder {
  const paint = PAINTS_451[livery];
  const car = CARS.trailer;
  const F = car.F;
  const c = new Coach(paletteOf(paint), (car.front + car.rear) / 2, train);
  const m = c.m;
  const box = (b: PxBox) => sb(F, b);
  const body = trailerVolume(paint);
  const doors = [[[50, 23, 67, 47], [[52, 29, 57, 38], [60, 29, 65, 38]]], [[178, 23, 195, 47], [[181, 29, 185, 38], [188, 29, 193, 38]]]] as Array<[PxBox, PxBox[]]>;
  body.openings = [1, -1].flatMap((s) => doors.map(([d]) => c.doorOpening(s, box(d), 0.03)));
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (paint.trailerEnds.length) m.scope("paint lines", () => {
          // the end compartments over the bogies: their higher window band
          for (const [u0, u1] of [[2, 47], [197, 242]]) {
            const b = box([u0, 30, u1, 31]);
            for (const [y0, y1, mat] of paint.trailerEnds) c.sidePanel(body, mat, s, { ...b, y0, y1 }, 0.004, 0.003);
          }
        });
        m.scope("end windows", () => END_WINDOWS_051.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.08, ...(b[2] - b[0] > 8 ? { sash: 2.47 } : {}) }))));
        m.scope("windows", () => WINDOWS_051.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(b), { fw: 0.08, sash: 1.77 }))));
        m.scope("doors", () =>
          doors.forEach(([d, glass], i) => m.scope(`door ${i + 1}`, () => passengerDoor(c, body, s, box(d), glass.map(box), paint.door))),
        );
        m.scope("running number", () => {
          const b: Box = box([110, 45, 140, 47]);
          sideNumber(c, body, s, number451(livery, "trailer"), (b.x0 + b.x1) / 2, b.y0, 0.18, paint.number);
        });
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => gangwayEnd(c, body, { wall: e > 0 ? bOf(F, 0.2) : 0, e, face: BELLOWS * K_X, door: { x0: -0.45, x1: 0.45, y0: 1.2, y1: 2.8 }, doorPaint: paint.endDoor, couplerY: 0.7, markerY: 1.35, ...(train ? { frame: false } : {}) }));
  m.scope("running gear", () => {
    [2.4, 22.1].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.4, 0.46, 0.58, false)));
  });
  return m;
}

/**
 * A car of the 451 set for distant views (lodUnits.ts): the motor car's
 * raked, rounded nose over the lamp pods with its wrapped windscreen band and
 * paint, the bodies' sections and bands, the side window bands, the bogies,
 * the apron, the ventilator housing and the raised pantograph.
 */
export function cd451Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD451_PARAMS, params);
  const livery = p.livery as Livery451;
  const paint = PAINTS_451[livery];
  if (p.unit !== "train") {
    const { body, parts } = carLod(p.unit as Unit451, paint, 0, false);
    return fitUnit({ palette: paletteOf(paint), bodies: [body], parts }, 100);
  }
  // the train: each car's distant model moved to its place (the rear motor car of
  // a unit turned), its gangway ends hidden under the bellows; 100 triangles a car, 300 at most
  // up to five cars, 500 for the longest (two units: their shells and joints need more)
  const slots = cd451Train(Number(p.cars));
  const built = slots.map((s, k) => carLod(s.car, paint, (s.lo + s.hi) / 2, s.turned, k));
  const spans = sectionSpans(slots, BELLOWS * K_X, CAB_JOINT);
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, HINGE_Y, 0])),
    joints: slots.slice(0, -1).map((_, i) => ({ sections: [i, i + 1] as [number, number], front: spans[i]![0], rear: spans[i + 1]![1], profile: coupledCabs(slots, i) ? COUPLER_JOINT : TRAIN_BELLOWS })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({ palette: paletteOf(paint), bodies: built.map((c) => c.body), parts: built.flatMap((c) => c.parts), sections }, lodBudget(slots.length));
}

/**
 * One car's distant model, its centre at model x `cx`, turned about it when
 * `turned`; in a train (`section` given) its gangway ends hidden.
 */
function carLod(unit: Unit451, paint: Paint451, cx: number, turned: boolean, section?: number): { body: UnitBody; parts: LodPart[] } {
  const car = CARS[unit];
  const F = car.F;
  const centre = (car.front + car.rear) / 2;
  const P = (x: number) => (turned ? cx - x : cx + x);
  const X = (x: number) => P(bOf(F, x) - centre);
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const glass = (boxes: PxBox[]) => sideGlass(boxes.map((b) => sb(F, b)).map((b) => ({ ...b, x0: b.x0 - centre, x1: b.x1 - centre })), 0.6);
  const inTrain = (b: UnitBody, front: boolean): UnitBody => {
    if (section === undefined) return b;
    const hidden = { ...b, section, rear: { ...b.rear, hidden: true }, ...(front ? { front: { ...b.front, hidden: true } } : {}) };
    const moved = shiftBody(hidden, cx);
    return turned ? turnBody(moved, cx) : moved;
  };
  if (unit === "trailer") {
    const body = coachBody([place(trailerVolume(paint))], { y0: 0.6, windows: glass([...WINDOWS_051, ...END_WINDOWS_051]) });
    // in a train a trailer's bogies give way first: from afar the body hides them
    const bogies = bogieParts([[X(2.4), 1.85, section], [X(22.1), 1.85, section]], 0.6);
    return { body: inTrain(body, true), parts: section === undefined ? bogies : bogies.map((part) => ({ ...part, optional: 5 })) };
  }
  const { nose, body } = motorVolumes(paint);
  const shell = coachBody([place(nose), place(body)], { y0: 0.8, main: 1, windows: glass(WINDOWS_451) });
  return {
    body: inTrain(shell, false),
    parts: [
      ...bogieParts([[X(4.4), 1.95, section], [X(22.6), 1.95, section]], 0.8),
      underPart(X(2.6), X(0.6), 0.5, 0.8, 1.25, 30, section, "apron"),
      roofPart("roofTop", X(18.1), X(9.3), 0.8, 0.6, 3.78, 4.2, section),
      ...pantographParts([X(22.64)], 3.8, 4.1, section !== undefined ? { section } : {}),
    ],
  };
}

/** Every car, for the tests. */
export const CARS_451: readonly Unit451[] = ["motorCar", "trailer"];

/** A car's empty weight (t) and power (kW): 59 t and 660 kW the motor car, 40 t the trailer. */
const CAR_451: Record<Unit451, { weight: number; power: number }> = { motorCar: { weight: 59, power: 660 }, trailer: { weight: 40, power: 0 } };

/** What the game needs of it beyond its geometry (design.ts GameProperties): a train adds its cars up. */
const CD_451_GAME: GameProperties = {
  weight: CAR_451.motorCar.weight,
  power: CAR_451.motorCar.power,
  maxspeed: 100,
  accel: null,
  variants: (["cd", "cdBlue"] as const).flatMap((livery) => {
    const lp: ParamValues = livery === "cd" ? {} : { livery };
    return [
      { params: { unit: "trailer", ...lp }, weight: CAR_451.trailer.weight, power: 0 },
      ...Array.from({ length: CD451_MAX_CARS - CD451_MIN_CARS + 1 }, (_, i) => {
        const n = i + CD451_MIN_CARS;
        const cars = cd451Train(n);
        // the default four cars are named by the unit alone
        const params: ParamValues = { ...(n === CD451_UNIT_CARS ? {} : { cars: String(n) }), unit: "train", ...lp };
        return { params, weight: cars.reduce((t, c) => t + CAR_451[c.car].weight, 0), power: cars.reduce((t, c) => t + CAR_451[c.car].power, 0) };
      }),
    ];
  }),
};

export const EMU451_DESIGNS: ProceduralDesign[] = [{ id: "proc-vehicle-cd-451", game: CD_451_GAME, title: "CD 451 Zabotlam", build: cd451, buildLod: cd451Lod, lodTriangles: 500, params: CD451_PARAMS, catalog: EMU_CATALOG, references: "cd-451" }];

/** A car's source mapping and the body x of its centre, for the comparison. */
export const frame451 = (unit: Unit451): { F: CarFrame; centre: number } => ({ F: CARS[unit].F, centre: (CARS[unit].front + CARS[unit].rear) / 2 });
