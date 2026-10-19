# Factory trees and woods

Spec: docs/specs/2026-10-19-factory-trees-and-woods.md
Date: 2026-10-19
Status: implemented
Area: rail-island-factory (trees, woods, export, site); rail-island-webapp (woods import, core/Woods, planting, renderer, ground tint, woods board, map load/save, line decorations)

## What was done

**Factory** (branch `claude/intelligent-maxwell-04qhzj`):

- **Tree designs.** The game's 14 tree species are designs now, `proc-tree-<species>`
  (`generator/trees.ts`), at three levels: `build` (high), `buildLod` (low) and a new
  `buildCoarse` (coarse). They are built on a small geometry kit (`generator/treeGeo.ts`)
  that re-implements the three.js cylinder, cone and icosahedron layouts. Phase 1 was
  ported first. Against the game's own builder it matched all 42 levels exactly
  (triangle counts, and bounding boxes to float32 precision). That measurement is kept
  as `test/fixtures/tree-baseline.json`.
- **Phase 2 (stylised look).**
  - Light and shade are baked into vertex colours: occlusion inside the crown, a lit
    top, and per-clump brightness and hue jitter.
  - Crowns are ragged: lobes of unequal size, missing lobes and missing branch fans.
  - Crowns are wider (`SPREAD`), and colours are more saturated.
  - The high tree is fitted onto the low tree's envelope (`fitToLow`).
- **Format support.**
  - `MeshCore.triShaded` adds per-corner colours: `COLOR_0` in the GLB, `color` with
    `vertexColors` in the JS model.
  - A material can be `doubleSided`.
  - The JS model exports `buildCoarse`.
  - `modelId` accepts `proc-tree-`.
  - The thumbnail renderer reads `COLOR_0`.
- **Woods types.** These are distribution functions keyed by name
  (`generator/woods.ts`), all written with one `forest()` rule. The rule reads:
  - edges from the 5x5 mask;
  - groves and glades from value noise;
  - understorey, slope, treeline and orchard rows.

  The contract is in `woodsApi.ts`: the cell context, output slots, a hard limit of 4
  trees per cell, and the game's original hash.
- **Woods export** (`woodsExport.ts`):
  - `export/woods/<name>.js`;
  - `woods.meta.json`, with no numeric ids;
  - grove thumbnails `thumbs/woods-<name>.png` (built with `woodsGrove.ts`, cached by
    hash).
- **Site.** A "Trees" chip, and a woods gallery above the tree species
  (`src/WoodsGallery.tsx`; replaced by the Woods category, follow-up 4).
- **Docs.** `docs/models/trees.md` and `docs/models/woods.md` are new, with rows in
  the index. `export.md`, `js-format.md`, `lod.md`, `catalog-site.md` and `AGENTS.md`
  are updated.

**Game** (branch `claude/intelligent-maxwell-04qhzj`):

- **Import.** `pnpm import:factory` mirrors `woods.meta.json`, `woods/` and the tree
  models (`scripts/models/importWoods.ts`). It writes `db/procedural/woods/index.js`
  and its `.d.ts`: eager woods modules, and lazy `TREE_LOADERS`. The new flag
  `--woods-only` imports only this part.
- **`core/Woods.ts`** is rewritten:
  - the library comes from the factory modules;
  - the 13 legacy names keep ids 1-13;
  - `resolveMapWoods` maps old maps on load: ids 1-13 by legacy name, the old palette
    array and unknown names to the fallback (Mixed Woods);
  - `woodsTableFor` builds the `{ name: id }` table written to
    `meta.woodsPalette` on save.
- **`core/VegetationGen.ts`.** `plantCell` builds the cell context (mask, slope,
  height) and places up to 4 trees.
- **`render/TreeGeometry.ts`** builds from the factory modules (loaded on demand) and
  merges each into one geometry with two groups and vertex colours.
- **`VegetationRenderer`** plants up to 4 trees per cell. Each instance gets its own
  width and lean (`composeTreeMatrix`) and an instance colour (shade and hue).
- **Forest floor.** A floor tint on the ground at every range (`canopyTexture`
  floor raster, `uCanopyFloor` in the splat shader).
- **Woods board.** The list is the factory woods types. Each card shows the species
  it plants, and the grove preview uses `plantCell`.
- **Line decorations** use `sample()`. Recorded player-made woods replay as the
  fallback.
- **Display names** are keyed by woods name onto the existing `woods.builtin.N`
  keys, so translations carry over.
- **Docs** updated: `rendering/woods.md`, `backend/user-woods.md`,
  `backend/storage.md`, `tooling/factory-import.md`, `architecture/i18n.md`.

**Checks.**

- Factory: `pnpm typecheck` clean. `pnpm test` gave 4167 passed and 1 failure (a
  design count that had to include the trees); that test was fixed and re-run green.
  `pnpm build:models` built 208 models.
- Game: `pnpm typecheck` (app and worker) clean. `pnpm test` gave 536 files,
  7122 passed, 2 skipped. `pnpm build` passes (the trees one lazy chunk, follow-up 1).
- `TEST_ALL_VARIANTS=1` was not run, because no existing design's parameters
  changed.

## Follow-up changes

1. **All tree species in one module.** The export now writes `trees.js`
   (`bundleTrees`): every species, `buildTree(THREE, species, detail)`, 32 KB
   (12.3 KB gzipped) in place of fourteen 32 KB per-species modules. The game imports
   it through `loadTrees` and no longer copies the per-species files, which stay as
   the catalog's and the site's.
2. **Coarse preview in the factory.** Tree catalog records carry `coarse: true`. On
   the site, the model page's "Low level of detail" checkbox became a **Level of
   detail** select (Full / Low / Coarse), and Coarse builds the module's
   `buildCoarse`.

3. **Woods parameters.** Every woods type has enum parameters, like a model's:
   `density` (sparse / normal / dense) and one of its own (pine forest `age`, oak
   woods `undergrowth`, mixed woods `mix`, scrub `trees`, palms `undergrowth`, tropical
   forest `palms`, mountain forest `conifer`, park `planting`, Scots pine `birch`, larch
   `spruce`, autumn larch `season`, hazel edge `oaks`, orchard `layout`). The factory
   exports `params` and `variant(values)` per woods module and lists the parameters in
   `woods.meta.json`; the defaults plant exactly what the types planted before (checked
   tree for tree), so existing islands are unchanged. In the game a cell stores a
   **variant** id: the thirteen shipped defaults keep 1-13, any other variant takes the
   lowest free id from 14 as it is first painted or loaded (at most 255 per map). The
   map's `meta.woodsPalette` maps **variant keys** -- the woods name plus its non-default
   values, `park?density=dense&planting=conifer` -- to ids; a bare name is the defaults,
   so tables written before parameters still read. The woods board shows the
   highlighted type's parameters as chip rows (the model parameter style), opens on the
   painted variant's values, previews without using up an id, and paints the chosen
   variant; the toolbar names it "Pine Forest (Dense, Young)". This extends the spec's
   storage decision (a name table) to name-and-parameter keys, as asked.

4. **Woods category on the site.** Every woods type is a catalog design,
   `proc-woods-<name>` (`generator/woodsModels.ts`): its model is the type's grove
   (trees at `low`, LOD at `coarse`, at most 12,000 triangles), its parameters are the
   type's. A **Woods** chip lists them; a model page shows the grove in 3D with the
   usual parameter selector, and the thumbnail view shows every combination. The
   woods gallery that used to appear above the tree species when the Trees chip was
   picked (`src/WoodsGallery.tsx`) is removed, and with it the separate grove
   thumbnails `thumbs/woods-<name>.png`. No game meta lists the woods designs.

## How to test

**Automated coverage.**

- Factory: `test/trees.test.ts`, `test/woods.test.ts`, and the catalog sweep, which
  builds every tree in JS the same as in the generator.
- Game: `test/woods.test.ts` (migration of all three meta forms),
  `test/vegetationGen.test.ts`, `test/treeGeometry.test.ts`,
  `test/woodsGrove.test.ts`, `test/canopyTexture.test.ts`,
  `test/vegetationChunks.test.ts` (lean and width against three.js),
  `test/lineDecorationReplay.test.ts`.
- No E2E framework drives the 3D view (the repo's rule is headless only).

**Setup.** In the game, run `pnpm dev`. Open an existing island that has woods, then
create a new island with Woods set to "Woodlands".

**Steps.**

1. Open an existing island with forests. The forests should draw denser, with
   smaller trees and shrubs at their edges, shaded crowns, and colour varying between
   trees.
2. Zoom in to a forest edge. The ground under the trees is darker (forest floor), and
   a park's ground stays grass-coloured.
3. Pull the camera far back. The trees fade into the canopy tint with no hard ring.
4. In Terrain, open Vegetation and the woods selector. The board lists Clear and the
   13 woods types, each card naming its species. The highlighted grove matches the
   island.
5. Paint "Autumn Larch Woodland" over a large area. Golden and green larch groves
   form.
6. Save, reload, and inspect `meta.json`: `woodsPalette` is
   `{ "autumn-larch-woodland": 11, ... }`.
7. Load an island that used a player-made woods type. Those cells draw Mixed Woods,
   and after a save the palette array is gone.
8. Draw a row of trees along a road (line decoration). The trees appear, using the
   new species and colours.

9. On the factory site (`pnpm dev`), pick the Woods chip and open
   `proc-woods-park`. Set Density to Dense and Planting to Conifers: the grove
   redraws denser and coniferous. Switch to Thumbnails: every combination is listed.
   Then pick the Trees chip: only the tree species are listed, no woods cards.
   Open `proc-tree-oak`.
   Set Level of detail to Coarse: a 20-triangle tree with the same outline appears,
   and the triangle count reads "(coarse)". Step to a building: it shows its LOD.

10. Open the woods board, pick Park, choose Dense and Conifers, Select and paint.
    The grove and the painted park are denser and coniferous; the toolbar reads
    "Park (Dense, Conifers)". Save and reload: `meta.woodsPalette` holds
    `"park?density=dense&planting=conifer": 14`, and the park draws the same. Reopen
    the board: Dense and Conifers are selected.

**Also worth trying.**

- A phone or the lowest quality rung: dense forests should drop to coarse earlier,
  with no frame drop.
- The first second after load: the trees appear once their models arrive. There is
  no error.

## What is missing

- **Quality ladder retune.** The spec asks to retune the tree thresholds so that
  denser woods keep the same frame budget. The per-rung budget tests still pass
  unchanged, but no threshold was retuned and nothing was measured in a browser.
  This needs a browser profile, which the repo rules leave to the user.

## Known problems

- **Full import churn.** Every factory module's code changed (vertex-colour support
  in `toGroup`), so the next full `pnpm import:factory` will touch all 194 game
  modules even though they render the same. This change used `--woods-only` to keep
  that churn out.
- **Phase 1 commit.** Phase 1 was verified but not committed separately: the
  factory commit holds phase 1 and phase 2 together. The baseline fixture is the
  record of the port.
- **Old forests change.** Existing islands' forests change look, as the spec
  accepted. Player-made woods turn into Mixed Woods.
- **Flat trunks.** Trunks are now flat-shaded. The game's old cylinders had smooth
  normals, and the factory format is flat per face.
- **Partial cell context.** `ctx.height` is the terrain height above `WATER_LEVEL`,
  and `ctx.slope` is a central difference across the cell. The functions get no
  material or water-distance information.
- **Variant ids are per loaded map.** Loading a map resets every id above 13
  (`resetVariants`), so only one map's woods can be open at a time; a remembered
  tool preference keeps only the shipped defaults' ids.
- **The 255-variant cap cannot be reached yet.** All the current factory types and
  values together make 117 combinations, so the "too many variants" message is only
  reachable once the factory grows; it is not covered by a test.
- **Orchard rows.** The orchard's row layout is hard to see at 0.86 trees per cell.

## Recommended follow-ups

1. Profile a dense forest on a phone and retune `treeCoverage` if it is needed.
2. Decide whether the OpenTTD and GLB-ZIP exports should use the vertex colours
   (this is an open question in the spec).
3. Give the woods functions water distance, so riverside willows and reeds are
   possible.

## Changelog

- Forests are denser and look painted: shaded crowns, varied colours, smaller trees
  and shrubs at the edges, groves of one kind, and a dark forest floor under the
  trees.
- Parks keep their lawn, orchards stand in rows, and the mountain forest thins toward
  the treeline.
- Islands that used a custom woods type now show Mixed Woods in its place.
- Every woods type has a density (sparse, normal, dense) and a choice of its own -- a
  pine forest's age, a park's planting, an autumn wood's season -- picked on the woods
  board like a model's options.
