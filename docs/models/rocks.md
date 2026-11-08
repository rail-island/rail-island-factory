# Rocks

**Covers** - the rock species (granite boulders, sandstone towers, limestone pinnacles, crags):
their shapes, five seeds and four levels, the two materials and the rock surfaces, what
`rockInfo` measures (height, footprint, top spots), how the game uses them (boulders as woods
slots, the rest as stored rocks), the four rock woods types and the forests' `boulders`
parameter, the grove previews and the tests.
**Code** - `generator/rocks.ts`, `generator/woods.ts` (the rock woods types),
`generator/woodsApi.ts` (`CellContext.rocks`/`tops`, `TreeSlot.lift`, `rockCellContext`),
`generator/woodsExport.ts`, `generator/woodsGrove.ts`, `generator/text.ts`, `test/rocks.test.ts`
**See also** - [woods.md](woods.md), [trees.md](trees.md), [surfaces.md](surfaces.md),
[lod.md](lod.md), the game's `docs/gameplay/rocks.md`, the spec
[../specs/2026-11-08-rock-woods-types.md](../specs/2026-11-08-rock-woods-types.md)

## The species

| Key (stable) | Design | Shape | Size at scale 1 | Surface |
|---|---|---|---|---|
| `granite-boulder` | `proc-rock-granite-boulder` | a deformed icosphere, flattened underneath where it settled | 3.6-5.4 across, ~1-1.5 tall | `rock-granite` |
| `sandstone-tower` | `proc-rock-sandstone-tower` | a lathe: a column with a waist, a mushroom cap, a rounded crown, bedding grooves every 2.6-4.2 studs, vertical joints, each bed standing a little in or out | 16-30 tall, footprint radius 3.5-6.5 | `rock-sandstone` |
| `limestone-pinnacle` | `proc-rock-limestone-pinnacle` | a lathe: a fluted column sharpening into a needle over its top third, a flattened (blade-like) section, rillen | 12-24 tall | `rock-limestone` |
| `crag` | `proc-rock-crag` | a lathe: an elongated outcrop, one steep face, a back that slopes away, beds that recede and step out (ledges), blocky corners | 6-12 tall, 14-26 long | `rock-granite` |

Keys are stored in the game's maps (a stored rock names its species): never rename one. Each
species has five shapes, its `seed` parameter (`Rock shape`, "1".."5"); every number of a shape
comes from a hash of the species and the seed, so a shape never changes unless its code does.

The designs are **drafts** until confirmed (`generator/catalogModels.json`): the site lists them
under Workshop. The game does not take them from a meta file anyway: it builds every rock from
`woods.js`, like the trees.

## Levels and materials

Like a tree, a rock is built at four levels, each sampling the **same analytic shape** at its own
resolution and then fitted onto the high level's box, so a level change never changes its size:

| Level | Lathe rocks | Boulder | Triangles |
|---|---|---|---|
| `coarse` | a closed five-sided solid (sides, a top fan, a floor) | an octahedron | 8-20 (`COARSE_TRIANGLES`) |
| `low` | 8 corners a ring, rings every two layers | icosphere x1 | 80-120 (`lodTriangles` 300) |
| `high` | 18 corners, three rings a bed plus a groove at every bed joint | icosphere x3 | 594-1,314 |
| `max` | 36 corners, six rings a bed | icosphere x4 | 1,836-5,120 |

Like every model a rock stands on y = 0 in studs - but its foot is a **skirt** the game sinks
under the ground: `BURY` (1 stud) for a lathe rock (its first ring), `BOULDER_SINK` (a quarter)
of a boulder's full height (its settled underside). `rockInfo`'s `sink` says how far, so a rock
on a slope never shows its underside.

Two materials, named as the game's forest wants them (it merges the two meshes by name): `trunk`
is the stone, `foliage` the faces that look up (normal y at least 0.74; 0.9 for a boulder, so only
its crown) - moss, lichen, and the soil and needles that gather on a ledge. Every level has at
least one top face (the highest-facing triangle when no face passes the threshold). Both name the
species' surface, so both carry UVs and the merge keeps one vertex layout. Corners carry a baked
colour: dark and damp at the foot, darker in a bedding groove, a little noise up the face.

## The surfaces

`rock-granite` (the `boulder` photo set, Poly Haven `rock_boulder_dry`, a 3-stud repeat),
`rock-sandstone` (`sandstone`, `rock_face_03`, 7 studs) and `rock-limestone` (`limestone`,
`marble_cliff_01`, 6 studs) lift the material colour half way to white, so the stone and its top
tint one photo differently ([surfaces.md](surfaces.md)).

## What `rockInfo` measures

`rockInfo(species, seed)` measures a shape's high level at scale 1:

- `height`: above the ground (the model's full height less its `sink`);
- `sink`: how far under the ground the model's foot goes - the game draws it that much lower;
- `footprint`: the largest distance from the origin of any corner in the lower 35% of the rock -
  the ground it covers. Nothing is built inside it and no tree stands there;
- `tops`: where a tree may stand on the rock, `{ x, z, y, r }` - the centre of a tower's or a
  crag's top ring, the mean height of the top faces round it above the ground, and the room it has. None for a
  boulder or a pinnacle.

`woods.meta.json` lists every species with all five shapes measured (`rocks`), and `woods.js`
exports the same table as `ROCKS`.

## How the game uses them

The woods module carries the rocks with the trees: `SPECIES` lists both, `ROCK_SPECIES` the
rocks, and `buildTree(THREE, species, detail, { seed })` builds a rock as `proc-rock-<species>`
with meshes `trunk` and `foliage` and `userData.surfaces`.

- A **granite boulder** is a woods slot: a rock woods type or a forest with `boulders` plants it
  like a tree, its `height` the rock's full height (skirt included), its `width` a stretch, its
  `lift` minus `BOULDER_SINK` of its height so its foot sinks into the ground.
- **Towers, pinnacles and crags** are the game's **stored rocks**: placed objects saved in the
  map with species, seed, position, height, turn and scale. The game hands every cell what it
  sees of them through `rockCellContext(rocks, cx, cz, cellStuds, groundAt)` (exported in
  `woods.js`): the occupancy mask (`CellContext.rocks`, a 4 x 4 grid of the cell, `ROCK_GRID`)
  and the top spots inside the cell (`CellContext.tops`, each with its `lift` over the ground).

## The woods among rocks

Every planter ([woods.md](woods.md)) now reads the two rock fields:

- a tree whose spot lands on a rock square moves to a free quarter of the cell, or is not
  planted; a boulder never stands on one;
- top spots come first: each grows a canopy tree with the type's `topTrees` chance (0.7 unless
  the type says), smaller (by the spot's room) and **lifted** onto the rock (`TreeSlot.lift`);
- with no rock round a cell nothing changes: a forest grows exactly the trees it grew.

Four woods types grow round rocks; each also paints on open ground:

| Type | Own parameter | What grows |
|---|---|---|
| `rock-city` | `trees`: `pine`, **`mixed`**, `birch` | pines, Scots pines and birches in the lanes, bushes and young pines under them, fallen blocks, pines on 85% of the crowns |
| `boulder-field` | `trees`: `none`, **`few`**, `many` | granite boulders, about 1.2 a cell, and a few pines, birches and bushes |
| `crags` | `scrub`: `few`, **`some`**, `thick` | stunted pines and spruce, scrub, boulders, pines on 60% of the tops |
| `stone-forest` | `shrubs`: `few`, **`some`**, `many` | bushes and small oaks among pinnacles, the odd stone |

Their normal density (slots a cell, boulders included, over a large interior) is held by the
tests: rock city 0.54, boulder field 1.36, crags 0.67, stone forest 0.31.

Pine forest, mixed woods, Scots pine woodland and high mountain forest have a **`boulders`**
parameter: **`none`** (default), `few` (0.16 a cell), `many` (0.5). Boulders follow the density
grade but not the type's tree scale, and take the slots the trees left, clear of their trunks.

## Grove previews

A rock woods type's grove (`proc-woods-<name>`) stands a few stored rocks in its wood
(`GROVE_ROCKS`: a rock city's five sandstone towers, a stone forest's six pinnacles, three
crags), turned and scaled, and hands every cell what it sees of them through the same
`rockCellContext` the game uses, so the preview shows the lanes and the crowns as the game grows
them. The buried feet are flattened onto the preview's ground.

## Tests

`test/rocks.test.ts`: the species keys and designs; for every species and seed, the four levels'
budgets (coarse at most 20, low at most 300, high at most 3,000, max at most 10,000), both
materials non-empty at every level, the foot on y = 0 and the sink, every level fitted onto the
high box; the
surfaces; `rockInfo` (heights, footprints, tops); determinism; the occupancy mask and
`rockCellContext`; no tree or boulder on a rock square for any woods type; trees lifted onto
tops; a forest with `boulders` at its default grows exactly the old trees; `few` and `many`
boulders; the rock city grove. `test/woods.test.ts` covers the new types with the others.
