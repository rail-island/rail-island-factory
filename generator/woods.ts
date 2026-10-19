// The woods types: what grows on a cell the game paints with one. Each is a
// distribution function keyed by a stable name (woodsApi.ts, docs/models/woods.md);
// the build bundles each into export/woods/<name>.js and lists them in
// woods.meta.json. No `node:` imports.

import { MAX_TREES_PER_CELL, cellSeed, draw, edgeness, field, put, type CellContext, type TreeSlot, type WoodsDesign } from "./woodsApi.ts";
import type { Species } from "./trees.ts";

type Rgb = { r: number; g: number; b: number };

/** One species in a classic woods mix: a height range in studs and a relative weight. */
interface MixEntry {
  species: Species;
  minHeight: number;
  maxHeight: number;
  ratio: number;
}

/** The forest floor under a woods type: its swatch darkened and pulled toward leaf litter. */
function floorOf(swatch: Rgb): Rgb {
  const litter = { r: 82, g: 66, b: 42 };
  const mix = (a: number, b: number) => Math.round(a * 0.6 + b * 0.4);
  return { r: mix(swatch.r, litter.r), g: mix(swatch.g, litter.g), b: mix(swatch.b, litter.b) };
}

/**
 * A forest: the stylised rule every woods type is written in (docs/models/woods.md).
 * Where the classic rule rolled one tree per cell, a forest reads what is around
 * the cell and plants a small stand on it:
 *
 *   count       `trees` per cell deep inside the wood, falling to `edgeTrees` at
 *               its edge and thinned where a broad `glades` field opens clearings;
 *               the fraction is rolled, so 1.6 is sometimes one tree, mostly two
 *   layout      up to four trees on the quarters of the cell, each jittered within
 *               its quarter, so crowns overlap into a canopy without stacking
 *   species     canopy trees by weight, gathered into groves of one species by a
 *               `groves` field; `under` species (shrubs, young trees) take a share
 *               of the slots that grows toward the edge, and only stand beside a
 *               canopy tree, never instead of the whole cell
 *   height      drawn from the species' range, taller deep inside, shorter at the
 *               edge (`edgeShrink`) and on high ground (`altitude`)
 *   look        each tree its own width, lean, brightness and warm/cool cast, and a
 *               grove a shared tone from the same field
 */
interface ForestSpec {
  name: string;
  label: string;
  swatch: Rgb;
  /** Expected trees per cell deep inside the wood (0..4). */
  trees: number;
  /** Expected trees per cell at the very edge; defaults to 60% of `trees`. */
  edgeTrees?: number;
  canopy: MixEntry[];
  under?: MixEntry[];
  /** Share of the slots taken by `under` inside the wood, and at its edge. */
  underShare?: number;
  edgeUnder?: number;
  /** 0..1: how strongly one canopy species gathers into groves. */
  groves?: number;
  /** 0..1: how much a broad field thins the wood into glades. */
  glades?: number;
  /** Height multiplier at the very edge (1 = none). */
  edgeShrink?: number;
  /** Height lost per 100 studs of terrain height (0..1): a treeline. */
  altitude?: number;
  /** Fewer trees on steep ground: the share lost at 45 degrees. */
  slopeThin?: number;
  /** Plant on a regular grid, one tree a cell at its centre (an orchard). */
  rows?: boolean;
  /** The ground under the trees, when it is not leaf litter (a park's or an orchard's mown grass). */
  floor?: Rgb;
}

// The quarters of a cell, in an order that spreads the first two apart.
const QUARTERS: ReadonlyArray<[number, number]> = [[-0.25, -0.25], [0.25, 0.25], [0.25, -0.25], [-0.25, 0.25]];

function weighted(mix: readonly MixEntry[], u: number): MixEntry {
  const total = mix.reduce((s, m) => s + m.ratio, 0);
  let acc = u * total;
  for (const m of mix) if ((acc -= m.ratio) < 0) return m;
  return mix[mix.length - 1]!;
}

function forest(spec: ForestSpec): WoodsDesign {
  const edgeTrees = spec.edgeTrees ?? spec.trees * 0.6;
  const under = spec.under ?? [];
  const underShare = under.length ? (spec.underShare ?? 0.25) : 0;
  const edgeUnder = under.length ? (spec.edgeUnder ?? Math.min(0.8, underShare + 0.3)) : 0;
  const groves = spec.groves ?? 0;
  const glades = spec.glades ?? 0;
  const edgeShrink = spec.edgeShrink ?? 0.8;
  const altitude = spec.altitude ?? 0;
  const slopeThin = spec.slopeThin ?? 0.3;
  // canopy entries sorted once, so a grove field value maps onto one species
  const canopy = spec.canopy;
  const groveTotal = canopy.reduce((s, m) => s + m.ratio, 0);
  const grovePick = (f: number): MixEntry => {
    let acc = f * groveTotal;
    for (const m of canopy) if ((acc -= m.ratio) < 0) return m;
    return canopy[canopy.length - 1]!;
  };
  const plant = (out: TreeSlot, m: MixEntry, x: number, z: number, seed: number, k: number, size: number, tone: number) => {
    const span = Math.max(m.maxHeight, m.minHeight) - m.minHeight;
    const height = (m.minHeight + draw(seed, 20 + k) * span) * size;
    put(out, m.species, x, z, draw(seed, 30 + k) * 360, height,
      0.88 + 0.28 * draw(seed, 40 + k),
      (draw(seed, 50 + k) - 0.5) * 0.14,
      Math.min(1.25, Math.max(0.75, 0.88 + 0.22 * draw(seed, 60 + k) + tone * 0.12)),
      Math.min(1, Math.max(-1, (draw(seed, 70 + k) - 0.5) * 0.9 + tone * 0.7)));
  };
  return {
    name: spec.name,
    label: spec.label,
    swatch: spec.swatch,
    floor: spec.floor ?? floorOf(spec.swatch),
    distribute(ctx: CellContext, out: TreeSlot[]): number {
      const seed = cellSeed(ctx.gx, ctx.gz, ctx.seed);
      const edge = edgeness(ctx.mask);
      const tone = field(ctx.gx, ctx.gz, 6, ctx.seed, 3) - 0.5;
      const size = (1 - (1 - edgeShrink) * edge) * (1 - altitude * Math.max(0, ctx.height) / 100);
      if (spec.rows) {
        // an orchard: one tree a cell on its centre, the odd gap where one died
        if (draw(seed, 0) >= spec.trees) return 0;
        plant(out[0]!, weighted(canopy, draw(seed, 5)), (draw(seed, 1) - 0.5) * 0.08, (draw(seed, 2) - 0.5) * 0.08, seed, 0, Math.max(0.4, size), tone);
        return 1;
      }
      let expected = spec.trees + (edgeTrees - spec.trees) * edge;
      if (glades > 0) expected *= 1 - glades * smoothstep(0.5, 0.8, field(ctx.gx, ctx.gz, 9, ctx.seed, 1));
      expected *= 1 - slopeThin * Math.min(1, Math.max(0, ctx.slope) / 45);
      const whole = Math.floor(expected);
      let n = Math.min(MAX_TREES_PER_CELL, whole + (draw(seed, 0) < expected - whole ? 1 : 0));
      if (n <= 0) return 0;
      const share = underShare + (edgeUnder - underShare) * edge;
      const groveField = field(ctx.gx, ctx.gz, 7, ctx.seed, 2);
      const start = Math.floor(draw(seed, 1) * 4);
      let canopyTrees = 0;
      for (let k = 0; k < n; k++) {
        const isUnder = under.length > 0 && (k > 0 || n === 1) && draw(seed, 80 + k) < share && !(k === 0 && edge < 0.3);
        const m = isUnder
          ? weighted(under, draw(seed, 90 + k))
          : groves > 0 && draw(seed, 100 + k) < groves ? grovePick(groveField) : weighted(canopy, draw(seed, 110 + k));
        if (!isUnder) canopyTrees++;
        const [qx, qz] = n === 1 ? [0, 0] : QUARTERS[(start + k) % 4]!;
        const jitter = n === 1 ? 0.6 : 0.36;
        const x = qx + (draw(seed, 2 + k * 2) - 0.5) * jitter;
        const z = qz + (draw(seed, 3 + k * 2) - 0.5) * jitter;
        plant(out[k]!, m, Math.max(-0.5, Math.min(0.5, x)), Math.max(-0.5, Math.min(0.5, z)), seed, k, isUnder ? 1 : size, tone);
      }
      if (canopyTrees === 0 && n > 1) n = 1; // shrubs only stand beside a tree, not instead of the stand
      return n;
    },
    sample(u: number, v: number, out: TreeSlot): void {
      const m = weighted(canopy, u);
      put(out, m.species, 0, 0, 0, m.minHeight + v * (Math.max(m.maxHeight, m.minHeight) - m.minHeight),
        0.92 + 0.16 * v, 0, 0.92 + 0.16 * u, (u - 0.5) * 0.6);
    },
  };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// The woods types. Heights are studs, drawn about 15% taller than the classic
// presets (the stylised look); the species' own models carry the wider crowns.

export const pineForest = /* @__PURE__ */ forest({
  name: "pine-forest", label: "Pine Forest", swatch: { r: 40, g: 92, b: 60 },
  trees: 1.7, edgeTrees: 0.9, glades: 0.5, edgeShrink: 0.72,
  canopy: [{ species: "pine", minHeight: 10, maxHeight: 16.5, ratio: 1 }],
  under: [{ species: "pine", minHeight: 4, maxHeight: 7, ratio: 3 }, { species: "bush", minHeight: 2, maxHeight: 3.2, ratio: 2 }],
  underShare: 0.12, edgeUnder: 0.5,
});

export const oakWoods = /* @__PURE__ */ forest({
  name: "oak-woods", label: "Oak Woods", swatch: { r: 74, g: 120, b: 54 },
  trees: 1.25, edgeTrees: 0.8, glades: 0.45, edgeShrink: 0.78,
  canopy: [{ species: "oak", minHeight: 8, maxHeight: 12, ratio: 1 }],
  under: [{ species: "hazel", minHeight: 2.6, maxHeight: 4.2, ratio: 2 }, { species: "bush", minHeight: 2, maxHeight: 3.3, ratio: 3 }],
  underShare: 0.25, edgeUnder: 0.6,
});

export const mixedWoods = /* @__PURE__ */ forest({
  name: "mixed-woods", label: "Mixed Woods", swatch: { r: 58, g: 106, b: 58 },
  trees: 1.7, edgeTrees: 0.9, glades: 0.4, groves: 0.75, edgeShrink: 0.75,
  canopy: [
    { species: "oak", minHeight: 8, maxHeight: 11.5, ratio: 8 },
    { species: "pine", minHeight: 10, maxHeight: 16, ratio: 7 },
    { species: "birch", minHeight: 8, maxHeight: 11, ratio: 3 },
  ],
  under: [{ species: "bush", minHeight: 2, maxHeight: 3.4, ratio: 3 }, { species: "hazel", minHeight: 2.4, maxHeight: 3.8, ratio: 1 }],
  underShare: 0.3, edgeUnder: 0.6,
});

export const scrub = /* @__PURE__ */ forest({
  name: "scrub", label: "Scrub", swatch: { r: 108, g: 132, b: 66 },
  trees: 0.9, edgeTrees: 0.5, glades: 0.6, groves: 0.3, edgeShrink: 0.9, slopeThin: 0.1,
  canopy: [{ species: "bush", minHeight: 2.0, maxHeight: 3.8, ratio: 6 }, { species: "oak", minHeight: 4.2, maxHeight: 6.8, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.4, ratio: 1 }],
  underShare: 0.4, edgeUnder: 0.5,
});

export const palms = /* @__PURE__ */ forest({
  name: "palms", label: "Palms", swatch: { r: 96, g: 150, b: 72 },
  trees: 1.2, edgeTrees: 0.7, glades: 0.35, edgeShrink: 0.85,
  canopy: [{ species: "palm", minHeight: 9, maxHeight: 14, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.8, maxHeight: 3, ratio: 1 }],
  underShare: 0.2, edgeUnder: 0.35,
});

export const tropicalForest = /* @__PURE__ */ forest({
  name: "tropical-forest", label: "Tropical Forest", swatch: { r: 96, g: 150, b: 72 },
  trees: 2.8, edgeTrees: 1.6, groves: 0.4, edgeShrink: 0.8,
  canopy: [{ species: "oak", minHeight: 6.5, maxHeight: 10, ratio: 6 }, { species: "palm", minHeight: 8, maxHeight: 12.5, ratio: 6 }],
  under: [{ species: "bush", minHeight: 2.4, maxHeight: 4, ratio: 1 }],
  underShare: 0.45, edgeUnder: 0.6,
});

// A high-altitude treeline: short conifers that shrink further with height, mixed with low bush.
export const highMountainForest = /* @__PURE__ */ forest({
  name: "high-mountain-forest", label: "High Mountain Forest", swatch: { r: 56, g: 96, b: 74 },
  trees: 1.0, edgeTrees: 0.55, glades: 0.55, groves: 0.5, edgeShrink: 0.75, altitude: 0.12, slopeThin: 0.45,
  canopy: [{ species: "pine", minHeight: 4.5, maxHeight: 7.5, ratio: 8 }, { species: "spruce", minHeight: 4.5, maxHeight: 7, ratio: 6 }],
  under: [{ species: "bush", minHeight: 1.6, maxHeight: 2.8, ratio: 1 }],
  underShare: 0.3, edgeUnder: 0.55,
});

// City greenery on the open ground of a city block: specimen trees standing apart,
// so the lawn stays visible.
export const park = /* @__PURE__ */ forest({
  name: "park", label: "Park", swatch: { r: 86, g: 138, b: 66 }, floor: { r: 98, g: 140, b: 62 },
  trees: 0.24, edgeTrees: 0.2, edgeShrink: 1, slopeThin: 0,
  canopy: [
    { species: "aspen", minHeight: 9, maxHeight: 13.5, ratio: 8 },
    { species: "birch", minHeight: 8, maxHeight: 11.5, ratio: 6 },
    { species: "oak", minHeight: 8, maxHeight: 11.5, ratio: 5 },
    { species: "spruce", minHeight: 7, maxHeight: 10, ratio: 3 },
    { species: "bush", minHeight: 2, maxHeight: 3.2, ratio: 6 },
  ],
});

export const scotsPineWoodland = /* @__PURE__ */ forest({
  name: "scots-pine-woodland", label: "Scots Pine Woodland", swatch: { r: 74, g: 108, b: 72 },
  trees: 1.0, edgeTrees: 0.6, glades: 0.5, edgeShrink: 0.85,
  canopy: [{ species: "scotspine", minHeight: 11.5, maxHeight: 17, ratio: 1 }],
  under: [{ species: "birch", minHeight: 7, maxHeight: 10, ratio: 2 }, { species: "bush", minHeight: 1.8, maxHeight: 3, ratio: 3 }],
  underShare: 0.3, edgeUnder: 0.55,
});

export const larchWoodland = /* @__PURE__ */ forest({
  name: "larch-woodland", label: "Larch Woodland", swatch: { r: 111, g: 150, b: 70 },
  trees: 1.4, edgeTrees: 0.8, glades: 0.4, groves: 0.6, edgeShrink: 0.78,
  canopy: [{ species: "larch", minHeight: 10, maxHeight: 16, ratio: 5 }, { species: "spruce", minHeight: 8, maxHeight: 11.5, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.5, maxHeight: 2.6, ratio: 1 }],
  underShare: 0.15, edgeUnder: 0.45,
});

// Golden groves among green ones: the grove field mixes the two larches.
export const autumnLarchWoodland = /* @__PURE__ */ forest({
  name: "autumn-larch-woodland", label: "Autumn Larch Woodland", swatch: { r: 181, g: 146, b: 57 },
  trees: 1.4, edgeTrees: 0.8, glades: 0.4, groves: 0.85, edgeShrink: 0.78,
  canopy: [{ species: "autumnlarch", minHeight: 10, maxHeight: 16, ratio: 3 }, { species: "larch", minHeight: 9, maxHeight: 14, ratio: 2 }],
  under: [{ species: "bush", minHeight: 1.5, maxHeight: 2.6, ratio: 1 }],
  underShare: 0.15, edgeUnder: 0.45,
});

export const hazelWoodlandEdge = /* @__PURE__ */ forest({
  name: "hazel-woodland-edge", label: "Hazel Woodland Edge", swatch: { r: 105, g: 139, b: 61 },
  trees: 1.5, edgeTrees: 1.1, glades: 0.3, edgeShrink: 0.9,
  canopy: [{ species: "hazel", minHeight: 3, maxHeight: 5.2, ratio: 8 }, { species: "oak", minHeight: 6, maxHeight: 8.5, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.5, ratio: 1 }],
  underShare: 0.3, edgeUnder: 0.4,
});

// Fruit trees in rows: one a cell on its centre, the odd one missing.
export const villageOrchard = /* @__PURE__ */ forest({
  name: "village-orchard", label: "Village Orchard", swatch: { r: 106, g: 142, b: 65 }, floor: { r: 104, g: 138, b: 60 },
  trees: 0.86, rows: true, edgeShrink: 0.95, slopeThin: 0,
  canopy: [{ species: "orchard", minHeight: 4, maxHeight: 6.2, ratio: 1 }],
});

/**
 * Every woods type with the name of its exported constant (the woods module's
 * bundle entry, generate.ts). Names are stored in the game's maps: never rename
 * or remove a shipped one.
 */
export const WOODS: ReadonlyArray<{ design: WoodsDesign; source: string }> = [
  { design: pineForest, source: "pineForest" },
  { design: oakWoods, source: "oakWoods" },
  { design: mixedWoods, source: "mixedWoods" },
  { design: scrub, source: "scrub" },
  { design: palms, source: "palms" },
  { design: tropicalForest, source: "tropicalForest" },
  { design: highMountainForest, source: "highMountainForest" },
  { design: park, source: "park" },
  { design: scotsPineWoodland, source: "scotsPineWoodland" },
  { design: larchWoodland, source: "larchWoodland" },
  { design: autumnLarchWoodland, source: "autumnLarchWoodland" },
  { design: hazelWoodlandEdge, source: "hazelWoodlandEdge" },
  { design: villageOrchard, source: "villageOrchard" },
];
