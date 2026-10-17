// The dedicated low level of detail of the fountains (fountains.ts): see lodBuildings.ts and
// docs/models/lod.md. No windows; masses, roofs and the kit's colours.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { lodNgon, lodPolygon, lodPrism } from "./lodKit.ts";
import { palette as fountainPalette } from "./fountains.ts";
import { type XZ, bounds, lodBox, part, fit, lodRect, lodWalls, lodCap, lodFrustum, lodSpire, lodRevolve } from "./lodBuildings.ts";

// --- the fountains (fountains.ts) ---------------------------------------------------------------

/** A basin from afar: its stone wall, the trim rim sloping in to the water, and the water. */
function lodBasin(m: MeshBuilder, outer: readonly XZ[], inner: readonly XZ[], height: number): void {
  lodWalls(m, outer, [[0, height, "stone"]]);
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const [a, b, c, d] = [outer[i]!, outer[j]!, inner[j]!, inner[i]!];
    lodPolygon(m, "trim", [[a[0], height, a[1]], [b[0], height, b[1]], [c[0], height - 0.1, c[1]], [d[0], height - 0.1, d[1]]], [0, 1, 0]);
  }
  lodCap(m, "water", inner, height - 0.1);
}

export function classicalFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodNgon(10, 3.35), lodNgon(10, 3.02), 0.55);
    lodWalls(m, lodNgon(6, 0.24), [[0.45, 2.8, "stone"]]);
    for (const [y, r] of [[1.6, 1.32], [2.5, 0.62]] as const) {
      lodRevolve(m, "stone", 6, 0, 0, [[r * 0.22, y - 0.32], [r, y + 0.04]], 0, false);
      lodCap(m, "water", lodNgon(6, r), y + 0.04);
    }
    lodSpire(m, "stone", lodNgon(6, 0.16), 2.54, 2.95);
  })]);
}

export function modernFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodRect(0, 0, 6.4, 6.4), lodRect(0, 0, 5.9, 5.9), 0.45);
    for (const x of [-1.7, 0, 1.7]) for (const z of [-1.7, 0, 1.7]) lodPrism(m, "bronze", lodNgon(3, 0.16, x, z, Math.PI / 2), 0.3, 0.45, "trim");
  })]);
}

export function obeliskFountainLod(): MeshBuilder {
  return fit(fountainPalette, [part((m) => {
    lodBasin(m, lodNgon(8, 3.3, 0, 0, Math.PI / 8), lodNgon(8, 2.98, 0, 0, Math.PI / 8), 0.5);
    lodBox(m, "granite", 0, 0, 1.3, 1.3, 0.4, 1.35);
    lodBox(m, "granite", 0, 0, 1.6, 1.6, 1.35, 1.53);
    lodFrustum(m, "granite", bounds(0, 0, 0.96, 0.96), 1.53, bounds(0, 0, 0.65, 0.65), 5.02, null);
    lodSpire(m, "bronze", lodRect(0, 0, 0.65, 0.65), 5.02, 5.48);
    for (const [dx, dz] of [[1, 0], [0, -1], [-1, 0], [0, 1]] as const) {
      const n: Vec3 = [dx, 0, dz];
      const at = (u: number, y: number): Vec3 => [dx * 0.95 + dz * u, y, dz * 0.95 - dx * u];
      lodPolygon(m, "bronze", [at(-0.15, 0.8), at(0.15, 0.8), at(0.15, 0.94), at(-0.15, 0.94)], n);
      lodPolygon(m, "bronze", [at(-0.15, 0.94), at(0.15, 0.94), [dx * 0.65 + dz * 0.15, 0.94, dz * 0.65 - dx * 0.15], [dx * 0.65 - dz * 0.15, 0.94, dz * 0.65 + dx * 0.15]], [0, 1, 0]);
    }
  })]);
}
