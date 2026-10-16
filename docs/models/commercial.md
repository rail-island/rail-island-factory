# Commercial buildings

**Covers** - five original parametric commercial families, their Kenney-style references, architectural and finish variants, scale, budget, export and validation.
**Code** - `generator/commercial.ts`, `generator/generate.ts`, `test/commercial.test.ts`, `test/params.test.ts`
**See also** - [village.md](village.md), [parameters.md](parameters.md), [export.md](export.md), [source-tree.md](source-tree.md)

## Reference study

The webapp's `db/buildings/glb/comm-building-a.glb` through
`comm-building-n.glb` and their `thumbs/` images are the style reference.
They are Kenney City Kit (Commercial), CC0, and use the `comm_classic` pool.
The original meshes range from 1,100 to 5,246 triangles. These new designs
are original procedural buildings, not copies or replacements of those ids.

The shared vocabulary is pale, slightly chamfered wall volumes over a dark
ground floor; charcoal bands between storeys; blue glazing in chunky dark
frames; flat dark roofs with raised parapets and small ventilation units;
green or yellow shop awnings, terracotta planters and simple green shrubs.
The a-e references suggest compact shops, projecting upper floors and
setbacks; f-i add height and balconies; j-k widen the shop frontage; l-n
suggest taller offices and roof terraces. The charcoal finish also follows
the dark facade of h. No reference geometry, textures or ids are imported.

## Designs and combinations

Every family has 24 architectural combinations and 25 finish combinations,
so five catalog entries offer **3,000 variants**, 600 per entry.
The exported GLB and thumbnail show the defaults; the standalone JS model
and the site's parameter pickers build the other variants on demand.

| id | architecture | shape parameters (default first) |
|---|---|---|
| `comm-corner-shop` | compact shop house, storefronts on two adjacent faces | `storeys`: three/two/four; `width`: compact/broad; `frontage`: awning/sign; `roof`: plant/garden |
| `comm-balcony-house` | shops below individual balconies or continuous galleries | `storeys`: four/three/five; `width`: compact/broad; `balconies`: paired/gallery; `roof`: plant/garden |
| `comm-market-block` | wide commercial block with a row of separate shop canopies | `storeys`: three/four; `bays`: four/five/six; `frontage`: awning/sign; `roof`: plant/garden |
| `comm-terrace-house` | two upper floors set back from a street or corner terrace | `storeys`: four/three/five; `setback`: front/corner; `frontage`: awning/sign; `roof`: garden/solar |
| `comm-office-house` | slender office building, framed or closely spaced ribbon glazing | `storeys`: seven/five/nine; `width`: compact/broad; `facade`: grid/ribbon; `roof`: plant/garden |

The two-bay `compact` width is 7.3 m; the three-bay `broad` width is
10.55 m before trim. The market block has four to six bays. A terrace house's
upper floors retreat 3.6 m from the front; the corner option also retreats
4.4 m from its right side. Gallery balconies span the front; paired balconies
have a separate platform and railing at each window bay.

The finish parameters change colours without moving any vertex:

- `walls`: chalk, cream, sage, rose, charcoal.
- `accent`: green, gold, coral, blue, plum; colours shop awnings or sign fascias.

Defaults are chalk/green for the corner shop and terrace house, chalk/gold for
the balcony house, cream/gold for the market block and charcoal/blue for the
office house. `COMMERCIAL_FINISH_PARAMS` identifies these parameters for
`coverageCombinations`: every shape is tested at the default finish, then every
other finish value on the default shape. Tests verify that this reduction is
valid and that all 24 shape combinations within each family are distinct.
Ids and parameter names/values are saved-map contract once shipped.

## Builder and detail budget

`Commercial` in `commercial.ts` shares facade and roof details across the
five families. All geometry uses named scopes for the site's Source tab:
bevelled plinth, each storey and floor belt, framed glazing, glazed shop
entrances, canopies, balconies, terrace rails, roof plant, pergolas and
terracotta planters. Windows have a chamfered frame, an inset blue pane,
mullion, transom, sill and a brighter reflection. The reflection is an
outward-facing quad, not a solid box: detail is spent on the building's
silhouette rather than hidden faces. Roof plant includes two fan housings
and a capped vent; garden roofs have planters and an open timber pergola.
The terrace's solar option places three framed solar panels on its deck.

Wall surfaces stop under the floor belts. Panel layers sit at deliberately
different depths. Roofs, parapets and balcony decks have separated surface
ownership, following [skyscrapers.md](skyscrapers.md)'s flicker rule.
The normal export guard and the parametric suite check for z-fighting.

Buildings use metres, base at y = 0, street front +z, with 3.25 m storeys
and a 0.45 m plinth. Each variant stays below **10,000 triangles**; heights
range from a two-storey shop to a nine-storey office. Colour variation costs
no extra geometry. These are untextured, flat-shaded meshes with a small
shared material palette, like the other Factory models.

Measured triangle ranges across every architectural combination:

| Family | Minimum | Maximum |
|---|---:|---:|
| Corner shop | 1,930 | 4,240 |
| Balcony house | 3,138 | 7,104 |
| Market block | 3,522 | 5,890 |
| Terrace house | 2,946 | 5,050 |
| Office house | 4,342 | 9,080 |

## Catalog and export

`COMMERCIAL_CATALOG` supplies category `Commercial`, group `comm_classic`,
`defaultScale` 1.88 (game studs per metre), CC0, author/source Rail Island.
The scale follows the Factory village houses and metre-modelled buildings;
the tiny source Kenney meshes' scale of 17 is not applicable to these meshes.

The family is registered in `FAMILIES` as `commercial.ts`, meta `buildings`.
It appears in `BUILDINGS`, `DESIGNS`, `export/skyscrapers.meta.json` and
`export/catalog.json`, with default GLBs, thumbnails, source trees and
standalone parametric JS modules. There is no new importer or webapp change.
Publishing these exports into the game remains a separate requested step.

## Validation

`test/commercial.test.ts` checks registration and exported parameters,
the 3,000 combinations, all shape variants' finite coordinates, ground level,
size and triangle budget, distinct architectural combinations and finishes
that only recolour. `test/params.test.ts` also builds the shape coverage
deterministically, checks every variant for coplanar overlaps and verifies
that the standalone JS builds the same geometry using real three.js.
The existing model and export tests cover scopes and the generated files.
After `pnpm build:models`, inspect `export/thumbs/comm-*.png` headlessly;
also inspect non-default balcony, setback, roof and finish choices when
changing this kit. Browser automation is unnecessary.
