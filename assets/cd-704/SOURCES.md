# CD 704 / CSD T 234.0 source references

**Covers** - provenance of the CKD two-axle shunter's native files, its dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/cd704.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, unchanged:

- `db/train/loco/diesel/cd_704/` (in `native/cd_704/`), "CD 704" by Vojtech
  Vohlidka: `vehicle.xml` (28 t, 250 kW, 60 km/h), `index.xml` (clip profiles,
  texture mappings), `x_both.bmp` (28 x 40), `y_dec.bmp`, `z_both.bmp` (80 x 40)
  and `image.bmp`.
- `db/train/loco/diesel/csd_t238_0/` (in `native/csd_t238_0/`), "CSD T238.0" by
  the same author: `vehicle.xml` and `index.xml` only -- its four BMPs are
  byte-identical to cd_704's, and its XML is an earlier, coarser cut of the
  same body (the base and cab clips without the side panels). It is the
  industrial version of the class (T 238.0, later 704.5), so the design covers
  it as the `t2380` livery: the same body and paint, another running number.

`cd_704 red` is archived in the game and was left out. No `_4x` or other
enhanced texture was used or shipped.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 704) and cs.wikipedia (Lokomotiva 704):

- 7.50 m over the buffers (series; 7.30 m the prototypes, 7.54 m the 704.5),
  a 6.20 m frame (6.50 m with the buffer beams), 3.124 m wide over the
  handrails, 3.66 m high;
- 3.20 m wheelbase (3.00 m the prototypes), 1.00 m wheels.

## Coordinates and profiles

`colorize` maps `z_both` to 8 x 4 m and `x_both` to 2.8 x 4 m: 0.1 m a pixel.
Side column px -> x = px / 10 - 3.75 (the source's x, centred on the 7.5 m
over the buffers; the cab and the short hood at +X), row r -> y = 4 - r / 10;
end column u -> z = 1.4 - u / 10 seen from ahead.

- **Frame and deck** (alongx base): 2.8 m wide to 1.3 m.
- **Hood** (alongx base, alongz base): 2.0 m wide, 1.3..2.6 m, over the whole
  0.5..7.0 m frame (the model rolls its top edges 0.1 m).
- **Cab** (cab clips): 2.8 m wide, 3.9..5.8 m, to 3.3 m; the roof flares to
  3.6..6.1 m and falls to 2.0 m across at 3.6 m.
- **Paint** (`z_both`, `x_both`): dark blue, a yellow band 1.6..2.2 m, the
  grey frame with a yellow stripe at the beam's foot; white over red lamps at
  the hood ends.

## Running numbers

- `cd704`: 704 014-0, illustrative (photographed in 2025, PHOTOS.md); the
  native plates do not resolve digits.
- `t2380`: 704 518-0, a T 238.0 renumbered into the 704.5 series (Commons
  category "CZ 704 518 - 0").

Both check digits by the 1988 scheme.

## Deviations

- The native wheels stand 3.4 m apart; the model uses the published 3.20 m.
- Louvred doors on the hood sides and the hood-end grille follow the
  photographs; the native texture only hints at them.
