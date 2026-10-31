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

import type { RailSupport, VehicleRig } from "./rig.ts";

export type Ring = Array<[number, number]>; // (x, z) points, counter-clockwise seen from above

/** The horizontal axis a sweep runs along (see MeshCore.sweep). */
export type SweepAxis = "x" | "z";

export interface MaterialSpec {
  /** sRGB hex, e.g. "#6f9fc4". */
  color: string;
  metallic?: number;
  roughness?: number;
  /** Shade both faces: single-layer geometry such as a palm frond (GLB `doubleSided`). */
  doubleSided?: boolean;
  /** The material is a vehicle lamp's lens: what it does and how it shines when lit (see LampSpec). */
  lamp?: LampSpec;
  /**
   * The material is a vehicle's window glass (a windscreen, a side window, a tinted
   * visor). The JS model's material carries `userData.glass`, and the game draws it
   * with a sky reflection (docs/models/js-format.md). Never on an LOD's glass.
   */
  glass?: boolean;
  /**
   * A named surface (surfaces.ts SURFACES) the game binds a photo to; `color` stays
   * the honest flat colour. Set both with `surfaceMaterial(id)`: the JS model then
   * carries box-projected UVs at `surfaceTile` units per repeat and lists the
   * material in `userData.surfaces` (docs/models/surfaces.md).
   */
  surface?: string;
  /** Model units one repeat of the surface's photo spans (from its preset). */
  surfaceTile?: number;
}

/**
 * What a lamp does on a vehicle (docs/models/lamps.md): `head` - a head or marker
 * lamp, white or yellow; `tail` - a red tail lamp; `brake` - a red brake lamp;
 * `indicator` - an amber direction indicator. A consumer splits a lamp material's
 * triangles by the model's end (`Lamps.midX`) and, for an indicator, by side.
 */
export type LampRole = "head" | "tail" | "brake" | "indicator";

export interface LampSpec {
  role: LampRole;
  /** sRGB hex the lit lamp glows in; the role's default when absent (LAMP_LIT). */
  lit?: string;
  /** How bright it glows, an emissive intensity; the role's default when absent. */
  intensity?: number;
}

/** A role's lit colour and intensity when the palette entry states none. */
export const LAMP_LIT: Readonly<Record<LampRole, { lit: string; intensity: number }>> = {
  head: { lit: "#fff6e0", intensity: 1.6 },
  tail: { lit: "#ff2a1c", intensity: 1.2 },
  brake: { lit: "#ff1a10", intensity: 2.2 },
  indicator: { lit: "#ffa21c", intensity: 2 },
};

/**
 * The lamps of a model, as the GLB's scene extras and the JS group's `userData`
 * carry them: per lamp material its role, lit colour and intensity, and `midX`, the
 * middle of the model's length -- a lamp triangle whose centroid lies at x >= midX
 * is at the front end (+X, the factory's forward), else at the rear; an indicator
 * at z < 0 is on the left, else on the right.
 */
export interface Lamps {
  midX: number;
  materials: Record<string, { role: LampRole; lit: string; intensity: number }>;
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

/**
 * Where the model gives off smoke, steam or a gas flare: the mouth of a chimney,
 * the top of a cooling tower, the tip of a flare stack. Model coordinates (metres,
 * the model's own frame, like its triangles), the point the effect starts from.
 * `radius` is the mouth's; a flame also has the direction it burns, its height and
 * colour. `part` names the part it was placed in, for a model with parts, so a
 * consumer posing the model can carry the point with that part.
 */
export interface Emitter {
  kind: "smoke" | "steam" | "flame";
  at: Vec3;
  radius: number;
  dir?: Vec3;
  height?: number;
  color?: string;
  part?: string;
}

/**
 * A fountain's still water: a surface at height `y` bounded by `ring` (model
 * coordinates, counter-clockwise seen from above, like every Ring), the inside of
 * the basin or bowl it fills.
 */
export interface WaterPool {
  y: number;
  ring: Array<[number, number]>;
}

/**
 * A fountain's jet: it leaves its nozzle at `at`, climbs `rise` above it and comes
 * down at height `land`, `reach` away horizontally along `dir` ([dx, dz], unit) --
 * reach 0 is a plain vertical jet falling back on itself. `radius` is its thickness.
 */
export interface WaterJet {
  at: Vec3;
  dir?: [number, number];
  rise: number;
  reach: number;
  land: number;
  radius: number;
}

/**
 * What of a fountain moves: its pools and jets, and the style the game picks a
 * fountain by ("classical", "modern", "sculptural"). The model is the stone.
 */
export interface FountainWater {
  style: string;
  pools: WaterPool[];
  jets: WaterJet[];
}

/**
 * What advances a clip in the consumer (docs/models/animation.md): `time` loops it
 * at its own duration, whatever the model is doing (a wind turbine's rotor);
 * `distance` ties it to how far the model travels - one loop per `speed` m/s times
 * the clip's duration in metres, so it is played at `timeScale = speed / this.speed`
 * (signed: backwards in reverse, still when the vehicle stands); `state` is a pose
 * between two states the consumer scrubs to (a pantograph from folded, the clip's
 * start, to raised, its end), easing the value itself. `door` is a state clip of
 * a vehicle's passenger doors on one `side` (seen facing the model's +X end: right
 * is +Z), from shut at the clip's start to open at its end; the shut pose is the
 * rest pose (doors.ts). `motion` is a clip a character plays by name when it
 * chooses that motion - a jump, a fall, sitting down (characters.ts): nothing in
 * the model's own movement plays it. A consumer that does not know a drive leaves
 * its clip alone.
 */
export type ClipDrive = { drive: "time" } | { drive: "distance"; speed: number } | { drive: "state" } | { drive: "door"; side: DoorSide } | { drive: "motion" };

/** A side of a vehicle, seen facing its +X end: right is +Z. */
export type DoorSide = "left" | "right";

/** A looping animation of a model's parts: shared sample times from 0, linear in between. */
export interface AnimationClipSpec {
  name: string;
  times: number[];
  tracks: AnimationTrack[];
  /** What plays it (see ClipDrive). */
  drive: ClipDrive;
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

/** Rounds to a millimetre (a rail support's position). */
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export class MeshCore {
  /**
   * Per material: positions and normals, 9 numbers a triangle, and each triangle's part (-1 for none).
   * `col` holds a linear RGB multiplier per corner (9 numbers a triangle) once any triangle of the
   * material was drawn with one (see `triShaded`); the material's other triangles read white.
   */
  protected readonly groups = new Map<string, { pos: number[]; nrm: number[]; part: number[]; scope: number[]; col?: number[] }>();
  /** The corner colours of the triangle `triShaded` is drawing, or null. */
  private pendingColors: [Vec3, Vec3, Vec3] | null = null;
  /**
   * The named parts in drawing order; `parent` indexes this list, -1 for a
   * top-level part. A `bogie` part is a rail bogie (see `bogie`): always top level.
   */
  protected readonly parts: Array<{ name: string; pivot: Vec3; parent: number; bogie?: boolean; moving?: boolean }> = [];
  /**
   * While `liftable` draws its rest pose: the part each triangle goes to, per
   * material in drawing order (a triangle routed to -1 stays in the current part).
   */
  private triRoute: { parts: Map<string, number[]>; next: Map<string, number> } | null = null;
  /** How many liftable mechanisms were drawn, for their part and clip names. */
  private liftables = 0;
  /** The rig the design set (see `rig`). */
  private ownRig: VehicleRig | null = null;
  /**
   * A rail vehicle's wheelsets, recorded as their scopes close (see `scope` and
   * `axleAt`): the axle's centre, the bogie it is in (an index into `railBogies`,
   * -1 for none) and the top-level part it was drawn in (null for none).
   */
  private readonly railAxles: Array<{ x: number; y: number; bogie: number; owner: string | null }> = [];
  /** A rail vehicle's bogies (see `bogie`): their part, owner part and the sections they carry. */
  private readonly railBogies: Array<{ part: number; owner: string | null; sections?: number[] }> = [];
  /** The bounds of each open "wheelset" scope's triangles, innermost last. */
  private readonly wheelsetBounds: Array<{ min: Vec3; max: Vec3 }> = [];
  /** The bogie being drawn (an index into `railBogies`), or -1. */
  private currentBogie = -1;
  /** The model's animation clips (see `animate`). */
  protected readonly clips: AnimationClipSpec[] = [];
  /** Where the model smokes, steams or flares (see `emit`). */
  protected readonly emitterList: Emitter[] = [];
  /** A fountain's water (see `pool` and `jet`), or null for anything else. */
  protected water: FountainWater | null = null;
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

  /**
   * What of the model the game may move (rig.ts): its steered wheels, sections
   * and joints, set by the design, and -- for a rail vehicle, one that drew
   * wheelsets -- the supports it rides on, worked out from the wheelsets and
   * bogies drawn (see `bogie`). Written into the GLB's scene extras, the JS
   * group's userData and the meta entry. Null for a model without one.
   */
  get rig(): VehicleRig | null {
    const supports = this.railSupports();
    if (!supports) return this.ownRig;
    return { ...(this.ownRig ?? {}), supports };
  }

  set rig(rig: VehicleRig | null) {
    this.ownRig = rig;
  }

  /**
   * Draws `fn` as one rail bogie: its own top-level node (no scope of the source
   * tree: the builder names its own), named `bogie<n>` in drawing order and pivoted on the track centre line at its wheelsets' mean
   * axle position, so the game can turn it under the body. Unlike `part` it may
   * be called anywhere -- inside scopes, inside a section part -- and it takes
   * every triangle drawn in `fn` out of the part around it. The wheelsets drawn
   * inside (scopes named "wheelset", or `axleAt`) are its axles; it needs at
   * least one. `sections` names the sections it carries (indices into the rig's
   * sections): by default the one it is drawn in (0 for a rigid vehicle); a
   * bogie under a joint carries two.
   */
  bogie<T>(fn: () => T, opts: { sections?: number[] } = {}): T {
    if (this.drawing) throw new Error("bogie() inside a primitive call");
    // a bogie builder drawn inside another's (a tram's motors round the coach bogie) is the same bogie
    if (this.currentBogie >= 0) return fn();
    const outer = this.currentPart;
    const owner = outer >= 0 ? this.parts[outer]!.name : null;
    const index = this.railBogies.length;
    const name = `bogie${index}`;
    this.parts.push({ name, pivot: [0, 0, 0], parent: -1, bogie: true });
    const part = this.parts.length - 1;
    this.railBogies.push({ part, owner, ...(opts.sections ? { sections: [...opts.sections] } : {}) });
    this.currentPart = part;
    this.currentBogie = index;
    try {
      return fn();
    } finally {
      this.currentPart = outer;
      this.currentBogie = -1;
      const axles = this.railAxles.filter((a) => a.bogie === index);
      if (!axles.length) throw new Error(`${name}: no wheelset drawn inside`);
      const x = axles.reduce((t, a) => t + a.x, 0) / axles.length;
      const y = axles.reduce((t, a) => t + a.y, 0) / axles.length;
      this.parts[part]!.pivot = [round3(x), round3(y), 0];
    }
  }

  /**
   * Draws `fn` as a part that rolls (rolling.ts): a wheel, or a wheelset, as its
   * own node named `name`, pivoted at `pivot` on its axle. Its node is a child of
   * the part being drawn -- a bogie, a steered wheel, a truck's body -- or a
   * top-level node outside any part. Like `bogie` it may be called inside scopes,
   * and every triangle drawn in `fn` goes to it; it is also a scope of the source
   * tree. Only the wheel goes in: what does not turn with it (an axle box, a
   * spring) is drawn outside.
   */
  spin<T>(name: string, pivot: Vec3, fn: () => T): T {
    if (this.drawing) throw new Error("spin() inside a primitive call");
    if (this.parts.some((p) => p.name === name)) throw new Error(`part "${name}" drawn twice`);
    const outer = this.currentPart;
    this.parts.push({ name, pivot, parent: outer, moving: true });
    this.currentPart = this.parts.length - 1;
    try {
      return this.scope(name, fn);
    } finally {
      this.currentPart = outer;
    }
  }

  /**
   * Draws `fn` turned 180 degrees about the vertical line through x = `cx`, z = 0
   * (x mirrored about cx, z negated: a rotation, so faces stay wound outward) --
   * the last car of a set, facing the other way.
   */
  turned<T>(cx: number, fn: () => T): T {
    const outer = this.frame;
    this.frame = ([x, y, z]) => outer([2 * cx - x, y, -z]);
    try {
      return fn();
    } finally {
      this.frame = outer;
    }
  }

  /**
   * Draws `fn` moved by the rigid motion `move` (a point of the model, before any
   * enclosing `turned`, to where it goes): an opening door's leaf. `move` must be
   * a rotation about a vertical axis and a translation, so faces stay wound outward.
   */
  moved<T>(move: (p: Vec3) => Vec3, fn: () => T): T {
    const outer = this.frame;
    this.frame = (p) => outer(move(p));
    try {
      return fn();
    } finally {
      this.frame = outer;
    }
  }

  /**
   * Records a rail wheelset whose geometry is not drawn in a "wheelset" scope (a
   * steam locomotive's wheelset part): its axle's centre, model coordinates.
   */
  axleAt(x: number, y: number): void {
    const at = this.carrierPart();
    const owner = at >= 0 && !this.parts[at]!.bogie ? this.parts[at]!.name : this.ownerOfBogie();
    this.railAxles.push({ x, y, bogie: this.currentBogie, owner });
  }

  /** The part being drawn, looking through a rolling wheel (`spin`) to the part that carries it. */
  private carrierPart(): number {
    let p = this.currentPart;
    while (p >= 0 && this.parts[p]!.moving) p = this.parts[p]!.parent;
    return p;
  }

  /** The part a wheelset drawn now belongs to: the bogie's owner inside a bogie. */
  private ownerOfBogie(): string | null {
    if (this.currentBogie >= 0) return this.railBogies[this.currentBogie]!.owner;
    const at = this.carrierPart();
    return at >= 0 ? this.parts[at]!.name : null;
  }

  /**
   * The supports a rail vehicle rides on (rig.ts RailSupport), from the wheelsets
   * and bogies drawn: one per bogie, and per section its outermost wheelsets
   * outside any bogie (a two-axle wagon's axles, a steam locomotive's end
   * wheelsets). Null for a model that drew no wheelset.
   */
  private railSupports(): RailSupport[] | null {
    if (!this.railAxles.length) return null;
    const sections = this.ownRig?.sections;
    const sectionOf = (owner: string | null): number => {
      if (!sections) return 0;
      const i = sections.findIndex((s) => s.node === owner);
      if (i < 0) throw new Error(`a wheelset drawn outside any section (in ${owner ?? "no part"})`);
      return i;
    };
    const out: RailSupport[] = [];
    this.railBogies.forEach((b, i) => {
      const axles = this.railAxles.filter((a) => a.bogie === i).length;
      const p = this.parts[b.part]!;
      out.push({ x: p.pivot[0], node: p.name, axles, sections: b.sections ?? [sectionOf(b.owner)] });
    });
    const free = new Map<number, number[]>();
    for (const a of this.railAxles) {
      if (a.bogie >= 0) continue;
      const s = sectionOf(a.owner);
      free.set(s, [...(free.get(s) ?? []), a.x]);
    }
    for (const [s, xs] of [...free].sort((a, b) => a[0] - b[0])) {
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      out.push({ x: round3(lo), axles: 1, sections: [s] });
      if (hi - lo > 1e-3) out.push({ x: round3(hi), axles: 1, sections: [s] });
    }
    return out.sort((a, b) => a.x - b.x);
  }

  /** Runs `fn` inside a named scope; a recording subclass turns the scopes into a source tree. */
  scope<T>(name: string, fn: () => T): T {
    if (this.drawing) throw new Error("scope() inside a primitive call");
    const parent = this.lodScope;
    const id = this.lodScopes.length;
    this.lodScopes.push({ path: [...this.lodScopes[parent].path, name], ids: [...this.lodScopes[parent].ids, id] });
    this.lodScope = id;
    this.depth++;
    const wheelset = name === "wheelset";
    if (wheelset) this.wheelsetBounds.push({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
    try {
      return fn();
    } finally {
      this.depth--;
      this.lodScope = parent;
      if (wheelset) {
        const b = this.wheelsetBounds.pop()!;
        if (b.min[0] <= b.max[0]) this.axleAt(round3((b.min[0] + b.max[0]) / 2), round3((b.min[1] + b.max[1]) / 2));
      }
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
    const d = clip.drive;
    const k = d?.drive;
    if (!(k === "time" || k === "state" || k === "motion" || (k === "distance" && d.speed > 0) || (k === "door" && /^(left|right)$/.test(d.side)))) throw new Error(`animation "${clip.name}": bad drive`);
    for (const track of clip.tracks) {
      if (!this.parts.some((p) => p.name === track.node)) throw new Error(`animation "${clip.name}": no part "${track.node}"`);
      if (/[\s.:/\[\]]/.test(track.node)) throw new Error(`animated part "${track.node}" has a name three.js cannot bind`);
      const width = track.path === "rotation" ? 4 : 3;
      if (track.values.length !== width * t.length) throw new Error(`animation "${clip.name}": ${track.node} ${track.path} has ${track.values.length} values for ${t.length} times`);
    }
    this.clips.push(clip);
  }

  /**
   * Records an emitter (see Emitter): where the game should start the smoke, steam
   * or flame of this model. Called where the stack is drawn, so a parameter that
   * moves or heightens the stack moves its smoke with it.
   */
  emit(kind: Emitter["kind"], at: Vec3, radius: number, flame?: { dir?: Vec3; height: number; color: string }): void {
    if (!(radius > 0) || at.some((v) => !Number.isFinite(v))) throw new Error(`emit(${kind}): bad point or radius`);
    if (kind === "flame" && !flame) throw new Error("emit(flame) needs a height and colour");
    const part = this.currentPart >= 0 ? this.parts[this.currentPart]!.name : undefined;
    this.emitterList.push({
      kind,
      at: [...at] as Vec3,
      radius,
      ...(kind === "flame" ? { dir: flame!.dir ?? [0, 1, 0], height: flame!.height, color: flame!.color } : {}),
      ...(part !== undefined ? { part } : {}),
    });
  }

  /**
   * Records a fountain's still water: the surface at `y` inside `ring`. Called where
   * the basin or bowl is drawn, so the water and the stone cannot disagree.
   */
  pool(ring: Ring, y: number): void {
    if (ring.length < 3 || !Number.isFinite(y)) throw new Error("pool(): needs a ring and a height");
    this.fountainWater().pools.push({ y, ring: ring.map(([x, z]) => [x, z] as [number, number]) });
  }

  /** Records a fountain's jet (see WaterJet), from the nozzle drawn there. */
  jet(j: WaterJet): void {
    if (!(j.radius > 0) || !(j.rise >= 0) || !(j.reach >= 0) || j.at.some((v) => !Number.isFinite(v))) throw new Error("jet(): bad jet");
    this.fountainWater().jets.push({ ...j, at: [...j.at] as Vec3, ...(j.dir ? { dir: [...j.dir] as [number, number] } : {}) });
  }

  /** Names the fountain's style (the game picks fountains by it). */
  fountainStyle(style: string): void {
    this.fountainWater().style = style;
  }

  /** The fountain's water, or null when the model recorded none. */
  fountain(): FountainWater | null {
    return this.water;
  }

  private fountainWater(): FountainWater {
    if (!this.water) this.water = { style: "classical", pools: [], jets: [] };
    return this.water;
  }

  /** The emitters recorded so far, in drawing order. */
  emitters(): readonly Emitter[] {
    return this.emitterList;
  }

  /** The animation clips added so far. */
  animations(): readonly AnimationClipSpec[] {
    return this.clips;
  }

  /**
   * What plays each clip, by clip name: what the GLB's scene extras and the JS
   * model's `userData` carry as `clipDrives`, since three.js keeps no extras on a
   * clip. Null without clips, so a static model's output is unchanged.
   */
  clipDrives(): Record<string, ClipDrive> | null {
    if (!this.clips.length) return null;
    const out: Record<string, ClipDrive> = {};
    // a copy of each drive as the design wrote it: { drive } and its speed or side
    for (const c of this.clips) out[c.name] = { ...c.drive };
    return out;
  }

  /**
   * The model's lamps (see Lamps), or null for a model that drew no lamp material.
   * `midX` is the middle of everything drawn along x, rounded to the millimetre.
   */
  lamps(): Lamps | null {
    const materials: Lamps["materials"] = {};
    for (const mat of [...this.groups.keys()].sort()) {
      const spec = this.palette[mat]?.lamp;
      if (!spec) continue;
      const d = LAMP_LIT[spec.role];
      materials[mat] = { role: spec.role, lit: spec.lit ?? d.lit, intensity: spec.intensity ?? d.intensity };
    }
    if (!Object.keys(materials).length) return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const g of this.groups.values()) {
      for (let i = 0; i < g.pos.length; i += 3) {
        if (g.pos[i]! < lo) lo = g.pos[i]!;
        if (g.pos[i]! > hi) hi = g.pos[i]!;
      }
    }
    return { midX: round3((lo + hi) / 2) + 0, materials }; // + 0: never -0, which JSON would not keep
  }

  /**
   * For `liftable` (liftable.ts): every triangle corner `draw` would draw, per
   * material, drawn into a scratch builder of this class with this palette and
   * the current frame (a `turned` car's), leaving this model untouched.
   */
  sampleDraw(draw: (m: this) => void): Map<string, number[]> {
    const scratch = new (this.constructor as new (p: Record<string, MaterialSpec>) => this)(this.palette);
    scratch.frame = this.frame;
    draw(scratch);
    return new Map([...scratch.groups].map(([mat, g]) => [mat, g.pos]));
  }

  /**
   * For `liftable`: adds a moving part (a child of the part being drawn, if any)
   * pivoted at `pivot`, which may stand beside a body drawn outside any part, as
   * a bogie does; returns its index and its parent's pivot.
   */
  movingPart(name: string, pivot: Vec3): { index: number; parentPivot: Vec3 } {
    if (this.parts.some((p) => p.name === name)) throw new Error(`part "${name}" drawn twice`);
    const parent = this.currentPart;
    this.parts.push({ name, pivot, parent, moving: true });
    return { index: this.parts.length - 1, parentPivot: parent >= 0 ? this.parts[parent]!.pivot : [0, 0, 0] };
  }

  /**
   * For `liftable`: runs `draw` with every triangle it draws sent to the part
   * `route` names for it -- per material, in drawing order; -1 keeps the current part.
   */
  drawRouted(route: Map<string, number[]>, draw: () => void): void {
    if (this.drawing || this.triRoute) throw new Error("drawRouted() inside a primitive call or another routed draw");
    this.triRoute = { parts: route, next: new Map() };
    try {
      draw();
    } finally {
      this.triRoute = null;
    }
  }

  /** For `liftable`: numbers the mechanisms of one model, 1, 2, ... */
  nextLiftable(): number {
    return ++this.liftables;
  }

  /** The name of the part being drawn (a car of a set), or null outside any part. */
  currentPartName(): string | null {
    return this.currentPart >= 0 ? this.parts[this.currentPart]!.name : null;
  }

  /** The part the next triangle of `mat` goes to: the current one, or `liftable`'s routing. */
  private routedPart(mat: string): number {
    const route = this.triRoute;
    if (!route) return this.currentPart;
    const i = route.next.get(mat) ?? 0;
    route.next.set(mat, i + 1);
    const part = route.parts.get(mat)?.[i];
    if (part === undefined) throw new Error("a routed draw drew differently from its sample");
    return part >= 0 ? part : this.currentPart;
  }

  /**
   * The model's output nodes in order: without parts one unit holding every
   * triangle (index -1); with parts a unit per part -- and, first, a body unit
   * (index -1) holding the triangles outside any part when the only parts are
   * bogies (a rigid rail vehicle's body). Throws for a triangle outside any part
   * of a model with other parts.
   */
  protected outputUnits(name: string): Array<{ name: string; pivot: Vec3; index: number }> {
    if (!this.parts.length) return [{ name, pivot: [0, 0, 0], index: -1 }];
    const loose = [...this.groups.values()].some((g) => g.part.includes(-1));
    if (loose && this.parts.some((p) => !p.bogie && !p.moving)) throw new Error("a model with parts drew a triangle outside any part");
    const parts = this.parts.map((p, index) => ({ name: p.name, pivot: p.pivot, index }));
    return loose ? [{ name, pivot: [0, 0, 0], index: -1 }, ...parts] : parts;
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
    const colors = this.pendingColors;
    if (colors && !g.col) g.col = new Array<number>(g.pos.length).fill(1);
    if (g.col) for (let k = 0; k < 3; k++) g.col.push(...(colors ? colors[k]! : [1, 1, 1] as Vec3));
    g.part.push(this.routedPart(mat));
    g.scope.push(this.lodScope);
    for (const p of [a, b, c]) {
      g.pos.push(p[0], p[1], p[2]);
      g.nrm.push(n[0] / l, n[1] / l, n[2] / l);
      for (const w of this.wheelsetBounds) {
        for (let k = 0; k < 3; k++) {
          if (p[k]! < w.min[k]!) w.min[k] = p[k]!;
          if (p[k]! > w.max[k]!) w.max[k] = p[k]!;
        }
      }
    }
  }

  /**
   * A triangle whose corners carry a colour: a linear RGB multiplier of the material's
   * colour (white leaves it as it is) -- baked shading such as a tree crown's dark
   * interior. Written as the GLB's COLOR_0 and the JS model's `color` attribute.
   */
  triShaded(mat: string, a: Vec3, b: Vec3, c: Vec3, colors: [Vec3, Vec3, Vec3]): void {
    this.pendingColors = colors;
    try {
      this.tri(mat, a, b, c);
    } finally {
      this.pendingColors = null;
    }
  }

  /** Whether any triangle carries a corner colour (see `triShaded`). */
  hasVertexColors(): boolean {
    for (const g of this.groups.values()) if (g.col) return true;
    return false;
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

  /**
   * A round rod of radius `r` from `a` to `b` with `n` sides and flat ends: its rings
   * stand square to its axis, oriented by the axis and +Z alone, so turning the rod
   * about a Z axis moves it rigidly -- a pantograph arm (`liftable`) keeps its shape
   * at every lift. Unlike a `sweep` along x, the ends are not cut vertically.
   * `ends: false` leaves both ends open (a rod end hidden inside another).
   */
  rod(mat: string, a: Vec3, b: Vec3, r: number, n = 8, ends = true): void {
    const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    if (len < 1e-9) return;
    for (let k = 0; k < 3; k++) d[k] /= len;
    // +Z with its part along the axis removed; +X for a rod along Z
    const ref: Vec3 = Math.abs(d[2]) > 0.999 ? [1, 0, 0] : [0, 0, 1];
    const along = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2];
    const side: Vec3 = [ref[0] - along * d[0], ref[1] - along * d[1], ref[2] - along * d[2]];
    const sl = Math.hypot(side[0], side[1], side[2]);
    for (let k = 0; k < 3; k++) side[k] /= sl;
    const third: Vec3 = [d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]];
    const ring = (o: Vec3): Vec3[] => Array.from({ length: n }, (_, i) => {
      const f = (i / n) * Math.PI * 2;
      const c = Math.cos(f) * r;
      const s = Math.sin(f) * r;
      return [o[0] + c * side[0] + s * third[0], o[1] + c * side[1] + s * third[1], o[2] + c * side[2] + s * third[2]];
    });
    const ra = ring(a);
    const rb = ring(b);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(mat, ra[i]!, ra[j]!, rb[j]!, rb[i]!);
    }
    if (!ends) return;
    for (let i = 1; i < n - 1; i++) {
      this.tri(mat, rb[0]!, rb[i]!, rb[i + 1]!);
      this.tri(mat, ra[0]!, ra[i + 1]!, ra[i]!);
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

  /** Every triangle corner drawn so far, model coordinates, x,y,z flat (tests, audits). */
  positions(): number[] {
    const out: number[] = [];
    for (const g of this.groups.values()) for (const v of g.pos) out.push(v);
    return out;
  }

  triangleCount(): number {
    let n = 0;
    for (const g of this.groups.values()) n += g.pos.length / 9;
    return n;
  }
}
