// The contract between a woods type's distribution function (woods.ts) and the
// game that calls it for every painted cell (docs/models/woods.md).
//
//   distribute(ctx, out)  fills `out[0..n)` with the trees one cell grows and
//                         returns n, at most MAX_TREES_PER_CELL (a hard limit the
//                         factory tests; the game clamps only as a safety net)
//   sample(u, v, out)     one representative tree from two uniform numbers in
//                         [0, 1): what a row of trees along a line draws
//
// Both are pure and deterministic: the same context gives the same trees, so a
// forest needs no per-tree state saved. They must not allocate per cell -- the
// game calls distribute tens of thousands of times when a tile is built -- so the
// output slots are the caller's, reused.
//
// The hash below is the one the game's placement has always used, so a cell grows
// the same tree it grew before the move; the game and the factory both pin it with
// the same test vectors. No `node:` imports: bundled into every woods module.

/** The most trees one cell may grow: a hard limit, tested for every woods type. */
export const MAX_TREES_PER_CELL = 4;

/** How far the neighbourhood mask reaches, in cells, on each side. */
export const MASK_RADIUS = 2;

/** What a woods type sees of the cell it plants. */
export interface CellContext {
  /** The cell's column and row on the map's cell grid. */
  gx: number;
  gz: number;
  /** The map's seed (int32): fold it with the cell through cellSeed(). */
  seed: number;
  /**
   * Which cells of the 5x5 neighbourhood carry the SAME woods type: bit
   * (dz + 2) * 5 + (dx + 2) for dx, dz in -2..2 (bit 12, the cell itself, is set).
   * Read it with same().
   */
  mask: number;
  /** The terrain's slope at the cell, in degrees (0 = flat). */
  slope: number;
  /** The terrain's height at the cell, in studs above the water plane. */
  height: number;
}

/** One tree a cell grows, written into a slot the caller owns. */
export interface TreeSlot {
  /** The species key (trees.ts SPECIES). */
  species: string;
  /** Offset from the cell's centre, in cell widths: -0.5 .. 0.5 keeps it inside the cell. */
  x: number;
  z: number;
  /** Rotation about the vertical, in degrees. */
  rot: number;
  /** The tree's height in studs. */
  height: number;
  /** Horizontal stretch of the crown (1 = the species' own width). */
  width: number;
  /** Tilt off the vertical, in radians, toward the tree's own rotation. */
  lean: number;
  /** Brightness multiplier of the whole tree (1 = as modelled). */
  shade: number;
  /** Hue shift of the foliage: -1 cooler / bluer .. 1 warmer / yellower, 0 = as modelled. */
  hue: number;
}

/** A woods type: its stable name (stored in the game's maps), how it looks in a picker, and its functions. */
export interface WoodsDesign {
  /** Stable key, e.g. "pine-forest": the game's maps store it; never rename a shipped one. */
  name: string;
  /** English display name. */
  label: string;
  /** The picker swatch and the far-distance ground tint, sRGB 0..255. */
  swatch: { r: number; g: number; b: number };
  /** The forest floor under the trees, sRGB 0..255. */
  floor: { r: number; g: number; b: number };
  distribute(ctx: CellContext, out: TreeSlot[]): number;
  sample(u: number, v: number, out: TreeSlot): void;
}

// Distinct large primes that fold cell coordinates into the per-cell seed.
const PRIME_X = 374761393;
const PRIME_Z = 668265263;

/** The per-cell seed: the map's seed and the cell's coordinates folded together. */
export function cellSeed(gx: number, gz: number, mapSeed: number): number {
  return ((mapSeed | 0) + Math.imul(gx | 0, PRIME_X) + Math.imul(gz | 0, PRIME_Z)) | 0;
}

/** A deterministic float in [0, 1) for a (seed, draw index) pair. */
export function draw(seed: number, i: number): number {
  let n = (Math.imul(seed | 0, 0x4be7f9d5) + Math.imul(i | 0, 0x9e3779b9)) | 0;
  n ^= n >>> 13;
  n = (Math.imul(n, 0x27d4eb2f) + 0x165667b1) | 0;
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

/** Whether the neighbour (dx, dz), each in -2..2, carries the same woods type. */
export function same(mask: number, dx: number, dz: number): boolean {
  return ((mask >>> ((dz + MASK_RADIUS) * 5 + dx + MASK_RADIUS)) & 1) === 1;
}

/** A fresh output slot (the caller keeps MAX_TREES_PER_CELL of them). */
export function newSlot(): TreeSlot {
  return { species: "", x: 0, z: 0, rot: 0, height: 0, width: 1, lean: 0, shade: 1, hue: 0 };
}

/** Writes one tree into a slot. */
export function put(
  out: TreeSlot, species: string, x: number, z: number, rot: number, height: number,
  width = 1, lean = 0, shade = 1, hue = 0,
): void {
  out.species = species;
  out.x = x;
  out.z = z;
  out.rot = rot;
  out.height = height;
  out.width = width;
  out.lean = lean;
  out.shade = shade;
  out.hue = hue;
}

/**
 * Smooth value noise in [0, 1) over the cell grid: lattice values every `scale`
 * cells, eased between. What gathers a woods type's trees into groves and glades
 * that span many cells -- every cell reads it independently, so it needs nothing
 * of its neighbours and nothing of the order cells are built in. `salt` picks an
 * independent field.
 */
export function field(gx: number, gz: number, scale: number, mapSeed: number, salt: number): number {
  const x = gx / scale, z = gz / scale;
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const s = (mapSeed ^ Math.imul(salt | 0, 0x2c1b3c6d)) | 0;
  const v = (i: number, k: number) => draw(cellSeed(ix + i, iz + k, s), 11);
  const a = v(0, 0) + (v(1, 0) - v(0, 0)) * sx;
  const b = v(0, 1) + (v(1, 1) - v(0, 1)) * sx;
  return a + (b - a) * sz;
}

/**
 * How much of a cell's neighbourhood is NOT the same woods: 0 deep inside a wood,
 * 1 for a lone cell. The ring of eight next to it counts most.
 */
export function edgeness(mask: number): number {
  let near = 0, far = 0;
  for (let dz = -MASK_RADIUS; dz <= MASK_RADIUS; dz++) {
    for (let dx = -MASK_RADIUS; dx <= MASK_RADIUS; dx++) {
      if (dx === 0 && dz === 0) continue;
      if (same(mask, dx, dz)) continue;
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) near++;
      else far++;
    }
  }
  return Math.min(1, (near / 8) * 0.75 + (far / 16) * 0.5);
}
