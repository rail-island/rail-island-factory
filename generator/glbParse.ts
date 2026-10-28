// Reading a GLB: the container, its accessors, and the small vector maths the
// readers need. No image decoding and no Node APIs (Uint8Array + DataView rather
// than Buffer), so it is importable from the build, from Vitest and, should the
// site ever need it, from the browser.

export type Mat4 = number[]; // column-major, like glTF
export type Vec3 = [number, number, number];

export interface Gltf {
  scene?: number;
  scenes?: { nodes?: number[] }[];
  nodes?: {
    mesh?: number;
    children?: number[];
    matrix?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    /** `interior: true` on a vehicle's interior node (meshCore.ts `interior`), hidden while its doors are shut. */
    extras?: { interior?: boolean };
  }[];
  meshes?: { primitives: GltfPrimitive[] }[];
  materials?: {
    name?: string;
    doubleSided?: boolean;
    pbrMetallicRoughness?: {
      baseColorFactor?: number[];
      baseColorTexture?: { index: number };
      metallicFactor?: number;
      roughnessFactor?: number;
    };
  }[];
  textures?: { source?: number }[];
  images?: { bufferView?: number; mimeType?: string }[];
  accessors?: GltfAccessor[];
  bufferViews?: { buffer: number; byteOffset?: number; byteLength: number; byteStride?: number }[];
}
export interface GltfPrimitive {
  mode?: number;
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
}
export interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  /** Integer storage standing for -1..1 / 0..1 -- quantization writes POSITION this way. */
  normalized?: boolean;
}


export function parseGlb(buf: Uint8Array): { json: Gltf; bin: Uint8Array } {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("not a GLB (bad magic)");
  const jsonLen = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jsonLen))) as Gltf;
  let bin = buf.subarray(0, 0); // empty, but the same flavour as the chunks below
  let off = 20 + jsonLen;
  while (off + 8 <= buf.byteLength) {
    const len = view.getUint32(off, true);
    const type = view.getUint32(off + 4, true);
    if (type === 0x004e4942) bin = buf.subarray(off + 8, off + 8 + len); // "BIN"
    off += 8 + len;
  }
  return { json, bin };
}

const COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const COMPONENT_BYTES: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

/**
 * Full-scale value of a NORMALIZED integer component, per the glTF spec's
 * dequantization table. Index accessors and float attributes never carry the flag.
 */
const NORMALIZE_FULL_SCALE: Record<number, number> = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };

/**
 * Read an accessor into a flat number array of MODEL-unit component values.
 *
 * A normalized accessor is dequantized here (integers standing for -1..1 or 0..1,
 * which is how KHR_mesh_quantization stores POSITION); everything else is read as
 * it stands. The node scale that a quantizer leaves behind is the caller's to
 * apply, as it always was -- this only undoes the normalization, which is the half
 * the buffer itself declares. Reading a quantized model without it inflated the
 * geometry by 32767 (see models/glbInspect.ts for the same defect's other half).
 */
export function readAccessor(json: Gltf, bin: Uint8Array, index: number): number[] {
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const acc = json.accessors?.[index];
  if (!acc) throw new Error(`missing accessor ${index}`);
  const comps = COMPONENTS[acc.type];
  const compBytes = COMPONENT_BYTES[acc.componentType];
  if (!comps || !compBytes) throw new Error(`unsupported accessor ${acc.type}/${acc.componentType}`);
  const view = acc.bufferView != null ? json.bufferViews?.[acc.bufferView] : undefined;
  const base = (view?.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = view?.byteStride && view.byteStride > 0 ? view.byteStride : comps * compBytes;
  const out: number[] = new Array(acc.count * comps);
  for (let i = 0; i < acc.count; i++) {
    for (let c = 0; c < comps; c++) {
      const at = base + i * stride + c * compBytes;
      let v: number;
      switch (acc.componentType) {
        case 5120: v = data.getInt8(at); break;
        case 5121: v = data.getUint8(at); break;
        case 5122: v = data.getInt16(at, true); break;
        case 5123: v = data.getUint16(at, true); break;
        case 5125: v = data.getUint32(at, true); break;
        default: v = data.getFloat32(at, true); break;
      }
      out[i * comps + c] = v;
    }
  }
  const full = acc.normalized ? NORMALIZE_FULL_SCALE[acc.componentType] : undefined;
  if (full) for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i]! / full, -1);
  return out;
}

// ------------------------------------------------------------------ 4x4 matrix

export function ident(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}
export function trs(t?: number[], r?: number[], s?: number[]): Mat4 {
  const [x, y, z, w] = r ?? [0, 0, 0, 1];
  const [sx, sy, sz] = s ?? [1, 1, 1];
  const [tx, ty, tz] = t ?? [0, 0, 0];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
export function xformPoint(m: Mat4, p: Vec3): Vec3 {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}
// Direction transform (no translation). These models use rigid/uniform-scale nodes,
// so the upper 3x3 plus a re-normalize is an adequate normal matrix.
export function xformDir(m: Mat4, v: Vec3): Vec3 {
  const o: Vec3 = [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
  ];
  return norm(o);
}
export function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

