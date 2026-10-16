# CD 710 620-6 source references

**Covers** - provenance of the T 334.0 / CD 710 native files, its dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/cd710.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/diesel/cd_710.620-6/`, "CD 710.620-6 (Rosnicka)" by Borek
Hudak, unchanged: `native/vehicle.xml` (28 t, 300 kW, 60 km/h),
`native/index.xml`, `x_both.bmp` (30 x 42), `y_dec.bmp`, `z_both.bmp`
(100 x 42) and `image.bmp`. No `_4x` or other enhanced texture was used.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 710) and cs.wikipedia: 9.44 m over the
buffers, an 8.20 m frame, axles 2.0 + 2.2 m apart (C, rod-coupled), 1.00 m
wheels, 39.6 t.

## Coordinates and profiles

`colorize` maps `z_both` to 10 x 4.2 m and `x_both` to 3 x 4.2 m: 0.1 m a
pixel. Side column px -> x = px / 10 - 4.5 (the source's x, centred on the
8.2 m frame, 0.4..8.6 m), row r -> y = 4.2 - r / 10; end column u -> z =
1.5 - u / 10 seen from ahead.

- **Frame** (base): 3.0 m wide, 0.9..1.2 m.
- **Hood** (box): 2.0 m wide over 0.6..8.4 m, 1.2..2.5 m, arched to 2.7 m;
  the ends lean back 0.1 m by 2.6 m and 0.2 m at the top; chamfered corners.
- **Cab** (cab): 3.0 m wide to 2.7 m, the walls leaning in, the roof arched
  to 3.6 m, over 3.9..6.2 m; the sun roof (umbrela) 0.1 m proud of it over
  3.8..6.3 m.
- **Paint**: red, the yellow band 1.9..2.3 m; the grey frame; the buffer beam
  in red and white stripes (x_both rows 33-38).

## Running number

710 620-6: the vlakosimdb model's name; the check digit by the 1988 scheme.

## Deviations

- The native buffers are 0.4 m long (9.0 m over them); the model uses the
  published 9.44 m.
- The native axles stand 2.5 + 1.95 m apart; the model uses the published
  2.2 + 2.0 m, the last two axles on the native ones.
- The native buffers stand 1.1 m off the middle; the model keeps the standard
  0.875 m.
