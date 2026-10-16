// The geometry core of the procedural models: the ring helpers and the primitives
// (tri, quad, cap, loft, prism, spire, sweep, box, slab, facets) that collect a flat-shaded
// triangle soup per material, plus the named parts of an articulated model.
// Pure Node-free code with no recording and no output format, so it can be
// bundled into a model's standalone JS file (jsModel.ts, threeBuilder.ts).
//
// Two classes extend it: MeshBuilder (meshBuilder.ts) records the source tree
// and writes the GLB; ThreeMeshBuilder (threeBuilder.ts) builds a three.js Group.
// Both draw exactly the triangles this class draws.
//
// Units are metres, +Y up, base at y = 0. The game's catalog recentres a model on
// its footprint, so a design need not be centred on the origin.

import type { LodFace } from "./lod.ts";
import type { VehicleRig } from "./rig.ts";

export type Ring = Array<[number, number]>; // (x, z) points, counter-clockwise seen from above

/** The horizontal axis a sweep runs along (see MeshCore.sweep). */
export type SweepAxis = "x" | "z";

export interface MaterialSpec {
  /** sRGB hex, e.g. "#6f9fc4". */
  color: string;
  metallic?: number;
  roughness?: number;
}

export type Vec3 = [number, number, number];

/**
 * One animated property of a part's node (see MeshCore.part), sampled at its
 * clip's times: a rotation is 4 numbers a sample (an x, y, z, w quaternion about
 * the node's origin, the part's pivot), a translation 3 (the node's position within its parent,
 * at rest its pivot, less the parent part's for a child part).
 */
export interface AnimationTrack {
  node: string;
  path: "rotation" | "translation";
  values: number[];
}

/** A looping animation of a model's parts: shared sample times from 0, linear in between. */
export interface AnimationClipSpec {
  name: string;
  times: number[];
  tracks: AnimationTrack[];
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

export class MeshCore {
  /** Per material: positions and normals, 9 numbers a triangle, and each triangle's part (-1 for none). */
  protected readonly groups = new Map<string, { pos: number[]; nrm: number[]; part: number[]; scope: number[] }>();
  /** The named parts in drawing order; `parent` indexes this list, -1 for a top-level part. */
  protected readonly parts: Array<{ name: string; pivot: Vec3; parent: number }> = [];
  /**
   * What of the model the game may move (rig.ts): its steered wheels, sections
   * and joints. Set by the design; written into the GLB's scene extras, the JS
   * group's userData and the meta entry. Null for a model without one.
   */
  rig: VehicleRig | null = null;
  /** The model's animation clips (see `animate`). */
  protected readonly clips: AnimationClipSpec[] = [];
  /** The part being drawn, or -1. */
  protected currentPart = -1;
  /** How many scopes are open. */
  protected depth = 0;
  /** True inside an outermost primitive call (set by a recording subclass). */
  protected drawing = false;
  /**
   * Maps a point of the loft frame (ring u, height, ring v) to the model: the
   * identity, except inside a sweep, which turns a loft on its side. Always a
   * rotation (a cyclic permutation of the axes), so winding stays outward.
   */
  protected frame: (p: Vec3) => Vec3 = (p) => p;

  private readonly lodScopes: Array<{ path: string[]; ids: number[] }> = [{ path: [], ids: [] }];
  private lodScope = 0;

  constructor(protected readonly palette: Record<string, MaterialSpec>) {}

  /** Runs `fn` inside a named scope; a recording subclass turns the scopes into a source tree. */
  scope<T>(name: string, fn: () => T): T {
    if (this.drawing) throw new Error("scope() inside a primitive call");
    const parent = this.lodScope;
    const id = this.lodScopes.length;
    this.lodScopes.push({ path: [...this.lodScopes[parent].path, name], ids: [...this.lodScopes[parent].ids, id] });
    this.lodScope = id;
    this.depth++;
    try {
      return fn();
    } finally {
      this.depth--;
      this.lodScope = parent;
    }
  }

  /**
   * Draws `fn` as a named part of the model: its own node in the GLB, translated
   * to `pivot` (see toGlb) -- an articulated vehicle's truck and trailer, the
   * trailer's pivot its rotation point; a steered wheel, its pivot the wheel's
   * centre. Draw in world coordinates as usual. Parts are drawn at top level,
   * used once each, one after another; once a model has parts, every triangle
   * must be in one. A part is also a scope of the source tree.
   *
   * A part may name a `parent`, an earlier part: its node is then a child of the
   * parent's node, so it moves with it (a steered wheel with its section). The
   * parts after a parent must all be its descendants until its last child is
   * drawn, so the drawing order is the node tree's depth-first order -- the
   * order the GLB's triangles are numbered in.
   */
  part<T>(name: string, pivot: Vec3, fn: () => T, parent?: string): T {
    if (this.drawing || this.depth > 0 || this.currentPart >= 0) throw new Error("part() must be top level");
    if (this.parts.some((p) => p.name === name)) throw new Error(`part "${name}" drawn twice`);
    let up = -1;
    if (parent !== undefined) {
      up = this.parts.findIndex((p) => p.name === parent);
      if (up < 0) throw new Error(`part "${name}": no earlier part "${parent}"`);
      for (let k = up + 1; k < this.parts.length; k++) {
        let a = this.parts[k]!.parent;
        while (a >= 0 && a !== up) a = this.parts[a]!.parent;
        if (a !== up) throw new Error(`part "${name}" must follow its parent "${parent}" and the parent's other descendants`);
      }
    }
    this.parts.push({ name, pivot, parent: up });
    this.currentPart = this.parts.length - 1;
    try {
      return this.scope(name, fn);
    } finally {
      this.currentPart = -1;
    }
  }

  /**
   * Adds an animation clip that moves the model's parts: a steam locomotive's
   * wheelsets and rods. Every track names a part already drawn; the times start
   * at 0 and rise; each track holds one value per time. Node names are what
   * three.js binds tracks by, so a part an animation moves must be named without
   * spaces or dots.
   */
  animate(clip: AnimationClipSpec): void {
    if (this.clips.some((c) => c.name === clip.name)) throw new Error(`animation "${clip.name}" added twice`);
    const t = clip.times;
    if (t.length < 2 || t[0] !== 0 || t.some((v, i) => i > 0 && v <= t[i - 1]!)) throw new Error(`animation "${clip.name}": times must start at 0 and rise`);
    for (const track of clip.tracks) {
      if (!this.parts.some((p) => p.name === track.node)) throw new Error(`animation "${clip.name}": no part "${track.node}"`);
      if (/[\s.:/\[\]]/.test(track.node)) throw new Error(`animated part "${track.node}" has a name three.js cannot bind`);
      const width = track.path === "rotation" ? 4 : 3;
      if (track.values.length !== width * t.length) throw new Error(`animation "${clip.name}": ${track.node} ${track.path} has ${track.values.length} values for ${t.length} times`);
    }
    this.clips.push(clip);
  }

  /** The animation clips added so far. */
  animations(): readonly AnimationClipSpec[] {
    return this.clips;
  }

  /** A part's translation within its parent's node: its pivot less the parent's. */
  protected partOffset(index: number): Vec3 {
    const p = this.parts[index]!;
    if (p.parent < 0) return p.pivot;
    const q = this.parts[p.parent]!.pivot;
    return [p.pivot[0] - q[0], p.pivot[1] - q[1], p.pivot[2] - q[2]];
  }

  tri(mat: string, a: Vec3, b: Vec3, c: Vec3): void {
    if (!this.palette[mat]) throw new Error(`unknown material "${mat}"`);
    [a, b, c] = [this.frame(a), this.frame(b), this.frame(c)];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) return; // degenerate
    let g = this.groups.get(mat);
    if (!g) this.groups.set(mat, (g = { pos: [], nrm: [], part: [], scope: [] }));
    g.part.push(this.currentPart);
    g.scope.push(this.lodScope);
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
   * A loft laid on its side: the walls between two vertical cross-sections at
   * `a0` and `a1` along the horizontal `axis`, with end caps unless `caps` is
   * false. A section's points are (x, y) for a sweep along z and (z, y) for one
   * along x, in either winding (the walls are always wound outward); both must
   * be convex and of equal length. A wheel is an n-gon swept along z, a hood a
   * chamfered section swept along x to a slightly smaller one.
   */
  sweep(mat: string, axis: SweepAxis, s0: Ring, a0: number, s1: Ring, a1: number, caps = true): void {
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
      this.loft(mat, lower, a0, upper, a1, caps);
      if (caps) this.cap(mat, lower, a0, false);
    } finally {
      this.frame = outer;
    }
  }

  /**
   * A flat convex polygon extruded along any direction: the face `outline`
   * (points in order, either winding, all in one plane) and its copy moved by
   * `depth`, joined by walls. The face looks away from `depth`, so a panel on a
   * slanted surface is its outline just proud of the surface and a `depth`
   * pointing into it. Walls always face out.
   */
  slab(mat: string, outline: Vec3[], depth: Vec3): void {
    const n = outline.length;
    // Newell's normal of the outline; the face must look against `depth`
    const nv: Vec3 = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const a = outline[i]!;
      const b = outline[(i + 1) % n]!;
      nv[0] += (a[1] - b[1]) * (a[2] + b[2]);
      nv[1] += (a[2] - b[2]) * (a[0] + b[0]);
      nv[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const f = nv[0] * depth[0] + nv[1] * depth[1] + nv[2] * depth[2] > 0 ? [...outline].reverse() : outline;
    const back = f.map((p): Vec3 => [p[0] + depth[0], p[1] + depth[1], p[2] + depth[2]]);
    for (let i = 1; i + 1 < n; i++) {
      this.tri(mat, f[0]!, f[i]!, f[i + 1]!);
      this.tri(mat, back[0]!, back[i + 1]!, back[i]!);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(mat, f[j]!, f[i]!, back[i]!, back[j]!);
    }
  }

  /**
   * Loose triangles, three points each in `points`, every one turned to face
   * along `normal`: a one-sided decal -- a logo, lettering -- laid a few
   * millimetres off the surface it reads on.
   */
  facets(mat: string, points: Vec3[], normal: Vec3): void {
    for (let i = 0; i + 2 < points.length; i += 3) {
      const [a, b, c] = [points[i]!, points[i + 1]!, points[i + 2]!];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * normal[0] + n[1] * normal[1] + n[2] * normal[2] >= 0) this.tri(mat, a, b, c);
      else this.tri(mat, a, c, b);
    }
  }

  /**
   * A hollow cylinder lying along the horizontal `axis` from a0 to a1: a ring of
   * outer radius `ro` and inner radius `ri` about (c, y) -- c is x for a tube
   * along z, z for one along x -- as `n` facets, first corner at angle `rot`
   * (0 = +x or +z, counter-clockwise toward +y). Outer walls face out, the bore
   * faces the axis, and the two ring faces close the ends unless `ends` is false.
   * A wheel's tyre, through which its spokes show.
   */
  tube(mat: string, axis: SweepAxis, c: number, y: number, ro: number, ri: number, a0: number, a1: number, n: number, rot = 0, ends = true): void {
    if (a1 < a0) [a0, a1] = [a1, a0];
    const P = (r: number, a: number, w: number): Vec3 =>
      axis === "z" ? [c + r * Math.cos(a), y + r * Math.sin(a), w] : [w, y + r * Math.sin(a), c + r * Math.cos(a)];
    const radial = (a: number, sign: number): Vec3 => (axis === "z" ? [sign * Math.cos(a), sign * Math.sin(a), 0] : [0, sign * Math.sin(a), sign * Math.cos(a)]);
    const along: Vec3 = axis === "z" ? [0, 0, 1] : [1, 0, 0];
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const b = rot + ((i + 1) / n) * Math.PI * 2;
      const mid = (a + b) / 2;
      this.orientedQuad(mat, P(ro, a, a0), P(ro, b, a0), P(ro, b, a1), P(ro, a, a1), radial(mid, 1));
      this.orientedQuad(mat, P(ri, a, a0), P(ri, b, a0), P(ri, b, a1), P(ri, a, a1), radial(mid, -1));
      if (ends) {
        this.orientedQuad(mat, P(ro, a, a1), P(ro, b, a1), P(ri, b, a1), P(ri, a, a1), along);
        this.orientedQuad(mat, P(ro, a, a0), P(ro, b, a0), P(ri, b, a0), P(ri, a, a0), [-along[0], -along[1], -along[2]]);
      }
    }
  }

  /** A planar quad wound so its face looks along `n`. */
  protected orientedQuad(mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (f[0] * n[0] + f[1] * n[1] + f[2] * n[2] >= 0) this.quad(mat, a, b, c, d);
    else this.quad(mat, a, d, c, b);
  }

  /**
   * An axis-aligned (or `ry`-turned) box. Pass `top: false` for a core whose
   * roof something else covers: two caps at one height z-fight (coplanar.ts).
   */
  box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0, top = true): void {
    this.prism(mat, rect(w, d, cx, cz, ry), y0, y1, top);
  }

  /** Replace detailed geometry and motion with static, closed structural masses. */
  lowDetail(reconstruct: (faces: LodFace[]) => LodFace[]): this {
    const faces: LodFace[] = [];
    for (const [material, g] of this.groups) {
      for (let t = 0; t < g.part.length; t++) {
        const points = [0, 1, 2].map(k => g.pos.slice(t * 9 + k * 3, t * 9 + k * 3 + 3)) as LodFace['points'];
        const scope = this.lodScopes[g.scope[t]];
        faces.push({ points, material, part: g.part[t], path: scope.path, scopeIds: scope.ids });
      }
    }
    const reduced = reconstruct(faces);
    this.parts.length = 0;
    this.clips.length = 0;
    this.rig = null;
    this.groups.clear();
    for (const f of reduced) {
      this.currentPart = f.part;
      // Bypass a recording subclass: the full-detail source tree is unchanged.
      MeshCore.prototype.tri.call(this, f.material, ...f.points);
    }
    this.currentPart = -1;
    return this;
  }

  triangleCount(): number {
    let n = 0;
    for (const g of this.groups.values()) n += g.pos.length / 9;
    return n;
  }
}
