# CD 770 / 771 source references

**Covers** - provenance of the T 669.1 / CD 771 "Cmelak": native files, photographs, dimensions, coordinate conversion and reconstruction choices.
**Code** - `generator/cd771.ts`, `generator/dieselParts.ts`, `generator/dieselComparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

## Original evidence

`janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/diesel/`, all by Borek Hudak:

| `livery` | vlakosimdb model | files here |
|---|---|---|
| `cd771No235` (default) | `cd_771.235` | `native/` (`vehicle.xml`, `index.xml`, BMPs) |
| `cd771` | `cd 771` | `native/liveries/cd_771/` (BMPs, `vehicle.xml`, its own `index.xml`) |
| `cd771No421` | `cd_771.421` | `native/liveries/cd_771.421/` (BMPs, `vehicle.xml`; its `index.xml` is `cd_771.235`'s but for the model name) |

The default is `cd_771.235`, the model whose geometry the design follows. `cd 771`
is drawn on its own 17.6 x 4.7 m canvas with the cab at the other end (the BMP's
right) and a lower walkway (1.4 m); the design paints its colours on the common
body. No `_4x` or other enhanced texture was used.

## Dimensions

17.24 m over the buffers, 3.15 m over the walkways (the model: 3.1 m), 4.637 m
high, 8.66 m between the pivots, 4.0 m bogie wheelbase (2 x 2.0), 1.05 m wheels
(de.wikipedia, CSD-Baureihe T 669.0, infobox; the T 669.1 / 771 shares them).

## Coordinates and profiles

The `cd_771.235` drawing is 17.6 m over the buffers (XML `n` clips 0 .. 0.4 and
17.2 .. 17.6) on an 18 x 6 m canvas (`z_both` 180 x 60 px, `x_both` 30 x 60):
0.1 m a pixel, row r spans 6 - (r + 1) / 10 to 6 - r / 10 m. The model scales it
along x by K = 0.98 to the published length and puts the short hood toward +X:
Factory X = (8.8 - source x) * 0.98.

- `alongx`: the hoods 2.0 m wide from the walkway (1.7 m) to 3.8 m, their roofs
  chamfered to +-0.6 m at 4.4 m; the cab 3.0 m wide to 3.9 m, its roof rolling
  to 4.6 m; the walkway and frame 1.2 .. 1.7 m, 3.0 m wide.
- `alongz`: the short hood source x 1.0 .. 3.1, the cab 3.1 .. 5.2 (its roof
  3.0 .. 5.3), the long hood 5.2 .. 16.6; the hoods' roofs run out over the ends
  to 0.7 and 16.9 m between 4.1 and 4.4 m; the fuel tank 7.7 .. 9.9 at
  0.3 .. 1.2 m; the end plates 0.4 .. 1.7 m; steps at the ends every 0.4 m; the
  walkway rails at 2.2 and 2.7 m.

## Running numbers

| livery | number | source |
|---|---|---|
| `cd771No235` | 771 235-9 | the vlakosimdb model's name |
| `cd771` | 771 099-9 | a unit photographed in green (`photo-771-099-three-quarter.jpg`); the native plate does not resolve digits |
| `cd771No421` | 771 421-5 | the vlakosimdb model's name |

## Deviations

- The scale K above (published length) and the published pivots and wheelbase
  (the XML draws the pivots 8.7 m apart).
- Standard 1.75 m buffer spacing and 1.0 m height.
- The hoods' louvred doors are flat decals on the side; the end's radiator is a
  grille block over the hood's face.
