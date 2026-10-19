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
// game's instance colour does. No `node:` imports.

import { MeshBuilder } from "./meshBuilder.ts";
import { boxOf, type Geo, type P3 } from "./treeGeo.ts";
import { TREE_COLORS, treeParts, type Species, type TreeDetail } from "./trees.ts";
import { MAX_TREES_PER_CELL, newSlot, type CellContext, type TreeSlot, type WoodsDesign } from "./woodsApi.ts";

/** One cell's width in studs (the game's MapSizes.RESOLUTION). */
export const CELL_STUDS = 4;

/** The colour an instance's `shade` and `hue` multiply a tree by -- the game's instance colour. */
export function instanceTint(shade: number, hue: number): P3 {
  // warm: more red and green, less blue; cool: the reverse
  return [shade * (1 + 0.1 * hue), shade * (1 + 0.04 * hue), shade * (1 - 0.14 * hue)];
}

const heightCache = new Map<string, number>();
/** A species' height at one level, at scale 1 (the game's speciesBaseHeight). */
export function speciesHeight(species: Species, detail: TreeDetail): number {
  const key = `${species}:${detail}`;
  let h = heightCache.get(key);
  if (h === undefined) {
    const { trunk, foliage } = treeParts(species, detail);
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
  const parts = new Map<Species, ReturnType<typeof treeParts>>();
  const trees = groveTrees(woods, opts);
  for (const t of trees) {
    const s = t.species as Species;
    if (!parts.has(s)) {
      parts.set(s, treeParts(s, detail));
      palette[`${s}-trunk`] = { color: TREE_COLORS[s].trunk, roughness: 1 };
      palette[`${s}-foliage`] = { color: TREE_COLORS[s].foliage, roughness: 0.9, ...(parts.get(s)!.ribbons ? { doubleSided: true } : {}) };
    }
  }
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
  return m;
}

/** Bakes every tree of the grove into `m`, placed and coloured the way the game does. */
function plant(m: MeshBuilder, trees: Array<TreeSlot & { cx: number; cz: number }>, parts: Map<Species, ReturnType<typeof treeParts>>, detail: TreeDetail): void {
  for (const t of trees) {
    const s = t.species as Species;
    const p = parts.get(s)!;
    const k = t.height / speciesHeight(s, detail);
    const rot = (t.rot * Math.PI) / 180;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const cl = Math.cos(t.lean), sl = Math.sin(t.lean);
    const tint = instanceTint(t.shade, t.hue);
    // a lean tips one side of the trunk's foot below the ground: lift the tree by that much
    let dip = 0;
    for (const g of [...p.trunk, ...p.foliage]) {
      for (let i = 0; i < g.count; i++) dip = Math.min(dip, g.y(i) * k * cl - g.z(i) * k * t.width * sl);
    }
    const lift = 0.02 - dip;
    // scale, lean about the tree's local X, turn about Y, move to the cell
    const place = (x: number, y: number, z: number): P3 => {
      const sx = x * k * t.width, sy = y * k, sz = z * k * t.width;
      const ly = sy * cl - sz * sl, lz = sy * sl + sz * cl;
      return [cr * sx + sr * lz + t.cx, ly + lift, -sr * sx + cr * lz + t.cz];
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
