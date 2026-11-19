// The RENFE 141F "Mikado" (1'D1' h2, 242 engines built 1953 - 1960 by North British,
// Babcock & Wilcox, MTM, Euskalduna and Macosa), with its four-axle bogie
// tender, drawn on the steam kit (steamLoco.ts) from photographs of 141F 2111 "Galicia"
// (Madrid railway museum), 2295 (side-on, plinthed), 2104 (Leganes), 2316, 2348 (its tender
// side-on) and 2413 (assets/renfe-141f/SOURCES.md) and the published figures (1,560 mm
// drivers, 10.85 m engine wheelbase with 5.12 m coupled, 19.57 m with the tender, 103 t
// in service, 166.5 t with the tender; about 23.0 m over the buffers): the boiler on 3.1 m
// with its rear course stepped out, the heater box on the smokebox's top front, the big
// headlamp over the smokebox door, the tall smoke deflectors with their cut front corner
// standing from the high running board on 2.4 m down to the front deck, the board's red
// edge dropping in a steep slope over the cylinders to the red buffer beam, the long low
// casing of the dome and sand boxes, the brass boiler bands, red coupling and main rods
// on black drivers, the closed cab with two side windows, the arched entrance and the
// brass number on a red plate; the tender a tall tank with a rounded bottom and a red
// edge, its front shoulder rounded and its rear top corner cut, on two cast bogies.
// See docs/models/spain-trains.md.
//
// Scales: 141F 2295 side-on (photo-renfe-141f-2295-foto-110.jpg) 133 px/m vertically at the
// rear driver, the coupled axles fitted projectively (spacing 1.69 m against the published
// 1.707 m); 141F 2111 three-quarter (photo-museo-del-ferrocarril-3664629895.jpg) placed
// along the boiler by a projective fit through the deflector's ends and the cab front.
//
// Every length is in metres along the locomotive from its front buffer heads (the tender:
// from its own front head, where the engine's drawbar meets it), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black engine and tender, red edges, beams and rods, brass bands and numbers (141F 2111 as preserved). */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1b1c1e", 0.5),
  black: mat("#161618", 0.75),
  frame: mat("#1f2022", 0.75),
  wheel: mat("#232427", 0.65),
  smokebox: mat("#1c1d22", 0.85),
  red: mat("#b3221f", 0.55),
  beam: mat("#b3221f", 0.6),
  // the boiler bands and the cab plate's figures, polished brass
  brass: { color: "#c49a3e", metallic: 0.55, roughness: 0.35 },
  plate: mat("#a51d1f", 0.5),
  plateText: { color: "#d8b55c", metallic: 0.5, roughness: 0.35 },
  // the city's coat of arms on the deflectors: a blue shield
  crest: mat("#3b66ad", 0.5),
  steel: { color: "#4a4d52", metallic: 0.3, roughness: 0.55 },
  doorRing: { color: "#2e3034", metallic: 0.3, roughness: 0.55 },
  // the cab's open entrance, seen into the dark cab
  opening: mat("#0c0c0d", 0.9),
};

const NUMBER = "141F 2111";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const RENFE141F_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "Renfe 141F Mikado", lead: 1, coupled: 4, trail: 1, leadD: 1.0, coupledD: 1.56, trailD: 1.06, boilerR: 0.9, deflectors: "wagner", domes: 1, palette: { paint: "#1b1c1e", wheel: "#232427", frame: "#b3221f", smokebox: "#1c1d22" }, tender: { length: 8.96, axles: 4, d: 0.95 }, number: NUMBER },
};

// --- the engine: 14.1 m from the front buffer heads to the drawbar ---

/** The pony axle, the coupled axles 1.707 m apart (5.12 m), the trailing axle (10.85 m from the pony). */
const LEAD = 2.0;
const COUPLED = [4.93, 6.637, 8.344, 10.051];
const TRAIL = 12.85;
const END = 14.1;
/** Boiler centre, the front courses' radius over the lagging (top 4.0 m), the rear courses' (top 4.06 m) from the cone. */
const BY = 3.1;
const BR = 0.9;
const BR2 = 0.96;
const CONE = [7.5, 8.0] as const;
/** The running board's top; the front deck on the buffer beam and the slope between them. */
const RB = 2.4;
const DECK = 1.545;
const SLOPE = [1.7, 2.4] as const;
const SMOKEBOX = [1.15, 3.6] as const;
const CAB0 = 12.05;
const CAB1 = 14.35;

/** The cab's right half section: the side sheets from 1.95 m, the round roof from 3.98 m to 4.45 m. */
const CAB_HALF: Pt[] = [[1.45, 1.95], [1.45, 3.98], [1.3, 4.25], [0.8, 4.4], [0, 4.45]];
const CAB_SEC: Pt[] = [...CAB_HALF, ...[...CAB_HALF].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);

/** The barrel's radius at source x. */
const barrelR = (x: number): number => (x <= CONE[0] ? BR : x >= CONE[1] ? BR2 : BR + ((x - CONE[0]) / (CONE[1] - CONE[0])) * (BR2 - BR));

/** A polygon of triangles wound so it looks along `out`. */
function face(m: Steam["m"], mt: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  for (let i = 1; i + 1 < q.length; i++) m.tri(mt, q[0]!, q[i]!, q[i + 1]!);
}

// --- the smoke deflectors ---

/**
 * The deflector plates at |z| 1.3 (outer face), 2.5 cm thick: the front edge upright
 * at 1.3 m from the front deck to 3.75 m, the corner cut back to 1.62 m at the top
 * (4.05 m), the rear edge at 4.1 m; the foot on the deck, up the slope and along the
 * running board. Two convex pieces, the outline their union.
 */
const DEF = { z: 1.3, t: 0.025 };
const DEF_PIECES: Pt[][] = [
  [[1.3, DECK + 0.015], [SLOPE[0], DECK + 0.015], [SLOPE[1], RB + 0.04], [SLOPE[1], 4.05], [1.62, 4.05], [1.3, 3.75]],
  [[SLOPE[1], RB + 0.04], [4.1, RB + 0.04], [4.1, 4.05], [SLOPE[1], 4.05]],
];
const DEF_OUTLINE: Pt[] = [[1.3, DECK + 0.015], [SLOPE[0], DECK + 0.015], [SLOPE[1], RB + 0.04], [4.1, RB + 0.04], [4.1, 4.05], [1.62, 4.05], [1.3, 3.75]];

function deflectors(t: Steam): void {
  const m = t.m;
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      const P = ([x, y]: Pt, z: number): Vec3 => [t.X(x), y, s * z];
      for (const piece of DEF_PIECES) {
        face(m, "paint", piece.map((p) => P(p, DEF.z)), [0, 0, s]);
        face(m, "paint", piece.map((p) => P(p, DEF.z - DEF.t)), [0, 0, -s]);
      }
      // the edges round the outline, each facing out of it
      const n = DEF_OUTLINE.length;
      for (let i = 0; i < n; i++) {
        const [a, b] = [DEF_OUTLINE[i]!, DEF_OUTLINE[(i + 1) % n]!];
        // the outline runs counter-clockwise in (x, y): its outward normal there is (dy, -dx); x runs backward in the model
        const out: Vec3 = [-(b[1] - a[1]), -(b[0] - a[0]), 0];
        face(m, "paint", [P(a, DEF.z), P(b, DEF.z), P(b, DEF.z - DEF.t), P(a, DEF.z - DEF.t)], out);
      }
      // the stays to the smokebox and the coat of arms
      for (const x of [2.0, 3.7]) t.sideBox("paint", s, x - 0.03, x + 0.03, 3.62, 3.68, 0.7, DEF.z - DEF.t - 0.005);
      t.sideBox("crest", s, 2.75, 3.0, 3.3, 3.6, DEF.z - 0.005, DEF.z + 0.012);
      t.sideBox("brass", s, 2.8, 2.95, 3.6, 3.67, DEF.z - 0.005, DEF.z + 0.012);
    }
  });
}

// --- the front: deck, slope, headlamp, smokebox door ---

/** The slope's plate at |z| za..zb from the deck up to the running board, 4 cm thick. */
function slopePlate(t: Steam, za: number, zb: number): void {
  const [xa, ya, xb, yb] = [SLOPE[0], DECK, SLOPE[1], RB];
  const q: Array<[number, number]> = [[t.X(xa), ya - 0.04], [t.X(xb), yb - 0.04], [t.X(xb), yb], [t.X(xa), ya]];
  t.m.sweep("black", "z", q, za, q, zb);
}

/** A band `depth` deep under the (x, y) polyline on side s: its outer face at |z| zo, its underside back to |z| zi. */
function sideBand(t: Steam, mt: string, s: number, pts: Pt[], depth: number, zi: number, zo: number): void {
  const m = t.m;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, ya] = pts[i]!;
    const [xb, yb] = pts[i + 1]!;
    face(m, mt, [[t.X(xa), ya - depth, s * zo], [t.X(xb), yb - depth, s * zo], [t.X(xb), yb, s * zo], [t.X(xa), ya, s * zo]], [0, 0, s]);
    // the underside, facing down
    face(m, mt, [[t.X(xa), ya - depth, s * zi], [t.X(xb), yb - depth, s * zi], [t.X(xb), yb - depth, s * zo], [t.X(xa), ya - depth, s * zo]], [0, -1, 0]);
  }
  // the front end
  const [x0, y0] = pts[0]!;
  face(m, mt, [[t.X(x0), y0 - depth, s * zi], [t.X(x0), y0, s * zi], [t.X(x0), y0, s * zo], [t.X(x0), y0 - depth, s * zo]], [1, 0, 0]);
}

function front(t: Steam): void {
  const m = t.m;
  m.scope("front deck", () => {
    // the deck on the buffer beam, 5 mm over its top, and the board's slope at both sides
    t.box("black", 0.62, SLOPE[0] + 0.03, DECK - 0.04, DECK, -1.5, 1.5);
    for (const s of [-1, 1]) {
      slopePlate(t, s > 0 ? 1.0 : -1.5, s > 0 ? 1.5 : -1.0);
      // the red edge under the deck's and the slope's outer edge, on to the running board's
      sideBand(t, "red", s, [[0.78, DECK - 0.04], [SLOPE[0], DECK - 0.04], [SLOPE[1], RB - 0.04]], 0.12, 1.46, 1.51);
    }
    // the plate from the deck up to the smokebox's foot
    const pts: Vec3[] = [[t.X(0.9), DECK + 0.002, -0.7], [t.X(0.9), DECK + 0.002, 0.7], [t.X(SMOKEBOX[0] + 0.25), BY - BR + 0.02, 0.7], [t.X(SMOKEBOX[0] + 0.25), BY - BR + 0.02, -0.7]];
    m.slab("black", pts, [0, -0.03, 0]);
  });
  m.scope("headlamp", () => {
    // the big lamp on its bracket over the smokebox door, its number box at the right
    t.box("black", 1.0, 1.45, BY + BR - 0.1, 4.2, -0.18, 0.18);
    t.cylX("black", 0.9, 1.42, 0, 4.36, 0.2, 12);
    const lens = ngon(12, 0.16, 0, 0, 4.36);
    m.sweep("lampHead", "x", lens, t.X(0.9) - 0.02, lens, t.X(0.9) + 0.006);
    t.box("black", 0.98, 1.3, 4.26, 4.5, -0.42, -0.17);
    t.endPlate(1, 0.975, 4.33, NUMBER.slice(5), 0.08, -0.295);
  });
  m.scope("smokebox door wheel", () => {
    // the door's ring and its hand wheel
    m.tube("doorRing", "x", 0, BY, BR + 0.05, BR * 0.9, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.035, 24);
    const X = t.X(SMOKEBOX[0] - 0.1);
    m.tube("brass", "x", 0, BY, 0.17, 0.14, X - 0.02, X + 0.02, 12);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      m.rod("brass", [X, BY + 0.15 * Math.sin(a), 0.15 * Math.cos(a)], [X, BY - 0.15 * Math.sin(a), -0.15 * Math.cos(a)], 0.012, 4);
    }
    t.cylX("steel", SMOKEBOX[0] - 0.1, SMOKEBOX[0] - 0.02, 0, BY, 0.035, 8);
  });
  m.scope("heater box", () => {
    // the feed-water heater's box on the smokebox's top front, ahead of the chimney
    t.box("paint", 1.45, 2.05, BY + BR - 0.12, BY + BR + 0.26, -0.36, 0.36);
    for (const s of [-1, 1]) t.cylX("paint", 2.05, 3.0, s * 0.3, BY + BR + 0.02, 0.06, 8);
  });
}

// --- the rest of the engine ---

/** The boiler's rear courses: the cone and the wider barrel to the firebox. */
function rearCourses(t: Steam): void {
  const m = t.m;
  const n = 24;
  const ring = (r: number) => ngon(n, r, Math.PI / n, 0, BY);
  m.scope("rear courses", () => {
    m.sweep("paint", "x", ring(BR - 0.005), t.X(CONE[0]), ring(BR2), t.X(CONE[1]), false);
    t.cylX("paint", CONE[1], CAB0, 0, BY, BR2, n, false);
  });
  m.scope("boiler bands", () => {
    // the brass bands, as on 141F 2111
    for (const x of [4.2, 5.2, 6.35, CONE[0], 8.8, 9.8]) t.cylX("brass", x - 0.025, x + 0.025, 0, BY, barrelR(x) + 0.012, n, false);
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  deflectors(t);
  front(t);
  rearCourses(t);
  m.scope("frame top", () => {
    // the frames' top edge under the running board, black like them
    for (const s of [-1, 1]) t.sideBox("frame", s, SLOPE[1], CAB0 + 0.6, RB - 0.2, RB - 0.04, 1.2, 1.26);
  });
  m.scope("boiler pipes", () => {
    // the feed and steam pipes along the barrel's flanks, above the running board
    for (const s of [-1, 1]) for (const dy of [-0.5, -0.32]) {
      const z = Math.sqrt(BR * BR - dy * dy) + 0.06;
      t.cylX("paint", SMOKEBOX[1] + 0.55, CAB0 - 0.05, s * z, BY + dy, 0.035, 6);
    }
  });
  m.scope("name plate", () => {
    // the red name plate on the barrel's side under the dome casing ("Galicia")
    for (const s of [-1, 1]) {
      t.sideBox("plate", s, 6.75, 7.35, BY + 0.12, BY + 0.32, 0.87, 0.895);
      t.sideBox("brass", s, 6.8, 7.3, BY + 0.2, BY + 0.24, 0.893, 0.9);
    }
  });
  m.scope("air pump and reservoirs", () => {
    // the air pump on the right side under the board, ahead of the drivers; the reservoirs under the cab
    t.cylY("paint", 4.35, 1.15, RB - 0.95, RB - 0.1, 0.17, 10);
    for (const s of [-1, 1]) t.cylX("paint", 10.75, 11.85, s * 1.1, RB - 0.45, 0.2, 12);
  });
  m.scope("whistle and turret", () => {
    t.box("paint", CAB0 - 0.75, CAB0 + 0.02, BY + BR2 - 0.15, BY + BR2 + 0.15, -0.4, 0.4);
    t.cylY("brass", CAB0 - 0.4, 0.25, BY + BR2 + 0.1, BY + BR2 + 0.42, 0.045, 8);
  });
  m.scope("cab front windows", () => {
    // the round-cornered windows either side of the firebox
    const X = t.X(CAB0) + 0.006;
    for (const s of [-1, 1]) {
      const ring = ngon(12, 1, Math.PI / 12, 0, 0).map(([a, b]): Vec3 => [X, 3.6 + b * 0.22, s * 1.16 + a * 0.2]);
      m.slab("glass", ring, [-0.02, 0, 0]);
    }
  });
  m.scope("cab entrance", () => {
    // the open entrance behind the windows, its top arched, and the red grab rail
    for (const s of [-1, 1]) {
      t.sidePanel(CAB_SEC, "opening", s, 13.83, 14.25, 2.0, 3.55);
      t.sidePanel(CAB_SEC, "opening", s, 13.89, 14.19, 3.55, 3.7);
      m.rod("steel", [t.X(13.8), 2.05, s * 1.5], [t.X(13.8), 3.5, s * 1.5], 0.018, 6);
    }
  });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) {
      for (const y of [0.75, 1.2, 1.65]) t.sideBox("red", s, 13.8, 14.25, y - 0.03, y, 1.3, 1.45);
      for (const x of [13.81, 14.24]) t.sideBox("black", s, x - 0.02, x + 0.02, 0.68, 1.97, 1.3, 1.45);
    }
  });
  m.scope("rear frame", () => {
    // the trailing truck's frame and the ash pan from the last driver up to the cab
    for (const s of [-1, 1]) {
      const q: Vec3[] = [[t.X(10.95), 1.0, s * 0.6], [t.X(10.95), 1.55, s * 0.6], [t.X(13.95), 1.95, s * 0.6], [t.X(13.95), 1.55, s * 0.6]];
      m.slab("frame", q, [0, 0, -s * 0.08]);
    }
  });
  m.scope("cab roof vent", () => t.box("roof", 12.65, 13.65, 4.48, 4.56, -0.3, 0.3));
}

function engine(): LocoSpec {
  return {
    title: "Renfe 141F Mikado",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.82, y1: DECK - 0.045, length: [0.62, 0.3], half: 1.5 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], n: 24 },
    chimney: { x: 2.55, top: 4.55, r: 0.3 },
    // the long casing over the dome and the sand boxes
    domes: [{ x: 6.2, top: 4.36, r: 0.42, len: 2.3 }],
    valves: { x: 10.5, top: 4.32 },
    handrail: { x0: SMOKEBOX[1] + 0.3, x1: CAB0 - 0.2, y: BY + 0.42 },
    runningBoard: { profile: [[SLOPE[1], RB], [CAB0 + 0.02, RB]], half: 1.5, valance: 0.12, valanceMat: "red" },
    frame: { x0: 0.8, x1: COUPLED[3]! + 0.95, top: 2.25 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.98,
      windows: [{ x0: 12.35, x1: 12.95, y0: 3.05, y1: 3.72 }, { x0: 13.1, x1: 13.7, y0: 3.05, y1: 3.72 }],
    },
    // the round-topped firebox behind the barrel, over the trailing truck
    prisms: [{ name: "firebox", x0: 9.85, x1: CAB0, half: [[1.0, RB], [1.0, BY + 0.35], [0.86, BY + 0.72], [0.52, BY + 0.94], [0, BY + 1.0]] }],
    bogies: [{ x0: LEAD - 0.6, x1: LEAD + 0.6, y: 0.6 }, { x0: TRAIL - 0.66, x1: TRAIL + 0.66, y: 0.64 }],
    gear: {
      wheels: [
        { x: LEAD, d: 1.0, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.56, spokes: 18 })),
        { x: TRAIL, d: 1.06, spokes: 12, outsideBoxes: true },
      ],
      // two cylinders 570 x 710 mm behind the pony, up to the first driver; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 2.7, x1: 3.98, y: 1.08, r: 0.4 }, crank: 0.355, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "wheel", couplingMat: "red", mainMat: "red", cylinderCoverMat: "paint",
    },
    lamps: { front: [[0.8, DECK, 0.95], [0.8, DECK, -0.95]], rear: [[CAB1 - 0.05, 1.33, 0.7], [CAB1 - 0.05, 1.33, -0.7]] },
    number: { text: NUMBER, side: [13.03, 2.72, CAB_HALF[0]![0]] },
    extras: engineExtras,
  };
}

// --- the bogie tender: 8.96 m over its heads, bogies of 1.75 m, axles 6.4 m apart outside ---

const T_AXLES = [1.07, 2.82, 5.72, 7.47];
const T_END = 8.96;
/** The tank from 0.45 to 8.33 m: 2.94 m wide, its top 3.9 m, the sides upright down to 2.25 m, then a round bottom to 1.55 m. */
const TANK = { x0: 0.45, x1: 8.33, top: 3.9, side: 2.25, bottom: 1.55, half: 1.47, shoulder: 0.45, cut: [7.78, 3.4] as const, frontTop: 3.4 };

/** The tank's top at source x: the front shoulder a quarter round, the rear corner cut. */
function tankTop(x: number): number {
  const T = TANK;
  if (x < T.x0 + T.shoulder) {
    const k = (T.x0 + T.shoulder - x) / T.shoulder;
    return T.frontTop + (T.top - T.frontTop) * Math.sqrt(Math.max(0, 1 - k * k));
  }
  if (x > T.cut[0]) return T.top - ((x - T.cut[0]) / (T.x1 - T.cut[0])) * (T.top - T.cut[1]);
  return T.top;
}

/** The tank's (z, y) section at source x. */
function tankSection(x: number): Pt[] {
  const T = TANK;
  const top = tankTop(x);
  const right: Pt[] = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    right.push([T.half * Math.sin(a), T.side - (T.side - T.bottom) * Math.cos(a)]);
  }
  right.push([T.half, top - 0.06], [T.half - 0.06, top]);
  const left = [...right].reverse().map(([z, y]): Pt => [-z, y]);
  return [...right, ...left.slice(0, -1)].filter((p, i, all) => i === 0 || Math.abs(p[0] - all[i - 1]![0]) > 1e-9 || Math.abs(p[1] - all[i - 1]![1]) > 1e-9);
}

const TANK_XS = [TANK.x0, TANK.x0 + 0.05, TANK.x0 + 0.13, TANK.x0 + 0.24, TANK.x0 + 0.36, TANK.x0 + TANK.shoulder, TANK.cut[0], TANK.x1];

function tank(t: Steam): void {
  const m = t.m;
  m.scope("tank", () => {
    for (let i = 0; i + 1 < TANK_XS.length; i++) m.sweep("paint", "x", tankSection(TANK_XS[i]!), t.X(TANK_XS[i]!), tankSection(TANK_XS[i + 1]!), t.X(TANK_XS[i + 1]!), false);
    for (const [x, e] of [[TANK.x0, 1], [TANK.x1, -1]] as const) m.slab("paint", tankSection(x).map(([z, y]): Vec3 => [t.X(x), y, z]), [-e * 0.002, 0, 0]);
  });
}

function tenderExtras(t: Steam): void {
  const m = t.m;
  tank(t);
  m.scope("red edge", () => {
    // the red line along the foot of the tank's upright sides
    for (const s of [-1, 1]) t.sideBox("red", s, TANK.x0 + 0.02, TANK.x1 - 0.02, TANK.side - 0.06, TANK.side, TANK.half - 0.005, TANK.half + 0.012);
  });
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("frame", s, 0.31, TANK.x1, 1.15, 1.62, 1.2, 1.32);
  });
  m.scope("side rails", () => {
    // the hand rail along the upper side and the rivet seam under it
    for (const s of [-1, 1]) {
      t.cylX("steel", 2.0, 7.6, s * (TANK.half + 0.05), 3.45, 0.018, 6);
      for (const x of [2.1, 4.8, 7.5]) t.sideBox("steel", s, x - 0.012, x + 0.012, 3.44, 3.46, TANK.half, TANK.half + 0.05);
      t.sideBox("paint", s, TANK.x0 + 0.3, TANK.x1 - 0.05, 2.98, 3.0, TANK.half, TANK.half + 0.008);
    }
  });
  m.scope("top fittings", () => {
    // the filler and the fuel hatch on the top, the hoop rails at the rear
    t.cylY("paint", 6.8, 0, TANK.top - 0.02, TANK.top + 0.12, 0.3, 10);
    t.box("paint", 2.2, 3.4, TANK.top - 0.02, TANK.top + 0.1, -0.5, 0.5);
    for (const z of [-0.45, 0.45]) {
      m.rod("steel", [t.X(7.85), TANK.top - 0.12, z], [t.X(7.85), TANK.top + 0.35, z], 0.02, 6);
      m.rod("steel", [t.X(7.85), TANK.top + 0.35, z], [t.X(8.15), TANK.top - 0.05, z], 0.02, 6);
    }
  });
  m.scope("front", () => {
    // the tool lockers and the deck under the cab's overhang
    t.box("paint", 0.31, TANK.x0 + 0.01, 1.45, 2.4, -1.2, 1.2);
    t.box("black", 0.3, TANK.x0 + 0.01, 2.4, 2.44, -1.45, 1.45);
  });
  m.scope("rear ladder", () => {
    for (const z of [-0.3, 0.3]) m.rod("steel", [t.X(TANK.x1 + 0.06), 1.5, z], [t.X(TANK.x1 + 0.06), 3.35, z], 0.02, 6);
    for (let y = 1.7; y < 3.3; y += 0.35) m.rod("steel", [t.X(TANK.x1 + 0.06), y, -0.3], [t.X(TANK.x1 + 0.06), y, 0.3], 0.016, 6);
  });
  m.scope("numbers", () => t.endPlate(-1, TANK.x1, 2.55, NUMBER));
}

/** The tender bogies' cast side frames: the axle boxes and the bolster's drop, outside the kit's frame bars. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  for (const s of [-1, 1]) {
    t.sideBox("frame", s, (b.x0 + b.x1) / 2 - 0.3, (b.x0 + b.x1) / 2 + 0.3, b.y - 0.3, b.y - 0.1, 0.97, 1.02);
    for (const x of axles) t.sideBox("frame", s, x - 0.17, x + 0.17, 0.33, b.y - 0.09, 0.97, 1.08);
  }
}

function tender(): LocoSpec {
  return {
    title: "Renfe 141F Mikado tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.82, y1: 1.45, length: [0.3, 0.62], half: 1.45 },
    frame: { x0: 0.31, x1: TANK.x1, top: 1.2 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.6 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.6 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 0.95, spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[TANK.x1 + 0.02, 1.45, 0.85], [TANK.x1 + 0.02, 1.45, -0.85]] },
    extras: tenderExtras,
  };
}

/** The 141F's engine or tender spec, by the `unit` parameter's value. */
export function renfe141fSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/** The spec its distant model is drawn from: the deflectors as their two flat pieces, the tank as a prism of its middle section. */
export function renfe141fLodSpec(unit: string): LocoSpec {
  if (unit === "tender") {
    const s = tender();
    // the round bottom as one chamfer, the red edge as a band of its own
    const mid: Pt[] = [[TANK.half - 0.35, TANK.bottom], [TANK.half, TANK.side - 0.3], [TANK.half, TANK.top - 0.06], [TANK.half - 0.06, TANK.top]];
    return { ...s, prisms: [{ name: "tank", x0: TANK.x0, x1: TANK.x1, half: mid }, { name: "red edge", x0: TANK.x0 + 0.02, x1: TANK.x1 - 0.02, half: [[TANK.half + 0.01, TANK.side - 0.06], [TANK.half + 0.01, TANK.side]], mat: "red" }] };
  }
  const s = engine();
  return { ...s, deflectors: { outlines: DEF_PIECES, z: DEF.z - DEF.t } };
}
