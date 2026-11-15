// China Railways SY (Shangyou, 1'D1' h2), the industrial Mikado Tangshan built from
// 1960 to 1999 on the JF6's design, with its sloped-back four-axle tender, drawn on
// the steam kit (steamLoco.ts) from the side-on photograph of SY 1702 and the
// photographs of SY 1702's tender, SY 1721, SY 1000, SY 1599, SY 0368 and SY 0652
// (assets/cr-sy/SOURCES.md): the boiler on 2.77 m with the high running board on
// 2.04 m and its white edge, no smoke deflectors, the chimney well back on the
// smokebox, the small dome with its visor and the big round dome, the headlamp on
// the smokebox's right shoulder, the white step ladders from the red pilot beam up
// to the running board, the slatted red pilot, the knuckle couplers, the air pumps
// on the right, the long cab with its two side windows under a rain strip, red
// Boxpok drivers with white tyres, red stars on the cylinders, and the tender: a
// round-cornered tank, the tall coal box on its middle, the narrowed rear water
// tank with the reversing lamp on its post, the red frame and beam. See
// docs/models/china-trains.md ("The SY's body") and docs/models/world-steam.md.
//
// Every length is in metres along the locomotive from its front coupler face
// (the tender: from its own front coupling plane), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { knuckleCoupler } from "./usHoodKit.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black upper works, red wheels, pilot, beams and tender frame, white tyres, running board edge, ladders and handrails. */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  wheel: mat("#b51d22", 0.6),
  frame: mat("#202022", 0.8),
  red: mat("#b51d22", 0.6),
  smokebox: mat("#1c1d22", 0.85),
  white: mat("#ecebe6", 0.55),
  tyre: mat("#e6e5e0", 0.5),
  knuckle: mat("#3a3b3d", 0.7),
  handrail: mat("#ecebe6", 0.5),
  steel: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
  // the slots in the pilot, seen into the dark behind it
  opening: mat("#0c0c0d", 0.9),
};
const TENDER_PALETTE: Record<string, MaterialSpec> = { ...PALETTE, wheel: mat("#1d1e20", 0.6) };

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const SY_WORLD: { base: WorldSteam } = {
  base: { top: 4.75, coupler: "knuckle", half: 1.55, title: "CR SY", lead: 1, coupled: 4, trail: 1, leadD: 0.84, coupledD: 1.37, trailD: 1.0, boilerR: 0.81, deflectors: "none", domes: 2, palette: { paint: "#1d1e20", wheel: "#b51d22", frame: "#b51d22", smokebox: "#1c1d22" }, tender: { length: 8.54, axles: 4, d: 0.84 }, number: "SY 1772" },
};

const NUMBER = "SY 1772";

// --- the engine (SY 1702 side-on, a projective fit over the drivers' 4.42 m: 9.55 m engine wheelbase) ---

const PONY = 1.33;
/** The coupled axles at the published 4.42 m (14 ft 6 in) driving wheelbase. */
const COUPLED = [3.75, 5.223, 6.697, 8.17];
const TRAIL = 10.89;
/** The engine's rear coupling plane; the tender's 8.54 m make the published 21.643 m over both. */
const END = 13.1;
/** Boiler centre and radius (barrel top 3.58 m); the running board's top. */
const BY = 2.77;
const BR = 0.81;
const RB = 2.04;
const SMOKEBOX = [1.57, 3.6] as const;
const CAB0 = 10.84;
const CAB1 = 12.95;
/** The cab's right half section: the sheets from under the running board, a round roof from 4.02 m to 4.34 m. */
const CAB_HALF: Pt[] = [[1.55, 1.96], [1.55, 4.02], [1.38, 4.2], [0.85, 4.31], [0, 4.34]];
/** The pilot beam, its face and depth, its height. */
const BEAM = { x0: 0.4, x1: 0.7, y0: 0.8, y1: 1.32, half: 1.45 };
/** The headlamp on the smokebox's right shoulder. */
const LAMP = { x: 1.22, y: 3.5, z: 0.76, r: 0.22 };

/** The pilot beam, the slatted pilot under it, the knuckle coupler and the foot steps at the beam's ends. */
function pilot(t: Steam): void {
  const m = t.m;
  m.scope("front pilot", () => {
    t.box("red", BEAM.x0, BEAM.x1, BEAM.y0, BEAM.y1, -BEAM.half, BEAM.half);
    // the pilot leaning back from 0.3 m at the rail to the beam's foot, 2.0 m wide
    const [fx0, fy0, fx1, fy1, back, half] = [0.3, 0.14, 0.5, BEAM.y0, 0.95, 1.0];
    const sec: Pt[] = [[t.X(back), fy0], [t.X(fx0), fy0], [t.X(fx1), fy1], [t.X(back), fy1]];
    m.sweep("red", "z", sec, -half, sec, half);
    // its slots, 4 mm proud of the leaning face
    const L = Math.hypot(fx1 - fx0, fy1 - fy0);
    const [nx, ny] = [(fy1 - fy0) / L, (fx1 - fx0) / L];
    const at = (y: number, z: number): Vec3 => {
      const x = fx0 + ((y - fy0) / (fy1 - fy0)) * (fx1 - fx0);
      return [t.X(x) + nx * 0.004, y + ny * 0.004, z];
    };
    const slots: Vec3[] = [];
    for (let k = 0; k < 9; k++) {
      const z = -0.8 + k * 0.2;
      const [a, b, c, d] = [at(0.24, z - 0.05), at(0.24, z + 0.05), at(0.7, z + 0.05), at(0.7, z - 0.05)];
      slots.push(a, b, c, a, c, d);
    }
    m.facets("opening", slots, [nx, ny, 0]);
    // the foot steps under the beam's ends
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, 0.42, 0.68, 0.42, 0.46, 1.1, 1.45);
      t.sideBox("paint", s, 0.5, 0.6, 0.46, BEAM.y0, 1.36, 1.42);
    }
    knuckleCoupler(m, 1, t.X(0) - 0.6, t.X(0), 0.88);
  });
}

/** The white step ladders from the beam's top up to the running board's front end, both sides. */
function ladders(t: Steam): void {
  const m = t.m;
  m.scope("front ladders", () => {
    const [xa, ya, xb, yb] = [0.62, BEAM.y1, 1.42, RB - 0.04];
    const L = Math.hypot(xb - xa, yb - ya);
    // the stringers' width across their run
    const [wx, wy] = [((yb - ya) / L) * 0.07, (-(xb - xa) / L) * 0.07];
    for (const s of [-1, 1]) {
      for (const z of [1.12, 1.5]) {
        const pts: Vec3[] = [[t.X(xa - wx), ya - wy, s * z], [t.X(xb - wx), yb - wy, s * z], [t.X(xb + wx), yb + wy, s * z], [t.X(xa + wx), ya + wy, s * z]];
        m.slab("white", pts, [0, 0, s * 0.025]);
      }
      // three treads between them
      for (const f of [0.25, 0.5, 0.75]) {
        const x = xa + f * (xb - xa);
        const y = ya + f * (yb - ya);
        t.sideBox("paint", s, x - 0.09, x + 0.09, y - 0.02, y + 0.01, 1.14, 1.5);
      }
    }
  });
}

function headlamp(t: Steam): void {
  const m = t.m;
  m.scope("headlamp", () => {
    const { x, y, z, r } = LAMP;
    t.cylX("paint", x, x + 0.5, z, y, r, 12);
    // the visor over the lens and the lens
    t.box("paint", x - 0.12, x + 0.05, y + r * 0.85, y + r * 0.85 + 0.03, z - r - 0.03, z + r + 0.03);
    const X = t.X(x) + 0.006;
    m.slab("lampHead", ngon(12, r * 0.78, 0, z, y).map(([a, b]): Vec3 => [X, b, a]), [-0.02, 0, 0]);
    // the bracket down to the smokebox's shoulder
    t.box("paint", x + 0.2, SMOKEBOX[0] + 0.25, y - r - 0.1, y - r + 0.02, z - 0.08, z + 0.08);
  });
}

/** A white handrail: rods through the points, on short stanchions toward the boiler. */
function rail(t: Steam, pts: Array<[number, number, number]>): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[i + 1]!];
    t.m.rod("handrail", [t.X(a[0]), a[1], a[2]], [t.X(b[0]), b[1], b[2]], 0.02, 6);
  }
}

function engineExtras(t: Steam): void {
  const m = t.m;
  pilot(t);
  ladders(t);
  headlamp(t);
  m.scope("handrails", () => {
    // along the boiler's flanks
    const dy = 0.42;
    const z = Math.sqrt(BR * BR - dy * dy) + 0.08;
    for (const s of [-1, 1]) {
      rail(t, [[2.0, BY + dy, s * z], [CAB0 - 0.15, BY + dy, s * z]]);
      for (const x of [2.4, 5.0, 7.8, 10.3]) t.sideBox("handrail", s, x - 0.012, x + 0.012, BY + dy - 0.012, BY + dy + 0.012, z - 0.1, z - 0.01);
    }
    // the U under the smokebox door
    const arc: Array<[number, number, number]> = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (1.12 + (0.76 * i) / 8);
      arc.push([SMOKEBOX[0] - 0.08, BY + Math.sin(a) * BR * 0.92, Math.cos(a) * BR * 0.92]);
    }
    rail(t, arc);
    // the tall grab rails rising from the running board's front corners and turning back to the boiler's rails
    for (const s of [-1, 1]) rail(t, [[1.45, RB, s * 1.42], [1.45, 3.15, s * 1.42], [1.75, BY + dy + 0.12, s * (z + 0.25)], [2.0, BY + dy, s * z]]);
    for (const s of [-1, 1]) t.box("handrail", SMOKEBOX[0] - 0.1, SMOKEBOX[0] + 0.02, arc[0]![1] - 0.015, arc[0]![1] + 0.015, s * Math.abs(arc[0]![2]) - 0.015, s * Math.abs(arc[0]![2]) + 0.015);
  });
  m.scope("air pumps", () => {
    // the cross-compound air pumps on the right running board under the big dome
    t.cylY("paint", 7.25, 1.2, RB - 0.01, 3.05, 0.15, 12);
    t.cylY("paint", 7.6, 1.2, RB - 0.01, 2.92, 0.12, 10);
    t.cylY("steel", 7.25, 1.2, 3.05, 3.12, 0.1, 10);
  });
  m.scope("feed water heater", () => {
    // the boxes on the left running board
    t.sideBox("paint", -1, 4.1, 4.75, RB - 0.01, 2.38, 0.98, 1.38);
    t.sideBox("paint", -1, 5.4, 6.65, RB - 0.01, 2.34, 0.98, 1.4);
    t.cylX("paint", 3.7, 7.0, -0.98, BY - 0.12, 0.05, 6);
  });
  m.scope("steam pipes", () => {
    // the outside steam pipes from the smokebox's flanks down through the running board to the valve chests
    for (const s of [-1, 1]) m.rod("smokebox", [t.X(3.1), BY - 0.25, s * 0.74], [t.X(2.55), 1.55, s * 1.02], 0.09, 8);
  });
  m.scope("boiler pipes", () => {
    for (const s of [-1, 1]) for (const dy of [-0.2, 0.15]) {
      const z = Math.sqrt(BR * BR - dy * dy) + 0.05;
      t.cylX("paint", SMOKEBOX[1] + 0.05, CAB0 - 0.05, s * z, BY + dy, 0.035, 6);
    }
  });
  m.scope("dome visor", () => {
    // the plate on the small dome's top, leaning forward
    const [x, y] = [5.44, 4.2];
    m.slab("paint", [[t.X(x - 0.32), y - 0.1, -0.28], [t.X(x - 0.32), y - 0.1, 0.28], [t.X(x + 0.18), y + 0.05, 0.28], [t.X(x + 0.18), y + 0.05, -0.28]], [0, -0.025, 0]);
  });
  m.scope("smokebox door wheel", () => {
    m.tube("steel", "x", 0, BY, BR + 0.05, BR * 0.93, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.035, 24);
  });
  m.scope("cab rain strips", () => {
    for (const s of [-1, 1]) t.sideBox("paint", s, CAB0 + 0.12, CAB1 - 0.2, 3.96, 4.0, CAB_HALF[0]![0] - 0.01, CAB_HALF[0]![0] + 0.08);
  });
  m.scope("cab roof vent", () => t.box("roof", 11.4, 12.4, 4.33, 4.42, -0.4, 0.4));
  m.scope("drawbar", () => t.box("paint", END - 0.3, END + 0.25, 0.82, 1.0, -0.15, 0.15));
  m.scope("trailing truck steps", () => {
    for (const s of [-1, 1]) t.sideBox("paint", s, CAB1 - 0.45, CAB1 - 0.1, 0.62, 0.66, 1.25, 1.55);
  });
}

/** A red star on each cylinder's outer face (SY 0368, SY 0652), riding the engine unit. */
function cylinderStar(m: Steam["m"], s: number, c: { x0: number; x1: number; y: number; z: number; r: number }): void {
  const n = 5;
  const R = 0.13;
  const pts: Vec3[] = [];
  const z = c.z + s * (c.r + 0.012);
  const xc = (c.x0 + c.x1) / 2;
  for (let i = 0; i < 2 * n; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? R * 0.42 : R;
    pts.push([xc + Math.cos(a) * r * s, c.y + Math.sin(a) * r, z]);
  }
  // a fan from the centre, each tip and its two inner corners
  const tris: Vec3[] = [];
  const o: Vec3 = [xc, c.y, z];
  for (let i = 0; i < 2 * n; i++) tris.push(o, pts[i]!, pts[(i + 1) % (2 * n)]!);
  m.scope("star", () => m.facets("red", tris, [0, 0, s]));
}

function engine(): LocoSpec {
  return {
    title: "CR SY",
    palette: PALETTE,
    heads: [0, END],
    beams: { front: false, rear: false },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [5.0, 6.15, 7.5, 8.9], band: "paint", n: 24 },
    chimney: { x: 3.21, top: 4.45, r: 0.3 },
    // the small dome with its visor, the big round dome
    domes: [{ x: 5.44, top: 4.22, r: 0.33 }, { x: 6.8, top: 4.31, r: 0.46 }],
    valves: { x: 10.1, top: 3.92 },
    runningBoard: { profile: [[1.32, RB], [CAB1 - 0.03, RB]], half: 1.6, valance: 0.1, valanceMat: "white" },
    frame: { x0: 0.75, x1: END - 0.3, top: 1.88 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 4.02,
      windows: [{ x0: 11.0, x1: 11.78, y0: 3.2, y1: 3.9 }, { x0: 11.86, x1: 12.72, y0: 3.2, y1: 3.9 }],
      front: [{ z0: 0.95, z1: 1.4, y0: 3.3, y1: 3.85 }, { z0: -1.4, z1: -0.95, y0: 3.3, y1: 3.85 }],
    },
    // the wide round-topped firebox behind the barrel, its ash pan down between the trailing truck's frames
    prisms: [{ name: "firebox", x0: 9.3, x1: CAB0, half: [[0.62, 1.5], [0.62, RB - 0.06], [BR + 0.05, RB - 0.06], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR]] }],
    bogies: [{ x0: PONY - 0.62, x1: PONY + 0.62, y: 0.52 }, { x0: TRAIL - 0.72, x1: TRAIL + 0.72, y: 0.62 }],
    gear: {
      wheels: [
        { x: PONY, d: 0.84, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.37, spokes: 8, box: true })),
        { x: TRAIL, d: 1.0, spokes: 12, outsideBoxes: true },
      ],
      // two cylinders 530 x 710 mm over the pony truck; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.55, x1: 2.75, y: 1.1, r: 0.34 }, crank: 0.355, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "wheel", cylinderCoverMat: "paint", cylinderDressing: cylinderStar,
    },
    number: { text: NUMBER, side: [11.86, 2.55, CAB_HALF[0]![0]], front: [SMOKEBOX[0] - 0.075, BY + 0.38] },
    extras: engineExtras,
  };
}

// --- the tender: 8.54 m over its coupling planes, two bogies 1.75 m wheelbase, 4.03 m apart ---

const T_LEN = 8.54;
const T_AXLES = [1.07, 2.82, 5.1, 6.85];
/** The main tank: from 0.15 to 7.25 m, 3.0 m wide, 1.25 to 3.1 m high, its top edges and rear corners rounded. */
const TANK = { x0: 0.15, x1: 7.25, y0: 1.25, top: 3.1, half: 1.5, edge: 0.22, rear: 0.35 };
/** The narrowed rear water tank the driver looks past when reversing, a little higher than the main tank. */
const REAR = { x0: 7.0, x1: 8.12, y0: 1.27, top: 3.3, half: 1.05, edge: 0.12, rear: 0.2 };
/** The tall coal box on the tank's middle, its top 4.2 m. */
const BOX: Pt[] = [[1.12, TANK.top - 0.02], [1.12, 4.14], [1.05, 4.2]];
const BOX_X = [2.72, 5.3] as const;

/** A rounded tank's (z, y) section at source x: upright sides, round top edges, round rear corners in plan. */
function tankSection(T: typeof TANK, x: number): Pt[] {
  const r = T.rear;
  const w = x > T.x1 - r ? T.half - r + Math.sqrt(Math.max(0, r * r - (x - (T.x1 - r)) ** 2)) : T.half;
  const e = Math.min(T.edge, w * 0.5);
  const right: Pt[] = [[w, T.y0], [w, T.top - e]];
  for (let i = 1; i <= 3; i++) {
    const a = (i / 3) * (Math.PI / 2);
    right.push([w - e + e * Math.cos(a), T.top - e + e * Math.sin(a)]);
  }
  const left = [...right].reverse().map(([z, y]): Pt => [-z, y]);
  return [...right, ...left].filter((p, i, all) => i === 0 || Math.abs(p[0] - all[i - 1]![0]) > 1e-9 || Math.abs(p[1] - all[i - 1]![1]) > 1e-9);
}

function tank(t: Steam, T: typeof TANK, name: string): void {
  const m = t.m;
  const xs = [T.x0, T.x1 - T.rear, T.x1 - T.rear * 0.6, T.x1 - T.rear * 0.3, T.x1 - T.rear * 0.1, T.x1];
  m.scope(name, () => {
    for (let i = 0; i + 1 < xs.length; i++) m.sweep("paint", "x", tankSection(T, xs[i]!), t.X(xs[i]!), tankSection(T, xs[i + 1]!), t.X(xs[i + 1]!), false);
    for (const [x, e] of [[T.x0, 1], [T.x1, -1]] as const) m.slab("paint", tankSection(T, x).map(([z, y]): Vec3 => [t.X(x), y, z]), [-e * 0.002, 0, 0]);
  });
}

/** China Railway's emblem in white on the tank's side: the ring open at its foot round the rail's section. */
function emblem(t: Steam, s: number, x: number, y: number): void {
  const m = t.m;
  const z = s * (TANK.half + 0.004);
  const [ro, ri] = [0.36, 0.27];
  const tris: Vec3[] = [];
  const n = 14;
  const P = (a: number, r: number): Vec3 => [t.X(x) + Math.cos(a) * r, y + Math.sin(a) * r, z];
  for (let i = 0; i < n; i++) {
    // from -60 to 240 degrees, the gap at the foot
    const a0 = (-Math.PI / 3) + (i / n) * (5 * Math.PI / 3);
    const a1 = (-Math.PI / 3) + ((i + 1) / n) * (5 * Math.PI / 3);
    tris.push(P(a0, ro), P(a1, ro), P(a1, ri), P(a0, ro), P(a1, ri), P(a0, ri));
  }
  // the rail's head, web and foot
  const rect = (u0: number, u1: number, v0: number, v1: number) => {
    const [a, b, c, d]: Vec3[] = [[t.X(x) + u0, y + v0, z], [t.X(x) + u1, y + v0, z], [t.X(x) + u1, y + v1, z], [t.X(x) + u0, y + v1, z]];
    tris.push(a, b, c, a, c, d);
  };
  rect(-0.14, 0.14, 0.06, 0.16);
  rect(-0.04, 0.04, -0.3, 0.06);
  rect(-0.16, 0.16, -0.4, -0.3);
  m.facets("white", tris, [0, 0, s]);
}

function tenderExtras(t: Steam): void {
  const m = t.m;
  tank(t, TANK, "tank");
  tank(t, REAR, "rear tank");
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("red", s, 0.1, 8.0, 0.98, 1.24, 1.38, 1.5);
  });
  m.scope("coal boards", () => {
    // the coal space's sides and front plate ahead of the tall box
    for (const s of [-1, 1]) t.sideBox("paint", s, TANK.x0 + 0.05, BOX_X[0], TANK.top - 0.02, 3.55, 1.3, 1.36);
    t.box("paint", TANK.x0 + 0.05, TANK.x0 + 0.11, TANK.top - 0.02, 3.4, -1.3, 1.3);
  });
  m.scope("railings", () => {
    // the white rails along the coal space and the tall box
    for (const s of [-1, 1]) {
      const z = s * 1.4;
      const [y, x0, x1] = [3.98, 0.5, BOX_X[1] - 0.1];
      rail(t, [[x0, 3.55, z], [x0, y, z], [x1, y, z], [x1, TANK.top, z]]);
      for (const x of [1.5, 2.6, 3.7]) m.rod("handrail", [t.X(x), y, z], [t.X(x), x < BOX_X[0] ? 3.55 : TANK.top, z], 0.02, 6);
    }
  });
  m.scope("emblem", () => { for (const s of [-1, 1]) emblem(t, s, 4.15, 2.2); });
  m.scope("rear beam", () => {
    t.box("red", 7.98, 8.24, 0.75, 1.3, -1.45, 1.45);
    for (const s of [-1, 1]) {
      t.sideBox("red", s, 8.0, 8.2, 0.42, 0.75, 1.32, 1.4);
      t.sideBox("paint", s, 7.95, 8.25, 0.4, 0.44, 1.1, 1.45);
    }
    knuckleCoupler(m, -1, -t.X(T_LEN) - 0.6, -t.X(T_LEN), 0.88);
  });
  m.scope("reversing lamp", () => {
    const [x, z] = [7.75, -0.55];
    for (const dz of [-0.08, 0.08]) m.rod("paint", [t.X(x), REAR.top - 0.02, z + dz], [t.X(x), 4.08, z + dz], 0.025, 6);
    // the reversing headlamp on its frame, looking back
    t.cylX("paint", x - 0.25, x + 0.2, z, 4.25, 0.18, 12);
    t.box("paint", x - 0.05, x + 0.3, 4.25 + 0.15, 4.25 + 0.18, z - 0.21, z + 0.21);
    m.slab("lampHead", ngon(12, 0.14, 0, z, 4.25).map(([a, b]): Vec3 => [t.X(x + 0.2) - 0.006, b, a]), [0.02, 0, 0]);
  });
  m.scope("water filler", () => t.cylY("paint", 6.35, 0, TANK.top - 0.02, TANK.top + 0.1, 0.25, 10));
  m.scope("numbers", () => t.endPlate(-1, REAR.x1, 2.3, NUMBER));
}

/** The tender trucks' axle box lids, red. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  for (const s of [-1, 1]) for (const x of axles) t.sideBox("red", s, x - 0.13, x + 0.13, 0.32, 0.62, 0.97, 1.05);
}

function tender(): LocoSpec {
  return {
    title: "CR SY tender",
    palette: TENDER_PALETTE,
    heads: [0, T_LEN],
    beams: { front: false, rear: false },
    frame: { x0: 0.15, x1: 8.0, top: 1.0 },
    prisms: [{ name: "coal box", x0: BOX_X[0], x1: BOX_X[1], half: BOX }],
    coal: { x0: TANK.x0 + 0.15, x1: BOX_X[0] - 0.02, y: TANK.top - 0.05, half: 1.22, rise: 0.38 },
    bogies: [{ x0: T_AXLES[0]! - 0.65, x1: T_AXLES[1]! + 0.65, y: 0.52 }, { x0: T_AXLES[2]! - 0.65, x1: T_AXLES[3]! + 0.65, y: 0.52 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 0.84, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    extras: tenderExtras,
  };
}

/** The SY's engine or tender spec, by the `unit` parameter's value. */
export function sySpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/** The spec its distant model is drawn from: the tender's rounded tanks as prisms of their middle sections. */
export function syLodSpec(unit: string): LocoSpec {
  if (unit !== "tender") return engine();
  const s = tender();
  const half = (T: typeof TANK): Pt[] => tankSection(T, (T.x0 + T.x1) / 2).filter(([z]) => z >= 0).sort((a, b) => a[1] - b[1]);
  return { ...s, prisms: [{ name: "tank", x0: TANK.x0, x1: TANK.x1, half: half(TANK) }, { name: "rear tank", x0: TANK.x1, x1: REAR.x1, half: half(REAR) }, { name: "sole bars", x0: 0.1, x1: 8.0, half: [[1.5, 0.98], [1.5, 1.24]], mat: "red" }, ...s.prisms!] };
}
