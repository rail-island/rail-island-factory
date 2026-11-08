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
import { octagon, hexagon, steamLocoLod, steamLodSpec } from "./lodSteam.ts";
import { fitLod, lodPolygon, lodShell, lodSideBox } from "./lodKit.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { block, side } from "./vehicleParts.ts";
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
//
// Measured on the National Park Service's operating replicas at Promontory Summit
// (assets/american-440/SOURCES.md, "Measurements"), scaled by the 60 in drivers: a low
// boiler (centre 2.0 m) under a tall stack, the cab roof at 3.3 m, the 30 in truck at
// the front with the cylinders between its wheels, the long cowcatcher, the headlamp box
// on its bracket ahead of the stack; the sand dome mid-boiler and the brass steam dome
// just ahead of the wooden cab.

export type AmericanLivery = "jupiter" | "no119";
const AMERICAN_PARAMS: ParamSpec[] = [
  UNIT_PARAM,
  { name: "livery", title: "Livery", default: "jupiter", values: [{ value: "jupiter", title: "Jupiter" }, { value: "no119", title: "UP No. 119" }] },
];

/** A 4-4-0 livery: its palette (the materials below) and what differs in shape. */
interface AmericanLook {
  palette: Record<string, MaterialSpec>;
  balloon: boolean;
  number: string;
  /** The name on the cab's board (Jupiter), else the number. */
  name: string;
  road: string;
  /** Source x of the sand dome and the bell; the boiler bands. */
  sand: number;
  bell: number;
  bands: number[];
}

const gold = (color = "#d6ae55"): MaterialSpec => ({ color, metallic: 0.5, roughness: 0.35 });
// paint: the Russian iron jacket; smokebox: black; cabPaint: the cab's sides; trim: window
// frames and posts; domeBase, sand, sandTop: the domes' paint; lampBox, lampPanel, bracket:
// the headlamp; pilot, pilotLine: the cowcatcher; tank, coping, sill, truck: the tender
const AMERICAN_LIVERIES: Record<AmericanLivery, AmericanLook> = {
  // Jupiter: blue cab, tender, domes, headlamp and pilot with red panels and gold leaf; red wheels;
  // the boiler's dark Russian iron with brass bands; the balloon (funnel) stack of a wood-burner
  jupiter: {
    palette: {
      paint: { color: "#3c4350", metallic: 0.35, roughness: 0.4 }, smokebox: { color: "#1d1e21", roughness: 0.7 },
      cabPaint: { color: "#1f4fb4", roughness: 0.4 }, trim: { color: "#c22a24", roughness: 0.45 }, roof: { color: "#b3241f", roughness: 0.55 },
      wheel: { color: "#c81f24", roughness: 0.5 }, tyre: { color: "#3e4044", metallic: 0.35, roughness: 0.45 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: gold(), brass: { color: "#c9a046", metallic: 0.55, roughness: 0.3 },
      plate: { color: "#1f4fb4", roughness: 0.4 }, plateText: gold(), domeBase: { color: "#1f4fb4", roughness: 0.4 }, sand: { color: "#1f4fb4", roughness: 0.4 }, sandTop: { color: "#1f4fb4", roughness: 0.4 },
      lampBox: { color: "#1f4fb4", roughness: 0.4 }, lampPanel: { color: "#c22a24", roughness: 0.45 }, bracket: { color: "#1f4fb4", roughness: 0.45 },
      pilot: { color: "#1f4fb4", roughness: 0.45 }, pilotLine: gold(), cabInside: { color: "#2a2622", roughness: 0.9 }, numCentre: { color: "#1f4fb4", roughness: 0.4 },
      tank: { color: "#1f4fb4", roughness: 0.4 }, coping: { color: "#c22a24", roughness: 0.45 }, panel: { color: "#c22a24", roughness: 0.45 }, sill: { color: "#1f4fb4", roughness: 0.45 }, truck: { color: "#1f4fb4", roughness: 0.5 },
    },
    balloon: true, number: "60", name: "JUPITER", road: "C.P.R.R.", sand: 5.1, bell: 3.5, bands: [3.2, 3.85, 4.5, 5.75, 6.4, 7.8],
  },
  // No. 119: the same Russian iron jacket; a varnished wooden cab; maroon headlamp, domes and pilot
  // (red stripes); a red tender with gold lining; red wheels with white tyres; a straight stack
  no119: {
    palette: {
      paint: { color: "#4b535f", metallic: 0.35, roughness: 0.4 }, smokebox: { color: "#1d1e21", roughness: 0.7 },
      cabPaint: { color: "#8c5a2a", roughness: 0.45 }, trim: { color: "#4e2d17", roughness: 0.5 }, roof: { color: "#5c3519", roughness: 0.6 },
      wheel: { color: "#c8202a", roughness: 0.5 }, tyre: { color: "#e4e0d8", roughness: 0.5 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: gold(), brass: { color: "#c9a046", metallic: 0.55, roughness: 0.3 },
      plate: { color: "#8c1f24", roughness: 0.45 }, plateText: gold(), domeBase: { color: "#6e1b22", roughness: 0.45 }, sand: { color: "#6e1b22", roughness: 0.45 }, sandTop: { color: "#c3322b", roughness: 0.45 },
      lampBox: { color: "#6e1b22", roughness: 0.45 }, lampPanel: { color: "#6e1b22", roughness: 0.45 }, bracket: { color: "#c9a046", metallic: 0.55, roughness: 0.3 },
      pilot: { color: "#6a1a20", roughness: 0.5 }, pilotLine: { color: "#d8402e", roughness: 0.5 }, cabInside: { color: "#2a2622", roughness: 0.9 }, numCentre: { color: "#1d1e21", roughness: 0.7 },
      tank: { color: "#b8262a", roughness: 0.45 }, coping: { color: "#5c3519", roughness: 0.55 }, panel: { color: "#b8262a", roughness: 0.45 }, sill: { color: "#6e1b22", roughness: 0.5 }, truck: { color: "#1c1d1f", roughness: 0.65 },
    },
    balloon: false, number: "119", name: "119", road: "UNION PACIFIC R.R.", sand: 5.9, bell: 4.0, bands: [3.2, 3.85, 4.5, 5.15, 6.55, 7.8],
  },
};

const AM = {
  boilerY: 2.0, boilerR: 0.58, smokebox: 2.0, cabX: [8.0, 10.25] as const, cabHalf: 1.2, cabFloor: 1.75, eave: 3.0,
  board: 1.78, lampX: [1.28, 1.98] as const, lampY: [2.78, 3.62] as const, stackX: 2.7, steamDome: 7.2,
};

/** A body of revolution about the vertical at source x: [y, r, material] stations bottom to top, the last capped. */
function lathe(t: Steam, x: number, prof: Array<[number, number, string]>, n = 16, z = 0): void {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [ya, ra] = prof[i]!;
    const [yb, rb, mat] = prof[i + 1]!;
    t.m.loft(mat, ngon(n, ra, 0, t.X(x), z), ya, ngon(n, rb, 0, t.X(x), z), yb, false);
  }
  const [y, r, mat] = prof[prof.length - 1]!;
  if (r > 1e-3) t.m.cap(mat, ngon(n, r, 0, t.X(x), z), y);
}

/** A flat convex shape on a side face at |z| = face (s +1 right), outline in source (x, y), `proud` off it, 1.5 cm deep. */
function sideShape(t: Steam, mat: string, s: number, face: number, pts: Pt[], proud = 0.006): void {
  t.m.slab(mat, pts.map(([x, y]): Vec3 => [t.X(x), y, s * (face + proud)]), [0, 0, -s * 0.015]);
}

/** A flat convex shape on a face looking forward (e +1) at source x: outline in (z, y). */
function endShape(t: Steam, mat: string, e: number, x: number, pts: Pt[], proud = 0.006): void {
  t.m.slab(mat, pts.map(([z, y]): Vec3 => [t.X(x) + e * proud, y, z]), [-e * 0.015, 0, 0]);
}

/** An octagon "oval" about (u, v), half sizes a and b. */
const oval = (u: number, v: number, a: number, b: number): Pt[] =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((k): Pt => [u + a * Math.cos(((k + 0.5) * Math.PI) / 4), v + b * Math.sin(((k + 0.5) * Math.PI) / 4)]);

/** A rectangle's outline. */
const rectPts = (u0: number, u1: number, v0: number, v1: number): Pt[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

/** A round-topped (arched) opening's outline: x0..x1, from y0 up to the springing y1 and its semicircle. */
const arch = (x0: number, x1: number, y0: number, y1: number): Pt[] => {
  const r = (x1 - x0) / 2;
  const top: Pt[] = [];
  for (let k = 0; k <= 6; k++) top.push([x0 + r - r * Math.cos((k * Math.PI) / 6), y1 + r * Math.sin((k * Math.PI) / 6)]);
  return [[x0, y0], [x1, y0], ...top.reverse()];
};

/** Gold lettering on a side face at |z| = face, centred at source x, foot at y, `h` tall. */
function sideText(t: Steam, s: number, x: number, y: number, text: string, face: number, h: number, mat = "plateText"): void {
  const w = h * 0.58, gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  const u0 = t.X(x) + (s > 0 ? -width / 2 : width / 2);
  t.m.facets(mat, strokeText(text, u0, y, h, w, gap, s < 0, h * 0.13).map(([u, v]): Vec3 => [u, v, s * face]), [0, 0, s]);
}

/** Gold lettering on a face looking forward (e +1) at source x, centred on z = 0. */
function endText(t: Steam, e: number, x: number, y: number, text: string, h: number, mat = "plateText"): void {
  const w = h * 0.58, gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  const u0 = e > 0 ? width / 2 : -width / 2;
  t.m.facets(mat, strokeText(text, u0, y, h, w, gap, e > 0, h * 0.13).map(([u, v]): Vec3 => [t.X(x), v, u]), [e, 0, 0]);
}

/** A knuckle coupler's head and shank at the front (e +1) or rear, its face at model X `face` (usHoodKit's, without the cut lever). */
function amCoupler(t: Steam, e: number, face: number, shank: number): void {
  const m = t.m;
  const y = COUPLER_Y;
  const along = (a: number, b: number): [number, number] => (e > 0 ? [face - e * b, face - e * a] : [face - e * a, face - e * b]);
  m.scope("coupler", () => {
    block(m, "knuckle", ...along(0.3, shank), y - 0.08, y + 0.08, -0.09, 0.09);
    block(m, "knuckle", ...along(0, 0.3), y - 0.2, y + 0.16, -0.17, 0.13);
    block(m, "knuckle", ...along(0.02, 0.27), y - 0.14, y + 0.1, 0.13, 0.25);
  });
}

/** The cowcatcher: a beam over slats raked from it to a V-shaped foot whose prow nearly meets the rail. */
function amPilot(t: Steam): void {
  const m = t.m;
  const [bx0, bx1, by0, by1, half] = [1.42, 1.7, 1.0, 1.22, 1.25];
  m.scope("front pilot", () => {
    m.scope("beam", () => {
      t.box("pilot", bx0, bx1, by0, by1, -half, half);
      // the gold line along its face, and its top's edge
      t.box("pilotLine", bx0 - 0.006, bx0 + 0.02, by0 + 0.09, by0 + 0.12, -half + 0.08, half - 0.08);
    });
    // the slats from the beam's foot down to the foot of the vee: the prow at the rail, the outer ends raised
    const P = (x: number, y: number, z: number): Vec3 => [t.X(x), y, z];
    const tip: Pt = [0.22, 0.09];
    const outer: [number, number, number] = [1.3, 0.42, half - 0.05];
    const n = 11;
    m.scope("slats", () => {
      for (const s of [-1, 1]) for (let k = 0; k <= n; k++) {
        if (s < 0 && k === 0) continue;
        const f = k / n;
        const top = P(bx0 + 0.02, by0 + 0.02, s * f * (half - 0.08));
        const foot = P(tip[0] + (outer[0] - tip[0]) * f, tip[1] + (outer[1] - tip[1]) * f, s * f * outer[2]);
        m.rod("pilot", top, foot, k === 0 ? 0.06 : 0.045, 4);
        // the painted line down each slat's face (Jupiter's gold, No. 119's red)
        if (k > 0 && k < n) m.rod("pilotLine", [top[0] + 0.02, top[1] + 0.02, top[2]], [foot[0] + 0.02, foot[1] + 0.02, foot[2]], 0.012, 3);
      }
      // the foot: a flat bar along the vee's lower edge on each side
      for (const s of [-1, 1]) m.rod("pilot", P(tip[0], tip[1], 0), P(outer[0], outer[1], s * outer[2]), 0.045, 4);
    });
    // the braces from the smokebox's sides down to the beam's ends
    m.scope("braces", () => { for (const s of [-1, 1]) m.rod("black", P(2.25, 1.95, s * 0.5), P(bx1 - 0.05, by1, s * (half - 0.2)), 0.025, 6); });
    // the coupler's head at the front, its bar down to the beam over the prow
    amCoupler(t, 1, t.X(0), 0.35);
    m.scope("coupler", () => m.rod("knuckle", P(0.3, COUPLER_Y, 0), P(bx0 + 0.02, by0 + 0.06, 0), 0.06, 6));
  });
}

/** The headlamp: its box on a bracket ahead of the stack, the lens forward, panels on its sides. */
function amHeadlamp(t: Steam, l: AmericanLook): void {
  const m = t.m;
  const [x0, x1] = AM.lampX;
  const [y0, y1] = AM.lampY;
  const hz = 0.3;
  m.scope("headlamp", () => {
    m.scope("bracket", () => {
      t.box("bracket", x0 - 0.08, AM.smokebox + 0.3, y0 - 0.07, y0, -hz - 0.06, hz + 0.06);
      t.box("bracket", AM.smokebox + 0.05, AM.smokebox + 0.3, 2.5, y0 - 0.07, -0.2, 0.2);
      for (const s of [-1, 1]) {
        const z = s * 0.26;
        m.slab("bracket", [[t.X(x0), y0 - 0.07, z], [t.X(AM.smokebox - 0.05), y0 - 0.07, z], [t.X(AM.smokebox - 0.05), 2.2, z]], [0, 0, 0.04 * s]);
      }
    });
    m.scope("box", () => {
      t.box("lampBox", x0, x1, y0, y1, -hz, hz);
      t.box(l.balloon ? "lining" : "brass", x0 - 0.03, x1 + 0.03, y1, y1 + 0.05, -hz - 0.03, hz + 0.03);
      // the lens in its brass ring
      t.cylX("brass", x0 - 0.05, x0 + 0.02, 0, (y0 + y1) / 2, 0.29, 16);
      t.cylX("lampHead", x0 - 0.06, x0 - 0.045, 0, (y0 + y1) / 2, 0.24, 16);
      // the painted panels on its sides: Jupiter's red oval in gold, No. 119's gold-lined panel
      for (const s of [-1, 1]) {
        const [xc, yc] = [(x0 + x1) / 2, (y0 + y1) / 2];
        if (l.balloon) {
          sideShape(t, "lining", s, hz, oval(xc, yc, 0.21, 0.29), 0.003);
          sideShape(t, "lampPanel", s, hz, oval(xc, yc, 0.17, 0.25), 0.007);
        } else {
          sideShape(t, "lining", s, hz, rectPts(xc - 0.2, xc + 0.2, yc - 0.26, yc + 0.26), 0.003);
          sideShape(t, "lampPanel", s, hz, rectPts(xc - 0.17, xc + 0.17, yc - 0.23, yc + 0.23), 0.007);
        }
      }
    });
    m.scope("top", () => {
      const xc = (x0 + x1) / 2;
      if (l.balloon) {
        // a blue chimney under a domed cap and the brass bail
        lathe(t, xc + 0.05, [[y1 + 0.05, 0.13, "lampBox"], [y1 + 0.3, 0.13, "lampBox"], [y1 + 0.3, 0.17, "lampBox"], [y1 + 0.36, 0.17, "lampBox"], [y1 + 0.44, 0.09, "lampBox"], [y1 + 0.5, 0.03, "brass"]], 8);
        m.rod("brass", [t.X(xc - 0.12), y1 + 0.3, 0], [t.X(xc - 0.12), y1 + 0.52, 0], 0.015, 4);
        m.rod("brass", [t.X(xc - 0.12), y1 + 0.52, 0], [t.X(xc + 0.2), y1 + 0.52, 0], 0.015, 4);
      } else {
        // the hooded top along the box and the finials on the front corners
        t.cylX("lampBox", x0 + 0.05, x1 - 0.02, 0, y1 + 0.05, 0.17, 10);
        for (const s of [-1, 1]) lathe(t, x0 + 0.03, [[y1 + 0.05, 0.03, "brass"], [y1 + 0.13, 0.03, "brass"], [y1 + 0.16, 0.05, "brass"], [y1 + 0.2, 0.01, "brass"]], 6, s * 0.26);
      }
    });
  });
}

/** Jupiter's balloon stack: the funnel over the kit's straight pipe; No. 119's cap on its straight stack. */
function amStack(t: Steam, l: AmericanLook): void {
  t.m.scope(l.balloon ? "balloon stack" : "stack cap", () => {
    if (l.balloon) lathe(t, AM.stackX, [[3.28, 0.27, "smokebox"], [3.3, 0.33, "smokebox"], [3.38, 0.33, "smokebox"], [3.42, 0.3, "smokebox"], [4.45, 0.74, "smokebox"], [4.5, 0.79, "smokebox"], [4.66, 0.79, "smokebox"], [4.7, 0.75, "smokebox"], [4.72, 0.72, "coal"]], 20);
    else lathe(t, AM.stackX, [[3.8, 0.215, "smokebox"], [3.82, 0.245, "smokebox"], [4.1, 0.245, "smokebox"], [4.14, 0.27, "smokebox"]], 14);
    if (l.balloon) t.m.cap("smokebox", ngon(20, 0.27, 0, t.X(AM.stackX), 0), 3.28, false);
  });
}

/** The domes: the sand dome mid-boiler and the brass steam dome with its whistle ahead of the cab. */
function amDomes(t: Steam, l: AmericanLook): void {
  const m = t.m;
  m.scope("sand dome", () => {
    if (l.balloon) lathe(t, l.sand, [[2.2, 0.46, "sand"], [2.62, 0.46, "sand"], [2.66, 0.44, "lining"], [2.66, 0.33, "sand"], [2.98, 0.33, "sand"], [3.0, 0.35, "lining"], [3.05, 0.35, "lining"], [3.06, 0.38, "sand"], [3.1, 0.38, "sand"], [3.18, 0.3, "sand"], [3.24, 0.16, "sand"], [3.26, 0.05, "sand"], [3.27, 0.05, "brass"], [3.36, 0.04, "brass"]]);
    else lathe(t, l.sand, [[2.2, 0.44, "sand"], [2.6, 0.44, "sand"], [2.64, 0.42, "lining"], [2.64, 0.32, "sand"], [3.08, 0.32, "sand"], [3.1, 0.36, "lining"], [3.15, 0.36, "sandTop"], [3.25, 0.3, "sandTop"], [3.33, 0.2, "sandTop"], [3.37, 0.07, "sandTop"], [3.38, 0.05, "brass"], [3.5, 0.04, "brass"]]);
    // the running number (Jupiter) or the painted medallion on the dome's sides
    for (const s of [-1, 1]) {
      if (l.balloon) {
        sideShape(t, "lining", s, 0.33, rectPts(l.sand - 0.13, l.sand + 0.13, 2.7, 2.94), -0.006);
        sideShape(t, "numCentre", s, 0.33, rectPts(l.sand - 0.11, l.sand + 0.11, 2.72, 2.92), 0.002);
        sideText(t, s, l.sand, 2.75, l.number, 0.336, 0.14);
      } else {
        sideShape(t, "lining", s, 0.32, oval(l.sand, 2.86, 0.13, 0.15), -0.006);
        sideShape(t, "white", s, 0.32, oval(l.sand, 2.86, 0.1, 0.12), 0.002);
      }
    }
  });
  m.scope("steam dome", () => {
    const x = AM.steamDome;
    if (l.balloon) lathe(t, x, [[2.2, 0.5, "domeBase"], [2.64, 0.48, "domeBase"], [2.68, 0.46, "lining"], [2.68, 0.37, "brass"], [3.1, 0.37, "brass"], [3.14, 0.4, "brass"], [3.2, 0.4, "brass"], [3.24, 0.36, "brass"], [3.33, 0.29, "brass"], [3.39, 0.18, "brass"], [3.41, 0.06, "brass"], [3.48, 0.05, "brass"], [3.52, 0.07, "brass"], [3.64, 0.07, "brass"], [3.68, 0.04, "brass"], [3.76, 0.04, "brass"], [3.8, 0.02, "brass"]]);
    else lathe(t, x, [[2.2, 0.5, "domeBase"], [2.64, 0.48, "domeBase"], [2.68, 0.46, "lining"], [2.68, 0.38, "brass"], [3.12, 0.38, "brass"], [3.16, 0.44, "brass"], [3.24, 0.44, "brass"], [3.27, 0.4, "brass"], [3.38, 0.33, "brass"], [3.46, 0.2, "brass"], [3.49, 0.06, "brass"], [3.72, 0.05, "brass"], [3.74, 0.07, "black"], [3.9, 0.07, "black"], [3.93, 0.03, "brass"], [3.98, 0.03, "brass"]]);
    // the dome base's painted panel (No. 119's red lining on maroon, Jupiter's gold on blue)
  });
}

/** The bell on its yoke between the stack and the sand dome. */
function amBell(t: Steam, l: AmericanLook): void {
  const x = l.bell;
  const base = AM.boilerY + AM.boilerR - 0.02;
  t.m.scope("bell", () => {
    const yoke = l.balloon ? "brass" : "trimRed";
    for (const s of [-1, 1]) t.m.rod(yoke, [t.X(x), base, s * 0.28], [t.X(x), base + 0.72, s * 0.28], 0.03, 6);
    t.m.rod(yoke, [t.X(x), base + 0.72, -0.31], [t.X(x), base + 0.72, 0.31], 0.03, 6);
    // No. 119's yoke is a red casting of scrolls: two braces each side
    if (!l.balloon) for (const s of [-1, 1]) t.m.rod(yoke, [t.X(x), base + 0.72, s * 0.28], [t.X(x), base + 0.3, s * 0.45], 0.03, 5);
    lathe(t, x, [[base + 0.16, 0.25, "brass"], [base + 0.22, 0.23, "brass"], [base + 0.38, 0.16, "brass"], [base + 0.52, 0.14, "brass"], [base + 0.57, 0.08, "brass"], [base + 0.72, 0.03, "brass"]], 14);
    t.m.cap("brass", ngon(14, 0.25, 0, t.X(x), 0), base + 0.16, false);
  });
}

/** The cab's dressing: frames round its windows and doorway, the name or number board, posts, steps. */
function amCab(t: Steam, l: AmericanLook): void {
  const m = t.m;
  const [c0, c1] = AM.cabX;
  const face = AM.cabHalf;
  m.scope("cab dressing", () => {
    for (const s of [-1, 1]) {
      // the doorway ahead, open to the cab's dark inside
      if (l.balloon) {
        sideShape(t, "trim", s, face, rectPts(8.12, 9.03, 2.2, 2.97), 0.002);
        sideShape(t, "cabInside", s, face, rectPts(8.17, 8.98, 2.25, 2.93), 0.006);
        // the window's red sash frame behind the glass, the corner posts' red edges
        sideShape(t, "lining", s, face, rectPts(9.11, 10.14, 2.19, 2.98), 0.002);
        sideShape(t, "trim", s, face, rectPts(9.125, 10.125, 2.205, 2.965), 0.003);
        sideShape(t, "trim", s, face, rectPts(9.585, 9.655, 2.27, 2.9), 0.008);
        // the name board under the window: gold-lined red with the blue centre
        sideShape(t, "trim", s, face, rectPts(9.12, 10.13, 1.87, 2.15), 0.002);
        t.sidePlate(s, 9.625, 1.945, l.name, face + 0.002, 0.13);
      } else {
        // the arched doorway and the two arched windows, framed in dark wood
        sideShape(t, "trim", s, face, arch(8.1, 9.05, 2.2, 2.5), 0.002);
        sideShape(t, "cabInside", s, face, arch(8.16, 8.99, 2.25, 2.52), 0.006);
        for (const [a, b] of [[9.15, 9.6], [9.7, 10.15]] as const) {
          sideShape(t, "trim", s, face, arch(a - 0.04, b + 0.04, 2.24, 2.72), 0.002);
          sideShape(t, "glass", s, face, arch(a, b, 2.7, 2.74), 0.007);
        }
        // the panel under the windows: a red oval under the doorway, the number plate under the windows
        sideShape(t, "trim", s, face, rectPts(8.1, 10.17, 1.8, 2.18), 0.002);
        sideShape(t, "lining", s, face, oval(8.58, 2.0, 0.34, 0.11), 0.004);
        sideShape(t, "plate", s, face, oval(8.58, 2.0, 0.3, 0.085), 0.007);
        t.sidePlate(s, 9.65, 1.93, l.number, face + 0.002, 0.13);
        // the corner posts
        sideShape(t, "trim", s, face, rectPts(c0 + 0.005, c0 + 0.08, 1.76, 2.99), 0.004);
        sideShape(t, "trim", s, face, rectPts(c1 - 0.08, c1 - 0.005, 1.76, 2.99), 0.004);
      }
      // the cab's skirt down to the steps at its rear corners
      t.sideBox("cabPaint", s, 9.95, c1 - 0.01, 1.3, AM.cabFloor + 0.01, face - 0.05, face - 0.01);
      // the steps behind the rear driver, up to the cab's floor
      m.scope("steps", () => {
        for (const x of [9.68, 10.12]) t.sideBox("black", s, x - 0.02, x + 0.02, 0.95, 1.74, 1.1, 1.14);
        t.sideBox("black", s, 9.64, 10.16, 0.95, 0.99, 1.06, 1.18);
        t.sideBox("black", s, 9.64, 10.16, 1.33, 1.37, 1.06, 1.18);
      });
    }
    // the roof: a shallow arch overhanging the sides and both ends (No. 119's deep cornice)
    m.scope("roof", () => {
      const e = l.balloon ? 0 : 0.08;
      const sec: Pt[] = [[-1.45, 2.97], [1.45, 2.97], [1.45, 3.04 + e], [1.0, 3.17 + e], [0, 3.22 + e], [-1.0, 3.17 + e], [-1.45, 3.04 + e]];
      t.section("roof", c0 - 0.22, c1 + 0.22, sec);
      // its edge: Jupiter's red fascia carries a gold line
      if (l.balloon) for (const s of [-1, 1]) t.sideBox("lining", s, c0 - 0.2, c1 + 0.2, 2.99, 3.01, 1.45, 1.455);
    });
  });
}

/** The cylinders' brass lagging and front covers, the steam chests on them and the saddle reaching them (steamGear's cylinderDressing, model coordinates). */
function amCylinders(l: AmericanLook) {
  return (m: MeshBuilder, s: number, c: { x0: number; x1: number; y: number; z: number; r: number }): void => {
    const zs = (a: number, b: number): [number, number] => [Math.min(c.z + s * a, c.z + s * b), Math.max(c.z + s * a, c.z + s * b)];
    const ring = (r: number) => ngon(16, r, Math.PI / 16, c.z, c.y);
    m.sweep("brass", "x", ring(c.r + 0.02), c.x0 + 0.07, ring(c.r + 0.02), c.x1 - 0.07, false);
    m.sweep("brass", "x", ring(c.r + 0.045), c.x1 - 0.065, ring(c.r + 0.045), c.x1 + 0.005);
    // the chest: a brass box over a band (Jupiter's blue with its gold line, No. 119's brass)
    block(m, "brass", c.x0 + 0.04, c.x1 - 0.04, c.y + c.r + 0.15, c.y + c.r + 0.35, ...zs(-0.21, 0.21));
    block(m, l.balloon ? "sand" : "brass", c.x0 + 0.065, c.x1 - 0.065, c.y + c.r - 0.02, c.y + c.r + 0.151, ...zs(-0.2, 0.2));
    if (l.balloon) {
      const zf = c.z + s * 0.202;
      m.slab("lining", [[c.x0 + 0.12, c.y + c.r + 0.02, zf], [c.x1 - 0.12, c.y + c.r + 0.02, zf], [c.x1 - 0.12, c.y + c.r + 0.13, zf], [c.x0 + 0.12, c.y + c.r + 0.13, zf]], [0, 0, -s * 0.01]);
    }
    // the saddle's side reaching the cylinder under the smokebox
    block(m, "smokebox", c.x0 + 0.12, c.x1 - 0.12, c.y - 0.13, c.y + c.r + 0.32, ...side(s, 0.4, Math.abs(c.z) - c.r + 0.03));
  };
}

function americanSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  const cylinder = { x0: 2.5, x1: 3.5, y: 0.88, r: 0.27 };
  const cylinderZ = 1.05;
  const [c0, c1] = AM.cabX;
  return {
    title: "Golden Spike 4-4-0",
    palette: { ...US_STEAM_PALETTE, trimRed: { color: "#a3201f", roughness: 0.5 }, ...l.palette },
    heads: [0, 10.7],
    beams: { front: false, rear: false },
    boiler: { x0: AM.smokebox, x1: c0, y: AM.boilerY, r: AM.boilerR, smokebox: 1.2, bands: l.bands, band: "brass", n: 24 },
    // the kit's straight stack: Jupiter's pipe under its funnel, No. 119's whole stack
    chimney: { x: AM.stackX, top: l.balloon ? 4.6 : 4.25, r: l.balloon ? 0.23 : 0.21 },
    runningBoard: { profile: [[3.55, AM.board], [c0 + 0.1, AM.board]], half: 1.25, valance: 0.05, valanceMat: "brass" },
    frame: { x0: 1.66, x1: 10.2, top: 1.45 },
    cab: {
      x0: c0, x1: c1, half: [[AM.cabHalf, AM.cabFloor], [AM.cabHalf, AM.eave], [0.9, 3.08], [0, 3.12]], roofY: AM.eave, mat: "cabPaint",
      windows: l.balloon ? [{ x0: 9.17, x1: 10.08, y0: 2.27, y1: 2.9 }] : [{ x0: 9.15, x1: 9.6, y0: 2.27, y1: 2.72 }, { x0: 9.7, x1: 10.15, y0: 2.27, y1: 2.72 }],
      front: [{ z0: 0.62, z1: 1.05, y0: 2.35, y1: 2.85 }, { z0: -1.05, z1: -0.62, y0: 2.35, y1: 2.85 }],
      rearWindows: [{ z0: 0.35, z1: 0.95, y0: 2.3, y1: 2.85 }, { z0: -0.95, z1: -0.35, y0: 2.3, y1: 2.85 }],
    },
    prisms: [{ name: "firebox", x0: c0, x1: 9.9, half: [[0.5, 0.95], [0.5, AM.cabFloor]], mat: "black" }],
    bogies: [{ x0: 1.6, x1: 4.3, y: 0.55 }],
    gear: {
      wheels: [
        { x: 2.0, d: ft(0, 30), spokes: 0, outsideBoxes: true },
        { x: 3.9, d: ft(0, 30), spokes: 0, outsideBoxes: true },
        { x: 6.6, d: ft(0, 60), spokes: 16 },
        { x: 8.75, d: ft(0, 60), spokes: 16 },
      ],
      engines: [{ coupled: [2, 3], main: 2, cylinder, crank: 0.305, phase: 0.5 }],
      cylinderZ, reference: 2, wheelMaterial: "wheel", cylinderDressing: amCylinders(l),
    },
    extras: (t) => {
      amPilot(t);
      amHeadlamp(t, l);
      amStack(t, l);
      amDomes(t, l);
      amBell(t, l);
      amCab(t, l);
      // the number plate on the smokebox door: a brass ring round a painted centre
      t.m.scope("number plate", () => {
        t.cylX("brass", AM.smokebox - 0.095, AM.smokebox - 0.065, 0, AM.boilerY, 0.19, 16);
        t.cylX("numCentre", AM.smokebox - 0.116, AM.smokebox - 0.102, 0, AM.boilerY, 0.155, 16);
        endText(t, 1, AM.smokebox - 0.12, AM.boilerY - 0.06, l.number, 0.12);
      });
      // the brass handrails along the boiler's shoulders on their stanchions
      t.m.scope("handrails", () => {
        for (const s of [-1, 1]) {
          t.cylX("brass", AM.smokebox + 0.4, c0 - 0.05, s * 0.4, 2.6, 0.018, 6);
          for (const x of [2.6, 4.2, 5.5, 6.6]) t.m.rod("brass", [t.X(x), 2.4, s * 0.4], [t.X(x), 2.6, s * 0.4], 0.012, 4);
        }
      });
      // No. 119's flag staffs on the pilot beam, Jupiter's on the headlamp bracket
      t.m.scope("flag staffs", () => {
        for (const s of [-1, 1]) {
          if (l.balloon) t.m.rod("brass", [t.X(AM.lampX[0] - 0.05), AM.lampY[0], s * 0.36], [t.X(AM.lampX[0] - 0.05), AM.lampY[0] + 0.75, s * 0.36], 0.015, 6);
          else {
            t.m.rod("wood", [t.X(1.55), 1.22, s * 1.12], [t.X(1.55), 2.2, s * 1.12], 0.03, 6);
            t.m.rod("brass", [t.X(1.55), 2.2, s * 1.12], [t.X(1.55), 2.75, s * 1.12], 0.018, 6);
          }
        }
      });
      // the drawbar to the tender and the deck plate over it
      t.m.scope("drawbar", () => {
        t.box("black", c1 - 0.05, 10.7, 0.82, 0.98, -0.12, 0.12);
        t.box("black", c1, 10.55, 1.5, 1.55, -0.7, 0.7);
      });
    },
  };
}

function americanTenderSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  const half = 1.3;
  const [t0, t1] = [0.25, 6.5];
  const front = 1.55;
  return {
    title: "Golden Spike 4-4-0 tender",
    palette: { ...US_STEAM_PALETTE, woodEnd: { color: "#9c7246", roughness: 0.9 }, ...l.palette },
    heads: [0, 6.8],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 6.45, top: 0.95 },
    prisms: [
      { name: "sill", x0: 0.2, x1: 6.55, half: [[half + 0.02, 0.92], [half + 0.02, 1.15]], mat: "sill" },
      { name: "tank", x0: front, x1: t1, half: [[half, 1.15], [half, 2.38]], mat: "tank" },
      { name: "front", x0: t0, x1: front, half: [[half, 1.15], [half, 2.2]], mat: "tank" },
    ],
    ...(l.balloon ? {} : { coal: { x0: 0.35, x1: 3.0, y: 2.18, half: 1.15, rise: 0.38 } }),
    bogies: [{ x0: 0.45, x1: 2.6, y: 0.55 }, { x0: 4.15, x1: 6.3, y: 0.55 }],
    gear: { wheels: [0.85, 2.2, 4.55, 5.9].map((x) => ({ x, d: ft(0, 33), spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[t1 - 0.05, 2.38, 0.85]] },
    extras: (t) => {
      const m = t.m;
      // the coping round the tank's top: upright plates with a lip, the name of the road on them
      m.scope("coping", () => {
        for (const s of [-1, 1]) {
          t.sideBox("coping", s, front + 0.005, t1 + 0.035, 2.3, 2.66, half - 0.04, half + 0.035);
          t.sideBox("lining", s, front, t1, 2.66, 2.7, half - 0.04, half + 0.07);
          t.sideBox("lining", s, front + 0.02, t1 - 0.02, 2.31, 2.33, half + 0.03, half + 0.04);
        }
        t.box("coping", t1 - 0.075, t1 + 0.035, 2.3, 2.66, -half + 0.04, half - 0.04);
        t.box("lining", t1 - 0.075, t1 + 0.07, 2.66, 2.7, -half + 0.04, half - 0.04);
        for (const s of [-1, 1]) sideText(t, s, (front + t1) / 2, 2.4, l.road, half + 0.04, l.balloon ? 0.18 : 0.13);
      });
      // the tank's black top behind the fuel and its water hatch
      m.scope("tank top", () => {
        t.box("black", 3.05, t1 - 0.08, 2.37, 2.39, -half + 0.05, half - 0.05);
        t.cylY("black", 5.2, 0, 2.38, 2.5, 0.3, 12);
        t.cylY("steel", 5.2, 0, 2.5, 2.53, 0.33, 12);
      });
      m.scope("panels", () => {
        for (const s of [-1, 1]) {
          if (l.balloon) {
            // the red panel with JUPITER in gold, framed in gold, and gold scrolls at its ends
            sideShape(t, "lining", s, half, rectPts(2.1, 5.7, 1.45, 2.18), 0.003);
            sideShape(t, "panel", s, half, rectPts(2.14, 5.66, 1.49, 2.14), 0.006);
            sideText(t, s, 3.9, 1.6, l.name, half + 0.008, 0.38);
            for (const x of [1.8, 6.05]) sideShape(t, "lining", s, half, oval(x, 1.8, 0.11, 0.3), 0.004);
            // the front well's panel with its red oval
            sideShape(t, "lining", s, half, oval(0.9, 1.68, 0.36, 0.36), 0.003);
            sideShape(t, "panel", s, half, oval(0.9, 1.68, 0.32, 0.32), 0.006);
            // red panels along the sill
            for (const [a, b] of [[0.4, 1.9], [2.1, 3.6], [3.8, 5.3], [5.5, 6.4]]) sideShape(t, "panel", s, half + 0.02, rectPts(a!, b!, 0.97, 1.1), 0.004);
          } else {
            // gold lining round the side, the oval with the number in its middle
            sideShape(t, "lining", s, half, rectPts(front + 0.15, t1 - 0.15, 1.35, 2.25), 0.003);
            sideShape(t, "tank", s, half, rectPts(front + 0.19, t1 - 0.19, 1.39, 2.21), 0.006);
            sideShape(t, "lining", s, half, oval(3.0, 1.8, 0.38, 0.38), 0.008);
            sideShape(t, "numCentre", s, half, oval(3.0, 1.8, 0.33, 0.33), 0.011);
            sideText(t, s, 3.0, 1.69, l.number, half + 0.013, 0.22);
            sideShape(t, "lining", s, half, oval(5.95, 1.8, 0.22, 0.32), 0.008);
            sideShape(t, "white", s, half, oval(5.95, 1.8, 0.18, 0.28), 0.011);
            sideShape(t, "lining", s, half, rectPts(t0 + 0.12, front - 0.12, 1.35, 2.08), 0.003);
            sideShape(t, "tank", s, half, rectPts(t0 + 0.16, front - 0.16, 1.39, 2.04), 0.006);
            sideShape(t, "lining", s, half + 0.02, rectPts(0.3, 6.45, 1.02, 1.05), 0.004);
          }
        }
        // the rear: the number in gold
        endShape(t, "lining", -1, t1, rectPts(-0.75, 0.75, 1.4, 2.2), 0.003);
        endShape(t, "tank", -1, t1, rectPts(-0.71, 0.71, 1.44, 2.16), 0.006);
        endText(t, -1, t1 + 0.008, 1.62, l.number, 0.36);
      });
      // Jupiter's cordwood stacked in the well and over the tank's front
      if (l.balloon) {
        m.scope("wood", () => {
          t.box("wood", 0.4, 3.0, 2.15, 2.6, -1.12, 1.12);
          // split logs across the tender in two courses, their ends a little ragged
          for (let row = 0; row < 2; row++) for (let i = 0; i < 12 - row; i++) {
            const x = 0.52 + i * 0.22 + row * 0.11;
            const y = 2.66 + row * 0.15 + ((i * 7) % 3) * 0.012;
            const r = 0.075 + ((i * 5) % 3) * 0.008;
            t.m.sweep(row ? "wood" : "woodEnd", "z", ngon(6, r, i * 0.3, t.X(x), y), -1.1 + ((i * 3) % 4) * 0.03, ngon(6, r, i * 0.3, t.X(x), y), 1.08 - ((i * 7) % 4) * 0.04);
          }
        });
      }
      // the trucks' journal boxes and bolsters in the trucks' paint
      m.scope("truck boxes", () => {
        for (const [a, b] of [[0.45, 2.6], [4.15, 6.3]] as const) for (const s of [-1, 1]) {
          for (const x of [a + 0.4, b - 0.4]) {
            t.sideBox("truck", s, x - 0.16, x + 0.16, 0.28, 0.6, 0.98, 1.1);
            if (l.balloon) sideShape(t, "white", s, 1.1, rectPts(x - 0.08, x + 0.08, 0.36, 0.52), 0.003);
          }
          t.sideBox("truck", s, a + 0.2, b - 0.2, 0.6, 0.68, 0.97, 1.09);
        }
      });
      // the rear beam and coupler, the front drawbar
      m.scope("rear beam", () => {
        t.box("sill", t1 + 0.04, 6.62, 0.75, 1.15, -half, half);
        amCoupler(t, -1, t.X(6.8), 0.7);
      });
      m.scope("drawbar", () => t.box("black", 0, 0.3, 0.82, 0.98, -0.12, 0.12));
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
/**
 * The 4-4-0 from afar: the kit's model of its spec (Jupiter's stack its pipe only, the
 * cylinders left to it here) with what makes the engine: Jupiter's funnel, the headlamp
 * box, the cowcatcher and the brass cylinders.
 */
export function american440Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(AMERICAN_PARAMS, params);
  const spec = american(params);
  if (p.unit === "tender") return steamLocoLod(spec, 200);
  const l = AMERICAN_LIVERIES[p.livery as AmericanLivery];
  const X = (x: number) => (spec.heads[0] + spec.heads[1]) / 2 - x;
  const base: LocoSpec = {
    ...spec, chimney: l.balloon ? { ...spec.chimney!, top: 3.32 } : spec.chimney, gear: { ...spec.gear, engines: [] },
    domes: [{ x: l.sand, top: 3.3, r: 0.38, mat: "sand" }, { x: AM.steamDome, top: 3.45, r: 0.42, mat: "brass" }],
  };
  const lod = (ring: typeof octagon) => {
    const s = steamLodSpec(base, ring);
    if (l.balloon) {
      const [y0, y1, r0, r1] = [3.3, 4.7, 0.3, 0.78];
      s.parts.push({ draw: (m) => m.scope("funnel", () => lodShell(m, { y0, tip: [[y0, r0], [y1, r1]], hw: [[y0, r0], [y1, r1]], xc: X(AM.stackX), side: [[y0, y1, "smokebox"]], end: [[y0, y1, "smokebox"]], roof: "smokebox" })) });
    }
    const [x0, x1] = AM.lampX;
    const [ly0, ly1] = AM.lampY;
    s.parts.push({ draw: (m) => m.scope("headlamp", () => {
      lodSideBox(m, "lampBox", [[X(x1), ly0], [X(x0), ly0], [X(x0), ly1], [X(x1), ly1]], -0.3, 0.3);
      lodPolygon(m, "lampHead", [[X(x0) + 0.01, ly0 + 0.18, -0.2], [X(x0) + 0.01, ly0 + 0.18, 0.2], [X(x0) + 0.01, ly1 - 0.18, 0.2], [X(x0) + 0.01, ly1 - 0.18, -0.2]], [1, 0, 0]);
    }) });
    s.parts.push({ draw: (m) => m.scope("pilot", () => {
      const tip: Vec3 = [X(0.22), 0.09, 0];
      for (const z of [-1.25, 1.25]) {
        const top: Vec3 = [X(1.42), 1.22, z], ridge: Vec3 = [X(1.42), 1.22, 0], foot: Vec3 = [X(1.3), 0.42, z * 0.96];
        lodPolygon(m, "pilot", [tip, top, ridge], [1, 0.6, Math.sign(z) * 0.3]);
        lodPolygon(m, "pilot", [tip, foot, top], [1, 0.2, Math.sign(z)]);
      }
    }) });
    const c = spec.gear.engines[0]!.cylinder;
    const z = spec.gear.cylinderZ + c.r;
    s.parts.push({ optional: 20, draw: (m) => m.scope("cylinders", () => lodSideBox(m, "brass", [[X(c.x1), c.y - c.r], [X(c.x0), c.y - c.r], [X(c.x0), c.y + c.r + 0.35], [X(c.x1), c.y + c.r + 0.35]], -z, z)) });
    return s;
  };
  try {
    return fitLod(lod(octagon), 200);
  } catch {
    return fitLod(lod(hexagon), 200);
  }
}

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
  { id: "proc-vehicle-american-440", title: "Golden Spike 4-4-0", build: american440, buildLod: american440Lod, params: AMERICAN_PARAMS, game: AMERICAN_GAME, lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "american-440" },
];
