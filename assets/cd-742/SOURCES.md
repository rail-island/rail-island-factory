# CD 740 / 742 / 743 source references

**Covers** - provenance of the three native models the design's variants come from, the dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/cd742.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/diesel/`,
unchanged:

- `viamont_742.507/` (in `native/viamont_742.507/`), "V 742.507" by Borek
  Hudak: `vehicle.xml`, `index.xml`, `x_both.bmp`, `y_dec.bmp`, `z_both.bmp`,
  `z_dec.bmp`, `z_inc.bmp` (140 x 50; z_dec and z_inc are the two sides, the
  lettering mirrored on z_inc) and `image.bmp`. The default variant.
- `viamont_740.627/` (in `native/viamont_740.627/`), "V 740.627", same author:
  the same body but for the short hood, which is 2.3 m wide and only 3.2 m
  high (XML box clips), and separate x_dec / x_inc ends (the cab's front
  windows show on x_inc).
- `cd_743_002/` (in `native/cd_743_002/`), "CD 743 002" by Vojtech Vohlidka:
  its own, slightly lower drawing of the same body (frame 1.1..1.6 m, hood to
  4.2 m, the cab at the other end of its canvas) in the blue, light blue and
  white paint with the red line and diagonal white stripes.

The bodies are close enough for one design with a `variant` parameter:
`viamont742` (default), `viamont740` (the low short hood) and `cd743`.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 742, 743) and cs.wikipedia: 13.60 m over
the buffers, a 12.30 m main frame, 3.13 m wide over the handrails, 4.472 m
high, 6.70 m between the pivots, 2.40 m bogie wheelbase, 1.00 m wheels. The
740 (T 448.0) and 743 (T 466.3) share the length and running gear.

## Coordinates and profiles

`colorize` maps the sides to 14 x 5 m and the ends to 3 x 5 m: 0.1 m a pixel.
The model follows viamont_742.507: side column px -> x = 6.7 - px / 10 (the
source's x flipped, so the cab and the short hood are at +X; the source's +z
side, z_dec, becomes the model's -Z side), and the heights above the 1.8 m
deck scaled so the 4.6 m native cab roof stands at 4.40 m: native y = 1.8 +
(y - 1.8) / 0.9286, row r -> native y = 5 - r / 10. End column u -> z = 1.5 -
u / 10 seen from ahead. The 743's paint heights are mapped from its own
1.6..4.3 m onto the same body.

- **Frame** (base): 3.0 m wide, 1.2..1.8 m, over 0.3..13.1 m.
- **Hoods** (box): 2.0 m wide, 1.8..4.6 m (native), rounded to 1.8 m at the
  top, over 0.4..13.0 m either side of the cab.
- **Cab** (cab): 3.0 m wide to 3.05 m, leaning to 2.7 m at 4.3 m and rounded
  to 1.8 m at 4.6 m, over 2.0..4.4 m.
- **Fuel tank** (under): 5.4..8.0 m, 0.4..1.2 m.

## Running numbers

The vlakosimdb models' names, check digits by the 1988 scheme: 742 507-7,
740 627-5, 743 002-8.

## Deviations

- The published 6.70 m pivots against the native 7.0 m.
- The large "Viamont" lettering of the native sides is not drawn; the black
  bands are.
- The 743's second diagonal stripe, cut by its cab in the native texture, is
  left out.
