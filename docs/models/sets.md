# Sets

**Covers** - the set registry: every content set the factory owns besides the models (the
game's structure types, rail and road types, block types, catenary styles), its frozen ids,
picker order, default and retired aliases, which sets are collectible, what "landed" means,
the per-set meta files and modules the export writes, and the tests that pin them.
**Code** - `generator/sets/registry.ts`, `generator/sets/setsExport.ts`, `generator/sets/<set>.ts`,
`generator/sets/pinCases.ts`, `generator/sets/writePins.ts`, `generator/props/setPreviews.ts`,
`generator/props/stationPreview.ts`, `generator/props/roadStationPreview.ts`,
`test/sets.test.ts`, `test/setPins.test.ts`
**See also** - [props.md](props.md), [text.md](text.md), [export.md](export.md), [woods.md](woods.md), the game's
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
| `blockType` | `TYPE_META`: block data (below) | CityGen, facade numbers, city types, profiles |
| `busStop` | `buildSide(type, lateral)`: one kerb's platform, shelter, fittings and flag in the side's frame (x along travel, z outward, y up), with `level` furniture groups | the pose on the road, both kerbs, the grade, levelling the furniture |
| `cableCarStation` | `TYPE_META`: footprint, rope-head height and the shed prop; `buildPylon(height)` | the head, the boarding platform, the rope solver, placing the shed |
| `port` | `TYPE_META`: family and grade; `PROPS`: the prop per role | layout, berths, approaches, decks, piles, placing the props |
| `airport` | `TYPE_META`: tower and windsock props; `terminal(pad, type)` and `furniture(pad, type)` | runways, taxiways, stands, paint, the radar, placing the props |
| `decoration` | `TYPE_META`: each kind's placement envelope (spacing, anchor, margins, top, steps, domain, sides, section); `buildPiece(kind, piece, ctx, out)`: one module's sweeps, boxes and plants | the intervals along a line, terrain probing, LOD layers, the plant meshes |
| `tunnelPortal` | `TYPE_META`: portal depth; `buildPortal(style, halfWidth, bore)`: the masonry face round the bore | the bore, its lining and ribs, the cover over it, placing the portal at each mouth |
| `railType` | `TYPE_META`: sleepers, the ballast bed and track spacing every type shares, the catenary style it is wired with (or none) | track generation, junctions, the rail meshes, the catenary planner |
| `roadType` | `TYPE_META`: width, shoulder, surface, centre line, tram tracks, terrain bands, tightest curve; the registry's groups are the surface families (narrow and wide member) | routing, junctions, tile batching, terrain flattening, lanes |
| `dam` | `TYPE_META`: body (gravity or weir), masonry surface, lock chamber, arcade; `COLORS`; `gravityParts`, `lockParts` (walls plus four named, hinged gate leaves), `arcadeLayout` / `arcadeParts` (with tower roofs) | where the dam stands, the wall and wings, the water, spillways, swinging the gates |
| `station` | `TYPE_META`: each type's layout recipe (platform and island widths, paired or side by side, the far side's platform or house strip); `buildLayout(type, tracks)`; `furnish(type, length, layout)`: the platforms, roofs, sheds, signs and furniture over any layout | track generation, the persisted layouts, painting the name boards (`label` boxes), material meaning, the structure LOD |
| `roadStation` | `TYPE_META`: group (bus or truck) and island width; `dress(type, site)`: the bay posts and the type's dressing over a solved layout | the solver (stands, islands, roads, mount points), the islands' paving, the footprint banister |

Fixed props (a shed, a crane, a tower) are ordinary models, not module code ([props.md](props.md));
a set names them by id.

**Preview designs** draw the function types at a representative size for the site: a stop on a
short piece of two-lane road, a pylon of middling height (`generator/props/setPreviews.ts`), a
60-stud station of one, two or four tracks over its ballast and rails
(`generator/props/stationPreview.ts`), a road station on a fixed two-stand layout
(`generator/props/roadStationPreview.ts`) - `proc-preview-*`, category "Structure types". Each
source file is one bundle, so a preview carries only its own set module; one carrying a whole
module is held to its GLBs rather than the props' 24 KB. Glass draws opaque and name boards
stay blank. No game meta lists them and the site offers no
export of them.

## Pins

Nothing per box is saved in a map, so a change to a shipped type redraws every island that has
it. `generator/sets/pinCases.ts` builds every landed module from fixed inputs and hashes the
result with the hash the game shares (`pinHash.ts`: FNV-1a over canonical JSON, numbers to
1e-4); `test/setPins.test.ts` holds the hashes to `test/fixtures/set-pins.json`, and the export
writes them to `export/sets/pins.json`, from which the game's import names every case an import
redraws. A redraw meant on purpose: `pnpm sets:pins` rewrites the fixture and lists the cases
that moved.

## Block types

`blockType` is a landed set of pure data (`generator/sets/blockType.ts`, `TYPE_META`):
what a block of a settlement is filled with. Each type names its pools (building
`group`s) and their mix, its placement (`perimeter` frontages or one `single`
building), a facade style by name (`FACADE_STYLES`; the game owns the numbers), an
optional centrepiece pool, an exclusion key two neighbouring blocks may not share,
ring pools for a single building, whether it is the settlement's landmark, and which
settlements grow it: a weight per city type and ring (`cities`) and a per-settlement
cap (`limits`). Flags replace ids the game used to hard-code: `district` (the family a
city profile reweights and neighbouring blocks attract), `overlay` (the city overlay's
colour family), `profileFactors` and `decoration` (a village or industrial fence, a
tenement's noise wall beside it). The data rides in `blockType.meta.json`; the game
refuses an import naming a city type, ring or facade it does not know.
`test/blockTypes.test.ts` checks the names and that every city type and ring can grow
a type no exclusion can starve.

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
