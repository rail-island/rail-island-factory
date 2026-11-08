// A woods type's grove: its distribution function run over a small patch of cells
// and every tree it grows baked into one model -- the woods models' geometry on
// the site (woodsModels.ts, proc-woods-<name>) and the headless review renders. The patch is
// a rounded wood on flat ground with open grass around it, so the function shows
// its interior, its edge and what it does with a lone cell.
//
// The trees are placed the way the game places them (docs/models/woods.md): the
// cell's centre plus the slot's offset in cell widths, scaled to the slot's height
// against the species' own height at that level, stretched by `width`, tilted by
// `lean` toward the tree's rotation, and coloured by `shade` and `hue` the way the
// game's instance colour does. Each tree is the shape its slot's `seed` picks.
//
// A rock woods type's grove also stands a few of the game's stored rocks in the
// wood (GROVE_ROCKS: a rock city's sandstone towers, a stone forest's pinnacles,
// crags), handing every cell what it sees of them (woodsApi.ts rockCellContext),
// so the preview shows the trees in the lanes and on the crowns as the game grows
// them. A slot may be a boulder (rocks.ts), baked like a tree.
// No `node:` imports.

import { MeshBuilder } from "./meshBuilder.ts";
import { boxOf, type Geo, type P3 } from "./treeGeo.ts";
import { TREE_COLORS, treeOptions, treeParts, type Species, type TreeDetail } from "./trees.ts";
import { ROCK_SPECIES, rockColors, rockInfo, rockParts, type RockSpecies } from "./rocks.ts";
import { MAX_TREES_PER_CELL, newSlot, rockCellContext, type CellContext, type PlacedRock, type TreeSlot, type WoodsDesign } from "./woodsApi.ts";

/** One cell's width in studs (the game's MapSizes.RESOLUTION). */
export const CELL_STUDS = 4;

/** The colour an instance's `shade` and `hue` multiply a tree by -- the game's instance colour. */
export function instanceTint(shade: number, hue: number): P3 {
  // warm: more red and green, less blue; cool: the reverse
  return [shade * (1 + 0.1 * hue), shade * (1 + 0.04 * hue), shade * (1 - 0.14 * hue)];
}

const isRock = (s: string): s is RockSpecies => (ROCK_SPECIES as readonly string[]).includes(s);

/** One shape of a species at one level: the tree (or the boulder) its design builds for that seed. */
export function seededParts(species: Species | RockSpecies, detail: TreeDetail, seed = 1): ReturnType<typeof treeParts> {
  if (isRock(species)) return rockParts(species, detail, seed);
  return treeParts(species, detail, treeOptions(species, { seed: String(seed) }));
}

/** A species' two material colours: a tree's trunk and foliage, a rock's stone and top. */
function colorsOf(species: Species | RockSpecies): { trunk: string; foliage: string } {
  return isRock(species) ? rockColors(species) : TREE_COLORS[species];
}

/**
 * The stored rocks a rock woods type's grove stands in its wood: the species, and
 * where each stands as a fraction of the wood's radius from the patch's centre.
 */
const GROVE_ROCKS: Readonly<Record<string, { species: RockSpecies; at: ReadonlyArray<[number, number, number]> }>> = {
  "rock-city": { species: "sandstone-tower", at: [[0, 0, 1], [0.62, 0.3, 0.85], [-0.55, 0.5, 0.95], [0.1, -0.68, 0.8], [-0.62, -0.4, 0.9]] },
  "stone-forest": { species: "limestone-pinnacle", at: [[0, 0, 0.9], [0.55, 0.35, 0.7], [-0.5, 0.45, 0.8], [0.2, -0.6, 0.75], [-0.6, -0.3, 0.65], [0.65, -0.35, 0.6]] },
  crags: { species: "crag", at: [[0.2, 0.15, 1], [-0.5, -0.4, 0.9], [0.45, -0.55, 0.8]] },
};

/** A stored rock in a grove: species, shape, place (patch studs), turn and scale. */
export interface GroveRock {
  species: RockSpecies;
  seed: number;
  x: number;
  z: number;
  rot: number;
  scale: number;
}

/** The stored rocks a woods type's grove stands (none for a forest). */
export function groveRocks(woods: WoodsDesign, opts: GroveOptions = {}): GroveRock[] {
  const spec = GROVE_ROCKS[woods.name];
  if (!spec) return [];
  const cells = opts.cells ?? 14;
  const radius = opts.radius ?? cells * 0.36;
  const c = (cells / 2) * CELL_STUDS, r = radius * CELL_STUDS;
  return spec.at.map(([fx, fz, scale], i) => ({
    species: spec.species, seed: (i % 5) + 1, x: c + fx * r, z: c + fz * r, rot: i * 1.3, scale,
  }));
}

/** A grove rock as cells see it (woodsApi.ts PlacedRock): its footprint and tops, turned and scaled. */
function placed(r: GroveRock): PlacedRock {
  const info = rockInfo(r.species, r.seed);
  const c = Math.cos(r.rot), s = Math.sin(r.rot);
  return {
    x: r.x, z: r.z, footprint: info.footprint * r.scale,
    tops: info.tops.map((t) => ({ x: r.x + (c * t.x + s * t.z) * r.scale, z: r.z + (-s * t.x + c * t.z) * r.scale, y: t.y * r.scale, r: t.r * r.scale })),
  };
}

const heightCache = new Map<string, number>();
/** A species' height at one level and seed, at scale 1 (the game's speciesBaseHeight). */
export function speciesHeight(species: Species | RockSpecies, detail: TreeDetail, seed = 1): number {
  const key = `${species}:${detail}:${seed}`;
  let h = heightCache.get(key);
  if (h === undefined) {
    const { trunk, foliage } = seededParts(species, detail, seed);
    const b = boxOf([...trunk, ...foliage]);
    h = b.max[1] - b.min[1];
    heightCache.set(key, h);
  }
  return h;
}

export interface GroveOptions {
  /** The woods type's parameter values; the defaults when absent. */
  params?: Record<string, string>;
  /** Cells across the patch (square). */
  cells?: number;
  /** The wood's radius in cells; cells beyond it are open grass. */
  radius?: number;
  /** Which level the trees are drawn at. */
  detail?: TreeDetail;
  /** The map seed. */
  seed?: number;
  /** Draw the ground: the forest floor under the wood, grass around it. */
  ground?: boolean;
}

const GRASS = "#6f9a48";

function hex(c: { r: number; g: number; b: number }): string {
  return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Whether a patch cell is wooded: inside the rounded outline, with a ragged edge. */
function wooded(gx: number, gz: number, cells: number, radius: number): boolean {
  const c = (cells - 1) / 2;
  const r = Math.hypot(gx - c, gz - c);
  const wobble = 0.9 * Math.sin(gx * 1.7 + gz * 0.6) + 0.6 * Math.cos(gz * 1.3 - gx * 0.4);
  return r <= radius + wobble;
}

/** The trees the woods grows on the patch, in patch studs (x, z from the patch's corner). */
export function groveTrees(woods: WoodsDesign, opts: GroveOptions = {}): Array<TreeSlot & { cx: number; cz: number }> {
  const planter = opts.params ? woods.variant(opts.params) : woods;
  const cells = opts.cells ?? 14;
  const radius = opts.radius ?? cells * 0.36;
  const seed = opts.seed ?? 20261019;
  const out: TreeSlot[] = Array.from({ length: MAX_TREES_PER_CELL }, newSlot);
  const trees: Array<TreeSlot & { cx: number; cz: number }> = [];
  const rocks = groveRocks(woods, opts).map(placed);
  for (let gz = 0; gz < cells; gz++) {
    for (let gx = 0; gx < cells; gx++) {
      if (!wooded(gx, gz, cells, radius)) continue;
      let mask = 0;
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (wooded(gx + dx, gz + dz, cells, radius)) mask |= 1 << ((dz + 2) * 5 + dx + 2);
        }
      }
      const ctx: CellContext = { gx, gz, seed, mask, slope: 0, height: 20 };
      if (rocks.length) Object.assign(ctx, rockCellContext(rocks, (gx + 0.5) * CELL_STUDS, (gz + 0.5) * CELL_STUDS, CELL_STUDS, () => 0));
      const n = Math.min(planter.distribute(ctx, out), MAX_TREES_PER_CELL);
      for (let i = 0; i < n; i++) {
        const t = out[i]!;
        trees.push({ ...t, cx: (gx + 0.5 + t.x) * CELL_STUDS, cz: (gz + 0.5 + t.z) * CELL_STUDS });
      }
    }
  }
  return trees;
}

/**
 * The grove as one model: every tree's trunk and foliage in two materials per
 * species (named `<species>-trunk` / `<species>-foliage`, so each keeps its own
 * colour), its instance colour baked into the corners, plus the ground.
 */
export function buildGrove(woods: WoodsDesign, opts: GroveOptions = {}): MeshBuilder {
  const cells = opts.cells ?? 14;
  const radius = opts.radius ?? cells * 0.36;
  const detail = opts.detail ?? "high";
  const palette: Record<string, { color: string; roughness?: number; doubleSided?: boolean }> = {
    grass: { color: GRASS, roughness: 1 },
    // a variant's own floor (an autumn wood's), else the type's
    floor: { color: hex((opts.params ? woods.variant(opts.params).floor : undefined) ?? woods.floor), roughness: 1 },
  };
  // one set of parts per species and seed; the materials are per species
  const parts = new Map<string, ReturnType<typeof treeParts>>();
  const trees = groveTrees(woods, opts);
  const rocks = groveRocks(woods, opts);
  const need = (s: Species | RockSpecies, seed: number): void => {
    const key = `${s}:${seed}`;
    if (parts.has(key)) return;
    parts.set(key, seededParts(s, detail, seed));
    palette[`${s}-trunk`] = { color: colorsOf(s).trunk, roughness: 1 };
    palette[`${s}-foliage`] = { color: colorsOf(s).foliage, roughness: 0.9, ...(parts.get(key)!.ribbons ? { doubleSided: true } : {}) };
  };
  for (const t of trees) need(t.species as Species | RockSpecies, t.seed);
  for (const r of rocks) need(r.species, r.seed);
  const m = new MeshBuilder(palette);
  if (opts.ground !== false) {
    const S = CELL_STUDS;
    m.scope("ground", () => {
      for (let gz = 0; gz < cells; gz++) {
        for (let gx = 0; gx < cells; gx++) {
          const mat = wooded(gx, gz, cells, radius) ? "floor" : "grass";
          m.quad(mat, [gx * S, 0, gz * S], [gx * S, 0, (gz + 1) * S], [(gx + 1) * S, 0, (gz + 1) * S], [(gx + 1) * S, 0, gz * S]);
        }
      }
    });
  }
  m.scope("trees", () => plant(m, trees, parts, detail));
  if (rocks.length) m.scope("rocks", () => standRocks(m, rocks, parts));
  return m;
}

/** Bakes the grove's stored rocks: each its shape at the grove's level, turned, scaled and placed. */
function standRocks(m: MeshBuilder, rocks: readonly GroveRock[], parts: Map<string, ReturnType<typeof treeParts>>): void {
  for (const r of rocks) {
    const p = parts.get(`${r.species}:${r.seed}`)!;
    const c = Math.cos(r.rot), s = Math.sin(r.rot);
    const sink = rockInfo(r.species, r.seed).sink;
    // sunk by its foot, which is then flattened onto the ground: a preview has no ground under its ground
    const place = (x: number, y: number, z: number): P3 => [r.x + (c * x + s * z) * r.scale, Math.max(0, (y - sink) * r.scale), r.z + (-s * x + c * z) * r.scale];
    const emit = (mat: string, list: Geo[]) => {
      for (const g of list) {
        const col = (j: number): P3 => (g.col ? [g.col[j * 3]!, g.col[j * 3 + 1]!, g.col[j * 3 + 2]!] : [1, 1, 1]);
        for (let i = 0; i < g.count; i += 3) {
          m.triShaded(mat, place(g.x(i), g.y(i), g.z(i)), place(g.x(i + 1), g.y(i + 1), g.z(i + 1)), place(g.x(i + 2), g.y(i + 2), g.z(i + 2)), [col(i), col(i + 1), col(i + 2)]);
        }
      }
    };
    emit(`${r.species}-trunk`, p.trunk);
    emit(`${r.species}-foliage`, p.foliage);
  }
}

/** Bakes every tree of the grove into `m`, placed and coloured the way the game does. */
function plant(m: MeshBuilder, trees: Array<TreeSlot & { cx: number; cz: number }>, parts: Map<string, ReturnType<typeof treeParts>>, detail: TreeDetail): void {
  for (const t of trees) {
    const s = t.species as Species | RockSpecies;
    const p = parts.get(`${s}:${t.seed}`)!;
    const k = t.height / speciesHeight(s, detail, t.seed);
    const rot = (t.rot * Math.PI) / 180;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const cl = Math.cos(t.lean), sl = Math.sin(t.lean);
    const tint = instanceTint(t.shade, t.hue);
    // a lean tips one side of the trunk's foot below the ground: lift the tree by that much
    let dip = 0;
    for (const g of [...p.trunk, ...p.foliage]) {
      for (let i = 0; i < g.count; i++) dip = Math.min(dip, g.y(i) * k * cl - g.z(i) * k * t.width * sl);
    }
    // ...and onto the rock it stands on (a slot's lift: a tree on a tower's crown)
    // (a boulder keeps its buried foot: it is meant to sink into the ground)
    const lift = (isRock(s) ? 0 : 0.02 - dip) + t.lift;
    // scale, lean about the tree's local X, turn about Y, move to the cell
    const place = (x: number, y: number, z: number): P3 => {
      const sx = x * k * t.width, sy = y * k, sz = z * k * t.width;
      const ly = sy * cl - sz * sl, lz = sy * sl + sz * cl;
      const py = ly + lift;
      // a boulder's buried foot is flattened onto the ground, as a stored rock's is
      return [cr * sx + sr * lz + t.cx, isRock(s) ? Math.max(0, py) : py, -sr * sx + cr * lz + t.cz];
    };
    const emit = (mat: string, list: Geo[]) => {
      for (const g of list) {
        // the tree's own baked corner colour (Geo.col), times the instance colour
        const base = (j: number): P3 => g.col
          ? [g.col[j * 3]! * tint[0], g.col[j * 3 + 1]! * tint[1], g.col[j * 3 + 2]! * tint[2]]
          : [tint[0], tint[1], tint[2]];
        for (let i = 0; i < g.count; i += 3) {
          const a = place(g.x(i), g.y(i), g.z(i)), b = place(g.x(i + 1), g.y(i + 1), g.z(i + 1)), c = place(g.x(i + 2), g.y(i + 2), g.z(i + 2));
          m.triShaded(mat, a, b, c, [base(i), base(i + 1), base(i + 2)]);
        }
      }
    };
    emit(`${s}-trunk`, p.trunk);
    emit(`${s}-foliage`, p.foliage);
  }
}
