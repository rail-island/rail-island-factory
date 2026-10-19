// The woods types as catalog models: one design per woods type, proc-woods-<name>,
// whose model is the type's grove -- its distribution function run over a small
// patch, every tree it plants baked in (woodsGrove.ts) -- for any choice of the
// type's parameters. They make the woods browsable on the site like every other
// model: the Woods chip, the parameter selector and the 3D preview of the model
// page, the variant thumbnails. They are the SITE's: the game plants woods from
// the woods modules (woodsExport.ts), and no game meta lists these.
//
// A grove carries a few hundred trees, so its full model draws them at the
// species' `low` level and its LOD at `coarse`; the species' own pages show the
// `high` tree (docs/models/woods.md). No `node:` imports.

import { buildGrove } from "./woodsGrove.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { TreeDetail } from "./trees.ts";
import type { WoodsDesign } from "./woodsApi.ts";
import {
  pineForest, oakWoods, mixedWoods, scrub, palms, tropicalForest, highMountainForest, park, scotsPineWoodland, larchWoodland, autumnLarchWoodland, hazelWoodlandEdge, villageOrchard,
} from "./woods.ts";

// strict, like every design's build (an unknown name or value throws); the woods
// type's own resolution stays lenient for the game's saved maps
function grove(woods: WoodsDesign, params: ParamValues | undefined, detail: TreeDetail) {
  return buildGrove(woods, { params: resolveParams(woods.params, params), detail });
}

// One exported build function per woods type and level: a design's JS model
// bundles the functions it names (jsModel.ts), so each needs its own name.
export const grovePineForest = (p?: ParamValues) => grove(pineForest, p, "low");
export const grovePineForestLod = (p?: ParamValues) => grove(pineForest, p, "coarse");
export const groveOakWoods = (p?: ParamValues) => grove(oakWoods, p, "low");
export const groveOakWoodsLod = (p?: ParamValues) => grove(oakWoods, p, "coarse");
export const groveMixedWoods = (p?: ParamValues) => grove(mixedWoods, p, "low");
export const groveMixedWoodsLod = (p?: ParamValues) => grove(mixedWoods, p, "coarse");
export const groveScrub = (p?: ParamValues) => grove(scrub, p, "low");
export const groveScrubLod = (p?: ParamValues) => grove(scrub, p, "coarse");
export const grovePalms = (p?: ParamValues) => grove(palms, p, "low");
export const grovePalmsLod = (p?: ParamValues) => grove(palms, p, "coarse");
export const groveTropicalForest = (p?: ParamValues) => grove(tropicalForest, p, "low");
export const groveTropicalForestLod = (p?: ParamValues) => grove(tropicalForest, p, "coarse");
export const groveHighMountainForest = (p?: ParamValues) => grove(highMountainForest, p, "low");
export const groveHighMountainForestLod = (p?: ParamValues) => grove(highMountainForest, p, "coarse");
export const grovePark = (p?: ParamValues) => grove(park, p, "low");
export const groveParkLod = (p?: ParamValues) => grove(park, p, "coarse");
export const groveScotsPineWoodland = (p?: ParamValues) => grove(scotsPineWoodland, p, "low");
export const groveScotsPineWoodlandLod = (p?: ParamValues) => grove(scotsPineWoodland, p, "coarse");
export const groveLarchWoodland = (p?: ParamValues) => grove(larchWoodland, p, "low");
export const groveLarchWoodlandLod = (p?: ParamValues) => grove(larchWoodland, p, "coarse");
export const groveAutumnLarchWoodland = (p?: ParamValues) => grove(autumnLarchWoodland, p, "low");
export const groveAutumnLarchWoodlandLod = (p?: ParamValues) => grove(autumnLarchWoodland, p, "coarse");
export const groveHazelWoodlandEdge = (p?: ParamValues) => grove(hazelWoodlandEdge, p, "low");
export const groveHazelWoodlandEdgeLod = (p?: ParamValues) => grove(hazelWoodlandEdge, p, "coarse");
export const groveVillageOrchard = (p?: ParamValues) => grove(villageOrchard, p, "low");
export const groveVillageOrchardLod = (p?: ParamValues) => grove(villageOrchard, p, "coarse");

/** The catalog fields every woods model shares. */
export const WOODS_CATALOG: CatalogFields = {
  category: "Woods",
  group: "woods",
  defaultScale: 1,
  license: "MIT",
  author: "Rail Island",
  source: "procedural (rail-island-factory)",
};

/**
 * A grove's LOD triangle limit: a few hundred coarse trees of at most 20
 * triangles, and the ground. Far above a building's, since a grove is a forest.
 */
export const WOODS_LOD_TRIANGLES = 12000;

/** The model id of a woods type. */
export const woodsModelId = (name: string): string => `proc-woods-${name}`;

const TABLE: ReadonlyArray<[WoodsDesign, (p?: ParamValues) => ReturnType<typeof grove>, (p?: ParamValues) => ReturnType<typeof grove>]> = [
  [pineForest, grovePineForest, grovePineForestLod],
  [oakWoods, groveOakWoods, groveOakWoodsLod],
  [mixedWoods, groveMixedWoods, groveMixedWoodsLod],
  [scrub, groveScrub, groveScrubLod],
  [palms, grovePalms, grovePalmsLod],
  [tropicalForest, groveTropicalForest, groveTropicalForestLod],
  [highMountainForest, groveHighMountainForest, groveHighMountainForestLod],
  [park, grovePark, groveParkLod],
  [scotsPineWoodland, groveScotsPineWoodland, groveScotsPineWoodlandLod],
  [larchWoodland, groveLarchWoodland, groveLarchWoodlandLod],
  [autumnLarchWoodland, groveAutumnLarchWoodland, groveAutumnLarchWoodlandLod],
  [hazelWoodlandEdge, groveHazelWoodlandEdge, groveHazelWoodlandEdgeLod],
  [villageOrchard, groveVillageOrchard, groveVillageOrchardLod],
];

/** One design per woods type, its parameters the woods type's own (density first). */
export const WOODS_MODELS: ProceduralDesign[] = TABLE.map(([woods, build, buildLod]) => ({
  id: woodsModelId(woods.name),
  title: woods.label,
  build,
  buildLod,
  lodTriangles: WOODS_LOD_TRIANGLES,
  params: woods.params.map((p): ParamSpec => ({ ...p, values: p.values.map((v) => ({ ...v })) })),
  references: "trees",
  catalog: WOODS_CATALOG,
}));
