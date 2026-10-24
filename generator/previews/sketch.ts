// The drawing kit of the site's preview designs (docs/models/previews.md): the game's
// structure vocabulary -- boxes at a centre with a size, tilted about X or Z or
// turned about Y, gable prisms, bars between two points, round poles, sections swept
// along a path -- drawn into one MeshBuilder. A material may name a surface
// (surfaces.ts), so the site's 3D preview shows the photo the game binds.
//
// Two materials never share a plane: each material is drawn a hair bigger than the
// one registered before it (a sweep's ends drawn out too), so flush faces of the
// game's geometry -- a parapet standing on a deck, a pier under an abutment, a glass
// pane in its rib -- do not flicker. A box standing on the ground keeps its foot
// there and draws no floor.
//
// No node: imports: a preview design's JS model bundles this.

import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 as V } from "../meshCore.ts";
import { surfaceMaterial, type SurfaceId } from "../surfaces.ts";

export type Rgb = readonly [number, number, number];
export type { V };

export const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a: V): V => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const scale = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];

export const hex = (c: Rgb): string => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

const ROUGHNESS: Record<string, number> = { steel: 0.38, glass: 0.06, light: 0.4, cable: 0.3, wire: 0.5 };
const METALLIC: Record<string, number> = { steel: 0.5, glass: 0.1, cable: 0.6, wire: 0.6, rail: 0.7 };

/** A box in the game's vocabulary: centre and size, tilted about Z then X, turned about Y; or a gable prism. */
export interface SketchBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  rotX?: number;
  rotZ?: number;
  yaw?: number;
  profile?: "gable";
  /** The top face scaled about the box's axis (a tapering pier). */
  topScale?: number;
}

/** What a part draws with: the builder's two primitives (build() may lift them). */
export type Pen = Pick<MeshBuilder, "quad" | "tri">;
type Op = (m: Pen) => void;

export class Sketch {
  private readonly palette: Record<string, MaterialSpec> = {};
  private readonly ranks = new Map<string, number>();
  private readonly ops: Op[] = [];
  /** The lowest point drawn, to stand a preview on the ground. */
  low = Infinity;

  /**
   * A material by kind and colour (the kind sets roughness and metalness: steel,
   * glass, ...), optionally drawing with a named surface's photo. Its name is
   * `<kind><#rrggbb>[@<surface>]`.
   */
  mat(kind: string, color: Rgb, surface?: SurfaceId): string {
    const name = `${kind}${hex(color)}${surface ? `@${surface}` : ""}`;
    if (!this.palette[name]) {
      this.palette[name] = surface
        ? surfaceMaterial(surface, { color: hex(color), roughness: ROUGHNESS[kind] ?? 0.9, metallic: METALLIC[kind] ?? 0 })
        : { color: hex(color), roughness: ROUGHNESS[kind] ?? 0.7, metallic: METALLIC[kind] ?? 0 };
      this.ranks.set(name, this.ranks.size);
    }
    return name;
  }

  /**
   * How far inside its true size material `mat` is drawn: negative, every material
   * grown by a step of its own (one more per material, an odd step no sum of the
   * game's measures lands on), so two flush faces of two materials always end apart
   * and no part, however thin, turns inside out. `size` is kept for a part that
   * could only take a smaller step.
   */
  private inset(mat: string, _size = Infinity): number {
    return -(this.ranks.get(mat) ?? 0) * 0.0041337;
  }

  private track(...ps: V[]): void {
    for (const p of ps) this.low = Math.min(this.low, p[1]);
  }

  /** A box in the game's vocabulary (`SketchBox`). */
  box(mat: string, b: SketchBox): void {
    const onGround = b.cy - b.sy / 2 <= 1e-6 && !b.rotX && !b.rotZ;
    this.track([b.cx, b.cy - b.sy / 2, b.cz]);
    this.ops.push((m) => {
      const ex = this.inset(mat, b.sx), ey = this.inset(mat, b.sy), ez = this.inset(mat, b.sz);
      const hx = b.sx / 2 - ex, hz = b.sz / 2 - ez;
      // a box on the ground keeps its foot there: only its top comes in
      const hy = b.sy / 2 - (onGround ? ey / 2 : ey);
      const cy = onGround ? b.cy - ey / 2 : b.cy;
      const rz = b.rotZ ?? 0, rx = b.rotX ?? 0, yaw = b.yaw ?? 0;
      // local -> world: Rz, then Rx, then Ry(yaw), about the centre
      const turn = (p: V): V => {
        const x1 = p[0] * Math.cos(rz) - p[1] * Math.sin(rz), y1 = p[0] * Math.sin(rz) + p[1] * Math.cos(rz), z1 = p[2];
        const y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx), z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);
        return [x1 * Math.cos(yaw) + z2 * Math.sin(yaw), y2, -x1 * Math.sin(yaw) + z2 * Math.cos(yaw)];
      };
      const c: V = [b.cx, cy, b.cz];
      if (b.profile === "gable") {
        const at = (x: number, y: number, z: number): V => add(c, turn([x, y, z]));
        const p = [at(-hx, -hy, hz), at(hx, -hy, hz), at(0, hy, hz), at(-hx, -hy, -hz), at(hx, -hy, -hz), at(0, hy, -hz)] as const;
        triFace(m, mat, p[0], p[1], p[2], c);
        triFace(m, mat, p[3], p[4], p[5], c);
        face(m, mat, p[0], p[2], p[5], p[3], c);
        face(m, mat, p[2], p[1], p[4], p[5], c);
        face(m, mat, p[0], p[3], p[4], p[1], c);
        return;
      }
      orientedBox(m, mat, c, turn([hx, 0, 0]), turn([0, hy, 0]), turn([0, 0, hz]), b.topScale ?? 1, !onGround);
    });
  }

  /** A square bar `thick` wide from `a` to `b`. */
  bar(mat: string, a: V, b: V, thick: number): void {
    this.span(mat, a, b, thick, thick);
  }

  /** A box from `a` to `b`, `w` wide and `h` tall about the line (its height as near world up as the line allows). */
  span(mat: string, a: V, b: V, w: number, h: number): void {
    const d = sub(b, a), len = Math.hypot(...d);
    if (len < 0.05) return;
    this.track(a, b);
    this.ops.push((m) => {
      const e = this.inset(mat, Math.min(w, h));
      const along = norm(d);
      const ref: V = Math.abs(along[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const side = norm(cross(ref, along));
      const up = norm(cross(along, side));
      const half = Math.max(len / 2 - e, len / 4);
      orientedBox(m, mat, add(a, d, 0.5), scale(side, w / 2 - e), scale(up, h / 2 - e), scale(along, half));
    });
  }

  /** A round pole of `sides` facets from y0 up to y1 at (x, z), `radius` thick. */
  pole(mat: string, x: number, z: number, y0: number, y1: number, radius: number, sides = 8): void {
    this.track([x, y0, z]);
    this.ops.push((m) => {
      const r = radius - this.inset(mat, radius);
      const ring = Array.from({ length: sides }, (_, k) => [Math.cos((k / sides) * 2 * Math.PI) * r, Math.sin((k / sides) * 2 * Math.PI) * r] as const);
      const lo = ring.map(([u, w]) => [x + u, y0, z + w] as V), hi = ring.map(([u, w]) => [x + u, y1, z + w] as V);
      const c: V = [x, (y0 + y1) / 2, z];
      for (let k = 0; k < sides; k++) face(m, mat, lo[k]!, lo[(k + 1) % sides]!, hi[(k + 1) % sides]!, hi[k]!, c);
      fan(m, mat, hi, c);
      if (y0 > 1e-6) fan(m, mat, lo, c);
    });
  }

  /** A square pyramid roof: its eave centre, half-width at the eave and height. */
  pyramid(mat: string, x: number, y: number, z: number, half: number, height: number): void {
    this.ops.push((m) => {
      const h = half - this.inset(mat, half);
      const base: V[] = [[x - h, y, z - h], [x + h, y, z - h], [x + h, y, z + h], [x - h, y, z + h]];
      const apex: V = [x, y + height, z], c: V = [x, y + height / 3, z];
      for (let k = 0; k < 4; k++) triFace(m, mat, base[k]!, base[(k + 1) % 4]!, apex, c);
      face(m, mat, base[0]!, base[1]!, base[2]!, base[3]!, c);
    });
  }

  /**
   * A closed section swept along `path`: at each point, `section` (lateral offset u to
   * the right of travel, height v) placed on the mitred frame. `height` places v: added
   * to the path point's own y, or absolute when `absolute`.
   */
  sweep(mat: string, path: readonly V[], section: readonly (readonly [number, number])[], absolute = false): void {
    if (path.length < 2) return;
    for (const p of path) for (const [, v] of section) this.track([p[0], absolute ? v : p[1] + v, p[2]]);
    this.ops.push((m) => {
      const e = this.inset(mat, 0.5);
      const pts = trimEnds(path.slice(), e), lat = laterals(pts);
      const cu = section.reduce((s, q) => s + q[0], 0) / section.length, cv = section.reduce((s, q) => s + q[1], 0) / section.length;
      const rings = pts.map((p, i) => section.map(([u0, v0]) => {
        const u = u0 - Math.sign(u0 - cu) * e, v = v0 - Math.sign(v0 - cv) * e;
        const q = add(p, lat[i]!, u);
        return [q[0], absolute ? v : p[1] + v, q[2]] as V;
      }));
      sweepRings(m, mat, rings);
    });
  }

  /**
   * A wall of varying height along `path`: laterally from `u0` to `u1` to the right of
   * travel, from bottoms[i] up to tops[i] (absolute heights) at point i.
   */
  wall(mat: string, path: readonly V[], u0: number, u1: number, bottoms: readonly number[], tops: readonly number[]): void {
    if (path.length < 2) return;
    path.forEach((p, i) => this.track([p[0], bottoms[i]!, p[2]]));
    this.ops.push((m) => {
      const e = this.inset(mat, 0.5);
      const pts = trimEnds(path.slice(), e), lat = laterals(pts);
      sweepRings(m, mat, pts.map((p, i) => [[u0 + e, bottoms[i]! + e], [u1 - e, bottoms[i]! + e], [u1 - e, tops[i]! - e], [u0 + e, tops[i]! - e]]
        .map(([u, y]) => { const q = add(p, lat[i]!, u!); return [q[0], y!, q[2]] as V; })));
    });
  }

  /** A section whose rings are given per path point (a wall of varying height). */
  rings(mat: string, rings: V[][]): void {
    for (const r of rings) this.track(...r);
    this.ops.push((m) => sweepRings(m, mat, rings));
  }

  /** Any other drawing, straight into the builder (it must use materials registered here). */
  draw(fn: (m: Pen) => void): void {
    this.ops.push(fn);
  }

  /** The model: every part in its own scope, its lowest point on the ground (y = 0). */
  build(prefix = "part"): MeshBuilder {
    const probe = new MeshBuilder(this.palette);
    this.ops.forEach((op, i) => probe.scope(`${prefix}-${i}`, () => op(probe)));
    const pos = probe.positions();
    let low = Infinity;
    for (let i = 1; i < pos.length; i += 3) low = Math.min(low, pos[i]!);
    return low === Infinity || Math.abs(low) < 1e-9 ? probe : this.drawn(prefix, -low);
  }

  private drawn(prefix: string, lift: number): MeshBuilder {
    const m = new MeshBuilder(this.palette);
    const up = (p: V): V => [p[0], p[1] + lift, p[2]];
    const pen: Pen = lift ? { quad: (mat, a, b, c, d) => m.quad(mat, up(a), up(b), up(c), up(d)), tri: (mat, a, b, c) => m.tri(mat, up(a), up(b), up(c)) } : m;
    this.ops.forEach((op, i) => m.scope(`${prefix}-${i}`, () => op(pen)));
    return m;
  }
}

/** A quad wound to face away from `inside`. */
export function face(m: Pen, mat: string, a: V, b: V, c: V, d: V, inside: V): void {
  const mid: V = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  if (dot(cross(sub(b, a), sub(c, a)), sub(mid, inside)) >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, d, c, b, a);
}

function triFace(m: Pen, mat: string, a: V, b: V, c: V, inside: V): void {
  const mid: V = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  if (dot(cross(sub(b, a), sub(c, a)), sub(mid, inside)) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, c, b, a);
}

function fan(m: Pen, mat: string, ring: V[], inside: V): void {
  const c = ring.reduce((s, p) => add(s, p, 1 / ring.length), [0, 0, 0] as V);
  for (let k = 0; k < ring.length; k++) triFace(m, mat, c, ring[k]!, ring[(k + 1) % ring.length]!, inside);
}

/** An oriented box: centre, three half-axes; the top face scaled by `top`. */
function orientedBox(m: Pen, mat: string, c: V, ax: V, ay: V, az: V, top = 1, floor = true): void {
  const corner = (sx: number, sy: number, sz: number): V => {
    const k = sy > 0 ? top : 1;
    return add(add(add(c, ax, sx * k), ay, sy), az, sz * k);
  };
  const p = [corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1), corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)] as const;
  face(m, mat, p[0], p[3], p[2], p[1], c);
  face(m, mat, p[4], p[5], p[6], p[7], c);
  face(m, mat, p[0], p[4], p[7], p[3], c);
  face(m, mat, p[1], p[2], p[6], p[5], c);
  face(m, mat, p[3], p[7], p[6], p[2], c);
  if (floor) face(m, mat, p[0], p[1], p[5], p[4], c);
}

/** The miter frame along a path: the right-of-travel unit (horizontal), widened at a bend. */
export function laterals(pts: readonly V[]): V[] {
  const rights = pts.slice(0, -1).map((p, i) => norm([-(pts[i + 1]![2] - p[2]), 0, pts[i + 1]![0] - p[0]]));
  return pts.map((_, i) => {
    if (i === 0) return rights[0]!;
    if (i === pts.length - 1) return rights[rights.length - 1]!;
    const miter = norm(add(rights[i - 1]!, rights[i]!));
    return scale(miter, 1 / Math.max(dot(miter, rights[i - 1]!), 0.3));
  });
}

function sweepRings(m: Pen, mat: string, rings: V[][]): void {
  const centre = (ring: V[]): V => ring.reduce((s, p) => add(s, p, 1 / ring.length), [0, 0, 0] as V);
  for (let i = 0; i + 1 < rings.length; i++) {
    const a = rings[i]!, b = rings[i + 1]!;
    const inside = centre([...a, ...b]);
    for (let k = 0; k < a.length; k++) face(m, mat, a[k]!, a[(k + 1) % a.length]!, b[(k + 1) % a.length]!, b[k]!, inside);
  }
  for (const [ring, next] of [[rings[0]!, rings[1]!], [rings[rings.length - 1]!, rings[rings.length - 2]!]] as const) {
    if (ring.length === 4) face(m, mat, ring[0]!, ring[1]!, ring[2]!, ring[3]!, centre(next));
    else fan(m, mat, ring, centre(next));
  }
}

/**
 * A path with both ends moved by its material's inset (out, for a negative one), so two
 * sweeps ending on one plane do not share it. The step is not the boxes' own (a sloped
 * end moved along its slope could land exactly on a box face), and never a sum of it.
 */
function trimEnds(pts: V[], inset: number): V[] {
  const e = inset * 0.77;
  if (pts.length < 2 || e === 0) return pts;
  const out = pts.slice();
  const pull = (i: number, toward: number): void => {
    const d = sub(pts[toward]!, pts[i]!), l = Math.hypot(...d);
    if (l > 2 * Math.abs(e)) out[i] = add(pts[i]!, d, e / l);
  };
  pull(0, 1);
  pull(pts.length - 1, pts.length - 2);
  return out;
}

/** The catalog fields every preview design carries, in its category and group. */
export function previewCatalog(category: PreviewCategory, group: string, gameId?: string): { category: PreviewCategory; group: string; gameId?: string; defaultScale: 1; license: "CC0"; author: "Rail Island"; source: "Rail Island" } {
  return { category, group, ...(gameId ? { gameId } : {}), defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" };
}

/** The site's categories of preview designs (src/catalogQuery.ts). */
export type PreviewCategory = "Structures" | "Rails and roads" | "City blocks" | "Textures" | "Props";

/** A set id as a model id segment: `stone_arch` -> `stone-arch`. */
export const idPart = (id: string): string => id.replace(/_/g, "-");
