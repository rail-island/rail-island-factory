// The tree kit every species is drawn with: a seeded layout of lofted wood and
// foliage (leaf clumps or needle pads, hanging curtains, palm fronds), drawn at
// four levels of detail.
//
//   max     rounder wood, lumpy clumps (a core per bulge) under dense tufts of
//           faceted leaves
//   high    the forest tree: a dark core per clump under tufts of folded leaves
//   low     the trunk and limbs, each limb's clumps merged into one closed mass
//           the limb runs into, so nothing floats or ends in the air
//   coarse  one closed crown and a tetrahedral trunk
//
// A species supplies only its layout (where the wood runs and where the clumps
// sit) and a style (colours, side counts, leaf counts); docs/models/trees.md.
// No textures, transparency, random global state or Node APIs.
import type { ParamSpec } from "./design.ts";
import { Geo, boxOf, fromIndexed, icosahedronGeo, quatFromUnitVectors, type P3 } from "./treeGeo.ts";

/** The control every kit tree has: five numbered tree shapes, `1` to `5`. */
export const TREE_SEED: ParamSpec = {
  name: "seed", title: "Tree seed", default: "1", values: /* @__PURE__ */ ["1", "2", "3", "4", "5"].map((value) => ({ value, title: value })),
};

export type Parts = {
  trunk: Geo[];
  foliage: Geo[];
  ribbons?: boolean;
};
export type Station = {
  at: P3;
  r: number;
};
/** Side counts at high, Max and low detail. */
export type Sides = [high: number, max: number, low: number];
export type Limb = {
  stations: Station[];
  sides: Sides;
  phase?: number;
  // The low-detail mass (an index into `groups`) this limb runs into instead of its tip.
  mass?: number;
  // Leave the limb out at low detail (a leader through the crown carries the masses).
  skipLow?: boolean;
};
export type Clump = {
  at: P3;
  r: number;
  // Horizontal direction away from the crown's axis (zero for a top clump), and a per-clump tone.
  out: P3;
  tone: number;
  // A flattened or stretched clump (a conifer's needle pad): per-axis scale, then a turn about Y.
  scale?: P3;
  yaw?: number;
};
// A palm frond: from `at` out along the horizontal `dir`, rising `rise` at its middle
// and dropping `droop` by its tip.
export type Frond = {
  at: P3;
  dir: P3;
  length: number;
  rise: number;
  droop: number;
  tone: number;
};
// A hanging curtain of leaves (willow): from `at`, falling `length`, drifting `reach` along `out`.
export type Strand = {
  at: P3;
  out: P3;
  length: number;
  reach: number;
  tone: number;
};
export type Layout = {
  stem: Station[];
  stemSides: Sides;
  limbs: Limb[];
  twigs: Station[][];
  clumps: Clump[];
  // The clumps each low-detail mass encloses.
  groups: number[][];
  strands?: Strand[];
  fronds?: Frond[];
  // Knobs in the bark's material (a palm's crown and coconuts), at high and Max only.
  knobs?: { at: P3; r: number }[];
};
export type Palette = [dark: P3, mid: P3, light: P3];
export interface BroadleafStyle {
  // Material colours (sRGB hex): vertex colours are multipliers of these.
  colors: { trunk: string; foliage: string };
  leaf: Palette;
  bark: [dark: P3, light: P3];
  // Dark bark marks (birch): true for a wood face whose centre is at `y` on side `k`.
  barkMark?: (y: number, k: number) => boolean;
  // The height the shading measures from the ground (the tree's nominal top).
  top: number;
  roots?: { high: number; max: number; size: number };
  tufts: { high: number; highAiry: number; max: number; maxAiry: number };
  leaves: { high: number; max: number };
  leafLength: { high: number; max: number };
  // Sides of each low-detail mass (6: 24 faces, 5: 20 faces).
  massSides: number | ((group: number) => number);
  strandLeaves?: { high: number; max: number; lowSegments: number };
  // The oak's fixed coarse crown (scale and centre height before fitting); others derive it from low.
  coarseCrown?: { scale: P3; y: number };
  // Leaf blade width (a fraction of its length; 0.6) and how far it rises out of
  // the clump (radians: the base plus up to the range; 0.5 and 0.4). Needles are narrow.
  leafWidth?: number;
  leafRise?: [base: number, range: number];
  // The low-detail mass: a rounded solid (default) or a cone (conifer tiers).
  lowMass?: "round" | "cone";
  // The coarse crown: a 16-face dome (default), a square pyramid, or bare branches (dead tree).
  coarse?: "dome" | "cone" | "wood";
  // Limbs and twigs are drawn in the foliage material (a leafless tree).
  woodFoliage?: boolean;
  // Leaflet pairs per frond at high and Max detail, and the low-detail ribbon's segments.
  fronds?: { high: number; max: number; lowSegments: number };
}
export interface BroadleafOptions {
  seed: number;
  height: number;
  width: number;
  spread: number;
  density: number;
}

export const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: P3, k: number): P3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a: P3): P3 => mul(a, 1 / Math.max(1e-9, Math.hypot(...a)));
export const mix = (a: P3, b: P3, t: number): P3 => add(mul(a, 1 - t), mul(b, t));
const clamp = (x: number) => Math.min(1, Math.max(0, x));
export function random(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}
// A clump's local offset in tree space: scaled per axis, then turned about Y.
function padOffset(c: Clump, v: P3): P3 {
  if (!c.scale)
    return v;
  const x = v[0] * c.scale[0], y = v[1] * c.scale[1], z = v[2] * c.scale[2], a = c.yaw ?? 0;
  return [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
}
// A clump's half extents along the axes.
function padExtent(c: Clump, k: number): P3 {
  if (!c.scale)
    return [c.r * k, c.r * k, c.r * k];
  const a = c.yaw ?? 0, [sx, sy, sz] = c.scale;
  return [c.r * k * Math.hypot(sx * Math.cos(a), sz * Math.sin(a)), c.r * k * sy, c.r * k * Math.hypot(sx * Math.sin(a), sz * Math.cos(a))];
}
export const jitterOf = (rng: () => number) => (k: number) => (rng() - 0.5) * 2 * k;
export const bearing = (a: number): P3 => [Math.cos(a), 0, Math.sin(a)];
// A bowed branch from `start` to `end`, rising `bow` above the straight line at its middle.
export const bough = (start: P3, end: P3, r0: number, r1: number, bow: number, count = 3): Station[] =>
  Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return { at: add(mix(start, end, t), [0, bow * Math.sin(Math.PI * t), 0]), r: r0 + (r1 - r0) * t };
  });
// The limb (of `bearings`) nearest a clump's direction from `from`.
export const nearest = (at: P3, from: P3, bearings: number[]): number => {
  const a = Math.atan2(at[2] - from[2], at[0] - from[0]);
  let best = 0;
  for (let k = 1; k < bearings.length; k++)
    if (Math.cos(a - bearings[k]!) > Math.cos(a - bearings[best]!))
      best = k;
  return best;
};
export const leaning = (rng: () => number, amount: number) => {
  const a = rng() * Math.PI * 2, lean = amount * (0.6 + rng() * 0.4);
  return (t: number): P3 => mul(bearing(a), lean * t * t);
};

/** The point on a polyline of stations at height `y` (clamped to its ends). */
export function stationAt(stations: Station[], y: number): P3 {
  const i = stations.findIndex((s) => s.at[1] >= y);
  if (i < 0)
    return stations[stations.length - 1]!.at;
  if (i === 0)
    return stations[0]!.at;
  const a = stations[i - 1]!.at, b = stations[i]!.at;
  return mix(a, b, (y - a[1]) / (b[1] - a[1]));
}
// One continuous loft per limb: no visible end caps at bent branch elbows.
function limb(stations: Station[], sides: number, phase = 0): Geo {
  const points: P3[] = [], indices: number[] = [];
  stations.forEach(({ at, r }, i) => {
    const axis = unit(sub(stations[Math.min(i + 1, stations.length - 1)]!.at, stations[Math.max(0, i - 1)]!.at));
    const u = unit(cross([0, 0, 1], axis)), v = cross(axis, u);
    for (let k = 0; k < sides; k++) {
      const a = k * Math.PI * 2 / sides + phase;
      const radius = r * (1 + 0.1 * Math.sin(k * 2.3 + i * 0.65));
      const point = add(at, add(mul(u, radius * Math.cos(a)), mul(v, radius * Math.sin(a))));
      if (i === 0 && at[1] === 0)
        point[1] = 0;
      points.push(point);
    }
  });
  for (let i = 0; i < stations.length - 1; i++)
    for (let k = 0; k < sides; k++) {
      const a = i * sides + k, b = i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
      indices.push(a, b, c, b, d, c);
    }
  const top = (stations.length - 1) * sides;
  for (let k = 1; k < sides - 1; k++)
    indices.push(0, k + 1, k, top, top + k, top + k + 1);
  return fromIndexed(points, indices);
}
// Closed crown mass for the low-detail model: a solid with two rings of `sides`
// corners, 4 * sides faces, rounded enough to read as foliage rather than a gem.
function leafVolume(rx: number, ry: number, rz: number, spin: number, sides = 6): Geo {
  const points: P3[] = [[0, ry, 0], [0, -ry * 0.8, 0]], indices: number[] = [];
  for (const [y, r, off] of [[0.5, 0.88, 0], [-0.3, 1, 0.5]] as const)
    for (let k = 0; k < sides; k++) {
      const a = (k + off) * Math.PI * 2 / sides + spin;
      points.push([Math.cos(a) * rx * r, y * ry, Math.sin(a) * rz * r]);
    }
  for (let k = 0; k < sides; k++) {
    const u = 2 + k, u1 = 2 + (k + 1) % sides, l = 2 + sides + k, l1 = 2 + sides + (k + 1) % sides;
    indices.push(0, u1, u, u, u1, l, u1, l1, l, 1, l, l1);
  }
  return fromIndexed(points, indices);
}
// A closed cone for a conifer's low-detail tier: an apex over a ring of `sides`
// corners and a shallow underside, 2 * sides faces.
function coneVolume(rx: number, hy: number, rz: number, sides: number, spin: number): Geo {
  const points: P3[] = [[0, hy, 0], [0, -hy, 0]], indices: number[] = [];
  for (let k = 0; k < sides; k++) {
    const a = k * Math.PI * 2 / sides + spin;
    points.push([Math.cos(a) * rx, -hy * 0.72, Math.sin(a) * rz]);
  }
  for (let k = 0; k < sides; k++)
    indices.push(0, 2 + (k + 1) % sides, 2 + k, 1, 2 + k, 2 + (k + 1) % sides);
  return fromIndexed(points, indices);
}
// Four faces from `from` to `to`: the coarse level's trunk and bare branches. A
// trunk's base triangle lies flat, so a leaning trunk still stands on the ground.
function tetraBranch(from: P3, to: P3, radius: number, flat = false): Geo {
  const axis = flat ? [0, 1, 0] as P3 : unit(sub(to, from)), u = unit(cross(Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], axis)), v = cross(axis, u);
  const ring = [0, 1, 2].map((k) => add(from, add(mul(u, radius * Math.cos(k * Math.PI * 2 / 3)), mul(v, radius * Math.sin(k * Math.PI * 2 / 3)))));
  return fromIndexed([...ring, to], [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3]);
}
// Two edge lines joined as a strip of triangles (low-detail curtains and fronds).
function ribbonOf(left: P3[], right: P3[]): Geo {
  const pos: number[] = [];
  for (let k = 0; k < left.length - 1; k++) {
    pos.push(...left[k]!, ...right[k]!, ...left[k + 1]!);
    if (k < left.length - 2)
      pos.push(...right[k]!, ...right[k + 1]!, ...left[k + 1]!);
  }
  return new Geo(pos);
}
const linear = (x: number) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
const rgbOf = (hex: string): P3 => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as P3;
// Per-corner colours. Foliage light comes from height, from the direction the
// leaves face (`facing`, the outward direction of their tuft) and from how far
// they stand out of the crown (`exposure`), with the face normal adding facets.
function shade(style: BroadleafStyle, g: Geo, foliage: boolean, tone: number, top: number, facing?: P3, exposure = 0, sides = 0): void {
  g.col = [];
  const base = rgbOf(foliage ? style.colors.foliage : style.colors.trunk);
  const [dark, mid, light] = style.leaf;
  for (let i = 0; i < g.count; i += 3) {
    const a: P3 = [g.x(i), g.y(i), g.z(i)], b: P3 = [g.x(i + 1), g.y(i + 1), g.z(i + 1)], c: P3 = [g.x(i + 2), g.y(i + 2), g.z(i + 2)];
    const n = unit(cross(sub(b, a), sub(c, a)));
    const mark = !foliage && sides > 0 && style.barkMark?.((a[1] + b[1] + c[1]) / 3, Math.floor(i / 6) % sides);
    for (let k = 0; k < 3; k++) {
      const h = clamp(g.y(i + k) / top);
      let rgb: P3;
      if (foliage) {
        const up = facing ? 0.75 * facing[1] + 0.25 * n[1] : n[1];
        const lit = clamp(0.06 + 0.5 * h + 0.3 * up + 0.05 * n[0] + 0.16 * exposure + tone + 0.12 * clamp((h - 0.7) / 0.25));
        rgb = lit < 0.6 ? mix(dark, mid, lit / 0.6) : mix(mid, light, (lit - 0.6) / 0.4);
      } else
        rgb = mix(style.bark[0], style.bark[1], clamp(0.3 + 0.28 * h + 0.22 * n[0] + 0.1 * n[2] + 0.12 * n[1] + tone));
      if (mark)
        rgb = mix(rgb, [0.12, 0.11, 0.1], 0.85);
      g.col.push(...rgb.map((v, j) => linear(v) / linear(base[j]!)));
    }
  }
}
// A pointed leaf along +Z with its base at the origin. High detail folds it once
// along the midrib (two faces); Max raises the midrib into four facets.
function leafBlade(length: number, width: number, max: boolean): Geo {
  const base: P3 = [0, 0, 0], left: P3 = [-width / 2, -length * 0.08, length * 0.4], tip: P3 = [0, 0, length],
    right: P3 = [width / 2, -length * 0.08, length * 0.4];
  if (!max)
    return fromIndexed([base, left, tip, right], [0, 2, 1, 0, 3, 2]);
  return fromIndexed([base, left, tip, right, [0, length * 0.07, length * 0.5]], [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0]);
}
function rawTree(detail: "max" | "high" | "low", o: BroadleafOptions, plan: Layout, style: BroadleafStyle): Parts {
  const high = detail !== "low", max = detail === "max";
  const top = style.top;
  const sides = ([hi, mx, lo]: Sides) => max ? mx : high ? hi : lo;
  const stations = (s: Station[]) => high ? s : [s[0]!, s[s.length - 1]!];
  const stemSides = sides(plan.stemSides);
  // Bark marks are painted per face, so only Max, whose marked stem is divided
  // into short rings, carries them.
  const markable = (n: number) => max ? n : 0;
  const stem = max && style.barkMark ? plan.stem.flatMap((s, i) => i === 0 ? [s] : [1, 2, 3].map((k) => {
    const a = plan.stem[i - 1]!;
    return { at: mix(a.at, s.at, k / 3), r: a.r + (s.r - a.r) * k / 3 };
  })) : plan.stem;
  const trunk = [limb(high ? stem : [plan.stem[0]!, plan.stem[Math.floor(plan.stem.length / 2)]!, plan.stem[plan.stem.length - 1]!], stemSides)];
  const marks = [markable(stemSides)];
  // Low detail merges clumps into the layout's masses and runs each limb that
  // serves one into its centre, so no branch ends in the air and no clump floats.
  const masses = high ? [] : plan.groups.map((m) => {
    const lo: P3 = [Infinity, Infinity, Infinity], hi: P3 = [-Infinity, -Infinity, -Infinity];
    for (const i of m) {
      const c = plan.clumps[i]!, e = padExtent(c, 0.8);
      for (let a = 0; a < 3; a++) {
        lo[a] = Math.min(lo[a]!, c.at[a]! - e[a]!);
        hi[a] = Math.max(hi[a]!, c.at[a]! + e[a]!);
      }
    }
    return { members: m, at: mix(lo, hi, 0.5), half: mul(sub(hi, lo), 0.5) };
  });
  plan.limbs.forEach((l) => {
    if (!high && l.skipLow)
      return;
    const mass = l.mass === undefined ? undefined : masses[l.mass];
    const path = mass ? [l.stations[0]!, { at: mass.at, r: 0.06 }] : stations(l.stations);
    trunk.push(limb(path, sides(l.sides), l.phase ?? 0));
    marks.push(markable(sides(l.sides)));
  });
  if (high)
    plan.twigs.forEach((s) => {
      trunk.push(limb(max ? s : [s[0]!, s[s.length - 1]!], max ? 5 : 3));
      marks.push(0);
    });
  const woodEnd = trunk.length;
  if (high)
    (plan.knobs ?? []).forEach((k, i) => {
      trunk.push(icosahedronGeo(k.r, max ? 1 : 0).scale(1, 0.9, 1).rotateY(i * 1.3).translate(...k.at));
      marks.push(0);
    });
  // Root buttresses: a ridge from the trunk down to a tip on the ground, open
  // underneath (never seen) so nothing lies in the ground plane.
  if (high && style.roots) {
    const roots = max ? style.roots.max : style.roots.high, phase = o.seed % 7, k = style.roots.size;
    for (let i = 0; i < roots; i++) {
      const a = (i + 0.2 * Math.sin(i * 2.7 + phase)) * Math.PI * 2 / roots + phase;
      const at = (r: number, y: number, da = 0): P3 => [Math.cos(a + da) * r * k, y * k, Math.sin(a + da) * r * k];
      const reach = 1.05 + 0.15 * Math.sin(i * 1.9 + phase);
      const T = at(0.3, 1.1), P = at(reach, 0), L = at(0.5, 0, 0.42), R = at(0.5, 0, -0.42);
      trunk.push(max
        ? fromIndexed([T, at(0.72, 0.42), P, L, R], [0, 1, 3, 1, 2, 3, 0, 4, 1, 1, 4, 2])
        : fromIndexed([T, P, L, R], [0, 1, 2, 0, 3, 1]));
      marks.push(0);
    }
  }
  const foliage: Geo[] = [];
  const airy = o.density < 0.9;
  plan.clumps.forEach((c, p) => {
    const rng = random(o.seed * 7919 + p * 131 + 17);
    const exposure = Math.hypot(c.out[0], c.out[2]) > 0 ? 0.5 : 0.8;
    if (!high)
      return;
    // Two bulges make each clump lumpy, like the reference's leaf masses.
    const lobes: P3[] = [0, 1].map((k) => {
      const a = rng() * Math.PI * 2 + k * 2.5;
      return unit(add(mul(c.out, 0.6), [Math.cos(a), 0.5 + rng() * 0.6, Math.sin(a)]));
    });
    // Only Max gives the bulges cores of their own, so only Max pushes leaves out onto them.
    const bump = (d: P3) => !max ? 1 : 1 + lobes.reduce((s, l) => s + 0.22 * Math.max(0, d[0] * l[0] + d[1] * l[1] + d[2] * l[2]) ** 3, 0);
    // Dark cores close the clump so no sky shows through the leaves.
    const cores = max ? [{ at: c.at, r: c.r * 0.76 }, ...lobes.map((l) => ({ at: add(c.at, padOffset(c, mul(l, c.r * 0.42))), r: c.r * 0.5 }))]
      : [{ at: c.at, r: c.r * 0.72 }];
    cores.forEach((k, j) => {
      const core = icosahedronGeo(k.r, 0).scale(1, 0.86, 1).rotateY(rng() * Math.PI).rotateX((rng() - 0.5) * 0.4);
      if (c.scale)
        core.scale(...c.scale).rotateY(c.yaw ?? 0);
      core.translate(...k.at);
      shade(style, core, true, c.tone - 0.2 - (j === 0 ? 0.04 : 0), top);
      foliage.push(core);
    });
    // Tufts of pointed leaves spread over the clump, facing outwards.
    const rosettes = max ? (airy ? style.tufts.maxAiry : style.tufts.max) : (airy ? style.tufts.highAiry : style.tufts.high);
    const leaves = max ? style.leaves.max : style.leaves.high;
    const length = c.r * (max ? style.leafLength.max : style.leafLength.high), spin = rng() * Math.PI * 2;
    const width = style.leafWidth ?? 0.6, rise = style.leafRise ?? [0.5, 0.4];
    for (let k = 0; k < rosettes; k++) {
      const y = 1 - 2 * (k + 0.5) / rosettes;
      const ring = Math.sqrt(1 - y * y), az = k * Math.PI * (3 - Math.sqrt(5)) + spin;
      // Lift the distribution: more tufts on the lit top than underneath.
      const d = unit([ring * Math.cos(az), y * 0.8 + 0.2, ring * Math.sin(az)]);
      // A stretched pad's tufts sit a little deeper, so its long ends stay rooted in the core.
      const deep = c.scale ? 0.88 : 1;
      const centre = add(c.at, padOffset(c, [d[0] * c.r * bump(d) * 0.66 * deep, d[1] * c.r * bump(d) * 0.6 * deep, d[2] * c.r * bump(d) * 0.66 * deep]));
      // A flattened pad's surface faces along the inverse-scaled direction.
      const facing = unit(add(c.scale ? unit(padOffset({ ...c, scale: [1 / c.scale[0], 1 / c.scale[1], 1 / c.scale[2]] }, d)) : d, [0, 0.25, 0]));
      const q = quatFromUnitVectors([0, 1, 0], facing);
      const twist = rng() * Math.PI * 2, size = 0.85 + rng() * 0.3;
      const outwards = clamp(0.5 + 0.5 * (d[0] * c.out[0] + d[2] * c.out[2]));
      const tone = c.tone + (rng() - 0.4) * 0.1;
      for (let j = 0; j < leaves; j++) {
        // Tufts, not flat stars: each leaf rises 30-50 degrees out of the surface.
        const leaf = leafBlade(length * size * (j % 2 ? 0.85 : 1), length * size * width, max)
          .translate(0, 0, length * 0.06).rotateX(-rise[0] - rng() * rise[1]).rotateY(twist + j * Math.PI * 2 / leaves + (rng() - 0.5) * 0.3)
          .applyQuaternion(q).translate(...centre);
        shade(style, leaf, true, tone, top, facing, exposure * outwards);
        foliage.push(leaf);
      }
    }
  });
  // Hanging curtains: chains of leaves down a falling curve (a ribbon at low detail).
  (plan.strands ?? []).forEach((s, i) => {
    const point = (t: number): P3 => add(s.at, add(mul(s.out, s.reach * Math.sin(t * Math.PI / 2)), [0, -s.length * t, 0]));
    const side = unit(cross([0, 1, 0], s.out));
    const facing = unit(add(s.out, [0, 0.4, 0]));
    if (!high) {
      const segments = style.strandLeaves!.lowSegments, left: P3[] = [], right: P3[] = [];
      for (let k = 0; k <= segments; k++) {
        const t = k / segments, w = 0.22 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)) * (s.length / 3);
        left.push(add(point(t), mul(side, -w)));
        right.push(add(point(t), mul(side, w)));
      }
      const ribbon = ribbonOf(left, right);
      shade(style, ribbon, true, s.tone, top, facing, 0.5);
      foliage.push(ribbon);
      return;
    }
    const count = max ? style.strandLeaves!.max : style.strandLeaves!.high;
    const length = s.length / count * 2.3;
    for (let k = 0; k < count; k++) {
      const t = (k + 0.3) / count, at = point(t), along = unit(sub(point(Math.min(1, t + 0.05)), at));
      // Leaves alternate left and right of the strand, pointing down along it.
      const swing = (k % 2 ? 1 : -1) * (0.35 + 0.2 * Math.sin(i * 1.7 + k));
      const dir = unit(add(along, mul(side, swing)));
      const leaf = leafBlade(length * (1 - 0.3 * t), length * 0.5, max)
        .rotateZ(0.6 * Math.sin(i + k * 1.3))
        .applyQuaternion(quatFromUnitVectors([0, 0, 1], dir)).translate(...at);
      shade(style, leaf, true, s.tone - 0.08 * t, top, facing, 0.5);
      foliage.push(leaf);
    }
  });
  // Palm fronds: pairs of leaflets down an arching midrib (a ribbon at low detail).
  (plan.fronds ?? []).forEach((f) => {
    const point = (t: number): P3 => add(f.at, add(mul(f.dir, f.length * t), [0, f.rise * Math.sin(Math.PI * t) - f.droop * t * t, 0]));
    const side = unit(cross([0, 1, 0], f.dir));
    if (!high) {
      const segments = style.fronds!.lowSegments, left: P3[] = [], right: P3[] = [];
      for (let k = 0; k <= segments; k++) {
        const t = k / segments, w = f.length * 0.17 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.88));
        left.push(add(point(t), add(mul(side, -w), [0, -w * 0.35, 0])));
        right.push(add(point(t), add(mul(side, w), [0, -w * 0.35, 0])));
      }
      const ribbon = ribbonOf(left, right);
      shade(style, ribbon, true, f.tone, top, [0, 1, 0], 0.6);
      foliage.push(ribbon);
      return;
    }
    const pairs = max ? style.fronds!.max : style.fronds!.high;
    for (let k = 0; k < pairs; k++) {
      const t = 0.06 + 0.92 * (k + 0.5) / pairs, at = point(t), along = unit(sub(point(t + 0.02), at));
      // Long leaflets swept toward the tip overlap along the midrib, so the frond reads as one leaf.
      const length = f.length * (0.12 + 0.4 * Math.sin(Math.PI * (0.1 + 0.9 * t)));
      for (const s of [-1, 1]) {
        const dir = unit(add(add(mul(side, s), mul(along, 1.1)), [0, -0.35 - 0.35 * t, 0]));
        const leaf = leafBlade(length, length * (max ? 0.16 : 0.24), max).rotateZ(s * 0.5)
          .applyQuaternion(quatFromUnitVectors([0, 0, 1], dir)).translate(...at);
        shade(style, leaf, true, f.tone + 0.06 * (1 - t), top, [0, 1, 0], 0.6);
        foliage.push(leaf);
      }
    }
  });
  masses.forEach((m, j) => {
    const lead = plan.clumps[m.members[0]!]!;
    const out = m.members.length > 1 ? 0.6 : Math.hypot(lead.out[0], lead.out[2]) > 0 ? 0.5 : 0.8;
    const n = typeof style.massSides === "number" ? style.massSides : style.massSides(j);
    const mass = (style.lowMass === "cone" ? coneVolume(m.half[0] * 1.15, m.half[1], m.half[2] * 1.15, n, j * 0.7)
      : leafVolume(m.half[0] * 1.12, m.half[1] * 1.06, m.half[2] * 1.12, j * 0.7, n)).translate(...m.at);
    shade(style, mass, true, lead.tone, top, [0, 0.3, 0], out);
    foliage.push(mass);
  });
  trunk.forEach((g, i) => shade(style, g, false, 0, top, undefined, 0, marks[i]));
  // A leafless tree carries its limbs and twigs in the foliage material.
  if (style.woodFoliage)
    foliage.push(...trunk.splice(1, woodEnd - 1));
  for (const g of [...trunk, ...foliage])
    g.scale(o.width, o.height, o.width);
  // Single-layer leaves, curtains and fronds are drawn double-sided.
  const ribbons = high ? plan.clumps.length > 0 || !!plan.strands?.length || !!plan.fronds?.length
    : !!plan.strands?.length || !!plan.fronds?.length;
  return { trunk, foliage, ...(ribbons ? { ribbons: true } : {}) };
}
// Fit simplified silhouettes to the high model's exact extents; all transforms
// are around the foot, and colours have already been painted in tree space.
function fit(parts: Parts, target: Parts): Parts {
  const have = boxOf([...parts.trunk, ...parts.foliage]), want = boxOf([...target.trunk, ...target.foliage]);
  for (const g of [...parts.trunk, ...parts.foliage])
    g.map((x, y, z) => {
      const p: P3 = [x, y, z];
      return p.map((v, k) => k === 1 ? v * want.max[k]! / have.max[k]!
        : v * (v < 0 ? want.min[k]! / have.min[k]! : want.max[k]! / have.max[k]!)) as P3;
    });
  return parts;
}
/** One broadleaf tree at one level: low and Max fitted to the high tree's exact bounds, coarse to low's. */
export function broadleafParts(detail: "max" | "high" | "low" | "coarse", o: BroadleafOptions, layout: (o: BroadleafOptions) => Layout, style: BroadleafStyle): Parts {
  const high = rawTree("high", o, layout(o), style);
  if (detail === "high")
    return high;
  if (detail === "max")
    return fit(rawTree("max", o, layout(o), style), high);
  const low = fit(rawTree("low", o, layout(o), style), high);
  if (detail === "low")
    return low;
  const f = boxOf(low.foliage), stem = boxOf([low.trunk[0]!]);
  const centre: P3 = [(f.max[0] + f.min[0]) / 2, 0, (f.max[2] + f.min[2]) / 2];
  const r = Math.max(0.08, (stem.max[0] - stem.min[0]) / 2);
  const foot = (y: number) => tetraBranch([0, 0, 0], [centre[0], y, centre[2]], r, true);
  if (style.coarse === "wood") {
    // A leafless tree: the trunk and its first three limbs as bare spikes.
    const plan = layout(o), scale = (p: P3): P3 => [p[0] * o.width, p[1] * o.height, p[2] * o.width];
    const wood = tetraBranch([0, 0, 0], scale(plan.stem[plan.stem.length - 1]!.at), r, true);
    const branches = plan.limbs.slice(0, 3).map((l) => tetraBranch(scale(l.stations[0]!.at), scale(l.stations[l.stations.length - 1]!.at), 0.09));
    const coarse = fit({ trunk: [wood], foliage: branches }, low);
    const topY = boxOf([...coarse.trunk, ...coarse.foliage]).max[1];
    for (const g of [wood, ...branches])
      shade(style, g, false, 0, topY);
    return coarse;
  }
  let crown: Geo, wood: Geo;
  if (style.coarse === "cone") {
    // A square pyramid over the low foliage's box: six closed faces.
    crown = fromIndexed([[0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]], [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 1, 2, 3, 1, 3, 4]);
    crown.scale((f.max[0] - f.min[0]) / 2, f.max[1] - f.min[1], (f.max[2] - f.min[2]) / 2).translate(centre[0], f.min[1], centre[2]);
    wood = foot(f.min[1] + (f.max[1] - f.min[1]) * 0.3);
  } else {
    // Subdivide the four diamond edges into an eight-sided crown: 16 closed faces.
    const points: P3[] = [[0, 1, 0], [0, -0.65, 0]], indices: number[] = [];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      points.push([Math.cos(a), 0, Math.sin(a)]);
    }
    for (let i = 0; i < 8; i++) {
      const a = 2 + i, b = 2 + (i + 1) % 8;
      indices.push(0, b, a, 1, a, b);
    }
    crown = fromIndexed(points, indices);
    if (style.coarseCrown) {
      crown.scale(...style.coarseCrown.scale).translate(0, style.coarseCrown.y, 0);
      wood = fromIndexed([[0, 0, 0.6], [-0.52, 0, -0.3], [0.52, 0, -0.3], [0, 5, 0]], [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]);
    } else {
      // The crown spans the low foliage's own box; the trunk rises into its middle.
      const half: P3 = [(f.max[0] - f.min[0]) / 2, (f.max[1] - f.min[1]) / 1.65, (f.max[2] - f.min[2]) / 2];
      crown.scale(...half).translate(centre[0], f.min[1] + half[1] * 0.65, centre[2]);
      const y = f.min[1] + half[1] * 0.65;
      wood = fromIndexed([[0, 0, r], [-r * 0.87, 0, -r / 2], [r * 0.87, 0, -r / 2], [centre[0], y, centre[2]]],
        [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]);
    }
  }
  const coarse = fit({ trunk: [wood], foliage: [crown] }, low);
  shade(style, wood, false, 0, boxOf(coarse.foliage).max[1]);
  shade(style, crown, true, 0, boxOf(coarse.foliage).max[1]);
  return coarse;
}
