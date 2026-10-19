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
// Eight-face closed crown volume for the low-detail model.
function leafVolume(rx: number, ry: number, rz: number, skew: number): Geo {
  return fromIndexed([[0, ry, 0], [0, -ry * 0.65, 0], [-rx, 0, 0], [skew, 0, rz], [rx, 0, 0], [-skew, 0, -rz]], [0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 2, 1, 3, 2, 1, 4, 3, 1, 5, 4, 1, 2, 5]);
}
const linear = (x: number) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
const leafBase: P3 = [196 / 255, 217 / 255, 83 / 255];
const barkBase: P3 = [172 / 255, 128 / 255, 74 / 255];
function shade(g: Geo, foliage: boolean, tone: number, top: number): void {
  g.col = [];
  const base = foliage ? leafBase : barkBase;
  for (let i = 0; i < g.count; i += 3) {
    const a: P3 = [g.x(i), g.y(i), g.z(i)], b: P3 = [g.x(i + 1), g.y(i + 1), g.z(i + 1)], c: P3 = [g.x(i + 2), g.y(i + 2), g.z(i + 2)];
    const n = unit(cross(sub(b, a), sub(c, a)));
    for (let k = 0; k < 3; k++) {
      const h = clamp(g.y(i + k) / top);
      const light = clamp(0.12 + 0.42 * h + 0.3 * n[1] + 0.07 * n[0] + tone + 0.15 * clamp((h - 0.65) / 0.3));
      const rgb = foliage ? (light < 0.72
        ? mix([0.10, 0.26, 0.035], [0.32, 0.53, 0.08], light / 0.72)
        : mix([0.32, 0.53, 0.08], [0.72, 0.83, 0.21], (light - 0.72) / 0.28))
        : mix([0.31, 0.18, 0.075], [0.65, 0.44, 0.22], clamp(0.28 + 0.35 * h + 0.16 * n[0] + tone));
      g.col.push(...rgb.map((v, j) => linear(v) / linear(base[j]!)));
    }
  }
}
// Seven deliberately staggered boughs plus the leader. Rotated in depth, not a
// flat silhouette: their two terminal pads each carry three small foliage clusters.
const BOUGHS: {
  y: number;
  angle: number;
  reach: number;
  rise: number;
}[] = [
  { y: 2.45, angle: 0.12, reach: 2.9, rise: 1.0 },
  { y: 3.0, angle: 3.05, reach: 2.6, rise: 1.25 },
  { y: 3.55, angle: 1.8, reach: 2.25, rise: 1.5 },
  { y: 4.1, angle: 3.6, reach: 2.65, rise: 1.55 },
  { y: 4.65, angle: -0.35, reach: 2.25, rise: 1.25 },
  { y: 5.2, angle: 2.4, reach: 1.85, rise: 1.45 },
  { y: 5.85, angle: 0.8, reach: 1.45, rise: 1.25 },
];
function rawOak(detail: "max" | "high" | "low", o: OakOptions): Parts {
  const rng = random(o.seed), high = detail !== "low", max = detail === "max";
  const stem: Station[] = [
    { at: [0, 0, 0], r: 0.7 }, { at: [0.12, 0.65, 0.02], r: 0.43 }, { at: [-0.08, 2.3, 0.03], r: 0.36 },
    { at: [0.2, 3.9, -0.03], r: 0.28 }, { at: [0.35, 5.55, -0.12], r: 0.19 }, { at: [0.03, 8.0, -0.18], r: 0.045 },
  ];
  const stemAt = (y: number): P3 => {
    const i = stem.findIndex((s) => s.at[1] >= y);
    if (i <= 0)
      return stem[0]!.at;
    const a = stem[i - 1]!.at, b = stem[i]!.at;
    return mix(a, b, (y - a[1]) / (b[1] - a[1]));
  };
  const trunk = [limb(high ? stem : [stem[0]!, stem[2]!, stem[4]!, stem[5]!], max ? 12 : high ? 8 : 4)];
  // Grounded buttresses taper into the existing stem, with no flat overlays.
  if (high)
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.3;
      const root = fromIndexed([[0, 0.8, 0], [Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95],
        [Math.cos(a + 0.35) * 0.48, 0, Math.sin(a + 0.35) * 0.48], [Math.cos(a - 0.35) * 0.48, 0, Math.sin(a - 0.35) * 0.48]], [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]);
      trunk.push(root);
    }
  const pads: {
    at: P3;
    r: number;
  }[] = [];
  BOUGHS.forEach((b, i) => {
    const angle = b.angle + (rng() - 0.5) * 0.25, reach = b.reach * o.spread * (0.94 + rng() * 0.12);
    const base = stemAt(b.y), dir: P3 = [Math.cos(angle), 0, Math.sin(angle)];
    const elbow = add(base, add(mul(dir, reach * 0.48), [0, b.rise * 0.35, 0]));
    const tip = add(base, add(mul(dir, reach), [0, b.rise + (1 - o.spread) * 0.7, 0]));
    const stations = [{ at: base, r: 0.24 - i * 0.018 }, { at: elbow, r: 0.13 - i * 0.008 }, { at: tip, r: 0.035 }];
    trunk.push(limb(high ? stations : [stations[0]!, stations[2]!], max ? 7 : high ? 5 : 3, i * 0.3));
    for (let j = 0; j < 2; j++) {
      const start = mix(elbow, tip, j === 0 ? 0.4 : 0.85);
      const turn = angle + (j === 0 ? 0.85 : -0.55);
      const end = add(start, [Math.cos(turn) * 0.64, 0.35 + (i % 2) * 0.08, Math.sin(turn) * 0.64]);
      if (high)
        trunk.push(limb([{ at: start, r: 0.065 }, { at: end, r: 0.018 }], max ? 4 : 3));
      pads.push({ at: end, r: 0.72 + 0.1 * rng() });
    }
  });
  pads.push({ at: [0.03, 8.15, -0.18], r: 0.75 }, { at: [-0.65, 7.3, -0.05], r: 0.7 });
  const foliage: Geo[] = [];
  for (let p = 0; p < pads.length; p++) {
    const { at, r } = pads[p]!;
    // Consume the same random numbers at both levels and density settings.
    for (let j = 0; j < 3; j++) {
      const a = j * Math.PI * 2 / 3 + p * 2.4 + (rng() - 0.5) * 0.45;
      const radius = r * (0.84 + rng() * 0.18), offset = r * (j === 2 ? 0.24 : 0.62);
      const center = add(at, [Math.cos(a) * offset, (j === 2 ? 0.4 : -0.1) + (rng() - 0.5) * 0.25, Math.sin(a) * offset]);
      const spin = rng() * Math.PI, tone = (rng() - 0.5) * 0.13;
      if (!high)
        continue;
      if (o.density < 0.9 && j === 2 && p % 2 === 0)
        continue;
      const corePoints: P3[] = [[0, radius * 0.7, 0], [0, -radius * 0.65, 0]], coreIndices: number[] = [];
      for (let k = 0; k < 6; k++) {
        const angle = k * Math.PI / 3;
        corePoints.push([Math.cos(angle) * radius * 0.85, 0, Math.sin(angle) * radius * 0.85]);
      }
      for (let k = 0; k < 6; k++) {
        const a = 2 + k, b = 2 + (k + 1) % 6;
        coreIndices.push(0, b, a, 1, a, b);
      }
      const core = (max ? icosahedronGeo(radius * 0.83, 0).scale(1, 0.9, 1)
        : fromIndexed(corePoints, coreIndices)).rotateY(spin).translate(...center);
      shade(core, true, tone - 0.15, 8.8);
      foliage.push(core);
      if (max) {
        const leafRng = random(o.seed * 7919 + p * 131 + j * 977);
        for (let k = 0; k < 17; k++) {
          const y = 1 - 2 * (k + 0.5) / 17;
          const azimuth = k * Math.PI * (3 - Math.sqrt(5)) + spin;
          const ring = Math.sqrt(1 - y * y);
          const dir: P3 = [ring * Math.cos(azimuth), y, ring * Math.sin(azimuth)];
          const size = radius * (0.45 + 0.12 * leafRng());
          const outline: P3[] = [[0, 0, 1], [0.36, 0, 0.7], [0.23, 0, 0.43],
            [0.52, 0, 0.1], [0.34, 0, -0.4], [0, 0, -0.85],
            [-0.34, 0, -0.4], [-0.52, 0, 0.1], [-0.23, 0, 0.43], [-0.36, 0, 0.7]];
          const indices: number[] = [];
          for (let i = 0; i < 10; i++) indices.push(0, i + 1, (i + 1) % 10 + 1);
          const leaf = fromIndexed([[0, 0.1, 0], ...outline], indices)
            .scale(size, size, size).rotateY(leafRng() * Math.PI * 2)
            .applyQuaternion(quatFromUnitVectors([0, 1, 0], unit(add(dir, [0, 0.35, 0]))))
            .translate(center[0] + dir[0] * radius * 0.9,
              center[1] + dir[1] * radius * 0.75, center[2] + dir[2] * radius * 0.9);
          shade(leaf, true, tone + (leafRng() - 0.3) * 0.14, 8.8);
          foliage.push(leaf);
        }
        continue;
      }
      const leafCount = 5;
      for (let k = 0; k < leafCount; k++) {
        const spinLeaf = a + k * Math.PI * 2 / leafCount + 0.3;
        // Broad six-sided blades, triangulated in four faces. Unequal shoulders
        // and a small fold make a leaf silhouette, not a rectangular card.
        const leaf = fromIndexed([[0, 0, radius * 0.8],
          [radius * 0.52, radius * 0.06, radius * 0.24], [radius * 0.4, 0, -radius * 0.4],
          [0, 0, -radius * 0.64], [-radius * 0.4, 0, -radius * 0.4], [-radius * 0.52, 0, radius * 0.24]], [0, 1, 5, 1, 4, 5, 1, 2, 4, 2, 3, 4])
          .rotateX(0.35 + 0.55 * Math.sin(spinLeaf)).rotateZ(0.4 * Math.cos(a + k)).rotateY(spinLeaf)
          .translate(center[0] + Math.cos(spinLeaf) * radius * 0.64, center[1] + radius * (k % 2 === 0 ? 0.55 : -0.1), center[2] + Math.sin(spinLeaf) * radius * 0.64);
        shade(leaf, true, tone + 0.06, 8.8);
        foliage.push(leaf);
      }
    }
    if (!high) {
      const core = leafVolume(r * 1.35, r * 1.0, r * 1.3, 0.1).rotateY(p * 2.4).translate(...at);
      shade(core, true, 0, 8.2);
      foliage.push(core);
    }
  }
  for (const g of trunk)
    shade(g, false, 0, 8.2);
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
