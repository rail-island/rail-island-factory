// The woods types: what grows on a cell the game paints with one. Each is a
// distribution function keyed by a stable name (woodsApi.ts, docs/models/woods.md);
// the build bundles them all, with the trees, into export/woods.js and lists them
// in woods.meta.json. No `node:` imports.

import {
  DENSITY_PARAM, MAX_TREES_PER_CELL, cellSeed, draw, edgeness, field, onRock, put, resolveWoodsParams, treeSeedOf,
  type CellContext, type TreeSlot, type WoodsDesign, type WoodsParam, type WoodsParamValues, type WoodsPlanter,
} from "./woodsApi.ts";
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
 *   look        each tree one of its species' five shapes (its seed), its own width,
 *               lean, brightness and warm/cool cast, and a grove a shared tone
 *               from the same field
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
  /**
   * Granite boulders (rocks.ts) among the trees: expected per cell inside the wood
   * and at its edge (defaults to `boulders`), and their height range in studs. They
   * take the slots the trees leave and stand clear of the trees.
   */
  boulders?: number;
  edgeBoulders?: number;
  boulderHeight?: [number, number];
  /**
   * The chance a top spot of a stored rock (CellContext.tops) grows a tree: a canopy
   * tree, shorter, standing on the rock (default 0.7).
   */
  topTrees?: number;
}

// The quarters of a cell, in an order that spreads the first two apart.
const QUARTERS: ReadonlyArray<[number, number]> = [[-0.25, -0.25], [0.25, 0.25], [0.25, -0.25], [-0.25, 0.25]];

function weighted(mix: readonly MixEntry[], u: number): MixEntry {
  const total = mix.reduce((s, m) => s + m.ratio, 0);
  let acc = u * total;
  for (const m of mix) if ((acc -= m.ratio) < 0) return m;
  return mix[mix.length - 1]!;
}

/**
 * The spec heights were drawn about 15% taller than the classic presets; the
 * trees are drawn at the classic sizes again (what the game's master grew).
 */
const HEIGHT = 1 / 1.15;

/** The boulder species the woods plant (rocks.ts); the towers, pinnacles and crags are the game's stored rocks. */
const BOULDER = "granite-boulder";
/** A boulder's buried share (rocks.ts BOULDER_SINK): its slot's lift is minus this much of its height. */
const BOULDER_SINK = 0.25;
/** How close, in cell widths, a boulder may stand to a tree's trunk. */
const BOULDER_CLEAR = 0.28;

function forest(spec: ForestSpec): WoodsPlanter {
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
    const height = (m.minHeight + draw(seed, 20 + k) * span) * size * HEIGHT;
    put(out, m.species, x, z, draw(seed, 30 + k) * 360, height,
      0.88 + 0.28 * draw(seed, 40 + k),
      (draw(seed, 50 + k) - 0.5) * 0.14,
      Math.min(1.25, Math.max(0.75, 0.88 + 0.22 * draw(seed, 60 + k) + tone * 0.12)),
      Math.min(1, Math.max(-1, (draw(seed, 70 + k) - 0.5) * 0.9 + tone * 0.7)),
      // which of the species' five shapes: every one of them grows in every wood
      treeSeedOf(draw(seed, 120 + k)));
  };
  const boulders = spec.boulders ?? 0;
  const edgeBoulders = spec.edgeBoulders ?? boulders;
  const [boulderMin, boulderMax] = spec.boulderHeight ?? [1.2, 2.6];
  const topTrees = spec.topTrees ?? 0.7;
  /** Trees on the tops of stored rocks: a canopy tree, shorter, lifted onto the rock. Returns the slots used. */
  const plantTops = (ctx: CellContext, out: TreeSlot[], seed: number, tone: number): number => {
    let w = 0;
    const tops = ctx.tops ?? [];
    for (let i = 0; i < tops.length && w < MAX_TREES_PER_CELL; i++) {
      const top = tops[i]!;
      if (draw(seed, 180 + i) >= topTrees) continue;
      const m = weighted(canopy, draw(seed, 190 + i));
      // a crown's soil is thin: a tree up there is smaller, and no taller than its room allows
      const cap = Math.max(0.35, Math.min(0.7, top.r / 3));
      plant(out[w]!, m, Math.max(-0.5, Math.min(0.5, top.x)), Math.max(-0.5, Math.min(0.5, top.z)), seed, 8 + i, cap, tone);
      out[w]!.lift = top.lift;
      w++;
    }
    return w;
  };
  /** Boulders in the slots the trees left, clear of the trees and off the stored rocks. Returns the slots used in all. */
  const plantBoulders = (ctx: CellContext, out: TreeSlot[], seed: number, edge: number, w: number): number => {
    if (boulders <= 0 && edgeBoulders <= 0) return w;
    const expected = boulders + (edgeBoulders - boulders) * edge;
    const whole = Math.floor(expected);
    const count = whole + (draw(seed, 140) < expected - whole ? 1 : 0);
    const trees = w;
    for (let b = 0; b < count && w < MAX_TREES_PER_CELL; b++) {
      const x = (draw(seed, 150 + b * 2) - 0.5) * 0.9;
      const z = (draw(seed, 151 + b * 2) - 0.5) * 0.9;
      if (onRock(ctx.rocks, x, z)) continue;
      let clear = true;
      for (let t = 0; t < w && clear; t++) if (Math.hypot(out[t]!.x - x, out[t]!.z - z) < (t < trees ? BOULDER_CLEAR : BOULDER_CLEAR * 0.8)) clear = false;
      if (!clear) continue;
      const h = boulderMin + draw(seed, 165 + b) * (boulderMax - boulderMin);
      // `h` is the boulder's full height; its foot is sunk into the ground (a negative lift)
      put(out[w]!, BOULDER, x, z, draw(seed, 160 + b) * 360, h,
        0.85 + 0.5 * draw(seed, 170 + b), 0, 0.88 + 0.22 * draw(seed, 175 + b), 0, treeSeedOf(draw(seed, 178 + b)), -BOULDER_SINK * h);
      w++;
    }
    return w;
  };
  return {
    distribute(ctx: CellContext, out: TreeSlot[]): number {
      const seed = cellSeed(ctx.gx, ctx.gz, ctx.seed);
      const edge = edgeness(ctx.mask);
      const tone = field(ctx.gx, ctx.gz, 6, ctx.seed, 3) - 0.5;
      const size = (1 - (1 - edgeShrink) * edge) * (1 - altitude * Math.max(0, ctx.height) / 100);
      // trees on a stored rock's top come first: there are few, and they are the rock city's crowns
      const lifted = ctx.tops?.length ? plantTops(ctx, out, seed, tone) : 0;
      if (spec.rows) {
        // an orchard: one tree a cell on its centre, the odd gap where one died
        if (draw(seed, 0) >= spec.trees || lifted >= MAX_TREES_PER_CELL) return lifted;
        const x = (draw(seed, 1) - 0.5) * 0.08, z = (draw(seed, 2) - 0.5) * 0.08;
        if (onRock(ctx.rocks, x, z)) return lifted;
        plant(out[lifted]!, weighted(canopy, draw(seed, 5)), x, z, seed, 0, Math.max(0.4, size), tone);
        return lifted + 1;
      }
      let expected = spec.trees + (edgeTrees - spec.trees) * edge;
      if (glades > 0) expected *= 1 - glades * smoothstep(0.5, 0.8, field(ctx.gx, ctx.gz, 9, ctx.seed, 1));
      expected *= 1 - slopeThin * Math.min(1, Math.max(0, ctx.slope) / 45);
      const whole = Math.floor(expected);
      const n = Math.min(MAX_TREES_PER_CELL - lifted, whole + (draw(seed, 0) < expected - whole ? 1 : 0));
      if (n <= 0) return plantBoulders(ctx, out, seed, edge, lifted);
      const share = underShare + (edgeUnder - underShare) * edge;
      const groveField = field(ctx.gx, ctx.gz, 7, ctx.seed, 2);
      const start = Math.floor(draw(seed, 1) * 4);
      let canopyTrees = 0;
      let w = lifted;
      // which quarters a tree stands in: one that lands on a stored rock moves to a free quarter
      const taken = [false, false, false, false];
      for (let k = 0; k < n; k++) {
        const isUnder = under.length > 0 && (k > 0 || n === 1) && draw(seed, 80 + k) < share && !(k === 0 && edge < 0.3);
        const m = isUnder
          ? weighted(under, draw(seed, 90 + k))
          : groves > 0 && draw(seed, 100 + k) < groves ? grovePick(groveField) : weighted(canopy, draw(seed, 110 + k));
        const q = (start + k) % 4;
        const [qx, qz] = n === 1 ? [0, 0] : QUARTERS[q]!;
        const jitter = n === 1 ? 0.6 : 0.36;
        let x = Math.max(-0.5, Math.min(0.5, qx + (draw(seed, 2 + k * 2) - 0.5) * jitter));
        let z = Math.max(-0.5, Math.min(0.5, qz + (draw(seed, 3 + k * 2) - 0.5) * jitter));
        if (onRock(ctx.rocks, x, z)) {
          const free = [0, 1, 2, 3].map((i) => (q + i) % 4).find((i) => !taken[i] && !onRock(ctx.rocks, QUARTERS[i]![0], QUARTERS[i]![1]));
          if (free === undefined) continue;
          taken[free] = true;
          [x, z] = QUARTERS[free]!;
        } else if (n > 1) taken[q] = true;
        if (!isUnder) canopyTrees++;
        plant(out[w]!, m, x, z, seed, k, isUnder ? 1 : size, tone);
        w++;
      }
      // shrubs only stand beside a tree, not instead of the stand
      if (canopyTrees === 0 && w - lifted > 1) w = lifted + 1;
      return plantBoulders(ctx, out, seed, edge, w);
    },
    sample(u: number, v: number, out: TreeSlot): void {
      const m = weighted(canopy, u);
      put(out, m.species, 0, 0, 0, (m.minHeight + v * (Math.max(m.maxHeight, m.minHeight) - m.minHeight)) * HEIGHT,
        0.92 + 0.16 * v, 0, 0.92 + 0.16 * u, (u - 0.5) * 0.6,
        // a shape decorrelated from the species pick and the height, which u and v already drive
        treeSeedOf(draw(Math.floor(u * 4294967296) | 0, Math.floor(v * 4294967296) | 0)));
    },
  };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * How many trees a cell grows at each density grade, against the type's normal.
 * Normal is the density the game's classic woods had (`classic` below); dense is
 * the full stylised forest, sparse a thin one.
 */
const DENSITY_FACTOR: Record<string, number> = { sparse: 0.5, normal: 1, dense: 2.5 };

/** A three-value parameter: its name, title, values as [token, title], and default. */
function param(name: string, title: string, values: Array<[string, string]>, def: string): WoodsParam {
  return { name, title, values: values.map(([value, t]) => ({ value, title: t })), default: def };
}

/**
 * The forests that can grow boulders (docs/models/rocks.md): `none` by default, so
 * a map painted before the parameter grows exactly the trees it grew.
 */
const BOULDERS_PARAM = (): WoodsParam => param("boulders", "Boulders", [["none", "None"], ["few", "A few"], ["many", "Many"]], "none");
/** Boulders a cell, inside and at the edge, for a `boulders` value. */
const bouldersOf = (value: string | undefined): { boulders?: number; edgeBoulders?: number } =>
  value === "many" ? { boulders: 0.5, edgeBoulders: 0.6 } : value === "few" ? { boulders: 0.16, edgeBoulders: 0.22 } : {};

/** Scales a mix entry's weight (0 drops it). */
const weigh = (m: MixEntry, k: number): MixEntry => ({ ...m, ratio: m.ratio * k });
/** Scales a mix entry's heights. */
const grow = (m: MixEntry, k: number): MixEntry => ({ ...m, minHeight: m.minHeight * k, maxHeight: m.maxHeight * k });
/** A mix without the entries whose weight came out 0. */
const kept = (mix: MixEntry[]): MixEntry[] => mix.filter((m) => m.ratio > 0);

/**
 * A woods type: its look, its parameters (`density` first, then its own) and the
 * forest each choice of them plants. `specFor` gets every value resolved and
 * returns the forest's shape, its tree counts in relative terms; `scale` brings
 * them to the type's NORMAL density -- the trees a cell grew in the game's classic
 * woods, its density percent over 100, averaged over a large wood's interior,
 * glades included (calibrated, test/woods.test.ts) -- and the density grade is
 * applied on top. Each choice is compiled once and kept, so the game's per-cell
 * calls cost nothing more. A spec may give its own `swatch` and `floor` (an autumn
 * wood); they are the variant's.
 */
function woodsType(
  look: { name: string; label: string; swatch: Rgb; floor?: Rgb },
  own: WoodsParam[],
  scale: number,
  specFor: (v: WoodsParamValues) => ForestSpec,
): WoodsDesign {
  const params = [DENSITY_PARAM, ...own];
  const planters = new Map<string, WoodsPlanter>();
  const variant = (values: WoodsParamValues = {}): WoodsPlanter => {
    const v = resolveWoodsParams(params, values);
    const key = params.map((p) => v[p.name]).join("|");
    let planter = planters.get(key);
    if (!planter) {
      const raw = specFor(v);
      const grade = DENSITY_FACTOR[v.density!] ?? 1;
      const k = grade * scale;
      // boulders follow the density grade, not the type's tree scale: a `few` is a few boulders in every wood
      const spec = raw.boulders === undefined ? raw : {
        ...raw,
        boulders: Math.min(MAX_TREES_PER_CELL, raw.boulders * grade),
        edgeBoulders: Math.min(MAX_TREES_PER_CELL, (raw.edgeBoulders ?? raw.boulders) * grade),
      };
      planter = forest(spec.rows
        ? { ...spec, trees: Math.min(1, spec.trees * k) }
        : { ...spec, trees: Math.min(MAX_TREES_PER_CELL, spec.trees * k), edgeTrees: Math.min(MAX_TREES_PER_CELL, (spec.edgeTrees ?? spec.trees * 0.6) * k) });
      if (spec.swatch !== look.swatch) planter = { ...planter, swatch: spec.swatch, floor: spec.floor ?? floorOf(spec.swatch) };
      planters.set(key, planter);
    }
    return planter;
  };
  const defaults = variant();
  return {
    name: look.name,
    label: look.label,
    swatch: look.swatch,
    floor: look.floor ?? floorOf(look.swatch),
    params,
    variant,
    distribute: defaults.distribute,
    sample: defaults.sample,
  };
}

// The woods types. Heights are studs, written about 15% taller than the classic
// presets and drawn at the classic sizes (HEIGHT).
// The number after the parameters is the type's density scale: its normal grade
// plants about as many trees as the classic woods type (its density percent in a
// comment), the counts in the spec giving only the shape of the wood.

const PINE = { name: "pine-forest", label: "Pine Forest", swatch: { r: 40, g: 92, b: 60 } };
export const pineForest = /* @__PURE__ */ woodsType(PINE, [
  param("age", "Age", [["young", "Young"], ["mature", "Mature"], ["old", "Old growth"]], "mature"),
  BOULDERS_PARAM(),
], 0.268 /* classic 40% */, (v) => {
  const k = v.age === "young" ? 0.6 : v.age === "old" ? 1.2 : 1;
  return {
    ...PINE,
    ...bouldersOf(v.boulders),
    trees: v.age === "young" ? 2.2 : v.age === "old" ? 1.3 : 1.7, edgeTrees: 0.9, glades: v.age === "old" ? 0.65 : 0.5, edgeShrink: 0.72,
    canopy: [grow({ species: "pine", minHeight: 10, maxHeight: 16.5, ratio: 1 }, k)],
    under: [{ species: "pine", minHeight: 4, maxHeight: 7, ratio: 3 }, { species: "bush", minHeight: 2, maxHeight: 3.2, ratio: 2 }],
    underShare: v.age === "old" ? 0.25 : 0.12, edgeUnder: 0.5,
  };
});

const OAK = { name: "oak-woods", label: "Oak Woods", swatch: { r: 74, g: 120, b: 54 } };
export const oakWoods = /* @__PURE__ */ woodsType(OAK, [
  param("undergrowth", "Undergrowth", [["none", "None"], ["some", "Some"], ["thick", "Thick"]], "some"),
], 0.27 /* classic 30% */, (v) => ({
  ...OAK,
  trees: 1.25, edgeTrees: 0.8, glades: 0.45, edgeShrink: 0.78,
  canopy: [{ species: "oak", minHeight: 8, maxHeight: 12, ratio: 1 }],
  under: v.undergrowth === "none" ? [] : [{ species: "hazel", minHeight: 2.6, maxHeight: 4.2, ratio: 2 }, { species: "bush", minHeight: 2, maxHeight: 3.3, ratio: 3 }],
  underShare: v.undergrowth === "thick" ? 0.5 : 0.25, edgeUnder: v.undergrowth === "thick" ? 0.75 : 0.6,
}));

const MIXED = { name: "mixed-woods", label: "Mixed Woods", swatch: { r: 58, g: 106, b: 58 } };
export const mixedWoods = /* @__PURE__ */ woodsType(MIXED, [
  param("mix", "Mix", [["broadleaf", "Mostly broadleaf"], ["balanced", "Balanced"], ["conifer", "Mostly conifer"]], "balanced"),
  BOULDERS_PARAM(),
], 0.326 /* classic 50% */, (v) => {
  const broad = v.mix === "broadleaf" ? 2.2 : v.mix === "conifer" ? 0.35 : 1;
  const conifer = v.mix === "conifer" ? 2.2 : v.mix === "broadleaf" ? 0.3 : 1;
  return {
    ...MIXED,
    ...bouldersOf(v.boulders),
    trees: 1.7, edgeTrees: 0.9, glades: 0.4, groves: 0.75, edgeShrink: 0.75,
    canopy: [
      weigh({ species: "oak", minHeight: 8, maxHeight: 11.5, ratio: 8 }, broad),
      weigh({ species: "pine", minHeight: 10, maxHeight: 16, ratio: 7 }, conifer),
      weigh({ species: "birch", minHeight: 8, maxHeight: 11, ratio: 3 }, broad),
    ],
    under: [{ species: "bush", minHeight: 2, maxHeight: 3.4, ratio: 3 }, { species: "hazel", minHeight: 2.4, maxHeight: 3.8, ratio: 1 }],
    underShare: 0.3, edgeUnder: 0.6,
  };
});

const SCRUB = { name: "scrub", label: "Scrub", swatch: { r: 108, g: 132, b: 66 } };
export const scrub = /* @__PURE__ */ woodsType(SCRUB, [
  param("trees", "Trees", [["none", "Bushes only"], ["few", "A few"], ["many", "Many"]], "few"),
], 0.287 /* classic 22% */, (v) => ({
  ...SCRUB,
  trees: 0.9, edgeTrees: 0.5, glades: 0.6, groves: 0.3, edgeShrink: 0.9, slopeThin: 0.1,
  canopy: kept([
    { species: "bush", minHeight: 2.0, maxHeight: 3.8, ratio: 6 },
    { species: "oak", minHeight: 4.2, maxHeight: 6.8, ratio: v.trees === "none" ? 0 : v.trees === "many" ? 4 : 1 },
  ]),
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.4, ratio: 1 }],
  underShare: 0.4, edgeUnder: 0.5,
}));

const PALMS = { name: "palms", label: "Palms", swatch: { r: 96, g: 150, b: 72 } };
export const palms = /* @__PURE__ */ woodsType(PALMS, [
  param("undergrowth", "Undergrowth", [["none", "None"], ["some", "Some"], ["thick", "Thick"]], "some"),
], 0.364 /* classic 40% */, (v) => ({
  ...PALMS,
  trees: 1.2, edgeTrees: 0.7, glades: 0.35, edgeShrink: 0.85,
  canopy: [{ species: "palm", minHeight: 9, maxHeight: 14, ratio: 1 }],
  under: v.undergrowth === "none" ? [] : [{ species: "bush", minHeight: 1.8, maxHeight: 3, ratio: 1 }],
  underShare: v.undergrowth === "thick" ? 0.45 : 0.2, edgeUnder: v.undergrowth === "thick" ? 0.6 : 0.35,
}));

const TROPICAL = { name: "tropical-forest", label: "Tropical Forest", swatch: { r: 96, g: 150, b: 72 } };
export const tropicalForest = /* @__PURE__ */ woodsType(TROPICAL, [
  param("palms", "Palms", [["few", "Few"], ["some", "Some"], ["many", "Many"]], "some"),
], 0.357 /* classic 100% */, (v) => ({
  ...TROPICAL,
  trees: 2.8, edgeTrees: 1.6, groves: 0.4, edgeShrink: 0.8,
  canopy: [
    { species: "oak", minHeight: 6.5, maxHeight: 10, ratio: 6 },
    { species: "palm", minHeight: 8, maxHeight: 12.5, ratio: v.palms === "few" ? 2 : v.palms === "many" ? 14 : 6 },
  ],
  under: [{ species: "bush", minHeight: 2.4, maxHeight: 4, ratio: 1 }],
  underShare: 0.45, edgeUnder: 0.6,
}));

// A high-altitude treeline: short conifers that shrink further with height, mixed with low bush.
const MOUNTAIN = { name: "high-mountain-forest", label: "High Mountain Forest", swatch: { r: 56, g: 96, b: 74 } };
export const highMountainForest = /* @__PURE__ */ woodsType(MOUNTAIN, [
  param("conifer", "Conifer", [["pine", "Mostly pine"], ["mixed", "Pine and spruce"], ["spruce", "Mostly spruce"]], "mixed"),
  BOULDERS_PARAM(),
], 0.394 /* classic 34% */, (v) => ({
  ...MOUNTAIN,
  ...bouldersOf(v.boulders),
  trees: 1.0, edgeTrees: 0.55, glades: 0.55, groves: 0.5, edgeShrink: 0.75, altitude: 0.12, slopeThin: 0.45,
  canopy: [
    { species: "pine", minHeight: 4.5, maxHeight: 7.5, ratio: v.conifer === "spruce" ? 1 : v.conifer === "pine" ? 14 : 8 },
    { species: "spruce", minHeight: 4.5, maxHeight: 7, ratio: v.conifer === "pine" ? 1 : v.conifer === "spruce" ? 14 : 6 },
  ],
  under: [{ species: "bush", minHeight: 1.6, maxHeight: 2.8, ratio: 1 }],
  underShare: 0.3, edgeUnder: 0.55,
}));

// City greenery on the open ground of a city block: specimen trees standing apart,
// so the lawn stays visible.
const PARK = { name: "park", label: "Park", swatch: { r: 86, g: 138, b: 66 }, floor: { r: 98, g: 140, b: 62 } };
export const park = /* @__PURE__ */ woodsType(PARK, [
  param("planting", "Planting", [["mixed", "Mixed"], ["birch", "Birch and aspen"], ["oak", "Oaks"], ["conifer", "Conifers"]], "mixed"),
], 0.741 /* classic 18% */, (v) => ({
  ...PARK,
  trees: 0.24, edgeTrees: 0.2, edgeShrink: 1, slopeThin: 0,
  canopy: kept([
    { species: "aspen", minHeight: 9, maxHeight: 13.5, ratio: v.planting === "mixed" ? 8 : v.planting === "birch" ? 10 : 0 },
    { species: "birch", minHeight: 8, maxHeight: 11.5, ratio: v.planting === "mixed" ? 6 : v.planting === "birch" ? 10 : 0 },
    { species: "oak", minHeight: 8, maxHeight: 11.5, ratio: v.planting === "mixed" ? 5 : v.planting === "oak" ? 14 : 0 },
    { species: "spruce", minHeight: 7, maxHeight: 10, ratio: v.planting === "mixed" ? 3 : v.planting === "conifer" ? 10 : 0 },
    { species: "scotspine", minHeight: 9, maxHeight: 13, ratio: v.planting === "conifer" ? 5 : 0 },
    { species: "bush", minHeight: 2, maxHeight: 3.2, ratio: 6 },
  ]),
}));

const SCOTS = { name: "scots-pine-woodland", label: "Scots Pine Woodland", swatch: { r: 74, g: 108, b: 72 } };
export const scotsPineWoodland = /* @__PURE__ */ woodsType(SCOTS, [
  param("birch", "Birch", [["none", "None"], ["some", "Some"], ["many", "Many"]], "some"),
  BOULDERS_PARAM(),
], 0.319 /* classic 28% */, (v) => ({
  ...SCOTS,
  ...bouldersOf(v.boulders),
  trees: 1.0, edgeTrees: 0.6, glades: 0.5, edgeShrink: 0.85,
  canopy: kept([
    { species: "scotspine", minHeight: 11.5, maxHeight: 17, ratio: 1 },
    { species: "birch", minHeight: 8, maxHeight: 11, ratio: v.birch === "many" ? 0.6 : 0 },
  ]),
  under: kept([
    { species: "birch", minHeight: 7, maxHeight: 10, ratio: v.birch === "none" ? 0 : v.birch === "many" ? 4 : 2 },
    { species: "bush", minHeight: 1.8, maxHeight: 3, ratio: 3 },
  ]),
  underShare: 0.3, edgeUnder: 0.55,
}));

// A larch wood through the year: summer green, or autumn with golden groves among
// green ones (the grove field mixes the two larches), and spruce among the larches.
// The autumn seasons were a woods type of their own, autumn-larch-woodland, which
// the game now reads as this one's peak autumn without spruce.
const LARCH = { name: "larch-woodland", label: "Larch Woodland", swatch: { r: 111, g: 150, b: 70 } };
const AUTUMN_SWATCH = { r: 181, g: 146, b: 57 };
export const larchWoodland = /* @__PURE__ */ woodsType(LARCH, [
  param("season", "Season", [["summer", "Summer"], ["early", "Early autumn"], ["peak", "Peak autumn"], ["late", "Late autumn"]], "summer"),
  param("spruce", "Spruce", [["none", "No spruce"], ["some", "Some spruce"], ["many", "Much spruce"]], "some"),
], 0.238 /* classic 30% */, (v) => {
  const spruce = { species: "spruce" as const, minHeight: 8, maxHeight: 11.5, ratio: v.spruce === "none" ? 0 : v.spruce === "many" ? 4 : 1 };
  const under = [{ species: "bush" as const, minHeight: 1.5, maxHeight: 2.6, ratio: 1 }];
  if (v.season === "summer") {
    return {
      ...LARCH,
      trees: 1.4, edgeTrees: 0.8, glades: 0.4, groves: 0.6, edgeShrink: 0.78,
      canopy: kept([{ species: "larch", minHeight: 10, maxHeight: 16, ratio: 5 }, spruce]),
      under, underShare: 0.15, edgeUnder: 0.45,
    };
  }
  return {
    ...LARCH,
    swatch: AUTUMN_SWATCH,
    trees: 1.4, edgeTrees: 0.8, glades: 0.4, groves: 0.85, edgeShrink: 0.78,
    canopy: kept([
      { species: "autumnlarch", minHeight: 10, maxHeight: 16, ratio: v.season === "early" ? 1 : 3 },
      { species: "larch", minHeight: 9, maxHeight: 14, ratio: v.season === "early" ? 3 : v.season === "late" ? 0 : 2 },
      spruce,
    ]),
    under, underShare: 0.15, edgeUnder: 0.45,
  };
});

const HAZEL = { name: "hazel-woodland-edge", label: "Hazel Woodland Edge", swatch: { r: 105, g: 139, b: 61 } };
export const hazelWoodlandEdge = /* @__PURE__ */ woodsType(HAZEL, [
  param("oaks", "Oaks", [["none", "None"], ["few", "A few"], ["many", "Many"]], "few"),
], 0.173 /* classic 24% */, (v) => ({
  ...HAZEL,
  trees: 1.5, edgeTrees: 1.1, glades: 0.3, edgeShrink: 0.9,
  canopy: kept([
    { species: "hazel", minHeight: 3, maxHeight: 5.2, ratio: 8 },
    { species: "oak", minHeight: 6, maxHeight: 8.5, ratio: v.oaks === "none" ? 0 : v.oaks === "many" ? 4 : 1 },
  ]),
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.5, ratio: 1 }],
  underShare: 0.3, edgeUnder: 0.4,
}));

// Fruit trees in rows: one a cell on its centre, the odd one missing -- or, as an
// old meadow orchard, scattered where they were planted over the years.
const ORCHARD = { name: "village-orchard", label: "Village Orchard", swatch: { r: 106, g: 142, b: 65 }, floor: { r: 104, g: 138, b: 60 } };
export const villageOrchard = /* @__PURE__ */ woodsType(ORCHARD, [
  param("layout", "Layout", [["rows", "Rows"], ["scattered", "Scattered meadow"]], "rows"),
], 0.278 /* classic 24% */, (v) => v.layout === "scattered"
  ? {
      ...ORCHARD,
      trees: 0.7, edgeTrees: 0.6, edgeShrink: 0.95, slopeThin: 0,
      canopy: [{ species: "orchard", minHeight: 4, maxHeight: 6.8, ratio: 1 }],
      under: [{ species: "hazel", minHeight: 1.8, maxHeight: 2.8, ratio: 1 }],
      underShare: 0.1, edgeUnder: 0.25,
    }
  : {
      ...ORCHARD,
      trees: 0.86, rows: true, edgeShrink: 0.95, slopeThin: 0,
      canopy: [{ species: "orchard", minHeight: 4, maxHeight: 6.2, ratio: 1 }],
    });

// ---- the rock woods types (docs/models/rocks.md) ---------------------------------
// What grows among rocks. The towers, pinnacles and crags themselves are the
// game's stored rocks, which hand each cell where they stand (CellContext.rocks)
// and where their tops are (CellContext.tops): these plant the trees in the lanes
// between them and on their crowns, and the boulders at their feet. Each can be
// painted on open ground too -- a boulder field needs no stored rock at all.

// A rock city: sandstone towers in clusters, pines and birches in the lanes and on
// the crowns (Adrspach, Prachov), and fallen blocks.
const ROCK_CITY = { name: "rock-city", label: "Rock City", swatch: { r: 112, g: 118, b: 82 }, floor: { r: 120, g: 108, b: 80 } };
export const rockCity = /* @__PURE__ */ woodsType(ROCK_CITY, [
  param("trees", "Trees", [["pine", "Mostly pine"], ["mixed", "Pine and birch"], ["birch", "Mostly birch"]], "mixed"),
], 0.27 /* 36% */, (v) => ({
  ...ROCK_CITY,
  trees: 1.5, edgeTrees: 0.9, glades: 0.3, groves: 0.5, edgeShrink: 0.8, slopeThin: 0.15,
  canopy: kept([
    { species: "pine", minHeight: 9, maxHeight: 15, ratio: v.trees === "birch" ? 1 : v.trees === "pine" ? 8 : 4 },
    { species: "scotspine", minHeight: 9, maxHeight: 14, ratio: v.trees === "birch" ? 0 : 2 },
    { species: "birch", minHeight: 7, maxHeight: 11, ratio: v.trees === "birch" ? 8 : v.trees === "pine" ? 0.5 : 3 },
  ]),
  under: [{ species: "bush", minHeight: 1.6, maxHeight: 2.8, ratio: 2 }, { species: "pine", minHeight: 3, maxHeight: 5, ratio: 1 }],
  underShare: 0.25, edgeUnder: 0.5,
  boulders: 0.18, edgeBoulders: 0.25, boulderHeight: [1.2, 3.2], topTrees: 0.85,
}));

// A boulder field: granite boulders strewn over the ground, a few pines and
// bushes between them.
const BOULDER_FIELD = { name: "boulder-field", label: "Boulder Field", swatch: { r: 128, g: 128, b: 112 }, floor: { r: 118, g: 116, b: 98 } };
export const boulderField = /* @__PURE__ */ woodsType(BOULDER_FIELD, [
  param("trees", "Trees", [["none", "None"], ["few", "A few"], ["many", "Many"]], "few"),
], 0.6 /* trees, besides the boulders */, (v) => ({
  ...BOULDER_FIELD,
  trees: v.trees === "none" ? 0 : v.trees === "many" ? 0.8 : 0.3, edgeTrees: v.trees === "none" ? 0 : v.trees === "many" ? 0.5 : 0.2,
  glades: 0.4, edgeShrink: 0.75,
  canopy: [{ species: "pine", minHeight: 6, maxHeight: 11, ratio: 3 }, { species: "birch", minHeight: 5, maxHeight: 9, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.6, ratio: 1 }],
  underShare: 0.4, edgeUnder: 0.6,
  boulders: 1.3, edgeBoulders: 0.8, boulderHeight: [1, 3.4],
}));

// Crags: scrub and stunted pines between rock outcrops, on slopes and along the
// tops of escarpments.
const CRAGS = { name: "crags", label: "Crags", swatch: { r: 110, g: 116, b: 88 }, floor: { r: 112, g: 106, b: 84 } };
export const crags = /* @__PURE__ */ woodsType(CRAGS, [
  param("scrub", "Scrub", [["few", "A little"], ["some", "Some"], ["thick", "Thick"]], "some"),
], 0.4 /* 30% */, (v) => ({
  ...CRAGS,
  trees: 1.0, edgeTrees: 0.6, glades: 0.5, groves: 0.3, edgeShrink: 0.8, altitude: 0.1, slopeThin: 0.1,
  canopy: [{ species: "pine", minHeight: 4, maxHeight: 8, ratio: 3 }, { species: "spruce", minHeight: 4, maxHeight: 7, ratio: 1 }],
  under: [{ species: "bush", minHeight: 1.4, maxHeight: 2.6, ratio: 1 }],
  underShare: v.scrub === "thick" ? 0.7 : v.scrub === "few" ? 0.2 : 0.45, edgeUnder: v.scrub === "thick" ? 0.85 : 0.6,
  boulders: 0.35, edgeBoulders: 0.45, boulderHeight: [1, 2.6], topTrees: 0.6,
}));

// A stone forest: limestone pinnacles packed close, shrubs and the odd small tree
// in the gaps (Shilin, the tsingy).
const STONE_FOREST = { name: "stone-forest", label: "Stone Forest", swatch: { r: 150, g: 148, b: 126 }, floor: { r: 138, g: 132, b: 110 } };
export const stoneForest = /* @__PURE__ */ woodsType(STONE_FOREST, [
  param("shrubs", "Shrubs", [["few", "Few"], ["some", "Some"], ["many", "Many"]], "some"),
], 0.3 /* 20% */, (v) => ({
  ...STONE_FOREST,
  trees: v.shrubs === "many" ? 1.3 : v.shrubs === "few" ? 0.5 : 0.85, edgeTrees: 0.5, glades: 0.3, edgeShrink: 0.9, slopeThin: 0.1,
  canopy: [{ species: "bush", minHeight: 1.8, maxHeight: 3.4, ratio: 5 }, { species: "oak", minHeight: 4, maxHeight: 6.5, ratio: 1 }],
  boulders: 0.08, boulderHeight: [0.8, 1.8], topTrees: 0.3,
}));

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
  { design: hazelWoodlandEdge, source: "hazelWoodlandEdge" },
  { design: villageOrchard, source: "villageOrchard" },
  { design: rockCity, source: "rockCity" },
  { design: boulderField, source: "boulderField" },
  { design: crags, source: "crags" },
  { design: stoneForest, source: "stoneForest" },
];
