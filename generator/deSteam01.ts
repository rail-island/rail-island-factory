// The DRG class 01 Pacific (2'C1' h2) with its 2'2' T 32 tender, drawn on the
// steam kit (steamLoco.ts) from the DEWAG side drawing of 01 005 and photographs
// of 01 118 (assets/drg-01/SOURCES.md): the long boiler on 3.1 m with its
// feed-water heater across the smokebox ahead of the chimney, the feed dome,
// sand dome and steam dome, the large Wagner smoke deflectors reaching down to
// the buffer beam, the running board on 2.19 m with its red edge, the red bar
// frames, wheels and trucks, the cab with its two side windows and long roof,
// and the tender's tank with the narrower coal box on it.
// See docs/models/world-steam.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import type { MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black upper works, red frames and wheels; the number plates black with brass figures (01 118 today). */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  wheel: mat("#a51a1f", 0.6),
  // the plate frames between the wheels drawn dark: the openings of the real bar frames, seen in shadow
  frame: mat("#2b2324", 0.8),
  red: mat("#a51a1f", 0.65),
  smokebox: mat("#1c1d22", 0.85),
  plate: mat("#141416", 0.5),
  coal: mat("#303033", 0.9),
  plateText: { color: "#d2ad4e", metallic: 0.45, roughness: 0.35 },
};

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const DRG01_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "DRG 01", lead: 2, coupled: 3, trail: 1, leadD: 0.85, coupledD: 2.0, trailD: 1.25, boilerR: 1.0, deflectors: "wagner", domes: 3, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.92, axles: 4, d: 1.0 }, number: "01 118" },
};

export const DRG01_NUMBER = "01 118";

// --- the engine (DEWAG drawing of 01 005: axles 1650 + 2200 + 1800 + 2300 + 2300 + 3800 from the buffers) ---

const LEAD = [1.65, 3.85];
const COUPLED = [5.65, 7.95, 10.25];
const TRAIL = 14.05;
/** The engine's rear head: 0.9 m behind the trailing axle, plus half the 150 mm gap to the tender. */
const END = 15.02;
/** Boiler centre (3,100 mm), radius over the lagging; the running board's top. */
const BY = 3.1;
const BR = 1.0;
const RB = 2.19;
/** The smokebox from 1.45 to 3.25 m, the cab from 13.2 m to the engine's end. */
const SMOKEBOX = [1.45, 3.25] as const;
const CAB0 = 13.2;
const CAB1 = 14.95;
/** The running boards' half width and the deflector plates' plane. */
const HALF = 1.42;
const DEFL_Z = 1.38;
const DEFL_TOP = 3.63;

/** The cab's right half section: the sheets reach down to 1.64 m below the running board; a high, round roof. */
const CAB_HALF: Pt[] = [[1.45, 1.64], [1.45, 3.66], [1.34, 3.9], [0.85, 4.1], [0, 4.16]];

function engineExtras(t: Steam): void {
  const m = t.m;
  m.scope("deflector lips", () => {
    // the plates' top edges turned in toward the smokebox
    for (const s of [-1, 1]) {
      const pts: Vec3[] = [[t.X(0.82), DEFL_TOP - 0.01, s * (DEFL_Z + 0.02)], [t.X(4.35), DEFL_TOP - 0.01, s * (DEFL_Z + 0.02)], [t.X(4.35), DEFL_TOP + 0.07, s * (DEFL_Z - 0.14)], [t.X(0.82), DEFL_TOP + 0.07, s * (DEFL_Z - 0.14)]];
      m.slab("paint", pts, [0, -0.025, 0]);
    }
  });
  m.scope("feed-water heater", () => {
    // the surface heater lies across the smokebox top ahead of the chimney; its end covers stand out of the sides
    t.cylZ("smokebox", 1.94, 3.77, -0.86, 0.86, 0.25, 12);
    for (const s of [-1, 1]) t.cylZ("black", 1.94, 3.77, s * 0.86, s * 0.9, 0.2, 12);
  });
  m.scope("feed pump", () => {
    // the Knorr feed pump on the right running board beside the boiler, its pipes to the heater
    t.cylY("smokebox", 6.9, 1.13, RB, 3.0, 0.14, 10);
    t.cylY("steel", 6.9, 1.13, 3.0, 3.06, 0.1, 10);
    m.rod("paint", [t.X(6.9), 3.05, 1.08], [t.X(4.4), 3.4, 1.0], 0.03, 6);
  });
  m.scope("sand pipes", () => {
    // from the sand dome round the boiler and down to the first and second drivers
    const r = BR + 0.05;
    for (const s of [-1, 1]) for (const [xa, xb] of [[7.1, 5.05], [7.45, 9.05]] as const) {
      const pts: Vec3[] = [60, 30, 0].map((deg, i): Vec3 => {
        const a = (deg * Math.PI) / 180;
        return [t.X(xa + (xb - xa) * 0.12 * i), BY + r * Math.sin(a), s * r * Math.cos(a)];
      });
      pts.push([t.X(xb), RB + 0.02, s * 1.02]);
      for (let i = 0; i + 1 < pts.length; i++) m.rod("paint", pts[i]!, pts[i + 1]!, 0.018, 6);
    }
  });
  m.scope("air reservoirs", () => {
    // the red air reservoirs under the running board between the last driver and the trailing truck
    for (const s of [-1, 1]) t.cylX("red", 11.55, 13.1, s * 1.18, 1.52, 0.21, 12);
  });
  m.scope("bar frames", () => {
    // the red top bars of the bar frames and their horn guides between the coupled wheels
    for (const s of [-1, 1]) {
      t.sideBox("red", s, 1.4, 13.1, 1.56, 1.75, 0.605, 0.645);
      for (const x of [4.55, 6.8, 9.1, 11.4]) t.sideBox("red", s, x - 0.07, x + 0.07, 0.95, 1.56, 0.605, 0.645);
    }
  });
  m.scope("cab roof vent", () => t.box("roof", 13.55, 14.75, 4.18, 4.3, -0.32, 0.32));
  m.scope("smokebox door wheel", () => {
    // the central locking hand wheel
    t.cylX("steel", SMOKEBOX[0] - 0.11, SMOKEBOX[0] - 0.075, 0, BY + 0.12, 0.14, 12);
  });
}

function engine(): LocoSpec {
  const bands = [5.29, 6.63, 7.97, 9.38, 10.71];
  return {
    title: "DRG 01",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.8, y1: 1.28, length: [0.65, 0.3], half: 1.44 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands, band: "black" },
    chimney: { x: 2.8, top: 4.55, r: 0.25 },
    // the feed dome, the sand dome and the steam dome: low, rounded covers
    domes: [{ x: 5.96, top: 4.33, r: 0.47, len: 1.0 }, { x: 7.27, top: 4.38, r: 0.42, len: 0.88 }, { x: 8.65, top: 4.34, r: 0.48, len: 1.05 }],
    valves: { x: 12.3, top: 4.36 },
    handrail: { x0: 4.5, x1: 12.6, y: BY + 0.3 },
    runningBoard: { profile: [[0.65, 1.33], [0.85, 1.33], [2.02, RB], [CAB1 - 0.02, RB]], half: HALF, valance: 0.1, valanceMat: "red" },
    // the bar frames, red, from behind the sloping front running board; above them the boiler and ashpan lie open
    frame: { x0: 1.4, x1: CAB1, top: 1.75 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.66,
      windows: [{ x0: 13.3, x1: 14.02, y0: 2.8, y1: 3.56 }, { x0: 14.11, x1: 14.83, y0: 2.8, y1: 3.56 }],
      front: [{ z0: 1.08, z1: 1.36, y0: 2.95, y1: 3.52 }, { z0: -1.36, z1: -1.08, y0: 2.95, y1: 3.52 }],
    },
    // the round-topped firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: 10.71, x1: CAB0, half: [[BR + 0.05, RB], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR]] }],
    // the Wagner plates: from the buffer beam up the sloping front running board, then 1.44 m tall to 4.35 m
    deflectors: {
      outlines: [
        [[0.62, 1.32], [0.85, 1.32], [2.0, RB - 0.02], [0.62, RB - 0.02]],
        [[0.62, RB - 0.02], [4.35, RB - 0.02], [4.35, DEFL_TOP], [0.82, DEFL_TOP], [0.68, DEFL_TOP - 0.06], [0.62, DEFL_TOP - 0.2]],
      ],
      z: DEFL_Z,
    },
    bogies: [
      { x0: LEAD[0]! - 0.6, x1: LEAD[1]! + 0.6, y: 0.53 },
      { x0: TRAIL - 0.8, x1: TRAIL + 0.45, y: 0.78 },
    ],
    bogieFrameMat: "red",
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: 0.85, spokes: 10, outsideBoxes: true })),
        ...COUPLED.map((x) => ({ x, d: 2.0, spokes: 20 })),
        { x: TRAIL, d: 1.25, spokes: 12 },
      ],
      // two outside cylinders 650 x 660 mm between the bogie's axles; the main rods drive the second coupled axle
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.25, x1: 3.25, y: 1.05, r: 0.36 }, crank: 0.33, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 2, wheelMaterial: "wheel",
    },
    lamps: { front: [[0.68, 1.4, 0.83], [0.68, 1.4, -0.83], [SMOKEBOX[0] - 0.13, 3.52, 0]], rear: [[CAB1 - 0.05, 1.32, 0.7], [CAB1 - 0.05, 1.32, -0.7]] },
    number: { text: DRG01_NUMBER, side: [13.7, 1.95, CAB_HALF[0]![0]], front: [SMOKEBOX[0] - 0.075, 2.5] },
    extras: engineExtras,
  };
}

// --- the 2'2' T 32 tender: axles 1900 apart, 23.94 m over the buffers with the engine ---

/** Tender axles from its front buffer heads; its rear buffer heads. */
const T_AXLES = [1.25, 3.15, 5.05, 6.95];
const T_END = 8.92;
const TANK = [0.53, 7.72] as const;
const TANK_TOP = 3.03;
const TANK_FOOT = 1.11;
const T_HALF = 1.45;
/** The coal box on the tank, narrower than it; its top 3,970 mm. */
const COAL = [0.77, 6.6] as const;
const COAL_HALF = 0.97;
const COAL_TOP = 3.96;

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("red", s, 0.47, 8.1, 1.02, TANK_FOOT + 0.04, T_HALF - 0.16, T_HALF - 0.04);
  });
  m.scope("coal box ribs", () => {
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const x = COAL[0] + 0.45 + i * ((COAL[1] - COAL[0] - 0.9) / 5);
      t.sideBox("paint", s, x - 0.025, x + 0.025, TANK_TOP - 0.01, COAL_TOP - 0.15, COAL_HALF - 0.02, COAL_HALF + 0.03);
    }
  });
  m.scope("front lockers", () => {
    for (const s of [-1, 1]) t.sideBox("paint", s, 0.49, TANK[0] + 0.05, TANK_FOOT + 0.01, 2.62, 0.92, T_HALF - 0.05);
  });
  m.scope("water fillers", () => {
    for (const s of [-1, 1]) t.cylY("paint", 7.15, s * 0.68, TANK_TOP - 0.02, TANK_TOP + 0.09, 0.24, 10);
  });
  m.scope("rear platform", () => t.box("black", TANK[1] - 0.02, 8.1, 1.16, 1.31, -1.2, 1.2));
  m.scope("numbers", () => t.endPlate(-1, TANK[1], 2.3, DRG01_NUMBER));
}

function tender(): LocoSpec {
  return {
    title: "DRG 01 tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.8, y1: 1.28, length: [0.3, 0.65], half: 1.44 },
    frame: { x0: 0.47, x1: 8.1, top: TANK_FOOT + 0.02 },
    prisms: [
      { name: "tank", x0: TANK[0], x1: TANK[1], half: [[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.08], [T_HALF - 0.06, TANK_TOP - 0.01], [T_HALF - 0.14, TANK_TOP]] },
      { name: "coal box", x0: COAL[0], x1: COAL[1], half: [[COAL_HALF, TANK_TOP - 0.02], [COAL_HALF, COAL_TOP - 0.1], [COAL_HALF - 0.08, COAL_TOP]] },
    ],
    coal: { x0: COAL[0] + 0.08, x1: COAL[1] - 0.08, y: COAL_TOP - 0.06, half: COAL_HALF - 0.1, rise: 0.16 },
    bogies: [{ x0: T_AXLES[0]! - 0.65, x1: T_AXLES[1]! + 0.65, y: 0.6 }, { x0: T_AXLES[2]! - 0.65, x1: T_AXLES[3]! + 0.65, y: 0.6 }],
    bogieFrameMat: "red",
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    // two lamps over the rear buffers and one on the tank's rear wall, the number below it
    lamps: { front: [], rear: [[8.06, 1.33, 0.85], [8.06, 1.33, -0.85], [TANK[1] + 0.12, 2.6, 0]] },
    extras: tenderExtras,
  };
}

/** The DRG 01's engine or tender spec, by the `unit` parameter's value. */
export function drg01Spec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}
