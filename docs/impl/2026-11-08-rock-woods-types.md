# Rock woods types

Spec: docs/specs/2026-11-08-rock-woods-types.md
Date: 2026-11-08
Status: partially implemented
Area: rail-island-factory (rock species, rock surfaces and photo sets, woods planter contract,
rock woods types, woods export, grove previews, text); rail-island-webapp (woods import, forest,
stored rocks: save, block map, rock layer, rock subtools, island generation)

## What was done

Both repos, branch `claude/nice-bardeen-7sat0b` (the session's branch; in the webapp it also
carries part 1, cliffs and escarpments, which the spec's "builds on part 1" decision needs).

**Factory.**
- `generator/rocks.ts`: four species - `granite-boulder`, `sandstone-tower`,
  `limestone-pinnacle`, `crag` - as designs `proc-rock-<species>` (drafts, not in
  `catalogModels.json`), five shapes each (`Rock shape` seed), four levels (coarse 8-20, low
  80-120, high 594-1,314, max 1,836-5,120 triangles), two materials (`trunk` the stone, `foliage`
  the up-facing faces) both on a rock surface, foot on y = 0 with a skirt the game sinks.
  `rockInfo` measures height, sink, footprint and top spots.
- Three photo sets from Poly Haven (CC0): `boulder` (`rock_boulder_dry`, the same entry as the
  river-boulder branch), `sandstone` (`rock_face_03`), `limestone` (`marble_cliff_01`);
  `MAX_TEXTURES` 16 -> 18; surfaces `rock-granite`, `rock-sandstone`, `rock-limestone` and the
  three `swatch-*` previews.
- Woods contract (`woodsApi.ts`): `CellContext.rocks` (4 x 4 occupancy) and `tops`,
  `TreeSlot.lift`, `onRock`, `PlacedRock`, `rockCellContext` (one rule for game and previews).
  The forest rule moves a tree off a rock square to a free quarter, plants canopy trees on top
  spots (lifted), plants boulders in free slots with a negative lift; a cell without rocks grows
  exactly what it grew.
- Woods types `rock-city`, `boulder-field`, `crags`, `stone-forest`; a `boulders` parameter
  (none / few / many, default none) on pine, mixed, Scots pine and high mountain forests.
- Export: `woods.js` carries the rocks (`SPECIES` trees then rocks, `ROCK_SPECIES`, `ROCKS`,
  `ROCK_GRID`, `rockCellContext`, `buildTree` builds a rock); `woods.meta.json` gains `rocks`.
- Grove previews stand sample stored rocks in the rock types' woods.
- Text: rock species names and the new woods titles in all 14 languages.
- Docs: `docs/models/rocks.md` (new), `woods.md`, `surfaces.md`, `README.md`.
- Checks: `pnpm typecheck` passes; `pnpm build:models` passes (1,080 models, `build-cache/`
  committed); `pnpm test` 178 files, 11,088 passed, 11 skipped - in 6 min 54 s (see Known
  problems).

**Game.**
- Import (`scripts/models/importWoods.ts`): rock meta, types and the module's rock exports;
  db/procedural woods, surfaces, text and the three photo sets imported. The rest of that
  factory export (an airport redraw, vehicle changes from factory master) was left out.
- Forest: rock species in the species catalog (boulders draw), rock materials bind their photo
  (`treeBuildJob` reads `userData.surfaces`), a rock never sways, `plantCell` hands each cell the
  stored rocks' occupancy and tops (`CellRocks`) and stands a tree at ground + `lift`.
- Stored rocks: `core/rocks/Rocks.ts` (`RockData`, `readRocks`, `placedRock`, `RockIndex`,
  `rockCells`), saved in `objects.json` (`rocks`, `nextRockId`), in the undo snapshot and the
  save; `SurfaceBlockMap.markRock` blocks building but not woods.
- `render/RockLayer.ts`: every stored rock on the island, high / low / coarse by camera distance.
- Rock subtools in the Terrain group (`core/rocks/RockEdit.ts`): Place rock (place, or change the
  tapped rock), Rock cluster (scatter brush that paints the matching woods), Erase rocks; options
  Rock, Shape, Size, Rotation; icons; English and Czech strings.
- Island generation (`core/rocks/RockGen.ts`, after woods and cities in `MapStore.createMap`):
  crag belts on escarpment rims, rock cities on benches, boulder fields at the feet, crags'
  scrub; the map's woods table names the rock woods (ids 14-16).
- Docs: `docs/gameplay/rocks.md` (new), `cliffs.md`, `terrain-editing.md`,
  `docs/rendering/woods.md`, `docs/tooling/factory-import.md`, `docs/README.md`.
- Checks: `pnpm typecheck` passes; `pnpm test` 662 files, 9,100 tests passed; `pnpm build`
  passes. The game half is commit 2932354 on the webapp branch.

## How to test

**Automated coverage.** No E2E: the repos verify headlessly and neither CLAUDE.md asks for E2E.
Factory `test/rocks.test.ts` and `test/woods.test.ts`; game `test/rocks.test.ts` (save format,
footprint and tops, the subtools' rules, the build block, the woods round a rock, no wind,
the generator), plus the save round-trip fixtures now carrying rocks.

**Setup.** Game on `claude/nice-bardeen-7sat0b`: `pnpm build:assets`, `pnpm dev`, sign in, open
or create an island. For generated rocks create a new island at Hills 7-9 (cliffs need the part-1
generator on this branch).

**Steps.**
1. Open Terrain; pick **Place rock**; choose Rock = Sandstone tower, Shape = Random, Size = x1,
   Rotation = Random. Tap open ground: a tower stands there. Tap it again with Shape 3: it
   changes shape in place. Press OK.
2. Pick **Rock cluster**, radius R24, hold on open ground: towers appear around the cursor,
   spaced apart, and the ground under the brush is painted Rock City; pines grow in the lanes
   and on several crowns. Press OK, then Undo: the cluster and its woods go.
3. Pick **Erase rocks**, sweep over the cluster: towers and the Rock City woods under the brush
   go; an ordinary forest painted there stays.
4. With a tower standing, try to build a rail or a house across it: refused.
5. Paint a Pine Forest, open the woods board, set Boulders = Many: boulders appear between the
   trees, half sunk.
6. Zoom far out: the towers stay visible after the forest has turned to ground tint.
7. Create a new island at Hills 9: crags line the escarpment rims, a few rock cities stand on
   benches, boulder fields lie at the feet of faces.

**Also worth trying.** Placing on water or a road (refused); a rock on a slope (its foot sinks,
no gap); reload the island (rocks and their woods come back); a read-only viewer (rocks draw,
subtools absent); CANCEL during a terrain session (rocks restored).

## What is missing

- **Rocks reaching further applies to stored rocks only.** The woods' boulders stop with the
  forest's radius; making the forest draw rock species farther would mean a separate reach in
  the chunked forest. Boulders are 1-3.5 studs, so the loss is small.
- **The single-rock tool has no free turn/scale handles**: turn and size are toolbar options
  (eight headings or random; five sizes). A placed rock is changed by tapping it with new
  options, not dragged.
- **No moving a rock**: erase and place again.

## Known problems

- The factory's full `pnpm test` took 6 min 54 s in this container, over its 5-minute rule; the
  baseline was not measured here, and the rock tests add seconds (about 30 test cases).
- Spec decision "store ground height": lowering the ground under a rock leaves it floating,
  raising buries it; height edits under a rock are not blocked (the spec named it a risk).
- Rock designs are drafts: the site lists them under Workshop until confirmed, while the game
  already plants and places them through `woods.js`.
- Impostors bake every species from seed 1 at full detail; a boulder far away is its seed-1 shape.
- The rock surfaces' tint and tiles were chosen without an in-game render (headless only).
- The generator's rock cities and crags ignore whether a crag's steep face looks over the rim.

## Recommended follow-ups

- Look at the rocks in the game and tune the surfaces' tint and tile, the towers' proportions
  and the generator's densities with real frames.
- Block height edits under a stored rock (or re-seat its `y`), so terrain edits cannot float it.
- Give the forest a separate, wider reach for rock species.
- A move handle (drag a rock) and free rotation for the single-rock tool.
- Confirm the four rock designs (catalogModels.json) once reviewed.

## Changelog

- New rocks: sandstone towers, limestone pinnacles, crags and granite boulders.
- Place a rock, scatter a rock cluster or erase rocks from the Terrain tools.
- New woods: Rock City, Boulder Field, Crags and Stone Forest; pine, mixed, Scots pine and high
  mountain forests can grow boulders.
- Trees grow between and on top of rock towers.
- New mountain islands grow crags along their cliffs, rock cities on their ledges and boulder
  fields below them.
