// The CSD M 131.1 "Hurvinek", the Tatra two-axle railcar of 1948-56, and the
// M 031 trailer vlakosimdb pairs it with: one design `veh-csd-m131` whose `unit`
// picks the motor car (default), the trailer or the full train (`cars` 2 .. 8,
// m131Train: the railbus pulling up to two trailers, from four cars a second motor
// car at the rear). Both share the rounded body; the trailer lacks the roof
// radiator, the exhausts and the engine.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/csd-m131/native
// (db/train/dmu/m131/csd_m131 and csd_m031): the XML section, the plan that
// rounds both ends in to 1.8 m and the elevation, windows, doors and lamps from
// native pixel boxes, 0.1 m a pixel, the length scaled to the published 12.1 m
// over the buffers. See docs/models/czech-dmus.md.

import type { DoorMotion } from "./doors.ts";
import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { Car, DMU_CATALOG, DMU_PALETTE, buffersBoth, endItems, enumParam, exhaust, sideItems, sideNumber, underBoxes, type CarFrame, type EndItem, type SideItem } from "./dmuKit.ts";
import type { Volume } from "./csdCoachParts.ts";
import { axleParts, dmuBody, fitUnit, roofPart, shiftBody, turnBody, underPart, type UnitBody } from "./lodUnits.ts";
import type { LodPart, LodSections } from "./lodKit.ts";
import { articulate } from "./tramKit.ts";

export type M131Unit = "motorCar" | "trailer" | "train";
/** One car (every value of `unit` but the full train). */
export type M131Car = Exclude<M131Unit, "train">;

/** The full train's car counts. */
export const M131_MIN_CARS = 2;
export const M131_MAX_CARS = 8;

export const M131_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailer: "Trailer",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(Array.from({ length: M131_MAX_CARS - M131_MIN_CARS + 1 }, (_, i) => [String(i + M131_MIN_CARS), `${i + M131_MIN_CARS} cars`]))),
    default: "2",
    when: { name: "unit", values: ["train"] },
  },
];

/** The published 12.1 m over the buffers over the XML's 11.5 m. */
export const K131 = 12.1 / 11.5;

/** M 131.1238 is preserved at Luzna u Rakovnika (assets/csd-m131/PHOTOS.md); the trailer's number follows vlakosimdb's M 031 label. */
export const M131_NUMBERS: Record<M131Car, string> = { motorCar: "M 131.1238", trailer: "M 031.001" };

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });
const PALETTE: Record<string, MaterialSpec> = {
  red: c("#770000"),
  roofGrey: c("#a2a2a2", 0.7),
  doorRed: c("#550000"),
  yellow: c("#d9d900"),
  frameGrey: c("#808080", 0.5),
};

const SECTION: Pt[] = [[-1.4, 0.5], [1.4, 0.5], [1.5, 0.9], [1.5, 2.8], [1.4, 3.0], [1.3, 3.1], [1.1, 3.2], [0.4, 3.3], [-0.4, 3.3], [-1.1, 3.2], [-1.3, 3.1], [-1.4, 3.0], [-1.5, 2.8], [-1.5, 0.9]];
const PLAN: Pt[] = [[0.5, 0.9], [0.6, 1.1], [0.7, 1.2], [0.9, 1.3], [2.2, 1.5], [9.85, 1.5], [10.8, 1.3], [11.0, 1.2], [11.1, 1.1], [11.2, 0.9]];
const TOP: Pt[] = [[0.5, 2.8], [0.6, 3.0], [0.7, 3.1], [0.9, 3.2], [2.4, 3.3], [9.2, 3.3], [10.8, 3.2], [11.0, 3.1], [11.1, 3.0], [11.2, 2.8]];
const BOTTOM: Pt[] = [[0.5, 0.8], [0.6, 0.6], [1.0, 0.5], [1.1, 0.8], [10.6, 0.8], [10.7, 0.5], [11.1, 0.6], [11.2, 0.8]];

/** z_both, 140 x 50 px (14 x 5 m). */
const WINDOWS: SideItem[] = [
  ...[21, 35, 49, 63, 77].map((u): SideItem => ({ kind: "window", box: [u, 23, u + 9, 32], mat: "frameGrey" })),
  { kind: "window", box: [100, 23, 107, 32], mat: "frameGrey", name: "end window" },
];
const DOORS: Array<{ door: [number, number, number, number]; glass: [number, number, number, number] }> = [
  { door: [10, 23, 18, 42], glass: [12, 25, 16, 32] },
  { door: [90, 23, 98, 42], glass: [92, 25, 96, 32] },
];

/** x_both, 30 x 50 px: two windows, the end door with its window, a top lamp and the lamps either side. */
const FRONT: EndItem[] = [
  { kind: "window", box: [3, 23, 11, 32], mat: "frameGrey", name: "window" },
  { kind: "window", box: [19, 23, 27, 32], mat: "frameGrey", name: "window" },
  { kind: "lamp", box: [3.5, 36.5, 6.5, 39.5], name: "lamp" },
  { kind: "lamp", box: [23.5, 36.5, 26.5, 39.5], name: "lamp" },
  { kind: "lamp", box: [4, 34.5, 6, 36.2], name: "tail lamp", mat: "lampRed" },
  { kind: "lamp", box: [24, 34.5, 26, 36.2], name: "tail lamp", mat: "lampRed" },
  { kind: "panel", box: [5, 33.6, 10, 34.4], mat: "yellow", name: "stripe" },
  { kind: "panel", box: [20, 33.6, 25, 34.4], mat: "yellow", name: "stripe" },
];

/** The frame of the native canvases and the body (both cars share them). */
const FRAME_131: CarFrame = { kx: K131, ky: 1, kz: 1, centre: 5.85, sideH: 5, frontH: 5 };
const BODY_131: Volume = { name: "body", section: SECTION, plan: PLAN, top: TOP, bottom: BOTTOM, bands: [[0.5, 2.9, "red"], [2.9, 3.3, "roofGrey"]] };

export function m131(params?: ParamValues): MeshBuilder {
  const p = resolveParams(M131_PARAMS, params);
  if (p.unit === "train") return train131(Number(p.cars));
  return car131(p.unit as M131Car);
}

/** One car centred on x = 0, into its own builder or into `into` (a train's, placed by its frame). */
function car131(unit: M131Car, into?: MeshBuilder): MeshBuilder {
  const motor = unit === "motorCar";
  const car = new Car(PALETTE, FRAME_131, into);
  const m = car.m;
  // both doors swing inward through doorways, one leaf each (doors.ts)
  const body = car.volume(BODY_131, car.doorways(DOORS.map((d) => d.door), 0.025));
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        m.scope("doors", () =>
          DOORS.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              const motion: DoorMotion = { kind: "swing", leaves: 1, from: i === 0 ? "low" : "high" };
              car.openingDoor(body, s, d.door, [d.glass], "doorRed", 0.025, motion, () => "glass", { fw: 0.04, frame: "frameGrey" });
            }),
          ),
        );
        m.scope("running number", () => sideNumber(car, body, s, [44, 33.5, 66, 35.5], M131_NUMBERS[unit], "yellow"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      m.scope("end door", () => {
        // the end door stands 0.1 m proud of the rounded end (XML `dve`)
        const x = car.X(e > 0 ? 11.2 : 0.5);
        block(m, "doorRed", Math.min(x - e * 0.05, x + e * 0.1), Math.max(x - e * 0.05, x + e * 0.1), 0.9, 2.75, -0.3, 0.3);
      });
      m.scope("fittings", () => endItems(car, body, e, FRONT));
      m.scope("door window", () => {
        const x = car.X(e > 0 ? 11.2 : 0.5) + e * 0.1;
        block(m, "glass", Math.min(x, x + e * 0.01), Math.max(x, x + e * 0.01), 2.15, 2.6, -0.22, 0.22);
      });
      m.scope("top lamp", () => {
        const x = car.X(e > 0 ? 11.15 : 0.55);
        block(m, "lampWhite", Math.min(x, x + e * 0.08), Math.max(x, x + e * 0.08), 2.9, 3.15, -0.1, 0.1);
      });
    });
  m.scope("buffers", () => buffersBoth(car, [0.1, 11.6], [0.5, 11.2], 0.9));
  m.scope("running gear", () => {
    for (const [i, x] of [2.3, 9.0].entries()) m.scope(`axle ${i + 1}`, () => car.c.axle(car.sx(x), 0.45, 0.8));
  });
  if (motor) {
    m.scope("underframe", () =>
      underBoxes(car, [
        { name: "engine", x0: 3.7, x1: 6.0, y0: 0.3, y1: 0.79, hw: 0.9 },
        { name: "gearbox", x0: 7.1, x1: 7.7, y0: 0.25, y1: 0.79, hw: 0.5 },
      ]),
    );
    m.scope("roof equipment", () => {
      m.scope("radiator", () => block(m, "roofDark", car.X(2.6), car.X(9.5), 3.28, 3.5, -0.4, 0.4));
      for (const z of [-1.05, 1.05]) m.scope(z > 0 ? "right exhaust" : "left exhaust", () => exhaust(car, 1.75, z, 3.0, 3.5, 0.05));
    });
  } else m.scope("underframe", () => underBoxes(car, [{ name: "battery box", x0: 4.6, x1: 6.6, y0: 0.4, y1: 0.79, hw: 0.7, mat: "tank" }]));
  return m;
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
/**
 * The M 131.1 or its trailer for distant views (lodUnits.ts): the body with
 * its rounded plan and roof ends, the end windows, the side window band, the
 * two axles, the underframe equipment and the motor car's radiator.
 */
export function m131Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(M131_PARAMS, params);
  if (p.unit === "train") return train131Lod(Number(p.cars));
  const { body, parts } = carLod(p.unit as M131Car);
  return fitUnit({ palette: { ...DMU_PALETTE, ...PALETTE }, bodies: [body], parts }, 100);
}

/** One car's distant body and parts, centred on x = 0. */
function carLod(unit: M131Car): { body: UnitBody; parts: LodPart[] } {
  const motor = unit === "motorCar";
  const X = (x: number) => (x - FRAME_131.centre) * K131;
  const body = dmuBody(FRAME_131, BODY_131, { y0: 0.8, items: WINDOWS, cabs: [-1, 1], cabItems: FRONT });
  return {
    body,
    parts: [
      axleParts([[X(2.3), 0.45], [X(9.0), 0.45]], 0.8),
      motor ? underPart(X(3.7), X(7.7), 0.3, 0.8, 0.9) : underPart(X(4.6), X(6.6), 0.4, 0.8, 0.7),
      ...(motor ? [roofPart("roofDark", X(2.6), X(9.5), 0.4, 0.4, 3.28, 3.5)] : []),
    ],
  };
}

// ---------------------------------------------------------------------------
// The full train

/** The length over the buffers (m): a car's span between its coupling planes. */
export const LOB_131 = 12.1;
/** From the coupling plane (the buffers' faces) back to the end door's face, 0.1 m proud of the rounded end. */
const GAP_131 = LOB_131 / 2 - ((11.2 - FRAME_131.centre) * K131 + 0.1);
/** The buffers' height: the hinge between two cars. */
const BUFFER_Y_131 = 0.9;
/** The bend a joint allows between two short cars. */
const MAX_BEND_131 = 15;
/** The bellows between the two end doors (z, y): the doors' width and height. */
const BELLOWS_131: Array<[number, number]> = [[-0.3, 0.95], [0.3, 0.95], [0.3, 2.7], [-0.3, 2.7]];

/**
 * The cars of a train of `n`, front first: the railbus leading with up to two
 * trailers (its 155 kW pulled one, at most two); from four cars a second motor
 * car at the rear, the trailers between the two (a pair of railbuses top and
 * tail). Each with its span lo..hi over the coupling planes, the train centred
 * on x = 0, the last car turned.
 */
export function m131Train(n: number): Array<{ car: M131Car; lo: number; hi: number; turned: boolean }> {
  const cars: M131Car[] = n <= 3
    ? ["motorCar", ...Array.from({ length: n - 1 }, (): M131Car => "trailer")]
    : ["motorCar", ...Array.from({ length: n - 2 }, (): M131Car => "trailer"), "motorCar"];
  let hi = (n * LOB_131) / 2;
  return cars.map((car, i) => {
    const lo = hi - LOB_131;
    const out = { car, lo, hi, turned: i === n - 1 && n > 1 };
    hi = lo;
    return out;
  });
}

/** Runs `fn` with a car centred on x = 0 placed at cx, turned end for end when `turned`. */
function placed<T>(m: MeshBuilder, cx: number, turned: boolean, fn: () => T): T {
  const at = () => m.moved(([x, y, z]) => [x + cx, y, z], fn);
  return turned ? m.turned(cx, at) : at();
}

/**
 * The whole train as one articulated vehicle: each car a section (articulate,
 * tramKit.ts) hinged at the coupling plane ahead of it on its own two axles, a
 * bellows between the end doors over each gap; the buffers meet at the planes.
 */
function train131(n: number): MeshBuilder {
  const cars = m131Train(n);
  const m = new Car({ ...PALETTE, bellows: c("#26272a", 0.95) }, FRAME_131).m;
  const sections = cars.map((t, k) => {
    const cx = (t.lo + t.hi) / 2;
    return { x0: t.lo + GAP_131, x1: t.hi - GAP_131, draw: () => m.scope(`car ${k + 1}`, () => placed(m, cx, t.turned, () => car131(t.car, m))) };
  });
  articulate({ m }, sections, BUFFER_Y_131, { profile: BELLOWS_131, folds: 3, depth: 0.03 }, MAX_BEND_131, cars.slice(0, -1).map((t) => t.lo));
  return m;
}

/** A train's distant model: the cars' bodies and parts as its sections, a plain bellows over each gap; 100 triangles a car, 500 at most. */
function train131Lod(n: number): MeshBuilder {
  const cars = m131Train(n);
  const built = cars.map((t, k) => {
    const cx = (t.lo + t.hi) / 2;
    const { body, parts } = carLod(t.car);
    const at = t.turned ? turnBody(shiftBody(body, cx), cx) : shiftBody(body, cx);
    return {
      body: { ...at, section: k },
      parts: parts.map((part): LodPart => ({ ...part, section: k, draw: (m) => placed(m, cx, t.turned, () => part.draw(m)) })),
    };
  });
  const sections: LodSections = {
    pivots: cars.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [cars[i - 1]!.lo, BUFFER_Y_131, 0])),
    joints: cars.slice(0, -1).map((t, i) => ({ sections: [i, i + 1] as [number, number], front: t.lo + GAP_131, rear: cars[i + 1]!.hi - GAP_131, profile: BELLOWS_131 })),
    maxBendDeg: MAX_BEND_131,
  };
  return fitUnit({ palette: { ...DMU_PALETTE, ...PALETTE }, bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(500, 100 * n));
}

/** The cars' figures: the railbus's 25 t and 155 kW, the trailer's 15 t. */
const CAR_131: Record<M131Car, { weight: number; power: number }> = { motorCar: { weight: 25, power: 155 }, trailer: { weight: 15, power: 0 } };

const CSD_M131_GAME: GameProperties = {
  weight: CAR_131.motorCar.weight,
  power: CAR_131.motorCar.power,
  maxspeed: 80,
  accel: null,
  variants: [
    { params: { unit: "trailer" }, weight: 15, power: 0 },
    // every train length: its cars' weights added up, its motor cars' power (the default two cars named by the unit alone)
    ...Array.from({ length: M131_MAX_CARS - M131_MIN_CARS + 1 }, (_, i) => {
      const n = i + M131_MIN_CARS;
      const cars = m131Train(n);
      const params: ParamValues = n === 2 ? { unit: "train" } : { cars: String(n), unit: "train" };
      return { params, weight: cars.reduce((t, c) => t + CAR_131[c.car].weight, 0), power: cars.reduce((t, c) => t + CAR_131[c.car].power, 0) };
    }),
  ],
};

export const M131_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-csd-m131", game: CSD_M131_GAME, title: "CSD M 131.1 Hurvinek", build: m131, buildLod: m131Lod, lodTriangles: 500, params: M131_PARAMS, catalog: DMU_CATALOG, references: "csd-m131" },
];
