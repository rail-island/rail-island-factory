// The 3D preview's source-tree highlight, apart from the viewer so the tests can
// drive it without a WebGL context: the GLB loads as one mesh per material, and
// the tree's triangle ranges become draw groups on those meshes -- the selected
// node's triangles glow, the rest turn into a faint ghost. Nothing is split or
// re-uploaded; selecting nothing hands every mesh its built material back.

import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from "three";
import type { TriRange } from "./sourceTreeView";

/** One material's mesh of the loaded GLB, with its highlight and ghost variants. */
export interface Part {
  mesh: Mesh;
  /** The GLB material's name, which the source tree's ranges are keyed by. */
  name: string;
  base: Material;
  glow: MeshStandardMaterial;
  ghost: MeshStandardMaterial;
}

export function makeParts(root: Object3D): Part[] {
  const parts: Part[] = [];
  root.traverse((o) => {
    if (!(o instanceof Mesh) || Array.isArray(o.material)) return;
    const base = o.material as MeshStandardMaterial;
    const glow = base.clone();
    glow.emissive = new Color(0xffa040);
    glow.emissiveIntensity = 0.55;
    const ghost = base.clone();
    ghost.transparent = true;
    ghost.opacity = 0.12;
    ghost.depthWrite = false;
    parts.push({ mesh: o, name: base.name, base, glow, ghost });
  });
  return parts;
}

/** Shows `ranges` glowing and the rest ghosted, or -- with null -- every part as built. */
export function applyHighlight(parts: readonly Part[], ranges: ReadonlyMap<string, readonly TriRange[]> | null): void {
  for (const p of parts) {
    const g = p.mesh.geometry;
    g.clearGroups();
    if (!ranges) {
      p.mesh.material = p.base;
      continue;
    }
    const runs = ranges.get(p.name);
    if (!runs || runs.length === 0) {
      p.mesh.material = p.ghost;
      continue;
    }
    // non-indexed triangle soup: triangle i is vertices 3i..3i+2
    p.mesh.material = [p.ghost, p.glow];
    const total = g.getAttribute("position").count / 3;
    let at = 0;
    for (const [first, count] of runs) {
      if (first > at) g.addGroup(at * 3, (first - at) * 3, 0);
      g.addGroup(first * 3, count * 3, 1);
      at = first + count;
    }
    if (at < total) g.addGroup(at * 3, (total - at) * 3, 0);
  }
}
