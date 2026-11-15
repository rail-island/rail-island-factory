// The China Railways JS (Jianshe, 1'D1' h2, 2-8-2) with its eight-wheeled tender,
// drawn on the steam kit (steamLoco.ts) from the side-on photograph of JS 8010 and
// photographs of JS 5151, 6499, 6500, 6501, 8284, 8376 and 8401
// (assets/cr-js/SOURCES.md), against the published figures (23.37 m over the
// couplers with the tender, 10.192 m engine wheelbase, 20.487 m in all, drivers
// 1.37 m, 4.711 m high, 3.15 m wide): the boiler on 3.0 m under the long
// skyline casing - the tall box of the Worthington feed-water heater over the
// smokebox front, with its louvres and the red star, sloping down to a lower casing
// over the sand dome - the headlamp on the smokebox door with the red number
// plate under it, no smoke deflectors, the high running board on 2.3 m with its
// white edge sloping down to the red pilot beam, the red front board with the CR
// emblem, the red slatted pilot and knuckle coupler, the air and feed pumps beside
// the smokebox, red wheels with white tyres, white handrails, the cab with three
// side windows and the open entrance behind them, and the tender's tall tank on
// red sole bars over two cast two-axle bogies, its front half raised for the coal.
// See docs/models/china-locos.md.
//
// Every length is in metres along the locomotive from its front coupler face
// (the tender: from its own front head, where the engine's rear head meets it),
// y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { knuckleCoupler } from "./usHoodKit.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black upper works, red wheels, pilot, beams and sole bars; white tyres, handrails and running board edges. */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  wheel: mat("#b3222a", 0.6),
  frame: mat("#202124", 0.75),
  red: mat("#b3222a", 0.6),
  smokebox: mat("#1c1d22", 0.85),
  white: mat("#e8e6df", 0.55),
  // the tyres' outer faces painted white, as on every preserved JS
  tyre: mat("#e2e0d8", 0.5),
  // the smokebox number plate: red with white figures
  plate: mat("#b3222a", 0.5),
  plateText: mat("#f1efe8", 0.45),
  // the safety valves and whistle dark, not brass
  brass: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
  steel: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
  knuckle: mat("#2c2d30", 0.7),
  handrail: mat("#e8e6df", 0.55),
  coal: { color: "#2e2f32", metallic: 0.15, roughness: 0.7 },
  // the cab's open entrance, seen into the dark cab
  opening: mat("#0c0c0d", 0.9),
};

/** The running number: JS 6500 (Datong 1981-86 batch, Guangzhou Railway Museum), the number on its cab sides and smokebox plate. */
export const JS_NUMBER = "6500";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const JS_WORLD: { base: WorldSteam } = {
  base: { top: 4.75, coupler: "knuckle", half: 1.55, title: "CR JS", lead: 1, coupled: 4, trail: 1, leadD: 0.84, coupledD: 1.37, trailD: 1.12, boilerR: 0.98, deflectors: "none", domes: 0, palette: { paint: "#1d1e20", wheel: "#b3222a", frame: "#202124", smokebox: "#1c1d22" }, tender: { length: 9.37, axles: 4, d: 1.0 }, number: `JS ${JS_NUMBER}` },
};

// --- the engine (JS 8010 side-on, a projective fit over its axles: 10.17 m engine wheelbase against the published 10.192) ---

/** The pony truck's axle, the drivers 1.473 m apart (4.419 m fixed wheelbase), the trailing truck under the cab's front. */
const LEAD = 1.55;
const COUPLED = [4.25, 5.723, 7.196, 8.669];
const TRAIL = 11.742;
/** The engine's rear head; the tender's front head meets it (23.37 m over both). */
const END = 14.0;
/** Boiler centre and radius over the lagging (the smokebox 4 cm larger); the running board's top. */
const BY = 3.0;
const BR = 0.98;
const RB = 2.3;
const SMOKEBOX = [1.95, 4.2] as const;
const CAB0 = 11.24;
const CAB1 = 13.8;
const HALF = 1.5;
const CAB_HALF_W = 1.55;
/** The cab's right half section: the side sheets from the running board, a round roof from 3.95 m to 4.5 m. */
const CAB_HALF: Pt[] = [[CAB_HALF_W, RB], [CAB_HALF_W, 3.95], [1.4, 4.3], [0.9, 4.45], [0, 4.5]];
const CAB_SEC: Pt[] = [...CAB_HALF, ...[...CAB_HALF].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);

/**
 * The skyline casing over the boiler: the feed-water heater's tall box from the
 * smokebox front (4.71 m, the class's height), its back sloping down to the lower
 * casing over the sand dome (4.36 m), which slopes down onto the boiler at 7.9 m.
 */
const CASING = { x0: 1.93, x1: 7.9, half: 0.48, foot: 3.55 };
const CASING_TOP: Pt[] = [[1.93, 4.71], [4.0, 4.71], [4.45, 4.36], [7.65, 4.36], [7.9, 4.0]];
/** The casing's right half section: flaring onto the smokebox at its foot, upright sides, a rounded top edge. */
const CASING_HALF: Pt[] = [[CASING.half, CASING.foot], [CASING.half, 4.64], [CASING.half - 0.07, 4.71], [0, 4.71]];
const CASING_SEC: Pt[] = [...CASING_HALF, ...[...CASING_HALF].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);
/** The chimney's mouth in the casing's top, behind the heater. */
const CHIMNEY_X = 3.35;

/** The CR emblem (a rail's section under an engine's front, in a ring) at c on a plane facing n; `ux` the plane's horizontal axis, r its radius. */
function emblem(m: Steam["m"], mt: string, c: Vec3, ux: Vec3, n: Vec3, r: number): void {
  const at = (u: number, v: number): Vec3 => [c[0] + ux[0] * u * r, c[1] + v * r, c[2] + ux[2] * u * r];
  const pts: Vec3[] = [];
  const N = 14;
  const w = 0.2;
  // the ring, open at the foot where the rail stands
  for (let i = 0; i < N; i++) {
    const a0 = -Math.PI / 2 + 0.55 + ((2 * Math.PI - 1.1) * i) / N;
    const a1 = -Math.PI / 2 + 0.55 + ((2 * Math.PI - 1.1) * (i + 1)) / N;
    const o0 = at(Math.cos(a0), Math.sin(a0));
    const o1 = at(Math.cos(a1), Math.sin(a1));
    const i0 = at((1 - w) * Math.cos(a0), (1 - w) * Math.sin(a0));
    const i1 = at((1 - w) * Math.cos(a1), (1 - w) * Math.sin(a1));
    pts.push(o0, o1, i1, o0, i1, i0);
  }
  const rect = (u0: number, v0: number, u1: number, v1: number) => {
    const q = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
    pts.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
  };
  // the rail: head, web and foot standing in the ring's opening; the engine's front over it
  rect(-0.42, 0.28, 0.42, 0.46);
  rect(-0.1, -0.78, 0.1, 0.28);
  rect(-0.42, -1.0, 0.42, -0.84);
  rect(-0.5, 0.52, 0.5, 0.62);
  m.facets(mt, pts, n);
}

/** A five-pointed star at c on a plane facing n (ux its horizontal axis), r the points' radius. */
function star(m: Steam["m"], mt: string, c: Vec3, ux: Vec3, n: Vec3, r: number): void {
  const at = (a: number, k: number): Vec3 => [c[0] + ux[0] * Math.cos(a) * k, c[1] + Math.sin(a) * k, c[2] + ux[2] * Math.cos(a) * k];
  const pts: Vec3[] = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const tip = at(a, r);
    const l = at(a - Math.PI / 5, r * 0.38);
    const rr = at(a + Math.PI / 5, r * 0.38);
    pts.push(c, l, tip, c, tip, rr);
  }
  m.facets(mt, pts, n);
}

/** White painted characters on side s's vertical face at |z| = z, centred at source x, foot at y. */
function sideText(t: Steam, s: number, x: number, y: number, z: number, text: string, h: number): void {
  const w = h * 0.58;
  const gap = h * 0.18;
  const width = strokeWidth(text, w, gap);
  const u0 = t.X(x) + (s > 0 ? -width / 2 : width / 2);
  t.m.facets("white", strokeText(text, u0, y, h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * (z + 0.004)]), [0, 0, s]);
}

/** A white handrail through the (x, y, |z|) points on both sides. */
function rail(t: Steam, pts: Array<[number, number, number]>): void {
  for (const s of [-1, 1]) for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[i + 1]!];
    t.m.rod("white", [t.X(a[0]), a[1], s * a[2]], [t.X(b[0]), b[1], s * b[2]], 0.02, 6);
  }
}

function frontEnd(t: Steam): void {
  const m = t.m;
  m.scope("front pilot", () => {
    // the red pilot beam, the deck on it carried by the running board
    t.box("red", 0.6, 1.02, 0.78, 1.33, -1.45, 1.45);
    // the slatted pilot leaning back from the rail to the beam's foot
    const sec: Pt[] = [[1.0, 0.16], [0.36, 0.16], [0.6, 0.79], [1.0, 0.79]];
    const ring = sec.map(([x, y]): [number, number] => [t.X(x), y]);
    m.sweep("red", "z", ring, -1.05, ring, 1.05);
    // its slots, dark on the leaning face
    const slots: Vec3[] = [];
    for (let k = 0; k < 7; k++) {
      const z = -0.81 + k * 0.27;
      const [ya, yb] = [0.26, 0.69];
      const xa = 0.36 + ((ya - 0.16) / 0.63) * 0.24;
      const xb = 0.36 + ((yb - 0.16) / 0.63) * 0.24;
      // 4 mm proud of the leaning face
      const o = 0.004;
      const q: Vec3[] = [[t.X(xa) + o, ya, z - 0.06], [t.X(xa) + o, ya, z + 0.06], [t.X(xb) + o, yb, z + 0.06], [t.X(xb) + o, yb, z - 0.06]];
      slots.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
    }
    m.facets("frame", slots, [0.93, -0.36, 0]);
    // the footsteps at the beam's corners
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, 0.65, 1.0, 0.4, 0.44, 1.12, 1.45);
      t.sideBox("paint", s, 0.95, 1.0, 0.44, 0.78, 1.15, 1.4);
    }
    knuckleCoupler(m, 1, t.X(0) - 0.6, t.X(0), 0.88);
  });
  m.scope("front board", () => {
    // the red board on the deck, with the CR emblem
    t.box("red", 1.04, 1.1, 1.38, 2.12, -0.95, 0.95);
    emblem(m, "white", [t.X(1.04) + 0.004, 1.76, 0], [0, 0, -1], [1, 0, 0], 0.24);
    // its stays back to the smokebox
    for (const s of [-1, 1]) t.sideBox("paint", s, 1.1, 1.95, 1.9, 1.96, 0.7, 0.76);
  });
  m.scope("headlamp", () => {
    // the headlamp on the smokebox door's upper part, its visor over it
    const y = 3.32;
    t.cylX("paint", 1.52, 1.86, 0, y, 0.24, 16);
    // the white rim round the lens
    m.tube("white", "x", 0, y, 0.25, 0.17, t.X(1.52), t.X(1.5), 16);
    const lens = ngon(16, 0.17, Math.PI / 16, 0, y);
    m.sweep("lampHead", "x", lens, t.X(1.525), lens, t.X(1.512));
    t.box("paint", 1.45, 1.62, y + 0.25, y + 0.29, -0.24, 0.24);
    t.box("paint", 1.75, 1.84, y - 0.42, y - 0.24, -0.08, 0.08);
  });
  m.scope("smokebox rail", () => m.rod("white", [t.X(1.88), 2.3, -0.62], [t.X(1.88), 2.3, 0.62], 0.02, 6));
  m.scope("number plate", () => t.endPlate(1, SMOKEBOX[0] - 0.105, 2.87, JS_NUMBER, 0.15));
}

function casing(t: Steam): void {
  const m = t.m;
  m.scope("skyline casing", () => {
    t.volume({ sec: CASING_SEC, plan: [[CASING.x0, CASING.half], [CASING.x1, CASING.half]], top: CASING_TOP, bands: [[CASING.foot, 4.72, "paint"]] });
    // the feed-water heater's louvres at the box's front top
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
      const x = 2.2 + k * 0.13;
      t.sideBox("smokebox", s, x, x + 0.06, 4.12, 4.52, CASING.half - 0.01, CASING.half + 0.012);
    }
    // the red star on the box's front
    star(m, "red", [t.X(CASING.x0) + 0.004, 4.38, 0], [0, 0, -1], [1, 0, 0], 0.17);
    // the builder's plates on the lower casing
    for (const s of [-1, 1]) t.sideBox("red", s, 5.6, 6.3, 4.05, 4.28, CASING.half - 0.01, CASING.half + 0.012);
    // the chimney's mouth in the casing top
    m.emit("smoke", [t.X(CHIMNEY_X), 4.75, 0], 0.28);
    t.cylY("smokebox", CHIMNEY_X, 0, 4.66, 4.75, 0.3, 14);
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  frontEnd(t);
  casing(t);
  m.scope("pumps", () => {
    // the air pump on the right beside the smokebox, the feed pump on the left
    for (const s of [-1, 1]) {
      t.cylY("paint", 4.55, s * 1.2, RB, 3.25, 0.17, 12);
      t.cylY("paint", 4.55, s * 1.2, 3.25, 3.35, 0.2, 12);
      t.cylY("paint", 4.95, s * 1.22, RB, 2.85, 0.12, 10);
    }
  });
  m.scope("air reservoirs", () => {
    // the main reservoirs under the running board over the drivers, red-ringed
    for (const s of [-1, 1]) {
      t.cylX("paint", 4.75, 6.95, s * 1.18, 1.95, 0.2, 12);
      for (const x of [4.85, 6.85]) t.cylX("red", x - 0.04, x + 0.04, s * 1.18, 1.95, 0.215, 12, false);
    }
  });
  m.scope("valves", () => {
    // the safety valves behind the casing
    for (const dz of [-0.13, 0.13]) t.cylY("steel", 8.35, dz, BY + BR * 0.9, 4.25, 0.07, 8);
  });
  m.scope("handrails", () => {
    // from the deck up beside the smokebox and back along the boiler
    rail(t, [[1.15, 1.38, 1.3], [1.15, 2.3, 1.3], [2.15, 3.45, 1.0], [9.4, 3.45, 1.0]]);
    // the stanchions
    for (const x of [3.0, 5.0, 7.0, 9.0]) for (const s of [-1, 1]) t.sideBox("white", s, x - 0.012, x + 0.012, 3.438, 3.462, 0.86, 0.99);
    // the grab rails at the cab entrance
    for (const s of [-1, 1]) for (const x of [13.05, 13.72]) m.rod("white", [t.X(x), 1.5, s * (CAB_HALF_W + 0.06)], [t.X(x), 3.7, s * (CAB_HALF_W + 0.06)], 0.02, 6);
  });
  m.scope("boiler pipes", () => {
    // the red air pipes along the boiler's flanks
    for (const s of [-1, 1]) {
      const z = Math.sqrt(BR * BR - 0.4 * 0.4) + 0.06;
      t.cylX("red", 4.3, CAB0 - 1.7, s * z, BY - 0.4, 0.03, 6);
    }
  });
  m.scope("cab front windows", () => {
    for (const s of [-1, 1]) t.endPanel("glass", 1, CAB0, s > 0 ? 1.08 : -1.42, s > 0 ? 1.42 : -1.08, 3.35, 3.85);
  });
  m.scope("cab entrance", () => {
    for (const s of [-1, 1]) t.sidePanel(CAB_SEC, "opening", s, 13.08, 13.68, 2.35, 3.85);
  });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) for (const y of [1.15, 1.65]) t.sideBox("paint", s, 13.1, 13.65, y, y + 0.04, 1.3, 1.52);
  });
  m.scope("cab roof vent", () => t.box("roof", 12.0, 12.9, 4.49, 4.57, -0.35, 0.35));
  m.scope("cab numbers", () => {
    for (const s of [-1, 1]) sideText(t, s, 12.2, 2.5, CAB_HALF_W, `JS ${JS_NUMBER}`, 0.2);
  });
  m.scope("drawbar", () => t.box("frame", END - 0.3, END, 0.8, 1.0, -0.15, 0.15));
  // the frames' rear extension over the trailing truck, carrying the cab and the drag box
  m.scope("rear frame", () => { for (const s of [-1, 1]) t.sideBox("frame", s, TRAIL - 0.82, END - 0.3, 1.25, 1.65, 0.52, 0.6); t.box("frame", END - 0.6, END - 0.3, 0.75, 1.65, -0.6, 0.6); });
}

/** The large piston-valve chest over each cylinder, round-ended as the photos show it (steamGear's cylinderDressing, model coordinates). */
function steamChest(m: Steam["m"], _s: number, c: { x0: number; x1: number; y: number; z: number; r: number }): void {
  const vy = c.y + c.r + 0.15;
  const ring = (r: number) => ngon(16, r, Math.PI / 16, c.z, vy);
  m.sweep("paint", "x", ring(0.3), c.x0 + 0.05, ring(0.3), c.x1 - 0.05);
  // its front and rear covers
  for (const x of [c.x0 + 0.02, c.x1 - 0.08]) m.sweep("paint", "x", ring(0.32), x, ring(0.32), x + 0.06);
}

function engine(): LocoSpec {
  return {
    title: "CR JS",
    palette: PALETTE,
    heads: [0, END],
    beams: { front: false, rear: false },
    boiler: { x0: SMOKEBOX[0], x1: 9.7, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [5.5, 7.0, 8.7], band: "paint", n: 24 },
    valves: { x: 10.5, top: 4.38 },
    runningBoard: { profile: [[0.62, 1.38], [1.1, 1.38], [2.05, RB], [CAB0 + 0.02, RB]], half: HALF, valance: 0.08, valanceMat: "white" },
    frame: { x0: 1.0, x1: TRAIL - 0.8, top: 1.65 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.95,
      windows: [{ x0: 11.38, x1: 11.82, y0: 3.0, y1: 3.65 }, { x0: 11.89, x1: 12.46, y0: 3.0, y1: 3.65 }, { x0: 12.5, x1: 12.99, y0: 3.0, y1: 3.65 }],
    },
    // the wide round-topped firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: 9.6, x1: CAB0, half: [[1.12, RB], [1.12, 3.3], [0.95, 3.75], [0.55, 4.02], [0, 4.08]] }],
    bogies: [{ x0: LEAD - 0.62, x1: LEAD + 0.62, y: 0.52 }, { x0: TRAIL - 0.75, x1: TRAIL + 0.75, y: 0.69 }],
    gear: {
      wheels: [
        { x: LEAD, d: 0.84, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.37, spokes: 10, box: true })),
        { x: TRAIL, d: 1.12, spokes: 12, outsideBoxes: true },
      ],
      // two cylinders 580 x 710 mm over the pony truck; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.6, x1: 2.85, y: 1.05, r: 0.38 }, crank: 0.355, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "wheel", cylinderCoverMat: "paint", cylinderDressing: steamChest,
    },
    number: { text: `JS ${JS_NUMBER}` },
    extras: engineExtras,
  };
}

// --- the tender: 9.37 m from the engine's rear head to its coupler face; two two-axle bogies 1.85 m wheelbase, 4.75 m apart ---

const T_AXLES = [1.437, 3.287, 6.187, 8.037];
const T_END = 23.37 - END;
/** The tank on the frame from 0.17 to 8.9 m, 3.0 m wide, from its sole bars at 1.56 m to 4.08 m, its front half raised to 4.3 m round the coal. */
const TANK = { x0: 0.17, x1: 8.9, half: 1.5, bottom: 1.56 };
const TANK_TOP: Pt[] = [[TANK.x0, 4.3], [4.85, 4.3], [5.15, 4.24], [5.35, 4.1], [5.45, 4.08], [TANK.x1, 4.08]];

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("tank", () => {
    const h = TANK.half;
    t.volume({ sec: [[-h, TANK.bottom], [h, TANK.bottom], [h, 4.3], [-h, 4.3]], plan: [[TANK.x0, h], [TANK.x1, h]], top: TANK_TOP, bands: [[TANK.bottom, 4.3, "paint"]] });
  });
  m.scope("underframe", () => {
    // the centre sill and the bolsters over the bogies, open between them as the photos show
    t.box("frame", 0.1, 8.95, 0.98, 1.28, -0.35, 0.35);
    for (const x of [(T_AXLES[0]! + T_AXLES[1]!) / 2, (T_AXLES[2]! + T_AXLES[3]!) / 2]) t.box("frame", x - 0.25, x + 0.25, 0.9, 1.28, -1.45, 1.45);
  });
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("red", s, 0.1, 8.95, 1.28, 1.6, 1.46, 1.545);
  });
  m.scope("rear beam", () => {
    t.box("red", 8.9, 9.06, 0.78, 1.33, -1.45, 1.45);
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, 8.95, 9.25, 0.4, 0.44, 1.12, 1.45);
      // the step's hangers from the beam
      for (const z of [1.15, 1.42]) t.sideBox("paint", s, 9.0, 9.04, 0.44, 0.8, z - 0.02, z + 0.02);
    }
    knuckleCoupler(m, -1, -t.X(T_END) - 0.6, -t.X(T_END), 0.88);
  });
  m.scope("front", () => {
    // the fall plate to the cab floor and the tool boxes either side of the coal opening
    t.box("paint", 0.0, 0.18, 2.24, 2.28, -0.8, 0.8);
    for (const s of [-1, 1]) t.sideBox("paint", s, 0.05, 0.18, 2.3, 3.4, 0.85, 1.45);
  });
  m.scope("emblems", () => {
    for (const s of [-1, 1]) emblem(m, "white", [t.X(3.3), 3.15, s * (TANK.half + 0.004)], [s, 0, 0], [0, 0, s], 0.24);
  });
  m.scope("tender handrails", () => {
    // the rear ladder's stiles and the front grab rails
    for (const s of [-1, 1]) {
      m.rod("white", [t.X(TANK.x1 + 0.08), 1.5, s * 1.3], [t.X(TANK.x1 + 0.08), 4.0, s * 1.3], 0.02, 6);
      m.rod("white", [t.X(TANK.x1 + 0.08), 1.5, s * 0.95], [t.X(TANK.x1 + 0.08), 4.0, s * 0.95], 0.02, 6);
      m.rod("white", [t.X(0.1), 1.5, s * (TANK.half + 0.06)], [t.X(0.1), 3.9, s * (TANK.half + 0.06)], 0.02, 6);
    }
    for (let k = 0; k < 6; k++) {
      const y = 1.9 + k * 0.4;
      m.rod("white", [t.X(TANK.x1 + 0.08), y, -0.95], [t.X(TANK.x1 + 0.08), y, 0.95], 0.015, 6);
    }
    for (const s of [-1, 1]) m.rod("white", [t.X(TANK.x1 + 0.08), 4.0, s * 0.95], [t.X(TANK.x1 - 0.02), 4.0, s * 0.95], 0.02, 6);
  });
  m.scope("water filler", () => t.cylY("paint", 7.6, 0, 4.07, 4.2, 0.28, 10));
}

/** The tender bogies' cast side frames outside the wheels, their axle boxes and springs. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  const mid = (b.x0 + b.x1) / 2;
  for (const s of [-1, 1]) {
    t.sideBox("paint", s, b.x0 + 0.05, b.x1 - 0.05, 0.72, 0.88, 1.0, 1.06);
    t.sideBox("paint", s, mid - 0.45, mid + 0.45, 0.36, 0.72, 1.0, 1.06);
    t.sideBox("steel", s, mid - 0.3, mid + 0.3, 0.55, 0.7, 1.06, 1.1);
    for (const x of axles) t.sideBox("paint", s, x - 0.16, x + 0.16, 0.36, 0.72, 1.06, 1.15);
  }
}

function tender(): LocoSpec {
  return {
    title: "CR JS tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { front: false, rear: false },
    coal: { x0: 0.45, x1: 4.6, y: 4.29, half: 1.3, rise: 0.28 },
    bogies: [{ x0: T_AXLES[0]! - 0.65, x1: T_AXLES[1]! + 0.65, y: 0.62 }, { x0: T_AXLES[2]! - 0.65, x1: T_AXLES[3]! + 0.65, y: 0.62 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "paint" },
    // the headlamp on the rear wall's top
    lamps: { front: [], rear: [[TANK.x1 + 0.22, 3.55, 0]] },
    extras: tenderExtras,
  };
}

/** The JS's engine or tender spec, by the `unit` parameter's value. */
export function jsSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/** The spec its distant model is drawn from: the casing and the tank as prisms. */
export function jsLodSpec(unit: string): LocoSpec {
  if (unit === "tender") {
    const s = tender();
    const h = TANK.half;
    return { ...s, prisms: [{ name: "tank", x0: TANK.x0, x1: 5.15, half: [[h, TANK.bottom], [h, 4.3]] }, { name: "rear tank", x0: 5.15, x1: TANK.x1, half: [[h, TANK.bottom], [h, 4.08]] }, { name: "sole bars", x0: 0.1, x1: 8.95, half: [[1.53, 1.28], [1.53, TANK.bottom - 0.01]], mat: "red" }] };
  }
  const s = engine();
  const box = (top: number): Pt[] => [[CASING.half, CASING.foot], [CASING.half, top]];
  return { ...s, prisms: [...s.prisms!, { name: "heater", x0: CASING.x0, x1: 4.25, half: box(4.71) }, { name: "casing", x0: 4.25, x1: 7.9, half: box(4.36) }] };
}
