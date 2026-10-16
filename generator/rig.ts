// The rig of a vehicle model: the nodes the game moves after it has loaded the
// model, and the pure functions that pose them.
//
//   steered wheels   a node per steered wheel, a pair per steered axle (a bus has
//                    one axle, an 8x4 truck two), each with its origin on the
//                    wheel's steering axis (the wheel's centre). The game turns a
//                    wheel by writing the node's Y rotation, and steerAngles() gives the
//                    angles (Ackermann: every wheel aims at one turning centre).
//   sections         an articulated vehicle's rigid bodies, front first, each a
//                    node whose origin is its hinge with the body ahead (the first's
//                    is the model origin). They form a hinged chain: section i
//                    turns about its hinge, which section i - 1 carries.
//   supports         a rail vehicle's bogies and lone wheelsets (MeshCore.bogie):
//                    where it rides on the track. A bogie is its own node,
//                    pivoted at its centre, which the game turns to the track.
//   joints           the bellows between two sections, its own node. It is not
//                    rigid: renderJoint() re-draws it between the two section nodes
//                    wherever they are -- every vertex rides both sections, blended
//                    by how far along the bellows it sits -- so the joint stays
//                    sealed at any bend, pitch or roll. The GLB holds the straight
//                    pose, drawn by the very same function.
//
// The game's articulated buses work the same way (rail-island-webapp,
// src/models/ArticulatedBus.ts: a hinged chain of section nodes and a bellows whose
// vertices ride the sections, re-skinned every frame); this is that mechanism
// without textures, generalised to any number of sections, with a corrugated
// bellows in place of three flat textured quads.
//
// No imports and no `node:`: a rigged model's standalone JS module bundles this
// file and exports pose(), renderJoint(), steerAngles() and steerLock()
// (jsModel.ts), so the game and the site's sliders call the same code the GLB
// was built with. Angles in the API are radians, positive turning counter-
// clockwise seen from above (toward -Z: the vehicle's left in the factory's
// frame); the rig's limits are stated in degrees. See docs/models/vehicle-rig.md.

export type Vec3 = [number, number, number];

/** One steered axle: its two wheel nodes and how far it is from the axle the vehicle turns about. */
export interface SteerAxle {
  /** The wheel nodes: the one at -Z, then the one at +Z; each turns about its own +Y. */
  nodes: [string, string];
  /** Metres from this axle back to the axle (or the line) the vehicle turns about. */
  wheelbase: number;
}

/** The steered wheels. */
export interface SteerRig {
  /** The steered axles, front first. */
  axles: SteerAxle[];
  /** The front axle's inner wheel's lock, degrees. */
  maxAngleDeg: number;
  /** Metres between a steered axle's two wheels' steering axes. */
  track: number;
}

/** One rigid body of an articulated vehicle. */
export interface SectionRig {
  node: string;
  /** The node's origin in the model's rest frame: the hinge with the section ahead ([0, 0, 0] for the first). */
  pivot: Vec3;
}

/** The bellows between two sections. */
export interface JointRig {
  node: string;
  /** The sections it joins, front then rear (indices into `sections`). */
  sections: [number, number];
  /** Model x of the bellows' front and rear faces, rest pose (front > rear). */
  front: number;
  rear: number;
  /** The inner (valley) cross-section as (z, y) points of a closed convex outline, rest pose. */
  profile: Array<[number, number]>;
  /** How many outer ridges the accordion has. */
  folds: number;
  /** How far a ridge stands out of the valley outline, metres. */
  depth: number;
  /** The model material the bellows is drawn in. */
  material: string;
}

/**
 * One point a rail vehicle rides on: a bogie's pivot (the mean of its axles), or
 * a wheelset outside any bogie. The game puts a section on the track by its two
 * outermost supports; a bogie node, posed on the track at its own distance and
 * turned to it, follows. A section with fewer than two hangs on its joints.
 */
export interface RailSupport {
  /** Model x of the support, metres. */
  x: number;
  /** The bogie's node, pivoted at (x, axle height, 0); absent for a lone wheelset. */
  node?: string;
  /** How many axles it has. */
  axles: number;
  /** The sections it carries (indices into `sections`; [0] for a rigid vehicle); two for a bogie under a joint. */
  sections: number[];
}

/** Everything of a vehicle the game may move. */
export interface VehicleRig {
  /** A rail vehicle's supports, by x. */
  supports?: RailSupport[];
  steer?: SteerRig;
  /** An articulated vehicle's bodies, front first (at least two when present). */
  sections?: SectionRig[];
  /** The bellows, one per covered gap; a semi-trailer's hitch has none. */
  joints?: JointRig[];
  /** The largest bend at any hinge, degrees. */
  maxBendDeg?: number;
}

/** A pose: the steering angle and one bend per hinge, radians. */
export interface VehiclePose {
  /** The angle of a virtual wheel midway along the front steered axle; + turns counter-clockwise from above (toward -Z). */
  steer?: number;
  /** Per hinge (between sections i and i + 1): the rear body's turn relative to the front one; + is counter-clockwise from above. */
  bend?: number[];
}

/** A column-major 4x4 matrix, as three.js keeps in `Matrix4.elements`. */
export type Mat4 = ArrayLike<number>;

const DEG = Math.PI / 180;

/**
 * Every steered wheel's angle for a steering angle (radians, + = toward -Z),
 * axle by axle, the -Z wheel first: the steering angle is that of a virtual
 * wheel midway along the front axle, and every wheel aims at the one turning
 * centre it puts on the line of the axle the vehicle turns about -- so the
 * inner wheels turn tighter than the outer ones, and a second steered axle,
 * nearer that line, less than the first.
 */
export function steerAngles(s: SteerRig, steer: number): Array<[number, number]> {
  if (Math.abs(steer) < 1e-9) return s.axles.map(() => [0, 0]);
  const radius = s.axles[0]!.wheelbase / Math.tan(Math.abs(steer)); // to the centre line
  return s.axles.map(({ wheelbase }) => {
    const inner = Math.atan(wheelbase / (radius - s.track / 2));
    const outer = Math.atan(wheelbase / (radius + s.track / 2));
    return steer > 0 ? [inner, outer] : [-outer, -inner];
  });
}

/** The largest steering angle (radians): the one that turns the front axle's inner wheel to its lock. */
export function steerLock(s: SteerRig): number {
  const wheelbase = s.axles[0]!.wheelbase;
  const radius = wheelbase / Math.tan(s.maxAngleDeg * DEG) + s.track / 2;
  return Math.atan(wheelbase / radius);
}

// --- the joint --------------------------------------------------------------------

/** A closed convex (z, y) outline moved outward by `d` along each corner's bisector. */
function grown(profile: Array<[number, number]>, d: number): Array<[number, number]> {
  const n = profile.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [z0, y0] = profile[i]!;
    const [z1, y1] = profile[(i + 1) % n]!;
    area += z0 * y1 - z1 * y0;
  }
  const s = area > 0 ? 1 : -1;
  const unit = (z: number, y: number): [number, number] => {
    const l = Math.hypot(z, y) || 1;
    return [z / l, y / l];
  };
  return profile.map(([z, y], i) => {
    const [za, ya] = profile[(i + n - 1) % n]!;
    const [zb, yb] = profile[(i + 1) % n]!;
    // outward normals of the edges into and out of this corner
    const n1 = unit((y - ya) * s, -(z - za) * s);
    const n2 = unit((yb - y) * s, -(zb - z) * s);
    const m = unit(n1[0] + n2[0], n1[1] + n2[1]);
    const k = d / Math.max(0.3, m[0] * n1[0] + m[1] * n1[1]);
    return [z + m[0] * k, y + m[1] * k];
  });
}

/** Where one rest vertex lands: carried by both sections, blended by `t` (0 front, 1 rear). */
function carry(r: Vec3, t: number, pa: Vec3, ma: Mat4, pb: Vec3, mb: Mat4): Vec3 {
  const out: Vec3 = [0, 0, 0];
  const ax = r[0] - pa[0], ay = r[1] - pa[1], az = r[2] - pa[2];
  const bx = r[0] - pb[0], by = r[1] - pb[1], bz = r[2] - pb[2];
  for (let k = 0; k < 3; k++) {
    const a = ma[k]! * ax + ma[4 + k]! * ay + ma[8 + k]! * az + ma[12 + k]!;
    const b = mb[k]! * bx + mb[4 + k]! * by + mb[8 + k]! * bz + mb[12 + k]!;
    out[k] = t <= 0 ? a : t >= 1 ? b : a + (b - a) * t;
  }
  return out;
}

/** A translation matrix: a section node at rest. */
function translation(p: Vec3): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1];
}

/**
 * The joint's triangles, three points each, with the two sections' node
 * matrices `ma` and `mb` (node-local to one common frame, in which the points
 * come out). Every pose gives the same triangles in the same order, outward
 * wound; at rest (`ma`, `mb` the sections' pivots) it is the GLB's bellows.
 */
export function jointTriangles(j: JointRig, sections: readonly SectionRig[], ma?: Mat4, mb?: Mat4): Vec3[] {
  const pa = sections[j.sections[0]]!.pivot;
  const pb = sections[j.sections[1]]!.pivot;
  const fa = ma ?? translation(pa);
  const fb = mb ?? translation(pb);
  const valley = j.profile;
  const ridge = grown(valley, j.depth);
  const rings = 2 * j.folds + 1;
  const n = valley.length;
  // the outline's winding decides which way round a quad faces out
  let area = 0;
  for (let i = 0; i < n; i++) area += valley[i]![0] * valley[(i + 1) % n]![1] - valley[(i + 1) % n]![0] * valley[i]![1];
  const flip = area > 0;
  const posed: Vec3[][] = [];
  for (let k = 0; k < rings; k++) {
    const t = k / (rings - 1);
    const x = j.front + (j.rear - j.front) * t;
    const outline = k % 2 === 1 ? ridge : valley;
    posed.push(outline.map(([z, y]) => carry([x, y, z], t, pa, fa, pb, fb)));
  }
  const out: Vec3[] = [];
  for (let k = 0; k + 1 < rings; k++) {
    for (let i = 0; i < n; i++) {
      const i1 = (i + 1) % n;
      const a = posed[k]![i]!, b = posed[k]![i1]!, c = posed[k + 1]![i1]!, d = posed[k + 1]![i]!;
      if (flip) out.push(a, b, c, a, c, d);
      else out.push(a, c, b, a, d, c);
    }
  }
  return out;
}

/** Draws a joint's rest pose into a mesh builder (the GLB's and the JS group's bellows). */
export function drawJoint(m: { tri(mat: string, a: Vec3, b: Vec3, c: Vec3): void }, j: JointRig, sections: readonly SectionRig[]): void {
  const t = jointTriangles(j, sections);
  for (let i = 0; i + 2 < t.length; i += 3) m.tri(j.material, t[i]!, t[i + 1]!, t[i + 2]!);
}

// --- posing three.js objects ---------------------------------------------------------
//
// Typed structurally, so this file needs no three.js: any Object3D will do.

interface Attr {
  array: ArrayLike<number> & { [i: number]: number };
  count: number;
  needsUpdate: boolean;
  normalized?: boolean;
  isInterleavedBufferAttribute?: boolean;
}
interface Geom {
  index: unknown;
  userData: Record<string, unknown>;
  getAttribute(name: string): Attr | undefined;
  computeBoundingSphere(): void;
  computeBoundingBox?(): void;
  clone(): Geom;
  setFromPoints(points: Array<{ x: number; y: number; z: number }>): unknown;
  computeVertexNormals(): void;
  addGroup(start: number, count: number, materialIndex?: number): void;
}
interface Obj {
  name: string;
  uuid: string;
  isMesh?: boolean;
  children: Obj[];
  userData: Record<string, unknown>;
  position: { x: number; y: number; z: number; set(x: number, y: number, z: number): unknown };
  rotation: { y: number; set(x: number, y: number, z: number): unknown };
  matrixWorld: { elements: ArrayLike<number> };
  updateMatrixWorld(force?: boolean): void;
  getObjectByName(name: string): Obj | undefined;
  geometry?: Geom;
  material?: { name: string } | Array<{ name: string }>;
}

function mul(a: Mat4, b: Mat4): number[] {
  const o = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r]! * b[c * 4 + k]!;
    o[c * 4 + r] = s;
  }
  return o;
}

/** The inverse of an affine 4x4 (a node's world matrix: rotation, scale, translation). */
function invertAffine(m: Mat4): number[] {
  const [a, b, c, d, e, f, g, h, i] = [m[0]!, m[4]!, m[8]!, m[1]!, m[5]!, m[9]!, m[2]!, m[6]!, m[10]!];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const k = 1 / det;
  const r = [
    (e * i - f * h) * k, (c * h - b * i) * k, (b * f - c * e) * k,
    (f * g - d * i) * k, (a * i - c * g) * k, (c * d - a * f) * k,
    (d * h - e * g) * k, (b * g - a * h) * k, (a * e - b * d) * k,
  ];
  const [tx, ty, tz] = [m[12]!, m[13]!, m[14]!];
  return [
    r[0]!, r[3]!, r[6]!, 0,
    r[1]!, r[4]!, r[7]!, 0,
    r[2]!, r[5]!, r[8]!, 0,
    -(r[0]! * tx + r[1]! * ty + r[2]! * tz), -(r[3]! * tx + r[4]! * ty + r[5]! * tz), -(r[6]! * tx + r[7]! * ty + r[8]! * tz), 1,
  ];
}

function rigOf(root: Obj, rig?: VehicleRig): VehicleRig {
  const r = rig ?? (root.userData.rig as VehicleRig | undefined);
  if (!r) throw new Error("the model has no rig");
  return r;
}

function node(root: Obj, name: string): Obj {
  const n = root.name === name ? root : root.getObjectByName(name);
  if (!n) throw new Error(`the model has no node "${name}"`);
  return n;
}

/**
 * The joint mesh's geometry, made this mesh's own on its first re-draw. three's
 * clone() shares one geometry between every copy of a model, and every vehicle
 * bends its own joint: a geometry another mesh already claimed is copied. One an
 * importer welded (indexed) or quantized (integer or interleaved attributes) is
 * replaced by a plain float triangle list, the layout the GLB was written in.
 */
function ownGeometry(mesh: Obj, count: number, materialIndex: number): Geom {
  let g = mesh.geometry!;
  const plain = (x: Attr | undefined): boolean =>
    !!x && x.array instanceof Float32Array && !x.normalized && !x.isInterleavedBufferAttribute && x.count === count;
  const nrm = g.getAttribute("normal");
  if (g.index || !plain(g.getAttribute("position")) || (nrm && !plain(nrm))) {
    const fresh = new (g.constructor as new () => Geom)();
    fresh.setFromPoints(Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0 })));
    fresh.computeVertexNormals();
    if (Array.isArray(mesh.material)) fresh.addGroup(0, count, materialIndex);
    g = fresh;
    mesh.geometry = g;
  } else if (g.userData.rigOwner !== undefined && g.userData.rigOwner !== mesh.uuid) {
    g = g.clone();
    mesh.geometry = g;
  }
  g.userData.rigOwner = mesh.uuid;
  return g;
}

/**
 * Re-draws joint `index` between its two section nodes, wherever they are now:
 * writes the positions and normals of the joint's mesh in place (the triangle
 * count never changes). The sections may be posed any way -- by pose(), or by the
 * game's own chain -- as long as their world matrices are current. The mesh is
 * the joint node or a child of it (an importer may move a posable node's mesh
 * onto a child), drawn in its own frame; each copy of a model owns its joint from
 * its first re-draw on (ownGeometry).
 */
export function renderJoint(root: Obj, index: number, rig?: VehicleRig): void {
  if (root.userData.lod === true) return; // Distant geometry stays in its rest pose.
  const r = rigOf(root, rig);
  const j = r.joints?.[index];
  if (!j || !r.sections) throw new Error(`the model has no joint ${index}`);
  const holder = node(root, j.node);
  const a = node(root, r.sections[j.sections[0]]!.node);
  const b = node(root, r.sections[j.sections[1]]!.node);
  const meshes: Obj[] = [];
  if (holder.isMesh) meshes.push(holder);
  for (const c of holder.children) if (c.isMesh) meshes.push(c);
  const named = (x: { name: string } | undefined): boolean => x?.name === j.material;
  const mesh = meshes.find((x) => (Array.isArray(x.material) ? x.material.some(named) : named(x.material)));
  if (!mesh?.geometry) throw new Error(`joint ${index}: no "${j.material}" mesh`);
  root.updateMatrixWorld(true);
  const local = invertAffine(mesh.matrixWorld.elements);
  const tris = jointTriangles(j, r.sections, mul(local, a.matrixWorld.elements), mul(local, b.matrixWorld.elements));
  const g = ownGeometry(mesh, tris.length, Array.isArray(mesh.material) ? mesh.material.findIndex(named) : 0);
  const pos = g.getAttribute("position")!;
  const nrm = g.getAttribute("normal");
  for (let t = 0; t + 2 < tris.length; t += 3) {
    const [p, q, s] = [tris[t]!, tris[t + 1]!, tris[t + 2]!];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [s[0] - p[0], s[1] - p[1], s[2] - p[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    for (let k = 0; k < 3; k++) {
      const vert = tris[t + k]!;
      for (let c = 0; c < 3; c++) {
        pos.array[(t + k) * 3 + c] = vert[c]!;
        if (nrm) nrm.array[(t + k) * 3 + c] = n[c]! / l;
      }
    }
  }
  pos.needsUpdate = true;
  if (nrm) nrm.needsUpdate = true;
  g.computeBoundingSphere();
  g.computeBoundingBox?.();
}

/**
 * Poses a built model (the GLB's scene or the JS module's group) in place: turns
 * the steered wheels, lays the sections out as a hinged chain from wherever the
 * first one is (its node's position and yaw; at rest, its rest place), and
 * re-draws every joint. `{}` is the rest pose. The rig is the model's own
 * (`userData.rig`, which a parametric build carries for its own parameters)
 * unless one is given.
 */
export function pose(root: Obj, p: VehiclePose = {}, rig?: VehicleRig): void {
  if (root.userData.lod === true) return;
  const r = rigOf(root, rig);
  if (r.steer) {
    const angles = steerAngles(r.steer, p.steer ?? 0);
    r.steer.axles.forEach((a, k) => a.nodes.forEach((name, i) => node(root, name).rotation.set(0, angles[k]![i]!, 0)));
  }
  const sections = r.sections ?? [];
  const first = sections[0] ? node(root, sections[0].node) : undefined;
  let yaw = first ? first.rotation.y : 0;
  let at: Vec3 = first ? [first.position.x, first.position.y, first.position.z] : [0, 0, 0];
  for (let i = 1; i < sections.length; i++) {
    // the hinge, carried by the section ahead (posed at `at`, turned by `yaw`)
    const [px, py, pz] = sections[i - 1]!.pivot;
    const [hx, hy, hz] = sections[i]!.pivot;
    const dx = hx - px, dz = hz - pz;
    const c = Math.cos(yaw), s = Math.sin(yaw);
    at = [at[0] + c * dx + s * dz, at[1] + (hy - py), at[2] - s * dx + c * dz];
    yaw += p.bend?.[i - 1] ?? 0;
    const n = node(root, sections[i]!.node);
    n.position.set(at[0], at[1], at[2]);
    n.rotation.set(0, yaw, 0);
  }
  (r.joints ?? []).forEach((_, i) => renderJoint(root, i, r));
}
