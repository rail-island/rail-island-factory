// GLB geometry reader: decodes a .glb's default scene into world-space triangles.
// No three.js and no DOM -- it walks the node hierarchy itself and reads the
// POSITION/NORMAL accessors straight out of the BIN chunk.
//
// Only what the factory's own models use is supported: indexed and non-indexed
// triangle primitives, float POSITION/NORMAL and baseColorFactor materials.
// Textures are ignored (a textured primitive shades with its factor alone) --
// the mesh builder never writes one.

import { type Gltf, type Vec3, type Mat4, parseGlb, readAccessor, ident, mul, trs, xformPoint, xformDir, norm, cross, sub } from "./glbParse.ts";

export type { Mat4, Vec3, Gltf } from "./glbParse.ts";
export { parseGlb, xformPoint, norm, sub, cross, dot } from "./glbParse.ts";

/** One world-space triangle: positions, normals and the primitive's flat base colour. */
export interface Tri {
  p: [Vec3, Vec3, Vec3]; // world position
  n: [Vec3, Vec3, Vec3]; // world normal
  color: Vec3; // linear base colour
  /** The material's opacity, when it blends (alphaMode BLEND: a blur disc); absent for opaque. */
  alpha?: number;
  /** Corner colours (COLOR_0, linear multipliers of `color`), when the primitive has them. */
  corners?: [Vec3, Vec3, Vec3];
  /** The primitive's material name, or `#<index>` when it has none. */
  material: string;
  /** True for a triangle of a vehicle's interior (collected only when asked for). */
  interior?: boolean;
  /** True for a triangle of a freight vehicle's load (collected only when asked for, docs/models/loads.md). */
  load?: boolean;
  /** True when its material is drawn from both sides (the game culls every other triangle's back). */
  doubleSided?: boolean;
}

/**
 * What collectTriangles reads besides the model at rest: a vehicle's `interiors`,
 * and its `loads` (docs/models/loads.md) -- every load part (true) or those
 * standing for one commodity (its id) -- shown `fill` full (0..1, 1 by default)
 * as the game shows them: a stepped load's first `ceil(fill * steps)` steps, a
 * heap scaled in y from its pivot; nothing at 0.
 */
export interface CollectOptions {
  interiors?: boolean;
  loads?: boolean | string;
  fill?: number;
}

/** A GLB's load parts as its scene's `extras.loads` lists them (docs/models/loads.md); empty without any. */
export function loadEntries(json: Gltf): Array<{ part: string; commodities: string[]; steps?: number }> {
  return (json.scenes?.[json.scene ?? 0] as { extras?: { loads?: Array<{ part: string; commodities: string[]; steps?: number }> } } | undefined)?.extras?.loads ?? [];
}

/** How many of a stepped load's `steps` the game shows at `fill` (0..1). */
export function shownSteps(steps: number, fill: number): number {
  return Math.ceil(Math.min(1, Math.max(0, fill)) * steps - 1e-9);
}

/** The first commodity of a GLB's first load part (the thumbnails' loaded look), or null for a model without loads. */
export function firstLoad(json: Gltf): string | null {
  return loadEntries(json)[0]?.commodities[0] ?? null;
}

/** Every commodity a GLB's load parts stand for, in their order, each once (docs/models/loads.md). */
export function loadCommodities(glb: Uint8Array): string[] {
  const { json } = parseGlb(glb);
  const loads = (json.scenes?.[json.scene ?? 0] as { extras?: { loads?: Array<{ commodities: string[] }> } } | undefined)?.extras?.loads ?? [];
  return [...new Set(loads.flatMap((l) => l.commodities))];
}

export function collectTriangles(json: Gltf, bin: Uint8Array, opts: CollectOptions = {}): Tri[] {
  const tris: Tri[] = [];
  const fill = Math.min(1, Math.max(0, opts.fill ?? 1));
  const stepsOf = new Map(loadEntries(json).map((l) => [l.part, l.steps ?? 0]));
  const visit = (nodeIndex: number, parent: Mat4, inside = false, inLoad = false, shown = Infinity): void => {
    const node = json.nodes?.[nodeIndex];
    if (!node) return;
    // a vehicle's interior is hidden while its doors are shut, so the model at
    // rest (thumbnails, stats, budgets) leaves it out (docs/models/interiors.md)
    if (node.extras?.interior && !opts.interiors) return;
    // a freight vehicle's load is hidden while it carries nothing (docs/models/loads.md)
    const load = (node.extras as { load?: string[] } | undefined)?.load;
    if (load && !(opts.loads === true || (typeof opts.loads === "string" && load.includes(opts.loads)))) return;
    if (load && fill <= 0) return;
    // a stepped load shows its first steps, a heap scales in y from its pivot
    const steps = load ? (stepsOf.get(node.name ?? "") ?? 0) : 0;
    const step = /^step-(\d+)$/.exec(node.name ?? "");
    if (inLoad && step && Number(step[1]) >= shown) return;
    const loadTri = inLoad || !!load;
    const interior = inside || !!node.extras?.interior;
    let world = mul(parent, node.matrix ? (node.matrix as Mat4) : trs(node.translation, node.rotation, node.scale));
    if (load && !steps && fill < 1) world = mul(world, trs(undefined, undefined, [1, fill, 1]));
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
        const doubleSided = prim.material != null && json.materials?.[prim.material]?.doubleSided === true;
        const blend = prim.material != null && (json.materials?.[prim.material] as { alphaMode?: string } | undefined)?.alphaMode === "BLEND";
        const alpha = blend ? (factor[3] ?? 1) : undefined;
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
          tris.push({ p: p as [Vec3, Vec3, Vec3], n: n as [Vec3, Vec3, Vec3], color, material, ...(corners ? { corners } : {}), ...(interior ? { interior } : {}), ...(loadTri ? { load: true } : {}), ...(doubleSided ? { doubleSided } : {}), ...(alpha !== undefined ? { alpha } : {}) });
        }
      }
    }
    for (const c of node.children ?? []) visit(c, world, interior, loadTri, load ? (steps ? shownSteps(steps, fill) : Infinity) : shown);
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
