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
import type { Steam } from "./steamParts.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { steamLocoLod } from "./lodSteam.ts";
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

/** The headlight on the smokebox front: housing and lens, `n` sides each. */
function headlight(t: Steam, x: number, y: number, r: number, n = 12): void {
  t.m.scope("headlight", () => {
    t.cylX("black", x + 0.3, x - 0.06, 0, y, r + 0.06, n);
    t.cylX("lampHead", x - 0.065, x - 0.09, 0, y, r, n);
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

function k4sSpec(): LocoSpec {
  return {
    title: "PRR K4s",
    palette: { ...US_STEAM_PALETTE, paint: { color: "#1e2b23", roughness: 0.55 }, wheel: { color: "#1c1d1f", roughness: 0.6 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#1e2b23", roughness: 0.55 }, plateText: { color: "#d4b05a", roughness: 0.4 } },
    heads: [0, 16.2],
    beams: { front: false, rear: false },
    boiler: { x0: 1.0, x1: 11.2, y: 3.05, r: 0.95, smokebox: 1.9, bands: [4.6, 7.0, 9.4] },
    chimney: { x: 2.0, top: 4.55, r: 0.3 },
    domes: [{ x: 4.8, top: 4.35, r: 0.4, len: 1.1 }, { x: 7.1, top: 4.38, r: 0.42 }],
    valves: { x: 10.2, top: 4.3 },
    handrail: { x0: 2.0, x1: 11.0, y: 3.25 },
    runningBoard: { profile: [[0.8, 1.5], [2.0, 1.5], [2.4, 2.15], [12.0, 2.15]], half: 1.5, valance: 0.08 },
    frame: { x0: 0.8, x1: 14.8, top: 2.05 },
    cab: {
      x0: 12.0, x1: 14.9, half: [[1.55, 1.9], [1.55, 3.95], [1.35, 4.25], [0.85, 4.45], [0, 4.52]], roofY: 4.2,
      windows: [{ x0: 12.35, x1: 13.1, y0: 3.15, y1: 3.8 }, { x0: 13.3, x1: 14.1, y0: 3.15, y1: 3.8 }],
      front: [{ z0: 0.85, z1: 1.3, y0: 3.4, y1: 3.85 }, { z0: -1.3, z1: -0.85, y0: 3.4, y1: 3.85 }],
    },
    // the Belpaire firebox: flat-topped with square shoulders
    prisms: [{ name: "firebox", x0: 9.6, x1: 12.0, half: [[1.15, 2.3], [1.15, 3.8], [1.05, 4.08], [0.8, 4.2], [0, 4.22]] }],
    bogies: [{ x0: 1.5, x1: 4.2, y: 0.6 }],
    gear: {
      wheels: [
        { x: 2.15, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: 3.65, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: 5.6, d: ft(0, 80), spokes: 20 },
        { x: 7.8, d: ft(0, 80), spokes: 20 },
        { x: 10.0, d: ft(0, 80), spokes: 20 },
        { x: 12.75, d: ft(0, 50), spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.3, x1: 3.5, y: 1.1, r: 0.38 }, crank: 0.36, phase: 0.4, valveGear: true }],
      cylinderZ: 1.15, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "1361", side: [13.6, 2.6, 1.55], front: [1.02, 2.55] },
    extras: (t) => {
      headlight(t, 1.0, 4.1, 0.2);
      bell(t, 2.8, 3.95);
      pilot(t, 1, 0, 1.35, 1.3, "black", false, 0.8);
      t.m.scope("drawbar", () => t.box("black", 14.9, 16.2, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function k4sTenderSpec(): LocoSpec {
  return {
    title: "PRR K4s tender",
    palette: k4sSpec().palette,
    heads: [0, 13.4],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 12.9, top: 1.3 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 12.8, half: [[1.55, 1.3], [1.55, 3.55]] },
      { name: "coal sides", x0: 0.6, x1: 5.6, half: [[1.55, 3.55], [1.55, 3.9]] },
    ],
    coal: { x0: 0.8, x1: 5.4, y: 3.9, half: 1.35, rise: 0.4 },
    bogies: [{ x0: 1.2, x1: 4.6, y: 0.6 }, { x0: 8.4, x1: 11.8, y: 0.6 }],
    gear: { wheels: [1.7, 2.9, 4.1, 8.9, 10.1, 11.3].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[12.82, 3.2, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 6.8, 2.6, "PENNSYLVANIA", 1.55, 0.3); });
      pilot(t, -1, 13.4, 1.3, 1.2, "black");
    },
  };
}

// ---------------------------------------------------------------------------
// NYC J-3a Hudson 4-6-4 in Henry Dreyfuss's streamlining (the 20th Century Limited)

function hudsonSpec(): LocoSpec {
  const grey = "paint", dark = "lining";
  return {
    title: "NYC J-3a Hudson",
    palette: { ...US_STEAM_PALETTE, paint: { color: "#a9adb0", roughness: 0.45 }, lining: { color: "#3b4046", roughness: 0.5 }, wheel: { color: "#1c1d1f", roughness: 0.6 }, frame: { color: "#1c1d1f", roughness: 0.65 }, plate: { color: "#3b4046", roughness: 0.5 }, plateText: { color: "#e8e6df", roughness: 0.5 } },
    heads: [0, 17.6],
    beams: { front: false, rear: false },
    boiler: { x0: 2.3, x1: 12.4, y: 3.1, r: 0.98, smokebox: 0.6, bands: [] },
    chimney: { x: 3.0, top: 4.35, r: 0.28 },
    domes: [{ x: 6.0, top: 4.32, r: 0.38, len: 3.2 }],
    runningBoard: { profile: [[0.9, 1.45], [2.3, 1.45], [2.75, 2.05], [13.0, 2.05]], half: 1.5, valance: 0.32, mat: dark, valanceMat: grey },
    frame: { x0: 0.8, x1: 16.2, top: 2.0 },
    cab: {
      x0: 13.0, x1: 16.2, half: [[1.55, 1.85], [1.55, 4.0], [1.35, 4.3], [0.8, 4.52], [0, 4.6]], roofY: 4.3, mat: grey,
      windows: [{ x0: 13.4, x1: 14.3, y0: 3.15, y1: 3.85 }, { x0: 14.5, x1: 15.4, y0: 3.15, y1: 3.85 }],
      front: [{ z0: 0.85, z1: 1.3, y0: 3.45, y1: 3.9 }, { z0: -1.3, z1: -0.85, y0: 3.45, y1: 3.9 }],
    },
    prisms: [{ name: "firebox", x0: 10.6, x1: 13.0, half: [[1.15, 2.3], [1.15, 3.65], [0.95, 4.05], [0.55, 4.25], [0, 4.3]], mat: grey }],
    // the bullet nose over the smokebox: round, its fin along the top
    volumes: [{
      name: "nose casing",
      sec: Array.from({ length: 16 }, (_, i): Pt => { const a = (i / 16) * Math.PI * 2; return [1.0 * Math.cos(a), 3.1 + 1.0 * Math.sin(a)]; }),
      plan: [[0.85, 0.35], [1.1, 0.62], [1.5, 0.85], [2.0, 0.97], [2.6, 1.0]],
      top: [[0.85, 3.45], [1.1, 3.72], [1.5, 3.93], [2.0, 4.04], [2.6, 4.1]],
      bottom: [[0.85, 2.75], [1.1, 2.48], [1.5, 2.27], [2.0, 2.16], [2.6, 2.1]],
      bands: [[0, 2.95, grey], [2.95, 3.25, dark], [3.25, 9, grey]],
    }],
    bogies: [{ x0: 1.5, x1: 4.3, y: 0.6 }, { x0: 13.3, x1: 15.9, y: 0.66 }],
    gear: {
      wheels: [
        { x: 2.2, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 3.7, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 5.75, d: ft(0, 79), spokes: 0 },
        { x: 7.9, d: ft(0, 79), spokes: 0 },
        { x: 10.05, d: ft(0, 79), spokes: 0 },
        { x: 13.9, d: ft(0, 45), spokes: 0, outsideBoxes: true },
        { x: 15.3, d: ft(0, 45), spokes: 0, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.5, x1: 3.6, y: 1.08, r: 0.36 }, crank: 0.37, phase: 0.6, valveGear: true }],
      cylinderZ: 1.15, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "5450", side: [14.9, 2.6, 1.55] },
    extras: (t) => {
      t.m.scope("fin", () => t.box(grey, 0.9, 2.6, 3.95, 4.32, -0.05, 0.05));
      headlight(t, 0.75, 3.25, 0.16);
      pilot(t, 1, 0, 1.4, 1.4, dark, false, 0.8);
      t.m.scope("drawbar", () => t.box("black", 16.2, 17.6, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function hudsonTenderSpec(): LocoSpec {
  return {
    title: "NYC J-3a Hudson tender",
    palette: hudsonSpec().palette,
    heads: [0, 15.4],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 14.9, top: 1.3 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 14.8, half: [[1.55, 1.3], [1.55, 3.85], [1.4, 4.1], [1.1, 4.25]] },
      { name: "skirt", x0: 0.3, x1: 14.8, half: [[1.56, 1.0], [1.56, 1.29]], mat: "lining" },
    ],
    bogies: [{ x0: 1.0, x1: 5.4, y: 0.6 }, { x0: 9.4, x1: 13.8, y: 0.6 }],
    gear: { wheels: [1.5, 3.2, 4.9, 9.9, 11.6, 13.3].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[14.82, 3.4, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 7.6, 2.6, "NEW YORK CENTRAL", 1.55, 0.28); });
      t.m.scope("stripe", () => { for (const s of [-1, 1]) t.sideBox("lining", s, 0.3, 14.8, 2.95, 3.25, 1.55, 1.556); });
      pilot(t, -1, 15.4, 1.3, 1.2, "lining");
    },
  };
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
export function prrK4sLod(params?: ParamValues): MeshBuilder { return steamLocoLod(k4s(params)); }
export function nycHudson(params?: ParamValues): MeshBuilder { return buildLoco(hudson(params)); }
export function nycHudsonLod(params?: ParamValues): MeshBuilder { return steamLocoLod(hudson(params), 200); }
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
  { id: "proc-vehicle-prr-k4s", title: "PRR K4s", build: prrK4s, buildLod: prrK4sLod, params: [UNIT_PARAM], game: withTender(141, 2400, 161, 95), catalog: STEAM_CATALOG, loadingGauge: "us", references: "prr-k4s" },
  { id: "proc-vehicle-nyc-hudson", title: "NYC J-3a Hudson", build: nycHudson, buildLod: nycHudsonLod, params: [UNIT_PARAM], game: withTender(163, 3500, 161, 130), lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "nyc-hudson" },
  { id: "proc-vehicle-american-440", title: "Golden Spike 4-4-0", build: american440, buildLod: american440Lod, params: AMERICAN_PARAMS, game: AMERICAN_GAME, catalog: STEAM_CATALOG, loadingGauge: "us", references: "american-440" },
];
