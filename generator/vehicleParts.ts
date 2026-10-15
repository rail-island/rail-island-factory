// Shared helpers of the procedural vehicles (vehicles.ts, cd163.ts, buses.ts):
// closed boxes, bent plates and arcs drawn through the mesh builder's sweep, and
// the steered front wheels every road vehicle has.

import type { MeshBuilder, Ring } from "./meshBuilder.ts";

/** A closed box spanning x0..x1, y0..y1, z0..z1 -- all six faces, as a sweep along x. */
export function block(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const s: Ring = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  m.sweep(mat, "x", s, x0, s, x1);
}

/** The z range a..b (both >= 0) on the side `s` (+1 right, -1 left), low end first. */
export function side(s: number, a: number, b: number): [number, number] {
  return s > 0 ? [a, b] : [-b, -a];
}

/**
 * A bent plate seen from the side: quads between two parallel (x, y) polylines,
 * swept across z0..z1. Each quad is convex even where the plate as a whole is
 * not, which is what a sweep needs -- a fender is an arch of these.
 */
export function plate(m: MeshBuilder, mat: string, outer: Ring, inner: Ring, z0: number, z1: number): void {
  for (let i = 0; i + 1 < outer.length; i++) {
    const q: Ring = [outer[i]!, outer[i + 1]!, inner[i + 1]!, inner[i]!];
    m.sweep(mat, "z", q, z0, q, z1);
  }
}

/** Points on the arc about (cx, cy) of radius r from angle a0 to a1 (radians, 0 = +x), n segments. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): Ring {
  const out: Ring = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/**
 * The two wheels of a steered axle, each a part inside `parent`'s node with its
 * pivot at the wheel's centre: the game turns it about the pivot's vertical
 * (vehicle-rig.md). Returns the rig's node pair, the -Z wheel first. The names
 * say left for -Z, as the factory's frame has it (+Z right); a design whose
 * frame has +Z left passes its own `names` ([-Z, +Z]). `axle` numbers the
 * second steered axle of a vehicle with two: wheel-front-2-left, ...
 */
export function steeredWheels(
  m: MeshBuilder, parent: string, x: number, axleY: number, draw: (s: number, z0: number, z1: number) => void,
  tyre: [number, number], names: [string, string] = ["wheel-front-left", "wheel-front-right"],
): [string, string] {
  for (const s of [-1, 1]) {
    const [z0, z1] = side(s, tyre[0], tyre[1]);
    m.part(names[s < 0 ? 0 : 1], [x, axleY, (z0 + z1) / 2], () => draw(s, z0, z1), parent);
  }
  return names;
}
