// The animal-drawn road coaches (docs/models/animal-drawn-vehicles.md): the bodies and
// fore-carriages drawn here, the team ahead of them the kit's (animalVehicleKit.ts,
// draftAnimals.ts).
//
//   veh-animal-bus-knifeboard-omnibus  a London knifeboard double-deck omnibus of the
//                                      1850s-1880s (assets/animal-bus-knifeboard-omnibus):
//                                      the saloon with small windows and advertising
//                                      boards, the knifeboard bench back to back on the
//                                      roof between decency boards, the rear platform
//                                      with its curved ladder, the box seat high at the
//                                      front over the cut-under for the front wheels.
//   veh-animal-bus-stagecoach          an Abbot-Downing Concord stagecoach
//                                      (assets/animal-bus-stagecoach): the egg-shaped body
//                                      slung on leather thoroughbraces between iron jacks,
//                                      the door with its window, the leather-covered boot
//                                      at the rear and under the driver's box, the roof
//                                      railing with luggage; red body, yellow running gear.
//   veh-animal-bus-paris-omnibus       a Compagnie generale des omnibus omnibus a imperiale
//                                      (assets/animal-bus-paris-omnibus): the saloon, the
//                                      open top deck with its lengthwise back-to-back seats,
//                                      railing and route boards, the rear platform with its
//                                      spiral stair, the driver high at the front.
//   veh-animal-bus-wagonette           an open excursion wagonette / charabanc
//                                      (assets/animal-bus-wagonette): five cross benches
//                                      rising toward the rear, a canvas canopy on posts,
//                                      the driver's box at the front, a step at the rear.
//
// Axes as every road vehicle's: metres, +X forward (the team's end), +Y up, +Z to the
// right, the body about x 0, the road at y 0. As the kit rigs them, the fore-carriage
// (the front axle and its rolling wheels on the turntable, the hounds, the splinter
// bar and the pole's root) goes with the team; the body with its rear wheels swings
// about the king bolt over the front axle. Whatever of the body lies below the front
// wheels' tops stays out of the ring the front wheels sweep about the king bolt.

import { MeshBuilder } from "./meshBuilder.ts";
import { ngon, type MaterialSpec, type Ring, type Vec3 } from "./meshCore.ts";
import { BUS_CATALOG } from "./buses.ts";
import { block, side } from "./vehicleParts.ts";
import { TAU } from "./characterKit.ts";
import { lodBlock, lodSideBox, lodWheel } from "./lodKit.ts";
import { ROLLING_CLIP, ROLLING_SAMPLES, ROLLING_SPEED } from "./rolling.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { animalVehicleDesign, buildAnimalVehicle, TEAM_BEND_DEG, type AnimalVehicleSpec } from "./animalVehicleKit.ts";
import { animalPalette, placeTeam, SPECIES_SPECS, teamLod, teamOf } from "./draftAnimals.ts";
import type { VehicleRig } from "./rig.ts";

// ---------------------------------------------------------------------------
// the palettes

/** What every coach uses; each adds its own `body`, `panel`, `gear` (wheels, running gear) ... */
const BASE: Record<string, MaterialSpec> = {
  tyre: { color: "#2b2c2e", metallic: 0.4, roughness: 0.55 },
  iron: { color: "#262729", roughness: 0.7 },
  leather: { color: "#1d1a18", roughness: 0.65 },
  glass: { color: "#26323c", metallic: 0.2, roughness: 0.15, glass: true },
  shade: { color: "#2a201a", roughness: 0.9 },
  lining: { color: "#d4ad3a", metallic: 0.35, roughness: 0.4 },
  brass: { color: "#e2bd2c", metallic: 0.4, roughness: 0.35 },
  boards: { color: "#8a6a45", roughness: 0.85 },
  cushion: { color: "#5a2a22", roughness: 0.9 },
  seatWood: { color: "#a8763f", roughness: 0.6 },
  spring: { color: "#3c3e41", metallic: 0.2, roughness: 0.6 },
  lampHead: { color: "#f3f1e6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
};

// ---------------------------------------------------------------------------
// shared drawing helpers

/** A round rod along a polyline. */
function rods(m: MeshBuilder, mat: string, pts: readonly Vec3[], r: number, n = 5, ends = true): void {
  for (let i = 0; i + 1 < pts.length; i++) m.rod(mat, pts[i]!, pts[i + 1]!, r, n, ends);
}

/** The ring (x, z) wound as `prism` and `cap` take it. */
function ccw(r: Ring): Ring {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, z0] = r[i]!;
    const [x1, z1] = r[(i + 1) % r.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a < 0 ? r : [...r].reverse();
}

/** A spoked carriage wheel: its radius, sides, the tyre's centre across (z, > 0), width, spokes and the nave's radius. */
interface Wheel {
  r: number;
  sides: number;
  z: number;
  w: number;
  spokes: number;
  hub: number;
}

/** The axle's height: the tyre stands on a flat side. */
const axleY = (w: Wheel): number => w.r * Math.cos(Math.PI / w.sides);

/**
 * One wheel as a rolling part on its axle: the iron tyre, the wooden felloe sunk in
 * it, the spokes, the nave and its axle cap. `s` is the side (-1 left, +1 right).
 */
function carriageWheel(m: MeshBuilder, name: string, x: number, w: Wheel, s: number): void {
  const ay = axleY(w);
  const zc = s * w.z;
  m.spin(name, [x, ay, zc], () => {
    const rot = Math.PI / w.sides;
    const [t0, t1] = [zc - w.w / 2, zc + w.w / 2];
    m.tube("tyre", "z", x, ay, w.r, w.r - 0.025, t0, t1, w.sides, rot);
    m.tube("gear", "z", x, ay, w.r - 0.02, w.r - 0.08, t0 + 0.006, t1 - 0.006, w.sides, rot);
    const nave = ngon(8, w.hub, Math.PI / 8, x, ay);
    m.sweep("gear", "z", nave, zc - 0.08, nave, zc + 0.08);
    const cap = ngon(8, w.hub * 0.55, Math.PI / 8, x, ay);
    const [c0, c1] = s > 0 ? [zc + 0.075, zc + 0.11] : [zc - 0.11, zc - 0.075];
    m.sweep("iron", "z", cap, c0, cap, c1);
    for (let k = 0; k < w.spokes; k++) {
      const a = (TAU * (k + 0.5)) / w.spokes;
      const [c, sn] = [Math.cos(a), Math.sin(a)];
      m.rod("gear", [x + w.hub * 0.8 * c, ay + w.hub * 0.8 * sn, zc], [x + (w.r - 0.07) * c, ay + (w.r - 0.07) * sn, zc], 0.019, 4, false);
    }
  });
}

/** The rear axle and its two rolling wheels, drawn in the body. */
function rearWheels(m: MeshBuilder, x: number, w: Wheel): void {
  m.scope("rear axle", () => {
    m.rod("iron", [x, axleY(w), -w.z], [x, axleY(w), w.z], 0.04, 6);
    carriageWheel(m, "rear-wheel-left", x, w, -1);
    carriageWheel(m, "rear-wheel-right", x, w, 1);
  });
}

/**
 * The coach's rolling clip: both wheel pairs in one clip of one rear revolution, the
 * front wheels turning `rear.r / fore.r` times as far. (The kit's `rolling` lists
 * add a clip each, and a model has one "rolling" clip, so a coach whose wheels differ
 * adds its own here and leaves the kit's list empty.) The ratio is a whole number of
 * quarter turns over one, so the front wheel - 12 spokes on a 16-sided tyre - looks
 * the same where the clip loops.
 */
function rollCoach(m: MeshBuilder, fore: Wheel, rear: Wheel): void {
  const ratio = rear.r / fore.r;
  if (Math.abs(ratio * 4 - Math.round(ratio * 4)) > 1e-6) throw new Error(`rollCoach(): wheel ratio ${ratio} is not a whole number of quarter turns`);
  const duration = (2 * Math.PI * rear.r) / ROLLING_SPEED;
  const times = Array.from({ length: ROLLING_SAMPLES + 1 }, (_, k) => Math.round(((k * duration) / ROLLING_SAMPLES) * 1e6) / 1e6);
  const turn = (f: number): number[] => times.flatMap((_, k) => {
    const a = (-2 * Math.PI * f * k) / ROLLING_SAMPLES;
    return [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
  });
  m.animate({
    name: ROLLING_CLIP,
    times,
    tracks: [
      ...["rear-wheel-left", "rear-wheel-right"].map((node) => ({ node, path: "rotation" as const, values: turn(1) })),
      ...["fore-wheel-left", "fore-wheel-right"].map((node) => ({ node, path: "rotation" as const, values: turn(ratio) })),
    ],
    drive: { drive: "distance", speed: ROLLING_SPEED },
  });
}

/**
 * A coach's distant model, as the kit's `buildAnimalVehicleLod` draws a road vehicle's
 * but with the steered nodes drawn before the body's section: a part naming a parent
 * must follow the parent's other descendants (MeshCore.part), and the kit draws them
 * after `section1`, which throws. Replace with `buildAnimalVehicleLod` once the kit
 * draws them in that order.
 */
function coachLod(s: AnimalVehicleSpec, params?: ParamValues): MeshBuilder {
  const m = new MeshBuilder({ ...animalPalette(), ...s.palette });
  const team = teamOf(params, { pair: s.pair });
  const kp = s.kingpin!;
  const half = (s.track ?? 1.6) / 2;
  const lead = Math.max(...placeTeam(team.species, team.count, s.hitch[0]).map((p) => p.x)) + SPECIES_SPECS[team.species].legs.front;
  m.part("section0", [0, 0, 0], () => teamLod(m, team.species, team.count, s.hitch[0]));
  for (const [name, z] of [["wheel-front-left", -half], ["wheel-front-right", half]] as const) m.part(name, [r4(lead), 0, z], () => {}, "section0");
  m.part("section1", kp, () => s.lod(m));
  m.rig = {
    sections: [{ node: "section0", pivot: [0, 0, 0] }, { node: "section1", pivot: kp }], joints: [], maxBendDeg: TEAM_BEND_DEG,
    steer: { axles: [{ nodes: ["wheel-front-left", "wheel-front-right"], wheelbase: r4(lead - kp[0]) }], maxAngleDeg: 40, track: 2 * half },
  } satisfies VehicleRig;
  return m;
}

const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

/** A fore-carriage: where its axle is, its wheel, its turntable's top and the pole's root (the kit's hitch). */
interface Fore {
  x: number;
  wheel: Wheel;
  table: number;
  hitch: Vec3;
}

/**
 * The fore-carriage, in the team's section: the front axle and its bed, the two
 * rolling wheels, the bolster and the turntable's lower ring, the hounds forward to
 * the splinter bar and the socket of the pole (the kit draws the pole from the hitch).
 */
function foreCarriage(m: MeshBuilder, f: Fore): void {
  const w = f.wheel;
  const ay = axleY(w);
  const [hx, hy] = [f.hitch[0], f.hitch[1]];
  m.scope("front axle", () => {
    m.rod("iron", [f.x, ay, -w.z], [f.x, ay, w.z], 0.035, 6);
    block(m, "gear", f.x - 0.06, f.x + 0.06, ay - 0.02, ay + 0.09, -w.z + 0.09, w.z - 0.09);
    carriageWheel(m, "fore-wheel-left", f.x, w, -1);
    carriageWheel(m, "fore-wheel-right", f.x, w, 1);
  });
  m.scope("turntable", () => {
    block(m, "gear", f.x - 0.07, f.x + 0.07, ay + 0.085, f.table - 0.015, -0.42, 0.42);
    m.prism("iron", ccw(ngon(12, 0.36, 0, f.x, 0)), f.table - 0.02, f.table);
  });
  m.scope("hounds", () => {
    for (const s of [-1, 1]) rods(m, "gear", [[f.x - 0.4, ay + 0.04, s * 0.12], [f.x, ay + 0.05, s * 0.3], [hx - 0.1, hy, s * 0.11]], 0.025, 5);
    // the splinter bar across, its trace hooks, the pole's socket
    m.rod("gear", [hx - 0.28, hy + 0.02, -0.72], [hx - 0.28, hy + 0.02, 0.72], 0.035, 6);
    for (const s of [-1, 1]) m.rod("iron", [hx - 0.28, hy + 0.02, s * 0.6], [hx - 0.18, hy + 0.02, s * 0.6], 0.012, 4);
    block(m, "iron", hx - 0.16, hx + 0.01, hy - 0.045, hy + 0.045, -0.055, 0.055);
  });
}

/** An elliptic spring under a body at x: a leaf over the axle and one under the body, joined at the ends. */
function ellipticSpring(m: MeshBuilder, x: number, z: number, y0: number, y1: number, half = 0.4): void {
  const [z0, z1] = [z - 0.045, z + 0.045];
  block(m, "spring", x - half, x + half, y1 - 0.045, y1 + 0.005, z0, z1);
  block(m, "spring", x - half * 0.85, x + half * 0.85, y1 - 0.075, y1 - 0.045, z0 + 0.005, z1 - 0.005);
  block(m, "spring", x - half, x + half, y0, y0 + 0.045, z0, z1);
  block(m, "spring", x - half * 0.85, x + half * 0.85, y0 + 0.045, y0 + 0.075, z0 + 0.005, z1 - 0.005);
  for (const e of [-1, 1]) block(m, "iron", x + e * half - 0.035, x + e * half + 0.035, y0 - 0.005, y1, z0 - 0.005, z1 + 0.005);
}

/** A coach lamp: a box on a bracket, its lens facing forward. */
function lamp(m: MeshBuilder, x: number, y: number, z: number): void {
  m.scope("lamp", () => {
    block(m, "iron", x - 0.07, x + 0.07, y - 0.1, y + 0.1, z - 0.06, z + 0.06);
    m.prism("iron", ccw(ngon(6, 0.07, 0, x, z)), y + 0.1, y + 0.16);
    block(m, "lampHead", x + 0.065, x + 0.08, y - 0.06, y + 0.06, z - 0.04, z + 0.04);
    block(m, "lampRed", x - 0.08, x - 0.065, y - 0.03, y + 0.03, z - 0.025, z + 0.025);
  });
}

/** A row of lettering blocks on a board facing `s` (z), from x0 to x1 at heights y0..y1, standing out of the face at zf. */
function lettering(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, s: number, zf: number, n: number): void {
  const pitch = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    const a = x0 + k * pitch + pitch * 0.15;
    const tall = k % 3 === 1 ? 0.75 : 1;
    block(m, mat, a, a + pitch * 0.7, y0, y0 + (y1 - y0) * tall, ...side(s, zf - 0.004, zf + 0.004));
  }
}

/** The posts and rails of a railing along a polyline of (x, z) at heights y0 (the posts' feet) to y1 (the top rail). */
function railing(m: MeshBuilder, mat: string, line: ReadonlyArray<readonly [number, number]>, y0: number, ys: readonly number[], r = 0.016, posts = true): void {
  const top = Math.max(...ys);
  if (posts) for (const [x, z] of line) m.rod(mat, [x, y0, z], [x, top + 0.01, z], r * 1.15, 5);
  for (const y of ys) rods(m, mat, line.map(([x, z]) => [x, y, z] as Vec3), r, 5, false);
}

// ---------------------------------------------------------------------------
// the knifeboard omnibus

const KB_REAR: Wheel = { r: 0.72, sides: 20, z: 0.84, w: 0.075, spokes: 14, hub: 0.11 };
const KB_FORE: Wheel = { r: 0.48, sides: 16, z: 0.78, w: 0.07, spokes: 12, hub: 0.095 };
const KB_XR = -1.0;
const KB_XF = 1.0;
const KB = {
  floor: 0.95, waist: 1.52, sill: 1.64, head: 2.0, roof: 2.32,
  rear: -1.95, front: 1.2, half: 0.92, low: 0.7,
};

const KB_PALETTE: Record<string, MaterialSpec> = {
  ...BASE,
  body: { color: "#5e1c18", roughness: 0.45 },
  panel: { color: "#d9c48e", roughness: 0.5 },
  gear: { color: "#a3322a", roughness: 0.6 },
  roof: { color: "#5b5248", roughness: 0.85 },
  advert: { color: "#ebdcae", roughness: 0.6 },
  letterBlue: { color: "#1e3566", roughness: 0.5 },
  letterRed: { color: "#9b2219", roughness: 0.5 },
};

function knifeboardSaloon(m: MeshBuilder): void {
  const k = KB;
  m.scope("saloon", () => {
    m.scope("lower panels", () => {
      // narrow between the rear wheels; the front end cut away over the front wheels
      const prof: Ring = [[k.rear, k.floor], [-0.25, k.floor], [0.35, k.waist], [k.rear, k.waist]];
      m.sweep("body", "z", prof, -k.low, prof, k.low);
      for (const s of [-1, 1]) {
        const z = side(s, k.low - 0.004, k.low + 0.004);
        block(m, "lining", k.rear + 0.1, -0.35, k.floor + 0.08, k.floor + 0.095, ...z);
        block(m, "lining", k.rear + 0.1, 0.15, k.waist - 0.1, k.waist - 0.085, ...z);
        lettering(m, "lining", k.rear + 0.25, -0.35, 1.16, 1.34, s, k.low + 0.002, 7);
      }
    });
    m.scope("waist", () => {
      block(m, "body", k.rear, k.front, k.waist, k.sill, -k.half, k.half);
      for (const s of [-1, 1]) block(m, "lining", k.rear - 0.01, k.front + 0.01, k.sill - 0.05, k.sill - 0.035, ...side(s, k.half - 0.004, k.half + 0.006));
      block(m, "lining", k.front - 0.01, k.front + 0.006, k.sill - 0.05, k.sill - 0.035, -k.half, k.half);
    });
    m.scope("windows", () => {
      const n = 6;
      const [x0, x1] = [k.rear + 0.05, k.front - 0.05];
      const pitch = (x1 - x0) / n;
      block(m, "shade", x0, x1, k.sill - 0.04, k.roof - 0.02, -0.84, 0.84);
      for (const s of [-1, 1]) {
        block(m, "glass", x0, x1, k.sill - 0.01, k.head + 0.01, ...side(s, 0.885, 0.892));
        for (let i = 0; i <= n; i++) {
          const x = x0 + i * pitch;
          const [a, b] = i === 0 ? [k.rear, x + 0.05] : i === n ? [x - 0.05, k.front] : [x - 0.04, x + 0.04];
          block(m, "body", a, b, k.sill, k.head, ...side(s, 0.86, k.half));
        }
      }
      // the front end closed, the rear end round the door
      block(m, "body", k.front - 0.05, k.front, k.sill, k.head, -0.86, 0.86);
      for (const s of [-1, 1]) block(m, "body", k.rear, k.rear + 0.05, k.sill, k.head, ...side(s, 0.3, 0.86));
    });
    m.scope("advert band", () => {
      block(m, "body", k.rear, k.front, k.head, k.roof, -k.half, k.half);
      for (const s of [-1, 1]) {
        block(m, "advert", k.rear + 0.2, k.front - 0.25, k.head + 0.04, k.roof - 0.04, ...side(s, k.half - 0.005, k.half + 0.012));
        lettering(m, "letterBlue", k.rear + 0.35, k.front - 0.4, k.head + 0.1, k.roof - 0.1, s, k.half + 0.012, 10);
      }
    });
    m.scope("rear end", () => {
      // the door: open, the dark saloon beyond, a lamp over it
      block(m, "shade", k.rear - 0.012, k.rear + 0.01, k.floor + 0.02, k.head, -0.3, 0.3);
      block(m, "body", k.rear - 0.01, k.rear + 0.02, k.head, k.roof, -0.32, 0.32);
      block(m, "lining", k.rear - 0.018, k.rear - 0.008, k.head + 0.05, k.roof - 0.05, -0.2, 0.2);
      for (const s of [-1, 1]) block(m, "body", k.rear - 0.03, k.rear + 0.01, k.floor + 0.02, k.head, ...side(s, 0.3, 0.36));
      // the saloon's lower rear corners round the door
      for (const s of [-1, 1]) block(m, "body", k.rear - 0.005, k.rear + 0.06, k.floor, k.waist, ...side(s, 0.36, k.low));
    });
    m.scope("roof", () => {
      const r: Ring = [[-0.96, k.roof - 0.005], [0.96, k.roof - 0.005], [0.96, 2.36], [0.55, 2.41], [-0.55, 2.41], [-0.96, 2.36]];
      m.sweep("roof", "x", r, k.rear - 0.05, r, k.front + 0.05);
    });
  });
}

/** The knifeboard: the two outward-facing benches on the roof, back to back, the decency boards and the footboards. */
function knifeboardTop(m: MeshBuilder): void {
  m.scope("knifeboard", () => {
    const [x0, x1] = [-1.75, 0.85];
    block(m, "boards", x0, x1, 2.39, 3.02, -0.025, 0.025);
    for (const s of [-1, 1]) {
      block(m, "advert", x0 + 0.1, x1 - 0.1, 2.88, 3.0, ...side(s, 0.02, 0.034));
      block(m, "seatWood", x0, x1, 2.78, 2.82, ...side(s, 0.03, 0.4));
      for (const x of [x0 + 0.1, -0.45, x1 - 0.1]) block(m, "iron", x - 0.025, x + 0.025, 2.39, 2.78, ...side(s, 0.3, 0.34));
      // the footboard in the gutter between the bench and the decency board
      block(m, "boards", -1.9, 0.95, 2.355, 2.44, ...side(s, 0.58, 0.9));
    }
  });
  m.scope("decency boards", () => {
    for (const s of [-1, 1]) {
      block(m, "body", -1.92, 0.98, 2.34, 2.9, ...side(s, 0.925, 0.95));
      block(m, "advert", -1.82, 0.88, 2.42, 2.84, ...side(s, 0.948, 0.958));
      lettering(m, "letterRed", -1.7, 0.75, 2.66, 2.8, s, 0.958, 12);
      lettering(m, "letterBlue", -1.5, 0.55, 2.47, 2.6, s, 0.958, 12);
      for (const x of [-1.92, 0.98]) m.rod("iron", [x, 2.9, s * 0.94], [x, 3.05, s * 0.94], 0.016, 5);
      m.rod("iron", [-1.92, 3.05, s * 0.94], [0.98, 3.05, s * 0.94], 0.014, 5);
    }
  });
}

/** The rear platform and the curved ladder up the nearside (left) rear corner to the roof. */
function knifeboardPlatform(m: MeshBuilder): void {
  const k = KB;
  m.scope("platform", () => {
    block(m, "boards", -2.45, k.rear + 0.02, k.floor - 0.06, k.floor + 0.015, -k.low + 0.01, k.low - 0.01);
    block(m, "body", -2.47, -2.43, k.floor - 0.12, k.floor + 0.02, -k.low, k.low);
    for (const s of [-1, 1]) block(m, "iron", -2.42, k.rear + 0.05, k.floor - 0.12, k.floor - 0.06, ...side(s, 0.45, 0.5));
    // the step on the nearside, hung from the platform
    block(m, "iron", -2.62, -2.3, 0.48, 0.52, -0.62, -0.08);
    for (const z of [-0.55, -0.15]) m.rod("iron", [-2.45, 0.5, z], [-2.42, k.floor - 0.08, z], 0.015, 4);
    // the conductor's grab pole on the offside and the rail to the roof
    m.rod("brass", [-2.4, k.floor + 0.02, 0.64], [-2.4, 2.33, 0.64], 0.02, 6);
    m.rod("brass", [-2.4, 2.33, 0.64], [k.rear - 0.04, 2.33, 0.64], 0.016, 5);
  });
  m.scope("ladder", () => {
    // from the platform's rear edge up and over to the roof's rear edge
    const n = 7;
    const at = (t: number): [number, number] => [-2.4 + 0.4 * t * t, k.floor + 0.2 + (2.36 - k.floor - 0.2) * t];
    const [z0, z1] = [-0.74, -0.38];
    for (let i = 0; i <= n; i++) {
      const [x, y] = at(i / n);
      block(m, "iron", x - 0.075, x + 0.075, y - 0.025, y, z0 + 0.02, z1 - 0.02);
    }
    const line = (z: number, dy: number): Vec3[] => Array.from({ length: n + 1 }, (_, i) => { const [x, y] = at(i / n); return [x, y + dy, z]; });
    rods(m, "iron", line(z0, -0.03), 0.018, 4);
    rods(m, "iron", line(z1, -0.03), 0.018, 4);
    rods(m, "brass", line(z0 - 0.04, 0.85), 0.015, 5);
    m.rod("brass", [-2.4, k.floor + 0.02, z0 - 0.04], [-2.4, k.floor + 0.2 + 0.85, z0 - 0.04], 0.015, 5);
  });
}

/** The driver's box seat over the front, its footboard and dash, the lamps. */
function knifeboardBox(m: MeshBuilder): void {
  const k = KB;
  m.scope("box seat", () => {
    block(m, "body", 0.95, 1.55, 2.38, 2.56, -0.7, 0.7);
    block(m, "cushion", 1.02, 1.5, 2.56, 2.63, -0.66, 0.66);
    railing(m, "iron", [[0.98, -0.68], [0.98, 0.68]], 2.56, [2.9], 0.016);
    for (const s of [-1, 1]) railing(m, "iron", [[0.98, s * 0.68], [1.45, s * 0.68]], 2.56, [2.78], 0.014);
    // the footboard sloping forward, the dash, the irons back to the saloon front
    m.slab("boards", [[1.55, 2.3, -0.68], [1.95, 2.06, -0.68], [1.95, 2.06, 0.68], [1.55, 2.3, 0.68]], [0, -0.04, 0]);
    block(m, "body", 1.93, 1.97, 2.04, 2.42, -0.62, 0.62);
    block(m, "lining", 1.968, 1.975, 2.36, 2.38, -0.56, 0.56);
    for (const s of [-1, 1]) {
      m.rod("iron", [1.92, 2.04, s * 0.5], [k.front + 0.02, 1.7, s * 0.5], 0.02, 5);
      m.rod("iron", [1.55, 2.27, s * 0.62], [k.front + 0.02, 2.05, s * 0.62], 0.018, 5);
    }
  });
  for (const s of [-1, 1]) lamp(m, k.front + 0.08, 1.95, s * 0.8);
}

/** The knifeboard's running gear in the body: the rear axle on its springs, the bolster down to the turntable. */
function knifeboardGear(m: MeshBuilder): void {
  m.scope("running gear", () => {
    rearWheels(m, KB_XR, KB_REAR);
    for (const s of [-1, 1]) ellipticSpring(m, KB_XR, s * 0.55, axleY(KB_REAR) + 0.03, KB.floor);
    block(m, "body", KB_XF - 0.14, KB_XF + 0.14, 1.13, KB.waist + 0.01, -0.36, 0.36);
    m.prism("iron", ccw(ngon(12, 0.34, Math.PI / 12, KB_XF, 0)), 1.115, 1.13);
  });
}

const KNIFEBOARD: AnimalVehicleSpec = {
  id: "veh-animal-bus-knifeboard-omnibus",
  title: "Knifeboard Omnibus",
  kind: "road",
  catalog: BUS_CATALOG,
  palette: KB_PALETTE,
  weight: 1.4,
  maxspeed: 15,
  pair: true,
  hitch: [KB_XF + 0.85, 0.72, 0],
  reins: [1.72, 2.82, 0],
  kingpin: [KB_XF, 1.1, 0],
  track: 2 * KB_FORE.z,
  fore: (m) => foreCarriage(m, { x: KB_XF, wheel: KB_FORE, table: 1.1, hitch: [KB_XF + 0.85, 0.72, 0] }),
  body: (m) => {
    knifeboardSaloon(m);
    knifeboardTop(m);
    knifeboardPlatform(m);
    knifeboardBox(m);
    knifeboardGear(m);
    rollCoach(m, KB_FORE, KB_REAR);
  },
  rolling: [],
  lod: (m) => {
    const k = KB;
    lodSideBox(m, "body", [[k.rear, k.floor], [-0.25, k.floor], [0.35, k.waist], [k.rear, k.waist]], -k.low, k.low);
    lodBlock(m, k.rear, k.front, k.waist, k.roof, -k.half, k.half, { side: "body", top: "roof" });
    lodSideBox(m, "advert", [[-1.92, k.roof], [0.98, k.roof], [0.98, 2.9], [-1.92, 2.9]], -0.95, 0.95, false);
    lodBlock(m, -1.75, 0.85, k.roof, 3.0, -0.03, 0.03, { side: "boards" });
    lodSideBox(m, "body", [[0.95, 2.0], [1.95, 2.0], [1.95, 2.62], [0.95, 2.62]], -0.7, 0.7);
    lodSideBox(m, "boards", [[-2.45, 0.85], [k.rear, 0.85], [k.rear, 0.97], [-2.45, 0.97]], -k.low, k.low);
    for (const s of [-1, 1]) {
      lodWheel(m, "gear", KB_XR, KB_REAR.r, ...side(s, KB_REAR.z - 0.04, KB_REAR.z + 0.04), 8);
      lodWheel(m, "gear", KB_XF, KB_FORE.r, ...side(s, KB_FORE.z - 0.04, KB_FORE.z + 0.04), 8);
    }
  },
  references: "animal-bus-knifeboard-omnibus",
};

export const animalBusKnifeboardOmnibus = (p?: ParamValues) => buildAnimalVehicle(KNIFEBOARD, p);
export const animalBusKnifeboardOmnibusLod = (p?: ParamValues) => coachLod(KNIFEBOARD, p);

// ---------------------------------------------------------------------------
// the Concord stagecoach

const SC_REAR: Wheel = { r: 0.775, sides: 20, z: 0.8, w: 0.065, spokes: 14, hub: 0.12 };
const SC_FORE: Wheel = { r: 0.62, sides: 16, z: 0.8, w: 0.06, spokes: 12, hub: 0.1 };
const SC_XR = -1.05;
const SC_XF = 1.45;
const SC_HALF = 0.68;
/** The body's side: the egg, its bottom swung low between the braces, its ends leaning in toward the roof. */
const SC_EGG: Ring = [
  [-0.55, 0.98], [0.55, 0.98], [0.92, 1.07], [1.16, 1.28], [1.22, 1.55], [1.1, 2.25], [1.0, 2.32],
  [-1.0, 2.32], [-1.1, 2.25], [-1.22, 1.55], [-1.16, 1.28], [-0.92, 1.07],
];

const SC_PALETTE: Record<string, MaterialSpec> = {
  ...BASE,
  body: { color: "#b3221b", roughness: 0.4 },
  panel: { color: "#c8281f", roughness: 0.45 },
  gear: { color: "#e0b53a", roughness: 0.55 },
  roof: { color: "#2b2826", roughness: 0.8 },
  trunk: { color: "#7a4a2a", roughness: 0.8 },
  canvas: { color: "#cfc3a4", roughness: 0.95 },
};

function stagecoachBody(m: MeshBuilder): void {
  m.scope("body", () => {
    m.sweep("body", "z", SC_EGG, -SC_HALF, SC_EGG, SC_HALF);
    const r: Ring = [[-0.72, 2.315], [0.72, 2.315], [0.72, 2.36], [0.4, 2.4], [-0.4, 2.4], [-0.72, 2.36]];
    m.sweep("roof", "x", r, -1.04, r, 1.04);
    for (const s of [-1, 1]) {
      const zf = SC_HALF;
      m.scope(s > 0 ? "right side" : "left side", () => {
        // the door with its window, the quarter windows, the belt rail and the lining
        block(m, "panel", -0.36, 0.36, 1.08, 2.18, ...side(s, zf - 0.005, zf + 0.012));
        block(m, "glass", -0.26, 0.26, 1.66, 2.08, ...side(s, zf + 0.01, zf + 0.016));
        block(m, "lining", -0.31, 0.31, 1.18, 1.2, ...side(s, zf + 0.01, zf + 0.016));
        block(m, "lining", -0.31, 0.31, 1.58, 1.6, ...side(s, zf + 0.01, zf + 0.016));
        for (const x of [-0.31, 0.29]) block(m, "lining", x, x + 0.02, 1.2, 1.58, ...side(s, zf + 0.01, zf + 0.016));
        block(m, "brass", 0.22, 0.3, 1.5, 1.53, ...side(s, zf + 0.012, zf + 0.05));
        for (const e of [-1, 1]) {
          const [a, b] = e > 0 ? [0.5, 0.95] : [-0.95, -0.5];
          block(m, "glass", a, b, 1.68, 2.08, ...side(s, zf - 0.004, zf + 0.004));
          block(m, "lining", a + 0.02, b - 0.02, 1.22, 1.5, ...side(s, zf - 0.003, zf + 0.003));
          block(m, "panel", a + 0.04, b - 0.04, 1.25, 1.47, ...side(s, zf - 0.002, zf + 0.006));
          // the leather curtain rolled up over the window
          m.rod("leather", [a + 0.03, 2.13, s * (zf + 0.03)], [b - 0.03, 2.13, s * (zf + 0.03)], 0.03, 6);
        }
        block(m, "lining", -1.17, 1.17, 1.6, 1.64, ...side(s, zf - 0.003, zf + 0.006));
        // the company's lettering under the roof
        lettering(m, "lining", -0.85, 0.85, 2.18, 2.27, s, zf + 0.003, 16);
      });
    }
  });
}

/** The roof railing round the luggage, the roof seat at the front, a trunk and a mail sack. */
function stagecoachRoof(m: MeshBuilder): void {
  m.scope("roof railing", () => {
    const [x0, x1, z] = [-0.95, 0.95, SC_HALF - 0.04];
    railing(m, "iron", [[x0, -z], [x1, -z], [x1, z], [x0, z], [x0, -z]], 2.36, [2.6], 0.014);
    for (const s of [-1, 1]) for (const x of [-0.32, 0.32]) m.rod("iron", [x, 2.38, s * z], [x, 2.61, s * z], 0.014, 5);
  });
  m.scope("luggage", () => {
    block(m, "cushion", 0.45, 0.9, 2.4, 2.5, -0.6, 0.6);
    block(m, "cushion", 0.42, 0.5, 2.5, 2.72, -0.6, 0.6);
    block(m, "trunk", -0.85, -0.3, 2.4, 2.72, -0.55, 0.15);
    for (const x of [-0.75, -0.4]) block(m, "iron", x - 0.015, x + 0.015, 2.395, 2.725, -0.555, 0.155);
    const sack = ccw(ngon(8, 0.2, 0, -0.1, 0.35));
    m.loft("canvas", sack, 2.39, ccw(ngon(8, 0.13, 0, -0.08, 0.35)), 2.78);
  });
}

/** The boots: the front one under the driver, leather-covered, his seat on it and the footboard; the rear one on its platform. */
function stagecoachBoots(m: MeshBuilder): void {
  m.scope("front boot", () => {
    const prof: Ring = [[1.12, 1.35], [1.62, 1.42], [1.8, 2.0], [1.14, 2.06]];
    m.sweep("leather", "z", prof, -0.62, prof, 0.62);
    block(m, "cushion", 1.16, 1.68, 2.04, 2.17, -0.64, 0.64);
    block(m, "cushion", 1.04, 1.14, 2.17, 2.48, -0.64, 0.64);
    railing(m, "iron", [[1.05, -0.68], [1.62, -0.68]], 2.12, [2.38], 0.014);
    railing(m, "iron", [[1.05, 0.68], [1.62, 0.68]], 2.12, [2.38], 0.014);
    // the footboard on its irons, the driver's dash
    m.slab("boards", [[1.78, 1.98, -0.66], [2.18, 1.74, -0.66], [2.18, 1.74, 0.66], [1.78, 1.98, 0.66]], [0, -0.04, 0]);
    block(m, "body", 2.16, 2.2, 1.72, 1.98, -0.62, 0.62);
    for (const s of [-1, 1]) m.rod("iron", [2.14, 1.72, s * 0.5], [1.55, 1.42, s * 0.5], 0.02, 5);
    for (const s of [-1, 1]) lamp(m, 1.42, 1.95, s * 0.72);
  });
  m.scope("rear boot", () => {
    block(m, "gear", -1.98, -1.1, 1.2, 1.26, -0.62, 0.62);
    const prof: Ring = [[-1.12, 1.255], [-1.96, 1.255], [-1.96, 1.42], [-1.22, 2.12]];
    m.sweep("leather", "z", prof, -0.6, prof, 0.6);
    for (const s of [-1, 1]) {
      m.rod("iron", [-1.95, 1.22, s * 0.58], [-1.2, 2.0, s * 0.58], 0.02, 5);
      for (const x of [-1.7, -1.4]) m.rod("leather", [x, 1.24, s * 0.61], [x + 0.18, 1.62 + (x + 1.7) * 0.6, s * 0.61], 0.018, 4);
    }
  });
}

/** The running gear: the axle beds, the perch, the iron jacks and the leather thoroughbraces the body hangs on. */
function stagecoachGear(m: MeshBuilder): void {
  m.scope("running gear", () => {
    const ayR = axleY(SC_REAR);
    rearWheels(m, SC_XR, SC_REAR);
    block(m, "gear", SC_XR - 0.07, SC_XR + 0.07, ayR + 0.02, ayR + 0.15, -0.68, 0.68);
    // the front bolster on the turntable, the perch back to the rear bed, its braces
    block(m, "gear", SC_XF - 0.1, SC_XF + 0.1, 0.835, 0.95, -0.5, 0.5);
    m.prism("iron", ccw(ngon(12, 0.34, Math.PI / 12, SC_XF, 0)), 0.82, 0.835);
    m.rod("gear", [SC_XR, ayR + 0.1, 0], [SC_XF, 0.9, 0], 0.05, 6);
    for (const s of [-1, 1]) m.rod("gear", [SC_XR, ayR + 0.1, s * 0.6], [0.0, 0.88, 0], 0.03, 5);
    m.scope("thoroughbraces", () => {
      for (const s of [-1, 1]) {
        const z = s * 0.52;
        // the jacks: iron standards on the front bolster and the rear bed
        rods(m, "iron", [[SC_XF + 0.02, 0.94, z], [SC_XF + 0.12, 1.22, z]], 0.03, 6);
        rods(m, "iron", [[SC_XR - 0.02, ayR + 0.14, z], [SC_XR - 0.4, 1.22, z]], 0.03, 6);
        m.rod("iron", [SC_XF + 0.12, 1.22, z - 0.06], [SC_XF + 0.12, 1.22, z + 0.06], 0.035, 6);
        m.rod("iron", [SC_XR - 0.4, 1.22, z - 0.06], [SC_XR - 0.4, 1.22, z + 0.06], 0.035, 6);
        // the braces: several layers of leather, sagging under the body
        const line: Vec3[] = [[SC_XF + 0.12, 1.2, z], [0.9, 1.02, z], [0.5, 0.94, z], [-0.5, 0.94, z], [-0.95, 1.03, z], [SC_XR - 0.4, 1.2, z]];
        rods(m, "leather", line, 0.04, 6);
        rods(m, "leather", line.map(([x, y]) => [x, y - 0.05, z] as Vec3), 0.03, 4);
      }
    });
  });
}

const STAGECOACH: AnimalVehicleSpec = {
  id: "veh-animal-bus-stagecoach",
  title: "Concord Stagecoach",
  kind: "road",
  catalog: BUS_CATALOG,
  palette: SC_PALETTE,
  weight: 1.1,
  maxspeed: 20,
  pair: true,
  hitch: [SC_XF + 0.85, 0.74, 0],
  reins: [1.95, 2.55, 0],
  kingpin: [SC_XF, 0.82, 0],
  track: 2 * SC_FORE.z,
  fore: (m) => foreCarriage(m, { x: SC_XF, wheel: SC_FORE, table: 0.82, hitch: [SC_XF + 0.85, 0.74, 0] }),
  body: (m) => {
    stagecoachBody(m);
    stagecoachRoof(m);
    stagecoachBoots(m);
    stagecoachGear(m);
    rollCoach(m, SC_FORE, SC_REAR);
  },
  rolling: [],
  lod: (m) => {
    lodSideBox(m, "body", [[-1.18, 1.0], [1.18, 1.0], [1.05, 2.32], [-1.05, 2.32]], -SC_HALF, SC_HALF);
    lodBlock(m, -1.05, 1.05, 2.32, 2.4, -0.72, 0.72, { side: "roof" });
    lodSideBox(m, "leather", [[-1.96, 1.2], [-1.15, 1.2], [-1.15, 2.1], [-1.96, 1.42]], -0.6, 0.6);
    lodSideBox(m, "leather", [[1.12, 1.35], [1.8, 1.42], [1.8, 2.0], [1.12, 2.06]], -0.62, 0.62);
    lodSideBox(m, "cushion", [[-0.9, 2.32], [0.9, 2.32], [0.9, 2.6], [-0.9, 2.6]], -0.62, 0.62);
    lodSideBox(m, "gear", [[SC_XR, 0.8], [SC_XF, 0.8], [SC_XF, 0.95], [SC_XR, 0.95]], -0.5, 0.5);
    for (const s of [-1, 1]) {
      lodWheel(m, "gear", SC_XR, SC_REAR.r, ...side(s, SC_REAR.z - 0.04, SC_REAR.z + 0.04), 8);
      lodWheel(m, "gear", SC_XF, SC_FORE.r, ...side(s, SC_FORE.z - 0.04, SC_FORE.z + 0.04), 8);
    }
  },
  references: "animal-bus-stagecoach",
};

export const animalBusStagecoach = (p?: ParamValues) => buildAnimalVehicle(STAGECOACH, p);
export const animalBusStagecoachLod = (p?: ParamValues) => coachLod(STAGECOACH, p);

// ---------------------------------------------------------------------------
// the Paris omnibus

const PO_REAR: Wheel = { r: 0.76, sides: 20, z: 0.9, w: 0.075, spokes: 16, hub: 0.12 };
const PO_FORE: Wheel = { r: 0.76 / 1.5, sides: 16, z: 0.82, w: 0.07, spokes: 12, hub: 0.095 };
const PO_XR = -0.55;
const PO_XF = 2.0;
const PO = {
  floor: 0.92, waist: 1.58, sill: 1.7, head: 2.2, roof: 2.48, deck: 2.54,
  rear: -1.75, front: 1.6, half: 0.98, low: 0.8, plat: -2.75, platY: 0.74,
};
/** The spiral stair's axis (x, z) at the platform's rear left corner, its radius and its treads. */
const STAIR = { x: -2.3, z: -0.46, r: 0.42, n: 10 };

const PO_PALETTE: Record<string, MaterialSpec> = {
  ...BASE,
  body: { color: "#4a2c1c", roughness: 0.45 },
  panel: { color: "#c99f3e", roughness: 0.5 },
  gear: { color: "#d8cdb2", roughness: 0.6 },
  roof: { color: "#6b6156", roughness: 0.85 },
  advert: { color: "#ece2c4", roughness: 0.6 },
  letterBlue: { color: "#2a2a30", roughness: 0.5 },
};

function parisSaloon(m: MeshBuilder): void {
  const k = PO;
  m.scope("saloon", () => {
    m.scope("lower panels", () => {
      const prof: Ring = [[k.rear, k.floor], [0.95, k.floor], [1.45, k.waist], [k.rear, k.waist]];
      m.sweep("body", "z", prof, -k.low, prof, k.low);
      for (const s of [-1, 1]) {
        block(m, "panel", k.rear + 0.12, 0.8, k.floor + 0.12, k.waist - 0.12, ...side(s, k.low - 0.004, k.low + 0.006));
        lettering(m, "letterBlue", k.rear + 0.4, 0.4, 1.2, 1.32, s, k.low + 0.006, 9);
      }
    });
    m.scope("waist", () => {
      // the body flares out over the rear wheels
      const r: Ring = [[-k.low, k.waist], [k.low, k.waist], [k.half, k.sill], [-k.half, k.sill]];
      m.sweep("body", "x", r, k.rear, r, k.front);
      for (const s of [-1, 1]) block(m, "panel", k.rear + 0.02, k.front - 0.02, k.sill - 0.04, k.sill - 0.02, ...side(s, k.half - 0.035, k.half + 0.004));
    });
    m.scope("windows", () => {
      const n = 6;
      const [x0, x1] = [k.rear + 0.05, k.front - 0.05];
      const pitch = (x1 - x0) / n;
      block(m, "shade", x0, x1, k.sill - 0.04, k.roof - 0.02, -0.9, 0.9);
      for (const s of [-1, 1]) {
        block(m, "glass", x0, x1, k.sill - 0.01, k.head + 0.01, ...side(s, 0.945, 0.952));
        for (let i = 0; i <= n; i++) {
          const x = x0 + i * pitch;
          const [a, b] = i === 0 ? [k.rear, x + 0.05] : i === n ? [x - 0.05, k.front] : [x - 0.035, x + 0.035];
          block(m, "body", a, b, k.sill, k.head, ...side(s, 0.92, k.half));
        }
      }
      block(m, "body", k.front - 0.05, k.front, k.sill, k.head, -0.92, 0.92);
      for (const s of [-1, 1]) block(m, "body", k.rear, k.rear + 0.05, k.sill, k.head, ...side(s, 0.32, 0.92));
    });
    m.scope("letterboard", () => {
      block(m, "body", k.rear, k.front, k.head, k.roof, -k.half, k.half);
      for (const s of [-1, 1]) {
        block(m, "advert", k.rear + 0.15, k.front - 0.15, k.head + 0.05, k.roof - 0.05, ...side(s, k.half - 0.005, k.half + 0.012));
        lettering(m, "letterBlue", k.rear + 0.4, k.front - 0.4, k.head + 0.1, k.roof - 0.1, s, k.half + 0.012, 14);
      }
    });
    m.scope("rear end", () => {
      block(m, "shade", k.rear - 0.012, k.rear + 0.01, k.floor + 0.02, k.head, -0.32, 0.32);
      block(m, "body", k.rear - 0.01, k.rear + 0.02, k.head, k.roof, -0.34, 0.34);
      for (const s of [-1, 1]) block(m, "body", k.rear - 0.03, k.rear + 0.01, k.floor + 0.02, k.head, ...side(s, 0.32, 0.38));
      for (const s of [-1, 1]) block(m, "body", k.rear - 0.005, k.rear + 0.06, k.floor, k.waist, ...side(s, 0.38, k.low));
      // the fare board over the door
      block(m, "advert", k.rear - 0.02, k.rear - 0.008, k.head + 0.06, k.roof - 0.06, -0.26, 0.26);
    });
  });
}

/** The imperiale: the deck on the saloon roof and over the platform's right half, the back-to-back benches, the railing and route boards. */
function parisImperiale(m: MeshBuilder): void {
  const k = PO;
  m.scope("imperiale", () => {
    const r: Ring = [[-1.0, k.roof - 0.005], [1.0, k.roof - 0.005], [1.0, k.deck], [-1.0, k.deck]];
    m.sweep("roof", "x", r, k.rear - 0.05, r, k.front + 0.05);
    // over the platform beside the stair, on two stanchions
    block(m, "roof", k.plat + 0.02, k.rear - 0.04, k.roof, k.deck - 0.005, 0.02, 1.0);
    for (const z of [0.08, 0.94]) m.rod("iron", [k.plat + 0.08, k.platY + 0.04, z], [k.plat + 0.08, k.roof, z], 0.022, 6);
    m.scope("benches", () => {
      const [x0, x1] = [-1.55, 1.25];
      block(m, "boards", x0, x1, k.deck - 0.01, 3.32, -0.025, 0.025);
      for (const s of [-1, 1]) {
        block(m, "seatWood", x0, x1, 2.93, 2.97, ...side(s, 0.03, 0.4));
        for (const x of [x0 + 0.1, -0.15, x1 - 0.1]) block(m, "iron", x - 0.025, x + 0.025, k.deck - 0.01, 2.93, ...side(s, 0.3, 0.34));
        block(m, "boards", k.rear, k.front, k.deck - 0.01, k.deck + 0.05, ...side(s, 0.6, 0.94));
      }
    });
    m.scope("railing", () => {
      const z = 0.97;
      const xs = [k.rear + 0.05, -1.0, -0.3, 0.4, 1.1, k.front];
      for (const s of [-1, 1]) railing(m, "iron", xs.map((x) => [x, s * z] as const), k.deck, [2.95, 3.38], 0.015);
      railing(m, "iron", [[k.front, -z], [k.front, 0], [k.front, z]], k.deck, [2.95, 3.38], 0.015, false);
      m.rod("iron", [k.front, k.deck, 0], [k.front, 3.39, 0], 0.017, 5);
      // over the platform, round to the stair's head
      railing(m, "iron", [[k.rear + 0.05, z], [k.plat + 0.08, z], [k.plat + 0.08, 0.08], [k.plat + 0.5, 0.08]], k.deck, [2.95, 3.38], 0.015);
      // the route boards along the top rail, the oval name board at the rear
      for (const s of [-1, 1]) {
        block(m, "body", -1.3, 1.0, 3.39, 3.62, ...side(s, z - 0.012, z + 0.012));
        block(m, "advert", -1.25, 0.95, 3.42, 3.59, ...side(s, z + 0.01, z + 0.018));
        lettering(m, "letterBlue", -1.1, 0.8, 3.46, 3.55, s, z + 0.02, 12);
        for (const x of [-1.0, 0.7]) m.rod("iron", [x, 3.38, s * z], [x, 3.4, s * z], 0.012, 4);
      }
      const oval = ngon(10, 0.2, 0, -0.5, 3.6).map(([zz, y]) => [k.plat + 0.06, (y - 3.6) * 0.6 + 3.6, zz] as Vec3);
      m.slab("advert", oval, [0.02, 0, 0]);
      m.rod("iron", [k.plat + 0.08, 3.38, -0.5], [k.plat + 0.08, 3.5, -0.5], 0.012, 4);
    });
  });
}

/** The rear platform, its step and rails, and the spiral stair round the left rear corner up to the imperiale. */
function parisPlatform(m: MeshBuilder): void {
  const k = PO;
  m.scope("platform", () => {
    block(m, "boards", k.plat, k.rear + 0.02, k.platY - 0.05, k.platY + 0.03, -0.9, 0.9);
    block(m, "body", k.plat - 0.02, k.plat + 0.03, k.platY - 0.12, k.platY + 0.32, -0.91, 0.91);
    for (const s of [-1, 1]) block(m, "iron", k.plat + 0.05, k.rear + 0.05, k.platY - 0.11, k.platY - 0.05, ...side(s, 0.5, 0.56));
    block(m, "body", k.rear - 0.02, k.rear + 0.03, k.platY - 0.12, k.floor + 0.01, -k.low, k.low);
    // the step under the platform's open right side and the rail along its left
    block(m, "iron", -2.6, -1.95, 0.38, 0.42, 0.7, 1.0);
    for (const x of [-2.5, -2.05]) m.rod("iron", [x, 0.4, 0.85], [x, k.platY - 0.1, 0.8], 0.016, 4);
    m.rod("brass", [k.rear - 0.04, k.platY + 0.03, 0.85], [k.rear - 0.04, k.head, 0.85], 0.02, 6);
  });
  m.scope("spiral stair", () => {
    const { x, z, r, n } = STAIR;
    const a0 = Math.PI / 2;
    const a1 = 2 * Math.PI;
    const rise = (k.deck - k.platY) / (n + 1);
    const ang = (i: number): number => a0 + ((a1 - a0) * i) / (n - 1);
    const at = (a: number, rr: number, y: number): Vec3 => [x + rr * Math.cos(a), y, z + rr * Math.sin(a)];
    const half = (a1 - a0) / (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const a = ang(i);
      const y = k.platY + rise * (i + 1);
      const ring = ccw([0, 1, 2, 3].map((j) => {
        const aa = a + (j < 2 ? -half : half) * 1.05;
        const rr = j === 0 || j === 3 ? 0.06 : r;
        const p = at(aa, rr, 0);
        return [p[0], p[2]] as [number, number];
      }));
      m.prism("iron", ring, y - 0.03, y);
    }
    // the newel and the outer string, the handrail over it
    m.rod("iron", [x, k.platY + 0.03, z], [x, k.deck + 0.85, z], 0.035, 6);
    const helix = (rr: number, dy: number): Vec3[] => Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * (i - 0.5)) / (n - 1);
      return at(a, rr, k.platY + rise * (i + 0.5) + dy);
    });
    rods(m, "iron", helix(r + 0.01, -0.05), 0.02, 4);
    rods(m, "iron", helix(r + 0.03, 0.85), 0.015, 5);
    for (let i = 0; i <= n; i += 2) {
      const [p, q] = [helix(r + 0.02, -0.05)[i]!, helix(r + 0.03, 0.85)[i]!];
      m.rod("iron", p, q, 0.01, 4);
    }
  });
}

/** The driver's seat high at the front on its box, the footboard and dash, the lamps. */
function parisBox(m: MeshBuilder): void {
  const k = PO;
  m.scope("driver's box", () => {
    block(m, "body", k.front - 0.02, 2.2, 2.05, k.deck + 0.02, -0.82, 0.82);
    block(m, "cushion", k.front + 0.05, 2.15, k.deck + 0.02, k.deck + 0.1, -0.55, 0.55);
    block(m, "cushion", k.front + 0.02, k.front + 0.1, k.deck + 0.1, k.deck + 0.42, -0.55, 0.55);
    m.slab("boards", [[2.2, 2.4, -0.7], [2.55, 2.16, -0.7], [2.55, 2.16, 0.7], [2.2, 2.4, 0.7]], [0, -0.04, 0]);
    block(m, "body", 2.53, 2.57, 2.14, 2.5, -0.62, 0.62);
    for (const s of [-1, 1]) m.rod("iron", [2.52, 2.14, s * 0.5], [2.15, 2.07, s * 0.5], 0.02, 5);
    // the column down to the turntable
    block(m, "body", PO_XF - 0.15, PO_XF + 0.15, 1.04, 2.06, -0.42, 0.42);
    for (const s of [-1, 1]) block(m, "panel", PO_XF - 0.11, PO_XF + 0.11, 1.15, 1.95, ...side(s, 0.418, 0.426));
    m.prism("iron", ccw(ngon(12, 0.34, Math.PI / 12, PO_XF, 0)), 1.025, 1.04);
    for (const s of [-1, 1]) lamp(m, 2.28, 2.2, s * 0.86);
  });
}

function parisGear(m: MeshBuilder): void {
  m.scope("running gear", () => {
    rearWheels(m, PO_XR, PO_REAR);
    for (const s of [-1, 1]) ellipticSpring(m, PO_XR, s * 0.6, axleY(PO_REAR) + 0.03, PO.floor, 0.45);
    // the futchells: the iron frame from the saloon's floor forward to the box
    for (const s of [-1, 1]) rods(m, "iron", [[0.9, PO.floor + 0.02, s * 0.4], [PO_XF - 0.15, 1.1, s * 0.4]], 0.025, 5);
  });
}

const PARIS: AnimalVehicleSpec = {
  id: "veh-animal-bus-paris-omnibus",
  title: "Paris Omnibus",
  kind: "road",
  catalog: BUS_CATALOG,
  palette: PO_PALETTE,
  weight: 2.6,
  maxspeed: 15,
  pair: true,
  hitch: [PO_XF + 0.8, 0.72, 0],
  reins: [2.35, 2.95, 0],
  kingpin: [PO_XF, 1.02, 0],
  track: 2 * PO_FORE.z,
  fore: (m) => foreCarriage(m, { x: PO_XF, wheel: PO_FORE, table: 1.02, hitch: [PO_XF + 0.8, 0.72, 0] }),
  body: (m) => {
    parisSaloon(m);
    parisImperiale(m);
    parisPlatform(m);
    parisBox(m);
    parisGear(m);
    rollCoach(m, PO_FORE, PO_REAR);
  },
  rolling: [],
  lod: (m) => {
    const k = PO;
    lodSideBox(m, "body", [[k.rear, k.floor], [0.95, k.floor], [1.45, k.waist], [k.rear, k.waist]], -k.low, k.low);
    lodBlock(m, k.rear, k.front, k.waist, k.deck, -k.half, k.half, { side: "body", top: "roof" });
    lodBlock(m, -1.55, 1.25, k.deck, 3.3, -0.03, 0.03, { side: "boards", top: null });
    lodSideBox(m, "roof", [[k.rear, k.deck], [k.front, k.deck], [k.front, 3.4], [k.rear, 3.4]], -0.97, 0.97, false);
    lodSideBox(m, "body", [[k.front, 2.05], [2.55, 2.05], [2.55, 2.6], [k.front, 2.6]], -0.82, 0.82);
    lodSideBox(m, "boards", [[k.plat, 0.68], [k.rear, 0.68], [k.rear, 0.78], [k.plat, 0.78]], -0.9, 0.9);
    lodSideBox(m, "roof", [[k.plat, k.roof], [k.rear, k.roof], [k.rear, k.deck], [k.plat, k.deck]], -0.9, 1.0);
    for (const s of [-1, 1]) {
      lodWheel(m, "gear", PO_XR, PO_REAR.r, ...side(s, PO_REAR.z - 0.04, PO_REAR.z + 0.04), 8);
      lodWheel(m, "gear", PO_XF, PO_FORE.r, ...side(s, PO_FORE.z - 0.04, PO_FORE.z + 0.04), 8);
    }
  },
  references: "animal-bus-paris-omnibus",
};

export const animalBusParisOmnibus = (p?: ParamValues) => buildAnimalVehicle(PARIS, p);
export const animalBusParisOmnibusLod = (p?: ParamValues) => coachLod(PARIS, p);

// ---------------------------------------------------------------------------
// the wagonette

const WG_REAR: Wheel = { r: 0.66, sides: 20, z: 0.86, w: 0.065, spokes: 14, hub: 0.1 };
const WG_FORE: Wheel = { r: 0.44, sides: 16, z: 0.8, w: 0.06, spokes: 12, hub: 0.09 };
const WG_XR = -1.05;
const WG_XF = 1.3;
const WG = { bed: 1.0, floor: 1.08, side: 1.4, rear: -2.15, front: 0.85, half: 0.78, canopy: 2.72 };
/** The cross benches, front first: x of the seat's middle; each row's floor a riser higher. */
const WG_ROWS = [0.5, -0.1, -0.7, -1.3, -1.9];
const WG_RISE = 0.09;

const WG_PALETTE: Record<string, MaterialSpec> = {
  ...BASE,
  body: { color: "#23402f", roughness: 0.45 },
  panel: { color: "#7b4b2a", roughness: 0.55 },
  gear: { color: "#8c2a1f", roughness: 0.6 },
  canvas: { color: "#e3d8bc", roughness: 0.95 },
  fringe: { color: "#9c3324", roughness: 0.9 },
};

function wagonetteBody(m: MeshBuilder): void {
  const k = WG;
  m.scope("body", () => {
    block(m, "body", k.rear, k.front, k.bed, k.floor, -k.half, k.half);
    for (const s of [-1, 1]) {
      block(m, "body", k.rear, k.front, k.floor, k.side, ...side(s, k.half - 0.035, k.half));
      block(m, "panel", k.rear + 0.06, k.front - 0.06, k.floor + 0.05, k.side - 0.06, ...side(s, k.half - 0.004, k.half + 0.006));
      block(m, "lining", k.rear - 0.01, k.front + 0.01, k.side - 0.005, k.side + 0.025, ...side(s, k.half - 0.045, k.half + 0.012));
    }
    // the rear board either side of the door, the door shut, the step under it
    for (const s of [-1, 1]) block(m, "body", k.rear, k.rear + 0.035, k.floor, k.side, ...side(s, 0.3, k.half - 0.035));
    block(m, "panel", k.rear - 0.005, k.rear + 0.03, k.floor, k.side - 0.04, -0.3, 0.3);
    block(m, "brass", k.rear - 0.03, k.rear - 0.004, 1.25, 1.28, 0.18, 0.26);
    block(m, "iron", k.rear - 0.38, k.rear - 0.06, 0.58, 0.62, -0.26, 0.26);
    for (const z of [-0.2, 0.2]) m.rod("iron", [k.rear - 0.3, 0.6, z], [k.rear + 0.06, k.bed + 0.01, z], 0.016, 4);
  });
  m.scope("benches", () => {
    WG_ROWS.forEach((x, i) => {
      const fy = k.floor + WG_RISE * i;
      // the row's raised floor, the seat, the back behind it, the iron ends
      if (i) block(m, "boards", x - 0.3, x + 0.3, k.floor - 0.01, fy, -k.half + 0.04, k.half - 0.04);
      const y = fy + 0.42;
      block(m, "cushion", x - 0.08, x + 0.2, y - 0.06, y, -k.half + 0.05, k.half - 0.05);
      block(m, "seatWood", x - 0.14, x - 0.1, y - 0.02, y + 0.38, -k.half + 0.05, k.half - 0.05);
      for (const s of [-1, 1]) {
        block(m, "iron", x - 0.1, x + 0.16, fy - 0.005, y - 0.06, ...side(s, k.half - 0.12, k.half - 0.09));
        block(m, "iron", x - 0.15, x - 0.08, fy - 0.005, y + 0.4, ...side(s, k.half - 0.09, k.half - 0.045));
      }
    });
  });
}

/** The canvas canopy on its posts, a fringed valance round it. */
function wagonetteCanopy(m: MeshBuilder): void {
  const k = WG;
  m.scope("canopy", () => {
    const [x0, x1] = [k.rear - 0.08, k.front + 0.1];
    for (const s of [-1, 1]) for (const x of [k.rear + 0.04, -0.65, k.front - 0.04]) m.rod("iron", [x, k.side - 0.05, s * (k.half - 0.02)], [x, k.canopy, s * (k.half - 0.02)], 0.02, 6);
    const r: Ring = [[-0.86, k.canopy], [0.86, k.canopy], [0.86, k.canopy + 0.05], [0.4, k.canopy + 0.15], [-0.4, k.canopy + 0.15], [-0.86, k.canopy + 0.05]];
    m.sweep("canvas", "x", r, x0, r, x1);
    for (const s of [-1, 1]) block(m, "fringe", x0, x1, k.canopy - 0.12, k.canopy - 0.002, ...side(s, 0.862, 0.875));
    for (const x of [x0 - 0.013, x1]) block(m, "fringe", x, x + 0.013, k.canopy - 0.12, k.canopy - 0.002, -0.875, 0.875);
    // the rolled side curtains under the eaves
    for (const s of [-1, 1]) m.rod("canvas", [x0 + 0.05, k.canopy - 0.06, s * 0.84], [x1 - 0.05, k.canopy - 0.06, s * 0.84], 0.045, 6);
  });
}

/** The driver's box at the front: the raised boot with his seat on it, the footboard and dash, the lamps. */
function wagonetteBox(m: MeshBuilder): void {
  const k = WG;
  m.scope("driver's box", () => {
    block(m, "body", k.front - 0.02, 1.45, k.bed, 1.78, -0.7, 0.7);
    block(m, "panel", k.front + 0.05, 1.4, k.bed + 0.1, 1.7, ...side(1, 0.698, 0.706));
    block(m, "panel", k.front + 0.05, 1.4, k.bed + 0.1, 1.7, ...side(-1, 0.698, 0.706));
    block(m, "cushion", k.front + 0.05, 1.42, 1.78, 1.86, -0.66, 0.66);
    block(m, "cushion", k.front + 0.01, k.front + 0.09, 1.86, 2.14, -0.66, 0.66);
    railing(m, "iron", [[k.front + 0.05, -0.68], [1.35, -0.68]], 1.86, [2.04], 0.014);
    railing(m, "iron", [[k.front + 0.05, 0.68], [1.35, 0.68]], 1.86, [2.04], 0.014);
    m.slab("boards", [[1.45, 1.55, -0.66], [1.86, 1.36, -0.66], [1.86, 1.36, 0.66], [1.45, 1.55, 0.66]], [0, -0.04, 0]);
    block(m, "body", 1.84, 1.88, 1.34, 1.72, -0.6, 0.6);
    for (const s of [-1, 1]) m.rod("iron", [1.84, 1.34, s * 0.45], [1.45, 1.2, s * 0.45], 0.018, 5);
    for (const s of [-1, 1]) lamp(m, 1.5, 1.72, s * 0.78);
  });
}

function wagonetteGear(m: MeshBuilder): void {
  m.scope("running gear", () => {
    rearWheels(m, WG_XR, WG_REAR);
    for (const s of [-1, 1]) ellipticSpring(m, WG_XR, s * 0.55, axleY(WG_REAR) + 0.03, WG.bed, 0.4);
    block(m, "gear", WG_XF - 0.14, WG_XF + 0.14, 0.755, WG.bed + 0.01, -0.42, 0.42);
    m.prism("iron", ccw(ngon(12, 0.34, Math.PI / 12, WG_XF, 0)), 0.74, 0.755);
  });
}

const WAGONETTE: AnimalVehicleSpec = {
  id: "veh-animal-bus-wagonette",
  title: "Wagonette",
  kind: "road",
  catalog: BUS_CATALOG,
  palette: WG_PALETTE,
  weight: 0.9,
  maxspeed: 18,
  pair: true,
  hitch: [WG_XF + 0.78, 0.68, 0],
  reins: [1.6, 2.15, 0],
  kingpin: [WG_XF, 0.74, 0],
  track: 2 * WG_FORE.z,
  fore: (m) => foreCarriage(m, { x: WG_XF, wheel: WG_FORE, table: 0.74, hitch: [WG_XF + 0.78, 0.68, 0] }),
  body: (m) => {
    wagonetteBody(m);
    wagonetteCanopy(m);
    wagonetteBox(m);
    wagonetteGear(m);
    rollCoach(m, WG_FORE, WG_REAR);
  },
  rolling: [],
  lod: (m) => {
    const k = WG;
    lodSideBox(m, "body", [[k.rear, k.bed], [k.front, k.bed], [k.front, k.side], [k.rear, k.side]], -k.half, k.half);
    lodSideBox(m, "body", [[k.front, k.bed], [1.88, 1.34], [1.88, 1.86], [k.front, 1.86]], -0.7, 0.7);
    lodSideBox(m, "cushion", [[k.rear + 0.1, k.side], [k.front - 0.1, k.side], [k.front - 0.1, 1.85], [k.rear + 0.1, 2.25]], -0.72, 0.72);
    lodBlock(m, k.rear - 0.08, k.front + 0.1, k.canopy - 0.12, k.canopy + 0.12, -0.875, 0.875, { side: "fringe", top: "canvas", bottom: "canvas" });
    for (const s of [-1, 1]) {
      lodWheel(m, "gear", WG_XR, WG_REAR.r, ...side(s, WG_REAR.z - 0.04, WG_REAR.z + 0.04), 8);
      lodWheel(m, "gear", WG_XF, WG_FORE.r, ...side(s, WG_FORE.z - 0.04, WG_FORE.z + 0.04), 8);
    }
  },
  references: "animal-bus-wagonette",
};

export const animalBusWagonette = (p?: ParamValues) => buildAnimalVehicle(WAGONETTE, p);
export const animalBusWagonetteLod = (p?: ParamValues) => coachLod(WAGONETTE, p);

/** The animal-drawn road coaches. */
export const ANIMAL_BUSES: readonly ProceduralDesign[] = [
  animalVehicleDesign(KNIFEBOARD, { build: animalBusKnifeboardOmnibus, buildLod: animalBusKnifeboardOmnibusLod }),
  animalVehicleDesign(STAGECOACH, { build: animalBusStagecoach, buildLod: animalBusStagecoachLod }),
  animalVehicleDesign(PARIS, { build: animalBusParisOmnibus, buildLod: animalBusParisOmnibusLod }),
  animalVehicleDesign(WAGONETTE, { build: animalBusWagonette, buildLod: animalBusWagonetteLod }),
];
