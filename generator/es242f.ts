// The Renfe 242F "Confederacion" (2'D2' h2, a 4-8-4 Northern), the ten oil-fired
// express engines La Maquinista Terrestre y Maritima built in 1955-56 for the
// Madrid - Hendaye line, as the preserved 242F 2009 stands in the Museo del
// Ferrocarril de Madrid (Delicias), with its two-bogie tender, drawn on the steam
// kit (steamLoco.ts). Matched to the three-quarter views of 2009 from both sides,
// its head-on view and the close-ups of its smokebox front
// (assets/renfe-242f/SOURCES.md) and the published figures (engine 17.48 m long,
// engine wheelbase 13.20 m, engine and tender 22.93 m, drivers 1,900 mm,
// cylinders 640 x 710 mm, 142.5 t engine, 70.2 t tender, 2,700 hp, 140 km/h):
// the "lagarto" green of the long boiler on 3.2 m, the long black smokebox (the
// class's lengthened one) with its dished door, brass dart wheel and the big
// brass-rimmed headlamp with the white "2009" number box on top, the double
// Kylchap chimney in its oval casing behind the smoke deflectors, the long
// green casing over the domes behind the smokebox, the huge rounded-rectangle
// smoke deflectors standing high above the running board and flaring outward
// at the top (green outside, black inside), the black steam pipe casings and
// poppet valve chests over the black cylinders, the running board on 2.25 m with
// its red edge dropping in a steep S to the deep red buffer beam lettered
// "RENFE 242F 2009" with the square buffer heads and the grey chequer-plate
// front deck, the four coupled wheels black with red hubs and ochre tyres, the
// red coupling and main rods (the main rod drives the second coupled axle), the
// leading bogie and the trailing Delta truck, the cab with its two side windows
// reaching down below the running board, and the flat-sided tender with its
// chamfered rear top corners and the oil bunker's dark top.
//
// Scales (all photographs perspective views, so measured along the wheels by a
// 1-D projective fit over the four equally spaced drivers): photo 01 about
// 63 px/m at the rear driver to 150 px/m at the front bogie; the Gilardi view
// 70.5 px/m at the third driver (radius 67 px for 0.95 m). Heights from the
// Gilardi view at the drivers' plane (running board 2.27 m) and from the
// ratios of the head-on view (deflector top 1.46 m above the smokebox centre,
// door ring 1.95 m across).
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { block } from "./vehicleParts.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** The "lagarto" green of 2009 today, the black works, the red edges and beam. */
const GREEN = "#2f8f55";
const BLACK = "#1b1c1f";
const RED = "#bd2229";

const PALETTE: Record<string, MaterialSpec> = {
  paint: mat(GREEN, 0.35),
  wheel: mat(BLACK, 0.6),
  frame: mat(BLACK, 0.7),
  black: mat("#17181a", 0.7),
  red: mat(RED, 0.5),
  beam: mat(RED, 0.5),
  smokebox: mat("#16171a", 0.55),
  roof: mat("#26282b", 0.8),
  // the grey chequer plate of the front deck
  deck: { color: "#53575d", metallic: 0.3, roughness: 0.6 },
  // the ochre-lined tyres of the coupled and carrying wheels
  tyre: { color: "#a7864a", metallic: 0.35, roughness: 0.45 },
  rod: { color: "#b9bec3", metallic: 0.4, roughness: 0.35 },
  steel: { color: "#8c9197", metallic: 0.45, roughness: 0.4 },
  brass: { color: "#c49a48", metallic: 0.6, roughness: 0.3 },
  plate: mat(RED, 0.45),
  plateText: { color: "#d8b45a", metallic: 0.55, roughness: 0.3 },
  numBox: mat("#e9e7df", 0.5),
  numText: mat("#151517", 0.6),
};

export const RENFE242F_NUMBER = "242F 2009";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const RENFE242F_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "Renfe 242F", lead: 2, coupled: 4, trail: 2, leadD: 0.92, coupledD: 1.9, trailD: 1.0, boilerR: 0.98, deflectors: "wagner", domes: 1, palette: { paint: GREEN, wheel: BLACK, frame: BLACK, smokebox: "#16171a" }, tender: { length: 9.5, axles: 4, d: 0.95 }, number: RENFE242F_NUMBER },
};

// --- the engine: 17.48 m, axles 2.6 + 1.9 + 1.5 + 3 x 1.95 + 2.0 + 1.95 (13.20 m) ---

const LEAD = [2.6, 4.5];
const COUPLED = [6.0, 7.95, 9.9, 11.85];
const TRAIL = [13.85, 15.8];
/** The engine's rear head; the tender's front head meets it. */
const END = 17.48;
/** Boiler centre, barrel radius; the running board's top. */
const BY = 3.2;
const BR = 0.98;
const RB = 2.25;
/** The lengthened smokebox from 2.1 to 6.0 m; the firebox from 11.9 m; the cab. */
const SMOKEBOX = [2.1, 6.0] as const;
const FIREBOX = 11.9;
const CAB0 = 14.8;
const CAB1 = 17.3;
/** The running board's half width. */
const HALF = 1.42;

/** The cab's right half section: its sheets reach 0.5 m below the running board; a low round roof. */
const CAB_HALF: Pt[] = [[1.45, 1.75], [1.45, 3.98], [1.33, 4.2], [0.88, 4.35], [0, 4.4]];

/** The smoke deflectors: front and rear edge, foot and top, the plane at the foot and at the top (they flare out). */
const DEF = { x0: 2.05, x1: 4.95, y0: 2.78, y1: 4.45, z0: 1.3, z1: 1.47, r: 0.22 };

/** A rounded rectangle in (x, y): its corners cut by `seg` facets of radius r. */
function roundedRect(x0: number, x1: number, y0: number, y1: number, r: number, seg = 3): Pt[] {
  const out: Pt[] = [];
  const corners: Array<[number, number, number]> = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
  for (const [cx, cy, a0] of corners) for (let i = 0; i <= seg; i++) {
    const a = a0 + (i / seg) * (Math.PI / 2);
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** The deflector plane's |z| at height y (flaring from z0 at the foot to z1 at the top). */
const defZ = (y: number): number => DEF.z0 + ((y - DEF.y0) / (DEF.y1 - DEF.y0)) * (DEF.z1 - DEF.z0);

function deflectors(t: Steam): void {
  const m = t.m;
  const outline = roundedRect(DEF.x0, DEF.x1, DEF.y0, DEF.y1, DEF.r);
  const n: Vec3 = [0, -(DEF.z1 - DEF.z0), DEF.y1 - DEF.y0];
  const L = Math.hypot(n[1], n[2]);
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      // the plate's outward normal (y, z): tilted down as the plate leans out
      const [ny, nz] = [n[1] / L, n[2] / L];
      const at = (x: number, y: number, off: number): Vec3 => [t.X(x), y + ny * off, s * (defZ(y) + nz * off)];
      // green outside, black inside, 3 mm apart
      m.slab("paint", outline.map(([x, y]) => at(x, y, 0.025)), [0, -ny * 0.022, -s * nz * 0.022]);
      m.slab("black", outline.map(([x, y]) => at(x, y, 0)).reverse(), [0, -ny * 0.012, -s * nz * 0.012]);
      // two stays from the plate's inside to the smokebox
      for (const x of [2.6, 4.3]) m.rod("black", [t.X(x), 3.9, s * (defZ(3.9) - 0.02)], [t.X(x), BY + 0.45, s * (BR * 0.86)], 0.022, 6);
    }
  });
}

function front(t: Steam): void {
  const m = t.m;
  const X0 = t.X(SMOKEBOX[0]);
  m.scope("smokebox door", () => {
    // the dished door standing out of the front ring
    const rings = [[0, 0.8], [0.06, 0.74], [0.11, 0.6], [0.14, 0.4], [0.155, 0.18]] as const;
    for (let i = 0; i + 1 < rings.length; i++) {
      const [da, ra] = rings[i]!;
      const [db, rb] = rings[i + 1]!;
      m.sweep("smokebox", "x", ngon(20, BR * ra, Math.PI / 20, 0, BY), X0 + 0.07 + da, ngon(20, BR * rb, Math.PI / 20, 0, BY), X0 + 0.07 + db, i === rings.length - 2);
    }
    // the brass dart wheel and handle
    m.tube("brass", "x", 0, BY + 0.1, 0.15, 0.12, X0 + 0.22, X0 + 0.25, 10);
    m.rod("brass", [X0 + 0.235, BY + 0.1, 0], [X0 + 0.235, BY - 0.12, 0], 0.015, 6);
    // the hinge straps on the right, the clamps round the rim
    for (const dy of [-0.4, 0.35]) block(m, "steel", X0 + 0.06, X0 + 0.1, BY + dy - 0.035, BY + dy + 0.035, -BR * 0.95, -BR * 0.55);
  });
  m.scope("headlamp", () => {
    // the big brass-rimmed headlamp on a bracket on the smokebox top, the number box beside it
    const y = BY + BR + 0.21;
    const x = SMOKEBOX[0] + 0.12;
    t.box("black", x - 0.05, x + 0.35, BY + BR - 0.1, y - 0.19, -0.16, 0.16);
    t.cylX("black", x - 0.02, x + 0.38, 0, y, 0.18, 14);
    m.tube("brass", "x", 0, y, 0.2, 0.15, t.X(x) + 0.01, t.X(x) + 0.08, 14);
    const lens = ngon(14, 0.155, 0, 0, y);
    m.sweep("lampHead", "x", lens, t.X(x) + 0.02, lens, t.X(x) + 0.05);
    // the number box on the lamp's left (seen from ahead: on the right of the lamp is z < 0)
    const [z0, z1] = [0.2, 0.62];
    t.box("black", x + 0.02, x + 0.3, y - 0.14, y + 0.12, z0, z1);
    const X = t.X(x + 0.02) + 0.004;
    block(m, "numBox", X - 0.01, X + 0.004, y - 0.11, y + 0.09, z0 + 0.03, z1 - 0.03);
    const h = 0.13;
    const w = h * 0.58;
    const gap = h * 0.2;
    const width = strokeWidth("2009", w, gap);
    const u0 = (z0 + z1) / 2 + width / 2;
    m.facets("numText", strokeText("2009", u0, y - 0.075, h, w, gap, true).map(([u, v]): Vec3 => [X + 0.008, v, u]), [1, 0, 0]);
  });
  m.scope("front deck", () => {
    // the chequer-plate deck from the beam to the smokebox foot; its sloping sides drop to the beam corners
    t.box("deck", 0.66, SMOKEBOX[0] + 0.1, 1.24, 1.32, -1.0, 1.0);
    t.box("deck", 1.1, SMOKEBOX[0] + 0.15, 1.32, BY - BR * 0.75, -0.7, 0.7);
  });
  m.scope("square buffer heads", () => {
    // 2009's rectangular buffer heads, 0.42 m wide and 0.36 m high, over the kit's round ones
    for (const z of [-0.875, 0.875]) t.box("steel", -0.012, 0.05, 1.06 - 0.18, 1.06 + 0.18, z - 0.21, z + 0.21);
  });
  m.scope("beam lettering", () => {
    // "RENFE" left of the coupling and "242F 2009" right of it, in brass on the beam face (seen from ahead)
    const X = t.X(0.62) + 0.008;
    const h = 0.11;
    const w = h * 0.58;
    const gap = h * 0.2;
    for (const [text, zc] of [["RENFE", 0.55], ["242F 2009", -0.58]] as const) {
      const width = strokeWidth(text, w, gap);
      m.facets("plateText", strokeText(text, zc + width / 2, 0.86, h, w, gap, true).map(([u, v]): Vec3 => [X, v, u]), [1, 0, 0]);
    }
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  deflectors(t);
  front(t);
  m.scope("chimney casing", () => {
    // the double Kylchap chimney's oval casing: two chimneys in tandem
    t.dome(5.3, BY + BR * 0.8, 4.5, 0.36, 1.15, "smokebox");
    t.cylY("smokebox", 5.0, 0, 4.4, 4.55, 0.24, 12);
  });
  m.scope("feed-water drum", () => {
    // the drum lying along the smokebox top behind the headlamp
    t.cylX("smokebox", 2.75, 3.85, 0, BY + BR + 0.13, 0.21, 12);
    for (const x of [2.95, 3.65]) t.box("smokebox", x - 0.05, x + 0.05, BY + BR - 0.05, BY + BR + 0.02, -0.14, 0.14);
  });
  m.scope("steam pipe casings", () => {
    // the black casings from the smokebox down to the valve chests, under the deflectors
    for (const s of [-1, 1]) {
      const pts: Vec3[] = [[t.X(3.2), RB, s * 1.22], [t.X(4.7), RB, s * 1.22], [t.X(4.6), DEF.y0 + 0.05, s * 0.98], [t.X(3.4), DEF.y0 + 0.05, s * 0.98]];
      m.slab("smokebox", pts, [0, 0, -s * 0.3]);
    }
  });
  m.scope("boiler pipes", () => {
    // the pipes along the boiler's sides and the lubricators on the running board
    for (const s of [-1, 1]) {
      for (const [dy, r] of [[0.55, 0.03], [0.7, 0.025]] as const) {
        const z = s * Math.sqrt(Math.max(0, (BR + 0.06) ** 2 - dy * dy));
        t.cylX("black", SMOKEBOX[1], FIREBOX + 1.2, z, BY + dy, r, 6);
      }
      for (const x of [6.6, 7.3, 8.6]) t.sideBox("black", s, x - 0.25, x + 0.25, RB, RB + 0.32, 1.0, 1.3);
    }
  });
  m.scope("frame valance", () => {
    // the black plate under the running board's red edge, the length of the engine
    for (const s of [-1, 1]) t.sideBox("black", s, 4.9, CAB0, RB - 0.34, RB - 0.16, HALF - 0.1, HALF - 0.06);
  });
  m.scope("cab number", () => {
    // the round RENFE emblem above the number plate
    for (const s of [-1, 1]) {
      const ring = ngon(12, 0.13, 0, t.X(15.95), 3.05);
      m.sweep("plate", "z", ring, s * 1.446, ring, s * 1.462);
    }
  });
  m.scope("cab roof vent", () => t.box("roof", 15.4, 16.5, 4.42, 4.5, -0.35, 0.35));
}

function engine(): LocoSpec {
  return {
    title: "Renfe 242F",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.55, y1: 1.25, length: [0.62, 0.3], half: 1.45 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], n: 28 },
    chimney: { x: 5.55, top: 4.55, r: 0.26 },
    // the long casing over the domes behind the smokebox
    domes: [{ x: 7.55, top: 4.5, r: 0.5, len: 3.0 }],
    valves: { x: 13.0, top: 4.38 },
    handrail: { x0: 6.0, x1: 14.6, y: BY },
    runningBoard: { profile: [[0.62, 1.32], [1.05, 1.32], [1.3, 1.4], [2.45, 2.12], [2.75, RB], [CAB1 - 0.02, RB]], half: HALF, valance: 0.12, mat: "deck", valanceMat: "red" },
    frame: { x0: 1.0, x1: CAB1, top: RB - 0.1 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.98,
      // the narrow front window and the wide one behind it
      windows: [{ x0: 15.0, x1: 15.42, y0: 3.2, y1: 3.92 }, { x0: 15.55, x1: 16.35, y0: 3.2, y1: 3.92 }],
      front: [{ z0: 1.0, z1: 1.38, y0: 3.3, y1: 3.85 }, { z0: -1.38, z1: -1.0, y0: 3.3, y1: 3.85 }],
    },
    // the round-topped firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: FIREBOX, x1: CAB0, half: [[BR + 0.05, RB], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR + 0.03]] }],
    bogies: [
      { x0: LEAD[0]! - 0.6, x1: LEAD[1]! + 0.55, y: 0.55 },
      { x0: TRAIL[0]! - 0.6, x1: TRAIL[1]! + 0.55, y: 0.62 },
    ],
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: 0.92, spokes: 10, outsideBoxes: true })),
        ...COUPLED.map((x) => ({ x, d: 1.9, spokes: 20 })),
        ...TRAIL.map((x) => ({ x, d: 1.0, spokes: 10, outsideBoxes: true })),
      ],
      // two outside cylinders 640 x 710 mm over the bogie's rear axle; the main rods drive the second coupled axle
      engines: [{ coupled: [2, 3, 4, 5], main: 3, cylinder: { x0: 3.45, x1: 4.75, y: 1.12, r: 0.38 }, crank: 0.355, phase: 0.3, valveGear: true }],
      cylinderZ: 1.14, reference: 3, wheelMaterial: "wheel", couplingMat: "red", mainMat: "red", cylinderMat: "black", cylinderCoverMat: "black",
      cylinderDressing: (m, s, c) => {
        // the poppet valve chest: a square black box from the cylinder up to the running board
        block(m, "black", c.x0 + 0.05, c.x1 - 0.05, c.y + c.r * 0.55, RB - 0.17, Math.min(s * (Math.abs(c.z) - 0.3), s * (Math.abs(c.z) + 0.24)), Math.max(s * (Math.abs(c.z) - 0.3), s * (Math.abs(c.z) + 0.24)));
      },
    },
    lamps: { front: [[0.9, 1.32, 1.0], [0.9, 1.32, -1.0]], rear: [[CAB1 - 0.05, 1.32, 0.7], [CAB1 - 0.05, 1.32, -0.7]] },
    number: { text: RENFE242F_NUMBER, side: [15.95, 2.55, CAB_HALF[0]![0]] },
    extras: engineExtras,
  };
}

// --- the tender: 9.5 m, two bogies, axles 1.8 m apart, 22.93 m from the engine's first axle to its last ---

const T_AXLES = [1.65, 3.45, 6.25, 8.05];
const T_END = 9.5;
const TANK = [0.55, 9.0] as const;
const TANK_FOOT = 1.55;
const TANK_TOP = 3.75;
const T_HALF = 1.45;

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("tank foot", () => {
    // the red edge along the tank's foot and the black frame under it
    for (const s of [-1, 1]) {
      t.sideBox("red", s, TANK[0] - 0.02, TANK[1] + 0.02, TANK_FOOT - 0.1, TANK_FOOT + 0.02, T_HALF - 0.02, T_HALF + 0.03);
      t.sideBox("black", s, 0.5, 9.05, 1.0, TANK_FOOT - 0.1, T_HALF - 0.2, T_HALF - 0.08);
    }
  });
  m.scope("front shield", () => {
    // the raised front of the oil bunker toward the cab
    t.section("roof", TANK[0], TANK[0] + 0.7, mirrored([[1.2, TANK_TOP - 0.05], [1.2, 3.95], [0.95, 4.05], [0, 4.08]]));
  });
  m.scope("tank details", () => {
    for (const s of [-1, 1]) {
      // the red plate and emblem on the tank side
      t.sideBox("plate", s, 3.85, 4.25, 2.95, 3.15, T_HALF - 0.004, T_HALF + 0.012);
      // ladder rungs at the rear corner
      t.sideBox("steel", s, 8.75, 8.79, TANK_FOOT, 3.2, T_HALF, T_HALF + 0.05);
    }
    t.cylY("roof", 7.6, 0, TANK_TOP - 0.05, TANK_TOP + 0.12, 0.25, 10);
  });
  m.scope("numbers", () => t.endPlate(-1, TANK[1], 2.3, "2009"));
}

function tender(): LocoSpec {
  return {
    title: "Renfe 242F tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.75, y1: 1.25, length: [0.3, 0.62], half: 1.44 },
    frame: { x0: 0.5, x1: 9.05, top: TANK_FOOT - 0.08 },
    volumes: [{
      name: "tank",
      sec: mirrored([[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.12], [T_HALF - 0.12, TANK_TOP], [0, TANK_TOP + 0.04]]),
      plan: [[TANK[0], T_HALF], [TANK[1], T_HALF]],
      // the rear top corners chamfered down to 3.0 m
      top: [[TANK[0], TANK_TOP + 0.04], [TANK[1] - 0.65, TANK_TOP + 0.04], [TANK[1], 3.0]],
      bands: [[TANK_FOOT, TANK_TOP - 0.06, "paint"], [TANK_TOP - 0.06, TANK_TOP + 0.04, "roof"]],
    }],
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.6 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.6 }],
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 0.95, spokes: 0, outsideBoxes: true })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[9.0, 1.3, 0.85], [9.0, 1.3, -0.85]] },
    extras: tenderExtras,
  };
}

/** The 242F's engine or tender spec, by the `unit` parameter's value. */
export function renfe242fSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/** The distant model's spec: the deflectors as the kit's flat plates (the LOD adapter draws spec deflectors, not extras). */
export function renfe242fLodSpec(unit: string): LocoSpec {
  const s = renfe242fSpec(unit);
  if (unit === "tender") return s;
  return { ...s, deflectors: { outlines: [[[DEF.x0, DEF.y0], [DEF.x1, DEF.y0], [DEF.x1, DEF.y1], [DEF.x0 + 0.15, DEF.y1], [DEF.x0, DEF.y1 - 0.15]]], z: (DEF.z0 + DEF.z1) / 2 } };
}
