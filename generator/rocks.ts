// The rock species (docs/models/rocks.md): granite boulders, sandstone towers,
// limestone pinnacles and crags. Each is a design, proc-rock-<species>, with five
// shapes (its `seed` parameter) and the trees' four levels -- `high` (the design),
// `low` (buildLod), `coarse` (buildCoarse, a closed solid of at most 20 triangles)
// and `max` (buildMax, a close-up) -- so the game's forest can plant a boulder like
// a tree and draw a stored tower with the same code.
//
// Like a tree, a rock is two materials, base-anchored at y = 0 in studs: `trunk`,
// the stone, and `foliage`, the faces that look up (moss, lichen and the soil and
// needles that gather on a ledge). The names are the forest's (the game merges the
// two meshes by name); both draw with the species' photo surface (surfaces.ts
// rock-*), so both carry UVs and the merge keeps one vertex layout. Corners carry a
// baked colour: damp and dark at the foot and in the bedding grooves, lighter up
// the face.
//
// A rock is a deformed lathe (towers, pinnacles, crags) or a deformed icosphere
// (boulders), sampled from ONE analytic shape per species and seed, so every level
// is the same rock at a different resolution; each level is then fitted onto the
// high level's box. Like every model the rock stands on y = 0 -- but its foot is a
// skirt the game sinks under the ground (rockInfo's `sink`: BURY studs for a lathe
// rock, BOULDER_SINK of a boulder's height), so a rock on a slope never shows its
// underside.
//
// rockInfo() measures what the game needs of a rock beyond its triangles: its
// height, its footprint radius (what it blocks, and where no tree may stand) and
// its top spots (where a tree may stand ON it). No `node:` imports: bundled into the
// woods module and the rocks' JS models.

import { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { surfaceMaterial, type SurfaceId } from "./surfaces.ts";
import { Geo } from "./treeGeo.ts";

/** Every rock species, by its stable key (saved in the game's maps: never rename one). */
export const ROCK_SPECIES = ["granite-boulder", "sandstone-tower", "limestone-pinnacle", "crag"] as const;
export type RockSpecies = (typeof ROCK_SPECIES)[number];

export type RockLevel = "coarse" | "low" | "high" | "max";

/** How far a lathe rock's skirt runs under the ground, in studs. */
export const BURY = 1;
/**
 * The share of a boulder's full height that is buried: the woods plant a boulder
 * with a slot `height` (its full height) and sink it by this much of it, so a
 * planter needs no table to set its `lift`.
 */
export const BOULDER_SINK = 0.25;
/**
 * A triangle whose normal's y is at least this is a top face (the `foliage`
 * material): a ledge or a tower's crown. A boulder keeps moss to its very crown.
 */
const TOP_NY = 0.74;
const TOP_NY_OF: Partial<Record<RockSpecies, number>> = { "granite-boulder": 0.9 };
/** How many shapes every species has (the `seed` parameter, "1".."5"). */
export const ROCK_SEEDS = 5;

/** The shape parameter every rock design has. */
export const ROCK_SEED: ParamSpec = {
  name: "seed", title: "Rock shape", default: "1", values: /* @__PURE__ */ ["1", "2", "3", "4", "5"].map((value) => ({ value, title: value })),
};
const ROCK_PARAMS: ParamSpec[] = [ROCK_SEED];

/** Display titles for the catalog. */
const TITLES: Record<RockSpecies, string> = {
  "granite-boulder": "Granite boulder",
  "sandstone-tower": "Sandstone tower",
  "limestone-pinnacle": "Limestone pinnacle",
  crag: "Crag",
};

/** Each species' photo surface and its two colours (sRGB; the surface lifts them half way to white). */
const LOOK: Record<RockSpecies, { surface: SurfaceId; rock: string; top: string }> = {
  "granite-boulder": { surface: "rock-granite", rock: "#9d978d", top: "#7e8462" },
  "sandstone-tower": { surface: "rock-sandstone", rock: "#c2ab88", top: "#76804f" },
  "limestone-pinnacle": { surface: "rock-limestone", rock: "#c9c6bd", top: "#8b9068" },
  crag: { surface: "rock-granite", rock: "#8f8a82", top: "#6f7a4e" },
};

// ---- deterministic numbers ----------------------------------------------------

function hash(a: number, b: number, c = 0, d = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647) ^ Math.imul(d | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** A seeded stream of numbers in [0, 1). */
function stream(species: RockSpecies, seed: number): () => number {
  let i = 0;
  const salt = ROCK_SPECIES.indexOf(species) + 1;
  return () => hash(salt * 7919, seed * 104729, i++, 31);
}

/** Smooth value noise in [0, 1] over three coordinates. */
function noise3(x: number, y: number, z: number, salt: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const s = (t: number) => t * t * (3 - 2 * t);
  const ux = s(fx), uy = s(fy), uz = s(fz);
  const v = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz, salt);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return lerp(
    lerp(lerp(v(0, 0, 0), v(1, 0, 0), ux), lerp(v(0, 1, 0), v(1, 1, 0), ux), uy),
    lerp(lerp(v(0, 0, 1), v(1, 0, 1), ux), lerp(v(0, 1, 1), v(1, 1, 1), ux), uy),
    uz,
  );
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function seedOf(p?: ParamValues): number {
  const n = Number(resolveParams(ROCK_PARAMS, p).seed);
  return Number.isInteger(n) && n >= 1 && n <= ROCK_SEEDS ? n : 1;
}

// ---- triangle soup ------------------------------------------------------------

type V3 = [number, number, number];

/** A rock's triangles before they become materials: corners and a baked colour each. */
class Soup {
  pos: number[] = [];
  col: number[] = [];
  tri(a: V3, b: V3, c: V3, ca: number, cb: number, cc: number): void {
    this.pos.push(...a, ...b, ...c);
    this.col.push(ca, ca, ca, cb, cb, cb, cc, cc, cc);
  }
  get count(): number {
    return this.pos.length / 9;
  }
  bounds(): { min: V3; max: V3 } {
    const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < this.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k]!, this.pos[i + k]!);
        max[k] = Math.max(max[k]!, this.pos[i + k]!);
      }
    }
    return { min, max };
  }
  /** Fits the soup onto `box` above the ground: x and z about their centre, y up from 0 (the skirt keeps its depth). */
  fit(box: { min: V3; max: V3 }): void {
    const own = this.bounds();
    const cx = (own.min[0] + own.max[0]) / 2, cz = (own.min[2] + own.max[2]) / 2;
    const tx = (box.min[0] + box.max[0]) / 2, tz = (box.min[2] + box.max[2]) / 2;
    const sx = (box.max[0] - box.min[0]) / Math.max(1e-6, own.max[0] - own.min[0]);
    const sz = (box.max[2] - box.min[2]) / Math.max(1e-6, own.max[2] - own.min[2]);
    const sy = box.max[1] / Math.max(1e-6, own.max[1]);
    for (let i = 0; i < this.pos.length; i += 3) {
      this.pos[i] = (this.pos[i]! - cx) * sx + tx;
      const y = this.pos[i + 1]!;
      this.pos[i + 1] = y > 0 ? y * sy : y;
      this.pos[i + 2] = (this.pos[i + 2]! - cz) * sz + tz;
    }
  }
}

function normalOf(p: readonly number[], t: number): V3 {
  const ax = p[t + 3]! - p[t]!, ay = p[t + 4]! - p[t + 1]!, az = p[t + 5]! - p[t + 2]!;
  const bx = p[t + 6]! - p[t]!, by = p[t + 7]! - p[t + 1]!, bz = p[t + 8]! - p[t + 2]!;
  const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

// ---- lathe rocks --------------------------------------------------------------

/** A ring of a lathe: its height, its centre and one corner per angle (x, z, colour). */
type Ring = { y: number; cx: number; cz: number; pts: Array<[number, number]>; shade: number[] };

/**
 * Joins rings into a lathe: side quads between neighbours, wound outward from each
 * ring's centre, and a fan from `apex` over the last ring. With `closed`, the first
 * ring gets a flat bottom cap too (the coarse level's closed solid).
 */
function lathe(soup: Soup, rings: Ring[], apex: { p: V3; shade: number }, closed = false): void {
  const m = rings[0]!.pts.length;
  for (let i = 0; i + 1 < rings.length; i++) {
    const a = rings[i]!, b = rings[i + 1]!;
    for (let j = 0; j < m; j++) {
      const k = (j + 1) % m;
      const p00: V3 = [a.pts[j]![0], a.y, a.pts[j]![1]], p01: V3 = [a.pts[k]![0], a.y, a.pts[k]![1]];
      const p10: V3 = [b.pts[j]![0], b.y, b.pts[j]![1]], p11: V3 = [b.pts[k]![0], b.y, b.pts[k]![1]];
      outward(soup, p00, p01, p11, a.shade[j]!, a.shade[k]!, b.shade[k]!, (a.cx + b.cx) / 2, (a.cz + b.cz) / 2);
      outward(soup, p00, p11, p10, a.shade[j]!, b.shade[k]!, b.shade[j]!, (a.cx + b.cx) / 2, (a.cz + b.cz) / 2);
    }
  }
  const top = rings[rings.length - 1]!;
  for (let j = 0; j < m; j++) {
    const k = (j + 1) % m;
    const p0: V3 = [top.pts[j]![0], top.y, top.pts[j]![1]], p1: V3 = [top.pts[k]![0], top.y, top.pts[k]![1]];
    upward(soup, p0, p1, apex.p, top.shade[j]!, top.shade[k]!, apex.shade, 1);
  }
  if (closed) {
    const bottom = rings[0]!;
    const c: V3 = [bottom.cx, bottom.y, bottom.cz];
    for (let j = 0; j < m; j++) {
      const k = (j + 1) % m;
      upward(soup, [bottom.pts[j]![0], bottom.y, bottom.pts[j]![1]], [bottom.pts[k]![0], bottom.y, bottom.pts[k]![1]], c, 0.6, 0.6, 0.6, -1);
    }
  }
}

/** One triangle whose normal points away from the axis at (cx, cz). */
function outward(soup: Soup, a: V3, b: V3, c: V3, ca: number, cb: number, cc: number, cx: number, cz: number): void {
  const n = normalOf([...a, ...b, ...c], 0);
  const mx = (a[0] + b[0] + c[0]) / 3 - cx, mz = (a[2] + b[2] + c[2]) / 3 - cz;
  if (n[0] * mx + n[2] * mz < 0) soup.tri(a, c, b, ca, cc, cb);
  else soup.tri(a, b, c, ca, cb, cc);
}

/** One triangle whose normal points up (`sign` 1) or down (-1). */
function upward(soup: Soup, a: V3, b: V3, c: V3, ca: number, cb: number, cc: number, sign: number): void {
  const n = normalOf([...a, ...b, ...c], 0);
  if (n[1] * sign < 0) soup.tri(a, c, b, ca, cc, cb);
  else soup.tri(a, b, c, ca, cb, cc);
}

/** Resolution of a lathe level: corners a ring, and rings per layer (or over the height). */
const LATHE: Record<RockLevel, { m: number; perLayer: number }> = {
  // five corners: ten sides, a five-triangle fan on top and a five-triangle floor
  coarse: { m: 5, perLayer: 0 },
  low: { m: 8, perLayer: 0.5 },
  high: { m: 18, perLayer: 3 },
  max: { m: 36, perLayer: 6 },
};

/**
 * The shape of one lathe rock: its height, its layer thickness, the ring centre at a
 * height (the lean) and the radius toward an angle at a height. `shade` is the baked
 * colour of a corner; `heightAt` bends a corner's height (a crag's sloping top).
 */
interface LatheShape {
  height: number;
  layer: number;
  centre(y: number): [number, number];
  radius(theta: number, y: number, level: RockLevel): number;
  shade(theta: number, y: number): number;
  heightAt?(theta: number, y: number): number;
  /** The apex: how far over the top ring it rises, and its colour. */
  dome: number;
  /** The ring radius scale of the dome's rings (high and max). */
  domeRings: number[];
  /** Where on the top a tree may stand, as fractions: [radius share, null] or none. */
  topShare: number;
}

/** The heights a level puts rings at: the skirt, the ground, then per layer (high) or evenly (low). */
function ringHeights(shape: LatheShape, level: RockLevel): number[] {
  const h = shape.height;
  const ys = [-BURY, 0];
  const spec = LATHE[level];
  if (spec.perLayer >= 1) {
    const layers = Math.max(1, Math.round(h / shape.layer));
    const l = h / layers;
    // a groove at every layer boundary: a ring just under it, one in it, one just over it
    for (let k = 0; k < layers; k++) {
      const y0 = k * l;
      for (let s = 1; s <= spec.perLayer; s++) {
        const f = s / spec.perLayer;
        // bunch the rings toward the boundary, so the groove is sharp
        const y = y0 + l * (f < 1 ? 0.14 + 0.72 * f : 1);
        if (y > 0.05 && y < h - 0.05) ys.push(y);
      }
      if (k + 1 < layers) {
        ys.push(y0 + l * 0.94);
        ys.push(y0 + l);
        ys.push(y0 + l * 1.06);
      }
    }
  } else if (spec.perLayer > 0) {
    const n = Math.max(3, Math.round(h / shape.layer * spec.perLayer) + 2);
    for (let i = 1; i < n; i++) ys.push((h * i) / n);
  }
  ys.push(h);
  return [...new Set(ys.map((y) => Math.round(y * 1000) / 1000))].sort((a, b) => a - b);
}

function latheRock(shape: LatheShape, level: RockLevel): Soup {
  const soup = new Soup();
  const m = LATHE[level].m;
  const ys = level === "coarse" ? [-BURY, shape.height] : ringHeights(shape, level);
  const ring = (y: number, scale = 1, lift = 0): Ring => {
    const [cx, cz] = shape.centre(Math.max(0, y));
    const pts: Array<[number, number]> = [];
    const shade: number[] = [];
    for (let j = 0; j < m; j++) {
      const theta = (j / m) * Math.PI * 2;
      const r = shape.radius(theta, Math.max(0, y), level) * scale;
      pts.push([cx + Math.cos(theta) * r, cz + Math.sin(theta) * r]);
      shade.push(shape.shade(theta, Math.max(0, y)));
    }
    return { y: y + lift, cx, cz, pts, shade };
  };
  const rings = ys.map((y) => ring(y));
  if (level === "high" || level === "max") {
    for (const s of shape.domeRings) rings.push(ring(shape.height, s, shape.dome * (1 - s * s)));
  }
  const top = rings[rings.length - 1]!;
  const apex = { p: [top.cx, shape.height + shape.dome, top.cz] as V3, shade: shape.shade(0, shape.height) * 1.04 };
  lathe(soup, rings, apex, level === "coarse");
  if (shape.heightAt) {
    for (let i = 0; i < soup.pos.length; i += 3) {
      const x = soup.pos[i]!, y = soup.pos[i + 1]!, z = soup.pos[i + 2]!;
      if (y <= 0) continue;
      const [cx, cz] = shape.centre(y);
      soup.pos[i + 1] = shape.heightAt(Math.atan2(z - cz, x - cx), y);
    }
  }
  return soup;
}

/** A radius stretched into an ellipse of `aspect`, its long axis toward `angle`. */
function ellipse(theta: number, aspect: number, angle: number): number {
  const a = theta - angle;
  const c = Math.cos(a), s = Math.sin(a);
  return 1 / Math.sqrt((c * c) / (aspect * aspect) + s * s);
}

/** Angular distance, 0..pi. */
function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/** The baked damp foot: dark at the ground, full light a few studs up. */
const foot = (y: number): number => 0.7 + 0.3 * smoothstep(0, 3.5, y);

function sandstoneShape(seed: number): LatheShape {
  const rnd = stream("sandstone-tower", seed);
  const height = 16 + rnd() * 14;
  const r0 = 3.2 + rnd() * 2.4;
  const aspect = 1 + rnd() * 0.45;
  const angle = rnd() * Math.PI;
  const taper = 0.08 + rnd() * 0.18;
  const waist = 0.06 + rnd() * 0.14;
  const waistAt = 0.35 + rnd() * 0.3;
  const cap = 0.06 + rnd() * 0.18;
  const layer = 2.6 + rnd() * 1.6;
  const leanX = (rnd() - 0.5) * 2.2, leanZ = (rnd() - 0.5) * 2.2;
  const joints = Array.from({ length: 2 + Math.floor(rnd() * 3) }, () => rnd() * Math.PI * 2);
  const salt = seed * 17 + 3;
  const groove = (y: number): number => {
    const f = y / layer;
    const d = Math.abs(f - Math.round(f));
    return y > 0.4 && y < height - 0.4 ? Math.exp(-((d / 0.05) ** 2)) : 0;
  };
  return {
    height, layer, dome: height * 0.05, domeRings: [0.72, 0.4], topShare: 0.55,
    centre: (y) => {
      const t = Math.pow(y / height, 1.5);
      return [leanX * t, leanZ * t];
    },
    radius: (theta, y, level) => {
      const t = y / height;
      let r = r0 * (1 - taper * t) * ellipse(theta, aspect, angle);
      r *= 1 - waist * Math.exp(-(((t - waistAt) / 0.16) ** 2));
      r *= 1 + cap * smoothstep(0.74, 0.9, t);
      // the rounded shoulder under the dome
      r *= 1 - 0.12 * smoothstep(0.93, 1, t);
      // each bed stands a little in or out of the one below it
      const bed = Math.floor(y / layer);
      r *= 1 + 0.07 * (noise3(Math.cos(theta) * 2.2, bed * 3.1, Math.sin(theta) * 2.2, salt) - 0.5);
      r *= 1 + 0.16 * (noise3(Math.cos(theta) * 1.4, y * 0.12, Math.sin(theta) * 1.4, salt + 1) - 0.5);
      for (const j of joints) r *= 1 - 0.2 * Math.exp(-((angleDiff(theta, j) / 0.2) ** 2));
      if (level === "high" || level === "max") r *= 1 - 0.09 * groove(y);
      return r;
    },
    shade: (theta, y) => foot(y) * (0.92 + 0.12 * noise3(Math.cos(theta) * 4, y * 0.35, Math.sin(theta) * 4, salt + 2)) * (1 - 0.25 * groove(y)),
  };
}

function pinnacleShape(seed: number): LatheShape {
  const rnd = stream("limestone-pinnacle", seed);
  const height = 12 + rnd() * 12;
  const r0 = 2.2 + rnd() * 1.4;
  const aspect = 1.3 + rnd() * 0.8;
  const angle = rnd() * Math.PI;
  const flutes = 5 + Math.floor(rnd() * 4);
  const phase = rnd() * Math.PI * 2;
  const leanX = (rnd() - 0.5) * 2, leanZ = (rnd() - 0.5) * 2;
  const salt = seed * 23 + 5;
  return {
    height, layer: 3, dome: 0.4, domeRings: [0.6, 0.3], topShare: 0,
    centre: (y) => {
      const t = Math.pow(y / height, 1.4);
      return [leanX * t, leanZ * t];
    },
    radius: (theta, y) => {
      const t = Math.min(1, y / height);
      // a column that sharpens into its needle over the top third
      let r = r0 * (Math.pow(1 - t, 0.45) * 0.88 + 0.12 * (1 - t)) * ellipse(theta, aspect, angle);
      r *= 1 - 0.3 * Math.pow(0.5 + 0.5 * Math.cos(flutes * theta + phase + y * 0.08), 2.5);
      r *= 1 + 0.22 * (noise3(Math.cos(theta) * 1.6, y * 0.18, Math.sin(theta) * 1.6, salt) - 0.5);
      // rillen and scallops: the rain's small furrows and steps
      r *= 1 + 0.12 * (noise3(Math.cos(theta) * 3.5, y * 0.7, Math.sin(theta) * 3.5, salt + 3) - 0.5);
      return Math.max(0.12, r);
    },
    shade: (theta, y) => foot(y) * (0.9 + 0.16 * Math.pow(0.5 + 0.5 * Math.cos(flutes * theta + phase), 2)) * (0.94 + 0.1 * noise3(theta * 2, y * 0.2, 0, salt + 1)),
  };
}

function cragShape(seed: number): LatheShape {
  const rnd = stream("crag", seed);
  const height = 6 + rnd() * 6;
  const r0 = 3.4 + rnd() * 1.8;
  const aspect = 1.6 + rnd() * 0.7;
  const angle = rnd() * Math.PI;
  // the steep face looks across the long axis
  const front = angle + Math.PI / 2 + (rnd() < 0.5 ? 0 : Math.PI);
  const layer = 1.5 + rnd() * 0.8;
  const slope = 0.25 + rnd() * 0.25;
  const salt = seed * 29 + 7;
  const back = (theta: number): number => 0.5 - 0.5 * Math.cos(theta - front);
  return {
    height, layer, dome: 0.3, domeRings: [0.75, 0.45], topShare: 0.45,
    centre: () => [0, 0],
    radius: (theta, y, level) => {
      const t = y / height;
      let r = r0 * ellipse(theta, aspect, angle);
      r *= 1 - t * (0.12 + 0.6 * back(theta));
      // every bed recedes toward its top and the next steps out again: ledges
      const f = y / layer - Math.floor(y / layer);
      if (level === "high" || level === "max") r *= 1 - 0.1 * f;
      // blocky: each bed's corners stand out or in on their own
      const bed = Math.floor(y / layer);
      const seg = Math.floor((theta / (Math.PI * 2)) * 9);
      r *= 1 + 0.12 * (hash(seg, bed, salt, 1) - 0.5);
      r *= 1 + 0.14 * (noise3(Math.cos(theta) * 1.8, y * 0.25, Math.sin(theta) * 1.8, salt) - 0.5);
      return r;
    },
    heightAt: (theta, y) => y * (1 - slope * back(theta) * (y / height)),
    shade: (theta, y) => foot(y) * (0.88 + 0.16 * noise3(Math.cos(theta) * 3, y * 0.5, Math.sin(theta) * 3, salt + 2)),
  };
}

const LATHE_SHAPES = {
  "sandstone-tower": sandstoneShape,
  "limestone-pinnacle": pinnacleShape,
  crag: cragShape,
} as const;

// ---- boulders -----------------------------------------------------------------

/** An icosphere (unit radius) subdivided `n` times, as corner triples. */
function icosphere(n: number): V3[] {
  const t = (1 + Math.sqrt(5)) / 2;
  const v: V3[] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const unit = (p: V3): V3 => {
    const l = Math.hypot(p[0], p[1], p[2]);
    return [p[0] / l, p[1] / l, p[2] / l];
  };
  let tris: V3[] = f.flatMap(([a, b, c]) => [unit(v[a!]!), unit(v[b!]!), unit(v[c!]!)]);
  for (let s = 0; s < n; s++) {
    const next: V3[] = [];
    for (let i = 0; i < tris.length; i += 3) {
      const a = tris[i]!, b = tris[i + 1]!, c = tris[i + 2]!;
      const ab = unit([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      const bc = unit([(b[0] + c[0]) / 2, (b[1] + c[1]) / 2, (b[2] + c[2]) / 2]);
      const ca = unit([(c[0] + a[0]) / 2, (c[1] + a[1]) / 2, (c[2] + a[2]) / 2]);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    tris = next;
  }
  return tris;
}

/** The octahedron the coarse boulder is: 8 triangles, closed. */
function octahedron(): V3[] {
  const p: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const f = [[2, 4, 0], [2, 0, 5], [2, 5, 1], [2, 1, 4], [3, 0, 4], [3, 5, 0], [3, 1, 5], [3, 4, 1]];
  return f.flatMap(([a, b, c]) => [p[a!]!, p[b!]!, p[c!]!]);
}

const BOULDER_SUBDIV: Record<Exclude<RockLevel, "coarse">, number> = { low: 1, high: 3, max: 4 };

function boulder(seed: number, level: RockLevel): Soup {
  const rnd = stream("granite-boulder", seed);
  const size = 3.6 + rnd() * 1.8;
  const sx = 1 + rnd() * 0.45, sy = 0.55 + rnd() * 0.25, sz = 0.85 + rnd() * 0.25;
  const turn = rnd() * Math.PI;
  const salt = seed * 31 + 11;
  const shape = (p: V3): V3 => {
    const d = 1 + 0.2 * (noise3(p[0] * 1.6 + 5, p[1] * 1.6, p[2] * 1.6, salt) - 0.5) + 0.07 * (noise3(p[0] * 4, p[1] * 4, p[2] * 4, salt + 1) - 0.5);
    let x = p[0] * d * sx, y = p[1] * d * sy, z = p[2] * d * sz;
    // flattened underneath, where it has settled
    if (y < -0.3 * sy) y = -0.3 * sy + (y + 0.3 * sy) * 0.25;
    const c = Math.cos(turn), s = Math.sin(turn);
    [x, z] = [c * x - s * z, s * x + c * z];
    return [x * size / 2, (y + 0.3 * sy) * size / 2 - BURY * 0.35, z * size / 2];
  };
  const corners = level === "coarse" ? octahedron() : icosphere(BOULDER_SUBDIV[level]);
  const soup = new Soup();
  for (let i = 0; i < corners.length; i += 3) {
    const a = shape(corners[i]!), b = shape(corners[i + 1]!), c = shape(corners[i + 2]!);
    const sh = (p: V3) => foot(p[1] + 1.2) * (0.9 + 0.14 * noise3(p[0] * 2, p[1] * 2, p[2] * 2, salt + 2));
    soup.tri(a, b, c, sh(a), sh(b), sh(c));
  }
  return soup;
}

// ---- the parts and the models -------------------------------------------------

/** One species, one shape, one level: its triangles, its foot on y = 0, fitted onto the high level's box. */
export function rockSoup(species: RockSpecies, seed: number, level: RockLevel): Soup {
  const build = (l: RockLevel) => {
    const s = species === "granite-boulder" ? boulder(seed, l) : latheRock(LATHE_SHAPES[species](seed), l);
    // the buried foot stands on y = 0 (the game sinks it: rockInfo `sink`)
    const lowest = s.bounds().min[1];
    for (let i = 1; i < s.pos.length; i += 3) s.pos[i] = s.pos[i]! - lowest;
    return s;
  };
  const soup = build(level);
  if (level !== "high") soup.fit(build("high").bounds());
  return soup;
}

/** How far under the ground a shape's foot goes, at scale 1: what the game sinks it by. */
function sinkOf(species: RockSpecies, fullHeight: number): number {
  return species === "granite-boulder" ? BOULDER_SINK * fullHeight : BURY;
}

/**
 * Which triangles are top faces (the `foliage` material): those looking up more
 * than the species' threshold -- and at least one, the highest-facing, because the
 * game's forest merges the two meshes by name and needs both (a coarse pinnacle's
 * five sides all look sideways).
 */
function topFaces(species: RockSpecies, soup: Soup): boolean[] {
  const topNy = TOP_NY_OF[species] ?? TOP_NY;
  const top: boolean[] = [];
  let best = 0, bestNy = -Infinity;
  for (let t = 0, i = 0; t < soup.pos.length; t += 9, i++) {
    const ny = normalOf(soup.pos, t)[1];
    top.push(ny >= topNy);
    if (ny > bestNy) { bestNy = ny; best = i; }
  }
  if (!top.includes(true) && top.length > 1) top[best] = true;
  return top;
}

/** The two materials of a rock: the stone, and the faces that look up. */
export function rockMesh(species: RockSpecies, soup: Soup): MeshBuilder {
  const look = LOOK[species];
  const m = new MeshBuilder({
    trunk: { ...surfaceMaterial(look.surface, { color: look.rock, roughness: 1 }) },
    foliage: { ...surfaceMaterial(look.surface, { color: look.top, roughness: 1 }) },
  });
  const p = soup.pos, c = soup.col;
  const tops = topFaces(species, soup);
  const emit = (mat: "trunk" | "foliage", wantTop: boolean) => {
    for (let t = 0; t < p.length; t += 9) {
      if (tops[t / 9] !== wantTop) continue;
      const a: V3 = [p[t]!, p[t + 1]!, p[t + 2]!], b: V3 = [p[t + 3]!, p[t + 4]!, p[t + 5]!], d: V3 = [p[t + 6]!, p[t + 7]!, p[t + 8]!];
      m.triShaded(mat, a, b, d, [[c[t]!, c[t + 1]!, c[t + 2]!], [c[t + 3]!, c[t + 4]!, c[t + 5]!], [c[t + 6]!, c[t + 7]!, c[t + 8]!]]);
    }
  };
  m.scope("trunk", () => emit("trunk", false));
  m.scope("foliage", () => emit("foliage", true));
  return m;
}

/** A rock's two materials as tree-kit parts (the grove previews bake rocks with the trees). */
export function rockParts(species: RockSpecies, level: RockLevel, seed: number): { trunk: Geo[]; foliage: Geo[] } {
  const soup = rockSoup(species, seed, level);
  const tops = topFaces(species, soup);
  const trunk = new Geo(), foliage = new Geo();
  trunk.col = [];
  foliage.col = [];
  for (let t = 0; t < soup.pos.length; t += 9) {
    const g = tops[t / 9] ? foliage : trunk;
    for (let k = 0; k < 9; k++) {
      g.pos.push(soup.pos[t + k]!);
      g.col!.push(soup.col[t + k]!);
    }
  }
  return { trunk: [trunk], foliage: [foliage] };
}

/** A species' two material colours (sRGB): the stone and its top faces. */
export function rockColors(species: RockSpecies): { trunk: string; foliage: string } {
  return { trunk: LOOK[species].rock, foliage: LOOK[species].top };
}

/** One species at one level as a model (the woods module's buildTree for a rock). */
export function buildRock(species: RockSpecies, level: RockLevel, p?: ParamValues): MeshBuilder {
  return rockMesh(species, rockSoup(species, seedOf(p), level));
}

/** Where a tree may stand on a rock: model studs at scale 1, `r` the room it has. */
export interface RockTop {
  x: number;
  z: number;
  y: number;
  r: number;
}

/** What the game needs of one shape beyond its triangles (docs/models/rocks.md). */
export interface RockInfo {
  /** Height above the ground at scale 1, studs. */
  height: number;
  /** How far under the ground the model's foot (y = 0) goes at scale 1: the game draws it this much lower. */
  sink: number;
  /** The radius of the ground it covers about its origin at scale 1: no tree stands inside, nothing is built there. */
  footprint: number;
  /** Where a tree may stand on top of it (none for a boulder or a pinnacle). */
  tops: RockTop[];
}

/** Measures one shape: its height, footprint and top spots, from its high level. */
export function rockInfo(species: RockSpecies, seed: number): RockInfo {
  const soup = rockSoup(species, seed, "high");
  const { max } = soup.bounds();
  const sink = sinkOf(species, max[1]);
  const height = max[1] - sink;
  let footprint = 0;
  const p = soup.pos;
  for (let i = 0; i < p.length; i += 3) {
    if (p[i + 1]! - sink > height * 0.35) continue;
    footprint = Math.max(footprint, Math.hypot(p[i]!, p[i + 2]!));
  }
  const tops: RockTop[] = [];
  if (species !== "granite-boulder") {
    const shape = LATHE_SHAPES[species](seed);
    if (shape.topShare > 0) {
      // the centre of the top ring, and the top faces' mean height around it
      const [cx, cz] = shape.centre(shape.height);
      // the soup stands on its foot: a lathe shape's heights are BURY lower
      let r = 0;
      for (let j = 0; j < 24; j++) r += shape.radius((j / 24) * Math.PI * 2, shape.height, "high") / 24;
      let sum = 0, n = 0;
      for (let t = 0; t < p.length; t += 9) {
        if (normalOf(p, t)[1] < TOP_NY) continue;
        const mx = (p[t]! + p[t + 3]! + p[t + 6]!) / 3, mz = (p[t + 2]! + p[t + 5]! + p[t + 8]!) / 3;
        if (Math.hypot(mx - cx, mz - cz) > r * shape.topShare) continue;
        sum += (p[t + 1]! + p[t + 4]! + p[t + 7]!) / 3;
        n++;
      }
      tops.push({ x: round(cx), z: round(cz), y: round(n ? sum / n - sink : height), r: round(r * shape.topShare) });
    }
  }
  return { height: round(height), sink: round(sink), footprint: round(footprint), tops };
}

const round = (v: number): number => Math.round(v * 1000) / 1000;

// One exported build function per species and level: a design's JS model bundles
// the functions it names (jsModel.ts), so each needs its own name.
export const rockBoulder = (p?: ParamValues) => buildRock("granite-boulder", "high", p);
export const rockBoulderLow = (p?: ParamValues) => buildRock("granite-boulder", "low", p);
export const rockBoulderCoarse = (p?: ParamValues) => buildRock("granite-boulder", "coarse", p);
export const rockBoulderMax = (p?: ParamValues) => buildRock("granite-boulder", "max", p);
export const rockSandstone = (p?: ParamValues) => buildRock("sandstone-tower", "high", p);
export const rockSandstoneLow = (p?: ParamValues) => buildRock("sandstone-tower", "low", p);
export const rockSandstoneCoarse = (p?: ParamValues) => buildRock("sandstone-tower", "coarse", p);
export const rockSandstoneMax = (p?: ParamValues) => buildRock("sandstone-tower", "max", p);
export const rockPinnacle = (p?: ParamValues) => buildRock("limestone-pinnacle", "high", p);
export const rockPinnacleLow = (p?: ParamValues) => buildRock("limestone-pinnacle", "low", p);
export const rockPinnacleCoarse = (p?: ParamValues) => buildRock("limestone-pinnacle", "coarse", p);
export const rockPinnacleMax = (p?: ParamValues) => buildRock("limestone-pinnacle", "max", p);
export const rockCrag = (p?: ParamValues) => buildRock("crag", "high", p);
export const rockCragLow = (p?: ParamValues) => buildRock("crag", "low", p);
export const rockCragCoarse = (p?: ParamValues) => buildRock("crag", "coarse", p);
export const rockCragMax = (p?: ParamValues) => buildRock("crag", "max", p);

type Build = (p?: ParamValues) => MeshBuilder;
const BUILDERS: Record<RockSpecies, [high: Build, low: Build, coarse: Build, max: Build]> = {
  "granite-boulder": [rockBoulder, rockBoulderLow, rockBoulderCoarse, rockBoulderMax],
  "sandstone-tower": [rockSandstone, rockSandstoneLow, rockSandstoneCoarse, rockSandstoneMax],
  "limestone-pinnacle": [rockPinnacle, rockPinnacleLow, rockPinnacleCoarse, rockPinnacleMax],
  crag: [rockCrag, rockCragLow, rockCragCoarse, rockCragMax],
};

/** The catalog fields every rock shares. */
export const ROCK_CATALOG: CatalogFields = {
  category: "Rocks",
  group: "rock",
  defaultScale: 1,
  license: "MIT",
  author: "Rail Island",
  source: "procedural (rail-island-factory)",
};

/** The model id of a species' design. */
export const rockId = (species: RockSpecies): string => `proc-rock-${species}`;

/** One design per species: drafts until confirmed (catalogModels.json). */
export const ROCKS: ProceduralDesign[] = /* @__PURE__ */ ROCK_SPECIES.map((species) => {
  const [build, buildLod, buildCoarse, buildMax] = BUILDERS[species];
  return {
    id: rockId(species),
    title: TITLES[species],
    build,
    buildLod,
    buildCoarse,
    buildMax,
    params: ROCK_PARAMS,
    lodTriangles: 300 as const,
    catalog: ROCK_CATALOG,
  };
});
