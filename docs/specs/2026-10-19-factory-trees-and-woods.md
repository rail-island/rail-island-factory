# Factory trees and woods

Status: draft
Date: 2026-10-19
Area: rail-island-factory (new tree family, woods export), rail-island-webapp (import, renderer, woods catalog)

## Context of the change

All the trees are defined in the game repository, `rail-island-webapp`, which is the only
place where models are still authored outside the factory:

- `src/render/TreeGeometry.ts` (about 1,100 lines) builds 14 species (pine, spruce, oak,
  birch, aspen, willow, palm, bush, deadtree, scotspine, larch, autumnlarch, hazel,
  orchard). Each species has three levels of detail: `coarse` with 10-20 triangles, `low`
  with 64-294 and `high` with 296-2,983. Each species has two material groups (trunk and
  foliage), and each group is one flat colour from a hard-coded table.
- `src/render/TreeWind.ts` is a vertex-shader sway spliced into the tree materials. It is
  quadratic in height and its phase comes from the tree's world position.
- `src/core/Woods.ts` holds the 13 built-in woods types at fixed ids 1-13. Each type has a
  name, a swatch, a density and up to 12 entries of species, height range and ratio. Maps
  store the per-cell id grid (`vegetation.bin`) and a `woodsPalette` snapshot of
  player-made types in `meta.json`.
- `VegetationGen` places at most one tree per cell, deterministically.
  `WoodsGen` and `CityVegetation` choose which woods type is painted where.
  `VegetationRenderer` and `vegetationChunks` draw the forest as instanced meshes per
  64-cell tile, in three detail bands. `canopyTexture.ts` tints the ground far away.
- Reference: the game's `docs/rendering/woods.md`.

The factory (this repository) builds every other model the game draws and exports it as
standalone JS modules plus meta JSON (docs/models/js-format.md, docs/models/export.md,
docs/models/lod.md). It has no trees. So trees cannot be previewed on the factory site,
have no thumbnails or contact sheets, and do not follow the factory's rules on
references, determinism and LOD.

The trees also look worse than OpenTTD's. Analysis:

1. **No colour variation.** Each species is one flat foliage colour and one trunk
   colour, and every instance is identical. OpenTTD sprites are hand-painted, with
   highlight and shadow speckle per clump and several variants per species.
2. **No ambient occlusion or depth in the crown.** Faceted standard-material shading lit
   only by the sun reads as plastic. OpenTTD bakes a dark crown interior and underside and
   a lit top into every sprite.
3. **Sparse placement.** We place at most one tree per cell at 24-30% density, so bare
   ground shows between trees. OpenTTD draws up to four overlapping trees per tile, which
   merge into a canopy over a darkened forest floor.
4. **Exaggerated scale and fixed view.** OpenTTD trees are drawn larger than life for one
   isometric angle. Ours are near-realistic and have to hold up from every angle.
5. **Silhouette.** OpenTTD crowns are ragged, with gaps you can see through. Ours are
   closed convex solids.

## User request

Design moving tree and woods definition from game into factory. Also try to improve
rendered trees - why trees in OpenTTD looks better than in Rail Island?

## Decisions

### What exactly moves from the game into the factory?
| Option | What it means |
|---|---|
| Species + woods types | The factory owns the tree species geometry (all three LODs, colours) and the built-in woods type presets (names, density, species mix), exported as a woods meta file. The game keeps placement, chunked instanced rendering, the wind shader and the editor. |
| Species geometry only | The factory exports tree models only, and the woods presets stay in the game. Two places would define what a forest looks like. |
| Everything incl. wind | The factory also owns the wind sway definition, so its site previews moving trees exactly as the game draws them. |

**Answer: Species + woods types.**

### Should one spec cover both the move and the visual improvement of trees?
| Option | What it means |
|---|---|
| One spec, two phases | Phase 1 moves the definitions 1:1 (same look, regression-pinned). Phase 2 improves the look in the factory, where the models live. |
| Move only | The visual improvement gets its own later spec. |
| Improve during the move | Redesign straight away with no 1:1 port step. Faster, but no clean before/after. |

**Answer: One spec, two phases.**

### How should a tree species be shaped as a factory model?
| Option | What it means |
|---|---|
| One design per species | Model ids like `tree-pine` and `tree-oak`: 14 designs in one trees family. Each module builds `high`, `buildLod` gives `low`, and a third `coarse` level is added for the tree family only. Fits the catalog, thumbnails, per-species references and docs. |
| One parametric `tree` | A single design with a `species` enum parameter. Compact, but species are not variants of one thing. |
| One bundle module | One `trees.js` exporting every species and level. Breaks one-model-one-module. |

**Answer: One design per species.**

### How does the game turn the factory export into instanced trees?
| Option | What it means |
|---|---|
| Run the JS modules | Same as other procedural models: the game calls `build(THREE, ...)` per species and level, merges the Group's meshes into one geometry with trunk and foliage groups, and applies its own wind and instancing. |
| Baked geometry data | The factory writes typed-array geometry per level, and the game loads it directly. A second export format. |

**Answer: Run the JS modules.**

### Who owns the stable ids of woods types and species names, both stored in saved maps?
| Option | What it means |
|---|---|
| Factory owns, game validates | The woods meta carries built-in ids 1..127 and species keys, and factory tests pin them. |
| Game owns ids | The factory exports presets by name only, and the game keeps a name-to-id table. Safer for saves, but adding a preset touches both repositories. |

**Answer: Game owns ids.** The factory names presets and species. The game maps each
preset name to its stored numeric id, and a saved map's id never depends on the factory.

### Which improvements should phase 2 include?
| Option | What it means |
|---|---|
| Baked vertex colours | The factory bakes per-vertex ambient occlusion (dark crown interior and underside, lit top) and per-clump hue and value jitter. No runtime cost. |
| Per-instance variation | The game tints each instance from the cell hash and adds slight lean and width jitter. |
| Denser canopy + forest floor | Several trees per cell, or clustered placement, so crowns overlap, and the ground under woods darkens at close range too. |
| Ragged silhouettes | Crowns get an irregular outline with gaps, within the current triangle budgets. |

**Answer: all four** - baked vertex colours, per-instance variation, denser canopy +
forest floor, ragged silhouettes.

### What art direction should the trees aim for?
| Option | What it means |
|---|---|
| Stylised, readable | OpenTTD-like: slightly oversized, saturated, strong light and dark contrast, chunky clumps. Heights may grow about 10-20%. |
| Keep current proportions | Shading and variation only. |
| More realistic | Natural colours and finer foliage. Needs more triangles or textures. |

**Answer: Stylised, readable.**

### How should the denser canopy be expressed in the woods data?
| Option | What it means |
|---|---|
| Density above 100% | `density` may go up to 400%: each cell has up to four sub-slots, each rolled with its own hash, with offsets kept inside the cell. One number and no new field, and existing types (<= 100%) keep their tree count. |
| New clustering field | A `clump` value gathers neighbours into groups. A second knob. |
| Fixed 2x2 sub-grid | Every cell becomes four slots. Every existing type's count quadruples unless rescaled. |

**Answer: Density above 100%.**

### Existing islands will draw different forests after the change (nothing per-tree is stored). How to handle that?
| Option | What it means |
|---|---|
| Accept the new look | Same painted woods ids, new trees on every map. No migration and no version flag; announced in the changelog. |
| Version flag in map meta | Old maps keep the old placement rule until the player opts in. Two placement paths forever. |

**Answer: Accept the new look.**

### What should make the forest floor?
| Option | What it means |
|---|---|
| Terrain tint at all ranges | The existing ground tint from the woods map also darkens woods cells near the camera (a darker, browner shade of the type's swatch). No new geometry. |
| Tint + undergrowth | Also ground-cover meshes under dense woods in the near band. |

**Answer: Terrain tint at all ranges.**

### How is phase 1 (the 1:1 move) proven to change nothing?
| Option | What it means |
|---|---|
| Port code + tests, pin bytes | The game asserts the imported positions equal the old builder's, per level, before the old code goes. |
| Pin metrics only | Compare triangle counts and bounding boxes per species and level, not exact vertices. Allows small refactors to fit the factory's mesh core. |

**Answer: Pin metrics only.**

### What should the factory site show for trees and woods?
| Option | What it means |
|---|---|
| Species + woods grove | Each species is a catalog model (preview, thumbnail, LOD toggle including coarse), and each woods preset gets a grove preview and thumbnail from its species mix and density. |
| Species only | The presets are exported data with no visual page. |

**Answer: Species + woods grove.**

### Denser woods (up to 4 trees per cell) multiply instances. What performance rule applies?
| Option | What it means |
|---|---|
| Same frame budget | Per-species triangle caps stay. The quality ladder's tree-coverage thresholds are retuned so a dense forest drops to low or coarse earlier, and the per-rung triangle and draw budgets the game's quality tests pin do not change. |
| Cut per-tree triangles | Lower each species' low and high budgets to pay for the extra trees. |
| Allow a higher budget | More triangles on desktop rungs only. |

**Answer: Same frame budget.**

## High-level plan

**Phase 1 - the move (no visible change).**

- **Factory:** a new trees family gets one design per species (`tree-<species>`). The
  game's builders are ported onto the factory's mesh core, with the high level as the
  design, the low level as its `buildLod`, and a third coarse level that only this family
  exports. The species colours come along as the design's materials, with trunk and
  foliage as the two material names.
- **The built-in woods presets** become factory data, identified by stable keys and
  exported with their names, swatches, densities and species mix. The tree tests
  (triangle caps, height and footprint pins, grounding, closed coarse solids,
  surface-to-volume) move to the factory.
- **Game:** the import mirrors the new modules and the woods meta. At load, the game runs
  each species module per level and merges the meshes into the two-group geometry the
  instanced renderer already expects. It then applies its own wind, shadows and
  instancing. The game's table maps each preset key to its stored numeric id and its
  i18n name key, and each species key to its model id. A game test compares triangle
  counts and bounding boxes per species and level against the figures pinned before the
  move, and then the old builders and the in-code preset library are deleted.

**Phase 2 - the look (stylised, readable).** It depends on phase 1.

- **Factory:** each species gets baked vertex colours: ambient occlusion from crown
  interior and height, plus per-clump hue and value jitter. Crowns are reworked so their
  silhouettes are ragged, with clumps of varied size, missing clumps and sky gaps, within
  today's triangle caps. Proportions become stylised: slightly oversized, saturated and
  high-contrast, with heights up to about 20% taller. Presets are retuned, and dense types
  use densities above 100%. The site gains woods grove previews and thumbnails so the
  forest look is reviewed in the factory.
- **Game:** tree materials honour vertex colours. Each instance gets a tint and a slight
  lean and width jitter from its cell hash. Placement rolls up to four sub-slots per cell
  when density exceeds 100%. The ground tint from the woods map applies at every range,
  using a darker forest-floor shade. The quality ladder's tree thresholds are retuned so
  that the frame budgets hold.

Workstreams within each phase are factory first, then game import, because the game
consumes the export.

## Database and persistent storage

Saved maps are unchanged: `vegetation.bin` (one woods id per cell), `woodsPalette` in
`meta.json` and the built-in ids 1-13 keep their meaning, and the game still owns the
ids. Existing islands draw re-rolled, restyled forests on the same painted ids, and no
migration is needed. The woods validation range widens to allow densities up to 400.
Older palette entries (<= 100) stay valid and keep their tree count.

New stored files, all generated and deterministic:

- **Factory export `woods.meta.json`** (mirrored into the game's `db/procedural` by
  the import; never hand-edited there). Written by the factory build and read by the
  game import and the factory site. Its structure:
  - `species`: an array sorted by key. Each entry has `key` (string, stable, the same
    names saved palettes already use, such as `pine`), `model` (the factory model id,
    `tree-<key>`) and `baseHeight` per level (`coarse`, `low`, `high`; metres or studs as
    the game expects).
  - `presets`: an array sorted by key. Each entry has `key` (stable string such as
    `pine-forest`), `name` (English), `swatch` `{r,g,b}`, `floor` `{r,g,b}` (the
    forest-floor tint, phase 2), `density` (integer 1..400) and `models`, an array of
    `{ species, minHeight, maxHeight, ratio }`, at most 12 entries.
  - No numeric ids. The game owns the key-to-id table and fails its import test if a
    preset it maps disappears.
- **Factory export `js/tree-<species>.js`** and thumbnails, like every model. A tree
  module additionally exports the coarse build next to `build` and `buildLod`.
- **Woods grove thumbnails** (`thumbs/woods-<key>.png`) for the site.
- **References** under `assets/tree-<species>/` with `SOURCES.md`, per the factory rule:
  the RHS descriptions already cited, and any photos used for the stylised rework.

## Architecture decisions

- **One design per species, not a parametric tree.** Species have different builders
  and references. Separate ids give each its own catalog page, thumbnail and LOD checks,
  and give woods presets a plain model id to point at.
- **The game runs the JS modules rather than baked geometry.** Trees use the same single
  export format as every other model, so phase 2 rework needs no new file type. The cost
  is a build per species and level at load, about 42 small builds, which are cached.
- **Wind, instancing, placement and the quality ladder stay in the game.** They are
  rendering policy and depend on the map. The factory owns what a tree and a woods type
  look like, and the game owns where and how many trees are drawn.
- **The game owns numeric ids.** Saved maps store numbers, and the factory never sees a
  save. Keys decouple the two, at the cost of a game-side table edit when a preset is
  added.
- **The visual gains come from colour, not textures.** Vertex colours plus instance tint
  keep the closed-solid, no-alpha, no-texture design the game chose for tiled mobile GPUs.
  This needs the factory's JS format and in-memory GLB to carry a colour attribute: a
  format extension that every consumer must tolerate.
- **Density above 100% instead of a new field.** One existing number keeps its meaning
  up to 100 and simply extends past it.

## Weaknesses and risks

- **Metric-only proof in phase 1.** Small shape drift (vertex order, normals, a moved
  clump) can pass a triangle count and bounding-box check unnoticed. Likelihood medium,
  cost low, since phase 2 restyles everything anyway. Mitigation: before and after
  thumbnails of each species and level are compared by eye.
- **Load-time cost.** Building 14 species at 3 levels from JS at startup might add tens of
  milliseconds on phones. Mitigation: build lazily per level when a band first needs it,
  as the renderer already prunes unreachable levels.
- **Instance count.** At 400% density a tile holds four times the trees, so the
  per-instance buffers and coarse pool grow even with the same triangle budget. The
  retuned ladder may make dense forests go coarse noticeably close to the camera.
  Mitigation: the presets choose densities against the ladder tests, and the factory
  grove preview shows the coarse look.
- **Stylised heights versus existing scenes.** Trees up to 20% taller can hide track,
  signals or station platforms that were visible before, and vegetation clearing around
  blocks stays one cell. Mitigation: keep the oversize mostly in crown width and
  contrast, and check city and station views in the game.
- **Colour-attribute format change.** Other factory consumers (the OpenTTD sprite export,
  the GLB ZIP, the site) must handle or ignore vertex colours consistently. Open question:
  should the OpenTTD and GLB exports use them? That is recommended, because sprites
  benefit most.
- **Grove previews diverge from the game.** The site's grove uses its own simple
  placement, not the game's per-cell hash and sub-slots, so it may not match an island
  exactly. Open question: should the placement roll be shared, or is an approximation
  enough?
- **Species keys are now two-repository contracts.** A renamed factory species would
  break saved palettes. A factory test pins the shipped keys, just as model ids are
  pinned.

## Out of scope

- Ground-cover meshes (undergrowth, ferns, reeds, stumps). The floor is a terrain tint
  only.
- Seasons or a calendar-driven colour change. Autumn larch stays a separate species.
- Moving the wind shader, placement (`VegetationGen`, `WoodsGen`, `CityVegetation`) or
  the woods board into the factory.
- Player-made woods types and the Creator woods editor, which stay removed.
- Billboards, alpha-tested leaf cards and textures.
- Publishing the factory export to the game outside the implementation of this spec.
