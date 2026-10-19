// The leafy species besides the oak -- birch, aspen, willow, bush, hazel and the
// orchard tree -- drawn as chunked crowns by the tree kit (treeKit.ts):
// each species is a seeded layout of wood and leaf clumps plus a style. Five
// numbered seeds per species; docs/models/trees.md. No Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { P3 } from "./treeGeo.ts";
import {
  TREE_SEED, add, bearing, bough, broadleafParts, jitterOf, leaning, mix, mul, nearest, random, stationAt, unit,
  type BroadleafOptions, type BroadleafStyle, type Clump, type Layout, type Limb, type Parts, type Station, type Strand,
} from "./treeKit.ts";

export const LEAFY_SPECIES = ["birch", "aspen", "willow", "bush", "hazel", "orchard"] as const;
export type LeafySpecies = (typeof LEAFY_SPECIES)[number];

/** The material colours (sRGB hex): the crown's mid-tone; vertex colours multiply them. */
export const LEAFY_COLORS: Record<LeafySpecies, { trunk: string; foliage: string }> = {
  // slender white trunk, light-green crown
  birch: { trunk: "#e2ddd0", foliage: "#86b84a" },
  // pale grey-green bark, tall narrow column of small bright leaves
  aspen: { trunk: "#cbc9b2", foliage: "#a2c94f" },
  // drooping soft-green canopy
  willow: { trunk: "#6f5533", foliage: "#93b850" },
  bush: { trunk: "#634626", foliage: "#5f8a34" },
  hazel: { trunk: "#7e6246", foliage: "#73a443" },
  orchard: { trunk: "#7f5532", foliage: "#6aa242" },
};

/** The one control every leafy species has: five numbered tree shapes. */
export const LEAFY_PARAMS: ParamSpec[] = [TREE_SEED];
const SEEDS = [11, 29, 97, 211, 563];
export const DEFAULT_LEAFY: BroadleafOptions = { seed: SEEDS[0]!, height: 1, width: 1, spread: 1, density: 1 };
export function leafyOptions(p?: ParamValues): BroadleafOptions {
  return { ...DEFAULT_LEAFY, seed: SEEDS[Number(resolveParams(LEAFY_PARAMS, p).seed) - 1]! };
}

// Birch: a slender leaning white trunk runs up through an oval crown of small
// clumps, each on its own short, rising branch.
function birchLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.45);
  const ys = [0, 0.5, 2.8, 5.2, 7.0, 8.4], rs = [0.32, 0.26, 0.22, 0.16, 0.1, 0.04];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 8.4), [0, y, 0]), r: rs[i]! }));
  const clumps: Clump[] = [{ at: add(stem[5]!.at, [jit(0.15), -0.1, jit(0.15)]), r: 0.95, out: [0, 0, 0], tone: 0.04 }];
  const limbs: Limb[] = [];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 7; k++) {
    const y = 4.35 + k * 0.5 + jit(0.12), axis = stationAt(stem, y);
    const dir = bearing(phase + k * 2.4 + jit(0.35)), dist = (1.1 - 0.06 * k) * (0.88 + rng() * 0.24);
    const at = add(add(axis, mul(dir, dist)), [0, 0.15, 0]);
    clumps.push({ at, r: (1.2 - 0.04 * k) * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
    limbs.push({ stations: bough(stationAt(stem, y - 0.7), add(at, [0, -0.15, 0]), 0.09, 0.03, 0.25), sides: [4, 6, 3], phase: k, skipLow: true });
  }
  return { stem, stemSides: [6, 10, 4], limbs, twigs: [], clumps, groups: [[1, 2, 3, 4], [0, 5, 6, 7]] };
}
// Aspen: a tall pale trunk carrying a narrow column of small clumps on short shoots.
function aspenLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.2);
  const ys = [0, 0.5, 3.5, 6.0, 8.0, 9.5], rs = [0.3, 0.24, 0.2, 0.15, 0.09, 0.04];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 9.5), [0, y, 0]), r: rs[i]! }));
  const clumps: Clump[] = [{ at: add(stem[5]!.at, [jit(0.1), -0.1, jit(0.1)]), r: 0.7, out: [0, 0, 0], tone: 0.04 }];
  const limbs: Limb[] = [];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 10; k++) {
    const y = 4.75 + k * 0.44 + jit(0.1), axis = stationAt(stem, y);
    const dir = bearing(phase + k * 2.4 + jit(0.3)), dist = (0.5 - 0.01 * k) * (0.85 + rng() * 0.3);
    const at = add(add(axis, mul(dir, dist)), [0, 0.1, 0]);
    clumps.push({ at, r: (0.88 - 0.014 * k) * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
    limbs.push({ stations: [{ at: stationAt(stem, y - 0.5), r: 0.07 }, { at: add(at, [0, -0.1, 0]), r: 0.03 }], sides: [4, 6, 3], phase: k, skipLow: true });
  }
  return { stem, stemSides: [6, 10, 4], limbs, twigs: [], clumps,
    groups: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10, 0]] };
}
// Willow: a stout leaning trunk forks into four arching limbs under a broad dome
// of clumps, and curtains of leaves hang from the dome's rim almost to the ground.
function willowLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.35);
  const ys = [0, 0.4, 1.6, 2.8, 3.4], rs = [0.66, 0.55, 0.48, 0.42, 0.38];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 3.4), [0, y, 0]), r: rs[i]! }));
  const fork = stem[4]!.at, centre: P3 = add(fork, [jit(0.3), 0, jit(0.3)]);
  const clumps: Clump[] = [];
  const ringPhase = rng() * Math.PI * 2;
  for (let k = 0; k < 6; k++) {
    const dir = bearing(ringPhase + (k + jit(0.25)) * Math.PI / 3), at = add(add(centre, mul(dir, 2.15 * (0.9 + rng() * 0.2))), [0, 2.45 + jit(0.25), 0]);
    clumps.push({ at, r: 1.08 * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
  }
  for (let k = 0; k < 2; k++) {
    const dir = bearing(ringPhase + 0.5 + k * Math.PI + jit(0.3));
    clumps.push({ at: add(add(centre, mul(dir, 0.85)), [0, 3.1 + jit(0.15), 0]), r: 1.0, out: dir, tone: jit(0.04) });
  }
  clumps.push({ at: add(centre, [jit(0.2), 3.55, jit(0.2)]), r: 0.92, out: [0, 0, 0], tone: 0.04 });
  const limbPhase = rng() * Math.PI * 2, bearings = [0, 1, 2, 3].map((k) => limbPhase + (k + jit(0.12)) * Math.PI / 2);
  const owner = clumps.map((c, i) => i === clumps.length - 1 ? 0 : nearest(c.at, fork, bearings));
  const limbs: Limb[] = [], twigs: Station[][] = [];
  const groups = bearings.map((_, k) => clumps.map((_, i) => i).filter((i) => owner[i] === k)).filter((m) => m.length);
  bearings.forEach((b, k) => {
    const mine = clumps.filter((_, i) => owner[i] === k);
    const target = mine.length ? mul(mine.reduce((s, c) => add(s, c.at), [0, 0, 0] as P3), 1 / mine.length) : add(fork, add(mul(bearing(b), 1.5), [0, 2.2, 0]));
    const start = add(fork, [0, -0.3, 0]), end = mix(start, target, 0.7);
    const stations = bough(start, end, 0.3, 0.12, 0.35, 4);
    const mass = groups.findIndex((m) => m.some((i) => owner[i] === k));
    limbs.push({ stations, sides: [6, 9, 3], phase: k * 0.4, ...(mass >= 0 ? { mass } : {}) });
    for (const c of mine)
      twigs.push(bough(mix(stations[2]!.at, end, 0.6), add(c.at, [0, -c.r * 0.2, 0]), 0.1, 0.03, 0.25));
  });
  // Four curtains from each rim clump, hanging from its outer underside.
  const strands: Strand[] = [];
  clumps.slice(0, 6).forEach((c) => {
    for (let k = 0; k < 4; k++) {
      const dir = unit(add(c.out, mul(unit([-c.out[2], 0, c.out[0]]), (k - 1.5) * 0.55 + jit(0.15))));
      const at = add(c.at, add(mul(dir, c.r * 0.55), [0, -c.r * 0.3, 0]));
      strands.push({ at, out: dir, length: Math.min(at[1] - 0.9, 3.1 + rng() * 0.9), reach: 0.45 + rng() * 0.3, tone: jit(0.05) });
    }
  });
  return { stem, stemSides: [8, 12, 4], limbs, twigs, clumps, groups, strands };
}
// Bush: a mound of clumps on short stems from one low stool; no trunk shows.
function bushLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng);
  // The stool rises into the mound so the low-detail mass sits on it.
  const stem: Station[] = [{ at: [0, 0, 0], r: 0.17 }, { at: [0, 0.35, 0], r: 0.14 }, { at: [jit(0.05), 0.75, jit(0.05)], r: 0.1 }];
  const clumps: Clump[] = [{ at: [jit(0.15), 1.25, jit(0.15)], r: 1.0, out: [0, 0, 0], tone: 0 }];
  const phase = rng() * Math.PI * 2, limbs: Limb[] = [];
  for (let k = 0; k < 5; k++) {
    const dir = bearing(phase + (k + jit(0.25)) * Math.PI * 2 / 5);
    const at = add(mul(dir, 0.98 * (0.85 + rng() * 0.3)), [0, 1.04 + jit(0.1), 0]);
    clumps.push({ at, r: 0.82 * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
  }
  clumps.push({ at: [jit(0.3), 1.95 + jit(0.1), jit(0.3)], r: 0.78, out: [0, 0, 0], tone: 0.05 });
  clumps.slice(1).forEach((c, k) =>
    limbs.push({ stations: [{ at: [0, 0.3, 0], r: 0.07 }, { at: add(c.at, [0, -0.2, 0]), r: 0.03 }], sides: [4, 6, 3], phase: k, skipLow: true }));
  return { stem, stemSides: [5, 8, 4], limbs, twigs: [], clumps, groups: [[0, 1, 2, 3, 4, 5], [6]] };
}
// Hazel: four crooked stems rise from a low stool into a broad crown; each ends
// in a clump and carries one more on a twig.
function hazelLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng);
  const stem: Station[] = [{ at: [0, 0, 0], r: 0.3 }, { at: [0, 0.15, 0], r: 0.26 }, { at: [0, 0.3, 0], r: 0.22 }];
  const clumps: Clump[] = [], limbs: Limb[] = [], twigs: Station[][] = [];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 4; k++) {
    const dir = bearing(phase + (k + jit(0.2)) * Math.PI / 2);
    const tip = add(mul(dir, 1.0 * (0.85 + rng() * 0.3)), [0, 2.7 + jit(0.25), 0]);
    const start = add(mul(dir, 0.1), [0, 0.2, 0]);
    const mid = add(mix(start, tip, 0.5), [jit(0.15), 0, jit(0.15)]);
    clumps.push({ at: add(tip, [0, 0.15, 0]), r: 0.86 * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
    limbs.push({ stations: [{ at: start, r: 0.11 }, { at: mid, r: 0.08 }, { at: tip, r: 0.04 }], sides: [5, 7, 3], phase: k, mass: k });
    // The next clump sits between this stem and the next, lower and further out.
    const side = bearing(phase + (k + 0.5 + jit(0.15)) * Math.PI / 2);
    const extra = k === 3 ? add([jit(0.2), 3.35, jit(0.2)], mul(dir, 0.2)) : add(mul(side, 1.55 * (0.9 + rng() * 0.2)), [0, 2.05 + jit(0.2), 0]);
    clumps.push({ at: extra, r: (k === 3 ? 0.78 : 0.76) * (0.9 + rng() * 0.2), out: k === 3 ? [0, 0, 0] : side, tone: jit(0.05) });
    twigs.push(bough(mix(mid, tip, 0.45), add(extra, [0, -0.15, 0]), 0.06, 0.025, 0.15));
  }
  return { stem, stemSides: [6, 9, 4], limbs, twigs, clumps, groups: [[0, 1], [2, 3], [4, 5], [6, 7]] };
}
// Orchard tree: a short trunk forks into four spreading limbs under a low, round
// crown of clumps.
function orchardLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.15);
  const ys = [0, 0.35, 0.9, 1.45], rs = [0.36, 0.3, 0.26, 0.24];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 1.45), [0, y, 0]), r: rs[i]! }));
  const fork = stem[3]!.at;
  const clumps: Clump[] = [];
  const ring = (count: number, y: number, dist: number, r: number) => {
    const p = rng() * Math.PI * 2;
    for (let k = 0; k < count; k++) {
      const dir = bearing(p + (k + jit(0.25)) * Math.PI * 2 / count);
      clumps.push({ at: add(add(fork, mul(dir, dist * (0.88 + rng() * 0.24))), [0, y - 1.45 + jit(0.15), 0]), r: r * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05) });
    }
  };
  clumps.push({ at: add(fork, [jit(0.2), 2.5, jit(0.2)]), r: 0.78, out: [0, 0, 0], tone: 0.04 });
  ring(3, 3.4, 0.7, 0.86);
  ring(5, 2.7, 1.4, 0.86);
  const limbPhase = rng() * Math.PI * 2, bearings = [0, 1, 2, 3].map((k) => limbPhase + (k + jit(0.12)) * Math.PI / 2);
  const owner = clumps.map((c, i) => i === 0 ? 0 : nearest(c.at, fork, bearings));
  const groups = bearings.map((_, k) => clumps.map((_, i) => i).filter((i) => owner[i] === k)).filter((m) => m.length);
  const limbs: Limb[] = [], twigs: Station[][] = [];
  bearings.forEach((b, k) => {
    const end = add(fork, add(mul(bearing(b), 0.95), [0, 1.05 + jit(0.15), 0]));
    const stations = bough(add(fork, [0, -0.2, 0]), end, 0.19, 0.08, 0.12);
    const mass = groups.findIndex((m) => m.some((i) => owner[i] === k));
    limbs.push({ stations, sides: [5, 8, 3], phase: k * 0.4, ...(mass >= 0 ? { mass } : {}) });
    clumps.forEach((c, i) => {
      if (owner[i] === k)
        twigs.push(bough(mix(stations[1]!.at, end, 0.7), add(c.at, [0, -c.r * 0.2, 0]), 0.07, 0.03, 0.2));
    });
  });
  return { stem, stemSides: [7, 12, 4], limbs, twigs, clumps, groups };
}

// Birch bark: dark horizontal marks scattered over the white.
const mark = (density: number) => (y: number, k: number) => {
  const band = Math.floor(y * 3.2);
  let n = Math.imul(band * 374761393 + k * 668265263, 1274126177);
  n ^= n >>> 13;
  return ((n >>> 0) % 1000) / 1000 < density;
};
// Marked pure, so another design's standalone JS can drop this table.
const STYLES: Record<LeafySpecies, BroadleafStyle> = /* @__PURE__ */ (() => ({
  birch: {
    colors: LEAFY_COLORS.birch, top: 8.6,
    leaf: [[0.12, 0.3, 0.06], [0.4, 0.63, 0.17], [0.78, 0.9, 0.34]], bark: [[0.6, 0.58, 0.53], [0.96, 0.95, 0.91]], barkMark: /* @__PURE__ */ mark(0.28),
    tufts: { high: 6, highAiry: 6, max: 50, maxAiry: 50 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.62, max: 0.38 },
    massSides: (j) => j === 0 ? 6 : 5,
  },
  aspen: {
    colors: LEAFY_COLORS.aspen, top: 9.6,
    leaf: [[0.16, 0.34, 0.06], [0.46, 0.68, 0.18], [0.84, 0.92, 0.36]], bark: [[0.52, 0.53, 0.45], [0.86, 0.86, 0.77]], barkMark: /* @__PURE__ */ mark(0.12),
    tufts: { high: 6, highAiry: 6, max: 38, maxAiry: 38 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.62, max: 0.4 },
    massSides: 6,
  },
  willow: {
    colors: LEAFY_COLORS.willow, top: 7.4,
    leaf: [[0.14, 0.3, 0.07], [0.42, 0.62, 0.2], [0.8, 0.9, 0.42]], bark: [[0.26, 0.19, 0.11], [0.6, 0.47, 0.3]],
    roots: { high: 5, max: 6, size: 0.9 },
    tufts: { high: 7, highAiry: 7, max: 38, maxAiry: 38 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.62, max: 0.42 },
    massSides: 6, strandLeaves: { high: 8, max: 14, lowSegments: 3 },
  },
  bush: {
    colors: LEAFY_COLORS.bush, top: 2.8,
    leaf: [[0.07, 0.2, 0.05], [0.26, 0.48, 0.12], [0.62, 0.8, 0.26]], bark: [[0.22, 0.15, 0.08], [0.5, 0.36, 0.2]],
    tufts: { high: 14, highAiry: 14, max: 65, maxAiry: 65 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.55, max: 0.34 },
    massSides: (j) => j === 0 ? 6 : 5,
  },
  hazel: {
    colors: LEAFY_COLORS.hazel, top: 3.9,
    leaf: [[0.09, 0.25, 0.06], [0.33, 0.57, 0.14], [0.7, 0.86, 0.3]], bark: [[0.28, 0.2, 0.13], [0.62, 0.48, 0.33]],
    tufts: { high: 7, highAiry: 7, max: 55, maxAiry: 55 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.62, max: 0.38 },
    massSides: (j) => j === 3 ? 5 : 6,
  },
  orchard: {
    colors: LEAFY_COLORS.orchard, top: 4.4,
    leaf: [[0.08, 0.24, 0.05], [0.31, 0.56, 0.12], [0.7, 0.86, 0.28]], bark: [[0.27, 0.16, 0.08], [0.6, 0.4, 0.22]],
    roots: { high: 4, max: 4, size: 0.45 },
    tufts: { high: 6, highAiry: 6, max: 46, maxAiry: 46 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.64, max: 0.4 },
    massSides: 6,
  },
}))();
const LAYOUTS: Record<LeafySpecies, (o: BroadleafOptions) => Layout> = {
  birch: birchLayout, aspen: aspenLayout, willow: willowLayout, bush: bushLayout, hazel: hazelLayout, orchard: orchardLayout,
};

export const isLeafy = (species: string): species is LeafySpecies => (LEAFY_SPECIES as readonly string[]).includes(species);
export function leafyParts(species: LeafySpecies, detail: "max" | "high" | "low" | "coarse", options: Partial<BroadleafOptions> = {}): Parts {
  const o = { ...DEFAULT_LEAFY, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error(`Invalid ${species} options`);
  return broadleafParts(detail, o, LAYOUTS[species], STYLES[species]);
}
