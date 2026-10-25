// The MAV MDmot, Ganz-MAVAG's diesel-hydraulic multiple unit of the Hungarian
// State Railways (1970-1976, built as class MDa): one design `veh-mav-mdmot`
// whose `unit` picks the car of the set - the short twin-cab baggage motor car
// MDmot (the default), the first-class trailer Ax, the second-class trailer Bx
// or the driving trailer Btx with its baggage room. A four-car set is MDmot,
// Bx, Ax, Btx (82.38 m); a six-car set adds two Bx (127.18 m).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/mav-mdmot/native
// (db/train/dmu/mav_mdmot, mav_ax, mav_bx, mav_btx; these folders have no
// image.bmp): the XML `alongx` sections (symmetric about the centre line, which
// vlakosimdb draws 0.1 m off), the `alongz` elevations (the cab fronts that lean
// forward to the windscreen and back to the roof, the motor car's roof hump),
// and the windows, doors, grilles and paint laid from native pixel boxes, 0.1 m
// a pixel. Lengths over buffers are the published ones (15.52 m, 22.40 m, 22.06 m),
// widths 2.85 m. Every car faces +X: the motor car's first cab (the BMP's left
// end) and the driving trailer's cab are at +X. See docs/models/foreign-units.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { blockX, DMU_CATALOG, enumParam, slopePanel } from "./emuParts.ts";
import { bOf, sideBox, unitBogie, type PxBox, type SideMap } from "./unitParts.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, roofPart, sideGlass, underPart } from "./lodUnits.ts";

export type MdmotUnit = "motorCar" | "trailerAx" | "trailerBx" | "drivingTrailer";

export const MDMOT_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailerAx: "Ax",
    trailerBx: "Bx",
    drivingTrailer: "Driving trailer",
  }),
];

/** The published width 2.85 m. */
export const MDMOT_WIDTH = 2.85;

const PALETTE: Record<string, MaterialSpec> = {
  red: { color: "#f00000", roughness: 0.5 },
  darkRed: { color: "#a00000", roughness: 0.55 },
  roof: { color: "#a0a0a0", roughness: 0.7 },
  roofDark: { color: "#7a7a7a", roughness: 0.75 },
  sill: { color: "#a0a0a0", roughness: 0.6 },
  beam: { color: "#303030", roughness: 0.8 },
  cream: { color: "#ffc000", roughness: 0.5 },
  orange: { color: "#ff6000", roughness: 0.5 },
  yellow: { color: "#ffe000", roughness: 0.5 },
  frame: { color: "#808080", roughness: 0.5 },
  glass: { color: "#303030", metallic: 0.2, roughness: 0.15 },
  frosted: { color: "#8c8c8c", roughness: 0.4 },
  cabGlass: { color: "#4b5862", metallic: 0.2, roughness: 0.15 },
  doorGrey: { color: "#c0c0c0", roughness: 0.5 },
  grille: { color: "#606060", roughness: 0.7 },
  louvre: { color: "#3c3c3c", roughness: 0.7 },
  plate: { color: "#101010", roughness: 0.6 },
  marking: { color: "#ffffff", roughness: 0.5 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  motor: { color: "#2e3033", roughness: 0.8 },
  engine: { color: "#3b3d40", roughness: 0.8 },
};

interface Window {
  box: PxBox;
  /** Frosted glass (a toilet). */
  frosted?: boolean;
  /** A drop light's sash bar, its lower edge as a native row. */
  sash?: number;
}

interface CarLayout {
  key: string;
  map: SideMap;
  /** Length over buffers. */
  length: number;
  /** Half the XML section's width, scaled to the published 2.85 m. */
  kZ: number;
  section: Pt[];
  /** The body's ends (source x), the cab ends' profiles and the bands. */
  plan: Pt[];
  top: Pt[];
  bottom: Pt[];
  bands: Array<[number, number, string]>;
  /** Cab ends: the nose volume's span (source x) and its front-view canvas. */
  cabs: Array<{ x0: number; x1: number; top: Pt[]; bottom: Pt[]; plan: Pt[]; e: number; face: { lean: [number, number, number, number]; screen: [number, number, number, number] } }>;
  windows: Window[];
  /** The doors; a baggage room's or a crew door (narrower than 0.8 m of native width) stays shut. */
  doors: Array<{ box: PxBox; glass: PxBox; rails: number[]; baggage?: boolean }>;
  grilles: PxBox[];
  louvres: PxBox[];
  lines: Array<{ box: PxBox; mat: string }>;
  numerals: Array<{ text: string; u: number }>;
  bogies: { x: [number, number]; wb: number; motor: boolean };
  /** Gangway ends (e = +1 the +X end). */
  gangways: number[];
  /** The buffer beams' inner faces (source x) at each end. */
  beams: { front: number; rear: number };
}

/**
 * Heights: vlakosimdb's roof (3.5 m on the motor car, 3.6 m on the trailers) is
 * low against photographs (the motor car's roof 3.7 m, scaled from the buffers'
 * 1.75 m spacing on photo-mdmot-3038-front-mateszalka-1996.jpg, its lamp band 1.3
 * to 1.9 m against the XML's 1.2 to 1.7 m): every source height is scaled by
 * 1.07; buffers, bogies and the underframe keep their mechanical heights.
 */
export const MDMOT_K_Y = 1.07;
const K_Y = MDMOT_K_Y;
const K_Z_MOTOR = MDMOT_WIDTH / 2.8;
/** The motor car's width scale (its XML section is 2.8 m wide), for the comparison. */
export const MDMOT_K_Z = K_Z_MOTOR;
const K_Z_TRAILER = MDMOT_WIDTH / 2.9;

/** The motor car's XML section, centred (vlakosimdb's is 0.1 m off), at the published width. */
const MOTOR_SECTION: Pt[] = ([[-1.0, 0.2], [1.0, 0.2], [1.4, 0.6], [1.4, 3.0], [1.3, 3.2], [1.1, 3.4], [0.9, 3.5], [0.7, 3.7], [0.6, 3.9], [-0.6, 3.9], [-0.7, 3.7], [-0.9, 3.5], [-1.1, 3.4], [-1.3, 3.2], [-1.4, 3.0], [-1.4, 0.6]] as Pt[]).map(([z, y]): Pt => [z * K_Z_MOTOR, y * K_Y]);
/** The trailers' XML section (Ax), centred, at the published width. */
const TRAILER_SECTION: Pt[] = ([[-0.95, 0.2], [0.95, 0.2], [1.45, 0.7], [1.45, 3.2], [0.95, 3.5], [0, 3.6], [-0.95, 3.5], [-1.45, 3.2], [-1.45, 0.7]] as Pt[]).map(([z, y]): Pt => [z * K_Z_TRAILER, y * K_Y]);

/** The cab front's paint (x_both of the MDmot, x_dec of the Btx): beam, the cream lamp band, red, the roof. */
const NOSE_BANDS: Array<[number, number, string]> = ([[0.4, 1.2, "beam"], [1.2, 1.7, "cream"], [1.7, 1.8, "orange"], [1.8, 2.9, "red"], [2.9, 3.9, "roof"]] as Array<[number, number, string]>).map(([a, b, m]) => [a * K_Y, b * K_Y, m]);

/**
 * A cab front of the MDmot type at source x `xf` (the face at buffer-beam
 * height), facing direction d (-1: the cab is at the BMP's left, x decreasing).
 * The XML profile: vertical to 1.2 m, leaning forward 0.1 m to 1.9 m, back to
 * the windscreen's top at 2.9 m (0.2 m behind the face) and to the roof.
 */
function cabFront(xf: number, d: number, roofY: number) {
  const at = (dx: number) => xf - d * dx;
  const lean = (y: number) => (y <= 1.9 ? -0.1 * ((y - 1.2) / 0.7) : -0.1 + 0.3 * ((y - 1.9) / 1.0));
  const roofX = 0.1 + ((roofY - 2.9) / 0.6) * 0.3;
  // stations at the bands' edges keep each band's clamped ring on its plane
  const top: Pt[] = [[at(-0.1), 1.9], [at(0.1), 2.9], [at(roofX), roofY], [at(0.5), roofY]];
  const bottom: Pt[] = [[at(-0.1), 1.85], [at(lean(1.8)), 1.8], [at(lean(1.7)), 1.7], [at(0), 1.2], [at(0.001), 0.4], [at(0.5), 0.4]];
  const plan: Pt[] = [[at(-0.1), 1.25], [at(0.05), 1.36], [at(0.3), 1.4], [at(0.5), 1.4]];
  const sort = (p: Pt[]) => [...p].sort((a, b) => a[0] - b[0]);
  return {
    x0: Math.min(at(-0.1), at(0.5)),
    x1: Math.max(at(-0.1), at(0.5)),
    top: sort(top),
    bottom: sort(bottom),
    plan: sort(plan),
    // the lower face leaning forward (y 1.2..1.9) and the windscreen's plane (1.9..2.9)
    face: { lean: [at(0), 1.2, at(-0.1), 1.9] as [number, number, number, number], screen: [at(-0.1), 1.9, at(0.1), 2.9] as [number, number, number, number] },
  };
}

/** The motor car: 15.52 m over buffers, the BMP's x -0.26 .. 15.26 m (body 0.6 .. 14.4 m). */
const MOTOR_MAP: SideMap = { x0: 15.26, H: 4, kY: K_Y };
/** Ax and Bx: 22.40 m over buffers, x -0.2 .. 22.2 m. */
const TRAILER_MAP: SideMap = { x0: 22.2, H: 4, kY: K_Y };
/** Btx: its cab at the BMP's right; 22.06 m over buffers, x -0.1 .. 21.96 m, mirrored so the cab is at +X. */
const BTX_MAP: SideMap = { x0: -0.1, H: 4, k: -1, kY: K_Y };

const motorCabs = () => {
  const a = cabFront(0.7, -1, 3.5);
  const b = cabFront(14.3, 1, 3.5);
  return [{ ...a, e: 1 }, { ...b, e: -1 }];
};

/** Ax and Bx z_both: the window frames' columns, rows 9..20, the drop lights' sash bars at row 15. */
const TRAILER_WINDOW_COLUMNS: Array<[number, number]> = [[21, 30], [34, 44], [49, 60], [65, 76], [81, 92], [97, 108], [112, 123], [128, 139], [144, 155], [160, 171], [176, 186], [190, 199]];
const trailerWindows = (frostedFirst: boolean): Window[] =>
  TRAILER_WINDOW_COLUMNS.map(([a, b], i) => ({ box: [a, 9, b, 20] as PxBox, sash: 15, ...(frostedFirst && i === 0 ? { frosted: true } : {}) }));

const trailerDoors = (): CarLayout["doors"] => [
  { box: [10, 8, 18, 28], glass: [11, 9, 17, 20], rails: [9.5, 18.5] },
  { box: [202, 8, 210, 28], glass: [203, 9, 209, 20], rails: [201.5, 210.5] },
];

function trailer(key: string, frosted: boolean, cls: string): CarLayout {
  return {
    key,
    map: TRAILER_MAP,
    length: 22.4,
    kZ: K_Z_TRAILER,
    section: TRAILER_SECTION,
    plan: [[0.5, 1.45 * K_Z_TRAILER], [21.5, 1.45 * K_Z_TRAILER]],
    top: [],
    bottom: [[0.5, 1.0], [21.5, 1.0]],
    bands: [[1.0, 3.3, "red"], [3.3, 3.6, "roof"]],
    cabs: [],
    windows: trailerWindows(frosted),
    doors: trailerDoors(),
    grilles: [],
    louvres: [],
    lines: [{ box: [21, 7, 199, 8], mat: "yellow" }],
    numerals: [{ text: cls, u: 32.5 }, { text: cls, u: 188.5 }],
    bogies: { x: [3.25, 18.75], wb: 2.5, motor: false },
    gangways: [1, -1],
    beams: { front: 0.5, rear: 21.5 },
  };
}

const LAYOUTS: Record<MdmotUnit, CarLayout> = {
  motorCar: {
    key: "mav_mdmot",
    map: MOTOR_MAP,
    length: 15.52,
    kZ: K_Z_MOTOR,
    section: MOTOR_SECTION,
    plan: [[1.2, 1.4 * K_Z_MOTOR], [13.8, 1.4 * K_Z_MOTOR]],
    // the roof hump over the radiators (XML x 4.6 .. 6.3, 3.8 m)
    top: [[1.2, 3.5], [4.6, 3.5], [4.9, 3.8], [6.0, 3.8], [6.3, 3.5], [13.8, 3.5]],
    bottom: [[1.2, 0.4], [1.5, 0.4], [1.6, 0.9], [13.4, 0.9], [13.5, 0.4], [13.8, 0.4]],
    bands: [[0.4, 1.0, "sill"], [1.0, 2.9, "red"], [2.9, 3.9, "roof"]],
    cabs: motorCabs(),
    // z_both: the cab windows, the compartment windows by the cab doors, the machine room's windows
    windows: [12, 30, 48, 72, 95, 117, 133].map((u, i): Window => ({ box: [u, 12, [17, 33, 55, 78, 102, 120, 138][i]!, 19] as PxBox })),
    doors: [
      { box: [23, 11, 28, 29], glass: [24, 12, 27, 19], rails: [28.5] },
      { box: [122, 11, 127, 29], glass: [123, 12, 126, 19], rails: [121.5] },
    ],
    grilles: [[58, 12, 69, 19], [81, 12, 92, 19]],
    // the radiator louvres on the hump's and the roof's sides
    louvres: [[46, 5.3, 54, 10], [55, 5.3, 63, 10], [67, 5.3, 74, 10]],
    lines: [],
    numerals: [],
    bogies: { x: [3.475, 11.525], wb: 2.4, motor: true },
    gangways: [],
    beams: { front: 1.2, rear: 13.8 },
  },
  trailerAx: trailer("mav_ax", false, "1"),
  trailerBx: trailer("mav_bx", true, "2"),
  drivingTrailer: {
    key: "mav_btx",
    map: BTX_MAP,
    length: 22.06,
    kZ: K_Z_TRAILER,
    section: TRAILER_SECTION,
    plan: [[0.6, 1.45 * K_Z_TRAILER], [20.8, 1.45 * K_Z_TRAILER]],
    top: [],
    bottom: [[0.6, 1.0], [20.4, 1.0], [20.5, 0.4], [20.8, 0.4]],
    bands: [[1.0, 3.3, "red"], [3.3, 3.6, "roof"]],
    cabs: [{ ...cabFront(21.3, 1, 3.6), e: 1 }],
    windows: [
      ...[22, 35, 51, 67, 83, 99, 115, 131].map((u, i): Window => ({ box: [u, 9, u + (i === 0 ? 9 : 10), 20] as PxBox, sash: 15, ...(i === 0 ? { frosted: true } : {}) })),
      // the baggage room's window and the cab's side window
      { box: [173, 12, 180, 19] },
      { box: [203, 10, 208, 20] },
    ],
    doors: [
      { box: [11, 8, 19, 28], glass: [12, 9, 18, 20], rails: [10.5, 19.5] },
      { box: [147, 8, 155, 28], glass: [148, 9, 154, 20], rails: [146.5, 155.5] },
      // the baggage room's double door
      { box: [184, 9, 195, 28], glass: [185, 12, 188, 19], rails: [189.5], baggage: true },
    ],
    grilles: [[164, 10, 171, 20]],
    louvres: [],
    lines: [{ box: [22, 7, 146, 8], mat: "yellow" }],
    numerals: [{ text: "2", u: 32.5 }, { text: "2", u: 143.5 }],
    bogies: { x: [3.1, 18.6], wb: 2.5, motor: false },
    gangways: [-1],
    beams: { front: 21.3, rear: 0.6 },
  },
};

/** The design's cars' lengths over buffers. */
export function mdmotLength(unit: MdmotUnit): number {
  return LAYOUTS[unit].length;
}

export const MDMOT_MAPS: Record<MdmotUnit, SideMap> = { motorCar: MOTOR_MAP, trailerAx: TRAILER_MAP, trailerBx: TRAILER_MAP, drivingTrailer: BTX_MAP };

/** A car's volumes in body metres: the body, then each cab's nose. */
function volumesMdmot(L: CarLayout): Volume[] {
  const B = (x: number) => bOf(L.map, x);
  const asc = (pts: Pt[]) => pts.map(([x, y]): Pt => [B(x), y * K_Y]).sort((a, b) => a[0] - b[0]);
  const ascPlan = (pts: Pt[]) => pts.map(([x, h]): Pt => [B(x), h]).sort((a, b) => a[0] - b[0]);
  const body: Volume = {
    name: "body",
    section: L.section,
    plan: ascPlan(L.plan),
    ...(L.top.length ? { top: asc(L.top) } : {}),
    bottom: asc(L.bottom),
    bands: L.bands.map(([a, b, mat]): [number, number, string] => [a * K_Y, b * K_Y, mat]),
  };
  return [body, ...L.cabs.map((cab): Volume => ({ name: "nose", section: L.section, plan: ascPlan(cab.plan.map(([x, h]): Pt => [x, h * L.kZ])), top: asc(cab.top), bottom: asc(cab.bottom), bands: NOSE_BANDS }))];
}

/** A car of the MAV MDmot set. */
export function mavMdmot(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(MDMOT_PARAMS, params).unit as MdmotUnit;
  const L = LAYOUTS[unit];
  const c = new Coach(PALETTE, L.length / 2);
  const m = c.m;
  const B = (x: number) => bOf(L.map, x);
  const [body, ...noses] = volumesMdmot(L);
  // the passenger doors open through doorways, so an open one shows the interior (doors.ts)
  body.openings = [1, -1].flatMap((s) => L.doors.filter((d) => !passengerDoorShut(d)).map((d) => c.doorOpening(s, sideBox(L.map, d.box), 0.025)));
  m.scope("body", () => {
    c.volume(body);
    noses.forEach((nose, i) => m.scope(L.cabs.length > 1 ? `cab ${i + 1}` : "cab", () => c.volume(nose)));
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => sideWork(c, body, L, s));
  });
  L.cabs.forEach((cab, i) => m.scope(i === 0 ? "front end" : "rear end", () => cabEnd(c, L, cab)));
  for (const e of L.gangways) m.scope(e > 0 ? "front end" : "rear end", () => gangwayEnd(c, body, L, e));
  m.scope("buffers", () => {
    for (const e of [1, -1]) {
      const ends = [B(L.beams.front), B(L.beams.rear)];
      const beam = e > 0 ? Math.max(...ends) : Math.min(...ends);
      const head = e > 0 ? L.length : 0;
      m.scope(e > 0 ? "front" : "rear", () => {
        m.scope("buffer beam", () => blockX(m, "beam", c.X(head) - e * 0.62, c.X(beam) - e * 0.05, 0.78, 1.28, -1.3, 1.3));
        c.buffers(e, head, head - e * 0.62, 1.04);
        c.coupling(e, head, head - e * 0.62, 1.04);
      });
    }
  });
  if (unit === "motorCar") m.scope("roof equipment", () => motorRoof(c, L));
  m.scope("running gear", () => {
    L.bogies.x.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(c, c.X(B(x)), { wb: L.bogies.wb, r: 0.46, motor: L.bogies.motor, top: unit === "motorCar" ? 0.9 : 1.0, frame: 1.0 })));
    m.scope("underframe", () => {
      const mid = L.length / 2;
      if (unit === "motorCar") {
        // the engine and transmission under the machine room, the fuel tank
        m.scope("transmission", () => block(m, "engine", c.X(mid - 1.4), c.X(mid + 1.4), 0.35, 0.9, -0.9, 0.9));
        m.scope("fuel tank", () => block(m, "engine", c.X(mid - 1.0), c.X(mid + 1.0), 0.4, 0.9, -1.3, -0.95));
      } else {
        m.scope("battery boxes", () => block(m, "beam", c.X(mid - 2.6), c.X(mid - 0.8), 0.45, 1.0, -1.25, 1.25));
        m.scope("water tank", () => m.sweep("engine", "x", ngon(10, 0.32, 0, 0, 0.66), c.X(mid + 0.6), ngon(10, 0.32, 0, 0, 0.66), c.X(mid + 3.0)));
      }
    });
  });
  return m;
}

/** Windows, doors, grilles, lines and markings on side s. */
/** A door that stays shut: the baggage room's, or one narrower than 0.8 m (a crew door). */
function passengerDoorShut(d: CarLayout["doors"][number]): boolean {
  return !!d.baggage || d.box[2] - d.box[0] < 8;
}

function sideWork(c: Coach, v: Volume, L: CarLayout, s: number): void {
  const m = c.m;
  const box = (b: PxBox) => sideBox(L.map, b);
  m.scope("windows", () =>
    L.windows.forEach((w, i) =>
      m.scope(`window ${i + 1}`, () => c.window(v, s, box(w.box), { fw: 0.08, ...(w.frosted ? { glass: "frosted" } : {}), ...(w.sash !== undefined ? { sash: L.map.H - w.sash / 10 } : {}) })),
    ),
  );
  m.scope("doors", () =>
    L.doors.forEach((d, i) =>
      m.scope(`door ${i + 1}`, () => {
        // a passenger door: one sliding plug leaf toward the car's middle, its window
        // riding on it (doors.ts); the baggage room's and the crew doors stay shut
        const b = box(d.box);
        if (passengerDoorShut(d)) {
          c.door(v, s, b, "doorGrey", { seam: 0.025 });
          m.scope("window", () => c.window(v, s, box(d.glass), { fw: 0.05 }));
          return;
        }
        c.door(v, s, b, "doorGrey", {
          seam: 0.025,
          opens: { kind: "plug", leaves: 1, toward: c.X((b.x0 + b.x1) / 2) < 0 ? "high" : "low" },
          leafWork: (clip) => {
            const w = clip(box(d.glass));
            if (w) c.m.scope("window", () => c.window(v, s, w, { fw: 0.05 }));
          },
        });
        m.scope("handrails", () => {
          for (const u of d.rails) {
            const b = box([u - 0.5, 13, u + 0.5, 28]);
            c.handrail(v, s, (b.x0 + b.x1) / 2, b.y0, b.y1);
          }
        });
        m.scope("step", () => {
          const b = box(d.box);
          for (const y of [0.6, 0.85]) block(m, "beam", c.X(b.x0) + 0.05, c.X(b.x1) - 0.05, y - 0.03, y, ...side(s, 1.15, 1.4));
          for (const x of [b.x0 + 0.05, b.x1 - 0.08]) block(m, "beam", c.X(x), c.X(x) + 0.03, 0.5, 1.0, ...side(s, 1.15, 1.4));
        });
      }),
    ),
  );
  m.scope("grilles", () => L.grilles.forEach((g, i) => m.scope(`grille ${i + 1}`, () => louvred(c, v, s, box(g), "grille"))));
  m.scope("roof louvres", () => L.louvres.forEach((g, i) => m.scope(`louvre ${i + 1}`, () => c.sidePanel(v, "louvre", s, box(g), 0.008, 0.02))));
  m.scope("lines", () => L.lines.forEach((l, i) => m.scope(`line ${i + 1}`, () => c.sidePanel(v, l.mat, s, box(l.box), 0.004, 0.003))));
  m.scope("class numerals", () =>
    L.numerals.forEach((n) => {
      const b = box([n.u - 1, 10, n.u + 1, 16]);
      c.numeral(v, s, n.text, (b.x0 + b.x1) / 2, b.y0, b.y1 - b.y0, 0.006, "marking");
    }),
  );
}

/** A grille: a frame and horizontal slats. */
function louvred(c: Coach, v: Volume, s: number, b: Box, mat: string): void {
  c.sidePanel(v, "beam", s, b, 0.006, 0.02);
  const n = Math.max(2, Math.round((b.y1 - b.y0) / 0.12));
  for (let i = 0; i < n; i++) {
    const y0 = b.y0 + 0.05 + ((b.y1 - b.y0 - 0.1) * i) / n;
    c.sidePanel(v, mat, s, { x0: b.x0 + 0.05, x1: b.x1 - 0.05, y0, y1: y0 + ((b.y1 - b.y0 - 0.1) / n) * 0.55 }, 0.014, 0.006);
  }
}

/** Front-view columns (30 px across 3 m, seen from ahead of the cab) to z, and rows to height (4 m canvas). */
const fz = (u: number) => (1.5 - u / 10) * K_Z_MOTOR;
const fy = (v: number) => K_Y * (4 - v / 10);

/** A cab end: windscreens, the top lamp, the lamps and number plate in the cream band. */
function cabEnd(c: Coach, L: CarLayout, cab: CarLayout["cabs"][number]): void {
  const m = c.m;
  const B = (x: number) => bOf(L.map, x);
  const e = cab.e;
  const P = (q: [number, number, number, number]) => ({ x0: c.X(B(q[0])), y0: q[1] * K_Y, x1: c.X(B(q[2])), y1: q[3] * K_Y });
  const screen = P(cab.face.screen);
  const lean = P(cab.face.lean);
  // x_both: two windscreens, rows 12..18, columns 4..15 and 17..28
  m.scope("windscreens", () => {
    slopePanel(m, "beam", e, screen, e * fz(3.6), e * fz(28.4), fy(18.4), fy(11.6), 0.006, 0.01);
    for (const [a, b] of [[4, 15], [17, 28]] as const) slopePanel(m, "cabGlass", e, screen, e * fz(a), e * fz(b), fy(18), fy(12), 0.014, 0.006);
  });
  m.scope("lamps", () => {
    for (const [k, u] of [9.5, 22.5].entries())
      m.scope(`lamp ${k + 1}`, () => {
        slopePanel(m, "beam", e, lean, e * fz(u - 1.6), e * fz(u + 1.6), fy(26.4), fy(23.6), 0.006, 0.01);
        slopePanel(m, "lampWhite", e, lean, e * fz(u - 1), e * fz(u + 1), fy(26), fy(24), 0.014, 0.006);
      });
    for (const u of [5.5, 26.5]) slopePanel(m, "lampRed", e, lean, e * fz(u - 0.6), e * fz(u + 0.6), fy(25.6), fy(24.4), 0.012, 0.006);
  });
  m.scope("number plate", () => slopePanel(m, "plate", e, lean, e * fz(12), e * fz(21), fy(26), fy(23), 0.008, 0.006));
  // the roof headlight in its housing over the windscreens (x_both columns 14..18, rows 4..10)
  // its face stands at the windscreen's top edge, its housing reaches back over the roof's slope
  m.scope("top lamp", () => {
    const x = c.X(B(cab.face.screen[2]));
    blockX(m, "darkRed", x - e * 0.37, x + e * 0.02, 3.0 * K_Y, 3.6 * K_Y, -0.2, 0.2);
    const lens = ngon(10, 0.13, 0, 0, 3.3 * K_Y);
    m.sweep("lampWhite", "x", lens, x + e * 0.02, lens, x + e * 0.035);
  });
}

/** A gangway end: the bellows, the end door and the tail lamps (x_both of Ax/Bx, x_inc of Btx). */
function gangwayEnd(c: Coach, v: Volume, L: CarLayout, e: number): void {
  const m = c.m;
  const wall = e > 0 ? v.plan[v.plan.length - 1]![0] : v.plan[0]![0];
  const face = e > 0 ? L.length - 0.25 : 0.25;
  const X = (b: number) => c.X(b);
  const gz = (u: number) => (1.5 - u / 10) * K_Z_TRAILER;
  m.scope("gangway", () => {
    const [a, b] = [X(wall) - e * 0.02, X(face)].sort((p, q) => p - q) as [number, number];
    for (const z of [-1, 1]) block(m, "rubber", a, b, fy(28), fy(5), ...side(z, 0.42, 0.95));
    block(m, "rubber", a, b, fy(7), fy(5), -0.42, 0.42);
    block(m, "rubber", a, b, fy(28), fy(26.5), -0.42, 0.42);
  });
  m.scope("end door", () => c.door(v, e, { x0: gz(19), x1: gz(12), y0: fy(26), y1: fy(4.5) }, "doorGrey", { end: true, seam: 0.025 }));
  m.scope("end door window", () => c.window(v, e, { x0: gz(18), x1: gz(13), y0: fy(20), y1: fy(9) }, { end: true, fw: 0.05 }));
  m.scope("tail lamps", () => {
    for (const z of [-1.15, 1.15]) {
      const lens = ngon(8, 0.06, 0, z, 1.45);
      m.sweep("lampRed", "x", lens, X(wall) + e * 0.002, lens, X(wall) + e * 0.03);
    }
  });
}

/** The motor car's roof: the radiator hump's top grille, the exhaust stacks and the horns. */
function motorRoof(c: Coach, L: CarLayout): void {
  const m = c.m;
  const X = (x: number) => c.X(bOf(L.map, x));
  m.scope("radiator fans", () => {
    for (const x of [5.15, 5.75]) {
      const fan = ngon(12, 0.24, 0, X(x), 0);
      m.prism("louvre", fan, 3.79 * K_Y, 3.83 * K_Y);
    }
  });
  m.scope("exhaust stacks", () => {
    for (const [x0, x1] of [[7.2, 7.5], [7.7, 8.0], [8.2, 8.5]] as const) {
      m.emit("smoke", [(X(x0) + X(x1)) / 2, 3.72 * K_Y, 0], 0.15);
      block(m, "roofDark", X(x1), X(x0), 3.45 * K_Y, 3.72 * K_Y, -0.18, 0.18);
    }
  });
  m.scope("horns", () => {
    for (const x of [2.2, 12.8]) m.sweep("roofDark", "x", ngon(8, 0.05, 0, 0.35, 3.58 * K_Y), X(x) - 0.2, ngon(8, 0.09, 0, 0.35, 3.58 * K_Y), X(x) + 0.2);
  });
}

/**
 * A car of the MDmot set for distant views (lodUnits.ts): the cab noses
 * leaning forward to the windscreens with their cream and orange bands, the
 * bodies' sections and bands, the side window band, the bogies and the
 * underframe equipment.
 */
export function mavMdmotLod(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(MDMOT_PARAMS, params).unit as MdmotUnit;
  const L = LAYOUTS[unit];
  const centre = L.length / 2;
  const X = (x: number) => bOf(L.map, x) - centre;
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const vols = volumesMdmot(L);
  const motor = unit === "motorCar";
  const glass = [...L.windows.map((w) => w.box), ...L.doors.map((d) => d.glass)].map((b) => sideBox(L.map, b)).map((b) => ({ ...b, x0: b.x0 - centre, x1: b.x1 - centre }));
  const screen = [{ u: [fz(28.4), fz(3.6)] as const, y: [fy(18.4), fy(11.6)] as const, mat: LOD_GLASS }];
  const ends = (e: number) => (L.cabs.some((c) => (X(c.x0) + X(c.x1)) * e > 0) ? screen : undefined);
  const [fw, rw] = [ends(1), ends(-1)];
  const shell = coachBody(vols.map(place), { y0: motor ? 0.9 * K_Y : 1.0 * K_Y, main: 0, windows: sideGlass(glass, 0.6), ...(fw ? { frontWindows: fw } : {}), ...(rw ? { rearWindows: rw } : {}) });
  return fitUnit({
    palette: PALETTE,
    bodies: [shell],
    parts: [
      ...bogieParts(L.bogies.x.map((x) => [X(x), L.bogies.wb / 2 + 0.46 + 0.2] as const), shell.y0),
      motor ? underPart(-1.4, 1.4, 0.35, shell.y0, 0.9) : underPart(-2.6, 3.0, 0.45, shell.y0, 1.25),
      // the motor car's roof hump over the radiators
      ...(motor ? [{ ...roofPart("roof", X(6.3), X(4.6), 0.6 * K_Z_MOTOR, 0.6 * K_Z_MOTOR, 3.45 * K_Y, 3.8 * K_Y), optional: undefined }] : []),
    ],
  }, 100);
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const MAV_MDMOT_GAME: GameProperties = {
  weight: 41,
  power: 590,
  maxspeed: 100,
  accel: null,
  variants: [
    { params: { unit: "trailerAx" }, power: 0 },
    { params: { unit: "trailerBx" }, power: 0 },
    { params: { unit: "drivingTrailer" }, power: 100 },
  ],
};

export const MDMOT_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-mav-mdmot", game: MAV_MDMOT_GAME, title: "MAV MDmot", build: mavMdmot, buildLod: mavMdmotLod, params: MDMOT_PARAMS, catalog: DMU_CATALOG, references: "mav-mdmot" },
];

export { LAYOUTS as MDMOT_LAYOUTS };
