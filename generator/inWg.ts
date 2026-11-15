// The Indian Railways WG class Mikado (1'D1' h2, 1950 - 1970, 2,450 built) with
// its bogie tender, drawn on the steam kit (steamLoco.ts) from the North British
// works photograph of 8301 (side-on, 51.6 px/m along the engine), photographs of
// 8082 at Kotshila and 10491 at Bareilly (assets/ir-wg/SOURCES.md) and the
// published figures (23.85 m over the buffers, 1,562 mm drivers): the long
// plain smokebox with its flat round door, the headlamp on a bracket at its top
// front, the stovepipe chimney, the long dome casing, three pop valves, the high
// running board sloping down at the front to a full-width deck over the buffer
// beam and dropping behind the drivers to the low cab floor, the deep cab with
// its rear louvred shutter, the grid cowcatcher, and the high tender on two
// bogies with its front crew cowl. Black, the boiler bands white, the buffer
// beam red, the tyres white and the cab and tender panels lined in yellow.
// See docs/models/india-trains.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { steamLocoLod } from "./lodSteam.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** The running number: 10491 (CLW 1966/7), photographed at Bareilly in 1993. */
const NUMBER = "10491";

const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  black: mat("#18181a", 0.75),
  smokebox: mat("#1c1d22", 0.85),
  frame: mat("#232326", 0.7),
  wheel: mat("#1d1e20", 0.6),
  lining: mat("#d9b54a", 0.5),
  beam: mat("#b01e22", 0.55),
  // the tyres' rims, the boiler bands and the smokebox ring in white or silver paint
  tyre: { color: "#d4d7da", metallic: 0.4, roughness: 0.35 },
  white: mat("#e3e3de", 0.5),
  chrome: { color: "#c9cdd1", metallic: 0.6, roughness: 0.25 },
  steel: { color: "#aeb3b8", metallic: 0.4, roughness: 0.35 },
  pilot: mat("#3a3b3e", 0.7),
  // the cab-side number plate: brass yellow with black figures (8082)
  plate: mat("#d9b54a", 0.45),
  plateText: mat("#1d1e20", 0.5),
  numberYellow: mat("#e3b53a", 0.45),
  coal: { color: "#2a2b2e", metallic: 0.1, roughness: 0.8 },
};

// --- the engine: 15.05 m over its buffers; 23.85 m with the tender ---

/** Pony truck, coupled axles (5 ft 1 1/2 in drivers, 1.8 m apart), trailing truck: measured on the works photograph. */
const LEAD = 1.74;
const COUPLED = [4.73, 6.53, 8.33, 10.13];
const TRAIL = 13.14;
/** The carrying wheels: both about 0.98 m on the photograph (50 px against the drivers' 80). */
const LEAD_D = 0.98;
const DRIVER_D = 1.562;
/** The engine's rear buffer heads. */
const END = 15.05;
/** Boiler centre and radius (the WP's boiler), the running board's top. */
const BY = 2.98;
const BR = 0.92;
const RB = 2.2;
/** The smokebox from its front to the barrel; the cab; the half width. */
const SMOKEBOX = [2.0, 4.9] as const;
const CAB0 = 12.62;
const CAB1 = 14.72;
const HALF = 1.58;
/** The cab side sheets' foot, below the running board, and where their chamfered front corner reaches it. */
const FLOOR = 1.6;
const CHAMFER = 13.05;
/** The running board: a full-width deck from the front apron up to the high board, level to the cab. */
const BOARD: Pt[] = [[0.62, 1.7], [1.95, RB], [END - 0.2, RB]];
/** The beam's height. */
const BEAM: [number, number] = [0.78, 1.33];

/** The cab's right half section over the running board, its roof about the boiler top; the side sheets below are drawn in engineExtras. */
const CAB_HALF: Pt[] = [[HALF, RB - 0.08], [HALF, 3.5], [1.47, 3.78], [0.95, 3.95], [0, 4.04]];

function engineExtras(t: Steam): void {
  const m = t.m;
  const X0 = t.X(SMOKEBOX[0]);
  m.scope("smokebox front", () => {
    // the white ring round the flat front and the door's own ring
    m.tube("white", "x", 0, BY, BR + 0.06, BR - 0.01, X0 - 0.03, X0 + 0.01, 24, Math.PI / 24);
    m.tube("white", "x", 0, BY, BR * 0.86, BR * 0.8, X0 + 0.07, X0 + 0.092, 24, Math.PI / 24);
  });
  m.scope("headlamp", () => {
    // the electric headlamp on its bracket at the smokebox's top front
    t.box("smokebox", 1.9, 2.15, 3.6, 3.8, -0.12, 0.12);
    t.cylX("smokebox", 1.75, 2.08, 0, 4.0, 0.22, 16);
    const lens = ngon(16, 0.17, Math.PI / 16, 0, 4.0);
    m.sweep("lampHead", "x", lens, t.X(1.75) - 0.01, lens, t.X(1.75) + 0.008);
    m.tube("chrome", "x", 0, 4.0, 0.225, 0.17, t.X(1.75) - 0.02, t.X(1.75) + 0.02, 16, Math.PI / 16);
  });
  m.scope("front apron", () => {
    // the plate from the beam up to the deck's front edge, the marker lamps on it
    t.box("black", 0.58, 0.612, BEAM[1] + 0.005, 1.66, -(HALF - 0.08), HALF - 0.08);
  });
  m.scope("lubricator", () => {
    // the mechanical lubricator on the running board beside the smokebox, both sides
    for (const s of [-1, 1]) {
      t.sideBox("black", s, 2.8, 3.4, RB, 2.55, 1.12, 1.42);
      t.sideBox("steel", s, 2.85, 3.35, 2.55, 2.6, 1.15, 1.39);
    }
  });
  m.scope("pop valves", () => {
    for (const x of [9.1, 9.42, 9.74]) {
      t.cylY("brass", x, 0, BY + BR * 0.9, 4.06, 0.075, 10);
      t.cylY("brass", x, 0, 4.06, 4.12, 0.1, 10);
    }
  });
  m.scope("top feed", () => t.cylY("paint", 8.85, 0, BY + BR * 0.9, 4.08, 0.12, 10));
  m.scope("snifting valve", () => t.cylY("smokebox", 4.7, 0, BY + BR * 0.9, 4.1, 0.08, 8));
  m.scope("whistle", () => t.cylY("brass", CAB0 - 0.3, 0.35, BY + BR * 0.85, BY + BR + 0.3, 0.04, 8));
  m.scope("ejector pipe", () => {
    // the long pipe along the right of the boiler, from the cab to the smokebox
    m.rod("steel", [t.X(CAB0 - 0.05), 3.15, 0.95], [t.X(SMOKEBOX[1] + 0.2), 3.15, 0.95], 0.045, 6);
    m.rod("steel", [t.X(SMOKEBOX[1] + 0.2), 3.15, 0.95], [t.X(SMOKEBOX[1] - 0.3), 2.75, 1.0], 0.045, 6);
  });
  m.scope("front handrails", () => {
    // from the beam's ends up past the deck to the smokebox sides
    for (const s of [-1, 1]) {
      const p: Vec3[] = [[t.X(0.66), 1.36, s * 1.42], [t.X(1.15), 2.4, s * 1.36], [t.X(1.6), 2.95, s * 1.22], [t.X(2.15), 3.0, s * 1.04]];
      for (let i = 0; i + 1 < p.length; i++) m.rod("chrome", p[i]!, p[i + 1]!, 0.022, 6);
    }
  });
  m.scope("cowcatcher", () => {
    // the grid pilot: four bars raked back toward the rail, on uprights
    const rows = [0.68, 0.52, 0.36, 0.2];
    const front = (y: number) => 0.5 + (0.74 - y) * 0.3;
    for (const y of rows) {
      const half = 1.4 - (0.74 - y) * 0.2;
      t.box("pilot", front(y), front(y) + 0.07, y - 0.055, y + 0.055, -half, half);
    }
    // the slats behind the bars, raked with them
    for (let i = 0; i < 10; i++) {
      const z = -1.17 + i * 0.26;
      m.rod("pilot", [t.X(front(0.74) + 0.1), 0.76, z], [t.X(front(0.14) + 0.1), 0.14, z], 0.03, 4);
    }
  });
  m.scope("buffer beam figures", () => {
    // the number and class in yellow on the red beam between the buffers
    const X = t.X(0.55) + 0.006;
    const h = 0.15;
    const text = (s: string, z: number) => {
      const w = h * 0.58, gap = h * 0.18;
      const width = strokeWidth(s, w, gap);
      m.facets("numberYellow", strokeText(s, z + width / 2, 1.1, h, w, gap, true).map(([u, v]): Vec3 => [X, v, u]), [1, 0, 0]);
    };
    text(NUMBER, 0.3);
    text("WG", -0.45);
  });
  m.scope("cab side sheets", () => {
    // the sheets down past the running board to the step, their front corner chamfered
    const k = RB - 0.06;
    for (const s of [-1, 1]) {
      const z = s * (HALF + 0.004);
      const pts: Vec3[] = [[t.X(CAB0 + 0.02), k, z], [t.X(CHAMFER), FLOOR, z], [t.X(CAB1), FLOOR, z], [t.X(CAB1), k, z]];
      m.slab("paint", pts, [0, 0, -s * 0.03]);
    }
  });
  m.scope("cab lining", () => {
    // a yellow-lined panel under the window, both sides
    for (const s of [-1, 1]) lined(t, s, CHAMFER + 0.15, CAB1 - 0.12, FLOOR + 0.1, 2.45, HALF + 0.006);
  });
  m.scope("cab shutter", () => {
    // the louvred shutter over the rear doorway
    for (const s of [-1, 1]) {
      t.sideBox("black", s, 13.95, 14.62, 2.58, 3.37, HALF - 0.004, HALF + 0.012);
      for (let i = 0; i < 7; i++) t.sideBox("steel", s, 14.0, 14.57, 2.65 + i * 0.105, 2.68 + i * 0.105, HALF + 0.012, HALF + 0.03);
    }
  });
  m.scope("cab roof vent", () => t.box("roof", 12.3, 13.4, 4.03, 4.11, -0.4, 0.4));
  m.scope("cab handrails", () => {
    for (const s of [-1, 1]) t.sideBox("chrome", s, CAB1 - 0.06, CAB1 - 0.03, 1.6, 3.2, HALF + 0.02, HALF + 0.05);
  });
}

/** A lined panel on side s: four yellow strips 4 cm wide on the face at |z| = face. */
function lined(t: Steam, s: number, x0: number, x1: number, y0: number, y1: number, face: number): void {
  const w = 0.04;
  const [a, b] = [face - 0.004, face + 0.006];
  t.sideBox("lining", s, x0, x1, y0, y0 + w, a, b);
  t.sideBox("lining", s, x0, x1, y1 - w, y1, a, b);
  t.sideBox("lining", s, x0, x0 + w, y0 + w, y1 - w, a, b);
  t.sideBox("lining", s, x1 - w, x1, y0 + w, y1 - w, a, b);
}

function engine(): LocoSpec {
  // the white bands: at the smokebox joint, along the barrel (under the dome casing) and at the firebox
  const bands = [4.97, 6.3, 7.7, 9.0, 10.3];
  return {
    title: "IR WG",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: BEAM[0], y1: BEAM[1], length: [0.55, 0.3], half: 1.5 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands, band: "white", n: 24 },
    // the stovepipe chimney on the smokebox top
    chimney: { x: 3.28, top: 4.22, r: 0.3 },
    // the long dome casing (sand and steam dome together)
    domes: [{ x: 7.15, top: 4.2, r: 0.45, len: 1.85 }],
    handrail: { x0: 2.3, x1: CAB0 - 0.3, y: 3.62 },
    runningBoard: { profile: BOARD, half: HALF - 0.06, valance: 0.1 },
    // the bar frames' top, clear under the high running board
    frame: { x0: 0.66, x1: END - 0.2, top: 1.81 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.5,
      windows: [{ x0: 13.2, x1: 13.86, y0: 2.58, y1: 3.37 }],
      front: [{ z0: 1.02, z1: 1.42, y0: 2.85, y1: 3.35 }, { z0: -1.42, z1: -1.02, y0: 2.85, y1: 3.35 }],
    },
    // the round-topped firebox behind the barrel, clear of the rear drivers below
    prisms: [{ name: "firebox", x0: 11.0, x1: CAB0 + 0.05, half: [[BR + 0.05, RB - 0.02], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR]] }],
    bogies: [
      { x0: LEAD - 0.7, x1: LEAD + 0.7, y: LEAD_D * 0.62 },
      { x0: TRAIL - 0.75, x1: TRAIL + 0.75, y: LEAD_D * 0.62 },
    ],
    gear: {
      wheels: [
        { x: LEAD, d: LEAD_D, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: DRIVER_D, spokes: 18 })),
        { x: TRAIL, d: LEAD_D, spokes: 12 },
      ],
      // two outside cylinders 21 7/8 x 28 in behind the pony wheel; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 2.3, x1: 3.45, y: 1.06, r: 0.38 }, crank: 0.356, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 3, wheelMaterial: "wheel", cylinderCoverMat: "chrome",
    },
    lamps: { front: [[0.375, 1.335, 0.72], [0.375, 1.335, -0.72]], rear: [[CAB1 - 0.05, FLOOR + 0.05, 0.7], [CAB1 - 0.05, FLOOR + 0.05, -0.7]] },
    number: { text: NUMBER, side: [13.85, 2.03, HALF + 0.034] },
    extras: (t) => engineExtras(t),
  };
}

// --- the bogie tender: 8.8 m over the buffers, 22.8 m3 of water and 18 t of coal ---

const T_END = 8.8;
const T_AXLES = [0.94, 3.0, 5.45, 7.5];
const T_D = 0.914;
const TANK = [0.36, 8.21] as const;
const TANK_FOOT = 1.3;
const TANK_TOP = 3.48;
/** The tank's lower back from STEP, sloping up to the full height over STEP..STEP_SLOPE. */
const STEP = 7.0;
const STEP_SLOPE = 7.48;
const STEP_TOP = 3.16;
/** The crew's cowl at the front, up to the cab roof, its top sloping down behind to the tank top. */
const COWL = [0.36, 1.55] as const;
const COWL_SLOPE = 2.55;
const COWL_TOP = 4.02;
const COWL_HALF = HALF - 0.12;

/** A wedge across the tender between |z| = half: the (x, y) outline swept across. */
function wedge(t: Steam, mat: string, outline: Pt[], half: number): void {
  const ring = outline.map(([x, y]): Pt => [t.X(x), y]);
  t.m.sweep(mat, "z", ring, -half, ring, half);
}

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("cowl slope", () => wedge(t, "paint", [[COWL[1] - 0.02, TANK_TOP - 0.03], [COWL_SLOPE, TANK_TOP - 0.03], [COWL[1] - 0.02, COWL_TOP - 0.15]], COWL_HALF));
  m.scope("tank slope", () => wedge(t, "paint", [[STEP - 0.02, STEP_TOP - 0.04], [STEP_SLOPE, STEP_TOP - 0.04], [STEP - 0.02, TANK_TOP]], HALF - 0.004));
  m.scope("coal pusher", () => wedge(t, "black", [[5.9, TANK_TOP - 0.02], [6.75, TANK_TOP - 0.02], [6.3, 3.9]], 0.9));
  m.scope("lining", () => {
    // the yellow-lined panel along the tank's lower side
    for (const s of [-1, 1]) lined(t, s, TANK[0] + 0.15, TANK[1] - 0.15, TANK_FOOT + 0.12, 2.45, HALF);
  });
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("black", s, 0.3, 8.3, 0.98, TANK_FOOT + 0.04, HALF - 0.16, HALF - 0.04);
  });
  m.scope("louvres", () => {
    // the vents in the tank's front corners, under the cowl
    for (const s of [-1, 1]) {
      t.sideBox("black", s, 0.42, 1.08, 2.58, 3.38, HALF - 0.004, HALF + 0.01);
      for (let i = 0; i < 7; i++) t.sideBox("steel", s, 0.47, 1.03, 2.65 + i * 0.105, 2.68 + i * 0.105, HALF + 0.01, HALF + 0.026);
    }
  });
  m.scope("water filler", () => t.cylY("paint", 7.85, 0, STEP_TOP - 0.02, STEP_TOP + 0.12, 0.28, 12));
  m.scope("rear ladder", () => {
    for (const z of [-0.3, 0.3]) t.box("chrome", TANK[1] + 0.03, TANK[1] + 0.06, 1.4, STEP_TOP, z - 0.02, z + 0.02);
    for (let i = 0; i < 5; i++) t.box("chrome", TANK[1] + 0.03, TANK[1] + 0.06, 1.6 + i * 0.33, 1.63 + i * 0.33, -0.3, 0.3);
  });
  m.scope("numbers", () => t.endPlate(-1, TANK[1], 2.6, NUMBER));
}

/** The cast bogie side frames: an axle box over each wheel, the arched members between them, the bolster spring. */
function bogieFrame(t: Steam, f: { x0: number; x1: number; y: number }): void {
  const [a, b] = [f.x0 + 0.6, f.x1 - 0.6];
  const c = (a + b) / 2;
  for (const s of [-1, 1]) {
    for (const x of [a, b]) t.sideBox("black", s, x - 0.16, x + 0.16, 0.36, 0.78, 0.86, 1.02);
    const z = s * 0.99;
    m3(t, [[a + 0.16, 0.74], [c - 0.45, 0.92], [c + 0.45, 0.92], [b - 0.16, 0.74]], z);
    m3(t, [[a + 0.16, 0.42], [c - 0.45, 0.36], [c + 0.45, 0.36], [b - 0.16, 0.42]], z);
    t.sideBox("steel", s, c - 0.22, c + 0.22, 0.48, 0.66, 0.9, 1.0);
  }
}

/** A bar along the (x, y) polyline at z. */
function m3(t: Steam, pts: Pt[], z: number): void {
  for (let i = 0; i + 1 < pts.length; i++) t.m.rod("black", [t.X(pts[i]![0]), pts[i]![1], z], [t.X(pts[i + 1]![0]), pts[i + 1]![1], z], 0.045, 4);
}

function tender(): LocoSpec {
  return {
    title: "IR WG tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: BEAM[0], y1: BEAM[1], length: [0.36, 0.55], half: 1.5 },
    frame: { x0: 0.3, x1: 8.3, top: TANK_FOOT + 0.02 },
    prisms: [
      { name: "tank", x0: TANK[0], x1: TANK[1], half: [[HALF, TANK_FOOT], [HALF, STEP_TOP - 0.06], [HALF - 0.06, STEP_TOP]] },
      { name: "tank top", x0: TANK[0], x1: STEP, half: [[HALF - 0.004, STEP_TOP - 0.1], [HALF - 0.004, TANK_TOP - 0.06], [HALF - 0.06, TANK_TOP]] },
      { name: "cowl", x0: COWL[0], x1: COWL[1], half: [[COWL_HALF, TANK_TOP - 0.03], [COWL_HALF, COWL_TOP - 0.15], [HALF - 0.3, COWL_TOP - 0.03], [0, COWL_TOP]] },
    ],
    coal: { x0: COWL_SLOPE + 0.05, x1: 5.85, y: TANK_TOP - 0.05, half: HALF - 0.25, rise: 0.32 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.58 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.58 }],
    drawOnTruckFrame: bogieFrame,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: T_D, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[8.3, 1.335, 0.7], [8.3, 1.335, -0.7]] },
    extras: (t) => tenderExtras(t),
  };
}

/** The WG's engine or tender spec, by the `unit` parameter's value. */
export function wgSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

export function wgLod(unit: string): MeshBuilder {
  return steamLocoLod(wgSpec(unit));
}
