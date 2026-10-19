// The conifers -- pine, spruce, the European larch (summer and autumn) and the
// mature Scots pine -- drawn by the tree kit (treeKit.ts): seeded whorls of
// branches, each ending in a flattened needle pad (a dark core under tufts of
// narrow needles), a leader with a top pad, and stacked cones at low detail.
// Five numbered seeds per species; docs/models/trees.md. No Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { P3 } from "./treeGeo.ts";
import {
  TREE_SEED, add, bearing, bough, broadleafParts, jitterOf, leaning, mix, mul, random, stationAt,
  type BroadleafOptions, type BroadleafStyle, type Clump, type Layout, type Limb, type Parts, type Station,
} from "./treeKit.ts";

export const CONIFER_SPECIES = ["pine", "spruce", "larch", "autumnlarch", "scotspine"] as const;
export type ConiferSpecies = (typeof CONIFER_SPECIES)[number];

export const CONIFER_COLORS: Record<ConiferSpecies, { trunk: string; foliage: string }> = {
  pine: { trunk: "#7a4f2a", foliage: "#33774a" },
  // tall narrow conifer, blue-tinged deep green
  spruce: { trunk: "#664526", foliage: "#2a6648" },
  larch: { trunk: "#7e6146", foliage: "#8fbd4f" },
  autumnlarch: { trunk: "#7e6146", foliage: "#e0a83a" },
  scotspine: { trunk: "#a86a3e", foliage: "#548a52" },
};

const SEEDS = [13, 37, 101, 223, 577];
export const DEFAULT_CONIFER: BroadleafOptions = { seed: SEEDS[0]!, height: 1, width: 1, spread: 1, density: 1 };
// The design's values, checked against its parameters (the larch's include its
// season); only the seed shapes the tree.
export function coniferOptions(p?: ParamValues, params: readonly ParamSpec[] = [TREE_SEED]): BroadleafOptions {
  return { ...DEFAULT_CONIFER, seed: SEEDS[Number(resolveParams(params, p).seed) - 1]! };
}

interface WhorlSpec {
  height: number;
  // The stem's radius at the foot.
  foot: number;
  whorls: number;
  first: number;
  last: number;
  // Branches, reach and pad radius along the crown, t = 0 at the lowest whorl.
  branches: (t: number) => number;
  reach: (t: number) => number;
  pad: (t: number) => number;
  // Tip drop as a fraction of the reach; pads are flattened and stretched along the branch.
  droop: number;
  scale: P3;
  lean: number;
  top: number;
  // Whorl ranges merged into one low-detail cone each; the top pad joins the last.
  tiers: number[][];
}
// A whorled conifer: a tapering stem and leader, whorls of straight branches
// bunching toward the top, each ending in a needle pad stretched along it.
function whorled(spec: WhorlSpec) {
  return (o: BroadleafOptions): Layout => {
    const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, spec.lean), H = spec.height;
    const ys = [0, 0.5, H * 0.3, H * 0.55, H * 0.8, H], rs = [1, 0.85, 0.7, 0.5, 0.28, 0.08];
    const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / H), [0, y, 0]), r: spec.foot * rs[i]! }));
    const clumps: Clump[] = [], limbs: Limb[] = [], whorlOf: number[] = [];
    for (let w = 0; w < spec.whorls; w++) {
      const t = w / (spec.whorls - 1), y = spec.first + (spec.last - spec.first) * (1 - Math.pow(1 - t, 1.3)) + jit(0.12);
      const n = Math.round(spec.branches(t)), phase = w * 2.4 + rng() * 0.6, base = stationAt(stem, y);
      for (let b = 0; b < n; b++) {
        const a = phase + (b + jit(0.22)) * Math.PI * 2 / n, dir = bearing(a);
        const reach = spec.reach(t) * (0.85 + rng() * 0.3), drop = spec.droop * reach;
        const at = add(base, add(mul(dir, reach * 0.72), [0, -drop * 0.72, 0]));
        const r = spec.pad(t) * (0.9 + rng() * 0.2);
        clumps.push({ at, r, out: dir, tone: jit(0.05), scale: spec.scale, yaw: -a });
        whorlOf.push(w);
        const end = add(at, add(mul(dir, r * 0.5), [0, -drop * 0.1, 0]));
        limbs.push({ stations: bough(base, end, Math.max(0.04, stem[2]!.r * (0.32 - 0.18 * t)), 0.025, reach * 0.04, 2), sides: [3, 5, 3], phase: b, skipLow: true });
      }
    }
    // The leader's tip: a slim, upright pad.
    clumps.push({ at: add(stem[5]!.at, [0, -spec.top * 0.6, 0]), r: spec.top, out: [0, 0, 0], tone: 0.05, scale: [0.7, 1.5, 0.7] });
    whorlOf.push(spec.whorls - 1);
    const groups = spec.tiers.map((tier) => clumps.map((_, i) => i).filter((i) => tier.includes(whorlOf[i]!)));
    return { stem, stemSides: [6, 10, 4], limbs, twigs: [], clumps, groups };
  };
}

const pineLayout = whorled({
  height: 9.2, foot: 0.42, whorls: 7, first: 2.8, last: 8.2,
  branches: (t) => 6.2 - 3.2 * t, reach: (t) => 2.1 * Math.pow(1 - t, 0.8) + 0.45, pad: (t) => 1.08 - 0.45 * t,
  droop: 0.1, scale: [1.45, 0.62, 1.05], lean: 0.25, top: 0.62, tiers: [[0, 1], [2, 3], [4, 5], [6]],
});
const spruceLayout = whorled({
  height: 10.6, foot: 0.4, whorls: 8, first: 1.8, last: 9.6,
  branches: (t) => 6.4 - 3.6 * t, reach: (t) => 1.85 * Math.pow(1 - t, 0.9) + 0.4, pad: (t) => 1.12 - 0.5 * t,
  droop: 0.32, scale: [1.5, 0.52, 1.1], lean: 0.12, top: 0.55, tiers: [[0, 1], [2, 3], [4, 5], [6, 7]],
});
const larchLayout = whorled({
  height: 10.6, foot: 0.34, whorls: 7, first: 3.0, last: 9.8,
  branches: (t) => 5.2 - 2.4 * t, reach: (t) => 2.0 * Math.pow(1 - t, 0.8) + 0.35, pad: (t) => 0.78 - 0.3 * t,
  droop: 0.24, scale: [1.6, 0.5, 1.0], lean: 0.2, top: 0.45, tiers: [[0, 1], [2, 3], [4, 5], [6]],
});
// Mature Scots pine: a tall bare crooked trunk, four boughs spreading above its
// middle, each carrying two flat pads, and a flat top pad -- an umbrella crown.
function scotspineLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.5);
  const ys = [0, 0.5, 2.5, 4.8, 6.6, 8.2], rs = [0.5, 0.42, 0.36, 0.3, 0.2, 0.09];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 8.2), [i > 2 ? jit(0.25) : 0, y, i > 2 ? jit(0.25) : 0]), r: rs[i]! }));
  const flat: P3 = [1.3, 0.48, 1.3];
  const clumps: Clump[] = [{ at: add(stem[5]!.at, [0, 0.15, 0]), r: 1.0, out: [0, 0, 0], tone: 0.05, scale: flat }];
  const limbs: Limb[] = [], twigs: Station[][] = [], groups: number[][] = [[0]];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 4; k++) {
    const dir = bearing(phase + (k + jit(0.2)) * Math.PI / 2), y = 5.0 + k * 0.55 + jit(0.15), start = stationAt(stem, y);
    const tip = add(start, add(mul(dir, 1.9 * (0.85 + rng() * 0.3)), [0, 1.2 + jit(0.3), 0]));
    const stations = bough(start, tip, 0.17, 0.05, 0.25);
    const first = clumps.length;
    for (const [t, lift] of [[1, 0.1], [0.55, 0.55]] as const) {
      const at = add(mix(start, tip, t), [jit(0.15), lift, jit(0.15)]);
      clumps.push({ at, r: (t === 1 ? 0.95 : 0.85) * (0.9 + rng() * 0.2), out: dir, tone: jit(0.05), scale: flat, yaw: rng() * Math.PI });
      twigs.push(bough(mix(stations[1]!.at, tip, t === 1 ? 0.7 : 0.25), add(at, [0, -0.15, 0]), 0.07, 0.03, 0.1));
    }
    groups.push([first, first + 1]);
    limbs.push({ stations, sides: [5, 8, 3], phase: k, mass: groups.length - 1 });
  }
  return { stem, stemSides: [6, 10, 4], limbs, twigs, clumps, groups };
}

const pineBark: [P3, P3] = [[0.25, 0.15, 0.08], [0.56, 0.37, 0.21]];
// Marked pure, so another design's standalone JS can drop this table.
const STYLES: Record<ConiferSpecies, BroadleafStyle> = /* @__PURE__ */ (() => ({
  pine: {
    colors: CONIFER_COLORS.pine, top: 9.2, leafWidth: 0.2, leafRise: [0.2, 0.35],
    leaf: [[0.04, 0.16, 0.08], [0.15, 0.38, 0.2], [0.46, 0.63, 0.32]], bark: pineBark,
    tufts: { high: 5, highAiry: 5, max: 10, maxAiry: 10 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.72, max: 0.5 },
    massSides: 6, lowMass: "cone", coarse: "cone",
  },
  spruce: {
    colors: CONIFER_COLORS.spruce, top: 10.6, leafWidth: 0.2, leafRise: [0.2, 0.35],
    leaf: [[0.03, 0.12, 0.08], [0.1, 0.3, 0.21], [0.33, 0.53, 0.38]], bark: [[0.22, 0.14, 0.08], [0.5, 0.34, 0.2]],
    tufts: { high: 6, highAiry: 6, max: 9, maxAiry: 9 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.72, max: 0.52 },
    massSides: 6, lowMass: "cone", coarse: "cone",
  },
  larch: {
    colors: CONIFER_COLORS.larch, top: 10.6, leafWidth: 0.2, leafRise: [0.2, 0.35],
    leaf: [[0.14, 0.29, 0.08], [0.42, 0.62, 0.2], [0.76, 0.88, 0.4]], bark: [[0.28, 0.2, 0.13], [0.6, 0.46, 0.32]],
    tufts: { high: 3, highAiry: 3, max: 13, maxAiry: 13 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.75, max: 0.48 },
    massSides: 6, lowMass: "cone", coarse: "cone",
  },
  autumnlarch: {
    colors: CONIFER_COLORS.autumnlarch, top: 10.6, leafWidth: 0.2, leafRise: [0.2, 0.35],
    leaf: [[0.38, 0.2, 0.04], [0.82, 0.57, 0.15], [0.98, 0.85, 0.4]], bark: [[0.28, 0.2, 0.13], [0.6, 0.46, 0.32]],
    tufts: { high: 3, highAiry: 3, max: 13, maxAiry: 13 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.75, max: 0.48 },
    massSides: 6, lowMass: "cone", coarse: "cone",
  },
  scotspine: {
    colors: CONIFER_COLORS.scotspine, top: 9.0, leafWidth: 0.2, leafRise: [0.2, 0.35],
    leaf: [[0.05, 0.17, 0.08], [0.2, 0.42, 0.22], [0.5, 0.68, 0.36]], bark: [[0.38, 0.19, 0.08], [0.86, 0.52, 0.29]],
    tufts: { high: 8, highAiry: 8, max: 45, maxAiry: 45 }, leaves: { high: 4, max: 5 }, leafLength: { high: 0.6, max: 0.42 },
    massSides: (j) => j === 0 ? 5 : 6,
  },
}))();
const LAYOUTS: Record<ConiferSpecies, (o: BroadleafOptions) => Layout> = {
  pine: pineLayout, spruce: spruceLayout, larch: larchLayout, autumnlarch: larchLayout, scotspine: scotspineLayout,
};

export const isConifer = (species: string): species is ConiferSpecies => (CONIFER_SPECIES as readonly string[]).includes(species);
export function coniferParts(species: ConiferSpecies, detail: "max" | "high" | "low" | "coarse", options: Partial<BroadleafOptions> = {}): Parts {
  const o = { ...DEFAULT_CONIFER, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error(`Invalid ${species} options`);
  return broadleafParts(detail, o, LAYOUTS[species], STYLES[species]);
}
