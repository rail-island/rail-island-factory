// The ways' drawing kit (docs/models/previews.md): one track -- ballast bed,
// sleepers, rails -- in the game's measures, shared by the rail type pages and the
// bridge pages (which lay it on a deck). No node: imports: preview JS models bundle it.

import type { SurfaceId } from "../surfaces.ts";
import type { Sketch, Rgb } from "./sketch.ts";
import * as railType from "../sets/railType.ts";

// the game's track measures (studs): the ballast bed's foot and slope, how far the
// sleeper tops stand above the ballast filled up between them, and the overhead
// wires above the railhead. The rails and the sleepers are the rail type set's
// (every type shares one cross-section).
export const BED_Y = 0.67, BED_SLOPE = 0.9, TIE_PROUD = 0.065;
/** The ballast proper, above the bed's foot (railType's bed height). */
export const BALLAST_HEIGHT = (0.8 * 2) / 3;
const SECTION = railType.TYPE_META.wooden_sleepers!;
export const RAIL = SECTION.rail;
export const TIE = SECTION.sleeper;
/** Rail centre to rail centre, and the railhead's width. */
export const GAUGE = RAIL.gauge, RAIL_W = RAIL.headWidth;
export const BALLAST: Rgb = [168, 160, 150], STEEL: Rgb = [120, 120, 130];
export const CONTACT = 8.86, MESSENGER = 10.6, WIRE = 0.08, MAST_SPACING = 30;

/** The two rails of a track centred at lateral `z`, their foot at `y`: foot, web and head each a box. */
export function rails(s: Sketch, length: number, z: number, y: number): void {
  const steel = s.mat("steel", STEEL);
  const webHeight = RAIL.height - RAIL.footHeight - RAIL.headHeight;
  for (const side of [-1, 1]) {
    const cz = z + side * RAIL.gauge / 2;
    s.box(steel, { cx: 0, cy: y + RAIL.footHeight / 2, cz, sx: length, sy: RAIL.footHeight, sz: RAIL.footWidth });
    s.box(steel, { cx: 0, cy: y + RAIL.footHeight + webHeight / 2, cz, sx: length, sy: webHeight, sz: RAIL.webWidth });
    s.box(steel, { cx: 0, cy: y + RAIL.height - RAIL.headHeight / 2, cz, sx: length, sy: RAIL.headHeight, sz: RAIL.headWidth });
  }
}

/**
 * One track along +X centred at lateral `z`: bed, sleepers (unless `sleeper` is null),
 * rails; returns the railhead height. The bed stands on `baseY` (the ground, or a
 * bridge deck's top) up to `bedTop`; the sleeper tops stand TIE_PROUD over it and
 * the rails on them.
 */
export function track(s: Sketch, length: number, z: number, sleeper: { color: Rgb; surface: SurfaceId } | null, lod: boolean, bedTop = BED_Y + BALLAST_HEIGHT, bedWidth = 5, baseY = 0): number {
  const half = bedWidth / 2;
  s.sweep(s.mat("ballast", BALLAST, "rail-ballast"), [[-length / 2, baseY, z], [length / 2, baseY, z]],
    [[half + BED_SLOPE, baseY], [half, bedTop], [-half, bedTop], [-half - BED_SLOPE, baseY]], true);
  const tieTop = bedTop + TIE_PROUD;
  if (sleeper && !lod) {
    const mat = s.mat("wood", sleeper.color, sleeper.surface);
    for (let x = -length / 2 + TIE.spacing / 2; x < length / 2; x += TIE.spacing) s.box(mat, { cx: x, cy: tieTop - TIE.height / 2, cz: z, sx: TIE.width, sy: TIE.height, sz: TIE.length });
  }
  if (!lod) rails(s, length, z, tieTop);
  return tieTop + RAIL.height;
}

/**
 * One track along Z centred at lateral `x` (a station's tracks run along its Z): a flat
 * ballast bed `bedWidth` wide from the ground to the game's bed top, sleepers (unless
 * `sleeper` is null or `lod`), rails; returns the railhead height - the game's own
 * section, so what stands on it (a parked train, the catenary) stands as in the game.
 */
export function trackAlongZ(s: Sketch, length: number, x: number, sleeper: Rgb | null, lod: boolean, bedWidth = 5): number {
  const bedTop = BED_Y + BALLAST_HEIGHT;
  s.box(s.mat("edge", BALLAST, "rail-ballast"), { cx: x, cy: bedTop / 2, cz: 0, sx: bedWidth, sy: bedTop, sz: length });
  const tieTop = bedTop + TIE_PROUD;
  if (lod) return tieTop + RAIL.height;
  if (sleeper) {
    const mat = s.mat("platform", sleeper);
    for (let z = -length / 2 + TIE.spacing / 2; z < length / 2; z += TIE.spacing) s.box(mat, { cx: x, cy: tieTop - TIE.height / 2, cz: z, sx: TIE.length, sy: TIE.height, sz: TIE.width });
  }
  const steel = s.mat("steel", STEEL);
  const webHeight = RAIL.height - RAIL.footHeight - RAIL.headHeight;
  for (const side of [-1, 1]) {
    const cx = x + side * RAIL.gauge / 2;
    s.box(steel, { cx, cy: tieTop + RAIL.footHeight / 2, cz: 0, sx: RAIL.footWidth, sy: RAIL.footHeight, sz: length });
    s.box(steel, { cx, cy: tieTop + RAIL.footHeight + webHeight / 2, cz: 0, sx: RAIL.webWidth, sy: webHeight, sz: length });
    s.box(steel, { cx, cy: tieTop + RAIL.height - RAIL.headHeight / 2, cz: 0, sx: RAIL.headWidth, sy: RAIL.headHeight, sz: length });
  }
  return tieTop + RAIL.height;
}

/** The railhead's height over the ground of a track on the game's bed (trackAlongZ). */
export const RAILHEAD_Y = BED_Y + BALLAST_HEIGHT + TIE_PROUD + RAIL.height;
