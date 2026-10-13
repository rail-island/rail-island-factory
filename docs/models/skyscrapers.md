# Skyscrapers

**Covers** - the ten procedurally generated skyscrapers, the mesh builder they
are made with, and how to add or change a design.
**Code** - `generator/skyscrapers.ts`, `generator/meshBuilder.ts`, `test/models.test.ts`
**See also** - [export.md](export.md), [../site/catalog-site.md](../site/catalog-site.md)

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

`SKYSCRAPERS` in `skyscrapers.ts` lists them as `{ id, title, build }`.
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
wall) and `scaleRing`.

Geometry is a flat-shaded, non-indexed triangle soup, one primitive per
material, with a plain `baseColorFactor` (no textures). The palette lives in
`skyscrapers.ts`; colours are written in sRGB hex and converted to linear.

**Winding matters.** three.js draws front faces only, so a wall wound inward is
invisible in the game and in the site's viewer - while the offline thumbnail,
which does not cull, still looks right. Every ring helper returns
counter-clockwise rings seen from above, and `loft`, `cap` and `spire` wind
outward/upward from that; `test/models.test.ts` checks it.

Units are metres, +Y up, base at y = 0. The game recentres a model on its
footprint, so a design need not be centred on the origin.

**Determinism.** Materials are written in name order and nothing carries a
timestamp, so the same code gives the same bytes. The GLB's `asset.generator`
string is `Rail Island procedural building (<id>)`, unchanged from when the
designs lived in the webapp, so a model built here is byte-identical to one built
there - which keeps the game's LOD proxy cache (keyed on the GLB bytes) hitting.

## Adding or changing a design

1. Write a function in `skyscrapers.ts` that returns a `MeshBuilder`, and add it
   to `SKYSCRAPERS` with an `id` (dash-separated, `sky-` prefix) and a title.
2. `pnpm build:models`, then look at `export/thumbs/<id>.png` - the headless
   check that the model is the right way up and reads well - or open it in
   `pnpm dev` and orbit it.
3. `pnpm test` - each model must stand on y = 0, be taller than twice its width
   and stay under 4,000 triangles.

Keep a design's triangle count in the low thousands: the game draws these many
times over in a big city. Most of the budget goes on repeated floor slabs and
piers, so tune their step and count first.

The meta.json entry follows automatically; nothing else is hand-maintained.
