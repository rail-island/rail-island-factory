# MUV 69 source references

**Covers** - provenance of the MUV 69 track motor car's native files, its dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/muv69.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/muv/muv_69/`,
"MUV 69" by PaV, unchanged: `native/vehicle.xml` (5 t, 5 kW, 15 km/h),
`native/index.xml`, `x_dec.bmp`, `x_inc.bmp` (30 x 50), `y_dec.bmp`,
`z_dec.bmp` and `z_inc.bmp` (62 x 50). No `image.bmp` exists.

## Dimensions

From cs.wikipedia (MUV 69): 6.76 m over the couplers, 7.4 to 9 t. Heights
from the photographs: the deck at about 1.05 m, the cab roof at about 2.95 m.

## Coordinates and profiles

The native model is coarse: a deck 0.1..6.0 m long at 0.8 m and a cab only
2.4 m high. `colorize` maps the sides to 6 x 5 m (62 px: 0.0968 m a pixel
along x, 0.1 m vertically) and the ends to 3 x 5 m.

- Lengths follow the native: column px -> source x = 6 px / 62, model x =
  3.05 - source x (flipped, so the cab is at +X and the source's +z side,
  z_dec, is the model's -Z side).
- Heights follow the photographs: native y = 0.8 + (y - 1.05) / 1.1875 above
  the deck and 0.8 y / 1.05 below it; row r -> native y = 5 - r / 10.
- **Cab** (base clip): 0.1..2.5 m, its front raked 0.3 m back from 1.6 m
  (native) to the roof; 2.8 m wide in the model (the native 3.0 m).
- **Paint**: red to 1.6 m (native), cream above; the windows 1.7..2.3 m; the
  olive line along the black frame.
- **Wheels**: under columns 15 and 53.5 (3.73 m apart); about 0.5 m in the
  native, 0.56 m in the model (photographs).

## Running number

The MUV 69 is a track machine with its own numbering (MUV 69.x-nnn), not a
traction unit of the 1988 scheme; the model carries no number.

## Deviations

- Not modelled: the crane many cars carry, loads on the deck.
