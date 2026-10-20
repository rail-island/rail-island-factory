// The spruce (Norway spruce, Picea abies), drawn after the user's stylised
// reference (assets/trees/spruce-reference.png): a straight tapering trunk
// through a dense, tapered cone of whorled boughs. Each bough runs out from the
// trunk, dips and turns up at its tip, and carries broad faceted foliage pads --
// thin drooping fans with a serrated rim -- on its end, on its side branchlets
// and near the trunk, overlapping so a tier reads as one layered mass with a
// light top and a dark underside. Whorls thin out and shorten toward a pointed
// leader; spacing, reach and pads vary per seed so no two tiers repeat.
//
//   max     more pads (extra branchlets from their own stream), finer pads,
//           wood for every bough and twigs into the branchlets
//   high    the forest tree (within the shipped 2,970-triangle allowance)
//   low     the trunk and four tier cones whose rims follow the boughs' reach
//   coarse  one square pyramid and a tetrahedral trunk
//
// Five numbered seeds; docs/models/trees.md. No Node APIs.
import { resolveParams, type ParamValues } from "./design.ts";
import { Geo, boxOf, fromIndexed, type P3 } from "./treeGeo.ts";
import {
  TREE_SEED, add, bearing, fit, jitterOf, limb, mix, mul, random, sub, tetraBranch, unit,
  type BroadleafOptions, type Parts, type Station,
} from "./treeKit.ts";

export const SPRUCE_COLORS = { trunk: "#6b4426", foliage: "#2c7038" };

// The conifers' internal seeds (conifers.ts), kept so saved values stay meaningful.
const SEEDS = [13, 37, 101, 223, 577];
const DEFAULT: BroadleafOptions = { seed: SEEDS[0]!, height: 1, width: 1, spread: 1, density: 1 };
export function spruceOptions(p?: ParamValues): BroadleafOptions {
  return { ...DEFAULT, seed: SEEDS[Number(resolveParams([TREE_SEED], p).seed) - 1]! };
}

type Detail = "max" | "high" | "low" | "coarse";
// A foliage pad: a drooping fan centred on `at`, `length` along the horizontal
// `dir` and `width` across it, its rim `droop` below its crest and tilted by
// `pitch` (rise per unit along `dir`). Rank 0 is a bough's end pad, 1 a
// branchlet or inner pad, 2 an extra pad only Max draws.
type Pad = { at: P3; dir: P3; length: number; width: number; droop: number; pitch: number; tone: number; seed: number; rank: 0 | 1 | 2 };
type Bough = { base: P3; dir: P3; reach: number; t: number; wood: Station[]; tier: number; woodHigh: boolean };
type Layout = { stem: Station[]; boughs: Bough[]; pads: Pad[]; top: number };

const H = 10.6;
const up = (y: number): P3 => [0, y, 0];
const turn = (d: P3, a: number): P3 => [d[0] * Math.cos(a) - d[2] * Math.sin(a), 0, d[0] * Math.sin(a) + d[2] * Math.cos(a)];
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// The crown's radius at height fraction t of the whorled part (0 lowest whorl, 1 top).
const crownRadius = (t: number) => 2.3 * (1 - t) + 0.45;

function layout(o: BroadleafOptions): Layout {
  const rng = random(o.seed), jit = jitterOf(rng);
  // A nearly straight trunk, flared at the foot, thinning into the leader.
  const lean = rng() * Math.PI * 2, leanBy = 0.06 + rng() * 0.08;
  const trunkAt = (y: number): P3 => add(mul(bearing(lean), leanBy * (y / H) * (y / H)), up(y));
  const ys = [0, 0.3, 1.4, 3.6, 6.2, 8.4, H - 0.7], rs = [0.5, 0.4, 0.34, 0.27, 0.19, 0.12, 0.05];
  const stem: Station[] = ys.map((y, i) => ({ at: trunkAt(y), r: rs[i]! }));
  const boughs: Bough[] = [], pads: Pad[] = [];
  const W = 9, y0 = 2.5 + jit(0.15), y1 = 9.45;
  for (let w = 0; w < W; w++) {
    const t = w / (W - 1), wy = y0 + (y1 - y0) * (1 - Math.pow(1 - t, 1.22)) + (w > 0 && w < W - 1 ? jit(0.14) : 0);
    const n = Math.round(5.6 - 2.4 * t + jit(0.45)), phase = w * 2.4 + rng() * 1.2;
    for (let b = 0; b < n; b++) {
      const dir = bearing(phase + (b + jit(0.32)) * Math.PI * 2 / n);
      // Boughs leave the whorl a little apart in height, and some reach further than others.
      const y = wy + jit(0.12), base = trunkAt(y);
      const reach = crownRadius(t) * (0.8 + rng() * 0.36) * (w === 0 ? 0.88 : 1);
      // Out and slightly down, turning up at the tip.
      const at = (s: number): P3 => add(base, add(mul(dir, reach * s), up(reach * (-0.2 * s + 0.13 * s * s * s))));
      const r0 = 0.1 * (1 - 0.6 * t) + 0.02;
      const wood: Station[] = t < 0.3 ? [{ at: base, r: r0 }, { at: at(0.45), r: r0 * 0.6 }, { at: at(0.86), r: 0.025 }] : [{ at: base, r: r0 }, { at: at(0.8), r: 0.025 }];
      const tier = Math.min(3, Math.floor(t * 4));
      boughs.push({ base, dir, reach, t, wood, tier, woodHigh: t < 0.56 });
      const tone = jit(0.05), seed = w * 31 + b, k = random(o.seed * 977 + seed), kj = jitterOf(k);
      const slope = (s: number) => -0.2 + 0.39 * s * s;
      // The end pad: the bough's broad drooping fan, from the middle of the bough past its tip.
      const len = reach * (0.92 + kj(0.06)) + 0.5;
      pads.push({
        at: add(at(0.62), up(0.08 + 0.03 * reach)), dir: unit(turn(dir, kj(0.12))), length: len, width: len * (1.12 + kj(0.08)),
        droop: 0.22 + 0.24 * len, pitch: slope(0.75) + 0.08, tone: tone + 0.03, seed: seed * 7, rank: 0,
      });
      // Branchlets: smaller fans to either side, a little lower, so the tier layers.
      const sides = t < 0.6 ? 2 : t < 0.9 ? (k() < 0.6 ? 2 : 1) : (k() < 0.5 ? 1 : 0);
      const first = k() < 0.5 ? -1 : 1;
      for (let j = 0; j < sides; j++) {
        const sign = j === 0 ? first : -first, s = 0.42 + kj(0.08), d = turn(dir, sign * (0.8 + kj(0.2)));
        const l = reach * (0.68 + kj(0.06)) + 0.2;
        pads.push({
          at: add(add(at(s), mul(d, l * 0.42)), up(-0.05 - 0.04 * reach)), dir: d, length: l, width: l * (1.05 + kj(0.08)),
          droop: 0.2 + 0.24 * l, pitch: -0.14, tone: tone - 0.05 + kj(0.03), seed: seed * 7 + 1 + j, rank: 1,
        });
      }
      // Max: two more branchlets further out and an inner pad near the trunk.
      for (let j = 0; j < (t < 0.8 ? 3 : 1); j++) {
        const sign = j % 2 ? 1 : -1, s = j === 2 ? 0.2 : 0.68 + kj(0.06), d = j === 2 ? dir : turn(dir, sign * (0.55 + kj(0.15)));
        const l = reach * (j === 2 ? 0.42 : 0.4) + 0.12;
        pads.push({
          at: add(add(at(s), mul(d, l * 0.4)), up(j === 2 ? 0.04 : -0.08)), dir: d, length: l, width: l * 0.85,
          droop: 0.1 + 0.24 * l, pitch: -0.1, tone: tone - (j === 2 ? 0.1 : 0.03), seed: seed * 7 + 3 + j, rank: 2,
        });
      }
    }
  }
  return { stem, boughs, pads, top: H };
}

// A pad as a closed, thin, drooping fan: a crest over an inner ring of `k`
// corners, a serrated rim of `2k` (lobes and notches, the lobes hanging lower),
// and a shallow underside rising to a point under the crest. 6k faces.
// `light` gives each corner how lit it is: crest and inner ring light, the rim
// mid, the underside dark.
function padVolume(p: Pad, k: number, fine: boolean): { geo: Geo; light: number[] } {
  const rng = random(p.seed * 7919 + 17), j = jitterOf(rng);
  const d = p.dir, s: P3 = [-d[2], 0, d[0]];
  const local = (u: number, v: number, y: number): P3 => add(p.at, add(add(mul(d, u), mul(s, v)), up(y + p.pitch * u)));
  const a = p.length / 2, b = p.width / 2, spin = j(0.08);
  // A rounded fan (a superellipse), narrower toward the bough's base (behind).
  const outline = (th: number) => {
    const c = Math.abs(Math.cos(th)), n = Math.abs(Math.sin(th)), r = 1 / Math.pow(Math.pow(c / a, 2.6) + Math.pow(n / b, 2.6), 1 / 2.6);
    return r * (1 - 0.35 * Math.max(0, -Math.cos(th)));
  };
  // Corner angles crowd toward the outer edge, so the fan's front is a row of small
  // lobes and its back (toward the trunk, hidden) is plain.
  const angle = (x: number) => {
    const v = ((x / (2 * k)) % 1 + 1) % 1 * 2 - 1;
    return Math.sign(v) * Math.PI * Math.pow(Math.abs(v), 1.35) + spin;
  };
  const rim: P3[] = [], inner: P3[] = [], mid: P3[] = [], back: number[] = [];
  for (let i = 0; i < 2 * k; i++) {
    const th = angle(i + j(0.12)), c = Math.cos(th), lobe = i % 2 === 0;
    const r = outline(th) * (lobe ? 1 + j(0.07) : 0.83 + j(0.05));
    // The rim hangs lower at the sides and the outer end than toward the trunk.
    const hang = p.droop * (lobe ? 1 : 0.72) * (0.7 + 0.45 * Math.max(0, c) + 0.1 * c) * (1 + j(0.12));
    rim.push(local(r * c, r * Math.sin(th), -hang));
    back.push(Math.max(0, -c));
  }
  for (let i = 0; i < k; i++) {
    const th = angle(i * 2 + 1 + j(0.2)), r = outline(th) * (0.5 + j(0.06));
    inner.push(local(r * Math.cos(th), r * Math.sin(th), -p.droop * (0.16 + 0.08 * Math.max(0, Math.cos(th)) + j(0.06))));
    if (fine) {
      const rr = outline(th) * 0.26;
      mid.push(local(rr * Math.cos(th), rr * Math.sin(th), -p.droop * (0.06 + j(0.04))));
    }
  }
  const crest = local(j(0.05) * a, 0, p.droop * 0.04), under = local(-0.1 * a, 0, -p.droop * 0.42);
  const tris: [P3, P3, P3, number, number, number][] = [];
  const ring = fine ? mid : null;
  for (let i = 0; i < k; i++) {
    const i1 = (i + 1) % k, o0 = rim[2 * i + 1]!, o1 = rim[(2 * i + 2) % (2 * k)]!, o2 = rim[(2 * i + 3) % (2 * k)]!;
    // inner[i] and inner[i + 1] sit inside the notches o0 and o2; the lobe o1 hangs between them.
    if (ring) {
      tris.push([crest, ring[i]!, ring[i1]!, 0.5, 0.42, 0.42]);
      tris.push([ring[i]!, inner[i]!, inner[i1]!, 0.42, 0.3, 0.3], [ring[i]!, inner[i1]!, ring[i1]!, 0.42, 0.3, 0.42]);
    } else
      tris.push([crest, inner[i]!, inner[i1]!, 0.36, 0.3, 0.3]);
    // The fan's back, toward the trunk, lies in the shade of the tier above.
    const n0 = 2 * i + 1, n1 = (2 * i + 2) % (2 * k), n2 = (2 * i + 3) % (2 * k);
    const li = 0.3 - 0.25 * back[n0]!, li1 = 0.3 - 0.25 * back[n2]!, l0 = 0.02 - 0.35 * back[n0]!, l1 = -0.06 - 0.35 * back[n1]!, l2 = 0.02 - 0.35 * back[n2]!;
    tris.push([inner[i]!, o0, o1, li, l0, l1], [inner[i]!, o1, inner[i1]!, li, l1, li1], [inner[i1]!, o1, o2, li1, l1, l2]);
  }
  for (let i = 0; i < 2 * k; i++)
    tris.push([under, rim[(i + 1) % (2 * k)]!, rim[i]!, -0.7, -0.38, -0.38]);
  const cross = (u: P3, v: P3): P3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const t0 = tris[0]!, flip = cross(sub(t0[1], t0[0]), sub(t0[2], t0[0]))[1] < 0;
  const pos: number[] = [], light: number[] = [];
  for (const [p0, p1, p2, l0, l1, l2] of tris) {
    pos.push(...p0, ...(flip ? p2 : p1), ...(flip ? p1 : p2));
    light.push(l0, flip ? l2 : l1, flip ? l1 : l2);
  }
  return { geo: new Geo(pos), light };
}

// The leader: a slim five-sided spire, closed (10 faces).
function spire(foot: P3, height: number, r: number): Geo {
  const pts: P3[] = [add(foot, up(height)), add(foot, up(-0.1))];
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    pts.push(add(foot, [Math.cos(a) * r, height * 0.18, Math.sin(a) * r]));
  }
  const idx: number[] = [];
  for (let i = 0; i < 5; i++) idx.push(0, 2 + (i + 1) % 5, 2 + i, 1, 2 + i, 2 + (i + 1) % 5);
  return fromIndexed(pts, idx);
}

const linear = (x: number) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
const rgbOf = (hex: string): P3 => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as P3;
const LEAF: [P3, P3, P3] = [[0.04, 0.16, 0.1], [0.13, 0.4, 0.17], [0.5, 0.78, 0.22]];
const BARK: [P3, P3] = [[0.3, 0.17, 0.08], [0.64, 0.4, 0.21]];

// Foliage colour per corner: the corner's own light (crest, rim, underside),
// the facet's slope (up-facing facets light, hanging ones dark) with a little
// per-facet variation, height, how far out of the crown it stands and the pad's
// tone; a slight warm or cool cast per pad, so the crown is not one green.
function paint(g: Geo, light: number[], tone: number): void {
  const base = rgbOf(SPRUCE_COLORS.foliage);
  g.col = [];
  let facet = 0;
  for (let i = 0; i < g.count; i++) {
    if (i % 3 === 0) {
      const e1 = sub([g.x(i + 1), g.y(i + 1), g.z(i + 1)], [g.x(i), g.y(i), g.z(i)]), e2 = sub([g.x(i + 2), g.y(i + 2), g.z(i + 2)], [g.x(i), g.y(i), g.z(i)]);
      const ny = unit([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]])[1];
      facet = 0.3 * (ny - 0.55) + 0.06 * Math.sin(i * 12.9898 + tone * 78.233);
    }
    const h = clamp(g.y(i) / H), r = Math.hypot(g.x(i), g.z(i)), out = clamp(r / (crownRadius(clamp((g.y(i) - 1.2) / 8.2)) + 0.2));
    const lit = clamp(-0.08 + 0.3 * h + 1.0 * light[i]! + facet + 0.4 * out * out + tone);
    const rgb = lit < 0.55 ? mix(LEAF[0], LEAF[1], lit / 0.55) : mix(LEAF[1], LEAF[2], (lit - 0.55) / 0.45);
    const cast: P3 = [1 + tone * 0.9, 1 + tone * 0.3, 1 - tone * 1.2];
    g.col.push(...rgb.map((v, c) => linear(Math.min(1, v * cast[c]!)) / linear(base[c]!)));
  }
}
// Bark lit on one flank and toward the top.
function paintWood(g: Geo): void {
  const base = rgbOf(SPRUCE_COLORS.trunk);
  g.col = [];
  for (let i = 0; i < g.count; i += 3) {
    const e1 = sub([g.x(i + 1), g.y(i + 1), g.z(i + 1)], [g.x(i), g.y(i), g.z(i)]), e2 = sub([g.x(i + 2), g.y(i + 2), g.z(i + 2)], [g.x(i), g.y(i), g.z(i)]);
    const n = unit([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]);
    for (let c = 0; c < 3; c++) {
      const rgb = mix(BARK[0], BARK[1], clamp(0.32 + 0.2 * clamp(g.y(i + c) / H) + 0.25 * n[0] + 0.12 * n[2]));
      g.col.push(...rgb.map((v, ch) => linear(v) / linear(base[ch]!)));
    }
  }
}

// The allowances: the shipped high budget and the Max ceiling.
const BUDGET = { high: 2970, max: 10000 };
const padSides = (p: Pad, max: boolean) => max ? (p.rank === 0 ? 8 : 6) : p.rank === 0 ? 5 : 4;
const padFaces = (p: Pad, max: boolean) => padSides(p, max) * (max && p.rank === 0 ? 8 : 6);
const limbFaces = (stations: number, sides: number) => 2 * sides * (stations - 1) + 2 * (sides - 2);
// What a level draws: every bough's wood at Max, the lower whorls' at high; the
// pads of its ranks. Should a seed's layout run over the level's allowance, the
// highest optional pads (branchlets at high, Max's extras) are left out first,
// so the budget holds for every seed without moving anything.
function select(plan: Layout, max: boolean): { boughs: Bough[]; pads: Pad[] } {
  const boughs = plan.boughs.filter((b) => max || b.woodHigh);
  const pads = plan.pads.filter((p) => max || p.rank < 2);
  const stemFaces = limbFaces(plan.stem.length, max ? 10 : 7);
  let faces = stemFaces + 10 + boughs.reduce((n, b) => n + limbFaces(b.wood.length, max ? 5 : 3), 0) + pads.reduce((n, p) => n + padFaces(p, max), 0);
  // Spread the cut evenly over the crown (a fixed scramble of the pads' own seeds).
  const order = (p: Pad) => (p.seed * 2654435761 >>> 0) % 1009;
  const optional = pads.filter((p) => p.rank === (max ? 2 : 1)).sort((a, b) => order(a) - order(b) || b.at[1] - a.at[1]);
  const drop = new Set<Pad>();
  for (const p of optional) {
    if (faces <= (max ? BUDGET.max : BUDGET.high))
      break;
    drop.add(p);
    faces -= padFaces(p, max);
  }
  return { boughs, pads: pads.filter((p) => !drop.has(p)) };
}

function raw(detail: "max" | "high" | "low", o: BroadleafOptions): Parts {
  const plan = layout(o), max = detail === "max", high = detail !== "low";
  const trunk: Geo[] = [], foliage: Geo[] = [];
  const stem = high ? plan.stem : [plan.stem[0]!, { ...plan.stem[plan.stem.length - 1]!, r: 0.08 }];
  trunk.push(limb(stem, max ? 10 : high ? 7 : 4));
  if (high) {
    const drawn = select(plan, max);
    for (const b of drawn.boughs)
      trunk.push(limb(b.wood, max ? 5 : 3, b.t * 3));
    for (const p of drawn.pads) {
      const { geo, light } = padVolume(p, padSides(p, max), max && p.rank === 0);
      paint(geo, light, p.tone);
      foliage.push(geo);
    }
    const top = plan.stem[plan.stem.length - 1]!.at;
    const leader = spire(add(top, up(-0.5)), H - top[1] + 0.5, 0.2);
    paint(leader, Array.from({ length: leader.count }, () => 0.25), 0.04);
    foliage.push(leader);
  } else {
    // Four tier cones: each rim follows the reach of its tier's boughs on eight
    // bearings and hangs to their pads' lowest rim; the apex reaches into the tier above.
    const tiers = [0, 1, 2, 3].map((tier) => plan.boughs.filter((b) => b.tier === tier));
    tiers.forEach((list, j) => {
      const lowY = Math.min(...list.map((b) => b.base[1] - 0.15 - 0.22 * b.reach));
      const above = tiers[j + 1];
      const apex = above ? Math.max(...above.map((b) => b.base[1])) - 0.2 : H - 0.4;
      const centre = mix(plan.stem[0]!.at, plan.stem[plan.stem.length - 1]!.at, lowY / H);
      const pts: P3[] = [[centre[0], apex, centre[2]], [centre[0], lowY + 0.35 * (apex - lowY) * 0.3, centre[2]]];
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + j * 0.4, dir = bearing(a);
        let r = 0;
        for (const b of list) r = Math.max(r, (b.reach * 1.05 + 0.2) * clamp(Math.cos(Math.atan2(dir[2], dir[0]) - Math.atan2(b.dir[2], b.dir[0])) * 1.6 - 0.3));
        r = Math.max(r, 0.55 * Math.max(...list.map((b) => b.reach)));
        pts.push(add([centre[0], lowY + (i % 2 ? 0.25 : 0), centre[2]], mul(dir, r * (i % 2 ? 0.88 : 1))));
      }
      const idx: number[] = [], light: number[] = [];
      for (let i = 0; i < 8; i++) {
        idx.push(0, 2 + (i + 1) % 8, 2 + i, 1, 2 + i, 2 + (i + 1) % 8);
        light.push(0.5, 0.22, 0.22, -0.4, -0.15, -0.15);
      }
      const cone = fromIndexed(pts, idx);
      paint(cone, light, 0);
      foliage.push(cone);
    });
  }
  trunk.forEach(paintWood);
  for (const g of [...trunk, ...foliage])
    g.scale(o.width, o.height, o.width);
  return { trunk, foliage };
}

/** The spruce at one level: low and Max fitted to the high tree's exact bounds, coarse to low's. */
export function spruceParts(detail: Detail, options: Partial<BroadleafOptions> = {}): Parts {
  const o = { ...DEFAULT, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error("Invalid spruce options");
  const high = raw("high", o);
  if (detail === "high")
    return high;
  if (detail === "max")
    return fit(raw("max", o), high);
  const low = fit(raw("low", o), high);
  if (detail === "low")
    return low;
  // A square pyramid over the low foliage's box (six faces) and a tetrahedral trunk.
  const f = boxOf(low.foliage), c: P3 = [(f.max[0] + f.min[0]) / 2, 0, (f.max[2] + f.min[2]) / 2];
  const crown = fromIndexed([[0, 1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]], [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 1, 2, 3, 1, 3, 4]);
  crown.scale((f.max[0] - f.min[0]) / 2, f.max[1] - f.min[1], (f.max[2] - f.min[2]) / 2).translate(c[0], f.min[1], c[2]);
  const wood = tetraBranch([0, 0, 0], [c[0], f.min[1] + (f.max[1] - f.min[1]) * 0.3, c[2]], 0.3, true);
  const coarse = fit({ trunk: [wood], foliage: [crown] }, low);
  paintWood(wood);
  paint(crown, Array.from({ length: crown.count }, (_, i) => i < 12 ? (i % 3 === 0 ? 0.5 : 0.2) : -0.3), 0);
  return coarse;
}
