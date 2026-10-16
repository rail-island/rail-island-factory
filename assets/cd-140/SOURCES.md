# CD 140 040 source references

**Covers** - provenance of the Skoda 12E "bobina" native files, dimensions, the coordinate conversion and reconstruction choices.
**Code** - `generator/cd140.ts`, `generator/czElectricKit.ts`, `generator/czElectricComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/cz-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/electric/cd_140_040/`, model by Vojtech Vohlidka, unchanged:
`native/vehicle.xml` (82 t, 2032 kW, 120 km/h), `native/index.xml` (clip
profiles, baked polygons, texture mappings), `native/x_both.bmp`,
`downx_both.bmp` (the lower front variant), `y_dec.bmp`, `z_both.bmp` and the
local diamond pantograph component `native/pant2/`.

`cd_140`, `cd_141` and `cd_141_017` are archived in the game and were left out
on request, so the design has a single livery and no parameter. No `_4x` or
other enhanced texture was used or shipped.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 140) and cs.wikipedia:

- 15.74 m over the buffers (the series the 040 belongs to; 15.60 to 16.40 m
  across the batches), a 14.50 m body, 2.95 m wide;
- 8.17 m between the pivots, 3.33 m bogie wheelbase (total 11.50 m), 1.25 m
  wheels; 4.50 m high with the collectors down;
- six round windows a side, a cab door on each side, two diamond pantographs
  with the resistor box between them on the roof.

## Coordinates and profiles

The vlakosimdb body is 16.1 m long (11 % too long); its x is scaled by
14.50 / 16.10 = 0.9006: side column px -> x = (85.5 - px) * 0.09006 m (the
source's x flipped, so its raised pantograph is at -X), row r -> y = 6.0 - r / 10.

- **Section** (alongx): 2.95 m wide to 3.5 m, the roof curving through
  (1.4, 3.75), (1.3, 3.8), (1.0, 3.85) to the crown at 3.9 m.
- **Elevation** (alongz): the end vertical to 2.3 m, raked 0.09 m back by 3.5 m,
  then 0.18, 0.27 and 0.54 m back at 3.7, 3.8 and 3.9 m (all scaled).
- **Plan** (alongy): the bowed nose, 0.09, 0.18 and 0.36 m back at |z| = 0.9,
  1.3 and 1.5 m.
- **Roof** (roof clips): the resistor box 3.8 to 4.1 m and +-1.0 m over most of
  the roof, its slatted upper part 4.1 to 4.2 m (+-0.8 m) between the
  pantographs, which stand at +-3.8 m on it.
- **Paint** (`z_both`, `x_both` rows): dark blue to 2.2 m, white, salmon and pale
  blue lines, the light blue band 2.5 to 3.5 m with two dark blue stripes, dark
  blue above; the white V "whiskers" with a pale blue edge on the noses.

## Running number

140 040-7: the vlakosimdb model's name; the check digit by the 1988 scheme.
