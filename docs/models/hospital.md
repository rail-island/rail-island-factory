# Hospital

**Covers** - the general hospital `proc-building-hospital` (confirmed): its massing, facade, emergency department and ambulance bay, rooftop plant, the raised rooftop helipad it exports as the air-ambulance stop, its catalog fields, budget, low detail, references and checks.
**Code** - `generator/hospital.ts`, `generator/generate.ts` (its family), `test/hospital.test.ts`, `test/export.test.ts` ("helipads")
**See also** - [game-properties.md](game-properties.md#helipads), [industry.md](industry.md#offshore-platform) (the other new building with a pad), [skyscrapers.md](skyscrapers.md) (the glass office's roof pad), [lod.md](lod.md), [../site/workshop.md](../site/workshop.md), [../specs/2026-11-06-helicopter-game-support.md](../specs/2026-11-06-helicopter-game-support.md)

## The design

A modern general hospital in real-size metres, +Y up, the ground at y = 0, its street
side facing +Z. It has no parameters. The site (68 x 48 m) is paved, with a road along
the front, lawns and street trees before the wing.

| part | size and character |
|---|---|
| ward block | 56 x 18 m, six storeys (a 4.65 m ground floor, five of 3.9 m), roof at 24.3 m, parapet to 25.5 m |
| treatment wing | 32 x 16 m in front of the ward block's west half, two storeys, the main entrance with a canopy, rooflights and the theatres' air handling units on its roof |
| emergency department | 24 x 9 m, one storey, in front of the ward block's east half: two glazed ambulance doors under a white canopy with a red fascia and a red cross, on three columns; two ambulances parked in yellow bays on the drive |
| signs | a white panel with a red cross high on the ward block's street front; a blue "H" sign at the drive's entrance |
| rooftop plant | a louvred plant room, two air handling units with fans, two flues |
| helipad | a 20 m square deck raised 3.3 m over the ward block's west roof on a steel frame, the stair core beside it |

The blocks share one facade kit (`block`): a glass core set 0.3 m behind white floor
bands and piers on a concrete plinth, a mullion in every bay, teal spandrel panels in a
fixed pattern of bays, and the roof slab inside a parapet.

## The helipad

The hospital is an air-ambulance stop: its pad is **small** (`HELIPAD_D.small`, 16 m: an
H145's D-value is about 13 m), drawn on every build, so the design declares
`game: { helipad: { material: "helipad", pad: "small" } }` with no `when`. The deck
(`HOSPITAL_HELIPAD`) is one box in the material `helipad`, drawn in nothing else; its top
is the touchdown surface. The markings lie on it in their own materials, each a few
centimetres higher than the one below so no faces are coplanar: the white perimeter line,
the yellow aiming circle (sixteen segments), the white "H" and a red cross on a white
square in the street-side corner. Twelve green lights stand round the edge, a safety net
runs round three sides below the deck's top, and the stair core's door opens onto it.
The export measures `{ pad: "small", centre: [-14, 28.4, -9], size: 20 }`
([game-properties.md](game-properties.md#helipads)).

## Catalog

`HOSPITAL_CATALOG`: category `Commercial` (the picker's tab), group `civic`, which is no
city pool (`cityVariants.ts`): cities never stand it; it is placed by hand. Default scale 1.
The id is in `generator/catalogModels.json`: it is **confirmed**, listed in the catalog and
carried by the game's building meta with its helipad.

## Budget and low detail

3,774 triangles, within the 10,000 of an ordinary building (the building skill). The low
detail (`hospitalLod`, 82 triangles of the 100) is the three blocks, the canopy, the plant
room, the helipad's support and its deck in the `helipad` material, and the stair core.

## References

`assets/hospital/` (`SOURCES.md`): Commons photographs of the air-ambulance pads at
University Hospital Coventry and Leeds General Infirmary, for the raised deck, its
markings and perimeter lights. The building itself is a generic modern hospital, not a
copy of either.

## Checks

`test/hospital.test.ts`: registered as a confirmed building in its own family; within budget, grounded,
deterministic and free of coplanar faces in full and low detail; the measured pad is small,
20 m, centred on the deck above the parapet, and the low detail keeps the deck in place.
`test/export.test.ts` ("helipads") measures it with the platform's. The catalog sweep checks
it like every design.
