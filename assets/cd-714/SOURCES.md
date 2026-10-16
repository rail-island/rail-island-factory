# CD 714 source references

**Covers** - provenance of the CD 714 native files, its dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/cd714.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/diesel/cd_714/`,
"CD 714" by Vojtech Vohlidka, unchanged: `native/vehicle.xml` (64 t,
1020 kW, 90 km/h), `native/index.xml`, `x_both.bmp` (30 x 50), `y_dec.bmp`,
`z_both.bmp` (140 x 50) and `image.bmp`. No `_4x` texture was used.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 714) and cs.wikipedia: 14.24 m over the
buffers, 7.60 m between the pivots, 2.40 m bogie wheelbase, 1.00 m wheels.

## Coordinates and profiles

`colorize` maps `z_both` to 14 x 5 m and `x_both` to 3 x 5 m: 0.1 m a pixel.
Side column px -> x = px / 10 - 7.0, row r -> y = 5 - r / 10; end column u
-> z = 1.5 - u / 10 seen from ahead. The cab and the short hood are at +X.

- **Frame** (base): 3.0 m wide, 1.1..1.5 m, over 0.3..13.6 m with chamfered
  corners (the model's frame ends at +-6.65 m).
- **Hood** (base): 2.0 m wide, 1.5..3.2 m, over 0.7..13.2 m.
- **Cab** (cab): 3.0 m wide to 3.0 m, leaning to 2.6 m at 3.8 m, over
  7.7..9.8 m; the roof flares to 7.3..10.2 m at 4.2 m.
- **Paint**: the blue hood with lighter louvre columns, red hood ends with the
  white V, the red cab, the grey frame, the yellow plough edge.

## Running number

714 017-1: illustrative, a 714.0 photographed in this paint (PHOTOS.md); the
native plate does not resolve digits. Check digit by the 1988 scheme.

## Deviations

- The native bogies sit 0.09 m toward -X of the body's middle and 7.58 m
  apart; the model centres the published 7.60 m.
- The native end draws the white V filled in its lower half; the model paints
  the open V of the photographs, with the grille in its notch and two small
  lamps over it.
- The native cab front shows one wide window; the model has two panes.
