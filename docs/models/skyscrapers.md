# Skyscrapers

**Covers** - the ten procedurally generated skyscrapers, the mesh builder they
are made with, and how to add or change a design.
**Code** - `generator/skyscrapers.ts`, `generator/meshBuilder.ts`, `generator/coplanar.ts`, `test/models.test.ts`
**See also** - [export.md](export.md), [source-tree.md](source-tree.md), [vehicles.md](vehicles.md), [../site/catalog-site.md](../site/catalog-site.md)

## The designs

Ten towers in distinct styles, each with floor slabs, mullions or piers, a podium
and a crown:

| id | title | look |
|---|---|---|
| `sky-glass-office` | Glass Office Tower | square blue curtain wall, stone podium, plant floor, mast |
| `sky-art-deco` | Art Deco Tower | five stone setbacks with dark window strips, steel spire |
| `sky-pagoda` | Pagoda Tower | octagonal gold-glass segments, each flared with a rim |
| `sky-brick-residential` | Brick Apartment Tower | brick piers, balconies, water tank on the roof |
| `sky-twin-towers` | Twin Towers | two stepped glass drums with spires, a sky bridge between |
| `sky-twisted` | Twisting Tower | teal floors turning a quarter turn over the height |
| `sky-dark-slab` | Black Glass Slab | black glass and bronze mullions on a plaza |
| `sky-bullet` | Bullet Tower | round, swelling then curving to a tip, banded glass, spiral ribs |
| `sky-terraced` | Terraced Green Tower | glass steps receding to one corner, planted terraces |
| `sky-pyramid` | Pyramid Tower | white tapering pyramid with two lift-shaft wings |

`SKYSCRAPERS` in `skyscrapers.ts` lists them as `{ id, title, build }` (the
`ProceduralDesign` of `design.ts`).
`SKYSCRAPER_CATALOG` beside it holds the game-catalog fields they all share -
category `Commercial`, city pool `skyscraper_c`, `defaultScale` 0.5, CC0 by Rail
Island - which the build writes into each model's meta.json entry
([export.md](export.md)).

**The ids are stored in the game's saved maps**: never rename one that has
shipped.

## The mesh builder

`meshBuilder.ts` is deliberately small. Everything is a **loft** between two
horizontal rings of `(x, z)` points at two heights: a box is a four-point ring
lofted to itself, a frustum an n-gon lofted to a smaller one, and `spire()`
closes a ring to an apex. Ring helpers are `rect` (optionally turned about +Y),
`ngon`, `chamferedRect`, `grow` (offset outward, for slabs that stand proud of a
wall) and `scaleRing`. `sweep()` is the same loft laid on its side, along x or
z - what the vehicles are built from ([vehicles.md](vehicles.md)).

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
designs lived in the webapp, so a model built here is byte-identical to one built
there - which keeps the game's LOD proxy cache (keyed on the GLB bytes) hitting.

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
   stay under 4,000 triangles and have no z-fighting faces (the build already
   refuses the last; see "Flicker" above for how to resolve a report).

Keep a design's triangle count in the low thousands: the game draws these many
times over in a big city. Most of the budget goes on repeated floor slabs and
piers, so tune their step and count first.

The meta.json entry follows automatically; nothing else is hand-maintained.
