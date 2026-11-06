// Turning propellers (docs/models/animation.md, "Propellers"): an aircraft's or
// the airship's propellers drawn as parts (`MeshCore.spin`, pivoted on the hub)
// and the clip `propellers` that turns them, drive `time`. Shared by the airframe
// kit, the airship and the small airplane.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";

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
}

/** The quaternion (x, y, z, w) of a turn by `t` about the unit axis. */
export const axisQuat = (axis: Vec3, t: number): number[] => [axis[0] * Math.sin(t / 2), axis[1] * Math.sin(t / 2), axis[2] * Math.sin(t / 2), Math.cos(t / 2)];

/**
 * Adds the clip `propellers`: every node turns once in PROP_PERIOD about its axis,
 * PROP_SAMPLES steps and the closing sample (the first pose again), drive `time`.
 * A model without propellers gets no clip.
 */
export function turnPropellers(m: MeshBuilder, nodes: readonly PropellerNode[]): void {
  if (nodes.length === 0) return;
  const times = Array.from({ length: PROP_SAMPLES + 1 }, (_, i) => (i * PROP_PERIOD) / PROP_SAMPLES);
  m.animate({
    name: PROP_CLIP, times, drive: { drive: "time" },
    tracks: nodes.map((p) => ({ node: p.node, path: "rotation" as const, values: times.flatMap((_, i) => axisQuat(p.axis, (p.dir * i * 2 * Math.PI) / PROP_SAMPLES)) })),
  });
}
