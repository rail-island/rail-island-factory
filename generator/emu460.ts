// The CD 460 (CSD EM 488.0), the Studenka electric unit of 1971-1978 for the
// Ostrava region: one design `veh-cd-460` whose `unit` picks the 460 motor car
// with its cab (default) or the intermediate trailer (CD class 063, vlakosimdb's
// "CD 060"), and whose `livery` picks the paint and running number: the CD grey
// and blue (460 071), the vlakosimdb units 460 003 and 460 007 in the same
// paint, and the CSD cream and green (460 045).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-460/native
// (db/train/emu/cd 460/cd_460, cd_460,003-4, cd_460,007-4, cd_060 and
// db/train/emu/csd 460/csd_460,045, csd_460,052, csd_060.045): the XML `alongx`
// section, the `alongz` elevation (the cab's forward-leaning windscreen over the
// lower front, the roof's resistor box, the trailer's centre door well) and
// windows, doors and paint laid from native pixel boxes, 0.1 m a pixel. Every
// dimension is the XML's: five cars of 24.5 m over buffers and gangways make the
// published 122.5 m set. Every car faces +X: the motor car's cab is its +X end.
// See docs/models/czech-emus-classic.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { diamond } from "./czElectricKit.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, pantographParts, roofPart, shifted, sideGlass, underPart } from "./lodUnits.ts";
import { EMU_CATALOG, enumParam, slopePanel, tractionNumber, blockX } from "./emuParts.ts";
import { bOf, CLASSIC_PALETTE, emuBogie, endBuffers, frontNumber, gangwayEnd, lens, louvre, polyB, sb, sideEmblem, toB, type CarFrame, type PxBox } from "./emuClassicKit.ts";

export type Unit460 = "motorCar" | "trailer";
export type Livery460 = "cd" | "cd003" | "cd007" | "csd";

export const CD460_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailer: "Trailer",
  }),
  enumParam("livery", "Livery", {
    cd: "460 071",
    cd003: "460 003",
    cd007: "460 007",
    csd: "CSD",
  }),
];

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** The body's bands from 0.9 m to the roof, and the cab section's (front and cab sides). */
  body: Array<[number, number, string]>;
  cab: Array<[number, number, string]>;
  /** The passenger doors' paint ("bands": the body's own bands). */
  door: string;
  /** The CD emblem on the sides. */
  emblem: boolean;
  /** The motor car's serial; the trailer carries the same in class 063. */
  serial: string;
  /** Which of the two pantographs is raised: the inner one (rear, -X) or the cab one. */
  raised: "rear" | "front";
}

const CD_PALETTE: Record<string, MaterialSpec> = {
  // the native colours of cd_460 z_inc and x_dec
  band: { color: "#7195ea", roughness: 0.5 },
  body: { color: "#b0b0a0", roughness: 0.5 },
  roof: { color: "#acacac", roughness: 0.7 },
  doorRed: { color: "#ce0000", roughness: 0.5 },
  emblemBlue: { color: "#184abd", roughness: 0.5 },
};
const CD_BODY: Array<[number, number, string]> = [[0.3, 1.2, "body"], [1.2, 1.8, "band"], [1.8, 2.7, "body"], [2.7, 3.2, "band"], [3.2, 4.0, "roof"]];
const CD_CAB: Array<[number, number, string]> = [[0.3, 1.7, "body"], [1.7, 2.3, "band"], [2.3, 3.2, "body"], [3.2, 4.0, "roof"]];
const cdPaint = (serial: string, raised: "rear" | "front"): Paint => ({ palette: CD_PALETTE, body: CD_BODY, cab: CD_CAB, door: "doorRed", emblem: true, serial, raised });

const PAINTS: Record<Livery460, Paint> = {
  cd: cdPaint("071", "rear"),
  cd003: cdPaint("003", "rear"),
  cd007: cdPaint("007", "front"),
  csd: {
    // the native colours of csd_460,045 z_inc and x_dec
    palette: { body: { color: "#ffffc6", roughness: 0.5 }, band: { color: "#2b5238", roughness: 0.5 }, roof: { color: "#949494", roughness: 0.7 }, doorRed: { color: "#ce0000", roughness: 0.5 }, emblemBlue: { color: "#184abd", roughness: 0.5 } },
    body: [[0.3, 1.9, "band"], [1.9, 3.1, "body"], [3.1, 4.0, "roof"]],
    cab: [[0.3, 1.9, "band"], [1.9, 3.2, "body"], [3.2, 4.0, "roof"]],
    door: "bands",
    emblem: false,
    serial: "045",
    raised: "rear",
  },
};

/** The running number a car carries: `460 071-4`, its trailer `063 071-5`. */
export function number460(livery: Livery460, unit: Unit460): string {
  return tractionNumber(unit === "motorCar" ? "460" : "063", PAINTS[livery].serial);
}

/** Which pantograph a livery raises. */
export const raised460 = (livery: Livery460): "rear" | "front" => PAINTS[livery].raised;

const PALETTE: Record<string, MaterialSpec> = {
  ...CLASSIC_PALETTE,
  skirt: { color: "#9a9a9a", roughness: 0.7 },
  grille: { color: "#808080", roughness: 0.6 },
  roofBox: { color: "#8b8b8b", roughness: 0.7 },
};

/** Both cars: the inner end wall at source x 24.3, the gangway or the buffers 0.2 m beyond each end. */
const F: CarFrame = { srcEnd: 24.3, kx: 1, H: 5 };
const FACES: Record<Unit460, [number, number]> = { motorCar: [-0.2, bOf(F, 0)], trailer: [-0.2, bOf(F, 0)] };
export const length460 = (unit: Unit460): number => FACES[unit][1] - FACES[unit][0];

/** The XML alongx section: vertical walls 0.9 .. 3.2 m, the roof's curve to 4.0 m; the trailer's well reaches 0.3 m. */
const SECTION: Pt[] = [[-1.5, 0.3], [1.5, 0.3], [1.5, 3.2], [1.1, 3.7], [0.7, 3.9], [0, 4.0], [-0.7, 3.9], [-1.1, 3.7], [-1.5, 3.2]];

/** The cab's leaning windscreen (XML alongz `cab`): 0.6 m back at 1.8 m, 0.3 m at 3.6 m. */
const faceAt = (y: number): Pt => [0.6 - (0.3 * (y - 1.8)) / 1.8, y];

/** A car of the CD 460 set. */
export function cd460(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD460_PARAMS, params);
  return car(p.unit as Unit460, p.livery as Livery460);
}

/** A car's volumes: the body and, on the motor car, the cab above the windscreen's foot and the lower front. */
function volumes460(motor: boolean, paint: Paint): { body: Volume; cabUpper: Volume; cabLower: Volume } {
  const body: Volume = motor
    ? {
        name: "body",
        section: SECTION,
        plan: toB(F, [[1.8, 1.5], [22.9, 1.5], [24.3, 1.4]]),
        top: toB(F, [[1.8, 4.0], [24.1, 4.0], [24.3, 3.8]]),
        bottom: toB(F, [[1.8, 0.9], [24.3, 0.9]]),
        bands: paint.body,
        endPaint: "body",
      }
    : {
        name: "body",
        section: SECTION,
        plan: toB(F, [[0.2, 1.4], [1.6, 1.5], [22.9, 1.5], [24.3, 1.4]]),
        top: toB(F, [[0.2, 3.8], [0.4, 4.0], [24.1, 4.0], [24.3, 3.8]]),
        // the centre door's well down to 0.3 m (XML 11.4 .. 13.1 m)
        bottom: toB(F, [[0.2, 0.9], [11.35, 0.9], [11.4, 0.3], [13.1, 0.3], [13.15, 0.9], [24.3, 0.9]]),
        bands: paint.body,
        endPaint: "body",
      };
  const cabEdges = paint.cab.map((b) => b[0]).filter((y) => y > 1.8 && y < 3.6);
  const cabUpper: Volume = {
    name: "cab",
    section: SECTION,
    plan: toB(F, [[0.3, 0.9], [0.4, 0.95], [1.8, 1.5]]),
    top: toB(F, [[0.3, 3.6], [1.4, 4.0], [1.8, 4.0]]),
    bottom: toB(F, [faceAt(3.6), ...cabEdges.map(faceAt), faceAt(1.8), [1.8, 1.8]]),
    bands: paint.cab,
  };
  const cabLower: Volume = {
    name: "lower front",
    section: SECTION,
    plan: toB(F, [[0.4, 1.15], [1.8, 1.5]]),
    top: toB(F, [[0.4, 1.8], [1.8, 1.8]]),
    bottom: toB(F, [[0.4, 0.9], [1.8, 0.9]]),
    // only the bands below its 1.8 m top: a band above it would leave a sliver cap
    bands: paint.cab.filter(([y0]) => y0 < 1.8).map(([y0, y1, mat]): [number, number, string] => [y0, Math.min(y1, 1.8), mat]),
  };
  return { body, cabUpper, cabLower };
}

/** The side windows (native boxes) of the motor car and of the trailer. */
const WINDOWS_460: PxBox[] = [[42, 19, 55, 30], [117, 19, 130, 30], [134, 19, 147, 30], [151, 19, 164, 30], [168, 19, 181, 30], [185, 19, 198, 30], [202, 19, 215, 30], [219, 19, 226, 30]];
const WINDOWS_060: PxBox[] = [[19, 19, 26, 30], [30, 19, 43, 30], [47, 19, 60, 30], [64, 19, 77, 30], [81, 19, 94, 30], [98, 19, 111, 30], [134, 19, 147, 30], [151, 19, 164, 30], [168, 19, 181, 30], [185, 19, 198, 30], [202, 19, 215, 30], [219, 19, 226, 30]];

function car(unit: Unit460, livery: Livery460): MeshBuilder {
  const paint = PAINTS[livery];
  const [rear, front] = FACES[unit];
  const c = new Coach({ ...PALETTE, ...paint.palette }, (rear + front) / 2);
  const m = c.m;
  const X = (x: number) => c.X(bOf(F, x));
  const motor = unit === "motorCar";
  const { body, cabUpper, cabLower } = volumes460(motor, paint);
  const number = number460(livery, unit);
  m.scope("body", () => {
    c.volume(body);
    if (motor) {
      m.scope("cab", () => c.volume(cabUpper));
      m.scope("lower front", () => c.volume(cabLower));
    }
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => (motor ? motorSide : trailerSide)(c, motor ? cabUpper : body, body, paint, s, number));
  });
  if (motor) m.scope("cab", () => cab(c, cabUpper, cabLower, number));
  for (const e of motor ? [-1] : [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () =>
      gangwayEnd(c, body, { wall: e > 0 ? bOf(F, 0.2) : 0, e, face: 0.2, door: { x0: -0.6, x1: 0.6, y0: 1.6, y1: 3.1 }, doorPaint: "doorRed", couplerY: 0.95, markerY: 1.4, markerZ: 1.0 }),
    );
  m.scope("underframe", () => {
    if (motor) {
      // the equipment skirt between the bogies (XML `k`, 5.9 .. 18.9 m)
      const k: Array<[number, number]> = [[-1.1, 0.2], [1.1, 0.2], [1.3, 0.3], [1.4, 0.5], [1.48, 0.88], [-1.48, 0.88], [-1.4, 0.5], [-1.3, 0.3]];
      m.scope("equipment skirt", () => m.sweep("skirt", "x", k, X(18.9), k, X(5.9)));
    } else {
      m.scope("equipment boxes", () => {
        for (const [a, b] of [[9.2, 10.9], [16.9, 18.2]]) blockX(m, "underframe", X(a), X(b), 0.4, 0.88, -1.3, 1.3);
      });
      m.scope("steps", () => {
        for (const [a, b] of [[0.4, 1.4], [23.1, 24.1]]) blockX(m, "underframe", X(a), X(b), 0.3, 0.88, -1.42, 1.42);
      });
    }
  });
  if (motor)
    m.scope("roof equipment", () => {
      // the resistor box (XML `e`, 8.7 .. 12.8 m, to 4.5 m) and the roof walkway (`st`)
      const ring: Array<[number, number]> = [[-0.5, 3.9], [0.5, 3.9], [0.5, 4.4], [0.4, 4.5], [-0.4, 4.5], [-0.5, 4.4]];
      m.scope("resistor box", () => m.sweep("roofBox", "x", ring, X(12.8), ring, X(8.7)));
      m.scope("walkway", () => {
        for (const [a, b] of [[2.2, 8.6], [12.9, 19.6]]) blockX(m, "roofBox", X(a), X(b), 3.93, 4.05, -0.6, 0.6);
      });
      m.scope("pantographs", () => {
        // XML inlines at 3.6 .. 3.8 m (over the cab bogie) and 21.1 m (over the inner one)
        for (const [name, x, up] of [["pantograph 1", 3.7, paint.raised === "front"], ["pantograph 2", 21.1, paint.raised === "rear"]] as const)
          m.scope(name, () => diamond(m, { xc: X(x), roofY: 4.0, baseY: 4.25, raised: up }));
      });
    });
  m.scope("running gear", () => {
    (motor ? [3.6, 21.1] : [3.6, 20.85]).forEach((x, i) => m.scope(`bogie ${i + 1}`, () => emuBogie(c, bOf(F, x), 2.5, motor ? 0.5 : 0.45, 0.88, motor)));
  });
  return m;
}

/** A row of windows: frames with the drop light's sash at 2.6 m. */
function windows(c: Coach, v: Volume, s: number, list: PxBox[]): void {
  list.forEach((b, i) => c.m.scope(`window ${i + 1}`, () => c.window(v, s, sb(F, b), { fw: 0.07, sash: 2.62 })));
}

/** A passenger door with its windows. */
function door(c: Coach, v: Volume, s: number, d: PxBox, glass: PxBox[], paint: string): void {
  c.door(v, s, sb(F, d), paint, { seam: 0.03 });
  for (const g of glass) c.window(v, s, sb(F, g), { fw: 0.04 });
}

function markings(c: Coach, v: Volume, paint: Paint, s: number, number: string, at: number): void {
  const m = c.m;
  if (paint.emblem) m.scope("emblem", () => sideEmblem(c, s, sb(F, [43, 32, 51, 37]), 1.5, "emblemBlue"));
  m.scope("running number", () => {
    const b = sb(F, [at - 15, 36, at + 15, 38]);
    c.numeral(v, s, number, (b.x0 + b.x1) / 2, b.y0 + 0.02, 0.16, 0.006, "lettering");
  });
}

/** The motor car's side (cd_460 z_inc): cab window and door, luggage door, passenger doors, grille, windows. */
function motorSide(c: Coach, cabV: Volume, v: Volume, paint: Paint, s: number, number: string): void {
  const m = c.m;
  m.scope("cab window", () => c.window(cabV, s, sb(F, [3, 19, 11, 26]), { fw: 0.06 }));
  m.scope("cab door", () => door(c, v, s, [18, 18, 26, 39], [[20, 20, 25, 27]], "bands"));
  m.scope("luggage door", () => door(c, v, s, [64, 18, 79, 41], [[66, 19, 70, 30], [73, 19, 77, 30]], "bands"));
  m.scope("doors", () => {
    m.scope("door 1", () => door(c, v, s, [92, 18, 103, 39], [[94, 20, 98, 29]], paint.door));
    m.scope("door 2", () => door(c, v, s, [230, 18, 240, 39], [[232, 20, 236, 29]], paint.door));
  });
  m.scope("grille", () => louvre(c, v, s, sb(F, [105, 18, 114, 38]), "grille", 8));
  m.scope("windows", () => windows(c, v, s, WINDOWS_460));
  markings(c, v, paint, s, number, 160);
}

/** The trailer's side (cd_060 z_inc): end doors, the centre double door, twelve windows. */
function trailerSide(c: Coach, _cab: Volume, v: Volume, paint: Paint, s: number, number: string): void {
  const m = c.m;
  m.scope("doors", () => {
    m.scope("door 1", () => door(c, v, s, [5, 18, 15, 39], [[9, 20, 13, 29]], paint.door));
    m.scope("door 2", () => door(c, v, s, [114, 18, 131, 39], [[117, 20, 121, 29], [124, 20, 128, 29]], paint.door));
    m.scope("door 3", () => door(c, v, s, [230, 18, 240, 39], [[232, 20, 236, 29]], paint.door));
  });
  m.scope("windows", () => windows(c, v, s, WINDOWS_060));
  markings(c, v, paint, s, number, 160);
}

/** The cab front (cd_460 x_dec): windscreen on the leaning face, lamps and grilles, buffers, plough, top lamp. */
function cab(c: Coach, upper: Volume, lower: Volume, number: string): void {
  const m = c.m;
  const X = (x: number) => c.X(bOf(F, x));
  const plane = { x0: X(0.6), y0: 1.8, x1: X(0.3), y1: 3.6 };
  m.scope("windscreen", () => {
    slopePanel(m, "cabBlack", 1, plane, -0.92, 0.92, 2.28, 3.12, 0.006, 0.01);
    // x_dec columns 5..14 and 16..25, rows 19..27
    for (const [z0, z1] of [[-0.88, -0.1], [0.1, 0.88]]) slopePanel(m, "glass", 1, plane, z0, z1, 2.32, 3.08, 0.014, 0.006);
  });
  m.scope("running number", () => frontNumber(m, "letteringDark", number, 0.6, 1.02, 0.1, () => X(0.4)));
  // the grille box under the windscreen (XML `b`: 0.4 .. 0.6 m, 1.8 .. 2.2 m, z +-0.6)
  m.scope("grille box", () => {
    blockX(m, "band", X(0.62), X(0.4), 1.8, 2.2, -0.6, 0.6);
    for (let i = 0; i < 4; i++) blockX(m, "louvreSlat", X(0.4) + 0.001, X(0.4) + 0.012, 1.86 + i * 0.09, 1.9 + i * 0.09, -0.56, 0.56);
  });
  m.scope("lower grille", () => c.endPanel(lower, "grille", 1, { x0: -0.6, x1: 0.6, y0: 1.4, y1: 1.76 }, 0.008, 0.02));
  m.scope("lamps", () => {
    // x_dec columns 3..5 (red) and 6..8 (head), rows 33..35; the red lens kept on the chamfered corner
    for (const s of [1, -1])
      m.scope(s > 0 ? "right" : "left", () => {
        lens(m, "lampRed", X(0.4), s * 1.06, 1.6, 0.08);
        lens(m, "lampWhite", X(0.4), s * 0.8, 1.6, 0.095);
      });
  });
  m.scope("top lamp", () => {
    const ring: Array<[number, number]> = [[-0.2, 3.6], [0.2, 3.6], [0.2, 3.9], [0.1, 4.0], [-0.1, 4.0], [-0.2, 3.9]];
    m.sweep("roof", "x", ring, X(1.4), ring, X(0.36));
    lens(m, "lampYellow", X(0.36), 0, 3.8, 0.09);
  });
  // the plough (XML `sp`: 0.5 .. 1.8 m, down to 0.1 m)
  m.scope("plough", () => c.sideSweep("underframe", polyB(F, [[0.5, 0.1], [0.6, 0.88], [1.8, 0.5], [1.7, 0.2]]), -1.0, 1.0));
  m.scope("buffers", () => endBuffers(c, 1, bOf(F, 0.4) - 0.3, bOf(F, 0), 0.95, "round"));
  // a handrail column beside each cab door
  for (const s of [1, -1]) m.scope(s > 0 ? "right handrail" : "left handrail", () => {
    const b: Box = sb(F, [16, 20, 17, 37]);
    c.handrail(upper, s, (b.x0 + b.x1) / 2, 1.95, 3.1);
  });
}

/**
 * A car of the 460 set for distant views (lodUnits.ts): the motor car's
 * leaning cab with its windscreen and cab paint, the bodies' sections and the
 * livery's bands, the side window band, the bogies, the motor car's equipment
 * skirt, resistor box and two pantographs, the rear one raised.
 */
export function cd460Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD460_PARAMS, params);
  const unit = p.unit as Unit460;
  const paint = PAINTS[p.livery as Livery460];
  const motor = unit === "motorCar";
  const [rear, front] = FACES[unit];
  const centre = (rear + front) / 2;
  const X = (x: number) => bOf(F, x) - centre;
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const { body, cabUpper, cabLower } = volumes460(motor, paint);
  const windows = sideGlass(shifted((motor ? WINDOWS_460 : WINDOWS_060).map((b) => sb(F, b)), centre), 0.6);
  const shell = coachBody(motor ? [place(body), place(cabUpper), place(cabLower)] : [place(body)], {
    y0: 0.9, main: 0, windows, ...(motor ? { frontWindows: [{ u: [-0.92, 0.92], y: [2.28, 3.12], mat: LOD_GLASS }] } : {}),
  });
  return fitUnit({
    palette: { ...PALETTE, ...paint.palette },
    bodies: [shell],
    parts: [
      ...bogieParts((motor ? [3.6, 21.1] : [3.6, 20.85]).map((x) => [X(x), 1.25 + (motor ? 0.5 : 0.45) + 0.2] as const), 0.9),
      ...(motor ? [
        underPart(X(18.9), X(5.9), 0.2, 0.9, 1.45, 50, undefined, "skirt"),
        roofPart("roofBox", X(12.8), X(8.7), 0.5, 0.4, 3.9, 4.5),
        ...pantographParts([X(21.1), X(3.7)], 4.0, 4.25),
      ] : []),
    ],
  }, 100);
}

/** A car's source mapping and the body x of its centre, for the comparison. */
export const frame460 = (unit: Unit460): { F: CarFrame; centre: number } => ({ F, centre: (FACES[unit][0] + FACES[unit][1]) / 2 });

/** Every car and livery, for the tests. */
export const CARS_460: ReadonlyArray<[Unit460, Livery460]> = (["motorCar", "trailer"] as const).flatMap((u) => (["cd", "cd003", "cd007", "csd"] as const).map((l): [Unit460, Livery460] => [u, l]));

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_460_GAME: GameProperties = {
  weight: 40,
  power: 1000,
  maxspeed: 120,
  accel: null,
  variants: [
    { params: { livery: "csd" }, maxspeed: 110 },
    { params: { livery: "cd003", unit: "trailer" }, power: 0 },
    { params: { livery: "cd007", unit: "trailer" }, power: 0 },
    { params: { livery: "csd", unit: "trailer" }, power: 0, maxspeed: 110 },
    { params: { unit: "trailer" }, power: 0 },
  ],
};

export const EMU460_DESIGNS: ProceduralDesign[] = [{ id: "proc-vehicle-cd-460", game: CD_460_GAME, title: "CD 460", build: cd460, buildLod: cd460Lod, params: CD460_PARAMS, catalog: EMU_CATALOG, references: "cd-460" }];
