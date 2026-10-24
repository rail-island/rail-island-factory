// The ways' drawing kit (docs/models/previews.md): one track -- ballast bed,
// sleepers, rails -- in the game's measures, shared by the rail type pages and the
// bridge pages (which lay it on a deck). No node: imports: preview JS models bundle it.

import type { SurfaceId } from "../surfaces.ts";
import type { Sketch, Rgb } from "./sketch.ts";

// the game's track measures (studs): the ballast bed's foot and slope, the sleepers,
// the rails and their gauge, the railhead, and the overhead wires above it
export const BED_Y = 0.67, BED_SLOPE = 0.9;
/** The ballast proper, above the bed's foot (railType's bed height). */
export const BALLAST_HEIGHT = (0.8 * 2) / 3;
export const TIE = { spacing: 2.2, width: 3.6, height: 0.35, depth: 0.8 };
export const GAUGE = 2.7, RAIL_W = 0.45, RAIL_H = 0.45;
export const BALLAST: Rgb = [168, 160, 150], STEEL: Rgb = [120, 120, 130];
export const CONTACT = 8.86, MESSENGER = 10.6, WIRE = 0.08, MAST_SPACING = 30;

/**
 * One track along +X centred at lateral `z`: bed, sleepers (unless `sleeper` is null),
 * rails; returns the railhead height. The bed stands on `baseY` (the ground, or a
 * bridge deck's top) up to `bedTop`.
 */
export function track(s: Sketch, length: number, z: number, sleeper: { color: Rgb; surface: SurfaceId } | null, lod: boolean, bedTop = BED_Y + BALLAST_HEIGHT, bedWidth = 5, baseY = 0): number {
  const half = bedWidth / 2;
  s.sweep(s.mat("ballast", BALLAST, "rail-ballast"), [[-length / 2, baseY, z], [length / 2, baseY, z]],
    [[half + BED_SLOPE, baseY], [half, bedTop], [-half, bedTop], [-half - BED_SLOPE, baseY]], true);
  if (sleeper && !lod) {
    const tie = s.mat("wood", sleeper.color, sleeper.surface);
    for (let x = -length / 2 + TIE.spacing / 2; x < length / 2; x += TIE.spacing) s.box(tie, { cx: x, cy: bedTop + TIE.height / 2, cz: z, sx: TIE.depth, sy: TIE.height, sz: TIE.width });
  }
  const railY = bedTop + TIE.height + RAIL_H / 2;
  if (!lod) for (const side of [-1, 1]) s.box(s.mat("steel", STEEL), { cx: 0, cy: railY, cz: z + side * GAUGE / 2, sx: length, sy: RAIL_H, sz: RAIL_W });
  return railY + RAIL_H / 2;
}

