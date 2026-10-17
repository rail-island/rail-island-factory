// The 3D preview's source-tree highlight, apart from the viewer so the tests can
// drive it without a WebGL context: the JS model builds one mesh per material, and
// the tree's triangle ranges become draw groups on those meshes -- the selected
// node's triangles glow, the rest turn into a faint ghost. Nothing is split or
// re-uploaded; selecting nothing hands every mesh its built material back.
//
// A model with parts (an articulated vehicle's truck and trailer) has a mesh per
// material in EACH part's node. The tree numbers a material's triangles across
// the parts in node order, so each mesh carries the offset of its first one.

import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from "three";
import type { TriRange } from "./sourceTreeView";

/** One material's mesh of the built model, with its highlight and ghost variants. */
export interface Part {
  mesh: Mesh;
  /** The material's name, which the source tree's ranges are keyed by. */
  name: string;
  /** How many triangles of this material earlier meshes (earlier parts) hold. */
  offset: number;
  base: Material;
  glow: MeshStandardMaterial;
  ghost: MeshStandardMaterial;
}

export function makeParts(root: Object3D): Part[] {
  const parts: Part[] = [];
  const seen = new Map<string, number>();
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
    const offset = seen.get(base.name) ?? 0;
    seen.set(base.name, offset + triangleCount(o));
    parts.push({ mesh: o, name: base.name, offset, base, glow, ghost });
  });
  return parts;
}

/** A mesh's triangle count, indexed or not. */
function triangleCount(mesh: Mesh): number {
  const g = mesh.geometry;
  return (g.index ? g.index.count : g.getAttribute("position").count) / 3;
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
    const total = triangleCount(p.mesh);
    // the material's ranges that fall in this mesh, made local to it
    const runs: Array<[number, number]> = [];
    for (const [first, count] of ranges.get(p.name) ?? []) {
      const lo = Math.max(first, p.offset);
      const hi = Math.min(first + count, p.offset + total);
      if (hi > lo) runs.push([lo - p.offset, hi - lo]);
    }
    if (runs.length === 0) {
      p.mesh.material = p.ghost;
      continue;
    }
    // triangle i is vertices (or, indexed, indices) 3i..3i+2
    p.mesh.material = [p.ghost, p.glow];
    let at = 0;
    for (const [first, count] of runs) {
      if (first > at) g.addGroup(at * 3, (first - at) * 3, 0);
      g.addGroup(first * 3, count * 3, 1);
      at = first + count;
    }
    if (at < total) g.addGroup(at * 3, (total - at) * 3, 0);
  }
}
