# Commercial street and historic buildings

**Covers** - eleven procedural families, their parameters, the complete legacy Commercial inventory and the legacy runtime correspondence.
**Code** - `generator/commercialStreets.ts`, `generator/partyWalls.ts`, `generator/generate.ts`, `assets/commercial/inventory.json`, `test/commercialStreets.test.ts`
**See also** - [parameters.md](parameters.md), [export.md](export.md), [skyscrapers.md](skyscrapers.md)

These eleven street-house families complement the five existing
[Commercial families](commercial.md). Their local generator keys use
`commercial-`; the central registry assigns namespaced procedural IDs.

## Scope and references

The webapp's `db/buildings/buildings.meta.json` contains 82 Commercial objects.
All 82 GLBs were measured and their existing thumbnails reviewed. The checked-in
inventory records each legacy ID, triangle count, bounds, default scale, SHA-256
and attribution. The originals are CC0 by Kenney (50) and Quaternius (32).
The source thumbnails for the 59 covered buildings are grouped under
`assets/commercial/<family>/` and shown as reference images in the factory.
No source GLB, external image service or webapp checkout is needed to build.

The new models are approximate architectural families, not one-for-one replicas.
There are 59 explicit architectural correspondences. The 22 simple tower models
(`citykit-low-*`, `citykit-skyscraper-*`, `comm-building-skyscraper-*`) and the
standalone `citykit-sign-hospital-1` are explicitly deferred. Existing factory
skyscrapers remain available; no new trivial tower has been added.

## Families

Local generator keys start with `commercial-`. Every model is in the site's **Commercial**
category and exports with the buildings in `skyscrapers.meta.json`. The catalog
has `group: commercial` and `defaultScale: 1`; that is a new-model placement
scale. Geometry uses metres with 3.2 m storeys; legacy instance scaling is handled by the central conversion export.

| Suffix | Architecture | Main legacy coverage |
|---|---|---|
| modern | Flat roof, floor bands, glazed storefront and optional awnings | comm-building and citykit small/large shop houses |
| balcony | Projecting balcony slabs and metal balustrades | Modern balcony houses, street-house-balcony |
| annex | Low side shop wing with a separate roof | comm-building-e/n, citykit-small-5/large-6, street-house-annex |
| brick | Corner quoins, cornices, framed windows, central entrance | Street houses and small/slim blocks |
| tenement | Tall brick block, repeated balconies | Street tenements and balcony blocks |
| shop | Low shop with glazed bays and optional canopy | Street stores |
| barrel | Faceted barrel roof with closed end walls | street-house-round, street-shop-round |
| terrace | Pitched roof, dormers, chimney pots, window hoods | oldtown-terrace and its wide version |
| gable | Stepped street gable and stone ground-floor arcades | oldtown-gabled and its wide version |
| baroque | Curving street gable, cornices, chimney and window hoods | oldtown-baroque |
| classical | Tall facade pilasters, hipped roof and window hoods | oldtown-classical and its wide version; columned house approximation |

## Parameters and geometry

- `storeys`: 2, 3, 4 or 5; the low shop has 1 or 2. Floor height is 3.2 m.
- `width`: narrow (2 bays), standard (3), wide (5), at 2.7 m per bay. Brick houses and tenements also offer extraWide (8 bays) for long street rows.
- `finish`: original, sand, sage or brick. This changes material colour only.
- `partyLeft`, `partyRight`, `partyBack`: a side a city's neighbour stands against, drawn as a
  blank party wall without windows, trims or overhang, its extent unchanged
  ([game-properties.md](game-properties.md), "Party walls"). The annex house has no right
  party wall: its shop wing stands there.
- `awning`: green, ochre or none, on modern shop houses and low shops.
- `roof`: flat or pitched, on brick houses, tenements and shops.

- `entrance`: level, stoop or paired, on brick houses and tenements. Stoops have three 15 cm risers; paired entrances serve double houses and long rows.
- `sign`: none or board, on brick houses and shops.

Geometry is in metres, grounded
at Y=0, with the street facade facing +Z. Modern buildings have an 8 m main depth,
historic families 9 m. A wing or balcony adds to that footprint. All combinations
stay below 10,000 triangles. More triangles are not added just to fill a budget.
Opaque blue window panes, layered surrounds, mullions, sills, floor bands and
roof details remain readable at the game's viewing distances.

Every window is one shared drawing (`window` in the source): a stone surround of
two jambs and a lintel standing 0.14 m proud of the wall, whose inner faces are
the reveals; the glass set back in it, 2 cm off the wall; a mullion and a transom
(at 60% of the height) spanning the glass exactly from edge to edge, flush where
they cross; a sill under the surround and, on the historic families, a head on
top of it. Only the faces the street sees are drawn, about 42 triangles a window
(52 with the head). Seen up close from an angle, the earlier layered panels -
glazing bars floating in front of the glass, stopping short of it at one end and
overhanging it at the other - read as skewed windows; the test "sets every street
window's glass back in its surround" pins the new layout.

The shared facade toolkit offsets material layers to avoid coplanar faces.
Named scopes expose masonry, windows, roofs, arcades, gables and wings in the
factory's source-tree viewer. Exported JS uses the same code as the GLB builder;
no generator implementation is imported into the site bundle.

## Legacy runtime correspondence

`assets/commercial/inventory.json` version 2 is the architectural input to the
central legacy mapping export. Its 82 `models` rows keep `legacyId`, `status`,
`targetId`, `params`, source bounds, source default scale and source attribution.
The 59 covered rows specify **every** parameter rather than inheriting defaults,
so a later catalog default change cannot silently alter existing maps. The 23
excluded rows remain in the audit inventory; the central mapping resolves these
against the other factory families.

The source thumbnails were reviewed by facade structure, not just name. The
ordinary double house keeps the standard footprint with paired entrances; the
wide double house and long tenements use eight bays. Stoop houses have steps,
shop-sign variants have a sign board, and gabled variants retain pitched roofs.
Finish choices distinguish sage houses from sand and brick families. This reuses
eleven architectural generators rather than adding a generator per old GLB.

The central export owns the final namespaced procedural IDs and conversion
`scale`. The consumer identifies old GLB IDs separately from procedural IDs,
resolves the old ID on the fly, and multiplies the saved instance scale by that
conversion factor. These families do not mutate saved maps.

Simplifications include regularized floor spacing and footprints, shared window
proportions, and approximate central bays and roof details. A scalar conversion
cannot preserve all dimensions when a source has different aspect ratios. The
geometry is built in real metres; historical oversized placement defaults are
not baked into the new mesh.

## Verification

`test/commercialStreets.test.ts` validates the 82-row inventory, all target parameters,
registration, grounded bounds, the triangle ceiling, deterministic defaults,
parameter effects and coplanar surfaces across every shape combination and finish.
The shared parameter suite also checks standalone JS/GLB vertex parity. Run
`pnpm typecheck`, `pnpm test`, `pnpm build`, and inspect the generated thumbnails
under `export/thumbs/commercial-*.png`. Verification is headless.
