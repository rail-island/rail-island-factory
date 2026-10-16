# CD 810 source references

**Covers** - provenance, coordinate conversion, the liveries, dimensions and reconstruction choices of `veh-cd-810`.
**Code** - `generator/dmu810.ts`, `generator/cabNose.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/cd_810_1/landmarks.json`.
**See also** - [comparison (810, red)](COMPARISON.md), [photos](PHOTOS.md), [CD 812 / 912](../cd-812/SOURCES.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, one folder each under `native/`:

| folder | vlakosimdb (db/train/dmu/...) | author (index.xml) | model |
|---|---|---|---|
| `native/cd_810_1/` | cd_810#1 (CD 810, 24 t, 155 kW, 80 km/h) | Vojtech Vohlidka | `livery` red (the default) |
| `native/cd_810_2/` | cd_810#2 | Vojtech Vohlidka | yellowBand |
| `native/cd_810_3/` | cd_810#3 | Vojtech Vohlidka | blueWhite |
| `native/cd_810_4/` | cd_810#4 | Vojtech Vohlidka | ivoryBand |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs (0.1 m a pixel). No 4x texture was used or shipped. db/train/dmu/810/* (the archived 810 #1..#4 and their Baafx / Bix / Bifx trailers) is archived in the game and out of scope. The 812 and 912, once variants of this design, are `veh-cd-812` ([sources](../cd-812/SOURCES.md)).

## Dimensions

- CD 810 (CSD M 152.0): 13,970 mm over the buffers, body 13,103 mm, height 3,500 mm, wheelbase 8,000 mm, wheels 840 mm (cs.wikipedia "Motorovy vuz 810", de.wikipedia "CSD-Baureihe M 152.0", en.wikipedia "CSD Class M 152.0").

## Coordinates and reconstruction

- z_dec / z_inc 140 x 40 px on 14 x 4 m, x_both (-X end) and 2x_both (+X end) 30 x 40 px on 3 x 4 m. Source x = column / 10, y = 4 - row / 10. The XML body runs 0.4 to 12.9 m: x is scaled by 13.103 / 12.5 = 1.04824 (`K810`) about the centre 6.65 m; heights and widths are the XML's. The buffers stand 0.43 m off the body to the published 13.97 m.
- The body between the cab ends: the XML section (`alongx`), the floor at 0.8 m dropping to 0.45 m at the steps, the windows, doors and markings from the z_dec boxes.
- The cab ends follow the photographs (PHOTOS.md), not the 30 px front BMP, which cannot show their shape: a flat face with 0.13 m plan corners; two windscreens 1.25 m wide either side of a 0.14 m body-coloured pillar, from the sill at 2.0 m to 2.94 m, raked back 75 mm, in light grey rubber; the roof cap rounding back 0.21 m to the 3.3 m crown with the twin top lamps in a black oval housing; on the lamp band, a protruding housing at each side with a white inner and a red outer lamp; the CD emblem between them and the running number under the left one; the snow plough ("snehovy pluh") under the buffer beam from 0.74 m down to 0.18 m, its foot 60 mm ahead of the face and narrowed to 2.0 m, with a yellow edge; brake and heating hoses beside the coupling.
- The paints' band heights follow the photographs too: the yellow, ivory and blue-white lamp bands run from the sill (1.97 m) down to 1.35 or 1.4 m on the face and the sides, as 810 225-3, 810 545-4 and 810 563-7 show. The red livery keeps vlakosimdb's yellow front band (1.4 to 1.7 m) under its cream upper face. The blue-white's vertical yellow end stripes (vlakosimdb) are left out: the photographed car carries the yellow band round the corners instead.
- Axles 8.0 m apart (published) on 840 mm wheels.

## Running numbers

- red: 810 604-9 (illustrative; M 152.0604 survives in red), yellowBand: 810 225-3 (photographed), blueWhite: 810 472-1 (illustrative), ivoryBand: 810 545-4 (photographed, PHOTOS.md).
