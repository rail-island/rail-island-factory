// The surface half of toGroup (threeBuilder.ts, docs/models/surfaces.md): the UVs of
// a material that names a surface, and the userData table listing those materials.
// jsModel.ts swaps this module for a no-op in the bundle of a design that names no
// surface, so only the designs that use one carry the code.

import type { MaterialSpec } from "./meshCore.ts";
import type { ThreeNamespace } from "./threeBuilder.ts";

type Geometry = InstanceType<ThreeNamespace["BufferGeometry"]>;

/** Give `geometry` its surface's UVs when `spec` names one (see boxUvs). */
export function surfaceUvs(THREE: ThreeNamespace, geometry: Geometry, spec: MaterialSpec, pos: readonly number[], pivot: readonly number[]): void {
  const uv = spec.surfaceTile ? boxUvs(pos, pivot, spec.surfaceTile) : null;
  if (uv) geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/**
 * UVs for a triangle soup by per-triangle box projection: each face takes u,v from
 * the two model axes its normal points least along, so one photo tiles at a fixed
 * size on walls and roofs alike. Positions are relative to `pivot`; the projection
 * uses model coordinates, so a part's photo lines up with the body's.
 */
function boxUvs(pos: readonly number[], pivot: readonly number[], tile: number): Float32Array {
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let t = 0; t + 8 < pos.length; t += 9) {
    const ux = pos[t + 3]! - pos[t]!, uy = pos[t + 4]! - pos[t + 1]!, uz = pos[t + 5]! - pos[t + 2]!;
    const vx = pos[t + 6]! - pos[t]!, vy = pos[t + 7]! - pos[t + 1]!, vz = pos[t + 8]! - pos[t + 2]!;
    const nx = Math.abs(uy * vz - uz * vy), ny = Math.abs(uz * vx - ux * vz), nz = Math.abs(ux * vy - uy * vx);
    for (let k = 0; k < 3; k++) {
      const x = pos[t + k * 3]! + pivot[0]!, y = pos[t + k * 3 + 1]! + pivot[1]!, z = pos[t + k * 3 + 2]! + pivot[2]!;
      const [u, v] = ny >= nx && ny >= nz ? [x, z] : nx >= nz ? [z, y] : [x, y];
      uv[(t / 3 + k) * 2] = u / tile;
      uv[(t / 3 + k) * 2 + 1] = v / tile;
    }
  }
  return uv;
}

/** List the materials that draw with a named surface on `root.userData.surfaces`, material name -> surface. */
export function surfaceTable(root: { userData: Record<string, unknown> }, palette: Readonly<Record<string, MaterialSpec>>, materials: readonly string[]): void {
  const named = materials.filter((mat) => palette[mat]!.surface);
  if (named.length) root.userData.surfaces = Object.fromEntries(named.map((mat) => [mat, palette[mat]!.surface!]));
}
