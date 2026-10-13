// The numbers the catalog lists for one GLB: geometry counts and the world-space
// bounding box. Counts are what the GPU draws -- a mesh used by two nodes counts
// twice -- and the box comes from the decoded triangles rather than the accessors'
// min/max, so a node transform is honoured.

import { collectTriangles, parseGlb, triBounds, type Vec3 } from "./glbTriangles.ts";

export interface GlbStats {
  triangles: number;
  vertices: number;
  /** Draw calls: one per triangle primitive. */
  primitives: number;
  materials: number;
  min: Vec3;
  max: Vec3;
}

export function glbStats(glb: Uint8Array): GlbStats {
  const { json, bin } = parseGlb(glb);
  let vertices = 0;
  let primitives = 0;
  const visit = (nodeIndex: number): void => {
    const node = json.nodes?.[nodeIndex];
    if (!node) return;
    if (node.mesh != null) {
      for (const prim of json.meshes?.[node.mesh]?.primitives ?? []) {
        if ((prim.mode ?? 4) !== 4 || prim.attributes.POSITION == null) continue;
        vertices += json.accessors?.[prim.attributes.POSITION]?.count ?? 0;
        primitives += 1;
      }
    }
    for (const c of node.children ?? []) visit(c);
  };
  for (const n of json.scenes?.[json.scene ?? 0]?.nodes ?? []) visit(n);
  const tris = collectTriangles(json, bin);
  const { min, max } = tris.length ? triBounds(tris) : { min: [0, 0, 0] as Vec3, max: [0, 0, 0] as Vec3 };
  return { triangles: tris.length, vertices, primitives, materials: json.materials?.length ?? 0, min, max };
}
