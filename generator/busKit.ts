// The fittings every procedural bus is assembled from (buses.ts): wheels,
// glazing, doors, lamps and mirrors laid on the shell of busBody.ts, and the
// palette they share. See docs/models/buses.md.

import { ngon, type MaterialSpec, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { endAt, halfWidth, rectAB } from "./busBody.ts";

/** Materials every bus has; a design adds its livery's colours. */
export const BUS_BASE_PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#26323f", metallic: 0.2, roughness: 0.15 },
  glassDark: { color: "#161c24", metallic: 0.2, roughness: 0.15 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  frame: { color: "#2b2d31", roughness: 0.6 },
  under: { color: "#26272a", roughness: 0.9 },
  rim: { color: "#a9adb2", metallic: 0.35, roughness: 0.45 },
  hub: { color: "#3a3c40", roughness: 0.6 },
  chrome: { color: "#d9dee4", metallic: 0.45, roughness: 0.25 },
  lampHead: { color: "#f3f5f6", roughness: 0.2 },
  lampAmber: { color: "#ff9a2e", roughness: 0.3 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  plate: { color: "#f2f2ee", roughness: 0.5 },
  plateYellow: { color: "#f2c21b", roughness: 0.5 },
  sign: { color: "#141414", roughness: 0.4 },
  signText: { color: "#ffb21e", roughness: 0.3 },
  bellows: { color: "#2a2b2e", roughness: 0.9 },
  grille: { color: "#1e1f22", roughness: 0.7 },
};

/** The palette of a bus: the shared materials and the livery's. */
export function busPalette(livery: Record<string, string>): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = { ...BUS_BASE_PALETTE };
  for (const [name, color] of Object.entries(livery)) out[name] = { color, roughness: 0.45, metallic: 0.1 };
  return out;
}

/** A tyre is a 16-gon standing on a flat side: its axle is this fraction of the radius up. */
export const AXLE_FACTOR = Math.cos(Math.PI / 16);

/**
 * One wheel at axle x, its tyre spanning z0..z1. A wheel seen from outside
 * (`face` +1 or -1, the outer side) gets a disc and a hub on that face; the inner
 * wheel of a pair shows none.
 */
export function busWheel(m: MeshBuilder, x: number, radius: number, z0: number, z1: number, face: number | null): void {
  const y = radius * AXLE_FACTOR;
  const tyre = ngon(16, radius, Math.PI / 16, x, y);
  m.sweep("rubber", "z", tyre, z0, tyre, z1);
  if (face === null) return;
  const f = face > 0 ? z1 : z0;
  const disc = ngon(12, radius * 0.56, 0, x, y);
  const hub = ngon(8, radius * 0.2, Math.PI / 8, x, y);
  // the disc is dished: it sits a little inside the tyre's face
  m.sweep("rim", "z", disc, f - face * 0.05, disc, f - face * 0.015);
  m.sweep("hub", "z", hub, f - face * 0.02, hub, f + face * 0.02);
}

/** An axle beam across the bus at x, between the wheels. */
export function axleBeam(m: MeshBuilder, x: number, radius: number, half: number, drive: boolean): void {
  const y = radius * AXLE_FACTOR;
  const beam = ngon(8, 0.07, Math.PI / 8, x, y);
  m.sweep("under", "z", beam, -half, beam, half);
  if (drive) {
    const diff = ngon(10, 0.2, 0, x, y);
    m.sweep("under", "z", diff, -0.2, diff, 0.2);
  }
}

/** The z range a..b (both >= 0) on the side `s` (+1 right, -1 left), low end first. */
export function onSide(s: number, a: number, b: number): [number, number] {
  return s > 0 ? [a, b] : [-b, -a];
}

/** Where things sit on a bus's outside, from its shell's outlines. */
export interface BusFrame {
  section: Array<[number, number]>;
  side: Array<[number, number]>;
}

/**
 * How deep a slab `proud` of the shell reaches into it by default: further the
 * prouder it is, so two stacked slabs (a pane on its frame) never share a back
 * face -- coplanar faces of two materials flicker (coplanar.ts).
 */
function backOf(proud: number): number {
  return 0.02 + proud;
}

/** The point at (x, y) on side `s`, `proud` off the shell. */
export function sidePoint(f: BusFrame, s: number, x: number, y: number, proud: number): Vec3 {
  return [x, y, s * (halfWidth(f.section, y) + proud)];
}

/**
 * A pane, panel or door leaf on a side: a slab over x0..x1, y0..y1 laid on the
 * shell (its corners follow the section's lean), `proud` out of it and `depth`
 * into it. Keep it within one straight piece of the section.
 */
export function sideSlab(m: MeshBuilder, mat: string, f: BusFrame, s: number, x0: number, x1: number, y0: number, y1: number, proud: number, depth = backOf(proud)): void {
  const outline = rectAB(x0, x1, y0, y1).map(([x, y]) => sidePoint(f, s, x, y, proud));
  m.slab(mat, outline, [0, 0, -s * (proud + depth)]);
}

/** The point at (z, y) on an end (`end` +1 the nose, -1 the rear), `proud` out of it along x. */
export function endPoint(f: BusFrame, end: 1 | -1, z: number, y: number, proud: number): Vec3 {
  return [endAt(f.side, y, end) + end * proud, y, z];
}

/**
 * A slab on an end of the shell over z0..z1, y0..y1, following the end's rake,
 * `proud` out of it and `depth` into it along x. Keep it within one straight
 * piece of the side outline's end.
 */
export function endSlab(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, z0: number, z1: number, y0: number, y1: number, proud: number, depth = backOf(proud)): void {
  const outline = rectAB(z0, z1, y0, y1).map(([z, y]) => endPoint(f, end, z, y, proud));
  m.slab(mat, outline, [-end * (proud + depth), 0, 0]);
}

/** A round lamp on an end: an n-gon lens (and an optional housing behind it). */
export function endLamp(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, z: number, y: number, r: number, proud: number, housing?: string, n = 10): void {
  const ring: Ring = ngon(n, r, 0, z, y);
  if (housing) {
    const outer = ngon(n, r + 0.025, 0, z, y);
    m.slab(housing, outer.map(([a, b]) => endPoint(f, end, a, b, proud - 0.01)), [-end * (proud + 0.02), 0, 0]);
  }
  m.slab(mat, ring.map(([a, b]) => endPoint(f, end, a, b, proud)), [-end * (proud + 0.02), 0, 0]);
}

/**
 * An outside mirror on a stalk, on side `s`, its glass facing backward: the
 * stalk from (x, y) on the shell out to `reach` from the centre line, the head
 * hanging below it.
 */
export function mirror(m: MeshBuilder, f: BusFrame, s: number, x: number, y: number, reach: number, head: { h: number; w: number; drop: number }): void {
  const z0 = halfWidth(f.section, y) - 0.02;
  const zs: [number, number] = s > 0 ? [z0, reach] : [-reach, -z0];
  block(m, "frame", x - 0.02, x + 0.02, y - 0.02, y + 0.02, ...zs);
  const zc = s * (reach - head.w / 2);
  const top = y + 0.02 - head.drop + head.h;
  block(m, "frame", x - 0.03, x + 0.04, top - head.h, top, zc - head.w / 2, zc + head.w / 2);
  block(m, "glass", x - 0.045, x - 0.03, top - head.h + 0.02, top - 0.02, zc - head.w / 2 + 0.02, zc + head.w / 2 - 0.02);
}
