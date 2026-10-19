// The palm, drawn by the tree kit (treeKit.ts): a curving, ringed trunk under a
// crown knob with coconuts and a rosette of arching fronds, each a midrib of
// leaflet pairs (a drooping ribbon at low detail). Five numbered seeds;
// docs/models/trees.md. No Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import {
  TREE_SEED, add, bearing, broadleafParts, jitterOf, mul, random,
  type BroadleafOptions, type BroadleafStyle, type Frond, type Layout, type Parts, type Station,
} from "./treeKit.ts";

export const PALM_COLORS = { trunk: "#94703a", foliage: "#4fa443" };
export const PALM_PARAMS: ParamSpec[] = [TREE_SEED];
const SEEDS = [17, 41, 109, 239, 593];
export const DEFAULT_PALM: BroadleafOptions = { seed: SEEDS[0]!, height: 1, width: 1, spread: 1, density: 1 };
export function palmOptions(p?: ParamValues): BroadleafOptions {
  return { ...DEFAULT_PALM, seed: SEEDS[Number(resolveParams(PALM_PARAMS, p).seed) - 1]! };
}

function palmLayout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng);
  const lean = bearing(rng() * Math.PI * 2), curve = 1.0 + rng() * 0.45, H = 9;
  // Nine stations: the trunk curves away from the wind and swells at every other ring.
  const stem: Station[] = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return { at: add(mul(lean, curve * t * t), [0, H * t, 0]), r: (0.5 - 0.25 * t) * (i % 2 ? 0.92 : 1) };
  });
  const top = stem[8]!.at;
  const knobs = [{ at: add(top, [0, 0.1, 0]), r: 0.42 }];
  const phase = rng() * Math.PI * 2;
  for (let k = 0; k < 3; k++)
    knobs.push({ at: add(top, add(mul(bearing(phase + k * 2.1 + jit(0.3)), 0.34), [0, -0.3, 0])), r: 0.17 });
  const fronds: Frond[] = [];
  for (let k = 0; k < 13; k++) {
    const dir = bearing(phase + (k + jit(0.2)) * Math.PI * 2 / 13), upper = k % 2 === 0;
    fronds.push({ at: add(top, add(mul(dir, 0.18), [0, upper ? 0.35 : 0.15, 0])), dir, length: (upper ? 4.2 : 3.6) * (0.92 + rng() * 0.16),
      rise: upper ? 1.3 : 0.8, droop: (upper ? 2.4 : 2.8) * (0.9 + rng() * 0.2), tone: jit(0.05) });
  }
  return { stem, stemSides: [7, 12, 4], limbs: [], twigs: [], clumps: [], groups: [], fronds, knobs };
}

const PALM_STYLE: BroadleafStyle = {
  colors: PALM_COLORS, top: 10,
  leaf: [[0.05, 0.24, 0.06], [0.22, 0.55, 0.18], [0.62, 0.86, 0.32]], bark: [[0.35, 0.25, 0.13], [0.72, 0.56, 0.33]],
  tufts: { high: 0, highAiry: 0, max: 0, maxAiry: 0 }, leaves: { high: 0, max: 0 }, leafLength: { high: 0, max: 0 },
  massSides: 6, fronds: { high: 11, max: 44, lowSegments: 5 },
};

export function palmParts(detail: "max" | "high" | "low" | "coarse", options: Partial<BroadleafOptions> = {}): Parts {
  const o = { ...DEFAULT_PALM, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error("Invalid palm options");
  return broadleafParts(detail, o, palmLayout, PALM_STYLE);
}
