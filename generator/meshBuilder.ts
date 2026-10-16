// The recording MeshBuilder of the procedural models (skyscrapers.ts,
// vehicles.ts): MeshCore's geometry (meshCore.ts) plus the source tree and the
// binary glTF. Pure Node, no three.js.
//
// A design draws a flat-shaded triangle soup per material; toGlb writes it as one
// self-contained GLB with plain baseColorFactor materials: exactly what the game's
// building pipeline (its re-encode, LOD proxy bake and thumbnail renderer) reads
// for a hand-authored model.
//
// While a design runs, the builder also records its source tree (sourceTree.ts):
// `scope(name, fn)` opens a named node, and every OUTERMOST primitive call (a box,
// not the prism, loft and caps it draws through) becomes a leaf holding its
// arguments and its triangle range. Recording never changes what is drawn.

import { slug, type ArgValue, type NodeExtent, type PrimitiveKind, type ScopeNode, type SourceTree, type TreeNode } from "./sourceTree.ts";
import { MeshCore, type Ring, type SweepAxis, type Vec3 } from "./meshCore.ts";

export { chamferedRect, grow, ngon, rect, scaleRing } from "./meshCore.ts";
export type { AnimationClipSpec, AnimationTrack, MaterialSpec, Ring, SweepAxis } from "./meshCore.ts";

interface RawLeaf {
  kind: PrimitiveKind;
  material: string;
  args: Record<string, ArgValue>;
  first: number;
  count: number;
}

interface RawScope {
  name: string;
  children: Array<RawScope | RawLeaf>;
}

/** Rounded to the millimetre, so float noise does not reach the tree file. */
const mm = (v: number): number => Math.round(v * 1000) / 1000 + 0; // + 0 turns -0 into 0

function roundArgs(args: Record<string, ArgValue>): Record<string, ArgValue> {
  const out: Record<string, ArgValue> = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = typeof v === "number" ? mm(v) : Array.isArray(v) ? v.map(mm) : v;
  }
  return out;
}

/** sRGB hex -> linear RGB, the space glTF's baseColorFactor is in. */
function linearRgb(hex: string): Vec3 {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
  return c.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))) as Vec3;
}

export class MeshBuilder extends MeshCore {
  private readonly root: RawScope = { name: "", children: [] };
  private readonly open: RawScope[] = [this.root];

  /**
   * Runs `fn` inside a named scope of the source tree: every primitive it draws,
   * directly or through helpers, becomes a leaf under this scope.
   */
  override scope<T>(name: string, fn: () => T): T {
    if (this.drawing) throw new Error("scope() inside a primitive call");
    const s: RawScope = { name, children: [] };
    this.open[this.open.length - 1]!.children.push(s);
    this.open.push(s);
    try {
      return super.scope(name, fn);
    } finally {
      this.open.pop();
    }
  }

  private trianglesOf(mat: string): number {
    return (this.groups.get(mat)?.pos.length ?? 0) / 9;
  }

  /** Draws through `draw` and, when this is the outermost primitive call, records it as a leaf. */
  private leaf(kind: PrimitiveKind, mat: string, args: () => Record<string, ArgValue>, draw: () => void): void {
    if (this.drawing) {
      draw();
      return;
    }
    const first = this.trianglesOf(mat);
    this.drawing = true;
    try {
      draw();
    } finally {
      this.drawing = false;
    }
    const count = this.trianglesOf(mat) - first;
    this.open[this.open.length - 1]!.children.push({ kind, material: mat, args: roundArgs(args()), first, count });
  }

  override tri(mat: string, a: Vec3, b: Vec3, c: Vec3): void {
    this.leaf("tri", mat, () => ({ a, b, c }), () => super.tri(mat, a, b, c));
  }

  override quad(mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3): void {
    this.leaf("quad", mat, () => ({ a, b, c, d }), () => super.quad(mat, a, b, c, d));
  }

  override cap(mat: string, ring: Ring, y: number, up = true): void {
    this.leaf("cap", mat, () => ({ ring: ring.length, y, up }), () => super.cap(mat, ring, y, up));
  }

  override loft(mat: string, lower: Ring, y0: number, upper: Ring, y1: number, top = true): void {
    this.leaf("loft", mat, () => ({ lower: lower.length, y0, upper: upper.length, y1, top }), () => super.loft(mat, lower, y0, upper, y1, top));
  }

  override prism(mat: string, ring: Ring, y0: number, y1: number, top = true): void {
    this.leaf("prism", mat, () => ({ ring: ring.length, y0, y1, top }), () => super.prism(mat, ring, y0, y1, top));
  }

  override spire(mat: string, ring: Ring, y0: number, y1: number): void {
    this.leaf("spire", mat, () => ({ ring: ring.length, y0, y1 }), () => super.spire(mat, ring, y0, y1));
  }

  override sweep(mat: string, axis: SweepAxis, s0: Ring, a0: number, s1: Ring, a1: number, caps = true): void {
    // the recorded range is ordered low to high, as the geometry is drawn
    this.leaf(
      "sweep", mat,
      () => ({ axis: axis === "x" ? 0 : 2, s0: s0.length, a0: Math.min(a0, a1), s1: s1.length, a1: Math.max(a0, a1), caps }),
      () => super.sweep(mat, axis, s0, a0, s1, a1, caps),
    );
  }

  override slab(mat: string, outline: Vec3[], depth: Vec3): void {
    this.leaf("slab", mat, () => ({ outline: outline.length, depth: [...depth] }), () => super.slab(mat, outline, depth));
  }

  override facets(mat: string, points: Vec3[], normal: Vec3): void {
    this.leaf("facets", mat, () => ({ triangles: Math.floor(points.length / 3) }), () => super.facets(mat, points, normal));
  }

  override tube(mat: string, axis: SweepAxis, c: number, y: number, ro: number, ri: number, a0: number, a1: number, n: number, rot = 0, ends = true): void {
    this.leaf(
      "tube", mat,
      () => ({ axis: axis === "x" ? 0 : 2, c, y, ro, ri, a0: Math.min(a0, a1), a1: Math.max(a0, a1), n, ends }),
      () => super.tube(mat, axis, c, y, ro, ri, a0, a1, n, rot, ends),
    );
  }

  override box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0, top = true): void {
    this.leaf("box", mat, () => ({ cx, cz, w, d, y0, y1, ry, top }), () => super.box(mat, cx, cz, w, d, y0, y1, ry, top));
  }

  /**
   * The recorded source tree, its root named `title`. Ids are slash paths of
   * slugged scope names, unique among siblings (a repeated name gets "-2",
   * "-3"...); a leaf is "<kind>-<n>" within its scope. Empty scopes are dropped.
   */
  sourceTree(id: string, title: string): SourceTree {
    const materials = [...this.groups.keys()].sort();
    const extentOf = (mat: string, first: number, count: number): NodeExtent => {
      if (count === 0) return { triangles: 0 };
      const pos = this.groups.get(mat)!.pos;
      const min: [number, number, number] = [Infinity, Infinity, Infinity];
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      for (let i = first * 9; i < (first + count) * 9; i += 3) {
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k]!, pos[i + k]!);
          max[k] = Math.max(max[k]!, pos[i + k]!);
        }
      }
      return { triangles: count, min: min.map(mm) as [number, number, number], max: max.map(mm) as [number, number, number] };
    };
    const merge = (nodes: TreeNode[]): NodeExtent => {
      const out: NodeExtent = { triangles: 0 };
      for (const n of nodes) {
        out.triangles += n.triangles;
        if (!n.min || !n.max) continue;
        out.min = out.min ? (out.min.map((v, k) => Math.min(v, n.min![k]!)) as [number, number, number]) : n.min;
        out.max = out.max ? (out.max.map((v, k) => Math.max(v, n.max![k]!)) as [number, number, number]) : n.max;
      }
      return out;
    };
    const build = (raw: RawScope, path: string, name: string): ScopeNode | null => {
      const taken = new Set<string>();
      const perKind = new Map<string, number>();
      const children: TreeNode[] = [];
      const join = (seg: string): string => (path ? `${path}/${seg}` : seg);
      for (const c of raw.children) {
        if ("kind" in c) {
          const n = (perKind.get(c.kind) ?? 0) + 1;
          perKind.set(c.kind, n);
          let seg = `${c.kind}-${n}`;
          for (let k = 2; taken.has(seg); k++) seg = `${c.kind}-${n}-${k}`;
          taken.add(seg);
          children.push({ id: join(seg), kind: c.kind, material: c.material, args: c.args, tri: [c.first, c.count], ...extentOf(c.material, c.first, c.count) });
        } else {
          const base = slug(c.name);
          let seg = base;
          for (let k = 2; taken.has(seg); k++) seg = `${base}-${k}`;
          const node = build(c, join(seg), c.name);
          if (!node) continue;
          taken.add(seg);
          children.push(node);
        }
      }
      if (children.length === 0 && path) return null;
      return { id: path, name, ...merge(children), children };
    };
    const root = build(this.root, "", title)!;
    const colors = materials.map((name) => this.palette[name]!.color);
    return { version: 1, id, triangles: this.triangleCount(), materials, colors, root };
  }

  /**
   * The finished model as a binary glTF (.glb): a primitive per material, in
   * material name order. Without parts it is one node and one mesh named `name`;
   * with parts (see `part`) it is a node per part, named after it, translated to
   * the part's pivot (within its parent part's node, for a child part), its
   * mesh's positions relative to that pivot. Either way the primitives are
   * non-indexed triangle soups with flat per-face normals. A model with a rig
   * carries it as the scene's `extras.rig` (three's GLTFLoader: `scene.userData.rig`),
   * a model that smokes its emitters as `extras.emitters`, a fountain its water as
   * `extras.fountain`.
   * Animation clips (see `animate`) become glTF animations of the part nodes,
   * linearly interpolated.
   */
  toGlb(generator: string, name = "building"): Uint8Array {
    type Json = {
      asset: { version: string; generator: string };
      scene: number;
      scenes: Array<{ nodes: number[]; extras?: { rig?: unknown; emitters?: unknown; fountain?: unknown } }>;
      nodes: Array<{ mesh: number; name: string; translation?: Vec3; children?: number[] }>;
      meshes: Array<{ name: string; primitives: unknown[] }>;
      materials: unknown[];
      accessors: unknown[];
      bufferViews: unknown[];
      buffers: Array<{ byteLength: number }>;
      animations?: unknown[];
    };
    if (this.parts.length) {
      for (const g of this.groups.values()) {
        if (g.part.includes(-1)) throw new Error("a model with parts drew a triangle outside any part");
      }
    }
    // a model without parts is one unit holding every triangle (part index -1)
    const units = this.parts.length
      ? this.parts.map((p, i) => ({ name: p.name, pivot: p.pivot, index: i }))
      : [{ name, pivot: [0, 0, 0] as Vec3, index: -1 }];
    const json: Json = {
      asset: { version: "2.0", generator },
      scene: 0,
      scenes: [{
        nodes: units.map((_, i) => i).filter((i) => !this.parts.length || this.parts[i]!.parent < 0),
        ...(this.rig || this.emitterList.length || this.water ? { extras: { ...(this.rig ? { rig: this.rig } : {}), ...(this.emitterList.length ? { emitters: this.emitterList } : {}), ...(this.water ? { fountain: this.water } : {}) } } : {}),
      }],
      nodes: units.map((u, i) => {
        if (!this.parts.length) return { mesh: i, name: u.name };
        const children = this.parts.map((p, k) => (p.parent === i ? k : -1)).filter((k) => k >= 0);
        return { mesh: i, name: u.name, translation: this.partOffset(i), ...(children.length ? { children } : {}) };
      }),
      meshes: units.map((u) => ({ name: u.name, primitives: [] })),
      materials: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
    };
    const chunks: Buffer[] = [];
    let offset = 0;
    const floatAccessor = (data: number[], width: 1 | 3 | 4, withBounds: boolean, vertexData = true): number => {
      const buf = Buffer.from(new Float32Array(data).buffer);
      json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(vertexData ? { target: 34962 } : {}) });
      chunks.push(buf);
      offset += buf.length;
      const acc: Record<string, unknown> = {
        bufferView: json.bufferViews.length - 1, componentType: 5126, count: data.length / width,
        type: width === 1 ? "SCALAR" : width === 3 ? "VEC3" : "VEC4",
      };
      if (withBounds) {
        const min = new Array<number>(width).fill(Infinity);
        const max = new Array<number>(width).fill(-Infinity);
        for (let i = 0; i < data.length; i += width) {
          for (let k = 0; k < width; k++) {
            const f = Math.fround(data[i + k]!);
            min[k] = Math.min(min[k]!, f);
            max[k] = Math.max(max[k]!, f);
          }
        }
        acc.min = min;
        acc.max = max;
      }
      json.accessors.push(acc);
      return json.accessors.length - 1;
    };
    const vec3Accessor = (data: number[], withBounds: boolean): number => floatAccessor(data, 3, withBounds);
    // Sorted by name so the output does not depend on the order a design happened
    // to touch its materials in -- the bytes are what the LOD cache keys on.
    const materials = [...this.groups.keys()].sort();
    for (const mat of materials) {
      const spec = this.palette[mat];
      json.materials.push({
        name: mat,
        pbrMetallicRoughness: {
          baseColorFactor: [...linearRgb(spec.color), 1],
          metallicFactor: spec.metallic ?? 0,
          roughnessFactor: spec.roughness ?? 0.85,
        },
      });
    }
    units.forEach((unit, u) => {
      materials.forEach((mat, m) => {
        const g = this.groups.get(mat)!;
        let pos: number[] = g.pos;
        let nrm: number[] = g.nrm;
        if (unit.index >= 0) {
          pos = [];
          nrm = [];
          for (let t = 0; t < g.part.length; t++) {
            if (g.part[t] !== unit.index) continue;
            for (let k = 0; k < 9; k++) {
              pos.push(g.pos[t * 9 + k]! - unit.pivot[k % 3]!);
              nrm.push(g.nrm[t * 9 + k]!);
            }
          }
          if (pos.length === 0) return;
        }
        const position = vec3Accessor(pos, true);
        const normal = vec3Accessor(nrm, false);
        json.meshes[u]!.primitives.push({ attributes: { POSITION: position, NORMAL: normal }, material: m });
      });
    });
    // the animations: one shared time accessor per clip, a linear sampler per track
    if (this.clips.length) {
      json.animations = this.clips.map((clip) => {
        const input = floatAccessor(clip.times, 1, true, false);
        const samplers = clip.tracks.map((t) => ({ input, output: floatAccessor(t.values, t.path === "rotation" ? 4 : 3, false, false), interpolation: "LINEAR" }));
        const channels = clip.tracks.map((t, i) => ({ sampler: i, target: { node: this.parts.findIndex((p) => p.name === t.node), path: t.path } }));
        return { name: clip.name, channels, samplers };
      });
    }
    const bin = Buffer.concat(chunks); // float32 data, already 4-byte aligned
    json.buffers.push({ byteLength: bin.length });
    let text = Buffer.from(JSON.stringify(json));
    if (text.length % 4) text = Buffer.concat([text, Buffer.alloc(4 - (text.length % 4), 0x20)]);
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67, 0); // "glTF"
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(12 + 8 + text.length + 8 + bin.length, 8);
    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(text.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(bin.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"
    return new Uint8Array(Buffer.concat([header, jsonHeader, text, binHeader, bin]));
  }
}
