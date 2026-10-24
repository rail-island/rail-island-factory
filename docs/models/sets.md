# Sets

**Covers** - the set registry: every content set the factory owns besides the models (the
game's structure types, rail and road types, block types, catenary styles), its frozen ids,
picker order, default and retired aliases, which sets are collectible, what "landed" means,
the per-set meta files and modules the export writes, and the tests that pin them.
**Code** - `generator/sets/registry.ts`, `generator/sets/setsExport.ts`, `generator/sets/<set>.ts`,
`generator/sets/pinCases.ts`, `generator/sets/writePins.ts`,
`test/sets.test.ts`, `test/setPins.test.ts`, `test/bridgeSet.test.ts`
**See also** - [bridges.md](bridges.md), [station-types.md](station-types.md), [previews.md](previews.md), [props.md](props.md), [text.md](text.md), [export.md](export.md), [woods.md](woods.md), the game's
`docs/tooling/factory-import.md` and `docs/architecture/sets.md`, the spec
`../specs/2026-10-23-factory-structures-and-textures.md`

## The registry

`SETS` lists one `SetDef` per set:

| Field | Meaning |
|---|---|
| `set` | the set's name (`bridge`, `station`, `roadType`, ...) |
| `collectible` | the game's collection kind (`structure:<kind>:<type>` D1 keys) when its types are rewards |
| `phase` | the spec phase that moves the set's definitions into the factory |
| `landed` | whether the definitions live in the factory yet (see below) |
| `defaultId` | what an unknown stored id draws as, after the aliases |
| `retired` | old id -> shipped id it now draws as |
| `types` | `{ id, label, description? }` in picker order; the English is the source of the exported text |
| `groups` | named groups the picker shows together (road families) |

Ids are stored in the game's saved maps, D1 collection keys, tool prefs and simulations, so
they follow the model-id rule: **never rename a shipped id**. A removed type is retired with an
alias onto the type it should draw as; `resolveSetId` resolves a stored id through the list,
the aliases and the default, which is the game's one unknown-id policy (the stored id itself is
kept verbatim on save).

| Set | Collectible | Phase |
|---|---|---|
| `blockType` | no | 2 |
| `busStop`, `cableCarStation`, `port`, `airport` | yes | 3 |
| `decoration`, `tunnelPortal`, `railType`, `roadType` | no | 4 |
| `dam` | yes | 4 |
| `station`, `roadStation` | yes | 5 |
| `bridge` | yes | 6 |
| `catenaryStyle` | no | 7 |

## Landed sets

Until a set lands, the game's own code draws its types, so `test/sets.test.ts` holds its ids to
exactly the game's list: a new id would reach the picker with nothing to draw it. A landed set
has a source module `generator/sets/<set>.ts` - pure, deterministic, **no imports at all** -
which the export bundles standalone and declares (`<set>.d.ts`, TypeScript's
isolated-declarations transform, so every export states its type); the set may then grow, and
still never loses a shipped id.

A set's module holds what its types ARE, and the game keeps what fits them to a world:

| Set | The module | The game keeps |
|---|---|---|
| `blockType` | `TYPE_META`: block data (below); `RETIRED_PARAMS`; the fill: `rollBlockParams`, `pickCandidate`, `chooseColours`, `fillRun`, `touchingSides`, `partyValues` | the planners (the frontages they walk, what fits on the ground), city types, profiles |
| `busStop` | `buildSide(type, lateral)`: one kerb's platform, shelter, fittings and flag in the side's frame (x along travel, z outward, y up), with `level` furniture groups | the pose on the road, both kerbs, the grade, levelling the furniture |
| `cableCarStation` | `TYPE_META`: footprint, rope-head height and the shed prop; `buildPylon(height)` | the head, the boarding platform, the rope solver, placing the shed |
| `port` | `TYPE_META`: family and grade; `PROPS`: the prop per role | layout, berths, approaches, decks, piles, placing the props |
| `airport` | `TYPE_META`: tower and windsock props; `terminal(pad, type)` and `furniture(pad, type)` | runways, taxiways, stands, paint, the radar, placing the props |
| `decoration` | `TYPE_META`: each kind's placement envelope (spacing, anchor, margins, top, steps, domain, sides, section); `buildPiece(kind, piece, ctx, out)`: one module's sweeps, boxes and plants | the intervals along a line, terrain probing, LOD layers, the plant meshes |
| `tunnelPortal` | `TYPE_META`: portal depth; `buildPortal(style, halfWidth, bore)`: the masonry face round the bore | the bore, its lining and ribs, the cover over it, placing the portal at each mouth |
| `railType` | `TYPE_META`: the cross-section every type shares - the rail (gauge between rail centres and the head / web / foot profile, real standard-gauge track at 1.5 studs a metre, so each head runs under every rail vehicle's wheel tread; `test/railSupports.test.ts` pins the two), the sleepers' size and spacing, the ballast bed and track spacing - plus each type's sleeper colour and material and the catenary style it is wired with (or none) | track generation, junctions, the rail meshes, the height of the running surface, the catenary planner |
| `roadType` | `TYPE_META`: width, shoulder, surface, centre line, tram tracks, terrain bands, tightest curve; the registry's groups are the surface families (narrow and wide member) | routing, junctions, tile batching, terrain flattening, lanes |
| `dam` | `TYPE_META`: body (gravity or weir), masonry surface, lock chamber, arcade; `COLORS`; `gravityParts`, `lockParts` (walls plus four named, hinged gate leaves), `arcadeLayout` / `arcadeParts` (with tower roofs) | where the dam stands, the wall and wings, the water, spillways, swinging the gates |
| `station` | `TYPE_META`: each type's layout recipe (platform and island widths, paired or side by side, the far side's platform or house strip); `buildLayout(type, tracks)`; `furnish(type, length, layout)`: the platforms, roofs, sheds, signs and furniture over any layout ([station-types.md](station-types.md)) | track generation, the persisted layouts, painting the name boards (`label` boxes), material meaning, the structure LOD |
| `roadStation` | `TYPE_META`: group (bus or truck) and island width; `dress(type, site)`: the bay posts and the type's dressing over a solved layout | the solver (stands, islands, roads, mount points), the islands' paving, the footprint banister |
| `bridge` | `TYPE_META`: the span policy (`maxSpan`, or none); the kit (path sampling and its deck frame, box, span, strut, wall and ribbon shapes, the deck section, piers, abutments) and one function per type, run per structural span over the path the game hands in (`pathFromPoints`, carrying the game's deck support height and overhead clearance), the cable types once over the whole path with shared towers (`cableTowerDistances`); `buildBridge(type, path, heightAt)`, the boundary pier style, `overheadMembers` and `overheadMemberEndpoints`, and the distant level `lowDetailBoxes`. Every box built from the terrain up is tagged `ground`. The types, kit and budgets: [bridges.md](bridges.md) | path planning, grade profiles, lanes, the deck geometry, the ground pier footprints, catenary fixings, merging the far level into chunks |
| `catenaryStyle` | `TYPE_META`: the support a style draws (mast or pole); `mast(style, input)`: the railway ladder mast with its footing or deck pedestal and its trackside arms or portal beam; `pole(style, input)`: the tram pole with its bracket arm and drops. Both take the heights the game plans with and return parts in one cross-section (box, bar, pole) | the planners (spacing, sides, wire runs, bridge and station fixings), the wires, the hangers |

Fixed props (a shed, a crane, a tower) are ordinary models, not module code ([props.md](props.md));
a set names them by id.

**Preview designs** show every type on the site, one page each, drawn by its module on a
representative fixture - [previews.md](previews.md).

## Pins

Nothing per box is saved in a map, so a change to a shipped type redraws every island that has
it. `generator/sets/pinCases.ts` builds every landed module from fixed inputs and hashes the
result with the hash the game shares (`pinHash.ts`: FNV-1a over canonical JSON, numbers to
1e-4); `test/setPins.test.ts` holds the hashes to `test/fixtures/set-pins.json`, and the export
writes them to `export/sets/pins.json`, from which the game's import names every case an import
redraws. A redraw meant on purpose: `pnpm sets:pins` rewrites the fixture and lists the cases
that moved.

## Block types

`blockType` is a landed set (`generator/sets/blockType.ts`): what a block of a settlement is
filled with, and the fill that fills it. There are six archetypes - `houses`, `street`,
`highrise`, `industrial`, `towerblock`, `landmark` - each in `TYPE_META` with its pools
(building `group`s) and their fixed mix, its placement (`perimeter` frontages or one `single`
building), its `ground` (`pavement`, `concrete` or null for the biome), an optional centrepiece
pool, an exclusion key two neighbouring blocks may not share, ring pools for a single building,
`landmarkIn` (the city types whose single blocks stand the settlement's plaza-landmark instead,
a village's church), and which settlements grow it: a weight per city type and ring (`cities`)
and a per-settlement cap (`limits`). Flags replace ids the game used to hard-code: `district`
(the family a city profile reweights and neighbouring blocks attract), `overlay` (the city
overlay's colour family), `profileFactors` and `decoration` (a village or industrial fence;
`heights` limits it to blocks of those height bands). Cities never wall their streets: there is no
noise-wall decoration.

**Block parameters.** A block takes one value of each of three parameters, rolled when a city
grows it and stored on the game's block record: `spacing` (`SPACINGS`: `touching` - wall to wall,
`tight` - rows broken now and then by a passage, `open`, `wide`; each a gap, a jitter, a setback
from the street, a density boost, a corner clearance and whether it builds rows), `colour` (one of the named `PALETTES`: warm, earth, brick, pastel, cool,
stone) and `height` (`mixed`, `low`, `mid`, `tall`). `params` in a type's data lists the
spacings and heights it may take, with weights; every type may take every palette.
`rollBlockParams` rolls them (the city's dominant palettes and the neighbours' schemes weigh
the colour), `storedBlockParams` reads a stored record's.

**Retired types.** The fifteen types before the archetypes are retired aliases in the registry
(`comm_low` draws as `street`) and `RETIRED_PARAMS` gives each the parameters it is read with (a
`comm_low` record is a `low` street, `village_red` a `brick` block of houses), so a saved city
keeps its character.

**The fill.** Both the game's planners and the site's block previews run the module's fill:
`pickCandidate` (a group by the mix, a candidate weighted by its width and filtered by the
block's height band), `chooseColours` (a building's colour values by the block's palette, the
map's standing variants favoured and, past a settlement's budget of new ones, reused),
`fillRun` (one frontage walked slot by slot with the spacing; the caller answers whether a
footprint fits, or where the building in its way ends; a gap narrower than `MIN_GAP`, 2.5 studs,
is never left - two buildings that would stand closer touch when both draw party walls on their
flanks and move `MIN_GAP` apart otherwise, and a refused wall-to-wall slot is not retried; on a
spacing that builds rows, `touching` and `tight`, the buildings with flank party walls are
`ROW_BIAS` times commoner, so a tight block of houses is a row of the village's row houses) and `touchingSides` / `partyValues` (the
faces two footprints share, which a design with party walls draws blank;
[game-properties.md](game-properties.md)). The game supplies the frontages and the fit;
everything chosen is the module's.

The data rides in `blockType.meta.json`; the game refuses an import naming a ground, city type,
ring or decoration it does not know. `test/blockTypes.test.ts` checks the names, that every city
type and ring can grow a type no exclusion can starve, the retired aliases and the fill
(height filter, palette colouring, reuse, wall-to-wall walks, the minimum gap, the row bias,
party walls); the pins hold the
data, the parameter rolls, a frontage per spacing and a party-wall case.

## The export

`generateSets` (a whole export only) writes `export/sets/`:

- `<set>.meta.json` for every set: `set`, `collectible`, `landed`, `defaultId`, `retired`,
  `types` (`{ id, ...TYPE_META[id] }`, no English), `groups` (`{ id, types }`) and, once
  landed, `module`. A landed module may export `TYPE_META`, per-type data the game reads
  without running it (a shed's size).
- `<set>.js` for a landed set: one minified ESM file with no imports, platform neutral, so the
  game imports it synchronously from core code, Vitest and the headless simulations (never the
  Worker, which reads the metas only), and `<set>.d.ts`, its declarations.
- `pins.json`: every landed set's case hashes (see Pins).

The game's `pnpm import:factory` mirrors the folder into `db/procedural/sets/` and generates the
TypeScript id unions and lists it derives its pickers, collection and gating from.
