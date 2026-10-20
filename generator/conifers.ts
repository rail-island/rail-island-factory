// The conifers -- pine, spruce, the European larch (summer and autumn) and the
// mature Scots pine -- drawn by the tree kit (treeKit.ts): seeded whorls of
// branches, each ending in a flattened needle pad (a dark core under tufts of
// narrow needles), a leader with a top pad, and stacked cones at low detail.
// Five numbered seeds per species; docs/models/trees.md. No Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { P3 } from "./treeGeo.ts";
import {
  TREE_SEED, add, bearing, bough, broadleafParts, jitterOf, leaning, mix, mul, random, stationAt, unit,
  type BroadleafOptions, type BroadleafStyle, type Clump, type Layout, type Limb, type Parts, type Spray, type Station,
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

// Needle sprays (treeKit.ts `Spray`) follow the branch structure: a spruce's long
// drooping boughs carry side shoots and layer into a dense cone; a pine's thick
// rising branches end in chunky tufts; a larch's thin arching branches carry small
// soft puffs. Primary branches (and their tufts) come from the structural stream;
// Max's extra shoots from a stream of their own, so they never move a branch.
const up = (y: number): P3 => [0, y, 0];
const turn = (d: P3, a: number): P3 => [d[0] * Math.cos(a) - d[2] * Math.sin(a), 0, d[0] * Math.sin(a) + d[2] * Math.cos(a)];
const stemOf = (rng: () => number, H: number, foot: number, lean: number): Station[] => {
  const bend = leaning(rng, lean), ys = [0, 0.5, H * 0.3, H * 0.55, H * 0.8, H], rs = [1, 0.85, 0.7, 0.5, 0.28, 0.08];
  return ys.map((y, i) => ({ at: add(bend(y / H), up(y)), r: foot * rs[i]! }));
};
// A spray along `points`, `w` wide at its widest (profile: narrow base, full body, tip).
const spray = (points: P3[], w: number, flat: number, tone: number, tier: number, seed: number, rank: number, maxOnly = false): Spray => {
  const profile = points.length === 3 ? [0.45, 1, 0.3] : points.length === 4 ? [0.35, 1, 0.85, 0.3] : [0.12, 0.6, 1, 0.85, 0.3];
  return { path: points.map((at, i) => ({ at, w: w * profile[i]!, h: w * profile[i]! * flat })), tone, tier, seed, rank, ...(maxOnly ? { maxOnly } : {}) };
};

// Spruce: ten tight whorls of long boughs, each a broad, thin fan plate that droops
// to its sides and along its length and turns up at the tip, with two side
// branchlets (four, two smaller, at Max). The lower boughs are broader, overlap and half hide
// the trunk; Max shows the wood of the lower whorls' branches beneath them.
function spruceLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), H = 10.6;
  const stem = stemOf(rng, H, 0.42, 0.12);
  const sprays: Spray[] = [], limbs: Limb[] = [];
  const W = 10;
  for (let w = 0; w < W; w++) {
    const t = w / (W - 1), y = 1.45 + (9.4 - 1.45) * (1 - Math.pow(1 - t, 1.25)) + jit(0.1), base = stationAt(stem, y);
    const n = Math.round(5.4 - 2.4 * t), phase = w * 2.4 + rng() * 0.8;
    for (let b = 0; b < n; b++) {
      const dir = bearing(phase + (b + jit(0.3)) * Math.PI * 2 / n), reach = (2.7 * Math.pow(1 - t, 0.95) + 0.6) * (0.85 + rng() * 0.3);
      const at = (s: number): P3 => add(base, add(mul(dir, reach * s), up(-0.26 * reach * Math.pow(s, 2.2) + 0.06 * reach * Math.sin(Math.PI * s))));
      const tone = jit(0.05), seed = w * 31 + b;
      sprays.push(spray([at(0), at(0.25), at(0.5), at(0.75), at(1)], reach * (0.3 + 0.1 * (1 - t)) + 0.1, 0.16, tone, Math.floor(w / 2), seed, 0));
      if (w < 5)
        limbs.push({ stations: [{ at: base, r: 0.09 * (1 - 0.5 * t) }, { at: at(0.5), r: 0.035 }], sides: [3, 4, 3], maxOnly: true, skipLow: true });
      const shoots = random(o.seed * 977 + seed);
      // Side branchlets: smaller plates just under the bough, fanning out to either
      // side of it, so each tier reads as layered foliage rather than one slab.
      for (let k = 0; k < 4; k++) {
        const s = [0.4, 0.62, 0.28, 0.8][k]!, from = add(at(s), up(-0.12)), len = reach * (0.55 - 0.25 * s) * (k < 2 ? 1 : 0.75) * (0.85 + shoots() * 0.3);
        const d = turn(dir, (k % 2 ? 1 : -1) * (0.45 + shoots() * 0.2));
        sprays.push(spray([from, add(from, add(mul(d, len * 0.5), up(-0.05 * len))), add(from, add(mul(d, len), up(-0.24 * len)))],
          len * 0.55 + 0.06, 0.22, tone - 0.05 + (shoots() - 0.5) * 0.06, Math.floor(w / 2), seed * 7 + k, 1, k >= 2));
      }
    }
  }
  // The leader: an upright spray finishing the crown.
  const top = stem[5]!.at;
  sprays.push(spray([add(top, up(-1.6)), add(top, up(-1.0)), add(top, up(-0.4)), add(top, up(0.15))], 0.3, 1, 0.05, Math.floor((W - 1) / 2), 1, 0));
  return { stem, stemSides: [6, 10, 4], limbs, twigs: [], clumps: [], groups: [], sprays };
}

// Pine: an irregular, open crown above a bare trunk; few whorls of strong branches
// that rise as they reach out, the needles gathered in chunky tufts at the branch
// and side-twig tips.
function pineLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), H = 9.2;
  const stem = stemOf(rng, H, 0.42, 0.3);
  const limbs: Limb[] = [], twigs: Station[][] = [], sprays: Spray[] = [];
  const counts = [4, 4, 4, 3, 3, 3], tiers = [0, 1, 2, 2, 3, 3];
  counts.forEach((n, w) => {
    const t = w / (counts.length - 1), y = 3.3 + (8.0 - 3.3) * (1 - Math.pow(1 - t, 1.2)) + jit(0.25), base = stationAt(stem, y);
    const phase = w * 2.4 + rng() * Math.PI;
    for (let b = 0; b < n; b++) {
      const dir = bearing(phase + (b + jit(0.45)) * Math.PI * 2 / n), reach = (2.2 * Math.pow(1 - t, 0.7) + 0.75) * (0.75 + rng() * 0.5);
      const tip = add(base, add(mul(dir, reach), up(reach * (0.25 + rng() * 0.3))));
      const branch = bough(base, tip, 0.12 * (1 - 0.45 * t), 0.04, 0.12 * reach);
      limbs.push({ stations: branch, sides: [4, 6, 3], phase: b, skipLow: true });
      const tone = jit(0.06), seed = w * 31 + b, size = 0.62 * (0.85 + rng() * 0.3) * (1 - 0.25 * t);
      // The branch's own tuft: from the outer part of the branch past its tip, turning up.
      const from = mix(branch[1]!.at, tip, 0.35), dirUp = unit(add(dir, up(0.6)));
      sprays.push(spray([from, mix(from, tip, 0.5), tip, add(tip, mul(dirUp, size * 0.9))], size, 0.5, tone, tiers[w]!, seed, 0));
      const twigRng = random(o.seed * 977 + seed);
      for (let k = 0; k < 5; k++) {
        const start = mix(branch[1]!.at, tip, [0.15, 0.45, 0.75, 0.3, 0.6][k]!), d = turn(dir, (k % 2 ? 1 : -1) * (0.7 + twigRng() * 0.5));
        const len = reach * (0.42 - 0.08 * (k % 3)) * (0.85 + twigRng() * 0.3), end = add(start, add(mul(d, len), up(len * 0.45)));
        const max = k >= 2;
        if (!max) twigs.push(bough(start, end, 0.045, 0.02, 0.05 * len));
        else limbs.push({ stations: bough(start, end, 0.045, 0.02, 0.05 * len), sides: [3, 5, 3], maxOnly: true, skipLow: true });
        const tuft = size * 0.72, out = unit(add(d, up(0.7)));
        sprays.push(spray([mix(start, end, 0.45), end, add(end, mul(out, tuft * 0.9))], tuft, 0.5, tone + (twigRng() - 0.5) * 0.06, tiers[w]!, seed * 7 + k, 1, max));
      }
    }
  });
  // A twig only Max draws is a limb (above): the twig list is what high detail draws too.
  const top = stem[5]!.at;
  sprays.push(spray([add(top, up(-1.1)), add(top, up(-0.6)), add(top, up(-0.1)), add(top, up(0.3))], 0.3, 0.9, 0.05, 3, 2, 0));
  return { stem, stemSides: [6, 10, 4], limbs, twigs, clumps: [], groups: [], sprays };
}

// Larch: a light, airy crown; thin branches arch out and down, carrying small
// soft needle puffs that hang from them (three each, six at Max).
function larchLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), H = 10.6;
  const stem = stemOf(rng, H, 0.34, 0.2);
  const limbs: Limb[] = [], sprays: Spray[] = [];
  const counts = [4, 4, 4, 3, 3, 3, 2, 2];
  counts.forEach((n, w) => {
    const t = w / (counts.length - 1), y = 2.6 + (9.6 - 2.6) * (1 - Math.pow(1 - t, 1.2)) + jit(0.15), base = stationAt(stem, y);
    const phase = w * 2.4 + rng() * Math.PI;
    for (let b = 0; b < n; b++) {
      const dir = bearing(phase + (b + jit(0.35)) * Math.PI * 2 / n), reach = (2.0 * Math.pow(1 - t, 0.8) + 0.5) * (0.8 + rng() * 0.4);
      const tip = add(base, add(mul(dir, reach), up(-0.12 * reach)));
      const branch = bough(base, tip, 0.06 * (1 - 0.4 * t), 0.02, 0.22 * reach);
      limbs.push({ stations: branch, sides: [3, 5, 3], phase: b, skipLow: true });
      const tone = jit(0.06), seed = w * 31 + b, puffs = random(o.seed * 977 + seed);
      const along = (s: number): P3 => {
        const i = s < 0.5 ? 0 : 1, u = s < 0.5 ? s * 2 : (s - 0.5) * 2;
        return mix(branch[i]!.at, branch[i + 1]!.at, u);
      };
      // Three hanging plates at high detail, ten overlapping ones at Max.
      for (let k = 0; k < 10; k++) {
        const s = k < 3 ? [0.45, 0.72, 0.97][k]! : 0.25 + 0.72 * ((k * 0.618) % 1), from = along(s), size = (0.36 + 0.1 * (1 - t)) * (0.85 + puffs() * 0.3);
        const d = unit(add(turn(dir, (puffs() - 0.5) * 1.4), up(-0.6)));
        sprays.push(spray([from, add(from, mul(d, size * 0.9)), add(from, mul(d, size * 1.9))], size, 0.5, tone + (puffs() - 0.5) * 0.08,
          Math.floor(w / 2), seed * 7 + k, 1, k >= 3));
      }
    }
  });
  const top = stem[5]!.at;
  sprays.push(spray([add(top, up(-0.8)), add(top, up(-0.2)), add(top, up(0.2))], 0.3, 1, 0.05, 3, 3, 1));
  return { stem, stemSides: [6, 10, 4], limbs, twigs: [], clumps: [], groups: [], sprays };
}
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
    colors: CONIFER_COLORS.pine, top: 9.6,
    leaf: [[0.05, 0.17, 0.09], [0.17, 0.4, 0.21], [0.5, 0.66, 0.33]], bark: pineBark,
    tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
    massSides: 6, coarse: "cone", sprays: { high: [[5, 4], [5, 3]], max: [[7, 6], [6, 4]], ragged: 0.14, droop: 0.15, scallop: 0.18, under: 0.5, facet: 0.7 },
  },
  spruce: {
    colors: CONIFER_COLORS.spruce, top: 10.8,
    leaf: [[0.05, 0.2, 0.1], [0.15, 0.44, 0.19], [0.45, 0.72, 0.26]], bark: [[0.3, 0.17, 0.08], [0.62, 0.4, 0.22]],
    tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
    massSides: 6, coarse: "cone", sprays: { high: [[5, 4], [4, 3]], max: [[7, 8], [5, 4]], ragged: 0.08, droop: 0.2, scallop: 0.22, under: 0.4, facet: 0.9 },
  },
  larch: {
    colors: CONIFER_COLORS.larch, top: 10.8,
    leaf: [[0.16, 0.32, 0.1], [0.45, 0.66, 0.24], [0.78, 0.9, 0.46]], bark: [[0.28, 0.2, 0.13], [0.6, 0.46, 0.32]],
    tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
    massSides: 6, coarse: "cone", sprays: { high: [[4, 3], [4, 3]], max: [[6, 4], [5, 4]], ragged: 0.12, scallop: 0.15, facet: 0.5 },
  },
  autumnlarch: {
    colors: CONIFER_COLORS.autumnlarch, top: 10.8,
    leaf: [[0.4, 0.22, 0.06], [0.84, 0.6, 0.18], [0.98, 0.86, 0.45]], bark: [[0.28, 0.2, 0.13], [0.6, 0.46, 0.32]],
    tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
    massSides: 6, coarse: "cone", sprays: { high: [[4, 3], [4, 3]], max: [[6, 4], [5, 4]], ragged: 0.12, scallop: 0.15, facet: 0.5 },
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
