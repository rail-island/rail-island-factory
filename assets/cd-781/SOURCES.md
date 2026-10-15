# CD 781 source references

**Covers** - provenance of the M62 / T 679.1 / CD 781's native files and photographs, dimensions, coordinate conversion and reconstruction choices.
**Code** - `generator/cd781.ts`, `generator/dieselParts.ts`, `generator/dieselComparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

## Original evidence

`janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/diesel/`, both models by Vojtech Vohlidka:

- `native/`: `cd_781` (livery `cd781`, the default): `vehicle.xml` (116 t,
  1470 kW, 100 km/h), `index.xml` and the native `x_both`, `z_both`, `y_dec` BMPs.
- `native/liveries/cd_781_462/`: `cd_781_462` (livery `cd781No462`), its BMPs,
  `vehicle.xml` and `index.xml` (the same body; its roof's raised section spans
  source x 6.9 .. 11.8 instead of 6.1 .. 9.6).

`csd_t_679` (Borek Hudak) is **not** this class: its textures show the T 679.0
"Pomeranc" (CD 776), modelled as `veh-csd-t679-0` (`assets/csd-t679/`).
No `_4x` or other enhanced texture was used.

## Dimensions

17.55 m over the buffers, 2.95 m wide, 4.493 m high, 8.6 m between the pivots,
1.05 m wheels (de.wikipedia, CSD-Baureihe T 679.1, infobox); 2 x 2.1 m bogie
wheelbase (the M62's three-axle bogie). The XML draws the body 16.6 m long (source
x 0.5 .. 17.1) and its bogies 9.2 m apart; the model keeps the body and uses the
published pivots and wheelbase.

## Coordinates and profiles

Factory X = source x - 8.8. `x_both` (30 x 50) is 3 x 5 m, `z_both`
(180 x 50) 18 x 5 m, 0.1 m a pixel; row r spans 5 - (r + 1) / 10 to 5 - r / 10 m.

- `alongz`: the face upright at source x 0.5 to 2.9 m, the windscreen raked
  back to 0.7 at 3.8 m, the roof rolling to 1.1 at 4.2 and 2.1 at 4.3 m; the
  raised section over the engine at 6.1 .. 9.6, to 4.5 m.
- `alongx`: upright sides to 3.5 m, the roof chamfered toward +-0.7 m at 4.6 m;
  the model rounds it (photographs) and keeps the published 2.95 m width.
- `alongy`: the corners set back 0.2 m.

## Running numbers

| livery | number | source |
|---|---|---|
| `cd781` | 781 529-3 | photographed in red (`photo-781-529-cab-side.jpg`); the native plate does not resolve digits |
| `cd781No462` | 781 462-7 | the vlakosimdb model's name |

## Deviations

- Standard 1.75 m buffer spacing; the BMP draws the buffer frames 2.0 m apart.
- The fuel tank hangs under the frame (0.42 .. 1.0 m); the BMP draws it from the
  frame's top (1.3 m).
- The headlight on the roof's slope is an oval 0.6 by 0.4 m seen from ahead.
- Not modelled: the side's ribbed panels and printed data, the cab's sun visors.
