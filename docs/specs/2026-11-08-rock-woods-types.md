# Rock woods types

Status: draft
Date: 2026-11-08
Area: rail-island-factory (rock species, rock woods types, woods export) and
rail-island-webapp (the forest renderer, woods board, map generation)

## Context of the change

The game's woods layer stores one woods id per 4-stud cell plus a table of woods
type names and parameter values (webapp `src/core/Woods.ts`,
`docs/rendering/woods.md`). What grows on a cell is decided by the factory: a woods
type is a deterministic planter (`generator/woodsApi.ts`, `generator/woods.ts`,
`docs/models/woods.md`) that fills at most four slots per cell, each a species, an
offset inside the cell (-0.5..0.5 of a cell), a rotation, a height and a tint. It
sees the 5x5 mask of same-type neighbours, the slope and the height. Species are
tree designs (`generator/trees.ts`, `docs/models/trees.md`) with five seeds and four
levels (max, high, low, coarse); `woods.js` carries every woods type and species
and the game imports it with `pnpm import:factory`.

The game draws the woods as a chunked forest: full trees nearest the camera under a
triangle budget (`docs/rendering/tree-budget.md`), octahedral impostors baked from
seed 1 farther out (`docs/rendering/tree-impostors.md`), a wind sway on every tree
material (`render/TreeWind.ts`), nothing beyond `radiusCells` (96-144 cells) where a
canopy tint on the ground takes over.

There is no rock in this system. Bare ground is only a terrain material (rock,
slate, cliff on the webapp branch `claude/nice-bardeen-7sat0b`, which carries part 1
of the rock work: the CLIFF material, the cliff brush and escarpments, reverted
from master). The river boulders on the webapp branch `claude/bold-ride-uy8cso`
are a water feature, not placeable objects; the factory branch of the same name
adds a `boulder` photo set.

## User request

Implement part 2 - several big rock designs in the factory. Use the woods approach.
It should also solve part 3 (rock cities: clusters of sandstone towers with trees
between them, like Adrspach or Prachov).

## Decisions

### Which rock designs belong in the first batch of factory rock species?
| Option | What it means |
|---|---|
| Sandstone towers | tall rounded pillars, bedding planes, waist, caps (Adrspach, Prachov) |
| Granite boulders | rounded cracked boulders 1-6 studs, single or heaped |
| Crags / outcrops | angular layered outcrops 6-20 studs jutting from slopes |
| Limestone pinnacles | grey fluted karst needles and fins, a stone forest |
**Answer: all four** - sandstone towers, granite boulders, crags / outcrops and
limestone pinnacles.

### How tall should the biggest rocks be?
| Option | What it means |
|---|---|
| Up to ~40 studs | towers 10-40 studs tall, 4-16 across; multi-cell anchors needed |
| Up to ~80 studs | monumental; more triangles, distance matters more |
| Fit in one cell | at most ~4 across, ~10 tall; too small for a rock city |
**Answer: up to ~40 studs.**

### Where should the spec live?
| Option | What it means |
|---|---|
| Factory repo | one spec here covering both repos |
| Webapp repo | webapp is on master, spec left uncommitted |
| Both | separate factory and game specs |
**Answer: factory repo.**

### Which rock woods types should ship?
| Option | What it means |
|---|---|
| Rock city | sandstone towers in tight clusters, lanes, pines and birches in the lanes |
| Boulder field | granite boulders single and heaped, scattered pines and shrubs |
| Crags | outcrops on slopes, scrub and stunted trees between them |
| Stone forest | limestone pinnacles and fins, sparse shrubs |
**Answer: all four** - rock city, boulder field, crags, stone forest. Each is one
woods type whose planter places its rocks and its trees, so they never collide.

### Should the existing forest types also be able to grow rocks?
| Option | What it means |
|---|---|
| Yes, a boulders parameter | pine, mixed, Scots pine, high-mountain forest get `boulders: none / few / many`, default none |
| No, rock types only | rocks grow only in the rock woods types |
**Answer: yes, a boulders parameter** (default `none`, so every existing map grows
exactly the trees it grew before).

### How should a rock wider than one cell be placed?
| Option | What it means |
|---|---|
| Anchor cells on a lattice | big rocks on hashed anchor cells, nothing saved per rock |
| Stored rock positions | big rocks are placed objects saved in the map (position, species, seed, size), like houses |
**Answer: stored rock positions.** This departs from the pure woods approach for
the big pieces; see the follow-up decisions below for how the two meet.

### How do pines stand on top of the sandstone towers (and crags)?
| Option | What it means |
|---|---|
| Lifted woods slots | a slot gets an optional height lift; top pines are ordinary tree species |
| Baked into the rock model | trees are part of the rock mesh, never sway |
| No trees on tops | bare tops |
**Answer: lifted woods slots.**

### What should rocks do past the forest's draw radius?
| Option | What it means |
|---|---|
| Rocks reach further | rock species draw to a wider radius than trees, as impostors or coarse solids |
| Same as trees | rocks stop with the trees; the ground tint takes over |
**Answer: rocks reach further.**

### Which rocks are stored and which are still grown by woods planters?
| Option | What it means |
|---|---|
| Big stored, boulders woods | towers, pinnacles and crags are stored objects; granite boulders stay woods slots |
| All rocks stored | every rock a stored object; woods plant only trees and shrubs |
**Answer: big stored, boulders woods.** Sandstone towers, limestone pinnacles and
crags are stored objects; granite boulders are woods slots (the boulder field type
and the forests' `boulders` parameter).

### How do the stored rocks get onto an island?
| Option | What it means |
|---|---|
| Single-rock tool | pick species and seed, tap to place, turn and scale; edit/delete like a house |
| Area scatter brush | paint an area: towers scattered with spacing and lanes, the matching woods type painted for the trees; erasing removes both |
| Island generator | new islands grow rock cities and crag belts on suitable ground |
**Answer: all three** - single-rock tool, area scatter brush and island generator.

### How do the woods trees avoid the stored rocks and grow on their tops?
| Option | What it means |
|---|---|
| Planter sees the rocks | the game passes each cell's rock occupancy mask and the top spots of rocks reaching it; the planter plants in free spots and lifts pines onto tops |
| Game filters afterwards | planter unchanged; the game drops trees in footprints and plants top pines itself |
**Answer: planter sees the rocks.**

### Storage for stored rocks
Proposal: an optional `rocks` list plus `nextRockId` in the map's `objects.json`,
each record id, species, seed, x, z, rot, scale and an optional `generated` flag,
loaded as an empty list on old maps; height from the terrain.
| Option | What it means |
|---|---|
| Approve as proposed | one optional list, no migration, handled like houses and springs |
| Also store the ground height | same plus a saved `y`; the rock keeps its height when the ground is edited |
| A per-cell rock grid instead | one byte per cell, no free position, rotation or scale |
**Answer: also store the ground height.** A rock keeps the `y` it was placed at
when the terrain under it is edited later.

### What happens when a player builds rail, a road or a house where a stored rock stands?
| Option | What it means |
|---|---|
| Rocks block building | a footprint is an obstacle like a house; remove the rock or tunnel under it |
| Building clears rocks | construction removes the rocks it touches, like woods |
**Answer: rocks block building.**

### How should the rocks look up close?
| Option | What it means |
|---|---|
| New photo sets | sandstone and limestone photo sets (plus the granite/boulder set) as named surfaces, side-projected |
| Vertex colour only | baked vertex colour, no textures |
**Answer: new photo sets.**

### Are rocks free for every player?
| Option | What it means |
|---|---|
| Free, like woods | every rock species and rock woods type on every plan, no model limit |
| Basic free, rest premium | boulders and one tower free, the rest on paid plans |
**Answer: free, like woods.**

### How does this relate to part 1 (cliffs and escarpments)?
| Option | What it means |
|---|---|
| Independent | rocks need nothing from part 1; the generator uses its own rules |
| Builds on part 1 | part 1 lands first; crags follow CLIFF cells, rock cities stand on benches |
**Answer: builds on part 1.** Part 1 (webapp branch `claude/nice-bardeen-7sat0b`)
lands on master before this work's game half.

## High-level plan

1. **Factory: rock species.** A rock family next to the trees: sandstone towers,
   limestone pinnacles, crags / outcrops and granite boulders, each with five
   seeds and the four levels (max, high, low, coarse), triangle budgets of their
   own, grounded and fitted like the trees. Each species states its footprint (the
   ground it covers, as a radius or outline) and its top spots (where a tree may
   stand on it, with their heights). New sandstone and limestone photo sets join
   the granite/boulder set as named surfaces. Titles in all 14 languages.
2. **Factory: rock woods types and the planter contract.** Four woods types - rock
   city, boulder field, crags, stone forest - and a `boulders` parameter (none /
   few / many, default none) on pine, mixed, Scots pine and high-mountain forest.
   The planter's cell context gains the rock occupancy of the cell and the top
   spots of the stored rocks reaching it; a slot gains a height lift. Planters put
   trees in the free spots and pines on tops; boulder slots are rock species. All
   of it is exported in `woods.js` and the meta and imported by the game. Grove
   previews show each rock type with sample stored rocks placed.
3. **Game: drawing.** Rock species draw in the forest without the wind sway, with
   impostors (or their coarse solids) out to a wider reach than trees, and cast
   shadows. Stored rocks draw from the same species builds, instanced by species
   and seed.
4. **Game: stored rocks.** The `rocks` list in the objects file, the footprint
   registered as a building obstacle, undo, export/import. A single-rock tool
   (species, seed, place, turn, scale, edit, delete) and an area scatter brush
   that places towers with spacing and lanes for rock city and stone forest,
   paints the matching woods type for the trees, and erases both.
5. **Game: island generation** (after part 1 is on master): new islands grow a few
   rock cities on escarpment benches and crag belts along CLIFF cells, as
   generated stored rocks, with boulder fields below the faces.

Phase 1 comes first; 2 needs 1; 3 needs 1-2 imported; 4 needs 3; 5 needs 4 and
part 1 on master.

## Database and persistent storage

- **Map objects file (R2 `objects.json`, game).** New optional fields
  `rocks: RockData[]` and `nextRockId: number`, beside houses, springs and dams.
  `RockData`: `id` (int, unique per map), `species` (string, a factory rock
  species name, e.g. `sandstone-tower`; never renamed once shipped), `seed`
  (int 1-5), `x`, `y`, `z` (studs; `y` is the ground height the rock was placed
  at, kept when the terrain under it changes), `rot` (degrees), `scale` (number),
  `generated` (optional boolean: placed by the island generator). Written by the
  single-rock tool, the scatter brush and the island generator; read by the
  renderer, the block map, the woods planting, export/import and backups. Lives
  as long as the map. Old maps lack the fields and load an empty list: no
  migration. An unknown species loads and draws nothing (kept in the file).
- **Map woods table (existing).** Gains new woods type names (`rock-city`,
  `boulder-field`, `crags`, `stone-forest`) and the forests' `boulders` value
  when not the default. Same structure as today; names and value tokens are
  stable once shipped.
- **Imported factory files (game `db/procedural`, existing pipeline).**
  `woods.js` and `woods.meta.json` carry the rock species (footprints, top
  spots) and rock woods types; the new photo sets arrive in `db/textures`.
  Regenerated by `pnpm import:factory`, never edited by hand.

## Architecture decisions

- **Big rocks are stored objects, boulders are woods slots.** Towers, pinnacles
  and crags need free position, rotation, scale, editing and blocking, which a
  per-cell planter cannot give; boulders are numerous and small, where the
  woods layer's saved-nothing determinism is the right cost.
- **The planter sees the rocks.** Trees avoid footprints and climb tops inside
  the factory's planter, from an occupancy mask and top spots the game passes,
  so a rocky cell keeps its tree count in the gaps and the factory owns the
  look. The alternative (game-side filtering) was simpler but sparser.
- **Lifted slots, not baked trees.** Pines on tops are ordinary tree species, so
  they sway, tint, use the budget and impostors like any tree.
- **Rocks reach further than trees.** A 40-stud tower is a landmark; letting it
  vanish with the forest radius would read as a bug.
- **Saved height.** A rock keeps its placed `y`; editing the ground under it
  does not lift or sink it.

## Weaknesses and risks

- **Saved `y` vs edited ground**: lowering the ground under a rock leaves it
  floating, raising it buries it. Likely; mitigation: rocks block height edits
  under their footprint like houses do (follows from "rocks block building").
- **Planter contract change** touches every woods type's inputs; the game and
  the factory must land it together. Old planters ignore the new inputs, so the
  game keeps a safety filter.
- **Draw reach and budget**: rock cities at long range add far geometry; the
  reach and impostor count need measuring on an X-Large mountain island.
- **Impostors** are baked from seed 1 per species; tall towers seen from low
  angles may show the impostor's limits. Possibly needs per-seed bakes for rocks.
- **Scatter brush determinism**: a painted rock city is saved rock by rock, so a
  large one is many records; size per map needs a sanity cap.
- **Part 1 dependency**: generation work waits for part 1 on master.
- **Open**: rock collision for the walking avatar and vehicles is not decided.

## Out of scope

- Overhangs, arches and caves (the terrain grid cannot hold them; a rock model
  could, later).
- Rocks for the embedded offline build's reduced catalog beyond what the default
  package lists.
- Premium gating (rocks are free).
- Changes to the CLIFF material or escarpments themselves (part 1).
