// Reference-led oak: connected tapered boughs, closed foliage cores and folded
// double-sided leaf shapes. No textures, transparency, random global state or Node APIs.
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { Geo, boxOf, fromIndexed, icosahedronGeo, quatFromUnitVectors, type P3 } from "./treeGeo.ts";
export const OAK_COLORS = { trunk: "#ac804a", foliage: "#c4d953" };
export const OAK_PARAMS: ParamSpec[] = [
  { name: "seed", title: "Tree seed", default: "1",
    values: ["1", "2", "3", "4", "5"].map((value) => ({ value, title: value })),
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
type Parts = {
  trunk: Geo[];
  foliage: Geo[];
  ribbons?: boolean;
};
type Station = {
  at: P3;
  r: number;
};
const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: P3, k: number): P3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: P3): P3 => mul(a, 1 / Math.max(1e-9, Math.hypot(...a)));
const mix = (a: P3, b: P3, t: number): P3 => add(mul(a, 1 - t), mul(b, t));
const clamp = (x: number) => Math.min(1, Math.max(0, x));
function random(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
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
// Closed crown volume for the low-detail model: a pentagonal bipyramid, ten faces.
function leafVolume(rx: number, ry: number, rz: number): Geo {
  const points: P3[] = [[0, ry, 0], [0, -ry * 0.7, 0]], indices: number[] = [];
  for (let k = 0; k < 5; k++) {
    const a = k * Math.PI * 2 / 5;
    points.push([Math.cos(a) * rx, 0, Math.sin(a) * rz]);
  }
  for (let k = 0; k < 5; k++) {
    const a = 2 + k, b = 2 + (k + 1) % 5;
    indices.push(0, b, a, 1, a, b);
  }
  return fromIndexed(points, indices);
}
const linear = (x: number) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
const leafBase: P3 = [196 / 255, 217 / 255, 83 / 255];
const barkBase: P3 = [172 / 255, 128 / 255, 74 / 255];
const LEAF_DARK: P3 = [0.08, 0.23, 0.05], LEAF_MID: P3 = [0.29, 0.55, 0.1], LEAF_LIGHT: P3 = [0.7, 0.86, 0.25];
// Per-corner colours. Foliage light comes from height, from the direction the
// leaves face (`facing`, the outward direction of their rosette) and from how far
// they stand out of the crown (`exposure`), with the face normal adding facets.
function shade(g: Geo, foliage: boolean, tone: number, top: number, facing?: P3, exposure = 0): void {
  g.col = [];
  const base = foliage ? leafBase : barkBase;
  for (let i = 0; i < g.count; i += 3) {
    const a: P3 = [g.x(i), g.y(i), g.z(i)], b: P3 = [g.x(i + 1), g.y(i + 1), g.z(i + 1)], c: P3 = [g.x(i + 2), g.y(i + 2), g.z(i + 2)];
    const n = unit(cross(sub(b, a), sub(c, a)));
    for (let k = 0; k < 3; k++) {
      const h = clamp(g.y(i + k) / top);
      let rgb: P3;
      if (foliage) {
        const up = facing ? 0.75 * facing[1] + 0.25 * n[1] : n[1];
        const light = clamp(0.06 + 0.5 * h + 0.3 * up + 0.05 * n[0] + 0.16 * exposure + tone + 0.12 * clamp((h - 0.7) / 0.25));
        rgb = light < 0.6 ? mix(LEAF_DARK, LEAF_MID, light / 0.6) : mix(LEAF_MID, LEAF_LIGHT, (light - 0.6) / 0.4);
      } else
        rgb = mix([0.3, 0.17, 0.08], [0.72, 0.47, 0.25], clamp(0.3 + 0.28 * h + 0.22 * n[0] + 0.1 * n[2] + 0.12 * n[1] + tone));
      g.col.push(...rgb.map((v, j) => linear(v) / linear(base[j]!)));
    }
  }
}
type Clump = {
  at: P3;
  r: number;
  // Horizontal direction away from the crown's axis, and a per-clump tone.
  out: P3;
  tone: number;
};
type Layout = {
  stem: Station[];
  limbs: Station[][];
  twigs: Station[][];
  clumps: Clump[];
};
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
  return { stem, limbs, twigs, clumps };
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
function rawOak(detail: "max" | "high" | "low", o: OakOptions): Parts {
  const high = detail !== "low", max = detail === "max", plan = layout(o);
  const top = 9.4;
  const sides = (hi: number, mx: number, lo: number) => max ? mx : high ? hi : lo;
  const stations = (s: Station[]) => high ? s : [s[0]!, s[s.length - 1]!];
  const trunk = [limb(high ? plan.stem : [plan.stem[0]!, plan.stem[2]!, plan.stem[4]!], sides(8, 14, 4))];
  plan.limbs.forEach((s, i) => trunk.push(limb(stations(s), i < 3 ? sides(6, 10, 3) : sides(5, 8, 3), i * 0.4)));
  if (high)
    plan.twigs.forEach((s) => trunk.push(limb(max ? s : [s[0]!, s[2]!], max ? 5 : 3)));
  // Root buttresses: a ridge from the trunk down to a tip on the ground, open
  // underneath (never seen) so nothing lies in the ground plane.
  if (high) {
    const roots = max ? 6 : 5, phase = o.seed % 7;
    for (let i = 0; i < roots; i++) {
      const a = (i + 0.2 * Math.sin(i * 2.7 + phase)) * Math.PI * 2 / roots + phase;
      const at = (r: number, y: number, da = 0): P3 => [Math.cos(a + da) * r, y, Math.sin(a + da) * r];
      const reach = 1.05 + 0.15 * Math.sin(i * 1.9 + phase);
      const T = at(0.3, 1.1), P = at(reach, 0), L = at(0.5, 0, 0.42), R = at(0.5, 0, -0.42);
      trunk.push(max
        ? fromIndexed([T, at(0.72, 0.42), P, L, R], [0, 1, 3, 1, 2, 3, 0, 4, 1, 1, 4, 2])
        : fromIndexed([T, P, L, R], [0, 1, 2, 0, 3, 1]));
    }
  }
  const foliage: Geo[] = [];
  const airy = o.density < 0.9;
  plan.clumps.forEach((c, p) => {
    const rng = random(o.seed * 7919 + p * 131 + 17);
    const exposure = Math.hypot(c.out[0], c.out[2]) > 0 ? 0.5 : 0.8;
    if (!high) {
      const core = leafVolume(c.r * 1.2, c.r * 0.85, c.r * 1.15).rotateY(p * 2.4).translate(...c.at);
      shade(core, true, c.tone, top, [0, 0.3, 0], exposure);
      foliage.push(core);
      return;
    }
    // Two bulges make each clump lumpy, like the reference's leaf masses.
    const lobes: P3[] = [0, 1].map((k) => {
      const a = rng() * Math.PI * 2 + k * 2.5;
      return unit(add(mul(c.out, 0.6), [Math.cos(a), 0.5 + rng() * 0.6, Math.sin(a)]));
    });
    const bump = (d: P3) => 1 + lobes.reduce((s, l) => s + 0.22 * Math.max(0, d[0] * l[0] + d[1] * l[1] + d[2] * l[2]) ** 3, 0);
    // Dark cores close the clump so no sky shows through the leaves.
    const cores = max ? [{ at: c.at, r: c.r * 0.76 }, ...lobes.map((l) => ({ at: add(c.at, mul(l, c.r * 0.42)), r: c.r * 0.5 }))]
      : [{ at: c.at, r: c.r * 0.72 }];
    cores.forEach((k, j) => {
      const core = icosahedronGeo(k.r, 0).scale(1, 0.86, 1).rotateY(rng() * Math.PI).rotateX((rng() - 0.5) * 0.4).translate(...k.at);
      shade(core, true, c.tone - 0.2 - (j === 0 ? 0.04 : 0), top);
      foliage.push(core);
    });
    // Rosettes of pointed leaves spread over the clump, facing outwards.
    const rosettes = max ? (airy ? 23 : 30) : (airy ? 9 : 12);
    const leaves = max ? 5 : 4;
    const length = c.r * (max ? 0.44 : 0.64), spin = rng() * Math.PI * 2;
    for (let k = 0; k < rosettes; k++) {
      const y = 1 - 2 * (k + 0.5) / rosettes;
      const ring = Math.sqrt(1 - y * y), az = k * Math.PI * (3 - Math.sqrt(5)) + spin;
      // Lift the distribution: more rosettes on the lit top than underneath.
      const d = unit([ring * Math.cos(az), y * 0.85 + 0.15, ring * Math.sin(az)]);
      const centre = add(c.at, [d[0] * c.r * bump(d) * 0.66, d[1] * c.r * bump(d) * 0.6, d[2] * c.r * bump(d) * 0.66]);
      const facing = unit(add(d, [0, 0.25, 0]));
      const q = quatFromUnitVectors([0, 1, 0], facing);
      const twist = rng() * Math.PI * 2, size = 0.85 + rng() * 0.3;
      const outwards = clamp(0.5 + 0.5 * (d[0] * c.out[0] + d[2] * c.out[2]));
      const tone = c.tone + (rng() - 0.4) * 0.1;
      for (let j = 0; j < leaves; j++) {
        // Tufts, not flat stars: each leaf rises 35-60 degrees out of the surface.
        const leaf = leafBlade(length * size * (j % 2 ? 0.85 : 1), length * size * 0.6, max)
          .translate(0, 0, length * 0.06).rotateX(-0.6 - rng() * 0.45).rotateY(twist + j * Math.PI * 2 / leaves + (rng() - 0.5) * 0.3)
          .applyQuaternion(q).translate(...centre);
        shade(leaf, true, tone, top, facing, exposure * outwards);
        foliage.push(leaf);
      }
    }
  });
  for (const g of trunk)
    shade(g, false, 0, top);
  for (const g of [...trunk, ...foliage])
    g.scale(o.width, o.height, o.width);
  return { trunk, foliage, ...(high ? { ribbons: true } : {}) };
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
export function oakParts(detail: "max" | "high" | "low" | "coarse", options: Partial<OakOptions> = {}): Parts {
  const o = { ...DEFAULT_OAK, ...options };
  if (!Number.isFinite(o.seed) || ![o.width, o.height, o.spread, o.density].every((v) => Number.isFinite(v) && v > 0))
    throw new Error("Invalid oak options");
  const high = rawOak("high", o);
  if (detail === "high")
    return high;
  if (detail === "max")
    return fit(rawOak("max", o), high);
  const low = fit(rawOak("low", o), high);
  if (detail === "low")
    return low;
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
  const crown = fromIndexed(points, indices);
  crown.scale(3.5, 2.7, 3.5).translate(0, 5.6, 0);
  const wood = fromIndexed([[0, 0, 0.6], [-0.52, 0, -0.3], [0.52, 0, -0.3], [0, 5, 0]], [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]);
  const coarse = fit({ trunk: [wood], foliage: [crown] }, low);
  shade(wood, false, 0, boxOf(coarse.foliage).max[1]);
  shade(crown, true, 0, boxOf(coarse.foliage).max[1]);
  return coarse;
}
