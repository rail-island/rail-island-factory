# Site previews

**Covers** - the site's preview designs: one page per structure type, rail and road type, line
decoration, catenary style, city block type and texture, drawn from the set modules and the
props on a representative fixture; their categories, bound build functions, preview parameters,
surfaces, the drawing kit, the block composer, and the checks they pass.
**Code** - `generator/previews/` (`index.ts`, `sketch.ts`, `wayKit.ts`, `bridges.ts`, `stations.ts`,
`structures.ts`, `ways.ts`, `props.ts`, `textures.ts`, `blockKit.ts`, `blocks*.ts`),
`generator/design.ts` (`bound`, `boundDesign`, `ParamSpec.preview`), `generator/jsModel.ts`,
`src/catalogQuery.ts`, `src/ModelDetail.tsx`, `test/previews.test.ts`, `test/catalogSweep.ts`
**See also** - [sets.md](sets.md), [props.md](props.md), [surfaces.md](surfaces.md),
[parameters.md](parameters.md), [../site/catalog-site.md](../site/catalog-site.md)

## What they are

The game builds its structures, ways and city blocks itself, over the world it solves: a
bridge over the path a player draws, a station over the tracks it generates, a block on the
lots of a street plan. The factory owns what a type *is* (the set modules, [sets.md](sets.md)),
and the site shows each type on a page of its own by running the type's module on a fixed
**fixture**: a straight crossing of flat ground, a station of a chosen track count and length,
a two-stand road station, a quay facing water, a terminal pad by its apron, a dam across a flat
valley, a short piece of track or road, a sample block. They are site-only designs
(`proc-preview-*`): no game meta lists them, the site offers no export of them, and they are
not translated. The `proc-preview-*` id only names a page's files and its URL and the site never
shows it: a page carries its type's id as `gameId` (`catalog.gameId`, copied into the record),
exactly as a saved game stores it - `platforms_shared`, not `platforms-shared` - and the site
shows that instead ([../site/catalog-site.md](../site/catalog-site.md)). Texture pages and the
cable-car pylon draw no set type and show no id.

| Category (first chip) | Second chip | Pages |
|---|---|---|
| Structures | the set: bridges, bus stops, railway stations, bus and truck stations, cable car stations, ports, airports, dams, tunnel portals | one per type of the set |
| Rails and roads | rail types, road types, line decorations | one per type |
| City blocks | the block's district (residential, commercial, industrial, historic, high-rise) | one per block type |
| Props | - | the cable-car pylon and each catenary style's support, beside the fixed props |
| Textures | - | one per photo set of the library |

## One page per type

Each family is one source module, whose build functions take the type as a second argument:
`bridgePreview(values, type)`. A page is that function **bound** to its type (`boundDesign`,
`design.bound`): the generator calls the bound closure, and the design's JS model imports the
shared function and passes the bound type along, so a page has no "type" parameter and the site
lists every type as a model of its own. The titles are the registry's English names
(`index.ts`, kept apart from the build modules so the registry's text never rides in a bundle).

## Parameters and preview parameters

A preview's parameters split in two, shown in two blocks on the model page:

- **Parameters** - what the game passes as a player set it: a station's track count and
  length, a road station's stand count, what a tunnel carries (one track, two, a wide road), a
  rail mast over one track or a portal over two.
- **Preview parameters** (`ParamSpec.preview`) - the fixture only, which the game takes from
  the world: a bridge's span, what its deck carries (one to three tracks, a narrow or wide
  road) and its wires (none, a tram's, a railway's), a port's berth, an airport's terminal pad,
  a dam's valley, a way's length, a city block's size and sample.

## Drawing

`sketch.ts` draws the game's structure vocabulary - boxes (tilted about X or Z, turned about Y,
gable prisms, tapering tops), bars and spans between two points, round poles, pyramids,
sections swept along a mitred path, walls of varying height - into one MeshBuilder. A material
is a kind and a colour, and may name a surface: the bridges, roads, rail beds and footings,
stop dressing, airport pavements, dams, tunnel portals and the gallery carry the photos the game
binds ([surfaces.md](surfaces.md)), which the site's 3D preview shows; thumbnails stay flat.

The game's geometry places faces of two materials on one plane (a parapet on its deck, a glass
pane in its rib), which would flicker. Every material is drawn a hair bigger than the one
registered before it - a fixed odd step per material, a sweep's ends moved too - so two flush
faces always end apart and no part, however thin, turns inside out; a box standing on the
ground keeps its foot there. A sketch is lifted so its lowest point is the ground.

## City blocks

`blockKit.ts` grows a sample block from the block type's data: a perimeter block lines its four
frontages with buildings picked from its pools by their mix and, per building, a preset its city
presets weigh (`cityPresetsOf`), each facing the street (+Z at yaw 0, as the game's CityGen
turns them) with a gap between neighbours; a single-building block stands one from its ring pool
on its own origin. Every building is drawn by its own design and baked in, its materials under
its design's id; streets and a kerb strip run round the block. The distant level is each
building's massing, a box over its footprint in its commonest material. The pools' designs come
from the modules that hold them, so each family of block types (`blocksVillage.ts`,
`blocksCommercial.ts`, ...) is its own source module and bundles only its pools' code; ids are
taken as the export settles them (`proceduralId`), so presets are found inside a bundle too. A
block's page has no Source tab: its designs set `sourceTree: false`, as their trees are too big to
deploy ([source-tree.md](source-tree.md)).

## Textures

A texture page is a slab and a block faced with the photo at four studs a repeat, untinted - the
`swatch-*` surfaces, which nothing in the game binds.

## Checks

The previews pass every design's checks (`test/catalogSweep.ts`): JS as in the generator, no
coplanar faces of two materials, the lowest point on the ground, a LOD within its budget (500
triangles; 12,000 for dams, decorations and blocks, whose distant level is still a drawing of
several parts). A preview's JS, which carries its set module and is never exported to the game,
is held to 48 KB or its GLBs. `test/previews.test.ts` holds every set type, block type and photo
set to exactly one page, in its category and bound to it, and the preview parameters to the
fixtures.
