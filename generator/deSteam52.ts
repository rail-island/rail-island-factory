// The DR class 52.80 (1'E h2), the Deutsche Reichsbahn's rebuilt Kriegslok, with
// its 2'2' T 30 tub tender (Wannentender), drawn on the steam kit (steamLoco.ts)
// from the side-on photograph of 52 8154 and photographs of 52 8131, 52 8134,
// 52 8177, 52 8079 and the tender of 52 4867 (assets/dr-52/SOURCES.md): the 50E
// boiler on 3.15 m with its long smokebox, the curved smoke deflectors on the
// smokebox's flanks, the mixing preheater's box ahead of the chimney, the feed
// dome, two sand boxes either side of the round steam dome, the running board on
// 2.2 m with its red edge, the red plate frames, wheels and trucks, the plain
// Kriegslok cab with its open entrance and the oval front windows of the
// rebuild, and the tender's rounded tub with the coal box on its front half.
// See docs/models/world-steam.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black upper works, red frames, wheels, trucks and buffer beams; the number plates black with white figures. */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  wheel: mat("#a51a1f", 0.6),
  // the plate frames drawn dark between their red top edges: the real frames' openings, seen in shadow
  frame: mat("#2b2324", 0.8),
  // the deflectors' sheet a little glossier than the smokebox behind them, as the photos show it
  sheet: mat("#3a3d42", 0.35),
  red: mat("#a51a1f", 0.65),
  smokebox: mat("#1c1d22", 0.85),
  plate: mat("#141416", 0.5),
  plateText: mat("#dcd9cf", 0.45),
  coal: { color: "#3a3b3e", metallic: 0.15, roughness: 0.6 },
  coalLump: { color: "#5a5b60", metallic: 0.2, roughness: 0.45 },
  steel: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
  doorRing: { color: "#45484d", metallic: 0.35, roughness: 0.5 },
  // the cab's open entrance, seen into the dark cab
  opening: mat("#0c0c0d", 0.9),
};

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const DR52_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "DR 52", lead: 1, coupled: 5, trail: 0, leadD: 0.85, coupledD: 1.4, trailD: 0, boilerR: 0.88, deflectors: "witte", domes: 2, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.43, axles: 4, d: 1.0 }, number: "52 8154" },
};

const NUMBER = "52 8154-8";

// --- the engine (52 8154 side-on at 49.9 px/m: 22.975 m over buffers, 19.0 m wheelbase with the tender) ---

/** The pony truck's axle, the coupled axles 1.65 m apart. */
const LEAD = 2.0;
const COUPLED = [4.5, 6.15, 7.8, 9.45, 11.1];
/** The engine's rear head; the tender's front head meets it (22.975 m over both). */
const END = 14.55;
/** Boiler centre, radius over the lagging (barrel top 4.03 m); the running board's top. */
const BY = 3.15;
const BR = 0.88;
const RB = 2.2;
/** The smokebox, lengthened for the mixing preheater, from 0.88 to 3.95 m. */
const SMOKEBOX = [0.88, 3.95] as const;
const CAB0 = 11.72;
const CAB1 = 14.45;
const HALF = 1.42;

/** The cab's right half section: the sheets from the floor at 1.64 m, a round roof from 3.62 m to 4.2 m. */
const CAB_HALF: Pt[] = [[1.48, 1.64], [1.48, 3.62], [1.32, 3.94], [0.82, 4.14], [0, 4.2]];

/** A quad wound so its face looks along `out`. */
function face(m: Steam["m"], mat: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  if (q.length === 4) m.quad(mat, q[0]!, q[1]!, q[2]!, q[3]!);
  else m.tri(mat, q[0]!, q[1]!, q[2]!);
}

/** The curved smoke deflectors: from 0.86 m back to a round rear end at 3.33 m, 2.6 to 3.7 m high, bulging to 1.34 m off the centre line. */
const EAR = { x0: 0.86, x1: 3.33, yc: 3.24, half: 0.56, thick: 0.03 };
function earLevels(): Array<{ y: number; z: number; x1: number }> {
  const out: Array<{ y: number; z: number; x1: number }> = [];
  const n = 10;
  const R = EAR.half;
  for (let i = 0; i <= n; i++) {
    const y = EAR.yc - R + (2 * R * i) / n;
    const k = (y - EAR.yc) / (EAR.half + 0.03);
    const z = 0.95 + 0.39 * Math.sqrt(Math.max(0, 1 - k * k));
    // the rear end a half circle in side view
    const d = y - EAR.yc;
    const x1 = EAR.x1 - R + Math.sqrt(Math.max(0, R * R - d * d)) * 0.92 + R * 0.08;
    out.push({ y, z, x1 });
  }
  // the top edge turned in toward the smokebox
  const top = out[out.length - 1]!;
  out.push({ y: top.y + 0.05, z: top.z - 0.14, x1: top.x1 });
  return out;
}

function ears(t: Steam): void {
  const m = t.m;
  const L = earLevels();
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      const P = (x: number, y: number, z: number): Vec3 => [t.X(x), y, s * z];
      for (let i = 0; i + 1 < L.length; i++) {
        const [a, b] = [L[i]!, L[i + 1]!];
        // the outward normal of this strip in (|z|, y)
        const [dz, dy] = [b.z - a.z, b.y - a.y];
        const out: Vec3 = [0, -dz, s * dy];
        const inn: Vec3 = [0, dz, -s * dy];
        const [ai, bi] = [a.z - EAR.thick, b.z - EAR.thick];
        face(m, "sheet", [P(EAR.x0, a.y, a.z), P(a.x1, a.y, a.z), P(b.x1, b.y, b.z), P(EAR.x0, b.y, b.z)], out);
        face(m, "sheet", [P(EAR.x0, a.y, ai), P(a.x1, a.y, ai), P(b.x1, b.y, bi), P(EAR.x0, b.y, bi)], inn);
        // the front and rear edges
        face(m, "sheet", [P(EAR.x0, a.y, a.z), P(EAR.x0, a.y, ai), P(EAR.x0, b.y, bi), P(EAR.x0, b.y, b.z)], [1, 0, 0]);
        face(m, "sheet", [P(a.x1, a.y, a.z), P(a.x1, a.y, ai), P(b.x1, b.y, bi), P(b.x1, b.y, b.z)], [-1, 0, 0]);
      }
      const [lo, hi] = [L[0]!, L[L.length - 1]!];
      face(m, "sheet", [P(EAR.x0, lo.y, lo.z), P(lo.x1, lo.y, lo.z), P(lo.x1, lo.y, lo.z - EAR.thick), P(EAR.x0, lo.y, lo.z - EAR.thick)], [0, -1, 0]);
      face(m, "sheet", [P(EAR.x0, hi.y, hi.z), P(hi.x1, hi.y, hi.z), P(hi.x1, hi.y, hi.z - EAR.thick), P(EAR.x0, hi.y, hi.z - EAR.thick)], [0, 1, 0]);
      // the stays holding the plate to the smokebox
      for (const x of [1.4, 2.6]) t.sideBox("paint", s, x - 0.03, x + 0.03, EAR.yc - 0.03, EAR.yc + 0.03, BR, 1.3);
    }
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  ears(t);
  m.scope("mixing preheater", () => {
    // the preheater's box on the smokebox ahead of the chimney
    t.box("smokebox", 2.0, 3.05, BY + 0.6, 4.15, -0.55, 0.55);
    // its vessels on the running board behind the smokebox, both sides
    for (const s of [-1, 1]) t.cylX("paint", 3.5, 5.55, s * 1.0, RB + 0.25, 0.22, 12);
  });
  m.scope("air reservoirs", () => {
    // the red air reservoir and the round air vessel under the running board between the last drivers
    for (const s of [-1, 1]) {
      t.cylX("red", 9.85, 11.05, s * 1.13, 1.78, 0.2, 12);
      t.cylX("red", 8.7, 9.1, s * 1.13, 1.72, 0.2, 10);
    }
  });
  m.scope("frame top", () => {
    // the red top edge of the plate frames, standing out under the running board
    for (const s of [-1, 1]) {
      t.sideBox("red", s, 0.85, CAB1 - 0.3, 1.6, 1.76, 0.6, 0.66);
      // the horn guides between the coupled wheels
      for (const x of [LEAD + 1.2, ...COUPLED.slice(0, -1).map((c) => c + 0.825), COUPLED[4]! + 0.85]) t.sideBox("red", s, x - 0.07, x + 0.07, 1.0, 1.6, 0.6, 0.66);
      // the frames' red front end over the pony truck, between the buffer beam and the cylinders
      t.sideBox("red", s, 0.8, 2.4, 1.32, 1.6, 0.6, 0.66);
    }
  });
  m.scope("boiler pipes", () => {
    // the feed and steam pipes along the boiler's flanks
    for (const s of [-1, 1]) for (const dy of [-0.45, -0.2]) {
      const z = Math.sqrt(BR * BR - dy * dy) + 0.05;
      t.cylX("paint", 3.98, CAB0 - 0.05, s * z, BY + dy, 0.035, 6);
    }
  });
  m.scope("smokebox saddle", () => {
    // the saddle and steam pipes from the smokebox down to the cylinders
    t.box("smokebox", 2.5, 3.35, 1.45, BY - BR + 0.1, -0.5, 0.5);
    // the frames' front stretcher under the smokebox door, behind the buffer beam
    t.box("smokebox", 0.84, 0.92, 1.33, BY - BR - 0.03, -0.62, 0.62);
  });
  m.scope("smokebox door wheel", () => {
    m.tube("doorRing", "x", 0, BY, BR + 0.05, BR * 0.93, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.035, 24);
    t.cylX("steel", SMOKEBOX[0] - 0.11, SMOKEBOX[0] - 0.075, 0, BY + 0.12, 0.14, 12);
  });
  m.scope("spark plate", () => {
    // the plate under the smokebox door, sloping down to the front
    const pts: Vec3[] = [[t.X(0.9), BY - BR - 0.02, -0.6], [t.X(0.9), BY - BR - 0.02, 0.6], [t.X(1.5), BY - BR + 0.18, 0.6], [t.X(1.5), BY - BR + 0.18, -0.6]];
    m.slab("smokebox", pts, [0, -0.03, 0]);
  });
  m.scope("cab front windows", () => {
    // the rebuild's oval windows either side of the boiler
    const X = t.X(CAB0) + 0.006;
    for (const s of [-1, 1]) {
      const ring = ngon(12, 1, 0, 0, 0).map(([a, b]): Vec3 => [X, 3.3 + b * 0.26, s * 1.12 + a * 0.2]);
      m.slab("glass", ring, [-0.02, 0, 0]);
    }
  });
  m.scope("cab entrance", () => {
    // the open entrance at the cab's rear, between the side sheet and the tender
    for (const s of [-1, 1]) t.sidePanel(CAB_SEC, "opening", s, 13.82, 14.38, 1.8, 3.55);
  });
  m.scope("cab roof vent", () => t.box("roof", 12.5, 13.6, 4.17, 4.28, -0.36, 0.36));
}

const CAB_SEC: Pt[] = [...CAB_HALF, ...[...CAB_HALF].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);

function engine(): LocoSpec {
  return {
    title: "DR 52",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.78, y1: 1.32, length: [0.62, 0.3], half: 1.44 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [5.3, 7.5, 9.35], band: "black", n: 24 },
    chimney: { x: 3.38, top: 4.47, r: 0.29 },
    // the feed dome, the front sand box, the round steam dome and the rear sand box
    domes: [
      { x: 4.15, top: 4.17, r: 0.17 },
      { x: 5.85, top: 4.2, r: 0.42, len: 1.1 },
      { x: 6.95, top: 4.27, r: 0.45 },
      { x: 8.1, top: 4.2, r: 0.42, len: 1.2 },
    ],
    valves: { x: 11.2, top: 4.25 },
    handrail: { x0: 4.0, x1: 11.2, y: BY + 0.35 },
    runningBoard: { profile: [[3.2, RB], [CAB0 + 0.02, RB]], half: HALF, valance: 0.12, valanceMat: "red" },
    frame: { x0: 0.8, x1: END - 0.32, top: 1.62 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.62,
      windows: [{ x0: 12.73, x1: 13.69, y0: 2.75, y1: 3.55 }],
    },
    // the firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: 9.6, x1: CAB0, half: [[BR + 0.05, RB], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR]] }],
    bogies: [{ x0: LEAD - 0.55, x1: LEAD + 0.55, y: 0.53 }],
    bogieFrameMat: "red",
    gear: {
      wheels: [
        { x: LEAD, d: 0.85, spokes: 10, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.4, spokes: 16 })),
      ],
      // two cylinders 600 x 660 mm behind the pony truck; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4, 5], main: 3, cylinder: { x0: 2.4, x1: 3.6, y: 1.04, r: 0.38 }, crank: 0.33, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "wheel", cylinderCoverMat: "paint",
    },
    lamps: { front: [[0.72, 1.36, 0.8], [0.72, 1.36, -0.8], [SMOKEBOX[0] - 0.13, 3.62, 0]], rear: [[CAB1 - 0.05, 1.33, 0.7], [CAB1 - 0.05, 1.33, -0.7]] },
    number: { text: NUMBER, side: [12.8, 1.82, CAB_HALF[0]![0]], front: [SMOKEBOX[0] - 0.075, 2.8] },
    extras: engineExtras,
  };
}

// --- the 2'2' T 30 tub tender: 8.425 m over its buffers, bogies 4.0 m apart with axles 1.9 m apart ---

const T_AXLES = [0.55, 2.45, 4.55, 6.45];
const T_END = 22.975 - END;
/** The tub from 0.05 to 7.8 m: 3.0 wide, its top 3.0 m, its sides upright down to 2.35 m, then a round bottom down to 1.3 m. */
const TUB = { x0: 0.05, x1: 7.8, top: 3.0, side: 2.35, bottom: 1.3, half: 1.5, endRise: 0.7, rearPlan: 0.35 };
/** The coal box on the front half of the tub, narrower than it, its top 4.15 m. */
const COAL = [0.08, 4.45] as const;
const COAL_TOP = 4.15;
const COAL_HALF: Pt[] = [[1.12, TUB.top - 0.02], [1.12, TUB.top + 0.12], [1.02, COAL_TOP]];

/** The tub's (z, y) section at source x. */
function tubSection(x: number): Pt[] {
  const T = TUB;
  const R = T.endRise;
  const into = Math.min(x - T.x0, T.x1 - x);
  const yb = T.bottom + (into < R ? R - Math.sqrt(R * R - (R - into) ** 2) : 0);
  const r = T.rearPlan;
  const w = x > T.x1 - r ? T.half - r + Math.sqrt(Math.max(0, r * r - (x - (T.x1 - r)) ** 2)) : T.half;
  const right: Pt[] = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    right.push([w * Math.sin(a), T.side - (T.side - yb) * Math.cos(a)]);
  }
  right.push([w, T.top - 0.05], [w - 0.05, T.top]);
  const left = [...right].reverse().map(([z, y]): Pt => [-z, y]);
  return [...right, ...left.slice(0, -1)].filter((p, i, all) => i === 0 || Math.abs(p[0] - all[i - 1]![0]) > 1e-9 || Math.abs(p[1] - all[i - 1]![1]) > 1e-9);
}

function tub(t: Steam): void {
  const m = t.m;
  const T = TUB;
  const xs = [T.x0, T.x0 + 0.06, T.x0 + 0.2, T.x0 + 0.4, T.x0 + 0.7, T.x1 - 0.7, T.x1 - 0.4, T.x1 - 0.25, T.x1 - 0.15, T.x1 - 0.06, T.x1];
  m.scope("tub", () => {
    for (let i = 0; i + 1 < xs.length; i++) m.sweep("paint", "x", tubSection(xs[i]!), t.X(xs[i]!), tubSection(xs[i + 1]!), t.X(xs[i + 1]!), false);
    for (const [x, e] of [[T.x0, 1], [T.x1, -1]] as const) m.slab("paint", tubSection(x).map(([z, y]): Vec3 => [t.X(x), y, z]), [-e * 0.002, 0, 0]);
  });
}

function tenderExtras(t: Steam): void {
  const m = t.m;
  tub(t);
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("red", s, 0.31, 7.79, 1.2, 1.44, 1.22, 1.4);
  });
  m.scope("coal box gussets", () => {
    // the triangular stays along the coal box's foot
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const x = COAL[0] + 0.35 + i * ((COAL[1] - COAL[0] - 0.7) / 5);
      const pts: Vec3[] = [[t.X(x), TUB.top + 0.002, s * 1.125], [t.X(x), TUB.top + 0.002, s * 1.42], [t.X(x), TUB.top + 0.5, s * 1.125]];
      m.slab("paint", pts, [-0.04, 0, 0]);
    }
  });
  m.scope("coal lumps", () => {
    const [y, half, rise] = [COAL_TOP - 0.08, 0.94, 0.3];
    const top = (z: number) => {
      const a = Math.abs(z) / half;
      return a <= 0.3 ? y + rise : a <= 0.75 ? y + rise - ((a - 0.3) / 0.45) * 0.4 * rise : y + 0.6 * rise - ((a - 0.75) / 0.25) * 0.6 * rise;
    };
    for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) {
      const x = COAL[0] + 0.4 + i * ((COAL[1] - COAL[0] - 0.8) / 8) + (j % 2) * 0.12;
      const z = (j - 2) * half * 0.36 + ((i * 7 + j * 3) % 5 - 2) * 0.03;
      const r = 0.09 + ((i * 3 + j * 5) % 4) * 0.02;
      const h = top(z);
      m.spire("coalLump", ngon(4, r, (i + j) * 0.7, t.X(x), z), h - 0.05, h + r * 0.5);
    }
  });
  m.scope("rear locker", () => t.box("paint", 7.62, 8.0, 1.46, 2.2, -1.15, 1.15));
  m.scope("water filler", () => t.cylY("paint", 6.6, 0, TUB.top - 0.02, TUB.top + 0.1, 0.25, 10));
  m.scope("tender handrail", () => {
    // the rail along the rear deck and the ladder's stiles on the rear wall
    for (const s of [-1, 1]) m.rod("steel", [t.X(7.75), TUB.top + 0.05, s * 0.6], [t.X(7.75), TUB.top + 0.5, s * 0.6], 0.02, 6);
    m.rod("steel", [t.X(7.75), TUB.top + 0.5, -0.6], [t.X(7.75), TUB.top + 0.5, 0.6], 0.02, 6);
  });
  m.scope("numbers", () => t.endPlate(-1, TUB.x1, 2.6, NUMBER));
}

/** The tender trucks' pressed side frames outside the wheels, their axle boxes and leaf springs. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  for (const s of [-1, 1]) {
    t.sideBox("red", s, b.x0 + 0.05, b.x1 - 0.05, 0.62, 0.9, 1.0, 1.05);
    // the bolster's drop between the axles
    t.sideBox("red", s, (b.x0 + b.x1) / 2 - 0.3, (b.x0 + b.x1) / 2 + 0.3, 0.42, 0.62, 1.0, 1.05);
    for (const x of axles) {
      t.sideBox("red", s, x - 0.17, x + 0.17, 0.36, 0.7, 1.05, 1.12);
      t.sideBox("steel", s, x - 0.45, x + 0.45, 0.9, 0.98, 1.02, 1.1);
    }
  }
}

function tender(): LocoSpec {
  return {
    title: "DR 52 tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.8, y1: 1.3, length: [0.3, 0.62], half: 1.44 },
    frame: { x0: 0.31, x1: 7.79, top: 1.22 },
    prisms: [{ name: "coal box", x0: COAL[0], x1: COAL[1], half: COAL_HALF }],
    coal: { x0: COAL[0] + 0.08, x1: COAL[1] - 0.08, y: COAL_TOP - 0.08, half: 0.94, rise: 0.3 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.6 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.6 }],
    bogieFrameMat: "red",
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    // two lamps on the rear locker and one on the tub's rear deck
    lamps: { front: [], rear: [[8.0, 2.2, 0.85], [8.0, 2.2, -0.85], [7.78, TUB.top, 0]] },
    extras: tenderExtras,
  };
}

/** The DR 52's engine or tender spec, by the `unit` parameter's value. */
export function dr52Spec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/**
 * The spec its distant model is drawn from: the curved deflectors as flat plates
 * at their bulge, the tub as a prism of its middle section.
 */
export function dr52LodSpec(unit: string): LocoSpec {
  if (unit === "tender") {
    const s = tender();
    const mid = tubSection((TUB.x0 + TUB.x1) / 2).filter(([z]) => z >= 0).sort((a, b) => a[1] - b[1]);
    return { ...s, prisms: [{ name: "tub", x0: TUB.x0, x1: TUB.x1, half: mid }, ...s.prisms!] };
  }
  const s = engine();
  const L = earLevels();
  const outline: Pt[] = [...L.map((l): Pt => [EAR.x0, l.y]), ...[...L].reverse().map((l): Pt => [l.x1, l.y])];
  return { ...s, deflectors: { outlines: [outline], z: 1.3 } };
}
