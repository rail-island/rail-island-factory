// The tree species: one design per species (proc-tree-<species>; the two larches
// are one design, proc-tree-larch, with a `season` parameter), each with three
// levels of detail -- `high` (the design), `low` (its buildLod) and `coarse`
// (buildCoarse, the trees' own third level). The game draws them instanced across
// whole forests, so every species is two materials, `trunk` and `foliage`, and is
// base-anchored at y = 0. Units are the game's studs, numerically: the game scales
// each tree to the height its woods type asks for (docs/models/trees.md).
//
// Ported from the game's render/TreeGeometry.ts; the shapes, budgets and the
// reasons behind them are documented in docs/models/trees.md. No `node:` imports.

import { oakParts, oakOptions, OAK_COLORS, OAK_PARAMS, type OakOptions } from "./oak.ts";
import { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { Geo, boxOf, coneGeo, cylinderGeo, fromIndexed, icosahedronGeo, quatFromUnitVectors, type P3 } from "./treeGeo.ts";

/** Every species the game knows, by its stable key (saved in the game's maps). */
export const SPECIES = [
  "pine", "spruce", "oak", "birch", "aspen", "willow", "palm", "bush", "deadtree",
  "scotspine", "larch", "autumnlarch", "hazel", "orchard",
] as const;
export type Species = (typeof SPECIES)[number];

export type TreeDetail = "coarse" | "low" | "high";

/**
 * Per-species trunk and foliage colours (sRGB hex): the mid-tone of the crown. The
 * baked shading (paint) darkens the inside and the underside below it and lifts the
 * sunlit top above it, so these sit a little brighter and more saturated than a
 * flat-shaded tree would want -- the stylised, readable look (docs/models/trees.md).
 */
export const TREE_COLORS: Record<Species, { trunk: string; foliage: string }> = {
  pine: { trunk: "#7a4f2a", foliage: "#33774a" },
  oak: OAK_COLORS,
  bush: { trunk: "#634626", foliage: "#5f8a34" },
  palm: { trunk: "#94703a", foliage: "#4fa443" },
  // slender white trunk, light-green rounded crown
  birch: { trunk: "#e2ddd0", foliage: "#86b84a" },
  // tall narrow conifer, blue-tinged deep green
  spruce: { trunk: "#664526", foliage: "#2a6648" },
  // drooping soft-green canopy
  willow: { trunk: "#6f5533", foliage: "#93b850" },
  // pale grey-green bark, tall narrow column of small bright leaves
  aspen: { trunk: "#cbc9b2", foliage: "#a2c94f" },
  // bare, leafless dead trunk with a couple of stubs (no foliage)
  deadtree: { trunk: "#7a6650", foliage: "#7a6650" },
  scotspine: { trunk: "#a86a3e", foliage: "#548a52" },
  larch: { trunk: "#7e6146", foliage: "#8fbd4f" },
  autumnlarch: { trunk: "#7e6146", foliage: "#e0a83a" },
  hazel: { trunk: "#7e6246", foliage: "#73a443" },
  orchard: { trunk: "#7f5532", foliage: "#6aa242" },
};

/** A deterministic float in [0, 1) for two integers: the crowns' irregularity. */
function hash01(a: number, b: number): number {
  let n = (Math.imul(a | 0, 0x27d4eb2f) ^ Math.imul(b | 0, 0x165667b1)) | 0;
  n ^= n >>> 15;
  n = Math.imul(n, 0x85ebca6b);
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

/** Display titles for the catalog. */
const TITLES: Record<Species, string> = {
  pine: "Pine", spruce: "Spruce", oak: "Oak", birch: "Birch", aspen: "Aspen", willow: "Willow",
  palm: "Palm", bush: "Bush", deadtree: "Dead tree", scotspine: "Mature Scots pine", larch: "European larch",
  autumnlarch: "Autumn larch", hazel: "Hazel", orchard: "Orchard tree",
};

// What one detail level does to every primitive in the tree.
//
//   seg     multiplier on radial-segment counts (rounded, never below the
//           primitive's own minimum)
//   sphere  icosahedron subdivision for crowns and canopy clumps
//   ribbon  multiplier on the segment count of the flat ribbons (palm fronds,
//           willow sprays), which is what lets them curve instead of crease
//   extras  build the additional decorative parts (branch whorls, intermediate
//           conifer tiers, secondary foliage clumps, trunk flares)
type Lod = { seg: number; sphere: number; ribbon: number; extras: boolean };

const LODS: Record<Exclude<TreeDetail, "coarse">, Lod> = {
  low: { seg: 1, sphere: 0, ribbon: 1, extras: false },
  high: { seg: 1.8, sphere: 1, ribbon: 2, extras: true },
};

const segs = (lod: Lod, base: number): number => Math.max(base, Math.round(base * lod.seg));

// A vertical primitive whose BASE sits at y = 0.
function cyl(lod: Lod, radiusTop: number, radiusBottom: number, height: number, y: number, radial = 6, heightSegments = 1): Geo {
  return cylinderGeo(radiusTop, radiusBottom, height, segs(lod, radial), heightSegments).translate(0, y + height / 2, 0);
}

function cone(lod: Lod, radius: number, height: number, y: number, radial = 7): Geo {
  const g = coneGeo(radius, height, segs(lod, radial));
  // Uneven skirts and slightly offset leaders break the lathed silhouette using
  // the existing vertices. A position-based deformation keeps duplicated seams
  // together, including the underside cap.
  for (let i = 0; i < g.count; i++) {
    const x = g.x(i), z = g.z(i);
    const angle = Math.atan2(z, x);
    const t = (g.y(i) + height / 2) / height;
    const edge = Math.min(1, Math.hypot(x, z) / radius);
    const ripple = 1 + 0.11 * Math.sin(angle * 3 + y * 1.7) + 0.05 * Math.sin(angle * 5 - y);
    g.set(i, x * ripple + t * radius * 0.08 * Math.sin(y), g.y(i) + edge * height * 0.045 * Math.sin(angle * 2 + y), z * ripple);
  }
  return g.translate(0, y + height / 2, 0);
}

function blob(lod: Lod, radius: number, y: number): Geo {
  // squash slightly and lift so it reads as a rounded canopy
  return icosahedronGeo(radius, lod.sphere).scale(1, 0.85, 1).translate(0, y, 0);
}

// A deliberately uneven ellipsoid. Clustered ellipsoids make broadleaf crowns
// read as masses of foliage instead of stacked balls.
function crownBlob(lod: Lod, radius: number, scaleX: number, scaleY: number, scaleZ: number, x: number, y: number, z: number): Geo {
  const g = icosahedronGeo(radius, lod.sphere);
  softenCrown(g, radius, x * 0.73 + y * 1.17 + z * 0.41);
  return g.scale(scaleX, scaleY, scaleZ).rotateY((x * 0.73 + z * 0.41) % Math.PI).translate(x, y, z);
}

// Broad undulations, rather than independent random vertices, keep each lobe
// coherent and watertight.
function softenCrown(g: Geo, radius: number, seed: number): void {
  for (let i = 0; i < g.count; i++) {
    const x = g.x(i) / radius, y = g.y(i) / radius, z = g.z(i) / radius;
    // a third, finer lump breaks the outline into bumps (the ragged, stylised crown)
    const r = 1 + 0.12 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 - seed) + 0.07 * Math.sin(y * 4.3 + z * 2 + seed)
      + 0.06 * Math.sin(x * 5.3 - z * 4.1 + seed * 2);
    g.set(i, x * radius * r, y * radius * r, z * radius * r);
  }
}

// Low-poly tapered branch joining two points.
function branch(lod: Lod, from: P3, to: P3, radiusFrom: number, radiusTo: number, radial = 5): Geo {
  const d: P3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const length = Math.hypot(d[0], d[1], d[2]);
  const g = cylinderGeo(radiusTo, radiusFrom, length, segs(lod, radial));
  g.applyQuaternion(quatFromUnitVectors([0, 1, 0], [d[0] / length, d[1] / length, d[2] / length]));
  return g.translate((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
}

// Two edge lines joined as a strip of triangles (willow sprays, palm fronds).
function ribbon(left: P3[], right: P3[], segments: number): Geo {
  const pos: number[] = [];
  const push = (p: P3) => pos.push(p[0], p[1], p[2]);
  for (let i = 0; i < segments; i++) {
    push(left[i]!); push(right[i]!); push(left[i + 1]!);
    if (i < segments - 1) { push(right[i]!); push(right[i + 1]!); push(left[i + 1]!); }
  }
  return new Geo(pos);
}

// One ribbon-like curtain of willow leaves, moving outward from its branch while
// falling, with a slight sideways bend.
function willowSpray(length: number, reach: number, width: number, bend: number, segments = 5): Geo {
  const left: P3[] = [];
  const right: P3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = reach * (1 - Math.pow(1 - t, 1.7));
    const y = -length * (0.35 * t + 0.65 * t * t);
    const z = bend * Math.sin(Math.PI * t);
    const halfWidth = width * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.88)) * (i % 2 === 0 ? 1 : 0.68);
    left.push([x, y, z - halfWidth]);
    right.push([x, y, z + halfWidth]);
  }
  return ribbon(left, right, segments);
}

// A flat, tapered leaf-blade lying along +X whose spine arches up from the base
// then droops toward the tip. A single layer: the foliage is double-sided.
function frondBlade(length: number, halfWidth: number, riseAmp: number, dropAmp: number, segments = 7): Geo {
  const spineY = (t: number) => riseAmp * Math.sin(Math.PI * t) - dropAmp * t;
  const halfW = (t: number) => halfWidth * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35);
  const left: P3[] = [];
  const right: P3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = length * t;
    const y = spineY(t);
    const w = i === segments ? 0 : Math.max(halfW(t), 0.02) * (i % 2 === 0 ? 1 : 0.72);
    const twist = w * 0.22 * Math.sin(t * Math.PI * 1.5);
    left.push([x, y + twist, w]);
    right.push([x, y - twist, -w]);
  }
  return ribbon(left, right, segments);
}

// One conifer branch: a broad, flat, drooping fan lofted along the branch axis
// from a flattened-diamond cross-section -- a closed volume, so it reads as a
// solid plate from the game's low camera (docs/models/trees.md).
function branchFan(length: number, halfWidth: number, droop: number, segments: number): Geo {
  const spineY = (t: number) => 0.12 * length * Math.sin(Math.PI * t) - droop * t;
  const halfW = (t: number) => halfWidth * Math.sin(Math.PI * Math.min(1, 0.2 + t * 0.8)) * (1 - t * 0.3);
  const pos: number[] = [];
  const push = (p: P3) => pos.push(p[0], p[1], p[2]);
  const quad = (a: P3, b: P3, c: P3, d: P3) => { push(a); push(b); push(c); push(a); push(c); push(d); };
  // Four points per station: the ridge, both edges, and the keel underneath.
  const ring = (t: number): P3[] => {
    const x = length * t, y = spineY(t);
    const w = Math.max(halfW(t), 0.02);
    const h = Math.max(w * 0.3, 0.02);
    return [[x, y + h, 0], [x, y, w], [x, y - h, 0], [x, y, -w]];
  };
  let prev = ring(0);
  quad(prev[0]!, prev[1]!, prev[2]!, prev[3]!);
  for (let i = 1; i <= segments; i++) {
    if (i === segments) {
      const tip: P3 = [length, spineY(1), 0];
      for (let k = 0; k < 4; k++) { push(prev[k]!); push(prev[(k + 1) % 4]!); push(tip); }
      break;
    }
    const next = ring(i / segments);
    for (let k = 0; k < 4; k++) quad(prev[k]!, prev[(k + 1) % 4]!, next[(k + 1) % 4]!, next[k]!);
    prev = next;
  }
  return new Geo(pos);
}

interface ConiferOptions {
  apex: number; // the tree's tip: where the leader ends
  base: number; // height of the lowest whorl
  top: number; // height of the highest whorl
  reach: number; // branch length at the lowest whorl
  whorls: number;
  fansBase: number; // branches in the lowest whorl, tapering to fansTop
  fansTop: number;
  droop: number; // tip drop as a fraction of the branch's own length
  lift: number; // extra radians the topmost whorl is tilted up by
  fanWidth?: number; // relative fan width; larch uses fine, open branches
}

// A whole conifer crown: whorls of branch fans up a trunk, closing on a slim
// leader at `apex`. Whorls bunch toward the apex, reach is measured from the apex
// and each whorl turns 2.4 rad from the one below (docs/models/trees.md).
function coniferCrown(lod: Lod, o: ConiferOptions): Geo[] {
  const out: Geo[] = [];
  for (let i = 0; i < o.whorls; i++) {
    const t = i / (o.whorls - 1);
    const y = o.base + (o.top - o.base) * (1 - Math.pow(1 - t, 1.45));
    const reach = o.reach * Math.pow((o.apex - y) / (o.apex - o.base), 0.8);
    const fans = Math.max(5, Math.round(o.fansBase + (o.fansTop - o.fansBase) * t));
    for (let k = 0; k < fans; k++) {
      const phase = i * 2.4 + k * 1.73;
      // a missing branch now and then lets daylight through the crown
      if (k > 2 && i > 0 && hash01(i * 97 + k, o.whorls) < 0.1) continue;
      const angle = (k / fans) * Math.PI * 2 + i * 2.4 + 0.09 * Math.sin(phase);
      const length = reach * (0.8 + 0.12 * Math.sin(phase + 0.7) + 0.18 * hash01(i * 31 + k, 7));
      const g = branchFan(length, length * ((o.fanWidth ?? 0.48) + 0.06 * Math.cos(phase)),
        length * o.droop * (0.85 + 0.15 * Math.cos(phase)), Math.max(3, Math.round(1.5 * lod.ribbon)));
      g.rotateZ(0.12 + t * o.lift + 0.06 * Math.sin(phase));
      g.rotateY(angle);
      g.translate(0, y + reach * 0.055 * Math.sin(phase), 0);
      out.push(g);
    }
  }
  // the leader: a slim spike finishing the tree at exactly `apex`
  out.push(cone(lod, 0.18, o.apex - o.top, o.top));
  return out;
}

type CrownMass = [radius: number, sx: number, sy: number, sz: number, x: number, y: number, z: number];

function clusteredCrown(lod: Lod, masses: CrownMass[], clumps = 14): Geo[] {
  return masses.flatMap(([r, sx, sy, sz, x, y, z], i) => lod.extras
    ? leafShell(r * 0.9, sx, sy, sz, x, y, z, clumps, i + 1)
    : [crownBlob(lod, r, sx, sy, sz, x, y, z)]);
}

// Overlapping flattened foliage lobes on a golden-angle spiral around a buried
// core make a scalloped, irregular crown (docs/models/trees.md).
function leafShell(radius: number, scaleX: number, scaleY: number, scaleZ: number, cx: number, cy: number, cz: number, count: number, seed: number): Geo[] {
  const core = icosahedronGeo(radius * 0.68, 0);
  softenCrown(core, radius * 0.68, seed);
  const out: Geo[] = [core];
  const lobes = Math.round(count * 0.65);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < lobes; i++) {
    // a missing lobe is a gap in the outline, sky showing through the crown
    const elevation = Math.asin((2 * (i + 0.5)) / lobes - 1) * 0.92 + 0.12;
    // (never one of the crown's top lobes: those carry its height)
    if (i > 1 && elevation < 0.7 && hash01(seed * 131 + i, 1) < 0.12) continue;
    const azimuth = golden * i + seed * 0.7;
    // lobes of unequal size, so the edge reads as clumps of leaves, not a ball
    const lobeRadius = radius * (0.29 + 0.11 * hash01(seed * 131 + i, 2) + 0.04 * Math.sin(i * 2.3 + seed));
    const g = icosahedronGeo(lobeRadius, 0);
    softenCrown(g, lobeRadius, seed + i);
    g.scale(1.22, 0.72, 1.05).rotateY(azimuth);
    const r = radius * (0.64 + 0.06 * hash01(seed * 131 + i, 3) + 0.03 * Math.sin(i * 1.7 + seed));
    g.translate(Math.cos(elevation) * Math.cos(azimuth) * r, Math.sin(elevation) * r, Math.cos(elevation) * Math.sin(azimuth) * r);
    out.push(g);
  }
  for (const g of out) g.scale(scaleX, scaleY, scaleZ).translate(cx, cy, cz);
  return out;
}

/** The trunk and foliage parts of one species at one level. */
export interface TreeParts {
  trunk: Geo[];
  foliage: Geo[];
  /** The foliage includes single-layer leaves or ribbons: shade both faces. */
  ribbons?: boolean;
}

function partsFor(species: Species, lod: Lod): TreeParts {
  // drawn as modelled: the crowns are the classic width, no stylised oversize
  const parts = rawPartsFor(species, lod);
  // Bend wood and leaves by the same field so branch attachments stay together.
  const lean = species === "palm" ? 1.15 : species === "deadtree" ? -0.38
    : species === "birch" ? 0.28 : species === "oak" || species === "willow" ? 0.18 : 0;
  if (lean !== 0) {
    for (const g of [...parts.trunk, ...parts.foliage]) {
      g.map((x, y, z) => {
        const t = y / 9;
        return [x + lean * t * t, y, z + lean * 0.22 * t * t];
      });
    }
  }
  return parts;
}

function rawPartsFor(species: Species, lod: Lod): TreeParts {
  switch (species) {
    case "scotspine": {
      // Mature pine: exposed warm bark, a crooked leader and widely spreading,
      // flattened upper boughs, all above the trunk's midpoint.
      const trunk = [
        cyl(lod, 0.26, 0.48, 5.2, 0, 5),
        branch(lod, [0, 4.8, 0], [0.38, 7.8, -0.12], 0.26, 0.11, 4),
        branch(lod, [0.1, 5.9, 0], [-1.7, 7.3, 0.3], 0.2, 0.07, 4),
        branch(lod, [0.2, 6.5, 0], [1.65, 7.65, 0.55], 0.18, 0.06, 4),
        branch(lod, [0.3, 7, -0.1], [0.25, 8.2, -1.3], 0.16, 0.05, 4),
      ];
      if (lod.extras) trunk.push(branch(lod, [0, 4.1, 0], [-0.6, 4.35, -0.2], 0.12, 0.025, 3));
      return { trunk, foliage: clusteredCrown(lod, [
        [1.65, 1.3, 0.52, 1.05, -1.65, 7.4, 0.3],
        [1.5, 1.3, 0.58, 1.1, 1.5, 7.85, 0.55],
        [1.55, 1.15, 0.55, 1.2, 0.25, 8.25, -1.15],
        [1.35, 1.2, 0.55, 1, 0.25, 8.75, 0.05],
      ], 16) };
    }
    case "larch":
    case "autumnlarch": {
      // Both colour variants have identical geometry: fine, widely separated
      // branch fans leave an open crown instead of the spruce's dense skirts.
      const trunk = [cyl(lod, 0.055, 0.34, 10.3, 0, 5)];
      if (!lod.extras) return { trunk, foliage: [
        cone(lod, 1.95, 2.5, 2.2, 6), cone(lod, 1.5, 2.4, 4.1, 6),
        cone(lod, 1.03, 2.2, 6, 6), cone(lod, 0.62, 2.7, 7.9, 6),
      ] };
      return { trunk, foliage: coniferCrown(lod, {
        apex: 10.6, base: 3, top: 10.1, reach: 2.05,
        whorls: 11, fansBase: 8, fansTop: 5, droop: 0.32, lift: 0.32, fanWidth: 0.28,
      }) };
    }
    case "hazel":
      // Several stems rise from one low stool under a broad crown.
      return {
        trunk: [
          cyl(lod, 0.12, 0.24, 0.28, 0, 3),
          branch(lod, [-0.08, 0.15, 0], [-0.85, 2.45, 0.3], 0.1, 0.035, 4),
          branch(lod, [0.08, 0.15, 0], [0.85, 2.6, 0.2], 0.1, 0.035, 4),
          branch(lod, [0, 0.15, -0.08], [0, 2.9, -0.65], 0.1, 0.035, 4),
        ],
        foliage: clusteredCrown(lod, [
          [1.05, 1.1, 0.9, 1, -0.82, 2.3, 0.3],
          [1.1, 1.1, 0.92, 1, 0.8, 2.45, 0.2],
          [1.1, 1.05, 0.95, 1, 0, 2.85, -0.6],
          [0.95, 1, 0.95, 1, -0.1, 2.7, 0.6],
        ], 13),
      };
    case "orchard":
      // A short grafted-looking trunk forks into a low, rounded fruit-tree crown.
      return {
        trunk: [
          cyl(lod, 0.2, 0.34, 1.65, 0, 5),
          branch(lod, [0, 1.3, 0], [-0.9, 2.7, 0.25], 0.18, 0.06, 4),
          branch(lod, [0, 1.4, 0], [0.95, 2.9, 0.2], 0.17, 0.055, 4),
          branch(lod, [0, 1.5, 0], [0, 3.2, -0.75], 0.16, 0.05, 4),
        ],
        foliage: clusteredCrown(lod, [
          [1.25, 1.05, 0.95, 1, -0.85, 2.85, 0.25],
          [1.3, 1, 0.95, 1, 0.85, 3, 0.2],
          [1.2, 1, 1, 1, 0, 3.25, -0.75],
          [1, 1.1, 0.9, 1, 0, 3.6, 0.2],
        ], 14),
      };
    case "pine": {
      if (!lod.extras) {
        return {
          trunk: [cyl(lod, 0.28, 0.4, 3, 0)],
          foliage: [cone(lod, 2.1, 3.2, 2.4), cone(lod, 1.6, 2.8, 4.6), cone(lod, 1.05, 2.4, 6.8)],
        };
      }
      return {
        trunk: [cyl(lod, 0.09, 0.46, 8.9, 0, 9), cyl(lod, 0.5, 0.72, 0.35, 0, 9)],
        foliage: coniferCrown(lod, {
          apex: 9.2, base: 2.9, top: 8.85, reach: 2.02, whorls: 12, fansBase: 11, fansTop: 6, droop: 0.62, lift: 0.45,
        }),
      };
    }
    case "oak": return oakParts(lod.extras ? "high" : "low");
    case "bush": {
      if (!lod.extras) {
        return {
          trunk: [cyl(lod, 0.2, 0.25, 0.5, 0)],
          foliage: [
            crownBlob(lod, 1.7, 1.04, 0.78, 1.02, -0.12, 1.35, 0.04),
            crownBlob(lod, 1.2, 1.0, 0.88, 0.94, 0.23, 2.3, -0.1),
          ],
        };
      }
      // A shrub, not a small tree: a stub and four thin stems buried in lobes at
      // different heights and offsets.
      return {
        trunk: [
          cyl(lod, 0.09, 0.15, 0.3, 0),
          branch(lod, [0, 0.1, 0], [0.42, 1.15, 0.28], 0.08, 0.04),
          branch(lod, [0, 0.1, 0], [-0.46, 1.05, -0.22], 0.08, 0.04),
          branch(lod, [0, 0.14, 0], [0.1, 1.3, -0.42], 0.07, 0.035),
          branch(lod, [0, 0.14, 0], [-0.26, 1.2, 0.42], 0.07, 0.035),
        ],
        foliage: [
          ...leafShell(1.3, 1.15, 0.72, 1.1, -0.05, 1.35, 0.05, 22, 1),
          ...leafShell(0.92, 1.05, 0.8, 1.0, 0.66, 1.7, -0.34, 14, 2),
          ...leafShell(0.86, 1.0, 0.8, 1.05, -0.58, 1.78, 0.4, 13, 3),
          ...leafShell(0.88, 1.0, 0.9, 1.0, 0.06, 2.3, 0.08, 12, 4),
        ],
      };
    }
    case "palm": {
      // tall, gently tapered trunk with a coconut cluster at the crown
      const crownY = 9;
      const trunk = [cyl(lod, 0.22, 0.5, crownY, 0, 6, lod.extras ? 5 : 2), blob(lod, 0.55, crownY - 0.1)];
      if (lod.extras) {
        // the stepped bark rings a palm's old frond scars leave behind
        for (let i = 0; i < 3; i++) {
          const y = 2.1 + i * 2.1;
          const r = 0.5 - (y / crownY) * 0.26;
          trunk.push(cyl(lod, r + 0.05, r + 0.06, 0.18, y, 8));
        }
      }
      const foliage: Geo[] = [];
      const frondCount = lod.extras ? 15 : 9;
      const baseTilt = 0.22;
      for (let i = 0; i < frondCount; i++) {
        const long = i % 2 === 0;
        const g = frondBlade(long ? 4.4 : 3.5, long ? 0.6 : 0.5, 1.7, long ? 3.0 : 2.4, Math.round(7 * lod.ribbon));
        g.rotateZ(baseTilt + 0.13 * Math.sin(i * 2.4));
        g.rotateY((i / frondCount) * Math.PI * 2 + 0.12 * Math.sin(i * 2.4));
        g.translate(0, crownY, 0);
        foliage.push(g);
      }
      return { trunk, foliage, ribbons: true };
    }
    case "birch": {
      const trunk = [cyl(lod, 0.18, 0.3, 6, 0)];
      if (!lod.extras) {
        return { trunk, foliage: [
          crownBlob(lod, 1.9, 1, 0.85, 0.92, 0.1, 5.5, -0.08),
          crownBlob(lod, 1.35, 0.94, 0.92, 1, -0.18, 6.9, 0.12),
        ] };
      }
      trunk.push(
        branch(lod, [0, 4.3, 0], [1.15, 5.7, 0.35], 0.12, 0.06),
        branch(lod, [0, 4.7, 0], [-1.0, 6.1, -0.4], 0.11, 0.055),
        branch(lod, [0, 5.2, 0], [0.35, 6.6, -0.95], 0.1, 0.05),
      );
      return {
        trunk,
        foliage: [
          ...leafShell(1.64, 1, 0.92, 0.92, 0.1, 5.5, -0.08, 26, 1),
          ...leafShell(1.16, 0.94, 1, 1, -0.18, 6.9, 0.12, 18, 2),
        ],
      };
    }
    case "spruce": {
      if (!lod.extras) {
        return {
          trunk: [cyl(lod, 0.24, 0.36, 3.2, 0)],
          foliage: [cone(lod, 1.75, 3.0, 2.6), cone(lod, 1.3, 2.8, 4.6), cone(lod, 0.95, 2.6, 6.6), cone(lod, 0.6, 2.2, 8.4)],
        };
      }
      return {
        trunk: [cyl(lod, 0.08, 0.4, 10.2, 0, 9), cyl(lod, 0.44, 0.62, 0.35, 0, 9)],
        foliage: coniferCrown(lod, {
          apex: 10.6, base: 2.5, top: 10.25, reach: 1.76, whorls: 15, fansBase: 11, fansTop: 6, droop: 0.48, lift: 0.5,
        }),
      };
    }
    case "aspen": {
      // Tall, very slender pale trunk carrying a NARROW, columnar crown.
      const trunk = [
        cyl(lod, 0.14, 0.26, 7.4, 0),
        branch(lod, [0, 4.2, 0], [0.55, 6.2, 0.2], 0.11, 0.06),
        branch(lod, [0, 4.9, 0], [-0.5, 7.0, -0.25], 0.1, 0.055),
        branch(lod, [0, 5.6, 0], [0.2, 7.8, -0.5], 0.1, 0.05),
      ];
      if (!lod.extras) {
        return {
          trunk,
          foliage: [
            crownBlob(lod, 1.15, 0.9, 1.15, 0.9, 0.15, 5.5, 0.1),
            crownBlob(lod, 1.1, 0.85, 1.2, 0.85, -0.2, 6.9, -0.15),
            crownBlob(lod, 0.95, 0.8, 1.15, 0.8, 0.2, 8.1, 0.15),
            crownBlob(lod, 0.7, 0.75, 1.05, 0.75, -0.05, 9.1, -0.05),
          ],
        };
      }
      trunk.push(
        branch(lod, [0, 3.6, 0], [-0.45, 5.4, 0.3], 0.1, 0.05),
        branch(lod, [0, 6.3, 0], [0.4, 8.3, 0.3], 0.09, 0.045),
      );
      return {
        trunk,
        foliage: [
          ...leafShell(0.92, 0.9, 1.15, 0.9, 0.15, 5.5, 0.1, 16, 1),
          ...leafShell(0.88, 0.85, 1.2, 0.85, -0.2, 6.9, -0.15, 15, 2),
          ...leafShell(0.76, 0.8, 1.15, 0.8, 0.2, 8.1, 0.15, 13, 3),
          ...leafShell(0.56, 0.75, 1.05, 0.75, -0.05, 9.1, -0.05, 10, 4),
        ],
      };
    }
    case "willow": {
      // The trunk forks below a light crown; leaf sprays hang from its rim.
      const crownY = 6.15;
      const trunk = [
        cyl(lod, 0.36, 0.62, 3.7, 0, 7),
        branch(lod, [0, 3.0, 0], [-1.65, 5.55, 0.2], 0.34, 0.13),
        branch(lod, [0.05, 3.15, 0], [1.45, 5.8, 0.65], 0.32, 0.12),
        branch(lod, [0, 3.25, 0], [0.2, 6.0, -1.25], 0.3, 0.11),
      ];
      const foliage: Geo[] = lod.extras
        ? [
            ...leafShell(1.34, 1.45, 0.65, 1.2, -1.25, 5.85, 0.15, 12, 1),
            ...leafShell(1.38, 1.4, 0.7, 1.15, 1.15, 6.0, 0.45, 12, 2),
            ...leafShell(1.43, 1.35, 0.7, 1.35, 0.05, 6.2, -0.9, 13, 3),
            ...leafShell(1.29, 1.5, 0.7, 1.2, 0, 6.45, 0.35, 12, 4),
          ]
        : [
            crownBlob(lod, 1.45, 1.45, 0.65, 1.2, -1.25, 5.85, 0.15),
            crownBlob(lod, 1.5, 1.4, 0.7, 1.15, 1.15, 6.0, 0.45),
            crownBlob(lod, 1.55, 1.35, 0.7, 1.35, 0.05, 6.2, -0.9),
            crownBlob(lod, 1.4, 1.5, 0.7, 1.2, 0, 6.45, 0.35),
          ];
      if (lod.extras) {
        trunk.push(
          branch(lod, [-0.9, 4.4, 0.1], [-1.8, 5.7, -0.6], 0.13, 0.06),
          branch(lod, [0.8, 4.6, 0.4], [1.6, 5.9, -0.5], 0.12, 0.06),
        );
      }
      const sprayCount = lod.extras ? 26 : 14;
      for (let i = 0; i < sprayCount; i++) {
        const angle = (i / sprayCount) * Math.PI * 2 + 0.07 * Math.sin(i * 2.4);
        const alternate = i % 2 === 0;
        const g = willowSpray(
          (alternate ? 4.45 : 3.65) * (0.94 + 0.06 * Math.sin(i * 1.7)),
          alternate ? 1.25 : 0.95,
          alternate ? 0.38 : 0.32,
          i % 3 === 0 ? 0.25 : -0.18,
          Math.round(5 * lod.ribbon),
        );
        g.rotateY(-angle);
        const ring = alternate ? 1.35 : 0.8;
        g.translate(Math.cos(angle) * ring, crownY + (alternate ? 0 : 0.35), Math.sin(angle) * ring);
        foliage.push(g);
      }
      return { trunk, foliage, ribbons: true };
    }
    case "deadtree": {
      // A bare trunk plus angled stubs; the stubs are the "foliage" group (in the
      // trunk's colour) so the two-group layout holds.
      const trunk = [cyl(lod, 0.28, 0.48, 5.4, 0)];
      const stub = (len: number, y: number, tiltZ: number, spinY: number): Geo =>
        cylinderGeo(0.07, 0.13, len, segs(lod, 5)).translate(0, len / 2, 0).rotateZ(tiltZ).rotateY(spinY).translate(0, y, 0);
      const foliage = [stub(2.2, 3.4, 0.9, 0), stub(1.8, 4.2, -0.8, 2.1), stub(1.5, 4.9, 0.7, 4.0)];
      if (lod.extras) {
        foliage.push(stub(1.1, 2.6, 1.1, 1.1), stub(0.9, 3.9, -1.15, 3.4), stub(0.8, 4.6, 1.0, 5.3), stub(0.6, 5.2, -0.6, 0.6));
      }
      return { trunk, foliage };
    }
  }
}

// --- the coarse level ----------------------------------------------------------
//
// Closed species silhouettes of 10-20 triangles, every dimension measured off the
// species' own low tree so the coarse tree reproduces its bounding box: the
// silhouette simplifies, the envelope stays put when the game flips a band.
// Deliberately not a billboard (docs/models/trees.md).

interface LowBox {
  height: number;
  minX: number; maxX: number; minZ: number; maxZ: number;
  crownBottom: number; crownTop: number;
  trunkTop: number; trunkRadius: number;
}

function lowBoxOf(species: Species): LowBox {
  const { trunk, foliage } = partsFor(species, LODS.low);
  const t = boxOf(trunk);
  const f = boxOf(foliage);
  const whole = boxOf([...trunk, ...foliage]);
  let footRadius = 0;
  for (const g of trunk) for (let i = 0; i < g.count; i++) if (g.y(i) < 0.001) footRadius = Math.max(footRadius, Math.hypot(g.x(i), g.z(i)));
  return {
    height: whole.max[1] - whole.min[1],
    minX: whole.min[0], maxX: whole.max[0], minZ: whole.min[2], maxZ: whole.max[2],
    crownBottom: f.min[1], crownTop: f.max[1],
    trunkTop: t.max[1],
    // Only the foot sets the trunk's thickness: the whole wood box includes
    // spreading limbs, which made distant oaks look like pyramids.
    trunkRadius: footRadius,
  };
}

// Four faces, including the cap.
function tetraBranch(from: P3, to: P3, radius: number): Geo {
  const end: P3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(end[0], end[1], end[2]);
  const g = fromIndexed([
    [radius, 0, 0], [-radius / 2, 0, (-radius * Math.sqrt(3)) / 2],
    [-radius / 2, 0, (radius * Math.sqrt(3)) / 2], [0, len, 0],
  ], [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3]);
  g.applyQuaternion(quatFromUnitVectors([0, 1, 0], [end[0] / len, end[1] / len, end[2] / len]));
  return g.translate(from[0], from[1], from[2]);
}

// Two four-vertex rings give a crown shoulders and a belly for 16 faces.
function coarseCrown(lower: number, upper: number, lowerRadius: number, upperRadius: number): Geo {
  const points: P3[] = [[0, 0, 0], [0, 1, 0]];
  for (const [y, r] of [[lower, lowerRadius], [upper, upperRadius]] as const) {
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      points.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
  }
  const indices: number[] = [];
  for (let k = 0; k < 4; k++) {
    const a = 2 + k, b = 2 + ((k + 1) % 4), c = a + 4, d = b + 4;
    indices.push(0, a, b, a, c, d, a, d, b, c, 1, d);
  }
  return fromIndexed(points, indices);
}

function coarseParts(species: Species): TreeParts {
  const box = lowBoxOf(species);
  const cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
  const crownH = Math.max(box.crownTop - box.crownBottom, 0.05);
  const trunkH = Math.min(Math.max(box.trunkTop, box.crownBottom + crownH * 0.25), box.height);
  const trunk = tetraBranch([0, 0, 0], [0, trunkH, 0], Math.max(box.trunkRadius, 0.06));
  trunk.map((x, y, z) => [x + cx * (y / trunkH), y, z + cz * (y / trunkH)]);
  let foliage: Geo[];
  if (species === "deadtree") {
    foliage = [
      tetraBranch([0, 0, 0], [-1, 0.65, 0.15], 0.09),
      tetraBranch([0, 0.3, 0], [0.65, 1, 0.65], 0.07),
      tetraBranch([0, 0.45, 0], [0.25, 0.85, -1], 0.06),
    ];
  } else if (species === "palm") {
    foliage = [];
    for (let k = 0; k < 4; k++) {
      foliage.push(fromIndexed([[0, 0.8, 0], [0.48, 1, 0.17], [0.48, 0.82, -0.17], [1, 0, 0]],
        [0, 1, 2, 1, 3, 2, 0, 3, 1, 0, 2, 3]).rotateY((k * Math.PI) / 2));
    }
  } else if (species === "pine" || species === "spruce" || species === "larch" || species === "autumnlarch") {
    foliage = [fromIndexed([[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, 1, 0]],
      [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0, 0, 1, 2, 0, 2, 3])];
  } else {
    foliage = [species === "willow" ? coarseCrown(0.16, 0.72, 0.88, 1)
      : species === "aspen" ? coarseCrown(0.28, 0.7, 1, 0.7)
      : coarseCrown(0.32, 0.68, 1, 0.9)];
  }
  // Every coarse crown fills the low tree's envelope exactly, asymmetry included.
  const src = boxOf(foliage);
  const size: P3 = [src.max[0] - src.min[0], src.max[1] - src.min[1], src.max[2] - src.min[2]];
  for (const g of foliage) {
    g.translate(-src.min[0], -src.min[1], -src.min[2]);
    g.scale((box.maxX - box.minX) / size[0], crownH / size[1], (box.maxZ - box.minZ) / size[2]);
    g.translate(box.minX, box.crownBottom, box.minZ);
  }
  return { trunk: [trunk], foliage };
}

// --- the baked shading ---------------------------------------------------------
//
// What makes an OpenTTD tree read is painted light: a dark crown interior and
// underside, a lit top, and clumps that differ in tone. The trees bake the same
// into a colour per corner -- a multiplier of the material colour -- at no cost per
// frame (docs/models/trees.md):
//
//   occlusion  from the corner's height in the crown and its distance from the
//              crown's axis: deep and low is dark, high and outer is lit;
//   sunlit rim a lift on the most exposed corners, the highlight a painter adds;
//   clumps     each foliage piece (a lobe, a branch fan, a frond) gets its own
//              brightness and a slight warm or cool cast, so a crown is made of
//              clumps of different tone rather than one green;
//   bark       darker at the foot and where the crown shades it.

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How strongly a species' clumps vary in hue (a golden larch more, a dark spruce less). */
const HUE_JITTER: Partial<Record<Species, number>> = { autumnlarch: 0.9, larch: 0.7, birch: 0.6, aspen: 0.7, spruce: 0.35, pine: 0.4 };

function paint(species: Species, parts: TreeParts): void {
  const seed = SPECIES.indexOf(species) + 1;
  const wood = species === "deadtree";
  const crown = wood ? boxOf(parts.trunk) : boxOf(parts.foliage);
  const cb = crown.min[1], ct = Math.max(crown.max[1], cb + 0.01);
  const cx = (crown.min[0] + crown.max[0]) / 2, cz = (crown.min[2] + crown.max[2]) / 2;
  const rmax = Math.max(0.01, crown.max[0] - cx, cx - crown.min[0], crown.max[2] - cz, cz - crown.min[2]);
  const hueJitter = HUE_JITTER[species] ?? 0.5;
  const bark = (g: Geo) => {
    g.col = [];
    for (let i = 0; i < g.count; i++) {
      const y = g.y(i);
      let k = 0.72 + 0.3 * smooth(0, Math.max(0.6, cb * 0.7), y);
      if (!wood && y > cb) k *= 0.8; // in the crown's shade
      g.col.push(k, k, k);
    }
  };
  for (const g of parts.trunk) bark(g);
  if (wood) {
    for (const g of parts.foliage) bark(g);
    return;
  }
  parts.foliage.forEach((g, gi) => {
    const value = 0.8 + 0.38 * hash01(seed * 977 + gi, 7);
    const warm = (hash01(seed * 977 + gi, 8) - 0.5) * 2 * hueJitter;
    g.col = [];
    for (let i = 0; i < g.count; i++) {
      const h = (g.y(i) - cb) / (ct - cb);
      const rad = Math.min(1, Math.hypot(g.x(i) - cx, g.z(i) - cz) / rmax);
      const open = Math.min(1, Math.max(0, 0.12 + 0.62 * h + 0.5 * rad));
      const k = (0.34 + 0.66 * open) * value + 0.2 * smooth(0.7, 1, open);
      g.col.push(k * (1 + 0.12 * warm), k * (1 + 0.05 * warm), k * (1 - 0.18 * warm));
    }
  });
}

/** The parts of one species at one level, shaded (tests, the woods previews). */
export function treeParts(species: Species, detail: TreeDetail, options?: Partial<OakOptions>): TreeParts {
  if (species === "oak") return oakParts(detail, options);
  const parts = detail === "coarse" ? coarseParts(species) : partsFor(species, LODS[detail]);
  if (detail === "high") fitToLow(species, parts);
  paint(species, parts);
  return parts;
}

/**
 * Stretches the high tree onto the low tree's envelope. A level may change how a
 * tree is made, never how big it is: the ragged crown's lobes and fans stand proud
 * of (or fall short of) the mass they decorate by a different amount per species,
 * so instead of tuning every radius against the envelope the high tree is measured
 * and scaled to the low one -- per axis, about the trunk's foot, so it stays grounded.
 */
function fitToLow(species: Species, parts: TreeParts): void {
  const low = partsFor(species, LODS.low);
  const want = boxOf([...low.trunk, ...low.foliage]);
  const have = boxOf([...parts.trunk, ...parts.foliage]);
  const k = [0, 1, 2].map((a) => (want.max[a]! - want.min[a]!) / Math.max(1e-6, have.max[a]! - have.min[a]!));
  // horizontally, also move the crown's centre onto the low one's
  const shift = [0, 2].map((a) => (want.max[a]! + want.min[a]!) / 2 - ((have.max[a]! + have.min[a]!) / 2) * k[a]!);
  for (const g of [...parts.trunk, ...parts.foliage]) {
    g.map((x, y, z) => [x * k[0]! + shift[0]! * Math.min(1, y / Math.max(1e-6, want.max[1]!)), y * k[1]!, z * k[2]! + shift[1]! * Math.min(1, y / Math.max(1e-6, want.max[1]!))]);
  }
}

/** One species at one level as a model: the `trunk` and `foliage` materials. */
export function buildTree(species: Species, detail: TreeDetail, options?: Partial<OakOptions>): MeshBuilder {
  const { trunk, foliage, ribbons } = treeParts(species, detail, options);
  const c = TREE_COLORS[species];
  const m = new MeshBuilder({
    trunk: { color: c.trunk, roughness: 1 },
    foliage: { color: c.foliage, roughness: 0.9, ...(ribbons ? { doubleSided: true } : {}) },
  });
  const emit = (mat: string, list: Geo[]) => {
    for (const g of list) {
      const p = g.pos, c = g.col;
      for (let i = 0; i < p.length; i += 9) {
        const a: P3 = [p[i]!, p[i + 1]!, p[i + 2]!], b: P3 = [p[i + 3]!, p[i + 4]!, p[i + 5]!], d: P3 = [p[i + 6]!, p[i + 7]!, p[i + 8]!];
        if (c) m.triShaded(mat, a, b, d, [[c[i]!, c[i + 1]!, c[i + 2]!], [c[i + 3]!, c[i + 4]!, c[i + 5]!], [c[i + 6]!, c[i + 7]!, c[i + 8]!]]);
        else m.tri(mat, a, b, d);
      }
    }
  };
  m.scope("trunk", () => emit("trunk", trunk));
  m.scope("foliage", () => emit("foliage", foliage));
  return m;
}

// One exported build function per species and level: a design's JS model bundles
// the functions it names (jsModel.ts), so each needs its own name.
export const treePine = () => buildTree("pine", "high");
export const treePineLow = () => buildTree("pine", "low");
export const treePineCoarse = () => buildTree("pine", "coarse");
export const treeSpruce = () => buildTree("spruce", "high");
export const treeSpruceLow = () => buildTree("spruce", "low");
export const treeSpruceCoarse = () => buildTree("spruce", "coarse");
export const treeOak = (p?: ParamValues) => buildTree("oak", "high", oakOptions(p));
export const treeOakLow = (p?: ParamValues) => buildTree("oak", "low", oakOptions(p));
export const treeOakCoarse = (p?: ParamValues) => buildTree("oak", "coarse", oakOptions(p));
export const treeBirch = () => buildTree("birch", "high");
export const treeBirchLow = () => buildTree("birch", "low");
export const treeBirchCoarse = () => buildTree("birch", "coarse");
export const treeAspen = () => buildTree("aspen", "high");
export const treeAspenLow = () => buildTree("aspen", "low");
export const treeAspenCoarse = () => buildTree("aspen", "coarse");
export const treeWillow = () => buildTree("willow", "high");
export const treeWillowLow = () => buildTree("willow", "low");
export const treeWillowCoarse = () => buildTree("willow", "coarse");
export const treePalm = () => buildTree("palm", "high");
export const treePalmLow = () => buildTree("palm", "low");
export const treePalmCoarse = () => buildTree("palm", "coarse");
export const treeBush = () => buildTree("bush", "high");
export const treeBushLow = () => buildTree("bush", "low");
export const treeBushCoarse = () => buildTree("bush", "coarse");
export const treeDeadtree = () => buildTree("deadtree", "high");
export const treeDeadtreeLow = () => buildTree("deadtree", "low");
export const treeDeadtreeCoarse = () => buildTree("deadtree", "coarse");
export const treeScotspine = () => buildTree("scotspine", "high");
export const treeScotspineLow = () => buildTree("scotspine", "low");
export const treeScotspineCoarse = () => buildTree("scotspine", "coarse");
// The European larch in summer green or autumn gold: one design, two species keys
// (the woods plant `larch` and `autumnlarch`, and the game draws each).
export const LARCH_PARAMS: ParamSpec[] = [{
  name: "season", title: "Season",
  values: [{ value: "summer", title: "Summer" }, { value: "autumn", title: "Autumn" }],
  default: "summer",
}];
const larchOf = (p?: ParamValues): Species => resolveParams(LARCH_PARAMS, p).season === "autumn" ? "autumnlarch" : "larch";
export const treeLarch = (p?: ParamValues) => buildTree(larchOf(p), "high");
export const treeLarchLow = (p?: ParamValues) => buildTree(larchOf(p), "low");
export const treeLarchCoarse = (p?: ParamValues) => buildTree(larchOf(p), "coarse");
export const treeHazel = () => buildTree("hazel", "high");
export const treeHazelLow = () => buildTree("hazel", "low");
export const treeHazelCoarse = () => buildTree("hazel", "coarse");
export const treeOrchard = () => buildTree("orchard", "high");
export const treeOrchardLow = () => buildTree("orchard", "low");
export const treeOrchardCoarse = () => buildTree("orchard", "coarse");

type Builders = [(p?: ParamValues) => MeshBuilder, (p?: ParamValues) => MeshBuilder, (p?: ParamValues) => MeshBuilder];

/** The tree designs: one per species, but the autumn larch is the larch's `season: autumn`. */
const MODELS: ReadonlyArray<{ species: Species; builders: Builders; params?: ParamSpec[] }> = [
  { species: "pine", builders: [treePine, treePineLow, treePineCoarse] },
  { species: "spruce", builders: [treeSpruce, treeSpruceLow, treeSpruceCoarse] },
  { species: "oak", builders: [treeOak, treeOakLow, treeOakCoarse], params: OAK_PARAMS },
  { species: "birch", builders: [treeBirch, treeBirchLow, treeBirchCoarse] },
  { species: "aspen", builders: [treeAspen, treeAspenLow, treeAspenCoarse] },
  { species: "willow", builders: [treeWillow, treeWillowLow, treeWillowCoarse] },
  { species: "palm", builders: [treePalm, treePalmLow, treePalmCoarse] },
  { species: "bush", builders: [treeBush, treeBushLow, treeBushCoarse] },
  { species: "deadtree", builders: [treeDeadtree, treeDeadtreeLow, treeDeadtreeCoarse] },
  { species: "scotspine", builders: [treeScotspine, treeScotspineLow, treeScotspineCoarse] },
  { species: "larch", builders: [treeLarch, treeLarchLow, treeLarchCoarse], params: LARCH_PARAMS },
  { species: "hazel", builders: [treeHazel, treeHazelLow, treeHazelCoarse] },
  { species: "orchard", builders: [treeOrchard, treeOrchardLow, treeOrchardCoarse] },
];

/** The catalog fields every tree shares. */
export const TREE_CATALOG: CatalogFields = {
  category: "Trees",
  group: "tree",
  defaultScale: 1,
  license: "MIT",
  author: "Rail Island",
  source: "procedural (rail-island-factory)",
};

/** The model id of a design's species. */
export const treeId = (species: Species): string => `proc-tree-${species}`;

/** The design that draws a species, and the parameter values that pick it. */
export function treeModelOf(species: Species): { id: string; params: ParamValues } {
  return species === "autumnlarch" ? { id: treeId("larch"), params: { season: "autumn" } } : { id: treeId(species), params: {} };
}

/** One design per species, the two larches one design with a season. */
export const TREES: ProceduralDesign[] = MODELS.map(({ species, builders: [build, buildLod, buildCoarse], params }) => ({
  id: treeId(species),
  title: TITLES[species],
  build,
  buildLod,
  buildCoarse,
  ...(params ? { params } : {}),
  lodTriangles: 300,
  references: species === "oak" ? "oak" : "trees",
  catalog: TREE_CATALOG,
}));
