// Reference-led oak: connected tapered boughs, closed foliage cores and folded
// double-sided leaf shapes, drawn by the shared tree kit (treeKit.ts).
// No textures, transparency, random global state or Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { P3 } from "./treeGeo.ts";
import { add, broadleafParts, mix, mul, random, sub, type BroadleafStyle, type Clump, type Layout, type Parts, type Station } from "./treeKit.ts";
export const OAK_COLORS = { trunk: "#ac804a", foliage: "#c4d953" };
export const OAK_PARAMS: ParamSpec[] = [
  { name: "seed", title: "Tree seed", default: "1",
    values: /* @__PURE__ */ ["1", "2", "3", "4", "5"].map((value) => ({ value, title: value })),
    retired: { "7": { seed: "1" }, "19": { seed: "2" } } },
  { name: "height", title: "Height", default: "standard", values: [{ value: "standard", title: "Standard" }, { value: "tall", title: "Tall" }] },
  { name: "canopy", title: "Canopy width", default: "broad", values: [{ value: "broad", title: "Broad" }, { value: "compact", title: "Compact" }] },
  { name: "branches", title: "Branch spread", default: "spreading", values: [{ value: "spreading", title: "Spreading" }, { value: "upright", title: "Upright" }] },
  { name: "foliage", title: "Foliage density", default: "full", values: [{ value: "full", title: "Full" }, { value: "airy", title: "Airy" }] },
];
export interface OakOptions {
  seed: number;
  height: number;
  width: number;
  spread: number;
  density: number;
}
export const DEFAULT_OAK: OakOptions = { seed: 7, height: 1, width: 1, spread: 1, density: 1 };
export function oakOptions(p?: ParamValues): OakOptions {
  const v = resolveParams(OAK_PARAMS, p);
  return { seed: [7, 19, 83, 173, 431][Number(v.seed) - 1]!, height: v.height === "tall" ? 1.15 : 1,
    width: v.canopy === "compact" ? 0.83 : 1, spread: v.branches === "upright" ? 0.8 : 1,
    density: v.foliage === "airy" ? 0.8 : 1 };
}
// The structure every level shares: a leaning, flared trunk that forks into three
// limbs, low side boughs, and thirteen leaf clumps arranged as a broad dome. Only
// this function draws from the seed's structural random stream.
function layout(o: OakOptions): Layout {
  const rng = random(o.seed);
  const jitter = (k: number) => (rng() - 0.5) * 2 * k;
  const leanAngle = rng() * Math.PI * 2, lean = 0.22 + rng() * 0.22;
  const leanDir: P3 = [Math.cos(leanAngle), 0, Math.sin(leanAngle)];
  const forkY = 3.05 + rng() * 0.4;
  const bend = (t: number): P3 => mul(leanDir, lean * t * t);
  const stem: Station[] = [
    { at: [0, 0, 0], r: 0.66 }, { at: [bend(0.12)[0], 0.45, bend(0.12)[2]], r: 0.47 },
    { at: add(bend(0.45), [0, forkY * 0.45, 0]), r: 0.4 }, { at: add(bend(0.8), [0.05, forkY * 0.8, -0.04]), r: 0.37 },
    { at: add(bend(1), [0, forkY, 0]), r: 0.34 },
  ];
  const fork = stem[stem.length - 1]!.at;
  const stemAt = (y: number): P3 => {
    const i = stem.findIndex((s) => s.at[1] >= y);
    if (i <= 0)
      return stem[0]!.at;
    const a = stem[i - 1]!.at, b = stem[i]!.at;
    return mix(a, b, (y - a[1]) / (b[1] - a[1]));
  };
  // The crown's centre leans further than the trunk and shifts a little per seed.
  const shift: P3 = add(mul(leanDir, lean * 1.3), [jitter(0.35), 0, jitter(0.35)]);
  const lift = (1 - o.spread) * 3;
  const clumps: Clump[] = [];
  const ring = (count: number, y: number, dist: number, r: number) => {
    const phase = rng() * Math.PI * 2;
    for (let k = 0; k < count; k++) {
      const a = phase + (k + jitter(0.28)) * Math.PI * 2 / count;
      const d = dist * o.spread * (0.88 + rng() * 0.24);
      const out: P3 = [Math.cos(a), 0, Math.sin(a)];
      clumps.push({ at: add(add(shift, mul(out, d)), [0, y + jitter(0.3) + lift * (1 - y / 9), 0]),
        r: r * (0.9 + rng() * 0.2), out, tone: jitter(0.05) });
    }
  };
  clumps.push({ at: add(shift, [jitter(0.3), 8.25 + jitter(0.15), jitter(0.3)]), r: 1.3, out: [0, 0, 0], tone: 0.04 });
  ring(4, 7.35, 2.0, 1.2);
  ring(6, 6.25, 3.0, 1.1);
  ring(2, 5.05, 3.45, 1.05);
  // Three limbs from the fork, each serving the clumps nearest its bearing; the
  // lowest ring hangs from its own boughs, which leave the trunk below the fork.
  const limbPhase = rng() * Math.PI * 2;
  const bearings = [0, 1, 2].map((k) => limbPhase + (k + jitter(0.15)) * Math.PI * 2 / 3);
  const limbs: Station[][] = [], twigs: Station[][] = [];
  const lowest = clumps.length - 2;
  const owner = clumps.map((c, i) => {
    if (i >= lowest)
      return -1;
    if (i === 0)
      return 0;
    const a = Math.atan2(c.at[2] - fork[2], c.at[0] - fork[0]);
    let best = 0;
    for (let k = 1; k < 3; k++)
      if (Math.cos(a - bearings[k]!) > Math.cos(a - bearings[best]!))
        best = k;
    return best;
  });
  for (let k = 0; k < 3; k++) {
    const mine = clumps.filter((_, i) => owner[i] === k);
    const dir: P3 = [Math.cos(bearings[k]!), 0, Math.sin(bearings[k]!)];
    const target = mine.length ? mul(mine.reduce((s, c) => add(s, c.at), [0, 0, 0] as P3), 1 / mine.length)
      : add(fork, add(mul(dir, 2), [0, 3, 0]));
    const start = add(fork, [0, -0.3, 0]);
    const end = mix(start, target, 0.58 + rng() * 0.08);
    end[1] = Math.max(end[1], start[1] + 1.6);
    const elbow = add(mix(start, end, 0.5), add(mul(dir, 0.3), [0, -0.15, 0]));
    limbs.push([{ at: start, r: 0.3 }, { at: mix(start, elbow, 0.55), r: 0.24 }, { at: elbow, r: 0.19 }, { at: end, r: 0.13 }]);
    for (const c of mine) {
      const tip = add(c.at, [0, -c.r * 0.2, 0]);
      twigs.push([{ at: mix(elbow, end, 0.75), r: 0.12 }, { at: add(mix(end, tip, 0.45), [0, 0.35, 0]), r: 0.08 }, { at: tip, r: 0.035 }]);
    }
  }
  clumps.slice(lowest).forEach((c, k) => {
    const y = Math.min(forkY - 0.35, 2.15 + k * 0.32 + rng() * 0.25);
    const start = stemAt(y);
    const tip = add(c.at, [0, -c.r * 0.25, 0]);
    const reach = sub(tip, start);
    const elbow = add(start, [reach[0] * 0.55, reach[1] * 0.2 + 0.1, reach[2] * 0.55]);
    limbs.push([{ at: add(start, mul(c.out, -0.12)), r: 0.21 }, { at: mix(start, elbow, 0.5), r: 0.16 }, { at: elbow, r: 0.12 },
      { at: tip, r: 0.04 }]);
  });
  // Low detail: the top clump alone, each limb's other clumps as one mass, and
  // each low bough's clump alone; a limb runs into its mass.
  const groups = [[0], ...[0, 1, 2].map((k) => clumps.map((_, i) => i).filter((i) => i > 0 && owner[i] === k)),
    ...owner.flatMap((k, i) => k < 0 ? [[i]] : [])].filter((m) => m.length);
  return {
    stem, stemSides: [8, 14, 4], twigs, clumps, groups,
    limbs: limbs.map((stations, i) => {
      const mass = groups.findIndex((m) => i < 3 && m.some((c) => c > 0 && owner[c] === i));
      return { stations, sides: i < 3 ? [6, 10, 3] : [5, 8, 3], phase: i * 0.4, ...(mass >= 0 ? { mass } : {}) };
    }),
  };
}
const OAK_STYLE: BroadleafStyle = {
  colors: OAK_COLORS,
  leaf: [[0.08, 0.23, 0.05], [0.29, 0.55, 0.1], [0.7, 0.86, 0.25]],
  bark: [[0.3, 0.17, 0.08], [0.72, 0.47, 0.25]],
  top: 9.4,
  roots: { high: 5, max: 6, size: 1 },
  tufts: { high: 12, highAiry: 9, max: 30, maxAiry: 23 },
  leaves: { high: 4, max: 5 },
  leafLength: { high: 0.64, max: 0.44 },
  massSides: 6,
  coarseCrown: { scale: [3.5, 2.7, 3.5], y: 5.6 },
};
export function oakParts(detail: "max" | "high" | "low" | "coarse", options: Partial<OakOptions> = {}): Parts {
  const o = { ...DEFAULT_OAK, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error("Invalid oak options");
  return broadleafParts(detail, o, layout, OAK_STYLE);
}
