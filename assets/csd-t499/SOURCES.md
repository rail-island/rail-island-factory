# CSD T 499.0 / CD 759 source references

**Covers** - provenance of the T 499.0 "Kyklop": native files, photographs, dimensions, coordinate conversion and reconstruction choices.
**Code** - `generator/csdT499.ts`, `generator/dieselParts.ts`, `generator/dieselComparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

## Original evidence

`janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/diesel/csd_t499` (Vojtech Vohlidka): `native/vehicle.xml`
(76 t, 3000 kW, 140 km/h), `native/index.xml`, `x_both.bmp`, `z_both.bmp`,
`y_dec.bmp`. No enhanced texture exists or was used.

The class: two Bo'Bo' express prototypes by CKD, 1974, T 499.0001 and 0002,
later CD 759 001 and 002; the nickname "Kyklop" comes from the big headlight in
the middle of each face (de.wikipedia, CSD-Baureihe T 499.0). The textures show
the yellow and blue of T 499.0002 as restored (the photographs).

## Dimensions

17.84 m over the buffers, 3.09 m wide, 4.646 m high, 10.0 m between the pivots,
2.6 m bogie wheelbase, 1.0 m wheels (de.wikipedia, infobox). The XML draws the
pivots 10.05 m apart and the body 16.5 m long (source x 0.5 .. 17.0); the model
keeps the body and the published running gear.

## Coordinates and profiles

Factory X = source x - 8.75. `x_both` (30 x 50) is 3 x 5 m, `z_both` (180 x 50)
18 x 5 m, 0.1 m a pixel; row r spans 5 - (r + 1) / 10 to 5 - r / 10 m.

- `alongz` (base): the face at source x 0.5 at 2.0 m, raked back to 0.8 at
  4.1 m and tucked in to 0.6 at 1.5 m; the frame 1.0 .. 1.5 m; the skirt under
  each end; the roof clip raises the machine room's roof to 4.3 m between
  source x 2.6 and 14.9.
- `alongx`: upright sides to 3.4 m, the cab roof rounding to 4.1 m (the machine
  room's to 4.3 m).
- The face's corners curve back 0.15 m (photographs; no plan clip).

## Running number

T 499.0002 (photographed in this livery); CD 759 002-9 from 1988.

## Deviations

- Standard 1.75 m buffer spacing (the BMP agrees within a pixel).
- The yellow louvred bays' leaning edges are painted on the flat side.
- Not modelled: the side's red emblem disc and data panels.
