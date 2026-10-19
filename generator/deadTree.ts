// The dead tree, drawn by the tree kit (treeKit.ts): a leaning, broken-topped
// trunk with root flares and four bare limbs, each forking into two twigs. It has
// no leaves: the limbs and twigs are its foliage group, in the bark's colour, so
// the two-material layout holds. Five numbered seeds; docs/models/trees.md.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import {
  TREE_SEED, add, bearing, bough, broadleafParts, jitterOf, leaning, mix, mul, random, stationAt,
  type BroadleafOptions, type BroadleafStyle, type Layout, type Limb, type Parts, type Station,
} from "./treeKit.ts";

export const DEADTREE_COLORS = { trunk: "#7a6650", foliage: "#7a6650" };
export const DEADTREE_PARAMS: ParamSpec[] = [TREE_SEED];
const SEEDS = [19, 43, 113, 241, 599];
export const DEFAULT_DEADTREE: BroadleafOptions = { seed: SEEDS[0]!, height: 1, width: 1, spread: 1, density: 1 };
export function deadtreeOptions(p?: ParamValues): BroadleafOptions {
  return { ...DEFAULT_DEADTREE, seed: SEEDS[Number(resolveParams(DEADTREE_PARAMS, p).seed) - 1]! };
}

function deadtreeLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng), bend = leaning(rng, 0.45);
  const ys = [0, 0.4, 1.8, 3.4, 4.9], rs = [0.48, 0.38, 0.32, 0.24, 0.13];
  const stem: Station[] = ys.map((y, i) => ({ at: add(bend(y / 4.9), [i > 1 ? jit(0.12) : 0, y, i > 1 ? jit(0.12) : 0]), r: rs[i]! }));
  const limbs: Limb[] = [], twigs: Station[][] = [];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 4; k++) {
    const dir = bearing(phase + (k + jit(0.2)) * Math.PI / 2), y = 2.4 + k * 0.6 + jit(0.15), start = stationAt(stem, y);
    const tip = add(start, add(mul(dir, (2.0 - 0.15 * k) * (0.85 + rng() * 0.3)), [0, 0.7 + rng() * 0.6, 0]));
    const stations = bough(start, tip, 0.14 - 0.015 * k, 0.04, 0.2);
    limbs.push({ stations, sides: [5, 8, 3], phase: k });
    for (const t of [0.55, 0.9]) {
      const from = mix(start, tip, t), side = bearing(phase + (k + (t < 0.7 ? 0.3 : -0.3)) * Math.PI / 2);
      twigs.push(bough(from, add(from, add(mul(side, 0.7 + rng() * 0.3), [0, 0.5 + rng() * 0.4, 0])), 0.05, 0.015, 0.08));
    }
  }
  return { stem, stemSides: [6, 12, 4], limbs, twigs, clumps: [], groups: [] };
}

const DEADTREE_STYLE: BroadleafStyle = {
  colors: DEADTREE_COLORS, top: 6.2,
  leaf: [[0.3, 0.25, 0.2], [0.45, 0.4, 0.33], [0.62, 0.55, 0.46]], bark: [[0.28, 0.23, 0.18], [0.64, 0.57, 0.47]],
  roots: { high: 4, max: 6, size: 0.8 },
  tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
  massSides: 6, woodFoliage: true, coarse: "wood",
};

export function deadtreeParts(detail: "max" | "high" | "low" | "coarse", options: Partial<BroadleafOptions> = {}): Parts {
  const o = { ...DEFAULT_DEADTREE, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error("Invalid dead tree options");
  return broadleafParts(detail, o, deadtreeLayout, DEADTREE_STYLE);
}
