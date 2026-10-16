# Commercial street and historic buildings

**Covers** - eleven procedural families, their parameters, the complete legacy Commercial inventory and the deferred save-map migration.
**Code** - `generator/commercialStreets.ts`, `generator/generate.ts`, `assets/commercial/inventory.json`, `test/commercialStreets.test.ts`
**See also** - [parameters.md](parameters.md), [export.md](export.md), [skyscrapers.md](skyscrapers.md)

These eleven `commercial-` families complement the five existing `comm-`
[Commercial families](commercial.md); the existing IDs and geometry are preserved.

## Scope and references

The webapp's `db/buildings/buildings.meta.json` contains 82 Commercial objects.
All 82 GLBs were measured and their existing thumbnails reviewed. The checked-in
inventory records each legacy ID, triangle count, bounds, default scale, SHA-256
and attribution. The originals are CC0 by Kenney (50) and Quaternius (32).
The source thumbnails for the 59 covered buildings are grouped under
`assets/commercial/<family>/` and shown as reference images in the factory.
No source GLB, external image service or webapp checkout is needed to build.

The new models are approximate architectural families, not one-for-one replicas.
There are 59 provisional correspondences. The 22 simple tower models
(`citykit-low-*`, `citykit-skyscraper-*`, `comm-building-skyscraper-*`) and the
standalone `citykit-sign-hospital-1` are explicitly deferred. Existing factory
skyscrapers remain available; no new trivial tower has been added.

## Families

All IDs start with `commercial-`. Every model is in the site's **Commercial**
category and exports with the buildings in `skyscrapers.meta.json`. The catalog
has `group: commercial` and `defaultScale: 1.88`; that is a new-model placement
scale, not a conversion of a legacy instance's saved scale.

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
- `width`: narrow (2 bays), standard (3), wide (5), at 2.7 m per bay.
- `finish`: original, sand, sage or brick. This changes material colour only.
- `awning`: green, ochre or none, on modern shop houses and low shops.
- `roof`: flat or pitched, on brick houses, tenements and shops.

There are 816 exposed parameter combinations. Geometry is in metres, grounded
at Y=0, with the street facade facing +Z. Modern buildings have an 8 m main depth,
historic families 9 m. A wing or balcony adds to that footprint. All combinations
stay below 10,000 triangles. More triangles are not added just to fill a budget.
Opaque blue window panes, layered surrounds, mullions, sills, floor bands and
roof details remain readable at the game's viewing distances.

The shared facade toolkit offsets material layers to avoid coplanar faces.
Named scopes expose masonry, windows, roofs, arcades, gables and wings in the
factory's source-tree viewer. Exported JS uses the same code as the GLB builder;
no generator implementation is imported into the site bundle.

## Future legacy import

`assets/commercial/inventory.json` is a **review inventory**, not an active
migration table. Covered rows propose a `targetId` and valid `params`; deferred
rows have no target. Keep every old ID readable until a webapp-side importer is
implemented. The current change does not change saved maps or the webapp.

The future importer must:

1. Resolve a legacy ID to the proposed family and parameters, allowing manual
   corrections after side-by-side review in the actual game.
2. Calibrate footprint, orientation and height using `sourceMin`, `sourceMax`,
   the legacy `sourceDefaultScale` and the generated variant's bounds. Do not
   copy a saved scale numerically: source GLBs use different unit scales. Decide
   explicitly how to handle aspect-ratio differences and per-instance overrides.
3. Preserve placement and rotation and retain deferred GLBs as fallbacks. Run
   old-map fixtures before replacing any existing ID.

Simplifications include regularized floor spacing and footprints, fewer facade
bays on very wide rows, shared window proportions, and approximate central bays,
stoops and signs. These are suitable starting families for later mapping, not
claims of exact silhouette or dimension parity.

## Verification

`test/commercialStreets.test.ts` validates the 82-row inventory, all target parameters,
registration, grounded bounds, the triangle ceiling, deterministic defaults,
parameter effects and coplanar surfaces across every shape combination and finish.
The shared parameter suite also checks standalone JS/GLB vertex parity. Run
`pnpm typecheck`, `pnpm test`, `pnpm build`, and inspect the generated thumbnails
under `export/thumbs/commercial-*.png`. Verification is headless.
