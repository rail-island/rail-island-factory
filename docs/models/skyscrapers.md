# Skyscrapers

**Covers** - the ten procedurally generated skyscrapers, the mesh builder they
are made with, and how to add or change a design.
**Code** - `generator/skyscrapers.ts`, `generator/meshCore.ts`, `generator/meshBuilder.ts`, `generator/coplanar.ts`, `test/models.test.ts`, `test/skyscrapers.test.ts`
**See also** - [export.md](export.md), [source-tree.md](source-tree.md), [vehicles.md](vehicles.md), [../site/catalog-site.md](../site/catalog-site.md)

## The designs

Ten towers in distinct styles, each with floor slabs, mullions or piers, a podium
and a crown:

| id | title | look |
|---|---|---|
| `sky-glass-office` | Glass Office Tower | segmented blue curtain wall, entry canopy, sky-garden belt, crown blades and mast |
| `sky-art-deco` | Art Deco Tower | five stone setbacks, individual window panels, bronze setback ribs, fluted crown and steel spire |
| `sky-pagoda` | Pagoda Tower | octagonal gold-glass segments, flared rims, bronze buttresses and entry canopy |
| `sky-brick-residential` | Brick Apartment Tower | brick piers, window panels, balconies with return rails, roof garden and water tank |
| `sky-twin-towers` | Twin Towers | two stepped glass drums with vertical fins, spires and a framed sky bridge |
| `sky-twisted` | Twisting Tower | teal floors turning a quarter turn, corner fins, segmented glazing and rooftop pergola |
| `sky-dark-slab` | Black Glass Slab | patterned black glazing, bronze mullions and projecting sunshades, planted plaza |
| `sky-bullet` | Bullet Tower | swelling glass body, crossing spiral ribs and a double observation band |
| `sky-terraced` | Terraced Green Tower | segmented glass steps, terrace rails, raised planters and clustered shrubs |
| `sky-pyramid` | Pyramid Tower | white tapering pyramid, dense facade ribs, lift-shaft wings and entry canopy |

`SKYSCRAPERS` in `skyscrapers.ts` lists them as `{ id, title, build, params, finishParams }` (the
`ProceduralDesign` of `design.ts`).
`SKYSCRAPER_CATALOG` beside it holds the game-catalog fields they all share -
category `Commercial`, city pool `skyscraper_c`, `defaultScale` 0.5, CC0 by Rail
Island - which the build writes into each model's meta.json entry
([export.md](export.md)).

**The ids are stored in the game's saved maps**: never rename one that has
shipped.

## Parameters and budget

Each tower has **five height choices and 60 finish/height combinations**
(180 for Twisting Tower and 720 for Terraced Green Tower including their extra controls), available in the existing catalog parameter
pickers and standalone JS models, just like the village houses. Model ids stay
unchanged. Exports contain the default GLB and thumbnail plus the parameter specs.

| Parameter | Values | Default |
|---|---|---|
| `size` | `lowrise`, `compact`, `medium`, `standard`, `landmark` | `standard` |
| `glazing` | `original`, `blue`, `jade`, `bronze` | `original` |
| `structure` | `original`, `limestone`, `graphite` | `original` |

Original finishes preserve each tower's own palette. Glass colour changes both
light glazing and its darker panels; cladding changes the structural and masonry
materials. Planting and warning lights retain their colours. These two finish
parameters never move vertices, and palettes are copied per build.

Size selects complete storeys at approximately 40%, 60%, 80%, 100% and
120% of the standard count (rounded per shaft or tier). All geometry stays in
metres with the same catalog `defaultScale` of 0.5. Floor pitch, window height,
doors, balconies and framing retain their physical dimensions. Crowns and
bridges follow the selected floors; tapered profiles distribute over them.
The low-rise options can be wider than they are tall.

For example, Twisting Tower offers 14, 22, 29, 36 and 43 floors at 3.6 metres
per floor. Its `twist` control selects `straight`, `quarter` (default) or `half`:
the total rotation changes while floor heights and plate dimensions stay fixed.

Terraced Green Tower has two additional shape controls:

| Parameter | Values | Default |
|---|---|---|
| `terraces` | `3`, `4`, `5`, `6` | `5` |
| `terraceUse` | `gardens`, `seating`, `solar` | `gardens` |

Each terrace has four metres of setback and the top tier remains twelve metres
wide. Adding terraces adds horizontal bays to the lower tiers (20 to 32 metres
at the base), while distributing roughly 32 standard storeys across the tiers.
Size then changes their storey counts. The plinth, entrance and roof mast follow
the resulting footprint. Gardens have lawns, trees and raised planters; seating
has paved decks and benches; solar decks have panel racks. Railings remain on
all decks. These are geometry parameters, not finish-only options.

Regression tests compare actual floor spacing, entrance bounds and window
heights across sizes, check each terrace count and its furniture, and cover
all shape combinations through deterministic and standalone JS builds.

Each variant may use **up to 10,000 triangles**. Detail goes into visible facade
panels, fins, balcony edges, roof gardens and entrances rather than subdividing
flat walls. The tests cover all sizes and finishes, check palette isolation,
source bounds, determinism and z-fighting, and compare the browser model with
the generator. See [parameters.md](parameters.md) for the shared export contract.

## The mesh builder

Each design is an exported function of `skyscrapers.ts` (`glassOffice`, `artDeco`, ...): the JS bundle imports it by name.

The geometry (`meshCore.ts`; `meshBuilder.ts` adds the recording and the GLB, [js-format.md](js-format.md)) is deliberately small. Everything is a **loft** between two
horizontal rings of `(x, z)` points at two heights: a box is a four-point ring
lofted to itself, a frustum an n-gon lofted to a smaller one, and `spire()`
closes a ring to an apex. Ring helpers are `rect` (optionally turned about +Y),
`ngon`, `chamferedRect`, `grow` (offset outward, for slabs that stand proud of a
wall) and `scaleRing`. `sweep()` is the same loft laid on its side, along x or
z - what the vehicles are built from, and `part()` splits a model into named
nodes, an articulated vehicle's truck and trailer ([vehicles.md](vehicles.md)).

Geometry is a flat-shaded, non-indexed triangle soup, one primitive per
material, with a plain `baseColorFactor` (no textures). The palette lives in
`skyscrapers.ts`; colours are written in sRGB hex and converted to linear.

**Winding matters.** three.js draws front faces only, so a wall wound inward is
invisible in the game and in the site's viewer - while the offline thumbnail,
which does not cull, still looks right. Every ring helper returns
counter-clockwise rings seen from above, and `loft`, `cap` and `spire` wind
outward/upward from that; `test/models.test.ts` checks it.

**Scopes.** `m.scope(name, fn)` groups the calls `fn` makes into a named node of
the model's source tree, which the build writes beside the GLB and the site
shows; recording never changes the geometry. See [source-tree.md](source-tree.md).

Units are metres, +Y up, base at y = 0. The game recentres a model on its
footprint, so a design need not be centred on the origin.

**Determinism.** Materials are written in name order and nothing carries a
timestamp, so the same code gives the same bytes. The GLB's `asset.generator`
string is `Rail Island procedural building (<id>)`, unchanged from when the
designs lived in the webapp, so unchanged designs retain their cache identity.
Architectural changes alter the GLB bytes and invalidate the game's LOD proxy cache for the changed design.

## Flicker (z-fighting)

Two faces of **different materials** that lie in one plane, face the same way
and overlap cannot be ordered by the depth buffer: the GPU shows one or the other
pixel by pixel and the surface flickers as the camera moves. The art deco tower
did it at every setback - its dark window core, its stone piers and its cornice
all ended at one height, three roofs in one plane - and the glass office,
apartment, black slab and terraced towers had smaller cases of the same thing.

The rule is **one part owns each surface**:

- A core whose roof something else covers is built **open-topped** -
  `box(..., ry, top = false)` (or `prism(..., top = false)`). `curtainWall()`
  never caps its glass: its caller puts a slab or cornice on it, wider than the
  mullions.
- Parts that would end flush under a cap stop **below** it (the art deco piers
  end 1.2 m down, under the cornice).
- Parts that sit beside each other must not share a face plane where they
  overlap: the apartment balconies are 4.4 m rather than 4.6 m wide, so their ends
  fall between the brick piers' faces instead of on them.

Faces that merely touch along an edge, faces back to back, and overlaps of one
material (both sides of the fight are the same colour) are harmless.

**What enforces it.** `generator/coplanar.ts` `findCoplanarOverlaps()` finds every
overlapping same-facing pair of differently coloured faces in a GLB, merged per
material pair and plane. It runs twice over:

- **in the build** - `generateModels()` checks every design before writing
  anything and throws a `ZFightingError` listing each offender (design, material
  pair, plane, overlap area). The deploy does not wait for the tests, so this is
  what keeps a flickering model off the site and out of the export;
- **in the tests** - `test/models.test.ts` asserts no overlaps for every design,
  plus the detector's own cases and the build guard.

The detector buckets faces by exact plane (rounded to a millimetre), which is the
case that fights - the designs place coplanar faces at exactly equal
coordinates. Two surfaces a hair apart are not reported; keep a deliberate gap
to at least a few centimetres.

The site's viewer does its part on the other side: it fits the camera's near and
far planes to each model rather than a fixed range, so depth precision is spent
where the model is ([../site/catalog-site.md](../site/catalog-site.md)).

## Adding or changing a design

1. Write a function in `skyscrapers.ts` that returns a `MeshBuilder`, and add it
   to `SKYSCRAPERS` with an `id` (dash-separated, `sky-` prefix) and a title.
   Wrap every part in a named `m.scope(...)` - podium, each tier or segment,
   crown - so the site's Source tab reads like the design; the tests refuse a
   primitive drawn outside any scope ([source-tree.md](source-tree.md)).
2. `pnpm build:models`, then look at `export/thumbs/<id>.png` - the headless
   check that the model is the right way up and reads well - or open it in
   `pnpm dev` and orbit it.
3. `pnpm test` - each model must stand on y = 0, be taller than twice its width,
   stay at or below 10,000 triangles and have no z-fighting faces (the build already
   refuses the last; see "Flicker" above for how to resolve a report).

Keep repeated details economical: the game draws these many times over in a
big city. The 10,000-triangle limit applies to every parameter combination, not
just the default. Tune panel density and floor-band counts before adding detail.

The meta.json entry follows automatically; nothing else is hand-maintained.
