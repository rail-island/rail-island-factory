// The BBO 214 (proc-vehicle-bbo-214, Floridsdorf, 1928-1936), Austria's largest
// express steam locomotive, a 1'D2' h2 (2-8-4 Berkshire) with its four-axle
// tender, drawn on the steam kit (steamLoco.ts) as the preserved 12.10 (built
// 1936) appears today, measured on the reference photographs
// (assets/bbo-214/SOURCES.md; docs/models/austria-trains.md):
//
// - the running gear: the leading axle 1.41 m behind the buffers, four coupled
//   drivers of 1,940 mm 2.15 m apart, the two-axle trailing truck under the wide
//   firebox and the cab; two outside cylinders 650 x 720 mm behind the leading
//   axle, the 4.25 m main rods (the longest ever built) driving the third coupled
//   axle; coupling and main rods painted red, the wheels black with bright tyres;
// - the big boiler on 3.3 m, the short chimney close behind the smokebox door,
//   the long flat-topped casing over the domes, the feed-water heater drum on the
//   left running board and the air pumps on the right;
// - the large plate deflectors from the high running board (2.3 m) up to 4.05 m,
//   the running board falling steeply to the buffer beam in front, the step plates
//   under the deflectors;
// - the cab with its small front and large rear side window and the arched roof;
//   the tender's tall front part over the low rear tank, 6.45 m over the buffers
//   (22.58 m engine and tender).
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import type { MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import type { Pt, Steam } from "./steamParts.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** All black, the rods red, the numbers painted white (12.10 in the Technisches Museum Wien). */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.6),
  wheel: mat("#1f2022", 0.65),
  frame: mat("#232325", 0.8),
  red: mat("#a3221f", 0.55),
  beam: mat("#1d1e20", 0.6),
  smokebox: mat("#1b1c1f", 0.85),
  roof: mat("#28292b", 0.8),
  plate: mat("#1a1b1d", 0.6),
  plateText: mat("#e6e4dc", 0.5),
  steel: { color: "#4a4d52", metallic: 0.3, roughness: 0.55 },
  doorRing: { color: "#303236", metallic: 0.3, roughness: 0.55 },
  bright: { color: "#a9adb2", metallic: 0.5, roughness: 0.35 },
};

const NUMBER = "12.10";

// --- the engine: 16.13 m from the front buffer heads to the drawbar's middle ---

const LEAD = 1.41;
const COUPLED = [4.41, 6.56, 8.71, 10.86];
const TRAIL = [12.55, 14.6];
const END = 16.13;
/** Boiler centre and radius, the running board's top. */
const BY = 3.3;
const BR = 0.95;
const RB = 2.3;
const SMOKEBOX = [1.5, 3.2] as const;
const CAB0 = 13.44;
const CAB1 = 15.7;
const HALF = 1.47;
/** The deflector plates' plane, their front, back and top. */
const DEFL_Z = 1.44;
const DEFL = [1.3, 3.95] as const;
const DEFL_TOP = 4.05;

/** The cab's right half section: the sheets down to 1.7 m, the arched roof to 4.5 m. */
const CAB_HALF: Pt[] = [[HALF, 1.7], [HALF, 3.95], [1.38, 4.22], [0.9, 4.42], [0, 4.48]];

function engineExtras(t: Steam): void {
  const m = t.m;
  m.scope("feed-water heater", () => {
    // the long drum on the running board beside the boiler (+z, the side the 1980 photo shows), its pipe to the smokebox
    t.cylX("paint", 5.3, 8.7, 1.12, RB + 0.27, 0.25, 14);
    m.rod("paint", [t.X(5.3), RB + 0.4, 1.05], [t.X(3.4), BY - 0.2, 0.92], 0.04, 6);
    // the box just behind the deflector
    t.box("paint", 4.05, 4.9, RB, RB + 0.55, 0.95, 1.4);
  });
  m.scope("air pumps", () => {
    // two upright pumps on the other running board (the 2007 photo's side)
    for (const x of [6.45, 6.95]) {
      t.cylY("paint", x, -1.13, RB, 3.35, 0.15, 10);
      t.cylY("steel", x, -1.13, 3.35, 3.42, 0.1, 8);
    }
  });
  m.scope("lamp hand loops", () => {
    // the bright loops over the two buffer-beam lamps
    for (const z of [-0.85, 0.85]) {
      const x = t.X(0.66);
      const pts: Array<[number, number, number]> = [[x, 1.5, z - 0.17], [x, 1.85, z - 0.14], [x, 1.95, z], [x, 1.85, z + 0.14], [x, 1.5, z + 0.17]];
      for (let i = 0; i + 1 < pts.length; i++) m.rod("bright", pts[i]!, pts[i + 1]!, 0.015, 6);
    }
  });
  m.scope("step plates", () => {
    // the plates under the deflectors' front, on the sloping running board, with their step openings
    for (const s of [-1, 1]) for (const [x0, y0] of [[0.92, 1.62], [1.12, 1.95]] as const) {
      t.sideBox("black", s, x0, x0 + 0.24, y0, y0 + 0.08, DEFL_Z - 0.2, DEFL_Z + 0.03);
    }
  });
  m.scope("smokebox door ring", () => {
    m.tube("doorRing", "x", 0, BY, BR + 0.05, BR * 0.9, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.035, 28);
  });
  m.scope("cab roof vent", () => t.box("roof", 13.9, 15.0, 4.5, 4.58, -0.3, 0.3));
}

function engine(): LocoSpec {
  return {
    title: "BBO 214",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.85, y1: 1.38, length: [0.55, 0.3], half: 1.44 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [4.6, 6.2, 7.8, 9.4], band: "paint", n: 28 },
    chimney: { x: 2.2, top: 4.6, r: 0.33 },
    // the long casing over the sand and steam domes
    domes: [{ x: 6.65, top: 4.5, r: 0.62, len: 6.5 }],
    valves: { x: 12.4, top: 4.5 },
    handrail: { x0: 3.4, x1: 12.6, y: BY + 0.25 },
    runningBoard: { profile: [[0.6, 1.43], [0.75, 1.43], [1.3, RB], [CAB0 + 0.05, RB]], half: HALF - 0.04, valance: 0.12 },
    frame: { x0: 0.6, x1: END - 0.1, top: 2.12 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.95,
      windows: [{ x0: 13.6, x1: 14.02, y0: 3.25, y1: 3.75 }, { x0: 14.55, x1: 15.35, y0: 3.15, y1: 3.8 }],
      front: [{ z0: 0.98, z1: 1.36, y0: 3.45, y1: 3.95 }, { z0: -1.36, z1: -0.98, y0: 3.45, y1: 3.95 }],
    },
    // the round-topped firebox over the trailing truck, down to the running board
    prisms: [{ name: "firebox", x0: 10.6, x1: CAB0, half: [[BR + 0.08, RB], [BR + 0.08, BY + 0.3], [BR * 0.86, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR + 0.02]] }],
    deflectors: {
      outlines: [
        // the step plate on the sloping front running board, then the tall plate
        [[0.66, 1.45], [1.9, 1.45], [1.9, RB - 0.02], [1.3, RB - 0.02]],
        [[DEFL[0], RB - 0.02], [DEFL[1], RB - 0.02], [DEFL[1], DEFL_TOP], [DEFL[0], DEFL_TOP]],
      ],
      z: DEFL_Z,
    },
    bogies: [
      { x0: LEAD - 0.65, x1: LEAD + 0.65, y: 0.55 },
      { x0: TRAIL[0]! - 0.7, x1: TRAIL[1]! + 0.7, y: 0.6 },
    ],
    gear: {
      wheels: [
        { x: LEAD, d: 1.034, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.94, spokes: 20 })),
        ...TRAIL.map((x) => ({ x, d: 1.034, spokes: 12 })),
      ],
      // two outside cylinders 650 x 720 mm; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.95, x1: 3.1, y: 1.1, r: 0.4 }, crank: 0.36, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "wheel", couplingMat: "red", mainMat: "red", cylinderCoverMat: "paint",
    },
    lamps: { front: [[0.62, 1.45, 0.85], [0.62, 1.45, -0.85]], rear: [[CAB1 - 0.05, 1.45, 0.7], [CAB1 - 0.05, 1.45, -0.7]] },
    number: { text: NUMBER, side: [13.95, 2.75, HALF], front: [SMOKEBOX[0] - 0.075, BY + 0.35] },
    extras: engineExtras,
  };
}

// --- the tender: 6.45 m over the buffers, four axles ---

const T_END = 6.45;
const T_AXLES = [0.95, 2.4, 3.85, 5.3];
const TANK = [0.35, 5.83] as const;
const TANK_FOOT = 1.08;
const TANK_TOP = 3.1;
const T_HALF = 1.48;
/** The tall front part over the coal space, its top. */
const UPPER = [0.35, 3.76] as const;
const UPPER_TOP = 4.0;

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("paint", s, TANK[0], TANK[1], 1.02, TANK_FOOT + 0.02, T_HALF - 0.14, T_HALF - 0.02);
  });
  m.scope("outside frames", () => {
    // the plate frames outside the wheels, with an axle box and spring over each axle
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, TANK[0] + 0.1, TANK[1] - 0.1, 0.72, TANK_FOOT - 0.06, 1.02, 1.07);
      for (const x of T_AXLES) {
        t.sideBox("black", s, x - 0.16, x + 0.16, 0.4, 0.72, 1.02, 1.12);
        t.sideBox("steel", s, x - 0.45, x + 0.45, 0.76, 0.84, 1.074, 1.12);
      }
    }
  });
  m.scope("lid", () => t.box("roof", 1.0, 2.6, UPPER_TOP - 0.01, UPPER_TOP + 0.05, -0.7, 0.7));
  m.scope("rear handrail", () => {
    t.box("steel", TANK[1] + 0.005, TANK[1] + 0.07, 2.55, 2.59, -1.0, 1.0);
    for (const z of [-1.0, 1.0]) t.box("steel", TANK[1] + 0.005, TANK[1] + 0.07, 2.4, 2.59, z - 0.02, z + 0.02);
  });
}

function tender(): LocoSpec {
  return {
    title: "BBO 214 tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.85, y1: 1.38, length: [0.3, 0.62], half: 1.44 },
    frame: { x0: TANK[0], x1: TANK[1], top: TANK_FOOT + 0.02 },
    prisms: [
      { name: "tank", x0: TANK[0], x1: TANK[1], half: [[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.06], [T_HALF - 0.06, TANK_TOP]] },
      { name: "upper box", x0: UPPER[0], x1: UPPER[1], half: [[T_HALF - 0.04, TANK_TOP - 0.02], [T_HALF - 0.04, UPPER_TOP - 0.08], [T_HALF - 0.12, UPPER_TOP]] },
    ],
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[TANK[1] + 0.02, 1.45, 0.85], [TANK[1] + 0.02, 1.45, -0.85]] },
    extras: tenderExtras,
  };
}

/** The engine's or tender's spec, by the `unit` parameter's value. */
export function bbo214Spec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

const unitOf = (v?: ParamValues) => resolveParams([UNIT_PARAM], v).unit!;
export function bbo214(v?: ParamValues): MeshBuilder { return buildLoco(bbo214Spec(unitOf(v))); }
export function bbo214Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(bbo214Spec(unitOf(v))); }

/** 123.5 t in service (the 1936 batch), 2,162 kW indicated, 120 km/h; the tender 60 t. */
const GAME: GameProperties = { weight: 123.5, power: 2162, maxspeed: 120, accel: null, variants: [{ params: { unit: "tender" }, weight: 60, power: 0 }] };

/** The registry entry (generator/atLocos.ts). */
export const BBO214_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-bbo-214", title: "BBO 214", build: bbo214, buildLod: bbo214Lod, params: [UNIT_PARAM],
  game: GAME, catalog: STEAM_CATALOG, references: "bbo-214",
};
