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

Follow-up, which changes the direction: the factory should export a list of woods types,
keyed by woods name. A woods type should not be a JSON record but a distribution
function, which can also handle more complicated relations between trees. Custom woods
should be mapped on load to the nearest woods type (keep it simple, as only a few users
made custom woods). The map should save only the mapping woods_name -> id for the ids
in `vegetation.bin`.

(Later answer: custom woods map to one fixed fallback type, not to the nearest one.)

## Decisions

### What exactly moves from the game into the factory?
| Option | What it means |
|---|---|
| Species + woods types | The factory owns the tree species geometry (all three LODs, colours) and the built-in woods type presets (names, density, species mix), exported as a woods meta file. The game keeps placement, chunked instanced rendering, the wind shader and the editor. |
| Species geometry only | The factory exports tree models only, and the woods presets stay in the game. Two places would define what a forest looks like. |
| Everything incl. wind | The factory also owns the wind sway definition, so its site previews moving trees exactly as the game draws them. |

**Answer: Species + woods types.** Revised in the follow-up: woods types are exported
as distribution functions keyed by name, not as JSON presets (see below).

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

**Answer: Game owns ids.** Superseded by the follow-up: woods types are keyed by name,
and each map stores its own name -> id table (see below).

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

**Answer: Density above 100%.** Superseded by the follow-up: a distribution function
decides how many trees a cell grows, so no density field is needed.

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

### Follow-up: how woods types are defined, keyed and stored
The user decided this directly: the factory exports a list of woods types keyed by
woods name. Each type is a **distribution function**, not a JSON record, so it can
express relations between trees. Custom woods are mapped on load. The map saves only a
woods_name -> id mapping for the ids in `vegetation.bin`.

### What may a woods distribution function see when it decides the trees of a cell?
| Option | What it means |
|---|---|
| Cell + neighbourhood | `fn(cell x/y, seeded rng, which neighbour cells within radius ~2 carry the same woods, terrain slope and height)` returns the cell's trees. Enables wood edges, clusters and understorey. Deterministic per cell. |
| Single cell only | `fn(cell x/y, rng)`. Relations only among trees inside one cell. |
| Whole tile at once | `fn(64x64 tile of woods ids, rng)`. Most freedom, but results depend on tile borders. |

**Answer: Cell + neighbourhood.**

### How is a custom woods mapped to the nearest factory woods type on load?
| Option | What it means |
|---|---|
| By species mix | Compare the custom type's species share with a sampled share per factory type. |
| By swatch colour | Nearest RGB swatch. |
| Fixed fallback | Every custom woods becomes one chosen type (for example Mixed Woods). |

**Answer: Fixed fallback.** This overrides "nearest" in the follow-up prompt. The
fallback type is Mixed Woods, the example the option named; this can change while the
spec is a draft.

### Where does the name -> id mapping live?
| Option | What it means |
|---|---|
| Versioned header in `vegetation.bin` | Name table in a new header of the grid file, and `woodsPalette` dropped. |
| Keep woodsPalette key | The grid file is unchanged, and the name -> id table goes into `meta.json` under the existing `woodsPalette` key, replacing the per-type snapshots. |

**Answer: Keep woodsPalette key.**

### Is the number of trees per cell capped?
| Option | What it means |
|---|---|
| Hard limit, enforced on both sides | A function returns at most 4 trees per cell. A factory test fails any woods function that returns more, and the game clamps to 4 only as a safety net. |
| Soft working figure | The cap is a budget number the game may trim to, and functions are not tested against it. |

**Answer: hard limit 4.** The user decided this after asking whether a function could
return anything.

## High-level plan

**Phase 1 - the move (no visible change).**

- **Trees in the factory:** a new trees family gets one design per species
  (`tree-<species>`). The game's builders are ported onto the factory's mesh core, with
  the high level as the design, the low level as its `buildLod`, and a coarse level that
  only this family exports. Species colours become the materials, named trunk and
  foliage.
- **Woods types in the factory:** each woods type becomes a named distribution function
  in the factory. For each cell the function receives the cell, a seeded random source,
  the same-woods mask of its neighbourhood (radius about 2) and the terrain slope and
  height. It returns zero or more trees, each with species, in-cell offset, rotation,
  height and tint, **at most 4 per cell** (a hard limit, tested in the factory). Each woods type also
  has a display name, a swatch and a forest-floor colour. In phase 1 every built-in type
  is a function that reproduces today's rule: one roll against density, a weighted
  species pick and a height range. The export lists all woods types by name.
- **Game:** the import mirrors the tree modules and the woods functions. At load the game
  runs the species modules per level and merges them into its two-group instanced
  geometry, then adds wind, shadows and instancing. `VegetationGen` calls the woods
  function for each cell instead of its built-in roll. A woods type is shown with the
  game's own translation of its name. A game test compares triangle counts and bounding
  boxes per species and level against figures pinned before the move. The in-code tree
  builders and woods library are then deleted.
- **Maps:** every map gets its own woods_name -> id table, and old maps are converted on
  load (see storage).

**Phase 2 - the look (stylised, readable).** It depends on phase 1.

- **Factory:**
  - **Vertex colours:** each species gets baked ambient occlusion and per-clump hue and
    value jitter.
  - **Silhouettes:** crowns get ragged outlines within today's triangle caps.
  - **Proportions:** stylised, with heights up to about 20% taller.
  - **Woods functions:** rewritten to use relations. Examples are several trees per cell
    in dense types, smaller trees and bushes at a wood's edge, understorey under big
    trees, and coherent clusters.
  - **Site:** shows a grove preview and thumbnail per woods type, made by running the
    same function on a patch.
- **Game:**
  - Tree materials honour vertex colours.
  - Instances use the per-tree tint and lean the function returns.
  - The ground tint from the woods map applies at every range, using each type's
    forest-floor colour.
  - The quality ladder's tree thresholds are retuned so the frame budgets hold.

Within each phase the factory work comes first, then the game import.

## Database and persistent storage

**Saved maps (game):**

- **`vegetation.bin`** is unchanged: one `Uint8` per cell, `0` = none. Its ids become
  **local to the map** (1..255) and mean nothing without the map's table.
- **`meta.json` `woodsPalette`** changes meaning. Today it is an array of snapshots of
  player-made woods types. It becomes the map's **name table**, an object mapping a woods
  name (string, the factory key such as `pine-forest`) to its id (integer 1..255). It is
  written on every save from the ids the grid actually paints, so an unused id is not
  written. A new map assigns ids as woods are first painted or generated.
- **Loading an old map**, where `woodsPalette` is absent or an array:
  - ids 1..13 map through a fixed game-side legacy table to the built-in woods names they
    always meant;
  - ids 128..255 (custom slots from the old snapshots) map to the fixed fallback type,
    Mixed Woods;
  - the next save writes the new object form, and the snapshots are dropped.

  This is the only migration. It happens lazily on load, and no stored grid byte is
  rewritten.
- **Unknown names:** a name in a map's table that the current factory export lacks (a
  removed woods type) also maps to the fallback.
- **Custom woods:** their species mix, heights and densities are not kept. A custom woods
  draws as the fallback from then on.

**Factory export (generated, deterministic, mirrored into the game's `db/procedural`,
never hand-edited there):**

- `woods.meta.json`: an array sorted by name. Each entry is
  `{ name, label (English), swatch {r,g,b}, floor {r,g,b}, module }`, and nothing about
  species mix or density.
- One JS module per woods type, exporting the distribution function. It has no imports
  and is deterministic for a given seed and cell.
- `js/tree-<species>.js` and the thumbnails, like every model. A tree module also
  exports its coarse build. Species keys and woods names are stored in maps (directly, or
  through the legacy table), so a factory test pins the shipped ones against renaming.
- Grove thumbnails `thumbs/woods-<name>.png`, and reference folders
  `assets/tree-<species>/` with `SOURCES.md`.

## Architecture decisions

- **One design per species.** Each gets its own catalog page, thumbnail, LOD checks and
  references, and the woods functions name species by key.
- **The game runs the JS modules rather than baked geometry.** There is one export
  format for everything. About 42 small builds per load (14 species x 3 levels) are
  cached, and a level is built lazily.
- **Woods types are code, not data.** Relations such as edges, clusters and understorey
  cannot be written as a species/ratio table. A function keyed by a stable name also lets
  a woods type change completely without touching saved maps. The cost is that a woods
  type cannot be inspected or validated as data, so the factory tests and the grove
  preview are the only review.
- **The neighbourhood is limited to radius about 2 plus terrain.** Trees stay
  deterministic per cell and independent of tile borders and of the order chunks are
  built in, which the streamed forest needs. A whole-tile function would break that.
- **Names in maps, ids local to each map.** The factory owns names. The map owns its
  bytes and keeps the cheap one-byte grid. No global id registry exists, so adding a
  woods type touches only the factory and the game's translation of its name.
- **The table lives in `meta.json`, not in `vegetation.bin`.** The grid file and its
  readers stay unchanged, and the change is one JSON key changing shape.
- **Custom woods go to a fixed fallback.** Only a few users made custom woods. A nearest
  match would need species-mix sampling for little gain.
- **Wind, instancing, chunk streaming and the quality ladder stay in the game.** The
  factory decides what grows in a cell, and the game decides how much of it is drawn.
- **Colour comes from vertex colours and instance tint, not textures.** Trees keep the
  closed-solid, no-alpha design that mobile GPUs need. The factory's JS format and its
  in-memory GLB gain a colour attribute.

## Weaknesses and risks

- **Custom woods lose their look.** Players who built custom woods see them turn into
  Mixed Woods after their next load. This is certain on those few maps. Mitigation: a
  changelog note. The old snapshot stays in the map until the next save.
- **Per-cell function cost.** Calling a JS function with a neighbourhood mask for about
  26,000 cells per tile ring is slower than today's hoisted ratio walk. Mitigation: the
  game builds the mask from the grid once per tile, and a function must stay
  allocation-free per cell. A factory benchmark test bounds its time per cell.
- **Determinism across repositories.** The seeded random source and the mask must be
  identical in the factory preview and the game. If they differ, the grove preview lies.
  Mitigation: the export defines the contract (seed mixing, mask layout), and both sides
  test against fixed vectors.
- **Metric-only proof in phase 1.** Shape drift can pass the count and bounding-box check.
  Mitigation: before and after thumbnails per species and level are compared by eye.
- **Instance count.** Dense functions place several trees per cell under the same
  triangle budget, so forests go coarse closer to the camera. Mitigation: the hard limit of
  4 trees per cell and ladder tests in the game.
- **Stylised heights** may hide track, signals or platforms that were visible before.
  Mitigation: keep the oversize mostly in crown width, and check city and station views.
- **The colour-attribute format change** must be handled by the other factory consumers
  (OpenTTD sprite export, GLB ZIP, site). Open question: should those exports use the
  colours too?
- **Open question:** whether a function may place a tree's offset outside its cell.

## Out of scope

- Keeping or migrating the exact look of custom woods. They become the fallback.
- Editing or creating woods types in the game or the Creator. Woods types are authored in
  the factory only.
- Ground-cover meshes (undergrowth meshes, ferns, reeds, stumps) beyond the species the
  functions can place. The floor is a terrain tint.
- Seasons. Autumn larch stays a separate species.
- Moving the wind shader, map-level generation (`WoodsGen`, `CityVegetation`, which pick
  the woods type per cell) or the woods board into the factory.
- Billboards, alpha-tested leaf cards and textures.
- Publishing the factory export to the game outside the implementation of this spec.
