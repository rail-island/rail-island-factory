// A minimal mesh builder for the procedurally authored models (skyscrapers.ts).
// Geometry is lofted between horizontal rings -- a box is a 4-point ring, a prism
// an n-gon -- and collected per material as a flat-shaded triangle soup, then
// written out as one self-contained GLB with plain baseColorFactor materials:
// exactly what the game's building pipeline (its re-encode, LOD proxy bake and
// thumbnail renderer) reads for a hand-authored model. Pure Node, no three.js.
//
// Units are metres, +Y up, base at y = 0. The game's catalog recentres a model on
// its footprint, so a design need not be centred on the origin.
//
// While a design runs, the builder also records its source tree (sourceTree.ts):
// `scope(name, fn)` opens a named node, and every OUTERMOST primitive call (a box,
// not the prism, loft and caps it draws through) becomes a leaf holding its
// arguments and its triangle range. Recording never changes what is drawn.

import { slug, type ArgValue, type NodeExtent, type PrimitiveKind, type ScopeNode, type SourceTree, type TreeNode } from "./sourceTree.ts";

export type Ring = Array<[number, number]>; // (x, z) points, counter-clockwise seen from above

/** The horizontal axis a sweep runs along (see MeshBuilder.sweep). */
export type SweepAxis = "x" | "z";

export interface MaterialSpec {
  /** sRGB hex, e.g. "#6f9fc4". */
  color: string;
  metallic?: number;
  roughness?: number;
}

type Vec3 = [number, number, number];

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

/** A regular n-gon of radius r about (cx, cz), first corner at angle `rot`. */
export function ngon(n: number, r: number, rot = 0, cx = 0, cz = 0): Ring {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    ring.push([cx + r * Math.cos(a), cz - r * Math.sin(a)]);
  }
  return ring;
}

/** A w x d rectangle about (cx, cz), turned `ry` radians about +Y. */
export function rect(w: number, d: number, cx = 0, cz = 0, ry = 0): Ring {
  const cs = Math.cos(ry);
  const sn = Math.sin(ry);
  const corners: Array<[number, number]> = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
  return corners.map(([x, z]) => [cx + x * cs + z * sn, cz - x * sn + z * cs]);
}

/** A rectangle with its four corners cut off by `c` (an octagon with long and short sides). */
export function chamferedRect(w: number, d: number, c: number, cx = 0, cz = 0): Ring {
  const hx = w / 2;
  const hz = d / 2;
  const pts: Array<[number, number]> = [
    [-hx + c, hz], [hx - c, hz], [hx, hz - c], [hx, -hz + c],
    [hx - c, -hz], [-hx + c, -hz], [-hx, -hz + c], [-hx, hz - c],
  ];
  return pts.map(([x, z]) => [cx + x, cz + z]);
}

/** A ring grown outward by `by` along each point's direction from the ring's centroid. */
export function grow(ring: Ring, by: number): Ring {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return ring.map(([x, z]) => {
    const l = Math.hypot(x - cx, z - cz) || 1;
    return [x + ((x - cx) / l) * by, z + ((z - cz) / l) * by];
  });
}

/** A ring scaled about its centroid. */
export function scaleRing(ring: Ring, s: number): Ring {
  const cx = ring.reduce((t, p) => t + p[0], 0) / ring.length;
  const cz = ring.reduce((t, p) => t + p[1], 0) / ring.length;
  return ring.map(([x, z]) => [cx + (x - cx) * s, cz + (z - cz) * s]);
}

export class MeshBuilder {
  private readonly groups = new Map<string, { pos: number[]; nrm: number[] }>();
  private readonly root: RawScope = { name: "", children: [] };
  private readonly open: RawScope[] = [this.root];
  /** True inside a recorded primitive call: the calls it draws through are not leaves. */
  private drawing = false;
  /**
   * Maps a point of the loft frame (ring u, height, ring v) to the model: the
   * identity, except inside a sweep, which turns a loft on its side. Always a
   * rotation (a cyclic permutation of the axes), so winding stays outward.
   */
  private frame: (p: Vec3) => Vec3 = (p) => p;

  constructor(private readonly palette: Record<string, MaterialSpec>) {}

  /**
   * Runs `fn` inside a named scope of the source tree: every primitive it draws,
   * directly or through helpers, becomes a leaf under this scope.
   */
  scope<T>(name: string, fn: () => T): T {
    if (this.drawing) throw new Error("scope() inside a primitive call");
    const s: RawScope = { name, children: [] };
    this.open[this.open.length - 1]!.children.push(s);
    this.open.push(s);
    try {
      return fn();
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

  tri(mat: string, a: Vec3, b: Vec3, c: Vec3): void {
    this.leaf("tri", mat, () => ({ a, b, c }), () => this.drawTri(mat, a, b, c));
  }

  private drawTri(mat: string, a: Vec3, b: Vec3, c: Vec3): void {
    if (!this.palette[mat]) throw new Error(`unknown material "${mat}"`);
    [a, b, c] = [this.frame(a), this.frame(b), this.frame(c)];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) return; // degenerate
    let g = this.groups.get(mat);
    if (!g) this.groups.set(mat, (g = { pos: [], nrm: [] }));
    for (const p of [a, b, c]) {
      g.pos.push(p[0], p[1], p[2]);
      g.nrm.push(n[0] / l, n[1] / l, n[2] / l);
    }
  }

  quad(mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3): void {
    this.leaf("quad", mat, () => ({ a, b, c, d }), () => {
      this.tri(mat, a, b, c);
      this.tri(mat, a, c, d);
    });
  }

  /** Flat horizontal cap over a convex ring, facing up (or down). */
  cap(mat: string, ring: Ring, y: number, up = true): void {
    this.leaf("cap", mat, () => ({ ring: ring.length, y, up }), () => this.drawCap(mat, ring, y, up));
  }

  private drawCap(mat: string, ring: Ring, y: number, up: boolean): void {
    for (let i = 1; i < ring.length - 1; i++) {
      const a: Vec3 = [ring[0][0], y, ring[0][1]];
      const b: Vec3 = [ring[i][0], y, ring[i][1]];
      const c: Vec3 = [ring[i + 1][0], y, ring[i + 1][1]];
      if (up) this.tri(mat, a, b, c);
      else this.tri(mat, a, c, b);
    }
  }

  /**
   * The side walls between two rings of equal length (a frustum when the upper
   * ring is smaller), plus a top cap unless `top` is false. The rings must wind
   * the same way (counter-clockwise from above, as every helper here returns).
   */
  loft(mat: string, lower: Ring, y0: number, upper: Ring, y1: number, top = true): void {
    this.leaf("loft", mat, () => ({ lower: lower.length, y0, upper: upper.length, y1, top }), () => this.drawLoft(mat, lower, y0, upper, y1, top));
  }

  private drawLoft(mat: string, lower: Ring, y0: number, upper: Ring, y1: number, top: boolean): void {
    if (lower.length !== upper.length) throw new Error("loft rings differ in length");
    const n = lower.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(
        mat,
        [lower[i][0], y0, lower[i][1]], [lower[j][0], y0, lower[j][1]],
        [upper[j][0], y1, upper[j][1]], [upper[i][0], y1, upper[i][1]],
      );
    }
    if (top) this.cap(mat, upper, y1);
  }

  /** A vertical prism over `ring` from y0 to y1. */
  prism(mat: string, ring: Ring, y0: number, y1: number, top = true): void {
    this.leaf("prism", mat, () => ({ ring: ring.length, y0, y1, top }), () => this.loft(mat, ring, y0, ring, y1, top));
  }

  /** A pointed roof or spire: the ring's edges to an apex above its centroid. */
  spire(mat: string, ring: Ring, y0: number, y1: number): void {
    this.leaf("spire", mat, () => ({ ring: ring.length, y0, y1 }), () => this.drawSpire(mat, ring, y0, y1));
  }

  private drawSpire(mat: string, ring: Ring, y0: number, y1: number): void {
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      this.tri(mat, [ring[i][0], y0, ring[i][1]], [ring[j][0], y0, ring[j][1]], [cx, y1, cz]);
    }
  }

  /**
   * A loft laid on its side: the walls between two vertical cross-sections at
   * `a0` and `a1` along the horizontal `axis`, with end caps unless `caps` is
   * false. A section's points are (x, y) for a sweep along z and (z, y) for one
   * along x, in either winding (the walls are always wound outward); both must
   * be convex and of equal length. A wheel is an n-gon swept along z, a hood a
   * chamfered section swept along x to a slightly smaller one.
   */
  sweep(mat: string, axis: SweepAxis, s0: Ring, a0: number, s1: Ring, a1: number, caps = true): void {
    this.leaf("sweep", mat, () => ({ axis: axis === "x" ? 0 : 2, s0: s0.length, a0, s1: s1.length, a1, caps }), () => {
      if (a1 < a0) [s0, a0, s1, a1] = [s1, a1, s0, a0];
      // the loft frame's ring (u, v): (z, y) along x, (y, x) along z -- see `frame`
      const toUv = (s: Ring): Ring => (axis === "x" ? s.map(([p, y]) => [p, y]) : s.map(([p, y]) => [y, p]));
      let lower = toUv(s0);
      let upper = toUv(s1);
      // rect() winds negatively in (u, v), and that is the winding loft walls outward from
      let area = 0;
      for (let i = 0; i < lower.length; i++) {
        const [x0, y0] = lower[i]!;
        const [x1, y1] = lower[(i + 1) % lower.length]!;
        area += x0 * y1 - x1 * y0;
      }
      if (area > 0) {
        lower = [...lower].reverse();
        upper = [...upper].reverse();
      }
      const outer = this.frame;
      this.frame = axis === "x" ? ([u, h, v]) => outer([h, v, u]) : ([u, h, v]) => outer([v, u, h]);
      try {
        this.drawLoft(mat, lower, a0, upper, a1, caps);
        if (caps) this.drawCap(mat, lower, a0, false);
      } finally {
        this.frame = outer;
      }
    });
  }

  /**
   * An axis-aligned (or `ry`-turned) box. Pass `top: false` for a core whose
   * roof something else covers: two caps at one height z-fight (coplanar.ts).
   */
  box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0, top = true): void {
    this.leaf("box", mat, () => ({ cx, cz, w, d, y0, y1, ry, top }), () => this.prism(mat, rect(w, d, cx, cz, ry), y0, y1, top));
  }

  triangleCount(): number {
    let n = 0;
    for (const g of this.groups.values()) n += g.pos.length / 9;
    return n;
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

  /** The finished model as a binary glTF (.glb): one node, one mesh, a primitive per material. */
  toGlb(generator: string, name = "building"): Uint8Array {
    type Json = {
      asset: { version: string; generator: string };
      scene: number;
      scenes: Array<{ nodes: number[] }>;
      nodes: Array<{ mesh: number; name: string }>;
      meshes: Array<{ name: string; primitives: unknown[] }>;
      materials: unknown[];
      accessors: unknown[];
      bufferViews: unknown[];
      buffers: Array<{ byteLength: number }>;
    };
    const json: Json = {
      asset: { version: "2.0", generator },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name }],
      meshes: [{ name, primitives: [] }],
      materials: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
    };
    const chunks: Buffer[] = [];
    let offset = 0;
    // Sorted by name so the output does not depend on the order a design happened
    // to touch its materials in -- the bytes are what the LOD cache keys on.
    for (const name of [...this.groups.keys()].sort()) {
      const g = this.groups.get(name)!;
      const spec = this.palette[name];
      json.materials.push({
        name,
        pbrMetallicRoughness: {
          baseColorFactor: [...linearRgb(spec.color), 1],
          metallicFactor: spec.metallic ?? 0,
          roughnessFactor: spec.roughness ?? 0.85,
        },
      });
      const accessorFor = (data: number[], withBounds: boolean): number => {
        const buf = Buffer.from(new Float32Array(data).buffer);
        json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target: 34962 });
        const acc: Record<string, unknown> = {
          bufferView: json.bufferViews.length - 1, componentType: 5126, count: data.length / 3, type: "VEC3",
        };
        if (withBounds) {
          const min = [Infinity, Infinity, Infinity];
          const max = [-Infinity, -Infinity, -Infinity];
          for (let i = 0; i < data.length; i += 3) {
            for (let k = 0; k < 3; k++) {
              const f = Math.fround(data[i + k]);
              min[k] = Math.min(min[k], f);
              max[k] = Math.max(max[k], f);
            }
          }
          acc.min = min;
          acc.max = max;
        }
        json.accessors.push(acc);
        chunks.push(buf);
        offset += buf.length;
        return json.accessors.length - 1;
      };
      const position = accessorFor(g.pos, true);
      const normal = accessorFor(g.nrm, false);
      json.meshes[0].primitives.push({ attributes: { POSITION: position, NORMAL: normal }, material: json.materials.length - 1 });
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
