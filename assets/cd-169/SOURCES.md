# CD 169 source references

**Covers** - provenance of the Skoda 85E "Asynchron" prototype's native files, dimensions, the coordinate conversion and reconstruction choices.
**Code** - `generator/cd169.ts`, `generator/czElectricKit.ts`, `generator/czElectricComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/cz-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/cd_169/`,
model by Vojtech Vohlidka, unchanged: `native/vehicle.xml`, `native/index.xml`
(clip profiles, baked polygons, texture mappings, the two `pant` inlines),
`native/options.json`, `native/x_both.bmp`, `y_dec.bmp`, `z_both.bmp`,
`image.bmp`. No `_4x` or other enhanced texture was used or shipped.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 169) and cs.wikipedia:

- 18.00 m over the buffers, a 16.70 m body, 2.94 m wide;
- 8.70 m between the pivots, 2.50 m bogie wheelbase, 1.25 m wheels;
- 4.555 m high with the collectors down; two single-arm pantographs;
- one unit, 169 001-5 (E 499.5001), built 1987, out of service 1997.

## Coordinates and profiles

The vlakosimdb body is 17.2 m long; its x is scaled by 16.70 / 17.20 = 0.971:
side column px -> x = (90 - px) * 0.0971 m (the source's x flipped, so its
raised `zadni` pantograph is at -X), row r -> y = 6.0 - r / 10.

- **Section** (alongx): 2.94 m wide to 3.5 m, the roof edge chamfered to 1.37 m
  at 3.7 m and 1.17 m at the flat roof (3.9 m); the roof-edge grilles lie on
  that chamfer.
- **Elevation** (alongz): the skirt 0.1 m in below 1.3 m, the vertical buffer
  band from 1.5 to 1.9 m, the long raked windscreen falling back 0.97 m by 3.7 m,
  the roof's leading edge 1.36 m back at 3.9 m (scaled).
- **Plan** (alongy): flat ends with 0.2 m corner chamfers.
- **Roof** (roof clip 6.9..11.1 m): the raised cover to 4.3 m between the
  pantographs, which stand at +-4.05 m.
- **Paint**: red; the dark buffer band across the noses and round the corners,
  the white-blue-white stripe from 1.5 to 1.9 m between the cabs; horizontal
  ribs on the side panels (native z_both rows 27-40).

Photographs of the unit at the 1987 Brno fair (`photo-169-001-front-1987.jpg`)
place the number plate in the dark band between the four lamps (red outside,
white inside) and a twin headlight under the windscreen, and show the
rectangular buffer heads; the model follows them where the native front is
ambiguous.
