// The pieces every character shares (docs/models/characters.md): closed boxes,
// quaternions for posing the parts, and the sampling of a loop of poses into
// clip times. characters.ts (the avatar) and animals.ts (the four-legged ones)
// both draw and pose with these.

import type { MeshBuilder } from "./meshBuilder.ts";
import { rect, type Ring, type Vec3 } from "./meshCore.ts";

/** A closed prism over `ring` from y0 to y1: sides, top and bottom (a limb turns its ends into view). */
export function block(m: MeshBuilder, mat: string, ring: Ring, y0: number, y1: number, bottom = true): void {
  m.prism(mat, ring, y0, y1);
  if (bottom) m.cap(mat, ring, y0, false);
}

/** A closed axis-aligned box from its centre across (cx, cz) and size (w along x, d along z). */
export function cube(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, bottom = true): void {
  block(m, mat, rect(w, d, cx, cz), y0, y1, bottom);
}

export type Quat = [number, number, number, number];

/** A turn of `a` radians about the x (0), y (1) or z (2) axis. */
export const qAxis = (axis: 0 | 1 | 2, a: number): Quat => {
  const q: Quat = [0, 0, 0, Math.cos(a / 2)];
  q[axis] = Math.sin(a / 2);
  return q;
};

export const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
};

/** Rounded to the nanosecond, so float noise does not reach a clip's times. */
export const r9 = (v: number): number => Math.round(v * 1e9) / 1e9;
/** Rounded to a millionth, for track values. */
export const r6 = (v: number): number => Math.round(v * 1e6) / 1e6 + 0;

export const TAU = Math.PI * 2;

/** `n + 1` sample times over `duration` seconds, the last closing the loop. */
export const loopTimes = (duration: number, n: number): number[] => Array.from({ length: n + 1 }, (_, k) => r9((k * duration) / n));

/** Smoothstep easing between keys. */
export const ease = (u: number): number => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};
