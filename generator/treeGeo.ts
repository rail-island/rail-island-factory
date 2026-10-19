// The small geometry kit the trees are built with (trees.ts): a non-indexed
// triangle list with the handful of three.js primitives and transforms the game's
// tree builder used -- CylinderGeometry, ConeGeometry, IcosahedronGeometry,
// translate/scale/rotate, applyQuaternion and a merge -- re-implemented on plain
// arrays so a tree's standalone JS model needs no three.js geometry classes.
//
// The vertex layouts follow three.js r160 (the same rings, caps and subdivision
// order), so a per-vertex deformation written against a three.js primitive lands
// on the same points here. Triangles are emitted into a MeshCore with tri(), which
// drops degenerate ones (a cone's tip quads) and gives every face its own normal.
//
// No `node:` imports: bundled into the trees' JS models (jsModel.ts).

export type P3 = [number, number, number];

/** A non-indexed triangle list: x, y, z per corner, three corners per triangle. */
export class Geo {
  /**
   * Optional baked colour per corner (linear RGB multipliers, 3 numbers a corner,
   * parallel to `pos`): the shading trees.ts paints on. Transforms leave it alone.
   */
  col?: number[];

  constructor(public pos: number[] = []) {}

  get count(): number {
    return this.pos.length / 3;
  }

  x(i: number): number { return this.pos[i * 3]!; }
  y(i: number): number { return this.pos[i * 3 + 1]!; }
  z(i: number): number { return this.pos[i * 3 + 2]!; }

  set(i: number, x: number, y: number, z: number): void {
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
  }

  /** Moves every corner through `fn`. */
  map(fn: (x: number, y: number, z: number) => P3): this {
    for (let i = 0; i < this.count; i++) {
      const [x, y, z] = fn(this.x(i), this.y(i), this.z(i));
      this.set(i, x, y, z);
    }
    return this;
  }

  translate(dx: number, dy: number, dz: number): this {
    return this.map((x, y, z) => [x + dx, y + dy, z + dz]);
  }

  scale(sx: number, sy: number, sz: number): this {
    return this.map((x, y, z) => [x * sx, y * sy, z * sz]);
  }

  rotateX(a: number): this {
    const c = Math.cos(a), s = Math.sin(a);
    return this.map((x, y, z) => [x, c * y - s * z, s * y + c * z]);
  }

  rotateY(a: number): this {
    const c = Math.cos(a), s = Math.sin(a);
    return this.map((x, y, z) => [c * x + s * z, y, -s * x + c * z]);
  }

  rotateZ(a: number): this {
    const c = Math.cos(a), s = Math.sin(a);
    return this.map((x, y, z) => [c * x - s * y, s * x + c * y, z]);
  }

  /** Rotates by the quaternion [x, y, z, w] (three.js Vector3.applyQuaternion). */
  applyQuaternion(q: [number, number, number, number]): this {
    const [qx, qy, qz, qw] = q;
    return this.map((vx, vy, vz) => {
      const tx = 2 * (qy * vz - qz * vy);
      const ty = 2 * (qz * vx - qx * vz);
      const tz = 2 * (qx * vy - qy * vx);
      return [vx + qw * tx + qy * tz - qz * ty, vy + qw * ty + qz * tx - qx * tz, vz + qw * tz + qx * ty - qy * tx];
    });
  }

  /** Axis-aligned bounds of the corners, or null when empty. */
  box(): { min: P3; max: P3 } | null {
    if (!this.count) return null;
    const min: P3 = [Infinity, Infinity, Infinity];
    const max: P3 = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < this.pos.length; i++) {
      const k = i % 3;
      if (this.pos[i]! < min[k]!) min[k] = this.pos[i]!;
      if (this.pos[i]! > max[k]!) max[k] = this.pos[i]!;
    }
    return { min, max };
  }
}

/** The bounds of several lists together. */
export function boxOf(list: readonly Geo[]): { min: P3; max: P3 } {
  const min: P3 = [Infinity, Infinity, Infinity];
  const max: P3 = [-Infinity, -Infinity, -Infinity];
  for (const g of list) {
    const b = g.box();
    if (!b) continue;
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, b.min[k]!);
      max[k] = Math.max(max[k]!, b.max[k]!);
    }
  }
  return { min, max };
}

/** Indexed points expanded to a triangle list. */
export function fromIndexed(points: readonly P3[], indices: readonly number[]): Geo {
  const pos: number[] = [];
  for (const i of indices) pos.push(...points[i]!);
  return new Geo(pos);
}

/** three.js CylinderGeometry, centred on the origin, axis +Y. */
export function cylinderGeo(radiusTop: number, radiusBottom: number, height: number, radialSegments: number, heightSegments = 1): Geo {
  const points: P3[] = [];
  const indices: number[] = [];
  const rows: number[][] = [];
  const half = height / 2;
  for (let y = 0; y <= heightSegments; y++) {
    const row: number[] = [];
    const v = y / heightSegments;
    const radius = v * (radiusBottom - radiusTop) + radiusTop;
    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      points.push([radius * Math.sin(theta), -v * height + half, radius * Math.cos(theta)]);
      row.push(points.length - 1);
    }
    rows.push(row);
  }
  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = rows[y]![x]!, b = rows[y + 1]![x]!, c = rows[y + 1]![x + 1]!, d = rows[y]![x + 1]!;
      indices.push(a, b, d, b, c, d);
    }
  }
  const cap = (top: boolean) => {
    const radius = top ? radiusTop : radiusBottom;
    const sign = top ? 1 : -1;
    const centre = points.length;
    for (let x = 1; x <= radialSegments; x++) points.push([0, half * sign, 0]);
    const rim = points.length;
    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * Math.PI * 2;
      points.push([radius * Math.sin(theta), half * sign, radius * Math.cos(theta)]);
    }
    for (let x = 0; x < radialSegments; x++) {
      const c = centre + x, i = rim + x;
      if (top) indices.push(i, i + 1, c);
      else indices.push(i + 1, i, c);
    }
  };
  if (radiusTop > 0) cap(true);
  if (radiusBottom > 0) cap(false);
  return fromIndexed(points, indices);
}

/** three.js ConeGeometry: a cylinder with a zero top radius. */
export function coneGeo(radius: number, height: number, radialSegments: number): Geo {
  return cylinderGeo(0, radius, height, radialSegments, 1);
}

const T = (1 + Math.sqrt(5)) / 2;
const ICO_POINTS: P3[] = [
  [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
  [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
  [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1],
];
const ICO_FACES = [
  0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
  1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
  3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
  4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
];

const lerp = (a: P3, b: P3, t: number): P3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** three.js IcosahedronGeometry (PolyhedronGeometry's subdivision), radius `radius`. */
export function icosahedronGeo(radius: number, detail: number): Geo {
  const pos: number[] = [];
  const push = (p: P3) => {
    const l = Math.hypot(p[0], p[1], p[2]);
    pos.push((p[0] / l) * radius, (p[1] / l) * radius, (p[2] / l) * radius);
  };
  for (let f = 0; f < ICO_FACES.length; f += 3) {
    const a = ICO_POINTS[ICO_FACES[f]!]!, b = ICO_POINTS[ICO_FACES[f + 1]!]!, c = ICO_POINTS[ICO_FACES[f + 2]!]!;
    const cols = detail + 1;
    const v: P3[][] = [];
    for (let i = 0; i <= cols; i++) {
      v[i] = [];
      const aj = lerp(a, c, i / cols);
      const bj = lerp(b, c, i / cols);
      const rows = cols - i;
      for (let j = 0; j <= rows; j++) v[i]![j] = j === 0 && i === cols ? aj : lerp(aj, bj, j / rows);
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < 2 * (cols - i) - 1; j++) {
        const k = Math.floor(j / 2);
        if (j % 2 === 0) {
          push(v[i]![k + 1]!); push(v[i + 1]![k]!); push(v[i]![k]!);
        } else {
          push(v[i]![k + 1]!); push(v[i + 1]![k + 1]!); push(v[i + 1]![k]!);
        }
      }
    }
  }
  return new Geo(pos);
}

/** The quaternion turning unit vector `from` onto unit vector `to` (three.js setFromUnitVectors). */
export function quatFromUnitVectors(from: P3, to: P3): [number, number, number, number] {
  let r = from[0] * to[0] + from[1] * to[1] + from[2] * to[2] + 1;
  let x: number, y: number, z: number;
  if (r < Number.EPSILON) {
    r = 0;
    if (Math.abs(from[0]) > Math.abs(from[2])) {
      x = -from[1]; y = from[0]; z = 0;
    } else {
      x = 0; y = -from[2]; z = from[1];
    }
  } else {
    x = from[1] * to[2] - from[2] * to[1];
    y = from[2] * to[0] - from[0] * to[2];
    z = from[0] * to[1] - from[1] * to[0];
  }
  const l = Math.hypot(x, y, z, r);
  return [x / l, y / l, z / l, r / l];
}
