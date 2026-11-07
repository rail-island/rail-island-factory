// Where a ship meets the water (docs/models/vehicle-rig.md, "The water rig"): the
// game's wake, bow wave and churn foam are drawn from the stem and the stern on the
// waterline, the waterline's greatest half-breadth and the places the ship's
// screws, paddle wheels or air propellers stir the surface. The hull kit
// (hullKit.ts shipWaterRig) and the older hand-drawn ships (ships.ts) both measure
// the outline here, off the drawn triangles, so the numbers follow the model.

import type { Vec3, WaterChurn, WaterRig } from "./rig.ts";

export type { WaterChurn, WaterRig } from "./rig.ts";

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/**
 * Measures a ship's water rig off its vertex positions (x, y, z triples, model
 * frame, metres): every vertex at or below the waterline `draft` (plus a small
 * tolerance, so a triangle crossing it still counts) spans the waterline outline.
 * `along` is the axis the bow points along (+X for the hull kit, +Z for a model
 * drawn bow-first along Z). `churn` is passed through.
 */
export function measureWaterRig(pos: readonly number[], draft: number, along: "x" | "z", churn: readonly WaterChurn[]): WaterRig {
  const tol = Math.max(0.05, draft * 0.05);
  const a = along === "x" ? 0 : 2;
  const b = along === "x" ? 2 : 0;
  let lo = Infinity;
  let hi = -Infinity;
  let half = 0;
  for (let i = 0; i + 2 < pos.length; i += 3) {
    if (pos[i + 1]! > draft + tol) continue;
    const u = pos[i + a]!;
    if (u < lo) lo = u;
    if (u > hi) hi = u;
    half = Math.max(half, Math.abs(pos[i + b]!));
  }
  if (!Number.isFinite(lo)) throw new Error("measureWaterRig(): nothing at or below the waterline");
  const at = (u: number): Vec3 => (along === "x" ? [round3(u), round3(draft), 0] : [0, round3(draft), round3(u)]);
  return { bow: at(hi), stern: at(lo), halfBeam: round3(half), draft: round3(draft), churn: churn.map((ch) => ({ kind: ch.kind, at: [...ch.at] as Vec3, width: ch.width })) };
}
