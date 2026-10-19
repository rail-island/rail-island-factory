// GLB geometry reader: decodes a .glb's default scene into world-space triangles.
// No three.js and no DOM -- it walks the node hierarchy itself and reads the
// POSITION/NORMAL accessors straight out of the BIN chunk.
//
// Only what the factory's own models use is supported: indexed and non-indexed
// triangle primitives, float POSITION/NORMAL and baseColorFactor materials.
// Textures are ignored (a textured primitive shades with its factor alone) --
// the mesh builder never writes one.

import { type Gltf, type Vec3, type Mat4, readAccessor, ident, mul, trs, xformPoint, xformDir, norm, cross, sub } from "./glbParse.ts";

export type { Mat4, Vec3, Gltf } from "./glbParse.ts";
export { parseGlb, xformPoint, norm, sub, cross, dot } from "./glbParse.ts";

/** One world-space triangle: positions, normals and the primitive's flat base colour. */
export interface Tri {
  p: [Vec3, Vec3, Vec3]; // world position
  n: [Vec3, Vec3, Vec3]; // world normal
  color: Vec3; // linear base colour
  /** Corner colours (COLOR_0, linear multipliers of `color`), when the primitive has them. */
  corners?: [Vec3, Vec3, Vec3];
  /** The primitive's material name, or `#<index>` when it has none. */
  material: string;
}

export function collectTriangles(json: Gltf, bin: Uint8Array): Tri[] {
  const tris: Tri[] = [];
  const visit = (nodeIndex: number, parent: Mat4): void => {
    const node = json.nodes?.[nodeIndex];
    if (!node) return;
    const world = mul(parent, node.matrix ? (node.matrix as Mat4) : trs(node.translation, node.rotation, node.scale));
    if (node.mesh != null) {
      for (const prim of json.meshes?.[node.mesh]?.primitives ?? []) {
        if ((prim.mode ?? 4) !== 4) continue; // triangles only
        const posIdx = prim.attributes.POSITION;
        if (posIdx == null) continue;
        const pos = readAccessor(json, bin, posIdx);
        const nrm = prim.attributes.NORMAL != null ? readAccessor(json, bin, prim.attributes.NORMAL) : null;
        const col = prim.attributes.COLOR_0 != null ? readAccessor(json, bin, prim.attributes.COLOR_0) : null;
        const idx = prim.indices != null
          ? readAccessor(json, bin, prim.indices)
          : Array.from({ length: pos.length / 3 }, (_, i) => i);
        const factor = (prim.material != null
          ? json.materials?.[prim.material]?.pbrMetallicRoughness?.baseColorFactor
          : undefined) ?? [1, 1, 1, 1];
        const color: Vec3 = [factor[0], factor[1], factor[2]];
        const material = prim.material != null ? (json.materials?.[prim.material]?.name ?? `#${prim.material}`) : "default";
        for (let i = 0; i + 2 < idx.length; i += 3) {
          const p: Vec3[] = [];
          const n: Vec3[] = [];
          for (let k = 0; k < 3; k++) {
            const v = idx[i + k];
            p.push(xformPoint(world, [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]));
            n.push(nrm ? xformDir(world, [nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]]) : [0, 1, 0]);
          }
          if (!nrm) {
            const face = norm(cross(sub(p[1], p[0]), sub(p[2], p[0])));
            n[0] = n[1] = n[2] = face;
          }
          const corners = col
            ? (idx.slice(i, i + 3).map((v) => [col[v * 3], col[v * 3 + 1], col[v * 3 + 2]]) as [Vec3, Vec3, Vec3])
            : undefined;
          tris.push({ p: p as [Vec3, Vec3, Vec3], n: n as [Vec3, Vec3, Vec3], color, material, ...(corners ? { corners } : {}) });
        }
      }
    }
    for (const c of node.children ?? []) visit(c, world);
  };
  const scene = json.scenes?.[json.scene ?? 0];
  for (const n of scene?.nodes ?? []) visit(n, ident());
  return tris;
}

/** World-space axis-aligned bounds of a triangle soup. */
export function triBounds(tris: Tri[]): { min: Vec3; max: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const t of tris)
    for (const p of t.p)
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
  return { min, max };
}
