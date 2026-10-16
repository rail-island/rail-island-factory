# Remaining Creator models
**Covers** - fountains, castles and other historical buildings, remaining transport models and freight variants.
**Code** - `generator/fountains.ts`, `generator/legacyBuildings.ts`, `generator/legacyVehicles.ts`, `generator/wagonExtras.ts`, `generator/wagons.ts`, `generator/freightWagons.ts`, `generator/hopperWagons.ts`
**See also** - [legacy-mapping.md](legacy-mapping.md), [reproductions.md](reproductions.md), [wagons.md](wagons.md), [freight-wagons.md](freight-wagons.md)

## Buildings

Three fountains retain their recognizable layouts and real sizes: classical
6.7 m round tiered fountain, 6.4 m square modern basin with nine nozzles, and
6.6 m octagonal obelisk fountain. The classical bowls have shaped undersides,
raised lips, inset water and pedestal fluting. Basins have a bevelled plinth and
contrasting coping; nozzles have bronze footings. Water jets remain a game effect.

The castle is one parametric family with `layout=courtyard|keep|fortress`.
It has curtain walls, an actual gate opening, projecting round corner towers,
crenellations, arrow slits and (except the low fortress) a tall roofed tower and great hall. The old
castle/medieval-castle pair uses the courtyard family; the keep and fortress use
their corresponding layouts. These are architectural reinterpretations, not exact
copies of each old castle's individual tower arrangement.

Other additions are an open oval Colosseum with three arcade tiers and seating,
a three-storey pagoda with curved tile roofs and timber galleries, an onion-roof palace silhouette and a station hotel with
its taller end block. The old generic cathedral and church map to existing gothic
and baroque families. Real-world landmark dimensions are approximate except where
an explicit dimension is documented in the owning family reference.

Detailed geometry, budgets and references for Castle and Pagoda are documented in
[historical.md](historical.md).

## Air, water and rope

The classic cabin has a glazed body, rounded corners, cream framing, red lining,
four hanger braces and a two-wheel rope carriage. Body dimensions follow the old
native model (3.78 by 2.58 m); the rope wheels are at y=5.62 m.

The Boeing 737-800 now lives with the other aircraft in `aircraft.ts`
([aircraft.md](aircraft.md)); it still faces -X with yaw 0. The four-funnel ocean liner is 269 m long with a 28 m
beam, tiered deckhouses, lifeboats, masts and stays. This replaces the old game-sized
liner with metre geometry; the legacy mapping compensates only old placements.

## Freight additions

Existing Pao and Wap families gain `cargo=empty`; their old default loaded geometry
is unchanged. Nas with a tram and Pao with a bus are intentionally omitted; both legacy IDs map to their corresponding empty wagon. New covered wagons share `body=box|beer|sliding` (Z, Lp,
Zaz), with different length, roof profile, door span and axle arrangement. Vte is
a short two-axle open wagon, Uaaikk a bogie low loader with a dropped deck, stakes
and an end brake shelter. These bodies are based on the original XML profiles and
native, non-upscaled textures retained in `assets/remaining-wagons/native/`.

Running gear reuses the factory's 1.435 m gauge wheelsets, bogies and 1.75 m buffer
spacing. Small buffer/axle details follow that mechanical standard rather than the
low-resolution reference's painted rectangles. Freight numbers on the new bodies
are illustrative valid UIC numbers, not claims about photographed individual cars.
See the source folder for provenance and the measured comparison.

## Verification

The standard suites check deterministic GLB/JS parity, valid parameter combinations,
finite geometry, named source scopes, triangle budgets and coplanar overlaps. The
legacy mapping test separately checks complete coverage, target parameters,
old/new ID separation, scale composition and preservation of stored references.
All previews are rendered headlessly; no browser automation is used.
