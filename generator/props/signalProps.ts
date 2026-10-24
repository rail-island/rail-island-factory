// The trackside signals the game places itself (docs/models/props.md): a rail
// signal (a mast with a three-lamp head, red over blue over green), a level
// crossing's road signal (a mast with the St Andrew's cross and a two-lamp red
// head) and the buffer stop at a dead end of track. The game puts one per governed direction of a signal and one per road
// approach of a crossing, and lights the lamps live: each lamp is its own material,
// named for the lamp the game switches (`lampred`, `lampblue`, `lampgreen`;
// `lampleft`, `lampright`), so the game can swap a lamp's look without touching the
// rest of the signal.
//
// Frame: y = 0 the foot of the mast (the ground or rail level it stands on), the
// lamps and the cross face +Z (toward the approaching train or road traffic), and
// the track or road lies toward +X. Studs, placed at scale 1.

import type { ProceduralDesign } from "../design.ts";
import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import { propMaterial, type Rgb } from "./propKit.ts";

const MAST_GREY: Rgb = [128, 134, 140];
const STEEL_DARK: Rgb = [74, 78, 84];
const BLACK: Rgb = [30, 31, 34];
const WHITE: Rgb = [234, 234, 228];
const CROSS_RED: Rgb = [196, 34, 38];
const CONCRETE: Rgb = [152, 150, 142];
const CABINET: Rgb = [132, 142, 136];
const RAIL_STEEL: Rgb = [96, 88, 80];
const SLEEPER: Rgb = [112, 86, 62];
const GRAVEL: Rgb = [138, 134, 126];
const BACK_GREY: Rgb = [150, 154, 158];

/** The rail signal's lamps, top to bottom: the material kind the game switches and the lens colour. */
export const RAIL_SIGNAL_LAMPS = [
  { kind: "lampred", color: [255, 40, 40] as Rgb },
  { kind: "lampblue", color: [70, 140, 255] as Rgb },
  { kind: "lampgreen", color: [70, 215, 95] as Rgb },
] as const;
/** The crossing signal's lamps, -X then +X: the material kind the game switches and the lens colour. */
export const CROSSING_SIGNAL_LAMPS = [
  { kind: "lampleft", color: [255, 40, 40] as Rgb },
  { kind: "lampright", color: [255, 40, 40] as Rgb },
] as const;

const mat = {
  mast: propMaterial("steel", MAST_GREY),
  dark: propMaterial("steel", STEEL_DARK),
  black: propMaterial("paint", BLACK),
  white: propMaterial("paint", WHITE),
  red: propMaterial("paint", CROSS_RED),
  concrete: propMaterial("concrete", CONCRETE),
  cabinet: propMaterial("steel", CABINET),
  rail: propMaterial("steel", RAIL_STEEL),
  sleeper: propMaterial("wood", SLEEPER),
  gravel: propMaterial("concrete", GRAVEL),
  back: propMaterial("paint", BACK_GREY),
};

const hex = (c: Rgb): string => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

function palette(lamps: ReadonlyArray<{ kind: string; color: Rgb }>): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = {
    [mat.mast]: { color: hex(MAST_GREY), roughness: 0.45, metallic: 0.5 },
    [mat.dark]: { color: hex(STEEL_DARK), roughness: 0.5, metallic: 0.5 },
    [mat.black]: { color: hex(BLACK), roughness: 0.55 },
    [mat.white]: { color: hex(WHITE), roughness: 0.5 },
    [mat.red]: { color: hex(CROSS_RED), roughness: 0.5 },
    [mat.concrete]: { color: hex(CONCRETE), roughness: 0.9 },
    [mat.cabinet]: { color: hex(CABINET), roughness: 0.5, metallic: 0.4 },
    [mat.rail]: { color: hex(RAIL_STEEL), roughness: 0.4, metallic: 0.6 },
    [mat.sleeper]: { color: hex(SLEEPER), roughness: 0.9 },
    [mat.gravel]: { color: hex(GRAVEL), roughness: 1 },
    [mat.back]: { color: hex(BACK_GREY), roughness: 0.6 },
  };
  for (const l of lamps) out[propMaterial(l.kind, l.color)] = { color: hex(l.color), roughness: 0.2 };
  return out;
}

// --- shared parts ---

/** A rounded rectangle in a plane, (u, v) points counter-clockwise, `r` the corner radius. */
function roundedRect(w: number, h: number, r: number, steps = 3): Ring {
  const out: Ring = [];
  const corners: Array<[number, number, number]> = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
  for (const [cu, cv, a0] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = ((a0 + (90 * i) / steps) * Math.PI) / 180;
      out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
    }
  }
  return out;
}

/** A flat plate facing +Z: `outline` (x, y) about (cx, cy), from z0 to z1. */
function plate(m: MeshBuilder, material: string, outline: Ring, cx: number, cy: number, z0: number, z1: number): void {
  m.slab(material, outline.map(([u, v]): Vec3 => [cx + u, cy + v, z1]), [0, 0, z0 - z1]);
}

/** A rotated bar facing +Z: `len` long, `w` wide, turned `angle` from +X, from z0 to z1. */
function bar(m: MeshBuilder, material: string, cx: number, cy: number, len: number, w: number, angle: number, z0: number, z1: number): void {
  const c = Math.cos(angle), s = Math.sin(angle);
  const pts: Array<[number, number]> = [[-len / 2, -w / 2], [len / 2, -w / 2], [len / 2, w / 2], [-len / 2, w / 2]];
  m.slab(material, pts.map(([u, v]): Vec3 => [cx + u * c - v * s, cy + u * s + v * c, z1]), [0, 0, z0 - z1]);
}

/** A round mast from y0 to y1 on a sunk concrete footing, capped with a small finial. */
function mast(m: MeshBuilder, r: number, y0: number, y1: number, sides: number): void {
  m.scope("footing", () => m.box(mat.concrete, 0, 0, 0.8, 0.8, -0.2, y0));
  m.scope("mast", () => {
    m.prism(mat.mast, ngon(sides, r * 1.35), y0, y0 + 0.18);
    m.prism(mat.mast, ngon(sides, r), y0 + 0.18, y1, false);
    m.prism(mat.mast, ngon(sides, r * 1.2), y1, y1 + 0.06, false);
    m.spire(mat.mast, ngon(sides, r * 1.2), y1 + 0.06, y1 + 0.22);
  });
}

/** A clamp collar round the mast at height y, and a bracket from it forward to the head at z. */
function bracket(m: MeshBuilder, r: number, y: number, z: number, sides: number): void {
  m.prism(mat.dark, ngon(sides, r * 1.25), y - 0.07, y + 0.07);
  m.box(mat.dark, 0, z / 2, 0.16, z, y - 0.05, y + 0.05);
}

/**
 * One lamp facing +Z at (x, y), its lens front at z: a domed lens in its own
 * material, a black bezel and a visor over the top half reaching `visor` forward.
 */
function lamp(m: MeshBuilder, lens: string, x: number, y: number, z: number, r: number, visor: number): void {
  const n = 12;
  const ring = (rr: number): Ring => ngon(n, rr).map(([u, v]): [number, number] => [x + u, y + v]);
  m.sweep(lens, "z", ring(r), z - 0.02, ring(r * 0.72), z + 0.05);
  m.tube(mat.black, "z", x, y, r + 0.05, r, z - 0.02, z + 0.02, n);
  // the visor: an arc over the lens from a little below each side, open toward the bottom
  const ro = r + 0.05, ri = r + 0.02;
  const a0 = (-15 * Math.PI) / 180, a1 = (195 * Math.PI) / 180, steps = 8;
  const P = (rr: number, a: number, zz: number): Vec3 => [x + rr * Math.cos(a), y + rr * Math.sin(a), zz];
  const z0 = z - 0.02, z1 = z + visor;
  for (let i = 0; i < steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const b = a0 + ((a1 - a0) * (i + 1)) / steps;
    m.quad(mat.black, P(ro, a, z0), P(ro, b, z0), P(ro, b, z1), P(ro, a, z1));
    m.quad(mat.black, P(ri, a, z1), P(ri, b, z1), P(ri, b, z0), P(ri, a, z0));
    m.quad(mat.black, P(ro, a, z1), P(ro, b, z1), P(ri, b, z1), P(ri, a, z1));
  }
  m.quad(mat.black, P(ri, a0, z0), P(ro, a0, z0), P(ro, a0, z1), P(ri, a0, z1));
  m.quad(mat.black, P(ro, a1, z0), P(ri, a1, z0), P(ri, a1, z1), P(ro, a1, z1));
}

/** The relay cabinet at the foot of the mast, away from the track (-X). */
function cabinet(m: MeshBuilder): void {
  m.scope("cabinet", () => {
    m.box(mat.concrete, -0.85, 0, 0.7, 0.55, -0.1, 0.12);
    m.box(mat.cabinet, -0.85, 0, 0.56, 0.4, 0.12, 1.0);
    m.box(mat.cabinet, -0.85, 0, 0.66, 0.5, 1.0, 1.06);
    // the door's handle, on the face toward the train
    m.box(mat.dark, -0.68, 0.21, 0.04, 0.03, 0.5, 0.66);
  });
}

// --- the rail signal ---

const SIG = {
  mastR: 0.17, mastTop: 6.0,
  headW: 0.9, headH: 2.3, headY: 4.85,
  housingZ: [0.18, 0.5] as const, shieldZ: [0.5, 0.58] as const,
  lampSpacing: 0.62, lampR: 0.22,
};

/** A rail signal: footing, mast, ladder and platform at the back, the three-lamp head, its number plate and a relay cabinet. */
export function railSignal(): MeshBuilder {
  const m = new MeshBuilder(palette(RAIL_SIGNAL_LAMPS));
  const { mastR, mastTop, headW, headH, headY } = SIG;
  mast(m, mastR, 0.3, mastTop, 10);
  m.scope("head", () => {
    // the lamp housing behind the shield, the white-bordered black shield in front
    m.box(mat.black, 0, (SIG.housingZ[0] + SIG.housingZ[1]) / 2, headW - 0.26, SIG.housingZ[1] - SIG.housingZ[0], headY - headH / 2 + 0.12, headY + headH / 2 - 0.12);
    plate(m, mat.white, roundedRect(headW + 0.12, headH + 0.12, 0.42), 0, headY, SIG.shieldZ[0], SIG.shieldZ[1] - 0.03);
    plate(m, mat.black, roundedRect(headW, headH, 0.36), 0, headY, SIG.shieldZ[0] + 0.01, SIG.shieldZ[1]);
    for (const y of [headY - 0.75, headY + 0.75]) bracket(m, mastR, y, SIG.housingZ[0], 10);
  });
  RAIL_SIGNAL_LAMPS.forEach((l, i) => {
    m.scope(`lamp-${l.kind}`, () => lamp(m, propMaterial(l.kind, l.color), 0, headY + (1 - i) * SIG.lampSpacing, SIG.shieldZ[1] + 0.02, SIG.lampR, 0.32));
  });
  m.scope("plate", () => {
    // the signal's name plate below the head: white with a black border and lettering
    plate(m, mat.black, roundedRect(0.6, 0.42, 0.06, 1), 0, 3.05, mastR - 0.02, mastR + 0.03);
    plate(m, mat.white, roundedRect(0.52, 0.34, 0.04, 1), 0, 3.05, mastR + 0.01, mastR + 0.05);
    for (const dx of [-0.14, 0, 0.14]) m.box(mat.black, dx, mastR + 0.06, 0.07, 0.02, 2.95, 3.15);
  });
  m.scope("ladder", () => {
    // up the back of the mast (-Z) to a small platform under the head
    const z = -0.36, top = 3.62;
    for (const x of [-0.19, 0.19]) m.rod(mat.dark, [x, 0.3, z], [x, top + 0.75, z], 0.03, 4);
    for (let y = 0.7; y < top; y += 0.42) m.rod(mat.dark, [-0.19, y, z], [0.19, y, z], 0.024, 3, false);
    for (const y of [1.2, 2.6]) for (const x of [-0.19, 0.19]) m.rod(mat.dark, [x * 0.4, y, -mastR + 0.02], [x, y, z], 0.025, 3, false);
    // the platform and its railing
    m.box(mat.dark, 0, -0.42, 0.9, 0.62, top - 0.05, top);
    for (const x of [-0.42, 0.42]) m.rod(mat.dark, [x, top, -0.7], [x, top + 0.75, -0.7], 0.025, 4);
    m.rod(mat.dark, [-0.42, top + 0.75, -0.7], [0.42, top + 0.75, -0.7], 0.025, 4);
    for (const x of [-0.42, 0.42]) m.rod(mat.dark, [x, top + 0.75, -0.7], [x, top + 0.75, -0.15], 0.025, 4);
  });
  cabinet(m);
  return m;
}

/** The rail signal far away: mast, head and lamp faces only. */
export function railSignalLod(): MeshBuilder {
  const m = new MeshBuilder(palette(RAIL_SIGNAL_LAMPS));
  const { mastR, mastTop, headW, headH, headY } = SIG;
  m.prism(mat.mast, ngon(6, mastR), 0, mastTop);
  m.box(mat.black, 0, 0.35, headW, 0.42, headY - headH / 2, headY + headH / 2);
  RAIL_SIGNAL_LAMPS.forEach((l, i) => {
    const y = headY + (1 - i) * SIG.lampSpacing;
    plate(m, propMaterial(l.kind, l.color), ngon(6, SIG.lampR), 0, y, 0.56, 0.6);
  });
  return m;
}

// --- the level crossing signal ---

const XING = {
  mastR: 0.17, mastTop: 4.95,
  headW: 1.9, headH: 0.95, headY: 3.3,
  housingZ: [0.18, 0.48] as const, shieldZ: [0.48, 0.56] as const,
  lampSpacing: 1.0, lampR: 0.26,
  crossY: 4.62, crossZ: 0.22, armLen: 2.2, armW: 0.34, armAngle: (32 * Math.PI) / 180,
};

/** A level crossing signal: footing, mast, the St Andrew's cross, the two-lamp head, the bell on top and a relay cabinet. */
export function crossingSignal(): MeshBuilder {
  const m = new MeshBuilder(palette(CROSSING_SIGNAL_LAMPS));
  const { mastR, mastTop, headW, headH, headY } = XING;
  mast(m, mastR, 0.3, mastTop, 10);
  m.scope("bell", () => {
    // the electronic bell on the mast head
    m.loft(mat.black, ngon(10, 0.24), mastTop + 0.22, ngon(10, 0.13), mastTop + 0.48);
    m.cap(mat.black, ngon(10, 0.24), mastTop + 0.22, false);
    m.prism(mat.dark, ngon(10, 0.05), mastTop + 0.48, mastTop + 0.56);
  });
  m.scope("cross", () => {
    // red-bordered white arms, one each way, on a bracket in front of the mast
    m.box(mat.dark, 0, XING.crossZ / 2, 0.2, XING.crossZ, XING.crossY - 0.12, XING.crossY + 0.12);
    for (const s of [-1, 1]) {
      bar(m, mat.red, 0, XING.crossY, XING.armLen, XING.armW, s * XING.armAngle, XING.crossZ, XING.crossZ + 0.04);
      bar(m, mat.white, 0, XING.crossY, XING.armLen - 0.1, XING.armW - 0.1, s * XING.armAngle, XING.crossZ + 0.045, XING.crossZ + 0.065);
    }
  });
  m.scope("head", () => {
    m.box(mat.black, 0, (XING.housingZ[0] + XING.housingZ[1]) / 2, headW - 0.3, XING.housingZ[1] - XING.housingZ[0], headY - headH / 2 + 0.1, headY + headH / 2 - 0.1);
    plate(m, mat.white, roundedRect(headW + 0.12, headH + 0.12, 0.47), 0, headY, XING.shieldZ[0], XING.shieldZ[1] - 0.03);
    plate(m, mat.black, roundedRect(headW, headH, 0.41), 0, headY, XING.shieldZ[0] + 0.01, XING.shieldZ[1]);
    bracket(m, mastR, headY, XING.housingZ[0], 10);
  });
  CROSSING_SIGNAL_LAMPS.forEach((l, i) => {
    m.scope(`lamp-${l.kind}`, () => lamp(m, propMaterial(l.kind, l.color), (i === 0 ? -1 : 1) * (XING.lampSpacing / 2), headY, XING.shieldZ[1] + 0.02, XING.lampR, 0.34));
  });
  m.scope("stripes", () => {
    // the red and white bands at the foot of the mast
    for (let k = 0; k < 4; k++) {
      const y0 = 0.6 + k * 0.32;
      m.prism(k % 2 ? mat.white : mat.red, ngon(10, mastR + 0.012), y0, y0 + 0.32, false);
    }
  });
  cabinet(m);
  return m;
}

/** The crossing signal far away: mast, cross, head and lamp faces only. */
export function crossingSignalLod(): MeshBuilder {
  const m = new MeshBuilder(palette(CROSSING_SIGNAL_LAMPS));
  const { mastR, mastTop, headW, headH, headY } = XING;
  m.prism(mat.mast, ngon(6, mastR), 0, mastTop);
  for (const s of [-1, 1]) bar(m, mat.white, 0, XING.crossY, XING.armLen, XING.armW, s * XING.armAngle, XING.crossZ, XING.crossZ + 0.05);
  m.box(mat.black, 0, 0.33, headW, 0.4, headY - headH / 2, headY + headH / 2);
  CROSSING_SIGNAL_LAMPS.forEach((l, i) => {
    plate(m, propMaterial(l.kind, l.color), ngon(6, XING.lampR), (i === 0 ? -1 : 1) * (XING.lampSpacing / 2), headY, 0.53, 0.57);
  });
  return m;
}

// --- the buffer stop ---

/**
 * The game's track: rails 2.7 studs apart (centres), 0.45 square, their middle
 * 1.3 studs above the track's points; the stop stands 3.2 studs past the end of
 * the track, so its own rail stubs reach back to meet it.
 */
const STOP = {
  railX: 1.35, railW: 0.45, railY0: 1.08, railY1: 1.53, trackEndZ: 3.2,
  beamW: 4.0, beamY0: 2.45, beamY1: 3.05, beamZ: [0, 0.55] as const,
  bufferX: 1.55, signY: 4.9, signR: 0.9,
};

/** Hazard stripes slanted across the beam's front face, clipped to the beam. */
function hazardStripes(m: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const w = 0.42, slant = 0.4;
  const clip = (x: number): number => Math.min(x1, Math.max(x0, x));
  let k = 0;
  for (let x = x0 - slant; x < x1; x += w, k++) {
    const pts: Vec3[] = [[clip(x), y0, z1], [clip(x + w), y0, z1], [clip(x + w + slant), y1, z1], [clip(x + slant), y1, z1]];
    if (pts[1]![0] - pts[0]![0] < 1e-3 && pts[2]![0] - pts[3]![0] < 1e-3) continue;
    m.slab(k % 2 ? mat.white : mat.red, pts, [0, 0, z0 - z1]);
  }
}

/**
 * A buffer stop at a dead end of track: a gravel bed with rail stubs on three
 * sleepers reaching back (+Z) to the end of the track, a frame of rail on each rail
 * (a post and a raking strut), the buffer beam with hazard stripes and two buffers
 * facing the track, and the end-of-track sign - a red disk with a white bar - on a
 * post above it.
 */
export function bufferStop(): MeshBuilder {
  const m = new MeshBuilder(palette([]));
  const { railX, railW, railY0, railY1, trackEndZ, beamW, beamY0, beamY1, beamZ } = STOP;
  m.scope("bed", () => {
    m.loft(mat.gravel, rect(5.4, 6.0, 0, 0.7), -0.1, rect(4.4, 5.2, 0, 0.75), 0.98);
    for (const z of [0.4, 1.5, 2.6]) m.box(mat.sleeper, 0, z, 4.0, 0.7, 0.9, railY0);
    for (const x of [-railX, railX]) m.box(mat.rail, x, (trackEndZ - 1.9) / 2, railW, trackEndZ + 1.9, railY0, railY1);
  });
  m.scope("frame", () => {
    for (const x of [-railX, railX]) {
      m.box(mat.dark, x, 0.25, 0.32, 0.36, railY1, beamY1);
      m.rod(mat.dark, [x, beamY0 + 0.2, 0.1], [x, railY1, -1.7], 0.2, 4);
      m.box(mat.dark, x, -1.7, 0.4, 0.5, railY1 - 0.02, railY1 + 0.12);
    }
    m.rod(mat.dark, [-railX, 2.1, -0.85], [railX, 2.1, -0.85], 0.1, 4);
  });
  m.scope("beam", () => {
    m.box(mat.dark, 0, (beamZ[0] + beamZ[1]) / 2, beamW, beamZ[1] - beamZ[0], beamY0, beamY1);
    hazardStripes(m, -beamW / 2, beamW / 2, beamY0 + 0.04, beamY1 - 0.04, beamZ[1], beamZ[1] + 0.03);
    const y = (beamY0 + beamY1) / 2;
    for (const x of [-STOP.bufferX, STOP.bufferX]) {
      const ring = (r: number, n: number): Ring => ngon(n, r).map(([u, v]): [number, number] => [x + u, y + v]);
      m.sweep(mat.dark, "z", ring(0.2, 10), beamZ[1], ring(0.15, 10), beamZ[1] + 0.45);
      m.sweep(mat.mast, "z", ring(0.36, 14), beamZ[1] + 0.45, ring(0.34, 14), beamZ[1] + 0.57);
    }
  });
  m.scope("sign", () => {
    const z = 0.2, y = STOP.signY, r = STOP.signR;
    m.rod(mat.mast, [0, beamY1, z - 0.15], [0, y + 0.6, z - 0.15], 0.09, 8);
    const disk = (rr: number): Ring => ngon(20, rr).map(([u, v]): [number, number] => [u, y + v]);
    m.sweep(mat.back, "z", disk(r + 0.07), z - 0.06, disk(r + 0.07), z - 0.02);
    m.sweep(mat.white, "z", disk(r + 0.07), z - 0.02, disk(r + 0.07), z + 0.02);
    m.sweep(mat.red, "z", disk(r), z + 0.02, disk(r), z + 0.06);
    plate(m, mat.white, [[-0.62, -0.15], [0.62, -0.15], [0.62, 0.15], [-0.62, 0.15]], 0, y, z + 0.06, z + 0.09);
  });
  return m;
}

/** The buffer stop far away: the beam, the frame posts and the sign's disk. */
export function bufferStopLod(): MeshBuilder {
  const m = new MeshBuilder(palette([]));
  const { railX, railY1, beamW, beamY0, beamY1, beamZ } = STOP;
  for (const x of [-railX, railX]) m.box(mat.dark, x, 0, 0.32, 0.36, railY1, beamY1);
  m.box(mat.red, 0, (beamZ[0] + beamZ[1]) / 2, beamW, beamZ[1] - beamZ[0], beamY0, beamY1);
  m.box(mat.mast, 0, 0.05, 0.16, 0.16, beamY1, STOP.signY);
  plate(m, mat.red, ngon(8, STOP.signR), 0, STOP.signY, 0.2, 0.26);
  return m;
}

const PROP_CATALOG = { category: "Props", group: "props", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

/** The props the game places itself, beside its track and roads, rather than through a set. */
export const SIGNAL_PROP_IDS = { rail: "proc-prop-rail-signal", crossing: "proc-prop-crossing-signal", bufferStop: "proc-prop-buffer-stop" } as const;

export const SIGNAL_PROPS: ProceduralDesign[] = [
  { id: SIGNAL_PROP_IDS.rail, title: "Rail Signal", build: railSignal, buildLod: railSignalLod },
  { id: SIGNAL_PROP_IDS.crossing, title: "Level Crossing Signal", build: crossingSignal, buildLod: crossingSignalLod },
  { id: SIGNAL_PROP_IDS.bufferStop, title: "Buffer Stop", build: bufferStop, buildLod: bufferStopLod },
].map((d) => ({ ...d, catalog: { ...PROP_CATALOG } }));
