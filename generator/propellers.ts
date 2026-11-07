// Turning propellers (docs/models/animation.md, "Propellers"): an aircraft's or
// the airship's propellers drawn as parts (`MeshCore.spin`, pivoted on the hub)
// and the clip `propellers` that turns them, drive `time`. Shared by the airframe
// kit, the airship and the small airplane.

import type { MeshBuilder } from "./meshBuilder.ts";
import { seeThrough, type MaterialSpec, type Vec3 } from "./meshCore.ts";

/** Seconds a propeller takes for one turn on the clip: a visual rate, not the real one. */
export const PROP_PERIOD = 0.24;
/** Steps a turn is sampled at (30 degrees: under half a turn, so the interpolation turns the right way). */
export const PROP_SAMPLES = 12;
/** The clip's name. */
export const PROP_CLIP = "propellers";

/** A propeller part: its node name, the unit axis it turns about and its sense (1: right-handed about the axis). */
export interface PropellerNode {
  node: string;
  axis: Vec3;
  dir: 1 | -1;
  /** Its blur disc's node (blurDisc), which the clip `spin` grows in at full speed. */
  disc?: string;
}

/** The quaternion (x, y, z, w) of a turn by `t` about the unit axis. */
export const axisQuat = (axis: Vec3, t: number): number[] => [axis[0] * Math.sin(t / 2), axis[1] * Math.sin(t / 2), axis[2] * Math.sin(t / 2), Math.cos(t / 2)];

/**
 * Adds the clip `propellers`: every node turns once in PROP_PERIOD about its axis,
 * PROP_SAMPLES steps and the closing sample (the first pose again), drive `time`,
 * and the clip `spin` over the propellers' blur discs. A model without propellers
 * gets neither.
 */
export function turnPropellers(m: MeshBuilder, nodes: readonly PropellerNode[]): void {
  if (nodes.length === 0) return;
  // the blur discs grow in on the clip `spin` (below)
  spinClip(m, nodes.flatMap((p) => (p.disc ? [p.disc] : [])));
  const times = Array.from({ length: PROP_SAMPLES + 1 }, (_, i) => (i * PROP_PERIOD) / PROP_SAMPLES);
  m.animate({
    name: PROP_CLIP, times, drive: { drive: "time" },
    tracks: nodes.map((p) => ({ node: p.node, path: "rotation" as const, values: times.flatMap((_, i) => axisQuat(p.axis, (p.dir * i * 2 * Math.PI) / PROP_SAMPLES)) })),
  });
}

// --- spinning up and the blur disc (docs/models/animation.md, "Spin") -----------------

/** The clip that runs every rotor and propeller from stopped (time 0) to full speed (time 1). */
export const SPIN_CLIP = "spin";
/** Steps the spin clip is sampled at. */
export const SPIN_SAMPLES = 8;
/** The spin (0..1) from which the blur disc grows in, reaching its full size at 1. */
export const BLUR_FROM = 0.75;
/** The disc's scale while hidden: tiny rather than 0, so no transform degenerates. */
export const BLUR_HIDDEN = 0.001;
/** A stopped main rotor's blades droop this far at the tip (radians): 3 degrees. */
export const BLADE_DROOP = (3 * Math.PI) / 180;
/** The blur disc's material name and spec (MaterialSpec.opacity). */
export const BLUR_MATERIAL = "blur";
export const BLUR_SPEC: MaterialSpec = /* @__PURE__ */ seeThrough({ color: "#33363b", roughness: 0.7, doubleSided: true }, 0.22);
/** Corners of a blur disc's rim. */
const DISC_SIDES = 32;

/** A blade drooping when stopped: its node (pivot on the hub) and the horizontal axis it tips down about. */
export interface DroopNode {
  node: string;
  axis: Vec3;
}

/**
 * Draws the blur disc of a rotor or propeller as the child node `node`, pivoted on
 * `hub`: a thin see-through plate of radius `r` square to the unit `axis` it turns
 * about, `lift` along the axis from the hub (clear of the blades' plane). Call it
 * inside the turning part, so the disc stands where the blades turn.
 */
export function blurDisc(m: MeshBuilder, node: string, hub: Vec3, axis: Vec3, r: number, lift = 0): void {
  m.spin(node, hub, () => m.scope("blur disc", () => discFan(m, hub, axis, r, lift, DISC_SIDES)));
}

/**
 * A distant level's blur disc, standing still with the model (an LOD has no clips):
 * the same plate with `sides` corners, drawn where it is called.
 */
export function lodBlurDisc(m: MeshBuilder, hub: Vec3, axis: Vec3, r: number, lift = 0, sides = 8): void {
  discFan(m, hub, axis, r, lift, sides);
}

/** A flat fan of `sides` triangles of radius `r` square to `axis`, `lift` along it from `hub`, in the blur material (double-sided). */
function discFan(m: MeshBuilder, hub: Vec3, axis: Vec3, r: number, lift: number, sides: number): void {
  // two unit vectors across the axis
  const ref: Vec3 = Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const u = norm(cross(axis, ref));
  const v = norm(cross(axis, u));
  const c: Vec3 = [hub[0] + axis[0] * lift, hub[1] + axis[1] * lift, hub[2] + axis[2] * lift];
  const rim = Array.from({ length: sides }, (_, i) => {
    const t = (i * 2 * Math.PI) / sides;
    return [c[0] + r * (u[0] * Math.cos(t) + v[0] * Math.sin(t)), c[1] + r * (u[1] * Math.cos(t) + v[1] * Math.sin(t)), c[2] + r * (u[2] * Math.cos(t) + v[2] * Math.sin(t))] as Vec3;
  });
  m.facets(BLUR_MATERIAL, rim.flatMap((p, i) => [c, p, rim[(i + 1) % sides]!]), axis);
}

/**
 * Adds the clip `spin` (drive `spin`, times 0 to 1): at 1 - the rest pose - every
 * blur disc is full size and every blade level; towards 0 each disc shrinks away
 * below BLUR_FROM and each drooping blade tips down BLADE_DROOP. The turning itself
 * stays on the time clips; a game that drives `spin` slows those with it. Nothing
 * listed, no clip.
 */
export function spinClip(m: MeshBuilder, discs: readonly string[], droops: readonly DroopNode[] = []): void {
  if (!discs.length && !droops.length) return;
  const times = Array.from({ length: SPIN_SAMPLES + 1 }, (_, i) => i / SPIN_SAMPLES);
  const grow = (t: number): number => (t <= BLUR_FROM ? BLUR_HIDDEN : Math.max(BLUR_HIDDEN, (t - BLUR_FROM) / (1 - BLUR_FROM)));
  m.animate({
    name: SPIN_CLIP, times, drive: { drive: "spin" },
    tracks: [
      ...discs.map((node) => ({ node, path: "scale" as const, values: times.flatMap((t) => { const k = grow(t); return [k, k, k]; }) })),
      ...droops.map((d) => ({ node: d.node, path: "rotation" as const, values: times.flatMap((t) => axisQuat(d.axis, BLADE_DROOP * (1 - t)).map((q) => q + 0)) })),
    ],
  });
}
