// North American steam: the Union Pacific Big Boy 4-8-8-4 (1941), the
// Pennsylvania Railroad K4s 4-6-2 (1914), the New York Central's Dreyfuss
// streamlined J-3a Hudson 4-6-4 (1938) and a Golden Spike 4-4-0 American (1869:
// the Central Pacific's Jupiter and Union Pacific No. 119). Drawn by the steam
// kit (steamLoco.ts, steamGear.ts) from specs in source x (0 at the front
// coupler face, growing toward the rear), each a locomotive and a tender (the
// `unit` parameter), at their real size on the US loading gauge. Pilots and
// knuckle couplers replace the European buffer beams. See docs/models/us-steam.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import { STEAM_PALETTE, halfAt, mirrored, type Steam } from "./steamParts.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { boxShell, halfTable, sidePlates, steamLocoLod, steamLodSpec, wheelBlocks } from "./lodSteam.ts";
import { fitLod, lodSideBox, lodWheel, simplifyTable, windowBands, type LodBand, type LodPart, type LodShell } from "./lodKit.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import type { Pt } from "./sliceLoft.ts";

type Spec = () => LocoSpec;
const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

const US_STEAM_PALETTE: Record<string, MaterialSpec> = {
  knuckle: { color: "#3a3b3d", roughness: 0.7 },
  handrail: { color: "#c9ccce", roughness: 0.5, metallic: 0.2 },
  graphite: { color: "#55585b", roughness: 0.7, metallic: 0.2 },
  wood: { color: "#7a5532", roughness: 0.9 },
  silver: { color: "#c4c8cc", roughness: 0.35, metallic: 0.3 },
  cream: { color: "#ded6bf", roughness: 0.5 },
};

/**
 * A pilot and a knuckle coupler at a vehicle's end (e +1 the front, at source x
 * `head`): a slatted plate leaning back from the end, or a V-shaped cowcatcher
 * (`vee`) for the 19th-century engines; the coupler's face at the head. It
 * reaches `depth` metres back from the head: a front pilot reaches the frames,
 * so no gap shows between them.
 */
function pilot(t: Steam, e: number, head: number, half: number, top: number, mat: string, vee = false, depth = vee ? 1.1 : 0.55): void {
  const m = t.m;
  const face = t.X(head);
  m.scope(e > 0 ? "front pilot" : "rear pilot", () => {
    const back = face - e * depth;
    if (vee) {
      // two raked planes meeting in a point under the coupler
      for (const s of [-1, 1]) {
        const tip = [face - e * 0.15, 0] as const;
        m.slab(mat, [[tip[0], 0.12, 0], [back, 0.12, s * half], [back, top, s * half], [tip[0] - e * 0.35, top, 0]], [0, 0, -s * 0.03]);
      }
    } else {
      const sec: Pt[] = [[back, 0.15], [face - e * 0.25, 0.15], [face - e * 0.05, top], [back, top]];
      m.sweep(mat, "z", sec, -half, sec, half);
      // the footboard across the front pilot's top
      if (e > 0) t.box("black", Math.min(head + e * 0.35, head + e * 0.55), Math.max(head + e * 0.35, head + e * 0.55), top, top + 0.05, -half, half);
    }
    knuckleCoupler(m, e, e * face - 0.6, e * face, COUPLER_Y);
  });
}

/** The bell on the boiler top. */
function bell(t: Steam, x: number, y: number): void {
  t.m.scope("bell", () => {
    t.cylY("brass", x, 0, y, y + 0.25, 0.14, 10);
    t.cylY("black", x, 0, y - 0.05, y, 0.05, 6);
  });
}

// ---------------------------------------------------------------------------
// Union Pacific Big Boy 4-8-8-4: two engines of four 68 in drivers under one boiler
//
// Measured from the photographs in assets/up-big-boy/ (SOURCES.md): 4014 at Cajon and
// Altoona fitted along the drivers' published pitch, the head-on views of 4018 and 4023
// scaled by the pilot beam. Source x from the front coupler face.

const BB_DRIVER = ft(0, 68);
/** The boiler: centre height, the front ring's radius (the smokebox 4 cm more) and the rear rings' (107 in over the firebox). */
const BB_Y = 3.2;
const BB_R0 = 1.2;
const BB_R1 = 1.3;
/** The smokebox front, the smokebox's end (where the barrel's conical course starts), the course's end, the cab front. */
const BB_SMOKEBOX = 2.75;
const BB_CONE: [number, number] = [7.3, 9.5];
const BB_CAB = 21.0;
/** The running board along the boiler, and the front deck on the pilot beam. */
const BB_BOARD = 3.15;
const BB_DECK = 1.57;
/** The stacks' tops, 3 cm over their casing. */
const BB_STACK = 4.77;

/** The domes along the top: the long sand domes ahead of and behind the round steam dome (the distant model draws all three from this list). */
const BB_DOMES = [{ x: 8.9, top: 4.93, r: 0.5, len: 3.0 }, { x: 11.2, top: 4.8, r: 0.42 }, { x: 15.2, top: 4.93, r: 0.5, len: 2.8 }];

/**
 * A long sand dome on the boiler's top: a rounded hump `len` long, `w` wide (half
 * width), from inside the boiler to `top`, its ends sloping down round.
 */
function bbSandDome(t: Steam, x: number, len: number, w: number, top: number): void {
  const y0 = BB_Y + BB_R0 * 0.8;
  const h = top - y0;
  // the cross-section: upright sides from inside the boiler, a flattened round top
  const sec = (k: number, kh: number): Array<[number, number]> => {
    const pts: Array<[number, number]> = [[w * k, y0]];
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI;
      pts.push([w * k * Math.cos(a), y0 + h * kh * (0.55 + 0.45 * Math.pow(Math.sin(a), 0.6))]);
    }
    pts.push([-w * k, y0]);
    return pts;
  };
  const stations: Array<[number, number, number]> = [[-0.5, 0.62, 0.72], [-0.5 + 0.12 / len, 0.88, 0.93], [-0.5 + 0.38 / len, 1, 1], [0.5 - 0.38 / len, 1, 1], [0.5 - 0.12 / len, 0.88, 0.93], [0.5, 0.62, 0.72]];
  t.m.scope("sand dome", () => {
    for (let i = 0; i + 1 < stations.length; i++) {
      const [fa, ka, ha] = stations[i]!;
      const [fb, kb, hb] = stations[i + 1]!;
      const caps = i === 0 || i === stations.length - 2;
      t.m.sweep("paint", "x", sec(ka, ha), t.X(x + fa * len), sec(kb, hb), t.X(x + fb * len), caps);
    }
  });
}

/** A white legend on a board's face: `text` centred at (u, v) of the face spanned by unit vectors `u` (reading direction) and `v` (up) from `o`, its normal `n`. */
function bbLegend(m: MeshBuilder, text: string, o: Vec3, u: Vec3, v: Vec3, n: Vec3, h: number): void {
  const w = h * 0.58, gap = h * 0.18;
  const width = strokeWidth(text, w, gap);
  const at = ([a, b]: [number, number]): Vec3 => [o[0] + u[0] * a + v[0] * b + n[0] * 0.004, o[1] + u[1] * a + v[1] * b + n[1] * 0.004, o[2] + u[2] * a + v[2] * b + n[2] * 0.004];
  m.facets("plateText", strokeText(text, -width / 2, -h / 2, h, w, gap).map(at), n);
}

/** The Big Boy's front end: the slotted pilot, its beam and the knuckle coupler. */
function bigBoyPilot(t: Steam): void {
  const m = t.m;
  m.scope("front pilot", () => {
    // the pilot beam under the deck
    t.box("paint", 0.12, 0.5, 1.22, 1.55, -1.49, 1.49);
    // the slotted pilot: a flat face with its corners cut back, from the beam down to the rail
    const plan: Array<[number, number]> = [[0.2, -0.95], [0.2, 0.95], [0.6, 1.42], [1.1, 1.42], [1.1, -1.42], [0.6, -1.42]];
    m.slab("paint", plan.map(([x, z]): Vec3 => [t.X(x), 0.13, z]), [0, 1.11, 0]);
    // two rows of slots across the face and its cut corners
    const slots: Vec3[] = [];
    const quad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => slots.push(a, b, c, a, c, d);
    for (const [y0, y1] of [[0.3, 0.62], [0.78, 1.08]] as const) {
      for (let k = 0; k < 8; k++) {
        const z = -0.79 + k * 0.226;
        const X = t.X(0.2) + 0.004;
        quad([X, y0, z - 0.045], [X, y0, z + 0.045], [X, y1, z + 0.045], [X, y1, z - 0.045]);
      }
      for (const s of [-1, 1]) for (const f of [0.3, 0.7]) {
        // along the cut corner from (0.2, 0.95) to (0.6, 1.42), 4 mm proud
        const [xa, za] = [0.2 + 0.4 * (f - 0.08), 0.95 + 0.47 * (f - 0.08)];
        const [xb, zb] = [0.2 + 0.4 * (f + 0.08), 0.95 + 0.47 * (f + 0.08)];
        const [ox, oz] = [-0.0031, 0.0026];
        quad([t.X(xa + ox), y0, s * (za + oz)], [t.X(xb + ox), y0, s * (zb + oz)], [t.X(xb + ox), y1, s * (zb + oz)], [t.X(xa + ox), y1, s * (za + oz)]);
      }
    }
    m.facets("coal", slots, [1, 0, 0]);
    // the steps at the pilot's corners
    for (const s of [-1, 1]) t.sideBox("black", s, 0.7, 1.05, 0.4, 0.44, 1.41, 1.6);
    knuckleCoupler(m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
  });
}

/**
 * The Big Boy's front deck and smokebox front: the air pump shield with its two
 * louvres, the headlight on it with the number box and the Union Pacific shield,
 * the grab rails, the two angled number boards with the bell between them, the
 * marker lamps.
 */
function bigBoyFront(t: Steam): void {
  const m = t.m;
  m.scope("louvres", () => {
    for (const z of [-0.3, 0.3]) {
      t.endPanel("coal", 1, 0.45, z - 0.2, z + 0.2, 1.92, 2.42, 0.01);
      // the slats, 2 mm proud of the recess
      const slats: Vec3[] = [];
      const X = t.X(0.45) + 0.009;
      for (let k = 0; k < 7; k++) {
        const y = 1.97 + k * 0.064;
        slats.push([X, y, z - 0.18], [X, y, z + 0.18], [X, y + 0.025, z + 0.18], [X, y, z - 0.18], [X, y + 0.025, z + 0.18], [X, y + 0.025, z - 0.18]);
      }
      m.facets("paint", slats, [1, 0, 0]);
    }
  });
  m.scope("headlight", () => {
    t.box("paint", 1.0, 1.52, 2.58, 2.8, -0.22, 0.22);
    t.cylX("black", 1.55, 1.08, 0, 3.05, 0.27, 12);
    t.cylX("lampHead", 1.075, 1.055, 0, 3.05, 0.2, 12);
  });
  // the number box beside the headlight, the shield on the shield's top edge
  m.scope("number box", () => {
    t.box("black", 1.12, 1.4, 2.58, 3.06, 0.32, 0.72);
    bbLegend(m, "4014", [t.X(1.12), 2.94, 0.52], [0, 0, -1], [0, 1, 0], [1, 0, 0], 0.13);
  });
  m.scope("shield", () => {
    // the Union Pacific shield on the shield's top edge, below and right of the headlight seen from ahead: white rim round a black field
    const shape: Array<[number, number]> = [[0, -0.2], [0.17, -0.1], [0.19, 0.14], [0.1, 0.19], [0, 0.16], [-0.1, 0.19], [-0.19, 0.14], [-0.17, -0.1]];
    const at = (k: number, dx: number): Vec3[] => shape.map(([z, y]): Vec3 => [t.X(0.45) + dx, 2.6 + y * k, -0.42 + z * k]);
    m.slab("white", at(1, 0.014), [-0.012, 0, 0]);
    m.slab("black", at(0.86, 0.019), [-0.004, 0, 0]);
  });
  m.scope("grab rails", () => {
    for (const s of [-1, 1]) {
      const a: Vec3 = [t.X(0.55), 2.6, s * 0.95];
      const b: Vec3 = [t.X(0.6), 3.4, s * 0.95];
      const c: Vec3 = [t.X(2.2), 3.85, s * 0.95];
      m.rod("steel", a, b, 0.025, 6, false);
      m.rod("steel", b, c, 0.025, 6, false);
      m.rod("steel", c, [t.X(BB_SMOKEBOX + 0.05), 3.85, s * 0.95], 0.025, 6, false);
    }
  });
  m.scope("number boards", () => {
    for (const s of [-1, 1]) {
      // turned 25 degrees outward from the front, on brackets over the smokebox's front ring;
      // the legend reads toward -z (the viewer's right) seen from ahead
      const a = (25 * Math.PI) / 180;
      const uu: Vec3 = [s * Math.sin(a), 0, -Math.cos(a)];
      const nn: Vec3 = [Math.cos(a), 0, s * Math.sin(a)];
      const c: Vec3 = [t.X(BB_SMOKEBOX + 0.3), 4.79, s * 0.52];
      const hw = 0.36, hh = 0.14;
      const corner = (p: number, q: number): Vec3 => [c[0] + uu[0] * p, c[1] + q, c[2] + uu[2] * p];
      m.slab("black", [corner(-hw, -hh), corner(hw, -hh), corner(hw, hh), corner(-hw, hh)], [-nn[0] * 0.05, 0, -nn[2] * 0.05]);
      bbLegend(m, "X4014", c, uu, [0, 1, 0], nn, 0.15);
      t.box("black", BB_SMOKEBOX + 0.32, BB_SMOKEBOX + 0.4, 4.3, 4.66, s * 0.48 - 0.04, s * 0.48 + 0.04);
    }
  });
  bell(t, BB_SMOKEBOX + 0.3, 4.47);
  m.scope("deck steps", () => {
    // up from the deck to the running board at each side
    for (const s of [-1, 1]) for (const y of [2.0, 2.4, 2.8]) t.sideBox("black", s, BB_SMOKEBOX - 0.35, BB_SMOKEBOX - 0.1, y - 0.03, y, 1.3, 1.58);
    for (const s of [-1, 1]) t.sideBox("black", s, BB_SMOKEBOX - 0.12, BB_SMOKEBOX - 0.1, BB_DECK, BB_BOARD - 0.04, 1.3, 1.58);
  });
  m.scope("marker lamps", () => {
    for (const s of [-1, 1]) {
      t.box("black", BB_SMOKEBOX - 0.12, BB_SMOKEBOX + 0.06, 4.1, 4.28, s * 0.78 - 0.08, s * 0.78 + 0.08);
      t.endPanel("glass", 1, BB_SMOKEBOX - 0.12, s * 0.78 - 0.05, s * 0.78 + 0.05, 4.14, 4.24, 0.01);
    }
  });
}

/** The pipes under the running board, the safety valves and whistle, the handrails along the boiler. */
function bigBoyPipework(t: Steam): void {
  const m = t.m;
  const P = (x: number, y: number, z: number): Vec3 => [t.X(x), y, z];
  m.scope("steam pipes", () => {
    const pipe = (r: number, pts: Vec3[]) => { for (let i = 0; i + 1 < pts.length; i++) m.rod("pipe", pts[i]!, pts[i + 1]!, r, 8); };
    // the right side: the front engine's flexible pipe down from the boiler and forward to its
    // cylinders' chest, under the long pipe along the boiler
    pipe(0.17, [P(12.3, 2.62, 1.36), P(10.6, 2.1, 1.36), P(4.9, 2.1, 1.36), P(4.45, 1.8, 1.27)]);
    t.cylX("pipe", 6.9, 13.0, 1.3, 2.62, 0.13, 8);
    // the left side: the rear engine's steam pipe down from the smokebox and back to its
    // cylinders' chest, under the reservoir drum
    pipe(0.17, [P(6.9, 2.62, -1.36), P(9.4, 2.1, -1.36), P(12.4, 2.1, -1.36), P(12.75, 1.8, -1.27)]);
    t.cylX("pipe", 10.2, 12.8, -1.3, 2.62, 0.24, 10);
    // the main reservoir drums over the rear engine
    for (const s of [-1, 1]) t.cylX("pipe", 13.6, 16.4, s * 1.3, 2.5, 0.22, 10);
    // the left side: the front engine's steam pipe down from the smokebox, the feedwater pump ahead of the rear engine
    pipe(0.17, [P(6.6, 2.5, -1.3), P(4.75, 1.85, -1.27)]);
    t.cylY("pipe", 11.55, -1.3, 1.75, 2.55, 0.17, 10);
  });
  m.scope("safety valves", () => {
    for (const dz of [-0.14, 0.14]) t.cylY("steel", 17.8, dz, 4.42, 4.66, 0.07, 8);
  });
  m.scope("steam turret", () => {
    // the turret across the boiler ahead of the cab, the whistle behind it under its angled shield
    t.cylY("black", 18.9, 0, 4.4, 4.56, 0.12, 8);
    t.cylZ("black", 18.9, 4.62, -0.42, 0.42, 0.12, 8);
    t.cylY("steel", 19.35, 0, 4.42, 4.72, 0.06, 8);
    const n: Vec3 = [0.55, 0.83, 0];
    m.slab("black", [[t.X(19.12), 4.62, -0.28], [t.X(19.12), 4.62, 0.28], [t.X(19.5), 4.86, 0.28], [t.X(19.5), 4.86, -0.28]], [-n[0] * 0.02, -n[1] * 0.02, 0]);
    t.box("black", 19.42, 19.48, 4.5, 4.84, -0.03, 0.03);
  });
  m.scope("handrails", () => {
    const y = 4.05;
    // 8 cm off the smokebox, then off the rear rings
    const off = (r: number) => Math.sqrt(r * r - (y - BB_Y) ** 2) + 0.08;
    const [z0, z1] = [off(BB_R0 + 0.04), off(BB_R1)];
    const zAt = (x: number) => (x >= BB_CONE[1] ? z1 : z0 + ((x - 3.2) / (BB_CONE[1] - 3.2)) * (z1 - z0));
    for (const s of [-1, 1]) {
      m.rod("steel", P(3.2, y, s * z0), P(BB_CONE[1], y, s * z1), 0.02, 6);
      m.rod("steel", P(BB_CONE[1], y, s * z1), P(BB_CAB - 0.05, y, s * z1), 0.02, 6);
      for (const x of [4.0, 9.5, 15.0, 20.4]) {
        const z = zAt(x);
        t.sideBox("steel", s, x - 0.015, x + 0.015, y - 0.015, y + 0.015, z - 0.14, z - 0.015);
      }
    }
  });
}

function bigBoySpec(): LocoSpec {
  const drivers = [5.45, 7.3, 9.15, 11.0, 14.5, 16.35, 18.2, 20.05];
  return {
    title: "UP Big Boy",
    palette: {
      ...US_STEAM_PALETTE,
      paint: { color: "#1d1e20", roughness: 0.6 }, wheel: { color: "#34363a", roughness: 0.5 }, frame: { color: "#1d1e20", roughness: 0.65 },
      lining: { color: "#c4c8cc", roughness: 0.4 }, plate: { color: "#1d1e20", roughness: 0.6 }, plateText: { color: "#d9d9d4", roughness: 0.5 },
      // 4014's graphite smokebox and stack casing
      smokebox: { color: "#4c5054", roughness: 0.45, metallic: 0.35 },
      // the smokebox door's ring and dogs, worn lighter
      smokeboxRim: { color: "#6c7075", roughness: 0.4, metallic: 0.4 },
      // the pipes and drums under the running board, glossy black that reads against the boiler
      pipe: { color: "#2e3134", roughness: 0.35, metallic: 0.35 },
    },
    heads: [0, 26.0],
    beams: { front: false, rear: false },
    // the barrel's rear rings and conical course are drawn over it (bigBoyBoiler); it reaches into the cab
    boiler: { x0: BB_SMOKEBOX, x1: BB_CAB + 0.3, y: BB_Y, r: BB_R0, smokebox: BB_CONE[0] - BB_SMOKEBOX, bands: [] },
    // the rear of the two stacks in tandem; the casing over them and the feedwater heater ahead
    chimney: { x: 5.65, top: BB_STACK, r: 0.28 },
    // the steam dome; the sand domes are drawn round-topped (bbSandDome)
    domes: [BB_DOMES[1]!],
    // the deck on the pilot beam, and the running board along the boiler from the smokebox front (no riser across)
    runningBoard: { profile: [[0.1, BB_DECK], [BB_SMOKEBOX - 0.1, BB_DECK], [BB_SMOKEBOX - 0.1, BB_BOARD], [BB_CAB, BB_BOARD]], half: 1.6, valance: 0.06, valanceMat: "lining" },
    frame: { x0: 1.0, x1: 24.8, top: 2.15 },
    cab: {
      // its roof's crown level with the boiler's top
      x0: BB_CAB, x1: 24.6, half: [[1.63, 1.95], [1.63, 4.0], [1.45, 4.3], [0.9, 4.53], [0, 4.6]], roofY: 4.3,
      // a small window ahead, the big one with the running number under it toward the rear
      windows: [{ x0: 21.3, x1: 22.05, y0: 3.2, y1: 3.85 }, { x0: 22.55, x1: 23.95, y0: 3.0, y1: 3.85 }],
      front: [{ z0: 1.22, z1: 1.52, y0: 3.55, y1: 4.0 }, { z0: -1.52, z1: -1.22, y0: 3.55, y1: 4.0 }],
    },
    prisms: [
      // on the front deck: the shield over the air pumps
      { name: "air pump shield", x0: 0.45, x1: 1.65, half: [[1.0, 1.55], [1.0, 2.52], [0.92, 2.6]] },
      // over the smokebox: the feedwater heater and the stacks' casing, flat-topped
      { name: "stack casing", x0: 3.1, x1: 6.2, half: [[0.42, 4.2], [0.42, 4.7], [0.36, 4.74]], mat: "smokebox" },
      // the firebox's sides under the boiler, down between the rear engine and the trailing truck
      { name: "firebox", x0: 16.9, x1: BB_CAB, half: [[1.2, 1.85], [1.3, 2.2], [1.3, 3.08]] },
    ],
    bogies: [{ x0: 1.4, x1: 4.2, y: 0.62 }, { x0: 22.0, x1: 24.75, y: 0.7 }],
    gear: {
      wheels: [
        { x: 2.05, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 3.55, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        ...drivers.map((x) => ({ x, d: BB_DRIVER, spokes: 0 })),
        // the published 72 ft 5.5 in engine wheelbase
        { x: 22.7, d: ft(0, 42), spokes: 0, outsideBoxes: true },
        { x: 24.13, d: ft(0, 42), spokes: 0, outsideBoxes: true },
      ],
      engines: [
        { coupled: [2, 3, 4, 5], main: 4, cylinder: { x0: 3.0, x1: 4.6, y: 1.12, r: 0.42 }, crank: 0.41, phase: 0.3, valveGear: true, name: "front" },
        { coupled: [6, 7, 8, 9], main: 8, cylinder: { x0: 12.0, x1: 13.6, y: 1.12, r: 0.42 }, crank: 0.41, phase: -0.5, valveGear: true, name: "rear" },
      ],
      cylinderZ: 1.2, reference: 4, wheelMaterial: "wheel",
      // sixteen 68 in drivers: their hidden disc rims left out for the detail above
      leanWheels: true,
      // their Boxpok centres: six openings round the hub
      discOpenings: 6,
    },
    extras: (t) => {
      const m = t.m;
      m.scope("boiler", () => {
        // the conical course and the rear rings over the firebox, into the cab
        const ring = (r: number) => ngon(20, r, Math.PI / 20, 0, BB_Y);
        m.sweep("paint", "x", ring(BB_R1), t.X(BB_CONE[1]), ring(BB_R0 + 0.005), t.X(BB_CONE[0]), false);
        t.cylX("paint", BB_CONE[1], BB_CAB + 0.3, 0, BB_Y, BB_R1, 20, false);
      });
      m.scope("front stack", () => t.cylY("smokebox", 4.75, 0, 4.68, BB_STACK, 0.33, 14));
      for (const d of [BB_DOMES[0]!, BB_DOMES[2]!]) bbSandDome(t, d.x, d.len!, d.r, d.top);
      // the smokebox saddle's foot under the smokebox, black like the frames
      m.scope("saddle", () => t.box("black", BB_SMOKEBOX + 0.1, BB_CONE[0] - 0.05, 1.6, 2.0, -0.92, 0.92));
      m.scope("smokebox door ring", () => {
        // the door's rim and four of its dogs on the smokebox front
        const X = t.X(BB_SMOKEBOX);
        m.tube("smokeboxRim", "x", 0, BB_Y, BB_R0 * 0.82 + 0.06, BB_R0 * 0.82 - 0.03, X + 0.01, X + 0.05, 12, Math.PI / 12);
        for (let k = 0; k < 4; k++) {
          const a = Math.PI / 4 + (k * Math.PI) / 2;
          const [z, y] = [Math.cos(a) * (BB_R0 * 0.82 + 0.12), BB_Y + Math.sin(a) * (BB_R0 * 0.82 + 0.12)];
          t.box("smokeboxRim", BB_SMOKEBOX - 0.04, BB_SMOKEBOX + 0.01, y - 0.04, y + 0.04, z - 0.04, z + 0.04);
        }
      });
      bigBoyPilot(t);
      bigBoyFront(t);
      bigBoyPipework(t);
      m.scope("numbers", () => { for (const s of [-1, 1]) t.sidePlate(s, 23.25, 2.61, "4014", 1.63, 0.26); });
      m.scope("cab steps", () => {
        // the ladder up to the cab at its rear corners
        for (const s of [-1, 1]) {
          for (const x of [24.0, 24.5]) t.sideBox("black", s, x - 0.03, x + 0.03, 1.05, 1.96, 1.42, 1.6);
          for (const y of [1.1, 1.45]) t.sideBox("black", s, 24.03, 24.47, y - 0.03, y, 1.42, 1.6);
        }
      });
      t.m.scope("drawbar", () => t.box("black", 24.6, 26.0, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function bigBoyTenderSpec(): LocoSpec {
  // 132 ft 9.25 in over both: 14.47 m behind the engine's 26.0; the last axle 117 ft 7 in behind the engine's first
  const wheels = [1.75, 3.55, 5.29, 6.94, 8.59, 10.24, 11.89];
  return {
    title: "UP Big Boy tender",
    palette: bigBoySpec().palette,
    heads: [0, 14.47],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 14.1, top: 1.35 },
    prisms: [
      // the tank: its sides flat, the lower edge tucked in over the trucks, the top edge rounded
      { name: "tank", x0: 0.3, x1: 14.0, half: [[1.45, 1.35], [1.48, 2.15], [1.6, 2.25], [1.6, 4.15], [1.52, 4.32], [1.36, 4.4]] },
      // the coal space's raised sides over the front
      { name: "coal sides", x0: 0.45, x1: 6.2, half: [[1.38, 4.34], [1.38, 4.55], [1.3, 4.6]] },
    ],
    coal: { x0: 0.6, x1: 6.0, y: 4.55, half: 1.2, rise: 0.1 },
    bogies: [{ x0: 1.1, x1: 4.2, y: 0.62 }, { x0: 4.65, x1: 12.55, y: 0.62 }],
    gear: { wheels: wheels.map((x) => ({ x, d: ft(0, 42), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[14.2, 3.7, 0]] },
    extras: (t) => {
      // the railroad's name, widely spaced at mid height, straight on the tank
      t.m.scope("lettering", () => {
        const h = 0.32, w = h * 0.62, gap = h * 0.45;
        const width = strokeWidth("UNION PACIFIC", w, gap);
        for (const s of [-1, 1]) {
          const u0 = t.X(7.3) + (s > 0 ? -width / 2 : width / 2);
          t.m.facets("plateText", strokeText("UNION PACIFIC", u0, 2.39, h, w, gap, s < 0, h * 0.14).map(([u, v]): Vec3 => [u, v, s * 1.604]), [0, 0, s]);
        }
      });
      t.m.scope("top fittings", () => {
        // the railings along the coal space's sides, the water hatch behind it
        for (const s of [-1, 1]) {
          t.cylX("steel", 0.7, 6.0, s * 1.3, 4.9, 0.02, 6);
          for (const x of [0.8, 2.5, 4.2, 5.9]) t.sideBox("steel", s, x - 0.02, x + 0.02, 4.58, 4.9, 1.28, 1.32);
        }
        t.cylY("black", 9.6, 0, 4.36, 4.52, 0.38, 12);
      });
      // the full-depth front of the tank's sides, ahead of the tucked-in lower edge
      t.m.scope("front skirt", () => { for (const s of [-1, 1]) t.sideBox("paint", s, 0.3, 1.9, 1.35, 2.25, 1.44, 1.6); });
      t.m.scope("rear ladders", () => {
        for (const s of [-1, 1]) for (const z of [1.15, 1.5]) t.sideBox("steel", s, 13.98, 14.04, 1.4, 4.4, z - 0.02, z + 0.02);
      });
      pilot(t, -1, 14.47, 1.3, 1.25, "paint", false, 0.45);
    },
  };
}

// ---------------------------------------------------------------------------
// PRR K4s 4-6-2: the Pennsylvania's express Pacific, 80 in drivers and a Belpaire firebox
//
// Measured on the 1914 general arrangement drawing (assets/prr-k4s/drawing-k4s.jpg, 92.3 px/m
// from the published 36 ft 2 in wheelbase) and the 1927 builder's photo of 5400 (65.2 px/m from
// the drivers' 6 ft 11 in pitch); the front end, cab and tender as on the preserved 1361 and 3750
// (SOURCES.md, "Measurements"). Source x from the front coupler face, 0.17 m ahead of the pilot.

/** The axles: lead truck, drivers (6 ft 11 in apart), the trailing truck 10 ft 6 in behind. */
const K4_AXLES = [1.27, 3.35, 4.87, 6.98, 9.09, 12.29];
/** The boiler: the smokebox's centre and radius (the kit adds 4 cm), its front face and end, the conical course's end and the rear rings. */
const K4_Y = 2.99;
const K4_R = 0.98;
const K4_FRONT = 1.43;
const K4_SMOKEBOX = 3.09;
const K4_CONE = 7.4;
const K4_Y1 = 3.07;
const K4_R1 = 1.1;
/** The Belpaire firebox's front, the cab's front and rear, the running board's height (clear of the drivers' 2.03 m tops). */
const K4_BELPAIRE = 9.17;
const K4_CAB: [number, number] = [12.97, 14.6];
const K4_BOARD = 2.15;
/** The Belpaire firebox's right half: flat sides and a flat top joined by square shoulders. */
const K4_FIREBOX: Pt[] = [[1.0, 1.55], [1.12, 1.95], [1.12, 3.85], [1.08, 4.03], [0.98, 4.13], [0.84, 4.18], [0, 4.19]];
const K4_NUMBER = "1361";

/** A quad facing away from `inside`. */
function k4Quad(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, inside: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const mid = [(a[0] + c[0]) / 2 - inside[0], (a[1] + c[1]) / 2 - inside[1], (a[2] + c[2]) / 2 - inside[2]];
  if (n[0] * mid[0]! + n[1] * mid[1]! + n[2] * mid[2]! < 0) n = [-n[0], -n[1], -n[2]];
  m.facets(mat, [a, b, c, a, c, d], n);
}

/**
 * The K4s's cast steel pilot: a narrow face, about the frames' width, leaning back from
 * under the thin front deck to the rail, its cheeks swept back clear of the lead truck,
 * the coupler under the deck, the steps at the deck's corners and up to the platform.
 */
function k4sPilot(t: Steam): void {
  const m = t.m;
  m.scope("front pilot", () => {
    const P = (x: number, y: number, z: number): Vec3 => [t.X(x), y, z];
    // the thin deck plate over the coupler, back to the smokebox saddle
    t.box("black", 0.12, 1.5, 1.12, 1.16, -1.2, 1.2);
    // the face: from under the deck (x 0.16, 1.1 m) to the rail (x 0.6, 0.1 m)
    const ft: Vec3[] = [P(0.16, 1.1, -0.72), P(0.16, 1.1, 0.72), P(0.6, 0.1, 0.5), P(0.6, 0.1, -0.5)];
    const bk: Vec3[] = [P(0.78, 1.1, -0.72), P(0.78, 1.1, 0.72), P(0.86, 0.1, 0.5), P(0.86, 0.1, -0.5)];
    const inside = P(0.6, 0.6, 0);
    k4Quad(m, "black", ft[0]!, ft[1]!, ft[2]!, ft[3]!, inside);
    k4Quad(m, "black", bk[0]!, bk[1]!, bk[2]!, bk[3]!, inside);
    for (const [i, j] of [[0, 3], [1, 2]] as const) k4Quad(m, "black", ft[i]!, bk[i]!, bk[j]!, ft[j]!, inside);
    k4Quad(m, "black", ft[2]!, ft[3]!, bk[3]!, bk[2]!, inside);
    // three ribs across the face
    for (const k of [0.3, 0.55, 0.8]) {
      const y = 1.1 - k, x = 0.16 + k * 0.44, hz = 0.72 - k * 0.22;
      m.slab("black", [P(x - 0.012, y + 0.035, -hz + 0.05), P(x - 0.012, y + 0.035, hz - 0.05), P(x - 0.012, y - 0.035, hz - 0.05), P(x - 0.012, y - 0.035, -hz + 0.05)], [-0.03, 0, 0]);
    }
    // the steps at the deck's corners and up to the front platform
    for (const s of [-1, 1]) {
      t.sideBox("black", s, 0.25, 0.55, 0.62, 0.66, 1.0, 1.2);
      for (const x of [0.27, 0.53]) t.sideBox("black", s, x - 0.02, x + 0.02, 0.66, 1.12, 1.16, 1.2);
      for (const y of [1.5, 1.8]) t.sideBox("black", s, 0.98, 1.22, y - 0.03, y, 1.2, 1.42);
      t.sideBox("black", s, 1.2, 1.23, 1.16, K4_BOARD - 0.04, 1.2, 1.42);
    }
    knuckleCoupler(m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
  });
}

/** The K4s's smokebox front: the keystone number plate on the door, the headlight on top with its number boards, the turbo-generator, the marker lamps. */
function k4sFront(t: Steam): void {
  const m = t.m;
  m.scope("keystone", () => {
    // the PRR keystone: gold rim, red field, gold number, on the door over the dart handle
    const X = t.X(K4_FRONT) + 0.105;
    const shape = (k: number): Vec3[] => ([[-0.23, 0.24], [0.23, 0.24], [0.23, 0.16], [0.15, -0.24], [-0.15, -0.24], [-0.23, 0.16]] as const).map(([z, y]): Vec3 => [X, K4_Y - 0.04 + y * k, z * k]);
    m.slab("gold", shape(1), [-0.015, 0, 0]);
    m.slab("keystone", shape(0.86).map(([x, y, z]): Vec3 => [x + 0.004, y, z]), [-0.006, 0, 0]);
    bbLegend(m, K4_NUMBER, [X + 0.004, K4_Y - 0.02, 0], [0, 0, -1], [0, 1, 0], [1, 0, 0], 0.13);
  });
  m.scope("headlight", () => {
    // the electric headlight on top of the smokebox front, its number boards on its sides
    t.cylX("black", 1.12, 1.78, 0, 4.24, 0.25, 12);
    t.cylX("lampHead", 1.11, 1.12, 0, 4.24, 0.19, 12);
    t.box("black", 1.3, 1.72, 3.96, 4.02, -0.16, 0.16);
    for (const s of [-1, 1]) {
      t.sideBox("black", s, 1.3, 1.64, 4.1, 4.36, 0.25, 0.29);
      bbLegend(m, K4_NUMBER, [t.X(1.47), 4.23, s * 0.29], [s, 0, 0], [0, 1, 0], [0, 0, s], 0.13);
    }
  });
  m.scope("turbo-generator", () => {
    t.cylZ("black", 1.95, 4.12, -0.2, 0.2, 0.13, 8);
    t.box("black", 1.85, 2.05, 3.95, 4.04, -0.12, 0.12);
  });
  m.scope("smokebox door ring", () => {
    // the door's rim and eight of its dogs on the smokebox front
    const X = t.X(K4_FRONT);
    m.tube("smokeboxRim", "x", 0, K4_Y, K4_R * 0.82 + 0.06, K4_R * 0.82 - 0.03, X + 0.01, X + 0.05, 16, Math.PI / 16);
    // the door's plain dished face over the kit's hinge straps (the K4s's are not seen)
    const face = ngon(20, K4_R * 0.8, Math.PI / 20, 0, K4_Y);
    m.sweep("smokebox", "x", face, X + 0.088, face, X + 0.098);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      const [z, y] = [Math.cos(a) * (K4_R * 0.82 + 0.12), K4_Y + Math.sin(a) * (K4_R * 0.82 + 0.12)];
      t.box("smokeboxRim", K4_FRONT - 0.04, K4_FRONT + 0.01, y - 0.035, y + 0.035, z - 0.035, z + 0.035);
    }
  });
  m.scope("grab rail", () => {
    // across the smokebox front over the door, on two stand-offs
    m.rod("steel", [t.X(K4_FRONT - 0.07), 3.86, -0.5], [t.X(K4_FRONT - 0.07), 3.86, 0.5], 0.02, 6);
    for (const z of [-0.45, 0.45]) t.box("steel", K4_FRONT - 0.07, K4_FRONT + 0.02, 3.845, 3.875, z - 0.015, z + 0.015);
  });
  m.scope("marker lamps", () => {
    for (const s of [-1, 1]) {
      t.box("black", K4_FRONT - 0.1, K4_FRONT + 0.06, 3.55, 3.72, s * 0.72 - 0.07, s * 0.72 + 0.07);
      t.endPanel("glass", 1, K4_FRONT - 0.1, s * 0.72 - 0.045, s * 0.72 + 0.045, 3.59, 3.68, 0.01);
    }
  });
}

/** The boiler behind the smokebox, the pipes, the handrails, the fittings on the running boards. */
function k4sBoiler(t: Steam): void {
  const m = t.m;
  const P = (x: number, y: number, z: number): Vec3 => [t.X(x), y, z];
  m.scope("boiler", () => {
    // the conical course up to the rear rings, which run into the Belpaire firebox
    const ring = (r: number, y: number) => ngon(20, r, Math.PI / 20, 0, y);
    m.sweep("paint", "x", ring(K4_R1, K4_Y1), t.X(K4_CONE), ring(K4_R + 0.02, K4_Y), t.X(K4_SMOKEBOX), false);
    t.cylX("paint", K4_CONE, K4_BELPAIRE + 0.15, 0, K4_Y1, K4_R1, 20, false);
  });
  m.scope("steam pipes", () => {
    // outside steam pipes from the smokebox's sides down through the running board to the steam chests
    for (const s of [-1, 1]) {
      m.rod("paint", P(2.72, 2.6, s * 0.84), P(2.66, 2.0, s * 1.14), 0.12, 8);
      m.rod("paint", P(2.66, 2.0, s * 1.14), P(2.52, 1.62, s * 1.2), 0.12, 8);
    }
  });
  m.scope("handrails", () => {
    // 8 cm off the smokebox, the conical course and the firebox's flat sides
    const y = 3.45;
    const pts: Array<[number, number]> = [[1.6, 0.99], [K4_SMOKEBOX, 0.99], [K4_CONE, 1.11], [K4_BELPAIRE - 0.1, 1.11], [K4_BELPAIRE + 0.05, 1.2], [K4_CAB[0] - 0.05, 1.2]];
    for (const s of [-1, 1]) {
      for (let i = 0; i + 1 < pts.length; i++) m.rod("steel", P(pts[i]![0], y, s * pts[i]![1]), P(pts[i + 1]![0], y, s * pts[i + 1]![1]), 0.02, 6, false);
      for (const [x, z] of [[2.2, 0.99], [5.2, 1.04], [8.2, 1.11], [11.2, 1.2]] as const) t.sideBox("steel", s, x - 0.015, x + 0.015, y - 0.015, y + 0.015, z - 0.13, z - 0.015);
    }
  });
  m.scope("air pumps", () => {
    // the cross-compound air pump on the left running board ahead of the firebox
    for (const x of [8.2, 8.58]) {
      t.cylY("pipe", x, -1.27, K4_BOARD, 2.95, 0.15, 10);
      t.cylY("pipe", x, -1.27, 2.95, 3.02, 0.11, 10);
    }
    // on the right, the pumps hung under the running board ahead of the drivers, clear of the crosshead
    for (const x of [3.33, 3.72]) {
      t.cylY("pipe", x, 1.47, 1.45, K4_BOARD - 0.04, 0.17, 10, false);
      t.cylY("pipe", x, 1.47, 1.38, 1.45, 0.12, 10, false);
    }
  });
  m.scope("running board box", () => t.sideBox("pipe", 1, 4.9, 6.3, K4_BOARD, 2.45, 1.16, 1.45));
  m.scope("reach rod", () => m.rod("steel", P(12.9, 2.22, -1.32), P(5.4, 2.22, -1.32), 0.025, 6));
  m.scope("sand pipes", () => {
    // from the sand dome down the boiler's side, 5 cm off it, forward to the running board
    for (const s of [-1, 1]) {
      const pts = [30, 60, 90, 112].map((deg, k): Vec3 => {
        const a = (deg * Math.PI) / 180;
        return P(5.85 - k * 0.18, 3.04 + 1.12 * Math.cos(a), s * 1.12 * Math.sin(a));
      });
      pts.push(P(5.2, K4_BOARD, s * 1.0));
      for (let i = 0; i + 1 < pts.length; i++) m.rod("pipe", pts[i]!, pts[i + 1]!, 0.025, 6);
    }
  });
  // the feed pipe from the air pump forward along the boiler's left side
  m.scope("air pipe", () => m.rod("pipe", P(8.05, 2.32, -0.88), P(3.2, 2.32, -0.88), 0.04, 6));
  m.scope("whistle", () => {
    t.cylY("steel", 10.0, 0.3, 4.1, 4.4, 0.045, 8);
    t.cylY("brass", 10.0, 0.3, 4.4, 4.48, 0.06, 8);
  });
}

/** The cab: its long roof over the firebox's back and the tender's front, the number plates, the ladders. */
function k4sCab(t: Steam): void {
  const m = t.m;
  m.scope("cab roof", () => {
    m.scope("roof", () => t.section("roof", 12.92, 15.25, mirrored([[1.63, 3.58], [1.6, 3.9], [1.38, 4.15], [0.9, 4.33], [0, 4.39]])));
    // the hood forward over the firebox's back, shading the front windows
    m.scope("hood", () => {
      const full = mirrored([[1.3, 3.92], [1.22, 4.12], [0.9, 4.3], [0, 4.36]]);
      // its front rounded down toward the firebox's top
      t.m.sweep("roof", "x", full, t.X(12.3), mirrored([[1.22, 3.98], [1.12, 4.12], [0.8, 4.22], [0, 4.26]]), t.X(11.8));
      t.m.sweep("roof", "x", full, t.X(13.1), full, t.X(12.3), false);
    });
    m.scope("ventilator", () => t.box("roof", 12.95, 14.9, 4.37, 4.45, -0.18, 0.18));
  });
  m.scope("numbers", () => {
    for (const s of [-1, 1]) {
      // gold-rimmed plate under the window
      t.sideBox("gold", s, 13.47, 14.13, 2.21, 2.56, 1.558, 1.568);
      t.sidePlate(s, 13.8, 2.28, K4_NUMBER, 1.56, 0.17);
    }
  });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) {
      for (const x of [14.25, 14.55]) t.sideBox("black", s, x - 0.025, x + 0.025, 0.95, 1.95, 1.42, 1.5);
      for (const y of [1.0, 1.4]) t.sideBox("black", s, 14.27, 14.53, y - 0.03, y, 1.42, 1.5);
      t.sideBox("steel", s, 14.62, 14.65, 2.1, 3.4, 1.5, 1.53);
    }
  });
}

/**
 * Behind the rear driver, open as on 5400: the frame as thin bars over the trailing
 * truck, the ash pan under the firebox's foot, the deck plate under the cab.
 */
function k4sTrailing(t: Steam): void {
  t.m.scope("trailing frame", () => {
    for (const s of [-1, 1]) {
      t.sideBox("frame", s, 10.2, 14.45, 1.38, 1.52, 0.5, 0.6);
      t.sideBox("frame", s, 10.2, 11.4, 0.62, 0.74, 0.5, 0.6);
      t.sideBox("frame", s, 11.3, 11.42, 0.74, 1.38, 0.5, 0.6);
    }
    t.box("frame", 13.2, 14.45, 1.52, 1.58, -0.75, 0.75);
  });
  t.m.scope("ash pan", () => {
    t.box("black", 10.15, K4_CAB[0] - 0.1, 1.48, 1.56, -1.04, 1.04);
    t.box("black", 10.2, 11.5, 1.12, 1.48, -0.45, 0.45);
  });
}

function k4sSpec(): LocoSpec {
  const [lead0, lead1, d0, d1, d2, trail] = K4_AXLES as [number, number, number, number, number, number];
  return {
    title: "PRR K4s",
    palette: {
      ...US_STEAM_PALETTE,
      // Brunswick green, near black; the smokebox and stack graphite
      paint: { color: "#1f2c24", roughness: 0.55 }, wheel: { color: "#1c1d1f", roughness: 0.6 }, frame: { color: "#1c1d1f", roughness: 0.65 },
      smokebox: { color: "#3c3f42", roughness: 0.7, metallic: 0.2 },
      smokeboxRim: { color: "#4a4e52", roughness: 0.5, metallic: 0.3 },
      roof: { color: "#1b231e", roughness: 0.7 },
      lining: { color: "#d4b05a", roughness: 0.4 }, gold: { color: "#c9a24e", roughness: 0.4, metallic: 0.3 },
      plate: { color: "#1f2c24", roughness: 0.55 }, plateText: { color: "#d4b05a", roughness: 0.4 },
      keystone: { color: "#b3261e", roughness: 0.5 },
      pipe: { color: "#2a2e2c", roughness: 0.45, metallic: 0.3 },
      cylinder: { color: "#1e1f21", roughness: 0.6 },
    },
    heads: [0, 14.86],
    beams: { front: false, rear: false },
    // the smokebox; the conical course and the rear rings are drawn over the barrel's stub (k4sBoiler)
    boiler: { x0: K4_FRONT, x1: K4_SMOKEBOX + 0.2, y: K4_Y, r: K4_R, smokebox: K4_SMOKEBOX - K4_FRONT, bands: [] },
    chimney: { x: 2.48, top: 4.57, r: 0.3 },
    // the sand dome and the steam dome
    domes: [{ x: 5.96, top: 4.53, r: 0.5 }, { x: 8.07, top: 4.45, r: 0.45 }],
    valves: { x: 9.6, top: 4.42 },
    // the front platform ahead of the smokebox, the running boards along the boiler
    runningBoard: { profile: [[0.95, K4_BOARD], [K4_CAB[0] + 0.03, K4_BOARD]], half: 1.5, valance: 0.035 },
    // the plate frames to the rear driver; behind it the frame is bars (k4sTrailing)
    frame: { x0: 1.4, x1: 10.25, top: 1.6 },
    cab: {
      x0: K4_CAB[0], x1: K4_CAB[1], half: [[1.56, 1.95], [1.56, 3.62], [1.5, 3.88], [1.3, 4.1], [0.85, 4.25], [0, 4.3]], roofY: 4.3,
      // the sash window in two panes; the front windows beside the firebox
      windows: [{ x0: 13.56, x1: 13.98, y0: 2.74, y1: 3.42 }, { x0: 14.04, x1: 14.46, y0: 2.74, y1: 3.42 }],
      front: [{ z0: 1.15, z1: 1.48, y0: 2.95, y1: 3.5 }, { z0: -1.48, z1: -1.15, y0: 2.95, y1: 3.5 }],
    },
    prisms: [{ name: "firebox", x0: K4_BELPAIRE, x1: K4_CAB[0] + 0.08, half: K4_FIREBOX }],
    bogies: [{ x0: lead0 - 0.35, x1: lead1 + 0.35, y: 0.55 }, { x0: trail - 0.6, x1: trail + 0.65, y: 0.68 }],
    gear: {
      wheels: [
        { x: lead0, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: lead1, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: d0, d: ft(0, 80), spokes: 20 },
        { x: d1, d: ft(0, 80), spokes: 20 },
        { x: d2, d: ft(0, 80), spokes: 20 },
        { x: trail, d: ft(0, 50), spokes: 12, outsideBoxes: true },
      ],
      // 27 by 28 in cylinders
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 1.92, x1: 3.06, y: 1.03, r: 0.4 }, crank: 0.356, phase: 0.4, valveGear: true }],
      cylinderZ: 1.2, reference: 3, wheelMaterial: "wheel",
      // black cylinders and covers, as on 1361
      cylinderMat: "cylinder", cylinderCoverMat: "pipe",
    },
    extras: (t) => {
      k4sBoiler(t);
      bell(t, 4.06, 4.06);
      k4sFront(t);
      k4sPilot(t);
      k4sCab(t);
      k4sTrailing(t);
      t.m.scope("drawbar", () => t.box("black", 14.4, 14.86, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

/** The 130-P-75 tender 1361 has carried since the 1950s: 13,475 US gallons and 22 tons of coal. */
function k4sTenderSpec(): LocoSpec {
  return {
    title: "PRR K4s tender",
    palette: k4sSpec().palette,
    heads: [0, 13.4],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 12.9, top: 1.3 },
    prisms: [
      // flat sides, the lower edge turned in over the trucks, the top edge rounded
      { name: "tank", x0: 0.45, x1: 12.8, half: [[1.45, 1.3], [1.55, 1.42], [1.55, 3.55], [1.5, 3.62]] },
      // the coal space's raised sides over the front
      { name: "coal sides", x0: 0.5, x1: 5.0, half: [[1.55, 3.55], [1.55, 4.0], [1.47, 4.06]] },
    ],
    coal: { x0: 0.7, x1: 4.85, y: 4.0, half: 1.4, rise: 0.3 },
    bogies: [{ x0: 1.2, x1: 4.6, y: 0.6 }, { x0: 8.4, x1: 11.8, y: 0.6 }],
    gear: { wheels: [1.7, 2.9, 4.1, 8.9, 10.1, 11.3].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[12.72, 3.62, 0]] },
    extras: (t) => {
      const m = t.m;
      // the coal space's sides sloping down to the tank top behind it
      m.scope("coal sides", () => { for (const s of [-1, 1]) t.deflector(s, [[5.0, 3.56], [5.95, 3.56], [5.0, 4.0]], 1.52); });
      // "PENNSYLVANIA" in gold Roman letters along the tank's middle
      m.scope("lettering", () => {
        const h = 0.34, w = h * 0.66, gap = h * 0.45;
        const width = strokeWidth("PENNSYLVANIA", w, gap);
        for (const s of [-1, 1]) {
          const u0 = t.X(6.6) + (s > 0 ? -width / 2 : width / 2);
          m.facets("plateText", strokeText("PENNSYLVANIA", u0, 2.2, h, w, gap, s < 0, h * 0.13).map(([u, v]): Vec3 => [u, v, s * 1.554]), [0, 0, s]);
        }
      });
      m.scope("top fittings", () => {
        // the water hatch
        t.cylY("black", 9.4, 0, 3.55, 3.74, 0.36, 12);
      });
      m.scope("rear ladders", () => {
        for (const s of [-1, 1]) for (const z of [1.2, 1.46]) t.sideBox("steel", s, 12.8, 12.85, 1.4, 3.55, z - 0.02, z + 0.02);
      });
      m.scope("front steps", () => {
        for (const s of [-1, 1]) {
          for (const x of [0.5, 0.8]) t.sideBox("black", s, x - 0.025, x + 0.025, 0.95, 1.3, 1.42, 1.5);
          t.sideBox("black", s, 0.52, 0.78, 1.0, 1.03, 1.42, 1.5);
        }
      });
      pilot(t, -1, 13.4, 1.3, 1.2, "black", false, 0.45);
    },
  };
}

// ---------------------------------------------------------------------------
// NYC J-3a Hudson 4-6-4 in Henry Dreyfuss's streamlining (the 20th Century Limited)
//
// Measured from the photographs in assets/nyc-hudson/ (SOURCES.md, "Measurements"): the
// side views of 5450-series units scaled by the 79 in drivers, the World's Fair and test-run
// three-quarter views for the nose. The published figures fix the axles: 79 in drivers 14 ft
// apart, 36 in lead and 36/51 in trailing wheels, 40 ft 4 in over the engine's axles, 83 ft
// 7.5 in over all, 97 ft 2 in over the couplers, 15 ft 1 in high. Source x from the front
// coupler face.

const HU_DRIVER = ft(0, 79);
/** The axles: lead truck, the drivers 14 ft apart, the trailing truck (36 and 51 in wheels). */
const HU_LEAD = [2.5, 4.85];
const HU_DRIVERS = [6.8, 8.934, 11.068];
const HU_TRAILING: Array<[number, number]> = [[13.07, ft(0, 36)], [14.79, ft(0, 51)]];
/** The bullet nose: half an ellipsoid about the boiler's axis (height y, radius r), its tip at source x `tip`, its equator at `x`, the casing's front. */
const HU_DOME = { y: 3.2, r: 1.12, tip: 1.05, x: 2.0 };
/** The casing over the boiler, the right half of its section bottom to top (its bottom is cut by HU_CASING_BOTTOM). */
const HU_CASING: Pt[] = [[1.45, 1.2], ...Array.from({ length: 9 }, (_, i): Pt => {
  // the shoulder: a full quarter round from the side to the flat top over the vent
  const a = (i / 8) * (Math.PI / 2);
  return [Math.round((0.3 + 1.15 * Math.pow(Math.cos(a), 0.85)) * 1000) / 1000, Math.round((3.35 + 1.2 * Math.pow(Math.sin(a), 0.85)) * 1000) / 1000];
})];
const HU_TOP = 4.55;
/** The casing's lower edge: the shelf over the drivers, then the skirt arching down behind the last driver over the trailing truck. */
const HU_SHELF = 2.45;
const HU_CASING_BOTTOM: Pt[] = [[2.0, HU_SHELF], [11.95, HU_SHELF], [12.12, 2.4], [12.24, 2.26], [12.31, 2.0], [12.34, 1.42], [13.0, 1.42]];
/** The cab, its section (the casing's sides, a taller crown) and its windows. */
const HU_CAB: [number, number] = [13.0, 15.9];
const HU_CAB_HALF: Pt[] = [[1.45, 1.42], [1.45, 4.0], [1.35, 4.25], [1.0, 4.4], [0.5, 4.47], [0, 4.5]];
/**
 * The pilot's plan at each height, [y, front tip, half width, depth to full width]: the
 * plate front leaning back from its rolled foot, then above the deck's edge (HU_DECK) the
 * cradle sweeping back and up under the nose to its top (HU_CRADLE).
 */
const HU_DECK = 2.06;
const HU_CRADLE = 2.3;
const HU_PILOT: Array<[number, number, number, number]> = [[0.15, 0.1, 1.28, 1.1], [0.32, 0.02, 1.36, 1.15], [0.55, 0.06, 1.36, 1.15], [1.2, 0.2, 1.36, 1.15], [1.9, 0.38, 1.36, 1.15], [HU_DECK, 0.5, 1.33, 1.1], [HU_CRADLE, 0.76, 1.3, 1.0]];
const HU_PILOT_REAR = 2.0;
/** The dark band along the cab's rear half and the tender, between two aluminium stripes. */
const HU_BAND: [number, number] = [2.15, 2.75];
const HU_STRIPES: Array<[number, number]> = [[2.19, 2.22], [2.68, 2.71]];

const HU_PALETTE: Record<string, MaterialSpec> = {
  ...US_STEAM_PALETTE,
  // the casing's grey, the aluminium pilot, drivers and stripes, the dark band
  paint: { color: "#8d9296", roughness: 0.45 },
  pilot: { color: "#c5c9cd", roughness: 0.35, metallic: 0.3 },
  driver: { color: "#c9cdd1", roughness: 0.4, metallic: 0.3 },
  lining: { color: "#363b41", roughness: 0.5 },
  roof: { color: "#7c8186", roughness: 0.5 },
  herald: { color: "#1f2a3c", roughness: 0.45 },
  wheel: { color: "#1c1d1f", roughness: 0.6 },
  frame: { color: "#1c1d1f", roughness: 0.65 },
  plate: { color: "#363b41", roughness: 0.5 },
  plateText: { color: "#e8e6df", roughness: 0.5 },
};

/** Source (x, y, z) to the model's point. */
const huP = (t: Steam, x: number, y: number, z: number): Vec3 => [t.X(x), y, z];
/** A source direction to the model's. */
const huD = (dx: number, dy: number, dz: number): Vec3 => [-dx, dy, dz];

/** A quad (a, b, c, d in order round it) facing `out`. */
function huQuad(t: Steam, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, out: Vec3): void {
  t.m.facets(mat, [a, b, c, a, c, d], out);
}

/** The pilot's plan point at angle phi (-pi/2 the left cheek, 0 the nose, pi/2 the right) at height y: a superellipse face, [x, z]. */
function huPilotAt(phi: number, y: number): [number, number] {
  const at = (l: [number, number, number, number]): [number, number] => {
    const [, xf, w, d] = l;
    const s = Math.sin(phi), c = Math.cos(phi);
    return [xf + d * (1 - Math.pow(Math.abs(c), 0.9)), w * Math.sign(s) * Math.pow(Math.abs(s), 0.9)];
  };
  let i = 0;
  while (i + 2 < HU_PILOT.length && y > HU_PILOT[i + 1]![0]) i++;
  const [a, b] = [HU_PILOT[i]!, HU_PILOT[i + 1]!];
  const k = Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])));
  const [p, q] = [at(a), at(b)];
  return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
}

/** The pilot's surface frame at (phi, y): the point, the unit tangents across (u, toward +z at the nose) and up (v), and the outward normal, all in source axes. */
function huPilotFrame(phi: number, y: number): { p: Vec3; u: Vec3; v: Vec3; n: Vec3 } {
  const e = 1e-3;
  const pt = (f: number, h: number): Vec3 => { const [x, z] = huPilotAt(f, h); return [x, h, z]; };
  const p = pt(phi, y);
  const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const u = norm(sub(pt(phi + e, y), pt(phi - e, y)));
  const v0 = norm(sub(pt(phi, y + e), pt(phi, y - e)));
  // n across u and v, pointing forward and out (negative source x)
  let n = norm([u[1] * v0[2] - u[2] * v0[1], u[2] * v0[0] - u[0] * v0[2], u[0] * v0[1] - u[1] * v0[0]]);
  if (n[0] > 0) n = [-n[0], -n[1], -n[2]];
  // v made square to u and n
  const v = norm([n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]]);
  return { p, u, n, v: v[1] < 0 ? [-v[0], -v[1], -v[2]] : v };
}

/** A flat slab on the pilot at (phi, y): `w` across, `h` up, its face `proud` off the skin (an n-gon ellipse when `round`). */
function huPilotPanel(t: Steam, mat: string, phi: number, y: number, w: number, h: number, proud: number, round = 0): void {
  const f = huPilotFrame(phi, y);
  const at = (a: number, b: number): Vec3 => huP(t, f.p[0] + f.u[0] * a + f.v[0] * b + f.n[0] * proud, f.p[1] + f.u[1] * a + f.v[1] * b + f.n[1] * proud, f.p[2] + f.u[2] * a + f.v[2] * b + f.n[2] * proud);
  const pts: Vec3[] = round
    ? Array.from({ length: round }, (_, k) => { const a = (k / round) * Math.PI * 2; return at((w / 2) * Math.cos(a), (h / 2) * Math.sin(a)); })
    : [at(-w / 2, -h / 2), at(w / 2, -h / 2), at(w / 2, h / 2), at(-w / 2, h / 2)];
  const d = huD(-f.n[0] * 0.04, -f.n[1] * 0.04, -f.n[2] * 0.04);
  t.m.slab(mat, pts, d);
}

/** Text in the plane of the pilot's face at (phi = 0, y): `h` high, reading across the face as seen from ahead. */
function huPilotText(t: Steam, mat: string, text: string, y: number, h: number, proud: number): void {
  const f = huPilotFrame(0, y);
  const w = h * 0.62, gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  // seen from ahead the text runs toward -z
  const pts = strokeText(text, -width / 2, -h / 2, h, w, gap).map(([a, b]): Vec3 => huP(t, f.p[0] + f.v[0] * b + f.n[0] * proud, f.p[1] + f.v[1] * b + f.n[1] * proud, f.p[2] - a + f.n[2] * proud));
  t.m.facets(mat, pts, huD(f.n[0], f.n[1], f.n[2]));
}

/** The pilot: a rounded plate front from the rail to the deck, its cheeks, the herald, the slots, the coupler's opening. */
function hudsonPilot(t: Steam): void {
  const m = t.m;
  m.scope("front pilot", () => {
    const N = 22;
    const ring = (l: [number, number, number, number]): Vec3[] => {
      const pts: Vec3[] = [];
      for (let k = 0; k <= N; k++) {
        const [x, z] = huPilotAt(-Math.PI / 2 + (k / N) * Math.PI, l[0]);
        pts.push(huP(t, x, l[0], z));
      }
      pts.push(huP(t, HU_PILOT_REAR, l[0], l[2]), huP(t, HU_PILOT_REAR, l[0], -l[2]));
      return pts;
    };
    const rings = HU_PILOT.map(ring);
    const centre = huP(t, 1.2, 0, 0);
    for (let i = 0; i + 1 < rings.length; i++) {
      const [a, b] = [rings[i]!, rings[i + 1]!];
      for (let k = 0; k < a.length; k++) {
        const j = (k + 1) % a.length;
        const mid = [(a[k]![0] + a[j]![0]) / 2, 0, (a[k]![2] + a[j]![2]) / 2];
        huQuad(t, "pilot", a[k]!, a[j]!, b[j]!, b[k]!, [mid[0]! - centre[0], 0, mid[2]! - centre[2]]);
      }
    }
    const fan = (r: Vec3[]): Vec3[] => r.slice(1, -1).flatMap((p, k) => [r[0]!, p, r[k + 2]!]);
    m.facets("pilot", fan(rings[0]!), [0, -1, 0]);
    m.scope("deck", () => m.facets("pilot", fan(rings[rings.length - 1]!), [0, 1, 0]));
    // the herald: NEW YORK CENTRAL SYSTEM in an aluminium-edged dark oval, on the nose
    m.scope("herald", () => {
      huPilotPanel(t, "pilot", 0, 1.66, 0.92, 0.54, 0.02, 20);
      huPilotPanel(t, "herald", 0, 1.66, 0.83, 0.45, 0.026, 20);
      huPilotText(t, "pilot", "CENTRAL", 1.66, 0.11, 0.03);
      huPilotText(t, "pilot", "NEW YORK", 1.79, 0.045, 0.03);
      huPilotText(t, "pilot", "SYSTEM", 1.53, 0.045, 0.03);
    });
    // three slots up each cheek, and the coupler's opening in the nose
    m.scope("slots", () => { for (const s of [-1, 1]) for (const y of [0.42, 0.83, 1.32]) huPilotPanel(t, "black", s * 0.92, y, 0.34, 0.09, 0.012); });
    // the coupler folds away behind the closed face: none drawn at the front
  });
  // the aluminium sheets continuing the pilot's sides back to the shelf, their rear edge
  // slanting up from the foot past the lead truck to the cylinders, the steps behind that
  // edge, and the cowl's lower half beside the nose, aluminium to the nose's middle
  m.scope("apron", () => {
    const [b0, b1]: [Pt, Pt] = [[2.05, 0.25], [3.15, HU_SHELF]];
    const out: Pt[] = [[1.9, 0.25], b0, b1, [2.0, HU_SHELF], [1.55, HU_DECK]];
    for (const s of [-1, 1]) m.slab("pilot", out.map(([x, y]) => huP(t, x, y, s * 1.355)), [0, 0, -s * 0.03]);
    for (const s of [-1, 1]) for (const f of [0.3, 0.55, 0.8]) {
      const [x, y] = [b0[0] + (b1[0] - b0[0]) * f, b0[1] + (b1[1] - b0[1]) * f];
      t.sideBox("black", s, x - 0.05, x + 0.2, y - 0.03, y, 1.1, 1.32);
    }
    // the ladder's stringer along the edge
    for (const s of [-1, 1]) m.rod("silver", huP(t, b0[0] + 0.12, b0[1] + 0.25, s * 1.3), huP(t, b1[0] - 0.02, b1[1] - 0.05, s * 1.3), 0.025, 6);
    // its inner edge a chord inside the nose's equator, so the nose hides it
    const cowl: Pt[] = [[0.6, HU_CRADLE], [1.45, HU_CRADLE], [1.45, 2.8], [1.0, 2.8]];
    for (const s of [-1, 1]) m.slab("pilot", cowl.map(([z, y]) => huP(t, HU_DOME.x - 0.015, y, s * z)), [-0.015, 0, 0]);
  });
}

/** The point of the nose's meridian at polar angle th (0 the tip, pi/2 the top) and its outward normal, in source (x, y). */
function huMeridian(th: number): { p: Pt; n: Pt } {
  const a = HU_DOME.x - HU_DOME.tip, b = HU_DOME.r;
  const p: Pt = [HU_DOME.x - a * Math.cos(th), HU_DOME.y + b * Math.sin(th)];
  const g: Pt = [-Math.cos(th) / a, Math.sin(th) / b];
  const l = Math.hypot(g[0], g[1]);
  return { p, n: [g[0] / l, g[1] / l] };
}

/** A blade along the nose's meridian from angle th0 to th1: `w(f)` half wide and `h(f)` high off the skin at fraction f, on stations of `n`. */
function huBlade(t: Steam, mat: string, th0: number, th1: number, n: number, w: (f: number) => number, h: (f: number) => number): void {
  const secs: Vec3[][] = [];
  const bases: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const { p, n: nn } = huMeridian(th0 + (th1 - th0) * f);
    const [ww, hh] = [w(f), h(f)];
    const at = (u: number, v: number): Vec3 => huP(t, p[0] + nn[0] * v, p[1] + nn[1] * v, u);
    secs.push([at(-ww, -0.05), at(ww, -0.05), at(ww, 0.55 * hh), at(0.55 * ww, hh), at(-0.55 * ww, hh), at(-ww, 0.55 * hh)]);
    bases.push(huP(t, p[0], p[1], 0));
  }
  for (let i = 0; i < n; i++) {
    const [a, b] = [secs[i]!, secs[i + 1]!];
    const c = bases[i]!;
    for (let k = 0; k < a.length; k++) {
      const j = (k + 1) % a.length;
      const mid: Vec3 = [(a[k]![0] + a[j]![0]) / 2 - c[0], (a[k]![1] + a[j]![1]) / 2 - c[1], (a[k]![2] + a[j]![2]) / 2 - c[2]];
      huQuad(t, mat, a[k]!, a[j]!, b[j]!, b[k]!, mid);
    }
  }
  // the end at th1 closed (th0 lies inside the casing or the nose)
  const last = secs[n]!, prev = bases[n - 1]!, end = bases[n]!;
  t.m.facets(mat, last.slice(1, -1).flatMap((q, k) => [last[0]!, q, last[k + 2]!]), [end[0] - prev[0], end[1] - prev[1], end[2] - prev[2]]);
}

/** The bullet nose over the smokebox front, its crest down to the headlight and the blade under it. */
function hudsonNose(t: Steam): void {
  const m = t.m;
  const { y: yc, r, tip, x: xe } = HU_DOME;
  const a = xe - tip;
  m.scope("nose", () => {
    const n = 28, K = 10;
    const rings: Vec3[][] = [];
    for (let k = 1; k <= K; k++) {
      const th = (k / K) * (Math.PI / 2);
      const [x, rr] = [xe - a * Math.cos(th), r * Math.sin(th)];
      rings.push(Array.from({ length: n }, (_, i) => { const q = (i / n) * Math.PI * 2; return huP(t, x, yc + rr * Math.sin(q), rr * Math.cos(q)); }));
    }
    const c = huP(t, xe, yc, 0);
    const out = (p: Vec3): Vec3 => [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const apex = huP(t, tip, yc, 0);
    const first = rings[0]!;
    for (let i = 0; i < n; i++) m.facets("paint", [apex, first[i]!, first[(i + 1) % n]!], out(first[i]!));
    for (let k = 0; k + 1 < rings.length; k++) {
      const [p, q] = [rings[k]!, rings[k + 1]!];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        huQuad(t, "paint", p[i]!, p[j]!, q[j]!, q[i]!, out(q[i]!));
      }
    }
  });
  // the crest: the casing's top run forward over the nose and down its face to the headlight
  const lip = HU_TOP - (yc + r);
  // a narrow aluminium fin standing proud of the nose from the casing's top down to the headlight
  m.scope("crest", () => {
    huBlade(t, "pilot", Math.PI / 2, 0.3, 10, (f) => 0.06 - 0.02 * f, (f) => lip + 0.03 - (lip + 0.03 - 0.1) * f);
    t.box("pilot", HU_DOME.x - 0.02, 2.08, HU_TOP, HU_TOP + 0.03, -0.06, 0.06);
  });
  m.scope("blade", () => huBlade(t, "pilot", -0.25, -0.95, 4, (f) => 0.035 - 0.015 * f, (f) => 0.1 - 0.06 * f));
  m.scope("headlight", () => {
    // at the nose's tip on the centre line, standing 0.3 m out of it
    t.cylX("black", tip + 0.3, tip - 0.25, 0, yc, 0.31, 18);
    t.cylX("silver", tip - 0.25, tip - 0.3, 0, yc, 0.31, 18);
    t.cylX("lampHead", tip - 0.28, tip - 0.305, 0, yc, 0.23, 18);
  });
}

/** The casing's fittings: the louvred vent and the stack's opening on top, the shelf's edge, the handrails, the pipes under the shelf. */
function hudsonCasingDetails(t: Steam): void {
  const m = t.m;
  m.emit("smoke", [t.X(3.2), HU_TOP + 0.01, 0], 0.3);
  m.scope("vent", () => {
    t.box("black", 2.08, 2.62, HU_TOP, HU_TOP + 0.015, -0.24, 0.24);
    for (let k = 0; k < 5; k++) { const x = 2.13 + k * 0.1; t.box("silver", x, x + 0.03, HU_TOP + 0.015, HU_TOP + 0.03, -0.24, 0.24); }
    t.box("black", 2.85, 3.55, HU_TOP, HU_TOP + 0.012, -0.2, 0.2);
  });
  m.scope("shelf edge", () => { for (const s of [-1, 1]) t.sideBox("pilot", s, 3.2, 11.95, 2.4, 2.46, 1.45, 1.475); });
  const sec = mirrored(HU_CASING);
  m.scope("handrails", () => {
    t.handrail(2.4, 12.8, 3.62, halfAt(sec, 3.62) + 0.07, halfAt(sec, 3.62), 6);
    // the grab rail from the pilot's deck up round the nose to the side handrail
    const pts: Vec3[] = [[1.35, HU_CRADLE + 0.02, 1.2], [1.7, 3.2, 1.4], [2.15, 3.52, 1.47], [2.4, 3.62, halfAt(sec, 3.62) + 0.07]];
    for (const s of [-1, 1]) for (let i = 0; i + 1 < pts.length; i++) {
      const [p, q] = [pts[i]!, pts[i + 1]!];
      m.rod("silver", huP(t, p[0], p[1], s * p[2]), huP(t, q[0], q[1], s * q[2]), 0.022, 6);
    }
  });
  m.scope("access handles", () => { for (const s of [-1, 1]) for (let x = 3.6; x < 12.5; x += 1.15) t.sidePanel(sec, "black", s, x, x + 0.1, 3.95, 4.08); });
  m.scope("pipes", () => { for (const s of [-1, 1]) t.cylX("black", 4.4, 12.0, s * 1.22, 2.25, 0.06, 8); });
  // the air pumps hung under the shelf behind the cylinders, over the valve gear
  m.scope("air pumps", () => { for (const s of [-1, 1]) { t.cylY("black", 5.3, s * 1.27, 1.75, 2.4, 0.14, 10, false); t.cylY("steel", 5.3, s * 1.27, 1.68, 1.75, 0.1, 8); } });
}

/** Light text on side s of a vertical face at |z| = face, centred at source x, its foot at y (no plate behind it). */
function huSideText(t: Steam, mat: string, s: number, x: number, y: number, text: string, face: number, h: number, spacing = 0.22): void {
  const w = h * 0.62, gap = h * spacing;
  const width = strokeWidth(text, w, gap);
  const u0 = t.X(x) + (s > 0 ? -width / 2 : width / 2);
  t.m.facets(mat, strokeText(text, u0, y, h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * face]), [0, 0, s]);
}

function hudsonSpec(): LocoSpec {
  const cabSec = mirrored(HU_CAB_HALF);
  return {
    title: "NYC J-3a Hudson",
    palette: HU_PALETTE,
    heads: [0, 16.3],
    beams: { front: false, rear: false },
    frame: { x0: 1.9, x1: HU_CAB[1], top: 2.0 },
    cab: {
      x0: HU_CAB[0], x1: HU_CAB[1], half: HU_CAB_HALF, roofY: 4.36, mat: "paint",
      windows: [{ x0: 13.55, x1: 14.35, y0: 3.2, y1: 4.0 }, { x0: 14.55, x1: 15.6, y0: 3.2, y1: 4.0 }],
      front: [{ z0: 0.95, z1: 1.38, y0: 3.9, y1: 4.25 }, { z0: -1.38, z1: -0.95, y0: 3.9, y1: 4.25 }],
    },
    volumes: [{
      name: "casing",
      sec: mirrored(HU_CASING),
      plan: [[HU_DOME.x, 1.45], [HU_CAB[0], 1.45]],
      top: [[HU_DOME.x, HU_TOP], [12.4, HU_TOP], [HU_CAB[0], 4.4]],
      bottom: HU_CASING_BOTTOM,
      bands: [[0, 9, "paint"]],
    }],
    bogies: [{ x0: 1.98, x1: 5.35, y: 0.6 }, { x0: 12.6, x1: 15.3, y: 0.7 }],
    gear: {
      wheels: [
        ...HU_LEAD.map((x) => ({ x, d: ft(0, 36), spokes: 0, outsideBoxes: true })),
        ...HU_DRIVERS.map((x) => ({ x, d: HU_DRIVER, spokes: 0 })),
        ...HU_TRAILING.map(([x, d]) => ({ x, d, spokes: 0, outsideBoxes: true })),
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 3.1, x1: 4.3, y: 1.08, r: 0.36 }, crank: 0.37, phase: 0.6, valveGear: true }],
      cylinderZ: 1.15, reference: 3, wheelMaterial: "wheel", driverMaterial: "driver", discOpenings: 6, discOpeningSides: 8,
    },
    extras: (t) => {
      hudsonPilot(t);
      hudsonNose(t);
      hudsonCasingDetails(t);
      // the band and its stripes along the cab's rear half, the number over it
      t.m.scope("band", () => {
        for (const s of [-1, 1]) {
          t.sidePanel(cabSec, "lining", s, 14.4, HU_CAB[1] - 0.02, HU_BAND[0], HU_BAND[1]);
          for (const [y0, y1] of HU_STRIPES) t.sidePanel(cabSec, "pilot", s, 14.4, HU_CAB[1] - 0.02, y0, y1, 0.012);
        }
      });
      t.m.scope("numbers", () => { for (const s of [-1, 1]) huSideText(t, "pilot", s, 15.1, 2.84, "5453", 1.454, 0.17); });
      t.m.scope("diaphragm", () => t.box("black", HU_CAB[1], 16.25, 1.5, 3.9, -0.75, 0.75));
      t.m.scope("drawbar", () => t.box("black", HU_CAB[1], 16.3, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

/** The Dreyfuss tender: the cab's section continued, the band with NEW YORK CENTRAL between its stripes, on two six-wheel trucks. */
function hudsonTenderSpec(): LocoSpec {
  return {
    title: "NYC J-3a Hudson tender",
    palette: HU_PALETTE,
    heads: [0, 13.24],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 12.6, top: 1.3 },
    prisms: [{ name: "tank", x0: 0.3, x1: 12.7, half: [[1.55, 1.0], [1.55, 3.95], [1.45, 4.15], [1.2, 4.27], [0.8, 4.3]] }],
    bogies: [{ x0: 1.45, x1: 5.85, y: 0.6 }, { x0: 7.8, x1: 12.2, y: 0.6 }],
    gear: { wheels: [1.94, 3.64, 5.34, 8.29, 9.99, 11.69].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[12.9, 3.4, 0]] },
    extras: (t) => {
      t.m.scope("band", () => {
        for (const s of [-1, 1]) {
          t.sideBox("lining", s, 0.3, 12.7, HU_BAND[0], HU_BAND[1], 1.55, 1.556);
          for (const [y0, y1] of HU_STRIPES) t.sideBox("pilot", s, 0.3, 12.7, y0, y1, 1.556, 1.56);
        }
      });
      t.m.scope("lettering", () => { for (const s of [-1, 1]) huSideText(t, "pilot", s, 6.5, 2.29, "NEW YORK CENTRAL", 1.559, 0.32, 0.6); });
      pilot(t, -1, 13.24, 1.3, 1.2, "lining");
    },
  };
}

/**
 * The Dreyfuss Hudson from afar (docs/models/lod.md): its own LodSpec, since the steam
 * adapter would draw the casing's skirt down over the drivers along the whole engine --
 * the casing over the shelf, the skirt and the cab behind the drivers (the cab with its
 * band and windows), the pilot's rounded front and the nose as shells; the apron's sides,
 * the frames, the cylinders and the wheels (the drivers in their aluminium) as parts.
 */
function hudsonLocoLod(spec: LocoSpec, budget: number): MeshBuilder {
  const xc = (spec.heads[0] + spec.heads[1]) / 2;
  const X = (x: number) => xc - x;
  const casing = halfTable(HU_CASING.filter(([, y]) => y > HU_SHELF)).map(([y, w]) => [y, w] as const);
  const cabBands: LodBand[] = [[HU_CAB_HALF[0]![1], HU_BAND[0], "paint"], [HU_BAND[0], HU_BAND[1], "lining"], [HU_BAND[1], 4.5, "paint"]];
  const c = spec.cab!;
  const windows = windowBands(c.windows.map((w) => ({ u: [X(w.x1), X(w.x0)] as const, y: [w.y0, w.y1] as const })), 0.6);
  // the nose's front at each height: the half ellipsoid's
  const noseYs = [2.12, 2.6, 3.2, 3.8, 4.28];
  // the pilot at its foot, its lip, its face, the deck's edge and the cradle's top
  const pilot = HU_PILOT.filter(([y]) => [0.15, 0.32, 1.2, HU_DECK, HU_CRADLE].includes(y));
  const noseFront = (y: number) => HU_DOME.x - (HU_DOME.x - HU_DOME.tip) * Math.sqrt(Math.max(0, 1 - ((y - HU_DOME.y) / HU_DOME.r) ** 2));
  const noseHw = (y: number) => Math.max(0.25, Math.sqrt(Math.max(0, HU_DOME.r ** 2 - (y - HU_DOME.y) ** 2)));
  const shells: LodShell[] = [
    { ...boxShell(X(HU_CAB[0]), X(HU_DOME.x), [[HU_SHELF, 1.45], ...casing, [HU_TOP, 0.3]], [[HU_SHELF, HU_TOP, "paint"]]), ends: [1] },
    { ...boxShell(X(HU_CAB[0]), X(12.3), [[HU_CAB_HALF[0]![1], 1.45], [HU_SHELF, 1.45]], [[HU_CAB_HALF[0]![1], HU_SHELF, "paint"]]), ends: [1] },
    { ...boxShell(X(c.x1), X(c.x0), simplifyTable(halfTable(c.half), 0.2), [[HU_CAB_HALF[0]![1], 4.5, "paint"]], { roof: "roof", sideWindows: windows }), cabs: [{ x0: X(c.x1), x1: X(14.4), side: cabBands }] },
    {
      y0: 0.15, hw: pilot.map(([y, , w]) => [y, w] as const), side: [[0.15, HU_CRADLE, "pilot"]], roof: "pilot", ends: [1],
      front: { tip: pilot.map(([y, xf]) => [y, X(xf)] as const), setback: pilot.map(([y, , , d]) => [y, d * 0.75] as const) },
      rear: { tip: [[0.15, X(HU_PILOT_REAR)], [HU_CRADLE, X(HU_PILOT_REAR)]] },
    },
    {
      y0: noseYs[0]!, hw: noseYs.map((y) => [y, noseHw(y)] as const), side: [[noseYs[0]!, HU_TOP, "paint"]], roof: "paint", ends: [1],
      front: { tip: noseYs.map((y) => [y, X(noseFront(y))] as const), setback: noseYs.map((y) => [y, (HU_DOME.x - noseFront(y)) * 0.55] as const) },
      rear: { tip: [[noseYs[0]!, X(HU_DOME.x)], [noseYs[noseYs.length - 1]!, X(HU_DOME.x)]] },
    },
  ];
  const g = spec.gear;
  const coupled = new Set(g.engines.flatMap((e) => e.coupled));
  const wheels = (drivers: boolean) => g.wheels.filter((_, i) => coupled.has(i) === drivers).map((w) => ({ X: X(w.x), d: w.d }));
  const cy = g.engines[0]!.cylinder;
  const parts: LodPart[] = [
    // the carrying wheels as dark blocks, each aluminium driver its own disc
    { draw: (m) => m.scope("running gear", () => {
      wheelBlocks(m, g.wheelMaterial, wheels(false), 0.84);
      for (const w of wheels(true)) for (const s of [-1, 1]) lodWheel(m, g.driverMaterial ?? g.wheelMaterial, w.X, w.d / 2, s * 0.7, s * 0.84, 6, "none");
    }) },
    { draw: (m) => m.scope("frames", () => lodSideBox(m, "frame", [[X(HU_CAB[1]), 0.45], [X(1.9), 0.45], [X(1.9), 2.0], [X(HU_CAB[1]), 2.0]], -0.6, 0.6, false)) },
    { optional: 30, draw: (m) => m.scope("apron", () => sidePlates(m, "pilot", [[X(2.0), 0.25], [X(2.05), 0.25], [X(3.15), HU_SHELF], [X(2.0), HU_SHELF]], 1.36)) },
    { optional: 20, draw: (m) => m.scope("cylinders", () => lodSideBox(m, "paint", [[X(cy.x1), cy.y - cy.r], [X(cy.x0), cy.y - cy.r], [X(cy.x0), cy.y + cy.r], [X(cy.x1), cy.y + cy.r]], -(g.cylinderZ + cy.r), g.cylinderZ + cy.r)) },
  ];
  return fitLod({ palette: { ...STEAM_PALETTE, ...spec.palette }, shells, parts }, budget);
}

// ---------------------------------------------------------------------------
// The Golden Spike 4-4-0 American: Central Pacific Jupiter and Union Pacific No. 119

export type AmericanLivery = "jupiter" | "no119";
const AMERICAN_PARAMS: ParamSpec[] = [
  UNIT_PARAM,
  { name: "livery", title: "Livery", default: "jupiter", values: [{ value: "jupiter", title: "Jupiter" }, { value: "no119", title: "UP No. 119" }] },
];

const AMERICAN_LIVERIES: Record<AmericanLivery, { palette: Record<string, MaterialSpec>; balloon: boolean; number: string; road: string }> = {
  // Jupiter: a royal blue boiler jacket and cab, red wheels and pilot, a balloon stack (a wood-burner)
  jupiter: { palette: { paint: { color: "#1f3b8c", roughness: 0.45 }, cabPaint: { color: "#8a1c1a", roughness: 0.5 }, wheel: { color: "#a3201f", roughness: 0.55 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#8a1c1a", roughness: 0.5 }, plateText: { color: "#d4b05a", roughness: 0.4 } }, balloon: true, number: "60", road: "C.P.R.R." },
  // No. 119: a black jacket, maroon cab and red wheels, its straight stack (a coal-burner)
  no119: { palette: { paint: { color: "#232427", roughness: 0.5 }, cabPaint: { color: "#7a1f22", roughness: 0.5 }, wheel: { color: "#a3201f", roughness: 0.55 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#7a1f22", roughness: 0.5 }, plateText: { color: "#d4b05a", roughness: 0.4 } }, balloon: false, number: "119", road: "U.P.R.R." },
};

function americanSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  return {
    title: "Golden Spike 4-4-0",
    palette: { ...US_STEAM_PALETTE, ...l.palette },
    heads: [0, 10.4],
    beams: { front: false, rear: false },
    boiler: { x0: 1.2, x1: 7.4, y: 2.35, r: 0.62, smokebox: 1.3, bands: [3.4, 4.6, 5.8], band: "brass" },
    chimney: { x: 1.9, top: l.balloon ? 3.6 : 4.2, r: 0.2 },
    domes: [{ x: 4.1, top: 3.55, r: 0.32, mat: "brass" }, { x: 5.6, top: 3.45, r: 0.28, mat: "brass" }],
    valves: { x: 6.9, top: 3.3 },
    runningBoard: { profile: [[1.2, 1.55], [8.2, 1.55]], half: 1.35, valance: 0.06 },
    frame: { x0: 0.9, x1: 9.6, top: 1.5 },
    cab: {
      x0: 7.4, x1: 9.6, half: [[1.35, 1.6], [1.35, 3.45], [1.2, 3.62], [0.7, 3.78], [0, 3.85]], roofY: 3.55, mat: "cabPaint",
      windows: [{ x0: 7.7, x1: 8.35, y0: 2.6, y1: 3.2 }, { x0: 8.55, x1: 9.2, y0: 2.6, y1: 3.2 }],
      front: [{ z0: 0.7, z1: 1.1, y0: 2.8, y1: 3.25 }, { z0: -1.1, z1: -0.7, y0: 2.8, y1: 3.25 }],
    },
    prisms: [{ name: "firebox", x0: 6.4, x1: 7.4, half: [[0.62, 1.55], [0.62, 2.35], [0.5, 2.75], [0, 2.97]], mat: "paint" }],
    bogies: [{ x0: 1.2, x1: 3.5, y: 0.5 }],
    gear: {
      wheels: [
        { x: 1.75, d: ft(0, 30), spokes: 10, outsideBoxes: true },
        { x: 3.0, d: ft(0, 30), spokes: 10, outsideBoxes: true },
        { x: 5.0, d: ft(0, 60), spokes: 16 },
        { x: 7.4, d: ft(0, 60), spokes: 16 },
      ],
      engines: [{ coupled: [2, 3], main: 2, cylinder: { x0: 1.8, x1: 2.75, y: 1.15, r: 0.28 }, crank: 0.3, phase: 0.5 }],
      cylinderZ: 1.05, reference: 2, wheelMaterial: "wheel",
    },
    number: { text: l.number, side: [8.5, 2.1, 1.35], front: [1.22, 1.95] },
    extras: (t) => {
      // the big oil headlamp's box on the smokebox, the stack's balloon or its cap, the bell
      t.m.scope("headlamp", () => {
        t.box("cabPaint", 1.15, 1.65, 3.0, 3.58, -0.3, 0.3);
        t.box("lampHead", 1.1, 1.15, 3.12, 3.5, -0.18, 0.18);
        t.box("brass", 1.1, 1.68, 3.58, 3.66, -0.34, 0.34);
      });
      t.m.scope(l.balloon ? "balloon stack" : "stack cap", () => {
        if (l.balloon) { t.cylY("black", 1.9, 0, 3.6, 4.2, 0.55, 14); t.cylY("black", 1.9, 0, 4.2, 4.35, 0.42, 14); }
        else t.cylY("black", 1.9, 0, 4.2, 4.32, 0.3, 12);
      });
      bell(t, 3.3, 2.95);
      pilot(t, 1, 0, 1.25, 1.2, "wheel", true);
      t.m.scope("drawbar", () => t.box("black", 9.6, 10.4, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function americanTenderSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  return {
    title: "Golden Spike 4-4-0 tender",
    palette: { ...US_STEAM_PALETTE, ...l.palette },
    heads: [0, 7.6],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 7.1, top: 1.25 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 7.0, half: [[1.35, 1.25], [1.35, 2.55]], mat: "cabPaint" },
      { name: "fuel sides", x0: 0.4, x1: 3.2, half: [[1.35, 2.55], [1.35, 2.75]], mat: "cabPaint" },
    ],
    ...(l.balloon ? {} : { coal: { x0: 0.5, x1: 3.1, y: 2.75, half: 1.2, rise: 0.45 } }),
    bogies: [{ x0: 0.7, x1: 3.0, y: 0.5 }, { x0: 4.4, x1: 6.7, y: 0.5 }],
    gear: { wheels: [1.25, 2.45, 4.9, 6.1].map((x) => ({ x, d: ft(0, 30), spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[7.02, 2.3, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 3.7, 1.75, l.road, 1.35, 0.26); });
      if (l.balloon) t.m.scope("wood", () => t.box("wood", 0.6, 3.0, 2.75, 3.15, -1.15, 1.15));
      pilot(t, -1, 7.6, 1.1, 1.1, "frame");
    },
  };
}

// ---------------------------------------------------------------------------
// Builders, distant models, designs

const unitOf = (params?: ParamValues) => resolveParams([UNIT_PARAM], params).unit;
const pair = (loco: Spec, tender: Spec) => (params?: ParamValues): LocoSpec => (unitOf(params) === "tender" ? tender() : loco());

const bigBoy = pair(bigBoySpec, bigBoyTenderSpec);
const k4s = pair(k4sSpec, k4sTenderSpec);
const hudson = pair(hudsonSpec, hudsonTenderSpec);
const american = (params?: ParamValues): LocoSpec => {
  const p = resolveParams(AMERICAN_PARAMS, params);
  const livery = p.livery as AmericanLivery;
  return p.unit === "tender" ? americanTenderSpec(livery) : americanSpec(livery);
};

export function upBigBoy(params?: ParamValues): MeshBuilder { return buildLoco(bigBoy(params)); }
export function upBigBoyLod(params?: ParamValues): MeshBuilder {
  const spec = bigBoy(params);
  return steamLocoLod(spec.boiler ? { ...spec, domes: BB_DOMES } : spec, 200);
}
export function prrK4s(params?: ParamValues): MeshBuilder { return buildLoco(k4s(params)); }
export function prrK4sLod(params?: ParamValues): MeshBuilder {
  // from afar the boiler runs at the conical course's mean size from the smokebox into the firebox
  const spec = k4s(params);
  return steamLocoLod(spec.boiler ? { ...spec, boiler: { ...spec.boiler, x1: K4_BELPAIRE + 0.1, y: 3.03, r: 1.03 } } : spec, 200);
}
export function nycHudson(params?: ParamValues): MeshBuilder { return buildLoco(hudson(params)); }
export function nycHudsonLod(params?: ParamValues): MeshBuilder {
  const spec = hudson(params);
  if (spec.cab) return hudsonLocoLod(spec, 200);
  // the tender: the steam adapter's, with the band along its sides
  const X = (x: number) => (spec.heads[0] + spec.heads[1]) / 2 - x;
  const lod = steamLodSpec(spec);
  lod.parts.push({ optional: 60, draw: (m) => m.scope("band", () => sidePlates(m, "lining", [[X(12.7), HU_BAND[0]], [X(0.3), HU_BAND[0]], [X(0.3), HU_BAND[1]], [X(12.7), HU_BAND[1]]], 1.556)) });
  return fitLod(lod, 200);
}
export function american440(params?: ParamValues): MeshBuilder { return buildLoco(american(params)); }
export function american440Lod(params?: ParamValues): MeshBuilder { return steamLocoLod(american(params)); }

/** The spec a US steam design builds (the tests read it). */
export function usSteamSpec(id: string, params?: ParamValues): LocoSpec {
  switch (id) {
    case "proc-vehicle-up-big-boy": return bigBoy(params);
    case "proc-vehicle-prr-k4s": return k4s(params);
    case "proc-vehicle-nyc-hudson": return hudson(params);
    case "proc-vehicle-american-440": return american(params);
    default: throw new Error(`no US steam design ${id}`);
  }
}

const withTender = (weight: number, power: number, maxspeed: number, tender: number): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }],
});

const AMERICAN_GAME: GameProperties = {
  weight: 40, power: 370, maxspeed: 80, accel: null,
  variants: [{ params: { unit: "tender" }, weight: 20, power: 0 }, { params: { unit: "tender", livery: "no119" }, weight: 20, power: 0 }],
};

export const US_STEAM: ProceduralDesign[] = [
  { id: "proc-vehicle-up-big-boy", title: "UP Big Boy", build: upBigBoy, buildLod: upBigBoyLod, params: [UNIT_PARAM], game: withTender(345, 4690, 129, 155), lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "up-big-boy" },
  { id: "proc-vehicle-prr-k4s", title: "PRR K4s", build: prrK4s, buildLod: prrK4sLod, params: [UNIT_PARAM], game: withTender(141, 2400, 161, 95), lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "prr-k4s" },
  { id: "proc-vehicle-nyc-hudson", title: "NYC J-3a Hudson", build: nycHudson, buildLod: nycHudsonLod, params: [UNIT_PARAM], game: withTender(163, 3500, 161, 130), lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "nyc-hudson" },
  { id: "proc-vehicle-american-440", title: "Golden Spike 4-4-0", build: american440, buildLod: american440Lod, params: AMERICAN_PARAMS, game: AMERICAN_GAME, catalog: STEAM_CATALOG, loadingGauge: "us", references: "american-440" },
];
