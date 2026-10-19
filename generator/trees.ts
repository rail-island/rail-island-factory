// The tree species: one design per species (proc-tree-<species>; the two larches
// are one design, proc-tree-larch, with a `season` parameter), each with four
// levels of detail -- `high` (the design), `low` (its buildLod), `coarse`
// (buildCoarse, the trees' own third level) and `max` (buildMax, a close-up). The
// game draws them instanced across whole forests, so every species is two
// materials, `trunk` and `foliage`, and is base-anchored at y = 0. Units are the
// game's studs, numerically: the game scales each tree to the height its woods type
// asks for (docs/models/trees.md).
//
// Every species is a seeded layout drawn by the tree kit (treeKit.ts): the oak
// (oak.ts), the leafy species (leafyTrees.ts), the conifers (conifers.ts), the palm
// (palm.ts) and the dead tree (deadTree.ts). This file is their registry. No
// `node:` imports.

import { oakParts, oakOptions, OAK_COLORS, OAK_PARAMS } from "./oak.ts";
import { isLeafy, leafyOptions, leafyParts, LEAFY_COLORS, LEAFY_PARAMS } from "./leafyTrees.ts";
import { coniferOptions, coniferParts, CONIFER_COLORS, isConifer } from "./conifers.ts";
import { palmOptions, palmParts, PALM_COLORS, PALM_PARAMS } from "./palm.ts";
import { deadtreeOptions, deadtreeParts, DEADTREE_COLORS, DEADTREE_PARAMS } from "./deadTree.ts";
import { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { TREE_SEED, type BroadleafOptions, type Parts } from "./treeKit.ts";
import type { Geo, P3 } from "./treeGeo.ts";

/** Every species the game knows, by its stable key (saved in the game's maps). */
export const SPECIES = [
  "pine", "spruce", "oak", "birch", "aspen", "willow", "palm", "bush", "deadtree",
  "scotspine", "larch", "autumnlarch", "hazel", "orchard",
] as const;
export type Species = (typeof SPECIES)[number];

export type TreeDetail = "coarse" | "low" | "high";
type Level = TreeDetail | "max";
type Colors = { trunk: string; foliage: string };

/**
 * Per-species trunk and foliage material colours (sRGB hex): the mid-tone of the
 * crown. The baked vertex colours multiply them: a dark interior and underside,
 * a lit top (docs/models/trees.md).
 */
// Marked pure, so another design's standalone JS can drop this table.
export const TREE_COLORS: Record<Species, Colors> = /* @__PURE__ */ (() => ({
  ...CONIFER_COLORS, ...LEAFY_COLORS, oak: OAK_COLORS, palm: PALM_COLORS, deadtree: DEADTREE_COLORS,
}))();

/** Display titles for the catalog. */
const TITLES: Record<Species, string> = {
  pine: "Pine", spruce: "Spruce", oak: "Oak", birch: "Birch", aspen: "Aspen", willow: "Willow",
  palm: "Palm", bush: "Bush", deadtree: "Dead tree", scotspine: "Mature Scots pine", larch: "European larch",
  autumnlarch: "Autumn larch", hazel: "Hazel", orchard: "Orchard tree",
};

/** The trunk and foliage parts of one species at one level. */
export type TreeParts = Parts;

/** The parts of one species at one level, shaded (tests, the woods previews). */
export function treeParts(species: Species, detail: Level, options?: Partial<BroadleafOptions>): TreeParts {
  if (species === "oak") return oakParts(detail, options);
  if (species === "palm") return palmParts(detail, options);
  if (species === "deadtree") return deadtreeParts(detail, options);
  if (isLeafy(species)) return leafyParts(species, detail, options);
  if (isConifer(species)) return coniferParts(species, detail, options);
  throw new Error(`unknown tree species ${species as string}`);
}

/** A species' kit options for its design's parameter values (the seed; the oak's controls). */
export function treeOptions(species: Species, p?: ParamValues): BroadleafOptions {
  if (species === "oak") return oakOptions(p);
  if (species === "palm") return palmOptions(p);
  if (species === "deadtree") return deadtreeOptions(p);
  if (isLeafy(species)) return leafyOptions(p);
  return coniferOptions(p, species === "larch" || species === "autumnlarch" ? LARCH_PARAMS : undefined);
}

/** One species at one level as a model: the `trunk` and `foliage` materials. */
export function buildTree(species: Species, detail: Level, options?: Partial<BroadleafOptions>): MeshBuilder {
  return treeMesh(TREE_COLORS[species], treeParts(species, detail, options));
}

// The designs' builders call their own species module and this, never the
// dispatch above, so a design's standalone JS carries only its own species.
function treeMesh(colors: Colors, { trunk, foliage, ribbons }: TreeParts): MeshBuilder {
  const m = new MeshBuilder({
    trunk: { color: colors.trunk, roughness: 1 },
    foliage: { color: colors.foliage, roughness: 0.9, ...(ribbons ? { doubleSided: true } : {}) },
  });
  const emit = (mat: string, list: Geo[]) => {
    for (const g of list) {
      const p = g.pos, c = g.col;
      for (let i = 0; i < p.length; i += 9) {
        const a: P3 = [p[i]!, p[i + 1]!, p[i + 2]!], b: P3 = [p[i + 3]!, p[i + 4]!, p[i + 5]!], d: P3 = [p[i + 6]!, p[i + 7]!, p[i + 8]!];
        if (c) m.triShaded(mat, a, b, d, [[c[i]!, c[i + 1]!, c[i + 2]!], [c[i + 3]!, c[i + 4]!, c[i + 5]!], [c[i + 6]!, c[i + 7]!, c[i + 8]!]]);
        else m.tri(mat, a, b, d);
      }
    }
  };
  m.scope("trunk", () => emit("trunk", trunk));
  m.scope("foliage", () => emit("foliage", foliage));
  return m;
}

// One exported build function per species and level: a design's JS model bundles
// the functions it names (jsModel.ts), so each needs its own name.
export const treePine = (p?: ParamValues) => treeMesh(CONIFER_COLORS.pine, coniferParts("pine", "high", coniferOptions(p)));
export const treePineMax = (p?: ParamValues) => treeMesh(CONIFER_COLORS.pine, coniferParts("pine", "max", coniferOptions(p)));
export const treePineLow = (p?: ParamValues) => treeMesh(CONIFER_COLORS.pine, coniferParts("pine", "low", coniferOptions(p)));
export const treePineCoarse = (p?: ParamValues) => treeMesh(CONIFER_COLORS.pine, coniferParts("pine", "coarse", coniferOptions(p)));
export const treeSpruce = (p?: ParamValues) => treeMesh(CONIFER_COLORS.spruce, coniferParts("spruce", "high", coniferOptions(p)));
export const treeSpruceMax = (p?: ParamValues) => treeMesh(CONIFER_COLORS.spruce, coniferParts("spruce", "max", coniferOptions(p)));
export const treeSpruceLow = (p?: ParamValues) => treeMesh(CONIFER_COLORS.spruce, coniferParts("spruce", "low", coniferOptions(p)));
export const treeSpruceCoarse = (p?: ParamValues) => treeMesh(CONIFER_COLORS.spruce, coniferParts("spruce", "coarse", coniferOptions(p)));
export const treeScotspine = (p?: ParamValues) => treeMesh(CONIFER_COLORS.scotspine, coniferParts("scotspine", "high", coniferOptions(p)));
export const treeScotspineMax = (p?: ParamValues) => treeMesh(CONIFER_COLORS.scotspine, coniferParts("scotspine", "max", coniferOptions(p)));
export const treeScotspineLow = (p?: ParamValues) => treeMesh(CONIFER_COLORS.scotspine, coniferParts("scotspine", "low", coniferOptions(p)));
export const treeScotspineCoarse = (p?: ParamValues) => treeMesh(CONIFER_COLORS.scotspine, coniferParts("scotspine", "coarse", coniferOptions(p)));
// The European larch in summer green or autumn gold: one design, two species keys
// (the woods plant `larch` and `autumnlarch`, and the game draws each), the same
// shape for a seed in either season.
export const LARCH_PARAMS: ParamSpec[] = [{
  name: "season", title: "Season",
  values: [{ value: "summer", title: "Summer" }, { value: "autumn", title: "Autumn" }],
  default: "summer",
}, TREE_SEED];
const larchOf = (p?: ParamValues): "larch" | "autumnlarch" => resolveParams(LARCH_PARAMS, p).season === "autumn" ? "autumnlarch" : "larch";
const larch = (p: ParamValues | undefined, detail: Level) => treeMesh(CONIFER_COLORS[larchOf(p)], coniferParts(larchOf(p), detail, coniferOptions(p, LARCH_PARAMS)));
export const treeLarch = (p?: ParamValues) => larch(p, "high");
export const treeLarchMax = (p?: ParamValues) => larch(p, "max");
export const treeLarchLow = (p?: ParamValues) => larch(p, "low");
export const treeLarchCoarse = (p?: ParamValues) => larch(p, "coarse");
export const treeOak = (p?: ParamValues) => treeMesh(OAK_COLORS, oakParts("high", oakOptions(p)));
export const treeOakMax = (p?: ParamValues) => treeMesh(OAK_COLORS, oakParts("max", oakOptions(p)));
export const treeOakLow = (p?: ParamValues) => treeMesh(OAK_COLORS, oakParts("low", oakOptions(p)));
export const treeOakCoarse = (p?: ParamValues) => treeMesh(OAK_COLORS, oakParts("coarse", oakOptions(p)));
export const treeBirch = (p?: ParamValues) => treeMesh(LEAFY_COLORS.birch, leafyParts("birch", "high", leafyOptions(p)));
export const treeBirchMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.birch, leafyParts("birch", "max", leafyOptions(p)));
export const treeBirchLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.birch, leafyParts("birch", "low", leafyOptions(p)));
export const treeBirchCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.birch, leafyParts("birch", "coarse", leafyOptions(p)));
export const treeAspen = (p?: ParamValues) => treeMesh(LEAFY_COLORS.aspen, leafyParts("aspen", "high", leafyOptions(p)));
export const treeAspenMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.aspen, leafyParts("aspen", "max", leafyOptions(p)));
export const treeAspenLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.aspen, leafyParts("aspen", "low", leafyOptions(p)));
export const treeAspenCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.aspen, leafyParts("aspen", "coarse", leafyOptions(p)));
export const treeWillow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.willow, leafyParts("willow", "high", leafyOptions(p)));
export const treeWillowMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.willow, leafyParts("willow", "max", leafyOptions(p)));
export const treeWillowLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.willow, leafyParts("willow", "low", leafyOptions(p)));
export const treeWillowCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.willow, leafyParts("willow", "coarse", leafyOptions(p)));
export const treeBush = (p?: ParamValues) => treeMesh(LEAFY_COLORS.bush, leafyParts("bush", "high", leafyOptions(p)));
export const treeBushMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.bush, leafyParts("bush", "max", leafyOptions(p)));
export const treeBushLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.bush, leafyParts("bush", "low", leafyOptions(p)));
export const treeBushCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.bush, leafyParts("bush", "coarse", leafyOptions(p)));
export const treeHazel = (p?: ParamValues) => treeMesh(LEAFY_COLORS.hazel, leafyParts("hazel", "high", leafyOptions(p)));
export const treeHazelMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.hazel, leafyParts("hazel", "max", leafyOptions(p)));
export const treeHazelLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.hazel, leafyParts("hazel", "low", leafyOptions(p)));
export const treeHazelCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.hazel, leafyParts("hazel", "coarse", leafyOptions(p)));
export const treeOrchard = (p?: ParamValues) => treeMesh(LEAFY_COLORS.orchard, leafyParts("orchard", "high", leafyOptions(p)));
export const treeOrchardMax = (p?: ParamValues) => treeMesh(LEAFY_COLORS.orchard, leafyParts("orchard", "max", leafyOptions(p)));
export const treeOrchardLow = (p?: ParamValues) => treeMesh(LEAFY_COLORS.orchard, leafyParts("orchard", "low", leafyOptions(p)));
export const treeOrchardCoarse = (p?: ParamValues) => treeMesh(LEAFY_COLORS.orchard, leafyParts("orchard", "coarse", leafyOptions(p)));
export const treePalm = (p?: ParamValues) => treeMesh(PALM_COLORS, palmParts("high", palmOptions(p)));
export const treePalmMax = (p?: ParamValues) => treeMesh(PALM_COLORS, palmParts("max", palmOptions(p)));
export const treePalmLow = (p?: ParamValues) => treeMesh(PALM_COLORS, palmParts("low", palmOptions(p)));
export const treePalmCoarse = (p?: ParamValues) => treeMesh(PALM_COLORS, palmParts("coarse", palmOptions(p)));
export const treeDeadtree = (p?: ParamValues) => treeMesh(DEADTREE_COLORS, deadtreeParts("high", deadtreeOptions(p)));
export const treeDeadtreeMax = (p?: ParamValues) => treeMesh(DEADTREE_COLORS, deadtreeParts("max", deadtreeOptions(p)));
export const treeDeadtreeLow = (p?: ParamValues) => treeMesh(DEADTREE_COLORS, deadtreeParts("low", deadtreeOptions(p)));
export const treeDeadtreeCoarse = (p?: ParamValues) => treeMesh(DEADTREE_COLORS, deadtreeParts("coarse", deadtreeOptions(p)));

type Build = (p?: ParamValues) => MeshBuilder;
type Builders = [high: Build, low: Build, coarse: Build, max: Build];
const SEEDED: ParamSpec[] = [TREE_SEED];

/** The tree designs: one per species, but the autumn larch is the larch's `season: autumn`. */
const MODELS: ReadonlyArray<{ species: Species; builders: Builders; params: ParamSpec[] }> = [
  { species: "pine", builders: [treePine, treePineLow, treePineCoarse, treePineMax], params: SEEDED },
  { species: "spruce", builders: [treeSpruce, treeSpruceLow, treeSpruceCoarse, treeSpruceMax], params: SEEDED },
  { species: "oak", builders: [treeOak, treeOakLow, treeOakCoarse, treeOakMax], params: OAK_PARAMS },
  { species: "birch", builders: [treeBirch, treeBirchLow, treeBirchCoarse, treeBirchMax], params: LEAFY_PARAMS },
  { species: "aspen", builders: [treeAspen, treeAspenLow, treeAspenCoarse, treeAspenMax], params: LEAFY_PARAMS },
  { species: "willow", builders: [treeWillow, treeWillowLow, treeWillowCoarse, treeWillowMax], params: LEAFY_PARAMS },
  { species: "palm", builders: [treePalm, treePalmLow, treePalmCoarse, treePalmMax], params: PALM_PARAMS },
  { species: "bush", builders: [treeBush, treeBushLow, treeBushCoarse, treeBushMax], params: LEAFY_PARAMS },
  { species: "deadtree", builders: [treeDeadtree, treeDeadtreeLow, treeDeadtreeCoarse, treeDeadtreeMax], params: DEADTREE_PARAMS },
  { species: "scotspine", builders: [treeScotspine, treeScotspineLow, treeScotspineCoarse, treeScotspineMax], params: SEEDED },
  { species: "larch", builders: [treeLarch, treeLarchLow, treeLarchCoarse, treeLarchMax], params: LARCH_PARAMS },
  { species: "hazel", builders: [treeHazel, treeHazelLow, treeHazelCoarse, treeHazelMax], params: LEAFY_PARAMS },
  { species: "orchard", builders: [treeOrchard, treeOrchardLow, treeOrchardCoarse, treeOrchardMax], params: LEAFY_PARAMS },
];

/** The catalog fields every tree shares. */
export const TREE_CATALOG: CatalogFields = {
  category: "Trees",
  group: "tree",
  defaultScale: 1,
  license: "MIT",
  author: "Rail Island",
  source: "procedural (rail-island-factory)",
};

/** The model id of a design's species. */
export const treeId = (species: Species): string => `proc-tree-${species}`;

/** The design that draws a species, and the parameter values that pick it. */
export function treeModelOf(species: Species): { id: string; params: ParamValues } {
  return species === "autumnlarch" ? { id: treeId("larch"), params: { season: "autumn" } } : { id: treeId(species), params: {} };
}

/** One design per species, the two larches one design with a season. */
export const TREES: ProceduralDesign[] = /* @__PURE__ */ MODELS.map(({ species, builders: [build, buildLod, buildCoarse, buildMax], params }) => ({
  id: treeId(species),
  title: TITLES[species],
  build,
  buildLod,
  buildCoarse,
  buildMax,
  params,
  lodTriangles: 300,
  references: species === "oak" ? "oak" : "trees",
  catalog: TREE_CATALOG,
}));
