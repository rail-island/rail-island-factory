// Rolling wheels: the clip that turns a vehicle's wheels when they carry something
// the eye can follow round -- spokes, wheel nuts -- on a vehicle without running
// gear of its own (a steam locomotive's "running" clip turns its wheels with the
// rods, steamGear.ts). A plain wheel, only rings about its axle, looks the same at
// any angle and is not turned. Each wheel (or wheelset) is drawn as a `spin` part
// pivoted on its axle (MeshCore.spin); `rollWheels` adds the clip that turns them
// all about +Z, one revolution per cycle, played by distance like the steam clip.
// See docs/models/animation.md.

import type { MeshCore } from "./meshCore.ts";

/** The clip's name. */
export const ROLLING_CLIP = "rolling";

/**
 * The speed the clip runs at, in metres per second: one cycle lasts as long as the
 * wheel takes to roll its circumference at this speed. The steam clip's
 * RUNNING_SPEED, so every distance clip of the catalog plays at one rate.
 */
export const ROLLING_SPEED = 5;

/** Samples per revolution (plus the closing one): 22.5 degrees apart. */
export const ROLLING_SAMPLES = 16;

const quatZ = (a: number): number[] => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];

/**
 * Adds the "rolling" clip: every node in `nodes` -- spin parts already drawn, all
 * wheels of one diameter `d` (metres) -- turns once per cycle about its pivot's
 * +Z, clockwise seen from the right, which is rolling toward +X. Drive `distance`
 * at ROLLING_SPEED: a consumer plays it at `timeScale = v / ROLLING_SPEED`.
 */
export function rollWheels(m: MeshCore, nodes: readonly string[], d: number): void {
  if (!nodes.length || !(d > 0)) throw new Error("rollWheels(): needs wheels and a diameter");
  const duration = (Math.PI * d) / ROLLING_SPEED;
  const times = Array.from({ length: ROLLING_SAMPLES + 1 }, (_, k) => Math.round(((k * duration) / ROLLING_SAMPLES) * 1e6) / 1e6);
  const values = times.flatMap((_, k) => quatZ((-2 * Math.PI * k) / ROLLING_SAMPLES));
  m.animate({
    name: ROLLING_CLIP,
    times,
    tracks: nodes.map((node) => ({ node, path: "rotation" as const, values: [...values] })),
    drive: { drive: "distance", speed: ROLLING_SPEED },
  });
}
