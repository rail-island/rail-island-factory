// A minimal mesh builder for the procedurally authored models (skyscrapers.ts).
// Geometry is lofted between horizontal rings -- a box is a 4-point ring, a prism
// an n-gon -- and collected per material as a flat-shaded triangle soup, then
// written out as one self-contained GLB with plain baseColorFactor materials:
// exactly what the game's building pipeline (its re-encode, LOD proxy bake and
// thumbnail renderer) reads for a hand-authored model. Pure Node, no three.js.
//
// Units are metres, +Y up, base at y = 0. The game's catalog recentres a model on
// its footprint, so a design need not be centred on the origin.

export type Ring = Array<[number, number]>; // (x, z) points, counter-clockwise seen from above

export interface MaterialSpec {
  /** sRGB hex, e.g. "#6f9fc4". */
  color: string;
  metallic?: number;
  roughness?: number;
}

type Vec3 = [number, number, number];

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

  constructor(private readonly palette: Record<string, MaterialSpec>) {}

  tri(mat: string, a: Vec3, b: Vec3, c: Vec3): void {
    if (!this.palette[mat]) throw new Error(`unknown material "${mat}"`);
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
    this.tri(mat, a, b, c);
    this.tri(mat, a, c, d);
  }

  /** Flat horizontal cap over a convex ring, facing up (or down). */
  cap(mat: string, ring: Ring, y: number, up = true): void {
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
    this.loft(mat, ring, y0, ring, y1, top);
  }

  /** A pointed roof or spire: the ring's edges to an apex above its centroid. */
  spire(mat: string, ring: Ring, y0: number, y1: number): void {
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      this.tri(mat, [ring[i][0], y0, ring[i][1]], [ring[j][0], y0, ring[j][1]], [cx, y1, cz]);
    }
  }

  /**
   * An axis-aligned (or `ry`-turned) box. Pass `top: false` for a core whose
   * roof something else covers: two caps at one height z-fight (coplanar.ts).
   */
  box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0, top = true): void {
    this.prism(mat, rect(w, d, cx, cz, ry), y0, y1, top);
  }

  triangleCount(): number {
    let n = 0;
    for (const g of this.groups.values()) n += g.pos.length / 9;
    return n;
  }

  /** The finished model as a binary glTF (.glb): one node, one mesh, a primitive per material. */
  toGlb(generator: string): Uint8Array {
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
      nodes: [{ mesh: 0, name: "building" }],
      meshes: [{ name: "building", primitives: [] }],
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
