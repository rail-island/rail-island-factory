// The 3D preview's glazing: a material the drawing kit names as glass
// (`glass#rrggbb`, generator/previews/sketch.ts -- the structure previews and the
// props) turns see-through the way the game draws a station's glass
// (rail-island-webapp render/StationMesh.ts materialFor): faint, double-sided, not
// writing depth. The JS model itself stays opaque, so its bytes and the
// thumbnails do not change. A vehicle's windows (plain `glass`) stay opaque as in
// the game.

import { DoubleSide, Mesh, MeshStandardMaterial, type Object3D } from "three";

/** The opacity the game gives a station's glazing. */
export const GLASS_OPACITY = 0.28;

/** Whether a material name is the drawing kit's glass kind. */
export function isGlassMaterial(name: string): boolean {
  return name.startsWith("glass#");
}

/** Make every glass material under `root` see-through; returns how many it changed. */
export function applyGlass(root: Object3D): number {
  const done = new Set<MeshStandardMaterial>();
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(mat instanceof MeshStandardMaterial) || done.has(mat) || !isGlassMaterial(mat.name)) continue;
      mat.transparent = true;
      mat.opacity = GLASS_OPACITY;
      mat.depthWrite = false;
      mat.side = DoubleSide;
      mat.forceSinglePass = true;
      mat.needsUpdate = true;
      done.add(mat);
    }
  });
  return done.size;
}
